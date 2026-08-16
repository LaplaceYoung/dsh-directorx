import { downloadToFile, readJsonResponse } from '../support.ts'
import type { ProviderContext, VideoResult } from './types.ts'

/**
 * Vidu (api.vidu.cn) official v2: POST /ent/v2/reference2video with
 * `Authorization: Token <key>` (NOT Bearer), multi-subject references
 * (subjects[{name, images[]}] + @name in prompt), audio-native output,
 * and GET /ent/v2/tasks/{id}/creations polling.
 */

interface ViduCreateEnvelope {
  task_id?: string
  state?: string
  err_code?: string
}

interface ViduStatusEnvelope {
  id?: string
  state?: string
  err_code?: string
  creations?: Array<{ id?: string; url?: string }>
}

export interface ViduSubject {
  name: string
  images: string[]
  voiceId?: string
}

export async function viduVideo(
  ctx: ProviderContext,
  prompt: string,
  options: {
    seconds?: number
    aspectRatio?: string
    resolution?: string
    subjects?: ViduSubject[]
    generateAudio?: boolean
    audioType?: string
  },
): Promise<VideoResult> {
  const apiKey = ctx.capability.apiKey
  if (apiKey === '') throw new Error('Vidu 模式需要 API Key（Token）：Settings → DirectorX → 视频生成选择 vidu 模式后填写')
  const base = ctx.capability.baseURL.replace(/\/+$/, '')
  const headers = { Authorization: `Token ${apiKey}`, 'Content-Type': 'application/json' }
  const payload: Record<string, unknown> = {
    model: ctx.capability.model !== '' ? ctx.capability.model : 'viduq3',
    prompt,
    duration: options.seconds !== undefined && options.seconds > 0 ? Math.min(16, Math.max(3, Math.round(options.seconds))) : 5,
    aspect_ratio: options.aspectRatio ?? '16:9',
    ...(ctx.capability.resolution !== '' ? { resolution: ctx.capability.resolution } : {}),
  }
  if (options.subjects !== undefined && options.subjects.length > 0) {
    payload.subjects = options.subjects.map(subject => ({
      name: subject.name,
      images: subject.images.slice(0, 3),
      ...(subject.voiceId !== undefined && subject.voiceId !== '' ? { voice_id: subject.voiceId } : {}),
    }))
  }
  if (options.generateAudio === true) {
    payload.audio = true
    payload.audio_type = options.audioType ?? 'all'
  }
  const createResponse = await fetch(`${base}/ent/v2/reference2video`, { method: 'POST', headers, body: JSON.stringify(payload), signal: ctx.signal })
  const create = await readJsonResponse<ViduCreateEnvelope>(createResponse)
  const taskId = create.task_id
  if (!createResponse.ok || taskId === undefined || taskId === '') {
    throw new Error(`Vidu creation failed (HTTP ${createResponse.status}): ${create.err_code ?? JSON.stringify(create).slice(0, 300)}`)
  }
  await ctx.ledger?.append({ taskId, model: ctx.capability.model, mode: ctx.capability.mode, prompt, state: 'submitted', at: Date.now() }).catch(() => {})

  for (let attempt = 0; attempt < ctx.settings.maxPollAttempts; attempt += 1) {
    if (ctx.signal.aborted) throw new Error('Vidu polling cancelled')
    if (ctx.ledger !== undefined && await ctx.ledger.isCancelled(taskId)) throw new Error(`Task ${taskId} was cancelled via directorx_cancel_task`)
    await new Promise(resolve => setTimeout(resolve, ctx.settings.pollIntervalMs))
    const statusResponse = await fetch(`${base}/ent/v2/tasks/${encodeURIComponent(taskId)}/creations`, { headers, signal: ctx.signal })
    const status = await readJsonResponse<ViduStatusEnvelope>(statusResponse)
    const state = (status.state ?? '').toLowerCase()
    if (state === 'success') {
      const urls = (status.creations ?? []).map(creation => creation.url).filter((url): url is string => typeof url === 'string' && url !== '')
      if (urls.length === 0) throw new Error(`Vidu task ${taskId} succeeded with no creations`)
      const files = []
      for (const url of urls) files.push(await downloadToFile(url, ctx.settings.outputDir, 'vidu', '.mp4'))
      await ctx.ledger?.append({ taskId, model: ctx.capability.model, mode: ctx.capability.mode, prompt, state: 'succeeded', at: Date.now(), files: files.map(file => ({ path: file })), urls }).catch(() => {})
      return { model: ctx.capability.model, prompt, taskId, status: 'succeed', files: files.map(file => ({ path: file })), mode: 'vidu' }
    }
    if (state === 'failed') {
      const message = status.err_code ?? 'unknown error'
      await ctx.ledger?.append({ taskId, model: ctx.capability.model, mode: ctx.capability.mode, prompt, state: 'failed', at: Date.now(), error: message }).catch(() => {})
      throw new Error(`Vidu task ${taskId} failed: ${message}`)
    }
  }
  throw new Error(`Vidu task ${taskId} timed out after ${ctx.settings.maxPollAttempts} attempts`)
}
