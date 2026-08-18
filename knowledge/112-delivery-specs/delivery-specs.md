---
type: Spec
title: "电影级交付规格（Delivery Specs — Color / Audio / Master Standards）"
description: "本页知识本体来自真实广播/流媒体交付规范：母版格式（IMF/ProRes）、色彩空间（SDR/HDR/广色域）、音频响度（LUFS/dBTP）与帧率标准"
tags:
  - "production"
  - "color"
  - "sound"
  - "spec"
status: stable
stale_after: "2027-08-18"
generated:
  by: "process:directorx-knowledge-okf"
  at: "2026-08-18T00:00:00Z"
verified:
  - by: "process:knowledge-audit"
    at: "2026-08-18T00:00:00Z"
sources:
  - resource: "cited:CBC Technical Specifications for Program Delivery 2026"
    id: cite-1
    title: "Technical Specifications for Program Delivery 2026"
    author: "org:CBC"
  - resource: "cited:Vitrina OTT Content Delivery Specs 2026"
    id: cite-2
    title: "OTT Content Delivery Specs 2026"
    author: "org:Vitrina"
  - resource: "cited:Amazon Studios Asset Technical Specifications"
    id: cite-3
    title: "Asset Technical Specifications"
    author: "org:Amazon-Studios"
  - resource: "cited:ToolsForFilm Audio Delivery Standards"
    id: cite-4
    title: "Audio Delivery Standards"
    author: "org:ToolsForFilm"
  - resource: "cited:Filmcane Deliver Your Film to Streaming Platforms 2026"
    id: cite-5
    title: "Deliver Your Film to Streaming Platforms 2026"
    author: "org:Filmcane"
  - resource: "https://site-cbc.radio-canada.ca/documents/working-travail/suppliers-fournisseurs/technical-specifications-for-program-delivery-version-8_january_23rd_2026_b.pdf"
    id: url-1
    title: "site-cbc.radio-canada.ca"
  - resource: "https://vitrina.ai/blog/ott-content-delivery-specifications-2026/"
    id: url-2
    title: "vitrina.ai"
  - resource: "https://portal.amazonstudios.com/hc/en-us/articles/15986845319323-Asset-Technical-Specifications"
    id: url-3
    title: "portal.amazonstudios.com"
  - resource: "https://www.toolsforfilm.com/blog/audio-delivery-standards"
    id: url-4
    title: "toolsforfilm.com"
  - resource: "https://filmcane.com/blog/how-to-deliver-film-to-streaming-platforms"
    id: url-5
    title: "filmcane.com"
dx_id: "112"
related:
  - "51-color-psychology-brand/color-psychology-brand.md"
  - "114-ai-video-model-matrix/ai-video-model-matrix.md"
  - "190-color-space-conversion/color-space-conversion.md"
---

# 电影级交付规格（Delivery Specs — Color / Audio / Master Standards）

> 本页知识本体来自真实广播/流媒体交付规范：母版格式（IMF/ProRes）、色彩空间（SDR/HDR/广色域）、音频响度（LUFS/dBTP）与帧率标准。AI 应用面向 DirectorX：交付前按平台规格校验（案例 5 多语言、案例 8 竖屏、案例 6 批量教学视频的成片规格）。
> 来源：CBC「Technical Specifications for Program Delivery 2026」、Vitrina「OTT Content Delivery Specs 2026」、Amazon Studios「Asset Technical Specifications」、ToolsForFilm「Audio Delivery Standards」、Filmcane「Deliver Your Film to Streaming Platforms 2026」。

## 概述

**核心断言**：交付不是"导出个 mp4"，而是一套按平台/渠道的**技术规格校验**——色彩空间、音频响度、帧率、封装格式都有硬性要求。**母版（Master）是最高质量的无损版本**，平台分发版从母版转码。

## 核心概念

### 母版（Master）标准

- **格式**：IMF（Interoperable Master Format，流媒体标准，如 Netflix ST 2067-21）或 ProRes（工作流母版）
- **视频**：SDR（Rec.709）或 HDR（广色域 + 色调映射元数据）；4K/UHD 常见
- **帧率**：24 / 23.976 / 29.97 / 25 fps（按地区与平台）
- **音频**：48 kHz、24-bit；5.1 / 7.1 / 立体声
- **规范**：母版不含彩条/片头/板号（Amazon 明确要求），内容无缝

### 音频响度标准（交付必查）

| 平台/渠道 | 集成响度（LUFS） | 真峰值（dBTP） |
|---|---|---|
| 广播（多数） | -23 LUFS | -2 dBTP |
| 流媒体（Netflix 等） | -27 LUFS | -2 dBTP |
| YouTube | -14 LUFS | -1 dBTP |
| 影院 | 按发行规格 | -1 dBTP |

**要点**：响度以**整片集成**（Integrated）计算，不是每段峰值；交付前用响度计（LUFS meter）校验。

### 色彩空间

- SDR：Rec.709（互联网/广播基线）
- HDR：Rec.2020 + PQ/HLG 曲线 + 元数据（ST 2086/2094），按平台要求
- 调色在广色域工作，交付按平台色调映射（Tone Map）

## 技巧与示例

### 交付前校验清单（AI 可执行）

```text
□ 分辨率/比例（4K/1080p × 16:9/9:16）
□ 帧率（24/25/30，与素材一致）
□ 时长（在平台限制内，如短视频 ≤60s）
□ 编码/封装（H.264/H.265、MP4/IMF）
□ 色彩空间（SDR Rec.709 / HDR）
□ 音频响度（LUFS 区间 + dBTP 上限）
□ 采样率/位深（48kHz/24bit）
□ 字幕（烧录/外挂，语言齐全）
□ 无缝（无彩条/板号/黑场残留）
□ 合规（广告法/平台政策）
```

### 平台差异示例（2026）

- Netflix：IMF ST 2067-21、-27 LUFS、5.1/立体声、24/23.976 fps
- YouTube：接受 -14 LUFS、H.264/AV1、自动多码率
- 竖屏平台（抖音/Reels/Shorts）：9:16、≤60s、-14 LUFS、动态字幕烧录

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 响度按峰值而非集成 | 平台拒收/响度不均 | 集成 LUFS + dBTP 双校验 |
| 色彩空间不符（SDR 当 HDR 发） | 发灰/过曝 | 按平台选 Rec.709/Rec.2020 |
| 帧率混用 | 抖动/卡顿 | 全片统一帧率 |
| 母版带彩条/板号 | 平台退回 | 无缝母版 |
| 字幕语言不全 | 多语言案例交付失败 | 按语言清单校验 |
| 短视频超时长 | 平台截断/拒收 | 时长规格先行（≤60s） |

## 工作流应用（AI 映射）

**案例 5（多语言）、6（批量教学）、8（竖屏）的交付校验**：

```text
成片 → ① 平台规格映射（时长/比例/编码/响度/字幕）
  → ② 技术校验（分辨率/帧率/色彩空间/响度 LUFS+dBTP/无缝）
  → ③ 内容校验（术语表/姓名/字幕语言/信息保真）
  → ④ 交付清单（版本号 + 校验结果 + 回退路径）
  → ⑤ 用户确认交付
```

**AI 纪律**：生成前先锁定平台规格（案例 Query 已含：20 秒广告、45 秒短片、5 分钟口播、30-60 秒竖屏）——规格是生成参数的一部分，不是交付时才发现。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 母版 | Master | 最高质量无损版本 |
| 互操作母版格式 | IMF | 流媒体标准封装 |
| 集成响度 | Integrated Loudness（LUFS） | 整片平均响度 |
| 真峰值 | True Peak（dBTP） | 采样间峰值上限 |
| 色彩空间 | Color Space | Rec.709 / Rec.2020 |
| 高动态范围 | HDR | 广色域+色调映射 |
| 色调映射 | Tone Mapping | HDR→SDR 转换 |
| 采样率/位深 | Sample Rate / Bit Depth | 48kHz / 24bit |
| 无缝内容 | Seamless Content | 无彩条/板号/黑场 |

## 来源

- CBC — Technical Specifications for Program Delivery（2026-01 v8）：https://site-cbc.radio-canada.ca/documents/working-travail/suppliers-fournisseurs/technical-specifications-for-program-delivery-version-8_january_23rd_2026_b.pdf
- Vitrina — OTT Content Delivery Specs: 2026 Producer Guide：https://vitrina.ai/blog/ott-content-delivery-specifications-2026/
- Amazon Studios — Asset Technical Specifications：https://portal.amazonstudios.com/hc/en-us/articles/15986845319323-Asset-Technical-Specifications
- ToolsForFilm — Audio Delivery Standards for Film and Television：https://www.toolsforfilm.com/blog/audio-delivery-standards
- Filmcane — How to Deliver Your Film to Streaming Platforms (2026)：https://filmcane.com/blog/how-to-deliver-film-to-streaming-platforms

## 相关概念

- [色彩心理学与品牌视觉（Color Psychology & Brand Visuals）](../51-color-psychology-brand/color-psychology-brand.md)
- [AI 视频模型能力矩阵（AI Video Model Matrix 2026 — Capabilities & Selection）](../114-ai-video-model-matrix/ai-video-model-matrix.md)
- [AI 色彩空间转换实操（Color Space Conversion — Rec.709/2020, SDR/HDR & Working Space）](../190-color-space-conversion/color-space-conversion.md)
