import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

/**
 * Durable canvas document shared between the WebUI infinite canvas and the
 * agent's canvas tools. Stored as `<outputDir>/canvas.json`; writes carry an
 * optimistic-concurrency guard (expectedUpdatedAt) so a stale WebUI save
 * cannot clobber a newer agent edit.
 */

export type CanvasNodeKind = 'image' | 'video' | 'text' | 'group'

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
  shotStatus?: 'idea' | 'approved' | 'generating' | 'review' | 'locked'
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
  /** 变体逐边绑定：多变体源「哪个 variant 喂哪个下游」按边钉住（生成端不保证 output[i]↔input[i] 对齐）。 */
  sourceVariantIdx?: number
}

export interface CanvasDocument {
  version: 1
  updatedAt: number
  /** Optional project title (tapnow-style canvas header). */
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
function sanitizeNode(input: Record<string, unknown>): CanvasNode {
  const kind = input.kind === 'image' || input.kind === 'video' || input.kind === 'text' || input.kind === 'group' ? input.kind : 'text'
  const numberOr = (value: unknown, fallback: number) => typeof value === 'number' && Number.isFinite(value) ? value : fallback
  const rawParent = input.parent
  const node: CanvasNode = {
    id: typeof input.id === 'string' && input.id !== '' ? input.id : newId(kind),
    kind,
    label: typeof input.label === 'string' ? input.label.slice(0,200) : '',
    ...(typeof input.path === 'string' && input.path !== '' ? { path: input.path.slice(0, 1000) } : {}),
    ...(typeof rawParent === 'string' && rawParent !== '' ? { parent: rawParent.slice(0, 100) } : {}),
    x: numberOr(input.x, 0),
    y: numberOr(input.y, 0),
    ...(input.width !== undefined ? { width: Math.max(60, Math.min(1200, numberOr(input.width, 240))) } : {}),
    ...(input.height !== undefined ? { height: Math.max(60, Math.min(1200, numberOr(input.height, 160))) } : {}),
    ...(typeof input.shotIndex === 'number' && Number.isFinite(input.shotIndex) ? { shotIndex: Math.floor(input.shotIndex) } : {}),
    ...(typeof input.prompt === 'string' && input.prompt !== '' ? { prompt: input.prompt.slice(0, 2000) } : {}),
    ...(input.locked === true ? { locked: true } : {}),
    ...(typeof input.aiBrief === 'string' && input.aiBrief !== '' ? { aiBrief: input.aiBrief.slice(0, 500) } : {}),
    ...(typeof input.shotStatus === 'string' && ['idea', 'approved', 'generating', 'review', 'locked'].includes(input.shotStatus) ? { shotStatus: input.shotStatus as CanvasNode['shotStatus'] } : {}),
    ...(typeof input.selectedTakeId === 'string' && input.selectedTakeId !== '' ? { selectedTakeId: input.selectedTakeId.slice(0, 100) } : {}),
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
    ...(typeof input.sourceVariantIdx === 'number' && Number.isFinite(input.sourceVariantIdx) && input.sourceVariantIdx >= 0 ? { sourceVariantIdx: Math.floor(input.sourceVariantIdx) } : {}),
  }
}

export class DirectorxCanvasStore {
  private readonly outputDir: string

  constructor(outputDir: string) {
    this.outputDir = outputDir
  }

  private filePath(): string {
    return join(resolve(process.cwd(), this.outputDir), CANVAS_FILE)
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
        const backup = join(resolve(process.cwd(), this.outputDir), `canvas.json.bak-${Date.now()}`)
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
    const dir = join(resolve(process.cwd(), this.outputDir))
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

  async addNode(input: Record<string, unknown>): Promise<CanvasDocument> {
    return this.mutate(doc => {
      const node = sanitizeNode(input)
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
    if (fromKind !== undefined && toKind !== undefined) {
      if (toKind === 'text' || toKind === 'group') throw new Error(`edge reason: 目标节点是 ${toKind}，不能作为输入依赖（连线只能指向 image/video）`)
      if (fromKind === 'video' && toKind === 'image') throw new Error('edge reason: video 不能喂给 image（视频只能接力到 video）')
      if (fromKind === 'group') throw new Error('edge reason: group 只作容器，不能作为连线源')
    }
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
        const merged = { ...doc.nodes[nodeIndex], ...patch, id } as unknown as Record<string, unknown>
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
      for (const node of (input.nodes ?? [])) {
        doc.nodes.push(sanitizeNode({ id: newId('text'), ...node }))
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

  /** 整理：auto-layout nodes into a tidy grid (or a single row) while keeping all connections. Group children stay inside their group. */
  async arrange(layout: 'grid' | 'row' = 'grid', gap = 40): Promise<CanvasDocument> {
    return this.mutate(doc => {
      const topLevel = doc.nodes.filter(node => node.parent === undefined)
      const columns = layout === 'row' ? topLevel.length : Math.max(1, Math.ceil(Math.sqrt(topLevel.length)))
      topLevel.forEach((node, index) => {
        const width = node.width ?? (node.kind === 'group' ? 520 : 240)
        const height = node.height ?? (node.kind === 'group' ? 380 : 160)
        if (layout === 'row') {
          node.x = index * (width + gap)
          node.y = 0
        } else {
          node.x = (index % columns) * (width + gap)
          node.y = Math.floor(index / columns) * (height + gap)
        }
        node.width = width
        node.height = height
      })
      // Lay each group's children out inside the group frame.
      for (const group of topLevel.filter(node => node.kind === 'group')) {
        const members = doc.nodes.filter(node => node.parent === group.id)
        const frameWidth = group.width ?? 520
        const margin = 46
        const memberColumns = Math.max(1, Math.floor((frameWidth - margin) / 260))
        members.forEach((member, index) => {
          const width = member.width ?? 200
          member.x = group.x + margin + (index % memberColumns) * (width + 20)
          member.y = group.y + margin + Math.floor(index / memberColumns) * 150
        })
      }
    })
  }
}
