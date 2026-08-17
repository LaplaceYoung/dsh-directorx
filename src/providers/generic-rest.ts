import { apiKeyOf, downloadToFile, mediaSourceToDataUrl, readJsonResponse, saveBase64ToFile, slugify } from '../support.ts'
import type { ImageResult, MediaFile, ProviderContext, VideoResult, AudioResult } from './types.ts'
import { buildBody, collectUrls, readPath, type AdapterSpec, type BodySlot } from './adapter-spec.ts'

export interface GenericSlots {
  prompt?: string
  text?: string
  seconds?: number
  size?: string
  aspectRatio?: string
  resolution?: string
  firstFramePath?: string
  lastFramePath?: string
  negativePrompt?: string
  voice?: string
}

function joinUrl(baseURL: string, path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  const base = baseURL.replace(/\/+$/, '')
  const suffix = path.startsWith('/') ? path : `/${path}`
  return `${base}${suffix}`
}

export function authHeaders(spec: AdapterSpec, apiKey: string): Record<string, string> {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (spec.auth.kind === 'bearer' && apiKey !== '') headers.authorization = `Bearer ${apiKey}`
  if (spec.auth.kind === 'header' && spec.auth.headerName && apiKey !== '') headers[spec.auth.headerName] = apiKey
  return headers
}

function withQuery(url: string, spec: AdapterSpec, apiKey: string): string {
  if (spec.auth.kind !== 'query' || !spec.auth.queryName || apiKey === '') return url
  const parsed = new URL(url)
  parsed.searchParams.set(spec.auth.queryName, apiKey)
  return parsed.toString()
}

async function slotValues(spec: AdapterSpec, slots: GenericSlots): Promise<Partial<Record<BodySlot, unknown>>> {
  const values: Partial<Record<BodySlot, unknown>> = {
    prompt: slots.prompt,
    text: slots.text ?? slots.prompt,
    model: spec.model,
    seconds: slots.seconds,
    size: slots.size,
    aspectRatio: slots.aspectRatio,
    resolution: slots.resolution,
    negativePrompt: slots.negativePrompt,
    voice: slots.voice,
  }
  if (slots.firstFramePath !== undefined) values.firstFrame = await mediaSourceToDataUrl(slots.firstFramePath)
  if (slots.lastFramePath !== undefined) values.lastFrame = await mediaSourceToDataUrl(slots.lastFramePath)
  return values
}

function fallbackUrls(body: unknown): string[] {
  const preferred = [
    readPath(body, 'url'),
    readPath(body, 'data.url'),
    readPath(body, 'output.url'),
    readPath(body, 'data.urls'),
    readPath(body, 'output.urls'),
    readPath(body, 'result.url'),
    readPath(body, 'video_url'),
    readPath(body, 'image_url'),
  ]
  const fromPreferred = preferred.flatMap(collectUrls)
  return fromPreferred.length > 0 ? fromPreferred : collectUrls(body)
}

export async function genericGenerate(
  ctx: ProviderContext,
  spec: AdapterSpec,
  slots: GenericSlots,
): Promise<{ files: MediaFile[]; taskId?: string; status: string; mode: string; model: string; prompt: string }> {
  if (spec.mode !== 'generic-rest' || spec.create === undefined) {
    throw new Error(`generic-rest runner 只接受 mode=generic-rest 的完整 spec，收到 ${spec.mode}`)
  }
  if (spec.auth.kind === 'kling-jwt') {
    throw new Error('kling-jwt 请把 classify 结果写成 kling 模式，不要走 generic-rest')
  }
  const apiKey = apiKeyOf(ctx.capability.apiKey, ['DIRECTORX_VIDEO_API_KEY', 'DIRECTORX_IMAGE_API_KEY', 'DIRECTORX_AUDIO_API_KEY'], spec.baseURL)
  const headers = authHeaders(spec, apiKey)
  const values = await slotValues(spec, slots)
  const payload = buildBody(spec.create.body, values)
  const createUrl = withQuery(joinUrl(spec.baseURL, spec.create.path), spec, apiKey)
  const created = await fetch(createUrl, {
    method: spec.create.method ?? 'POST',
    headers,
    body: JSON.stringify(payload),
    signal: ctx.signal,
  })
  const createBody = await readJsonResponse<Record<string, unknown>>(created)
  if (!created.ok) {
    throw new Error(`generic create failed (HTTP ${created.status}): ${JSON.stringify(createBody).slice(0, 400)}`)
  }

  let taskId: string | undefined
  let resultBody: unknown = createBody
  if (spec.poll !== undefined) {
    const rawId = readPath(createBody, spec.poll.taskId)
    taskId = rawId === undefined || rawId === null ? undefined : String(rawId)
    if (taskId === undefined || taskId === '') {
      throw new Error(`create 响应里找不到 taskId（${spec.poll.taskId}）：${JSON.stringify(createBody).slice(0, 300)}`)
    }
    await ctx.ledger?.append({
      taskId,
      model: spec.model,
      mode: 'generic-rest',
      prompt: slots.prompt ?? slots.text ?? '',
      state: 'submitted',
      at: Date.now(),
    }).catch(() => {})
    resultBody = await pollGeneric(ctx, spec, apiKey, headers, taskId)
  }

  const files = await materializeFiles(ctx, spec, resultBody, slots.prompt ?? slots.text ?? spec.model)
  const status = spec.poll === undefined ? 'completed' : 'succeed'
  if (taskId !== undefined) {
    await ctx.ledger?.append({
      taskId,
      model: spec.model,
      mode: 'generic-rest',
      prompt: slots.prompt ?? slots.text ?? '',
      state: 'succeeded',
      at: Date.now(),
      files,
    }).catch(() => {})
  }
  return { files, taskId, status, mode: 'generic-rest', model: spec.model, prompt: slots.prompt ?? slots.text ?? '' }
}

async function pollGeneric(
  ctx: ProviderContext,
  spec: AdapterSpec,
  apiKey: string,
  headers: Record<string, string>,
  taskId: string,
): Promise<unknown> {
  const poll = spec.poll
  if (poll === undefined) throw new Error('poll missing')
  for (let attempt = 0; attempt < ctx.settings.maxPollAttempts; attempt += 1) {
    if (ctx.signal.aborted) throw Object.assign(new Error('Task polling cancelled'), { taskId })
    if (ctx.ledger !== undefined && await ctx.ledger.isCancelled(taskId)) {
      throw Object.assign(new Error(`Task ${taskId} was cancelled via directorx_cancel_task`), { taskId })
    }
    await new Promise(resolve => setTimeout(resolve, ctx.settings.pollIntervalMs))
    const path = poll.path.replaceAll('{taskId}', encodeURIComponent(taskId))
    const url = withQuery(joinUrl(spec.baseURL, path), spec, apiKey)
    const response = await fetch(url, { method: poll.method ?? 'GET', headers, signal: ctx.signal })
    const body = await readJsonResponse<Record<string, unknown>>(response)
    const rawStatus = readPath(body, poll.status)
    const status = String(rawStatus ?? '').toLowerCase()
    if (poll.success.some(item => item.toLowerCase() === status)) return body
    if (poll.failure.some(item => item.toLowerCase() === status)) {
      throw Object.assign(new Error(`generic task ${taskId} failed (${status}): ${JSON.stringify(body).slice(0, 300)}`), { taskId })
    }
  }
  throw Object.assign(new Error(`generic task ${taskId} timed out`), { taskId })
}

async function materializeFiles(
  ctx: ProviderContext,
  spec: AdapterSpec,
  body: unknown,
  prompt: string,
): Promise<MediaFile[]> {
  const files: MediaFile[] = []
  if (spec.syncResult?.b64 !== undefined) {
    const raw = readPath(body, spec.syncResult.b64)
    if (typeof raw === 'string' && raw !== '') {
      const ext = spec.capability === 'audio' ? 'mp3' : spec.capability === 'video' ? 'mp4' : 'png'
      const path = await saveBase64ToFile(raw, ctx.settings.outputDir, slugify(prompt), ext)
      files.push({ path, mimeType: spec.capability === 'audio' ? 'audio/mpeg' : spec.capability === 'video' ? 'video/mp4' : 'image/png' })
      return files
    }
  }
  const pointed = spec.poll?.resultUrls
    ? collectUrls(readPath(body, spec.poll.resultUrls))
    : spec.syncResult?.urls
      ? collectUrls(readPath(body, spec.syncResult.urls))
      : []
  const urls = pointed.length > 0 ? pointed : fallbackUrls(body)
  const ext = spec.capability === 'audio' ? '.mp3' : spec.capability === 'video' ? '.mp4' : '.png'
  const mime = spec.capability === 'audio' ? 'audio/mpeg' : spec.capability === 'video' ? 'video/mp4' : 'image/png'
  for (const url of urls) {
    files.push({ url, mimeType: mime })
    if (files.length === 1 && /^https?:\/\//i.test(url)) {
      const path = await downloadToFile(url, ctx.settings.outputDir, slugify(prompt), ext)
      files[0] = { path, url, mimeType: mime }
    }
  }
  if (files.length === 0) throw new Error(`generic 响应没有可下载的结果：${JSON.stringify(body).slice(0, 300)}`)
  return files
}

export async function genericAsImage(ctx: ProviderContext, spec: AdapterSpec, slots: GenericSlots): Promise<ImageResult> {
  const result = await genericGenerate(ctx, spec, slots)
  return { model: result.model, prompt: result.prompt, files: result.files, mode: result.mode }
}

export async function genericAsVideo(ctx: ProviderContext, spec: AdapterSpec, slots: GenericSlots): Promise<VideoResult> {
  const result = await genericGenerate(ctx, spec, slots)
  return { model: result.model, prompt: result.prompt, files: result.files, mode: result.mode, status: result.status, taskId: result.taskId }
}

export async function genericAsAudio(ctx: ProviderContext, spec: AdapterSpec, slots: GenericSlots): Promise<AudioResult> {
  const result = await genericGenerate(ctx, spec, { ...slots, text: slots.text ?? slots.prompt })
  return { model: result.model, text: slots.text ?? slots.prompt ?? '', files: result.files, mode: result.mode }
}
