# 视频提示词工程总纲（Video Prompt Engineering — Structure, Timing & Control）

> 本页为 AI 视频提示词的完整语法体系：六段式结构（主体/动作/镜头/光照/环境/风格）、时间与节奏控制、负向提示词、时间一致性技巧、模型×语法适配。知识本体来自 2026 视频提示词工程指南（LTX/Venice/MinionArts/TrueFan/AimagicX）。AI 应用面向 DirectorX：逐镜提示词的标准骨架（衔接 53/73/109 镜头表）。
> 来源：LTX「AI Video Prompt Guide 2026」、Venice「Complete Guide to AI Video Prompt Engineering」、MinionArts「Prompt Engineering for AI Video 2026」、AimagicX「Advanced Guide 2026」、Prompting.Systems「Temporal Consistency Prompts」。

## 概述

**核心断言**：模糊提示词产生随机结果——专业视频提示词是**结构化的导演指令**：主体 + 动作 + 镜头 + 光照 + 环境 + 风格六段齐备，加上时间控制与负向约束。**时间一致性（Temporal Consistency）**是视频提示词与图片提示词的本质区别：跨帧不闪烁、不漂移、不突变。

## 核心概念

### 六段式结构（每段可省略但有默认）

1. **主体（Subject）**：谁/什么，不可变特征（身份块）
2. **动作（Action）**：主体做什么，变化的描述
3. **镜头（Camera）**：景别 + 角度 + 运镜（静态时要明说）
4. **光照（Lighting）**：光向/质感/对比
5. **环境（Environment）**：场景/空间关系
6. **风格（Style）**：视觉风格锚

**顺序纪律**：不可变信息（身份/场景）在前，变化信息（动作/运动）在后；同一身份块在每镜提示词中固定措辞。

### 时间与节奏控制

- **时长线索**：明确"四秒慢推/末帧保持 2 帧"，而非"慢一点"
- **转场**：fade/hard cut 显式声明（模型支持时）
- **运动向量**：跨镜运动方向一致（推镜后接同向横移），保持流动感

### 负向提示词（稳定性关键）

常见负向：变形（morphing）、纹理漂移（texture shifting）、换装（changing clothes）、闪烁（flicker）、镜头抖动（camera shake）、背景演变（evolving backgrounds）。**只加相关负向，不贴万能黑名单**。

## 技巧与示例

### 六段式完整示例

```
Subject: 一位 40 岁女侦探，深棕短发，蓝色大衣，右眼下方小疤（身份块固定）
Action: 从车窗探身观察雨夜街道，缓缓转头
Camera: 中景，微俯，静态镜头（明确静态）
Lighting: 霓虹灯侧光，冷色为主
Environment: 潮湿城市街道，路灯与霓虹倒影
Style: 写实电影感，浅景深
Negative: 变形、纹理漂移、换装、闪烁、镜头抖动
```

### 时间一致性三技巧（Prompting.Systems）

1. **静态镜头优先**：时间稳定性最高；运动只在叙事需要时引入，且给精确运动向量
2. **光照环境固定**：每镜重复相同的光照与环境描述，减少跨帧漂移
3. **运动向量对齐**：跨镜运动方向一致（dolly-in 后接同向横移），镜头切换不突兀

### 模型×语法适配

不同模型对语法的敏感度不同：Veo 遵循长提示词与叙事描述；Kling 对动作/运动描述敏感；Runway 重多镜与参数控制；开源模型（Wan/LTX）对结构化分段更稳。**同一提示词在不同模型结果不同——按模型微调语法**。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 只写"酷炫/电影感" | 随机结果 | 六段式结构化 |
| 省略运镜声明 | 模型乱动 | 静态镜头明说 |
| 身份块每镜措辞不同 | 跨镜漂移 | 身份块固定措辞 |
| 负向贴万能黑名单 | 误伤画面 | 只加相关负向 |
| 忽略时间控制 | 节奏失控 | 显式时长/转场线索 |
| 一个提示词打天下 | 各模型效果差 | 按模型微调语法 |

## 工作流应用（AI 映射）

逐镜提示词 = 镜头表字段（109）+ 六段式语法（本页）：

```text
镜头表（景别/角度/运镜/光照/主体动作/环境）
  → 六段式提示词（身份块 + 动作 + 镜头 + 光照 + 环境 + 风格）
  → 时间线索（时长/转场）
  → 负向（相关项）
  → 模型适配（按 114 路由）
  → 生成 → 对照镜头表审查（111）
```

**DirectorX 纪律**：提示词是"生产翻译"——把镜头表字段翻译成模型可执行的六段式，不做装饰性散文。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 六段式结构 | Six-Part Structure | 主体/动作/镜头/光照/环境/风格 |
| 身份块 | Identity Block | 不可变特征固定措辞 |
| 时间一致性 | Temporal Consistency | 跨帧稳定 |
| 负向提示词 | Negative Prompt | 避免项 |
| 运动向量 | Motion Vector | 运动方向与幅度 |
| 时长线索 | Duration Cue | 显式时间控制 |
| 静态镜头 | Static Camera | 时间稳定性最高 |
| 提示词遵循 | Prompt Following | 模型遵循指令程度 |

## 来源

- LTX — AI Video Prompt Guide: How To Write AI Video Prompts In 2026：https://ltx.io/blog/ai-video-prompt-guide
- Venice — The Complete Guide to AI Video Prompt Engineering：https://venice.ai/blog/the-complete-guide-to-ai-video-prompt-engineering
- MinionArts — Prompt Engineering for AI Video: The Complete 2026 Guide：https://www.minionarts.com/blogs/prompt-engineering-ai-video-generation-guide-2026
- AimagicX — AI Video Prompt Engineering: Advanced Guide 2026：https://www.aimagicx.com/blog/ai-video-prompt-engineering-advanced-guide-2026
- Prompting.Systems — Prompts for Maintaining Temporal Consistency in AI Video：https://prompting.systems/blog/prompts-for-maintaining-temporal-consistency-in-ai-video