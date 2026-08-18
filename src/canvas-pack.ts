import { DirectorxCanvasStore, type CanvasDocument } from './canvas.ts'
import { resolveLocalVideo } from './canvas-frames.ts'
import { videoConcat } from './providers/video-process.ts'

/**
 * Pack finished video cards into one cut. Order is the given ids, else
 * shotIndex. Deterministic ffmpeg — no generate.
 */

export async function applyCanvasPack(input: {
  store: DirectorxCanvasStore
  outputDir: string
  nodeIds?: string[]
  transition?: 'cut' | 'fade'
  fadeSec?: number
}): Promise<{
  action: 'pack'
  path: string
  sourceIds: string[]
  resultId: string
  doc: CanvasDocument
}> {
  const doc = await input.store.read()
  const wanted = input.nodeIds !== undefined && input.nodeIds.length > 0
    ? input.nodeIds.map(id => {
        const node = doc.nodes.find(item => item.id === id)
        if (node === undefined) throw new Error(`canvas node "${id}" not found`)
        return node
      })
    : doc.nodes
      .filter(node => node.kind === 'video' && typeof node.path === 'string' && node.path !== '')
      .slice()
      .sort((left, right) => (left.shotIndex ?? 1e9) - (right.shotIndex ?? 1e9) || left.x - right.x)
  const clips = wanted.filter(node => node.kind === 'video' && typeof node.path === 'string' && node.path !== '')
  if (clips.length < 2) throw new Error('拼成片至少需要两段有成片的视频')
  const files = clips.map(node => resolveLocalVideo(input.outputDir, node.path as string))
  const cut = await videoConcat({
    files,
    outputDir: input.outputDir,
    transition: input.transition === 'fade' ? 'fade' : 'cut',
    ...(input.transition === 'fade' ? { fadeSec: input.fadeSec ?? 0.3 } : {}),
    scale: '1280:720',
  })
  const right = Math.max(...doc.nodes.map(node => node.x + (node.width ?? 280)))
  const added = await input.store.addNode({
    kind: 'video',
    label: '成片',
    path: cut.path,
    prompt: clips.map(node => node.label).join(' → ').slice(0, 2000),
    x: right + 48,
    y: 48,
    width: 280,
    height: 158,
    shotStatus: 'review',
    continuityRules: ['成片', ...clips.map(node => `镜:${node.id}`).slice(0, 4)],
  })
  const result = added.nodes[added.nodes.length - 1]
  return {
    action: 'pack',
    path: cut.path,
    sourceIds: clips.map(node => node.id),
    resultId: result.id,
    doc: added,
  }
}
