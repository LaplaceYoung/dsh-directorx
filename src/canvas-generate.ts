/**
 * Shared continue-generate planner for the Tapflow canvas.
 * Used by the durable store (tests / agent tools) and the WebUI tab so the
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
