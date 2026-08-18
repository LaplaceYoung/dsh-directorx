import { DirectorxCanvasStore, type CanvasDocument } from './canvas.ts'
import { durationFromPrompt } from './shotlist.ts'

/**
 * Turn a plaintext script into storyboard rows on the canvas.
 * Line classes follow the public Fountain screenplay markup
 * (scene headings, character cues, transitions) plus numbered
 * Chinese 场/镜 markers. No new node kind: text cards hold the script.
 */

export const SCRIPT_STARTER = `第一场 咖啡馆 日内
镜头1：近景，推门进来，5s
镜头2：过肩，店员抬头，3s
`

export const MAX_SCRIPT_SHOTS = 16
export const SCRIPT_STAMP_PREFIX = '剧本:'

export interface ScriptBeat {
  act: string
  index: number
  label: string
  prompt: string
  seconds: number
  characters: string[]
}

const SCENE_EN = /^(INT\.|EXT\.|EST\.|INT\.\/EXT\.|INT\/EXT\.|I\/E\.)\b/i
const SCENE_ZH = /^(第[0-9一二三四五六七八九十百]+场|场次\s*[0-9]+|[0-9]+\s*场)(?:\s|$|[：:])/
const SCENE_MD = /^#{1,3}\s+(.+)$/
const SHOT = /^(?:镜头|镜号|镜|Shot|SHOT|#)\s*[:：#]?\s*(\d+)?\s*[:：.]?\s*(.*)$/
const NUMBERED = /^(\d+)[\.、\)]\s+(.+)$/
const TRANSITION = /^(CUT TO:|FADE (?:IN|OUT):|DISSOLVE TO:|SMASH CUT:|切到|淡出|淡入)/i
const TITLE_KEY = /^(Title|Credit|Author|Authors|Source|Draft date|Contact|标题|作者)\s*:/i
const CHAR_EN = /^[A-Z][A-Z0-9 #.'\-]{1,40}(?:\s*\([^)]{1,24}\))?$/
const CHAR_ZH = /^([\u4e00-\u9fffA-Za-z][\u4e00-\u9fffA-Za-z0-9·\s]{0,16})\s*(?:\([^)]{1,16}\))?\s*[:：]\s*(.*)$/
const PAREN = /^\(.*\)$/

export function parseScriptBeats(raw: string, options: { maxShots?: number } = {}): ScriptBeat[] {
  const cap = Math.max(1, Math.min(MAX_SCRIPT_SHOTS, options.maxShots ?? MAX_SCRIPT_SHOTS))
  const text = raw.replace(/\r\n/g, '\n').trim()
  if (text.length < 4) return []
  const lines = text.split('\n')
  let cursor = 0
  while (cursor < lines.length && TITLE_KEY.test((lines[cursor] ?? '').trim())) cursor += 1
  if (cursor > 0) {
    while (cursor < lines.length && (lines[cursor] ?? '').trim() === '') cursor += 1
  }

  const structured = parseStructured(lines.slice(cursor), cap)
  if (structured.length > 0) return structured
  return parseParagraphs(lines.slice(cursor).join('\n'), cap)
}

function parseStructured(lines: string[], cap: number): ScriptBeat[] {
  const beats: ScriptBeat[] = []
  let act = '第一场'
  let actCount = 0
  let sawMarker = false
  let draft: { prompt: string[]; characters: string[]; label?: string } | undefined
  let last: 'blank' | 'character' | 'other' = 'blank'

  const flush = (): void => {
    if (draft === undefined) return
    const prompt = draft.prompt.map(line => line.trim()).filter(line => line !== '').join('\n').trim()
    if (prompt === '') {
      draft = undefined
      return
    }
    if (beats.length >= cap) {
      draft = undefined
      return
    }
    const index = beats.length + 1
    const seconds = Math.min(15, durationFromPrompt(prompt, 5))
    beats.push({
      act,
      index,
      label: (draft.label ?? `镜${index}`).slice(0, 40),
      prompt: prompt.slice(0, 2000),
      seconds,
      characters: uniqueNames(draft.characters),
    })
    draft = undefined
  }

  const startBeat = (label?: string): void => {
    flush()
    draft = { prompt: [], characters: [], ...(label !== undefined ? { label } : {}) }
  }

  const ensureBeat = (): NonNullable<typeof draft> => {
    if (draft === undefined) startBeat()
    return draft as NonNullable<typeof draft>
  }

  for (const raw of lines) {
    const line = raw.trim()
    if (line === '') {
      last = 'blank'
      continue
    }
    if (TRANSITION.test(line)) {
      flush()
      last = 'other'
      continue
    }
    const md = SCENE_MD.exec(line)
    if (SCENE_EN.test(line) || SCENE_ZH.test(line) || md !== null) {
      flush()
      sawMarker = true
      actCount += 1
      act = (md?.[1] ?? line.replace(/^#+\s*/, '')).slice(0, 40) || `第${actCount}场`
      last = 'other'
      continue
    }
    const shot = SHOT.exec(line)
    if (shot !== null) {
      const rest = (shot[2] ?? '').trim()
      const num = shot[1] !== undefined && shot[1] !== '' ? shot[1] : String(beats.length + 1)
      sawMarker = true
      startBeat(`镜${num}`)
      if (rest !== '') ensureBeat().prompt.push(rest)
      last = 'other'
      continue
    }
    const numbered = NUMBERED.exec(line)
    if (numbered !== null && looksLikeShot(numbered[2] ?? '')) {
      sawMarker = true
      startBeat(`镜${numbered[1]}`)
      ensureBeat().prompt.push((numbered[2] ?? '').trim())
      last = 'other'
      continue
    }
    const spoken = CHAR_ZH.exec(line)
    if (spoken !== null) {
      const name = (spoken[1] ?? '').trim()
      const speech = (spoken[2] ?? '').trim()
      const beat = ensureBeat()
      if (name !== '') beat.characters.push(name)
      beat.prompt.push(speech === '' ? name : `${name}：${speech}`)
      last = speech === '' ? 'character' : 'other'
      continue
    }
    if (CHAR_EN.test(line) && !SCENE_EN.test(line) && !TRANSITION.test(line)) {
      const name = line.replace(/\s*\([^)]*\)\s*$/, '').trim()
      const beat = ensureBeat()
      beat.characters.push(name)
      last = 'character'
      continue
    }
    if (last === 'character' || PAREN.test(line)) {
      ensureBeat().prompt.push(line)
      last = PAREN.test(line) ? 'character' : 'other'
      continue
    }
    ensureBeat().prompt.push(line)
    last = 'other'
  }
  flush()
  if (!sawMarker) return []
  return beats
}

function parseParagraphs(text: string, cap: number): ScriptBeat[] {
  const blocks = text.split(/\n{2,}/).map(block => block.trim()).filter(block => block.length >= 4)
  return blocks.slice(0, cap).map((block, index) => ({
    act: '第一场',
    index: index + 1,
    label: `镜${index + 1}`,
    prompt: block.slice(0, 2000),
    seconds: Math.min(15, durationFromPrompt(block, 5)),
    characters: [],
  }))
}

function looksLikeShot(body: string): boolean {
  return /近景|远景|特写|过肩|全景|中景|推|拉|摇|移|跟|俯|仰|室内|室外|s\b|秒/i.test(body) || body.length >= 6
}

function uniqueNames(names: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const name of names) {
    const trimmed = name.trim().slice(0, 80)
    if (trimmed.length < 2 || seen.has(trimmed)) continue
    seen.add(trimmed)
    out.push(trimmed)
    if (out.length >= 8) break
  }
  return out
}

function newRowId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export function scriptTextOf(node: { label?: string; prompt?: string }): string {
  const label = typeof node.label === 'string' ? node.label : ''
  const prompt = typeof node.prompt === 'string' ? node.prompt : ''
  if (label.length >= prompt.length) return [label, label === prompt ? '' : prompt].filter(Boolean).join('\n')
  return [label, prompt].filter(Boolean).join('\n')
}

export function alreadyScripted(doc: CanvasDocument, sourceId: string): boolean {
  const stamp = `${SCRIPT_STAMP_PREFIX}${sourceId}`
  return doc.nodes.some(node => node.continuityRules?.includes(stamp) === true)
}

export async function applyScriptRows(input: {
  store: DirectorxCanvasStore
  text?: string
  nodeId?: string
  origin?: { x: number; y: number }
}): Promise<{
  action: 'script'
  reused: boolean
  sourceId: string
  beats: ScriptBeat[]
  nodeIds: string[]
  groupIds: string[]
  doc: CanvasDocument
}> {
  const store = input.store
  let doc = await store.read()
  let sourceId = typeof input.nodeId === 'string' ? input.nodeId : ''
  let source = sourceId !== '' ? doc.nodes.find(node => node.id === sourceId) : undefined
  if (sourceId !== '' && source === undefined) throw new Error(`canvas node "${sourceId}" not found`)
  if (source !== undefined && source.kind !== 'text') throw new Error('铺成分镜行只接受文本/剧本节点')

  const provided = typeof input.text === 'string' ? input.text.trim() : ''
  const fromNode = source !== undefined ? scriptTextOf(source).trim() : ''
  const text = provided !== '' ? provided : fromNode
  if (text.length < 8) throw new Error('先写几场戏或几条镜头，再铺成分镜行')

  if (source === undefined) {
    doc = await store.addNode({
      kind: 'text',
      label: text.slice(0, 8000),
      prompt: text.slice(0, 2000),
      x: input.origin?.x ?? 48,
      y: input.origin?.y ?? 48,
      width: 280,
      height: 200,
    })
    source = doc.nodes[doc.nodes.length - 1]
    sourceId = source.id
  } else if (provided !== '' && provided !== fromNode) {
    doc = await store.update(source.id, { label: provided.slice(0, 8000) })
    source = doc.nodes.find(node => node.id === sourceId)
  }
  if (source === undefined) throw new Error('剧本节点写入失败')

  if (alreadyScripted(doc, sourceId)) {
    const stamp = `${SCRIPT_STAMP_PREFIX}${sourceId}`
    const nodeIds = doc.nodes.filter(node => node.continuityRules?.includes(stamp) === true).map(node => node.id)
    const groupIds = doc.nodes.filter(node => node.kind === 'group' && nodeIds.includes(node.id)).map(node => node.id)
    return { action: 'script', reused: true, sourceId, beats: parseScriptBeats(text), nodeIds, groupIds, doc }
  }

  const beats = parseScriptBeats(text)
  if (beats.length === 0) throw new Error('没有拆出镜头。用「镜头1：」或空行分段再试')

  const stamp = `${SCRIPT_STAMP_PREFIX}${sourceId}`
  const originX = input.origin?.x ?? source.x
  const originY = input.origin?.y ?? source.y + (source.height ?? 200) + 64
  let shotNumber = doc.nodes.reduce((max, node) => Math.max(max, node.shotIndex ?? 0), 0)
  const nodes: Array<Record<string, unknown>> = []
  const edges: Array<Record<string, unknown>> = []
  const nodeIds: string[] = []
  const groupIds: string[] = []
  const videoIds: string[] = []
  const cardW = 280
  const cardH = 158
  const gap = 20
  const padX = 36
  const padY = 56
  const groupW = padX * 2 + 3 * cardW + 2 * gap
  const groupH = padY + cardH + 32

  beats.forEach((beat, index) => {
    shotNumber += 1
    const groupId = newRowId('group')
    const textId = newRowId('text')
    const stillId = newRowId('image')
    const shotId = newRowId('video')
    const y = originY + index * (groupH + 48)
    groupIds.push(groupId)
    nodeIds.push(groupId, textId, stillId, shotId)
    videoIds.push(shotId)
    nodes.push({
      id: groupId,
      kind: 'group',
      label: `${beat.act} · ${beat.label}`.slice(0, 200),
      x: originX,
      y,
      width: groupW,
      height: groupH,
      continuityRules: [stamp],
    })
    const rowY = y + padY
    nodes.push({
      id: textId,
      kind: 'text',
      label: beat.prompt.slice(0, 8000),
      prompt: beat.prompt,
      parent: groupId,
      x: originX + padX,
      y: rowY,
      width: cardW,
      height: 120,
      shotIndex: shotNumber,
      shotStatus: 'idea',
      continuityRules: [stamp],
      ...(beat.characters.length > 0 ? { characters: beat.characters } : {}),
    })
    nodes.push({
      id: stillId,
      kind: 'image',
      label: `${beat.label} 首帧`.slice(0, 200),
      prompt: beat.prompt,
      parent: groupId,
      x: originX + padX + cardW + gap,
      y: rowY,
      width: cardW,
      height: cardH,
      shotIndex: shotNumber,
      shotStatus: 'idea',
      continuityRules: [stamp],
      ...(beat.characters.length > 0 ? { characters: beat.characters } : {}),
    })
    nodes.push({
      id: shotId,
      kind: 'video',
      label: beat.label.slice(0, 200),
      prompt: beat.seconds > 0 ? `${beat.prompt}, ${beat.seconds}s` : beat.prompt,
      parent: groupId,
      x: originX + padX + 2 * (cardW + gap),
      y: rowY,
      width: cardW,
      height: cardH,
      shotIndex: shotNumber,
      shotStatus: 'idea',
      durationSec: beat.seconds,
      continuityRules: [stamp],
      ...(beat.characters.length > 0 ? { characters: beat.characters } : {}),
    })
    edges.push({ from: textId, to: stillId, label: '本' }, { from: stillId, to: shotId, label: '首帧' })
  })
  for (let index = 0; index < videoIds.length - 1; index += 1) {
    edges.push({ from: videoIds[index], to: videoIds[index + 1], label: '承接' })
  }

  const next = await store.batchAdd({ nodes, edges })
  return { action: 'script', reused: false, sourceId, beats, nodeIds, groupIds, doc: next }
}
