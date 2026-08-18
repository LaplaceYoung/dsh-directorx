
name: novel-characters
description: |
  从小说或短故事里拆出角色设定集：人物画像、形象提示词（英文）、音色提示词、
  角色设定图构图提示词，产出 cast.json + Markdown，用 directorx_bible 钉到画布评审。
  零依赖 Node 脚本做分块/归并/合成/校验/渲染，质量门是代码检查；设定图可选，
  走影棚生成工具（占位先行）。触发场景：拆小说角色、人物画像、角色卡、三视图设定、
  小说选角、character sheets from a novel。
allowed-tools:
  - Read
  - Write
  - Bash
  - Task
  - Glob
triggers:
  - novel-characters
  - 拆小说角色
  - 人物画像
  - 角色卡
  - 三视图设定
  - 小说选角
  - character sheets
  - character bible
  - cast from novel
tags: [novel, characters, cast, adaptation, preproduction]
metadata:
  license: Apache-2.0
  requires:
    bins:
      - node          # >= 18，只用标准库，无 npm 依赖
  runtimes:
    - claude-code

## novel-characters

输入一篇小说/短故事，输出每个角色的：人物画像、形象提示词、音色提示词、角色设定图。

`${CLAUDE_SKILL_DIR}` = 本文件所在目录。脚本 `${CLAUDE_SKILL_DIR}/scripts/novel-characters.mjs`，零依赖，`node` 直接跑。

**运行环境**：DirectorX。Step 1–7 / 9 / 10 全部是确定性脚本 + 模型读写；只有 Step 8 出图走 `directorx_propose` / `directorx_generate_ready` / `directorx_generate_image`——见 `references/sheet.md`。设定图是**可选**环节，不出图只交提示词，其余产出照常。

### Step 0 — 确定报告语言

用户可以指定语言，比如「用英文」「--lang en」「日本語で」。**没说就是中文（`zh`）。**

这个 `lang` 会一路传下去：第二趟生成角色卡时决定人类可读字段用什么语言，`validate` 和 `render` 也都要带上。

**界面文案分两种情况：**

- `zh` / `en` / `ja` —— 内置，不用管
- **其他任何语言** —— 你要现场翻一份。跑

  ```bash
  node ${CLAUDE_SKILL_DIR}/scripts/novel-characters.mjs ui-template <lang>
  ```

  它打印一份英文骨架，把每个值翻译成目标语言，整块放进 `cast.json` 顶层的 `ui` 字段。渲染时会合并进内置表。

  **不给 `ui` 的话 `validate` 会直接报错**——否则报告会是「角色内容是法语、界面标签是英文」的半吊子状态。

支持的语言不受内置表限制，法语韩语西班牙语都能出完整报告。

### Step 0.5 — 确定画风

用户可以指定出图风格：**默认 `realistic`**（半写实厚涂），想要动画质感就用 `ghibli`（吉卜力式手绘赛璐璐）。

```bash
node ${CLAUDE_SKILL_DIR}/scripts/novel-characters.mjs styles   # 打印预设的完整内容
```

读 `${CLAUDE_SKILL_DIR}/references/style-presets.md`。**换风格是整套换**——每个预设自带 render / surface / lighting / negative / tags 五块，整块取用，不要混搭。

最容易搞反的是反向提示词：`realistic` 绝不能禁 `photorealistic`，`ghibli` 必须禁。`validate` 会拦这个。

版面规则（16:9 三区、比例、细节让位）**不随风格变**，变的只有渲染质感。

### Step 1 — 定位输入

用户给文件路径就直接用。直接粘正文的，**先落到一个 .txt**——后面校验「引文是否逐字」要拿原文比对，没有原文文件这步就没法做。落点：会话工作目录的 `novel/` 下。

确定输出目录：用户指定就用；没指定就用会话工作目录下的 `novel/`（原书 .txt、workdir、cast 产物都收在这里，保持会话产物布局一致）。

### Step 2 — 分块

```bash
node ${CLAUDE_SKILL_DIR}/scripts/novel-characters.mjs chunk <book.txt> <workdir>
```

打印 `{"chunks": N, ...}`。

- **N == 1**：跳过 Step 3，直接在当前会话读原文做第一趟，结果自己写成 `<workdir>/roster-00.json`
- **N > 1**：进 Step 3
- `truncated: true`：明确告诉用户尾部没扫到，别闷着

### Step 3 — 第一趟扫描（仅 N > 1）

**并发派 swarm 子代理**：每块一个子代理，**所有派发放在同一条消息里**才是真并发。子代理简报必须带全四件：目标、输出格式（roster JSON 的路径与结构）、可读的文件、边界（只抽这一块，不跨块推断）。

每个子代理的任务：
1. 读 `${CLAUDE_SKILL_DIR}/references/roster-pass.md`，照它执行
2. 读 `<workdir>/chunk-NN.txt`
3. 把 roster JSON 写到 `<workdir>/roster-NN.json`
4. 只回一句「done NN，抽到 X 个角色」

### Step 4 — 归并 + 复核

```bash
node ${CLAUDE_SKILL_DIR}/scripts/novel-characters.mjs merge <workdir> | tee <workdir>/merged.json
```

落到 `merged.json` 不只是留档：Step 6 的 assemble 靠它拿同档角色的戏份顺序。

按名字+别名精确收敛（某块把「陆」列成「陆行远」的别名，两条就并成一个人），notes 累加、quotes 去重，按出现块数降序——出现的块越多戏份越重。

输出是 `{ "characters": [...], "mergeCandidates": [...] }`。**`mergeCandidates` 要逐条复核**：精确匹配只能收敛两块恰好写了相同称呼的情况，剩下的是语义判断，脚本做不了。候选来自名字包含关系（`「陆」⊂「陆行远」`）——是强信号不是判决，同姓的父子、兄弟就不能合。候选之外你自己看出来的同人（「陆先生」和「行远」没有包含关系，不会进候选）也要合。

要合并就写一份 merges.json 再落地：

```json
{ "merges": [{ "keep": "陆行远", "absorb": ["陆", "陆先生"] }] }
```

```bash
node ${CLAUDE_SKILL_DIR}/scripts/novel-characters.mjs merge <workdir> --apply merges.json | tee <workdir>/merged.json
```

`keep`/`absorb` 用名字或任一别名定位都行，找不到会直接报错。输出仍带 `mergeCandidates`，剩下的都确认是不同的人（或清空）再进下一步。没有要合的就直接往下走——但 `merged.json` 必须留着。

### Step 5 — 选角

取前 N 位。默认 30，用户说了就听用户的。剩下的角色在最后汇报里提一句「还识别出 X 位没做画像」。

### Step 6 — 第二趟出卡

每个角色一个 swarm 子代理任务，**所有派发放同一条消息**并发。

每份任务拿到：
- `${CLAUDE_SKILL_DIR}/references/profile-pass.md` 和 `${CLAUDE_SKILL_DIR}/references/schema.md`（读它们，照着做）
- **报告语言 `lang`**（Step 0 定的）
- 该角色归并后的 `name` / `aliases` / `notes` / `quotes`
- **同批其他角色的名字**（避免长相声线撞车）

角色卡 JSON 写到 `<workdir>/card-<slug>.json`。**断点续跑**：`card-<slug>.json` 已存在的角色不必重跑。

**同时写一段故事摘要**：用 `lang` 指定的语言，3–5 句，交代时空背景、核心情境、这几个人聚在一起的由头。短篇直接从原文写；长篇从各块的 roster note 归纳。不剧透结局，不写成推荐语。写到 `<workdir>/summary.txt`。非内置语言的话，把 Step 0 翻好的 ui 整块存成 `<workdir>/ui.json`。

然后合成 cast.json——**用 assemble，不要手拼**（手拼会丢字段、写错顶层键）：

```bash
node ${CLAUDE_SKILL_DIR}/scripts/novel-characters.mjs assemble <workdir> \
  --source <书名> --lang <lang> --style <style> \
  --out <输出目录>/<书名>-cast.json
```

坏卡会被逐个点名——哪份 `card-*.json` 坏了就只重跑那个角色，其他不用动。

同档角色的先后是戏份顺序，来自 Step 4 留下的 `<workdir>/merged.json`（assemble 自动读，也可用 `--order` 指别的文件）。报告左栏「按戏份排序」的序号就靠它——看到「同档角色将按文件名序」的警告说明 merged.json 丢了，回 Step 4 重新生成。

### Step 7 — 校验 ⛔ 不能跳

```bash
node ${CLAUDE_SKILL_DIR}/scripts/novel-characters.mjs validate <cast.json> <book.txt>
```

记得带上 `--lang`（Step 0 定的）。检查：结构、`importance` 枚举、**引文逐字**、**出图提示词不含人名**、**语言分工**（人类字段跟随 `lang`、出图/TTS 提示词永远英文）、以及**非内置语言必须带 `ui`**。

**有违规就按报错逐条修，改完重跑，直到通过。** 这四类错模型真的会犯——这套检查就是被真实输出打出来的。

### Step 8 — 出图（可选，每个角色都出）

**每个角色一张**，用 `image.sheet`，落到 `./images/<slug>-sheet.png`。一张横构图内部左右分栏：

```
┌──────────┬────────────────────────────┐
│  半身像   │   正视    侧视    背视       │
│ （证件照） ├────────────────────────────┤
│  面部基准  │  细节 · 细节 · 细节 · 细节   │
│   ~34%   │            16:9            │
└──────────┴────────────────────────────┘
```

左栏半身像是面部设计基准，右上三视图的脸照它画，右下是关键细节的小特写。**两条硬要求**：三视图的脸必须与半身像一致（否则一张图两个长相）；三个全身像的比例必须协调（模型会为了塞下细节把人压扁）。

读 `${CLAUDE_SKILL_DIR}/references/sheet.md`，照它的构图与质检要求做。出图走影棚生成工具，调用契约：

- **预算先收敛**：这是整条管线里最贵的一步。先给用户出图计划（多少张、每张预算），用户嫌多就砍到 `protagonist` / `major` 或指定数量，确认后才排队
- **试点先行**：先出 1 张主角的设定图给用户验收，通过后再把其余角色**全部占位**进 `directorx_propose`，用户确认后再生成
- **一个角色一个单元，绝不把多个角色拼进一张图**
- 画风统一：把主角成图作为后续角色的 `reference_image_paths` 锚（第一张定基调，出得不好先返修它）
- 成图落 `generated/` 后，`bash` 复制到 `<输出目录>/images/<slug>-sheet.png`（render 只认这里）；每张先 `view_image` 自查上面两条硬要求，不合格按单镜头返修规矩单独重排该单元
- 单个失败就跳过，不阻断；最后汇总说明
- **断点续跑**：`images/<slug>-sheet.png` 已存在就跳过，失败重来时只补缺的

**不按 `importance` 筛，用户确认的范围全都出。** 30 个角色就是 30 个生成单元——开始前必须跟用户说清数量。

### Step 9 — 输出

```bash
cd <输出目录>
node ${CLAUDE_SKILL_DIR}/scripts/novel-characters.mjs render <cast.json> --md   > <书名>-cast.md
```

不要另出 HTML。`directorx_bible` `{ action: "pin", kind: "characters" }` 把名单和质量门钉到画布。语言取 `cast.json` 里的 `lang`。

`render --md` 会提到 `images/<slug>-sheet.png`。所以**先出图再汇报**。

最终落地：

```
<输出目录>/
├── <书名>-cast.json
├── <书名>-cast.md
├── docs/characters-review.md
└── images/
    └── <slug>-sheet.png           ← 出了设定图才有
```

### Step 10 — 汇报

一句话说清：角色数、出图数、报告路径。校验一次没过的话，说明修了什么。有角色出图失败、被截断、或用户选择不设定图，明确说清楚。

## 边界

- 单次上限 24 块（净覆盖约 93 万字符），超了会明确报 `truncated`，不静默截断
- 人类可读字段跟随 `--lang`（默认中文）；出图和 TTS 提示词**永远英文**，那些引擎吃英文最稳
- 设定图最容易出的两个问题：**一张图里两个长相**、**为了塞细节把人物压扁**。拿到图先 `view_image` 扫一眼，见 `references/sheet.md`
- 出图只走 DirectorX 生成闸（propose / ready / generate）；不在后台偷偷直连任何外部出图服务
- 评审在画布和 DSH 会话里看，不另做交互网页

## 自测

```bash
node ${CLAUDE_SKILL_DIR}/scripts/selftest.mjs
```

307 项断言，不调模型、不花额度，覆盖分块 / 归并 / 合成 / 多语言 / 校验 / 渲染的全部确定性逻辑。改完脚本先跑这个。

## 自带样例

`${CLAUDE_SKILL_DIR}/examples/渡口.txt` 是一篇短故事，4 个角色，其中货郎全程只有绰号、船夫只被叫过「老伯」——专门用来验别名归并。对应产出 `渡口-cast.json` / `渡口-cast.md` 可以当质量基准，也是校验的自检夹具。

## 知识库参考

本 skill 的工作流程对应以下知识库主题，按需查阅：

**novel-characters 核心**：
- `04-character-worldbuilding` — 角色世界观构建，做人物画像和关系梳理时参考
- `101-ai-screenwriting` — AI 编剧方法论，理解角色卡在整体剧本中的位置
- `126-style-art-direction` — 风格与美术指导，选画风预设和写形象提示词时参考
- `00-visual-glossary` — 视觉术语表，确保提示词用词准确

**novel-art 关联**（角色设定图出图时）：
- `108-moodboard-reference` — 情绪板参考，定角色视觉基调时参考
- `109-shot-notation` — 镜头语言，理解三视图构图要求
- `125-lighting-atmosphere-prompt` — 光影与氛围提示词，写 lighting 部分时参考
- `117-ai-consistency-system` — AI 一致性系统，确保角色跨镜头一致
- `09-lighting-color` — 光影色彩基础
- `115-video-prompt-engineering` — 视频提示词工程，理解提示词结构

**novel-outline 关联**（从故事提取角色时）：
- `03-screenplay-pacing` — 剧本节奏，理解角色在故事中的作用
- `100-feature-structure` — 长片结构，长篇作品的角色分布
- `104-vertical-drama-onset` — 竖屏剧开场，短视频角色引入
- `105-commercial-pipeline` — 商业管线，理解角色卡的下游用途

**novel-script 关联**（角色对话和场景时）：
- `03-screenplay-pacing` — 剧本节奏
- `102-dialogue-coverage` — 对白覆盖，提取角色台词时参考
- `105-commercial-pipeline` — 商业管线
- `109-shot-notation` — 镜头语言

**novel-storyboard 关联**（角色设定图下游时）：
- `107-keyframe-animatic` — 关键帧动画，理解设定图的下游用途
- `109-shot-notation` — 镜头语言
- `115-video-prompt-engineering` — 视频提示词工程
- `116-image-to-video-control` — 图生视频控制
- `124-shot-language-gen` — 镜头语言生成
- `127-edit-transition-rhythm` — 剪辑转场节奏
- `130-prompt-template-library` — 提示词模板库
- `114-ai-video-model-matrix` — AI 视频模型矩阵，选模型时参考