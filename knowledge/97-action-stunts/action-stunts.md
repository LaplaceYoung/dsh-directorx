# AI 生成动作场景：术语详解 + AI 理解与实现（Action Stunts — Deep Terms & AI Implementation）

> 本页是 DirectorX AI 动作场景手册（深化版）：以真实动作电影的行业技巧为知识本体（《神鬼认证》《捍卫任务》《不可能的任务》《疯狂麦斯》），**每个术语详解其具体内容**（画面里实际发生什么、包含哪些子元素、为什么行业这么做），并给出 **AI 如何理解与实现**（模型视角下的难点、可直接使用的提示词模板、生成后如何检查与修复）。面向 AI 生成制作。
> 来源：DC Film School 打斗三要素、Cyclone Stunts 打斗拆解、Film Independent 动作访谈、Runway/Seedance 官方提示词。

## 概述

**方向**：知识库面向 AI 生成，专业性来自真实影视行业技巧。动作场景的"拍摄"即"生成"。

**核心认知**：
1. AI 模型没有"演员受伤"问题，但有**物理可信度问题**——肢体错乱/动作无重量/因果断裂是生成动作戏的主要失败模式；
2. 真实动作片的编舞知识（受击反应/距离/节奏/性格动作）**原样转化为提示词语汇**；
3. 镜头语言决定动作质感：真实电影的手持/广角定镜风格=提示词风格指令（→ 85）。

## 术语详解一：受击反应 Sell the Hit（动作戏第一优先级）

### 是什么
挥拳/踢击打中后，**被打一方**的表演反应。

### 具体内容（画面里实际发生什么）
- **头部后仰**：拳接触帧后 3-5 帧内，头朝受力方向猛甩（幅度约 15-30 度）；
- **身体折叠**：躯干向受击方向弯折，不是僵硬平移；
- **退步步数**：重击后退 2-3 步（步数=冲击力刻度），轻击原地踉跄；
- **呼吸丢失**：张嘴、身体停顿 0.5-1 秒——"被打懵"的生理节拍；
- **延迟响应**：反应比拳慢半拍（真实人体神经延迟）——完全同步反而假。

### 为什么行业这么做（John Wick 特技演员 Anthony Vincent）
**"让打斗场景发挥作用的，常是接受拳头的人。"** 观众的眼睛跟着被打的人走——被打效果比挥拳更重要。

### AI 如何理解与实现
- **模型视角**：视频模型默认学习"主动作"（挥拳者动画），"被动响应"（被打者动画）是弱项——不写受击，模型会让挥拳落空或被打者毫无反应；
- **提示词模板**（把因果写成"受击→响应"链，不是并列状态）：
  ```
  the punch connects with his jaw, his head snaps back, he stumbles two steps, gasps
  ```
  关键词顺序重要：`connects`（接触）→ `snaps back`（后仰）→ `stumbles`（退步）→ `gasps`（呼吸）——**这是时间因果链，不是属性列表**；
- **生成后检查**：逐帧看拳接触帧后 3-5 帧——头部不动=失败，重新生成（或把受击单独生成短片段 2-3 秒再接）；
- **预算纪律**：细节预算（更多生成轮次/更高分辨率）花在受击反应段，而非挥拳本身（→ 73 双通道：描述变化不描述状态）。

## 术语详解二：动作即人物 Action as Character

### 是什么
打斗风格由角色性格与故事处境决定——每个角色有"格斗签名"。

### 具体内容（《不可能的任务》厕所戏）
- **Ethan Hunt**：不想打但必须处理情况→防御性动作（格挡、退让、借力）；
- **August**：体型优势+潜在危险→主动进攻（过肩摔、压制）；
- 观众凭打斗方式就能认出角色——**换脸不换打法**。

### AI 如何理解与实现
- **模型视角**：模型不知道"这个角色是谁"，它只执行提示词——不给性格词汇，所有角色打成一个样；
- **提示词模板**（给每个角色固定动作词汇表，跨镜复用）：
  ```
  [character A]: defensive posture, arms up, backing away, redirecting strikes
  [character B]: aggressive, low stance, overhand throws, closing distance
  ```
- **跨镜一致性**：动作词汇表是全剧资产（→ 39 一致性）：每场动作戏提示词都引用同一角色词表——否则角色 A 在镜 1 是防御流、镜 2 变狂暴流；
- **检查**：同一角色的两场打斗风格是否统一（生成对比表）。

## 术语详解三：打斗像舞蹈 Fight as Dance

### 是什么
打斗是**预编的配合序列**——每个动作预先编好、节奏合拍，双方像舞伴。

### 具体内容（Matt Damon 为《神鬼认证》训练三个月）
- **动作预编**：每招编号，顺序固定——不是随机互殴；
- **节奏节拍**：攻-防-攻-防 的交替节拍（通常 2-4 拍一组）；
- **距离管理**：击打距离恒定（够不着/贴身过近都是失误）；
- **戏剧化**："电影里的武打，都是因观众而'戏剧化'后的武打"（袁和平）——真实格斗不好看，电影打斗是表演。

### AI 如何理解与实现
- **模型视角**：模型把一段 10 秒动作当"一个整体"生成——动作一多就乱（肢体错乱）；必须切成**每段一个主动作**；
- **提示词模板**（时间轴分段，每段一个动作+衔接因果）：
  ```
  [0:00-0:03] attacker throws wide hook, defender ducks under it
  [0:03-0:06] defender lands body shot, attacker doubles over
  [0:06-0:09] attacker recovers, grabs defender's arm, throws him into the wall
  ```
  段间衔接词（`recovers, grabs`）=上一段的果是下一段的因——模型才能接上；
- **检查**：段与段之间动作是否连续（位置/姿态漂移→ 39 位置锚定）。

## 术语详解四：Cutting on Action 动作上切

### 是什么
在动作**进行中**（顶点前）切换镜头——下一镜从动作的延续部分开始。

### 具体内容（《绅士密令》30 秒 20 颗镜头）
- 切点落在动作顶点前（拳挥出途中切），下一镜拳继续挥完——观众注意力被动作牵引，**察觉不到剪辑**；
- 方向延续：下一镜动作方向与上一镜一致（左→右打拳，下一镜还是左→右）；
- 节奏：镜头时长≈动作节拍（每个动作 0.5-1.5 秒一镜）。

### AI 如何理解与实现
- **模型视角**：**模型不做剪辑**——它生成的是素材段；"快剪节奏"必须在剪辑端实现（→ 44）；
- **AI 的职责**：生成**留有可切点**的素材——每段动作完整通过画面（出画/入画、动作有始有终），剪辑师才在任意动作顶点下刀；
- **实现模板**：分段生成时每段结束在"动作未完"状态（如拳刚挥出）——剪辑端切到下一段延续；
- **检查**：每段素材是否有明确的动作起点和运动方向（否则剪辑无点可切）。

## 术语详解五：十字景框 Crosshair Framing

### 是什么
主体（打斗双方）始终处于画面**中心区域**的构图方式。

### 具体内容（《疯狂麦斯：狂暴之路》）
- 主体置中，快剪时观众仍能清晰辨识谁是谁；
- 左右留白对称，动作从中心向两边展开；
- 慢镜冲击帧时主体中心=视觉焦点锁定。

### AI 如何理解与实现
- 提示词：`centered composition, subject in the middle of frame, action radiates from center`；
- 为什么对 AI 重要：AI 生成快动作常产生构图漂移（主体出画）——中心构图是**最稳的生成默认值**；
- 检查：主体中心偏移超过画幅 1/3=重生成。

## 术语详解六：手持纪实 Handheld Style

### 是什么
手持摄影机的晃动风格，画面微糊带动态感。

### 具体内容（《神鬼认证》系列）
- 镜头晃动**遮掩假打**（快速剪辑+晃动让观众看不清接触细节）；
- 随动作轻摇（跟摇）——晃动有方向，不是随机抖；
- 靠近动作（贴近拍摄）增加临场感。

### AI 如何理解与实现
- 模型能力差异：**Runway 手持风格强**（晃动自然），其他模型容易"晃成乱抖"；
- 提示词：`handheld camera, shaky, close to the action, urgent, camera follows the movement`——`camera follows the movement` 防止乱抖；
- 检查：晃动是否有方向性（跟动作），还是纯随机抖动。

## 术语详解七：广角定镜 Locked-Off Wide 与长镜动作

### 是什么
固定机位广角，让观众看到**完整动作**（不遮掩）；长镜动作=一镜感（靠多镜同角度缝合）。

### 具体内容
- **广角定镜**（John Wick 2）：让观众看真实特技——风格选择而非技术限制；AI 实现：`wide locked-off shot, full body in frame`——对 AI 反而更难（所有细节暴露，肢体错误无处藏）→ 审查更严；
- **长镜动作**（《极冻之城》7 分钟=40 颗同角度缝合）：一镜感靠衔接不靠真一镜——AI 实现：时间轴分段生成+同机位提示词（→ 89 缝合）。

## 模型能力对照（→ 52 横评）

| 维度 | 强项模型 | 提示词要点 | 为什么（模型机制） |
|---|---|---|---|
| 物理/动作力学 | Seedance 2.0 | 因果链：`the punch throws him off balance, he grabs the railing` | 因果推理强——后件跟随前件 |
| 流畅运动 | Kling 3.0 | 速度节拍：`fast, precise strikes, no pauses` | 运动连续性训练充分 |
| 手持纪实 | Runway Gen-4.5 | 物理+手持：`momentum carries the body forward` | 纪实风格数据多 |
| 慢镜冲击 | Veo 3 | `slow motion, impact frame` | 音频同步+慢镜素材优 |

## 常见失败与对策（含模型机制解释）

| 失败 | 模型为什么犯 | 对策 |
|---|---|---|
| 肢体错乱 | 同时动作过多，模型 token 分配不过来 | 减少同时动作人数；每段一个主动作（→ 49 一镜一主运动） |
| 动作无重量 | 只描述了"动作"没描述"受力后变化" | 因果链描述：`limbs follow momentum`、受击响应词表 |
| 面部变形 | 快速运动时面部细节采样不足 | 快动作放慢或分段；特写用静帧+插值 |
| 位置漂移 | 无空间锚点，模型重新想象场景 | 参考图锚定+时间戳分段（→ 39/73） |
| 武器变形 | 长而细的物体生成不稳定 | 材质握持描述+短片段生成（3 秒内） |
| 冲击假 | 接触帧无响应动画 | 受击反应独立生成+逐帧检查接触后 3-5 帧 |

## 工作流应用（真实技巧 → AI 生产）

```
① 拉片拆解真实动作段落（→ 83 五遍观察法：阻挡/运镜/剪辑点）
② 编舞 → 提示词映射（本页每节模板）
③ 角色动作词表建立（→ 39 一致性资产）
④ 双通道生成（→ 73）：构图静帧 → 运动生成
⑤ 逐段生成+剪辑合成（Cutting on Action 在剪辑端，→ 44）
⑥ 审查：受击帧/肢体/位置/风格统一（→ 40 审查清单）
```

## 术语表（中英对照，含具体内容与 AI 实现）

| 中文 | English | 具体内容（画面里是什么） | AI 实现要点 |
|---|---|---|---|
| 受击反应 | Sell the Hit | 头后仰/身折叠/退步/呼吸丢失 | 因果链提示词+逐帧检查接触后 3-5 帧 |
| 动作即人物 | Action as Character | 角色格斗签名 | 每角色固定动作词汇表，跨镜引用 |
| 打斗像舞蹈 | Fight as Dance | 预编序列/节奏/距离 | 时间轴分段，段间因果衔接词 |
| 动作上切 | Cutting on Action | 顶点前切/方向延续 | 生成留可切点素材，剪辑端下刀 |
| 十字景框 | Crosshair Framing | 主体置中 | 中心构图防漂移 |
| 手持纪实 | Handheld Style | 晃动遮掩/跟摇 | Runway 强；`camera follows the movement` |
| 广角定镜 | Locked-Off Wide | 完整动作展示 | 暴露细节，审查更严 |
| 长镜缝合 | Long-Take Stitching | 同角度多镜衔接 | 同机位提示词+分段生成 |
| 因果链 | Causal Chain | 受击→响应逻辑 | 提示词按时间顺序写动词链 |
| 物理可信度 | Physics Fidelity | 重量/惯性/动量 | 描述受力后变化而非动作本身 |
| 分段生成 | Segmented Generation | 每段一个主动作 | 3-9 秒/段，段间衔接 |
| 位置漂移 | Position Drift | 空间锚点丢失 | 参考图+时间戳锚定 |

## 来源

- DC Film School: 電影打鬥場面怎麼拍？三大要素（真实编舞/摄影/剪辑技巧） — https://dcfilmschool.com/電影打鬥場面怎麼拍？掌握三大要素：動作設計、/
- Cyclone Stunts: Fight Scene Breakdown — Realistic Combat Without CGI — https://cyclonestunts.com/2025/06/19/sample-blog-post/
- Film Independent: The Art of Action — Shoot Great Stunt Scenes（Lawrence Ribeiro 访谈） — https://www.filmindependent.org/blog/the-art-of-action-how-to-shoot-great-stunt-scenes-for-indie-filmmakers/
- Runway: AI Video Prompting Guide — https://runway.com/resources/ai-video-prompting-guide
- StudioList: AI Video Prompt Engineering — 4 Formats — https://studiolist.co/guides/ai-video-prompt-engineering-2026/
- Oakgen: 四模型动作/物理横评 — https://oakgen.ai/blog/sora-2-vs-veo-3-vs-kling-3-vs-seedance-2-tested
- Seedance 2.0 提示词编写指南（火山引擎） — https://www.volcengine.com/article/40840