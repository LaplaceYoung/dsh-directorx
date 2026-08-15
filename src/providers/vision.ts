import { apiKeyOf, isLocalBaseUrl, isHttpUrl, mediaSourceToDataUrl, readJsonResponse, stringContentOf } from '../support.ts'
import type { ProviderContext, VisionResult } from './types.ts'

interface ChatCompletion {
  choices?: Array<{ message?: { content?: unknown } }>
  error?: { message?: string }
}

export async function mockVision(ctx: ProviderContext, source: string, question: string): Promise<VisionResult> {
  const isImage = /\.(png|jpe?g|webp|gif)$/i.test(source)
  return {
    model: ctx.capability.model,
    question,
    answer: `[mock vision] received ${isImage ? 'image' : 'source'} "${source}" and question "${question}". Set DirectorX → Vision mode to openai-chat with a real Base URL / API Key for actual answers.`,
    source,
  }
}

export async function openaiVision(ctx: ProviderContext, source: string, question: string): Promise<VisionResult> {
  const baseURL = ctx.capability.baseURL.replace(/\/+$/, '')
  const apiKey = apiKeyOf(ctx.capability.apiKey, ['DIRECTORX_VISION_API_KEY', 'OPENAI_API_KEY'], baseURL)
  const image = await mediaSourceToDataUrl(source)
  const content = isHttpUrl(image) || /^data:/i.test(image)
    ? [{ type: 'text', text: question }, { type: 'image_url', image_url: { url: image } }]
    : [{ type: 'text', text: `${question}\n\nSource path: ${source}` }]

  const response = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: ctx.capability.model,
      messages: [{ role: 'user', content }],
      max_tokens: 2048,
    }),
    signal: ctx.signal,
  })
  const body = await readJsonResponse<ChatCompletion>(response)
  if (!response.ok) {
    throw new Error(`Vision request failed (HTTP ${response.status}): ${JSON.stringify(body.error ?? body).slice(0, 400)}`)
  }
  const answer = stringContentOf(body.choices?.[0]?.message?.content).trim()
  if (answer === '') throw new Error('Vision response contained no text content.')
  return { model: ctx.capability.model, question, answer, source }
}

export async function runVision(ctx: ProviderContext, source: string, question: string): Promise<VisionResult> {
  if (ctx.capability.mode === 'mock') return mockVision(ctx, source, question)
  if (ctx.capability.mode === 'openai-chat') return openaiVision(ctx, source, question)
  throw new Error(`Unsupported vision mode: ${ctx.capability.mode}`)
}

export function describeVisionMode(mode: string): string {
  if (mode === 'mock') return 'mock mode; no network request'
  return 'OpenAI-compatible POST {baseURL}/chat/completions'
}