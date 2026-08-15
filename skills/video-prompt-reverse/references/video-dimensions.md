# 全场景维度拆解表 (Video Reverse Dimensions)

本文件是 Step 1「看片拆维」的权威参考。每个场景给出「维度 → 观察要点 → 关键词示例（中英）」。
分析时套用对应场景，把观察到的内容填进 `assets/analysis-form.md`。

> **为什么视频维度比图像多一层"运动"**：图像的惊艳 = 布光/色彩/质感（静止）；视频的惊艳 = **运动设计**
> （运镜/时序/主体运动/物理连续）。开源工具普遍只描述"画面里有什么"，不描述"怎么动"，
> 产出的视频往往"静态美图 + 乱动"。本表把运动作为一等维度单列。

## ★ 运动设计维度（一等，视频专属，必看）

任何场景反推都要先回答"它怎么动"。

### A. 运镜 Camera Movement
- **static 固定机位**：Portraits / 产品 / 对话，稳定不晃
- **pan 摇**：左右旋转机位，revealing landscape / following action
- **tilt 俯仰**：上下旋转，revealing height / dramatic reveal
- **dolly in/out 推拉**：camera 向主体移动/远离，building tension / establishing
- **tracking 跟拍**：camera 跟随移动主体，action / walking
- **orbit 环绕**：camera 绕主体转，product showcase / hero moment
- **crane/boom 升降**：camera 上升/下降，establishing / dramatic reveal
- **handheld 手持**：轻微晃动，documentary / urgency / intimacy
- **zoom 变焦**：镜头变焦（非位移），dramatic emphasis
- **FPV 第一人称**：flying through，action / exploration / immersive
- **whip pan 快摇**：快速甩动转场

> 平台原生控件：Kling 六轴（Horizontal/Vertical/Pan/Tilt/Roll/Zoom，范围 [-10,10]）、Runway Motion Brush、
> 海螺 `[指令]`（[推进][拉远][左摇]…）、即梦自然语言运镜（"镜头高度1.6米,匀速前推,速度0.8米/秒"）。
> 详见 `platform-guides.md`。

### B. 时序 Timing
- **real-time 实时**
- **slow-mo 慢动作**：强调细节/情绪（"放慢至1/6"）
- **time-lapse 延时**：云/人流/生长
- **speed-ramp 速度渐变**：从慢到快/快到慢
- **freeze 定格**

### C. 主体运动 Subject Motion
- 幅度：still / small / large / extreme
- 速率：slowly / rapidly / fluidly
- 方向/类型：walk / rotate / flow / fall / interact / spin
- 物理属性（喂给物理引擎，Kling 强项）：gravity-affected smoke / wind-blown flames / upward spiraling

### D. 物理与连续 Physics & Continuity
- 重力/流体/布料/毛发/火焰的真实感
- 连续感：frame-to-frame stability，避免 flicker / morph / jitter

## 0. 通用片 (General Video)
七要素 + 运动：
- **主体 Subject**：人/物/场景，身份、姿态、表情
- **风格 Style**：写实/动画/3D/赛博/纪录片
- **色彩 Color**：主色调、饱和度、对比
- **光影 Lighting**：光源方向、软硬、时间
- **构图 Composition**：景别、机位、三分/居中/对称
- **质感 Texture**：材质、颗粒、锐度
- **氛围 Mood**：情绪、温度、叙事
- **运动（必填）**：运镜 + 主体运动 + 时序（见上 ★）
- **时长 Duration**：clip 长度（如 5s / 8s / 10s）

## 1. 产品广告 (Product — 强推)
- **材质反光 Material**：金属/磨砂/玻璃/皮革，高光
- **棚拍光 Studio Light**：柔光箱/顶光/边缘光
- **hero 角度 Angle**：45°/平视/俯拍，产品主导
- **背景过渡 Background**：纯色/渐变/环境融合
- **比例 Scale**：产品占画面比例，留白
- **运动**：360° orbit / 缓慢 push-in / 旋转展示；"Smooth 360-degree orbit shot around [product], rotating slowly on clean white studio surface"

## 2. 人物 / 口播 (People / Talking)
- **镜头焦段 Lens**：35/50/85mm，广角/长焦
- **光线 Light**：自然光/棚拍/逆光/伦勃朗
- **景深 DoF**：浅/深
- **色调 Tone**：暖/冷/低饱和
- **运动**：运镜跟随 / 手持 / 固定；表情动作连贯（避免 identity drift）

## 3. 风景 / 空镜 (Landscape / B-roll)
- **前景/中景/远景**
- **时间光线 Time & Light**：黄金时刻/蓝调/正午/夜景
- **氛围 Atmosphere**：雾/云/雨/通透
- **运动**：aerial drone glide / slow pan / time-lapse

## 4. 叙事 / 故事片 (Narrative)
- **分镜表 Shot list**：每个 shot 的景别/机位/动作/时长
- **镜头衔接 Transition**：硬切/叠化/遮挡转场
- **情绪曲线 Emotional arc**：开场→发展→高潮→收尾
- **运动**：运镜语法 + 节奏（每 clip 一主运动，避免冲突）

## 5. 电商带货 (E-commerce — 强推，可选场景模板)
- **前 3 秒钩子 Hook**：最强画面/冲突/疑问抓住注意力
- **卖点展示 Selling point**：产品核心功能/质感特写
- **证明动作 Proof**：使用前后/效果对比/真人反馈
- **运动**：快速运镜 + 特写切 + 节奏紧凑

## 6. 风格片（赛博/国风/动漫等）
- **风格词 Style**：cyberpunk / guofeng / anime…
- **对应运镜**：霓虹摇移（cyberpunk pan）、水墨缓推（guofeng slow dolly）、cel-shading 动态
- **色彩与光**：magenta-cyan contrast / ink wash / vibrant saturation

## 7. 通用兜底 (Fallback)
主体 + 环境 + 运动 + 光影 + 风格 + 技术参数（镜头/景深/帧率/分辨率）。

## ★ 一致性锚点字段（多镜头序列核心，Step 7 必填）

跨镜头人物/风格/物体一致性漂移是视频头号痛点。反推出一段好片后，后续镜头要能引用同一主体。
在分析块与输出包中建立：

```
【一致性锚点 Consistency Anchors】
命名主体 Named Subjects:
  - SUBJECT_A = [人物/物体名]: [外观锁定描述：发色/服饰/材质/比例]
  - SUBJECT_B = ...
风格锁 Style Lock: [2-3 个跨镜头重复的风格词，如 "16mm film grain, cinematic, desaturated"]
参考锚 Reference Anchors:
  - 首帧/参考图路径（image-to-video 用，锁脸/锁物）
  - 色彩分级语言（每 clip 重复："golden hour, warm tones, slight underexposure"）
seed 占位: [每段记 seed，便于锁定接近版做单维微调]

**双锚定规则（防跨镜头漂移的核心升级）**：
> 禁止单链式漂移——不要只在首镜定义锚点、后续镜只靠"共享风格词"隐式继承。
> 每个后续镜头 prompt 都必须**显式重嵌**两样：
> 1. **原始参考帧锁定描述（Original Lock）**：从首帧 / 参考图提炼的 1-2 句固定描述（如 "same male, short dark hair, black jacket"），逐镜重复；
> 2. **上一镜锚点 token（Prev-shot Token）**：承接上一镜的衔接锚（如 "continuous from shot 2, same location, same wardrobe"）。
> 即写成：`[Original Lock] + [Prev-shot Token] + [本镜新增内容]`。

**一致性铁律**：
- 跨镜头用**相同色彩/光影语言**与**2-3 个风格锚词**，不要每 clip 换一套。
- **双锚定硬编码**：每个镜头 prompt 都重嵌 Original Lock + Prev-shot Token，而非仅依赖共享风格词（风格词易在长序列里被模型遗忘）。
- 人物一致性最可靠做法：**image-to-video + 参考图**（Kling 最多 7 张 / 通义万相 character 引用 / Veo Ingredients to Video 最多 3 张）。
- 维护 **prompt log**：记下每个产出好片的 prompt，新 clip 从它改而非从零写。

## 可选类速查 (Optional Scenarios)
- **美食**：蒸汽光泽/视角/暖光/质感 + 慢推特写
- **汽车**：车漆反光/低角度/环境 + orbit 环绕 + 行驶模糊
- **时尚**：穿搭/面料垂感/姿势 + 手持跟拍/棚拍
- **宠物/动物**：毛发质感/眼神光/动态瞬间 + 跟拍
- **建筑**：线条几何/光层次/材质 + crane 升降/广角摇移
- **抽象/氛围**：camera move + 抽象元素 + 色彩 + 运动类型（swirling/flowing）
- **城市/街拍**：运镜穿梭（第一视角行走/轨道横移/低机位穿梭）+ 时间/天气/霓虹