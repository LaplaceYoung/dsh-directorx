# AI 视频提示词模板库（Prompt Template Library — Scenario-Based Templates）

> 本页为 AI 视频分场景提示词模板库：产品演示、口播讲解、广告、电影感叙事、社交媒体、房地产等场景的可复制模板，每个模板含变量位（可填空）与适用模型提示。知识本体来自 2026 提示词模板库（Renderforest/Synthesia/ZSky/Imagine/ExplainX）。AI 应用面向 DirectorX：常用场景的即用模板（衔接 73 提示词总表、115 六段式语法）。
> 来源：Renderforest「50+ Text-to-Video AI Prompt Examples」、Synthesia「14 Free Video Script Templates」、ZSky「Best AI Video Generation Prompts 2026」、Imagine「80+ AI Video Prompts」、ExplainX「20 Structured Templates」。

## 概述

**核心断言**：模板把六段式语法（115）变成**可填空的即用结构**——每个场景有固定骨架 + 变量位，替换变量即可复用。模板是"生产标准件"：省去每次从头写提示词。

## 核心概念

### 模板结构（通用骨架）

```
[景别/镜头] + [主体描述] + [动作/变化] + [运动] + [光照] + [环境] + [风格] + [负向]
```

变量位用 `[变量]` 标注，可替换。

## 技巧与示例

### 分场景模板库

**1. 产品演示（Product Demo）**

```
"[产品名] 特写，[材质/颜色] [产品描述]，[功能] 演示，
 [转台/推镜]，柔光 [环境]，写实产品摄影，[负向：变形/文字破损]"
```

**2. 口播讲解（Explainer/Talking Head）**

```
"[人物] 中近景，面对镜头 [讲解]，[手势动作]，静态镜头，
 三点布光，[背景]，写实，[负向：口型不同步]"
```

**3. 广告（Ad）**

```
"[产品] 在 [场景] 中 [使用场景]，[情绪] 氛围，[景别/运动]，
 [时段光]，[风格]，[负向：换装/漂移]"
```

**4. 电影感叙事（Cinematic）**

```
"[主体] [动作]，[景别]，[运镜]，[光影]，[环境]，电影感调色，
 浅景深，[负向：闪烁/变形]"
```

**5. 社交媒体竖屏（Social Short）**

```
"[主体] [动作]，竖屏 9:16，[运动]，高对比光，[风格]，
 3 秒内抓眼球，[负向：无关文字]"
```

### 模板化生产（衔接 122 批量）

模板 + 变量 = 批量生成的基础：同模板换变量（产品/人名/场景），配合 QC 校验。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 模板不填变量 | 千篇一律 | 变量位替换 |
| 模板与模型不匹配 | 效果差 | 按模型适配（114/115） |
| 缺负向 | 缺陷频发 | 每模板带相关负向 |
| 模板没有场景针对性 | 不贴任务 | 按场景选模板 |
| 复制模板不改 | 同质化 | 模板是骨架，细节按需求填 |

## 工作流应用（AI 映射）

模板库接入生产（衔接 121 编排）：

```text
任务场景判定（产品/口播/广告/叙事/竖屏）
  → 模板选择（本页）
  → 变量填充（产品/人物/场景/风格）
  → 模型适配（114）→ 生成（门控）
  → 审片（118/111）→ 批量复用（122）
```

**DirectorX 纪律**：常用场景先套模板再定制；模板是生产标准件，随知识库迭代补充。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 模板 | Template | 可填空结构 |
| 变量位 | Variable Slot | 可替换字段 |
| 即用提示词 | Copy-Paste Prompt | 直接可用的提示词 |
| 模板化生产 | Template Production | 批量复用 |
| 场景适配 | Scenario Fit | 按任务选模板 |

## 来源

- Renderforest — Text-to-Video AI Prompt Examples: 50+ Templates：https://www.renderforest.com/blog/text-to-video-ai-prompt-examples
- Synthesia — 14 Free Video Script Templates：https://www.synthesia.io/post/free-video-script-templates
- ZSky — Best AI Video Generation Prompts for 2026：https://zsky.ai/blog/best-ai-video-prompts-2026
- Imagine — 80+ AI Video Prompts Every Content Creator Should Try：https://www.imagine.art/blogs/ai-video-prompts
- ExplainX — Top AI Prompts for Video: 20 Structured Templates：https://explainx.ai/blog/top-ai-prompts-for-video-production