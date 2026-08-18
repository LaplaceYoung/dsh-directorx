---
type: Spec
title: "AI 视频交付规格总表（AI Video Delivery Spec Matrix — 2026）"
description: "AI 生成视频的交付规格速查：全平台上传规格（2026 官方文档数值）、音频响度（LUFS/dBTP）、色彩空间与母版格式、导出三杠杆、AI 生成物交付注意（抽帧质检/响度校准/格式转换）"
tags:
  - "synthesis"
  - "color"
  - "sound"
  - "qa"
  - "platform"
  - "spec"
status: stable
stale_after: "2027-08-18"
generated:
  by: "process:directorx-knowledge-okf"
  at: "2026-08-18T00:00:00Z"
verified:
  - by: "process:knowledge-audit"
    at: "2026-08-18T00:00:00Z"
sources:
  - resource: "cited:YouTube Help Recommended upload encoding settings"
    id: cite-1
    title: "Recommended upload encoding settings"
    author: "org:YouTube-Help"
  - resource: "cited:https://support.google.com/youtube/answer/1722171"
    id: cite-2
    title: "https://support.google.com/youtube/answer/1722171"
  - resource: "cited:抖音开放平台 上传视频"
    id: cite-3
    title: "上传视频"
    author: "org:抖音开放平台"
  - resource: "cited:https://open.douyin.com/platform/resource/docs/openapi/video-management/douyin/create/upload/"
    id: cite-4
    title: "https://open.douyin.com/platform/resource/docs/openapi/video-management/douyin/create/upload/"
  - resource: "cited:微信视频号官方帮助 视频号发表视频/图文有什么格式要求？"
    id: cite-5
    title: "视频号发表视频/图文有什么格式要求？"
    author: "org:微信视频号官方帮助"
  - resource: "cited:https://findeross.weixin.qq.com/cgi-bin/mmfindernodelivecrmwebbroker-bin/helper-center/pages/Yhdpjlq2RIkcmnQu"
    id: cite-6
    title: "https://findeross.weixin.qq.com/cgi-bin/mmfindernodelivecrmwebbroker-bin/helper-center/pages/Yhdpjlq2RIkcmnQu"
  - resource: "cited:TikTok for Developers Content Posting API Media Transfer Guide"
    id: cite-7
    title: "Content Posting API Media Transfer Guide"
    author: "org:TikTok-for-Developers"
  - resource: "cited:https://developers.tiktok.com/doc/content-posting-api-media-transfer-guide"
    id: cite-8
    title: "https://developers.tiktok.com/doc/content-posting-api-media-transfer-guide"
  - resource: "cited:Meta Reels Publishing API"
    id: cite-9
    title: "Reels Publishing API"
    author: "org:Meta"
  - resource: "cited:https://developers.facebook.com/docs/video-api/guides/reels-publishing/"
    id: cite-10
    title: "https://developers.facebook.com/docs/video-api/guides/reels-publishing/"
dx_id: "400"
related:
  - "68-platform-spec-matrix/platform-spec-matrix.md"
  - "112-delivery-specs/delivery-specs.md"
  - "174-qc-automation/qc-automation.md"
  - "161-audio-mastering/audio-mastering.md"
  - "190-color-space-conversion/color-space-conversion.md"
---

# AI 视频交付规格总表（AI Video Delivery Spec Matrix — 2026）

> 本页为 AI 生成视频的交付规格总表：全平台上传规格（分辨率/帧率/码率/时长/格式/文件大小）、音频响度（LUFS/dBTP）、色彩空间（Rec.709/HDR10/HLG/Dolby Vision）与母版格式（ProRes/IMF）。知识本体来自 2026 年平台官方文档与行业标准调研（YouTube/Bilibili/抖音/快手/微信视频号/小红书/TikTok/Meta/Netflix/EBU/ATSC/Dolby/Apple）。AI 应用面向 DirectorX：生成物交付前的规格校验与质检（衔接 68 平台规格总表、112 交付规格、174 成片质检、161 音频母带、190 色彩空间转换）。
> 来源：YouTube Help「Recommended upload encoding settings」、https://support.google.com/youtube/answer/1722171；抖音开放平台「上传视频」、https://open.douyin.com/platform/resource/docs/openapi/video-management/douyin/create/upload/；微信视频号官方帮助「视频号发表视频/图文有什么格式要求？」、https://findeross.weixin.qq.com/cgi-bin/mmfindernodelivecrmwebbroker-bin/helper-center/pages/Yhdpjlq2RIkcmnQu；TikTok for Developers「Content Posting API Media Transfer Guide」、https://developers.tiktok.com/doc/content-posting-api-media-transfer-guide；Meta「Reels Publishing API」、https://developers.facebook.com/docs/video-api/guides/reels-publishing/；Netflix Partner Help「Loudness and True Peaks / Post Production Branded Delivery Specifications」、https://partnerhelp.netflixstudios.com/hc/en-us/articles/360050414014。

## 概述

**核心断言**：AI 生成视频的交付不是"导出个 mp4 就完事"，而是**平台规格校验 + 生成缺陷质检 + 响度/色彩合规**三层动作。生成模型天然带两类交付风险——**技术风险**（生成分辨率/帧率/码率与平台要求错位、被二次压缩）与**内容风险**（口型错位、手部变形、闪烁、一致性漂移等生成缺陷在转码后更明显）。

**与 68（多平台规格总表）和 112（电影级交付规格）的差异**：68 讲常规短视频素材的通用规格，112 讲广播/流媒体的电影级母版。本页把两者收拢到 **AI 生成管线**：生成物的默认输出参数（多为 30fps/MP4/H.264、无音频或 AI 音频）距离平台规格有哪些坑、交付前必须补哪些检查。**表格数值更新到 2026 年平台官方文档**，每个数值标来源。

## 全平台上传规格总表（2026 官方文档）

> 说明：短标记见文末「来源」映射。标注「官方未公布」表示平台官方文档未公开该数值，不要轻信流传数字。「API」指开放平台接口规格，与 App 端上传略有差异（→ 68 三种限制）。

| 平台 | 分辨率上限 | 帧率 | 码率/编码 | 时长 | 格式 | 文件大小 | 来源 |
|---|---|---|---|---|---|---|---|
| YouTube | 8K 7680×4320（推荐 1080p 起） | 24/25/30/48/50/60 | SDR：1080p 8 Mbps、4K 35–45 Mbps（30fps 时）；HDR：1080p 10 Mbps、4K 44–56 Mbps；H.264 High Profile 4:2:0 | 最长 12 小时；未验证账号 15 分钟；Shorts ≤3 分钟 | MP4（H.264+AAC-LC/Opus，48kHz） | 256 GB | [YT-1][YT-2][YT-3][YT-5] |
| Bilibili | 8K 7680×4320（H.265）；4K 触发需短边 ≥1600 | ≤120 fps | 4K 建议 20000 kbps、峰值 ≤60000 kbps（H.264）；8K 推荐 60 Mbps、峰值 180 Mbps（H.265）；音频 ≤320 kbps AAC | ≤10 小时（第三方对照，官方未公布） | mp4/flv（推荐），avi/wmv/mov/webm/mpeg4/ts/mpg/rm/rmvb/mkv | 网页端 ≤4 GB；8K 投稿 ≤16 GB | [BL-1][BL-2][BL-3][BL-4] |
| 抖音 | 推荐 16:9、720p（1280×720）及以上；App 端推荐 1080×1920 | 官方未公布（常见 30/60） | 官方未公布；推荐 mp4/webm | ≤15 分钟 | mp4/webm | API 单文件 ≤128 MB（超限必须分片），总大小 ≤4 GB，分片 5–20 MB | [DY-1][DY-2] |
| 快手 | 电脑端无压缩上传，支持 60 fps；推荐 1080×1920 | ≤60 fps（电脑端官方） | 官方未公布（电脑端无压缩上传） | ≤15 分钟 | 官方未公布（常见 mp4） | 手机端 ≤2 GB（最多 31 段）；电脑端 ≤4 GB | [KS-1][KS-2] |
| 微信视频号 | 建议 1080p 以上 | 官方未公布 | 编码格式不限（h265 需 iPhone 发表或 Mac Safari）；**不支持 HDR** | 手机端 3 秒–60 分钟（旧机型 30 分钟）；电脑端 3 秒–8 小时 | 格式不限；宽高比 0.33–3.0（建议 16:9 / 9:16） | ≤2 GB | [WC-1] |
| 小红书 | 推荐 1080×1920（9:16 / 3:4） | 官方未公布 | 官方未公布 | ≤15 分钟 | 官方未公布（常见 mp4/mov） | 5 GB（第三方对照 2026） | [XHS-1][XHS-2][DY-2] |
| TikTok | 最长边 ≤4096 px、最短边 ≥360 px | 23–60 fps | H.264（推荐）/H.265/VP8/VP9 | 所有创作者 3 分钟，部分 5/10 分钟；API 最长 10 分钟（2024 起测试 60 分钟上传） | MP4（推荐）/WebM/MOV | ≤4 GB（分片 5–64 MB） | [TT-1][TT-2] |
| Instagram Reels | 1080×1920（推荐），最低 540×960 | 24–60 fps | H.264/H.265（VP9/AV1 支持），4:2:0，Closed GOP 2–5 秒；音频 AAC-LC ≥128 kbps 立体声 48 kHz | API 3–90 秒；App 内最长 3 分钟 | MP4（推荐），9:16 | 官方未公布 | [IG-1][IG-2] |

### YouTube 官方推荐上传码率（SDR，30fps / 60fps）

| 分辨率 | 标准帧率（24/25/30） | 高帧率（48/50/60） |
|---|---|---|
| 8K | 80–160 Mbps | 120–240 Mbps |
| 2160p (4K) | 35–45 Mbps | 53–68 Mbps |
| 1440p (2K) | 16 Mbps | 24 Mbps |
| 1080p | 8 Mbps | 12 Mbps |
| 720p | 5 Mbps | 7.5 Mbps |

HDR 上传对应提高约 20–25%：1080p 10/15 Mbps、4K 44–56/66–85 Mbps、8K 100–200/150–300 Mbps。音频推荐：单声道 128 kbps、立体声 384 kbps、5.1 512 kbps（[YT-1]）。

### Bilibili 二压线（超过即被平台二次压缩，画质不可控）

| 清晰度档位 | 码率二压线 |
|---|---|
| 720P | 2000 kbps |
| 1080P | 3000 kbps |
| 1080P+ / 1080P60 | 6000 kbps |
| 4K | 建议 20000 kbps，峰值 ≤60000 kbps |

音频二压线 320 kbps（AAC）；关键帧间隔 ≤10 秒；yuv420、8bit、声道 ≤2、采样率 44100 Hz、逐行扫描。**AI 视频导出时若码率远超二压线，等于白传**（[BL-1][BL-3]）。

## 音频响度表（LUFS / dBTP）

> 响度以**整片集成**（Integrated）计算，不是峰值（→ 112）。短视频平台（抖音/快手/视频号/小红书/TikTok/IG）**官方均未发布 LUFS 规格**，行业惯例按 -14 LUFS / -1 dBTP 交付（[LD-1]）。

| 标准/平台 | 集成响度目标 | 真峰值上限 | 依据 |
|---|---|---|---|
| Netflix 印刷母版 | -27 LKFS ±3（ITU-R BS.1770-1 对白门限）或 -24 LKFS ±3（BS.1770-4 全节目） | ≤ -1 dBTP；Atmos 建议限幅器 -2.3 或更低 | [NF-1][NF-2] |
| YouTube | -14 LUFS（播放归一化目标，只压不抬） | -1 dBTP（行业惯例） | [LD-1] |
| EBU R128（欧洲广播） | -23 LUFS ±0.5（直播 ±1.0） | ≤ -1 dBTP | [EBU-1] |
| ATSC A/85（美国数字电视；中国/日/澳/加同类） | -24 LKFS（dialnorm） | 按 A/85 附录 M 速查表 | [ATSC-1][LD-1] |
| TikTok / Instagram | 官方未发布；按 -14 LUFS 交付（Meta 用 xHE-AAC + 动态响度管理） | -1 dBTP | [LD-1] |
| 抖音 / 快手 / 视频号 / 小红书 / B站 | 官方未发布；建议 -14 LUFS 交付 | -1 dBTP | [LD-1] |

**要点**：AI 音轨（TTS 配音、AI 音乐、平台自带音效）经常未做响度归一化——AI 说话忽大忽小是交付后差评的第一来源。交付前用 LUFS 表（如 ffmpeg loudnorm 或响度计插件）把集成响度拉到目标值（→ 161 音频母带、119 声画协同）。

## 色彩空间与母版格式表

| 规格 | 色彩原色 | 传递函数 (EOTF) | 位深 | 元数据 | 适用交付 | 来源 |
|---|---|---|---|---|---|---|
| SDR（基线） | Rec.709 (BT.709) | BT.1886（Gamma 2.4） | 8–10 bit | 无 | 所有平台默认；YouTube 标准 SDR 色彩空间 | [YT-1][NF-2] |
| HDR10 | Rec.2020 | PQ（SMPTE ST 2084） | 10 bit | ST 2086 静态元数据 + MaxFALL/MaxCLL | YouTube HDR、B站 HDR、流媒体 | [YT-4] |
| HLG | Rec.2020 | HLG（BT.2100） | 10 bit | 无（广播友好） | YouTube HDR、欧洲广播 | [YT-4] |
| Dolby Vision | P3 D65 / Rec.2020 | PQ（ST 2084） | 12 bit（母版） | ST 2094-10 动态元数据 + 逐镜头 trims（XML / CM v4/v2.9） | Netflix/流媒体母版；IMF 或 J2K 中间片交付 | [NF-2][DV-1] |
| IMF 母版 | SDR: BT.709 / HDR: P3 D65 PQ | 见上 | SDR 10-bit / DV 12-bit | ST 2067-21 App #2E（2016/2020/2023）；UHD 3840×2160 RGB 4:4:4，J2K ≤800（≤30fps）/1600 Mbps | Netflix 标准交付；头部尾部各 1 秒黑场静音、无彩条板号、不烧录对白字幕 | [NF-2] |
| ProRes 母版 | 任意（FCP 支持 HLG/PQ + Rec.2020） | 见上 | 10-bit 4:2:2 / 4:4:4（4444 支持 12-bit + alpha） | VBR 帧内编码 | 工作母版：422 HQ ~220 Mbps、4444 ~330 Mbps、4444 XQ ~500 Mbps（@1080p29.97） | [AP-1] |

**AI 视频的 HDR 陷阱**：生成模型常输出"假 HDR"（SDR 画面套 Rec.709 标签或 P3 标签）。YouTube 官方明确：主基色必须是 **Rec.2020**、EOTF 必须 PQ 或 HLG，否则工具会把画面错误标记导致过饱和/发灰（→ 190 色彩空间转换）；视频号官方**不支持 HDR**，交付前必须转 SDR Rec.709（[YT-4][WC-1]）。

## 通用交付纪律（导出三杠杆）

1. **码率**（画质主杠杆）：H.264 从高往低调到平台推荐区间（YouTube 1080p 8 Mbps、B站 1080p 6000 kbps 二压线下沿），画质损失可接受为止；
2. **分辨率**：1080p→720p 对手机观看几乎无损；4K 仅在目标平台明确支持时保留（B站 4K 需短边 ≥1600，否则不触发 4K 档）；
3. **帧率**：60fps→30fps 文件减半（运动场景慎降；AI 生成素材原生多为 30fps，勿强行补 60）。

**多平台一份文件安全起点**（所有平台接受）：MP4 + H.264 + AAC、1080×1920（竖屏）或 1920×1080（横屏）、30fps、码率 8–16 Mbps、≤500 MB（[DY-2]）。**例外**：微信朋友圈 25 MB/15 秒需单独处理；B站/YouTube 长视频另出 16:9 版本（→ 68）。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| AI 生成 60fps 或逐行标记错误的素材直接交付 | 平台转码抖动/卡顿 | 统一帧率、逐行扫描（B站/YouTube 均要求） |
| 码率远超平台二压线（如 B站 4K 传 100 Mbps） | 白传：平台压回 60000 kbps 内 | 按平台二压线下沿导出（见上表） |
| 响度未校准（AI 配音忽大忽小） | 听感差、平台归一化后忽大忽小 | 交付前 -14 LUFS / -1 dBTP 校准（→ 161） |
| 假 HDR / 色彩空间标错（P3 标 Rec.2020） | 过饱和、发灰；视频号直接不支持 | 按平台选 Rec.709 / Rec.2020+PQ/HLG（→ 190） |
| 不抽帧质检就交付 | 口型错位/手部变形/闪烁上线后才发现 | 交付前逐镜头抽帧 + VQA 质检（→ 174、118） |
| 视频号传 h265 给 Chrome 电脑用户 | 无法发表 | h265 用 iPhone 发表或 Mac Safari；或转 H.264 |
| 抖音 API 单文件超 128 MB 不分片 | 上传失败 | >128 MB 必须分片（5–20 MB），总大小 ≤4 GB |
| 反复转码（从平台下载再传另一平台） | 每轮转码累积画质损失 | 保留高质量母版，按平台分别导出（→ 185 母版管理） |

## 工作流应用（AI 映射）

**AI 生成视频的交付管线**：

```text
AI 生成批次（模型输出：MP4/H.264、30fps、短片段）
  → ① 抽帧质检（逐镜头：口型/手部/闪烁/一致性漂移，→ 174、118）
  → ② 响度校准（-14 LUFS / -1 dBTP，AI 音轨必查，→ 161、119）
  → ③ 色彩空间校验（SDR Rec.709 或 HDR Rec.2020+PQ/HLG，→ 190）
  → ④ 平台映射（时长/分辨率/码率/格式/大小，对照本页总表）
  → ⑤ 导出与转码（三杠杆压缩；视频号等 h265 兼容性检查）
  → ⑥ ffprobe 终检 → 交付
```

**交付前技术终检（一条命令）**：

```text
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,bit_rate,pix_fmt:format=duration,size -of default=noprint_wrappers=1 成片.mp4
```

核对项：编码 = 目标平台接受（H.264/H.265/AV1）；分辨率 = 平台档位（B站 4K 短边 ≥1600）；帧率 = 逐行且统一（B站 ≤120、TikTok/Reels 23–60、YouTube 24–60）；码率 < 二压线；时长与文件大小在平台上限内；像素格式 4:2:0。

**生成前锁定规格（DirectorX 纪律）**：平台规格是**生成参数的一部分**，不是交付时才发现——生成分辨率/帧率/时长先按目标平台定（→ 114 模型矩阵、68 平台规格总表），可以省掉大量重生成。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 上传规格 | Upload Spec | 平台接收文件的分辨率/帧率/码率/时长/格式/大小 |
| 二压线 | Re-encode Threshold | 超过即被平台二次压缩的码率上限（B站） |
| 集成响度 | Integrated Loudness（LUFS/LKFS） | 整片平均响度，交付校验主指标 |
| 真峰值 | True Peak（dBTP） | 采样间峰值上限，防过载削波 |
| 对白门限 | Dialogue Gating | 只在对白段计量的响度算法（Netflix） |
| 色彩空间 | Color Space | Rec.709 / Rec.2020 |
| 高动态范围 | HDR | HDR10（静态元数据）/ HLG / Dolby Vision（动态元数据） |
| 互操作母版格式 | IMF | SMPTE ST 2067-21 App #2E（Netflix 交付标准） |
| 中间片母版 | Mezzanine Master | ProRes 422 HQ/4444 等工作母版 |
| 抽帧质检 | Frame-Sampling QC | 逐镜头抽帧检查生成缺陷（→ 174） |

## 来源

**平台规格**
- [YT-1] YouTube Help — Recommended upload encoding settings：https://support.google.com/youtube/answer/1722171?hl=en
- [YT-2] YouTube Help — Video resolution & aspect ratios：https://support.google.com/youtube/answer/6375112?hl=en
- [YT-3] YouTube Help — Upload videos longer than 15 minutes（256 GB / 12 小时）：https://support.google.com/youtube/answer/71673?hl=en
- [YT-4] YouTube Help — Upload High Dynamic Range (HDR) videos（Rec.2020 / PQ / HLG / 容器与编码）：https://support.google.com/youtube/answer/7126552?hl=en
- [YT-5] YouTube Help — Understand three-minute YouTube Shorts：https://support.google.com/youtube/answer/15424877?hl=en
- [BL-1] 中品网转引 B 站官方客服「4K 投稿参数建议」（20000/60000 kbps、短边 ≥1600、120fps、关键帧 ≤10s）：http://m.cntvsp.cn/shipingnews/yaowen/2023/0729/100902.html
- [BL-2] B 站官方「视频清晰度投稿指南」（原页需验证码，编号 717085467877572647）：https://www.bilibili.com/opus/717085467877572647
- [BL-3] 太平洋电脑网 — B 站清晰度升级公测公告（720P 2000k / 1080P 3000k / 1080P+/1080P60 6000k、音频 320k）：https://news.pconline.com.cn/1099/10997808.html
- [BL-4] 数码资源网 — B 站 8K 超高清投稿参数（H.265、7680×4320、60M 推荐/180M 峰值、≤16GB）：https://www.95262.com/smzy/tech72028.html
- [BL-5] 百度经验（引 B 站官方帮助）— 网页端/桌面客户端 4G 上限与支持格式列表：https://jingyan.baidu.com/article/414eccf65104802a431f0ab2.html
- [DY-1] 抖音开放平台 — 上传视频（推荐 16:9 720p+、mp4/webm、≤128 MB、总大小 ≤4 GB、≤15 分钟、水印降权）：https://open.douyin.com/platform/resource/docs/openapi/video-management/douyin/create/upload/
- [DY-2] 365 工具箱 — 微信/抖音/B站/YouTube 视频上传规格完全对照 2026（抖音/快手/小红书大小与时长、通用导出参数）：https://www.toolbox365.cn/tutorials/video-compress-platform-upload-specs-2026/
- [KS-1] 快手官方帮助 — 如何上传视频？（手机端 ≤2 GB、≤15 分钟、最多 31 段）：https://www.kuaishou.com/help/feedback/2730?categoryId=
- [KS-2] 快手官方帮助 — 如何上传高清视频？（电脑端无压缩上传、60fps、≤15 分钟、≤4 GB）：https://www.kuaishou.com/help/feedback/4000?categoryId=
- [WC-1] 微信视频号官方帮助中心 — 视频号发表视频/图文有什么格式要求？（宽高比 0.33–3.0、3 秒–60 分钟/8 小时、≤2 GB、建议 1080p+、不支持 HDR/GIF、h265 需 iPhone/Safari）：https://findeross.weixin.qq.com/cgi-bin/mmfindernodelivecrmwebbroker-bin/helper-center/pages/Yhdpjlq2RIkcmnQu
- [XHS-1] 网易科技 — 小红书上线视频号，支持 15 分钟时长视频发布（官方发布）：https://www.163.com/tech/article/FK7RC3T200097U7R.html
- [TT-1] TikTok for Developers — Content Posting API Media Transfer Guide（MP4/WebM/MOV、H.264/265/VP8/VP9、23–60fps、360–4096px、3/5/10 分钟、≤4 GB、分片 5–64 MB）：https://developers.tiktok.com/doc/content-posting-api-media-transfer-guide
- [TT-2] The Verge — TikTok is testing hour-long videos（2024 60 分钟上传测试）：https://www.theverge.com/2024/5/16/24158491/tiktok-hour-long-video-uploads-youtube
- [IG-1] Meta for Developers — Reels Publishing API Video Specifications（MP4、9:16、1080×1920/540×960、24–60fps、3–90 秒、H.264/H.265/VP9/AV1、AAC-LC 128kbps+ 48kHz）：https://developers.facebook.com/docs/video-api/guides/reels-publishing/
- [IG-2] The Verge — Instagram Reels can be 3 minutes long now：https://www.theverge.com/2025/1/18/24346567/instagram-announces-reels-3-minute-video-posts

**音频响度与色彩/母版**
- [NF-1] Netflix Partner Help — Loudness and True Peaks（-27 LKFS ±3 对白门限 / -24 LKFS ±3 全节目、TP ≤ -1 dBTP）：https://partnerhelp.netflixstudios.com/hc/en-us/articles/360050414014-Loudness-and-True-Peaks-How-to-Measure-and-When-to-Flag
- [NF-2] Netflix Partner Help — Post Production Branded Delivery Specifications v5.2（IMF ST 2067-21 App#2E、UHD RGB 4:4:4 J2K 800/1600 Mbps、DV P3 D65 PQ 12-bit、SDR BT.709 BT.1886 10-bit、48kHz/24bit、1 秒黑场静音、Atmos -27 LKFS ±2）：https://partnerhelp.netflixstudios.com/hc/en-us/articles/7262346654995-Post-Production-Branded-Delivery-Specifications
- [EBU-1] EBU — R 128 Loudness Normalisation and Permitted Maximum Level of Audio Signals v4.0（-23.0 LUFS、TP ≤ -1 dBTP）：https://tech.ebu.ch/files/live/sites/tech/files/shared/r/r128v4_0.pdf
- [ATSC-1] ATSC — A/85 Techniques for Establishing and Maintaining Audio Loudness for Digital Television（2026-07 版，含 Loudness and True Peak Quick Reference 附录 M）：https://www.atsc.org/atsc-documents/a85-techniques-for-establishing-and-maintaining-audio-loudness-for-digital-television/
- [DV-1] Dolby Professional — Dolby Vision for Content Creators（PQ ST 2084、P3/Rec.2020 工作空间、动态元数据、IMF/J2K 中间片、trims）：https://professional.dolby.com/content-creation/dolby-vision-for-content-creators/
- [AP-1] Apple — Apple ProRes White Paper（2022-04；422 HQ ~220 Mbps、4444 ~330 Mbps、4444 XQ ~500 Mbps @1080p29.97、VBR 帧内）：https://www.apple.com/final-cut-pro/docs/Apple_ProRes.pdf
- [LD-1] Dan Murtagh — LUFS Loudness Standards for 50+ Platforms（2026-07 复核；YouTube -14 LUFS 只压不抬、TikTok/IG 官方未发布、Meta xHE-AAC 动态响度、广播 -23/-24 LKFS 集群）：https://danmurtagh.com/lufs-loudness-standards/

## 相关概念

- [多平台规格总表（Cross-Platform Video Spec Matrix）](../68-platform-spec-matrix/platform-spec-matrix.md)
- [电影级交付规格（Delivery Specs — Color / Audio / Master Standards）](../112-delivery-specs/delivery-specs.md)
- [AI 成片质检自动化（QC Automation — Artifact Detection & Review Pipeline）](../174-qc-automation/qc-automation.md)
- [AI 音频母带处理（Audio Mastering — LUFS, Dialogue Clarity & Platform Targets）](../161-audio-mastering/audio-mastering.md)
- [AI 色彩空间转换实操（Color Space Conversion — Rec.709/2020, SDR/HDR & Working Space）](../190-color-space-conversion/color-space-conversion.md)
