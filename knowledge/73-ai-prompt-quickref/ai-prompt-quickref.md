# AI 视频模型提示词总表（Prompt Format Quick Reference）

> 本页是 DirectorX AI 视频提示词速查：四种专业提示词格式（时间轴/JSON/镜头表/自然语言）、模型×格式匹配表、双通道工作流（构图→运动，质量 10x）、五大致命错误、参考图法则、元提示词工作流、提示词库建设。与 34/52/53/65 全面衔接，是全模型提示词的"总目录页"。
> 来源：StudioList 2026 四种格式研究、Google DeepMind Veo 提示指南、550W 提示词大全、Seedance 官方指南。

## 概述

**核心断言**：产出一堆 AI 垃圾与产出有方向的电影帧之间的差别不是创意，是**结构**。2026 专业创作者收敛到四种提示词格式，各优化于不同用例与模型。

**核心原则**：结构不是创作约束，是**创作杠杆**——
- **探索想法**：自然语言（快写快生成快迭代）；
- **产出交付物**：时间轴或镜头表（编排序列、控制节奏、指挥镜头）；
- **搭建管线**：JSON（隔离参数、自动化变体、规模生产）。

## 四种格式详解

### 1. 时间轴提示词（Timeline）——2026 主流专业格式
**适用**：Seedance 2.0 / Sora 2 / Kling 2.6+；多节拍序列、MV、动作戏。
**结构**：
```
FORMAT: [时长] / [节奏或能量] / [连续性规则]
[0:00-0:03]: 镜头描述（机位+动作+音效）
[0:03-0:06]: 下一节拍
```
**要点**：每块 <40 词；每块一个运镜；SFX 描述设定能量；亚秒级时间戳（0:01.5）精确卡点；**首块设定视觉规则，细节给最足**；"ONE CONTINUOUS SHOT" 防止模型插入转场。

### 2. JSON 结构化——管线与可复现
**适用**：Veo 3.1 / API 工作流 / 多参数复杂场景。
**字段**：shot_type / camera_movement / lens_spec / lighting / subject_details / environment_details / vfx_elements / color_palette / framing / shutter_speed。
**要点**：**关注点分离**——改灯光不重写主体；复杂场景迭代快 3-5x；至少 5-7 字段；**lens_spec 影响最大**；色板描述确实影响输出；多镜用数组 `[]`。

### 3. 镜头表（Shot List）——导演式提示
**适用**：Seedance / Sora；动作序列、分镜到视频。
**结构**：编号镜头（时间+机位+动作+音效）→ STYLE NOTES 全局规则。
**要点**：连续镜头也编号（帮助模型理解进程）；**STYLE NOTES 是行为规则**（"摄影机从不自己选路，只反应"影响每镜）；单镜 ≤2-3 句；把摄影机描述为物理实体（"摄影机被拖拽"）。

### 4. 自然语言（段落）——快速概念
**适用**：Kling 3.0 / Grok；单镜概念、快速原型。
**要点**：重要视觉元素前置；时间标记（"at the 2-second mark"）控制节奏；**结尾逗号分隔风格关键词**；<100 词；先用于初稿，定稿升级为时间轴格式。

## 模型 × 格式匹配表

| 模型 | 最佳格式 | 原因 |
|---|---|---|
| Seedance 2.0 | 时间轴或镜头表 | 原生处理时间脚本 |
| Kling 3.0 | 时间轴+节拍标记 | 音画同步需精确时间戳 |
| Veo 3.1 | JSON 结构化 | 参考成分系统映射 JSON 字段 |
| Runway Gen-4.5 | 自然语言+运动笔刷 | 物理描述（"momentum causes fishtail"）有效 |
| Sora 2 | 时间轴或镜头表 | 因果物理（"due to hydroplaning"）结构化表达 |
| Grok Imagine | 自然语言 | 速度优先 |

## 双通道工作流（最高杠杆技巧，2026）

```
Pass 1 构图：自然语言建立构图/主体/情绪（不管运镜）→ 跑 10-20 代 → 选最佳构图 → 导出静帧
Pass 2 运动：静帧作参考图 + 时间轴/JSON 只描述运动 → 构图已锁，模型全部预算花在运动上
```
**成本 2-3x，质量接近 10x**——品牌 hero 镜头默认双通道；社媒走量单通道即可。

## 五大致命错误（每个都把质量砍半）

1. **描述主体而非运动**：有参考图时主体已可见——提示词预算花在"随时间发生什么"（头微侧/风抓衣角/镜头横移）；**描述变化，不描述状态**；
2. **形容词堆叠**："cinematic beautiful stunning..." 是模型要协调的一堆名词——挑 2-3 个具体视觉修饰（"low-angle, golden hour, 35mm film grain"）；
3. **镜头间语法不一致**：同一生成内主语保持（"hero walks"→"she turns" 是主语切换）；
4. **机位与运动矛盾**：一镜一主运动；两都需要→拆两次生成后剪辑（→ 49 一镜一主运动）；
5. **忽略画幅**：提示词里指定"vertical 9:16, subject centred, shoulders-up framing"——横屏提示词竖屏会重构图失败。

## 参考图法则（最被低估因素）

- 完美文字提示词无参考图 < 平庸提示词+强参考条件；
- **图生视频已基本取代纯文生视频**用于严肃工作（→ 40 I2V 三通道）；
- 参考图库建设=生产力投资。

## 元提示词工作流（LLM 生成提示词）

- 概念+镜头参考+目标模型 → LLM 输出正确格式的结构化提示词；
- 适用：分镜→时间轴转换、同场景 A/B 变体、概念→模型特定格式、批量 10-20 变体；
- 2026 最高产出的创作者不逐条手写——他们有**模板库、格式转换器、LLM 辅助生成**。

## 提示词库建设（六个月后比订阅更值钱）

- 每次成功生成存档：精确提示词+参考图+为什么有效；
- 借鉴源：StudioList 工作室公开模式、Civitai 社区库（开源工作流但叙事时间轴模式可迁移）、Kling/Runway 官方示例画廊。

## 常见错误（汇总）

1. 格式选错：交付物用自然语言→节奏失控。
2. 参考图缺失：浪费提示词预算描述主体。
3. 形容词堆叠/语法漂移/机位矛盾/画幅忽略。
4. 单通道做 hero：双通道才是品牌默认。
5. 无提示词库：每次从零开始。

## 术语表（中英对照）

| 中文 | English | 一句话定义 |
|---|---|---|
| 时间轴提示 | Timeline Prompt | 时间戳分块 |
| JSON 结构化 | JSON Structured | 参数隔离 |
| 镜头表 | Shot List | 编号镜头+风格注 |
| 自然语言 | Natural Language | 段落式 |
| 连续性规则 | Continuity Rule | 全局运动约束 |
| 关注点分离 | Separation of Concerns | 单参数迭代 |
| 风格注 | STYLE NOTES | 全局行为规则 |
| 双通道 | Dual-Pass | 构图→运动 |
| 亚秒时间戳 | Sub-Second Timestamp | 精确卡点 |
| 元提示词 | Meta-Prompting | LLM 生成提示 |
| 参考图条件 | Reference Conditioning | 图锚定 |
| 主语一致性 | Subject Consistency | 语法稳定 |

## 来源

- StudioList: AI Video Prompt Engineering — 4 Formats That Actually Work in 2026 — https://studiolist.co/guides/ai-video-prompt-engineering-2026/
- Google DeepMind: How to Create Effective Prompts with Veo 3 — https://deepmind.google/models/veo/prompt-guide/
- AI Workflow Pro: AI Video Prompt Framework — 8-Layer Template（Runway/Kling/Veo/Seedance） — https://aiworkflowpro.com/ai-video-prompt-framework/
- 550W AI: AI 视频生成提示词大全——可灵/Sora/即梦/Veo3 Prompt 写法与模板 — https://www.550wai.cn/blog/ai-video-prompt-engineering.html
- 火山引擎: Seedance 2.0 文生视频提示词编写指南 — https://www.volcengine.com/article/40840
- Prompt Architects: JSON Video Prompt Templates for Veo 3 — https://prompt-architects.com/blog/26-json-video-prompt-templates-veo3
- PromptMotion: Kling vs Seedance vs Veo Prompts Compared — https://www.seedancetool.com/blog/kling-vs-seedance-vs-veo-prompts
- aiolaola: AI 视频提示词库——电影感 AI 短片提示词模板 — https://prompts.aiolaola.com/