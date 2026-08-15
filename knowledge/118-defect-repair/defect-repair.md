# 生成缺陷识别与修复（AI Video Artifacts — Diagnose, Fix, Regenerate）

> 本页为 AI 视频生成缺陷的完整诊断与修复体系：六类失败模式（身份漂移/环境变形/解剖破坏/物理失效/闪烁/文字破损）、诊断方法（先判断是哪一类再修）、修复策略（提示词/参考/节奏/后期），以及"停止盲目重试"的纪律。知识本体来自 2026 缺陷排查指南（Kling/Imagetovideoai/DesignerBox/NemoVideo/Genra）。
> 来源：Kling「Fix AI Video Drift & Consistency」、Imagetovideoai「Artifact Troubleshooting Guide」、DesignerBox「4 Failure Modes of AI Video Distortion」、NemoVideo「Why Your AI Videos Look Fake」、Genra「7 Fixes for Common AI Artifacts」。

## 概述

**核心断言**：AI 视频缺陷不是"一个问题"，而是**多类失败模式**——DesignerBox 明确指出"四种不同的失败，不是一个"。修复的前提是**正确诊断**：先判断是身份漂移、环境变形、解剖破坏还是物理失效，再选对应的修复，而不是盲目重新生成（Blind Re-roll）。

**核心纪律**：重复失败后停止重试，诊断根因，一次改一个变量。

## 核心概念

### 六类失败模式（诊断表）

| 模式 | 表现 | 根因 | 首选修复 |
|---|---|---|---|
| 身份漂移 | 脸/服装/产品跨帧变化 | 参考不足/强度低 | 加强参考 + 固定身份块 |
| 环境变形 | 背景扭曲/空间跳变 | 相机运动过度/场景描述弱 | 锁相机 + 场景参考 |
| 解剖破坏 | 多指/断肢/肢体错乱 | 复杂姿态/动作过快 | 拆动作 + 短片段 |
| 物理失效 | 物体穿帮/无重力/水反流 | 动作幅度超模型能力 | 降低运动强度/编辑绕开物理事件 |
| 闪烁 | 光照/纹理跨帧闪烁 | 运动过大/光照描述不一致 | 降运动 + 稳定化后期 |
| 文字破损 | 画面文字扭曲/乱码 | 文本渲染弱 | 避免画面文字/后期字幕 |

### 诊断先于修复

每个失败先回答三个问题：
1. 哪类模式？（对照上表）
2. 发生在什么位置/时段？（首段/中段/末段）
3. 触发因素是什么？（运动幅度/参考缺失/光照变化）

## 技巧与示例

### 修复策略阶梯（每次只改一个变量）

```text
失败 → 诊断模式
  → 修复 1：提示词（加强身份块/锁光照/降运动强度）
  → 修复 2：参考（补参考图/提高图像强度/锁首末帧）
  → 修复 3：节奏（拆短片段/慢动作）
  → 修复 4：后期（编辑绕开物理事件/稳定化去闪烁）
  → 仍失败：换模型（114）或换路径（后期合成）
```

### 物理事件的处理（NemoVideo 建议）

**围绕物理事件剪辑，而非让模型渲染**：复杂的物理交互（碰撞/流体/破碎）模型易失效——用模型能稳定生成的部分 + 剪辑/特效层补足，而不是逼模型一次做对。

### 手/脸专项（Alibaba 洞察）

手与脸是解剖复杂区：训练数据缺口 + 空间歧义导致伪影。对策：特写手势/表情用短片段 + 高参考强度；必要时后期修复。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 盲目重新生成 | 同样的缺陷反复 | 先诊断模式再修 |
| 一次改多个变量 | 不知道哪个有效 | 一次改一个 |
| 逼模型渲染复杂物理 | 反复失败 | 编辑/特效层绕开 |
| 忽略闪烁 | 观感廉价 | 降运动 + 稳定化 |
| 失败后不换模型 | 卡在模型能力上限 | 按 114 换模型/换路径 |

## 工作流应用（AI 映射）

审片环节（111）的缺陷审查子流程：

```text
生成结果 → 缺陷扫描（六类模式逐项）
  → 诊断（模式 + 位置 + 触发）
  → 修复（提示词/参考/节奏/后期，一次一变量）
  → 有限重试（≤2-3 次）
  → 仍失败：报告偏差 + 换模型/换路径
```

**DirectorX 纪律**：审查清单含六类缺陷（身份/环境/解剖/物理/闪烁/文字）；重试有上限，失败有报告（不假装生成、不无限盲试）。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 身份漂移 | Identity Drift | 身份跨帧变化 |
| 环境变形 | Environment Warp | 背景扭曲/空间跳变 |
| 解剖破坏 | Anatomy Break | 多指/断肢/肢体错乱 |
| 物理失效 | Physics Failure | 穿帮/无重力 |
| 闪烁 | Flicker | 光照/纹理跨帧闪烁 |
| 盲目重试 | Blind Re-roll | 不诊断的重生成 |
| 稳定化 | Stabilization | 后期去抖/去闪 |
| 运动强度 | Motion Strength | 运动幅度控制 |

## 来源

- Kling — How to Fix AI Video Consistency & Visual Drift：https://kling.ai/blog/fix-ai-video-drift-consistency-guide
- Imagetovideoai — AI Video Artifact Troubleshooting Guide：https://imagetovideoai.net/blog/ai-video-artifact-troubleshooting-guide
- DesignerBox — How to Avoid Distortions in AI Video: 4 Failure Modes：https://designerbox.ai/blog/avoid-distortions-in-ai-video/
- NemoVideo — Why Your AI Videos Look Fake (And How to Fix Them)：https://www.nemovideo.com/blog/why-ai-videos-look-fake-how-to-fix
- Genra — Why Your AI Videos Look Fake: 7 Fixes for Common AI Artifacts：https://genra.ai/blog/why-ai-videos-look-fake-how-to-fix