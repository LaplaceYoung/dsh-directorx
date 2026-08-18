import { canvasEdgeAllowed, DirectorxCanvasStore, type CanvasDocument, type CanvasNode } from './canvas.ts'
import { CharacterStore } from './characters.ts'
import { overlapScore, textTokens } from './text-tokens.ts'

/**
 * Wire existing canvas cards by character names and token overlap.
 * Does not create nodes or generate media. Video still cannot feed image.
 */

export interface AutolinkHit {
  from: string
  to: string
  label: string
  score: number
}

const MIN_OVERLAP = 3
const MAX_EDGES = 40

function blobOf(node: CanvasNode): string {
  return [node.label, node.prompt ?? '', node.aiBrief ?? '', ...(node.characters ?? [])].join('\n')
}

function mentions(text: string, name: string): boolean {
  const needle = name.trim()
  if (needle.length < 2) return false
  return text.includes(needle)
}

export function planAutolink(
  doc: CanvasDocument,
  options: {
    characters?: Array<{ name: string; refPath?: string }>
    nodeIds?: string[]
  } = {},
): AutolinkHit[] {
  const allow = options.nodeIds !== undefined && options.nodeIds.length > 0
    ? new Set(options.nodeIds)
    : undefined
  const touches = (from: CanvasNode, to: CanvasNode): boolean => allow === undefined || allow.has(from.id) || allow.has(to.id)
  const pool = doc.nodes
  const byId = new Map(doc.nodes.map(node => [node.id, node]))
  const existing = new Set(doc.edges.map(edge => `${edge.from}->${edge.to}`))
  const hits: AutolinkHit[] = []
  const push = (from: CanvasNode, to: CanvasNode, label: string, score: number): void => {
    if (from.id === to.id) return
    if (!touches(from, to)) return
    if (!canvasEdgeAllowed(from, to)) return
    if (existing.has(`${from.id}->${to.id}`)) return
    if (hits.some(hit => hit.from === from.id && hit.to === to.id)) return
    hits.push({ from: from.id, to: to.id, label, score })
  }

  for (const card of options.characters ?? []) {
    const name = card.name.trim()
    if (name.length < 2) continue
    const anchors = pool.filter(node => {
      if (node.kind !== 'image') return false
      if (card.refPath !== undefined && card.refPath !== '' && node.path === card.refPath) return true
      return node.label.includes(name) || (node.characters ?? []).includes(name)
    })
    if (anchors.length === 0) continue
    for (const target of pool) {
      if (target.kind !== 'image' && target.kind !== 'video') continue
      if (!mentions(blobOf(target), name) && !(target.characters ?? []).includes(name)) continue
      for (const anchor of anchors) {
        if (anchor.id === target.id) continue
        push(anchor, target, '角色', 8)
      }
    }
  }

  const tokens = new Map(pool.map(node => [node.id, textTokens(blobOf(node))]))
  for (const from of pool) {
    if (from.kind === 'group') continue
    for (const to of pool) {
      if (from.id === to.id) continue
      if (to.kind !== 'image' && to.kind !== 'video') continue
      if (from.kind === 'video' && to.kind === 'image') continue
      const score = overlapScore(tokens.get(from.id) ?? new Set(), tokens.get(to.id) ?? new Set())
      if (score < MIN_OVERLAP) continue
      const label = from.kind === 'text' ? '本' : from.kind === 'image' ? '参考' : '引用'
      push(from, to, label, score)
    }
  }

  hits.sort((left, right) => right.score - left.score)
  return hits.slice(0, MAX_EDGES).filter(hit => {
    const from = byId.get(hit.from)
    const to = byId.get(hit.to)
    return from !== undefined && to !== undefined && canvasEdgeAllowed(from, to)
  })
}

export async function applyAutolink(input: {
  store: DirectorxCanvasStore
  outputDir: string
  nodeIds?: string[]
}): Promise<{
  action: 'autolink'
  added: AutolinkHit[]
  skipped: number
  doc: CanvasDocument
}> {
  const doc = await input.store.read()
  const characters = await new CharacterStore(input.outputDir).list()
  const planned = planAutolink(doc, {
    characters,
    ...(input.nodeIds !== undefined ? { nodeIds: input.nodeIds } : {}),
  })
  if (planned.length === 0) {
    return { action: 'autolink', added: [], skipped: 0, doc }
  }
  const next = await input.store.batchAdd({
    nodes: [],
    edges: planned.map(hit => ({ from: hit.from, to: hit.to, label: hit.label })),
  })
  const added = planned.filter(hit => next.edges.some(edge => edge.from === hit.from && edge.to === hit.to))
  return { action: 'autolink', added, skipped: planned.length - added.length, doc: next }
}
