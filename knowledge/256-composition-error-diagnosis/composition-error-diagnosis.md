# AI 图片构图错误诊断（Composition Error Diagnosis — Detect, Fix & Regenerate）

> 本页为 AI 图片的构图错误诊断：常见失败（居中滥用/杂乱/无张力/伪影/错字/解剖）、诊断-修复工作流（加电影语言→避免居中→多变体+后处理）、提示词精化。知识本体来自 2026 构图诊断指南（Envato/ZSky/Proxyle/10b.ai）。AI 应用面向 DirectorX：图片质检（衔接 216 构图、256 对应、174 QC、118 缺陷）。
> 来源：Envato「10 AI Image Fails and How to Fix」、ZSky「Why Your AI Images Look Bad: 15 Fixes」、Proxyle「How to Fix Composition Issues」、10b.ai「Common AI Image Issues」。

## 概述

**核心断言**：构图问题**可系统诊断**——常见失败有模式（居中滥用/杂乱/无张力/伪影/错字/解剖），每个模式有对应修复（加电影语言/刻意构图/多变体+后处理）（衔接 216：构图法则的反面；174：QC 的图片版）。

## 核心概念

### 失败模式表（ZSky 15 类）

| 失败 | 诊断 | 修复 |
|---|---|---|
| 居中滥用 | 无设计感 | 三分/偏移（216） |
| 杂乱 | 无焦点 | 简化/负空间（192） |
| 无张力 | 平 | 对角线/对比（236） |
| 伪影 | 生成缺陷 | 参数/重生成（118） |
| 错字 | 文字失败 | 短文本/校对（221） |
| 解剖错误 | 肢体乱 | 姿态约束/变体 |

### 修复优先级

```text
① 加电影语言（景别/光/镜头/情绪）
② 避免居中/杂乱（216 法则）
③ 多变体 + 后处理（伪影/文字/解剖）
```

## 技巧与示例

### 诊断工作流

```text
失败观察（模式归类）→ 根因分析
  → 修复动作（提示词精化）
  → 重生成 → 复检
```

### 提示词精化示例

"居中无张力" → "off-center, diagonal composition, strong contrast, leading lines"（216/210 注入）。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 无诊断直接重roll | 盲试 | 模式归类 |
| 一次改全变量 | 无法归因 | 单变量（162） |
| 忽略后处理 | 伪影残留 | 修复+变体 |
| 构图问题当参数问题 | 错修 | 根因定位 |
| 无复检 | 复发 | 修复后校验 |

## 工作流应用（AI 映射）

图片质检（衔接 118/162/174/216）：

```text
生成 → 失败模式诊断 → 根因 → 修复
  → 重生成 → 复检 → 交付
```

**DirectorX 纪律**：模式化诊断；单变量修复；后处理兜底；根因定位防错修。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 失败模式 | Failure Pattern | 问题归类 |
| 居中滥用 | Center Bias | 无设计感 |
| 解剖错误 | Anatomy Error | 肢体乱 |
| 提示词精化 | Prompt Refinement | 定向修复 |
| 根因定位 | Root Cause | 原因分析 |
| 复检 | Recheck | 修复校验 |

## 来源

- Envato — 10 AI Image Fails and How to Fix Them：https://elements.envato.com/learn/ai-image-fails
- ZSky — Why Your AI Images Look Bad: 15 Fixes (2026)：https://zsky.ai/blog/why-ai-images-look-bad
- Proxyle — How to Fix Composition Issues in AI Art：https://proxyle.com/blog/how-to-fix-composition-issues-in-ai-art/
- 10b.ai — Common AI Image Generation Issues and Fixes：https://10b.ai/blog/common-ai-image-generation-issues-fixes
- Envato — 5 Graphics Generation Issues: Troubleshooting：https://elements.envato.com/learn/graphics-generation-issues