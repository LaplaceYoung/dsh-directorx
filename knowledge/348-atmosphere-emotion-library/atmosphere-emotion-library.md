---
type: Reference
title: "AI 图片氛围情绪库（Atmosphere-Emotion Library — VA-Driven & Affective Generation）"
description: "AI 图片的氛围情绪库：效价-唤起驱动生成（VA：EmotiCrafter 精准情绪控制）、情感数据集（AffectNet/EMOTIC/AffectSet）、感知增强语义引导（编辑对齐情绪目标）、情绪映射系统（提示词+VA 值）"
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
  - resource: "cited:ICCV EmotiCrafter: Valence-Arousal Model"
    id: cite-1
    title: "EmotiCrafter: Valence-Arousal Model"
    author: "org:ICCV"
  - resource: "cited:PMC Emotional World of Visual Media"
    id: cite-2
    title: "Emotional World of Visual Media"
    author: "org:PMC"
  - resource: "cited:arXiv Perception-Enhanced Affective Editing"
    id: cite-3
    title: "Perception-Enhanced Affective Editing"
    author: "org:arXiv"
  - resource: "cited:arXiv Personalized Emotional Intelligence"
    id: cite-4
    title: "Personalized Emotional Intelligence"
    author: "org:arXiv"
  - resource: "https://openaccess.thecvf.com/content/ICCV2025/papers/Dang_EmotiCrafter_Text-to-Emotional-Image_Generation_based_on_Valence-Arousal_Model_ICCV_2025_paper.pdf"
    id: url-1
    title: "openaccess.thecvf.com"
  - resource: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10586271/"
    id: url-2
    title: "pmc.ncbi.nlm.nih.gov"
  - resource: "https://arxiv.org/html/2605.02521v2"
    id: url-3
    title: "arxiv.org"
  - resource: "https://arxiv.org/html/2607.10678v1"
    id: url-4
    title: "arxiv.org"
  - resource: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10879976/"
    id: url-5
    title: "pmc.ncbi.nlm.nih.gov"
dx_id: "348"
related:
  - "270-style-emotion-mapping/style-emotion-mapping.md"
  - "155-color-psychology/color-psychology.md"
---

# AI 图片氛围情绪库（Atmosphere-Emotion Library — VA-Driven & Affective Generation）

> 本页为 AI 图片的氛围情绪库：效价-唤起驱动生成（VA：EmotiCrafter 精准情绪控制）、情感数据集（AffectNet/EMOTIC/AffectSet）、感知增强语义引导（编辑对齐情绪目标）、情绪映射系统（提示词+VA 值）。知识本体来自 2026 情感生成（ICCV EmotiCrafter/PMC/arXiv）。AI 应用面向 DirectorX：情绪图（衔接 270 风格情绪、348 对应、279 情绪色板、155 色彩心理）。
> 来源：ICCV「EmotiCrafter: Valence-Arousal Model」、PMC「Emotional World of Visual Media」、arXiv「Perception-Enhanced Affective Editing」、arXiv「Personalized Emotional Intelligence」。

## 概述

**核心断言**：氛围情绪可**VA 精准控制**——效价-唤起（Valence-Arousal）驱动生成（EmotiCrafter：提示词+VA 值→目标情绪图像）；情感数据集训练/评估；感知增强编辑对齐情绪目标（衔接 270：情绪→风格；279：色板）。

## 核心概念

### VA 驱动生成（EmotiCrafter）

```
提示词 + VA 值（效价/唤起）
→ 生成对齐目标情绪的图
（调 VA = 调情绪）
```

### 情感数据集（PMC）

AffectNet/EMOTIC/AffectSet（大规模标注）→ 训练/评估——**"情绪可量化"**。

### 感知增强编辑（arXiv）

扩散编辑 + VA 感知检索 → 编辑对齐情绪目标——**"改了还对齐"**。

## 技巧与示例

### 情绪库工作流（AI 映射）

```text
情绪目标 → VA 值映射 → 提示词（270）
  → 生成（EmotiCrafter 类）→ 情绪校验
```

### VA 示例

"high valence, high arousal: vibrant celebration"——**VA 词+情绪**（衔接 279 色板协同）。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 无 VA 设计 | 情绪散 | VA 值 |
| 情绪词直用 | 无效 | 转 VA/风格 |
| 无数据集评估 | 不可测 | 基准 |
| 编辑丢情绪 | 对齐断 | 感知增强 |
| 不校验情绪 | 效果未知 | 情绪检查 |

## 工作流应用（AI 映射）

情绪图（衔接 155/270/279）：

```text
情绪 → VA → 提示词 → 生成 → 校验
```

**DirectorX 纪律**：VA 精准控制；情绪可量化；编辑保对齐；提示词+VA 双驱动。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 效价-唤起 | Valence-Arousal | 情绪双轴 |
| 情感生成 | Affective Generation | VA 驱动 |
| 情感数据集 | Affective Dataset | 标注基准 |
| 感知增强 | Perception-Enhanced | 编辑对齐 |
| 情绪目标 | Emotion Target | VA 对齐 |
| 情绪量化 | Emotion Quantification | 可测性 |

## 来源

- ICCV 2025 — EmotiCrafter: Text-to-Emotional-Image Generation（VA Model）：https://openaccess.thecvf.com/content/ICCV2025/papers/Dang_EmotiCrafter_Text-to-Emotional-Image_Generation_based_on_Valence-Arousal_Model_ICCV_2025_paper.pdf
- PMC — Unlocking the Emotional World of Visual Media：https://pmc.ncbi.nlm.nih.gov/articles/PMC10586271/
- arXiv — Perception-Enhanced Efficient Affective Image Editing（2605.02521）：https://arxiv.org/html/2605.02521v2
- arXiv — Personalized Emotional Intelligence in Generative AI（2607.10678）：https://arxiv.org/html/2607.10678v1
- PMC — Capacity of Generative AI to Interpret Human Emotions：https://pmc.ncbi.nlm.nih.gov/articles/PMC10879976/

## 相关概念

- [AI 图片风格情绪映射库（Style-Emotion Mapping — EmoStyle & Affective Art）](../270-style-emotion-mapping/style-emotion-mapping.md)
- [AI 视频色彩心理学（Color Psychology — Palette as Emotional Language）](../155-color-psychology/color-psychology.md)
