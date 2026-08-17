import { mkdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { extractFrames, probeMedia } from './ffmpeg.ts'
import { runVision } from './vision.ts'
import type { CapabilitySettings, DirectorxSettings } from '../config.ts'
import { resolveOutputDir } from '../support.ts'

/**
 * Video understanding: sample frames + describe each through the configured
 * vision capability, returning a shot-level narrative. Degrades to
 * deterministic metadata + frame paths when vision is unavailable (the
 * agent can still reason over the frames itself).
 */

export interface VideoUnderstandInput {
  source: string
  outputDir: string
  settings: DirectorxSettings
  vision: CapabilitySettings
  frames?: number
  question?: string
}

export interface VideoUnderstandOutput {
  source: string
  probe: unknown
  frames: Array<{ t: number; path: string; description: string | null }>
  visionMode: string
  note?: string
}

export async function videoUnderstand(input: VideoUnderstandInput): Promise<VideoUnderstandOutput> {
  const probe = probeMedia(input.source)
  const framesDir = resolveOutputDir(input.outputDir)
  await mkdir(framesDir, { recursive: true })
  const count = Math.min(12, Math.max(2, input.frames ?? 6))
  const extracted = await extractFrames(input.source, framesDir, { count })
  const question = input.question ?? '描述这一帧的画面：主体、动作、景别、光线、构图；只描述可见内容。'
  const visionAvailable = input.vision.enabled && input.vision.mode !== 'mock'
  const duration = typeof probe.durationSec === 'number' && probe.durationSec > 0 ? probe.durationSec : count
  const frames = []
  for (let index = 0; index < extracted.length; index += 1) {
    const frame = extracted[index]
    const path = frame?.path ?? ''
    // 与 extractFrames 的中点公式一致（duration*(i+0.5)/count），避免时间戳与帧不符。
    const t = Number(((duration * (index + 0.5)) / Math.max(1, extracted.length)).toFixed(2))
    let description: string | null = null
    if (visionAvailable && path !== '') {
      try {
        const result = await runVision({ settings: input.settings, capability: input.vision, signal: AbortSignal.timeout(60_000) }, path, question)
        description = result.answer
      } catch {
        description = null
      }
    }
    frames.push({ t, path, description })
  }
  return {
    source: input.source,
    probe,
    frames,
    visionMode: input.vision.mode,
    ...(visionAvailable ? {} : { note: 'vision 未配置或不可用：返回帧路径与元数据，agent 可自行判读（或配置 DirectorX vision 后重试）。' }),
  }
}
