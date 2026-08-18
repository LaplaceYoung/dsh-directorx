import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { DirectorxCanvasStore, type CanvasDocument } from './canvas.ts'
import { resolveLocalVideo } from './canvas-frames.ts'
import { extractFrames, probeMedia } from './providers/ffmpeg.ts'
import { videoConcat, videoProcess } from './providers/video-process.ts'
import { resolveOutputDir } from './support.ts'

/**
 * Clip remake: keep head/tail with ffmpeg, park a mid card for DSH to
 * generate (first+last frames as refs), then concat. UI never writes
 * generating nodes — it only cuts and later assembles.
 */

export const RESHOOT_STAMP = '重做中段'
export const RESHOOT_PREFIX = '重做:'

export interface ReshootJob {
  id: string
  sourceId: string
  midId: string
  resultId: string
  start: number
  end: number
  prompt: string
  headPath?: string
  tailPath?: string
  firstPath?: string
  lastPath?: string
}

function newReshootId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function ledgerPath(outputDir: string): string {
  return join(resolveOutputDir(outputDir), 'reshoots.json')
}

async function readJobs(outputDir: string): Promise<ReshootJob[]> {
  try {
    const parsed = JSON.parse(await readFile(ledgerPath(outputDir), 'utf8')) as { jobs?: ReshootJob[] }
    return Array.isArray(parsed.jobs) ? parsed.jobs : []
  } catch {
    return []
  }
}

async function writeJobs(outputDir: string, jobs: ReshootJob[]): Promise<void> {
  await mkdir(resolveOutputDir(outputDir), { recursive: true })
  await writeFile(ledgerPath(outputDir), JSON.stringify({ jobs: jobs.slice(-40) }, null, 2), 'utf8')
}

export async function applyReshootCut(input: {
  store: DirectorxCanvasStore
  outputDir: string
  nodeId: string
  start: number
  end: number
  prompt?: string
}): Promise<{
  action: 'reshoot'
  phase: 'cut'
  sourceId: string
  midId: string
  resultId: string
  firstId: string
  lastId: string
  start: number
  end: number
  durationSec: number
  prompt: string
  job: ReshootJob
  doc: CanvasDocument
}> {
  const doc = await input.store.read()
  const source = doc.nodes.find(node => node.id === input.nodeId)
  if (source === undefined) throw new Error(`canvas node "${input.nodeId}" not found`)
  if (source.kind !== 'video') throw new Error('片段重做只接受视频节点')
  if (source.path === undefined || source.path === '') throw new Error('这段视频还没有成片路径')

  const sourcePath = resolveLocalVideo(input.outputDir, source.path)
  const probe = probeMedia(sourcePath)
  const duration = probe.durationSec
  const start = Math.max(0, Number(input.start))
  const end = Math.min(duration, Number(input.end))
  if (!Number.isFinite(start) || !Number.isFinite(end) || end - start < 1) {
    throw new Error('重做窗至少 1 秒，填写片内起止秒')
  }
  if (end - start > 15) throw new Error('重做窗最长 15 秒，再长请拆两段')

  const prompt = (typeof input.prompt === 'string' && input.prompt.trim() !== ''
    ? input.prompt.trim()
    : (source.prompt ?? source.label)).slice(0, 2000)
  const midPrompt = `片段重做 ${start.toFixed(1)}-${end.toFixed(1)}s。用首帧和尾帧做首尾帧接力，只重拍这一段：${prompt}`.slice(0, 2000)

  const frames = await extractFrames(sourcePath, input.outputDir, {
    at: [start, Math.max(start, end - 0.04)],
  })
  const firstPath = frames[0]?.path
  const lastPath = frames[1]?.path ?? frames[0]?.path
  if (firstPath === undefined) throw new Error('抽不出重做窗的首尾帧')

  let headPath: string | undefined
  let tailPath: string | undefined
  if (start > 0.08) {
    headPath = (await videoProcess({ source: sourcePath, outputDir: input.outputDir, start: 0, end: start })).path
  }
  if (duration - end > 0.08) {
    tailPath = (await videoProcess({ source: sourcePath, outputDir: input.outputDir, start: end })).path
  }

  const stamp = `${RESHOOT_PREFIX}${source.id}:${start.toFixed(1)}-${end.toFixed(1)}`
  const groupId = newReshootId('group')
  const firstId = newReshootId('image')
  const lastId = newReshootId('image')
  const midId = newReshootId('video')
  const resultId = newReshootId('video')
  const originX = source.x + (source.width ?? 280) + 48
  const originY = source.y
  const cardW = 280
  const cardH = 158
  const padX = 36
  const padY = 56
  const groupW = padX * 2 + 4 * cardW + 3 * 20
  const groupH = padY + cardH + 32

  const nodes: Array<Record<string, unknown>> = [
    {
      id: groupId,
      kind: 'group',
      label: `${source.label.slice(0, 20)} 片段重做`.slice(0, 200),
      x: originX,
      y: originY,
      width: groupW,
      height: groupH,
      continuityRules: [stamp],
    },
    {
      id: firstId,
      kind: 'image',
      label: `重做首帧 ${start.toFixed(1)}s`,
      path: firstPath,
      prompt: midPrompt,
      parent: groupId,
      x: originX + padX,
      y: originY + padY,
      width: cardW,
      height: cardH,
      shotStatus: 'review',
      continuityRules: [stamp, '首帧'],
    },
    {
      id: lastId,
      kind: 'image',
      label: `重做尾帧 ${end.toFixed(1)}s`,
      path: lastPath,
      prompt: midPrompt,
      parent: groupId,
      x: originX + padX + cardW + 20,
      y: originY + padY,
      width: cardW,
      height: cardH,
      shotStatus: 'review',
      continuityRules: [stamp, '尾帧'],
    },
    {
      id: midId,
      kind: 'video',
      label: `${source.label.slice(0, 16)} 重做中段`.slice(0, 200),
      prompt: midPrompt,
      parent: groupId,
      x: originX + padX + 2 * (cardW + 20),
      y: originY + padY,
      width: cardW,
      height: cardH,
      shotStatus: 'idea',
      durationSec: Math.max(1, Math.min(15, Math.round(end - start))),
      continuityRules: [stamp, RESHOOT_STAMP],
      ...(source.characters !== undefined ? { characters: source.characters } : {}),
    },
    {
      id: resultId,
      kind: 'video',
      label: `${source.label.slice(0, 16)} 重做成片`.slice(0, 200),
      prompt: midPrompt,
      parent: groupId,
      x: originX + padX + 3 * (cardW + 20),
      y: originY + padY,
      width: cardW,
      height: cardH,
      shotStatus: 'idea',
      continuityRules: [stamp, '重做成片'],
    },
  ]
  const edges = [
    { from: firstId, to: midId, label: '首帧' },
    { from: lastId, to: midId, label: '尾帧' },
  ]
  const next = await input.store.batchAdd({ nodes, edges })
  const job: ReshootJob = {
    id: stamp,
    sourceId: source.id,
    midId,
    resultId,
    start,
    end,
    prompt: midPrompt,
    ...(headPath !== undefined ? { headPath } : {}),
    ...(tailPath !== undefined ? { tailPath } : {}),
    firstPath,
    lastPath,
  }
  const jobs = await readJobs(input.outputDir)
  jobs.push(job)
  await writeJobs(input.outputDir, jobs)
  return {
    action: 'reshoot',
    phase: 'cut',
    sourceId: source.id,
    midId,
    resultId,
    firstId,
    lastId,
    start,
    end,
    durationSec: Number((end - start).toFixed(2)),
    prompt: midPrompt,
    job,
    doc: next,
  }
}

export async function applyReshootAssemble(input: {
  store: DirectorxCanvasStore
  outputDir: string
  nodeId: string
}): Promise<{
  action: 'reshoot'
  phase: 'assemble'
  sourceId: string
  midId: string
  resultId: string
  path: string
  doc: CanvasDocument
}> {
  const doc = await input.store.read()
  const mid = doc.nodes.find(node => node.id === input.nodeId)
    ?? doc.nodes.find(node => node.continuityRules?.includes(RESHOOT_STAMP) === true && node.id === input.nodeId)
  if (mid === undefined) throw new Error(`canvas node "${input.nodeId}" not found`)
  if (mid.path === undefined || mid.path === '') throw new Error('中段还没有成片，先生成再拼回')

  const jobs = await readJobs(input.outputDir)
  const job = jobs.find(item => item.midId === mid.id || item.resultId === mid.id)
    ?? jobs.find(item => item.sourceId === mid.id)
  if (job === undefined) throw new Error('找不到这段重做的头尾记录，先切窗')

  const midPath = resolveLocalVideo(input.outputDir, mid.path)
  const files = [job.headPath, midPath, job.tailPath].filter((path): path is string => typeof path === 'string' && path !== '')
  let path = midPath
  if (files.length >= 2) {
    path = (await videoConcat({ files, outputDir: input.outputDir, transition: 'cut' })).path
  }
  const next = await input.store.update(job.resultId, { path, shotStatus: 'review' })
  return {
    action: 'reshoot',
    phase: 'assemble',
    sourceId: job.sourceId,
    midId: job.midId,
    resultId: job.resultId,
    path,
    doc: next,
  }
}
