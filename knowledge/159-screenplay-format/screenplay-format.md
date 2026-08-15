# AI 视频剧本格式规范（Screenplay Format — Industry Standards as AI Input）

> 本页为 AI 视频的剧本格式规范：行业标准格式（场头/动作/对白/转场）、Courier 12pt 与页数规则（1 页≈1 分钟）、格式作为 AI 生成的结构化输入。知识本体来自 2026 剧本格式指南（Plotwell/ScreenWeaver/QuoteUnquote/Laper）。AI 应用面向 DirectorX：剧本阶段（衔接 103 剧本写作、150 叙事、143 短剧）。
> 来源：Plotwell「How to Format a Screenplay 2026」、ScreenWeaver「Screenplay Format: The Complete Guide 2026」、QuoteUnquote「Standard Screenplay Format」、Laper「Professional AI Screenplay Editor」。

## 概述

**核心断言**：剧本格式不是排版洁癖，而是**生产信息层**——场头（Slugline）告诉摄影/美术/后期"在哪拍、什么时间、内外景"；1 页≈1 分钟直接换算成片时长。**AI 时代格式变成结构化输入**：规范剧本 → 可直接分解为分镜/提示词/场记表（衔接 103/109）。

## 核心概念

### 剧本六要素（ScreenWeaver）

```
① 场头 Slugline（INT./EXT. + 地点 + 时间）
② 动作描述 Action（视觉信息）
③ 人物提示 Character Cue（谁说话）
④ 括注 Parentheticals（语气/动作提示）
⑤ 对白 Dialogue
⑥ 转场 Transitions（剪辑指示）
```

### 格式规则

| 规则 | 标准 |
|---|---|
| 字体 | Courier 12pt |
| 页边距 | 左 1.5" |
| 页数换算 | 1 页 ≈ 1 分钟 |
| 场头 | INT./EXT. + 地点 + 时间 |

## 技巧与示例

### 格式 → AI 提示词映射

```text
场头 → 场景提示词（地点/内外/时间 → 光线 125）
动作 → 镜头描述（画面内容 → 提示词主体）
人物 → 角色一致性卡（117）
对白 → 配音/口播（147）
转场 → 剪辑节奏（127）
```

### AI 剧本编辑器（Laper）

AI 编辑器保持行业标准（格式合规 → 提交/生产可用），同时支持提示词辅助生成——**格式先行，生成后自动排版**。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 忽略场头 | 制作无法拆解 | 标准场头 |
| 动作描述过长 | 提示词发散 | 精简视觉信息 |
| 页数不换算 | 时长失控 | 1 页≈1 分钟 |
| 转场乱标 | 剪辑混乱 | 标准转场 |
| 格式不合规 | 无法进生产 | 行业标准（Courier 12pt） |

## 工作流应用（AI 映射）

剧本阶段（衔接 103/109/150）：

```text
故事 → 剧本（六要素规范格式）
  → 页数换算（时长）→ 场头拆解（场景表）
  → 每场 → 分镜/提示词（124）
  → 场记表（109）→ 生成
```

**DirectorX 纪律**：格式承载生产信息；1 页≈1 分钟控时长；规范剧本可拆解为生成输入。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 场头 | Slugline / Scene Heading | 场景信息行 |
| 动作描述 | Action Line | 画面信息 |
| 人物提示 | Character Cue | 说话者 |
| 括注 | Parenthetical | 语气/动作注 |
| 转场 | Transition | 剪辑指示 |
| 页数换算 | Page-to-Time | 1 页≈1 分钟 |

## 来源

- Plotwell — How to Format a Screenplay: The Complete Guide for 2026：https://plotwell.co/blog/how-to-format-screenplay
- ScreenWeaver — Screenplay Format: The Complete Guide (2026)：https://www.screenweaver.ai/blog/screenplay-formatting-guide-2026
- QuoteUnquote — Standard Screenplay Format: The Complete Writer's Guide：https://blog.quoteunquoteapps.com/standard-screenplay-format-the-writers-guide/
- Laper — Professional AI Screenplay Editor: Industry Standards：https://laper.ai/blog/2025-11-12-professional-ai-screenplay-editor-industry-standards/
- BlockReelDAO — The Complete Screenwriting Guide 2026：https://www.blockreeldao.com/blog/the-complete-screenwriting-guide-2026-structure-format-ai-tools-industry-standards