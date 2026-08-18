---
type: Playbook
title: "AI 分镜全链路（Previsualization Pipeline — Script → Shot List → Storyboard → Animatic）"
description: "AI 分镜全链路：剧本 → 场景拆解 → 镜头表（Shot List）→ 分镜帧（Storyboard）→ 动态分镜（Animatic 带时长/音频）→ 输出包"
tags:
  - "consistency"
  - "camera"
  - "sound"
  - "storyboard"
  - "workflow"
  - "narrative"
status: stable
stale_after: "2027-08-18"
generated:
  by: "process:directorx-knowledge-okf"
  at: "2026-08-18T00:00:00Z"
verified:
  - by: "process:knowledge-audit"
    at: "2026-08-18T00:00:00Z"
sources:
  - resource: "cited:MockFlow Best AI Storyboard Generator Tools 2026"
    id: cite-1
    title: "Best AI Storyboard Generator Tools 2026"
    author: "org:MockFlow"
  - resource: "cited:M Studio Script to Storyboard"
    id: cite-2
    title: "Script to Storyboard"
    author: "org:M-Studio"
  - resource: "cited:StorylineForge AI Pre-Visualization 2026"
    id: cite-4
    title: "AI Pre-Visualization 2026"
    author: "org:StorylineForge"
  - resource: "https://mockflow.com/blog/best-ai-storyboard-generators"
    id: url-1
    title: "mockflow.com"
  - resource: "https://mstudio.ai/features/ai-storyboard-generator"
    id: url-2
    title: "mstudio.ai"
  - resource: "https://www.storyboarder.ai/"
    id: url-3
    title: "storyboarder.ai"
  - resource: "https://storylineforge.com/blog/ai-pre-visualization-for-film-tools-and-workflows-in-2026/"
    id: url-4
    title: "storylineforge.com"
  - resource: "https://www.drawstory.ai/previs-ai"
    id: url-5
    title: "drawstory.ai"
dx_id: "172"
related:
  - "108-moodboard-reference/moodboard-reference.md"
  - "151-game-cinematics/game-cinematics.md"
  - "159-screenplay-format/screenplay-format.md"
  - "122-quality-monetization/quality-monetization.md"
  - "117-ai-consistency-system/ai-consistency-system.md"
---

# AI 分镜全链路（Previsualization Pipeline — Script → Shot List → Storyboard → Animatic）

> 本页为 AI 分镜全链路：剧本 → 场景拆解 → 镜头表（Shot List）→ 分镜帧（Storyboard）→ 动态分镜（Animatic 带时长/音频）→ 输出包。知识本体来自 2026 预可视化工具指南（MockFlow/M Studio/Storyboarder.ai/StorylineForge）。AI 应用面向 DirectorX：前期规划（衔接 108 关键帧、151 Animatic、159 剧本格式）。
> 来源：MockFlow「Best AI Storyboard Generator Tools 2026」、M Studio「Script to Storyboard」、Storyboarder.ai「Script to Storyboard」、StorylineForge「AI Pre-Visualization 2026」。

## 概述

**核心断言**：分镜全链路是**低成本试错层**——剧本先变画面（分镜）再变动态（Animatic），**在投入渲染前验证叙事/节奏/构图**（衔接 151：避免浪费的核心）。AI 让它从"数周手工"变"分钟级"：剧本 → 自动场景拆解 → 镜头提示词 → 分镜帧 → Animatic。

## 核心概念

### 全链路管线

```text
① 剧本输入（159 格式）
② 场景拆解（角色/道具/地点/机位提示）
③ 镜头表（Shot List：每镜头内容/机位/时长）
④ 分镜帧（Storyboard：每镜头画面）
⑤ Animatic（分镜 + 时长 + 音频草稿）
⑥ 输出包（分镜/镜头表/Animatic/提案）
```

### 每镜头提示词要素（M Studio）

```text
动作 + 机位 + 构图 + 镜头（焦段）+ 光线 + 情绪
```

## 技巧与示例

### 分镜生成工作流

```text
剧本（159）→ AI 场景拆解
  → 镜头表（每镜头六要素提示词）
  → 角色/风格锁定（117，防漂移）
  → 分镜帧生成（逐镜头）
  → Animatic（节奏/转场验证，158）
  → 输出包 → 进入制作（成本可控）
```

### Storyboard-First 原则

**分镜先行省渲染**：先在 2D 层面锁定构图/节奏，再进视频生成（衔接 122 成本、151 动画预演）。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 跳过镜头表 | 分镜无系统 | 先拆解后分镜 |
| 角色不锁定 | 帧间漂移 | 117 锁定 |
| 镜头提示缺要素 | 画面不符 | 六要素完整 |
| 无 Animatic | 节奏无法验证 | 动态化验证 |
| 直接渲染再返工 | 成本高 | 分镜先行 |

## 工作流应用（AI 映射）

前期规划（衔接 108/117/151/159）：

```text
剧本（159）→ 场景拆解 → 镜头表
  → 分镜帧（角色锁定 117）
  → Animatic（节奏 158）→ 输出包
  → 制作（151 动画预演衔接）
```

**DirectorX 纪律**：分镜先行省成本；镜头提示六要素；角色早锁定；Animatic 验证节奏。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 镜头表 | Shot List | 镜头清单 |
| 分镜 | Storyboard | 逐镜画面 |
| 动态分镜 | Animatic | 带时长分镜 |
| 场景拆解 | Scene Breakdown | 剧本结构化 |
| 预可视化 | Previsualization | 前期预览 |
| 输出包 | Output Pack | 规划交付物 |

## 来源

- MockFlow — 6 Best AI Storyboard Generator Tools in 2026：https://mockflow.com/blog/best-ai-storyboard-generators
- M Studio — AI Storyboard Generator: Script to Storyboard：https://mstudio.ai/features/ai-storyboard-generator
- Storyboarder.ai — AI Storyboard Generator: From Script to Storyboards：https://www.storyboarder.ai/
- StorylineForge — AI Pre-Visualization for Film: Tools and Workflows 2026：https://storylineforge.com/blog/ai-pre-visualization-for-film-tools-and-workflows-in-2026/
- Drawstory — Previs AI: Scripts to Storyboards & Shot Lists：https://www.drawstory.ai/previs-ai

## 相关概念

- [情绪板与参考体系（Mood Board & Reference System — Art Direction Terms & Practice）](../108-moodboard-reference/moodboard-reference.md)
- [AI 游戏 CG 与过场动画（Game Cinematics — Cutscenes, Trailers & Animatic-First Workflow）](../151-game-cinematics/game-cinematics.md)
- [AI 视频剧本格式规范（Screenplay Format — Industry Standards as AI Input）](../159-screenplay-format/screenplay-format.md)
- [AI 视频质量控制与商业化（Quality Control & Monetization — Cost, QC & ROI）](../122-quality-monetization/quality-monetization.md)
- [AI 一致性全体系（AI Consistency System — Character / Scene / Product / Style）](../117-ai-consistency-system/ai-consistency-system.md)
