---
type: Playbook
title: "AI 视频色彩分级与调色（Color Grading — AI LUT, Cinematic Look & Post Pipeline）"
description: "AI 视频色彩分级与调色体系：主调色（一级）与精修（二级）、AI 生成 LUT、肤色校正、胶片质感收尾，以及 AI 生成素材的调色工作流"
tags:
  - "production"
  - "color"
  - "workflow"
status: stable
stale_after: "2027-08-18"
generated:
  by: "process:directorx-knowledge-okf"
  at: "2026-08-18T00:00:00Z"
verified:
  - by: "process:knowledge-audit"
    at: "2026-08-18T00:00:00Z"
sources:
  - resource: "cited:Nerdfx AI Color Grading and Post-Production: Complete Guide"
    id: cite-1
    title: "AI Color Grading and Post-Production: Complete Guide"
    author: "org:Nerdfx"
  - resource: "cited:DaVinci Resolve Generative AI Color Grading"
    id: cite-2
    title: "Generative AI Color Grading"
    author: "org:DaVinci-Resolve"
  - resource: "cited:PresetCurator AI Color Grading for Video Editors 2026"
    id: cite-3
    title: "AI Color Grading for Video Editors 2026"
    author: "org:PresetCurator"
  - resource: "cited:Pixflow 10 Best AI Color Grading Tools"
    id: cite-4
    title: "10 Best AI Color Grading Tools"
    author: "org:Pixflow"
  - resource: "https://nerdfx.ai/blog/ai-color-grading-post-production"
    id: url-1
    title: "nerdfx.ai"
  - resource: "https://www.youtube.com/watch?v=tcpIHeMNS5E"
    id: url-2
    title: "youtube.com"
  - resource: "https://www.youtube.com/watch?v=HYhtr3tYx2A"
    id: url-3
    title: "youtube.com"
  - resource: "https://presetcurator.com/ai-color-grading-video-editors-2026-5/"
    id: url-4
    title: "presetcurator.com"
  - resource: "https://pixflow.net/blog/ai-color-grading-tools/"
    id: url-5
    title: "pixflow.net"
dx_id: "141"
related:
  - "125-lighting-atmosphere-prompt/lighting-atmosphere-prompt.md"
  - "126-style-art-direction/style-art-direction.md"
  - "112-delivery-specs/delivery-specs.md"
  - "76-ai-enhancement/ai-enhancement.md"
  - "131-asset-management/asset-management.md"
---

# AI 视频色彩分级与调色（Color Grading — AI LUT, Cinematic Look & Post Pipeline）

> 本页为 AI 视频色彩分级与调色体系：主调色（一级）与精修（二级）、AI 生成 LUT、肤色校正、胶片质感收尾，以及 AI 生成素材的调色工作流。知识本体来自 2026 调色指南（DaVinci Resolve AI 教程/Nerdfx/PresetCurator/Pixflow）。AI 应用面向 DirectorX：后期统一视觉风格（衔接 125 光线、126 风格、112 交付、136 修复）。
> 来源：Nerdfx「AI Color Grading and Post-Production: Complete Guide」、DaVinci Resolve「Generative AI Color Grading」、PresetCurator「AI Color Grading for Video Editors 2026」、Pixflow「10 Best AI Color Grading Tools」。

## 概述

**核心断言**：调色是**视觉风格的统一层**——AI 生成素材（Veo/Kling/Seedance 等）来自不同模型、色调各异，调色把它们统一成一套电影感。**先主调色（一级）再精修（二级）**，LUT 是风格化的起点而非终点（衔接 126 风格迁移）。

## 核心概念

### 调色管线（DaVinci Resolve 模式）

```
① 拍摄/生成素材（Log 或模型原生）
② 平衡曝光（一级）
③ 白平衡校正（一级）
④ 对比度/饱和度（一级）
⑤ 肤色校正（矢量示波器）
⑥ AI 生成/自定义 LUT（风格化）
⑦ 二级精修（选区/遮罩）
⑧ 胶片颗粒质感收尾
```

### AI 调色的价值

- 40% 后期时间节省（自动校正）
- AI 生成 LUT：输入参考图 → 生成匹配 LUT（不花钱买 LUT 包）
- 批量统一：多模型素材一键统一色调

## 技巧与示例

### AI 素材调色（多模型统一）

```text
AI 素材（Runway/Luma/Sora/Veo 混合）
  → 基础校正（曝光/白平衡逐条统一）
  → 主 LUT（风格化，全片共用）
  → 肤色校验（矢量示波器，人物不偏色）
  → 二级（个别镜头精修）
  → 颗粒收尾 → 按 112 规格交付
```

### AI 生成 LUT 工作流

```text
参考图（目标风格）→ AI 提取色调关系
  → 生成 LUT → 应用到素材
  → 微调（强度/局部）→ 保存为风格资产（131）
```

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 直接套 LUT 不校正 | 肤色/曝光失真 | 先一级校正再 LUT |
| 跳过肤色校验 | 人物偏色 | 矢量示波器校验 |
| 每镜头各自调色 | 风格不统一 | 主 LUT 全片共用 |
| 颗粒过度 | 质感变噪点 | 适度颗粒收尾 |
| 忽略交付规格 | 色彩空间错 | 按 112 规格输出 |

## 工作流应用（AI 映射）

后期统一层（衔接 112/126/131）：

```text
素材评估（模型/色调差异）→ 一级校正
  → 风格 LUT（AI 生成，参考 126 风格）
  → 二级精修 → 颗粒收尾 → 规格校验 → 入库（131）
```

**DirectorX 纪律**：调色统一多模型素材；一级先行 LUT 后置；肤色优先校验；风格资产可复用。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 主调色 | Primary Grading | 一级全局校正 |
| 精修 | Secondary Correction | 选区/局部调整 |
| LUT | Look-Up Table | 颜色查找表/风格化 |
| 肤色校正 | Skin Tone Correction | 人物不偏色 |
| 矢量示波器 | Vectorscope | 色彩校验工具 |
| 胶片颗粒 | Film Grain | 质感收尾 |
| Log 素材 | Log Footage | 高宽容度素材 |

## 来源

- Nerdfx — AI Color Grading and Post-Production: The Complete Guide：https://nerdfx.ai/blog/ai-color-grading-post-production
- DaVinci Resolve — Generative AI Color Grading（自建 AI LUT 教程）：https://www.youtube.com/watch?v=tcpIHeMNS5E
- DaVinci Resolve — Making AI Footage Cinematic（AI 素材调色）：https://www.youtube.com/watch?v=HYhtr3tYx2A
- PresetCurator — AI Color Grading for Video Editors: 2026 Complete Guide：https://presetcurator.com/ai-color-grading-video-editors-2026-5/
- Pixflow — AI Color Grading Tools 2026: 10 Best AI Tools Reviewed：https://pixflow.net/blog/ai-color-grading-tools/

## 相关概念

- [AI 光线与氛围提示词体系（Lighting & Atmosphere Prompts — Cinematic Illumination）](../125-lighting-atmosphere-prompt/lighting-atmosphere-prompt.md)
- [AI 风格化与艺术方向（Style & Art Direction — Visual Styles & Style Transfer）](../126-style-art-direction/style-art-direction.md)
- [电影级交付规格（Delivery Specs — Color / Audio / Master Standards）](../112-delivery-specs/delivery-specs.md)
- [实拍素材 AI 增强（AI Video Enhancement & Restoration）](../76-ai-enhancement/ai-enhancement.md)
- [AI 素材与资产管理（Asset Management — DAM, Metadata & Reuse）](../131-asset-management/asset-management.md)
