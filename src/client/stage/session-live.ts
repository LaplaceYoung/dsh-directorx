/**
 * Duck-typed face of DSH ctx.sessions. The official conversation seat stays
 * put; the canvas dock only reads the same live snapshot and answers waits.
 */

import { textFromBlocks, toolCaption, type SessionLine } from './session-fold.ts'

export interface LiveSessionHandle {
  subscribe: (listener: () => void) => () => void
  getSnapshot: () => unknown
  prompt?: (content: Array<{ type: 'text'; text: string }>, mode: 'queue' | 'steer') => Promise<unknown>
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
      lines.push({
        id: `tool-${seq}`,
        kind: 'tool',
        name,
        text: toolCaption(name, typeof call?.argsRaw === 'string' ? call.argsRaw : args),
        ...(args !== undefined ? { args } : {}),
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
