# AI 图片参考锚定生成（Reference-Anchored Generation — Identity & Style Consistency）

> 本页为 AI 图片的参考锚定生成：参考图作锚（风格/角色/环境）、多参考+权重（影响强度控制）、参考驱动模式（跨场景一致）、生成器差异（参考=灵感 vs 身份）。知识本体来自 2026 参考生成（Google/Azure/Text2img/NeoLeon）。AI 应用面向 DirectorX：参考锚定（衔接 384 知识引导、391 对应、183 参考、226 设定图）。
> 来源：Google「Generate Images with Imagen」、Azure「OpenAI Image Generation Models」、Text2img「Reference Images for Consistent Output」、NeoLeon「AI Image Generators with Image Reference」、Fin「AI Knowledge Base Guide 2026」。

## 概述

**核心断言**：参考锚定生成 = **"参考即身份"**——参考图作锚（风格/角色/环境）；多参考+权重（影响控制）；参考驱动模式（跨场景一致）；生成器差异（参考=灵感 vs 身份）（衔接 384：知识引导；183：参考）。

## 核心概念

### 参考作锚（Text2img）

参考图锚定风格/角色/环境——**"锚定不漂移"**（衔接 183）。

### 多参考+权重（Google）

多参考输入 + 权重指定影响——**"多锚+力度"**。

### 灵感 vs 身份（NeoLeon）

生成器差异：参考当灵感（自由）vs 当身份（一致）——**"选对模式"**（衔接 333 LoRA）。

## 技巧与示例

### 参考锚定工作流

```text
参考库（376）→ 锚选择（身份/风格）
  → 多参考+权重 → 跨场景生成
  → 一致性校验（227）→ 修正
```

### 锚定示例

"reference anchors + multi-ref weights + identity-mode generators"——**锚+权重+身份模式**。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 参考当灵感 | 漂移 | 身份模式 |
| 单参考 | 局限 | 多锚 |
| 无权重 | 失控 | 力度 |
| 生成器不匹配 | 不一致 | 选对 |
| 不校验一致 | 场景断 | 227 |

## 工作流应用（AI 映射）

参考锚定（衔接 183/226/227/333/384）：

```text
库 → 锚 → 权重 → 生成 → 校验 → 修正
```

**DirectorX 纪律**：锚定不漂移；多锚+力度；身份模式；一致校验。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 参考锚 | Reference Anchor | 身份基线 |
| 多参考 | Multi-Reference | 多锚输入 |
| 参考权重 | Reference Weight | 影响强度 |
| 参考驱动模式 | Referenced Mode | 跨场景 |
| 灵感模式 | Inspiration Mode | 自由生成 |
| 身份模式 | Identity Mode | 一致生成 |

## 来源

- Google — Generate Images Using Imagen（Gemini API）：https://ai.google.dev/gemini-api/docs/imagen
- Microsoft — Azure OpenAI Image Generation Models：https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/dall-e
- Text2img — Reference Images for Consistent AI Output 2026：https://www.text2img.pro/reference-images-consistent-ai-output-2026-2/
- NeoLeon — AI Image Generators That Support Image Reference：https://www.neolemon.com/blog/ai-image-generators-that-support-image-reference/
- Fin — AI Knowledge Base: Complete Guide 2026：https://fin.ai/learn/ai-knowledge-base