---
type: Reference
title: "AI 图片人像用光体系（Portrait Lighting — Rembrandt, Butterfly, Loop & Split Patterns）"
description: "AI 图片的人像用光体系：六大光型（蝴蝶/环形/伦勃朗/分割/宽光/短光）、阴影几何（鼻影/颊影三角）、AI 提示词映射、情绪-光型匹配"
tags:
  - "consistency"
  - "lighting"
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
  - resource: "cited:Floniks Portrait Lighting Patterns"
    id: cite-1
    title: "Portrait Lighting Patterns"
    author: "org:Floniks"
  - resource: "cited:ZSky AI Portrait Lighting Prompts"
    id: cite-2
    title: "AI Portrait Lighting Prompts"
    author: "org:ZSky"
  - resource: "cited:AmateurPhotographer 6 Lighting Patterns"
    id: cite-3
    title: "6 Lighting Patterns"
    author: "org:AmateurPhotographer"
  - resource: "cited:Gemini3Prompt AI Portrait Lighting Prompts Guide"
    id: cite-4
    title: "AI Portrait Lighting Prompts Guide"
    author: "org:Gemini3Prompt"
  - resource: "https://floniks.com/learn/cinematography/portrait-lighting-patterns"
    id: url-1
    title: "floniks.com"
  - resource: "https://zsky.ai/blog/ai-portrait-lighting-prompts.html"
    id: url-2
    title: "zsky.ai"
  - resource: "https://amateurphotographerguide.com/portrait-lighting-techniques-guide/"
    id: url-3
    title: "amateurphotographerguide.com"
  - resource: "https://gemini3prompt.com/articles/ai-portrait-lighting-techniques-prompts/"
    id: url-4
    title: "gemini3prompt.com"
  - resource: "https://zsky.ai/blog/ai-portrait-lighting-prompts"
    id: url-5
    title: "zsky.ai"
dx_id: "217"
related:
  - "125-lighting-atmosphere-prompt/lighting-atmosphere-prompt.md"
  - "215-photo-camera-parameters/photo-camera-parameters.md"
  - "175-micro-expression/micro-expression.md"
---

# AI 图片人像用光体系（Portrait Lighting — Rembrandt, Butterfly, Loop & Split Patterns）

> 本页为 AI 图片的人像用光体系：六大光型（蝴蝶/环形/伦勃朗/分割/宽光/短光）、阴影几何（鼻影/颊影三角）、AI 提示词映射、情绪-光型匹配。知识本体来自 2026 人像用光指南（Floniks/ZSky/AmateurPhotographer）。AI 应用面向 DirectorX：人像生成（衔接 125 光线、215 参数、217 对应、175 面部）。
> 来源：Floniks「Portrait Lighting Patterns」、ZSky「AI Portrait Lighting Prompts」、AmateurPhotographer「6 Lighting Patterns」、Gemini3Prompt「AI Portrait Lighting Prompts Guide」。

## 概述

**核心断言**：人像光型 = **阴影几何的命名**——每种光型有可描述的阴影特征（伦勃朗=颊上三角光、蝴蝶=鼻下对称影、分割=半脸明半脸暗）。**AI 提示词直接写阴影几何**（"Rembrandt lighting with triangle on cheek"）比写"戏剧光"有效（衔接 125：光线提示词的人像维度；175：面部细节协同）。

## 核心概念

### 六大光型（Floniks 阴影几何）

| 光型 | 阴影特征 | 情绪 |
|---|---|---|
| 伦勃朗 | 颊上三角光 | 戏剧/经典 |
| 蝴蝶 | 鼻下对称影 | 时尚/优雅 |
| 环形 | 鼻下小环影 | 自然/柔和 |
| 分割 | 半脸明暗 | 硬朗/神秘 |
| 宽光 | 近侧受光 | 柔化/减宽 |
| 短光 | 远侧受光 | 塑形/瘦脸 |

### 布光设置要点

- 主光 45° 上方（伦勃朗三角）
- 主光居上（蝴蝶鼻影）
- 主光 90° 侧（分割）
- 反射板补光（下颌阴影）

## 技巧与示例

### 光型提示词模板

```text
"Rembrandt lighting, triangle of light on shadowed cheek"
"Butterfly lighting, symmetrical shadow under nose"
"Split lighting, half-lit face, dramatic"
"Rim light, edge highlight, dark background"
```

### 情绪-光型匹配（ZSky 20+ 提示）

| 情绪 | 光型 |
|---|---|
| 戏剧/权威 | 伦勃朗/分割 |
| 优雅/时尚 | 蝴蝶 |
| 自然/亲和 | 环形 |
| 神秘/冷峻 | 分割+轮廓光 |
| 浪漫 | 暖调+环形/蝴蝶 |

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 只写"戏剧光" | 模型乱发挥 | 阴影几何 |
| 光型与情绪不符 | 错位 | 匹配表 |
| 忽略补光 | 阴影死黑 | 反射板 |
| 主光角度乱 | 光型模糊 | 角度指定 |
| 无轮廓光 | 与背景融 | 边缘光 |

## 工作流应用（AI 映射）

人像生成（衔接 125/175/215）：

```text
情绪意图 → 光型选型（匹配表）
  → 阴影几何提示词 → 生成
  → 面部细节检查（175）→ 修正
```

**DirectorX 纪律**：写阴影几何不写模糊词；光型匹配情绪；主光角度明确；补光保细节。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 伦勃朗光 | Rembrandt | 颊上三角 |
| 蝴蝶光 | Butterfly | 鼻下对称影 |
| 环形光 | Loop | 鼻下小环 |
| 分割光 | Split | 半脸明暗 |
| 宽光/短光 | Broad / Short | 近/远侧受光 |
| 轮廓光 | Rim Light | 边缘高光 |

## 来源

- Floniks — Portrait Lighting Patterns: Rembrandt, Loop, Butterfly, Split：https://floniks.com/learn/cinematography/portrait-lighting-patterns
- ZSky — AI Portrait Lighting Prompts: 15 Pro Examples：https://zsky.ai/blog/ai-portrait-lighting-prompts.html
- AmateurPhotographer — Portrait Lighting Techniques: 6 Patterns：https://amateurphotographerguide.com/portrait-lighting-techniques-guide/
- Gemini3Prompt — AI Portrait Lighting Techniques Prompts Guide：https://gemini3prompt.com/articles/ai-portrait-lighting-techniques-prompts/
- ZSky — 20+ AI Portrait Lighting Prompts (2026)：https://zsky.ai/blog/ai-portrait-lighting-prompts

## 相关概念

- [AI 光线与氛围提示词体系（Lighting & Atmosphere Prompts — Cinematic Illumination）](../125-lighting-atmosphere-prompt/lighting-atmosphere-prompt.md)
- [AI 图片摄影参数提示词（Photographic Parameters — Aperture, Shutter, ISO & Lens in Prompts）](../215-photo-camera-parameters/photo-camera-parameters.md)
- [AI 微表情细化（Micro-Expression — Gaze, Blink & Coordinated Facial Detail）](../175-micro-expression/micro-expression.md)
