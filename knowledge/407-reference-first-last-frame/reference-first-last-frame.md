---
type: Playbook
title: "参考图与首尾帧实战手册（Reference & First/Last Frame — Control Playbook + AI）"
description: "参考图与首尾帧的镜头级控制：四类参考图的用法与权重、首帧/尾帧要素清单、从图到动的五步工作流、忠实度 vs 运动度的强度平衡、常见错误与 AI 编排"
tags:
  - "craft"
  - "camera"
  - "workflow"
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
  - resource: "cited:OpenAI Video generation with Sora"
    id: cite-1
    title: "Video generation with Sora"
    author: "org:OpenAI"
  - resource: "cited:https://developers.openai.com/api/docs/guides/video-generation"
    id: cite-2
    title: "https://developers.openai.com/api/docs/guides/video-generation"
  - resource: "cited:Google Generate videos with Veo 3.1"
    id: cite-3
    title: "Generate videos with Veo 3.1"
    author: "org:Google"
  - resource: "cited:https://ai.google.dev/gemini-api/docs/veo"
    id: cite-4
    title: "https://ai.google.dev/gemini-api/docs/veo"
  - resource: "cited:可灵 图生视频 API"
    id: cite-5
    title: "图生视频 API"
    author: "org:可灵"
  - resource: "cited:https://www.klingai.com/document-api/api/video/2-0-master/image-to-video"
    id: cite-6
    title: "https://www.klingai.com/document-api/api/video/2-0-master/image-to-video"
  - resource: "cited:即梦 视频生成3.0 图生视频-首尾帧接口文档"
    id: cite-7
    title: "视频生成3.0 图生视频-首尾帧接口文档"
    author: "org:即梦"
  - resource: "cited:https://www.volcengine.com/docs/85621/1791184"
    id: cite-8
    title: "https://www.volcengine.com/docs/85621/1791184"
  - resource: "cited:Luma How to Use Keyframes"
    id: cite-9
    title: "How to Use Keyframes"
    author: "org:Luma"
  - resource: "cited:https://lumalabs.ai/learning-hub/how-to-use-keyframes。"
    id: cite-10
    title: "https://lumalabs.ai/learning-hub/how-to-use-keyframes。"
dx_id: "407"
related:
  - "116-image-to-video-control/image-to-video-control.md"
  - "115-video-prompt-engineering/video-prompt-engineering.md"
  - "39-image-consistency/character-consistency.md"
  - "240-style-reference-driven/style-reference-driven.md"
  - "126-style-art-direction/style-art-direction.md"
---

# 参考图与首尾帧实战手册（Reference & First/Last Frame — Control Playbook + AI）

> 本页为 AI 视频生成的参考图与首尾帧控制：参考图类型与权重、首帧/尾帧设计、从图到动的完整工作流、图像强度平衡、常见错误表。知识本体来自 2026 主流视频模型官方指引（OpenAI Sora、Google Veo 3.1、可灵 Kling、字节即梦/Seedance、Luma）。AI 应用面向 DirectorX：把"想要的画面"变成"喂给模型的图"——参考图与首尾帧是文本直出之外最可靠的控制面（衔接 116 图生深度控制、115 提示词工程）。
> 来源：OpenAI「Video generation with Sora」、https://developers.openai.com/api/docs/guides/video-generation；Google「Generate videos with Veo 3.1」、https://ai.google.dev/gemini-api/docs/veo；可灵「图生视频 API」、https://www.klingai.com/document-api/api/video/2-0-master/image-to-video；即梦「视频生成3.0 图生视频-首尾帧接口文档」、https://www.volcengine.com/docs/85621/1791184；Luma「How to Use Keyframes」、https://lumalabs.ai/learning-hub/how-to-use-keyframes。

## 概述：参考图与首尾帧在 AI 视频里的定位

**核心断言**：AI 视频模型的两种输入图，解决两类不同问题——

- **参考图（Reference Image）**：锁定"长什么样"——主体身份、视觉风格、场景环境。它是一致性锚（衔接 39 图片一致性、240 风格参考）。
- **首帧/尾帧（First/Last Frame）**：锁定"从哪里动到哪里"——运动路径的起止点。模型在两点之间**插值（Interpolation）**补出中间帧（Veo 3.1 官方称首尾帧生成为 interpolation；Luma 称 Keyframes）。

两者叠加 = **用图锁静态、用首尾帧锁动态**。参考图决定"这个镜头里是谁、什么风格"，首尾帧决定"这个镜头里发生了什么运动"。文本提示词的角色则退居为**运动与转场描述**（衔接 115：提示词聚焦变化，静态信息靠图）。

各主流工具的能力差异（全部来自官方文档）：

| 工具 | 首帧 | 尾帧 | 参考图 | 主体/角色锁定 | 关键约束 |
|---|---|---|---|---|---|
| Sora 2 / 2 Pro（OpenAI） | `input_reference` 即首帧 | 无独立尾帧参数（用 Extensions/Edits 续接） | `input_reference`（品牌资产/角色/环境） | Characters 可复用资产，一镜最多 2 个 | 参考图必须匹配输出分辨率；角色需在提示词中指名 |
| Veo 3.1（Google） | `image` 主输入 | `last_frame` 生成约束 | 最多 3 张（人物/角色/产品） | 参考图即身份 | 用参考图时时长必须 8s |
| 可灵 Kling | `image` | `image_tail` | 图生视频首帧即参考 | 主体库 `element_list`（最多 3 主体） | 尾帧与运镜/运动笔刷互斥（三选一）；图宽高比 1:2.5~2.5:1 |
| 即梦/Seedance（字节） | `image_urls[0]` | `image_urls[1]` | 多模态素材（图/视频/音频） | 参考图/智能参考 | **尾帧必须与首帧同比例**；图 ≤4.7MB、短边 ≥320 |
| Luma Dream Machine | Start Frame | End Frame | 参考图 | — | 起止帧构成动态转场 |

**DirectorX 纪律**：每个镜头至少提供"首帧 + 参考（角色或风格）"两重锁；要精确控制运动终态时再加尾帧。图能表达的不要用文字硬拗（衔接 116）。

## 参考图类型与用途

参考图按锁定的对象分四类。生成前先问："这一镜最不能漂移的是什么？"——答案决定用哪类参考、给多高权重。

### 1. 风格参考（Style Reference）

- **作用**：锁定画面美学——色彩倾向、材质、光影语言、画风（衔接 240 风格参考、126 风格美术）。
- **权重影响**：风格参考强 = 画面"长在"参考的调性里，但主体细节可能与参考人物混淆；权重低 = 风格漂回模型默认审美。
- **怎么用**：给"没有人/物的氛围图或美术设定图"。Veo 3.1 官方示例即用 Nano Banana 生成服装/配饰图作参考来引导成片风格与内容；即梦同源图生图提供"智能参考"模式，官方定位是"在精准执行编辑指令与保持图像内容完整性之间"取平衡。

```text
参考图（风格）：青绿色赛博雨夜街景概念图
提示词：基于参考图的色调与光感，镜头缓慢推进穿过霓虹雨巷，
保持青绿与品红的补色氛围，雨丝与倒影细节延续参考图质感
```

### 2. 角色/主体参考（Character / Subject Reference）

- **作用**：锁定"谁"——脸、体态、服装、道具细节（衔接 39 图片一致性、117 一致性全体系）。
- **权重影响**：主体参考是所有参考里权重需求最高的——它是身份，不是氛围；权重不足会"换人"。
- **怎么用**：
  - Sora：上传角色资产（Characters），官方明确要求**在提示词里指名角色名**（"Mention the character name verbatim in your prompt"），仅传 ID 不足以稳定保留角色。
  - 可灵：把主体存入主体库，生成时用 `element_list` 引用（最多 3 个主体），提示词里用 `<<<element_1>>>` 指代。
  - Veo 3.1：把人物/产品图直接作参考图（最多 3 张），官方示例为"连衣裙图 + 模特图 + 眼镜图"三张组合锁一身造型。

```text
参考图（主体）：角色半身设定图（正面、均匀光、无遮挡）
提示词：<<<element_1>>> 转身看向镜头，微笑，然后缓步走出画面，
服装与发型严格保持参考图一致
```

### 3. 场景参考（Scene / Environment Reference）

- **作用**：锁定"在哪"——环境结构、陈设、空间关系（衔接 228 环境概念、233 场面调度）。
- **权重影响**：场景参考强 = 空间稳定，但主体在场景内的走位会被压缩（模型倾向少动）；权重低 = 背景开始"自我发挥"、穿帮。
- **怎么用**：给空镜/环境图作首帧或独立参考，让模型把主体"放"进去。Sora 官方定位 `input_reference` 即"preserve the look of a brand asset, a character, or a specific environment"——场景与角色同属首帧参考的适用对象。

### 4. 构图参考（Composition Reference）

- **作用**：锁定"怎么框"——景别、机位高度、主体在画面中的位置与比例（衔接 216 构图法则、178 机位高度、231 景别情绪）。
- **权重影响**：构图参考是首帧最天然的载体——首帧本身就是构图参考。独立构图参考常见于"以图构图"的模仿式生成。
- **怎么用**：把故事板画面/参考剧照作首帧，提示词只写运动，不写景别（避免与图冲突）。即梦官方要求尾帧与首帧同比例（宽高比 ≤3、尾帧与首帧比例相同），本质就是在保护构图的画框一致性。

**四类参考速查表**：

| 类型 | 锁定对象 | 典型权重需求 | 给什么图 | 提示词怎么写 |
|---|---|---|---|---|
| 风格参考 | 美学/色调/光影 | 中 | 氛围图、概念图 | 描述"延续参考图的质感/色调" |
| 角色参考 | 身份/服装/道具 | 高 | 设定图、多角度图 | 指名角色（或 `<<<element_1>>>`） |
| 场景参考 | 环境/空间 | 中高 | 空镜、环境图 | 描述主体在场景中的运动 |
| 构图参考 | 景别/机位/位置 | 中 | 首帧/故事板 | 只写运动，不写景别 |

## 首帧设计

首帧 = 运动的起点，也是观众看到的第一个画面。它同时承担**构图参考**与**主体锚**双重职责（Sora 的 `input_reference` 官方定位就是"作视频的首帧并保留参考的样貌"）。

### 首帧要素清单（生成首帧前逐项核对）

| 要素 | 检查问题 | 常见失分点 |
|---|---|---|
| 主体 | 主体是否完整、清晰、无多余遮挡 | 主体被裁切/被道具挡住 |
| 姿态 | 是否是一个"能继续动起来"的预备姿态 | 静止僵直，模型不知该往哪动 |
| 构图 | 景别/机位/主体位置是否符合镜头表 | 与脚本景别不一致 |
| 光线 | 光源方向、色温、明暗比是否明确 | 平光无方向，后续运动缺光影逻辑 |
| 氛围 | 环境与情绪基调是否到位（衔接 250 氛围） | 背景空洞、情绪不明 |
| 画框 | 分辨率/宽高比是否符合输出规格（Sora 要求参考图匹配输出 size） | 比例不符被裁剪 |

### 首帧设计的三个"运动前置"原则

1. **留出运动空间**：主体朝运动方向一侧预留空间（例如要向右走，人物偏左）。
2. **姿态暗示动作**：起步瞬间的姿势（重心前倾、手已抬起）比完全静止更易激活自然运动。
3. **光线给出方向**：首帧光线方向明确，模型在运动时更倾向让光影跟随（衔接 93 光线叙事）。

## 尾帧设计

尾帧 = 运动的终点状态。它是"运动结束后**应该长什么样**"的定格，不是随便挑一张图。可灵官方将 `image_tail` 定位为"参考图像-尾帧控制"，Veo 3.1 将尾帧作为生成约束（generation constraint）——两者都强调：**尾帧是约束，不是参考**。

### 尾帧要素清单

| 要素 | 检查问题 | 常见失分点 |
|---|---|---|
| 主体终态 | 主体在终点应处的位置/姿态是否明确 | 主体凭空消失或瞬移 |
| 表情/动作完成度 | 动作是否"做完"（转身完成、坐下落定） | 悬在半空的动作 |
| 光照终态 | 光照是否与首帧构成合理演变（日落更暖、进门更暗） | 光照突变跳切 |
| 构图终态 | 景别/机位是否与首帧衔接合理 | 机位跳轴、比例不一致 |
| 连续性 | 与首帧的服装/道具/身份是否一致 | 换装、换发型 |

### 尾帧设计的两个"终点"原则

1. **终态是叙事的落点**：尾帧承载情绪与信息的收束（衔接 289 揭示设计：尾帧常是"揭示完成"的画面）。
2. **与首帧同画框**：即梦官方硬性要求"尾帧图片需与首帧图片比例相同"；不同比例会直接导致生成失败或画框跳变。

### 尾帧来源（三种做法）

- **图生图生成**：用首帧同角色设定图 + 提示词描述终点状态，AI 生成尾帧（最常用）。
- **视频截帧**：可灵官方支持"抽取视频中的关键帧作为首尾帧进行生成"（从素材视频里选帧）。
- **上一镜尾帧续接**：把上一镜的尾帧直接作下一镜首帧——跨镜一致性的核心手法（衔接 123 长视频一致）。

## 首尾帧工作流

从图到动的五步完整流程：

```text
① 选参考 → ② 定首尾 → ③ 写提示词 → ④ 生成 → ⑤ 校验与修复
```

### ① 选参考（锁身份/风格）

- 确定本镜"最不能漂移"的对象（角色/产品/场景/风格），按第二节的类型表给图。
- 多主体时按工具能力配：Veo 最多 3 张参考图；可灵主体库最多 3 个主体；Sora 一镜最多 2 个角色资产。

### ② 定首尾（锁运动路径）

- 首帧：按第三节清单出图（主体完整、姿态预备、光线明确）。
- 尾帧：按第四节清单出图（终态落定、同比例、同身份）。
- 复杂运动可加**中间关键帧**：Luma 的 Keyframes 即"start frame + end frame"转场模型；可灵支持多镜头分镜（`multi_shot` 最多 6 个分镜），每段各自约束。

### ③ 写提示词（只写变化）

- 提示词聚焦**运动、转场、相机动作**，静态信息交给图（衔接 115：overprompting 是帧间漂移主因）。
- 即梦官方建议 ≤400 字（上限 800）；可灵限制 ≤2500 字符。
- 相机运动单独立句：可灵提供 `camera_control` 六向运镜（horizontal/vertical/pan/tilt/roll/zoom，-10~10），也可在提示词里描述。

```text
提示词模板（首尾帧模式）：
[相机动作]，[主体动作与方向]，[运动过程中的关键变化（光线/环境/表情）]，
[终点状态确认：在尾帧处完成……]
```

### ④ 生成（固定参数）

- **固定 seed**：即梦官方说明——相同 seed + 相同参数 → "生成视频极大概率效果一致"。对比迭代时必须固定 seed，否则无法判断是参数作用还是随机波动。
- 参数一致性：分辨率、时长、比例全程不动（Sora 参考图须匹配输出 size；即梦图 ≤4.7MB、短边 ≥320、比例 ≤3）。

### ⑤ 校验与修复

逐项核对（衔接 174 质检）：

| 检查项 | 通过标准 |
|---|---|
| 首帧到达 | 视频第 1 帧 ≈ 输入首帧（无重绘/裁剪） |
| 尾帧到达 | 最后一帧主体状态 ≈ 尾帧（位置/表情/光照） |
| 身份稳定 | 全程无换脸/换装（衔接 117 四类一致性） |
| 光照连续 | 无帧间亮度跳变 |
| 比例/构图 | 画框无跳变、无突然裁切 |

未通过 → 按第七节错误表定向修复，不要盲目重roll。

## 图像强度/参考权重的平衡

**核心旋钮**：参考/首帧对生成的约束力 vs 模型自由发挥的空间——本质是**忠实度（fidelity）与运动度（motion）的天平**（衔接 116 图生深度控制中的 Image Strength 概念）。

各工具官方对这根轴的命名与语义：

| 工具 | 参数/机制 | 官方语义 | 调整方向 |
|---|---|---|---|
| 可灵 Kling | `cfg_scale`（0~1，默认 0.5） | "生成视频的自由度；值越大，模型自由度越小，与用户输入的提示词相关性越强" | 要稳调大、要动调小 |
| 即梦 | 智能参考/相似度 | "精准执行编辑指令 vs 保持图像内容完整性（人物特征及精细细节）" | 保细节调高、大改调低 |
| Veo 3.1 | 参考图数量（≤3 张） | 图越多对内容引导越强 | 加图=加权 |
| Sora | `input_reference` 作首帧 | 参考只条件化开场帧，运动由提示词驱动 | 运动靠提示词表达 |

**平衡经验表**：

| 镜头需求 | 强度设置 | 原因 |
|---|---|---|
| 产品/角色特写，形态不容漂移 | 高（0.7~0.9） | 身份 > 运动 |
| 一般叙事镜头 | 中（默认 0.5 附近） | 稳动兼得 |
| 大动作/舞蹈/爆炸 | 低（0.2~0.4） | 运动幅度优先，接受局部细节浮动 |
| 首尾帧插值（Veo/Luma） | 由两帧差决定 | 两帧差异大=变化大；差异小=微动 |

**关键认知**：忠实度和运动度是同一根轴，不是两个独立开关——参考过强会**冻结**画面（模型不敢动），参考过弱会**漂移**（动了但变了）。调强度时观察对象不是"像不像"，而是"动得够不够 + 变没变样"两个指标同时看。

## 常见错误表

| 错误 | 后果 | 正确做法 | 对应工具约束 |
|---|---|---|---|
| 首尾帧比例不一致 | 生成失败或画框跳变 | 首尾帧同比例出图 | 即梦：尾帧须与首帧比例相同 |
| 尾帧与运镜/笔刷同时用 | 接口冲突/参数失效 | 三选一：尾帧 / 运动笔刷 / 相机控制 | 可灵：`image_tail` 与 `dynamic_masks`/`camera_control` 互斥 |
| 参考过强 | 画面冻结、动作僵 | 降低强度/自由度；运动写进提示词 | 可灵：调低 `cfg_scale` |
| 参考过弱/无参考 | 主体漂移、换脸换装 | 加角色/主体参考；指名主体 | Sora：提示词指名角色名；可灵：`element_list` |
| 尾帧随意选 | 终点失控、动作悬空 | 尾帧=运动结束的落定状态 | 全部工具 |
| 提示词过载（overprompting） | 帧间漂移、效果不生效 | ≤400 字聚焦运动；静态交给图 | 即梦：prompt 过长"效果异常或不生效" |
| 参考图分辨率不匹配 | 画面被裁/变形 | 参考图按输出 size 出图 | Sora：须匹配目标视频分辨率 |
| 迭代不复现 | 无法对比参数效果 | 固定 seed 再改单变量 | 即梦：同 seed+同参数"极大概率效果一致" |
| 光照突变 | 跳切感 | 首尾帧光照统一/设计演变 | 全部工具 |
| 只锁首帧不锁尾帧 | 终点不可控 | 首尾双锁；复杂动作用中间关键帧 | Luma Keyframes / 可灵 multi_shot |

## 工作流应用（AI 编排）

用参考图把一致性"锁"进多镜头流水线——这是参考图与首尾帧在导演工作流里真正的战场（衔接 116/117/123）。

### 单镜锁定

```text
角色参考 + 风格参考（锚定身份与美学）
  → 首帧（构图+起点状态）
  → 尾帧（终点状态，可选）
  → 提示词：仅运动与相机
  → 生成 → 校验（首帧到达/尾帧到达/身份稳定）
```

### 跨镜一致性（三个层级的锁）

| 层级 | 手段 | 适用 | 工具示例 |
|---|---|---|---|
| 资产级 | 可复用主体资产 | 多镜同角色 | Sora Characters（跨多次生成复用）；可灵主体库 `element_list` |
| 图锚级 | 每镜注入同一参考图 | 全片统一风格/环境 | Veo 参考图；即梦智能参考 |
| 帧续级 | 上镜尾帧 = 下镜首帧 | 连续动作/长镜头（衔接 123） | 全部支持图生视频的工具 |

### Seedance 2.0 的多模态分层参考（字节官方）

Seedance 2.0 官方定位为"支持文字、图片、音频、视频四种模态输入，集成业界最全面的多模态内容参考与编辑能力"——即**分层参考**：角色层给图、运动层给视频、节奏层给音频，各层各自锚定，互不干扰。编排时按"哪一层在漂移就补哪一层的参考"来诊断（衔接 117 一致性全体系）。

### DirectorX 编排纪律

1. **先定资产再生成**：角色图/场景图/风格图在开工前建库，全片共用一套锚。
2. **每镜最小锁定**：至少"角色参考 + 首帧"；终态重要的镜加尾帧；连续动作用帧续级。
3. **参数可复现**：seed + 分辨率 + 比例全程记录，迭代只动一个变量。
4. **漂移定向修复**：按第七节错误表定位（身份漂移补参考、动作僵降强度、终点失控补尾帧），修复后重生成并复核（衔接 118 缺陷修复）。

## 术语表

| 中文 | English | 说明 |
|---|---|---|
| 参考图 | Reference Image | 锁定身份/风格/环境/构图的输入图 |
| 首帧 | First Frame / Start Frame | 运动起点，兼作构图与主体锚 |
| 尾帧 | Last Frame / End Frame | 运动终点约束，模型在首尾间插值 |
| 插值 | Interpolation | 模型在首尾帧之间补出中间帧的机制 |
| 关键帧 | Keyframe | 起/止（及中间）的约束帧 |
| 图像强度 | Image Strength | 忠实度 vs 运动度的平衡旋钮 |
| 自由度 | CFG Scale | 可灵参数：值越大模型自由度越小、与输入相关性越强 |
| 主体参考 | Subject Reference | 锁定角色/产品身份的参考 |
| 主体库 | Subject Library | 可灵：可复用的参考主体资产池 |
| 智能参考 | Smart Reference | 即梦：在编辑指令与内容保真间平衡的参考模式 |
| 风格参考 | Style Reference | 锁定美学/色调/光影的参考 |
| 场景参考 | Scene Reference | 锁定环境与空间的参考 |
| 构图参考 | Composition Reference | 锁定景别/机位/主体位置的参考 |
| 主体绑定 | Subject Binding | 模型级身份锁定（跨镜不漂移） |
| 首帧续接 | Last-Frame Continuity | 上镜尾帧作下镜首帧的跨镜续接 |
| 随机种子 | Seed | 固定后可复现生成的参数（同 seed+同参数≈同结果） |
| 过提示 | Overprompting | 提示词过度导致漂移/失效 |

## 相关概念

- [图生视频深度控制（Image-to-Video Control — First/Last Frame, Motion & Subject Lock）](../116-image-to-video-control/image-to-video-control.md)
- [视频提示词工程总纲（Video Prompt Engineering — Structure, Timing & Control）](../115-video-prompt-engineering/video-prompt-engineering.md)
- [图片一致性控制（Character & Visual Consistency）](../39-image-consistency/character-consistency.md)
- [AI 图片风格参考驱动（Style Reference Driven — StyleGallery & Semantic-Aware Transfer）](../240-style-reference-driven/style-reference-driven.md)
- [AI 风格化与艺术方向（Style & Art Direction — Visual Styles & Style Transfer）](../126-style-art-direction/style-art-direction.md)
