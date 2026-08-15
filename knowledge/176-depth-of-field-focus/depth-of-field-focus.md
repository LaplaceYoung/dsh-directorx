# AI 景深与焦点控制（Depth of Field — Subject-Background-Distance & Bokeh）

> 本页为 AI 视频的景深与焦点控制：主体-背景-距离框架（Subject-Background-Distance）、光圈/焦段/物距模拟、散景（Bokeh）质感、跨镜头焦点一致、跟焦（Rack Focus）。知识本体来自 2026 景深指南（Hailuo/ReelMind/ApiMart）。AI 应用面向 DirectorX：镜头质感（衔接 124 镜头语言、116 首末帧、168 运镜）。
> 来源：Hailuo「Mastering Depth of Field: Cinematic Bokeh Prompting」、ApiMart「Top AI Models for Cinematic Depth of Field」、ReelMind「AI Video Depth of Field Effects」、ReelMind「AI Director's Focus」。

## 概述

**核心断言**：景深是**廉价镜头感的放大器**——AI 不用昂贵大光圈镜头就能拍出专业散景。提示核心是**主体-背景-距离框架**：明确"主体（清晰）+ 背景（模糊）+ 两者距离"；模拟光圈/焦段/物距（F 值/焦段/距离决定虚化量）。**跨镜头焦点一致性**是叙事关键（跟焦 Rack Focus 引导视线）。

## 核心概念

### Subject-Background-Distance 框架（Hailuo）

```text
[主体]（清晰）+ [背景]（模糊程度）+ [距离]（主体与背景间距）
示例："sharp subject, heavily blurred background, subject far from background,
shallow depth of field, 85mm f/1.8 look"
```

### 虚化三参数

```
光圈（F 值）：F 越小虚化越强
焦段：长焦压缩 + 强虚化
物距：主体越近背景越虚
```

## 技巧与示例

### 景深提示词工作流

```text
镜头意图（特写/中景/环境）
  → 焦点决策（主体 vs 背景）
  → 三参数模拟（光圈/焦段/距离）
  → 散景质感（形状/柔和度）
  → 生成 → 焦点一致性检查（跨镜头）
  → 跟焦设计（视线引导，158）
```

### 跟焦（Rack Focus）叙事用途

焦点从前景移到背景 = 视线/注意力的转移（衔接 158 视线引导）——AI 提示"focus pulls from foreground subject to background reveal"。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 只写"浅景深" | 模型乱发挥 | 三参数明确 |
| 无距离描述 | 虚化不符 | 主体-背景-距离 |
| 跨镜头焦点漂移 | 叙事乱 | 焦点一致性 |
| 全片大虚化 | 无环境信息 | 按镜头意图 |
| 忽略散景质感 | 塑料感 | 散景描述 |

## 工作流应用（AI 映射）

镜头质感（衔接 116/124/168）：

```text
镜头意图 → 焦点决策 → 三参数模拟
  → 散景质感 → 生成（起止帧锁定 116）
  → 跨镜头焦点一致性 → 跟焦设计（158）
```

**DirectorX 纪律**：三参数明确防乱发挥；跨镜头焦点一致；跟焦服务叙事；散景是质感不是炫技。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 景深 | Depth of Field | 清晰范围 |
| 散景 | Bokeh | 背景虚化质感 |
| 光圈 | Aperture / F-Stop | 进光孔径 |
| 焦段 | Focal Length | 镜头焦距 |
| 跟焦 | Rack Focus | 焦点转移 |
| 浅景深 | Shallow DoF | 强虚化 |

## 补充：电影景深叙事（选择性聚焦、跟焦叙事、深焦并置）

> 来自 #255-focus-depth-narrative 的独特内容。聚焦 = "叙事权重的分配"——清晰区域即叙事权重（衔接 231 景别的注意力同构）。

### 三种聚焦叙事语法

| 技术 | 机制 | 功能 |
|---|---|---|
| 选择性聚焦（Selective Focus） | 只清一处 | 隔离/权重——强制观众看哪里 |
| 跟焦（Rack Focus） | 焦点转移 | 揭示/关系——单镜内注意转移 |
| 深焦（Deep Focus） | 全平面清晰 | 并置/对比——空间内多元素同时呈现 |

### 跟焦的叙事功能（扩展）

跟焦不仅是技术操作，更是**叙事语法**：

- **关系揭示**："前景角色与背景角色其实相连"——焦点转移揭示隐藏关系
- **注意转移**：谁重要变了——叙事权重的实时再分配
- **信息揭示**：焦点移到新信息——观众与角色同步发现

### 深焦（Deep Focus）的叙事价值

深焦让画面全平面清晰，适合：

- **空间并置**：前后景同时呈现，观众自行解读关系
- **对比/反讽**：前景与背景的语义反差
- **环境沉浸**：不隔离主体，保留完整空间信息

AI 提示："deep focus, everything sharp from foreground to background, f/16 look"——与浅景深互补使用。

### 聚焦叙事错误（补充）

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 焦点与叙事权重不符 | 误导观众 | 先做权重分析再定焦点 |
| 跟焦无揭示目的 | 炫技/分散注意 | 每次跟焦必须携带信息 |
| 深焦滥用 | 无视觉引导 | 仅在需要并置/对比时用 |
| 选择性聚焦过度 | 环境信息丢失 | 平衡隔离与语境 |

### 聚焦叙事工作流

```text
叙事权重分析（谁/什么重要）
  → 聚焦选型（选择性/跟焦/深焦）
  → 提示词（三参数 + 聚焦类型）
  → 生成 → 权重校验（焦点 == 叙事权重？）
```

### 补充来源

- Videomaker — What Is the Rack Focus Shot：https://www.videomaker.com/shooting/visual-storytelling/what-is-the-rack-focus-shot/
- Filmmakers Academy — Depth of Field: Focusing on Character & Story：https://www.filmmakersacademy.com/depth-field-character-story/
- Fiveable — Depth of Field and Focus Techniques：https://fiveable.me/film-aesthetics/unit-4/depth-field-focus-techniques/study-guide/NGDG6mGKvFOOL663
- NFI — Rack Focus: Everything You Need to Know：https://www.nfi.edu/rack-focus/
- NoFilmSchool — What Is a Rack Focus：https://nofilmschool.com/rack-focus

<!-- merged from: #255-focus-depth-narrative -->

## 来源

- Hailuo — Mastering Depth of Field: Prompting for Cinematic Bokeh：https://hailuoai.video/pages/knowledge/mastering-depth-of-field-cinematic-bokeh-prompting
- ApiMart — Top AI Models for Cinematic Depth of Field：https://apimart.ai/blog/best-ai-models-cinematic-depth-of-field
- ReelMind — AI Video Depth of Field Effects: Professional Bokeh：https://reelmind.ai/blog/ai-video-depth-of-field-effects-professional-bokeh-without-expensive-lenses
- ReelMind — The AI Director's Focus: Perfect Depth of Field：https://reelmind.ai/blog/the-ai-director-s-focus-achieving-perfect-depth-of-field-in-ai-renders
- ReelMind — Bokeh Background HD: Cinematic Depth on Any Footage：https://reelmind.ai/blog/bokeh-background-hd-generating-cinematic-depth-on-any-footage