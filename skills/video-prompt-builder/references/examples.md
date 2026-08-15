# 真实案例库

本文件收录经过验证的高质量视频提示词案例，作为各等级的标杆样本。

每个案例标注：来源、等级、风格、字数、关键特征。

当用户描述模糊时，可以引用这些案例帮助用户明确需求："你想要的更接近案例A（简洁电影感）还是案例C（详尽格斗）？"

> **完整原文存档**：所有案例的完整提示词原文已存档在 `assets/prompts/` 目录，每案例一个文件。本文件展示骨架/节选用于快速参考，需要完整原文（尤其案例2/3的长文）时读取对应文件：

> | 案例 | 存档文件 |
> |---|---|
> | 案例1（L1 动作预告片） | `assets/prompts/01-action-movie-rooftop-chase.md` |
> | 案例2（L2 游戏PV/MG动画） | `assets/prompts/02-game-pv-cel-mg.md` |
> | 案例3（L3 拳皇格斗） | `assets/prompts/03-kof-kusanagi-orochi.md` |
> | 案例4（L1 产品广告片） | `assets/prompts/04-editorial-tech-mouse.md` |

## 扩充指南

用户积累新案例后，按以下格式追加：
1. 标题用 `## 案例<N>：<名称>`
2. 标注元信息（来源/等级/风格/字数）
3. 列出"为什么有效"的3个关键特征
4. 附完整提示词（用代码块包裹）

## 案例1：动作电影预告片 — 屋顶追逐（L1 精简版标杆）

- **来源**：用户提供，英文
- **等级**：L1 精简版（导演阐述式）
- **风格**：写实实拍胶片质感
- **字数**：~300词
- **关键特征**：
  1. **极简但具体**：6 个精炼模块，每个细节都精准（"变形宽银幕镜头""浅景深""胶片颗粒"）
  2. **分镜踩点**：每个镜头标注精确时间戳，时间戳重叠模拟踩节拍的快速切镜，与音乐节拍绑定
  3. **音频与画面双轨道**：音频不是附属，而是踩点设计的核心（accent hit on each leap / score bursting at 4s）
  4. **负面约束一句话**：高效，不占篇幅

```text
Realistic live-action cinematic look, action movie trailer: practical film photography style, a post-rain dusk metropolis, anamorphic lens, shallow depth of field, film grain, city volumetric fog, flying-car traffic between the towers, restrained grading for a premium feel, powerful natural movement.

Scene overview: at dusk on a cluster of skyscrapers, the protagonist is being chased, sprinting and leaping across rooftops, jumping from one building's roof to the next with pursuers closing in behind him. This is the escape sequence of an action movie trailer: every leap is life-or-death, thrilling and fluid.

Storyboard (each shot a separate scene, rapid cuts, all landing on the musical beats):
[0s-1.5s] Shot 1: high side angle: the protagonist sprinting at the roof edge, pursuers appearing in the rooftop doorway behind him, wind catching his coat.
[1s-2.5s] Shot 2: the protagonist leaps across the gap between buildings, body stretching mid-air, towers and flying-car light trails behind him, a slight slow-motion feel.
[2.5s-4s] Shot 3: he lands, rolls and rises, low-angle shot, tower shadows and fog behind him, he keeps running.
[4s-5s] Shot 4: freeze: the instant he hits the edge of the next roof and launches into the jump, silhouette, holding.

Camera: each shot its own angle, cuts clean and hard, no dissolves, a slight frame jitter on the jumps.

Audio: wind, rapid footsteps, city ambience, low score underneath, an accent hit on each leap, the score bursting at 4s, closing the last 1s.

No text, subtitles, logos or watermarks of any kind, no animation or cartoon rendering, no overly-CG look, keep the live-action texture.
```

## 案例2：游戏宣传PV — 冷蓝赛璐璐（L2 标准版标杆）

- **来源**：用户提供，中文，分两段
- **等级**：L2 标准版（分镜脚本式）
- **风格**：纯二维日系赛璐璐 + Editorial MG
- **字数**：每段~2000字
- **关键特征**：
  1. **视觉权重锁定**：明确声明"排版60% + 角色30% + UI 10%"
  2. **图形匹配转场链**：刀刃→圆环→月相→蝴蝶→瞳孔→纸张，全片反复变形
  3. **错峰时序**：冲击元素分三个层级，间隔2-3帧依次弹开
  4. **单一锚点原则**：任何时刻只保留一个主要视觉锚点，辅助图形不超过三组
  5. **资产锁定细致**：角色服装逐件描述，道具尺寸声明稳定

由于原文极长（两段共~4000字），此处仅展示第一段（0-3秒）的结构骨架作为参考。完整原文见用户原始输入。

```text
游戏宣传PV第一段，时长15秒，整体为纯二维日系赛璐璐动画与高级杂志Editorial MG合成。

[美术风格]冷蓝视觉风格:深海蓝、钴蓝、青蓝、黑色和纯白构成高反差画面...
视觉权重保持统一:高级Editorial杂志排版占60%，二维日系硬边赛璐璐人物占30%，游戏UI与抽象符号占10%。
任何时刻只允许一个主要视觉锚点，辅助动态图形不超过三组。

[角色]女主为黑色齐肩短发的年轻女性，身材修长，穿黑色修身制服与长靴，手持一把接近身体高度的大太刀...

[分镜]
0-3秒 纯白背景中只保留一条极细钴蓝竖线...
  第一拍，钴蓝竖线缓慢向右移动，边缘产生轻微蓝黑套印偏移。
  第二拍，竖线突然加速并瞬间锐化，匹配变成女主大太刀的刀刃侧面。
  第三拍，女主黑色长靴、修长小腿与刀尖以低机位平面裁切构图闯入右下角...
  冲击元素分三个层级错峰出现:第一层为极细横线和裁切符号，第二层为时钟刻度与不可辨识的数字标记，第三层为青蓝矩形和断裂圆环碎片，各层间隔两至三帧依次向画面边缘弹开。

[严格限制】全片保持二维高级Editorial MG、日系硬边赛璐璐...不要写实人物，不要真人质感，不要三维角色...
```

## 案例3：拳皇格斗 — 大蛇薙式火焰（L3 详尽版标杆）

- **来源**：用户提供，中文，分两段
- **等级**：L3 详尽版（全量锁定式）
- **风格**：顶级AAA游戏CG预告片质感
- **字数**：每段~5000字
- **关键特征**：
  1. **空间方向总原则**：纵深锚点（中央楼梯+红色霓虹招牌）锁定，防止跳轴
  2. **逐关节发力链**："前脚踩实→膝盖微屈→腰胯短促拧转→右肩前送→右拳顺势打出"
  3. **"不是X，而是Y"纠正句式**：大量使用，直击AI常见误解
  4. **资产锁定 + 抗闪烁双模块**：逐件锁定服装 + 独立声明不闪烁元素
  5. **接触阴影与重量感**：独立模块，防止人物"飘"
  6. **曝光滚降**：分层保留细节，防止过曝

由于原文极长（两段共~10000字），此处展示最具特色的几个模块作为参考。完整原文见用户原始输入。

**空间方向总原则（L3 独有，解决跳轴）**：
```text
世界空间稳定：草薙京始终是攻击发起方，克里斯始终在草薙京攻击前方。
中央纵深楼梯和最亮红色霓虹招牌始终作为街道深处方向锚点。
草薙京从镜头近侧向街道深处的克里斯推进，不能左右互换、不能方向反转。
镜头一从草薙京身后看，飞踢在画面中向左踢出；反打时同一次飞踢在画面中向右擦过，
这是同一运动轨迹的反向观察，不是新动作。
```

**真实身体力学（L3 独有，逐关节发力链）**：
```text
右拳不是主动大摆臂挥拳，而是落地惯性继续向前：
重量压右脚，腰部继续旋转，肩膀继续前送，右拳像被身体惯性推出去，动作短、狠、快。
右拳打空后不是主动收拳，也不是突然停住，而是顺着出拳惯性继续完成拳路，
再借身体旋转、肩背回带和重心调整自然回收。
```

**抗AI闪烁（L3 独有，对抗逐帧漂移）**：
```text
五官、发型、服装颜色、手套、鞋子不能闪烁。
草薙京黑镶边、胸前口袋条、银灰线条、腰链不能忽隐忽现。
克里斯红衣破损边缘、吊坠、裤褶、红鞋结构不能随机变化。
招牌不能乱变文字和形状，电缆、空调外机、铁栏不能跳动，
火焰边缘不能噪点化，地面反射不能随机破碎，背景旧楼不能呼吸式变形。
```

## 案例4：透明鼠标产品广告片 — Editorial Tech（L1 精简版·产品类·图生视频标杆）

- **来源**：用户提供，英文
- **等级**：L1 精简版（导演阐述式）—— 证明 L1 不只适用于叙事，也完美适用于产品广告
- **输入模态**：**图生视频（image-to-video）**——基于 `<Picture 1>` 参考图生成，是图生视频范式的标杆案例（范式详见 advanced-modules.md #32）
- **风格**：Editorial tech / 高端产品片 / 双色调影棚摄影
- **字数**：~280词
- **关键特征**：
  1. **"参考图锚定 + 环境恒定"范式**：`in its original scene` + `The environment is constant throughout` —— 用一句话锁定参考图来源并禁止环境漂移，这是产品片的核心技巧（对应 L3 的资产锁定，但在 L1 用一句话实现）
  2. **材质母题（Material motif）**：明确声明 `glowing internal metallic micro-components and glossy acrylic refractions` —— 全片所有镜头围绕这一材质特征反复表现，相当于 L2 的"视觉母题变形链"在写实产品片中的等价物
  3. **镜头语言极度精确**：每个 shot 都有明确的运镜动词（push-in / glides along / rotating in a slow orbit）+ 机位（extreme macro profile / low-angle beauty shot），证明 L1 精简不等于模糊
  4. **双色调光影作为风格身份**：`duotone vibrant blue and warm neon orange rim lighting` 贯穿全片，是产品的高级感来源
  5. **音频分层 + 收束设计**：`deep pulsing sub-bass / sharp tactile clicks / sweeping glassy whoosh / rising electronic swell that resolves to near-silence` —— 典型的"音频与画面双轨道"设计（见 advanced-modules.md #24）

```text
Editorial tech product film. The transparent gaming mouse from <Picture 1> in its original scene: a pitch-black studio void with a dark, subtle reflective surface, lit by dramatic duotone vibrant blue and warm neon orange rim lighting, deep soft shadow falloff into pure black. Monochromatic dark palette with electric blue and amber accents. Material motif: glowing internal metallic micro-components and glossy acrylic refractions. The environment is constant throughout.

SHOT 1: The scene opens exactly on image 1, the mouse resting confidently on the dark surface; the blue and orange lights slowly pulse brighter, refracting deeply through the transparent acrylic shell as the camera executes a slow, deliberate push-in to reveal the intricate circuitry.

SHOT 2: Cut to an extreme macro profile of the ridged scroll wheel and layered internal micro-components; the camera glides slowly along the side as a sharp beam of warm orange light sweeps across the metallic textures, contrasting perfectly against the deep blue ambient glow.

SHOT 3: Cut to a low-angle beauty shot: the mouse levitates weightlessly a few centimeters above the dark reflective surface, rotating in a slow, precise orbit; the duotone lighting flares gently along the glassy transparent edges before fading slowly into a sleek silhouette.

Audio: deep pulsing sub-bass room tone, sharp tactile mechanical clicks, a sweeping glassy whoosh on cuts, and a rising electronic swell that resolves to near-silence on the final fade.
```

**L1 产品片写法要点（从案例4提炼）**：
- 用 `<Picture N>` / `{{Mixed N}}` 锁定参考图来源，并声明 `in its original scene` 保持环境一致
- 声明一个贯穿全片的 **材质母题**（material motif），所有镜头围绕它展开
- 每个镜头给出：机位 + 运镜动词 + 光影互动（光如何照射材质）
- 环境用 `The environment is constant throughout` 一句话锁定，避免漂移

## 案例对比速查

| 维度 | 案例1（L1·预告片） | 案例4（L1·产品片） | 案例2（L2·MG动画） | 案例3（L3·格斗） |
|---|---|---|---|---|
| 字数 | ~300词 | ~280词 | ~4000字 | ~10000字 |
| 模块数 | 6 | 6 | 12 | 23 |
| 控制粒度 | 给方向 | 给方向+材质锁定 | 逐拍元素 | 逐帧+逐关节 |
| 适合场景 | 叙事创意探索 | 产品/广告/概念片 | 风格化叙事 | 写实多角色动作 |
| 参考图 | 无 | `<Picture 1>` 单图 | 无 | `{{Mixed 1-4}}` 多图 |
| 音频设计 | 踩点+爆发 | 分层+收束 | 基础信息 | 同期声+特效音 |
| 负面约束占比 | ~10%（一句话） | ~5%（隐含在正面） | ~25% | ~30% |
| AI发挥空间 | 大 | 大 | 中 | 极小 |

## 如何使用本案例库

1. **用户描述模糊时**：引用案例对比表，问"你想要的控制粒度接近哪个案例？"
2. **组装提示词时**：参考对应等级案例的模块组织方式
3. **迭代优化时**：如果AI输出有问题，对比案例看哪个模块缺失或写得不够
4. **扩充库时**：用户产出的高质量提示词可追加为新案例