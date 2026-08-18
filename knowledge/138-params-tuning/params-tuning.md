---
type: Reference
title: "AI 视频生成参数进阶（Parameters Tuning — Seed, CFG, Steps, Motion & Settings by Model）"
description: "AI 视频生成的参数调优体系：种子（Seed）、引导强度（CFG/Prompt Strength）、步数（Steps）、运动强度（Motion Strength）、画幅/时长，以及按模型/场景的推荐参数"
tags:
  - "production"
  - "prompt"
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
  - resource: "cited:Together AI Video Generation Parameters"
    id: cite-1
    title: "Video Generation Parameters"
    author: "org:Together-AI"
  - resource: "cited:PixVerse v5.5 Prompt Guide"
    id: cite-2
    title: "v5.5 Prompt Guide"
    author: "org:PixVerse"
  - resource: "cited:Seedance 2 Best Settings Guide"
    id: cite-3
    title: "Best Settings Guide"
    author: "org:Seedance-2"
  - resource: "cited:QuestStudio Best Settings by Model for I2V"
    id: cite-4
    title: "Best Settings by Model for I2V"
    author: "org:QuestStudio"
  - resource: "cited:LTX ComfyUI Workflow Guide"
    id: cite-5
    title: "ComfyUI Workflow Guide"
    author: "org:LTX"
  - resource: "https://docs.together.ai/docs/inference/videos/parameters"
    id: url-1
    title: "docs.together.ai"
  - resource: "https://fal.ai/learn/devs/pixverse-v5-5-prompt-guide"
    id: url-2
    title: "fal.ai"
  - resource: "https://wavespeed.ai/blog/posts/blog-seedance-2-0-best-settings/"
    id: url-3
    title: "wavespeed.ai"
  - resource: "https://queststudio.io/blog/best-settings-by-model-image-to-video"
    id: url-4
    title: "queststudio.io"
  - resource: "https://ltx.io/blog/comfyui-workflow-guide"
    id: url-5
    title: "ltx.io"
dx_id: "138"
related:
  - "114-ai-video-model-matrix/ai-video-model-matrix.md"
  - "115-video-prompt-engineering/video-prompt-engineering.md"
  - "118-defect-repair/defect-repair.md"
  - "129-eval-benchmark/eval-benchmark.md"
  - "122-quality-monetization/quality-monetization.md"
---

# AI 视频生成参数进阶（Parameters Tuning — Seed, CFG, Steps, Motion & Settings by Model）

> 本页为 AI 视频生成的参数调优体系：种子（Seed）、引导强度（CFG/Prompt Strength）、步数（Steps）、运动强度（Motion Strength）、画幅/时长，以及按模型/场景的推荐参数。知识本体来自 2026 参数指南（Together AI/PixVerse/Seedance/QuestStudio/LTX ComfyUI）。AI 应用面向 DirectorX：生成参数决策（衔接 114 模型、115 提示词、118 缺陷）。
> 来源：Together AI「Video Generation Parameters」、PixVerse「v5.5 Prompt Guide」、Seedance 2「Best Settings Guide」、QuestStudio「Best Settings by Model for I2V」、LTX「ComfyUI Workflow Guide」。

## 概述

**核心断言**：参数是提示词之外的第二控制面——**固定种子保复现、CFG 平衡遵循与创造、步数权衡质量与成本、运动强度控制动态与稳定**。参数调优 = 可复现 + 可诊断（衔接 129 评测、122 成本）。

## 核心概念

### 核心参数表

| 参数 | 作用 | 推荐 |
|---|---|---|
| Seed（种子） | 复现结果 | 固定 = 可复现；变化 = 探索 |
| CFG/Prompt Strength | 遵循 vs 创造 | 高遵循低创造；过高易过饱和 |
| Steps（步数） | 质量 vs 成本 | 预览 10-20，生产 30-50，>50 收益递减 |
| Motion Strength | 动态度 | 高动态易不稳（衔接 118） |
| Aspect Ratio | 画幅 | 9:16/16:9 早期定（影响构图） |
| Duration | 时长 | 匹配动作复杂度，长易漂移 |

## 技巧与示例

### 生产调优工作流（Seedance 可复现测试法）

```text
固定种子 → 同提示词跑参数梯度（步数/CFG/运动强度各试 2-3 档）
  → 对比质量（129 评测维度）
  → 选最优组合 → 固定为生产参数
  → 成本核算（122：步数×时长×次数）
```

### 按场景参数起点

| 场景 | 参数建议 |
|---|---|
| 快速预览 | 步数 10-15、低分辨率、短时长 |
| 产品广告 | 高 CFG（遵循产品）、中等运动、9:16 或 16:9 |
| 电影感叙事 | 步数 30-40、适度 CFG、受控运动 |
| 动作镜头 | 运动强度中高但注意稳定（118） |

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 不固定种子 | 无法复现/无法对比 | 生产固定种子 |
| CFG 过高 | 过饱和/伪影 | 平衡遵循与创造 |
| 步数拉满 | 成本高收益低 | >50 递减，生产 30-50 |
| 运动强度过高 | 不稳/漂移 | 高动态配短片段 |
| 画幅后期改 | 构图重做 | 早期定画幅 |

## 工作流应用（AI 映射）

参数层（衔接 114/122/129）：

```text
模型选择（114）→ 参数基线（按模型/场景）
  → 固定种子 → 参数梯度测试（可复现）
  → 质量评估（129）→ 成本核算（122）
  → 生产参数固化 → 批量复用
```

**DirectorX 纪律**：生产固定种子与参数；参数测试可复现（同种子梯度）；步数/运动强度有边界意识。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 种子 | Seed | 随机性控制/复现 |
| 引导强度 | CFG / Prompt Strength | 遵循 vs 创造 |
| 步数 | Steps | 采样质量/成本 |
| 运动强度 | Motion Strength | 动态度控制 |
| 画幅 | Aspect Ratio | 构图比例 |
| 参数梯度 | Parameter Sweep | 同种子参数对比测试 |

## 来源

- Together AI — Video Generation Parameters：https://docs.together.ai/docs/inference/videos/parameters
- PixVerse — v5.5 Prompt Guide: Text-to-Video, Image-to-Video：https://fal.ai/learn/devs/pixverse-v5-5-prompt-guide
- Seedance 2 — Best Settings Guide: Duration, Aspect Ratio：https://wavespeed.ai/blog/posts/blog-seedance-2-0-best-settings/
- QuestStudio — Best Settings by Model for Image to Video：https://queststudio.io/blog/best-settings-by-model-image-to-video
- LTX — ComfyUI Video Generation Model Workflow Guide：https://ltx.io/blog/comfyui-workflow-guide

## 相关概念

- [AI 视频模型能力矩阵（AI Video Model Matrix 2026 — Capabilities & Selection）](../114-ai-video-model-matrix/ai-video-model-matrix.md)
- [视频提示词工程总纲（Video Prompt Engineering — Structure, Timing & Control）](../115-video-prompt-engineering/video-prompt-engineering.md)
- [生成缺陷识别与修复（AI Video Artifacts — Diagnose, Fix, Regenerate）](../118-defect-repair/defect-repair.md)
- [AI 视频评测与基准方法学（AI Video Evaluation — Benchmarks, Metrics & Human Eval）](../129-eval-benchmark/eval-benchmark.md)
- [AI 视频质量控制与商业化（Quality Control & Monetization — Cost, QC & ROI）](../122-quality-monetization/quality-monetization.md)
