# 图生视频深度控制（Image-to-Video Control — First/Last Frame, Motion & Subject Lock）

> 本页为图生视频（I2V）的深度控制技术：首帧/末帧控制（First/Last Frame）、运动控制面板（Motion Panel）、参考图锁定（Reference Lock）、图像强度（Image Strength）平衡。知识本体来自 2026 I2V 工作流指南（CapCut Dreamina/Vidu/MagicHour/Seedance 指南）。AI 应用面向 DirectorX：生成门控的执行层——"只从图参考出发"的具体技术（衔接 107 关键帧、113 案例手册）。
> 来源：Dreamina「Start and End Frame AI Video Generation 2026」、Vidu「AI Animation Generator From Image」、MagicHour「How to Use Reference Images in I2V」、Seedance 2「First & Last Frame Guide」、EachLabs「I2V Prompt Guide」。

## 概述

**核心断言**：图生视频的核心不是"把图动起来"，而是**定义运动路径**——首帧/末帧锁定起止点，运动面板控制相机与主体运动，参考图锁定身份与风格。**图像强度（Image Strength）是忠实度与运动度的天平**：强度高 = 画面稳但动作小；强度低 = 动作大但易漂移。

## 核心概念

### 首帧/末帧控制（First/Last Frame）

- **首帧（First Frame）**：运动起点——锁定构图、主体状态、场景
- **末帧（Last Frame）**：运动终点——模型在两点之间插值（Interpolation）
- **效果**：中间帧由模型自动补——起止锁得越准，运动路径越可控

**要点**：末帧的设计不是"随便一张图"，而是**运动结束后主体应有的状态**（位置/姿态/表情/光照）——这直接对应 107 的"起/止关键帧"。

### 运动控制（Motion Control）

2026 主流模型提供运动面板/参数：
- **相机运动**：Pan（摇）/ Tilt（俯仰）/ Zoom（推拉）
- **主体运动**：方向、幅度、速度
- **运动强度**：0-1 之间平衡（高=剧烈/易变形，低=平稳/动作小）

### 参考图锁定（Reference Lock）

- **主体参考**：锁定角色/产品身份（衔接 39/108）
- **风格参考**：锁定视觉风格
- **图像强度**：参考图对生成的约束权重

## 技巧与示例

### 首末帧工作流（完整示例）

```text
目标：产品特写推镜，产品从侧面转到正面
  → 首帧：产品侧面特写，柔光，品牌色背景
  → 末帧：产品正面特写，同上光照环境
  → 提示词：相机推近（dolly in），产品顺时针转 45°，光照与背景保持
  → 图像强度：中高（产品形态是核心，不允许漂移）
  → 生成 → 审查：末帧是否到达、产品是否变形、光照是否一致
```

### 常见修正（MagicHour 工作流）

| 问题 | 修正 |
|---|---|
| 末帧没到达 | 提高末帧约束/降低运动强度 |
| 主体漂移 | 提高图像强度/加强身份块 |
| 光照突变 | 首末帧光照一致 + 提示词重复光照描述 |
| 动作幅度不够 | 降低图像强度/明确运动向量 |

### 关键帧插值（Keyframe Interpolation）

2026 趋势：用 3+ 张关键帧（起/中/止）而非仅首末——中间关键帧进一步约束运动路径，适合动作复杂的镜头（衔接 107：起/高潮/止三帧）。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 末帧随意选 | 运动路径失控 | 末帧 = 运动结束状态 |
| 图像强度一律默认 | 该稳的漂移/该动的僵 | 按镜头需求调强度 |
| 只锁首帧不锁末帧 | 终点不可控 | 首末双锁 |
| 提示词过度（overprompting） | 帧间漂移 | 提示词聚焦变化，静态信息靠参考图 |
| 忽略光照一致 | 画面突变 | 首末帧光照统一 |

## 工作流应用（AI 映射）

生成门控的执行层（衔接 107/115）：

```text
关键帧（起/高潮/止，107）→ 首末帧锁定
  → 运动声明（相机/主体/强度）
  → 参考图（主体/风格/产品锚）
  → 图像强度平衡（保真 vs 运动）
  → 生成 → 对照关键帧审查（到达/漂移/光照）
```

**DirectorX 纪律**：文本直出被禁止后，I2V 是主力路径——每镜必须先有关键帧（起/止至少），复杂动作用三帧插值。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 首帧 | First Frame | 运动起点 |
| 末帧 | Last Frame | 运动终点 |
| 关键帧插值 | Keyframe Interpolation | 多帧约束运动路径 |
| 图像强度 | Image Strength | 忠实度 vs 运动度天平 |
| 运动面板 | Motion Panel | 相机/主体运动控制 |
| 运动向量 | Motion Vector | 方向/幅度/速度 |
| 参考锁定 | Reference Lock | 身份/风格约束 |
| 过提示 | Overprompting | 提示词过度导致漂移 |

## 补充：参考图深度驱动（Reference-to-Video — Identity Lock & Subject Binding）

> 本节从 #183-reference-to-video-deep 合并而来。参考图是 I2V 一致性最强的控制面——"每个镜头独立生成 → 漂移"的解法是**参考锚定**。

### 参考图策略（Kittl 多角度参考集）

```
3-5 张高分辨率参考（多角度：正面/3-4/侧面）
均匀光照（阴影不影响身份判断）
主体清晰（无遮挡/无道具干扰）
+ 风格参考（Style Reference，125/126）
```

**为什么 3-5 张**：单张参考视角不全，模型无法建立完整身份表征；多角度覆盖让模型在不同机位下都能锁住"同一个"。

### 锁定工作流三件套

```
① 参考图锚定（身份）
② 主体绑定（Subject Binding，模型级）
③ 首帧续接（跨镜连续性）
```

### 主体绑定（Subject Binding — 模型级锁）

2026 模型级能力（如 Kling 3.0 Subject Binding）：模型在生成时将参考对象锁定为"同一个实体"，跨镜头保持身份不漂移。与参考图锚定的区别：锚定靠输入质量，绑定靠模型内部的身份编码。

### S2V（Subject-to-Video，Hailuo）

单一主体 → 视频的专项工作流：**参考主体 + 提示词动作**——消除多镜身份漂移。适用于需要同一角色跨多个镜头表演的场景（衔接 164 动作、132 表演）。

### 首帧续接（Last-Frame Continuity — 跨镜连续性）

**上一镜尾帧作下一镜首帧**——跨镜续接的核心手段。与本页首末帧控制配合：

```text
镜头 A 生成 → 取末帧
  → 末帧作为镜头 B 的首帧
  → 镜头 B 生成（运动路径从 A 终点开始）
  → 重复……
```

### Reference-to-Video 完整工作流

```text
参考图集（3-5 张多角度，服装状态一致 169）
  → 主体绑定（模型能力：Kling 3 Subject Binding）
  → 逐镜生成（参考注入 + 首帧续接）
  → 漂移检查（117 四类一致性）
  → 修正（绑定加强/换参考）
```

### 参考图常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 单张参考 | 视角不全 | 多角度 3-5 张 |
| 参考光照不均 | 身份误判 | 均匀光照 |
| 不绑定主体 | 漂移 | Subject Binding |
| 跨镜无续接 | 跳变 | 尾帧作首帧 |
| 参考与目标不符 | 锁错对象 | 参考匹配 |

### 补充术语

| 中文 | English | 说明 |
|---|---|---|
| 参考图集 | Reference Set | 多角度锚定 |
| 主体绑定 | Subject Binding | 模型级锁定 |
| 身份锁定 | Identity Lock | 身份不漂移 |
| 首帧续接 | Last-Frame Continuity | 尾帧作首帧 |
| S2V | Subject-to-Video | 主体→视频 |

### 补充来源

- Kling — VIDEO 3.0 Subject Binding: Character Consistency Guide：https://kling.ai/blog/kling-3-subject-binding-character-consistency
- Kittl — AI Video Character Consistency Workflow 2026：https://www.kittl.com/blogs/ai-video-character-consistency-workflow/
- Vidu — Reference to Video AI: Keep Characters Consistent：https://www.vidu.com/ai-reference-to-video
- Hailuo — How to Keep Your Model Consistent: S2V Workflow：https://hailuoai.video/pages/knowledge/model-consistency-ai-video-s2v-workflow
- MagicHour — How to Keep Characters Consistent in AI Video (2026)：https://magichour.ai/blog/how-to-keep-characters-consistent-in-ai-video

<!-- merged from: #183-reference-to-video-deep -->

## 来源

- CapCut Dreamina — Start and End Frame AI Video Generation Explained in 2026：https://dreamina.capcut.com/ai-video/ai-video-motion-control
- Vidu — AI Animation Generator From Image: Creator Workflow：https://www.vidu.com/blog/ai-animation-generator-from-image
- MagicHour — How to Use Reference Images in Image-to-Video (2026)：https://magichour.ai/blog/how-to-use-reference-images-in-image-to-video
- Seedance 2 — First & Last Frame: Control AI Video with Reference Images：https://seedance-2ai.org/blog/ai-video-first-last-frame-guide
- EachLabs — Image to Video Prompt Guide：https://www.eachlabs.ai/blog/image-to-video-prompt-guide-best-practices-for-realistic-results