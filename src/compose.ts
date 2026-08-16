export type ComposeKind = 'promo' | 'literary' | 'remake' | 'narrative' | 'talk' | 'montage'

export type ComposePhase = 'plan' | 'create' | 'refine'

export interface ComposeStage {
  name: string
  purpose: string
  tools: string[]
  /** Google Flow Plan / Create / Refine — compose existing tools, not one generate button. */
  phase: ComposePhase
}

export interface ComposeFlow {
  kind: ComposeKind
  recipe: string
  recipeName: string
  stages: ComposeStage[]
  nextActions: string[]
  researchQueries: string[]
}

const RECIPES: Record<ComposeKind, { file: string; name: string }> = {
  promo: { file: 'recipes/promo-video.md', name: '宣传片' },
  literary: { file: 'recipes/novel-adaptation.md', name: '小说改编' },
  remake: { file: 'recipes/remake-subject.md', name: '拉片复刻' },
  narrative: { file: 'recipes/unit-production.md', name: '单元化制作' },
  talk: { file: 'recipes/tutorial-video.md', name: '教程/口播' },
  montage: { file: 'recipes/clip-recut.md', name: '混剪' },
}

export function composeKindFromBriefType(type: string): ComposeKind {
  if (type === '广告/宣传') return 'promo'
  if (type === '改编/长剧') return 'literary'
  if (type === '拉片/复刻') return 'remake'
  if (type === '口播/讲解') return 'talk'
  if (type === '混剪/卡点') return 'montage'
  return 'narrative'
}

function commonSignoff(): ComposeStage {
  return {
    name: '位',
    purpose: '每个生成单元排队完整占位（提示词 + 推荐模型 + 规格），导出分镜表给用户签字；确认前不生成',
    tools: ['directorx_propose', 'directorx_canvas_shotlist'],
    phase: 'refine',
  }
}

function stagesFor(kind: ComposeKind, hasMaterials: boolean): ComposeStage[] {
  const inventory: ComposeStage = {
    name: '析',
    purpose: hasMaterials
      ? '读请求与素材，说明理解与缺口'
      : '读请求，列出未知项（品牌事实 / 原作 / 源片）',
    tools: hasMaterials
      ? ['directorx_video_analyze', 'directorx_probe_media', 'directorx_canvas_get']
      : ['directorx_brief'],
    phase: 'plan',
  }
  const research: ComposeStage = {
    name: '研',
    purpose: '工艺文献 + 外部事实；检索不到就问用户，不编造品牌/原作/源片',
    tools: ['directorx_knowledge_search', 'directorx_knowledge_read'],
    phase: 'plan',
  }
  const ask: ComposeStage = {
    name: '问',
    purpose: '一次澄清真正的分叉（时长/画幅/改编幅度/替换范围），每项带推荐默认',
    tools: [],
    phase: 'plan',
  }
  if (kind === 'promo') {
    return [
      inventory,
      { ...research, purpose: '好宣传片基准（结构/视觉/平台）+ 委托方公开定位，写入主题句' },
      ask,
      { name: '案', purpose: '主题句 + 三幕 + 出镜契约 + 分镜表（含连续性）', tools: ['directorx_storyboard', 'directorx_character_register'], phase: 'create' },
      commonSignoff(),
    ]
  }
  if (kind === 'literary') {
    return [
      inventory,
      { ...research, purpose: '读原作（用户材料或公开文本），判断题材/体量/改编风险' },
      { ...ask, purpose: '一次问清集数×单集时长、改编幅度、平台、画风' },
      { name: '角色', purpose: 'cast.json 门禁过了再往下', tools: ['directorx_character_register'], phase: 'create' },
      { name: '大纲', purpose: '骨架拍板后才写分集；validate 不过不进下一层', tools: [], phase: 'create' },
      { name: '美术', purpose: '场景锚 + 光照变体，画风与角色同档', tools: [], phase: 'create' },
      { name: '剧本', purpose: '场次/节拍/台词本，时长预算 ±15%', tools: [], phase: 'create' },
      { name: '交接', purpose: '四份 JSON 交给单元化制作分镜，再占位', tools: ['directorx_storyboard'], phase: 'create' },
      commonSignoff(),
    ]
  }
  if (kind === 'remake') {
    return [
      { ...inventory, purpose: '这是复刻不是新拍。列出源片与替换主体' },
      { ...research, purpose: '拉片字段与主体替换纪律（锁摄影、换身份、禁源商标）' },
      {
        name: '拉片',
        purpose: '有源文件则逐镜拆；没有则按该类型发布片骨架占位并标待对帧',
        tools: hasMaterials
          ? ['directorx_video_analyze', 'directorx_extract_frames', 'directorx_view_image']
          : ['directorx_knowledge_search'],
        phase: 'create',
      },
      { ...ask, purpose: '源片版本、替换范围（人/产品/endcard）、占位批次' },
      commonSignoff(),
    ]
  }
  if (kind === 'talk') {
    return [
      inventory,
      research,
      ask,
      { name: '案', purpose: '脚本 → 配音规格 → 画面占位', tools: ['directorx_speech_duration'], phase: 'create' },
      commonSignoff(),
    ]
  }
  if (kind === 'montage') {
    return [
      inventory,
      research,
      ask,
      { name: '案', purpose: '节拍检测 + 卡点裁剪计划，能剪就不生成', tools: ['directorx_audio_beat', 'directorx_video_analyze'], phase: 'create' },
      commonSignoff(),
    ]
  }
  return [
    inventory,
    research,
    ask,
    { name: '案', purpose: '故事/角色契约/逐镜分镜表（含 continuity_in/out）', tools: ['directorx_storyboard', 'directorx_character_register'], phase: 'create' },
    commonSignoff(),
  ]
}

export function composeProductionFlow(input: {
  type: string
  request: string
  materials?: string[]
}): ComposeFlow {
  const kind = composeKindFromBriefType(input.type)
  const recipe = RECIPES[kind]
  const hasMaterials = (input.materials ?? []).length > 0
  const stages = stagesFor(kind, hasMaterials)
  const nextActions = [
    `读 ${recipe.file}（skill directorx-recipes / ${recipe.name}）当先例，按素材改，不是目录`,
    ...stages.flatMap(stage => {
      if (stage.tools.length === 0) return [`${stage.name}：${stage.purpose}`]
      return [`${stage.name}：${stage.purpose} — ${stage.tools.join(' / ')}`]
    }),
    '用户确认批次后再执行；directorx_orchestrate 是可选加速，不是必经入口',
  ]
  const researchQueries = researchFor(kind, input.request)
  return {
    kind,
    recipe: recipe.file,
    recipeName: recipe.name,
    stages,
    nextActions,
    researchQueries,
  }
}

function researchFor(kind: ComposeKind, request: string): string[] {
  const topic = request.replace(/\s+/g, ' ').slice(0, 40)
  if (kind === 'promo') return [`${topic} 品牌定位`, '宣传片 开场结构', '品牌 视觉一致性']
  if (kind === 'literary') return [`${topic} 原作`, '小说改编 幅度', '角色一致性 外观契约']
  if (kind === 'remake') return [`${topic} 源片结构`, '拉片 景别运镜剪点', '主体替换 商标隔离']
  if (kind === 'talk') return ['口播 语速', '讲解 字幕节奏']
  if (kind === 'montage') return ['卡点 节拍', '混剪 素材盘点']
  return ['分镜 连续性', '叙事 节奏']
}
