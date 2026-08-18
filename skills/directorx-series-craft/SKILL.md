
name: directorx-series-craft
description: "Lock a show's cast, look, and shot rules as a series pack; apply them on the next episode; revise one shot without re-entering the film. Use for 同一系列、下一集、保存这次设定、表情再生动点、改这一镜."
tags: [series, continuity, revise, cast, look]

# 系列包与单镜改

方法技能管「这类片子怎么做」。系列包管「这一摊人、这种光、这些镜头规矩」。两件事不要捏成一份。

## 什么时候用
- 同一短剧的下一集、同一产品线的下一条、同一角色宇宙的下一支预告。
- 用户说「保存这次设定」「沿用上一集」「表情再生动点」「只改这一镜」。
- 不要用在一次性静帧探索。那种走普通 craft。

## 三层
1. **这一次的意图**：用户原话，进 prompt_plan。
2. **系列包**：角色锚 + 风格锁 + 镜头规则。`directorx_series` harvest / save / list / apply。
3. **方法技能**：流程、模型、分镜纪律。`directorx_skill_capture`。

apply 不生成。它只把人设和画风装回当前项目。

## 收成
交片后：
1. `directorx_skill_capture` 问要不要存方法。
2. 有锁人设或风格锁就 `directorx_series save`。
3. 用户改过的地方用 `directorx_note` 记进包。

不要重设计已经锁死的脸和色。下一集缺的是新情节，不是新主角。

## 套用
`directorx_series list` → `apply` → `character_list` / `style_get` 核对 → 再写下一镜的稿。生成仍走 craft + ready。characters 参数必须带上包里的名字。

## 只改一镜
用户指着某一卡说「这里表情再生动点」：
1. `directorx_revise { nodeId, change }`
2. `directorx_note`
3. 用返回的成稿种子走 craft / ready
4. `canvas_update` 只改这个节点的 path

不要让用户再报一遍人设。不要重做邻镜。时间窗重做仍走 `directorx_canvas_reshoot`。

## 什么时候别用
- 用户要换主角、换片种：开新系列包，不要 apply 旧的再硬改。
- 裁切、调色、变速：走 edit_plan，不要 revise 重绘。
- 整条重剪：走 pack / timeline，不是逐镜 revise。

## 并行
系列推进（claim 下一条画布意图）和单镜 revise 可以同时在板上存在。claim 一次只拿一条意图。不要为了改眼睛把整板 intent 清掉。
