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
    ...(audioLoudness !== undefined ? { audioLoudness } : {}),
    ...(visionAvailable ? {} : { note: 'vision 未配置：分镜描述为 null（帧路径可用），配置 DirectorX vision 后以 describe=true 重跑可获得逐镜描述。' }),
  }
}
