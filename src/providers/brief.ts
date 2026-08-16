import { CharacterStore } from '../characters.ts'

/**
 * Intent understanding (意图分诊): a deterministic layer that turns a raw
 * user request + materials into a structured production brief — type,
 * platform/aspect, target duration, style hints, character anchors,
 * material classification — plus the one-shot clarification questions
 * (一次澄清协议 from directorx-production-lead).
 */

export interface BriefInput {
  /** 用户原话. */
  request: string
  materials?: string[]
  outputDir: string
}

export interface BriefOutput {
  /** 建议的下一步动作序列（按顺序调用）。 */
  nextActions: string[]
  brief: {
    type: string
    typeConfidence: 'high' | 'medium' | 'low'
    platform: string
    aspectRatio: string
    targetSeconds: number
    styleHints: string[]
    characters: string[]
    materials: Array<{ path: string; kind: string }>
  }
  /** One-shot clarification questions with recommended defaults. */
  questions: Array<{ question: string; default: string }>
  /** Derived flow shape (maps to templates or a custom workflow). */
  suggestedFlow: string
}

const TYPE_RULES: Array<{ type: string; keywords: string[]; seconds: number }> = [
  { type: '口播/讲解', keywords: ['介绍', '讲解', '口播', '教程', '科普', '测评', '分享'], seconds: 45 },
  { type: '广告/宣传', keywords: ['广告', '产品', '带货', '宣传', '推广', '促销'], seconds: 20 },
  { type: '混剪/卡点', keywords: ['混剪', '卡点', '合集', '精彩集锦', '快剪'], seconds: 30 },
  { type: '剧情/短剧', keywords: ['短剧', '剧情', '故事', '情景', '连续剧'], seconds: 60 },
  { type: 'MV/音乐', keywords: ['MV', '音乐', '歌曲', '翻唱', '舞蹈'], seconds: 60 },
  { type: '纪录片/纪实', keywords: ['纪录', '纪实', '采访', 'vlog', 'Vlog'], seconds: 90 },
  { type: '分镜/成片', keywords: ['分镜', '成片', '短片', '电影感', '宣传片'], seconds: 30 },
]

const PLATFORM_RULES: Array<{ platform: string; keywords: string[]; aspect: string }> = [
  { platform: '抖音/快手/视频号', keywords: ['抖音', '快手', '视频号', '竖屏', '短视频'], aspect: '9:16' },
  { platform: 'B站/YouTube', keywords: ['b站', 'B站', 'youtube', 'YouTube', '横屏'], aspect: '16:9' },
  { platform: '小红书', keywords: ['小红书'], aspect: '3:4' },
]

const STYLE_HINTS: Record<string, string> = {
  '赛博朋克': 'cyberpunk', '赛博': 'cyberpunk', '黑色电影': 'noir', 'noir': 'noir', '吉卜力': 'ghibli',
  '韦斯安德森': 'wes-anderson', '纪录片': 'documentary', '广告': 'commercial', '复古': 'retro-80s',
  '恐怖': 'horror', '电影感': 'cinematic', '写实': 'cinematic',
}

function secondsFrom(request: string): number | undefined {
  const minuteMatch = request.match(/(\d+)\s*分钟/)
  if (minuteMatch !== null) return Number(minuteMatch[1]) * 60
  const secondMatch = request.match(/(\d+)\s*秒/)
  if (secondMatch !== null) return Number(secondMatch[1])
  return undefined
}

function materialKind(path: string): string {
  if (/\.(mp4|mov|webm|avi)$/i.test(path)) return 'video'
  if (/\.(png|jpe?g|webp)$/i.test(path)) return 'image'
  if (/\.(mp3|wav|m4a|aac)$/i.test(path)) return 'audio'
  return 'other'
}

export async function brief(input: BriefInput): Promise<BriefOutput> {
  const request = input.request.trim()
  // Score every rule by keyword hits; strongest intent wins.
  const scored = TYPE_RULES
    .map(rule => ({ rule, hits: rule.keywords.filter(keyword => request.includes(keyword)).length }))
    .filter(entry => entry.hits > 0)
    .sort((a, b) => b.hits - a.hits)
  const matchedType = scored[0]?.rule
  const type = matchedType?.type ?? '通用短片'
  const explicitSeconds = secondsFrom(request)
  const targetSeconds = explicitSeconds ?? matchedType?.seconds ?? 30

  const platform = PLATFORM_RULES.find(rule => rule.keywords.some(keyword => request.includes(keyword)))
  const aspectRatio = platform?.aspect ?? '16:9'

  const styleHints: string[] = []
  for (const [keyword, slug] of Object.entries(STYLE_HINTS)) {
    if (request.includes(keyword) && !styleHints.includes(slug)) styleHints.push(slug)
  }

  const characters: string[] = []
  try {
    const registered = await new CharacterStore(input.outputDir).list()
    for (const card of registered) {
      if (request.includes(card.name)) characters.push(card.name)
    }
  } catch {
    // Character registry unavailable — non-fatal.
  }

  const materials = (input.materials ?? []).map(path => ({ path, kind: materialKind(path) }))

  const questions = [
    { question: '发布平台（决定画幅与节奏）？', default: `${platform?.platform ?? '未指定'}（${aspectRatio}）` },
    { question: '成片时长？', default: `${targetSeconds}s` },
    { question: '风格基调？', default: styleHints.length > 0 ? styleHints.join('/') : '由你按内容定调' },
    ...(characters.length > 0 ? [{ question: '主体一致性锚点？', default: characters.join('/') }] : []),
    ...(materials.length > 0 ? [{ question: '素材使用方式？', default: `提供 ${materials.length} 个素材（${materials.map(material => material.kind).join('/')}），按需裁剪/参考` }] : [{ question: '需要我先生成素材还是用现有画布素材？', default: '画布素材优先，缺失再生成' }]),
  ]

  let suggestedFlow = '通用短片流水线（directorx-pipeline：剧本分镜 → 提示词 → 生成 → 质检 → 组装）'
  if (type === '口播/讲解') suggestedFlow = 'directorx-talking-video（脚本 → 配音 → 素材 → 字幕 → 成片）'
  if (type === '混剪/卡点') suggestedFlow = 'directorx-montage（素材盘点 → 节拍检测 → 卡点裁剪 → 拼接 → 混音）'
  if (type === '广告/宣传') suggestedFlow = 'preflight 四道闸门 → propose 占位 → 批准后按 pipeline 生成（成本护栏优先）'

  const nextActions: string[] = []
  if (materials.length > 0) {
    nextActions.push('先 directorx_video_analyze / directorx_probe_media 理解素材（或画布盘点 directorx_canvas_get）')
  }
  if (characters.length === 0 && (type === '剧情/短剧' || type === '分镜/成片' || type === 'MV/音乐')) {
    nextActions.push('用 directorx_character_register 注册主体锚点（多镜头一致性前提）')
  }
  nextActions.push(`用 directorx_preflight 做四道闸门审计 + directorx_propose 排队完整生成规格（先方案后生成）`)
  nextActions.push(`加载 directorx-workflow，按推导流程 dryRun 验证编排（零成本），再执行`)
  nextActions.push(`成片后 directorx_qa 过质检门（含节奏/黑帧/白帧检查），结论写回画布`)

  return {
    nextActions,
    brief: {
      type,
      typeConfidence: matchedType !== undefined ? 'high' : 'low',
      platform: platform?.platform ?? '未指定',
      aspectRatio,
      targetSeconds,
      styleHints,
      characters,
      materials,
    },
    questions,
    suggestedFlow,
  }
}
