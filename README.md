<div align="center">

<img src="docs/logo.svg" width="88" alt="DirectorX">

# DirectorX

**AI video director plugin for DeepSeek Harness**

给 DSH 装上取景器、剪辑台和无限分镜板。大脑仍是 DSH，插件只负责手脚。

<br>

[![license](https://img.shields.io/badge/license-Apache--2.0-0f172a?labelColor=111827)](https://github.com/LaplaceYoung/dsh-directorx/blob/main/LICENSE)
[![dsh-plugin](https://img.shields.io/badge/dsh-plugin-0ea5e9?labelColor=111827)](https://github.com/LaplaceYoung/dsh-directorx)
[![stars](https://img.shields.io/github/stars/LaplaceYoung/dsh-directorx?style=flat&color=f59e0b&labelColor=111827)](https://github.com/LaplaceYoung/dsh-directorx)
[![last commit](https://img.shields.io/github/last-commit/LaplaceYoung/dsh-directorx?color=64748b&labelColor=111827)](https://github.com/LaplaceYoung/dsh-directorx)
[![node](https://img.shields.io/badge/node-%3E%3D22.19-339933?labelColor=111827)](https://github.com/LaplaceYoung/dsh-directorx)

</div>

<br>

<p align="center">
  <a href="#它做什么"><strong>能力</strong></a> ·
  <a href="#快速开始"><strong>安装</strong></a> ·
  <a href="#一次制作怎么走"><strong>流程</strong></a> ·
  <a href="#和别的方案"><strong>对比</strong></a> ·
  <a href="#faq"><strong>FAQ</strong></a> ·
  <a href="#文档"><strong>文档</strong></a>
</p>

---

## 它做什么

DirectorX 是 DeepSeek Harness 的 **dsh-plugin**。它不实现第二套 agent loop，也不改画布上的生成节点——DSH 负责想、批、跑；插件提供媒体工具、导演知识、配方和无限画布。

改时间线是重渲染，不是重新生成。本地 ffmpeg 剪辑、混音、字幕、质检可以无限重跑，不花模型钱。

<table>
<tr>
<td width="50%" valign="top">

#### 看

拉片、抽帧、成片质检走确定性 ffmpeg，不靠模型「感觉过了」。

</td>
<td width="50%" valign="top">

#### 拍

图像 / 视频 / 音频生成，首尾帧与角色锚点写进规格。没有 Key 时用 `mock` 先跑通链路。

</td>
</tr>
<tr>
<td width="50%" valign="top">

#### 剪

时间线、智能精剪、混音闪避、字幕。改哪一层只重渲哪一层。

</td>
<td width="50%" valign="top">

#### 排

无限画布是分镜板：节点是镜头，连线是承接。UI 只投递意图，节点由 DSH 写。

</td>
</tr>
<tr>
<td width="50%" valign="top">

#### 编

`directorx_brief` 给出配方和阶段（plan → create → refine）。用现有工具自己串，不必走单一入口。

</td>
<td width="50%" valign="top">

#### 知

351 篇知识库、99 条方法论、12 套配方。生成前检索，质检引用规则编号。

</td>
</tr>
</table>

---

## 快速开始

需要已安装的 DeepSeek Harness Web 配置，以及 Node.js 22.19+。

```bash
# 在插件目录里装进 Web 配置
dsh plugin --profile web add .

# 打开 WebUI
dsh web
```

然后打开 **Settings → DirectorX**，四个能力各自开关：Vision / Image / Video / Audio。

| 阶段 | 做什么 |
| --- | --- |
| 现在 | 四个能力都切 `mock`，先把 brief → 画布 → 时间线跑通 |
| 有 Key 之后 | 填 Base URL 与 API Key，再开对应能力 |

开发与自测：

```bash
npm test          # typecheck + build + node:test
```

---

## 一次制作怎么走

复杂任务默认 **占位先行**：先排队完整规格（提示词 + 推荐模型 + 画幅/时长），分镜表签字后再花钱。

```mermaid
flowchart LR
  A[brief 分诊] --> B[调研 / 配方]
  B --> C[一次澄清]
  C --> D[分镜 / 角色锚]
  D --> E[propose 占位]
  E --> F[shotlist + /directorx]
  F --> G[directorx_confirm 签字]
  G --> H[用户确认后生成]
  H --> I[timeline 剪辑]
  I --> J[qa 质检]
  J -->|返修该镜| E
```

简单请求（一张图、一个短镜头）可以直接生成。多镜头、复刻、改编走上面这条。

---

## 工具箱里有什么

80+ 个 `directorx_*` 工具，按工作面分组：

| 工作面 | 代表工具 | 作用 |
| --- | --- | --- |
| 分诊 | `directorx_brief` | 类型、平台、时长、澄清问题、compose 阶段图 |
| 镜头 | `directorx_shot` / `shot_sequence` / `shot_gate` | 景别运镜布光 → 提示词；相邻镜承接；生成前门禁 |
| 占位 | `directorx_propose` / `canvas_shotlist` / `directorx_confirm` | 完整规格入队；编号分镜表；DSH 提问卡片签字。人也可 `/directorx` 直接看制片板 |
| 画布 | `directorx_canvas_*` | 节点、连线、Take、连续性、意图领取（DSH 掌管） |
| 剪辑 | `directorx_timeline` / `edit` / `smart_cut` | 场景、转场、混音、人话改时间线 |
| 质检 | `directorx_qa` / `qa_report` | 时长、画幅、黑场、响度、节奏 |
| 知识 | `directorx_knowledge_search` / `read` | 351 篇语料，按工艺检索 |

视频协议（设置页按能力配置，不绑死一家）：Sora 2、可灵（两代）、Runway、MiniMax H3、Vidu、Veo、Seedance。

---

## 和别的方案

| | 提示词清单 | 剪辑软件 | 成片平台 | **DirectorX** |
| --- | :---: | :---: | :---: | :---: |
| 理解任务 | 靠人 | 否 | 黑盒 | DSH + `brief` |
| 分镜可见、可改 | 否 | 部分 | 少 | 无限画布 |
| 改计划不重花生成费 | — | 是 | 否 | 时间线重渲染 |
| 知识可引用 | 否 | 否 | 否 | 规则编号 + 知识库 |
| agent 归谁 | — | — | 平台 | **始终是 DSH** |

---

## FAQ

<details>
<summary><b>没有 API Key 能用吗？</b></summary>

能。四个能力切 <code>mock</code> 即可跑通工具链、画布和剪辑。有 Key 再回设置页填写。

</details>

<details>
<summary><b>支持哪些视频模型？</b></summary>

Sora 2、可灵（新旧协议）、Runway、MiniMax H3、Vidu、Google Veo、豆包 Seedance。协议按官方文档接入，在 Settings → DirectorX 里按能力配置。

</details>

<details>
<summary><b>多镜头怎么保持同一张脸？</b></summary>

<code>directorx_character_register</code> 注册锚点；生成时带参考图和身份描述。相邻镜头用 <code>shot_sequence</code> 写承接，长片用画布连续性锁。

</details>

<details>
<summary><b>剪辑会花模型钱吗？</b></summary>

不会。剪辑、混音、字幕、质检都是本地 ffmpeg。花钱的只有你确认过的生成占位。

</details>

<details>
<summary><b>必须走 orchestrate 吗？</b></summary>

不必。<code>directorx_brief.compose</code> 给出配方和工具序列，用现有工具自己编排。<code>directorx_orchestrate</code> 只是可选加速。

</details>

<details>
<summary><b>画布上谁写生成中的节点？</b></summary>

只有 DSH。生成条把意图推进 <code>directorx_canvas_intents</code>，DSH 领取后再改画布。UI 不绕过 agent。

</details>

---

## 文档

| 文档 | 内容 |
| --- | --- |
| [架构](docs/architecture.md) | 插件边界、画布归属、路由 |
| [社区雷达](docs/community-radar.md) | 开源/商业能力取舍 |
| [验证](docs/verification.md) | 测试与验收口径 |
| [Changelog](CHANGELOG.md) | 用户可见变更 |
| [配方](recipes/) | 宣传片 / 改编 / 拉片复刻 / 单元化制作 |

```
dsh-directorx
├── src/           工具、画布、媒体、配方编排
├── skills/        方法论、工坊、novel-* 门禁
├── knowledge/     351 篇导演/生成语料
├── recipes/       内容类型先例（按素材改，不是目录）
├── workflows/     可选并行模板
└── tests/         node:test
```

---

<div align="center">

Apache-2.0 · [License](https://github.com/LaplaceYoung/dsh-directorx/blob/main/LICENSE)

如果它让 DSH 第一次把一条片子剪完，点个 Star。

</div>
