import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { CharacterStore } from './characters.ts'
import { DirectorxCanvasStore } from './canvas.ts'
import { activeSeries } from './series.ts'
import { resolveOutputDir } from './support.ts'

/**
 * One-take blocking sheet: roster + start + event sequence → a world-state
 * lock DSH writes and pins. Does not generate.
 */

export const BLOCKING_STAMP = '场面锁'
export const BLOCKING_NODE_ID = 'blocking-sheet'

export type BlockingRefRole = 'identity' | 'geometry' | 'state' | 'action' | 'other'

export interface BlockingRef {
  role: BlockingRefRole
  path: string
  label: string
  authority: string
  nodeId?: string
}

export interface BlockingTick {
  id: string
  atSec: number
  event: string
  line: string
}

export interface BlockingHarvest {
  title: string
  series?: string
  roster: Array<{ name: string; refPath: string; description: string }>
  refs: BlockingRef[]
  existingNodeId?: string
  existingPreview?: string
}

const PRIORITY = [
  '场面台账与参考角色（人数、坐标、唯一物件、独立相机）',
  '物件状态机（同时只 1 个物件、同时只 1 个持有者，交接后旧持有者空手）',
  '用户点名的合法动作 / 规则（步法、出界、交接顺序）',
  '独立跟拍：先拍交物者，再追空中物件，再接到已在台账里的接收者',
  '身份锁：名单人数不增不减，出画的人按轨道回来，禁止换脸复制',
  '电影感与细节：不得为了好看改台账、人数、持有者或规则',
]

const SECTIONS = [
  '生成目标',
  '指令优先级',
  '参考角色',
  '身份锁',
  '场面台账',
  '物件状态机',
  '交接与持有',
  '独立相机',
  '分段结束态',
  '绝对排除',
]

function clampDuration(value: unknown): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : Number(value)
  if (!Number.isFinite(n)) return 15
  return Math.max(4, Math.min(60, Math.round(n)))
}

export function parseBeats(raw: string): string[] {
  if (raw.trim() === '') return []
  return raw
    .split(/\n+/)
    .flatMap(line => line.split(/\s*(?:→|->|⇒|➜)\s*/))
    .map(item => item.replace(/^\s*(?:[-*•]|第?\d+[.\u3001．:]|T\d+\s*[：:|｜])\s*/, '').trim())
    .filter(item => item.length >= 2)
    .slice(0, 16)
}

export function buildTicks(input: {
  start?: string
  beats: string[]
  durationSec: number
}): BlockingTick[] {
  const durationSec = clampDuration(input.durationSec)
  const start = (input.start ?? '').trim() || '开场状态'
  const beats = input.beats.filter(item => item.trim() !== '')
  const events = [start, ...beats]
  const last = events.length - 1
  return events.map((event, index) => {
    const atSec = last === 0 ? 0 : Math.round((durationSec * index / last) * 10) / 10
    const id = `T${index}`
    return {
      id,
      atSec,
      event,
      line: `${id} ${atSec.toFixed(1)}s｜${event}｜主体坐标待填｜物件待填｜CAM 待填`,
    }
  })
}

function classifyRef(label: string, kind: string): { role: BlockingRefRole; authority: string } {
  const blob = `${label} ${kind}`
  if (/台账|状态|T0|场面锁|作战/i.test(blob)) {
    return { role: 'state', authority: '分时刻空间状态。小格是不同时刻，禁止合成进成片。' }
  }
  if (/步法|动作拆|足形|合法动作/i.test(blob)) {
    return { role: 'action', authority: '合法动作顺序。足形/箭头/文字不要进成片。' }
  }
  if (/场景|空镜|场地|场馆|体育馆|court|set|establishing/i.test(blob)) {
    return { role: 'geometry', authority: '场地几何。图里的图解文字不要进成片。' }
  }
  if (/设定|定妆|三视|角色|人物|sheet/i.test(blob) || kind === 'character') {
    return { role: 'identity', authority: '只锁脸、体态、相对身高。集合站姿和白底不要进成片。' }
  }
  return { role: 'other', authority: '先声明它锁什么，再引用。' }
}

export async function harvestBlocking(outputDir: string): Promise<BlockingHarvest> {
  const [people, canvas, series] = await Promise.all([
    new CharacterStore(outputDir).list(),
    new DirectorxCanvasStore(outputDir).read(),
    activeSeries(outputDir),
  ])
  const existing = canvas.nodes.find(node =>
    node.id === BLOCKING_NODE_ID || node.continuityRules?.includes(BLOCKING_STAMP) === true,
  )
  const refs: BlockingRef[] = [
    ...people.filter(card => card.refPath !== '').map(card => {
      const role = classifyRef(card.name, 'character')
      return {
        role: role.role,
        path: card.refPath,
        label: card.name,
        authority: role.authority,
      }
    }),
    ...canvas.nodes
      .filter(node => (node.kind === 'image' || node.kind === 'video') && typeof node.path === 'string' && node.path !== '')
      .map(node => {
        const role = classifyRef(`${node.label} ${node.prompt ?? ''}`, node.kind)
        return {
          role: role.role,
          path: node.path ?? '',
          label: node.label || node.id,
          authority: role.authority,
          nodeId: node.id,
        }
      }),
  ]
  const seen = new Set<string>()
  const unique = refs.filter(item => {
    if (seen.has(item.path)) return false
    seen.add(item.path)
    return true
  }).slice(0, 16)
  return {
    title: (canvas.title ?? '场面控制表').slice(0, 40),
    ...(series !== undefined ? { series: series.name } : {}),
    roster: people.map(card => ({
      name: card.name,
      refPath: card.refPath,
      description: card.description,
    })),
    refs: unique,
    ...(existing !== undefined ? { existingNodeId: existing.id, existingPreview: existing.label.slice(0, 240) } : {}),
  }
}

export function blockingSchema(input: {
  harvest: BlockingHarvest
  start?: string
  beats?: string[]
  durationSec?: number
}): Record<string, unknown> {
  const beats = input.beats ?? []
  const durationSec = clampDuration(input.durationSec)
  const start = (input.start ?? '').trim()
  const ticks = buildTicks({ start, beats, durationSec })
  const missing: string[] = []
  if (input.harvest.roster.length === 0 && !input.harvest.refs.some(item => item.role === 'identity')) {
    missing.push('角色设定图：每人至少一张，背影会出镜的人单独再给一张背视')
  }
  if (start === '') missing.push('开场状态：谁持物、朝哪边、相机在哪一侧')
  if (beats.length === 0) missing.push('事件顺序：谁传给谁、中间几次接触、结束时物件在谁手里')
  return {
    ok: true,
    action: 'schema',
    stamp: BLOCKING_STAMP,
    durationSec,
    sections: SECTIONS,
    priority: PRIORITY,
    ticks,
    roster: input.harvest.roster,
    refs: input.harvest.refs,
    missing,
    ask: missing.length > 0,
    next: missing.length > 0
      ? ['directorx_ask 一次问清开场、事件顺序、时长', '补齐后再 directorx_blocking schema', '你写 Markdown 后 directorx_blocking pin']
      : ['按 sections 自己写成场面控制表 Markdown（台账坐标和状态机必须你填，不要交空骨架）', 'directorx_blocking pin', '再 prompt_plan / prompt_craft'],
    agentPrompt: [
      '场面控制表：用户只给角色图、开场和事件顺序。你补台账、状态机、相机和排除项。',
      missing.length > 0 ? `先问清：${missing.join('；')}` : '缺口已齐，写成 Markdown 再 pin。',
      `时长 ${durationSec}s。台账行：`,
      ...ticks.map(tick => tick.line),
      '优先级不可颠倒：台账 > 物件状态机 > 规则 > 相机 > 身份 > 好看。',
      '参考图要声明角色。状态图/动作图的线、箭头、文字禁止进成片。',
      '出画的人按台账轨道继续跑，禁止在新画角里另造一张同脸。',
      '不要生成。pin 之后才 craft。',
    ].join('\n'),
  }
}

function assertSheet(markdown: string): string {
  const body = markdown.trim()
  if (body.length < 200) throw new Error('场面控制表太短。把台账、状态机和参考角色写进 Markdown 再 pin。')
  if (!/场面台账|场面锁|^T0\b/m.test(body)) {
    throw new Error('场面控制表缺少场面台账（至少有 T0 行）。')
  }
  return body.slice(0, 8000)
}

export async function pinBlocking(input: {
  outputDir: string
  markdown: string
  title?: string
}): Promise<{ nodeId: string; path: string; preview: string }> {
  const markdown = assertSheet(input.markdown)
  const dir = join(resolveOutputDir(input.outputDir), 'docs')
  await mkdir(dir, { recursive: true })
  const path = join(dir, 'blocking.md')
  await writeFile(path, markdown, 'utf8')
  const canvas = new DirectorxCanvasStore(input.outputDir)
  const doc = await canvas.read()
  const existing = doc.nodes.find(node =>
    node.id === BLOCKING_NODE_ID || node.continuityRules?.includes(BLOCKING_STAMP) === true,
  )
  const lines = markdown.split('\n').length
  const height = Math.max(280, Math.min(820, 80 + lines * 16))
  const heading = (input.title ?? '场面控制表').slice(0, 40)
  const label = markdown.startsWith('#') ? markdown : `# ${heading}\n\n${markdown}`
  const nodeId = existing?.id ?? BLOCKING_NODE_ID
  if (existing !== undefined) {
    await canvas.update(nodeId, {
      label: label.slice(0, 8000),
      width: 560,
      height,
      continuityRules: [BLOCKING_STAMP],
    })
  } else {
    const maxBottom = doc.nodes.reduce((max, node) => Math.max(max, node.y + (node.height ?? 120)), 0)
    await canvas.addNode({
      id: nodeId,
      kind: 'text',
      label: label.slice(0, 8000),
      x: 48,
      y: maxBottom + 48,
      width: 560,
      height,
      continuityRules: [BLOCKING_STAMP],
    })
  }
  return { nodeId, path, preview: markdown.slice(0, 240) }
}

export async function showBlocking(outputDir: string): Promise<Record<string, unknown>> {
  const canvas = new DirectorxCanvasStore(outputDir)
  const doc = await canvas.read()
  const node = doc.nodes.find(item =>
    item.id === BLOCKING_NODE_ID || item.continuityRules?.includes(BLOCKING_STAMP) === true,
  )
  if (node === undefined) {
    return { ok: true, found: false, next: ['directorx_blocking harvest', 'directorx_blocking schema'] }
  }
  return {
    ok: true,
    found: true,
    nodeId: node.id,
    markdown: node.label,
    next: ['prompt_plan / prompt_craft 必须引用这份场面控制表', '不要把原句丢给 generate'],
  }
}

export async function runBlocking(input: {
  outputDir: string
  action?: string
  start?: string
  beats?: string
  durationSec?: number
  markdown?: string
  title?: string
}): Promise<Record<string, unknown>> {
  const action = input.action === 'schema' || input.action === 'pin' || input.action === 'show' || input.action === 'harvest'
    ? input.action
    : input.markdown !== undefined && input.markdown.trim() !== ''
      ? 'pin'
      : (input.start !== undefined && input.start.trim() !== '') || (input.beats !== undefined && input.beats.trim() !== '')
        ? 'schema'
        : 'harvest'
  if (action === 'show') return showBlocking(input.outputDir)
  if (action === 'pin') {
    const pinned = await pinBlocking({
      outputDir: input.outputDir,
      markdown: input.markdown ?? '',
      title: input.title,
    })
    return {
      ok: true,
      action,
      ...pinned,
      next: ['directorx_prompt_plan', 'directorx_prompt_craft（成稿必须引用场面台账，不要另起一套调度）', 'directorx_generate_ready'],
    }
  }
  const harvest = await harvestBlocking(input.outputDir)
  if (action === 'harvest') {
    return {
      ok: true,
      action,
      ...harvest,
      next: harvest.roster.length === 0
        ? ['先 directorx_character_register 或选中角色图', '再 schema']
        : ['directorx_ask 问开场和事件顺序（若用户还没给）', 'directorx_blocking schema'],
    }
  }
  return blockingSchema({
    harvest,
    start: input.start,
    beats: parseBeats(input.beats ?? ''),
    durationSec: input.durationSec,
  })
}
