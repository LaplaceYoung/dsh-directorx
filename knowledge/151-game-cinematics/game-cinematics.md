# AI 游戏 CG 与过场动画（Game Cinematics — Cutscenes, Trailers & Animatic-First Workflow）

> 本页为 AI 游戏 CG/过场/预告片的制作体系：Animatic 先行（脚本→动态分镜→迭代情绪/光照/节奏→定稿渲染）、预告片结构（钩子/世界建立/升级/CTA）、视线连续性（Eyeline Continuity）。知识本体来自 2026 游戏 CG 指南（HappyHorseModel/Elser/MagicHour/Mootion）。AI 应用面向 DirectorX：游戏类项目（衔接 108 关键帧动画、150 叙事、143 批量）。
> 来源：HappyHorseModel「AI Video for Game Cinematics & Cutscenes」、Elser「Create Game Trailer Videos with AI」、MagicHour「AI Gaming Cinematics」、AIconjured「Best Cutscene & Cinematic Animation Tools」。

## 概述

**核心断言**：AI 在游戏 CG 的最大价值是**避免浪费**——在动捕/动画/渲染预算投入前，先用 AI Animatic 验证场景是否成立。**先 Animatic 后成片**：低成本验证情绪/光照/节奏/构图，再把弱片段逐步替换为强变体（衔接 108 关键帧、141 调色）。

## 核心概念

### Animatic 先行管线

```text
场景目标（这场戏要传达什么）
  → 分镜节拍（Shot Beats）
  → AI 生成多版本（情绪/光照/节奏/构图测试）
  → 锁定 Animatic（叙事成立）
  → 逐片段强化（弱→强变体替换）
  → 最终渲染/交付
```

### 预告片结构 vs 过场结构

| 类型 | 结构 | 关键点 |
|---|---|---|
| 预告片 | 钩子→世界建立→升级→CTA | 快节奏、悬念、高光 |
| 过场动画 | 叙事弧 + 游戏调性 | 视线连续性、玩法衔接 |

## 技巧与示例

### 过场动画工作流（Elser 独立开发者）

```text
游戏概念 → 角色一致性（117）→ 玩法风格画面
  → 预告片结构（钩子/世界/升级/CTA）
  → 逐节拍生成（I2V 从游戏截图起手）
  → 音画（144 声音/119 同步）
  → 组装 → 优化转场（127）
```

### 视线连续性（Eyeline Continuity）

过场中角色视线方向必须一致（对话轴线，衔接 31 正反打）——AI 生成多镜头时用参考锁定视线方向。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 直接全量渲染 | 预算浪费 | Animatic 先行 |
| 单版本直接锁定 | 错过更好方案 | 多版本测试 |
| 忽视视线连续性 | 对话出戏 | 视线参考锁定 |
| 预告片无钩子 | 无传播力 | 钩子开场 |
| 过场与玩法脱节 | 割裂感 | 调性衔接 |

## 工作流应用（AI 映射）

游戏项目（衔接 108/117/127）：

```text
场景目标 → 分镜节拍 → AI 多版本测试（Animatic）
  → 锁定 → 逐片段强化（一致性 117）
  → 音画层（144/119）→ 转场节奏（127）
  → 最终交付
```

**DirectorX 纪律**：Animatic 先行防浪费；多版本验证情绪/光照；视线连续性锁定；预告片钩子开场。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 动态分镜 | Animatic | 静态分镜+时间轴 |
| 过场动画 | Cutscene | 游戏叙事片段 |
| 预告片 | Trailer | 宣传短片 |
| 视线连续性 | Eyeline Continuity | 视线方向一致 |
| 分镜节拍 | Shot Beats | 镜头分解 |
| 玩法调性 | Gameplay Tone | 与玩法一致的气质 |

## 来源

- HappyHorseModel — AI Video Generation for Game Cinematics and Cutscenes：https://happyhorsemodel.ai/en/articles/ai-video-for-gaming
- Elser — How to Create Game Trailer Videos with AI: Practical Workflow for Indie Creators：https://www.elser.ai/blog/how-to-create-game-trailer-videos-with-ai-a-practical-workflow-for-indie-creators-in-2026
- MagicHour — AI Gaming Cinematics: Create Game Cutscenes & Trailers：https://magichour.ai/use-cases/gaming-cinematics
- AIconjured — Best Cutscene & Cinematic Animation Tools：https://aiconjured.com/ai-game-dev-tools/cutscenes-animation/
- Mootion — Game Cinematic Creator AI：https://www.mootion.com/use-cases/en/game-cinematic-creator-ai