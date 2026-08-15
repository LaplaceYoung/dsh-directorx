# AI 角色表情库管理（Expression Library — Emotion Reference Collection & Consistency）

> 本页为 AI 角色表情库管理：表情参考集（Facial Expression Repertoire）、多角色情绪数据库（FERg-DB）、强度变体命名规范、跨镜头表情一致性、表情库与情绪词汇联动。知识本体来自 2026 表情库研究（PMC/PLOS/LibreFace/虚拟角色手册）。AI 应用面向 DirectorX：表演一致性（衔接 69 表演、175 微表情、132→已并入 69、117 一致性、137 数字人）。
> 来源：PMC「Facial Expression Databases」、PLOS「UIBVFED: Virtual Facial Expression Dataset」、LibreFace「Deep Facial Expression Analysis Toolkit」、USC「Facial Expressions of Emotions for Virtual Characters」。

## 概述

**核心断言**：表情库 = **角色的情绪参考集**——把角色"能做什么表情"固化为参考集合（基础情绪 + 强度变体 + 特定语境表情），跨镜头/跨集引用保**表情一致性**（衔接 175：微表情细节；117：一致性总纲在表演维度的落地）。2026 研究指出：**静态摆拍表情 ≠ 真实生活表情**——表情库要包含动态/强度变体。

## 核心概念

### 表情库结构

```
① 基础情绪（Ekman 六种 + 强度层级）
② 语境表情（特定情境：尴尬/释然/压抑）
③ 动态变体（微表情/过渡表情，175）
④ 命名规范（"joy-mild / joy-full / joy-relief"）
```

### 表情一致性（跨镜头）

表情库作为参考锚定 → 同表情跨镜头一致（衔接 183 参考机制：表情版参考图）。

## 技巧与示例

### 表情库建设工作流

```text
角色情绪分析（人设/剧情需求）
  → 基础情绪六种（强度变体）
  → 语境表情补充
  → 参考图生成（表情定妆照）
  → 命名规范（可检索）
  → 跨镜头引用（117 一致性）
```

### 表情库命名（模板）

```text
[情绪]-[强度]-[语境]：joy-mild / joy-full / joy-relief
（衔接 131 资产命名规范）
```

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 只用静态摆拍 | 表演假 | 动态变体 |
| 无强度层级 | 表情单一 | 强度变体 |
| 命名混乱 | 不可检索 | 命名规范 |
| 跨镜头不复用 | 表情漂移 | 参考锚定 |
| 与情绪词汇脱节 | 提示词断层 | 联动（69） |

## 工作流应用（AI 映射）

表演一致性（衔接 69/117/131/175）：

```text
情绪分析 → 表情库建设（参考图+命名）
  → 跨镜头引用 → 一致性检查（117）
  → 入库（131）→ 复用
```

**DirectorX 纪律**：表情库=情绪参考集；动态+强度变体；命名可检索；跨镜头锚定复用。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 表情库 | Expression Library | 情绪参考集 |
| 强度变体 | Intensity Variant | 程度层级 |
| 语境表情 | Contextual Expression | 特定情境 |
| 动态变体 | Dynamic Variant | 过渡表情 |
| 表情定妆照 | Expression Reference | 参考锚定 |
| 命名规范 | Naming Convention | 可检索 |

## 来源

- PMC — Facial Expression Databases（动态 vs 静态摆拍）：https://pmc.ncbi.nlm.nih.gov/articles/PMC12209106/
- PLOS — UIBVFED: Virtual Facial Expression Dataset：https://journals.plos.org/plosone/article/file?id=10.1371/journal.pone.0231266&type=printable
- LibreFace — An Open-Source Toolkit for Deep Facial Expression Analysis (WACV 2024)：https://openaccess.thecvf.com/content/WACV2024/papers/Chang_LibreFace_An_Open-Source_Toolkit_for_Deep_Facial_Expression_Analysis_WACV_2024_paper.pdf
- USC — Facial Expressions of Emotions for Virtual Characters：https://people.ict.usc.edu/~gratch/CSCI534/Readings/ACII-Handbook-VHexpression.pdf
- Wikipedia — List of Facial Expression Databases：https://en.wikipedia.org/wiki/List_of_facial_expression_databases