import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { DirectorxCanvasStore, type CanvasDocument, type CanvasNode } from './canvas.ts'
import { resolveLocalVideo } from './canvas-frames.ts'
import { extractFrames, probeMedia } from './providers/ffmpeg.ts'
import { videoProcess } from './providers/video-process.ts'
import { resolveOutputDir } from './support.ts'

/**
 * Board-level ffmpeg crafts that close the remaining storyboard-desk gaps:
 * join a grid of stills, stack a split-screen, crop/blur burned-in text,
 * and park an extend sibling (last frame + empty video). No generate.
 */

export const JOIN_STAMP = '拼回'
export const STACK_STAMP = '分屏'
export const DESUB_STAMP = '去字'
export const EXTEND_STAMP = '续写'
export const GIF_STAMP = '动图'

function runFfmpeg(args: string[], what: string): void {
  const result = spawnSync('ffmpeg', ['-hide_banner', '-y', ...args], { encoding: 'utf8' })
  if (result.status !== 0) throw new Error(`${what}失败: ${result.stderr?.slice(-240)}`)
}

function pinRight(doc: CanvasDocument): { x: number; y: number } {
  return { x: Math.max(...doc.nodes.map(node => node.x + (node.width ?? 280)), 48) + 48, y: 48 }
}

function mediaNodes(doc: CanvasDocument, ids: string[] | undefined, kinds: Array<CanvasNode['kind']>): CanvasNode[] {
  const pool = ids !== undefined && ids.length > 0
    ? ids.map(id => {
        const node = doc.nodes.find(item => item.id === id)
        if (node === undefined) throw new Error(`canvas node "${id}" not found`)
        return node
      })
    : doc.nodes.filter(node => kinds.includes(node.kind))
  return pool.filter(node => kinds.includes(node.kind) && typeof node.path === 'string' && node.path !== '')
}

function tileFilter(files: string[], cols: number, numbered: boolean): string {
  const rows = Math.ceil(files.length / cols)
  const parts: string[] = []
  files.forEach((_, index) => {
    const mark = numbered === true
      ? `,drawtext=text='${String(index + 1).padStart(2, '0')}':x=10:y=8:fontsize=28:fontcolor=white:borderw=2`
      : ''
    parts.push(`[${index}:v]scale=320:180:force_original_aspect_ratio=decrease,setsar=1,pad=320:180:(ow-iw)/2:(oh-ih)/2${mark}[f${index}]`)
  })
  const rowLabels: string[] = []
  for (let row = 0; row < rows; row += 1) {
    const cells = files.slice(row * cols, row * cols + cols)
    const inputs = cells.map((_, index) => `[f${row * cols + index}]`).join('')
    const label = `[row${row}]`
    if (cells.length === cols) parts.push(`${inputs}hstack=inputs=${cols}${label}`)
    else {
      const pads: string[] = []
      for (let extra = cells.length; extra < cols; extra += 1) {
        parts.push(`color=black:s=320x180[c${row}x${extra}]`)
        pads.push(`[c${row}x${extra}]`)
      }
      parts.push(`${inputs}${pads.join('')}hstack=inputs=${cols}${label}`)
    }
    rowLabels.push(label)
  }
  if (rowLabels.length === 1) parts.push(`${rowLabels[0]}format=yuv420p[out]`)
  else parts.push(`${rowLabels.join('')}vstack=inputs=${rowLabels.length},format=yuv420p[out]`)
  return parts.join(';')
}

function tileStills(files: string[], outputDir: string, columns: number, numbered: boolean): string {
  const cols = Math.min(8, Math.max(2, columns))
  const args: string[] = []
  for (const file of files) args.push('-i', file)
  const out = join(resolveOutputDir(outputDir), `grid-join-${Date.now().toString(36)}.png`)
  const attempt = (withNumbers: boolean): boolean => {
    const result = spawnSync('ffmpeg', [
      '-hide_banner', '-y', ...args, '-filter_complex', tileFilter(files, cols, withNumbers),
      '-map', '[out]', '-frames:v', '1', out,
    ], { encoding: 'utf8' })
    return result.status === 0
  }
  if (!attempt(numbered)) {
    if (numbered !== true || !attempt(false)) throw new Error('宫格拼回失败')
  }
  return out
}

export async function applyGridJoin(input: {
  store: DirectorxCanvasStore
  outputDir: string
  nodeIds?: string[]
  columns?: number
  numbered?: boolean
}): Promise<{ action: 'join'; path: string; resultId: string; sourceIds: string[]; doc: CanvasDocument }> {
  const doc = await input.store.read()
  const sources = mediaNodes(doc, input.nodeIds, ['image'])
  if (sources.length < 2) throw new Error('宫格拼回至少需要两张有成片的图片')
  const files = sources.map(node => resolveLocalVideo(input.outputDir, node.path as string))
  const path = tileStills(files, input.outputDir, input.columns ?? Math.min(4, sources.length), input.numbered !== false)
  const at = pinRight(doc)
  const added = await input.store.addNode({
    kind: 'image',
    label: '分镜组',
    path,
    prompt: `宫格拼回 ${sources.length} 格`,
    x: at.x,
    y: at.y,
    width: 360,
    height: 200,
    shotStatus: 'review',
    continuityRules: [JOIN_STAMP],
  })
  return {
    action: 'join',
    path,
    resultId: added.nodes[added.nodes.length - 1].id,
    sourceIds: sources.map(node => node.id),
    doc: added,
  }
}

export async function applySplitScreen(input: {
  store: DirectorxCanvasStore
  outputDir: string
  nodeIds?: string[]
  layout?: '2x1' | '1x2' | '2x2'
}): Promise<{ action: 'stack'; path: string; resultId: string; sourceIds: string[]; doc: CanvasDocument }> {
  const doc = await input.store.read()
  const sources = mediaNodes(doc, input.nodeIds, ['image', 'video'])
  if (sources.length < 2 || sources.length > 4) throw new Error('分屏对照需要 2–4 张有成片的图或视频')
  const files = sources.map(node => resolveLocalVideo(input.outputDir, node.path as string))
  const layout = input.layout
    ?? (sources.length === 2 ? '2x1' : '2x2')
  const cellW = 640
  const cellH = 360
  const args: string[] = []
  const parts: string[] = []
  files.forEach((file, index) => {
    const isStill = /\.(png|jpe?g|webp|gif)$/i.test(file)
    if (isStill) args.push('-loop', '1', '-t', '3', '-i', file)
    else args.push('-i', file)
    parts.push(`[${index}:v]scale=${cellW}:${cellH}:force_original_aspect_ratio=decrease,setsar=1,pad=${cellW}:${cellH}:(ow-iw)/2:(oh-ih)/2,fps=24[f${index}]`)
  })
  const slots = layout === '1x2' ? 2 : layout === '2x2' ? 4 : 2
  while (files.length < slots) {
    const extra = files.length
    parts.push(`color=black:s=${cellW}x${cellH}:r=24:d=3[f${extra}]`)
    files.push('')
  }
  if (layout === '1x2') parts.push('[f0][f1]vstack=inputs=2,format=yuv420p[out]')
  else if (layout === '2x2') parts.push('[f0][f1]hstack=inputs=2[top];[f2][f3]hstack=inputs=2[bot];[top][bot]vstack=inputs=2,format=yuv420p[out]')
  else parts.push('[f0][f1]hstack=inputs=2,format=yuv420p[out]')
  const out = join(resolveOutputDir(input.outputDir), `stack-${Date.now().toString(36)}.mp4`)
  runFfmpeg([
    ...args, '-filter_complex', parts.join(';'), '-map', '[out]',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-an', '-shortest', out,
  ], '分屏对照')
  const at = pinRight(doc)
  const added = await input.store.addNode({
    kind: 'video',
    label: '分屏',
    path: out,
    prompt: `分屏 ${layout} ${sources.map(node => node.label).join(' / ')}`.slice(0, 2000),
    x: at.x,
    y: at.y,
    width: 280,
    height: 158,
    shotStatus: 'review',
    continuityRules: [STACK_STAMP],
  })
  return {
    action: 'stack',
    path: out,
    resultId: added.nodes[added.nodes.length - 1].id,
    sourceIds: sources.map(node => node.id),
    doc: added,
  }
}

export function parseDesubRegion(raw?: string): { method: 'crop' | 'blur'; crop: string; overlay?: string } {
  const text = (raw ?? 'bottom:15').trim()
  const side = text.match(/^(bottom|top|left|right):(\d+(?:\.\d+)?)$/i)
  if (side !== null) {
    const edge = side[1].toLowerCase()
    const pct = Math.max(4, Math.min(40, Number(side[2]))) / 100
    if (edge === 'bottom') return { method: 'crop', crop: `iw:ih*${(1 - pct).toFixed(3)}:0:0` }
    if (edge === 'top') return { method: 'crop', crop: `iw:ih*${(1 - pct).toFixed(3)}:0:ih*${pct.toFixed(3)}` }
    if (edge === 'left') return { method: 'crop', crop: `iw*${(1 - pct).toFixed(3)}:ih:iw*${pct.toFixed(3)}:0` }
    return { method: 'crop', crop: `iw*${(1 - pct).toFixed(3)}:ih:0:0` }
  }
  const rect = text.match(/^rect:(\d+),(\d+),(\d+),(\d+)$/)
  if (rect !== null) {
    const [, x, y, w, h] = rect
    return { method: 'crop', crop: `${w}:${h}:${x}:${y}` }
  }
  throw new Error('去硬字区域写成 bottom:15 / top:10 / left:8 / right:8 或 rect:x,y,w,h')
}

export async function applyDesub(input: {
  store: DirectorxCanvasStore
  outputDir: string
  nodeId: string
  method?: 'crop' | 'blur'
  region?: string
}): Promise<{ action: 'desub'; path: string; resultId: string; sourceId: string; doc: CanvasDocument }> {
  const doc = await input.store.read()
  const source = doc.nodes.find(node => node.id === input.nodeId)
  if (source === undefined) throw new Error(`canvas node "${input.nodeId}" not found`)
  if (source.kind !== 'video' || source.path === undefined || source.path === '') {
    throw new Error('去硬字只接受有成片的视频')
  }
  const file = resolveLocalVideo(input.outputDir, source.path)
  const parsed = parseDesubRegion(input.region)
  const method = input.method ?? 'crop'
  let path: string
  if (method === 'blur') {
    const side = (input.region ?? 'bottom:15').match(/^(bottom|top):(\d+)/i)
    const pct = side !== null ? Math.max(4, Math.min(40, Number(side[2]))) / 100 : 0.15
    const edge = side?.[1]?.toLowerCase() === 'top' ? 'top' : 'bottom'
    const out = join(resolveOutputDir(input.outputDir), `desub-${Date.now().toString(36)}.mp4`)
    const crop = edge === 'top'
      ? `iw:ih*${pct.toFixed(3)}:0:0`
      : `iw:ih*${pct.toFixed(3)}:0:ih*${(1 - pct).toFixed(3)}`
    const y = edge === 'top' ? '0' : 'H-h'
    runFfmpeg([
      '-i', file,
      '-filter_complex', `[0:v]split=2[base][band];[band]crop=${crop},boxblur=24:12[b];[base][b]overlay=0:${y},format=yuv420p`,
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'copy', out,
    ], '去硬字')
    path = out
  } else {
    const cut = await videoProcess({ source: file, outputDir: input.outputDir, crop: parsed.crop })
    path = cut.path
  }
  const at = pinRight(doc)
  const added = await input.store.addNode({
    kind: 'video',
    label: `${source.label.slice(0, 12)} 去字`.slice(0, 200),
    path,
    prompt: source.prompt,
    x: at.x,
    y: at.y,
    width: source.width ?? 280,
    height: source.height ?? 158,
    shotStatus: 'review',
    continuityRules: [DESUB_STAMP, `镜:${source.id}`],
  })
  return { action: 'desub', path, resultId: added.nodes[added.nodes.length - 1].id, sourceId: source.id, doc: added }
}

export async function applyExtendCut(input: {
  store: DirectorxCanvasStore
  outputDir: string
  nodeId: string
  prompt?: string
}): Promise<{
  action: 'extend'
  sourceId: string
  firstId: string
  resultId: string
  path?: string
  doc: CanvasDocument
}> {
  const doc = await input.store.read()
  const source = doc.nodes.find(node => node.id === input.nodeId)
  if (source === undefined) throw new Error(`canvas node "${input.nodeId}" not found`)
  if (source.kind !== 'video' || source.path === undefined || source.path === '') {
    throw new Error('续写位只接受有成片的视频')
  }
  if (doc.nodes.some(node => node.continuityRules?.includes(`${EXTEND_STAMP}:${source.id}`) === true)) {
    const first = doc.nodes.find(node => node.kind === 'image' && node.continuityRules?.includes(`${EXTEND_STAMP}:${source.id}`) === true)
    const next = doc.nodes.find(node => node.kind === 'video' && node.continuityRules?.includes(`${EXTEND_STAMP}:${source.id}`) === true)
    if (first !== undefined && next !== undefined) {
      return { action: 'extend', sourceId: source.id, firstId: first.id, resultId: next.id, path: first.path, doc }
    }
  }
  const file = resolveLocalVideo(input.outputDir, source.path)
  const duration = probeMedia(file).durationSec ?? 1
  const atSec = Math.max(0, Number((duration - 0.08).toFixed(2)))
  const frames = await extractFrames(file, input.outputDir, { at: [atSec] })
  const framePath = frames[0]?.path
  if (framePath === undefined) throw new Error('续写位抽不到尾帧')
  const firstId = `image-${Math.random().toString(36).slice(2, 10)}`
  const resultId = `video-${Math.random().toString(36).slice(2, 10)}`
  const stamp = `${EXTEND_STAMP}:${source.id}`
  const originX = source.x + (source.width ?? 280) + 48
  const next = await input.store.batchAdd({
    nodes: [
      {
        id: firstId,
        kind: 'image',
        label: `${source.label.slice(0, 10)} 尾帧`.slice(0, 200),
        path: framePath,
        x: originX,
        y: source.y,
        width: 200,
        height: 120,
        shotStatus: 'review',
        continuityRules: [EXTEND_STAMP, stamp],
      },
      {
        id: resultId,
        kind: 'video',
        label: `${source.label.slice(0, 10)} 续写`.slice(0, 200),
        prompt: (input.prompt ?? source.prompt ?? '接着往下拍').slice(0, 2000),
        x: originX + 220,
        y: source.y,
        width: source.width ?? 280,
        height: source.height ?? 158,
        shotStatus: 'idea',
        continuityRules: [EXTEND_STAMP, stamp],
      },
    ],
    edges: [
      { from: firstId, to: resultId, label: '首帧' },
    ],
  })
  return { action: 'extend', sourceId: source.id, firstId, resultId, path: framePath, doc: next }
}

export async function applyGifExport(input: {
  store: DirectorxCanvasStore
  outputDir: string
  nodeId: string
}): Promise<{ action: 'gif'; path: string; resultId: string; sourceId: string; doc: CanvasDocument }> {
  const doc = await input.store.read()
  const source = doc.nodes.find(node => node.id === input.nodeId)
  if (source === undefined) throw new Error(`canvas node "${input.nodeId}" not found`)
  if (source.kind !== 'video' || source.path === undefined || source.path === '') {
    throw new Error('导出动图只接受有成片的视频')
  }
  const file = resolveLocalVideo(input.outputDir, source.path)
  const out = join(resolveOutputDir(input.outputDir), `gif-${Date.now().toString(36)}.gif`)
  runFfmpeg([
    '-i', file,
    '-vf', 'fps=12,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse',
    '-loop', '0', out,
  ], '导出动图')
  const at = pinRight(doc)
  const added = await input.store.addNode({
    kind: 'image',
    label: `${source.label.slice(0, 12)} GIF`.slice(0, 200),
    path: out,
    x: at.x,
    y: at.y,
    width: 220,
    height: 140,
    shotStatus: 'review',
    continuityRules: [GIF_STAMP, `镜:${source.id}`],
  })
  return { action: 'gif', path: out, resultId: added.nodes[added.nodes.length - 1].id, sourceId: source.id, doc: added }
}
