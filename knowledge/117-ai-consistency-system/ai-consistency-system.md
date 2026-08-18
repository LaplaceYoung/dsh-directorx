---
type: Reference
title: "AI 一致性全体系（AI Consistency System — Character / Scene / Product / Style）"
description: "AI 生成一致性的完整方法体系：四类一致性（角色/场景/产品/风格）× 五级方法（参考锚定/参考图集/风格参考/微调 LoRA/首末帧锁定）"
tags:
  - "production"
  - "character"
  - "style"
  - "continuity"
status: stable
stale_after: "2027-08-18"
generated:
  by: "process:directorx-knowledge-okf"
  at: "2026-08-18T00:00:00Z"
verified:
  - by: "process:knowledge-audit"
    at: "2026-08-18T00:00:00Z"
sources:
  - resource: "cited:LTX How to Maintain Character Consistency in AI Video"
    id: cite-1
    title: "How to Maintain Character Consistency in AI Video"
    author: "org:LTX"
  - resource: "cited:Kittl AI Video Character Consistency Workflow 2026"
    id: cite-2
    title: "AI Video Character Consistency Workflow 2026"
    author: "org:Kittl"
  - resource: "cited:AIVid Master Consistent Character AI Video Workflows"
    id: cite-3
    title: "Master Consistent Character AI Video Workflows"
    author: "org:AIVid"
  - resource: "cited:ImgVeo Cross-Model Guide 2026"
    id: cite-4
    title: "Cross-Model Guide 2026"
    author: "org:ImgVeo"
  - resource: "cited:MagicHour Keep Characters Consistent in AI Video"
    id: cite-5
    title: "Keep Characters Consistent in AI Video"
    author: "org:MagicHour"
  - resource: "https://ltx.io/blog/how-to-maintain-character-consistency-in-ai-video"
    id: url-1
    title: "ltx.io"
  - resource: "https://www.kittl.com/blogs/ai-video-character-consistency-workflow/"
    id: url-2
    title: "kittl.com"
  - resource: "https://aivid.video/blog/how-to-achieve-character-consistency-in-ai-videos"
    id: url-3
    title: "aivid.video"
  - resource: "https://imgveo.com/blog/ai-video-character-consistency"
    id: url-4
    title: "imgveo.com"
  - resource: "https://magichour.ai/blog/how-to-keep-characters-consistent-in-ai-video"
    id: url-5
    title: "magichour.ai"
dx_id: "117"
related:
  - "39-image-consistency/character-consistency.md"
  - "108-moodboard-reference/moodboard-reference.md"
  - "113-mvp-case-playbook/mvp-case-playbook.md"
  - "123-longform-consistency/longform-consistency.md"
---

# AI 一致性全体系（AI Consistency System — Character / Scene / Product / Style）

> 本页为 AI 生成一致性的完整方法体系：四类一致性（角色/场景/产品/风格）× 五级方法（参考锚定/参考图集/风格参考/微调 LoRA/首末帧锁定）。知识本体来自 2026 一致性工作流指南（LTX/Kittl/AIVid/ImgVeo/MagicHour）。AI 应用面向 DirectorX：跨镜一致性决策矩阵（衔接 39/108/113 案例手册、123 长视频一致性）。
> 来源：LTX「How to Maintain Character Consistency in AI Video」、Kittl「AI Video Character Consistency Workflow 2026」、AIVid「Master Consistent Character AI Video Workflows」、ImgVeo「Cross-Model Guide 2026」、MagicHour「Keep Characters Consistent in AI Video」。

## 概述

**核心断言**：一致性不是"一个技巧"，而是**方法阶梯**——从零训练的参考锚定到高保真的 LoRA 微调，按项目时长与保真需求选级。**角色漂移（Character Drift）的根本原因是模型没有"这个人"的稳定记忆**：要么靠参考图每镜喂，要么把身份训练进模型。

## 核心概念

### 四类一致性（需分别管理）

1. **角色一致性（Character）**：脸/身体/服装/气质跨镜不变
2. **场景一致性（Scene）**：空间布局/道具/光照跨镜不变
3. **产品一致性（Product）**：几何/材质/logo/比例不变（电商关键）
4. **风格一致性（Style）**：画风/调色/质感全片统一

### 五级方法阶梯（按保真度递增）

| 级别 | 方法 | 适用 | 成本 |
|---|---|---|---|
| 1 | 参考锚定（Reference Anchor） | 短片段、单镜 | 低 |
| 2 | 参考图集（Reference Set） | 多镜短片 | 中 |
| 3 | 风格参考（Style Reference） | 风格统一 | 中 |
| 4 | 首末帧锁定（Frame Lock） | 运动控制 | 中 |
| 5 | 微调（LoRA/DreamBooth） | 长片/系列/高保真 | 高 |

## 技巧与示例

### 参考图集制作（AIVid 标准）

- **15-30 张高质量图**锁定身份（LTX 用 8-30 张）
- **必须覆盖**：正面/侧面/3/4 视图 + 不同光照 + 关键表情
- 触发词（Trigger）：训练 LoRA 时固定唯一触发词，生成时用该词激活

### Lock-Then-Animate 工作流（ImgVeo）

```text
① 锁定（Lock）：先定角色标准像/场景标准图/风格参考
② 生成（Animate）：每镜从锁定参考出发，短片段生成
③ 校验（Verify）：每镜对照参考审查漂移
④ 重试（Retry）：漂移镜用"参考 + 更短片段 + 更强约束"重试
```

### 短片段纪律

**批次切短**：长镜头/长片段漂移累积——按场景切短片段（5-10s）生成，减少跨时间漂移；跨镜用首末帧/参考图衔接。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 只有一张参考图 | 视角一变就漂移 | 15-30 张多视图参考集 |
| 不做风格参考 | 画风全片乱 | 锁风格参考 |
| 长片段一次生成 | 漂移累积 | 短片段分批 |
| 漂移后继续生成 | 越漂越远 | 停下 → 参考 + 更强约束重试 |
| 需要高保真却只做参考锚定 | 长片必然漂 | 上 LoRA 微调 |

## 工作流应用（AI 映射）

一致性决策矩阵（案例 1/4/5 的统一依据）：

```text
项目类型判定（单镜/短片/长片/系列）
  → 保真需求（参考级 or 微调级）
  → 参考体系建立（角色圣经/场景标准图/产品多视图/风格参考）
  → 生成纪律（短片段 + 参考 + 固定身份块）
  → 逐镜校验（对照参考，漂移即重试）
```

**DirectorX 纪律**：任何涉及"同一"的项目（角色/产品/场景/风格）必须先建参考体系（108），生成过程逐镜校验（111），漂移重试有固定路径（参考 + 更短片段 + 更强约束）。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 角色漂移 | Character Drift | 身份跨镜变化 |
| 参考锚定 | Reference Anchor | 每镜喂参考图 |
| 参考图集 | Reference Set | 多视图身份集 |
| 风格参考 | Style Reference | 画风/调色锚 |
| 触发词 | Trigger Word | LoRA 激活词 |
| 微调 | LoRA / DreamBooth | 身份训练进模型 |
| 短片段纪律 | Short-Clip Discipline | 批次切短防漂移 |
| 锁定后生成 | Lock-Then-Animate | 先锁参考再动 |

## 来源

- LTX — How to Maintain Character Consistency in AI Video Production：https://ltx.io/blog/how-to-maintain-character-consistency-in-ai-video
- Kittl — AI Video Character Consistency Workflow 2026：https://www.kittl.com/blogs/ai-video-character-consistency-workflow/
- AIVid — Master Consistent Character AI Video Workflows (2026)：https://aivid.video/blog/how-to-achieve-character-consistency-in-ai-videos
- ImgVeo — AI Video Character Consistency: A Cross-Model Guide 2026：https://imgveo.com/blog/ai-video-character-consistency
- MagicHour — How to Keep Characters Consistent in AI Video (2026)：https://magichour.ai/blog/how-to-keep-characters-consistent-in-ai-video

## 相关概念

- [图片一致性控制（Character & Visual Consistency）](../39-image-consistency/character-consistency.md)
- [情绪板与参考体系（Mood Board & Reference System — Art Direction Terms & Practice）](../108-moodboard-reference/moodboard-reference.md)
- [Video Agent MVP 案例手册：11 个测试案例的 AI 优化打法（MVP Case Playbook — Making AI Better on Real Cases）](../113-mvp-case-playbook/mvp-case-playbook.md)
- [AI 长视频与多镜叙事一致性（Long-Form AI Video — Multi-Shot Narrative Consistency）](../123-longform-consistency/longform-consistency.md)
