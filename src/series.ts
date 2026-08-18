import { copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { basename, extname, join } from 'node:path'
import { CharacterStore, type CharacterCard } from './characters.ts'
import { DirectorxCanvasStore } from './canvas.ts'
import { NoteStore } from './notes.ts'
import { PromptCraftStore } from './prompt-craft.ts'
import { ResearchLedger } from './research-ledger.ts'
import { dshHome } from './skill-capture.ts'
import { ProjectStyleStore, type StyleConstants } from './style-constants.ts'
import { resolveOutputDir } from './support.ts'

/**
 * Series pack: locked cast + look + shot rules for the next episode.
 * Method skills stay in skill-capture. This file is the identity bible.
 */

export interface SeriesCharacter {
  name: string
  description: string
  refPath: string
  outfit?: string
  props?: string
}

export interface SeriesLook {
  camera: string
  palette: string
  lighting: string
  sceneAnchors: string[]
  negativeBaseline: string
}

export interface SeriesPack {
  name: string
  title: string
  logline: string
  characters: SeriesCharacter[]
  look: SeriesLook
  shotRules: string[]
  notes: string[]
  methodSkill?: string
  crafts: Array<{ kind: string; intent: string }>
  at: number
}

export interface SeriesListItem {
  name: string
  title: string
  characters: string[]
  root: 'project' | 'user'
  path: string
  at: number
}

const ACTIVE = 'series-active.json'
const MAX_RULES = 24
const MAX_NOTES = 16

export function userSeriesRoot(override?: string): string {
  return override ?? join(dshHome(), 'series')
}

export function projectSeriesRoot(outputDir: string): string {
  return join(resolveOutputDir(outputDir), 'series')
}

export function slugSeriesName(raw: string): string {
  const latin = raw.trim().toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  if (latin.length >= 2) return latin.startsWith('series-') ? latin : `series-${latin}`
  return `series-${Date.now().toString(36)}`
}

export function formatLookBlock(look: SeriesLook | StyleConstants | null | undefined): string {
  if (look === undefined || look === null) return ''
  return [
    look.camera.trim() !== '' ? `机位：${look.camera.trim()}` : '',
    look.palette.trim() !== '' ? `色板：${look.palette.trim()}` : '',
    look.lighting.trim() !== '' ? `光：${look.lighting.trim()}` : '',
    look.sceneAnchors.length > 0 ? `场景锚：${look.sceneAnchors.join('；')}` : '',
    look.negativeBaseline.trim() !== '' ? `负面：${look.negativeBaseline.trim()}` : '',
  ].filter(item => item !== '').join('\n')
}

function emptyLook(): SeriesLook {
  return { camera: '', palette: '', lighting: '', sceneAnchors: [], negativeBaseline: '' }
}

function asPack(value: unknown): SeriesPack | undefined {
  if (value === null || typeof value !== 'object') return undefined
  const raw = value as Partial<SeriesPack>
  if (typeof raw.name !== 'string' || raw.name.trim() === '') return undefined
  if (typeof raw.title !== 'string') return undefined
  return {
    name: raw.name,
    title: raw.title,
    logline: typeof raw.logline === 'string' ? raw.logline : '',
    characters: Array.isArray(raw.characters) ? raw.characters.filter(isCharacter) : [],
    look: raw.look !== undefined && raw.look !== null ? {
      camera: String(raw.look.camera ?? ''),
      palette: String(raw.look.palette ?? ''),
      lighting: String(raw.look.lighting ?? ''),
      sceneAnchors: Array.isArray(raw.look.sceneAnchors) ? raw.look.sceneAnchors.map(String) : [],
      negativeBaseline: String(raw.look.negativeBaseline ?? ''),
    } : emptyLook(),
    shotRules: Array.isArray(raw.shotRules) ? raw.shotRules.map(String) : [],
    notes: Array.isArray(raw.notes) ? raw.notes.map(String) : [],
    ...(typeof raw.methodSkill === 'string' && raw.methodSkill !== '' ? { methodSkill: raw.methodSkill } : {}),
    crafts: Array.isArray(raw.crafts)
      ? raw.crafts.map(item => ({ kind: String(item.kind ?? ''), intent: String(item.intent ?? '') }))
      : [],
    at: typeof raw.at === 'number' ? raw.at : 0,
  }
}

function isCharacter(value: unknown): value is SeriesCharacter {
  if (value === null || typeof value !== 'object') return false
  const raw = value as Partial<SeriesCharacter>
  return typeof raw.name === 'string' && raw.name.trim() !== '' && typeof raw.refPath === 'string' && raw.refPath !== ''
}

async function readPackFile(path: string): Promise<SeriesPack | undefined> {
  try {
    return asPack(JSON.parse(await readFile(path, 'utf8')))
  } catch {
    return undefined
  }
}

async function listRoot(root: string, kind: 'project' | 'user'): Promise<SeriesListItem[]> {
  let names: string[] = []
  try {
    names = await readdir(root)
  } catch {
    return []
  }
  const items: SeriesListItem[] = []
  for (const name of names) {
    const path = join(root, name, 'pack.json')
    const pack = await readPackFile(path)
    if (pack === undefined) continue
    items.push({
      name: pack.name,
      title: pack.title,
      characters: pack.characters.map(card => card.name),
      root: kind,
      path,
      at: pack.at,
    })
  }
  return items
}

export async function harvestSeries(outputDir: string, titleHint?: string): Promise<SeriesPack> {
  const [characters, style, canvas, notes, crafts, research] = await Promise.all([
    new CharacterStore(outputDir).list(),
    new ProjectStyleStore(outputDir).read(),
    new DirectorxCanvasStore(outputDir).read(),
    new NoteStore(outputDir).read(),
    new PromptCraftStore(outputDir).read(),
    new ResearchLedger(outputDir).read(),
  ])
  const title = (titleHint?.trim() || canvas.title?.trim() || crafts.at(-1)?.intent.trim() || '本系列').slice(0, 40)
  const rules = [...new Set(canvas.nodes.flatMap(node => node.continuityRules ?? []))]
    .filter(rule => rule !== '' && !/^(抽帧|解析|重做中段|成片|切开|接触表|场面锁|拼回|分屏|去字|续写|动图|镜:)/.test(rule))
    .slice(0, MAX_RULES)
  const methodSkill = research.filter(item => item.kind === 'skill').at(-1)?.ref
  return {
    name: slugSeriesName(title),
    title,
    logline: notes[0]?.text.slice(0, 200) ?? '',
    characters: characters.map(card => ({
      name: card.name,
      description: card.description,
      refPath: card.refPath,
      ...(card.outfit !== undefined ? { outfit: card.outfit } : {}),
      ...(card.props !== undefined ? { props: card.props } : {}),
    })),
    look: style === null ? emptyLook() : {
      camera: style.camera,
      palette: style.palette,
      lighting: style.lighting,
      sceneAnchors: style.sceneAnchors,
      negativeBaseline: style.negativeBaseline,
    },
    shotRules: rules,
    notes: notes.slice(-MAX_NOTES).map(item => item.text),
    ...(methodSkill !== undefined ? { methodSkill } : {}),
    crafts: crafts.slice(-8).map(item => ({ kind: item.kind, intent: item.intent.slice(0, 160) })),
    at: Date.now(),
  }
}

async function persistPack(pack: SeriesPack, root: string): Promise<string> {
  const dir = join(root, pack.name)
  const refs = join(dir, 'refs')
  await mkdir(refs, { recursive: true })
  const characters: SeriesCharacter[] = []
  for (const card of pack.characters) {
    const ext = extname(card.refPath) || '.png'
    const dest = join(refs, `${card.name.replace(/[^\w\u4e00-\u9fff-]+/g, '').slice(0, 24) || 'ref'}${ext}`)
    if (existsSync(card.refPath) && card.refPath !== dest) {
      await copyFile(card.refPath, dest)
      characters.push({ ...card, refPath: dest })
    } else {
      characters.push(card)
    }
  }
  const next: SeriesPack = { ...pack, characters, at: Date.now() }
  const path = join(dir, 'pack.json')
  await writeFile(path, JSON.stringify(next, null, 2), 'utf8')
  return path
}

export async function saveSeries(input: {
  outputDir: string
  title?: string
  name?: string
  logline?: string
  userRoot?: string
}): Promise<{ pack: SeriesPack; paths: string[] }> {
  const harvested = await harvestSeries(input.outputDir, input.title)
  const name = typeof input.name === 'string' && input.name.trim() !== ''
    ? slugSeriesName(input.name)
    : harvested.name
  const pack: SeriesPack = {
    ...harvested,
    name,
    title: (input.title?.trim() || harvested.title).slice(0, 40),
    logline: (input.logline?.trim() || harvested.logline).slice(0, 240),
  }
  const paths = [
    await persistPack(pack, projectSeriesRoot(input.outputDir)),
    await persistPack(pack, userSeriesRoot(input.userRoot)),
  ]
  await writeFile(join(resolveOutputDir(input.outputDir), ACTIVE), JSON.stringify({ name: pack.name, at: pack.at }, null, 2), 'utf8')
  return { pack, paths }
}

export async function listSeries(outputDir: string, userRoot?: string): Promise<SeriesListItem[]> {
  const [project, user] = await Promise.all([
    listRoot(projectSeriesRoot(outputDir), 'project'),
    listRoot(userSeriesRoot(userRoot), 'user'),
  ])
  const seen = new Set<string>()
  const items: SeriesListItem[] = []
  for (const item of [...project, ...user].sort((left, right) => right.at - left.at)) {
    if (seen.has(item.name)) continue
    seen.add(item.name)
    items.push(item)
  }
  return items
}

export async function loadSeries(outputDir: string, name: string, userRoot?: string): Promise<SeriesPack> {
  const slug = slugSeriesName(name)
  const candidates = [
    join(projectSeriesRoot(outputDir), slug, 'pack.json'),
    join(projectSeriesRoot(outputDir), name, 'pack.json'),
    join(userSeriesRoot(userRoot), slug, 'pack.json'),
    join(userSeriesRoot(userRoot), name, 'pack.json'),
  ]
  const listed = await listSeries(outputDir, userRoot)
  const hit = listed.find(item => item.name === slug || item.name === name || item.title === name)
  if (hit !== undefined) candidates.unshift(hit.path)
  for (const path of candidates) {
    const pack = await readPackFile(path)
    if (pack !== undefined) return pack
  }
  throw new Error(`找不到系列包「${name}」。先 directorx_series list。`)
}

export async function applySeries(input: {
  outputDir: string
  name: string
  userRoot?: string
}): Promise<{
  pack: SeriesPack
  registered: CharacterCard[]
  look: SeriesLook
  agentPrompt: string
}> {
  const pack = await loadSeries(input.outputDir, input.name, input.userRoot)
  const people = new CharacterStore(input.outputDir)
  const destDir = join(resolveOutputDir(input.outputDir), 'series-refs', pack.name)
  await mkdir(destDir, { recursive: true })
  const registered: CharacterCard[] = []
  for (const card of pack.characters) {
    let refPath = card.refPath
    if (existsSync(card.refPath)) {
      const dest = join(destDir, basename(card.refPath))
      if (card.refPath !== dest) await copyFile(card.refPath, dest)
      refPath = dest
    }
    registered.push(await people.register({
      name: card.name,
      refPath,
      description: card.description,
      ...(card.outfit !== undefined ? { outfit: card.outfit } : {}),
      ...(card.props !== undefined ? { props: card.props } : {}),
    }))
  }
  const look = await new ProjectStyleStore(input.outputDir).set(pack.look)
  await writeFile(join(resolveOutputDir(input.outputDir), ACTIVE), JSON.stringify({ name: pack.name, at: Date.now() }, null, 2), 'utf8')
  const lookBlock = formatLookBlock(look)
  return {
    pack,
    registered,
    look: {
      camera: look.camera,
      palette: look.palette,
      lighting: look.lighting,
      sceneAnchors: look.sceneAnchors,
      negativeBaseline: look.negativeBaseline,
    },
    agentPrompt: [
      `已套用系列包「${pack.title}」（${pack.name}）。不要重设计角色和画风。`,
      pack.characters.length > 0 ? `角色锚：${pack.characters.map(card => card.name).join('、')}。生成必须带 characters。` : '',
      lookBlock !== '' ? `风格锁逐字复用：\n${lookBlock}` : '',
      pack.shotRules.length > 0 ? `镜头规则：${pack.shotRules.slice(0, 8).join('；')}` : '',
      pack.methodSkill !== undefined ? `方法技能先 skill_read ${pack.methodSkill}` : '',
      '下一镜仍走 prompt_plan → craft → generate_ready。缺参考先补资产，不要从零写人设。',
    ].filter(item => item !== '').join('\n'),
  }
}

export async function activeSeries(outputDir: string, userRoot?: string): Promise<SeriesPack | undefined> {
  try {
    const raw = JSON.parse(await readFile(join(resolveOutputDir(outputDir), ACTIVE), 'utf8')) as { name?: string }
    if (typeof raw.name !== 'string' || raw.name === '') return undefined
    return await loadSeries(outputDir, raw.name, userRoot)
  } catch {
    return undefined
  }
}

export async function runSeries(input: {
  outputDir: string
  action?: string
  name?: string
  title?: string
  logline?: string
  userRoot?: string
}): Promise<Record<string, unknown>> {
  const action = input.action === 'save' || input.action === 'list' || input.action === 'show' || input.action === 'apply'
    ? input.action
    : 'harvest'
  if (action === 'harvest') {
    const pack = await harvestSeries(input.outputDir, input.title)
    return {
      ok: true,
      action,
      pack,
      next: ['核对角色锚和风格锁', `directorx_series action:save title:${pack.title}`],
      agentPrompt: `收成了系列「${pack.title}」：${pack.characters.map(card => card.name).join('、') || '还没有角色锚'}。要跨集复用就 save，不要只写在对话里。`,
    }
  }
  if (action === 'list') {
    const items = await listSeries(input.outputDir, input.userRoot)
    const current = await activeSeries(input.outputDir, input.userRoot)
    return {
      ok: true,
      action,
      items,
      active: current?.name,
      next: items.length === 0 ? ['先 save 一个系列包'] : [`directorx_series action:apply name:${items[0]?.name}`],
    }
  }
  if (action === 'show') {
    if (typeof input.name !== 'string' || input.name.trim() === '') throw new Error('show 需要 name')
    const pack = await loadSeries(input.outputDir, input.name, input.userRoot)
    return { ok: true, action, pack, next: [`directorx_series action:apply name:${pack.name}`] }
  }
  if (action === 'apply') {
    if (typeof input.name !== 'string' || input.name.trim() === '') throw new Error('apply 需要 name')
    const applied = await applySeries({ outputDir: input.outputDir, name: input.name, userRoot: input.userRoot })
    return {
      ok: true,
      action,
      pack: applied.pack,
      registered: applied.registered.map(card => card.name),
      look: applied.look,
      next: ['directorx_character_list', 'directorx_style_get', 'directorx_prompt_plan'],
      agentPrompt: applied.agentPrompt,
    }
  }
  const saved = await saveSeries({
    outputDir: input.outputDir,
    title: input.title,
    name: input.name,
    logline: input.logline,
    userRoot: input.userRoot,
  })
  return {
    ok: true,
    action: 'save',
    pack: saved.pack,
    paths: saved.paths,
    next: ['下一集 directorx_series apply 再开拍', '方法流程另走 directorx_skill_capture'],
    agentPrompt: `系列包「${saved.pack.title}」已写入项目和用户库。下次同一系列先 apply，不要从零做设定表。`,
  }
}
