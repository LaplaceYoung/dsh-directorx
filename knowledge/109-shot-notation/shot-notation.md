---
type: Reference
title: "镜头描述与场记规范（Shot List & Continuity Notation — Terms & Practice）"
description: "本页知识本体来自真实影视制作的镜头表（Shot List）与场记（Continuity）制度：逐镜记录景别、角度、运动、镜头、光照、音频、演员与连续性的标准字段"
tags:
  - "production"
  - "camera"
  - "sound"
  - "continuity"
status: stable
stale_after: "2027-08-18"
generated:
  by: "process:directorx-knowledge-okf"
  at: "2026-08-18T00:00:00Z"
verified:
  - by: "process:knowledge-audit"
    at: "2026-08-18T00:00:00Z"
sources:
  - resource: "cited:LTX Shot List Template"
    id: cite-1
    title: "Shot List Template"
    author: "org:LTX"
  - resource: "cited:Storyblocks Video Shot List Template"
    id: cite-2
    title: "Video Shot List Template"
    author: "org:Storyblocks"
  - resource: "cited:Epidemic Sound What is a Shot List"
    id: cite-3
    title: "What is a Shot List"
    author: "org:Epidemic-Sound"
  - resource: "cited:TechSmith How to Write a Shot List"
    id: cite-4
    title: "How to Write a Shot List"
    author: "org:TechSmith"
  - resource: "cited:Boords Free Shot List Template 2026"
    id: cite-5
    title: "Free Shot List Template 2026"
    author: "org:Boords"
  - resource: "https://ltx.io/blog/shot-list-template"
    id: url-1
    title: "ltx.io"
  - resource: "https://www.storyblocks.com/resources/blog/video-shot-list-template"
    id: url-2
    title: "storyblocks.com"
  - resource: "https://www.epidemicsound.com/blog/what-is-a-shot-list/"
    id: url-3
    title: "epidemicsound.com"
  - resource: "https://www.techsmith.com/blog/how-to-write-a-shot-list/"
    id: url-4
    title: "techsmith.com"
  - resource: "https://boords.com/shot-list-template"
    id: url-5
    title: "boords.com"
dx_id: "109"
related:
  - "69-ai-performance-control/ai-performance-control.md"
  - "70-on-camera-acting/on-camera-acting.md"
  - "86-storyboard-drawing/storyboard-drawing.md"
---

# 镜头描述与场记规范（Shot List & Continuity Notation — Terms & Practice）

> 本页知识本体来自真实影视制作的镜头表（Shot List）与场记（Continuity）制度：逐镜记录景别、角度、运动、镜头、光照、音频、演员与连续性的标准字段。AI 应用面向 DirectorX：镜头表是"足够详细的镜头描述"的行业标准格式——生成前逐镜细化 = 把镜头表填满（案例 3 分镜阶段与案例 4 逐镜设计的直接依据）。
> 来源：LTX「Shot List Template」、Storyblocks「Video Shot List Template」、Epidemic Sound「What is a Shot List」、TechSmith「How to Write a Shot List」、Boords「Free Shot List Template 2026」。

## 概述

**核心断言**：镜头表（Shot List）是拍摄现场的**执行蓝本**——它把剧本拆成可逐条拍摄的镜头，每条记录"拍什么、怎么拍、用什么"的全部决定。**一份填满的镜头表 = 导演对每一镜的完整描述**。这正是"生成前必须有足够详细的文本参考"的行业定义。

**场记（Script Supervisor）的职责**：逐镜记录连续性（场景/姿势/道具/服装/表演顺序），确保跨镜剪辑时不出戏——AI 生成视频的"连续性对照"与场记同理。

## 核心概念

### 镜头表字段（核心 11 项 + 可选）

**核心字段**（每镜必填）：

| 字段 | 说明 | 示例 |
|---|---|---|
| 场次/镜号 | Scene / Shot Number | Scene 03, Shot 01 |
| 景别（Shot Size） | WS/MS/CU/ECU | WS（远景） |
| 描述（Description） | 画面内容一句话 | 演员推门进入拥挤房间 |
| 角度（Angle） | 平视/俯/仰 | 微俯角 |
| 运动（Movement） | 静态/推/拉/摇/移/手持 | 左摇（Pan left） |
| 镜头（Lens） | 焦距 | 24mm |
| 机位/器械（Rig） | 三脚架/轨道/手持/斯坦尼康 | 轨道 |
| 光照（Lighting） | 主光/补光/无补 | 主光 + 环境 |
| 音频（Audio） | 现场收音/领夹/无（MOS） | 领夹麦 |
| 演员/道具（Talent/Props） | 出场者与关键道具 | 主角 + 行李箱 |
| 导演/摄影笔记 | 备注 | 需反应镜头参考 |

**可选字段**：地点、时间、条数（Take）、板号（Slate）、连续性笔记、情绪/基调、VFX 提示、安全提示（QSC）。

### 记号惯例

- 景别：WS（远景）/ MS（中景）/ CU（特写）/ ECU（大特写）
- 运动：Static / Pan / Tilt / Dolly / Zoom / Handheld / Crane
- 角度：Eye-level / High angle / Low angle / Dutch
- 音频：MOS（无同期声）/ On-set mic / Lav

## 技巧与示例

### 真实镜头表示例（LTX 格式）

```
Shot 01 – Scene 03 | WS | 远景 | 平视 | 左摇 | 24mm | 轨道 | 主光
  描述：主角推门进入，房间显得拥挤（安全框：空间感）
  音频：现场收音 | 演员：主角 | 笔记：开场空间建立

Shot 02 – Scene 03 | MS | 中景 | 微俯 | 静态 | 50mm | 手持 | 补光
  描述：主角环视房间，表情放松
  音频：领夹麦 | 演员：主角 | 笔记：接反应镜头
```

### 场记（Script Supervisor）的连续性记录

逐镜记录并核对：场景/姿势/动作顺序/道具位置/服装状态/表演情绪——AI 视频生成的"连续性对照"（身份/道具/服装/轴线上一致）就是场记职责的自动化。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 镜头表只有"画面内容"没有景别/运动 | 现场各人理解不一 | 核心 11 字段填满 |
| 不标镜号 | 现场无法调度 | 场次/镜号唯一编码 |
| 忽略连续性记录 | 跨镜穿帮 | 场记逐镜对照 |
| 描述用模糊形容词 | 无法执行 | 可观察的画面事实 |
| 不记音频方案 | 后期缺声 | 每镜标注收音方式 |

## 工作流应用（AI 映射）

**镜头表 = AI 逐镜提示词的骨架**：把真实镜头表字段直接翻译为生成提示词结构：

```text
镜头表字段 → 提示词段
  Scene/Shot  → 镜号（输出契约）
  Shot Size   → 景别（近景/中景/特写）
  Angle       → 机位角度
  Movement    → 运镜（静态/推/摇）
  Lens        → 焦距感（广角/长焦）
  Lighting    → 光向与质感
  Description → 主体动作 + 场景状态（可观察事实）
  Audio       → 音频提示（MOS = 无音频/环境声）
```

**生成门控定义**：一个镜头描述"足够详细"的标准 = 镜头表核心字段齐全（景别/角度/运动/光照/主体动作/场景状态），不含模糊形容词。这直接实现「生成前必须有足够详细的文本参考」。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 镜头表 | Shot List | 逐镜执行蓝本 |
| 场记 | Script Supervisor | 连续性记录者 |
| 景别 | Shot Size（WS/MS/CU/ECU） | 画面取景范围 |
| 运镜 | Camera Movement | 推/拉/摇/移/手持 |
| 机位角度 | Camera Angle | 平/俯/仰/斜 |
| 镜头焦距 | Lens（mm） | 视角与透视 |
| 无同期声 | MOS | 拍摄时不录音 |
| 连续性 | Continuity | 跨镜一致性 |
| 板号 | Slate | 场记板标识 |
| 安全框 | Safe Frame | 构图安全区 |

## 来源

- LTX — Shot List Template: Example For Film & Video Production：https://ltx.io/blog/shot-list-template
- Storyblocks — How to Organize Your Projects with a Video Shot List：https://www.storyblocks.com/resources/blog/video-shot-list-template
- Epidemic Sound — What is a Shot List：https://www.epidemicsound.com/blog/what-is-a-shot-list/
- TechSmith — The Essential Guide To Writing Shot Lists：https://www.techsmith.com/blog/how-to-write-a-shot-list/
- Boords — Free Shot List Template (2026)：https://boords.com/shot-list-template

## 相关概念

- [AI 角色表演控制（AI Performance Direction）](../69-ai-performance-control/ai-performance-control.md)
- [镜头前表演指导（Directing Performances On Camera）](../70-on-camera-acting/on-camera-acting.md)
- [分镜绘制技巧（Storyboard Drawing & Notation）](../86-storyboard-drawing/storyboard-drawing.md)
