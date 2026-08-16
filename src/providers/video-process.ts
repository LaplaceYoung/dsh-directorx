import { spawnSync } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { slugify } from '../support.ts'
import { probeMedia, type MediaProbe } from './ffmpeg.ts'

/**
 * Deterministic ffmpeg assembly (plugin-native, no network): trim / speed /
 * scale / volume / mute / fps, and multi-clip concat with xfade transitions.
 * ffmpeg is the mature open-source engine behind these tools; the build
 * available here ships xfade/atempo/setpts/scale/volume but NOT libass, so
 * subtitle burning stays out of scope (SRT sidecars ship with transcripts).
 */

function runFfmpeg(args: string[], what: string): void {
  const result = spawnSync('ffmpeg', ['-hide_banner', '-y', ...args], { encoding: 'utf8' })
  if (result.status !== 0) {
    throw new Error(`${what} failed: ${result.stderr?.slice(-600) || `exit ${result.status}`}`)
  }
}

export interface VideoProcessInput {
  source: string
  outputDir: string
  start?: number
  end?: number
  speed?: number
  scale?: string
  volume?: number
  mute?: boolean
  fps?: number
}

export interface VideoConcatInput {
  files: string[]
  outputDir: string
  transition?: 'fade' | 'cut'
  fadeSec?: number
  scale?: string
}

function outputPath(outputDir: string, tag: string, ext: string): string {
  const root = resolve(process.cwd(), outputDir)
  mkdir(root, { recursive: true }).catch(() => {})
  return join(root, `${slugify(tag)}-${Date.now().toString(36)}.${ext}`)
}

export interface VideoOutput {
  path: string
  mimeType: 'video/mp4'
  probe: MediaProbe
}

export async function videoProcess(input: VideoProcessInput): Promise<VideoOutput> {
  const out = outputPath(input.outputDir, 'processed', 'mp4')
  const videoFilters: string[] = []
  const audioFilters: string[] = []
  if (input.start !== undefined || input.end !== undefined) {
    const start = input.start ?? 0
    const end = input.end !== undefined ? `:end=${input.end}` : ''
    videoFilters.push(`trim=start=${start}${end},setpts=PTS-STARTPTS`)
    audioFilters.push(`atrim=start=${start}${end},asetpts=PTS-STARTPTS`)
  }
  if (input.speed !== undefined && input.speed > 0 && input.speed !== 1) {
    const speed = input.speed
    videoFilters.push(`setpts=${(1 / speed).toFixed(4)}*PTS`)
    // atempo supports 0.5..2 per instance; chain for wider ranges.
    let remaining = speed
    const atempoParts: string[] = []
    while (remaining > 2.0001) { atempoParts.push('atempo=2.0'); remaining /= 2 }
    while (remaining < 0.4999) { atempoParts.push('atempo=0.5'); remaining /= 0.5 }
    atempoParts.push(`atempo=${Math.min(2, Math.max(0.5, remaining)).toFixed(4)}`)
    audioFilters.push(...atempoParts)
  }
  if (input.scale !== undefined && input.scale !== '') {
    videoFilters.push(`scale=${input.scale}`)
  }
  if (input.fps !== undefined && input.fps > 0) {
    videoFilters.push(`fps=${input.fps}`)
  }
  if (input.mute === true) {
    audioFilters.length = 0
  } else if (input.volume !== undefined) {
    audioFilters.push(`volume=${input.volume}`)
  }
  const args: string[] = ['-i', input.source]
  if (videoFilters.length > 0) args.push('-vf', videoFilters.join(','))
  if (audioFilters.length > 0) args.push('-af', audioFilters.join(','))
  if (input.mute === true) args.push('-an')
  args.push('-c:v', 'libx264', '-preset', 'veryfast', '-c:a', 'aac', out)
  runFfmpeg(args, 'video process')
  return { path: out, mimeType: 'video/mp4', probe: probeMedia(out) }
}

export async function videoConcat(input: VideoConcatInput): Promise<VideoOutput> {
  if (input.files.length < 2) throw new Error('videoConcat needs at least 2 files')
  const out = outputPath(input.outputDir, 'concat', 'mp4')
  const fadeSec = input.fadeSec ?? 0.5
  const scale = input.scale ?? '1280:720'

  if (input.transition === 'cut' || fadeSec <= 0) {
    // Plain concat: normalize each clip to a common size/fps first.
    const args: string[] = []
    const filters: string[] = []
    input.files.forEach((file, index) => {
      args.push('-i', file)
      filters.push(`[${index}:v]scale=${scale},fps=30,setpts=PTS-STARTPTS[v${index}];[${index}:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,asetpts=PTS-STARTPTS[a${index}]`)
    })
    const inputs = input.files.map((_, index) => `[v${index}][a${index}]`).join('')
    const filterComplex = `${filters.join(';')}${inputs}concat=n=${input.files.length}:v=1:a=1[v][a]`
    args.push('-filter_complex', filterComplex, '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'veryfast', '-c:a', 'aac', out)
    runFfmpeg(args, 'video concat (cut)')
    return { path: out, mimeType: 'video/mp4', probe: probeMedia(out) }
  }

  // Xfade chain: overlap = fadeSec; offsets accumulate from clip durations.
  const probes = input.files.map(file => probeMedia(file))
  const args: string[] = []
  for (const file of input.files) args.push('-i', file)
  const filters: string[] = []
  input.files.forEach((_, index) => {
    filters.push(`[${index}:v]scale=${scale},fps=30,setpts=PTS-STARTPTS[v${index}];[${index}:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,asetpts=PTS-STARTPTS[a${index}]`)
  })
  let video = '[v0]'
  let audio = '[a0]'
  let offset = (probes[0]?.durationSec ?? 3) - fadeSec
  for (let index = 1; index < input.files.length; index += 1) {
    const nextV = `[vx${index}]`
    const nextA = `[ax${index}]`
    filters.push(`${video}[v${index}]xfade=transition=fade:duration=${fadeSec}:offset=${offset.toFixed(3)}${nextV}`)
    filters.push(`${audio}[a${index}]acrossfade=d=${fadeSec}${nextA}`)
    video = nextV
    audio = nextA
    offset += (probes[index]?.durationSec ?? 3) - fadeSec
  }
  const filterComplex = `${filters.join(';')}`
  args.push('-filter_complex', filterComplex, '-map', video, '-map', audio, '-c:v', 'libx264', '-preset', 'veryfast', '-c:a', 'aac', out)
  runFfmpeg(args, 'video concat (fade)')
  return { path: out, mimeType: 'video/mp4', probe: probeMedia(out) }
}

export interface AudioMixInput {
  /** Video (or audio) file the tracks are mixed onto. */
  video: string
  outputDir: string
  /** Extra tracks, in order: first listed track sits on top (e.g. narration first). */
  tracks: Array<{ path: string; volume?: number }>
  /** Duck the later tracks under this track index (0-based into tracks, typically the narration). */
  duckUnder?: number
}

export async function audioMix(input: AudioMixInput): Promise<VideoOutput> {
  if (input.tracks.length === 0) throw new Error('audioMix needs at least one track')
  const out = outputPath(input.outputDir, 'mixed', 'mp4')
  const args: string[] = ['-i', input.video]
  for (const track of input.tracks) args.push('-i', track.path)
  const parts: string[] = []
  const trackLabels: string[] = []
  input.tracks.forEach((track, index) => {
    const vol = track.volume ?? 1
    parts.push(`[${index + 1}:a]volume=${vol},aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[trk${index}]`)
    trackLabels.push(`[trk${index}]`)
  })
  let mixInputs = trackLabels.join('')
  if (input.duckUnder !== undefined && input.duckUnder >= 0 && input.duckUnder < input.tracks.length) {
    const voice = `[trk${input.duckUnder}]`
    const bgm = input.duckUnder === 0
      ? trackLabels.slice(1).join('') === '' ? null : trackLabels.slice(1)
      : [trackLabels[0]]
    if (bgm !== null && bgm.length > 0) {
      const ducked = bgm.map(label => `${label}${voice}sidechaincompress=threshold=0.03:ratio=8:attack=60:release=400:makeup=1[duck${bgm.indexOf(label)}]`).join(';')
      parts.push(ducked)
      const duckLabels = bgm.map((_, index) => `[duck${index}]`)
      const all = input.duckUnder === 0 ? [voice, ...duckLabels] : [...duckLabels, voice]
      mixInputs = all.join('')
    }
  }
  parts.push(`${mixInputs}amix=inputs=${input.tracks.length}:duration=first:normalize=0[mixed]`)
  args.push('-filter_complex', parts.join(';'), '-map', '0:v', '-map', '[mixed]', '-c:v', 'copy', '-c:a', 'aac', '-shortest', out)
  runFfmpeg(args, 'audio mix')
  return { path: out, mimeType: 'video/mp4', probe: probeMedia(out) }
}

export interface VideoSubtitleInput {
  video: string
  srt: string
  mode?: 'soft' | 'burn'
  outputDir: string
}

/** Probe libass once per process (burn mode requires the ass filter). */
let libassProbe: boolean | undefined
export function hasLibass(): boolean {
  if (libassProbe !== undefined) return libassProbe
  const result = spawnSync('ffmpeg', ['-hide_banner', '-h', 'filter=ass'], { encoding: 'utf8' })
  // ffmpeg 9 exits 0 even for unknown filters — parse the output instead.
  libassProbe = result.status === 0 && !/Unknown filter/.test(result.stdout ?? '')
  return libassProbe
}

export async function videoSubtitle(input: VideoSubtitleInput): Promise<VideoOutput> {
  const mode = input.mode ?? 'soft'
  const out = outputPath(input.outputDir, 'subtitle', 'mp4')
  if (mode === 'burn') {
    if (!hasLibass()) {
      throw new Error('当前 ffmpeg 构建缺少 libass（无法烧录字幕）。请使用 mode=soft 软字幕，或安装带 libass 的 ffmpeg。')
    }
    const escaped = input.srt.replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "\\'")
    runFfmpeg(['-i', input.video, '-vf', `ass='${escaped}'`, '-c:v', 'libx264', '-preset', 'veryfast', '-c:a', 'copy', out], 'subtitle burn')
    return { path: out, mimeType: 'video/mp4', probe: probeMedia(out) }
  }
  // Soft subtitles: mux the SRT as a selectable mov_text track — no libass needed.
  runFfmpeg(['-i', input.video, '-i', input.srt, '-map', '0', '-map', '1', '-c', 'copy', '-c:s', 'mov_text', '-metadata:s:s:0', 'language=chi', out], 'subtitle mux')
  return { path: out, mimeType: 'video/mp4', probe: probeMedia(out) }
}

export interface VideoZoomInput {
  video: string
  outputDir: string
  /** Zoom strength: end scale = 1 + strength (e.g. 0.3 -> 1.3x). */
  strength?: number
  /** Pan direction: 'in' (push-in), 'out' (pull-back), 'left', 'right'. */
  direction?: 'in' | 'out' | 'left' | 'right'
}

/** Ken Burns push/pull via animated crop (zoompan is absent from this build). */
export async function videoZoom(input: VideoZoomInput): Promise<VideoOutput> {
  const out = outputPath(input.outputDir, 'zoom', 'mp4')
  const strength = input.strength ?? 0.25
  const direction = input.direction ?? 'in'
  const dur = probeMedia(input.video).durationSec || 3
  // Crop a shrinking window (push-in) or a growing one (pull-back), then
  // scale back to the source size. Pan directions shift the crop origin.
  const sizeExpr = direction === 'in'
    ? `iw-iw*${strength}*min(t/${dur}\\,1):ih-ih*${strength}*min(t/${dur}\\,1)`
    : `iw/(1+${strength})+iw*${strength}*min(t/${dur}\\,1):ih/(1+${strength})+ih*${strength}*min(t/${dur}\\,1)`
  const xExpr = direction === 'left' ? '(iw-ow)*min(t/' + dur + '\\,1)' : direction === 'right' ? '(iw-ow)*(1-min(t/' + dur + '\\,1))' : '(iw-ow)/2'
  const yExpr = '(ih-oh)/2'
  runFfmpeg([
    '-i', input.video,
    '-vf', `crop=${sizeExpr}:x=${xExpr}:y=${yExpr},scale=iw:ih`,
    '-c:v', 'libx264', '-preset', 'veryfast', '-c:a', 'copy',
    out,
  ], 'video zoom')
  return { path: out, mimeType: 'video/mp4', probe: probeMedia(out) }
}

export interface VideoPipInput {
  video: string
  overlay: string
  outputDir: string
  x?: number
  y?: number
  w?: number
  h?: number
  /** Show the overlay only inside this window (seconds). */
  enable?: [number, number]
  alpha?: number
}

/** Picture-in-picture / sticker overlay onto a video. */
export async function videoPip(input: VideoPipInput): Promise<VideoOutput> {
  const out = outputPath(input.outputDir, 'pip', 'mp4')
  const x = input.x ?? 20
  const y = input.y ?? 20
  const w = input.w ?? 320
  const h = input.h ?? -1
  const alpha = input.alpha ?? 1
  const enable = input.enable !== undefined ? `:enable='between(t,${input.enable[0]},${input.enable[1]})'` : ''
  const vf = `[1:v]scale=${w}:${h},format=rgba,colorchannelmixer=aa=${alpha}[ov];[0:v][ov]overlay=${x}:${y}${enable},format=yuv420p`
  runFfmpeg([
    '-i', input.video, '-i', input.overlay,
    '-filter_complex', vf,
    '-c:v', 'libx264', '-preset', 'veryfast', '-c:a', 'copy',
    out,
  ], 'video pip')
  return { path: out, mimeType: 'video/mp4', probe: probeMedia(out) }
}
