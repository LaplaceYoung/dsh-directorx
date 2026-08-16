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
