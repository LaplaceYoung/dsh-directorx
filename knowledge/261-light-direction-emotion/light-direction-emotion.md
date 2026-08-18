---
type: Reference
title: "AI 图片光影方向情绪库（Light Direction Emotion — Side, Top, Back & Under Light）"
description: "AI 图片的光影方向情绪库：光位-情绪映射（正面平/侧面神秘/顶光压迫/背光光环/底光诡异）、组合光（暖侧+冷环境）、提示词模板（情绪先行+光质+方向）"
tags:
  - "synthesis"
  - "prompt"
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
  - resource: "cited:Text2Img Describe Lighting & Mood in AI Prompts"
    id: cite-1
    title: "Describe Lighting & Mood in AI Prompts"
    author: "org:Text2Img"
  - resource: "cited:ZSky 38 AI Lighting Prompts"
    id: cite-2
    title: "38 AI Lighting Prompts"
    author: "org:ZSky"
  - resource: "cited:Gera Lighting Style Prompt Library"
    id: cite-3
    title: "Lighting Style Prompt Library"
    author: "org:Gera"
  - resource: "cited:ZSky AI Portrait Lighting Prompts"
    id: cite-4
    title: "AI Portrait Lighting Prompts"
    author: "org:ZSky"
  - resource: "https://www.text2img.pro/describe-lighting-mood-ai-prompts-2026-6/"
    id: url-1
    title: "text2img.pro"
  - resource: "https://zsky.ai/blog/ai-lighting-prompts"
    id: url-2
    title: "zsky.ai"
  - resource: "https://geratools.com/lighting-style-library"
    id: url-3
    title: "geratools.com"
  - resource: "https://zsky.ai/blog/ai-portrait-lighting-prompts"
    id: url-4
    title: "zsky.ai"
  - resource: "https://www.text2img.pro/describe-lighting-and-mood-in-ai-prompts-2026-2/"
    id: url-5
    title: "text2img.pro"
dx_id: "261"
related:
  - "217-portrait-lighting-schemes/portrait-lighting-schemes.md"
  - "236-chiaroscuro-light/chiaroscuro-light.md"
  - "225-film-lighting-theory/film-lighting-theory.md"
  - "158-emotional-arc-pacing/emotional-arc-pacing.md"
---

# AI 图片光影方向情绪库（Light Direction Emotion — Side, Top, Back & Under Light）

> 本页为 AI 图片的光影方向情绪库：光位-情绪映射（正面平/侧面神秘/顶光压迫/背光光环/底光诡异）、组合光（暖侧+冷环境）、提示词模板（情绪先行+光质+方向）。知识本体来自 2026 光位指南（Text2Img/ZSky/Gera Tools）。AI 应用面向 DirectorX：光位设计（衔接 217 人像光、236 明暗、261 对应、225 布光）。
> 来源：Text2Img「Describe Lighting & Mood in AI Prompts」、ZSky「38 AI Lighting Prompts」、Gera「Lighting Style Prompt Library」、ZSky「AI Portrait Lighting Prompts」。

## 概述

**核心断言**：光位 = **情绪的方向性语法**——正面光平/中性，侧光戏剧/神秘，顶光压迫/权威，背光光环/英雄，底光诡异/科幻（衔接 225：布光的情绪维度；217：光型的方位基础）。

## 核心概念

### 光位情绪库

| 光位 | 情绪 | 用途 |
|---|---|---|
| 正面光 | 平/中性 | 商业/纪实 |
| 侧光 | 戏剧/神秘 | 肖像/张力 |
| 顶光 | 压迫/权威 | 审讯/冷峻 |
| 背光 | 光环/英雄 | 分离/升华 |
| 底光 | 诡异/科幻 | 反派/悬疑 |

### 组合光

```text
暖侧光左 + 冷环境光右 = 层次+对比（218 色彩协同）
```

## 技巧与示例

### 光位提示词模板（Text2Img）

```text
"Rembrandt lighting, warm side light from left, nostalgic mood"
"backlit with rim light, silhouette, dramatic"
"harsh overhead light, noir mood, deep shadows"
"underlight, eerie green glow, sci-fi"
```

### 情绪先行原则

**先写情绪词（nostalgic/tense/ethereal）再写光质与方向**——情绪驱动光位选择（衔接 158 情绪节拍）。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 无方向 | 光位模糊 | 显式方向 |
| 光位与情绪不符 | 错位 | 情绪先行 |
| 只写光质 | 无方位 | 方向+光质 |
| 组合无对比 | 层次平 | 暖冷组合 |
| 不校验情绪 | 效果未知 | 情绪检查 |

## 工作流应用（AI 映射）

光位设计（衔接 158/217/225/236）：

```text
情绪节拍（158）→ 光位选型（库）
  → 组合设计 → 提示词 → 生成 → 校验
```

**DirectorX 纪律**：情绪先行选光位；方向显式化；暖冷组合提层次；生成后校验情绪。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 光位 | Light Direction | 光源方位 |
| 侧光 | Side Light | 戏剧神秘 |
| 顶光 | Top Light | 压迫权威 |
| 背光 | Backlight | 光环分离 |
| 底光 | Underlight | 诡异科幻 |
| 组合光 | Combined Light | 暖冷层次 |

## 来源

- Text2Img — Describe Lighting & Mood in AI Image Prompts (2026)：https://www.text2img.pro/describe-lighting-mood-ai-prompts-2026-6/
- ZSky — 38 AI Lighting Prompts (Tested)：https://zsky.ai/blog/ai-lighting-prompts
- Gera Tools — Lighting Style Prompt Library：https://geratools.com/lighting-style-library
- ZSky — 20+ AI Portrait Lighting Prompts：https://zsky.ai/blog/ai-portrait-lighting-prompts
- Text2Img — Describe Lighting and Mood in AI Prompts (2026)：https://www.text2img.pro/describe-lighting-and-mood-in-ai-prompts-2026-2/

## 相关概念

- [AI 图片人像用光体系（Portrait Lighting — Rembrandt, Butterfly, Loop & Split Patterns）](../217-portrait-lighting-schemes/portrait-lighting-schemes.md)
- [AI 图片明暗对照叙事（Chiaroscuro — Dramatic Light-Shadow & Tenebrism）](../236-chiaroscuro-light/chiaroscuro-light.md)
- [电影布光理论（Film Lighting Theory — Three-Point, Hard/Soft & High/Low Key）](../225-film-lighting-theory/film-lighting-theory.md)
- [AI 情绪曲线与节奏心理学（Emotional Arc & Pacing Psychology — Tension-Release & Rhythm）](../158-emotional-arc-pacing/emotional-arc-pacing.md)
