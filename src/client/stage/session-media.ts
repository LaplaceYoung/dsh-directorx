import { displayCardTitle } from '../../card-label.ts'

export type SessionMediaKind = 'image' | 'video'

export interface SessionMedia {
  path: string
  kind: SessionMediaKind
  label: string
}

const VIDEO_EXT = /\.(mp4|webm|mov|mkv)$/i
const IMAGE_EXT = /\.(png|jpe?g|webp|gif|svg)$/i

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return undefined
  return value as Record<string, unknown>
}

export function mediaKindOf(path: string, mime?: string, toolName?: string): SessionMediaKind | undefined {
  if (mime !== undefined && mime.startsWith('video/')) return 'video'
  if (mime !== undefined && mime.startsWith('image/')) return 'image'
  if (VIDEO_EXT.test(path)) return 'video'
  if (IMAGE_EXT.test(path)) return 'image'
  if (toolName === 'directorx_generate_video') return 'video'
  if (toolName === 'directorx_generate_image' || toolName === 'directorx_extract_frames' || toolName === 'directorx_studio') {
    return 'image'
  }
  return undefined
}

function collectFiles(root: Record<string, unknown>): Array<{ path: string; mime?: string }> {
  const items: Array<{ path: string; mime?: string }> = []
  const push = (path: string, mime?: string) => {
    if (path.trim() === '' || items.some(item => item.path === path)) return
    items.push({ path, ...(mime !== undefined && mime !== '' ? { mime } : {}) })
  }
  if (Array.isArray(root.files)) {
    for (const file of root.files) {
      const rec = asRecord(file)
      if (rec === undefined) continue
      const path = typeof rec.path === 'string' && rec.path !== ''
        ? rec.path
        : typeof rec.url === 'string' && rec.url !== '' ? rec.url : ''
      if (path === '') continue
      push(path, typeof rec.mimeType === 'string' ? rec.mimeType : undefined)
    }
  }
  if (typeof root.path === 'string') push(root.path)
  return items
}

/** Pull image/video paths out of a generate_* / extract_frames tool result JSON. */
export function mediaFromToolResult(result?: string, toolName?: string): SessionMedia[] {
  if (result === undefined || result.trim() === '') return []
  let parsed: unknown
  try {
    parsed = JSON.parse(result)
  } catch {
    return []
  }
  const rec = asRecord(parsed)
  if (rec === undefined) return []
  const nested = asRecord(rec.value) ?? asRecord(rec.result)
  const body = rec.files === undefined && rec.path === undefined && nested !== undefined ? nested : rec
  const prompt = typeof body.prompt === 'string' ? body.prompt : typeof rec.prompt === 'string' ? rec.prompt : undefined
  const media: SessionMedia[] = []
  for (const file of collectFiles(body)) {
    const kind = mediaKindOf(file.path, file.mime, toolName)
    if (kind === undefined) continue
    const name = file.path.split('/').pop() ?? file.path
    const label = displayCardTitle(name, prompt) || name
    media.push({ path: file.path, kind, label })
  }
  return media.slice(0, 8)
}
