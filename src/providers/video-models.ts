import { createHmac } from 'node:crypto'
import { mediaSourceToDataUrl, readJsonResponse, slugify, downloadToFile } from '../support.ts'
import type { DirectorxTaskLedger } from '../tasks.ts'
import type { MediaFile, ProviderContext, VideoResult } from './types.ts'

/**
 * Direct provider adapters for mainstream video models:
 * - Kling 可灵: ak/sk → HS256 JWT, POST /v1/videos/{text2video|image2video},
 *   poll GET /v1/videos/{id}.
 * - Runway: Bearer key + x-runway-version header, POST /v1/{text_to_video|
 *   image_to_video}, poll GET /v1/tasks/{id}.
 * Protocol shapes verified against official docs and GitHub implementations
 * during the 2026-08 research pass (see docs/architecture.md).
 */

interface KlingCreateEnvelope {
  code?: number
  message?: string
  data?: { task_id?: string }
}

interface KlingStatusEnvelope {
  code?: number
  message?: string
  data?: {
    task_id?: string
    task_status?: string
    task_status_msg?: string
    task_result?: { videos?: Array<{ url?: string; duration?: string }> }
  }
}

/** HS256 JWT with `iss` = access key, ~30min expiry, standard Kling auth. */
export function klingJwt(accessKey: string, secretKey: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const now = Math.floor(Date.now() / 1000)
  const payload = Buffer.from(JSON.stringify({ iss: accessKey, exp: now + 1800, nbf: now - 5 })).toString('base64url')
  const signature = createHmac('sha256', secretKey).update(`${header}.${payload}`).digest('base64url')
  return `${header}.${payload}.${signature}`
}

interface RunwayCreateEnvelope {
  id?: string
  error?: { message?: string }
}

interface RunwayStatusEnvelope {
  id?: string
  status?: string
  output?: string[]
  failure?: string
  failureCode?: string
}

function clampDuration(seconds: number | undefined, fallback: number, min: number, max: number): string {
  const value = Math.round(seconds ?? fallback)
  return String(Math.min(max, Math.max(min, value)))
}

/** Map user-facing aspect ratios to Runway's pixel-ratio vocabulary. */
function runwayRatio(aspectRatio: string | undefined): string {
  const table: Record<string, string> = {
    '16:9': '1280:720',
    '9:16': '720:1280',
    '1:1': '960:960',
    '4:3': '1104:832',
    '3:4': '832:1104',
    '21:9': '1584:672',
  }
  const key = aspectRatio ?? '16:9'
  return table[key] ?? (/\d+:\d+/.test(key) ? key : '1280:720')
}

async function recordTask(ledger: DirectorxTaskLedger | undefined, taskId: string, ctx: ProviderContext, prompt: string, state: 'submitted' | 'succeeded' | 'failed', extra: { error?: string; files?: MediaFile[]; urls?: string[] } = {}) {
  if (ledger === undefined) return
  await ledger.append({
    taskId,
    model: ctx.capability.model,
    mode: ctx.capability.mode,
    prompt,
    state,
    at: Date.now(),
    ...(extra.files !== undefined ? { files: extra.files } : {}),
    ...(extra.urls !== undefined ? { urls: extra.urls } : {}),
    ...(extra.error !== undefined ? { error: extra.error } : {}),
  }).catch(() => {})
}

async function downloadFirst(urls: string[], ctx: ProviderContext, prompt: string): Promise<MediaFile[]> {
  const files: MediaFile[] = []
  for (const url of urls) {
    files.push({ url })
    if (files.length === 1 && /^https?:\/\//i.test(url)) {
      const path = await downloadToFile(url, ctx.settings.outputDir, slugify(prompt), '.mp4')
      files[0] = { path, url, mimeType: 'video/mp4' }
    }
  }
  return files
}

export async function klingVideo(
  ctx: ProviderContext,
  prompt: string,
  options: {
    seconds?: number
    aspectRatio?: string
    firstFramePath?: string
    lastFramePath?: string
    /** Kling 3.0: native audio generation (音画同出). */
    generateAudio?: boolean
    /** Kling 3.0: narration voice ids (referenced as <<<voice_1>>> in the prompt). */
    voiceIds?: string[]
  },
): Promise<VideoResult> {
  const ak = ctx.capability.auth.klingAk
  const sk = ctx.capability.auth.klingSk
  if (ak === '' || sk === '') {
    throw new Error('Kling 模式需要可灵 AccessKey / SecretKey：Settings → DirectorX → 视频生成选择 kling 模式后填写')
  }
  const base = ctx.capability.baseURL.replace(/\/+$/, '')
  const token = klingJwt(ak, sk)
  const isImageToVideo = options.firstFramePath !== undefined
  const kindPath = isImageToVideo ? 'image2video' : 'text2video'
  const payload: Record<string, unknown> = {
    model_name: ctx.capability.model !== '' ? ctx.capability.model : 'kling-v2',
    prompt,
    mode: 'std',
    duration: clampDuration(options.seconds, 5, 5, 15),
    aspect_ratio: options.aspectRatio ?? '16:9',
  }
  if (options.generateAudio === true) payload.generate_audio = true
  if (options.voiceIds !== undefined && options.voiceIds.length > 0) payload.voice_ids = options.voiceIds
  if (isImageToVideo) {
    payload.image = await mediaSourceToDataUrl(options.firstFramePath as string)
    if (options.lastFramePath !== undefined) payload.image_tail = await mediaSourceToDataUrl(options.lastFramePath)
  }
  const response = await fetch(`${base}/v1/videos/${kindPath}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: ctx.signal,
  })
  const body = await readJsonResponse<KlingCreateEnvelope>(response)
  const taskId = body.data?.task_id
  if (!response.ok || body.code !== 0 || taskId === undefined) {
    throw new Error(`Kling creation failed (HTTP ${response.status}, code ${body.code}): ${body.message ?? JSON.stringify(body).slice(0, 300)}`)
  }
  await recordTask(ctx.ledger, taskId, ctx, prompt, 'submitted')

  const settings = ctx.settings
  for (let attempt = 0; attempt < settings.maxPollAttempts; attempt += 1) {
    if (ctx.signal.aborted) throw new Error('Kling polling cancelled')
    if (ctx.ledger !== undefined && await ctx.ledger.isCancelled(taskId)) {
      throw new Error(`Task ${taskId} was cancelled via directorx_cancel_task`)
    }
    await new Promise(resolve => setTimeout(resolve, settings.pollIntervalMs))
    // Kling's task query reuses the creation path with the task id appended.
    const statusResponse = await fetch(`${base}/v1/videos/${kindPath}/${encodeURIComponent(taskId)}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: ctx.signal,
    })
    const statusBody = await readJsonResponse<KlingStatusEnvelope>(statusResponse)
    const state = (statusBody.data?.task_status ?? '').toLowerCase()
    if (state === 'succeed' || state === 'success') {
      const urls = (statusBody.data?.task_result?.videos ?? [])
        .map(video => video.url)
        .filter((url): url is string => typeof url === 'string' && url !== '')
      if (urls.length === 0) throw new Error(`Kling task ${taskId} succeeded but returned no video URLs`)
      const files = await downloadFirst(urls, ctx, prompt)
      await recordTask(ctx.ledger, taskId, ctx, prompt, 'succeeded', { files, urls })
      return { model: ctx.capability.model, prompt, taskId, status: 'succeed', files, mode: 'kling' }
    }
    if (state === 'failed' || state === 'fail') {
      const message = statusBody.data?.task_status_msg ?? 'unknown error'
      await recordTask(ctx.ledger, taskId, ctx, prompt, 'failed', { error: message })
      throw new Error(`Kling task ${taskId} failed: ${message}`)
    }
  }
  throw new Error(`Kling task ${taskId} did not finish within ${settings.maxPollAttempts * settings.pollIntervalMs}ms`)
}

export async function runwayVideo(
  ctx: ProviderContext,
  prompt: string,
  options: { seconds?: number; aspectRatio?: string; firstFramePath?: string; lastFramePath?: string },
): Promise<VideoResult> {
  const base = ctx.capability.baseURL.replace(/\/+$/, '')
  const apiKey = ctx.capability.apiKey
  if (apiKey === '') {
    throw new Error('Runway 模式需要 API Key：Settings → DirectorX → 视频生成选择 runway 模式后填写')
  }
  const version = ctx.capability.auth.runwayVersion
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    ...(version !== '' ? { 'x-runway-version': version } : {}),
  }
  const isImageToVideo = options.firstFramePath !== undefined
  const payload: Record<string, unknown> = {
    model: ctx.capability.model !== '' ? ctx.capability.model : 'gen4.5',
    promptText: prompt,
    duration: options.seconds !== undefined && options.seconds > 0 ? Math.min(10, Math.max(2, Math.round(options.seconds))) : 5,
    ratio: runwayRatio(options.aspectRatio),
  }
  if (isImageToVideo) {
    // Runway accepts a single {uri, position:'first'} object, or an array
    // with an optional last frame ({position:'last'}). Gen-4.5 i2v supports
    // FIRST frames only (official API reference) — a last frame would 400.
    const firstUri = await mediaSourceToDataUrl(options.firstFramePath as string)
    const first = { uri: firstUri, position: 'first' }
    if (options.lastFramePath !== undefined && (ctx.capability.model === 'gen4.5' || ctx.capability.model.startsWith('gen4.5'))) {
      throw new Error('Runway gen4.5 图生视频仅支持首帧（无尾帧）。请改用支持首尾帧的模型（如 gen-4），或去掉 last_frame_path。')
    }
    if (options.lastFramePath !== undefined) {
      const lastUri = await mediaSourceToDataUrl(options.lastFramePath)
      payload.promptImage = [first, { uri: lastUri, position: 'last' }]
    } else {
      payload.promptImage = first
    }
  }
  const response = await fetch(`${base}/v1/${isImageToVideo ? 'image_to_video' : 'text_to_video'}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    signal: ctx.signal,
  })
  const body = await readJsonResponse<RunwayCreateEnvelope>(response)
  if (!response.ok || body.id === undefined) {
    throw new Error(`Runway creation failed (HTTP ${response.status}): ${JSON.stringify(body.error ?? body).slice(0, 300)}`)
  }
  const taskId = body.id
  await recordTask(ctx.ledger, taskId, ctx, prompt, 'submitted')

  const settings = ctx.settings
  for (let attempt = 0; attempt < settings.maxPollAttempts; attempt += 1) {
    if (ctx.signal.aborted) throw new Error('Runway polling cancelled')
    if (ctx.ledger !== undefined && await ctx.ledger.isCancelled(taskId)) {
      throw new Error(`Task ${taskId} was cancelled via directorx_cancel_task`)
    }
    await new Promise(resolve => setTimeout(resolve, settings.pollIntervalMs))
    const statusResponse = await fetch(`${base}/v1/tasks/${encodeURIComponent(taskId)}`, {
      headers: { Authorization: `Bearer ${apiKey}`, ...(version !== '' ? { 'x-runway-version': version } : {}) },
      signal: ctx.signal,
    })
    const statusBody = await readJsonResponse<RunwayStatusEnvelope>(statusResponse)
    const state = (statusBody.status ?? '').toUpperCase()
    if (state === 'SUCCEEDED') {
      const urls = (statusBody.output ?? []).filter((url): url is string => typeof url === 'string' && url !== '')
      if (urls.length === 0) throw new Error(`Runway task ${taskId} succeeded but returned no URLs`)
      const files = await downloadFirst(urls, ctx, prompt)
      await recordTask(ctx.ledger, taskId, ctx, prompt, 'succeeded', { files, urls })
      return { model: ctx.capability.model, prompt, taskId, status: 'SUCCEEDED', files, mode: 'runway' }
    }
    if (state === 'FAILED') {
      const message = statusBody.failure ?? statusBody.failureCode ?? 'unknown error'
      await recordTask(ctx.ledger, taskId, ctx, prompt, 'failed', { error: message })
      throw new Error(`Runway task ${taskId} failed: ${message}`)
    }
  }
  throw new Error(`Runway task ${taskId} did not finish within ${settings.maxPollAttempts * settings.pollIntervalMs}ms`)
}
