# DirectorX 知识库审计报告

> 自动扫描报告。相似度候选只用于人工复核，不代表可直接删除或合并。知识包按 OKF v0.2 治理。

## 结论

- 有效文章：355
- OKF 类型分布：Reference 275，Playbook 30，Case 15，Spec 8，Method 27
- 已合并旧编号：90
- 精确重复正文：0 组
- 结构错误：0
- 警告：0
- 含自动质量标记的文章：0

350–394 综合篇：已合并确认重复的导航/总合成/N+1 四融合；其余保留并打 `overlap-review`。

## 自动检查

- 无结构错误。

## 主题重叠人工复核队列

| 相似度 | 文章 A | 文章 B |
|---:|---|---|
| 0.493 | 107 关键帧与动画预演（Keyframes & Animatic — From Concept Art to Screen） | 110 AI 视觉特效管线（VFX Pipeline — Roto / Matchmove / Comp & AI Application） |
| 0.482 | 341 电影实拍光效艺术（Practical Lighting — Motivated Sources & In-Frame Light） | 350 电影实拍光效-动机-叙事三整合（Motivated Light × Narrative — Unmotivated as Tool） |
| 0.471 | 269 电影类型片音乐符号（Genre Scoring — Horror, Noir, Western & Sci-Fi Conventions） | 287 电影类型片场景惯例（Genre Settings — Horror House, Western Frontier & Sci-Fi Spaces） |
| 0.454 | 246 AI 图片摄影构图心理学（Composition Psychology — Eye Tracking & Gaze Guidance） | 346 AI 图片构图心理学应用（Composition Psychology Applied — GazeFusion & Saliency-Guided Design） |
| 0.453 | 362 AI 图片运动-注意-情绪三融合（Motion-Attention-Emotion — Affective Saliency Fusion） | 371 AI 图片情感显著-互动-沉浸三融合（Affective Saliency × Interactive × Immersive — VR-Aware Fusion） |
| 0.448 | 164 AI 动作与表演生成（Motion & Performance — Motion Transfer, Pose Control & Mocap-Less） | 211 AI 运动风格迁移（Motion Style Transfer — Video-to-Video & Retargeting） |
| 0.446 | 171 AI 多镜头连续性物理（Continuity Physics — 180° Rule, Eyeline & Spatial Logic） | 227 电影机位调度理论（Camera Coverage Theory — Master Shot, Coverage & Triangle System） |
| 0.429 | 267 电影通感设计（Film Synesthesia — Color-Sound Correspondence & Sensory Design） | 276 电影色彩-音乐-节奏通感（Color-Music-Rhythm — Visual-Auditory Rhythm & Synaesthetic Practice） |
| 0.425 | 119 音频视频协同（Audio-Video Sync — AI Voice, Music & Lip-Sync） | 134 AI 音乐视频生成专项（Music Video Generation — Lyrics, Beat Sync & MV Workflow） |
| 0.419 | 117 AI 一致性全体系（AI Consistency System — Character / Scene / Product / Style） | 123 AI 长视频与多镜叙事一致性（Long-Form AI Video — Multi-Shot Narrative Consistency） |
| 0.419 | 117 AI 一致性全体系（AI Consistency System — Character / Scene / Product / Style） | 238 AI 图片系列一致性（Image Series Consistency — Character DNA & Frame Chaining） |
| 0.417 | 346 AI 图片构图心理学应用（Composition Psychology Applied — GazeFusion & Saliency-Guided Design） | 355 AI 图片显著-视线-格式塔应用（Saliency-Gaze-Gestalt — Attention Control Framework） |
| 0.416 | 105 宣传片 / TVC 制作全流程（Commercial & TVC Production Pipeline — Terms & Workflow） | 106 导演需求澄清与创意简报（Director Briefing & Creative Brief — Terms & Practice） |
| 0.411 | 240 AI 图片风格参考驱动（Style Reference Driven — StyleGallery & Semantic-Aware Transfer） | 391 AI 图片参考锚定生成（Reference-Anchored Generation — Identity & Style Consistency） |
| 0.410 | 117 AI 一致性全体系（AI Consistency System — Character / Scene / Product / Style） | 165 AI 视频场景与环境生成（Environment Generation — Virtual Sets & Location Coherence） |
| 0.408 | 117 AI 一致性全体系（AI Consistency System — Character / Scene / Product / Style） | 391 AI 图片参考锚定生成（Reference-Anchored Generation — Identity & Style Consistency） |
| 0.407 | 218 电影色彩设计（Film Color Design — Master Palette & Cross-Department Cohesion） | 222 电影美术设计统一（Production Design — Unified Visual World & Art Department） |
| 0.407 | 261 AI 图片光影方向情绪库（Light Direction Emotion — Side, Top, Back & Under Light） | 342 AI 图片光影叙事（Light-Shadow Narrative — Silhouette, Backlight & Shadow as Story） |
| 0.406 | 265 电影类型片视觉符号（Genre Visual Semiotics — Iconography & Conventions） | 269 电影类型片音乐符号（Genre Scoring — Horror, Noir, Western & Sci-Fi Conventions） |
| 0.405 | 216 AI 图片构图法则体系（Composition Rules — Framing, Leading Lines & Visual Hierarchy） | 271 AI 图片构图叙事权重（Narrative Weight — Size, Scale & Visual Hierarchy） |
| 0.404 | 105 宣传片 / TVC 制作全流程（Commercial & TVC Production Pipeline — Terms & Workflow） | 110 AI 视觉特效管线（VFX Pipeline — Roto / Matchmove / Comp & AI Application） |
| 0.401 | 123 AI 长视频与多镜叙事一致性（Long-Form AI Video — Multi-Shot Narrative Consistency） | 238 AI 图片系列一致性（Image Series Consistency — Character DNA & Frame Chaining） |
| 0.396 | 226 AI 图片角色概念设计（Character Concept Design — Sheets, Turnarounds & Silhouette） | 228 AI 图片场景概念设计（Environment Concept Art — World Building & Key Art） |
| 0.394 | 335 AI 图片跨模态沉浸系列（Cross-Modal Immersive Series — Unified Multimodal Storytelling） | 337 AI 图片全整合世界设计（Total World Design — Image + Narrative + Audio Unified Series） |

## 建议的后续人工清洗顺序

1. 工艺问题先读基础篇（01 / 115 / 116 / 117）；综合篇只作上下位。
2. 再合并时写 `redirects.json` 与目标 `aliases`，并在规范文加合并说明。
3. 模型、平台、法规看 `stale_after`。
4. 新文章必须带 OKF `type`，并用 Markdown 链接连到相关概念。

