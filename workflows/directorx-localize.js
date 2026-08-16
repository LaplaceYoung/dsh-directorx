/**
 * 字幕本地化与配音对齐流水线（确定性工具链组装）。
 *
 * 阶段：转写 → SRT 规范化 → lint 质检 → 翻译（agent 步骤）→ 口播时长
 * 预算 → 逐句配音 → 音画对齐 → timeline 组装 → 质检卡。
 * 每个阶段独立可重跑；口型重打缺席时降级为「原声 + 字幕 + 画面」，
 * 永不失败。dryRun 先行。
 */

const video = typeof args.video === 'string' && args.video !== '' ? args.video : ''
const targetLang = typeof args.targetLang === 'string' && args.targetLang !== '' ? args.targetLang : 'zh'
const dryRun = args.dryRun === true

const TRANSLATION_SCHEMA = {
  type: 'object',
  properties: {
    cues: { type: 'array', items: { type: 'object', additionalProperties: true } },
    terms: { type: 'array', items: { type: 'string' } },
  },
  required: ['cues'],
  additionalProperties: false,
}

phase('转写与规范化')
const prep = await agent(
  [
    '你是字幕工程师。完成以下确定性步骤并汇报：',
    video !== '' ? `视频：${video}` : '（dryRun：无视频路径，走 mock 说明）',
    '1. directorx_transcribe_audio（format=srt，language 按视频语言）拿 srt；',
    '2. directorx_srt_normalize（间隙吞并 + 最短时长）；',
    '3. directorx_srt_lint 质检（单行≤16字/≤17cps/最短0.83s/序号连续），有问题逐条修复并说明；',
    '4. 输出：规范化后的 srt 文本 + lint 修复清单。',
  ].join('\n'),
  { label: '字幕工程师', phase: '转写与规范化' },
)

if (dryRun) {
  return { dryRun: true, targetLang, prep, next: '非 dryRun 时继续：翻译 → 时长预算 → 逐句配音 → audio_sync 对齐 → timeline 组装' }
}

phase('翻译与术语')
const translated = await agent(
  [
    `你是字幕翻译。目标语言：${targetLang}。`,
    `源字幕：${JSON.stringify(prep)}`,
    '操作：',
    '1. directorx_terms_match 命中项目术语（命中术语按字典读法翻译）；',
    '2. 逐条翻译为自然口语文案，保持条目数与时间轴；',
    '3. directorx_speech_clean 清理配音文案（括号噪声/商标符）；',
    '4. 输出 cues（含译文与配音文案）。',
  ].join('\n'),
  { label: '字幕翻译', phase: '翻译与术语', schema: TRANSLATION_SCHEMA },
)

phase('配音与对齐')
const final = await agent(
  [
    '你是配音导演。按确定性链路成片：',
    `译文 cues：${JSON.stringify(translated)}`,
    '1. 对每条 cue 用 directorx_speech_duration（lang 与 windowSec=该条时长）做时长预算，超窗的先缩句再配音；',
    '2. 逐条 directorx_generate_audio（一段一指令，speed 1.0-1.2；术语按字典读法写进文本）；',
    '3. directorx_audio_sync 对齐：视频 + 旁白 + srt → speech intervals 作切点锚；',
    '4. directorx_timeline 组装 + directorx_qa_report 质检卡上画布。',
  ].join('\n'),
  { label: '配音导演', phase: '配音与对齐' },
)

return { targetLang, prep, translated, final }