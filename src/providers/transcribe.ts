import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { apiKeyOf, mimeForPath, readJsonResponse, slugify } from '../support.ts'
import type { MediaFile, ProviderContext } from './types.ts'

/**
 * Audio transcription through an OpenAI-compatible `/audio/transcriptions`
 * endpoint (multipart form). Reuses the `audio` capability configuration:
 * `mock` mode returns a deterministic transcript, any other mode sends the
 * real request to the configured Base URL / model.
 */

export interface TranscribeResult {
  model: string
  source: string
  language?: string
  text: string
  srt?: string
  files: MediaFile[]
  mode: string
}

interface TranscriptionEnvelope {
  text?: string
  error?: { message?: string }
}

/** A deterministic mock transcript; keeps the pipeline testable without a key. */
function mockText(source: string): string {
  return `[mock transcription] 这是一段模拟转写文本，用于验证字幕链路。来源：${source}。`
}

function toSrt(text: string, source: string): string {
  // Mock timing: one cue per sentence, 3s apart.
  const sentences = text.split(/(?<=[。！？!?])/).map(part => part.trim()).filter(part => part !== '')
  const cues = sentences.length > 0 ? sentences : [text]
  const lines: string[] = []
  let cursor = 0
  cues.forEach((cue, index) => {
    const start = cursor
    const end = cursor + 3
    const pad = (value: number) => String(value).padStart(2, '0')
    const stamp = (seconds: number) => `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor(seconds / 60) % 60)}:${pad(seconds % 60)},000`
    lines.push(String(index + 1), `${stamp(start)} --> ${stamp(end)}`, cue, '')
    cursor = end
  })
  void source
  return lines.join('\n').trimEnd()
}

export async function mockTranscribe(ctx: ProviderContext, source: string): Promise<TranscribeResult> {
  const text = mockText(source)
  const srt = toSrt(text, source)
  const dir = join(resolve(process.cwd(), ctx.settings.outputDir), 'transcripts')
  await mkdir(dir, { recursive: true })
  const stamp = new Date().toISOString().replaceAll(':', '-').replace(/\.\d+Z$/, 'Z')
  const srtPath = join(dir, `${slugify(source, 24)}-${stamp}.srt`)
  await writeFile(srtPath, srt, 'utf8')
  return {
    model: ctx.capability.model,
    source,
    text,
    srt,
    files: [{ path: srtPath, mimeType: 'application/x-subrip' }],
    mode: 'mock',
  }
}

export async function openaiTranscribe(
  ctx: ProviderContext,
  source: string,
  options: { language?: string; format?: 'json' | 'text' | 'srt' },
): Promise<TranscribeResult> {
  const baseURL = ctx.capability.baseURL.replace(/\/+$/, '')
  const apiKey = apiKeyOf(ctx.capability.apiKey, ['DIRECTORX_AUDIO_API_KEY', 'OPENAI_API_KEY'], baseURL)
  const bytes = await readFile(resolve(source))
  const form = new FormData()
  form.append('file', new Blob([bytes], { type: mimeForPath(source) }), slugify(source, 32) || 'audio')
  form.append('model', ctx.capability.model)
  form.append('response_format', options.format ?? 'json')
  if (options.language !== undefined && options.language !== '') form.append('language', options.language)

  const response = await fetch(`${baseURL}/audio/transcriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
    signal: ctx.signal,
  })
  if (!response.ok) {
    const body = await readJsonResponse<TranscriptionEnvelope>(response).catch(() => ({}))
    throw new Error(`Transcription failed (HTTP ${response.status}): ${JSON.stringify((body as TranscriptionEnvelope).error ?? body).slice(0, 400)}`)
  }
  const raw = await response.text()
  let text = raw
  if (options.format === undefined || options.format === 'json') {
    try {
      const parsed = JSON.parse(raw) as TranscriptionEnvelope
      text = parsed.text ?? ''
    } catch {
      text = raw
    }
  }
  if (text === '') throw new Error('Transcription returned empty text.')

  const dir = join(resolve(process.cwd(), ctx.settings.outputDir), 'transcripts')
  await mkdir(dir, { recursive: true })
  const stamp = new Date().toISOString().replaceAll(':', '-').replace(/\.\d+Z$/, 'Z')
  const files: MediaFile[] = []
  const srt = options.format === 'srt' ? text : undefined
  if (srt !== undefined) {
    const srtPath = join(dir, `${slugify(source, 24)}-${stamp}.srt`)
    await writeFile(srtPath, srt, 'utf8')
    files.push({ path: srtPath, mimeType: 'application/x-subrip' })
  } else {
    const txtPath = join(dir, `${slugify(source, 24)}-${stamp}.txt`)
    await writeFile(txtPath, text, 'utf8')
    files.push({ path: txtPath, mimeType: 'text/plain' })
  }
  return { model: ctx.capability.model, source, language: options.language, text, srt, files, mode: ctx.capability.mode }
}

export async function runTranscribe(
  ctx: ProviderContext,
  source: string,
  options: { language?: string; format?: 'json' | 'text' | 'srt' },
): Promise<TranscribeResult> {
  if (ctx.capability.mode === 'mock') return mockTranscribe(ctx, source)
  return openaiTranscribe(ctx, source, options)
}
