---
type: Playbook
title: "AI 视频生成工作流（AI Video Generation）"
description: "AI 生成知识库：主流模型能力、官方提示词方法论（Runway Gen-4 / Google Veo 3.1）、五段式提示词公式、首尾帧与参考图工作流、时间戳导演、一致性控制与生成后审查"
tags:
  - "foundation"
  - "prompt"
  - "model"
  - "workflow"
  - "continuity"
  - "i2v"
status: stable
stale_after: "2027-08-18"
generated:
  by: "process:directorx-knowledge-okf"
  at: "2026-08-18T00:00:00Z"
verified:
  - by: "process:knowledge-audit"
    at: "2026-08-18T00:00:00Z"
sources:
  - resource: "cited:Runway Gen-4 官方提示词指南"
    id: cite-1
    title: "Runway Gen-4 官方提示词指南"
  - resource: "cited:Google Veo 3.1 官方指南"
    id: cite-2
    title: "Google Veo 3.1 官方指南"
  - resource: "cited:Runway Text-to-Video 指南"
    id: cite-3
    title: "Runway Text-to-Video 指南"
  - resource: "cited:行业模型对比。"
    id: cite-4
    title: "行业模型对比。"
  - resource: "https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-veo-3-1"
    id: url-1
    title: "cloud.google.com"
  - resource: "https://help.runwayml.com/hc/en-us/articles/39789879462419-Gen-4-Video-Prompting-Guide"
    id: url-2
    title: "help.runwayml.com"
  - resource: "https://help.runwayml.com/hc/en-us/articles/42460036199443-Text-to-Video-Prompting-Guide"
    id: url-3
    title: "help.runwayml.com"
  - resource: "https://www.mindstudio.ai/blog/storyboards-character-sheets-ai-video-generation"
    id: url-4
    title: "mindstudio.ai"
  - resource: "https://agentbrisk.com/blog/ai-video-prompting-guide-2026/"
    id: url-5
    title: "agentbrisk.com"
  - resource: "https://queststudio.io/blog/ai-video-prompt-mistakes-25"
    id: url-6
    title: "queststudio.io"
dx_id: "14"
aliases:
  - "34"
related:
  - "39-image-consistency/character-consistency.md"
  - "40-storyboard-generation/storyboard-generation.md"
  - "45-style-unification/style-unification.md"
---

# AI 视频生成工作流（AI Video Generation）

> 本页是 DirectorX AI 生成知识库：主流模型能力、官方提示词方法论（Runway Gen-4 / Google Veo 3.1）、五段式提示词公式、首尾帧与参考图工作流、时间戳导演、一致性控制与生成后审查。
> 来源：Runway Gen-4 官方提示词指南、Google Veo 3.1 官方指南、Runway Text-to-Video 指南、行业模型对比。

## 概述

AI 视频生成（Text/Image to Video）已从"碰运气"进入"导演控制"阶段：主流模型支持 720p/1080p、4/6/8/10 秒片段、图生视频、首尾帧过渡、参考图一致性、同步音频与对白。**提示词 = 导演指令**——本页把官方方法论整理成可执行公式。

核心认知（Runway 官方）：
- **提示词越简单越好**：从一个只描述核心运动的简单提示开始，逐项添加（主体运动 → 摄影机运动 → 场景运动 → 风格），一次加一个变量便于定位问题。
- **描述"要发生什么"而不是"不要发生什么"**：负面表达在多数视频模型上不可靠，甚至产生反效果——用正面描述（"locked camera" 而不是 "no movement"）。
- **写具体物理动作，不写抽象概念**："she smiles and waves" 优于 "she embodies the essence of joyful greeting"。
- **图生视频时文字专注描述运动**：重复描述图中已有的细节会降低运动量。

## 主流模型能力速查（2026）

| 模型 | 片段长度 | 分辨率 | 特色能力 |
|---|---|---|---|
| Google Veo 3.1 | 4/6/8s | 720p/1080p | 同步音频+对白、首尾帧、参考图（ingredients）、加/删物体、SynthID 水印 |
| Runway Gen-4 | 5/10s | 高清 | 图生视频强、运动控制细、参考图（Gen-4 系列） |
| OpenAI Sora | 5-10s+ | 1080p | 长场景理解、复杂物理 |
| 可灵 Kling | 5-10s | 1080p | 图生视频、运动笔刷、导演模式 |
| 海螺/即梦/Vidu 等 | 4-10s | 1080p | 国内生态、模板丰富 |
| 混元/HunyuanVideo 等 | 5s+ | 1080p | 开源生态、可控性 |

**选择逻辑**：长镜头/物理真实 → Sora 类；一致性多镜头 → Veo 3.1/Runway 参考图；音频口型 → Veo 3.1/专用对口型工具；国产平台分发 → 可灵/即梦/海螺。

## 五段式提示词公式（Veo 3.1 官方）

```
[摄影 Cinematography] + [主体 Subject] + [动作 Action] + [环境 Context] + [风格 Style & Ambiance]
```

官方示例：
> "Medium shot, a tired corporate worker, rubbing his temples in exhaustion, in front of a bulky 1980s computer in a cluttered office late at night. The scene is lit by the harsh fluorescent overhead lights and the green glow of the monochrome monitor. Retro aesthetic, shot as if on 1980s color film, slightly grainy."

**摄影语言是情绪最强的杠杆**（Veo 官方）：
- 运镜：dolly、tracking、crane、aerial、slow pan、POV；
- 构图：wide shot、close-up、extreme close-up、low angle、two-shot；
- 镜头与焦点：shallow depth of field、wide-angle lens、soft focus、macro、deep focus。

**音频指令**（Veo 3.1 支持音频生成）：
- 对白：用引号写具体台词（`A woman says, "We have to leave now."`）；
- 音效：`SFX: thunder cracks in the distance`；
- 环境声：`Ambient noise: the quiet hum of a starship bridge`。

## Runway 提示词方法论（Gen-4 官方）

### 提示要素（Prompt Elements）
| 要素 | 内容 | 示例 |
|---|---|---|
| 主体运动 Subject Motion | 人物/物体的动作、表情、手势 | "The subject turns slowly" |
| 场景运动 Scene Motion | 环境对运动的反应 | "Dust trails behind them"（暗示式）/ "Dust trails behind them as they move"（描述式） |
| 摄影机运动 Camera Motion | 机位移动方式 | "handheld camera tracks the mouse" |
| 风格描述 Style | 速度、形式（实拍/动画/定格）、美学 | "cinematic live-action" |

### 多主体指令
- 用位置词区分：`The subject on the left walks forward. The subject on the right remains still.`
- 用简单标识：`The woman nods. The man waves.`

### 关键技巧
- **一次生成 = 一个场景**：不要试图在 5-10 秒内塞多个场景转换/风格切换。
- **避免命令式/对话式**：不要写 "please add my dog"，写 "A dog excitedly runs into the scene from off-camera"。
- **图生视频**：输入图决定主体/构图/色彩/光线，文字只写运动。

## 高级工作流（Veo 3.1 官方三工作流）

### 工作流 1：首尾帧过渡（First and Last Frame）
**用途**：受控运镜或两个视点之间的自然过渡（自带音频）。
1. 用文生图生成起始帧（如：歌手正面中景）；
2. 生成结束帧（如：从歌手背后看观众的 POV）；
3. 两帧输入"首尾帧"功能，提示词描述过渡与音频：
   > "The camera performs a smooth 180-degree arc shot, starting with the front-facing view of the singer and circling around her to seamlessly end on the POV shot from behind her on stage. The singer sings '...'"

### 工作流 2：参考图驱动一致性（Ingredients to Video）
**用途**：多镜头场景中角色/场景/风格跨镜头一致（含音频）。
1. 用文生图生成"配料"：角色 A、角色 B、场景参考图；
2. 每镜头引用配料图 + 描述该镜头的景别/动作/对白：
   > "Using the provided images for the detective, the woman, and the office setting, create a medium shot of the detective behind his desk. He looks up at the woman and says in a weary voice, '...'"

### 工作流 3：时间戳导演（Timestamp Prompting）
**用途**：单次生成内导演完整多镜头序列，精确控制节奏。
```
[00:00-00:02] Medium shot from behind a young female explorer, as she pushes aside a jungle vine to reveal a hidden path.
[00:02-00:04] Reverse shot of her freckled face, expression filled with awe upon ancient ruins. SFX: rustle of leaves, distant bird calls.
[00:04-00:06] Tracking shot as she runs her hand over carvings on a stone wall. Emotion: wonder.
[00:06-00:08] Wide high-angle crane shot revealing the lone explorer in the vast temple complex. SFX: swelling orchestral score begins.
```
**要点**：每段指定时间、景别、主体动作、环境、情绪、音效——像导演在时间轴上写指令。

## 一致性控制（Character Consistency）

### 方法谱系
| 方法 | 机制 | 强度 | 适用 |
|---|---|---|---|
| 文字描述身份表 | 每镜头重复身份特征 | 弱 | 无参考图功能时 |
| 参考图（Reference/Ingredients） | 模型以图为准 | 强 | Veo 3.1、Runway Gen-4、可灵等 |
| LoRA/角色模型（如 ID-LoRA） | 训练固定角色 | 最强 | 高一致性需求 |
| 首尾帧链接 | 前一镜尾帧 = 后一镜首帧 | 强 | 连续动作 |
| 固定种子/风格锚 | 同风格锚定 | 中 | 风格一致性 |

### 实操规范（对应 4 文档 identity sheet）
- 每角色一张**多视图参考图**（正面/侧面/全身）；
- 提示词重申"禁止变化"项（发型、服装配色、面部特征、体态）；
- 关键场景用"尾帧接首帧"串镜头，避免漂移累积；
- 生成后逐镜头核对 identity sheet。

## 生成后审查清单（Post-Generation QA）

```
□ 主体一致性：角色/产品/场景是否漂移
□ 物理合理：肢体数量、运动连续性、遮挡关系
□ 文字正确：画面内文字/logo 无乱码（AI 常见缺陷）
□ 口型同步：对白与嘴形（如有）
□ 音频：对白清晰、音效位置正确、响度正常
□ 时长与画幅：符合目标平台
□ 风格统一：光线方向、色温、色调跨镜头一致
□ 运动模糊/快门感：无异常闪烁（flicker）
□ 版权与政策：无水印侵权、符合平台 AI 内容标注要求
□ 内容安全：无有害内容、符合发布规范
```

## 常见错误

1. 提示词过载：一次生成塞入多场景/多风格/多动作 → 模型互相妥协，全部失控。
2. 负面提示依赖："no camera movement" 反而可能产生奇怪运动。
3. 抽象概念："充满快乐的氛围" → 模型随机发挥。
4. 图生视频重复描述图内细节：画面"冻住"，运动减少。
5. 一致性靠文字：多镜头后角色必然漂移——必须用参考图/尾帧链接。
6. 不审查画面文字：AI 生成的招牌/产品文字经常是乱码。
7. 忽略音频指令：需要对白/音效时不在提示词里写。
8. 短片段硬切多场景：违反"一次生成 = 一个场景"。

## 术语表（中英对照）

| 中文 | English | 一句话定义 |
|---|---|---|
| 文生视频 | Text-to-Video | 文字直接生成视频 |
| 图生视频 | Image-to-Video | 图片驱动运动生成 |
| 首尾帧 | First/Last Frame | 两帧间的过渡生成 |
| 参考图 | Reference / Ingredients | 一致性锚定图 |
| 时间戳提示 | Timestamp Prompting | 按秒段导演 |
| 提示词公式 | Prompt Formula | 结构化的提示模板 |
| 主体运动 | Subject Motion | 角色动作描述 |
| 摄影机运动 | Camera Motion | 运镜描述 |
| 场景运动 | Scene Motion | 环境反应描述 |
| 风格描述 | Style Descriptor | 美学与形式 |
| 负面提示 | Negative Prompt | 排除项描述 |
| 口型同步 | Lip-sync | 嘴形与对白对齐 |
| 一致性 | Consistency | 跨镜头稳定 |
| 身份表 | Identity Sheet | 角色固定特征表 |
| LoRA | LoRA | 轻量角色/风格微调 |
| 种子 | Seed | 随机性控制参数 |
| 闪烁 | Flicker | 帧间亮度跳动 |
| SynthID | SynthID | AI 内容水印 |
| 分镜生成 | Storyboard Generation | 逐镜头批量生成 |
| 生成审查 | Generation QA | 输出质量检查 |

## 补充：八层通用提示词框架与逐模型适配

> 以下内容原载于 34-ai-video-models，提取其独有的八层框架与逐模型操作手册。

### 八层提示词框架（AI Workflow Pro）

视频提示词比图片难，因为每条指令都有**时间维度**。八层框架是"调试系统"——片段失败时能定位哪一层出问题，而非整段重写。工具约 18 个月换一代，框架不过时。

| 层 | 职责 | 写什么 |
|---|---|---|
| 1 | 参考资产 Reference | 哪张图/产品/角色/首尾帧控制身份 |
| 2 | 镜头标签 Shot Label | 单镜 / 时间戳段 / 场景号 |
| 3 | 主体 Subject | 谁/什么出现，2-3 个稳定视觉细节 |
| 4 | 动作 Action | 身体/物体级运动 + 速度 + 方向 |
| 5 | 镜头 Camera | 一个运镜 + 一个构图/镜头 + 一个视点 |
| 6 | 场景与光线 Scene & Lighting | 环境、光方向、色温、氛围 |
| 7 | 音频/时间 Audio & Timing | 对白、音效、环境声、节拍或静默 |
| 8 | 约束 Constraints | 风格锚、质量词、负面提示、输出限制 |

**核心纪律**：每条指令只干一件事——矛盾指令（同句"微距特写+大远景+手持无人机+慢推轨"）会让模型平均化互相冲突的想法。

#### 四层视觉主力写法

- **主体**：生产约束而非氛围——2-3 个不变特征（年龄段/服装/材质/颜色/环境锚）；别堆 20 个特征（冲突产生漂移）。
- **动作**：写可见层——"创始人感到振奋"不可见；"暂停、看终端、呼气、重新打字"可见。"产品显高级"不可见；"黑色金属设备缓慢旋转，一圈细边光划过边缘"可见。
- **镜头**：每镜一个主运镜（slow push-in / locked-off / handheld follow / top-down / macro close-up / orbit / low-angle tracking）。
- **光线**：方向+色温（"窗光从机位左侧"、"冷蓝显示器光"、"暖日落逆光"）——具体光行为 > "cinematic"。

#### 单镜骨架模板

```text
Reference assets: [仅在使用时]
Shot 1:
Subject: [主体 + 稳定细节]
Action: [可见运动 + 节奏 + 方向]
Camera: [构图 + 单一运镜]
Scene and lighting: [环境 + 光线 + 氛围]
Audio/timing: [对白/音效/环境声/静默]
Constraints: [风格锚 + 不要文字/字幕/伪影]
```

多镜：每段时间戳重复 2-7 层，第 8 层全局。

### Runway Gen-4.5：物理优先

- **强项**：物理运动、动力学产品镜头、图生视频；物理准确性与提示词遵循度最高。
- **专属语法——力的因果链**：什么推、什么抵抗、什么变形、下一步动什么、镜头怎么记录。
  - 弱："The ball bounces on the table."
  - 强："The rubber ball drops from 30cm, compresses on the oak surface, rebounds to half height, and settles with two smaller bounces. The table vibrates slightly."
- **独有控制**：
  - **Motion Sketch**：直接在参考图上画运动路径（相机/主体/物体轨迹）；
  - **Act-Two**：上传自己的表演视频驱动角色表演；
  - **Explore Mode**：无限变体迭代；
  - **21:9 超宽**（独有）；
  - 官方镜头术语库（dolly/push-in/orbit/pan/truck/boom）——用官方词比自由描述可靠。
- **限制与对策**：单次 ≤10s（用"上一段尾帧=下一段首帧"拼接）；快速运动纹理软化（加 "sharp texture, no motion blur on product surface"）；长片段人脸漂移（面部关键镜头改用 Kling）。

### Kling 3.0（可灵）：角色与对话控制

- **强项**：跨镜头角色一致性（脸/服装/声音）、多角色对话。
- **Elements 系统**：上传 4 张参考图建"Visual DNA"（面部/发型/服装/体型），跨生成持久；**Bind Subject 开关**硬锁定一致性（其他模型没有的关键开关）。
- **多镜故事板**：单次生成最多 6 个镜头（各设时长 3-15s/机位/动作），身份绑定自动跨镜头。
- **对白与口型**：原生 5+ 语言唇语同步、多角色音轨；对白语法：
```text
Character A says: "The prototype is ready."
  Face: slight smile, raised eyebrows, nods once.
  Camera: Medium close-up, eye level.
```
**必须写谁说话+说话时表情+说话时机位**——只写台词则表情/机位随机。
- **独有参数**：原生 4K/60fps、视频延长（身份延续）、@element_name 绑定语法。
- **限制**：物理准确性弱于 Runway——运动戏别选它。

### Seedance 2.0：参考处理（字节）

- **强项**：参考图/多模态控制、中文生态。
- **适配要点**：参考图说清控制对象；中文提示词自然描述 + 时间戳分段；导演级参数（运动/镜头控制）按官方 playbook。

### 中文生态速查（可灵/即梦/海螺）

- 可灵：角色一致性 + 多镜故事板 + 唇语；
- 即梦：模板丰富、图生视频、智能参考；
- 海螺：首尾帧、运动笔刷类控制；
- 通用：中文描述 + 参考图锚定 + 时间戳分段。

### 模型选择决策树

```
镜头难点是什么？
├─ 物体有重量/动量/材料感 → Runway（力的因果链 + Motion Sketch）
├─ 角色脸/服装/声音跨镜头一致 或 多角色对白 → Kling（Elements + 对白语法）
├─ 需要同步音频/口型/首尾帧过渡 → Veo 3.1
├─ 多参考图/中文生态/多模态 → Seedance / 可灵 / 海螺
└─ 需要 4K60 大屏交付 → Kling
```

### 通用失败模式与修复（五类）

| 失败 | 原因 | 修复 |
|---|---|---|
| 主体被模型发明 | 主体欠定义 | 补 2-3 个稳定细节 |
| 片段静止 | 动作太抽象 | 写身体/物体级可见动作 |
| 运镜与动作冲突 | 镜头层矛盾 | 每镜一个主运镜 |
| 风格词压过场景逻辑 | 第 8 层过强 | 把风格移到约束层、场景逻辑前置 |
| 出现文字/字幕/伪影 | 负面约束模糊 | 明确 no text/subtitles/artifacts |

## 来源

- Google Cloud: The Ultimate Prompting Guide for Veo 3.1 — https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-veo-3-1
- Runway: Gen-4 Video Prompting Guide — https://help.runwayml.com/hc/en-us/articles/39789879462419-Gen-4-Video-Prompting-Guide
- Runway: Text to Video Prompting Guide — https://help.runwayml.com/hc/en-us/articles/42460036199443-Text-to-Video-Prompting-Guide
- MindStudio: Storyboards and Character Sheets for AI Video — https://www.mindstudio.ai/blog/storyboards-character-sheets-ai-video-generation
- Agentbrisk: AI Video Prompting Guide 2026（Sora/Veo/Runway/Kling 对比） — https://agentbrisk.com/blog/ai-video-prompting-guide-2026/
- QuestStudio: 25 AI Video Prompt Mistakes — https://queststudio.io/blog/ai-video-prompt-mistakes-25
- AI Workflow Pro: AI Video Prompt Framework — 8-Layer Template — https://aiworkflowpro.com/ai-video-prompt-framework/
- Invideo: How to Write AI Video Prompts Differently for Runway/Kling/Veo/Seedance — https://invideo.io/faq/how-do-you-write-ai-video-prompts-differently-for-runway/
- 可灵 AI 视频提示词八层框架（中文） — https://xiangyugongzuoliu.com/kling-video-prompt-guide/
- Atlas Cloud: Kling AI 视频提示词指南 2026 — https://www.atlascloud.ai/zh/blog/tips/kling-ai-video-prompt-guide
- aistacknav: 可灵/即梦/海螺/Runway 横评 — https://aistacknav.com/kling-ai-jimeng-hailuo-runway-ai-video-tools-comparison/
- Sovra: Advanced AI Video Prompt Techniques — https://sovra.video/blog/advanced-ai-video-prompt-techniques

<!-- merged from: #34-ai-video-models -->

## 相关概念

- [图片一致性控制（Character & Visual Consistency）](../39-image-consistency/character-consistency.md)
- [分镜图生成工作流（Storyboard-to-Video Pipeline）](../40-storyboard-generation/storyboard-generation.md)
- [全片风格统一与美术指导（Style Unification & Art Direction）](../45-style-unification/style-unification.md)
