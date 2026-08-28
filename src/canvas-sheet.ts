import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { DirectorxCanvasStore, type CanvasDocument } from './canvas.ts'
import { resolveLocalVideo } from './canvas-frames.ts'
import { contactSheet } from './providers/contact-sheet.ts'
import { resolveOutputDir } from './support.ts'

/**
 * Contact sheet of selected media, and grid-split of one still into
 * independent image cards (ffmpeg crop). Both stay on the board.
 */

export async function applyCanvasSheet(input: {
  store: DirectorxCanvasStore
  outputDir: string
  nodeIds?: string[]
  columns?: number
}): Promise<{
  action: 'sheet'
  path: string
  resultId: string
  sourceIds: string[]
  doc: CanvasDocument
}> {
  const doc = await input.store.read()
  const pool = input.nodeIds !== undefined && input.nodeIds.length > 0
    ? input.nodeIds.map(id => {
        const node = doc.nodes.find(item => item.id === id)
        if (node === undefined) throw new Error(`canvas node "${id}" not found`)
        return node
      })
    : doc.nodes.filter(node => (node.kind === 'image' || node.kind === 'video') && typeof node.path === 'string' && node.path !== '')
  const sources = pool
    .filter(node => typeof node.path === 'string' && node.path !== '')
    .map(node => resolveLocalVideo(input.outputDir, node.path as string))
  if (sources.length === 0) throw new Error('接触表需要至少一张有成片的图或视频')
  const sheet = await contactSheet({
    sources,
    outputDir: input.outputDir,
    columns: input.columns ?? Math.min(4, Math.max(2, sources.length)),
  })
  const right = Math.max(...doc.nodes.map(node => node.x + (node.width ?? 280)), 48)
  const added = await input.store.addNode({
    kind: 'image',
    label: '九宫格',
    path: sheet.path,
    prompt: `九宫格 ${sources.length} 格`,
    x: right + 48,
    y: 48,
    width: 360,
    height: 200,
    shotStatus: 'review',
    continuityRules: ['九宫格'],
  })
  return {
    action: 'sheet',
    path: sheet.path,
    resultId: added.nodes[added.nodes.length - 1].id,
    sourceIds: pool.map(node => node.id),
    doc: added,
  }
}

export async function applyGridSplit(input: {
  store: DirectorxCanvasStore
  outputDir: string
  nodeId: string
  cols?: number
  rows?: number
}): Promise<{
  action: 'split'
  files: string[]
  nodeIds: string[]
  groupId: string
  doc: CanvasDocument
}> {
  const doc = await input.store.read()
  const source = doc.nodes.find(node => node.id === input.nodeId)
  if (source === undefined) throw new Error(`canvas node "${input.nodeId}" not found`)
  if (source.kind !== 'image' || source.path === undefined || source.path === '') {
    throw new Error('宫格切开只接受有成片的图片')
  }
  const cols = Math.max(1, Math.min(8, Math.round(input.cols ?? 2)))
  const rows = Math.max(1, Math.min(8, Math.round(input.rows ?? 2)))
  const path = resolveLocalVideo(input.outputDir, source.path)
  const dir = resolveOutputDir(input.outputDir)
  const files: string[] = []
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const out = join(dir, `split-${row}-${col}-${Date.now().toString(36)}.png`)
      const result = spawnSync('ffmpeg', [
        '-hide_banner', '-y', '-i', path,
        '-vf', `crop=iw/${cols}:ih/${rows}:${col}*iw/${cols}:${row}*ih/${rows}`,
        '-frames:v', '1', out,
      ], { encoding: 'utf8' })
      if (result.status !== 0) throw new Error(`切开失败 ${row + 1},${col + 1}: ${result.stderr?.slice(-200)}`)
      files.push(out)
    }
  }
  const sourceW = source.width ?? 400
  const sourceH = source.height ?? 220
  const cardW = Math.max(140, Math.round(sourceW / Math.min(cols, 3)))
  const cardH = Math.max(90, Math.round(sourceH / Math.min(rows, 3)))
  const originX = source.x + sourceW + 100
  const originY = source.y
  const gap = 16
  const nodeIds: string[] = []
  const nodes: Array<Record<string, unknown>> = []
  const edges: Array<Record<string, unknown>> = []
  files.forEach((file, index) => {
    const id = `image-${Math.random().toString(36).slice(2, 10)}`
    const col = index % cols
    const row = Math.floor(index / cols)
    nodeIds.push(id)
    nodes.push({
      id,
      kind: 'image',
      label: `图片 ${col + 1},${row + 1}`,
      path: file,
      x: originX + col * (cardW + gap),
      y: originY + row * (cardH + gap),
      width: cardW,
      height: cardH,
      shotStatus: 'review',
    })
    edges.push({ id: `e-${source.id}-${id}`, from: source.id, to: id, sourceHandle: 'out', targetHandle: 'in' })
  })
  const next = await input.store.batchAdd({ nodes, edges })
  return { action: 'split', files, nodeIds, groupId: source.id, doc: next }
}
