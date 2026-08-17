import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { apiKeyOf, ensureOutputDir, readJsonResponse, slugify } from '../support.ts'
import type { AudioResult, MediaFile, ProviderContext } from './types.ts'

interface SpeechEnvelope {
  error?: { message?: string }
}

function makeWav(sampleRate = 16_000, seconds = 2): Buffer {
  const samples = Math.floor(sampleRate * seconds)
  const dataSize = samples * 2
  const buffer = Buffer.alloc(44 + dataSize)
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(1, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * 2, 28)
  buffer.writeUInt16LE(2, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)
  for (let i = 0; i < samples; i += 1) {
    const envelope = Math.min(1, i / (sampleRate * 0.05), (samples - i) / (sampleRate * 0.05))
    const value = Math.sin(2 * Math.PI * 220 * (i / sampleRate)) * envelope
    buffer.writeInt16LE(Math.round(value * 0.25 * 32767), 44 + i * 2)
  }
  return buffer
}

export async function mockAudio(ctx: ProviderContext, text: string): Promise<AudioResult> {
  const outDir = await ensureOutputDir(ctx.settings.outputDir)
  const path = join(outDir, `${slugify(text, 24)}-mock.wav`)
  await writeFile(path, makeWav())
  return { model: ctx.capability.model, text, files: [{ path, mimeType: 'audio/wav' }], mode: 'mock' }
}

export async function openaiTts(ctx: ProviderContext, text: string, voice?: string, format?: string, instructions?: string, speed?: number): Promise<AudioResult> {
  const baseURL = ctx.capability.baseURL.replace(/\/+$/, '')
  const apiKey = apiKeyOf(ctx.capability.apiKey, ['DIRECTORX_AUDIO_API_KEY', 'OPENAI_API_KEY'], baseURL)
  const models = ctx.capability.model === 'qwen3-tts-flash'
    ? [ctx.capability.model]
    : [ctx.capability.model, 'qwen3-tts-flash']
  const payloads: Record<string, unknown>[] = models.flatMap(model => [
    {
      model,
      input: text,
      ...(voice !== undefined && voice !== '' ? { voice } : {}),
      ...(format !== undefined && format !== '' ? { response_format: format } : {}),
      ...(instructions !== undefined && instructions !== '' ? { instructions } : {}),
      ...(speed !== undefined && speed > 0 ? { speed: Math.min(4, Math.max(0.25, speed)) } : {}),
    },
    { model, input: text },
  ])
  let lastError = 'unknown'
  let bytes: Buffer | undefined
  let usedModel = ctx.capability.model
  for (const payload of payloads) {
    const response = await fetch(`${baseURL}/audio/speech`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctx.signal,
    })
    if (response.ok) {
      bytes = Buffer.from(await response.arrayBuffer())
      usedModel = typeof payload.model === 'string' ? payload.model : ctx.capability.model
      break
    }
    const body = await readJsonResponse<SpeechEnvelope>(response).catch(() => ({}))
    lastError = `HTTP ${response.status}: ${JSON.stringify(body).slice(0, 400)}`
    if (response.status !== 400) break
  }
  if (bytes === undefined) throw new Error(`Audio generation failed (${lastError})`)
  const outDir = await ensureOutputDir(ctx.settings.outputDir)
  const ext = format === 'wav' ? 'wav' : format === 'opus' ? 'opus' : format === 'aac' ? 'aac' : 'mp3'
  const path = join(outDir, `${slugify(text, 24)}-${new Date().toISOString().replaceAll(':', '-').replace(/\.\d+Z$/, 'Z')}.${ext}`)
  await writeFile(path, bytes)
  const files: MediaFile[] = [{ path, mimeType: `audio/${ext === 'mp3' ? 'mpeg' : ext}` }]
  return { model: usedModel, text, files, mode: 'openai-tts' }
}

export async function runAudio(ctx: ProviderContext, text: string, options: { voice?: string; format?: string; instructions?: string; speed?: number }): Promise<AudioResult> {
  if (ctx.capability.mode === 'mock') return mockAudio(ctx, text)
  if (ctx.capability.mode === 'openai-tts') return openaiTts(ctx, text, options.voice, options.format, options.instructions, options.speed)
  throw new Error(`Unsupported audio mode: ${ctx.capability.mode}`)
}