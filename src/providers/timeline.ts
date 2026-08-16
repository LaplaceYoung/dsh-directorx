import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
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
  /** Optional playback speed for this scene (0.5-8x) — speed-ramp building block. */
  speed?: number
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
          ...(scene.speed !== undefined && scene.speed > 0 ? { speed: Math.min(8, Math.max(0.5, scene.speed)) } : {}),
          ...(spec.scale !== undefined && spec.scale !== '' ? { scale: spec.scale } : {}),
        })
        tempFiles.push(segment.path)
        segmentPaths.push(segment.path)
        steps.push(`trim scene ${index + 1}${scene.speed !== undefined && scene.speed > 0 ? ` (speed ${scene.speed}x)` : ''}: ${scene.source} [${scene.trim[0]},${scene.trim[1]}] -> ${segment.path}`)
      } else if (scene.speed !== undefined && scene.speed > 0 && Math.abs(scene.speed - 1) > 0.01) {
        const segment = await videoProcess({
          source: scene.source,
          outputDir,
          speed: Math.min(8, Math.max(0.5, scene.speed)),
          ...(spec.scale !== undefined && spec.scale !== '' ? { scale: spec.scale } : {}),
        })
        tempFiles.push(segment.path)
        segmentPaths.push(segment.path)
        steps.push(`scene ${index + 1} speed ${scene.speed}x: ${scene.source} -> ${segment.path}`)
      } else {
        segmentPaths.push(scene.source)
        steps.push(`scene ${index + 1} untrimmed: ${scene.source}`)
      }
    }

    // 2. Concat (fade by default; per-scene hard cuts honored globally when all are cut).
    // A single segment skips the concat stage entirely.
    const allCut = spec.scenes.every(scene => scene.transition === 'cut')
    let assembled: VideoOutput
    if (segmentPaths.length === 1) {
      const single = await videoProcess({ source: segmentPaths[0], outputDir, ...(spec.scale !== undefined && spec.scale !== '' ? { scale: spec.scale } : {}) })
      assembled = { path: single.path, mimeType: 'video/mp4', probe: single.probe }
      tempFiles.push(single.path)
      steps.push(`single scene (no concat): ${segmentPaths[0]} -> ${single.path}`)
    } else {
      assembled = await videoConcat({
        files: segmentPaths,
        outputDir,
        transition: allCut ? 'cut' : 'fade',
        fadeSec: 0.5,
        ...(spec.scale !== undefined && spec.scale !== '' ? { scale: spec.scale } : {}),
      })
      tempFiles.push(assembled.path)
      steps.push(`concat (${allCut ? 'cut' : 'fade'}): ${segmentPaths.length} scenes -> ${assembled.path}`)
    }

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

export interface AudioSyncInput {
  /** Base video the narration rides on. */
  video: string
  /** Narration audio (e.g. directorx_generate_audio output). */
  narration: string
  bgm?: string
  srt?: string
  outputDir: string
}

export interface SpeechInterval {
  start: number
  end: number
}

export interface AudioSyncOutput {
  path: string
  mimeType: 'video/mp4'
  /** Speech intervals detected in the narration — timing anchors for cut alignment. */
  speechIntervals: SpeechInterval[]
  steps: string[]
  probe: VideoOutput['probe']
}

/**
 * Audio-picture sync (音画同出): detect narration speech boundaries via
 * silencedetect, mix narration + optional BGM onto the video with ducking,
 * and mux subtitles. The speech intervals give the agent exact timing
 * anchors to align scene cuts with the narration.
 */
export async function audioSync(input: AudioSyncInput): Promise<AudioSyncOutput> {
  const steps: string[] = []

  // 1. Speech interval detection (silence -> speech boundaries).
  const detect = spawnSync('ffmpeg', [
    '-hide_banner', '-i', input.narration,
    '-af', 'silencedetect=noise=-35dB:d=0.25',
    '-vn', '-f', 'null', '-',
  ], { encoding: 'utf8' })
  const stderr = detect.stderr ?? ''
  const boundaries: Array<{ kind: 'start' | 'end'; t: number }> = []
  for (const line of stderr.split('\n')) {
    const startMatch = line.match(/silence_start: *([\d.]+)/)
    const endMatch = line.match(/silence_end: *([\d.]+)/)
    if (startMatch !== null) boundaries.push({ kind: 'end', t: Number(startMatch[1]) })
    if (endMatch !== null) boundaries.push({ kind: 'start', t: Number(endMatch[1]) })
  }
  boundaries.sort((a, b) => a.t - b.t)
  const speechIntervals: SpeechInterval[] = []
  let open: number | undefined
  for (const boundary of boundaries) {
    if (boundary.kind === 'start' && open === undefined) open = boundary.t
    if (boundary.kind === 'end' && open !== undefined) {
      speechIntervals.push({ start: Number(open.toFixed(2)), end: Number(boundary.t.toFixed(2)) })
      open = undefined
    }
  }
  steps.push(`speech intervals: ${speechIntervals.map(interval => `[${interval.start},${interval.end}]`).join(' ') || 'none detected (continuous narration)'}`)

  // 2. Mix narration + optional BGM with ducking under the narration.
  const tracks: Array<{ path: string; volume?: number }> = [{ path: input.narration, volume: 1 }]
  if (input.bgm !== undefined && input.bgm !== '') tracks.push({ path: input.bgm, volume: 0.12 })
  let mixed = await audioMix({
    video: input.video,
    outputDir: input.outputDir,
    tracks,
    duckUnder: 0,
  })
  steps.push(`mix: narration + ${tracks.length - 1} bgm tracks (duck under narration) -> ${mixed.path}`)

  // 3. Subtitle mux.
  if (input.srt !== undefined && input.srt !== '') {
    mixed = await videoSubtitle({ video: mixed.path, srt: input.srt, mode: 'soft', outputDir: input.outputDir })
    steps.push(`subtitle mux: ${input.srt} -> ${mixed.path}`)
  }

  return { path: mixed.path, mimeType: 'video/mp4', speechIntervals, steps, probe: mixed.probe }
}

export interface SrtCue {
  index: number
  start: number
  end: number
  text: string
}

/** Minimal SRT parser (the shape produced by directorx_transcribe_audio). */
export function parseSrt(content: string): SrtCue[] {
  const cues: SrtCue[] = []
  const blocks = content.replace(/\r\n/g, '\n').split(/\n\n+/)
  for (const block of blocks) {
    const lines = block.trim().split('\n')
    if (lines.length < 2) continue
    const timeMatch = lines[1]?.match(/([\d:,]+)\s*-->\s*([\d:,]+)/)
    if (timeMatch === null || timeMatch === undefined) continue
    const start = toSeconds(timeMatch[1])
    const end = toSeconds(timeMatch[2])
    const text = lines.slice(2).join(' ').trim()
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue
    cues.push({ index: Number(lines[0]) || cues.length + 1, start, end, text })
  }
  return cues
}

function toSeconds(timestamp: string): number {
  // SRT uses a comma as the millisecond separator: normalize first.
  const normalized = timestamp.replace(',', '.')
  const parts = normalized.split(':').map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return Number(normalized)
}

export interface SubtitleCutInput {
  video: string
  srt: string
  outputDir: string
  /** Only cut cues whose text contains this keyword (按口播文本定位). */
  include?: string
  /** Padding seconds kept around each cue window (default 0.15). */
  pad?: number
  /** Keep one continuous segment when cues overlap (default true). */
  mergeOverlap?: boolean
}

export interface SubtitleCutOutput {
  path: string
  mimeType: 'video/mp4'
  cues: Array<{ start: number; end: number; text: string }>
  steps: string[]
  probe: VideoOutput['probe']
}

/** Cut a video at subtitle cue boundaries (FunClip-style 按文本打点剪辑). */
export async function subtitleCut(input: SubtitleCutInput): Promise<SubtitleCutOutput> {
  const content = readFileSync(input.srt, 'utf8')
  const pad = input.pad ?? 0.15
  let cues = parseSrt(content)
  if (input.include !== undefined && input.include !== '') {
    cues = cues.filter(cue => cue.text.includes(input.include ?? ''))
  }
  if (cues.length === 0) throw new Error('srt 中没有匹配的字幕条目')
  // Windows with padding, merged when overlapping.
  let windows = cues.map(cue => ({ start: Math.max(0, cue.start - pad), end: cue.end + pad }))
  if (input.mergeOverlap !== false) {
    windows = windows.reduce<Array<{ start: number; end: number }>>((merged, window) => {
      const last = merged[merged.length - 1]
      if (last !== undefined && window.start <= last.end) last.end = Math.max(last.end, window.end)
      else merged.push({ ...window })
      return merged
    }, [])
  }
  const rendered = await renderTimeline({
    scenes: windows.map(window => ({ source: input.video, trim: [window.start, window.end], transition: 'cut' })),
  }, input.outputDir)
  return {
    path: rendered.path,
    mimeType: 'video/mp4',
    cues: cues.map(cue => ({ start: cue.start, end: cue.end, text: cue.text })),
    steps: rendered.steps,
    probe: rendered.probe,
  }
}

export interface SmartCutInput {
  video: string
  srt: string
  /** 口播稿/脚本：按句拆分的句子列表，或全文（按标点拆句）。 */
  script: string[]
  outputDir: string
  pad?: number
  targetSeconds?: number
}

export interface SmartCutOutput {
  path: string
  mimeType: 'video/mp4'
  /** 每句脚本匹配到的字幕窗口（时间锚点）。 */
  matched: Array<{ script: string; cue: SrtCue | null; start: number; end: number }>
  steps: string[]
  probe: VideoOutput['probe']
}

function splitSentences(text: string): string[] {
  return text.split(/[。！？；\n]+/).map(sentence => sentence.trim()).filter(sentence => sentence.length >= 4)
}

function overlap(a: string, b: string): number {
  let score = 0
  for (const char of a) if (b.includes(char)) score += 1
  return score / Math.max(1, a.length)
}

/**
 * LLM 精剪（deterministic matcher）: the agent writes the narration
 * script, this tool locates each sentence's best-matching subtitle cue
 * in the source and assembles the selected windows into a finished cut.
 */
export async function smartCut(input: SmartCutInput): Promise<SmartCutOutput> {
  const cues = parseSrt(readFileSync(input.srt, 'utf8'))
  const script = input.script.length > 0 && !input.script[0].includes('。') && input.script.length > 1
    ? input.script
    : splitSentences((input.script[0] ?? '').length > 0 ? input.script[0] : input.script.join(' '))
  const pad = input.pad ?? 0.15
  const matched: SmartCutOutput['matched'] = []
  const windows: Array<{ start: number; end: number }> = []
  for (const sentence of script) {
    let best: SrtCue | null = null
    let bestScore = 0
    for (const cue of cues) {
      const score = overlap(sentence, cue.text)
      if (score > bestScore) { bestScore = score; best = cue }
    }
    if (best === null) { matched.push({ script: sentence, cue: null, start: 0, end: 0 }); continue }
    const start = Math.max(0, best.start - pad)
    const end = best.end + pad
    windows.push({ start, end })
    matched.push({ script: sentence, cue: best, start, end })
  }
  if (windows.length === 0) throw new Error('脚本与字幕没有可匹配的条目（换更接近原话的脚本，或先 transcribe 得到字幕）')
  const rendered = await renderTimeline({
    scenes: windows.map(window => ({ source: input.video, trim: [window.start, window.end], transition: 'cut' })),
  }, input.outputDir)
  return { path: rendered.path, mimeType: 'video/mp4', matched, steps: rendered.steps, probe: rendered.probe }
}

export interface ClipRankInput {
  srt: string
  /** 脚本句（或关键词组）——按这些语义检索候选片段。 */
  script: string[]
  topN?: number
}

export interface ClipRankOutput {
  ranked: Array<{ cue: SrtCue; score: number; matchedBy: string }>
}

function charOverlap(a: string, b: string): number {
  let score = 0
  for (const char of a) if (b.includes(char)) score += 1
  return score / Math.max(1, a.length)
}

/**
 * Candidate clip ranking (ESA pipeline's scoring step): score every
 * subtitle cue against the script semantics and return the ranked list
 * for the agent to assemble. 素材定位的检索面。
 */
export async function clipRank(input: ClipRankInput): Promise<ClipRankOutput> {
  const cues = parseSrt(readFileSync(input.srt, 'utf8'))
  const script = input.script.filter(sentence => sentence.trim() !== '')
  const ranked = cues
    .map(cue => {
      let best = 0
      let matchedBy = ''
      for (const sentence of script) {
        const score = charOverlap(sentence, cue.text)
        if (score > best) { best = score; matchedBy = sentence }
      }
      return { cue, score: Number(best.toFixed(3)), matchedBy }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, input.topN ?? 10)
  return { ranked }
}
