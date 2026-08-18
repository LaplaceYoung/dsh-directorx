---
type: Reference
title: "灯光实操进阶与混合光（Advanced Lighting & Mixed-Light Balance）"
description: "灯光进阶手册：混合光匹配方法论（测 Kelvin+色偏、五步匹配流程）、gel 使用时机、CRI vs TLCI、调光漂移、主光源优先原则、便携 LED 与环境光融合、实景光处理案例"
tags:
  - "foundation"
  - "lighting"
  - "workflow"
status: stable
generated:
  by: "process:directorx-knowledge-okf"
  at: "2026-08-18T00:00:00Z"
verified:
  - by: "process:knowledge-audit"
    at: "2026-08-18T00:00:00Z"
sources:
  - resource: "cited:Maxima LED 混合光匹配"
    id: cite-1
    title: "Maxima LED 混合光匹配"
  - resource: "cited:Ulanzi 便携 LED 融合"
    id: cite-2
    title: "Ulanzi 便携 LED 融合"
  - resource: "cited:GVM 色温指南"
    id: cite-3
    title: "GVM 色温指南"
  - resource: "cited:豆瓣侯孝贤实景光案例。"
    id: cite-4
    title: "豆瓣侯孝贤实景光案例。"
  - resource: "https://maximaled.com/how-do-you-match-professional-bi-colour-lighting-to-mixed-practical-lights-on-set/"
    id: url-1
    title: "maximaled.com"
  - resource: "https://www.ulanzi.com/blogs/knowledges/blend-portable-leds-with-ambient-light-guide"
    id: url-2
    title: "ulanzi.com"
  - resource: "https://www.ulanzi.com/blogs/knowledges/led-color-temperature-drift-fix-workflows"
    id: url-3
    title: "ulanzi.com"
  - resource: "https://gvmled.com/color-temperature-video-filmmaking-guide/"
    id: url-4
    title: "gvmled.com"
  - resource: "https://www.provideocoalition.com/how-to-get-true-natural-light-from-leds/"
    id: url-5
    title: "provideocoalition.com"
  - resource: "https://site.douban.com/178720/widget/notes/10281080/note/501130297/"
    id: url-6
    title: "site.douban.com"
dx_id: "50"
related:
  - "13-genre-documentary/documentary-talking-head.md"
  - "19-live-production/live-production.md"
  - "57-hybrid-liveaction-ai/hybrid-liveaction-ai.md"
---

# 灯光实操进阶与混合光（Advanced Lighting & Mixed-Light Balance）

> 本页是 DirectorX 灯光进阶手册：混合光匹配方法论（测 Kelvin+色偏、五步匹配流程）、gel 使用时机、CRI vs TLCI、调光漂移、主光源优先原则、便携 LED 与环境光融合、实景光处理案例。与 09 灯光基础 / 36 调色 / 20 DaVinci 衔接。
> 来源：Maxima LED 混合光匹配、Ulanzi 便携 LED 融合、GVM 色温指南、豆瓣侯孝贤实景光案例。

## 概述

**核心问题**：主光 5600K、背景台灯 2800K——摄影机在同一帧里看到两个不同的世界：肤色偏移、背景发绿发橙，**再多的调色也无法完全修复多光源打架的场景**。修复不是调色，是在开拍前把灯具匹配到实景光。

**核心断言**：
1. 目标是让专业灯具在成片中"隐形"——观众分不清哪束光来自灯具、哪束来自实景灯；
2. 猜色温是代价高昂的：灯会老化、厂商公差各异、现实条件与实验室不同——**开拍前测量**；
3. **白平衡的修正不只在后期**——混合光现场处理好，后期才"可调"（→ 20 文档：Log 素材宽容度依赖现场光比）。

## 为什么混合光匹配难（光谱≠Kelvin）

- **同 Kelvin 不同光谱**：3200K 钨丝灯与 3200K LED 的光谱分布不同——一个连续偏暖，另一个可能有光谱缺口，改变色彩在摄影机上的呈现；
- **实景灯现实变量**：钨丝灯老化变暖；荧光/LED 实景灯带强绿或品红偏色，Kelvin 调整无法解决（tint 轴）；
- **混合场景多源并存**：钨丝台灯 + 头顶荧光 + 窗光 + 主光同时在场，每个光源都要单独测量处理。

## 现场五步匹配流程（双色 LED ↔ 实景光）

```
① 测实景：色度计对准实景光源，记录 Kelvin + tint（绿/品红偏移）
② 设灯具：双色 LED 调到测得 Kelvin
③ 对比测：同一色度计测灯具输出，与实景读数对比
④ 补 tint：有偏差 → 加 gel（±green）把灯具拉齐到实景
⑤ 过机验证：监视器校准白平衡为实景 Kelvin，通过镜头确认匹配
```

**过机验证是最可靠的确认**——人眼看着匹配，混合光下摄影机里可能完全不同；每次换灯位/调光/换景后复查（实景灯随升温/调暗漂移）。

## 工具清单

| 工具 | 用途 |
|---|---|
| 色度计（Sekonic C-700 类光谱仪） | 测 Kelvin + tint 双轴——**只测 Kelvin 的仪表不够** |
| 校色/±green gel 组 | 修正绿/品红轴与极端色温 |
| 双色 LED（2600-6800K 无级） | 暖到冷全程匹配 |
| 校准监视器/波形 | 过机验证 |

**无色度计救急**：固定白平衡为实景标称 Kelvin，边调灯具边看屏幕一致性——但抓不到 tint 轴，尽快配色度计。

## gel 的时机（不只调 Kelvin）

1. **tint 偏移**（荧光绿推）：−green gel——Kelvin 调不了品红/绿轴；
2. **超出双色范围**：<2700K 极暖钨丝——CTO gel 叠加在灯具最暖设置上延长范围；
3. **彩色实景**（霓虹/彩色灯泡）：双色灯无法复现，用彩色 gel 或 RGBWW 灯具；双色灯仍可用于管理画面中性区域的白色平衡。

## 主光源优先原则（多实景冲突时）

- 找到**主导实景**（画面中最显眼/作为主光动机的那个），双色灯具匹配它；
- 次级冲突实景：换彩色校正灯泡 / 直接给灯罩加 gel / **构图排除**；
- **在两个不匹配实景之间取折中几乎总失败**——画面全程都怪。

## 调光与漂移

- 优质双色 LED 数字调光**不漂移**；廉价灯具低输出会偏色——**在计划用到的实际强度下测量**，不是满功率测；
- 钨丝实景灯调暗会**变暖**——按工作强度测量实景灯，再匹配灯具；
- 复查习惯：任何灯光元素变化后（移灯/调暗/换泡/自然光变化/长休息后）快速过机检查——钨丝灯一天内会从早到晚漂移。

## 便携 LED 与环境光融合（Ulanzi 单兵向）

- **混合色温意图化**：小 LED 不追求压过环境，而是**补光动机**——把 LED 调到与窗光/台灯同色温，做"环境光的延伸"；
- **柔化优先**：便携灯小 → 光硬 → 用柔光箱/白墙反射放大光源面积；
- **光比控制**：环境光为主体，LED 只加 0.3-1 档（否则环境感消失）；
- **色温漂移修复**：廉价 LED 偏绿/偏品——现场加 gel 修正，别指望后期统一（→ 36 文档）。

## 实景光美学案例（侯孝贤《红气球之旅》）

- 实景光处理=保留实景灯的真实性，同时让演员脸"可读"——灯光服务于"人在真实空间里"的质感；
- 做法：以实景灯为动机，灯具只做**增强与补足**，不改变光源逻辑——观众信服"这里本来就这么亮"；
- 启示（→ 45 Look Stack）：实景光处理是"光线层"与"质感层"的统一。

## 常见错误

1. 只看 Kelvin 数字不测 tint：荧光绿推毁掉肤色。
2. 不过机验证：眼睛匹配 ≠ 摄影机匹配。
3. 一次匹配终身有效：实景灯漂移（升温/调暗）——中途复查。
4. 两个冲突实景取折中：全程都怪——主光源优先+排除/换泡。
5. 双色灯试图复现霓虹/彩灯：用 gel/RGBWW。
6. 廉价灯低输出偏色不测：肤色在暗部翻绿。
7. 便携灯硬光直打：环境感消失。

## 术语表（中英对照）

| 中文 | English | 一句话定义 |
|---|---|---|
| 混合光 | Mixed Lighting | 多色温并存的场景 |
| 实景光 | Practical Light | 画面内真实光源 |
| 色度计 | Color Meter | 测 Kelvin+tint |
| 色偏轴 | Tint Axis | 绿/品红偏移 |
| 双色 LED | Bi-colour LED | 暖冷可调灯 |
| 减绿 | Minus Green | 抵消荧光绿 |
| 显色指数 | CRI | 人眼显色评价 |
| 电视照明一致指数 | TLCI | 摄影机显色评价 |
| 过机验证 | Through-Camera Check | 镜头内确认 |
| 主光源优先 | Dominant Practical Rule | 匹配主导源 |
| 光比 | Light Ratio | 主光/环境比 |
| 调光漂移 | Dimming Drift | 低输出偏色 |

## 来源

- Maxima LED: How Do You Match Professional Bi-colour Lighting to Mixed Practical Lights on Set? — https://maximaled.com/how-do-you-match-professional-bi-colour-lighting-to-mixed-practical-lights-on-set/
- Ulanzi: Blend Portable LEDs with Ambient Light — https://www.ulanzi.com/blogs/knowledges/blend-portable-leds-with-ambient-light-guide
- Ulanzi: Fix LED Color Temperature Drift — Pro Workflows — https://www.ulanzi.com/blogs/knowledges/led-color-temperature-drift-fix-workflows
- GVM: Color Temperature for Video — The Filmmaker's Complete Guide — https://gvmled.com/color-temperature-video-filmmaking-guide/
- ProVideo Coalition: How to Get TRUE "Natural Light" from LEDs — https://www.provideocoalition.com/how-to-get-true-natural-light-from-leds/
- 豆瓣: 侯孝贤《红气球之旅》实景光线处理 — https://site.douban.com/178720/widget/notes/10281080/note/501130297/
- noiz.ai: 2026 最佳视频制作灯光指南——专业布局与设备技巧 — https://noiz.ai/use-cases/zh-Hans/article/guide-to-the-best-lighting-for-video-production-2026

## 相关概念

- [纪录片与口播知识类（Documentary & Talking Head）](../13-genre-documentary/documentary-talking-head.md)
- [直播与实时制作（Live Production）](../19-live-production/live-production.md)
- [真人+AI 混合制作工作流（Hybrid Live-Action & AI Production）](../57-hybrid-liveaction-ai/hybrid-liveaction-ai.md)
