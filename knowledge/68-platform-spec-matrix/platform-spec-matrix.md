# 多平台规格总表（Cross-Platform Video Spec Matrix）

> 本页是 DirectorX 多平台规格速查：规格错误的真实成本、录制/上传/广告三种限制的区别、通用规格配置、全平台对照表（海外+中文）、导出三杠杆（压缩）、规格纪律。与 43 安全区 / 27 字幕 / 42 分发衔接。
> 来源：SocialPilot 2026 规格速查、365 工具箱对照、色彩韵全平台分辨率、Vibbit 时长策略。

## 概述

**规格错误不是坏运气，是规格问题——而规格可修复**。同一平台有三个不同的"正确"时长，取决于你在 App 内录制、上传成品文件、还是跑付费广告。

**真实成本**：竖屏素材投到期望方形的广告位=广告被拒+拍摄剪辑时间全丢；文件超广告位时长=战役前夜重剪；不兼容编码=审核滞留、战役晚开。

## 三种限制（90% 困惑的来源）

| 限制类型 | 控制什么 | 何时适用 |
|---|---|---|
| 录制限制 | App 内相机能拍多长 | 只在 App 内拍摄时 |
| 上传限制 | 平台接受成品文件的最大长度/大小 | 上传预先制作的视频 |
| 广告限制 | 付费位接受什么（无论有机上限） | 跑付费广告时 |

**TikTok 最清晰示例**：App 内拍摄 10 分钟 / 上传 60 分钟 / 标准广告 10 分钟但 Spark Ads（助推已有帖子）无时长限制——三个数字都正确，关键是知道哪个适用。

## 通用规格配置（跨平台安全起点）

- **宽高比**：9:16（Reels/Stories/Shorts/TikTok）；16:9（YouTube 主信息流与 LinkedIn 桌面）；
- **分辨率**：竖屏 1080×1920；横屏 1920×1080；
- **格式**：MP4 + H.264 视频 + AAC 音频；
- **帧率**：30fps；
- **文件大小**：尽量 <500MB（上传更快、处理问题更少）。

**一份文件可直接跑**：Instagram Reels、Facebook Reels/Stories、TikTok、YouTube Shorts、Threads、Bluesky。
**仍需单独版本**：IG/FB 信息流 4:5（1080×1350）表现更好；YouTube 长视频仍要 16:9；广告位长度上限可能更短；X/LinkedIn/Pinterest 支持更宽比例范围。

## 海外平台对照表

| 平台/格式 | 宽高比 | 分辨率 | 最大时长 | 备注 |
|---|---|---|---|---|
| IG 信息流/轮播 | 1:1 或 4:5 | 1080×1080 / 1080×1350 | 60 分钟 | 4GB |
| IG Reels | 9:16 | 1080×1920 | App 内 3 分钟 / 上传 15 分钟 | 信息流缩略 4:5；网格 3:4；码率 3500-5000Kbps |
| IG Stories | 9:16 | 1080×1920 | 每卡 60 秒 | 安全区：顶 250px(14%)+底 340px(20%) |
| IG Live | 9:16 | 1080×1920（最低 720×1280） | 4 小时 | 播后可存为信息流/Reels |
| FB 共享视频 | 16:9~9:16 | 1280×720 / 1080×1080 | 240 分钟 | 4GB；**方形 1:1 移动信息流占位更大、互动常更优** |
| FB Reels/Stories | 9:16 | 1080×1920 | Reels 无上限/Stories 60 秒 | 4GB |
| FB 视频广告 | 4:5 推荐 | 1080×1080 起 | 240 分钟 | 4GB |
| TikTok 有机 | 9:16 | 1080×1920 | 上传 60 分钟 | App 内 10 分钟 |
| YouTube 标准 | 16:9 | 1920×1080 | 无上限 | 大文件上限 256GB |
| YouTube Shorts | 9:16 | 1080×1920 | 3 分钟 | 竖屏 |
| LinkedIn 共享 | 16:9~1:1 | 1080×1920 竖屏也可 | 15 分钟 | 桌面多为 16:9 |
| X (Twitter) | 16:9~1:1 | 1280×720 起 | 上传 2 小时 20 分 | 广告位另有规格 |
| Pinterest | 2:3~9:16 | 1080×1920 竖屏最优 | 15 分钟 | 长视频广告 16:9 |

## 中文平台对照表

| 平台 | 推荐宽高比 | 分辨率 | 时长策略 | 要点 |
|---|---|---|---|---|
| 抖音 | 9:16 | 1080×1920 | 短视频 <60s 最优；中视频 1-5 分钟 | 首帧即封面；安全区（→ 43） |
| 小红书 | 3:4 主图 / 9:16 视频 | 1080×1440 / 1080×1920 | 图文 3:4；视频 15s-3 分钟 | 封面=标题；信息密度高 |
| 视频号 | 9:16 / 1:1 / 16:9 | 1080×1920 起 | 1 分钟以内社交场景 | 微信生态传播，人情味优先 |
| B 站 | 16:9 | 1920×1080 起 | 长视频 5-20 分钟为主 | 竖屏 9:16 支持但横屏生态 |
| 快手 | 9:16 | 1080×1920 | 短视频为主 | 老铁文化，真实感优先 |
| 微信视频 | 16:9 / 9:16 | 1080 起 | 朋友圈 30s 内完整呈现 | 压缩最狠（→ 三杠杆） |

## 导出三杠杆（压缩到平台上限内）

1. **码率**（画质主杠杆）：H.264 从高往低调，画质损失可接受为止；
2. **分辨率**：1080p→720p 对手机观看几乎无损；
3. **帧率**：60fps→30fps 文件减半（运动场景慎降）。

## 时长策略（2026 数据版，Vibbit）

- 短视频平台 60-90 秒黄金段（→ 43）；
- YouTube 长视频按内容密度（教程 8-15 分钟、深度 15-30 分钟）；
- 广告位严格按广告规格（有机时长≠广告时长）。

## 常见错误

1. 录制/上传/广告三种限制混为一谈：时长判断错误。
2. 竖屏投方形广告位：被拒+重剪。
3. 一份横屏全平台发：移动端体验崩。
4. 忽略平台压缩：微信压缩最狠——导出前先测。
5. 有机规格当广告规格：晚开战役。
6. IG 信息流用 9:16：4:5 才是信息流最优。
7. 文件超大不压：上传慢+处理问题。

## 术语表（中英对照）

| 中文 | English | 一句话定义 |
|---|---|---|
| 录制限制 | Recording Limit | App 内拍摄上限 |
| 上传限制 | Upload Limit | 文件接收上限 |
| 广告限制 | Ad Limit | 付费位规格 |
| 通用规格 | Universal Spec | 跨平台安全配置 |
| 安全区 | Safe Zone | UI 遮挡区（→ 43） |
| 码率 | Bitrate | 画质主杠杆 |
| 压缩三杠杆 | Compression Levers | 码率/分辨率/帧率 |
| 信息流最优 | Feed-Optimal | 4:5 方形占位 |
| 缩略裁切 | Thumbnail Crop | 信息流/网格裁切 |
| Spark 广告 | Spark Ad | 助推已有帖子 |
| 首帧封面 | First-Frame Cover | 竖屏选帧 |
| 编码 | Codec | H.264/AAC |

## 来源

- SocialPilot: Social Media Video Sizes for Every Platform (2026 Guide) — https://www.socialpilot.co/insights/social-media-video-sizes-cheat-sheet
- 365 工具箱: 微信/抖音/B站/YouTube 视频上传规格完全对照 2026 — https://www.toolbox365.cn/tutorials/video-compress-platform-upload-specs-2026/
- 365 工具箱: 视频压缩三杠杆——微信/B站/抖音/YouTube 规格对照 — https://www.toolbox365.cn/topics/video-to-platform-spec/
- 色彩韵设计: 抖音 B站 小红书视频尺寸——2026 全平台分辨率对照表 — https://www.secaiyun.com/docs/video-size-platform-resolution-guide-2026-06-18.html
- Vibbit: 社交媒体视频尺寸比例完整指南 2026 — https://vibbit.ai/zh-CN/blog/social-media-video-aspect-ratios
- Vibbit: 视频时长优化完全指南——各平台最佳时长策略（2026 数据版） — https://vibbit.ai/zh-CN/blog/optimal-video-length-platform-guide
- Toolora: 社交平台尺寸大全——小红书/B站/抖音/视频号/Instagram/YouTube — https://toolora.info/zh/t/social-aspect-ratio-guide/
- Blitzcut: Social Video Specs 2026 — Shorts, Reels & TikTok Dimensions — https://blitzcutai.com/blog/social-video-specs-2026