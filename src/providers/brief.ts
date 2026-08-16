import { CharacterStore } from '../characters.ts'
import { composeProductionFlow, type ComposeFlow } from '../compose.ts'

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
  /** 标题变体（钩子公式）与可直接用于 generate_image 的封面提示词。 */
  titles: string[]
  coverPrompt: string | null
  /** 平台规格卡：封面规格/标题字数上限/发布窗口（口径见 directorx-methodology 规则 85-88）。 */
  platformCard: {
    platform: string
    coverSpec: string
    titleCap: number
    publishWindows: string
  } | null
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
  /** Recipe + tool sequence. The agent composes these tools; orchestrate is optional. */
  compose: ComposeFlow
}

const TYPE_RULES: Array<{ type: string; keywords: string[]; seconds: number }> = [
  { type: '口播/讲解', keywords: ['介绍', '讲解', '口播', '教程', '科普', '测评', '分享'], seconds: 45 },
  { type: '广告/宣传', keywords: ['广告', '产品', '带货', '宣传', '推广', '促销', '宣传片', '品牌'], seconds: 75 },
  { type: '改编/长剧', keywords: ['改编', '小说', '名著', '电视剧', '网文'], seconds: 1800 },
  { type: '拉片/复刻', keywords: ['拉片', '复刻', '对帧', '主体替换'], seconds: 45 },
  { type: '混剪/卡点', keywords: ['混剪', '卡点', '合集', '精彩集锦', '快剪'], seconds: 30 },
  { type: '剧情/短剧', keywords: ['短剧', '剧情', '故事', '情景', '连续剧'], seconds: 60 },
  { type: 'MV/音乐', keywords: ['MV', '音乐', '歌曲', '翻唱', '舞蹈'], seconds: 60 },
  { type: '纪录片/纪实', keywords: ['纪录', '纪实', '采访', 'vlog', 'Vlog'], seconds: 90 },
  { type: '分镜/成片', keywords: ['分镜', '成片', '短片', '电影感', '宣传片'], seconds: 30 },
]

const PLATFORM_RULES: Array<{ platform: string; keywords: string[]; aspect: string; coverSpec: string; titleCap: number; publishWindows: string }> = [
  { platform: '抖音', keywords: ['抖音', '竖屏', '短视频'], aspect: '9:16', coverSpec: '视频 9:16，信息流按 3:4 展示，首帧即封面；核心居中，上下 15% 留 UI 区', titleCap: 55, publishWindows: '21-23 点峰值（完播 +41%）；热点后 30-90 分钟发布加权 3.2x' },
  { platform: '小红书', keywords: ['小红书'], aspect: '3:4', coverSpec: '1080x1440 3:4，大标题/人脸放居中 1:1 安全区（上下各留 180px）', titleCap: 20, publishWindows: '7-9 / 12-14 / 20-22 点；发布后 1 小时互动定流量池' },
  { platform: 'B站', keywords: ['b站', 'B站'], aspect: '16:9', coverSpec: '16:9，≥640x360；标题封面不得与内容不符（封面党红线）', titleCap: 80, publishWindows: '播放高峰前 30-60 分钟发布，避开 13 点后发布竞争' },
  { platform: 'YouTube', keywords: ['youtube', 'YouTube', '横屏'], aspect: '16:9', coverSpec: '16:9 ≥640px（竖视频 16:9 封面会被换成 4:5）', titleCap: 100, publishWindows: '按受众时区；用官方「测试与比较」A/B 缩略图' },
  { platform: '视频号', keywords: ['视频号'], aspect: '6:7', coverSpec: '竖 6:7 1080x1260 / 横 16:9；暖色亲和风格优先', titleCap: 55, publishWindows: '20-22 点 + 朋友圈活跃时段（点赞即分发）' },
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
  const platformCard = platform !== undefined
    ? { platform: platform.platform, coverSpec: platform.coverSpec, titleCap: platform.titleCap, publishWindows: platform.publishWindows }
    : null

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
  if (type === '广告/宣传') suggestedFlow = 'promo-video：调研基准 → 脚本确认 → 分镜 → propose 占位 → 用户执行'
  if (type === '改编/长剧') suggestedFlow = 'novel-adaptation：读原作 → 问改编幅度 → 角色/大纲/美术/剧本门禁 → 单元占位'
  if (type === '拉片/复刻') suggestedFlow = 'remake-subject：拉片 → 锁摄影换主体 → propose 占位 → 用户确认'

  // 标题变体：钩子公式库（数字悬念/反常识/利益点），运营方法论规则 70-71。
  const topic = request.replace(/[帮我做要搞|，。！？\s]/g, '').slice(0, 24)
  const titles = topic === ''
    ? []
    : [
        `3 个关于「${topic}」的真相，第 2 个没人告诉你`,
        `为什么「${topic}」总被误解？一次说清`,
        `「${topic}」的正确打开方式（${targetSeconds}s 看完）`,
      ]
  const coverPrompt = topic === '' ? null : `短视频封面：主题「${topic}」大字标题居中，${aspectRatio} 竖幅构图，风格 ${styleHints.length > 0 ? styleHints.join('、') : '干净高对比'}，标题文字区域留白，主体清晰，无杂乱背景`

  const compose = composeProductionFlow({ type, request, materials: input.materials })
  const nextActions = [...compose.nextActions]
  if (characters.length === 0 && (type === '剧情/短剧' || type === '分镜/成片' || type === 'MV/音乐')) {
    nextActions.splice(1, 0, '用 directorx_character_register 注册主体锚点（多镜头一致性前提）')
  }

  return {
    nextActions,
    compose,
    titles,
    coverPrompt,
    platformCard,
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
