const PLACEHOLDERS = new Set(['', '图片', '视频', '未命名', '文本', 'Image', 'Video', 'Untitled'])
const FILE_EXT = /\.(png|jpe?g|webp|gif|mp4|webm|mov|mkv)$/i
const DATE_STAMP = /-\d{4}-\d{2}(-\d{2})?(t\d{2}-\d{2}-\d{2}z?)?$/i
const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+){3,}$/i

function stemOf(text: string): string {
  return text.replace(FILE_EXT, '')
}

function humanizeSlug(label?: string): string {
  const stem = stemOf((label ?? '').trim())
  const cut = stem.replace(DATE_STAMP, '').replace(/[_]+/g, '-')
  const words = cut.split('-').filter(part => part !== '' && !/^\d+$/.test(part))
  if (words.length < 2) return ''
  return words.join(' ').slice(0, 42)
}

/** True when a canvas title is a file slug, not a shot name. */
export function isAssetSlug(label?: string): boolean {
  const text = (label ?? '').trim()
  if (PLACEHOLDERS.has(text)) return true
  const stem = stemOf(text)
  if (DATE_STAMP.test(stem)) return true
  if (KEBAB.test(stem) && !/[\u4e00-\u9fff]/.test(stem)) return true
  if (stem !== text && !/[\u4e00-\u9fff]/.test(stem)) return true
  return false
}

/** Title shown on the card: keep human names, hide file slugs. */
export function displayCardTitle(label?: string, prompt?: string, shotIndex?: number): string {
  const raw = (label ?? '').trim()
  const stem = stemOf(raw)
  if (!isAssetSlug(raw) && stem !== '') return stem
  const fromPrompt = (prompt ?? '').trim().split(/[\n。！？.!?]/)[0]?.trim() ?? ''
  if (fromPrompt !== '') return fromPrompt.slice(0, 36)
  if (shotIndex !== undefined) return `镜头 ${String(shotIndex).padStart(2, '0')}`
  return humanizeSlug(raw)
}

/** Keep an existing shot name when a generate/upload returns a file slug. */
export function nextCardLabel(current?: string, incoming?: string): string | undefined {
  if (incoming === undefined || incoming.trim() === '') return current
  if (!isAssetSlug(current) && isAssetSlug(incoming)) return current
  return incoming
}

/** Persist a human shot name; never store a file slug when a better title exists. */
export function resolveStoredLabel(current?: string, incoming?: string, prompt?: string, shotIndex?: number): string {
  const kept = nextCardLabel(current, incoming)
  const shown = displayCardTitle(kept, prompt, shotIndex)
  if (shown !== '') return shown
  const fallback = (kept ?? incoming ?? current ?? '').trim()
  return isAssetSlug(fallback) ? '' : fallback
}
