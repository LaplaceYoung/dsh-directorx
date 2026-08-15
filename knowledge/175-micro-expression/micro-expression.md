# AI 微表情细化（Micro-Expression — Gaze, Blink & Coordinated Facial Detail）

> 本页为 AI 面部微表情细化：眼神（Gaze）锁定/偏移、非对称自然眨眼、嘴唇/下颌/脸颊协调发声、微表情克制（一两个线索）、情绪时序（近中性起→渐显→回落）、负向提示词。知识本体来自 2026 面部动画研究（EmoFace/Hailuo/PMC）。AI 应用面向 DirectorX：表演真实感（衔接 69 表演控制、119 对口型、137 数字人）。
> 来源：arXiv「EmoFace: Audio-driven Emotional 3D Face Animation」、Hailuo「Simulating Micro-Expressions」、PMC「Facial Motion Capture System」、ReelMind「Realistic Human Clips」。

## 概述

**核心断言**：面部真实感的关键是**协调**——眼神、眨眼、嘴部、微肌肉必须支持同一个情绪节拍，而非各自为政。**眼神锁定合理目标 + 小而有意的偏移；眨眼非对称自然（说话前停顿/思考转换/情绪后快眨）；只有嘴动 = 面具感**。微表情只需一两个克制线索（嘴角轻提/内眉微紧/鼻孔轻张）。

## 核心概念

### 面部协调五要素

```
① 眼神：锁定目标 + 小幅有意偏移（禁乱飘/冻结）
② 眨眼：非对称、语境驱动（思考/情绪）
③ 嘴部：音素匹配 + 下颌/颊/嘴角参与（禁只动嘴）
④ 微表情：1-2 个克制线索（情绪对齐）
⑤ 情绪时序：近中性起 → 渐显 → 回落（非全脸突现）
```

### 提示词模板（Hailuo 实战）

```text
Cinematic close-up of [subject], speaking calmly with [primary emotion].
Natural, stable eye contact; subtle gaze shifts while thinking; occasional soft,
asynchronous blinks; anatomically accurate lip sync and gentle jaw motion.
Restrained micro-expressions: [one secondary cue]. Fine cheek, eye-area, and
nasolabial muscle movement synchronized with speech. Near-neutral start,
emotion gradually emerges and relaxes. Stable facial identity, shallow DoF,
4-6 second close-up.
```

### 负向提示词

```text
Pupil jitter, frozen stare, synchronized mechanical blinking, exaggerated smile,
rubber face, mouth-only movement, lip warping, facial morphing, changing identity
```

## 技巧与示例

### 微表情生成工作流

```text
情绪节拍（132 情绪弧）→ 协调设计（五要素）
  → 近中性参考表情（留变化空间）
  → 生成（4-6 秒片段，防漂移）
  → 多变体选择（瞳孔/眼睑/下颌最稳的 take）
  → 审查（眼区情绪与嘴部匹配——真笑有眼区参与）
```

### 眼区匹配检查

**真笑必须有眼区参与**（眼角细纹/眼轮匝肌）——只提嘴角 = 假笑。审查时对照眼 vs 嘴情绪一致性。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 瞳孔乱飘/冻结 | 假感 | 锁定+有意偏移 |
| 机械同步眨眼 | 机械感 | 非对称眨眼 |
| 只动嘴 | 面具感 | 下颌/颊参与 |
| 全脸突现表情 | 夸张 | 近中性起渐显 |
| 长片段 | 面部漂移 | 4-6 秒 |

## 工作流应用（AI 映射）

表演真实感（衔接 119/132/137）：

```text
情绪节拍（132）→ 五要素协调设计
  → 近中性参考 → 生成（4-6s）
  → 多变体选优 → 眼-嘴匹配审查
  → 一致性校验（117）→ 通过
```

**DirectorX 纪律**：协调 > 单项；眼神锁定+有意偏移；克制微表情；眼区参与验证真情；短片段防漂移。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 微表情 | Micro-Expression | 克制表情线索 |
| 眼神控制 | Gaze Control | 视线锁定/偏移 |
| 非对称眨眼 | Asynchronous Blink | 自然眨眼 |
| 协调 | Coordination | 五要素同步 |
| 情绪时序 | Emotion Timing | 渐显渐落 |
| 负向提示词 | Negative Prompt | 排除项 |

## 来源

- arXiv — EmoFace: Audio-Driven Emotional 3D Face Animation（2407.12501）：https://arxiv.org/html/2407.12501v1
- Hailuo — Simulating Micro-Expressions for Realistic Human Clips：https://hailuoai.video/pages/knowledge/micro-expressions-realistic-human-ai-video
- PMC — Facial Motion Capture System Based on Facial Expressions：https://pmc.ncbi.nlm.nih.gov/articles/PMC10099104/
- ReelMind — AI Video Depth of Field Effects（同站配套）：https://reelmind.ai/blog/ai-video-depth-of-field-effects-professional-bokeh-without-expensive-lenses
- ArtArch — AI Video Character Consistency（身份稳定性参考）：https://www.artarch.ai/blog/ai-video-character-consistency-clothing-props-state