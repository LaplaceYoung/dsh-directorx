import { mkdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { brief } from '../providers/brief.ts'
import { CharacterStore } from '../characters.ts'
import { corpus } from '../corpus.ts'
import { routeModel } from '../model-matrix.ts'
import { ProposalStore } from '../proposals.ts'
import { buildShotPrompt } from '../providers/shot-builder.ts'
import { resolveOutputDir } from '../support.ts'
import { extractEntities, inferProductionKind, slugify } from './extract.ts'
import { deriveProductionPlan } from './plan.ts'
import type { ProductionPlaceholder, ProductionResearchNote, ProductionRun, ProductionStage, ProductionToolCall, ShotDraft } from './types.ts'

const IMAGE_MODEL = 'gpt-image-2'
const AUDIO_MODEL = 'openai-tts'

function recommendVideoModel(shot: ShotDraft): string {
  const routed = routeModel({
    durationSec: shot.durationSec ?? 6,
    aspectRatio: shot.aspectRatio,
    needsAudio: shot.needsAudio,
    needsFirstFrame: shot.needsFirstFrame,
    needsLastFrame: shot.needsLastFrame,
  })
  return routed.eligible[0]?.model ?? 'kling-3.0'
}

function toPlaceholder(shot: ShotDraft, index: number): Omit<ProductionPlaceholder, 'proposalId'> {
  if (shot.kind === 'audio') {
    return {
      id: shot.id,
      kind: 'audio',
      task: shot.task,
      prompt: `${shot.subject}${shot.action !== undefined ? `。${shot.action}` : ''}`,
      model: AUDIO_MODEL,
      size: shot.aspectRatio,
      duration: shot.durationSec,
      shotIdx: index + 1,
      continuity: shot.continuity,
      note: shot.note,
    }
  }
  const built = buildShotPrompt({
    subject: shot.subject,
    action: shot.action,
    shotSize: shot.shotSize,
    angle: shot.angle,
    cameraMove: shot.kind === 'image' ? 'static' : shot.cameraMove,
    lighting: shot.lighting,
    mood: shot.mood,
    composition: shot.composition,
    durationSec: shot.durationSec,
  })
  const model = shot.kind === 'image' ? IMAGE_MODEL : recommendVideoModel(shot)
  return {
    id: shot.id,
    kind: shot.kind,
    task: shot.task,
    prompt: built.prompt,
    model,
    size: shot.kind === 'image' ? (shot.aspectRatio === '9:16' ? '1080x1920' : '1920x1080') : shot.aspectRatio,
    duration: shot.kind === 'video' ? (shot.durationSec ?? 6) : undefined,
    shotIdx: index + 1,
    continuity: shot.continuity,
    note: shot.kind === 'video' ? `${shot.note}；推荐 ${model}` : shot.note,
  }
}

/**
 * Derive a placeholder-first production from any complex request.
 * Kind, entities, research queries and shot skeletons come from the request
 * text — there is no catalog of named jobs.
 */
export async function orchestrateProduction(input: {
  request: string
  outputDir: string
  materials?: string[]
  enqueue?: boolean
}): Promise<ProductionRun> {
  const request = input.request.trim()
  if (request === '') throw new Error('request is empty')

  const stages: ProductionStage[] = []
  const tool = (name: string, args: Record<string, unknown>, output: unknown): ProductionToolCall => ({ name, input: args, output })

  const briefOut = await brief({ request, materials: input.materials ?? [], outputDir: input.outputDir })
  const kind = inferProductionKind(request)
  const entities = extractEntities(request, kind, briefOut.brief.targetSeconds, briefOut.brief.aspectRatio)
  const plan = deriveProductionPlan(kind, entities)

  stages.push({
    name: '析',
    thinking: `这是复杂多单元制作，形态推成「${kind}」，不是按作品名查表。时长 ${entities.targetSeconds}s / ${entities.aspectRatio}。本轮不调用 directorx_generate_*。`,
    tools: [
      tool('directorx_brief', { request }, { type: briefOut.brief.type, targetSeconds: briefOut.brief.targetSeconds, aspectRatio: briefOut.brief.aspectRatio }),
      tool('directorx_infer_kind', { request }, { kind, entities }),
    ],
  })

  const research: ProductionResearchNote[] = []
  const searchCalls: ProductionToolCall[] = []
  for (const query of plan.researchQueries) {
    const hits = await corpus.search(query, 3)
    searchCalls.push(tool('directorx_knowledge_search', { query, maxResults: 3 }, hits.map(hit => ({ slug: hit.slug, title: hit.title, score: hit.score }))))
    for (const hit of hits.slice(0, 2)) {
      research.push({ query, source: `knowledge:${hit.slug || hit.id}`, finding: hit.snippet })
    }
    if (hits.length === 0) {
      research.push({ query, source: 'derived', finding: `知识库未命中「${query}」，占位提示词仍写入实体 ${JSON.stringify(entities)}，待用户补材料。` })
    }
  }
  stages.push({
    name: '研',
    thinking: '调研查询从请求实体推导（品牌/原作/源片），工艺问题进知识库。没有源片就按该形态的骨架拉片，不编造不存在的镜头。',
    tools: searchCalls,
  })

  const characters = new CharacterStore(input.outputDir)
  const characterCalls: ProductionToolCall[] = []
  for (const card of plan.characters) {
    const registered = await characters.register({
      name: card.name,
      description: card.description,
      refPath: `generated/anchors/${card.slug || slugify(card.name)}.png`,
    })
    characterCalls.push(tool('directorx_character_register', { name: card.name }, { name: registered.name, refPath: registered.refPath }))
  }
  stages.push({
    name: '案',
    thinking: `工作流：${plan.workflow.join(' → ')}。角色锚来自实体抽取，不是写死的人名表。`,
    tools: characterCalls.length > 0 ? characterCalls : [tool('directorx_plan', { kind }, { title: plan.title, shots: plan.shots.length })],
  })

  stages.push({
    name: '问',
    thinking: '生成前让用户拍板幅度 / 时长 / 占位批次。推荐项永远是确认占位、暂不生成。',
    tools: [tool('directorx_case_confirm', { confirms: plan.confirms.map(item => item.id) }, plan.confirms)],
  })

  const placeholders: ProductionPlaceholder[] = []
  const proposeCalls: ProductionToolCall[] = []
  const store = new ProposalStore(input.outputDir)
  const enqueue = input.enqueue !== false
  for (const [index, shot] of plan.shots.entries()) {
    const spec = toPlaceholder(shot, index)
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
      proposeCalls.push(tool('directorx_propose', { kind: spec.kind, model: spec.model, task: spec.task }, { id: proposal.id, status: proposal.status }))
    }
    placeholders.push({ ...spec, proposalId })
  }
  stages.push({
    name: '位',
    thinking: `已排出 ${placeholders.length} 条占位：每条含提示词、推荐模型、规格。没有调用生成接口。`,
    tools: proposeCalls,
  })

  const run: ProductionRun = {
    kind,
    title: plan.title,
    request,
    generated: false,
    workflow: plan.workflow,
    entities,
    stages,
    brief: briefOut,
    research,
    confirms: plan.confirms,
    placeholders,
    durationBudget: plan.durationBudget,
    reportPath: join(resolveOutputDir(input.outputDir), `orchestrate-${kind}.json`),
  }
  await mkdir(resolveOutputDir(input.outputDir), { recursive: true })
  await writeFile(run.reportPath, JSON.stringify(run, null, 2), 'utf8')
  return run
}

export { extractEntities, inferProductionKind, parseDurationSeconds } from './extract.ts'
export { deriveProductionPlan } from './plan.ts'
