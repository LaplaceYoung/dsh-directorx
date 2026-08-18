import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { resolveOutputDir } from './support.ts'
import { corpus } from './corpus.ts'
import { skillIndex } from './skill-index.ts'
import { ResearchLedger } from './research-ledger.ts'
import { buildIpBrief } from './ip-lexicon.ts'
import { commitIpRewrite, scanIpWithMemory } from './ip-memory.ts'
import { routeSkills } from './skill-route.ts'
import { planPrompt } from './prompt-plan.ts'
import { buildShotPrompt, type ShotBuilderInput } from './providers/shot-builder.ts'
import { clipH3Prompt } from './providers/h3-contract.ts'
import { h3CraftLooksReady, normalizeH3Prompt } from './h3-prompt.ts'

export interface PromptCraft {
  id: string
  kind: 'image' | 'video' | 'audio'
  intent: string
  prompt: string
  negative?: string
  knowledgeRefs: string[]
  skillNames: string[]
  externalNotes: string
  at: number
}

const FILE = 'prompt-crafts.json'
const MAX = 100

const SHOT_SIZE = /镜头|景别|特写|近景|中景|远景|全景|过肩|建立镜头|close-?up|medium shot|wide shot|extreme long|establishing|\bMCU\b|\bELS\b|\bCU\b|\bMS\b|\bLS\b/i
const CAMERA = /运镜|机位|推近|推拉|摇移|跟镜|手持|固定机位|static|push|pan|tilt|dolly|handheld|eye-level|low[- ]?angle|high[- ]?angle|orbit|crane/i
const LIGHT = /光|灯|逆光|侧光|伦勃朗|golden hour|key light|\bkey\b|rim light|soft light|practical|霓虹|月光|阳光|暖光|冷光|\bnight\b|work-lamp/i
const ENV = /室内|室外|街|巷|城|工地|现场|场地|房间|码头|渡口|广场|雾|环境|空间|palace|site|street|room|rain|dust|fog|夜|dawn|dusk|atmosphere/i
const STYLE = /cinematic|电影|胶片|赛璐璐|35mm|50mm|anamorphic|atmosphere|风格|grain|\blook\b/i
const ANGLE_STUB = /角度不是成稿|本行是角度/

export class PromptCraftStore {
  constructor(private readonly outputDir: string) {}

  private filePath(): string {
    return join(resolveOutputDir(this.outputDir), FILE)
  }

  async read(): Promise<PromptCraft[]> {
    try {
      const parsed = JSON.parse(await readFile(this.filePath(), 'utf8')) as { crafts?: PromptCraft[] }
      return Array.isArray(parsed.crafts) ? parsed.crafts : []
    } catch {
      return []
    }
  }

  async get(id: string): Promise<PromptCraft | undefined> {
    return (await this.read()).find(item => item.id === id)
  }

  async save(craft: PromptCraft): Promise<PromptCraft> {
    const crafts = await this.read()
    crafts.push(craft)
    await mkdir(resolveOutputDir(this.outputDir), { recursive: true })
    await writeFile(this.filePath(), JSON.stringify({ crafts: crafts.slice(-MAX) }, null, 2), 'utf8')
    return craft
  }
}

export function isThinPrompt(intent: string, prompt: string): string | undefined {
  const body = prompt.trim()
  const seed = intent.trim()
  if (body.length < 120) return '成稿太短（<120 字）。意图不是提示词，必须写成带景别/运镜/光线/环境/风格的导演稿。'
  if (ANGLE_STUB.test(body)) return '占位不能是角度标签。按景别/运镜/光线/环境/风格写成可执行导演稿。'
  if (seed !== '' && body === seed) return '成稿不能等于用户原句。先检索再改写。'
  if (seed !== '' && body.length < seed.length + 60) return '成稿几乎没展开。按六要素写细，不要复述原句。'
  const dims = [SHOT_SIZE, CAMERA, LIGHT, ENV, STYLE].filter(mark => mark.test(body)).length
  if (dims < 4) {
    return `成稿缺导演要素（现有 ${dims}/5：景别/运镜/光线/环境/风格）。至少写齐 4 项，不能只塞 cinematic / 35mm。`
  }
  return undefined
}

export async function craftPrompt(input: {
  outputDir: string
  kind: 'image' | 'video' | 'audio'
  intent: string
  prompt: string
  knowledgeRefs: string[]
  skillNames: string[]
  externalNotes: string
  shot?: ShotBuilderInput
}): Promise<Record<string, unknown>> {
  const intent = input.intent.trim()
  const prompt = input.prompt.trim()
  if (intent === '') return { ok: false, refused: true, next: '先写清用户意图（画布生成条里的那句）' }
  if (input.knowledgeRefs.length === 0 || input.skillNames.length === 0) {
    const routed = routeSkills(intent)
    const plan = planPrompt({ intent, kind: input.kind })
    let suggestedKnowledge = routed.articles.map(id => ({ id, title: `route:${id}` }))
    let suggestedSkills = routed.skills.map(name => ({ name, snippet: 'route' }))
    if (suggestedKnowledge.length === 0 || suggestedSkills.length === 0) {
      const [knowledge, skills] = await Promise.all([
        corpus.search(intent, 5).catch(() => []),
        skillIndex.search(intent, 5).catch(() => []),
      ])
      suggestedKnowledge = [...suggestedKnowledge, ...knowledge.map(hit => ({ id: hit.id, title: hit.title }))]
      suggestedSkills = [...suggestedSkills, ...skills.map(hit => ({ name: hit.name, snippet: hit.snippet }))]
    }
    return {
      ok: false,
      refused: true,
      next: '先 directorx_prompt_plan / skill_route，再 skill_read 列出的技能、knowledge_read 列出的文章 id。外部事实不够再上网。读完把 refs/names 传回来。',
      suggestedKnowledge,
      suggestedSkills,
      route: routed,
      plan,
    }
  }

  const ledger = new ResearchLedger(input.outputDir)
  const reads = await ledger.hasReads({ knowledge: input.knowledgeRefs, skills: input.skillNames })
  if (!reads.ok) {
    return {
      ok: false,
      refused: true,
      missing: reads.missing,
      next: '引用的文章/技能必须先用 directorx_knowledge_read / directorx_skill_read 读过（本项目 45 分钟内）。不要只报 id。',
    }
  }

  for (const ref of input.knowledgeRefs) {
    try {
      await corpus.readArticle(ref)
    } catch {
      return { ok: false, refused: true, next: `知识库没有 "${ref}"，先 search 再用返回的 id` }
    }
  }
  for (const name of input.skillNames) {
    try {
      await skillIndex.read(name)
    } catch {
      return { ok: false, refused: true, next: `没有技能 "${name}"，先 directorx_skill_search` }
    }
  }

  const thin = isThinPrompt(intent, prompt)
  if (thin !== undefined) {
    const plan = planPrompt({ intent, kind: input.kind })
    return { ok: false, refused: true, next: thin, plan }
  }

  let assembled = prompt
  let negative: string | undefined
  const h3Craft = input.kind === 'video' && input.skillNames.some(name => /minimax-h3|hailuo/i.test(name))
  if (h3Craft) {
    const gap = h3CraftLooksReady(assembled)
    if (gap !== undefined) {
      return { ok: false, refused: true, next: gap, plan: planPrompt({ intent, kind: input.kind }) }
    }
    assembled = clipH3Prompt(normalizeH3Prompt(assembled, {}).prompt).prompt
  }
  if (input.shot !== undefined) {
    const intentBrief = buildIpBrief(intent)
    const subject = intentBrief.dirty
      ? (intentBrief.keep.join(' ').trim() || '主体')
      : (input.shot.subject || intent)
    const built = buildShotPrompt({ ...input.shot, subject })
    assembled = `${built.prompt}\n\n${prompt}`
    negative = built.negative
  }

  const scanned = await scanIpWithMemory(input.outputDir, assembled)
  if (scanned.brief.dirty) {
    return {
      ok: false,
      refused: true,
      ip: scanned.brief,
      memory: scanned.memory,
      next: '成稿仍含 IP 专名。按 ip.agentPrompt 结合项目记忆写细，再 directorx_ip_rewrite 验收。不要套固定替换句。',
    }
  }

  const intentScan = await scanIpWithMemory(input.outputDir, intent)
  if (intentScan.brief.dirty) {
    const cited = input.knowledgeRefs.some(ref => ref === '213' || ref.includes('213'))
    if (!cited) {
      return {
        ok: false,
        refused: true,
        ip: intentScan.brief,
        memory: intentScan.memory,
        next: '意图含 IP 专名。先 directorx_knowledge_read 213，按方法改写成稿后再交。',
      }
    }
    if (intentScan.brief.negativeLine !== '') negative = intentScan.brief.negativeLine
    await commitIpRewrite(input.outputDir, { source: intent, rewrite: assembled, remember: true })
  }

  const craft: PromptCraft = {
    id: `craft-${Date.now().toString(36)}`,
    kind: input.kind,
    intent,
    prompt: assembled,
    ...(negative !== undefined ? { negative } : {}),
    knowledgeRefs: input.knowledgeRefs,
    skillNames: input.skillNames,
    externalNotes: input.externalNotes.trim() || 'corpus-sufficient',
    at: Date.now(),
  }
  await new PromptCraftStore(input.outputDir).save(craft)
  return {
    ok: true,
    craftId: craft.id,
    prompt: craft.prompt,
    negative: craft.negative ?? null,
    knowledgeRefs: craft.knowledgeRefs,
    skillNames: craft.skillNames,
    ipHits: intentScan.brief.hits.map(hit => hit.term),
    ipRemembered: intentScan.brief.dirty,
    next: '严格/协同：directorx_propose 带 craftId；生成必须带同一个 craftId',
  }
}

export async function requireCraft(
  outputDir: string,
  craftId: string | undefined,
): Promise<{ ok: true; craft: PromptCraft } | { ok: false; refused: true; reason: string; next: string }> {
  if (craftId === undefined || craftId.trim() === '') {
    return {
      ok: false,
      refused: true,
      reason: '生成必须先出调研成稿',
      next: 'directorx_skill_route → skill_read 列出的技能 + knowledge_search/read（必要时外部调研）→ directorx_prompt_craft → 再 generate/propose。画布上的短句只是意图。',
    }
  }
  const craft = await new PromptCraftStore(outputDir).get(craftId.trim())
  if (craft === undefined) {
    return { ok: false, refused: true, reason: `craft "${craftId}" 不存在`, next: 'directorx_prompt_craft' }
  }
  return { ok: true, craft }
}
