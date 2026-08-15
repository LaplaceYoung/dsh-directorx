# 对话场景拍摄方案：真实技巧 + AI 生成应用（Dialogue Scene Coverage — Film Craft & AI Application）

> 本页是 DirectorX 对话场景手册：以真实电影对话场景的专业方法为知识本体——每个术语给出具体含义（它是什么、画面里长什么样、解决什么问题），并给出 AI 如何理解与实现（提示词怎么写、生成时注意什么）。面向 AI 生成制作。
> 来源：Decoupa 对话覆盖指南、Adobe 正反打、影视工业网正反打全指南、Neil Oseman 正反打构图。

## 概述

**核心断言**：对话场景是覆盖习惯最根深蒂固的地方——两人的反射式做法：主镜头 → 双方过肩 → 双方单人，边说边切。它可靠、总能剪到一起，也是**为什么那么多对话场景感觉一样**的原因。**对话场景很少只关于台词——它关于谁握有权力、谁在改变、天平倾斜的单一时刻。**

## 术语详解（每个词的具体含义）

### 主镜头 Master Shot
- **是什么**：一场戏的完整全景——两个（或更多）人从头到尾的完整表演，一个镜头拍完；
- **具体内容**：观众一眼看到"谁在什么空间、两人位置关系如何"；它是剪辑的骨架与保险（任何覆盖出问题都有全景兜底）；
- **AI 如何实现**：提示词 `wide master shot, both characters fully visible, [地点], [关系站位]`——生成时先出主镜头静帧锁定空间几何（→ 40 首帧锚点），再生成覆盖。

### 过肩镜头 Over-the-Shoulder (OTS)
- **是什么**：从 A 的肩后拍 B——前景是 A 的肩膀/后脑（虚化），焦点在 B 脸上；
- **具体内容**：①把两人"绑"在同一空间（观众知道 B 正对 A 说话）；②同时偏向当前说话者；③前景肩膀的大小=关系距离感；
- **两个铁律**：视线与角色持平（视角过高过低破坏参与感）；**不要拍到背对我们演员的鼻子**（鼻子入画会分心）；
- **AI 如何实现**：提示词 `over-the-shoulder shot, blurred shoulder of [A] in foreground, focus on [B], eye level`——生成后检查：前景肩是否挡脸、B 的视线方向是否朝向 A（→ 40 审查清单"视线一致性"）。

### 单人镜头 Single
- **是什么**：不带肩膀的干净单人画面（中景/近景/特写）；
- **具体内容**：给观众最干净的情绪读取（微表情全画幅）；给剪辑自由——任何一句台词上都能切；
- **AI 如何实现**：提示词 `clean single of [B], medium close-up, no shoulder in frame, looking slightly off-camera`——注意"看画外"方向必须与对手位置一致（视线匹配）。

### 正反打 Shot-Reverse-Shot
- **是什么**：A 说话→切 B 说话→切回 A——交替展示两人的剪辑模式；
- **具体内容**：按对话流程与面部反应切换；观众透过"某人肩膀水平线"观察对话；
- **为什么有效**：解决真实问题——建立地理+绑定双方+保留情绪读取+任何行上可切；
- **代价**：三分钟均匀切两单人=每句同样重量→**乒乓化**，无强调；
- **AI 如何实现**：AI 生成"正反打"=**分段生成**——分别生成 A 说话镜头、B 说话镜头、反应镜头，剪辑端交替（→ 44）；提示词保持视线/背景/光线一致（→ 39 场景一致性）。

### 180° 轴线（对话场景地理底线）
- **是什么**：两人连线的假想线；摄影机只在线的一侧摆放；
- **具体内容**：保持轴线=两人屏幕方向恒定（A 总在左 B 总在右）——观众永不迷失"谁在看谁"；越轴=方向翻转（除非故意）；
- **AI 如何实现**：生成多镜时在提示词里固定"screen left/right"：`[A] on screen left, [B] on screen right, camera stays on the same side of the line`——审查时检查两镜的屏幕位置是否翻转（→ 40 审查清单）。

### 视线匹配 Eyeline Match
- **是什么**：A 看向的方向=镜头 B 中 B 所在位置；
- **具体内容**：视线高度（站/坐）、视线距离（近=亲密）、视线偏移量一致——地理才读得通；
- **AI 如何实现**：提示词统一描述视线：`[A] looks slightly screen-left at [B]`——双通道生成时用同一视线描述（→ 73 主语一致性）。

## 替代方案（何时不用正反打）

| 方案 | 具体内容（画面里发生什么） | 表达什么 | AI 实现 |
|---|---|---|---|
| 保持双人镜头 | 两人始终同框、不切单人——无人能退进自己的干净特写 | 对峙/谈判的张力：互相负责 | `held two-shot, both characters in frame the entire time, no cuts`（时间轴提示词整段不换机位） |
| 一镜到底 | 整场单镜（固定或移动）——拒绝覆盖的安全 | 实时性：观众与角色共处真实时间 | 时间轴分段生成+拼接（→ 89 缝合） |
| 偏向一人 | 不欠两人对等覆盖——把戏给正在改变/握权的一方，另一方多在画外/画面后景 | "这是谁的戏"的声明 | 只生成主角单人+对手的过肩/背影——覆盖不对称 |
| 停留在听者 | 说话者画外，镜头停在听的人脸上——看他"听进去"的瞬间 | 台词不如听见它的脸有趣 | `stay on [B]'s reaction while [A] speaks off-screen, [A]'s voice continues` |
| 延迟反打 | 扣住切到对方的镜头，直到关键一刻才给 | 那一刀切本身成为事件 | 时间轴：前段双人/听者，转折点才切单人 |

**让场景选择**：找到天平倾斜的转折时刻，给那个时刻单独待遇（双人镜在此时破成单人/攒住的反打/靠宽镜挣来的特写）——**其余场景都服务于那一刻**。

## 完整示例（沙发戏——术语如何落地）

```
场景：两人沙发上，一人低声坦白动摇关系的事
默认做法：第一句就全程正反打。抵抗它。
做法：
① 双人镜头开场——客套话都在同框里演，不舒服感坐在未切断的框里
② 坦白到来时刻才动：切到说话者单人，或更好——切到听者单人，
   停留足够长看他"听进去"的表情
③ 一次剪辑，只用一次，承载全场
它有效只因为前面的剪辑没被浪费
```

## 实用层（无论选什么都要保护）

- **干净同步声+每 setup 的房间 tone**：对话场景在剪辑端靠音频活（→ 88 声画协同/95 访谈）；
- **当天记录惊喜 take**：对话场景常在现场表演中找到真正形状；
- **覆盖决策可见**：每个 setup 标注它服务的节拍——区分"承载转折的机位"与"习惯性机位"。

## AI 工作流应用（完整对话场景生产）

```
① 剧本分析：这场戏的转折时刻在哪？（→ 82 潜台词/90 类型）
② 选择方案：正反打 or 替代（按转折位置）
③ 生成顺序：主镜头（锁空间）→ 覆盖（OTS/单人/反应）→ 转折特写
④ 一致性：视线/屏幕方向/背景/光线跨镜一致（→ 39/40）
⑤ 剪辑：按转折点落刀——正反打节奏在剪辑端（→ 44）
⑥ 审查：鼻子入画/视线漂移/屏幕翻转（→ 40 审查清单）
```

## 常见错误

1. 每场都全程正反打：乒乓化无强调。
2. OTS 拍到背影鼻子：分心。
3. 视线不匹配：地理读不通。
4. 越轴无理由：方向翻转观众迷失。
5. 转折时刻不特殊处理：剪辑全浪费。
6. 覆盖不对称当错误：偏向一人的声明被剪平。
7. 音频不保护：对话场景在剪辑端靠声存活。

## 术语表（中英对照，含具体含义）

| 中文 | English | 具体内容（画面里是什么） |
|---|---|---|
| 主镜头 | Master Shot | 整场完整全景，剪辑骨架与保险 |
| 过肩 | OTS | A 肩后拍 B，前景虚肩绑定两人 |
| 单人镜头 | Single | 不带肩的干净单人，情绪读取+剪辑自由 |
| 正反打 | Shot-Reverse-Shot | A↔B 交替的剪辑模式 |
| 双人镜头 | Two-Shot | 两人同框不切 |
| 180° 轴线 | 180° Line | 两人连线，机位只在一侧 |
| 视线匹配 | Eyeline Match | 看的方向=对方位置 |
| 停留在听者 | Stay on Listener | 镜头在听的人脸上 |
| 延迟反打 | Delayed Reverse | 扣住切镜到转折才给 |
| 偏向一人 | Favor One Person | 覆盖不对等=谁的戏 |
| 房间音 | Room Tone | 每 setup 的空屋静默 |
| 转折时刻 | Turning Point | 天平倾斜的瞬间 |

## 来源

- Decoupa: Shooting a Dialogue Scene — Shot, Reverse, and the Alternatives — https://decoupa.film/blog/dialogue-scene-coverage
- Adobe: What Is the Shot-Reverse Shot in Film — https://www.adobe.com/creativecloud/video/production/cinematography/camera-shots-and-angles/reverse-shot.html
- 搜狐: 干货——电影"正反打"全指南（视线持平/不拍背影鼻子） — https://www.sohu.com/a/168950949_286786
- 影视工业网: 嗨！导演，你的对话场景还是只是正反打么？ — https://cinehello.com/stream/86228/
- Neil Oseman: Composing a Shot-Reverse — https://neiloseman.com/composing-a-shot-reverse/
- Seikan: How to Shoot Dialogue Scenes — Coverage, Blocking, and Flow — https://seikan.app/blog/how-to-shoot-dialogue-scenes
- Filmmaker Genius: Filming Dialogue Coverage & the 180° Rule — https://filmmakergenius.com/academy/shot-list-filmmaking/filming-dialogue-coverage