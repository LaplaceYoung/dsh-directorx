/** Generate-workstation spec shared by the node dock and the empty-canvas dock. */

export const FRAME_ASPECTS = [
  { id: '16:9', w: 16, h: 9 },
  { id: '9:16', w: 9, h: 16 },
  { id: '1:1', w: 1, h: 1 },
  { id: '4:3', w: 4, h: 3 },
  { id: '3:4', w: 3, h: 4 },
  { id: '3:2', w: 3, h: 2 },
  { id: '2:3', w: 2, h: 3 },
  { id: '21:9', w: 21, h: 9 },
] as const

export type FrameAspect = typeof FRAME_ASPECTS[number]['id']

export const IMAGE_MODELS = [
  { id: 'doubao-seedream-4.5', label: 'Seedream 4.5' },
  { id: 'gpt-image-2', label: 'GPT Image 2' },
  { id: 'wan2.7-image', label: 'Wan 2.7' },
  { id: 'Qwen/Qwen-Image', label: 'Qwen Image' },
] as const

export const VIDEO_MODELS = [
  { id: 'MiniMax-H3', label: 'MiniMax H3' },
  { id: 'kling-v3', label: 'Kling 3' },
  { id: 'wan2.7-i2v', label: 'Wan I2V' },
  { id: 'viduq3-pro', label: 'Vidu Q3' },
] as const

export const VIDEO_DURATIONS = [4, 5, 6, 8, 10] as const

export interface GenerateSpec {
  kind: 'image' | 'video'
  prompt: string
  model?: string
  aspect?: string
  count?: number
  durationSec?: number
  sourceId?: string
  targetId?: string
  refIds?: string[]
  characters?: string[]
  revise?: boolean
}

export function aspectRatio(aspect?: string): number {
  const found = FRAME_ASPECTS.find(item => item.id === aspect)
  return found === undefined ? 16 / 9 : found.w / found.h
}

export function sizeFromAspect(aspect: string | undefined, width: number): { width: number; height: number } {
  const ratio = aspectRatio(aspect)
  if (ratio < 1) {
    const height = Math.max(240, Math.min(380, Math.round(width * 0.95)))
    return { width: Math.max(160, Math.round(height * ratio)), height }
  }
  const height = Math.max(140, Math.min(380, Math.round(width / ratio)))
  return { width, height }
}

export function specPrompt(spec: GenerateSpec): string {
  const extras: string[] = []
  if (spec.model !== undefined && spec.model !== '') extras.push(`模型: ${spec.model}`)
  if (spec.aspect !== undefined && spec.aspect !== '') extras.push(`画幅: ${spec.aspect}`)
  if (spec.count !== undefined && spec.count > 1) extras.push(`次数: ${spec.count}`)
  if (spec.kind === 'video' && spec.durationSec !== undefined) extras.push(`时长: ${spec.durationSec}s`)
  if (spec.refIds !== undefined && spec.refIds.length > 0) extras.push(`参考节点: ${spec.refIds.join(', ')}`)
  if (spec.characters !== undefined && spec.characters.length > 0) extras.push(`角色: ${spec.characters.join(', ')}`)
  return extras.length === 0 ? spec.prompt.trim() : `${spec.prompt.trim()}\n${extras.join('\n')}`
}

export function modelsFor(kind: 'image' | 'video'): ReadonlyArray<{ id: string; label: string }> {
  return kind === 'video' ? VIDEO_MODELS : IMAGE_MODELS
}

export function nearestAspect(width: number, height: number): FrameAspect {
  if (width <= 0 || height <= 0) return '16:9'
  const ratio = width / height
  let best: FrameAspect = '16:9'
  let delta = Number.POSITIVE_INFINITY
  for (const item of FRAME_ASPECTS) {
    const gap = Math.abs(ratio - item.w / item.h)
    if (gap < delta) {
      delta = gap
      best = item.id
    }
  }
  return best
}

export function incomingRefIds(nodeId: string, edges: Array<{ source: string; target: string }>): string[] {
  return [...new Set(edges.filter(edge => edge.target === nodeId).map(edge => edge.source))].slice(0, 8)
}

export function takePeers(
  self: { id: string; parentId?: string; prompt?: string },
  nodes: Array<{ id: string; parentId?: string; type?: string; prompt?: string }>,
  edges: Array<{ source: string; target: string }>,
): string[] {
  const media = (node: { type?: string }) => node.type === 'media' || node.type === undefined
  const group = self.parentId !== undefined && self.parentId !== ''
    ? nodes.filter(node => node.parentId === self.parentId && media(node))
    : []
  const sources = new Set(edges.filter(edge => edge.target === self.id).map(edge => edge.source))
  const siblings = sources.size === 0
    ? []
    : nodes.filter(node => node.id !== self.id && media(node) && edges.some(edge => edge.target === node.id && sources.has(edge.source)))
  const prompt = (self.prompt ?? '').trim()
  const samePrompt = prompt === ''
    ? []
    : nodes.filter(node => node.id !== self.id && media(node) && (node.prompt ?? '').trim() === prompt)
  const seen = new Set<string>([self.id])
  const ids: string[] = []
  for (const item of [...group, ...siblings, ...samePrompt]) {
    if (seen.has(item.id)) continue
    seen.add(item.id)
    ids.push(item.id)
  }
  return ids.slice(0, 8)
}

export function libraryBucket(file: { name: string; path: string }): 'scene' | 'media' {
  return /场景|scene|set|bg|background|环境|空镜/i.test(`${file.name} ${file.path}`) ? 'scene' : 'media'
}

export function characterBucket(card: { props?: string; description?: string; outfit?: string }): 'prop' | 'scene' | 'character' {
  if (card.props !== undefined && card.props !== '') return 'prop'
  if (/场景|scene|set|环境|空镜/i.test(`${card.description ?? ''} ${card.outfit ?? ''}`)) return 'scene'
  return 'character'
}
