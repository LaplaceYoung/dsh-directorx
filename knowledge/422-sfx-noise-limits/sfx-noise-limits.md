---
type: Reference
title: "SFX 使用边界、降噪保真与混音限制（SFX & Noise Limits）"
description: "规定 SFX/环境声何时可用、降噪证据与保真边界、代理音轨清理、对白 ducking、响度和削波验收"
tags:
  - "craft"
status: stable
stale_after: "2028-08-25"
generated:
  by: "process:directorx-dx-design-migration"
  at: "2026-08-25T00:00:00Z"
verified:
  - by: "process:directorx-dx-design-migration"
    at: "2026-08-25T00:00:00Z"
sources:
  - resource: "internal:dx-design/agent-profiles/v2/workflows/mv/reference/music.md"
    id: source-mv-music
    title: "MV main song and audio policy"
  - resource: "internal:dx-design/agent-profiles/v2/workflows/_shared/asset-pipeline.md"
    id: source-asset-pipeline
    title: "Asset and post audio constraints"
dx_id: "422"
---

# SFX 使用边界、降噪保真与混音限制（SFX & Noise Limits）

## 音轨角色

DirectorX 的最终音频至少区分：`main_music`、`dialogue/voiceover`、`source_audio`、`sfx`、`ambience`、`lip_sync_proxy`。每条 track 记录 `source_path`, `start/end`, `gain`, `duck_under`, `keep_in_final`。`main_music` 只能有一个；生成视频携带的片段 BGM 和口型代理在 Post 删除，不能与完整主音乐重复。

能力映射：

- probe：`directorx_probe_media`；
- beat：`directorx_audio_beat`；
- mix/duck：`directorx_audio_mix`；
- crop：`directorx_audio_subclip_batch`；
- deterministic video/audio assembly：`directorx_timeline`、`directorx_video_process`、`directorx_video_concat`；
- synthesis：`directorx_generate_audio`（仍需 craft/ready/approval）；
- Canvas evidence：`directorx_canvas_update`。

## SFX 何时加入

SFX 必须有画面或音乐事件锚点：脚步与落脚、门响与开门、whoosh 与明确转场、impact 与动作/标题落点、room tone 与空间连续。为每条 cue 写 `{event, start, end, material, level, duck_under}`。没有事件或用户意图时不添加“电影感”音效。

限制：

- 一段只设一个主冲击/转场层，次级纹理要有明确理由；密集 whoosh 会遮对白和主音乐。
- SFX 不得承担歌曲结构或变成第二首 BGM；连续底噪/环境声登记为 `ambience` 并标明空间/时段。
- 原片声默认静音（MV）或按计划保留（纪录/口播）；保留前先检查与音乐的频段/响度冲突。
- SFX 与音乐峰值同时发生时优先降低 SFX，不把总线推到削波。

## 降噪与分离

降噪是保真修复，不能把所有房间声变成数字真空。先保留源文件，再生成新路径。推荐证据链：

1. `directorx_probe_media` 检查采样率、声道、duration 和已有 clipping；
2. 取稳定噪声段或频谱证据，记录噪声是风、空调、电流、底噪还是瞬态；
3. 采用温和降噪，必要时做依据充分的高通/EQ；保留辅音、呼吸、空间定位；
4. 对比试听处理前后，标记残留噪声、音乐化 artifact、phase/bleed；
5. 最后才做 limiter/响度，重复 probe 检查没有 clipped samples。

如果噪声和人声频段重叠，不得通过强降噪声称“无噪”；报告残留并让用户决定。人声分离/去人声也不是无损 stem：记录 bleed、相位和缺失频段，不能将分离结果直接当主音乐证据。

## 混音与响度

使用 `directorx_audio_mix` 时为每条轨写 volume；对白/旁白可触发 music ducking，音乐没有对白时不做无理由 duck。SFX duck under `main_music` 或 `dialogue` 需显式声明。混音后检查 integrated loudness、short-term loudness、true peak/clipping 和对白可懂度；平台目标若未知，交付标准只声明测量值，不编造通过状态。

建议顺序：

1. 主音乐或对白建立基准；
2. 逐轨加入环境和 SFX，先低 gain 再试听；
3. 设 duck/automation，确保关键词和事件可听；
4. limiter 只处理真实峰值，不用压扁动态掩盖失衡；
5. 导出 master 与平台版本，保留 source/master 可回退。

## 计划与 QC

```yaml
sfx_noise_qc:
  cues:
    - { id: step_01, event: foot_lands, start_sec: 4.2, end_sec: 4.8, role: sfx, keep_in_final: true }
  denoise:
    source_path: /absolute/interview.wav
    output_path: /absolute/output/interview-denoised.wav
    evidence: stable_floor_0_8s
    treatment: gentle_noise_reduction
    residual_reported: true
  mix:
    main_music_count: 1
    proxy_tracks_removed: true
    clipping_free: false
    dialogue_intelligibility_checked: false
```

`false` 是计划初始值，只有实际试听/测量后才能改为 true。

## 退出门

- SFX 每条都有可见事件与时间 cue，数量/层级不会掩盖主内容；
- 源文件未覆盖，降噪证据、处理链、残留和 artifact 可追踪；
- 代理音轨清除，主音乐只出现一次；
- 混音无 clipping，响度/true peak 已测量，对白可懂；
- master、平台版本和回退源路径均落 Canvas/项目记录。

## 反模式

- 每次切镜都加 whoosh/impact，或以 SFX 取代旋律/节拍。
- 把强降噪、去人声模型结果当无损音频。
- 处理源文件、丢失原始声音，或不记录噪声证据。
- 只看波形峰值不测集成响度/true peak；遇削波就再压缩而不调整层级。
- 片段 BGM、代理和完整主音乐叠加。
