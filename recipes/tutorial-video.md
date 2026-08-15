
name: 教程
description: 教程/知识分享视频（2-15min）从主题到成片，步骤清晰 + 可视化——单元化制作、占位先行

# 教程配方（2-15min）

步骤清晰、屏幕/图示可视化、语速适中、留白可消化。

制作方式：**单元化制作**（见 unit-production 配方）。

## 阶段序列
1. **outline**（对话，不调工具）— 大纲（步骤清单）→ 讲稿；用户确认
2. **plan** — 分镜表；每步骤一个镜头，图示/文字在安全区内
3. **placeholders** — 全部镜头排队，用户确认后执行
4. **assemble**（video_edit / ffmpeg）— 拼接 + 响度
5. **subtitle**（dynamic_subtitle）— 给成片加字幕
6. **package**（package_deliver）— 封面 + 标题

## 门禁
- 步骤逻辑（先后/依赖）在 plan 阶段确认
- 文字/图示可读性在质检阶段重点检查（qa_inspect）；占位未齐不得开始生成