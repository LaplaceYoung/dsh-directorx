import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { apiKeyOf, downloadToFile, ensureOutputDir, mediaSourceToDataUrl, readJsonResponse, slugify } from '../support.ts'
import { pollModelverseTask, pollOpenAIVideoTask, submitModelverseTask } from './tasks.ts'
import { klingVideo, runwayVideo } from './video-models.ts'
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

export async function openaiVideo(ctx: ProviderContext, prompt: string, seconds?: number, size?: string): Promise<VideoResult> {
  const baseURL = ctx.capability.baseURL.replace(/\/+$/, '')
  const apiKey = apiKeyOf(ctx.capability.apiKey, ['DIRECTORX_VIDEO_API_KEY', 'OPENAI_API_KEY'], baseURL)
  const payload: Record<string, unknown> = { model: ctx.capability.model, prompt }
  if (seconds !== undefined && seconds > 0) payload.seconds = seconds
  if (size !== undefined && size !== '') payload.size = size
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
  const duration = Math.min(15, Math.max(4, Math.round(options.seconds ?? 5)))
  const content: Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string }; role?: string }> = [{ type: 'text', text: prompt }]
  const hasFrameLocks = options.firstFramePath !== undefined || options.lastFramePath !== undefined
  if (options.firstFramePath !== undefined) {
    content.push({ type: 'image_url' as const, image_url: { url: await mediaSourceToDataUrl(options.firstFramePath) }, role: 'first_frame' })
  }
  if (options.lastFramePath !== undefined) {
    content.push({ type: 'image_url' as const, image_url: { url: await mediaSourceToDataUrl(options.lastFramePath) }, role: 'last_frame' })
  }
  for (const source of options.referenceImagePaths ?? []) {
    content.push({ type: 'image_url' as const, image_url: { url: await mediaSourceToDataUrl(source) }, role: 'reference' })
  }
  const ratio = hasFrameLocks ? 'adaptive' : options.aspectRatio ?? '16:9'
  const parameters: Record<string, unknown> = { duration, ratio, resolution: options.resolution ?? '2K', aigc_watermark: false }
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
  options: { seconds?: number; size?: string; aspectRatio?: string; resolution?: string; firstFramePath?: string; lastFramePath?: string; referenceImagePaths?: string[] },
): Promise<VideoResult> {
  try {
    if (ctx.capability.mode === 'mock') return mockVideo(ctx, prompt)
    if (ctx.capability.mode === 'openai-videos') return openaiVideo(ctx, prompt, options.seconds, options.size)
    if (ctx.capability.mode === 'modelverse-tasks') return modelverseVideo(ctx, prompt, options)
    if (ctx.capability.mode === 'kling') return klingVideo(ctx, prompt, options)
    if (ctx.capability.mode === 'runway') return runwayVideo(ctx, prompt, options)
    throw new Error(`Unsupported video mode: ${ctx.capability.mode}`)
  } catch (error) {
    // A timeout or abort may leave the provider task running: record the
    // local failure under the task id so directorx_task_status can surface
    // the orphan and directorx_cancel_task can mark it.
    const taskId = (error as { taskId?: string } | null)?.taskId
    if (taskId !== undefined && taskId !== '' && !(await ctx.ledger?.isCancelled(taskId))) {
      const message = error instanceof Error ? error.message : String(error)
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
    throw error
  }
}