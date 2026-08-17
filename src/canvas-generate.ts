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

export function sideToHandle(side: PortSide): string {
  if (side === 'left') return 'in'
  if (side === 'right') return 'out'
  return side
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

function gapAfter(start: number, end: number, otherStart: number, otherEnd: number): number | undefined {
  if (otherStart >= end) return otherStart - end
  if (start >= otherEnd) return start - otherEnd
  return undefined
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
  const gapX = gapAfter(source.x, source.x + source.width, target.x, target.x + target.width)
  const gapY = gapAfter(source.y, source.y + source.height, target.y, target.y + target.height)
  const horizontal = gapX !== undefined && gapY !== undefined
    ? gapX <= gapY
    : gapX !== undefined
      ? true
      : gapY !== undefined
        ? false
        : Math.abs(dx) >= Math.abs(dy)
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

/** Draw with facing sides unless the user explicitly picked top/bottom. */
export function routeDisplayPorts(
  source: FlowPoint & { width: number; height: number },
  target: FlowPoint & { width: number; height: number },
  sourceHandle?: string | null,
  targetHandle?: string | null,
): ReturnType<typeof closestPorts> {
  const sourceSide = handleToSide(sourceHandle)
  const targetSide = handleToSide(targetHandle)
  const explicit = sourceSide === 'top' || sourceSide === 'bottom' || targetSide === 'top' || targetSide === 'bottom'
  if (explicit) return portsForHandles(source, target, sourceHandle, targetHandle)
  return closestPorts(source, target)
}

export interface StackableNode {
  id: string
  kind: string
  parent?: string
  x: number
  y: number
  width?: number
  height?: number
  shotIndex?: number
}

const TITLE_CLEAR = 34
const STACK_GAP = 18
const GROUP_INSET_X = 28
const GROUP_INSET_TOP = 52
const GROUP_INSET_BOT = 24

function fallbackCardSize(kind: string): { width: number; height: number } {
  if (kind === 'group') return { width: 640, height: 460 }
  if (kind === 'text') return { width: 250, height: 180 }
  return { width: 400, height: 220 }
}

function stackBox(node: StackableNode): { x: number; y: number; width: number; height: number } {
  const size = fallbackCardSize(node.kind)
  return {
    x: node.x,
    y: node.y,
    width: node.width ?? size.width,
    height: node.height ?? size.height,
  }
}

function boxesOverlap(
  left: { x: number; y: number; width: number; height: number },
  right: { x: number; y: number; width: number; height: number },
): boolean {
  return left.x < right.x + right.width
    && left.x + left.width > right.x
    && left.y < right.y + right.height
    && left.y + left.height > right.y
}

/** Restack group children that overlap or spill out of the act frame. */
export function tidyOverlappingGroups<T extends StackableNode>(nodes: T[]): T[] {
  const next = nodes.map(node => ({ ...node }))
  for (const group of next.filter(node => node.kind === 'group')) {
    const members = next.filter(node => node.parent === group.id)
    if (members.length === 0) continue
    const boxes = members.map(stackBox)
    const frame = stackBox(group)
    const overflow = boxes.some(box =>
      box.x < frame.x - 1
      || box.y < frame.y - 1
      || box.x + box.width > frame.x + frame.width + 1
      || box.y + box.height > frame.y + frame.height + 1
    )
    const collide = boxes.some((box, index) => boxes.some((other, otherIndex) => {
      if (otherIndex <= index) return false
      return boxesOverlap(
        { ...box, y: box.y - TITLE_CLEAR, height: box.height + TITLE_CLEAR },
        { ...other, y: other.y - TITLE_CLEAR, height: other.height + TITLE_CLEAR },
      )
    }))
    if (!overflow && !collide) continue
    members.sort((left, right) => (left.shotIndex ?? 1e9) - (right.shotIndex ?? 1e9) || left.y - right.y || left.x - right.x)
    const cardWidth = Math.max(...members.map(member => stackBox(member).width))
    let cursor = group.y + GROUP_INSET_TOP
    const left = group.x + GROUP_INSET_X
    for (const member of members) {
      const size = stackBox(member)
      member.x = left
      member.y = cursor
      cursor += size.height + TITLE_CLEAR + STACK_GAP
    }
    group.width = Math.max(frame.width, GROUP_INSET_X * 2 + cardWidth)
    group.height = Math.max(frame.height, cursor - group.y - STACK_GAP + GROUP_INSET_BOT)
  }
  return next
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
