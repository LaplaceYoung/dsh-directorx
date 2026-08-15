# AI 图片明暗对照叙事（Chiaroscuro — Dramatic Light-Shadow & Tenebrism）

> 本页为 AI 图片的明暗对照（Chiaroscuro）叙事：单光源强对比（Tenebrism 暗色调主义）、阴影占比控制（70-90% 深影）、光向与衰减、卡拉瓦乔式提示词。知识本体来自 2026 明暗对照指南（GetPromptAtlas/Media.io/ZSky/AIforArt）。AI 应用面向 DirectorX：戏剧光（衔接 217 人像光、225 布光、236 对应、155 色彩）。
> 来源：GetPromptAtlas「Chiaroscuro Lighting」、Media.io「Gemini Chiaroscuro Photo Prompts」、ZSky「AI Dark Moody Prompts」、AIforArt「Chiaroscuro Lighting Style Guide」。

## 概述

**核心断言**：明暗对照 = **"光从黑暗中来"的戏剧叙事**——单光源（烛光/窗口/单侧硬光）+ 高对比 + 阴影占比 70-90%（衔接 225：低调布光的极端形态；217：伦勃朗光的谱系）。

## 核心概念

### Chiaroscuro vs Tenebrism

| 术语 | 特征 | 程度 |
|---|---|---|
| Chiaroscuro | 明暗对比 | 温和戏剧 |
| Tenebrism | 极端暗背景+强光 | 强烈戏剧 |

### 提示词要素（GetPromptAtlas）

```text
光源类型（单侧硬光/烛光/窗光）
+ 光向（camera-left / above-left）
+ 阴影占比（70-90% frame in shadow）
+ 对比（extreme contrast）
+ 风格（noir / baroque / oil-painting）
```

## 技巧与示例

### 明暗对照提示词模板

```text
"chiaroscuro lighting, single hard key light from camera-left,
90% deep shadow, extreme contrast, Rembrandt triangle,
moody cinematic, baroque"
```

### 情绪应用（ZSky 12 dark moody）

明暗对照 = 悬疑/神秘/庄严——**阴影承载叙事**（隐藏=悬念，衔接 158 张力、181 氛围）。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 只写"暗" | 无光向 | 光源+方向 |
| 阴影占比模糊 | 对比不足 | 70-90% 指定 |
| 光向混乱 | 阴影乱 | 单光源 |
| 细节全灭 | 黑成一团 | 保留高光细节 |
| 无风格锚 | 平庸 | 风格词 |

## 工作流应用（AI 映射）

戏剧光（衔接 181/217/225）：

```text
情绪意图 → 光型（Chiaroscuro/Tenebrism）
  → 光源/方向/阴影占比 → 提示词
  → 生成 → 高光细节校验
```

**DirectorX 纪律**：单光源+方向明确；阴影占比控制对比；高光细节保质感；风格锚定。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 明暗对照 | Chiaroscuro | 明暗对比 |
| 暗色调主义 | Tenebrism | 极端暗背景 |
| 阴影占比 | Shadow Ratio | 70-90% |
| 单光源 | Single Light Source | 定向光 |
| 光衰减 | Light Falloff | 衰减控制 |
| 卡拉瓦乔式 | Caravaggio Style | 强戏剧光 |

## 来源

- GetPromptAtlas — Chiaroscuro Lighting Keywords：https://www.getpromptatlas.com/keywords/chiaroscuro-lighting
- Media.io — Gemini AI Chiaroscuro Photo Prompts (25+)：https://www.media.io/ai-prompts/gemini-ai-chiaroscuro-photo-prompt.html
- ZSky — 12 AI Dark Moody Prompts：https://zsky.ai/blog/ai-dark-moody-prompts
- AIforArt — Chiaroscuro Lighting: High-Contrast AI Art Style Guide：https://www.aiforart.com/style/chiaroscuro-lighting
- MoodNode — Chiaroscuro Lighting Prompt Library：https://moodnode.ai/tools/prompt-library/p/chiaroscuro-lighting