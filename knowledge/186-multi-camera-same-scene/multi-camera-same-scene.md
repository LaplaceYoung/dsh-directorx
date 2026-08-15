# AI 多机位同场景生成（Multi-Camera Same Scene — Coverage Grid & Scene-Consistent Angles）

> 本页为 AI 多机位同场景生成：参考图锁定（全角度共享）、机位感知提示词（距离/镜头）、分镜网格规划（Coverage Grid）、虚拟多机位（Stable Virtual Camera）、3D 场景提示（3DScenePrompt）。知识本体来自 2026 多机位指南（Invideo/Sunra/Sony/Stability AI）。AI 应用面向 DirectorX：覆盖拍摄（衔接 171 连续性、183 参考、40 分镜、48 多机位）。
> 来源：Invideo「How to Create Multi-Angle Shots」、Sony「3DScenePrompt: Scene-Consistent Camera-Controllable Video」、Stability AI「Stable Virtual Camera」、Sunra「Multi-Camera AI Videos」。

## 概述

**核心断言**：多机位同场景 = **"一个场景拍多个角度"的一致性工程**——锁定参考图供全角度共享，机位感知提示词控制距离/镜头，分镜网格（Coverage Grid）规划保障连续性。2026 进展：虚拟多机位（多视角扩散模型把 2D 变 3D 视频）与 3D 场景提示（任意长度输入 + 精确相机控制 + 场景一致）。

## 核心概念

### 三要素（Invideo 三步法）

```
① 参考图锁定（全角度共享身份，183）
② 机位感知提示词（距离/焦段/角度，178）
③ 分镜网格规划（Coverage Grid：每角度一行）
```

### 覆盖网格（Coverage Grid）

| 镜头 | 机位 | 景别 | 一致性锚点 |
|---|---|---|---|
| Master | 正面全景 | 全 | 参考图 |
| A 特写 | 左侧 | 近 | 参考图 |
| B 特写 | 右侧 | 近 | 参考图 |
| OTS | 过肩 | 中 | 参考图 |

## 技巧与示例

### 多机位工作流（Sunra）

```text
参考图锁定（183 多角度锚定）
  → 覆盖网格规划（171 轴线/视线）
  → 逐机位生成（机位感知提示词）
  → 一致性检查（117：光/色/主体/服装）
  → 编辑组装（覆盖剪辑）
```

### 虚拟多机位（Stable Virtual Camera）

多视角扩散模型：2D 图像 → 3D 视频（深度/透视真实）——**无需重建的单源多机位**（衔接 160 空间视频）。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 无共享参考 | 各角度身份漂移 | 参考锁定 |
| 网格不规划 | 覆盖不全 | Coverage Grid |
| 忽视轴线 | 跳轴（171） | 机位单侧 |
| 光色不一致 | 拼接感 | 光色统一（170/141） |
| 单镜头硬拆 | 运动不接 | 逐机位生成 |

## 工作流应用（AI 映射）

覆盖拍摄（衔接 40/48/171/183）：

```text
参考锁定（183）→ 覆盖网格（171 轴线）
  → 逐机位生成 → 一致性检查（117）
  → 组装（覆盖剪辑）→ 交付
```

**DirectorX 纪律**：共享参考保身份；网格规划全覆盖；轴线固定防跳；光色统一无拼接。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 覆盖网格 | Coverage Grid | 机位规划表 |
| 虚拟多机位 | Virtual Multi-Cam | 2D→3D 多视角 |
| 机位感知提示 | Camera-Aware Prompt | 距离/镜头控制 |
| 多视角扩散 | Multi-View Diffusion | 3D 一致性生成 |
| 场景一致 | Scene-Consistent | 跨角度统一 |
| 单源多机位 | Single-Source Multi-Cam | 一图多角度 |

## 补充：多场景系列叙事（Multi-Scene Series — Visual Storytelling Sequences）

> 来自 254-multi-scene-series。核心：场头式提示词 + 一致性骨架，5-6 图故事流，叙事图提示（ICCV）。

### 场头式提示词（每帧）

```text
[角色描述] + [地点] + [时段] + [机位]
+ [动作] + [情绪基调] + [风格]
```

### 叙事图提示（Narrative Graph，ICCV）

场景关系建模（顺序/因果）→ 提示词注入——**叙事连贯性显式化**（衔接 253 行动元：图级结构）。

### 序列叙事工作流

```text
故事线（5-6 图）→ 叙事图（顺序/因果）
  → 每帧场头提示词（238 DNA+场景）
  → 逐帧生成（帧链 238）
  → 一致性/情绪弧校验（158）
```

### 情绪弧跨帧

5-6 帧情绪递进（平静→冲突→解决）——**序列 = 情绪曲线可视化**（衔接 158 情绪曲线、150 结构）。

### 序列叙事术语

| 中文 | English | 说明 |
|---|---|---|
| 场头式提示 | Slugline-Style Prompt | 每帧结构 |
| 叙事图 | Narrative Graph | 因果建模 |
| 序列叙事 | Sequence Storytelling | 多图故事 |
| 情绪弧跨帧 | Arc Across Frames | 递进曲线 |
| 环境过渡 | Environment Transition | 场景衔接 |
| 帧链 | Frame Chain | 连续性 |

### 序列叙事来源

- ICCV 2025W — Generating Visually Consistent Images via Narrative Graph Prompting：https://openaccess.thecvf.com/content/ICCV2025W/AISTORY/papers/Shin_Generating_Visually_Consistent_Images_for_Storytelling_via_Narrative_Graph_Prompting_ICCVW_2025_paper.pdf
- Dreamina — Best AI Image Generators for Visual Storytelling：https://dreamina.capcut.com/ai-image/most-recommended-ai-image-generators-visual-storytelling
- GudPrompt — Visual Storytelling Prompts for AI Image Generation：https://gudprompt.com/p/visual-storytelling-prompts-fo-32996113
- SmartAIEdits — Scene-by-Scene AI Prompting：https://www.smartaiedits.com/guides/scene-by-scene-prompting/
- Promptolis — AI Storyboard + Comic Prompts Pack（McCloud/Eisner）：https://promptolis.com/originals/ai-storyboard-comic-prompts-pack/

## 补充：杂交场景沉浸系列（Hybrid Scene Immersive Series — Governance & Cross-Model Consistency）

> 来自 326-hybrid-scene-immersive-series。核心：视觉身份治理 + 跨模型风格一致 + 模块化世界建构。

### 治理三件套（ReelMind）

```
① 中央风格指南（跨模型）
② 可复用资产库（131）
③ 记忆/场景连贯系统（123 场景卡）
```

### 风格嵌入签名（Variety）

Style Embedding Signature 跨模型保视觉保真（Nippon TV 案例）——**"AI+真人共创"**。

### 模块化世界（McKinsey）

角色/世界连续性跨集（模块构建）——**"世界是积木"**（衔接 143 工业化）。

### 杂交系列工作流

```text
杂交场景（314）→ 风格嵌入签名 → 资产库
  → 连贯系统（123）→ 跨集生成
  → 连续性校验
```

### 杂交系列术语

| 中文 | English | 说明 |
|---|---|---|
| 风格嵌入签名 | Style Embedding Signature | 跨模型保真 |
| 视觉身份治理 | Visual Identity Governance | 中央指南 |
| 模块化世界 | Modular World Building | 积木构建 |
| 跨集连续性 | Cross-Episode Continuity | 记忆系统 |
| 记忆连贯 | Memory Coherence | 场景卡 |
| 人类-AI 共创 | Human-AI Co-Creation | 混合制作 |

### 杂交系列来源

- Variety — Tokyo Miko Ninja: Human-AI Co-Creation：https://variety.com/2026/tv/news/tokyo-miko-ninja-nippon-ai-human-creativity-blend-1236692030/
- McKinsey — How AI Could Reinvent Film and TV Production：https://www.mckinsey.com/capabilities/tech-and-ai/our-insights/tech-forward/how-ai-could-reinvent-film-and-tv-production
- ReelMind — Visual Identity Across Multiple AI Models：https://reelmind.ai/blog/the-visual-identity-achieving-style-consistency-across-multiple-ai-trained-models
- LongStories — Design AI Characters for Series：https://longstories.ai/blog/design-ai-characters-series
- Inkitt — Ironblood: Fully AI-Generated Slate：https://finance.yahoo.com/technology/ai/articles/inkitt-launches-ironblood-proving-ai-160000601.html

<!-- merged from: #254-multi-scene-series -->
<!-- merged from: #326-hybrid-scene-immersive-series -->

## 来源

- Invideo — How to Create Multi-Angle Shots in 3 Simple Steps：https://invideo.io/blog/how-to-create-multi-angle-shots/
- Sony AI — 3DScenePrompt: Scene-Consistent Camera-Controllable Video Generation：https://ai.sony/publications/3d-scene-prompting-for-scene-consistent-camera-controllable-video-generation
- Stability AI — Introducing Stable Virtual Camera：https://stability.ai/news-updates/introducing-stable-virtual-camera-multi-view-video-generation-with-3d-camera-control
- Sunra — How to Create Multi-Camera AI Videos：https://sunra.ai/blog/ai-video-multi-camera-editing-guide
- ReelMind — AI-Assisted Camera Angles: Virtual Multi-Cam Setup：https://reelmind.ai/blog/ai-assisted-camera-angles-virtual-multi-cam-setup-from-single-source