# 平台适配指南 (Platform Guides)

本文件对应 Step 6。把 Step 4 的「惊艳增强版 Prompt」转成目标视频引擎语法。
结构借鉴 `prompt-model-adaptation` 的五步法：**诊断 → 检查表 → 适配 → 回归验证 → 自优化**。

> **参数时效说明（发布核对日：2026-08）**：下列原生控件参数为 2026 年中公开文档核实值。视频平台迭代极快，
> 正式投产前请以各平台当前官方文档为准（尤其版本号、参数范围、时长上限）。
> 本文件给的是"结构正确、可直接套用"的语法，不是永久不变的 API 契约。

## 五步法在平台适配中的映射
1. **诊断 Diagnose**：识别目标平台语法特征（自然语言 / 指令标签 / 参数旗标 / 参考图机制）
2. **检查表 Checklist**：逐项核对该平台必含要素（运动是否需显式、负向怎么写、是否支持音频）
3. **适配 Adapt**：把通用英文提示词改写成平台语法
4. **回归验证 Regression**：在同一平台出片，核对是否还原惊艳方向 + 运动是否按要求
5. **自优化 Self-optimize**：根据出片偏差微调词块（参考 Step 8 迭代回路）

# 一、国内平台（优先级高）

## 1. 可灵 Kling（快手）— 国内首选，物理/运镜强
- **提示词公式**：`Subject(Details) + Movement + Scene(Background) + Cinematic Language + Lighting + Atmosphere`
- **相机控制六轴（API / 高级界面，范围 [-10, 10]）**：
  | 轴 Axis | 正值 Positive | 负值 Negative |
  |---|---|---|
  | Horizontal 水平 | 右移 | 左移 |
  | Vertical 垂直 | 上 | 下 |
  | Pan 摇 | 右转 | 左转 |
  | Tilt 俯仰 | 上俯 | 下俯 |
  | Roll 翻滚 | 顺时针 | 逆时针 |
  | Zoom 变焦 | 更短焦(更宽FOV) | 更长焦(更窄FOV) |
- **Motion Brush**：涂抹局部区域控制运动（头发/水流/火星）。
- **音频**：2.6+ 支持 AI Audio Sync（对话/音效/环境音写进 prompt）。
- **参考图 I2V**：最多 7 张参考图（O1），subject/face 参考类型锁脸锁衣。
- **模式**：std（快/省）vs pro（细节/1080p）；VIDEO 3.0 Omni 支持多镜头 storyboard。
- **提示样例**：`Camera slowly pushes in on a chef plating dessert to emphasize the final garnish, realistic kitchen lighting`
- **适配要点**：一个 clip 一主运动，避免冲突；中文文化内容（古建/街景）表现好。

## 2. 海螺 Hailuo（MiniMax）— 情感/微表情强
- **运镜指令语法（在 prompt 中直接写）**：
  `[左移] [右移] [左摇] [右摇] [推进] [拉远] [上升] [下降] [上摇] [下摇] [变焦推近] [变焦拉远] [晃动] [跟随] [固定]`
- **组合运镜**：同组 `[]` 内多指令（建议 ≤3），如 `[左摇,上升]`；顺序运镜用"然后"，如 `…[推进], 然后…[拉远]`。
- **自然语言**：也支持，但标准指令更准。
- **规格**：768P/1080P，6s/10s；擅情感表达、人物微表情、画面连贯。

## 3. 即梦 Jimeng（字节）— 中文语义强，中国风
- **中文创作**：语义理解好，擅长古风/山水意境。
- **首尾帧**：支持首帧图 + 尾帧图输入，增强可控性。
- **运镜**：自然语言（如"镜头高度1.6米,匀速前推,速度0.8米/秒,焦段24毫米"）或指令式。
- **Seedance 2.0**：多模态混合输入，最多参考 12 个文件。
- **适配要点**：中文提示词直接写，不必硬翻英文；运镜尽量给"机位高度 + 速度 + 焦段"。

## 4. 智谱清影 CogVideoX（智谱）— 开源/免费，结构化
- **基础公式**：`主体 + 场景 + 运动`
- **进阶公式**：`主体(描述) + 场景(描述) + 运动(描述) + 美学控制 + 风格化`
- **复杂结构**：`[镜头语言] + [光影] + [主体(描述)] + [主体运动] + [场景(描述)] + [情绪/氛围/风格]`
- **简单结构**：`[摄像机移动] + [建立场景] + [更多细节]`
- **规格**：约 6s；文生/图生；官网有"帮你写提示词"智能体。

## 5. 通义万相 Wan（阿里）— 多镜头/参考生视频/音频
- **文生公式**：`主体 + 场景 + 运动`；进阶加 `美学控制 + 风格化`。
- **图生视频公式**：`运动 + 运镜`（"镜头推进" / "固定镜头"强调不动）。
- **声音公式（wan2.7/2.6/2.5）**：`主体 + 场景 + 运动 + 声音描述`
  - 人声 = 角色说话内容 + 情绪 + 语调 + 语速 + 音色 + 口音
  - 音效 = 音源材质 + 行为 + 环境音
  - BGM = 配乐 + 风格
  - 无台词：`无台词` / `No dialogue.`　无BGM：`无背景音乐` / `No background music.`
- **多镜头公式**：`总体描述 + 镜头序号 + 时间戳 + 分镜内容`
  - 例：`第 1 个镜头[0-3秒]一个男孩独自坐着… 第 2 个镜头[4-6秒]硬切转场,固定机位…`
  - 单镜头强调：`生成单镜头` / `Generate single shot.`
- **参考生视频**：`参考指代(图n/视频n) + 动作 + 场景 + 台词(可选) + 背景音乐(可选)`
  - 用 `character1` 等引用参考主角（最多 3 个），实现行为精准控制。
- **prompt_extend**：启用自动优化简短宽泛提示词。

# 二、国际平台

## 6. Sora（OpenAI）— 电影感/复杂场景/物理
- **提示结构**：`[Camera movement] shot of [subject] [action/motion] in [setting], [lighting], [mood], [style]`
- **强项**：cinematic quality、复杂场景、理解 film terminology（aspect ratio / lens / film stock）、物理与空间关系。
- **时长**：up to 60s；理解自然语言好，适合把分析块全展开。
- **适配示例**：`Slow dolly-in shot of a woman walking through a neon-lit Tokyo alley at night, rain reflecting city lights on wet pavement, cinematic color grading, shallow depth of field, 24fps film look`

## 7. Runway（Gen-3 / Gen-4.5）— 一致运动/迭代编辑
- **强项**：consistent motion、professional quality、迭代编辑工作流。
- **Motion Brush**：精确控制"什么在动"（局部运动笔刷）。
- **Camera presets** + image-to-video + text-to-video。
- **时长**：up to 10s per generation。
- **适配示例**：用 Motion Brush 标出"只让头发飘"，其余锁定。

## 8. Veo 3 / 3.1（Google）— 原生音频（对话+音效+环境音）
- **原生音频**：一次性生成同步音频（dialogue / SFX / ambient），无需后期。
- **提示结构（75–125 词，5 块）**：`camera, subject, action, setting, style and audio`。
  - 音频：对话用引号、命名 ≤2 个音频事件、环境声。
  - 例：`A barista leans on the counter and says "Warm today?" Warm voice, espresso-machine hiss behind, 8 seconds.`
- **Ingredients to Video**：上传最多 3 张参考图锁角色（一致性最强升级）。
- **规格**：8s base；Scene Extension 链式最长 140s；720p/1080p/4K；竖屏 9:16 原生。
- **迭代铁律**：每段只改一块（swap camera / sharpen lighting / trim tone），不整段重写。
- **水印**：每段带 SynthID。

## 9. Luma — 自然运动/物理
- 自然运动与物理模拟稳；支持 image-to-video / text-to-video。
- 提示结构同通用公式，强调 `smooth realistic motion`。

## 10. Pika 2.0 — 风格化/创意特效
- 强项：stylized、creative effects、image-to-video。
- 趣味效果：inflate / melt / explode / crush。
- 时长：3–5s（effects-focused）；适合作品局部特效而非整片。

# 三、原生控件映射表（运动维度 → 平台控件 → 参数建议值）

| 运动意图 | 可灵 Kling | 海螺 Hailuo | 即梦 Jimeng | Runway | Veo / Sora |
|---|---|---|---|---|---|
| 推近 dolly in | Zoom 负值 / prompt "push in" | `[推进]` | "镜头前推" | Motion Brush / preset | "dolly in" / "push in" |
| 拉远 pull out | Zoom 正值 / "pull back" | `[拉远]` | "镜头后拉" | preset | "pull back" |
| 左摇 pan left | Pan 负值 | `[左摇]` | "镜头左摇" | preset | "pan left" |
| 右摇 pan right | Pan 正值 | `[右摇]` | "镜头右摇" | preset | "pan right" |
| 上升 crane up | Vertical 正值 / "rise" | `[上升]` | "镜头上升" | "crane up" | "crane shot up" |
| 下降 crane down | Vertical 负值 | `[下降]` | "镜头下降" | "crane down" | "crane shot down" |
| 环绕 orbit | prompt "orbit shot" | `[跟随]`+自然语言 | "环绕拍摄" | "orbit" preset | "orbit shot" |
| 手持晃动 handheld | prompt "handheld, slight shake" | `[晃动]` | "手持晃动" | preset | "handheld" |
| 固定锁定 static | prompt "static camera" | `[固定]` | "固定镜头" | preset | "locked-off shot" |
| 局部运动 localized | **Motion Brush** | 暂主要靠 prompt | 图生局部 | **Motion Brush** | prompt 描述局部 |

> 可灵六轴数值建议：单轴强度先试 ±5~±7，避免 ±10 过猛导致失控；多轴组合 ≤2 个。

# 四、平台选择 / 模型路由建议（Step 8 用）

- **运镜控制 / 高性价比批量** → 可灵 Kling（物理/运镜强，免费额度，成本低）
- **情感叙事 / 人物微表情** → 海螺 Hailuo
- **中国风 / 中文语义** → 即梦 Jimeng / 智谱清影
- **多镜头连贯叙事 / 参考生视频** → 通义万相 Wan（多镜头公式 + character 引用）
- **原生音频 / 音频优先成片** → Veo 3（对话+音效+环境音一次生成）
- **电影感 / 复杂场景 / 长片** → Sora（up to 60s，物理空间理解好）
- **一致运动 / 迭代编辑 / 局部运动笔刷** → Runway（Motion Brush）
- **风格化特效** → Pika
- **一段一模型路由**：某段 A 模型做砸，路由到该项更强模型（如运镜段→可灵，音频段→Veo3）。