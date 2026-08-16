import { createReadStream, existsSync } from 'node:fs'
import { mkdir, readFile, readdir, rm, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createWriteStream } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { join, resolve } from 'node:path'
import type { Context } from 'cordis'
import { ProposalStore } from './proposals.ts'
import { CanvasIntentStore, formatDshCanvasPrompt } from './canvas-intent.ts'
import { CharacterStore } from './characters.ts'

function sendJsonLocal(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { 'content-type': 'application/json' })
  response.end(JSON.stringify(body))
}

async function readBodyLocal(request: IncomingMessage, maxBytes: number): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = []
  let total = 0
  for await (const chunk of request) {
    const buffer = typeof chunk === 'string' ? Buffer.from(chunk) : Buffer.from(chunk as ArrayBuffer)
    total += buffer.length
    if (total > maxBytes) throw new Error('body too large')
    chunks.push(buffer)
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>
  } catch {
    return {}
  }
}
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
export interface MediaFileEntry {
  path: string
  name: string
  mediaType: string
  size: number
}

/** 扫描输出目录下的媒体资产（顶层 + edited/frames/transcripts 一层）。 */
export async function listMediaFiles(outputDir: string): Promise<MediaFileEntry[]> {
  const root = resolve(process.cwd(), outputDir)
  const files: MediaFileEntry[] = []
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
  return files.slice(0, 200)
}

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
        const files = await listMediaFiles(getOutputDir())
        response.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
        response.end(JSON.stringify({ files }))
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

/** Serve vendored WASM runtime assets (transformers.js) from the plugin itself,
 * so the WebUI never depends on third-party CDNs (CSP-safe, offline-friendly).
 */
const VENDOR_FILES: Record<string, string> = {
  'transformers.min.js': 'text/javascript',
  'ort-wasm-simd-threaded.jsep.mjs': 'text/javascript',
  'ort-wasm-simd-threaded.jsep.wasm': 'application/wasm',
}

export function registerVendorRoute(ctx: Context): () => void {
  const webServer = ctx.get('webServer') as
    | { register(route: { kind: 'exact' | 'prefix'; path: string; handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void> }): () => void }
    | undefined
  if (webServer === undefined) return () => {}
  // lib/vendor ships with the package; the repo-root vendor/ is a fallback
  // for development installs that link the package directory directly.
  const vendorDirs = [
    fileURLToPath(new URL('./vendor/', import.meta.url)),
    fileURLToPath(new URL('../vendor/', import.meta.url)),
  ]
  const serve = async (name: string, contentType: string, response: ServerResponse) => {
    try {
      const dir = vendorDirs.find(candidate => existsSync(join(candidate, name)))
      if (dir === undefined) throw new Error(`vendor asset ${name} missing`)
      const data = await readFile(join(dir, name))
      response.writeHead(200, {
        'content-type': contentType,
        'cache-control': 'public, max-age=86400',
        'cross-origin-resource-policy': 'same-origin',
      })
      response.end(data)
    } catch (cause) {
      response.writeHead(500, { 'content-type': 'text/plain' })
      response.end(`vendor serve failed: ${cause instanceof Error ? cause.message : String(cause)}`)
    }
  }
  const disposers: Array<() => void> = []
  for (const [name, contentType] of Object.entries(VENDOR_FILES)) {
    disposers.push(webServer.register({
      kind: 'exact',
      path: `/directorx/vendor/${name}`,
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
        await serve(name, contentType, response)
      },
    }))
  }
  return () => {
    for (const dispose of disposers) dispose()
  }
}

/** POST /directorx/canvas/reset: clear the canvas after backing it up. */
export function registerCanvasResetRoute(ctx: Context, getOutputDir: () => string): () => void {
  const webServer = ctx.get('webServer') as
    | { register(route: { kind: 'exact' | 'prefix'; path: string; handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void> }): () => void }
    | undefined
  if (webServer === undefined) return () => {}
  return webServer.register({
    kind: 'exact',
    path: '/directorx/canvas/reset',
    handler: async (request, response) => {
      if (isCrossOrigin(request)) {
        response.writeHead(403)
        response.end('forbidden')
        return
      }
      if (request.method !== 'POST') {
        response.writeHead(405)
        response.end('method not allowed')
        return
      }
      try {
        const store = new DirectorxCanvasStore(resolve(process.cwd(), getOutputDir()))
        const doc = await store.reset()
        response.writeHead(200, { 'content-type': 'application/json' })
        response.end(JSON.stringify(doc))
      } catch (error) {
        response.writeHead(400, { 'content-type': 'application/json' })
        response.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }))
      }
    },
  })
}

export function registerCanvasSnapshotsRoute(ctx: Context, getOutputDir: () => string): () => void {
  const webServer = ctx.get('webServer') as
    | { register(route: { kind: 'exact' | 'prefix'; path: string; handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void> }): () => void }
    | undefined
  if (webServer === undefined) return () => {}
  return webServer.register({
    kind: 'exact',
    path: '/directorx/canvas/snapshots',
    handler: async (request, response) => {
      if (isCrossOrigin(request)) {
        response.writeHead(403)
        response.end('forbidden')
        return
      }
      const store = new DirectorxCanvasStore(getOutputDir())
      if (request.method === 'POST') {
        const snap = await store.snapshot('手动检查点')
        sendJsonLocal(response, 200, { ok: true, snapshot: snap })
        return
      }
      sendJsonLocal(response, 200, { snapshots: await store.readSnapshotsIndex() })
    },
  })
}

export function registerCanvasRestoreRoute(ctx: Context, getOutputDir: () => string): () => void {
  const webServer = ctx.get('webServer') as
    | { register(route: { kind: 'exact' | 'prefix'; path: string; handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void> }): () => void }
    | undefined
  if (webServer === undefined) return () => {}
  return webServer.register({
    kind: 'exact',
    path: '/directorx/canvas/restore',
    handler: async (request, response) => {
      if (isCrossOrigin(request)) {
        response.writeHead(403)
        response.end('forbidden')
        return
      }
      if (request.method !== 'POST') {
        response.writeHead(405)
        response.end('method not allowed')
        return
      }
      const body = await readBodyLocal(request, 16 * 1024) as { id?: unknown }
      const id = typeof body.id === 'string' ? body.id : ''
      if (id === '') {
        sendJsonLocal(response, 400, { ok: false, message: 'snapshot id 必填' })
        return
      }
      try {
        const store = new DirectorxCanvasStore(getOutputDir())
        const doc = await store.restoreSnapshot(id)
        sendJsonLocal(response, 200, { ok: true, updatedAt: doc.updatedAt })
      } catch {
        sendJsonLocal(response, 404, { ok: false, message: '快照不存在或已损坏' })
      }
    },
  })
}

/** POST /directorx/canvas/intent: enqueue a DSH-owned generate directive (no canvas mutation). */
export function registerCanvasIntentRoute(ctx: Context, getOutputDir: () => string): () => void {
  const webServer = ctx.get('webServer') as
    | { register(route: { kind: 'exact' | 'prefix'; path: string; handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void> }): () => void }
    | undefined
  if (webServer === undefined) return () => {}
  return webServer.register({
    kind: 'exact',
    path: '/directorx/canvas/intent',
    handler: async (request, response) => {
      if (isCrossOrigin(request)) {
        response.writeHead(403)
        response.end('forbidden')
        return
      }
      const store = new CanvasIntentStore(getOutputDir())
      if (request.method === 'GET' || request.method === 'HEAD') {
        const intents = await store.list()
        sendJsonLocal(response, 200, { intents })
        return
      }
      if (request.method !== 'POST') {
        response.writeHead(405)
        response.end('method not allowed')
        return
      }
      const body = await readBodyLocal(request, 64 * 1024)
      if (body.claim === true) {
        const intent = await store.takeNext()
        sendJsonLocal(response, 200, {
          ok: true,
          intent,
          ...(intent !== null ? { prompt: formatDshCanvasPrompt(intent) } : {}),
        })
        return
      }
      const ackStatus = body.status
      if (typeof body.id === 'string' && body.id !== '' && (ackStatus === 'taken' || ackStatus === 'done' || ackStatus === 'cancelled')) {
        try {
          const intent = await store.ack(body.id, ackStatus)
          sendJsonLocal(response, 200, { ok: true, intent })
        } catch (cause) {
          const message = cause instanceof Error ? cause.message : String(cause)
          sendJsonLocal(response, /cannot move/.test(message) ? 409 : 404, { ok: false, message })
        }
        return
      }
      const kind = body.kind === 'image' || body.kind === 'video' ? body.kind : ''
      const prompt = typeof body.prompt === 'string' ? body.prompt : ''
      if (kind === '' || prompt.trim() === '') {
        sendJsonLocal(response, 400, { ok: false, message: 'kind 与 prompt 必填' })
        return
      }
      try {
        const intent = await store.enqueue({
          kind,
          prompt,
          ...(typeof body.sourceId === 'string' && body.sourceId !== '' ? { sourceId: body.sourceId } : {}),
          ...(Array.isArray(body.selectedIds) ? { selectedIds: body.selectedIds as string[] } : {}),
          ...(Array.isArray(body.characters) ? { characters: body.characters as string[] } : {}),
        })
        sendJsonLocal(response, 200, { ok: true, intent, prompt: formatDshCanvasPrompt(intent) })
      } catch (cause) {
        sendJsonLocal(response, 400, { ok: false, message: cause instanceof Error ? cause.message : String(cause) })
      }
    },
  })
}

/** 提案面板路由：画布顶栏显示待批准提案并可批准/拒绝（人机确认环的 UI 侧）。 */
export function registerProposalsRoute(ctx: Context, getOutputDir: () => string): () => void {
  const webServer = ctx.get('webServer') as
    | { register(route: { kind: 'exact' | 'prefix'; path: string; handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void> }): () => void }
    | undefined
  if (webServer === undefined) return () => {}
  return webServer.register({
    kind: 'exact',
    path: '/directorx/proposals',
    handler: async (request, response) => {
      if (isCrossOrigin(request)) {
        response.writeHead(403)
        response.end('forbidden')
        return
      }
      const store = new ProposalStore(getOutputDir())
      if (request.method === 'POST') {
        const body = await readBodyLocal(request, 64 * 1024)
        const kind = body.kind === 'image' || body.kind === 'video' || body.kind === 'audio' ? body.kind : ''
        const prompt = typeof body.prompt === 'string' ? body.prompt : ''
        if (kind === '' || prompt.trim() === '') {
          sendJsonLocal(response, 400, { ok: false, message: 'kind 与 prompt 必填' })
          return
        }
        try {
          const proposal = await store.propose({
            kind,
            prompt: prompt.slice(0, 2000),
            count: typeof body.count === 'number' && Number.isFinite(body.count) ? body.count : 1,
            ...(typeof body.model === 'string' && body.model !== '' ? { model: body.model.slice(0, 80) } : {}),
            ...(typeof body.size === 'string' && body.size !== '' ? { size: body.size.slice(0, 40) } : {}),
            ...(typeof body.duration === 'number' && Number.isFinite(body.duration) ? { duration: body.duration } : {}),
            ...(typeof body.note === 'string' && body.note !== '' ? { note: body.note.slice(0, 400) } : {}),
            ...(typeof body.canvasNodeId === 'string' && body.canvasNodeId !== '' ? { canvasNodeId: body.canvasNodeId.slice(0, 100) } : {}),
            ...(typeof body.estimatedCost === 'string' && body.estimatedCost !== '' ? { estimatedCost: body.estimatedCost.slice(0, 80) } : {}),
          })
          sendJsonLocal(response, 200, { ok: true, proposal })
        } catch (cause) {
          sendJsonLocal(response, 400, { ok: false, message: cause instanceof Error ? cause.message : String(cause) })
        }
        return
      }
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.writeHead(405)
        response.end('method not allowed')
        return
      }
      const ledger = await store.read()
      sendJsonLocal(response, 200, { proposals: ledger.proposals })
    },
  })
}

export function registerProposalUpdateRoute(ctx: Context, getOutputDir: () => string): () => void {
  const webServer = ctx.get('webServer') as
    | { register(route: { kind: 'exact' | 'prefix'; path: string; handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void> }): () => void }
    | undefined
  if (webServer === undefined) return () => {}
  return webServer.register({
    kind: 'exact',
    path: '/directorx/proposals/update',
    handler: async (request, response) => {
      if (isCrossOrigin(request)) {
        response.writeHead(403)
        response.end('forbidden')
        return
      }
      if (request.method !== 'POST') {
        response.writeHead(405)
        response.end('method not allowed')
        return
      }
      const body = await readBodyLocal(request, 64 * 1024) as { id?: unknown; status?: unknown; reason?: unknown; prompt?: unknown }
      const id = typeof body.id === 'string' ? body.id : ''
      const status = body.status === 'approved' || body.status === 'rejected' ? body.status : null
      if (id === '' || status === null) {
        sendJsonLocal(response, 400, { ok: false, message: 'id 与 status(approved/rejected) 必填' })
        return
      }
      const store = new ProposalStore(getOutputDir())
      const updated = await store.update(id, status, { ...(typeof body.reason === 'string' && body.reason !== '' ? { rejectReason: body.reason.slice(0, 200) } : {}), ...(typeof body.prompt === 'string' && body.prompt !== '' ? { prompt: body.prompt.slice(0, 2000) } : {}) })
      if (status === 'approved') {
        try {
          const canvas = new DirectorxCanvasStore(getOutputDir())
          await canvas.snapshot(`proposal-${id}`)
        } catch {
          // 快照失败不阻塞批准。
        }
      }
      sendJsonLocal(response, 200, { ok: true, proposal: updated })
    },
  })
}

/** GET/POST /directorx/characters: subject-consistency library (not canvas mutation). */
export function registerCharactersRoute(ctx: Context, getOutputDir: () => string): () => void {
  const webServer = ctx.get('webServer') as
    | { register(route: { kind: 'exact' | 'prefix'; path: string; handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void> }): () => void }
    | undefined
  if (webServer === undefined) return () => {}
  return webServer.register({
    kind: 'exact',
    path: '/directorx/characters',
    handler: async (request, response) => {
      if (isCrossOrigin(request)) {
        response.writeHead(403)
        response.end('forbidden')
        return
      }
      const store = new CharacterStore(getOutputDir())
      if (request.method === 'GET' || request.method === 'HEAD') {
        sendJsonLocal(response, 200, { characters: await store.list() })
        return
      }
      if (request.method !== 'POST') {
        response.writeHead(405)
        response.end('method not allowed')
        return
      }
      const body = await readBodyLocal(request, 64 * 1024)
      const name = typeof body.name === 'string' ? body.name : ''
      if (name.trim() === '') {
        sendJsonLocal(response, 400, { ok: false, message: 'name 必填' })
        return
      }
      if (body.remove === true) {
        try {
          await store.remove(name)
          sendJsonLocal(response, 200, { ok: true })
        } catch (cause) {
          sendJsonLocal(response, 404, { ok: false, message: cause instanceof Error ? cause.message : String(cause) })
        }
        return
      }
      const refPath = typeof body.refPath === 'string' ? body.refPath : ''
      try {
        const character = await store.register({
          name,
          refPath,
          ...(typeof body.description === 'string' ? { description: body.description } : {}),
          ...(typeof body.outfit === 'string' ? { outfit: body.outfit } : {}),
          ...(typeof body.props === 'string' ? { props: body.props } : {}),
        })
        sendJsonLocal(response, 200, { ok: true, character })
      } catch (cause) {
        sendJsonLocal(response, 400, { ok: false, message: cause instanceof Error ? cause.message : String(cause) })
      }
    },
  })
}

