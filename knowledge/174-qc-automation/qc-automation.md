# AI 成片质检自动化（QC Automation — Artifact Detection & Review Pipeline）

> 本页为 AI 成片质检自动化：缺陷自动检测（口型错位/手部变形/压缩伪影/色彩偏移/丢帧）、无参考质量评分（No-Reference VQA）、响度/字幕合规检查、QC 节点集成。知识本体来自 2026 AI-QC 指南（Twelve Labs/Beverlyboy/Promwad/ReelMind）。AI 应用面向 DirectorX：交付前质检（衔接 118 缺陷修复、129 评测、122 成本）。
> 来源：Twelve Labs「AI Video QC: Catch Generation Defects (Pegasus)」、Promwad「AI-QC: Automated Media Quality Control」、Beverlyboy「AI QC in Post-Production」、ReelMind「Automated Video Quality Check」。

## 概述

**核心断言**：AI 生成快但缺陷多——**人工逐帧审不完，QC 必须自动化**。2026 AI-QC 节点自动检测：口型错误、手部变形、短暂不一致、块状伪影（Blockiness）、蚊噪（Mosquito Noise）、色彩偏移、丢帧、响度/字幕合规。**QC 节点 = 生成管线的一部分**（非交付后补救），产出"缺陷报告 → 自动建议修正"。

## 核心概念

### 缺陷检测清单

| 类别 | 检测项 |
|---|---|
| 生成缺陷 | 口型错位、手部变形、短暂不一致（118） |
| 压缩伪影 | 块状、蚊噪、色彩偏移 |
| 技术问题 | 丢帧、音频爆音、字幕错误 |
| 合规 | 响度（161）、字幕准确性 |

### QC 管线（Promwad）

```text
生成 → 无参考 VQA 评分（质量打分）
  → 缺陷检测（分类器定位）
  → 响度/字幕合规检查
  → 报告（时间码 + 缺陷类型 + 建议）
  → 修正循环（118 修复）→ 复检
```

## 技巧与示例

### QC 节点集成（Twelve Labs Pegasus 模式）

```text
批量生成 → QC 节点（自动）
  → 缺陷报告（时间码定位）
  → 高优先级（口型/手部）自动标记
  → 人工只审"可疑片段"（省 80% 时间）
  → 修正（118）→ 复检通过 → 交付
```

### 质量评分与成本联动

VQA 评分挂钩生成批次质量 → 参数/模型调优决策（衔接 129 评测、138 参数、122 成本）。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 人工逐帧审 | 时间黑洞 | QC 自动化 |
| QC 后置 | 缺陷扩散 | 管线内 QC 节点 |
| 只看视觉 | 响度/字幕漏检 | 全项检查 |
| 无报告定位 | 难修正 | 时间码报告 |
| 复检缺失 | 缺陷残留 | 修正后复检 |

## 工作流应用（AI 映射）

交付前质检（衔接 118/122/129）：

```text
生成批次 → QC 节点（VQA + 缺陷检测）
  → 合规检查（161 响度/字幕）
  → 缺陷报告 → 人工审可疑片段
  → 修正（118）→ 复检 → 交付
```

**DirectorX 纪律**：QC 是管线节点非事后补救；报告带时间码；人工只审可疑段；修正必复检。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 质量检测 | QC | Quality Control |
| 无参考评分 | No-Reference VQA | 无原片评分 |
| 块状伪影 | Blockiness | 压缩块状 |
| 蚊噪 | Mosquito Noise | 边缘噪点 |
| 质检节点 | QC Node | 管线内自动检查 |
| 缺陷报告 | Defect Report | 时间码定位 |

## 来源

- Twelve Labs — AI Video QC: Catch Generation Defects with Pegasus：https://www.twelvelabs.io/blog/the-qc-node
- Promwad — AI-QC: Automated Media Quality Control for Broadcast：https://promwad.com/news/ai-qc-automated-media-quality-control
- Beverlyboy — AI QC: Automated Quality Control in Post-Production：https://beverlyboy.com/film-technology/ai-qc-automated-quality-control-in-post/
- ReelMind — Automated Video Quality Check: AI That Identifies Technical Issues：https://reelmind.ai/blog/automated-video-quality-check-ai-that-identifies-technical-issues
- Promwad — AI-QC in Broadcasting: Artifacts, Loudness, Subtitles：https://promwad.com/news/ai-qc-automated-quality-control-broadcasting-detecting-artifacts-loudness-subtitle-errors