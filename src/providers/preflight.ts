/**
 * Pre-flight audit for paid generation: the four gates from the bundled
 * directorx-playbook skill, implemented deterministically (no model calls):
 * 规格 (parameters complete), 内容 (prompt executable / six-element lint),
 * 成本 (budget & retry policy acknowledged), 权利 (IP/persona/music flags).
 */

export interface PreflightInput {
  prompt: string
  model?: string
  type?: 'image' | 'video' | 'audio'
  size?: string
  duration?: number
  count?: number
  negative?: string
  userConfirmedBudget?: boolean
  userConfirmedContent?: boolean
}

export interface GateResult {
  pass: boolean
  issues: string[]
  notes: string[]
}

export interface PreflightOutput {
  gates: { spec: GateResult; content: GateResult; cost: GateResult; rights: GateResult }
  verdict: 'pass' | 'review'
  summary: string
}

const COMMON_SIZES = ['1:1', '16:9', '9:16', '4:3', '3:4', '21:9']
const COMMON_VIDEO_SIZES = ['720p', '1080p', '2k', '1280x720', '1920x1080']

// Six-element heuristic keywords (Chinese, ground-level matching only).
const ELEMENTS: Array<{ name: string; keywords: string[] }> = [
  { name: '主体', keywords: ['人', '角色', '人物', '主角', '动物', '产品', '车', '建筑', '机械', '猫', '狗', '演员', '女孩', '男孩', '男人', '女人'] },
  { name: '动作', keywords: ['走', '跑', '跳', '转身', '回头', '笑', '飞', '流', '落', '升起', '旋转', '推进', '移动', '舞', '打', '握', '拿起', '奔跑'] },
  { name: '场景', keywords: ['街', '巷', '城市', '山', '海', '房间', '森林', '天空', '沙漠', '办公室', '舞台', '雨', '夜', '室内', '户外'] },
  { name: '光线', keywords: ['光', '灯', '逆光', '侧光', '霓虹', '阳光', '月光', '暗', '阴影', '曝光', '暖光', '冷光'] },
  { name: '风格', keywords: ['风格', '电影感', '写实', '赛博', '二次元', '卡通', '油画', '水墨', '胶片', '纪实', '广告', '高对比'] },
  { name: '负面词', keywords: ['禁止', '不要', '避免', '无水印', '无字幕', '不变形'] },
]

const IP_FLAGS: Array<{ name: string; keywords: string[] }> = [
  { name: '真人肖像', keywords: ['明星', '周杰伦', '刘亦菲', '杨幂', '成龙', '马斯克', '马云'] },
  { name: '品牌/IP', keywords: ['米奇', '米老鼠', '迪士尼', '哈利波特', '奥特曼', '皮卡丘', 'Hello Kitty', '乐高', '耐克', 'Nike', '苹果logo'] },
  { name: '音乐版权', keywords: ['周杰伦的歌', '原声带', '翻唱', '采样'] },
  { name: '风格模仿', keywords: ['宫崎骏风格', '吉卜力风格', '新海诚风格', '梵高风格'] },
]

export function preflight(input: PreflightInput): PreflightOutput {
  const prompt = (input.prompt ?? '').trim()
  const gates: PreflightOutput['gates'] = {
    spec: { pass: true, issues: [], notes: [] },
    content: { pass: true, issues: [], notes: [] },
    cost: { pass: false, issues: [], notes: [] },
    rights: { pass: true, issues: [], notes: [] },
  }
  // 规格
  if (prompt === '') gates.spec.issues.push('提示词为空')
  if (input.type === 'video' && input.duration !== undefined && (input.duration < 1 || input.duration > 30)) {
    gates.spec.issues.push(`视频时长 ${input.duration}s 超出常规（1–30s 需与用户确认）`)
  }
  if (input.size !== undefined && input.size !== '') {
    const normalized = input.size.toLowerCase()
    if (!COMMON_SIZES.includes(normalized) && !COMMON_VIDEO_SIZES.includes(normalized)) {
      gates.spec.issues.push(`尺寸 "${input.size}" 不是常见枚举（${COMMON_SIZES.join('/')}）`)
    }
  }
  if (input.model !== undefined && input.model !== '') {
    gates.spec.notes.push(`模型 ${input.model}：以 directorx_knowledge_search 核实该模型规格后再提交`)
  }
  gates.spec.pass = gates.spec.issues.length === 0

  // 内容（六要素 lint）
  for (const element of ELEMENTS) {
    if (!element.keywords.some(keyword => prompt.includes(keyword))) {
      gates.content.issues.push(`缺少${element.name}要素`)
    }
  }
  if (prompt.length > 0 && prompt.length < 12) gates.content.issues.push('提示词过短，信息不足')
  if (input.userConfirmedContent === true) gates.content.notes.push('内容已经用户确认')
  else gates.content.notes.push('内容闸门需要用户确认脚本/提示词（未确认则先生成占位计划）')
  gates.content.pass = gates.content.issues.length === 0

  // 成本
  const count = input.count ?? 1
  gates.cost.issues.push(`预计生成 ${count} 次；本插件无模型价目表——需与用户确认预算上限与失败重试策略（先 mock/低档验证构图，再付费）`)
  if (input.userConfirmedBudget === true) {
    gates.cost.issues.length = 0
    gates.cost.notes.push('预算已经用户确认')
    gates.cost.pass = true
  }

  // 权利
  for (const flag of IP_FLAGS) {
    if (flag.keywords.some(keyword => prompt.includes(keyword))) {
      gates.rights.issues.push(`可能涉及${flag.name}授权：确认权利范围内再生成`)
    }
  }
  gates.rights.pass = gates.rights.issues.length === 0

  const pass = gates.spec.pass && gates.content.pass && gates.cost.pass && gates.rights.pass
  return {
    gates,
    verdict: pass ? 'pass' : 'review',
    summary: pass
      ? '四道闸门通过，可提交生成。'
      : '存在待办闸门：先修复 issues（或与用户确认），按 directorx-playbook 先占位后生成。',
  }
}
