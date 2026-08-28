/**
 * Duck-typed face of DSH ctx.sessions. The official conversation seat stays
 * put; the canvas dock only reads the same live snapshot and answers waits.
 */

import { textFromBlocks, toolCaption, type SessionLine, type SessionPromptPart } from './session-fold.ts'

export interface LiveSessionHandle {
  subscribe: (listener: () => void) => () => void
  getSnapshot: () => unknown
  prompt?: (content: SessionPromptPart[], mode: 'queue' | 'steer') => Promise<unknown>
  cancel?: () => Promise<unknown>
  open?: () => Promise<void>
  command?: (line: string) => Promise<unknown>
}

export interface LiveSessionsService {
  binding?: (id: string) => { session?: LiveSessionHandle } | undefined
}

export interface AskOption {
  label: string
  description?: string
}

export interface AskItem {
  id: string
  question: string
  detail?: string
  header?: string
  options?: AskOption[]
  multiSelect?: boolean
  intent?: { kind?: string; approve?: string }
}

export interface AskWait {
  kind: 'question'
  key: string
  sessionId: string
  questions: AskItem[]
  respond: (result: unknown) => Promise<unknown>
}

export interface ApprovalWait {
  kind: 'approval'
  key: string
  sessionId: string
  approvalId: string
  toolName: string
  reason?: string
  respond: (result: unknown) => Promise<unknown>
}

export type LiveWait = AskWait | ApprovalWait

export interface DockLine {
  id: string
  kind: 'user' | 'assistant' | 'tool' | 'notice' | 'thinking'
  text: string
  streaming?: boolean
  name?: string
  args?: string
  result?: string
  status?: 'running' | 'ok' | 'error'
}

export interface LiveDockModel {
  lines: DockLine[]
  waits: LiveWait[]
  running: boolean
  ready: boolean
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (value === null || typeof value !== 'object') return undefined
  return value as Record<string, unknown>
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined
}

function inspectBlocks(value: unknown): { body: string; thinking: boolean } {
  if (!Array.isArray(value)) {
    if (value !== null && typeof value === 'object') {
      const rec = asRecord(value)
      if (rec?.kind === 'reasoning' || rec?.type === 'reasoning') return { body: '', thinking: true }
    }
    return { body: textFromBlocks(value), thinking: false }
  }
  let thinking = false
  const texts: string[] = []
  for (const block of value) {
    const rec = asRecord(block)
    if (rec === undefined) continue
    const kind = rec.kind ?? rec.type
    if (kind === 'reasoning') {
      thinking = true
      continue
    }
    if ((kind === 'text' || kind === undefined) && typeof rec.text === 'string' && rec.text.trim() !== '') {
      texts.push(rec.text)
    }
  }
  return { body: texts.join('\n').trim(), thinking }
}

function pretty(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed === '') return undefined
    try {
      return JSON.stringify(JSON.parse(trimmed), null, 2)
    } catch {
      return trimmed.length > 4000 ? `${trimmed.slice(0, 3999)}…` : trimmed
    }
  }
  if (value === undefined || value === null) return undefined
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export function resolveLiveSession(service: unknown, sessionId?: string): LiveSessionHandle | undefined {
  if (sessionId === undefined || sessionId === '') return undefined
  const rec = asRecord(service)
  const binding = rec?.binding
  if (typeof binding !== 'function') return undefined
  try {
    const bound = asRecord(binding.call(service, sessionId))
    const session = bound?.session
    if (session === null || typeof session !== 'object') return undefined
    const face = session as LiveSessionHandle
    if (typeof face.subscribe !== 'function' || typeof face.getSnapshot !== 'function') return undefined
    return face
  } catch {
    return undefined
  }
}

export function readLiveRunning(service: unknown, sessionId?: string): boolean {
  if (sessionId === undefined || sessionId === '') return false
  const rec = asRecord(service)
  const list = rec?.list
  const getSnapshot = asRecord(list)?.getSnapshot
  if (typeof getSnapshot !== 'function') return false
  try {
    const snap = asRecord(getSnapshot.call(list))
    const byId = asRecord(snap?.byId)
    const row = asRecord(byId?.[sessionId])
    return row?.running === true
  } catch {
    return false
  }
}

function textOfBlocks(value: unknown): string {
  if (Array.isArray(value)) {
    const texts: string[] = []
    for (const block of value) {
      const rec = asRecord(block)
      if (rec === undefined) continue
      if (rec.kind === 'reasoning' || rec.type === 'reasoning') continue
      if (rec.kind === 'text' || rec.type === 'text') {
        if (typeof rec.text === 'string' && rec.text !== '') texts.push(rec.text)
      }
    }
    if (texts.length > 0) return texts.join('\n').trim()
  }
  return textFromBlocks(value)
}

function parseAskItems(value: unknown): AskItem[] {
  if (!Array.isArray(value)) return []
  const items: AskItem[] = []
  for (const raw of value) {
    const rec = asRecord(raw)
    if (rec === undefined) continue
    const id = asString(rec.id)
    const question = asString(rec.question)
    if (id === undefined || question === undefined) continue
    const options = Array.isArray(rec.options)
      ? rec.options.flatMap((option): AskOption[] => {
          const item = asRecord(option)
          if (item === undefined) return []
          const label = asString(item.label)
          if (label === undefined) return []
          const description = asString(item.description)
          return [{ label, ...(description !== undefined ? { description } : {}) }]
        })
      : undefined
    const intentRec = asRecord(rec.intent)
    items.push({
      id,
      question,
      ...(asString(rec.detail) !== undefined ? { detail: asString(rec.detail) } : {}),
      ...(asString(rec.header) !== undefined ? { header: asString(rec.header) } : {}),
      ...(options !== undefined ? { options } : {}),
      ...(rec.multiSelect === true ? { multiSelect: true } : {}),
      ...(intentRec !== undefined ? {
        intent: {
          ...(asString(intentRec.kind) !== undefined ? { kind: asString(intentRec.kind) } : {}),
          ...(asString(intentRec.approve) !== undefined ? { approve: asString(intentRec.approve) } : {}),
        },
      } : {}),
    })
  }
  return items
}

function parseWait(value: unknown): LiveWait | undefined {
  const rec = asRecord(value)
  if (rec === undefined || typeof rec.respond !== 'function') return undefined
  const key = asString(rec.key) ?? 'wait'
  const sessionId = asString(rec.sessionId) ?? ''
  const host = rec as { respond: (result: unknown) => Promise<unknown> }
  const respond = (result: unknown) => host.respond(result)
  if (rec.kind === 'question') {
    const payload = asRecord(rec.payload)
    const questions = parseAskItems(payload?.questions ?? rec.questions)
    if (questions.length === 0) return undefined
    return { kind: 'question', key, sessionId, questions, respond }
  }
  if (rec.kind === 'approval') {
    const payload = asRecord(rec.payload)
    const approvalId = asString(payload?.approvalId) ?? asString(rec.approvalId)
    if (approvalId === undefined) return undefined
    return {
      kind: 'approval',
      key,
      sessionId,
      approvalId,
      toolName: asString(payload?.toolName) ?? asString(rec.toolName) ?? 'tool',
      ...(asString(payload?.reason) !== undefined ? { reason: asString(payload?.reason) } : {}),
      respond,
    }
  }
  return undefined
}

export function dockItemsFromSnapshot(raw: unknown): LiveDockModel {
  const snap = asRecord(raw)
  if (snap === undefined) return { lines: [], waits: [], running: false, ready: false }
  const openState = asString(snap.openState)
  const ready = openState === 'open' || openState === 'loading' || openState === 'error'
  const lines: DockLine[] = []
  const nodes = Array.isArray(snap.nodes) ? snap.nodes : []
  const seenCalls = new Set<string>()

  for (const node of nodes) {
    const rec = asRecord(node)
    if (rec === undefined) continue
    const kind = asString(rec.kind)
    const seq = typeof rec.seq === 'number' ? String(rec.seq) : String(lines.length)
    if (kind === 'user' || kind === 'steering') {
      const text = textOfBlocks(rec.content)
      if (text !== '') lines.push({ id: `user-${seq}`, kind: 'user', text })
      continue
    }
    if (kind === 'assistant') {
      const inspected = inspectBlocks(rec.blocks ?? rec.content)
      if (inspected.body !== '') lines.push({ id: `asst-${seq}`, kind: 'assistant', text: inspected.body })
      continue
    }
    if (kind === 'tool-result') {
      const call = asRecord(rec.call)
      const name = asString(call?.name) ?? asString(rec.callId) ?? 'tool'
      const callId = asString(rec.callId) ?? seq
      seenCalls.add(callId)
      const err = rec.isError === true
      const args = pretty(call?.argsRaw)
      const result = textFromBlocks(rec.content) || textFromBlocks(rec.output) || pretty(rec.result)
      lines.push({
        id: `tool-${seq}`,
        kind: 'tool',
        name,
        text: toolCaption(name, typeof call?.argsRaw === 'string' ? call.argsRaw : args),
        ...(args !== undefined ? { args } : {}),
        ...(result !== undefined && result !== '' ? { result } : {}),
        status: err ? 'error' : 'ok',
      })
      continue
    }
    if (kind === 'command') {
      const name = asString(rec.name) ?? 'command'
      const outcome = asRecord(rec.outcome)
      lines.push({
        id: `cmd-${seq}`,
        kind: 'tool',
        name,
        text: `${name}：`,
        status: outcome === undefined ? 'running' : outcome.kind === 'error' ? 'error' : 'ok',
      })
      continue
    }
    if (kind === 'turn-error' || kind === 'model-retry') {
      const text = asString(rec.message) ?? (kind === 'model-retry' ? '模型将重试' : '本轮失败')
      lines.push({ id: `err-${seq}`, kind: 'notice', text })
    }
  }

  const runningCalls = Array.isArray(snap.runningCalls) ? snap.runningCalls : []
  for (const call of runningCalls) {
    const rec = asRecord(call)
    const callId = asString(rec?.callId)
    const name = asString(rec?.name) ?? 'tool'
    if (callId !== undefined && seenCalls.has(callId)) continue
    const argsRaw = typeof rec?.argsRaw === 'string' ? rec.argsRaw : undefined
    lines.push({
      id: `run-${callId ?? name}`,
      kind: 'tool',
      name,
      text: toolCaption(name, argsRaw),
      status: 'running',
    })
  }

  const partial = asRecord(snap.partial)
  const inspectedPartial = partial === undefined ? { body: '', thinking: false } : inspectBlocks(partial.blocks)
  if (inspectedPartial.body !== '') {
    lines.push({ id: 'partial', kind: 'assistant', text: inspectedPartial.body, streaming: true })
  }

  if (snap.running === true) {
    const last = lines.at(-1)
    const streamingBody = last?.kind === 'assistant' && last.streaming === true
    const runningTool = last?.kind === 'tool' && last.status === 'running'
    if (!streamingBody && !runningTool) {
      lines.push({ id: 'thinking', kind: 'thinking', text: '思考中', streaming: true })
    }
  }

  const waits = (Array.isArray(snap.pending) ? snap.pending : [])
    .map(parseWait)
    .filter((item): item is LiveWait => item !== undefined)

  return {
    lines,
    waits,
    running: snap.running === true,
    ready,
  }
}

export function linesFromFold(lines: SessionLine[]): DockLine[] {
  return lines.map(line => ({
    id: line.id,
    kind: line.kind,
    text: line.text,
    ...(line.name !== undefined ? { name: line.name } : {}),
    ...(line.args !== undefined ? { args: line.args } : {}),
    ...(line.result !== undefined ? { result: line.result } : {}),
    ...(line.status !== undefined ? { status: line.status } : {}),
  }))
}

export async function answerQuestion(wait: AskWait, answers: Array<{ id: string; selected: string[]; custom?: string }>): Promise<void> {
  const receipt = await wait.respond({
    ok: true,
    value: { sessionId: wait.sessionId, answer: { answers } },
  })
  const rec = asRecord(receipt)
  if (rec?.accepted === false) throw new Error(asString(rec.reason) ?? '提问回答被拒绝')
}

export async function cancelQuestion(wait: AskWait): Promise<void> {
  const receipt = await wait.respond({
    ok: false,
    error: { code: 'cancelled', message: 'the user closed this question request', details: {} },
  })
  const rec = asRecord(receipt)
  if (rec?.accepted === false) throw new Error(asString(rec.reason) ?? '取消提问被拒绝')
}

export function openLiveSession(service: unknown, sessionId: string): void {
  const rec = asRecord(service)
  const open = rec?.open
  if (typeof open === 'function') open.call(service, sessionId)
}

export async function createLiveSession(service: unknown, input: { cwd?: string }): Promise<string | undefined> {
  const rec = asRecord(service)
  const create = rec?.create
  if (typeof create !== 'function') return undefined
  try {
    const result = await create.call(service, input.cwd !== undefined ? { cwd: input.cwd } : {})
    if (typeof result === 'string' && result !== '') {
      openLiveSession(service, result)
      return result
    }
    const wrapped = asRecord(result)
    const id = asString(wrapped?.sessionId) ?? asString(asRecord(wrapped?.value)?.sessionId)
    if (id !== undefined) {
      openLiveSession(service, id)
      return id
    }
  } catch {
    return undefined
  }
  return undefined
}

export async function answerApproval(wait: ApprovalWait, outcome: 'allowed-once' | 'rejected'): Promise<void> {
  const receipt = await wait.respond({
    ok: true,
    value: { sessionId: wait.sessionId, approvalId: wait.approvalId, outcome },
  })
  const rec = asRecord(receipt)
  if (rec?.accepted === false) throw new Error(asString(rec.reason) ?? '审批提交被拒绝')
}

/* ------------------------------------------------------------------ */
/* DSH 0.1.2-alpha.1 read model: the binding's session snapshot shrank  */
/* to lifecycle state; conversation content rides binding.eventSource   */
/* (SessionEventSource = ObservableSnapshot<SessionEventWindow>), and    */
/* pending question/approval interactions ride ctx.uiSession's          */
/* pendingInteractions map. Legacy hosts keep the snapshot face above.  */
/* ------------------------------------------------------------------ */

export interface LiveEventSource {
  subscribe: (listener: () => void) => () => void
  getSnapshot: () => unknown
}

export interface LiveBinding {
  session?: LiveSessionHandle
  eventSource?: LiveEventSource
}

/** Resolve the full session binding (lifecycle face + event window). */
export function resolveLiveBinding(service: unknown, sessionId?: string): LiveBinding | undefined {
  const session = resolveLiveSession(service, sessionId)
  if (session === undefined) return undefined
  const rec = asRecord(service)
  const binding = typeof rec?.binding === 'function' ? asRecord(rec.binding.call(service, sessionId)) : undefined
  const eventSource = asRecord(binding?.eventSource)
  const source: LiveEventSource | undefined =
    eventSource !== undefined && typeof eventSource.subscribe === 'function' && typeof eventSource.getSnapshot === 'function'
      ? {
        subscribe: listener => (eventSource.subscribe as (fn: () => void) => () => void)(listener),
        getSnapshot: () => (eventSource.getSnapshot as () => unknown)(),
      }
      : undefined
  return {
    session,
    ...(source !== undefined ? { eventSource: source } : {}),
  }
}

interface ChunkLine { key: string; line: DockLine }

function chunkTextOf(value: unknown): { text: string; reasoning: boolean } {
  const chunk = asRecord(value)
  if (chunk === undefined) return { text: '', reasoning: false }
  if (chunk.type === 'text-delta') return { text: asString(chunk.text) ?? '', reasoning: false }
  if (chunk.type === 'reasoning-delta') return { text: '', reasoning: true }
  if (chunk.type === 'block-end') {
    const block = asRecord(chunk.block)
    return block?.type === 'text' ? { text: asString(block.text) ?? '', reasoning: false } : { text: '', reasoning: false }
  }
  return { text: '', reasoning: false }
}

/**
 * Fold one event window (alpha.1 bindings) into dock lines. Chunks aggregate
 * into a streamed assistant line per (turn,step); a settled assistant/message
 * replaces them; tool/call pairs with tool/result; command/run pairs with
 * command/done. Unknown event kinds are skipped, so future vocabulary is safe.
 */
export function dockItemsFromWindow(raw: unknown, input?: { running?: boolean; openState?: string }): Omit<LiveDockModel, 'waits'> {
  const window = asRecord(raw)
  if (window === undefined) return { lines: [], running: false, ready: false }
  const openState = input?.openState
  const ready = openState === 'open' || openState === 'loading' || openState === 'error'
  const running = input?.running === true
  const entries = Array.isArray(window.entries) ? window.entries : []
  const lines: DockLine[] = []
  const calls = new Map<string, { name: string; argsRaw?: string }>()
  const chunkLines = new Map<string, ChunkLine>()
  const chunkCallLines = new Map<string, ChunkLine>()

  const pushChunkText = (key: string, seq: number | string, text: string): void => {
    const found = chunkLines.get(key)
    if (found !== undefined) {
      found.line.text += text
      return
    }
    const line: DockLine = { id: `chunk-${key}`, kind: 'assistant', text, streaming: true }
    chunkLines.set(key, { key, line })
    lines.push(line)
  }
  const dropChunks = (prefix: string): void => {
    for (const [key, chunk] of chunkLines) {
      if (!key.startsWith(prefix)) continue
      const at = lines.indexOf(chunk.line)
      if (at >= 0) lines.splice(at, 1)
      chunkLines.delete(key)
    }
  }
  const pushChunkCall = (id: string, name: string | undefined, argsDelta: string): void => {
    const found = chunkCallLines.get(id)
    if (found !== undefined) {
      found.line.text = toolCaption(found.line.name ?? 'tool', (found.line.args ?? '') + argsDelta)
      found.line.args = (found.line.args ?? '') + argsDelta
      return
    }
    const line: DockLine = {
      id: `chunkcall-${id}`, kind: 'tool', name: name ?? 'tool', text: toolCaption(name ?? 'tool', argsDelta), args: argsDelta, status: 'running',
    }
    chunkCallLines.set(id, { key: id, line })
    lines.push(line)
  }
  const dropChunkCall = (id: string): void => {
    const chunk = chunkCallLines.get(id)
    if (chunk === undefined) return
    const at = lines.indexOf(chunk.line)
    if (at >= 0) lines.splice(at, 1)
    chunkCallLines.delete(id)
  }

  for (const entry of entries) {
    const rec = asRecord(entry)
    if (rec === undefined) continue
    if (rec.type === 'chunks') {
      const event = asRecord(rec.event)
      if (event === undefined || typeof event.type !== 'string') continue
      const data = asRecord(event.data)
      if (data === undefined) continue
      const turn = data.turn
      const step = data.step
      const key = `${String(turn)}:${String(step)}:${String(data.index)}`
      const firstSeq = typeof event.seq === 'number' ? event.seq : lines.length
      if (event.type === 'chunkrow/text-chunks') {
        const texts = Array.isArray(data.texts) ? data.texts.filter((part): part is string => typeof part === 'string') : []
        if (texts.length > 0) pushChunkText(key, firstSeq, texts.join(''))
      } else if (event.type === 'chunkrow/tool-call-chunks') {
        const id = asString(data.id)
        const args = Array.isArray(data.args) ? data.args.filter((part): part is string => typeof part === 'string') : []
        const name = asString(data.name)
        if (id !== undefined && id !== '' && args.length > 0) {
          const call = calls.get(id)
          if (call !== undefined && call.argsRaw === undefined) call.argsRaw = args.join('')
          else if (call === undefined) pushChunkCall(id, name, args.join(''))
        }
      }
      continue
    }
    const event = asRecord(rec.event)
    if (event === undefined) continue
    const type = asString(event.type)
    const data = asRecord(event.data)
    const seq = typeof event.seq === 'number' ? event.seq : lines.length
    if (type === 'user/message') {
      const parts: string[] = []
      const content = Array.isArray(data?.content) ? data.content : []
      for (const block of content) {
        const blockRec = asRecord(block)
        if (blockRec === undefined) continue
        if (blockRec.type === 'image') parts.push('〔图片〕')
        else if (blockRec.type === 'text' && typeof blockRec.text === 'string' && blockRec.text.trim() !== '') parts.push(blockRec.text.trim())
      }
      const text = parts.join('\n')
      if (text !== '') lines.push({ id: `user-${seq}`, kind: 'user', text })
      continue
    }
    if (type === 'assistant/chunk') {
      if (data === undefined) continue
      const turn = data.turn
      const step = data.step
      const chunk = data.chunk
      const chunkRec = asRecord(chunk)
      if (chunkRec?.type === 'tool-call-delta') {
        const id = asString(chunkRec.id)
        if (id !== undefined && id !== '') {
          const name = asString(chunkRec.name)
          pushChunkCall(id, name, asString(chunkRec.argumentsDelta) ?? '')
        }
        continue
      }
      const delta = chunkTextOf(chunk)
      if (delta.text !== '') pushChunkText(`${String(turn)}:${String(step)}:${String(chunkRec?.index ?? 0)}`, seq, delta.text)
      continue
    }
    if (type === 'assistant/message') {
      if (data === undefined) continue
      dropChunks(`${String(data.turn)}:${String(data.step)}:`)
      const message = asRecord(data.message)
      const text = textOfBlocks(message?.content ?? message?.blocks)
      if (text !== '') {
        lines.push({
          id: `asst-${seq}`,
          kind: 'assistant',
          text,
          ...(data.interrupted === true ? { streaming: false } : {}),
        })
      }
      continue
    }
    if (type === 'tool/call') {
      if (data === undefined) continue
      const callId = asString(data.callId) ?? `call-${seq}`
      const name = asString(data.name) ?? 'tool'
      const argsRaw = asString(data.arguments)
      calls.set(callId, { name, ...(argsRaw !== undefined ? { argsRaw } : {}) })
      dropChunkCall(callId)
      lines.push({
        id: `call-${callId}`, kind: 'tool', name, text: toolCaption(name, argsRaw), ...(argsRaw !== undefined ? { args: pretty(argsRaw) } : {}), status: 'running',
      })
      continue
    }
    if (type === 'tool/result') {
      if (data === undefined) continue
      const message = asRecord(data.message)
      const first = Array.isArray(message?.content) ? asRecord(message.content[0]) : undefined
      const callId = asString(first?.toolCallId) ?? `result-${seq}`
      const call = calls.get(callId)
      const name = call?.name ?? 'tool'
      dropChunkCall(callId)
      const err = first?.isError === true || data.error !== undefined
      const result = textOfBlocks(first?.content)
      const running = lines.find(line => line.id === `call-${callId}`)
      if (running !== undefined) {
        running.status = err ? 'error' : 'ok'
        if (result !== '') running.result = result
      } else {
        lines.push({
          id: `tool-${seq}`,
          kind: 'tool',
          name,
          text: toolCaption(name, call?.argsRaw),
          ...(call?.argsRaw !== undefined ? { args: pretty(call.argsRaw) } : {}),
          ...(result !== '' ? { result } : {}),
          status: err ? 'error' : 'ok',
        })
      }
      continue
    }
    if (type === 'command/run') {
      const commandId = asString(data?.commandId) ?? `command-${seq}`
      const name = asString(data?.name) ?? 'command'
      lines.push({ id: `cmd-${commandId}`, kind: 'tool', name, text: `${name}：`, status: 'running' })
      continue
    }
    if (type === 'command/done') {
      const commandId = asString(data?.commandId)
      const kind = asString(data?.kind)
      const text = asString(data?.text)
      const running = commandId !== undefined ? lines.find(line => line.id === `cmd-${commandId}`) : undefined
      if (running !== undefined) {
        running.status = kind === 'error' ? 'error' : 'ok'
        if (text !== undefined && text !== '') running.result = text
      } else {
        lines.push({
          id: `cmd-${seq}`, kind: 'tool', name: 'command', text: 'command：',
          ...(text !== undefined && text !== '' ? { result: text } : {}), status: kind === 'error' ? 'error' : 'ok',
        })
      }
      continue
    }
    if (type === 'turn/end') {
      const reason = asRecord(data?.reason)
      if (reason?.kind === 'error') {
        const error = asRecord(reason.error)
        const message = asString(error?.message) ?? '本轮失败'
        lines.push({ id: `err-${seq}`, kind: 'notice', text: message })
      }
      continue
    }
    if (type === 'llm/retry' || type === 'llm/retry-started') {
      const message = asString(data?.message)
      lines.push({ id: `retry-${seq}`, kind: 'notice', text: message ?? '模型将重试' })
      continue
    }
  }

  if (running) {
    const last = lines.at(-1)
    const streamingBody = last?.kind === 'assistant' && last.streaming === true
    const runningTool = last?.kind === 'tool' && last.status === 'running'
    if (!streamingBody && !runningTool) {
      lines.push({ id: 'thinking', kind: 'thinking', text: '思考中', streaming: true })
    }
  }
  return { lines, running, ready }
}

/** Fold one live binding into the dock model on alpha.1 hosts; undefined on legacy snapshots. */
export function dockItemsFromLive(binding: LiveBinding | undefined): LiveDockModel | undefined {
  if (binding?.session === undefined || binding.eventSource === undefined) return undefined
  const snapshot = asRecord(binding.session.getSnapshot())
  return {
    ...dockItemsFromWindow(binding.eventSource.getSnapshot(), {
      running: snapshot?.running === true,
      ...(typeof snapshot?.openState === 'string' ? { openState: snapshot.openState } : {}),
    }),
    waits: [],
  }
}

interface PendingCarrier {
  kind: string
  key: string
  sessionId: string
  raw: Record<string, unknown>
}

/**
 * Subscribe to the alpha.1 pending-interaction map face; undefined when absent.
 */
export function subscribeWaitSource(pending: unknown, listener: () => void): (() => void) | undefined {
  const face = asRecord(pending)
  const subscribe = face?.subscribe
  if (typeof subscribe !== 'function') return undefined
  try {
    const off = subscribe.call(pending, listener)
    return typeof off === 'function' ? off as () => void : undefined
  } catch {
    return undefined
  }
}

/**
 * Project the α.1 pending-interaction map (ctx.uiSession.pendingInteractions)
 * into the dock's wait vocabulary. respond() keeps the legacy wire envelope so
 * answerQuestion/answerApproval/cancelQuestion stay host-version agnostic.
 */
export function waitsFromPending(pending: unknown, sessionId?: string): LiveWait[] {
  const face = asRecord(pending)
  const getSnapshot = face?.getSnapshot
  if (typeof getSnapshot !== 'function' || sessionId === undefined || sessionId === '') return []
  let snapshot: unknown
  try {
    snapshot = getSnapshot.call(pending)
  } catch {
    return []
  }
  if (!(snapshot instanceof Map)) return []
  const raw = snapshot.get(sessionId) ?? [...snapshot.values()].find(value => asRecord(value)?.sessionId === sessionId)
  const rec = asRecord(raw)
  if (rec === undefined) return []
  const kind = asString(rec.kind)
  const key = asString(rec.key) ?? kind ?? 'wait'
  const carrier = rec as { answer?: (value: unknown) => Promise<unknown>; cancel?: () => Promise<unknown> }
  if (kind === 'approval') {
    return [{
      kind: 'approval',
      key,
      sessionId,
      approvalId: asString(rec.approvalId) ?? asString(rec.callId) ?? key,
      toolName: asString(rec.toolName) ?? 'tool',
      ...(asString(rec.reason) !== undefined ? { reason: asString(rec.reason) } : {}),
      respond: async (result: unknown) => {
        const body = asRecord(result)
        const value = asRecord(body?.value)
        if (body?.ok === false) {
          if (typeof carrier.cancel === 'function') await carrier.cancel()
          return { accepted: true }
        }
        if (typeof carrier.answer !== 'function') return { accepted: false, reason: 'no-answerer' }
        await carrier.answer(asString(value?.outcome) ?? 'allowed-once')
        return { accepted: true }
      },
    }]
  }
  if (kind === 'question' || kind === 'plan-review') {
    const questions = parseAskItems(rec.questions)
    if (questions.length === 0) return []
    return [{
      kind: 'question',
      key,
      sessionId,
      questions,
      respond: async (result: unknown): Promise<unknown> => {
        const body = asRecord(result)
        const value = asRecord(body?.value)
        if (body?.ok === false) {
          if (typeof carrier.cancel === 'function') await carrier.cancel()
          return { accepted: true }
        }
        if (typeof carrier.answer !== 'function') return { accepted: false, reason: 'no-answerer' }
        const answer = asRecord(value?.answer)
        await carrier.answer({ answers: Array.isArray(answer?.answers) ? answer.answers : [] })
        return { accepted: true }
      },
    }]
  }
  return []
}
