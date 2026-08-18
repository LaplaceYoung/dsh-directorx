import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { resolveOutputDir, slugify } from '../support.ts'

/**
 * Aspect-safe ffmpeg helpers. Concat and first/last frames must never
 * stretch a 3:2 still into 16:9 — that is the stretch the trailer showed.
 */

export function fitScaleFilter(scale: string): string {
  const raw = scale.trim()
  const match = /^(\d+):(\d+)$/.exec(raw)
  if (match === null) return raw.startsWith('scale=') ? raw : `scale=${raw}`
  const width = match[1]
  const height = match[2]
  return `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1`
}

export function parseAspectRatio(ratio?: string): { w: number; h: number } {
  const match = /^(\d+)\s*:\s*(\d+)$/.exec((ratio ?? '16:9').trim())
  if (match === null) return { w: 16, h: 9 }
  return { w: Number(match[1]), h: Number(match[2]) }
}

function requireFfmpeg(): boolean {
  const found = spawnSync('which', ['ffmpeg'], { encoding: 'utf8' })
  return found.status === 0 && found.stdout.trim() !== ''
}

function runVf(source: string, dest: string, vf: string, what: string): string {
  if (!existsSync(source)) throw new Error(`${what}: missing ${source}`)
  if (!requireFfmpeg()) throw new Error(`${what}: ffmpeg not on PATH`)
  const result = spawnSync('ffmpeg', ['-hide_banner', '-y', '-i', source, '-vf', vf, dest], { encoding: 'utf8' })
  if (result.status !== 0 || !existsSync(dest)) {
    throw new Error(`${what} failed: ${(result.stderr ?? '').slice(-400) || `exit ${result.status}`}`)
  }
  return dest
}

/** Center-crop to aspect, even dimensions, square pixels. Keeps native resolution. */
export function cropToAspect(source: string, dest: string, aspectW = 16, aspectH = 9): string {
  const vf = [
    `crop='min(iw,ih*${aspectW}/${aspectH})':'min(ih,iw*${aspectH}/${aspectW})'`,
    'scale=trunc(iw/2)*2:trunc(ih/2)*2',
    'setsar=1',
  ].join(',')
  return runVf(source, dest, vf, 'cropToAspect')
}

/** Center zoom used as a same-shot last frame (push-in) so identity cannot drift. */
export function zoomEndFrame(source: string, dest: string, zoom = 1.16): string {
  const factor = Math.min(1.45, Math.max(1.05, zoom))
  const vf = [
    `crop=iw/${factor}:ih/${factor}:(iw-ow)/2:(ih-oh)/2`,
    'scale=trunc(iw/2)*2:trunc(ih/2)*2',
    'setsar=1',
  ].join(',')
  return runVf(source, dest, vf, 'zoomEndFrame')
}

export function extractTailFrame(source: string, dest: string): string {
  if (!existsSync(source)) throw new Error(`extractTailFrame: missing ${source}`)
  if (!requireFfmpeg()) throw new Error('extractTailFrame: ffmpeg not on PATH')
  const result = spawnSync('ffmpeg', [
    '-hide_banner', '-y', '-sseof', '-0.04', '-i', source, '-frames:v', '1', dest,
  ], { encoding: 'utf8' })
  if (result.status !== 0 || !existsSync(dest)) {
    throw new Error(`extractTailFrame failed: ${(result.stderr ?? '').slice(-400) || `exit ${result.status}`}`)
  }
  return dest
}

export function ensureAspectFrame(source: string, outputDir: string, aspectW = 16, aspectH = 9): string {
  if (!existsSync(source)) throw new Error(`ensureAspectFrame: missing ${source}`)
  if (!requireFfmpeg()) return source
  const dest = join(resolveOutputDir(outputDir), `${slugify('frame-fit')}-${aspectW}x${aspectH}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}.png`)
  try {
    return cropToAspect(source, dest, aspectW, aspectH)
  } catch {
    return source
  }
}
