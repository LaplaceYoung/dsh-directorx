# H3 全参考模式（Ref2VA）

内化自 MiniMax H3 官方全参考改写指南。六段英文，顺序固定。台词/歌词/画面可见文字保留原文。

运镜、说话人、`<d>`、切点规则与 `base-modes.md` 相同。本页只管标签、保留分析和 Ref2VA 字段差。

DirectorX：`generate_ready` 用 `ref2v`。已有首/尾帧时不要再传 `role:reference`。参考图 ≤9、参考视频 ≤3（各 2–15s、合计 ≤15s）、参考音频 ≤3；混输总文件 ≤12。

## 六段顺序

| 段 | 作用 |
| --- | --- |
| `subject_definitions` | 给每个要追踪的参考打标签 |
| `summary` | 任务类型 + 主参考关系 |
| `retention_analysis` | 每条参考怎么保、怎么转、怎么复用 |
| `detailed_description` | 按播放顺序写画面、动作、声、台词 |
| `overall_soundscape` | 环境与物理声 |
| `non_diegetic_music` | 观众配乐 |

## 标签

| 标签 | 含义 |
| --- | --- |
| `<Subject N>` | 要从参考里抽出、可复用的可见内容（人/物/场/服/风格/动作） |
| `<Picture N>` | 图本身当首帧、关键帧、尾帧或构图锚 |
| `<Video N>` | 整段视频关系：剪源片、续尾、借剪辑节奏 |
| `<Audio N>` | 拷贝或只借音色/节奏/歌词的音频 |

标签一旦定下，六段里含义不许变。图只用来定义人物时，写进 `<Subject N>`，不要单独开 `<Picture N>`。视频里的人仍是 Subject；`<Video N>` 管结构来源。

`<Video N>` 与 `<Audio N>` 各自编号，不相绑。源片有声不会自动生成 Audio 标签。

## summary 任务类型

段首方括号，多类型用 ` + ` 连接、不重复：

| 类型 | 何时 |
| --- | --- |
| `keyframe completion` | 图钉具体帧 |
| `reference generation` | 图/视频/音频只提供外貌、风格、动作、分镜，不当源片、不当具体帧 |
| `video editing` | 直接改现有源片 |
| `video continuation` | 从源片往后接 |
| `audio reuse` | 原音频整段或部分拷贝 |
| `audio reference` | 只借音色、节奏、风格，不拷信号 |

有源片时 summary 在类型后写：`The target video is an edited version of <Video 1>.`

## retention_analysis

可见内容：`fully_preserved` / `partially_preserved` / `attribute_transfer` / `weak_reference`。

音频：`fully_copy` / `partially_copy` / `reference` / `weak_reference`。

一行一个标签。不要把目标片里新加的动作当成保真失败。

```text
<Subject 1> (appears in [Shot 1], [Shot 3]): fully_preserved - ...
<Audio 1>: reference - timbre only, signal not copied.
```

## detailed_description

风格用一两句英文写在 `[Shot 1]` 之前。生成任务通常 350–500 英文词；对白密的先排完时间线。编辑任务按源片复杂度伸缩。

引用落点写成自然句：`the shot begins from <Picture 1>` / `the shot ends on <Picture 3>`。

说话人同时保留视觉标签和编号：`<Subject 2> (S1) says, <d>[English] ...</d>`。听不清写 `[unclear]`，不要猜。

BGM 里的唱词如果没有独立发声源，用 `<Audio N>` 当声源，不要发明 `(Sx)`。
