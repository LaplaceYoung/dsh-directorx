import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { DirectorxCanvasStore } from './canvas.ts'
import { presentAsk } from './ask.ts'
import type { ConfirmAnswer, ConfirmAsk, ConfirmQuestion } from './confirm.ts'
import { IpMemoryStore } from './ip-memory.ts'
import { NoteStore } from './notes.ts'
import { PromptCraftStore } from './prompt-craft.ts'
import { ProposalStore } from './proposals.ts'
import { ResearchLedger } from './research-ledger.ts'
import { skillIndex } from './skill-index.ts'
import { ProductionStageStore } from './stage.ts'
import { resolveOutputDir } from './support.ts'
import { ProjectStyleStore } from './style-constants.ts'

export const SKILL_NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const RUNTIME_RESERVED = new Set([
  'directorx-knowledge',
  'directorx-recipes',
  'directorx-workflow',
  'directorx-skill-capture',
])

const SKIP_RE = /不保存|跳过|不必|不用|算了|skip|no\b/i
const RENAME_RE = /换个名字|改名|rename/i

export interface SkillHarvest {
  title: string
  suggestedName: string
  suggestedTitle: string
  stages: Array<{ id: string; label: string; status: string; notes: string[] }>
  crafts: Array<{ kind: string; intent: string; prompt: string; skills: string[] }>
  notes: string[]
  rejects: string[]
  skillsUsed: string[]
  style?: { camera: string; palette: string; lighting: string }
  ip: Array<{ terms: string[]; rewrite: string }>
  ask: ConfirmQuestion
  agentPrompt: string
  writePrompt: string
}

export type CaptureDecision =
  | { kind: 'skip' }
  | { kind: 'rename' }
  | { kind: 'save'; name: string; title: string }

export function validSkillName(name: string): boolean {
  return name.length >= 2 && name.length <= 64 && SKILL_NAME_RE.test(name)
}

export function slugSkillName(raw: string): string {
  const latin = raw.trim().toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
  if (!validSkillName(latin)) return ''
  return latin.startsWith('dx-') ? latin : `dx-${latin}`
}

export function suggestSkillName(title: string): string {
  const slug = slugSkillName(title)
  return slug !== '' ? slug : 'dx-chengpian'
}

export function dshHome(): string {
  return process.env.DSH_HOME ?? join(homedir(), '.dsh')
}

export function userSkillRoot(override?: string): string {
  return override ?? join(dshHome(), 'skills')
}

export function projectSkillRoot(outputDir: string): string {
  return join(resolveOutputDir(outputDir), 'skills')
}

export function extraSkillRoots(outputDir: string, userRoot?: string): string[] {
  return [projectSkillRoot(outputDir), userSkillRoot(userRoot)]
}

export function saveSkillAsk(title: string): ConfirmQuestion {
  const save = `保存为「${title}」技能`
  return {
    id: 'save-skill',
    header: '收成技能',
    question: `要把这次成片流程保存为「${title}」技能吗？`,
    detail: '保存后，下次同类成片会先读这份技能：流程、你改过的地方、风格和版权纪律都在里面。',
    options: [
      { label: save, description: '按这个名字写入项目和用户技能库' },
      { label: '换个名字', description: '在下方写下你要的技能名' },
      { label: '这次不保存', description: '只交片，不沉淀技能' },
    ],
  }
}

export function decideCaptureAnswer(input: {
  suggestedName: string
  suggestedTitle: string
  answers?: ConfirmAnswer[]
  answer?: string
  name?: string
}): CaptureDecision {
  const explicit = typeof input.name === 'string' ? input.name.trim() : ''
  if (explicit !== '') {
    if (SKIP_RE.test(explicit)) return { kind: 'skip' }
    return { kind: 'save', name: suggestSkillName(explicit), title: displayTitle(explicit, input.suggestedTitle) }
  }
  const answers = input.answers ?? []
  const custom = answers.map(item => item.custom?.trim() ?? '').find(item => item !== '') ?? ''
  const selected = answers.flatMap(item => item.selected).join(' ')
  const spoken = (input.answer ?? '').trim()
  const blob = `${selected} ${custom} ${spoken}`.trim()
  if (blob === '') return { kind: 'rename' }
  if (SKIP_RE.test(blob) && custom === '') return { kind: 'skip' }
  if (custom !== '') {
    if (SKIP_RE.test(custom)) return { kind: 'skip' }
    return { kind: 'save', name: suggestSkillName(custom), title: displayTitle(custom, input.suggestedTitle) }
  }
  if (RENAME_RE.test(blob) && custom === '') return { kind: 'rename' }
  if (spoken !== '' && !SKIP_RE.test(spoken) && !RENAME_RE.test(spoken) && !spoken.includes('保存为')) {
    return { kind: 'save', name: suggestSkillName(spoken), title: displayTitle(spoken, input.suggestedTitle) }
  }
  return { kind: 'save', name: input.suggestedName, title: input.suggestedTitle }
}

function displayTitle(raw: string, fallback: string): string {
  const title = raw.replace(/^保存为[「"]?|[」"]?技能$/g, '').trim()
  return title !== '' ? title.slice(0, 40) : fallback
}

function harvestPrompts(title: string, name: string): { agentPrompt: string; writePrompt: string } {
  return {
    agentPrompt: [
      '成片已到交付。立刻用提问卡问用户要不要把这次流程收成技能，禁止在正文写 1.2.3 菜单。',
      `调用 directorx_skill_capture { action: "offer", present: true }，默认名是「${title}」/ ${name}。`,
      '用户说不保存就停。说换个名字就再用提问卡或自定义回答收下名字。',
      '同意后根据 harvest 的 stages / notes / rejects / crafts / style / ip 自己写 SKILL.md 正文，再 directorx_skill_capture action:save。',
      '不要写入插件自带 skills/。用户修改意见用 directorx_note 记过的和提案拒绝原因都要写进技能纪律。',
    ].join(''),
    writePrompt: [
      '根据 harvest 写一份可复用的 SKILL.md 正文，不要把 JSON 原文贴进去。',
      '必须包含：何时触发（description 里也要写）、这次走通的阶段顺序、用户改过什么所以下次默认怎么做、风格/镜头锁、点名 IP 时走改写记忆。',
      '技能名只能是小写英文短横线。正文用祈使句。不要写插件实现细节或内部路径。',
    ].join(''),
  }
}

export async function harvestProduction(outputDir: string, titleHint?: string): Promise<SkillHarvest> {
  const [stage, canvas, crafts, proposals, notes, style, ip, research] = await Promise.all([
    new ProductionStageStore(outputDir).read(),
    new DirectorxCanvasStore(outputDir).read(),
    new PromptCraftStore(outputDir).read(),
    new ProposalStore(outputDir).read(),
    new NoteStore(outputDir).read(),
    new ProjectStyleStore(outputDir).read(),
    new IpMemoryStore(outputDir).read(),
    new ResearchLedger(outputDir).read(),
  ])
  const title = (titleHint?.trim()
    || canvas.title?.trim()
    || stage.title.trim()
    || crafts.at(-1)?.intent.trim()
    || '本次成片').slice(0, 40)
  const suggestedName = suggestSkillName(title)
  const stages = stage.entries.map(entry => ({
    id: entry.id,
    label: entry.label,
    status: entry.status,
    notes: entry.artifacts
      .map(item => [item.kind, item.note, item.path].filter(Boolean).join(' '))
      .filter(item => item !== '')
      .slice(-4),
  }))
  const harvestedCrafts = crafts.slice(-8).map(item => ({
    kind: item.kind,
    intent: item.intent.slice(0, 160),
    prompt: item.prompt.slice(0, 400),
    skills: item.skillNames.slice(0, 6),
  }))
  const userNotes = notes.slice(-20).map(item => item.text)
  const rejects = proposals.proposals
    .filter(item => item.status === 'rejected' && (item.rejectReason ?? '') !== '')
    .slice(-12)
    .map(item => item.rejectReason?.trim() ?? '')
    .filter(item => item !== '')
  const skillsUsed = [...new Set([
    ...harvestedCrafts.flatMap(item => item.skills),
    ...research.filter(item => item.kind === 'skill').map(item => item.ref),
  ])].slice(0, 16)
  const locked = style !== null && [style.camera, style.palette, style.lighting].some(item => item.trim() !== '')
    ? { camera: style.camera, palette: style.palette, lighting: style.lighting }
    : undefined
  const ipHits = ip.slice(-8).map(item => ({ terms: item.terms, rewrite: item.rewrite.slice(0, 240) }))
  const prompts = harvestPrompts(title, suggestedName)
  return {
    title,
    suggestedName,
    suggestedTitle: title,
    stages,
    crafts: harvestedCrafts,
    notes: userNotes,
    rejects,
    skillsUsed,
    ...(locked !== undefined ? { style: locked } : {}),
    ip: ipHits,
    ask: saveSkillAsk(title),
    agentPrompt: prompts.agentPrompt,
    writePrompt: prompts.writePrompt,
  }
}

export async function deliverCapture(outputDir: string): Promise<{
  capture: { suggestedName: string; suggestedTitle: string; ask: ConfirmQuestion }
  nextTools: string[]
  agentPrompt: string
}> {
  const harvest = await harvestProduction(outputDir)
  return {
    capture: {
      suggestedName: harvest.suggestedName,
      suggestedTitle: harvest.suggestedTitle,
      ask: harvest.ask,
    },
    nextTools: ['directorx_skill_capture'],
    agentPrompt: harvest.agentPrompt,
  }
}

function stripFrontmatter(source: string): string {
  if (!source.startsWith('---\n') && !source.startsWith('---\r\n')) return source.trim()
  const end = source.indexOf('\n---', 3)
  return (end >= 0 ? source.slice(end + 4) : source).replace(/^\r?\n/, '').trim()
}

function skillMarkdown(input: { name: string; description: string; title: string; body: string }): string {
  const description = input.description.replace(/\r?\n/g, ' ').trim().slice(0, 400)
  const heading = input.body.trim().startsWith('#') ? '' : `# ${input.title}\n\n`
  return [
    '---',
    `name: ${input.name}`,
    'description: >-',
    `  ${description}`,
    'user-invocable: true',
    '---',
    '',
    `${heading}${input.body.trim()}`,
    '',
  ].join('\n')
}

export async function isReservedSkillName(name: string): Promise<boolean> {
  if (RUNTIME_RESERVED.has(name)) return true
  return skillIndex.isBundledName(name)
}

export async function assertWritableSkillName(name: string): Promise<string> {
  if (!validSkillName(name)) {
    throw new Error(`技能名必须是 2–64 位小写英文短横线，收到 "${name}"`)
  }
  if (await isReservedSkillName(name)) {
    throw new Error(`"${name}" 是插件自带技能，不能覆盖。换一个 dx- 前缀的名字。`)
  }
  return name
}

export async function saveCapturedSkill(input: {
  outputDir: string
  name: string
  title: string
  description?: string
  body: string
  userRoot?: string
  replace?: boolean
}): Promise<{ name: string; title: string; paths: string[]; description: string }> {
  const name = await assertWritableSkillName(input.name.trim())
  const body = stripFrontmatter(input.body).trim()
  if (body.length < 160) {
    throw new Error('先根据 harvest 写满 SKILL.md 正文（流程 + 用户修改纪律），再 save。不要交空壳。')
  }
  const title = input.title.trim().slice(0, 40) || name
  const description = (input.description?.trim()
    || `把「${title}」这类成片按已验证流程做完。用户再说同类题材、同样改法或同一风格时先读本技能。`).slice(0, 400)
  const markdown = skillMarkdown({ name, description, title, body })
  const roots = extraSkillRoots(input.outputDir, input.userRoot)
  const files = roots.map(root => join(root, name, 'SKILL.md'))
  if (input.replace !== true && files.some(file => existsSync(file))) {
    throw new Error(`技能 ${name} 已存在。确认覆盖就传 replace:true。`)
  }
  const paths: string[] = []
  for (const file of files) {
    await mkdir(join(file, '..'), { recursive: true })
    await writeFile(file, markdown, 'utf8')
    paths.push(file)
  }
  skillIndex.invalidate()
  return { name, title, paths, description }
}

export async function runSkillCapture(input: {
  outputDir: string
  action?: string
  present?: boolean
  name?: string
  title?: string
  description?: string
  body?: string
  answer?: string
  answers?: ConfirmAnswer[]
  replace?: boolean
  userRoot?: string
  ask?: ConfirmAsk
  agent?: unknown
  signal?: AbortSignal
}): Promise<Record<string, unknown>> {
  const action = input.action === 'harvest' || input.action === 'save' ? input.action : 'offer'
  const harvest = await harvestProduction(input.outputDir, input.title)
  if (action === 'harvest') {
    return { ...harvest, next: ['directorx_ask', 'directorx_skill_capture'] }
  }
  if (action === 'offer') {
    let answers = input.answers
    if (input.present === true) {
      if (input.ask === undefined) throw new Error('directorx_skill_capture present 需要 DSH userInteraction')
      answers = (await presentAsk({
        questions: [harvest.ask],
        ask: input.ask,
        agent: input.agent,
        signal: input.signal,
      })).answers
    }
    const hasReply = (answers !== undefined && answers.length > 0)
      || (input.answer ?? '').trim() !== ''
      || (input.name ?? '').trim() !== ''
    if (!hasReply) {
      return {
        ...harvest,
        next: ['directorx_ask', 'directorx_skill_capture'],
        agentPrompt: harvest.agentPrompt,
      }
    }
    const decision = decideCaptureAnswer({
      suggestedName: harvest.suggestedName,
      suggestedTitle: harvest.suggestedTitle,
      answers,
      answer: input.answer,
      name: input.name,
    })
    if (decision.kind === 'skip') {
      return { ok: true, saved: false, decision, harvest, next: [] }
    }
    if (decision.kind === 'rename') {
      return {
        ok: true,
        saved: false,
        decision,
        harvest,
        ask: harvest.ask,
        next: ['directorx_ask 让用户写下技能名', 'directorx_skill_capture save'],
        agentPrompt: '用户要换名字。再出一张提问卡，或用自定义回答收下名字，然后写正文再 save。',
      }
    }
    return {
      ok: true,
      saved: false,
      decision,
      harvest,
      name: decision.name,
      title: decision.title,
      next: [`根据 harvest 写 SKILL.md 正文`, `directorx_skill_capture action:save name:${decision.name}`],
      agentPrompt: harvest.writePrompt,
    }
  }
  const decision = decideCaptureAnswer({
    suggestedName: harvest.suggestedName,
    suggestedTitle: harvest.suggestedTitle,
    answers: input.answers,
    answer: input.answer,
    name: input.name,
  })
  if (decision.kind === 'skip') return { ok: true, saved: false, decision, harvest, next: [] }
  if (decision.kind === 'rename') {
    return {
      ok: false,
      saved: false,
      decision,
      harvest,
      next: ['先用提问卡或 name 参数确定技能名'],
    }
  }
  const saved = await saveCapturedSkill({
    outputDir: input.outputDir,
    name: decision.name,
    title: decision.title,
    description: input.description,
    body: input.body ?? '',
    userRoot: input.userRoot,
    replace: input.replace === true,
  })
  await new ProductionStageStore(input.outputDir).record({
    stage: 'deliver',
    kind: 'skill',
    path: saved.paths[0],
    note: `保存技能 ${saved.name}`,
  }).catch(() => undefined)
  return {
    ok: true,
    saved: true,
    ...saved,
    harvest,
    next: [`下次同类成片先 directorx_skill_read ${saved.name}`],
    agentPrompt: `已保存为「${saved.title}」技能。告诉用户可以直接再用，不要报内部目录。`,
  }
}
