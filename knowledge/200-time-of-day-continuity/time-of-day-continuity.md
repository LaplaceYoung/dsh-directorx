---
type: Reference
title: "AI 场景时间连续性（Time-of-Day Continuity — Lighting Plan & Time Flow）"
description: "AI 场景时间连续性：主参考光照计划（黄金时刻/蓝调/正午）、光方向/色温/阴影跨镜一致、帧间条件化锁定、桥接镜头防漂移、时间流逝叙事（Time Flow）"
tags:
  - "consistency"
  - "camera"
  - "lighting"
  - "continuity"
  - "narrative"
status: stable
stale_after: "2027-08-18"
generated:
  by: "process:directorx-knowledge-okf"
  at: "2026-08-18T00:00:00Z"
verified:
  - by: "process:knowledge-audit"
    at: "2026-08-18T00:00:00Z"
sources:
  - resource: "cited:Hailuo Golden Hour AI: Master Natural Light"
    id: cite-1
    title: "Golden Hour AI: Master Natural Light"
    author: "org:Hailuo"
  - resource: "cited:LongStories Avoid Continuity Errors in AI Videos"
    id: cite-2
    title: "Avoid Continuity Errors in AI Videos"
    author: "org:LongStories"
  - resource: "cited:Skywork Veo 3.1 Multi-Prompt Consistency"
    id: cite-3
    title: "Veo 3.1 Multi-Prompt Consistency"
    author: "org:Skywork"
  - resource: "cited:Kling Cinematic Prompt Guide"
    id: cite-4
    title: "Cinematic Prompt Guide"
    author: "org:Kling"
  - resource: "https://hailuoai.video/pages/knowledge/ai-video-golden-hour-lighting"
    id: url-1
    title: "hailuoai.video"
  - resource: "https://longstories.ai/blog/avoid-continuity-errors-ai-generated-videos"
    id: url-2
    title: "longstories.ai"
  - resource: "https://skywork.ai/blog/multi-prompt-multi-shot-consistency-veo-3-1-best-practices/"
    id: url-3
    title: "skywork.ai"
  - resource: "https://kling.ai/blog/kling-ai-prompt-guide"
    id: url-4
    title: "kling.ai"
  - resource: "https://magichour.ai/blog/cinematic-ai-video-prompt-cookbook"
    id: url-5
    title: "magichour.ai"
dx_id: "200"
related:
  - "123-longform-consistency/longform-consistency.md"
  - "125-lighting-atmosphere-prompt/lighting-atmosphere-prompt.md"
  - "170-light-matching/light-matching.md"
---

# AI 场景时间连续性（Time-of-Day Continuity — Lighting Plan & Time Flow）

> 本页为 AI 场景时间连续性：主参考光照计划（黄金时刻/蓝调/正午）、光方向/色温/阴影跨镜一致、帧间条件化锁定、桥接镜头防漂移、时间流逝叙事（Time Flow）。知识本体来自 2026 光照连续性指南（Hailuo/Kling/LongStories/Skywork）。AI 应用面向 DirectorX：跨镜场景（衔接 123 场景卡、125 光线、170 光匹配、200 对应）。
> 来源：Hailuo「Golden Hour AI: Master Natural Light」、LongStories「Avoid Continuity Errors in AI Videos」、Skywork「Veo 3.1 Multi-Prompt Consistency」、Kling「Cinematic Prompt Guide」。

## 概述

**核心断言**：时间连续性 = **光照计划一致**——主参考帧定义太阳角度与氛围，光方向/色温/阴影跨镜不变；**用帧间条件化（I2V）锁定光照与镜头语法**；桥接镜头（重叠/中间帧）防漂移（衔接 125：光照提示词的连续性维度；170：实拍光匹配同构）。

## 核心概念

### 光照计划（Master Reference）

```text
主参考帧（定义太阳角度/色温/氛围）
  → 场景卡记录（123：时段/光向/色温）
  → 跨镜保持（光方向/阴影一致）
  → 桥接（重叠帧/中间帧防漂移）
```

### 时间流逝叙事（Time Flow）

| 时段 | 氛围 | 叙事 |
|---|---|---|
| 黄金时刻 | 暖/低角光 | 浪漫/告别 |
| 蓝调时刻 | 冷/柔和 | 过渡/沉思 |
| 正午 | 高角硬光 | 现实/压力 |
| 夜晚 | 人造光 | 秘密/紧张 |

## 技巧与示例

### 时间连续工作流（LongStories 防错）

```text
连续性参考文档（时段/光向/色温/阴影）
  → 主参考帧 → 帧间条件化（I2V）
  → 逐镜生成（提示词含光照计划）
  → 桥接镜头（防漂移）
  → 光一致性检查（125/170）
```

### 时间流逝的跨镜表达

同一场景跨时段（黄昏→夜）：**分段光照计划**，每段独立锁定，桥接镜头过渡（衔接 123 场景卡多时段版本）。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 无光照计划 | 跨镜光跳 | 主参考帧 |
| 光向漂移 | 阴影矛盾 | 光向锁定 |
| 无桥接 | 时段跳变 | 桥接帧 |
| 色温不一致 | 色调乱 | 色温锁定 |
| 时段无叙事 | 无意义 | 时间流逝叙事 |

## 工作流应用（AI 映射）

跨镜场景（衔接 123/125/170）：

```text
时段规划（叙事）→ 光照计划（主参考）
  → 场景卡（123）→ 帧间条件化
  → 逐镜生成 → 桥接 → 光一致性检查
```

**DirectorX 纪律**：光照计划先行；光向/色温/阴影锁定；桥接防漂移；时间流逝即叙事。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 光照计划 | Lighting Plan | 主参考定义 |
| 黄金时刻 | Golden Hour | 暖低角光 |
| 蓝调时刻 | Blue Hour | 冷柔和光 |
| 帧间条件化 | Frame Conditioning | I2V 锁定 |
| 桥接镜头 | Bridge Shot | 防漂移过渡 |
| 时间流逝 | Time Flow | 时段叙事 |

## 来源

- Hailuo — Golden Hour AI: Master Natural Light for Cinematic Video：https://hailuoai.video/pages/knowledge/ai-video-golden-hour-lighting
- LongStories — How to Avoid Continuity Errors in AI-Generated Videos：https://longstories.ai/blog/avoid-continuity-errors-ai-generated-videos
- Skywork — Veo 3.1 Multi-Prompt Storytelling Best Practices：https://skywork.ai/blog/multi-prompt-multi-shot-consistency-veo-3-1-best-practices/
- Kling — AI Prompt Guide: Cinematic Video Secrets：https://kling.ai/blog/kling-ai-prompt-guide
- MagicHour — Cinematic AI Video Prompt Cookbook (2026)：https://magichour.ai/blog/cinematic-ai-video-prompt-cookbook

## 相关概念

- [AI 长视频与多镜叙事一致性（Long-Form AI Video — Multi-Shot Narrative Consistency）](../123-longform-consistency/longform-consistency.md)
- [AI 光线与氛围提示词体系（Lighting & Atmosphere Prompts — Cinematic Illumination）](../125-lighting-atmosphere-prompt/lighting-atmosphere-prompt.md)
- [AI 实拍光线匹配（Light Matching — HDRI Extraction & Scene Relighting）](../170-light-matching/light-matching.md)
