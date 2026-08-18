import { existsSync, statSync } from 'node:fs'
import { basename, isAbsolute } from 'node:path'
import { DirectorxCanvasStore } from './canvas.ts'
import { DirectorxEditLedger } from './edits.ts'
import { inferMediaKind } from './providers/grade.ts'
import { mimeForPath, resolveMediaPath } from './support.ts'

export type BoundMediaKind = 'image' | 'video'

export interface BoundMedia {
  nodeId?: string
  path: string
  kind: BoundMediaKind
  label?: string
}

export function resolveLocalMedia(outputDir: string, candidate: string): string {
  const trimmed = candidate.trim()
  if (trimmed === '') throw new Error('需要本地媒体路径')
  try {
    return resolveMediaPath(outputDir, trimmed)
  } catch (error) {
    if (isAbsolute(trimmed) && existsSync(trimmed)) return trimmed
    throw error
  }
}

export async function resolveBoundMedia(input: {
  canvas: DirectorxCanvasStore
  outputDir: string
  nodeId?: unknown
  path?: unknown
  kind?: unknown
  require?: BoundMediaKind | 'media'
}): Promise<BoundMedia> {
  const nodeId = typeof input.nodeId === 'string' && input.nodeId.trim() !== '' ? input.nodeId.trim() : ''
  let path = typeof input.path === 'string' ? input.path.trim() : ''
  let kind: BoundMediaKind | undefined = input.kind === 'video' || input.kind === 'image' ? input.kind : undefined
  let label: string | undefined
  if (nodeId !== '') {
    const found = await input.canvas.getNode(nodeId)
    if (found.kind !== 'node') throw new Error(`nodeId ${nodeId} 不是媒体节点`)
    if (found.node.kind !== 'image' && found.node.kind !== 'video') {
      throw new Error(`节点 ${nodeId} 不是图片/视频`)
    }
    if (path === '') path = found.node.path ?? ''
    kind = kind ?? found.node.kind
    label = found.node.label
  }
  if (path === '') throw new Error('需要 path 或带媒体的 nodeId')
  const source = resolveLocalMedia(input.outputDir, path)
  if (!existsSync(source)) throw new Error(`媒体不存在：${source}`)
  const mediaKind = kind ?? inferMediaKind(source)
  const require = input.require ?? 'media'
  if (require !== 'media' && mediaKind !== require) {
    throw new Error(`需要${require === 'video' ? '视频' : '图片'}，当前是${mediaKind === 'video' ? '视频' : '图片'}`)
  }
  return {
    path: source,
    kind: mediaKind,
    ...(nodeId !== '' ? { nodeId } : {}),
    ...(label !== undefined && label !== '' ? { label } : {}),
  }
}

export async function commitBoundMedia(input: {
  canvas: DirectorxCanvasStore
  ledger: DirectorxEditLedger
  nodeId?: string
  path: string
  mediaType?: string
}): Promise<{ written: boolean; nodeId?: string }> {
  const mediaType = input.mediaType ?? mimeForPath(input.path)
  const bytes = existsSync(input.path) ? statSync(input.path).size : 0
  await input.ledger.append({
    at: Date.now(),
    path: input.path,
    mediaType,
    bytes,
    name: basename(input.path),
  })
  if (input.nodeId === undefined || input.nodeId === '') return { written: false }
  await input.canvas.update(input.nodeId, { path: input.path })
  return { written: true, nodeId: input.nodeId }
}
