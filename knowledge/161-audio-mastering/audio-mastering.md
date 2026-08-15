# AI 音频母带处理（Audio Mastering — LUFS, Dialogue Clarity & Platform Targets）

> 本页为 AI 视频的音频母带处理：响度标准化（LUFS）、真峰值限制、对白清晰度增强、分平台响度目标（YouTube -14 / Instagram-TikTok -10~-12 / Facebook -13）。知识本体来自 2026 音频后期指南（Opus/ReelMind/Wideframe/Foxi）。AI 应用面向 DirectorX：成片音频收尾（衔接 112 交付、144 声音设计、119 音画）。
> 来源：Opus「Best Loudness Normalizers for Social Video」、Wideframe「Top AI Audio Mixing Tools 2026」、ReelMind「Automated AI Video Speech Normalization」、Foxi「AI in Audio Post Production Glossary」。

## 概述

**核心断言**：母带是把混音变成**平台合格成品**的最后一步——响度达标（LUFS）、峰值不削波、对白清晰。**不同平台响度标准不同**：YouTube 约 -14 LUFS，Instagram/TikTok 约 -10~-12 LUFS，Facebook 约 -13 LUFS（112 分平台交付的音频维度）。**先平衡后标准化**：混音平衡（对白/音乐/SFX）→ 再按目标 LUFS 归一化。

## 核心概念

### 母带三步

```
① 平衡（对白/音乐/SFX 比例，144）
② 响度标准化（按平台 LUFS 目标）
③ 真峰值限制（防削波失真）
```

### 分平台响度目标

| 平台 | LUFS 目标 |
|---|---|
| YouTube | ≈ -14 |
| Instagram/TikTok | ≈ -10~-12 |

**口径说明**：-14 LUFS 是行业标准交付目标（06/112），-10~-12 为短视频平台响度战争下的实际实践值（2026 内容普遍更响）——交付建议按 112 平台规格；追求短视频"更响"时以 -10~-12 为参考但保留动态（06 抗响度战争原则）。
| Facebook | ≈ -13 |
| 影院/广播 | 按规格（112） |

## 技巧与示例

### AI 母带工作流（Wideframe/Opus）

```text
混音（144 分层）→ AI 母带（对白增强/音乐闪避）
  → 响度标准化（选平台目标 LUFS）
  → 真峰值限制 → 校验（响度计/波形）
  → 分平台导出（112）
```

### 对白清晰度优先

口播/对话内容：**对白恒定 LUFS + 音乐自动闪避（Ducking）**——AI 单趟完成平衡、归一化、增强。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 响度不达标 | 平台忽大忽小 | 按平台 LUFS |
| 先标准化后平衡 | 比例错乱 | 先平衡后标准化 |
| 无峰值限制 | 削波失真 | 真峰值限制 |
| 对白被音乐盖 | 听不清 | 音乐闪避 |
| 一稿全平台 | 响度错配 | 分平台导出 |

## 工作流应用（AI 映射）

成片收尾（衔接 112/144）：

```text
混音（144）→ AI 母带（对白/闪避）
  → 平台响度目标（LUFS）
  → 峰值限制 → 校验
  → 分平台导出（112）
```

**DirectorX 纪律**：先平衡后标准化；按平台 LUFS 交付；对白清晰优先；峰值限制防失真。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 响度标准化 | Loudness Normalization | LUFS 归一化 |
| 响度单位 | LUFS | 响度测量单位 |
| 真峰值限制 | True Peak Limiting | 防削波 |
| 音乐闪避 | Music Ducking | 对白时压低音乐 |
| 母带 | Mastering | 最终响度处理 |
| 削波 | Clipping | 波形失真 |

## 来源

- Opus — 10 Best Loudness Normalizers for Social Video (LUFS)：https://www.opus.pro/blog/best-loudness-normalizers
- Wideframe — Top 8 AI Audio Mixing Tools for Video Editors：https://try.wideframe.com/blog/top-ai-audio-mixing-tools-for-video/
- ReelMind — Automated AI Video Speech Normalization：https://reelmind.ai/blog/automated-ai-video-speech-normalization-consistent-audio-levels
- Foxi — AI in Audio Post Production: 2026 Glossary & Guide：https://www.foximusic.com/blog/ai-in-audio-post-production-glossary/
- Recapo — Audio Volume Normalizer：https://recapo.ai/tools/audio-volume-normalizer/