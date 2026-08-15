# AI 镜头语言生成专项（Shot Language Generation — Camera, Movement & Framing Prompts）

> 本页为 AI 视频镜头语言生成技巧库：镜头类型（景别）提示词、12+ 相机运动提示词（推/拉/摇/移/环绕/手持/航拍）、公式化结构（主体+动作+运动+光照+风格）、每镜 1-2 个运动的纪律。知识本体来自 2026 AI 相机控制指南（Kling/LetsEnhance/Media.io/ATLabs/Seedance）。AI 应用面向 DirectorX：逐镜提示词的镜头语言层（衔接 81 镜头语法、109 镜头表、115 六段式）。
> 来源：Kling「Guide to AI Camera Control」、LetsEnhance「12 Essential Camera Movements for AI Video」、ATLabs「42 Cinematic Camera Movement Prompts」、Seedance 2「Camera Movement Prompt Guide」、Media.io「Camera Movement Prompts」。

## 概述

**核心断言**：AI 视频的镜头语言要**显式声明**——不写运动，模型默认乱动或静止；写清楚（类型+方向+速度+平滑度），运动才可控。**每镜 1-2 个运动**是防漂移铁律（衔接 49 一镜一主运动）。

## 核心概念

### 镜头类型（景别）提示词

| 景别 | 提示词 | 用途 |
|---|---|---|
| 远景 | establishing wide shot | 场景建立 |
| 全景 | wide shot / full shot | 全身/空间 |
| 中景 | medium shot / medium close-up | 对话/动作 |
| 特写 | close-up | 情绪/细节 |
| 大特写 | extreme close-up | 眼睛/手/物件 |

### 12+ 相机运动提示词（含速度与平滑度）

| 运动 | 提示词 | 要点 |
|---|---|---|
| 推 | slow dolly in | 速度/平滑度显式 |
| 拉 | slow dolly out | 结束构图预想 |
| 摇 | slow pan left/right | 方向显式 |
| 俯仰 | tilt up/down | 揭示动作 |
| 环绕 | 360 orbit / orbit around subject | 主体锁定 |
| 手持 | handheld / shaky | 纪实感 |
| 跟踪 | tracking shot | 跟随主体 |
| 航拍 | drone / aerial | 俯瞰 |
| 升降 | crane / vertical move | 高度变化 |
| 移焦 | dolly zoom | 希区柯克变焦 |
| 过肩 | over-the-shoulder | 对话 |
| POV | point of view | 主观视角 |

## 技巧与示例

### 公式化结构（Kling/Seedance）

```
Subject + Action + Movement + Lighting + Style
主体 + 动作 + 运动 + 光照 + 风格
```

**示例**：
```
"女模特走在霓虹街，慢速跟拍，中近景，电影感照明，写实运动"
"影棚人像，360° 环绕，手持，特写，粗粝质感，低饱和调色"
```

### 三层运动系统（Seedance）

1. **基础运动**：pan/zoom/dolly/orbit
2. **情绪修饰**：slow/gentle/smooth（缓）/ abrupt/jerky（急）
3. **组合**：dolly-in + orbit（推镜+环绕）、tracking + tilt

**纪律**：1-2 个运动/镜——运动越多越易漂移；复杂组合拆镜或靠后期。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 不写运动 | 模型乱动 | 运动显式声明 |
| 运动方向不写 | 随机方向 | 方向/速度/平滑显式 |
| 一镜堆多个运动 | 漂移/变形 | 1-2 个运动/镜 |
| 忽略景别 | 构图失控 | 景别先行 |
| 运动与叙事无关 | 炫技无意义 | 运动服务叙事 |

## 工作流应用（AI 映射）

镜头语言层 = 镜头表（109）的生成翻译：

```text
镜头表（景别/角度/运动/光照/主体动作）
  → 公式化提示词（主体+动作+运动+光照+风格）
  → 运动显式（类型+方向+速度+平滑）
  → 1-2 运动纪律
  → 生成 → 对照镜头表审查（111）
```

**DirectorX 纪律**：逐镜提示词必须含景别与运动声明；静态镜头明说；运动服务叙事。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 景别 | Shot Size | 取景范围 |
| 推拉摇移 | Dolly/Pan/Tilt | 基础运动 |
| 环绕 | Orbit | 绕主体运动 |
| 手持 | Handheld | 纪实感 |
| 航拍 | Drone/Aerial | 俯瞰 |
| 移焦变焦 | Dolly Zoom | 希区柯克变焦 |
| 过肩 | Over-the-Shoulder | 对话镜头 |
| 主观视角 | POV | 第一人称 |

## 来源

- Kling — Guide to AI Camera Control: Angles & Movements：https://kling.ai/blog/ai-camera-control-movement-prompts-guide
- LetsEnhance — 12 Essential Camera Movements for AI Video：https://letsenhance.io/blog/all/ai-video-camera-movements/
- ATLabs — Make Better AI Videos: 42 Cinematic Camera Movement Prompts：https://www.atlabs.ai/blog/make-better-ai-videos-42-cinematic-camera-movement-prompts
- Seedance 2 — Camera Movement Prompt Guide：https://seedance2.so/blog/ai-video-camera-movement-prompt-guide
- Media.io — AI Video Camera Movement Prompts：https://www.media.io/ai/explore/zone/ai-video-camera-movement-prompts