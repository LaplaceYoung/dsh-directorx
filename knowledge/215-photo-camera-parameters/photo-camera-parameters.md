# AI 图片摄影参数提示词（Photographic Parameters — Aperture, Shutter, ISO & Lens in Prompts）

> 本页为 AI 图片生成的摄影参数提示词：相机参数进提示词（光圈/快门/ISO/焦段）、真实感七要素、提示词结构（主体+机位+镜头+参数+光线+场景+真实感）、分场景参数配方。知识本体来自 2026 摄影提示词指南（QuestStudio/Overchat/Imagera/Text2Img）。AI 应用面向 DirectorX：图片生成（衔接 33 图片提示词、178 焦段、176 景深、177 快门、216 构图）。
> 来源：QuestStudio「Best Camera Settings for AI Image Prompts」、Imagera「Best Prompts for Realistic AI Images 2026」、Overchat「How to Make Realistic AI Photos」、Text2Img「2026 AI Photorealistic Prompt Tips」。

## 概述

**核心断言**：AI 图片真实感的钥匙 = **相机参数进提示词**——光圈（f/1.8 浅景深/f/8 深焦）、快门（1/200s 凝固/1/30s 动态模糊）、ISO（100 干净/3200 颗粒）、焦段（85mm 人像/24mm 广角）——**参数化描述让"AI 画"变成"像照片"**（衔接 177：快门规则的图片版；176：景深）。

## 核心概念

### 相机参数提示表

| 参数 | 效果 | 提示示例 |
|---|---|---|
| 光圈 | 景深控制 | f/1.8 浅景深 / f/8 深焦 |
| 快门 | 运动表现 | 1/200s 凝固 / 1/30s 模糊 |
| ISO | 噪点颗粒 | ISO 100 干净 / 3200 颗粒 |
| 焦段 | 透视压缩 | 85mm 人像 / 24mm 广角 |
| 白平衡 | 色温 | 暖/冷/中性 |

### 提示词结构（Imagera 配方）

```text
主体 + 机位 + 镜头/焦段 + 光圈 + 景深 + 快门 + ISO
+ 光线 + 场景 + 真实感关键词
```

## 技巧与示例

### 分场景参数配方

| 场景 | 配方 |
|---|---|
| 人像 | 85mm, f/1.8, 浅景深, 自然窗光 |
| 产品 | 100mm, f/8, 全清晰, 影棚柔光 |
| 街拍 | 35mm, f/4, 1/250s, 环境光 |
| 夜景 | 50mm, f/2, ISO 3200, 霓虹 |

### 真实感七要素（Overchat）

材质准确、微细节、色彩分级、白平衡、胶片质感、景深、运动模糊——**"看起来像照片"的检查单**（衔接 179 材质）。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 无参数 | 塑料感 | 参数化 |
| 参数互相矛盾 | 物理错 | 参数自洽 |
| 只用"真实"词 | 无效 | 具体参数 |
| 忽略白平衡 | 色偏 | 色温指定 |
| 无真实感检查 | 还是画 | 七要素校验 |

## 工作流应用（AI 映射）

图片生成（衔接 33/176/177/179）：

```text
场景判定 → 参数配方（光圈/快门/ISO/焦段）
  → 提示词结构化 → 生成
  → 真实感七要素校验 → 修正
```

**DirectorX 纪律**：参数进提示词；配方分场景；参数自洽；七要素校验。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 光圈 | Aperture | 景深控制 |
| 快门 | Shutter Speed | 运动表现 |
| ISO | ISO | 噪点颗粒 |
| 焦段 | Focal Length | 透视压缩 |
| 白平衡 | White Balance | 色温 |
| 真实感七要素 | Realism Cues | 照片感检查单 |

## 来源

- QuestStudio — Best Camera Settings for AI Image Prompts：https://queststudio.io/blog/best-camera-settings-ai-image-prompts
- Imagera — Best Prompts for Realistic AI Images (2026)：https://imagera.ai/blog/best-prompts-realistic-ai-images-2026
- Overchat — How to Make Realistic AI Photos: Prompts & Examples：https://overchat.ai/ai-hub/how-to-make-realistic-ai-photos
- Text2Img — 2026 AI Prompt Engineering Tips for Photorealistic Images：https://www.text2img.pro/2026-ai-photorealistic-prompt-tips/
- arXiv — Generative Photography: Scene-Consistent Camera Control（2412.02168）：https://arxiv.org/html/2412.02168v2