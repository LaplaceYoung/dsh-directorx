---
type: Reference
title: "AI 图片场景概念设计（Environment Concept Art — World Building & Key Art）"
description: "AI 图片场景概念设计：世界观建构（World Building）、场景关键帧（Environment Key Art）、提示词配方（情绪/光线先行 + 建筑风格 + 氛围层 + 细节层级）、场景一致性"
tags:
  - "consistency"
  - "prompt"
  - "style"
  - "continuity"
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
  - resource: "cited:ZSky AI Concept Art for Games"
    id: cite-1
    title: "AI Concept Art for Games"
    author: "org:ZSky"
  - resource: "cited:AI Academy 30 ChatGPT Concept Art Prompts"
    id: cite-2
    title: "30 ChatGPT Concept Art Prompts"
    author: "org:AI-Academy"
  - resource: "cited:OpenArt Midjourney Concept Art Prompts"
    id: cite-3
    title: "Midjourney Concept Art Prompts"
    author: "org:OpenArt"
  - resource: "cited:ImagiStudio Concept Art Style"
    id: cite-4
    title: "Concept Art Style"
    author: "org:ImagiStudio"
  - resource: "https://zsky.ai/blog/ai-concept-art-for-games"
    id: url-1
    title: "zsky.ai"
  - resource: "https://academy.techpresso.co/prompts/chatgpt-prompts-concept-art"
    id: url-2
    title: "academy.techpresso.co"
  - resource: "https://openart.ai/blog/post/midjourney-prompts-for-concept-art"
    id: url-3
    title: "openart.ai"
  - resource: "https://imagistudio.art/style/concept-art"
    id: url-4
    title: "imagistudio.art"
  - resource: "https://morphic.com/resources/images/environment-concept-art-images"
    id: url-5
    title: "morphic.com"
dx_id: "228"
related:
  - "165-environment-generation/environment-generation.md"
  - "125-lighting-atmosphere-prompt/lighting-atmosphere-prompt.md"
  - "181-atmosphere-weather-narrative/atmosphere-weather-narrative.md"
  - "117-ai-consistency-system/ai-consistency-system.md"
  - "126-style-art-direction/style-art-direction.md"
---

# AI 图片场景概念设计（Environment Concept Art — World Building & Key Art）

> 本页为 AI 图片场景概念设计：世界观建构（World Building）、场景关键帧（Environment Key Art）、提示词配方（情绪/光线先行 + 建筑风格 + 氛围层 + 细节层级）、场景一致性。知识本体来自 2026 概念艺术指南（ZSky/AI Academy/OpenArt/Morphic）。AI 应用面向 DirectorX：场景开发（衔接 165 环境、125 光线、181 氛围、228 对应）。
> 来源：ZSky「AI Concept Art for Games」、AI Academy「30 ChatGPT Concept Art Prompts」、OpenArt「Midjourney Concept Art Prompts」、ImagiStudio「Concept Art Style」。

## 概述

**核心断言**：场景概念 = **世界观的可视化**——先定情绪/光线，再定建筑风格，加氛围层（体积雾/尘埃/光柱），指定细节层级（8K 超细）。**情绪先行**（天空/光线/氛围决定观感），建筑风格第二，细节最后（衔接 165：AI 环境的生成；181：氛围叙事）。

## 核心概念

### 场景提示词配方（ZSky）

```text
① 情绪/光线先行（黎明/霓虹夜/荒凉黄昏）
② 建筑风格（生物形态/粗野主义/装饰未来）
③ 氛围层（体积雾/尘埃/光柱）
④ 镜头暗示（16:9 史诗宽景/景深/前景兴趣）
⑤ 细节层级（8k+ ultra-detailed）
```

### 世界观一致性

同一世界多张概念图共享**风格令牌**（建筑/光线/氛围词汇块复用，衔接 117/126）。

## 技巧与示例

### 场景概念工作流

```text
世界观设定 → 情绪/光线 → 建筑风格
  → 氛围层 → 镜头 → 生成
  → 风格一致性（令牌复用）
  → 关键帧定稿 → 生产参考（165）
```

### 情绪先行示例

"epic sci-fantasy city at golden hour, towering megastructures, atmospheric haze, reflective wet streets, wide shot"——光线+氛围先于建筑细节。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 建筑先行 | 无情绪 | 情绪先行 |
| 无氛围层 | 平面感 | 体积雾/光柱 |
| 风格不统一 | 世界观散 | 令牌复用 |
| 无镜头暗示 | 构图平 | 景深/前景 |
| 细节不足 | 概念感弱 | 细节层级 |

## 工作流应用（AI 映射）

场景开发（衔接 117/125/165/181）：

```text
世界观 → 情绪/光线 → 风格 → 氛围层
  → 生成 → 一致性（令牌）→ 关键帧
  → 转生产参考（165）
```

**DirectorX 纪律**：情绪先行；风格令牌统一；氛围层提深度；镜头暗示保构图。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 世界观建构 | World Building | 场景世界观 |
| 场景关键帧 | Environment Key Art | 环境主视觉 |
| 体积雾 | Volumetric Fog | 氛围层 |
| 生物形态 | Biomorphic | 有机建筑 |
| 粗野主义 | Brutalist | 几何建筑 |
| 风格令牌 | Style Token | 一致性复用 |

## 来源

- ZSky — AI Concept Art for Games: Create Assets in Minutes：https://zsky.ai/blog/ai-concept-art-for-games
- AI Academy — 30 Best ChatGPT Concept Art Prompts (2026)：https://academy.techpresso.co/prompts/chatgpt-prompts-concept-art
- OpenArt — The Best 25 Midjourney Prompts for Concept Art：https://openart.ai/blog/post/midjourney-prompts-for-concept-art
- ImagiStudio — Concept Art Style for AI Images：https://imagistudio.art/style/concept-art
- Morphic — Environment Concept Art AI Images：https://morphic.com/resources/images/environment-concept-art-images

## 相关概念

- [AI 视频场景与环境生成（Environment Generation — Virtual Sets & Location Coherence）](../165-environment-generation/environment-generation.md)
- [AI 光线与氛围提示词体系（Lighting & Atmosphere Prompts — Cinematic Illumination）](../125-lighting-atmosphere-prompt/lighting-atmosphere-prompt.md)
- [AI 氛围与天气叙事（Atmosphere & Weather Narrative — Rain, Fog & Mood as Storytelling）](../181-atmosphere-weather-narrative/atmosphere-weather-narrative.md)
- [AI 一致性全体系（AI Consistency System — Character / Scene / Product / Style）](../117-ai-consistency-system/ai-consistency-system.md)
- [AI 风格化与艺术方向（Style & Art Direction — Visual Styles & Style Transfer）](../126-style-art-direction/style-art-direction.md)
