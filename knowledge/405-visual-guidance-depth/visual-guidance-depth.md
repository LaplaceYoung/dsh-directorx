---
type: Reference
title: "画面视觉引导与层次（Visual Guidance & Depth — Directing the Eye + AI）"
description: "画面视觉引导与层次详解：八种引导视线的手段（光线/线条/对比/运动/视线/景深/色彩/负空间）、前景-中景-背景纵深构建、视觉平衡，以及如何在 AI 提示词中显式写出引导与层次并在生成后检查"
tags:
  - "craft"
  - "color"
  - "prompt"
status: stable
stale_after: "2027-08-18"
generated:
  by: "process:directorx-knowledge-okf"
  at: "2026-08-18T00:00:00Z"
verified:
  - by: "process:knowledge-audit"
    at: "2026-08-18T00:00:00Z"
sources:
  - resource: "cited:PremiumBeat Mastering Foreground, Middleground, and Background"
    id: cite-1
    title: "Mastering Foreground, Middleground, and Background"
    author: "org:PremiumBeat"
  - resource: "cited:https://www.premiumbeat.com/blog/mastering-foreground-middleground-background-in-cinematography/"
    id: cite-2
    title: "https://www.premiumbeat.com/blog/mastering-foreground-middleground-background-in-cinematography/"
  - resource: "cited:Filmmakers Academy Creating Depth with Foreground Middleground Background"
    id: cite-3
    title: "Creating Depth with Foreground Middleground Background"
    author: "org:Filmmakers-Academy"
  - resource: "cited:https://www.filmmakersacademy.com/blog-depth-foreground-background/"
    id: cite-4
    title: "https://www.filmmakersacademy.com/blog-depth-foreground-background/"
  - resource: "cited:StudioBinder What Are Leading Lines"
    id: cite-5
    title: "What Are Leading Lines"
    author: "org:StudioBinder"
  - resource: "cited:https://www.studiobinder.com/blog/what-are-leading-lines-definition/"
    id: cite-6
    title: "https://www.studiobinder.com/blog/what-are-leading-lines-definition/"
  - resource: "cited:Smashing Magazine Design Principles: Compositional, Symmetrical And Asymmetrical Balance"
    id: cite-7
    title: "Design Principles: Compositional, Symmetrical And Asymmetrical Balance"
    author: "org:Smashing-Magazine"
  - resource: "cited:https://www.smashingmagazine.com/2015/06/design-principles-compositional-balance-symmetry-asymmetry/"
    id: cite-8
    title: "https://www.smashingmagazine.com/2015/06/design-principles-compositional-balance-symmetry-asymmetry/"
  - resource: "cited:Springer Where to look at the movies: Analyzing visual attention to understand movie editing"
    id: cite-9
    title: "Where to look at the movies: Analyzing visual attention to understand movie editing"
    author: "org:Springer"
  - resource: "cited:https://link.springer.com/article/10.3758/s13428-022-01949-7。"
    id: cite-10
    title: "https://link.springer.com/article/10.3758/s13428-022-01949-7。"
dx_id: "405"
related:
  - "216-composition-rules-deep/composition-rules-deep.md"
  - "246-composition-psychology/composition-psychology.md"
  - "176-depth-of-field-focus/depth-of-field-focus.md"
  - "178-perspective-camera-height/perspective-camera-height.md"
  - "192-negative-space/negative-space.md"
---

# 画面视觉引导与层次（Visual Guidance & Depth — Directing the Eye + AI）

> 本页为画面视觉引导与层次体系：控制观众视线落点与移动路径、八种引导手段、前景-中景-背景纵深、视觉平衡。知识本体来自电影构图与观影注意力研究的镜头惯例（PremiumBeat / Filmmakers Academy / StudioBinder / Smashing Magazine / Springer 眼动研究）。AI 应用面向 DirectorX：把引导与层次显式写进提示词，让"观众看哪"变成可指挥的生成参数（衔接 216 构图法则、246 构图心理、176 景深、178 透视机位、192 负空间、210 黄金比例）。
> 来源：PremiumBeat「Mastering Foreground, Middleground, and Background」https://www.premiumbeat.com/blog/mastering-foreground-middleground-background-in-cinematography/；Filmmakers Academy「Creating Depth with Foreground Middleground Background」https://www.filmmakersacademy.com/blog-depth-foreground-background/；StudioBinder「What Are Leading Lines」https://www.studiobinder.com/blog/what-are-leading-lines-definition/；Smashing Magazine「Design Principles: Compositional, Symmetrical And Asymmetrical Balance」https://www.smashingmagazine.com/2015/06/design-principles-compositional-balance-symmetry-asymmetry/；Springer「Where to look at the movies: Analyzing visual attention to understand movie editing」https://link.springer.com/article/10.3758/s13428-022-01949-7。

## 1. 概述：观众的眼睛往哪看，怎么控制

**核心断言**：观众不会"平均地"看画面。眼动研究证实，导演始终在操心观众会看向屏幕哪里——构图、取景、摄影机运动与剪辑都是控制注意力的工具（Bruckert et al., "Where to look at the movies", 2022）。人眼天然被这些区域吸引：

- 人脸与眼睛（尤其画面中人物的视线方向）
- 画面中亮度最高的区域
- 对比最强、最锐利的区域
- 饱和度高、色彩突出的区域
- 画面中运动/变化的东西
- 线条汇聚处、纹理密度异常处

**控制视线 = 三个动作**：决定主体放哪（落点）→ 选引导手段把眼睛送到主体（路径）→ 让背景不抢（收敛）。AI 生成时若不写，模型默认铺满信息，观众视线随机漂移；把这些写进提示词，"看哪"就从运气变成设计（衔接 124 镜头语言生成、246 构图心理的眼动结论）。

## 2. 引导手段详解

八种手段按"主引导 + 至多一种辅引导"组合使用，全部堆上会互相抵消（见第 6 节工作流）。

### 2.1 光线引导（Light Guidance）

- **原理**：视觉优先响应"最亮处"。暗场里的一束光（窗光、门缝光、路灯、车灯）天然是注意力终点；光的形态本身可以是一条"光路"。
- **画面效果**：主体在光区内、背景沉入暗部 → 第一眼即主体；光从画面边缘射入还带叙事性（门被推开、天亮了、救援到了）。
- **AI 提示词**：`subject standing in a single pool of warm window light, the brightest area of the frame; rest of the room falls into deep shadow, dark low-key background`
- **生成后检查**：画面最亮处是不是主体？最亮点若在背景墙/角落 → 补 `background darker and evenly lit`、`no bright objects in background`；光区过大 → 收紧为 `light falls only on the subject's face`（衔接 93 光线叙事）。

### 2.2 线条引导（Leading Lines）

- **原理**：人眼沿画面中的线移动（道路、栏杆、走廊、门框、透视收敛线、光影边界）；线把眼睛"送"到汇聚点/终点。引导线构图确实影响视觉认知与注视分布（衔接 246 引用的 PMC 引导线认知研究）。
- **画面效果**：强烈的方向感与纵深感；线终点即主体时，视线到达即叙事完成。
- **AI 提示词**：`long empty corridor, its converging lines of perspective leading directly to the subject standing at the vanishing point`（或 `a winding road / rows of pillars / railing leading the eye to the subject`）
- **生成后检查**：线是否真的指向主体？AI 常把引导线画到画面外或指向空白。发现"线指偏" → 重写终点 `converging toward the subject`，并给主体加高亮或清晰度收尾；也可用线做前景框架（衔接 216 引导线条目）。

### 2.3 对比引导（Contrast Guidance）

- **原理**：视觉对"差异"敏感——明暗差异、清晰度差异、纹理差异。主体与周围反差越大，越先被看见。
- **画面效果**：低调画面里唯一亮的主体 / 高调画面里唯一暗的剪影 / 清晰主体 + 模糊背景：一眼锁定。
- **AI 提示词**：`high-contrast frame, the subject sharply defined against a flat low-contrast background; dark background, single bright subject`
- **生成后检查**：主体是否与背景"分开"？融入背景（同亮度同纹理）→ 加 `subject brighter than background`、`rim light separating subject from background`（轮廓光分离）。**1 秒缩略图测试**：缩到小图看 1 秒，找不到主体 = 对比不足，重写。

### 2.4 运动引导（Motion Guidance）

- **原理**：画面中运动的东西天然抢占注意力——静态画面里任何位移都是"事件"。这是视频特有的引导手段：谁在动，眼睛跟谁。
- **画面效果**：主体运动、背景静止 → 眼睛粘在主体上；背景有人流/飘动物 → 注意力被反复勾走。运动方向还决定"前方留空间"（见 4.3）。
- **AI 提示词**：`the runner moves through a completely still crowd, only the runner in motion, others frozen mid-step`；反向用法（让背景动、主体静，静止的主体反成焦点）：`slow drifting smoke in the background, the subject perfectly still`
- **生成后检查**：运动是否集中在主体上？背景有乱动元素 → 重写 `background static, no other movement`；主体运动不稳定（漂移、抽搐、形变）→ 参考 118 缺陷修复（衔接 177 运动模糊的速度感）。

### 2.5 视线引导（Gaze Guidance）

- **原理**：人眼跟随画面中人物的视线（gaze cueing）——角色看向哪，观众看向哪。这是最"叙事"的引导：视线本身就是剧情动作。
- **画面效果**：角色望向前方/画外 → 观众同步"知道"那里有东西；多人同看一处 → 该处成为强制焦点；看向画外 → 制造悬念（衔接 289 揭示设计）。
- **AI 提示词**：`the woman turns her head and looks off-frame right, her gaze directing the viewer's attention toward the glowing doorway`（或 `both characters look toward the same point`）
- **生成后检查**：视线方向是否明确（AI 常画出无明确方向的眼神）？看不清 → `clear visible eyes, gaze direction obvious`；确认视线指向与画面内被视物（或下个镜头的对象）一致——视线指错是叙事级错误，直接误导观众。

### 2.6 景深引导（Depth-of-Field Guidance）

- **原理**：锐利区域吸引注意。浅景深让对焦平面成为唯一"可读"区，其余化为虚化色块（衔接 176 景深与焦点控制）。
- **画面效果**：主体清晰 + 前景/背景虚化 → 三层立刻分层；对焦在谁身上 = 此刻谁重要；视频里还能用焦点转移（rack focus）把注意力从 A 移到 B。
- **AI 提示词**：`shallow depth of field, f/1.8, subject tack sharp, foreground and background creamy bokeh`；引导转移时写 `focus shifts from the knife on the table to the man's face, rack focus`
- **生成后检查**：焦点是否稳定在主体上？AI 视频常见"焦点不受控漂移"——主体发虚、背景反清晰 → 重写 `subject in sharp focus throughout, background blurred`；失焦类缺陷处理参考 118 缺陷修复。

### 2.7 色彩引导（Color Guidance）

- **原理**：暖色（红橙黄）在视觉上"前进"，冷色（蓝绿）"后退"（Filmmakers Academy 色彩/纹理一节）；高饱和色块在低饱和环境里是天然焦点。
- **画面效果**：灰蓝街道里一把红伞 / 冷色环境里唯一的暖光 → 主体被"色彩分离"；色彩同时传导情绪（衔接 93 光线叙事、240 风格参考）。
- **AI 提示词**：`a desaturated cool-toned street, one single red umbrella as the only saturated element, color pop on the subject`
- **生成后检查**：画面里是否多个高饱和色块互相抢？"每样都鲜艳 = 没有焦点"。缩略图第一眼看到的必须是主体；不是 → `rest of the frame desaturated / muted tones`，强调色控制在 1-2 个。

### 2.8 负空间引导（Negative Space）

- **原理**：留白让眼睛"没有别处可看"，休息后自然回到唯一主体；大比例负空间还表达孤独、辽阔、压迫（衔接 192 负空间与留白）。
- **画面效果**：小人 + 大天空/大墙 → 渺小感；主体 + 大面积纯色 → 极简海报感。负空间的方向性决定视线去向：人物朝左，左边留白，眼睛跟着视线进入空处。
- **AI 提示词**：`tiny lone figure on a vast empty beach, huge negative space above, minimal composition, figure on the lower-left third`
- **生成后检查**：负空间是否干净？AI 常往空处塞无关细节（飞鸟、云、杂物）→ `empty sky, no clouds`、`blank wall, no details`；确认留白方向与主体朝向一致（朝左的侧面像，留白应在左，见 4.3）。

## 3. 画面层次构建（Foreground / Midground / Background）

### 3.1 三平面的职责

| 平面 | 职责 | 常见内容 | AI 提示词写法 |
|---|---|---|---|
| 前景 Foreground | 提供深度与框架，制造"透过窗看"感；常虚化 | 虚化枝叶、门框、栏杆、肩部、车辆局部 | `blurred foreground element framing the shot` |
| 中景 Midground | 主动作/主体所在，注意力中心 | 人物、主要物体 | 主体描述放这里 |
| 背景 Background | 交代环境、比例、氛围；不能抢戏 | 城市、远山、人群、天空 | `simple background, low detail, darker than subject` |

原则：**主体放中景，前景给深度，背景给语境**。三层各讲一层信息时画面最"活"——PremiumBeat 以《出租车司机》车内镜头为例：前景虚化的挡风玻璃、中景的人物、背景窗外街景，三层共同提供深度与复杂性；背景信息过强时用景深或压暗压虚处理（衔接 176）。

### 3.2 纵深营造六法（AI 可写的视觉线索）

1. **重叠遮挡**：物体互相遮挡是最强深度信号 → `foreground branches overlapping the distant buildings`
2. **大小递减**：同类物体近大远小 → `rows of identical pillars receding into the distance`（衔接 178 透视机位）
3. **大气透视**：远处更模糊、更灰、更冷（雾/霾/烟尘）→ `hazy atmosphere, distant mountains fading into pale blue mist`（Filmmakers Academy 以《银翼杀手》烟尘为例）
4. **光影分离**：各层用明暗区分，轮廓光把主体从背景"抠"出 → `rim light separating subject from background; foreground darker, background lighter`
5. **焦点分层**：浅景深只留一层锐利；深焦三层全锐（Citizen Kane 式，视线可在层间自由漫游）→ `deep focus, all planes in sharp focus`（衔接 176）
6. **色彩冷暖**：暖前进、冷后退，主体用暖、远处用冷（见 2.7）

### 3.3 层次的 AI 写法与检查

提示词结构：**先写主体，再分别写三个平面**：

```text
[subject] in the midground, sharp and detailed;
[blurred foreground element] framing the lower edge;
[background description] soft, low-contrast, slightly darker, receding into haze
```

生成后检查：

- **数平面**：画面能数出几个清晰可辨的层？少于 2 层且不是刻意扁平 → 补前景或背景。
- **主体钉在中景**：主体被背景同化 → 加轮廓光/对比（2.3、3.2-4）。
- **纵深稳定性**：视频中前景虚化元素是否穿帮（穿过主体）？穿帮处理参考 118 缺陷修复。
- **扁平是风格选择**：对称 + 平行构图的"扁平感"可以是有意设计（衔接 246 的 Wes Anderson 例），但必须是有意为之，不是默认态。

## 4. 视觉平衡（Visual Balance）

### 4.1 对称 vs 非对称

| 类型 | 感受 | 用途 | AI 提示词 |
|---|---|---|---|
| 对称平衡 | 庄重、稳定、静止（formal balance） | 权力、仪式、压迫感、喜剧的"舞台感" | `perfectly symmetrical composition, subject centered` |
| 非对称平衡 | 动态、自然、现代（informal balance） | 大多数叙事镜头、运动场景 | `asymmetric composition, off-center subject balanced by a secondary element` |

非对称平衡 = 用**视觉重量**配平而非数量配平（Smashing Magazine：一侧一个主导元素可由另一侧若干较轻元素配平）。影响视觉重量的因素：面积、亮度、对比度、饱和度、纹理密度、孤立程度（孤立的元素更重）、人脸/眼睛（天然最重）。AI 提示词可显式分配权重：`large dark tree on the left, balanced by the small bright figure on the right`（衔接 216 构图法则、246 构图心理）。

### 4.2 主体位置与配平

- **落点**：三分法/黄金比例交点比居中更有动感（衔接 210 黄金比例）；居中 = 力量/仪式/被注视；偏置 = 叙事/运动/呼吸感。
- **翻转检查**：把画面镜像（或眯眼只看左右明暗分布）——哪边"沉"？一边信息过重 → 空侧加配重元素（光斑、影子、次主体、负空间形状）：`add a subtle secondary element in the empty side to balance the frame`。
- 主体右侧全是细节、左侧全空 ≠ 平衡，除非空侧有方向性意义（4.3）。

### 4.3 方向与留白（Lead Room / Looking Space）

运动与视线都有"方向性重量"：

- 人物朝左 → 左侧留白（looking space）；右侧贴边 = 压抑/逼仄（可有意为之）。
- 物体向右移动 → 右侧留出运动空间（lead room）；贴边运动 = 撞墙感/被困感。

AI 写法：`figure on the right third, looking left into open space`；`runner moving right with generous space ahead in the frame`。生成后检查：AI 常把人/物居中且朝向画外——把朝向与留白写在同一句，让模型同时满足两件事（衔接 192 负空间、104 竖屏调度）。

## 5. 常见错误表

| 错误 | 画面表现 | 后果 | AI 修复 |
|---|---|---|---|
| 高亮错位 | 最亮点在背景/角落，主体在暗部 | 观众看错地方 | `light falls only on subject; background darker` |
| 引导线指偏 | 线/路/栏杆指向画外或空白 | 视线被送出画面 | 写死终点：`converging on the subject` |
| 主体融入背景 | 主体与背景同亮度同色 | 找不到主体 | 加对比/轮廓光/色彩分离（2.3、2.7） |
| 背景抢戏 | 背景高亮、高饱和、有人动 | 注意力被反复勾走 | `background low-contrast, muted, static` |
| 无层次 | 全画面一样清晰或一样虚 | 平、假、廉价感 | 补前景元素 + 焦点分层（第 3 节） |
| 焦点乱漂 | 视频中清晰区在主体与背景间横跳 | 观众晕、失焦缺陷 | `subject in sharp focus throughout`；严重时参考 118 |
| 多色混战 | 两个以上高饱和色块 | 无焦点 | 只留一个强调色，其余去饱和 |
| 留白错误 | 留白在人物视线背向侧 | 视线被引回画面、违和 | 朝向与留白同句重写（4.3） |
| 失衡 | 一侧信息堆满、另一侧全空且无意义 | 画面"歪" | 空侧加配重元素（光/影/次主体） |
| 前景穿帮 | 前景虚化物在视频中位移穿过主体 | 物理穿帮 | 前景选静态物；参考 118 |

## 6. 工作流应用（AI 映射：显式写出引导与层次）

写提示词按固定顺序过一遍（衔接 115 提示词工程总纲）：

1. **定落点**：主体放哪（center / rule of thirds / golden ratio，衔接 210）→ 写 `subject on the right third`。
2. **选 1-2 个主引导手段**：别把八种全堆上（堆满 = 互相抵消）。动作/叙事场景常用 运动+视线；氛围场景常用 光线+负空间；场景展示用 线条+景深。
3. **光线先行**：先写光（方向、亮区位置），再写主体位置，两者一致：`light from the left falls on the subject's face`。
4. **写层次**：三平面各一句 + 焦点控制（`sharp subject, blurred foreground, soft background`，衔接 116 图生深度控制可进一步锁深度）。
5. **写平衡**：对称 or 非对称 + 配重元素 + 朝向与留白。
6. **生成后检查**：按第 5 节错误表逐项过，重点是"1 秒缩略图测试"——1 秒内找不到主体 = 引导失败，重写。批量质检参考 174 质检自动化。

### 6.1 示例一：氛围静态镜头

```text
Cinematic still, rule of thirds: a lone old fisherman on the right third,
a fishing rod forming a diagonal line leading from bottom-left toward his hands.
Warm lantern glow is the only bright area of the frame, falling on him;
the background is a dark desaturated harbor receding into blue haze.
Foreground: out-of-focus rope coils along the bottom edge.
Asymmetric balance: a dark mast on the left balances the bright figure.
Negative space: vast dark water above, empty.
```

生成后检查：最亮处 = 人？线指向手？三层数得出？左侧暗桅杆有没有抢走视线？

### 6.2 示例二：动态叙事镜头

```text
Handheld-style shot: a woman runs from the background toward camera
through a crowd that stays nearly still; only she is in motion.
Her gaze is fixed off-frame right; bright daylight spill at the
frame's right edge marks her destination.
Shallow depth of field keeps her sharp, the crowd blurred.
She enters from the left third, running right with generous lead room ahead.
```

生成后检查：背景是否真的静止？视线方向与"目的地"亮区是否同侧？运动是否平滑（抖动/形变参考 118）？人物在画面中的位移速度是否与景别匹配（衔接 177 运动模糊、104 竖屏调度）。

## 7. 术语表

| 术语 | 含义 |
|---|---|
| 视觉重量 Visual Weight | 元素吸引眼球的程度（面积、亮度、对比、饱和度、孤立度等共同决定） |
| 视觉方向 Visual Direction | 元素被感知的"指向"（运动方向、视线方向、形状朝向） |
| 显著度 Saliency | 对"画面哪里最抢眼"的预测；引导手段可理解为人工显著度控制 |
| 引导线 Leading Lines | 把视线导向主体的线条（道路、栏杆、光影边界、透视收敛线） |
| 透视收敛线 Convergence | 平行线在远处汇聚的透视现象，天然引导线 |
| 大气透视 Aerial Perspective | 距离越远越模糊、越灰、越冷的现象（雾、霾、烟尘） |
| 前景/中景/背景 F/M/B | 纵深三平面：前景给深度、中景放主体、背景给语境 |
| 深焦 Deep Focus | 三层全部清晰，允许视线自由漫游 |
| 浅景深 Shallow DOF | 只保留一层锐利，其余虚化 |
| 轮廓光 Rim Light | 沿主体轮廓的亮边，把主体从背景分离出来 |
| 视线引导 Gaze Cueing | 人物看向哪里，观众看向哪里 |
| 留白空间 Looking Space | 人物视线方向侧的空白空间 |
| 运动空间 Lead Room | 运动方向前侧的空白空间 |
| 负空间 Negative Space | 主体周围无信息的空白区域（衔接 192） |
| 视觉层级 Visual Hierarchy | 元素被阅读的先后顺序（主体 > 次主体 > 环境） |

## 相关概念

- [AI 图片构图法则体系（Composition Rules — Framing, Leading Lines & Visual Hierarchy）](../216-composition-rules-deep/composition-rules-deep.md)
- [AI 图片摄影构图心理学（Composition Psychology — Eye Tracking & Gaze Guidance）](../246-composition-psychology/composition-psychology.md)
- [AI 景深与焦点控制（Depth of Field — Subject-Background-Distance & Bokeh）](../176-depth-of-field-focus/depth-of-field-focus.md)
- [AI 透视与机位高度（Perspective & Camera Height — Angle Psychology & Lens Choice）](../178-perspective-camera-height/perspective-camera-height.md)
- [AI 提示词负空间与留白（Negative Space — Breathing Room & Minimalist Emphasis）](../192-negative-space/negative-space.md)
