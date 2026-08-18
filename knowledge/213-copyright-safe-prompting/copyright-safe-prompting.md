---
type: Method
title: "AI 版权安全提示词（Copyright-Safe Prompting — Genericization & IP Avoidance）"
description: "AI 视频/图片的版权安全提示词技巧：泛化（Genericization：描述属性而非命名风格/角色）、移除专有名词（艺术家名/角色名/作品名）、非 IP 锚定（艺术运动/历史时期/通用技法）、负向提示防角色复制（负向关键词：版权角色名+特征词）"
tags:
  - "consistency"
  - "prompt"
  - "character"
  - "style"
  - "copyright"
  - "image"
status: stable
stale_after: "2027-08-18"
generated:
  by: "process:directorx-knowledge-okf"
  at: "2026-08-18T00:00:00Z"
verified:
  - by: "process:knowledge-audit"
    at: "2026-08-18T00:00:00Z"
sources:
  - resource: "cited:arXiv Safer Prompts: Reducing IP Risk in Visual Generative AI"
    id: cite-1
    title: "Safer Prompts: Reducing IP Risk in Visual Generative AI"
    author: "org:arXiv"
  - resource: "cited:arXiv Fantastic Copyrighted Beasts and How (Not) to Generate"
    id: cite-2
    title: "Fantastic Copyrighted Beasts and How (Not) to Generate"
    author: "org:arXiv"
  - resource: "cited:Nature Copyright in AI Image Generation through Genericization"
    id: cite-3
    title: "Copyright in AI Image Generation through Genericization"
    author: "org:Nature"
  - resource: "cited:Alibaba Avoid Copyrighted Anime Character Silhouettes"
    id: cite-4
    title: "Avoid Copyrighted Anime Character Silhouettes"
    author: "org:Alibaba"
  - resource: "https://arxiv.org/html/2505.03338v1"
    id: url-1
    title: "arxiv.org"
  - resource: "https://arxiv.org/html/2406.14526v2"
    id: url-2
    title: "arxiv.org"
  - resource: "https://www.nature.com/articles/s41598-025-90827-1"
    id: url-3
    title: "nature.com"
  - resource: "https://www.alibaba.com/product-insights/how-to-prompt-ai-image-generators-to-avoid-copyrighted-anime-character-silhouettes.html"
    id: url-4
    title: "alibaba.com"
  - resource: "https://www.alibaba.com/product-insights/how-to-make-ai-art-prompts-that-avoid-copyright-traps-style-referencing-vs-direct-mimicry.html"
    id: url-5
    title: "alibaba.com"
  - resource: "https://www.copyright.gov/ai/Copyright-and-Artificial-Intelligence-Part-2-Copyrightability-Report.pdf"
    id: url-6
    title: "copyright.gov"
dx_id: "213"
aliases:
  - "214"
related:
  - "145-copyright-ethics/copyright-ethics.md"
  - "72-ai-content-compliance/ai-content-compliance.md"
  - "154-prompt-safety/prompt-safety.md"
  - "191-documentary-material-compliance/documentary-material-compliance.md"
  - "166-documentary-ethics/documentary-ethics.md"
---

# AI 版权安全提示词（Copyright-Safe Prompting — Genericization & IP Avoidance）

> 本页为 AI 视频/图片的版权安全提示词技巧：泛化（Genericization：描述属性而非命名风格/角色）、移除专有名词（艺术家名/角色名/作品名）、非 IP 锚定（艺术运动/历史时期/通用技法）、负向提示防角色复制（负向关键词：版权角色名+特征词）。知识本体来自 2026 版权提示词研究（arXiv Safer Prompts/负向提示实验/Nature 泛化研究）。AI 应用面向 DirectorX：合规生成（衔接 145 版权、72 合规、154 安全、191 清权、166 伦理）。
> 来源：arXiv「Safer Prompts: Reducing IP Risk in Visual Generative AI」、arXiv「Fantastic Copyrighted Beasts and How (Not) to Generate」、Nature「Copyright in AI Image Generation through Genericization」、Alibaba「Avoid Copyrighted Anime Character Silhouettes」。

## 概述

**核心断言**：版权安全提示词 = **"描述属性，不点名身份"**——泛化（Genericization）把"宫崎骏风格"换成"手绘动画、柔和色彩、自然主题、细腻背景细节"；**移除专有名词**（艺术家/角色/作品名）；**锚定非 IP 语境**（艺术运动/历史时期/通用技法）。**负向提示是缓解策略**：`"Copyrighted character" + 角色名 + 特征词` 作为负向提示可降低角色复制。

## 核心概念

### 泛化三原则（Safer Prompts/Genericization）

```
① 属性化：描述光线/构图/材质，不写风格名
② 去专名：移除艺术家/角色/作品名
③ 非 IP 锚定：艺术运动/历史时期/通用技法
```

### 风格参照 vs 直接模仿（合法性分界）

| 方式 | 合法性 | 说明 |
|---|---|---|
| 风格参照（Style Referencing） | 较安全 | 通用属性描述 |
| 直接模仿（Direct Mimicry） | 高风险 | 点名风格/角色 |

### 负向提示缓解（arXiv 实验）

负向提示关键词（版权角色名 + 特征词）可显著降低角色复制率——**"不要生成 X"比"描述 X"更安全**（衔接 199 反精致同构：排除式驱动）。

## 技巧与示例

### 版权安全改写示例

```text
高风险："Studio Ghibli style, Totoro character"
安全版："hand-drawn animation style, soft pastel colors, whimsical forest
creatures, detailed backgrounds, nature theme, 1980s anime aesthetic"
负向版：+ negative "Totoro, Ghibli, copyrighted character"

高风险：「蜘蛛侠在楼宇间摆荡」
安全版：不要套固定替换句。按角色轴结合本句情境写细——
  原型/体型、服装材质与色块（不要复刻经典套装剪影）、抽象标志物、
  以及必须保留的动作与场景（「在楼宇间摆荡」）。
负向版：+ negative "Spider-Man, Marvel, copyrighted character"
```

画布对 IP 专名画红色波浪线，并把改写交给 DSH。工程只检出 + 方法轴 + 负向词 + 项目记忆；成稿由 agent 按当前镜头写。`directorx_ip_scan` 返回方法与记忆，`directorx_ip_rewrite` 验收后记入本项目记忆。论文口径：只改写不够，生成时仍应带负向排除（arXiv 2406.14526）。

### 视频场景的版权规避

- 角色：**不点名**，用"青年冒险者/红发少女"等通用描述（117 原创角色卡）
- 音乐：不写"某电影配乐风格"，用"史诗管弦乐/弦乐渐强"（144）
- 场景：不写"某电影场景"，用"赛博朋克街道/哥特城堡"（165 环境）

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 提示词点名风格 | 侵权风险 | 属性化泛化 |
| 角色名入提示 | 角色复制 | 负向排除 |
| 作品名引用 | 高相似 | 非 IP 锚定 |
| 无视平台策略 | 内容下架 | 平台条款 |
| 风格模仿当创作 | 法律边界 | 借鉴属性 |

## 工作流应用（AI 映射）

合规生成（衔接 72/145/154）：

```text
创意意图 → directorx_ip_scan（检出 + 方法轴 + 项目记忆）
  → knowledge_read 213
  → 按当前镜头写细改写（泛化/去专名/保留情境）
  → directorx_ip_rewrite（验收 + 记入记忆）
  → 负向提示（版权名+特征）
  → 生成 → 相似度检查（129 评测）
  → 平台合规复核（145）→ 交付
```

**DirectorX 纪律**：描述属性不点名；负向排除版权目标；非 IP 语境锚定；生成后相似度检查。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 泛化 | Genericization | 属性化描述 |
| 专有名词 | Proper Noun | 风格/角色名 |
| 风格参照 | Style Referencing | 通用属性 |
| 直接模仿 | Direct Mimicry | 点名复制 |
| 非 IP 锚定 | Non-IP Anchoring | 通用语境 |
| 负向缓解 | Negative Mitigation | 排除式防复制 |

## 来源

- arXiv — Safer Prompts: Reducing IP Risk in Visual Generative AI（2505.03338）：https://arxiv.org/html/2505.03338v1
- arXiv — Fantastic Copyrighted Beasts and How (Not) to Generate（2406.14526）：https://arxiv.org/html/2406.14526v2
- Nature — Tackling Copyright Issues in AI Image Generation through Genericization（s41598-025-90827-1）：https://www.nature.com/articles/s41598-025-90827-1
- Alibaba — How to Prompt AI Image Generators to Avoid Copyrighted Character Silhouettes：https://www.alibaba.com/product-insights/how-to-prompt-ai-image-generators-to-avoid-copyrighted-anime-character-silhouettes.html
- Alibaba — AI Art Prompts: Style Referencing vs Direct Mimicry：https://www.alibaba.com/product-insights/how-to-make-ai-art-prompts-that-avoid-copyright-traps-style-referencing-vs-direct-mimicry.html

## 补充：进阶版权规避策略（公共领域、原型与作者身份）

### 三层规避策略

```
① 公共领域：老角色/老作品（版权过期）直接利用
② 原型+特征：通用原型（骑士/侦探）+ 独有特征
③ 转换性使用：新意义/评论/恶搞（衔接 166 再现标注）
```

### 公共领域利用工作流

```text
角色/作品公共领域核查（版权到期？）
  → 直接用（零风险）
  → 仍可加独有特征（区别化）
  → 生成 → 检查（129 相似度）
```

### 原型提示词模板

```text
"年轻侦探，风衣，城市夜景，聪明但固执"（原型：侦探）
vs "Sherlock Holmes"（具体角色：高风险）
```

### 间接锚定（提示词重写与保真度控制）

提示词重写（短名 → 长描述）会**改变保真度**——"改写得更通用"降低与原角色的相似度，这是泛化（Genericization）的机制化说明。

### AI 生成内容的版权现状（美国版权局 Part 2）

| 内容类型 | 可版权性 |
|---|---|
| 纯 AI 生成（无足够人类控制） | 不可版权 |
| AI 辅助（人类表达可感知） | 部分可保护（只保护人类贡献） |
| 提示词单独 | 通常不够作者身份 |

**人类创作贡献是可保护性的关键**——提示词本身通常不够构成人类作者身份，但人类在后期编辑、创意指导中的可见贡献可获得部分保护。

### 转换性使用（Transformative Use）

转换性使用通过赋予作品**新意义、新表达或评论/恶搞目的**来规避侵权——关键在于产出的作品是否具有独立的创意价值，而非仅仅复制原作。

### 声音/音乐授权纪律

```text
克隆任何声音前：显式书面同意（137 数字人授权）
  → 平台商业条款检查（145）
  → AI 披露元数据（EU 2026-08 规则，145）
  → 混合作品：人类部分登记 PRO
```

### 进阶合规工作流

```text
素材版权核查（公共领域/授权/原创）
  → 三层规避策略（公共/原型/转换）
  → 生成 → 相似度检查（129）
  → 人类创作叠加（可版权性）→ 披露 → 交付
```

**DirectorX 进阶纪律**：公共领域优先；原型模糊身份；声音必授权；人类贡献保可版权性；披露元数据。

### 进阶术语补充

| 中文 | English | 说明 |
|---|---|---|
| 公共领域 | Public Domain | 版权到期可用 |
| 原型 | Archetype | 通用人物类型 |
| 间接锚定 | Indirect Anchoring | 通用化改写 |
| 转换性使用 | Transformative Use | 新意义表达 |
| 人类作者身份 | Human Authorship | 可版权前提 |
| 数字复制品 | Digital Replica | 声音/肖像复制 |

### 进阶来源

- US Copyright Office — Copyright and Artificial Intelligence, Part 2: Copyrightability Report：https://www.copyright.gov/ai/Copyright-and-Artificial-Intelligence-Part-2-Copyrightability-Report.pdf
- US Copyright Office — Copyright and AI, Part 1: Digital Replicas：https://www.copyright.gov/ai/Copyright-and-Artificial-Intelligence-Part-1-Digital-Replicas-Report.pdf
- Congress — Generative Artificial Intelligence and Copyright Law（LSB10922）：https://www.congress.gov/crs-product/LSB10922
- MusicMake — AI Music Copyright 2026: Legal Guide for Creators：https://musicmake.ai/blog/ai-music-copyright-2026
- DWT — Character Copyright Protection in the Age of Generative AI：https://www.dwt.com/insights/2026/04/character-copyright-protection-generative-ai

<!-- merged from: #214-copyright-safe-prompting-advanced -->

## 相关概念

- [AI 视频版权与伦理合规（Copyright & Ethics — Deepfake, Likeness, Provenance & Disclosure）](../145-copyright-ethics/copyright-ethics.md)
- [AI 内容合规实务（AI Content Compliance）](../72-ai-content-compliance/ai-content-compliance.md)
- [AI 视频提示词安全防护（Prompt Safety — Injection, Jailbreak & Layered Guardrails）](../154-prompt-safety/prompt-safety.md)
- [AI 纪录片素材合规矩阵（Documentary Clearance — Rights Layers & License Tracking）](../191-documentary-material-compliance/documentary-material-compliance.md)
- [AI 纪录片伦理深化（Documentary Ethics — Truthfulness, Consent & Editorial Accountability）](../166-documentary-ethics/documentary-ethics.md)
