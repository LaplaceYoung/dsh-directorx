/** Pure geometry and clipboard helpers for the canvas stage. */

export type AlignKind = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'

export const SNAP_GRID = 16
export const GROUP_PAD = { x: 28, top: 48, bottom: 24 } as const

export interface LayoutBox {
  id: string
  x: number
  y: number
  w: number
  h: number
}

export interface ClipNode {
  type?: string
  kind?: string
  label: string
  path?: string
  prompt?: string
  shotStatus?: string
  width?: number
  height?: number
  x: number
  y: number
  parent?: number
}

export interface ClipPayload {
  mark: 'directorx-canvas-clip'
  nodes: ClipNode[]
  edges: Array<{ from: number; to: number; label?: string }>
}

export const CLIP_MARK = 'directorx-canvas-clip' as const

/** Padding and zoom for centering a double-clicked node in the viewport. */
export function focusViewOptions(kind: 'group' | 'card'): {
  padding: number
  duration: number
  maxZoom: number
  minZoom: number
} {
  if (kind === 'group') {
    return { padding: 0.16, duration: 280, maxZoom: 0.95, minZoom: 0.18 }
  }
  return { padding: 0.38, duration: 280, maxZoom: 1.2, minZoom: 0.22 }
}

export function alignBoxes(boxes: LayoutBox[], kind: AlignKind): Array<{ id: string; x: number; y: number }> {
  if (boxes.length === 0) return []
  const minX = Math.min(...boxes.map(box => box.x))
  const maxX = Math.max(...boxes.map(box => box.x + box.w))
  const minY = Math.min(...boxes.map(box => box.y))
  const maxY = Math.max(...boxes.map(box => box.y + box.h))
  const midX = (minX + maxX) / 2
  const midY = (minY + maxY) / 2
  return boxes.map(box => {
    if (kind === 'left') return { id: box.id, x: minX, y: box.y }
    if (kind === 'right') return { id: box.id, x: maxX - box.w, y: box.y }
    if (kind === 'center') return { id: box.id, x: midX - box.w / 2, y: box.y }
    if (kind === 'top') return { id: box.id, x: box.x, y: minY }
    if (kind === 'bottom') return { id: box.id, x: box.x, y: maxY - box.h }
    return { id: box.id, x: box.x, y: midY - box.h / 2 }
  })
}

export function distributeBoxes(boxes: LayoutBox[], axis: 'x' | 'y'): Array<{ id: string; x: number; y: number }> {
  if (boxes.length < 3) return boxes.map(box => ({ id: box.id, x: box.x, y: box.y }))
  const sorted = [...boxes].sort((left, right) => axis === 'x' ? left.x - right.x : left.y - right.y)
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  const span = axis === 'x' ? last.x + last.w - first.x : last.y + last.h - first.y
  const total = sorted.reduce((sum, box) => sum + (axis === 'x' ? box.w : box.h), 0)
  const gap = (span - total) / (sorted.length - 1)
  let cursor = axis === 'x' ? first.x : first.y
  return sorted.map(box => {
    const next = axis === 'x' ? { id: box.id, x: cursor, y: box.y } : { id: box.id, x: box.x, y: cursor }
    cursor += (axis === 'x' ? box.w : box.h) + gap
    return next
  })
}

export function nudgeBoxes(boxes: LayoutBox[], dx: number, dy: number): Array<{ id: string; x: number; y: number }> {
  return boxes.map(box => ({ id: box.id, x: box.x + dx, y: box.y + dy }))
}

export function snapCoord(value: number, grid = SNAP_GRID): number {
  if (grid <= 0) return value
  return Math.round(value / grid) * grid
}

export function nudgeStep(snap: boolean, coarse: boolean): number {
  if (snap) return coarse ? SNAP_GRID * 2 : SNAP_GRID
  return coarse ? SNAP_GRID : SNAP_GRID / 2
}

/** Bounds for a new group that leaves room for the act header. */
export function groupFrame(members: LayoutBox[]): { x: number; y: number; w: number; h: number } {
  if (members.length === 0) return { x: 0, y: 0, w: 280, h: 200 }
  const minX = Math.min(...members.map(box => box.x))
  const minY = Math.min(...members.map(box => box.y))
  const maxX = Math.max(...members.map(box => box.x + box.w))
  const maxY = Math.max(...members.map(box => box.y + box.h))
  return {
    x: minX - GROUP_PAD.x,
    y: minY - GROUP_PAD.top,
    w: Math.max(280, maxX - minX + GROUP_PAD.x * 2),
    h: Math.max(200, maxY - minY + GROUP_PAD.top + GROUP_PAD.bottom),
  }
}

/** Storyboard reading order: shotIndex, then row (y), then column (x). */
export function readingOrder<T extends { id: string; x: number; y: number; shotIndex?: number }>(nodes: T[]): T[] {
  return [...nodes].sort((left, right) => {
    const leftShot = left.shotIndex
    const rightShot = right.shotIndex
    if (leftShot !== undefined && rightShot !== undefined && leftShot !== rightShot) return leftShot - rightShot
    if (Math.abs(left.y - right.y) > 48) return left.y - right.y
    if (left.x !== right.x) return left.x - right.x
    return left.id.localeCompare(right.id)
  })
}

export function packClip(
  nodes: Array<{
    id: string
    type?: string
    position: { x: number; y: number }
    style?: { width?: number | string; height?: number | string }
    parentId?: string
    data: { kind?: string; label: string; path?: string; prompt?: string; shotStatus?: string }
  }>,
  edges: Array<{ source: string; target: string; label?: unknown }>,
): ClipPayload | undefined {
  if (nodes.length === 0) return undefined
  const ids = new Set(nodes.map(node => node.id))
  const indexOf = new Map(nodes.map((node, index) => [node.id, index]))
  const minX = Math.min(...nodes.map(node => node.position.x))
  const minY = Math.min(...nodes.map(node => node.position.y))
  return {
    mark: CLIP_MARK,
    nodes: nodes.map(node => {
      const width = typeof node.style?.width === 'number' ? node.style.width : undefined
      const height = typeof node.style?.height === 'number' ? node.style.height : undefined
      const parent = node.parentId !== undefined && node.parentId !== '' ? indexOf.get(node.parentId) : undefined
      return {
        ...(node.type !== undefined ? { type: node.type } : {}),
        ...(node.data.kind !== undefined ? { kind: node.data.kind } : {}),
        label: node.data.label,
        ...(node.data.path !== undefined && node.data.path !== '' ? { path: node.data.path } : {}),
        ...(node.data.prompt !== undefined ? { prompt: node.data.prompt } : {}),
        ...(node.data.shotStatus !== undefined ? { shotStatus: node.data.shotStatus } : {}),
        ...(width !== undefined ? { width } : {}),
        ...(height !== undefined ? { height } : {}),
        x: node.position.x - minX,
        y: node.position.y - minY,
        ...(parent !== undefined ? { parent } : {}),
      }
    }),
    edges: edges
      .filter(edge => ids.has(edge.source) && ids.has(edge.target))
      .map(edge => ({
        from: indexOf.get(edge.source) ?? 0,
        to: indexOf.get(edge.target) ?? 0,
        ...(typeof edge.label === 'string' && edge.label !== '' ? { label: edge.label } : {}),
      })),
  }
}

export function asClipPayload(value: unknown): ClipPayload | undefined {
  if (value === null || typeof value !== 'object') return undefined
  const rec = value as Record<string, unknown>
  if (rec.mark !== CLIP_MARK || !Array.isArray(rec.nodes)) return undefined
  const nodes: ClipNode[] = []
  for (const item of rec.nodes) {
    if (item === null || typeof item !== 'object') continue
    const node = item as Record<string, unknown>
    if (typeof node.label !== 'string' || typeof node.x !== 'number' || typeof node.y !== 'number') continue
    nodes.push({
      ...(typeof node.type === 'string' ? { type: node.type } : {}),
      ...(typeof node.kind === 'string' ? { kind: node.kind } : {}),
      label: node.label,
      ...(typeof node.path === 'string' ? { path: node.path } : {}),
      ...(typeof node.prompt === 'string' ? { prompt: node.prompt } : {}),
      ...(typeof node.shotStatus === 'string' ? { shotStatus: node.shotStatus } : {}),
      ...(typeof node.width === 'number' ? { width: node.width } : {}),
      ...(typeof node.height === 'number' ? { height: node.height } : {}),
      x: node.x,
      y: node.y,
      ...(typeof node.parent === 'number' ? { parent: node.parent } : {}),
    })
  }
  if (nodes.length === 0) return undefined
  const edges = Array.isArray(rec.edges)
    ? rec.edges.flatMap(item => {
      if (item === null || typeof item !== 'object') return []
      const edge = item as Record<string, unknown>
      if (typeof edge.from !== 'number' || typeof edge.to !== 'number') return []
      return [{
        from: edge.from,
        to: edge.to,
        ...(typeof edge.label === 'string' ? { label: edge.label } : {}),
      }]
    })
    : []
  return { mark: CLIP_MARK, nodes, edges }
}

export function clampMenu(x: number, y: number, width: number, height: number, view = { w: 1200, h: 800 }): { left: number; top: number } {
  return {
    left: Math.max(12, Math.min(x, view.w - width - 12)),
    top: Math.max(12, Math.min(y, view.h - height - 12)),
  }
}
