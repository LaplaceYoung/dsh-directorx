import { writeFile, mkdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { brief } from '../providers/brief.ts'
import { CharacterStore } from '../characters.ts'
import { corpus } from '../corpus.ts'
import { routeModel } from '../model-matrix.ts'
import { ProposalStore } from '../proposals.ts'
import { buildShotPrompt } from '../providers/shot-builder.ts'
import { matchProductionCase, PRODUCTION_CASES } from './catalog.ts'
import type {
  CasePlaceholder,
  CaseResearchNote,
  CaseStage,
  CaseToolCall,
  ProductionCaseId,
  ProductionCaseRun,
} from './types.ts'

const IMAGE_MODEL = 'gpt-image-2'
const AUDIO_MODEL = 'openai-tts'

function recommendVideoModel(shot: { durationSec?: number; aspectRatio: string; needsAudio?: boolean; needsFirstFrame?: boolean; needsLastFrame?: boolean }): string {
  const routed = routeModel({
    durationSec: shot.durationSec ?? 6,
    aspectRatio: shot.aspectRatio,
    needsAudio: shot.needsAudio,
    needsFirstFrame: shot.needsFirstFrame,
    needsLastFrame: shot.needsLastFrame,
  })
  return routed.eligible[0]?.model ?? 'kling-3.0'
}

function placeholderFor(
  shot: (typeof PRODUCTION_CASES)[ProductionCaseId]['shots'][number],
  index: number,
): Omit<CasePlaceholder, 'proposalId'> {
  if (shot.kind === 'audio') {
    return {
      id: shot.id,
      kind: 'audio',
      task: shot.task,
      prompt: `${shot.subject}${shot.action !== undefined ? `。${shot.action}` : ''}`,
      model: AUDIO_MODEL,
      size: '48k-mono',
      duration: shot.durationSec,
      shotIdx: index + 1,
      continuity: shot.continuity,
      note: shot.note,
    }
  }
  if (shot.kind === 'image') {
    const built = buildShotPrompt({
      subject: shot.subject,
      action: shot.action,
      shotSize: shot.shotSize,
      angle: shot.angle,
      cameraMove: 'static',
      lighting: shot.lighting,
      mood: shot.mood,
      composition: shot.composition,
    })
    return {
      id: shot.id,
      kind: 'image',
      task: shot.task,
      prompt: built.prompt,
      model: IMAGE_MODEL,
      size: shot.aspectRatio === '9:16' ? '1080x1920' : '1920x1080',
      shotIdx: index + 1,
      note: `${shot.note}；${built.notes[0] ?? ''}`,
    }
  }
  const built = buildShotPrompt({
    subject: shot.subject,
    action: shot.action,
    shotSize: shot.shotSize,
    angle: shot.angle,
    cameraMove: shot.cameraMove,
    lighting: shot.lighting,
    mood: shot.mood,
    composition: shot.composition,
    durationSec: shot.durationSec,
  })
  const model = recommendVideoModel(shot)
  return {
    id: shot.id,
    kind: 'video',
    task: shot.task,
    prompt: built.prompt,
    model,
    size: shot.aspectRatio,
    duration: shot.durationSec ?? 6,
    shotIdx: index + 1,
    continuity: shot.continuity,
    note: `${shot.note}；推荐 ${model}（${shot.aspectRatio} / ${shot.durationSec ?? 6}s）`,
  }
}

export async function runProductionCase(input: {
  request: string
  outputDir: string
  caseId?: ProductionCaseId
  enqueue?: boolean
}): Promise<ProductionCaseRun> {
  const id = input.caseId ?? matchProductionCase(input.request)
  if (id === null) {
    throw new Error('request does not match mossland-promo / luxun-zhufu / kimi-k3-remake')
  }
  const definition = PRODUCTION_CASES[id]
  const stages: CaseStage[] = []
  const tools = (name: string, args: Record<string, unknown>, output: unknown): CaseToolCall => ({ name, input: args, output })

  const briefOut = await brief({ request: definition.request, outputDir: input.outputDir })
  stages.push({
    name: '析',
    thinking: `用户要的是「${definition.title}」，不是随便生成一段视频。先分诊类型/时长/画幅，再决定走哪条配方。本轮禁止调用 directorx_generate_*。`,
    tools: [tools('directorx_brief', { request: definition.request }, {
      type: briefOut.brief.type,
      targetSeconds: briefOut.brief.targetSeconds,
      aspectRatio: briefOut.brief.aspectRatio,
      questions: briefOut.questions.map(item => item.question),
    })],
  })

  const research: CaseResearchNote[] = [...definition.researchPack]
  const searchHits: CaseToolCall[] = []
  for (const query of definition.researchQueries) {
    const hits = await corpus.search(query, 3)
    searchHits.push(tools('directorx_knowledge_search', { query, maxResults: 3 }, hits.map(hit => ({
      slug: hit.slug,
      title: hit.title,
      score: hit.score,
    }))))
    for (const hit of hits.slice(0, 2)) {
      research.push({
        query,
        source: `knowledge:${hit.slug || hit.id}`,
        finding: hit.snippet,
      })
    }
  }
  stages.push({
    name: '研',
    thinking: '外部对象（模思 / 《祝福》 / Kimi 片型）用研究包钉死事实；工艺问题进知识库检索，不靠模型回忆。',
    tools: searchHits,
  })

  const characters = new CharacterStore(input.outputDir)
  const characterCalls: CaseToolCall[] = []
  for (const card of definition.characters) {
    const registered = await characters.register({
      name: card.name,
      description: card.description,
      refPath: `generated/anchors/${card.slug}.png`,
    })
    characterCalls.push(tools('directorx_character_register', {
      name: card.name,
      refPath: `generated/anchors/${card.slug}.png`,
    }, { name: registered.name, refPath: registered.refPath }))
  }
  stages.push({
    name: '案',
    thinking: `工作流：${definition.workflow.join(' → ')}。先锁角色锚，再把时长切块，最后只排队占位。`,
    tools: characterCalls,
  })

  stages.push({
    name: '问',
    thinking: '生成前必须让用户拍板改编幅度 / 时长 / 占位批次。默认选项是「确认占位、暂不生成」。',
    tools: [tools('directorx_case_confirm', { confirms: definition.confirms.map(item => item.id) }, definition.confirms)],
  })

  const placeholders: CasePlaceholder[] = []
  const proposeCalls: CaseToolCall[] = []
  const store = new ProposalStore(input.outputDir)
  const enqueue = input.enqueue !== false
  for (const [index, shot] of definition.shots.entries()) {
    const spec = placeholderFor(shot, index)
    let proposalId: string | undefined
    if (enqueue) {
      const proposal = await store.propose({
        kind: spec.kind,
        prompt: spec.prompt,
        model: spec.model,
        ...(spec.kind !== 'audio' ? { size: spec.size } : {}),
        ...(spec.duration !== undefined ? { duration: spec.duration } : {}),
        count: 1,
        note: spec.note,
        estimatedCost: 'placeholder — no API spend',
        stage: spec.kind === 'image' && spec.id.startsWith('c-') ? 'character' : 'shot',
      })
      proposalId = proposal.id
      proposeCalls.push(tools('directorx_propose', {
        kind: spec.kind,
        model: spec.model,
        size: spec.size,
        duration: spec.duration,
      }, { id: proposal.id, status: proposal.status }))
    }
    placeholders.push({ ...spec, proposalId })
  }
  stages.push({
    name: '位',
    thinking: `已排出 ${placeholders.length} 条占位：每条含完整提示词、推荐模型、画幅/时长。没有调用 directorx_generate_image / directorx_generate_video。`,
    tools: proposeCalls,
  })

  const run: ProductionCaseRun = {
    id,
    title: definition.title,
    request: input.request,
    generated: false,
    workflow: definition.workflow,
    stages,
    brief: briefOut,
    research,
    confirms: definition.confirms,
    placeholders,
    durationBudget: definition.durationBudget,
    reportPath: join(resolve(process.cwd(), input.outputDir), `case-${id}.json`),
  }
  await mkdir(resolve(process.cwd(), input.outputDir), { recursive: true })
  await writeFile(run.reportPath, JSON.stringify(run, null, 2), 'utf8')
  return run
}

export { matchProductionCase, PRODUCTION_CASES, PRODUCTION_CASE_IDS } from './catalog.ts'
