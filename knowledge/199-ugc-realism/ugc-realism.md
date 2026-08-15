# AI 用户生成内容真实感（UGC Realism — Authentic Imperfection & Anti-Polish）

> 本页为 AI 用户生成内容（UGC）的真实感模拟：反精致（Anti-Polish，告诉模型"不要什么"）、手机感（Handheld/Phone Camera Look）、自然微表情/随意手势、真实脚本（口语化）、产品准确性。知识本体来自 2026 UGC 指南（Oumomo/Vidu/Fluxnote/Imagine.Art）。AI 应用面向 DirectorX：种草内容（衔接 60 UGC 工业化、189 口播、175 微表情、188 钩子）。
> 来源：Oumomo「Make AI Videos Feel Like Real UGC」、Vidu「Best AI Tools for UGC-Style Video」、Fluxnote「UGC Style Videos with AI」、Imagine.Art「Realistic AI UGC Videos」。

## 概述

**核心断言**：UGC 真实感的关键是**反精致**——AI 默认产出漂亮画面，但 TikTok 广告需要"像用户拍的"。**告诉模型"不要什么"**（负向提示：无工作室光/无完美妆/无电影运镜）+ 手机手持感 + 口语化脚本 + 自然微表情（衔接 175：克制表演；133：手持物理）。

## 核心概念

### UGC 真实感五要素

```
① 手持运动（Handheld/Phone Look，133）
② 自然光（无工作室光，125）
③ 口语脚本（对话式非文案腔）
④ 微表情/随意手势（175 克制）
⑤ 不完美（瑕疵/晃动/取景不齐）
```

### 反精致提示（Oumomo 核心）

"对 TikTok 广告，告诉模型不要做什么比要什么更重要"——**负向提示词驱动真实性**（衔接 132 减法提示同构）。

## 技巧与示例

### UGC 生成工作流（Fluxnote 四步）

```text
口语化脚本（人设 + 自然语言 + 瑕疵）
  → 负向提示（无精致感）
  → 手机感生成（手持/自拍视角）
  → 多变体（钩子测试，188/149）
  → 产品准确性校验（不夸大）
```

### 反精致提示词示例

```text
"shot on a phone, handheld, casual framing, natural window light,
unpolished, authentic reaction, slight imperfections"
负向："no studio lighting, no beauty filter, no cinematic camera movement,
no perfect framing"
```

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 默认精致 | 不像 UGC | 反精致提示 |
| 只加"真实"词 | 无效 | 负向排除 |
| 脚本文案腔 | 假 | 口语化 |
| 产品失真 | 退货 | 准确性校验 |
| 无变体 | 无法测钩子 | 多变体（149） |

## 工作流应用（AI 映射）

种草内容（衔接 60/149/175/189）：

```text
人设脚本（口语化）→ 负向提示（反精致）
  → 手机感生成（133 手持）→ 多变体
  → 钩子测试（149）→ 产品校验 → 投放
```

**DirectorX 纪律**：反精致靠负向提示；手机手持感；口语脚本；自然微表情；产品准确。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 反精致 | Anti-Polish | 不要完美 |
| 手机感 | Phone Look | 手持自拍视角 |
| 口语脚本 | Conversational Script | 非文案腔 |
| 负向驱动 | Negative-Driven | 排除式提示 |
| 真实感 | Authenticity | 像真人拍摄 |
| 瑕疵 | Imperfection | 不完美质感 |

## 来源

- Oumomo — How to Make AI Videos Feel Like Real UGC in 2026：https://www.oumomo.ai/blog/2026/07/03/how-to-make-ai-videos-feel-like-real-ugc-in-2026/
- Vidu — Best AI Tools for UGC-Style Video in 2026：https://www.vidu.com/blog/best-ai-tools-for-ugc-style-video
- Fluxnote — How to Make UGC Style Videos with AI, A 2026 Guide：https://fluxnote.io/guides/how-to-make-ugc-style-videos-with-ai
- Imagine.Art — How to Create Realistic AI UGC Videos：https://www.imagine.art/blogs/how-to-create-ai-ugc-videos
- Crepal — Best AI Tools for UGC Video Content Creation 2026：https://crepal.ai/blog/aivideo/aivideo-best-ai-tools-ugc-video-content/