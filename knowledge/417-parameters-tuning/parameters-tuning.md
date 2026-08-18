---
type: Method
title: "生成参数控制实战（Parameters — Seed, CFG, Steps, Negative & Tuning + AI）"
description: "AI 视频/图像生成参数的镜头级控制实战：Seed/CFG/Steps/分辨率/时长/运动强度/负面提示词/风格强度/参考权重 × 组合策略（一致性/运动/质量）× seed 复现迭代与常见错误表"
tags:
  - "craft"
  - "camera"
  - "prompt"
  - "style"
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
  - resource: "cited:Kling AI Text to Video API"
    id: cite-1
    title: "Text to Video API"
    author: "org:Kling-AI"
  - resource: "cited:OpenAI Video generation with Sora"
    id: cite-2
    title: "Video generation with Sora"
    author: "org:OpenAI"
  - resource: "cited:Google Generate videos with Veo 3.1 in Gemini API"
    id: cite-3
    title: "Generate videos with Veo 3.1 in Gemini API"
    author: "org:Google"
  - resource: "cited:Together AI Video generation parameters"
    id: cite-4
    title: "Video generation parameters"
    author: "org:Together-AI"
  - resource: "cited:PixVerse v5.5 Prompt Guide"
    id: cite-5
    title: "v5.5 Prompt Guide"
    author: "org:PixVerse"
  - resource: "cited:WaveSpeed Seedance 2.0 Best Settings Guide"
    id: cite-6
    title: "Seedance 2.0 Best Settings Guide"
    author: "org:WaveSpeed"
  - resource: "cited:LTX LTX-2.5 Workflow: ComfyUI Video Generation Model Workflow Guide"
    id: cite-7
    title: "LTX-2.5 Workflow: ComfyUI Video Generation Model Workflow Guide"
    author: "org:LTX"
  - resource: "cited:Hugging Face Text-to-image (Diffusers)"
    id: cite-8
    title: "Text-to-image (Diffusers)"
    author: "org:Hugging-Face"
  - resource: "cited:Stability AI stability-sdk"
    id: cite-9
    title: "stability-sdk"
    author: "org:Stability-AI"
  - resource: "cited:URL 见文末。"
    id: cite-10
    title: "URL 见文末。"
dx_id: "417"
related:
  - "138-params-tuning/params-tuning.md"
  - "407-reference-first-last-frame/reference-first-last-frame.md"
  - "115-video-prompt-engineering/video-prompt-engineering.md"
  - "118-defect-repair/defect-repair.md"
  - "174-qc-automation/qc-automation.md"
---

# 生成参数控制实战（Parameters — Seed, CFG, Steps, Negative & Tuning + AI）

> 本页为 AI 视频/图像生成参数的实战控制手册：Seed、CFG/Guidance、Steps、分辨率与画幅、时长、运动强度、负面提示词、风格强度、参考权重、帧率与质量档位，以及按目标（一致性/运动/质量）的组合策略与 seed 复现迭代。知识本体来自 2026 主流模型官方文档与参数实践指南（Kling AI、OpenAI Sora、Google Veo、Together AI、PixVerse、Seedance、LTX、Hugging Face Diffusers、Stability AI）。AI 应用面向 DirectorX：把"抽卡式生成"变成"可复现、可诊断、可调光"的受控生成（衔接 138 参数进阶、407 参考图首尾帧、115 提示词工程、118 缺陷修复、174 质检）。
> 来源：Kling AI「Text to Video API」「Image to Video API」、OpenAI「Video generation with Sora」、Google「Generate videos with Veo 3.1 in Gemini API」、Together AI「Video generation parameters」、PixVerse「v5.5 Prompt Guide」、WaveSpeed「Seedance 2.0 Best Settings Guide」、LTX「LTX-2.5 Workflow: ComfyUI Video Generation Model Workflow Guide」、Hugging Face「Text-to-image (Diffusers)」、Stability AI「stability-sdk」；URL 见文末。

## 1. 概述：参数是可控性的来源

**核心断言**：提示词决定"要什么"，参数决定"多严格、多稳定、多贵"。传统电影制作靠光线设计、机位调度与画幅选择来控制画面；在 AI 生成里，对应这套"旋钮"的就是 **seed、CFG/guidance、steps、分辨率、时长、运动强度、负面提示词、风格强度、参考权重**。参数不是玄学——每个参数都对应模型内部一个明确机制（去噪步进、引导梯度、噪声初始化、时间长度），弄懂机制就能预测调参后果。

三个基本纪律：

1. **参数三问**：这个参数控制什么？官方取值范围与默认值是多少？调过头了什么会变坏？——答案全部查模型官方文档，不靠猜。
2. **模型差异第一**：不同模型暴露的参数不一样。Veo 3.1 只暴露 `aspectRatio`/`resolution`/`durationSeconds`/`seed`，**没有负面提示词字段**；Kling 暴露 `cfg_scale`/`negative_prompt`/`camera_control`；LTX 在 ComfyUI 里全开放。先查参数表，再谈调参。
3. **参数不是提示词的替代品**：Together AI 官方决策树写明——视频不符合提示词，**先**细化提示词、加 `negative_prompt`，之后才考虑提高 `guidance_scale`。LTX 官方给出最常见的三个质量杀手：**画幅不对、CFG 太高、提示词塞太满**——没有一个是参数能单独救的。

十参数速查：

| 参数 | 官方名称 | 一句话作用 | 典型范围（示例来源） |
|---|---|---|---|
| 种子 | Seed | 固定随机初始化，复现与对照 | 整数；LTX：-1=随机（ltx.io） |
| 引导强度 | CFG / Guidance Scale | 遵循提示词 vs 自由发挥 | 视频 6.0-10.0（Together）；Kling [0,1] 默认 0.5；LTX 2.0-5.0 |
| 去噪步数 | Steps | 迭代次数，质量与时间一致性 | 10 预览 / 20 平衡 / 30-40 生产（Together）；LTX 全模型 20-50 |
| 分辨率与画幅 | Resolution / Aspect Ratio | 清晰度与构图压力 | Kling 720p/1080p/4k；Veo 16:9/9:16；PixVerse 360p-1080p |
| 时长 | Duration / Seconds | 模型"记忆"长度 | Kling 3-15s；Sora ≤20s；Veo 4/6/8s；Together 1-10s |
| 运动强度 | Motion / 运动分桶 / STG | 动态度与稳定性权衡 | Kling camera_control；LTX 时空引导 |
| 负面提示词 | Negative Prompt | 显式排除不要的元素 | Kling ≤2500 字符；Together 默认不设置 |
| 风格强度 | Style / 风格预设 | 风格对输出的支配力 | PixVerse：anime/3d_animation/clay/comic/cyberpunk |
| 参考权重 | Reference / Strength | 图生视频对参考图的忠实度 | Stability img2img schedule；Kling cfg_scale |
| 帧率与质量档 | FPS / Mode | 流畅度与成本档位 | Together fps 15-60；Kling std/pro/4k |

## 2. 参数详解（10 个）

### 2.1 Seed（种子）——复现与对照的锚

- **作用**：固定采样的随机初始化。Together AI 官方定义：同一 `seed` + 同一提示词 + 同一模型 + 同一参数，返回同一段视频，用于复现和调参时的公平对比。
- **怎么调**：生产固定一个整数种子；探索构图/动作阶段用随机。LTX 官方约定：`seed = -1` 随机、`seed = 任意数字` 可复现；Stability SDK 中 seed 取值范围 0-4294967295，0 表示随机。
- **常见坑**：① 不记录种子 → 拿到满意结果却无法复现；② 把 seed 当"构图开关"——seed 只定噪声起点，不保证构图，同 seed 换提示词画面会大改；③ 参数已变还"锁 seed"——seed 只有在其他输入完全相同时才有复现意义。
- **最佳实践**：每次生成落一份参数卡（seed + prompt + CFG + steps + 模型版本），这是复现、回退与 QC 的元数据（衔接 174）；Veo 官方明确 seed"不保证确定性，只是略微改善"——平台端模型更新会导致同 seed 输出漂移，跨版本复现不可当真。

### 2.2 CFG / Guidance Scale（引导强度）

- **作用**：控制"遵循提示词"与"模型自由发挥"的比例。Hugging Face Diffusers 官方解释：值越低模型越有"创造力"、输出与提示词越松散；值越高越贴着提示词走，**过高会出现伪影**。Together AI 补充：它同时影响画面内容与**时间一致性**。
- **怎么调**：Together AI 视频参数官方推荐 6.0-10.0——6.0-7.0 更创意、7.0-9.0 大多数场景的甜区、9.0-10.0 严格遵循；**超过 12 会出现过饱和与不自然运动**。Kling API 的 `cfg_scale` 取值范围 **[0,1]、默认 0.5**，值越大模型自由度越小、与提示词相关性越强——注意与图像模型的 0-10 标度完全不同，数值不可照搬。LTX 官方：视频 CFG 2.0-5.0（默认 3.0-3.5），**图生视频从 3.0 起调而不是 7.0**——模型已有图像作 ground truth，高 CFG 会把参考图弄到面目全非。
- **常见坑**：把 CFG 当"让模型听话"的万能旋钮——调满的结果是过饱和、机械感运动、时间抖动（衔接 118 抖动类缺陷）；照搬别的模型的数值（Kling 0.5 与 SD 7.0 是两个世界）。
- **最佳实践**：先查该模型的官方区间，从默认值附近 ±1-2 档微调；"模型没听懂"先改提示词，CFG 只做末位微调；I2V 一律低于 T2V。

### 2.3 Steps（去噪步数）

- **作用**：去噪过程的迭代次数，决定细节与帧间一致性。Together AI 官方：更多步数通常提升画质与时间一致性，但延迟接近线性上升；**超过模型特定点后不再有帮助**。
- **怎么调**：Together 官方档位——`10` 快速预览、`20` 平衡默认、`30-40` 生产运行、`>50` 收益递减（合法范围 10-50）。LTX 官方分模型：**全模型 20-50 步（50 为推荐默认，80 封顶）**；**蒸馏模型 4-8 步**，别把全模型的步数套在蒸馏模型上（纯浪费）。图生视频需要更高步数平滑首帧过渡（LTX 建议 I2V 60-80 步）。
- **常见坑**：步数拉满——成本非线性上升而收益递减（衔接 138 成本核算）；用错模型的步数表（蒸馏 vs 全模型）；把 steps 和 CFG 混为一谈（一个管迭代量、一个管引导强度）。
- **最佳实践**：预览低步数定构图与动作，锁定后再升生产步数重出；每换一个模型先查官方步骤建议表。

### 2.4 Resolution & Aspect Ratio（分辨率与画幅）

- **作用**：输出清晰度与"取景框压力"。Seedance 实测：**9:16 把脸和文字推前，16:9 给更多环境上下文但小细节更脆**——画幅本身就在替模型做构图决策。LTX 官方：模型主要在 16:9 数据上训练，方图/竖图易产生畸变。
- **怎么调**：Kling API：`resolution` 可选 720p/1080p/4k，`aspect_ratio` 可选 16:9/9:16/1:1；Veo 3.1：720p/1080p/4k（**1080p/4k 仅支持 8 秒时长**）；Sora：`size` 为 1280x720 / 1920x1080 / 1080x1920（**1080p 需要 sora-2-pro**）；PixVerse：360p/540p/720p/1080p 四档。
- **常见坑**：① 低分辨率生成后妄想 upscale 出 4K——LTX 官方明确：upscaler 引入伪影与模糊，"从生成起就用目标分辨率"（2560x1440 只比 1080p 多约 30% 时间，值得）；② 生成后改画幅 → 构图重做（衔接 198 画幅叙事）；③ 参考图与目标分辨率不匹配——Sora 官方：输入图必须匹配目标 `size`；LTX：1280x720 的图配 2560x1440 的目标会出 upsampling 伪影。
- **最佳实践**：画幅在开工第一天定死（竖屏写单主体、宽屏在提示词里给背景方向指令，如 Seedance 建议的 "minimal background movement"、"plain wall" 锚）；最终交付分辨率直接生成，不依赖后期放大。

### 2.5 Duration（时长）

- **作用**：模型的"记忆"长度。Seedance 实测结论：**6-8 秒内结果守主题，超过 12 秒开始出现中途换装、角色跑偏**——模型必须"记得"场景，没有新引导的时间越长，它越会自己发明。
- **怎么调**：按模型上限走——Kling 3-15s、Sora 最长 20s、Veo 3.1 4/6/8s、Together 1-10s（默认 6s）。需要长结果时拆段：Seedance 实操是"20 秒需求拆 3 段拼接"；Kling 的 `multi_shot`/`multi_prompt` 把总时长切成最多 6 个分镜（每镜 ≥1s、总时长守恒）；Sora 支持视频延伸（每次 +20s、最多 6 次、总长 120s）。
- **常见坑**：一镜贪时长 → 误差累积漂移（衔接 408 短片段纪律）；长时长 × 高运动强度 = 画面崩塌；把"多镜需求"压进单个长镜（每个剪辑点都是漂移点）。
- **最佳实践**：首轮一律 6-8s 封顶（Seedance 纪律）；长镜头用"上一镜末帧 = 下一镜首帧"或平台 extension 缝合（衔接 407）；动作复杂度决定单镜时长，不是反着来。

### 2.6 Motion（运动强度 / 运动分桶 / 时空引导）

- **作用**：控制画面动态度与稳定性之间的权衡。运动控制在不同平台的形态不同：Stability 的 Stable Video Diffusion 有 **motion bucket id（运动分桶）**；LTX 在 Multimodal Guider 里提供**时空引导（Spatio-Temporal Guidance）**与提示词遵循度分开调；Kling 用 `camera_control` 显式指定运镜（平移/摇/俯仰/滚动/变焦，各 ±10）。
- **怎么调**：动起来的部分优先写进**提示词动词**（PixVerse 官方："waves crashing, spray rising" 比静态场景描述更能告诉模型什么该动）；LTX 官方调法——画面抖动/时间伪影时**增加 cross-modal sync**，模型不跟提示词时**增加 prompt adherence**，**两者不要同时拉满**；Kling 的 `camera_control` 六选一（一次只做一个方向的运镜）。
- **常见坑**：高运动强度 × 长时长 = 漂移（衔接 118）；把运动写成静态描述（"美丽森林"）模型不知道该动什么；运镜方向写太多（推+摇+升降一起要）。
- **最佳实践**：镜头语言先行（衔接 1）：一个镜头一个主要运镜，动作写动词，运动强度留给模型默认或 ±1 档；动作/追逐镜头一律短片段（衔接 401 追逐场景）。

### 2.7 Negative Prompt（负面提示词）

- **作用**：把"不要什么"显式告诉模型。Diffusers 官方：负面提示词用于移除低质量特征（如 "low resolution"、"bad details"），也可用于删内容或改风格。PixVerse 官方：`negative_prompt` 是压制伪影的专门字段，官方示例为 "blurry, distorted faces, extra limbs, watermark, low quality, jerky motion, morphing, flickering"。
- **怎么调**：Kling API：`negative_prompt` 最长 2500 字符；Together AI：默认不设置，**模型产出多余元素时再设**，推荐起点 "blurry, low quality, distorted, flickering"。
- **常见坑**：① 负面与正面冲突（正面写 "red dress" 负面写 "no red dress" 自相打架）；② 堆几十个词稀释权重——负面清单要短而精准；③ 在**不支持的模型**上硬塞负面词——Veo 3.1 没有负面提示词参数，Kling 官方文档也建议"用正面提示中的否定句补充负向信息"。
- **最佳实践**：按缺陷类别写（详见第 4 节清单）；生成后抽帧对照缺陷（衔接 174），命中哪类补哪类词，别一次全上。

### 2.8 Style Strength / 风格强度（风格权重与风格预设）

- **作用**：控制风格对输出的支配力。两个载体：**风格预设**（PixVerse 官方：anime / 3d_animation / clay / comic / cyberpunk 五档）与**风格参考图权重**（图生视频中风格参考图对输出染色的强度）。
- **怎么调**：风格预设适合批量生产——同系列所有镜头用同一预设即天然统一画风（衔接 408 风格锚）；风格参考权重：调高 → 风格强烈但可能压掉内容细节，调低 → 只染一层味道；Stability SDK 另有 `style_preset`（摄影/美术风格枚举）。
- **常见坑**：把风格全押在提示词形容词上、不锁风格参考（每次换形容词 = 换一部片）；不同镜头用不同风格描述导致画风漂移（408 铁律：一个项目一种画风体系）；风格权重拉满把主体特征盖掉。
- **最佳实践**：**内容与风格分开控**——先定主体与动作（内容通道），再叠风格参考/预设（风格通道），权重固定逐镜复用；品牌项目把风格权重写进资产卡（衔接 131 资产库）。

### 2.9 参考权重（Reference / Strength — 图生视频忠实度）

- **作用**：图生视频时，在"忠实于参考图"与"运动自由度"之间取平衡。参考图可以是首帧、尾帧、角色、场景或风格图（衔接 407 四类参考）；Kling API 的 `cfg_scale` 在 I2V 中即承担"与输入提示相关性"的角色（[0,1]，默认 0.5）；Stability img2img 用 `start_schedule`/`end_schedule`（即 strength，越接近 1 越忠实原图）。
- **怎么调**：忠实度越高 → 图像保持越好但运动越少；越低 → 运动自由但容易跑脸、跑物。PixVerse 官方警告：**运动提示不要与源图构图矛盾**（图里人物朝左，别提示向右转身），矛盾会产生伪影；Seedance 实操："用参考帧锁定造型（哪怕是粗略帧），再谈升质量档"。
- **常见坑**：把参考权重调满当"锁死"用——它锁构图与身份、锁不住动态；多张参考图互相矛盾（408：参考集必须同一身份同一套服装）；参考图分辨率/画幅与目标不符（Sora：输入图必须匹配目标 `size`）。
- **最佳实践**：角色/场景/风格分参考通道提交（Kling `contents[].type` 支持 prompt/first_frame/last_frame/element）；每镜参考权重固定，只改运动提示；首尾帧锁定两端点（衔接 407）。

### 2.10 FPS 与质量档位（帧率 & Quality/Speed Mode）

- **作用**：流畅度与成本档位。Veo 3.1 固定 24fps 输出；Together AI 的 `fps` 范围 15-60（默认 24）；LTX 建议 48-50fps 捕捉细微运动、后期再降格；Kling `mode` 分 `std`(720p)/`pro`(1080p)/`4k` 三档。
- **怎么调**：帧率由交付平台决定（YouTube 24、社媒 30/60，衔接 112 交付规格）；质量档位放进"草稿→定版"流程——Seedance 实测：**草稿用快档，用参考帧锁定造型后再升质量档**，否则"升质量只是把问题变清晰"。
- **常见坑**：草稿阶段开最高质量档（贵、慢、还把意图问题放大）；帧率后期重做；"低档快出"直接当交付件。
- **最佳实践**：低档定意图（构图/动作/节奏）→ 高档锁细节（纹理/面部/稳定）→ 按交付规格输出（衔接 174 质检门控）。

## 3. 参数组合策略：一致性 / 运动 / 质量

参数不是孤立调的，**按镜头目标配组合**。三个目标对应三套默认配置：

| 目标 | 关键参数组合 | 组合逻辑 | 典型配置（示例） |
|---|---|---|---|
| 一致性优先（多镜/系列） | 锁 seed + 固定参考权重 + 固定风格预设 + 短时长 + 中低 CFG | 锚点逐镜复用（衔接 408），参数也逐镜复用；只允许镜头块（景别/机位/动作）变化 | seed 固定；CFG 取甜区下沿；时长 ≤8s；首末帧锁定；同批同参数 |
| 运动优先（动作/追逐/特效） | 动词化运动提示 + 短时长 + 更高 steps + CFG 不过高 | 步数平滑运动（LTX：I2V 60-80 步）；CFG 过高会机械感；长片段必然漂移 | steps 上限区间；时长 5-8s；运动提示为主、场景描述从简；必要时拆镜 |
| 质量优先（交付/产品/广告） | 生产 steps + 目标分辨率 + 高质量档 + 中高 CFG + 精简负面清单 | 保细节、保遵循、保品牌色（衔接 395 广告案例）；成本计入（衔接 138/122） | steps 30-40；1080p+ 直接生成；模式 pro/4k；CFG 9-10；色板锚 |

**参数梯度测试（Seedance Settings Sweep，官方实践）**——当镜头出问题时，用五轮扫描定位凶手，纪律是**每轮只变一个变量、同 seed、同提示词、同参考**：

```text
Run A  时长检查：6s vs 10s —— 长段漂移？→ 拆多镜
Run B  画幅检查：目标画幅重跑 —— 构图压力变化？→ 微调提示词（竖屏单主体/宽屏背景锚）
Run C  质量检查：升质量档 —— 瑕疵反而更清晰？→ 不是质量问题，是意图/时长问题
Run D  引导检查：锁 seed，guidance 上调一格（颜色发飘时）/下调一格（运动僵硬时）
Run E  双败回退：两端都不行 → 回默认 guidance + 换一次 seed
```

一次只变一个变量，否则出了问题你永远不知道是哪个参数干的。整轮时间盒约 20 分钟，比盲目重试便宜。

## 4. Negative Prompt 实战

### 写什么：按缺陷类别四类清单

| 类别 | 写什么 | 英文负面词（可直接用） |
|---|---|---|
| 质量类 | 糊、噪、低清、水印 | blurry, low quality, low resolution, pixelated, noisy, grainy, watermark, jpeg artifacts |
| 几何类 | 脸崩、多肢、畸形 | distorted faces, deformed, extra limbs, extra fingers, bad anatomy, disfigured, bad hands |
| 时间类 | 抖动、闪烁、形变 | jerky motion, flickering, morphing, warping, jittery, strobing, frame tearing |
| 内容类 | 多余的物/人/文字/现代元素 | extra objects, unwanted people, text, subtitles, modern elements, logo, timestamp |

（质量类与时间类词条来自 PixVerse v5.5 官方示例 "blurry, distorted faces, extra limbs, watermark, low quality, jerky motion, morphing, flickering" 与 Diffusers 官方示例 "ugly, deformed, disfigured, poor details, bad anatomy"；Together AI 官方起点 "blurry, low quality, distorted, flickering"。）

### 不写什么

- **与正面冲突的词**：正面要 "red dress"，负面写 "no red dress"，模型无所适从。
- **堆砌同义近义词**：30 个词 ≈ 10 个词的模糊版本；负面清单要短、分主次（最先出现的权重最高）。
- **不该删的内容词**：Diffusers 官方示例里 negative_prompt = "astronaut" 会把主体删掉——负面提示词不是"反向提示"，是"伪影过滤器"。想改内容，改正面提示词。

### 平台差异

- **有专门字段**：Kling（≤2500 字符）、Together、PixVerse 支持 `negative_prompt`。
- **没有字段**：Veo 3.1 无负面提示词参数 → 用正面否定句（"no watermarks, steady camera"）；Kling 官方也建议在正面提示里补否定句，与负面字段互补。
- **注意**：负面词也可能压掉期望内容（过强的 "morphing" 会让变形动画失效），按镜头类型选用。

### 分场景负面模板

```text
写实人物镜：
  blurry, distorted face, extra fingers, bad hands, morphing,
  flickering, watermark, low quality
动作/追逐镜（衔接 401）：
  jerky motion, jittery, motion blur smearing, warping,
  extra limbs, disappearing objects, watermark
产品/广告镜（衔接 395）：
  blurry, distorted logo, color banding, reflection artifacts,
  flickering highlights, watermark, text artifacts
```

### 生成后检查（衔接 174 质检 / 118 缺陷）

抽首/中/末三帧目检 → 命中哪类缺陷补哪类词 → 一次只加 1-2 个词重跑 → 三次无效就换修复路径（参考图/首尾帧/短时长，衔接 118 六类失败模式），**别无限堆负面词**。

## 5. Seed 复现与迭代

### 锁 seed 做受控比较

Together AI 官方把固定 seed 列为复现与公平对比的标准做法（"Set seed to a fixed integer"——用于评测与回归测试）。同 seed + 同提示词，**只改一个参数**，跑出来的差异就是那个参数的真实影响——这是第 3 节梯度测试的前提。

### 80% 法则（PixVerse 官方）

> 当一次生成 80% 正确时，**锁住 seed，只改提示词**。保住已经满意的部分（构图、光线、动作），定向修正剩下的 20%，而不是推倒重抽。

### 漂移时怎么修（Seedance 官方决策规则 + Veo 官方提示）

```text
锁 seed 后仍出问题 →
  ① 头两秒就晃 → 重拍：缩短时长、减少动作件数、改写开场节拍（早期不稳不会自愈）
  ② 脸/logo 跨帧变形 → 拆场景，别用质量档硬顶（只会把恐怖谷变清晰）
  ③ 光线闪烁 → 提示词锚定"一个光源、一个表面"（"single soft key from left on matte wall"），
     再不行就缩短片段或换角度——闪烁常常是构图问题不是滑块问题
  ④ 手总崩 → 避免复杂手势，写 "hands at rest"，需要展示动作就单独补特写镜
  ⑤ 锁 seed 仍色偏 → 刷新 seed + 加色彩锚（"muted palette" 或品牌 hex）
  ⑥ 模型/平台更新 → 同 seed 输出必然漂移（Veo 官方：seed 只"略微改善"确定性），
     接受版本漂移，以新基线重新锁 seed
```

### 参数卡（每镜的元数据）

生成时同步记录参数卡，作为复现、回退与 QC 的输入（衔接 174、408 场景卡）：

```json
{
  "shot_id": "S03-04",
  "model": "kling-v2-6",
  "prompt_hash": "a1b2c3",
  "seed": 882341,
  "cfg_scale": 0.5,
  "steps": 30,
  "resolution": "1080p",
  "duration": "6",
  "mode": "pro",
  "negative_prompt": "blurry, distorted face, flickering",
  "reference": {"first_frame": "ref/S03-04-a.png", "weight": "locked"},
  "generated_at": "2026-08-18T10:22:00Z",
  "status": "draft"
}
```

## 6. 常见错误表

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 不记 seed | 满意结果无法复现 | 每次生成落参数卡（第 5 节） |
| 同时改多个参数 | 出问题不知道是谁干的 | 一次只变一个变量（梯度测试） |
| CFG 拉满"让模型听话" | 过饱和、机械感、抖动（衔接 118） | 先改提示词；CFG 只微调；I2V 用低 CFG |
| 步数拉满 | 成本非线性上升、收益递减 | 预览 10 → 生产 30-40；查模型官方步数表 |
| 低分辨率生成后 upscale 当 4K | upscaler 伪影与模糊 | 直接按目标分辨率生成（LTX 官方） |
| 画幅后期再改 | 构图重做、空间关系失效 | 开工第一天定画幅（衔接 198） |
| 一镜贪时长（>10-12s） | 中途换装、角色漂移 | 首轮 6-8s；长需求拆段/extension |
| 高运动 × 长时长 | 画面崩塌 | 动作镜头短片段 + 动词化运动提示 |
| 负面与正面冲突 / 堆词 | 模型无所适从、权重稀释 | 四类清单短而精准，一次加 1-2 词 |
| 照搬别的模型的数值 | Kling 0.5 与 SD 7.0 是两个世界 | 先查该模型官方区间与默认值 |
| 参考图与目标分辨率/构图矛盾 | upsampling 伪影、运动冲突 | 参考图按目标 size 准备（Sora 官方） |
| 草稿阶段开最高质量档 | 贵、慢、把问题放大 | 低档定意图 → 高档锁细节 |
| 锁 seed 当"保险" | 模型/平台更新后照样漂移 | seed 只做受控比较，不承诺跨版本确定性（Veo 官方） |

## 7. 工作流应用（AI 编排）

### 参数库 → 参数卡 → 梯度 → 门控

```text
参数基线库（按 模型 × 场景 固化官方区间与默认值，衔接 114 模型矩阵）
  → LLM 按镜头表装配参数卡（seed 分配 + CFG/steps 档位 + 负面清单 + 参考通道）
  → 批次生成（同批同参数基线，衔接 408）
  → 抽帧 QC 门控（174：缺陷检测 + 连续性清单）
  → 通过入剪辑库 / 失败 → 梯度测试（一次一个变量）→ 回退参数卡或重锁基线
```

**DirectorX 纪律**：参数与提示词同等重要——锚点资产库锁"内容"，参数卡锁"行为"；同一场戏的所有镜头共享参数基线，只有镜头块（景别/机位/动作）变化；任何参数改动都走一次受控梯度测试，不凭感觉拍脑袋。

### AI 理解与实现：参数顾问提示词模板

```text
你是一位 AI 视频生成参数顾问，服务 DirectorX 视频生成工作流。
规则：
1. 只给出该模型官方文档支持的参数与数值区间，不编造不存在的参数；
2. 回答任何调参问题都按"作用 → 怎么调（含官方区间）→ 常见坑 → 最佳实践"四段式；
3. 当目标不一致（如既要长镜头又要高运动）时，指出参数冲突并给出取舍建议；
4. 生成后检查时，按缺陷类别（质量/几何/时间/内容）归因，先建议改提示词或参考图，
   参数只做末位调整。

当前任务参数卡：{shot_id} {model} {seed} {cfg_scale} {steps} {duration} {negative_prompt}
生成结果抽帧反馈：{QC 反馈，如"面部在第 4 秒漂移、背景闪烁"}
请给出：① 问题归因 ② 下一轮参数调整建议（只列要改的 1-2 个）③ 若参数无法解决，
指出应改用提示词/参考图/拆镜中的哪条路径。
```

### 生成后检查与修复清单（每镜过检）

| 检查项 | 看什么 | 参数层修复 |
|---|---|---|
| 面部/身份 | 抽帧对比参考图，脸型/服装/痣疤 | 锁 seed + 参考权重不动，改负面词 "morphing"；仍漂 → 拆镜 |
| 时间稳定性 | 快速扫动播放，闪烁/抖动/融化 | 降低 CFG、提高 steps、缩短时长 |
| 运动质感 | 机械感 or 自然；运镜是否符合镜头语言（衔接 1） | CFG 下调、运动提示改动词 |
| 画质 | 颗粒/伪影/模糊 | 升生产 steps、升质量档、确认目标分辨率 |
| 色彩 | 色偏、闪烁高光、品牌色漂移 | 加色彩锚、刷新 seed（Seedance 规则⑤） |
| 构图 | 画幅内主体位置、景别（衔接 231） | 画幅不可后期改；重跑梯度测试 Run B |

## 8. 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 种子 | Seed | 随机初始化控制，复现与受控比较的锚 |
| 引导强度 | CFG Scale / Guidance Scale | 遵循提示词 vs 自由发挥的平衡 |
| 去噪步数 | Steps / Inference Steps | 采样迭代次数，质量与时间一致性 |
| 分辨率 | Resolution | 输出清晰度档位（720p/1080p/4k） |
| 画幅 | Aspect Ratio | 构图比例，决定"取景框压力" |
| 时长 | Duration / Seconds | 单镜长度，模型记忆窗口 |
| 运动强度 | Motion Strength / Motion Bucket | 动态度与稳定性权衡 |
| 时空引导 | Spatio-Temporal Guidance (STG) | 帧间一致性引导（LTX Multimodal Guider） |
| 负面提示词 | Negative Prompt | 显式排除的元素清单 |
| 风格预设 | Style Preset | 平台内置画风档位 |
| 参考权重 | Reference Weight / Strength | 图生视频对参考图的忠实度 |
| 质量档位 | Mode (std/pro/4k) / Quality Tier | 成本-质量档位 |
| 参数卡 | Parameter Card | 每镜生成的元数据契约（衔接 408 场景卡） |
| 参数梯度测试 | Settings Sweep | 同 seed 下一次只变一个变量的对比测试 |
| 时间一致性 | Temporal Consistency | 帧与帧之间的稳定统一（衔接 117） |

## 来源

- Kling AI — Text to Video API：https://kling.ai/document-api/api/video/2-1-master/text-to-video
- Kling AI — Image to Video API（图生视频）：https://kling.ai/document-api/api/video/2-0-master/image-to-video
- OpenAI — Video generation with Sora：https://developers.openai.com/api/docs/guides/video-generation
- Google — Generate videos with Veo 3.1 in Gemini API：https://ai.google.dev/gemini-api/docs/veo
- Together AI — Video generation parameters：https://docs.together.ai/docs/inference/videos/parameters
- PixVerse — v5.5 Prompt Guide: Master Text-to-Video, Image-to-Video & Effects：https://fal.ai/learn/devs/pixverse-v5-5-prompt-guide
- WaveSpeed — Seedance 2.0 Best Settings Guide: Duration, Aspect Ratio, "Quality vs Speed" Tradeoffs：https://wavespeed.ai/blog/posts/blog-seedance-2-0-best-settings/
- LTX — LTX-2.5 Workflow: ComfyUI Video Generation Model Workflow Guide：https://ltx.io/blog/comfyui-workflow-guide
- Hugging Face — Text-to-image (Diffusers docs, guidance scale & negative prompt)：https://huggingface.co/docs/diffusers/main/en/using-diffusers/conditional_image_generation
- Stability AI — stability-sdk（seed / cfg_scale / steps / style_preset / schedule）

## 相关概念

- [AI 视频生成参数进阶（Parameters Tuning — Seed, CFG, Steps, Motion & Settings by Model）](../138-params-tuning/params-tuning.md)
- [参考图与首尾帧实战手册（Reference & First/Last Frame — Control Playbook + AI）](../407-reference-first-last-frame/reference-first-last-frame.md)
- [视频提示词工程总纲（Video Prompt Engineering — Structure, Timing & Control）](../115-video-prompt-engineering/video-prompt-engineering.md)
- [生成缺陷识别与修复（AI Video Artifacts — Diagnose, Fix, Regenerate）](../118-defect-repair/defect-repair.md)
- [AI 成片质检自动化（QC Automation — Artifact Detection & Review Pipeline）](../174-qc-automation/qc-automation.md)
