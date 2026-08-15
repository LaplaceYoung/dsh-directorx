# 知识库导航应用（Navigable Knowledge — Corpus2Skill & Skill-Tree Retrieval）

> 本页为知识库的导航应用：技能树（离线编译：鸟瞰→细粒度文档）、导航式检索（结构化可解释优于平面嵌入）、Corpus2Skill 蒸馏（企业知识→可导航 Agent 技能）、RAG 增强（渐进细节摘要）。知识本体来自 2026 知识导航（arXiv Corpus2Skill/AgenticRAG）。AI 应用面向 DirectorX：知识库应用（衔接 80 使用手册、376 对应、本知识库导航）。
> 来源：arXiv「Distilling Enterprise Knowledge into Navigable Agent Skills」、arXiv「AgenticRAG」、LangChain「RAG with Deep Agents」。

## 概述

**核心断言**：知识库导航 = **"技能树+导航式检索"**——离线编译技能树（鸟瞰→细粒度文档往返）；导航优于平面嵌入（结构化可解释）；Corpus2Skill 蒸馏（企业知识→可导航技能）；RAG 渐进摘要（先概览后细节）（衔接 80：知识库手册的应用深化）。

## 核心概念

### 技能树（Corpus2Skill）

```
鸟瞰（概览）→ 技能层 → 细粒度文档
（离线编译，serve 时导航）
```

### 导航 vs 检索（arXiv）

导航式（结构化/可解释/高效）优于平面嵌入（RAG 被动）——**"走向而非搜"**（衔接 80）。

### 渐进摘要（AgenticRAG）

先概览摘要再深入文档——**"由粗到细"**。

## 技巧与示例

### 知识库导航工作流

```text
语料蒸馏（技能树）→ 层级维护
  → 导航检索（先概览）→ 文档深入
  → 溯源校验 → 应用
```

### 导航示例

"skill tree: overview → category → document, navigated not retrieved"——**树形导航**。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 平面检索 | 不可解释 | 技能树 |
| 层级过期 | 误导 | 维护 |
| 无概览 | 盲目深入 | 渐进 |
| 检索替代导航 | 低效 | 导航 |
| 不校验溯源 | 不可信 | 校验 |

## 工作流应用（AI 映射）

知识库应用（衔接 80/本库）：

```text
蒸馏 → 树 → 导航 → 渐进 → 溯源 → 应用
```

**DirectorX 纪律**：技能树导航；由粗到细；结构化可解释；层级常维护。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 技能树 | Skill Tree | 层级导航 |
| 导航式检索 | Navigational Retrieval | 走向而非搜 |
| 语料蒸馏 | Corpus Distillation | 知识提炼 |
| 渐进摘要 | Progressive Summary | 由粗到细 |
| 可解释检索 | Explainable Retrieval | 结构化 |
| 溯源 | Provenance | 证据链 |

## 来源

- arXiv — Distilling Enterprise Knowledge into Navigable Agent Skills（2604.14572）：https://arxiv.org/html/2604.14572v3
- arXiv — AgenticRAG: Agentic Retrieval（2605.05538）：https://arxiv.org/html/2605.05538v1
- arXiv — Don't Retrieve, Navigate（2604.14572）：https://arxiv.org/html/2604.14572
- LangChain — RAG with Deep Agents：https://docs.langchain.com/oss/python/deepagents/rag
- arXiv — Corpus2Skill（2604.14572v1）：https://arxiv.org/html/2604.14572v1