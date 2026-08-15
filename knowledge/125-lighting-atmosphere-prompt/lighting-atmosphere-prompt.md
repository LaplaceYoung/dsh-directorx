# AI 光线与氛围提示词体系（Lighting & Atmosphere Prompts — Cinematic Illumination）

> 本页为 AI 视频光线与氛围的完整提示词体系：光质/时段（黄金时刻/蓝调）、氛围光（霓虹/体积光/雾）、经典布光（三点/伦勃朗/剪影/轮廓光）、情绪化光色。知识本体来自 2026 灯光提示词指南（Kling/Visionary/ZSky/ATLabs/Hailuo）。AI 应用面向 DirectorX：逐镜光线提示词库（衔接 84 布光、93 光线叙事、98 自然光、115 六段式）。
> 来源：Kling「AI Video Lighting Prompts」、Visionary「Cinematic Lighting Glossary」、ZSky「38 AI Lighting Prompts」、ATLabs「27 Cinematic Lighting Looks」、Hailuo「Golden Hour AI」。

## 概述

**核心断言**：AI 视频画面"平/假"的首要原因是**光不具体**——只写"电影感"没有光信息。专业灯光提示词 = 光源类型 + 光质 + 方向 + 色温 + 氛围修饰。**光线是叙事的**（93）：同样的场景，冷光=疏离，暖光=亲密。

## 核心概念

### 时段光（自然光）

| 时段 | 提示词特征 | 情绪 |
|---|---|---|
| 黄金时刻 | warm 3000-3500K, low sun angle, long shadows, backlit, dust, soft diffusion | 温暖/浪漫 |
| 蓝调时刻 | cool 7500-10000K, soft ambient glow, city lights, atmospheric haze | 忧郁/神秘 |
| 正午 | hard overhead light, high contrast | 生硬/纪实 |
| 夜晚 | moonlight/streetlight/practical lights | 神秘/危险 |

### 经典布光（可提示词化）

| 布光 | 提示词 |
|---|---|
| 三点布光 | warm key light, cool fill light, back/edge light for separation |
| 伦勃朗 | Rembrandt lighting, triangle of light on cheek |
| 轮廓光 | rim lighting, thin bright outline, dark background |
| 剪影 | backlit silhouette, sun behind subject, shallow depth of field |
| 体积光 | volumetric light, god rays, light beams through fog |
| 霓虹 | high-contrast neon rims, saturated pink/blue, volumetric beams |
| 低调光 | low-key lighting, deep shadows, high contrast |
| 实用光 | practical lights, visible lamps/LEDs, color spill |

## 技巧与示例

### 光线公式（Kling 模式）

```
光源 + 光质 + 方向 + 色温 + 氛围
光源（sun/neon/practical） + 光质（soft/hard/volumetric）
+ 方向（backlit/rim/side） + 色温（warm/cool） + 氛围（haze/fog/dust）
```

**示例**：
```
"黄金时刻，低角度太阳，背光剪影，暖 3200K，空气尘埃，柔和散射"
"霓虹雨夜，粉蓝双色霓虹轮廓光，体积光穿过雾气，冷调高对比"
```

### 光效叠加（ZSky 实测要点）

- **一次一个主光**：多光叠加易乱——定主光源，其他为辅助
- **情绪优先**：先定情绪（温暖/冷酷/神秘），再选光的组合
- **一致性**：同一场景跨镜重复相同光线描述（衔接 117）

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 只写"电影感" | 画面平 | 光源+光质+方向+色温+氛围 |
| 多光源堆叠 | 画面乱 | 一个主光 |
| 光与情绪无关 | 叙事脱节 | 光线服务情绪 |
| 跨镜光线不一致 | 闪烁/跳变 | 重复光线描述 + 参考锚 |
| 忽略实用光 | 场景无生活感 | 加 practical lights/色溢 |

## 工作流应用（AI 映射）

光线层 = 镜头表光照字段（109）+ 六段式光照段（115）的展开：

```text
场景/情绪判定 → 光线方案（时段/布光/氛围）
  → 光线公式提示词（光源+光质+方向+色温+氛围）
  → 跨镜一致性（同光线描述 + 光照参考锚）
  → 生成 → 审片（光照是否符合方案/跨镜是否一致）
```

**DirectorX 纪律**：每镜提示词含光信息；一个主光；光线叙事优先（情绪先于炫技）。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 黄金时刻 | Golden Hour | 低角度暖光 |
| 蓝调时刻 | Blue Hour | 冷调氛围光 |
| 体积光 | Volumetric Light | 可见光束/上帝光 |
| 轮廓光 | Rim Light | 边缘分离光 |
| 伦勃朗光 | Rembrandt Lighting | 脸颊三角光 |
| 低调光 | Low-Key Lighting | 高对比暗调 |
| 实用光 | Practical Light | 场景可见光源 |
| 色溢 | Color Spill | 环境色反射 |

## 来源

- Kling — AI Video Lighting Prompts: Volumetric & Golden Hour：https://kling.ai/blog/ai-video-lighting-prompts-volumetric-golden-hour
- Visionary — Cinematic Lighting Prompts: AI Video Glossary：https://visionaryvideo.app/glossary/cinematic-lighting/
- ZSky — 38 AI Lighting Prompts (Tested)：https://zsky.ai/blog/ai-lighting-prompts
- ATLabs — 27 Cinematic Lighting Looks for AI Prompts：https://www.atlabs.ai/blog/27-cinematic-lighting-looks-ai-prompts-guide
- Hailuo — Golden Hour AI: Master Natural Light for Cinematic Video：https://hailuoai.video/pages/knowledge/ai-video-golden-hour-lighting