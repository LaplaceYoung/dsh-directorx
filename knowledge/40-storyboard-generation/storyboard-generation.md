---
type: Playbook
title: "分镜图生成工作流（Storyboard-to-Video Pipeline）"
description: "分镜图生成工作流手册：文生图→图生视频的完整 SOP（资产层/提示词脚手架/生成通道/日志契约）、镜头表→提示词模板、审查清单、中文生态同场景多机位拆解法"
tags:
  - "foundation"
  - "camera"
  - "prompt"
  - "storyboard"
  - "workflow"
  - "i2v"
status: stable
stale_after: "2027-08-18"
generated:
  by: "process:directorx-knowledge-okf"
  at: "2026-08-18T00:00:00Z"
verified:
  - by: "process:knowledge-audit"
    at: "2026-08-18T00:00:00Z"
sources:
  - resource: "cited:Wan 2.7 Studio 生产级 SOP"
    id: cite-1
    title: "Wan 2.7 Studio 生产级 SOP"
  - resource: "cited:HackerNoon 场景分镜"
    id: cite-2
    title: "HackerNoon 场景分镜"
  - resource: "cited:OpenCreator 多机位拆解"
    id: cite-3
    title: "OpenCreator 多机位拆解"
  - resource: "cited:Nano Banana Pro 分镜最佳实践。"
    id: cite-4
    title: "Nano Banana Pro 分镜最佳实践。"
  - resource: "https://wan2-7ai.com/blog/wan-2-7-gpt-image-2-storyboard-i2v-production-sop"
    id: url-1
    title: "wan2-7ai.com"
  - resource: "https://hackernoon.com/how-to-storyboard-a-scene-for-ai-video-generation-so-the-shot-actually-matches-the-panel"
    id: url-2
    title: "hackernoon.com"
  - resource: "https://opencreator.io/zh/blog/ai-storyboard-multi-camera-workflow"
    id: url-3
    title: "opencreator.io"
  - resource: "https://help.apiyi.com/nano-banana-pro-ai-video-storyboard-character-consistency-guide.html"
    id: url-4
    title: "help.apiyi.com"
  - resource: "https://renoise.ai/zh-CN/guides/ai-storyboard"
    id: url-5
    title: "renoise.ai"
  - resource: "https://cloud.tencent.com/developer/article/2697299"
    id: url-6
    title: "cloud.tencent.com"
dx_id: "40"
related:
  - "07-directing/directing-techniques.md"
  - "14-ai-video-generation/ai-video-generation.md"
  - "53-shotlist-to-prompt/shotlist-to-prompt.md"
---

# 分镜图生成工作流（Storyboard-to-Video Pipeline）

> 本页是 DirectorX 分镜图生成工作流手册：文生图→图生视频的完整 SOP（资产层/提示词脚手架/生成通道/日志契约）、镜头表→提示词模板、审查清单、中文生态同场景多机位拆解法。
> 来源：Wan 2.7 Studio 生产级 SOP、HackerNoon 场景分镜、OpenCreator 多机位拆解、Nano Banana Pro 分镜最佳实践。

## 概述

**核心断言**（Wan 2.7 Studio）：如果你的"工作流"是 *prompt → reroll → pray*，你没有流水线，你只有一台老虎机。

**责任边界（Step 0）——别混淆图片模型与视频控制**：
- 图片模型（GPT Image 2 / Nano Banana Pro / 即梦）：**定义世界**——角色、风格、关键帧；
- 视频模型（Wan 2.7 / Kling / Veo 等）：**动画化世界**——运动、时序、连贯性；
- 让图片阶段"修视频一致性"= 完美的静帧 + 不稳定的镜头；这个分工让调试快：漂移发生时你知道该怪哪一层。

**总流程**：
```
镜头表/脚本 → 资产层（角色表+风格板+关键帧）→ 5 块提示词脚手架 → I2V 首帧生成
→ 漂移严重升级 FLF → 结尾崩坏用 continuation 打捞 → 日志契约复盘
```

## 第一步：资产层（用图片模型建三个契约）

### 资产 A：角色表（身份契约）
像写 spec 一样写角色，不是写氛围：
- 脸/年龄线索（**必须不变**项）；
- 发型+服装（固定 vs 可选）；
- 道具（必备 vs 锦上添花）；
- 3 个角度（正面 / 3/4 / 侧面）。

产物要存档：文件/稳定 URL、短标签（"Character A v3 / Outfit 1 / Lighting: neutral"）、可选哈希——团队能说"用了 Character A v3"而不是"昨天那张"。

### 资产 B：风格板（渲染+光线契约）
4-8 张图锁定：
- 光线方向与强度；
- 材质响应（皮肤高光/湿沥青/铬面）；
- 背景纹理密度（繁 vs 净）。
防止经典翻车：第一镜像电影剧照，下一镜像廉价 TikTok 滤镜。

### 资产 C：关键帧（镜头锚点）
每镜生成：
- 首帧关键帧（"开始契约"）——默认必做；
- 尾帧关键帧（"结束契约"）——与漂移战斗时启用。
这是"分镜→图生视频"的桥。

## 第二步：镜头表 → 5 块提示词脚手架

> **约束优先，形容词最后。**

```
[SUBJECT 主体]
- 镜头里是谁/什么（身份、服装、关键道具）

[ENVIRONMENT 环境]
- 地点 + 光线 + 时段 + 材质（需要保持一致的项）

[CAMERA 镜头]
- 构图 + 镜头感 + 运镜（push-in/pan/handheld/locked-off）

[MOTION 运动]
- 随时间变化什么（动作节拍、节奏）

[CONSTRAINTS 约束]
- 全程同一身份、无文字叠加、背景稳定、无风格突变
```

与 34 文档八层框架同构（参考资产/镜头标签/主体/动作/镜头/场景/音频/约束）——同一套 brief 语言贯穿全流水线。

## 第三步：三条生成通道（按需升级，别默认最贵）

| 通道 | 用法 | 何时用 |
|---|---|---|
| I2V 首帧（默认） | 首帧关键帧 + 5 块提示词 | 最快反馈环——先验证资产层是否连贯 |
| FLF 首尾帧 | 首帧+尾帧双关键帧 | 结尾崩坏（风格漂移/身份漂移）、需要精确落点构图时；**FLF 牺牲灵活性，要"挣来"而不是默认** |
| Continuation 续接 | 保留前段好部分，喂 `first_clip` 续接结尾 | 前 70-80% 很好但最后 2 秒崩坏——别整段重写烧预算 |

## 第四步：审查清单（不是品味，是调试）

每个镜头用同一张清单（否则你不是在调试，是在吵架）：
- **身份稳定**：脸漂移吗？
- **背景闪烁**：光线跳变吗？
- **运动合理性**：肢体面条化吗？
- **文字伪影**：幻觉出叠加文字了吗？
- **风格一致**：与风格板对比，还是一镜剧照一镜滤镜？

## 第五步：日志契约（人人都跳过的关键）

团队必须 1 分钟内回答"改了什么"，否则没有可复现提示词。每镜最低字段：
- 模型字符串（如 `wan2.7-i2v`）与模式（I2V / FLF / continuation）；
- 首/尾帧资产 id 或稳定 URL（含哈希）；
- 完整提示词文本（或提示词哈希）；
- 输入媒体顺序（压力下"显而易见"的顺序并不显而易见）；
- 请求标识与 task_id。

**降重试率铁律**：一次只改一个变量——改一块、重跑、对同一张清单对比。

## 中文生态：同场景多机位拆解法（OpenCreator）

"能拍出来"的 AI 分镜脚本生产方法：
1. **同场景多机位**：一个场景拆 N 个机位视角，共享同一环境描述块（保证场景一致）；
2. **镜头拆解**：把"动作链"拆成逐镜动作（进门→脱帽→落座→看窗外），每镜一个生成单元；
3. **环境描述复用**：场景/光线/氛围写进共享块，每镜提示词只改主体动作与机位——一致性成本大降；
4. **角色参考前置**：同角色参考图贯穿全部机位（→ 39 文档）。

## 端到端模板（可直接套用）

```text
# 镜头表条目 → 生产指令
镜头 7：室内夜，中景，女主演背对镜头看窗外雨，缓缓回头
├─ 关键帧：GPT Image 2 生成首帧（角色表+风格板+构图描述）
├─ 提示词：
│   [SUBJECT] Character A v3（角色表引用），深灰大衣，无帽
│   [ENVIRONMENT] 1930s 巴黎公寓，暖钨丝灯，窗外冷蓝雨夜（风格板 2 号）
│   [CAMERA] 中景，35mm 感，缓慢 push-in
│   [MOTION] 雨声起，她微微侧头，2 秒后回头看向镜头
│   [CONSTRAINTS] 身份与角色表一致，无文字，背景稳定，保持胶片颗粒
├─ 通道：I2V 首帧
└─ 日志：wan2.7-i2v / keyframe_07_v3 / prompt_07_v3 / task_id
```

## 常见错误

1. 一次提示词赌奇迹：reroll 循环烧预算（老虎机心态）。
2. 图片模型管视频一致性：静帧完美、镜头全崩。
3. 跳过资产层：每次 reroll 悄悄改变输入，提示词改写毫无意义。
4. 默认 FLF：牺牲灵活性换不需要的控制。
5. 结尾崩坏就整段重写：用 continuation 打捞前段。
6. 无日志：改了什么全靠记忆，团队吵架。
7. 同时改多个变量：无法归因，永远在赌。

## 术语表（中英对照）

| 中文 | English | 一句话定义 |
|---|---|---|
| 资产层 | Asset Layer | 角色/风格/关键帧契约 |
| 身份契约 | Identity Contract | 角色不可变项清单 |
| 风格板 | Style Board | 光线材质参考集 |
| 关键帧 | Keyframe | 镜头锚点 |
| 首帧生成 | I2V | 图生视频 |
| 首尾帧 | FLF | 双端契约 |
| 续接 | Continuation | 前段打捞 |
| 提示词脚手架 | Prompt Scaffolding | 5 块模板 |
| 日志契约 | Logging Contract | 可复现记录 |
| 审查清单 | Review Checklist | 客观调试项 |
| 多机位拆解 | Multi-camera Split | 同场景共享环境 |
| 重试预算 | Retry Budget | 生成次数配额 |

## 来源

- Wan 2.7 Studio: Storyboard-to-I2V Production SOP（GPT Image 2 + Wan 2.7） — https://wan2-7ai.com/blog/wan-2-7-gpt-image-2-storyboard-i2v-production-sop
- HackerNoon: How to Storyboard a Scene for AI Video Generation — https://hackernoon.com/how-to-storyboard-a-scene-for-ai-video-generation-so-the-shot-actually-matches-the-panel
- OpenCreator: AI 分镜脚本怎么做才"能拍出来"——同场景多机位与镜头拆解 — https://opencreator.io/zh/blog/ai-storyboard-multi-camera-workflow
- Apiyi: 用 Nano Banana Pro 做 AI 视频分镜图——6 步最佳实践 — https://help.apiyi.com/nano-banana-pro-ai-video-storyboard-character-consistency-guide.html
- Renoise: AI 分镜生成器——逐镜规划 — https://renoise.ai/zh-CN/guides/ai-storyboard
- GitHub: liangdabiao/Seedance2-Storyboard-Generator — 
- 腾讯云: 同一个角色跑通 5 大模型——AIGC 短片全流程提示词工作流 — https://cloud.tencent.com/developer/article/2697299

## 相关概念

- [导演技巧（Directing Techniques）](../07-directing/directing-techniques.md)
- [AI 视频生成工作流（AI Video Generation）](../14-ai-video-generation/ai-video-generation.md)
- [镜头表→提示词转换器（Shot List → Prompt Translation）](../53-shotlist-to-prompt/shotlist-to-prompt.md)
