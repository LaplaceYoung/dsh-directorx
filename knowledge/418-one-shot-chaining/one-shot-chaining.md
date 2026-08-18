---
type: Reference
title: "长镜与一镜到底续接（One-Shot & Long Take Chaining — Seamless Continuity + AI）"
description: "AI 伪一镜到底的分段续接方法：首尾帧衔接、运动矢量延续、场景卡、隐藏剪辑点，穿过门/遮挡/转场动作/同构图延续四类无缝转场，长镜内角色场景光一致性维持，接缝校验与修复"
tags:
  - "craft"
  - "editing"
  - "character"
  - "continuity"
  - "i2v"
status: stable
stale_after: "2027-08-18"
generated:
  by: "process:directorx-knowledge-okf"
  at: "2026-08-18T00:00:00Z"
verified:
  - by: "process:knowledge-audit"
    at: "2026-08-18T00:00:00Z"
sources:
  - resource: "cited:Offscreen 1917: The 'Hard Work' of the Digital Long Take"
    id: cite-1
    title: "1917: The 'Hard Work' of the Digital Long Take"
    author: "org:Offscreen"
  - resource: "cited:https://offscreen.com/view/1917-the-hard-work-of-the-digital-long-take"
    id: cite-2
    title: "https://offscreen.com/view/1917-the-hard-work-of-the-digital-long-take"
  - resource: "cited:OpenAI Sora 2: Prompting Guide"
    id: cite-3
    title: "Sora 2: Prompting Guide"
    author: "org:OpenAI"
  - resource: "cited:https://developers.openai.com/cookbook/examples/sora/sora2_prompting_guide"
    id: cite-4
    title: "https://developers.openai.com/cookbook/examples/sora/sora2_prompting_guide"
  - resource: "cited:Google Generate videos with Veo 3.1 in Gemini API"
    id: cite-5
    title: "Generate videos with Veo 3.1 in Gemini API"
    author: "org:Google"
  - resource: "cited:https://ai.google.dev/gemini-api/docs/veo"
    id: cite-6
    title: "https://ai.google.dev/gemini-api/docs/veo"
  - resource: "cited:可灵 视频延长 API"
    id: cite-7
    title: "视频延长 API"
    author: "org:可灵"
  - resource: "cited:https://klingai.com/document-api/api/video/1-6/video-extension"
    id: cite-8
    title: "https://klingai.com/document-api/api/video/1-6/video-extension"
  - resource: "cited:Morphic Seedance 2.0 Complete Guide"
    id: cite-9
    title: "Seedance 2.0 Complete Guide"
    author: "org:Morphic"
  - resource: "cited:https://morphic.com/resources/how-to/seedance-2-guide。"
    id: cite-10
    title: "https://morphic.com/resources/how-to/seedance-2-guide。"
dx_id: "418"
related:
  - "207-one-shot-long-take/one-shot-long-take.md"
  - "408-multi-shot-consistency/multi-shot-consistency.md"
  - "407-reference-first-last-frame/reference-first-last-frame.md"
  - "116-image-to-video-control/image-to-video-control.md"
  - "117-ai-consistency-system/ai-consistency-system.md"
---

# 长镜与一镜到底续接（One-Shot & Long Take Chaining — Seamless Continuity + AI）

> 本页为 AI 长镜/一镜到底的分段续接方法：首尾帧衔接、运动矢量延续、场景卡、隐藏剪辑点与四类无缝转场。知识本体来自电影长镜头/一镜到底镜头惯例——隐藏剪辑手法（遮挡、甩镜、过门、黑场等，来源 Offscreen 对《1917》《Rope》《Running Time》的拆解）。AI 应用面向 DirectorX：把"一个镜头讲完"的意图拆成多段生成、再把接缝藏起来（衔接 207 长镜头、408 多镜一致、407 参考图首尾帧、116 图生控制、117 一致性、174 质检）。
> 来源：Offscreen「1917: The 'Hard Work' of the Digital Long Take」、https://offscreen.com/view/1917-the-hard-work-of-the-digital-long-take；OpenAI「Sora 2: Prompting Guide」、https://developers.openai.com/cookbook/examples/sora/sora2_prompting_guide；Google「Generate videos with Veo 3.1 in Gemini API」、https://ai.google.dev/gemini-api/docs/veo；可灵「视频延长 API」「图生视频 API」、https://klingai.com/document-api/api/video/1-6/video-extension；Morphic「Seedance 2.0 Complete Guide」、https://morphic.com/resources/how-to/seedance-2-guide。

## 概述：长镜头的美学价值与 AI 分段生成的矛盾

**核心断言**：长镜头的价值全部建立在"**没有剪辑点**"之上——时间连续、空间连续、情绪在场；而 AI 视频模型恰恰在"单次生成时长"上最弱。因此 **AI 长镜 = 伪一镜到底**：把意图拆成多段短生成，再用电影导演几百年来练就的**隐藏剪辑（Hidden Cut）**手法把接缝藏起来。

### 长镜头为什么值得做（美学价值）

| 价值 | 机理 | 电影惯例来源 |
|---|---|---|
| 时间真实感 | 无剪辑 = 屏幕时间 ≈ 故事时间，时空不被切割（巴赞：长镜头是"更真实的风格"，长镜头 = 对现实的尊重） | Offscreen 拆解：Bazin 式长镜头理论 |
| 沉浸感 | 观众越意识到"没有剪辑"，越专注画面；剪辑点消失后注意力无处逃逸 | Offscreen：长镜的沉浸论证 |
| 情绪在场 | 连续镜头让观众"陪角色经历"，事件不再被剪辑修饰 | 《1917》布雷克之死的连续长镜：观众只看到角色看到的 |
| 难度即叙事 | "一镜到底的艰难"投射为角色的处境（Offscreen 称之为 Relative Labor Equation）——动作片走廊打斗一镜到底（《老男孩》《Daredevil》）即此逻辑 | Offscreen：Relative Labor Equation |

### AI 的矛盾：长镜欲望 × 短生成现实

主流模型单次生成上限（全部来自官方文档/权威指南）：

| 模型 | 单次上限 | 官方对"长"的态度 |
|---|---|---|
| Sora 2（OpenAI） | 最长 20s | 官方明言："模型在更短的片段里更可靠，与其生成一条 8 秒，不如剪辑台上拼两条 4 秒" |
| Veo 3.1（Google） | 单次 8s | 官方提供扩展：每次延长 7 秒、最多 20 次、合成单条最长约 148 秒 |
| Kling（可灵） | 单次 3-15s | 官方提供视频延长：单次延长 4-5s，可反复延长但总时长 ≤3 分钟 |
| Seedance 2.0（字节） | 单次 4-15s | 官方教程：用视频延长/桥接续接，链条要短 |

**结论**：模型给的"长"都是**续出来的长**——这正是电影导演做过一百年的事。《1917》看似一镜到底，实为 29 处隐藏剪辑拼成；《Running Time》70 分钟藏了 29 个剪辑（全用甩镜或画面内物体掩护）；《Rope》把一半剪辑藏进转身与家具遮挡。**AI 长镜的工艺 = 电影隐藏剪辑方法论 × 模型续接能力**（衔接 207 长镜头：分段链式生成与隐藏接缝的底层机制）。

## 分段续接原理（首尾帧衔接 · 运动矢量延续 · 场景卡 · 隐藏剪辑点）

一条 AI 长镜由四个机制共同构成。前三个是"怎么接"，第四个是"藏在哪接"。

### 1. 首尾帧衔接（First/Last Frame Chaining）——接"状态"

**上一段尾帧 = 下一段首帧**。模型在两点之间插值（Veo 3.1 官方称首尾帧生成为 interpolation；可灵 `image` 首帧 + `image_tail` 尾帧双端约束），保证角色位置、姿态、服装、光线的起点与上段终点一致（衔接 407 参考图首尾帧：尾帧是约束不是参考）。

- Veo 3.1：`first_image` + `last_image` 双帧插值（官方示例：鬼魂荡秋千 → 空秋千）。
- Kling：`image` 与 `image_tail` 至少二选一，首尾双锁。
- 关键纪律：尾帧必须是"**运动落定且可继续**"的状态——姿态停在动作中途（mid-gesture），给下一段留出起步空间；尾帧与首帧同比例（衔接 407 的即梦约束：尾帧比例必须与首帧相同）。

### 2. 运动矢量延续（Motion Vector Continuity）——接"动势"

接缝两侧不能"位置对上了但速度/方向断裂"。运动延续 = 速度、方向、相位在段边界处连续：

- **主体运动**：段末的动势写进提示词——Seedance 2.0 官方实践模板："角色保持在段尾的**同一位置、动作进行到一半**（mid-gesture），这一镜头**顺滑地继续这个动作**（continues the motion smoothly）"。不要写成"重新开始走"，要写成"继续走"。
- **相机运动**：可灵 `camera_control` 提供六轴运镜参数（horizontal/vertical/pan/tilt/roll/zoom，-10~10），分段生成时逐段给出**同方向同速率**的数值；模型级延长（Veo/Kling/Seedance）则由模型自动延续相机路径。
- **轨迹级控制**：可灵 `dynamic_masks` 运动笔刷可直接给"轨迹点坐标序列"（2-77 个点）——这就是显式的运动矢量：把段末最后几个轨迹点作为下一段前几个点，运动方向无缝。

### 3. 场景卡（Scene Card）——接"世界状态"

每一段的输入契约（衔接 123 场景卡、408 锚点体系）：段末世界状态 → 段首世界状态。字段：

| 字段 | 内容 | 变化规则 |
|---|---|---|
| 角色 | 位置、朝向、姿态、表情、动作进度 | 逐段更新，段边界必须与上段尾帧一致 |
| 空间 | 所在区域、门/窗/障碍物相对位置 | 只有穿过空间边界时才变（过门/转角） |
| 道具 | 位置、状态（杯子的水、信封是否打开） | 逐段更新，段边界继承 |
| 光线 | 色温、主光方向、明暗比、时间感 | 长镜内**连续演变**，不跳变 |
| 音画 | 环境声情绪、节奏 | 段边界保持同一声场（衔接 401/119） |

### 4. 隐藏剪辑点（Hidden Join）——接"藏在哪"

接缝必须藏在"观众看不见的位置"。Offscreen 对一镜到底电影的拆解给了完整清单（mise-en-trickery）：**深色外套、黑空间、家具、角色走过镜头前、甩镜（whip pan）**。《1917》29 处剪辑全部用甩镜或画面内物体（门、外套、身体）掩护；数字时代更升级为 Deakins 所称的 **blend（数字缝合）**——用合成把接缝抹平，甚至加一道数字阴影掩护空间切换。

**AI 翻译**：接缝点选择 = 分段切点设计。切点必须落在四类"天然掩护"之一（详见第四节无缝转场技巧）；切点裸接是长镜失败的第一原因。

### 三种续接模式的工具对照

| 模式 | 机制 | 工具（官方能力） | 适用 | 注意 |
|---|---|---|---|---|
| 整段延长 | 模型读整段视频上下文，从结尾续写 | Sora 2 Extensions（`POST /v1/videos/extensions`，"the full original clip is used as context"）；Veo 3.1 扩展（7s/次×20，合成 ≤148s，720p）；Kling 视频延长（4-5s/次，总 ≤3min） | 单镜头内持续推进 | 链条越接越糊（Seedance 官方警示：每次回喂生成视频都会劣化，先在脸部出现色块） |
| 尾帧续接 | 上段尾帧图 = 下段首帧图，独立生成 | Kling `image`+`image_tail`；Veo 首尾帧插值；即梦/Seedance 首尾帧接口 | 运动/空间变化较大的续接 | 尾帧须与首帧同比例；尾帧是"落定状态"（衔接 407） |
| 桥接生成 | 生成一段过渡内容把两段已有视频缝起来 | Seedance 2.0 视频融合（fusion）："在 @Video 1 与 @Video 2 之间生成 5 秒过渡段" | 两段独立素材要合成一镜 | 桥接段须同时参考两段的尾/首帧状态与光线 |

**DirectorX 纪律**：能用整段延长就用整段延长（上下文最完整）；延长会糊就退回"尾帧续接"独立生成；两段素材来自不同批次时用桥接生成。

## 长镜分段流程（从长镜意图到拼接校验的 SOP）

六步 SOP，从"想要一个镜头"到"拼接校验通过"：

```text
① 长镜意图定案（这一镜讲完什么？一条路径走通？）
② 路径分段（按空间/动作节点切成 4-8s 段，切点落在掩护处）
③ 每段参考装配（首帧=上段尾帧 + 锚点 + 运动参考）
④ 续接生成（延长 / 尾帧 / 桥接三选一，写"连接动作 + 保持项"）
⑤ 拼接（顺序对齐，接缝处按需修剪 6+1 帧）
⑥ 校验（逐段过检：接缝 / 运动 / 光 / 身份，不合格只重生成该段）
```

### ① 长镜意图定案

先回答三个问题（衔接 207 单镜路径、168 运镜）：**一条路径**（推进→环绕→跟随）、**一个核心动作**（从哪到哪）、**一种情绪曲线**（衔接 158 情绪曲线）。一镜到底不是"把所有镜头连起来"，而是"一个连续时空里完成一次叙事"——意图不清，分段必乱。

### ② 路径分段

- 每段 4-8 秒（Sora 官方："更短的片段更可靠，拼两条 4 秒好过一条 8 秒"；Seedance 官方建议延长段 5-8 秒）。
- 切点 = 空间边界或动作节点：**进门、转角、遮挡、甩镜、主体占满画面**——这些位置天然掩护接缝（Offscreen 清单）。
- 每段只安排**一个主要动作**（Sora 官方：每镜一个清晰的相机运动 + 一个清晰的主体动作）。
- 段表示例：

| 段 | 时长 | 空间 | 主体动作 | 相机 | 接缝策略 |
|---|---|---|---|---|---|
| 01 | 6s | 走廊 | 走向门口 | 跟随后退 | —（起点） |
| 02 | 5s | 门→室内 | 推门进入 | 跟随穿过 | 过门黑场掩护 |
| 03 | 6s | 室内 | 走到窗边停步 | 侧移缓推 | 前景绿植划过遮挡 |
| 04 | 5s | 窗边 | 望向窗外 | 推近特写 | 甩镜起幅藏接缝 |

### ③ 每段参考装配

每段的输入 = 四件套（衔接 408 锚点体系、407 参考图手册）：

1. **首帧**：上段通过的尾帧（尾帧续接模式）或上段整片（延长模式）；
2. **锚点**：角色参考图（Veo 最多 3 张；Sora 角色资产 + 提示词指名）、场景标准图、风格参考；
3. **运动参考**（可选）：Seedance 2.0 视频参考（"@Video 1 for the walking pace"）、Kling 运动笔刷轨迹；
4. **场景卡**：本节世界状态。

### ④ 续接生成——提示词模板（AI 理解与实现）

**模板 A：延长模式**（Veo 扩展 / Kling 视频延长 / Sora Extensions / Seedance "Generate the content after @Video 1"）：

```text
[连接动作：角色从段尾状态继续做什么——位置、姿态、动作进度必须衔接上段结尾]
[保持项：相机角度、景别、光线方向、调色、角色服装，逐项点名]
[环境变化：如果跨空间/跨光，显式写出过渡——"穿过门框，光线从室外日光过渡为室内暖光"]
[段尾落点：本段结束时角色处于什么状态，给下段留 mid-gesture]
```

示例（Seedance 官方示例结构）：`Generate the content after @Video 1. The CEO from the end of the video opens the conference room door and enters. … Maintain the same professional color grading and lighting style from @Video 1.`

**模板 B：尾帧续接模式**（Kling `image`+`image_tail`）：

```text
[主体动作与方向：从上段尾帧位置开始，动作保持连续性——"continues the motion smoothly"]
[保持项：同一角色、同一服装、同一场景、同一光线]
[相机动作：与上段同方向同速率，或按 camera_control 数值延续]
[负向：morphing, changing clothes, lighting jump]
```

**模板 C：桥接模式**（Seedance 融合两段素材）：

```text
Create a 5-second transition segment between @Video 1 and @Video 2.
[角色从 @Video 1 结尾的位置/动作出发]…[到达 @Video 2 开头所呈现的位置/动作]。
Match the character's appearance, walking pace, and movement style from both reference videos.
Lighting transitions from [段1光线] at the start to [段2光线] at the end.
```

### ⑤ 拼接

顺序对齐后，接缝处理：Seedance 官方实践——**剪掉出段尾约 6 帧 + 入段首约 1 帧**，把模型生成时接缝处那几帧"重影/跳变"直接裁掉；再在剪辑台上对两帧做 1-2 帧交叉溶解（衔接 127 剪辑节奏：溶解不可见，观众只感知连续）。

### ⑥ 拼接校验（生成后检查）

逐段过检（衔接 174 质检、408 抽帧比对），**每段通过才拼下一段**：

| 检查项 | 通过标准 | 失败处理 |
|---|---|---|
| 接缝可见性 | 接缝两侧 5 帧逐帧播放无跳变、无重影 | 裁 6+1 帧；仍跳 → 重生成该段并在切点安排遮挡 |
| 运动连续 | 段边界处速度无停顿、无瞬移 | 改提示词为"continues the motion"，或补 mid-gesture 尾帧 |
| 光连续 | 亮度/色温跨接缝平滑演变，无突变 | 桥接段过渡光；或统一 LUT（衔接 141） |
| 身份连续 | 角色脸/服装跨段一致 | 回退锚点重生成（衔接 408 修复铁律） |
| 画框连续 | 景别/机位高度/比例无跳变 | 首尾帧同比例出图；构图延续（见下节） |

## 无缝转场技巧（穿过门 / 遮挡 / 转场动作 / 同构图延续）

四类转场 = 四类"藏接缝的天然掩护"。每个技巧给出**电影惯例 → AI 提示词 → 检查修复**。

### 1. 穿过门 / 穿越（Doorway / Portal Transition）——空间切换的万能掩护

- **电影惯例**：《1917》从战壕到农舍、从室内到教堂庭院，切换都发生在角色穿过门/窗口时；门框、阴影、黑场天然遮挡视线切换（Offscreen：黑空间 black space 是经典掩护）。
- **AI 落地**：把分段切点放在"角色推门/进门"处。门框划过画面 → 下一段画面已在新空间，且光线过渡被"进门"合理化。Seedance 官方示例即此结构："CEO 开门进入会议室，室内光线匹配 @Image 1 的设计"。
- **提示词**：`[角色] 推开门走进 [新空间]。光线从门外的[旧光]平滑过渡为室内的[新光]，色温随进入逐渐变化。相机保持跟随，不停顿。`
- **检查修复**：进门前后各 3 帧的亮度差应呈渐变而非突变；突变 → 提示词明确"过渡为"，或加桥接段。

### 2. 遮挡转场（Occlusion / Pass-by Wipe）——画面内物体掩护

- **电影惯例**：角色走过镜头前、深色外套占满画面、家具/柱子划过前景——Offscreen 列举的经典掩护；《Running Time》用"门、衬衫、身体"藏全部 29 个剪辑。
- **AI 落地**：段末安排"前景物体（行人、车辆、柱子、绿植、手部）划过镜头"，接缝藏进被遮挡的 2-3 帧。物体占满画面时是画面信息最低点，观众无信息可对。可灵动态笔刷可锁定前景物体轨迹，确保它真的划过。
- **提示词**：`[段末] 前景驶过的车辆短暂遮住镜头，遮挡消散后镜头已跟随角色进入下一区域。`
- **检查修复**：检查遮挡是否"完全遮住"（半遮会暴露接缝）→ 提示词加"completely fills the frame"；遮挡瞬间的重影 → 裁掉遮挡峰值前后各 2 帧。

### 3. 转场动作（Continuity Action / Whip Pan）——用动势跨接

- **电影惯例**：甩镜（whip pan / swish pan）——镜头极速横摇，画面变成动态模糊，接缝藏进模糊帧（《1917》与《Running Time》的主要手段）；或用连续动作（转身、弯腰、抬手）跨接，观众注意力跟着动作走。
- **AI 落地**：段末写"快速横摇"（相机运动模糊帧），下一段从横摇终点起幅；或让角色段末做"转身/低头/走位"动作，段首继续同一动作的下一半。
- **提示词**：`[段末] 镜头快速横摇 90 度，画面动态模糊。[段首] 横摇停住，角色已在新的位置继续行走，步伐节奏不变。`（Seedance 官方模板：`the character should be in the same position, mid-gesture, and this shot continues the motion smoothly`）
- **检查修复**：模糊帧长度 ≥4 帧（太短藏不住）；动作速度跨段一致（慢→快会暴露）→ 用视频参考锁定步速（"@Video 1 for the walking pace"）。

### 4. 同构图延续（Composition Lock / Match Cut within Take）——画框不换

- **电影惯例**：接缝两侧构图、景别、机位高度、轴线保持一致时，剪辑在视觉上"不存在"（衔接 216 构图、178 机位高度、127 匹配剪辑）。
- **AI 落地**：接缝处**只允许运动延续，不允许构图跳变**——首尾帧同比例出图（即梦约束：尾帧与首帧比例相同）；Sora 参考图必须匹配输出分辨率；灯光与调色延续（Sora 官方："keeping lighting logic consistent is what makes the edit seamless"，并建议给 3-5 个调色锚点色）。同构图接缝最适合"同一区域内的持续推进"。
- **提示词**：`保持相同景别与机位高度，保持同一光线的方向与色温，保持画面中角色位置比例不变；仅运动继续。`
- **检查修复**：接缝两侧各取一帧并排比对构图/亮度/色彩；差异大 → 重生成或做色彩匹配（衔接 141 调色、127 剪辑节奏）。

**四类转场速查**

| 技巧 | 掩护原理 | 适用 | 强度 |
|---|---|---|---|
| 穿过门/穿越 | 空间切换被门框合理化 | 跨空间、跨光线 | 强（还能顺带交代光变） |
| 遮挡转场 | 画面信息最低点 | 同空间不同区域、人群穿梭 | 最强（完全遮挡） |
| 转场动作/甩镜 | 动势与模糊帧 | 连续运动、快节奏 | 中（甩镜强，动作弱） |
| 同构图延续 | 视觉无变化 | 同区域持续推进 | 弱（只藏静止信息差） |

## 一致性维持（长镜内角色/场景/光不漂移——衔接 408/117）

长镜的特殊性：**每一段既是新生成，又必须与上一段是"同一个世界的同一个瞬间"**。漂移在单镜内是渐变（不易察觉），跨段是跳变（一眼穿帮）。三层防线：

### 防线一：锚点逐段复用（衔接 408 锚点体系）

角色锚（脸/服装/配饰）、场景锚（空间布局）、风格锚（画风/调色）、光线锚（光向/色温/阴影）——**逐字复用**，每段只改"运动块"。提示词结构：

```text
[锚点块：逐字粘贴 408 的角色圣经 + 场景描述 + 光线句，一个词都不改]
[镜头块：本段运动 + 相机 + 环境变化]
```

加参考图双锁：Veo 最多 3 张参考图（人物/场景/风格各司其职）；Sora 角色资产 + 提示词指名角色名（官方要求 verbatim）；Kling 主体库 `element_list` + 首帧。

### 防线二：保持项清单（每段显式点名）

模型默认"自由发挥"，不点名的东西它敢改。Seedance 官方建议延长时**明确列出要保持的元素**：相机角度、光线、角色位置、服装、调色（"Maintain the same professional color grading and lighting style"）。清单写进提示词尾部，逐段复用：

```text
Keep consistent: same character appearance and wardrobe; same camera angle and lens;
same lighting direction and color temperature; same color grading; prop states carried over.
```

### 防线三：短段纪律 + 链条短（对抗误差累积）

- 长镜内一致性最好靠**短段 + 每段独立校验**（Sora 官方：短片段更可靠），而不是无限延长；
- 链式延长会累积劣化（Seedance 官方：每次回喂生成视频质量下降，先现于脸部色块）——**延长链条 ≤2-3 次**，之后改为"尾帧续接"独立生成；
- 必须反复延长时用官方变通：先把片段转成"白色 3D 模型风"视频（去色去纹理、保留结构）再续，从干净的结构基底继续，避免把旧伪影喂回去（Seedance 官方实践）。

### 光的一致性：连续演变而非跳变

长镜内光线唯一的合法变化是**演变**（衔接 98 自然光、93 光线叙事、406 镜头情绪）：进门变暗、日落变暖、云层遮光变柔。跨段时：

- 同空间同光：光线句逐字复用（衔接 408 光线锚）；
- 跨空间/跨时段：提示词显式写过渡（`光线从室外日光过渡为室内暖光`），或安排"穿过门"类转场让光变合理化；
- 校验：接缝两侧 5 帧的亮度/色温直方图应连续（衔接 174 质检的帧级比对，可用视觉模型自动测）。

**漂移修复铁律**（衔接 408）：只重生成漂移段，回退到批准过的锚点（原始参考集），绝不拿随机好帧当新参考；一次只改一个变量。

## 常见错误表

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 接缝裸接（切点无遮挡/无转场） | 一眼穿帮，伪一镜破产 | 切点落在四类掩护之一（过门/遮挡/甩镜/同构图） |
| 段末动作停死、下段重新起步 | 顿挫感，运动断裂 | 段末留 mid-gesture；提示词"continues the motion smoothly" |
| 光突变（室外直跳室内、日直跳夜） | 跳切感 | 穿过门转场 + 显式光过渡描述；或桥接段 |
| 首尾帧比例不一致 | 画框跳变/生成失败 | 尾帧与首帧同比例出图（衔接 407） |
| 角色跨段换脸换装 | 身份断裂 | 锚点块逐字复用 + 参考图双锁（衔接 408/117） |
| 场景跨段变形（空间布局变） | 空间断裂 | 场景锚图/首帧继承；跨空间用穿越转场 |
| 无限链式延长 | 画质劣化累积（脸部色块） | 链条 ≤2-3 次；改尾帧续接；白色模型工作法 |
| 保持项不点名 | 道具/服装悄悄变 | 保持项清单逐段写（相机/光/角色/服装/道具） |
| 每段重写全量描述（换措辞） | 输入漂移 → 输出漂移 | 锚点块逐字粘贴，只改运动块 |
| 甩镜模糊帧太短 | 接缝暴露 | 模糊帧 ≥4 帧，或换完全遮挡转场 |
| 跳过逐段校验直接拼 | 接缝堆到成片 | 每段过检才进下一段（衔接 174 门控） |

## 工作流应用（AI 编排）

长镜分段续接天然适合编排成结构化流水线：**LLM 拆解长镜意图 → 段表 → 自动装配提示词 → 分批生成 → 接缝 QC 门控**。

### 段表即契约（JSON）

```json
{
  "take": "主角从走廊走进病房到窗边",
  "segments": [
    {
      "id": "S01", "duration": 6, "location": "走廊",
      "action": "走向门口", "camera": "跟随中景",
      "join": "start",
      "keep": ["角色", "服装", "走廊冷光", "相机跟随"]
    },
    {
      "id": "S02", "duration": 5, "location": "门→病房",
      "action": "推门进入", "camera": "跟随穿过门框",
      "join": "doorway（过门黑场掩护，光变：冷→暖）",
      "keep": ["角色", "服装", "过渡光", "相机高度"]
    },
    {
      "id": "S03", "duration": 6, "location": "病房",
      "action": "走到窗边停步", "camera": "侧移缓推",
      "join": "occlusion（前景绿植划过）",
      "keep": ["角色", "服装", "病房暖光", "景别"]
    }
  ]
}
```

### 编排流水线

```text
长镜意图（一条路径/一个动作/一条情绪曲线）
  → LLM 生成段表（切点=掩护位；每段一个动作；4-8s/段）
  → 每段装配：首帧（上段尾帧）+ 锚点块 + 运动块 + 保持项
  → 按模式分发：S01 图生视频首帧；S02/S03 尾帧续接或整段延长
  → 逐段 QC：接缝可见性 / 运动连续 / 光连续 / 身份连续（174 门控）
  → 通过段入剪辑；失败段回退锚点重生成（不重 roll 全片）
  → 拼接：裁 6+1 帧 → 1-2 帧交叉溶解 → 整体色彩匹配（141）
```

**DirectorX 纪律**：

1. **切点设计先于生成**——分段时先定"每一处接缝藏在哪"，再写每段提示词；
2. **延长优先、尾帧兜底、桥接救场**——能用整段延长用延长，延长糊了换尾帧续接，两段素材不同批用桥接；
3. **每段只动一个变量**——换空间就不换服装，换光就不换景别（衔接 408）；
4. **逐段过检是硬门**——不合格段绝不进入拼接，接缝不会在后期"自动消失"。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 一镜到底 | One-Shot / Oner | 全片/长段落以"单个镜头"呈现 |
| 伪一镜到底 | Stitched Long Take | 多段拼接、剪辑被隐藏的长镜 |
| 长镜头 | Long Take | 无剪辑的连续镜头 |
| 分段续接 | Segment Chaining | 长镜拆段逐段生成再拼接（衔接 207） |
| 尾帧续接 | Tail-Feed / Last-Frame Continuity | 上段尾帧作下段首帧 |
| 首尾帧插值 | First/Last-Frame Interpolation | 模型在两端点帧间插值生成 |
| 整段延长 | Video Extension | 模型读整段视频上下文续写 |
| 桥接生成 | Video Fusion / Bridging | 生成过渡段缝合两段素材 |
| 隐藏剪辑 | Hidden Cut | 藏在画面细节里的剪辑点 |
| 场景内障眼法 | Mise-en-Trickery | 用外套/黑空间/家具/人物/甩镜掩护剪辑 |
| 数字缝合 | Blend | 后期合成抹平接缝（Deakins 用语） |
| 遮挡转场 | Occlusion / Pass-by Wipe | 前景物体遮住镜头时的切点 |
| 甩镜 | Whip Pan / Swish Pan | 极速横摇，接缝藏进动态模糊 |
| 过门转场 | Doorway Transition | 穿门/穿越时切换空间并合理化光变 |
| 同构图延续 | Composition Lock | 接缝两侧构图/景别/机位一致 |
| 运动矢量延续 | Motion Vector Continuity | 速度/方向/相位跨段连续 |
| 场景卡 | Scene Card | 每段世界状态契约（衔接 123/408） |
| 保持项清单 | Keep-Consistent List | 每段显式点名不可变的元素 |
| 运动进行中 | Mid-Gesture | 段末姿态停在动作中途，便于续接 |
| 误差累积 | Error Accumulation | 逐段回喂导致的画质/一致性劣化 |
| 接缝校验 | Join QC | 接缝两侧逐帧比对（174） |

## 来源

- Offscreen — 1917: The 'Hard Work' of the Digital Long Take：https://offscreen.com/view/1917-the-hard-work-of-the-digital-long-take
- OpenAI — Sora 2: Prompting Guide：https://developers.openai.com/cookbook/examples/sora/sora2_prompting_guide
- Google — Generate videos with Veo 3.1 in Gemini API：https://ai.google.dev/gemini-api/docs/veo
- 可灵 — 视频延长 API：https://klingai.com/document-api/api/video/1-6/video-extension ；图生视频 API：https://klingai.com/document-api/api/video/2-0-master/image-to-video
- Morphic — Seedance 2.0 Complete Guide: Step-by-Step Tutorial：https://morphic.com/resources/how-to/seedance-2-guide
- 火山引擎 — Seedance 2.0 视频延长教程：分步操作与优化技巧：https://www.volcengine.com/article/40352

## 相关概念

- [AI 长镜头生成（One-Shot & Long Take — Segment Chaining with Hidden Joins）](../207-one-shot-long-take/one-shot-long-take.md)
- [多镜一致性编排（Multi-Shot Consistency Orchestration — Anchor System + AI）](../408-multi-shot-consistency/multi-shot-consistency.md)
- [参考图与首尾帧实战手册（Reference & First/Last Frame — Control Playbook + AI）](../407-reference-first-last-frame/reference-first-last-frame.md)
- [图生视频深度控制（Image-to-Video Control — First/Last Frame, Motion & Subject Lock）](../116-image-to-video-control/image-to-video-control.md)
- [AI 一致性全体系（AI Consistency System — Character / Scene / Product / Style）](../117-ai-consistency-system/ai-consistency-system.md)
