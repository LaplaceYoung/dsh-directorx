
name: novel-outline
description: |
  把一本小说改编成短剧大纲五件套：改编说明、人物表、爽点表、分集梗概、资产清单，
  产出 outline.json + Markdown，用 directorx_bible 钉到画布评审。13 道质量门全部脚本确定性检查
  （角色分档上限、主场景上限随集数动态、爽点间隔≤3集、每集钩子悬念必填……），不靠模型自觉；
  支持体检模式：贴一份现成大纲进来，只跑质量门给诊断。零依赖 Node 脚本。
  触发场景：改编大纲、短剧大纲、拆大纲、小说转短剧、大纲体检、adaptation outline。
allowed-tools:
  - Read
  - Write
  - Bash
  - Task
  - Glob
triggers:
  - novel-outline
  - 改编大纲
  - 短剧大纲
  - 拆大纲
  - 小说转短剧
  - 大纲体检
  - adaptation outline
metadata:
  license: Apache-2.0
  requires:
    bins:
      - node          # >= 18，只用标准库，无 npm 依赖
  runtimes:
    - claude-code
tags: [novel, outline, adaptation, preproduction]

## novel-outline

输入一本小说 + 目标参数，输出短剧改编大纲五件套。**四件模型写、一件脚本算**（资产清单从分集数据自动汇总）。

`${CLAUDE_SKILL_DIR}` = 本文件所在目录。脚本 `${CLAUDE_SKILL_DIR}/scripts/novel-outline.mjs`，零依赖，`node` 直接跑。

**边界（不做的事）**：不写剧本台词、不做分镜、不出图像/TTS 提示词。梗概是叙述体，出现引号对白就是越界——`validate` 会拦。想从小说拆角色设定（画像/形象提示词/设定图），那是 `novel-characters` 的活。

### Step 0 — 收参数 ⛔ 缺了不开工

一次问完，别轮流盘问。两件必问 + 两件给默认值待确认：

| 参数 | 处理 |
| --- | --- |
| **总集数 × 单集时长** | **必问**，没有合理默认 |
| **题材** | **必问**，决定爽点类型，猜错整份废 |
| 改编幅度 | 默认**抽核**（忠实 / 抽核 / 借壳），告知即可 |
| 已有偏好 | 默认无（想保哪个角色、哪场戏） |

平台阈值不同可以带上 `params.thresholds` 覆盖（默认：主角组 ≤ 5、重要配角 ≤ 10、功能性角色 ≤ 10、爽点间隔 ≤ 3 集）。**主场景上限不用配，随集数自动算**：4 + ⌈集数/10⌉，夹在 5–15（60 集 → 10）。这是 AI 短剧的数——场景是生成的没有搭景钱，放宽换观赏性；显式给 `maxPrimaryScenes` 才覆盖。**短篇（20–30 集）建议收紧角色档的阈值**，默认值是按 60 集以上给的。

**如果用户有 novel-characters 的产出（cast.json）**，直接拿来当人物原料——角色、别名、关系都是现成的，不用重拆原文。分档按 `importance` 映射：protagonist/major → `lead`，supporting → `support`，minor → `functional`。

### Step 1 — 定位输入

材料优先级，写死：

1. 用户点名的**精读章节**
2. **章节目录 + 简介**
3. 全文**分卷摘要**（Step 2）

**禁止凭书名脑补内容**——一切判断基于给到的文本。落地手段：`adaptation.keep` 的关键取舍要附 `evidence`（原文逐字片段）。

直接粘正文的先落成 .txt，落点：会话工作目录的 `novel/` 下。输出目录：用户指定就用，没指定用同一个 `novel/` 目录（与 novel-characters / novel-art / novel-script 的产物收在一处）。

### Step 2 — 分卷摘要（长文本才需要）

**这一步是脚手架，不是交付物**——分卷摘要是给没读过原文的模型压缩用的。两种情况直接跳到 Step 3：

- 短篇，单卷装得下
- **当前会话已经通读过原文**（比如刚跑完 novel-characters 的分块扫描）——不用再压缩一遍，也不用事后补档

长篇且没读过原文：

```bash
node ${CLAUDE_SKILL_DIR}/scripts/novel-outline.mjs chunk <book.txt> <workdir>
```

按章节标题分卷（默认每卷 15 章，`--per-volume` 可调），识别不出章节就按字数切。打印 `{"volumes": N, ...}`；`truncated: true` 就明确告诉用户尾部没扫到，别闷着。

每卷一个 swarm 子代理，**同一条消息里全部发出**才是真并发。简报带全四件：目标、输出格式、可读文件、边界。任务：读 `${CLAUDE_SKILL_DIR}/references/volume-pass.md`，读 `<workdir>/vol-NN.txt`，把卷摘要写到 `<workdir>/summary-NN.json`，只回一句「done NN」。

### Step 3 — 快版骨架 → 用户拍板 ⛔

读 `${CLAUDE_SKILL_DIR}/references/outline-pass.md` 和 `${CLAUDE_SKILL_DIR}/references/schema.md`，照着做。产出骨架四块（adaptation / characters / scenes / beats），写成 `<workdir>/outline.json`。

```bash
node ${CLAUDE_SKILL_DIR}/scripts/novel-outline.mjs validate <workdir>/outline.json --stage beats
```

过了 beats 档，**把三件事摆给用户拍板：砍了哪条线、合了哪些人、大爆点落在第几集**。不点头不进 Step 4——快版错了只损失一轮骨架，分集写完才发现方向错，全废。

### Step 4 — 细版骨架

吸收用户意见改骨架，再过一次 `validate --stage beats`。用户没意见就直接进 Step 5。

### Step 5 — 分集梗概（分批）

**每批 ≤ 10 集**，并发派 swarm 子代理（所有派发放同一条消息）。每个子代理拿到：拍板后的骨架四块、自己负责的集数区间、区间内的爽点，读 `${CLAUDE_SKILL_DIR}/references/episode-pass.md` 照着写，产出写到 `<workdir>/eps-NN.json`。

合并时按 ep 排序拼进 outline.json 的 `episodes`。

### Step 6 — 校验 ⛔ 不能跳

```bash
node ${CLAUDE_SKILL_DIR}/scripts/novel-outline.mjs validate <输出目录>/<书名>-outline.json
```

13 道质量门全部是代码，不是给你读的清单：主角组 1–5 人、重要配角 ≤ 10、功能性角色 ≤ 10、主场景不超上限（随集数动态，60 集 → 10）、一次性场景有规避方案、爽点间隔 ≤ 3 集无真空、第 1 集有钩子、大爆点不压最后一集、每集三栏齐全、三人同框有拆解、生成难点进预警、引用完整无失业角色、叙述体无对白。

**有违规逐条修，改完重跑，直到通过。**

### Step 7 — 输出与汇报

```bash
cd <输出目录>
node ${CLAUDE_SKILL_DIR}/scripts/novel-outline.mjs render <书名>-outline.json --md   > <书名>-outline.md
```

不要另出 HTML。`directorx_bible` `{ action: "pin", kind: "outline" }` 把同一份评审钉到画布文本卡，DSH 会话里展示 Markdown。评审里要有：质量门、拍板三件事、爽点间隔、分集梗概。JSON 仍是事实源。

汇报一句话说清：几集、几个角色几个场景、爽点分布；被截断或有没过的门要明说。

最终落地：

```
<输出目录>/
├── <书名>-outline.json
├── <书名>-outline.md
└── docs/outline-review.md         ← bible pin 写出
```

## 体检模式

用户贴一份**已有大纲**只想要诊断：转成 outline.json（缺的字段问用户或标注缺失），然后：

```bash
node ${CLAUDE_SKILL_DIR}/scripts/novel-outline.mjs checkup <outline.json>   # 终端 ✓/✗
```

或 `directorx_bible checkup`。质量门就是诊断书。未过的门也要钉到画布上看病灶。

## 联动更新

用户改了上游就跑一次 `validate`，报错会点名下游哪里断了：合并人物后哪些集还引用着被删的 ID、砍场景后哪些集空转、爽点挪动后哪里出现真空区。**不要靠记忆提示联动，靠校验器。**

## 边界

- 单次上限 60 卷（每卷 15 章约 900 章）。超了明确报 `truncated`，不静默截断
- 阈值是参数不是圣旨：平台不同就用 `params.thresholds` 覆盖，别改代码
- 评审界面用 Markdown / 画布，不另出 HTML
- 五件套的第五件（资产清单）永远是算出来的，模型手写必漏

## 知识库参考

以下知识库主题与本 skill 的工作流直接相关。在对应步骤中查阅可提升产出质量。

### Step 0–1 — 收参数与定位输入

- **`knowledge/03-screenplay-pacing`** — 剧本节奏基础：集数与时长如何影响叙事密度，辅助判断用户给的集数参数是否合理
- **`knowledge/100-feature-structure`** — 长片结构范式：三幕/五幕/序列结构，改编时理解原著骨架的理论支撑
- **`knowledge/104-vertical-drama-onset`** — 竖屏短剧的叙事 onset：短剧与传统影视的节奏差异，帮助设定合理阈值
- **`knowledge/101-ai-screenwriting`** — AI 编剧方法论：AI 短剧的改编策略与常见陷阱，直接指导 adaptation.keep 的取舍判断
- **`knowledge/105-commercial-pipeline`** — 商业管线：短剧的商业逻辑与平台规格，参数设定（集数、时长、题材）的商业依据

### Step 2 — 分卷摘要

- **`knowledge/101-ai-screenwriting`** — 摘要时保留什么丢弃什么：AI 编剧视角的叙事要素优先级

### Step 3–4 — 骨架与拍板

- **`knowledge/03-screenplay-pacing`** — 爽点间隔、钩子-悬念结构的节奏理论，验证拍板三件事的合理性
- **`knowledge/100-feature-structure`** — 大爆点在全剧结构中的位置：高潮不应压在最后一集的理论依据
- **`knowledge/101-ai-screenwriting`** — AI 改编的砍线合人策略：哪些叙事线可以合并、哪些角色可以折叠

### Step 5 — 分集梗概

- **`knowledge/102-dialogue-coverage`** — 对白覆盖：梗概是叙述体但要为后续剧本留对白空间，理解叙述与对白的边界
- **`knowledge/105-commercial-pipeline`** — 每集梗概的商业节奏：钩子、悬念、爽点的商业功能

### Step 6–7 — 校验与输出

- **`knowledge/109-shot-notation`** — 场景与镜头语言：资产清单中场景分类的参考，理解主场景与一次性场景的叙事功能差异
- **`knowledge/105-commercial-pipeline`** — 资产量折算的商业逻辑：角色数、场景数与制作成本的关系

## 自测

```bash
node ${CLAUDE_SKILL_DIR}/scripts/selftest.mjs
```

200 项断言，不调模型、不花额度。13 道质量门每一道都有击穿用例——证明它真的会拦。改完脚本先跑这个。

## 自带样例

`${CLAUDE_SKILL_DIR}/examples/渡口-outline.json`：把短故事《渡口》（novel-characters 的自带样例）改编成 6 集 × 2 分钟的微型大纲，四角色三场景四爽点，全部质量门通过。当质量基准，也是自测夹具。