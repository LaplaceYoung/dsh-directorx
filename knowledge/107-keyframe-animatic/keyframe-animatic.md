# 关键帧与动画预演（Keyframes & Animatic — From Concept Art to Screen）

> 本页知识本体来自真实动画/视效工作室的生产管线：概念图（Concept Art）→ 故事板 → Animatic（预演剪辑）→ 布局（Layout）→ 资产 → 动画 → 光照渲染 → 合成 → 成片。核心论点：**动画和视效从不"文本直出成片"——每一镜在生成前都有确定的关键帧/参考帧/预演**，这正是"生成视频前必须有图参考"的行业依据。
> 来源：RMCAD「Breaking Down the Animation Pipeline」、CG Spectrum「Guide to Animation Pipeline」、Shortfilmcentral「Animation Production Pipeline 2026」、Meshy「Key Stages for 3D Artists」。

## 概述

**核心断言**：真实动画/视效管线的每一镜都经过「视觉参考链」——概念图定义风格、故事板定义构图、Animatic 定义节奏、关键帧/布局图定义镜头内容，**最后才是逐帧动画**。AI 图生视频的"先有图再有动"不是技术限制，而是行业方法论的直接映射。

**核心映射**：Animatic（预演）＝ 分镜 + 时间 + 声音的剪辑雏形；Keyframe（关键帧）＝ 镜头中最具代表性的画面（起/止/高潮状态）；Styleframe（风格帧）＝ 最终画面风格的预览。

## 核心概念

### 动画/视效管线（三阶段 + 关键产物）

```
Pre-production（前期）
  Concept Art 概念图 → 定义视觉风格（角色/场景/色彩）
  Storyboard 故事板 → 每镜构图与动作
  Animatic 预演剪辑 → 故事板 + 时间码 + 临时对白/音效的"会动的故事板"
  Styleframes 风格帧 → 单帧最终观感预览（定调色/光照/渲染风格）
Production（制作）
  Layout 布局 → 每镜的摄像机与空间关系
  Asset Creation 资产 → 建模/材质/绑定（角色/场景/道具）
  Animation 动画 → 逐帧表演（关键帧 + 中间帧 inbetweening）
  Lighting & Rendering 光照与渲染 → 光照方案与最终画质输出
Post-production（后期）
  Compositing 合成 → 多层画面合成（前景/背景/特效/角色）
  Edit 剪辑 → 成片
```

### 为什么"先关键帧后成片"是行业铁律

1. **决策成本**：概念/分镜阶段改一帧便宜，动画/渲染阶段改一帧昂贵——关键帧是"便宜时确认视觉"
2. **协作共识**：Animatic 让导演、客户、动画师看同一节奏；风格帧让所有人都知道"最终长什么样"
3. **资产复用**：关键帧锁定构图后，模型/场景/光照按帧搭建，避免返工

## 技巧与示例

### Animatic 的构成（行业标准）

Animatic = 分镜画面 + 时间 + 声音：
- 每个镜头按最终时长摆放（10 秒的镜头在 animatic 里就是 10 秒）
- 临时对白（scratch VO）、临时音效、临时音乐
- 剪辑节奏在此定稿——转场、镜头时长、动作节拍全部在 animatic 阶段验证

### 关键帧的选择（每镜 1-3 张）

- **1 张**：静态构图或简单运动（锁起止一致的镜头）
- **2 张**：起 + 止（运动轨迹明确的镜头——推拉摇移、物体移动）
- **3 张**：起 + 高潮 + 止（表演/动作镜头——sell-the-hit 的接触帧必在关键帧里）

### 风格帧（Styleframe）作为交付物

风格帧是"最终画面的一帧"：光照、调色、材质、渲染风格全部定稿后给客户看。客户在风格帧上签字 = 接受最终视觉方向，之后才批量生产。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 跳过概念图直接做动画 | 风格漂移、大量返工 | 概念图定风格先行 |
| 跳过 Animatic | 节奏错误到后期才暴露 | Animatic 定节奏与时长 |
| 关键帧只给一张 | 运动方向不明确 | 起/止/高潮多帧 |
| 风格未确认就批量生产 | 整批返工 | 风格帧签字后再批量 |
| 文本直出成片（无参考） | 画面不可控、身份漂移 | 每镜先有图参考或详细镜头描述 |

## 工作流应用（AI 映射）

**案例 4「从图片制作短片」与案例 3「一句话生成广告」**的生成门控依据：

```text
分镜（逐镜细化：景别/角度/运镜/构图/打光/表演/时长/转场/音频）
  → 关键帧（每镜 1-3 张：起/止/高潮，用参考图锚定身份与场景）
  → 用户确认关键帧（= 风格帧签字）
  → 图生视频（从关键帧出发，不做文本直出）
  → 逐镜审片（= animatic 的节奏验证）
  → 剪辑合成（= 后期管线）
```

**AI 关键帧纪律**：AI 生成的"关键帧"必须是**镜头中真实出现的一帧**（起/止/高潮状态），不是独立的插画——否则图生视频时身份/构图与关键帧脱节。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 概念图 | Concept Art | 风格定义图（角色/场景/色彩） |
| 故事板 | Storyboard | 逐镜构图 |
| 预演剪辑 | Animatic | 会动的故事板（+时间+声音） |
| 风格帧 | Styleframe | 单帧最终观感预览 |
| 布局 | Layout | 镜头空间与摄像机 |
| 资产创建 | Asset Creation | 建模/材质/绑定 |
| 关键帧 | Keyframe | 镜头代表帧（起/止/高潮） |
| 中间帧 | Inbetween | 关键帧之间的过渡帧 |
| 合成 | Compositing | 多层画面合成 |
| 临时对白 | Scratch VO | 预演用临时配音 |

## 来源

- RMCAD — Breaking Down the Animation Pipeline From Concept to Screen：https://www.rmcad.edu/blog/breaking-down-the-animation-pipeline-from-concept-to-screen/
- CG Spectrum — What is the Animation Pipeline：https://www.cgspectrum.com/blog/guide-to-animation-pipeline
- Shortfilmcentral — What Is the Animation Production Pipeline (2026)：https://www.shortfilmcentral.com/what-is-the-animation-production-pipeline/
- Meshy — Animation Pipeline: Key Stages for 3D Artists：https://www.meshy.ai/blog/animation-pipeline
- LucidLink — 2D vs 3D animation pipeline：https://www.lucidlink.com/blog/animation-pipeline