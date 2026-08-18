---
type: Reference
title: "浪漫/情感场景镜头级方案（Romance & Emotional Scene — Intimacy & Feeling + AI）"
description: "浪漫与情感戏的镜头级 AI 生成方案：以克制与留白为总原则，给出相遇→试探→靠近→顶点→余韵的节拍-镜头表、8 个关键镜头的画面构成与中英提示词及生成后检查、亲密感营造四件套、什么不拍、常见错误表与 AI 编排工作流"
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
  - resource: "cited:Michigan Daily How 'Before Sunrise' uses space to create an intimate screen romance"
    id: cite-1
    title: "How 'Before Sunrise' uses space to create an intimate screen romance"
    author: "org:Michigan-Daily"
  - resource: "cited:https://www.michigandaily.com/arts/b-side/how-before-sunrise-uses-space-to-build-intimacy/"
    id: cite-2
    title: "https://www.michigandaily.com/arts/b-side/how-before-sunrise-uses-space-to-build-intimacy/"
  - resource: "cited:The Hutch Files Two-Shots in Portrait of a Lady on Fire"
    id: cite-3
    title: "Two-Shots in Portrait of a Lady on Fire"
    author: "org:The-Hutch-Files"
  - resource: "cited:https://www.thehutchfiles.com/p/two-shots-in-portrait-of-a-lady-on"
    id: cite-4
    title: "https://www.thehutchfiles.com/p/two-shots-in-portrait-of-a-lady-on"
  - resource: "cited:Montages Magazine I remember everything: The many closures of Luca Guadagnino's Call Me by Your Name"
    id: cite-5
    title: "I remember everything: The many closures of Luca Guadagnino's Call Me by Your Name"
    author: "org:Montages-Magazine"
  - resource: "cited:https://montagesmagazine.com/2018/12/i-remember-everything-the-many-closures-of-luca-guadagignos-call-me-by-your-name/"
    id: cite-6
    title: "https://montagesmagazine.com/2018/12/i-remember-everything-the-many-closures-of-luca-guadagignos-call-me-by-your-name/"
  - resource: "cited:Literary Inklings How to Film Romance: A Complete Guide for Filmmakers"
    id: cite-7
    title: "How to Film Romance: A Complete Guide for Filmmakers"
    author: "org:Literary-Inklings"
  - resource: "cited:https://literaryinklings.com/how-to-film-romance-a-complete-guide-for-filmmakers/"
    id: cite-8
    title: "https://literaryinklings.com/how-to-film-romance-a-complete-guide-for-filmmakers/"
  - resource: "cited:Go Into The Story Great Scene: 'Casablanca'"
    id: cite-9
    title: "Great Scene: 'Casablanca'"
    author: "org:Go-Into-The-Story"
  - resource: "cited:https://gointothestory.blcklst.com/great-scene-casablanca-9089f999f3b4"
    id: cite-10
    title: "https://gointothestory.blcklst.com/great-scene-casablanca-9089f999f3b4"
dx_id: "403"
related:
  - "231-shot-size-emotion/shot-size-emotion.md"
  - "93-lighting-narrative/lighting-narrative.md"
  - "88-sound-image-on-set/sound-image-on-set.md"
  - "98-natural-light/natural-light.md"
  - "176-depth-of-field-focus/depth-of-field-focus.md"
---

# 浪漫/情感场景镜头级方案（Romance & Emotional Scene — Intimacy & Feeling + AI）

> 本页为浪漫/情感场景的镜头级方案：如何用景别推进、柔光、慢节奏、视线与触碰、空镜与蒙太奇指挥 AI 生成"让观众心动"的画面。知识本体来自电影情感戏镜头惯例（经典爱情片公开拆解：Before Sunrise 的空间亲密法、Portrait of a Lady on Fire 的双人镜系统、Call Me by Your Name 的长特写与空镜、Casablanca 的触碰节拍、La La Land 的梦境蒙太奇）。AI 应用面向 DirectorX：把"克制与留白"翻译成可直接指挥 AI 生成画面的景别/光线/运动/节奏与提示词（衔接 231 景别情绪、93 光线叙事、88 声画协同、98 自然光、176 景深）。
> 来源：Michigan Daily「How 'Before Sunrise' uses space to create an intimate screen romance」、https://www.michigandaily.com/arts/b-side/how-before-sunrise-uses-space-to-build-intimacy/；The Hutch Files「Two-Shots in Portrait of a Lady on Fire」、https://www.thehutchfiles.com/p/two-shots-in-portrait-of-a-lady-on；Montages Magazine「I remember everything: The many closures of Luca Guadagnino's Call Me by Your Name」、https://montagesmagazine.com/2018/12/i-remember-everything-the-many-closures-of-luca-guadagignos-call-me-by-your-name/；Literary Inklings「How to Film Romance: A Complete Guide for Filmmakers」、https://literaryinklings.com/how-to-film-romance-a-complete-guide-for-filmmakers/；Go Into The Story「Great Scene: 'Casablanca'」、https://gointothestory.blcklst.com/great-scene-casablanca-9089f999f3b4；Oxford Academic「Nostalgia, Homage, and Bittersweet Endings: La La Land and the Classic Film Musical」、https://academic.oup.com/book/58100/chapter/479237066；Nature「Visual storytelling through the void: a quantitative analysis of empty shot distribution across film genres」、https://www.nature.com/articles/s41599-025-04527-2；Litepanels「Film Lighting: A Cinematic Guide」、https://www.litepanels.com/en/applications/your-guide-to-film-lighting/。

## 概述：情感戏的克制与留白原则

**核心断言**：浪漫/情感场景的力量来自**不拍**——镜头怎么收着来、怎么延迟、怎么留空，比拍了什么更重要。三段公开拆解共同指向同一套规律：

| 作品（公开拆解） | 镜头惯例 | 可提取的生成原则 |
|---|---|---|
| Before Sunrise（Michigan Daily 拆解） | 亲密感=空间的闭合：火车上两人各占画框两端、隔桌对话留出"人工边界"；电车尾部肩并肩；听音室一个不剪切的紧特写里"吻变得不可避免"，但电影仍让观众等 | **景别与间距是情感进度条**：先用负空间拉开距离，再逐步让两人靠拢；关键亲吻前先扣住（衔接 231 景别情绪、192 负空间） |
| Portrait of a Lady on Fire（The Hutch Files 拆解） | 整部片几乎只用双人镜：维瓦尔第场景里两人在画框内越靠越近、全程无单人镜；初吻用正面双人镜、两脸同框不遮脸；吵架才切单人/正面过肩拉开距离；最后拥抱挡住对方的脸——"太痛了" | **双人镜=关系本身**：关系升温用"双人镜内距离缩短"，关系破裂用"破成单人镜"；吻戏别让手/肩挡住任何一张脸（衔接 1 镜头语言） |
| Call Me by Your Name（Montages 拆解） | 离别站台一个约 39 秒的镜头**始终不拍 Elio 的脸**；回家路上切空路镜头、空房间、风敲窗；片尾是纹丝不动的长特写，Elio 对壁炉流泪；全片第一个紧特写迟到第 28 分钟才出现 | **留白替台词**：不拍脸、拍空镜、拍物，让情绪从"缺席"里长出来；特写是攒出来的，不能滥用（衔接 124 镜头语言生成） |

**对 AI 生成的直接含义**：AI 默认输出"什么都拍满"——两个角色永远同框、永远特写、永远在动。情感戏的提示词恰恰要**反向约束**：限制景别（不要全景不要大特写）、限制运动（缓慢或静止）、限制时长（单镜给足 5-10 秒）、主动插入空镜与"什么都不发生"的镜头。留白不是缺素材，是镜头方案本身。

## 场景节拍 → 镜头序列表（相遇 → 试探 → 靠近 → 情感顶点 → 余韵）

以一场"初次心动→表白→分离"的完整情感段落为例，8 个节拍构成生成顺序骨架（衔接 158 情绪弧线与节奏、100 长片结构）：

| # | 节拍 | 镜头方案（画面里发生什么） | 情绪任务 | AI 提示词要点 | 时长参考 |
|---|---|---|---|---|---|
| 1 | 相遇（距离） | 全景/中景双人，两人之间留出明显负空间；环境音为主，无配乐 | 建立"两个陌生人"，先别让观众心动 | `two-shot, wide negative space between them`；忌特写忌对视 | 4-6s |
| 2 | 试探（对话） | 过肩正反打，但两人视线不完全相接——一人看向别处 | 悬念：有没有可能？ | `over-the-shoulder, she looks away mid-sentence, hesitant` | 3-5s |
| 3 | 靠近（空间闭合） | 双人镜内两人距离缩短：肩并肩、同看一个方向（夜景/窗景） | 物理距离=心理距离的第一次缩短 | `two-shot, shoulder to shoulder, both facing the window, soft night light` | 5-8s |
| 4 | 回避（退一步） | 切单人镜：一人独自在画框一侧，另一人背影入画边缘 | 欲拒还迎，张力靠"差一点" | `single shot, alone in frame, the other's back enters frame edge, out of focus` | 3-4s |
| 5 | 情感顶点（对视） | 对视特写：推近、长停留；此时才第一次给"眼睛特写"级别的景别 | 整段情绪的峰值——攒到这里 | `close-up on the eyes, slow push-in, long hold, no cut` | 6-10s |
| 6 | 触碰（手） | 手部特写：手指犹豫着靠近、触碰、停住；慢动作可选 | 比吻更亲密的瞬间 | `macro close-up, two hands, hesitant touch, fingers brushing, slow motion` | 4-6s |
| 7 | 余韵一（空镜） | 空镜抒情：窗上雨痕/风掀窗帘/空长椅/街灯；环境声，无对话 | 让情绪"溢出"到环境里（衔接 98 自然光） | `empty shot, rain on window, no people in frame, ambient sound` | 3-5s |
| 8 | 余韵二（收尾） | 收尾长特写：一人独自坐着，微表情变化，不解释；音乐渐入 | 留白收束，观众自己完成情绪 | `static extreme close-up, face in profile, tears welling, no dialogue, hold` | 8-15s |

**生成顺序纪律**：1→2→4 先出（建立距离与不确定性），3 与 5 是中间与峰值，7→8 最后出（空镜与收尾特写是最容易"填太满"的镜头，留到最后反而容易克制）。每镜生成后按第 3 节"检查清单"逐项过，再进下一镜。

## 关键镜头画面构成（逐镜：画面构成 / AI 提示词 / 生成后检查）

### 镜头 A：对视特写（The Look — 情感顶点）

- **画面构成**：景别推进到眼部级特写（眼睛+眉弓，约占画幅 1/2-2/3），另一人画外或在焦外。眼神要有"内容"：欲言又止、泪光、躲闪后重新相接。眼神光（catchlight）是灵魂——眼珠里要有明确的高光点。背景完全虚化，画面几乎静止，只允许呼吸级的微微起伏。参考：Before Sunrise 听音室的紧特写——"吻变得不可避免"却迟迟不发生；CMBYN 片尾壁炉前长特写——不解释、不回避、由观众读完（衔接 175 微表情、212 表情库）。
- **AI 提示词（中）**：`眼部特写，缓慢推近，眼神先躲开再转回，泪光在眼中打转，眼神光清晰，背景奶油般虚化，画面几乎静止只有呼吸起伏，暖色柔光，长镜头停留不切换`
- **AI 提示词（EN）**：`extreme close-up on the eyes, slow push-in, gaze shifts away then returns, tears welling, clear catchlight, creamy bokeh background, almost still except breathing, warm soft light, long static hold, no cut`
- **生成后检查**：①瞳孔/虹膜是否稳定（AI 常见"瞳孔融化"或左右眼不对称）；②眼神光是否真实（两个高光点怪异的要重出）；③视线方向是否与对手位置一致（衔接 1 视线匹配）；④是否真的够慢——生成结果若 3 秒内切走或剧烈运动，改为 `static, hold` 加长镜头参数重出。

### 镜头 B：过肩镜头（OTS — 亲密里的"第三方视角"）

- **画面构成**：前景是 A 的肩/后脑（大虚化，只给轮廓），焦点在 B 脸上。与对话场景的过肩不同，情感戏过肩要**更近、更不对称**：肩占画幅边缘 1/4 即可，B 的脸要更大、更居中——观众感到"我从 A 的位置看她/他"。可让前景肩缓慢向画面内移动（A 正在靠近），把"逼近"拍出来（衔接 102 对话场景覆盖）。
- **AI 提示词（中）**：`过肩镜头，前景肩膀大幅虚化只留轮廓，焦点在对方脸上，脸占画幅中央偏大，视线微微向下看向镜头方向，暖光从侧面勾勒脸型，镜头缓慢前移，肩膀缓缓入画`
- **AI 提示词（EN）**：`over-the-shoulder shot, blurred shoulder in foreground edge, focus on the other's face filling the frame center, soft side light sculpting the face, camera slowly pushes in while the shoulder drifts into frame`
- **生成后检查**：①前景肩是否挡脸（鼻尖/半张脸被盖=亲密感全毁，见 Portrait 拆解中 Dune 2、Melancholia 的反例）；②焦点是否在 B 眼上而非鼻尖/头发；③景别是否比对话戏更紧——生成结果若还是"对话式宽松过肩"，把提示词里的 `closer, face fills frame` 加强重出。

### 镜头 C：手部触碰（Hands — 比吻更亲密的瞬间）

- **画面构成**：手部特写/大特写。两种拍法：①两人手从画框两端进入、缓慢接近、指尖先碰、再停住（试探）；②一只手覆上另一只手（安抚/挽留）。背景全虚化或干脆是极简纹理（桌布/沙发/毛衣）。光线要软，手的皮肤质感要真实。参考：Casablanca 名场面节拍——Rick 抬手托起 Ilsa 的下巴、把她的脸迎向自己再说话（Go Into The Story 剧本摘录），"触碰"本身先于台词发生（衔接 196 微距细节镜头）。
- **AI 提示词（中）**：`手部大特写，两只手从画框两侧缓缓靠近，指尖犹豫着轻触，停住不动，慢动作，柔和的暖侧光，背景虚化，手的皮肤细节真实`
- **AI 提示词（EN）**：`macro close-up on hands, two hands slowly approaching from opposite frame edges, fingertips hesitating then touching, holding still, slow motion, soft warm side light, shallow depth of field, realistic skin texture`
- **生成后检查**：①手指数量/结构（AI 重灾区，数清楚每只手）；②触碰是否"稳"——AI 常让手穿透或弹开，接触点要帧级看；③节奏是否够慢——快进检查若动作突兀，改 `slow motion` 或拆成"接近"与"触碰"两段生成再拼接。

### 镜头 D：逆光剪影（Backlit Silhouette — 浪漫感的"氛围帧"）

- **画面构成**：两人（或一人）位于强光源（落日、街灯、窗光）与摄影机之间，主体成剪影/半剪影，边缘有金色轮廓光（rim light）。脸部细节可牺牲——剪影的美在于形状与轮廓（发丝、肩线、相拥的剪影）。可加轻微光晕/雾气让光源柔化（衔接 236 明暗对照光、93 光线叙事）。黄昏/蓝调时刻（golden hour / blue hour）是经典时段（衔接 98 自然光）。
- **AI 提示词（中）**：`逆光剪影，两人相拥的轮廓，背景是落日的金色光晕，边缘轮廓光勾出发丝，薄雾让光线柔化，半剪影保留脸部一点暖光，黄昏蓝调天空，画面安静唯美`
- **AI 提示词（EN）**：`backlit silhouette of two figures embracing, golden sunset glow behind them, rim light tracing hair edges, soft haze, half-silhouette with faint warm fill on faces, blue hour sky, quiet dreamy mood`
- **生成后检查**：①剪影形状是否可读（两个人是否"糊成一团"——拉开一点间距或让姿态更明确）；②轮廓光是否从同一方向来（光源方向跳跃=假）；③边缘是否出现诡异的发光轮廓（AI 常见"白边"伪影）；④脸部若有细节，检查是否与角色设定一致（衔接 39 图片一致性）。

### 镜头 E：空镜抒情（Empty Shot — 情绪溢出的容器）

- **画面构成**：画框内**没有人**：窗上雨痕、风掀起的窗帘、空长椅、熄灭的灯、桌上的两杯茶、被风吹动的书页。它是"角色此刻的感受"的投影——刚离别后的空房间比任何台词都狠。理论依据：空镜被研究为"非人类的、环境性的情绪载体"，且类型学统计显示其在情感/文艺类电影中分布显著更高（Nature, 2025）。CMBYN 拆解中"强调 Oliver 离开后空间的空"是收尾段落的支柱（衔接 192 负空间、181 天气氛围叙事）。
- **AI 提示词（中）**：`空镜，雨滴划过窗玻璃，窗外街灯光斑虚化，室内无人，窗帘被风吹动，静物特写，冷调但带一点暖色残留，固定机位，长时间停留，环境声清晰`
- **AI 提示词（EN）**：`empty shot, raindrops trailing down the window, blurred streetlight bokeh outside, no people, curtain stirring in the wind, still-life detail, cool tones with a hint of leftover warmth, static camera, long hold, clear ambience`
- **生成后检查**：①画框里真的没人吗（AI 常"顺手"生成路人/人影——逐帧扫）；②环境是否与上一镜空间连续（同一扇窗/同一张桌，衔接 200 时间连续）；③运动是否"有理由"（窗帘动是因为风，不是无意义蠕动）；④氛围对不对（这是情绪容器，过亮过艳都是错）。

### 镜头 F：长镜跟随（Long Take — 真实时间的亲密）

- **画面构成**：一个镜头内持续跟随两人行走/依偎，不切镜，缓慢横移或跟拍；两人边走边聊、身体语言变化（一开始保持距离，走几步后靠近）。真实时间=观众与角色共处，亲密感由此而来（衔接 207 长镜头、343 手持美学——情感戏建议稳定缓慢的手持或轨道感，不要晃）。CMBYN 站台告别段几乎一个镜头完成，"关门+汽笛"那一刀才切——长镜攒住的情绪在一刀里释放。
- **AI 提示词（中）**：`一镜到底，缓慢跟拍两人并肩走在夜晚街道，从远景缓推至中景，两人从保持距离到靠近，路灯与橱窗光在背景流动，稳定平滑的镜头运动，无剪辑，全程环境声`
- **AI 提示词（EN）**：`one continuous take, slow tracking shot following two people walking side by side at night, gently pushing from wide to medium, distance closing between them, streetlight glow flowing past, smooth stabilized movement, no cuts, continuous ambience`
- **生成后检查**：①画面内一致性（AI 长镜的"变形/换装/换场景"——衣服、发型、背景建筑逐段比对，衔接 117 一致性全体系、123 长视频一致）；②运动是否过猛（情感戏长镜要"呼吸感"，忽快忽慢=失败，重出时写 `steady, slow, constant speed`）；③两人相对位置是否稳定（突然交换左右=穿帮）；④超过模型能力的长镜可拆两段，用遮挡/虚焦处做拼接点。

### 镜头 G：亲吻/相拥双人镜（Two-Shot — 两脸同框才叫亲密）

- **画面构成**：正面双人镜，两人面部**同时清晰可见**，不遮脸、不过肩、不用手挡。Portrait 的初吻正是一个"标准正面双人镜"：摘掉围巾后两脸同框，亲密感来自观众同时看到两张脸的反应——这是拆解明确点出的反例对照（Dune Part 2、Melancholia 中手/肩几乎完全盖住其中一人的脸，亲密感被拿掉）。亲吻前可先给一个"即将亲吻"的静态停留（1-2 秒），让观众先于角色意识到。
- **AI 提示词（中）**：`正面双人镜，两人面对面，距离极近，两张脸同框都清晰可见，即将亲吻的静止瞬间，鼻尖将碰未碰，暖色柔光，浅景深，背景虚化成光斑，镜头纹丝不动`
- **AI 提示词（EN）**：`frontal two-shot, faces close together, both faces clearly visible in frame, the still moment before a kiss, noses almost touching, warm soft light, shallow depth of field, bokeh background, completely static camera`
- **生成后检查**：①两张脸是否都完整（AI 常见"两张脸糊成一张/五官融合"——逐帧检查轮廓线）；②是否有人手/肩膀挡住脸（立刻重出）；③即将亲吻的"静止感"——若画面提前亲上或后退，用 `freeze, hold still, almost touching` 重出；④两人的身高/脸型比例是否与全片设定一致（衔接 203 时代一致、39 图片一致性）。

### 镜头 H：收尾长特写（The Hold — 让观众自己完成情绪）

- **画面构成**：固定机位长特写，一人独处（壁炉前/窗前/车里），脸上只有微表情变化：眼泪慢慢聚起、喉结滚动、呼吸变深。不解释、不切走、不给对手镜头——情绪全部交给观众投射。CMBYN 片尾壁炉前特写即是教科书：长时间、无台词、音乐（"Visions of Gideon"）渐入（衔接 88 声画协同——音乐在这类镜头里是"最后一层表演"）。
- **AI 提示词（中）**：`固定机位特写，侧脸/半侧脸，独自坐着，壁炉暖光在脸上跳动，眼泪慢慢盈满眼眶，喉结滚动，呼吸可见，无台词，长镜头停留，音乐渐入，极慢的节奏`
- **AI 提示词（EN）**：`static close-up, face in profile, sitting alone, warm fireplace light flickering on the face, tears slowly welling up, subtle swallow, visible breathing, no dialogue, long hold, music fading in, very slow pace`
- **生成后检查**：①表情变化是否"层次够"（AI 常一步到位挤出大表情——要的是微表情递进，衔接 175 微表情）；②眼泪/光影物理（泪珠成形、壁炉光闪烁频率合理）；③时长是否给足（短于 6 秒的情绪特写没有力量，用 `long take` 或拼接延长）；④眼睛是否自然（AI 泪眼常伴"瞳孔高光过爆"）。

## 亲密感的营造（景别推进 × 柔光 × 浅景深 × 安静环境声）

四件套叠加使用，缺一不可（衔接 231 景别情绪、93 光线叙事、88 声画协同、98 自然光、176 景深）：

| 维度 | 手法 | 画面里长什么样 | AI 提示词写法 |
|---|---|---|---|
| 景别推进 | 从"两人同框留距离"逐镜推进到"眼睛特写"，**推进本身即叙事**（Before Sunrise 的空间闭合） | 相遇=中景双人→试探=过肩→靠近=肩并肩→顶点=眼睛特写 | 全段统一写 `shot size progression: two-shot → OTS → close-up → extreme close-up on eyes`，每镜景别写死，不跳级 |
| 柔光 | 光源面积大、方向散：漫射窗光、磨砂灯罩、烛光/串灯等实际光源（motivated light）；色温偏暖 2700-3500K 区间制造金/琥珀/橙辉（Literary Inklings） | 面部无硬阴影，肤色柔和，高光过渡平滑，光源自带"氛围" | `soft diffused light, warm 3000K glow, practical string lights / candlelight, gentle falloff, no hard shadows`（衔接 93/98/225） |
| 浅景深 | 大光圈/长焦压缩：主体锐利，背景化为光斑（bokeh），把两人"从世界里摘出来"（衔接 176 景深） | 背景虚化成圆形光斑，前景偶尔有虚化元素（肩、叶、纱）分层 | `85mm, f/1.8, creamy bokeh background, subject isolated from the world` |
| 安静环境声 | 空间音：雨、壁炉噼啪、钟声、风敲窗、远处车流；关键处用**沉默**压住情绪（Literary Inklings；CMBYN 的钟声/风声是贯穿母题） | 画面静，声音层也静；对白稀疏，空白处由环境声填 | 音频轨写 `room tone + rain / fireplace crackle, minimal dialogue, long silences between lines`（衔接 88） |

**节奏是第五件套**：所有镜头时长按"慢"来定——情感戏单镜平均时长是动作戏的 2-3 倍；生成时明确写 `slow pace`、`long hold`、`no cut`，剪辑端用叠化（dissolve）代替硬切收尾（CMBYN 用叠化表达"出离与疏离"，La La Land 尾声蒙太奇用叠化串联"如果当初"）。叠化提示词：`dissolve transition, soft crossfade`（衔接 127 剪辑转场）。

## 克制原则（什么不拍比拍什么重要）

情感戏的每一处"不拍"都是一个镜头决策，AI 生成时要**主动写进提示词**：

1. **不拍脸（拍背影/画外/遮挡）**：CMBYN 站台告别 39 秒不拍 Elio 的脸——缺席的脸=不可承受的情绪。AI 写法：`over his shoulder from behind, face hidden, camera holds on the back of his head`。
2. **不拍动作（拍前兆）**：亲吻前先拍"即将亲吻的静止"；触碰前先拍"手悬在半空"。延迟即张力（Before Sunrise 把吻扣到观众迫不及待）。AI 写法：`the moment before the kiss, noses almost touching, holding still`。
3. **不拍特写（攒着）**：CMBYN 第一个紧特写在第 28 分钟才出现。全片特写密度要有"预算"，顶点才花。AI 写法：前段提示词主动限定 `medium shot only, no close-ups`。
4. **不拍人（拍空镜）**：情绪顶点后切空镜——空座位、空路、风、雨，让情绪溢出画面（Nature 空镜研究；CMBYN 回家路上的空路镜头"没有叙事功能，却充满意义"）。AI 写法：主动插入 `empty shot, no people`。
5. **不拍解释（拍结果）**：不说"她哭了"，只拍"眼泪落下后她抹了一下脸又坐直"。微表情递进代替台词（衔接 175）。
6. **不拍全（用叠化省略）**：La La Land 尾声用梦境蒙太奇把"另一种人生"整段叠化带过——省略本身是抒情。AI 写法：`dissolve montage, soft crossfades, time passing`。
7. **不在顶点切（在顶点后切）**：CMBYN 火车关门+汽笛那一刀才切——一刀攒了 90 秒。AI 编排：长镜攒足再落剪辑点（衔接 207 长镜头）。

## 常见错误表

| 错误（AI 生成中高频出现） | 后果 | 正确做法 |
|---|---|---|
| 每镜都推大特写，无景别递进 | 特写通胀，顶点失去重量 | 按节拍表限景别，前段 `medium shot only`，特写留给第 5/8 拍 |
| 吻戏/拥抱挡住一张脸（手、肩、发） | 亲密感被拿掉（Portrait 拆解点名的反例） | 双人镜两脸同框，检查清单明确"无遮挡" |
| 过度柔光=画面发灰发闷 | 质感丢失、像滤镜贴片 | 柔光+保留眼神光与轮廓光（rim light），软中带结构（衔接 93） |
| 空镜里"顺手生成"了路人 | 抒情破功 | `no people` 写进提示词并逐帧检查 |
| 长镜中途角色换装/变形/换场景 | 一眼假 | 拆段生成+遮挡处拼接，逐段比对一致性（衔接 117/123） |
| 情绪一步到位（秒哭/秒笑） | 假、无层次 | `subtle micro-expression progression`，给足时长（衔接 175） |
| 音乐铺满、无静默 | 情绪被"说破"，观众无事可做 | 关键拍用沉默，音乐渐入而非同时起（衔接 88） |
| 节奏贪快（单镜 2-3 秒） | 亲密感=停留感，快=没有 | 单镜 5-10 秒起，`slow pace, long hold` |
| 手部/五官结构崩坏 | 出戏重灾区 | 手部与眼部特写逐帧检查，坏了只重出该镜（衔接 118 缺陷修复） |
| 光线情绪与剧情错位（甜蜜戏冷硬光/分离戏艳阳高照） | 情绪与画面打架 | 每节拍先定"光线情绪词"再生成（衔接 93/98） |

## 工作流应用（AI 编排）

用 DirectorX 生成一段完整浪漫/情感段落的编排顺序（衔接 115 提示词工程、117 一致性全体系、174 质检、118 缺陷修复）：

```text
① 节拍表（本页第 2 节 8 拍模板）→ 确定景别/光线/时长预算
② 角色一致性锚点：两位主角定妆参考图+身份块（衔接 39/117）
③ 逐镜生成，顺序：节拍 1→2→4（先建距离）→3→5→6（中间与顶点）→7→8（空镜与收尾）
④ 每镜三段式提示词：镜头语言（景别/焦段/运动）＋光线情绪（色温/软硬/光源动机）＋表演状态（视线/呼吸/微表情）
⑤ 声画层：先定环境声与静默点，配乐只在第 5、8 拍渐入（衔接 88/119）
⑥ 质检：按本页"生成后检查"逐镜过；跨镜查视线方向、景别递进、光线色温连续性（衔接 174/200）
⑦ 剪辑端：硬切用于节奏点，情绪收尾用叠化；长镜攒够再落刀（衔接 127）
⑧ 缺陷修复：手/眼/遮挡问题只重出该镜，不整段重来（衔接 118）
```

**万能情绪提示词模板**（可直接套用）：

```text
[景别与焦段] close-up on [the eyes], 85mm, shallow depth of field
[光线情绪] warm soft 3000K light from [candlelight / window at golden hour], gentle rim light,
            no hard shadows, subtle catchlight
[运动与节奏] slow push-in, nearly static, long hold, no cut, slow pace
[表演状态] gaze hesitates then meets, breath deepens, micro-expression shift, no dialogue
[声音层] room tone + rain, long silence before music fades in
[检查] eyeline matches the other character / faces unblocked / fingers intact / no bystanders in empty shots
```

## 术语表（中英对照）

| 中文 | English | 画面里是什么 |
|---|---|---|
| 对视特写 | The Look / Eye Close-up | 眼部级特写，情感顶点的"攒出来的镜头" |
| 过肩镜头 | Over-the-Shoulder (OTS) | 前景虚肩+焦点在对方脸上，亲密版更近更不对称 |
| 双人镜 | Two-Shot | 两人同框，关系本身；升温靠框内距离缩短 |
| 正面双人镜 | Frontal Two-Shot | 两脸同框都可见，吻戏标准拍法（不遮脸） |
| 手部特写 | Hand Macro | 触碰瞬间的特写，比吻更亲密 |
| 逆光剪影 | Backlit Silhouette | 主体在光源与机位之间，剪影+轮廓光 |
| 空镜（抒情） | Empty Shot / Insert | 无人的环境镜头，情绪的容器 |
| 长镜跟随 | Long Take Tracking | 一镜到底的缓慢跟随，真实时间的亲密 |
| 景别推进 | Shot Size Progression | 从远到近的逐镜递进，推进本身即叙事 |
| 眼神光 | Catchlight | 眼珠里的高光点，眼神的"生命" |
| 轮廓光 | Rim Light | 勾出边缘的光，剪影与分离感的来源 |
| 动机光源 | Motivated Light | 画面内有来源的光（烛/灯/窗），柔光可信的前提 |
| 留白 | Negative Space / Ma | 画框内不拍满，情绪从空处生长 |
| 叠化 | Dissolve | 软过渡，时间流逝与情绪延续的转场 |
| 微表情递进 | Micro-Expression Progression | 情绪分层涌现，代替"一步到位"的表演 |
| 环境声 | Ambience / Room Tone | 空间的呼吸声，静默也是声音设计 |

## 来源

- Michigan Daily: How 'Before Sunrise' uses space to create an intimate screen romance — https://www.michigandaily.com/arts/b-side/how-before-sunrise-uses-space-to-build-intimacy/
- The Hutch Files: Two-Shots in Portrait of a Lady on Fire — https://www.thehutchfiles.com/p/two-shots-in-portrait-of-a-lady-on
- Montages Magazine: I remember everything: The many closures of Luca Guadagnino's Call Me by Your Name — https://montagesmagazine.com/2018/12/i-remember-everything-the-many-closures-of-luca-guadagignos-call-me-by-your-name/
- Literary Inklings: How to Film Romance: A Complete Guide for Filmmakers — https://literaryinklings.com/how-to-film-romance-a-complete-guide-for-filmmakers/
- Go Into The Story (The Black List): Great Scene: "Casablanca" — https://gointothestory.blcklst.com/great-scene-casablanca-9089f999f3b4
- Oxford Academic: Nostalgia, Homage, and Bittersweet Endings: La La Land and the Classic Film Musical — https://academic.oup.com/book/58100/chapter/479237066
- Nature (Humanities & Social Sciences Communications): Visual storytelling through the void: a quantitative analysis of empty shot distribution across film genres — https://www.nature.com/articles/s41599-025-04527-2
- Litepanels: Film Lighting: A Cinematic Guide — https://www.litepanels.com/en/applications/your-guide-to-film-lighting/

## 相关概念

- [电影景别情绪理论（Shot Size Emotion — Close-Up Intimacy, Wide Isolation）](../231-shot-size-emotion/shot-size-emotion.md)
- [光线叙事（Lighting as Narrative）](../93-lighting-narrative/lighting-narrative.md)
- [拍摄端声画协同（Designing Picture for Sound）](../88-sound-image-on-set/sound-image-on-set.md)
- [自然光：术语详解 + AI 理解与实现（Natural Light — Deep Terms & AI Implementation）](../98-natural-light/natural-light.md)
- [AI 景深与焦点控制（Depth of Field — Subject-Background-Distance & Bokeh）](../176-depth-of-field-focus/depth-of-field-focus.md)
