---
type: Method
title: "AI 角色表演控制（AI Performance Direction）"
description: "AI 表演控制手册：分段表演模式（短语+指令交错）、四大表演指令家族（视线/停顿/声音/身体节拍）、音频方向配对、镜头围绕对白、三个可直接套用示例、常见错误、微表情与情绪词汇控制"
tags:
  - "production"
  - "camera"
  - "sound"
  - "character"
  - "narrative"
status: stable
stale_after: "2027-08-18"
generated:
  by: "process:directorx-knowledge-okf"
  at: "2026-08-18T00:00:00Z"
verified:
  - by: "process:knowledge-audit"
    at: "2026-08-18T00:00:00Z"
sources:
  - resource: "cited:LTX 对白与表演指南（2026-08）"
    id: cite-1
    title: "LTX 对白与表演指南（2026-08）"
  - resource: "cited:塔猴 AI 短剧微表情控制"
    id: cite-2
    title: "塔猴 AI 短剧微表情控制"
  - resource: "cited:CVPR 情绪词汇研究"
    id: cite-3
    title: "CVPR 情绪词汇研究"
  - resource: "cited:Google Cloud 视频生成提示指南。"
    id: cite-4
    title: "Google Cloud 视频生成提示指南。"
  - resource: "https://ltx.io/blog/directing-dialogue-and-acting"
    id: url-1
    title: "ltx.io"
  - resource: "https://www.tahou.com/article/210412511179696133"
    id: url-2
    title: "tahou.com"
  - resource: "https://openaccess.thecvf.com/content/CVPR2026W/GRAIL-V/papers/Boudreaux_Emotional_Vocabulary_as_Semantic_Grounding_How_Language_Register_Affects_Diffusion_CVPRW_2026_paper.pdf"
    id: url-3
    title: "openaccess.thecvf.com"
  - resource: "https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/video/video-gen-prompt-guide?hl=zh-cn"
    id: url-4
    title: "docs.cloud.google.com"
  - resource: "https://dev.to/super_lewis/the-seedance-25-prompting-guide-in-english-4hen"
    id: url-5
    title: "dev.to"
  - resource: "https://invideo.io/blog/kling-motion-control/"
    id: url-6
    title: "invideo.io"
dx_id: "69"
aliases:
  - "132"
related:
  - "282-narrative-av-genre/narrative-av-genre.md"
  - "12-genre-music-performance/music-video-performance.md"
  - "86-storyboard-drawing/storyboard-drawing.md"
---

# AI 角色表演控制（AI Performance Direction）

> 本页是 DirectorX AI 表演控制手册：分段表演模式（短语+指令交错）、四大表演指令家族（视线/停顿/声音/身体节拍）、音频方向配对、镜头围绕对白、三个可直接套用示例、常见错误、微表情与情绪词汇控制。与 34 对白语法 / 18 表演体系 / 63 文案协同衔接。**已合并 132（FACS/情绪弧/减法提示）**——2026-08 去重整理。
> 来源：LTX 对白与表演指南（2026-08）、塔猴 AI 短剧微表情控制、CVPR 情绪词汇研究、Google Cloud 视频生成提示指南。

## 概述

**核心转变**：新一代模型（LTX-2.3 类）在**节拍级别（Beat Level）遵循表演指令**——把一句对白拆成短短语，在短语之间插入表演指令：一次停顿、一次视线转移、一次声音破裂。**模型渲染的是表演，不只是台词**。

**关键机制**：门控注意力文本连接器让模型把提示词里的具体词映射到输出里的具体帧——时机、节奏、情绪提示落在意图的节拍上。代价是：**长而不间断的句子和模糊情绪形容词现在表现更差**——因为模型在认真听你给的结构。

## 分段表演模式（核心模式）

```
一个对白短语 → 一条简短表演指令 → 下一个短语（按摄影机看到顺序交错）
```

**不引用整句**；**不把对白和表演分成不同段落**；按时间顺序交错。

**对比示例**：
- 未分段（旧式）：`He speaks slowly: "I remember after you kids came along..." He looks sad. Camera zooms in.`
- 分段（新式）：`He speaks in a sad, slow-paced voice, "I remember after you kids came along..." He pauses and looks to the side, then continues, "your mom..." His eyes widen momentarily. He finishes with a cracking voice, "said something to me I never quite understood." The camera slowly zooms into his face.`

**为什么长句失败**：模型仍会表演长句，但时机塌缩——赶着说完或填入与台词矛盾的闲动。分段给模型"慢下来、保持画面、让节拍落地"的许可。

## 四大表演指令家族（每拍一条就够）

| 家族 | 示例 | 作用 |
|---|---|---|
| 视线 Eye-line/Gaze | "looks to the side" / "glances down" / "eyes widen momentarily" / "holds her gaze on him" | 锚定注意力，打破静态口播；**在短语之间用，不在短语中** |
| 停顿节奏 Pauses/Pacing | "pauses, then continues" / "trails off" / "holds the silence for a beat" / "speaks slowly, weighing each word" | **对白提示词中杠杆最高的指令**——行内停顿=沉思，无停顿=背诵 |
| 声音质感 Voice Quality | "cracking voice" / "whispered, low energy" / "voice tight with restraint" / "forced confidence" | 对白与音频提示词之间的桥——声音描述转化为可感知的音色差异 |
| 身体节拍 Physical Beats | "his shoulders drop" / "leans forward slightly" / "his hand tightens on the edge of the table" / "a half-smile fades" | 强化情绪转折；给模型停顿期间可锚定的具体画面 |

**纪律**：一短语一指令；**每拍最多一条**（三指令叠满→表演"抽搐感"，模型无法优先级排序）；语言具体。

## 音频方向配对（放提示词末尾）

- 声学空间："faint room tone" / "echo of a marble lobby" / "outdoor wind with distant traffic"；
- 声音质感："low-mic warmth" / "slightly breathy"；
- 静默形状："quiet between phrases" / "long silence after the line"；
- 环境线索："a clock ticks softly in the background" / "rain on glass behind him"。

**音频方向=表演的环境包装**——不给就默认扁平录音棚声。

## 镜头围绕对白（镜头=表演的一部分）

- 情绪转折处**慢推**；
- 停顿期间**保持画面**（镜头静止，演员承载节拍）；
- 注意力转移时轻微**焦点转换**（背景→脸）；
- **避免对话中宽幅横摇**——模型用它掩盖静态时刻，读作"无聊覆盖"（→ 49 一镜一主运动）。

## 三个可直接套用示例（LTX 实测）

**悔恨父亲独白**：
> A man in his late fifties with greying stubble sits at a wooden kitchen table in a warm, dim room. He speaks in a slow, weary voice, "I never told you this..." He pauses and looks at his hands, then continues, "but I almost left..." His shoulders drop. He finishes, voice catching, "the year you were born." The camera holds the frame. Faint room tone, a refrigerator hum, no music.

**自信创始人路演**：
> A woman in her early thirties stands in front of a clean white backdrop, wearing a black turtleneck. She speaks with warm, conversational confidence, "We didn't set out to build another tool..." She pauses, makes eye contact with the camera, then continues with quiet certainty, "we built the one we wanted to use." A half-smile lands at the end of the line. The camera is locked off in a medium-close-up. The audio is crisp, low-mic warmth, soft studio ambience.

**惊恐孩子低语**：
> A child of about eight sits on the floor in a darkened bedroom, back against the wall, a flashlight held in her lap. She speaks in a tight whisper, "I can hear it again..." She holds her breath for a beat, then continues, voice trembling, "in the closet." Her eyes widen. The camera slowly pushes in. Audio: very quiet room tone, the faint creak of a floorboard somewhere off-frame, no music.

## 微表情与情绪词汇（中文生态+研究）

- **微表情提示**（塔猴短剧教程）：从角色定妆→情绪表演——逐镜指定微表情（嘴角抽动/眼神闪烁/眉头微蹙），避免大表情演戏；
- **情绪词汇研究**（CVPR 2026）：**情绪词汇作为语义锚定**——具体情绪词汇（"紧张的低语"vs"声音颤抖"）影响图生视频扩散效率——语言语域具体性直接提升表演保真；
- **Seedance 2.5 指南**：表演提示词支持主体标签+动作强度+情绪描述组合（→ 34 对白语法衔接）；
- **谷歌视频生成提示指南**：对白用引号、动作按"角色+动作+情绪"三段式。

## 情绪体系补充（并入自 132：FACS/情绪弧/减法提示）

### FACS 与六种基础情绪（面部动作编码）
Ekman 六种基础情绪 + FACS 动作单元（AU）可执行的提示映射：
- 快乐：嘴角上扬 + 眼轮匝肌收缩（眼区参与才是真笑）；
- 悲伤：嘴角下压 + 内眉上抬 + 上睑下垂；
- 愤怒：眉毛内收下压 + 眼睑紧绷 + 嘴唇收紧；
- 恐惧：眉毛上抬外展 + 上睑上提（露出眼白）+ 嘴张开；
- 惊讶：眉毛上抬 + 上睑上提 + 下颌张开；
- 厌恶：鼻子皱起 + 上唇上提 + 下唇外翻。
提示词写法：`inner brow raise + eyelid tight + lips pressed`（动作单元组合），而非模糊的 "angry"。

### 情绪弧（情感弧）设计
一条表演段的情绪随时间变化路径：起（近中性）→ 渐显 → 峰值 → 回落。设计三问：情绪从哪来（触发原因）→ 何时到达峰值 → 如何回落。提示词：`starts neutral, fear builds as he realizes, peaks at the reveal, settles into exhaustion`。与 158 张力-释放循环同构。

### 减法提示（克制原则）
先写"不要什么"再写"要什么"：`no exaggerated acting, no melodrama, restrained reaction`——AI 默认大表情，减法提示让表演收住（衔接 175 微表情克制、133 物理真实感）。

## 常见错误

1. **对白写成一整块引用文本**：模型表演成背诵——分段修复。
2. **过度指导每个微节拍**：每拍三条指令→表演抽搐——一拍一条。
3. **忽略音频提示词**：默认扁平录音棚声。
4. **旧提示词直接复用新模型**：新模型不忽略噪音——先修剪。
5. 模糊情绪形容词（"sad"）：具体身体/声音线索更可执行。
6. 对话中横摇：掩盖静态=无聊覆盖。

## 术语表（中英对照）

| 中文 | English | 一句话定义 |
|---|---|---|
| 节拍级指令 | Beat-Level Direction | 逐拍遵循 |
| 分段模式 | Segmentation Pattern | 短语+指令交错 |
| 门控注意力 | Gated Attention | 词帧映射 |
| 视线指令 | Eye-Line Cue | 注意力锚定 |
| 停顿节奏 | Pacing Cue | 沉思/背诵分界 |
| 声音质感 | Voice Texture | 音色桥 |
| 身体节拍 | Physical Beat | 情绪外化 |
| 静默形状 | Silence Shape | 停顿设计 |
| 声学空间 | Acoustic Space | 环境包装 |
| 微表情 | Micro-Expression | 小表情表演 |
| 情绪词汇锚定 | Emotional Grounding | 语义→渲染 |
| 表演保真 | Performance Fidelity | 指令落地度 |

## 来源

- LTX: Directing Dialogue and Acting — How to Prompt for Character Speech, Pauses & Emotional Beats — https://ltx.io/blog/directing-dialogue-and-acting
- 塔猴: 2026 年 AI 短剧微表情控制教程——从角色定妆到情绪表演 — https://www.tahou.com/article/210412511179696133
- CVPR 2026 Workshop: Emotional Vocabulary as Semantic Grounding — How Language Register Affects Diffusion Efficiency in Image-to-Video — https://openaccess.thecvf.com/content/CVPR2026W/GRAIL-V/papers/Boudreaux_Emotional_Vocabulary_as_Semantic_Grounding_How_Language_Register_Affects_Diffusion_CVPRW_2026_paper.pdf
- Google Cloud: 视频生成提示指南（Gemini Enterprise Agent Platform） — https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/video/video-gen-prompt-guide?hl=zh-cn
- DEV Community: The Seedance 2.5 Prompting Guide, in English — https://dev.to/super_lewis/the-seedance-25-prompting-guide-in-english-4hen
- GitHub: zhouwei713/facial-expression-prompting（人物表演与视频提示词导演 Skill） — 
- Invideo: Kling Motion Control — Perfect Character Animation — https://invideo.io/blog/kling-motion-control/
- Runway: AI Video Prompting Guide — 92 Ready-to-Use Prompts — https://runway.com/resources/ai-video-prompting-guide

## 相关概念

- [电影叙事-视听-类型三整合（Narrative-AV-Genre Integration — Unified Cinematic Language）](../282-narrative-av-genre/narrative-av-genre.md)
- [音乐视频与表演（Music Video & Performance）](../12-genre-music-performance/music-video-performance.md)
- [分镜绘制技巧（Storyboard Drawing & Notation）](../86-storyboard-drawing/storyboard-drawing.md)
