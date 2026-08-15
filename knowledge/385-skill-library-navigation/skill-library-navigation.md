# 知识库技能库导航优化（Skill-Library Navigation — Corpus2Skill & Hybrid Retrieval）

> 本页为知识库技能库导航优化：Corpus2Skill（文档集→层级技能目录，代理导航替代平面检索）、渐进摘要+按 ID 取全文、混合排序器（大技能库检索：正确技能召回）、图方法（结构助力/受阻条件）。知识本体来自 2026 导航优化（arXiv Corpus2Skill/混合排序）。AI 应用面向 DirectorX：知识库优化（衔接 376 导航、385 对应、80 手册、本库）。
> 来源：arXiv「Distilling Enterprise Knowledge into Navigable Agent Skills」、arXiv「Comparative Approaches to Agent Retrieval」、OpenReview「Corpus2Skill」。

## 概述

**核心断言**：技能库导航优化 = **"导航替代检索+混合增强"**——Corpus2Skill（层级技能目录，代理导航）；渐进摘要+按 ID 取全文；混合排序器（大库召回正确技能）；图方法（结构何时帮/何时阻）（衔接 376：导航的优化版；80：手册）。

## 核心概念

### Corpus2Skill（arXiv）

文档集 → 层级技能目录 → 代理导航（替代平面嵌入）——**"走向而非搜"**（衔接 376）。

### 渐进+ID（OpenReview）

多级渐进摘要 + 导航时按 ID 取全文——**"先概览后全文"**。

### 混合排序（arXiv 2608）

大技能库：混合排序器召回正确技能（117 查询实测）——**"混合>单一"**。

### 图方法条件

结构帮助或受阻（条件评估）——**"结构非万能"**。

## 技巧与示例

### 技能库优化工作流

```text
语料蒸馏（技能树）→ 渐进摘要
  → 混合排序导航 → 按 ID 取全文
  → 结构评估 → 应用
```

### 优化示例

"Corpus2Skill navigation + hybrid ranker + progressive summaries + ID-based full docs"——**导航+混合+渐进**。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 平面检索 | 召回差 | 导航 |
| 无渐进 | 盲目深入 | 摘要 |
| 单一排序 | 召回错 | 混合 |
| 结构盲目用 | 反效 | 条件评估 |
| 不校验导航 | 效果未知 | 召回测试 |

## 工作流应用（AI 映射）

知识库优化（衔接 80/376）：

```text
蒸馏 → 树 → 渐进 → 混合导航 → 全文 → 评估
```

**DirectorX 纪律**：走向而非搜；混合召回；渐进概览；结构有条件。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 技能目录 | Skill Directory | 层级导航 |
| 渐进摘要 | Progressive Summary | 多级概览 |
| 混合排序器 | Hybrid Ranker | 召回增强 |
| 按 ID 取全文 | ID-Based Retrieval | 导航取文 |
| 图方法 | Graph Method | 结构导航 |
| 召回测试 | Recall Evaluation | 效果验证 |

## 来源

- arXiv — Distilling Enterprise Knowledge into Navigable Agent Skills（2604.14572）：https://arxiv.org/html/2604.14572
- arXiv — Comparative Approaches to Agent Retrieval over Large Skill Libraries（2608.06196）：https://arxiv.org/html/2608.06196v1
- OpenReview — Corpus2Skill（PDF）：https://openreview.net/pdf?id=iFPjQzjIy8
- arXiv — Corpus2Skill（v3）：https://arxiv.org/html/2604.14572v3
- LangChain — RAG with Deep Agents：https://docs.langchain.com/oss/python/deepagents/rag