// DirectorX 口播/讲解短视频流水线 —— workflow 工具脚本模板（dsh-directorx 插件内置）
//
// 用法（同 directorx-pipeline）：workflow 工具，meta 照抄注释，args 传：
//   { topic: string, seconds?: number, dryRun?: boolean }
// dryRun=true 时只产出脚本与配音稿、不调用生成/合成工具（零成本验证编排）。
//
// meta = {
//   name: 'directorx-talking-video',
//   description: '口播短视频流水线：脚本 → 配音 → 素材 → 字幕 → 成片',
//   phases: [
//     { title: '脚本与口播稿' },
//     { title: '配音' },
//     { title: '素材与成片' },
//   ],
// }

const topic = typeof args.topic === 'string' && args.topic !== '' ? args.topic : '一个 60 秒的 AI 工具介绍短片'
const targetSeconds = typeof args.seconds === 'number' && args.seconds > 0 ? args.seconds : 60
const dryRun = args.dryRun === true

const SCRIPT_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    script: { type: 'string' },
    subtitleLines: { type: 'array', items: { type: 'string' } },
    voice: { type: 'string' },
  },
  required: ['title', 'script', 'subtitleLines'],
  additionalProperties: false,
}

phase('脚本与口播稿')
const scriptResult = await agent(
  [
    '你是口播短视频的脚本导演。',
    `主题：${topic}；目标时长约 ${targetSeconds} 秒（中文口播约 4 字/秒）。`,
    '要求：',
    '- 先加载 directorx-production-lead 做分诊，再查 directorx_knowledge_search 的短视频结构（黄金 3 秒钩子/转折/结尾行动号召）；',
    '- 产出：标题、口播稿全文（口语化、短句）、按句切好的 subtitleLines（字幕行数组）、建议音色（导演级中文女声/男声）；',
    '- 画布镜像：directorx_canvas_get 读现状后，用 directorx_canvas_title 设置标题，用 directorx_canvas_batch 建 text 节点（脚本 + 每句字幕行），不覆盖已有内容。',
  ].join('\n'),
  { label: '脚本导演', phase: '脚本与口播稿', schema: SCRIPT_SCHEMA },
)

if (dryRun) {
  const review = await agent(
    [
      '你是口播稿质检员（dry run，不生成）。',
      JSON.stringify(scriptResult),
      '检查：时长估算（4 字/秒）、钩子、信息密度、字幕断句、违禁/风险内容。输出 verdict(pass|fix) 与修改建议。',
    ].join('\n'),
    { label: '口播稿质检', phase: '脚本与口播稿' },
  )
  return { topic, dryRun: true, script: scriptResult, review }
}

phase('配音')
const VOICE_SCHEMA = {
  type: 'object',
  properties: {
    audioPath: { type: 'string' },
    voice: { type: 'string' },
    error: { type: 'string' },
  },
  required: ['audioPath'],
  additionalProperties: false,
}
const voiceover = await agent(
  [
    '你是配音执行员。用 directorx_generate_audio 把口播稿合成为旁白音频：',
    `口播稿：${scriptResult.script ?? ''}；建议音色：${scriptResult.voice ?? 'alloy'}`,
    '操作：调用 directorx_generate_audio（voice 用建议音色），返回的本地 path 原样填入 audioPath；失败则记录 error 并给出最近降级（换音色/分段合成）。',
  ].join('\n'),
  { label: '配音执行', phase: '配音', schema: VOICE_SCHEMA },
)

phase('素材与成片')
const FINAL_SCHEMA = {
  type: 'object',
  properties: {
    finalPath: { type: 'string' },
    subtitlePath: { type: 'string' },
    steps: { type: 'array', items: { type: 'string' } },
    notes: { type: 'string' },
  },
  required: ['steps'],
  additionalProperties: false,
}
const assembly = await agent(
  [
    '你是成片组装师。把旁白与素材组装成最终成片：',
    JSON.stringify({ topic, scriptResult, voiceover, targetSeconds }),
    '操作：',
    '1. 画布盘点：directorx_canvas_get 查可用素材（image/video 节点）；需要 b-roll 时用 directorx_generate_video（图生视频优先，参考图用画布素材或 directorx_generate_image 先行）；',
    '2. 素材统一：每个视频素材 directorx_video_process（scale=16:9、fps=25）；',
    '3. 拼接：directorx_video_concat（transition=fade，fadeSec=0.5）；',
    '4. 混音：directorx_audio_mix 把旁白（duckUnder=0）+ 可选 BGM 混入成片；',
    '5. 字幕：directorx_transcribe_audio（format=srt）从旁白音频生成 srt 侧车，subtitlePath 记录路径；',
    '6. 画布：成片 path 用 directorx_canvas_add 建 video 节点（或 update 到总成片节点），label 标「成片」；',
    '7. steps 记录每一步工具与产物路径（原样引用，不猜测）。',
  ].join('\n'),
  { label: '成片组装', phase: '素材与成片', schema: FINAL_SCHEMA },
)

return { topic, script: scriptResult, voiceover, assembly }
