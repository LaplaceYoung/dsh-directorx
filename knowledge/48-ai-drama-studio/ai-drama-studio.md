---
type: Playbook
title: "AI 短剧/漫剧视觉工厂（AI Drama & Manhua Studio Pipeline）"
description: "AI 短剧视觉工厂手册：六阶段工业化管线（剧本→分镜→画面→一致性→动态化→剪辑）、LLM 分镜 JSON 契约、角色一致性联合方案、竖屏短剧视觉纪律、工业化量产要点"
tags:
  - "foundation"
  - "editing"
  - "storyboard"
  - "character"
  - "workflow"
  - "continuity"
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
  - resource: "cited:掘金 2026 工具链实战"
    id: cite-1
    title: "掘金 2026 工具链实战"
  - resource: "cited:腾讯云工业化路径"
    id: cite-2
    title: "腾讯云工业化路径"
  - resource: "cited:SegmentFault 3 小时流水线"
    id: cite-3
    title: "SegmentFault 3 小时流水线"
  - resource: "cited:GitHub shortdrama-pipeline。"
    id: cite-4
    title: "GitHub shortdrama-pipeline。"
  - resource: "https://juejin.cn/post/7633774915263447092"
    id: url-1
    title: "juejin.cn"
  - resource: "https://cloud.tencent.cn/developer/article/2648989"
    id: url-2
    title: "cloud.tencent.cn"
  - resource: "https://cloud.tencent.com/developer/article/2650312"
    id: url-3
    title: "cloud.tencent.com"
  - resource: "https://segmentfault.com/a/1190000048051713"
    id: url-4
    title: "segmentfault.com"
  - resource: "https://segmentfault.com/a/1190000048115381"
    id: url-5
    title: "segmentfault.com"
  - resource: "https://aivid.video/blog/ai-microdrama-how-to-build-a-vertical-series-with-ai"
    id: url-6
    title: "aivid.video"
dx_id: "48"
aliases:
  - "143"
related:
  - "57-hybrid-liveaction-ai/hybrid-liveaction-ai.md"
  - "86-storyboard-drawing/storyboard-drawing.md"
  - "88-sound-image-on-set/sound-image-on-set.md"
---

# AI 短剧/漫剧视觉工厂（AI Drama & Manhua Studio Pipeline）

> 本页是 DirectorX AI 短剧视觉工厂手册：六阶段工业化管线（剧本→分镜→画面→一致性→动态化→剪辑）、LLM 分镜 JSON 契约、角色一致性联合方案、竖屏短剧视觉纪律、工业化量产要点。与 34/39/40/43/44 深度衔接。**已合并 143（工业化生产体系/身份层/跨集锁定/产能实测）**——2026-08 去重整理。
> 来源：掘金 2026 工具链实战、腾讯云工业化路径、SegmentFault 3 小时流水线、GitHub shortdrama-pipeline。

## 概述

**2026 年判断**：AI 生成短剧/漫剧已从"概念验证"进入"**工业化量产**"阶段——国内抖音/快手的 AI 微剧场、出海 YouTube 的 AI 动画频道，背后是同一套成熟工具链。

**核心断言**：
1. 已不是拼模型，而是**拼整套工业化流程**——环节间的数据契约决定产能；
2. LLM 不替代编剧，而是**结构化批量产出分镜脚本**（JSON 格式，下游画面模型直接消费）；
3. 角色一致性是量产生命线——多镜头保持角色特征是最大成本项。

## 六阶段管线（含工具与输出）

| 阶段 | 核心任务 | 主流工具 | 输出 |
|---|---|---|---|
| 1 剧本生成 | 故事结构、分镜描述、台词 | GPT-4o / Claude / DeepSeek | JSON 分镜脚本 |
| 2 分镜设计 | 镜头语言、画面描述 | ComfyUI 分镜节点、可灵 | 分镜脚本 |
| 3 画面生成 | 角色形象、场景渲染 | SDXL / FLUX.1 | 序列帧图片 |
| 4 角色一致性 | 多镜头保持角色特征 | LoRA + IP-Adapter + InstantID | 一致性角色图 |
| 5 动态化 | 图转视频、配音对口型 | 可灵 / 即梦 / Pika / Runway | 视频片段 |
| 6 剪辑合成 | 音频对齐、字幕、特效 | FFmpeg / DaVinci Resolve | 成片 |

## 阶段一：LLM 分镜 JSON 契约（上游水源）

**关键设计**：输入一句话故事设定，输出**可直接被下游画面模型消费**的结构化 JSON：

```json
{
  "title": "无色之人",
  "genre": "都市奇幻爱情",
  "total_scenes": 12,
  "aspect_ratio": "9:16",
  "scenes": [{
    "scene_id": 1,
    "shot_type": "全景",
    "description": "画面主体描述（用于图生图模型）",
    "prompt": "英文正向提示词（用于 SD 等模型）",
    "negative_prompt": "英文反向提示词",
    "character_actions": "角色动作描述",
    "dialogue": "角色台词",
    "emotion": "tension",
    "duration_seconds": 4,
    "camera_movement": "static"
  }],
  "audio_config": { "bgm_style": "...", "sfx": ["..."] }
}
```

**SYSTEM_PROMPT 硬规则**（保证下游可用）：
1. 每镜 prompt 必须含详细角色外观（发色/眼型/服装颜色）；
2. 场景描述具体到光线氛围（golden hour / night / indoor warm light）；
3. 镜头 8-16 个覆盖起承转合；
4. 所有英文 prompt 风格统一（→ 45 风格统一：生成端一致）。

**实测参数**：GPT-4o 生成 12 镜约 35 秒；prompt 可用率 92.7%；**temperature 0.7-0.9**（过低趋同、画面风格单一）；生成后人工补角色外观细节（直接影响后续一致性）。

## 阶段四：角色一致性联合方案（量产生命线）

**分层叠加**（→ 39 文档五方法详解）：
- **LoRA**：训练角色专属模型（15-50 张，近零漂移）——身份层；
- **IP-Adapter**：服装/风格参考注入——外观层；
- **InstantID/PuLID**：面部精确锁定——面部层；
- **ControlNet**：姿态约束——动作层。

**纪律**：先建角色"身份档案"（转面图+服装设定），再批量生成；每镜提示词复用同一角色描述块（→ 39 提示词模板）。

## 阶段五/六：动态化与剪辑合成

- **图生视频**：可灵/即梦/Seedance 按分镜图批量转视频；对白镜头用唇语同步能力（→ 34 Kling 对白语法）；
- **TTS 配音**：每角色固定音色（→ 31 AI 音频四原则）；
- **FFmpeg 自动化**：音频对齐、字幕烧录、转场、规格化导出——全命令行可批处理（3 小时一条完整漫剧的产能关键）；
- **合成审查**：口型/音画同步、字幕安全区（→ 43 竖屏安全区）、整体节奏。

## 竖屏短剧视觉纪律（→ 43 深化）

1. **9:16 全程**：从剧本 JSON 的 aspect_ratio 到成片导出；
2. **特写密度高**：小屏信息量有限，情绪靠脸——近景/特写占比显著高于横屏剧；
3. **字幕即台词**：全集逐句、字号大、描边重、位置固定；
4. **3-5 秒一切**：冲突前置，钩子进首帧（→ 05/17 文档）；
5. **场景复用**：同场景多机位共享环境描述块（→ 40 多机位拆解）。

## 工业化量产要点（腾讯云/塔猴实操）

- **流程先行**：先把 6 阶段跑通一条样板剧，再谈批量（流程未定义就扩量=返工潮）；
- **环节契约化**：每阶段的输出格式固定（JSON 剧本→批量画面→批量视频），自动化依赖契约稳定；
- **降本**：批量生成本地化（ComfyUI 免费 vs API 计费）、镜头重生成次数靠分镜质量压降（→ 40 日志契约）；
- **质量闸门**：画面审查（一致性/时代错误/伪影）+ 内容合规（AI 标注、平台规则）；
- **出海差异化**：YouTube AI 动画频道用英文分镜 JSON 直接走同一管线（多语言 = 多一个 LLM 翻译环节）。

## 工业化生产体系（并入自 143：Short Drama Industrialization）

### 剧本到成集管线（创意制片人代理模式）
```
① 剧本载入创意制片人代理（唯一事实源）
② 分解为集/镜头（分集故事板代理）
③ 分镜路由（DOP 判断 → 对应视频模型，→ 114）
④ 生成（分镜逐条）
⑤ 自动组装（+ 时长扩展）
⑥ 跨集上下文锁定（一致性）
```

### 持久身份层（跨集一致性的关键）
"打开生成器敲个提示词"只适用于单条。**系列生产需要持久身份层**——角色/场景/风格的文档化参考，每个模型跨集可引用（→ 117 四类一致性 × 五级方法）。

### 实测产能（行业口径）
小团队 10 集微短剧约 **3 天 / 每集约 $1000**（Invideo 2026 实测）——产能来自管线化 + 跨集锁定，不是单次生成速度。

### 与六阶段管线的关系
六阶段（本页上半部）是**单集/单条**的契约化生产；本节是**多集/整季**的工业化扩展——两者共用 JSON 契约与一致性联合方案，差异在跨集上下文锁定与批量 QC（→ 174）。

## 常见错误

1. 拼模型不拼流程：环节数据格式各写各的，无法串联。
2. 剧本无结构化契约：下游手动转写，产能归零。
3. 角色外观描述每镜不同：一致性崩坏（→ 39 漂移原理）。
4. temperature 过低/过高：画面趋同或失控。
5. 先扩量后定流程：返工潮。
6. 跳过竖屏纪律：横屏思维做短剧。
7. 口型/字幕不过审：细节暴露 AI 味（→ 44）。

## 术语表（中英对照）

| 中文 | English | 一句话定义 |
|---|---|---|
| 工业化量产 | Industrial Production | 流程化批量产出 |
| 分镜契约 | Shotlist Contract | JSON 数据格式 |
| 上游水源 | Upstream Source | 剧本生成环节 |
| 联合方案 | Joint Solution | LoRA+IP+InstantID |
| 身份档案 | Identity Sheet | 角色一致性基线 |
| 批量生成 | Batch Generation | 无界面自动化 |
| 质量闸门 | Quality Gate | 环节审查点 |
| 唇语同步 | Lip-sync | 口型对齐 |
| 自动化剪辑 | Automated Assembly | FFmpeg 管线 |
| 微剧场 | Micro Drama | 竖屏短剧形态 |
| 情绪标签 | Emotion Tag | 每镜基调元数据 |
| 双轨流水线 | Dual Track | 基础量+精品量 |

## 来源

- 掘金: AI 漫剧工业化生产工具链——从剧本到成片的全流程技术实战 — https://juejin.cn/post/7633774915263447092
- 腾讯云开发者社区: 2026 年，AI 真人短剧已经不是拼模型了，而是拼整套工业化流程 — https://cloud.tencent.cn/developer/article/2648989
- 腾讯云: 破局 AI 漫剧工业化量产——全链路降本增效实践路径 — https://cloud.tencent.com/developer/article/2650312
- SegmentFault: 3 小时生成完整 AI 漫剧——工作室高效批量流程 — https://segmentfault.com/a/1190000048051713
- SegmentFault: 从文案到分镜——2026 年 AI 漫剧高效制作工作流与避坑指南 — https://segmentfault.com/a/1190000048115381
- GitHub: drasstry/shortdrama-pipeline — 
- AIVid: AI Microdrama — Multi-Episode Vertical Series Guide — https://aivid.video/blog/ai-microdrama-how-to-build-a-vertical-series-with-ai
- 塔猴: 从零复刻千万播放 AI 短剧——全流程工业化实操指南 — https://www.tahou.com/article/203075881836850181

## 相关概念

- [真人+AI 混合制作工作流（Hybrid Live-Action & AI Production）](../57-hybrid-liveaction-ai/hybrid-liveaction-ai.md)
- [分镜绘制技巧（Storyboard Drawing & Notation）](../86-storyboard-drawing/storyboard-drawing.md)
- [拍摄端声画协同（Designing Picture for Sound）](../88-sound-image-on-set/sound-image-on-set.md)
