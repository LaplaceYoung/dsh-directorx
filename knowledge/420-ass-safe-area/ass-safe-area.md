---
type: Reference
title: "ASS 字幕安全区与渲染合同（ASS Safe-Area Contract）"
description: "规定 ASS/字幕的画幅换算、Title Safe/Action Safe、对齐锚点、边距、动态字体冲突和 ffmpeg/libass 验收，避免平台裁切"
tags:
  - "craft"
  - "continuity"
  - "platform"
status: stable
stale_after: "2028-08-25"
generated:
  by: "process:directorx-dx-design-migration"
  at: "2026-08-25T00:00:00Z"
verified:
  - by: "process:directorx-dx-design-migration"
    at: "2026-08-25T00:00:00Z"
sources:
  - resource: "internal:dx-design/agent-profiles/v2/workflows/_shared/subtitle-pipeline.md"
    id: source-subtitle-pipeline
    title: "ASS subtitle pipeline and safe-area rules"
  - resource: "internal:dx-design/opencode-config/knowledge/workflows/koc/reference/output-spec.md"
    id: source-output-spec
    title: "Subtitle output specification"
dx_id: "420"
related:
  - "195-brand-visual-asset/brand-visual-asset.md"
  - "423-jianying-delivery/jianying-delivery.md"
  - "02-editing-transitions/editing-transitions.md"
---

# ASS 字幕安全区与渲染合同（ASS Safe-Area Contract）

## 为什么是合同

字幕是独立的确定性后期产物，不是 asset anchor，也不把它写进视频生成 prompt 让模型渲染。只有用户、平台默认策略或已确认 shot plan 明确要求字幕/歌词/可读文字 burn-in，或用户请求字幕文件导出时才进入本管线；否则不擅自加字幕。生成、格式化、烧录和 QC 必须消费同一份安全区数据。

目标 DirectorX 映射：

- `hub_subtitle_format` / ASS writer → `directorx_subtitle_format`（若 provider 能力已配置）或现有 SRT normalize + 本地格式化 seam；
- `hub_ffmpeg` → `directorx_video_subtitle`，`mode=burn` 需要 libass；`mode=soft` 可用 mov_text 侧车；
- `hub_read_media` → `directorx_probe_media`；
- `hub_canvas_write_node` → `directorx_canvas_update`；
- 用户选择/阻塞确认 → `directorx_ask` / `directorx_confirm`。

## 坐标与安全区

### PlayRes 与像素换算

ASS 脚本声明 `PlayResX`/`PlayResY`，所有坐标在脚本坐标系计算，再映射到输出像素：

$$x_{px}=x_{ass}\times W/PlayResX,\qquad y_{px}=y_{ass}\times H/PlayResY$$

目标画幅改变时，保持相对安全区比例，不复制 16:9 的像素边距到 9:16。若输出尺寸或旋转未知，先 probe，不猜。

### Safe-area tiers

- **Title Safe（默认字幕区）**：字幕/关键文字/主体避开画面顶部 `1/8`、底部 `1/4`、左右各 `7%`；平台预设若更严格，以预设为准。
- **Action Safe**：距边缘约 5% 的内框，供主体动作/重要图形；字幕不能仅因 Action Safe 可用就侵入 Title Safe。
- **UI exclusion**：短视频平台的顶部标题、底部描述、按钮和手势区域必须单独登记；没有平台规范时采用保守 15% 顶/底禁区并标记为假设，用户提供平台值后更新。

安全区输出至少包含：`play_res`, `output_size`, `title_safe`, `action_safe`, `ui_exclusion`, `anchor`, `margin_v/h`, `font_size`, `outline`, `shadow`。任何文案变长、字体替换或画幅变化都要重新测量 bounding box。

### 对齐与边距

ASS alignment 使用 1–9 九宫格。默认歌词/对白可采用底部居中 `Alignment=2`，但需要多行稳定视觉中心时使用字幕块中心（`\\an5` + `\\pos`）而不是让一行/两行 cue 上下跳动；`MarginV` 置于 Title Safe 内。旁白/对白按用户指定角色区分，不能让所有文字共享同一锚点。短动态字若与歌词同屏，应使用独立 Layer 和不重叠区域，不以 `\\pos` 硬塞进安全区外。

### 文本来源与逐行预算

- 可信 timed text 优先级高于 ASR：用户提供 `.srt`/`.ass`、工具返回的 `subtitle_path`、已批准且带 clip duration 的对白片段，或手写时间文本都可直接进入格式化；`directorx_transcribe_audio` 的 ASR 结果只是 plain SRT 草稿，不是 styled final subtitles。
- 传入 `directorx_subtitle_format` 时必须把最终视频 `output_size`/resolution 一并传入，使用 `output_format: ass`；未指定样式时采用 `social_safe`，不得静默关闭安全区、描边、可读性底板或平台边距。
- 每行文字预算按画幅显式执行：竖屏 `9:16/3:4` 中文 ≤10 字、英文 ≤7 词；横屏 `16:9/21:9` 中文 ≤16 字、英文 ≤14 词；方屏 `1:1` 中文 ≤13 字、英文 ≤10 词。超长 cue 在语义边界显式换行，仍超两行则拆为下一个连续 cue，不切断 CJK/英文词。
- 字幕文件是交付物仅当用户明确请求导出；否则 SRT/ASS/VTT 是 workspace 中间产物，不写入 Canvas。burn 使用格式化器返回的绝对路径，不把相对 `path` 传给 subtitle filter。

字幕排版规则：

- 每个 cue 只传可信文字和时间窗；时间不可信先返回 blocked，不把 ASR 置信度当精确边界。
- 断行优先在语义/呼吸处，不拆姓名、数字、URL；两行高度必须留在 Title Safe。
- 字体必须在目标机器可加载；不存在时报告 fallback，不静默换字形造成溢出。
- 描边/阴影增强可读性但不能依赖巨大 outline 伪造对比度；背景复杂时用有限半透明底板，并登记为 Layer。
## 应用流程

1. **Probe**：`directorx_probe_media` 读取视频 W/H、SAR/DAR、fps、duration；确定横竖屏和平台版本。
2. **Source text**：使用已确认歌词/对白时间轴；需要 ASR 时 `directorx_transcribe_audio`，把输出标为 draft，随后人工/用户确认关键专名和边界。
3. **Plan safe area**：建立 safe-area JSON；登记平台 UI exclusion、字幕锚点、动态字体/Logo 区域和避让关系。MV 的动态字体账本优先于普通字幕样式。
4. **Format**：先调用 `directorx_srt_normalize`（`srt` 为绝对路径，可显式传 `minDurationSec`/`gapMergeSec`）规范化时间，再走现有本地格式化 seam；若 provider-backed `directorx_subtitle_format` 已启用则传入最终 `output_size`、`output_format: ass` 和 `style_preset: social_safe`，生成 `.ass`。输出落 outputDir，源文本不覆盖。
5. **Render**：先低分辨率预览，确认外框、字体和断行；`directorx_video_subtitle` 的 `mode=burn` 进行 hard-burn，libass 不可用时返回明确错误，不伪造烧录成功。需要可选轨时使用 `mode=soft`；传入字幕 filter 的必须是格式化器返回的绝对路径。

## 示例 safe-area 数据

```yaml
ass_safe_area:
  play_res: { width: 1920, height: 1080 }
  output_size: { width: 1920, height: 1080 }
  title_safe: { left: 192, right: 1728, top: 108, bottom: 972 }
  action_safe: { left: 96, right: 1824, top: 54, bottom: 1026 }
  ui_exclusion: { top_ratio: 0.15, bottom_ratio: 0.15, source: platform_default_assumption }
  style: { alignment: 2, margin_h: 192, margin_v: 140, font_size: 54, outline: 3, shadow: 1 }
  checks: { cues_in_title_safe: false, font_loaded: false, preview_rendered: false }
```

示例中的 `false` 是新计划的初始状态，不是已通过的结果；执行后必须以真实 QC 替换。

## 退出门

- PlayRes/output 尺寸与画幅真实匹配；
- 每个 cue 时间和文字已确认，ASS 文件可读，字体可加载或 fallback 已披露；
- 所有字幕/动态字落 Title Safe 且避开平台 UI exclusion，关键主体不被遮挡；
- burn/soft 模式结果真实可 probe，libass 能力缺失时明确阻塞；
- Canvas/交付记录包含 ASS、safe-area、字体和 QC 路径。

## 反模式

- 把 SRT 直接改扩展名为 ASS。
- 用 1920×1080 固定像素边距覆盖竖屏。
- 没有平台信息却声称已通过 UI 安全区。
- 字体不存在时静默 fallback；把 `mode=burn` 错报为成功。
- 用巨大描边、阴影或底板掩盖文字越界和错误断行。

## 相关概念

- [AI 视频品牌视觉资产体系（Brand Visual Asset — Brand Kit as Machine-Readable Tokens）](../195-brand-visual-asset/brand-visual-asset.md)
- [剪映草稿与平台交付包（Jianying Draft & Platform Delivery）](../423-jianying-delivery/jianying-delivery.md)
- [剪辑与转场（Editing & Transitions）](../02-editing-transitions/editing-transitions.md)
