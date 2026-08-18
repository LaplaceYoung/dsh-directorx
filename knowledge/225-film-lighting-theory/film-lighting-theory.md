---
type: Reference
title: "电影布光理论（Film Lighting Theory — Three-Point, Hard/Soft & High/Low Key）"
description: "电影布光理论深化：三点布光（主光/辅光/背光）、硬光 vs 软光（阴影边缘）、高调 vs 低调（亮度对比）、光比（Lighting Ratio）、布光塑造维度"
tags:
  - "consistency"
  - "lighting"
status: stable
stale_after: "2027-08-18"
generated:
  by: "process:directorx-knowledge-okf"
  at: "2026-08-18T00:00:00Z"
verified:
  - by: "process:knowledge-audit"
    at: "2026-08-18T00:00:00Z"
sources:
  - resource: "cited:Wikipedia Three-Point Lighting"
    id: cite-1
    title: "Three-Point Lighting"
    author: "org:Wikipedia"
  - resource: "cited:StudioBinder Three-Point Video Lighting"
    id: cite-2
    title: "Three-Point Video Lighting"
    author: "org:StudioBinder"
  - resource: "cited:Backstage Film Lighting Explained"
    id: cite-3
    title: "Film Lighting Explained"
    author: "org:Backstage"
  - resource: "cited:Rosco Basics of Film Lighting"
    id: cite-4
    title: "Basics of Film Lighting"
    author: "org:Rosco"
  - resource: "https://en.wikipedia.org/wiki/Three-point_lighting"
    id: url-1
    title: "en.wikipedia.org"
  - resource: "https://en.wikipedia.org/wiki/Key_light"
    id: url-2
    title: "en.wikipedia.org"
  - resource: "https://www.studiobinder.com/blog/three-point-lighting-setup/"
    id: url-3
    title: "studiobinder.com"
  - resource: "https://www.backstage.com/magazine/article/film-lighting-techniques-76277/"
    id: url-4
    title: "backstage.com"
  - resource: "https://spectrum.rosco.com/the-basics-of-film-lighting"
    id: url-5
    title: "spectrum.rosco.com"
dx_id: "225"
related:
  - "125-lighting-atmosphere-prompt/lighting-atmosphere-prompt.md"
  - "217-portrait-lighting-schemes/portrait-lighting-schemes.md"
---

# 电影布光理论（Film Lighting Theory — Three-Point, Hard/Soft & High/Low Key）

> 本页为电影布光理论深化：三点布光（主光/辅光/背光）、硬光 vs 软光（阴影边缘）、高调 vs 低调（亮度对比）、光比（Lighting Ratio）、布光塑造维度。知识本体来自 2026 布光指南（Wikipedia/StudioBinder/Backstage/Rosco）。AI 应用面向 DirectorX：布光设计（衔接 125 光线、217 人像光型、225 对应）。
> 来源：Wikipedia「Three-Point Lighting」、StudioBinder「Three-Point Video Lighting」、Backstage「Film Lighting Explained」、Rosco「Basics of Film Lighting」。

## 概述

**核心断言**：布光是**可控的情绪工程**——三点布光（主/辅/背）塑造维度，硬光锐利阴影（紧张）/软光柔和（亲和），高调明亮均匀（喜剧/开朗）/低调强对比（黑色/悬疑）。**光比（主辅光强度差）决定戏剧性**（衔接 125：AI 光线提示词的理论基础；217：人像光型的布光前提）。

## 核心概念

### 三点布光（Three-Point）

```
① 主光（Key）：主要照明，决定光型
② 辅光（Fill）：填充阴影，控制光比
③ 背光（Back）：轮廓分离，增加维度
```

### 光质与影调

| 维度 | 选项 | 情绪 |
|---|---|---|
| 光质 | 硬光（锐阴影） | 紧张/强硬 |
| | 软光（漫射） | 柔和/亲和 |
| 影调 | 高调（亮/低对比） | 开朗/轻快 |
| | 低调（暗/高对比） | 悬疑/沉重 |
| 光比 | 高光比 | 戏剧/神秘 |
| | 低光比 | 自然/平实 |

## 技巧与示例

### 布光提示词（AI 映射）

```text
"three-point lighting, soft key, gentle fill, rim light"（柔和商业）
"hard key light, deep shadows, high contrast, low-key"（黑色电影）
"bright even lighting, high-key, clean"（轻快）
```

### 光比控制

主光强 → 辅光弱 = 高光比戏剧；辅光渐强 = 光比降低（衔接 217：伦勃朗=高光比人像）。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 只写"灯光" | 无方向 | 三点+光质 |
| 光比不分 | 情绪模糊 | 光比指定 |
| 硬软不分 | 质感错 | 光质选型 |
| 无背光 | 贴背景 | 轮廓分离 |
| 影调混用 | 混乱 | 高/低调选一 |

## 工作流应用（AI 映射）

布光设计（衔接 125/217）：

```text
情绪意图 → 影调（高/低调）→ 光质（硬/软）
  → 三点布局 → 光比 → 提示词
  → 生成 → 光影校验
```

**DirectorX 纪律**：三点塑维度；光质定质感；影调定情绪；光比控戏剧性。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 三点布光 | Three-Point Lighting | 主/辅/背 |
| 主光 | Key Light | 主要照明 |
| 辅光 | Fill Light | 阴影填充 |
| 背光 | Back Light | 轮廓分离 |
| 光比 | Lighting Ratio | 主辅强度差 |
| 高调/低调 | High/Low Key | 亮度影调 |

## 来源

- Wikipedia — Three-Point Lighting：https://en.wikipedia.org/wiki/Three-point_lighting
- Wikipedia — Key Light：https://en.wikipedia.org/wiki/Key_light
- StudioBinder — Three-Point Video Lighting Setup Guide：https://www.studiobinder.com/blog/three-point-lighting-setup/
- Backstage — Film Lighting, Explained: Techniques & Examples：https://www.backstage.com/magazine/article/film-lighting-techniques-76277/
- Rosco — The Basics of Film Lighting：https://spectrum.rosco.com/the-basics-of-film-lighting

## 相关概念

- [AI 光线与氛围提示词体系（Lighting & Atmosphere Prompts — Cinematic Illumination）](../125-lighting-atmosphere-prompt/lighting-atmosphere-prompt.md)
- [AI 图片人像用光体系（Portrait Lighting — Rembrandt, Butterfly, Loop & Split Patterns）](../217-portrait-lighting-schemes/portrait-lighting-schemes.md)
