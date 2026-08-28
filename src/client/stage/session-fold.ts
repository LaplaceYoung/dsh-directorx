/**
 * Fold a DSH session.history page into the canvas satellite transcript.
 * The official conversation stays in its own seat — this is a read model only.
 */

export type SessionPromptPart =
  | { type: 'text'; text: string }
  | { type: 'image'; mediaType: string; data: string; name?: string }

export interface SessionClient {
  list?: (payload?: Record<string, unknown>) => Promise<unknown>
  create?: (payload: { cwd?: string; workspaceId?: string; agentPreset?: string }) => Promise<unknown>
  /** Pre-0.1.2 history page. */
  history?: (payload: { sessionId: string; maxMessages?: number; beforeSeq?: number }) => Promise<unknown>
  /** DSH 0.1.2 journal page (`session.page`). */
  page?: (payload: {
    address: { kind: 'session'; sessionId: string }
    throughSeq: number
    maxMessages?: number
    beforeSeq?: number
  }) => Promise<unknown>
  prompt?: (payload: {
    sessionId: string
    mode: 'queue' | 'steer'
    content: SessionPromptPart[]
    /** Required by the 0.1.2 session.prompt wire; minted client-side per prompt. */
    requestId?: string
  }) => Promise<unknown>
  cancel?: (payload: { sessionId: string }) => Promise<unknown>
  /** Pre-0.1.2 combined directory. Current hosts expose `modelCatalog`. */
  models?: (payload: { sessionId: string }) => Promise<unknown>
  modelCatalog?: () => Promise<unknown>
  selectModel?: (payload: { sessionId: string; provider: string; model: string; reasoningEffort?: string }) => Promise<unknown>
}

export interface SessionModelSelection {
  provider: string
  model: string
  reasoningEffort?: string
}

export interface SessionModelRow {
  id: string
  name: string
  description?: string
  reasoning?: { efforts: Array<{ id: string; name: string }>; defaultEffort?: string }
}

export interface SessionModelGroup {
  id: string
  name: string
  models: SessionModelRow[]
}

export interface SessionModelsView {
  current: SessionModelSelection
  routable: boolean
  groups: SessionModelGroup[]
}

export interface WorkspaceClient {
  list?: (payload?: Record<string, unknown>) => Promise<unknown>
}

export interface SessionRow {
  id: string
  cwd?: string
  updatedAt?: number
  blank?: boolean
}

export interface WorkspaceRow {
  id?: string
  path?: string
  sessionIds: string[]
}

/** Mint one client request identity for the 0.1.2 session.prompt wire. */
export function mintSessionRequestId(): string {
  return `directorx-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export type SessionLineKind = 'user' | 'assistant' | 'tool' | 'notice'

export interface SessionLine {
  id: string
  kind: SessionLineKind
  text: string
  name?: string
  args?: string
  result?: string
  status?: 'running' | 'ok' | 'error'
}

export interface SessionFold {
  lines: SessionLine[]
  running: boolean
  blocked: boolean
}

export function sessionTextNeedsFold(line: { kind: string; text: string }): boolean {
  return line.kind === 'assistant' && line.text.length > 420
}


const TOOL_LABEL: Record<string, string> = {
  directorx_generate_image: '生成图片',
  directorx_generate_video: '生成视频',
  directorx_generate_audio: '生成音频',
  directorx_canvas_add: '画布：添加',
  directorx_canvas_connect: '画布：连线',
  directorx_canvas_update: '画布：更新',
  directorx_canvas_remove: '画布：删除',
  directorx_canvas_intents: '画布：领取指令',
  directorx_canvas_get: '画布：读取',
  directorx_canvas_continue: '画布：续写',
  directorx_canvas_batch: '画布：批量',
  directorx_canvas_shotlist: '画布：分镜表',
  directorx_canvas_script: '画布：生成分镜',
  directorx_canvas_frames: '画布：提取帧',
  directorx_canvas_autolink: '画布：自动连线',
  directorx_canvas_parse: '画布：智能解析',
  directorx_canvas_reshoot: '画布：局部重绘',
  directorx_canvas_pack: '画布：合成视频',
  directorx_canvas_sheet: '画布：九宫格',
  directorx_canvas_split: '画布：拆分宫格',
  directorx_canvas_join: '画布：合并宫格',
  directorx_canvas_stack: '画布：分屏',
  directorx_canvas_desub: '画布：去字幕',
  directorx_canvas_extend: '画布：视频延长',
  directorx_canvas_gif: '画布：导出 GIF',
  directorx_series: '系列包',
  directorx_revise: '重新生成',
  directorx_blocking: '画布：场面控制表',
  directorx_media_auto_cut: '一键粗剪',
  directorx_media_scene_split: '镜头拆解',
  directorx_media_package: '一键交付',
  directorx_media_batch: '批量素材处理',
  directorx_confirm: '确认提案',
  directorx_ask: '提问',
  directorx_stage: '阶段',
  directorx_skill_search: '检索技能',
  directorx_skill_route: '技能路由',
  directorx_skill_read: '读技能',
  directorx_skill_capture: '收成技能',
  directorx_note: '记下修改',
  directorx_bible: '评审文档',
  directorx_shot_vocab: '镜头语汇',
  directorx_provider_ingest: '接入模型',
}

export function summarizeToolName(name: string): string {
  if (name in TOOL_LABEL) return TOOL_LABEL[name]
  if (name.startsWith('directorx_')) return name.slice('directorx_'.length).replaceAll('_', ' ')
  return name.replaceAll('_', ' ')
}

/** Compact transcript caption matching the official `skill：name` row. */
export function toolCaption(name: string, args?: string): string {
  const raw = name.trim() || 'tool'
  if (raw === 'skill') {
    if (args !== undefined && args.trim() !== '') {
      try {
        const parsed = JSON.parse(args) as { name?: unknown }
        if (typeof parsed.name === 'string' && parsed.name.trim() !== '') return `skill：${parsed.name.trim()}`
      } catch {
        // Streaming JSON prefix — fall through to the bare caption.
      }
    }
    return 'skill：'
  }
  if (raw === 'ask_user_question') return 'ask user question：'
  const short = raw.startsWith('directorx_') ? raw.slice('directorx_'.length) : raw
  return `${short.replaceAll('_', ' ')}：`
}

export function textFromBlocks(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (!Array.isArray(value)) {
    if (value !== null && typeof value === 'object') {
      const rec = value as Record<string, unknown>
      if (typeof rec.text === 'string') return rec.text.trim()
    }
    return ''
  }
  const parts: string[] = []
  for (const block of value) {
    if (typeof block === 'string') {
      if (block.trim() !== '') parts.push(block)
      continue
    }
    if (block === null || typeof block !== 'object') continue
    const rec = block as Record<string, unknown>
    if (rec.type === 'reasoning') continue
    if (typeof rec.text === 'string' && rec.text.trim() !== '') parts.push(rec.text)
  }
  return parts.join('\n').trim()
}

export function rpcOk<T>(response: unknown): { ok: true; value: T } | { ok: false; message: string } {
  if (response === null || response === undefined) return { ok: false, message: '空响应' }
  if (typeof response !== 'object') return { ok: false, message: '响应格式无效' }
  const rec = response as Record<string, unknown>
  const result = rec.result !== null && typeof rec.result === 'object'
    ? rec.result as Record<string, unknown>
    : rec
  if (result.ok === false) return { ok: false, message: errorMessage(result.error) }
  if ('value' in result) return { ok: true, value: result.value as T }
  return { ok: true, value: result as T }
}

export function errorMessage(error: unknown): string {
  if (typeof error === 'string' && error.trim() !== '') return error
  if (error !== null && typeof error === 'object') {
    const rec = error as Record<string, unknown>
    if (typeof rec.message === 'string' && rec.message.trim() !== '') return rec.message
    if (typeof rec.code === 'string' && rec.code.trim() !== '') return rec.code
  }
  return 'DSH 请求失败'
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (value === null || typeof value !== 'object') return undefined
  return value as Record<string, unknown>
}

function parseReasoning(input: unknown): SessionModelRow['reasoning'] {
  const rec = asRecord(input)
  if (rec === undefined || !Array.isArray(rec.efforts)) return undefined
  const efforts = rec.efforts.flatMap(item => {
    const row = asRecord(item)
    if (row === undefined || typeof row.id !== 'string' || row.id === '' || typeof row.name !== 'string') return []
    return [{ id: row.id, name: row.name }]
  })
  if (efforts.length === 0) return undefined
  return {
    efforts,
    ...(typeof rec.defaultEffort === 'string' && rec.defaultEffort !== '' ? { defaultEffort: rec.defaultEffort } : {}),
  }
}

/** Unwrap `session.modelCatalog` or a combined `session.models` directory. */
export function parseSessionModels(input: unknown): SessionModelsView | undefined {
  const parsed = rpcOk<unknown>(input)
  if (!parsed.ok) return undefined
  const rec = asRecord(parsed.value)
  if (rec === undefined) return undefined
  const currentRec = asRecord(rec.current) ?? asRecord(rec.default)
  const provider = typeof currentRec?.provider === 'string' ? currentRec.provider : ''
  const model = typeof currentRec?.model === 'string' ? currentRec.model : ''
  if (provider === '' || model === '') return undefined
  const groups: SessionModelGroup[] = []
  if (Array.isArray(rec.groups)) {
    for (const item of rec.groups) {
      const group = asRecord(item)
      if (group === undefined || typeof group.id !== 'string' || group.id === '') continue
      const models: SessionModelRow[] = []
      if (Array.isArray(group.models)) {
        for (const raw of group.models) {
          const row = asRecord(raw)
          if (row === undefined || typeof row.id !== 'string' || row.id === '') continue
          const reasoning = parseReasoning(row.reasoning)
          models.push({
            id: row.id,
            name: typeof row.name === 'string' && row.name !== '' ? row.name : row.id,
            ...(typeof row.description === 'string' && row.description !== '' ? { description: row.description } : {}),
            ...(reasoning !== undefined ? { reasoning } : {}),
          })
        }
      }
      groups.push({
        id: group.id,
        name: typeof group.name === 'string' && group.name !== '' ? group.name : group.id,
        models,
      })
    }
  }
  const routableProviders = Array.isArray(rec.routableProviders)
    ? rec.routableProviders.filter((value): value is string => typeof value === 'string')
    : undefined
  return {
    current: {
      provider,
      model,
      ...(typeof currentRec?.reasoningEffort === 'string' && currentRec.reasoningEffort !== '' ? { reasoningEffort: currentRec.reasoningEffort } : {}),
    },
    routable: rec.routable === false
      ? false
      : routableProviders === undefined
        ? rec.routable !== false
        : routableProviders.includes(provider),
    groups,
  }
}



function unwrapEvent(item: unknown): Record<string, unknown> | undefined {
  const rec = asRecord(item)
  if (rec === undefined) return undefined
  const nested = asRecord(rec.event)
  if (nested !== undefined && typeof nested.type === 'string') return nested
  if (typeof rec.type === 'string') return rec
  return undefined
}

function extractEvents(input: unknown): unknown[] {
  const unwrapped = rpcOk<unknown>(input)
  const body = unwrapped.ok ? unwrapped.value : input
  if (Array.isArray(body)) return body
  const rec = asRecord(body)
  if (rec === undefined) return []
  if (Array.isArray(rec.records)) return rec.records
  if (Array.isArray(rec.events)) return rec.events
  if (Array.isArray(rec.items)) return rec.items
  return []
}

function userSourceKind(data: Record<string, unknown>): string {
  const source = asRecord(data.source)
  return typeof source?.kind === 'string' ? source.kind : 'user'
}

function assistantContent(data: Record<string, unknown>): unknown {
  const message = asRecord(data.message)
  if (message !== undefined && message.content !== undefined) return message.content
  return data.content
}

function clip(text: string, max = 4000): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`
}

function prettyArg(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed === '') return undefined
    try {
      return clip(JSON.stringify(JSON.parse(trimmed), null, 2), 6000)
    } catch {
      return clip(trimmed, 6000)
    }
  }
  try {
    return clip(JSON.stringify(value, null, 2), 6000)
  } catch {
    return clip(String(value), 6000)
  }
}

function stripHarnessNoise(text: string): string {
  const cut = text.indexOf('<system-reminder>')
  return cut === -1 ? text : text.slice(0, cut).trim()
}

export function foldSessionHistory(input: unknown): SessionFold {
  const lines: SessionLine[] = []
  let running = false
  let blocked = false
  for (const item of extractEvents(input)) {
    const event = unwrapEvent(item)
    if (event === undefined) continue
    const type = event.type
    const seq = typeof event.seq === 'number' ? String(event.seq) : String(lines.length)
    const data = asRecord(event.data) ?? {}

    if (type === 'turn/start') {
      running = true
      blocked = false
      continue
    }
    if (type === 'turn/end') {
      running = false
      const reason = asRecord(data.reason)
      const kind = typeof reason?.kind === 'string' ? reason.kind : typeof data.kind === 'string' ? data.kind : ''
      if (kind === 'blocked') {
        blocked = true
        lines.push({ id: `block-${seq}`, kind: 'notice', text: 'DSH 在等批准或回答' })
      } else if (kind === 'error') {
        const err = asRecord(reason?.error) ?? asRecord(data.error)
        const message = typeof err?.message === 'string' && err.message !== '' ? err.message : '本轮失败'
        lines.push({ id: `err-${seq}`, kind: 'notice', text: message })
      }
      continue
    }
    if (type === 'user/message') {
      const source = userSourceKind(data)
      if (source === 'plugin') {
        const summary = asRecord(data.source)
        const notice = typeof summary?.summary === 'string' ? summary.summary.trim() : ''
        if (notice !== '') lines.push({ id: `ctx-${seq}`, kind: 'notice', text: clip(notice, 180) })
        continue
      }
      if (source === 'tool') continue
      const text = stripHarnessNoise(textFromBlocks(data.content))
      if (text !== '') lines.push({ id: `user-${seq}`, kind: 'user', text: clip(text) })
      continue
    }
    if (type === 'assistant/message') {
      const text = textFromBlocks(assistantContent(data))
      if (text !== '') lines.push({ id: `asst-${seq}`, kind: 'assistant', text: clip(text) })
      continue
    }
    if (type === 'assistant/chunk') {
      const chunk = asRecord(data.chunk) ?? data
      if (chunk.type === 'text-delta' && typeof chunk.text === 'string' && chunk.text !== '') {
        const last = lines.at(-1)
        if (last?.kind === 'assistant' && last.id.startsWith('stream-')) last.text = clip(last.text + chunk.text)
        else lines.push({ id: `stream-${seq}`, kind: 'assistant', text: clip(chunk.text) })
      }
      continue
    }
    if (type === 'tool/call') {
      const name = typeof data.name === 'string' ? data.name : 'tool'
      const args = prettyArg(data.arguments ?? data.args ?? data.input)
      lines.push({
        id: `tool-${seq}`,
        kind: 'tool',
        name,
        text: toolCaption(name, typeof data.arguments === 'string' ? data.arguments : args),
        ...(args !== undefined ? { args } : {}),
        status: 'running',
      })
      continue
    }
    if (type === 'tool/result') {
      const err = asRecord(data.error)
      const rawResult = data.content ?? data.result ?? data.output
      const result = textFromBlocks(rawResult) || prettyArg(rawResult) || ''
      const last = [...lines].reverse().find(line => line.kind === 'tool' && line.status === 'running')
      if (last !== undefined) {
        last.status = err !== undefined ? 'error' : 'ok'
        if (err !== undefined) {
          last.result = typeof err.message === 'string' && err.message !== '' ? err.message : '工具失败'
        } else if (result !== '') last.result = result
      } else if (err !== undefined) {
        const message = typeof err.message === 'string' && err.message !== '' ? err.message : '工具失败'
        lines.push({ id: `toolerr-${seq}`, kind: 'notice', text: message })
      }
    }
  }
  return { lines, running, blocked }
}

function rpcItems(input: unknown): unknown[] {
  const unwrapped = rpcOk<unknown>(input)
  const body = unwrapped.ok ? unwrapped.value : input
  if (Array.isArray(body)) return body
  const rec = asRecord(body)
  if (rec === undefined) return []
  if (Array.isArray(rec.items)) return rec.items
  if (Array.isArray(rec.sessions)) return rec.sessions
  return []
}

export function normalizeDir(path: string): string {
  return path.replaceAll('\\', '/').replace(/\/+$/, '').trim()
}

export function sameDir(left?: string, right?: string): boolean {
  if (left === undefined || right === undefined) return false
  const a = normalizeDir(left)
  const b = normalizeDir(right)
  return a !== '' && a === b
}

export function parseSessionList(input: unknown): SessionRow[] {
  const rows: SessionRow[] = []
  for (const row of rpcItems(input)) {
    const item = asRecord(row)
    if (item === undefined) continue
    const id = typeof item.sessionId === 'string' ? item.sessionId
      : typeof item.id === 'string' ? item.id
        : undefined
    if (id === undefined || id === '') continue
    const cwd = typeof item.cwd === 'string' ? item.cwd
      : typeof asRecord(item.header)?.cwd === 'string' ? String(asRecord(item.header)?.cwd)
        : undefined
    rows.push({
      id,
      ...(cwd !== undefined ? { cwd } : {}),
      ...(typeof item.updatedAt === 'number' ? { updatedAt: item.updatedAt } : {}),
      ...(typeof item.blank === 'boolean' ? { blank: item.blank } : {}),
    })
  }
  return rows
}

export function parseWorkspaceList(input: unknown): WorkspaceRow[] {
  const rows: WorkspaceRow[] = []
  for (const row of rpcItems(input)) {
    const item = asRecord(row)
    if (item === undefined) continue
    const path = typeof item.path === 'string' ? item.path : undefined
    const id = typeof item.workspaceId === 'string' ? item.workspaceId
      : typeof item.id === 'string' ? item.id
        : undefined
    const sessionIds = Array.isArray(item.sessionIds)
      ? item.sessionIds.filter((value): value is string => typeof value === 'string' && value !== '')
      : []
    rows.push({
      ...(id !== undefined ? { id } : {}),
      ...(path !== undefined ? { path } : {}),
      sessionIds,
    })
  }
  return rows
}

export function parseArchivedIds(input: unknown): string[] {
  const unwrapped = rpcOk<unknown>(input)
  const body = unwrapped.ok ? unwrapped.value : input
  const rec = asRecord(body)
  const ids = rec !== undefined && Array.isArray(rec.archivedSessionIds) ? rec.archivedSessionIds : []
  return ids.filter((value): value is string => typeof value === 'string' && value !== '')
}

export function createdSessionId(input: unknown): string | undefined {
  const unwrapped = rpcOk<unknown>(input)
  const body = unwrapped.ok ? unwrapped.value : input
  const rec = asRecord(body)
  if (rec === undefined) return undefined
  if (typeof rec.sessionId === 'string' && rec.sessionId !== '') return rec.sessionId
  if (typeof rec.id === 'string' && rec.id !== '') return rec.id
  return undefined
}

export function pickWorkspaceSession(input: {
  project?: string
  sessions: SessionRow[]
  workspaces?: WorkspaceRow[]
  archivedIds?: string[]
  preferredId?: string
}): SessionRow | undefined {
  const project = input.project !== undefined ? normalizeDir(input.project) : ''
  if (project === '') return undefined
  const archived = new Set(input.archivedIds ?? [])
  const workspace = (input.workspaces ?? []).find(item => sameDir(item.path, project))
  const byId = new Map(input.sessions.map(item => [item.id, item]))
  const candidates = new Map<string, SessionRow>()
  for (const row of input.sessions) {
    if (sameDir(row.cwd, project) && !archived.has(row.id)) candidates.set(row.id, row)
  }
  for (const id of workspace?.sessionIds ?? []) {
    if (archived.has(id) || candidates.has(id)) continue
    const row = byId.get(id)
    candidates.set(id, row ?? { id, cwd: project })
  }
  if (candidates.size === 0) return undefined
  const preferred = input.preferredId
  if (preferred !== undefined && candidates.has(preferred)) return candidates.get(preferred)
  return [...candidates.values()].sort((left, right) => {
    const blank = Number(left.blank === true) - Number(right.blank === true)
    if (blank !== 0) return blank
    return (right.updatedAt ?? 0) - (left.updatedAt ?? 0)
  })[0]
}

export function sessionRunningFromList(input: unknown, sessionId: string): boolean | undefined {
  for (const row of rpcItems(input)) {
    const item = asRecord(row)
    if (item === undefined) continue
    const id = typeof item.sessionId === 'string' ? item.sessionId
      : typeof item.id === 'string' ? item.id
        : undefined
    if (id !== sessionId) continue
    if (typeof item.running === 'boolean') return item.running
  }
  return undefined
}
