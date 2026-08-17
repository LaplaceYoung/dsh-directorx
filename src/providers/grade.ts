import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { extname, join } from 'node:path'
import { resolveOutputDir, slugify } from '../support.ts'
import {
  GRADE_ALIASES,
  GRADE_TABLE,
  isGradeLook,
  listGradeLabels,
  type GradeLook,
} from './grade-catalog.ts'

export {
  GRADE_FAMILIES,
  GRADE_LOOK_LIST,
  GRADE_LOOKS,
  GRADE_TABLE,
  gradeCss,
  isGradeLook,
  listGradeLabels,
  looksByFamily,
} from './grade-catalog.ts'
export type { GradeFamily, GradeLook, GradeLookSpec } from './grade-catalog.ts'

export function resolveGradeLook(text: string): GradeLook {
  const raw = text.trim()
  if (isGradeLook(raw)) return raw
  for (const item of GRADE_ALIASES) {
    if (item.pattern.test(raw)) return item.look
  }
  if (/调色|色调|配色|grade|look|滤镜/i.test(raw)) return 'wasteland'
  throw new Error(`无法从「${raw.slice(0, 40)}」识别调色。可用：${listGradeLabels()}`)
}

export function gradeFilter(look: GradeLook): string {
  return GRADE_TABLE[look].vf
}

export function inferMediaKind(path: string, fallback?: 'image' | 'video'): 'image' | 'video' {
  const ext = extname(path).toLowerCase()
  if (['.mp4', '.mov', '.webm', '.m4v', '.mkv'].includes(ext)) return 'video'
  if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'].includes(ext)) return 'image'
  return fallback ?? 'image'
}

export async function applyGrade(input: {
  source: string
  look: GradeLook
  outputDir: string
  kind?: 'image' | 'video'
}): Promise<{ path: string; look: GradeLook; kind: 'image' | 'video' }> {
  const source = input.source
  if (!existsSync(source)) throw new Error(`媒体不存在：${source}`)
  const which = spawnSync('which', ['ffmpeg'], { encoding: 'utf8' })
  if (which.status !== 0 || which.stdout.trim() === '') {
    throw new Error('调色需要本机 ffmpeg。请先安装 ffmpeg（brew install ffmpeg）。')
  }
  const kind = input.kind ?? inferMediaKind(source)
  const ext = kind === 'video' ? '.mp4' : (extname(source).toLowerCase() === '.png' ? '.png' : '.jpg')
  const out = join(resolveOutputDir(input.outputDir), `${slugify(`grade-${input.look}`)}-${Date.now().toString(36)}${ext}`)
  const vf = gradeFilter(input.look)
  const args = kind === 'video'
    ? ['-y', '-i', source, '-vf', vf, '-c:a', 'copy', out]
    : ['-y', '-i', source, '-vf', vf, out]
  const result = spawnSync('ffmpeg', args, { encoding: 'utf8' })
  if (result.status !== 0 || !existsSync(out)) {
    throw new Error(`调色失败：${(result.stderr ?? '').slice(-400) || `exit ${result.status}`}`)
  }
  return { path: out, look: input.look, kind }
}
