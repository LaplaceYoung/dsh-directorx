import { articlesForMode, articlesForSkills } from './craft-map.ts'
import { scanIpRisk } from './ip-lexicon.ts'

export type SkillRouteMode =
  | 'generate'
  | 'edit'
  | 'canvas'
  | 'character'
  | 'script'
  | 'qa'
  | 'onboard'
  | 'research'
  | 'style'

export interface SkillRoute {
  mode: SkillRouteMode
  reason: string
  skills: string[]
  knowledge: string[]
  articles: string[]
  tools: string[]
  next: string[]
  avoid: string[]
}

const SKILL_TOOLS: Record<string, string[]> = {
  'directorx-chengpian': ['directorx_chengpian', 'directorx_ask', 'directorx_confirm', 'directorx_stage', 'directorx_prompt_plan', 'directorx_skill_capture'],
  'directorx-production-lead': ['directorx_brief', 'directorx_prompt_plan', 'directorx_propose', 'directorx_canvas_shotlist', 'directorx_confirm', 'directorx_skill_capture', 'directorx_bible'],
  'directorx-skill-capture': ['directorx_skill_capture', 'directorx_note', 'directorx_ask', 'directorx_stage'],
  'directorx-series-craft': ['directorx_series', 'directorx_revise', 'directorx_character_list', 'directorx_style_get', 'directorx_style_lock', 'directorx_note'],
  'directorx-blocking-craft': ['directorx_blocking', 'directorx_ask', 'directorx_character_list', 'directorx_prompt_plan', 'directorx_prompt_craft'],
  'shot-recipes': ['directorx_shot_vocab', 'directorx_storyboard', 'directorx_knowledge_read'],
  'directorx-methodology': ['directorx_knowledge_search', 'directorx_knowledge_read', 'directorx_qa'],
  'directorx-playbook': ['directorx_preflight', 'directorx_generate_ready', 'directorx_ip_scan', 'directorx_ip_rewrite'],
  'directorx-provider-onboard': [
    'directorx_provider_ingest', 'directorx_provider_classify', 'directorx_provider_draft',
    'directorx_ask', 'directorx_provider_smoke', 'directorx_provider_commit',
  ],
  'novel-characters': ['directorx_character_register', 'directorx_character_list', 'directorx_generate_ready', 'directorx_bible'],
  'novel-outline': ['directorx_bible', 'directorx_ask', 'directorx_confirm'],
  'novel-script': ['directorx_speech_duration', 'directorx_bible'],
  'novel-storyboard': ['directorx_shot_vocab', 'directorx_storyboard', 'directorx_bible'],
  'novel-art': ['directorx_bible', 'directorx_style'],
  'storyboard-craft': ['directorx_storyboard', 'directorx_shot', 'directorx_shot_sequence', 'directorx_canvas_plan', 'directorx_canvas_script', 'directorx_canvas_autolink', 'directorx_canvas_parse', 'directorx_canvas_pack', 'directorx_canvas_sheet', 'directorx_canvas_split', 'directorx_canvas_join', 'directorx_canvas_stack', 'directorx_canvas_desub', 'directorx_canvas_extend', 'directorx_canvas_gif'],
  'editing-workflow': ['directorx_edit_plan', 'directorx_edit', 'directorx_video_process', 'directorx_timeline', 'directorx_canvas_reshoot', 'directorx_canvas_pack'],
  'trailer-craft': ['directorx_canvas_pack', 'directorx_canvas_sheet', 'directorx_canvas_shotlist', 'directorx_prompt_plan', 'directorx_character_register', 'directorx_storyboard'],
  'frame-qa': ['directorx_extract_frames', 'directorx_view_image', 'directorx_qa', 'directorx_qa_report', 'directorx_canvas_frames', 'directorx_canvas_parse'],
  'video-prompt-builder': ['directorx_prompt_plan', 'directorx_prompt_craft', 'directorx_style', 'directorx_shot', 'directorx_ip_scan', 'directorx_ip_rewrite'],
  'video-prompt-reverse': ['directorx_video_analyze', 'directorx_extract_frames', 'directorx_view_image'],
  'kling-prompt-copilot': ['directorx_prompt_craft', 'directorx_generate_video'],
  'seedance-2-prompt-copilot': ['directorx_prompt_craft', 'directorx_generate_video'],
  'seedance-2-5-prompt-copilot': ['directorx_prompt_craft', 'directorx_generate_video'],
  'minimax-h3-prompt-copilot': ['directorx_prompt_craft', 'directorx_generate_video'],
  'gpt-image2-prompt-copilot': ['directorx_prompt_craft', 'directorx_generate_image'],
  'banana-prompt-copilot': ['directorx_prompt_craft', 'directorx_generate_image'],
  'cinematic-style': ['directorx_style', 'directorx_knowledge_search'],
  'continuous-video': ['directorx_generate_ready', 'directorx_extract_frames', 'directorx_canvas_connect'],
  'caption-localization': ['directorx_transcribe_audio', 'directorx_srt_lint', 'directorx_video_subtitle'],
  'ai-audio': ['directorx_generate_audio', 'directorx_audio_sync'],
  'audio-sound': ['directorx_audio_mix', 'directorx_audio_beat', 'directorx_audio_sync'],
  'platform-specs': ['directorx_qa', 'directorx_video_process'],
  'thumbnail-cover': ['directorx_generate_image', 'directorx_view_image'],
  'script-writing': ['directorx_storyboard', 'directorx_brief'],
  'short-video': ['directorx_chengpian', 'directorx_brief', 'directorx_qa'],
}

interface Rule {
  id: string
  match: RegExp
  mode: SkillRouteMode
  reason: string
  skills: string[]
  knowledge: string[]
  extraTools?: string[]
}

const RULES: Rule[] = [
  {
    id: 'blocking',
    match: /场面控制|场面锁|作战板|完全控制|多人连续|单镜长拍|世界状态|空间台账|控球权|状态机/i,
    mode: 'generate',
    reason: '场面控制表：先 harvest/schema，你写台账和物件状态机，pin 后再 craft。不要直接拿事件顺序去 generate。',
    skills: ['directorx-blocking-craft', 'continuous-video', 'directorx-production-lead', 'directorx-chengpian'],
    knowledge: ['连续性 空间 镜头'],
    extraTools: ['directorx_blocking', 'directorx_ask', 'directorx_prompt_plan', 'directorx_prompt_craft', 'directorx_generate_ready'],
  },
  {
    id: 'series',
    match: /同一系列|系列包|沿用设定|保存这次设定|保存本系列|下一集|续作|调用系列|套用系列/i,
    mode: 'research',
    reason: '系列包：角色锚、风格锁、镜头规则一次收成，下次 apply，不要重设计人设。',
    skills: ['directorx-series-craft', 'directorx-production-lead', 'directorx-chengpian'],
    knowledge: ['角色 一致性 风格锁'],
    extraTools: ['directorx_series', 'directorx_character_list', 'directorx_style_get'],
  },
  {
    id: 'revise',
    match: /再生动|改这一镜|只改这|这个表情|这张脸|这里眼神|节点重做|局部改(?!窗)/i,
    mode: 'generate',
    reason: '只改这一镜：先 directorx_revise 带上节点上下文，再走 craft/ready。不要重输整片设定。',
    skills: ['directorx-series-craft', 'directorx-production-lead', 'directorx-chengpian'],
    knowledge: ['角色 一致性'],
    extraTools: ['directorx_revise', 'directorx_prompt_plan', 'directorx_prompt_craft', 'directorx_generate_ready'],
  },
  {
    id: 'capture',
    match: /保存为技能|存成 skill|收成技能|skill_capture|保存本次为/i,
    mode: 'research',
    reason: '交片后收成：用 DSH 标准提问是否保存为技能，再把流程和修改意见写成 SKILL.md。',
    skills: ['directorx-skill-capture', 'directorx-chengpian'],
    knowledge: ['成片 流程'],
    extraTools: ['directorx_skill_capture', 'directorx_note', 'directorx_ask'],
  },
  {
    id: 'onboard',
    match: /接入模型|新模型|apidoc|api.?doc|provider.?onboard|自配置模型/i,
    mode: 'onboard',
    reason: '新模型入驻：只走 ingest→classify→draft→ask→smoke→commit，禁止写代码。',
    skills: ['directorx-provider-onboard'],
    knowledge: ['生成协议 create poll'],
    extraTools: ['directorx_provider_list'],
  },
  {
    id: 'edit',
    match: /剪辑|精剪|裁剪|裁切|调色|旋转|翻转|变速|倒放|拼接|编辑台|cut list|timeline/i,
    mode: 'edit',
    reason: '确定性编辑：先 edit_plan，再本地工具回写节点，不重绘。',
    skills: ['editing-workflow', 'directorx-methodology'],
    knowledge: ['剪辑节奏 转场'],
    extraTools: ['directorx_edit_plan', 'directorx_studio', 'directorx_image_edit'],
  },
  {
    id: 'character',
    match: /设定图|三视图|角色卡|定妆|turnaround|character sheet|人物设定|角色设定/i,
    mode: 'character',
    reason: '人物先出 16:9 三视图设定表，再注册角色锚点。',
    skills: ['novel-characters', 'directorx-production-lead', 'directorx-methodology'],
    knowledge: ['角色 三视图 一致性'],
    extraTools: ['directorx_character_register', 'directorx_generate_ready'],
  },
  {
    id: 'script',
    match: /改编小说|小说改编|改编.{0,16}(小说|短剧)|写大纲|写剧本|分集|长剧|短剧大纲/i,
    mode: 'script',
    reason: '改编：大纲先收敛结构；角色/美术/剧本可并行；分镜只映射不发明。评审钉画布，不要 HTML。',
    skills: ['novel-outline', 'novel-characters', 'novel-script', 'novel-storyboard', 'directorx-production-lead'],
    knowledge: ['改编 叙事结构'],
    extraTools: ['directorx_brief', 'directorx_bible', 'directorx_confirm'],
  },
  {
    id: 'vocab',
    match: /镜头语汇|正反打|怎么切|运镜词|shot vocab|这一刀/i,
    mode: 'canvas',
    reason: '先查配方/技法卡：怎么切、什么时候别用，再写这一格。',
    skills: ['shot-recipes', 'storyboard-craft'],
    knowledge: ['镜头语言 景别 运镜'],
    extraTools: ['directorx_shot_vocab', 'directorx_storyboard'],
  },
  {
    id: 'canvas-craft',
    match: /铺成分镜|分镜行|抽帧上板|按引用连|自动连线|一键解析|解析成片|片段重做|局部重拍|重做这段|拼成片|接触表|宫格切开|宫格拼回|分镜组|分屏对照|去硬字|去字幕|续写位|导出动图|拼成一条/i,
    mode: 'canvas',
    reason: '画布工艺：剧本拆行、抽帧上板、一键解析、片段重做、拼成片、接触表、宫格切开、按引用连线。解析/切窗/拼接/切开不生成；重做中段才走生成闸。',
    skills: ['storyboard-craft', 'frame-qa', 'editing-workflow'],
    knowledge: ['分镜 景别 运镜'],
    extraTools: ['directorx_canvas_script', 'directorx_canvas_frames', 'directorx_canvas_parse', 'directorx_canvas_reshoot', 'directorx_canvas_pack', 'directorx_canvas_sheet', 'directorx_canvas_split', 'directorx_canvas_join', 'directorx_canvas_stack', 'directorx_canvas_desub', 'directorx_canvas_extend', 'directorx_canvas_gif', 'directorx_canvas_autolink'],
  },
  {
    id: 'trailer',
    match: /预告片|电影预告|片花|热血漫|日漫.{0,12}(预告|热血)|shonen/i,
    mode: 'generate',
    reason: '预告片：钩子→世界→升级→片名，硬切组装。日漫热血先锁原创角色锚，专名不进生成。',
    skills: ['trailer-craft', 'minimax-h3-prompt-copilot', 'cinematic-style', 'directorx-production-lead', 'directorx-chengpian'],
    knowledge: ['预告片 钩子 硬切', '日漫 热血 镜头'],
    extraTools: ['directorx_canvas_pack', 'directorx_prompt_plan', 'directorx_prompt_craft', 'directorx_generate_ready'],
  },
  {
    id: 'storyboard',
    match: /分镜|落到画布|storyboard|镜号|排片/i,
    mode: 'canvas',
    reason: '分镜先签字再 canvas_plan；UI 不得写 generating。',
    skills: ['storyboard-craft', 'directorx-production-lead', 'directorx-chengpian'],
    knowledge: ['分镜 景别 运镜'],
    extraTools: ['directorx_storyboard', 'directorx_canvas_shotlist', 'directorx_confirm', 'directorx_canvas_plan', 'directorx_canvas_script'],
  },
  {
    id: 'qa',
    match: /质检|抽帧看|看看成片|对照提示词|\bqa\b/i,
    mode: 'qa',
    reason: '先抽帧再看图像素，结论引用 methodology 规则号。',
    skills: ['frame-qa', 'directorx-methodology'],
    knowledge: ['成片质检 黑场 响度'],
    extraTools: ['directorx_extract_frames', 'directorx_view_image', 'directorx_qa'],
  },
  {
    id: 'style',
    match: /王家卫|韦斯|安德森|赛博朋克|黑色电影|吉卜力|风格致敬|像.+的(片子|风格)/i,
    mode: 'style',
    reason: '风格用 corpus + directorx_style 注入，不臆造。',
    skills: ['cinematic-style', 'directorx-methodology', 'video-prompt-builder'],
    knowledge: ['镜头语言 风格 光影'],
    extraTools: ['directorx_style', 'directorx_knowledge_search'],
  },
  {
    id: 'kling',
    match: /可灵|kling/i,
    mode: 'generate',
    reason: '可灵提示词先读对应 copilot，再 craft + ready。',
    skills: ['kling-prompt-copilot', 'directorx-production-lead', 'directorx-chengpian'],
    knowledge: ['可灵 提示词'],
    extraTools: ['directorx_prompt_plan', 'directorx_prompt_craft', 'directorx_generate_ready'],
  },
  {
    id: 'seedance',
    match: /即梦|seedance/i,
    mode: 'generate',
    reason: 'Seedance 提示词先读 copilot。',
    skills: ['seedance-2-prompt-copilot', 'directorx-production-lead', 'directorx-chengpian'],
    knowledge: ['即梦 提示词'],
    extraTools: ['directorx_prompt_plan', 'directorx_prompt_craft', 'directorx_generate_ready'],
  },
  {
    id: 'minimax',
    match: /minimax|海螺|\bh3\b|t2va|i2va|fl2va|l2va|ref2va|极简产品广告|苹果味广告|歌词贴字|纸艺定格|手绘实拍/i,
    mode: 'generate',
    reason: 'H3 先读官方五种模式和片种方法，再按字段写成稿。有首尾帧不要再塞 reference。',
    skills: ['minimax-h3-prompt-copilot', 'directorx-production-lead', 'directorx-chengpian'],
    knowledge: ['minimax 提示词 时间线'],
    extraTools: ['directorx_prompt_plan', 'directorx_prompt_craft', 'directorx_generate_ready'],
  },
  {
    id: 'i2v',
    match: /图生视频|i2v|首尾帧|image.to.video/i,
    mode: 'generate',
    reason: '图生/首尾帧必须 generate_ready，缺帧先补。',
    skills: ['continuous-video', 'directorx-playbook', 'directorx-production-lead'],
    knowledge: ['图生视频 首尾帧'],
    extraTools: ['directorx_generate_ready', 'directorx_extract_frames'],
  },
  {
    id: 'generate',
    match: /生成|出图|出视频|出片|文生|做一条|做一张|拍摄|开拍/i,
    mode: 'generate',
    reason: '生成前必须 skill_read + knowledge_read + craft + ready。',
    skills: ['directorx-production-lead', 'directorx-chengpian', 'directorx-methodology', 'video-prompt-builder'],
    knowledge: ['提示词 镜头语言'],
    extraTools: ['directorx_chengpian', 'directorx_prompt_plan', 'directorx_prompt_craft', 'directorx_generate_ready'],
  },
]

const DEFAULT_ROUTE: SkillRoute = {
  mode: 'research',
  reason: '未命中专项：先 production-lead + 知识/技能检索，再决定生成还是编辑。',
  skills: ['directorx-production-lead', 'directorx-chengpian', 'directorx-methodology'],
  knowledge: ['成片 导演'],
  articles: articlesForMode('research'),
  tools: ['directorx_skill_search', 'directorx_knowledge_search', 'directorx_brief'],
  next: [
    'directorx_skill_read directorx-production-lead',
    'directorx_skill_read directorx-chengpian',
    ...articlesForMode('research').map(id => `directorx_knowledge_read ${id}`),
  ],
  avoid: ['不要跳过 skill_read 直接 generate', '不要在正文写编号菜单'],
}

export function toolsForSkill(name: string): string[] {
  return SKILL_TOOLS[name] ?? []
}

function unique(items: string[]): string[] {
  return [...new Set(items.filter(item => item !== ''))]
}

function withIpRoute(intent: string, route: SkillRoute): SkillRoute {
  if (scanIpRisk(intent).length === 0) return route
  return {
    ...route,
    articles: unique(['213', ...route.articles]),
    knowledge: unique(['版权安全 泛化 213', ...route.knowledge]),
    tools: unique(['directorx_ip_scan', 'directorx_ip_rewrite', ...route.tools]),
    next: unique(['directorx_ip_scan', 'directorx_knowledge_read 213', ...route.next]),
    avoid: unique([
      ...route.avoid,
      '不要把 IP 专名送进 generate；不要套固定替换句。先 ip_scan，按方法结合项目记忆写细，ip_rewrite 验收并记入记忆',
    ]),
  }
}

export function routeSkills(intent: string): SkillRoute {
  const text = intent.trim()
  if (text === '') {
    return {
      ...DEFAULT_ROUTE,
      reason: '没有意图。先问用户要生成、剪辑还是整理画布。',
      next: ['directorx_ask'],
    }
  }
  const rule = RULES.find(item => item.match.test(text))
  if (rule === undefined) {
    return withIpRoute(text, { ...DEFAULT_ROUTE, knowledge: unique([text, ...DEFAULT_ROUTE.knowledge]) })
  }

  const tools = unique([
    ...rule.skills.flatMap(name => toolsForSkill(name)),
    ...(rule.extraTools ?? []),
  ])
  const articles = unique([...articlesForSkills(rule.skills), ...articlesForMode(rule.mode)])
  const next = [
    ...rule.skills.map(name => `directorx_skill_read ${name}`),
    ...articles.slice(0, 4).map(id => `directorx_knowledge_read ${id}`),
    ...tools.slice(0, 4),
  ]
  const avoid = [
    '不要只看 skill 目录摘要，必须 skill_read 正文',
    '知识库用返回的文章 id 直接 knowledge_read，不要另起一套检索词',
    rule.mode === 'generate' ? '没有 craftId+readyId 不许 generate/propose' : '',
    rule.mode === 'edit' ? '不要用生成模型完成裁切/旋转/调色/变速' : '',
    rule.mode === 'canvas' ? '未 confirm 不要 canvas_plan / 批量占位' : '',
    rule.mode === 'onboard' ? '不要生成代码或回显 API Key' : '',
  ].filter(Boolean)
  return withIpRoute(text, {
    mode: rule.mode,
    reason: rule.reason,
    skills: rule.skills,
    knowledge: rule.knowledge,
    articles,
    tools,
    next,
    avoid,
  })
}
