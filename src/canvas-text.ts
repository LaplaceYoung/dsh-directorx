import { DirectorxCanvasStore } from './canvas.ts'
import type { CharacterCard } from './characters.ts'

export const CAST_STAMP_PREFIX = '人物设定:'
export const SCRIPT_CARD_STAMP = '剧本卡:'
export const STORYBOARD_STAMP = '分镜表'

export function slugStamp(value: string): string {
  const slug = value.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '')
  return slug.slice(0, 40) || 'card'
}

export function formatCharacterSetting(card: Pick<CharacterCard, 'name' | 'description' | 'refPath'> & {
  outfit?: string
  props?: string
}): string {
  const lines = [
    `人物设定：${card.name}`,
    '',
    `外貌：${card.description.trim() !== '' ? card.description.trim() : '（未写）'}`,
  ]
  if (card.outfit !== undefined && card.outfit.trim() !== '') lines.push(`服装：${card.outfit.trim()}`)
  if (card.props !== undefined && card.props.trim() !== '') lines.push(`道具：${card.props.trim()}`)
  if (card.refPath.trim() !== '') lines.push(`参考图：${card.refPath.trim()}`)
  return lines.join('\n')
}

export function formatStoryboardText(plan: {
  totalSeconds: number
  shots: Array<{
    id: string
    description: string
    seconds: number
    cameraShot?: string
    angle?: string
    movement?: string
    dialogue?: string
  }>
  issues?: string[]
}): string {
  const lines = [`分镜表 · ${plan.totalSeconds}s`, '']
  for (const shot of plan.shots) {
    lines.push(`${shot.id} · ${shot.seconds}s`)
    if (shot.description.trim() !== '') lines.push(shot.description.trim())
    const camera = [shot.cameraShot, shot.angle, shot.movement].filter(part => part !== undefined && part !== '')
    if (camera.length > 0) lines.push(camera.join(' / '))
    if (shot.dialogue !== undefined && shot.dialogue.trim() !== '') lines.push(`对白：${shot.dialogue.trim()}`)
    lines.push('')
  }
  if ((plan.issues ?? []).length > 0) {
    lines.push('问题')
    for (const issue of plan.issues ?? []) lines.push(`- ${issue}`)
  }
  return lines.join('\n').trim()
}

export async function pinTextCard(input: {
  store: DirectorxCanvasStore
  stamp: string
  body: string
  id?: string
  width?: number
}): Promise<{ nodeId: string; reused: boolean }> {
  const body = input.body.trim()
  if (body === '') throw new Error('文本卡不能为空')
  const doc = await input.store.read()
  const existing = (input.id !== undefined ? doc.nodes.find(node => node.id === input.id) : undefined)
    ?? doc.nodes.find(node => node.kind === 'text' && node.continuityRules?.includes(input.stamp) === true)
  const lines = body.split('\n').length
  const height = Math.max(180, Math.min(720, 72 + lines * 18))
  const width = input.width ?? 420
  if (existing !== undefined) {
    await input.store.update(existing.id, {
      label: body.slice(0, 8000),
      prompt: body.slice(0, 2000),
      width,
      height,
      continuityRules: [...new Set([...(existing.continuityRules ?? []), input.stamp])].slice(0, 5),
    })
    return { nodeId: existing.id, reused: true }
  }
  const maxBottom = doc.nodes.reduce((max, node) => Math.max(max, node.y + (node.height ?? 120)), 0)
  const nodeId = input.id ?? `text-${slugStamp(input.stamp)}`
  await input.store.addNode({
    id: nodeId,
    kind: 'text',
    label: body.slice(0, 8000),
    prompt: body.slice(0, 2000),
    x: 48,
    y: doc.nodes.length === 0 ? 48 : maxBottom + 48,
    width,
    height,
    continuityRules: [input.stamp],
  })
  return { nodeId, reused: false }
}

export async function pinCharacterSetting(
  outputDir: string,
  card: CharacterCard,
): Promise<{ nodeId: string; reused: boolean } | undefined> {
  try {
    return await pinTextCard({
      store: new DirectorxCanvasStore(outputDir),
      stamp: `${CAST_STAMP_PREFIX}${card.name}`,
      body: formatCharacterSetting(card),
      id: `cast-${slugStamp(card.name)}`,
      width: 360,
    })
  } catch {
    return undefined
  }
}
