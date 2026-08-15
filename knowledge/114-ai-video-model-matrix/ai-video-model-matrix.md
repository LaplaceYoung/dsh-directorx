# AI 视频模型能力矩阵（AI Video Model Matrix 2026 — Capabilities & Selection）

> 本页为 2026 年主流 AI 视频模型的**能力边界总表**：文生/图生/多模态输入、原生音频、时长/分辨率、动作真实度、对口型、工作流控制、API 可用性——以及按生产用途的选型树。知识本体来自多家 2026 实测对比（Pinggy/TeamDay/mStudio/Higgsfield/Masonry）。AI 应用面向 DirectorX：模型路由决策（案例 3/4/5 的模型选择依据，衔接 14）。与 14 分工：本页为能力矩阵、选型树与横评实测（选哪个、谁更强），14 为生成工作流与逐模型使用手册（怎么用）。
> 来源：Pinggy「Best Video Generation AI Models 2026」、TeamDay「Best AI Video Models 2026」、mStudio「Best AI Video Generators 2026」、Higgsfield「6 Best AI Video Generators 2026」、Masonry「Sora vs Runway vs Kling vs Veo」。

## 概述

**核心断言**：2026 年没有"全能模型"——每个模型有明确的能力强项（Veo 的真实感与原生音频、Kling 的运动真实与多语对口型、Seedance 的商业一致性、Luma 的图驱动动画、Runway 的生产工作流控制）。**选型看任务不看品牌**：先定任务类型（写实/口播/广告/图驱动），再选模型。

**关键趋势**：图生视频（Image-to-Video）已成为主力生产路径——所有主要模型都支持从参考图出发，文本直出只用于无视觉锚的场景。

## 核心概念

### 模型能力五维（选型评估维度）

1. **输入模态**：文生（Text-to-Video）/ 图生（Image-to-Video）/ 多模态（图+文+音频）
2. **原生音频**：能否同时生成对口型/环境声/音乐（省去后期配音）
3. **时长与分辨率**：单次生成时长（5s/10s/30s）与分辨率（720p/1080p/4K）
4. **动作真实度**：物理、肢体、运动连贯（动作场景关键）
5. **工作流控制**：多镜编排、故事板、参数控制（生产管线关键）

### 2026 主流模型矩阵

| 模型 | 强项 | 输入 | 原生音频 | 时长 | 最佳用途 |
|---|---|---|---|---|---|
| Google Veo 3.1 | 写实、电影感、提示词遵循、对话同步 | 文/图 | ✅ 强 | 最长 30s+ | 电影感短片、真实感场景 |
| Runway Gen-4.5 | 生产工作流、剪辑控制、多镜故事板 | 文/图 | ✅ | 5-10s/镜 | 广告、多镜生产管线 |
| Kling 3.0 | 运动真实、对口型、多语言 | 文/图 | ✅ 多语对口型 | 5-10s | 动作场景、多语口播 |
| BytePlus Seedance 2.0 | 商业一致性、音频对齐 | 文/图 | ✅ | 5-10s | 商业广告、一致产出 |
| Luma Ray 3.2 | 参考图动画、图生视频 | 图为主 | ✅ | 5-10s | 图片驱动、从视觉出发 |
| Pika 2.5 | 社交短视频、竖屏 | 文/图 | ✅ | 5-10s | Reels/TikTok/Shorts |
| 开源（Wan2.2/LTX-2） | 本地部署、成本 | 文/图 | 部分 | 5-10s | 批量/私有化 |

## 技巧与示例

### 按用途选型树

```text
电影感/写实短片     → Veo 3.1（真实感+原生音频）
动作/运动场景       → Kling 3.0（动作真实+肢体连贯）
广告/商业一致产出   → Seedance 2.0 / Runway Gen-4.5
从参考图出发        → Luma Ray 3.2（图驱动）
多语对口型/数字人   → Kling 3.0（多语 lip-sync）
社交竖屏短视频      → Pika 2.5
多镜生产管线/批量   → Runway（故事板+控制）或开源自部署
```

### 双模型/多模型工作流

2026 生产实践：**同一项目混合模型**——写实镜头用 Veo、动作镜头用 Kling、批量变体用 Seedance——各模型取长，成片剪辑统一。成本按"接受件"（accepted clip）而非"生成件"计算（TeamDay 强调）。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 只用一个模型做所有任务 | 某些镜头明显弱 | 按任务类型路由模型 |
| 文本直出视频（无参考） | 身份/场景漂移 | 图生视频优先，先有视觉锚 |
| 忽略原生音频差异 | 后期补音成本高 | 需要口型/环境声时选原生音频模型 |
| 只看生成数量不看接受率 | 成本虚高 | 按接受件评估成本 |
| 时长控制不当 | 镜头超长/过短 | 按模型支持时长规划镜头 |

## 工作流应用（AI 映射）

模型路由是生产决策的一部分（衔接 14 与 113 案例手册）：

```text
任务类型判定（写实/动作/广告/图驱动/口播/竖屏）
  → 能力需求映射（原生音频/时长/多语口型/一致性）
  → 模型选择（矩阵+选型树）
  → 生成参数（时长/分辨率/比例）
  → 多模型混合（按镜头路由）
  → 接受率评估（决定重试或换模型）
```

**DirectorX 纪律**：生成前声明模型与参考模式；模型不可用时不假装生成，给出可执行的提示词包与推荐模型（衔接生成门控）。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 文生视频 | Text-to-Video | 纯文本生成 |
| 图生视频 | Image-to-Video | 从参考图生成 |
| 原生音频 | Native Audio | 模型自带声音/口型 |
| 对口型 | Lip-Sync | 嘴型与语音同步 |
| 接受件 | Accepted Clip | 被采用的生成结果 |
| 多镜故事板 | Multi-Clip Storyboard | 模型内多镜编排 |
| 运动真实度 | Motion Realism | 物理/肢体连贯性 |
| 模型路由 | Model Routing | 按任务选模型 |

## 补充：六类别横评实测与自我测试协议

> 以下内容原载于 52-ai-video-model-benchmark，提取其同提示词横评数据、逐模型画像与自测方法论。

### 六类别同提示词实测（best-of-3，2026-04）

| 类别 | 测试内容 | 赢家 | 亚军 | 关键发现 |
|---|---|---|---|---|
| 电影感建立镜头 | 霓虹雨夜独行、缓拉远 | **Kling 3.0** | Veo 3.1 | 4K 细节保留+最自然的电影感运镜；Seedance 拉远偶有顿挫需重生成 |
| 动作与物理 | 森林冲刺、手持跟拍 | **Seedance 2** | Kling 3.0 | 跑步力学/落脚/衣物运动最真；Sora 斑驳光时序不稳定 |
| 口播与同步音频 | 15 秒商业演讲 | **Veo 3.1** | Sora 2 | 原生同步音频一次生成，唇语 ~10ms 不可察；Sora 无声需另生成同步 |
| 角色一致性 | 同角色三环境 | **Kling 3.0**（多镜故事板） | Seedance 2（参考图） | Kling 一次生成三镜交叉一致最佳；Veo 有参考图时保持良好 |
| 物理/流体 | 慢镜水花、鸟起飞、布料 | **Seedance 2** | Kling 3.0 | 液滴行为/飞溅模式/光交互最真实；Sora 液滴偶发诡异行为 |
| 视频内文字 | 衬线片名卡 | **Veo 3.1** | Sora 2 | 衬线字形准确；Seedance 文字渲染明显偏弱 |

### 逐模型画像

- **Kling 3.0**：电影质感总冠军（运镜/细节/跨镜一致），但音频需外部工具、动作物理输 Seedance。
- **Veo 3.1**：对话/同步音频/视频内文字的赢家，氛围自然音加分；动作"不够急"。
- **Seedance 2**：物理/流体/动作力学冠军，参考图工作流强；镜头运动偶发顿挫、文字弱。
- **Sora 2**：审美强但 2026 年很少单类夺冠（口播音频缺失是硬伤）。

### 中文生态补充（OpenCreator/提效录/550W）

| 模型 | 定位 | 注意 |
|---|---|---|
| 可灵 Kling | 电影质感+多镜故事板+角色一致 | 中文生态全能；4K60 输出 |
| 即梦 Seedream/Jimeng | 模板丰富、图生视频、中文提示词友好 | 品牌/口播模板强 |
| 海螺 Hailuo | 首尾帧/运动控制 | 动态镜头专项 |
| 万相 Wan 2.7 | 开源生态、可编辑视频 | 本地部署/批量成本低 |
| Vidu | 参考图/多模态 | 中文提示词 |
| 通义/豆包 | 中文自然语言 | 一体化平台 |

**中文横评共识**：电影感=可灵、物理/动作=Seedance（海螺近）、口播音频=Veo（国内需海螺/即梦替代）、批量成本=万相。

### 多模型工作流实测结论

按镜头选型（建立→Kling、动作→Seedance、口播→Veo）剪辑成片，对比单模型视频，多数创作者观察到 **15-30% 互动提升**。

### 你自己的测试协议（别只信榜单）

1. **同提示词**：每模型跑同一批 3 次生成，best-of-3；
2. **六类覆盖**：建立镜头/动作/口播/一致性/物理/文字——对应你的真实项目类型；
3. **固定参数**：分辨率、时长、种子哲学一致；
4. **记录而非感觉**：每类打分表（构图/运动/物理/一致/音频/文字六维 1-5），不凭印象；
5. **按项目选**：你只做口播 → Veo/海螺权重高；只做产品动效 → Seedance 权重高——榜单是起点不是终点。

### 方法论边界（横评诚实声明）

- 样本量：每提示词 3 代（实用测试非同行评审）；
- 提示词结构：各模型原生提示词可能优于通用提示词——反之亦然；
- 版本：结果反映测试时版本（2026-04）；
- 未测：30s+ 长片、风格迁移微调、多角色复杂场景、实时生成速度。

## 来源

- Pinggy — Best Video Generation AI Models in 2026：https://pinggy.io/blog/best_video_generation_ai_models/
- TeamDay — Best AI Video Models 2026: Veo, Runway, Kling, Sora：https://www.teamday.ai/blog/best-ai-video-models-2026
- mStudio — Best AI Video Generators 2026：https://mstudio.ai/insights/best-ai-video-generator-2026
- Higgsfield — The 6 Best AI Video Generators in 2026：https://higgsfield.ai/blog/best-ai-video-generators-2026
- Masonry — Best AI Video Generators in 2026：https://masonry.so/blog/best-ai-video-generator-2025-comparison
- Oakgen: Sora 2 vs Veo 3 vs Kling 3 vs Seedance 2 — https://oakgen.ai/blog/sora-2-vs-veo-3-vs-kling-3-vs-seedance-2-tested
- OpenCreator: 主流 AI 视频模型横向测评 2026 — https://opencreator.io/zh/blog/ai-video-models-comparison-2026
- TheAI 學院: 亞洲 AI 影片生成大戰 — https://www.theai.tw/guide/asia-ai-video-generation-2026
- 550W AI: 2026 AI 视频生成工具盘点 — https://www.550wai.cn/blog/ai-video-generator-tools-2026.html
- 提效录: 2026 年 AI 视频生成器横评 — https://www.tixiaolu.com/posts/ai-video-generation-comparison-2026/
- Apatero: Seedance 2 vs Sora 2 vs Kling 3.0 vs Veo 3.1 — https://apatero.com/blog/seedance-2-vs-sora-kling-veo-ai-video-comparison-2026
- WaveSpeed: Seedance 2.0 vs Kling 3.0 vs Sora 2 vs Veo 3.1 — https://wavespeed.ai/blog/posts/seedance-2-0-vs-kling-3-0-sora-2-veo-3-1-video-generation-comparison-2026/

<!-- merged from: #52-ai-video-model-benchmark -->