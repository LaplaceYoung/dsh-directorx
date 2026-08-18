import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { resolveOutputDir } from './support.ts'
import type { ConfirmQuestion } from './confirm.ts'

export const STAGE_IDS = [
  'brief', 'research', 'forks', 'script', 'cast', 'storyboard',
  'craft', 'place', 'generate', 'assemble', 'qa', 'deliver',
] as const

export type StageId = (typeof STAGE_IDS)[number]

export interface StageArtifact {
  kind: string
  path?: string
  note?: string
  at: number
}

export interface StageEntry {
  id: StageId
  label: string
  status: 'pending' | 'active' | 'done' | 'skipped'
  artifacts: StageArtifact[]
  updatedAt?: number
}

export interface ProductionStageDoc {
  title: string
  current: StageId
  entries: StageEntry[]
  updatedAt: number
}

const LABELS: Record<StageId, string> = {
  brief: '分诊',
  research: '调研',
  forks: '分叉确认',
  script: '剧本/大纲',
  cast: '角色锚点',
  storyboard: '分镜',
  craft: '提示词成稿',
  place: '占位签字',
  generate: '生成',
  assemble: '剪辑成片',
  qa: '质检',
  deliver: '交付',
}

function normalizeDoc(doc: ProductionStageDoc): ProductionStageDoc {
  const entries = STAGE_IDS.map(id => {
    const existing = doc.entries.find(item => item.id === id)
    if (existing !== undefined) return { ...existing, label: LABELS[id] }
    return { id, label: LABELS[id], status: 'pending' as const, artifacts: [] }
  })
  const current = STAGE_IDS.includes(doc.current) ? doc.current : 'brief'
  return { ...doc, current, entries }
}

function emptyDoc(title = ''): ProductionStageDoc {
  return {
    title,
    current: 'brief',
    entries: STAGE_IDS.map(id => ({
      id,
      label: LABELS[id],
      status: id === 'brief' ? 'active' : 'pending',
      artifacts: [],
    })),
    updatedAt: Date.now(),
  }
}

export class ProductionStageStore {
  constructor(private readonly outputDir: string) {}

  private filePath(): string {
    return join(resolveOutputDir(this.outputDir), 'stage.json')
  }

  async read(): Promise<ProductionStageDoc> {
    try {
      const parsed = JSON.parse(await readFile(this.filePath(), 'utf8')) as ProductionStageDoc
      if (!Array.isArray(parsed.entries) || parsed.entries.length === 0) return emptyDoc(parsed.title)
      return normalizeDoc(parsed)
    } catch {
      return emptyDoc()
    }
  }

  private async write(doc: ProductionStageDoc): Promise<ProductionStageDoc> {
    doc.updatedAt = Date.now()
    await mkdir(resolveOutputDir(this.outputDir), { recursive: true })
    await writeFile(this.filePath(), JSON.stringify(doc, null, 2), 'utf8')
    return doc
  }

  async get(): Promise<ProductionStageDoc & { next?: StageId; gate?: ConfirmQuestion }> {
    const doc = await this.read()
    const index = STAGE_IDS.indexOf(doc.current)
    const next = index >= 0 && index < STAGE_IDS.length - 1 ? STAGE_IDS[index + 1] : undefined
    return {
      ...doc,
      next,
      gate: {
        id: 'stage',
        header: `阶段 · ${LABELS[doc.current]}`,
        question: next
          ? `当前阶段「${LABELS[doc.current]}」完成了吗？下一步是「${LABELS[next]}」。`
          : '已到交付。确认成片可以交出去？',
        options: next
          ? [
            { label: `进入 ${LABELS[next]}`, description: '上游产物已在盘上' },
            { label: '还停在本阶段', description: '产物未齐，继续补' },
            { label: '跳过本阶段', description: '本片不需要这一步' },
          ]
          : [
            { label: '交付', description: '质检已过，可以交片' },
            { label: '还停在本阶段', description: '再改一版' },
          ],
      },
    }
  }

  async record(input: { stage?: StageId; kind: string; path?: string; note?: string }): Promise<ProductionStageDoc> {
    const doc = await this.read()
    const id = input.stage ?? doc.current
    const entry = doc.entries.find(item => item.id === id)
    if (entry === undefined) throw new Error(`unknown stage ${id}`)
    entry.artifacts.push({
      kind: input.kind.trim() || 'note',
      ...(input.path !== undefined && input.path !== '' ? { path: input.path } : {}),
      ...(input.note !== undefined && input.note !== '' ? { note: input.note.slice(0, 500) } : {}),
      at: Date.now(),
    })
    entry.updatedAt = Date.now()
    if (entry.status === 'pending') entry.status = 'active'
    doc.current = id
    return this.write(doc)
  }

  async advance(to: StageId, mode: 'done' | 'skip' = 'done'): Promise<ProductionStageDoc> {
    if (!STAGE_IDS.includes(to)) throw new Error(`unknown stage ${to}`)
    const doc = await this.read()
    const current = doc.entries.find(item => item.id === doc.current)
    if (current !== undefined) current.status = mode === 'skip' ? 'skipped' : 'done'
    const target = doc.entries.find(item => item.id === to)
    if (target !== undefined && target.status !== 'done') target.status = 'active'
    doc.current = to
    return this.write(doc)
  }
}

export function parseStageId(value: unknown): StageId | undefined {
  return typeof value === 'string' && (STAGE_IDS as readonly string[]).includes(value)
    ? value as StageId
    : undefined
}
