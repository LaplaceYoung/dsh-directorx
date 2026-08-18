import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'
import { apiKeyOf, downloadToFile, ensureOutputDir, mediaSourceToDataUrl, mimeForPath, readJsonResponse, saveBase64ToFile, slugify } from '../support.ts'
import { currentProjectRoot } from '../project.ts'
import { pollModelverseTask, submitModelverseTask } from './tasks.ts'
import { genericAsImage } from './generic-rest.ts'
import type { ImageResult, MediaFile, ProviderContext } from './types.ts'

interface ImagesEnvelope {
  data?: Array<{ b64_json?: string; url?: string }>
  error?: { message?: string }
}

export async function mockImage(ctx: ProviderContext, prompt: string, size: string): Promise<ImageResult> {
  const outDir = await ensureOutputDir(ctx.settings.outputDir)
  const name = `${slugify(prompt, 24)}-${size.replace(/[^\d]/g, 'x')}.svg`
  const path = join(outDir, name)
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">',
    '<rect width="100%" height="100%" fill="#0b1020"/>',
    '<text x="50%" y="50%" fill="#9fd8ff" font-family="sans-serif" font-size="28" text-anchor="middle">DirectorX mock image</text>',
    '</svg>',
  ].join('')
  await writeFile(path, svg, 'utf8')
  return {
    model: ctx.capability.model,
    prompt,
    files: [{ path, mimeType: 'image/svg+xml' }],
    mode: 'mock',
  }
}

function resolveLocalImage(source: string): string {
  if (existsSync(source)) return source
  const project = currentProjectRoot()
  const hit = [resolve(source), resolve(project, source)].find(candidate => existsSync(candidate))
  if (hit === undefined) throw new Error(`File not found: ${source}`)
  return hit
}

async function filesFromImageEnvelope(ctx: ProviderContext, prompt: string, body: ImagesEnvelope): Promise<MediaFile[]> {
  const first = body.data?.[0]
  if (first === undefined) throw new Error(`Image response contained no data: ${JSON.stringify(body).slice(0, 300)}`)
  const files: MediaFile[] = []
  if (first.b64_json !== undefined) {
    const path = await saveBase64ToFile(first.b64_json, ctx.settings.outputDir, slugify(prompt), 'png')
    files.push({ path, mimeType: 'image/png' })
  } else if (first.url !== undefined) {
    if (/^https?:\/\//i.test(first.url)) {
      const path = await downloadToFile(first.url, ctx.settings.outputDir, slugify(prompt), '.png')
      files.push({ path, url: first.url, mimeType: 'image/png' })
    } else {
      files.push({ url: first.url })
    }
  } else {
    throw new Error(`Image response item contained neither b64_json nor url: ${JSON.stringify(first).slice(0, 300)}`)
  }
  return files
}

async function openaiImageEdit(
  ctx: ProviderContext,
  prompt: string,
  size: string | undefined,
  quality: string | undefined,
  referenceImagePaths: string[],
): Promise<ImageResult> {
  const baseURL = ctx.capability.baseURL.replace(/\/+$/, '')
  const apiKey = apiKeyOf(ctx.capability.apiKey, ['DIRECTORX_IMAGE_API_KEY', 'OPENAI_API_KEY'], baseURL)
  const blobs: Array<{ blob: Blob; name: string }> = []
  for (const source of referenceImagePaths.slice(0, 4)) {
    const path = resolveLocalImage(source)
    const bytes = await readFile(path)
    blobs.push({ blob: new Blob([new Uint8Array(bytes)], { type: mimeForPath(path) }), name: basename(path) })
  }
  const post = async (field: 'image' | 'image[]', extras: Record<string, string>) => {
    const form = new FormData()
    form.append('model', ctx.capability.model)
    form.append('prompt', prompt)
    form.append('n', '1')
    if (size !== undefined && size !== '') form.append('size', size)
    if (quality !== undefined && quality !== '') form.append('quality', quality)
    for (const [key, value] of Object.entries(extras)) form.append(key, value)
    for (const item of blobs) form.append(field, item.blob, item.name)
    const response = await fetch(`${baseURL}/images/edits`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: ctx.signal,
    })
    const body = await readJsonResponse<ImagesEnvelope>(response)
    return { response, body }
  }
  let { response, body } = await post('image', {})
  if (!response.ok) ({ response, body } = await post('image[]', {}))
  if (!response.ok) ({ response, body } = await post('image', { input_fidelity: 'high' }))
  if (!response.ok) {
    throw new Error(`Image edit failed (HTTP ${response.status}): ${JSON.stringify(body.error ?? body).slice(0, 400)}`)
  }
  return { model: ctx.capability.model, prompt, files: await filesFromImageEnvelope(ctx, prompt, body), mode: 'openai-images' }
}

export async function openaiImage(
  ctx: ProviderContext,
  prompt: string,
  size?: string,
  quality?: string,
  referenceImagePaths: string[] = [],
): Promise<ImageResult> {
  if (referenceImagePaths.length > 0) {
    try {
      return await openaiImageEdit(ctx, prompt, size, quality, referenceImagePaths)
    } catch {
      // gpt-image-2 is not a modelverse task model. If edits is down, keep
      // generating so the shot still lands; identity then lives in the prompt
      // and in the 16:9 first/last frames of the video step.
      return openaiImage(ctx, `${prompt}\n\nUse the locked costume and face from the written character bible. Do not invent extra people.`, size, quality, [])
    }
  }
  const baseURL = ctx.capability.baseURL.replace(/\/+$/, '')
  const apiKey = apiKeyOf(ctx.capability.apiKey, ['DIRECTORX_IMAGE_API_KEY', 'OPENAI_API_KEY'], baseURL)
  const payload: Record<string, unknown> = { model: ctx.capability.model, prompt, n: 1 }
  if (size !== undefined && size !== '') payload.size = size
  if (quality !== undefined && quality !== '') payload.quality = quality
  const response = await fetch(`${baseURL}/images/generations`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: ctx.signal,
  })
  const body = await readJsonResponse<ImagesEnvelope>(response)
  if (!response.ok) {
    throw new Error(`Image generation failed (HTTP ${response.status}): ${JSON.stringify(body.error ?? body).slice(0, 400)}`)
  }
  return { model: ctx.capability.model, prompt, files: await filesFromImageEnvelope(ctx, prompt, body), mode: 'openai-images' }
}

export async function modelverseImage(
  ctx: ProviderContext,
  prompt: string,
  size?: string,
  referenceImagePaths: string[] = [],
): Promise<ImageResult> {
  const baseURL = ctx.capability.baseURL.replace(/\/+$/, '')
  const apiKey = apiKeyOf(ctx.capability.apiKey, ['DIRECTORX_IMAGE_API_KEY', 'OPENAI_API_KEY'], baseURL)
  const content = [
    { type: 'text' as const, text: prompt },
    ...await Promise.all(referenceImagePaths.slice(0, 16).map(async source => ({
      type: 'image_url' as const,
      image_url: { url: await mediaSourceToDataUrl(source) },
      role: 'reference',
    }))),
  ]
  const parameters: Record<string, unknown> = { size: size !== undefined && size !== '' ? size : '1024x1024' }
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
    .catch(error => {
      const taskIdError = (error as Error & { taskId?: string })
      taskIdError.taskId = taskId
      throw taskIdError
    })
  const files: MediaFile[] = []
  for (const url of finished.urls) {
    files.push({ url })
    if (files.length === 1 && /^https?:\/\//i.test(url)) {
      const path = await downloadToFile(url, ctx.settings.outputDir, `${slugify(prompt)}-image`, '.png')
      files[0] = { path, url, mimeType: 'image/png' }
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
  return { model: ctx.capability.model, prompt, files, mode: 'modelverse-tasks' }
}

export async function runImage(
  ctx: ProviderContext,
  prompt: string,
  options: { size?: string; quality?: string; referenceImagePaths?: string[] },
): Promise<ImageResult> {
  try {
    if (ctx.capability.mode === 'mock') return mockImage(ctx, prompt, options.size ?? '1024x1024')
    if (ctx.capability.mode === 'openai-images') {
      return openaiImage(ctx, prompt, options.size, options.quality, options.referenceImagePaths ?? [])
    }
    if (ctx.capability.mode === 'modelverse-tasks') return modelverseImage(ctx, prompt, options.size, options.referenceImagePaths ?? [])
    if (ctx.capability.mode === 'generic-rest') {
      if (ctx.adapter === undefined) throw new Error('generic-rest 需要已 commit 的 AdapterSpec（directorx_provider_commit）')
      return genericAsImage(ctx, ctx.adapter, { prompt, size: options.size })
    }
    throw new Error(`Unsupported image mode: ${ctx.capability.mode}`)
  } catch (error) {
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