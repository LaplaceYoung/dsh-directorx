---
type: Case
title: "Video Agent MVP 案例手册：11 个测试案例的 AI 优化打法（MVP Case Playbook — Making AI Better on Real Cases）"
description: "本页以飞书「Video agent-MVP case」文档中的 11 个测试案例为锚点，逐个拆解每个案例的真实难点、当前 AI 能力现状与优化打法（提示词结构、参考策略、工作流编排、工具选择）"
tags:
  - "production"
  - "prompt"
  - "workflow"
  - "continuity"
status: stable
stale_after: "2027-08-18"
generated:
  by: "process:directorx-knowledge-okf"
  at: "2026-08-18T00:00:00Z"
verified:
  - by: "process:knowledge-audit"
    at: "2026-08-18T00:00:00Z"
sources:
  - resource: "cited:飞书 wiki Video agent-MVP case"
    id: cite-1
    title: "Video agent-MVP case"
    author: "org:飞书-wiki"
  - resource: "https://acnc6zeentra.feishu.cn/wiki/N7uEwbTpvifb8HkPZ4YcAJCinyE"
    id: url-1
    title: "acnc6zeentra.feishu.cn"
  - resource: "https://www.kittl.com/blogs/ai-video-character-consistency-workflow/"
    id: url-2
    title: "kittl.com"
  - resource: "https://skywork.ai/blog/multi-prompt-multi-shot-consistency-veo-3-1-best-practices/"
    id: url-3
    title: "skywork.ai"
  - resource: "https://magichour.ai/blog/how-to-keep-characters-consistent-in-ai-video"
    id: url-4
    title: "magichour.ai"
  - resource: "https://reap.video/blog/ai-video-editing-for-podcasters"
    id: url-5
    title: "reap.video"
  - resource: "https://vizard.ai/blog/9-best-ai-video-clipping-tools-2026"
    id: url-6
    title: "vizard.ai"
  - resource: "https://leadde.ai/blog/multilingual-ai-avatar-generators"
    id: url-7
    title: "leadde.ai"
  - resource: "https://reelmind.ai/blog/ken-burns-effect-on-video-ai-for-editing"
    id: url-8
    title: "reelmind.ai"
dx_id: "113"
related:
  - "14-ai-video-generation/ai-video-generation.md"
  - "39-image-consistency/character-consistency.md"
  - "40-storyboard-generation/storyboard-generation.md"
---

# Video Agent MVP 案例手册：11 个测试案例的 AI 优化打法（MVP Case Playbook — Making AI Better on Real Cases）

> 本页以飞书「Video agent-MVP case」文档中的 11 个测试案例为锚点，逐个拆解每个案例的真实难点、当前 AI 能力现状与优化打法（提示词结构、参考策略、工作流编排、工具选择）。知识本体来自真实影视/内容行业的专业做法，AI 应用面向 DirectorX 可直接执行。
> 案例来源：飞书 wiki「Video agent-MVP case」（acnc6zeentra.feishu.cn，2026-08 访问）。
> 调研来源：Kittl/CrePal/MagicHour 角色一致性指南、Veo 3.1 多提示词故事讲述、Reap/Vizard/Opus 视频切片工具评测、LeadDe 多语言数字人、ReelMind Ken Burns 教程、vivideo 2026 AI 视频工作流。

## 概述

11 个案例覆盖 5 大能力维度。每个案例的 Query 都是「一句话任务」，但背后是多个子能力的协同：

| 维度 | 案例 | 核心能力 |
|---|---|---|
| 角色一致性 | AI选角；从图片制作短片（人物长相不变）；帮助中心视频（同一数字人） | 参考图锚定、身份块、多视图 |
| 创意流程 | 一句话生成广告（3 创意方向→确认→脚本→分镜→成片） | 需求澄清、创意提案、逐级确认 |
| 多模态叙事 | 从图片制作短片（8 图→45 秒回忆短片） | 图片理解、镜头运动、转场、旁白 |
| 视频编辑与信息提取 | 播客转短；YouTube 长转短；发布会片段；体育集锦 | 转录、高光检测、语义裁剪、竖屏化 |
| 模板化批量生产 | 多语言入职培训；帮助中心视频；个性化销售外联 | 样式锁定、数字人、多语言、术语表 |

**核心断言**：这些案例的成败不在"生成"本身，而在**生成之前的结构化决策**（参考锁定、脚本确认、风格统一）与**生成之后的审查校验**（一致性、信息保真、时长规格）。

## 案例逐拆与优化打法

### 1. AI 选角（女侦探 6 位候选：正面/侧面/全身）

**Query**：根据照片和角色小传，为剧本中的女侦探生成 6 位候选角色，并分别展示正面、侧面和全身造型。

**真实难点**：角色小传（文字）+ 参考照片（视觉）双输入 → 输出 6 个候选 × 3 视角 = 18 张图，且同一位候选的 3 视角必须同一人。

**AI 现状与打法**：
- 参考锁定：先让"参考照片"成为每个候选的身份锚（image-to-image），而不是纯文生图——否则候选之间、视角之间会漂移
- 角色圣经（Character Bible）做法：每个候选先生成一张正面定妆照，再用该图派生侧面/全身（参考链），而不是每张独立生成
- 小传分解：把小传拆成「不可变特征」（脸型、发色、疤痕、眼镜）+「可换元素」（服装、表情），身份块固定措辞贴到每个提示词开头
- 输出契约：6 候选 × 3 视角，命名规范 `candidate-01-front/side/full`，供下游分镜直接引用

**关联知识库**：39（身份一致性）、108（情绪板与参考体系）

### 2. 影视打斗与 VFX（保留原人物和场景加效果）

**Query**：根据特效要求保留原人物和场景，为这段打斗增加效果。

**真实难点**：实拍/生成的主体（人物+场景）必须原样保留，只叠加特效（火花、冲击波、慢动作）——这是合成（Compositing）语义，不是重生成。

**AI 现状与打法**：
- 主体与特效分离：先生成/保留干净的主体层（无特效），特效作为独立生成层叠加（前景粒子/能量场用图生视频或后期合成），避免"加特效=重画人"
- 保留主体用参考帧锁定：把"无特效版本"的首帧/末帧作为参考锚，特效层用混合（blend）而非替换
- 打斗因果（接上一轮 97）：受击反应与特效时序对齐，sell-the-hit——特效在接触帧爆发，不在挥空时
- 降级路径：模型无法分层时，用「原片 + 后期合成」双通道（特效层生成 + 时间线叠加），不追求一次生成

**关联知识库**：97（动作因果）、110（AI VFX 管线）

### 3. 一句话生成广告（3 创意方向 → 确认 → 脚本 → 分镜 → 成片）

**Query**：根据产品图和介绍，为这款户外音箱制作 20 秒露营主题广告。先提出 3 个创意方向，等我确认后再完成脚本、分镜和成片。

**真实难点**：任务显式要求**分阶段确认**——3 个创意方向 → 用户选定 → 脚本 → 分镜 → 成片。跳过确认直接出片是失败。

**AI 现状与打法**（对应 105 的真实 TVC 管线）：
- 阶段 1 创意提案：基于产品图+介绍输出 3 个方向，每个含核心信息、画面构想、情感基调、10-15 秒结构（不写完整脚本）
- 阶段 2 脚本：用户选定后写 20 秒拍摄脚本（逐句旁白对应画面/景别/时长）
- 阶段 3 分镜：逐镜细化（景别/角度/运镜/构图/打光/表演/转场/音频，用知识库术语）
- 阶段 4 关键帧：每镜 1-3 张视觉参考，**先确认再生成**——禁止文本直出视频
- 阶段 5 成片：只从关键帧/参考出发图生视频，再剪辑
- 关键：每个阶段产出可审查的交付物并停下等确认，这是 Query 的显式要求

**关联知识库**：105（TVC 全流程）、106（创意简报）、107（关键帧）

### 4. 从图片制作短片（8 图 → 45 秒回忆短片）

**Query**：将这 8 张旅行照片制作成 45 秒回忆短片。按出发、途中、抵达和告别组织故事，为每张图片设计自然的镜头运动和转场，加入温暖旁白、环境音和背景音乐，保持人物长相不变。

**真实难点**：静态图 → 动态叙事，四幕结构（出发/途中/抵达/告别），每图一个镜头运动+转场，人物跨图一致，音轨（旁白+环境+音乐）与画面同步。

**AI 现状与打法**：
- 叙事结构先行：8 图按四幕分镜（2+3+2+1），每图标注叙事功能（引出/推进/高潮/收束）
- 镜头运动：Ken Burns 推拉摇移是行业标准手法（pan/zoom 动画），AI 图生视频也可做——但每镜只做一个主运动（一镜一主运动，接 49）
- 转场：按四幕节奏选转场类型（幕内硬切/淡入淡出，幕间溶解/擦除），转场承载时间流逝
- 人物一致：旅行照片中的人物用参考锚定（接案例 1 打法），至少保证同人同景别
- 音轨：旁白写为 45 秒内的温暖叙述（按幕分段），环境音+音乐在剪辑端混音（不做视频生成的一部分）

**关联知识库**：43（竖屏安全区）、49（运镜）、105（管线）

### 5. 多语言入职培训（5 分钟数字人 × 4 语言）

**Query**：基于公司简介制作 5 分钟数字人口播视频，生成中文、英语、西班牙语、越南语版本。公司名和岗位名使用术语表中的固定写法。

**真实难点**：同一内容 × 4 语言、同一数字人、术语表约束（公司名/岗位名不得意译）。

**AI 现状与打法**：
- 术语表先行：先提取公司名/岗位名固定译法，作为全局约束注入所有脚本（而不是让模型自由翻译）
- 数字人统一：先生成一个数字人形象锚点，4 语言共用（同一数字人 = 品牌一致性）
- 脚本翻译管线：中文脚本 → 术语表约束的多语言脚本（人审关键术语）→ 配音 → 数字人口型
- 5 分钟结构：按公司简介自然段分节，每节 30-60 秒，避免长段单镜头口播枯燥

**关联知识库**：55（本地化视觉）、105

### 6. 客户帮助中心视频（多篇文档 → 1 分钟内教学视频，统一样式）

**Query**：把几篇帮助中心文章分别制作成 1 分钟以内的教学视频，统一使用同一个数字人、片头和字幕样式，音色自行选择。

**真实难点**：批量 × 统一模板（数字人/片头/字幕样式固定），每篇 ≤1 分钟，信息保真。

**AI 现状与打法**：
- 模板化生产：先定义「样式包」（数字人形象、片头模板、字幕样式、音色），一篇文章一个实例——这是工业化批量，不是逐篇创意
- 文章 → 脚本压缩：每篇提炼 ≤1 分钟的讲解脚本（问题→步骤→结论），删除冗余
- 信息保真校验：生成后核对教程步骤与原文一致（AI 最易在压缩时丢失关键步骤）

**关联知识库**：58（栏目化）、105

### 7. 个性化销售外联（5 客户 × 30 秒，称呼姓名公司/卖点/预约演示）

**Query**：为表格中的 5 位客户和公司资料，分别制作 30 秒视频，开头称呼姓名和公司，中间介绍公司卖点，结尾邀请预约演示。

**真实难点**：批量个性化——结构固定（称呼→卖点→CTA），内容因人而异；5 个视频必须可独立交付。

**AI 现状与打法**：
- 模板 + 变量：30 秒三段式（0-5s 称呼、5-20s 卖点、20-30s 预约）为固定骨架，客户数据（姓名/公司/行业卖点）为变量
- 表格驱动：从客户表格批量生成 5 份脚本（每份一个客户），脚本级审查后再生成视频
- 数据准确校验：姓名/公司/卖点必须与表格一致——生成后逐字段核对（AI 幻觉高发点）

**关联知识库**：58（内容矩阵）、41（电商资产）

### 8. 播客转短视频（60 分钟 → 10 条 30-60 秒观点，9:16 + 动态字幕）

**真实难点**：从 60 分钟里选出 10 个**可独立理解**的精彩观点（不是随机截取），每条 30-60 秒、竖屏、动态字幕。

**AI 现状与打法**：
- 转录 → 观点切分：先全文转录，按「可独立理解」标准切分（一条观点 = 有上下文能自洽的完整表达），AI 高光检测是行业标配（Opus/Reap/Vizard 都是此思路）
- 选择标准：精彩度（情绪峰值、金句、数据）+ 独立性（不依赖上下文）+ 时长（30-60s）
- 竖屏化：9:16 裁剪/重构图（主体跟随），动态字幕（关键词高亮）
- 10 条输出契约：每条独立标题 + 起止时间码 + 字幕文件，供批量渲染

**关联知识库**：43（竖屏）、61（视频 SEO）、63（字幕）

### 9. YouTube 长视频转短片（选 5 个精彩片段 → 30-60 秒竖屏）

**同案例 8 的片段提取逻辑**，差异点：
- 多视频源：跨 2 个视频选最精彩 5 段——先各自转录评分，再跨源去重（避免重复内容）
- 片段边界：剪辑点落在语义完整处（句子/动作结束），不切半句话

### 10. 发布会提取产品片段（每功能一条短视频，保留演示删无关）

**真实难点**：从整场发布会按**功能**切分——每条视频只含该功能的演示与关键解释，删除无关内容。

**AI 现状与打法**：
- 语义分段：转录后按「功能」聚类（每个功能 = 演示 + 解释 + 演示画面），不是按时间切
- 保真裁剪：保留功能演示与关键解释（画面+声音），删除寒暄/过渡/与功能无关演示
- 输出契约：N 条视频（每功能一条），命名 `feature-<功能名>`，含起止时间码

### 11. 体育赛事精彩集锦（3 分钟集锦，标注球员与时间）

**真实难点**：进球/关键扑救/争议判罚的检测 + 事件标注（球员姓名、发生时间）+ 3 分钟汇编。

**AI 现状与打法**：
- 事件检测：进球/扑救/判罚是语义事件——需要转录（解说）+ 画面理解（回放标志、球门）双信号
- 标注契约：每个事件 = 时间码 + 球员 + 事件类型，标注写入字幕/角标（这是 Query 的明确要求）
- 汇编节奏：3 分钟集锦按事件类型排序（进球优先），每个事件 10-20 秒片段 + 转场

**关联知识库**：61、83（拉片）

## 通用打法：跨案例的 5 条铁律

1. **参考锁定先于生成**：所有涉及"保持/同一"的案例（1/4/5/6），先生成参考锚（定妆照、首帧、数字人形象），再用参考链派生，禁止每张独立生成
2. **结构决策先于文案**：广告（3）、短片（4）、外联（7）都先定结构（幕/段/镜），再填内容
3. **确认点不可跳过**：Query 显式要求确认时（3 的"等我确认"），每个阶段产出可审查交付物并停下；这是任务验收的一部分
4. **输出契约可机器校验**：所有批量案例（5/6/7/8/10/11）都定义命名、时间码、字段格式，让结果可核对（术语表、姓名、时间码、功能名）
5. **审查是流程环节**：一致性、信息保真、时长规格、字幕样式——生成后逐项校验，不把生成当完成

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 角色圣经 | Character Bible | 角色参考图集+身份块，跨镜锁定 |
| 参考链 | Reference Chaining | 从已生成图派生后续图，保持身份 |
| 身份块 | Identity Block | 不可变特征的固定措辞提示词段 |
| 创意方向 | Creative Direction | 概念阶段的 2-3 个提案 |
| 拍摄脚本 | Shooting Script | 逐句旁白对应画面/景别/时长 |
| 高光检测 | Highlight Detection | 从长内容识别精彩片段的 AI 能力 |
| 动态字幕 | Dynamic Caption | 关键词高亮的字幕样式 |
| 竖屏化 | Vertical Reframe | 9:16 构图重构 |
| 数字人 | Digital Human / Avatar | 虚拟播报人 |
| 样式包 | Style Pack | 数字人/片头/字幕/音色的统一模板 |
| 术语表约束 | Glossary Constraint | 固定译法注入，防自由翻译 |
| 事件标注 | Event Annotation | 时间码+人物+事件类型的结构化标注 |

## 来源

- 案例：飞书 wiki「Video agent-MVP case」：https://acnc6zeentra.feishu.cn/wiki/N7uEwbTpvifb8HkPZ4YcAJCinyE
- AI 视频角色一致性工作流 2026（Kittl）：https://www.kittl.com/blogs/ai-video-character-consistency-workflow/
- Veo 3.1 Multi-Prompt Storytelling Best Practices：https://skywork.ai/blog/multi-prompt-multi-shot-consistency-veo-3-1-best-practices/
- MagicHour — How to Keep Characters Consistent in AI Video：https://magichour.ai/blog/how-to-keep-characters-consistent-in-ai-video
- Reap — Turn 1 Podcast into 10 Viral Clips：https://reap.video/blog/ai-video-editing-for-podcasters
- Vizard — Best AI Video Clipping Tools in 2026：https://vizard.ai/blog/9-best-ai-video-clipping-tools-2026
- LeadDe — Multilingual AI Avatar Generators 2026：https://leadde.ai/blog/multilingual-ai-avatar-generators
- ReelMind — Ken Burns Effect on Video: AI for Editing：https://reelmind.ai/blog/ken-burns-effect-on-video-ai-for-editing
- vivideo — The AI Video Workflow in 2026：https://vivideo.ai/blog/state-of-ai-video-creation-2026

## 相关概念

- [AI 视频生成工作流（AI Video Generation）](../14-ai-video-generation/ai-video-generation.md)
- [图片一致性控制（Character & Visual Consistency）](../39-image-consistency/character-consistency.md)
- [分镜图生成工作流（Storyboard-to-Video Pipeline）](../40-storyboard-generation/storyboard-generation.md)
