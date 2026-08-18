/**
 * MiniMax H3 runtime contract internalized from the official handbook
 * (model spec + 如何更好地使用 H3). Other video models may reuse the
 * prompt-shape helpers; duration/file limits apply only to H3.
 */

export const H3_MIN_SEC = 4
export const H3_MAX_SEC = 15
export const H3_PROMPT_MAX = 7000
export const H3_MAX_REF_IMAGES = 9
export const H3_MAX_REF_VIDEOS = 3
export const H3_MAX_REF_AUDIO = 3
export const H3_MAX_MIXED_FILES = 12
export const H3_FRAME_MIN_PX = 256
export const H3_FRAME_MAX_PX = 5760
export const H3_ASPECT_WIDE = 5 / 2
export const H3_ASPECT_TALL = 2 / 5
export const H3_RECOMMENDED_RESOLUTION = '1440p'

const H3_MODEL = /minimax-h3|hailuo|海螺|\bh3\b/i

export function isH3Model(model: string | undefined, mode?: string): boolean {
  const blob = `${model ?? ''} ${mode ?? ''}`
  return H3_MODEL.test(blob) || mode === 'minimax-h3' || mode === 'modelverse-tasks' && /minimax-h3/i.test(model ?? '')
}

export function clampH3Duration(seconds?: number): number {
  return Math.min(H3_MAX_SEC, Math.max(H3_MIN_SEC, Math.round(seconds ?? 5)))
}

export function clipH3Prompt(prompt: string): { prompt: string; clipped: boolean } {
  if (prompt.length <= H3_PROMPT_MAX) return { prompt, clipped: false }
  return { prompt: prompt.slice(0, H3_PROMPT_MAX), clipped: true }
}

export function h3Resolution(requested?: string): string {
  const raw = (requested ?? '').trim()
  if (raw === '' || raw === '2K' || raw === '1080p' || raw === '1K') return H3_RECOMMENDED_RESOLUTION
  if (raw === '768p' || raw === '720p') return '768p'
  return raw === '1440p' ? H3_RECOMMENDED_RESOLUTION : raw
}

/** Official: first/last frames set the output aspect; do not also send role:reference. */
export function h3SkipReferences(firstFrame?: string, lastFrame?: string): boolean {
  return (firstFrame !== undefined && firstFrame !== '') || (lastFrame !== undefined && lastFrame !== '')
}

export function h3FrameAspectOk(width: number, height: number): boolean {
  if (width < H3_FRAME_MIN_PX || height < H3_FRAME_MIN_PX) return false
  if (width > H3_FRAME_MAX_PX || height > H3_FRAME_MAX_PX) return false
  const ratio = width / height
  return ratio <= H3_ASPECT_WIDE && ratio >= H3_ASPECT_TALL
}

export function limitH3Refs(paths: string[]): string[] {
  return paths.filter(path => path !== '').slice(0, H3_MAX_REF_IMAGES)
}
