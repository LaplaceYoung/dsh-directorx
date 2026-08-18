---
type: Reference
title: "恐怖/惊悚场景镜头级方案（Horror & Thriller Scene — Fear by Design + AI）"
description: "恐怖/惊悚场景的镜头级方案：恐惧三层机制（预期恐惧/突然惊吓/心理不安）、节拍→镜头序列表、7 类关键镜头画面构成（走廊推近/门缝阴影/镜面反射/焦外威胁/惊吓特写/喘息静帧/威胁 POV）、制造恐惧的镜头手段、jump scare 设计原则、常见错误与 AI 生成工作流，每个镜头给出中英 AI 提示词与生成后检查"
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
  - resource: "cited:The Verge 'Why won't you die?!' The art of the jump scare"
    id: cite-1
    title: "'Why won't you die?!' The art of the jump scare"
    author: "org:The-Verge"
  - resource: "cited:https://www.theverge.com/2012/10/31/3574592/art-of-the-jump-scare-horror-movies"
    id: cite-2
    title: "https://www.theverge.com/2012/10/31/3574592/art-of-the-jump-scare-horror-movies"
  - resource: "cited:Final Draft Scare Smart: When and How to Use Jump Scares Like a Pro"
    id: cite-3
    title: "Scare Smart: When and How to Use Jump Scares Like a Pro"
    author: "org:Final-Draft"
  - resource: "cited:https://www.finaldraft.com/blog/scare-smart-when-and-how-to-use-jump-scares-like-a-pro"
    id: cite-4
    title: "https://www.finaldraft.com/blog/scare-smart-when-and-how-to-use-jump-scares-like-a-pro"
  - resource: "cited:Raindance Crafting Fear: Filming Techniques to Evoke Emotion in Horror Movies"
    id: cite-5
    title: "Crafting Fear: Filming Techniques to Evoke Emotion in Horror Movies"
    author: "org:Raindance"
  - resource: "cited:https://raindance.org/crafting-fear-filming-techniques-to-evoke-emotion-in-horror-movies/"
    id: cite-6
    title: "https://raindance.org/crafting-fear-filming-techniques-to-evoke-emotion-in-horror-movies/"
  - resource: "cited:CBR The Conjuring Revolutionized the Art of the Scare With Misdirection"
    id: cite-7
    title: "The Conjuring Revolutionized the Art of the Scare With Misdirection"
    author: "org:CBR"
  - resource: "cited:https://www.cbr.com/the-conjuring-revolutionized-art-of-scare/"
    id: cite-8
    title: "https://www.cbr.com/the-conjuring-revolutionized-art-of-scare/"
  - resource: "cited:PopHorror Inside 'THE SHINING' (1980): Mazes of Madness and the Slow Burn of a Horror Classic"
    id: cite-9
    title: "Inside 'THE SHINING' (1980): Mazes of Madness and the Slow Burn of a Horror Classic"
    author: "org:PopHorror"
  - resource: "cited:https://pophorror.com/inside-the-shining-1980-mazes-of-madness-and-the-slow-burn-of-a-horror-classic/"
    id: cite-10
    title: "https://pophorror.com/inside-the-shining-1980-mazes-of-madness-and-the-slow-burn-of-a-horror-classic/"
dx_id: "411"
related:
  - "37-genre-horror-suspense/horror-suspense.md"
  - "274-suspense-visual-language/suspense-visual-language.md"
  - "268-suspense-theory/suspense-theory.md"
  - "236-chiaroscuro-light/chiaroscuro-light.md"
  - "93-lighting-narrative/lighting-narrative.md"
---

# 恐怖/惊悚场景镜头级方案（Horror & Thriller Scene — Fear by Design + AI）

> 本页为恐怖/惊悚场景的镜头级方案：恐惧机制分层、节拍→镜头序列、关键镜头画面构成、jump scare 设计原则与 AI 生成工作流。知识本体来自电影恐怖/惊悚镜头惯例（《惊魂记》《豹族》《闪灵》《月光光心慌慌》《招魂》《潜伏》《驱魔人 III》《异形》等公开拆解）。AI 应用面向 DirectorX：把"恐惧"翻译成可指挥 AI 生成的具体画面——藏什么、给什么、何时给、怎么动（衔接 37 恐怖视觉、274 悬念视听、268 悬念、236 明暗对照、93 光线叙事）。
> 来源：The Verge「'Why won't you die?!' The art of the jump scare」、https://www.theverge.com/2012/10/31/3574592/art-of-the-jump-scare-horror-movies；Final Draft「Scare Smart: When and How to Use Jump Scares Like a Pro」、https://www.finaldraft.com/blog/scare-smart-when-and-how-to-use-jump-scares-like-a-pro；Raindance「Crafting Fear: Filming Techniques to Evoke Emotion in Horror Movies」、https://raindance.org/crafting-fear-filming-techniques-to-evoke-emotion-in-horror-movies/；CBR「The Conjuring Revolutionized the Art of the Scare With Misdirection」、https://www.cbr.com/the-conjuring-revolutionized-art-of-scare/；PopHorror「Inside 'THE SHINING' (1980): Mazes of Madness and the Slow Burn of a Horror Classic」、https://pophorror.com/inside-the-shining-1980-mazes-of-madness-and-the-slow-burn-of-a-horror-classic/

## 概述：恐怖的三层机制与镜头职责

**核心断言**：恐怖场景的镜头工作不是"把可怕的东西拍出来"，而是**在三条不同的恐惧通道上做预算管理**——预期恐惧（熬时间）、突然惊吓（生理触发）、心理不安（事后发酵）。好的恐怖片同时运营三层：观众被"等着吓一跳"的预期吊着，被"没想到的瞬间"真实吓到，又在散场后因某个画面细节而失眠。镜头级的职责分配如下：

1. **预期恐惧（Anticipation / Dread）**：观众知道或感觉到危险存在，但不知道何时、从哪个方向来。镜头职责是**延长时间、藏住信息、持续加压**——希区柯克的炸弹原则在这里同样成立：桌下有炸弹而角色不知，观众的心跳由镜头时长控制（衔接 268 悬念理论：悬念=观众知识差+等待时长）。《闪灵》是这种机制的教科书：恐怖根植于孤立与缓慢侵蚀的疯狂，而非廉价惊吓（PopHorror 拆解）。
2. **突然惊吓（Startle / Jump Scare）**：由**声音+画面突变**触发的生理反射，走的是战斗-逃跑的本能通道，几乎不经认知（电影学者 Robert Baird 将最早的银幕惊吓追溯至卢米埃尔兄弟 1895 年的《火车进站》，观众曾被冲向镜头的火车惊得跳开；Final Draft 引 Slate）。镜头职责是**铺垫-误导-触发-释放**（见第 5 节）——它是"惊吓预算"，不能连发，否则观众脱敏（The Verge 拆解 80 年代恐怖片把 jump scare 用滥的教训）。
3. **心理不安（Psychological Unease）**：事后发酵的认知层恐惧——画面里某个"不太对"的细节、威胁从未被看清、规则被悄悄打破。镜头职责是**留白与反常**：低照度把大部分画面藏进黑暗（衔接 236 明暗对照、93 光线叙事），倾斜构图破坏平衡感（荷兰角，《卡里加利博士的小屋》1920 年起即为恐怖所用；Raindance 拆解），静止画面停留过久让观众开始害怕"将要发生什么"（库布里克在《闪灵》中的静止长镜；Raindance 拆解）。

**AI 翻译**：AI 视频模型默认"把一切拍清楚、把一切拍完整、让画面一直在动"。恐怖场景的导演工作因此主要是**写"不要"**：不要补亮暗部、不要让威胁露全貌、不要让画面一直动、不要在同一条素材里放两个惊吓。本页所有提示词都遵循"给什么 + 扣什么"的双向结构（衔接 115 提示词工程、124 镜头语言生成）。

## 场景节拍→镜头序列表

标准恐怖弧线（以"深夜独自在家的角色听到楼下有声音"为例）：**常态建立 → 进入不安 → 线索 → 逼近 → 惊吓点 → 喘息 → 再升级 → 收尾**。8 拍中只有第 5 拍是"惊吓兑现"，其余 7 拍都是它的蓄力——这正是"恐惧靠熬、惊吓靠攒"的节奏纪律（衔接 158 情绪曲线：张力-释放循环、127 剪辑节奏）。

| # | 节拍 | 情绪 | 镜头设计 | 画面构成 | AI 提示词（简版） |
|---|---|---|---|---|---|
| 1 | 常态建立 | 平静/安全感 | 定场静帧+日常动作 | 夜晚房屋外景、一扇暖光窗、角色日常起居，一切正常 | `wide establishing shot, quiet house at night, one warm window light, stillness, normal life`（安静到"正常得可疑"） |
| 2 | 进入不安 | 隐约不安 | 环境细节插入+轻微推近 | 门没关紧、灯管闪烁、玩具自己动了一下——异常以"日常"身份出现 | `insert shot, a door slightly ajar at the end of the hall, dead silence, subtle slow push-in`（异常藏在日常里） |
| 3 | 线索 | 警觉 | 特写/焦点转移 | 角色视线转向画外声源，浅景深锁定脸部与视线方向 | `close-up, character's eyes scanning, head turning slowly toward a sound off-screen, shallow focus, breath audible`（先给反应，扣住声源） |
| 4 | 逼近 | 紧张 | 纵深推进/威胁侧静止 | 走廊纵深缓慢推近，尽头暗部中一个剪影若隐若现；威胁越静越可怕 | `slow tracking shot down a dark corridor, a faint human silhouette at the far end barely visible, heavy shadow, camera creeping forward`（推近=观众被迫靠近） |
| 5 | 惊吓点 | 冲击 | 突然特写/静态前置 | 前一镜静止低能量，威胁瞬间占满画幅——触发帧要"快" | `sudden extreme close-up, a pale face lunging toward the lens in one frame, hard cut from stillness`（静态前置+瞬间占满） |
| 6 | 喘息 | 假安全 | 长静帧 | 空房间、角色松一口气——威胁似乎消失，观众放松（这是下一次惊吓的铺垫起点） | `static wide shot, empty room, character exhales with relief, absolute stillness, long hold`（放松=下一次蓄力） |
| 7 | 再升级 | 恐惧确认 | 威胁暴露/反转 | 威胁从"以为安全"的方向出现：身后的门开了、镜中多了一个人 | `slow pan, the door behind the character now standing open, darkness inside, dawning horror on the face`（反转方向，见误导原则） |
| 8 | 收尾 | 余韵 | 留白长镜 | 心理不安的最后一帧：角色盯着黑暗的走廊，没有闭合，恐惧留在画外 | `held shot, character staring into the dark hallway, unresolved dread, no closure, room tone`（不交代=持续不安） |

**节拍纪律**：第 4→5 拍（逼近→惊吓）是全场核心对子——**静态前置**（第 4 拍收尾时镜头静止、能量降到最低）直接决定第 5 拍的冲击力（衔接 127 剪辑节奏、99 喜剧节奏的"节拍落差"同构原理：落差越大，触发越响）。第 6 拍（喘息）常被新手省略，但它不可省略：没有释放，就没有下一次蓄力（衔接 158 情绪曲线）。

## 关键镜头画面构成（逐镜 7 个）

每个镜头含：画面构成 / AI 提示词（中英）/ 生成后检查。提示词遵循"画面状态+运动线索+镜头参数+**扣什么**"结构——恐怖提示词的否定式约束（`no detail in shadow`、`never revealed`）与肯定式描述同等重要（衔接 115 提示词工程）。

### 镜头 A：走廊纵深缓慢推近（Corridor Push-In）

- **画面构成**：对称走廊、一点透视、尽头落在暗部；角色背影小比例位于画面中央，向尽头缓行；镜头极缓慢推近或跟随，推近动作本身即"逼近"的隐喻——摄影机替观众做"被迫靠近"的动作（希区柯克推近传统，衔接 402 走廊纵深、178 机位高度）。威胁（若存在）只以尽头的剪影或暗部轮廓出现，绝不露全貌。
- **AI 提示词（中）**：`对称走廊一点透视，尽头一片黑暗，两侧门半掩，头顶一盏昏暗灯管偶尔闪烁，地面微反光；角色背影在画幅中央占小比例，向尽头缓行；镜头极缓慢推近，推近速度均匀如呼吸；尽头暗部中一个模糊人形轮廓若隐若现，no facial detail`
- **AI 提示词（英）**：`symmetrical corridor one-point perspective, pitch-black far end, doors ajar on both sides, one dim flickering ceiling light, faint reflections on the floor; small lone figure walking toward the darkness from center frame; extremely slow push-in, steady creeping pace like breathing; a barely visible human silhouette at the far end, no facial detail, underexposed far end`
- **生成后检查**：① 尽头暗部是否真的"看不清"（AI 倾向自动补亮——用 `underexposed far end, no detail in shadows` 强化）；② 推近速度是否均匀（忽快忽慢=重生成，恐怖推近必须匀速）；③ 透视消失点稳定不漂移；④ 剪影轮廓"可察觉但不可读"——太清=剧透，太糊=观众没看见（衔接 174 质检）。

### 镜头 B：门缝阴影（Door Crack / Occlusion）

- **画面构成**：前景门框/门缝构成遮挡框架，门缝里露出一条窄光带；阴影中有人形轮廓缓慢移过门缝，或门缝宽度自己变大了一点（异常）。遮挡制造"窥视"结构：观众和角色一样只能看到一条缝，恐惧来自缝外的未知（衔接 402 遮挡 reveal、274 威胁藏露）。《驱魔人 III》医院走廊是"分层藏威胁"的范例：长静态镜头催眠观众，威胁从完全预料不到的层次爆发（Raindance 拆解）。
- **AI 提示词（中）**：`门缝视角：前景门框压住画幅两侧，门缝中透出一条冷光带；光带中一个高大人形剪影缓缓横移而过，脚步无声；剪影边缘在光中微微发亮，其余全部隐入黑暗；镜头纹丝不动，门缝宽度保持不变，no face, silhouette only`
- **AI 提示词（英）**：`POV through a narrow door crack, door frame filling the frame edges, a thin band of cold light through the gap; a tall human silhouette slowly passes across the light band, silent steps, rim-lit edges, everything else in darkness; absolutely static camera, crack width unchanged, no face, silhouette only`
- **生成后检查**：① 剪影移动方向与前后镜空间关系一致（左→右穿过后，下一镜威胁应在右侧）；② 剪影速度"慢到可疑"（过快=失去压迫感）；③ 门缝比例保持"窥视"尺度（太宽失去限制感）；④ 剪影不意外显形（AI 补全面部细节=剧透，重生成）。

### 镜头 C：镜面反射（Mirror Reflection）

- **画面构成**：角色在镜前，镜中先出现异常：身后的门在镜中缓缓打开、或镜中多出一个静止的人影——**倒影先于本体，是 reveal 的标准节奏**（衔接 402 镜面、289 揭示设计）。注意：经典的"关柜门镜后出现怪物"（mirror scare）已被用成梗，连超剪都出了（The Verge 拆解），所以镜面镜头要走**反常**路线：倒影与本体不同步、镜中空间与真实空间不一致（镜中门开着、现实中关着）。
- **AI 提示词（中）**：`浴室镜前：角色低头洗脸，镜中倒影却抬着头；镜头慢慢移近镜子，镜中背景的门正在无声打开，而角色身后的真实空间里门纹丝不动；镜面有水汽，倒影边缘微虚，冷色光，no jump, no sudden movement`
- **AI 提示词（英）**：`bathroom mirror: character washing their face, but the reflection looks up first; camera slowly moves toward the mirror, the door behind the reflection silently opening while the real door behind the character stays shut; steamy glass, soft reflection edges, cold tones, no jump, no sudden movement`
- **生成后检查**：① 倒影与本体动作关系（AI 头号缺陷是倒影乱动/错位——逐帧核对，或干脆让本体静止只让倒影动）；② "镜中门开/现实门关"的反常是否被 AI 自动"纠正"成一致（这是该镜头的灵魂，若被纠正需强化 `the real door remains closed`）；③ 镜面出现有空间逻辑（房间里有镜子才能用）。

### 镜头 D：虚化背景的威胁（Threat in the Blurred Background）

- **画面构成**：浅景深，焦点锁定在角色或前景物上；背景焦外虚化层中，一个轮廓**悄然出现或缓慢移动**。观众注意力被清晰层锁死，威胁藏在焦外——察觉的延迟本身就是恐惧（衔接 176 景深、116 图生深度控制）。威胁在焦外"不动"比"移动"更可怕：观众无法确认那到底是人还是衣架。
- **AI 提示词（中）**：`浅景深特写：焦点在角色的脸上，背景走廊完全虚化成色块；虚化背景深处有一个静止的人形轮廓，轮廓比周围背景略微清晰一点点；角色没有察觉，视线看向别处；镜头缓慢横移，轮廓保持在焦外，out of focus, barely discernible figure`
- **AI 提示词（英）**：`shallow depth of field close-up, focus locked on the character's face, background corridor dissolved into bokeh; deep in the blur a motionless human-shaped figure, slightly less blurred than the rest of the background; character unaware, looking away; slow lateral move keeps the figure out of focus, barely discernible, ambiguous whether it is a person or a coat rack`
- **生成后检查**：① 焦外轮廓"可察觉但不可读"——太清=剧透，太糊=观众根本没看见；② 轮廓是否保持静止且不与背景融合成噪块；③ 焦点转移时（若设计为移焦揭示）轮廓的清晰度提升要与情节同步（衔接 116 图生深度控制：焦外信息由景深层控制）。

### 镜头 E：突然特写——jump scare 触发帧（Sudden Close-Up / Trigger Frame）

- **画面构成**：触发帧的构成原则是**"从低能量到高能量"**：前一镜静态、昏暗、平静（《驱魔人 III》医院走廊的长静态镜头，Raindance 拆解），随后威胁大特写**在 1-3 帧内占满画幅**（脸/手/眼睛扑向镜头）——画幅瞬间被占满+后期 stinger 音效=完整的惊吓触发（衔接 127 剪辑节奏）。《潜伏》的红脸恶魔、《惊魂记》地下室揭示都是触发帧的经典形态（Final Draft、The Verge 拆解）。
- **AI 提示词（中）**：`突然的极近特写：一张苍白的脸从黑暗中扑向镜头，眼睛大睁，嘴微张，画幅在瞬间被脸完全占满；面部被单侧冷光照亮，其余全黑；前一帧还是空走廊，这一帧直接贴脸，hard cut, lunge toward camera, frame-filling face`
- **AI 提示词（英）**：`sudden extreme close-up: a pale face lunging from darkness toward the lens, wide eyes, mouth slightly open, the face filling the entire frame in an instant; one cold side light on the face, everything else black; the previous frame is an empty corridor, this frame is the face, hard cut, frame-filling, aggressive`
- **生成后检查**：① 触发速度：脸占满画幅是否在 1-3 帧内完成（AI 常生成"慢慢靠近"——那不是惊吓，是预告；必要时缩短素材或后期快放）；② 人脸畸变零容忍（AI 特写脸常五官错位——衔接 118 缺陷修复，或缩短生成时长到 2 秒内）；③ 与前一镜的光线/色彩连续性（突然的光线断裂会让触发"穿帮"而不是"吓人"）。

### 镜头 F：喘息空间静帧（Breathing Room / Still Frame）

- **画面构成**：惊吓后接一个"什么都没发生"的长静帧：空房间、安静走廊、角色松一口气。功能有二：释放已积累的肾上腺素（情绪曲线的释放点），同时成为下一次惊吓的**铺垫起点**（The Verge 拆解《猛鬼街》Tina 场景：声音停止、她以为安全了、观众放松——弗莱迪就在此刻出手）。库布里克式"停留过久"的静止本身会重新制造不安：画面不动，观众开始想象（Raindance 拆解《闪灵》静止长镜）。
- **AI 提示词（中）**：`静止广角：空荡的房间，窗外的雨声氛围；角色坐在画面一角，肩膀缓缓起伏，呼吸逐渐平复；镜头完全静止，画面内没有任何运动，保持 6 秒以上；光线昏暗但无阴影中的细节，stillness, no movement, long static hold`
- **AI 提示词（英）**：`static wide shot: an empty room with rain outside the window; the character sits in one corner, shoulders slowly rising and falling as breath steadies; absolutely no camera movement, nothing moving in frame, hold for 6+ seconds; dim light, no detail in the shadows, oppressive quiet`
- **生成后检查**：① 是否真的静止（AI 会不自觉加入无意义微动/窗帘飘动——静止是这个镜头的全部意义，生成后逐帧抽查，必要时后期做静帧处理）；② 角色呼吸起伏是唯一的运动（幅度合理）；③ 时长由剪辑端控制（3-6 秒，视上一拍惊吓强度而定，衔接 158 情绪曲线）。

### 镜头 G：威胁 POV（Threat / Victim POV）

- **画面构成**：第一人称视角把观众"放进"角色位置。两种用法：受害者 POV（看黑暗中的门/床底，视线受限=无助）与怪物 POV（观众成为威胁，穿过走廊接近猎物）。《月光光心慌慌》开场即用一镜到底的稳定器 POV 把观众置于杀手眼中，观众被迫"亲身"经历犯罪（Raindance 拆解）。怪物 POV 宜慢不宜快——缓慢接近比冲刺更令人不安。
- **AI 提示词（中）**：`第一人称视角：镜头贴着走廊地面高度缓慢前进，画面边缘有轻微的呼吸起伏；前方房间门半开，门内一片漆黑；镜头没有目标性地缓缓扫过墙上的家庭照片，最后停在门缝前，缓缓靠近；脚步声在画外，slow first-person creep, breathing handheld, door ajar at the end`
- **AI 提示词（英）**：`first-person POV: camera creeping forward at low height, subtle breathing sway at frame edges; a half-open door ahead with pure darkness inside; the view drifts past family photos on the wall without intent, then locks onto the door gap and slowly approaches; off-screen footsteps, slow stalking pace, dread`
- **生成后检查**：① POV 视线方向与前后镜匹配（衔接 102 视线匹配）；② 移动速度符合"缓慢逼近"（AI 默认移动偏快——提示词写 `slow` 并缩短单镜时长）；③ 呼吸感适度（过度晃动=眩晕，衔接 361 手持伦理）；④ 与受害者反应镜头的接续关系明确（谁在看、看到什么）。

## 制造恐惧的镜头手段（五件套）

恐惧不靠单一镜头，靠**手段的组合拳**（衔接 274 悬念视听：威胁藏露、静默前兆；37 恐怖视觉：恐怖类型镜头库）：

| 手段 | 原理 | 镜头惯例佐证 | AI 提示词要点 | 检查点 |
|---|---|---|---|---|
| **信息缺失（藏）** | 威胁不露全貌，只给剪影/局部/声音，观众脑补比画面更可怕 | 低照度把大部分画面藏进阴影，突然照亮=惊吓 reveal（Raindance 拆解《招魂》）；《闪灵》慢燃烧不靠廉价惊吓（PopHorror） | `silhouette only, no facial detail, source never revealed, underexposed` | 暗部纯度：AI 常意外补亮暗部细节=剧透（衔接 236 明暗对照） |
| **景深聚焦（锁）** | 焦点=注意力：清晰层锁死观众视线，焦外藏威胁，移焦=注意力转移 | 镜头 A/D 的焦内-焦外分工（本页镜头 D） | `shallow depth of field, only X in focus, threat in the bokeh` | 焦外威胁可察觉但不可读；移焦时机与情节同步（衔接 116 图生深度控制） |
| **突然运动（爆）** | 从静止画面中突然出现的运动=最强触发；静态前置是惊吓的引信 | 《驱魔人 III》长静态镜头后的突发（Raindance） | `static, absolutely still` 前置 + `sudden lunge` 触发帧分开生成 | 触发帧占满画幅的速度（1-3 帧）；前置镜真的静止 |
| **声音反差（惊）** | 静默→巨响触发惊跳反射（startle response）；"猫吓"（cat scare）用无害声源制造假警报 | 卢米埃尔《火车进站》→《豹族》公交车气刹"Lewton Bus"确立了"紧张积累→突然打破"的公式（Final Draft、Raindance 拆解）；恐怖配乐的静默本身即恐惧（衔接 356 音频张力设计） | 画面提示词写 `dead silence` 预留反差；stinger 由后期音效实现 | 画面静默与音效爆点的剪辑点对齐（衔接 372 音频叙事和谐） |
| **喘息节奏（蓄）** | 张力-释放循环：惊吓不能连发，每次惊吓前必须有蓄力和假安全 | 《猛鬼街》Tina：危险消散→观众放松→弗莱迪出手（The Verge 拆解） | 节拍表第 6 拍 `long hold, relief` 不可省略 | 释放时长与上一拍惊吓强度匹配（衔接 158 情绪曲线） |

**DirectorX 纪律**：恐怖提示词的否定式约束是**第一类公民**——`no detail in shadow`、`never fully visible`、`absolutely still` 与描述画面本身的词同等重要。AI 默认"补全一切、动起来"，你不写"不要什么"，它就会替你剧透（衔接 115 提示词工程、174 质检）。

## 突然惊吓（Jump Scare）的设计原则

Jump scare 是"惊吓预算"，全片 3-5 次为上限，每次都要花在结构性节骨眼上。设计遵循五条原则（衔接 268 悬念理论：悬念与惊奇的差别；289 揭示设计：种植—兑现）：

### 1. 三幕结构：铺垫（Pledge）→ 误导（Turn）→ 触发（Prestige）

《罪恶之源》编剧 C. Robert Cargill 把好 jump scare 比作魔术（《致命魔术》式的三幕）：**铺垫**=角色进入危险在场的情境（听到厨房有响动）；**误导**=找到一个合理解释或威胁暂时移除，一切似乎没事，观众放下防备；**触发**=在观众放松的瞬间，真正的惊吓到来（The Verge 拆解）。《猛鬼街》Tina 场景即教科书：恐惧累积到顶点后危险消散、噪音停止——观众以为安全——弗莱迪出手（The Verge）。

- **AI 实现**：三幕分三条素材生成：铺垫镜（安静、静态）、误导镜（威胁离场/解释合理、放松）、触发镜（静态前置+瞬间占满）。**触发镜与铺垫镜分开生成**，不要指望一条素材里自然发生"安静→爆发"（AI 会平均化，两条都做不好）。

### 2. 误导是核心（Misdirection First）

"一个好的 jump scare 是一个魔术：让你看这边，我在这边动手"（Cargill，The Verge 引）。《招魂》的"hide and clap"（躲藏拍掌）是近年最被拆解的误导范例：卡罗琳在地下室搜索时，观众与角色都被引导盯着前方——威胁却从背后响起（CBR 拆解）。观众预期被明确导向 A 方向，惊吓从 B 方向来。

- **AI 实现**：提示词里显式写出"观众的注意力应该在哪"——`character's attention fixed on the closet`——再让威胁在另一层/另一方向出现（衔接 216 构图、246 构图心理：视线引导即注意力引导）。

### 3. 惊吓必须有结构性后果

jump scare 不只是"吓一跳"，它必须改变角色的处境或揭示新信息。《异形》通风管场景：达拉斯在管道中被异形伏击——惊吓的瞬间观众意识到"异形比想象中聪明、队伍失去了领袖、逃生计划破产"（Final Draft 拆解）。如果这场惊吓删掉后剧情毫无变化，它就是"便宜货"，该剪（Final Draft 框架第 6 条）。

- **AI 实现**：生成前问"这个惊吓改变了什么"，答不上来就删。惊吓后的下一镜必须是"新处境"的反应（损失、发现、被迫改变路线），而不是回到惊吓前。

### 4. 静态前置 + 声音触发（静态越久，触发越响）

《驱魔人 III》医院走廊：长静态镜头近乎催眠，突发因此加倍震撼（Raindance 拆解）。jump scare 的冲击力 = 触发瞬间与前一瞬间的能量差。声音端同理：静默→stinger（尖锐音效/音乐打击）触发惊跳反射（衔接 356 音频张力设计）；"Lewton Bus"（《豹族》1942 公交车气刹）证明了"无害声源突然打破紧张"也能吓人——这是猫吓（cat scare）的起源，也是**假警报机制**：先消耗一次假惊吓，真惊吓更有效（Raindance、Final Draft 拆解）。

- **AI 实现**：视频模型生成的素材无声音——stinger 是后期装配层（衔接 372 音频叙事和谐）。生成时只负责画面侧：前置镜 `absolutely still`，触发帧 `frame-filling lunge in 1-3 frames`，剪辑时在触发帧首帧叠 stinger。

### 5. 反套路与预算纪律（别用烂梗）

- **镜子惊吓已死**：开柜门镜后出现怪物的梗被用成 meme 甚至有了超剪（The Verge 拆解）——再用必须反转（本页镜头 C 的反常设计）。
- **脱敏是累积的**：80 年代恐怖片把 jump scare 用到观众"等着被吓"而不是"被吓到"（The Verge 拆解）。全片惊吓要数得过来，且每次都要换花样（方向/层次/触发方式），不能同一个公式重复。
- **角色先于惊吓**：最好的恐怖片"共同点是都有出色的角色"（Cargill，The Verge 引）——观众越在乎角色，惊吓越有效。纯惊吓装置没有情感重量。

## 常见错误表

| # | 错误 | 后果 | 正确做法（AI 版） |
|---|---|---|---|
| 1 | 威胁全程拍清楚 | 只有恶心没有恐惧 | 信息缺失：剪影/局部/焦外/暗部，逐步揭示（衔接 274 威胁藏露） |
| 2 | jump scare 无铺垫直给 | 廉价、无效果 | 铺垫-误导-触发三幕分开生成，静态前置 |
| 3 | 惊吓连发 | 观众脱敏，之后全不灵 | 惊吓预算 3-5 次；节拍表必须含喘息拍（衔接 158 情绪曲线） |
| 4 | AI 把暗部意外补亮 | 剧透、恐惧泄气 | 提示词写 `no detail in shadows, underexposed`，生成后逐帧查暗部纯度（衔接 236 明暗对照） |
| 5 | 全程手持乱晃 | 观众眩晕，惊吓无反差 | 大部分时间静止/慢推，只在触发瞬间动；晃动要有方向（衔接 361 手持伦理） |
| 6 | 焦外威胁太清楚或太糊 | 太清=剧透，太糊=没看见 | 检查"可察觉但不可读"；用景深层控制（衔接 116 图生深度控制） |
| 7 | 镜面倒影乱动/错位 | 出戏，惊吓失效 | 逐帧核对倒影同步；或本体静止只让倒影动（镜头 C） |
| 8 | 音乐铺满全程 | 无反差，惊吓无 stinger 可用 | 静默-巨响交替；恐怖片沉默是武器（衔接 356 音频张力设计） |
| 9 | 角色无目标无赌注 | 死伤无感，惊吓纯噪音 | 惊吓要有结构性后果（异形通风管范式，Final Draft） |
| 10 | 一条素材塞两个惊吓 | AI 物理崩坏+节奏全乱 | 单镜头单惊吓；触发帧独立生成 2-3 秒短素材（衔接 97 分段生成、118 缺陷修复） |
| 11 | 惊吓后立即切走 | 情绪不落地，恐惧变闹剧 | 收尾留白长静帧，环境声填满（节拍第 8 拍） |
| 12 | 沿用镜吓等烂梗 | 观众免疫，甚至发笑 | 反转公式：倒影与本体不同步、误导方向反转（The Verge 超剪教训） |
| 13 | 同一惊吓公式重复三次 | 第二次就开始失效 | 每次换触发维度：方向/画幅层次/音效类型/铺垫长度 |

## 工作流应用（AI 编排：节拍表 → 逐镜生成 → 惊吓装配）

DirectorX 恐怖场景的标准 AI 生产管线：

```text
① 定节拍表（8 拍弧线，本页第 2 节），标出惊吓点位置与惊吓预算（全片 3-5 次）
② 建信息差矩阵：每个节拍列出 观众知道 / 角色知道 / 画面给什么 / 画面扣什么
   （威胁藏到什么程度、何时第一次露轮廓、何时露全貌——衔接 274、289）
③ 定光色基调：低照度/冷色/单一光源，统一全场景（衔接 236 明暗对照、237 色彩符号、93 光线叙事）
④ 逐镜生成（每镜三步）：
   - 关键帧图生：锁定构图/光线/道具状态（衔接 116 图生深度控制、407 参考图首尾帧）
   - 视频生成：只描述运动（匀速推近/静止/触发帧的突然占满）
   - 生成后检查：对照每镜检查点；不合格走最小重生成（衔接 118 缺陷修复、174 质检）
⑤ 惊吓装配（剪辑层）：
   - 静态前置镜 → 触发帧 → 在触发帧首帧叠 stinger 音效
   - 静默-巨响交替；惊吓前后留 0.5-1 秒死寂（衔接 127 剪辑节奏、356 音频张力设计）
⑥ 跨镜一致性：同一场景统一描述模板（光色/道具/角色），惊吓点人物用参考图锚定
   （衔接 117 一致性全体系、408 多镜一致性、123 长视频一致）
```

**三个关键纪律**：

1. **恐怖片是"减法"类型**：提示词里写"不要"的分量与写"要"的相当——`no detail in shadow`、`never fully visible`、`absolutely still`、`no sudden movement until the trigger`。AI 的默认值是"拍清楚、动起来"，你的工作就是逆着默认值写（衔接 115 提示词工程）。
2. **触发帧单独生成**：jump scare 触发帧是 2-3 秒的独立短素材（"威胁扑向镜头"），与铺垫镜分开生成、分开质检。把触发帧并进长素材=AI 会把爆发平均化，惊吓变预告（衔接 118 缺陷修复：缺陷隔离、最小重生成）。
3. **声音是惊吓的一半**：AI 视频素材无声，音效/音乐全部后期装配。恐怖片的静默、低音铺垫、stinger 是与画面等权的设计层——画面生成时就为声音留出"反差位"（静默前置镜），装配时才能触发惊跳反射（衔接 356 音频张力设计、372 音频叙事和谐）。

**完整提示词模板（可复用）**：

```text
[场景] dark house at night, single source of dim light, heavy shadows
[信息控制] threat only as silhouette / in bokeh / off-screen; no facial detail;
           underexposed far end, no detail in shadows
[镜头] slow steady push-in / absolutely static / sudden frame-filling lunge (trigger only)
[运动] one movement per shot; stillness before the trigger; no idle motion
[情绪] dread, oppressive quiet, anticipation
[镜头参数] 35mm, shallow depth of field, low-key lighting, cold color grade
[声音预留] dead silence before stinger (added in post)
```

**DirectorX 纪律**：恐怖场景的每个镜头都要能回答"这个镜头在藏什么、在给什么、在蓄什么力"——三个都答不上来的镜头是废镜。惊吓点必须数得出来、每个都要有结构性后果、每个都要换公式；其余镜头全部服务于"让下一次惊吓更响"。

## 术语表（中英对照）

| 中文 | English | 画面里是什么 |
|---|---|---|
| 预期恐惧 | Anticipation / Dread | 观众知道危险存在但不知何时何地，靠延长时间加压 |
| 突然惊吓 | Jump Scare / Startle | 声音+画面突变触发的生理惊跳反射 |
| 心理不安 | Psychological Unease | 事后发酵的认知层恐惧，来自留白与反常细节 |
| 惊吓预算 | Scare Budget | 全片 jump scare 的次数配额（3-5 次），不可超支 |
| 铺垫-误导-触发 | Pledge / Turn / Prestige | jump scare 三幕：危险在场→合理解释→真惊吓 |
| 误导 | Misdirection | 把注意力引向 A，惊吓从 B 来（魔术原理） |
| 静态前置 | Stillness Before the Trigger | 触发前镜头静止，制造能量差 |
| 触发帧 | Trigger Frame | 威胁瞬间占满画幅的那 1-3 帧 |
| 猫吓 | Cat Scare | 无害声源/物体制造的假警报 |
| 惊跳反射 | Startle Response | 静默→巨响触发的生理反射机制 |
| Lewton Bus | Lewton Bus | 《豹族》公交车气刹：紧张积累后突然打破的公式 |
| 画外威胁 | Off-Screen Threat | 威胁只存在于画外空间/声音，不入画 |
| 信息缺失 | Information Withholding | 只给剪影/局部/焦外，观众脑补威胁 |
| 喘息拍 | Breathing Room | 惊吓后的长静帧，释放与再蓄力 |
| 焦外威胁 | Threat in Bokeh | 威胁藏在虚化背景层，察觉延迟=恐惧 |

## 来源

- The Verge — 'Why won't you die?!' The art of the jump scare（jump scare 三幕结构、误导原理、80 年代滥用教训、镜子惊吓超剪）：https://www.theverge.com/2012/10/31/3574592/art-of-the-jump-scare-horror-movies
- Final Draft — Scare Smart: When and How to Use Jump Scares Like a Pro（惊吓定义、卢米埃尔《火车进站》、Lewton Bus、《异形》通风管场景、六步框架）：https://www.finaldraft.com/blog/scare-smart-when-and-how-to-use-jump-scares-like-a-pro
- Raindance — Crafting Fear: Filming Techniques to Evoke Emotion in Horror Movies（低照度、荷兰角、手持与静止、POV、《驱魔人 III》走廊、分层藏威胁、猫吓）：https://raindance.org/crafting-fear-filming-techniques-to-evoke-emotion-in-horror-movies/
- CBR — The Conjuring Revolutionized the Art of the Scare With Misdirection（《招魂》误导式惊吓拆解）：https://www.cbr.com/the-conjuring-revolutionized-art-of-scare/
- PopHorror — Inside 'THE SHINING' (1980): Mazes of Madness and the Slow Burn of a Horror Classic（《闪灵》慢燃烧、心理恐怖）：https://pophorror.com/inside-the-shining-1980-mazes-of-madness-and-the-slow-burn-of-a-horror-classic/
- Slate — The Science That Can Help You Tolerate the Worst Part of Horror Movies（Robert Baird 惊吓研究，经 Final Draft 转引）：https://slate.com/culture/2021/10/how-jump-scares-work-and-how-to-tolerate-them.html
- Wikipedia — Jump scare：https://en.wikipedia.org/wiki/Jump_scare

## 相关概念

- [恐怖/悬疑视觉语言（Horror & Suspense Visual Language）](../37-genre-horror-suspense/horror-suspense.md)
- [电影悬念视听语言（Suspense Visual Language — Cinematography, Sound & Timing of Tension）](../274-suspense-visual-language/suspense-visual-language.md)
- [电影叙事悬念理论（Suspense Theory — Hitchcock's Suspense vs Surprise & Dramatic Irony）](../268-suspense-theory/suspense-theory.md)
- [AI 图片明暗对照叙事（Chiaroscuro — Dramatic Light-Shadow & Tenebrism）](../236-chiaroscuro-light/chiaroscuro-light.md)
- [光线叙事（Lighting as Narrative）](../93-lighting-narrative/lighting-narrative.md)
