---
type: Reference
title: "电影运动语言五支柱（Cinematic Motion Language）"
description: "将相机契约、运动物理、空间分区、镜头对焦序列和负空间编译为可执行视频 prompt 与验收规则"
tags:
  - "craft"
  - "camera"
  - "prompt"
status: stable
stale_after: "2028-08-25"
generated:
  by: "process:directorx-dx-design-migration"
  at: "2026-08-25T00:00:00Z"
verified:
  - by: "process:directorx-dx-design-migration"
    at: "2026-08-25T00:00:00Z"
sources:
  - resource: "internal:dx-design/market-skills/extracted/cinematic-motion-language-0.3.1/SKILL.md"
    id: source-cinematic-motion
    title: "Cinematic Motion Language skill"
  - resource: "internal:dx-design/opencode-config/knowledge/workflows/general/reference/video-generation-strategy.md"
    id: source-video-generation
    title: "Video generation strategy"
dx_id: "424"
related:
  - "40-storyboard-generation/storyboard-generation.md"
  - "53-shotlist-to-prompt/shotlist-to-prompt.md"
  - "73-ai-prompt-quickref/ai-prompt-quickref.md"
---

# 电影运动语言五支柱（Cinematic Motion Language）

## 五支柱合同

### 1. 相机契约

相机规则先于主体，且一镜只允许一个主运动：`static locked-off`, `slow push-in`, `lateral track`, `single crane`, 或明确的 handheld。把“电影感”替换成速度/距离/时间，例如 `slow push-in, 10% scale change over 8 s`。同时写禁令：没有声明的 pan、zoom、orbit、摇晃或自动重构均禁止。

### 2. 运动物理锚点

主体和次级运动使用可观察物理类比并量化方向/时间：`like dust suspended in honey; drifts left-to-right for 6 s`、`one full arc across 10 s`。写起点、加速度/停顿、终点和是否循环；孤立 `slow`, `fast`, `gentle`, `cinematic` 不构成锚点。

### 3. 空间分区

用 thirds 与景深层指定主体、光、粒子和背景活动：left/center/right third、foreground/midground/background、upper/lower half。每区至少有允许项与禁止项；负空间是保留的构图重量，不能让模型自动填满。

### 4. 镜头/对焦行为序列

景深和 rack focus 写成因果状态机：`trigger → shift → state → return → repeat`。例如前景粒子穿越镜头平面触发焦点，手部进入温暖 bokeh，随后回到主体，重复两次。没有触发器和回归就不能声称“focus pull”。

### 5. 负空间

把空区的占位和用途写进正向/负向 prompt：`left third remains clean black; no light, particles, text or subject enters`。标明何时下一状态可接管该区域；安全区/字幕/Logo 也属于空间合同。

## DirectorX prompt 映射

| 旧字段/能力 | 目标使用 |
|---|---|
| camera / negative prompt | `directorx_prompt_craft` 输出正向与独立 negative 字段 |
| reference frame/image | `directorx_generate_ready` 的 refs 与角色 slot |
| read media/frame | `directorx_probe_media`、`directorx_extract_frames`、`directorx_view_image` |
| generate | `directorx_generate_ready` → `directorx_propose` / `directorx_generate_video` |
| save session | outputDir/project path helper + Canvas update |
| user question | `directorx_ask` |

## Prompt 骨架

```text
CAMERA: [one main motion, distance/speed/time; forbidden extras]
DURATION: [integer seconds]
ASPECT RATIO: [confirmed]
SUBJECT/ACTION: [observable action and end state]
MOTION PHYSICS: [analogy, direction, velocity/acceleration, duration]
LENS/FOCUS: [focal feel; trigger → shift → state → return]
LIGHTING: [source, direction, color, texture]
SPATIAL ZONES: [allowed/forbidden per region]
NEGATIVE PROMPT: [drift, extra motion, region breach, anatomy/style violations]
AUDIO: [dialogue/SFX/ambient or explicit silence]
```

## 应用与验收

1. 读取已确认 brief、参考角色/场景和画幅/时长；参考视频先 probe/extract/view，不凭文件名猜运动。
2. 锁定相机契约，填五支柱；任何无时间/区域/触发条件的形容词退回改写。
3. 通过 `directorx_prompt_plan` 和 `directorx_prompt_craft` 生成 prompt；把风格 anchor、连续性 `start_state/end_state` 和 refs 角色绑定。
4. `directorx_generate_ready` 通过后才允许生成；付费/协同路径再走 `directorx_propose` + `directorx_confirm`。
5. 生成后 probe/extract/view 验收相机运动方向、速度、空间边界、焦点状态和负空间；失败按单镜头修复，不开启第二循环。

退出门：相机一个主运动且禁令明确；每个运动可量化；每个区域有边界；对焦有因果序列；负空间在正负字段均保护；craftId/readyId/真实输出路径可追踪。

## 反模式

- 同时要求 push、orbit、zoom、handheld；
- 以“电影感/慢慢/高级”替代物理量；
- 只在正向 prompt 写空区，负向字段遗漏；
- 将普通参考图当 first/last frame；
- 生成后只看最后一帧，不验证运动过程。

## 相关概念

- [分镜图生成工作流（Storyboard-to-Video Pipeline）](../40-storyboard-generation/storyboard-generation.md)
- [镜头表→提示词转换器（Shot List → Prompt Translation）](../53-shotlist-to-prompt/shotlist-to-prompt.md)
- [AI 视频模型提示词总表（Prompt Format Quick Reference）](../73-ai-prompt-quickref/ai-prompt-quickref.md)
