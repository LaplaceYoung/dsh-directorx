# AI 图片构图心理学应用（Composition Psychology Applied — GazeFusion & Saliency-Guided Design）

> 本页为 AI 图片的构图心理学应用：显著引导生成（GazeFusion：saliency 先验控制视线）、眼动/格式塔影响注意（实证）、视线方向+取景提示（引导构图）、预测注意（Adobe 研究）。知识本体来自 2026 注意研究（PMC/arXiv GazeFusion/Adobe）。AI 应用面向 DirectorX：注意力工程（衔接 246 构图心理、346 对应、216 构图、271 权重）。
> 来源：PMC「Eye Movement: Gestalt in Photography」、arXiv「GazeFusion: Saliency-Guided Image Generation」、PMC「Leading Line Composition」、Adobe「Predicting Attention in Photos」。

## 概述

**核心断言**：构图心理学应用 = **"显著引导生成"**——GazeFusion 类方法（saliency 先验+扩散模型）控制观众看哪里；眼动/格式塔实证引导构图；视线方向提示（主体左视+左侧空间）（衔接 246：实证→工具；271：权重）。

## 核心概念

### 显著引导（GazeFusion）

```
Saliency 先验（显著图）+ 扩散模型
→ 控制生成图像的视线落点
（衔接 246 眼动实证的工具化）
```

### 注意预测（Adobe）

AI+众包预测"人们看什么/记住什么"——**"注意可预测"**（衔接 271）。

### 视线提示（Prompt）

"subject looks left with space on that side" 引导构图注意——**"视线即引导"**。

## 技巧与示例

### 注意力工程工作流

```text
注意目标（先看哪）→ saliency 设计
  → 视线/引导线提示（216）
  → 生成 → 视线校验（眼动测试）
```

### 引导示例

"saliency-guided: subject on right third, gaze left, leading lines toward face"——**显著+视线+引导**。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 无显著设计 | 视线散 | Saliency |
| 视线乱指 | 注意错 | 方向提示 |
| 无引导线 | 路径断 | 216 |
| 忽视格式塔 | 分组乱 | 接近相似 |
| 不校验注意 | 效果未知 | 眼动检查 |

## 工作流应用（AI 映射）

注意力工程（衔接 216/246/271）：

```text
目标 → Saliency → 视线/引导 → 生成 → 校验
```

**DirectorX 纪律**：注意可预测；saliency 引导；视线即引导；格式塔协同。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 显著引导 | Saliency-Guided | 视线控制 |
| 显著图 | Saliency Prior | 注意先验 |
| 注意预测 | Attention Prediction | 众包实证 |
| 视线方向 | Gaze Direction | 构图引导 |
| 格式塔 | Gestalt | 分组感知 |
| 眼动校验 | Eye-Tracking Check | 效果验证 |

## 来源

- PMC — Eye Movement: Gestalt Properties in Photography：https://pmc.ncbi.nlm.nih.gov/articles/PMC10644408/
- arXiv — GazeFusion: Saliency-Guided Image Generation（2407.04191）：https://arxiv.org/abs/2407.04191
- PMC — Impact of Leading Line Composition on Visual Cognition：https://pmc.ncbi.nlm.nih.gov/articles/PMC11763225/
- Adobe — Look Here: Predicting Attention in Photos：https://research.adobe.com/news/look-here-researcher-predicts-what-attracts-attention-in-photos-and-designs/
- NYU-ICL — Saliency-Guided Image Generation（GazeFusion GitHub）：