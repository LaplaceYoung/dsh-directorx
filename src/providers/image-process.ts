import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { extname, join } from 'node:path'
import { resolveOutputDir, slugify } from '../support.ts'
import { probeMedia, type MediaProbe } from './ffmpeg.ts'
import { gradeFilter, type GradeLook } from './grade.ts'

export type ImageRotate = 90 | 180 | 270

export interface ImageProcessInput {
  source: string
  outputDir: string
  rotate?: ImageRotate
  hflip?: boolean
  vflip?: boolean
  crop?: string
  scale?: string
  brightness?: number
  contrast?: number
  saturate?: number
  grade?: GradeLook
}

export interface ImageProcessOutput {
  path: string
  mimeType: 'image/png' | 'image/jpeg'
  probe: MediaProbe
  ops: string[]
}

export function parseRotate(value: unknown): ImageRotate | undefined {
  const number = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN
  if (number === 90 || number === 180 || number === 270) return number
  return undefined
}

export function hasImageOp(input: Omit<ImageProcessInput, 'source' | 'outputDir'>): boolean {
  return input.rotate !== undefined
    || input.hflip === true
    || input.vflip === true
    || (typeof input.crop === 'string' && input.crop.trim() !== '')
    || (typeof input.scale === 'string' && input.scale.trim() !== '')
    || input.brightness !== undefined
    || input.contrast !== undefined
    || input.saturate !== undefined
    || input.grade !== undefined
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function buildFilters(input: ImageProcessInput): { filters: string[]; ops: string[] } {
  const filters: string[] = []
  const ops: string[] = []
  if (input.rotate === 90) {
    filters.push('transpose=1')
    ops.push('rotate-90')
  } else if (input.rotate === 180) {
    filters.push('transpose=1,transpose=1')
    ops.push('rotate-180')
  } else if (input.rotate === 270) {
    filters.push('transpose=2')
    ops.push('rotate-270')
  }
  if (input.hflip === true) {
    filters.push('hflip')
    ops.push('hflip')
  }
  if (input.vflip === true) {
    filters.push('vflip')
    ops.push('vflip')
  }
  if (typeof input.crop === 'string' && input.crop.trim() !== '') {
    const parts = input.crop.split(':').map(Number)
    if (parts.length !== 4 || parts.some(part => !Number.isFinite(part) || part < 0)) {
      throw new Error(`crop 需要 w:h:x:y，收到「${input.crop}」`)
    }
    filters.push(`crop=${parts[0]}:${parts[1]}:${parts[2]}:${parts[3]}`)
    ops.push('crop')
  }
  if (typeof input.scale === 'string' && input.scale.trim() !== '') {
    filters.push(`scale=${input.scale.trim()}`)
    ops.push('scale')
  }
  const eq: string[] = []
  if (input.brightness !== undefined && Number.isFinite(input.brightness)) {
    eq.push(`brightness=${clamp(input.brightness, -1, 1).toFixed(3)}`)
  }
  if (input.contrast !== undefined && Number.isFinite(input.contrast)) {
    eq.push(`contrast=${clamp(input.contrast, 0, 3).toFixed(3)}`)
  }
  if (input.saturate !== undefined && Number.isFinite(input.saturate)) {
    eq.push(`saturation=${clamp(input.saturate, 0, 3).toFixed(3)}`)
  }
  if (eq.length > 0) {
    filters.push(`eq=${eq.join(':')}`)
    ops.push('eq')
  }
  if (input.grade !== undefined) {
    filters.push(gradeFilter(input.grade))
    ops.push(`grade-${input.grade}`)
  }
  return { filters, ops }
}

export async function imageProcess(input: ImageProcessInput): Promise<ImageProcessOutput> {
  if (!existsSync(input.source)) throw new Error(`图片不存在：${input.source}`)
  if (!hasImageOp(input)) throw new Error('没有可执行的图片操作（旋转/翻转/裁切/缩放/明暗/调色）')
  const which = spawnSync('which', ['ffmpeg'], { encoding: 'utf8' })
  if (which.status !== 0 || which.stdout.trim() === '') {
    throw new Error('图片编辑需要本机 ffmpeg。请先安装 ffmpeg（brew install ffmpeg）。')
  }
  const { filters, ops } = buildFilters(input)
  const png = extname(input.source).toLowerCase() === '.png'
  const ext = png ? 'png' : 'jpg'
  const out = join(resolveOutputDir(input.outputDir), `${slugify('image-edit')}-${Date.now().toString(36)}.${ext}`)
  const result = spawnSync('ffmpeg', ['-hide_banner', '-y', '-i', input.source, '-vf', filters.join(','), out], { encoding: 'utf8' })
  if (result.status !== 0 || !existsSync(out)) {
    throw new Error(`图片编辑失败：${(result.stderr ?? '').slice(-400) || `exit ${result.status}`}`)
  }
  return {
    path: out,
    mimeType: png ? 'image/png' : 'image/jpeg',
    probe: probeMedia(out),
    ops,
  }
}
