# 自然光：术语详解 + AI 理解与实现（Natural Light — Deep Terms & AI Implementation）

> 本页是 DirectorX 自然光手册（深化版）：以真实电影的摄影专业技巧为知识本体（Kubrick 自然主义/黄金蓝调时刻/窗光/读太阳/控光），**每个术语详解其具体内容**（光线实际长什么样、色温/方向/强度数值、真实片例如何用），并给出 **AI 如何理解与实现**（模型视角下的光线难点、提示词模板、生成后检查）。面向 AI 生成制作。
> 来源：FilmLocal 自然光大师指南、Fiction Horizon 自然光电影案例、PhotoPills 魔法时刻、BOLD 自然光摄影课。

## 概述

**电影级自然光原则**（Kubrick）："因为我们就是这样看世界的。"自然主义光线对真实的坚持塑造了现代摄影趋势。

**自然光三大特性**（决定一切处理）：
1. **色温全天变化**：晨冷（约 4000K）→ 正午中性（5500K）→ 黄金时刻暖（3000-3500K）→ 蓝调时刻冷蓝（8000-10000K）；
2. **强度随天气变化**：直射（硬光，反差大）vs 云层散射（软光，反差小）；
3. **方向影响构图**：光位决定主体造型——顺光平、侧光立体、逆光勾形。

**为什么电影摄影师选自然光**：真实感（观众即刻连接）+ 不可预测性带来的独特创作机会 + 现代数字相机宽容度允许少灯拍摄。

## 术语详解一：黄金时刻 Golden Hour

### 是什么
日出后/日落前约 1 小时的窗口期——太阳低垂，光线穿过更厚大气层。

### 具体内容（光线实际长什么样）
- **色温**：3000-3500K 暖黄（正午 5500K 中性）——肤色在暖光下最美；
- **影子**：拉长（低角度光源）——画面有方向性的几何感；
- **反差**：低——光线柔和，无硬影，高光与暗部都能保留细节；
- **逆光/轮廓光**：人物背对太阳时，脸自然受环境反射补光，边缘形成金色轮廓光（rim light）——人像最经典的用法；
- **电影案例**：《天堂之日》（Malick 几乎全片黄金时刻拍摄——为等光不惜超支）、《生命之树》。

### AI 如何理解与实现
- **模型视角**：模型对 `golden hour` 有统计先验（暖色+低角度），但**不会自动保证**影子方向与光源一致——必须显式描述；
- **提示词模板**（光条件四要素：色温+方向+质感+阴影）：
  ```
  golden hour, low warm sun from the west, backlit subject, golden rim light on hair and shoulders, long soft shadows stretching toward camera
  ```
- **检查**：①肤色是否自然偏暖（过饱和=模型加过头）②影子方向是否与"太阳在画面外位置"一致（→ 40 光线跳变审查）③轮廓光是否只在一侧（双侧=假）；
- **关键纪律**：写 `golden hour` 之外必须写**具体方向**——`low sun from the west`，否则模型随机摆放光源。

## 术语详解二：蓝调时刻 Blue Hour

### 是什么
日落后 20-40 分钟的短暂窗口——太阳在地平线以下，天光为冷蓝色。

### 具体内容（光线实际长什么样）
- **色温**：8000-10000K 冷蓝（比月光更蓝）——安静/忧郁氛围；
- **光量**：极低——物体轮廓柔化，暗部深蓝；
- **城市灯光对比**：暖色路灯/窗户亮起，与冷蓝天光形成**冷暖对比**——画面里最值钱的元素；
- **挑战**：窗口极短（约 20-40 分钟）——实拍要提前就位快速捕捉；
- **电影案例**：夜戏黎明拍——17 部电影案例：为"夜晚感"在黎明拍，利用黎明蓝光+欠曝（night-for-dawn）。

### AI 如何理解与实现
- **模型视角**：模型容易把 `blue hour` 生成成"夜晚"（全黑）或"冷调白天"——需要**成分描述**锁定；
- **提示词模板**：
  ```
  blue hour, deep blue ambient sky light, silhouette of buildings, warm city lights turning on in background, cold-warm color contrast, dim but visible details
  ```
- **检查**：①画面是否仍能看清主体轮廓（全黑=模型跑成夜景）②冷暖对比是否存在（没有城市灯=缺焦点）③噪点感是否被模型夸张；
- **AI 的优势**：AI 没有时间窗口限制——蓝调时刻素材可随时生成，且可无限次重试光量（实拍只有一次机会）。

## 术语详解三：窗光 Window Light（室内自然光主力）

### 是什么
透过窗户进入室内的自然光——室内人像/对话场景的首选主光。

### 具体内容（光线实际长什么样）
- **方向性**：单一方向主光（窗户位置）——面部一侧亮一侧暗，立体感；
- **柔化**：窗面积大→光源大→阴影边缘软；直射阳光入窗=硬光高反差；
- **衰减**：距离窗户越远光越弱——**近窗亮远窗暗**的渐变是空间感来源；
- **专业零成本技巧**：大窗旁+对侧反光板（或白墙反射）=电影级柔和主光；
- **电影案例**：《燃烧女子的肖像》（全片窗光/烛光自然主义）、《请以你的名字呼唤我》。

### AI 如何理解与实现
- **模型视角**：模型默认室内光是"均匀照明"——不写方向就得到平光；且**多窗口场景**模型常生成多个不一致阴影；
- **提示词模板**（方向+柔化+衰减三件套）：
  ```
  soft window light from camera left, diffused through sheer curtains, gentle falloff into shadow on the right side of the face, single light source
  ```
- **检查**：①全脸是否只有一组阴影方向（多组=模型多光源幻觉）②窗框投影是否合理（窗帘花纹投影是真实感的标志）③阴影边缘是否软（直射=写错条件）；
- **修复**：阴影方向不一致时，在提示词里加 `single light source` 并重生成。

## 术语详解四：阴天 Overcast（免费扩散器）

### 是什么
云层覆盖的天气——太阳被云层散射成大面积柔和光源。

### 具体内容（光线实际长什么样）
- **质感**：云层=天然柔光箱——人像肤质柔和，无硬影，阴影极浅；
- **色温**：中性偏冷（云层过滤暖光）；
- **代价**：画面少纵深（无方向性影子）——需要构图弥补（前景/层次/色彩对比）；
- **使用场景**：不需要戏剧性光线的日戏、访谈、群像。

### AI 如何理解与实现
- 提示词模板：`overcast day, soft diffused light, no harsh shadows, muted tones, flat lighting on faces`；
- **AI 的坑**：模型常给"阴天"加无中生有的方向影——加 `no harsh shadows` 显式压制；
- 检查：阴影是否几乎消失；肤色是否偏冷（可后期统一）。

## 术语详解五：负填充 Negative Fill

### 是什么
用黑布/旗板**移除**多余环境光，增加对比与深度（控光=移除与添加）。

### 具体内容（现场怎么做）
- 黑旗/黑布放在主体受光侧的对面，挡住环境反射光→阴影侧更暗；
- 对比度提升=主体从背景中"立起来"；
- 与反光板（添加光）相反：**先定环境曝光，再逐步加补光直到阴影自然**（专业顺序）。

### AI 如何理解与实现
- 提示词：`negative fill on the shadow side, deep shadow on camera right, high contrast but detail retained in shadows`；
- 模型视角：模型对"暗部"倾向压死成死黑——`detail retained in shadows` 防丢失；
- 检查：阴影侧是否仍有纹理（死黑=负填充过头，→ 36 后期可捞回一部分）。

## 术语详解六：读太阳 Reading the Sun（专业规划）

### 是什么
实拍前预判太阳路径与光位——决定场景怎么拍、什么时间拍。

### 具体内容（专业方法）
1. **太阳路径 app**（Sun Surveyor 类）：查日出日落时间/黄金时刻窗口/影子移动方向；
2. **踩点**：在计划拍摄的确切时间到场地，看太阳与建筑/窗户如何互动（上午 9 点窗光进哪个方向，下午 3 点谁在阴影里）；
3. **灯光日程**：黄金时刻戏排在黄金时刻——提前到场等光；
4. **天气应急预案**：室内备份场景+天气监控员——阴天可利用但无暖感。

### AI 如何理解与实现
- **AI 不需要等光，但需要"光的一致性"**——把"光源方向"当全局常量：全片所有场景提示词统一写 `sun from the west` / `window on camera left`；
- **实现**：在分镜 JSON 里给每个场景加 `light_direction` 字段（→ 48 契约），批量生成时模板注入——**这是"读太阳"的 AI 等价物**（→ 45 Look Stack 光线层）；
- 检查：跨镜对比影子方向（→ 40 光线跳变清单）。

## 术语详解七：正午硬光与夜戏黎明拍

### 正午硬光 Harsh Midday Sun
- **具体内容**：顶光（正午太阳高挂）、高反差、深影子、肤色泛白；
- **实拍处理**：欠曝 1-2 档保高光细节，暗部信息留给后期；
- **AI 实现**：`harsh midday sun, top-down light, high contrast, deep shadows, underexposed highlights saved`——检查高光是否爆白。

### 夜戏黎明拍 Night-for-Dawn
- **具体内容**：夜戏在黎明拍——利用黎明蓝光+欠曝获得"夜晚感"，演员状态好、无需夜间打灯；
- **AI 实现**：`night-for-dawn, deep blue darkness, dim city glow, silhouettes`——检查主体是否可见（全黑=过度）。

## AI 工作流应用（自然光场景生产）

```
① 拉片：从自然光电影提取光线风格帧（→ 83/28 风格流派）
② 光条件 → 提示词（本页每节模板；光四要素：色温+方向+质感+阴影）
③ 统一：分镜 JSON 注入 light_direction 常量（→ 48/45）
④ 双通道：Pass 1 静帧定光（→ 73）；Pass 2 运动保持光线描述一致
⑤ 审查：色温一致性/影子方向一致/高光暗部保留（→ 40）
⑥ 后期兜底：LUT 统一（→ 36）
```

## 常见错误

1. 光线描述每镜不一致：色温/影子方向跳变——光源方向必须是全剧常量。
2. 只写 `cinematic` 不写光条件：模型给随机光（→ 73 五大致命错误）。
3. 正午硬光不处理：高光爆掉。
4. 蓝调时刻当夜景拍：全黑无主体。
5. 窗光不写方向：平光无立体感。
6. 多光源幻觉不压制：多组阴影穿帮。
7. 忽略负填充：暗部死黑或全平。

## 术语表（中英对照，含具体内容与 AI 实现）

| 中文 | English | 具体内容（光线长什么样） | AI 实现要点 |
|---|---|---|---|
| 黄金时刻 | Golden Hour | 3000-3500K 暖/低角/长影/轮廓光 | 显式写方向；检查影子一致性 |
| 蓝调时刻 | Blue Hour | 8000-10000K 冷蓝/城市灯冷暖对比 | 成分描述防"生成成夜晚" |
| 窗光 | Window Light | 单方向主光/柔化/衰减渐变 | 方向+柔化+衰减三件套；压制多光源 |
| 阴天 | Overcast | 云层散射/无硬影/低对比 | `no harsh shadows` 显式压制 |
| 负填充 | Negative Fill | 黑布移除光/增对比 | `detail retained in shadows` 防死黑 |
| 读太阳 | Reading the Sun | 预判光位/踩点/灯光日程 | light_direction 全局常量字段 |
| 正午硬光 | Harsh Midday Sun | 顶光/高反差/深影 | 欠曝保高光描述 |
| 夜戏黎明拍 | Night-for-Dawn | 黎明蓝光拍夜 | 防全黑：保留轮廓 |
| 轮廓光 | Rim Light | 逆光勾形/边缘金色 | 只写一侧（双侧=假） |
| 光方向一致 | Light Continuity | 影子方向统一 | 分镜 JSON 注入+跨镜审查 |
| 散射光 | Diffused Light | 大面积柔光源 | 阴影边缘软=正确 |
| 魔法时刻 | Magic Hour | 黄金+蓝调合称 | 两者是不同的提示词 |

## 来源

- FilmLocal: How to Master Natural Light in Film — Pro Cinematographer's Guide — https://filmlocal.com/filmmaking/how-to-master-natural-light/
- Fiction Horizon: 20 Films with the Most Beautiful Use of Natural Light — https://fictionhorizon.com/films-with-the-most-beautiful-use-of-natural-light/
- Fiction Horizon: 17 Movies That Filmed Night Scenes Entirely at Dawn — https://fictionhorizon.com/17-movies-that-filmed-night-scenes-entirely-at-dawn/
- PhotoPills: Mastering Golden Hour, Blue Hour (Magic Hours) and Twilights（色温/窗口数值） — https://www.photopills.com/articles/mastering-golden-hour-blue-hour-magic-hours-and-twilights
- BOLD University: Natural Light Cinematography Guide（读太阳/负填充/扩散） — https://www.boldcine.com/university/lessons/natural-light-cinematography
- Indie Shorts Mag: Ultimate Guide to Natural Light in Cinematography — https://www.indieshortsmag.com/tutorials/production/2026/01/ultimate-guide-to-natural-light-in-cinematography/
- FrameThrower: Natural Light in Film — Real Examples — https://framethrower.ai/style/natural-light