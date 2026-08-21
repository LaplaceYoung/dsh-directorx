import { apiKeyOf, isLocalBaseUrl, isHttpUrl, mediaSourceToDataUrl, readJsonResponse, stringContentOf } from '../support.ts'
import { DEEPSEEK_PUBLIC_BASE_URL } from '../modelverse-catalog.ts'
import type { ProviderContext, VisionResult } from './types.ts'

interface ChatCompletion {
  choices?: Array<{ message?: { content?: unknown } }>
  error?: { message?: string }
}

/**
 * DeepSeek first-party vision wire limits, mirroring the DSH 0.1.1-rc.1
 * `deepseek-official` adapter: PNG/JPEG/WebP/GIF only, and a 20 MiB
 * accumulated base64 image payload per request under the official 30 MiB
 * request-body limit. DirectorX inlines one image per request, so the raw
 * byte cap is 15 MiB (15 MiB raw ≈ 20 MiB base64).
 */
const DEEPSEEK_IMAGE_MIMES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
const DEEPSEEK_MAX_IMAGE_BYTES = 15 * 1024 * 1024

export const DEEPSEEK_VISION_MODEL = 'deepseek-v4-flash-vision-exp'

export async function mockVision(ctx: ProviderContext, source: string, question: string): Promise<VisionResult> {
  const isImage = /\.(png|jpe?g|webp|gif)$/i.test(source)
  return {
    model: ctx.capability.model,
    question,
    answer: `[mock vision] received ${isImage ? 'image' : 'source'} "${source}" and question "${question}". Set DirectorX → Vision mode to deepseek-chat (or openai-chat) with a real Base URL / API Key for actual answers.`,
    source,
  }
}

function mimeOfDataUrl(dataUrl: string): string {
  return /^data:([^;,]+)/i.exec(dataUrl)?.[1]?.toLowerCase() ?? ''
}

function assertDeepSeekImage(dataUrl: string): void {
  const mime = mimeOfDataUrl(dataUrl)
  if (!DEEPSEEK_IMAGE_MIMES.has(mime)) {
    throw new Error(`DeepSeek first-party vision accepts PNG/JPEG/WebP/GIF only, got "${mime || 'unknown'}".`)
  }
}

/** Inline any accepted source as a data URL; the first-party route never sends external URLs. */
async function inlineImageForDeepSeek(source: string): Promise<string> {
  if (/^data:/i.test(source)) {
    assertDeepSeekImage(source)
    return source
  }
  if (isHttpUrl(source)) {
    const response = await fetch(source)
    if (!response.ok) throw new Error(`Image download failed (HTTP ${response.status}): ${source}`)
    const bytes = Buffer.from(await response.arrayBuffer())
    if (bytes.length > DEEPSEEK_MAX_IMAGE_BYTES) {
      throw new Error(`Image too large to inline (${Math.round(bytes.length / 1024 / 1024)}MB > ${Math.round(DEEPSEEK_MAX_IMAGE_BYTES / 1024 / 1024)}MB): ${source}`)
    }
    const mime = (response.headers.get('content-type') ?? '').split(';')[0]?.trim().toLowerCase()
    if (!DEEPSEEK_IMAGE_MIMES.has(mime)) {
      throw new Error(`DeepSeek first-party vision accepts PNG/JPEG/WebP/GIF only, got "${mime || 'unknown'}" from ${source}.`)
    }
    return `data:${mime};base64,${bytes.toString('base64')}`
  }
  const dataUrl = await mediaSourceToDataUrl(source, DEEPSEEK_MAX_IMAGE_BYTES)
  if (!/^data:/i.test(dataUrl)) throw new Error(`Cannot inline source as an image: ${source}`)
  assertDeepSeekImage(dataUrl)
  return dataUrl
}

async function postChatCompletion(
  baseURL: string,
  apiKey: string,
  model: string,
  content: Array<Record<string, unknown>>,
  signal: AbortSignal,
): Promise<string> {
  const response = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content }],
      max_tokens: 2048,
    }),
    signal,
  })
  const body = await readJsonResponse<ChatCompletion>(response)
  if (!response.ok) {
    throw new Error(`Vision request failed (HTTP ${response.status}): ${JSON.stringify(body.error ?? body).slice(0, 400)}`)
  }
  const answer = stringContentOf(body.choices?.[0]?.message?.content).trim()
  if (answer === '') throw new Error('Vision response contained no text content.')
  return answer
}

export async function openaiVision(ctx: ProviderContext, source: string, question: string): Promise<VisionResult> {
  const baseURL = ctx.capability.baseURL.replace(/\/+$/, '')
  const apiKey = apiKeyOf(ctx.capability.apiKey, ['DIRECTORX_VISION_API_KEY', 'OPENAI_API_KEY'], baseURL)
  const image = await mediaSourceToDataUrl(source)
  const content = isHttpUrl(image) || /^data:/i.test(image)
    ? [{ type: 'text', text: question }, { type: 'image_url', image_url: { url: image } }]
    : [{ type: 'text', text: `${question}\n\nSource path: ${source}` }]
  const answer = await postChatCompletion(baseURL, apiKey, ctx.capability.model, content, ctx.signal)
  return { model: ctx.capability.model, question, answer, source }
}

/**
 * DeepSeek first-party multimodal route (DSH 0.1.1-rc.1 `deepseek-official`
 * wire): OpenAI-compatible chat completions at `https://api.deepseek.com`,
 * image bytes inlined as an `image_url` data URL. The API key falls back to
 * `DEEPSEEK_API_KEY`, the same credential DSH itself resolves.
 */
export async function deepseekVision(ctx: ProviderContext, source: string, question: string): Promise<VisionResult> {
  const baseURL = (ctx.capability.baseURL.trim() === '' ? DEEPSEEK_PUBLIC_BASE_URL : ctx.capability.baseURL).replace(/\/+$/, '')
  const apiKey = apiKeyOf(ctx.capability.apiKey, ['DIRECTORX_VISION_API_KEY', 'DEEPSEEK_API_KEY'], baseURL)
  const image = await inlineImageForDeepSeek(source)
  const content = [
    { type: 'text', text: question },
    { type: 'image_url', image_url: { url: image } },
  ]
  const answer = await postChatCompletion(baseURL, apiKey, ctx.capability.model, content, ctx.signal)
  return { model: ctx.capability.model, question, answer, source }
}

export async function runVision(ctx: ProviderContext, source: string, question: string): Promise<VisionResult> {
  if (ctx.capability.mode === 'mock') return mockVision(ctx, source, question)
  if (ctx.capability.mode === 'deepseek-chat') return deepseekVision(ctx, source, question)
  if (ctx.capability.mode === 'openai-chat') return openaiVision(ctx, source, question)
  throw new Error(`Unsupported vision mode: ${ctx.capability.mode}`)
}

export function describeVisionMode(mode: string): string {
  if (mode === 'mock') return 'mock mode; no network request'
  if (mode === 'deepseek-chat') return 'DeepSeek first-party POST {baseURL}/chat/completions (image inlined as data URL; DEEPSEEK_API_KEY)'
  return 'OpenAI-compatible POST {baseURL}/chat/completions'
}
