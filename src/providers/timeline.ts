import { rm } from 'node:fs/promises'
import { audioMix, videoConcat, videoProcess, videoSubtitle } from './video-process.ts'
import type { VideoOutput } from './video-process.ts'

/**
 * Timeline renderer: a timeline.json (OTIO-inspired subset) drives the
 * deterministic assembly pipeline — per-scene trims, cross-fade concat,
 * audio mixing with ducking, and subtitle muxing. This is the editing
 * agent's central data format: plans are timeline JSON, re-cuts are
 * re-renders, and the canvas mirrors the same structure.
 *
 * Schema (subset):
 * {
 *   scenes: [{ source, trim?: [start,end], transition?: 'fade'|'cut' }],
 *   subtitle?: string (srt path),
 *   audio?: [{ path, volume?, duckUnder? }],
 *   fadeIn?: number, fadeOut?: number
 * }
 */

export interface TimelineScene {
  source: string
  trim?: [number, number]
  transition?: 'fade' | 'cut'
}

export interface TimelineSpec {
  scenes: TimelineScene[]
  subtitle?: string
  audio?: Array<{ path: string; volume?: number; duckUnder?: number }>
  fadeIn?: number
  fadeOut?: number
  scale?: string
}

export interface TimelineOutput {
  path: string
  mimeType: 'video/mp4'
  steps: string[]
  probe: VideoOutput['probe']
}

export async function renderTimeline(spec: TimelineSpec, outputDir: string): Promise<TimelineOutput> {
  if (spec.scenes.length === 0) throw new Error('timeline needs at least one scene')
  const steps: string[] = []
  const tempFiles: string[] = []

  try {
    // 1. Per-scene trims (video_process when a trim window is requested).
    const segmentPaths: string[] = []
    for (const [index, scene] of spec.scenes.entries()) {
      if (scene.trim !== undefined) {
        const segment = await videoProcess({
          source: scene.source,
          outputDir,
          start: scene.trim[0],
          end: scene.trim[1],
          ...(spec.scale !== undefined && spec.scale !== '' ? { scale: spec.scale } : {}),
        })
        tempFiles.push(segment.path)
        segmentPaths.push(segment.path)
        steps.push(`trim scene ${index + 1}: ${scene.source} [${scene.trim[0]},${scene.trim[1]}] -> ${segment.path}`)
      } else {
        segmentPaths.push(scene.source)
        steps.push(`scene ${index + 1} untrimmed: ${scene.source}`)
      }
    }

    // 2. Concat (fade by default; per-scene hard cuts honored globally when all are cut).
    const allCut = spec.scenes.every(scene => scene.transition === 'cut')
    let assembled = await videoConcat({
      files: segmentPaths,
      outputDir,
      transition: allCut ? 'cut' : 'fade',
      fadeSec: 0.5,
      ...(spec.scale !== undefined && spec.scale !== '' ? { scale: spec.scale } : {}),
    })
    tempFiles.push(assembled.path)
    steps.push(`concat (${allCut ? 'cut' : 'fade'}): ${segmentPaths.length} scenes -> ${assembled.path}`)

    // 3. Audio mixing (ducking under the narration track when requested).
    if (spec.audio !== undefined && spec.audio.length > 0) {
      const narrationIndex = spec.audio.findIndex(track => track.duckUnder !== undefined && track.duckUnder >= 0)
      assembled = await audioMix({
        video: assembled.path,
        outputDir,
        tracks: spec.audio.map(track => ({ path: track.path, volume: track.volume })),
        duckUnder: narrationIndex >= 0 ? narrationIndex : undefined,
      })
      tempFiles.push(assembled.path)
      steps.push(`audio mix: ${spec.audio.length} tracks${narrationIndex >= 0 ? ` (duck under track ${narrationIndex})` : ''} -> ${assembled.path}`)
    }

    // 4. Subtitle mux (soft track; burn only when the build supports libass).
    if (spec.subtitle !== undefined && spec.subtitle !== '') {
      assembled = await videoSubtitle({ video: assembled.path, srt: spec.subtitle, mode: 'soft', outputDir })
      tempFiles.push(assembled.path)
      steps.push(`subtitle mux: ${spec.subtitle} -> ${assembled.path}`)
    }

    return { path: assembled.path, mimeType: 'video/mp4', steps, probe: assembled.probe }
  } finally {
    // Keep only the final render; intermediate trims/concat stages are
    // disposable (deterministic — re-renderable at any time).
    for (const temp of tempFiles) {
      if (temp !== undefined && temp !== '') rm(temp, { force: true }).catch(() => {})
    }
  }
}
