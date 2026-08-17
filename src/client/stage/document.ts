import { type Edge, type Node } from '@xyflow/react'
import { displayCardTitle } from '../../card-label.ts'
import { tidyOverlappingGroups } from '../../canvas-generate.ts'
import { sizeFromAspect } from './workstation.ts'

export const MEDIA_W = 400
export const MEDIA_H = 220
export const TEXT_W = 250
export const TEXT_H = 250
export const GROUP_W = 640
export const GROUP_H = 460

export interface CanvasDocNode {
  id: string
  kind: string
  label: string
  path?: string
  parent?: string
  x: number
  y: number
  width?: number
  height?: number
  prompt?: string
  shotIndex?: number
  locked?: boolean
  aiBrief?: string
  shotStatus?: string
  selectedTakeId?: string
  continuityRules?: string[]
  aspect?: string
  model?: string
  durationSec?: number
  lastError?: string
  count?: number
  characters?: string[]
}

export const SHOT_STATUSES = ['idea', 'approved', 'generating', 'review', 'locked', 'failed'] as const
export type ShotStatus = typeof SHOT_STATUSES[number]

export const SHOT_STATUS_LABEL: Record<ShotStatus, string> = {
  idea: '构思',
  approved: '已批',
  generating: '生成中',
  review: '审阅',
  locked: '锁定',
  failed: '失败',
}

export const SHOT_STATUS_COLOR: Record<ShotStatus, string> = {
  idea: '#8a8a8a',
  approved: '#8fdc9f',
  generating: '#f0c36a',
  review: '#9bbcff',
  locked: '#f5f5f5',
  failed: '#ff9b8f',
}

export function cycleShotStatus(current?: string): ShotStatus {
  const index = SHOT_STATUSES.indexOf(current as ShotStatus)
  return SHOT_STATUSES[index < 0 ? 1 : (index + 1) % SHOT_STATUSES.length]
}

export function asShotStatus(value?: string): ShotStatus | undefined {
  return SHOT_STATUSES.includes(value as ShotStatus) ? value as ShotStatus : undefined
}

export interface CanvasDoc {
  version: number
  updatedAt: number
  title?: string
  nodes: CanvasDocNode[]
  edges: Array<{ id: string; from: string; to: string; label?: string; sourceHandle?: string; targetHandle?: string; sourceVariantIdx?: number }>
}

export type StageData = {
  kind?: 'image' | 'video'
  label: string
  path?: string
  prompt?: string
  shotIndex?: number
  locked?: boolean
  shotStatus?: string
  selectedTakeId?: string
  aspect?: string
  model?: string
  durationSec?: number
  lastError?: string
  count?: number
  characters?: string[]
  onGenerate?: (id: string) => void
  onPatch?: (id: string, patch: Partial<StageData>) => void
  onAdoptTake?: (id: string) => void
  onFocusTake?: (id: string) => void
  onEdit?: (id: string) => void
  onRename?: (id: string, label: string) => void
  onCycleStatus?: (id: string) => void
  onDuplicate?: (id: string) => void
  onLock?: (id: string) => void
  onDownload?: (id: string) => void
  onDelete?: (id: string) => void
  onUpload?: (id: string) => void
  onPickRef?: (id: string) => void
}

export type StageNode = Node<StageData>

export function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export function defaultSize(kind: string, aspect?: string): { width: number; height: number } {
  if (kind === 'group') return { width: GROUP_W, height: GROUP_H }
  if (kind === 'image' || kind === 'video' || kind === 'media') {
    return aspect !== undefined && aspect !== '' ? sizeFromAspect(aspect, MEDIA_W) : { width: MEDIA_W, height: MEDIA_H }
  }
  return { width: TEXT_W, height: TEXT_H }
}

export function toFlowNodes(doc: CanvasDoc): StageNode[] {
  const nodes = tidyOverlappingGroups(doc.nodes)
  const byId = new Map(nodes.map(node => [node.id, node]))
  return nodes.map(node => {
    const isMedia = node.kind === 'image' || node.kind === 'video'
    const isGroup = node.kind === 'group'
    const parent = node.parent !== undefined ? byId.get(node.parent) : undefined
    const size = {
      width: node.width ?? defaultSize(node.kind, node.aspect).width,
      height: node.height ?? defaultSize(node.kind, node.aspect).height,
    }
    return {
      id: node.id,
      type: isGroup ? 'group' : isMedia ? 'media' : 'text',
      draggable: node.locked !== true,
      position: parent !== undefined
        ? { x: node.x - parent.x, y: node.y - parent.y }
        : { x: node.x, y: node.y },
      width: size.width,
      height: size.height,
      style: { ...size, overflow: 'visible' },
      ...(parent !== undefined ? { parentId: parent.id, extent: 'parent' as const } : {}),
      data: {
        ...(isMedia ? { kind: node.kind as 'image' | 'video', path: node.path ?? '' } : {}),
        label: node.label,
        ...(node.prompt !== undefined ? { prompt: node.prompt } : {}),
        ...(node.shotIndex !== undefined ? { shotIndex: node.shotIndex } : {}),
        ...(node.locked === true ? { locked: true } : {}),
        ...(node.shotStatus !== undefined ? { shotStatus: node.shotStatus } : {}),
        ...(node.selectedTakeId !== undefined ? { selectedTakeId: node.selectedTakeId } : {}),
        ...(node.aspect !== undefined ? { aspect: node.aspect } : {}),
        ...(node.model !== undefined ? { model: node.model } : {}),
        ...(node.durationSec !== undefined ? { durationSec: node.durationSec } : {}),
        ...(node.lastError !== undefined ? { lastError: node.lastError } : {}),
        ...(node.count !== undefined ? { count: node.count } : {}),
        ...(node.characters !== undefined && node.characters.length > 0 ? { characters: node.characters } : {}),
      },
    }
  })
}

export function toFlowEdges(doc: CanvasDoc): Edge[] {
  const ids = new Set(doc.nodes.map(node => node.id))
  return doc.edges.flatMap(edge => {
    if (!ids.has(edge.from) || !ids.has(edge.to)) return []
    return [{
      id: edge.id,
      source: edge.from,
      target: edge.to,
      type: 'wire',
      ...(typeof edge.sourceHandle === 'string' && edge.sourceHandle !== '' ? { sourceHandle: edge.sourceHandle } : {}),
      ...(typeof edge.targetHandle === 'string' && edge.targetHandle !== '' ? { targetHandle: edge.targetHandle } : {}),
      ...(typeof edge.label === 'string' && edge.label !== '' ? { label: edge.label } : {}),
      ...(edge.sourceVariantIdx !== undefined ? { data: { sourceVariantIdx: edge.sourceVariantIdx } } : {}),
    }]
  })
}

export function fromFlow(nodes: StageNode[], edges: Edge[], title: string, updatedAt: number): CanvasDoc {
  const parentPos = new Map(nodes.map(node => [node.id, node.position]))
  return {
    version: 1,
    updatedAt,
    ...(title !== '' && title !== '未命名画布' ? { title } : {}),
    nodes: nodes.map(node => {
      const absolute = node.parentId !== undefined && node.parentId !== ''
        ? { x: node.position.x + (parentPos.get(node.parentId)?.x ?? 0), y: node.position.y + (parentPos.get(node.parentId)?.y ?? 0) }
        : { x: node.position.x, y: node.position.y }
      const kind = node.type === 'media' ? (node.data.kind ?? 'image') : node.type === 'group' ? 'group' : 'text'
      const width = typeof node.style?.width === 'number' ? node.style.width : undefined
      const height = typeof node.style?.height === 'number' ? node.style.height : undefined
      return {
        id: node.id,
        kind,
        label: displayCardTitle(node.data.label, node.data.prompt, node.data.shotIndex) || node.data.label,
        ...(kind === 'image' || kind === 'video' ? { path: node.data.path ?? '' } : {}),
        ...(node.data.prompt !== undefined ? { prompt: node.data.prompt } : {}),
        ...(node.data.shotIndex !== undefined ? { shotIndex: node.data.shotIndex } : {}),
        ...(node.data.locked === true ? { locked: true } : {}),
        ...(node.data.shotStatus !== undefined ? { shotStatus: node.data.shotStatus } : {}),
        ...(node.data.selectedTakeId !== undefined ? { selectedTakeId: node.data.selectedTakeId } : {}),
        ...(node.data.aspect !== undefined ? { aspect: node.data.aspect } : {}),
        ...(node.data.model !== undefined ? { model: node.data.model } : {}),
        ...(node.data.durationSec !== undefined ? { durationSec: node.data.durationSec } : {}),
        ...(node.data.lastError !== undefined ? { lastError: node.data.lastError } : {}),
        ...(node.data.count !== undefined ? { count: node.data.count } : {}),
        ...(node.data.characters !== undefined && node.data.characters.length > 0 ? { characters: node.data.characters } : {}),
        ...(node.parentId !== undefined && node.parentId !== '' ? { parent: node.parentId } : {}),
        x: absolute.x,
        y: absolute.y,
        ...(width !== undefined ? { width } : {}),
        ...(height !== undefined ? { height } : {}),
      }
    }),
    edges: edges.map(edge => {
      const variantIdx = (edge.data as { sourceVariantIdx?: number } | undefined)?.sourceVariantIdx
      return {
        id: edge.id,
        from: edge.source,
        to: edge.target,
        ...(typeof edge.sourceHandle === 'string' && edge.sourceHandle !== '' ? { sourceHandle: edge.sourceHandle } : {}),
        ...(typeof edge.targetHandle === 'string' && edge.targetHandle !== '' ? { targetHandle: edge.targetHandle } : {}),
        ...(typeof edge.label === 'string' && edge.label !== '' ? { label: edge.label } : {}),
        ...(variantIdx !== undefined ? { sourceVariantIdx: variantIdx } : {}),
      }
    }),
  }
}
