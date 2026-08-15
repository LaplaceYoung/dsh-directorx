# AI 图片多主体互动构图（Multi-Subject Composition — Spatial Assignment & Interaction）

> 本页为 AI 图片多主体互动构图：显式空间分配（左右/前后景指定）、互动姿势描述、防主体融合（Blending）、群体布置、关系表达。知识本体来自 2026 多主体提示词指南（Floniks/Scenario/Gemini3Prompt）。AI 应用面向 DirectorX：多人图片（衔接 187 调度、208 关系、216 构图、232 对应）。
> 来源：Floniks「Prompting Multiple Subjects Without Blending」、Scenario「Generate Multi-Character Scenes」、Gemini3Prompt「AI Multi-Person Scenes」、arXiv「Iterative Pose-Image Generation for Multi-Person」。

## 概述

**核心断言**：多主体构图的核心是**显式空间分配**——"a man and a woman"会融合，**"a man on the left side of frame and a woman on the right"** 才分离（衔接 187：屏幕地理的图片版；208：关系表达）。

## 核心概念

### 防融合三技巧（Floniks）

```
① 显式空间分配（左/右/前/后景）
② 具象特征区分（红发女人/黑衣男人）
③ 互动姿势指定（相望/握手/拥抱）
```

### 关系-空间表达

| 关系 | 空间安排 |
|---|---|
| 亲密 | 并肩/靠近/相望 |
| 冲突 | 两侧/间隔/对峙 |
| 权力 | 前景大/后景小 |
| 疏离 | 远距/背对 |

## 技巧与示例

### 多主体提示词模板

```text
"a woman in a red coat on the left foreground facing right,
a man in a dark suit on the right midground facing left,
they maintain eye contact, tense atmosphere"
```

### 互动姿势（关系驱动）

互动姿势 = 关系的直接表达（衔接 208 空间-情感映射）：牵手=亲密、对峙=冲突、拥抱=和解。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 无空间分配 | 主体融合 | 显式位置 |
| 特征模糊 | 互换 | 具象区分 |
| 姿势无关系 | 无叙事 | 关系驱动 |
| 主体重叠乱 | 遮挡失序 | 前后景 |
| 群体无层次 | 平铺 | 主次分层 |

## 工作流应用（AI 映射）

多人图片（衔接 187/208/216）：

```text
关系设定（208）→ 空间分配（左右/前后景）
  → 具象特征 → 互动姿势
  → 生成 → 融合检查 → 修正
```

**DirectorX 纪律**：显式空间分配防融合；具象特征防互换；姿势驱动关系；前后景分层。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 空间分配 | Spatial Assignment | 位置指定 |
| 主体融合 | Blending | 角色混合 |
| 互动姿势 | Interaction Pose | 关系表达 |
| 具象特征 | Distinctive Features | 防互换 |
| 前后景 | Foreground/Background | 层次 |
| 群体布置 | Group Arrangement | 多人布局 |

## 来源

- Floniks — Prompting Multiple Subjects Without Them Blending：https://floniks.com/learn/prompting/prompting-multiple-subjects
- Scenario — Generate Multi-Character Scenes：https://help.scenario.com/articles/8459982289-generate-multi-character-scenes
- Gemini3Prompt — AI Multi-Person Scenes: Composition Guide：https://gemini3prompt.com/articles/ai-multi-person-scene-composition/
- arXiv — Iterative Pose-Image Generation for Multi-Person Scenes（2605.23178）：https://arxiv.org/html/2605.23178v1
- FreeAIPromptMaker — Master AI Art Spatial Prompts：https://freeaipromptmaker.com/blog/2026-03-11-master-ai-art-spatial-prompts-control-placement