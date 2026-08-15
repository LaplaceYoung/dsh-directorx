# AI 运动风格迁移（Motion Style Transfer — Video-to-Video & Retargeting）

> 本页为 AI 运动风格迁移：参考视频运动转移到新角色（舞蹈/动作/相机运动）、跨结构重定向（Unpaired Retargeting）、视频风格迁移（保留运动换视觉风格）、运动控制工作流。知识本体来自 2026 运动迁移指南（Styvid/DeepMotion/OpenCreator/Morph）。AI 应用面向 DirectorX：动作复用（衔接 164 动作生成、183 参考、126 风格、211 对应）。
> 来源：Styvid「Motion Transfer AI」、DeepMotion「Unpaired Motion Style Transfer」、OpenCreator「Motion Transfer Workflow」、Morph「Video-to-Video Style Transfer」。

## 概述

**核心断言**：运动风格迁移 = **"动作可以复用"**——参考视频的运动（舞蹈/动作/相机路径）转移到任意新角色/画面（衔接 164：运动迁移的深化——不止"像"，还有"风格"）；**视频风格迁移保留运动换视觉风格**（写实→动画/油画，衔接 126 风格迁移的画面版）。

## 核心概念

### 两类迁移

| 类型 | 迁移什么 | 保留什么 |
|---|---|---|
| 运动迁移 | 动作/姿势/相机 | 角色/场景 |
| 风格迁移 | 视觉风格 | 运动/内容 |

### 运动迁移三要素

```
① 角色输入（图/3D，183 参考）
② 运动参考（视频：舞蹈/动作/相机）
③ 迁移控制（姿态提取/跨结构重定向）
```

## 技巧与示例

### 运动迁移工作流（OpenCreator）

```text
角色图（参考锚定 183）
  → 参考视频（动作/相机运动）
  → 姿态提取（164 遮挡处理）
  → 运动迁移（跨结构重定向）
  → 节奏/风格微调
  → 一致性检查（117）
```

### 风格迁移保留运动（Morph）

写实视频 → 动画/油画：**运动与内容保持，仅换视觉表层**（衔接 126 锁内容换表层——视频版）。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 参考动作不符 | 违和 | 匹配角色 |
| 跨结构硬迁 | 肢体错乱 | 重定向优化 |
| 风格迁移丢运动 | 内容漂移 | 保留运动 |
| 无参考锚定 | 角色漂移 | 183 锚定 |
| 节奏不齐 | 不卡点 | 节奏对齐（127） |

## 工作流应用（AI 映射）

动作复用（衔接 126/164/183）：

```text
角色锚定（183）→ 运动参考
  → 姿态提取/重定向 → 迁移
  → 风格微调（126）→ 一致性（117）
```

**DirectorX 纪律**：动作可复用；跨结构重定向保正确；风格迁移锁运动；参考锚定防漂移。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 运动迁移 | Motion Transfer | 动作转移 |
| 跨结构重定向 | Unpaired Retargeting | 骨架映射 |
| 视频风格迁移 | Video-to-Video | 换表层保运动 |
| 相机运动迁移 | Camera Motion Transfer | 运镜复用 |
| 姿态提取 | Pose Extraction | 关键点 |
| 运动保留 | Motion Preservation | 内容不动 |

## 来源

- Styvid — Transfer Reference Video Motion to an Image：https://www.styvid.com/ai-tool/motion-control
- DeepMotion — Unpaired Motion Style Transfer from Video to Animation：https://deepmotionediting.github.io/style_transfer
- OpenCreator — Motion Transfer: Image + Video Motion Control Workflow：https://opencreator.io/template-motion-transfer
- Morph — Video-to-Video AI: Free Video Style Transfer：https://www.morphstudio.com/video-style-transfer
- ArtificialStudio — Motion Transfer AI：https://app.artificialstudio.ai/tools/motion-transfer