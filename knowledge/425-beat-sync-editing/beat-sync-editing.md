---
type: Reference
title: "Beat Sync 卡点剪辑与节拍证据（Beat-Sync Editing）"
description: "用真实音频峰值和用户切点生成连续混剪时间轴，规定 every-N、onset、segment、素材循环、原声策略和确定性后期验收"
tags:
  - "craft"
  - "editing"
  - "sound"
  - "continuity"
  - "narrative"
status: stable
stale_after: "2028-08-25"
generated:
  by: "process:directorx-dx-design-migration"
  at: "2026-08-25T00:00:00Z"
verified:
  - by: "process:directorx-dx-design-migration"
    at: "2026-08-25T00:00:00Z"
sources:
  - resource: "internal:dx-design/market-skills/extracted/beat-sync-editor-0.2.11/SKILL.md"
    id: source-beat-sync
    title: "Beat Sync Editor skill"
  - resource: "internal:dx-design/opencode-config/knowledge/workflows/mv/reference/music-analysis.md"
    id: source-music-analysis
    title: "MV music analysis"
dx_id: "425"
related:
  - "88-sound-image-on-set/sound-image-on-set.md"
  - "48-ai-drama-studio/ai-drama-studio.md"
  - "282-narrative-av-genre/narrative-av-genre.md"
---

# Beat Sync 卡点剪辑与节拍证据（Beat-Sync Editing）

## 时间轴原则

卡点剪辑以一条真实主音乐为唯一时钟。`directorx_probe_media` 读取 duration/streams，`directorx_audio_beat` 返回实际 beat/energy timestamps；没有工具证据就标记 `unmeasured`，不从文件名或风格猜 BPM。手动切点可以覆盖自动候选，但必须验证单调、在 `[0,duration]` 内并满足最小间隔。

目标工具映射：

- 音频探测：`directorx_probe_media`；
- beat/energy：`directorx_audio_beat`；
- 音频片段：`directorx_audio_subclip_batch`；
- 素材规格化：`directorx_video_process`；
- 拼接：`directorx_video_concat` / `directorx_timeline`；
- 混音：`directorx_audio_mix`；
- Canvas 证据：`directorx_canvas_update`。

## Cut policy

- `beat`：每个有效 beat 为候选；`every_n_beats=2` 每两拍切换。
- `onset`：用瞬态音头，必须设 `min_gap_sec` 避免闪切。
- `segment`：按 intro/verse/chorus/bridge/outro 或实际峰值密度调整切镜密度；没有可靠段落标记时只使用时间/强度。
- `manual_cuts`：优先级高于 every-N，但非法或过密点要退回。

切点组成 `{start_sec,end_sec,duration_sec,beat_index,strength,section}`，首点为 0（或用户确认的入口），尾点不超过最终音乐。最终片段总长与音乐差值不超过 0.05 秒，误差必须解释为编码量化。

## 素材策略

先统一所有素材画幅、分辨率、fps、像素格式和静音策略。图片转静态视频；视频按段裁切。素材不足时可按 `index % material_count` 循环复用，但计划必须显示复用次数；用户拒绝复用则暂停素材缺口。短片段补齐只能使用用户批准的 loop/pad，不用尾帧或黑帧偷偷填音乐。

卡点 MV 默认静音素材原声，仅混入主音乐；现场声、对白和 SFX 需要显式 track role 与时间 cue。SFX 不能变成第二首 BGM，见 422。

## 确定性流程

1. probe 主音乐和素材，确认主音乐/目标时长/画幅/fps；
2. 需要截取时先固定音乐窗口，再对最终窗口重做 beat 分析；
3. 按 mode/every-N/manual/min-gap 生成时间轴，输出切点证据和异常；
4. 逐项 video_process 规格化，记录失败，不制造缺口；
5. 用户确认 dry-run 后 concat/timeline；
6. audio_mix 加唯一主音乐及获批 SFX/现场声；
7. probe 最终文件并抽查切点、连续性、黑屏、音轨唯一、复用和 Canvas 路径。

## 计划数据

```yaml
beat_sync_plan:
  music: { path: /absolute/main.mp3, duration_sec: 30 }
  cut_policy: { mode: beat, every_n_beats: 2, min_gap_sec: 0.25, manual_cuts: [] }
  segments:
    - { index: 0, start_sec: 0, end_sec: 1.02, material: /absolute/a.mp4, reused: false }
  checks: { measured_by: directorx_audio_beat, timeline_contiguous: false, user_confirmed: false }
```

初始 `false` 不是通过结论；执行后必须以真实检查替换。

## 验收与反模式

通过条件：每个切点有音频/用户证据；切点单调且时间轴连续；素材规格一致；主音乐唯一；原声/SFX 策略明确；失败可局部重做；输出路径写 Canvas。禁止调用 source `hub_*`、shell/第二套 loop 或虚假 BPM。

常见错误：先全曲分析再随意裁音乐、切点整体偏移；每拍切导致不可编码的闪切；用 xfade 掩盖本应硬切的节拍；只报 MP4 路径不报切点和复用记录。

## 相关概念

- [拍摄端声画协同（Designing Picture for Sound）](../88-sound-image-on-set/sound-image-on-set.md)
- [AI 短剧/漫剧视觉工厂（AI Drama & Manhua Studio Pipeline）](../48-ai-drama-studio/ai-drama-studio.md)
- [电影叙事-视听-类型三整合（Narrative-AV-Genre Integration — Unified Cinematic Language）](../282-narrative-av-genre/narrative-av-genre.md)
