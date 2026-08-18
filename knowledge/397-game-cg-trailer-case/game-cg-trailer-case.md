---
type: Case
title: "游戏 CG 预告片逐镜案例拆解（Game CG Trailer — Shot-by-Shot Case Studies）"
description: "3 部 2025-2026 游戏 CG 预告逐镜拆解：《黑神话：钟馗》首曝 CG、The Witcher IV「The Duel」、KCD II「Live a Life Medieval」——钩子结构、镜头语言、动捕/渲染幕后与播放数据，提炼可复用的游戏 CG 预告片套路并映射到 AI 生成工作流"
tags:
  - "synthesis"
  - "camera"
  - "workflow"
  - "trailer"
status: stable
stale_after: "2027-08-18"
generated:
  by: "process:directorx-knowledge-okf"
  at: "2026-08-18T00:00:00Z"
verified:
  - by: "process:knowledge-audit"
    at: "2026-08-18T00:00:00Z"
sources:
  - resource: "cited:CD PROJEKT RED The Witcher IV Revealed at The Game Awards"
    id: cite-1
    title: "The Witcher IV Revealed at The Game Awards"
    author: "org:CD-PROJEKT-RED"
  - resource: "cited:https://www.cdprojekt.com/en/media/news/the-witcher-iv-revealed-at-the-game-awards/"
    id: cite-2
    title: "https://www.cdprojekt.com/en/media/news/the-witcher-iv-revealed-at-the-game-awards/"
  - resource: "cited:Polygon The Witcher 4 reveal trailer's making-of video explains it all"
    id: cite-3
    title: "The Witcher 4 reveal trailer's making-of video explains it all"
    author: "org:Polygon"
  - resource: "cited:https://www.polygon.com/the-witcher/529842/witcher-4-trailer-behind-scenes/"
    id: cite-4
    title: "https://www.polygon.com/the-witcher/529842/witcher-4-trailer-behind-scenes/"
  - resource: "cited:blackmyth.game 《黑神话：钟馗"
    id: cite-5
    title: "《黑神话：钟馗"
    author: "org:blackmyth.game"
  - resource: "cited:科隆 2025 首曝 CG 多维拼图解析」"
    id: cite-6
    title: "科隆 2025 首曝 CG 多维拼图解析」"
  - resource: "cited:https://blackmyth.game/zh-cn/posts/analysis/trailer-2025-cg-multidim-reading/"
    id: cite-7
    title: "https://blackmyth.game/zh-cn/posts/analysis/trailer-2025-cg-multidim-reading/"
  - resource: "cited:IT之家 发布不到一天，《黑神话：钟馗"
    id: cite-8
    title: "发布不到一天，《黑神话：钟馗"
    author: "org:IT之家"
  - resource: "cited:先导预告B站播放量破千万」"
    id: cite-9
    title: "先导预告B站播放量破千万」"
  - resource: "cited:https://www.ithome.com/0/876/835.htm"
    id: cite-10
    title: "https://www.ithome.com/0/876/835.htm"
dx_id: "397"
related:
  - "22-case-studies/case-studies.md"
  - "89-iconic-moves-deconstruction/iconic-moves-deconstruction.md"
  - "151-game-cinematics/game-cinematics.md"
  - "126-style-art-direction/style-art-direction.md"
---

# 游戏 CG 预告片逐镜案例拆解（Game CG Trailer — Shot-by-Shot Case Studies）

> 本页为 2025-2026 三部游戏 CG 预告片的逐镜拆解：钩子开场、世界观空镜、角色亮相、战斗高潮、反转与结尾 Logo 的镜头语言套路，以及动捕/渲染/合成幕后与播放数据。知识本体来自 2025-2026 案例调研（CD PROJEKT RED、Platige Image、blackmyth.game、GameSpot、Escapist 等）。AI 应用面向 DirectorX：游戏类项目先用这套套路写分镜、再用 AI 生成 CG 风格预告（衔接 22 拉片总纲、89 名场面运镜、151 游戏 CG 与过场、126 风格与艺术方向）。
> 来源：CD PROJEKT RED「The Witcher IV Revealed at The Game Awards」、https://www.cdprojekt.com/en/media/news/the-witcher-iv-revealed-at-the-game-awards/；Polygon「The Witcher 4 reveal trailer's making-of video explains it all」、https://www.polygon.com/the-witcher/529842/witcher-4-trailer-behind-scenes/；blackmyth.game「《黑神话：钟馗》科隆 2025 首曝 CG 多维拼图解析」、https://blackmyth.game/zh-cn/posts/analysis/trailer-2025-cg-multidim-reading/；IT之家「发布不到一天，《黑神话：钟馗》先导预告B站播放量破千万」、https://www.ithome.com/0/876/835.htm；游民星空「全球关注！《黑钟馗》油管播放量破200万」、https://www.gamersky.com/news/202508/2000336.shtml；RPG Site「Kingdom Come: Deliverance II gets an official CGI trailer」、https://www.rpgsite.net/news/16798-kingdom-come-deliverance-ii-preload-date-time-ps5-steam-epic-xbox-official-cgi-trailer；Escapist「Unapologetic honesty: The craft behind the Kingdom Come: Deliverance 2 trailers」、https://www.escapistmagazine.com/kingdom-come-deliverance-2-trailer-interview/；80 Level「The Making Of Kingdom Come: Deliverance II CGI Trailer」、https://80.lv/articles/take-a-behind-the-scenes-look-at-kingdom-come-deliverance-ii-cgi-trailer；Platige「Kingdom Come: Deliverance II Live a Life Medieval - Official CGI Trailer」、https://platige.com/project/game-cinematics/kingdom-come-deliverance-ii-live-a-life-medieval/；GameSpot「The Witcher 4 Director Breaks Down New Trailer Scene-By-Scene」、https://www.gamespot.com/articles/the-witcher-4-director-breaks-down-new-trailer-scene-by-scene/1100-6528474/；Gematsu「Kingdom Come: Deliverance II sales top one million in 24 hours」、https://www.gematsu.com/2025/02/kingdom-come-deliverance-ii-sales-top-one-million-in-24-hours；GamesRadar「GTA 6 trailer 2 has broken YouTube」、https://www.gamesradar.com/games/grand-theft-auto/with-19-million-views-312k-comments-and-3-million-likes-in-4-hours-i-think-its-safe-to-say-gta-6-trailer-2-has-broken-youtube/。

## 概述

**核心断言**：游戏 CG 预告片是有固定套路的高度工程化物料——**钩子开场 → 世界观空镜 → 角色亮相 → 战斗/高潮 → 反转钩子 → 结尾 Logo**，配乐与剪辑严格卡点，幕后普遍走「静帧分镜（Stillomatic）→ 预演（Previz）→ 动捕/表演捕捉 → 引擎渲染 → 合成调色」管线。三条 2025-2026 案例分别覆盖三种打法：**文化考据流**（《黑神话：钟馗》，UE5 引擎内 CG，一镜到底观感）、**电影化叙事流**（The Witcher IV「The Duel」，6 分钟短片式预告）、**30 秒情绪流**（KCD II「Live a Life Medieval」，快节奏广告式 CG）。它们的播放数据说明：短预告（≤2 分钟）在社交平台传播最快，但品牌大作能用 6 分钟长片建立世界观深度（衔接 151 游戏 CG 与过场、22 拉片总纲）。

## 案例拆解

### 案例一：《黑神话：钟馗》首曝 CG 先导预告（2025）

- **背景与表现**：游戏科学（Game Science）《黑神话》系列第二作《黑神话：钟馗》首支 CG 先导预告，2025 年 8 月 20 日凌晨在 2025 科隆游戏展开幕夜（Opening Night Live）全球首曝并同步上线 B 站。官方披露：超 200 万玩家在 B 站通宵观看科隆展开幕夜直播；**预告上线 8 小时 B 站播放量破 700 万，不到一天破 1000 万、登顶全站排行榜第一**（IT之家）。国际侧：IGN 官方 YouTube 频道版本截至发稿已 **450 万+ 播放**（1:56 时长，2026-08 数据）；2025-08-22 游民星空报道其在 IGN 频道的播放量约 207 万，超过《生化危机 9：安魂曲》《空洞骑士：丝之歌》等欧美日大作同期预告。作品以中国民间传说「钟馗」为创意来源，PC/PS5/XSX，发售日待定，官方明示**尚处早期开发、无实机内容**——纯靠一条 CG 建立期待。
- **逐镜拆解**（全片约 1 分 56 秒；时点为约数场景锚点，依据官方封面帧与 B 站电影制作人逐帧拉片 BV1bfvczsEG9 划分）：
  - **约 0:00-0:15 开场钩子（喜剧反差）**：两名男子瘫倒/趴在巨大的黑色丘状物上（官方封面帧画面），夜境。两人插科打诨（官方英文字幕：「Brother, help me out… Look at that belly of yours. Where's the mountain?」），语气轻松——观众以为在看一出市井喜剧，为后面的「阴司」基调制造反差。
  - **约 0:15-0:35 戏台与观众（景深虚实分层）**：戏台上演员清晰、台下观众虚化，但虚化里不断浮现非人形轮廓——用景深把「演故事的」和「看故事的鬼魅」分进两个本体层；对应《周礼·方相氏》「蒙熊皮、黄金四目」傩仪传统到《东京梦华录》除夕大傩仪「装钟馗」的「演鬼以驱鬼」源流。
  - **约 0:35-0:55 门、门槛、门缝（构图定位角色）**：全片最高频物件是门——门框、门槛、门缝、半开的门、门后影子；钟馗反复处于「门外」，是站在屋外、随时介入屋内糊涂账的判官（配诗：「门内一滩子糊涂账，门外哪个喊青天？」）。烛火、灯笼、鬼火、灶火为主光源，色温集中 2200K 偏红、阴影衰减极陡，Lumen 多点动态光源同时在线。
  - **约 0:55-1:10 扇换剑（stance shift 剪辑节奏）**：钟馗手中折扇在台词「提剑也，提剑也，要把这清浊辨」命中位置化作长剑，手部、姿态、衣物运动延续——观众接收到的是「同一个人换了身份」（持扇文人 → 提剑判官），而不是「切到下一镜」。
  - **约 1:10-1:30 骑虎跟拍仰角（图像转电影）**：低位仰角跟拍骑虎钟馗，把明代以来民间画作里「威而不怒」的骑虎像第一次做出运动感；身旁二鬼随侍（「以鬼治鬼」伦理的具象化）。全片视点在戏台、台下、门内、门外、骑虎之间流畅串联，呈**一镜到底观感**——第三方逐帧拉片认为视听层面成立，帧级是否存在用运动模糊、遮挡物穿越、相机重定位完成的隐藏剪辑，官方未明说。
  - **约 1:30-1:56 收尾**：红字题字标志（封面左上角）+ 片名落版；配诗首句「世上何尝有鬼？妖魔皆从心生」在唐传奇以来志怪传统里逐字可考。
- **AI 技术点**：UE5 引擎内 CG（Lumen 全局光照 + Nanite 高几何 + Chaos Cloth 布料解算）；钟馗「重甲 + 红须 + 官袍」的组合把布料次级动力学和重甲关节响应做到可见性能消耗；「一镜到底」观感依赖运动模糊/遮挡物穿越等隐藏剪辑工艺（衔接 89 名场面运镜、110 VFX 管线）。
- **可复用要点**：用「喜剧开场 → 民俗考据密度 → 身份转换镜头 → 神性亮相」四段式；美术基调定调句「《悟空》是天地间一根斗杠，《钟馗》是阴阳间一把判尺」——预告先立调性再叙事；**没有实机内容也能靠 CG + 文化母题制造传播事件**。

### 案例二：The Witcher IV — Cinematic Reveal Trailer「The Duel」（2024）

- **背景与表现**：CD PROJEKT RED《巫师》新三部曲首作首曝预告，2024 年 12 月 12 日 The Game Awards 2024 全球首映（TGA 2024 直播创观看纪录，峰值约 400 万同时观看，GameRant 报道），12 月 13 日上线 YouTube（The Witcher 官方频道）。**时长 6:03，截至 2026-08 播放量 560 万+**。预告由 CD PROJEKT RED 与 Platige Image 合作制作（Platige 曾负责巫师系列前作过场），**在定制版 Unreal Engine 5 上、用游戏内资产预渲染**，运行于一款未公布的 NVIDIA GeForce RTX GPU——官方强调「预告即游戏技术栈的真实展示」。导演 Sebastian Kalemba 事后做了一段约 8 分钟的逐场拆解视频（首映次日发布）；2025 年 2 月 26 日又发布约 10.5 分钟的幕后制作视频（Polygon 报道）。
- **逐镜拆解**（全片 6:03；时点为约数场景锚点，依据官方逐场拆解视频与台词顺序划分）：
  - **约 0:00-0:30 悬念开场（父女道别）**：北方偏远村庄 Stromford，夜雾。长者对女儿 Mioni 说「Dearest daughter… today's the day ye fill out yer destiny」——观众不知道「destiny」是什么，悬念即钩子；片头字卡「CD PROJEKT RED PRESENTS」。运镜以手持感虚拟摄影机为主（幕后视频专门讲了 handheld vs 吊臂/轨道的虚拟摄影机动画）。
  - **约 0:30-1:30 献祭仪式（世界观空镜）**：村民火把列队送别 Mioni 走向树林祭坛，「Forgive me, daughter… 'Twere my only choice… I shall be the bringer of salvation」——仪式感 + 东欧民间传说气息；雨雾、泥泞、火光的低照度环境建立「该地不靠猎魔人、靠活人献祭」的世界观（导演拆解：Stromford 是「北方孤村」，世代被要求活祭的怪物恐吓）。
  - **约 1:30-2:30 角色亮相（Ciri 介入冲突）**：Ciri 以猎魔人身份登场，村民惊呼「A witcher! Whose coin did ye take?」；正反打冲突，Ciri 反驳村民「Nay… 'tis tradition! Chosen, she is, by the gods!」→「No! You chose her.」——亮相即表态，主角立场 3 秒立住；镜头给出 Ciri 的锁链与法印新能力（CDPR 官方确认）。
  - **约 2:30-3:30 送走 Mioni（节奏松弛）**：「Back to the village. Go. Now.」「Save yourself! Run! To shelter! To your father! Run!」——跟拍 + 手持抖动，情绪从对峙转为保护；村民阻拦与迷信台词穿插（「Away wit' ye. 'Fore yer meddlin' kills us all.」「One of us is chosen. Anointed. The ritual works!」）。
  - **约 3:30-5:20 战斗高潮（Bauk 之战）**：Mioni 唱歌召唤怪物（Ciri 有意以她为饵，导演拆解确认），怪物 Bauk 现身——**哥布林头、蛇颈、美洲豹臂、蝎子钳、恐龙后肢**的缝合怪（Polygon 描述）；战斗段含慢动作、特写、Ciri 锁链技与法印、怪物肢体攻击；幕后：动捕团队用**四名操作员 + 实体道具重现 Bauk 的肩部与攻击手臂**，实时驱动虚拟怪物（动捕师 Maciej Kwiatkowski / Alpha 7）。
  - **约 5:20-5:50 反转（牺牲叙事）**：Ciri 打赢后回到村庄，发现 Mioni **已被村民杀害**——导演拆解确认 Ciri 并不愿赌上 Mioni 的命（先送她回村），并暗示存在「能救下 Mioni」的选择分支；情感反转让 6 分钟预告有了真正的故事落点。
  - **约 5:50-6:03 结尾钩子**：Ciri 收剑，台词「Gods? There are no gods here… There are only monsters.」+ 标题「The Witcher IV」+ 官网落版。一句台词完成主题（「怪物以多种形态存在」，CDPR 官方文案）。
- **AI 技术点**：全程动捕/表演捕捉 + 定制 UE5 预渲染；**三天实拍测试镜头（lens test）**采集畸变、镜头光晕、辉光、焦外虚化（bokeh）行为，数字摄影指导 Karol Stadnik 与 Platige 艺术家据此在 UE5 里复刻真实镜头光学——「CG 要像实拍」的工艺路径；虚拟摄影机分层（手持感 vs 轨道感）（衔接 89 名场面运镜、116 图生深度控制）。
- **可复用要点**：用「悬念开场 + 世界观空镜 + 角色亮相即表态 + 战斗高潮 + 反转 + 一句台词收主题」做 6 分钟短片式预告；**预告即实机技术展示**（游戏资产 + 游戏引擎预渲染）建立「所见即所得」信任；反转（拯救失败）比爽文结局更有传播记忆点。

### 案例三：Kingdom Come: Deliverance II「Live a Life Medieval」（2025）

- **背景与表现**：Warhorse Studios《天国：拯救 2》官方 CG 预告，2025 年 1 月 28 日随预载信息发布，**时长 41 秒（通稿称 30 秒广告片）**，由 Platige Image 制作（导演 Jakub Jabłoński，CG 总监 Rafał Kidziński，完整幕后名单含 previz/环境/模型/绑定/材质/毛发/动画/CFX 各团队，Platige 项目页）。Warhorse 官方频道播放量 **150 万+**（2026-08 数据）。游戏 2025 年 2 月 4 日发售，**首日销量破 100 万份**（Gematsu）——预告为发售周冲刺的关键物料。官方通稿定位：「a tongue-in-cheek glimpse into Henry's exploits」——调皮、幽默、粗粝。
- **逐镜拆解**（全片 41 秒；时点为约数场景锚点，依据 Escapist 编辑访谈与官方通稿划分）：
  - **约 0:00-0:06 开场（轻快反转）**：亨利在酒馆与村姑跳舞，「light, carefree, almost romantic」（剪辑师 Katarzyna Bobel 语）——观众以为要浪漫；配乐为 1970 年代名曲 T.Rex《20th Century Boy》的中世纪翻唱版《15th Century Boy》，第一句歌词即在开场起。
  - **约 0:06-0:09 反转（3 秒立住调性）**：亨利冷不防被一拳打脸、脸朝下摔进泥里——「In just a few seconds, we get the very essence of Kingdom Come. Its spirit, its tone, its unapologetic honesty.」（Bobel 语）。幽默 + 粗粝的「不道歉的诚实」3 秒立住。
  - **约 0:09-0:30 日常蒙太奇（卡点快切）**：喝酒、斗殴、谈情说爱、骑马纵横波西米亚（官方通稿：drinking, brawling, charming his way across Bohemia）；场景与场景之间**无缝融合**（seamless continuous shooting，每个场景平滑过渡到下一个）——剪辑师称「看起来毫不费力，恰恰说明反着来」：大量特技排练、试拍与现场表演，实拍动捕是作品的 backbone；音乐与剪辑严格卡拍，声音设计做「胶水」。
  - **约 0:30-0:41 收尾**：落版标题 + 发售日（2025-02-04）预购引导。BTS 花絮片（同由 Platige 制作、剪辑师 Ola Rosset-Żak）选曲花了一整天，观众留言问「这首歌游戏里有没有」成为选曲成功验证；BTS 里还收录了亨利演员 Tom McKay 未采用的动捕表演，以及「真马走进动捕棚」的名场面。
- **AI 技术点**：Stillomatic（静帧分镜图）→ 动画化的完整管线；表演捕捉 + 特技演员 + 真马入棚；previz 先行（Platige 团队含独立 previz 组）（衔接 151 游戏 CG 与过场）。
- **可复用要点**：**30 秒也能完整走完「钩子-反转-蒙太奇-落版」**；「先立调性再展示内容」的广告式打法（3 秒反转立住 tone）；无缝转场 + 卡点是短 CG 的节奏核心；幽默是历史题材破圈的有效情绪杠杆。

## 方法提炼

**游戏 CG 预告片的标准镜头语言套路**（三案例 + 2025 传播基准归纳）：

```text
① 钩子开场（0-5s）     悬念 / 反差：父亲道别（Witcher）、跳舞挨打（KCD2）、毛贼瘫倒（钟馗）
② 世界观空镜/环境建立   雾夜村庄、烛火夜境、中世纪波西米亚——先立调性再叙事
③ 角色亮相即表态       Ciri 拔剑介入、钟馗骑虎出场——亮相镜头给仰角/特写/台词
④ 战斗/高潮           慢动作 + 特写 + 关键台词卡点（Bauk 战、扇换剑 stance shift）
⑤ 反转/情感钩子        Mioni 之死、挨打吃泥——牺牲/挫败比爽文更有记忆点
⑥ 结尾 Logo           标题字卡 + 发售信息/官网，一句台词收主题
```

- **时长与传播**：三案例对照——钟馗 1:56（B 站 8h 破 700 万、24h 破 1000 万；IGN 频道累计 450 万+）、Witcher 6:03（560 万+）、KCD2 0:41（150 万+）。**≤2 分钟在社交平台完播与增速最优**；6 分钟长片是「品牌大作立世界观」的例外打法，靠 TGA 级直播首映 + 拆解/幕后二次传播消化长片。
- **2025 基准**：GTA VI 第二支预告（2025-05-06 发布，引擎内实机画面，非 CG）发布数小时即 1900 万播放、31.2 万评论、300 万赞，登 YouTube 趋势第一（GamesRadar）——对照说明：**IP 声量是传播第一变量，CG 品质决定口碑与二创素材密度，两者不冲突**。
- **幕后工艺共性**：Stillomatic → Previz → 动捕/表演捕捉（含怪物操控员、真马）→ 引擎渲染 → 合成；**数字摄影指导 + 实拍镜头测试**把真实光学（畸变/光晕/辉光/焦外）复刻进 CG（Witcher 案例）；**文化/民俗细节逐帧可考**（钟馗案例）成为内容资产。
- **声音设计是胶水**：KCD2 剪辑师明确「sound design acts as the glue」；音乐选曲（15th Century Boy）成为预告记忆点并被追问「游戏里有没有」。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 只堆特效、没有叙事钩子 | 观众 3 秒划走，完播率差 | 开场 3-5 秒埋「问号」（悬念或反差） |
| CG 与实机质感脱节 | 发售后被骂「预告欺诈」 | 用游戏内资产 + 游戏引擎预渲染（Witcher 4 做法） |
| 音乐与剪辑两张皮 | 卡点失败、情绪断档 | 先定曲再剪、按拍切镜；选曲多做验证（KCD2 花一整天选曲） |
| 忽视声音设计 | 画面再强也「散」 | 音效/环境声做剪辑胶水，配乐 + 音效统一铺 |
| 硬撑一镜到底 | 穿帮、观感假 | 用遮挡物穿越、运动模糊、相机重定位做隐藏剪辑（钟馗案例工艺） |
| 夜境全黑无层次 | 细节丢失、画面脏 | 多点动态光源 + 高对比色板（钟馗 2200K 烛火、黑红惨白） |
| 文化/民俗细节错 | 考据党出警、口碑反噬 | 道具、建筑、仪礼逐帧可考（钟馗的《周礼》《东京梦华录》底子） |
| 布料/次级动力学偷懒 | 一秒出戏 | 重甲、官袍、须发的布料解算足量投入（Chaos Cloth） |
| 单平台发布 | 传播天花板低 | 大会直播首映 + B 站/YouTube 双轨 + 拆解/幕后二创物料 |

## 工作流应用（AI 映射）

游戏 CG 风格预告的 AI 生成工作流（衔接 117 一致性全体系、126 风格与艺术方向、115 提示词工程）：

```text
套路分镜（①钩子→②空镜→③亮相→④高潮→⑤反转→⑥Logo）
  → 参考锚点：官方截图/概念图做首帧与风格参考（衔接 126/116）
  → 逐镜头生成：镜头提示词（焦距/机位/运动）+ 光线提示词（烛火 2200K、体积雾）
  → 音画层：音乐节拍表先行，按拍切镜（衔接 119 声画协同）
  → 一致性质检：角色/服饰/道具逐帧抽查（衔接 117/110）
  → 交付：多平台规格导出（衔接 68 平台规格总表、112 交付规格）
```

- **「变身镜头」用首尾帧**：钟馗「扇换剑」这类 stance shift 是「同画面内身份转换」——用首尾帧（折扇 → 长剑）+ 提示词锁手部姿态延续即可复刻，比硬切自然（衔接 116 图生深度控制）。
- **镜头运动提示词分层**：手持感（handheld, slight shake）vs 稳定器（gimbal, steady）vs 吊臂（crane up）——Witcher 4 的 virtual camera 语言可以直接写成运动提示词；低位仰角跟拍（low-angle tracking shot）是「神性亮相」的标配（钟馗骑虎）（衔接 89 名场面运镜）。
- **隐藏剪辑**：AI 长镜头生成后用遮挡物穿越 + 运动模糊帧做拼接点，掩盖切点（衔接 89 的 mise-en-trickery 谱系）。
- **音画卡点**：先做 2-3 秒节拍表，把每个镜头长度定为拍数的整数倍；KCD2 式 30 秒片用 6-10 个快切镜头 + 无缝转场（衔接 119 声画协同）。
- **质检清单**：布料/次级动力学（AI 常见「布料穿模」）、口型（唱歌镜头 Mioni/戏台演员）、民俗道具一致性（桃木剑、门神画、纸钱）、光线色温连续性（烛火不跳变）、结尾 Logo 字卡清晰（衔接 54 缩略图封面）。
- **数据验证**：发布后监控完播率与 3 秒留存，A/B 测试不同钩子开场（毛贼喜剧 vs 直接亮怪），用数据反推下一版分镜。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 首曝预告 | Reveal Trailer | 新作首次亮相物料 |
| CG 预告 | CGI Trailer | 全 CG 渲染的预告 |
| 引擎内预告 | In-Engine / Real-Time Trailer | 用游戏引擎实时渲染，如 Witcher 4 定制 UE5 |
| 一镜到底 | One-take / Long Take | 观感连续的长镜头 |
| 隐藏剪辑 | Hidden Cut | 借遮挡/运动模糊掩盖切点 |
| 静帧分镜 | Stillomatic | 静态分镜图驱动的先导样片 |
| 渲染预演 | Previz | 正式动捕/渲染前的动态预演 |
| 动作捕捉 | Motion Capture (Mocap) | 捕捉演员肢体运动 |
| 表演捕捉 | Performance Capture | 含表情/台词的完整表演捕捉 |
| 数字摄影指导 | Digital Cinematographer | 负责虚拟摄影机的影像质感 |
| 虚拟摄影机 | Virtual Camera | 引擎内可控相机，可模拟手持/轨道/吊臂 |
| 定场镜头 | Establishing Shot | 交代环境/时代的开场镜头 |
| 站位转换 | Stance Shift | 同一角色身份切换的镜头设计 |
| 虚实分层 | Depth Separation | 用景深分叙事层级（戏台 vs 观众） |
| 卡点 | Beat Sync | 剪辑与音乐节拍对齐 |
| 布料解算 | Cloth Simulation | 服饰布料物理模拟（如 Chaos Cloth） |
| 次级动力学 | Secondary Dynamics | 须发、配饰的跟随运动 |
| 幕后花絮 | Behind the Scenes (BTS) | 制作过程物料，二次传播关键 |
| 镜头测试 | Lens Test | 实拍采集镜头光学行为供 CG 复刻 |

## 相关概念

- [经典案例逐镜头拆解（Case Studies & Shot-by-Shot）](../22-case-studies/case-studies.md)
- [名场面运镜解剖（Iconic Camera Movement Deconstruction）](../89-iconic-moves-deconstruction/iconic-moves-deconstruction.md)
- [AI 游戏 CG 与过场动画（Game Cinematics — Cutscenes, Trailers & Animatic-First Workflow）](../151-game-cinematics/game-cinematics.md)
- [AI 风格化与艺术方向（Style & Art Direction — Visual Styles & Style Transfer）](../126-style-art-direction/style-art-direction.md)
