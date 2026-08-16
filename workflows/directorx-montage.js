// DirectorX 混剪/卡点视频流水线 —— workflow 工具脚本模板（dsh-directorx 插件内置）
//
// 用法：workflow 工具，meta 照抄注释，args 传：
//   { brief: string, music: string(可选 BGM 路径), clips?: string[], dryRun?: boolean }
// dryRun=true 时只产出分镜与节拍方案、不执行生成/剪辑（零成本验证编排）。
//
// meta = {
//   name: 'directorx-montage',
//   description: '卡点混剪流水线：素材盘点 → 节拍检测 → 卡点裁剪 → 拼接 → 混音成片',
//   phases: [
//     { title: '素材与节拍方案' },
//     { title: '卡点剪辑' },
//     { title: '混音成片' },
//   ],
// }

const brief = typeof args.brief === 'string' && args.brief !== '' ? args.brief : '一条 30 秒的产品混剪'
const clips = Array.isArray(args.clips) ? args.clips : []
const music = typeof args.music === 'string' ? args.music : undefined
const dryRun = args.dryRun === true

const PLAN_SCHEMA = {
  type: 'object',
  properties: {
    beats: { type: 'array', items: { type: 'object', properties: { t: { type: 'number' }, strength: { type: 'number' } }, additionalProperties: true } },
    cutPlan: { type: 'array', items: { type: 'string' } },
    clips: { type: 'array', items: { type: 'string' } },
  },
  required: ['cutPlan', 'clips'],
  additionalProperties: false,
}

phase('素材与节拍方案')
const plan = await agent(
  [
    '你是混剪导演。',
    `简报：${brief}；候选素材（本地路径，为空则从画布取）：${JSON.stringify(clips)}。`,
    '要求：',
    '- 先加载 directorx-production-lead 分诊；用 directorx_canvas_get 盘点画布上的 video/image 节点作为素材候选；',
    '- 若提供了 music（BGM 路径）：用 directorx_audio_beat 检测节拍（count 按成片时长估算），把节拍时间列进 cutPlan；',
    '- 无 BGM 时按镜头节奏设计 cutPlan（每个切点说明秒数与动机）；',
    '- 输出 beats（原始节拍）、cutPlan（逐条：素材/裁剪区间/为什么卡这个点）、clips（最终选定素材路径清单）。',
  ].join('\n'),
  { label: '混剪导演', phase: '素材与节拍方案', schema: PLAN_SCHEMA },
)

if (dryRun) {
  return { brief, dryRun: true, plan }
}

phase('卡点剪辑')
const CUT_SCHEMA = {
  type: 'object',
  properties: {
    segments: { type: 'array', items: { type: 'string' } },
    errors: { type: 'array', items: { type: 'string' } },
  },
  required: ['segments'],
  additionalProperties: false,
}
const cuts = await agent(
  [
    '你是剪辑执行员。按 cutPlan 把素材剪成卡点片段：',
    JSON.stringify(plan),
    '操作：对每个 cutPlan 条目用 directorx_video_process（start/end 裁剪、scale=16:9、fps=25）产出片段文件；',
    'segments 按成片顺序记录片段路径（原样引用）；单个失败记录到 errors 并跳过。',
  ].join('\n'),
  { label: '卡点剪辑', phase: '卡点剪辑', schema: CUT_SCHEMA },
)

phase('混音成片')
const FINAL_SCHEMA = {
  type: 'object',
  properties: {
    finalPath: { type: 'string' },
    steps: { type: 'array', items: { type: 'string' } },
  },
  required: ['steps'],
  additionalProperties: false,
}
const assembly = await agent(
  [
    '你是成片组装师。把卡点片段拼成最终成片：',
    JSON.stringify({ plan, cuts, music }),
    '操作：',
    '1. directorx_video_concat 把 segments 按顺序拼接（transition=cut 或 fade，按 cutPlan 的节奏）；',
    '2. 若 music 存在：directorx_audio_mix 把 BGM 混入（duckUnder 指向人声轨，无旁白则不 duck）；',
    '3. 需要字幕时 directorx_transcribe_audio（format=srt）生成侧车，再 directorx_video_subtitle（soft）混入字幕轨；',
    '4. 画布：directorx_canvas_add 建「成片」video 节点写入 finalPath（或 update 现有成片节点）；',
    '5. steps 逐条记录工具与产物路径（原样引用）。',
  ].join('\n'),
  { label: '混音成片', phase: '混音成片', schema: FINAL_SCHEMA },
)

return { brief, plan, cuts, assembly }
