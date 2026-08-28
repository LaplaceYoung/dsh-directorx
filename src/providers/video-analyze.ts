import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { extractFrames, probeMedia, type MediaProbe } from './ffmpeg.ts'
import { parseSrt } from './timeline.ts'
import { runVision } from './vision.ts'
import type { CapabilitySettings, DirectorxSettings } from '../config.ts'

/**
 * Comprehensive deterministic video analysis (拉片): scene-cut detection
 * via per-frame signalstats luminance deltas, per-shot representative
 * frames, optional vision descriptions, and an audio loudness summary.
 */

export interface VideoAnalyzeInput {
  source: string
  outputDir: string
  settings: DirectorxSettings
  vision: CapabilitySettings
  cutThreshold?: number
  minShotSec?: number
  describe?: boolean
  srtPath?: string
  highlightWindowSec?: number
}

export interface ShotSegment {
  index: number
  start: number
  end: number
  durationSec: number
  framePath?: string
  description: string | null
}

export interface VideoAnalyzeOutput {
  source: string
  probe: MediaProbe
  fps: number
  shots: ShotSegment[]
  /** Sampled frames near black (YAVG < 16) — bad-frame sanity signal. */
  blackFrameCount: number
  /** 闪烁事件：亮度符号交替（相邻差分异号且两侧均超阈值）——AI 视频常见伪影。 */
  flickerCount: number
  /** 锐度代理：sobel 边缘能量均值（<15 疑似模糊，本地校准：锐 22 / 重模糊 14）。 */
  edgeSharpness: number
  /** 冻结事件：freezedetect 检出画面静止段数（AI 视频卡帧伪影）。 */
  freezeCount: number
  /** 冻结总秒数（分级门用）。 */
  freezeSeconds: number
  /** 跳变帧数：非切点亮度尖峰（>2×中位差）——形态突变/模型跳帧。 */
  jumpCount: number
  /** Sampled frames near white (YAVG > 240) — overexposure sanity signal. */
  whiteFrameCount: number
  /** blackdetect 黑场区间（d=0.25, pix=0.10 参数口径）。 */
  blackSegments?: Array<{ start: number; end: number; durationSec: number }>
  /** volumedetect 的 mean/peak dBFS。 */
  volumeDbfs?: { mean: number; peak: number }
  audioLoudness?: { meanLu: number; peakLu: number }
  audioHighlights?: AudioHighlightAnalysis
  note?: string
}

export interface AudioHighlightSegment {
  start: number
  end: number
  rmsDb: number
  peakDb: number
  speechRate: number
  isSilence: boolean
}

export interface AudioHighlightAnalysis {
  segments: AudioHighlightSegment[]
  duration: number
}

/**
 * 用 ffmpeg ebur128 的短窗响度生成音频高光窗口；不引入浏览器 AudioBuffer
 * 或 WASM。字幕词速只统计词起点落入当前窗口的 cue。
 */
export function analyzeAudioForHighlights(source: string, srtPath?: string, segmentDuration = 5): AudioHighlightAnalysis {
  const duration = Math.max(0, probeMedia(source).durationSec)
  const window = Number.isFinite(segmentDuration) && segmentDuration > 0 ? segmentDuration : 5
  const samples: Array<{ time: number; db: number; peak: number }> = []
  const result = spawnSync('ffmpeg', ['-hide_banner', '-i', source, '-af', 'ebur128=peak=true', '-vn', '-f', 'null', '-'], { encoding: 'utf8' })
  let currentTime: number | undefined
  for (const line of (result.stderr ?? '').split('\n')) {
    const time = line.match(/t:\s*([\d.]+)/)
    if (time !== null) currentTime = Number(time[1])
    const loudness = line.match(/M:\s*(-?[\d.]+)/)
    if (loudness !== null && currentTime !== undefined) {
      const peakMatch = line.match(/(?:Peak|S):\s*(-?[\d.]+)/)
      samples.push({ time: currentTime, db: Number(loudness[1]), peak: peakMatch === null ? Number(loudness[1]) : Number(peakMatch[1]) })
    }
  }
  const transcript = srtPath === undefined || srtPath === '' ? [] : parseSrt(readFileSync(srtPath, 'utf8')).flatMap(cue => cue.text.split(/\s+/).filter(Boolean).map(text => ({ text, start: cue.start, end: cue.end })))
  const segments: AudioHighlightSegment[] = []
  for (let start = 0; start < duration || (duration === 0 && start === 0); start += window) {
    const end = Math.min(duration, start + window)
    const inWindow = samples.filter(sample => sample.time >= start && sample.time < end)
    const rmsDb = inWindow.length > 0 ? Number((inWindow.reduce((sum, sample) => sum + sample.db, 0) / inWindow.length).toFixed(1)) : -120
    const peakDb = inWindow.length > 0 ? Number(Math.max(...inWindow.map(sample => sample.peak)).toFixed(1)) : -120
    const words = transcript.filter(word => word.start >= start && word.start < end).length
    segments.push({ start: Number(start.toFixed(3)), end: Number(end.toFixed(3)), rmsDb, peakDb, speechRate: Number((words / Math.max(0.001, end - start)).toFixed(3)), isSilence: peakDb <= -60 })
    if (duration === 0) break
  }
  return { segments, duration }
}

export async function videoAnalyze(input: VideoAnalyzeInput): Promise<VideoAnalyzeOutput> {
  const probe = probeMedia(input.source)
  const cutThreshold = input.cutThreshold ?? 12
  const minShotSec = input.minShotSec ?? 0.4

  // Per-frame luminance via signalstats metadata.
  const result = spawnSync('ffmpeg', [
    '-hide_banner', '-i', input.source,
    '-vf', 'signalstats,metadata=print:key=lavfi.signalstats.YAVG',
    '-an', '-f', 'null', '-',
  ], { encoding: 'utf8' })
  const yavg: number[] = []
  for (const line of (result.stderr ?? '').split('\n')) {
    const match = line.match(/YAVG=([\d.]+)/)
    if (match !== null) yavg.push(Number(match[1]))
  }
  // 冻结检测：freezedetect 静止段计数（第三趟，d=0.5s 起步）。
  const freezeResult = spawnSync('ffmpeg', [
    '-hide_banner', '-i', input.source,
    '-vf', 'freezedetect=n=-60dB:d=0.5',
    '-an', '-f', 'null', '-',
  ], { encoding: 'utf8' })
  const freezeStderr = freezeResult.stderr ?? ''
  const freezeMatches = freezeStderr.match(/freeze_start/g)
  const freezeCount = freezeMatches !== null ? freezeMatches.length : 0
  const freezeDurations: number[] = []
  for (const match of freezeStderr.matchAll(/freeze_duration: ([\d.]+)/g)) freezeDurations.push(Number(match[1]))
  const freezeSeconds = Number(freezeDurations.reduce((sum, value) => sum + value, 0).toFixed(2))

  // 锐度代理：sobel 边缘能量均值（第二趟扫描，与 YAVG 同成本）。
  const sobelResult = spawnSync('ffmpeg', [
    '-hide_banner', '-i', input.source,
    '-vf', 'sobel,signalstats,metadata=print:key=lavfi.signalstats.YAVG',
    '-an', '-f', 'null', '-',
  ], { encoding: 'utf8' })
  const edgeValues: number[] = []
  for (const line of (sobelResult.stderr ?? '').split('\n')) {
    const match = line.match(/YAVG=([\d.]+)/)
    if (match !== null) edgeValues.push(Number(match[1]))
  }
  const edgeSharpness = edgeValues.length > 0 ? Number((edgeValues.reduce((sum, value) => sum + value, 0) / edgeValues.length).toFixed(1)) : 0

  // 闪烁检测：差分符号交替（|delta|>=4）计事件。
  let flickerCount = 0
  for (let index = 2; index < yavg.length; index += 1) {
    const prev = yavg[index - 1] - yavg[index - 2]
    const current = yavg[index] - yavg[index - 1]
    if (Math.abs(prev) >= 4 && Math.abs(current) >= 4 && prev * current < 0) flickerCount += 1
  }
  const fps = probe.streams.find(stream => stream.type === 'video' && typeof stream.fps === 'number')
  const frameRate = (fps?.fps as number | undefined) ?? 24
  const frameSec = 1 / frameRate

  const deltas: number[] = []
  for (let index = 1; index < yavg.length; index += 1) deltas.push(Math.abs(yavg[index] - yavg[index - 1]))
  const sortedDeltas = [...deltas].sort((a, b) => a - b)
  const medianDelta = sortedDeltas.length > 0 ? sortedDeltas[Math.floor(sortedDeltas.length / 2)] : 0

  const cutFrames: number[] = [0]
  for (let index = 1; index < yavg.length; index += 1) {
    const delta = Math.abs(yavg[index] - yavg[index - 1])
    if (delta > cutThreshold && (index - (cutFrames[cutFrames.length - 1] ?? 0)) * frameSec >= minShotSec) {
      cutFrames.push(index)
    }
  }
  cutFrames.push(yavg.length)

  // 跳变：非切点帧的亮度尖峰（>2× 中位差且 >20）——形态突变/模型跳帧。
  const cutSet = new Set(cutFrames)
  let jumpCount = 0
  for (let index = 1; index < yavg.length; index += 1) {
    const delta = Math.abs(yavg[index] - yavg[index - 1])
    if (!cutSet.has(index) && delta > Math.max(2 * medianDelta, 20)) jumpCount += 1
  }

  const shots: ShotSegment[] = []
  for (let index = 0; index < cutFrames.length - 1; index += 1) {
    const start = cutFrames[index] * frameSec
    const end = cutFrames[index + 1] * frameSec
    shots.push({ index: index + 1, start: Number(start.toFixed(2)), end: Number(end.toFixed(2)), durationSec: Number((end - start).toFixed(2)), description: null })
  }

  // Representative frame per shot (midpoint).
  const midpoints = shots.map(shot => Number(((shot.start + shot.end) / 2).toFixed(3)))
  const extracted = await extractFrames(input.source, input.outputDir, { at: midpoints })
  extracted.forEach((frame, index) => {
    const shot = shots[index]
    if (shot !== undefined && frame.path !== undefined) shot.framePath = frame.path
  })

  // Optional vision descriptions per shot.
  const visionAvailable = input.vision.enabled && input.vision.mode !== 'mock'
  if (input.describe === true && visionAvailable) {
    for (const shot of shots) {
      if (shot.framePath === undefined) continue
      try {
        const described = await runVision({ settings: input.settings, capability: input.vision, signal: AbortSignal.timeout(60_000) }, shot.framePath, '描述这一帧：主体、动作、景别、光线、构图；只描述可见内容。')
        shot.description = described.answer
      } catch {
        shot.description = null
      }
    }
  }

  // 黑场检测（blackdetect 参数口径 d=0.25:pix_th=0.10）。
  const blackDetect = spawnSync('ffmpeg', [
    '-hide_banner', '-i', input.source,
    '-vf', 'blackdetect=d=0.25:pix_th=0.10',
    '-an', '-f', 'null', '-',
  ], { encoding: 'utf8' })
  const blackSegments: Array<{ start: number; end: number; durationSec: number }> = []
  for (const line of (blackDetect.stderr ?? '').split('\n')) {
    const match = line.match(/black_start:([\d.]+).*?black_end:([\d.]+).*?black_duration:([\d.]+)/)
    if (match !== null) {
      blackSegments.push({ start: Number(match[1]), end: Number(match[2]), durationSec: Number(match[3]) })
    }
  }
  // 音量检测（volumedetect mean/peak dBFS 单趟）。
  const volumeDetect = spawnSync('ffmpeg', [
    '-hide_banner', '-i', input.source,
    '-af', 'volumedetect',
    '-vn', '-f', 'null', '-',
  ], { encoding: 'utf8' })
  let volumeDbfs: { mean: number; peak: number } | undefined
  const meanMatch = (volumeDetect.stderr ?? '').match(/mean_volume:\s*(-?[\d.]+)\s*dB/)
  const peakMatch = (volumeDetect.stderr ?? '').match(/max_volume:\s*(-?[\d.]+)\s*dB/)
  if (meanMatch !== null && peakMatch !== null) volumeDbfs = { mean: Number(meanMatch[1]), peak: Number(peakMatch[1]) }

  // Audio loudness summary.
  let audioLoudness: { meanLu: number; peakLu: number } | undefined
  const loud = spawnSync('ffmpeg', [
    '-hide_banner', '-i', input.source,
    '-af', 'ebur128=peak=true',
    '-vn', '-f', 'null', '-',
  ], { encoding: 'utf8' })
  const mValues: number[] = []
  for (const line of (loud.stderr ?? '').split('\n')) {
    const match = line.match(/M:\s*(-?[\d.]+)/)
    if (match !== null && Number(match[1]) > -100) mValues.push(Number(match[1]))
  }
  if (mValues.length > 0) {
    audioLoudness = {
      meanLu: Number((mValues.reduce((sum, value) => sum + value, 0) / mValues.length).toFixed(1)),
      peakLu: Math.max(...mValues),
    }
  }

  return {
    source: input.source,
    probe,
    fps: frameRate,
    shots,
    blackFrameCount: yavg.filter(value => value < 16).length,
    flickerCount,
    edgeSharpness,
    freezeCount,
    freezeSeconds,
    jumpCount,
    whiteFrameCount: yavg.filter(value => value > 240).length,
    ...(blackSegments.length > 0 ? { blackSegments } : {}),
    ...(volumeDbfs !== undefined ? { volumeDbfs } : {}),
    ...(audioLoudness !== undefined ? { audioLoudness } : {}),
    ...(input.highlightWindowSec !== undefined || input.srtPath !== undefined
      ? { audioHighlights: analyzeAudioForHighlights(input.source, input.srtPath, input.highlightWindowSec) }
      : {}),
    ...(visionAvailable ? {} : { note: 'vision 未配置：分镜描述为 null（帧路径可用），配置 DirectorX vision 后以 describe=true 重跑可获得逐镜描述。' }),
  }
}

export interface QaInput {
  source: string
  outputDir: string
  /** Expected brief values; omitted checks are skipped. */
  expect?: {
    targetSeconds?: number
    aspectRatio?: string
    hasAudio?: boolean
    minShots?: number
    maxShots?: number
    /** 节奏密度：多镜头成片时，每镜 ≤ 8s（pattern interrupt 规则）。 */
    rhythm?: boolean
    /** 平均镜头时长区间 [min, max]（ASL 节奏律：动作段 2-3s / 情感段 6-10s）。 */
    asl?: [number, number]
  }
}

export interface QaOutput {
  verdict: 'pass' | 'fix'
  checks: Array<{ name: string; pass: boolean; detail: string }>
}

/**
 * Deterministic final-cut QC gate (成片质检): duration vs target, aspect
 * ratio, audio presence, shot-count sanity and loudness presence — built
 * on videoAnalyze. Frame-level visual QA stays with extract_frames +
 * view_image (frame-qa skill).
 */
export async function qaCheck(input: QaInput, settings: DirectorxSettings, vision: CapabilitySettings): Promise<QaOutput> {
  const analysis = await videoAnalyze({ source: input.source, outputDir: input.outputDir, settings, vision, minShotSec: 0.3 })
  const checks: QaOutput['checks'] = []
  const videoStream = analysis.probe.streams.find(stream => stream.type === 'video')
  const audioStream = analysis.probe.streams.some(stream => stream.type === 'audio')
  const duration = analysis.probe.durationSec

  if (input.expect?.targetSeconds !== undefined) {
    const target = input.expect.targetSeconds
    const ok = Math.abs(duration - target) <= Math.max(1, target * 0.25)
    checks.push({ name: '时长', pass: ok, detail: `实测 ${duration}s / 目标 ${target}s` })
  }
  if (input.expect?.aspectRatio !== undefined) {
    const width = videoStream?.width as number | undefined
    const height = videoStream?.height as number | undefined
    const [tw, th] = String(input.expect.aspectRatio).split(':').map(Number)
    const ok = width !== undefined && height !== undefined && Math.abs(width / height - tw / th) < 0.08
    checks.push({ name: '画幅', pass: ok, detail: `${width}x${height} / 期望 ${input.expect.aspectRatio}` })
  }
  if (input.expect?.hasAudio !== undefined) {
    checks.push({ name: '音轨', pass: audioStream === input.expect.hasAudio, detail: audioStream ? '含音轨' : '无音轨' })
  }
  if (input.expect?.minShots !== undefined || input.expect?.maxShots !== undefined) {
    const count = analysis.shots.length
    const minOk = input.expect.minShots === undefined || count >= input.expect.minShots
    const maxOk = input.expect.maxShots === undefined || count <= input.expect.maxShots
    checks.push({ name: '镜头数', pass: minOk && maxOk, detail: `${count} 镜 / 期望 [${input.expect.minShots ?? '-'}, ${input.expect.maxShots ?? '-'}]` })
  }
  // Black/white frame sanity from the analysis output.
  checks.push({ name: '黑帧', pass: analysis.blackFrameCount === 0, detail: analysis.blackFrameCount > 0 ? `检出 ${analysis.blackFrameCount} 帧近黑（YAVG<16）` : '无近黑帧' })
  checks.push({ name: '白帧', pass: analysis.whiteFrameCount === 0, detail: analysis.whiteFrameCount > 0 ? `检出 ${analysis.whiteFrameCount} 帧过曝（YAVG>240）` : '无过曝帧' })
  checks.push({ name: '闪烁', pass: analysis.flickerCount <= Math.max(3, Math.round((analysis.probe.durationSec ?? 0) * 2)), detail: analysis.flickerCount > 0 ? `检出 ${analysis.flickerCount} 次亮度符号交替（AI 视频常见闪烁伪影）` : '无闪烁' })
  checks.push({ name: '锐度', pass: analysis.edgeSharpness >= 15, detail: analysis.edgeSharpness > 0 ? `边缘能量均值 ${analysis.edgeSharpness}${analysis.edgeSharpness < 15 ? '（疑似整体模糊）' : '（清晰）'}` : '无法测量' })
  checks.push({ name: '冻结', pass: analysis.freezeSeconds <= 1, detail: analysis.freezeCount > 0 ? `检出 ${analysis.freezeCount} 处静止段共 ${analysis.freezeSeconds}s${analysis.freezeSeconds > 1 ? '（>1s，疑似卡帧）' : '（轻微）'}` : '无冻结段' })
  checks.push({ name: '跳变', pass: analysis.jumpCount === 0, detail: analysis.jumpCount > 0 ? `检出 ${analysis.jumpCount} 帧非切点亮度尖峰（形态突变/模型跳帧）` : '无跳变' })
  checks.push({ name: '黑场占比', pass: (analysis.blackSegments ?? []).reduce((sum, segment) => sum + segment.durationSec, 0) <= (analysis.probe.durationSec ?? 0) * 0.02, detail: (analysis.blackSegments ?? []).length > 0 ? `黑场共 ${(analysis.blackSegments ?? []).reduce((sum, segment) => sum + segment.durationSec, 0).toFixed(1)}s` : '无黑场' })
  if (analysis.blackSegments !== undefined && analysis.blackSegments.length > 0) {
    const total = analysis.blackSegments.reduce((sum, segment) => sum + segment.durationSec, 0)
    checks.push({ name: '黑场段', pass: false, detail: `${analysis.blackSegments.length} 段黑场共 ${total.toFixed(2)}s（blackdetect d=0.25）` })
  }
  if (analysis.volumeDbfs !== undefined) {
    const ok = !(analysis.volumeDbfs.mean < -40 && analysis.volumeDbfs.peak < -25)
    checks.push({ name: '音量', pass: ok, detail: `mean ${analysis.volumeDbfs.mean.toFixed(1)}dB, peak ${analysis.volumeDbfs.peak.toFixed(1)}dB（过静音或过低峰值会拦截）` })
  }
  if (input.expect?.asl !== undefined && analysis.shots.length > 1) {
    const mean = analysis.shots.reduce((sum, shot) => sum + shot.durationSec, 0) / analysis.shots.length
    const [min, max] = input.expect.asl
    const ok = mean >= min && mean <= max
    checks.push({ name: '平均镜头时长', pass: ok, detail: `ASL ${mean.toFixed(2)}s / 期望 [${min}, ${max}]s` })
  }
  if (input.expect?.rhythm === true && analysis.shots.length > 1) {
    const longest = Math.max(...analysis.shots.map(shot => shot.durationSec))
    const over = analysis.shots.filter(shot => shot.durationSec > 8).length
    checks.push({ name: '节奏密度', pass: over === 0, detail: `最长镜 ${longest.toFixed(1)}s（${analysis.shots.length} 镜）${over > 0 ? `，${over} 镜超 8s 无变化` : ''}` })
  }
  if (analysis.audioLoudness !== undefined && analysis.audioLoudness.peakLu > -60) {
    checks.push({ name: '响度', pass: true, detail: `均值 ${analysis.audioLoudness.meanLu} LU，峰值 ${analysis.audioLoudness.peakLu} LU` })
  } else if (audioStream) {
    checks.push({ name: '响度', pass: false, detail: '音频近乎静音（峰值 < -60 LU）' })
  }

  return { verdict: checks.every(check => check.pass) ? 'pass' : 'fix', checks }
}
