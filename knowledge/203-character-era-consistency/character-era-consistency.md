# AI 角色时代一致性（Period & Era Consistency — Anachronism Avoidance & Era Locking）

> 本页为 AI 角色时代一致性：时代锁定（Era Locking：服装/道具/场景的年代锚）、时代错位规避（Anachronism Avoidance）、多图融合保年代服装、跨镜年代检查。知识本体来自 2026 年代一致性指南（ReelMind/Hailuo/Neolemon）。AI 应用面向 DirectorX：年代戏（衔接 169 服装、165 环境、139 历史画面、117 一致性、200 时间）。
> 来源：ReelMind「Historical Reenactment: Period-Accurate Videos」、ReelMind「AI-Generated Historical Clothing」、Hailuo「Historical Parody with AI Video」、Neolemon「Consistent Characters Guide」。

## 概述

**核心断言**：年代戏的"出戏"来自**时代错位（Anachronism）**——现代元素混入（手表/塑料/现代发型）。解法：**时代锁定（Era Locking）**——服装/道具/场景/发型的年代锚 + 显式排除现代元素（负向提示）+ 多图融合保年代服装精确（衔接 169：服装一致性的年代维度；139：历史画面纪律）。

## 核心概念

### 时代锁定四层

```
① 服装（年代款式/面料/工艺，169）
② 道具（无现代物：手表/塑料/电子）
③ 场景（建筑/街道/室内年代）
④ 造型（发型/妆容/配饰）
```

### 时代错位规避

**负向提示显式排除**：`no modern items, no watches, no plastic, no contemporary hairstyles`（衔接 199 反精致同构——排除式驱动）。

## 技巧与示例

### 年代一致性工作流（ReelMind）

```text
年代研究（史料/参考图，139 纪律）
  → 时代锚定（四层：服装/道具/场景/造型）
  → 多图融合（年代服装精确，183 参考）
  → 生成（负向排除现代物）
  → 跨镜年代检查（服装/道具/细节）
  → 修正（漂移项重生成）
```

### 检查清单（跨镜）

- 服装款式/面料是否一致（169）
- 有无现代道具混入
- 发型/妆容年代一致
- 场景建筑年代正确

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 现代物混入 | 一眼出戏 | 负向排除 |
| 服装款式漂移 | 年代乱 | 多图融合锁定 |
| 无年代研究 | 伪历史 | 史料参考 |
| 发型现代 | 出戏 | 造型锚定 |
| 不跨镜检查 | 累积 | 逐镜年代检查 |

## 工作流应用（AI 映射）

年代戏（衔接 117/139/165/169/183）：

```text
年代研究（139）→ 时代锚定（四层）
  → 参考图（183）→ 生成（负向排除）
  → 跨镜检查（服装/道具/造型）
  → 一致性（117）→ 交付
```

**DirectorX 纪律**：时代锁定四层；负向排除现代物；多图融合保服装；逐镜年代检查。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 时代锁定 | Era Locking | 年代锚定 |
| 时代错位 | Anachronism | 现代物混入 |
| 年代戏 | Period Piece | 历史题材 |
| 多图融合 | Multi-Image Fusion | 服装精确 |
| 史料参考 | Period Reference | 年代依据 |
| 年代检查 | Era Check | 跨镜复核 |

## 来源

- ReelMind — Historical Reenactment: AI Tools for Period-Accurate Videos：https://reelmind.ai/blog/historical-reenactment-ai-tools-for-creating-period-accurate-videos
- ReelMind — AI-Generated Historical Clothing: Visualize Period Costumes：https://reelmind.ai/blog/ai-generated-historical-clothing-visualize-period-costumes-on-video
- Hailuo — Anachronistic Artistry: Historical Parody with AI Video：https://hailuoai.video/pages/knowledge/historical-parody-ai-video-guide
- Neolemon — How to Create Consistent Characters in AI Videos：https://www.neolemon.com/blog/how-to-create-consistent-characters-in-ai-videos-complete-guide/
- ReelMind — AI for Historical Reenactments: Period-Accurate Visuals：https://reelmind.ai/blog/ai-for-historical-reenactments-generate-period-accurate-visuals