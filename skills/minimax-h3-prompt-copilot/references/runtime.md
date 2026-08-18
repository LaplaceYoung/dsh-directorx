# H3 在 DirectorX 里怎么交

官方字段写进 `prompt_craft` 成稿。交生成仍走 `generate_ready` + `craftId`/`readyId`。运行时能力以当前视频配置为准，不以本页或社区传言为准。

## 模式对照

| 官方 | ready strategy | 传参 |
| --- | --- | --- |
| T2VA | `t2v` | 只交成稿 |
| I2VA | `i2v` | `firstFrame` = Picture 1 |
| FL2VA | `fl2v` | 首帧 + 尾帧 |
| L2VA | `i2v` | 只传尾帧，成稿用 L2VA 对齐句 |
| Ref2VA | `ref2v` | 多参考图；**已有首/尾帧就不要再传 reference 角色** |

时长默认夹到 4–15 秒。无图才传画幅。有图时画幅跟参考。分辨率默认 1440p（官方推荐）。成稿 ≤7000 字。首尾帧边长 256–5760、宽高比 5:2～2:5。全参考图 ≤9，不要和首尾帧混用。

## 成稿闸

- 字段名必须是官方那一套，不要自造 `Timeline:` 替代 `integrated_multimodal_description`。`【0:00-0:03】` 只可当内部节拍草稿，交模型前改成 `[Shot N] At …`。
- 成稿是时间线，不是形容词堆。每镜一个主导动作。
- 声画一次生成：环境/动作声进 `overall_soundscape`，台词进描述字段。
- 同一系列先 `directorx_series apply`。只改一镜先 `directorx_revise`。

## 什么时候别用 Ref2VA

- 只有一张首帧、要它往前演：走 I2VA。
- 只要首尾插值：走 FL2VA。
- 参考互相打架又没拍板：先 `directorx_ask`，不要静默丢参考。
