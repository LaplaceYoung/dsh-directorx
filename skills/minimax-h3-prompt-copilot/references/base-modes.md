# H3 基础模式（T2VA / I2VA / FL2VA / L2VA）

内化自 MiniMax H3 官方提示词写作指南。字段名、镜头标记、对齐句保持官方英文。台词、歌词、画面可见文字保留原文。

时长 4–15 秒。`[Shot 1]` 不写时刻；后续镜用严格递增的切点：`[Shot 2] At 00:03.500, ...`

## 模式

| 模式 | 输入 | 正文怎么写 |
| --- | --- | --- |
| T2VA | 纯文本 | 无对齐句。从三个核心字段起笔。 |
| I2VA | 一张首帧 | 先写固定对齐句，再从 `<Picture 1>` 往前演。 |
| FL2VA | 首帧 + 尾帧 | 对齐句钉 0.00 与片尾。写中间路径，不要复述两张静帧。 |
| L2VA | 一张尾帧 | 对齐句钉片尾。先写合理前态，再收敛到图。 |

DirectorX 对照：T2VA→`t2v`；I2VA→`i2v`；FL2VA→`fl2v`；L2VA→只传尾帧的图生（不要当首帧）。有首/尾帧时不要再塞 `role:reference`。

## 对齐句（必须是成稿第一行，后空一行）

I2VA：

```text
For the target video, at 0.00 seconds into the target video, <Picture 1> (from [Shot 1]) is fully referenced.
```

FL2VA：

```text
How the reference pictures align with the target video — Picture 1 (from Shot 1) aligns with the 0.00-second mark of the target video; Picture 2 (from Shot N) aligns with the S.SS-second mark of the target video.
```

`S.SS` 是成片时长，两位小数。`N` 是真正最后一镜。

L2VA：

```text
How the reference pictures align with the target video — <Picture 1> (from [Shot N]) aligns with the S.SS-second mark of the target video.
```

## 三个核心字段（顺序固定）

```text
integrated_multimodal_description: [Shot 1] ...

overall_soundscape: ...

non_diegetic_music: ...
```

- `integrated_multimodal_description`：可见可闻的时间线——风格、构图、动作、切镜、台词、画内声。
- `overall_soundscape`：1–4 句环境声、动作物理声、非语言人声。不复述台词。全静才写 `N/A`。
- `non_diegetic_music`：1–3 句观众才听得见的配乐（乐器、速度、动态）。角色听得见的歌/广播写进描述字段。没有写 `N/A`。

`[Shot 1]` 开头先定风格：`Cinematic` / `live-action` / `2D-animated` / `3D CG` / `claymation` / `watercolor` / `vintage film`。有参考图就从图里读风格。

## 切镜与运镜

切镜要带新信息（主体、空间、状态、视点、时间）。只换景别或小角度，优先运镜。

普通切：`the camera cuts to`。用户点名才用叠化/淡/擦。

运镜写成句内动作，不要堆标签。完整表达 = 类型 + 有意义的幅度 + 速度：

| 类型 | 写法 |
| --- | --- |
| 变焦 | Zoom In / Zoom Out |
| 机身前后 | Push In / Pull Out |
| 原地水平 | Pan Left / Pan Right |
| 平移 | Truck Left / Truck Right |
| 原地俯仰 | Tilt Up / Tilt Down |
| 升降 | Pedestal Up / Pedestal Down |
| 绕拍 | Arc Shot |
| 跟随 | Tracking Shot |
| 固定 | Static Shot |
| 抖动 | Shake Slightly / Shake Strongly |
| 主观 | POV |
| 滚转 | Roll Clockwise / Roll Counterclockwise |

幅度：`with small amplitude` / `with large amplitude`。速度：`at slow speed` / `at fast speed`。中等幅度和常速可省略。

```text
The camera pushes in with small amplitude at slow speed toward the folded letter in her hands.
```

## 说话人与可见文字

- 说话人稳定编号 `(S1)` `(S2)`；同说用 `(S1,S2)`。从不发声的人不编号。
- 身份、音色、语速写在 `<d>` 外。`<d>` 里只有语言标签和原文，标点不许改。
- 画外音必须用 `says in an off-screen voiceover`，并写 `while his/her lips remain completely closed`。
- 台词跨切用 `<scenetrans>`；片尾截断用 `<cutoff>`。
- 招牌/字幕/霓虹用英文双引号原样引用，不翻译。

## 怎么展开

- I2VA：首帧锚 → 起势 → 连续发展 → 结果。身份、服装、空间跟图。
- FL2VA：优先单镜插值。H3 **不会自动加切镜**。首帧状态 → 可观察中间变化 → 差距收窄 → 尾帧。最后一镜必须落到尾帧。
- 台词长短必须配得上该镜秒数。跨镜对白写明从哪镜接到哪镜。
- 环绕运镜写 `truck left + pan right`（或反过来），不要只写「环绕」。
- 画内文字易乱码：把字做成参考图，写明「按图片理解，不要当文字处理」。
- L2VA：合理前态 → 动作路径 → 末镜收敛 → 尾帧落地。图属于最后一镜，不属于 Shot 1。
