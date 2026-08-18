---
type: Reference
title: "追逐/追车场景镜头级方案（Chase & Vehicle Scene — Shot-by-Shot Design + AI）"
description: "追逐场景的镜头级方案：节拍→镜头序列表、7 类关键镜头画面构成（车轮低角度/过肩/追尾/航拍俯冲/护栏擦过/杂物碰撞/隧道灯影）、速度感营造、节奏与转场、常见错误与 AI 生成工作流，每个镜头给出中英 AI 提示词与生成后检查"
tags:
  - "craft"
  - "camera"
  - "editing"
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
  - resource: "cited:Film Independent How to Create A Car Chase With Action Realism"
    id: cite-1
    title: "How to Create A Car Chase With Action Realism"
    author: "org:Film-Independent"
  - resource: "cited:https://www.filmindependent.org/blog/how-to-create-a-car-chase-with-action-realism/"
    id: cite-2
    title: "https://www.filmindependent.org/blog/how-to-create-a-car-chase-with-action-realism/"
  - resource: "cited:PremiumBeat Creating the Illusion of Speed"
    id: cite-3
    title: "Creating the Illusion of Speed"
    author: "org:PremiumBeat"
  - resource: "cited:https://www.premiumbeat.com/blog/creating-the-illusion-of-speed/"
    id: cite-4
    title: "https://www.premiumbeat.com/blog/creating-the-illusion-of-speed/"
  - resource: "cited:Neil Oseman How to Make Chase Scenes Look Fast"
    id: cite-5
    title: "How to Make Chase Scenes Look Fast"
    author: "org:Neil-Oseman"
  - resource: "cited:https://neiloseman.com/how-to-make-chase-scenes-look-fast/"
    id: cite-6
    title: "https://neiloseman.com/how-to-make-chase-scenes-look-fast/"
  - resource: "cited:Den of Geek Crossing the line movie car chases: The Bourne Supremacy"
    id: cite-7
    title: "Crossing the line movie car chases: The Bourne Supremacy"
    author: "org:Den-of-Geek"
  - resource: "cited:https://www.denofgeek.com/movies/crossing-the-line-movie-car-chases-the-bourne-supremacy/"
    id: cite-8
    title: "https://www.denofgeek.com/movies/crossing-the-line-movie-car-chases-the-bourne-supremacy/"
  - resource: "cited:GoTranscript Deconstructing Mad Max Fury Road: The Art of Action Sequences"
    id: cite-9
    title: "Deconstructing Mad Max Fury Road: The Art of Action Sequences"
    author: "org:GoTranscript"
  - resource: "cited:https://gotranscript.com/public/deconstructing-mad-max-fury-road-the-art-of-action-sequences"
    id: cite-10
    title: "https://gotranscript.com/public/deconstructing-mad-max-fury-road-the-art-of-action-sequences"
dx_id: "401"
related:
  - "97-action-stunts/action-stunts.md"
  - "01-camera-language/camera-language.md"
  - "177-motion-blur-shutter/motion-blur-shutter.md"
  - "207-one-shot-long-take/one-shot-long-take.md"
  - "124-shot-language-gen/shot-language-gen.md"
---

# 追逐/追车场景镜头级方案（Chase & Vehicle Scene — Shot-by-Shot Design + AI）

> 本页为追逐/追车场景的镜头级方案：节拍→镜头序列、关键镜头画面构成、速度感营造、节奏与转场、AI 生成工作流。知识本体来自电影追逐场景镜头惯例（Bullitt、The French Connection、The Bourne Supremacy、Mad Max: Fury Road、Baby Driver 等公开拆解与追车拍摄方法）。AI 应用面向 DirectorX：把追逐拆成可直接指挥 AI 生成的镜头序列与提示词（衔接 97 动作、1 镜头语言、177 运动模糊、207 长镜头、124 镜头语言生成）。
> 来源：Film Independent「How to Create A Car Chase With Action Realism」、https://www.filmindependent.org/blog/how-to-create-a-car-chase-with-action-realism/；PremiumBeat「Creating the Illusion of Speed」、https://www.premiumbeat.com/blog/creating-the-illusion-of-speed/；Neil Oseman「How to Make Chase Scenes Look Fast」、https://neiloseman.com/how-to-make-chase-scenes-look-fast/；Den of Geek「Crossing the line movie car chases: The Bourne Supremacy」、https://www.denofgeek.com/movies/crossing-the-line-movie-car-chases-the-bourne-supremacy/；GoTranscript「Deconstructing Mad Max Fury Road: The Art of Action Sequences」、https://gotranscript.com/public/deconstructing-mad-max-fury-road-the-art-of-action-sequences；Frame.io「The Missing Details of Baby Driver's Crazy Workflow」、https://blog.frame.io/2017/07/31/baby-driver-workflow/；PremiumBeat「6 Tips for Filming a Thrilling Car Chase Scene」、https://www.premiumbeat.com/blog/how-to-film-car-chase-scene/；MovieMaker「A Duel in a Different Form」、https://www.moviemaker.com/the-chase-car-chase-duel-in-a-different-form/。

## 概述

**核心断言**：追逐场景是"用汽车进行的决斗"（《The Chase》导演 Lawrence Ribeiro 语，承袭 Leone 用左轮替换剑、再用车替换左轮的思路）——它既是动作高潮，也是人物关系的具象化。成功的追逐场景有两条铁律：

1. **追逐前先立住赌注**。《谍影重重2》莫斯科追逐之所以揪心，是因为观众已经知道 Kirill 杀了 Bourne 的女友、Bourne 带伤逃命（Den of Geek）——没有既成利害关系的追逐只是飙车 MV。
2. **速度感是"拍"出来的，不是"开"出来的**。观众从画面关系感知速度：前景掠过物的视差、背景模糊量、构图松紧、剪辑快慢——AI 生成时代这条尤其关键，因为模型不会"真开快车"，它只会按你写的视觉线索画速度。

**三大支柱（本页全部内容由此展开）**：

- **空间与方向**：开场建立屏幕方向（如全片主要行进方向左→右），威胁从相反方向出现＝迎面而来的碰撞路线；越混乱越要让人始终知道"谁在谁前面"——《狂暴之路》追逐段 6/7 颗镜头几乎无运动（上脚架定机），Miller 用定镜保证观众不丢方向；Greengrass 的手持再晃，观众也始终跟得上两车相对位置（Den of Geek）。
- **速度感的镜头语法**：视差（近物快、远物慢）、构图（侧面紧、正反广角）、快门与模糊（模糊给背景不给主体）、机位高度（贴地）——详见"速度感营造"。
- **节拍与剪辑先行**：Baby Driver 的追车是"先有音乐、按拍子剪"的产物（编辑器 Paul Machliss 把动画分镜逐拍对齐原声带）；Mad Max 的纪律是"每颗镜头都要付得起自己的账"（no shot is gratuitous）。AI 工作流完全继承这一点：**先定节拍表，再逐镜头生成，最后按节拍装配**。

**AI 翻译**：AI 视频模型不做剪辑、不真开车——它一次只生成一段素材。因此追逐场景的"导演工作"落在三件事：把追逐拆成镜头序列（本页第 2/3 节）、把速度感写成画面线索（第 4 节）、按节拍表验收与装配（第 5/7 节）。

## 场景节拍→镜头序列表

标准追逐弧线：**开场建立空间 → 威胁出现 → 追逐启动 → 拉锯 → 环境升级 → 加速 → 高潮碰撞 → 收尾**。下表每拍给出情绪、镜头设计、画面构成与可直接使用的 AI 提示词（英文原文，中文见第 3 节逐镜模板）。

| # | 节拍 | 情绪 | 镜头设计 | 画面构成 | AI 提示词（简版） |
|---|---|---|---|---|---|
| 1 | 开场建立空间 | 平静/悬念 | 定场镜+车辆行进方向镜头（左→右） | 街道/隧道/城市远景，主角车在画幅中占小比例，交代环境与车流 | `wide establishing shot, city street, the car driving left to right, traffic around, overcast daylight` |
| 2 | 威胁出现 | 警觉 | 方向反转镜头：威胁从相反方向/后视镜入画 | 后视镜特写或对向车道剪影，与主行进方向相反的屏幕方向 | `rearview mirror close-up, headlights of a pursuing car appearing behind, driver's eyes glancing at the mirror` |
| 3 | 追逐启动 | 爆发 | 启动细节特写串（轮胎/方向盘/档位）→ 切追尾跟拍 | 轮胎压地冒烟、车身前倾、后车大灯拉近 | `tire spinning on asphalt, smoke and rubber, then rear tracking shot, the gap closing` |
| 4 | 拉锯 | 紧张 | 正反打交替：被追者过肩↔追车者挡风玻璃 POV | 过肩看后车逼近 / 前挡看目标左躲右闪，距离忽近忽远 | `over-the-shoulder shot, pursuer growing in the mirror / windshield POV, target car swerving ahead` |
| 5 | 环境升级 | 危机 | 进入窄环境：小巷/隧道/市场 | 两侧障碍逼近、视差增强、明暗交替（路灯/隧道灯） | `narrow alley chase, walls and lamp posts whipping past at frame edges, light and shadow strobing across the car` |
| 6 | 加速 | 亢奋 | 速度镜头组：贴地低角度+轮毂特写+长焦跟拍 | 路面飞掠、背景模糊成带、车体震动 | `low-angle wheel shot, road surface rushing past in heavy motion blur, background streaking, dust trail` |
| 7 | 高潮碰撞 | 冲击 | 碰撞前"刹车"（慢一拍的准备帧）→ 冲击瞬间 | 擦护栏迸火花 / 撞穿杂物堆 / 90 度横甩；碎片向镜头炸开 | `car scraping the guardrail, sparks flying, then smashing through crates, debris exploding toward camera` |
| 8 | 收尾 | 释放/余韵 | 减速长镜+角色反应+场景结果 | 残骸烟尘中停车，车内人物喘息，交代胜负/代价 | `car skidding to a stop in smoke and wreckage, dust settling, driver breathing hard, wrecked vehicles behind` |

**AI 实现要点（节拍层）**：

- 每拍对应 2-4 颗镜头、每颗镜头独立生成 3-5 秒素材——不要试图一镜生成整个节拍（衔接 97 一镜一主运动、207 长镜头分段缝合）；
- 第 6-7 拍（加速/碰撞）是"细节预算"优先区：碰撞段单独生成 2-3 秒短片段并逐帧检查接触帧（衔接 118 缺陷修复）；
- 节拍表同时是剪辑时间轴：定好每拍时长（如 4/4/6/8/6/5/6/8 秒），AI 素材按拍长对齐（见第 5 节 Baby Driver 节拍法）。

## 关键镜头画面构成（逐镜详解）

以下 7 颗镜头覆盖追逐场景的高频画面构成，每颗给出：画面构成（画面里实际发生什么）、AI 提示词（中英）、生成后检查（逐帧验收点）。提示词遵循"画面状态+运动线索+镜头参数"结构（衔接 115 提示词工程、124 镜头语言生成）。

### 镜头 A：车轮低角度（Bumper-Level Wheel Shot）

- **画面构成**：机位贴近路面（保险杠高度以下），前轮占据画幅下 1/3，路面在强动态模糊中向两侧飞掠；车轮高速旋转、胎纹可见，压地瞬间扬起尘土与橡胶屑；背景（建筑/灯柱）虚化成速度带。低机位让"路面贴脸掠过"成为最强的速度信号（《疯狂的麦克斯 2》开场追逐即大量此机位）。
- **AI 提示词（英）**：
  ```
  low-angle shot at wheel height, camera close to the asphalt, the front wheel spinning fast in the lower third of frame, road surface rushing past in heavy motion blur, dust and rubber kicked up from the tire, background buildings blurred into speed streaks, gritty film look
  ```
- **AI 提示词（中）**：车轮高度的低角度机位，镜头贴近沥青路面，前轮在画幅下三分之一处高速旋转，路面在强动态模糊中飞掠而过，轮胎扬起尘土与橡胶碎屑，背景建筑虚化成速度带，粗粝胶片质感。
- **生成后检查**：① 车轮是否保持圆形（变形/辐条错乱=重生成，或缩短到 3 秒内生成）；② 旋转方向与行驶方向一致；③ 路面模糊方向自画幅中心向两侧放射、无"路面静止"帧；④ 尘土不穿模进车体（衔接 179 表面材质一致）。

### 镜头 B：被追者过肩（Over-Shoulder of the Pursued Driver）

- **画面构成**：从司机肩后拍，焦点落在车内后视镜与后窗；后车大灯在镜中**持续放大**（距离逼近的量化信号）；司机紧张的目光反复瞥向后视镜，额头汗/雨滴；玻璃上的雨点被风吹斜。过肩+后视镜把"被追的恐惧"和"距离数据"装在同一画面。
- **AI 提示词（英）**：
  ```
  over-the-shoulder shot inside the car, focus on the rearview mirror, headlights of the pursuing car growing rapidly in the mirror, the driver glancing at the mirror with tension, rain drops streaking across the side window, city lights as bokeh, handheld urgency
  ```
- **AI 提示词（中）**：车内过肩镜头，焦点在后视镜，后车大灯在镜中迅速放大逼近，司机紧张地瞥向后视镜，侧窗雨滴斜向拖出长痕，城市灯光焦外虚化，手持紧迫感。
- **生成后检查**：① 镜中后车是否逐帧变大（忽大忽小=空间不一致，用首尾帧锁距离变化，衔接 116 图生深度控制）；② 司机视线方向与镜中内容是否匹配；③ 车外背景运动方向与车速一致（同向同速=背景几乎静止，否则穿帮）。

### 镜头 C：追尾视角（Tailing / Pursuer POV）

- **画面构成**：机位在追车者车头/车内，正对目标车尾部；广角镜头，目标车在画幅中**持续变大**（Z 轴接近，广角放大效应最强——《碟中谍 5》摩托车追逐的正后机位即此原理）；路面在下方飞掠，画幅边缘的灯柱/护栏高频掠过；目标车左右蛇行时前车尾灯左右摆动。
- **AI 提示词（英）**：
  ```
  rear tracking shot following the fleeing car, wide-angle lens, the target car growing larger in frame as the distance closes, road rushing beneath the camera, lamp posts and railings whipping past the frame edges, the target car swerving side to side, brake lights flashing
  ```
- **AI 提示词（中）**：追尾跟拍镜头，广角镜头，目标车在画幅中随距离拉近而不断变大，路面在镜头下方飞掠，灯柱与护栏从画幅边缘快速掠过，目标车左右蛇行，刹车灯闪烁。
- **生成后检查**：① 目标车尺寸变化是否单调递增（回弹=失败）；② 边缘掠过物运动方向向后、速度高于画面中心（视差正确）；③ 前车刹车灯亮起时机与"接近"节拍同步（这是拉锯感的关键）。

### 镜头 D：航拍俯冲（Aerial Dive）

- **画面构成**：无人机先垂直俯拍（俯瞰两车追逐、拖出尘带与长影），随后**俯冲压低**至前车前方、拉起前倾，露出前方道路与障碍——俯冲动作本身给出"前方有危险"的预告；地面纹理在俯拍中高速后退（地面细节是俯拍速度感的唯一来源，沙漠/空旷地慎用，见"常见错误"）。
- **AI 提示词（英）**：
  ```
  aerial drone shot, top-down view following the two cars, then the camera dives low ahead of the lead car and pulls up to reveal the road and obstacles ahead, long shadows behind the vehicles, ground texture rushing beneath, dust trail behind the cars, golden hour light
  ```
- **AI 提示词（中）**：航拍无人机镜头，先垂直俯拍跟随两车，随后俯冲压低到前车前方并拉起，露出前方道路与障碍，车后拖出长影与尘带，地面纹理在下方飞速后退，黄金时刻光线。
- **生成后检查**：① 俯冲轨迹平滑、无瞬移跳切；② 俯拍中两车屏幕方向与前后镜一致（衔接 200 时间连续）；③ 车辆投影方向与太阳方向一致；④ 俯冲拉起后画面内容与下一镜的空间关系吻合（否则改首尾帧衔接）。

### 镜头 E：护栏擦过（Guardrail Scrape）

- **画面构成**：侧面跟拍，车体贴着金属护栏行驶，**接触点**迸出火星（火花必须长在接触点而非车身任意处）；漆面划痕、金属碎屑飞溅；车身随擦碰轻微震动/弹跳；前景护栏立柱高频掠过强化速度。擦碰是追逐的"擦伤叙事"——每次擦碰都让观众感觉距离死亡近了一寸（《谍影重重2》中出租车反复刮蹭其他车辆正是其真实感来源）。
- **AI 提示词（英）**：
  ```
  side tracking shot, the car scraping along a metal guardrail, sparks flying from the contact point, paint and metal shavings spraying, the car body shuddering from the impact, guardrail posts whipping past in the foreground, shallow depth of field, close to the action
  ```
- **AI 提示词（中）**：侧面跟拍，汽车贴着金属护栏擦过，火星从接触点迸出，漆皮与金属碎屑飞溅，车体因碰撞震动，前景护栏立柱飞速掠过，浅景深，贴近动作。
- **生成后检查**：① 火星是否从接触点冒出（全车身冒火=物理错误，重生成）；② 车身震动帧与擦碰开始帧对齐；③ 护栏不穿模进车体（衔接 133 物理）；④ 火花持续时长远短于实际（真实火花只存在于接触瞬间，AI 常见"一路火花带闪电"过度效果）。

### 镜头 F：杂物碰撞（Debris Collision）

- **画面构成**：前侧 45° 机位，汽车撞穿堆叠的木箱/货摊/路障，**碎片向镜头方向炸开**（碎片飞向镜头=冲击感最强）；车身颠簸、前盖变形、继续行驶；车后烟尘弥漫。碰撞遵循"接触→变形→碎片"因果链，AI 必须按这个顺序写提示词，否则模型会"碎而未碰"。
- **AI 提示词（英）**：
  ```
  front three-quarter shot, the car smashing through stacked wooden crates and a fruit cart, debris exploding toward the camera, wooden planks and produce flying past the lens, the car bouncing over the wreckage and driving on, dust and smoke billowing behind, brief slow-motion at impact
  ```
- **AI 提示词（中）**：前侧 45 度镜头，汽车撞穿堆叠的木箱与货摊，碎片向镜头方向炸开，木板与货物飞过镜头，车身颠簸越过残骸继续行驶，车后烟尘翻涌，撞击瞬间短暂慢镜。
- **生成后检查**：① 因果链完整：接触帧→车体变形→碎片飞出（无碎片先飞/车体先变形=重生成）；② 碎片飞行速度与车速的相对关系合理（太慢=失重）；③ 碰撞后车体保持完整（不散架、不瞬移、涂装不变——衔接 117 一致性全体系）；④ 慢镜段的模糊量要与正常速度段衔接（衔接 177 运动模糊）。

### 镜头 G：隧道灯影（Tunnel Light Strobing）

- **画面构成**：隧道内跟拍，车辆在规律排列的顶灯下疾驰，**明暗光带在车身与挡风玻璃上交替频闪**，反光在漆面上滑动；车灯穿透隧道薄雾形成光柱。频闪节奏=速度感的"节拍器"：灯距固定，闪得越快=车越快；同时隧道内壁是绝佳的视差前景。
- **AI 提示词（英）**：
  ```
  tracking shot inside a tunnel, the car speeding under evenly spaced ceiling lights, alternating bands of light and shadow strobing across the car and windshield, reflections sliding over the bodywork, headlights cutting through haze, flicker rhythm conveying speed
  ```
- **AI 提示词（中）**：隧道内跟拍，汽车在等距顶灯下疾驰，明暗光带在车身与挡风玻璃上交替频闪，反光在漆面上滑动，车灯穿透薄雾，频闪节奏传达速度。
- **生成后检查**：① 明暗交替节奏是否均匀（时快时慢=重生成）；② 灯光扫过车身的时机与顶灯位置吻合；③ 频闪不引起画面闪烁伪影（后处理帧抖动）；④ 出隧道瞬间曝光过渡自然（AI 常见"瞬间过曝"）。

## 速度感营造（运镜/快门/模糊/背景运动）

**原则**：观众感知的速度 = 画面中相对运动的**密度**，与真实车速无必然关系。以下方法按"画面线索"分类，每条给出 AI 提示词与检查点（衔接 177 运动模糊、176 景深）。

### 1. 视差 Parallax（最重要）

近处物体看起来比远处物体移动得快——这是速度感的第一来源（Neil Oseman）。

| 手法 | 为什么快 | AI 提示词 | 检查 |
|---|---|---|---|
| 前景掠过物 | 近物视差大、速度感强 | `foreground objects whipping past the camera, lamp posts and walls rushing by at frame edges` | 前景运动速度 > 画面中心速度 |
| 窄环境 | 两侧障碍贴车，视差最大化 | `narrow alley / tree-lined lane, branches and poles passing close to the car` | 障碍物贴车但不穿模 |
| 机位贴近路面 | 路面纹理以最大视差飞掠 | `camera low, road surface zipping by inches below` | 路面模糊呈放射状 |
| 明暗光斑 | 光斑掠过=额外运动线索 | `patches of light and shade passing over the car` | 光斑节奏均匀 |
| 长焦横摇 | 消除视差、背景匀速滑过（2D 运动） | `long lens pan following the car, background sliding uniformly` | 背景运动无纵深分层 |

### 2. 构图松紧 Framing

- **侧面机位用紧构图**（中近景）：主体占画幅大、背景可见少 → 覆盖更多距离的错觉（《007：大破天幕杀机》开篇摩托追逐）；
- **正前/正后机位用广角**：Z 轴接近时物体在广角下"涨"得快，逼近感最强（《碟中谍5》）；
- **机位越低越显快**：贴保险杠高度（Mad Max 2 开场）——AI 提示词直接写 `low angle, bumper level`。

### 3. 快门与模糊 Shutter & Blur

- **模糊给背景与掠过物，不给主体**：观众焦点永远不能落在模糊的东西上（PremiumBeat）。AI 提示词：`background in heavy motion blur, subject sharp, motion blur on passing objects only`；
- **180° 快门参考**（24fps→1/48s）：模糊量=电影感底噪（衔接 177 运动模糊全页）；
- **降帧率提速**：《法国贩毒网》把摄影机降到 18fps 让一切变快（PremiumBeat）——AI 端等价手法：正常速度生成后按 90% 左右变速播放，或用提示词 `slightly fast motion, everything moving a touch quicker than real`；
- **碰撞/冲击段慢镜**：高帧率短快门=逐帧锐利（衔接 177 的高帧率慢动作一节）——AI 提示词：`slow motion at impact, crisp frames, then speed up to normal`。

### 4. 运镜 Camera Movement

- **跟随方向**（pan/track 与车同向同速）：强调持续速度；
- **机位落后感**：让镜头"追不上"主体，主体从画幅中心滑向前方——制造追赶的吃力感（《浪人》Ronin）；
- **相向运动**：镜头迎着车开过去（counter-track）→ 相对速度翻倍；
- **固定机位呼啸而过**：静止镜头+车高速穿画幅=相对速度最大（配合 4-8 帧快剪，见第 5 节）；
- **手持微晃**：晃动要"跟动作有方向"，不是随机抖（衔接 97 手持纪实、343 手持美学）；AI 提示词 `handheld, slight shake following the car's motion`。

### 5. AI 速度感总模板

```
[motion]: the car accelerates hard, body leaning back, speed lines and dust trail behind
[lens]: low angle, wide 24mm, camera close to the road
[blur]: heavy motion blur on road surface and background, subject sharp
[environment]: narrow street with lamp posts and shopfronts whipping past at frame edges
[light]: patches of light and shade strobing across the car
[shutter feel]: natural 180-degree shutter look, slightly fast motion
```

生成后按"视差（前景快于背景）→ 模糊分配（背景糊主体清）→ 构图（侧面紧/正反广角）→ 运动方向（一致且单调）"四步验收（衔接 174 质检）。

## 节奏与转场

### 节奏曲线（Pacing Curve）

追逐的剪辑节奏是一条**有峰谷的曲线**，不是一路快：

```text
慢起（建立空间，2-4s 长镜）→ 快切（启动，1-1.5s）→ 拉锯留白（过肩/POV 交替，2-3s）
→ 加速短切（0.5-1s，画面越来越紧）→ 碰撞前"刹车"（慢一拍的准备帧）
→ 冲击快切（碰撞瞬间多角度 0.3-0.8s）→ 收尾长镜（减速、烟尘、喘息，3-5s）
```

- **"刹车"拍**：碰撞前一瞬故意放慢或留一帧"静止预感"——对比之下冲击更重（《谍影重重2》隧道撞分隔墩前有清晰的逼近→横甩节奏）；
- **Mad Max 纪律**：每颗镜头必须"付得起自己的账"，不用无意义甩镜/模糊假装能量（GoTranscript 拆解）；AI 素材同理：每段素材都该有明确的信息增量，否则删掉；
- **Baby Driver 节拍法**：先选音乐，按小节/拍子定每颗镜头时长，动画分镜预剪对齐（Frame.io）——AI 版：定 BPM → 镜头时长=拍数整数倍 → 逐镜生成 → 按拍装配（衔接 88 声画协同）。

### 转场工具（AI 可实现的）

| 转场 | 原理 | AI 实现 |
|---|---|---|
| 动作匹配剪辑（Cutting on Action） | 在动作顶点前切，下一镜延续动作（衔接 97） | 每段素材结束在"动作未完"状态，剪辑端在顶点下刀 |
| 运动方向匹配 | 前后镜运动方向一致（左→右接左→右） | 每镜提示词统一写 `moving left to right` |
| 屏幕方向反转（谨慎） | 反转=剧情转折，需要引导 | 用 3 镜法：主角视线/指示物（如后视镜）先指向新方向，再切反转镜（《狂暴之路》用 3 镜完成车头视角切换） |
| 遮挡转场 | 物体穿画幅遮黑瞬间切换 | 提示词让前景物（路灯/立柱/卡车）定时穿过画幅，天然遮黑点 |
| 明暗交替转场 | 隧道/树影频闪中切换 | 隧道灯影镜（镜头 G）末尾即切点 |
| 闪切 Fly-by | 呼啸而过的镜头只留 4-8 帧 | 生成"车高速穿画幅"素材，剪辑端压到 4-8 帧（衔接 124 镜头语言生成） |

**AI 节奏纪律**：单颗镜头素材 3-5 秒为上限（更长易物理崩坏，衔接 97 分段生成、207 长镜头缝合）；一镜到底式追逐=同机位提示词+分段缝合，切点藏在遮挡/模糊帧里（衔接 207 长镜头、89 隐藏剪辑思路）。

## 常见错误表

| 错误 | 后果 | 正确做法（AI 版） |
|---|---|---|
| 空旷公路、无前景参照物 | 车再快观众也不觉得快 | 环境加灯柱/树木/建筑，机位贴近路面，前景掠过物（Oseman） |
| 模糊全糊（主体也糊） | 主体不可读、观众找不到焦点 | 模糊只给背景与掠过物，主体保持清晰（PremiumBeat） |
| 全程手持乱抖 | 空间关系丢失、观众头晕 | 关键节拍（启动/碰撞）用定机位或稳定跟拍；晃动要有方向（Mad Max 6/7 定镜原则） |
| 屏幕方向混乱 | 观众不知道谁追谁、谁在前 | 开场立方向，威胁从相反方向入画；反转必须用 3 镜引导法 |
| 每镜时长一样 | 无节奏峰谷、疲劳 | 按曲线变奏：慢起→短切→刹车拍→冲击快切→收尾长镜 |
| 一镜塞太多动作 | 车体变形、物理崩坏 | 每段一个主动作，3-5 秒/段（衔接 97） |
| 碰撞无因果链 | "碎而未碰"、假 | 提示词按"接触→变形→碎片"顺序写，逐帧查接触帧 |
| 追逐无赌注 | 只有速度没有紧张 | 追逐前先立利害关系（人物/目标/代价） |
| 车体逐镜漂移（颜色/涂装/损伤不一致） | 素材拼不起来 | 参考图锚定+一致性词表（衔接 39 图片一致性、117 一致性全体系） |
| 加速段无"刹车"准备 | 碰撞无力 | 碰撞前留慢拍或静止预感帧 |
| 用甩镜/模糊假装能量 | 观众觉得廉价 | 每镜必须有信息增量（Mad Max 纪律） |
| 忽略声音 | 画面再猛也"散" | 引擎/轮胎/碰撞音效分层（衔接 88 声画协同、144 声音设计） |

## 工作流应用（AI 编排：参考图/首尾帧/一致性）

DirectorX 追逐场景的标准 AI 生产管线：

```text
① 定追逐弧线（8 拍节拍表，本页第 2 节）
② 定音乐/BPM，镜头时长=拍数整数倍（Baby Driver 节拍法）
③ 准备参考资产：
   - 车辆三视图/正侧后参考图（衔接 240 风格参考）
   - 环境参考（街道/隧道/时间与天气）
   - 角色/涂装一致性词表（衔接 117 一致性全体系、203 时代一致）
④ 逐镜头生成：每拍 2-4 镜，每镜 3-5 秒
   - 首帧：用参考图生成（衔接 116 图生深度控制）
   - 关键段落（碰撞/变道/加速）用首尾帧锁起止状态
⑤ 生成后检查：每镜过 4 项验收（速度感/方向/物理/一致性，第 3 节每镜清单）
⑥ 按节拍表装配：动作匹配切、遮挡切、4-8 帧闪切
⑦ 整体质检：方向连续性/车体一致性/音画对齐（衔接 174 质检、118 缺陷修复）
```

**三个关键纪律**：

1. **参考图是追逐的"地理"**：追逐的空间连续性完全靠参考图+屏幕方向表维持。生成前建立"方向表"（每镜行进方向 L→R/R→L/朝向镜头），逐镜核对，避免"反向追逐"穿帮（衔接 200 时间连续、123 长视频一致）。
2. **首尾帧锁"状态变化"**：碰撞（完好→变形）、变道（左道→右道）、加速（低速→高速）都适合用首尾帧定义起点与终点状态，提示词只写中间运动（衔接 116 图生深度控制）——这比纯文生视频的可控性高一个量级。
3. **缺陷修复走"最小重生成"**：车轮变形→该镜缩短到 3 秒内重生成；火花位置错→局部重绘接触点；方向穿帮→改屏幕方向表后重生成该镜，不整段返工（衔接 118 缺陷修复、174 质检）。

**素材管理**：按 `401-S01-01`（场景-节拍-镜头）编号，节拍表即剪辑时间轴的草稿；碰撞段保留 2-3 个候选版本供剪辑端选帧（冲击帧多版本=剪辑自由度，衔接 22 拉片、113 案例手册）。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 视差 | Parallax | 近物快、远物慢，速度感第一来源 |
| 屏幕方向 | Screen Direction | 画面上行进方向（L→R），混乱=观众迷失 |
| 追尾跟拍 | Tailing / Rear Tracking | 正对目标尾部的跟拍，距离信息量化 |
| 过肩镜头 | Over-the-Shoulder | 司机肩后机位，装下后视镜+反应 |
| 航拍俯冲 | Aerial Dive | 俯拍→俯冲压低的航拍运动 |
| 护栏擦过 | Guardrail Scrape | 贴栏擦碰、接触点火花 |
| 杂物碰撞 | Debris Collision | 撞穿障碍物、碎片炸向镜头 |
| 频闪 | Strobing | 隧道/树影明暗交替，速度节拍器 |
| 碰撞前刹车 | Beat Before Impact | 冲击前一瞬的慢拍/静止预感 |
| 动作匹配剪辑 | Cutting on Action | 顶点前切、方向延续 |
| 3 镜转向法 | 3-Shot Reorientation | 用引导镜头安全反转屏幕方向 |
| 快剪提速 | Editing for Speed | 4-8 帧闪切制造速度（环境无速度时用） |
| 闪切 | Fly-by Cut | 呼啸而过镜头的超短保留 |

## 来源

- Film Independent — How to Create A Car Chase With Action Realism（Lawrence Ribeiro：Three Bs、60-70% 追向镜头、编辑分舱）：https://www.filmindependent.org/blog/how-to-create-a-car-chase-with-action-realism/
- PremiumBeat — Creating the Illusion of Speed（模糊分配/构图/低机位/运镜）：https://www.premiumbeat.com/blog/creating-the-illusion-of-speed/
- Neil Oseman — How to Make Chase Scenes Look Fast（视差/前景/长焦横摇/明暗光斑）：https://neiloseman.com/how-to-make-chase-scenes-look-fast/
- Den of Geek — Crossing the Line: The Bourne Supremacy 追车拆解（出租车 vs G-Class、刮蹭真实感、隧道、90 度横甩、方向可读）：https://www.denofgeek.com/movies/crossing-the-line-movie-car-chases-the-bourne-supremacy/
- GoTranscript/StudioBinder — Deconstructing Mad Max Fury Road（方向建立、威胁反向、定镜保持可读、每镜付账）：https://gotranscript.com/public/deconstructing-mad-max-fury-road-the-art-of-action-sequences
- Neil Oseman — 20 Facts About the Cinematography of Mad Max: Fury Road（主体居中定剪、后期加抖）：https://neiloseman.com/20-facts-about-the-cinematography-of-mad-max-fury-road/
- Frame.io Insider — The Missing Details of Baby Driver's Crazy Workflow（动画分镜按音乐逐拍预剪）：https://blog.frame.io/2017/07/31/baby-driver-workflow/
- PremiumBeat — 6 Tips for Filming a Thrilling Car Chase Scene（别拍车、拍动作；反应镜头与车内小物特写）：https://www.premiumbeat.com/blog/how-to-film-car-chase-scene/
- PremiumBeat — In Praise of the Car Chase（《法国贩毒网》18fps 降帧提速、保险杠机位）：https://www.premiumbeat.com/blog/how-to-film-a-car-chase/
- MovieMaker — A Duel in a Different Form（追逐=决斗、环境决定速度感、拍速 vs 剪速）：https://www.moviemaker.com/the-chase-car-chase-duel-in-a-different-form/

## 相关概念

- [AI 生成动作场景：术语详解 + AI 理解与实现（Action Stunts — Deep Terms & AI Implementation）](../97-action-stunts/action-stunts.md)
- [镜头语言与景别（Camera Language & Shot Size）](../01-camera-language/camera-language.md)
- [AI 动态模糊与快门速度（Motion Blur & Shutter — 180° Rule in AI Generation）](../177-motion-blur-shutter/motion-blur-shutter.md)
- [AI 长镜头生成（One-Shot & Long Take — Segment Chaining with Hidden Joins）](../207-one-shot-long-take/one-shot-long-take.md)
- [AI 镜头语言生成专项（Shot Language Generation — Camera, Movement & Framing Prompts）](../124-shot-language-gen/shot-language-gen.md)
