// DirectorX beat-sync workflow: existing DSH workflow seam, no second agent loop.
// args: { music: absolute path, clips?: absolute paths[], brief?: string, dryRun?: boolean }
// meta = { name: 'directorx-beat-sync', description: '音乐主时钟卡点：探测 → 节拍方案 → 裁剪拼接 → 混音交付', phases: [{ title: '音乐与切点' }, { title: '素材裁剪' }, { title: '混音与 QC' }] }

const music = typeof args.music === 'string' && args.music !== '' ? args.music : undefined
const clips = Array.isArray(args.clips) ? args.clips.filter((value) => typeof value === 'string' && value !== '') : []
const brief = typeof args.brief === 'string' ? args.brief : '按主音乐节拍制作混剪'
const dryRun = args.dryRun === true

const PLAN_SCHEMA = {
  type: 'object',
  properties: {
    musicPath: { type: 'string' },
    durationSec: { type: 'number' },
    measuredBy: { type: 'string' },
    cutPolicy: { type: 'object', additionalProperties: true },
    segments: { type: 'array', items: { type: 'object', additionalProperties: true } },
    errors: { type: 'array', items: { type: 'string' } },
  },
  required: ['segments', 'errors'],
  additionalProperties: false,
}

phase('音乐与切点')
const plan = await agent(
  [
    '你是 DirectorX 卡点规划员。只使用现有 directorx_* 工具，不调用 hub_*，不编造 BPM。',
    `brief=${brief}; music=${music ?? '缺失'}; clips=${JSON.stringify(clips)}`,
    '若 music 缺失，返回 errors 中的 blocked_music，不进入剪辑。否则先 directorx_probe_media 读取真实 duration，再 directorx_audio_beat 获取 beat/energy timestamps。',
    '按真实 timestamps 生成 segments，每项包含 start_sec/end_sec/material/reused；手动或 every-N 策略必须记录 cutPolicy。素材不足可循环但要显式标记；不合法切点记录 errors。',
  ].join('\n'),
  { label: '卡点规划', phase: '音乐与切点', schema: PLAN_SCHEMA },
)

if (dryRun || plan?.errors?.includes?.('blocked_music')) return { brief, dryRun: true, plan }

phase('素材裁剪')
const CUT_SCHEMA = {
  type: 'object',
  properties: {
    segments: { type: 'array', items: { type: 'string' } },
    errors: { type: 'array', items: { type: 'string' } },
  },
  required: ['segments', 'errors'],
  additionalProperties: false,
}
const cuts = await agent(
  [
    '你是确定性素材执行员。按 plan 的 segments 对每项调用 directorx_video_process 规格化/裁剪，源文件不覆盖；图片先转静态片段。',
    JSON.stringify(plan),
    '按 segment index 顺序返回真实输出路径；单项失败记录 errors，不静默跳过，不伪造路径。',
  ].join('\n'),
  { label: '素材裁剪', phase: '素材裁剪', schema: CUT_SCHEMA },
)

phase('混音与 QC')
const FINAL_SCHEMA = {
  type: 'object',
  properties: {
    finalPath: { type: 'string' },
    steps: { type: 'array', items: { type: 'string' } },
    errors: { type: 'array', items: { type: 'string' } },
  },
  required: ['steps', 'errors'],
  additionalProperties: false,
}
const assembly = await agent(
  [
    '你是 DirectorX 成片执行员。只消费真实 cuts 路径。',
    JSON.stringify({ plan, cuts, music }),
    '先 directorx_video_concat 或 directorx_timeline 按顺序拼接；再 directorx_audio_mix 只加入唯一主音乐与已确认 SFX/现场声，默认静音素材原声；最后 directorx_probe_media 检查 duration/streams/画幅并 directorx_canvas_update 写真实路径。',
    '若 cuts 有 errors 或路径不可读，返回 errors 并停止；steps 逐条记录工具与真实产物。',
  ].join('\n'),
  { label: '混音与 QC', phase: '混音与 QC', schema: FINAL_SCHEMA },
)

return { brief, plan, cuts, assembly }
