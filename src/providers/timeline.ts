import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, readFileSync, statSync, mkdirSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { probeMedia } from './ffmpeg.ts'
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
  /** Reverse playback for this scene. */
  reverse?: boolean
  /** 身份锚图：口型重打/一致性补丁用的定妆参考（供对口型档位消费）。 */
  identityRef?: string
  /** 姿态参考（手势/表情迁移），可空。 */
  poseRef?: string
  transition?: 'fade' | 'cut'
}

/** 机器可读错误码契约：timeline 层的失败都带稳定 code。 */
export class DirectiveError extends Error {
  constructor(public readonly code: 'notFound' | 'overlap' | 'invalidArg' | 'locked' | 'parse' | 'outOfRange', message: string) {
    super(message)
    this.name = 'DirectiveError'
  }
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

/**
 * 场景指纹：源文件（路径+大小+mtime）+ 裁剪/变速/倒放/缩放参数。
 * 指纹相同的场景重渲染时直接复用缓存段——修订 diff 重渲染
 * （改哪层只重渲哪层）的基础。
 */
export function sceneFingerprint(scene: TimelineScene, scale?: string): string {
  const source = scene.source
  let sourceTag = source
  try {
    const info = statSync(source)
    sourceTag = `${source}:${info.size}:${info.mtimeMs}`
  } catch {
    sourceTag = `${source}:missing`
  }
  const parts = [sourceTag, JSON.stringify(scene.trim ?? null), scene.speed ?? 1, scene.reverse === true ? 'rev' : 'fwd', scale ?? '']
  return createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 20)
}

function segmentCachePath(outputDir: string, fingerprint: string): string {
  return join(resolve(process.cwd(), outputDir), '.timeline-cache', `${fingerprint}.mp4`)
}

export async function renderTimeline(spec: TimelineSpec, outputDir: string): Promise<TimelineOutput> {
  if (spec.scenes.length === 0) throw new DirectiveError('invalidArg', 'timeline needs at least one scene')
  // Input guardrails: fail fast with actionable messages before any ffmpeg work.
  for (const [index, scene] of spec.scenes.entries()) {
    if (scene.source === '' || !existsSync(scene.source)) {
      throw new DirectiveError('notFound', `timeline scene ${index + 1}: source not found (${scene.source || '<empty>'})`)
    }
    if (scene.trim !== undefined) {
      const [start, end] = scene.trim
      if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start) {
        throw new DirectiveError('outOfRange', `timeline scene ${index + 1}: trim window [${start},${end}] invalid (0 <= start < end)`)
      }
    }
    if (scene.speed !== undefined && (scene.speed < 0.5 || scene.speed > 8)) {
      throw new DirectiveError('outOfRange', `timeline scene ${index + 1}: speed ${scene.speed}x out of range [0.5, 8]`)
    }
  }
  const steps: string[] = []
  const tempFiles: string[] = []

  try {
    // 1. Per-scene trims (video_process when a trim window is requested).
    // 场景指纹缓存：命中即复用（修订 diff 重渲染：未改场景零成本）。
    const segmentPaths: string[] = []
    for (const [index, scene] of spec.scenes.entries()) {
      const fingerprint = sceneFingerprint(scene, spec.scale)
      const cached = segmentCachePath(outputDir, fingerprint)
      if (existsSync(cached)) {
        segmentPaths.push(cached)
        steps.push(`scene ${index + 1} cache hit (fingerprint ${fingerprint}): ${cached}`)
        continue
      }
      if (scene.trim !== undefined) {
        const segment = await videoProcess({
          source: scene.source,
          outputDir,
          start: scene.trim[0],
          end: scene.trim[1],
          ...(scene.speed !== undefined && scene.speed > 0 ? { speed: Math.min(8, Math.max(0.5, scene.speed)) } : {}),
          ...(scene.reverse === true ? { reverse: true } : {}),
          ...(spec.scale !== undefined && spec.scale !== '' ? { scale: spec.scale } : {}),
        })
        tempFiles.push(segment.path)
        segmentPaths.push(segment.path)
        steps.push(`trim scene ${index + 1}${scene.speed !== undefined && scene.speed > 0 ? ` (speed ${scene.speed}x)` : ''}: ${scene.source} [${scene.trim[0]},${scene.trim[1]}] -> ${segment.path}`)
        try {
          mkdirSync(join(resolve(process.cwd(), outputDir), '.timeline-cache'), { recursive: true })
          copyFileSync(segment.path, cached)
        } catch {
          // cache write failure is non-fatal; the segment is already usable.
        }
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

    // 3.5 Fade in/out on the assembled cut (video+audio fade filters).
    if (spec.fadeIn !== undefined || spec.fadeOut !== undefined) {
      const duration = assembled.probe.durationSec ?? 0
      const fadeFilters: string[] = []
      const audioFade: string[] = []
      if (spec.fadeIn !== undefined && spec.fadeIn > 0) {
        fadeFilters.push(`fade=t=in:st=0:d=${spec.fadeIn}`)
        audioFade.push(`afade=t=in:st=0:d=${spec.fadeIn}`)
      }
      if (spec.fadeOut !== undefined && spec.fadeOut > 0 && duration > spec.fadeOut) {
        fadeFilters.push(`fade=t=out:st=${(duration - spec.fadeOut).toFixed(3)}:d=${spec.fadeOut}`)
        audioFade.push(`afade=t=out:st=${(duration - spec.fadeOut).toFixed(3)}:d=${spec.fadeOut}`)
      }
      if (fadeFilters.length > 0 || audioFade.length > 0) {
        const out = join(resolve(process.cwd(), outputDir), `faded-${Date.now().toString(36)}.mp4`)
        const fargs: string[] = ['-hide_banner', '-y', '-i', assembled.path]
        if (fadeFilters.length > 0) fargs.push('-vf', fadeFilters.join(','))
        if (audioFade.length > 0) fargs.push('-af', audioFade.join(','))
        fargs.push('-c:v', 'libx264', '-preset', 'veryfast', '-c:a', 'aac', out)
        const result = spawnSync('ffmpeg', fargs, { encoding: 'utf8' })
        if (result.status !== 0) throw new Error(`fade failed: ${result.stderr?.slice(-300)}`)
        tempFiles.push(out)
        assembled = { path: out, mimeType: 'video/mp4', probe: probeMedia(out) }
        steps.push(`fade in/out -> ${out}`)
      }
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
  if (cues.length === 0) throw new DirectiveError('parse', 'srt 中没有匹配的字幕条目')
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
  if (windows.length === 0) throw new DirectiveError('parse', '脚本与字幕没有可匹配的条目（换更接近原话的脚本，或先 transcribe 得到字幕）')
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

export interface EditCommand {
  op: 'keep' | 'cut-head' | 'cut-tail' | 'speed' | 'reverse'
  /** Window in seconds for keep/speed; seconds amount for cut-head/cut-tail. */
  from?: number
  to?: number
  seconds?: number
  speed?: number
}

/**
 * 意图驱动剪辑：把自然语言剪辑指令解析成确定性时间轴操作。
 * 支持的操作（中文口语化）：
 *  - 「只保留 X 到 Y 秒」「去掉开头 N 秒」「去掉结尾 N 秒」
 *  - 「X 到 Y 秒变速 Z 倍」「X-Y 秒放慢/加快 Z 倍」
 *  - 「倒放」「整个倒放」「反向」
 * 多个指令按顺序应用（cut list 语义）。
 */
export function parseEditInstructions(instructions: string[], duration: number): EditCommand[] {
  const commands: EditCommand[] = []
  const duration2 = Number.isFinite(duration) && duration > 0 ? duration : Number.MAX_SAFE_INTEGER
  for (const raw of instructions) {
    const text = raw.trim()
    if (text === '') continue
    const seconds = (value: string | undefined): number | undefined => {
      if (value === undefined) return undefined
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : undefined
    }
    const rangeMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:到|至|-|~)\s*(\d+(?:\.\d+)?)\s*秒/)
    if (/整个|全部.*倒放|倒放整个|反向播放/.test(text) && rangeMatch === null) {
      commands.push({ op: 'reverse' })
      continue
    }
    if (rangeMatch !== null) {
      const from = seconds(rangeMatch[1])
      const to = seconds(rangeMatch[2])
      if (from !== undefined && to !== undefined && to > from) {
        const speedMatch = text.match(/(\d+(?:\.\d+)?)\s*倍|速度\s*(\d+(?:\.\d+)?)|(放慢|加快|加速|减速)\s*(\d+(?:\.\d+)?)/)
        const slower = /放慢|减速/.test(text)
        if (speedMatch !== null) {
          let speed = seconds(speedMatch[1] ?? speedMatch[2] ?? speedMatch[4])
          if (speed !== undefined) {
            if (slower && speed > 1) speed = 1 / speed
            commands.push({ op: 'speed', from, to, speed })
          }
        } else {
          commands.push({ op: 'keep', from, to })
        }
      }
      continue
    }
    const headMatch = text.match(/开头|前面|前\s*(\d+(?:\.\d+)?)\s*秒.*(去掉|删除|剪掉|剪去|不要|删)/)
    const headMatch2 = text.match(/(去掉|删除|剪掉|剪去|不要|删).*?(开头|前面|前)\s*(\d+(?:\.\d+)?)\s*秒/)
    const head = headMatch ?? headMatch2
    const headSeconds = seconds(headMatch?.[1] ?? headMatch2?.[3])
    if (head !== null && headSeconds !== undefined && headSeconds > 0) {
      commands.push({ op: 'cut-head', seconds: Math.min(headSeconds, duration2) })
      continue
    }
    const tailMatch = text.match(/(结尾|末尾|最后|后面|后)\s*(\d+(?:\.\d+)?)\s*秒.*(去掉|删除|剪掉|剪去|不要|删)/)
    const tailMatch2 = text.match(/(去掉|删除|剪掉|剪去|不要|删).*?(结尾|末尾|最后|后面|后)\s*(\d+(?:\.\d+)?)\s*秒/)
    const tail = tailMatch ?? tailMatch2
    const tailSeconds = seconds(tailMatch?.[2] ?? tailMatch2?.[3])
    if (tail !== null && tailSeconds !== undefined && tailSeconds > 0) {
      commands.push({ op: 'cut-tail', seconds: Math.min(tailSeconds, duration2) })
      continue
    }
    const keepMatch = text.match(/(?:只保留|只留|保留|留下|取)\s*(\d+(?:\.\d+)?)\s*(?:到|至|-|~)\s*(\d+(?:\.\d+)?)\s*秒/)
    if (keepMatch !== null) {
      const from = seconds(keepMatch[1])
      const to = seconds(keepMatch[2])
      if (from !== undefined && to !== undefined && to > from) commands.push({ op: 'keep', from, to })
      continue
    }
  }
  return commands
}

/** 把剪辑指令变成 timeline scenes（cut list 语义，顺序应用）。 */
export function editsToScenes(commands: EditCommand[], duration: number): Array<{ source: string; trim: [number, number]; speed?: number; reverse?: boolean }> {
  if (commands.length === 0) return []
  // Apply keep/cut commands to a working window list.
  let windows: Array<[number, number]> = [[0, duration]]
  for (const command of commands) {
    if (command.op === 'keep' && command.from !== undefined && command.to !== undefined) {
      windows = [[command.from, Math.min(command.to, duration)]]
    } else if (command.op === 'cut-head' && command.seconds !== undefined) {
      windows = windows
        .map(([start, end]): Array<[number, number]> => {
          const cut = Math.min(command.seconds as number, end - start)
          return cut >= end - start ? [] : [[start + cut, end]]
        })
        .flat()
    } else if (command.op === 'cut-tail' && command.seconds !== undefined) {
      windows = windows
        .map(([start, end]): Array<[number, number]> => {
          const cut = Math.min(command.seconds as number, end - start)
          return cut >= end - start ? [] : [[start, end - cut]]
        })
        .flat()
    }
  }
  // Speed/reverse commands refine matching windows.
  const scenes = windows.map(([start, end]) => ({ trim: [start, end] as [number, number], speed: undefined as number | undefined, reverse: false }))
  for (const command of commands) {
    if (command.op === 'speed' && command.from !== undefined && command.to !== undefined) {
      for (const scene of scenes) {
        if (command.from >= scene.trim[0] && command.to <= scene.trim[1]) {
          scene.speed = command.speed
        }
      }
    }
    if (command.op === 'reverse') {
      for (const scene of scenes) scene.reverse = true
    }
  }
  return scenes
    .map(scene => ({ source: '', trim: scene.trim, ...(scene.speed !== undefined ? { speed: scene.speed } : {}), ...(scene.reverse ? { reverse: true } : {}) }))
}

export interface SrtLintIssue {
  cue: number
  kind: 'line-width' | 'cps' | 'duration' | 'ordering' | 'timestamp'
  detail: string
}

export interface SrtLintOutput {
  totalCues: number
  issues: SrtLintIssue[]
  ok: boolean
}

/**
 * SRT 规范化检查：把字幕质量标准（单行 ≤16 字、≤17 CPS、单条最短
 * 0.83s、序号/时间戳连续合法）变成确定性 lint，翻译/本地化/成片前跑。
 */
export function srtLint(content: string, options: { maxLineChars?: number; maxCps?: number } = {}): SrtLintOutput {
  const cues = parseSrt(content)
  const issues: SrtLintIssue[] = []
  const maxLine = options.maxLineChars ?? 16
  const maxCps = options.maxCps ?? 17
  cues.forEach((cue, index) => {
    const lines = cue.text.split('\\n')
    for (const line of lines) {
      if (line.length > maxLine) issues.push({ cue: cue.index, kind: 'line-width', detail: `第 ${cue.index} 条单行 ${line.length} 字 > ${maxLine}（建议拆行）` })
    }
    const duration = cue.end - cue.start
    if (duration < 0.83) issues.push({ cue: cue.index, kind: 'duration', detail: `第 ${cue.index} 条时长 ${duration.toFixed(2)}s < 0.83s（最短展示时长）` })
    const chars = cue.text.replace(/\\s/g, '').length
    const cps = chars / Math.max(0.1, duration)
    if (cps > maxCps) issues.push({ cue: cue.index, kind: 'cps', detail: `第 ${cue.index} 条 ${cps.toFixed(1)} 字/秒 > ${maxCps}（阅读速率超标）` })
    if (index > 0 && cue.index !== cues[index - 1].index + 1) issues.push({ cue: cue.index, kind: 'ordering', detail: `第 ${cue.index} 条序号不连续（上一序号 ${cues[index - 1].index}）` })
    if (!Number.isFinite(cue.start) || !Number.isFinite(cue.end) || cue.end < cue.start) issues.push({ cue: cue.index, kind: 'timestamp', detail: `第 ${cue.index} 条时间戳非法` })
  })
  return { totalCues: cues.length, issues, ok: issues.length === 0 }
}
