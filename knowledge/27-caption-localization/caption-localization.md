---
type: Reference
title: "字幕与本地化交付（Captions & Localization）"
description: "字幕本地化知识库：字幕时间规范（Netflix 标准）、字幕格式、阅读速度与断句、屏幕文字翻译（Forced Narrative）、视频本地化流程（字幕/配音/创译）、QC 与交付"
tags:
  - "foundation"
  - "sound"
  - "workflow"
  - "narrative"
status: stable
stale_after: "2027-08-18"
generated:
  by: "process:directorx-knowledge-okf"
  at: "2026-08-18T00:00:00Z"
verified:
  - by: "process:knowledge-audit"
    at: "2026-08-18T00:00:00Z"
sources:
  - resource: "cited:Netflix Timed Text 时间指南"
    id: cite-1
    title: "Netflix Timed Text 时间指南"
  - resource: "cited:W3C WAI 无障碍字幕"
    id: cite-2
    title: "W3C WAI 无障碍字幕"
  - resource: "cited:广电总局 对外译制规范"
    id: cite-3
    title: "对外译制规范"
    author: "org:广电总局"
  - resource: "cited:行业本地化工作流。"
    id: cite-4
    title: "行业本地化工作流。"
  - resource: "https://partnerhelp.netflixstudios.com/hc/en-us/articles/360051554394"
    id: url-1
    title: "partnerhelp.netflixstudios.com"
  - resource: "https://partnerhelp.netflixstudios.com/hc/en-us/articles/215986007"
    id: url-2
    title: "partnerhelp.netflixstudios.com"
  - resource: "https://www.w3.org/WAI/media/av/captions/"
    id: url-3
    title: "w3.org"
  - resource: "https://developer.mozilla.org/en-US/docs/Web/API/WebVTT_API/Web_Video_Text_Tracks_Format"
    id: url-4
    title: "developer.mozilla.org"
  - resource: "https://www.nrta.gov.cn/art/2022/9/29/art_3715_61974.html"
    id: url-5
    title: "nrta.gov.cn"
  - resource: "https://mediamenderz.com/services/localization/"
    id: url-6
    title: "mediamenderz.com"
dx_id: "27"
aliases:
  - "147"
related:
  - "13-genre-documentary/documentary-talking-head.md"
  - "172-shotlist-storyboard-animatic/shotlist-storyboard-animatic.md"
  - "337-total-world-design/total-world-design.md"
---

# 字幕与本地化交付（Captions & Localization）

> 本页是 DirectorX 字幕本地化知识库：字幕时间规范（Netflix 标准）、字幕格式、阅读速度与断句、屏幕文字翻译（Forced Narrative）、视频本地化流程（字幕/配音/创译）、QC 与交付。每个概念含参数与检查清单。**已合并 147（AI 本地化流程/配音/品牌声/成本对比）**——2026-08 去重整理。
> 来源：Netflix Timed Text 时间指南、W3C WAI 无障碍字幕、广电总局《对外译制规范》、行业本地化工作流。

## 概述

字幕（Subtitles/Captions）是视频的**第二叙事层**：对听力障碍者是必需的无障碍设施，对多语言观众是本地化通道，对短视频是留存工具（30%+ 静音观看）。

**核心目标（Netflix）**：让观众觉得"在看内容，不是在读字幕"——字幕要贴合剪辑、整齐、不剧透、读起来不费力。

**两条主线**：
1. **时间规范**：字幕与画面/音频/剪辑的同步纪律；
2. **本地化**：翻译-创译-配音的完整流程与质量把关。

## 字幕时间规范（Netflix Timed Text 核心规则）

### 1. 对齐音频（Timing to Audio）
- **入点（In-time）**：声音第一帧或尽可能接近（±1-2 帧内，以波形为参考）。
- **出点（Out-time）**：如果后面没有紧接字幕，出点应在音频结束后**至少半秒**（给阅读时间）——不要与对白结束同步。
- 半秒规则：24fps = 12 帧；30fps = 15 帧；60fps = 30 帧。

### 2. 对齐镜头切换（Timing to Shot Change）
- 对白在镜头切换处或其后半秒内开始 → 入点设为镜头切换第一帧。
- 出点距镜头切换半秒内 → 延长到镜头切换（保持 2 帧间隔）。
- **原则**：入点/出点可提前或延后到镜头边界（半秒参数内），让字幕"坐在剪辑里"。
- **字幕不应跨镜头切换**（除非对白本身跨）。

### 3. 最短时长
- 字幕最短 **20 帧（0.83 秒）**——只用于 1-2 个词；长字幕尽量延长。

### 4. 字幕间隔
- 相邻字幕**最少 2 帧**间隔；
- 24fps 下 3-11 帧的间隔必须**闭合到 2 帧**（"链式" chaining——延长前一条出点）；
- 间隔要么 2 帧、要么半秒以上——避免"闪烁感"。

### 5. 借时（Borrowing Time）
- 阅读速度不匀时，合并相邻字幕"借时间"，保持整体节奏均匀。

### 6. 屏幕文字翻译（Forced Narrative, FN）
- 翻译画面内文字（招牌/信件/字幕）→ **与屏幕文字完全同步**（淡入淡出则取渐变的中间点）；
- 屏幕文字持续整镜 → 出点定在镜头切换前 2 帧；
- 对白优先时，FN 可以提前出。

## 阅读速度与断句（Readability）

### 通用规范
- **阅读速度**：Netflix 约 15-20 字符/秒（拉丁文字）；中文约 12-16 字/秒（中文简繁指南另有细则）。
- **每屏行数**：最多 2 行（拉丁文约 42 字符/行；中文约 18-20 字/行）。
- **断句原则**：按语义单元断（名词短语/动词短语完整）；跨行保持可读（形容词+名词同留一行）。
- **时间-字数检查**：字数 ÷ 阅读速度 ≤ 字幕时长（否则分句或提速）。

### 中文特别规范（Netflix 中文简繁指南 + 广电译制规范）
- 中文每行上限约 18-20 字；标点用全角；
- 人名/地名音译一致性（先定译名表）；
- 语气词与感叹词按语境取舍；
- 避免逐字直译——中文更短，常需合并两条英文字幕。

### 无障碍字幕（Captions）
- 包含**非语言信息**：音效（[门铃]、[音乐渐强]）、说话者标识（[男声]）、语速/情绪提示（[低声]）。
- 位置：默认底部，不遮挡关键画面；W3C WAI 标准要求与音频同步、可读、不闪烁。

## 字幕格式

| 格式 | 类型 | 用途 |
|---|---|---|
| SRT | 文本+时间码 | 通用（平台上传） |
| WebVTT (.vtt) | 文本+时间码+样式 | Web 标准（含定位/样式） |
| ASS/SSA | 富样式（字体/位置/特效） | 硬字幕/爱好者社区 |
| TTML/IMSC1 | XML 行业标准 | Netflix/广播交付 |
| DFXP | XML | 广播 |
| 硬字幕 Burn-in | 烧录进画面 | 短视频（无法关闭） |

**软字幕 vs 硬字幕**：软字幕（外挂/可切换）利于无障碍与本地化；硬字幕保证"所有观众都看到"但不可切换——短视频常用硬字幕（见 05 文档）。

## 视频本地化流程（Localization Workflow）

### 全流程（Media Menderz / EGA 参考）
1. **转写（Transcription）**：源语言逐字稿 + 时间码；
2. **翻译（Translation）**：直译初稿；
3. **创译（Transcreation）**：按目标语言与文化的**再创作**——笑话、梗、双关、本地化表达（"看内容不是读字幕"的关键）；
4. **字幕化（Subtitling）**：按目标语言阅读速度重新断句/分屏/定时；
5. **配音（Dubbing）**（可选）：对白翻译需**对口型与时长**（lip-sync 适配）；选角/录音/混音（见 06/12 文档）；
6. **QC（质量检查）**：全片观看——时间/错别字/漏译/剧透/格式；
7. **交付**：按平台规格（格式/命名/编码）。

### 配音 vs 字幕选择
| | 字幕 | 配音 |
|---|---|---|
| 成本 | 低 | 高（10-20 倍） |
| 忠实度 | 高（原文可听） | 需适配口型（有改动） |
| 沉浸 | 阅读负担 | 高（本地语言） |
| 适用 | 多语言快速铺开、纪录片、专业术语多 | 儿童内容、喜剧、大众市场 |

### QC 检查清单
```
□ 全片观看一遍（不是抽查）
□ 入点/出点与音频/镜头切换合规（半秒规则）
□ 无 3-11 帧闪烁间隔（链式闭合）
□ 阅读速度符合目标语言标准
□ 无错别字/漏译/错译
□ 不剧透（笑点/反转不提前出现）
□ 屏幕文字（FN）与画面同步
□ 说话者标识与音效说明完整（无障碍）
□ 格式/编码/命名符合交付规格
□ 人名地名译名一致（译名表）
```

## 在 AI 视频生成中的应用

1. **AI 转写+翻译+字幕**：自动生成初稿 → 人做创译与 QC（AI 直译不够，梗与本地化必须人审）。
2. **AI 配音本地化**：AI 语音合成多语言配音（检查口型同步与情感）；注意平台政策与版权（见 23 文档）。
3. **字幕与画面配合**：短视频硬字幕按安全区与文字层规范（见 05/21 文档）。
4. **AI 字幕 QC**：AI 检查时间对齐/漏译/长度，人做最终判断。
5. **批量本地化**：一套成片批量出多语言字幕/配音（内容一致性由同一套 QC 保证）。

### AI 配音工作流补充（并入自 147：AI 本地化全流程）

**流程**：源视频 → 转录（ASR + 审校，转录错误会层层放大到翻译）→ 术语表约束翻译（保留语气）→ 多语言配音（音色克隆保持品牌声）→ 对口型（口播内容自动同步，→ 119）→ 字幕 → 文化适配（梗/禁忌/合规差异，→ 145）→ 平台格式输出（→ 112）。

**品牌声保持**：同一品牌多语言用同一音色克隆（声线一致 = 品牌资产，→ 137 数字人）。

**成本对比**：AI 本地化成本为传统人工配音的零头，且随语言数规模递增——多语言内容首选 AI 管线，但**人工审校不可省**（AI 直译不够，创译必须人审）。

## 常见错误

1. 出点与对白结束同步：没有阅读余量。
2. 字幕跨镜头切换：观感"跳"。
3. 3-11 帧闪烁间隔：视觉闪烁。
4. 阅读速度超标：观众跟不上。
5. 中文逐字直译：又长又生硬。
6. 无译名表：人名地名前后不一致。
7. 省略音效/说话者标识：无障碍失败。
8. 不 QC 全片：抽查漏掉的时间错误。
9. 笑话硬译：文化梗失效。

## 术语表（中英对照）

| 中文 | English | 一句话定义 |
|---|---|---|
| 字幕 | Subtitles | 对白文字 |
| 无障碍字幕 | Captions | 含音效/说话者标识 |
| 入点 | In-time | 字幕出现时刻 |
| 出点 | Out-time | 字幕消失时刻 |
| 半秒规则 | Half-second Rule | 音频后延半秒 |
| 链式闭合 | Chaining | 间隔闭合到 2 帧 |
| 最短时长 | Minimum Duration | 20 帧 |
| 借时 | Borrowing Time | 合并借阅读时间 |
| 屏幕文字翻译 | Forced Narrative | 画面内文字翻译 |
| 阅读速度 | Reading Speed | 字符/秒 |
| 断句 | Segmentation | 语义分行 |
| 转写 | Transcription | 逐字稿+时间码 |
| 翻译 | Translation | 直译 |
| 创译 | Transcreation | 文化再创作 |
| 配音 | Dubbing | 本地语言配音 |
| 译名表 | Name List | 译名一致性 |
| 硬字幕 | Burn-in | 烧录进画面 |
| 软字幕 | Soft Subtitles | 可切换外挂 |
| QC | Quality Control | 全片质检 |
| 本地化 | Localization | 多语言适配 |

## 来源

- Netflix Partner Help: Timed Text Style Guide — Subtitle Timing Guidelines — https://partnerhelp.netflixstudios.com/hc/en-us/articles/360051554394
- Netflix Partner Help: Chinese (Simplified) Timed Text Style Guide — https://partnerhelp.netflixstudios.com/hc/en-us/articles/215986007
- W3C WAI: Captions/Subtitles — https://www.w3.org/WAI/media/av/captions/
- MDN: WebVTT 格式 — https://developer.mozilla.org/en-US/docs/Web/API/WebVTT_API/Web_Video_Text_Tracks_Format
- 广电总局: GY/T 359—2022 广播电视和网络视听节目对外译制规范 — https://www.nrta.gov.cn/art/2022/9/29/art_3715_61974.html
- Media Menderz: End-to-End Localization（Dubbing/Subs/AD/QC） — https://mediamenderz.com/services/localization/
- SUBTLE: Recommended Quality Criteria for Subtitling — https://subtle-subtitlers.org.uk/wp-content/uploads/2023/01/SUBTLE-Recommended-Quality-Criteria-for-Subtitling.pdf

## 相关概念

- [纪录片与口播知识类（Documentary & Talking Head）](../13-genre-documentary/documentary-talking-head.md)
- [AI 分镜全链路（Previsualization Pipeline — Script → Shot List → Storyboard → Animatic）](../172-shotlist-storyboard-animatic/shotlist-storyboard-animatic.md)
- [AI 图片全整合世界设计（Total World Design — Image + Narrative + Audio Unified Series）](../337-total-world-design/total-world-design.md)
