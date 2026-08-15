# AI 图片系列一致性（Image Series Consistency — Character DNA & Frame Chaining）

> 本页为 AI 图片系列一致性：角色 DNA（重复提示词核心）、主参考 + 角色表（多角度/表情）、帧链（上帧作下帧参考）、风格锁定（Style Lock）、分镜序列一致。知识本体来自 2026 系列一致指南（ArtSmart/MagicHour/GetImg/MStudio）。AI 应用面向 DirectorX：多图系列（衔接 117 一致性、183 参考、226 设定图、238 对应）。
> 来源：ArtSmart「Same Character Across Multiple Images」、MagicHour「AI Image Generators for Character Consistency」、GetImg「Consistent Characters with AI」、MStudio「Character Consistency in Storyboards」。

## 概述

**核心断言**：图片系列一致性 = **"角色 DNA + 帧链"**——把角色核心描述（DNA）写进每张提示词（只改场景细节），主参考 + 角色表锚定（183），**上帧作下帧参考**（帧链防漂移）（衔接 117：一致性总纲的图片实现；40：分镜序列）。

## 核心概念

### 三机制（GetImg 四法）

```
① 角色 DNA：可重复的核心描述（只改场景）
② 主参考/角色表：多角度/表情锚定（226）
③ 帧链：上帧作下帧参考
④ 风格锁定：统一风格词块（224）
```

### 提示词结构

```text
[角色 DNA（固定）] + [场景细节（变化）] + [风格块（固定）]
```

## 技巧与示例

### 系列生成工作流

```text
角色 DNA 编写（设定图 226 → 描述核心）
  → 主参考 + 角色表
  → 逐张生成（DNA+场景+风格块）
  → 帧链续接（上帧参考）
  → 一致性检查（117）→ 修正漂移
```

### 分镜序列应用（MStudio）

故事板 40 帧角色一致：**角色表 + 风格锁定 + 逐帧生成**（衔接 40 分镜、172 全链路）。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 无 DNA | 每张重写漂移 | 核心复用 |
| 单参考 | 角度缺失 | 角色表 |
| 无帧链 | 跳变 | 上帧参考 |
| 风格不锁 | 系列割裂 | 风格块 |
| 无检查 | 累积漂移 | 逐张校验 |

## 工作流应用（AI 映射）

多图系列（衔接 40/117/172/226）：

```text
角色 DNA → 参考表 → 逐张生成（帧链）
  → 一致性检查 → 分镜/系列交付
```

**DirectorX 纪律**：DNA 复用防漂移；角色表多角度；帧链续接；风格锁定；逐张校验。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 角色 DNA | Character DNA | 核心描述 |
| 帧链 | Frame Chaining | 上帧参考 |
| 风格锁定 | Style Lock | 风格块 |
| 参考表 | Reference Sheet | 多角度锚定 |
| 逐帧一致 | Frame-to-Frame | 防漂移 |
| 分镜一致 | Storyboard Consistency | 40 帧统一 |

## 来源

- ArtSmart — How to Generate the Same Character Across Multiple Images：https://artsmart.ai/blog/ai-character-consistency/
- MagicHour — Best AI Image Generators for Character Consistency 2026：https://magichour.ai/blog/best-ai-image-generators-for-character-consistency
- GetImg — How to Create Consistent Characters with AI：https://getimg.ai/blog/how-to-create-consistent-characters-with-ai
- MStudio — AI Character Consistency in Storyboards：https://mstudio.ai/blog/storyboarding/ai-character-consistency-storyboards
- Miraflow — Consistent AI Characters Across Multiple Images：https://miraflow.ai/blog/consistent-ai-characters-multiple-images-step-by-step