name: 卡点混剪
description: 以真实主音乐节拍为唯一时间轴，将照片/视频素材确定性裁剪、拼接、混音并写回 Canvas；适合 MV 卡点、旅行混剪、产品节奏片。

# 卡点混剪配方

## 适用边界

主音乐和素材必须有真实本地路径或已确认 Canvas media node。主音乐是唯一时间权威；没有音乐时先走用户确认或生成音频流程，不能从文件名猜 BPM。此配方不负责创作第二套 agent loop、RPC、存储或主题。

## 阶段序列

1. **probe** — `directorx_probe_media` 读取音乐/素材 duration、streams、分辨率、fps；登记主音乐、参考音频、素材原声角色。
2. **beat-plan** — `directorx_audio_beat` 获取 beat/energy 时间戳；按 `beat`/`onset`/`segment`、every-N、manual cuts 和最小间隔生成连续 `beat_sync_plan`。无法测量就标记 unmeasured，不伪造 BPM。
3. **asset-normalize** — `directorx_video_process` 把视频和图片转成统一画幅、fps、编码、静音策略；图片先转静态片段；源文件不覆盖。
4. **preview-gate** — 向用户展示音乐窗口、切点摘要、素材分配、循环复用、预期时长；用户确认后才执行拼接。
5. **cut-and-concat** — 按 segments 用 `directorx_video_process` 裁切，再用 `directorx_video_concat` 或 `directorx_timeline` 按顺序硬切/经批准转场；总时长连续。
6. **mix** — `directorx_audio_mix` 只加入唯一主音乐和明确批准的 SFX/现场声；MV 默认静音素材原声，代理音轨丢弃。
7. **qc-deliver** — `directorx_probe_media` 检查最终 duration/画幅/fps/音频流；抽查切点、黑帧、削波和复用；`directorx_canvas_update` 写入真实成片 path。

## 计划字段

```yaml
beat_sync_plan:
  music: { path: /absolute/main.mp3, duration_sec: 30 }
  target: { duration_sec: 30, aspect_ratio: 9:16, fps: 30 }
  cut_policy: { mode: beat, every_n_beats: 2, min_gap_sec: 0.25, manual_cuts: [] }
  segments: []
  audio: { main_music: true, source_audio: false, sfx: [] }
  checks: { measured: false, timeline_contiguous: false, user_confirmed: false }
```

计划的 `false` 值必须由真实执行结果替换，不能作为通过结论。

## 门禁

- 切点单调、在音乐窗口内，`sum(segment.duration)` 与主音乐差值不超过 0.05 秒；
- 素材不足时循环复用必须显式记录；用户拒绝复用就暂停缺口；
- 主音乐只能出现一次；SFX 需有画面事件，不能承担第二首 BGM；
- 失败只返工对应素材/区间，不能静默跳过并交付缺镜；
- 成片路径和 QC 状态写 Canvas，不只在聊天中报文件名。

## 相关文档

- `skills/beat-sync-editor/SKILL.md`
- `knowledge/425-beat-sync-editing/beat-sync-editing.md`
- `knowledge/419-mv-master-clock/mv-master-clock.md`
- `knowledge/422-sfx-noise-limits/sfx-noise-limits.md`
