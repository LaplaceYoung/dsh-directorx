import type { CapabilitySettings, DirectorxSettings } from '../config.ts'
import { type ModelCapability } from '../model-matrix.ts'
import {
  adapterIdFor,
  buildBody,
  classifyProviderDoc,
  parseAdapterSpec,
  readPath,
  type AdapterCapability,
  type AdapterSpec,
} from './adapter-spec.ts'
import { AdapterStore, publicRecord } from './adapter-store.ts'
import { authHeaders, genericGenerate } from './generic-rest.ts'
import type { ProviderContext } from './types.ts'

const MAX_FETCH_BYTES = 400_000

export interface ApplyCapability {
  (capability: AdapterCapability, patch: Partial<CapabilitySettings>): Promise<void>
}

export async function ingestProvider(input: {
  outputDir: string
  model: string
  capability: AdapterCapability
  apiDoc?: string
  apiDocUrl?: string
  baseURL?: string
  displayName?: string
  apiKey?: string
}): Promise<Record<string, unknown>> {
  const model = input.model.trim()
  if (model === '') throw new Error('model 必填')
  const id = adapterIdFor(input.capability, model)
  const store = new AdapterStore(input.outputDir)
  let doc = (input.apiDoc ?? '').trim()
  let docSource = 'pasted'
  if ((input.apiDocUrl ?? '').trim() !== '') {
    const url = input.apiDocUrl!.trim()
    if (!/^https?:\/\//i.test(url)) throw new Error('apiDocUrl 必须是 http(s)')
    const fetched = await fetch(url, { signal: AbortSignal.timeout(15_000), headers: { accept: 'text/plain, text/markdown, application/json, text/html' } })
    if (!fetched.ok) throw new Error(`拉取文档失败 HTTP ${fetched.status}`)
    const text = await fetched.text()
    if (text.length > MAX_FETCH_BYTES) throw new Error(`文档超过 ${MAX_FETCH_BYTES} 字节，请粘贴关键章节`)
    doc = text
    docSource = url
  }
  if (doc === '') throw new Error('需要 apiDoc 文本或 apiDocUrl')
  const chars = await store.saveDoc(id, doc)
  const existing = await store.get(id)
  const stub: AdapterSpec = existing?.spec ?? {
    id,
    capability: input.capability,
    displayName: input.displayName?.trim() || model,
    model,
    mode: 'generic-rest',
    baseURL: (input.baseURL ?? '').trim(),
    auth: { kind: 'bearer' },
    caps: { aspectRatios: ['16:9', '9:16', '1:1'], firstFrame: false, lastFrame: false, audio: false, multiRef: false },
  }
  if ((input.baseURL ?? '').trim() !== '') stub.baseURL = input.baseURL!.trim()
  stub.model = model
  stub.capability = input.capability
  await store.upsert({
    spec: stub,
    status: existing?.status === 'active' ? existing.status : 'ingested',
    ingest: { docSource, docChars: chars, at: Date.now() },
    smoke: existing?.smoke,
    updatedAt: Date.now(),
  })
  if ((input.apiKey ?? '').trim() !== '') await store.writeSecret(id, { apiKey: input.apiKey!.trim() })
  const excerpt = doc.slice(0, 800)
  return {
    id,
    model,
    capability: input.capability,
    docSource,
    docChars: chars,
    excerpt,
    apiKeySet: Boolean((input.apiKey ?? '').trim()) || await store.hasSecret(id),
    next: 'directorx_provider_classify',
  }
}

export async function classifyProvider(outputDir: string, id: string): Promise<Record<string, unknown>> {
  const store = new AdapterStore(outputDir)
  const record = await store.get(id)
  if (record === undefined) throw new Error(`未找到入驻 ${id}，先 directorx_provider_ingest`)
  const doc = await store.readDoc(id)
  const classified = classifyProviderDoc(doc, `${record.spec.model} ${record.spec.baseURL}`)
  if (record.spec.baseURL === '' && classified.family === 'A') {
    // keep empty; draft/commit still require it
  }
  const nextSpec = { ...record.spec, mode: classified.mode }
  if (classified.hints.authKind !== undefined) nextSpec.auth = { ...nextSpec.auth, kind: classified.hints.authKind }
  await store.upsert({ ...record, spec: nextSpec, updatedAt: Date.now() })
  return {
    id,
    ...classified,
    model: record.spec.model,
    capability: record.spec.capability,
    next: 'directorx_provider_draft',
    note: classified.family === 'A'
      ? '已有协议：draft 只需补 baseURL / caps，不必填 create/poll。'
      : '新协议：draft 必须填 create.body 映射，以及 poll 或 syncResult。字段路径必须能在用户文档里找到。',
  }
}

export async function draftProvider(outputDir: string, id: string, specPatch: Record<string, unknown>): Promise<Record<string, unknown>> {
  const store = new AdapterStore(outputDir)
  const record = await store.get(id)
  if (record === undefined) throw new Error(`未找到入驻 ${id}`)
  const merged = {
    ...record.spec,
    ...specPatch,
    id,
    model: typeof specPatch.model === 'string' && specPatch.model.trim() !== '' ? specPatch.model.trim() : record.spec.model,
    capability: record.spec.capability,
    auth: specPatch.auth !== undefined && typeof specPatch.auth === 'object'
      ? { ...record.spec.auth, ...(specPatch.auth as object) }
      : record.spec.auth,
    caps: specPatch.caps !== undefined && typeof specPatch.caps === 'object'
      ? { ...record.spec.caps, ...(specPatch.caps as object) }
      : record.spec.caps,
  }
  const parsed = parseAdapterSpec(merged)
  if (parsed.spec === undefined) {
    return {
      id,
      ok: false,
      issues: parsed.issues,
      next: 'directorx_provider_draft',
      hint: '只填 AdapterSpec 已有键。路径必须能引用用户文档原文。不要写代码。',
    }
  }
  await store.putSpec(id, parsed.spec, 'draft')
  return {
    id,
    ok: true,
    spec: parsed.spec,
    family: parsed.spec.mode === 'generic-rest' ? 'B' : 'A',
    next: 'directorx_confirm 后 directorx_provider_smoke',
  }
}

export function contractSmoke(spec: AdapterSpec, fixtures: { create?: unknown; poll?: unknown }): { ok: boolean; issues: string[] } {
  const issues: string[] = []
  if (spec.mode !== 'generic-rest') return { ok: true, issues }
  if (spec.create === undefined) {
    issues.push('缺少 create')
    return { ok: false, issues }
  }
  try {
    buildBody(spec.create.body, { prompt: 'smoke', text: 'smoke', model: spec.model, seconds: 4 })
  } catch (error) {
    issues.push(error instanceof Error ? error.message : String(error))
  }
  if (spec.poll !== undefined && fixtures.create !== undefined) {
    const taskId = readPath(fixtures.create, spec.poll.taskId)
    if (taskId === undefined || taskId === '') issues.push(`create fixture 对不上 poll.taskId=${spec.poll.taskId}`)
  }
  if (spec.poll !== undefined && fixtures.poll !== undefined) {
    const status = readPath(fixtures.poll, spec.poll.status)
    if (status === undefined) issues.push(`poll fixture 对不上 poll.status=${spec.poll.status}`)
    const urls = readPath(fixtures.poll, spec.poll.resultUrls)
    if (urls === undefined) issues.push(`poll fixture 对不上 poll.resultUrls=${spec.poll.resultUrls}`)
  }
  if (spec.syncResult !== undefined && fixtures.create !== undefined) {
    if (spec.syncResult.urls !== undefined && readPath(fixtures.create, spec.syncResult.urls) === undefined) {
      issues.push(`create fixture 对不上 syncResult.urls=${spec.syncResult.urls}`)
    }
  }
  return { ok: issues.length === 0, issues }
}

export async function probeAdapter(spec: AdapterSpec, apiKey: string): Promise<{ ok: boolean; message: string }> {
  if (spec.auth.kind === 'kling-jwt') return { ok: apiKey !== '', message: 'kling-jwt 探活留给 kling 模式' }
  if (spec.smoke?.probe === 'auth-only') return { ok: apiKey !== '' || /localhost|127\.0\.0\.1/.test(spec.baseURL), message: apiKey !== '' ? '已配置 Key' : '未配置 Key' }
  if (spec.baseURL.trim() === '') return { ok: false, message: 'baseURL 为空' }
  const url = `${spec.baseURL.replace(/\/+$/, '')}/models`
  try {
    const response = await fetch(url, {
      headers: authHeaders(spec, apiKey),
      signal: AbortSignal.timeout(12_000),
    })
    if (response.status === 200) return { ok: true, message: 'GET /models 200' }
    if (response.status === 404) return { ok: true, message: '鉴权可发出（/models 404，常见于无列表接口）' }
    if (response.status === 401 || response.status === 403) return { ok: false, message: `HTTP ${response.status} 鉴权被拒` }
    return { ok: false, message: `HTTP ${response.status}` }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) }
  }
}

export async function smokeProvider(input: {
  settings: DirectorxSettings
  id: string
  live?: boolean
  createFixture?: unknown
  pollFixture?: unknown
}): Promise<Record<string, unknown>> {
  const store = new AdapterStore(input.settings.outputDir)
  const record = await store.get(input.id)
  if (record === undefined) throw new Error(`未找到入驻 ${input.id}`)
  const spec = record.spec
  const secret = await store.secretOf(input.id)
  const apiKey = secret.apiKey ?? input.settings[spec.capability].apiKey
  const contract = contractSmoke(spec, { create: input.createFixture, poll: input.pollFixture })
  const probe = await probeAdapter(spec, apiKey)
  let live: { ok: boolean; message: string; files?: Array<{ path?: string; url?: string }> } | undefined
  if (input.live === true) {
    if (spec.mode === 'generic-rest') {
      try {
        const ctx: ProviderContext = {
          settings: input.settings,
          capability: { ...input.settings[spec.capability], mode: 'generic-rest', model: spec.model, baseURL: spec.baseURL, apiKey },
          signal: AbortSignal.timeout(Math.max(input.settings.timeoutMs, 30_000)),
        }
        const result = await genericGenerate(ctx, spec, {
          prompt: 'DirectorX adapter smoke',
          seconds: spec.smoke?.cheapest?.seconds ?? 4,
          size: spec.smoke?.cheapest?.size,
        })
        live = { ok: result.files.length > 0, message: '最短真调用成功', files: result.files }
      } catch (error) {
        live = { ok: false, message: error instanceof Error ? error.message : String(error) }
      }
    } else {
      live = { ok: probe.ok, message: 'A 类协议沿用探活，未另打付费生成。确认后即可 commit。' }
    }
  }
  const smoked = contract.ok && probe.ok && (input.live !== true || live?.ok === true)
  await store.upsert({
    ...record,
    status: smoked ? 'smoked' : record.status,
    smoke: {
      probeOk: probe.ok,
      contractOk: contract.ok,
      liveOk: live?.ok === true,
      at: Date.now(),
      ...(live?.ok === false || !probe.ok || !contract.ok ? { error: live?.message ?? probe.message ?? contract.issues.join('；') } : {}),
    },
    updatedAt: Date.now(),
  })
  return {
    id: input.id,
    ok: smoked,
    contract,
    probe,
    live: live ?? { skipped: true, next: '要打最短真调用时传 live:true，且先 directorx_confirm' },
    next: smoked ? 'directorx_provider_commit' : '修 spec 后重跑 smoke',
  }
}

export async function commitProvider(input: {
  settings: DirectorxSettings
  id: string
  apply?: ApplyCapability
  force?: boolean
}): Promise<Record<string, unknown>> {
  const store = new AdapterStore(input.settings.outputDir)
  const record = await store.get(input.id)
  if (record === undefined) throw new Error(`未找到入驻 ${input.id}`)
  if (record.status !== 'smoked' && record.status !== 'active' && input.force !== true) {
    throw new Error('尚未 smoke 通过。先 directorx_provider_smoke，或在用户明确跳过回归时 force:true')
  }
  if (record.spec.baseURL.trim() === '') throw new Error('baseURL 为空，不能 commit')
  const secret = await store.secretOf(input.id)
  const current = input.settings[record.spec.capability]
  const patch: Partial<CapabilitySettings> = {
    enabled: true,
    mode: record.spec.mode as CapabilitySettings['mode'],
    model: record.spec.model,
    baseURL: record.spec.baseURL,
  }
  if (secret.apiKey) patch.apiKey = secret.apiKey
  if (secret.klingAk || secret.klingSk) {
    patch.auth = {
      ...current.auth,
      ...(secret.klingAk ? { klingAk: secret.klingAk } : {}),
      ...(secret.klingSk ? { klingSk: secret.klingSk } : {}),
    }
  }
  if (input.apply !== undefined) await input.apply(record.spec.capability, patch)
  await store.upsert({ ...record, status: 'active', updatedAt: Date.now() })
  return {
    id: input.id,
    ok: true,
    capability: record.spec.capability,
    mode: record.spec.mode,
    model: record.spec.model,
    baseURL: record.spec.baseURL,
    settingsWritten: input.apply !== undefined,
    refresh: '设置已热更新。请刷新页面，Settings → DirectorX 里该能力已切到此模型。',
    next: `directorx_generate_${record.spec.capability === 'vision' ? 'image' : record.spec.capability}`,
  }
}

export async function listProviders(outputDir: string): Promise<Record<string, unknown>> {
  const store = new AdapterStore(outputDir)
  const records = await store.list()
  const items = []
  for (const record of records) {
    items.push(publicRecord(record, await store.hasSecret(record.spec.id)))
  }
  return { adapters: items, count: items.length }
}

export async function adapterCapabilities(outputDir: string): Promise<ModelCapability[]> {
  const extras: ModelCapability[] = []
  for (const record of await new AdapterStore(outputDir).list()) {
    extras.push({
      model: record.spec.model,
      mode: record.spec.mode,
      maxDurationSec: record.spec.caps.maxDurationSec ?? 15,
      minDurationSec: record.spec.caps.minDurationSec ?? 2,
      aspectRatios: record.spec.caps.aspectRatios,
      firstFrame: record.spec.caps.firstFrame,
      lastFrame: record.spec.caps.lastFrame,
      audio: record.spec.caps.audio,
      multiRef: record.spec.caps.multiRef,
    })
  }
  return extras
}

export async function resolveGenerateCapability(
  settings: DirectorxSettings,
  capability: AdapterCapability,
  modelOverride?: string,
): Promise<{ capability: CapabilitySettings; spec?: AdapterSpec }> {
  const base = settings[capability]
  const wanted = (modelOverride ?? base.model).trim()
  const store = new AdapterStore(settings.outputDir)
  const record = wanted === '' ? undefined : await store.findByModel(capability, wanted) ?? await store.get(wanted)
  if (record === undefined) {
    return { capability: { ...base, model: wanted || base.model } }
  }
  const secret = await store.secretOf(record.spec.id)
  return {
    spec: record.spec,
    capability: {
      ...base,
      mode: record.spec.mode as CapabilitySettings['mode'],
      model: record.spec.model,
      baseURL: record.spec.baseURL || base.baseURL,
      apiKey: secret.apiKey || base.apiKey,
      auth: {
        ...base.auth,
        ...(secret.klingAk ? { klingAk: secret.klingAk } : {}),
        ...(secret.klingSk ? { klingSk: secret.klingSk } : {}),
      },
    },
  }
}

export { classifyProviderDoc }
