
name: 切片二创
description: 长视频切片/二创（15-60s 竖屏）从素材到成片，卡点 + 引流

# 切片二创配方（15-60s 竖屏）

黄金 3 秒、爆点前置、卡点节奏、引流钩子。

二创是纯剪辑活：素材已经存在，不需要分镜与生成占位，全程用剪辑工具，零生成预算。

## 阶段序列
1. **source**（yt_dlp_info → yt_dlp_download）— 先看时长/画质再下载
2. **locate**（video_understand，必要时 video_edit action: info）— 定位爆点时间码，产出切片结构（开头钩子 / 看点 / 悬念）
3. **cut**（video_edit action: cut，逐段）— 按时间码切出片段；沉默/静止素材可先过 auto_cut
4. **join**（video_edit action: concat 或 transition）— 按卡点顺序拼接
5. **vertical**（video_edit action: scale + overlay）— 转 9:16，安全区内留字幕位
6. **subtitle**（dynamic_subtitle）— 卡点字幕
7. **package**（package_deliver）— 封面 ×3 + 标题 ×3 + 引流文案

## 门禁
- 爆点/钩子必须落在前 3 秒：拼接后用 view_image 或 video_understand 复核首 3 秒再交付
- 版权：素材引用标注来源，二创合规
- 时间码全部来自工具结果，不要凭剧情猜