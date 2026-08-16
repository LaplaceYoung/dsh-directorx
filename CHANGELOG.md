# Changelog

本文件记录 dsh-directorx 的用户可见变更。格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。

## [Unreleased]

### Added

- **画布分镜表**：`directorx_canvas_shotlist` 按 `shotIndex` 导出编号分镜（时长/连续性/状态/时长预算），给用户签字后再花钱。形态来自 Storyboarder / Boords，不生成媒体。
- **生成条角色锚点**：画布指令带上已注册角色名；`formatDshCanvasPrompt` 要求 DSH 生成时传 `characters`，UI 不再自己写节点。
- **隔离开发回路**：`scripts/parallel-dev-loop.mjs` 以独立 cwd/`git -C` 推进本仓库；测试红则本树不提交，不碰 sibling agent 树。
- **画布命令面板换成 cmdk**：两套手写 ⌘K 列表合并为 `CanvasCommandPalette`（pacocoursey/cmdk），分组过滤、方向键与 aria 由库负责。
- **画布上下文抽屉**：列出 `GET /directorx/canvas/intent` 待领取/处理中指令（再交给 DSH / 取消），并接入角色库 `GET/POST /directorx/characters`（只写 `characters.json`，不改画布）。指令 POST 现在也可 `{id,status}` 取消。
- **画布 TapNow 生成环（节点 + / 底部生成条）**：选中节点右侧 `+`、悬停「生成」、
  快捷键 `G`、拖线到空白「生成下游」都会打开底部生成条（图像/视频 + 提示词）。
  提交后写入 `directorx_canvas_intents` 并 `session.prompt` 交给 DSH；
  DSH 用 `directorx_canvas_continue` / `directorx_canvas_*` 改画布，UI 不再自己写
  generating 节点。`continueGenerate` 仍是 DSH 工具的规划器。自定义连线层
  经 `ViewportPortal` 进入 xyflow 视口，端点按分组绝对坐标计算，平移/缩放后仍贴在节点上。单击媒体卡改为选中
  （双击才进编辑器）；镜头状态循环 / 分组折叠按钮真正接线；保存不再丢掉
  `shotStatus` / `selectedTakeId` / `continuityRules` / 边的 `sourceVariantIdx`。
  标题栏居中（TapNow「请输入标题」）；滚轮平移、⌘+滚轮缩放，与帮助文案一致。
- **扩充调研波（四方向，规则扩至 99 条 + 工具升级）**：
  - 平台运营 84-91（封面三件套/平台规格/标题公式/发布窗口/留存四时刻/
    封面质检/CTR SOP）→ brief 平台规格卡 + 标题变体 + 封面提示词；
  - 配音表演 92-99（规定情境/停顿杠杆/一句一重音/对象感/语速基准/
    音色四参数卡/一段一指令/中文预处理）→ generate_audio instructions；
  - VFX 74-83（慢动作纪律/无缝转场原理/VFX 四要素/合成思维/转场参数表）
    → videoProcess reverse/freezeEnd + timeline 场景级 speed；
  - 商业与教育 69-73（Distributed AIDA/微课认知负荷）→ brief 钩子变体；
  - README SEO/GEO 重写（双语关键词 + 双 mermaid 流程图 + FAQ）；
  - 修复：canvas_search 容错、纯视频片段拼接（cut/fade 双路径）、
    上游扫描白名单（本仓库链接）。

- **视频生成与导演知识调研波（三方向全部沉淀，模型 API/本地部署不涉及）**：
  - 内置技能 `directorx-methodology` 扩至 **68 条规则**（12 领域）：导演技法
    36-48（景别序列/运镜动机/场面调度/光影色彩/转场语法）、叙事后期 49-58
    （三段式/三幕比例/冷热开场/Setup-Payoff/B-roll/字幕时序/响度曲线/声音
    三支柱）、提示词进阶 59-68（时序三层分离/镜头块模板/风格语法/画幅先定/
    参考池/种子语义/音画三格式/首帧锁构图），全部附来源与工具落点；
  - 调研规则产品化：`directorx_qa` 新增 ASL 平均镜头时长质检门；
    `directorx_generate_video` 新增 negative_prompt 透传；
    `directorx_style` 新增四个完整风格语法预设（wong-kar-wai /
    wes-anderson / cyberpunk / noir——锚+色盘+运动语法+负面锁四件套，实测）；
  - radar 归档三方向调研波（来源 + 规则映射 + 口径声明）。

- **高优先级四支柱（产品与工程编排向，模型接入降级）**：
  - 分析视频：`directorx_video_analyze`（分镜检测/代表帧/响度）、
    `directorx_qa`（时长/画幅/音轨/镜头数/节奏/黑帧/白帧七门）、
    `directorx_qa_report`（一键质检卡上画布）；
  - 制作视频：`directorx_smart_cut`（LLM 精剪，脚本句↔字幕匹配组装）、
    `directorx_clip_rank`（候选片段排序，ESA 评分步）、
    `audioMix.targetLufs`（-14/-23 LUFS 平台标准）、ducking 参数对齐
    行业标准、提案状态机上画布（propose 绑定画布节点）；
  - 理解意图：`directorx_brief`（类型/平台/时长/风格/锚点/素材推断 +
    一次澄清协议 + nextActions 动作序列）；
  - 制作方法论：内置技能 `directorx-methodology`（25 条规则：成片结构/
    提示词工程/剪辑节奏/LLM 精剪/音频混音，全部附来源与工具落点），
    三模板引用规则编号；
  - 方法论实演两次：质检镜像（analyze+qa→画布质检节点）、意图分诊
    （brief→画布简报组 15 节点）。

- **联网+开源社区调研驱动的 agentic 能力补齐**（调研沉淀见 docs/community-radar.md）：
  - `directorx/mcp`：JSON-RPC 2.0 MCP 端点（13 工具）——外部 AI 助手（Claude/
    ChatGPT/Cursor）可驱动 DirectorX 制片工作室（对标 Runway MCP）；
  - `directorx_video_understand`：视频理解（抽帧+vision 描述，不可用时确定性降级）；
  - `directorx_character_register/list` + 生成工具 `characters` 参数：角色/主体
    一致性锚点（对标 Gen-4 世界一致性、可灵 3.0 主体参考）；
  - `directorx_timeline`：OTIO 灵感 timeline.json 渲染中枢（裁剪→拼接→混音→字幕，
    改计划=重渲染）；
  - `directorx_audio_sync`：音画同出（旁白边界检测+自动混音+字幕+时间锚点）；
  - `directorx_canvas_branch` + 画布「对比」视图：多版本对比选优（Sora 2 remix）；
  - `directorx_subtitle_cut`：按字幕打点切镜头（FunClip 对标，关键词定位）；
  - 自主推导工作流三次实测（口播 dryRun/拉片/理解联动），画布全程镜像。

- **AI 视频制作全链路**（确定性 ffmpeg 工具链，插件自包含）：
  - `directorx_video_process`（裁剪/变速 0.5-8x/缩放/音量/静音/fps）、
    `directorx_video_concat`（硬切或 xfade 交叉淡化拼接）、
    `directorx_audio_mix`（多轨混音 + sidechain 闪避 ducking）、
    `directorx_video_subtitle`（soft 软字幕轨 / burn 烧录按 libass 探测）、
    `directorx_video_zoom`（Ken Burns 推拉/平移）、`directorx_video_pip`
    （画中画/贴纸叠加）、`directorx_audio_beat`（ebur128 瞬时响度节拍检测）；
    全部真实 ffmpeg 往返测试（44+ 用例覆盖）。
- **agentic 工作流能力**：
  - 三套 workflow 模板：directorx-pipeline（多镜头叙事）、
    directorx-talking-video（口播/讲解：脚本→tts→b-roll→混音→srt）、
    directorx-montage（卡点混剪：素材盘点→beat→裁剪→拼接→混音成片）；
    全流程画布镜像 + dryRun 零成本质检路径；
  - `directorx_propose/proposals/proposal_update` 占位提案状态机（先方案
    后生成，approved 才执行）；
  - `directorx_preflight` 生成前四道闸门（规格/内容/成本/权利）确定性审计；
  - `directorx_style` 风格/镜头语言注入（知识库实文 + 10 个预设 slug）。
- **导演知识工具化**：`directorx_style`（见上）+ 内置
  directorx-production-lead 技能（分诊/控制模式/单元生产/工作流推导）。

- **DirectorX persona 与画布/编辑器工作台**（agent runtime 层改造 + WebUI 表面）：
  - systemPrompt 注入 DirectorX（DX）制片统筹 persona：分诊（简单直接生成/
    复杂走 production-lead）、成本护栏、unit 粒度汇报、默认中文；子代理
    继承同一纪律；
  - 画布 = 分镜板制度：节点=镜头/素材、连线=承接、分组=幕；workflow
    编排模板的每个阶段镜像画布（dryRun 实测：分镜导演子代理真实写入分组+
    镜头节点+顺序连线）；
  - 内置技能 directorx-production-lead（分诊/三控制模式/单元级生产/工作流
    推导协议），并接入 systemPrompt。
- **无限画布**（libtv/tapnow 设计语言对齐 + DSH 完全掌控）：
  - Tab 化编辑坞（画布/图片编辑/视频编辑）入驻布局右栏（挤压主会话、
    窄屏自动收起、原生拖宽）；纯黑画布、16px 幽灵卡片、白 95% 选中描边、
    图标幽灵工具栏+白色胶囊主按钮、画布标题栏；
  - 交互：分组随动、框选、右键菜单（画布/节点）、双击重命名+加节点、
    拖线到空白建节点、素材拖拽/本地导入/库搜索、6px 吸附对齐线、缩放手柄、
    悬停操作条、视频节点内嵌播放器、快捷键体系（⌘D/⌫/Esc）、**撤销/重做**
    （50 步）、导出 PNG 分镜板；
  - 持久化：canvas.json（乐观并发 + 标题字段 + 读取迁移）+ 冲突仲裁 UI
    （保留我的/载入最新）+ 重置自动备份（设置页两步确认）；
  - agent 完全掌控：9 个画布工具（get/add/connect/update/remove/arrange/
    replace/clear + 状态查询）；编辑器产物反向落画布。

- **视频模型模式矩阵**（协议均按官方文档一手核实，8 个真实模式 + mock）：
  - `kling`（legacy JWT：base64 无 data: 前缀、默认 kling-v3、15s、音画参数）；
  - `kling-v3`（新标准：Bearer + 模型入路径 + GET /tasks + 4K + muti_shot）；
  - `runway`（gen4.5 首帧-only 护栏）；
  - `minimax-h3`（官方 v2：多模态 content[] + 2K）；
  - `vidu`（Token 鉴权 + subjects 多主体 + 音画同出）；
  - `veo`（Gemini LRO + 时间戳多镜头提示词）；
  - `openai-videos`（Sora 2：string seconds 枚举 + input_reference）；
  - `modelverse-tasks`（豆包 Seedance 等任务协议）。
- **主流视频模型直连接入**（协议均按官方文档/官方仓库一手核实）：
  - `kling` 模式：可灵 Kling 直连（AK/SK → HS256 JWT 鉴权；text2video /
    image2video + 首尾帧；任务轮询路径为创建路径+id）；设置页新增 AK/SK 字段；
  - `runway` 模式：Runway Gen-4.5 / gen4_turbo / veo3.1 / **hailuo3**（Runway
    平台内的海螺 3.0）直连（Bearer + x-runway-version；promptImage
    {uri,position} 首/尾帧结构；像素比例表）；设置页新增版本头字段；
  - 豆包 Seedance 与 MiniMax-H3 继续由 `modelverse-tasks` 模式覆盖。
  - 协议往返测试：Kling JWT 签名 + 提交/轮询/下载、Runway 提交/轮询/下载
    （31/31 全绿）。
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
