import { downloadToFile, mediaSourceToDataUrl, readJsonResponse } from '../support.ts'
import type { ProviderContext, VideoResult } from './types.ts'

/**
 * Google Veo 3.1 via the Gemini API (generativelanguage.googleapis.com/
 * v1beta): models.generate_videos with GenerateVideosConfig, LRO polling
 * on the operation name, generated_videos[].video.uri download. Native
 * audio is on by default in the Gemini API surface.
 */

interface VeoOperationEnvelope {
  name?: string
  done?: boolean
  response?: {
    generatedVideos?: Array<{ video?: { uri?: string } }>
  }
  error?: { message?: string }
}

function imageBytes(source: string): { bytesBase64Encoded: string; mimeType: string } {
  const dataUrl = source.startsWith('data:') ? source : ''
  if (dataUrl !== '') {
    const match = dataUrl.match(/^data:([^;]+);base64,(.*)$/)
    if (match !== null) return { bytesBase64Encoded: match[2], mimeType: match[1] }
  }
  return { bytesBase64Encoded: '', mimeType: 'image/png' }
}

export async function veoVideo(
  ctx: ProviderContext,
  prompt: string,
  options: {
    seconds?: number
    aspectRatio?: string
    resolution?: string
    firstFramePath?: string
    lastFramePath?: string
    referenceImagePaths?: string[]
  },
): Promise<VideoResult> {
  const apiKey = ctx.capability.apiKey
  if (apiKey === '') throw new Error('Veo 模式需要 Gemini API Key：Settings → DirectorX → 视频生成选择 veo 模式后填写')
  const base = ctx.capability.baseURL.replace(/\/+$/, '')
  const model = ctx.capability.model !== '' ? ctx.capability.model : 'veo-3.1-generate-preview'
  const durationSeconds = options.seconds !== undefined && options.seconds > 0 ? Math.min(8, Math.max(4, Math.round(options.seconds))) : 8
  const config: Record<string, unknown> = {
    durationSeconds,
    ...(options.aspectRatio !== undefined ? { aspectRatio: options.aspectRatio } : {}),
    ...(ctx.capability.resolution !== '' ? { resolution: ctx.capability.resolution } : {}),
  }
  if (options.referenceImagePaths !== undefined && options.referenceImagePaths.length > 0) {
    const referenceImages = []
    for (const path of options.referenceImagePaths.slice(0, 3)) {
      const bytes = imageBytes(await mediaSourceToDataUrl(path))
      referenceImages.push({ image: { bytesBase64Encoded: bytes.bytesBase64Encoded, mimeType: bytes.mimeType }, referenceType: 'asset' })
    }
    config.referenceImages = referenceImages
  }
  const body: Record<string, unknown> = { prompt, config }
  if (options.firstFramePath !== undefined) {
    const bytes = imageBytes(await mediaSourceToDataUrl(options.firstFramePath))
    body.image = { bytesBase64Encoded: bytes.bytesBase64Encoded, mimeType: bytes.mimeType }
  }
  if (options.lastFramePath !== undefined) {
    const bytes = imageBytes(await mediaSourceToDataUrl(options.lastFramePath))
    config.lastFrame = { bytesBase64Encoded: bytes.bytesBase64Encoded, mimeType: bytes.mimeType }
  }
  const headers: Record<string, string> = { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey }
  const createResponse = await fetch(`${base}/models/${model}:generateVideos`, {
    method: 'POST', headers, body: JSON.stringify(body), signal: ctx.signal,
  })
  const create = await readJsonResponse<VeoOperationEnvelope>(createResponse)
  if (!createResponse.ok || create.name === undefined) {
    throw new Error(`Veo creation failed (HTTP ${createResponse.status}): ${create.error?.message ?? JSON.stringify(create).slice(0, 300)}`)
  }
  const operationName = create.name
  await ctx.ledger?.append({ taskId: operationName, model, mode: ctx.capability.mode, prompt, state: 'submitted', at: Date.now() }).catch(() => {})

  for (let attempt = 0; attempt < ctx.settings.maxPollAttempts; attempt += 1) {
    if (ctx.signal.aborted) throw new Error('Veo polling cancelled')
    if (ctx.ledger !== undefined && await ctx.ledger.isCancelled(operationName)) throw new Error(`Operation ${operationName} was cancelled via directorx_cancel_task`)
    await new Promise(resolve => setTimeout(resolve, ctx.settings.pollIntervalMs))
    const statusResponse = await fetch(`${base}/${operationName}`, { headers, signal: ctx.signal })
    const status = await readJsonResponse<VeoOperationEnvelope>(statusResponse)
    if (status.error !== undefined) throw new Error(`Veo operation failed: ${status.error.message ?? 'unknown'}`)
    if (status.done === true) {
      const uris = (status.response?.generatedVideos ?? []).map(video => video.video?.uri).filter((uri): uri is string => typeof uri === 'string' && uri !== '')
      if (uris.length === 0) throw new Error(`Veo operation ${operationName} done with no videos`)
      const files = []
      for (const uri of uris) files.push(await downloadToFile(uri, ctx.settings.outputDir, 'veo', '.mp4'))
      await ctx.ledger?.append({ taskId: operationName, model, mode: ctx.capability.mode, prompt, state: 'succeeded', at: Date.now(), files: files.map(file => ({ path: file })), urls: uris }).catch(() => {})
      return { model, prompt, taskId: operationName, status: 'succeed', files: files.map(file => ({ path: file })), mode: 'veo' }
    }
  }
  throw new Error(`Veo operation ${operationName} timed out after ${ctx.settings.maxPollAttempts} attempts`)
}
