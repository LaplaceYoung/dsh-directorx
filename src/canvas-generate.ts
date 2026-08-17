/**
 * Shared continue-generate planner for the DirectorX canvas.
 * Used by the durable store (tests / agent tools) and the WebUI so the
 * placeholder node, wire, and proposal payload stay the same shape.
 */

export type ContinueGenerateKind = 'image' | 'video'

export interface ContinueGenerateSource {
  id: string
  x: number
  y: number
  width?: number
  kind?: string
}

export interface ContinueGeneratePlan {
  node: {
    kind: ContinueGenerateKind
    label: string
    prompt: string
    shotStatus: 'generating'
    x: number
    y: number
    width: number
    height: number
    path?: string
  }
  edgeFrom?: string
  proposal: {
    kind: ContinueGenerateKind
    prompt: string
    count: 1
    note?: string
  }
}

const PLACEHOLDER_WIDTH = 220
const PLACEHOLDER_HEIGHT = 188
const DOWNSTREAM_GAP = 80

export function inferContinueKind(sourceKind?: string): ContinueGenerateKind {
  return sourceKind === 'image' || sourceKind === 'video' ? 'video' : 'image'
}

export interface FlowPoint { x: number; y: number }

export interface FlowLocated {
  id: string
  position: FlowPoint
  parentId?: string
}

/** Walk parentId so grouped children resolve to flow-space (viewport) coordinates. */
export function flowAbsolutePosition(node: FlowLocated, byId: Map<string, FlowLocated>, seen = new Set<string>()): FlowPoint {
  if (node.parentId === undefined || node.parentId === '' || seen.has(node.id)) {
    return { x: node.position.x, y: node.position.y }
  }
  seen.add(node.id)
  const parent = byId.get(node.parentId)
  if (parent === undefined) return { x: node.position.x, y: node.position.y }
  const origin = flowAbsolutePosition(parent, byId, seen)
  return { x: origin.x + node.position.x, y: origin.y + node.position.y }
}

/** Right-center → left-center handles in the same space as the node boxes. */
export function edgeHandlePoints(
  source: FlowPoint & { width: number; height: number },
  target: FlowPoint & { width: number; height: number },
): { sourceX: number; sourceY: number; targetX: number; targetY: number } {
  return {
    sourceX: source.x + source.width,
    sourceY: source.y + source.height / 2,
    targetX: target.x,
    targetY: target.y + target.height / 2,
  }
}

export type PortSide = 'left' | 'right' | 'top' | 'bottom'

export function portPoint(
  box: FlowPoint & { width: number; height: number },
  side: PortSide,
): FlowPoint {
  if (side === 'left') return { x: box.x, y: box.y + box.height / 2 }
  if (side === 'right') return { x: box.x + box.width, y: box.y + box.height / 2 }
  if (side === 'top') return { x: box.x + box.width / 2, y: box.y }
  return { x: box.x + box.width / 2, y: box.y + box.height }
}

/**
 * Pick facing sides so a wire leaves the source toward the target and
 * lands on the opposite face, instead of always using right → left.
 */
export function handleToSide(handle?: string | null): PortSide | undefined {
  if (handle === 'in') return 'left'
  if (handle === 'out') return 'right'
  if (handle === 'top') return 'top'
  if (handle === 'bottom') return 'bottom'
  return undefined
}

export function portsForHandles(
  source: FlowPoint & { width: number; height: number },
  target: FlowPoint & { width: number; height: number },
  sourceHandle?: string | null,
  targetHandle?: string | null,
): ReturnType<typeof closestPorts> {
  const fallback = closestPorts(source, target)
  const sourceSide = handleToSide(sourceHandle) ?? fallback.sourceSide
  const targetSide = handleToSide(targetHandle) ?? fallback.targetSide
  const from = portPoint(source, sourceSide)
  const to = portPoint(target, targetSide)
  return { sourceSide, targetSide, sourceX: from.x, sourceY: from.y, targetX: to.x, targetY: to.y }
}

export function closestPorts(
  source: FlowPoint & { width: number; height: number },
  target: FlowPoint & { width: number; height: number },
): {
  sourceSide: PortSide
  targetSide: PortSide
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
} {
  const dx = target.x + target.width / 2 - (source.x + source.width / 2)
  const dy = target.y + target.height / 2 - (source.y + source.height / 2)
  const horizontal = Math.abs(dx) >= Math.abs(dy)
  const sourceSide: PortSide = horizontal ? (dx >= 0 ? 'right' : 'left') : (dy >= 0 ? 'bottom' : 'top')
  const targetSide: PortSide = horizontal ? (dx >= 0 ? 'left' : 'right') : (dy >= 0 ? 'top' : 'bottom')
  const from = portPoint(source, sourceSide)
  const to = portPoint(target, targetSide)
  return {
    sourceSide,
    targetSide,
    sourceX: from.x,
    sourceY: from.y,
    targetX: to.x,
    targetY: to.y,
  }
}

export function hitTestAbsolute(
  flowPos: FlowPoint,
  boxes: Array<{ id: string; x: number; y: number; width: number; height: number }>,
): string | undefined {
  return boxes.find(box =>
    flowPos.x >= box.x && flowPos.x <= box.x + box.width
    && flowPos.y >= box.y && flowPos.y <= box.y + box.height
  )?.id
}

/** Plan a downstream generation placeholder. Empty prompt is rejected. */
export function planContinueGenerate(input: {
  source?: ContinueGenerateSource
  kind?: ContinueGenerateKind
  prompt: string
}): ContinueGeneratePlan {
  const prompt = input.prompt.trim()
  if (prompt === '') throw new Error('prompt 不能为空')
  const kind = input.kind ?? inferContinueKind(input.source?.kind)
  const x = input.source !== undefined ? input.source.x + (input.source.width ?? PLACEHOLDER_WIDTH) + DOWNSTREAM_GAP : 80
  const y = input.source !== undefined ? input.source.y : 80
  return {
    node: {
      kind,
      label: prompt.slice(0, 48),
      prompt,
      shotStatus: 'generating',
      x,
      y,
      width: PLACEHOLDER_WIDTH,
      height: PLACEHOLDER_HEIGHT,
    },
    ...(input.source !== undefined ? { edgeFrom: input.source.id } : {}),
    proposal: {
      kind,
      prompt,
      count: 1,
      ...(input.source !== undefined ? { note: `from:${input.source.id}` } : {}),
    },
  }
}

/** UI path: resolve a (possibly grouped) flow node, then plan the placeholder. */
export function planContinueFromFlowNode(input: {
  source?: FlowLocated & { width?: number; kind?: string }
  nodes: FlowLocated[]
  kind?: ContinueGenerateKind
  prompt: string
}): ContinueGeneratePlan {
  const byId = new Map(input.nodes.map(node => [node.id, node]))
  const abs = input.source !== undefined ? flowAbsolutePosition(input.source, byId) : undefined
  return planContinueGenerate({
    ...(input.source !== undefined && abs !== undefined
      ? { source: { id: input.source.id, x: abs.x, y: abs.y, width: input.source.width, kind: input.source.kind } }
      : {}),
    ...(input.kind !== undefined ? { kind: input.kind } : {}),
    prompt: input.prompt,
  })
}
