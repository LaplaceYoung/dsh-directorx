export type ShotVocabKind = 'recipe' | 'technique'

export interface ShotVocabCard {
  id: string
  kind: ShotVocabKind
  category: string
  title: string
  intent: string
  when: string
  never: string
  phrases: string[]
  knowledge: string[]
}

/** Compact vocabulary: how to cut a beat vs when not to use a means. Not a card dump. */
export const SHOT_VOCAB: ShotVocabCard[] = [
  {
    id: 'dialogue-reverse',
    kind: 'recipe',
    category: '对话',
    title: '正反打',
    intent: '两人说话时，轴线一侧来回切，反应和台词对上。',
    when: '对峙、谈判、告白，需要看见听的人。',
    never: '三人以上同框还没拆解、或轴线还没立住时不要开切。',
    phrases: ['over the shoulder', 'eyeline match'],
    knowledge: ['109', '124'],
  },
  {
    id: 'emotion-hold',
    kind: 'recipe',
    category: '情绪',
    title: '情绪停住',
    intent: '把反应留足，让脸自己说完。',
    when: '转折句之后、秘密揭开、决定落下。',
    never: '信息还没交代清楚就特写，观众不知道在心疼谁。',
    phrases: ['held close-up', 'micro expression'],
    knowledge: ['107', '127'],
  },
  {
    id: 'reveal-pan',
    kind: 'recipe',
    category: '揭示',
    title: '遮挡后揭示',
    intent: '先挡后让，镜头自己揭开下一层信息。',
    when: '进新空间、发现物件、人物从遮挡后出现。',
    never: '已经一览无余的空间再摇一遍，是空运镜。',
    phrases: ['camera reveals', 'foreground occlusion'],
    knowledge: ['109', '116'],
  },
  {
    id: 'entrance-trio',
    kind: 'recipe',
    category: '进场',
    title: '进场三件套',
    intent: '远景立空间 → 中景走路 → 近景落点。',
    when: '第一次进场、换场景、把人从环境里领到戏里。',
    never: '已经在场的人不要假装进门。',
    phrases: ['establishing wide', 'character enter'],
    knowledge: ['109', '107'],
  },
  {
    id: 'reaction-insert',
    kind: 'recipe',
    category: '反应',
    title: '反应插入',
    intent: '动作或台词之后立刻切听者/目击者。',
    when: '需要看见冲击，而不是再说一句解释。',
    never: '说话人还没把信息送完就切反应。',
    phrases: ['reaction close-up'],
    knowledge: ['127', '102'],
  },
  {
    id: 'product-hero',
    kind: 'recipe',
    category: '产品',
    title: '产品主视觉',
    intent: '产品是主体，光比和轮廓先锁，人是陪体。',
    when: '广告、开箱、静物质感。',
    never: '把商标或受保护外观当身份写进提示词。',
    phrases: ['hero product', 'controlled highlight'],
    knowledge: ['125', '213'],
  },
  {
    id: 'talk-to-camera',
    kind: 'recipe',
    category: '口播',
    title: '对镜头说',
    intent: '视线锁镜头，机位稳，口型区干净。',
    when: '讲解、评测、教程。',
    never: '叙事短剧里突然破第四面墙却没有动机。',
    phrases: ['direct address', 'stable eyeline'],
    knowledge: ['104', '115'],
  },
  {
    id: 'static',
    kind: 'technique',
    category: '运镜',
    title: '固定',
    intent: '机位不动，让表演和剪辑承担节奏。',
    when: '观察、对峙、需要稳定尾帧接下镜。',
    never: '用固定去藏调度失败；也别在该跟的动作上钉死。',
    phrases: ['locked off', 'static camera'],
    knowledge: ['109'],
  },
  {
    id: 'push-in',
    kind: 'technique',
    category: '运镜',
    title: '推近',
    intent: '空间收缩，注意力压到脸上或物件上。',
    when: '决定、威胁、看清一个细节。',
    never: '每句台词都推一次，权重就被稀释。',
    phrases: ['slow push in'],
    knowledge: ['124'],
  },
  {
    id: 'handheld',
    kind: 'technique',
    category: '运镜',
    title: '手持',
    intent: '呼吸感、不安、在场。',
    when: '追逐、纪录片感、情绪失控。',
    never: '产品质感、设定图、需要稳定尾帧的衔接镜。',
    phrases: ['handheld shake'],
    knowledge: ['109'],
  },
  {
    id: 'low-angle',
    kind: 'technique',
    category: '机位',
    title: '仰拍',
    intent: '权力上移，主体压向观众。',
    when: '压迫、崇拜、建筑体量。',
    never: '已经在求同情的角色再仰拍，立场会反。',
    phrases: ['low angle'],
    knowledge: ['109'],
  },
  {
    id: 'shallow-dof',
    kind: 'technique',
    category: '焦段与景深',
    title: '浅景深',
    intent: '背景退成气氛，主体轮廓清楚。',
    when: '肖像、产品、从杂乱里单点取出。',
    never: '还要交代空间关系的建立镜头。',
    phrases: ['shallow depth of field'],
    knowledge: ['00', '125'],
  },
]

export function listShotVocab(filter?: { kind?: ShotVocabKind; query?: string }): ShotVocabCard[] {
  const query = filter?.query?.trim().toLowerCase() ?? ''
  return SHOT_VOCAB.filter(card => {
    if (filter?.kind !== undefined && card.kind !== filter.kind) return false
    if (query === '') return true
    const hay = `${card.id} ${card.title} ${card.category} ${card.intent} ${card.when} ${card.never}`.toLowerCase()
    return hay.includes(query) || card.phrases.some(item => item.includes(query))
  })
}

export function showShotVocab(id: string): ShotVocabCard | undefined {
  const wanted = id.trim().toLowerCase()
  return SHOT_VOCAB.find(card => card.id === wanted || card.title === id.trim())
}

export function checkShotVocab(input: {
  prompt: string
  recipe?: string
}): {
  ok: boolean
  skipped: boolean
  recipe?: ShotVocabCard
  missing: string[]
  hits: string[]
  neverWarning?: string
} {
  const prompt = input.prompt.trim()
  if (prompt === '') return { ok: false, skipped: false, missing: ['empty prompt'], hits: [] }
  const cjk = (prompt.match(/[\u4e00-\u9fff]/g) ?? []).length
  const latin = (prompt.match(/[a-z]/gi) ?? []).length
  if (cjk > latin * 2 && latin < 8) {
    return { ok: true, skipped: true, missing: [], hits: [], neverWarning: '中文稿跳过英文必备短语，改写生成稿后再 check' }
  }
  const recipe = input.recipe !== undefined ? showShotVocab(input.recipe) : undefined
  const cards = recipe !== undefined ? [recipe] : SHOT_VOCAB.filter(item => item.kind === 'recipe')
  const hay = prompt.toLowerCase()
  if (recipe !== undefined) {
    const missing = recipe.phrases.filter(item => !hay.includes(item.toLowerCase()))
    const hits = recipe.phrases.filter(item => hay.includes(item.toLowerCase()))
    return {
      ok: missing.length === 0,
      skipped: false,
      recipe,
      missing,
      hits,
      ...(recipe.never !== '' ? { neverWarning: recipe.never } : {}),
    }
  }
  const hits = cards.flatMap(card => card.phrases.filter(item => hay.includes(item.toLowerCase())))
  return { ok: true, skipped: false, missing: [], hits: [...new Set(hits)] }
}
