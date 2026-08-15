# DirectorX 知识库审计报告

> 自动扫描报告。相似度候选只用于人工复核，不代表可直接删除或合并。

## 结论

- 有效文章：351
- Markdown 正文：351
- 非 Markdown 视觉资产：3
- 已合并旧编号：54
- 无解释编号缺口：0
- 精确重复正文：0 组
- 结构或重定向错误：11
- 含自动质量标记的文章：10

当前正文没有精确重复，没有缺失 H1，存在极短占位文档。主要清洗问题不是坏文件，而是编号合并后的可达性、索引排序和 300 段以后大量高阶综合文章的主题重叠。

## 编号与重定向

扫描到的缺号：34, 49, 52, 66, 81, 85, 132, 136, 143, 147, 148, 149, 163, 168, 182, 183, 197, 214, 224, 229, 241, 251, 254, 255, 257, 259, 260, 263, 264, 272, 275, 279, 280, 286, 295, 296, 298, 302, 303, 305, 306, 310, 313, 314, 317, 318, 320, 326, 344, 345, 347, 349, 357, 359

| 旧编号 | 规范编号 | 说明 |
|---:|---:|---|
| 34 | 14 | 八层提示词框架与逐模型适配手册已合并到 AI 视频生成工作流 |
| 49 | 1 | 运镜几何约束、一镜一主运动、分镜锚点、镜头库、AI运镜专项、实拍设备表已合并到镜头语言与景别 |
| 52 | 114 | 六类别横评实测与自我测试协议已合并到 AI 视频模型能力矩阵 |
| 66 | 104 | 审稿清单、单集节奏公式、卡点设计（卡一/卡二/卡三）、漫剧特化、编剧端术语已合并到竖屏短剧实拍调度 |
| 81 | 1 | 叙事语法模型、客观vs主观取景、节奏与视觉时机、故事先于奇观已合并到镜头语言与景别 |
| 85 | 1 | 稳定器基础训练、十大运镜组合、模拟设备、航拍运镜、练习路径已合并到镜头语言与景别 |
| 132 | 69 | FACS、情绪弧与减法提示已合并到 AI 角色表演控制 |
| 136 | 76 | 修复管线顺序与 AI 素材增强回审已合并到实拍素材 AI 增强 |
| 143 | 48 | 短剧工业化生产体系已合并到 AI 短剧/漫剧视觉工厂 |
| 147 | 27 | AI 本地化、配音与品牌声流程已合并到字幕与本地化交付 |
| 148 | 135 | 电商带货视频方法已合并到 AI 广告创意生成方法论 |
| 149 | 56 | AI 预测性测试、MVT/因子设计、统计显著性、自动化疲劳检测已合并到素材数据驱动迭代 |
| 163 | 57 | 混合制作管线、AI VFX 对比与补镜方法已合并到真人+AI 混合制作工作流 |
| 168 | 1 | AI运镜提示词公式、短节拍规划、起止帧定义、复合运动分层已合并到镜头语言与景别 |
| 182 | 144 | 声画情绪匹配实践（情绪识别驱动配乐、HarmonySet 语义对齐）已合并到声音设计（实践端）与电影声音理论（理论端） |
| 183 | 116 | 参考图策略（多角度3-5张）、主体绑定（Subject Binding）、S2V工作流、首帧续接（Last-Frame Continuity）已合并到图生视频深度控制 |
| 197 | 1 | Dolly vs Zoom心理差异、具身反应研究、运镜心理决策已合并到镜头语言与景别 |
| 214 | 213 | 公共领域、原型、转换性使用、AI 版权现状与声音授权已合并到版权安全提示词 |
| 224 | 126 | 艺术运动/媒介风格词汇库、风格提示词模板、跨图一致性已合并到风格化与艺术方向 |
| 229 | 144 | 配乐理论（Leitmotif、主题发展、Berklee 五大概念、配乐留白）已合并到声音设计（实践端）与电影声音理论（理论端） |
| 241 | 1 | 运动动机表、叙事时间与空间塑造、动机校验已合并到镜头语言与景别 |
| 251 | 144 | 音画对位技法（平行/对位/米老鼠化、叙事评论功能）已合并到声音设计（实践端）与电影声音理论（理论端） |
| 254 | 186 | 场头式提示词、叙事图提示（ICCV）、情绪弧跨帧、帧链、序列叙事工作流已合并到 AI 多机位同场景生成 |
| 255 | 176 | 选择性聚焦、跟焦叙事功能、深焦并置与聚焦叙事语法已合并到 AI 景深与焦点控制 |
| 257 | 155 | 年代色彩指纹（1930s-2000s+ 配色表、Technicolor/数字调色工艺）已合并到色彩心理学 |
| 259 | 155 | 纵深调度（三层结构、深焦空间）色彩相关内容已合并到色彩心理学；非色彩纵深技法归属场面调度集群 |
| 260 | 219 | 静默深化（有形缺席、选择性混音、空间声学在场）已合并到电影声音理论 |
| 263 | 155 | 大气透视与色彩纵深（前景暖饱和/背景冷褪、三种透视）已合并到色彩心理学 |
| 264 | 1 | 图片镜头语言提示词顺序、组合-情绪映射、单帧叙事已合并到镜头语言与景别 |
| 272 | 155 | 光色音三通道统一设计色彩相关内容已合并到色彩心理学；三通道整合归属场面调度集群 |
| 275 | 158 | 图片系列情绪弧（三阶弧、5-6帧结构、环境潜台词）已合并到情绪曲线与节奏心理学 |
| 279 | 155 | 情绪色板配方（3-5色/情绪、musicolors跨模态）已合并到色彩心理学 |
| 280 | 158 | 悬念节奏结构（恐惧曲线、五阶段波、惊悚节拍）已合并到情绪曲线与节奏心理学 |
| 286 | 219 | 声音-色彩-情绪通感（情绪权重实证、musicolors、参数级映射）已合并到电影声音理论 |
| 295 | 144 | 类型片声音惯例（恐怖/科幻/西部/动作声音图符、惊跳架构）已合并到声音设计（实践端）与电影声音理论（理论端） |
| 296 | 278 | 杂交类型设计框架（主导+对位/调性控制/案例）已合并到类型片表演惯例 |
| 298 | 158 | 揭示-悬念-节奏三整合（节奏交替、渐进揭示、转折时机）已合并到情绪曲线与节奏心理学 |
| 302 | 144 | 杂交声音混合（声学+电子、饱和/侧链/总线粘合）已合并到声音设计 |
| 303 | 299 | 跨媒介四步、机器可读规则、审校门、跨格式模板已合并到签名母题 |
| 305 | 278 | 杂交表演调性多能（语域切换/跨类型训练）已合并到类型片表演惯例 |
| 306 | 299 | 母题-签名整合、Brand Kit/风格元素集、15-30 示例图、@BrandStyle 双保险已合并到签名母题 |
| 310 | 299 | 跨格式系列、DNA 先定义、视觉配方、平台路由、集中治理已合并到签名母题 |
| 313 | 144 | 杂交场景声音整合（可着色声床、模块分层、频率雕刻）已合并到声音设计 |
| 314 | 278 | 杂交场景设计（统一简报/灵活色纹/灯光切换）已合并到类型片表演惯例 |
| 317 | 278 | 杂交类型视觉与提示词（融合提示/风格权重/视觉库）已合并到类型片表演惯例 |
| 318 | 278 | 声学指纹与跨部门统一（指纹预定义/集成声轨）已合并到类型片表演惯例 |
| 320 | 278 | 纹理优先分层与共享处理（声床匹配/有机叠加）已合并到类型片表演惯例 |
| 326 | 186 | 风格嵌入签名、视觉身份治理、模块化世界、记忆连贯系统、人类-AI共创已合并到 AI 多机位同场景生成 |
| 344 | 155 | 纹理年代指纹（年代-纹理映射、老化材料配方）已合并到色彩心理学 |
| 345 | 1 | 运动能指、运动矢量语法、运动批评已合并到镜头语言与景别 |
| 347 | 144 | 听觉节奏（节奏vs速度、声音呼吸、节律主导）已合并到声音设计（实践端）与电影声音理论（理论端） |
| 349 | 158 | 节奏-结构-视点三整合（三旋钮、双节奏、视点对齐）已合并到情绪曲线与节奏心理学 |
| 357 | 126 | 色彩-情绪实证、跨模态色板、EmoSet数据集、VA三轴系统已合并到风格化与艺术方向 |
| 359 | 155 | 光效-运动-声音三通道整合（LED体积融合、视听整合）已合并到色彩心理学 |

## 自动检查异常

- redirect 257 target 155 does not mention the merged legacy id
- redirect 259 target 155 does not mention the merged legacy id
- redirect 263 target 155 does not mention the merged legacy id
- redirect 272 target 155 does not mention the merged legacy id
- redirect 275 target 158 does not mention the merged legacy id
- redirect 279 target 155 does not mention the merged legacy id
- redirect 280 target 158 does not mention the merged legacy id
- redirect 298 target 158 does not mention the merged legacy id
- redirect 344 target 155 does not mention the merged legacy id
- redirect 349 target 158 does not mention the merged legacy id
- redirect 359 target 155 does not mention the merged legacy id

## 来源覆盖

- 339 篇包含外部来源链接。
- 12 篇属于内部说明或图解页，未包含外部链接：0, 80, 150, 151, 152, 155, 156, 157, 158, 159, 160, 161。
- 本次只做本地结构与内容扫描，没有联网验证链接可访问性、来源权威性或时效性。

## 主题重叠人工复核队列

下表使用标题、开篇摘要和章节标题的词元 Jaccard 相似度排序。高分通常表示上下位关系、深化篇或综合篇，不等于重复。

| 相似度 | 文章 A | 文章 B |
|---:|---|---|
| 0.430 | 362 AI 图片运动-注意-情绪三融合（Motion-Attention-Emotion — Affective Saliency Fusion） | 371 AI 图片情感显著-互动-沉浸三融合（Affective Saliency × Interactive × Immersive — VR-Aware Fusion） |
| 0.421 | 360 AI 图片剪影-年代-情绪三融合（Silhouette-Era-Emotion — Vintage Dramatic Fusion） | 369 AI 图片剪影-年代-情绪-参与四融合（Silhouette-Era-Emotion-Engagement — Interactive Nostalgic Fusion） |
| 0.420 | 371 AI 图片情感显著-互动-沉浸三融合（Affective Saliency × Interactive × Immersive — VR-Aware Fusion） | 380 AI 图片情感-显著-互动-沉浸四融合（Affective-Interactive-Immersive Fourfold — Emotion-Led Experience） |
| 0.414 | 325 电影声学指纹-杂交-类型整合（Sonic Identity — Scalable Systems & Hybrid Genre Fusion） | 336 电影声学身份-杂交-体验整合（Sonic Identity × Hybrid × Experience — Sound DNA & Engagement） |
| 0.390 | 319 AI 图片记忆签名系列（Memory Signature Series — Personal Style & Nostalgic Cohesion） | 328 AI 图片记忆签名杂交视觉（Nostalgic Signature Hybrid — Personal Brand & Style Fusion） |
| 0.388 | 341 电影实拍光效艺术（Practical Lighting — Motivated Sources & In-Frame Light） | 350 电影实拍光效-动机-叙事三整合（Motivated Light × Narrative — Unmotivated as Tool） |
| 0.385 | 367 电影终极统一设计（Ultimate Unified Design — Total Cinematic Synthesis） | 374 电影总合成设计（Total Synthesis — Fourfold × Trichannel × Ultimate） |
| 0.383 | 374 电影总合成设计（Total Synthesis — Fourfold × Trichannel × Ultimate） | 377 电影管线-导航总应用（Pipeline-Navigation Total — Synthesis Applied to Production） |
| 0.383 | 340 电影四整合总设计（Fourfold Integration — Narrative × AV × Experience × Genre） | 367 电影终极统一设计（Ultimate Unified Design — Total Cinematic Synthesis） |
| 0.379 | 351 AI 图片剪影-逆光-氛围三融合（Silhouette-Backlight-Atmosphere — Cinematic Fusion Prompts） | 360 AI 图片剪影-年代-情绪三融合（Silhouette-Era-Emotion — Vintage Dramatic Fusion） |
| 0.367 | 376 知识库导航应用（Navigable Knowledge — Corpus2Skill & Skill-Tree Retrieval） | 385 知识库技能库导航优化（Skill-Library Navigation — Corpus2Skill & Hybrid Retrieval） |
| 0.366 | 293 电影叙事-悬念-通感三整合（Narrative-Suspense-Synesthesia — PAL-D & Unified Tension Design） | 311 电影预期-悬念-通感整合（Expectation-Suspense-Sensory — Immersive Unified Experience） |
| 0.364 | 372 电影听觉叙事和谐（Audio Narrative Harmony — Sound as Continuity Texture） | 381 电影声统-和谐-张力-体验全整合（Audio Unity Total — Harmony × Tension × Experience） |
| 0.359 | 362 AI 图片运动-注意-情绪三融合（Motion-Attention-Emotion — Affective Saliency Fusion） | 380 AI 图片情感-显著-互动-沉浸四融合（Affective-Interactive-Immersive Fourfold — Emotion-Led Experience） |
| 0.354 | 290 AI 图片导演签名应用（Signature in Practice — Prompt Style Guide & Brand Visual Language） | 319 AI 图片记忆签名系列（Memory Signature Series — Personal Style & Nostalgic Cohesion） |
| 0.353 | 382 AI 图片多模型聚合平台（Multi-Model Platform — Unified Creative Orchestration） | 393 AI 创作生态聚合（AI Creative Ecosystem — Full-Stack Consolidation） |
| 0.353 | 261 AI 图片光影方向情绪库（Light Direction Emotion — Side, Top, Back & Under Light） | 342 AI 图片光影叙事（Light-Shadow Narrative — Silhouette, Backlight & Shadow as Story） |
| 0.350 | 265 电影类型片视觉符号（Genre Visual Semiotics — Iconography & Conventions） | 287 电影类型片场景惯例（Genre Settings — Horror House, Western Frontier & Sci-Fi Spaces） |
| 0.350 | 353 AI 图片年代-纹理-情绪三融合（Era-Texture-Emotion — Nostalgic Palette Fusion） | 360 AI 图片剪影-年代-情绪三融合（Silhouette-Era-Emotion — Vintage Dramatic Fusion） |
| 0.346 | 346 AI 图片构图心理学应用（Composition Psychology Applied — GazeFusion & Saliency-Guided Design） | 355 AI 图片显著-视线-格式塔应用（Saliency-Gaze-Gestalt — Attention Control Framework） |
| 0.346 | 367 电影终极统一设计（Ultimate Unified Design — Total Cinematic Synthesis） | 377 电影管线-导航总应用（Pipeline-Navigation Total — Synthesis Applied to Production） |
| 0.343 | 342 AI 图片光影叙事（Light-Shadow Narrative — Silhouette, Backlight & Shadow as Story） | 351 AI 图片剪影-逆光-氛围三融合（Silhouette-Backlight-Atmosphere — Cinematic Fusion Prompts） |
| 0.338 | 204 AI 声音记忆点设计（Sonic Branding — Audio Logo, Brand Soundscape & Mnemonic） | 336 电影声学身份-杂交-体验整合（Sonic Identity × Hybrid × Experience — Sound DNA & Engagement） |
| 0.338 | 309 电影杂交类型配乐（Hybrid Scoring — Orchestral + Electronic in One Sound） | 329 电影杂交配乐-表演-场景三整合（Hybrid Score-Acting-Scene — One World, One Performance） |

## 建议的后续人工清洗顺序

1. 先复核 350-394 的“整合 / 总设计 / 全流程 / 导航”文章，明确基础篇、深化篇和综合篇的关系。
2. 为确认重复的文章执行“正文合并 + 旧编号重定向”，不要直接删除编号。
3. 对模型、平台、法规和带年份结论设置定期复核；本地扫描无法证明这些内容仍然有效。
4. 保持正文 Markdown 简洁，把分类、哈希、来源计数和质量标记留在 `inventory.json`。