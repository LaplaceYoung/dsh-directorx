# 知识库终索引设计（Knowledge Final Index — Total Navigation System）

> 本页为知识库终索引设计：信息架构（按任务设计/内容模型/元数据导航）、分层检索（语义/递归/朴素分块对比）、渐进披露（LLM 维护的 wiki 知识库消融）、无索引语义库（确定性检索<90ms）。知识本体来自 2026 索引研究（arXiv/KnowledgeBase.software）。AI 应用面向 DirectorX：知识库终索引（衔接 385 导航、394 对应、376 技能树、80 手册）。
> 来源：KnowledgeBase.software「Information Architecture Guide」、arXiv「Systematic Framework for Enterprise Knowledge Retrieval」、arXiv「Progressive Disclosure for Wiki KB」、arXiv「Memanto: Typed Semantic Memory」。

## 概述

**核心断言**：知识库终索引 = **"任务架构+分层检索+导航披露"**——信息架构（按任务/内容模型/元数据）；分层检索（分块策略对比）；渐进披露（LLM 维护 wiki 消融）；无索引语义库（确定性检索<90ms）（衔接 385：导航；376：技能树）。

## 核心概念

### 信息架构（KB.software）

按任务设计 IA + 内容模型 + 元数据连接搜索——**"任务优先架构"**。

### 分层检索（arXiv 2512）

语义/递归/朴素分块对比 + 元数据增强——**"分块策略"**（衔接 385）。

### 渐进披露（arXiv 2607）

LLM 维护 wiki：渐进披露消融（何时有效）——**"逐步揭示"**。

### 无索引语义（Memanto）

确定性检索 <90ms（无索引语义数据库）——**"快而确定"**。

## 技巧与示例

### 终索引工作流

```text
任务分析 → IA 设计 → 分块策略
  → 元数据 → 渐进披露 → 检索测试
  → 迭代
```

### 索引示例

"task-first IA + metadata-enriched chunking + progressive disclosure + deterministic retrieval"——**架构+分块+披露+检索**。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 无任务架构 | 难用 | IA |
| 朴素分块 | 召回差 | 策略对比 |
| 一次性全露 | 超载 | 渐进 |
| 检索慢 | 体验差 | 快检索 |
| 不测试 | 盲 | QA 导航 |

## 工作流应用（AI 映射）

知识库终索引（衔接 80/376/385）：

```text
任务 → IA → 分块 → 元数据 → 披露 → 测试
```

**DirectorX 纪律**：任务优先架构；分块有策略；渐进披露；确定性检索。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 信息架构 | Information Architecture | 任务优先 |
| 分块策略 | Chunking Strategy | 三对比 |
| 渐进披露 | Progressive Disclosure | 逐步揭示 |
| 元数据检索 | Metadata-Enriched Retrieval | 增强 |
| 确定性检索 | Deterministic Retrieval | <90ms |
| 导航测试 | Navigation QA | 可用性 |

## 来源

- KnowledgeBase.software — Knowledge Base Information Architecture: Tested Guide：https://knowledge-base.software/guides/building-a-knowledge-base-information-architecture/
- arXiv — A Systematic Framework for Enterprise Knowledge Retrieval（2512.05411）：https://arxiv.org/html/2512.05411v1
- arXiv — Progressive Disclosure for LLM-Maintained Wiki Knowledge Bases（2607.04576）：https://arxiv.org/pdf/2607.04576.pdf
- arXiv — Memanto: Typed Semantic Memory（2604.22085）：https://arxiv.org/pdf/2604.22085.pdf
- arXiv — Distilling Enterprise Knowledge into Navigable Agent Skills（2604.14572）：https://arxiv.org/html/2604.14572v3