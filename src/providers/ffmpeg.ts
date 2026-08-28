import { spawnSync } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { resolveOutputDir, slugify } from '../support.ts'
import type { MediaFile } from './types.ts'

/**
 * Local ffmpeg/ffprobe helpers (plugin-native, no network). ffmpeg is a soft
 * dependency: the tools degrade with a friendly error when it is missing
 * (the same contract mock video mode already uses).
 */

/** 解析 r_frame_rate 分数（如 "12/1"、"30000/1001"）为数值 fps。 */
function parseFps(rate: string): number {
  const parts = rate.split('/').map(Number)
  if (parts.length === 2 && parts[1] > 0 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
    return Number((parts[0] / parts[1]).toFixed(3))
  }
  const direct = Number(rate)
  return Number.isFinite(direct) && direct > 0 ? direct : 24
}

export interface MediaProbe {
  source: string
  format: string
  durationSec: number
  sizeBytes: number
  streams: Array<Record<string, unknown>>
}

function requireBinary(command: 'ffmpeg' | 'ffprobe'): string {
  const found = spawnSync('which', [command], { encoding: 'utf8' })
  if (found.status !== 0 || found.stdout.trim() === '') {
    throw new Error(`${command} is required for this operation but was not found on PATH. Install ffmpeg (brew install ffmpeg) or use the model-provider tools instead.`)
  }
  return command
}

export function probeMedia(source: string): MediaProbe {
  requireBinary('ffprobe')
  const result = spawnSync('ffprobe', [
    '-v', 'error',
    '-print_format', 'json',
    '-show_format',
    '-show_streams',
    source,
  ], { encoding: 'utf8' })
  if (result.status !== 0) {
    throw new Error(`ffprobe failed: ${result.stderr?.slice(-400) || `exit ${result.status}`}`)
  }
  const parsed = JSON.parse(result.stdout) as {
    format?: { format_name?: string; duration?: string; size?: string }
    streams?: Array<Record<string, unknown>>
  }
  const compactStreams = (parsed.streams ?? []).map(stream => ({
    type: stream.codec_type,
    codec: stream.codec_name,
    ...(stream.width !== undefined ? { width: stream.width } : {}),
    ...(stream.height !== undefined ? { height: stream.height } : {}),
    ...(stream.r_frame_rate !== undefined ? { fps: parseFps(String(stream.r_frame_rate)) } : {}),
    ...(stream.channels !== undefined ? { channels: stream.channels } : {}),
    ...(stream.sample_rate !== undefined ? { sampleRate: stream.sample_rate } : {}),
  }))
  return {
    source,
    format: parsed.format?.format_name ?? 'unknown',
    durationSec: Number(parsed.format?.duration ?? 0),
    sizeBytes: Number(parsed.format?.size ?? 0),
    streams: compactStreams,
  }
}

export interface ExtractFramesOptions {
  /** Timestamps in seconds to capture one frame each. */
  at?: number[]
  /** Evenly spaced frame count over the whole duration (used when `at` is empty). */
  count?: number
}

export async function extractFrames(source: string, outputDir: string, options: ExtractFramesOptions = {}): Promise<MediaFile[]> {
  requireBinary('ffmpeg')
  const dir = join(resolveOutputDir(outputDir), 'frames')
  await mkdir(dir, { recursive: true })
  const stem = slugify(source, 24)
  const times: number[] = []
  if (options.at !== undefined && options.at.length > 0) {
    for (const t of options.at) if (Number.isFinite(t) && t >= 0) times.push(t)
  } else {
    const info = probeMedia(source)
    const count = Math.min(24, Math.max(1, Math.round(options.count ?? 4)))
    for (let i = 0; i < count; i += 1) {
      times.push((info.durationSec * (i + 0.5)) / count)
    }
  }
  const files: MediaFile[] = []
  for (const t of times) {
    const stamp = new Date().toISOString().replaceAll(':', '-').replace(/\.\d+Z$/, 'Z')
    const path = join(dir, `${stem}-${stamp}-${t.toFixed(2)}s.png`)
    const result = spawnSync('ffmpeg', [
      '-y', '-ss', String(t), '-i', source, '-frames:v', '1', '-q:v', '2', path,
    ], { encoding: 'utf8' })
    if (result.status !== 0) {
      throw new Error(`ffmpeg frame extraction failed at ${t}s: ${result.stderr?.slice(-400) || `exit ${result.status}`}`)
    }
    files.push({ path, mimeType: 'image/png' })
  }
  return files
}

export interface AudioSubclipInput {
  source: string
  outputDir: string
  segments: Array<{ start: number; end: number }>
}

export interface AudioSubclipResult {
  index: number
  start: number
  end: number
  path?: string
  success: boolean
  error?: string
}

/** 批量切出音频片段；单段失败只记录该段，绝不覆盖源文件。 */
export function audioSubclips(input: AudioSubclipInput): { source: string; segments: AudioSubclipResult[] } {
  requireBinary('ffmpeg')
  const duration = probeMedia(input.source).durationSec
  if (!Array.isArray(input.segments) || input.segments.length === 0) throw new Error('segments 至少包含一个切片')
  if (input.segments.length > 32) throw new Error('segments 最多 32 个')
  const root = resolveOutputDir(input.outputDir)
  const results: AudioSubclipResult[] = []
  for (const [index, segment] of input.segments.entries()) {
    const start = Number(segment?.start)
    const end = Number(segment?.end)
    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start || end > duration) {
      results.push({ index, start, end, success: false, error: `非法区间：${start}–${end}（媒体时长 ${duration}s）` })
      continue
    }
    const out = join(root, `audio-subclip-${Date.now().toString(36)}-${index}.m4a`)
    const result = spawnSync('ffmpeg', ['-hide_banner', '-y', '-ss', String(start), '-to', String(end), '-i', input.source, '-vn', '-c:a', 'aac', out], { encoding: 'utf8' })
    if (result.status !== 0) {
      results.push({ index, start, end, success: false, error: result.stderr?.slice(-400) || `ffmpeg exit ${result.status}` })
      continue
    }
    results.push({ index, start, end, path: out, success: true })
  }
  return { source: input.source, segments: results }
}
