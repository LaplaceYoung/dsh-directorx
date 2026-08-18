# H3 视频提示词 · 写法规范（内化版）

方法论学自 MiniMax-H3 官方提示词指南（I2VA / 多图对齐模式），**内化成本 skill 自带文档——不依赖任何外部 skill**。整条成片还要读 `minimax-h3-prompt-copilot` 的 `base-modes.md` / `ref-mode.md`。写每段的 `h3Prompt` 照这份做，结构部分有质量门逐字对账。

## 语言分工

- **默认整条英文**（`promptLang: 'en'`）——官方规范的口径：正文、对齐指令、字段名、镜头标记全英文，禁角色名（用 an old ferryman 这类通用身份）
- 三样东西保留原文语言（官方规定）：**台词**（`<d>[Chinese] …</d>` 逐字原文，一个标点都不许动，门盯着）、歌词、画面里可见的文字（英文双引号原样引用）
- `promptLang: 'zh'` 可切整条中文（对齐指令、字段名、镜头标记都有中文版，人名放行）——偏离官方推荐的备选项，实测中文效果不稳就回英文

## 结构（validate 逐字对账的部分）

```text
How the reference pictures align with the target video — Picture 1 (from Shot 1) aligns with the 0.00-second mark of the target video; Picture 2 (from Shot 2) aligns with the 3.00-second mark of the target video; ….
（单分镜的段改用官方 I2VA 固定句：For the target video, at 0.00 seconds into the target video, <Picture 1> (from [Shot 1]) is fully referenced.）

integrated_multimodal_description:
[Shot 1] Cinematic, live-action, cold gray-green palette. 按 <Picture 1> 的构图锚定人物与状态，再写这几秒发生什么、镜头怎么动、谁说了什么（全英文）。
[Shot 2] At 00:03.000, the camera cuts to <Picture 2>: ……（**每个镜头独立一行**，切点时刻开头，等于前面分镜秒数的累计）

overall_soundscape: 1–4 句英文：环境声、动作声、非语言人声。不复述台词。

non_diegetic_music: 1–3 句英文写配器与速度（角色听不见、只有观众听得见）。没有就写 N/A。
```

中文模式（promptLang=zh）的对应 token：`参考图与目标视频的对齐——` / `整体视听描述：` / `[镜头 k] 于 00:0X.XXX，`，配乐没有写「无」。

首行对齐指令和切点时刻**由分镜秒数推导**，改了秒数忘改提示词，validate 当场拦。

## 运镜

- 词表 20 种（schema.md 的 camera 枚举），可加幅度（小幅/大幅）与速度（缓/快），写成自然动作句：「镜头小幅缓推向掐白的指节」
- **每个分镜的运镜词必须落在自己那一行里**：英文用官方词（static shot / push in / tracking shot……），中文模式用词表的中文词（固定/推/拉/跟拍……）——门按 `promptLang` 检查

## 说话人与台词

- 说话人第一次出现给足辨识信息（身份、年龄段、音色、语速），编号 `(S1)` `(S2)` 全段稳定；同说不同人用 `(S1,S2)`
- `<d>` 里只放语言标签和台词原文；身份、音色、语气写在 `<d>` 外面
- **画外音**：中文写「以画外音说（唇形完全闭合）」；英文用官方句式 `says in an off-screen voiceover … while their lips remain completely closed`
- 画面里真实可见的文字（招牌、字条）用英文双引号原样引用，不翻译

## 声音字段的分工（踩过的坑）

- 台词、歌声、剧内音乐 → 描述字段；环境与动作声 → `overall_soundscape`；配乐 → `non_diegetic_music`
- **声景也是动作指令**：画面动作改了，声景必须一起改——声景里写「铜铃在撞击时炸响」，视频就真把撞击演出来

## 关键帧怎么用

- 主分镜图（f1）钉 0.00 秒，是这一段世界观的完全参照；每个 `[Shot k]` 先锚定 `<Picture k>` 的构图与人物状态，再写动作展开
- 动作遵守 novel-script 的**常见动作原则**：挑担上船、搭手卸担这类模型见过千万次的动作；精确物理交互、微表情不要写
- 人物**此刻的位置状态**（已上船 / 在舱内）要和分镜图一致——图与文对不上，模型听图的，动作就乱