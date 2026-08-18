---
type: Reference
title: "AI 图片动漫风格帧（Anime Style Frames — Cel Shading & Subgenre Steering）"
description: "AI 图片动漫风格帧：赛璐璐着色（Cel Shading：硬边墨线/平面色块/两级阴影）、风格锁定（style lock 词汇）、子类型引导（少年/少女/青年：比例与表情）、镜头感提示"
tags:
  - "synthesis"
  - "camera"
  - "style"
  - "image"
status: stable
stale_after: "2027-08-18"
generated:
  by: "process:directorx-knowledge-okf"
  at: "2026-08-18T00:00:00Z"
verified:
  - by: "process:knowledge-audit"
    at: "2026-08-18T00:00:00Z"
sources:
  - resource: "cited:Vaiflux Anime Style Prompts That Actually Work"
    id: cite-1
    title: "Anime Style Prompts That Actually Work"
    author: "org:Vaiflux"
  - resource: "cited:SpacePrompts Anime Art Style Prompts"
    id: cite-2
    title: "Anime Art Style Prompts"
    author: "org:SpacePrompts"
  - resource: "cited:Anifusion Cel-Shading Anime Style"
    id: cite-3
    title: "Cel-Shading Anime Style"
    author: "org:Anifusion"
  - resource: "cited:GptImager Anime Style AI Prompts"
    id: cite-4
    title: "Anime Style AI Prompts"
    author: "org:GptImager"
  - resource: "https://www.vaiflux.com/prompts/anime-style-prompts-guide"
    id: url-1
    title: "vaiflux.com"
  - resource: "https://www.spaceprompts.com/blog/anime-art-style-prompts-for-ai-image-generators"
    id: url-2
    title: "spaceprompts.com"
  - resource: "https://anifusion.ai/style/cel-shading-anime-style-generator/"
    id: url-3
    title: "anifusion.ai"
  - resource: "https://gptimager.com/styles/anime"
    id: url-4
    title: "gptimager.com"
  - resource: "https://www.aiforart.com/anime/styles/md"
    id: url-5
    title: "aiforart.com"
dx_id: "247"
related:
  - "126-style-art-direction/style-art-direction.md"
  - "238-image-series-consistency/image-series-consistency.md"
  - "213-copyright-safe-prompting/copyright-safe-prompting.md"
  - "231-shot-size-emotion/shot-size-emotion.md"
---

# AI 图片动漫风格帧（Anime Style Frames — Cel Shading & Subgenre Steering）

> 本页为 AI 图片动漫风格帧：赛璐璐着色（Cel Shading：硬边墨线/平面色块/两级阴影）、风格锁定（style lock 词汇）、子类型引导（少年/少女/青年：比例与表情）、镜头感提示。知识本体来自 2026 动漫提示词指南（Vaiflux/SpacePrompts/Anifusion/GptImager）。AI 应用面向 DirectorX：动漫帧（衔接 224 风格体系、238 系列一致、247 对应、213 版权）。
> 来源：Vaiflux「Anime Style Prompts That Actually Work」、SpacePrompts「Anime Art Style Prompts」、Anifusion「Cel-Shading Anime Style」、GptImager「Anime Style AI Prompts」。

## 概述

**核心断言**：动漫帧 = **"赛璐璐着色语法"**——硬边墨线（Ink Line Outline）+ 平面色块（Flat Color Fields）+ 两级阴影（Two-Tone Shadow）+ 显式光照（衔接 224：风格体系的动漫维度；213：不点名工作室防侵权）。

## 核心概念

### 赛璐璐着色四要素

```
① 硬边墨线（Ink Line Outline）
② 平面色块（Flat Color Fields）
③ 两级阴影（Two-Tone Shadow Blocks）
④ 显式光照（Top-Left Key / Rim Light）
```

### 风格锁定词汇

```text
"cel shading, anime style, ink line outline, flat color fields,
two-tone shadow, top-left key light"
```

### 子类型引导（比例/表情）

| 子类型 | 特征 |
|---|---|
| 少年（Shonen） | 强比例/动作 |
| 少女（Shojo） | 大眼/柔线 |
| 青年（Seinen） | 写实/暗调 |

## 技巧与示例

### 动漫帧工作流

```text
子类型选型 → 风格锁定词汇
  → 镜头感（三视图/动作帧）
  → 光照/色板 → 提示词
  → 生成 → 一致性（238）→ 修正
```

### 镜头感提示

"anime screencap, three-quarter view, dynamic action frame, eye-level shot"——**帧 = 动画截帧感**（衔接 231 景别）。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 无墨线词汇 | 插画感非动漫 | 硬边线 |
| 阴影单一 | 平 | 两级阴影 |
| 无子类型 | 风格漂移 | 子类型引导 |
| 点名工作室 | 版权风险 | 属性化（213） |
| 帧无镜头感 | 非截帧 | 镜头提示 |

## 工作流应用（AI 映射）

动漫帧（衔接 213/224/231/238）：

```text
子类型 → 风格锁定 → 镜头感 → 光照
  → 生成 → 系列一致（238）→ 版权复核（213）
```

**DirectorX 纪律**：赛璐璐语法完整；子类型引导比例表情；帧有截帧感；属性化防侵权。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 赛璐璐着色 | Cel Shading | 平面动画色 |
| 硬边墨线 | Ink Line Outline | 描边 |
| 两级阴影 | Two-Tone Shadow | 明暗分层 |
| 平面色块 | Flat Color Fields | 无渐变 |
| 动画截帧 | Anime Screencap | 帧感 |
| 子类型 | Subgenre | 少年/少女/青年 |

## 来源

- Vaiflux — Anime Style Prompts That Actually Work：https://www.vaiflux.com/prompts/anime-style-prompts-guide
- SpacePrompts — Anime Art Style Prompts for AI Image Generators：https://www.spaceprompts.com/blog/anime-art-style-prompts-for-ai-image-generators
- Anifusion — Cel-Shading Anime Style Generator：https://anifusion.ai/style/cel-shading-anime-style-generator/
- GptImager — Anime Style AI Image Prompts for GPT Image 2：https://gptimager.com/styles/anime
- AIforArt — Anime Styles Hub: Prompts, Models, Workflows：https://www.aiforart.com/anime/styles/md

## 相关概念

- [AI 风格化与艺术方向（Style & Art Direction — Visual Styles & Style Transfer）](../126-style-art-direction/style-art-direction.md)
- [AI 图片系列一致性（Image Series Consistency — Character DNA & Frame Chaining）](../238-image-series-consistency/image-series-consistency.md)
- [AI 版权安全提示词（Copyright-Safe Prompting — Genericization & IP Avoidance）](../213-copyright-safe-prompting/copyright-safe-prompting.md)
- [电影景别情绪理论（Shot Size Emotion — Close-Up Intimacy, Wide Isolation）](../231-shot-size-emotion/shot-size-emotion.md)
