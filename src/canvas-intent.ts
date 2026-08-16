import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

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
  status: 'pending' | 'taken' | 'done' | 'cancelled'
  at: number
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
    '请由你掌管画布：用 directorx_canvas_intents 领取本条，再用 directorx_canvas_* / directorx_canvas_continue / directorx_propose / 生成工具执行。不要让画布 UI 自己写 generating 节点或 canvas.json。',
    `- 意图 id: ${intent.id}`,
    `- 类型: ${intent.kind}`,
    `- 提示词: ${intent.prompt}`,
    `- 源节点: ${source}`,
    intent.selectedIds.length > 0 ? `- 当前选中: ${intent.selectedIds.join(', ')}` : '',
    intent.characters.length > 0
      ? `- 角色锚点: ${intent.characters.join(', ')}。生成工具必须传 characters 参数（directorx_character_list 已注册）。`
      : '',
    '做完后调用 directorx_canvas_intent_ack。',
  ].filter(Boolean).join('\n')
}

export class CanvasIntentStore {
  constructor(private readonly outputDir: string) {}

  private filePath(): string {
    return join(resolve(process.cwd(), this.outputDir), FILE)
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
    await mkdir(resolve(process.cwd(), this.outputDir), { recursive: true })
    await writeFile(this.filePath(), JSON.stringify(ledger, null, 2), 'utf8')
    return ledger
  }

  async enqueue(input: { kind: CanvasIntentKind; prompt: string; sourceId?: string; selectedIds?: string[]; characters?: string[] }): Promise<CanvasIntent> {
    const prompt = input.prompt.trim()
    if (prompt === '') throw new Error('prompt 不能为空')
    if (input.kind !== 'image' && input.kind !== 'video') throw new Error('kind 必须是 image/video')
    const ledger = await this.read()
    const intent: CanvasIntent = {
      id: `intent-${Date.now().toString(36)}`,
      kind: input.kind,
      prompt: prompt.slice(0, 2000),
      ...(typeof input.sourceId === 'string' && input.sourceId !== '' ? { sourceId: input.sourceId.slice(0, 100) } : {}),
      selectedIds: (input.selectedIds ?? []).filter((id): id is string => typeof id === 'string' && id !== '').slice(0, 20),
      characters: (input.characters ?? []).filter((name): name is string => typeof name === 'string' && name.trim() !== '').map(name => name.trim().slice(0, 80)).slice(0, 8),
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

  async ack(id: string, status: 'taken' | 'done' | 'cancelled'): Promise<CanvasIntent> {
    const ledger = await this.read()
    const intent = ledger.intents.find(item => item.id === id)
    if (intent === undefined) throw new Error(`canvas intent "${id}" not found`)
    intent.status = status
    await this.write(ledger)
    return intent
  }
}
