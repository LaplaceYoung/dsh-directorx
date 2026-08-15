# AI 图片风格情绪映射库（Style-Emotion Mapping — EmoStyle & Affective Art）

> 本页为 AI 图片的风格情绪映射：情绪驱动风格化（EmoStyle）、风格-情绪对应（色彩/纹理/感受）、情感艺术数据集（AffectiveArt）、风格评价方法论（评风格非表情）。知识本体来自 2026 情绪风格研究（arXiv EmoStyle/Imaging.org/OpenReview）。AI 应用面向 DirectorX：风格选型（衔接 224 风格、270 对应、155 色彩心理）。
> 来源：arXiv「EmoStyle: Emotion-Driven Image Stylization」、Imaging.org「Emotionally Aware Portrait System」、OpenReview「AffectiveArt Challenge 2026」、arXiv「Emotion-Aware Artistic Generation Dataset」。

## 概述

**核心断言**：风格是**情绪的可视编码**——EmoStyle 类方法把特定情绪链接到视觉风格（色彩/纹理/感受），情绪驱动风格化；研究强调**评价风格而非表情**（风格的情绪语义独立于内容表情）（衔接 224：风格体系的情绪维度；155：色彩心理的风格化）。

## 核心概念

### 风格-情绪对应

| 情绪 | 风格特征 |
|---|---|
| 忧郁 | 冷色/低饱和/柔和纹理 |
| 欢快 | 亮色/高饱和/明快笔触 |
| 紧张 | 高对比/锐利/深影 |
| 怀旧 | 褪色/颗粒/暖调 |

### 评价方法论（Imaging.org）

**评价风格的情绪（色彩/纹理/感受），非画面人物表情**——风格情绪独立于内容（衔接 175：表情 vs 风格分离）。

## 技巧与示例

### 情绪风格工作流（AI 映射）

```text
情绪目标 → 风格特征映射（表）
  → 风格词汇（224）→ 提示词
  → 生成 → 风格情绪校验（是否传情绪）
```

### 情绪驱动风格化

"忧郁" → "cool desaturated palette, soft textures, muted tones"——**情绪词转风格词**。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 情绪词直用 | 无效 | 转风格词 |
| 风格与情绪脱节 | 错位 | 映射表 |
| 混淆表情与风格 | 误评 | 分离评价 |
| 映射单一 | 单调 | 多维度 |
| 不校验情绪 | 效果未知 | 风格情绪检查 |

## 工作流应用（AI 映射）

风格选型（衔接 155/224/270）：

```text
情绪 → 风格特征映射 → 提示词
  → 生成 → 风格情绪校验
```

**DirectorX 纪律**：情绪转风格词汇；风格情绪独立于表情；多维映射；生成后校验。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 情绪驱动风格化 | Emotion-Driven Stylization | EmoStyle |
| 情感艺术 | Affective Art | 情绪数据集 |
| 风格情绪 | Style Emotion | 色彩/纹理感受 |
| 情绪映射 | Emotion Mapping | 情绪→风格 |
| 分离评价 | Separation Evaluation | 风格≠表情 |
| 风格语义 | Style Semantics | 视觉编码 |

## 来源

- arXiv — EmoStyle: Emotion-Driven Image Stylization（2512.05478）：https://arxiv.org/html/2512.05478v1
- Imaging.org — Emotionally Aware Portrait System Prototype：https://library.imaging.org/jpi/articles/8/0/000503
- OpenReview — AffectiveArt Challenge 2026：https://openreview.net/pdf?id=LbbHX8ofXZ
- arXiv — Multidimensional Dataset for Emotion-Aware Artistic Generation（2506.03652）：https://arxiv.org/html/2506.03652v1
- OpenReview — AffectiveArt Challenge 2026 (PDF)：https://openreview.net/pdf/9110652108c520870f912cce5f5efeb745f549cf.pdf