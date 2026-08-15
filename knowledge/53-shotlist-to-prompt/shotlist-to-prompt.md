# 镜头表→提示词转换器（Shot List → Prompt Translation）

> 本页是 DirectorX 镜头表到提示词转换手册：转换器原理、摄影语言→提示词的映射表（景别/角度/运镜/光线/镜头感）、模型适配语法差异、三步转换工作流、开源工具生态、自建转换器规范。
> 来源：Crevas 转换器（7.5 万+ 镜头表转换）、GitHub shotlist-forge / Seedance ShotDesign、OpenCreator 多机位拆解。

## 概述

**镜头表→提示词转换器**：把传统摄影笔记（Excel 镜头表/制作文档/分镜描述/手写笔记）转成针对特定 AI 视频模型优化的提示词——保留创作意图，同时最大化每个模型的强项。

**核心价值**：
1. **摄影语言理解**：不只是替换词——AI 理解"Dutch angle=张力、dolly zoom=迷失、golden hour=温暖"，并把创作选择翻译成模型能执行的语言；
2. **一份镜头表，多模型输出**：Sora 的自然运动描述风格、Veo 的电影语言、Kling 的技术相机参数——同一镜头表生成多份模型特定提示词；
3. **创意意图守恒**：'low angle hero shot' 在所有模型中都变成强调力量与支配的提示词；'handheld, shaky' 变成动态紧迫的运动描述。

## 摄影语言 → 提示词映射表（转换核心）

### 景别映射
| 镜头表术语 | 提示词表达 |
|---|---|
| 特写 CU | `extreme close-up on the eyes, shallow depth of field` |
| 近景 MS | `medium close-up, chest-up framing` |
| 中景 WS→MS | `medium shot, waist-up framing` |
| 全景 WS | `wide establishing shot, full body in frame` |
| 大远景 | `extreme wide shot, tiny figure against vast landscape` |
| 过肩 OTS | `over-the-shoulder shot from behind the character` |

### 角度映射
| 镜头表术语 | 提示词表达 |
|---|---|
| 低角度 | `low-angle shot looking up, subject towering, sense of power` |
| 高角度 | `high-angle shot looking down, subject diminished, vulnerable` |
| 荷兰角 | `dutch angle, tilted frame, tension and unease` |
| 俯拍 | `top-down aerial view, flat lay composition` |
| 主观视角 | `first-person POV shot, eye-level` |

### 运镜映射（→ 49 一镜一主运动）
| 镜头表术语 | 提示词表达 |
|---|---|
| 推近 | `slow push-in toward the subject` |
| 拉远 | `gradual pull-back revealing the environment` |
| 横摇 | `slow pan from left to right` |
| 俯仰 | `tilt up from the base to the top` |
| 环绕 | `smooth orbit around the subject` |
| 手持 | `handheld camera, subtle shake, documentary feel` |
| 推拉变焦 | `dolly zoom, background compresses as camera moves in, disorientation` |
| 升降 | `crane shot rising above the scene` |

### 光线/氛围映射（→ 50 混合光 / 09 布光）
| 镜头表术语 | 提示词表达 |
|---|---|
| 黄金时刻 | `golden hour light, warm backlight` |
| 低调布光 | `low-key lighting, chiaroscuro, deep shadows` |
| 硬光 | `hard direct light, crisp shadows` |
| 柔光 | `soft diffused light, gentle falloff` |
| 霓虹 | `neon-lit, cyan and magenta practicals` |
| 烛光/实光 | `practical candlelight, warm flickering glow` |

### 镜头感映射
| 镜头表术语 | 提示词表达 |
|---|---|
| 35mm | `35mm lens, natural perspective` |
| 长焦 | `85mm telephoto, compressed background, creamy bokeh` |
| 广角 | `24mm wide, exaggerated perspective, foreground emphasis` |
| 浅景深 | `shallow depth of field, subject sharp, background soft` |
| 慢动作 | `slow motion, high-speed camera feel` |

## 模型适配语法（同一意图，三种说法）

| 模型 | 提示词偏好 | 示例（同一镜头） |
|---|---|---|
| Sora 2 | 自然运动描述、现实主义 | `A man walks through rain, camera glides backward smoothly` |
| Veo 3.1 | 电影语言+技术术语 | `Cinematic dolly out, anamorphic, moody atmosphere, 35mm` |
| Kling 3.0 | 明确相机参数 | `Camera: slow pull-back, 50mm, f/2.0, locked-off after settle` |
| Seedance 2 | 参考图+主体标签+运动强度 | `Reference: @Image1; subject walks; camera pull-back, low intensity` |

**转换器职责**：识别镜头表的摄影细节（角度/运动/构图/光线），按目标模型语法重组——不是逐词翻译，是"说该模型的语言"。

## 三步转换工作流

```
① 上传镜头表：任意格式（Excel/文档/分镜描述/自由文本）
② AI 转换：识别行业术语→按模型生成多份提示词（保留创作意图）
③ 生成与迭代：直接生成视频→多模型对比→按结果精修提示词
```

**转换器能力边界**：支持行业术语、技术与创作笔记、部分信息（缺数据也能转）；转换免费，生成才耗积分。

## 开源工具生态（GitHub）

| 项目 | 用途 |
|---|---|
| thoxakihiko/shotlist-forge | 镜头表→提示词生成器 |
| woodfantasy/Seedance2.0-ShotDesign-Skills | Seedance 镜头设计技能包 |
| HenryZ838978/Seedance2.0-Storyboard-Planner | 分镜规划器 |
| wopanda/storyboard-prompt-skill | 分镜提示词技能 |
| JHBOY-ha/seedance-2-prompt-guide | Seedance 提示词指南（主体标签/参考素材/修复流程） |
| Wayhhow/ai-video-shot-prompt-skill | AI 视频镜头提示词技能 |

## 自建转换器规范（Agent/脚本向）

**提示词（SYSTEM）结构**：
```
你是一名摄影翻译。输入：镜头表条目。输出：针对 {model} 的生成提示词。
规则：
1. 识别并翻译景别/角度/运镜/光线/镜头感术语（用本页映射表）；
2. 每镜一个主运动，运动强度与速度参数可调；
3. 主体描述保持逐字不变（一致性契约，→ 39/40）；
4. 加入 {model} 语法适配（Sora 自然描述/Veo 电影语言/Kling 参数/Seedance @引用）；
5. 输出 JSON：{shot_id, prompt, negative_prompt, duration, camera}
```

**与 40 文档衔接**：镜头表→5 块提示词脚手架→关键帧→I2V 生成——转换器是"脚手架"的自动化版本（40 第二步）。

## 常见错误

1. 逐词翻译术语：模型听不懂"CU+low angle"缩写——展开成完整描述。
2. 忽略模型语法：同一提示词打所有模型，发挥不出强项。
3. 转换丢主体描述：一致性契约断裂（→ 39 漂移）。
4. 一镜多运动：映射表每条只给一个主运动。
5. 缺光线/氛围层：画面"裸"。
6. 转换后不再人工审：转换器是起点，精修靠人（可编辑是所有转换器的基本要求）。

## 术语表（中英对照）

| 中文 | English | 一句话定义 |
|---|---|---|
| 镜头表 | Shot List | 传统摄影计划 |
| 转换器 | Converter | 术语→提示词翻译 |
| 摄影语言 | Cinematography Language | 行业术语体系 |
| 创意意图 | Creative Intent | 情绪与动机 |
| 模型语法 | Model Syntax | 各模型提示词偏好 |
| 映射表 | Mapping Table | 术语→表达对照 |
| 意图守恒 | Intent Preservation | 转换不失真 |
| 主体标签 | Subject Tag | @引用参考图 |
| 运动强度 | Motion Intensity | 速度幅度参数 |
| 缺省转换 | Partial-Info Conversion | 缺数据也能转 |
| 术语识别 | Terminology Recognition | 行业词解析 |
| 可编辑输出 | Editable Output | 人可精修 |

## 来源

- Crevas: Shot List to AI Video Prompt Converter（Sora 2 / Veo 3 / Kling 2.5 适配） — https://crevas.ai/shot-list-to-prompt
- GitHub: thoxakihiko/shotlist-forge — 
- GitHub: woodfantasy/Seedance2.0-ShotDesign-Skills — 
- GitHub: JHBOY-ha/seedance-2-prompt-guide — 
- LaoZhang AI Blog: Seedance 2 提示词指南——主体标签、参考素材、分镜和修复流程 — https://blog.laozhang.ai/zh/posts/seedance-2-prompt-guide
- OpenCreator: AI 分镜脚本怎么做才"能拍出来"——同场景多机位与镜头拆解 — https://opencreator.io/zh/blog/ai-storyboard-multi-camera-workflow
- Kavel: Sora 2 Prompt Generator — Shot-by-Shot Prompt — https://www.kavel.ai/video/sora-2-prompt-generator