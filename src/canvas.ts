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
}

export interface CanvasEdge {
  id: string
  from: string
  to: string
  label?: string
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
      if (!doc.edges.some(existing => existing.id === edge.id)) doc.edges.push(edge)
    })
  }

  async update(id: string, patch: Record<string, unknown>): Promise<CanvasDocument> {
    return this.mutate(doc => {
      const nodeIndex = doc.nodes.findIndex(node => node.id === id)
      if (nodeIndex >= 0) {
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
      for (const edge of (input.edges ?? [])) {
        doc.edges.push(sanitizeEdge({ id: newId('edge'), ...edge }))
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
