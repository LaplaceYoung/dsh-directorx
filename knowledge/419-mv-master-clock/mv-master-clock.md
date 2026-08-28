---
type: Reference
title: "MV 音乐主时钟与七阶段交接（MV Master Clock & Stage Handoff）"
description: "把最终主音乐设为 MV 唯一时间权威，覆盖输入、音乐就绪、逐句时间轴、分镜、口型代理、后期替换与交付的可恢复交接合同"
tags:
  - "craft"
  - "storyboard"
status: stable
stale_after: "2028-08-25"
generated:
  by: "process:directorx-dx-design-migration"
  at: "2026-08-25T00:00:00Z"
verified:
  - by: "process:directorx-dx-design-migration"
    at: "2026-08-25T00:00:00Z"
sources:
  - resource: "internal:dx-design/agent-profiles/v2/workflows/mv/workflow.md"
    id: source-workflow
    title: "MV music-led video workflow"
  - resource: "internal:dx-design/agent-profiles/v2/workflows/mv/reference/music.md"
    id: source-music
    title: "MV music generation and actual-song timeline"
dx_id: "419"
related:
  - "07-directing/directing-techniques.md"
  - "25-visualization-previz/visualization-previz.md"
  - "35-animatic-practice/animatic-practice.md"
---

# MV 音乐主时钟与七阶段交接（MV Master Clock & Stage Handoff）

## 核心合同

MV 的最终 `main_song` 是唯一时间权威。它必须是可读的真实音频、从 00:00 开始、具有最终整数时长和明确使用范围。方向稿、歌词种子、参考歌曲、模型生成时的代理音频、聊天摘要和文件名都不能覆盖它。所有镜头组、歌词/口型、动态字体、SFX、字幕和交付版本都从同一时钟派生。

源工作流的七阶段在 DirectorX 中保持语义，但不复制源 agent loop：

| 阶段 | 稳定产物 | DirectorX 执行映射 |
|---|---|---|
| intent | 内容/媒介/风格/时长/画幅/参考用途 | `directorx_skill_route`、`directorx_ask`、`directorx_stage` |
| music-prep | `main_song_source` → `main_song` | `directorx_probe_media`、`directorx_generate_audio`、`directorx_audio_subclip_batch` |
| production-plan | `main_song_lyrics_timeline`、Treatment、节奏/声音/字体计划 | `directorx_transcribe_audio`、`directorx_audio_beat`（有真实能力时）、Canvas 文本节点 |
| assets | 角色/条件场景锚点、普通场景描述 | `directorx_character_register`、现有生成/Canvas 工具 |
| shot-plan | 4–15 秒整数镜头组和六段派单原文 | `directorx_canvas_plan` / `directorx_canvas_shotlist`、`directorx_confirm` |
| visual-gen | 每组一个视频 item，原文逐字投影 | `directorx_generate_ready`、`directorx_propose`、`directorx_generate_video` |
| post | `mv_timeline`、`mv_final`、平台包 | `directorx_timeline`、`directorx_video_concat`、`directorx_audio_mix`、Canvas 写回 |

### 输入门

收到 MV 请求时登记真实附件、URL 解析结果、Canvas 节点和用户原话。只问缺失的阻塞值：内容来源、主音乐来源、参考用途、视觉媒介、视觉风格、目标时长和画幅。已有具体值不重复询问；没有音乐就不能进入时间轴阶段。

音乐来源为用户上传或视频抽轨时，先 `directorx_probe_media`，多音频先标记主音乐/参考/伴奏/人声 stem，最终只允许一份 `main_song`。音乐由 Agent 生成时，一次询问具体子风格与歌曲语言形式，生成后试听；歌词 seed 仅是生成输入，不是最终歌词真相。

### 整数定稿与逐句时间轴

主音乐定稿在同一执行回合完成：试听目标附近，选择目标上下可接受窗口内的自然落点；没有自然落点时按目标整数秒裁切并短淡出。不要变速、变调、循环、补静音或用视频尾帧掩盖音乐断句。裁切后再次试听最后 5 秒并读取 metadata，记录 `duration_authority`。

制作计划只对最终 `main_song` 做一次实际听感/转写分析。`main_song_lyrics_timeline` 从 00:00 连续覆盖到最终整数秒：每一句实际歌词单独一行，纯器乐/呼吸/停顿占据没有歌词的区间，行间不重叠、不留空，最后一行严格结束于最终时长。低置信词写 `[听不清]` 或低置信标记，不用 seed 补成确定歌词。若没有真实音频分析能力，标记未测量，不伪造 BPM、逐拍点或能量曲线。

### 分镜与生成

按最终时长计算 4–15 秒整数组；所有组的总和必须等于音乐。每个组含完整的参考说明、核心创意、音乐/歌词/表演、视觉与字体、画面过程、生成锁六段正文。每个 Shot 写主动作、主运镜、光色、VFX、口型/器乐、文字来源、开始状态和结束状态；相邻组继承方向、主体、空间或颜色中的至少一项。

视频生成阶段每组只绑定等长 `audio 1` 音乐切片作为口型/节奏代理。`work_items[].prompt` 是 Stage 5 连续原文的逐字投影；禁止“见 Plan”“同上”“按分镜”。使用 `concurrency_limit=1` 和严格 `sequence_index`，一次只提交最小未完成组。生成前走 `directorx_prompt_plan` → `directorx_prompt_craft` → `directorx_generate_ready`；严格/协同还要 `directorx_propose` / `directorx_confirm`。

### 后期与主音乐回收

Post 只消费当前成功的镜头组真实路径，按 sequence 排列。删除片段 BGM 和口型代理音轨，再将完整 `main_song` 从 00:00 连续覆盖到 `final_duration_sec`。不得通过补黑帧、静帧、临时变速或裁掉音乐来修复分镜时长错误；错误回到对应 Stage。动态字体保留在视频内，准确歌词/标题只按文字账本和字幕合同后期兜底。SFX/ambience 见 422；ASS 安全区见 420；剪映草稿交付见 423。

## 目标工具映射表

| 能力 | DirectorX 工具 | 证据/验收 |
|---|---|---|
| 音频元信息 | `directorx_probe_media` | duration、streams、sample rate 可读 |
| 节拍/峰值 | `directorx_audio_beat` | 返回时间点和强度；失败则未测量 |
| 文字转写 | `directorx_transcribe_audio` | plain SRT/文本，仅在无可信时间轴时使用 |
| 音频切片 | `directorx_audio_subclip_batch` | 每组绝对起止、无越界 |
| 视频组装 | `directorx_timeline` / `directorx_video_concat` | 连续覆盖、无重复/黑屏 |
| 混音 | `directorx_audio_mix` | 主音乐唯一、SFX/对白层级明确、无削波 |
| Canvas 交付 | `directorx_canvas_update` / `directorx_canvas_add` | `mv_final` node 有真实 path |

## 退出门与验收

- `main_song` 真实可读，最终整数时长和使用范围唯一；
- `main_song_lyrics_timeline` 连续覆盖且可追踪到最终音频；
- 组时长 4–15 秒、总和等于音乐，镜头组原文完整逐字投影；
- 代理音轨不会进入最终混音，SFX/字幕按 opt-in 合同执行；
- `mv_final` 写入 Canvas，master/social/Jianying 版本都有真实路径和 QC 结果。

## 反模式

- 用聊天摘要、歌词 seed 或参考歌曲重建最终歌词/节拍。
- Stage 6 改写 Stage 5 prompt，或用并行提交代替顺序锁。
- 保留每组 BGM 又混入完整主音乐。
- 成片只给文件路径，不登记 Canvas node、音轨策略和交付版本。

## 相关概念

- [导演技巧（Directing Techniques）](../07-directing/directing-techniques.md)
- [分镜与叙事可视化（Storyboarding & Visualization）](../25-visualization-previz/visualization-previz.md)
- [动态分镜实操（Animatic 制作实战）](../35-animatic-practice/animatic-practice.md)
