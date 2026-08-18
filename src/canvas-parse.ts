import { DirectorxCanvasStore, type CanvasDocument } from './canvas.ts'
import { resolveLocalVideo } from './canvas-frames.ts'
import { videoAnalyze, type ShotSegment } from './providers/video-analyze.ts'
import type { DirectorxSettings } from './config.ts'

function mockSettings(outputDir: string): DirectorxSettings {
  const cap = {
    enabled: false,
    mode: 'mock' as const,
    baseURL: '',
    apiKey: '',
    model: 'mock',
    resolution: '1K',
    auth: { klingAk: '', klingSk: '', runwayVersion: '' },
  }
  return {
    outputDir,
    timeoutMs: 1000,
    pollIntervalMs: 100,
    maxPollAttempts: 1,
    persona: '成片',
    initiative: '自动',
    vision: cap,
    image: cap,
    video: cap,
    audio: cap,
  }
}

/**
 * One-click parse: scene-cut detection (ffmpeg signalstats luminance
 * deltas, same family as PySceneDetect content cuts) → a script card
 * plus representative stills on the board. Does not generate media.
 */

export const PARSE_STAMP_PREFIX = '解析:'
const MAX_PARSE_SHOTS = 16

function newParseId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function mergeShots(shots: ShotSegment[], cap: number): ShotSegment[] {
  const next = shots.slice()
  while (next.length > cap) {
    let shortest = 1
    let shortestDur = Infinity
    for (let index = 1; index < next.length; index += 1) {
      const dur = (next[index - 1]?.durationSec ?? 0) + (next[index]?.durationSec ?? 0)
      if (dur < shortestDur) {
        shortest = index
        shortestDur = dur
      }
    }
    const left = next[shortest - 1]
    const right = next[shortest]
    if (left === undefined || right === undefined) break
    left.end = right.end
    left.durationSec = Number((left.end - left.start).toFixed(2))
    if (left.description === null || left.description === '') left.description = right.description
    if (left.framePath === undefined) left.framePath = right.framePath
    next.splice(shortest, 1)
  }
  return next.map((shot, index) => ({ ...shot, index: index + 1 }))
}

export function formatParseScript(sourceLabel: string, shots: ShotSegment[]): string {
  const lines = [`第一场 ${sourceLabel} 解析`]
  for (const shot of shots) {
    const body = (shot.description ?? '').trim()
    const window = `${shot.start.toFixed(1)}-${shot.end.toFixed(1)}s`
    lines.push(body === '' ? `镜头${shot.index}：${window}` : `镜头${shot.index}：${window} ${body}`)
  }
  return lines.join('\n')
}

export function parsePreviewShots(value: unknown): ShotSegment[] | undefined {
  if (!Array.isArray(value)) return undefined
  const shots: ShotSegment[] = []
  for (const item of value) {
    if (item === null || typeof item !== 'object') continue
    const rec = item as Record<string, unknown>
    if (typeof rec.start !== 'number' || typeof rec.end !== 'number') continue
    shots.push({
      index: typeof rec.index === 'number' ? rec.index : shots.length + 1,
      start: rec.start,
      end: rec.end,
      durationSec: typeof rec.durationSec === 'number' ? rec.durationSec : Number((rec.end - rec.start).toFixed(2)),
      ...(typeof rec.framePath === 'string' && rec.framePath !== '' ? { framePath: rec.framePath } : {}),
      description: typeof rec.description === 'string' ? rec.description : null,
    })
  }
  return shots.length > 0 ? shots : undefined
}

export async function applyVideoParse(input: {
  store: DirectorxCanvasStore
  outputDir: string
  nodeId: string
  describe?: boolean
  preview?: boolean
  shots?: ShotSegment[]
  settings?: DirectorxSettings
}): Promise<{
  action: 'parse'
  reused: boolean
  preview?: boolean
  sourceId: string
  shots: ShotSegment[]
  script: string
  nodeIds: string[]
  groupId?: string
  scriptId?: string
  doc: CanvasDocument
}> {
  const doc = await input.store.read()
  const source = doc.nodes.find(node => node.id === input.nodeId)
  if (source === undefined) throw new Error(`canvas node "${input.nodeId}" not found`)
  if (source.kind !== 'video') throw new Error('一键解析只接受视频节点')
  if (source.path === undefined || source.path === '') throw new Error('这段视频还没有成片路径')

  const stamp = `${PARSE_STAMP_PREFIX}${source.id}`
  if (doc.nodes.some(node => node.continuityRules?.includes(stamp) === true)) {
    const nodeIds = doc.nodes.filter(node => node.continuityRules?.includes(stamp) === true).map(node => node.id)
    const scriptNode = doc.nodes.find(node => node.kind === 'text' && node.continuityRules?.includes(stamp) === true)
    const groupId = doc.nodes.find(node => node.kind === 'group' && node.continuityRules?.includes(stamp) === true)?.id
    return {
      action: 'parse',
      reused: true,
      sourceId: source.id,
      shots: [],
      script: scriptNode !== undefined ? scriptNode.label : '',
      nodeIds,
      ...(groupId !== undefined ? { groupId } : {}),
      ...(scriptNode !== undefined ? { scriptId: scriptNode.id } : {}),
      doc,
    }
  }

  let shots = input.shots !== undefined && input.shots.length > 0 ? mergeShots(input.shots, MAX_PARSE_SHOTS) : []
  if (shots.length === 0) {
    const sourcePath = resolveLocalVideo(input.outputDir, source.path)
    const settings = input.settings ?? mockSettings(input.outputDir)
    const analysis = await videoAnalyze({
      source: sourcePath,
      outputDir: input.outputDir,
      settings,
      vision: settings.vision,
      minShotSec: 0.8,
      describe: input.describe === true,
    })
    shots = mergeShots(analysis.shots, MAX_PARSE_SHOTS)
  }
  if (shots.length === 0) throw new Error('没有拆出镜头')
  const script = formatParseScript(source.label || '成片', shots)
  if (input.preview === true) {
    return {
      action: 'parse',
      reused: false,
      preview: true,
      sourceId: source.id,
      shots,
      script,
      nodeIds: [],
      doc,
    }
  }

  const cardW = 280
  const cardH = 158
  const gap = 20
  const padX = 36
  const padY = 56
  const originX = source.x
  const originY = source.y + (source.height ?? cardH) + 64
  const groupW = padX * 2 + Math.max(1, shots.length) * cardW + Math.max(0, shots.length - 1) * gap
  const groupH = padY + cardH + 32
  const groupId = newParseId('group')
  const scriptId = newParseId('text')
  const nodes: Array<Record<string, unknown>> = [
    {
      id: scriptId,
      kind: 'text',
      label: script.slice(0, 8000),
      prompt: script.slice(0, 2000),
      x: originX,
      y: originY,
      width: 360,
      height: 220,
      continuityRules: [stamp],
    },
    {
      id: groupId,
      kind: 'group',
      label: `${source.label.slice(0, 24)} 解析`.slice(0, 200),
      x: originX,
      y: originY + 240,
      width: Math.max(320, groupW),
      height: groupH,
      continuityRules: [stamp],
    },
  ]
  const nodeIds = [scriptId, groupId]
  shots.forEach((shot, index) => {
    const id = newParseId('image')
    nodeIds.push(id)
    const body = (shot.description ?? '').trim()
    nodes.push({
      id,
      kind: 'image',
      label: `镜${shot.index} ${shot.start.toFixed(1)}s`.slice(0, 200),
      ...(shot.framePath !== undefined ? { path: shot.framePath } : {}),
      prompt: (body === '' ? `${source.prompt ?? source.label} · ${shot.start.toFixed(1)}-${shot.end.toFixed(1)}s` : body).slice(0, 2000),
      parent: groupId,
      x: originX + padX + index * (cardW + gap),
      y: originY + 240 + padY,
      width: cardW,
      height: cardH,
      shotIndex: shot.index,
      shotStatus: 'review',
      durationSec: Math.max(1, Math.min(15, Math.round(shot.durationSec))),
      continuityRules: [stamp, `t=${shot.start}-${shot.end}`],
    })
  })
  const next = await input.store.batchAdd({ nodes })
  return {
    action: 'parse',
    reused: false,
    sourceId: source.id,
    shots,
    script,
    nodeIds,
    groupId,
    scriptId,
    doc: next,
  }
}
