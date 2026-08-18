---
type: Reference
title: "特效与合成基础（VFX & Compositing）"
description: "特效合成知识库：绿幕拍摄与抠像全流程、VFX 流水线各阶段、抠像关键参数（溢出/边缘/头发）、合成纪律与版本管理、AI 抠像工作流"
tags:
  - "foundation"
  - "workflow"
  - "vfx"
status: stable
generated:
  by: "process:directorx-knowledge-okf"
  at: "2026-08-18T00:00:00Z"
verified:
  - by: "process:knowledge-audit"
    at: "2026-08-18T00:00:00Z"
sources:
  - resource: "cited:Floniks 绿幕抠像工作流"
    id: cite-1
    title: "Floniks 绿幕抠像工作流"
  - resource: "cited:CADA VFX 流水线指南"
    id: cite-2
    title: "CADA VFX 流水线指南"
  - resource: "cited:Frame.io VFX 工作流最佳实践"
    id: cite-3
    title: "Frame.io VFX 工作流最佳实践"
  - resource: "cited:Nuke/达芬奇官方文档要点。"
    id: cite-4
    title: "Nuke/达芬奇官方文档要点。"
  - resource: "https://floniks.com/learn/workflows/green-screen-keying-workflow"
    id: url-1
    title: "floniks.com"
  - resource: "https://cada-edu.com/guides/visual-effects-pipeline-guide-to-vfx-process"
    id: url-2
    title: "cada-edu.com"
  - resource: "https://blog.frame.io/2020/02/17/vfx-workflow-best-practices/"
    id: url-3
    title: "blog.frame.io"
  - resource: "https://learn.foundry.com/nuke/content/comp_environment/keying_with_keylight/basic_keying.html"
    id: url-4
    title: "learn.foundry.com"
  - resource: "https://www.videomaker.com/how-to/shooting/green-screen/6-steps-to-pulling-a-good-key-green-screen-post-production/"
    id: url-5
    title: "videomaker.com"
  - resource: "https://www.adobe.com/creativecloud/video/discover/how-to-use-green-screen.html"
    id: url-6
    title: "adobe.com"
dx_id: "26"
related:
  - "54-thumbnail-cover-system/thumbnail-cover-system.md"
  - "55-global-localization-visual/global-localization-visual.md"
  - "57-hybrid-liveaction-ai/hybrid-liveaction-ai.md"
---

# 特效与合成基础（VFX & Compositing）

> 本页是 DirectorX 特效合成知识库：绿幕拍摄与抠像全流程、VFX 流水线各阶段、抠像关键参数（溢出/边缘/头发）、合成纪律与版本管理、AI 抠像工作流。每个概念含参数与检查清单。
> 来源：Floniks 绿幕抠像工作流、CADA VFX 流水线指南、Frame.io VFX 工作流最佳实践、Nuke/达芬奇官方文档要点。

## 概述

VFX（Visual Effects）流水线是一条**保护下一阶段免受猜测与返工**的链（CADA）：前期定方案 → 现场采对数据 → 后期合成。每个阶段有明确的输入/输出。

**核心认知**：
1. **合成"假"的最大原因不是抠像边缘，而是光影不匹配**——主体与背景的灯光方向/色温/阴影不一致，像素级完美的边缘也救不了。
2. **VFX 决定要提前**：是否绿幕、是否需要运动控制、是否需要清洁板（Clean Plate）、跟踪标记——拍摄后才发现 = 高价补拍或降质。
3. **版本纪律**：每个镜头记录"改了什么、回应哪条意见、上游哪个更新会影响它"——多人协作的命根子。

## 绿幕拍摄（Green Screen Shooting）

### 拍摄端规范（决定后期难易）
- **绿幕布光均匀**：布光不均 = 后期抠像边缘噪点；照度差控制在最小。
- **主体与幕距离**：≥ 2-3 米，减少绿幕反射（溢出 Spill）到主体上。
- **避免主体穿绿色系衣服**：与键色冲突。
- **运动模糊控制**：快门过快运动模糊重 → 边缘最难抠；按 180° 规则 + 必要时刻意控制。
- **现场必采数据**：
  - Clean Plate（无主体空背景板）——合成时的"地板"；
  - 跟踪标记（Tracking Markers）；
  - 镜头信息（焦距/光圈/传感器）；
  - HDRI 全景 + 灰球/铬球（灯光重建参考）；
  - 参考照片（环境/道具/服装）。
- **运动控制（Motion Control）**：需要精确重复机位时使用（复杂合成）。

## 抠像（Keying）全流程

### 流程顺序（Floniks 参考）
1. **预处理（Source Prep）**：
   - 降噪（Denoise）0.3 强度——背景噪声会让抠像边缘"毛"；
   - 溢出修正（Spill Correction）0.6 强度、只作用于边缘过渡区——过度抑制会把前景整体去饱和；
2. **抠像（Key）**：生成 Alpha 遮罩（白=前景、黑=背景、灰=半透明边缘）。
3. **边缘优化**：
   - 边缘羽化（Edge Feather）：1080p 下 3-5 像素是写实合成标准；发丝区 6-8 像素；
   - 发丝细节（Hair Detail）：单独的高分辨率边缘分析——头发/飞丝是抠像最大难点；
4. **背景生成**：按**灯光分析结果**生成匹配背景（方向/色温/阴影）。
5. **合成（Composite）**：前景按 Alpha 叠背景 + 边缘整合（防光晕）。
6. **色彩统一（Color Integration）**：两层的饱和度差/阴影暖度/中间调对比对齐——"说不清但觉得对"的关键。
7. **导出**：需要继续合成 → 带 Alpha（ProRes 4444）；交付 → ProRes 422 HQ / H.264 16Mbps。

### 关键参数速查
| 参数 | 建议值 | 说明 |
|---|---|---|
| 降噪强度 | 0.3 | 更高会软化脸部细节 |
| 溢出抑制 | 0.6（边缘区） | 过度=前景整体去饱和 |
| 检测灵敏度 | 0.75 起步 | 高=果断但可能剪发丝 |
| 边缘羽化 | 3-5px（1080p）；发丝 6-8px | 0=假边缘 |
| 灯光匹配 | 方向/色温/阴影一致 | 合成真实的第一杠杆 |

## VFX 流水线阶段（CADA）

### 前期（Pre-production）
1. **R&D 与技术规划**：可行性测试（跟踪/模拟/合成在测试板上验证）→ 定帧率/色彩管理/文件格式/版本流转规则；
2. **分镜与动态分镜**（见 25 文档）；
3. **概念设计**：定视觉目标（造型/材质/环境）——建模/贴图/合成的统一参照；
4. **预演 Previs**：粗 3D 验证运镜/调度/时序；
5. **布局与美术**：实景与 CG 边界、交互光位置、反射面；
6. **参考摄影**：HDRI、灰球/铬球、测量、镜头记录。

### 拍摄期（Production）
- VFX 监制（VFX Supervisor）贴近摄影组——现场小决定影响数周后期；
- 3D 建模/贴图/预合成可与拍摄并行；
- 关键纪律：标记放对、Clean Plate 采全、镜头信息记录——**现场几分钟 vs 后期几周**。

### 后期（Post）
1. **跟踪 Match Move**：重建虚拟摄影机（镜头行为+移动）——跟踪差一点，后续全错；
2. **动画**：CG 元素动作与实拍锁死（脚不滑、手不飘）；
3. **模拟 FX**：物理规则运动（先稳定布局与动画再模拟）；
4. **贴图/灯光/渲染**：CG 匹配实拍灯光与相机响应；采样/噪点/运动模糊平衡；
5. **合成 Compositing**：全部元素合一——色彩/对比/颗粒/边缘行为匹配；
6. **Roto 与遮罩**：分离画面区域（前景遮挡/背景替换）——边缘要匹配景深（浅景深用软边）。

## 合成纪律（Compositing Discipline）

- **先静后动**：单帧满意后再检查运动中的匹配（运动是合成真相）；
- **颗粒与噪点**：CG 元素必须匹配实拍的颗粒/噪点等级——"干净"的合成反而假；
- **色彩管理**：全程统一色彩空间（避免"看起来对、导出就变"）；
- **版本控制**：每次修改存版本 + 记录回应哪条意见；
- **审看环境**：在目标设备/亮度环境审看（避免工作室暗房里"全对"、手机上"全错"）。

### 合成检查清单
```
□ 灯光方向/色温/阴影与背景一致
□ 边缘无光晕、无硬边（羽化正确）
□ 发丝/半透明区域 Alpha 完整
□ 颗粒与噪点等级匹配
□ 运动中的边缘稳定（无抖动/撕裂）
□ 色彩统一（饱和度差/阴影暖度/中间调）
□ 景深匹配（前景与背景虚化一致）
□ 镜头畸变与色差匹配
□ 全片版本可追溯
```

## AI 抠像与合成（2026）

- **AI 抠像**：语义理解场景（识别"什么是人/物体"而非颜色范围）——对溢出、半透明头发、运动模糊边缘的处理优于传统色度键。
- **AI 背景生成**：灯光分析 → 提示词编码（方向/色温/阴影）→ 生成匹配背景。
- **批量合成**：一个前景 + 多个背景（本地化/AB 测试/多区域版本）一次跑完。
- **边界**：AI 生成运动不是 Techvis；复杂合成仍需人工节点把控。

## 在 AI 视频生成中的应用

1. **提示词含灯光一致性**：生成背景时把主体灯光参数写进提示词（`key light upper left, warm 5600K, shadows to the right`）。
2. **AI 换背景工作流**：实拍绿幕/无幕主体 → AI 抠像 → AI 背景 → 色彩统一节点 → 批量出多版本。
3. **生成后合成检查**：AI 合成内容按"合成检查清单"核对（边缘/颗粒/灯光/景深）。
4. **AI 辅助 Roto**：AI 自动转描出遮罩，人精修关键帧。

## 常见错误

1. 布光不均的绿幕：后期抠像地狱。
2. 主体穿绿色/蓝色系：与键色冲突。
3. 没拍 Clean Plate：合成没有"地板"。
4. 溢出不处理或过度处理：边缘绿边或前景发灰。
5. 边缘羽化 0：像素级硬边，一眼假。
6. 只修单帧不看运动：静止漂亮、动起来散架。
7. 灯光不匹配：最大"假"来源。
8. 颗粒不匹配：CG 干净得可疑。
9. 无版本纪律：多人协作崩溃。

## 术语表（中英对照）

| 中文 | English | 一句话定义 |
|---|---|---|
| 视觉特效 | VFX | 数字视觉效果 |
| 合成 | Compositing | 多层合一 |
| 抠像 | Keying | 去除单色背景 |
| 色度键 | Chroma Key | 颜色范围键控 |
| Alpha 遮罩 | Alpha Matte | 透明通道 |
| 溢出 | Spill | 背景色反射到主体 |
| 溢出抑制 | Spill Suppression | 去除反射色 |
| 边缘羽化 | Edge Feather | 边缘柔化 |
| 发丝细节 | Hair Detail | 头发精细抠像 |
| 清洁板 | Clean Plate | 无主体空背景 |
| 跟踪 | Tracking | 重建机位运动 |
| 匹配移动 | Match Move | 虚拟摄影机对齐 |
| 转描 | Rotoscoping | 逐帧描边遮罩 |
| 动态遮罩 | Matte | 分离区域通道 |
| 运动控制 | Motion Control | 精确重复机位 |
| 合成器 | Compositor | 合成师 |
| VFX 监制 | VFX Supervisor | 特效总监 |
| 概念设计 | Concept Art | 视觉目标定义 |
| 参考摄影 | Reference Photography | 灯光/材质参照 |
| HDRI | High Dynamic Range Image | 全景灯光参考 |
| 版本纪律 | Version Control | 修改可追溯 |
| 颗粒匹配 | Grain Match | 噪点等级一致 |

## 来源

- Floniks: A Green-Screen Keying and Compositing Workflow — https://floniks.com/learn/workflows/green-screen-keying-workflow
- CADA: Visual Effects Pipeline — A Complete Guide — https://cada-edu.com/guides/visual-effects-pipeline-guide-to-vfx-process
- Frame.io: The Essential Guide to Building a Successful VFX Workflow — https://blog.frame.io/2020/02/17/vfx-workflow-best-practices/
- Foundry Nuke 官方文档: Basic Keying — https://learn.foundry.com/nuke/content/comp_environment/keying_with_keylight/basic_keying.html
- Videomaker: 6 Steps to Pulling a Good Key — https://www.videomaker.com/how-to/shooting/green-screen/6-steps-to-pulling-a-good-key-green-screen-post-production/
- Adobe: How to use a green screen — https://www.adobe.com/creativecloud/video/discover/how-to-use-green-screen.html

## 相关概念

- [AI 缩略图与封面视觉系统（Thumbnail & Cover Visual System）](../54-thumbnail-cover-system/thumbnail-cover-system.md)
- [多语言出海视觉本地化（Global Localization & Visual Adaptation）](../55-global-localization-visual/global-localization-visual.md)
- [真人+AI 混合制作工作流（Hybrid Live-Action & AI Production）](../57-hybrid-liveaction-ai/hybrid-liveaction-ai.md)
