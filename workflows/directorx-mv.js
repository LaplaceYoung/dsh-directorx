// DirectorX MV workflow: seven-stage contract on the existing workflow seam.
// args: { brief: string, music?: string, shots?: number, dryRun?: boolean }
// meta = { name: 'directorx-mv', description: 'MV 七阶段：方向 → 主音乐 → 计划 → 锚点 → 分镜 → 逐组生成 → 后期交付', phases: [{ title: '方向与音乐' }, { title: '计划与资产' }, { title: '分镜与生成' }, { title: '后期与交付' }] }

const brief = typeof args.brief === 'string' && args.brief !== '' ? args.brief : '制作一支以真实主音乐为唯一时钟的 MV'
const music = typeof args.music === 'string' && args.music !== '' ? args.music : undefined
const shotCount = typeof args.shots === 'number' && Number.isInteger(args.shots) && args.shots > 0 ? args.shots : undefined
const dryRun = args.dryRun === true

const PLAN_SCHEMA = {
  type: 'object',
  properties: {
    mainSong: { type: 'string' },
    durationSec: { type: 'number' },
    contentMode: { type: 'string', enum: ['narrative_story', 'visual_aesthetic'] },
    timeline: { type: 'array', items: { type: 'object', additionalProperties: true } },
    anchors: { type: 'array', items: { type: 'object', additionalProperties: true } },
    groups: { type: 'array', items: { type: 'object', additionalProperties: true } },
    blocked: { type: 'array', items: { type: 'string' } },
  },
  required: ['timeline', 'anchors', 'groups', 'blocked'],
  additionalProperties: false,
}

phase('方向与音乐')
const plan = await agent(
  [
    '你是 DirectorX MV 规划员。七阶段消费现有 DSH tools/Canvas/Knowledge，不创建新的 agent loop 或存储。',
    `brief=${brief}; music=${music ?? '缺失'}; requested_shots=${shotCount ?? 'derive'}`,
    '确认内容模式 narrative_story 或 visual_aesthetic；调用 directorx_probe_media 检查真实主音乐。若缺音乐，blocked 写 missing_main_song，不猜时长/BPM。需要生成音乐时只能提出 directorx_generate_audio，等待现有确认 gate。',
    '输出 timeline：从 0 到真实最终整数 duration 连续的歌词/器乐段；没有真实转写时标记 unmeasured。规划 groups：4–15 秒整数组，总和等于主音乐；每组包含完整六段派单原文、start_state/end_state、audio_proxy_policy。anchors 只列跨两组以上的角色/场景依赖，角色默认 six_view_3x2。',
  ].join('\n'),
  { label: 'MV 方向与计划', phase: '方向与音乐', schema: PLAN_SCHEMA },
)

if (dryRun || plan?.blocked?.length) return { brief, dryRun: true, plan }

phase('计划与资产')
const ASSET_SCHEMA = {
  type: 'object',
  properties: {
    anchors: { type: 'array', items: { type: 'object', additionalProperties: true } },
    refs: { type: 'array', items: { type: 'object', additionalProperties: true } },
    errors: { type: 'array', items: { type: 'string' } },
  },
  required: ['anchors', 'refs', 'errors'],
  additionalProperties: false,
}
const assets = await agent(
  [
    '你是资产连续性执行员。根据已确认 plan 只为必要的跨镜头依赖创建/登记锚点。',
    JSON.stringify(plan),
    '角色默认要求 16:9 3x2 六视图（全身 front/side/back + 脸部 front/profile/three-quarter）；场景只锁跨段落固定结构。调用现有 directorx_knowledge_read、directorx_view_image、directorx_prompt_plan/craft/ready/generate_image 或 directorx_character_register 与 Canvas seam；返回真实 refs/path。',
    '错误写 errors，不编造图片或路径；保持稳定 anchor_id，替换版本标 superseded。',
  ].join('\n'),
  { label: 'MV 资产锚点', phase: '计划与资产', schema: ASSET_SCHEMA },
)

phase('分镜与生成')
const GENERATE_SCHEMA = {
  type: 'object',
  properties: {
    items: { type: 'array', items: { type: 'object', additionalProperties: true } },
    errors: { type: 'array', items: { type: 'string' } },
  },
  required: ['items', 'errors'],
  additionalProperties: false,
}
const generated = await agent(
  [
    '你是 MV 逐组执行员。只有 plan 已确认且 assets refs 可读才执行。',
    JSON.stringify({ plan, assets }),
    '每组一个 work item，Stage 5 六段 Prompt 原文逐字投影；每个组的 audio 1 仅为等长口型/节奏代理。按 sequence_index 顺序调用 directorx_prompt_plan → directorx_prompt_craft → directorx_generate_ready → directorx_propose/directorx_confirm → directorx_generate_video；不得并行或二次改写。返回真实 path/status，失败记录 errors。',
  ].join('\n'),
  { label: 'MV 逐组生成', phase: '分镜与生成', schema: GENERATE_SCHEMA },
)

phase('后期与交付')
const FINAL_SCHEMA = {
  type: 'object',
  properties: {
    finalPath: { type: 'string' },
    variants: { type: 'array', items: { type: 'object', additionalProperties: true } },
    steps: { type: 'array', items: { type: 'string' } },
    errors: { type: 'array', items: { type: 'string' } },
  },
  required: ['variants', 'steps', 'errors'],
  additionalProperties: false,
}
const final = await agent(
  [
    '你是 DirectorX 后期与交付执行员。只消费真实生成路径，发现缺组/重复序号/不可读路径就停止并报告。',
    JSON.stringify({ plan, assets, generated }),
    '用 directorx_video_concat/directorx_timeline 按 sequence 装配，移除片段 BGM 和 lip_sync_proxy，再用 directorx_audio_mix 加完整 mainSong 从 0 秒连续覆盖；字幕 opt-in 时遵守 directorx_subtitle_format + knowledge/420 safe-area；directorx_probe_media QC；按 knowledge/423 形成 master/social/Jianying（provider 不可用要明确 unavailable，不伪造 draft）；directorx_canvas_update 写 mv_final 和真实 variant paths。',
  ].join('\n'),
  { label: 'MV 后期交付', phase: '后期与交付', schema: FINAL_SCHEMA },
)

return { brief, plan, assets, generated, final }
