import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { resolveOutputDir } from './support.ts'

/**
 * DSH-owned canvas directives. The WebUI never mutates the storyboard for
 * generation; it enqueues an intent. DSH reads it, writes the canvas through
 * directorx_canvas_* / directorx_canvas_continue, then acks.
 */

export type CanvasIntentKind = 'image' | 'video'

export interface CanvasIntent {
  id: string
  kind: CanvasIntentKind
  prompt: string
  sourceId?: string
  selectedIds: string[]
  characters: string[]
  model?: string
  aspect?: string
  count?: number
  durationSec?: number
  refIds?: string[]
  status: 'pending' | 'taken' | 'done' | 'cancelled'
  at: number
  takenAt?: number
}

interface IntentLedger { intents: CanvasIntent[] }

const FILE = 'canvas-intents.json'
const MAX = 100

export function formatDshCanvasPrompt(intent: CanvasIntent, extras: { sourceLabel?: string } = {}): string {
  const source = intent.sourceId !== undefined
    ? `${intent.sourceId}${extras.sourceLabel !== undefined && extras.sourceLabel !== '' ? `（${extras.sourceLabel}）` : ''}`
    : '（无，从空白开新节点）'
  return [
    '[DirectorX 画布指令]',
    '下面「意图」只是用户原句，不是生成提示词。禁止拿它直接 generate。',
    '用 directorx_canvas_intents { claim: true } 领取本条。固定顺序：claim → directorx_knowledge_search/read → directorx_skill_search/read（必要时外部调研）→ directorx_prompt_craft（intent=原句，prompt=成稿）→ directorx_generate_ready（设定图/场景/关键帧/首尾帧/图生，缺参考先补）→ 严格/协同 directorx_propose+confirm → 带 craftId 和 readyId 再 directorx_canvas_continue / generate。不要让画布 UI 自己写 generating 节点。',
    `- 意图 id: ${intent.id}`,
    `- 类型: ${intent.kind}`,
    `- 意图（未成稿）: ${intent.prompt}`,
    `- 源节点: ${source}`,
    intent.selectedIds.length > 0 ? `- 当前选中: ${intent.selectedIds.join(', ')}` : '',
    intent.model !== undefined && intent.model !== '' ? `- 模型: ${intent.model}` : '',
    intent.aspect !== undefined && intent.aspect !== '' ? `- 画幅: ${intent.aspect}` : '',
    intent.count !== undefined && intent.count > 1 ? `- 次数: ${intent.count}` : '',
    intent.durationSec !== undefined ? `- 时长: ${intent.durationSec}s` : '',
    intent.refIds !== undefined && intent.refIds.length > 0 ? `- 参考节点: ${intent.refIds.join(', ')}` : '',
    intent.characters.length > 0
      ? `- 角色锚点: ${intent.characters.join(', ')}。生成工具必须传 characters 参数（directorx_character_list 已注册）。`
      : '',
    '做完后调用 directorx_canvas_intent_ack。',
  ].filter(Boolean).join('\n')
}

export class CanvasIntentStore {
  constructor(private readonly outputDir: string) {}

  private filePath(): string {
    return join(resolveOutputDir(this.outputDir), FILE)
  }

  async read(): Promise<IntentLedger> {
    try {
      const parsed = JSON.parse(await readFile(this.filePath(), 'utf8')) as Partial<IntentLedger>
      return {
        intents: Array.isArray(parsed.intents)
          ? parsed.intents.map(item => ({
              ...item,
              characters: Array.isArray(item.characters) ? item.characters : [],
              selectedIds: Array.isArray(item.selectedIds) ? item.selectedIds : [],
            }))
          : [],
      }
    } catch {
      return { intents: [] }
    }
  }

  private async write(ledger: IntentLedger): Promise<IntentLedger> {
    await mkdir(resolveOutputDir(this.outputDir), { recursive: true })
    await writeFile(this.filePath(), JSON.stringify(ledger, null, 2), 'utf8')
    return ledger
  }

  async enqueue(input: {
    kind: CanvasIntentKind
    prompt: string
    sourceId?: string
    selectedIds?: string[]
    characters?: string[]
    model?: string
    aspect?: string
    count?: number
    durationSec?: number
    refIds?: string[]
  }): Promise<CanvasIntent> {
    const prompt = input.prompt.trim()
    if (prompt === '') throw new Error('prompt 不能为空')
    if (input.kind !== 'image' && input.kind !== 'video') throw new Error('kind 必须是 image/video')
    const ledger = await this.read()
    const count = typeof input.count === 'number' && Number.isFinite(input.count) ? Math.max(1, Math.min(4, Math.floor(input.count))) : undefined
    const durationSec = typeof input.durationSec === 'number' && Number.isFinite(input.durationSec) ? Math.max(1, Math.min(15, Math.floor(input.durationSec))) : undefined
    const intent: CanvasIntent = {
      id: `intent-${Date.now().toString(36)}`,
      kind: input.kind,
      prompt: prompt.slice(0, 2000),
      ...(typeof input.sourceId === 'string' && input.sourceId !== '' ? { sourceId: input.sourceId.slice(0, 100) } : {}),
      selectedIds: (input.selectedIds ?? []).filter((id): id is string => typeof id === 'string' && id !== '').slice(0, 20),
      characters: (input.characters ?? []).filter((name): name is string => typeof name === 'string' && name.trim() !== '').map(name => name.trim().slice(0, 80)).slice(0, 8),
      ...(typeof input.model === 'string' && input.model !== '' ? { model: input.model.slice(0, 80) } : {}),
      ...(typeof input.aspect === 'string' && input.aspect !== '' ? { aspect: input.aspect.slice(0, 16) } : {}),
      ...(count !== undefined ? { count } : {}),
      ...(durationSec !== undefined ? { durationSec } : {}),
      ...(Array.isArray(input.refIds) ? { refIds: input.refIds.filter((id): id is string => typeof id === 'string' && id !== '').slice(0, 8) } : {}),
      status: 'pending',
      at: Date.now(),
    }
    ledger.intents.push(intent)
    if (ledger.intents.length > MAX) ledger.intents.splice(0, ledger.intents.length - MAX)
    await this.write(ledger)
    return intent
  }

  async list(status?: CanvasIntent['status']): Promise<CanvasIntent[]> {
    const ledger = await this.read()
    const filtered = status === undefined ? ledger.intents : ledger.intents.filter(item => item.status === status)
    return filtered.slice().reverse()
  }

  /**
   * Claim the oldest pending intent. Two DSH turns cannot take the same
   * directive: the first call marks it taken, the next call gets the next one.
   */
  async takeNext(): Promise<CanvasIntent | null> {
    const ledger = await this.read()
    const pending = ledger.intents
      .filter(item => item.status === 'pending')
      .slice()
      .sort((a, b) => a.at - b.at)
    const intent = pending[0]
    if (intent === undefined) return null
    intent.status = 'taken'
    intent.takenAt = Date.now()
    await this.write(ledger)
    return intent
  }

  async ack(id: string, status: 'taken' | 'done' | 'cancelled'): Promise<CanvasIntent> {
    const ledger = await this.read()
    const intent = ledger.intents.find(item => item.id === id)
    if (intent === undefined) throw new Error(`canvas intent "${id}" not found`)
    const allowed = TRANSITIONS[intent.status]
    if (!allowed.includes(status)) {
      throw new Error(`canvas intent "${id}" cannot move ${intent.status} → ${status}`)
    }
    intent.status = status
    if (status === 'taken') intent.takenAt = Date.now()
    await this.write(ledger)
    return intent
  }
}

const TRANSITIONS: Record<CanvasIntent['status'], ReadonlyArray<CanvasIntent['status']>> = {
  pending: ['taken', 'done', 'cancelled'],
  taken: ['done', 'cancelled'],
  done: [],
  cancelled: [],
}
