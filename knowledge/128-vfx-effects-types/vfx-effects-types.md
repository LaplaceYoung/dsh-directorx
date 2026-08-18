---
type: Method
title: "AI 特效类型生成深化（VFX Types — Weather, Particles, Magic & Destruction Prompts）"
description: "AI 特效分类型生成技巧库：天气（雨/雪/风暴）、粒子（火花/尘埃/魔法）、能量（冲击波/光环）、破坏（爆炸/碎裂）、环境互动——每类给出提示词结构与注意点"
tags:
  - "production"
  - "prompt"
  - "vfx"
status: stable
stale_after: "2027-08-18"
generated:
  by: "process:directorx-knowledge-okf"
  at: "2026-08-18T00:00:00Z"
verified:
  - by: "process:knowledge-audit"
    at: "2026-08-18T00:00:00Z"
sources:
  - resource: "cited:LazyPrompt AI Video VFX Prompts"
    id: cite-1
    title: "AI Video VFX Prompts"
    author: "org:LazyPrompt"
  - resource: "cited:Carat VFX Video Prompts"
    id: cite-2
    title: "VFX Video Prompts"
    author: "org:Carat"
  - resource: "cited:Wondershare 120+ Video Prompts"
    id: cite-3
    title: "120+ Video Prompts"
    author: "org:Wondershare"
  - resource: "cited:ReelMind AI Particle Effects"
    id: cite-4
    title: "AI Particle Effects"
    author: "org:ReelMind"
  - resource: "cited:Vidwave Veo 3.1 Weather Effects"
    id: cite-5
    title: "Veo 3.1 Weather Effects"
    author: "org:Vidwave"
  - resource: "https://lzyprompt.com/blog/ai-video-prompts-vfx-effects/"
    id: url-1
    title: "lzyprompt.com"
  - resource: "https://carat.im/en/prompt-gallery/vfx"
    id: url-2
    title: "carat.im"
  - resource: "https://filmora.wondershare.com/video-prompts.html"
    id: url-3
    title: "filmora.wondershare.com"
  - resource: "https://reelmind.ai/blog/ai-generated-particle-effects-add-professional-sparkles-dust-or-magic-to-any-scene"
    id: url-4
    title: "reelmind.ai"
  - resource: "https://vidwave.ai/veo3-weather-effects-create-snow-rain-and-storm-scenes"
    id: url-5
    title: "vidwave.ai"
dx_id: "128"
related:
  - "110-ai-vfx-pipeline/ai-vfx-pipeline.md"
  - "118-defect-repair/defect-repair.md"
---

# AI 特效类型生成深化（VFX Types — Weather, Particles, Magic & Destruction Prompts）

> 本页为 AI 特效分类型生成技巧库：天气（雨/雪/风暴）、粒子（火花/尘埃/魔法）、能量（冲击波/光环）、破坏（爆炸/碎裂）、环境互动——每类给出提示词结构与注意点。知识本体来自 2026 VFX 提示词指南（LazyPrompt/Carat/Wondershare/ReelMind）。AI 应用面向 DirectorX：特效镜头的生成层（衔接 110 VFX 管线、118 缺陷修复）。
> 来源：LazyPrompt「AI Video VFX Prompts」、Carat「VFX Video Prompts」、Wondershare「120+ Video Prompts」、ReelMind「AI Particle Effects」、Vidwave「Veo 3.1 Weather Effects」。

## 概述

**核心断言**：特效生成的关键是**物理感与层次**——不是"有特效"，而是"特效与环境互动"（雨打地面溅起、爆炸震动物体）。分类型提示词 + 物理描述 = 可信特效；无物理描述 = 贴图感。

## 核心概念

### 特效类型与提示词结构

**通用结构**：特效类型 + 出现方式 + 物理互动 + 强度 + 持续时间

| 类型 | 提示词要点 |
|---|---|
| 雨 | rain streaks, wet surfaces, rain hitting ground, splashes, droplets on lens |
| 雪 | falling snow, snow accumulating, wind-blown flakes, soft atmosphere |
| 风暴/闪电 | storm clouds, lightning flash, thunder, wind-blown debris |
| 火花 | sparks flying, contact point, embers drifting |
| 尘埃/魔法 | dust motes in light, magical particles, sparkles materializing |
| 能量冲击波 | energy blast, shockwave ring, light distortion, particles expanding |
| 爆炸/破坏 | explosion, debris flying, dust cloud, shockwave, fireball |
| 变身/变形 | morphing, particles forming into shape, transformation glow |

## 技巧与示例

### 天气特效示例（Veo 3.1 模式）

```
"雨夜街道：暴雨倾盆，雨水打在地面溅起水花，车窗雨珠滑落，
 闪电照亮街景，风卷起垃圾，冷调高对比"
```

**要点**：天气特效加**环境互动**（雨打地面/风卷物体）——互动让天气"真"。

### 粒子特效示例（ReelMind 模式）

```
"魔法粒子从手心凝聚成形：金色粒子从四周汇聚，沿手臂向上流动，
 粒子在光线中闪烁，尘埃微粒悬浮，柔焦光晕"
```

**要点**：粒子的**来源与去向**明确（从哪来/到哪去），不是凭空出现。

### 破坏特效（LazyPrompt 物理驱动）

```
"爆炸：撞击点先闪白光，冲击波以环状扩散，碎片向镜头飞来，
 灰尘云升起，周围物体被震离原位，慢动作"
```

**要点**：**时序**（先白闪→冲击波→碎片→尘埃）与**物理反应**（物体被震开）——衔接 110 的 sell-the-hit。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 特效无物理互动 | 贴图感 | 加环境互动/物理反应 |
| 粒子无来源去向 | 凭空出现 | 明确汇聚/消散路径 |
| 特效无时序 | 爆发无层次 | 白闪→冲击→碎片→尘埃 |
| 强度失控 | 画面过曝/杂乱 | 强度/持续时间显式 |
| 特效与主体抢戏 | 主体丢失 | 特效服务主体（110 分层） |

## 工作流应用（AI 映射）

特效镜头生成（衔接 110 分层纪律）：

```text
特效需求（类型/强度/位置）
  → 分类型提示词（特效+出现方式+物理互动+强度+时长）
  → 时序设计（爆发顺序）
  → 主体保护（110 分层：主体层不动，特效层叠加）
  → 生成 → 审片（物理可信/主体未变/缺陷扫描 118）
```

**DirectorX 纪律**：特效先定类型与物理互动再生成；分层优先（特效层 + 主体层合成）；特效服务叙事。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 粒子特效 | Particle Effect | 火花/尘埃/魔法粒子 |
| 冲击波 | Shockwave | 环状能量扩散 |
| 物理互动 | Physical Interaction | 特效与环境反应 |
| 材质化 | Materialize | 粒子凝聚成形 |
| 爆发时序 | Explosion Sequence | 白闪→冲击→碎片→尘埃 |
| 光晕 | Glow / Halo | 柔光边缘 |

## 来源

- LazyPrompt — AI Video VFX Prompts: Explosions, Smoke, Magic, Particles：https://lzyprompt.com/blog/ai-video-prompts-vfx-effects/
- Carat — VFX Video Prompts：https://carat.im/en/prompt-gallery/vfx
- Wondershare — AI Video Prompts (120+)：https://filmora.wondershare.com/video-prompts.html
- ReelMind — AI-Generated Particle Effects: Sparkles, Dust, Magic：https://reelmind.ai/blog/ai-generated-particle-effects-add-professional-sparkles-dust-or-magic-to-any-scene
- Vidwave — Veo 3.1 Weather Effects: Snow, Rain & Storm：https://vidwave.ai/veo3-weather-effects-create-snow-rain-and-storm-scenes

## 相关概念

- [AI 视觉特效管线（VFX Pipeline — Roto / Matchmove / Comp & AI Application）](../110-ai-vfx-pipeline/ai-vfx-pipeline.md)
- [生成缺陷识别与修复（AI Video Artifacts — Diagnose, Fix, Regenerate）](../118-defect-repair/defect-repair.md)
