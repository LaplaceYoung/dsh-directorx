---
type: Method
title: "AI 图片摄影流派（Photography Genres — Street, Documentary, Fashion & Landscape Prompts）"
description: "AI 图片的摄影流派：街拍（决定性瞬间/黑白高对比）、纪实（真实感/自然光）、时尚（编辑风/方向光）、风光（广角/黄金时刻/前景兴趣）、流派提示词配方（相机/镜头/光/情绪/后期）"
tags:
  - "synthesis"
  - "camera"
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
  - resource: "cited:Adobe AI Image Prompt Examples"
    id: cite-1
    title: "AI Image Prompt Examples"
    author: "org:Adobe"
  - resource: "cited:ChatSmith 10 AI Photo Prompts Across Genres"
    id: cite-2
    title: "10 AI Photo Prompts Across Genres"
    author: "org:ChatSmith"
  - resource: "cited:Imagine.Art 80 AI Photography Prompts"
    id: cite-3
    title: "80 AI Photography Prompts"
    author: "org:Imagine.Art"
  - resource: "cited:OpenArt 50 Best AI Image Prompts"
    id: cite-4
    title: "50 Best AI Image Prompts"
    author: "org:OpenArt"
  - resource: "https://www.adobe.com/products/firefly/ai-generated-examples/image-prompts.html"
    id: url-1
    title: "adobe.com"
  - resource: "https://chatsmith.io/blogs/prompt/ai-photo-prompts-00249"
    id: url-2
    title: "chatsmith.io"
  - resource: "https://www.imagine.art/blogs/ai-photography-prompts"
    id: url-3
    title: "imagine.art"
  - resource: "https://openart.ai/blog/best-ai-image-generator-prompts/"
    id: url-4
    title: "openart.ai"
dx_id: "249"
related:
  - "215-photo-camera-parameters/photo-camera-parameters.md"
  - "126-style-art-direction/style-art-direction.md"
  - "216-composition-rules-deep/composition-rules-deep.md"
---

# AI 图片摄影流派（Photography Genres — Street, Documentary, Fashion & Landscape Prompts）

> 本页为 AI 图片的摄影流派：街拍（决定性瞬间/黑白高对比）、纪实（真实感/自然光）、时尚（编辑风/方向光）、风光（广角/黄金时刻/前景兴趣）、流派提示词配方（相机/镜头/光/情绪/后期）。知识本体来自 2026 摄影流派指南（Adobe Firefly/ChatSmith/Imagine.Art）。AI 应用面向 DirectorX：图片风格（衔接 215 参数、224 风格、249 对应、224→已并入 216 构图）。
> 来源：Adobe「AI Image Prompt Examples」、ChatSmith「10 AI Photo Prompts Across Genres」、Imagine.Art「80 AI Photography Prompts」、OpenArt「50 Best AI Image Prompts」。

## 概述

**核心断言**：摄影流派 = **"风格化观看方式"**——每个流派有可词汇化的语法（街拍=决定性瞬间+24mm+黑白高对比；时尚=编辑风+50mm+方向光）。**流派配方 = 相机 + 镜头 + 光 + 情绪 + 后期**（衔接 215：参数；224：风格词汇的流派版）。

## 核心概念

### 流派配方库

| 流派 | 配方要点 |
|---|---|
| 街拍 | 24mm 广角/决定性瞬间/黑白高对比/颗粒 |
| 纪实 | 自然窗光/浅景深/真实表情/素调 |
| 时尚 | 50mm/方向光/艳色/电影调色 |
| 风光 | 16-35mm/黄金时刻/HDR/前景兴趣 |
| 微距 | 196 微距配方 |
| 建筑 | 广角/对称/透视校正 |

### 配方结构（ChatSmith）

```text
流派 + 相机/焦段 + 光线质量 + 情绪形容词 + 后期（颗粒/对比/调色）
```

## 技巧与示例

### 流派生成工作流

```text
流派选型 → 配方要素（相机/光/情绪/后期）
  → 提示词 → 生成
  → 流派真实性校验（是否"像"该流派）
```

### 街拍配方示例

"candid urban scene, 24mm wide-angle, street-level, decisive moment, pedestrians in motion, high contrast black-and-white, grain texture"。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 流派混搭 | 风格乱 | 单流派配方 |
| 缺相机要素 | 非摄影感 | 相机/焦段 |
| 情绪词缺失 | 无氛围 | 情绪形容词 |
| 无后期词 | 数码感 | 颗粒/调色 |
| 流派不校验 | 四不像 | 流派校验 |

## 工作流应用（AI 映射）

图片风格（衔接 215/224）：

```text
流派选型 → 配方（相机/光/情绪/后期）
  → 生成 → 流派校验 → 修正
```

**DirectorX 纪律**：流派有语法；配方完整（相机/光/情绪/后期）；单流派不混搭；生成后校验。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 决定性瞬间 | Decisive Moment | 街拍核心 |
| 编辑风 | Editorial Style | 时尚流派 |
| 前景兴趣 | Foreground Interest | 风光层次 |
| 电影调色 | Cinematic Grade | 后期风格 |
| 颗粒纹理 | Grain Texture | 胶片质感 |
| 流派语法 | Genre Grammar | 流派词汇 |

## 来源

- Adobe — AI Image Prompt Examples (Firefly)：https://www.adobe.com/products/firefly/ai-generated-examples/image-prompts.html
- ChatSmith — 10 AI Photo Prompts Across Photography Genres：https://chatsmith.io/blogs/prompt/ai-photo-prompts-00249
- Imagine.Art — 80 AI Photography Prompts：https://www.imagine.art/blogs/ai-photography-prompts
- OpenArt — 50 Best AI Image Generator Prompts：https://openart.ai/blog/best-ai-image-generator-prompts/
- GitHub — Awesome-AI-Image-Prompts (1000+)：

## 相关概念

- [AI 图片摄影参数提示词（Photographic Parameters — Aperture, Shutter, ISO & Lens in Prompts）](../215-photo-camera-parameters/photo-camera-parameters.md)
- [AI 风格化与艺术方向（Style & Art Direction — Visual Styles & Style Transfer）](../126-style-art-direction/style-art-direction.md)
- [AI 图片构图法则体系（Composition Rules — Framing, Leading Lines & Visual Hierarchy）](../216-composition-rules-deep/composition-rules-deep.md)
