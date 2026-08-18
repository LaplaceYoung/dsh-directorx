import { buildIpBrief, type IpRewriteBrief } from './ip-lexicon.ts'
import { routeSkills, type SkillRoute } from './skill-route.ts'

export type PromptPlanKind = 'image' | 'video' | 'audio'
export type PromptLevel = 'L1' | 'L2' | 'L3'

export interface PromptElement {
  name: string
  present: boolean
  write: string
}

export interface PromptPlan {
  kind: PromptPlanKind
  intent: string
  level: PromptLevel
  strategyHint: string
  route: SkillRoute
  elements: PromptElement[]
  physics: string[]
  copilot?: string
  ip?: IpRewriteBrief
  next: string[]
  agentPrompt: string
}

const ELEMENTS: Array<{ name: string; write: string; keywords: string[] }> = [
  { name: '主体', write: '谁/什么在场：体貌、服装、比例用属性写，不点名 IP', keywords: ['人', '角色', '人物', '主角', '女', '男', '动物', '车', '产品', '机械'] },
  { name: '动作', write: '一个完整可观察动作：起势 → 接触 → 结束状态', keywords: ['走', '跑', '转', '回头', '推', '拉', '打', '握', '飞', '落', '站', '坐'] },
  { name: '场景', write: '空间类型、天气、时间、前后景层次', keywords: ['街', '巷', '城', '房', '夜', '雨', '室内', '户外', '海', '山', '舞台'] },
  { name: '光线', write: '光源在哪、色温、软硬、画内是否可见', keywords: ['光', '灯', '逆光', '侧光', '霓虹', '阳光', '月光', '暗', '暖', '冷'] },
  { name: '镜头', write: '景别、机位、运镜、焦段、构图', keywords: ['镜头', '景别', '运镜', '特写', '全景', '跟', '推', '35mm', '构图'] },
  { name: '负面', write: '解剖错误/模糊/水印/闪烁，外加 IP 排除词', keywords: ['不要', '避免', '禁止', '无水印', '无字幕'] },
]

const PHYSICS = [
  'cause：动作从哪块肌肉/哪件物体起势',
  'contact：力打在哪个接触点',
  'force：方向、大小、是否加速',
  'feedback：身体或物体怎么变形、位移',
  'result：镜头结束时的静止或新平衡',
]

const COPILOTS: Array<{ match: RegExp; skill: string }> = [
  { match: /可灵|kling/i, skill: 'kling-prompt-copilot' },
  { match: /即梦|seedance/i, skill: 'seedance-2-prompt-copilot' },
  { match: /minimax|海螺|\bh3\b/i, skill: 'minimax-h3-prompt-copilot' },
  { match: /gpt-image|gpt image/i, skill: 'gpt-image2-prompt-copilot' },
  { match: /banana|nano.?banana/i, skill: 'banana-prompt-copilot' },
]

function inferKind(intent: string, kind?: PromptPlanKind): PromptPlanKind {
  if (kind !== undefined) return kind
  if (/口播|配音|旁白|tts|音乐/i.test(intent)) return 'audio'
  if (/出图|静帧|海报|设定图|三视图|封面/i.test(intent) && !/视频|出片|开拍/i.test(intent)) return 'image'
  return 'video'
}

function inferLevel(intent: string, kind: PromptPlanKind): PromptLevel {
  if (kind === 'audio') return 'L1'
  if (/格斗|物理|多角色|连续剧|长片|变身|关节|场面锁|完全控制|单镜长拍/i.test(intent)) return 'L3'
  if (/叙事|分镜|角色|连续|宣传片|短剧|跟镜/i.test(intent) || kind === 'video') return 'L2'
  return 'L1'
}

function inferStrategy(intent: string, kind: PromptPlanKind): string {
  if (/设定图|三视图|定妆|turnaround/i.test(intent)) return 'character-sheet'
  if (/空镜|场景设定|establishing/i.test(intent)) return 'scene-still'
  if (/关键帧|keyframe/i.test(intent)) return 'keyframe'
  if (/首尾帧|转场到|fl2va/i.test(intent)) return 'fl2v'
  if (/ref2va|全参考|多参考/i.test(intent)) return 'ref2v'
  if (/尾帧落地|l2va/i.test(intent)) return 'i2v'
  if (/图生|i2v|i2va|用这张|以这张/i.test(intent)) return 'i2v'
  if (/t2va/i.test(intent)) return 't2v'
  if (kind === 'image') return 't2i'
  if (kind === 'audio') return 'tts'
  return 't2v'
}

function inferCopilot(intent: string, model?: string): string | undefined {
  const blob = `${intent} ${model ?? ''}`
  return COPILOTS.find(item => item.match.test(blob))?.skill
}

function missingElements(intent: string): PromptElement[] {
  return ELEMENTS.map(item => ({
    name: item.name,
    present: item.keywords.some(keyword => intent.includes(keyword)),
    write: item.write,
  }))
}

export function planPrompt(input: {
  intent: string
  kind?: PromptPlanKind
  model?: string
}): PromptPlan {
  const intent = input.intent.trim()
  const kind = inferKind(intent, input.kind)
  const route = routeSkills(intent === '' ? '开拍' : intent)
  const level = inferLevel(intent, kind)
  const strategyHint = inferStrategy(intent, kind)
  const elements = missingElements(intent)
  const physics = kind === 'video' ? PHYSICS : []
  const copilot = inferCopilot(intent, input.model)
  const ip = buildIpBrief(intent)
  const next = [
    ...route.skills.slice(0, 3).map(name => `directorx_skill_read ${name}`),
    ...(copilot !== undefined && !route.skills.includes(copilot) ? [`directorx_skill_read ${copilot}`] : []),
    ...route.articles.slice(0, 3).map(id => `directorx_knowledge_read ${id}`),
    ...(ip.dirty ? ['directorx_ip_scan', 'directorx_knowledge_read 213', 'directorx_ip_rewrite'] : []),
    ...(/场面锁|场面控制|作战板|完全控制|多人连续|单镜长拍/.test(intent) ? ['directorx_blocking harvest', 'directorx_blocking schema'] : []),
    'directorx_prompt_craft（intent=原句，prompt=按本计划写细的成稿）',
    'directorx_generate_ready',
  ]
  const lacking = elements.filter(item => !item.present).map(item => item.name)
  const agentPrompt = [
    '提示词编排（工程只给方法和缺口，成稿必须你按当前镜头写细，禁止拿原句或固定模板当生成稿）：',
    `意图：${intent || '（空）'}`,
    `形态：${kind} · 等级 ${level}（video-prompt-builder）· 策略提示 ${strategyHint}`,
    copilot !== undefined ? `模型技能：先 skill_read ${copilot}${copilot === 'minimax-h3-prompt-copilot' ? '（必读 handbook.md 规格和三段公式，再读模式篇）' : ''}，按该模型吃的格式写` : '模型未点名：用通用导演语言，正说、具体运动',
    `六要素：${elements.map(item => `${item.name}${item.present ? '✓' : '△'}`).join(' / ')}`,
    lacking.length > 0 ? `成稿必须补上：${lacking.join('、')}` : '六要素都有种子，展开成导演语言',
    ...elements.filter(item => !item.present).map(item => `- ${item.name}：${item.write}`),
    physics.length > 0 ? `物理链（规则 104）：${physics.join(' → ')}` : '',
    ip.dirty ? `版权：先按 ip_scan 方法改写，禁止专名进成稿。负向：${ip.negativeLine}` : '',
    /场面锁|场面控制|作战板|完全控制|多人连续|单镜长拍/.test(intent)
      ? '多人连续先 directorx_blocking：用户只给角色图、开场和事件顺序，你写台账和物件状态机，pin 后再成本稿。'
      : '',
    '未锁的人物/场景不要写进 generate（规则 103）。写成稿后 directorx_prompt_craft，再 generate_ready。',
  ].filter(Boolean).join('\n')
  return {
    kind,
    intent,
    level,
    strategyHint,
    route,
    elements,
    physics,
    ...(copilot !== undefined ? { copilot } : {}),
    ...(ip.dirty ? { ip } : {}),
    next,
    agentPrompt,
  }
}
