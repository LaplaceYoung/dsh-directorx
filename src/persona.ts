import { isThinPrompt } from './prompt-craft.ts'

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
  { shotSize: '远景', lighting: '柔窗光侧逆', composition: '纵深三层', cameraMove: '静止机位略俯', label: '建立镜头', beat: '先交代空间，主体从深处走进停步' },
  { shotSize: '中近景', lighting: '伦勃朗侧光', composition: '三分构图', cameraMove: '缓慢推近', label: '人物近逼', beat: '推到肩以上，表情和手部落幅' },
  { shotSize: '特写', lighting: '低调轮廓光', composition: '负空间留白', cameraMove: '固定机位', label: '情绪特写', beat: '锁眼睛或手的一个完整微动作' },
  { shotSize: '中景', lighting: '黄金时刻侧光', composition: '对称横移', cameraMove: '横移跟动作', label: '动作中景', beat: '一个可观察动作从起势到结束' },
]

export function parseInitiative(raw: unknown): InitiativeMode {
  if (typeof raw === 'string' && (MODES as string[]).includes(raw)) return raw as InitiativeMode
  return '协同'
}

export function clampPromptCount(requested: number | undefined): number {
  const n = requested ?? 3
  return Math.max(2, Math.min(4, Math.round(n)))
}

/** Director-angle prompt set for one generation task. Always 2–4 distinct executable crafts. */
export function draftDirectorPrompts(task: string, count = 3): string[] {
  const subject = task.trim() === '' ? '主体在场，完成一个可观察的动作' : task.trim()
  const n = clampPromptCount(count)
  const alreadyCrafted = isThinPrompt('', subject) === undefined
  return VARIANT_LENSES.slice(0, n).map(lens => {
    const head = `【${lens.label}】${lens.shotSize}，${lens.cameraMove}，${lens.lighting}，${lens.composition}。`
    if (alreadyCrafted) return `${head}${subject}`
    return [
      head,
      `${subject}。${lens.beat}。`,
      '环境写清空间层次、天气和空气，地面反光与前后景分开。',
      '风格按电影感 35mm 浅景深，光线写清主光方向和色温。',
      '时间写清起势、接触和落幅，不要乱码字幕、不要新增人物、不要水印。',
    ].join('')
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

/**
 * 严格未选定 → 二到四个提示词；用户选定（chosen）或 协同 → 单条占位。
 * 自动走生成闸，这里只规划占位文案。
 */
export function planPlaceholderEnqueue(input: {
  mode?: unknown
  prompt: string
  chosen?: boolean
  variantCount?: number
}): { expand: boolean; prompts: string[]; reason: string } {
  const mode = parseInitiative(input.mode)
  const prompt = input.prompt.trim()
  if (mode === '严格' && input.chosen !== true) {
    const prompts = draftDirectorPrompts(prompt === '' ? '主体在场，完成一个可观察的动作' : prompt, input.variantCount)
    return { expand: true, prompts, reason: '严格：每个生成任务先出二到四个提示词供用户选择' }
  }
  return {
    expand: false,
    prompts: prompt === '' ? [] : [prompt],
    reason: input.chosen === true ? '用户已选定提示词，入队单条占位' : '提示词和占位，供审阅后执行生成',
  }
}

/** 只有已批准占位，或自动+预算内，才允许执行生成。 */
export function resolveGenerateAuthorization(input: {
  mode?: unknown
  prompt?: string
  inBudget?: boolean
  proposal?: { status: string; prompt: string } | null
}): { generate: boolean; prompt: string; reason: string; authorized: boolean } {
  const mode = parseInitiative(input.mode)
  if (input.proposal !== undefined && input.proposal !== null) {
    if (input.proposal.status === 'approved') {
      return {
        generate: true,
        prompt: input.proposal.prompt,
        reason: '用户已审阅并批准占位，执行生成',
        authorized: true,
      }
    }
    return {
      generate: false,
      prompt: input.proposal.prompt,
      reason: `提案 ${input.proposal.status}，尚未批准，不得执行生成`,
      authorized: false,
    }
  }
  if (mode === '自动' && input.inBudget !== false) {
    return {
      generate: true,
      prompt: (input.prompt ?? '').trim(),
      reason: '自动：预算范围内直接执行生成',
      authorized: false,
    }
  }
  return {
    generate: false,
    prompt: (input.prompt ?? '').trim(),
    reason: '未授权：严格/协同不得自行执行生成，先占位并经用户审阅',
    authorized: false,
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

export function chengpianAskQuestions(decision: ChengpianDecision, event: ChengpianEventKind): Array<{
  id: string
  header?: string
  question: string
  options?: Array<{ label: string; description?: string }>
  recommended?: string
}> {
  if (event === 'generate' && decision.prompts.length > 0) {
    return [{
      id: 'prompt',
      header: '选提示词',
      question: '选一个导演角度。选完后按 directorx_prompt_plan 写成稿，不要把角度原文丢给 generate。',
      options: decision.prompts.map((line, index) => ({
        label: `角度 ${index + 1}`,
        description: line.slice(0, 160),
      })),
      recommended: '角度 1',
    }]
  }
  return [{
    id: 'forks',
    header: '成片分叉',
    question: '先定会影响后面所有镜头的分叉。推荐值已标出，可改。',
    options: [
      { label: '15秒 16:9 电影感', description: '短片默认：横屏、15 秒内、电影光影' },
      { label: '30秒 9:16 竖屏', description: '短视频默认' },
      { label: '多镜叙事横屏', description: '要剧本/分镜/角色表，确认后再落画布' },
      { label: '我补充约束', description: '时长/画幅/改编幅度我自己说' },
    ],
    recommended: '15秒 16:9 电影感',
  }]
}

export function chengpianPersonaText(mode: InitiativeMode): string {
  return [
    '## 成片 persona',
    `- You are DirectorX in the dedicated **成片** persona. Analyse every request from a **导演角度** (blocking, continuity, light, lens, emotion, cut). Do not guess craft: call \`directorx_skill_route\`, then load 成片-related **知识库** via \`directorx_knowledge_search\` / \`directorx_knowledge_read\` and the matching **skill** body via \`directorx_skill_read\` (\`directorx-chengpian\`, \`directorx-methodology\`, \`directorx-production-lead\`) before planning or generating.`,
    `- Initiative mode is **${mode}**. Call \`directorx_chengpian\` on unclear events and before every generation unit.`,
    '- **严格**: 第一个不明确的事件及时向用户确认；确认次数较多；绝不自己执行生成；每个生成任务提供**二到四个提示词**（每条都是可执行导演稿，不是角度标签），用 `directorx_ask`（DSH 标准提问）让用户选（禁止在正文里写 1.2.3. 菜单）；选定后 `directorx_propose` chosen=true 入队单条占位；批准后带 `proposalId` 执行生成。',
    '- **自动**: 非必要不会询问用户；在预算范围内会直接干，**直接执行生成**。仍须 `prompt_plan` → `prompt_craft` → `generate_ready`，禁止原句直出，没有 craftId+readyId 不得 generate。',
    '- **协同**: 也会问用户，但比较主动；不直接执行生成；工作到最后产出视频计划；每次遇到生成任务只给出**提示词和占位**（占位正文必须过成稿门槛），用户最后从头开始一个个审阅然后带 `proposalId` 执行生成。',
    '- 流程闸：先 `directorx_brief` / `directorx_chengpian` → 按 compose 的 **路/稿/位** 走。分叉用 `directorx_ask`（DSH `userInteraction` 标准提问，不要另开提问通道）→ 剧本/分镜 `directorx_confirm` → **签字后才**落画布。剧本和人物设定必须钉成画布文本节点。同一系列先 `directorx_series apply` 再写稿。多人连续、单镜长拍、完全控制先 `directorx_blocking` harvest/schema，你写场面台账和物件状态机再 pin，然后才 `directorx_prompt_plan`。每镜先 `directorx_prompt_plan`（六要素/物理链/模型技能），再 knowledge_read + skill_read + `directorx_prompt_craft` + `directorx_generate_ready`。成片角度（建立/近逼/特写/中景）只是写法，不是成稿。缺参考先补资产。阶段写入 `directorx_stage`（含 craft）。点名 IP 时先 `directorx_ip_scan` / `ip_rewrite`。用户改意见立刻 `directorx_note`。只改一镜用 `directorx_revise`，回写只改该节点。交片后 `directorx_skill_capture` `{ present: true }` 问是否保存方法技能；有锁人设/画风再 `directorx_series save`。',
    '- 改编短剧：大纲先收敛结构；角色、美术、剧本可以并行，但不得改已经拍板的结构。分镜只认领剧本节拍，不发明情节。切镜前 `directorx_shot_vocab`（配方 = 这一刀怎么切，技法 = 什么时候别用）。评审用 `directorx_bible` 出 Markdown 钉画布，DSH 会话展示同一份，不要另出 HTML。',
    '- NEVER write a numbered 1. 2. 3. choice menu in assistant text. Call `directorx_ask` so DSH shows the standard question UI.',
    '- 视频成稿：当前模型是 MiniMax-H3 时先 `directorx_skill_read` `minimax-h3-prompt-copilot`（`handbook.md` + 对应模式）。成稿 = 参考说明（每张图的职责）+ 核心创意 + 画面过程；有首尾帧只插值、不要再塞参考图；画内文字写原文；不要配乐就 `non_diegetic_music: N/A`。其它视频模型可借同一套结构，字段用该模型自己的。',
    '- 角色出图：先 `directorx_skill_read` `novel-characters`。一张图必须是 16:9 设定表（左栏半身基准 + 右栏正视/侧视/背视），禁止单张剧照冒充三视图。',
    '- 落画布后立刻 `directorx_canvas_arrange`，保证分镜横条可读，不要叠在原点。文本剧本用 `directorx_canvas_script` 铺「本→首帧→视频」行；成片抽帧上板用 `directorx_canvas_frames`；成片一键解析用 `directorx_canvas_parse`；片段重做先 `directorx_canvas_reshoot` cut，中段走生成闸，再 assemble。多段视频硬切成片用 `directorx_canvas_pack`（预告片禁止 fade）；接触表用 `directorx_canvas_sheet`；一张图宫格切开用 `directorx_canvas_split`；多张图宫格拼回用 `directorx_canvas_join`；2–4 路分屏对照用 `directorx_canvas_stack`；硬字幕用 `directorx_canvas_desub`；续写先 `directorx_canvas_extend` 切出尾帧空卡再走生成闸；评审动图用 `directorx_canvas_gif`。角色/词令重叠用 `directorx_canvas_autolink`。切窗/解析/铺行/拼接/切开/拼回/分屏/去字/续写位/动图都不调用生成模型。',
  ].join('\n')
}
