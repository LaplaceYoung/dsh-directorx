# 端到端完整样例（Few-shot 锚定产出）

> **用途**：本文件是 AI 套用本 skill 时的「产出样板」。skil 规定了 9 块输出包，但**没有样板模型容易跑偏**。
> 下方给一份真实粒度的示例：用户给一段视频描述 → AI 交付完整 9 块。生成时**照此结构与密度**产出，
> 可低于此粒度（短视频/单镜头），但**不要遗漏块**、不要截断任一段 prompt。
> 这是本 skill 唯一一处端到端示例，其余 references 提供的是词表与话术，不替代此样例。

## 输入（用户给的）

- **视频**：10 秒，竖屏 9:16，夜晚雨后的赛博朋克街道；一个穿黑色长风衣的人从左向右走过霓虹招牌下；镜头缓慢右摇跟拍；湿地面有霓虹倒影；结尾人物走入巷子消失。
- **用户说**："给我惊艳版，赛博朋克，去可灵跑。"

## 输出包（AI 交付）

### 1. 视频分析块（Step 1）

| 时段 | 画面内容 | 运镜 | 主体运动 | 音频 |
|---|---|---|---|---|
| 0–3s | 人物入画左侧，霓虹招牌入镜 | 缓慢右摇 pan right | 从左向右走 | 雨声、远处电子乐 |
| 3–7s | 经过霓虹，湿地面倒影 | 右摇跟拍 | 匀速行走 | 脚步声渐清 |
| 7–10s | 人物拐入巷子出画 | 右摇收住 | 走入暗处消失 | 音乐渐弱 |

- 风格锚：青橙分离色调 / 体积雾 / 湿滑反光质感；情绪：冷峻、孤寂、电影感。
- 物理与逻辑：积水倒影连续、霓虹不闪烁为关键复现点。

### 2. 还原版 Prompt（Step 3，中英）

> 中文：夜晚雨后的赛博朋克街道，穿黑色长风衣的人物从画面左侧走向右侧、经过霓虹招牌，镜头缓慢向右摇移跟拍，湿地面有霓虹倒影，人物走入巷子后出画。9:16 竖屏，约 10 秒。

> EN: Night, rain-soaked cyberpunk street after rain. A figure in a long black trench coat walks from left to right past neon signs. Camera slowly pans right, tracking the figure. Wet pavement reflects neon. The figure turns into an alley and exits frame. Vertical 9:16, ~10s.

### 3. 惊艳增强版 Prompt（Step 4，核心）

> Cinematic cyberpunk tracking shot: a lone figure in a long black trench coat strides through a rain-slicked neon alley, magenta-cyan volumetric fog, glowing rim light, wet street reflections, slow right pan, shallow depth of field, anamorphic lens flare, teal-and-orange color grade, 24fps film look, subtle film grain. Smooth camera movement, stable continuity, realistic physics.
> — no morphing, no flickering, no extra limbs, no identity drift, no text drift, no warping.

### 4. 3 变体（Step 5，每次只改一维）

- **V1 构图 shift**：low-angle worm's-eye tracking up the trench-coat hem and neon signage, dramatic forced perspective.
- **V2 光影 shift**：practical neon key only, deep shadows, single hard magenta source, near-black background, no fill.
- **V3 风格 shift**：anime cel-shaded cyberpunk, vibrant saturation, clean lineart, glowing eyes, fluid motion.

### 5. 平台适配版（Step 6，可灵 Kling）

- 相机六轴：`Pan=+6`（右转跟拍）、`Vertical=0`、`Tilt=0`、`Roll=0`、`Zoom=-3`（略宽 FOV）、`Horizontal=0`；单轴先 ≤±7。
- 提示词（中文直写）：镜头缓慢向右摇移跟拍，雨夜赛博朋克街道，穿黑色长风衣的人物从左走向右、经过霓虹招牌，湿地面有霓虹倒影，人物走入巷子出画。电影感青橙色调，浅景深，24 帧胶片颗粒感。
- 负向：`不要变形，不要闪烁，不要多出的肢体，不要身份漂移，不要文字漂移，不要扭曲`。

### 6. 一致性锚点（Step 7，双锚定）

```
【一致性锚点 Consistency Anchors】
命名主体 Named Subjects:
  - CHAR_A = 穿黑色长风衣的人物：黑色及膝风衣、短黑发、冷白肤色
风格锁 Style Lock: "cyberpunk, teal-orange grade, volumetric fog"
参考锚 Reference Anchors:
  - 首帧路径（image-to-video 用，锁人）：frames/first.png
  - 调色语言（每 clip 重复）："teal-orange grade, wet neon reflections"
seed 占位: 8821

双锚定（每个后续镜头 prompt 都重嵌）：
  [Original Lock] same lone figure, long black trench coat, short dark hair
  [Prev-shot Token] continuous from previous shot, same neon alley, same wardrobe
```

### 7. 负向约束（视频专属）

`no morphing, no flickering, no jitter, no melting, no warping, no temporal distortion, no extra limbs, no deformed anatomy, no identity drift, no face changing between frames, no text drift, no garbled subtitles, no watermark`

### 8. 音频提示（可灵 2.6+ Audio Sync / 仅音频模型填）

- 环境音：rain on pavement, distant synthwave hum
- 音效：steady footsteps, neon hum
- BGM：tense lo-fi, matching slow pace
- 若目标模型不支持音频：本块标注"目标模型不支持音频，跳过"，不强行写。

### 9. 原创性边界说明

不锁定任何真实人物容貌（CHAR_A 为虚构形象）；霓虹招牌用虚构店名，不抄真实 logo / 品牌 / 受保护角色。符合 Step 0 责任护栏。

## 交付前自检（勾验，见 SKILL.md Step 7）

- [x] 9 块齐全、各段 prompt 未截断
- [x] 一致性锚点含双锚定（Original Lock + Prev-shot Token）
- [x] 涉及真实人物 / 未成年：本例为虚构形象，无冒充 / 克隆锁定