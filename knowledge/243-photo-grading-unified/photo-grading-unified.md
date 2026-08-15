# AI 图片光影色彩统一（Photo Grading Unified — Batch Look & Learning Your Style）

> 本页为 AI 图片的光影色彩统一：参考图定 look（肤色/风格）、AI 学习编辑风格批量应用、按光照分组批处理（保自然差异）、视觉校验（肤色/阴影/高光）。知识本体来自 2026 批量调色指南（Imagen/Colorby/Alibaba）。AI 应用面向 DirectorX：多图统一（衔接 235 光照统一、243 对应、215 参数、141 视频调色）。
> 来源：Imagen「AI Batch Photo Editing & Color Correction」、Colorby「Batch Color Grading」、Alibaba「Batch-Edit 1000+ Photos」、Colorby「7 Best AI Photo Color Grading Tools」。

## 概述

**核心断言**：图片光影统一 = **"参考图定 look + AI 批量应用"**——参考图建立期望风格与肤色，AI 学习编辑偏好跨批次应用；**按光照分组**批处理（保自然变化），视觉校验肤色/阴影/高光（衔接 141：视频调色的图片版；235：光照一致的调色维度）。

## 核心概念

### 批量统一三步骤（Colorby）

```
① 参考图定 look（风格/肤色）
② AI 学习编辑偏好（预设/Profile）
③ 按光照分组批处理（室内/室外/混合）
```

### 分组批处理原则

**同光照组统一**，跨组保自然差异——"统一 look 而非统一光照"（衔接 235：光照一致 vs 调色一致的边界）。

## 技巧与示例

### 批量调色工作流（Imagen）

```text
参考图（look + 肤色）→ AI 学习偏好
  → 按光照分组 → 批量应用
  → 视觉校验（肤色/阴影细节/高光滚落）
  → 漂移图微调/重训
```

### 校验要点（Alibaba）

- 肤色是否自然（不偏色）
- 阴影细节保留
- 高光滚落（Highlight Roll-Off）平滑
- 跨组整体一致

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 不分组硬批 | 自然差异丢失 | 按光照分组 |
| 无参考图 | look 漂移 | 参考先行 |
| 肤色失真 | 人像怪 | 肤色校验 |
| 高光过曝 | 细节丢失 | 滚落检查 |
| 无校验直接交付 | 批量错 | 视觉校验 |

## 工作流应用（AI 映射）

多图统一（衔接 141/235）：

```text
参考图（look）→ AI 学习 → 分组批处理
  → 视觉校验 → 微调 → 交付
```

**DirectorX 纪律**：参考图定 look；按光照分组；肤色/阴影/高光校验；统一 look 非统一光照。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 批量调色 | Batch Grading | 多图统一 |
| 参考 look | Reference Look | 风格目标 |
| 光照分组 | Lighting Tier | 分组批处理 |
| 肤色校验 | Skin Tone Check | 人像保真 |
| 高光滚落 | Highlight Roll-Off | 平滑过渡 |
| 编辑偏好 | Edit Preference | AI 学习风格 |

## 来源

- Imagen — How AI Batch Photo Editing Streamlines Color Correction：https://imagen-ai.com/post/how-can-ai-batch-photo-editing-streamline-your-color-correction-workflow/
- Colorby — Batch Color Grading: Consistent Photos：https://colorby.ai/blog/batch-color-grading-consistent-photos/
- Alibaba — Batch-Edit 1000+ Photos with Consistent AI Color Grading：https://www.alibaba.com/product-insights/how-to-batch-edit-1000-photos-with-consistent-ai-color-grading-across-lighting-conditions.html
- Colorby — 7 Best AI Photo Color Grading Tools：https://colorby.ai/post/7-best-ai-photo-color-grading-tools-free-paid-top-ai-color-grading-tool-reviews-palette-luminar-neo-capture-one-adobe-lightroom-colorby-ai-db4a6523
- Imagen — The Best AI Batch Photo Editor：https://imagen-ai.com/ai-photo-editing-tools/ai-batch-photo-editor/