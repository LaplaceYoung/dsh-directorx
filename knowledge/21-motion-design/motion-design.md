---
type: Reference
title: "动画与动态设计（Motion Design & Animation）"
description: "动效知识库：动效设计十二原则（迪士尼/现代改编）、缓动与关键帧、字幕动画与 Kinetic Typography、Lower Third 规范、片头设计、MG 动画制作流程"
tags:
  - "foundation"
  - "workflow"
status: stable
generated:
  by: "process:directorx-knowledge-okf"
  at: "2026-08-18T00:00:00Z"
verified:
  - by: "process:knowledge-audit"
    at: "2026-08-18T00:00:00Z"
sources:
  - resource: "cited:Studio2a 十二原则"
    id: cite-1
    title: "Studio2a 十二原则"
  - resource: "cited:Figma Easing 文档"
    id: cite-2
    title: "Figma Easing 文档"
  - resource: "cited:Adobe 文字动画"
    id: cite-3
    title: "Adobe 文字动画"
  - resource: "cited:Wikipedia Kinetic typography"
    id: cite-4
    title: "Wikipedia Kinetic typography"
  - resource: "cited:MG 动画行业流程。"
    id: cite-5
    title: "MG 动画行业流程。"
  - resource: "https://www.studio2a.co/12-principles-of-motion-design/"
    id: url-1
    title: "studio2a.co"
  - resource: "https://help.figma.com/hc/en-us/articles/41238219562007-Motion-design-fundamentals-Easing"
    id: url-2
    title: "help.figma.com"
  - resource: "https://blog.adobe.com/en/publish/2016/11/08/redesigning-the-12-principles-of-animation-for-motion-design"
    id: url-3
    title: "blog.adobe.com"
  - resource: "https://en.wikipedia.org/wiki/Kinetic_typography"
    id: url-4
    title: "en.wikipedia.org"
  - resource: "https://olafmotion.com/tips/lower-thirds-animation-tips-guide/"
    id: url-5
    title: "olafmotion.com"
dx_id: "21"
related:
  - "07-directing/directing-techniques.md"
  - "08-workflow-glossary/production-workflow-glossary.md"
  - "13-genre-documentary/documentary-talking-head.md"
---

# 动画与动态设计（Motion Design & Animation）

> 本页是 DirectorX 动效知识库：动效设计十二原则（迪士尼/现代改编）、缓动与关键帧、字幕动画与 Kinetic Typography、Lower Third 规范、片头设计、MG 动画制作流程。每个概念含定义、参数与规范。
> 来源：Studio2a 十二原则、Figma Easing 文档、Adobe 文字动画、Wikipedia Kinetic typography、MG 动画行业流程。

## 概述

动态设计（Motion Design / Motion Graphics）是用**运动**传达信息的视觉设计——字幕、logo 动效、信息图动画、转场、片头。好的动效服务于内容：**它让信息更容易理解，而不是让画面更炫**。

**核心认知**：1981 年迪士尼动画师 Ollie Johnston 与 Frank Thomas 的《The Illusion of Life》十二原则至今仍是动效设计的黄金标准——虽然不再手绘动画，但运动原理完全适用。

## 动效设计十二原则（Motion Design 版）

1. **挤压与拉伸（Squash & Stretch）**：物体碰撞时压扁再弹开——表达质量、重量与重力；保持体积一致（压扁即变宽，拉长即变细）。
2. **预备动作（Anticipation）**：动作前的反向蓄力（起跳先下蹲）——为动作做准备，观众"等到了"。
3. **表演/强调（Staging）**：用运动突出画面重点；主体动、其他元素尽量不动；层次感让主体跳出。
4. **连续动作 vs 姿态到姿态（Straight-ahead / Pose-to-pose）**：逐帧画 vs 关键帧+补间——现代软件基本都是 Pose-to-pose（关键帧）。
5. **跟随与重叠动作（Follow-through & Overlapping）**：物体有质量，各部件不同步——头发/衣摆滞后于主体；停止时有惯性余动。
6. **慢入慢出（Slow in & Slow out）**：关键帧前后加减速——现代术语即**缓动（Easing）**，控制"起止的柔和度"。
7. **弧线（Arc）**：自然运动走弧线不走直线（重力作用）——直线运动显机械。
8. **次级动作（Secondary Action）**：支持主动作的小动作（眨眼、呼吸）——增加生动性，但必须小到不抢主戏。
9. **时间（Timing）**：时长决定性格与重量——快的活泼、慢的沉重；全程节奏统一是整体感的关键。
10. **夸张（Exaggeration）**：在真实基础上放大动态，让动作"有生命"。
11. **扎实的立体感（Solid Drawing）**：理解三维空间、光影与体积。
12. **吸引力（Appeal）**：最终效果要好看——组合运用以上所有原则。

## 缓动（Easing）——最关键的数字参数

### 缓动类型
| 类型 | 行为 | 情绪 |
|---|---|---|
| Linear 线性 | 匀速 | 机械、科技感（慎用） |
| Ease In 缓入 | 慢→快 | 离开、坠落 |
| Ease Out 缓出 | 快→慢 | 到达、着陆（默认首选） |
| Ease In-Out 缓入缓出 | 慢→快→慢 | 优雅、来回运动 |

### 参数规范
- **UI/字幕动效**：150-300ms 的 Ease Out 是标准（入场快、停稳柔和）。
- **强调性动效**：Ease In-Out 400-600ms。
- **回弹（Back/Spring）**：超出目标再弹回——用于趣味强调，克制使用。
- **过冲（Overshoot）**：轻微超过目标再回来——比回弹更高级的"强调"。

### 缓动的意义
没有缓动的动画 = 一切"啪"地开始、"啪"地结束——廉价感的最大来源。**给关键帧加缓动是动效从"业余"到"专业"的第一道门槛**。

## 字幕动画（Kinetic Typography）

### 原则
1. **动效为可读性服务**：文字动效的第一目标是"看清"，第二才是"好看"——动效不能干扰阅读。
2. **入场/退场明确**：文字怎么来（滑入/淡入/缩放）、怎么走（滑出/淡出），保持一致。
3. **强调用动效**：关键词高亮+轻微放大/变色（呼应 05 文档文字层规范：≤6 词、1.5-2.5s、上三分之一）。
4. **克制**：一段内容只用 1-2 种入场方式；全程花样百出 = 混乱。

### 常见字幕动效类型
| 类型 | 适用 |
|---|---|
| 淡入淡出 Fade | 信息字幕、沉稳 |
| 滑入 Slide（Ease Out） | 口播关键词、UI 提示 |
| 缩放 Scale（轻微 102%→100%） | 强调 |
| 逐字/逐词出现 | 歌词、卡点（注意速度同步） |
| 打字机效果 | 复古、代码、悬念 |
| 弹跳/旋转 | 娱乐向（谨慎，易廉价） |

### 规范速查
- 入场 150-300ms Ease Out；停留 1.5-2.5s；退场 ≤200ms。
- 字号：1080 宽画布 ≥48px；对比度 ≥7:1。
- 位置：上三分之一（竖屏安全区见 05 文档）。

## Lower Third（人物信息条）

### 组成
- 名字 + 头衔/单位；常在画面下三分之一（因此得名）。
- 风格：条块+文字+logo；扁平/渐变/描边按品牌。

### 规范
- **停留时长**：至少覆盖人物首次说话的前 2-3 句；或标准 5-8 秒。
- 入场/退场：Ease Out 滑入，150-300ms；退场快于入场。
- 不遮挡脸部与主体动作；与画面安全区对齐。
- 全片 Lower Third 风格统一（同一模板）。

## 片头设计（Title Sequence）

### 功能
1. **建立基调**：片头就是"预告片里的预告片"——视觉语言定调全片（《007》剪影、《广告狂人》剪影掉落）。
2. **信息传递**：片名、主创名单（Credit）。
3. **叙事连接**：可暗示剧情主题（悬疑/浪漫/动作）。

### 设计要点
- 时长：10-45 秒（短视频 3-8 秒）。
- 字体：片名字体承载性格（衬线=古典、无衬线粗体=现代、手写=亲和）——与内容匹配。
- 动效节奏与配乐同步（卡点）；首尾呼应成片基调。
- 短视频片头必须短：超过 3 秒 = 流失（见 05 文档）。

## MG 动画制作流程（Motion Graphics 工作流）

### 五步流程（行业标准）
1. **文案**：核心信息一句话；分镜文案（每屏一句话）。
2. **脚本/分镜**：逐屏设计——画面、文字、动效、时长（分镜表模板见 07 文档）。
3. **图形设计**：风格统一（扁平/插画/3D）、配色系统、字体系统。
4. **动效制作**：按十二原则 + 缓动规范制作；先粗后细（先摆位再修细节）。
5. **后期合成**：配音、音效、音乐、字幕、导出（交付规范见 08 文档）。

### 制作规范
- **先配音后动效**：以配音时间轴为基准做动画（音频为主时钟，见 06 文档）。
- **节奏卡点**：关键动作对齐语音重音/音效/BGM 节拍。
- **层级清晰**：同一时间只有 1-2 个元素在动（其余静止）——Staging 原则。
- **循环动效**：背景元素可循环（节省计算与注意）。
- **模板化**：品牌 Lower Third/字幕/转场做成模板，全片复用保证一致。

## 在 AI 视频生成中的应用

1. **AI 辅助 MG**：AI 生成分镜/文案/配色方案；AI 动效工具生成基础动画，人做节奏与细节。
2. **AI 字幕**：自动字幕 + 关键帧动效模板（入场/强调/退场自动套用）——人校对文字与节奏。
3. **提示词中的动效语言**：`text scales in with ease-out, lower third slides in, key word pulses`——用动效术语描述而非"好看一点"。
4. **AI 生成画面 + MG 叠加**：AI 视频素材 + 动态字幕/信息图/转场——信息型内容的标配组合。
5. **一致性**：全片动效模板统一（入场方式、配色、字体）——风格锚定。

## 常见错误

1. 无缓动：所有动画"啪"起"啪"停。
2. 动效抢戏：文字花式旋转弹跳，信息没人读。
3. 全程多种入场方式：视觉噪音。
4. 字幕停留过短/过长：读不完或等太久。
5. Lower Third 遮挡脸部/停留过短。
6. 忽略音频节奏：动效与配音/音乐错拍。
7. 片头过长：短视频 3 秒以上即流失。
8. 模板不统一：全片风格漂移。

## 术语表（中英对照）

| 中文 | English | 一句话定义 |
|---|---|---|
| 动态设计 | Motion Design | 运动的视觉设计 |
| 动效图形 | Motion Graphics | 图形动画 |
| 关键帧 | Keyframe | 动画控制点 |
| 补间 | Tween | 关键帧间过渡 |
| 缓动 | Easing | 加减速曲线 |
| 线性 | Linear | 匀速 |
| 缓入 | Ease In | 慢到快 |
| 缓出 | Ease Out | 快到慢 |
| 缓入缓出 | Ease In-Out | 慢快慢 |
| 回弹 | Back/Spring | 过冲回弹 |
| 挤压拉伸 | Squash & Stretch | 质量感 |
| 预备动作 | Anticipation | 动作前蓄力 |
| 跟随动作 | Follow-through | 惯性余动 |
| 重叠动作 | Overlapping | 部件不同步 |
| 次级动作 | Secondary Action | 辅助小动作 |
| 弧线运动 | Arc | 自然路径 |
| 时间 | Timing | 时长节奏 |
| 夸张 | Exaggeration | 放大动态 |
| 动能排版 | Kinetic Typography | 文字动画 |
| 信息条 | Lower Third | 人物信息条 |
| 片头 | Title Sequence | 片名序列 |
| 分镜脚本 | Storyboard | 逐屏设计 |
| 循环动画 | Loop | 可重复动效 |
| 过冲 | Overshoot | 轻微超出目标 |
| 风格锚定 | Style Anchor | 统一动效模板 |

## 来源

- Studio2a: 12 Principles of Motion Design — https://www.studio2a.co/12-principles-of-motion-design/
- Figma: Motion design fundamentals — Easing — https://help.figma.com/hc/en-us/articles/41238219562007-Motion-design-fundamentals-Easing
- Adobe: Redesigning the 12 Principles of Animation for Motion Design — https://blog.adobe.com/en/publish/2016/11/08/redesigning-the-12-principles-of-animation-for-motion-design
- Wikipedia: Kinetic typography — https://en.wikipedia.org/wiki/Kinetic_typography
- OlafMotion: Lower Thirds Animation Tips — https://olafmotion.com/tips/lower-thirds-animation-tips-guide/
- Wetton&Co: The Anatomy of a Title Sequence — https://wettonco.com/the-anatomy-of-a-title-sequence-balancing-narrative-and-legibility-in-film-graphics/

## 相关概念

- [导演技巧（Directing Techniques）](../07-directing/directing-techniques.md)
- [影视制作全流程与术语大全（Production Workflow & Glossary）](../08-workflow-glossary/production-workflow-glossary.md)
- [纪录片与口播知识类（Documentary & Talking Head）](../13-genre-documentary/documentary-talking-head.md)
