import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { apiKeyOf, downloadToFile, ensureOutputDir, mediaSourceToDataUrl, readJsonResponse, slugify } from '../support.ts'
import { pollModelverseTask, pollOpenAIVideoTask, submitModelverseTask } from './tasks.ts'
import { klingVideo, runwayVideo } from './video-models.ts'
import { minimaxH3Video } from './minimax.ts'
import { klingV3Video } from './kling-v3.ts'
import { viduVideo } from './vidu.ts'
import { veoVideo } from './veo.ts'
import { genericAsVideo } from './generic-rest.ts'
import { ensureAspectFrame, parseAspectRatio } from './frame-fit.ts'
import { clampH3Duration, clipH3Prompt, h3Resolution, h3SkipReferences, isH3Model, limitH3Refs } from './h3-contract.ts'

/** Modelverse H3 accepts 768P / 2K, not the official 1440p token. */
function modelverseH3Resolution(requested?: string): string {
  const official = h3Resolution(requested)
  const key = official.toLowerCase()
  if (key === '1440p' || key === '2k' || key === '1080p' || key === '1k') return '2K'
  if (key === '768p' || key === '720p') return '768P'
  return official === '768P' ? '768P' : official
}
import type { MediaFile, ProviderContext, VideoResult } from './types.ts'

interface VideoCreateEnvelope {
  id?: string
  status?: string
  output?: { task_id?: string }
  error?: { message?: string }
}

export async function mockVideo(ctx: ProviderContext, prompt: string): Promise<VideoResult> {
  const outDir = await ensureOutputDir(ctx.settings.outputDir)
  const path = join(outDir, `${slugify(prompt)}-mock.mp4`)
  const ffmpeg = spawnSync('ffmpeg', [
    '-y', '-f', 'lavfi', '-i', 'color=c=0x0b1020:s=640x360:d=1:r=24',
    '-vf', `drawtext=text='DirectorX mock video':fontcolor=white:fontsize=28:x=(w-text_w)/2:y=(h-text_h)/2`,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', path,
  ], { encoding: 'utf8' })
  if (ffmpeg.error !== undefined) {
    throw new Error(`mock video mode requires ffmpeg on PATH (${ffmpeg.error.message}). Choose openai-videos or modelverse-tasks and configure Base URL / API Key.`)
  }
  if (ffmpeg.status !== 0) {
    throw new Error(`mock video ffmpeg failed: ${ffmpeg.stderr?.slice(-500)}`)
  }
  return { model: ctx.capability.model, prompt, status: 'completed', files: [{ path, mimeType: 'video/mp4' }], mode: 'mock' }
}

/** Attach the provider task id to an error so the caller can record which task failed. */
function withTaskId(error: unknown, taskId: string): Error {
  const wrapped = error instanceof Error ? error : new Error(String(error))
  ;(wrapped as Error & { taskId?: string }).taskId = taskId
  return wrapped
}

export async function openaiVideo(
  ctx: ProviderContext,
  prompt: string,
  seconds?: number,
  size?: string,
  options: { firstFramePath?: string; characterIds?: string[] } = {},
): Promise<VideoResult> {
  const baseURL = ctx.capability.baseURL.replace(/\/+$/, '')
  const apiKey = apiKeyOf(ctx.capability.apiKey, ['DIRECTORX_VIDEO_API_KEY', 'OPENAI_API_KEY'], baseURL)
  const payload: Record<string, unknown> = { model: ctx.capability.model, prompt }
  if (seconds !== undefined && seconds > 0) {
    // Sora 2 takes seconds as a STRING enum; clamp to the method-reference
    // values (4/8/12 — the guide's 16/20 claim is unverified, documented
    // in the community radar).
    const allowed = [4, 8, 12]
    const nearest = allowed.reduce((best, candidate) => Math.abs(candidate - seconds) < Math.abs(best - seconds) ? candidate : best, 8)
    payload.seconds = String(nearest)
  }
  if (size !== undefined && size !== '') payload.size = size
  if (options.firstFramePath !== undefined) {
    const dataUrl = await mediaSourceToDataUrl(options.firstFramePath)
    if (dataUrl.startsWith('data:')) payload.input_reference = { image_url: dataUrl }
    else payload.input_reference = { image_url: options.firstFramePath }
  }
  if (options.characterIds !== undefined && options.characterIds.length > 0) {
    payload.characters = options.characterIds.map(id => ({ id }))
  }
  const response = await fetch(`${baseURL}/videos`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: ctx.signal,
  })
  const body = await readJsonResponse<VideoCreateEnvelope>(response)
  if (!response.ok) {
    throw new Error(`Video creation failed (HTTP ${response.status}): ${JSON.stringify(body.error ?? body).slice(0, 400)}`)
  }
  const taskId = body.id ?? body.output?.task_id
  if (taskId === undefined || taskId === '') throw new Error(`Video response did not contain a task id: ${JSON.stringify(body).slice(0, 400)}`)
  await ctx.ledger?.append({
    taskId,
    model: ctx.capability.model,
    mode: 'openai-videos',
    prompt,
    state: 'submitted',
    at: Date.now(),
  })
  const finished = await pollOpenAIVideoTask(baseURL, apiKey, taskId, ctx.settings, ctx.signal, ctx.ledger)
    .catch(error => { throw withTaskId(error, taskId) })
  const files: MediaFile[] = []
  for (const url of finished.urls) {
    files.push({ url })
    if (files.length === 1 && /^https?:\/\//i.test(url)) {
      const path = await downloadToFile(url, ctx.settings.outputDir, slugify(prompt), '.mp4')
      files[0] = { path, url, mimeType: 'video/mp4' }
    }
  }
  await ctx.ledger?.append({
    taskId,
    model: ctx.capability.model,
    mode: 'openai-videos',
    prompt,
    state: 'succeeded',
    at: Date.now(),
    urls: finished.urls,
    files,
  })
  return { model: ctx.capability.model, prompt, taskId, status: finished.status, files, mode: 'openai-videos' }
}

export async function modelverseVideo(
  ctx: ProviderContext,
  prompt: string,
  options: { seconds?: number; aspectRatio?: string; resolution?: string; firstFramePath?: string; lastFramePath?: string; referenceImagePaths?: string[] },
): Promise<VideoResult> {
  const baseURL = ctx.capability.baseURL.replace(/\/+$/, '')
  const apiKey = apiKeyOf(ctx.capability.apiKey, ['DIRECTORX_VIDEO_API_KEY', 'OPENAI_API_KEY'], baseURL)
  const h3 = isH3Model(ctx.capability.model, ctx.capability.mode)
  const duration = h3 ? clampH3Duration(options.seconds) : Math.min(15, Math.max(4, Math.round(options.seconds ?? 5)))
  const promptText = h3 ? clipH3Prompt(prompt).prompt : prompt
  const content: Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string }; role?: string }> = [{ type: 'text', text: promptText }]
  const aspect = parseAspectRatio(options.aspectRatio)
  const firstFramePath = options.firstFramePath !== undefined
    ? ensureAspectFrame(options.firstFramePath, ctx.settings.outputDir, aspect.w, aspect.h)
    : undefined
  const lastFramePath = options.lastFramePath !== undefined
    ? ensureAspectFrame(options.lastFramePath, ctx.settings.outputDir, aspect.w, aspect.h)
    : undefined
  const hasFrameLocks = firstFramePath !== undefined || lastFramePath !== undefined
  if (firstFramePath !== undefined) {
    content.push({ type: 'image_url' as const, image_url: { url: await mediaSourceToDataUrl(firstFramePath) }, role: 'first_frame' })
  }
  if (lastFramePath !== undefined) {
    content.push({ type: 'image_url' as const, image_url: { url: await mediaSourceToDataUrl(lastFramePath) }, role: 'last_frame' })
  }
  // Official handbook: first/last entrance cannot mix with all-reference.
  const skipRefs = h3SkipReferences(firstFramePath, lastFramePath)
  if (!skipRefs) {
    for (const source of limitH3Refs(options.referenceImagePaths ?? [])) {
      content.push({ type: 'image_url' as const, image_url: { url: await mediaSourceToDataUrl(source) }, role: h3 ? 'reference_image' : 'reference' })
    }
  }
  const ratio = hasFrameLocks ? 'adaptive' : options.aspectRatio ?? '16:9'
  const parameters: Record<string, unknown> = {
    duration,
    ratio,
    resolution: h3 ? modelverseH3Resolution(options.resolution) : (options.resolution ?? '2K'),
    aigc_watermark: false,
  }
  const taskId = await submitModelverseTask(baseURL, apiKey, ctx.capability.model, content, parameters, ctx.signal)
  await ctx.ledger?.append({
    taskId,
    model: ctx.capability.model,
    mode: 'modelverse-tasks',
    prompt,
    state: 'submitted',
    at: Date.now(),
  })
  const finished = await pollModelverseTask(baseURL, apiKey, taskId, ctx.settings, ctx.signal, ctx.ledger)
    .catch(error => { throw withTaskId(error, taskId) })
  const files: MediaFile[] = []
  for (const url of finished.urls) {
    files.push({ url })
    if (files.length === 1 && /^https?:\/\//i.test(url)) {
      const path = await downloadToFile(url, ctx.settings.outputDir, slugify(prompt), '.mp4')
      files[0] = { path, url, mimeType: 'video/mp4' }
    }
  }
  await ctx.ledger?.append({
    taskId,
    model: ctx.capability.model,
    mode: 'modelverse-tasks',
    prompt,
    state: 'succeeded',
    at: Date.now(),
    urls: finished.urls,
    files,
  })
  return { model: ctx.capability.model, prompt, taskId, status: finished.status, files, mode: 'modelverse-tasks' }
}

export async function runVideo(
  ctx: ProviderContext,
  prompt: string,
  options: { seconds?: number; size?: string; aspectRatio?: string; resolution?: string; firstFramePath?: string; lastFramePath?: string; referenceImagePaths?: string[]; negativePrompt?: string },
): Promise<VideoResult> {
  try {
    if (ctx.capability.mode === 'mock') return mockVideo(ctx, prompt)
    if (ctx.capability.mode === 'openai-videos') return openaiVideo(ctx, prompt, options.seconds, options.size, { firstFramePath: options.firstFramePath })
    if (ctx.capability.mode === 'modelverse-tasks') return modelverseVideo(ctx, prompt, options)
    if (ctx.capability.mode === 'kling') return klingVideo(ctx, prompt, { ...options, negativePrompt: options.negativePrompt })
    if (ctx.capability.mode === 'runway') return runwayVideo(ctx, prompt, options)
    if (ctx.capability.mode === 'minimax-h3') return minimaxH3Video(ctx, prompt, options)
    if (ctx.capability.mode === 'kling-v3') return klingV3Video(ctx, prompt, options)
    if (ctx.capability.mode === 'vidu') return viduVideo(ctx, prompt, options)
    if (ctx.capability.mode === 'veo') return veoVideo(ctx, prompt, options)
    if (ctx.capability.mode === 'generic-rest') {
      if (ctx.adapter === undefined) throw new Error('generic-rest 需要已 commit 的 AdapterSpec（directorx_provider_commit）')
      return genericAsVideo(ctx, ctx.adapter, { prompt, ...options })
    }
    throw new Error(`Unsupported video mode: ${ctx.capability.mode}`)
  } catch (error) {
    // 失败分流：4xx（鉴权/参数）重试无效，5xx/超时（上游临时）可重试——
    // 把分类写进错误信息，agent 依此决定重试还是改配置。
    const message = error instanceof Error ? error.message : String(error)
    const httpMatch = message.match(/HTTP (\d{3})/)
    const classified = httpMatch !== null
      ? (Number(httpMatch[1]) >= 400 && Number(httpMatch[1]) < 500
        ? `${message} [失败分类: 4xx 参数/鉴权类——重试无效，检查 Settings 配置与参数]`
        : Number(httpMatch[1]) >= 500
          ? `${message} [失败分类: 5xx 上游临时——可稍后重试]`
          : message)
      : /timed out|abort|ECONNRESET|fetch failed/i.test(message)
        ? `${message} [失败分类: 网络/超时——可稍后重试]`
        : message
    // A timeout or abort may leave the provider task running: record the
    // local failure under the task id so directorx_task_status can surface
    // the orphan and directorx_cancel_task can mark it.
    const taskId = (error as { taskId?: string } | null)?.taskId
    const stillRunning = taskId !== undefined && taskId !== '' && /abort|timed out|timeout/i.test(message)
    if (stillRunning && !(await ctx.ledger?.isCancelled(taskId))) {
      await ctx.ledger?.append({
        taskId,
        model: ctx.capability.model,
        mode: ctx.capability.mode,
        prompt,
        state: 'submitted',
        at: Date.now(),
      }).catch(() => {})
      return {
        model: ctx.capability.model,
        prompt,
        taskId,
        status: 'submitted',
        files: [],
        mode: ctx.capability.mode,
        next: 'directorx_task_status',
      }
    }
    if (taskId !== undefined && taskId !== '' && !(await ctx.ledger?.isCancelled(taskId))) {
      await ctx.ledger?.append({
        taskId,
        model: ctx.capability.model,
        mode: ctx.capability.mode,
        prompt,
        state: 'failed',
        at: Date.now(),
        error: `${message} — the provider task may still be running; check directorx_task_status.`,
      }).catch(() => {})
    }
    const classifiedError = new Error(classified)
    ;(classifiedError as unknown as { taskId?: string }).taskId = taskId
    throw classifiedError
  }
}