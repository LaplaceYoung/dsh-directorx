---
type: Reference
title: "AI 色彩空间转换实操（Color Space Conversion — Rec.709/2020, SDR/HDR & Working Space）"
description: "AI 视频的色彩空间转换实操：Rec.709（SDR 基线）vs Rec.2020（UHD/HDR 广色域）、HDR（PQ/HLG）vs SDR（Gamma 2.4）、转换流程（线性化→色彩矩阵→越界处理→重编码）、宽色域工作空间"
tags:
  - "consistency"
  - "color"
  - "workflow"
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
  - resource: "cited:AWS Color Space Conversion (MediaConvert)"
    id: cite-1
    title: "Color Space Conversion (MediaConvert)"
    author: "org:AWS"
  - resource: "cited:DaVinci Resolve Rec.709 vs Rec.2020"
    id: cite-2
    title: "Rec.709 vs Rec.2020"
    author: "org:DaVinci-Resolve"
  - resource: "cited:Pixflow REC 2020 vs REC 709"
    id: cite-3
    title: "REC 2020 vs REC 709"
    author: "org:Pixflow"
  - resource: "cited:MpegFlow Color Spaces Reference"
    id: cite-4
    title: "Color Spaces Reference"
    author: "org:MpegFlow"
  - resource: "https://docs.aws.amazon.com/mediaconvert/latest/ug/converting-the-color-space.html"
    id: url-1
    title: "docs.aws.amazon.com"
  - resource: "https://davinciresolve21.com/blog/what-is-rec709-vs-rec2020-explained-for-davinci-resolve"
    id: url-2
    title: "davinciresolve21.com"
  - resource: "https://pixflow.net/blog/rec-2020-vs-rec-709-a-comprehensive-comparison-for-color-standards/"
    id: url-3
    title: "pixflow.net"
  - resource: "https://www.mpegflow.com/topics/color/color-spaces"
    id: url-4
    title: "mpegflow.com"
  - resource: "https://support.apple.com/guide/motion/about-color-space-motn3f5342e9/mac"
    id: url-5
    title: "support.apple.com"
dx_id: "190"
related:
  - "141-color-grading/color-grading.md"
  - "67-color-management/color-management.md"
  - "112-delivery-specs/delivery-specs.md"
---

# AI 色彩空间转换实操（Color Space Conversion — Rec.709/2020, SDR/HDR & Working Space）

> 本页为 AI 视频的色彩空间转换实操：Rec.709（SDR 基线）vs Rec.2020（UHD/HDR 广色域）、HDR（PQ/HLG）vs SDR（Gamma 2.4）、转换流程（线性化→色彩矩阵→越界处理→重编码）、宽色域工作空间。知识本体来自 2026 色彩管理指南（AWS MediaConvert/Apple/DaVinci Resolve/Pixflow）。AI 应用面向 DirectorX：交付转换（衔接 141 调色、67 色彩管理、112 交付、190 对应）。
> 来源：AWS「Color Space Conversion (MediaConvert)」、DaVinci Resolve「Rec.709 vs Rec.2020」、Pixflow「REC 2020 vs REC 709」、MpegFlow「Color Spaces Reference」。

## 概述

**核心断言**：色彩空间转换是**交付的技术底线**——SDR 用 Rec.709（Gamma 2.4），HDR 用 Rec.2020/Rec.2100（PQ/HLG）。**2026 标准工作流：宽色域拍摄/生成（Rec.2020/PQ）→ 宽色域工作空间调色 → SDR（Rec.709）+ HDR（Rec.2020）双交付**。转换 = 线性化 → 色彩矩阵（3x3 色域映射）→ 越界处理 → 重编码（衔接 141：调色是风格，转换是规格）。

## 核心概念

### 色彩空间对照

| 空间 | 色域 | 传输 | 用途 |
|---|---|---|---|
| Rec.709 | 窄（SDR） | Gamma 2.4 | 非 HDR 交付 |
| Rec.2020 | 宽（UHD） | PQ/HLG | HDR 交付 |
| Rec.2100 | 宽 | PQ/HLG | HDR 基准 |
| DCI-P3 | 中宽 | Gamma | 影院/显示 |

### 转换五步（MediaConvert 模式）

```text
① 线性化（EOTF 解码）
② 色彩矩阵（3x3 色域映射）
③ 越界处理（out-of-gamut 裁剪/压缩）
④ 重编码（OETF 目标空间）
⑤ 元数据校验（112 交付规格）
```

## 技巧与示例

### AI 素材交付转换

```text
AI 生成（模型原生色彩空间）
  → 判断目标（SDR Rec.709 / HDR Rec.2020）
  → 宽色域工作空间调色（141）
  → 转换（五步）→ 元数据校验
  → 双交付（SDR+HDR，112）
```

### 工作空间原则

**宽色域工作空间调色**（Rec.2020/PQ）→ 再映射交付——避免 SDR 工作空间丢失 HDR 信息（衔接 67 色彩管理全链路）。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 直接硬映射 | 色偏 | 线性化+矩阵 |
| 窄空间调色 | HDR 信息丢失 | 宽色域工作 |
| 越界不处理 | 高光溢出 | 裁剪/压缩 |
| 元数据缺失 | 播放错色 | 校验（112） |
| 只出 SDR | 平台 HDR 需求漏 | 双交付 |

## 工作流应用（AI 映射）

交付转换（衔接 67/112/141）：

```text
生成素材 → 色彩空间判定
  → 宽色域调色（141/67）→ 五步转换
  → 元数据校验（112）→ SDR+HDR 双交付
```

**DirectorX 纪律**：转换是规格非风格；宽色域工作空间；越界处理防溢出；元数据校验；双交付覆盖平台。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 色彩空间 | Color Space | 色域+传输 |
| 线性化 | Linearization | EOTF 解码 |
| 色彩矩阵 | Gamut Matrix | 色域映射 |
| 越界 | Out-of-Gamut | 超色域 |
| 传输函数 | EOTF/OETF | 光电转换 |
| 工作空间 | Working Space | 调色环境 |

## 来源

- AWS — Color Space Conversion (Elemental MediaConvert)：https://docs.aws.amazon.com/mediaconvert/latest/ug/converting-the-color-space.html
- DaVinci Resolve — Rec.709 vs Rec.2020 Explained：https://davinciresolve21.com/blog/what-is-rec709-vs-rec2020-explained-for-davinci-resolve
- Pixflow — REC 2020 vs REC 709: Comprehensive Comparison：https://pixflow.net/blog/rec-2020-vs-rec-709-a-comprehensive-comparison-for-color-standards/
- MpegFlow — Color Spaces: Rec.709 vs Rec.2020 vs DCI-P3：https://www.mpegflow.com/topics/color/color-spaces
- Apple — About Color Space (Motion)：https://support.apple.com/guide/motion/about-color-space-motn3f5342e9/mac

## 相关概念

- [AI 视频色彩分级与调色（Color Grading — AI LUT, Cinematic Look & Post Pipeline）](../141-color-grading/color-grading.md)
- [色彩管理全链路（Color Management Pipeline）](../67-color-management/color-management.md)
- [电影级交付规格（Delivery Specs — Color / Audio / Master Standards）](../112-delivery-specs/delivery-specs.md)
