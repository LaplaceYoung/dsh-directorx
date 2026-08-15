# AI 图片角色概念设计（Character Concept Design — Sheets, Turnarounds & Silhouette）

> 本页为 AI 图片角色概念设计：角色设定图（三视转向/表情表/装备分解/配色研究/剪影对比）、概念设计提示词结构、风格简报、角色可读性。知识本体来自 2026 概念设计指南（YouMind/ReelMind/Kalon/AIUnpacker）。AI 应用面向 DirectorX：角色开发（衔接 117 一致性、183 参考、226 对应、69 表演）。
> 来源：YouMind「Character Concept Design Sheet Prompt」、Kalon「AI Character Sheet Prompts」、ReelMind「AI Character Concept Art」、AIUnpacker「Character Design Sheet Prompts」。

## 概述

**核心断言**：角色概念设计 = **一套信息完整的设定图**——三视转向（前/侧/背）+ 表情表（5-7 表情）+ 装备分解 + 配色研究 + 剪影对比（小尺寸可读性）。AI 提示词把"设计文档"写进提示词（衔接 183：参考图是设定图的锚定机制；117：一致性从概念期开始）。

## 核心概念

### 设定图组成（YouMind）

```
① 三视转向：前/侧/背，中性姿势
② 表情表：5-7 个关键表情（212 表情库）
③ 装备分解：标注部件/材质
④ 配色研究：主/次/强调色块
⑤ 剪影对比：小尺寸可读性
⑥ 参考注记：背景/性格/姿势
```

### 概念设计提示词结构

```text
角色概念（原型/时代/调性）
  → 设定图要素（转向/表情/装备）
  → 风格简报（风格化/写实/动漫，224）
  → 布局约束（白底/高清/标注）
```

## 技巧与示例

### 角色设定图工作流

```text
角色概念 → 设定图要素清单
  → 风格简报（224）→ 提示词
  → 生成 → 一致性检查（117）
  → 剪影可读性校验 → 定稿
  → 转参考图（183 生产用）
```

### 剪影可读性

**剪影测试**（黑白小尺寸能否辨认）：角色轮廓独特 = 可读性强（衔接 152 IP 识别度）。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 无三视转向 | 生产漂移 | 转向图 |
| 剪影平庸 | 无辨识 | 轮廓设计 |
| 风格简报缺 | 风格漂移 | 简报先行 |
| 无配色研究 | 色彩乱 | 色块 |
| 设定图当成品 | 信息不全 | 完整要素 |

## 工作流应用（AI 映射）

角色开发（衔接 117/152/183/212）：

```text
概念 → 设定图（要素清单）→ 风格简报
  → 生成 → 一致性（117）→ 剪影校验
  → 转参考（183）→ 表情库（212）
```

**DirectorX 纪律**：设定图信息完整；三视转向保生产；剪影定辨识；风格简报先行。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 三视转向 | Three-View Turnaround | 前/侧/背 |
| 表情表 | Expression Sheet | 情绪集 |
| 装备分解 | Exploded View | 部件标注 |
| 剪影对比 | Silhouette Comparison | 可读性 |
| 配色研究 | Color Study | 色块方案 |
| 设定图 | Design Sheet | 概念文档 |

## 来源

- YouMind — Character Concept Design Sheet (GPT Image 2 Prompt)：https://youmind.com/prompts/character-concept-design-sheet-25891
- Kalon — AI Character Sheet Prompts: Turnarounds & Expression Charts：https://www.kalon.ai/templates/ai-character-sheet-prompts
- ReelMind — AI Character Concept Art Prompt for Gaming Design：https://reelmind.ai/blog/ai-character-concept-art-prompt-ai-for-gaming-design
- AIUnpacker — AI Prompts for Character Design Sheets：https://aiunpacker.com/prompts/character-design-sheet-ai-prompts-for-game-artists
- Promptomania — Best Character Design Prompts for AI：https://promptomania.com/prompts/character-design-prompts