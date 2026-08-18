---
type: Playbook
title: "影视制作全流程与术语大全（Production Workflow & Glossary）"
description: "制作流程知识库：制作三阶段、岗位职责、制作文档体系、技术规格、100+ 行业术语字典、交付规范"
tags:
  - "foundation"
  - "workflow"
  - "spec"
status: stable
generated:
  by: "process:directorx-knowledge-okf"
  at: "2026-08-18T00:00:00Z"
verified:
  - by: "process:knowledge-audit"
    at: "2026-08-18T00:00:00Z"
sources:
  - resource: "cited:Wikipedia Glossary of motion picture terms / Film crew"
    id: cite-1
    title: "Wikipedia Glossary of motion picture terms / Film crew"
  - resource: "cited:Careers In Film 剧组岗位指南"
    id: cite-2
    title: "Careers In Film 剧组岗位指南"
  - resource: "cited:Netflix/Warner 交付规格"
    id: cite-3
    title: "Netflix/Warner 交付规格"
  - resource: "cited:行业标准（Rec.709"
    id: cite-4
    title: "行业标准（Rec.709"
  - resource: "cited:EBU R128 等）。"
    id: cite-5
    title: "EBU R128 等）。"
  - resource: "https://en.wikipedia.org/wiki/Glossary_of_motion_picture_terms"
    id: url-1
    title: "en.wikipedia.org"
  - resource: "https://en.wikipedia.org/wiki/Film_crew"
    id: url-2
    title: "en.wikipedia.org"
  - resource: "https://www.careersinfilm.com/film-crew/"
    id: url-3
    title: "careersinfilm.com"
  - resource: "https://www.studiobinder.com/blog/stages-of-film-production/"
    id: url-4
    title: "studiobinder.com"
  - resource: "https://www.studiobinder.com/blog/movie-film-terms/"
    id: url-5
    title: "studiobinder.com"
dx_id: "08"
related:
  - "54-thumbnail-cover-system/thumbnail-cover-system.md"
  - "73-ai-prompt-quickref/ai-prompt-quickref.md"
  - "114-ai-video-model-matrix/ai-video-model-matrix.md"
---

# 影视制作全流程与术语大全（Production Workflow & Glossary）

> 本页是 DirectorX 制作流程知识库：制作三阶段、岗位职责、制作文档体系、技术规格、100+ 行业术语字典、交付规范。术语定义供 Agent 精准描述需求与审查交付。
> 来源：Wikipedia Glossary of motion picture terms / Film crew、Careers In Film 剧组岗位指南、Netflix/Warner 交付规格、行业标准（Rec.709、EBU R128 等）。

## 概述

影视制作（Filmmaking / Video Production）分为**前期（Pre-production）→ 拍摄（Production）→ 后期（Post-production）→ 交付（Delivery）**四大阶段（细分版为五阶段：开发 Development → 前期 → 拍摄 → 后期 → 发行 Distribution）。每个阶段有专属的文档、岗位与验收标准。本页同时收录 100+ 常用术语，供"用术语精准下需求"与"用术语审查交付"。

## 制作四阶段

### 1. 前期筹备（Pre-production）
**目标**：把剧本变成可执行的拍摄计划。
- 剧本定稿（锁定对白与场景，冻结后改动成本飙升）；
- 分镜与镜头表（见 07 导演文档）；
- 选角（Casting）；
- 勘景（Location Scouting）：场地照片、光线窗口、噪音、电源、许可；
- 预算（Budget）与资金；
- 拍摄计划（Shooting Schedule）：按场景/演员/地点集中排期；
- 主创团队到位（DP、美术、声音、剪辑）；
- 技术测试（镜头、灯光、录音器材试拍）。

### 2. 拍摄期（Production / Principal Photography）
**目标**：按镜头表采集素材。
- 每日通告单（Call Sheet）：次日到场时间、场景、镜头清单、联系人；
- 场记（Script Supervisor）记录连续性（服装/道具/位置/视线）与每日日志；
- 每日样片（Dailies）审看：确认表演与画面达标，及时补拍；
- 素材备份（双备份 + 校验）——拍摄期最大的技术风险是丢素材；
- 拍摄报告（Production Report）：每日进度、超时、问题记录。

### 3. 后期制作（Post-production）
**目标**：素材 → 成片。
- 剪辑（Editing）：粗剪（Rough Cut）→ 精剪（Fine Cut）→ 锁定画面（Picture Lock）；
- 声音后期：对白修整 → 拟音（Foley）→ 音效（SFX）→ 配乐（Score）→ 混音（Mix，见 06 文档）；
- 调色（Color Grading）：色彩校正（Correction）→ 风格化调色（Grade），按交付标准（Rec.709 SDR / Rec.2020 HDR）；
- 视效（VFX）：绿幕合成、擦除、特效（按需）；
- 字幕（Subtitles/Captions）：对白字幕 + 无障碍字幕；
- 母带（Master）：最终视频+音频的单一权威版本。

### 4. 交付与发行（Delivery & Distribution）
- 审片流程：内部审（导演/制片）→ 客户/平台审 → 修改 → 终版；
- 版本管理：V1/V2/Final 命名规范，避免"最终版_final_v3.mp4"；
- 交付规格：按平台输出对应分辨率/帧率/码率/响度（见下节）；
- 归档：母版、工程文件、素材、字体、音乐授权文件一并归档。

## 岗位与职责（Film Crew Roles）

| 岗位 | 英文 | 一句话职责 |
|---|---|---|
| 制片人 | Producer | 统筹全局、预算与关键人员 |
| 执行制片 | Executive Producer | 出资与商务决策 |
| 制片主任 | Line Producer | 预算拆分与执行监督 |
| 导演 | Director | 视觉叙事与表演总负责 |
| 副导演 1st/2nd AD | Assistant Director | 现场进度与调度协调 |
| 编剧 | Screenwriter | 剧本创作 |
| 摄影指导 | Director of Photography (DP) | 画面、光线、镜头语言 |
| 摄影操作员 | Camera Operator | 实际操作摄影机 |
| 灯光师 | Gaffer | 灯光与电力安全 |
| 机械组长 | Key Grip | 机位支撑与轨道设备 |
| 美术指导 | Production Designer | 场景与整体视觉基调 |
| 服装设计 | Costume Designer | 角色服装 |
| 化妆发型 | Hair & Makeup (HMU) | 角色形象一致性 |
| 选角导演 | Casting Director | 演员筛选与试镜 |
| 勘景员 | Location Scout | 场地寻找与评估 |
| 场记 | Script Supervisor | 连续性记录 |
| 录音师 | Sound Recordist / Mixer | 现场收音 |
| 拟音师 | Foley Artist | 棚内拟声 |
| 剪辑师 | Editor | 镜头组合与节奏 |
| 声音剪辑/设计 | Sound Editor / Designer | 声音层构建 |
| 配乐师 | Composer | 原创音乐 |
| 调色师 | Colorist | 色彩校正与风格 |
| 视效师 | VFX Artist | 视觉特效 |
| 后期制片 | Post-Production Supervisor | 后期进度管理 |

**线内/线下（Above/Below the Line）**：制片人、导演、编剧（+主演）为"线内"（创意与预算主导）；其余为"线下"（执行团队）。

## 制作文档体系

| 文档 | 用途 | 关键内容 |
|---|---|---|
| 剧本 Script | 一切起点 | 对白、场景、动作 |
| 分镜 Storyboard | 视觉参考 | 草图、构图、运动方向 |
| 镜头表 Shot List | 执行参数 | 镜号/景别/角度/运动/时长 |
| 拍摄计划 Schedule | 排期 | 按场景/演员/地点排序 |
| 通告单 Call Sheet | 每日指令 | 时间/地点/人员/镜头 |
| 预算表 Budget | 成本控制 | 各科目费用 |
| 拍摄报告 Production Report | 进度记录 | 完成/超时/问题 |
| 场记单 Continuity Notes | 一致性 | 服装/道具/位置/视线 |
| 交付清单 Delivery Checklist | 验收 | 规格/字幕/授权/归档 |

## 技术规格（Technical Specs）

### 分辨率（Resolution）
| 名称 | 像素 | 用途 |
|---|---|---|
| 720p HD | 1280×720 | 低带宽 |
| 1080p Full HD | 1920×1080 | 通用交付标准 |
| 2K DCI | 2048×1080 | 影院 |
| 4K UHD | 3840×2160 | 平台高标准/新片标准 |
| 8K UHD | 7680×4320 | 旗舰/未来 |

### 帧率（Frame Rate）
| 帧率 | 语境 | 效果 |
|---|---|---|
| 24fps | 电影标准 | 电影感（运动模糊） |
| 25fps | PAL/欧洲/国内电视 | 与 50Hz 电网同步 |
| 30fps | NTSC/直播 | 电视新闻 |
| 50/60fps | 体育/游戏 | 顺滑 |
| 120fps | 慢动作素材 | 高速慢放 |

**180° 快门规则**：快门 ≈ 1/(2×帧率)（24fps → 1/48s），产生自然的运动模糊；高帧率 + 快快门 = "视频感"。

### 宽高比（Aspect Ratio）
| 比例 | 用途 |
|---|---|
| 16:9 | 横屏通用（YouTube/B站/电视） |
| 9:16 | 竖屏短视频（TikTok/抖音/Reels/Shorts） |
| 4:3 | 复古/老电视/艺术 |
| 2.39:1（变形宽银幕） | 院线电影感 |
| 1.85:1 | 院线标准宽银幕 |

### 编码与封装（Codec & Container）
- 交付常见：H.264（通用兼容）、H.265/HEVC（同画质更小）、ProRes 422/4444（后期母版，Mac 生态）、DNxHR（后期母版，跨平台）。
- 封装：MP4（通用交付）、MOV（苹果/后期）、MXF（广播）。
- 码率：1080p 交付建议 8-16 Mbps（H.264）；4K 建议 35-80 Mbps；平台会上传后二次转码，原片码率留足。

### 色彩（Color）
- Rec.709 + SDR：网络/电视默认交付色域（sRGB 近似）。
- Rec.2020 + HDR（HLG/PQ）：HDR 交付（杜比视界等按平台要求）。
- 位深：8-bit 交付、10-bit 后期（避免色带）。
- 调色链路：摄影机 Log → 色彩校正 → 风格化 → 按交付标准输出。

### 音频（Audio）
- 48kHz / 24-bit；响度流媒体 -14 LUFS、广播 -23 LUFS；True Peak ≤ -1 dBTP（详见 06 文档）。

## 术语字典（100+ 词条）

### 拍摄与画面（Camera & Picture）
1. 镜头 Shot：开机到停机的连续画面
2. 景别 Shot Size：画面包含范围
3. 建立镜头 Establishing Shot：交代时空
4. 主镜头 Master Shot：整场戏全景完整拍摄
5. 过肩镜头 Over-the-Shoulder (OTS)：越过肩头拍摄
6. 单人镜头 Single：单独人物镜头
7. 插叙镜头 Insert：细节特写
8. 反应镜头 Reaction Shot：听者表情
9. 主观镜头 POV：角色视角
10. 反向镜头 Reverse Shot：对话反打
11. 跳切 Jump Cut：小角度切换的跳变
12. 切出 Cutaway：插播他物镜头
13. 机位 Camera Position：摄影机位置
14. 平视/俯视/仰视 Eye/High/Low Angle
15. 荷兰角 Dutch Angle：倾斜构图
16. 摇镜 Pan：水平转动
17. 俯仰 Tilt：垂直转动
18. 推镜 Dolly In：前进
19. 拉镜 Dolly Out：后退
20. 横移 Truck/Tracking：平移跟随
21. 升降 Crane：机械臂移动
22. 手持 Handheld：无稳定器
23. 斯坦尼康 Steadicam：穿戴稳定器
24. 变焦 Zoom：镜头内变焦
25. 推轨变焦 Dolly Zoom：背景变形
26. 焦距 Focal Length：视角与透视
27. 广角 Wide Angle：透视夸张
28. 长焦 Telephoto：空间压缩
29. 景深 Depth of Field：清晰范围
30. 焦外 Bokeh：背景光斑
31. 三分法 Rule of Thirds：构图法则
32. 引导线 Leading Lines：视线引导
33. 框架构图 Frame in Frame：画中画
34. 头顶空间 Headroom：头部留白
35. 视线空间 Lookroom：视线留白
36. 轴线 180° Rule：机位不越线
37. 视线匹配 Eyeline Match：视线方向一致
38. 帧 Frame：单张画面
39. 帧率 Frame Rate：每秒帧数
40. 快门规则 180° Rule：运动模糊标准
41. 分辨率 Resolution：像素数
42. 宽高比 Aspect Ratio：画面比例
43. 色温 Color Temperature：光线冷暖
44. 白平衡 White Balance：色彩基准
45. 曝光 Exposure：进光量
46. 光圈 Aperture：进光孔径
47. 景深预览 Depth Preview
48. 低照度 Low Light：暗光环境
49. 高光 Highlight：亮部
50. 阴影 Shadow：暗部
51. 对比度 Contrast：明暗差
52. 饱和度 Saturation：色彩浓度
53. 色调 Hue：色相
54. LUT：色彩查色表
55. 调色 Color Grading：风格化色彩
56. 色彩校正 Color Correction：技术修正
57. Log 素材：宽动态范围素材
58. Rec.709：SDR 标准色域
59. HDR：高动态范围

### 剪辑与转场（Editing & Transitions）
60. 剪辑点 Cut Point：镜头切换位置
61. 硬切 Cut：瞬时切换
62. 叠化 Dissolve：渐叠过渡
63. 淡入淡出 Fade In/Out：渐显渐黑
64. 白闪 Washout：闪白
65. 匹配剪辑 Match Cut：图形/动作匹配
66. 划像 Wipe：分界线扫过
67. 自然划像 Natural Wipe：画面内元素遮挡
68. 圈入圈出 Iris：圆形光圈
69. 甩镜转场 Whip Pan：快速甩镜
70. J 切 J Cut：声音先行
71. L 切 L Cut：声音延后
72. 声音桥 Sound Bridge：声音跨场景
73. 蒙太奇 Montage：镜头并置表意
74. 平行剪辑 Parallel Editing：两线交叉
75. 动作匹配 Match on Action：动作中剪辑
76. 隐形剪辑 Invisible Cut：隐藏剪辑点
77. 时间线 Timeline：剪辑时间轴
78. 粗剪 Rough Cut：初版剪辑
79. 精剪 Fine Cut：定稿剪辑
80. 画面锁定 Picture Lock：剪辑冻结
81. 出入点 In/Out Point：片段起止
82. B-Roll：辅助画面素材
83. A-Roll：主体镜头素材
84. 代理文件 Proxy：低分辨率剪辑副本
85. 多机位 Multi-Cam：多机素材同步

### 声音（Sound）
86. 对白 Dialogue：台词
87. 音乐 Music：配乐
88. 音效 SFX：效果声
89. 环境声 Ambience：氛围声
90. 拟音 Foley：同步拟声
91. 同期声 Sync Sound：现场录音
92. 后期配音 ADR/Dubbing：补录对白
93. 旁白 Voice-over：画外解说
94. 混音 Mixing：多层平衡
95. 母带 Mastering：最终定型
96. 响度 Loudness：感知音量
97. LUFS：响度单位
98. True Peak：真实峰值
99. 均衡 EQ：频段调整
100. 压缩 Compressor：动态处理
101. 混响 Reverb：空间感
102. 声像 Pan：左右位置
103. 环境底噪 Room Tone：场地静音样本
104. 卡点 Cut on Beat：节拍对齐

### 剧组与制作（Crew & Production）
105. 制片 Producer：统筹与预算
106. 导演 Director：视觉叙事
107. 摄影指导 DP：画面与光线
108. 灯光师 Gaffer：灯光电力
109. 场记 Script Supervisor：连续性
110. 副导演 AD：现场调度
111. 剪辑师 Editor：镜头组合
112. 调色师 Colorist：色彩
113. 拟音师 Foley Artist：拟声
114. 通告单 Call Sheet：每日计划
115. 拍摄计划 Shooting Schedule：排期
116. 勘景 Location Scout：找场地
117. 试镜 Audition：演员筛选
118. 开机 Action：拍摄开始口令
119. 停机 Cut：拍摄结束口令
120. 拍板 Slate/Clapper：同步板
121. 时间码 Timecode：帧级时间标记
122. 片场 Set：拍摄现场
123. 后期 Post-production：剪辑调色声音
124. 样片 Dailies：每日素材审看
125. 母版 Master：权威成片版本
126. 交付规格 Delivery Spec：平台验收标准
127. 字幕 Subtitles：对白文字
128. 无障碍字幕 Captions：含声音描述字幕
129. 导演剪辑版 Director's Cut：导演版本
130. 片尾字幕 Credits：人员名单

### 叙事与理论（Narrative & Theory）
131. 场景 Scene：同一时空的连续段落
132. 序列 Sequence：多场景单元
133. 段落 Act：幕
134. 主题 Theme：核心思想
135. 冲突 Conflict：戏剧对抗
136. 悬念 Suspense：预期张力
137. 反转 Twist：预期落空
138. 潜台词 Subtext：言外之意
139. 故事板 Storyboard：分镜图
140. 蒙太奇理论 Montage Theory：镜头碰撞表意
141. 库里肖夫效应 Kuleshov Effect：关系产生意义
142. 场面调度 Mise-en-scène：画面内一切元素的安排
143. 故事内 Diegetic：叙事世界内（声音/元素）
144. 非故事内 Non-diegetic：叙事世界外（配乐/旁白）
145. 连续性 Continuity：跨镜头一致
146. 时间跳跃 Time Jump：叙事时间省略
147. 闪回 Flashback：过去画面
148. 闪前 Flashforward：未来画面
149. 慢动作 Slow Motion：降速
150. 延时摄影 Time-lapse：加速

## 交付与发布规范（Delivery Checklist）

### 通用交付检查清单
```
□ 分辨率/帧率/宽高比符合目标平台
□ 响度归一（流媒体 -14 LUFS；广播 -23 LUFS），True Peak ≤ -1 dBTP
□ 色彩：Rec.709 SDR（或平台要求的 HDR 规格）
□ 编码兼容（H.264 MP4 通用；母版 ProRes/DNxHR）
□ 时长符合平台限制
□ 字幕已嵌入或外挂（对白 + 关键信息）
□ 音轨无爆音、无真空静音、对白清晰
□ 全片完整解码（无花屏/卡帧/黑场异常）
□ 版本命名规范（V1/V2/Final + 日期）
□ 素材/工程/授权文件归档
```

### 平台交付参考
| 平台 | 常用规格 |
|---|---|
| YouTube/B站（横屏） | 1080p/4K，24/30fps，H.264，-14 LUFS |
| TikTok/抖音/Reels/Shorts | 9:16 竖屏，1080×1920，30fps，H.264，-14 LUFS，注意安全区 |
| 电视/广播 | 25fps（PAL），Rec.709，-23 LUFS（EBU R128） |
| 院线/高端母版 | 2K/4K，24fps，ProRes 4444，HDR 按需 |

## 在 AI 视频生成中的应用

1. **术语精准下需求**：用术语表描述——"中景过肩、85mm 浅景深、L 切声音桥、-14 LUFS 响度"比模糊描述更可执行。
2. **交付检查清单**：AI 生成/剪辑后按上述清单逐项验证（时长、画幅、响度、字幕、可解码性）。
3. **流程文档化**：每部片子建立"项目规格 + 镜头表 + 连续性账本 + 交付清单"四件套，对应 DirectorX 的 production graph 节点。
4. **术语跨文档检索**：术语不确定时先查本页字典，再回对应主题文档读详细解释。

## 来源

- Wikipedia: Glossary of motion picture terms — https://en.wikipedia.org/wiki/Glossary_of_motion_picture_terms
- Wikipedia: Film crew — https://en.wikipedia.org/wiki/Film_crew
- Careers In Film: Film Crew Positions — https://www.careersinfilm.com/film-crew/
- StudioBinder: Stages of Film Production — https://www.studiobinder.com/blog/stages-of-film-production/
- StudioBinder: Film Terms Glossary（索引） — https://www.studiobinder.com/blog/movie-film-terms/
- Netflix Partner Help: Delivery Specifications — https://partnerhelp.netflixstudios.com/hc/en-us/articles/7262346654995
- Warner Media: SDR Content Specs — https://partnerhub.warnermediagroup.com/ingest-specifications/sdr-content

## 相关概念

- [AI 缩略图与封面视觉系统（Thumbnail & Cover Visual System）](../54-thumbnail-cover-system/thumbnail-cover-system.md)
- [AI 视频模型提示词总表（Prompt Format Quick Reference）](../73-ai-prompt-quickref/ai-prompt-quickref.md)
- [AI 视频模型能力矩阵（AI Video Model Matrix 2026 — Capabilities & Selection）](../114-ai-video-model-matrix/ai-video-model-matrix.md)
