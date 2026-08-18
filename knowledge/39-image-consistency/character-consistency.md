---
type: Method
title: "图片一致性控制（Character & Visual Consistency）"
description: "一致性控制手册：漂移原理、五种方法对比与选择、各工具一致性方案（MJ/Veo/Kling/ComfyUI）、端到端管线（角色设计→转面图→锁定→图生视频）、图生视频漂移的四个雷区"
tags:
  - "foundation"
  - "model"
  - "character"
  - "workflow"
  - "continuity"
  - "i2v"
  - "image"
status: stable
stale_after: "2027-08-18"
generated:
  by: "process:directorx-knowledge-okf"
  at: "2026-08-18T00:00:00Z"
verified:
  - by: "process:knowledge-audit"
    at: "2026-08-18T00:00:00Z"
sources:
  - resource: "cited:Flick 2026 角色一致性完整指南"
    id: cite-1
    title: "Flick 2026 角色一致性完整指南"
  - resource: "cited:Apatero LoRA+IP-Adapter 栈"
    id: cite-2
    title: "Apatero LoRA+IP-Adapter 栈"
  - resource: "cited:NWTIA 五方法对比"
    id: cite-3
    title: "NWTIA 五方法对比"
  - resource: "cited:AI 工具指南中文实践。"
    id: cite-4
    title: "AI 工具指南中文实践。"
  - resource: "https://flick.art/blog/img2img-consistent-character"
    id: url-1
    title: "flick.art"
  - resource: "https://nowaythisisai.com/blog/character-consistency-fictional-characters-mid-2026"
    id: url-2
    title: "nowaythisisai.com"
  - resource: "https://apatero.com/blog/comfyui-character-consistency-advanced-workflows-2026"
    id: url-3
    title: "apatero.com"
  - resource: "https://apatero.ai/blog/lora-ipadapter-stack-95-percent-consistency"
    id: url-4
    title: "apatero.ai"
  - resource: "https://getimg.ai/blog/how-to-create-consistent-characters-with-ai"
    id: url-5
    title: "getimg.ai"
  - resource: "https://www.picovix.app/blog/consistent-character-stable-diffusion"
    id: url-6
    title: "picovix.app"
dx_id: "39"
related:
  - "14-ai-video-generation/ai-video-generation.md"
  - "45-style-unification/style-unification.md"
  - "48-ai-drama-studio/ai-drama-studio.md"
---

# 图片一致性控制（Character & Visual Consistency）

> 本页是 DirectorX 一致性控制手册：漂移原理、五种方法对比与选择、各工具一致性方案（MJ/Veo/Kling/ComfyUI）、端到端管线（角色设计→转面图→锁定→图生视频）、图生视频漂移的四个雷区。
> 来源：Flick 2026 角色一致性完整指南、Apatero LoRA+IP-Adapter 栈、NWTIA 五方法对比、AI 工具指南中文实践。

## 概述

**一致性 = 在不同场景/角度/镜头中保持同一角色的精确视觉身份**。与其每次用文字重新描述角色，不如给模型一张参考图，让它每镜匹配脸、发型、服装。

**漂移（Character Drift）**是 AI 电影制作中最普遍的难题——为什么发生：
1. 扩散模型每次从**随机噪声**开始逐步去噪；
2. 提示词"蓄着胡子的三十多岁男人"匹配训练数据里数百万张脸——输出是**整个可能性空间里的平均脸**，不是某个人；
3. 即使完全复用同一提示词，每次生成的起点不同 → 结果落在空间中略有不同的点；
4. 新角度、新角色、新背景的提示词微调会**放大**这种偏差——镜头累积下来，角色就漂成了另一个人。

**2026 默认工作流**：先在单张参考图中锁定身份，每镜复用该参考——比纯提示词更一致、更精确、更可靠。

## 五种方法对比与选择

| 方法 | 原理 | 适合 | 工作量 | 一致性 |
|---|---|---|---|---|
| 角色参考 Character Reference (img2img) | 上传一张参考图，模型在新场景匹配身份 | 几乎所有人——最快路径 | 低 | 高 |
| 转面图 Turnaround Sheet | 生成正/侧/背/四分之三视图做多角度参考 | 给图生视频提供角度与运动上下文 | 低-中 | 高 |
| 提示词复用 Prompting | 同 seed + 逐字角色描述跨代复用 | 单一外观的快速变体 | 低 | 中 |
| LoRA 训练 | 用 15-50 张角色图训练小型自定义模型 | 数百镜头、近零漂移 | 高 | 极高 |
| 换脸 Face Swap（事后修补） | 先自由生成，再把角色脸换到每帧 | 事后修复漂移 | 中 | 高（仅脸部） |

**选择逻辑**：想要零学习成本 → Character Reference；要跨镜头角度 → 转面图；要整片级稳定 → LoRA（Wan 2.2 训练 50+ 张效果最佳）；已生成完但要修脸 → Face Swap。

## 各工具一致性方案

| 工具 | 机制 | 要点 |
|---|---|---|
| Midjourney | Omni Reference（--oref）+ 权重（--ow） | 默认 100；改角色细节时降低权重；会软化雀斑/纹身等细节 |
| Veo 3 / 3.1 | Ingredients to Video 参考系统 | 喂参考图锁身份；**每镜用完全相同的角色描述**；原生同步音频+口型 |
| Kling 3.0 | Omni Reference + Elements | 单个 Element 最多挂 7 张角色参考，每镜 @ 提及；声音绑定（→ 34 文档） |
| Seedance 2.0 | Reference to Video + 提及系统 | @Image1 指认首帧、@Image2-4 指认角色外观、@Audio1 指认对白 |
| ComfyUI | PuLID + InstantID + IP-Adapter + LoRA 叠加 | 最高控制：零漂移本地生成，最技术化 |
| GPT Image 2 / Nano Banana Pro | 组合构图草图+角色参考+服装参考 | 三路参考分离：构图/脸/服装各管各 |

**ComfyUI 叠加栈**（Apatero，一致性 ~95%）：角色 LoRA（身份）+ IP-Adapter（服装/风格参考）+ PuLID/InstantID（面部锁定）+ ControlNet（姿态）——每层各管一个维度，叠加出完整控制。

## 端到端管线（角色设计 → 成片）

```
① 设计角色：生成一张你爱的强人像
② 建参考集：转面图（正/侧/背/3/4）+ 不同服装/道具/表情的参考
③ 锁参考：每镜生成都挂角色参考，提示词专注场景与动作
④ 从静帧动画化：锁定图 → 图生视频
⑤ 剪辑调色：视频编辑器装配成片
```
**铁律：先在静止图像里锚定身份，再动画化它。**

### 进阶：构图草图两步法（Flick 片厂实践）
1. **第一步生成构图草图**：用文字生成一张"粗略线稿"（只定构图/环境/光线，细节勿多）；
2. **第二步生成最终帧**：把草图（唯一构图参考）+ 侧脸参考（唯一脸/发型参考）+ 全身参考（唯一服装参考）三路同时输入，提示词逐路声明"100% 匹配"。
多一步生成，换来构图与身份的**双重精确**。

## 图生视频的一致性雷区（从静帧到视频的四大崩点）

1. **帧间漂移**：头部转离再转回时脸变形——转面图提供多角度上下文是最佳防线；
2. **侧面/背面崩坏**：参考系统多训练于正面——角色转 3/4 或全侧时参考失效；
3. **服装/道具漂移**：图生视频模型优先保脸，服装受关注少——**在参考静帧中锁定服装**并在提示词中强化；
4. **长度限制与链式拼接**：单次 5-15 秒——长镜头需"抽尾帧→作下一段首帧"链式生成，**每一跳都是新的漂移机会**。

## 实战提示词模板

**转面图**（单参考 → 三视图）：
> Use the provided image as the exact character reference. Create a character design turnaround sheet of [角色描述]... Show three full-body views arranged side by side: front view, pure side view, and 3/4 side view. Preserve the costume design exactly as in the reference image... The only transformation is the visual medium: [风格]. Neutral plain background, soft even lighting, full body visible, highly readable costume design sheet.

**锁定最终帧**（草图+脸+服装三路参考）：
> Use the provided sketch as the only composition reference. Use the provided side-profile reference as the only face and hair reference. Use the provided full-body reference as the only outfit reference. Create a live-action photograph of [角色名]. Composition 100% match the sketch; identity, facial contour, skin tone, eyes, hairstyle 100% match the side-profile reference; outfit 100% match the full-body reference. [环境/光线/镜头语言]. Preserve realistic skin texture, visible pores, subtle film grain, natural imperfect real-camera rendering.

**短提示词原理**（Seedance 提及系统）：信息尽量放在参考图里，提示词只做"指派"——
> Take @Image1 as the start frame. Reference Serana's appearance from @Image2, @Image3 and @Image4. Handheld camera style, Serana walks into frame from lower left, stretches as she walks, and speaks @Audio1.

## 在视频制作工作流中的应用

1. **AI 漫剧/短剧**：人物一致性 = 追剧体验的生命线——参考图 + 转面图是中文生态最简方案（SegmentFault 保姆级实践）；
2. **产品一致性**：产品目录渲染用 IP-Adapter + LoRA（同款商品穿在不同 AI 模特身上）；
3. **场景一致性**：地点跨镜头复用"场景参考图"（与角色参考并列的第二参考通道）；
4. **风格一致性**：--sref / 风格参考图统一整片的色彩与美术（→ 36/28 文档）。

## 常见错误

1. 纯文字描述角色跨镜：必然漂移（平均脸空间）。
2. 只锁正脸参考：转侧面即崩。
3. 每镜微调角色描述：放大漂移。
4. 服装不锁：镜头间换装。
5. 长镜头一次生成：超限降质——链式拼接并防漂移。
6. 参考图太糊/太暗/非正面：参考质量决定一致性上限（干净、明亮、正面的肖像最优）。
7. 不做转面图就上视频模型：角度上下文缺失。

## 术语表（中英对照）

| 中文 | English | 一句话定义 |
|---|---|---|
| 漂移 | Character Drift | 身份跨镜流失 |
| 角色参考 | Character Reference | 单图身份锚定 |
| 转面图 | Turnaround Sheet | 多角度参考集 |
| 通用参考 | Omni Reference | 全维度参考图 |
| 提及系统 | Mentions | @图/音频指派 |
| 视觉 DNA | Visual DNA | Kling 身份档案 |
| 成分参考 | Ingredients | Veo 参考系统 |
| 姿态控制 | ControlNet/Pose | 动作骨架约束 |
| 面部锁定 | PuLID/InstantID | 人脸精确锁定 |
| 适配器 | IP-Adapter | 图特征注入 |
| 链式拼接 | Chaining | 尾帧接首帧 |
| 构图草图 | Composition Sketch | 先定构图后细化 |

## 来源

- Flick: AI Character Consistency — 5 Methods Compared (2026) — https://flick.art/blog/img2img-consistent-character
- NWTIA Studio: Character Consistency Mid-2026 — LoRA, IP-Adapter, PuLID, InstantID, 360° Orbit — https://nowaythisisai.com/blog/character-consistency-fictional-characters-mid-2026
- Apatero: ComfyUI Character Consistency Advanced Guide 2026 — https://apatero.com/blog/comfyui-character-consistency-advanced-workflows-2026
- Apatero: LoRA + IPAdapter Stack — 95% Consistency — https://apatero.ai/blog/lora-ipadapter-stack-95-percent-consistency
- getimg.ai: How to Create Consistent Characters with AI — https://getimg.ai/blog/how-to-create-consistent-characters-with-ai
- Picovix: Consistent Character in Stable Diffusion (2026) — https://www.picovix.app/blog/consistent-character-stable-diffusion
- AI 工具指南: AI 图片人物每次脸都不一样——原因+修复路径 — https://aitoolsguidebook.com/zh/articles/ai-image-character-consistency/
- SegmentFault: AI 漫剧保姆级实战——如何用最简单的方法保持角色脸部一致性 — https://segmentfault.com/a/1190000048069103

## 相关概念

- [AI 视频生成工作流（AI Video Generation）](../14-ai-video-generation/ai-video-generation.md)
- [全片风格统一与美术指导（Style Unification & Art Direction）](../45-style-unification/style-unification.md)
- [AI 短剧/漫剧视觉工厂（AI Drama & Manhua Studio Pipeline）](../48-ai-drama-studio/ai-drama-studio.md)
