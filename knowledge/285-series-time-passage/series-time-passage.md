# AI 图片系列时间流逝（Time Passage in Series — Seasons, Aging & Time-Lapse Storyboards）

> 本页为 AI 图片系列的时间流逝：同场景季节流转/角色老化（保身份改背景）、时间流逝故事板（6-8 帧：春→夏→秋→冬+老化）、多遍生成（身份→老化→季节→光照统一）。知识本体来自 2026 时间流逝指南（MagicShot/AIPhotoGenerator/GenVR）。AI 应用面向 DirectorX：时间图集（衔接 245 时间、285 对应、238 系列一致、200 时段）。
> 来源：MagicShot「Age Journey」、AIPhotoGenerator「Picture Age Progression with AI 2026」、GenVR「Aging Through Years」、Vivago「Time-Lapse Season Transitions」。

## 概述

**核心断言**：时间流逝系列 = **"保身份改时间"**——固定取景/光照一致，变化季节线索（树/天/雪/花）与老化线索（肤质/发色）；6-8 帧时间流逝故事板（春→夏→秋→冬+逐年老化）（衔接 245：时间的图片可视化；238：身份保持）。

## 核心概念

### 时间流逝三要素

```
① 身份保持（同一人/同一场景，238）
② 时间线索（季节/老化渐变）
③ 光照统一（200：时段一致）
```

### 时间流逝故事板

```text
6-8 帧：春（新生）→ 夏（繁盛）→ 秋（衰变）→ 冬（荒芜）
+ 人物老化（逐年）
2x3 网格多时间步
```

### 多遍生成（AIPhotoGenerator）

身份→老化→季节→光照统一——**分层叠加**（衔接 262 多遍）。

## 技巧与示例

### 时间流逝工作流

```text
固定取景 → 身份基线（238）
  → 老化遍 → 季节遍 → 光照统一（200）
  → 逐帧生成 → 时间感校验
```

### 提示词结构

"same person, spring blossoms in background, soft morning light"→"same person, autumn leaves, golden hour"——**身份词固定+时间词变化**。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 身份漂移 | 不像同一人 | 身份锁定 |
| 时间跳变 | 无渐变 | 递进帧 |
| 光照乱 | 时段矛盾 | 统一（200） |
| 老化过度 | 失真 | 自然渐变 |
| 无取景固定 | 无对照 | 固定构图 |

## 工作流应用（AI 映射）

时间图集（衔接 200/238/245）：

```text
固定取景 → 身份基线 → 老化/季节遍
  → 光照统一 → 逐帧 → 时间校验
```

**DirectorX 纪律**：保身份改时间；递进渐变；光照统一；固定取景对照。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 时间流逝 | Time Passage | 时间可视化 |
| 老化进展 | Age Progression | 逐年渐变 |
| 季节流转 | Season Transition | 自然变化 |
| 时间故事板 | Time-Lapse Storyboard | 6-8 帧 |
| 身份保留 | Identity Retention | 同一人 |
| 多遍叠加 | Multi-Pass Layering | 分层生成 |

## 来源

- MagicShot — Age Journey: AI Age Progression Generator：https://magicshot.ai/ai-image-generator/age-journey
- AIPhotoGenerator — Picture Age Progression with AI in 2026：https://www.aiphotogenerator.net/blog/2026/04/picture-age-progression
- GenVR — Aging Through Years (2x3 Grid)：https://genvr.ai/models/image-templates/aging-through-years
- Vivago — AI Time-Lapse Changing Seasons Animation：https://vivago.ai/effects/video/558f8474-bccc-4774-8ba8-d0ea357a4577
- Kling — AI Video & Image Generator：https://kling.ai/