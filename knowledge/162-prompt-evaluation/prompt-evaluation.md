# AI 提示词测试与评估（Prompt Evaluation — Systematic Iteration & Control Variables）

> 本页为 AI 视频提示词的系统测试与评估：六段式提示词脚手架（主体/动作/场景/相机/光线/风格）、单变量迭代规则（先便宜后重写）、锚点镜头与令牌复用（一致性）、评估驱动迭代（VPO/评测框架）。知识本体来自 2026 提示词工程指南（LTX/TrueFan/arXiv）。AI 应用面向 DirectorX：提示词生产质量（衔接 115 提示词、130 模板、129 评测、138 参数）。
> 来源：LTX「AI Video Prompt Guide 2026」、TrueFan「AI Video Prompt Engineering 2026」、arXiv「VPO: Aligning Text-to-Video」、arXiv「When 'Better' Prompts Hurt」。

## 概述

**核心断言**：提示词生产不是"灵感"，是**可重复的工程**——六段式脚手架结构化输入，**单变量迭代**（一次只改一个变量）保证可归因，锚点镜头 + 令牌复用保证跨镜头一致性，评估驱动迭代（"更好的提示词"不一定更好，要以结果为准）。衔接 129 评测与 138 参数的同一纪律。

## 核心概念

### 六段式脚手架（LTX）

```
① 主体 Subject（谁/什么）
② 动作 Action（做什么）
③ 场景 Scene/Environment（在哪）
④ 相机 Camera（机位/运动）
⑤ 光线 Lighting（125）
⑥ 风格 Style/Look（126）
```

### 迭代规则（控制变量）

```text
一次只改一个变量（可归因）
先试便宜变化（风格/光线/相机）
再考虑重写（主体/动作）
每轮固定种子（138 可复现对比）
```

### 一致性机制（多镜头）

锚点镜头（Hero Shot）→ 提取令牌（Token）→ 后续镜头复用令牌（衔接 117 一致性）。

## 技巧与示例

### 提示词评估工作流

```text
锚点镜头（六段式完整描述）
  → 提取令牌（主体/风格/光线描述子）
  → 变体测试（单变量：光线/相机/风格）
  → 固定种子对比（129 评测维度）
  → 记录结果（哪个变量有效）
  → 迭代（保留有效组合）
```

### "更好"的提示词陷阱（arXiv）

长提示词不一定更好——**评估驱动迭代**：用评测框架（129）验证，而非凭直觉加词。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 一次改多个变量 | 无法归因 | 单变量迭代 |
| 每轮不固定种子 | 无法对比 | 固定种子（138） |
| 凭直觉加词 | 质量不稳定 | 评估驱动（129） |
| 无锚点令牌 | 跨镜头漂移 | 令牌复用（117） |
| 先重写后试便宜 | 成本高 | 先便宜后重写 |

## 工作流应用（AI 映射）

提示词生产（衔接 115/117/129/130）：

```text
六段式脚手架 → 锚点镜头 → 令牌提取
  → 单变量变体测试（固定种子）
  → 评估（129）→ 记录 → 迭代
  → 模板沉淀（130）
```

**DirectorX 纪律**：脚手架结构化；单变量可归因；种子固定可对比；评估驱动迭代。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 脚手架 | Scaffold | 六段式结构 |
| 控制变量 | Control Variable | 单变量迭代 |
| 锚点镜头 | Anchor / Hero Shot | 一致性基准 |
| 令牌复用 | Token Reuse | 描述子复用 |
| 评估驱动 | Evaluation-Driven | 以结果为准 |
| 可归因 | Attributable | 变化可追溯 |

## 来源

- LTX — AI Video Prompt Guide: How to Write Prompts in 2026：https://ltx.io/blog/ai-video-prompt-guide
- TrueFan — AI Video Prompt Engineering 2026: The Complete Guide：https://www.truefan.ai/blogs/ai-video-prompt-engineering-2026-guide
- arXiv — VPO: Aligning Text-to-Video Generation Models（2503.20491）：https://arxiv.org/html/2503.20491v1
- arXiv — When "Better" Prompts Hurt: Evaluation-Driven Iteration（2601.22025）：https://arxiv.org/html/2601.22025v1
- APXML — A Systematic Approach to Prompt Iteration and Testing：https://apxml.com/courses/prompt-engineering-agentic-workflows/chapter-6-debugging-optimizing-prompts-agentic-systems/systematic-prompt-iteration-testing