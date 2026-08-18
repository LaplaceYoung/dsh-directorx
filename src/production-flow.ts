import { composeProductionFlow, type ComposeFlow } from './compose.ts'
import { planPrompt, type PromptPlan, type PromptPlanKind } from './prompt-plan.ts'
import { classifyRequestType } from './providers/brief.ts'
import { STAGE_IDS, type StageId } from './stage.ts'

export interface ProductionFlow {
  simple: boolean
  reason: string
  prompt: PromptPlan
  compose: ComposeFlow
  stages: StageId[]
  next: string[]
}

const COMPLEX = /宣传片|改编|小说|分镜|多镜|短剧|拉片|复刻|系列|连续|成片|单元|混剪|卡点/

export function isSimpleUnit(request: string): boolean {
  const text = request.trim()
  if (text === '') return true
  if (COMPLEX.test(text)) return false
  if (text.length > 80) return false
  return true
}

export function planProduction(input: {
  request: string
  kind?: PromptPlanKind
  model?: string
  materials?: string[]
}): ProductionFlow {
  const request = input.request.trim()
  const simple = isSimpleUnit(request)
  const prompt = planPrompt({ intent: request, kind: input.kind, model: input.model })
  const compose = composeProductionFlow({
    type: classifyRequestType(request).type,
    request: request || '成片',
    materials: input.materials,
  })
  const reason = simple
    ? '单镜/短句：走提示词编排闸，不铺整板。'
    : '复杂成片：按 brief.compose 的路/稿/位走，签字前不 generate。'
  const next = simple
    ? prompt.next
    : [
        'directorx_brief',
        'directorx_chengpian',
        'directorx_skill_route',
        ...compose.stages.flatMap(stage => stage.tools).slice(0, 8),
        'directorx_stage record 每过一阶段',
        '交付后 directorx_skill_capture present:true',
      ]
  return {
    simple,
    reason,
    prompt,
    compose,
    stages: [...STAGE_IDS],
    next: [...new Set(next)],
  }
}
