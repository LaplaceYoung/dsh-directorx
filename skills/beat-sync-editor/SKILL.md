---
name: beat-sync-editor
description: 按真实音乐节拍把图片、视频或混合素材编排成卡点成片；用户说音乐卡点、beat sync、节奏剪辑或按鼓点换镜时使用。
user-invocable: true
whenToUse: 当任务要求以一首已存在或已确认的音乐作为时间轴，自动分析切点、分配素材、确定性裁剪拼接并交付可复核成片时加载。
---

# Beat-Sync Editor：音乐主时钟的确定性混剪

## Purpose

把一组图片、视频片段或混合素材装配到一条真实音乐上。音乐的可观测时间点是唯一时钟；本技能只负责规划与确定性后期，不复制另一套代理循环、RPC、文件存储或主题系统。DSH 负责问询、确认、执行和阶段账本，DirectorX 工具负责媒体操作。

旧设计能力映射为目标 seam：

| 旧能力 | DirectorX 目标映射 | 约束 |
|---|---|---|
| 音频元信息 | `directorx_probe_media` | 只接受真实 duration/streams，不从文件名猜 BPM |
| 节拍/能量分析 | `directorx_audio_beat`，必要时接入 provider audio index | 以返回的时间戳/强度为证据；没有测量就标记未测量 |
| 音频裁切/拼接 | `directorx_audio_subclip_batch` 或 `directorx_video_process` | 使用绝对路径，源文件不覆盖 |
| 素材规格化 | `directorx_video_process` | 统一画幅、帧率、像素格式和静音策略 |
| 拼接 | `directorx_video_concat` 或 `directorx_timeline` | 时间线不留 gap/overlap |
| BGM/SFX 混音 | `directorx_audio_mix` | 明确主音乐、SFX、原片声的层级，禁止双音乐 |
| 预览/交付 | `directorx_canvas_update` / `directorx_canvas_add` | 真实输出路径写回 Canvas；不写 generating 假节点 |

## Input

用户可以带来：主音乐路径或已确认 Canvas 音频节点、图片/视频素材列表、目标时长、输出画幅、节拍模式（`beat`、`onset`、`segment`）、每 N 拍切换、手动切点、是否循环素材，以及是否保留素材原声。输入可以不完整；缺少阻塞信息时只问最小问题，不重复已经给出的值。

示例：`把这 12 张照片和两个旅行片段按这首歌每两拍换一次，做 9:16 30 秒卡点视频。`

必得字段：

- `music`: 一个可读且角色明确的主音乐；多个音频先标记主音乐/参考/伴奏/人声 stem，最终只能有一个主音乐。
- `materials`: 每项有真实 path 或 Canvas media node；图片、视频可以混用。
- `target`: `duration_sec`（若截取）、`aspect_ratio`、`width/height` 或平台预设。
- `cut_policy`: `mode`、`every_n_beats`、`manual_cuts`、最小切点间隔。

## Key Concepts

### 1. 音乐先于素材

1. 用 `directorx_probe_media` 读取时长、采样率、声道和容器。
2. 用 `directorx_audio_beat` 获取实际可用切点；若工具只能返回峰值而不能给可靠 BPM，就不生成虚假的 BPM 字段，使用 `beat_times` 和 `strength`。
3. 长音乐需要短片时，先选择目标窗口；窗口选择基于能量/段落证据或用户指定，不用模糊“最燃”替代时间范围。裁切后再生成相对最终片段的切点，避免偏移错误。
4. 用户确认切点方案后，后续所有素材分配、裁剪和拼接都消费同一个时间轴快照。

### 2. 切点与节奏

- `beat`：每个有效 beat 作为候选切点；`every_n_beats=2` 表示每两个 beat 取一个。
- `onset`：打击乐密集或需要更敏感的音头时使用；必须设置最小间隔，避免不可生成的闪切。
- `segment`：用返回的段落/峰值分布建立 intro、verse、chorus、bridge、outro 的不同密度；没有段落标签时只按时间和强度工作。
- `manual_cuts` 是硬切点，优先级高于 every-N，但仍需验证落在音频范围且不造成低于最小片段时长。
- 切点必须单调递增，首点从 0 或明确音乐入口开始，尾点不超过最终音乐 duration。

### 3. 素材分配

将相邻切点组成 `{start, end, duration, beat_index, strength, section}`。素材数不少于段数时按用户顺序使用；不足时按 `index % material_count` 循环复用并在计划中显式标记。用户拒绝复用时，先留下缺口并让现有生成/资产路径补素材，不偷偷丢镜头。

图片转静态片段；视频按区间裁剪，过短片段只能按用户允许的 loop/pad 策略补齐；尺寸不匹配使用 scale+pad，不拉伸主体。每个片段完成后检查时长，不能把最后一帧或黑帧当作音乐补偿。

### 4. 声音边界

卡点视频默认只保留主音乐，素材原声静音。若用户明确保留现场声，先把它登记为 `source_audio`，按事件和音量混入；不要让原声与主音乐无说明叠加。SFX 是可选层，不是第二首 BGM；见 `knowledge/422-sfx-noise-limits`。

### 5. 确认与可回滚

先返回 dry-run 计划（音乐窗口、切点摘要、素材分配、复用数、预计时长），再用 `directorx_confirm` 或用户明确同意进入确定性处理。更换一项素材只重做该片段；调整 every-N 回到切点规划；更换音乐从音乐校验重新开始。所有输出写 Canvas/阶段账本，避免只在聊天里报路径。

## Application

### 阶段流程

1. **输入与证据**：`directorx_probe_media` 音乐和素材；确认主音乐、目标画幅、时长和音轨策略。
2. **窗口规划**：若需要截取，依据真实峰值/用户时间范围选择 `[start,end]`；用 `directorx_audio_subclip_batch` 或确定性音频处理生成工作音乐。
3. **切点分析**：`directorx_audio_beat`；按模式、every-N、手动点和最小间隔生成时间轴。输出前 5 个切点和总计，不省略异常。
4. **素材预处理**：逐项 `directorx_video_process`，图片先转静态视频；统一分辨率、fps、编码和静音；记录失败项而不是继续制造缺口。
5. **预览门**：素材超过 20 项或用户要求预览时展示完整表；用户可换素材、改节奏或删除切点，切点分析无需重复。
6. **拼接与混音**：按顺序 `directorx_video_concat` 或 `directorx_timeline`；用 `directorx_audio_mix` 只加入确认的主音乐和 SFX/现场声。默认 hard cut；转场只有计划中明确登记才执行。
7. **验收与交付**：`directorx_probe_media` 检查最终 duration/分辨率/音频流；逐项核对切点、无黑屏、无重叠、音轨唯一、复用标记；用 `directorx_canvas_update` 把真实文件写回对应成片节点。

### 时间轴输出契约

```yaml
beat_sync_plan:
  music: { path: "/absolute/main.mp3", duration_sec: 30 }
  target: { duration_sec: 30, aspect_ratio: "9:16", fps: 30 }
  cut_policy: { mode: beat, every_n_beats: 2, min_gap_sec: 0.25, manual_cuts: [] }
  segments:
    - { index: 0, start_sec: 0, end_sec: 1.02, material: "/absolute/a.jpg", reused: false }
  audio: { main_music: true, source_audio: false, sfx: [] }
  checks: { timeline_contiguous: true, duration_delta_sec: 0, user_confirmed: false }
```

这是供现有 DirectorX 工具和 Canvas 使用的计划数据，不是第二套存储协议。真正执行仍走现有工具和输出目录 helper。

### Acceptance

- 每个切点来自真实音乐证据或用户手动指定，并记录来源。
- `segments` 连续覆盖最终音乐，`sum(duration)` 与主音乐差值不超过 0.05 秒（工具量化误差可解释）。
- 所有片段规格一致，素材原声策略明确，主音乐不重复叠加。
- 任何失败能定位到单项并可局部重做；成片路径和 Canvas node 可追踪。
- 只使用 `directorx_*`；不在 skill 中执行 shell、调用 `hub_*`、写第二个 agent loop 或复制源项目存储。

## Examples

### 照片卡点

输入 8 张照片、20 秒音乐、`every_n_beats=2`、9:16。探测音乐，生成 10 个切点，前两张照片循环复用并标记；把照片转为静态视频后按切点拼接，静音静态片段，混入原音乐，验收 20 秒连续时间线。

### 素材不足

输入 3 个片段但规划有 12 段。默认循环并在计划中显示“复用 4 次”；若用户拒绝，暂停在素材缺口，不偷偷调用生成。用户批准补素材后，只预处理新增片段并重算受影响区间。

## Common Pitfalls

- 用文件名、音乐类型或主观感觉填 BPM；没有返回值就不要编造。
- 对原音频先全曲分析、再任意裁切，导致切点整体偏移。
- 每拍切但片段短于生成/编码可靠下限；提高 every-N 或 min-gap。
- 保留素材原声又混入主音乐，造成双音轨和削波。
- 用交叉淡化掩盖本应 on-beat 的硬切，出现重影或节拍拖后。
- 只返回 `beat_sync_output.mp4` 路径，不写 Canvas、不记录复用和检查结果。

## References

- `knowledge/425-beat-sync-editing/beat-sync-editing.md`
- `knowledge/419-mv-master-clock/mv-master-clock.md`
- `knowledge/422-sfx-noise-limits/sfx-noise-limits.md`
- `recipes/beat-sync.md`
- `workflows/directorx-beat-sync.js`
