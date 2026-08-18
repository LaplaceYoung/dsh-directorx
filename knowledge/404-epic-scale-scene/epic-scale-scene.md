---
type: Reference
title: "史诗/宏大场景镜头级方案（Epic & Scale Scene — Monumental Framing + AI）"
description: "史诗宏大场景的镜头级生成方案：宏大感三来源（比例/时间/运动）、建立世界→单体入画→汇聚→大场面高潮→余韵的节拍序列、8 个关键镜头（人如蚁大远景/低角度巨物/群体航拍/比例对比/剪影/慢推轨）的中英提示词与生成后检查、比例尺度营造、音乐节奏驱动、常见错误表与 AI 编排工作流"
tags:
  - "craft"
  - "camera"
  - "prompt"
  - "workflow"
  - "narrative"
status: stable
stale_after: "2027-08-18"
generated:
  by: "process:directorx-knowledge-okf"
  at: "2026-08-18T00:00:00Z"
verified:
  - by: "process:knowledge-audit"
    at: "2026-08-18T00:00:00Z"
sources:
  - resource: "cited:American Cinematographer Dune: Fear Is the Mind Killer"
    id: cite-1
    title: "Dune: Fear Is the Mind Killer"
    author: "org:American-Cinematographer"
  - resource: "cited:https://theasc.com/articles/dune-fear-is-the-mind-killer"
    id: cite-2
    title: "https://theasc.com/articles/dune-fear-is-the-mind-killer"
  - resource: "cited:Variety Dune Cinematographer Greig Fraser on Making the Expansive Film Feel Intimate"
    id: cite-3
    title: "Dune Cinematographer Greig Fraser on Making the Expansive Film Feel Intimate"
    author: "org:Variety"
  - resource: "cited:https://variety.com/2021/artisans/news/dune-cinematography-greig-fraser-denis-villeneuve-1235087999/"
    id: cite-4
    title: "https://variety.com/2021/artisans/news/dune-cinematography-greig-fraser-denis-villeneuve-1235087999/"
  - resource: "cited:Inverse The Trick is People. The Secret Behind Dune 2's Massive Scale"
    id: cite-5
    title: "The Trick is People. The Secret Behind Dune 2's Massive Scale"
    author: "org:Inverse"
  - resource: "cited:https://www.inverse.com/entertainment/dune-2-greig-fraser-interview"
    id: cite-6
    title: "https://www.inverse.com/entertainment/dune-2-greig-fraser-interview"
  - resource: "cited:PetaPixel How Dune: Part Two Cinematographer Makes Everything Look So Big"
    id: cite-7
    title: "How Dune: Part Two Cinematographer Makes Everything Look So Big"
    author: "org:PetaPixel"
  - resource: "cited:https://petapixel.com/2024/03/14/how-dune-part-two-cinematographer-makes-everything-look-so-big/"
    id: cite-8
    title: "https://petapixel.com/2024/03/14/how-dune-part-two-cinematographer-makes-everything-look-so-big/"
  - resource: "cited:Frame.io The Cinematography of Dune: Part Two"
    id: cite-9
    title: "The Cinematography of Dune: Part Two"
    author: "org:Frame.io"
  - resource: "cited:https://blog.frame.io/2024/04/15/the-cinematography-of-dune-2-part-two-greig-fraser/"
    id: cite-10
    title: "https://blog.frame.io/2024/04/15/the-cinematography-of-dune-2-part-two-greig-fraser/"
dx_id: "404"
related:
  - "201-crowd-scenes/crowd-scenes.md"
  - "178-perspective-camera-height/perspective-camera-height.md"
  - "207-one-shot-long-take/one-shot-long-take.md"
  - "177-motion-blur-shutter/motion-blur-shutter.md"
  - "231-shot-size-emotion/shot-size-emotion.md"
---

# 史诗/宏大场景镜头级方案（Epic & Scale Scene — Monumental Framing + AI）

> 本页为史诗/宏大场景（战争、迁徙、巨物、广袤世界）的镜头级生成方案：宏大感三来源（比例/时间/运动）、六段式节拍序列（建立世界→单体入画→汇聚→大场面高潮→余韵）、8 个关键镜头的画面构成与中英提示词、比例与尺度营造、音乐节奏驱动。知识本体来自电影史诗/大场面镜头惯例（《沙丘》Greig Fraser、LOTR Andrew Lesnie、《拿破仑》Ridley Scott、StudioBinder/Frame.io/Beverly Boy 等镜头技法文献）。AI 应用面向 DirectorX：史诗项目按此方案写分镜、用提示词控制比例与运镜、逐镜生成后按检查项修复（衔接 201 群体场景、178 机位高度、207 长镜头、177 运动模糊、231 景别情绪）。
> 来源：American Cinematographer「Dune: Fear Is the Mind Killer」、https://theasc.com/articles/dune-fear-is-the-mind-killer；Variety「Dune Cinematographer Greig Fraser on Making the Expansive Film Feel Intimate」、https://variety.com/2021/artisans/news/dune-cinematography-greig-fraser-denis-villeneuve-1235087999/；Inverse「The Trick is People. The Secret Behind Dune 2's Massive Scale」、https://www.inverse.com/entertainment/dune-2-greig-fraser-interview；PetaPixel「How Dune: Part Two Cinematographer Makes Everything Look So Big」、https://petapixel.com/2024/03/14/how-dune-part-two-cinematographer-makes-everything-look-so-big/；Frame.io「The Cinematography of Dune: Part Two」、https://blog.frame.io/2024/04/15/the-cinematography-of-dune-2-part-two-greig-fraser/；American Cinematographer「Ring Bearers — The Lord of the Rings: The Fellowship of the Ring」、https://theasc.com/article/lord-of-the-rings-fellowship-of-the-ring/；IndieWire「Napoleon Movie: Ridley Scott Recreated Battles in 62 Days」、https://www.indiewire.com/features/craft/napoleon-movie-ridley-scott-battles-1234929020/；StudioBinder「The Extreme Wide Shot / Establishing Shot / Aerial Shot / Crane Shot / Forced Perspective」、https://www.studiobinder.com/camera-shots/shot-size/extreme-wide-shot/ 等；Frame.io「How to Use a Dolly Shot to Transform a Simple Scene」、https://blog.frame.io/2016/09/01/how-to-use-a-dolly-shot-to-transform-a-simple-scene/；Beverly Boy「What is Silhouette Shot?」、https://beverlyboy.com/filmmaking/what-is-silhouette-shot/；Lightworks「Rhythm and Pace: Crafting the Tempo of Film」、https://lwks.com/blog/rhythm-and-pace-crafting-the-tempo-of-film。

## 概述

**核心断言**：宏大感的来源只有三个——**比例（Scale）**、**时间（Time）**、**运动（Movement）**。比例让人在画面中变小、巨物在画面中变大；时间给镜头留白、让观众"看完"世界的全貌；运动用缓慢而稳定的运镜把敬畏感"压"进每一帧。AI 生成史诗场景的失败，几乎都来自把"宏大"理解为"素材多"（人多、特效多、镜头快），而真正的宏大是**让世界比人大、让时间慢下来、让镜头不动声色**。

- **比例**：《沙丘》摄影指导 Greig Fraser 反复强调的秘诀是"**The trick is people**"——把人放进画面当标尺，观众才能感知沙虫、巨舰、宫殿的绝对尺度（Inverse、PetaPixel）；LOTR 的定场大远景、Napoleon 的整片战场实拍同理（衔接 178 机位高度、231 景别情绪）。
- **时间**：史诗镜头的标准动作是"给足时长"——大远景至少 4-6 秒、静止或极慢移动，让眼睛有时间读完画面里的信息密度；快切是动作片的语法，不是史诗的（衔接 207 长镜头、88 声画协同）。
- **运动**：缓慢推轨、缓慢升降、缓慢摇移制造"揭示感"；群体则相反——**世界缓慢，群体迅猛**，人潮的运动强度与镜头的稳定形成对比（衔接 177 运动模糊、201 群体场景）。

**AI 应用定位**：在 DirectorX 中，本页把"史诗感"翻译成三组可执行动作——① 提示词里显式写**比例参照**（figure occupies less than 1% of frame / colossal structure dwarfing tiny figures）；② 运镜词用**慢**字系（extremely slow push-in / slow crane up / slow tracking）；③ 生成后逐镜检查**比例是否成立、运镜是否漂移、群体是否真实**（衔接 115 提示词工程、174 质检、118 缺陷修复）。

## 场景节拍→镜头序列表

史诗大场面有固定的情绪弧：**世界越大，个体越小，情绪越要有一个"人"来落脚**（衔接 231：景别反差制造情绪落差）。推荐 8 节拍序列，每拍标注意图、镜头方案、AI 提示要点：

| # | 节拍 | 叙事意图 | 镜头方案 | AI 提示要点 |
|---|---|---|---|---|
| 1 | **建立世界**（Establishing） | 让观众知道"故事发生在一个巨大的地方" | 极端大远景 + 静止或极慢推；环境占满画面，无人在画面或人极小 | 写环境规模词（mountain range / endless desert / colossal city）+ 慢推；首帧干净 |
| 2 | **单体入画**（Single Figure） | 一个"人"进入世界，尺度立刻被对照出来 | 大远景、人占画面 ≤5%，位于底部 1/3 或黄金分割点 | 人 + 环境双主体；写清人物占比；防止模型把小人抹掉 |
| 3 | **靠近蓄势**（Approach） | 从"看见世界"过渡到"走向事件" | 缓慢推轨/升降跟拍人物，环境随人物移动 | 慢速运动词（gliding, weightless）；人物与环境相对位置保持 |
| 4 | **汇聚**（Convergence） | 多路力量/人群向同一方向运动，场面开始"变大" | 高角度或航拍俯视，多列人流/队伍入画并汇合 | 群体方向一致 + 密度渐进；高角展现涌现模式（衔接 201） |
| 5 | **大场面高潮**（Massive Climax） | 群体运动 + 巨物 + 能量瞬间 | 低角度仰拍巨物或群体冲锋；航拍拉升至全景再压回 | 仰拍（low angle）+ 群体行为（charge / march / surge）；运动模糊锁 180° |
| 6 | **个体落点**（Human Anchor） | 宏大变回"一个人"，情绪落地 | 从大远景**反差切**到近景/特写（人物反应） | 景别反差切换（衔接 231）；特写保留环境光提示保持色调一致 |
| 7 | **余韵**（Aftermath） | 尘埃落定，时间重新慢下来 | 静止长镜头：烟/尘/旗帜缓慢飘动，人物剪影 | 静场 + 微动元素（drifting smoke）；禁止剧烈运镜 |
| 8 | **收束**（Close） | 回到世界尺度，留下"一切仍在继续" | 缓慢拉远/升降回大远景，人物重新变小 | 缓慢 pull-back / crane down；与节拍 1 形成首尾比例呼应 |

**AI 编排要点**：节拍 1-3 用图生视频（I2V）锁首帧环境，节拍 4-5 用文生视频（T2V）放开群体运动，节拍 6-8 回到 I2V 锁人物——**先锁环境再放运动，先放群体再收个体**（衔接 116 图生视频深度控制、207 长镜头分段链式生成）。

## 关键镜头画面构成

以下 8 个镜头是史诗场景的"标准件"，每个给出**画面构成 → AI 提示词（中英）→ 生成后检查**三步（衔接 124 镜头语言生成、115 提示词工程）。

### 镜头 1：极端大远景——人如蚁

- **画面构成**：极端大远景（Extreme Wide Shot），人物极小（占画面 1%-3%），置于画面下部 1/3，环境（山脉/沙漠/城墙）占据 90% 以上画面；天空留白充足；镜头静止或 6 秒以上极慢推。这是 StudioBinder 定义中 EWS 的"环境压倒主体"用法，也是《沙丘》"人在星球上行走"的招牌画面（衔接 231：远景=人微/环境）。
- **AI 提示词**：
```text
极端大远景，浩瀚无边的沙海与巨大山脉，一个孤独的微小人物行走在画面底部，约占画面 1%，大片空旷天空，35mm 广角，极慢推镜，电影感，史诗比例
extreme wide shot, endless desert and colossal mountain range, one tiny lone figure walking at the bottom of the frame occupying less than 1% of the frame, vast empty sky, 35mm wide lens, extremely slow push-in, cinematic, epic scale
```
- **生成后检查**：① 人物是否被模型抹掉或放大失真——人物消失/占比超过 5% 即重生成，或用首帧图锁定人物位置（衔接 116）；② 人物与环境的光影方向是否一致（衔接 93 光线叙事）；③ 地平线是否平直、天空是否死白/死黑。

### 镜头 2：低角度仰拍巨物

- **画面构成**：机位贴近地面，低角度（Low Angle）仰拍，巨物（巨舰/巨型雕像/沙虫/城墙）从画面上方延伸出画，人物在画面底部仅占 1/5 高度，形成"巨物压顶"的权力构图（衔接 178：低角度=权力/宏伟）。《沙丘》中沙虫浮出、巨型飞船降临均为此构图。
- **AI 提示词**：
```text
低角度仰拍，巨大的星际飞船从画面上方压入画面，船体边缘超出画面顶部，底部是一排微小的人群，人物高度约占画面 1/5，强烈透视，24mm 广角，巨大尺度，电影感
low angle shot, colossal spacecraft looming from the top of the frame, its hull edges extending beyond the top, a row of tiny people at the bottom of the frame, figures about one fifth of the frame height, strong perspective, 24mm wide lens, massive scale, cinematic
```
- **生成后检查**：① 巨物透视是否成立——灭点、边缘是否弯曲变形（AI 常见"鼓包"畸变）；② 巨物与人物光影是否同源；③ 人物是否被画成巨物同比例（比例崩坏=史诗变怪谈）。

### 镜头 3：群体运动航拍

- **画面构成**：航拍（Aerial Shot）/高角度俯视，千军万马或迁徙人群如潮水般运动，方向统一、密度渐增；用高角度的"上帝视角"把群体变成**有纹理的流动体**（衔接 201：高角展现涌现模式、密度控制）。Bondarchuk《战争与和平》的航拍大军、《拿破仑》的战场全景是此类范本。
- **AI 提示词**：
```text
航拍俯视，庞大军队如潮水般向前推进，人群密集，统一向画面右上方运动，队列延绵至地平线，尘土飞扬，缓慢的航拍横移，无重复面孔，史诗战争场面
aerial top-down shot, a massive army advancing like a tide, dense crowd moving uniformly toward the upper right, columns stretching to the horizon, dust clouds rising, slow aerial lateral move, diverse faces, no repeated individuals, epic battle scene
```
- **生成后检查**：① 重复面孔/重复着装（一眼假，衔接 201 的 IC-LoRA 防重复）；② 群体运动方向是否统一、有无"随机漂移"；③ 密度是否渐变（远景密、近处稀疏会露馅）；④ 尘土/雾的流动方向与运动方向一致。

### 镜头 4：比例对比——人 vs 建筑

- **画面构成**：广角贴地机位，巨大建筑（神殿/城墙/巨门）的线条形成引导线，人物走在其间显得渺小；利用广角镜头的**近大远小拉伸**强化尺度（衔接 178：24-35mm 空间拉伸）。LOTR 的 Minas Tirith、金字塔群前的人影都是标准用法。
- **AI 提示词**：
```text
广角低机位，巨大的古神殿入口占满画面，建筑立柱向画面顶部收拢形成灭点，一个微小人物从柱子之间走过，建筑高度约为人物 50 倍，28mm 广角，透视强烈，史诗尺度
wide low-angle shot, colossal ancient temple entrance filling the frame, columns converging toward a vanishing point at the top, a tiny figure walking between the columns, building about fifty times the figure's height, 28mm wide lens, strong perspective, epic scale
```
- **生成后检查**：① 建筑透视灭点是否合理（AI 常把柱子画歪）；② 人物与建筑的前后遮挡关系（人物应被柱子/台阶遮挡一部分，穿模即重生成）；③ 文字/浮雕是否糊成一团（可接受，但明显的乱码要重生成）。

### 镜头 5：剪影在巨大天空

- **画面构成**：逆光/背光（Backlight），人物或巨物呈剪影（Silhouette）站在巨大的天空（落日/风暴云/极光）前，天空占据画面 2/3 以上；剪影强调**轮廓的形态感**，匿名性带来史诗的"非个人化"悲壮（衔接 360 剪影-年代-情绪、93 光线叙事；Beverly Boy：剪影=主体变暗色轮廓对明亮背景）。
- **AI 提示词**：
```text
剪影镜头，一个孤独战士的剪影站在巨大落日天空前，天空占画面三分之二，云层层次丰富，边缘光勾勒轮廓，人物全黑剪影，无面部细节，史诗悲壮氛围，缓慢拉远
silhouette shot, a lone warrior silhouetted against a gigantic sunset sky, sky filling two thirds of the frame, layered clouds, rim light tracing the outline, figure fully black, no facial detail, epic solemn mood, slow pull-back
```
- **生成后检查**：① 剪影是否死黑一团无轮廓辨识度（肩甲/帽盔/武器形态要可读）；② 天空是否有层次（纯黑/纯橙 = 重生成）；③ 边缘光是否与天空光源方向一致。

### 镜头 6：缓慢推轨（Slow Dolly / Crane）

- **画面构成**：缓慢推轨或缓慢升降（Crane Up），从环境揭示到主体揭示，时间 8-15 秒；推轨制造"接近神迹"的期待，升降制造"世界在脚下展开"的俯视感（Frame.io：缓慢推轨 = 亲密与揭示的时间艺术；StudioBinder：crane 平滑升降制造广阔视角）。史诗场景中"先看世界、再看目标"全靠这一镜。
- **AI 提示词**：
```text
缓慢平稳的推轨镜头，镜头贴着地面缓慢向前推进，前景是荒原与风沙，远处巨大的城市逐渐显现，运动极慢且稳定，无抖动，6 秒以上，史诗感
slow smooth dolly shot, camera gliding forward close to the ground, foreground of barren plains and wind-blown sand, a colossal city gradually emerging in the distance, extremely slow and stable movement, no shake, over six seconds, epic feel
```
- **生成后检查**：① 运镜是否稳定——AI 常见"漂移/加速/抽搐"，出现即拆成 4-6 秒分段用尾帧续接（衔接 207 长镜头、343 手持的反面）；② 透视变化是否匀速（近处地面应匀速后退）；③ 目标物体是否随推进逐渐放大（比例变化 = 尺度证据）。

### 镜头 7：大场面能量凝聚

- **画面构成**：低角度仰拍 + 群体爆发（冲锋/欢呼/举武器），前景是呼啸而过的群体，背景是巨物或旗帜；运动模糊锁 180° 快门（衔接 177），用"速度感"与"静止的巨物"形成对撞。Napoleon 的骑兵冲锋、LOTR 的洛汗冲锋（Rohirrim Charge）都是"群体能量 + 巨物背景"的变体。
- **AI 提示词**：
```text
低角度，成群的骑兵从镜头两侧呼啸冲过，尘土与碎草飞溅，背景是巨大的山岭与战旗，运动模糊，快门 1/48 秒，群体速度感，史诗战争高潮，仰拍
low angle, waves of cavalry charging past both sides of the camera, dust and debris flying, background of huge mountain ridges and war banners, motion blur, 1/48s shutter, sense of mass speed, epic battle climax, up-angle
```
- **生成后检查**：① 群体行为是否一致（半数在冲锋半数在发呆 = 重生成）；② 运动模糊量是否统一（人物与尘土模糊程度应一致，衔接 177）；③ 前景骑兵与镜头是否穿模（马腿/武器穿过镜头即重生成）。

### 镜头 8：余韵静场

- **画面构成**：战斗/事件结束后，静止长镜头：烟缓缓升起、旗帜飘动、人物剪影在废墟或旷野上；画面几乎不动，只有一个微动元素提示时间仍在流逝；时长 6-10 秒。史诗的余韵靠"静止"而不是"音乐高潮"收尾（衔接 207 长镜头、88 声画协同：静默放大情绪）。
- **AI 提示词**：
```text
静止长镜头，战争后的旷野，浓烟缓缓升起，一面残破旗帜在微风中飘动，一个士兵剪影站在废墟上眺望远方，画面基本静止，只有烟雾缓慢移动，6 秒以上，余韵，史诗悲凉
static long take, battlefield aftermath in a vast plain, thick smoke slowly rising, a torn banner fluttering in the breeze, a soldier silhouetted on the ruins gazing into the distance, frame nearly still with only slow smoke drift, over six seconds, lingering, epic desolation
```
- **生成后检查**：① "静止"是否被模型默认成微运镜（AI 常自作主张加晃）——输出应静止或仅烟雾动；② 烟雾运动是否自然（快进/卡顿 = 重生成）；③ 与节拍 1 的环境色调是否一致（衔接 117 一致性、200 时间连续）。

## 比例与尺度营造

**比例是史诗的第一语言**，AI 提示词里必须写"谁比谁大多少"，而不是只写"巨大"。

### 人-物对比：把标尺写进画面

Greig Fraser 的"The trick is people"（Inverse、PetaPixel）直接可译为 AI 提示词语法：

| 手法 | 提示词写法 | 效果 |
|---|---|---|
| 显式占比 | `figure occupying less than 1% of the frame` / `人物占画面 1%` | 人成标尺，环境显大 |
| 倍数对照 | `the structure is fifty times the height of the people` / `建筑高度是人的 50 倍` | 数字给模型明确比例锚 |
| 前景参照 | `foreground rocks in extreme close-up, figures far behind` / `前景巨石特写，人物远在后方` | 近大远小强化景深尺度 |
| 群体衬托 | `a dense crowd below the colossal statue` / `巨像下方是密集人群` | 群体密度反衬单体之巨 |

### 透视夸张：广角贴地 + 低机位

- **广角（24-35mm）拉伸**近大远小：贴地低机位让前景物体巨大、远景人物渺小，尺度感来自**透视差**而非物体本身（衔接 178 焦段选择）。
- **LOTR 的启示**：forced perspective（强制透视）用"前景参照物 + 机位距离/角度控制"制造不同物种的大小差（StudioBinder、No Film School）——AI 生成里同样适用：**在前景放一个明确的近景参照物（岩石/石柱/鞋），人物在中景，巨物在远景**，三层透视自然成立。
- **反向陷阱**：长焦压缩透视会"抹平"尺度（远景人物与远景巨物同大），史诗场景少用 85mm+ 拍大远景，除非刻意做"密度压缩"的军团镜头（衔接 220 焦段设计）。

### AI 理解与实现

1. **提示词三件套**：`[比例词（占比/倍数）] + [透视词（广角/低机位/灭点）] + [运动词（极慢/稳定）]`——缺一不可，只写"epic"模型会给不出比例证据。
2. **首帧锁比例**：I2V 用一张"小人+巨物"的首帧图，图生视频会继承该比例关系；纯 T2V 时比例词要写成数字（1%、50 倍）而非形容词（衔接 116）。
3. **生成后检查清单**：人物是否消失/比例突变；建筑灭点是否成立；三层（前景参照-中景人-远景巨物）是否层次清晰；跨镜比例是否一致（同场景两镜人物大小不能跳变，衔接 117 一致性、174 质检）。

## 音乐与节奏驱动

史诗场景的节奏由**音乐先行**决定——先定曲，再按曲子的乐句规划镜头长度与切点（Lightworks：节奏剪辑以乐句/拍为节拍单位；衔接 88 声画协同、127 节拍同步）。

| 音乐阶段 | 镜头节奏 | 史诗用法 |
|---|---|---|
| 引子（慢、空旷、低音铺垫） | 极慢或静止，单镜头 6-10 秒 | 建立世界、单体入画（节拍 1-2） |
| 铺陈（主题进入、渐强） | 慢推/慢摇，镜头 4-6 秒 | 靠近蓄势、汇聚（节拍 3-4） |
| 高潮（鼓点/全奏/大和弦） | 切点踩重拍，镜头 1-3 秒 | 大场面高潮（节拍 5）——**卡点切镜最狠的一拍** |
| 回落（主题重现、渐弱） | 镜头重新变长、静止 | 余韵、收束（节拍 6-8） |

**AI 编排要点**：
- **镜头长度 = 乐句整数倍**：先做 2-3 秒的节拍表，把每个镜头时长设为乐句/拍数的整数倍，生成时用时长参数对齐（衔接 119 声画协同的生成版）。
- **音频驱动（A2V）**：史诗大场面可直接用音乐/环境音轨驱动生成，人群动作会随节拍起伏——比纯文本提示的"同步感"强得多（衔接 120 多模态输入）。
- **检查与修复**：生成后把镜头按音乐时间线回放，检查①高潮镜头是否踩在重拍上；②慢镜头的配乐是否出现"情绪断档"；③余韵段的静默是否被音效填满（该静不静 = 史诗变流水账）。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 只写"epic/huge"不写比例 | 模型给不出尺度证据，画面"假大空" | 写占比/倍数/前景参照（人物占 1%、建筑是人 50 倍） |
| 大远景人物消失或变大失真 | 比例崩坏、标尺失效 | 首帧锁人物位置，占比控制在 1%-5%（衔接 116） |
| 低角度巨物透视鼓包 | 巨物像气球、出戏 | 检查灭点与边缘变形，重生成或换参考图 |
| 群体重复面孔/统一着装 | 一眼假 | IC-LoRA 防重复 + 密度渐变（衔接 201） |
| 航拍运镜过快、像无人机广告 | 史诗变旅游片 | 运动词用极慢（slow, gliding）；必要时拆段（衔接 207） |
| 剪影死黑无轮廓 | 失去形态叙事 | 保留轮廓可读性 + 天空层次（衔接 360） |
| 全片大远景、无个体落点 | 观众无情绪入口 | 节拍 6 反差切近景/特写（衔接 231） |
| 运镜漂移/抽搐 | 史诗感全毁 | 拆 4-6 秒分段、尾帧续接（衔接 207） |
| 音乐与画面节拍脱节 | 高潮无力 | 音乐先行 + 镜头长度=乐句整数倍（衔接 88） |
| 跨镜比例/色调跳变 | 拼接感 | 场景卡 + 参考图集统一（衔接 117、200） |

## 工作流应用（AI 编排）

史诗大场面的 AI 编排要解决三类一致性：**群体一致性**（千万人不能像复制粘贴）、**航拍/机位一致性**（同一战场多角度机位要认得出是同一个地方）、**大场面跨镜一致性**（比例、光线、服饰、色调全程不跳变）。推荐管线：

```text
节拍表（8 节拍，音乐先行）
  → 场景卡：环境/光线/色调/时代锁定（衔接 117、200、203）
  → 参考资产：建筑/服饰/旗帜概念图 3-5 张（衔接 240 风格参考）
  → 逐镜生成：
      节拍 1-3 → I2V 锁首帧环境（衔接 116）
      节拍 4-5 → T2V 放群体运动 + 高角/仰拍（衔接 201、178）
      节拍 6-8 → I2V 锁人物 + 景别反差（衔接 231）
  → 长镜头拆段：慢推轨拆 4-6 秒/段，尾帧续接（衔接 207）
  → 群体防重复：IC-LoRA / 多样角色生成（衔接 201）
  → 统一质检：比例/透视/运镜/群体/色调五查（衔接 174、118）
  → 交付：多平台规格导出
```

**DirectorX 纪律**：比例写数字、运镜写慢字、群体写行为、音乐写节拍——四件套齐了再生成；生成后只做两件事：**查比例是否成立、查节奏是否到位**（衔接 115 提示词工程、174 质检自动化、118 缺陷修复）。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 史诗/宏大场景 | Epic / Scale Scene | 以世界尺度压倒个体的场面 |
| 极端大远景 | Extreme Wide Shot (EWS) | 环境为主、人如蚁的景别 |
| 定场镜头 | Establishing Shot | 交代世界/环境的首镜 |
| 低角度仰拍 | Low Angle Shot | 权力与宏伟的机位 |
| 航拍 | Aerial Shot | 上帝视角的群体/地貌镜头 |
| 升降镜头 | Crane Shot | 平滑升降，展开世界 |
| 推轨镜头 | Dolly Shot | 轨道推拉 |
| 强制透视 | Forced Perspective | 用距离/角度造假尺度差 |
| 比例锚 | Scale Anchor | 画面中的"人"标尺 |
| 剪影 | Silhouette | 暗轮廓对亮背景 |
| 余韵/静场 | Lingering / Static Beat | 静止长镜收情绪 |
| 节拍同步 | Beat-Sync | 切镜踩音乐拍点 |
| 群体涌现 | Emergent Pattern | 高角可见的群体宏观形态 |
| 比例崩坏 | Scale Break | 人与物比例关系失真 |

## 来源

- American Cinematographer — Dune: Fear Is the Mind Killer（Greig Fraser 谈《沙丘》尺度与亲密感）：https://theasc.com/articles/dune-fear-is-the-mind-killer
- Variety — Dune Cinematographer Greig Fraser on Making the Expansive Film 'Feel Intimate to the Characters'：https://variety.com/2021/artisans/news/dune-cinematography-greig-fraser-denis-villeneuve-1235087999/
- Inverse — "The Trick is People." The Secret Behind Dune 2's Massive Scale：https://www.inverse.com/entertainment/dune-2-greig-fraser-interview
- PetaPixel — How 'Dune: Part Two' Cinematographer Makes Everything Look So Big：https://petapixel.com/2024/03/14/how-dune-part-two-cinematographer-makes-everything-look-so-big/
- Frame.io — The Cinematography of Dune: Part Two：https://blog.frame.io/2024/04/15/the-cinematography-of-dune-2-part-two-greig-fraser/
- American Cinematographer — Ring Bearers: The Lord of the Rings: The Fellowship of the Ring（Andrew Lesnie）：https://theasc.com/article/lord-of-the-rings-fellowship-of-the-ring/
- IndieWire — 'Napoleon' Movie: Ridley Scott Recreated Battles in 62 Days：https://www.indiewire.com/features/craft/napoleon-movie-ridley-scott-battles-1234929020/
- StudioBinder — The Extreme Wide Shot in Film — Ultimate Guide：https://www.studiobinder.com/camera-shots/shot-size/extreme-wide-shot/
- StudioBinder — The Establishing Shot in Film — Ultimate Guide：https://www.studiobinder.com/camera-shots/framing/establishing-shot/
- StudioBinder — The Aerial Shot in Film — Ultimate Guide：https://www.studiobinder.com/camera-shots/camera-angles/aerial-shot/
- StudioBinder — The Crane Shot in Film — Ultimate Guide：https://www.studiobinder.com/camera-shots/camera-movements/crane-shot/
- StudioBinder — What is Forced Perspective?：https://www.studiobinder.com/blog/what-is-forced-perspective/
- No Film School — How 'The Lord of the Rings' Used Forced Perspective：https://nofilmschool.com/lord-of-the-rings-forced-perspective
- Frame.io — How to Use a Dolly Shot to Transform a Simple Scene：https://blog.frame.io/2016/09/01/how-to-use-a-dolly-shot-to-transform-a-simple-scene/
- Beverly Boy — What is Silhouette Shot?：https://beverlyboy.com/filmmaking/what-is-silhouette-shot/
- Lightworks — Rhythm and Pace: Crafting the Tempo of Film：https://lwks.com/blog/rhythm-and-pace-crafting-the-tempo-of-film

## 相关概念

- [AI 群体场景生成（Crowd Scenes — Density Control & No Duplicate Faces）](../201-crowd-scenes/crowd-scenes.md)
- [AI 透视与机位高度（Perspective & Camera Height — Angle Psychology & Lens Choice）](../178-perspective-camera-height/perspective-camera-height.md)
- [AI 长镜头生成（One-Shot & Long Take — Segment Chaining with Hidden Joins）](../207-one-shot-long-take/one-shot-long-take.md)
- [AI 动态模糊与快门速度（Motion Blur & Shutter — 180° Rule in AI Generation）](../177-motion-blur-shutter/motion-blur-shutter.md)
- [电影景别情绪理论（Shot Size Emotion — Close-Up Intimacy, Wide Isolation）](../231-shot-size-emotion/shot-size-emotion.md)
