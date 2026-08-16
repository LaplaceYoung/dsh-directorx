import { slugify } from './extract.ts'
import type { ProductionConfirm, ProductionEntities, ProductionKind, ProductionPlan, ShotDraft } from './types.ts'

type Entities = ProductionEntities

function clip(seconds: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, seconds))
}

function splitBudget(total: number, blocks: Array<{ block: string; purpose: string; weight: number }>): ProductionPlan['durationBudget'] {
  const weightSum = blocks.reduce((sum, item) => sum + item.weight, 0)
  return blocks.map(item => ({
    block: item.block,
    purpose: item.purpose,
    seconds: Math.max(1, Math.round(total * (item.weight / weightSum))),
  }))
}

function promoPlan(entities: Entities): ProductionPlan {
  const brand = entities.brand ?? '委托方'
  const product = entities.product ?? brand
  const subject = `${product} 品牌主体`
  const aspect = entities.aspectRatio
  const shots: ShotDraft[] = [
    { id: 'mark', kind: 'image', task: `${product} 标识锁定图`, subject: `${product} wordmark, quiet luxury, no extra ornaments`, lighting: 'soft-window', composition: 'symmetry', aspectRatio: aspect, note: '全片品牌锚' },
    { id: 'hook', kind: 'video', task: '开场承诺', subject: `${subject} at a working surface branded ${brand}`, action: 'holds one beat then looks to camera', shotSize: 'MCU', cameraMove: 'push_in', lighting: 'soft-window', durationSec: 5, aspectRatio: aspect, needsAudio: true, note: '3 秒内给结果' },
    { id: 'mechanic', kind: 'video', task: '产品机制', subject: `${product} interface or process made visible`, action: 'one complete cycle of the product doing its job', shotSize: 'LS', angle: 'birds-eye', cameraMove: 'pan', lighting: 'neon', durationSec: 6, aspectRatio: aspect, needsFirstFrame: true, continuity: 'frame_chain', note: '卖机制不卖按钮' },
    { id: 'identity', kind: 'video', task: '主体一致', subject: `${subject} locked across three matching frames`, action: 'the same face holds while frames change', shotSize: 'MS', cameraMove: 'parallax', lighting: 'rembrandt', durationSec: 6, aspectRatio: aspect, note: '身份锁' },
    { id: 'result', kind: 'video', task: '结果回放', subject: `finished ${product} piece on a studio monitor, ${brand} in frame`, action: 'camera pulls back to the maker watching', shotSize: 'MLS', cameraMove: 'pull_out', lighting: 'golden-hour', durationSec: 7, aspectRatio: aspect, needsAudio: true, note: '结果镜' },
    { id: 'end', kind: 'image', task: '结尾记忆点', subject: `${product} wordmark and one positioning line`, lighting: 'soft-window', composition: 'symmetry', aspectRatio: aspect, note: 'endcard' },
    { id: 'vo', kind: 'audio', task: `旁白 ${entities.targetSeconds}s`, subject: `calm VO naming ${brand} and ${product}`, durationSec: clip(entities.targetSeconds, 15, 120), aspectRatio: aspect, note: '后期混音' },
  ]
  return {
    kind: 'promo',
    title: `${brand} · ${product} 宣传片`,
    workflow: ['析', '研', '问', '案', '位'],
    entities,
    researchQueries: [`${product} 品牌`, '宣传片 结构', '品牌 一致性', '广告 开场'],
    characters: [{ name: subject, description: `${brand} / ${product} 出镜主体，全片同一身份`, slug: slugify(product) }],
    confirms: [
      { id: 'duration', question: '主片时长与画幅？', options: [`${entities.targetSeconds}s / ${aspect}（按请求）`, '30s 预告', `${entities.targetSeconds}s + 另切 9:16`], recommended: 0 },
      { id: 'placeholders', question: '占位先不生成。确认批次？', options: ['确认全部占位，暂不生成', '先试点开场 3 镜', '改主题句后再排队'], recommended: 0 },
    ],
    shots,
    durationBudget: splitBudget(entities.targetSeconds, [
      { block: '开场承诺', purpose: '3 秒给结果', weight: 1 },
      { block: '机制蒙太奇', purpose: '产品如何工作', weight: 3 },
      { block: '结果', purpose: '成片可见', weight: 2 },
      { block: '记忆点', purpose: '名称+一句定位', weight: 1 },
    ]),
  }
}

function literaryPlan(entities: Entities): ProductionPlan {
  const title = entities.sourceTitle ?? '源文本'
  const author = entities.author ?? '原作者'
  const format = entities.format ?? '改编剧'
  const aspect = entities.aspectRatio
  const acts = [
    { block: '序', purpose: '主题句与世界', weight: 2 },
    { block: '建立', purpose: '人物进入处境', weight: 3 },
    { block: '转折', purpose: '不可逆事件', weight: 3 },
    { block: '代价', purpose: '损失坐实', weight: 3 },
    { block: '再入', purpose: '被原秩序拒绝', weight: 2 },
    { block: '收束', purpose: '开放问句', weight: 2 },
  ]
  const budget = splitBudget(entities.targetSeconds, acts)
  const lead = `《${title}》主角`
  const power = `《${title}》对峙方`
  const shots: ShotDraft[] = [
    { id: 'c-lead', kind: 'image', task: `${lead}设定图`, subject: `${lead} from ${author}'s ${title}, period-correct, three-view sheet`, lighting: 'soft-window', composition: 'symmetry', aspectRatio: aspect, note: '外观契约，不抄既有影视造型' },
    { id: 'c-power', kind: 'image', task: `${power}设定图`, subject: `${power} in ${title}, status visible in costume and space`, lighting: 'practical', aspectRatio: aspect, note: '权力一方' },
    { id: 'est', kind: 'image', task: `${title}世界空镜`, subject: `establishing world of ${title}, empty of hero, atmosphere first`, shotSize: 'ELS', lighting: 'low-key', composition: 'negative-space', aspectRatio: aspect, note: '场景板' },
  ]
  budget.forEach((act, index) => {
    const durationSec = clip(Math.round(act.seconds / 30), 5, 8)
    shots.push({
      id: `act-${index + 1}`,
      kind: 'video',
      task: `${act.block}：${act.purpose}`,
      subject: `${lead} in ${title}, act "${act.block}"`,
      action: act.purpose,
      shotSize: index === 0 || index === budget.length - 1 ? 'CU' : 'MS',
      cameraMove: index === 0 ? 'static' : 'push_in',
      lighting: index >= 3 ? 'low-key' : 'rembrandt',
      durationSec,
      aspectRatio: aspect,
      needsAudio: index === 0 || index === budget.length - 1,
      note: `${author}《${title}》${format} · ${act.seconds}s 段落的关键戏剧镜，不覆盖整段时长`,
    })
  })
  return {
    kind: 'literary',
    title: `${author}《${title}》${format}`,
    workflow: ['析', '研', '问', '角色', '大纲', '位'],
    entities,
    researchQueries: [`${author} ${title}`, '小说改编 分镜', '角色一致性', '时长预算'],
    characters: [
      { name: lead, description: `${author}《${title}》叙事主体`, slug: slugify(`${title}-lead`) },
      { name: power, description: `${title} 中的秩序/权力一方`, slug: slugify(`${title}-power`) },
    ],
    confirms: [
      { id: 'adaptation', question: '改编幅度？骨架未确认不得扩写。', options: ['抽核：保留主题对照（推荐）', '近原：按原作顺序', '重写：现代平行'], recommended: 0 },
      { id: 'duration', question: `${entities.targetSeconds}s 如何落地？`, options: [`按 ${budget.length} 段切块（推荐）`, '先做 8 分钟试点', '拆成多集'], recommended: 0 },
      { id: 'placeholders', question: '角色锚 + 各段关键镜全部占位，不直接生成。', options: ['确认全部占位', '先出主角设定图试点', '先只排开场'], recommended: 0 },
    ],
    shots,
    durationBudget: budget,
  }
}

function remakePlan(entities: Entities): ProductionPlan {
  const source = entities.sourceClip ?? '源宣传片'
  const subject = entities.replaceSubject ?? '替换主体'
  const aspect = entities.aspectRatio
  const beats = ['钩子', '能力一', '能力二', '能力三', '能力四', '承诺']
  const shots: ShotDraft[] = [
    { id: 'sheet', kind: 'image', task: `${subject} 替换用定妆`, subject: `${subject}, same eyeline as the source hero close-up, no source trademarks`, lighting: 'rembrandt', composition: 'rule-of-thirds', aspectRatio: aspect, note: `替换锚；源片：${source}` },
  ]
  beats.forEach((beat, index) => {
    shots.push({
      id: `k${index + 1}`,
      kind: 'video',
      task: `复刻镜 ${index + 1}：${beat}`,
      subject: `${subject} occupying the source frame for "${beat}" from ${source}`,
      action: 'same camera move and cut point as the source beat, different identity',
      shotSize: index === 0 ? 'CU' : 'MCU',
      cameraMove: index === 1 ? 'push_in' : 'static',
      lighting: index === 0 ? 'low-key' : 'rembrandt',
      durationSec: index === 0 ? 4 : 6,
      aspectRatio: aspect,
      needsAudio: index === 0 || beat === '承诺',
      needsFirstFrame: index === 1,
      continuity: index === 1 ? 'frame_chain' : undefined,
      note: `锁源片景别/运镜/剪点，只换主体。禁止再现 ${source} 商标。`,
    })
  })
  shots.push({
    id: 'end',
    kind: 'image',
    task: `${subject} endcard`,
    subject: `${subject} wordmark, no marks from ${source}`,
    lighting: 'soft-window',
    composition: 'symmetry',
    aspectRatio: aspect,
    note: '商标隔离',
  })
  return {
    kind: 'remake',
    title: `${source} → ${subject} 复刻`,
    workflow: ['析', '研', '拉片', '问', '位'],
    entities,
    researchQueries: [`${source} 镜头`, '拉片 镜头语言', '主体替换 一致性', '产品宣传 复刻'],
    characters: [{ name: subject, description: `替换 ${source} 出镜主体，同机位同光线`, slug: slugify(subject) }],
    confirms: [
      { id: 'source', question: '源片按哪条时间轴拉？', options: ['按常见发布剪辑骨架（无源文件时）', '我稍后上传源片再对帧', '只拉片、暂不复刻'], recommended: 0 },
      { id: 'swap', question: '主体替换范围？', options: [`人 + 产品界面都换成 ${subject}（推荐）`, '只换人', '只换 endcard'], recommended: 0 },
      { id: 'placeholders', question: '按拉片表 1:1 占位，不直接生成。', options: ['确认 1:1 占位批次', '先做对照表', '先试点第 1 镜'], recommended: 0 },
    ],
    shots,
    durationBudget: splitBudget(entities.targetSeconds, [
      { block: '钩子', purpose: '源片开场剪点', weight: 1 },
      { block: '能力蒙太奇', purpose: '对位替换', weight: 4 },
      { block: '承诺', purpose: '一句定位', weight: 2 },
      { block: 'endcard', purpose: '新主体记忆点', weight: 1 },
    ]),
  }
}

function narrativePlan(entities: Entities): ProductionPlan {
  const topic = entities.product ?? entities.sourceTitle ?? '本片'
  const aspect = entities.aspectRatio
  const shots: ShotDraft[] = [1, 2, 3, 4, 5].map((index) => ({
    id: `s${index}`,
    kind: 'video' as const,
    task: `${topic} 镜 ${index}`,
    subject: topic,
    action: 'one clear observable action with a start and end state',
    shotSize: index === 1 ? 'LS' : index === 5 ? 'CU' : 'MS',
    cameraMove: index === 1 ? 'static' : 'push_in',
    lighting: 'soft-window',
    durationSec: 6,
    aspectRatio: aspect,
    note: '通用叙事单元，确认后再生成',
  }))
  return {
    kind: 'narrative',
    title: topic,
    workflow: ['析', '研', '问', '案', '位'],
    entities,
    researchQueries: ['分镜 连续性', '叙事 节奏'],
    characters: [],
    confirms: [
      { id: 'placeholders', question: '先占位还是先改分镜？', options: ['确认占位，暂不生成', '先改分镜'], recommended: 0 },
    ],
    shots,
    durationBudget: splitBudget(entities.targetSeconds, [
      { block: '建立', purpose: '空间', weight: 1 },
      { block: '发展', purpose: '动作', weight: 2 },
      { block: '收束', purpose: '反应', weight: 1 },
    ]),
  }
}

export function deriveProductionPlan(kind: ProductionKind, entities: ProductionEntities): ProductionPlan {
  if (kind === 'promo') return promoPlan(entities)
  if (kind === 'literary') return literaryPlan(entities)
  if (kind === 'remake') return remakePlan(entities)
  return narrativePlan(entities)
}

export function kindConfirms(plan: ProductionPlan): ProductionConfirm[] {
  return plan.confirms
}
