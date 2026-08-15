# AI 多镜头连续性物理（Continuity Physics — 180° Rule, Eyeline & Spatial Logic）

> 本页为 AI 多镜头连续性物理：180° 轴线规则、视线匹配（Eyeline Match）、屏幕方向（Screen Direction）、正反打空间逻辑（Shot-Reverse-Shot）、主镜头锚点（Master Shot Anchor）。知识本体来自 2026 连续性指南（Adobe/Hailuo/Filmmakers Academy/M Studio）。AI 应用面向 DirectorX：多镜头生成（衔接 31 正反打、117 一致性、123 场景卡）。
> 来源：Hailuo「Shot-Reverse-Shot Spatial Logic」、Adobe「Continuity Editing in Film」、Filmmakers Academy「180-Degree Rule / Eyeline Match」、Wikipedia「180-Degree Rule」。

## 概述

**核心断言**：多镜头连续性 = **空间逻辑一致**——AI 逐镜头独立生成最容易犯"跳轴/视线乱/方向反转"的错。**固定动作轴线（Axis of Action）+ 主镜头锚点 + 显式视线提示**是 AI 生成的强制约束。这是镜头语言（124）在连续性维度的落地。

## 核心概念

### 三大连续性规则

```
① 180° 轴线：机位始终在轴线一侧（不跳轴）
② 视线匹配：角色对视方向跨镜头一致
③ 屏幕方向：运动方向跨镜头不反转（左→右保持）
```

### AI 生成实现（Hailuo 框架）

- **主镜头锚点**：先定 master shot（空间关系基准）
- **显式视线提示**：提示词注明"looks at partner off-camera right"
- **机位提示**：每镜头标注在轴线哪一侧

## 技巧与示例

### 正反打生成工作流

```text
主镜头（master shot，建立空间关系）
  → 轴线定义（两人连线 = 轴线）
  → 机位分配（A 侧拍 A、B 侧拍 B，不跳轴）
  → 视线提示（互看方向显式化）
  → 逐镜生成（参考锚点，117）
  → 连续性质检（方向/视线/位置）
```

### 质检清单（生成后）

- 跳轴检查：两人屏幕位置是否突变
- 视线检查：互看方向是否正确
- 位置检查：左/右关系是否保持

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 跳轴 | 观众方位混乱 | 固定轴线 |
| 视线方向乱 | 对话出戏 | 显式视线提示 |
| 屏幕方向反转 | 运动矛盾 | 方向保持 |
| 无主镜头锚点 | 空间无基准 | master shot 先行 |
| 逐镜独立无参考 | 关系漂移 | 锚点参考（117） |

## 工作流应用（AI 映射）

多镜头对话/动作（衔接 31/117/123）：

```text
主镜头 → 轴线定义 → 机位分配
  → 视线/方向提示 → 逐镜生成（锚点）
  → 连续性质检（跳轴/视线/方向）
  → 修正 → 完成
```

**DirectorX 纪律**：主镜头锚定空间；轴线固定不跳；视线显式化；生成后三查（轴/线/向）。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 轴线规则 | 180° Rule | 机位单侧 |
| 视线匹配 | Eyeline Match | 互看一致 |
| 屏幕方向 | Screen Direction | 运动方向 |
| 正反打 | Shot-Reverse-Shot | 对话对切 |
| 主镜头 | Master Shot | 空间基准 |
| 跳轴 | Crossing the Line | 轴线违规 |

## 来源

- Hailuo — Director's Guide: Shot-Reverse-Shot Spatial Logic：https://hailuoai.video/pages/knowledge/director-guide-shot-reverse-shot-spatial-logic
- Adobe — What Is Continuity Editing in Film：https://www.adobe.com/creativecloud/video/hub/ideas/what-is-continuity-editing-in-film.html
- Filmmakers Academy — 180-Degree Rule：https://www.filmmakersacademy.com/glossary/180-degree-rule/
- Filmmakers Academy — Eyeline Match：https://www.filmmakersacademy.com/glossary/eyeline-match/
- Wikipedia — 180-Degree Rule：https://en.wikipedia.org/wiki/180-degree_rule