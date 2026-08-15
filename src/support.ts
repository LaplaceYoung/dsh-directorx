import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { basename, extname, join, resolve } from 'node:path'

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.m4a': 'audio/mp4',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
}

export function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value)
}

export function mimeForPath(path: string): string {
  return MIME[extname(path).toLowerCase()] ?? 'application/octet-stream'
}

export async function mediaSourceToDataUrl(source: string, maxBytes = 15 * 1024 * 1024): Promise<string> {
  if (/^data:/i.test(source)) return source
  if (isHttpUrl(source)) return source
  const path = resolve(source)
  if (!existsSync(path)) throw new Error(`File not found: ${source}`)
  const data = await readFile(path)
  if (data.length > maxBytes) {
    throw new Error(`File too large to inline (${Math.round(data.length / 1024 / 1024)}MB > ${Math.round(maxBytes / 1024 / 1024)}MB): ${source}`)
  }
  return `data:${mimeForPath(path)};base64,${data.toString('base64')}`
}

export async function ensureOutputDir(dir: string): Promise<string> {
  const out = resolve(process.cwd(), dir)
  await mkdir(out, { recursive: true })
  return out
}

export async function downloadToFile(url: string, outDir: string, prefix: string, ext: string): Promise<string> {
  await ensureOutputDir(outDir)
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Download failed with HTTP ${response.status}: ${url}`)
  const bytes = Buffer.from(await response.arrayBuffer())
  const stem = `${prefix}-${new Date().toISOString().replaceAll(':', '-').replace(/\.\d+Z$/, 'Z')}${ext}`
  const path = join(outDir, stem)
  await writeFile(path, bytes)
  return path
}

export async function saveBase64ToFile(data: string, outDir: string, prefix: string, ext: string): Promise<string> {
  await ensureOutputDir(outDir)
  const raw = data.replace(/^data:[^;]+;base64,/, '')
  const normalizedExt = ext.startsWith('.') ? ext : `.${ext}`
  const path = join(outDir, `${prefix}-${new Date().toISOString().replaceAll(':', '-').replace(/\.\d+Z$/, 'Z')}${normalizedExt}`)
  await writeFile(path, Buffer.from(raw, 'base64'))
  return path
}

export function apiKeyOf(configApiKey: string, envNames: string[], baseURL: string): string {
  const fromEnv = envNames.map(name => process.env[name]).find(value => value !== undefined && value !== '')
  const key = configApiKey !== '' ? configApiKey : fromEnv ?? ''
  if (key === '' && !isLocalBaseUrl(baseURL)) {
    throw new Error(
      `No API key configured. Fill Base URL / API Key in WebUI Settings → DirectorX, or export ${envNames.join(' / ')}.`,
    )
  }
  return key
}

export function isLocalBaseUrl(baseURL: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/i.test(baseURL)
}

export async function readJsonResponse<T = Record<string, unknown>>(response: Response): Promise<T> {
  const text = await response.text()
  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error(`Provider returned non-JSON response (HTTP ${response.status}): ${text.slice(0, 300)}`)
  }
}

export function slugify(value: string, max = 40): string {
  const slug = basename(value, extname(value))
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max)
  return slug === '' ? 'directorx' : slug
}

export function stringContentOf(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    return value.map(part => {
      if (typeof part === 'string') return part
      if (part !== null && typeof part === 'object') {
        const record = part as Record<string, unknown>
        if (typeof record.text === 'string') return record.text
        if (typeof record.content === 'string') return record.content
      }
      return ''
    }).join('\n')
  }
  return String(value ?? '')
}