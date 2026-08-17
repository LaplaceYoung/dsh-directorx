import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { resolveOutputDir } from './support.ts'
import { isThinPrompt } from './prompt-craft.ts'
import { wantsCharacterSheet } from './providers/sheet-prompt.ts'
import { CharacterStore } from './characters.ts'
import { DirectorxCanvasStore } from './canvas.ts'

export type GenerateReadyKind = 'image' | 'video'
export type GenerateStrategy =
  | 'character-sheet'
  | 'scene-still'
  | 'keyframe'
  | 't2i'
  | 't2v'
  | 'i2v'
  | 'fl2v'
  | 'ref2v'

export type ReadyNeed = 'character-sheet' | 'scene-still' | 'first-frame' | 'last-frame' | 'keyframe' | 'detailed-prompt'

export interface ReadyAskOption { label: string; description?: string }
export interface ReadyAsk {
  id: string
  question: string
  header?: string
  detail?: string
  recommended?: string
  options: ReadyAskOption[]
}

export interface ReadyItem {
  need: ReadyNeed
  ok: boolean
  detail: string
  path?: string
  name?: string
}

export interface ReadySnapshotNode {
  id: string
  kind: string
  label: string
  path?: string
  characters?: string[]
  shotIndex?: number
  prompt?: string
}

export interface ReadySnapshot {
  characters: Array<{ name: string; refPath: string; description?: string }>
  nodes: ReadySnapshotNode[]
  edges: Array<{ from: string; to: string }>
}

export interface AssessReadyInput {
  kind: GenerateReadyKind
  intent: string
  prompt: string
  craftId?: string
  nodeId?: string
  sourceId?: string
  characters?: string[]
  scenes?: string[]
  strategy?: GenerateStrategy
  firstFrame?: string
  lastFrame?: string
  referenceImages?: string[]
  waivers?: string[]
  snapshot: ReadySnapshot
}

export interface ReadyBind {
  strategy: GenerateStrategy
  characters: string[]
  firstFrame?: string
  lastFrame?: string
  sceneRefs: string[]
  referenceImages: string[]
}

export interface ReadyReport {
  verdict: 'ready' | 'blocked'
  strategy: GenerateStrategy
  needs: ReadyNeed[]
  present: ReadyItem[]
  missing: ReadyItem[]
  namedCharacters: string[]
  bind: ReadyBind
  next: string[]
  ask: ReadyAsk[]
  reason: string
}

export interface GenerateReadyBrief {
  id: string
  craftId: string
  kind: GenerateReadyKind
  strategy: GenerateStrategy
  intent: string
  prompt: string
  bind: ReadyBind
  at: number
}

const FILE = 'generate-ready.json'
const MAX = 80
const FRESH_MS = 2 * 60 * 60 * 1000

const STRATEGIES = new Set<GenerateStrategy>([
  'character-sheet', 'scene-still', 'keyframe', 't2i', 't2v', 'i2v', 'fl2v', 'ref2v',
])

const PERSON_LOCK = /同一人|同一张脸|人物一致|角色一致|定妆|女主|男主|主角(?!线)|人物设定/
const PERSON_WORD = /人物|角色|女孩|男孩|女人|男人|士兵|将军|民夫|工人|侠客/
const SCENE_HINT = /空镜|场景图|场景设定|建立镜头|establishing|scene.?still|场景参考/
const KEYFRAME_HINT = /关键帧|keyframe|首帧静帧|尾帧静帧/
const I2V_HINT = /图生视频|i2v|image.to.video|用这张|以这张|这张图动/
const FL_HINT = /首尾帧|first.+last|尾帧|last.?frame|从.+过渡到|转场到/
const SHEET_NODE = /设定|三视图|定妆|turnaround|sheet|角色卡/

export function parseStrategy(value: unknown): GenerateStrategy | undefined {
  return typeof value === 'string' && STRATEGIES.has(value as GenerateStrategy) ? value as GenerateStrategy : undefined
}

function hasPath(value?: string): value is string {
  return typeof value === 'string' && value.trim() !== ''
}

function blob(input: AssessReadyInput): string {
  return `${input.intent}\n${input.prompt}`
}

export function detectNamedCharacters(text: string, snapshot: ReadySnapshot, extra: string[] = []): string[] {
  const found = new Set<string>()
  for (const name of extra) {
    const trimmed = name.trim()
    if (trimmed !== '') found.add(trimmed)
  }
  const catalog = [
    ...snapshot.characters.map(card => card.name),
    ...snapshot.nodes.flatMap(node => node.characters ?? []),
  ]
  for (const name of catalog) {
    const trimmed = name.trim()
    if (trimmed.length >= 2 && text.includes(trimmed)) found.add(trimmed)
  }
  for (const node of snapshot.nodes) {
    if (!SHEET_NODE.test(node.label)) continue
    const hit = node.label.replace(SHEET_NODE, ' ').trim().split(/[\s·\-_/]+/).find(part => part.length >= 2)
    if (hit !== undefined && text.includes(hit)) found.add(hit)
  }
  return [...found]
}

function nodeById(snapshot: ReadySnapshot, id?: string): ReadySnapshotNode | undefined {
  if (id === undefined || id === '') return undefined
  return snapshot.nodes.find(node => node.id === id)
}

function previousMedia(input: AssessReadyInput): ReadySnapshotNode | undefined {
  const source = nodeById(input.snapshot, input.sourceId)
  if (source !== undefined && (source.kind === 'image' || source.kind === 'video')) return source
  const self = nodeById(input.snapshot, input.nodeId)
  if (self !== undefined) {
    const inbound = input.snapshot.edges.find(edge => edge.to === self.id)
    const from = inbound !== undefined ? nodeById(input.snapshot, inbound.from) : undefined
    if (from !== undefined && (from.kind === 'image' || from.kind === 'video')) return from
  }
  const media = input.snapshot.nodes
    .filter(node => (node.kind === 'image' || node.kind === 'video') && node.id !== input.nodeId && hasPath(node.path))
    .sort((left, right) => (right.shotIndex ?? -1) - (left.shotIndex ?? -1))
  return media[0]
}

function sheetHit(name: string, snapshot: ReadySnapshot): ReadySnapshotNode | undefined {
  return snapshot.nodes.find(node => {
    if (!hasPath(node.path)) return false
    const labeled = node.label.includes(name)
    const tagged = (node.characters ?? []).includes(name)
    return (SHEET_NODE.test(node.label) || tagged) && (labeled || tagged)
  })
}

function sceneHit(name: string, snapshot: ReadySnapshot): ReadySnapshotNode | undefined {
  return snapshot.nodes.find(node =>
    node.kind === 'image' && hasPath(node.path) && (node.label.includes(name) || SCENE_HINT.test(node.label))
  )
}

export function classifyGenerateStrategy(input: AssessReadyInput): GenerateStrategy {
  const declared = parseStrategy(input.strategy)
  const text = blob(input)
  if (input.kind === 'image') {
    if (declared === 'character-sheet' || wantsCharacterSheet(text)) return 'character-sheet'
    if (declared === 'keyframe' || KEYFRAME_HINT.test(text)) return 'keyframe'
    if (declared === 'scene-still' || SCENE_HINT.test(text)) return 'scene-still'
    return 't2i'
  }
  if (declared === 'fl2v' || (hasPath(input.firstFrame) && hasPath(input.lastFrame)) || FL_HINT.test(text)) return 'fl2v'
  const source = previousMedia(input)
  if (declared === 'i2v' || hasPath(input.firstFrame) || I2V_HINT.test(text)) return 'i2v'
  if (source?.kind === 'image' && hasPath(source.path)) return 'i2v'
  if (source?.kind === 'video' && hasPath(source.path)) return 'i2v'
  if (declared === 'ref2v') return 'ref2v'
  const names = detectNamedCharacters(text, input.snapshot, input.characters)
  if (names.length > 0 && snapshotHasCharacterRef(names, input.snapshot) && !hasPath(input.firstFrame)) return 'ref2v'
  if (declared === 't2v') return 't2v'
  return 't2v'
}

function snapshotHasCharacterRef(names: string[], snapshot: ReadySnapshot): boolean {
  return names.some(name => {
    const card = snapshot.characters.find(item => item.name === name)
    return (card !== undefined && hasPath(card.refPath)) || sheetHit(name, snapshot) !== undefined
  })
}

function needsFor(strategy: GenerateStrategy, names: string[], input: AssessReadyInput): ReadyNeed[] {
  const needs: ReadyNeed[] = ['detailed-prompt']
  if (strategy === 'character-sheet' || strategy === 'scene-still') return needs
  if (strategy === 'keyframe' && names.length > 0) needs.push('character-sheet')
  if (strategy === 't2i' && names.length > 0) needs.push('character-sheet')
  if (strategy === 't2v') {
    if (names.length > 0 || PERSON_LOCK.test(blob(input))) {
      needs.push('character-sheet')
      needs.push('first-frame')
    }
  }
  if (strategy === 'ref2v') needs.push('character-sheet')
  if (strategy === 'i2v') {
    needs.push('first-frame')
    if (names.length > 0) needs.push('character-sheet')
  }
  if (strategy === 'fl2v') {
    needs.push('first-frame', 'last-frame')
    if (names.length > 0) needs.push('character-sheet')
  }
  if ((input.scenes ?? []).length > 0) needs.push('scene-still')
  return [...new Set(needs)]
}

function waived(input: AssessReadyInput, need: ReadyNeed): boolean {
  return (input.waivers ?? []).includes(need)
}

function resolveNeed(need: ReadyNeed, input: AssessReadyInput, names: string[]): ReadyItem {
  if (need === 'detailed-prompt') {
    const thin = isThinPrompt(input.intent, input.prompt)
    if (thin !== undefined) return { need, ok: false, detail: thin }
    return { need, ok: true, detail: '成稿有镜头语言，不是用户原句' }
  }
  if (need === 'character-sheet') {
    if (names.length === 0) {
      if (PERSON_LOCK.test(blob(input)) || PERSON_WORD.test(blob(input))) {
        return { need, ok: false, detail: '提示词里有人，但没点名要锁谁。先登记或出设定图。' }
      }
      return { need, ok: true, detail: '这镜不锁固定人物' }
    }
    const hits: string[] = []
    const missing: string[] = []
    for (const name of names) {
      const card = input.snapshot.characters.find(item => item.name === name)
      const sheet = sheetHit(name, input.snapshot)
      if (card !== undefined && hasPath(card.refPath)) hits.push(`${name}←角色库`)
      else if (sheet !== undefined) hits.push(`${name}←${sheet.id}`)
      else missing.push(name)
    }
    if (missing.length === 0) return { need, ok: true, detail: hits.join('；'), name: names.join('、') }
    if (waived(input, need) && missing.every(name => input.snapshot.characters.every(card => card.name !== name))) {
      return { need, ok: true, detail: `用户确认本镜不锁 ${missing.join('、')}` }
    }
    return { need, ok: false, detail: `缺设定图/角色卡：${missing.join('、')}`, name: missing.join('、') }
  }
  if (need === 'scene-still') {
    const scenes = (input.scenes ?? []).map(name => name.trim()).filter(name => name !== '')
    if (scenes.length === 0) return { need, ok: true, detail: '未指定要锁的场景' }
    const missing = scenes.filter(name => sceneHit(name, input.snapshot) === undefined && !(input.referenceImages ?? []).some(hasPath))
    if (missing.length === 0) {
      const hit = sceneHit(scenes[0], input.snapshot)
      return { need, ok: true, detail: `场景参考 ${scenes.join('、')}`, path: hit?.path, name: scenes.join('、') }
    }
    if (waived(input, need)) return { need, ok: true, detail: '用户确认先不锁场景' }
    return { need, ok: false, detail: `缺场景静帧：${missing.join('、')}`, name: missing.join('、') }
  }
  if (need === 'first-frame') {
    if (hasPath(input.firstFrame)) return { need, ok: true, detail: '已提供首帧', path: input.firstFrame }
    const source = previousMedia(input)
    if (source?.kind === 'image' && hasPath(source.path)) {
      return { need, ok: true, detail: `用节点 ${source.id} 当首帧`, path: source.path, name: source.id }
    }
    if (source?.kind === 'video' && hasPath(source.path)) {
      return {
        need,
        ok: false,
        detail: `上一镜 ${source.id} 是视频，先 directorx_extract_frames 抽末帧再当首帧`,
        path: source.path,
        name: source.id,
      }
    }
    const key = input.snapshot.nodes.find(node => hasPath(node.path) && node.kind === 'image' && KEYFRAME_HINT.test(node.label))
    if (key !== undefined) return { need, ok: true, detail: `用关键帧 ${key.id}`, path: key.path, name: key.id }
    if (waived(input, need) && input.strategy === 't2v') return { need, ok: true, detail: '用户确认纯文生、不锁首帧' }
    return { need, ok: false, detail: '视频要首帧（关键帧、上一镜末帧或已有静帧）' }
  }
  if (need === 'last-frame') {
    if (hasPath(input.lastFrame)) return { need, ok: true, detail: '已提供尾帧', path: input.lastFrame }
    if (waived(input, need)) return { need, ok: true, detail: '用户确认不做首尾帧' }
    return { need, ok: false, detail: '首尾帧策略缺尾帧静帧' }
  }
  if (need === 'keyframe') {
    const key = input.snapshot.nodes.find(node => hasPath(node.path) && KEYFRAME_HINT.test(node.label))
    if (key !== undefined) return { need, ok: true, detail: `关键帧 ${key.id}`, path: key.path }
    if (hasPath(input.firstFrame)) return { need, ok: true, detail: '首帧可当关键帧', path: input.firstFrame }
    return { need, ok: false, detail: '复杂动作缺关键帧静帧' }
  }
  return { need, ok: false, detail: `未知需求 ${need}` }
}

function buildAsk(report: Omit<ReadyReport, 'ask' | 'next' | 'reason'> & { input: AssessReadyInput }): ReadyAsk[] {
  const cards: ReadyAsk[] = []
  const missingNeeds = new Set(report.missing.map(item => item.need))
  if (report.input.kind === 'video' && (missingNeeds.has('first-frame') || missingNeeds.has('character-sheet') || report.strategy === 't2v')) {
    cards.push({
      id: 'strategy',
      header: '这段视频怎么生成',
      question: '信息和参考还不够。选一条路，缺的资产先补再生成。',
      recommended: missingNeeds.has('character-sheet') ? '先出人物设定图，再图生视频' : '抽上一镜末帧做首帧',
      options: [
        { label: '先出人物设定图，再图生视频', description: '锁长相：16:9 设定表 → 关键帧 → 图生视频' },
        { label: '抽上一镜末帧做首帧', description: '承接上一镜，extract_frames 后 i2v' },
        { label: '先出本镜关键帧，再图生视频', description: '本镜先静帧，再让它动' },
        { label: '首尾帧过渡', description: '已有或先做两张静帧' },
        { label: '用已登记角色参考生视频', description: '有角色卡、不必锁某一帧' },
        ...(report.namedCharacters.some(name => report.input.snapshot.characters.some(card => card.name === name))
          ? []
          : [{ label: '纯文生视频，不锁长相', description: '没有要认的人/场景才选' }]),
      ],
    })
  }
  if (missingNeeds.has('character-sheet')) {
    const who = report.missing.find(item => item.need === 'character-sheet')?.name ?? '人物'
    cards.push({
      id: 'cast',
      header: '人物参考',
      question: `${who} 用哪张设定图？没有就先生成设定表。`,
      recommended: '先按 novel-characters 出 16:9 设定表',
      options: [
        { label: '先按 novel-characters 出 16:9 设定表', description: '左栏半身基准 + 右栏正侧背' },
        { label: '使用画布上已有设定/定妆节点', description: 'directorx_character_register 挂上' },
        { label: '这镜不出现固定角色', description: '群像/背影/空镜才选' },
      ],
    })
  }
  if (missingNeeds.has('last-frame')) {
    cards.push({
      id: 'tail',
      header: '尾帧',
      question: '首尾帧还缺尾帧。',
      recommended: '先出尾帧静帧',
      options: [
        { label: '先出尾帧静帧', description: '再 fl2v' },
        { label: '改成只锁首帧的图生视频', description: '不做尾帧' },
      ],
    })
  }
  return cards.slice(0, 6)
}

function buildNext(report: ReadyReport): string[] {
  const next: string[] = []
  for (const item of report.missing) {
    if (item.need === 'detailed-prompt') next.push('回到 directorx_prompt_craft，把景别/运镜/光/环境写进成稿')
    if (item.need === 'character-sheet') {
      next.push('directorx_skill_read novel-characters')
      next.push('先 directorx_generate_ready strategy=character-sheet 再 generate_image 出设定表')
      next.push('出图后 directorx_character_register')
    }
    if (item.need === 'first-frame' && item.path !== undefined && item.detail.includes('extract_frames')) {
      next.push(`directorx_extract_frames source=${item.path}（取末帧）`)
    } else if (item.need === 'first-frame') {
      next.push('先 generate_image strategy=keyframe 出本镜首帧，或指定 firstFrame')
    }
    if (item.need === 'last-frame') next.push('先 generate_image 出尾帧静帧，再 ready strategy=fl2v')
    if (item.need === 'scene-still') next.push('先 generate_image strategy=scene-still 出场景空镜')
    if (item.need === 'keyframe') next.push('先 generate_image strategy=keyframe')
  }
  if (report.verdict === 'ready') {
    next.push('严格/协同：directorx_propose 带 craftId+readyId；生成必须带同一个 readyId')
  } else {
    next.push('用提问卡 directorx_ask 让用户选路，补资产后再 directorx_generate_ready commit:true')
  }
  return [...new Set(next)]
}

function collectBind(input: AssessReadyInput, strategy: GenerateStrategy, present: ReadyItem[], names: string[]): ReadyBind {
  const first = present.find(item => item.need === 'first-frame')?.path ?? (hasPath(input.firstFrame) ? input.firstFrame : undefined)
  const last = present.find(item => item.need === 'last-frame')?.path ?? (hasPath(input.lastFrame) ? input.lastFrame : undefined)
  const sceneRefs = (input.scenes ?? [])
    .map(name => sceneHit(name, input.snapshot)?.path)
    .filter((path): path is string => hasPath(path))
  const sheets = names
    .map(name => input.snapshot.characters.find(card => card.name === name)?.refPath ?? sheetHit(name, input.snapshot)?.path)
    .filter((path): path is string => hasPath(path))
  const referenceImages = [...new Set([
    ...(input.referenceImages ?? []).filter(hasPath),
    ...sheets,
    ...sceneRefs,
  ])]
  return {
    strategy,
    characters: names,
    ...(first !== undefined ? { firstFrame: first } : {}),
    ...(last !== undefined ? { lastFrame: last } : {}),
    sceneRefs,
    referenceImages,
  }
}

export function assessGenerateReady(input: AssessReadyInput): ReadyReport {
  const strategy = classifyGenerateStrategy(input)
  const namedCharacters = detectNamedCharacters(blob(input), input.snapshot, input.characters)
  const needs = needsFor(strategy, namedCharacters, input)
  const items = needs.map(need => resolveNeed(need, input, namedCharacters))
  const present = items.filter(item => item.ok)
  const missing = items.filter(item => !item.ok)
  const bind = collectBind(input, strategy, present, namedCharacters)
  const draft: ReadyReport = {
    verdict: missing.length === 0 ? 'ready' : 'blocked',
    strategy,
    needs,
    present,
    missing,
    namedCharacters,
    bind,
    next: [],
    ask: [],
    reason: missing.length === 0
      ? `${strategy} 参考齐，可以生成`
      : `还不能生成：${missing.map(item => item.detail).join('；')}`,
  }
  draft.ask = draft.verdict === 'blocked' ? buildAsk({ ...draft, input }) : []
  draft.next = buildNext(draft)
  return draft
}

export class GenerateReadyStore {
  constructor(private readonly outputDir: string) {}

  private filePath(): string {
    return join(resolveOutputDir(this.outputDir), FILE)
  }

  async read(): Promise<GenerateReadyBrief[]> {
    try {
      const parsed = JSON.parse(await readFile(this.filePath(), 'utf8')) as { briefs?: GenerateReadyBrief[] }
      return Array.isArray(parsed.briefs) ? parsed.briefs : []
    } catch {
      return []
    }
  }

  async get(id: string): Promise<GenerateReadyBrief | undefined> {
    return (await this.read()).find(item => item.id === id)
  }

  async save(brief: GenerateReadyBrief): Promise<GenerateReadyBrief> {
    const briefs = await this.read()
    briefs.push(brief)
    await mkdir(resolveOutputDir(this.outputDir), { recursive: true })
    await writeFile(this.filePath(), JSON.stringify({ briefs: briefs.slice(-MAX) }, null, 2), 'utf8')
    return brief
  }
}

export async function commitGenerateReady(input: AssessReadyInput & { outputDir: string; craftId: string }): Promise<Record<string, unknown>> {
  const report = assessGenerateReady(input)
  if (report.verdict !== 'ready') {
    return { ok: false, refused: true, ...report }
  }
  const brief: GenerateReadyBrief = {
    id: `ready-${Date.now().toString(36)}`,
    craftId: input.craftId,
    kind: input.kind,
    strategy: report.strategy,
    intent: input.intent,
    prompt: input.prompt,
    bind: report.bind,
    at: Date.now(),
  }
  await new GenerateReadyStore(input.outputDir).save(brief)
  return {
    ok: true,
    readyId: brief.id,
    ...report,
    next: ['严格/协同：directorx_propose 带 craftId+readyId', 'generate_* / canvas_continue 必须带同一个 readyId'],
  }
}

export async function requireReady(
  outputDir: string,
  readyId: string | undefined,
  expected?: { craftId?: string; kind?: GenerateReadyKind },
): Promise<{ ok: true; brief: GenerateReadyBrief } | { ok: false; refused: true; reason: string; next: string }> {
  if (readyId === undefined || readyId.trim() === '') {
    return {
      ok: false,
      refused: true,
      reason: '生成前必须先过参考齐备闸',
      next: 'directorx_generate_ready（选定设定图/场景/首尾帧/图生策略）。缺什么先补，再带 readyId 生成。',
    }
  }
  const brief = await new GenerateReadyStore(outputDir).get(readyId.trim())
  if (brief === undefined) {
    return { ok: false, refused: true, reason: `ready "${readyId}" 不存在`, next: 'directorx_generate_ready commit:true' }
  }
  if (Date.now() - brief.at > FRESH_MS) {
    return { ok: false, refused: true, reason: '就绪单过期', next: '重新 directorx_generate_ready' }
  }
  if (expected?.craftId !== undefined && expected.craftId !== '' && brief.craftId !== expected.craftId) {
    return { ok: false, refused: true, reason: 'readyId 与 craftId 不是一对', next: '用这对成稿重新 generate_ready' }
  }
  if (expected?.kind !== undefined && brief.kind !== expected.kind) {
    return { ok: false, refused: true, reason: `ready 是 ${brief.kind}，这次要 ${expected.kind}`, next: '按正确 kind 重新 ready' }
  }
  return { ok: true, brief }
}

export async function loadReadySnapshot(outputDir: string): Promise<ReadySnapshot> {
  const [characters, doc] = await Promise.all([
    new CharacterStore(outputDir).list(),
    new DirectorxCanvasStore(outputDir).read(),
  ])
  return {
    characters: characters.map(card => ({
      name: card.name,
      refPath: card.refPath,
      ...(card.description !== undefined ? { description: card.description } : {}),
    })),
    nodes: doc.nodes.map(node => ({
      id: node.id,
      kind: node.kind,
      label: node.label,
      ...(hasPath(node.path) ? { path: node.path } : {}),
      ...(node.characters !== undefined && node.characters.length > 0 ? { characters: node.characters } : {}),
      ...(node.shotIndex !== undefined ? { shotIndex: node.shotIndex } : {}),
      ...(node.prompt !== undefined ? { prompt: node.prompt } : {}),
    })),
    edges: doc.edges.map(edge => ({ from: edge.from, to: edge.to })),
  }
}

export function mergeReadyBind(
  brief: GenerateReadyBrief,
  args: {
    characters?: unknown
    first_frame_path?: unknown
    last_frame_path?: unknown
    reference_image_paths?: unknown
  },
): { characters: string[]; firstFrame?: string; lastFrame?: string; referenceImages: string[] } {
  const extraChars = Array.isArray(args.characters) ? args.characters.map(String) : []
  const extraRefs = Array.isArray(args.reference_image_paths) ? args.reference_image_paths.map(String) : []
  const first = typeof args.first_frame_path === 'string' && args.first_frame_path !== '' ? args.first_frame_path : brief.bind.firstFrame
  const last = typeof args.last_frame_path === 'string' && args.last_frame_path !== '' ? args.last_frame_path : brief.bind.lastFrame
  return {
    characters: [...new Set([...brief.bind.characters, ...extraChars])],
    ...(first !== undefined ? { firstFrame: first } : {}),
    ...(last !== undefined ? { lastFrame: last } : {}),
    referenceImages: [...new Set([...brief.bind.referenceImages, ...extraRefs])],
  }
}
