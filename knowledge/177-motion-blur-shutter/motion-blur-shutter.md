# AI 动态模糊与快门速度（Motion Blur & Shutter — 180° Rule in AI Generation）

> 本页为 AI 视频的动态模糊与快门速度控制：180° 快门规则（快门≈1/(2×帧率)）、动态模糊的"电影感"作用、高帧率的快门灵活性、AI 生成中的模糊提示词。知识本体来自 2026 快门指南（Swarmify/Wipster/XDynamics/True the Lens）。AI 应用面向 DirectorX：运动真实感（衔接 133 物理、168 运镜、176 景深）。与 133/180 分工：本页为曝光物理（快门/模糊），133 为相机运动物理（惯性/轨迹），180 为物体物理模拟（发/布/流体）。
> 来源：Swarmify「Shutter Speed for Video: 180-Degree Rule 2026」、Wipster「Debunking the 180-Degree Shutter Rule」、True the Lens「Mastering Motion Blur」、ReelMind「Digital Cinematography Shutter Angles」。

## 概述

**核心断言**：动态模糊（Motion Blur）是"电影感"的隐形成分——快门速度决定模糊量，模糊让运动连贯、帧间不跳。**180° 规则（快门 ≈ 1/(2×帧率)）是参考不是铁律**：24fps → 1/48s，30fps → 1/60s，60fps → 1/120~125s；高帧率需更多光/ND 滤镜。AI 生成时代：**模糊量是提示词可控制的"质感参数"**（衔接 176 景深同属镜头物理）。

## 核心概念

### 180° 快门规则

| 帧率 | 快门（180°） | 说明 |
|---|---|---|
| 24fps | 1/48s | 电影标准 |
| 30fps | 1/60s | 电视标准 |
| 60fps | 1/120~125s | 高帧率/慢动作 |
| 规则本质 | 快门 ≈ 1/(2×帧率) | 自然模糊量参考 |

### 模糊 vs 清晰的控制面

- **模糊多**：运动流畅、电影感、利于压缩（但信息少）
- **模糊少/无**：动作清晰、科技感/纪录片感、帧间跳动感
- **高帧率慢动作**：更短快门 = 更少模糊 = 逐帧锐利（常用于动作回放）

## 技巧与示例

### AI 提示词控制模糊

```text
自然模糊："natural motion blur, 180-degree shutter look"
减少模糊："crisp motion, minimal blur, high shutter speed look"
强化动态："heavy motion blur streaks, fast movement energy"
```

### 压缩与模糊的权衡（Swarmify 关键点）

动态模糊利于压缩编码（运动平滑）——但**数字工作流与压缩会影响感知模糊质量**；调整快门/模糊量时兼顾编码效果。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 全片无模糊 | 帧间跳/科技感 | 自然模糊量 |
| 盲目追求 180° | 高帧率过曝 | 结合曝光/ND |
| 模糊过量 | 细节丢失 | 按运动量调 |
| 忽略压缩交互 | 模糊变花 | 兼顾编码 |
| 慢动作无锐化 | 糊成一片 | 高帧率短快门 |

## 工作流应用（AI 映射）

运动质感（衔接 133/168/176）：

```text
镜头意图（正常/慢动作/高速）→ 快门决策（180° 参考）
  → 模糊提示词注入 → 生成
  → 模糊量校验（运动是否连贯）
  → 编码检查 → 交付
```

**DirectorX 纪律**：180° 是参考非铁律；模糊=电影感隐形成分；高帧率配短快门；兼顾压缩。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 动态模糊 | Motion Blur | 运动残影 |
| 快门角度 | Shutter Angle | 180° 规则 |
| 180° 规则 | 180° Rule | 快门≈1/(2×帧率) |
| ND 滤镜 | ND Filter | 减光镜 |
| 帧率 | Frame Rate | fps |
| 快门速度 | Shutter Speed | 曝光时间 |

## 来源

- Swarmify — Shutter Speed for Video: The 180-Degree Rule Guide (2026)：https://swarmify.com/blog/shutter-speed-for-video/
- Wipster — Debunking the 180-Degree Shutter Rule：https://www.wipster.io/blog/debunking-the-180-degree-shutter-rule
- True the Lens — Mastering Motion Blur: The 180-Degree Shutter Rule：https://www.truethelens.com/lessons/the-180-degree-shutter-rule-mastering-motion-blur-for-cinematic-video
- XDynamics — The 180 Degree Shutter Rule：https://www.xdynamics.com/uncategorized/the-180-degree-shutter-rule/
- ReelMind — Digital Cinematography Shutter Angles: AI Explanations：https://reelmind.ai/blog/digital-cinematography-shutter-angles-ai-explanations