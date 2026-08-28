/**
 * kie.ai Jobs API — MiniMax H3 + GPT Image 2.
 * Protocol: POST /api/v1/jobs/createTask → poll recordInfo.
 * Local files upload at kieai.redpandaai.co (api.kie.ai upload 404s).
 */
import { existsSync, readFileSync, createWriteStream } from 'node:fs'
import { basename } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

const JOBS = 'https://api.kie.ai'
const UPLOAD = 'https://kieai.redpandaai.co'

function mimeFor(path) {
  if (/\.png$/i.test(path)) return 'image/png'
  if (/\.webp$/i.test(path)) return 'image/webp'
  if (/\.jpe?g$/i.test(path)) return 'image/jpeg'
  if (/\.mp4$/i.test(path)) return 'video/mp4'
  return 'application/octet-stream'
}

export function loadKieKey() {
  if (process.env.KIE_API_KEY) return process.env.KIE_API_KEY.trim()
  if (process.env.MOSSLAND_VIDEO_API_KEY && /kie/i.test(process.env.MOSSLAND_VIDEO_BASE_URL ?? '')) {
    return process.env.MOSSLAND_VIDEO_API_KEY.trim()
  }
  const files = [
    resolveMaybe(process.env.KIE_KEY_FILE),
    '/Users/laplace/Desktop/sos/directorx/configs/agent.local.yaml',
    '/Users/laplace/Desktop/sos/directorx/configs/agent.local.yaml.bak-20260814',
  ].filter(Boolean)
  for (const file of files) {
    if (!existsSync(file)) continue
    const key = keyFromYaml(readFileSync(file, 'utf8'))
    if (key) return key
  }
  throw new Error('找不到 kie.ai key：设 KIE_API_KEY，或在 directorx/configs 里放 model_provider: kie')
}

function resolveMaybe(value) {
  return typeof value === 'string' && value !== '' ? value : undefined
}

function keyFromYaml(text) {
  const lines = text.split('\n')
  let section
  let provider
  let apiKey
  const take = () => {
    if (provider === 'kie' && typeof apiKey === 'string' && apiKey !== '') return apiKey
    return undefined
  }
  for (const line of lines) {
    const top = line.match(/^([A-Za-z]+):\s*$/)
    if (top) {
      const hit = take()
      if (hit) return hit
      section = top[1]
      provider = undefined
      apiKey = undefined
      continue
    }
    if (section !== 'image' && section !== 'video') continue
    const kv = line.match(/^  ([A-Za-z_]+):\s*(.*)$/)
    if (!kv) continue
    const value = kv[2].trim().replace(/^['"]|['"]$/g, '')
    if (kv[1] === 'model_provider') provider = value
    if (kv[1] === 'api_key') apiKey = value
    if (kv[1] === 'base_url' && /kie\.ai/i.test(value) && !provider) provider = 'kie'
  }
  return take()
}

async function envelope(url, init) {
  const response = await fetch(url, init)
  const body = await response.json().catch(() => ({}))
  return { response, body }
}

export async function kieUpload(apiKey, path, uploadPath = 'directorx/refs') {
  if (/^https?:\/\//i.test(path)) return path
  if (!existsSync(path)) throw new Error(`kie upload 找不到文件：${path}`)
  const data = readFileSync(path)
  if (data.length > 30 * 1024 * 1024) throw new Error(`kie 单文件 >30MB：${path}`)
  const { response, body } = await envelope(`${UPLOAD}/api/file-base64-upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      base64Data: `data:${mimeFor(path)};base64,${data.toString('base64')}`,
      uploadPath,
      fileName: basename(path),
    }),
    signal: AbortSignal.timeout(300_000),
  })
  const url = body?.data?.downloadUrl
  if (!response.ok || typeof url !== 'string' || url === '') {
    throw new Error(`kie upload failed: ${response.status} ${JSON.stringify({ code: body.code, msg: body.msg }).slice(0, 240)}`)
  }
  return url
}

export async function kieCreateTask(apiKey, model, input) {
  const { response, body } = await envelope(`${JOBS}/api/v1/jobs/createTask`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, input }),
    signal: AbortSignal.timeout(120_000),
  })
  const taskId = body?.data?.taskId
  if (!response.ok || body.code !== 200 || typeof taskId !== 'string' || taskId === '') {
    throw new Error(`kie createTask(${model}) failed: ${response.status} ${JSON.stringify(body).slice(0, 360)}`)
  }
  return taskId
}

export async function kieWait(apiKey, taskId, { intervalMs = 10_000, maxAttempts = 120, label = 'kie' } = {}) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    await new Promise(resolve => setTimeout(resolve, intervalMs))
    const { response, body } = await envelope(`${JOBS}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(60_000),
    })
    const state = body?.data?.state ?? ''
    process.stdout.write(`  ${label} ${taskId} ${state || `HTTP ${response.status}`} (${attempt + 1}/${maxAttempts})\n`)
    if (state === 'success') {
      const raw = body?.data?.resultJson
      let parsed = raw
      if (typeof raw === 'string') {
        try { parsed = JSON.parse(raw) } catch { parsed = {} }
      }
      const urls = (parsed?.resultUrls ?? []).filter(item => typeof item === 'string' && item !== '')
      if (urls.length === 0) throw new Error(`kie task ${taskId} success but no resultUrls`)
      return urls
    }
    if (state === 'fail') {
      throw new Error(`kie task ${taskId} failed: ${body?.data?.failMsg ?? body?.data?.failCode ?? body?.msg ?? 'unknown'}`)
    }
  }
  throw new Error(`kie task ${taskId} timed out`)
}

export async function kieDownload(url, dest) {
  const response = await fetch(url, { signal: AbortSignal.timeout(180_000) })
  if (!response.ok || response.body === null) throw new Error(`kie download ${response.status} ${url}`)
  await pipeline(Readable.fromWeb(response.body), createWriteStream(dest))
  return dest
}

export async function kieImage2(apiKey, { prompt, references = [], dest, aspectRatio = '16:9', resolution = '2K' }) {
  const input = { prompt, aspect_ratio: aspectRatio, resolution }
  let model = 'gpt-image-2-text-to-image'
  if (references.length > 0) {
    model = 'gpt-image-2-image-to-image'
    input.input_urls = []
    for (const path of references) input.input_urls.push(await kieUpload(apiKey, path, 'directorx/image2'))
  }
  const taskId = await kieCreateTask(apiKey, model, input)
  const [url] = await kieWait(apiKey, taskId, { intervalMs: 5_000, label: `image2 ${model}` })
  return kieDownload(url, dest)
}

export async function kieH3Ref2v(apiKey, { prompt, references, dest, seconds = 15, aspectRatio = '16:9', resolution = '2K' }) {
  const urls = []
  for (const path of references.slice(0, 9)) urls.push(await kieUpload(apiKey, path, 'directorx/h3-refs'))
  const taskId = await kieCreateTask(apiKey, 'minimax-h3/reference-to-video', {
    prompt,
    reference_image_urls: urls,
    aspect_ratio: aspectRatio,
    duration: Math.min(15, Math.max(4, Math.round(seconds))),
    resolution,
  })
  const [url] = await kieWait(apiKey, taskId, { intervalMs: 10_000, maxAttempts: 150, label: 'h3 ref2v' })
  return kieDownload(url, dest)
}
