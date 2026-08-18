---
type: Reference
title: "AI 视频跨模态与空间视频（Spatial & 3D Video — 360°, VR/AR & Spatial Computing）"
description: "AI 视频的跨模态扩展：360°/全景视频生成（球面投影扩散模型）、3D 空间视频（视差/深度）、VR 头显适配（Apple Vision Pro/Meta Quest）、AR 与空间计算"
tags:
  - "consistency"
  - "model"
status: stable
stale_after: "2027-08-18"
generated:
  by: "process:directorx-knowledge-okf"
  at: "2026-08-18T00:00:00Z"
verified:
  - by: "process:knowledge-audit"
    at: "2026-08-18T00:00:00Z"
sources:
  - resource: "cited:arXiv Human-AI Co-Creation for 360° Panoramic Video"
    id: cite-1
    title: "Human-AI Co-Creation for 360° Panoramic Video"
    author: "org:arXiv"
  - resource: "cited:arXiv Generating 360° Video for 3D Scene"
    id: cite-2
    title: "Generating 360° Video for 3D Scene"
    author: "org:arXiv"
  - resource: "cited:ReelMind AI-Powered VR: Immersive 360° Video"
    id: cite-3
    title: "AI-Powered VR: Immersive 360° Video"
    author: "org:ReelMind"
  - resource: "cited:Reezo AI Video Meets AR/VR 2025"
    id: cite-4
    title: "AI Video Meets AR/VR 2025"
    author: "org:Reezo"
  - resource: "https://arxiv.org/html/2501.15456v1"
    id: url-1
    title: "arxiv.org"
  - resource: "https://arxiv.org/html/2504.02045v3"
    id: url-2
    title: "arxiv.org"
  - resource: "https://reelmind.ai/blog/ai-powered-virtual-reality-creating-immersive-360deg-video-experiences"
    id: url-3
    title: "reelmind.ai"
  - resource: "https://reezo.ai/blog/beyond-the-screen-ai-video-ar-vr-immersive-content-2025"
    id: url-4
    title: "reezo.ai"
  - resource: "https://www.glbgpt.com/features/ai-vr-video-generator"
    id: url-5
    title: "glbgpt.com"
dx_id: "160"
related:
  - "146-real-time-live/real-time-live.md"
  - "124-shot-language-gen/shot-language-gen.md"
  - "139-docu-knowledge-visuals/docu-knowledge-visuals.md"
  - "360-silhouette-era-emotion/silhouette-era-emotion.md"
  - "144-sound-design/sound-design.md"
---

# AI 视频跨模态与空间视频（Spatial & 3D Video — 360°, VR/AR & Spatial Computing）

> 本页为 AI 视频的跨模态扩展：360°/全景视频生成（球面投影扩散模型）、3D 空间视频（视差/深度）、VR 头显适配（Apple Vision Pro/Meta Quest）、AR 与空间计算。知识本体来自 2026 空间视频研究（arXiv/ReelMind/Reezo/GlobalGPT）。AI 应用面向 DirectorX：沉浸式项目（衔接 146 实时、124 镜头、139 环境）。
> 来源：arXiv「Human-AI Co-Creation for 360° Panoramic Video」、arXiv「Generating 360° Video for 3D Scene」、ReelMind「AI-Powered VR: Immersive 360° Video」、Reezo「AI Video Meets AR/VR 2025」。

## 概述

**核心断言**：空间视频把"画面"变成"环境"——**360° 全景（球面投影）+ 视差深度（3D）**。生成逻辑从"构图"转向"场景完整性"：观众可以转头看任何方向（衔接 124 镜头语言在 360° 的变体：无固定取景框，导演用光线/声音/运动引导视线）。

## 核心概念

### 空间视频两种形态

| 形态 | 原理 | 适配 |
|---|---|---|
| 360° 全景 | 球面投影扩散模型 | 全景头显/网页 |
| 3D 空间 | 视差/深度（双目） | Vision Pro/Quest |

### 360° 生成要点

- **球面感知提示词**（Panorama-Aware）：考虑视口衔接（接缝）
- **中心线索引导**：导演用光线/声音/运动引导观众视线（360° 无取景框）
- **第一人称视角控制**（Egocentric）：用户视角随意图调整

## 技巧与示例

### 空间视频工作流（GlobalGPT/Reezo）

```text
场景描述（沉浸式环境意图）
  → 360° 全景生成（球面投影）
  → 视差/深度处理（3D 化）
  → 视口测试（接缝/分辨率）
  → 头显适配（Vision Pro/Quest 格式）
  → 交互层（146 实时/167 分支）
```

### 视线引导（360° 导演技巧）

360° 没有取景框：用**光线聚焦 + 声音定位 + 运动节奏**引导观众转头（衔接 144 声音定位、125 光线）。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 用平面构图逻辑 | 全景缺内容 | 场景完整性思维 |
| 忽视接缝 | 视觉断裂 | 球面感知提示 |
| 无视线引导 | 观众迷茫 | 光/声/运动引导 |
| 无视差深度 | 3D 效果差 | 深度处理 |
| 头显不适配 | 无法播放 | 按设备格式输出 |

## 工作流应用（AI 映射）

沉浸式项目（衔接 139/146/167）：

```text
体验设计（沉浸意图）→ 360° 生成（球面）
  → 3D 化（视差）→ 视线引导设计（光/声）
  → 头显适配 → 交互层（146/167）→ 测试
```

**DirectorX 纪律**：场景完整性替代构图；球面感知防接缝；光/声引导视线；按设备格式交付。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 全景视频 | 360° / Panoramic Video | 球面视频 |
| 空间视频 | Spatial Video | 3D 视差视频 |
| 球面投影 | Spherical Projection | 全景成像 |
| 视差 | Parallax | 双目深度差 |
| 空间计算 | Spatial Computing | 沉浸式计算 |
| 第一人称视角 | Egocentric View | 用户视角控制 |

## 来源

- arXiv — Human-AI Co-Creation System for 360° Panoramic Video（2501.15456）：https://arxiv.org/html/2501.15456v1
- arXiv — Generating 360° Video is What You Need for a 3D Scene（2504.02045）：https://arxiv.org/html/2504.02045v3
- ReelMind — AI-Powered Virtual Reality: Creating Immersive 360° Video：https://reelmind.ai/blog/ai-powered-virtual-reality-creating-immersive-360deg-video-experiences
- Reezo — Beyond the Screen: AI Video Meets AR/VR：https://reezo.ai/blog/beyond-the-screen-ai-video-ar-vr-immersive-content-2025
- GlobalGPT — AI VR Video Generator：https://www.glbgpt.com/features/ai-vr-video-generator

## 相关概念

- [AI 实时生成与直播（Real-Time Generation & Live — Streaming Avatars & Interactive Video）](../146-real-time-live/real-time-live.md)
- [AI 镜头语言生成专项（Shot Language Generation — Camera, Movement & Framing Prompts）](../124-shot-language-gen/shot-language-gen.md)
- [AI 纪录片与知识类画面（Documentary & Educational Visuals — Archival, Reenactment & Data Viz）](../139-docu-knowledge-visuals/docu-knowledge-visuals.md)
- [AI 图片剪影-年代-情绪三融合（Silhouette-Era-Emotion — Vintage Dramatic Fusion）](../360-silhouette-era-emotion/silhouette-era-emotion.md)
- [AI 声音设计专项（Sound Design — Foley, Ambience, SFX & Mixing）](../144-sound-design/sound-design.md)
