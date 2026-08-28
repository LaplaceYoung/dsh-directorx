name: 音乐视频七阶段制作
description: 以最终主音乐为唯一时钟，从方向、音乐就绪、计划、资产锚点、分镜、逐组生成到后期平台交付制作 MV。

# MV 七阶段制作配方

## 阶段序列

1. **intent** — `directorx_skill_route` + `directorx_ask` 确认内容类型（故事/视觉审美）、主音乐来源、时长、画幅、媒介、视觉风格和参考用途；已有事实不重复问。
2. **music-prep** — `directorx_probe_media` 检查真实音频；需要生成走 `directorx_generate_audio`，需要切片走 `directorx_audio_subclip_batch`；定稿 `main_song` 与整数时长。
3. **production-plan** — `directorx_transcribe_audio` / `directorx_audio_beat`（真实能力可用时）建立从 00:00 到最终整数秒连续的歌词/器乐时间轴、Treatment、节奏/空间/声音/字体策略。
4. **assets** — 按跨镜头依赖创建角色/场景锚点；角色默认 16:9 3×2 六视图，普通单镜场景只写描述；Canvas 登记真实 refs。
5. **shot-plan** — 4–15 秒整数组，总和严格等于音乐；每组写六段完整派单原文、beat/section、构图、运镜、表演、字体、VFX、start/end 状态；用户确认。
6. **visual-gen** — 每组一个 work item；Stage 5 Prompt 原文逐字投影；`directorx_generate_ready` → `directorx_propose` → `directorx_confirm` → `directorx_generate_video`，顺序执行并写 Canvas。
7. **post-delivery** — `directorx_video_concat`/`directorx_timeline` 装配，删除代理/片段 BGM，加入完整主音乐；按 `knowledge/420` 处理字幕，按 `knowledge/423` 生成 master/social/Jianying 包。

## 六段派单格式

每组固定：参考素材说明、核心创意、音乐/歌词与表演、视觉与动态字体系统、画面过程描述、全局要求与生成锁（最后一行 Medium lock）。Stage 6 不摘要、不写“见 Plan/同上”、不二次创作。

## 资产与声音门禁

- 角色/场景 anchor 只为跨镜头一致性创建，引用有稳定 `anchor_id`、用途和 path；不为用户未提供的故事补动机/关系。
- 生成段的 `audio 1` 只作口型代理；Post 删除后完整 `main_song` 从 0 秒进入；SFX/ambience 遵守 422，不叠加第二首 BGM。
- 字幕 opt-in，可信 timed text 先格式化 ASS，遵守 safe-area；动态大字默认视频内完成，准确文字才后期兜底。

## 验收

- 七阶段产物和 stable ids 可恢复；主音乐、歌词时间轴、镜头组时长与 Canvas 路径可追踪；
- 组总和等于最终整数时长，无 gap/overlap/黑帧补时；
- 每个生成 item 的 prompt 完整来自 Stage 5；代理音轨清理；
- master/social/Jianying 版本不覆盖 master，provider 不可用时明确报告，不伪造 draft。

## 映射

旧 `hub_read`/`hub_ffmpeg`/`hub_generate_video`/`hub_canvas_write_*` 分别映射为现有 `directorx_knowledge_read`/`directorx_probe_media` + `directorx_video_process`/`directorx_generate_video`/`directorx_canvas_add|update`。配方正文只使用 `directorx_*`。
