// DirectorX 制作流水线 —— workflow 工具脚本模板（dsh-directorx 插件内置）
//
// 用法：
//   1. 加载 directorx-workflow skill；
//   2. 调用 workflow 工具，meta 与 phases 照抄下方说明；
//   3. script 使用本文件内容（可按项目裁剪），args 传入：
//        { brief: string, shots?: [{id, description}], count?: number, dryRun?: boolean }
//      dryRun=true 时只产出剧本与提示词、不调用生成工具（先零成本验证编排）。
//
// meta = {
//   name: 'directorx-pipeline',
//   description: '导演流水线：剧本分镜 → 提示词工坊 → 并行生成 → 质检 → 组装方案',
//   phases: [
//     { title: '剧本与分镜' },
//     { title: '提示词工坊' },
//     { title: '并行生成' },
//     { title: '成片质检' },
//     { title: '组装方案' },
//   ],
// }

const brief = typeof args.brief === 'string' && args.brief !== '' ? args.brief : '一条 15 秒的产品短片'
const count = typeof args.count === 'number' && args.count > 0 ? Math.min(12, args.count) : 3
const dryRun = args.dryRun === true

const SHOT_SCHEMA = {
  type: 'object',
  properties: {
    shots: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          description: { type: 'string' },
          seconds: { type: 'number' },
          camera: { type: 'string' },
          continuity: { type: 'string' },
        },
        required: ['id', 'description'],
        additionalProperties: false,
      },
    },
    anchors: { type: 'object', properties: { subject: { type: 'string' }, style: { type: 'string' }, light: { type: 'string' }, lens: { type: 'string' } }, additionalProperties: true },
  },
  required: ['shots'],
  additionalProperties: false,
}

phase('剧本与分镜')
const script = await agent(
  [
    '你是 DirectorX 流水线的分镜导演。',
    `项目简报：${brief}`,
    `产出 ${count} 个镜头的分镜表。要求：`,
    '- 先加载 directorx-playbook skill，遵循其提示词原则与一致性清单；',
    '- 用 directorx_knowledge_search 查证镜头语言与模型规格，不要臆测；',
    '- 每个镜头写清：画面动作、机位/运镜、时长（秒）、与前后镜的连续性衔接；',
    '- 输出一组贯穿全片的锚点（anchors）：主体、风格、光线、镜头焦段。',
    '- 画布镜像（必须）：用 directorx_canvas_get 读现状，然后 directorx_canvas_add 为每个镜头建 text 节点（label=镜头 id+一句话），directorx_canvas_connect 按镜头顺序连线，并把它们放进一个新 group 节点（parent=组 id，组名含项目简报关键词）；完成后用 directorx_canvas_arrange 整理。不要覆盖已有节点。',
  ].join('\n'),
  { label: '分镜导演', phase: '剧本与分镜', schema: SHOT_SCHEMA },
)
const shots = Array.isArray(script.shots) && script.shots.length > 0
  ? script.shots.slice(0, count)
  : args.shots ?? []

phase('提示词工坊')
const PROMPT_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    prompt: { type: 'string' },
    negative: { type: 'string' },
    size: { type: 'string' },
    knowledgeRef: { type: 'string' },
  },
  required: ['id', 'prompt'],
  additionalProperties: false,
}
const prompts = await pipeline(shots, (prev, shot) => agent(
  [
    '你是提示词工坊的执笔。为下面的镜头写一条可直接交给生成模型的提示词。',
    `镜头 ${shot.id ?? ''}：${shot.description ?? ''}`,
    `全片锚点：${JSON.stringify(script.anchors ?? {})}`,
    '要求：',
    '- 用 directorx_knowledge_search 查该题材/模型的提示词规格，引用文章 id；',
    '- 提示词正面、具体、可生成：动作在前，再写机位、环境、风格、光线；',
    '- 与该镜头的连续性要求保持一致，不重复描述锚点之外的新设定；',
    '- 附上 negative（负面词）与建议尺寸。',
  ].join('\n'),
  { label: `提示词-${shot.id ?? 'shot'}`, phase: '提示词工坊', schema: PROMPT_SCHEMA },
))

if (dryRun) {
  phase('提示词质检')
  const review = await agent(
    [
      '你是提示词质检员（dry run，不生成）。逐条审查提示词：',
      JSON.stringify(prompts),
      '检查：锚点一致性、可生成性、负面词合理性、是否有付费生成前的规格/内容/成本/权利四道闸门风险。',
      '输出：逐镜 verdict(pass|fix) 与 fix 建议；整体结论与风险清单。',
    ].join('\n'),
    { label: '提示词质检', phase: '提示词质检' },
  )
  return { brief, dryRun: true, script, prompts, review }
}

phase('并行生成')
const GEN_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    files: { type: 'array', items: { type: 'object', properties: { path: { type: 'string' }, url: { type: 'string' } }, additionalProperties: true } },
    status: { type: 'string' },
    notes: { type: 'string' },
  },
  required: ['id'],
  additionalProperties: false,
}
const outputs = await pipeline(prompts, (shot) => agent(
  [
    '你是生成执行员。为下面的镜头生成画面：',
    `镜头 ${shot.id ?? ''}，提示词：${shot.prompt ?? ''}，负面词：${shot.negative ?? ''}，尺寸：${shot.size ?? ''}，`,
    `知识库引用：${shot.knowledgeRef ?? ''}。`,
    '操作：先加载 directorx-playbook 确认路由与闸门；再用 directorx_generate_image 生成（参考图与首尾帧需求按镜头要求加）；',
    '生成后把返回的 files[].path / url 原样填入报告，不要猜测；失败则记录错误并说明降级路径。',
  ].join('\n'),
  { label: `生成-${shot.id ?? 'shot'}`, phase: '并行生成', schema: GEN_SCHEMA },
))

phase('成片质检')
const qa = await agent(
  [
    '你是成片质检员。审查生成结果：',
    JSON.stringify(outputs),
    '逐镜：文件是否齐全、是否满足镜头描述与锚点、明显的崩坏（崩脸/畸形/违和）；用 directorx_view_image 抽查关键帧。',
    '输出：逐镜 verdict(pass|retake) 与原因；整体结论、需要重拍的镜头清单与重拍建议。',
  ].join('\n'),
  { label: '成片质检', phase: '成片质检' },
)

phase('组装方案')
const assembly = await agent(
  [
    '你是后期组装师。基于分镜顺序与质检结论给出组装方案。先用 directorx_canvas_get 读画布确认镜头清单，并用 directorx_canvas_update 把质检结论（label 或注释）反映到对应节点。组装方案要求：',
    JSON.stringify({ shots, outputs, qa }),
    '输出：镜头顺序、转场/节奏建议、需要的音频（旁白/音效，用 directorx_generate_audio）、',
    '以及在 WebUI 右侧编辑面板中二次剪辑的步骤（分割、重排、导出），最终交付文件清单。',
  ].join('\n'),
  { label: '组装方案', phase: '组装方案' },
)

return { brief, dryRun: false, script, prompts, outputs, qa, assembly }
