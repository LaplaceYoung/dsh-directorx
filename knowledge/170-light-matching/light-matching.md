# AI 实拍光线匹配（Light Matching — HDRI Extraction & Scene Relighting）

> 本页为 AI 实拍光线匹配：从实拍素材提取光信息（方向/色温/亮度）、HDRI 生成与重打光（Relighting）、NeRF/光场估计、扩散条件化光照、时空光照一致性。知识本体来自 2026 光照估计研究（EverLight/LiMo/ReelMind/arXiv）。AI 应用面向 DirectorX：混合制作（衔接 57 混合制作、125 光线、165 环境）。
> 来源：arXiv「Lighting in Motion (LiMo)」、arXiv「Video Generation Models Are Inherent Lighting Estimators」、EverLight「Indoor-Outdoor HDR Lighting Estimation」、ReelMind「Extract HDRI from Ordinary Footage」。

## 概述

**核心断言**：混合制作（163）的"假"感 90% 来自**光不匹配**——实拍演员的光与 AI 环境的光各说各话。解决方案：**从实拍素材估计光（方向/色温/亮度）→ 生成匹配 HDRI → 重打光 AI 环境**。2026 关键进展：视频模型本身是隐式光照估计器（Video Models Are Inherent Lighting Estimators）——从普通画面直接提取光。

## 核心概念

### 光匹配管线

```text
① 光估计（从实拍：方向/色温/亮度/阴影）
② HDRI 生成/选择（匹配环境）
③ 重打光（Relight AI 环境/合成主体）
④ 时空一致性（光照随时间稳定）
```

### 光估计方法

| 方法 | 原理 | 适用 |
|---|---|---|
| HDRI 估计（EverLight） | 室内外 HDR 光 | 静态环境 |
| 时空估计（LiMo） | 视频逐帧光 | 动态场景 |
| 隐式估计 | 视频模型自带 | 快速提取 |

## 技巧与示例

### 实拍 → AI 环境光匹配（ReelMind）

```text
实拍素材 → 光分析（方向/色温/亮度）
  → 生成/选择 HDRI（匹配）
  → AI 环境重打光（受光方向一致）
  → 阴影/反射校验（接缝检查）
  → 合成（163）→ 调色统一（141）
```

### 检查光匹配的三大信号

- 阴影方向一致（主体与环境的影子同侧）
- 色温一致（肤色与环境光白平衡）
- 高光/反射一致（金属/眼球的受光点）

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 忽略光估计 | 拼接感 | 先估光再生成 |
| 阴影方向不一致 | 物理穿帮 | 同侧阴影校验 |
| 色温不匹配 | 肤色怪异 | 白平衡统一 |
| 静态光当动态用 | 时空不一致 | 逐帧估计（LiMo） |
| 合成后不查接缝 | 光缝明显 | 反射/高光检查 |

## 工作流应用（AI 映射）

混合制作光层（衔接 125/141/163）：

```text
实拍 → 光估计（方向/色温/亮度）
  → HDRI 匹配 → AI 环境重打光
  → 时空一致性 → 合成（163）
  → 调色统一（141）→ 光校验
```

**DirectorX 纪律**：光先行（估计→匹配→重打）；阴影/色温/反射三信号校验；时空一致性保真实。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 重打光 | Relighting | 重新照明 |
| HDRI | HDRI | 高动态光照图 |
| 光估计 | Lighting Estimation | 从画面提取光 |
| 时空一致性 | Spatiotemporal Consistency | 逐帧光稳定 |
| 光场 | Light Field | 全向光信息 |
| 受光方向 | Light Direction | 主光方位 |

## 来源

- arXiv — Lighting in Motion: Spatiotemporal HDR Lighting Estimation (LiMo, 2512.13597)：https://arxiv.org/html/2512.13597v1
- arXiv — Video Generation Models Are Inherent Lighting Estimators (2607.04674)：https://arxiv.org/html/2607.04674
- EverLight — Indoor-Outdoor Editable HDR Lighting Estimation (ICCV 2023)：https://openaccess.thecvf.com/content/ICCV2023/papers/Dastjerdi_EverLight_Indoor-Outdoor_Editable_HDR_Lighting_Estimation_ICCV_2023_paper.pdf
- ReelMind — Extract HDRI from Ordinary Footage：https://reelmind.ai/blog/ai-generated-video-light-analysis-extract-hdri-from-ordinary-footage
- ReelMind — AI-Powered Video Light Direction Analysis：https://reelmind.ai/blog/ai-powered-video-light-direction-analysis-consistency-tools