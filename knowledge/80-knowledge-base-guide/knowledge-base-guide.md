---
type: Playbook
title: "知识库使用手册（Knowledge Base Agent Guide）"
description: "DirectorX 知识库调用手册：OKF 检索（type/tag/group）、任务→规范文映射、基础篇优先于综合篇、旧编号重定向"
tags:
  - "production"
status: stable
generated:
  by: "process:directorx-knowledge-okf"
  at: "2026-08-18T00:00:00Z"
verified:
  - by: "process:knowledge-audit"
    at: "2026-08-18T00:00:00Z"
sources:
  - resource: Open Knowledge Format v0.2 (Google Cloud knowledge-catalog)
    id: cite-okf
    title: "Open Knowledge Format v0.2"
  - resource: "https://arxiv.org/html/2604.14572v3"
    id: cite-corpus2skill
    title: "Distilling Enterprise Knowledge into Navigable Agent Skills"
  - resource: "https://arxiv.org/html/2605.05538v1"
    id: cite-agenticrag
    title: "AgenticRAG"
dx_id: "80"
aliases:
  - "376"
  - "385"
  - "394"
  - "navigable-knowledge"
  - "skill-library-navigation"
  - "knowledge-final-index"
---

# 知识库使用手册（Knowledge Base Agent Guide）

> DirectorX 知识库调用手册。先检索再按 id 精读；工艺事实以基础篇为准，综合篇只作上下位延伸。
> 来源：本库 OKF 包、Open Knowledge Format v0.2、arXiv Corpus2Skill / AgenticRAG。

## 概述

本库是 OKF v0.2 知识包：**路径是概念身份**，编号是稳定别名。当前约 330 篇有效文章，另有合并后的旧编号重定向。正确用法是「任务 → search（可过滤）→ read id → 沿相关概念下钻」，不要无目标翻目录。

## 检索四步

```
① 图解先行：视觉术语长什么样 → 00 视觉术语图解
② 主题定位：下方映射表或 directorx_knowledge_search
③ 规范精读：directorx_knowledge_read <id>，不要另起一套检索词
④ 相关下钻：读返回的 related / 正文「相关概念」，旧编号会自动重定向
```

`directorx_knowledge_search` 可带：

- `group`：foundation / production / consistency / synthesis
- `type`：Reference / Method / Playbook / Spec / Case
- `tag`：prompt、camera、i2v、continuity、sound、workflow 等

## 检索架构

导航优于平面翻阅（Corpus2Skill / AgenticRAG）：

```
任务鸟瞰 → type/tag 分层 → 规范文 id → 按 id 取全文 → 溯源
```

纪律：

- **走向而非搜**：有 id 就 read，不要用新短语再搜一遍。
- **由粗到细**：先 description / 映射表，再读全文。
- **基础篇优先**：350 以后的三融合 / 总合成 / 终索引是上下位延伸；镜头、提示词、一致性以 01 / 115 / 116 / 117 为准。
- **旧编号是别名**：183 → 116，376 / 385 / 394 → 本手册。

## 分层（四段）

| 段 | group | 读法 |
|---|---|---|
| 000–060 | foundation | 镜头、剪辑、剧本、灯光、流程术语 |
| 061–150 | production | 模型矩阵、提示词、图生、质检、工作流 |
| 151–240 | consistency | 风格、系列、连续性、声音理论 |
| 241–394 | synthesis | 综合 / 融合篇；先回到它衔接的基础号 |

## 任务 → 规范文

| 任务 | 先读 | 再读 |
|---|---|---|
| 写视频提示词 | 115 提示词工程 | 130 模板库 / 73 格式总表 |
| 选模型 | 114 能力矩阵 | 14 生成工作流 |
| 图生 / 首尾帧 | 116 图生深度控制 | 107 关键帧 / 39 图片一致性 |
| 分镜 / 镜号 | 172 分镜全链路 | 25 可视化 / 53 镜头表 |
| 角色 / 跨镜一致 | 117 一致性全体系 | 123 长视频一致 / 04 人物设定 |
| 调色 / 色板 | 141 色彩分级 | 155 色彩心理 / 36 LUT |
| 声音 / 口播 / 对口型 | 144 声音设计 | 119 声画协同 / 06 音频基础 |
| 短剧 / 竖屏 | 48 短剧工厂 | 104 实拍调度 / 43 竖屏语言 |
| 预告 / 片花 | 151 游戏 CG 与过场 | 205 预告海报 / 01 镜头语言 |
| 成片质检 | 174 QC 自动化 | 118 缺陷修复 |
| 版权 / 专名 | 213 版权安全提示词 | — |
| 风格 / 美术 | 126 风格与艺术方向 | 01 镜头 / 09 灯光 |
| 把框架写成可执行稿 | 332 全整合落地 | 121 端到端编排 |
| 生产阶段怎么推进 | 383 生产工作流实用 | 08 全流程术语 |

## 常用组装

### 连续镜头（图生）

`117 身份锁 → 116 首尾帧 → 115 六段式 → 174 抽帧质检`

### 短剧单集

`104 卡点 → 48 视觉工厂 → 172 分镜 → 116 连续 → 119 声画`

### 品牌广告

`213 去专名 → 126 风格 → 141 调色 → 54 封面（若需要）`

## 维护约定

1. 新文章必须有 OKF 头（至少 `type`），并用 Markdown 链接连到相关概念。
2. 编号不因改标题而重排；合并时写 `redirects.json` 与目标 `aliases`。
3. `overlap-review` 只表示综合篇待复核，不能当删除依据。
4. 模型 / 平台 / 法规看 `stale_after`。
5. 改完跑 `npm run knowledge:audit`，再用 `npm run knowledge:check`。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 不 search 就说库里没有 | 漏读 116 / 115 | 先 search 再断言 |
| 用新短语代替 route.articles | 读到邻近综合篇 | 按返回的 id read |
| 把 350+ 综合篇当工艺规范 | 空转「总合成」 | 回到衔接的基础号 |
| 术语不查 00 / 08 | 景别 / 轴线用错 | 图解 + 术语表 |
| 交叉任务只读一篇 | 单视角方案 | 映射表 2–3 篇 |

## 术语表

| 中文 | English | 说明 |
|---|---|---|
| 知识包 | Knowledge Bundle | 本目录下的 OKF 文档集 |
| 概念身份 | Concept ID | 路径去掉 `.md` |
| 规范文 | Canonical article | 重定向后的目标篇 |
| 基础篇 | Base layer | 工艺事实来源 |
| 综合篇 | Synthesis layer | 多轴融合 / 总设计 |
| 渐进披露 | Progressive disclosure | 先索引后全文 |
| 导航式检索 | Navigational retrieval | 按树走向，而非只向量搜 |

## 来源

- Open Knowledge Format v0.2（Google Cloud knowledge-catalog / okf）
- arXiv — Distilling Enterprise Knowledge into Navigable Agent Skills（2604.14572）：https://arxiv.org/html/2604.14572v3
- arXiv — AgenticRAG（2605.05538）：https://arxiv.org/html/2605.05538v1
- 本库：`knowledge/INDEX.md`、`knowledge/_meta/inventory.json`
