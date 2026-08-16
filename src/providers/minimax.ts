import { downloadToFile, readJsonResponse } from '../support.ts'
import type { ProviderContext, VideoResult } from './types.ts'

/**
 * MiniMax H3 (api.minimaxi.com) official v2 protocol, per the official
 * OpenAPI spec (v2-video-generation.json): multimodal content[] create,
 * poll /v2/query/video_generation/{task_id}, download via file_id.
 */

interface MinimaxCreateEnvelope {
  task_id?: string
  base_resp?: { status_code?: number; status_msg?: string }
}

interface MinimaxStatusEnvelope {
  status?: string
  file_id?: string
  base_resp?: { status_code?: number; status_msg?: string }
}

interface MinimaxFileEnvelope {
  file?: { download_url?: string }
  base_resp?: { status_code?: number; status_msg?: string }
}

export async function minimaxH3Video(
  ctx: ProviderContext,
  prompt: string,
  options: { seconds?: number; aspectRatio?: string; firstFramePath?: string; lastFramePath?: string; referenceImagePaths?: string[] },
): Promise<VideoResult> {
  const apiKey = ctx.capability.apiKey
  if (apiKey === '') throw new Error('MiniMax 模式需要 API Key：Settings → DirectorX → 视频生成选择 minimax-h3 模式后填写')
  const base = ctx.capability.baseURL.replace(/\/+$/, '')
  const headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }

  const content: Array<Record<string, unknown>> = []
  const pushImage = async (url: string, role: string) => {
    content.push({ type: 'image_url', image_url: { url }, role })
  }
  if (options.firstFramePath !== undefined) await pushImage(options.firstFramePath, 'first_frame')
  if (options.lastFramePath !== undefined) await pushImage(options.lastFramePath, 'last_frame')
  if (options.referenceImagePaths !== undefined) {
    for (const reference of options.referenceImagePaths) await pushImage(reference, 'reference_image')
  }
  content.push({ type: 'text', text: prompt })
  const hasImages = content.length > 1
  const payload: Record<string, unknown> = {
    model: ctx.capability.model !== '' ? ctx.capability.model : 'MiniMax-H3',
    content,
    resolution: ctx.capability.resolution ?? '768P',
    duration: options.seconds !== undefined && options.seconds > 0 ? Math.min(15, Math.max(4, Math.round(options.seconds))) : 6,
    ...(hasImages ? {} : { ratio: options.aspectRatio ?? '16:9' }),
  }
  const createResponse = await fetch(`${base}/v2/video_generation`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    signal: ctx.signal,
  })
  const create = await readJsonResponse<MinimaxCreateEnvelope>(createResponse)
  const taskId = create.task_id
  if (!createResponse.ok || create.base_resp?.status_code !== 0 || taskId === undefined) {
    throw new Error(`MiniMax creation failed (HTTP ${createResponse.status}): ${create.base_resp?.status_msg ?? JSON.stringify(create).slice(0, 300)}`)
  }
  await ctx.ledger?.append({ taskId, model: ctx.capability.model, mode: ctx.capability.mode, prompt, state: 'submitted', at: Date.now() }).catch(() => {})

  for (let attempt = 0; attempt < ctx.settings.maxPollAttempts; attempt += 1) {
    if (ctx.signal.aborted) throw new Error('MiniMax polling cancelled')
    if (ctx.ledger !== undefined && await ctx.ledger.isCancelled(taskId)) throw new Error(`Task ${taskId} was cancelled via directorx_cancel_task`)
    await new Promise(resolve => setTimeout(resolve, ctx.settings.pollIntervalMs))
    const statusResponse = await fetch(`${base}/v2/query/video_generation/${encodeURIComponent(taskId)}`, { headers, signal: ctx.signal })
    const status = await readJsonResponse<MinimaxStatusEnvelope>(statusResponse)
    const state = (status.status ?? '').toLowerCase()
    if (state === 'success') {
      const fileId = status.file_id
      if (fileId === undefined || fileId === '') throw new Error(`MiniMax task ${taskId} succeeded without a file_id`)
      const fileResponse = await fetch(`${base}/v1/files/retrieve?file_id=${encodeURIComponent(fileId)}`, { headers, signal: ctx.signal })
      const file = await readJsonResponse<MinimaxFileEnvelope>(fileResponse)
      const url = file.file?.download_url
      if (url === undefined || url === '') throw new Error(`MiniMax file ${fileId} has no download_url`)
      const filePath = await downloadToFile(url, ctx.settings.outputDir, 'minimax', '.mp4')
      await ctx.ledger?.append({ taskId, model: ctx.capability.model, mode: ctx.capability.mode, prompt, state: 'succeeded', at: Date.now(), files: [{ path: filePath }], urls: [url] }).catch(() => {})
      return { model: ctx.capability.model, prompt, taskId, status: 'succeed', files: [{ path: filePath }], mode: 'minimax-h3' }
    }
    if (state === 'fail' || state === 'failed') {
      const message = status.base_resp?.status_msg ?? 'unknown error'
      await ctx.ledger?.append({ taskId, model: ctx.capability.model, mode: ctx.capability.mode, prompt, state: 'failed', at: Date.now(), error: message }).catch(() => {})
      throw new Error(`MiniMax task ${taskId} failed: ${message}`)
    }
  }
  throw new Error(`MiniMax task ${taskId} timed out after ${ctx.settings.maxPollAttempts} attempts`)
}
