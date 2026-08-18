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
    label: '接触表',
    path: sheet.path,
    prompt: `接触表 ${sources.length} 格`,
    x: right + 48,
    y: 48,
    width: 360,
    height: 200,
    shotStatus: 'review',
    continuityRules: ['接触表'],
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
  const cols = Math.max(2, Math.min(5, Math.round(input.cols ?? 3)))
  const rows = Math.max(1, Math.min(5, Math.round(input.rows ?? 3)))
  const path = resolveLocalVideo(input.outputDir, source.path)
  const dir = resolveOutputDir(input.outputDir)
  const files: string[] = []
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const out = join(dir, `grid-${source.id}-${row}-${col}-${Date.now().toString(36)}.png`)
      const result = spawnSync('ffmpeg', [
        '-hide_banner', '-y', '-i', path,
        '-vf', `crop=iw/${cols}:ih/${rows}:${col}*iw/${cols}:${row}*ih/${rows}`,
        '-frames:v', '1', out,
      ], { encoding: 'utf8' })
      if (result.status !== 0) throw new Error(`宫格切开失败 ${row},${col}: ${result.stderr?.slice(-200)}`)
      files.push(out)
    }
  }
  const groupId = `group-${Math.random().toString(36).slice(2, 10)}`
  const cardW = 200
  const cardH = 120
  const originX = source.x
  const originY = source.y + (source.height ?? 158) + 48
  const nodes: Array<Record<string, unknown>> = [{
    id: groupId,
    kind: 'group',
    label: `${source.label.slice(0, 16)} 宫格`.slice(0, 200),
    x: originX,
    y: originY,
    width: 36 * 2 + cols * cardW + (cols - 1) * 16,
    height: 56 + rows * cardH + (rows - 1) * 16 + 24,
    continuityRules: [`切开:${source.id}`],
  }]
  const nodeIds = [groupId]
  files.forEach((file, index) => {
    const id = `image-${Math.random().toString(36).slice(2, 10)}`
    const col = index % cols
    const row = Math.floor(index / cols)
    nodeIds.push(id)
    nodes.push({
      id,
      kind: 'image',
      label: `格${index + 1}`,
      path: file,
      parent: groupId,
      x: originX + 36 + col * (cardW + 16),
      y: originY + 56 + row * (cardH + 16),
      width: cardW,
      height: cardH,
      shotStatus: 'review',
      continuityRules: [`切开:${source.id}`],
    })
  })
  const next = await input.store.batchAdd({ nodes })
  return { action: 'split', files, nodeIds, groupId, doc: next }
}
