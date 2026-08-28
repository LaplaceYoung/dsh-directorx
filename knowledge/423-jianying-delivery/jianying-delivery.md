---
type: Reference
title: "剪映草稿与平台交付包（Jianying Draft & Platform Delivery）"
description: "把 DirectorX master 转为可复核的平台版本与剪映草稿：媒体引用、字幕/音轨层、画幅安全区、时间线连续性和失败回退"
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
  - resource: "internal:dx-design/agent-profiles/v2/workflows/_shared/video-merge.md"
    id: source-video-merge
    title: "Video merge and delivery"
  - resource: "internal:dx-design/opencode-config/knowledge/workflows/koc/reference/output-spec.md"
    id: source-output-spec
    title: "Platform and subtitle output specification"
dx_id: "423"
related:
  - "195-brand-visual-asset/brand-visual-asset.md"
  - "420-ass-safe-area/ass-safe-area.md"
  - "02-editing-transitions/editing-transitions.md"
---

# 剪映草稿与平台交付包（Jianying Draft & Platform Delivery）

## 目标

交付不是只导出一个 MP4。每个项目至少保留可回退的 master、平台压制版本、字幕/ASS 源（若启用）、音轨角色与 QC 记录；需要用户继续剪辑时，再生成可打开的 Jianying/CapCut draft。草稿只引用真实输出路径和素材，不复制另一套存储或 agent loop。

DirectorX 映射：

- timeline / merge → `directorx_timeline`、`directorx_video_concat`、`directorx_audio_mix`；
- probe → `directorx_probe_media`；
- subtitle → `directorx_subtitle_format`、`directorx_video_subtitle`；
- draft export → provider-backed `directorx_jianying_export`（若当前 registry 尚未启用，明确报告 capability unavailable，不伪造草稿）；
- path/Canvas → 既有 outputDir/project path helper、`directorx_canvas_update`；
- user gate → `directorx_confirm`。

## Delivery matrix

| 包 | 用途 | 必须含 | 不能含 |
|---|---|---|---|
| `master` | 归档/后续重制 | 原生确认分辨率/fps、完整主音乐、最高可用质量、QC | 代理音频、临时字幕 burn（除非 master 就是用户要求） |
| `social` | 已确认平台发布 | 平台画幅/编码、safe-area、目标响度、burn/soft 字幕策略 | 越界字幕、重复 BGM、黑帧补时 |
| `jianying` | 剪映继续编辑 | 草稿 JSON/项目包、每轨真实媒体引用、时间线和字幕/音频层 | 断开的绝对路径、虚构素材、不可读代理 |
| `captions` | 字幕单独交换 | `.srt`/`.ass`、字体清单、safe-area 数据 | 未确认的 ASR 专名或越界坐标 |

包名必须包含稳定 project/variant id 和版本；文件写入 outputDir，不覆盖源 master。平台未指定时可交付 master + 一个经用户确认的通用 social 版本，标平台假设。

## Jianying draft contract

`directorx_jianying_export` 的输入/输出应遵守现有 provider contract（由 Main 的 registry/adapter 实现）：

```yaml
jianying_export:
  project_id: mv_project_01
  timeline_path: /absolute/mv_timeline.json
  output_dir: /absolute/output
  media:
    - { id: shot_01, path: /absolute/shot_01.mp4, start_sec: 0, duration_sec: 6 }
  audio:
    - { id: main_music, role: main_music, path: /absolute/song.wav, start_sec: 0, volume: 1 }
  subtitles:
    - { path: /absolute/captions.ass, burn: false, safe_area_ref: ass_safe_area_01 }
  result: { draft_path: /absolute/output/mv_project_01.draft, manifest_path: /absolute/output/mv_project_01.manifest.json }
```

导出前必须校验：每个媒体 path 可读、duration 与 timeline 匹配、时间线从 0 连续、track id 唯一、音频角色已声明、字幕文件和字体可加载、引用路径在目标机器可访问。草稿不能只存聊天里的路径字符串；manifest 记录生成时间、版本、源 master hash/size、平台假设和已知限制。若 provider 返回 partial/failure，保留错误清单，不生成假 `.draft`。

### 绝对路径与可移植性

若 Jianying 要求本机绝对路径，导出 manifest 同时记录 source path、relative project path（能计算时）和缺失文件列表。不要把用户 home、密钥、临时缓存或不属于项目的路径写入草稿。跨机器打开前，用户需重新链接缺失素材；草稿状态应是 `portable`, `relink_required` 或 `failed`，不能统称 ready。

### 字幕与安全区

Jianying 交付可选择字幕轨（可编辑）或视频内 burn。若保留可编辑 ASS/SRT，随包提供字体清单和 `knowledge/420-ass-safe-area` 的 safe-area 数据；若 burn，先 probe 渲染结果，不能再宣称可编辑。平台 UI exclusion、动态大字和 Logo 位置必须在 social 版本重新检查，不能沿用 master 的固定像素边距。

## Application

1. **Freeze master**：确认 `mv_final`/timeline，probe duration、画幅、fps、音频流，计算 hash/size（若现有 manifest 支持）。
2. **Choose variants**：按用户平台选择 master、social、captions、jianying；记录目标分辨率、fps、编码、音频策略和 safe-area。
3. **Assemble**：必要时用 `directorx_video_process` 做画幅/编码转版，用 `directorx_video_subtitle` 做 burn/soft，用 `directorx_audio_mix` 保持音轨角色；不改 master。
4. **QC**：probe 所有变体；抽查首/中/末帧，检查字幕安全区、黑帧、音轨数量、duration、音画同步、无削波；Jianying manifest 逐路径校验。
5. **Export draft**：用户确认后调用 `directorx_jianying_export`；检查 draft/manifest 文件真实存在且可解析，输出每项媒体引用状态。
6. **Publish Canvas**：`directorx_canvas_update` 写回每个 variant 的真实 path、状态和限制；将失败 variant 标 `failed`，不覆盖已通过 master。
7. **Handoff**：返回目录树式清单（路径、用途、规格、QC、可编辑性、重链需求），不是只报一个链接。

## Acceptance

- master 不被平台转码覆盖；每个 variant path、规格、音轨、字幕策略和 QC 可追踪。
- Jianying 草稿只有真实可读引用，manifest 可解析，缺失素材和 relink 状态明确。
- ASS/SRT 与 safe-area/字体清单随可编辑字幕包交付；burn 版本经真实 probe/抽帧。
- 主音乐唯一且连续，代理音轨移除；平台 UI exclusion 和字幕不越界。
- provider 不可用时报告 capability unavailable，不伪造 draft/manifest ready；所有 API 名称为 `directorx_*`。

## 反模式

- 只导出 MP4，丢失 master、字幕源、音轨角色和可回退路径。
- 以 `.draft` 空文件或聊天 JSON 冒充可打开剪映项目。
- 把临时绝对路径、密钥或缓存写入跨机草稿。
- 平台未确认却声称 safe-area/响度通过。
- 为修复社媒版本覆盖 master，导致不可逆质量损失。

## 相关概念

- [AI 视频品牌视觉资产体系（Brand Visual Asset — Brand Kit as Machine-Readable Tokens）](../195-brand-visual-asset/brand-visual-asset.md)
- [ASS 字幕安全区与渲染合同（ASS Safe-Area Contract）](../420-ass-safe-area/ass-safe-area.md)
- [剪辑与转场（Editing & Transitions）](../02-editing-transitions/editing-transitions.md)
