export type IpKind = 'character' | 'brand' | 'artist' | 'likeness' | 'music' | 'combo'

export interface IpEntry {
  terms: string[]
  kind: Exclude<IpKind, 'combo'>
  exclude: string[]
}

export interface IpCombo {
  keys: string[]
  kind: 'combo'
  label: string
  exclude: string[]
}

export interface IpHit {
  start: number
  end: number
  term: string
  kind: IpKind
  risk: string
  exclude: string[]
  axes: string[]
}

export interface IpRewriteMethod {
  name: 'genericization+negative'
  sources: string[]
  steps: string[]
}

export interface IpMemoryHint {
  terms: string[]
  kind: IpKind
  source: string
  rewrite: string
  uses: number
}

export interface IpRewriteBrief {
  dirty: boolean
  hits: IpHit[]
  keep: string[]
  exclude: string[]
  negativeLine: string
  method: IpRewriteMethod
  knowledge: string[]
  next: string[]
  agentPrompt: string
}

const RISK: Record<IpKind, string> = {
  character: '角色名/商标可能受版权保护。按角色轴写外形与情境，不要点名 IP。',
  brand: '品牌或工作室名可能受商标保护。写空间与材质，不要可识别商标。',
  artist: '在世作者/工作室风格点名有模仿风险。写光线、笔触、色彩，不要作者名。',
  likeness: '真人姓名可能涉及肖像权。写体貌与气质，不要写真人姓名。',
  music: '曲名/歌手点名可能涉及词曲与录音权。写配器与情绪，不要点曲名。',
  combo: '未点名也可能触发受保护形象（外形关键词组合）。改成更泛的原创描述，并加负向排除。',
}

export const IP_AXES: Record<IpKind, string[]> = {
  character: [
    '原型：职业/物种/年龄段，不用原名',
    '体型比例与运动方式',
    '服装：剪裁、材质、色块关系；不要复刻可识别经典套装剪影',
    '标志物改成几何或抽象形状，不要商标纹样',
    '把本句已有的动作、场景、光线写进去',
  ],
  brand: [
    '空间类型、材质、色温、陈设',
    '禁止可识别商标、字标、吉祥物剪影',
  ],
  artist: [
    '光线与空气感',
    '笔触或媒介',
    '构图习惯',
    '色彩关系',
    '历史时期或艺术运动，不要作者名/工作室名',
  ],
  likeness: [
    '年龄段、体型、发型结构、神态、服装',
    '禁止真人姓名',
  ],
  music: [
    '配器、节奏、调性、情绪',
    '禁止曲名与歌手',
  ],
  combo: [
    '拆开外形关键词，改成更泛的原创组合',
    '负向排除对应专名',
    '不要用更接近原作的经典剪影补上',
  ],
}

export const IP_METHOD: IpRewriteMethod = {
  name: 'genericization+negative',
  sources: [
    'Nature PREGen genericization (s41598-025-90827-1)：描述属性，不点名身份',
    'arXiv Safer Prompts (2505.03338)：去专名，锚定艺术运动/时期/通用技法',
    'arXiv Fantastic Copyrighted Beasts (2406.14526)：只改写约 50%，改写+负向排除约 80%',
    'Houston Law Review：用一般描述替换专名，不复制可识别形象',
  ],
  steps: [
    '泛化：按检出类型的属性轴写外形/光线/材质/媒介，不写身份名',
    '去专名：成稿正文不再出现检出词及其别名',
    '非 IP 锚定：艺术运动、历史时期、通用技法，不要工作室名',
    '保留情境：本句里与身份无关的动作、场景、光线必须留下来并写细',
    '负向排除：把 exclude 写入 negative_prompt（改写不够，必须加负向）',
    '不要用更接近原作的经典剪影或配色套件顶替专名',
    '结合项目记忆改写当前镜头，不要照抄上次成稿',
  ],
}

function item(kind: IpEntry['kind'], terms: string[], exclude: string[] = []): IpEntry {
  return { kind, terms, exclude: [...new Set([...exclude, ...terms])] }
}

const ENTRIES: IpEntry[] = [
  item('character', ['蜘蛛侠', 'spiderman', 'spider-man', 'spider man'], ['marvel', '漫威']),
  item('character', ['蝙蝠侠', 'batman'], ['dc', '哥谭', 'gotham']),
  item('character', ['超人', 'superman']),
  item('character', ['钢铁侠', 'iron man', 'ironman']),
  item('character', ['美国队长', 'captain america']),
  item('character', ['黑寡妇', 'black widow']),
  item('character', ['灭霸', 'thanos']),
  item('character', ['小丑', 'joker']),
  item('character', ['神奇女侠', 'wonder woman']),
  item('character', ['哈利波特', 'harry potter']),
  item('character', ['伏地魔', 'voldemort']),
  item('character', ['皮卡丘', 'pikachu'], ['pokemon', '宝可梦', '口袋妖怪']),
  item('character', ['宝可梦', 'pokemon', 'pocket monsters']),
  item('character', ['奥特曼']),
  item('character', ['哆啦a梦', '哆啦A梦', '机器猫', 'doraemon']),
  item('character', ['初音未来', 'hatsune miku']),
  item('character', ['马里奥', '超级马里奥', 'super mario'], ['nintendo', '任天堂']),
  item('character', ['路易吉', 'luigi']),
  item('character', ['路飞', '海贼王', 'one piece']),
  item('character', ['鸣人', '火影忍者', 'naruto']),
  item('character', ['超级赛亚人', '龙珠', 'dragon ball', '七龙珠']),
  item('character', ['孙悟空']),
  item('character', ['米老鼠', '米奇老鼠', 'mickey mouse']),
  item('character', ['唐老鸭', 'donald duck']),
  item('character', ['hello kitty', 'hellokitty']),
  item('character', ['冰雪奇缘', '艾莎', 'elisa', 'elsa', 'frozen']),
  item('character', ['小黄人', 'minions']),
  item('character', ['熊本熊', 'kumamon']),
  item('character', ['兔八哥', 'bugs bunny']),
  item('character', ['高达', 'gundam']),
  item('character', ['初号机', 'eva初号机', 'evangelion']),
  item('character', ['蜡笔小新', '野原新之助']),
  item('character', ['名侦探柯南']),
  item('character', ['樱桃小丸子']),
  item('character', ['喜羊羊', '灰太狼']),
  item('character', ['哪吒之魔童']),
  item('character', ['星战', '星球大战', 'star wars', '达斯维达', 'darth vader', '绝地']),
  item('character', ['霍格沃茨', 'hogwarts']),
  item('brand', ['迪士尼', 'disney', '华特迪士尼']),
  item('brand', ['漫威', 'marvel']),
  item('brand', ['华纳', 'warner bros', 'dc漫画', 'dc comics']),
  item('brand', ['乐高', 'lego']),
  item('brand', ['耐克', 'nike', 'swoosh']),
  item('brand', ['苹果logo', 'apple logo']),
  item('brand', ['麦当劳', 'mcdonald']),
  item('brand', ['星巴克', 'starbucks']),
  item('brand', ['任天堂', 'nintendo']),
  item('artist', ['宫崎骏风格', '宫崎骏', '吉卜力风格', '吉卜力', 'ghibli', 'studio ghibli']),
  item('artist', ['新海诚风格', '新海诚']),
  item('artist', ['今敏风格', '今敏']),
  item('artist', ['梵高风格', '梵高', 'van gogh']),
  item('artist', ['莫奈风格', '莫奈', 'monet']),
  item('artist', ['韦斯安德森风格', '韦斯·安德森', 'wes anderson']),
  item('artist', ['王家卫风格', '王家卫']),
  item('likeness', ['周杰伦', '刘亦菲', '杨幂', '成龙', '马斯克', 'elon musk', '马云', '特朗普', 'trump']),
  item('music', ['周杰伦的歌', '原声带', '好莱坞配乐']),
]

const COMBOS: IpCombo[] = [
  { keys: ['水管工', '游戏'], kind: 'combo', label: '水管工+游戏', exclude: ['mario', '马里奥', 'nintendo'] },
  { keys: ['plumber', 'videogame'], kind: 'combo', label: 'plumber+videogame', exclude: ['mario', 'nintendo'] },
  { keys: ['黄皮', '电气', '老鼠'], kind: 'combo', label: '黄皮电气鼠', exclude: ['pikachu', '皮卡丘', 'pokemon'] },
  { keys: ['红蓝紧身衣', '胸口'], kind: 'combo', label: '红蓝紧身衣+徽记', exclude: ['superman', '超人'] },
  { keys: ['尖耳头罩', '披风', 'Gotham'], kind: 'combo', label: '尖耳头罩+披风', exclude: ['batman', '蝙蝠侠'] },
]

const KIND_LABEL: Record<IpKind, string> = {
  character: '角色 IP',
  brand: '品牌/商标',
  artist: '作者风格',
  likeness: '真人肖像',
  music: '音乐版权',
  combo: '外形组合',
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function termPattern(term: string): RegExp {
  const body = escapeRegExp(term)
  if (/^[a-z0-9]/i.test(term)) return new RegExp(`(?<![a-z0-9])${body}(?![a-z0-9])`, 'gi')
  return new RegExp(body, 'gi')
}

function latinWord(term: string, text: string, index: number): boolean {
  if (!/^[a-z0-9]/i.test(term)) return true
  const before = index === 0 ? '' : text[index - 1] ?? ''
  const after = text[index + term.length] ?? ''
  return !/[a-z0-9]/i.test(before) && !/[a-z0-9]/i.test(after)
}

function hitFromEntry(start: number, end: number, term: string, kind: IpKind, exclude: string[]): IpHit {
  return {
    start,
    end,
    term,
    kind,
    risk: RISK[kind],
    exclude,
    axes: IP_AXES[kind],
  }
}

let scanCacheText = ''
let scanCacheHits: IpHit[] = []

export function scanIpRisk(text: string): IpHit[] {
  if (text === scanCacheText) return scanCacheHits
  const hits = scanIpRiskFresh(text)
  scanCacheText = text
  scanCacheHits = hits
  return hits
}

function scanIpRiskFresh(text: string): IpHit[] {
  if (text.trim() === '') return []
  const hits: IpHit[] = []
  const taken: Array<{ start: number; end: number }> = []
  const catalog = ENTRIES.flatMap(entry => entry.terms.map(term => ({ term, entry })))
    .sort((left, right) => right.term.length - left.term.length)
  for (const { term, entry } of catalog) {
    const pattern = termPattern(term)
    let match = pattern.exec(text)
    while (match !== null) {
      const start = match.index
      const end = start + match[0].length
      const overlap = taken.some(span => start < span.end && end > span.start)
      if (!overlap && latinWord(match[0], text, start)) {
        taken.push({ start, end })
        hits.push(hitFromEntry(start, end, match[0], entry.kind, entry.exclude))
      }
      match = pattern.exec(text)
    }
  }
  const lower = text.toLowerCase()
  for (const combo of COMBOS) {
    const found = combo.keys.every(key => lower.includes(key.toLowerCase()))
    if (!found) continue
    const first = combo.keys
      .map(key => ({ key, at: lower.indexOf(key.toLowerCase()) }))
      .filter(item => item.at >= 0)
      .sort((left, right) => left.at - right.at)[0]
    if (first === undefined) continue
    const start = first.at
    const end = start + first.key.length
    const overlap = taken.some(span => start < span.end && end > span.start)
    if (overlap) continue
    taken.push({ start, end })
    hits.push(hitFromEntry(start, end, combo.label, 'combo', combo.exclude))
  }
  return hits.sort((left, right) => left.start - right.start)
}

export function keepSpans(text: string, hits: IpHit[]): string[] {
  const parts: string[] = []
  let cursor = 0
  for (const hit of hits) {
    if (hit.start > cursor) {
      const frag = text.slice(cursor, hit.start).replace(/\s+/g, ' ').trim()
      if (frag !== '') parts.push(frag)
    }
    cursor = Math.max(cursor, hit.end)
  }
  if (cursor < text.length) {
    const frag = text.slice(cursor).replace(/\s+/g, ' ').trim()
    if (frag !== '') parts.push(frag)
  }
  return parts
}

export function collectNegatives(hits: IpHit[]): string[] {
  return [...new Set(hits.flatMap(hit => hit.exclude.map(item => item.trim()).filter(item => item !== '')))]
}

export function mergeNegativeLine(existing: string | undefined, extras: string[]): string {
  const parts = [
    ...(existing ?? '').split(/[,，;；]/).map(part => part.trim()).filter(part => part !== ''),
    'copyrighted character',
    'trademarked logo',
    ...extras,
  ]
  return [...new Set(parts)].join(', ')
}

export function ipIssueLine(hit: IpHit): string {
  return `提示词含「${hit.term}」（${KIND_LABEL[hit.kind]}）：${hit.risk}按 ${hit.axes[0] ?? '属性轴'} 结合当前镜头自己写，不要套固定成稿。`
}

function memoryBlock(memory: IpMemoryHint[]): string {
  if (memory.length === 0) return '本项目还没有这类改写记忆。按方法轴和本句情境写细。'
  return [
    '本项目记忆（用户用过并验收的改写；按当前镜头改，不要照抄）：',
    ...memory.map(entry => `- 「${entry.terms.slice(0, 3).join('/')}」×${entry.uses}：${entry.rewrite.slice(0, 240)}`),
  ].join('\n')
}

export function buildIpBrief(text: string, extras: { memory?: IpMemoryHint[]; existingNegative?: string } = {}): IpRewriteBrief {
  const hits = scanIpRisk(text)
  const keep = keepSpans(text, hits)
  const exclude = collectNegatives(hits)
  const negativeLine = hits.length === 0 ? (extras.existingNegative?.trim() ?? '') : mergeNegativeLine(extras.existingNegative, exclude)
  const dirty = hits.length > 0
  const memory = extras.memory ?? []
  const next = dirty
    ? [
        'directorx_knowledge_read 213',
        '按 method/axes 结合 keep 与项目记忆写细改写',
        'directorx_ip_rewrite 验收并记入记忆',
        '再 directorx_prompt_craft（intent=原句，prompt=改写稿）',
      ]
    : []
  const agentPrompt = dirty
    ? [
        '版权改写任务（工程只检出和方法编排，成稿必须你按当前镜头写细，禁止套固定替换句）：',
        `原句：${text.trim()}`,
        `检出：${hits.map(hit => `「${hit.term}」(${KIND_LABEL[hit.kind]})`).join('；')}`,
        keep.length > 0 ? `必须保留的情境：${keep.join(' / ')}` : '原句几乎只有专名：补上动作、场景、光线后再写外形。',
        '属性轴：',
        ...hits.flatMap(hit => [`- ${hit.term}：`, ...hit.axes.map(axis => `  · ${axis}`)]),
        '方法：',
        ...IP_METHOD.steps.map((step, index) => `${index + 1}. ${step}`),
        `依据：${IP_METHOD.sources.join('；')}`,
        memoryBlock(memory),
        `负向排除写入 generate 的 negative_prompt：${negativeLine}`,
        '验收：对成稿再扫，hits 必须为空；通过 directorx_ip_rewrite 记入本项目记忆。',
      ].join('\n')
    : ''
  return {
    dirty,
    hits,
    keep,
    exclude,
    negativeLine,
    method: IP_METHOD,
    knowledge: dirty ? ['213'] : [],
    next,
    agentPrompt,
  }
}

export function askDshRewriteText(text: string, memory: IpMemoryHint[] = []): string {
  const brief = buildIpBrief(text, { memory })
  if (!brief.dirty) return ''
  return [
    '请实施版权安全改写，不要套固定成稿。',
    brief.agentPrompt,
    '先 directorx_ip_scan 取项目记忆，再 directorx_knowledge_read 213，写细后 directorx_ip_rewrite（remember:true）。不要 generate。',
  ].join('\n')
}
