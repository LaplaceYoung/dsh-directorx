---
type: Reference
title: "视频创作灵感系统（Idea-to-Script Creative System）"
description: "创作灵感系统手册：参考视频起步法（粘贴→分析→差异化概念）、灵感管线（选题→脚本→场景计划→视觉）、现场审批闸门（Backlot 模式）、概念-成本-可行性三件套、开源创作 Agent 生态、灵感库建设"
tags:
  - "production"
  - "workflow"
status: stable
stale_after: "2027-08-18"
generated:
  by: "process:directorx-knowledge-okf"
  at: "2026-08-18T00:00:00Z"
verified:
  - by: "process:knowledge-audit"
    at: "2026-08-18T00:00:00Z"
sources:
  - resource: "cited:OpenMontage（开源 Agent 视频生产系统）"
    id: cite-1
    title: "OpenMontage（开源 Agent 视频生产系统）"
  - resource: "cited:shortform-idea-engine"
    id: cite-2
    title: "shortform-idea-engine"
  - resource: "cited:TrendCut-Studio"
    id: cite-3
    title: "TrendCut-Studio"
  - resource: "cited:Hermes+Remotion 管线。"
    id: cite-4
    title: "Hermes+Remotion 管线。"
  - resource: "https://dev.to/vivek_shetye/build-an-end-to-end-ai-video-production-pipeline-with-hermes-agent-and-remotion-183i"
    id: url-1
    title: "dev.to"
dx_id: "77"
related:
  - "07-directing/directing-techniques.md"
  - "08-workflow-glossary/production-workflow-glossary.md"
  - "13-genre-documentary/documentary-talking-head.md"
---

# 视频创作灵感系统（Idea-to-Script Creative System）

> 本页是 DirectorX 创作灵感系统手册：参考视频起步法（粘贴→分析→差异化概念）、灵感管线（选题→脚本→场景计划→视觉）、现场审批闸门（Backlot 模式）、概念-成本-可行性三件套、开源创作 Agent 生态、灵感库建设。与 58 内容矩阵 / 63 文案协同 / 66 编剧衔接。
> 来源：OpenMontage（开源 Agent 视频生产系统）、shortform-idea-engine、TrendCut-Studio、Hermes+Remotion 管线。

## 概述

**核心断言**：从参考视频起步常常比从空白提示词起步更快——"给我做一个像这样、但是关于量子计算的"。把 AI 编码助手变成完整视频制作工作室：研究、脚本、资产生成、剪辑、最终合成一步到位。

**2026 开源生态**（OpenMontage：12 条生产管线、100+ 工具、700+ 技能文件）：
- **真视频**（非"动几帧图"）：Agent 从免费素材库/开放档案构建语料→检索真实运动片段→编辑进时间轴→渲染成片；
- **成本革命**：60 秒 Pixar 风短片 **$1.33**（6 个 Kling 片段+配音+音乐+逐词字幕）；70 秒历史挽歌 **$0.02**；产品广告 **$0.69**（单 API key 全自动）。

## 参考视频起步法（最快灵感路径）

```
① 粘贴参考视频（YouTube/Short/Reel/TikTok/本地片段）
② Agent 分析：转录、节奏、场景、关键帧、风格
③ 产出 2-3 个差异化概念 + 诚实工具路径 + 成本估算 + 样本
```

**输出不是"猜测式提示词面条"**，而是：
- **保留什么**：节奏、钩子风格、结构、基调；
- **改变什么**：主题、视觉处理、角度、旁白方式；
- **花费多少**：目标时长下的成本，资产生成前就报；
- **会是什么样**：基于现有工具的预演。

**示例指令**："Here's a YouTube Short I love. Make me something like this, but about quantum computing."

## 灵感管线（概念→成片五阶段）

```
概念 → 脚本 → 场景计划 → 资产生成 → 合成渲染
```

- **概念阶段**：2-3 个差异化方向（保留/改变矩阵）；
- **脚本阶段**：落成剧本页（→ 66 编剧方法论/03 节奏）；
- **场景计划**：场景卡（每卡：描述/镜头/资产需求）；
- **资产生成**：逐场景联系表（takes、提示词、单资产成本、质量分）；
- **合成渲染**：Remotion 类编排引擎（程序化合成）。

## 现场审批闸门（Backlot 模式——制作可视化管理）

- **现场故事板**：管线运行时自动填充的本地看板——阶段点亮、剧本落页、场景卡在资产生成时闪烁、每笔花费上墙；
- **故事板=真实审批闸门**：资产生成在**逐场景联系表**处暂停（takes/提示词/单资产成本/质量分）——**渲染前批准视觉**，而不是事后才发现；
- **创作闸门**：脚本闸门等待你的回答——看板显示在等什么、为什么；
- **回放**：整个制作按时间戳回放，可逐帧拖动——复盘与教学。

**意义**：把"生成-检查-返工"循环变成"计划-批准-渲染"——人工干预点在创意决策处，不在意外处（→ 40 人工审查点同构）。

## 概念-成本-可行性三件套（每条灵感必答）

1. **概念**：保留/改变矩阵（结构复用+主题替换）；
2. **成本**：目标时长下的资产成本估算（API 单价×镜头数×重生成率）；
3. **可行性**：现有工具能否产出"会是什么样"——诚实工具路径，不画饼。

## 开源创作 Agent 生态（灵感系统组件）

| 项目 | 定位 |
|---|---|
| OpenMontage | 全栈 Agent 视频生产（管线/技能/看板） |
| TheMattBerman/shortform-idea-engine | 短内容灵感引擎 |
| TrendCut-Studio | 趋势捕捉→剪辑 |
| ViralForge | 爆款锻造（选题→脚本） |
| OpenReels | Reels 生成 |
| Hermes + Remotion 管线 | 端到端 AI 视频流水线 |

## 灵感库建设（个人系统）

- **参考视频库**：按结构类型归档（钩子式/演示式/故事式）——每支标注可复用机制（→ 56 赢家机制同构）；
- **灵感→概念模板**：`[参考结构] + [新主题] + [新角度]`——30 秒生成概念候选；
- **场景卡模板**：描述/镜头语言/资产需求/预算——概念直接进生产（→ 48 JSON 契约衔接）；
- **成本账本**：每次生产记录实际成本——校准估算模型（→ 41 生产健康指标）。

## 常见错误

1. 从空白提示词起步：参考视频起步快 10 倍。
2. 概念无差异化矩阵：换皮不换骨。
3. 渲染后才看视觉：返工——用审批闸门。
4. 无成本估算：预算失控。
5. 灵感不归档：机制不沉淀。
6. 一次性生产：管线不可复用。
7. 人工干预点错位：在意外处救火。

## 术语表（中英对照）

| 中文 | English | 一句话定义 |
|---|---|---|
| 参考起步 | Reference-First | 从已有视频出发 |
| 保留/改变矩阵 | Keep/Change Matrix | 结构复用+主题替换 |
| 场景卡 | Scene Card | 单场景生产单元 |
| 联系表 | Contact Sheet | takes+成本+质量 |
| 审批闸门 | Approval Gate | 渲染前批准 |
| 现场看板 | Live Board | 生产可视化 |
| 回放运行 | Replay Run | 时间戳复盘 |
| 工具路径 | Tool Path | 诚实可行性 |
| 灵感引擎 | Idea Engine | 概念批量产出 |
| 语料构建 | Corpus Building | 素材库检索 |
| 程序化合成 | Procedural Composition | 代码编排成片 |
| 成本账本 | Cost Ledger | 实际花费记录 |

## 来源

- GitHub: calesthio/OpenMontage（开源 Agent 视频生产系统：12 管线/700+ 技能/Backlot 看板） — 
- GitHub: TheMattBerman/shortform-idea-engine — 
- GitHub: HQAmenghen/TrendCut-Studio — 
- GitHub: techknowmadlabs/ViralForge — 
- GitHub: tsensei/OpenReels — 
- DEV Community: Build an End-to-End AI Video Production Pipeline with Hermes Agent and Remotion — https://dev.to/vivek_shetye/build-an-end-to-end-ai-video-production-pipeline-with-hermes-agent-and-remotion-183i
- GitHub: renmengwen/MuseDock — 
- GitHub: nanxingw/AutoViral —

## 相关概念

- [导演技巧（Directing Techniques）](../07-directing/directing-techniques.md)
- [影视制作全流程与术语大全（Production Workflow & Glossary）](../08-workflow-glossary/production-workflow-glossary.md)
- [纪录片与口播知识类（Documentary & Talking Head）](../13-genre-documentary/documentary-talking-head.md)
