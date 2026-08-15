# 提示词等级骨架

三个等级对应三种不同的控制粒度。每个等级定义了：
- **目标场景**：什么时候选它
- **模块清单**：包含哪些模块
- **字数参考**：大致篇幅
- **骨架模板**：可直接填充的结构

## 扩充指南

如果想新增一个等级（比如"超精简概念版"或"IMAX电影级"），按以下格式追加到本文档：
1. 标题用 `## L<编号> <名称>`
2. 列出目标场景、模块清单、字数参考
3. 提供完整的骨架模板（用代码块）
4. 更新 SKILL.md 第一步的等级推荐表

# L1 精简版 — 导演阐述式

**目标场景**：快速创意探索、概念测试、风格不明确时的试错、短视频（5秒内）、单主角场景。
**哲学**：给方向和感觉，信任执行者（AI）的发挥空间。
**字数参考**：~300字（中文）/ ~250-300词（英文）
**镜头数**：3-5个

## 模块清单（6个核心模块）

1. 整体风格声明（画面质感 + 色调 + 镜头语言）
2. 场景概述（时间/地点/人物/叙事核心）
3. 分镜（逐镜头：时间 + 角度 + 画面 + 动作）
4. 摄影机（运镜风格 + 抖动/稳定规则）
5. 音频（环境音 + 拟音 + 配乐与踩点）
6. 负面约束（一句话否定列表）

## 骨架模板

```
[整体风格]
{画面质感}，{核心色调}，{镜头语言关键词}。{整体氛围一句话概括}。

[场景概述]
{时间}，{地点}，{人物身份}，{核心叙事事件一句话}。

[分镜]
[0s-As] 镜头一：{角度}——{主体动作}，{环境细节}。
[As-Bs] 镜头二：{角度}——{主体动作}，{关键视觉细节}。
[Bs-Cs] 镜头三：{角度}——{主体动作}，{收尾方式}。
（按需增减镜头，每个1-2句）
注：镜头时间戳可重叠（如 [0s-1.5s] 与 [1s-2.5s]），用于模拟踩音乐节拍的快速切镜；每个切点对齐一个音乐重音。

[摄影机]
{运镜风格}，{画面抖动/稳定规则}。

[音频]
{环境音}，{拟音}，{配乐与画面的节奏关系}。

[负面约束]
{一句话列出所有不要的东西}，{保持的目标质感}。
```

## L1 的设计要点

- **不要堆砌模块**：L1 的力量在于精简。如果加了"角色资产描述""动作逻辑"等模块，它就不再是 L1 了——升级到 L2。
- **分镜要具体但简短**：每镜头 1-2 句，给出角度和核心动作即可，不写逐帧细节。
- **负面约束用一句话**：用逗号分隔所有禁止项，不要展开解释。

# L2 标准版 — 分镜脚本式

**目标场景**：风格化动画、MG动画、有明确叙事的预告片、中等时长（5-15秒）、2-3个角色、需要转场控制。
**哲学**：精确到每一拍的视觉元素，但不写逐关节物理。
**字数参考**：~1500-2500字（中文）
**镜头数**：6-8个

## 模块清单（12个模块）

1. 基础信息（时长/比例/类型/对白/字幕/音频）
2. 整体风格声明（美术风格 + 视觉权重比例）
3. 角色描述（每个角色独立）
4. 场景描述
5. 色卡与调色
6. 分镜（逐镜头，含转场机制）
7. 摄影机/镜头语言
8. 音频设计
9. 文字与标识规则
10. 时间稳定与资产锁定
11. 连续性规则
12. 严格禁止（分类列表）

## 骨架模板

```
【基础信息】
片段时长：{N}秒。画面比例：{16:9等}。类型：{类型关键词}。
对白：{有/无}。字幕：{有/无，如有则精确拼写}。
声音：{环境音、拟音、配乐描述}。

【美术风格】
{画面质感}，{主色调}，{核心视觉元素}。
视觉权重：{排版X% + 角色Y% + 符号Z%}。
{转场方式概述}。

【角色】（每个角色独立段落）
{角色名}：{发型体型}，{服装锁定}，{气质}，{动作特征}。

【场景】
{地理特征}，{天气/时间/光照}，{关键细节}，{纵深结构}。

【色卡与调色】
主色调：{}。辅助色：{}。禁止配色：{}。
{特效色调规则，如有}。

【分镜】
[As-Bs] 镜头一：
  - 角度/构图：{}
  - 主体动作：{}
  - 关键视觉细节：{}
  - 转场方式（连下一镜）：{}

[Cs-Ds] 镜头二：...
（6-8个镜头，每个含转场机制）

【摄影机】
{运镜允许项} / {运镜禁止项}，{景深规则}。

【音频】
{分层描述：环境音 / 拟音 / 配乐与踩点}。

【文字与标识】
{允许的文字内容，精确拼写} 或 {明确禁止所有文字/Logo}。

【时间稳定与资产锁定】
角色资产锁定：{逐项列出不可变细节}。
场景资产锁定：{}。

【连续性】
{镜头间必须保持连续的参数：站位、方向、视线、特效状态}。
{禁止项：位置重置/距离跳变/人物穿身/背景反转}。

【严格禁止】
风格禁止：{}
动作禁止：{}
镜头禁止：{}
特效禁止：{}
文字禁止：{}
一致性禁止：{}
```

## L2 的设计要点

- **转场机制是核心**：L2 相比 L1 最大的增值是精确的转场控制（图形匹配、杂志翻页、黑白反相等）。每个镜头结尾必须声明如何过渡到下一镜头。
- **资产锁定要具体**：不要写"保持角色一致"，要写"黑色齐肩短发、白色高立领夹克、银灰几何线条"。
- **视觉权重比例**：这是 L2 特有的工具，用百分比强制分配各视觉层的比重，防止 AI 把所有元素平均铺满。

# L3 详尽版 — 全量锁定式

**目标场景**：多角色格斗、物理交互复杂、需要极高连续性的写实CG、长视频（15秒+）、4+角色、动作戏。
**哲学**：逐帧 + 逐关节 + 逐光源 + 环境物理 + 连续性保证，完全控制输出。
**字数参考**：~5000字+（中文），可拆分为多段
**镜头数**：8-15个

## 模块清单（23个模块）

L2 的全部 12 个模块，加上以下 11 个增强模块：

13. 空间方向总原则（防跳轴）
14. 动作逻辑（逐招拆解 + 因果链）
15. 真实身体力学（逐关节发力链）
16. 光影系统（光源层级）
17. 衣物发丝惯性
18. 动态环境与真实物理
19. 接触阴影与重量感
20. 曝光滚降与画面精细度
21. 对手动态反应补强（防止配角站桩）
22. 攻击压迫感与环境反馈（原名"高燃打斗补强"，泛化适用非格斗爆发戏）
23. 抗AI闪烁（独立于资产锁定）

**格斗/奇幻/超能力戏额外模块**（见 `advanced-modules.md`）：
24. 特效行为规则（火焰/能量/光芒的运动行为）
25. 角色状态转换/变身链条（觉醒/变身/形态切换）

（注：实际是 L2 + 多个物理/连续性增强模块，编号延续。各模块的填写指南见 modules.md）

## 骨架模板

L3 的骨架 = L2 完整骨架 + 以下增强模块（按需插入对应位置）：

```
【基础信息】
（同 L2，但增加：片段在完整作品中的位置与功能）

【总控要求】   ← L3 把"整体风格"升级为带行为规则的总控
{画面质感}，{主色调}，{核心视觉元素}。
{总控行为规则：不做X，不做Y，必须Z}。
{动作骨架概要：A → B → C → D}。

【空间方向总原则】   ← L3 新增
{攻击方/被攻击方位置锁定}。
{纵深锚点（固定背景参照物）}。
{禁止跨轴/换边声明}。
{反打规则（如有）}。

【角色资产描述】   ← L3 增强：加 {{Mixed N}} 标记
{角色名} {{Mixed N}}：{逐件锁定服装}，{动作气质}，{表情基调}。
{特别注意：该角色最易出现的问题}。

【动作逻辑】   ← L3 新增
{完整动作链：A → B → C → D → ...}
{每个动作的因果关系}
{"不是X，而是Y" 纠正句式（针对AI常见误解）}

【真实身体力学】   ← L3 新增
{发力链：脚→膝→腰→肩→臂→手}
{重量感与重心变化}
{落地/接触规则}

【光影系统】   ← L3 新增
环境光：{来源 + 色温}
动态主光：{来源 + 变化规则}
轮廓光/补光：{来源 + 条件}
{特殊状态光影变化规则}

【分镜】   ← L3 增强：每个镜头加焦段 + 关键字段
镜头N  起始-结束：
  焦段：{Nmm}（参考 modules.md 焦段表）
  机位/角度：{}
  景别：{}
  运动节奏：{慢动作/正常/加速/变速}
  主体动作（含发力链）：{}
  环境反馈：{}
  跨镜头承接：{承接上一镜的XX动作，或"独立镜头"}
  画面突出点：{这一镜要表现的核心}
  转场：{}

【衣物发丝惯性】   ← L3 新增
{冲刺/旋转/后拉时的衣物延迟与回落}
{特效对衣物的影响}

【动态环境与真实物理】   ← L3 新增
{环境→动作的响应}
{接触阴影与重量感}

【曝光滚降与画面精细度】   ← L3 新增
近景保留：{}
中景保留：{}
远景保留：{}
{特效区域层次保留规则}

【抗AI闪烁】   ← L3 新增（独立于资产锁定）
{不能闪烁的元素清单}
{不能忽隐忽现的细节}

【连续性与动作完整性】   ← L3 增强
{镜头间连续性要求}
{同一次动作跨镜头的衔接规则}
{禁止项：位置重置/距离跳变/人物穿身/攻击轴线丢失}

【严格禁止】   ← L3 增强：更细致的分类
（同 L2 的分类，但每类更详尽，加入物理禁止、一致性禁止等）
```

## L3 的设计要点

- **空间方向锁定是 L3 的灵魂**：写实多角色场景中，AI 最容易犯的错误就是跨镜头跳轴、人物左右互换。`【空间方向总原则】` 模块专门解决这个问题。
- **逐关节发力链**：不要写"打出右拳"，要写"前脚踩实，膝盖微屈，腰胯短促拧转，身体向前强冲，右肩前送，右拳顺势打出"。
- **"不是X，而是Y"句式**：这是纠正 AI 最有效的句式。例如"右拳打空后不是主动收拳，而是顺着出拳惯性继续走完轨迹，再借身体旋转自然带回"。
- **可拆分为多段**：如果视频超过15秒，建议按叙事段落拆分为多个 L3 提示词，每段独立但共享角色/场景资产锁定。

# 等级选择决策树

```
用户需求
  │
  ├─ 快速试错 / 概念探索 / 风格未定？
  │     └─► L1 精简版
  │
  ├─ 风格明确 + 有叙事 + 需要转场控制？
  │     └─► L2 标准版
  │
  └─ 多角色 + 写实 + 动作戏 + 需要极高连续性？
        └─► L3 详尽版
```

边界情况：
- **5秒内 + 多角色格斗** → 仍用 L3（动作复杂度决定等级，不是时长）
- **15秒 + 单主角风景** → 用 L1 或 L2（场景简单，不需要 L3 的物理模块）
- **风格化MG动画 + 复杂转场** → 用 L2（L3 的物理模块对二维内容无意义）
- **超15秒的风格化MG** → 拆成多个 L2 段（每段独立但通过段间衔接锚点连接，见 advanced-modules.md #27），不要因此升 L3
- **字数/镜头数均按单段计**：跨段作品把每段当独立提示词
- **一镜到底（单镜头长跟踪）** → 特殊 case：多镜头骨架坍缩为**单镜头**，分镜模块改为"单镜内的运镜段落划分"（如 0-3s 推进 / 3-6s 环绕 / 6-9s 拉开）。等级仍按内容复杂度选（L1/L2/L3 均可一镜到底），但：① 删除所有"切到""硬切"等剪辑词；② 转场机制改为"镜内转场"（运镜遮挡/穿越/焦点转移）；③ 摄影机模块权重提升为最高（单镜头全靠运镜叙事）。若一镜到底时长超过平台单次上限，需用平台的 Extend/视频续写功能（运动连续，非手动分段）。

# 英文骨架模板

当用户要求英文输出（或目标平台对英文响应更好，如 Sora/Runway）时，使用以下英文骨架。中文骨架的字段逻辑完全相同，只是标签和占位符语言切换。

## L1 English skeleton

```
[Style] {texture}, {tone}, {lens keywords}. {one-line mood}.

[Scene overview] {time}, {place}, {who}, {one-line narrative}.

[Storyboard] ({cut style}, landing on the musical beats):
[0s-1.5s] Shot 1: {angle}: {action}, {detail}.
[1s-2.5s] Shot 2: {angle}: {action}, {detail}.
[2.5s-4s] Shot 3: {angle}: {action}, {detail}.
(Note: timestamps may overlap to simulate beat-synced rapid cuts.)

[Camera] {cut style}, {jitter/stability rule}.

[Audio] {ambience}, {foley}, {score + beat sync + burst timing}.

[Negatives] {one-line ban list}, {texture to keep}.
```

## L2 English skeleton

```
[Specs] Duration: {N}s. Aspect: {16:9}. Type: {type keywords}.
Dialogue: {none}. Subtitles: {none}. Watermark: {none}. Music: {none}.
Audio: {ambience, foley, score}.

[Art style] {texture}, {palette}, {core visual elements}.
Visual weight: {layout X% + character Y% + symbol Z%}.
{Transition approach overview}.

[Characters] (each its own paragraph)
{Name}: {hair/build}, {locked outfit}, {demeanor}, {action trait}.

[Scene]
{geography}, {weather/time/light}, {key details}, {depth structure}.

[Color & grading]
Main: {}. Accent: {}. Banned: {}. {FX color layering if any}.

[Storyboard]
[As-Bs] Shot 1:
  - Angle/composition: {}
  - Subject action: {}
  - Key visual detail: {}
  - Transition (to next shot): {}

[Cs-Ds] Shot 2: ...

[Camera] {allowed} / {banned}, {DOF rule}.

[Audio] {layered: ambience / foley / score + beat sync}.

[Text & marks] {allowed text, exact spelling} or {ban all text/logo}.

[Asset lock] Character: {per-item lock list}. Scene: {}.

[Continuity] {params that must stay continuous across shots}.
{banned: position reset / distance jump / body pass-through / bg flip}.

[Banned]
Style: {}. Action: {}. Camera: {}. FX: {}. Text: {}. Consistency: {}.
```

## L3 English skeleton

L2 完整英文骨架 + 以下增强模块（关键字段已英文化）：

```
[Master control] {texture}, {palette}, {core elements}.
{behavioral rules: no X, no Y, must Z}.
{action skeleton: A -> B -> C -> D}.

[Spatial direction]   ← L3
{attacker/defender position lock}.
{depth anchor (fixed bg reference)}.
{no axis-cross / no side-swap}.
{reverse-shot rule if any}.

[Characters] (with {{Mixed N}} markers)
{Name} {{Mixed N}}: {per-item locked outfit}, {action demeanor}, {expression baseline}.
{caveat: most common failure for this character}.

[Action logic]   ← L3
{full action chain: A -> B -> C -> D -> ...}
{causality per move}
{"not X, but Y" corrections}

[Body mechanics]   ← L3
{force chain: foot -> knee -> waist -> shoulder -> arm -> hand}
{weight & center of gravity}
{landing/contact rule}

[Lighting]   ← L3
Ambient: {source + color temp}
Dynamic key: {source + change rule}
Rim/fill: {source + condition}
{special-state lighting change}

[Storyboard]   ← L3 (with focal length + key fields)
Shot N  {start}-{end}:
  Focal: {Nmm}
  Angle: {}
  Shot size: {}
  Speed: {slow-mo / normal / speed-ramp}
  Action (with force chain): {}
  Env response: {}
  Continuity: {carries prev shot's X}
  Focus: {what this shot expresses}
  Transition: {}

[FX behavior]   ← L3 (if fire/energy/lightning) — see advanced-modules.md #28
[State transform]   ← L3 (if awakening/transform) — see advanced-modules.md #29
[Cloth & hair inertia], [Dynamic env & physics], [Contact shadow & weight],
[Exposure rolloff], [Anti-flicker]   ← L3
[Per-shot intent summary]   ← L3 (one line per shot: what it highlights)
[Continuity & action completeness]   ← L3
[Anti-corruption prelude]   ← L3 (if high-risk node: restate core logic before [Banned])
[Banned]   ← L3 (finely categorized)
```

## 中英混合输出说明

- **用户要中文提示词** → 用中文骨架
- **用户要英文提示词** → 用英文骨架（尤其 Sora/Runway/部分 Kling 场景对英文标签响应更好）
- **用户要双语** → 先输出主语言完整版，再输出翻译版；两者结构一致，便于对照
- **占位符语言**：骨架里的 `{...}` 占位符本身用目标语言填写，不要中英混杂