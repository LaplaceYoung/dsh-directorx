import { CharacterStore } from './characters.ts'
import { DirectorxCanvasStore } from './canvas.ts'
import { detectNamedCharacters } from './generate-ready.ts'
import { activeSeries, formatLookBlock } from './series.ts'
import { ProjectStyleStore } from './style-constants.ts'

/**
 * Node-scoped revise plan. Does not generate. The agent still walks
 * craft → ready → generate and writes back only this node's path.
 */

export const REVISE_STAMP = '镜改'

export interface RevisePlan {
  ok: true
  nodeId: string
  kind: 'image' | 'video'
  label: string
  path?: string
  prompt: string
  change: string
  characters: string[]
  series?: string
  strategy: 'keyframe' | 'i2v'
  firstFrame?: string
  referenceImages: string[]
  neighbors: Array<{ id: string; label: string; shotIndex?: number }>
  next: string[]
  agentPrompt: string
  intentPrompt: string
}

function neighborShots(doc: { nodes: Array<{ id: string; label: string; shotIndex?: number; kind: string }> }, nodeId: string) {
  const media = doc.nodes
    .filter(node => node.kind === 'image' || node.kind === 'video')
    .slice()
    .sort((left, right) => (left.shotIndex ?? 1e9) - (right.shotIndex ?? 1e9))
  const index = media.findIndex(node => node.id === nodeId)
  return media
    .filter((_, offset) => offset === index - 1 || offset === index + 1)
    .map(node => ({
      id: node.id,
      label: node.label,
      ...(node.shotIndex !== undefined ? { shotIndex: node.shotIndex } : {}),
    }))
}

export async function planRevise(input: {
  outputDir: string
  nodeId: string
  change: string
}): Promise<RevisePlan> {
  const change = input.change.trim()
  if (change === '') throw new Error('改这一镜需要写出要改什么')
  const doc = await new DirectorxCanvasStore(input.outputDir).read()
  const node = doc.nodes.find(item => item.id === input.nodeId)
  if (node === undefined) throw new Error(`canvas node "${input.nodeId}" not found`)
  if (node.kind !== 'image' && node.kind !== 'video') {
    throw new Error('只改这一镜只接受图片或视频卡')
  }
  const people = await new CharacterStore(input.outputDir).list()
  const named = detectNamedCharacters(
    `${node.label} ${node.prompt ?? ''} ${change}`,
    { characters: people.map(card => ({ name: card.name, refPath: card.refPath })), nodes: [], edges: [] },
    node.characters ?? [],
  )
  const series = await activeSeries(input.outputDir)
  const style = await new ProjectStyleStore(input.outputDir).read()
  const refs = [
    ...(typeof node.path === 'string' && node.path !== '' && node.kind === 'image' ? [node.path] : []),
    ...people.filter(card => named.includes(card.name)).map(card => card.refPath),
  ].filter((path, index, all) => path !== '' && all.indexOf(path) === index)
  const firstFrame = node.kind === 'video' && typeof node.path === 'string' && node.path !== ''
    ? undefined
    : node.kind === 'image' && typeof node.path === 'string' && node.path !== ''
      ? node.path
      : undefined
  const strategy = node.kind === 'video' ? 'i2v' : 'keyframe'
  const look = formatLookBlock(series?.look ?? style)
  const basePrompt = (node.prompt ?? node.label).trim()
  const craftSeed = [
    basePrompt,
    `只改：${change}`,
    '其余身份、服装、光线、机位、场景锁住，不要重设计整片。',
    look,
    named.length > 0 ? `角色锚：${named.join('、')}` : '',
  ].filter(item => item !== '').join('\n')
  const next = [
    'directorx_note 记下这条改法',
    'directorx_prompt_plan',
    'directorx_prompt_craft（intent=改法，prompt=成稿，只覆盖这一镜）',
    `directorx_generate_ready nodeId:${node.id} strategy:${strategy}`,
    '严格/协同：directorx_propose + confirm',
    `generate_* 带 craftId+readyId，再 directorx_canvas_update ${node.id} 只改 path / shotStatus`,
  ]
  return {
    ok: true,
    nodeId: node.id,
    kind: node.kind,
    label: node.label,
    ...(typeof node.path === 'string' && node.path !== '' ? { path: node.path } : {}),
    prompt: craftSeed,
    change,
    characters: named,
    ...(series !== undefined ? { series: series.name } : {}),
    strategy,
    ...(firstFrame !== undefined ? { firstFrame } : {}),
    referenceImages: refs,
    neighbors: neighborShots(doc, node.id),
    next,
    agentPrompt: [
      `只改「${node.label}」（${node.id}）：${change}`,
      '不要重做整条片子，不要让用户再报一遍人设和画风。',
      named.length > 0 ? `锁角色：${named.join('、')}` : '这镜没有点名角色；有人就要补设定图。',
      series !== undefined ? `系列包 ${series.title} 已激活，沿用角色锚和风格锁。` : '没有系列包就读当前角色库和 style_get。',
      `成稿种子：${craftSeed.slice(0, 500)}`,
      '回写只改这一节点的 path。',
    ].join('\n'),
    intentPrompt: `${REVISE_STAMP} ${node.label}：${change}`,
  }
}
