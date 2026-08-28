---
name: directorx-audio-workflow
description: 管理 MV 与视频项目的音频就绪、主音乐、口型代理、SFX、降噪、响度和最终混音；用户要求配乐、音效、去噪、音画同步或声音交付时使用。
user-invocable: true
whenToUse: 任务涉及音频来源确认、分离/清理、音乐主时钟、SFX 与环境声限制、代理音轨替换、响度校验或平台音频交付时加载。
---

# DirectorX Audio Workflow：主音乐、SFX 与降噪边界

## Purpose

将源音频工作流语义纳入现有 DirectorX provider、outputDir、Canvas 和 StudioShell。它不创建第二套音频 agent loop 或存储；每个音频产物都通过现有 runtime path 和 `directorx_*` 工具可追踪。

Source mapping：

- `hub_audio_meta` → `directorx_probe_media`；
- `hub_audio_separate` → 配置好的 audio provider separation 能力，产物落现有 outputDir；
- `hub_audio_analyze_music` → `directorx_audio_beat` 或 provider audio index（仅当实际能力返回测量数据）；
- `hub_audio_transcribe_lyrics` / `hub_media_transcribe` → `directorx_transcribe_audio`，输出先作 plain timed text；
- `hub_ffmpeg` → `directorx_audio_subclip_batch`、`directorx_video_process`、`directorx_audio_mix`、`directorx_timeline`；
- `hub_subtitle_format` → `directorx_subtitle_format`（provider-backed when available），再用 `directorx_video_subtitle`/timeline burn；
- `hub_canvas_write_node` → 现有 `directorx_canvas_add` / `directorx_canvas_update`。

## Input

可提供一首主音乐、伴奏/人声 stem、对白/旁白、SFX/ambience、参考音频、视频素材和目标平台。输入可以不完整；先读取媒体真实元信息，再问角色/用途，不根据文件名猜。示例：`把这段旁白降噪后压到 20 秒，音乐低于人声，保留三处脚步 SFX，最后按 YouTube 音频交付。`

## Key Concepts

### 音轨角色是硬约束

- `main_music`：MV 的唯一时间权威；最终从 00:00 连续进入时间线。
- `dialogue/voiceover`：叙事或信息优先，可触发 sidechain ducking；角色 voice anchor 不是最终对白。
- `lip_sync_proxy`：只为视频模型同步口型/节奏；Post 必须丢弃，不能交付。
- `source_audio`：素材现场声，只有用户/计划明确保留才混入。
- `sfx`：短事件层（脚步、whoosh、impact、room tone）；不承担歌曲结构。
- `ambience`：连续环境底，必须声明空间和时段；不能覆盖对白或主音乐。

任何音轨进入 timeline 都要有 `role`, `source_path`, `start/end`, `gain`, `duck_under`, `keep_in_final`。同一歌曲不能作为主音乐和片段 BGM 重复叠加。

### SFX / 降噪限制

- SFX 只在画面事件、节拍或转场有可见触发时使用；没有触发点不凭空堆音效。
- 不把 SFX 当作“更电影感”的无限层；每段最多一个主冲击和必要的次级纹理，避免 masking。
- 降噪是保真修复，不是把房间声抹成数字静音。先保留原始文件，生成新路径；只抑制稳定底噪、风噪或电流噪，不能吞掉辅音、呼吸和关键现场声。
- 处理顺序：probe → noise profile/频谱证据 → 温和降噪 → EQ/高通（仅有依据）→ limiter/响度 → 试听；若噪声与人声频段重叠，报告残留而不是过度处理。
- 任何“去人声/分离”结果必须试听并标记 bleed/artifact；不可把模型分离当无损 stem。

### 音画同步

- 旁白/对白：用 `directorx_audio_sync` 或转写时间窗作为切点证据；字幕不是音频时间轴的替代。
- MV：用最终主音乐时间轴和真实 beat/section 证据；生成段的代理音轨只作参考。
- 混音时先建立对白/主唱可懂度，再将音乐 duck；SFX 峰值不能削波。最后用 `directorx_probe_media` 和试听验证。

## Application

1. **Probe and classify**：对每个输入 `directorx_probe_media`；建立音频清单 `{id, role, path, duration, channels, sample_rate}`。多音频用途不明时一次询问，不让参考轨进入最终主音乐。
2. **Prepare**：需要分离/清理时调用现有 provider；需要裁切用 `directorx_audio_subclip_batch`；输出新文件名并保留源路径。短 voice reference 作为角色属性，通常裁到不超过 3 秒；不把完整对白当 voice anchor。
3. **Music authority**：确认 `main_music`，必要时用 `directorx_audio_beat`；记录 measured/unmeasured。MV 最终 `main_song` 整数时长和使用范围在 stage detail 中固定，下游不重算。
4. **Design SFX**：按画面时间写 SFX cue（事件、起止、声音材质、gain、是否 duck）；没有实际文件可由现有 `directorx_generate_audio` 生成短音效，但必须走正常 craft/ready/generate gate，不写伪路径。
5. **Mix**：用 `directorx_audio_mix` 或 `directorx_timeline`，明确 duckUnder、音量、是否保留原声；视频片段原 BGM 默认静音。混音后检查 peak/LUFS 和对白可懂度。
6. **Subtitle handoff**：仅用户/计划 opt-in 字幕；可信 timed text 优先，否则 `directorx_transcribe_audio` 得 plain SRT，再格式化 ASS，使用绝对路径 burn。遵守 `knowledge/420-ass-safe-area`。
7. **Deliver**：保留 master 与平台版本，真实路径写 Canvas；记录源、处理链、mix policy、QC 结果和回退源。

### Audio plan schema

```yaml
audio_plan:
  tracks:
    - { id: main_music, role: main_music, path: "/absolute/song.wav", start_sec: 0, end_sec: 40, gain_db: 0, keep_in_final: true }
    - { id: voice_01, role: dialogue, path: "/absolute/voice.wav", start_sec: 0, end_sec: 12, gain_db: -2, duck_under: main_music }
    - { id: sfx_impact_01, role: sfx, path: "/absolute/impact.wav", start_sec: 8.2, end_sec: 8.8, gain_db: -8, keep_in_final: true }
  proxy_policy: { lip_sync_proxy: discard_after_generation, clip_music: discard_after_generation }
  qc: { source_probed: true, noise_treatment_evidence: "stable_floor", clipping_free: true, final_loudness_checked: true }
```

### Acceptance

- 每条音轨角色、来源、时间和最终保留策略明确；主音乐唯一且连续。
- 降噪前后路径分离，试听证据记录，未过度抹除人声/现场声；分离 bleed 标记。
- SFX 与可见事件绑定，不替代音乐，不无依据堆叠；mix 无 clipping，对白可懂。
- 代理音轨和中间 SRT/ASS 不进入 Canvas，除非用户请求文件导出；最终媒体 node 可追踪。
- 所有执行映射为 `directorx_*`，没有 source `hub_*` 调用或第二套存储/loop。

## Examples

- **MV 口型**：每组用等长 `audio 1` 作为代理，生成后删除代理并从 00:00 加完整 main music；SFX 只保留舞步/转场触发。
- **口播+音乐**：旁白先锁可懂度，音乐 sidechain duck；无旁白时不写 duckUnder，现场声按计划决定。
- **有风噪的采访**：先 probe 与试听，温和抑制稳定低频/风噪，保留呼吸和环境；若不可分离，交付残留风险而非过度降噪。

## Common Pitfalls

- 将生成视频自带音乐和最终主音乐同时保留。
- 为“更有冲击力”给每个切点堆 whoosh/impact，掩盖节拍与对白。
- 过度降噪导致齿音、呼吸、房间定位消失。
- 把 plain ASR SRT 直接 burn，跳过 ASS 格式化和安全区。
- 只看峰值不看集成响度、真峰值和削波。
- 在文档里调用 `hub_*`、写 shell 命令或创建第二个音频工作循环。

## References

- `knowledge/422-sfx-noise-limits/sfx-noise-limits.md`
- `knowledge/420-ass-safe-area/ass-safe-area.md`
- `knowledge/419-mv-master-clock/mv-master-clock.md`
- `knowledge/423-jianying-delivery/jianying-delivery.md`
