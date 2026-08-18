---
type: Reference
title: "动态分镜实操（Animatic 制作实战）"
description: "动态分镜实操手册：Animatic 定义、与分镜/Previs 的区别、七步制作流程、分类型重点（动画/广告/真人电影）、常见错误与 AI 时代的动态分镜工作流"
tags:
  - "foundation"
  - "storyboard"
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
  - resource: "cited:Storyflow 2026 完整指南"
    id: cite-1
    title: "Storyflow 2026 完整指南"
  - resource: "cited:Adobe"
    id: cite-2
    title: "Adobe"
  - resource: "cited:School of Motion"
    id: cite-3
    title: "School of Motion"
  - resource: "cited:AI 分镜工作流指南。"
    id: cite-4
    title: "AI 分镜工作流指南。"
  - resource: "https://storyflow.so/blog/what-is-an-animatic-complete-guide"
    id: url-1
    title: "storyflow.so"
  - resource: "https://www.adobe.com/uk/creativecloud/animation/discover/animatics.html"
    id: url-2
    title: "adobe.com"
  - resource: "https://mythlabs.co.uk/insights/how-to-make-an-animatic"
    id: url-3
    title: "mythlabs.co.uk"
  - resource: "https://www.moonb.io/blog/how-to-make-an-animatic"
    id: url-4
    title: "moonb.io"
  - resource: "https://www.schoolofmotion.com/blog/making-giants-the-edit"
    id: url-5
    title: "schoolofmotion.com"
  - resource: "https://aitoolsguidebook.com/zh/articles/ai-video-storyboard-workflow/"
    id: url-6
    title: "aitoolsguidebook.com"
dx_id: "35"
related:
  - "07-directing/directing-techniques.md"
  - "25-visualization-previz/visualization-previz.md"
  - "40-storyboard-generation/storyboard-generation.md"
---

# 动态分镜实操（Animatic 制作实战）

> 本页是 DirectorX 动态分镜实操手册：Animatic 定义、与分镜/Previs 的区别、七步制作流程、分类型重点（动画/广告/真人电影）、常见错误与 AI 时代的动态分镜工作流。
> 来源：Storyflow 2026 完整指南、Adobe、School of Motion、AI 分镜工作流指南。

## 概述

**Animatic（动态分镜）= 分镜 + 时间 + 声音**：把分镜静态帧按真实时长逐帧停驻，垫上草稿音轨（对白/临时音乐/关键音效），让序列以真实时间播放。

**核心价值**：分镜告诉你"镜头是什么"，Animatic 告诉你"**这个顺序和节奏是否成立**"——因为剪辑从此有了时钟。脑袋里的版本永远比时间线上的版本好，两者之间的差距，就是本来会在片场或剪辑三周后才发现的、代价高昂的问题。

**一句话定位**：Animatic 是场景开始花钱（一个拍摄日/几周动画）之前的**最后一次廉价草稿**；是"最便宜的失败场所"。

## 三种产物的区别（常被混淆）

| 产物 | 是什么 | 有时间？ | 有声？ | 最佳回答的问题 |
|---|---|---|---|---|
| 分镜 Storyboard | 每镜的静态帧 | 无 | 无 | 镜头是什么、怎么构图？ |
| 动态分镜 Animatic | 分镜帧按真实时长 + 草稿音轨 | 有 | 有 | 这个顺序和节奏成立吗？ |
| Previs | 粗略 3D 机位与走位 | 有 | 有时 | 镜头能去哪、物理上可行吗？ |

- 分镜是**空间性**的；Animatic 是**时间性**的；Previs 解决机位/走位可行性。
- 大多数项目需要分镜，很多受益于 Animatic，只有部分需要完整 Previs。

## Animatic 的四种成分（都不需要成品级）

1. **面板 Panels**：分镜帧，火柴人/灰框/箭头都行——粗糙完全够用。**"先画漂亮面板"是让 Animatic 失去廉价优势的头号错误**。
2. **时间 Timing**：每帧停驻真实时长（2 秒的远景停 2 秒，快切停 12 帧）——这是最常调整的东西。
3. **草稿音轨 Scratch Track**：任何人读的临时对白、参考曲目拉的临时配乐、两三个关键音效、占位旁白——不用干净，只需撑住画面所对的节奏。
4. **基础运动（可选）**：慢推、横摇、叠化转场。只有序列依赖运动才加——纯停驻版已经测出了最重要的东西：节奏。

## 七步制作流程（工具可变，步骤不变）

```
① 锁定分镜 → ② 估算每镜时长 → ③ 搭草稿音轨 → ④ 剪辑软件里按时长装配
→ ⑤ 对着声音看、找问题 → ⑥ 重定时/重剪/迭代 → ⑦ 锁定并交付
```

1. **先锁分镜**：没法给没画的帧定时。镜头与顺序先定成静态帧——序列总在变的定时是白费工。
2. **估算每镜时长**：逐面板定停驻秒数/帧数——这是对节奏的第一次诚实猜测，会"错得很有用"。
3. **搭草稿音轨**：录 scratch 对白、拉临时配乐、放两三个承重音效。
4. **编辑器装配**：Premiere / After Effects 中逐帧按估算时长停驻，草稿音轨垫在下面。
5. **对着声音看**：实时播放，感受哪里拖、哪里切早、哪个节拍没有呼吸——找到的问题就是全部回报。
6. **重定时迭代**：调整停驻、重排镜头、收紧/延展节拍，再放——价值大多在这一循环。
7. **锁定交付**：Animatic 成为拍摄/渲染/动画的参照基准。

工具分工：1-3 步是画布/规划工具（分镜板、镜头表、时间标注），4 步起是剪辑软件（Premiere/AE）——"哪一步在哪个工具里"是关键认知。

## 分类型重点

| 类型 | 定位 | 重点 |
|---|---|---|
| 动画 | 管线核心环节，非可选 | 动画太贵 → 整个剪辑在 Animatic 阶段锁定：粗板+时间+scratch 对白，先签时间再动一帧中间画 |
| 广告 | 卖片 + 拍前锁剪辑 | 客户签 Animatic = 保证拍摄产出"大家同意的那支片"；30 秒要精确时长与情绪节拍 |
| 真人电影 | 复杂序列专项 | 动作/VFX/特技/时机难在脑内保持的场景；简单对话场景用分镜+镜头表就够 |

## 何时做 / 何时跳过

**做**：序列搞错代价高——动画（每秒=数小时劳动）、广告（客户付拍摄日+精确时长）、复杂动作/VFX、靠时机活着的喜剧、任何音乐驱动的剪辑；需要"先卖序列再制作"时（对齐团队/客户签批/锁剪辑）。
**跳过/最小化**：代价低且拍摄灵活的——可便宜重拍的二人对话、还在现场发现故事的纪录片。

## 常见错误

1. **先画漂亮面板**：最常见最贵——打磨艺术浪费 Animatic 省下的时间，还让你舍不得剪该剪的镜头。
2. **跳过声音**：无声 Animatic 是幻灯片——画面与声音如何落地是成功的一半。
3. **猜时长而非诚实估算**：每帧等长/选"感觉好"的时长 = 自欺，目的就是发现真实节奏。
4. **当成品对待**：Animatic 的价值全在迭代循环——一遍过等于没做。

## AI 时代的动态分镜工作流（与 25/40 文档衔接）

1. 用 AI 分镜生成器产出分镜帧（40 文档工作流）；
2. 画布工具（如 Storyflow）排布序列：帧左→右、每帧下注时长/节拍/声音提示；
3. AI 检查节奏：让模型看整个序列的压力测试——标记过长的停驻、过早的揭示、给每帧起草 scratch 旁白；
4. 导出帧 → Premiere/AE 装配计时 + 草稿音轨（AI 配音可当 scratch，见 31 文档）；
5. 迭代锁定 → 每镜提示词进 AI 视频模型（34 文档八层框架，第 2 层"镜头标签"+ 第 7 层"时间"直接来自 Animatic）。

**AI 漫剧/短剧流水线特化**（中文生态）：脚本 → 分镜脚本 → 人物设计（一致性，见 39）→ 视频生成 → 剪辑 → 配音配乐；3 小时可出一条完整漫剧，关键在分镜阶段先排镜头（重生次数砍一半）。

## 术语表（中英对照）

| 中文 | English | 一句话定义 |
|---|---|---|
| 动态分镜 | Animatic | 分镜按时长停驻+草稿音轨 |
| 草稿音轨 | Scratch Track | 临时对白/配乐/音效 |
| 停驻 | Hold | 帧的屏幕时长 |
| 锁定 | Lock | 序列定稿 |
| 节拍 | Beat | 节奏单位 |
| 预览 | Previs | 粗略 3D 预演 |
| 承重音效 | Key SFX | 支撑序列的音效 |
| 重定时 | Retime | 调整停驻时长 |
| 画布规划 | Canvas Planning | 序列排布阶段 |
| 剪辑装配 | Editor Assembly | 计时剪辑阶段 |
| 签批 | Sign-off | 客户/团队确认 |
| 中间画 | In-between | 动画补间帧 |

## 来源

- Storyflow: What is an Animatic? The Complete Guide (2026) — https://storyflow.so/blog/what-is-an-animatic-complete-guide
- Adobe: What Are Animatics and How Can I Make Them? — https://www.adobe.com/uk/creativecloud/animation/discover/animatics.html
- Myth Labs: How to Make an Animatic: Complete Guide — https://mythlabs.co.uk/insights/how-to-make-an-animatic
- Moonb: How to Make an Animatic: A Producer's Guide — https://www.moonb.io/blog/how-to-make-an-animatic
- School of Motion: Making Giants — The Edit — https://www.schoolofmotion.com/blog/making-giants-the-edit
- AI 工具指南: AI 视频分镜工作流——先排镜头，重生次数砍一半 — https://aitoolsguidebook.com/zh/articles/ai-video-storyboard-workflow/
- SegmentFault: 3 小时生成完整 AI 漫剧，工作室高效批量流程 — https://segmentfault.com/a/1190000048051713

## 相关概念

- [导演技巧（Directing Techniques）](../07-directing/directing-techniques.md)
- [分镜与叙事可视化（Storyboarding & Visualization）](../25-visualization-previz/visualization-previz.md)
- [分镜图生成工作流（Storyboard-to-Video Pipeline）](../40-storyboard-generation/storyboard-generation.md)
