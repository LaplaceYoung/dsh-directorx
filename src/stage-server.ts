/**
 * 3D 导演台服务端：原版舞台应用的 DSH 宿主路由。
 *
 * 职责：
 * - /directorx/stage/ 静态伺服（lib/stage 内的打包产物）。
 * - /directorx/stage/api/* 承载上传、takes、agent 事件总线（SSE + invoke/result）、
 *   VCam 启动器。live 工具打向已打开的舞台页，project 工具落盘到引擎服务。
 * - 舞台数据统一落在 <outputDir>/director-stage/ 下。
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join, resolve, sep } from 'node:path'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import { resolveOutputDir } from './support.ts'
import { directorxWeb } from './media-server.ts'
import { DirectorService } from './director/mcp-server/service.ts'
import { ProjectRepository } from './director/mcp-server/repository.ts'
import { AGENT_PROMPTS, AGENT_TOOL_GROUPS, findAgentTool, listAgentTools } from './director/agent/tool-catalog.ts'
import { bodiesFromScene, parseBlockingDsl, semanticIssues, solveLayout, type LayoutRelation } from './director/agent/layout.ts'
import { expandSceneOperations, needsSceneState, pickSubject, type LookPayload } from './director/agent/expand-ops.ts'
import { deleteTake, listTakes, newTakeId, readTake, takePaths, writeTake, type TakeRecord } from './director/agent/takes-store.ts'
import { coverageCameras } from './director/optics/coverage.ts'
import { angleCameras } from './director/optics/angles.ts'
import { framingIssues } from './director/optics/framing.ts'
import { parsePose, placeOperations } from './director/optics/place.ts'
import { shotCampathDsl } from './director/optics/shots.ts'
import { parseTimeToMs, splitAtCuts } from './director/timeline/trim.ts'
import { captureFrameFile, concatMediaFiles, detectCutsMs, probeDurationMs, trimMediaFile } from './director/timeline/ffmpeg-trim.ts'
import { captureSeekMs, concatNormalizeGraph } from './director/timeline/playlist.ts'
import type { DirectorxSettings } from './config.ts'

export const STAGE_BASE = '/directorx/stage'
export const STAGE_SNAPSHOT_FILE = 'director-stage-latest.png'
const FILES_PREFIX = `${STAGE_BASE}/files/`
const MAX_BODY_BYTES = 64 * 1024 * 1024

type Json = Record<string, unknown>

export function stageProjectRoot(outputDir: string): string {
  return join(resolveOutputDir(outputDir), 'director-stage')
}

export function stageNodeRoot(outputDir: string, nodeId?: string | null): string {
  const base = stageProjectRoot(outputDir)
  if (nodeId === undefined || nodeId === null || nodeId === '') return base
  const safe = nodeId.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 80)
  return join(base, safe === '' ? 'default' : safe)
}

function publicDir(): string {
  const dir = dirname(fileURLToPath(import.meta.url))
  const next = join(dir, 'stage')
  return existsSync(next) ? next : join(dir, '..', 'lib', 'stage')
}

function asRecord(value: unknown): Json {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Json : {}
}

async function readJson(request: IncomingMessage): Promise<Json> {
  const chunks: Buffer[] = []
  let total = 0
  for await (const chunk of request) {
    const buffer = typeof chunk === 'string' ? Buffer.from(chunk) : Buffer.from(chunk as ArrayBuffer)
    total += buffer.length
    if (total > MAX_BODY_BYTES) throw new Error('stage request body too large')
    chunks.push(buffer)
  }
  try {
    return asRecord(JSON.parse(Buffer.concat(chunks).toString('utf8')))
  } catch {
    throw new Error('invalid JSON body')
  }
}

function readBuffer(request: IncomingMessage): Promise<Buffer> {
  const { promise, resolve: done, reject } = Promise.withResolvers<Buffer>()
  const chunks: Buffer[] = []
  let total = 0
  request.on('data', (chunk: Buffer) => {
    total += chunk.length
    if (total > MAX_BODY_BYTES) {
      reject(new Error('stage upload too large'))
      return
    }
    chunks.push(chunk)
  })
  request.on('end', () => done(Buffer.concat(chunks)))
  request.on('error', reject)
  return promise
}

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  response.end(JSON.stringify(body))
}

function extractFormFile(buffer: Buffer, contentType: string): { name: string; data: Buffer } | null {
  if (!/boundary=/i.test(contentType)) return null
  const raw = buffer.toString('latin1')
  const name = /filename="([^"]+)"/i.exec(raw)?.[1]?.replace(/[^A-Za-z0-9._-]/g, '_') ?? `capture-${Date.now()}.jpg`
  const start = raw.indexOf('\r\n\r\n')
  const end = raw.lastIndexOf('\r\n--')
  if (start < 0 || end <= start) return null
  return { name, data: Buffer.from(raw.slice(start + 4, end), 'latin1') }
}

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.glb': 'model/gltf-binary',
  '.cube': 'text/plain; charset=utf-8',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.wasm': 'application/wasm',
  '.map': 'application/json; charset=utf-8',
}

function staticPath(base: string, rel: string): string | undefined {
  const cleaned = rel.replace(/^\/+/, '').split('?')[0]
  const full = resolve(join(base, cleaned === '' ? 'index.html' : cleaned))
  if (full !== base && !full.startsWith(base + sep)) return undefined
  return full
}

function localFromPublic(root: string, relative: string): string | undefined {
  const token = relative.startsWith('/') ? relative : ''
  const uploads = join(root, 'uploads')
  const takes = join(root, 'takes')
  if (token.startsWith('/uploads/')) return join(uploads, basename(token))
  if (token.startsWith('/takes/')) return join(takes, basename(token))
  if (token.startsWith(`${FILES_PREFIX}uploads/`)) return join(uploads, basename(token))
  if (token.startsWith(`${FILES_PREFIX}takes/`)) return join(takes, basename(token))
  return undefined
}

function publicTake<T extends { jpeg?: string }>(take: T): T {
  if (typeof take.jpeg === 'string' && take.jpeg.startsWith('/takes/')) {
    return { ...take, jpeg: `${FILES_PREFIX}takes/${basename(take.jpeg)}` }
  }
  return take
}

export function latestStageSnapshot(outputDir: string): string | undefined {
  const marker = join(stageProjectRoot(outputDir), STAGE_SNAPSHOT_FILE)
  if (existsSync(marker)) return marker
  const candidates: Array<{ file: string; at: number }> = []
  for (const leaf of ['uploads', 'takes']) {
    const dir = join(stageProjectRoot(outputDir), leaf)
    if (!existsSync(dir)) continue
    for (const name of readdirSync(dir)) {
      if (!/\.(jpe?g|png|webp)$/i.test(name)) continue
      const file = join(dir, name)
      try {
        candidates.push({ file, at: statSync(file).mtimeMs })
      } catch {
        /* skip unreadable entries */
      }
    }
  }
  candidates.sort((a, b) => b.at - a.at)
  return candidates[0]?.file
}

type Pending = { resolve: (value: unknown) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }

class LiveTabs {
  private readonly clients = new Set<ServerResponse>()
  private readonly pending = new Map<string, Pending>()

  get count(): number { return this.clients.size }

  attach(request: IncomingMessage, response: ServerResponse): void {
    response.writeHead(200, {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
    })
    response.write(':\n\n')
    this.clients.add(response)
    const heartbeat = setInterval(() => {
      try { response.write(':\n\n') } catch { /* closed by client */ }
    }, 25000)
    request.on('close', () => {
      clearInterval(heartbeat)
      this.clients.delete(response)
    })
  }

  invoke(method: string, args: Json, timeoutMs: number): Promise<unknown> {
    const { promise, resolve: done, reject } = Promise.withResolvers<unknown>()
    if (this.clients.size === 0) {
      reject(new Error('no live stage connected — open the 3D 导演台 first'))
      return promise
    }
    const id = randomUUID()
    const timer = setTimeout(() => {
      this.pending.delete(id)
      reject(new Error('live stage timeout'))
    }, Math.max(3000, timeoutMs))
    this.pending.set(id, { resolve: done, reject, timer })
    const line = `data: ${JSON.stringify({ id, method, args })}\n\n`
    for (const client of this.clients) client.write(line)
    return promise
  }

  resolveResult(id: string, result: unknown, error: unknown): boolean {
    const wait = this.pending.get(id)
    if (wait === undefined) return false
    clearTimeout(wait.timer)
    this.pending.delete(id)
    if (error) wait.reject(new Error(String(error)))
    else wait.resolve(result)
    return true
  }
}

function attachUploadImage(outputDir: string, result: unknown): unknown {
  const attach = (item: Json): Json => {
    const relative = typeof item.path === 'string' ? item.path : typeof item.jpeg === 'string' ? item.jpeg : ''
    const disk = relative === '' ? undefined : localFromPublic(outputDir, relative)
    if (disk === undefined || !existsSync(disk)) return item
    try {
      return { ...item, image: { mimeType: 'image/jpeg', data: readFileSync(disk).toString('base64') } }
    } catch {
      return item
    }
  }
  const record = asRecord(result)
  if (typeof record.path === 'string') return attach(record)
  if (Array.isArray(record.frames)) record.frames = record.frames.map(item => attach(asRecord(item)))
  if (Array.isArray(record.sheets)) record.sheets = record.sheets.map(item => attach(asRecord(item)))
  if (Array.isArray(record.captures)) record.captures = record.captures.map(item => attach(asRecord(item)))
  return record.path || record.frames || record.sheets || record.captures ? record : result
}


function relationEdges(args: Json): LayoutRelation[] {
  const fromDsl = typeof args.dsl === 'string' ? parseBlockingDsl(args.dsl) : []
  const listed = Array.isArray(args.edges) ? args.edges : []
  const nested = Array.isArray(args.operations)
    ? args.operations.flatMap(item => {
      const op = asRecord(item)
      const extra = typeof op.dsl === 'string' ? parseBlockingDsl(op.dsl) : []
      const edges = Array.isArray(op.edges) ? op.edges as LayoutRelation[] : []
      if (op.type === 'set_relations' || op.type === 'solve_layout') return [...edges, ...extra]
      return extra
    })
    : []
  return [...fromDsl, ...listed as LayoutRelation[], ...nested]
}

function directorService(root: string): DirectorService {
  return new DirectorService(new ProjectRepository(root))
}

async function saveMarker(root: string, dataUrl: string): Promise<string> {
  const match = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl)
  if (match === null) throw new Error('snapshot requires a PNG or JPEG dataUrl')
  await mkdir(root, { recursive: true })
  const path = join(root, STAGE_SNAPSHOT_FILE)
  await writeFile(path, Buffer.from(match[2], 'base64'))
  return path
}

async function runPython(scriptHint: string, timeoutMs: number): Promise<{ ok: boolean; stdout: string; stderr: string; exitCode: number }> {
  if (!scriptHint.includes('vcam_launcher')) {
    return { ok: false, stdout: '', stderr: 'script not allowed', exitCode: 1 }
  }
  const root = publicDir()
  const python = process.env.DIRECTORX_VCAM_PYTHON
    ?? (existsSync(join(root, '.venv', 'bin', 'python3')) ? join(root, '.venv', 'bin', 'python3') : 'python3')
  const script = join(root, 'vcam', 'vcam_launcher.py')
  const { promise, resolve: done } = Promise.withResolvers<{ ok: boolean; stdout: string; stderr: string; exitCode: number }>()
  const child = spawn(python, [script], { cwd: root, env: { ...process.env, PYTHONUNBUFFERED: '1' } })
  let stdout = ''
  let stderr = ''
  const killTimer = setTimeout(() => child.kill('SIGTERM'), Math.max(8000, timeoutMs))
  child.stdout.on('data', chunk => { stdout += String(chunk) })
  child.stderr.on('data', chunk => { stderr += String(chunk) })
  child.on('error', error => {
    clearTimeout(killTimer)
    done({ ok: false, stdout: '', stderr: error.message, exitCode: 1 })
  })
  child.on('close', code => {
    clearTimeout(killTimer)
    done({ ok: (code ?? 1) === 0, stdout, stderr, exitCode: code ?? 1 })
  })
  return promise
}

export function registerStageRoutes(ctx: Context, getSettings: () => DirectorxSettings): () => void {
  const webServer = directorxWeb(ctx)
  if (webServer === undefined) return () => {}
  const tabs = new LiveTabs()
  const outputDir = () => getSettings().outputDir

  const applyLook = async (look: LookPayload | null) => {
    if (!look) return null
    const { plant: _plant, ...payload } = look
    const has = payload.rig || payload.lights.length || payload.remove.length || payload.lookAt
      || payload.exposure != null || payload.lut || payload.ibl != null || payload.dof != null
      || payload.focusPlane != null || payload.peaking != null
      || payload.kelvin != null || payload.brightness != null || payload.key || payload.rim != null
      || payload.hdri || payload.azimuth != null
    if (!has) return null
    return tabs.invoke('stage.look', payload as Json, 15000).catch((error: Error) => ({ ok: false, error: error.message }))
  }

  const applyPlant = async (look: LookPayload | null, edges: LayoutRelation[]) => {
    const ids = new Set<string>()
    for (const id of look?.plant?.ids || []) ids.add(id)
    for (const edge of edges) {
      if (edge.rel === 'sit_on' || edge.rel === 'on_ground') ids.add(edge.a)
    }
    if (!look?.plant && ids.size === 0) return null
    const args: Json = { action: 'plant' }
    if (ids.size > 0) args.ids = [...ids]
    if (look?.plant?.groundY != null) args.groundY = look.plant.groundY
    return tabs.invoke('stage.contact', args, 15000).catch((error: Error) => ({ ok: false, error: error.message }))
  }

  return webServer.register({
    kind: 'prefix',
    path: STAGE_BASE,
    async handler(request, response) {
      const url = new URL(request.url ?? '/', 'http://directorx.local')
      const rest = url.pathname.startsWith(STAGE_BASE) ? url.pathname.slice(STAGE_BASE.length) || '/' : url.pathname
      const method = request.method ?? 'GET'
      const dataRoot = stageNodeRoot(outputDir(), url.searchParams.get('node') ?? '')
      const uploadsDir = join(dataRoot, 'uploads')
      const takesDir = join(dataRoot, 'takes')

      if (rest === '/api/upload' && method === 'POST') {
        try {
          const file = extractFormFile(await readBuffer(request), String(request.headers['content-type'] ?? ''))
          if (file === null) { sendJson(response, 400, { ok: false, error: 'expected multipart file' }); return }
          await mkdir(uploadsDir, { recursive: true })
          const stored = `${Date.now()}-${file.name}`
          await writeFile(join(uploadsDir, stored), file.data)
          sendJson(response, 200, { ok: true, relative: `/uploads/${stored}`, path: `${FILES_PREFIX}uploads/${stored}`, name: stored })
        } catch (error) {
          sendJson(response, 400, { ok: false, error: error instanceof Error ? error.message : String(error) })
        }
        return
      }

      if (rest === '/api/takes' && method === 'GET') {
        sendJson(response, 200, { ok: true, takes: listTakes(takesDir).map(publicTake) })
        return
      }

      if (rest === '/api/takes' && method === 'POST') {
        try {
          const body = await readJson(request)
          if (body.composition == null) { sendJson(response, 400, { ok: false, error: 'take needs composition' }); return }
          const id = typeof body.id === 'string' && body.id !== '' ? body.id : newTakeId(typeof body.label === 'string' ? body.label : undefined)
          const files = takePaths(takesDir, id)
          let jpeg: string | undefined
          const sourceJpeg = typeof body.jpeg === 'string' ? body.jpeg : ''
          const srcPath = sourceJpeg === '' ? undefined : localFromPublic(dataRoot, sourceJpeg)
          if (srcPath !== undefined) {
            try {
              await copyFile(srcPath, files.jpeg)
              jpeg = files.jpegUrl
            } catch {
              jpeg = sourceJpeg.startsWith('/takes/') ? sourceJpeg : undefined
            }
          }
          const saved = writeTake(takesDir, {
            id,
            label: typeof body.label === 'string' && body.label.trim() !== '' ? body.label.trim() : id,
            createdAt: new Date().toISOString(),
            jpeg,
            look: body.look ? asRecord(body.look) : undefined,
            handheld: body.handheld ? asRecord(body.handheld) : undefined,
            composition: body.composition,
          } as TakeRecord)
          sendJson(response, 200, { ok: true, ...publicTake(saved) })
        } catch (error) {
          sendJson(response, 400, { ok: false, error: error instanceof Error ? error.message : String(error) })
        }
        return
      }

      const takeOne = /^\/api\/takes\/([^/]+)$/.exec(rest)
      if (takeOne) {
        const id = decodeURIComponent(takeOne[1])
        if (method === 'GET') {
          try {
            const take = readTake(takesDir, id)
            sendJson(response, 200, { ok: true, take: publicTake(take), ...publicTake(take) })
          } catch {
            sendJson(response, 404, { ok: false, error: `unknown take: ${id}` })
          }
          return
        }
        if (method === 'DELETE') {
          sendJson(response, 200, { ok: deleteTake(takesDir, id), id })
          return
        }
      }

      if (rest === '/api/agent/tools' && method === 'GET') {
        sendJson(response, 200, {
          tools: listAgentTools(url.searchParams.get('group') ?? undefined),
          groups: AGENT_TOOL_GROUPS,
          liveClients: tabs.count,
          prompts: AGENT_PROMPTS,
        })
        return
      }
      if (rest === '/api/agent/prompts' && method === 'GET') {
        sendJson(response, 200, { prompts: AGENT_PROMPTS })
        return
      }
      if (rest === '/api/agent/resources' && method === 'GET') {
        sendJson(response, 200, {
          resources: [
            { uri: 'director://project', name: 'File-backed previs project', mimeType: 'application/json' },
            { uri: 'director://catalog', name: 'Actor / prop / action / camera catalog', mimeType: 'application/json' },
            { uri: 'director://frame/current', name: 'Evaluated current frame', mimeType: 'application/json' },
          ],
        })
        return
      }
      if (rest === '/api/agent/resource' && method === 'GET') {
        try {
          const uri = url.searchParams.get('uri') ?? ''
          sendJson(response, 200, { ok: true, uri, result: await directorService(dataRoot).resource(uri) })
        } catch (error) {
          sendJson(response, 400, { ok: false, error: error instanceof Error ? error.message : String(error) })
        }
        return
      }
      if (rest === '/api/agent/events' && method === 'GET') {
        tabs.attach(request, response)
        return
      }
      if (rest === '/api/agent/result' && method === 'POST') {
        try {
          const body = await readJson(request)
          const id = String(body.id ?? '')
          if (!tabs.resolveResult(id, body.result, body.error)) {
            sendJson(response, 404, { ok: false, error: 'unknown request id' })
            return
          }
          sendJson(response, 200, { ok: true })
        } catch (error) {
          sendJson(response, 400, { ok: false, error: error instanceof Error ? error.message : String(error) })
        }
        return
      }

      if (rest === '/api/agent/invoke' && method === 'POST') {
        try {
          const body = await readJson(request)
          const name = String(body.method ?? body.name ?? '')
          let args = asRecord(body.args ?? body.arguments ?? {})
          const tool = findAgentTool(name)
          if (tool === undefined) { sendJson(response, 404, { ok: false, error: `unknown tool: ${name}` }); return }
          const timeoutMs = Number(body.timeoutMs) || 30000
          if (tool.backend === 'project') {
            sendJson(response, 200, { ok: true, result: await directorService(dataRoot).execute(name, args) })
            return
          }
          const result = await dispatchLive(name, args, timeoutMs, {
            outputDir: dataRoot,
            uploads: uploadsDir,
            takes: takesDir,
            tabs,
            applyLook,
            applyPlant,
          })
          sendJson(response, 200, { ok: true, result: attachUploadImage(dataRoot, result) })
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          sendJson(response, message.includes('timeout') ? 504 : 400, { ok: false, error: message })
        }
        return
      }

      if (rest === '/api/python/run' && method === 'POST') {
        try {
          const body = await readJson(request)
          sendJson(response, 200, await runPython(String(body.script ?? ''), Number(body.timeoutMs) || 25000))
        } catch (error) {
          sendJson(response, 400, { ok: false, stdout: '', stderr: error instanceof Error ? error.message : String(error), exitCode: 1 })
        }
        return
      }

      if (rest === '/api/generate/image' && method === 'POST') {
        sendJson(response, 501, { ok: false, error: 'stage image generation is not configured in this host; use directorx_generate_image' })
        return
      }

      if (rest === '/api/snapshot' && method === 'POST') {
        try {
          const body = await readJson(request)
          const path = await saveMarker(dataRoot, String(body.dataUrl ?? ''))
          sendJson(response, 200, { ok: true, path })
        } catch (error) {
          sendJson(response, 400, { ok: false, error: error instanceof Error ? error.message : String(error) })
        }
        return
      }

      if (rest.startsWith('/files/')) {
        const disk = localFromPublic(dataRoot, rest.replace(/^\/files/, ''))
        const fallback = localFromPublic(dataRoot, rest.replace(/^\/files/, '/'))
        const file = disk ?? fallback ?? localFromPublic(dataRoot, `/${rest.slice('/files/'.length)}`)
        if (file === undefined || !existsSync(file)) { response.writeHead(404); response.end('not found'); return }
        const ext = extname(file).toLowerCase()
        response.writeHead(200, { 'content-type': CONTENT_TYPES[ext] ?? 'application/octet-stream', 'cache-control': 'no-cache' })
        response.end(await readFile(file))
        return
      }

      const file = staticPath(publicDir(), rest)
      if (file === undefined || !existsSync(file) || !statSync(file).isFile()) {
        response.writeHead(404)
        response.end('not found')
        return
      }
      const ext = extname(file).toLowerCase()
      response.writeHead(200, { 'content-type': CONTENT_TYPES[ext] ?? 'application/octet-stream', 'cache-control': 'no-cache' })
      response.end(await readFile(file))
    },
  })
}

type LiveDispatch = {
  outputDir: string
  uploads: string
  takes: string
  tabs: LiveTabs
  applyLook: (look: LookPayload | null) => Promise<unknown>
  applyPlant: (look: LookPayload | null, edges: LayoutRelation[]) => Promise<unknown>
}

async function dispatchLive(name: string, args: Json, timeoutMs: number, ctx: LiveDispatch): Promise<unknown> {
  const invoke = (method: string, payload: Json, ms = timeoutMs) => ctx.tabs.invoke(method, payload, ms)
  const local = (token: string) => localFromPublic(ctx.outputDir, token)

  if (name === 'stage.take') {
    const action = String(args.action || 'list')
    if (action === 'list') return { takes: listTakes(ctx.takes).map(publicTake) }
    if (action === 'get' && typeof args.id === 'string') return { take: publicTake(readTake(ctx.takes, args.id)) }
    if (action === 'delete' && typeof args.id === 'string') return { ok: deleteTake(ctx.takes, args.id), id: args.id }
  }

  if (name === 'stage.trim') {
    const token = String(args.path || args.video || '')
    const disk = local(token)
    if (disk === undefined) throw new Error('stage.trim needs path=/uploads/…mp4')
    const sourceMs = await probeDurationMs(disk)
    const action = String(args.action || 'trim')
    if (action === 'probe') return { durationMs: sourceMs, path: token }
    if (action === 'smart') {
      const cuts = await detectCutsMs(disk)
      return { durationMs: sourceMs, cuts, spans: splitAtCuts(sourceMs, cuts), original: token }
    }
    const inMs = args.inMs != null ? parseTimeToMs(args.inMs, 0) : args.inS != null ? (typeof args.inS === 'number' ? Math.round(Number(args.inS) * 1000) : parseTimeToMs(args.inS, 0)) : 0
    const outMs = args.outMs != null ? parseTimeToMs(args.outMs, sourceMs) : args.outS != null ? (typeof args.outS === 'number' ? Math.round(Number(args.outS) * 1000) : parseTimeToMs(args.outS, sourceMs)) : sourceMs
    return { ...(await trimMediaFile(disk, ctx.uploads, inMs, outMs)), original: token, keptOriginal: true }
  }

  if (name === 'stage.capture_frame') {
    const token = String(args.path || args.video || '')
    const disk = local(token)
    if (disk === undefined) throw new Error('stage.capture_frame needs path=/uploads/…mp4')
    const sourceMs = await probeDurationMs(disk)
    const which = args.which === 'first' || args.which === 'last' || args.which === 'at' ? args.which : 'at'
    const atMs = args.atMs != null ? parseTimeToMs(args.atMs, 0) : args.atS != null ? (typeof args.atS === 'number' ? Math.round(Number(args.atS) * 1000) : parseTimeToMs(args.atS, 0)) : undefined
    const shot = await captureFrameFile(disk, ctx.uploads, captureSeekMs(which, sourceMs, atMs))
    return { ...shot, original: token, durationMs: sourceMs, keptOriginal: true }
  }

  if (name === 'stage.playlist') {
    const listed = Array.isArray(args.paths) ? args.paths.map(item => String(item)) : []
    const action = String(args.action || 'concat')
    if (action === 'preview') return { count: listed.length, filter: listed.length >= 2 ? concatNormalizeGraph(listed.length) : null }
    const disks = listed.map(token => {
      const disk = local(token)
      if (disk === undefined) throw new Error(`stage.playlist path must be /uploads/…mp4: ${token}`)
      return disk
    })
    return { ...(await concatMediaFiles(disks, ctx.uploads)), sources: listed, keptOriginal: true }
  }

  if (name === 'stage.place') {
    const operations = placeOperations({
      kind: typeof args.kind === 'string' ? args.kind : undefined,
      bodyType: typeof args.bodyType === 'string' ? args.bodyType : undefined,
      assetId: typeof args.assetId === 'string' ? args.assetId : undefined,
      pose: typeof args.pose === 'string' ? args.pose : undefined,
      heightM: typeof args.heightM === 'number' ? args.heightM : undefined,
      label: typeof args.label === 'string' ? args.label : undefined,
      position: args.position && typeof args.position === 'object' ? args.position as { x: number; y: number; z: number } : undefined,
    })
    const edit = asRecord(await invoke('scene.edit', { description: 'place', operations }, 20000))
    return { ...edit, operations }
  }

  if (name === 'stage.pose') {
    const pose = parsePose(typeof args.pose === 'string' ? args.pose : '')
    let id = typeof args.id === 'string' ? args.id : ''
    if (id === '') {
      const state = asRecord(await invoke('scene.get', {}, 15000))
      const selected = typeof state.selectedId === 'string' ? state.selectedId : ''
      const chars = Array.isArray(state.characters) ? state.characters as { id?: string }[] : []
      id = selected || String(chars[0]?.id || '')
    }
    if (id === '') throw new Error('stage.pose needs a character id')
    const edit = asRecord(await invoke('scene.edit', { description: `pose ${pose}`, operations: [{ type: 'set_pose', id, pose }] }, 15000))
    return { ...edit, id, pose }
  }

  if (name === 'stage.shot') {
    const recipe = String(args.recipe || args.id || '')
    const state = asRecord(await invoke('scene.get', {}, 15000))
    const target = pickSubject(bodiesFromScene(state as never), args.target ?? args.id)
    if (target === undefined) throw new Error('stage.shot needs a target character or prop')
    const dsl = shotCampathDsl(recipe, target.id)
    const expanded = expandSceneOperations([{ type: 'set_campath', dsl, label: recipe }], state)
    const edit = asRecord(await invoke('scene.edit', { description: `shot ${recipe}`, operations: expanded.operations }))
    return { ...edit, recipe, target: target.id, dsl }
  }

  if (name === 'stage.generate' || name === 'stage.retake' || name === 'stage.replace' || name === 'stage.extend') {
    throw new Error(`${name} is not configured in this host; use directorx_generate_image / directorx_generate_video`)
  }

  if (name === 'stage.import_asset' && typeof args.path === 'string' && args.url === undefined) {
    const resolved = resolve(String(args.path))
    const root = resolve(ctx.outputDir)
    if (!resolved.startsWith(root + sep) && !resolved.startsWith('/tmp/')) throw new Error('import path must be inside the project or /tmp')
    await mkdir(ctx.uploads, { recursive: true })
    const stored = `${Date.now()}-${(typeof args.name === 'string' ? args.name : basename(resolved)).replace(/[^A-Za-z0-9._-]/g, '_')}`
    await copyFile(resolved, join(ctx.uploads, stored))
    args = { ...args, url: `/uploads/${stored}` }
  }

  if (name === 'scene.coverage') {
    const state = asRecord(await invoke('scene.get', {}, 15000))
    const bodies = bodiesFromScene(state as never)
    const insert = String(args.set || '') === 'insert'
    const a = pickSubject(bodies, args.a ?? args.target)
    const b = insert ? undefined : pickSubject(bodies, args.b, a?.id)
    if (a === undefined || (!insert && b === undefined)) throw new Error(insert ? 'scene.coverage insert needs a target' : 'scene.coverage needs two characters')
    const shots = coverageCameras(a, b, {
      set: typeof args.set === 'string' ? args.set : 'dialogue',
      filmback: typeof args.filmback === 'string' ? args.filmback as never : undefined,
      holdS: typeof args.holdS === 'number' ? args.holdS : undefined,
      scale: typeof args.scale === 'string' ? args.scale : undefined,
    })
    const master = shots[0]
    const edit = asRecord(await invoke('scene.edit', {
      description: `coverage ${a.id.slice(0, 8)}${b ? ` ${b.id.slice(0, 8)}` : ''}`,
      operations: [
        { type: 'set_camera', position: master.pose.position, lookAt: master.pose.lookAt, fov: master.fov },
        ...shots.map(shot => ({ type: 'set_campath', dsl: shot.dsl, label: shot.label })),
      ],
    }))
    return { ...edit, coverage: shots.map(shot => ({ shot: shot.shot, label: shot.label, fov: shot.fov, focalLengthMm: shot.focalLengthMm, pose: shot.pose })) }
  }

  if (name === 'scene.angles') {
    const state = asRecord(await invoke('scene.get', {}, 15000))
    const bodies = bodiesFromScene(state as never)
    const a = pickSubject(bodies, args.target ?? args.a ?? args.id)
    if (a === undefined) throw new Error('scene.angles needs a target character or prop')
    const holdS = typeof args.holdS === 'number' ? args.holdS : 2
    const summary = asRecord(state.summary)
    const clipStartMs = Math.max(0, Number(summary.timelineDurationMs) || 0)
    const expanded = expandSceneOperations([{ type: 'add_angles', target: a.id, scale: args.scale, combo: args.combo, filmback: args.filmback, holdS, clipStartMs }], state)
    const shots = angleCameras(a, {
      scale: typeof args.scale === 'string' ? args.scale : undefined,
      combo: typeof args.combo === 'string' ? args.combo : undefined,
      filmback: typeof args.filmback === 'string' ? args.filmback : undefined,
      holdS,
      facingYawDeg: a.rotation?.y,
    })
    const front = shots[0]
    const operations = [
      ...(front ? [{ type: 'set_camera', position: front.pose.position, lookAt: front.pose.lookAt, fov: front.fov }] : []),
      ...expanded.operations,
    ]
    const validateOnly = args.validateOnly === true
    const edit = asRecord(await invoke('scene.edit', { description: `angles ${a.id.slice(0, 8)}`, operations, validateOnly }))
    let snapshot: unknown = null
    if (args.capture !== false && !validateOnly) {
      const atTimes = shots.map((_, index) => clipStartMs + index * holdS * 1000)
      snapshot = await invoke('scene.snapshot', { atTimes, layout: 'sheet' }, 60000).catch((error: Error) => ({ ok: false, error: error.message }))
    }
    return {
      ...edit,
      angles: shots.map(shot => ({ view: shot.view, label: shot.label, fov: shot.fov, focalLengthMm: shot.focalLengthMm, filmback: shot.filmback, pose: shot.pose })),
      lens: expanded.lens,
      snapshot,
    }
  }

  if (name === 'scene.solve_layout' || name === 'scene.edit') {
    const edges = relationEdges(args)
    if (name === 'scene.solve_layout' && edges.length === 0) throw new Error('scene.solve_layout needs edges or dsl')
    const rawOps = Array.isArray(args.operations) ? args.operations : []
    let sceneState: Json | null = null
    const loadScene = async () => {
      if (sceneState === null) sceneState = asRecord(await invoke('scene.get', {}, 15000))
      return sceneState
    }
    if (name === 'scene.solve_layout' || edges.length > 0) {
      const state = await loadScene()
      const solved = solveLayout(bodiesFromScene(state as never), edges)
      if (name === 'scene.solve_layout' && args.apply === false) return solved
      const rest = rawOps.filter(item => {
        const type = asRecord(item).type
        return type !== 'set_relations' && type !== 'solve_layout'
      })
      const expanded = expandSceneOperations(rest, await loadScene())
      const edit = asRecord(await invoke('scene.edit', {
        description: typeof args.description === 'string' ? args.description : 'solve layout',
        operations: [...expanded.operations, ...solved.operations],
        validateOnly: args.validateOnly === true,
      }))
      if (expanded.handheldAmp > 0) await invoke('stage.handheld', { amp: expanded.handheldAmp }, 8000).catch(() => {})
      let look = null
      let contact = null
      if (args.validateOnly !== true) {
        look = await ctx.applyLook(expanded.look)
        contact = await ctx.applyPlant(expanded.look, edges)
      }
      return { ...edit, layout: solved, lens: expanded.lens, look, contact }
    }
    const expanded = expandSceneOperations(rawOps, needsSceneState(rawOps) ? await loadScene() : {})
    let edit: unknown = { ok: true, applied: 0 }
    if (expanded.operations.length > 0) {
      edit = await invoke('scene.edit', { description: args.description, operations: expanded.operations, validateOnly: args.validateOnly === true })
    }
    if (expanded.handheldAmp > 0) await invoke('stage.handheld', { amp: expanded.handheldAmp }, 8000).catch(() => {})
    let look = null
    let contact = null
    if (args.validateOnly !== true) {
      look = await ctx.applyLook(expanded.look)
      contact = await ctx.applyPlant(expanded.look, edges)
    }
    return { ...asRecord(edit), lens: expanded.lens, look, contact }
  }

  let result: unknown = await invoke(name, args)
  if (name === 'scene.diagnostics') {
    try {
      const state = asRecord(await invoke('scene.get', {}, 15000))
      const bodies = bodiesFromScene(state as never)
      const extra = [
        ...semanticIssues(bodies),
        ...framingIssues(bodies, Array.isArray(state.cameras) ? state.cameras as never : []),
      ]
      const record = asRecord(result)
      result = { ...record, issues: [...(Array.isArray(record.issues) ? record.issues : []), ...extra] }
    } catch {
      /* keep mechanical diagnostics */
    }
  }
  return result
}
