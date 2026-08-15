# 灯光与色彩（Lighting & Color）

> 本页是 DirectorX 灯光色彩知识库：布光体系、光质与色温、电影调色、色彩心理学、常见电影调色风格与 AI 生成应用。每个概念含定义、参数、示例。
> 来源：Wikipedia Three-point lighting、Noam Kroll 调色心理学、ARRI 灯光手册要点、行业标准色彩理论。

## 概述

灯光（Lighting）决定"观众看到什么"，色彩（Color）决定"观众感觉什么"。Noam Kroll 的观点：**色彩在观众体验中的影响力仅次于配乐**——技术准确只是起点，调色必须"表达情绪、与故事和声"。

两条核心原则：
1. **布光是叙事工具**：光的方向、软硬、明暗比（Contrast Ratio）直接塑造空间、时间与情绪（高反差 = 紧张，低反差 = 梦幻）。
2. **调色先有意图**：在打开调色软件之前，先在脑中想清楚画面要传达的情绪（暖=舒适，冷=疏离），再动手——避免"无方向地推色轮"。

## 布光体系（Lighting Setup）

### 1. 三点布光（Three-Point Lighting，维基百科标准）
| 灯位 | 位置 | 作用 | 相对强度 |
|---|---|---|---|
| 主光 Key Light | 主体前方侧向（约 30-45° 偏侧、略高于视线） | 主要照明，决定整体光效设计 | 100% 基准 |
| 辅光 Fill Light | 主光对侧、较低（面部高度） | 照亮阴影面，降低反差（消除鼻影等） | ≤ 主光 50%（越弱反差越大） |
| 背光 Back Light | 主体后方（侧后） | 勾勒轮廓（Rim Light），把主体从背景分离、突出轮廓 | 视需要 |

- **辅光的替代**：反光板（白色卡纸/白墙）反射主光即可，效果更柔和。
- **不加辅光 = 故意的高反差**（低调光 Low-key 的基底）。
- **四点布光**：加背景光（Background Light）照亮背景，消除前景阴影、增加空间纵深。

### 2. 光质（Light Quality）
| 光质 | 成因 | 效果 | 用途 |
|---|---|---|---|
| 硬光 Hard Light | 小面积光源（直射阳光、裸灯） | 阴影边缘锐利、轮廓分明 | 戏剧性、悬疑、男性化、时代感 |
| 软光 Soft Light | 大面积光源（柔光箱、窗户、散射） | 阴影柔和过渡、皮肤细腻 | 自然、唯美、人物美化、口播 |

**光源越大越软**：柔光箱、白墙反射、纱帘后的窗户都是"大面积光源"。

### 3. 色温（Color Temperature）
- 单位：开尔文（K）。**数字越低越暖（橙红），越高越冷（蓝）**——与直觉相反。
- 常用基准：烛光 ~1800K、白炽灯 2700-3200K、日光 5500-6500K、阴天/阴影 6500-7500K、电子屏幕 ~6500K。
- **混合色温控制**：室内窗光（蓝）与灯泡（橙）混合产生"暖冷对比"，是电影感的常用手段——人物暖、背景冷，主体自然突出。
- **白平衡（White Balance）**：相机以光源色温为基准校正，让"白"呈现为白；调色阶段可反其道而行——故意偏暖/偏冷传达情绪。

### 4. 经典布光风格（可复用提示词词汇）
| 风格 | 特征 | 情绪/用途 | 英文关键词 |
|---|---|---|---|
| 伦勃朗光 Rembrandt | 面部一侧三角形亮斑 | 古典、肖像、质感 | Rembrandt lighting, triangle of light |
| 蝴蝶光 Butterfly | 鼻下蝴蝶形阴影（高位正面光） | 时尚、女神、美颜 | butterfly lighting, high frontal key |
| 侧光/分割光 Split | 半脸亮半脸暗（90° 侧光） | 神秘、分裂、黑暗面 | split lighting, side key |
| 环形光 Loop | 鼻影略偏不触唇（主光 30-45° 略高） | 自然人像默认 | loop lighting |
| 顶光 Top | 光从正上方 | 压抑、审问、无助 | top light, overhead |
| 底光/鬼光 Under | 光从下方 | 恐怖、反派、诡异 | underlighting, ghoul lighting |
| 背光剪影 Silhouette | 主体全暗、背景亮 | 神秘、象征、浪漫 | backlit silhouette |
| 低调光 Low-key | 大反差、大面阴影 | 悬疑、黑色电影（Noir） | low-key lighting, chiaroscuro |
| 高调光 High-key | 明亮、低反差、少阴影 | 喜剧、广告、清新 | high-key lighting |
| 霓虹光 Neon | 霓虹灯彩色光（粉/蓝/紫） | 赛博朋克、都市夜、潮流 | neon lighting, practical neon |

### 5. 实用布光配方
- **口播博主**：主光（柔光箱 45°）+ 辅光/反光板 + 背光（发丝光）→ 干净、亲和。
- **产品广告**：主光 + 顶光（轮廓）+ 背景光（干净白/彩）+ 产品正面补光 → 通透、质感。
- **采访双人**：每人一组三点光，背景光统一；避免"一半脸黑"。
- **夜景戏（低成本）**：一盏灯 + 大面积阴影 + 少量 practical（台灯/路灯）→ 明暗比大，氛围立现。
- **自然光优先**：窗光是现成软光——人物朝向窗户、反光板补暗面。

## 电影调色（Color Grading）

### 调色管线（Pipeline）
1. **色彩校正（Correction）**：白平衡正确、曝光正确、肤色自然——"准确"是第一优先级（白是白、黑是黑、无偏色）。
2. **风格化调色（Grade）**：在准确的基础上推色温/饱和度/对比度，塑造情绪。
3. **输出（Delivery）**：按交付标准（Rec.709 SDR / HDR）导出。

### 调色变量与情绪（Noam Kroll 框架）
| 变量 | 暖/高 | 冷/低 |
|---|---|---|
| 色温 Color Temperature | 温暖、亲和、浪漫；复古（sepia 暗示旧时代） | 疏离、临床、冷峻；科幻（蓝紫 = 未来） |
| 饱和度 Saturation | 活力、扩张、世界感（Mad Max 彩色版；《春假》过度饱和 = 放纵） | 压抑、聚焦、人物感（去饱和让视线回到主体；黑白最戏剧） |
| 对比度 Contrast | 高对比 = 张力、黑色电影、惊悚 | 低对比 = 梦幻、柔化、悬离（milky blacks / lifted blacks 的"牛奶黑"） |

### 组合原则
- **中性平衡 = 真实**：纪录片与写实叙事用中性调色（客观性），风格化越重，观众越愿意"出戏进入想象世界"。
- **反用技巧**：暖色营造虚假安全感再被剧情推翻（误导）；冷色场景中的一点暖 = 希望。
- **肤色纪律**：风格化调色时肤色是最后防线——肤色偏到青绿/土黄会让观众不适（"尸体感"）。
- **局部强调**：Power Window/跟踪遮罩只调整局部（让主体比背景稍暖/稍亮），而不是全局推色。

### 常见电影调色风格
| 风格 | 特征 | 示例 |
|---|---|---|
| 青橙（Teal & Orange） | 阴影青蓝 + 肤色/高光橙 | 动作大片标准配方（互补色增强主体分离） |
| 去饱和灰调（Muted） | 低饱和、中低对比 | 《疯狂的麦克斯4》废土、《谍影重重》冷灰 |
| 暖复古（Sepia/Warm） | 暖棕、低对比、颗粒 | 回忆段落、年代戏 |
| 冷科幻（Cool Sci-fi） | 蓝紫、高对比、金属感 | 《银翼杀手》《沙丘》部分段落 |
| 高饱和绚丽（Vivid） | 饱和拉满、高对比 | 广告、旅游、动画感真人 |
| 黑白（B&W） | 去色 + 光影重构 | 《辛德勒的名单》《罗马》 |

## 色彩心理学速查（Color Psychology）

| 颜色 | 普遍联想 | 影视用途 |
|---|---|---|
| 红 | 激情、危险、暴力、爱 | 警告、杀戮、欲望、品牌强调 |
| 蓝 | 冷静、孤独、科技、忧郁 | 夜、医院、科幻、悲伤 |
| 绿 | 自然、嫉妒、不安、毒 | 森林、监视（Matrix）、病态 |
| 黄/橙 | 温暖、能量、警示、复古 | 希望、日落、危险标识 |
| 紫/粉 | 神秘、梦幻、过度 | 幻想、霓虹夜、酷儿文化表达 |
| 白 | 纯净、空无、未来 | 天堂、医院、极简 |
| 黑 | 权力、死亡、未知 | 反派、阴影、庄重 |

**注意**：色彩联想有文化差异（东方白色 = 丧事、红色 = 喜庆）——面向特定受众时先确认文化语境。

## 灯光术语表（中英对照）

| 中文 | English | 一句话定义 |
|---|---|---|
| 主光 | Key Light | 主照明光源 |
| 辅光 | Fill Light | 阴影补光 |
| 背光 | Back Light | 轮廓光 |
| 背景光 | Background Light | 背景照明 |
| 轮廓光 | Rim Light | 边缘勾勒光 |
| 硬光 | Hard Light | 锐利阴影 |
| 软光 | Soft Light | 柔和过渡 |
| 色温 | Color Temperature | 光线冷暖（K） |
| 白平衡 | White Balance | 白色基准校正 |
| 明暗比 | Contrast Ratio | 亮部暗部比例 |
| 低调光 | Low-key Lighting | 大反差暗调 |
| 高调光 | High-key Lighting | 明亮低反差 |
| 伦勃朗光 | Rembrandt Lighting | 三角亮斑肖像光 |
| 蝴蝶光 | Butterfly Lighting | 鼻下蝶影时尚光 |
| 分割光 | Split Lighting | 半明半暗 |
| 顶光 | Top Light | 上方压迫光 |
| 底光 | Underlighting | 下方恐怖光 |
| 剪影 | Silhouette | 全暗主体 |
| 反光板 | Reflector | 补光工具 |
| 柔光箱 | Softbox | 大面积柔光源 |
| 明暗对照 | Chiaroscuro | 强明暗绘画式用光 |
| 场景光 | Practical Light | 画面内可见光源 |
| 灯具 | Fixture | 灯光设备 |

## 调色术语表（中英对照）

| 中文 | English | 一句话定义 |
|---|---|---|
| 调色 | Color Grading | 风格化色彩 |
| 色彩校正 | Color Correction | 技术性修正 |
| 色相 | Hue | 颜色种类 |
| 饱和度 | Saturation | 色彩浓度 |
| 亮度 | Luminance | 明暗程度 |
| 对比度 | Contrast | 明暗差 |
| 色温偏 | Color Cast | 整体偏色 |
| 黑电平 | Lift / Blacks | 暗部调整 |
| 伽马 | Gamma / Midtones | 中间调 |
| 增益 | Gain / Whites | 亮部调整 |
| 肤色线 | Skin Tone Line | 肤色保持参考 |
| 矢量示波器 | Vectorscope | 色彩方向监测 |
| 波形图 | Waveform | 亮度分布监测 |
| LUT | Look-Up Table | 色彩查色表 |
| 青橙 | Teal & Orange | 互补色配方 |
| 去饱和 | Desaturation | 降低饱和度 |
| 牛奶黑 | Milky Blacks | 抬升黑电平柔化 |
| 高光滚降 | Highlight Roll-off | 高光柔化过渡 |
| 遮罩 | Power Window | 局部调整区域 |
| 风格化 | Stylization | 主观视觉风格 |
| 监视器 | Reference Monitor | 校准显示设备 |

## 在 AI 视频生成中的应用

1. **提示词光线字段**（对应 DirectorX prompt-engineering 语法）：`lighting: [主光类型] + [辅光/反光] + [背光/轮廓] + [色温] + [风格]`。
   - 例：`Rembrandt lighting, warm key from window, soft fill, cool rim light, golden hour tones`
   - 例：`low-key noir lighting, hard side key, deep shadows, blue-green cast`
2. **色彩提示词**：`color palette: [主色系] with [强调色] accents, [饱和/去饱和], [高/低对比], teal and orange grade`。
3. **一致性**：同一场景/角色保持同一套光线词（方向、色温、软硬），避免镜头间光线漂移（对应 continuity ledger）。
4. **生成后检查**：肤色是否自然、阴影方向是否一致、风格是否过度（先校正后风格）。
5. **风格参考**：用"电影名/导演 + 色彩词"锚定风格（`in the style of Blade Runner 2049, cool teal shadows, warm neon accents`），注意版权边界——风格参考而非直接复制画面。

## 常见错误

1. 只有主光没有辅光/背光：人脸一半黑、背景贴脸（除非故意 Low-key）。
2. 色温混用无控制：白平衡错乱，画面"脏"。
3. 全部镜头硬光：阴影锐利刺眼，人物显老。
4. 肤色偏色：风格化过度，观众不适。
5. 全局推色无重点：整个画面一个色，失去层次。
6. 高对比滥用：张力拉满 = 观众疲劳。
7. 调色跳过校正直接风格化：基础不对，风格是"脏"的。
8. AI 光线不一致：不同镜头光方向/色温漂移。

## 来源

- Wikipedia: Three-point lighting — https://en.wikipedia.org/wiki/Three-point_lighting
- Noam Kroll: The Psychology of Color Grading & Its Emotional Impact — https://noamkroll.com/the-psychology-of-color-grading-its-emotional-impact-on-your-audience/
- ARRI Lighting Handbook（中文） — https://www.arri.com/resource/blob/83990/9d652bdf4480124850df62b824f2d47e/arri-lighting-handbook-chinese-data.pdf
- Rosco: The Basics of Film Lighting — https://spectrum.rosco.com/the-basics-of-film-lighting
- StudioBinder: Three-Point Lighting Setup（索引） — https://www.studiobinder.com/blog/three-point-lighting-setup/
- Maurizio Mercorella: Teal and Orange Analysis — https://www.mauriziomercorella.com/color-grading-blog/color-grading-teal-and-orange-analysis-of-a-look