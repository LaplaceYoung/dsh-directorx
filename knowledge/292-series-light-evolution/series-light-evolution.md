# AI 图片系列光影演变（Light Evolution in Series — Mood Progression via Lighting）

> 本页为 AI 图片系列的光影演变：光随情绪演进（暖→冷/硬→软/运动光）、色温-对比信号弧线（黎明暖→正午中性→黄昏冷）、多光源渐变、连续性保持。知识本体来自 2026 光影提示词（Text2Img/ReelMind/GensGPT）。AI 应用面向 DirectorX：系列光影（衔接 261 光位、292 对应、275 情绪弧、200 时段）。
> 来源：Text2Img「Master Lighting and Mood in AI Prompts」、ReelMind「The Art of AI Lighting」、GensGPT「Lighting Mastery for AI Image」、Armox「Change the Lighting」。

## 概述

**核心断言**：光影可**随情绪弧演变**——固定主体/环境，变化光源（暖→冷、硬→软、运动光），色温-对比协调信号时间/弧线（黎明暖→正午中性→黄昏冷）（衔接 275：情绪弧的光影维度；200：时段）。

## 核心概念

### 光影演变轴

```
光源变化（暖→冷）
阴影变化（硬→软）
运动光（扫光/闪烁）
强度渐变（多光源分层）
```

### 色温-弧线映射（Text2Img）

| 时段/弧线 | 色温 |
|---|---|
| 黎明/新生 | 暖低 |
| 正午/平稳 | 中性 |
| 黄昏/衰变 | 冷 |
| 夜晚/悬疑 | 冷暗 |

## 技巧与示例

### 光影演变工作流

```text
情绪弧（275）→ 光影演变设计（轴）
  → 每帧光提示词（261）→ 生成
  → 连续性校验（238/200）
```

### 演变示例（6 帧）

"dawn warm → morning neutral → noon bright → dusk cool → night dark → dawn return"——**光随弧线走**。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 光跳变 | 断裂 | 渐变设计 |
| 光与弧线脱节 | 情绪错 | 弧线映射 |
| 阴影突变 | 不连续 | 渐进 |
| 忽略色温 | 无信号 | 色温协调 |
| 不校验连续 | 跳帧 | 连续性检查 |

## 工作流应用（AI 映射）

系列光影（衔接 200/238/261/275）：

```text
情绪弧 → 光影演变 → 逐帧光 → 生成 → 连续性校验
```

**DirectorX 纪律**：光随情绪弧；色温-对比协调信号；渐进渐变；连续性保持。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 光影演变 | Light Evolution | 系列光变 |
| 运动光 | Movement-Based Light | 扫光闪烁 |
| 色温信号 | Temperature Signal | 弧线指示 |
| 强度渐变 | Intensity Gradient | 多光源分层 |
| 光弧线 | Light Arc | 光随情绪 |
| 连续性保持 | Continuity Keep | 防跳变 |

## 来源

- Text2Img — Master Lighting and Mood in AI Image Prompts (2026)：https://www.text2img.pro/master-lighting-and-mood-in-ai-image-prompts-2026/
- ReelMind — The Art of AI Lighting: Enhancing Visual Storytelling：https://reelmind.ai/blog/the-art-of-ai-lighting-enhancing-visual-storytelling
- GensGPT — Lighting Mastery for AI Image Generation (2026)：https://www.gensgpt.com/blog/lighting-mastery-ai-image-generation-2026-guide
- Armox — Change the Lighting: 3D Renders & Photos (2026)：https://armox.ai/blog/change-the-lighting
- Text2Img — Cinematic Movie-Style Images with AI (2026)：https://www.text2img.pro/cinematic-ai-images-2026-10/