import { downloadToFile, readJsonResponse } from '../support.ts'
import type { ProviderContext, VideoResult } from './types.ts'

/**
 * Kling 3.0 NEW API standard (api-singapore.klingai.com): API-Key Bearer
 * auth, model in the path, unified GET /tasks polling. Supports 3-15s,
 * up to 4K, native audio (音画同出) and multi-shot prompts. The legacy
 * JWT /v1/videos design remains available under the `kling` mode.
 */

interface KlingV3CreateEnvelope {
  data?: { id?: string }
  code?: number
  message?: string
}

interface KlingV3StatusEnvelope {
  code?: number
  data?: Array<{ id?: string; status?: string; outputs?: Array<{ url?: string; key?: string }>; task_error?: { message?: string } }>
}

export async function klingV3Video(
  ctx: ProviderContext,
  prompt: string,
  options: {
    seconds?: number
    aspectRatio?: string
    resolution?: string
    firstFramePath?: string
    lastFramePath?: string
    /** 音画同出: settings.audio = "native". */
    generateAudio?: boolean
    /** Multi-shot prompt lines (settings.muti_shot + "shot n, m, words;" format). */
    multiShot?: boolean
  },
): Promise<VideoResult> {
  const apiKey = ctx.capability.apiKey
  if (apiKey === '') throw new Error('Kling 3.0（新标准）模式需要 API Key：Settings → DirectorX → 视频生成选择 kling-v3 模式后填写')
  const base = ctx.capability.baseURL.replace(/\/+$/, '')
  const headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
  const settings: Record<string, unknown> = {
    duration: options.seconds !== undefined && options.seconds > 0 ? Math.min(15, Math.max(3, Math.round(options.seconds))) : 5,
    aspect_ratio: options.aspectRatio ?? '16:9',
    ...(options.generateAudio === true ? { audio: 'native' } : { audio: 'off' }),
    ...(options.multiShot === true ? { muti_shot: true } : {}),
  }
  if (ctx.capability.resolution !== '') settings.resolution = ctx.capability.resolution

  let path: string
  let body: Record<string, unknown>
  if (options.firstFramePath !== undefined) {
    const contents: Array<Record<string, unknown>> = [{ type: 'prompt', text: prompt }]
    const firstFrame = options.firstFramePath
    contents.unshift({ type: 'first_frame', url: firstFrame })
    if (options.lastFramePath !== undefined) contents.push({ type: 'last_frame', url: options.lastFramePath })
    path = '/image-to-video/kling-3.0'
    body = { contents, settings }
  } else {
    path = '/text-to-video/kling-3.0'
    body = { prompt, settings }
  }

  const createResponse = await fetch(`${base}${path}`, { method: 'POST', headers, body: JSON.stringify(body), signal: ctx.signal })
  const create = await readJsonResponse<KlingV3CreateEnvelope>(createResponse)
  const taskId = create.data?.id
  if (!createResponse.ok || create.code !== 0 || taskId === undefined) {
    throw new Error(`Kling v3 creation failed (HTTP ${createResponse.status}, code ${create.code}): ${create.message ?? JSON.stringify(create).slice(0, 300)}`)
  }
  await ctx.ledger?.append({ taskId, model: ctx.capability.model, mode: ctx.capability.mode, prompt, state: 'submitted', at: Date.now() }).catch(() => {})

  for (let attempt = 0; attempt < ctx.settings.maxPollAttempts; attempt += 1) {
    if (ctx.signal.aborted) throw new Error('Kling v3 polling cancelled')
    if (ctx.ledger !== undefined && await ctx.ledger.isCancelled(taskId)) throw new Error(`Task ${taskId} was cancelled via directorx_cancel_task`)
    await new Promise(resolve => setTimeout(resolve, ctx.settings.pollIntervalMs))
    const statusResponse = await fetch(`${base}/tasks?task_ids=${encodeURIComponent(taskId)}`, { headers, signal: ctx.signal })
    const status = await readJsonResponse<KlingV3StatusEnvelope>(statusResponse)
    const task = status.data?.[0]
    const state = (task?.status ?? '').toLowerCase()
    if (state === 'succeeded') {
      const urls = (task?.outputs ?? []).map(output => output.url).filter((url): url is string => typeof url === 'string' && url !== '')
      if (urls.length === 0) throw new Error(`Kling v3 task ${taskId} succeeded with no outputs`)
      const files = []
      for (const url of urls) files.push(await downloadToFile(url, ctx.settings.outputDir, 'kling3', '.mp4'))
      await ctx.ledger?.append({ taskId, model: ctx.capability.model, mode: ctx.capability.mode, prompt, state: 'succeeded', at: Date.now(), files: files.map(file => ({ path: file })), urls }).catch(() => {})
      return { model: ctx.capability.model, prompt, taskId, status: 'succeed', files: files.map(file => ({ path: file })), mode: 'kling-v3' }
    }
    if (state === 'failed') {
      const message = task?.task_error?.message ?? 'unknown error'
      await ctx.ledger?.append({ taskId, model: ctx.capability.model, mode: ctx.capability.mode, prompt, state: 'failed', at: Date.now(), error: message }).catch(() => {})
      throw new Error(`Kling v3 task ${taskId} failed: ${message}`)
    }
  }
  throw new Error(`Kling v3 task ${taskId} timed out after ${ctx.settings.maxPollAttempts} attempts`)
}
