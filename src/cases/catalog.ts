import type { ProductionCaseDefinition, ProductionCaseId } from './types.ts'

const MOSSLAND: ProductionCaseDefinition = {
  id: 'mossland-promo',
  title: '上海模思 Mossland 品牌宣传片',
  request: '为上海模思的mossland制作宣传片',
  keywords: ['模思', 'mossland', 'moss land', '宣传片', '上海模思'],
  workflow: ['析', '研', '问', '案', '位'],
  researchQueries: ['宣传片 结构', '品牌 一致性', '广告 开场', '企业宣传 节奏'],
  researchPack: [
    {
      query: '上海模思 / Mossland 产品定位',
      source: 'bundled:mossland-positioning',
      finding: '上海模思做 AI 影视制作系统 Mossland / DirectorX：占位先行、镜头连续性、人确认后再花钱生成。宣传片应卖「导演工作台」而不是「又一个文生视频按钮」。',
    },
    {
      query: '企业宣传片开场三秒承诺',
      source: 'corpus:promo-structure',
      finding: '60–90s 品牌片：0–3s 给结果承诺，中段能力蒙太奇，结尾记忆点+产品名。品牌色与 wordmark 每镜复现。',
    },
    {
      query: 'B 站 / 官网横屏规格',
      source: 'corpus:platform-specs',
      finding: '官网/B 站主片 16:9、1080p、约 75s；可另切 9:16 预告。音画同出优先选带原生音频的视频模型。',
    },
  ],
  characters: [
    { name: 'Moss智能', description: '短发东亚女性制作人，深青外套，冷静，手边是无限画布与时间线', slug: 'moss-intelligence' },
  ],
  confirms: [
    {
      id: 'duration',
      question: '主片时长与画幅？',
      options: ['75s / 16:9 官网主片（推荐）', '30s / 16:9 预告', '75s + 另切 9:16'],
      recommended: 0,
    },
    {
      id: 'placeholders',
      question: '以下占位规格都先不生成。确认后我只保留队列，由你在面板执行。',
      options: ['确认全部占位，暂不生成', '先只执行片头 3 镜试点', '改主题句后再排队'],
      recommended: 0,
    },
  ],
  durationBudget: [
    { block: '开场承诺', seconds: 8, purpose: '3 秒内给出「会拍会剪会管成本」' },
    { block: '工作台蒙太奇', seconds: 28, purpose: '画布 / 分镜 / 占位确认 / 成片' },
    { block: '客户结果', seconds: 22, purpose: '成片前后对比与制作人反应' },
    { block: '记忆点', seconds: 17, purpose: 'wordmark + 一句定位' },
  ],
  shots: [
    { id: 'logo', kind: 'image', task: 'Mossland wordmark 锁定图', subject: 'Mossland wordmark on deep teal void, no extra ornaments', shotSize: 'CU', lighting: 'soft-window', mood: 'precise, quiet luxury', composition: 'symmetry', aspectRatio: '16:9', note: '全片品牌锚点，后续镜 reference' },
    { id: 's01', kind: 'video', task: '开场：制作人看向镜头', subject: 'Moss智能 at a dark director desk, Mossland canvas glow on her face', action: 'holds one beat then glances at camera, lips almost form a line', shotSize: 'MCU', cameraMove: 'push_in', lighting: 'soft-window', mood: 'confident, nocturnal studio', composition: 'rule-of-thirds', durationSec: 5, aspectRatio: '16:9', needsAudio: true, note: '开场承诺镜' },
    { id: 's02', kind: 'video', task: '无限画布俯拍', subject: 'infinite storyboard canvas of Mossland, nodes lighting up in shot order', action: 'nodes connect left to right as a cursor claims a generate intent', shotSize: 'LS', angle: 'birds-eye', cameraMove: 'pan', lighting: 'neon', mood: 'systems, not magic', composition: 'depth-layers', durationSec: 6, aspectRatio: '16:9', needsFirstFrame: true, continuity: 'frame_chain from logo', note: '产品机制可视化' },
    { id: 's03', kind: 'video', task: '占位队列特写', subject: 'generation queue cards with full prompts and model names, none running', action: 'a confirm chip lights from pending to approved, no render starts', shotSize: 'ECU', cameraMove: 'static', lighting: 'practical', mood: 'cost discipline', composition: 'frame-in-frame', durationSec: 5, aspectRatio: '16:9', note: '占位先行卖点' },
    { id: 's04', kind: 'video', task: '分镜与角色锚', subject: 'character sheet of Moss智能 pinned beside three matching shot stills', action: 'the same face locks across three frames as the sheet stays pinned', shotSize: 'MS', cameraMove: 'parallax', lighting: 'rembrandt', mood: 'continuity craft', composition: 'depth-layers', durationSec: 6, aspectRatio: '16:9', note: '主体一致性' },
    { id: 's05', kind: 'video', task: '时间线精剪', subject: 'timeline of a promo cut, waveforms ducking under a VO', action: 'playhead jumps on beat, a hard cut lands on a clap', shotSize: 'MCU', cameraMove: 'static', lighting: 'low-key', mood: 'editorial precision', durationSec: 5, aspectRatio: '16:9', needsAudio: true, note: '会剪' },
    { id: 's06', kind: 'video', task: '成片回放', subject: 'the finished Mossland promo playing on a large studio monitor', action: 'camera slowly pulls back to reveal Moss智能 watching without smiling', shotSize: 'MLS', cameraMove: 'pull_out', lighting: 'golden-hour', mood: 'earned result', composition: 'negative-space', durationSec: 7, aspectRatio: '16:9', needsAudio: true, note: '结果镜' },
    { id: 'end', kind: 'image', task: '结尾记忆点', subject: 'Mossland wordmark and the line 先占位，确认后再生成, deep teal', shotSize: 'MS', lighting: 'soft-window', composition: 'symmetry', aspectRatio: '16:9', note: 'endcard' },
    { id: 'vo', kind: 'audio', task: '中文旁白 75s', subject: 'calm female VO, Shanghai standard Mandarin, no smile in the voice', action: 'reads: 模思做的不是又一个生成按钮。是导演工作台。', durationSec: 75, aspectRatio: '16:9', note: '后期混音，不进画面模型' },
  ],
}

const ZHUFU: ProductionCaseDefinition = {
  id: 'luxun-zhufu',
  title: '鲁迅《祝福》半小时 AI 电视剧',
  request: '改编鲁迅的小说祝福为半小时ai电视剧',
  keywords: ['祝福', '鲁迅', '祥林嫂', '鲁镇', '电视剧', '改编'],
  workflow: ['析', '研', '问', '角色', '大纲', '位'],
  researchQueries: ['小说改编 分镜', '角色一致性', '年代剧 光影', '短剧 时长预算'],
  researchPack: [
    {
      query: '鲁迅《祝福》（《彷徨》，1924）情节核',
      source: 'bundled:luxun-zhufu-1924',
      finding: '鲁镇祝福夜，叙事者遇见沦为乞丐的祥林嫂；倒叙她丧夫、到鲁四老爷家帮工、被卖改嫁、再丧夫失子、被厌弃、问魂灵有无、死在祝福夜里。主题是礼教吃人，不是苦情猎奇。',
    },
    {
      query: '半小时单集时长预算',
      source: 'corpus:duration-budget',
      finding: '1800s 必须先切块：序 180 / 初到 360 / 改嫁 360 / 丧子 360 / 再回 300 / 问魂与死 240。单镜 5–8s，生成单元只覆盖关键戏剧拍点，中间用旁白与空镜补时长。',
    },
    {
      query: '民国江南视觉与版权',
      source: 'bundled:period-jiangnan',
      finding: '鲁镇雪、乌篷、鲁四书房朱灯、土地庙残烛。不出现鲁迅肖像，不抄既有影视剧造型。祥林嫂三阶段外貌必须注册为角色锚。',
    },
  ],
  characters: [
    { name: '祥林嫂·少', description: '二十余岁江南农妇，青布棉袄，额黄，目光尚有 vivacity', slug: 'xianglin-young' },
    { name: '祥林嫂·暮', description: '额角伤疤，白发，眼眶深陷，青布裙补丁，手里空碗', slug: 'xianglin-late' },
    { name: '鲁四老爷', description: '五十许乡绅，铜盆帽，长袍马褂，书房里理学书卷', slug: 'lu-si' },
  ],
  confirms: [
    {
      id: 'adaptation',
      question: '改编幅度？骨架拍板未确认不得写分集。',
      options: ['抽核：保留问魂灵与祝福夜对照（推荐）', '近原：几乎按小说顺序', '重写：现代平行故事'],
      recommended: 0,
    },
    {
      id: 'duration',
      question: '30 分钟如何落地？',
      options: ['单集 1800s，六段结构（推荐）', '两集各 15 分钟', '先做 8 分钟试点集'],
      recommended: 0,
    },
    {
      id: 'placeholders',
      question: '角色锚 + 关键戏剧镜全部占位，不直接生成。确认批次？',
      options: ['确认全部占位', '先出三张祥林嫂设定图试点', '先只排序章三镜'],
      recommended: 0,
    },
  ],
  durationBudget: [
    { block: '序·祝福夜相遇', seconds: 180, purpose: '叙事者遇见暮年祥林嫂' },
    { block: '初到鲁镇', seconds: 360, purpose: '帮工、忌讳、短暂安定' },
    { block: '被卖改嫁', seconds: 360, purpose: '卫老婆子与抢亲' },
    { block: '丧夫失子', seconds: 360, purpose: '贺老六与阿毛' },
    { block: '再回鲁镇', seconds: 300, purpose: '不洁、被厌弃' },
    { block: '问魂与死', seconds: 240, purpose: '灵魂有无 + 祝福夜里的死' },
  ],
  shots: [
    { id: 'c-young', kind: 'image', task: '祥林嫂少时三视图', subject: '祥林嫂·少, three-view character sheet, Jiangnan winter, Qing-blue padded jacket', lighting: 'soft-window', composition: 'symmetry', aspectRatio: '16:9', note: '外观契约锁定' },
    { id: 'c-late', kind: 'image', task: '祥林嫂暮年三视图', subject: '祥林嫂·暮, three-view, scar on forehead, empty bowl, snow in hair', lighting: 'low-key', composition: 'symmetry', aspectRatio: '16:9', note: '结局形象锚' },
    { id: 'c-lusi', kind: 'image', task: '鲁四老爷设定', subject: '鲁四老爷 at a study desk, Confucian volumes, oil lamp', lighting: 'practical', aspectRatio: '16:9', note: '权力一方' },
    { id: 'est-luzhen', kind: 'image', task: '鲁镇雪夜空镜', subject: 'Republican Jiangnan town in snow, paper offerings, no crowds yet', shotSize: 'ELS', lighting: 'low-key', mood: 'ritual cold', composition: 'negative-space', aspectRatio: '16:9', note: '场景板' },
    { id: 'a1s1', kind: 'video', task: '序：雪夜相遇', subject: '祥林嫂·暮 in falling snow, empty bowl, looking past camera', action: 'asks in a cracked voice whether a soul remains after death, then falls silent', shotSize: 'CU', cameraMove: 'static', lighting: 'low-key', mood: 'unanswered dread', composition: 'negative-space', durationSec: 8, aspectRatio: '16:9', needsAudio: true, note: '主题句先行' },
    { id: 'a1s2', kind: 'video', task: '序：鲁镇祝福', subject: '鲁镇 night, red paper gods, firecrackers off-screen, prosperous doorways', action: 'a door slams; the beggar woman is excluded from the threshold', shotSize: 'LS', cameraMove: 'pan', lighting: 'practical', mood: 'festival vs exile', durationSec: 6, aspectRatio: '16:9', needsAudio: true, note: '对照' },
    { id: 'a2s1', kind: 'video', task: '初到：鲁四书房', subject: '祥林嫂·少 serving tea to 鲁四老爷 in a study', action: 'places the cup, withdraws two steps, eyes down', shotSize: 'MS', angle: 'OTS', cameraMove: 'static', lighting: 'rembrandt', durationSec: 6, aspectRatio: '16:9', note: '等级' },
    { id: 'a2s2', kind: 'video', task: '初到：祭器', subject: '祥林嫂·少 wiping ancestral vessels, red candles', action: 'hands pause over a wine cup as a warning is spoken off-screen', shotSize: 'CU', cameraMove: 'push_in', lighting: 'practical', mood: 'taboo', durationSec: 5, aspectRatio: '16:9', note: '不洁母题铺垫' },
    { id: 'a3s1', kind: 'video', task: '改嫁：河埠抢亲', subject: 'boat on a winter canal, men seizing 祥林嫂·少', action: 'she bites the gunwale, forehead splits, blood on snow', shotSize: 'MLS', cameraMove: 'handheld', lighting: 'high-key', mood: 'violence without spectacle', durationSec: 7, aspectRatio: '16:9', needsAudio: true, note: '额伤来源' },
    { id: 'a4s1', kind: 'video', task: '丧子：山坳', subject: 'empty mountain path, small shoe in frost', action: '祥林嫂·少 drops to her knees, hands search the frost, find nothing', shotSize: 'LS', cameraMove: 'static', lighting: 'golden-hour', mood: 'loss without score swell', composition: 'negative-space', durationSec: 8, aspectRatio: '16:9', note: '阿毛，不直拍狼' },
    { id: 'a5s1', kind: 'video', task: '再回：门槛', subject: '鲁四 household threshold at New Year, 祥林嫂·暮 barred from the offering', action: 'she reaches the door, a hand inside shuts it', shotSize: 'MS', angle: 'low', cameraMove: 'static', lighting: 'practical', mood: 'ritual exclusion', durationSec: 6, aspectRatio: '16:9', note: '不洁坐实' },
    { id: 'a6s1', kind: 'video', task: '问魂灵', subject: '祥林嫂·暮 facing the narrator, snow, no music', action: 'asks whether hell exists, waits too long for an answer', shotSize: 'CU', cameraMove: 'static', lighting: 'low-key', composition: 'rule-of-thirds', durationSec: 8, aspectRatio: '16:9', needsAudio: true, note: '全片中心问句' },
    { id: 'a6s2', kind: 'video', task: '死在祝福里', subject: 'empty snow street at dawn, one bowl on its side, firecrackers far away', action: 'camera holds, then tilts up to red papers still intact', shotSize: 'ELS', cameraMove: 'tilt', lighting: 'golden-hour', mood: 'indifferent ritual', composition: 'negative-space', durationSec: 7, aspectRatio: '16:9', needsAudio: true, note: '开放结尾' },
  ],
}

const KIMI: ProductionCaseDefinition = {
  id: 'kimi-k3-remake',
  title: 'Kimi K3 宣传片拉片并复刻为 Moss 智能',
  request: '拉片分析kimi-k3的宣传片并且把宣传的主体替换为moss智能进行复刻宣传片',
  keywords: ['kimi', 'k3', '拉片', '复刻', 'moss智能', 'moss 智能'],
  workflow: ['析', '研', '拉片', '问', '位'],
  researchQueries: ['拉片 镜头语言', '产品宣传 复刻', '主体替换 一致性', '广告 蒙太奇'],
  researchPack: [
    {
      query: 'Kimi / 月之暗面产品片语法',
      source: 'bundled:kimi-promo-grammar',
      finding: 'Kimi 系发布片常见骨架：黑底单人、UI 流光、能力蒙太奇（读/写/算/看）、一句产品承诺、wordmark 收束。人物常是单一面孔对镜头，产品是「会思考的助手」而非剪辑台。',
    },
    {
      query: '拉片要记下什么',
      source: 'corpus:shot-breakdown',
      finding: '每镜记：时长、景别、运镜、光、剪点动机、字幕/VO、主体。复刻时锁时长与剪点，只替换主体身份与产品语义。',
    },
    {
      query: '主体替换纪律',
      source: 'bundled:subject-swap',
      finding: 'Moss智能替换 Kimi 面孔：同一景别/运镜/剪点，改的是职业（制作人 vs 聊天助手）与界面（画布队列 vs 对话气泡）。禁止抄 Kimi 商标与专有 UI。',
    },
  ],
  characters: [
    { name: 'Moss智能', description: '与片中原主角同机位同光线的短发制作人，青外套，替代助手形象', slug: 'moss-intelligence' },
  ],
  confirms: [
    {
      id: 'source',
      question: '源片按哪条时间轴拉？',
      options: ['约 45s 发布剪辑（推荐）', '90s 加长版', '我稍后上传源片再对帧'],
      recommended: 0,
    },
    {
      id: 'swap',
      question: '主体替换范围？',
      options: ['人 + 产品界面都换成 Moss智能 / Mossland（推荐）', '只换人，界面留抽象光', '只换 endcard'],
      recommended: 0,
    },
    {
      id: 'placeholders',
      question: '按拉片表 1:1 占位复刻，不直接生成。',
      options: ['确认 1:1 占位批次', '先做原片对照表，暂不排队', '先试点第 1 镜'],
      recommended: 0,
    },
  ],
  durationBudget: [
    { block: '源片钩子', seconds: 4, purpose: '黑场出脸' },
    { block: '能力蒙太奇', seconds: 24, purpose: '四段能力，各约 6s' },
    { block: '产品承诺', seconds: 8, purpose: '一句定位' },
    { block: 'endcard', seconds: 5, purpose: 'Moss智能 / Mossland' },
  ],
  shots: [
    { id: 'sheet', kind: 'image', task: 'Moss智能替换用定妆', subject: 'Moss智能, same eyeline as a typical Kimi hero close-up, teal coat, no logo', lighting: 'rembrandt', composition: 'rule-of-thirds', aspectRatio: '16:9', note: '替换锚' },
    { id: 'k1', kind: 'video', task: '复刻镜 1：黑场出脸', subject: 'Moss智能 emerging from black, single practical rim', action: 'eyes find camera on the same beat the source face appears', shotSize: 'CU', cameraMove: 'static', lighting: 'low-key', durationSec: 4, aspectRatio: '16:9', needsAudio: true, note: '源：0:00–0:04 钩子；剪点=眨眼' },
    { id: 'k2', kind: 'video', task: '复刻镜 2：读', subject: 'Moss智能 reading a stacked storyboard, light traveling across nodes', action: 'one node highlights as she tracks it with her eyes', shotSize: 'MCU', cameraMove: 'push_in', lighting: 'neon', durationSec: 6, aspectRatio: '16:9', needsFirstFrame: true, continuity: 'frame_chain', note: '源能力段「读」→ 读画布' },
    { id: 'k3', kind: 'video', task: '复刻镜 3：写', subject: 'prompt text assembling into a shot card on the Mossland queue', action: 'characters land, a model name kling-3.0 appears as recommendation only', shotSize: 'ECU', cameraMove: 'static', lighting: 'practical', durationSec: 6, aspectRatio: '16:9', note: '源「写」→ 写提示词' },
    { id: 'k4', kind: 'video', task: '复刻镜 4：算', subject: 'duration budget bars totaling 45 seconds across four blocks', action: 'bars fill without overshoot, one bar turns confirm-amber', shotSize: 'MS', cameraMove: 'static', lighting: 'soft-window', durationSec: 6, aspectRatio: '16:9', note: '源「算」→ 时长预算' },
    { id: 'k5', kind: 'video', task: '复刻镜 5：看', subject: 'split screen: source-like hero still vs Moss智能 still, identical framing', action: 'the right frame (Moss) holds, the left frame dissolves to black', shotSize: 'MS', cameraMove: 'static', lighting: 'rembrandt', composition: 'symmetry', durationSec: 6, aspectRatio: '16:9', note: '源「看」→ 拉片对照' },
    { id: 'k6', kind: 'video', task: '复刻镜 6：承诺', subject: 'Moss智能, MCU, no smile', action: 'says the line 先占位，确认后再生成, then holds', shotSize: 'MCU', cameraMove: 'static', lighting: 'rembrandt', durationSec: 8, aspectRatio: '16:9', needsAudio: true, note: '源承诺句替换' },
    { id: 'k7', kind: 'image', task: '复刻 endcard', subject: 'Moss智能 wordmark, Mossland, no Kimi marks', lighting: 'soft-window', composition: 'symmetry', aspectRatio: '16:9', note: '商标隔离' },
  ],
}

export const PRODUCTION_CASES: Record<ProductionCaseId, ProductionCaseDefinition> = {
  'mossland-promo': MOSSLAND,
  'luxun-zhufu': ZHUFU,
  'kimi-k3-remake': KIMI,
}

export const PRODUCTION_CASE_IDS = Object.keys(PRODUCTION_CASES) as ProductionCaseId[]

export function matchProductionCase(request: string): ProductionCaseId | null {
  const text = request.trim().toLowerCase()
  if (text === '') return null
  let best: { id: ProductionCaseId; hits: number } | null = null
  for (const definition of Object.values(PRODUCTION_CASES)) {
    const hits = definition.keywords.filter(keyword => text.includes(keyword.toLowerCase())).length
    if (hits === 0) continue
    if (best === null || hits > best.hits) best = { id: definition.id, hits }
  }
  return best?.id ?? null
}
