# AI 群体场景生成（Crowd Scenes — Density Control & No Duplicate Faces）

> 本页为 AI 群体场景生成：密度控制（Density Modifiers）、群体行为（Collective Behavior）、广角/高角展现涌现模式、重复面孔规避（IC-LoRA/多样角色生成）、程序化生成防重复群众演员。知识本体来自 2026 群体生成指南（LTX/arXiv Gen-C/ReelMind/Morphic）。AI 应用面向 DirectorX：人群镜头（衔接 186 多机位、187 调度、128 特效、201 对应）。
> 来源：LTX「AI Crowd Generation: Prompting Techniques」、arXiv「Gen-C: Populating Virtual Worlds with Generative Crowds」、arXiv「Evaluating Video Models as Multi-Person Simulators」、ReelMind「AI-Generated Crowd Scenes」。

## 概述

**核心断言**：群体场景的"假"来自**重复面孔与无行为逻辑**——2026 解法：密度修饰词（稀疏/密集/摩肩接踵）+ 群体行为描述（集体动作）+ 广角/高角展现涌现 + IC-LoRA 防重复面孔（衔接 186：多机位覆盖的群体版；128：群体特效）。

## 核心概念

### 群体生成三控制

```
① 密度（稀疏/中等/密集：Density Modifier）
② 行为（集体动作：行进/欢呼/慌乱）
③ 取景（广角/高角展现涌现模式）
+ 防重复（IC-LoRA/多样角色生成）
```

### 技术栈（Gen-C）

程序化生成 + 扩散多样角色 + 神经渲染——**避免重复群众演员**（同脸 = 一眼假）。

## 技巧与示例

### 群体生成提示词（LTX-2.3 模式）

```text
"dense crowd filling the stadium, marching in unison, wide high-angle shot,
diverse faces, no repeated individuals"
密度修饰词（sparse/moderate/dense）+ 行为 + 取景 + 防重复
```

### 群体行为逻辑

群众不是随机点——**有集体行为**（涌向出口/围观/庆祝）才有真实感（衔接 187：个体调度的群体版）。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 重复面孔 | 一眼假 | IC-LoRA |
| 无行为逻辑 | 死群 | 集体行为 |
| 密度单一 | 无层次 | 密度控制 |
| 平视拍人群 | 无涌现 | 高角/广角 |
| 群体与光不统一 | 拼接感 | 光照统一（200） |

## 工作流应用（AI 映射）

人群镜头（衔接 186/187/200）：

```text
群体意图（类型/行为）→ 密度/取景控制
  → 防重复生成 → 光照统一（200）
  → 与主体镜头衔接（186）→ 交付
```

**DirectorX 纪律**：密度+行为+取景三控制；防重复面孔；高角展现涌现；光照统一。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 密度修饰 | Density Modifier | 疏密控制 |
| 集体行为 | Collective Behavior | 群体动作 |
| 涌现模式 | Emergent Pattern | 宏观形态 |
| 重复面孔 | Duplicate Faces | 同脸重复 |
| 群众演员 | Extras | 背景人群 |
| 程序化生成 | Procedural Generation | 多样性来源 |

## 来源

- LTX — AI Crowd Generation: Prompting Techniques for Believable Shots：https://ltx.io/blog/crowd-scene-generation
- arXiv — Gen-C: Populating Virtual Worlds with Generative Crowds（2504.01924）：https://arxiv.org/html/2504.01924v3
- arXiv — Evaluating Video Models as Simulators of Multi-Person Dynamics（2510.20182）：https://arxiv.org/html/2510.20182v1
- ReelMind — AI-Generated Crowd Scenes: Realistic Extras：https://reelmind.ai/blog/ai-generated-crowd-scenes-fill-your-shots-with-realistic-extras
- Morphic — Crowd Simulation AI Videos：https://morphic.com/resources/videos/crowd-simulation-videos