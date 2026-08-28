---
name: directorx-mv-workflow
description: 以最终主音乐为唯一主时钟制作 MV：输入确认、音乐就绪、七阶段规划、角色/场景锚点、逐组视频、后期合成与交付；用户说 MV、歌词视觉、音乐可视化或给歌配画面时使用。
user-invocable: true
whenToUse: 任务包含歌曲与画面、卡点/口型/歌词/表演视频或混合实拍与 AI 插片，需要从创意到可交付成片的可恢复阶段合同时加载。
---

# DirectorX MV Workflow：七阶段音乐驱动制作

## Purpose

把此前独立 MV workflow 的有效语义迁入 DSH：最终 `main_song` 是唯一时间权威，七阶段消费已确认上游产物；Canvas、StudioShell、skills/Knowledge、preset、tool registry 和 outputDir 仍使用现有 DirectorX seam。这里是可执行合同，不是第二套 agent loop 或 RPC。

Source API → DirectorX 映射：

- `hub_read` → `directorx_knowledge_read` / `directorx_canvas_get` / 既有 stage detail 读取；
- `hub_audio_meta` → `directorx_probe_media`；
- `hub_audio_separate` → 已注册 audio provider 的分离能力，结果以现有 outputDir/runtime ref 登记；
- `hub_audio_analyze_music` / `hub_audio_transcribe_lyrics` → 现有 `directorx_audio_beat`、`directorx_transcribe_audio` 或 provider audio index；没有真实能力时不伪造 BPM/歌词时间码；
- `hub_ffmpeg` → `directorx_video_process`、`directorx_audio_subclip_batch`、`directorx_video_concat`、`directorx_timeline`、`directorx_audio_mix`；
- `hub_canvas_write_*` → `directorx_canvas_add` / `directorx_canvas_update` / `directorx_canvas_plan`（先确认）；
- `question` → `directorx_ask`；`hub_generate_video` → `directorx_generate_video`。

## Input

可提供音频、参考 MV/图/视频、歌词、故事或视觉概念、表演者/角色图、目标时长、画幅、媒介、风格和交付平台。缺少输入可以从零开始，但必须先问阻塞卡；已有附件和用户原话是事实，不用让用户重复上传。示例：`用这首歌做 45 秒 9:16 MV，主唱角色沿用照片，歌词只在副歌做动态大字，最后交抖音和剪映草稿。`

## Key Concepts

### 唯一主时钟与内容模式

- `main_song` 是 Stage 2 定稿后的最终音频；所有时间轴从 00:00 重算，最终时长用整数秒。
- 方向先锁内容形态：`narrative_story` 保留人物、事件、因果、地点功能和结果；`visual_aesthetic` 只组织主体、情绪、母题、关键画面和视觉演进，禁止把隐喻编成任务/关系/剧情。
- 参考 MV 只迁移可观察机制（色调、构图、动作、剪辑密度、包装），不复制人物、Logo、逐镜顺序或受保护文本；需要时走版权安全 skill。

### 七阶段

| 阶段 | 用户可见产物 | 完成门 |
|---|---|---|
| 1 `intent` | 方向稿、音乐来源、媒介、风格、时长、画幅、参考用途 | 视觉方向已由本轮问询或明确输入确认；无阻塞素材 |
| 2 `music-prep` | 最终 `main_song`、来源、形式、实际声线/语言、整数使用范围 | 试听可用；真实文件可读；不是聊天摘要 |
| 3 `production-plan` | 最终主音乐歌词/节奏时间轴、Treatment、节奏/空间/声音/字体/锚点策略 | 逐句时间轴从 00:00 连续到最终整数秒；不重叠无空洞 |
| 4 `assets` | 必要角色锚点、条件场景锚点、普通场景描述、style refs（仅用户要求时 research） | 资产真实存在/复用，refs 用途明确；不为每个名词造资产 |
| 5 `shot-plan` | 一份或长片上下两份真实分镜；每组完整六段派单原文 | 4–15 秒整数组；组总和等于音乐；逐镜有动作、运镜、口型、光/VFX、字体、结束状态 |
| 6 `visual-gen` | 每组一个 video work item，Prompt 是 Stage 5 原文逐字投影，音乐切片和 refs 绑定 | 一次确认全部；`concurrency_limit=1`、`sequence_index` 严格；不二次创作 |
| 7 `post` | `mv_timeline`、`mv_final`、画布成片和平台包 | 主音乐连续；片段代理音轨移除；SFX/字幕/安全区/交付规格通过 |

Stage 4 只按依赖创建锚点：跨至少两个段落/派单的主体才需要角色锚点；同一场景需要可识别空间连续时才生成场景锚点。共享默认角色锚点是 **16:9、3×2 六视图**（全身 front/side/back + 脸部 front/profile/three-quarter），但选定 MV workflow 可明确采用另一种身份卡布局；不得把 plain “三视图”自动改成六视图而不告知。

### 音乐与声音

- 已有主音乐：`directorx_probe_media` 检查；多音频先标主音乐/参考/伴奏/人声。
- 无主音乐且用户要求生成：只问一次具体子风格和歌曲语言形式，调用现有 `directorx_generate_audio`；生成后试听和定稿，不把 lyrics seed 当最终歌词。
- 视觉生成阶段的 `audio 1` 只作口型/节奏代理；Post 删除代理及片段 BGM，完整 `main_song` 从 0 秒连续覆盖时间线。
- MV 默认不生成第二首 BGM；SFX/ambience 是可选后期层，遵守 `knowledge/422-sfx-noise-limits`。

### 六段分镜原文合同

每组顺序固定：

1. `参考素材说明`：真实 image/video/audio refs 的用途与顺序；
2. `核心创意`：主体、空间和本组视觉意图；
3. `音乐、歌词与表演`：时间窗、歌词/器乐、口型、表演落点；
4. `视觉与动态字体系统`：色彩、材质、VFX、准确文字和 Layer；
5. `画面过程描述`：所有 Shot 的景别、动作、镜头、光线、转场、下一镜 start/本组 end；
6. `全局要求与生成锁`：连续性、Medium lock、音频策略和禁止项，最后一行是 Medium lock。

Stage 6 不写“见 Plan/按分镜/同上”，不摘要、不重排、不补创意；若来源范围缺失，回 Stage 5 修复。每组一个视频 item；模型不可用时报告能力问题，不静默换模型。

## Application

### Stage 1–3：方向、音乐、计划

1. 用 `directorx_skill_route` 路由，再读本技能、相关 Knowledge 和 `directorx-production-lead`；以附件/原话建立 intake。
2. `directorx_ask` 只询问尚缺的内容、视觉类型、视觉风格、时长、画幅和参考用途。已有证据不重复问。
3. `directorx_probe_media` 音乐；若需切片用 `directorx_audio_subclip_batch`；若需要节拍/峰值用 `directorx_audio_beat`。工具不可用时保持未测量，不生成虚假结构。
4. 用最终音频真实听感/转写建立唯一逐句时间轴；每一句实际歌词单独一行，器乐/呼吸/停顿覆盖空档，最后一行到整数终点。逐句时间轴是后续字幕、口型和分镜的唯一来源。
5. 写 Treatment：每段至少改变事件/信息/关系（故事）或主体/尺度/光色/材质/构图/字体/VFX（视觉）；段落不等于逐句图解。
6. 建立 `style_anchor`、色彩弧线、1–2 个视觉母题、Hook/Ending 策略、声音层级、字体账本和锚点需求。动态大字默认视频内生成；准确文字才允许后期兜底。

### Stage 4–6：资产、分镜、生成

1. 角色/场景资产先通过现有 `directorx_character_register`、`directorx_canvas_add` 或图像生成链登记；同批身份资产锁同一 vendor/model，替换资产保留稳定逻辑 id，旧路径标 superseded。
2. 分镜时间组按 4–15 秒整数切分，总和严格等于主音乐；12–15 秒高能组可含多个完整子镜头，但每个子镜头仍有主动作/主运镜和承接状态。
3. 每镜绑定 `beat_id`、section、energy、framing、camera_motion、color_script、motif_state、transition、characters、needs_sheet、歌词/字体字段；副歌可更密，Intro/Bridge/Outro 保留呼吸。
4. 先把完整分镜放 Canvas/项目文档并通过 `directorx_confirm`；再生成每组 craft/ready，`directorx_propose` 占位，确认整批后执行。
5. 运行 `directorx_generate_video` 时一次只发最小 `sequence_index`，每次完成后再读 Stage 状态；生成结果写回 Canvas。不要用并行代理替代 DSH 的单一执行路径。

### Stage 7：后期与交付

1. 按 `sequence_index` 收集每组当前真实视频；缺片、重复 id、路径不可读或时长不符则停止，不编造。
2. `directorx_timeline` / `directorx_video_concat` 按确认转场装配；全片 0 到 `final_duration_sec` 连续，无黑屏填充、无尾帧补时、无临时变速。
3. 移除每段音乐和口型代理，加入完整 `main_song`；只混入计划中的 SFX/ambience，避免双音乐和削波。
4. 需要字幕/歌词时先得可信 timed text，再 `directorx_subtitle_format`（provider 可用时）或现有 SRT lint/normalizer，最后 `directorx_video_subtitle`/timeline burn；遵守 safe-area contract，见 `knowledge/420-ass-safe-area`。
5. 最终 `directorx_probe_media` 检查画幅、分辨率、fps、duration、音频流；交付前建立平台版本（master、social、Jianying）和可回退清单，见 `knowledge/423-jianying-delivery`。
6. `directorx_canvas_update` 或现有 Canvas media write 写入唯一 `mv_final`，deliver 阶段再 `directorx_skill_capture { action: "offer", present: true }`。

### Acceptance

- 7 阶段产物可恢复、稳定 id 可追踪，任何阶段不依赖聊天摘要重建事实。
- 主音乐是唯一时间权威；时间线连续、整数分组、总和一致；代理音轨不进入最终混音。
- 分镜完整六段原文逐字投影到对应视频 item；不复制 source hub API 名称，不创建第二套 prompt 文档或 agent loop。
- 角色/场景锚点按依赖生成，六视图身份要求和 safe-area/字幕/SFX/平台交付合同可被 Knowledge 搜索发现。
- 最终视频写 Canvas，输出路径真实，平台/Jianying 包可检查并可局部重做。

## Examples

- **表演型 MV**：主歌 8 拍镜头保留全身与呼吸，副歌每 2–4 拍切中近景/特写，Hook 用一词动态大字；口型代理只在嘴部可见组启用。
- **叙事型 MV**：每段推进一个可拍的事件或关系状态，重复 Hook 回收同一物件母题；场景连续才创建场景锚点。
- **实拍 + AI 插片**：先以实拍主体/角色卡作身份锚，只让 AI 负责少数高概念插片，按素材用途披露并在 Post 保持音乐连续。

## Common Pitfalls

- 在 Stage 1–3 直接生成，跳过方向/音乐/分镜确认。
- 用模型或聊天摘要猜节拍、歌词或最终时长，替代真实音频。
- 把普通场景、每个道具都升级成锚点，造成资产爆炸。
- Stage 6 二次改写 Stage 5 Prompt，或并行提交多个长 Prompt。
- Post 保留片段 BGM、重新设计动态字体或无请求添加整首歌词字幕。
- 只返回文件路径，不写 `mv_final` Canvas 节点或平台交付元数据。

## References

- `knowledge/419-mv-master-clock/mv-master-clock.md`
- `knowledge/421-asset-anchors/asset-anchors.md`
- `knowledge/420-ass-safe-area/ass-safe-area.md`
- `knowledge/422-sfx-noise-limits/sfx-noise-limits.md`
- `knowledge/423-jianying-delivery/jianying-delivery.md`
- `recipes/mv-production.md`
- `workflows/directorx-mv.js`
