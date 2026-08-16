import { spawnSync } from 'node:child_process'
import { extractFrames, probeMedia, type MediaProbe } from './ffmpeg.ts'
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
  /** Sampled frames near white (YAVG > 240) — overexposure sanity signal. */
  whiteFrameCount: number
  audioLoudness?: { meanLu: number; peakLu: number }
  note?: string
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
  const fps = probe.streams.find(stream => stream.type === 'video' && typeof stream.fps === 'number')
  const frameRate = (fps?.fps as number | undefined) ?? 24
  const frameSec = 1 / frameRate

  const cutFrames: number[] = [0]
  for (let index = 1; index < yavg.length; index += 1) {
    const delta = Math.abs(yavg[index] - yavg[index - 1])
    if (delta > cutThreshold && (index - (cutFrames[cutFrames.length - 1] ?? 0)) * frameSec >= minShotSec) {
      cutFrames.push(index)
    }
  }
  cutFrames.push(yavg.length)

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
    whiteFrameCount: yavg.filter(value => value > 240).length,
    ...(audioLoudness !== undefined ? { audioLoudness } : {}),
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
