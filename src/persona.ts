import { buildShotPrompt } from './providers/shot-builder.ts'

export const CHENGPIAN_PERSONA = '成片'

export type InitiativeMode = '严格' | '自动' | '协同'
export type ChengpianEventKind = 'unclear' | 'generate' | 'placeholder-batch'

export interface ChengpianEvent {
  kind: ChengpianEventKind
  prompt?: string
  inBudget?: boolean
  necessaryAsk?: boolean
  variantCount?: number
}

export interface ChengpianDecision {
  persona: typeof CHENGPIAN_PERSONA
  mode: InitiativeMode
  confirm: boolean
  generate: boolean
  promptCount: number
  placeholders: boolean
  loadKnowledge: boolean
  loadSkill: boolean
  prompts: string[]
  reason: string
}

const MODES: InitiativeMode[] = ['严格', '自动', '协同']

const VARIANT_LENSES = [
  { shotSize: 'LS' as const, lighting: 'soft-window' as const, composition: 'depth-layers' as const, cameraMove: 'static', label: '建立镜头' },
  { shotSize: 'MCU' as const, lighting: 'rembrandt' as const, composition: 'rule-of-thirds' as const, cameraMove: 'push_in', label: '人物近逼' },
  { shotSize: 'CU' as const, lighting: 'low-key' as const, composition: 'negative-space' as const, cameraMove: 'static', label: '情绪特写' },
  { shotSize: 'MS' as const, lighting: 'golden-hour' as const, composition: 'symmetry' as const, cameraMove: 'pan', label: '动作中景' },
]

export function parseInitiative(raw: unknown): InitiativeMode {
  if (typeof raw === 'string' && (MODES as string[]).includes(raw)) return raw as InitiativeMode
  return '协同'
}

export function clampPromptCount(requested: number | undefined): number {
  const n = requested ?? 3
  return Math.max(2, Math.min(4, Math.round(n)))
}

/** Director-angle prompt set for one generation task. Always 2–4 distinct lines. */
export function draftDirectorPrompts(task: string, count = 3): string[] {
  const subject = task.trim() === '' ? '主体在场，完成一个可观察的动作' : task.trim()
  const n = clampPromptCount(count)
  return VARIANT_LENSES.slice(0, n).map(lens => {
    const built = buildShotPrompt({
      subject,
      action: 'one complete observable action with a start and end state',
      shotSize: lens.shotSize,
      lighting: lens.lighting,
      composition: lens.composition,
      cameraMove: lens.cameraMove,
    })
    return `【${lens.label}】${built.prompt}`
  })
}

export function decideChengpian(mode: InitiativeMode, event: ChengpianEvent): ChengpianDecision {
  const base: Pick<ChengpianDecision, 'persona' | 'mode' | 'loadKnowledge' | 'loadSkill'> = {
    persona: CHENGPIAN_PERSONA,
    mode,
    loadKnowledge: true,
    loadSkill: true,
  }
  if (mode === '严格') {
    if (event.kind === 'unclear') {
      return {
        ...base,
        confirm: true,
        generate: false,
        promptCount: 0,
        placeholders: false,
        prompts: [],
        reason: '严格：第一个不明确事件及时向用户确认；确认次数较多；绝不自己执行生成',
      }
    }
    const promptCount = clampPromptCount(event.variantCount)
    const prompts = draftDirectorPrompts(event.prompt ?? '', promptCount)
    return {
      ...base,
      confirm: true,
      generate: false,
      promptCount,
      placeholders: true,
      prompts,
      reason: '严格：绝不自己执行生成；每个生成任务提供二到四个提示词供用户选择',
    }
  }
  if (mode === '自动') {
    if (event.kind === 'unclear') {
      const necessary = event.necessaryAsk === true
      return {
        ...base,
        confirm: necessary,
        generate: false,
        promptCount: 0,
        placeholders: false,
        prompts: [],
        reason: necessary
          ? '自动：必要歧义才问'
          : '自动：非必要不询问用户',
      }
    }
    const inBudget = event.inBudget !== false
    const prompts = event.prompt !== undefined && event.prompt.trim() !== '' ? [event.prompt.trim()] : []
    return {
      ...base,
      confirm: !inBudget,
      generate: inBudget,
      promptCount: prompts.length,
      placeholders: !inBudget,
      prompts,
      reason: inBudget
        ? '自动：预算范围内直接执行生成'
        : '自动：超出预算先确认，不直接执行生成',
    }
  }
  if (event.kind === 'unclear') {
    return {
      ...base,
      confirm: true,
      generate: false,
      promptCount: 0,
      placeholders: false,
      prompts: [],
      reason: '协同：不明确时向用户确认，但不自己执行生成',
    }
  }
  const prompt = (event.prompt ?? '').trim()
  const prompts = prompt === '' ? [] : [prompt]
  return {
    ...base,
    confirm: false,
    generate: false,
    promptCount: prompts.length,
    placeholders: true,
    prompts,
    reason: '协同：不直接执行生成；每次生成任务只给出提示词和占位，用户从头审阅后执行生成',
  }
}

/** Shipped entry: mode + event → confirm / generate / 2–4 prompts / 占位. */
export function runChengpianEvent(input: {
  mode?: unknown
  event: ChengpianEventKind
  prompt?: string
  inBudget?: boolean
  necessaryAsk?: boolean
  variantCount?: number
}): ChengpianDecision {
  return decideChengpian(parseInitiative(input.mode), {
    kind: input.event,
    prompt: input.prompt,
    inBudget: input.inBudget,
    necessaryAsk: input.necessaryAsk,
    variantCount: input.variantCount,
  })
}

export function chengpianPersonaText(mode: InitiativeMode): string {
  return [
    '## 成片 persona',
    `- You are DirectorX in the dedicated **成片** persona. Analyse every request from a **导演角度** (blocking, continuity, light, lens, emotion, cut). Do not guess craft: actively load 成片-related **知识库** via \`directorx_knowledge_search\` / \`directorx_knowledge_read\` and the matching **skill** body (\`directorx-chengpian\`, \`directorx-methodology\`, \`directorx-production-lead\`) before planning or generating.`,
    `- Initiative mode is **${mode}**. Call \`directorx_chengpian\` on unclear events and before every generation unit.`,
    '- **严格**: 第一个不明确的事件及时向用户确认；确认次数较多；绝不自己执行生成；每个生成任务提供**二到四个提示词**让用户选择。',
    '- **自动**: 非必要不会询问用户；在预算范围内会直接干，**直接执行生成**。',
    '- **协同**: 也会问用户，但比较主动；不直接执行生成；工作到最后产出视频计划；每次遇到生成任务只给出**提示词和占位**，用户最后从头开始一个个审阅然后执行生成。',
  ].join('\n')
}
