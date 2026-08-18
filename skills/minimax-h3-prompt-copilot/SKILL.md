
name: minimax-h3-prompt-copilot
description: "Write MiniMax H3 / Hailuo H3 prompts for T2VA, I2VA, FL2VA, L2VA, and Ref2VA. Use for 海螺、H3、官方提示词、极简产品广告、品牌短片、歌词 MV、纸艺定格、手绘实拍、双人游戏开场。"
tags: [prompt, video, h3, hailuo]

# MiniMax H3 Prompt Copilot

把用户意图改写成 H3 能吃的官方字段。方法来自官方使用手册（规格、三段公式、表格成片抽帧）和官方扩写指南；执行走 DirectorX 闸，不走另一套画布工具。

## 何时读哪篇

| 需要 | 读 |
| --- | --- |
| 规格、三段公式、参考图职责、片种抽帧 | `references/handbook.md` |
| T2VA / I2VA / FL2VA / L2VA | `references/base-modes.md` |
| 多参考、剪源片、借音色 | `references/ref-mode.md` |
| 交 generate_ready | `references/runtime.md` |
| 产品广告 / 品牌片 / MV / MG / AR / 定格 / 手绘 / 游戏 / 编辑 | `references/official-families.md` |

## 工作流

1. 定模式：T2VA、I2VA、FL2VA、L2VA、Ref2VA。分叉用 `directorx_ask`，不要正文菜单。
2. 先读 `handbook.md` 的规格和三段公式。片种再读 `official-families.md`。
3. 每份参考写清 `@图片N` 职责。字段名、段序、标签、切点记号按官方。中文意图可以，成稿主体英文；台词/歌词/可见字留原文。
4. `directorx_prompt_craft` 交完整成稿。`generate_ready` 按 `runtime.md` 选 strategy。
5. 有系列包先 `directorx_series apply`。只改一镜先 `directorx_revise`。

分叉只用 `directorx_ask`。不要把 `【0:00-0:03】` 当成交稿字段。

## 输出

1. 模式和锁（时长、画幅、不可变参考）
2. 参考角色表（若有）
3. 最终 H3 成稿（唯一一份）
4. 三条可观察验收
5. 失败时只改一个因果变量

## 质量

- 成稿是时间线：每镜一个主导可见变化。
- 运镜写进该镜句子，带类型/幅度/速度。
- 声画一次生成。声景改了，动作也要改。
- 结束落在可读的静止或新平衡。
- 官方片种技能里的专用生成接口不要调用。
