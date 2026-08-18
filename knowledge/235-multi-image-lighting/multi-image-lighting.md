---
type: Reference
title: "AI 图片多图光照统一（Multi-Image Lighting — Master Reference & Lighting Block）"
description: "AI 图片的多图光照统一：主参考图（Master Reference）定义光源方向/质量、光照块（Lighting Block：精确措辞）附加到每张提示词、位置提示（Positional Prompting）、批量光照一致（电商 1000+ 图）"
tags:
  - "consistency"
  - "lighting"
  - "prompt"
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
  - resource: "cited:Hailuo Consistent Lighting for Multi-Angle AI Shots"
    id: cite-1
    title: "Consistent Lighting for Multi-Angle AI Shots"
    author: "org:Hailuo"
  - resource: "cited:ReelMind AI Lighting Consistency Tool"
    id: cite-2
    title: "AI Lighting Consistency Tool"
    author: "org:ReelMind"
  - resource: "cited:Rewarx Reference Lighting Match Workflow"
    id: cite-3
    title: "Reference Lighting Match Workflow"
    author: "org:Rewarx"
  - resource: "cited:VisionToPrompt Lighting Consistency in Midjourney"
    id: cite-4
    title: "Lighting Consistency in Midjourney"
    author: "org:VisionToPrompt"
  - resource: "https://hailuoai.video/pages/knowledge/ai-video-lighting-consistency"
    id: url-1
    title: "hailuoai.video"
  - resource: "https://reelmind.ai/blog/the-ai-lighting-consistency-tool-matching-exposure-across-angles"
    id: url-2
    title: "reelmind.ai"
  - resource: "https://www.rewarx.com/blogs/ai-photo-editor-match-exact-lighting-of-reference-image"
    id: url-3
    title: "rewarx.com"
  - resource: "https://visiontoprompt.com/blog/lighting-consistency-midjourney-product-photos/"
    id: url-4
    title: "visiontoprompt.com"
  - resource: "https://www.alibaba.com/product-insights/how-to-batch-edit-1000-photos-with-consistent-ai-color-grading-across-lighting-conditions.html"
    id: url-5
    title: "alibaba.com"
dx_id: "235"
related:
  - "200-time-of-day-continuity/time-of-day-continuity.md"
  - "215-photo-camera-parameters/photo-camera-parameters.md"
  - "170-light-matching/light-matching.md"
  - "41-ecommerce-assets/ecommerce-creative-factory.md"
  - "223-product-photography-ai/product-photography-ai.md"
---

# AI 图片多图光照统一（Multi-Image Lighting — Master Reference & Lighting Block）

> 本页为 AI 图片的多图光照统一：主参考图（Master Reference）定义光源方向/质量、光照块（Lighting Block：精确措辞）附加到每张提示词、位置提示（Positional Prompting）、批量光照一致（电商 1000+ 图）。知识本体来自 2026 光照一致指南（Hailuo/ReelMind/Rewarx/VisionToPrompt）。AI 应用面向 DirectorX：多图一致（衔接 200 时间连续、235 对应、215 参数）。
> 来源：Hailuo「Consistent Lighting for Multi-Angle AI Shots」、ReelMind「AI Lighting Consistency Tool」、Rewarx「Reference Lighting Match Workflow」、VisionToPrompt「Lighting Consistency in Midjourney」。

## 概述

**核心断言**：多图光照统一 = **主参考 + 光照块复用**——主参考图定义光源方向与质量，**光照块（精确措辞）附加到每张提示词**（同方向/色温/阴影模式），预览校验阴影/高光对齐（衔接 200：时间连续的图片版；170：光匹配）。

## 核心概念

### 两策略（Hailuo）

```
① Master Image Strategy：主参考定义光
② Positional Prompting：每张提示词标光照位置
+ 光照块（Lighting Block）：精确措辞复用
```

### 光照块示例

```text
"consistent lighting: warm key light from camera left, soft fill,
gentle shadows falling right, same color temperature across all images"
```

## 技巧与示例

### 多图光照工作流

```text
主参考图（光源方向/质量定义）
  → 光照块编写（精确措辞）
  → 每张提示词附加光照块
  → 生成 → 预览校验（阴影/高光对齐）
  → 修正（漂移图重生成）
```

### 批量电商应用（Rewarx）

1000+ 产品图统一光照：**光照块 + 批量处理**（衔接 41 素材工厂、223 产品图）。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 无主参考 | 各图光乱 | Master 先行 |
| 光照块不统一 | 漂移 | 精确措辞复用 |
| 阴影方向乱 | 拼接感 | 同侧校验 |
| 色温漂移 | 色调不一 | 色温锁定 |
| 无预览校验 | 批量错误 | 预览对齐 |

## 工作流应用（AI 映射）

多图一致（衔接 41/170/215）：

```text
主参考（光定义）→ 光照块 → 逐图附加
  → 生成 → 预览校验 → 批量修正
```

**DirectorX 纪律**：主参考定义光；光照块精确复用；阴影/高光同侧；色温锁定。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 主参考图 | Master Reference | 光定义 |
| 光照块 | Lighting Block | 精确措辞 |
| 位置提示 | Positional Prompting | 光位标注 |
| 阴影对齐 | Shadow Alignment | 同侧校验 |
| 批量一致 | Batch Consistency | 千图统一 |
| 色温锁定 | Color Temperature Lock | 色调稳定 |

## 来源

- Hailuo — Consistent Lighting for Multi-Angle AI Shots：https://hailuoai.video/pages/knowledge/ai-video-lighting-consistency
- ReelMind — The AI Lighting Consistency Tool：https://reelmind.ai/blog/the-ai-lighting-consistency-tool-matching-exposure-across-angles
- Rewarx — Reference Lighting Match Workflow：https://www.rewarx.com/blogs/ai-photo-editor-match-exact-lighting-of-reference-image
- VisionToPrompt — Lighting Consistency in Midjourney：https://visiontoprompt.com/blog/lighting-consistency-midjourney-product-photos/
- Alibaba — Batch-Edit 1000+ Photos with Consistent AI Color Grading：https://www.alibaba.com/product-insights/how-to-batch-edit-1000-photos-with-consistent-ai-color-grading-across-lighting-conditions.html

## 相关概念

- [AI 场景时间连续性（Time-of-Day Continuity — Lighting Plan & Time Flow）](../200-time-of-day-continuity/time-of-day-continuity.md)
- [AI 图片摄影参数提示词（Photographic Parameters — Aperture, Shutter, ISO & Lens in Prompts）](../215-photo-camera-parameters/photo-camera-parameters.md)
- [AI 实拍光线匹配（Light Matching — HDRI Extraction & Scene Relighting）](../170-light-matching/light-matching.md)
- [电商素材批量生成工厂（E-commerce Creative Factory）](../41-ecommerce-assets/ecommerce-creative-factory.md)
- [AI 产品图生成（Product Photography — White Background, Studio & Marketplace Prompts）](../223-product-photography-ai/product-photography-ai.md)
