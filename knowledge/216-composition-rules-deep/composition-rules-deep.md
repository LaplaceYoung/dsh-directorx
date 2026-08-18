---
type: Reference
title: "AI 图片构图法则体系（Composition Rules — Framing, Leading Lines & Visual Hierarchy）"
description: "AI 图片的构图法则体系：三分法/对称/引导线/框架式/负空间/视觉层级、构图提示词显式化（\"rule of thirds\"直接写）、构图承载叙事"
tags:
  - "consistency"
  - "prompt"
  - "narrative"
  - "image"
  - "vfx"
status: stable
stale_after: "2027-08-18"
generated:
  by: "process:directorx-knowledge-okf"
  at: "2026-08-18T00:00:00Z"
verified:
  - by: "process:knowledge-audit"
    at: "2026-08-18T00:00:00Z"
sources:
  - resource: "cited:ZSky 12 AI Image Composition Tips"
    id: cite-1
    title: "12 AI Image Composition Tips"
    author: "org:ZSky"
  - resource: "cited:Floniks Composition Rules in Prompts"
    id: cite-2
    title: "Composition Rules in Prompts"
    author: "org:Floniks"
  - resource: "cited:Gemini3Prompt AI Image Composition Techniques"
    id: cite-3
    title: "AI Image Composition Techniques"
    author: "org:Gemini3Prompt"
  - resource: "cited:PromptPiece Composition Rules for Story-Driven AI Images"
    id: cite-4
    title: "Composition Rules for Story-Driven AI Images"
    author: "org:PromptPiece"
  - resource: "https://zsky.ai/blog/ai-composition-tips"
    id: url-1
    title: "zsky.ai"
  - resource: "https://floniks.com/learn/cinematography/composition-rules-in-prompts"
    id: url-2
    title: "floniks.com"
  - resource: "https://gemini3prompt.com/articles/ai-image-composition-techniques/"
    id: url-3
    title: "gemini3prompt.com"
  - resource: "https://promptpiece.com/posts/tech/composition-rules/"
    id: url-4
    title: "promptpiece.com"
  - resource: "https://gemini3prompt.com/ko/articles/ai-image-composition-techniques/"
    id: url-5
    title: "gemini3prompt.com"
dx_id: "216"
related:
  - "192-negative-space/negative-space.md"
  - "210-golden-ratio-composition/golden-ratio-composition.md"
  - "215-photo-camera-parameters/photo-camera-parameters.md"
---

# AI 图片构图法则体系（Composition Rules — Framing, Leading Lines & Visual Hierarchy）

> 本页为 AI 图片的构图法则体系：三分法/对称/引导线/框架式/负空间/视觉层级、构图提示词显式化（"rule of thirds"直接写）、构图承载叙事。知识本体来自 2026 构图提示词指南（ZSky/Gemini3Prompt/Floniks/PromptPiece）。AI 应用面向 DirectorX：图片构图（衔接 192 负空间、210 黄金比例、215 参数、216 对应）。
> 来源：ZSky「12 AI Image Composition Tips」、Floniks「Composition Rules in Prompts」、Gemini3Prompt「AI Image Composition Techniques」、PromptPiece「Composition Rules for Story-Driven AI Images」。

## 概述

**核心断言**：构图法则要**显式写进提示词**——"AI 默认居中"，必须写"rule of thirds composition / off-center, subject on right third"+ 方向提示（衔接 210：Phi 网格升级；192：负空间协同）。构图不只是美观，是**引导视线与承载叙事**。

## 核心概念

### 构图法则库

| 法则 | 作用 | 提示词 |
|---|---|---|
| 三分法 | 基础平衡 | "rule of thirds" |
| 对称 | 秩序/庄严 | "symmetrical composition" |
| 引导线 | 视线引导 | "leading lines toward subject" |
| 框架式 | 聚焦 | "natural framing" |
| 负空间 | 强调/情绪 | "negative space"（192） |
| 视觉层级 | 主次 | "visual hierarchy" |

### 显式化技巧（Floniks）

```text
"rule of thirds composition" + 方向提示
"subject on right third, looking left"（比只说三分法更有效）
```

## 技巧与示例

### 构图叙事（PromptPiece）

| 叙事意图 | 构图 |
|---|---|
| 孤立 | 小主体+大负空间 |
| 权力 | 低角度+对称 |
| 动态 | 对角线引导线 |
| 神秘 | 框架式遮挡 |
| 平衡 | 对称/三分 |

### 构图提示词模板

```text
"subject on right third, leading lines from left, natural framing,
visual hierarchy, rule of thirds composition"
```

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 默认居中 | 无设计感 | 显式构图词 |
| 只说法则无方向 | 无效 | 加方向提示 |
| 法则堆叠 | 杂乱 | 一镜一主法则 |
| 构图与叙事脱节 | 无意义 | 叙事驱动 |
| 忽视视觉层级 | 主次混乱 | 层级设计 |

## 工作流应用（AI 映射）

图片构图（衔接 192/210/215）：

```text
叙事意图 → 主法则选择 → 显式提示词
  → 生成 → 构图校验（层级/视线）
  → 修正
```

**DirectorX 纪律**：法则显式化；加方向提示；一镜一主法则；叙事驱动构图。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 三分法 | Rule of Thirds | 基础平衡 |
| 引导线 | Leading Lines | 视线引导 |
| 框架式 | Natural Framing | 聚焦 |
| 视觉层级 | Visual Hierarchy | 主次 |
| 对称构图 | Symmetrical Composition | 秩序 |
| 对角线 | Diagonal Lines | 动态 |

## 来源

- ZSky — 12 AI Image Composition Tips for Pro-Level Results：https://zsky.ai/blog/ai-composition-tips
- Floniks — Composition Rules in Prompts: Rule of Thirds, Leading Lines：https://floniks.com/learn/cinematography/composition-rules-in-prompts
- Gemini3Prompt — AI Image Composition: Pro Framing Techniques：https://gemini3prompt.com/articles/ai-image-composition-techniques/
- PromptPiece — Composition Rules for Strong, Story-Driven AI Images：https://promptpiece.com/posts/tech/composition-rules/
- Gemini3Prompt — AI Image Composition Techniques（KO）：https://gemini3prompt.com/ko/articles/ai-image-composition-techniques/

## 相关概念

- [AI 提示词负空间与留白（Negative Space — Breathing Room & Minimalist Emphasis）](../192-negative-space/negative-space.md)
- [AI 黄金比例构图（Golden Ratio Composition — Phi Grid & Cinematic Balance）](../210-golden-ratio-composition/golden-ratio-composition.md)
- [AI 图片摄影参数提示词（Photographic Parameters — Aperture, Shutter, ISO & Lens in Prompts）](../215-photo-camera-parameters/photo-camera-parameters.md)
