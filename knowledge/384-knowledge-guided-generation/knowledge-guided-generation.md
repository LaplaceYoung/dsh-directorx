# AI 图片知识引导生成（Knowledge-Guided Generation — Reference Mapping & Agentic Systems）

> 本页为 AI 图片的知识引导生成：参考分析提取特征（跨场景身份/风格迁移）、图转提示词+转面参考表（多角度）、扩散+LoRA（快速风格/主体适配）、代理式多模态系统（从文生图到编辑工作流）。知识本体来自 2026 知识引导（OpenAI/Kittl/PMC）。AI 应用面向 DirectorX：知识驱动（衔接 384 对应、183 参考、290 指南、375 全栈）。
> 来源：OpenAI「Image Models Prompting Guide」、Kittl「AI Image Generation Guide 2026」、PMC「Visual Guided Color Art Generation」、Miraflow「AI Image Arms Race」。

## 概述

**核心断言**：知识引导生成 = **"参考分析+特征迁移"**——代理分析参考提取特征（跨场景身份/风格一致）；图转提示词+转面参考表；扩散+LoRA（快速适配）；代理式多模态（文生图→编辑）（衔接 183：参考机制；290：指南）。

## 核心概念

### 参考分析（Kittl）

代理分析参考图 → 提取特征（身份/风格）→ 跨场景迁移——**"学了再用"**（衔接 183）。

### 转面参考表（OpenAI）

图转提示词 + 转面参考表（多角度提示）——**"一图多角度"**（衔接 226 设定图）。

### 扩散+LoRA（PMC）

扩散基础 + LoRA 快速风格/主体适配——**"快适配"**（衔接 333）。

## 技巧与示例

### 知识引导工作流

```text
知识/参考库（376）→ 特征提取 → 迁移
  → LoRA 适配 → 生成 → 一致性校验
```

### 引导示例

"reference analysis → feature transfer + LoRA adaptation + turnaround sheets"——**分析+迁移+适配**。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 无参考分析 | 漂移 | 特征提取 |
| 单角度 | 视角缺 | 转面表 |
| 无 LoRA | 适配慢 | 快适配 |
| 知识不引导 | 盲生成 | 库驱动 |
| 不校验一致 | 效果未知 | 一致性检查 |

## 工作流应用（AI 映射）

知识驱动（衔接 183/226/290/333/376）：

```text
知识库 → 分析 → 迁移 → 适配 → 生成 → 校验
```

**DirectorX 纪律**：学了再用；一图多角度；LoRA 快适配；知识引导生成。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 知识引导 | Knowledge-Guided | 参考驱动 |
| 特征提取 | Feature Extraction | 身份风格 |
| 转面参考表 | Turnaround Sheet | 多角度 |
| LoRA 适配 | LoRA Adaptation | 快速风格 |
| 代理式系统 | Agentic System | 多模态 |
| 跨场景迁移 | Cross-Scene Transfer | 一致性 |

## 来源

- OpenAI — GPT Image Generation Models Prompting Guide：https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide
- Kittl — AI Image Generation Complete Guide for Designers：https://www.kittl.com/blogs/ai-image-generation-guide-ais/
- PMC — Visual Guided AI Color Art Generation（Enhanced GAN）：https://pmc.ncbi.nlm.nih.gov/articles/PMC13003049/
- Miraflow — The AI Image Generation Arms Race 2026：https://miraflow.ai/blog/ai-image-generation-arms-race-2026-everything-changes
- IsaZeni — Current Capabilities of AI Image Generation：https://isazeni.com/what-are-the-current-capabilities-of-ai-image-generation/