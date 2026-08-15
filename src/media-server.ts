import { createReadStream } from 'node:fs'
import { mkdir, readdir, rm, stat } from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { join, resolve } from 'node:path'
import type { Context } from 'cordis'
import { DirectorxEditLedger } from './edits.ts'
import { DirectorxTaskLedger } from './tasks.ts'
import { DirectorxCanvasStore, type CanvasDocument } from './canvas.ts'
import { MAX_MEDIA_BYTES, mimeForPath, parseMediaQuery, parseRangeHeader, resolveMediaPath, slugify } from './support.ts'

/** Exact pathname the browser fetches generated media from: `/directorx/media?path=<abs-or-relative>` (GET) or saves edits to (POST). */
export const MEDIA_ROUTE_PATH = '/directorx/media'

/** GET endpoint returning the recent editor-export ledger. */
export const MEDIA_EDITS_ROUTE_PATH = '/directorx/media/edits'

/** GET endpoint returning recent generation-task states (live progress cards). */
export const MEDIA_TASKS_ROUTE_PATH = '/directorx/media/tasks'

/** GET endpoint listing media files under the output dir (canvas picker). */
export const MEDIA_LIST_ROUTE_PATH = '/directorx/media/list'

/** GET/PUT endpoints for the infinite-canvas document. */
export const CANVAS_ROUTE_PATH = '/directorx/canvas'

/** Subdirectory receiving WebUI editor exports. */
export const EDIT_SUBDIR = 'edited'

/** Editor-export media types the save endpoint accepts, mapped to file extensions. */
export const MEDIA_TYPE_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
}

export function mediaTypeExt(mediaType: string): string | undefined {
  return MEDIA_TYPE_EXT[mediaType.toLowerCase().split(';')[0].trim()]
}

/** A byte-counting Transform that destroys the stream when the cap is exceeded. */
function byteCapStream(cap: number): { stream: Transform; size: () => number } {
  let total = 0
  const stream = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      total += chunk.length
      if (total > cap) {
        callback(new Error(`Media save exceeds the ${Math.round(cap / 1024 / 1024)}MB cap`))
        return
      }
      callback(null, chunk)
    },
  })
  return { stream, size: () => total }
}

export interface MediaFileInfo {
  path: string
  size: number
  mediaType: string
}

/**
 * Validate one requested media path against the plugin output directory.
 * @throws when the path escapes the directory, names no regular file, or exceeds the size cap.
 */
export async function inspectMediaFile(outputDir: string, requestedPath: string): Promise<MediaFileInfo> {
  const path = resolveMediaPath(outputDir, requestedPath)
  const fileStat = await stat(path)
  if (!fileStat.isFile()) throw new Error(`Not a regular file: ${requestedPath}`)
  if (fileStat.size > MAX_MEDIA_BYTES) {
    throw new Error(`Media file too large to serve (${fileStat.size} bytes): ${requestedPath}`)
  }
  return { path, size: fileStat.size, mediaType: mimeForPath(path) }
}

/**
 * Cross-site guard: a browser request from another origin may never read
 * generated media. Same-origin page fetches carry a matching Origin (or none
 * for plain media-element requests), both of which pass.
 */
function isCrossOrigin(request: IncomingMessage): boolean {
  const origin = request.headers.origin
  if (origin === undefined) return false
  const host = request.headers.host ?? ''
  try {
    return new URL(origin).host !== host
  } catch {
    return true
  }
}

/**
 * Save one WebUI editor export into `<outputDir>/edited/`, streaming the raw
 * request body to disk with a size cap, then record it in the edit ledger.
 */
async function saveEditedMedia(outputDir: string, request: IncomingMessage, response: ServerResponse): Promise<void> {
  const mediaType = String(request.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase()
  const ext = mediaTypeExt(mediaType)
  if (ext === undefined) {
    response.writeHead(415, { 'content-type': 'application/json; charset=utf-8' })
    response.end(JSON.stringify({ error: `Unsupported media type: ${mediaType}` }))
    return
  }
  const nameHint = String(request.headers['x-directorx-name'] ?? 'edit')
  const stem = slugify(nameHint, 40)
  const dir = join(resolve(process.cwd(), outputDir), EDIT_SUBDIR)
  await mkdir(dir, { recursive: true })
  const stamp = new Date().toISOString().replaceAll(':', '-').replace(/\.\d+Z$/, 'Z')
  const name = `${stamp}-${stem}.${ext}`
  const path = join(dir, name)
  const cap = byteCapStream(MAX_MEDIA_BYTES)
  try {
    await pipeline(request, cap.stream, createWriteStream(path))
  } catch (error) {
    await rm(path, { force: true }).catch(() => {})
    const tooLarge = error instanceof Error && /exceeds the/.test(error.message)
    response.writeHead(tooLarge ? 413 : 400, { 'content-type': 'application/json; charset=utf-8' })
    response.end(JSON.stringify({ error: error instanceof Error ? error.message : 'save failed' }))
    return
  }
  const bytes = cap.size()
  await new DirectorxEditLedger(outputDir).append({ at: Date.now(), path, mediaType, bytes, name }).catch(() => {})
  response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
  response.end(JSON.stringify({ path, bytes, mediaType, name }))
}

/**
 * Register the `/directorx/media` route on the DSH web server (when present).
 * GET/HEAD stream one file from the configured output directory with range
 * support so `<video>`/`<audio>` elements can seek; POST saves a WebUI editor
 * export into `edited/`. Registered without `webServer` (a non-web profile)
 * this is a no-op.
 * @returns disposer removing the route.
 */
export function registerMediaRoute(ctx: Context, getOutputDir: () => string): () => void {
  const webServer = ctx.get('webServer') as
    | { register(route: { kind: 'exact' | 'prefix'; path: string; handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void> }): () => void }
    | undefined
  if (webServer === undefined) return () => {}

  return webServer.register({
    kind: 'exact',
    path: MEDIA_ROUTE_PATH,
    handler: async (request, response) => {
      if (isCrossOrigin(request)) {
        response.writeHead(403)
        response.end('forbidden')
        return
      }
      if (request.method === 'POST') {
        await saveEditedMedia(getOutputDir(), request, response)
        return
      }
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.writeHead(405)
        response.end('method not allowed')
        return
      }
      try {
        const requested = parseMediaQuery(request.url)
        if (requested === undefined) {
          response.writeHead(400)
          response.end('missing path')
          return
        }
        const info = await inspectMediaFile(getOutputDir(), requested)
        const range = parseRangeHeader(request.headers.range, info.size)
        const length = range === undefined ? info.size : range.end - range.start + 1
        response.writeHead(range === undefined ? 200 : 206, {
          'content-type': info.mediaType,
          'content-length': length,
          'accept-ranges': 'bytes',
          'cache-control': 'no-store',
          ...(range === undefined ? {} : { 'content-range': `bytes ${range.start}-${range.end}/${info.size}` }),
        })
        if (request.method === 'HEAD') {
          response.end()
          return
        }
        createReadStream(info.path, range === undefined ? undefined : { start: range.start, end: range.end }).pipe(response)
      } catch {
        if (!response.headersSent) {
          response.writeHead(404)
          response.end('not found')
        } else {
          response.destroy()
        }
      }
    },
  })
}

/**
 * Register the `/directorx/media/edits` route (GET) listing the recent WebUI
 * editor exports so the dock can show its own history. No-op without `webServer`.
 */
export function registerMediaEditsRoute(ctx: Context, getOutputDir: () => string): () => void {
  const webServer = ctx.get('webServer') as
    | { register(route: { kind: 'exact' | 'prefix'; path: string; handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void> }): () => void }
    | undefined
  if (webServer === undefined) return () => {}

  return webServer.register({
    kind: 'exact',
    path: MEDIA_EDITS_ROUTE_PATH,
    handler: async (request, response) => {
      if (isCrossOrigin(request)) {
        response.writeHead(403)
        response.end('forbidden')
        return
      }
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.writeHead(405)
        response.end('method not allowed')
        return
      }
      const edits = await new DirectorxEditLedger(getOutputDir()).list(20)
      response.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
      response.end(JSON.stringify({ edits }))
    },
  })
}

/**
 * Register the `/directorx/media/tasks` route (GET): recent generation-task
 * states, latest transition per task, newest first. The video generation
 * cards poll this while a call is running for live progress.
 */
export function registerMediaTasksRoute(ctx: Context, getOutputDir: () => string): () => void {
  const webServer = ctx.get('webServer') as
    | { register(route: { kind: 'exact' | 'prefix'; path: string; handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void> }): () => void }
    | undefined
  if (webServer === undefined) return () => {}

  return webServer.register({
    kind: 'exact',
    path: MEDIA_TASKS_ROUTE_PATH,
    handler: async (request, response) => {
      if (isCrossOrigin(request)) {
        response.writeHead(403)
        response.end('forbidden')
        return
      }
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.writeHead(405)
        response.end('method not allowed')
        return
      }
      const records = await new DirectorxTaskLedger(getOutputDir()).list()
      const latestByTask = new Map<string, (typeof records)[number]>()
      for (const record of records) latestByTask.set(record.taskId, record)
      const tasks = [...latestByTask.values()].reverse().slice(0, 20)
      response.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
      response.end(JSON.stringify({ tasks }))
    },
  })
}

/**
 * Register the `/directorx/media/list` route (GET): media files under the
 * output dir (top level, edited/, frames/, transcripts/), one level deep —
 * the canvas "add media" picker and the dock media library consume it.
 */
export function registerMediaListRoute(ctx: Context, getOutputDir: () => string): () => void {
  const webServer = ctx.get('webServer') as
    | { register(route: { kind: 'exact' | 'prefix'; path: string; handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void> }): () => void }
    | undefined
  if (webServer === undefined) return () => {}

  return webServer.register({
    kind: 'exact',
    path: MEDIA_LIST_ROUTE_PATH,
    handler: async (request, response) => {
      if (isCrossOrigin(request)) {
        response.writeHead(403)
        response.end('forbidden')
        return
      }
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.writeHead(405)
        response.end('method not allowed')
        return
      }
      try {
        const root = resolve(process.cwd(), getOutputDir())
        const files: Array<{ path: string; name: string; mediaType: string; size: number }> = []
        const scan = async (dir: string, depth: number) => {
          if (depth > 1) return
          let entries
          try {
            entries = await readdir(dir, { withFileTypes: true })
          } catch {
            return
          }
          for (const entry of entries) {
            const full = join(dir, entry.name)
            if (entry.isDirectory()) {
              if (entry.name === 'frames' || entry.name === 'edited' || entry.name === 'transcripts') await scan(full, depth + 1)
              continue
            }
            const info = await stat(full).catch(() => undefined)
            if (info === undefined || !info.isFile()) continue
            const mediaType = mimeForPath(full)
            if (mediaType === 'application/octet-stream') continue
            files.push({ path: full, name: entry.name, mediaType, size: info.size })
          }
        }
        await scan(root, 0)
        files.sort((a, b) => b.size - a.size)
        response.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
        response.end(JSON.stringify({ files: files.slice(0, 200) }))
      } catch (error) {
        response.writeHead(500, { 'content-type': 'application/json; charset=utf-8' })
        response.end(JSON.stringify({ error: error instanceof Error ? error.message : 'list failed' }))
      }
    },
  })
}

/**
 * Register the `/directorx/canvas` route: GET returns the canvas document,
 * PUT persists a full document with optional optimistic-concurrency
 * (`?expectedUpdatedAt=<ms>`; 409 on conflict).
 */
export function registerCanvasRoute(ctx: Context, getOutputDir: () => string): () => void {
  const webServer = ctx.get('webServer') as
    | { register(route: { kind: 'exact' | 'prefix'; path: string; handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void> }): () => void }
    | undefined
  if (webServer === undefined) return () => {}

  return webServer.register({
    kind: 'exact',
    path: CANVAS_ROUTE_PATH,
    handler: async (request, response) => {
      if (isCrossOrigin(request)) {
        response.writeHead(403)
        response.end('forbidden')
        return
      }
      const store = new DirectorxCanvasStore(getOutputDir())
      const send = (status: number, body: unknown) => {
        response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
        response.end(JSON.stringify(body))
      }
      try {
        if (request.method === 'GET' || request.method === 'HEAD') {
          const doc = await store.read()
          if (request.method === 'HEAD') { response.writeHead(200); response.end(); return }
          send(200, doc)
          return
        }
        if (request.method === 'PUT') {
          const chunks: Buffer[] = []
          for await (const chunk of request) chunks.push(chunk as Buffer)
          const raw = Buffer.concat(chunks).toString('utf8')
          const body = JSON.parse(raw) as { nodes?: unknown[]; edges?: unknown[]; updatedAt?: number; title?: string }
          const queryStart = request.url?.indexOf('?') ?? -1
          const expectedRaw = queryStart >= 0 && request.url !== undefined
            ? new URLSearchParams(request.url.slice(queryStart + 1)).get('expectedUpdatedAt')
            : null
          const expectedUpdatedAt = expectedRaw !== null && expectedRaw !== '' && Number.isFinite(Number(expectedRaw)) ? Number(expectedRaw) : undefined
          const doc = await store.write(
            { version: 1, updatedAt: body.updatedAt ?? 0, ...(typeof body.title === 'string' && body.title !== '' ? { title: body.title } : {}), nodes: (body.nodes ?? []) as unknown as CanvasDocument['nodes'], edges: (body.edges ?? []) as unknown as CanvasDocument['edges'] },
            expectedUpdatedAt,
          )
          send(200, doc)
          return
        }
        response.writeHead(405)
        response.end('method not allowed')
      } catch (error) {
        const code = (error as { code?: string } | null)?.code
        send(code === 'CANVAS_CONFLICT' ? 409 : 400, { error: error instanceof Error ? error.message : String(error), code })
      }
    },
  })
}
