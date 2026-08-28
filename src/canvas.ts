import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { resolveStoredLabel } from './card-label.ts'
import { canvasNodeKind, type CanvasNodeKind } from './canvas-kind.ts'
import { resolveOutputDir } from './support.ts'
import { planContinueGenerate, type ContinueGenerateKind } from './canvas-generate.ts'

/**
 * Durable canvas document shared between the WebUI infinite canvas and the
 * agent's canvas tools. Stored as `<outputDir>/canvas.json`; writes carry an
 * optimistic-concurrency guard (expectedUpdatedAt) so a stale WebUI save
 * cannot clobber a newer agent edit.
 */

export type { CanvasNodeKind }

export interface CanvasNode {
  id: string
  kind: CanvasNodeKind
  label: string
  /** Local media path (served by /directorx/media) or an http(s) URL. */
  path?: string
  /** Group membership: id of a `group` node in the same document. */
  parent?: string
  x: number
  y: number
  width?: number
  height?: number
  /** 存储身份的稳定镜号（确定性排片的唯一依据，不靠坐标/连线）。 */
  shotIndex?: number
  /** 节点自带的生成提示词（prompt-first：压过自动合成）。 */
  prompt?: string
  /** 节点锁：锁定后拒改提示词/删除/入边（定妆用途），出边引用放行。 */
  locked?: boolean
  /** 幂等缓存的自动简介（vision 生成后落节点；有 prompt 时跳过）。 */
  aiBrief?: string
  /** 镜头状态（Shot 一等容器语义）：idea/approved/generating/review/locked。 */
  shotStatus?: 'idea' | 'approved' | 'generating' | 'review' | 'locked' | 'failed'
  aspect?: string
  model?: string
  durationSec?: number
  lastError?: string
  count?: number
  characters?: string[]
  /** 选定 Take：Shot 组内被钉住采用的结果节点 id。 */
  selectedTakeId?: string
  /** 连续性规则引用：跨镜头锁定的角色/服装/道具/光线/方位等约束。 */
  continuityRules?: string[]
}

export interface CanvasEdge {
  id: string
  from: string
  to: string
  label?: string
  sourceHandle?: string
  targetHandle?: string
  /** 变体逐边绑定：多变体源「哪个 variant 喂哪个下游」按边钉住（生成端不保证 output[i]↔input[i] 对齐）。 */
  sourceVariantIdx?: number
}

export interface CanvasDocument {
  version: 1
  updatedAt: number
  /** Optional project title (canvas header). */
  title?: string
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

const CANVAS_FILE = 'canvas.json'

/** A missing canvas document reads as epoch 0 — a stable stamp for the first write. */
function emptyDocument(): CanvasDocument {
  return { version: 1, updatedAt: 0, nodes: [], edges: [] }
}

function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

/** Strip unknown fields and clamp numeric positions so foreign input stays safe. */
const SHOT_CARD_W = 280
const SHOT_CARD_H = 158
const SHOT_GAP = 20
const ACT_GAP = 48
const GROUP_PAD_X = 36
const GROUP_PAD_Y = 56

function nextOpenSlot(nodes: CanvasNode[]): { x: number; y: number } {
  const top = nodes.filter(node => node.parent === undefined)
  if (top.length === 0) return { x: 48, y: 48 }
  const right = Math.max(...top.map(node => node.x + (node.width ?? SHOT_CARD_W)))
  const topY = Math.min(...top.map(node => node.y))
  if (right > 48 + 4 * (SHOT_CARD_W + SHOT_GAP)) {
    const bottom = Math.max(...top.map(node => node.y + (node.height ?? SHOT_CARD_H)))
    return { x: 48, y: bottom + SHOT_GAP }
  }
  return { x: right + SHOT_GAP, y: topY }
}

const KIND_RANK: Record<CanvasNodeKind, number> = { text: 0, image: 1, video: 2, audio: 3, group: 4, 'director-stage': 5, edit: 6 }

/** Generation graph: media may feed media; text may feed media; video never feeds image. */
export function canvasEdgeAllowed(from: CanvasNode, to: CanvasNode): boolean {
  if (to.locked === true) return false
  if (to.kind === 'text' || to.kind === 'group' || to.kind === 'director-stage' || to.kind === 'edit') return false
  if (from.kind === 'group') return false
  if (from.kind === 'video' && to.kind === 'image') return false
  return to.kind === 'image' || to.kind === 'video' || to.kind === 'audio'
}

function layoutStoryboard(nodes: CanvasNode[]): void {
  const groups = nodes.filter(node => node.kind === 'group' && node.parent === undefined)
  const loose = nodes.filter(node => node.kind !== 'group' && node.parent === undefined)
  if (groups.length === 0) {
    loose.forEach((node, index) => {
      node.x = 48 + (index % 4) * (SHOT_CARD_W + SHOT_GAP)
      node.y = 48 + Math.floor(index / 4) * (SHOT_CARD_H + 36)
      node.width = node.width ?? SHOT_CARD_W
      node.height = node.height ?? (node.kind === 'text' ? 120 : SHOT_CARD_H)
    })
    return
  }
  let cursorY = 48
  for (const group of groups) {
    const members = nodes
      .filter(node => node.parent === group.id)
      .sort((left, right) => {
        const shot = (left.shotIndex ?? 1e9) - (right.shotIndex ?? 1e9)
        if (shot !== 0) return shot
        return KIND_RANK[left.kind] - KIND_RANK[right.kind]
      })
    const count = Math.max(1, members.length)
    group.x = 48
    group.y = cursorY
    group.width = GROUP_PAD_X * 2 + count * SHOT_CARD_W + (count - 1) * SHOT_GAP
    group.height = GROUP_PAD_Y + SHOT_CARD_H + 32
    members.forEach((member, index) => {
      member.x = group.x + GROUP_PAD_X + index * (SHOT_CARD_W + SHOT_GAP)
      member.y = group.y + GROUP_PAD_Y
      member.width = SHOT_CARD_W
      member.height = member.kind === 'text' ? 120 : SHOT_CARD_H
    })
    cursorY += group.height + ACT_GAP
  }
  loose.forEach((node, index) => {
    node.x = 48 + (index % 4) * (SHOT_CARD_W + SHOT_GAP)
    node.y = cursorY + Math.floor(index / 4) * (SHOT_CARD_H + 36)
    node.width = node.width ?? SHOT_CARD_W
    node.height = node.height ?? (node.kind === 'text' ? 120 : SHOT_CARD_H)
  })
}

function sanitizeNode(input: Record<string, unknown>): CanvasNode {
  const kind = canvasNodeKind({ kind: input.kind, id: input.id })
  const numberOr = (value: unknown, fallback: number) => typeof value === 'number' && Number.isFinite(value) ? value : fallback
  const rawParent = input.parent
  const prompt = typeof input.prompt === 'string' && input.prompt !== '' ? input.prompt.slice(0, 2000) : undefined
  const shotIndex = typeof input.shotIndex === 'number' && Number.isFinite(input.shotIndex) ? Math.floor(input.shotIndex) : undefined
  const node: CanvasNode = {
    id: typeof input.id === 'string' && input.id !== '' ? input.id : newId(kind),
    kind,
    label: resolveStoredLabel(
      undefined,
      typeof input.label === 'string' ? input.label.slice(0, kind === 'text' ? 8000 : 200) : '',
      prompt,
      shotIndex,
    ).slice(0, kind === 'text' ? 8000 : 200),
    ...(typeof input.path === 'string' && input.path !== '' ? { path: input.path.slice(0, 1000) } : {}),
    ...(typeof rawParent === 'string' && rawParent !== '' ? { parent: rawParent.slice(0, 100) } : {}),
    x: numberOr(input.x, 0),
    y: numberOr(input.y, 0),
    ...(input.width !== undefined ? { width: Math.max(60, Math.min(kind === 'group' ? 3200 : 1600, numberOr(input.width, 240))) } : {}),
    ...(input.height !== undefined ? { height: Math.max(60, Math.min(kind === 'group' ? 2400 : 1200, numberOr(input.height, 160))) } : {}),
    ...(shotIndex !== undefined ? { shotIndex } : {}),
    ...(prompt !== undefined ? { prompt } : {}),
    ...(input.locked === true ? { locked: true } : {}),
    ...(typeof input.aiBrief === 'string' && input.aiBrief !== '' ? { aiBrief: input.aiBrief.slice(0, 500) } : {}),
    ...(typeof input.shotStatus === 'string' && ['idea', 'approved', 'generating', 'review', 'locked', 'failed'].includes(input.shotStatus) ? { shotStatus: input.shotStatus as CanvasNode['shotStatus'] } : {}),
    ...(typeof input.selectedTakeId === 'string' && input.selectedTakeId !== '' ? { selectedTakeId: input.selectedTakeId.slice(0, 100) } : {}),
    ...(typeof input.aspect === 'string' && input.aspect !== '' ? { aspect: input.aspect.slice(0, 16) } : {}),
    ...(typeof input.model === 'string' && input.model !== '' ? { model: input.model.slice(0, 80) } : {}),
    ...(typeof input.durationSec === 'number' && Number.isFinite(input.durationSec) ? { durationSec: Math.max(1, Math.min(15, Math.floor(input.durationSec))) } : {}),
    ...(typeof input.lastError === 'string' && input.lastError !== '' ? { lastError: input.lastError.slice(0, 300) } : {}),
    ...(typeof input.count === 'number' && Number.isFinite(input.count) ? { count: Math.max(1, Math.min(4, Math.floor(input.count))) } : {}),
    ...(Array.isArray(input.characters) ? { characters: input.characters.filter((name: unknown): name is string => typeof name === 'string' && name.trim() !== '').map((name: string) => name.trim().slice(0, 80)).slice(0, 8) } : {}),
    ...(Array.isArray(input.continuityRules) ? { continuityRules: input.continuityRules.filter((rule: unknown): rule is string => typeof rule === 'string' && rule !== '').slice(0, 5).map((rule: string) => rule.slice(0, 200)) } : {}),
  }
  return node
}

/**
 * Drop parent references that do not point at a group node in this document
 * (self/cycles/missing nodes included).
 */
function validateParents(doc: CanvasDocument): void {
  const byId = new Map(doc.nodes.map(node => [node.id, node]))
  for (const node of doc.nodes) {
    if (node.parent === undefined) continue
    const parent = byId.get(node.parent)
    if (parent === undefined || parent.kind !== 'group' || parent.id === node.id) {
      delete node.parent
    }
  }
}

function sanitizeEdge(input: Record<string, unknown>): CanvasEdge {
  return {
    id: typeof input.id === 'string' && input.id !== '' ? input.id : newId('edge'),
    from: typeof input.from === 'string' ? input.from : '',
    to: typeof input.to === 'string' ? input.to : '',
    ...(typeof input.label === 'string' && input.label !== '' ? { label: input.label.slice(0, 200) } : {}),
    ...(typeof input.sourceHandle === 'string' && input.sourceHandle !== '' ? { sourceHandle: input.sourceHandle.slice(0, 16) } : {}),
    ...(typeof input.targetHandle === 'string' && input.targetHandle !== '' ? { targetHandle: input.targetHandle.slice(0, 16) } : {}),
    ...(typeof input.sourceVariantIdx === 'number' && Number.isFinite(input.sourceVariantIdx) && input.sourceVariantIdx >= 0 ? { sourceVariantIdx: Math.floor(input.sourceVariantIdx) } : {}),
  }
}

export class DirectorxCanvasStore {
  private readonly outputDir: string

  constructor(outputDir: string) {
    this.outputDir = outputDir
  }

  private filePath(): string {
    return join(resolveOutputDir(this.outputDir), CANVAS_FILE)
  }

  async read(): Promise<CanvasDocument> {
    const path = this.filePath()
    const raw = await readFile(path, 'utf8').catch(error => {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return ''
      throw error
    })
    if (raw === '') return emptyDocument()
    try {
      const parsed = JSON.parse(raw) as Partial<CanvasDocument>
      // Migration scaffold: any legacy shape is normalized to the current
      // document format. A missing updatedAt resolves to the stable 0 (never
      // Date.now(), which would churn the WebUI poll on every read).
      const migrated: CanvasDocument = {
        version: 1,
        updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : 0,
        ...(typeof parsed.title === 'string' && parsed.title !== '' ? { title: parsed.title.slice(0, 200) } : {}),
        nodes: Array.isArray(parsed.nodes) ? parsed.nodes.map(item => sanitizeNode(item as unknown as Record<string, unknown>)) : [],
        edges: Array.isArray(parsed.edges) ? parsed.edges.map(item => sanitizeEdge(item as unknown as Record<string, unknown>)) : [],
      }
      validateParents(migrated)
      return migrated
    } catch {
      return emptyDocument()
    }
  }

  /** Clear the canvas, keeping a timestamped backup of the previous doc. */
  async reset(): Promise<CanvasDocument> {
    const path = this.filePath()
    try {
      const existing = await readFile(path, 'utf8')
      if (existing.trim() !== '') {
        const backup = join(resolveOutputDir(this.outputDir), `canvas.json.bak-${Date.now()}`)
        await writeFile(backup, existing, 'utf8')
      }
    } catch {
      // No previous document to back up.
    }
    return this.write({ version: 1, updatedAt: 0, nodes: [], edges: [] })
  }

  /**
   * Persist a full document. When `expectedUpdatedAt` is provided and does not
   * match the stored revision, the write is refused with a conflict error so
   * the caller can re-read and merge.
   */
  async write(doc: CanvasDocument, expectedUpdatedAt?: number): Promise<CanvasDocument> {
    const dir = join(resolveOutputDir(this.outputDir))
    await mkdir(dir, { recursive: true })
    const path = this.filePath()
    if (expectedUpdatedAt !== undefined) {
      const current = await this.read()
      if (current.updatedAt !== expectedUpdatedAt) {
        throw Object.assign(new Error('canvas document changed since read; re-read and merge before saving'), { code: 'CANVAS_CONFLICT' })
      }
    }
    const saved: CanvasDocument = {
      version: 1,
      updatedAt: Date.now(),
      ...(typeof doc.title === 'string' && doc.title !== '' ? { title: doc.title.slice(0, 200) } : {}),
      nodes: doc.nodes.map(node => sanitizeNode(node as unknown as Record<string, unknown>)),
      edges: doc.edges.map(edge => sanitizeEdge(edge as unknown as Record<string, unknown>)),
    }
    validateParents(saved)
    await writeFile(path, JSON.stringify(saved), 'utf8')
    return saved
  }

  /** Apply one mutation transactionally: read → mutate → write (with conflict retry off). */
  private async mutate(mutator: (doc: CanvasDocument) => void): Promise<CanvasDocument> {
    const current = await this.read()
    mutator(current)
    return this.write(current, current.updatedAt)
  }

  /**
   * Continue-generate: drop a generating placeholder (and an inbound
   * wire when a source exists) using the same planner as the WebUI sheet.
   */
  async continueGenerate(input: { sourceId?: string; kind?: ContinueGenerateKind; prompt: string }): Promise<{
    doc: CanvasDocument
    nodeId: string
    proposal: { kind: ContinueGenerateKind; prompt: string; count: 1; canvasNodeId: string; note?: string }
  }> {
    const current = await this.read()
    const source = input.sourceId !== undefined ? current.nodes.find(node => node.id === input.sourceId) : undefined
    if (input.sourceId !== undefined && source === undefined) throw new Error(`canvas node "${input.sourceId}" not found`)
    const plan = planContinueGenerate({
      ...(source !== undefined ? { source: { id: source.id, x: source.x, y: source.y, width: source.width, kind: source.kind } } : {}),
      ...(input.kind !== undefined ? { kind: input.kind } : {}),
      prompt: input.prompt,
    })
    let nodeId = ''
    const doc = await this.mutate(draft => {
      const node = sanitizeNode({ id: newId(plan.node.kind), ...plan.node })
      nodeId = node.id
      draft.nodes.push(node)
      if (plan.edgeFrom !== undefined) {
        const edge = sanitizeEdge({ id: newId('edge'), from: plan.edgeFrom, to: node.id })
        this.validateEdgeForDoc(draft, edge)
        draft.edges.push(edge)
      }
    })
    return {
      doc,
      nodeId,
      proposal: {
        ...plan.proposal,
        canvasNodeId: nodeId,
      },
    }
  }

  async addNode(input: Record<string, unknown>): Promise<CanvasDocument> {
    return this.mutate(doc => {
      const node = sanitizeNode(input)
      if (input.x === undefined && input.y === undefined && node.parent === undefined) {
        const slot = nextOpenSlot(doc.nodes)
        node.x = slot.x
        node.y = slot.y
      }
      if (!doc.nodes.some(existing => existing.id === node.id)) doc.nodes.push(node)
    })
  }

  async addEdge(input: Record<string, unknown>): Promise<CanvasDocument> {
    return this.mutate(doc => {
      const edge = sanitizeEdge(input)
      const fromExists = doc.nodes.some(node => node.id === edge.from)
      const toExists = doc.nodes.some(node => node.id === edge.to)
      if (!fromExists || !toExists) {
        throw new Error(`canvas edge endpoints must reference existing nodes (${edge.from} -> ${edge.to})`)
      }
      this.validateEdgeForDoc(doc, edge)
      if (!doc.edges.some(existing => existing.id === edge.id)) doc.edges.push(edge)
    })
  }

  /** 连线校验（端点存在/类型矩阵/锁定）——addEdge 与 batchAdd 共用。 */
  private validateEdgeForDoc(doc: CanvasDocument, edge: CanvasEdge): void {
    const fromExists = doc.nodes.some(node => node.id === edge.from)
    const toExists = doc.nodes.some(node => node.id === edge.to)
    if (!fromExists || !toExists) {
      throw new Error(`canvas edge endpoints must reference existing nodes (${edge.from} -> ${edge.to})`)
    }
    const fromNode = doc.nodes.find(node => node.id === edge.from)
    const toNode = doc.nodes.find(node => node.id === edge.to)
    const fromKind = fromNode?.kind
    const toKind = toNode?.kind
    if (toNode?.locked === true) {
      throw new Error(`edge reason: 目标节点 ${edge.to} 已锁定（定妆用途），拒绝新入边；解锁 = update 该节点 patch {locked: false}`)
    }
    if (fromNode !== undefined && toNode !== undefined && !canvasEdgeAllowed(fromNode, toNode)) {
      if (toKind === 'text' || toKind === 'group') throw new Error(`edge reason: 目标节点是 ${toKind}，不能作为输入依赖（连线只能指向 image/video）`)
      if (fromKind === 'video' && toKind === 'image') throw new Error('edge reason: video 不能喂给 image（视频只能接力到 video）')
      if (fromKind === 'group') throw new Error('edge reason: group 只作容器，不能作为连线源')
      throw new Error(`edge reason: ${fromKind} 不能连到 ${toKind}`)
    }
  }

  private canConnect(from: CanvasNode, to: CanvasNode): boolean {
    return canvasEdgeAllowed(from, to)
  }

  async update(id: string, patch: Record<string, unknown>): Promise<CanvasDocument> {
    return this.mutate(doc => {
      const nodeIndex = doc.nodes.findIndex(node => node.id === id)
      if (nodeIndex >= 0) {
        const lockedNode = doc.nodes[nodeIndex]
        if (lockedNode.locked === true) {
          const contentKeys = ['prompt', 'label', 'path', 'kind', 'parent', 'shotIndex']
          const changingContent = contentKeys.some(key => Object.prototype.hasOwnProperty.call(patch, key))
          const onlyPosition = Object.keys(patch).every(key => key === 'x' || key === 'y' || key === 'width' || key === 'height')
          if (changingContent && !onlyPosition) {
            throw new Error(`节点 ${id} 已锁定（定妆用途）：拒改提示词/内容/分组；解锁 = 先 update 该节点 patch {locked: false}。位置调整放行。`)
          }
        }
        const existing = doc.nodes[nodeIndex]
        if (typeof patch.label === 'string') {
          patch.label = resolveStoredLabel(
            existing.label,
            patch.label,
            typeof patch.prompt === 'string' ? patch.prompt : existing.prompt,
            typeof patch.shotIndex === 'number' ? patch.shotIndex : existing.shotIndex,
          )
        }
        const merged = { ...existing, ...patch, id } as unknown as Record<string, unknown>
        // Explicitly ungroup: parent null clears membership.
        if (patch.parent === null) delete merged.parent
        doc.nodes[nodeIndex] = sanitizeNode(merged)
        return
      }
      const edgeIndex = doc.edges.findIndex(edge => edge.id === id)
      if (edgeIndex >= 0) {
        doc.edges[edgeIndex] = sanitizeEdge({ ...doc.edges[edgeIndex], ...patch, id } as unknown as Record<string, unknown>)
        return
      }
      throw new Error(`canvas element "${id}" not found`)
    })
  }

  async remove(id: string): Promise<CanvasDocument> {
    return this.mutate(doc => {
      const target = doc.nodes.find(node => node.id === id)
      if (target?.locked === true) {
        throw new Error(`节点 ${id} 已锁定（定妆用途）：拒绝删除；解锁 = 先 update 该节点 patch {locked: false}`)
      }
      const hadNode = doc.nodes.some(node => node.id === id)
      const hadEdge = doc.edges.some(edge => edge.id === id)
      if (!hadNode && !hadEdge) throw new Error(`canvas element "${id}" not found`)
      doc.nodes = doc.nodes.filter(node => node.id !== id)
      doc.edges = doc.edges.filter(edge => edge.id !== id && edge.from !== id && edge.to !== id)
    })
  }


  /** Search nodes by label substring / kind / group membership. */
  async search(query: { label?: string; kind?: CanvasNodeKind; parent?: string }): Promise<CanvasNode[]> {
    const doc = await this.read()
    const label = (query.label ?? '').trim().toLowerCase()
    return doc.nodes.filter(node => {
      if (label !== '' && !node.label.toLowerCase().includes(label)) return false
      if (query.kind !== undefined && node.kind !== query.kind) return false
      if (query.parent !== undefined && node.parent !== query.parent) return false
      return true
    })
  }

  /** Batch add nodes (and optional edges) in one write. */
  async batchAdd(input: { nodes: Array<Record<string, unknown>>; edges?: Array<Record<string, unknown>> }): Promise<CanvasDocument> {
    return this.mutate(doc => {
      for (const raw of (input.nodes ?? [])) {
        const node = sanitizeNode({ id: newId('text'), ...raw })
        if (raw.x === undefined && raw.y === undefined && node.parent === undefined) {
          const slot = nextOpenSlot(doc.nodes)
          node.x = slot.x
          node.y = slot.y
        }
        doc.nodes.push(node)
      }
      // 边走与 addEdge 相同的校验（端点存在/类型矩阵/锁定），非法边报 reason。
      for (const edge of (input.edges ?? [])) {
        const candidate = sanitizeEdge({ id: newId('edge'), ...edge })
        this.validateEdgeForDoc(doc, candidate)
        doc.edges.push(candidate)
      }
    })
  }

  /** Dissolve a group: children become top-level (absolute coords), group and its edges removed. */
  async dissolveGroup(groupId: string): Promise<CanvasDocument> {
    return this.mutate(doc => {
      const group = doc.nodes.find(node => node.id === groupId && node.kind === 'group')
      if (group === undefined) throw new Error(`group "${groupId}" not found`)
      for (const node of doc.nodes) {
        if (node.parent === groupId) delete node.parent
      }
      doc.nodes = doc.nodes.filter(node => node.id !== groupId)
      doc.edges = doc.edges.filter(edge => edge.from !== groupId && edge.to !== groupId)
    })
  }

  /**
   * Branch a node into labelled variants (multi-version comparison): clones
   * the source node N times, labels each with its variation tag, and places
   * them in a new「名称 分支探索」group. Edges pointing at the source are
   * re-pointed to a hub note... (kept simple: edges to the source stay;
   * callers decide which variant wins later).
   */
  async branch(sourceId: string, variations: string[]): Promise<CanvasDocument> {
    return this.mutate(doc => {
      const source = doc.nodes.find(node => node.id === sourceId)
      if (source === undefined) throw new Error(`canvas node "${sourceId}" not found`)
      const groupId = newId('group')
      const originX = source.x
      const originY = source.y
      doc.nodes.push({
        id: groupId, kind: 'group',
        label: `${source.label.slice(0, 24)} 分支探索`,
        x: originX, y: originY, width: 620, height: Math.max(240, variations.length * 190 + 60),
      })
      variations.forEach((variation, index) => {
        doc.nodes.push({
          id: newId(source.kind),
          kind: source.kind,
          label: `${source.label}｜变体${index + 1} ${variation}`.slice(0, 200),
          ...(source.path !== undefined ? { path: source.path } : {}),
          parent: groupId,
          x: originX + 56,
          y: originY + 56 + index * 190,
          ...(source.width !== undefined ? { width: source.width } : {}),
        })
      })
    })
  }

  /**
   * 确定性排片：按显式 shotIndex（存储身份）排序镜头节点；
   * 未标 shotIndex 的按创建序（id 时间序）排后。
   */
  async shotSequence(parentGroupId?: string): Promise<Array<{ id: string; label: string; shotIndex: number | null }>> {
    const doc = await this.read()
    const shots = doc.nodes
      .filter(node => (node.kind === 'image' || node.kind === 'video') && (parentGroupId === undefined ? node.parent === undefined : node.parent === parentGroupId))
      .map(node => ({ id: node.id, label: node.label, shotIndex: node.shotIndex ?? null }))
    shots.sort((a, b) => {
      if (a.shotIndex !== null && b.shotIndex !== null) return a.shotIndex - b.shotIndex
      if (a.shotIndex !== null) return -1
      if (b.shotIndex !== null) return 1
      return 0
    })
    return shots
  }

  /**
   * 自动合成 prompt 上下文：沿入边回溯上游节点（最多两层），按
   * prompt-first 规则拼出分块提示上下文——主体 / 参考图（ref_image_N
   * 槽位）/ 方向 / 标题。LLM 合成步骤由 agent 在此基础上完成。
   */
  async promptFor(targetId: string): Promise<{
    targetId: string
    ownPrompt: string | null
    blocks: {
      subjects: Array<{ id: string; label: string; prompt?: string }>
      references: Array<{ n: number; id: string; path: string | null; label: string }>
      directions: string[]
      title: string | null
    }
  }> {
    const doc = await this.read()
    const target = doc.nodes.find(node => node.id === targetId)
    if (target === undefined) throw new Error(`canvas node "${targetId}" not found`)
    const upstreamIds = new Set(doc.edges.filter(edge => edge.to === targetId).map(edge => edge.from))
    const subjects: Array<{ id: string; label: string; prompt?: string }> = []
    const references: Array<{ n: number; id: string; path: string | null; label: string }> = []
    const directions: string[] = []
    let refN = 1
    for (const id of upstreamIds) {
      const node = doc.nodes.find(candidate => candidate.id === id)
      if (node === undefined) continue
      if (node.kind === 'text') {
        if (node.prompt !== undefined && node.prompt !== '') directions.push(node.prompt)
        else if (node.label !== '') directions.push(node.label)
        continue
      }
      if (node.kind === 'image' || node.kind === 'video') {
        const hasMedia = node.path !== undefined && node.path !== ''
        // 祖父追踪：image 上游再追一层 character/text 作为主体锚。
        const grandparents = doc.edges.filter(edge => edge.to === id).map(edge => edge.from)
        for (const grandId of grandparents) {
          const grand = doc.nodes.find(candidate => candidate.id === grandId)
          if (grand !== undefined && grand.kind === 'text') {
            subjects.push({ id: grand.id, label: grand.label, ...(grand.prompt !== undefined ? { prompt: grand.prompt } : {}) })
          }
        }
        references.push({ n: refN, id, path: hasMedia ? node.path as string : null, label: node.label })
        refN += 1
      }
    }
    return {
      targetId,
      ownPrompt: target.prompt ?? null,
      blocks: { subjects, references, directions, title: target.label !== '' ? target.label : null },
    }
  }

  /** 画布快照：提案执行前的可回滚检查点（撤销此批）。 */
  private snapshotsPath(): string {
    return join(resolveOutputDir(this.outputDir), '.canvas-snapshots')
  }

  private snapshotsFile(): string {
    return join(this.snapshotsPath(), 'index.json')
  }

  async snapshot(label: string): Promise<{ id: string; at: number; label: string }> {
    const doc = await this.read()
    const id = `snap-${Date.now().toString(36)}`
    const index = await this.readSnapshotsIndex()
    index.unshift({ id, at: Date.now(), label: label.slice(0, 100) })
    while (index.length > 20) index.pop()
    await mkdir(this.snapshotsPath(), { recursive: true })
    await writeFile(this.snapshotsFile(), JSON.stringify(index, null, 2), 'utf8')
    await writeFile(join(this.snapshotsPath(), `${id}.json`), JSON.stringify(doc, null, 2), 'utf8')
    return index[0]
  }

  async readSnapshotsIndex(): Promise<Array<{ id: string; at: number; label: string }>> {
    try {
      const parsed = JSON.parse(await readFile(this.snapshotsFile(), 'utf8')) as Array<{ id: string; at: number; label: string }>
      return Array.isArray(parsed) ? parsed.slice(0, 20) : []
    } catch {
      return []
    }
  }

  async restoreSnapshot(id: string): Promise<CanvasDocument> {
    const raw = await readFile(join(this.snapshotsPath(), `${id}.json`), 'utf8')
    const parsed = JSON.parse(raw) as { nodes?: unknown[]; edges?: unknown[]; title?: unknown }
    const nodes = Array.isArray(parsed.nodes) ? parsed.nodes.map((input: unknown) => sanitizeNode(input as Record<string, unknown>)) : []
    const edges = Array.isArray(parsed.edges) ? parsed.edges.map((input: unknown) => sanitizeEdge(input as Record<string, unknown>)) : []
    return this.write({ version: 1, updatedAt: Date.now(), ...(typeof parsed.title === 'string' ? { title: parsed.title } : {}), nodes, edges })
  }

  /**
   * 连续性规则注册表：汇总全部 Shot 组的 continuityRules；跨镜头重复
   * 出现的规则即「连续性锁」（报告 16.4：角色/服装/道具/光线/方位）。
   */
  async continuity(): Promise<{
    shots: Array<{ id: string; label: string; rules: string[] }>
    locks: Array<{ rule: string; shotCount: number }>
  }> {
    const doc = await this.read()
    const shots = doc.nodes
      .filter(node => node.kind === 'group' && Array.isArray(node.continuityRules) && node.continuityRules.length > 0)
      .map(node => ({ id: node.id, label: node.label, rules: node.continuityRules ?? [] }))
    const counts = new Map<string, number>()
    for (const shot of shots) {
      for (const rule of shot.rules) counts.set(rule, (counts.get(rule) ?? 0) + 1)
    }
    const locks = [...counts.entries()].filter(([, count]) => count >= 2).map(([rule, shotCount]) => ({ rule, shotCount }))
    return { shots, locks }
  }

  /**
   * Take 归档查询：Shot 组内媒体成员即 Takes（确定性排序：shotIndex
   * 优先，同值按 id）。返回选定 Take 与全体候选，供 agent 打分/对比/
   * 钉选使用。
   */
  async takes(groupId: string): Promise<{
    groupId: string
    shotStatus: string | null
    selectedTakeId: string | null
    takes: Array<{ id: string; label: string; path: string | null; shotIndex: number | null }>
  }> {
    const doc = await this.read()
    const group = doc.nodes.find(node => node.id === groupId)
    if (group === undefined || group.kind !== 'group') throw new Error(`canvas shot group "${groupId}" not found`)
    const members = doc.nodes
      .filter(node => node.parent === groupId && (node.kind === 'image' || node.kind === 'video'))
      .map(node => ({ id: node.id, label: node.label, path: node.path ?? null, shotIndex: node.shotIndex ?? null }))
      .sort((a, b) => {
        if (a.shotIndex !== null && b.shotIndex !== null && a.shotIndex !== b.shotIndex) return a.shotIndex - b.shotIndex
        if (a.shotIndex !== null) return -1
        if (b.shotIndex !== null) return 1
        return a.id < b.id ? -1 : 1
      })
    return { groupId, shotStatus: group.shotStatus ?? null, selectedTakeId: group.selectedTakeId ?? null, takes: members }
  }

  /**
   * 紧凑上下文快照：白名单行格式（id|kind|label 截断|parent），
   * 给 LLM 的画布上下文从 2-3k token 压到几百。
   */
  async summary(): Promise<string[]> {
    const doc = await this.read()
    return doc.nodes.map(node => {
      const label = node.label.replace(/\n/g, ' ').slice(0, 60)
      const parent = node.parent ?? '-'
      const index = node.shotIndex !== undefined ? `#${node.shotIndex}` : ''
      return `${node.id}|${node.kind}${index}|${label}|${parent}`
    })
  }

  /** Set the document title. */
  async setTitle(title: string): Promise<CanvasDocument> {
    return this.mutate(doc => {
      doc.title = title.slice(0, 200)
    })
  }

  /** Tree layout along edge direction: sources left, targets right, BFS levels. */
  async hierarchyLayout(gapX = 260, gapY = 140): Promise<CanvasDocument> {
    return this.mutate(doc => {
      const level = new Map<string, number>()
      const indegree = new Map<string, number>()
      const targets = new Map<string, string[]>()
      for (const edge of doc.edges) {
        indegree.set(edge.to, (indegree.get(edge.to) ?? 0) + 1)
        const list = targets.get(edge.from) ?? []
        list.push(edge.to)
        targets.set(edge.from, list)
      }
      const roots = doc.nodes.filter(node => (indegree.get(node.id) ?? 0) === 0)
      const queue = roots.map((node, index) => ({ id: node.id, level: 0, order: index }))
      const visited = new Set<string>()
      while (queue.length > 0) {
        const current = queue.shift() as { id: string; level: number; order: number }
        if (visited.has(current.id)) continue
        visited.add(current.id)
        level.set(current.id, current.level)
        const children = targets.get(current.id) ?? []
        children.forEach((child, index) => {
          if (!visited.has(child)) queue.push({ id: child, level: current.level + 1, order: index })
        })
      }
      // Nodes with no edge involvement keep their position; laid nodes get
      // level/order placement (children of the same parent stack vertically).
      const orderInLevel = new Map<number, number>()
      for (const [id, nodeLevel] of level) {
        const node = doc.nodes.find(candidate => candidate.id === id)
        if (node === undefined) continue
        const order = orderInLevel.get(nodeLevel) ?? 0
        orderInLevel.set(nodeLevel, order + 1)
        const width = node.width ?? 200
        node.x = nodeLevel * gapX
        node.y = order * gapY
        void width
      }
    })
  }

  /** 整理：分镜感横条（幕为行、镜为格）或单行；组成员留在组框内。 */
  async arrange(layout: 'grid' | 'row' = 'grid', _gap = 40): Promise<CanvasDocument> {
    return this.mutate(doc => {
      if (layout === 'row') {
        const topLevel = doc.nodes.filter(node => node.parent === undefined)
        topLevel.forEach((node, index) => {
          const width = node.width ?? (node.kind === 'group' ? 520 : SHOT_CARD_W)
          node.x = 48 + index * (width + SHOT_GAP)
          node.y = 48
          node.width = width
          node.height = node.height ?? (node.kind === 'group' ? 240 : SHOT_CARD_H)
        })
        return
      }
      layoutStoryboard(doc.nodes)
    })
  }

  /** 查一条：节点带入/出边与组员，或一条边。 */
  async getNode(id: string): Promise<
    | { kind: 'node'; node: CanvasNode; inbound: CanvasEdge[]; outbound: CanvasEdge[]; members: CanvasNode[] }
    | { kind: 'edge'; edge: CanvasEdge }
  > {
    const doc = await this.read()
    const node = doc.nodes.find(candidate => candidate.id === id)
    if (node !== undefined) {
      return {
        kind: 'node',
        node,
        inbound: doc.edges.filter(edge => edge.to === id),
        outbound: doc.edges.filter(edge => edge.from === id),
        members: node.kind === 'group' ? doc.nodes.filter(candidate => candidate.parent === id) : [],
      }
    }
    const edge = doc.edges.find(candidate => candidate.id === id)
    if (edge !== undefined) return { kind: 'edge', edge }
    throw new Error(`canvas element "${id}" not found`)
  }

  /** 分组一览：每个 group 带成员（id/kind/label/shotIndex）。 */
  async listGroups(): Promise<Array<{
    id: string
    label: string
    shotStatus: string | null
    members: Array<{ id: string; kind: CanvasNodeKind; label: string; shotIndex: number | null }>
  }>> {
    const doc = await this.read()
    return doc.nodes.filter(node => node.kind === 'group').map(group => ({
      id: group.id,
      label: group.label,
      shotStatus: group.shotStatus ?? null,
      members: doc.nodes
        .filter(node => node.parent === group.id)
        .map(node => ({ id: node.id, kind: node.kind, label: node.label, shotIndex: node.shotIndex ?? null })),
    }))
  }

  /** 把已有节点收进一个新 group（相对坐标保留；组框包住成员）。 */
  async groupNodes(input: { memberIds: string[]; label?: string }): Promise<{ doc: CanvasDocument; groupId: string }> {
    if (input.memberIds.length === 0) throw new Error('group needs at least one member id')
    let groupId = ''
    const doc = await this.mutate(draft => {
      const members: CanvasNode[] = []
      for (const id of input.memberIds) {
        const node = draft.nodes.find(candidate => candidate.id === id)
        if (node === undefined) throw new Error(`canvas node "${id}" not found`)
        if (node.kind === 'group') throw new Error(`cannot put group "${id}" inside a new group`)
        members.push(node)
      }
      const minX = Math.min(...members.map(node => node.x))
      const minY = Math.min(...members.map(node => node.y))
      const maxX = Math.max(...members.map(node => node.x + (node.width ?? 240)))
      const maxY = Math.max(...members.map(node => node.y + (node.height ?? 160)))
      const group = sanitizeNode({
        kind: 'group',
        label: input.label ?? '组',
        x: minX - 40,
        y: minY - 48,
        width: Math.max(320, maxX - minX + 80),
        height: Math.max(240, maxY - minY + 96),
      })
      groupId = group.id
      draft.nodes.push(group)
      for (const member of members) member.parent = groupId
    })
    return { doc, groupId }
  }

  /** 按端点删一条边（不用先查 edge id）。 */
  async disconnect(from: string, to: string): Promise<CanvasDocument> {
    return this.mutate(doc => {
      const next = doc.edges.filter(edge => !(edge.from === from && edge.to === to))
      if (next.length === doc.edges.length) throw new Error(`no edge ${from} -> ${to}`)
      doc.edges = next
    })
  }

  /**
   * 编排已有镜头：按传入顺序写入 shotIndex，可选把相邻 image/video 连成承接边。
   */
  async sequenceShots(input: { ids: string[]; connect?: boolean; edgeLabel?: string }): Promise<CanvasDocument> {
    if (input.ids.length === 0) throw new Error('sequence needs at least one node id')
    return this.mutate(doc => {
      const nodes: CanvasNode[] = []
      for (const id of input.ids) {
        const node = doc.nodes.find(candidate => candidate.id === id)
        if (node === undefined) throw new Error(`canvas node "${id}" not found`)
        nodes.push(node)
      }
      nodes.forEach((node, index) => {
        node.shotIndex = index + 1
      })
      if (input.connect !== true) return
      const media = nodes.filter(node => node.kind === 'image' || node.kind === 'video')
      for (let index = 0; index < media.length - 1; index += 1) {
        const fromNode = media[index]
        const toNode = media[index + 1]
        if (!this.canConnect(fromNode, toNode)) continue
        if (doc.edges.some(edge => edge.from === fromNode.id && edge.to === toNode.id)) continue
        const edge = sanitizeEdge({ from: fromNode.id, to: toNode.id, label: input.edgeLabel ?? '承接' })
        this.validateEdgeForDoc(doc, edge)
        doc.edges.push(edge)
      }
    })
  }

  /**
   * 把幕/镜计划一次写入画布：每幕一个 group，每镜一个节点，全局 shotIndex，
   * 相邻媒体镜连承接边。不生成媒体。
   */
  async planBoard(input: {
    title?: string
    acts: Array<{
      label: string
      shots: Array<{
        kind?: CanvasNodeKind
        label: string
        prompt?: string
        seconds?: number
        continuity?: string[]
      }>
    }>
    connect?: boolean
  }): Promise<{
    doc: CanvasDocument
    groups: Array<{ id: string; label: string; shotIds: string[] }>
  }> {
    if (input.acts.length === 0) throw new Error('plan needs at least one act')
    const groups: Array<{ id: string; label: string; shotIds: string[] }> = []
    const doc = await this.mutate(draft => {
      if (input.title !== undefined && input.title.trim() !== '') draft.title = input.title.trim().slice(0, 200)
      let shotNumber = draft.nodes.reduce((max, node) => Math.max(max, node.shotIndex ?? 0), 0)
      const mediaIds: string[] = []
      input.acts.forEach((act, actIndex) => {
        if (act.shots.length === 0) throw new Error(`act "${act.label}" has no shots`)
        const group = sanitizeNode({
          kind: 'group',
          label: act.label,
          x: 48,
          y: 48 + actIndex * (SHOT_CARD_H + GROUP_PAD_Y + 32 + ACT_GAP),
          width: GROUP_PAD_X * 2 + Math.max(1, act.shots.length) * SHOT_CARD_W + (Math.max(1, act.shots.length) - 1) * SHOT_GAP,
          height: GROUP_PAD_Y + SHOT_CARD_H + 32,
        })
        draft.nodes.push(group)
        const shotIds: string[] = []
        act.shots.forEach((shot, shotIndex) => {
          shotNumber += 1
          const kind = shot.kind === 'image' || shot.kind === 'video' || shot.kind === 'text' || shot.kind === 'group'
            ? shot.kind
            : 'video'
          if (kind === 'group') throw new Error(`shot "${shot.label}" cannot be kind=group; use an act`)
          const seconds = typeof shot.seconds === 'number' && Number.isFinite(shot.seconds) && shot.seconds > 0
            ? Math.min(30, Math.round(shot.seconds))
            : undefined
          const basePrompt = (shot.prompt ?? '').trim()
          const prompt = seconds === undefined
            ? (basePrompt === '' ? undefined : basePrompt)
            : (basePrompt === '' ? `${seconds}s` : `${basePrompt}, ${seconds}s`)
          const node = sanitizeNode({
            kind,
            label: shot.label,
            parent: group.id,
            x: group.x + GROUP_PAD_X + shotIndex * (SHOT_CARD_W + SHOT_GAP),
            y: group.y + GROUP_PAD_Y,
            width: SHOT_CARD_W,
            height: kind === 'text' ? 120 : SHOT_CARD_H,
            shotIndex: shotNumber,
            shotStatus: 'idea',
            ...(prompt !== undefined ? { prompt } : {}),
            ...(shot.continuity !== undefined && shot.continuity.length > 0 ? { continuityRules: shot.continuity } : {}),
          })
          draft.nodes.push(node)
          shotIds.push(node.id)
          if (kind === 'image' || kind === 'video') mediaIds.push(node.id)
        })
        groups.push({ id: group.id, label: act.label, shotIds })
      })
      if (input.connect === false) return
      const byId = new Map(draft.nodes.map(node => [node.id, node]))
      for (let index = 0; index < mediaIds.length - 1; index += 1) {
        const fromNode = byId.get(mediaIds[index])
        const toNode = byId.get(mediaIds[index + 1])
        if (fromNode === undefined || toNode === undefined || !this.canConnect(fromNode, toNode)) continue
        const edge = sanitizeEdge({ from: fromNode.id, to: toNode.id, label: '承接' })
        this.validateEdgeForDoc(draft, edge)
        draft.edges.push(edge)
      }
    })
    return { doc, groups }
  }
}
