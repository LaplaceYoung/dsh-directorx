import { existsSync } from 'node:fs'
import { DirectorxCanvasStore, type CanvasDocument } from './canvas.ts'
import { extractFrames } from './providers/ffmpeg.ts'
import { resolveMediaPath } from './support.ts'

/**
 * Lift stills from a finished video card onto the board as image cards
 * in a sibling group. Provenance is a continuity stamp, not a video→image
 * edge (that direction is reserved so generation never treats a clip as
 * an image reference).
 */

export const FRAME_STAMP_PREFIX = '抽帧:'
export const MAX_FRAME_CARDS = 12

function newFrameId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export function resolveLocalVideo(outputDir: string, candidate: string): string {
  if (candidate !== '' && existsSync(candidate)) return candidate
  const resolved = resolveMediaPath(outputDir, candidate)
  if (!existsSync(resolved)) throw new Error(`找不到视频文件：${candidate}`)
  return resolved
}

export function alreadyStripped(doc: CanvasDocument, videoId: string): boolean {
  const stamp = `${FRAME_STAMP_PREFIX}${videoId}`
  return doc.nodes.some(node => node.continuityRules?.includes(stamp) === true)
}

export async function applyFrameStrip(input: {
  store: DirectorxCanvasStore
  outputDir: string
  nodeId: string
  count?: number
}): Promise<{
  action: 'frames'
  reused: boolean
  sourceId: string
  files: string[]
  nodeIds: string[]
  groupId?: string
  doc: CanvasDocument
}> {
  const doc = await input.store.read()
  const source = doc.nodes.find(node => node.id === input.nodeId)
  if (source === undefined) throw new Error(`canvas node "${input.nodeId}" not found`)
  if (source.kind !== 'video') throw new Error('抽帧上板只接受视频节点')
  if (source.path === undefined || source.path === '') throw new Error('这段视频还没有成片路径')

  const stamp = `${FRAME_STAMP_PREFIX}${source.id}`
  if (alreadyStripped(doc, source.id)) {
    const nodeIds = doc.nodes.filter(node => node.continuityRules?.includes(stamp) === true).map(node => node.id)
    const groupId = doc.nodes.find(node => node.kind === 'group' && node.continuityRules?.includes(stamp) === true)?.id
    return {
      action: 'frames',
      reused: true,
      sourceId: source.id,
      files: doc.nodes.filter(node => node.kind === 'image' && node.continuityRules?.includes(stamp) === true).map(node => node.path ?? ''),
      nodeIds,
      ...(groupId !== undefined ? { groupId } : {}),
      doc,
    }
  }

  const count = Math.max(3, Math.min(MAX_FRAME_CARDS, Math.round(input.count ?? 6)))
  const sourcePath = resolveLocalVideo(input.outputDir, source.path)
  const extracted = await extractFrames(sourcePath, input.outputDir, { count })
  if (extracted.length === 0) throw new Error('没有抽出帧')

  const cardW = 280
  const cardH = 158
  const gap = 20
  const padX = 36
  const padY = 56
  const groupW = padX * 2 + extracted.length * cardW + Math.max(0, extracted.length - 1) * gap
  const groupH = padY + cardH + 32
  const groupId = newFrameId('group')
  const originX = source.x
  const originY = source.y + (source.height ?? cardH) + 64
  const nodes: Array<Record<string, unknown>> = [{
    id: groupId,
    kind: 'group',
    label: `${source.label.slice(0, 24)} 抽帧`.slice(0, 200),
    x: originX,
    y: originY,
    width: Math.max(320, groupW),
    height: groupH,
    continuityRules: [stamp],
  }]
  const nodeIds = [groupId]
  extracted.forEach((file, index) => {
    if (file.path === undefined || file.path === '') return
    const stampMatch = /-(\d+(?:\.\d+)?)s\.png$/.exec(file.path)
    const seconds = stampMatch?.[1] ?? String(index + 1)
    const id = newFrameId('image')
    nodeIds.push(id)
    nodes.push({
      id,
      kind: 'image',
      label: `抽帧 ${seconds}s`.slice(0, 200),
      path: file.path,
      prompt: `${source.prompt ?? source.label} · ${seconds}s`.slice(0, 2000),
      parent: groupId,
      x: originX + padX + index * (cardW + gap),
      y: originY + padY,
      width: cardW,
      height: cardH,
      shotStatus: 'review',
      continuityRules: [stamp, `t=${seconds}`],
    })
  })
  const next = await input.store.batchAdd({ nodes })
  return {
    action: 'frames',
    reused: false,
    sourceId: source.id,
    files: extracted.map(file => file.path).filter((path): path is string => typeof path === 'string' && path !== ''),
    nodeIds,
    groupId,
    doc: next,
  }
}
