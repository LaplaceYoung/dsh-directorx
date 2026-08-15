# AI 人物空间调度（Blocking & Staging — Screen Geography & One-Action Beats）

> 本页为 AI 人物空间调度：屏幕地理（Screen Geography：左/中/右 + 前/中/后景 + 朝向 + 距离）、遮挡板（Blocking Board）先行、一镜一动作原则、构图叙事（连接/冲突/权力/孤立）。知识本体来自 2026 空间调度指南（Scenario/Veo 3.1 空间提示/Runway/Episode Academy）。AI 应用面向 DirectorX：调度设计（衔接 94 场景调度、171 连续性、178 机位、186 多机位）。
> 来源：Scenario「Spatial Prompting for Video Generation」、Episode Academy「Character Placements」、Runway「Precise Motion Language」、CodeDesigns「Character Consistency 2026」。

## 概述

**核心断言**：AI 调度的可靠方法是**提供构图首帧 + 参考 + 单动作指令**——"一次生成 = 一个可拍的节拍"，不是整场戏的多人物交叉走位。**屏幕地理用相机相对术语写**：屏幕左/中/右 + 前/中/后景 + 朝向 + 距离（衔接 171：屏幕方向一致）。

## 核心概念

### 屏幕地理四要素（Scenario）

```
① 屏幕位置：左/中/右（观众视角）
② 景深层次：前/中/后景（视觉优先级）
③ 朝向：A 面向屏幕右对 B（不用模糊的"面向左"）
④ 关系：距离/物体间隔/视线（eyeline）
+ 相机关系：锁定/跟拍/摇移
```

### 命名角色（防互换）

"穿红衣的 Mara"与"穿炭灰西装的 Jon"——**具象命名防身份/动作互换**（衔接 117/183）。

## 技巧与示例

### 调度提示词模板（Scenario）

```text
[景别+机位]。[角色 A]在[屏幕位置+景深]，朝向[方向]，
[角色 B]在[屏幕位置+景深]，朝向[方向]。空间关系：[距离/间隔物/视线]。
动作：[一个短的有序动作]。相机：[静态或单一运动]。
保持[关键空间约束]贯穿全镜。[光线/风格]。
```

### 构图叙事（遮挡即故事）

| 效果 | 调度方式 |
|---|---|
| 连接/平等 | 平衡双人镜、相似景深、面部间开放空间 |
| 冲突 | 画面两侧对立、中间隔物、景深不均 |
| 权力 | 主导者前景/低角度；脆弱者后景/俯视 |
| 孤立 | 宽幅小主体 + 负空间（192） |
| 怀疑 | 过肩 + 前景剪影 |

### 2026 最佳工作流

1. **遮挡板先行**：每镜一张干净静帧（位置/景深/视线/道具正确）
2. **图生视频而非纯文本**：输入图=初始构图，只描述后续运动
3. **一镜一动作**："Mara 转向门"比"转身走人拿包退出"可靠
4. **锁相机或锁演员**：静态相机 + 单演员运动最易
5. **空间标注**：首帧图上箭头（路线）/圆圈（焦点）
6. **覆盖分镜独立生成**：master/特写/插入分别生成后组装（186）

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 纯文本精确调度 | 几何漂移 | 遮挡板/首帧 |
| 一镜多动作 | 动作混乱 | 一镜一动作 |
| 屏幕侧随意反转 | 空间矛盾 | 侧位保持（171） |
| 无名角色 | 互换 | 具象命名 |
| 相机演员同时动 | 失控 | 锁其一 |

## 工作流应用（AI 映射）

调度设计（衔接 94/171/178/186）：

```text
叙事意图 → 遮挡板（每镜静帧）
  → 屏幕地理提示（四要素）
  → 一镜一动作生成（图生视频）
  → 覆盖分镜（186）→ 连续性检查（171）
```

**DirectorX 纪律**：遮挡板先行；屏幕地理四要素；一镜一动作；锁相机或锁演员；命名角色防互换。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 屏幕地理 | Screen Geography | 位置/景深/朝向 |
| 遮挡板 | Blocking Board | 每镜静帧规划 |
| 空间标注 | Spatial Annotation | 首帧箭头/圆圈 |
| 具象命名 | Distinct Naming | 防互换 |
| 一镜一动作 | One-Action Beat | 单动作原则 |
| 构图叙事 | Composition Storytelling | 遮挡承载语义 |

## 来源

- Scenario — Spatial Prompting for Video Generation：https://help.scenario.com/articles/1360269978-spatial-prompting-for-videos-generation
- Episode Academy — Cinematic Character Placements：https://sites.google.com/pocketgems.com/episode-academy/beginner/cinematic-directing/character-placements
- CodeDesigns — AI Video Production 2026: Character Consistency：https://codedesigns.eu/ai-video-production-in-2026-character-consistency-finally-makes-it-usable/
- Runway — AI Video Prompting Guide（精确运动语言）：https://runway.com/resources/ai-video-prompting-guide
- PocketGems — Basic Directing: On-Screen Character Placement：https://pocketgems-support.helpshift.com/hc/en/10-episode-writer-s-portal/faq/252-basic-directing-on-screen-character-placement/