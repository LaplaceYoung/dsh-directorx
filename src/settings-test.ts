import type { Context } from 'cordis'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { DirectorxSettings } from './config.ts'
import { apiKeyOf } from './support.ts'
import { klingJwt } from './providers/video-models.ts'

const TEST_ROUTE_PATH = '/directorx/settings/test'

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { 'content-type': 'application/json' })
  response.end(JSON.stringify(body))
}

async function readJsonBody(request: IncomingMessage): Promise<Record<string, unknown>> {
  let raw = ''
  for await (const chunk of request) raw += String(chunk)
  try {
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return {}
  }
}

/**
 * POST /directorx/settings/test  { capability }
 * Lightweight connectivity probe for the four model capabilities: a GET
 * /models round-trip (OpenAI-compatible providers) with the configured key;
 * kling mints a JWT instead (its API has no model listing), runway lists
 * tasks, mock reports success without a network round-trip.
 */
export function registerSettingsTestRoute(ctx: Context, getSettings: () => DirectorxSettings): () => void {
  const webServer = ctx.get('webServer') as
    | { register(route: { kind: 'exact' | 'prefix'; path: string; handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void> }): () => void }
    | undefined
  if (webServer === undefined) return () => {}
  return webServer.register({
    kind: 'exact',
    path: TEST_ROUTE_PATH,
    handler: async (request, response) => {
      if (request.method !== 'POST') {
        sendJson(response, 405, { ok: false, message: 'method not allowed' })
        return
      }
      try {
        const body = await readJsonBody(request)
        const capability = String(body.capability ?? '')
        const settings = getSettings()
        const profile = (settings as unknown as Record<string, { baseURL: string; apiKey: string; mode: string } | undefined>)[capability]
        if (profile === undefined) {
          sendJson(response, 400, { ok: false, message: `未知能力 "${capability}"（可选 vision/image/video/audio）` })
          return
        }
        const ENV_NAMES: Record<string, string[]> = {
          vision: ['DIRECTORX_VISION_API_KEY'],
          image: ['DIRECTORX_IMAGE_API_KEY'],
          video: ['DIRECTORX_VIDEO_API_KEY'],
          audio: ['DIRECTORX_AUDIO_API_KEY'],
        }
        if (profile.mode === 'mock') {
          sendJson(response, 200, { ok: true, message: 'mock 模式：无网络请求，始终可用' })
          return
        }
        const baseURL = profile.baseURL.trim().replace(/\/+$/, '')
        let key = ''
        try {
          key = apiKeyOf(profile.apiKey, ENV_NAMES[capability] ?? [], baseURL)
        } catch {
          sendJson(response, 200, { ok: false, message: '未找到 API Key（检查设置或环境变量）' })
          return
        }
        if (key === '') {
          sendJson(response, 200, { ok: false, message: '未找到 API Key（检查设置或环境变量）' })
          return
        }
        try {
          if (capability === 'video' && profile.mode === 'kling') {
            const auth = profile as unknown as { auth?: Record<string, unknown> }
            const ak = (auth.auth as Record<string, string> | undefined)?.klingAk ?? ''
            const sk = (auth.auth as Record<string, string> | undefined)?.klingSk ?? ''
            if (ak === '' || sk === '') {
              sendJson(response, 200, { ok: false, message: '可灵模式需要 AK 与 SK' })
              return
            }
            klingJwt(ak, sk)
            sendJson(response, 200, { ok: true, message: `JWT 签发成功（${ak.slice(0, 6)}…）` })
            return
          }
          if (capability === 'video' && profile.mode === 'runway') {
            const probe = await fetch(`${baseURL}/v1/tasks?limit=1`, {
              headers: { authorization: `Bearer ${key}`, 'x-runway-version': '2024-11-06' },
              signal: AbortSignal.timeout(12_000),
            })
            sendJson(response, 200, probe.status === 200
              ? { ok: true, message: 'Runway 鉴权通过（tasks 列表可访问）' }
              : { ok: false, message: `Runway 返回 HTTP ${probe.status}` })
            return
          }
          const probe = await fetch(`${baseURL}/models`, {
            headers: { authorization: `Bearer ${key}` },
            signal: AbortSignal.timeout(12_000),
          })
          if (probe.status === 200) {
            const text = await probe.text().catch(() => '')
            try {
              const data = JSON.parse(text) as { data?: unknown[]; models?: unknown[] }
              const count = Array.isArray(data.data) ? data.data.length : Array.isArray(data.models) ? data.models.length : 0
              sendJson(response, 200, { ok: true, message: `鉴权通过，模型列表可访问（${count} 个模型）` })
            } catch {
              sendJson(response, 200, { ok: true, message: '端点响应正常（HTTP 200）' })
            }
            return
          }
          sendJson(response, 200, { ok: false, message: probe.status === 401 || probe.status === 403 ? `HTTP ${probe.status}：鉴权被拒绝（检查 Key 与 Base URL）` : `HTTP ${probe.status}：端点异常` })
        } catch (cause) {
          sendJson(response, 200, { ok: false, message: cause instanceof Error ? cause.message : String(cause) })
        }
      } catch (error) {
        sendJson(response, 400, { ok: false, message: error instanceof Error ? error.message : String(error) })
      }
    },
  })
}
