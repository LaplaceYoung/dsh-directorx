/** Closed adapter spec: DSH fills this form; the plugin never evals generated code. */

export const ADAPTER_CAPABILITIES = ['vision', 'image', 'video', 'audio'] as const
export type AdapterCapability = (typeof ADAPTER_CAPABILITIES)[number]

export const BUILTIN_ADAPTER_MODES = [
  'deepseek-chat',
  'openai-chat',
  'openai-images',
  'openai-videos',
  'openai-tts',
  'modelverse-tasks',
  'kling',
  'kling-v3',
  'runway',
  'minimax-h3',
  'vidu',
  'veo',
] as const

export const ADAPTER_MODES = [...BUILTIN_ADAPTER_MODES, 'generic-rest'] as const
export type AdapterMode = (typeof ADAPTER_MODES)[number]

export const BODY_SLOTS = [
  'prompt',
  'text',
  'model',
  'seconds',
  'size',
  'aspectRatio',
  'resolution',
  'firstFrame',
  'lastFrame',
  'negativePrompt',
  'voice',
] as const
export type BodySlot = (typeof BODY_SLOTS)[number]

export type MappingValue =
  | { type: 'from'; field: BodySlot; default?: string | number | boolean }
  | { type: 'const'; value: unknown }

export interface AdapterAuth {
  kind: 'bearer' | 'header' | 'query' | 'kling-jwt'
  headerName?: string
  queryName?: string
}

export interface AdapterCaps {
  maxDurationSec?: number
  minDurationSec?: number
  aspectRatios: string[]
  firstFrame: boolean
  lastFrame: boolean
  audio: boolean
  multiRef: boolean
}

export interface AdapterSpec {
  id: string
  capability: AdapterCapability
  displayName: string
  model: string
  mode: AdapterMode
  baseURL: string
  auth: AdapterAuth
  create?: {
    path: string
    method?: 'POST' | 'PUT'
    body: Record<string, MappingValue>
  }
  poll?: {
    path: string
    method?: 'GET' | 'POST'
    taskId: string
    status: string
    success: string[]
    failure: string[]
    resultUrls: string
  }
  syncResult?: {
    urls?: string
    b64?: string
  }
  smoke?: {
    probe?: 'GET /models' | 'auth-only'
    cheapest?: { seconds?: number; size?: string }
  }
  caps: AdapterCaps
}

export interface SpecIssue {
  path: string
  message: string
}

const MODE_SET = new Set<string>(ADAPTER_MODES)
const CAP_SET = new Set<string>(ADAPTER_CAPABILITIES)
const SLOT_SET = new Set<string>(BODY_SLOTS)

export function isAdapterMode(value: string): value is AdapterMode {
  return MODE_SET.has(value)
}

export function isBuiltinMode(value: string): boolean {
  return (BUILTIN_ADAPTER_MODES as readonly string[]).includes(value)
}

export function readPath(root: unknown, path: string): unknown {
  const parts = path.replace(/^\//, '').split(/[.\/\[\]]+/).filter(Boolean)
  let current: unknown = root
  for (const part of parts) {
    if (current === null || current === undefined) return undefined
    if (Array.isArray(current) && /^\d+$/.test(part)) {
      current = current[Number(part)]
      continue
    }
    if (typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

export function collectUrls(value: unknown): string[] {
  if (typeof value === 'string' && /^https?:\/\//i.test(value)) return [value]
  if (Array.isArray(value)) return value.flatMap(collectUrls)
  if (value !== null && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).flatMap(collectUrls)
  }
  return []
}

export function parseMapping(raw: unknown): MappingValue | undefined {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const record = raw as Record<string, unknown>
  if (record.type === 'const') return { type: 'const', value: record.value }
  if (record.type === 'from' && typeof record.field === 'string' && SLOT_SET.has(record.field)) {
    const mapped: MappingValue = { type: 'from', field: record.field as BodySlot }
    if (typeof record.default === 'string' || typeof record.default === 'number' || typeof record.default === 'boolean') {
      mapped.default = record.default
    }
    return mapped
  }
  return undefined
}

function parseBodyMap(raw: unknown): Record<string, MappingValue> | undefined {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const body: Record<string, MappingValue> = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const mapping = parseMapping(value)
    if (mapping === undefined) return undefined
    body[key] = mapping
  }
  return body
}

export function parseAdapterSpec(raw: unknown): { spec?: AdapterSpec; issues: SpecIssue[] } {
  const issues: SpecIssue[] = []
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return { issues: [{ path: '', message: 'spec 必须是对象' }] }
  }
  const record = raw as Record<string, unknown>
  const id = typeof record.id === 'string' ? record.id.trim() : ''
  const model = typeof record.model === 'string' ? record.model.trim() : ''
  const baseURL = typeof record.baseURL === 'string' ? record.baseURL.trim() : ''
  const displayName = typeof record.displayName === 'string' && record.displayName.trim() !== ''
    ? record.displayName.trim()
    : model
  const capability = typeof record.capability === 'string' ? record.capability : ''
  const mode = typeof record.mode === 'string' ? record.mode : ''
  if (id === '') issues.push({ path: 'id', message: '必填' })
  if (model === '') issues.push({ path: 'model', message: '必填' })
  if (baseURL === '') issues.push({ path: 'baseURL', message: '必填' })
  if (!CAP_SET.has(capability)) issues.push({ path: 'capability', message: '必须是 vision/image/video/audio' })
  if (!MODE_SET.has(mode)) issues.push({ path: 'mode', message: `未知 mode：${mode}` })

  const authRaw = record.auth !== null && typeof record.auth === 'object' && !Array.isArray(record.auth)
    ? record.auth as Record<string, unknown>
    : {}
  const authKind = typeof authRaw.kind === 'string' ? authRaw.kind : 'bearer'
  if (!['bearer', 'header', 'query', 'kling-jwt'].includes(authKind)) {
    issues.push({ path: 'auth.kind', message: '必须是 bearer/header/query/kling-jwt' })
  }
  if (authKind === 'header' && (typeof authRaw.headerName !== 'string' || authRaw.headerName.trim() === '')) {
    issues.push({ path: 'auth.headerName', message: 'header 鉴权需要 headerName' })
  }
  if (authKind === 'query' && (typeof authRaw.queryName !== 'string' || authRaw.queryName.trim() === '')) {
    issues.push({ path: 'auth.queryName', message: 'query 鉴权需要 queryName' })
  }

  const capsRaw = record.caps !== null && typeof record.caps === 'object' && !Array.isArray(record.caps)
    ? record.caps as Record<string, unknown>
    : {}
  const aspectRatios = Array.isArray(capsRaw.aspectRatios)
    ? capsRaw.aspectRatios.filter((item): item is string => typeof item === 'string' && item !== '')
    : ['16:9']

  let create: AdapterSpec['create']
  if (record.create !== undefined) {
    const createRaw = record.create !== null && typeof record.create === 'object' && !Array.isArray(record.create)
      ? record.create as Record<string, unknown>
      : undefined
    const path = typeof createRaw?.path === 'string' ? createRaw.path.trim() : ''
    const body = parseBodyMap(createRaw?.body)
    if (path === '') issues.push({ path: 'create.path', message: 'generic-rest 需要 create.path' })
    if (body === undefined) issues.push({ path: 'create.body', message: 'body 的每个值必须是 {type:from|const,...}' })
    else create = {
      path,
      method: createRaw?.method === 'PUT' ? 'PUT' : 'POST',
      body,
    }
  }

  let poll: AdapterSpec['poll']
  if (record.poll !== undefined) {
    const pollRaw = record.poll !== null && typeof record.poll === 'object' && !Array.isArray(record.poll)
      ? record.poll as Record<string, unknown>
      : undefined
    const path = typeof pollRaw?.path === 'string' ? pollRaw.path.trim() : ''
    const taskId = typeof pollRaw?.taskId === 'string' ? pollRaw.taskId.trim() : ''
    const status = typeof pollRaw?.status === 'string' ? pollRaw.status.trim() : ''
    const resultUrls = typeof pollRaw?.resultUrls === 'string' ? pollRaw.resultUrls.trim() : ''
    if (path === '' || taskId === '' || status === '' || resultUrls === '') {
      issues.push({ path: 'poll', message: 'poll 需要 path / taskId / status / resultUrls' })
    } else {
      poll = {
        path,
        method: pollRaw?.method === 'POST' ? 'POST' : 'GET',
        taskId,
        status,
        success: Array.isArray(pollRaw?.success) ? pollRaw.success.filter((item): item is string => typeof item === 'string') : ['success', 'succeeded', 'completed', 'complete', 'finished', 'done'],
        failure: Array.isArray(pollRaw?.failure) ? pollRaw.failure.filter((item): item is string => typeof item === 'string') : ['failed', 'failure', 'error', 'cancelled', 'canceled'],
        resultUrls,
      }
    }
  }

  let syncResult: AdapterSpec['syncResult']
  if (record.syncResult !== undefined) {
    const syncRaw = record.syncResult !== null && typeof record.syncResult === 'object' && !Array.isArray(record.syncResult)
      ? record.syncResult as Record<string, unknown>
      : undefined
    syncResult = {
      urls: typeof syncRaw?.urls === 'string' ? syncRaw.urls : undefined,
      b64: typeof syncRaw?.b64 === 'string' ? syncRaw.b64 : undefined,
    }
  }

  if (capability === 'vision' && mode === 'generic-rest') {
    issues.push({ path: 'mode', message: 'vision 只支持 deepseek-chat / openai-chat / mock' })
  }
  if (mode === 'generic-rest') {
    if (create === undefined) issues.push({ path: 'create', message: 'generic-rest 必须有 create' })
    if (poll === undefined && syncResult === undefined) {
      issues.push({ path: 'poll', message: 'generic-rest 需要 poll（异步）或 syncResult（同步）' })
    }
    const bodyValues = Object.values(create?.body ?? {})
    const hasPrompt = bodyValues.some(item => item.type === 'from' && (item.field === 'prompt' || item.field === 'text'))
    if (!hasPrompt) issues.push({ path: 'create.body', message: '至少把 prompt 或 text 映射进请求体' })
  }

  if (issues.length > 0) return { issues }
  return {
    spec: {
      id,
      capability: capability as AdapterCapability,
      displayName,
      model,
      mode: mode as AdapterMode,
      baseURL,
      auth: {
        kind: authKind as AdapterAuth['kind'],
        ...(typeof authRaw.headerName === 'string' ? { headerName: authRaw.headerName.trim() } : {}),
        ...(typeof authRaw.queryName === 'string' ? { queryName: authRaw.queryName.trim() } : {}),
      },
      ...(create !== undefined ? { create } : {}),
      ...(poll !== undefined ? { poll } : {}),
      ...(syncResult !== undefined ? { syncResult } : {}),
      smoke: record.smoke !== null && typeof record.smoke === 'object' && !Array.isArray(record.smoke)
        ? {
          probe: (record.smoke as Record<string, unknown>).probe === 'auth-only' ? 'auth-only' : 'GET /models',
          cheapest: (record.smoke as Record<string, unknown>).cheapest !== null && typeof (record.smoke as Record<string, unknown>).cheapest === 'object'
            ? (record.smoke as Record<string, unknown>).cheapest as { seconds?: number; size?: string }
            : { seconds: 4, size: '1024x1024' },
        }
        : { probe: 'GET /models', cheapest: { seconds: 4, size: '1024x1024' } },
      caps: {
        aspectRatios: aspectRatios.length > 0 ? aspectRatios : ['16:9'],
        firstFrame: capsRaw.firstFrame === true,
        lastFrame: capsRaw.lastFrame === true,
        audio: capsRaw.audio === true,
        multiRef: capsRaw.multiRef === true,
        ...(typeof capsRaw.maxDurationSec === 'number' ? { maxDurationSec: capsRaw.maxDurationSec } : {}),
        ...(typeof capsRaw.minDurationSec === 'number' ? { minDurationSec: capsRaw.minDurationSec } : {}),
      },
    },
    issues,
  }
}

export interface ClassifyResult {
  family: 'A' | 'B'
  mode: AdapterMode
  confidence: 'high' | 'medium' | 'low'
  reasons: string[]
  hints: { path?: string; authKind?: AdapterAuth['kind'] }
}

const FINGERPRINTS: Array<{ mode: AdapterMode; family: 'A'; pattern: RegExp; reason: string; path?: string; authKind?: AdapterAuth['kind'] }> = [
  { mode: 'kling-v3', family: 'A', pattern: /kling[\s_-]*v3|new-standard|omni-video/i, reason: '文档命中可灵 v3 / new-standard', path: '/v1/videos/omni-video', authKind: 'bearer' },
  { mode: 'kling', family: 'A', pattern: /kling|可灵|image2video|access.?key|secret.?key|hs256/i, reason: '文档命中可灵 JWT / image2video', path: '/v1/videos/text2video', authKind: 'kling-jwt' },
  { mode: 'runway', family: 'A', pattern: /runway|x-runway-version|gen4/i, reason: '文档命中 Runway', path: '/v1/text_to_video', authKind: 'bearer' },
  { mode: 'minimax-h3', family: 'A', pattern: /minimax|hailuo|video_generation/i, reason: '文档命中 MiniMax / Hailuo', path: '/v1/video_generation', authKind: 'bearer' },
  { mode: 'vidu', family: 'A', pattern: /\bvidu\b|viduq/i, reason: '文档命中 Vidu', path: '/ent/v2/text2video', authKind: 'header' },
  { mode: 'veo', family: 'A', pattern: /\bveo\b|generatevideos|predictlongrunning/i, reason: '文档命中 Veo / generateVideos', path: '/v1/models', authKind: 'bearer' },
  { mode: 'modelverse-tasks', family: 'A', pattern: /tasks\/submit|modelverse|\/tasks\/status/i, reason: '文档命中 tasks/submit 轮询协议', path: '/tasks/submit', authKind: 'bearer' },
  { mode: 'openai-images', family: 'A', pattern: /\/images\/generations|images\/edits/i, reason: '文档命中 OpenAI images 协议', path: '/images/generations', authKind: 'bearer' },
  { mode: 'openai-tts', family: 'A', pattern: /\/audio\/speech|openai-tts/i, reason: '文档命中 OpenAI speech 协议', path: '/audio/speech', authKind: 'bearer' },
  { mode: 'openai-videos', family: 'A', pattern: /\/videos\b|openai-videos|sora/i, reason: '文档命中 OpenAI videos 协议', path: '/videos', authKind: 'bearer' },
  { mode: 'deepseek-chat', family: 'A', pattern: /api\.deepseek\.com|deepseek-official|深度求索官方/i, reason: '文档命中 DeepSeek 第一方 chat 协议（0.1.1-rc.1 起含视觉模型）', path: '/chat/completions', authKind: 'bearer' },
  { mode: 'openai-chat', family: 'A', pattern: /\/chat\/completions|image_url/i, reason: '文档命中 OpenAI chat 协议', path: '/chat/completions', authKind: 'bearer' },
]

export function classifyProviderDoc(doc: string, extra = ''): ClassifyResult {
  const text = `${doc}\n${extra}`
  for (const fingerprint of FINGERPRINTS) {
    if (fingerprint.pattern.test(text)) {
      return {
        family: 'A',
        mode: fingerprint.mode,
        confidence: 'high',
        reasons: [fingerprint.reason],
        hints: { path: fingerprint.path, authKind: fingerprint.authKind },
      }
    }
  }
  const reasons = ['未命中已接入协议指纹，按新提供商走 generic-rest']
  if (/authorization:\s*bearer|bearer token/i.test(text)) reasons.push('文档写了 Bearer')
  if (/task[_-]?id|polling|status/i.test(text)) reasons.push('文档像异步任务（需要 poll）')
  return {
    family: 'B',
    mode: 'generic-rest',
    confidence: /https?:\/\//i.test(text) ? 'medium' : 'low',
    reasons,
    hints: {
      path: /\/v\d+\//.exec(text)?.[0],
      authKind: /bearer/i.test(text) ? 'bearer' : undefined,
    },
  }
}

export function buildBody(map: Record<string, MappingValue>, slots: Partial<Record<BodySlot, unknown>>): Record<string, unknown> {
  const body: Record<string, unknown> = {}
  for (const [key, mapping] of Object.entries(map)) {
    if (mapping.type === 'const') {
      body[key] = mapping.value
      continue
    }
    const value = slots[mapping.field]
    if (value !== undefined && value !== '') body[key] = value
    else if (mapping.default !== undefined) body[key] = mapping.default
  }
  return body
}

export function adapterIdFor(capability: AdapterCapability, model: string): string {
  const slug = model.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48)
  return `${capability}-${slug || 'model'}`
}
