# AI 图片文字渲染（Text Rendering — Typography as Controlled Object in Images）

> 本页为 AI 图片文字渲染：文字作为受控对象（精确文本/位置/字体/对比）、提示词结构（文本作业定义/布局/约束）、字体现身（3D/霓虹/浮雕）、校对纪律。知识本体来自 2026 文字渲染指南（Ideogram/FreeGptImg/Pixocto/Promptomania）。AI 应用面向 DirectorX：图片文字（衔接 194 动态文字、205 海报、213 版权、221 对应）。
> 来源：Ideogram「Text and Typography Prompting」、FreeGptImg「AI Text Rendering Prompt Workflow 2026」、Pixocto「AI Poster Typography Guide」、Promptomania「Typography & Text Art Prompts」。

## 概述

**核心断言**：AI 文字渲染 = **把文字当受控对象**——指定精确文本（引号括起）、位置、字体风格、色彩对比、背景；**文字要大、要少、背景要简**（可读性三原则）。2026 进展：短精确文本渲染已可用（Ideogram 类），长文本/复杂排版仍是短板。

## 核心概念

### 文字渲染提示结构（FreeGptImg）

```text
① 文本作业：标题/标签/招牌/徽章
② 精确文本：引号括起（"YOUR TEXT"）
③ 布局：位置（居中/上三分一）
④ 样式：字体类（衬线/无衬线/手写/等宽）
⑤ 约束：高对比/简单背景/无杂乱
```

### 可读性三原则

```
文字大（足够尺寸）
文字少（短精确）
背景简（高对比）
```

## 技巧与示例

### 文字渲染工作流

```text
文本作业定义（标题/标签）→ 精确文本
  → 布局/样式 → 约束（对比/背景）
  → 多变体生成 → 全尺寸校对（错字）
  → 修正（重生成局部）
```

### 字体现身效果（Promptomania）

```text
"3D metallic text" / "neon sign text" / "embossed text"
（字体效果作为风格对象，衔接 194 动效静态版）
```

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 长文本入图 | 错字连篇 | 短精确 |
| 文字当浮动层 | 悬浮感 | 融入画面 |
| 无引号括起 | 文本失控 | 精确指定 |
| 背景杂乱 | 不可读 | 高对比 |
| 不校对 | 错字上线 | 全尺寸校对 |

## 工作流应用（AI 映射）

图片文字（衔接 194/205/213）：

```text
文本作业 → 精确文本（引号）→ 布局样式
  → 约束 → 变体 → 校对 → 修正
  → 版权检查（213 不仿品牌字）
```

**DirectorX 纪律**：文字是受控对象；短精确+大+简背景；全尺寸校对；效果融入画面。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 文字渲染 | Text Rendering | 图内文字 |
| 文本作业 | Text Job | 用途定义 |
| 精确文本 | Exact Text | 引号指定 |
| 字体现身 | Text Effect | 3D/霓虹 |
| 高对比 | High Contrast | 可读性 |
| 校对 | Proofreading | 错字检查 |

## 来源

- Ideogram — Fonts and Styles: Text and Typography Prompting：https://docs.ideogram.ai/using-ideogram/getting-started/prompting-guide/2-prompting-fundamentals/text-and-typography
- FreeGptImg — AI Text Rendering in Images: A 2026 Prompt Workflow：https://freegptimg.com/blog/ai-text-rendering-in-images-prompt-workflow-2026
- Pixocto — AI Poster Typography Guide: 6 Styles：https://pixocto.ai/tutorials/gpt-image-2-typography-prompt
- Promptomania — Best Typography & Text Art Prompts：https://promptomania.com/prompts/typography-prompts
- Vidzy — Text in AI Images: Typography in AI Prompts：https://getvidzy.com/text-in-ai-images/