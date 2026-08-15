# Changelog

本文件记录 dsh-directorx 的用户可见变更。格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。

## [Unreleased]

### Added

- **制作闭环三件套**：
  - `directorx_transcribe_audio`（openai-transcriptions 协议 + mock）：本地音视频
    → 转写文本，支持 json/text/**srt** 输出，srt 落盘 `outputDir/transcripts/`
    打通字幕链路；
  - `directorx_probe_media` / `directorx_extract_frames`（ffmpeg/ffprobe，软依赖
    友好降级）：媒体元数据探测 + 抽帧 PNG（`outputDir/frames/`），打通
    frame-qa 抽帧质检闭环；
  - 视频生成卡片实时进度：`GET /directorx/media/tasks` 任务列表路由 + 生成卡片
    轮询显示「已提交排队/已完成/失败/已取消」。
- **视频编辑器音频轨（wavesurfer.js）**：波形显示（点击定位主预览）、导入/
  更换/移除音频、0–200% 音量滑杆；导出时经 WebAV AudioClip 混入成片
  （AAC 音轨）。已实测：440Hz 测试音混入 3.09s MP4（volumedetect
  mean -21.2dB，非静音）。
- **子代理编排注入**（`src/subagents.ts`）：经 Harness 的
  `subagents.registerContinuableSetup` 扩展点，为每个可续子代理上下文安装
  DirectorX 编排纪律（systemPrompt section + `directorx-subagent-orchestration`
  技能，随贡献回收）。全局技能/工具对一次性子代理同样可见（已验证）。
- **Workflow 提示词编排**：新增 `workflows/directorx-pipeline.js` 流水线模板
  （剧本分镜 → 并行提示词工坊 → 并行生成 → 质检 → 组装方案，支持 dryRun
  零成本验证）与 `directorx-workflow` 技能（含编排纪律与使用说明）；
  systemPrompt 增加「多镜头项目用 workflow 编排，不串行生成」纪律。
  - 已实测：4 子代理 dry-run 流水线跑通，分镜/提示词/四道闸门质检全部产出
    结构化结果（子代理实际引用知识库 115/125/53/116）。
- WebUI 右侧编辑面板（前序）：tui.image-editor 图片 PS 编辑器 + WebAV 时间线
  编辑器 + 保存回传（POST /directorx/media、edits 账本、directorx_edits）。
- **WebUI 右侧编辑面板（编辑坞，前序详表）**：注册在 `shell.overlay` 的右侧
  停靠面板 + 悬浮把手；生成卡片上出现「✏️ 编辑」按钮。
  - 图像 → **PS 式编辑器**：tui.image-editor（MIT，7.6k★；裁剪/旋转/翻转/
    滤镜/画笔/文字/形状/缩放/撤销重做），导出 PNG 保存回传；
  - 视频 → **时间线编辑器**：自建 React 时间线（播放头分割、片段删除/重排、
    时长刻度）+ WebAV（MIT，2k★，活跃维护）做 WebCodecs 解码与 MP4 导出；
  - 参考实现与备选：omniclip（MIT，活跃）为时间线 UI 参考；filerobot/
    react-filerobot-image-editor（MIT，活跃）因依赖 react-konva 与 React
    18.3 的内部 API 不兼容，未采用（详见 architecture）。
  - 宿主保存回写：`POST /directorx/media` 流式写入 `outputDir/edited/`（512MB
    上限、媒体类型白名单、跨源 403），追加 `edits.jsonl`；`GET /directorx/media/edits`
    列出历史；`directorx_edits` 工具供 DSH 引用。
  - 浏览器端到端验证：真实 GUI 打开面板、tui 编辑器渲染、WebAV 分割/重排/
    导出 3.09s MP4、图片与视频保存回传全部通过。

### Added（前序）

- WebUI 生成卡片：`directorx_generate_image` / `directorx_generate_video` /
  `directorx_generate_audio` 在对话流中渲染专属工具卡片，运行中显示提示词与
  状态，结束后内联预览图像 / 视频 / 音频（`<img>` / `<video>` / `<audio>`）；
  `directorx_view_image` 卡片显示问题、回答文本与可预览的源图。
- 宿主媒体路由 `GET /directorx/media`：流式供给 `outputDir` 内的生成物，支持
  HTTP Range 与同源校验；无 web 服务器的 profile 下自动降级为 no-op。
- 任务账本（`<outputDir>/tasks.jsonl`，追加式）与两个新工具：
  - `directorx_task_status` —— 查询单个任务的最新状态或列出最近任务；
  - `directorx_cancel_task` —— 取消进行中/孤儿任务，轮询循环在下次账本检查时
    中止；超时或中断后可通过账本找回 provider 任务。
- 异步生成（openai-videos / modelverse-tasks 的图像与视频）自动记录
  submitted / succeeded / failed / cancelled 状态转换，成功记录附带结果
  URLs 与本地文件路径。
- 媒体路由测试（路径逃逸、Range、查询解析、文件检查）与编译产物级 handler
  端到端验证脚本；新增任务账本测试（追加/折叠/取消/轮询中止）与
  modelverse-tasks HTTP round-trip 测试。

## [0.1.0] - 初始版本

- 六个工具：`directorx_view_image` / `directorx_generate_image` /
  `directorx_generate_video` / `directorx_generate_audio` /
  `directorx_knowledge_search` / `directorx_knowledge_read`。
- 四类能力独立开关与热更新；`openai-chat` / `openai-images` / `openai-videos` /
  `modelverse-tasks` / `openai-tts` / `mock` 协议适配。
- 351 篇影视知识库、36 个 runtime skills、8 大中文影像工坊、11 套 recipes、
  `directorx-playbook` 原创制作手册。
- Settings → DirectorX WebUI 设置页（secret API Key、能力开关、即时生效）。
