import { readJsonResponse } from '../support.ts'
import type { DirectorxSettings } from '../config.ts'

export interface TaskContentItem {
  type: 'text' | 'image_url' | 'video_url'
  text?: string
  image_url?: { url: string }
  video_url?: { url: string }
  role?: string
}

interface SubmitEnvelope {
  output?: { task_id?: string }
  error?: { message?: string }
}

export interface StatusEnvelope {
  output?: {
    task_id?: string
    task_status?: string
    status?: string
    urls?: string[]
    url?: string
    error_message?: string
  }
  error?: { message?: string }
}

const SUCCESS_STATES = new Set(['success', 'succeeded', 'completed', 'complete', 'finished', 'done'])
const FAILURE_STATES = new Set(['failed', 'failure', 'error', 'cancelled', 'canceled'])

export async function submitModelverseTask(
  baseURL: string,
  apiKey: string,
  model: string,
  content: TaskContentItem[],
  parameters: Record<string, unknown>,
  signal: AbortSignal,
): Promise<string> {
  const response = await fetch(`${baseURL.replace(/\/+$/, '')}/tasks/submit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, input: { content }, parameters }),
    signal,
  })
  const body = await readJsonResponse<SubmitEnvelope>(response)
  const taskId = body.output?.task_id
  if (!response.ok || !taskId) {
    throw new Error(`modelverse tasks/submit(${model}) failed: ${response.status} ${JSON.stringify(body.error ?? body).slice(0, 400)}`)
  }
  return taskId
}

export async function pollModelverseTask(
  baseURL: string,
  apiKey: string,
  taskId: string,
  settings: DirectorxSettings,
  signal: AbortSignal,
): Promise<{ urls: string[]; status: string }> {
  const base = baseURL.replace(/\/+$/, '')
  for (let attempt = 0; attempt < settings.maxPollAttempts; attempt += 1) {
    if (signal.aborted) throw new Error('Task polling cancelled')
    await new Promise(resolve => setTimeout(resolve, settings.pollIntervalMs))
    const response = await fetch(`${base}/tasks/status?task_id=${encodeURIComponent(taskId)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal,
    })
    const body = await readJsonResponse<StatusEnvelope>(response)
    const rawStatus = body.output?.task_status ?? body.output?.status ?? ''
    const status = rawStatus.toLowerCase()
    if (SUCCESS_STATES.has(status)) {
      const urls = [...(body.output?.urls ?? []), ...(body.output?.url ? [body.output.url] : [])]
        .filter((url): url is string => typeof url === 'string' && url.length > 0)
      if (urls.length === 0) throw new Error(`modelverse task ${taskId} succeeded but returned no result URLs`)
      return { urls, status: rawStatus }
    }
    if (FAILURE_STATES.has(status)) {
      throw new Error(`modelverse task ${taskId} failed: ${body.output?.error_message ?? rawStatus ?? 'unknown error'}`)
    }
  }
  throw new Error(`modelverse task ${taskId} did not finish within ${settings.maxPollAttempts * settings.pollIntervalMs}ms`)
}

export async function pollOpenAIVideoTask(
  baseURL: string,
  apiKey: string,
  taskId: string,
  settings: DirectorxSettings,
  signal: AbortSignal,
): Promise<{ urls: string[]; status: string }> {
  const base = baseURL.replace(/\/+$/, '')
  for (let attempt = 0; attempt < settings.maxPollAttempts; attempt += 1) {
    if (signal.aborted) throw new Error('Video polling cancelled')
    await new Promise(resolve => setTimeout(resolve, settings.pollIntervalMs))
    const response = await fetch(`${base}/videos/${encodeURIComponent(taskId)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal,
    })
    const body = await readJsonResponse<StatusEnvelope>(response)
    if (!response.ok) {
      throw new Error(`Video status request failed (HTTP ${response.status}): ${JSON.stringify(body).slice(0, 400)}`)
    }
    const rawStatus = body.output?.status ?? (body as unknown as Record<string, unknown>).status ?? ''
    const status = String(rawStatus).toLowerCase()
    if (status === 'completed' || status === 'succeeded' || status === 'success') {
      const topLevel = body as unknown as { urls?: unknown; url?: unknown }
      const urls = [
        ...(body.output?.urls ?? []),
        ...(body.output?.url ? [body.output.url] : []),
        ...(Array.isArray(topLevel.urls) ? topLevel.urls : []),
        ...(typeof topLevel.url === 'string' ? [topLevel.url] : []),
      ].filter((url): url is string => typeof url === 'string' && url.length > 0)
      if (urls.length === 0) throw new Error(`video task ${taskId} completed but returned no URLs`)
      return { urls, status: String(rawStatus) }
    }
    if (status === 'failed' || status === 'cancelled' || status === 'error') {
      throw new Error(`video task ${taskId} failed: ${JSON.stringify(body).slice(0, 400)}`)
    }
  }
  throw new Error(`video task ${taskId} did not finish within ${settings.maxPollAttempts * settings.pollIntervalMs}ms`)
}