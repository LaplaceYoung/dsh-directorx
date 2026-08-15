# AI 图片质感氛围系列（Texture Mood — Rust, Moss, Fabric & Tactile Quality）

> 本页为 AI 图片的质感氛围系列：材质+表面限定词（锈蚀/青苔/织物）+光照的触感真实、多遍生成（基础纹理→细节遍→光照遍）、质感情绪（老化=时间感）。知识本体来自 2026 质感提示词指南（Text2Img/ZSky）。AI 应用面向 DirectorX：质感图（衔接 179 材质、230 PBR、262 对应、250 氛围）。
> 来源：Text2Img「Add Texture & Surface Details in AI Prompts」、ZSky「AI Texture Prompts Guide」、ZSky「50+ Texture and Material Prompts」、ZSky「Combining Textures」。

## 概述

**核心断言**：质感 = **"材质词 + 表面限定 + 光照"的组合**——"aged rusted iron with flaking paint"比"rust"真实；**多遍生成**（基础纹理→细节→光照）达触感级（衔接 179：材质物理；230：贴图的图片版）。

## 核心概念

### 质感配方（Text2Img）

```text
材质词（rust/moss/canvas）+ 表面限定（flaking/weave/patina）
+ 光照（harsh side lighting 强调凹凸）+ 触感词（tactile）
```

### 多遍生成（Multi-Pass）

```
① 基础纹理遍（材质+表面）
② 细节遍（青苔/锈斑/纤维）
③ 光照遍（凹凸强调）
```

### 质感情绪

老化材质 = 时间感/衰败/历史（锈=遗弃，青苔=自然回归）——**质感承载时间叙事**（衔接 245 时间、181 氛围）。

## 技巧与示例

### 质感生成工作流

```text
情绪目标（时间感/奢华/自然）→ 材质选型
  → 多遍生成（基础→细节→光照）
  → 触感校验（是否"可触摸"）
```

### 织物质感示例

"heavy cotton canvas, tight weave, visible thread, subtle fuzz, matte finish"——**织法/纤维/毛绒全指定**。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 单材质词 | 塑料感 | 表面限定 |
| 无光照遍 | 凹凸平 | 光照强调 |
| 质感无情绪 | 无叙事 | 情绪设计 |
| 触感缺失 | 数码感 | 触感词 |
| 无校验 | 质感假 | 触感检查 |

## 工作流应用（AI 映射）

质感图（衔接 179/181/230/250）：

```text
情绪 → 材质+限定 → 多遍生成 → 触感校验
```

**DirectorX 纪律**：材质+限定+光照三件套；多遍生成；质感承载时间叙事；触感校验。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 表面限定 | Surface Qualifier | 状态细节 |
| 多遍生成 | Multi-Pass | 分层增强 |
| 触感 | Tactile Quality | 可触摸感 |
| 锈斑 | Patina | 氧化质感 |
| 织法 | Weave | 织物结构 |
| 时间感 | Aged Feel | 老化叙事 |

## 来源

- Text2Img — How to Add Texture & Surface Details in AI Prompts (2026)：https://www.text2img.pro/add-texture-surface-details-ai-prompts-2026-28/
- ZSky — AI Texture Prompts: Fabric, Metal, Wood & More：https://zsky.ai/blog/ai-texture-prompts-guide
- ZSky — 50+ AI Texture and Material Prompts：https://zsky.ai/blog/ai-texture-and-material-prompts
- ZSky — Combining Textures for Realistic Results：https://zsky.ai/blog/ai-texture-and-material-prompts
- Text2Img — Add Texture & Surface Details (2026)：https://www.text2img.pro/add-texture-surface-details-ai-prompts-2026-23/