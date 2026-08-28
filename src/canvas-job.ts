import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import { DirectorxCanvasStore } from './canvas.ts'
import type { DirectorxSettings } from './config.ts'
import { directorxWeb } from './media-server.ts'
import { runImage } from './providers/image.ts'
import { runVideo } from './providers/video.ts'
import { generateContext } from './tools.ts'

export const CANVAS_GENERATE_ROUTE_PATH = '/directorx/canvas/generate'

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { 'content-type': 'application/json' })
  response.end(JSON.stringify(body))
}

async function readBody(request: IncomingMessage, maxBytes: number): Promise<Record<string, unknown>> {
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

function jobPrompt(task: string, prompt: string): string {
  const text = prompt.trim()
  if (task === 'erase') return `擦除蒙版白色区域并用周围内容自然填补，其余画面保持不变。${text}`
  if (task === 'redraw') return `只改蒙版白色区域：${text}。未蒙版区域必须保持原样。`
  if (task === 'expand') return `扩展画面填满黑边，主体位置与外观保持不变。${text}`
  if (task === 'enhance') return `高清放大，保持构图与细节。${text}`
  if (task === 'cutout') return `抠出主体，透明背景，边缘干净。${text}`
  if (task === 'annotate') return `在画面上添加清晰可读的标注，不改动原主体。${text}`
  return text
}

function sizeForAspect(aspect?: string): string | undefined {
  if (aspect === '9:16') return '1024x1536'
  if (aspect === '1:1') return '1024x1024'
  if (aspect === '16:9') return '1536x1024'
  return undefined
}

/** POST /directorx/canvas/generate: node tools run the image/video provider directly. */
export function registerCanvasGenerateRoute(ctx: Context, getSettings: () => DirectorxSettings): () => void {
  const webServer = directorxWeb(ctx)
  if (webServer === undefined) return () => {}
  return webServer.register({
    kind: 'exact',
    path: CANVAS_GENERATE_ROUTE_PATH,
    handler: async (request, response) => {
      if (request.method !== 'POST') {
        response.writeHead(405)
        response.end('method not allowed')
        return
      }
      try {
        const body = await readBody(request, 256 * 1024)
        const kind = body.kind === 'video' ? 'video' : 'image'
        const prompt = typeof body.prompt === 'string' ? body.prompt : ''
        const nodeId = typeof body.nodeId === 'string' ? body.nodeId : ''
        if (prompt.trim() === '' || nodeId === '') {
          sendJson(response, 400, { ok: false, message: 'nodeId 与 prompt 必填' })
          return
        }
        const settings = getSettings()
        if (kind === 'image' && settings.image.enabled !== true) {
          sendJson(response, 400, { ok: false, message: '图片生成未开启' })
          return
        }
        if (kind === 'video' && settings.video.enabled !== true) {
          sendJson(response, 400, { ok: false, message: '视频生成未开启' })
          return
        }
        const task = typeof body.task === 'string' ? body.task : 'generate'
        const references = [
          ...(Array.isArray(body.references) ? body.references.map(String) : []),
          ...(typeof body.maskPath === 'string' && body.maskPath !== '' ? [body.maskPath] : []),
        ].filter(path => path !== '')
        const model = typeof body.model === 'string' && body.model !== '' ? body.model : undefined
        const aspect = typeof body.aspect === 'string' ? body.aspect : undefined
        const signal = AbortSignal.timeout(Math.max(settings.timeoutMs, 60_000))
        const fullPrompt = jobPrompt(task, prompt)
        let path: string | undefined
        if (kind === 'video') {
          const videoCtx = await generateContext(settings, 'video', signal, model)
          const result = await runVideo(videoCtx, fullPrompt, {
            seconds: typeof body.durationSec === 'number' ? body.durationSec : undefined,
            aspectRatio: aspect,
            referenceImagePaths: references,
            firstFramePath: typeof body.firstFramePath === 'string' ? body.firstFramePath : undefined,
          })
          path = result.files[0]?.path
        } else {
          const imageCtx = await generateContext(settings, 'image', signal, model)
          const result = await runImage(imageCtx, fullPrompt, {
            size: sizeForAspect(aspect),
            referenceImagePaths: references,
          })
          path = result.files[0]?.path
        }
        if (path === undefined || path === '') {
          sendJson(response, 500, { ok: false, message: '生成没有返回文件' })
          return
        }
        const store = new DirectorxCanvasStore(settings.outputDir)
        const doc = await store.update(nodeId, { path, shotStatus: 'review', lastError: undefined, prompt: fullPrompt.slice(0, 2000) })
        sendJson(response, 200, { ok: true, path, nodeId, task, doc })
      } catch (cause) {
        sendJson(response, 400, { ok: false, message: cause instanceof Error ? cause.message : String(cause) })
      }
    },
  })
}
