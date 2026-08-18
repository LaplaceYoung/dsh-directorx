---
type: Method
title: "AI 图片生成提示词手册（AI Image Prompting）"
description: "文生图提示词手册：五层提示词公式、模型差异（Midjourney/SD/Flux）、参数体系、负面提示、风格专项模板、产品图/概念图/人像配方"
tags:
  - "foundation"
  - "prompt"
  - "model"
  - "style"
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
  - resource: "cited:Midjourney 官方参数文档"
    id: cite-1
    title: "Midjourney 官方参数文档"
  - resource: "cited:Apatero 提示词工程指南（6 万+ 张生成经验）"
    id: cite-2
    title: "Apatero 提示词工程指南（6 万+ 张生成经验）"
  - resource: "cited:即梦/豆包中文生态要点。"
    id: cite-3
    title: "即梦/豆包中文生态要点。"
  - resource: "https://docs.midjourney.com/hc/en-us/articles/32859204029709-Parameter-List"
    id: url-1
    title: "docs.midjourney.com"
  - resource: "https://apatero.com/zh/blog/ai-image-prompts-engineering-guide-2026"
    id: url-2
    title: "apatero.com"
  - resource: "https://theaimap.app/how-to-prompt-midjourney"
    id: url-3
    title: "theaimap.app"
  - resource: "https://neodrop.ai/post/dv-vR69ss-R"
    id: url-4
    title: "neodrop.ai"
  - resource: "https://www.youres.cn/post/139.html"
    id: url-5
    title: "youres.cn"
  - resource: "https://blog.51cto.com/u_12227/14741889"
    id: url-6
    title: "blog.51cto.com"
dx_id: "33"
related:
  - "266-cross-media-fusion/cross-media-fusion.md"
  - "115-video-prompt-engineering/video-prompt-engineering.md"
  - "213-copyright-safe-prompting/copyright-safe-prompting.md"
---

# AI 图片生成提示词手册（AI Image Prompting）

> 本页是 DirectorX 文生图提示词手册：五层提示词公式、模型差异（Midjourney/SD/Flux）、参数体系、负面提示、风格专项模板、产品图/概念图/人像配方。每个概念含公式、示例与参数。
> 来源：Midjourney 官方参数文档、Apatero 提示词工程指南（6 万+ 张生成经验）、即梦/豆包中文生态要点。

## 概述

提示词是文生图的 **80%**（Apatero 6 万+ 张生成经验）：模型、参数、硬件都重要，但提示词决定"可记住还是可划走"。

**核心认知**：
1. **提示词是配方，不是愿望**——"cool dragon" 产出 1987 年幻想小说封面；具体描述产出专业画面。
2. **结构 > 长度**：聚焦的 30 词 > 啰嗦的 100 词。
3. **模型各有性格**：Midjourney 吃"氛围"，Stable Diffusion 吃"精确"，Flux 吃自然语言。
4. **词序影响权重**：前置词权重更高（大多数模型）。
5. **迭代是常态**：3-5 轮打磨出终图。

## 五层提示词公式（全模型通用）

```
[媒介/风格 Medium & Style] + [主体 Subject 细节] + [环境 Environment] + [光线/氛围 Lighting & Mood] + [技术/质量 Technical & Quality]
```

### 各层内容与示例词库
| 层 | 内容 | 示例 |
|---|---|---|
| 1 媒介/风格 | 打开艺术宇宙的"开场白"（前置权重最高） | `cinematic film still, anamorphic` / `oil painting, Dutch Golden Age` / `professional food photography` / `isometric 3D render, minimal` |
| 2 主体细节 | 物种/颜色/特征/姿态/道具/视线——"人类画师不用追问就能画" | 毛色+瞳色+坐姿+道具+神情（见下例） |
| 3 环境 | 背景不是后补——建立语境/情绪/纵深 | `sunlit Parisian apartment, tall windows, sheer curtains, wilting sunflowers, long afternoon shadows` |
| 4 光线/氛围 | 同一主体的情绪开关 | `golden hour, warm backlight` / `dramatic chiaroscuro, deep shadows` / `soft diffused overcast` / `neon-lit cyberpunk` / `volumetric fog, god rays` |
| 5 技术/质量 | 画质抛光层 | `8K, highly detailed` / `shot on Hasselblad X2D` / `85mm f/1.4` / `masterpiece, best quality`（动漫系）/ `trending on ArtStation` |

### 公式实战（before/after）
**Before**：`a wizard in a forest`
**After**：
> `Digital fantasy painting, highly detailed. A weathered elderly wizard with a long silver beard and deep-set blue eyes, wearing layered robes of midnight blue and dark green, holding a gnarled oak staff topped with a faintly glowing amber crystal. Standing at the edge of an ancient forest, massive moss-covered trees with twisted roots, soft mist rolling between the trunks, bioluminescent mushrooms dotting the forest floor. Golden hour light filtering through the canopy, volumetric light rays, warm highlights contrasting with cool forest shadows. 8K, intricate detail, fantasy art, trending on ArtStation`

每个词都在干活——没有填充词。

## 模型差异与选择

| 模型 | 性格 | 提示词风格 | 适用 |
|---|---|---|---|
| Midjourney | 吃"氛围/意图"，松耦合 | 自然描述 + 情绪词；参数在末尾（--ar/--s/--sref） | 艺术性、氛围感、快速出图 |
| Stable Diffusion | 吃"精确"，支持权重语法 | `(词:1.3)` 权重、负面提示、ControlNet | 精确控制、可控合成 |
| Flux | 吃自然语言 | 长句自然描述 | 写实、文字渲染 |
| 即梦/豆包/通义 | 中文生态 | 中文描述 + 风格词 + 参考图 | 国内工作流、模板化 |

**关键判断**：要像素级控制 → SD+ControlNet；要创意协作 → Midjourney；要自然语言写实 → Flux。

## Midjourney 参数体系（官方）

**语法**：参数放提示词末尾、与文本间有空格、参数内无标点。
```
vibrant California poppies --ar 2:3
```
| 参数 | 作用 | 说明 |
|---|---|---|
| --ar / --aspect | 宽高比 | `--ar 9:16` 竖屏、`--ar 2.39:1` 宽银幕 |
| --no | 排除 | `--no text, watermark` |
| --s / --stylize | 艺术性强度 | 高=更艺术、低=更贴提示词 |
| --c / --chaos | 变化度 | 高=结果差异大 |
| --seed | 种子 | 固定随机性用于测试对比 |
| --q / --quality | 细节与耗时 | |
| --sref | 风格参考图 | 用一张图锚定风格 |
| --oref | 主体参考（V7） | 人物/物体一致性 |
| --iw | 图片权重 | 参考图影响强度 |
| --v | 版本 | |
| --tile | 无缝平铺 | 纹理/图案 |
| --niji | 动漫/东方美学模型 | |

## Stable Diffusion 高级语法

### 权重（Prompt Weighting）
- `(word:1.3)` = 强调 +30%；`(word:0.7)` = 减弱 30%；
- `((word))` ≈ 1.21x；`(((word)))` ≈ 1.33x；
- 示例：`A portrait of a woman, (freckles:1.4), (red curly hair:1.2), wearing a (vintage floral dress:0.9)`——雀斑突出、衣服弱化。

### BREAK 关键字
- 长提示词按 77 token 分块处理——`BREAK` 强制新块，让结尾重要细节不被稀释：
```
...bioluminescent gardens BREAK golden hour sunlight, volumetric lighting, 8K, matte painting
```

### 负面提示（Negative Prompt）——正确用法
- **10-20 个聚焦词 > 50 个粘贴词**（大负面列表是弱正面提示的拐杖——先修正面）；
- 按失败模式添加：有水印加 `watermark`，多手指加 `extra fingers`；
- 模板：
  - 写实：`deformed, blurry, bad anatomy, extra limbs, poorly drawn face, watermark, text, logo, low quality, jpeg artifacts`
  - 动漫：`worst quality, low quality, bad hands, extra fingers, text, watermark, blurry`
  - 产品：`text, watermark, blurry, distorted, busy background, shadows on product, overexposed`

## 风格专项模板（可直接套用）

### 写实人像
> `Editorial portrait photograph of a man in his late 30s, short dark hair, neatly trimmed beard, charcoal wool turtleneck. Shot in a naturally lit coffee shop, warm ambient light from storefront windows, shallow depth of field with soft bokeh. Captured on Canon EOS R5 with RF 85mm f/1.2 L lens, natural skin texture, subtle film grain, warm color grade, professional retouching`

**为什么有效**：机身/镜头/光圈/后期术语触发摄影训练数据。

### 动漫
> `masterpiece, best quality, 1girl, long flowing silver hair, crimson eyes, detailed face, gentle expression, dark academia uniform with gold trim, vast library with towering bookshelves, warm lamplight, dust particles in light beams, dynamic angle from below, detailed hands, intricate clothing folds, soft cel shading`

**为什么有效**：动漫模型吃逗号分隔的标签式描述（Danbooru 惯例）。

### 概念图/奇幻
- 比例参照（"tiny silhouettes for scale"）、行业术语（`matte painting style`、`environment concept art`）、氛围细节。

### 产品图（可替代棚拍）
> `Professional product photography, luxury perfume bottle with amber liquid, geometric crystal-cut glass design, on polished black marble. Single hero shot, soft studio lighting with one large softbox at 45 degrees, subtle reflection, clean white background transitioning to soft gray gradient, no text, no labels. Medium format camera, 100mm macro lens, f/8, focus stacked, commercial advertising quality`

**关键**：`no text, no labels` 防止乱码文字（产品图最大翻车点）。

## 中文生态（即梦/豆包）要点

- 支持中文自然描述 + 风格词（"国潮插画""赛博朋克""古风水墨"）；
- 常用**参考图**做风格/主体锚定（比纯文字稳定）；
- 模板化提示词：主体+动作+环境+光线+风格+画质，与五层公式同构；
- 注意平台 AI 内容标注要求（见 31 文档）。

## 在视频制作工作流中的应用

1. **分镜图生成**：每个镜头一条五层提示词（景别+角度+构图+光线+风格，见 00 图解集的提示词短语）→ 图生视频（见 14 文档）。
2. **一致性锚定**：角色/场景先用文生图定"identity sheet"，再喂给视频模型（见 39 文档）。
3. **风格测试**：用图片先试风格（低成本），确认后再投入视频生成。
4. **产品/广告素材**：产品图模板直接产出电商主图/广告背景（见 29/38 文档）。

## 常见错误

1. 抽象描述（"beautiful landscape"）：模型填平均值 = 无聊。
2. 只说主体不说构图/光线：主体"漂浮"在随机布局里。
3. 负面提示堆 50 词：稀释重点。
4. 长提示词结尾细节丢失（SD）：用 BREAK。
5. 产品图不写 no text：乱码文字。
6. 一套提示词打所有模型：模型性格不同。
7. 参数乱用（Midjourney 参数位置/空格错误）：静默失效。

## 术语表（中英对照）

| 中文 | English | 一句话定义 |
|---|---|---|
| 提示词 | Prompt | 生成指令文本 |
| 权重 | Weighting | 词级强调语法 |
| 负面提示 | Negative Prompt | 排除项 |
| 种子 | Seed | 随机性固定 |
| 宽高比 | Aspect Ratio | 画幅 |
| 风格化 | Stylize | 艺术性强度 |
| 风格参考 | Style Reference | 图锚定风格 |
| 主体参考 | Character/Omni Reference | 图锚定主体 |
| 参考图权重 | Image Weight | 图影响强度 |
| 分块 | Token Chunking | 77 token 处理 |
| 模型性格 | Model Temperament | 各模型提示词偏好 |
| 媒介层 | Medium Layer | 风格开场白 |
| 技术层 | Technical Layer | 器材/画质词 |
| 写实术语 | Photography Vocabulary | 相机/镜头语言 |

## 来源

- Midjourney 官方: Parameter List — https://docs.midjourney.com/hc/en-us/articles/32859204029709-Parameter-List
- Apatero: AI Image Prompts — Complete Engineering Guide 2026 — https://apatero.com/zh/blog/ai-image-prompts-engineering-guide-2026
- The AI Map: How to Prompt Midjourney (2026) — https://theaimap.app/how-to-prompt-midjourney
- Neodrop: V8.1 提示词公式 — https://neodrop.ai/post/dv-vR69ss-R
- 所思即所见: 豆包 AI 绘图提示词 7 大公式 — https://www.youres.cn/post/139.html
- 51CTO: 即梦 AI 提示词导演方案 6 技巧 — https://blog.51cto.com/u_12227/14741889

## 相关概念

- [AI 图片多媒介融合（Cross-Media Fusion — Photo, Illustration & 3D Blending）](../266-cross-media-fusion/cross-media-fusion.md)
- [视频提示词工程总纲（Video Prompt Engineering — Structure, Timing & Control）](../115-video-prompt-engineering/video-prompt-engineering.md)
- [AI 版权安全提示词（Copyright-Safe Prompting — Genericization & IP Avoidance）](../213-copyright-safe-prompting/copyright-safe-prompting.md)
