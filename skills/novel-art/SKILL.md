
name: novel-art
description: |
  给 AI 短剧出美术设定集（场景 + 叙事道具）：一致性锚点、光照时段变体、空景提示词、
  道具状态变体/尺度参照/白底无手提示词。产出 art.json + Markdown，用 directorx_bible 钉到画布评审。
  为 AI 生成而设计——交付的是让场景道具跨集长一样的一致性方案；11 道质量门全部脚本检查。
  有 outline.json 就用 seed 预填场景清单；设定图可选，走 DirectorX 生成闸（占位先行）。
  触发场景：场景设定、美术设定、环境设定集、道具设定、场景一致性、scene bible。
allowed-tools:
  - Read
  - Write
  - Bash
  - Task
  - Glob
triggers:
  - novel-art
  - 美术设定
  - 场景设定
  - 环境设定集
  - 道具设定
  - 场景一致性
  - scene bible
  - art bible
tags: [novel, art, scenes, props, adaptation, preproduction]
metadata:
  license: Apache-2.0
  requires:
    bins:
      - node          # >= 18，只用标准库，无 npm 依赖
  runtimes:
    - claude-code

## novel-art

给 AI 短剧出**美术设定集**：场景 + 叙事道具。**前提刻在骨子里：这是 AI 生成，不是实拍**——没有堪景搭景置景采买，环境和道具都是要被生成几十次还得长一样的资产，所以交付物全部围绕一致性：

| 交付 | 解决什么 |
| --- | --- |
| 一致性锚点（每景 3–5 个） | 观众靠它认场景，QC 靠它核对生成镜头有没有漂 |
| 光照时段变体 | AI 换时段是重新生成不是重新打灯，每个状态落成完整提示词 |
| 空景出图提示词 | 环境和角色是两层资产，参考图里混进人，一致性全毁 |
| 变体机制（variantOf） | 生成新景便宜，但变体复用母场景资产更一致 |
| 道具状态变体 | 皮箱的合上与打开是两张参考图——道具有状态弧，场景没有 |
| 道具尺度参照 | AI 经常把手持道具画成家具尺寸，提示词必须带尺度短语 |
| 道具白底无手 | 道具图要被贴进各种镜头，必须可抠；拿着道具的手是最常见污染 |

`${CLAUDE_SKILL_DIR}` = 本文件所在目录。脚本 `${CLAUDE_SKILL_DIR}/scripts/novel-art.mjs`，零依赖，`node` 直接跑。

**边界（不做的事）**：不做分镜、不写剧本、不管角色（`novel-characters` 的活）、不排大纲（`novel-outline` 的活）。**道具只收叙事道具**（有特写、跨集、承载剧情的，通常 3–8 件）——场景陈设归场景锚点，一次性手部道具镜头级提示词解决，都不单独建资产。

### Step 0 — 定输入与画风

三种输入，优先级从高到低：

1. **outline.json**（novel-outline 的产出）——最优，场景清单、出现集、承载爽点、复用方案都是现成的
2. 小说原文——自己归纳场景清单（主舞台优先，参考 novel-outline 的主场景上限思路：别贪多）
3. 用户手写的场景清单

画风：**默认 `realistic`**（半写实厚涂），动画质感用 `ghibli`。**跟角色 skill 保持同一档**——角色是吉卜力、场景是半写实，合成的时候没法看。跑 `node ${CLAUDE_SKILL_DIR}/scripts/novel-art.mjs styles` 看预设全文，整块取用不混搭。

有 cast.json（novel-characters 的产出）也带上——校验「提示词不含角色名」要用。

**输出目录**：默认跟 novel-characters / novel-outline 用同一个会话工作目录下的 `novel/`，四套产物收在一处；用户指定就用用户的。

### Step 1 — seed 骨架（有 outline.json 才有这步）

```bash
node ${CLAUDE_SKILL_DIR}/scripts/novel-art.mjs seed <outline.json> > <workdir>/art.json
```

确定性搬运：场景 id/名称/主场景标记/出现集/承载爽点，带复用方案的场景会有 `seedNote` 提示做成变体。**这些事实不要让模型重新想一遍。**

没有 outline.json 就自己按 `references/schema.md` 建清单。

### Step 2 — 逐场景填设定 + 提取叙事道具

每个场景一份，**并发派 swarm 子代理**（所有派发放同一条消息）。每份任务拿到：

- `${CLAUDE_SKILL_DIR}/references/scene-pass.md` 和 `${CLAUDE_SKILL_DIR}/references/schema.md`（读它们，照着做）
- 该场景的骨架 + 原文/大纲里关于这个空间的全部信息
- **同批其他场景的名字**（空间气质要区分开，别都写成同一种破旧）
- 画风预设全文（`styles` 命令的输出）

核心要求都在 scene-pass.md 里，最重的三条：锚点要**可画可认可核对**（「补丁船篷」是锚点，「陈旧的氛围」是形容词）；光照状态**从分集反推**，不写用不上的全家桶；**能做变体就别开新景**。

**叙事道具**从原文/大纲提取（大纲没有现成道具表，这步是模型的活）：只收**有特写、跨集出现、承载剧情**的，通常 3–8 件，跟主角数量一个量级。每件按 `references/prop-pass.md` 填：戏剧功能、锚点、状态变体、尺度、白底无手提示词。皮箱这种「跟人走的道具」就该在这——塞进场景锚点和角色画像都不对。

### Step 3 — 校验 ⛔ 不能跳

```bash
node ${CLAUDE_SKILL_DIR}/scripts/novel-art.mjs validate <art.json> --cast <cast.json>
```

11 道质量门全是代码。场景 + 共用 7 道：锚点 3–5、光照状态 ≥1、**无人**、提示词全英文、不含角色名（给了 --cast 才查）、变体引用完整、风格与反向词匹配。道具专属 4 道：**状态 ≥1**、**尺度短语写进提示词**、**反向词禁手**、**设定图纯白背景**。

**有违规逐条修，改完重跑，直到通过。**

### Step 4 — 出图（可选）

场景和道具各一张 16:9 设定图，版面都是**主视角大图 + 底部和右侧的 L 形细节边框**。场景：标准取景 + 第一个光照状态，细节格是锚点特写。道具：白底三四分之一主视角（主状态），细节格是锚点特写 + 其他状态 + 侧面。读 `${CLAUDE_SKILL_DIR}/references/sheet.md` 照构图与质检要求做。出图走影棚生成工具，调用契约：

- **预算先收敛 + 试点先行**：先出 1 张主场景设定图给用户验收，通过后其余场景/道具**全部占位**进 `directorx_propose`，用户确认后再生成
- **全图无人**；道具图另加**无手**、**纯白背景**，出现人影或手就重生成
- **变体场景拿母场景成图当参考图**（写进该单元的 `reference_image_paths`）——变体机制的意义就在这
- 一个场景/道具一个单元绝不批量；单个失败跳过不阻断，单镜返修
- 成图落 `generated/` 后 `bash` 复制到 `images/<slug>-sheet.png`（render 只认这里），每张先 `view_image` 自查再放行

### Step 5 — 输出与汇报

```bash
cd <输出目录>
node ${CLAUDE_SKILL_DIR}/scripts/novel-art.mjs render <剧名>-art.json --md   > <剧名>-art.md
```

不要另出 HTML。`directorx_bible pin kind:art` 把质量门和场景/道具清单钉到画布。

汇报一句话说清：几个场景、几件道具、锚点总数、出图数；没过的门明说。

最终落地：

```
<输出目录>/
├── <剧名>-art.json
├── <剧名>-art.md
├── docs/art-review.md
└── images/
    └── <slug>-sheet.png           ← 出了设定图才有
```

## 三个 skill 的接力

```
novel-characters → cast.json    （谁：角色资产）
novel-outline    → outline.json （什么：结构与分集）
novel-art        → art.json     （哪里 + 手里拿的：美术资产）
```

seed 吃 outline.json（场景部分；道具表大纲里没有，模型从原文提取），`--cast` 吃 cast.json。三份 JSON 各自的报告都带导出按钮，改完都能喂回各自的 render/validate。

## 边界

- 评审用 Markdown / 画布，不另出 HTML；出图提示词永远英文
- 画风要跟角色 skill 同档，别一半写实一半动画
- 出图只走 DirectorX 生成闸（propose / ready / generate）
- 场景数量不设硬上限——上限在 novel-outline 的主场景门那里管；这里管的是每个资产的质量
- 道具只收叙事道具，3–8 件为宜——每多一件就多一份跨集一致性维护

## 自测

```bash
node ${CLAUDE_SKILL_DIR}/scripts/selftest.mjs
```

131 项断言，不调模型、不花额度。11 道质量门每一道都有击穿用例。改完脚本先跑这个。

## 自带样例

`${CLAUDE_SKILL_DIR}/examples/渡口-art.json`：《渡口》三场景 + 两件叙事道具（旧皮箱、县衙旧砚）的完整设定，全部质量门通过（含对着 novel-characters 样例 cast 的角色名检查）。当质量基准，也是自测夹具。

## 知识库参考

本 skill 的工作流程对应以下知识库主题，按需查阅：

**novel-art 核心**（美术设定与出图）：
- `108-moodboard-reference` — 情绪板参考，定场景视觉基调和光照氛围时参考
- `109-shot-notation` — 镜头语言，理解设定图构图要求和锚点取景方式
- `125-lighting-atmosphere-prompt` — 光影与氛围提示词，写光照状态变体提示词时参考
- `126-style-art-direction` — 风格与美术指导，选画风预设（realistic/ghibli）和写 sheet 提示词时参考
- `117-ai-consistency-system` — AI 一致性系统，理解锚点机制和跨镜头一致性的底层逻辑
- `00-visual-glossary` — 视觉术语表，确保提示词用词准确
- `09-lighting-color` — 光影色彩基础，设计光照时段变体时参考
- `115-video-prompt-engineering` — 视频提示词工程，理解提示词结构和 negative prompt 写法

**novel-characters 关联**（校验角色名、画风对齐）：
- `04-character-worldbuilding` — 角色世界观构建，理解 cast.json 里的角色关系
- `101-ai-screenwriting` — AI 编剧方法论，理解美术设定在整体管线中的位置
- `126-style-art-direction` — 风格与美术指导，确保场景画风与角色画风同档
- `00-visual-glossary` — 视觉术语表

**novel-outline 关联**（seed 骨架和场景清单来源）：
- `03-screenplay-pacing` — 剧本节奏，理解场景出现集和爽点承载的关系
- `100-feature-structure` — 长片结构，长篇作品的场景分布和主场景识别
- `104-vertical-drama-onset` — 竖屏剧开场，短视频场景设计特点
- `101-ai-screenwriting` — AI 编剧方法论
- `105-commercial-pipeline` — 商业管线，理解 art.json 的下游用途

**novel-script 关联**（道具提取和场景对账）：
- `03-screenplay-pacing` — 剧本节奏
- `102-dialogue-coverage` — 对白覆盖，理解道具在台词中的出现方式
- `101-ai-screenwriting` — AI 编剧方法论
- `105-commercial-pipeline` — 商业管线
- `109-shot-notation` — 镜头语言

**novel-storyboard 关联**（设定图下游用途）：
- `107-keyframe-animatic` — 关键帧动画，理解场景设定图如何被分镜引用
- `109-shot-notation` — 镜头语言
- `115-video-prompt-engineering` — 视频提示词工程
- `116-image-to-video-control` — 图生视频控制，设定图作为参考图的用法
- `124-shot-language-gen` — 镜头语言生成
- `127-edit-transition-rhythm` — 剪辑转场节奏，理解换景与光照变体的关系
- `130-prompt-template-library` — 提示词模板库
- `114-ai-video-model-matrix` — AI 视频模型矩阵，选模型时参考