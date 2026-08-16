---
name: directorx-methodology
description: >-
  2026 视频制作方法论速查（联网调研沉淀）：成片结构/留存曲线/提示词工程/
  剪辑节奏/LLM 精剪的可执行规则。写脚本、剪节奏、做质检前先查本技能，
  用规则而不是凭感觉。
user-invocable: true
---

# 制作方法论速查（2026 调研沉淀）

调研来源：OpenAI Sora 2 Cookbook、Kling 3.0 官方 Quickstart、Google Cloud
Veo 提示词指南、Runway Help Center、NarratoAI、Moozix、Walter Murch 六原则
及 3 篇视频 agent 论文（arXiv）。规则可直接执行：

## 成片结构

1. **黄金 3 秒钩子**：前 3 秒必须完成「制造悬念/反差/利益点」三者之一；
   钩子用「反常识断言」「数字冲击」「未完待续」三种句式之一。
2. **pattern interrupt**：每 3–5 秒一次视觉/听觉变化（切镜、景别变化、
   字幕强调、音效重音），超过 5 秒无变化 = 流失区。
3. **留存曲线五形态诊断**：开头掉=钩子弱；中段掉=信息密度低；结尾掉=
   结尾无行动号召；全程缓降=节奏平；锯齿=段落感强（最佳）。
4. **时长密度表**：21–34s 为信息型最优；口播每句 ≤16 字（字幕）、
   4 字/秒；广告 15–30s 单卖点。
5. **口播 10 结构**：钩子→痛点→放大→方案→亮点×3→证据→对比→
   使用场景→CTA→钩子回收。

## AI 提示词工程

6. **单镜单一动作律**：一镜只写一个主运动；多阶段动作拆多镜
   （Kling 动作敏感、Sora 镜头解剖同律）。
7. **角色绑定三件套**：身份块逐字复用（发型/服装/接缝/义眼）+
   参考图注入 + 负面词排除漂移；跨镜不新增设定。
8. **对白音画同步**：需要说话的镜头在提示词写「人物开口说话」+
   给对白文本；Veo 用 `[00:00-00:0N] 镜头；SFX:` 时间戳语法；
   音画同出模型开 native audio。
9. **镜头解剖式提示词**（Sora 2 官方）：主体 → 动作 → 运镜 → 环境 →
   光线 → 氛围 → 对白块，逐块锁定，不混写。

## 剪辑节奏

10. **卡点时长分配表**：快节奏 BGM 切点 0.5–1s/镜；中速 1–2s；
    慢速 2–4s；高潮段切点间隔递减制造加速感。
11. **Murch 六原则优先级**：情感 > 故事 > 节奏 > 视线 > 屏幕平面 >
    空间连续；切点选择按此排序。
12. **30 度规则**：相邻镜机位角度变化 >30 度或景别差一档，否则像跳帧。

## LLM 精剪（NarratoAI 类）

13. **四步管线**：转写（srt）→ 脚本句与字幕条目匹配 → 按脚本顺序
    组装窗口 → 节奏 QA（规则 3/10）。工具：`directorx_smart_cut`
    （匹配+组装一体）+ `directorx_qa`（成片质检门）。

## 使用纪律

- 写脚本/分镜/剪辑决策前，把对应规则编号写进计划理由；
- 质检结论引用规则编号（如「中段信息密度低（规则 3）」）；
- 新调研发现按「规则 + 来源」追加本节。

## 增补细则（2026-08 全量报告回收）

14. **Sora 镜头解剖写法**：容器与内容分离（时长/分辨率/角色是参数不是散文）；
    每镜 = 1 机位 + 1 运镜 + 1 主体动作（动作写节拍计数：「走四步到窗边，
    停顿，最后一秒拉开窗帘」）；跨镜复用相同描述短语 + 固定 3–5 个颜色锚点；
    精修一次只改一个变量，反复翻车就做减法。
15. **Veo 景别/运镜词汇表**（可直接进提示词）：eye-level/low/high/bird's-eye/
    worm's-eye/dutch/close-up/ECU/medium/full/wide/OTS/POV ×
    static/pan/tilt/tracking；负面提示用描述（"wall, frame"）不用祈使句。
16. **角色参考图标准**（Runway 官方）：自然均匀光 + 中性表情 + 中等画质
    （「空白画布」原则）；一张角色一张用途（角色/环境/风格分别控制）；
    Sketch 参考可控制构图与视线。`directorx_character_register` 的
    refPath 应遵守本标准。
17. **卡点 9 步工作法**（Moozix）：按歌曲结构分配镜头（重音 2s / 叙事
    4–6s / 副歌 6–10s，3 分钟约 24–28 镜）；高能段 cut-on-beat、
    抒情段 cut-on-breath 交替；A/B 配比 60–70% 表演 + 30–40% 穿插；
    灯光当节奏图谱（快段高对比浅景深）。
18. **LLM 精剪四步管线**（NarratoAI + ESA 论文）：转写+抽帧描述 →
    按脚本标注所需镜头语义 → 视觉语义检索候选片段评分排序 →
    组装时间轴导出（EDL/剪映草稿）。我们对应：transcribe →
    smart_cut 匹配 → subtitle_cut/timeline 组装 → 导出 timeline.json。

## 音频方法论（2026-08 调研沉淀）

19. **混音铁律**：对白为基准（0 dB 参照），BGM 垫底 -18~-22 dB，
    ducking 标准参数：Threshold -15~-20dB、Ratio 3:1~4:1、Attack
    10~30ms、Release 200~500ms、压降 6~12dB（已写入 audio_mix 侧链）；
    交付响度按平台：短视频 -14 LUFS、广播 -23 LUFS、长片 -27 LUFS。
    工具落点：`directorx_audio_mix` / `directorx_audio_sync`。
20. **SFX 三层**：Foley（动作声）+ 环境声（铺底）+ 设计音效（卡点重音）；
    硬音效遮剪辑点、riser→impact 转场、高潮后 0.5s 静默留白。
    工具落点：`directorx_audio_beat` 找卡点 → 音效对齐切点。
21. **语速预算公式**：中文口播 4 字/秒（240 字/分钟）；纪录片 3~4 字/秒
    （÷200）；广告/快节奏 4.5~5 字/秒（÷280）；成片时长 = 字数 ÷ 对应速率；
    停顿：句间 0.3~0.6s、段落 0.8~1.2s；每句 1~2 个重音词。
    工具落点：`directorx_storyboard` 时长校验 + `directorx_transcribe_audio`。
22. **字幕双标准**：单行 ≤16 字（中文短视频共识）+ 每秒 ≤17 字符
    （Netflix TTSG）；中文字幕行高与安全区避让。工具落点：
    `directorx_video_subtitle` + talking-video 模板硬性规范。
23. **AI 音频三段式提示词**：情绪指令（OpenAI `instructions` 写情绪、
    目标语速）+ 声音设计（音色/配器/混响）+ 结构标签
    （Suno `[Verse]/[Chorus]`）。工具落点：`directorx_generate_audio`。


24. **卡点层级表**：鼓点 = 快切；人声 onset = 叙事切点；和弦变化 =
    情绪转折；副歌 = 高潮素材。硬音效遮剪辑点；riser→impact 转场；
    高潮后 0.5s 静默重置注意力。工具落点：`directorx_audio_beat` →
    切点时间码映射到 timeline/montage。
25. **字幕同帧校验**：字幕与语音 ±1 帧对齐；中文 3~5 字/秒；单条最短
    0.83s。管线建议：transcribe → srt → smart_cut/timeline 时用
    subtitleCut 的 pad 控制在 0.1s 内保对齐。

## 知识库深潜索引（规则 → 语料文章）

规则是速查层；深潜用 `directorx_knowledge_search` / `directorx_knowledge_read`：
- 规则 6/9/14 镜头解剖 → 文章 01 镜头语言与景别（19k 字全集）、89 名场面运镜解剖
- 规则 12 转场/30 度 → 文章 02 剪辑与转场（蒙太奇/Murch）、127 AI 剪辑转场节奏
- 规则 10/17 卡点节奏 → 文章 127、63 字幕节奏
- 规则 7/16 角色一致性 → 文章 123 AI 长视频多镜一致性（场景卡/跨镜 QA）
- 场面调度/构图 → 文章 07 导演技巧、94 场景调度深化、233 场面调度全要素
- 叙事视点 → 文章 234 叙事视点（客观/主观/POV）

## 负面提示词体系（2026-02 调研沉淀）

26. **负面提示四类基底**（每镜必带的 copy-paste 底线）：
    `blurry, low quality, pixelated, compression artifacts, watermark,
    text overlay, subtitles, distorted limbs, extra fingers, deformed face,
    flickering, jitter, strobing, duplicate subjects, morphing face`
    四类：质量伪影 / 解剖错误 / 覆盖层（文字水印）/ 运动伪影。
27. **风格污染与一致性负面**：风格选边——动画向显式阻断
    `live action, photorealistic, 3D render`；实拍向阻断
    `cartoon, anime, illustration, painting`；跨镜一致性负面：
    `changing costume, morphing face, inconsistent hair color, prop
    swapping`。负面只能抑制漂移，锁定靠角色卡（规则 7）+ 负面并用。
28. **负面失效时的替代策略**：闭源模型负面权重弱——同一条负面反复翻车时：
    ①手机实拍 10s 动作当参考视频 ②手绘构图草图喂给生成 ③检查角色卡
    源头面板修错因（负面只抑制、卡图纠根）。接触镜头（抱人/持物）最易崩，
    直接上草图参考。

## 镜头语言提示词细则（2026 调研沉淀）

29. **五轴装配顺序**（每条镜头提示词固定顺序，防要素丢失）：
    景别（ECU/CU/MCU/MS/WS）→ 镜头感+画幅（lens/aspect）→ 光源
    （命名+比例）→ 色板 → 构图 → 氛围 → 情绪基调 → 摄影风格归属 →
    负面提示。每镜自足：模型没有正反打/轴线概念，不跨镜假设连续性。
30. **运镜一动词 + 地理写法**：「slow dolly in」「tracking shot left to
    right keeping subject centered」「handheld follow, slight sway」
    「rack focus from foreground prop to face」；whip pan 不可靠；
    跨镜头连续运动：用参考视频续接（上一镜尾帧）保持运镜动量。
31. **镜头感点名光学、不点氛围**：「anamorphic, 2.40:1, oval bokeh,
    horizontal flares」/「spherical 35mm, circular bokeh」/「85mm portrait
    compression, shallow DOF」；光线写光源与比例：「Rembrandt key from
    screen-left lamp, no fill, 85:15 dark-to-light」——泛写「warm
    lighting」必漂。
32. **表演写可观察行为、不写意图**：模型不会「演情绪」——把潜台词转成
    可观察动作：「holds the look two beats longer, mouth slightly parts,
    hand stops mid-reach」而非「more longing」。微表情/呼吸/姿态/视线
    方向可翻译，情绪动词不可翻译。接触镜头（抱人/持物）最易崩，直接
    上草图参考。
