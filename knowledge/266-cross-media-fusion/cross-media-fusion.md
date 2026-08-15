# AI 图片多媒介融合（Cross-Media Fusion — Photo, Illustration & 3D Blending）

> 本页为 AI 图片的多媒介融合：提示词混合（Prompt Blending：风格/关键词/模型融合）、混合媒介艺术（照片+插画+3D+拼贴）、融合技巧（权重/层次/无缝）、概念创作。知识本体来自 2026 混合媒介指南（Text2Img/SeaArt/Adobe Firefly）。AI 应用面向 DirectorX：概念图（衔接 258 超现实、266 对应、224 风格、126 风格迁移）。
> 来源：Text2Img「Master Prompt Blending」、SeaArt「15 Mixed Media Prompts」、Adobe「AI Image Prompt Examples」、Text2Img「2026 Prompt Blending Techniques」。

## 概述

**核心断言**：多媒介融合 = **"风格与媒介的化学反应"**——照片真实感 + 插画表现 + 3D 质感混合（照片写实脸 + 插画背景 + 3D 道具）；提示词混合（融合风格关键词/加权）是 2026 核心技术（衔接 258：超现实拼贴的媒介扩展；126：风格迁移）。

## 核心概念

### 混合媒介类型

```
照片 + 插画（写实主体+手绘背景）
照片 + 3D（真实+立体道具）
拼贴 + 数字（258 超现实扩展）
混合风格（水彩+霓虹，224 风格融合）
```

### 提示词混合技巧（Text2Img）

```text
① 并列风格词（"photorealistic subject, watercolor background"）
② 权重强调（关键风格词加权）
③ 层次描述（前景媒介+背景媒介）
```

## 技巧与示例

### 混合媒介工作流

```text
概念意图 → 媒介组合选型（照片+插画+3D）
  → 层次分配（前景/背景媒介）
  → 提示词混合（并列/权重）→ 生成
  → 融合校验（接缝/一致性）
```

### 无缝融合要点

媒介交界处理（边缘过渡）+ 光影统一（235）+ 色彩统一（243）——**"混合但不突兀"**。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 媒介堆叠无层次 | 混乱 | 层次分配 |
| 交界生硬 | 拼贴感 | 过渡处理 |
| 光影不统一 | 穿帮 | 统一（235） |
| 风格权重乱 | 主次不明 | 加权 |
| 无融合校验 | 效果未知 | 接缝检查 |

## 工作流应用（AI 映射）

概念图（衔接 126/224/235/258）：

```text
概念 → 媒介组合 → 层次分配 → 混合提示
  → 生成 → 光影/接缝统一校验
```

**DirectorX 纪律**：媒介组合有层次；交界无缝；光影色彩统一；加权控制主次。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 提示词混合 | Prompt Blending | 风格融合 |
| 混合媒介 | Mixed Media | 多媒介 |
| 层次分配 | Layer Assignment | 前景/背景 |
| 权重强调 | Weight Emphasis | 主次控制 |
| 无缝融合 | Seamless Blend | 交界处理 |
| 媒介交接 | Media Transition | 边缘过渡 |

## 来源

- Text2Img — Master Prompt Blending: Combine AI Styles (2026)：https://www.text2img.pro/master-prompt-blending-ai-styles-2026-4/
- SeaArt — 15 Mixed Media Prompts for Art：https://www.seaart.ai/blog/mixed-media
- Adobe — AI Image Prompt Examples (Firefly)：https://www.adobe.com/products/firefly/ai-generated-examples/image-prompts.html
- Text2Img — 2026 Prompt Blending Techniques：https://www.text2img.pro/2026-prompt-blending-techniques/
- SeaHot — 15 Mixed Media Prompts for Art：https://www.seahot.ai/blog/mixed-media