# 社区雷达（Community Radar）

> dsh-directorx 的开源社区沉淀清单：每一行都来自一手核实（GitHub API / npm registry /
> 官方文档 / 官方仓库源码），记录采用、备选与弃用原因，供后续轮次择优集成。
> 数据获取日期：2026-08-16（本轮核实部分以标注为准）。

## 已集成（In production）

| 项目 | Stars | 许可证 | 用途 | 集成位置 |
|---|---|---|---|---|
| @xyflow/react 12 | 38,026 | MIT | 无限画布（节点/缩放/框选） | `CanvasTab.tsx`（自研边层与右键菜单叠加） |
| wavesurfer.js 7 | 10,373 | BSD-3-Clause | 视频编辑器音频轨波形 | `VideoEditBody.tsx` |
| WebAV (@webav/av-cliper) | 2,085 | MIT | 浏览器内解码/分割/合成 MP4 | `VideoEditBody.tsx` |
| tui.image-editor | 7,665 | MIT | PS 式图片编辑器 | `ImageEditBody.tsx` |

## 已调研 · 备选（P1 候选）

| 项目 | Stars | 许可证 | 定位 | 待集成点 |
|---|---|---|---|---|
| tldraw | 49,789 | **定制商业许可**（2026-08 核实 LICENSE.md：试用/替代许可模式，非开源自由许可） | 白板/画布引擎 | 仅作交互参考，不可直接集成（许可阻断） |
| revideo（midrender/revideo，原 redotvideo） | 3,975 | MIT | React 视频程序化生成（remotion 的 MIT 替代） | 画布导出高级编排备选；浏览器内渲染能力需再核 |
| mediabunny | 6,921 | MPL-2.0 | WebCodecs 媒体处理（mp4-muxer 官方后继） | Safari/FF 导出兜底候选 |
| ffmpeg.wasm (@ffmpeg/core) | ~32MB | GPL-2.0-or-later | 万能转码兜底 | 仅网络分发需法务确认，暂缓 |
| node-edge-tts | —（npm 周下载 210 万） | MIT | 免费本地 TTS（微软在线语音） | `audio` 能力 `edge-tts` 模式（模型侧后置项） |
| omniclip | 1,448 | MIT（LICENSE 文件；package.json 字段 ISC） | 视频时间线应用（UI 参考） | 已作交互参考；npm 停摆 15 个月不宜直接依赖 |
| konva / react-konva | 14,683 / 6,398 | MIT | Canvas 2D 底座 | 画布性能优化备选 |
| excalidraw | 129,660 | MIT | 手绘风白板引擎（@excalidraw/excalidraw 可嵌入） | 画布引擎备选（性能/手绘风格场景）；体积大，需按需加载 |
| blocksuite | 5,976 | MPL-2.0 | Affine 的块编辑器框架（文档+画布） | 若画布要文档化协同（富文本节点）时评估 |
| fabric.js | 31,141 | MIT | 老牌 Canvas 2D 图形库（拖拽/变换/组） | 若自绘节点卡（非 DOM）或做像素级图形编辑时评估 |
| waveform-playlist | 1,668 | MIT | 多轨 Web Audio 编辑器（canvas 波形） | 视频编辑器音频轨升级候选（多轨替代 wavesurfer 单轨） |
| cate（0-AI-UG/cate） | 2,083 | MIT | 无限缩放编码画布（编辑器+终端） | 无限画布 UX 范式参考（缩放/面板布局） |
| canvas-editor（Hufe921） | 5,110 | MIT | Canvas/SVG 富文本编辑器 | 若画布要富文本节点时评估 |
| moveable（daybrush） | 10,460 | MIT | 拖拽/缩放/旋转/对齐参考线引擎（DOM/SVG 元素） | 节点精细交互（自由旋转、snappable 对齐线）增强候选 |
| react-zoom-pan-pinch | 1,911 | MIT | 缩放/平移封装（轮询/捏合/双击） | 图片查看器等轻量缩放场景备选（画布已用 xyflow 内置） |
| dnd-kit | 17,544 | MIT | 现代拖拽引擎（可访问性/传感器/碰撞） | 素材库「拖到画布」交互候选（libtv 素材拖拽） |
| motion-canvas | 18,940 | MIT | 程序化动画画布（TS 时间轴编辑器） | 分镜动态预览/关键帧动画演示候选 |
| html2canvas | 31,912 | MIT | DOM → 位图快照 | 已用原生 SVG 快照替代（画布导出 PNG 无依赖实现）；如需富 CSS 页面截图再评估 |
| modern-screenshot | 2,052 | MIT | html2canvas 活跃 fork（现代 CSS 支持） | 富 CSS 页面截图候选 |
| react-rnd | 4,321 | MIT | React 可拖拽/缩放容器组件 | 编辑器浮动窗口等场景备选（画布节点已用 xyflow 原生） |
| lucide（lucide-react） | 23,966 | ISC（API 显示 NOASSERTION，仓库实际 ISC） | 图标库（原 directorx 设计保留项） | 工具栏目前用内联 SVG（零依赖）；图标需求增长后评估接入 |
| media-chrome（Mux） | 2,725 | MIT | Web Components 播放器控制条 | 媒体节点/预览播放器 UI 升级候选 |
| zundo（charkour） | 883 | MIT | zustand 撤销/重做中间件 | 已自研轻量历史栈（画布 50 步上限）；多 store 协同再评估 |
| plyr | 29,951 | MIT | 全功能 HTML5 播放器 | 编辑器大预览/成片播放场景候选（节点内已自绘轻量控制条） |
| react-player | 10,279 | MIT | React 多源播放器封装 | 编辑器/成片预览候选（YouTube 等外链源支持） |
| transformers.js（HF） | 16,257 | Apache-2.0 | 浏览器内 WASM 推理（含 RMBG/背景移除模型） | **图片编辑器抠图按钮候选**（模型权重需另行核许可） |

## 已调研 · 弃用（附原因）

| 项目 | Stars | 原因 |
|---|---|---|
| react-filerobot-image-editor | 1,900（wrapper） | 依赖 react-konva@18 自带 reconciler@0.29，与 DSH 的 React 18.3.1 内部 API 不兼容（isBatchingLegacy 崩溃）；曾尝试 reconciler 0.31 覆盖（React 19 系）亦失败 |
| etro | 1,147 | GPL-3.0 硬阻断；离线渲染未完成 |
| remotion | 56,393 | 导出走 CLI（headless Chrome+ffmpeg），非浏览器内交互；商业许可（>3 人公司付费） |
| peaks.js | 3,403 | LGPL-3.0；开发已迁 Codeberg |
| imgly/background-removal-js | 7,262 | AGPL-3.0 | 浏览器内抠图（WASM） | 弃用：AGPL 传染性许可与本插件不兼容 |
| twick | — | 非 OSI（Sustainable Use License） |

## 模型 API 适配（协议源）

| 供应商 | 协议要点 | 核实来源 |
|---|---|---|
| Kling 可灵 | AK/SK → HS256 JWT（iss/exp/nbf）；POST /v1/videos/{text2video\|image2video}；轮询=创建路径+task_id；task_status: submitted/processing/succeed/failed | KwaiVGI 官方仓库客户端源码 |
| Runway | Bearer + x-runway-version: 2024-11-06；gen4.5/gen4_turbo/veo3.1/hailuo3 模型矩阵；promptImage {uri,position} 首/尾帧；ratio 为像素比 | 官方 OpenAPI 参考（api.md 全量） |
| MiniMax 官方 | api.minimax.io：POST /v1/video_generation → task_id；GET /v1/query/video_generation；Success→file_id→GET /v1/files/retrieve；模型 T2V-01/I2V-01/MiniMax-Hailuo-02（6/10s，768P/1080P） | MiniMax-AI/MiniMax-MCP（官方组织仓库） |
| aigw 网关 | OpenAI-compatible /v1；gpt-5.6-luna 等 53 模型（openai/anthropic/minimax 多归属）；openai 通道 2026-08 期间 503 | 实测 /v1/models + chat/completions |

## 设计参考（视觉/交互）

- **libtv（liblib.tv）**：近黑 #141414 中性底、单色白/灰控件、8–12px 圆角、克制无渐变（2026-08-16 提取自公开分享页）。
- **tapnow**（2026-08-16 深研公开教程画布）：纯黑 #000 底、Inter 字体；卡片 16px 圆角、
  白 6% 幽灵层、白 95% 选中描边、卡片内联操作按钮（进入片场/替换）；**顶部中央「请输入标题」输入框**（已对齐：画布标题栏，持久化于 canvas.json title 字段）；工具栏为图标化幽灵方钮（38px 透明底、10px 圆角）+ 40px 白色胶囊主按钮；画布引擎为**私有 WebGL 实现**（无 Konva/Pixi/three 全局暴露，样式不可 DOM 枚举——提取来自落地页 DOM + 截图 + 交互观察）。
- 本插件画布已按二者合成视觉语言（纯黑底 + 16px 圆角 + 幽灵白层级 + 画布标题栏）。

## 沉淀纪律

- 每轮扫描 ≥1 个新社区项目并更新本表；集成前必须过：许可证可商用、GitHub API 核实活跃度、npm 周下载、React 18.3 兼容性。
- 弃用记录保留原因，避免团队重复踩坑。

## 生态参与（2026-08-16 补充）

- **awesome-DSH-plugin 目录收录**：dsh-directorx 已加入用户 fork
  （LaplaceYoung/awesome-DSH-plugin）的 `ai-design-media` 分类并推送
  （commit 9987be4，目录校验通过）——可向上游（Alex-Yanggg）提 PR。
- 目录中可借鉴的插件模式：dsh-at-file 的 @file 提及（可迁移为画布/媒体
  引用）、dsh-custom-tool 的沙箱工具管理（可作为 DirectorX 设置页增强参考）。


## 商业平台视频 agent 能力调研（2026-08-16，联网调研沉淀）

**覆盖平台**：Runway（Agent/Agent 2.0/MCP）、可灵、剪映/即梦、Vidu、Sora 2、Veo/Flow、Pika、Luma、HeyGen、海螺及国内成片 Agent。

**行业共识的 11 项 agentic 能力**：
1. 一句话成片（goal→完整影片） 2. 剧本→分镜自动生成 3. 主体一致性锚点/角色库 4. 音画同出（配音+BGM 自动） 5. 帧级 QA 6. MCP 开放给外部 agent（Runway MCP） 7. 多镜头连贯生成（首尾帧/参考图） 8. 对话式导演（聊天即生产） 9. 多版本对比/择优 10. 智能剪辑（按脚本自动剪） 11. 多模态画布工作台。

**Top-8 借鉴映射（对照 DSH agent + 无限画布 + 确定性 ffmpeg + 知识库）**：
- 已具备：一键成片流水线（3 模板+proposals+自定义推导）、分镜生成（workflow+画布）、对话式导演（persona+会话）、帧级 QA（frame-qa+preflight）、MCP（/directorx/mcp 13 工具）、多版本重剪（确定性工具链免费可重跑）。
- **缺口**：①主体一致性锚点/角色库（注册参考图→生成时自动注入）②音画同出的自动化串联（tts+BGM 与画面时序对齐）③多版本对比的 WebUI 呈现（compare 面板）。

**主线程同步发现**：Runway MCP 把工作室暴露给 Claude/ChatGPT/Cursor——已对齐实现（directorx/mcp）；剪映侧实战流水线 daihuo-fanpai（反推爆款→即梦/Seedance 重生成→剪映草稿交付）。


## 开源视频 Agent 生态调研（2026-08-16，21 项一手核实）

**Top-5 采纳与落地状态**：
| 项目 | ★/许可 | 采纳 |
|---|---|---|
| OpenTimelineIO | 1,955 / Apache-2.0 | ✅ **已落地子集**：directorx_timeline（scenes/trim/transition + subtitle + audio 混音，OTIO 灵感 timeline.json） |
| PenShot（story-shot-agent） | 138 / MIT | 分镜规划技能参考（时长规划+连续性记忆）——已并入 production-lead 推导协议 |
| HKUDS/VideoAgent | 1,721 / MIT | 帧级 QA 工具面已具备（extract/understand/view_image）；目标跟踪待评估 |
| whisperX / faster-whisper | 23.6k/24.9k / BSD-2/MIT | 转写已有（openai-transcriptions）；词级时间戳打点待本地服务评估 |
| video-db/Director | 1,512 / MIT | 「视频即数据」任务图范式：画布+提案账本已承担该角色 |

**其它实证**（雷达备份）：fastmcp 27.2k Apache-2.0（MCP DX 参考）、kinocut 113 Apache-2.0（护栏化 ffmpeg MCP）、MoneyPrinterTurbo 104k MIT（竖屏流水线）、NarratoAI 10.7k MIT（LLM 精剪）、FunClip 6.1k MIT（按口播文本打点剪辑）、VideoLingo 18.2k Apache-2.0（多语配音）、Qwen3-VL 19.8k Apache-2.0（视觉底座）、Wan2.1/Open-Sora/CogVideoX/LTX-Video（Apache-2.0 权重，自部署成本高）。
**许可红线**：Mora/Open-AI-Micro-Drama-Generator 无许可、Crayotter 自定义许可（仅参考）；ComfyUI GPL-3.0（仅 API 进程隔离）。持续发现渠道：awesome-ai-media-cn、AI-Video-Tools。


## 视频模型 API 协议更新调研（2026-08-16，官方文档一手核对）

| 模型 | 关键变化 | 我们适配器状态 |
|---|---|---|
| Kling 3.0 | 3-15s/4K/音画同出（settings.audio native）/多镜头 prompt 语法；新标准 = API Key Bearer + 模型入路径 + GET /tasks；legacy JWT /v1/videos 保留；主体参考走 Element 库（无 subject_reference 字段） | ✅ 15s + generate_audio/voice_ids 已加（legacy）；新标准模式留待下一波 |
| Runway | x-runway-version 必填；**gen4.5 i2v 无尾帧**；托管第三方模型 + Model Router | ✅ gen4.5 尾帧已加显式报错护栏；router 待评估 |
| Vidu Q3 | 公开 API：Token 鉴权（非 Bearer）、/ent/v2/reference2video、3-16s、音画同出、subjects 多主体 ≤7 | ⏳ 轮询端点待核实（第三方网关文档混淆），协议已沉淀 |
| Sora 2 | input_reference 首帧、characters 角色端点、extensions(+20s×6)、edits；**remix 已弃用**；seconds 为 string | ⏳ 待下一波（依赖 OpenAI key） |
| Veo 3.1 | Gemini API veo-3.1-generate-preview、原生音频默认、时间戳提示词多镜头 | ⏳ 待下一波 |
| MiniMax H3 | /v2/video_generation 多模态 content[]、导演模式=模型名后缀、prompt [指令] 镜头控制 | ⏳ 待下一波 |

**风险记录**：Sora seconds 官方文档矛盾（4/8/12 vs 16/20）；Veo 音频表述不一（需实测）；Runway gen4.5 无尾帧（已护栏）。


## 制作方法论调研波（2026-08，三方向全部沉淀为 directorx-methodology 68 条规则）

| 方向 | 来源 | 沉淀 |
|---|---|---|
| 导演技巧/镜头语言 | StudioBinder、No Film School、Filmmakers Academy、Wikipedia（42 条） | 规则 36-48（景别序列/运镜动机/场面调度/光影色彩/转场语法 + ASL 质检门） |
| 叙事结构与后期 | Meta Reels Playbook、TikTok Creator Academy、ClipForge、PremiumBeat（34 条） | 规则 49-58（三段式/三幕比例/冷热开场/Setup-Payoff/B-roll/字幕时序/响度曲线/声音三支柱） |
| 生成提示词进阶 | OpenAI Cookbook、Veo 3 官方指南、火山引擎 Seedance 指南、Runway Help（40+ 条） | 规则 59-68（时序三层分离/镜头块模板/风格语法/画幅先定/参考池/种子语义/音画三格式/首帧锁构图） |
| 负面提示词体系 | invideo FAQ、Cliprise、OCDevel（早轮） | 规则 26-28、65 |
| 风格语法产品化 | 上表 | directorx_style 语法预设：wong-kar-wai / wes-anderson / cyberpunk / noir（锚+色盘+运动+负面四件套） |

口径声明：留存数据为平台方口径（需本地 A/B 验证）；Kling 相关结论建议补充官方核实。


## 扩充调研波（2026-08-17，四方向沉淀为 directorx-methodology 规则 69-99 + 工具升级）

| 方向 | 来源 | 沉淀 |
|---|---|---|
| 平台运营与分发 | YouTube 官方帮助中心、抖音电商规范、新榜/蝉妈妈/飞瓜、chinamarketing.ai | 规则 84-91 + brief 平台规格卡（封面规格/标题上限/发布窗口，口径分级标注） |
| 配音与声音表演 | OpenAI TTS 指南/cookbook、ElevenLabs 官方 docs、张颂播音教材、语流音变 | 规则 92-99 + generate_audio instructions 参数（源码核实后的字段差距补齐） |
| 视觉特效与剪辑特效 | StudioBinder、No Film School、MasterClass、Hailuo Field Notes、Kling 指南 | 规则 74-83 + videoProcess reverse/freezeEnd + timeline 场景级 speed |
| 商业广告与教育类 | Sagum AIDA 2026、Animiz 微课、ClipMake | 规则 69-73 + brief 标题变体/封面提示词 |

**本轮工具升级**：tts instructions · reverse/freezeEnd · scene speed · platformCard · titles/coverPrompt · canvas_search 容错 · 纯视频拼接（cut+fade 双路径）。
**README**：SEO/GEO 重写（双语关键词 + FAQ + 双 mermaid 流程图），package.json keywords 扩充。


## 同类项目融合行动（2026-08-17 起，五组深拆 → 25+ 能力融入）

| 组 | 融入的能力（通用措辞） |
|---|---|
| agent 框架组 | 媒体资产库、风格常量锁（style.json 注入）、失败分流（4xx/5xx 分类）、意图驱动剪辑（directorx_edit）、工业分镜 schema、运镜安全词表+反单调、剧本单一事实源（group=beat/node=shot）、提案阶段门控+版本血统+提交即检查点+预检 |
| 分镜短剧工作台组 | 组装式角色（身份/服装/道具分层）、相邻镜头承接变量硬规则、分镜表铁律语义 |
| 剪辑 MCP/编辑器组 | 滤镜链+bounds、crop/rotate/flip、音频抽取、fadeIn/fadeOut、黑场/音量 QC、接触表、错误码契约（DirectiveError）、黄金向量 fixtures、MCP 只读标注、中央限制清单、原子输出、音频时长策略、freezeStart、逐对转场库（55 白名单） |
| 画布工作台组 | 连线类型矩阵+reason 自纠、确定性排片（shotIndex 存储身份）、紧凑上下文快照、画布红线六条入技能 |
| 管线编排组 | 阶段门控审批队列、失败分类重试语义、批准资产基线（characters 扩展）、单资产隔离约定 |

**纪律**：commit 信息与代码注释零上游名；全部为「语义映射+参数扩展+流程约定」层实现，无新服务、无本地部署。


## 融合第 2 波（2026-08-18 起，剪辑参数化收尾 + 画布语义 + 模型路由 + 两路新调研）

| 方向 | 落地 |
|---|---|
| 剪辑参数化收尾 | drawtext 文字层（位置表达式/描边/背景框/CJK 字体）、八向平移（恒窗+时变原点）、场景指纹缓存修订 diff（改哪层只重渲哪层）、freezeStart、逐对转场库（55 白名单）、MCP 类工作停做 |
| 画布生产语义 | 节点锁（拒改/拒删/拒入边+解锁路径）、变体逐边绑定 sourceVariantIdx、aiBrief 幂等缓存（prompt-first→cache→vision→fallback）、上游 prompt 合成 prompt_for |
| 模型路由 | 10 模型 × 8 协议能力矩阵 + 需求过滤排序 + 排除原因（计划期暴露参数问题） |
| 字幕本地化 | srt_lint（行宽/CPS/时长/序号 + CJK 加权宽度）、srt_normalize（间隙吞并/最短时长/格式归一）、speech_clean、terms 字典、speech_duration 语速预算、localize recipe（转写→规范→质检→翻译→预算→配音→对齐→组装） |
| 数字人口播 | 权重不内置（编排层内置）：TTS speed 参数、分句单元化口播模板、无对口型降级纪律、identityRef/poseRef 场景字段 |


## 导演技巧 AIGC 应用波（2026-08-18，生成强化四件套）

| 工具 | 能力 |
|---|---|
| directorx_shot | 镜头语言→生成提示词确定性翻译器（景别/角度/运镜/布光/构图表驱动，规则引用+负面基线） |
| directorx_shot_sequence | 分镜批量承接链（承接变量/首尾帧接力计划/反单调校验） |
| directorx_preset | 6 参数预设包（画幅×时长×运镜轮换×风格语法 × 模型路由联动） |
| directorx_shot_gate | 生成前规则 gate（ECU 惜用/承接必填/词表反单调/路由可用，逐项规则编号）——与 qa_report 成前后一对 |


## 画布重设计波（按无限画布工作台调研完整对齐，2026-08-18）

| 域 | 落地 |
|---|---|
| 运行参数 | 缩放 0.15-2、FitView 0.7-1.3、吸附 15×15、滚轮缩放关/滚动平移开、中右键拖平移+左键框选、连接半径 30px、双击缩放关（双击建节点）、边 20px 透明命中路径 |
| 保存机制 | 500ms 防抖、beforeunload 未保存提醒、视口 localStorage 节流持久化+恢复 |
| 渐进披露 | 三创建入口（全局+/双击/右键）、选中显连接点与对象工具栏（编辑/复制/删除浮于节点上方）、节点右侧+继续生成自动连线（含媒体库预连线）、多选创建共同下游、More 菜单收纳低频项 |
| 视觉系统 | 纯黑底+低对比点阵、白 6% 幽灵卡片 16px 圆角、白 95% 选中描边、幽灵方钮+白胶囊主钮、状态色点+蓝点 Beta 态、对象工具栏贴近内容 |
| Shot 语义层 | 镜头状态机（idea/approved/generating/review/locked 点击循环+枚举校验）、Take 归档（selectedTakeId + takes 查询）、粗剪条（shotIndex 确定性排序+空间定位联动）、连续性锁注册表（跨镜头规则聚合+链徽章） |


## 五区布局重设计波（2026-08-18，按工作台骨架完整启用）

| 区域 | 落地 |
|---|---|
| 顶部项目条 | 标题居中 + 额度占位 + 保存状态 chip（右上） |
| 左侧悬浮竖栏 | 新建/素材库/文字/Shot分组/镜头列表(滑出面板: shotIndex 序+点击定位+状态点)/网格整理/吸附开关/撤销重做/更多/帮助(手势引导) |
| 中央画布 | 纯黑点阵 + 幽灵卡片 + 全部既有能力（状态机/Take/连续性/粗剪/参数） |
| 右侧 Agent 抽屉 | 320px 可折叠（右下圆入口）：自动/手动确认模式、@引用 chips（当前选中）、目标输入→落地画布文本节点、确认卡语义 |
| 左下导航 | 小地图/Controls/吸附开关/FitView/缩放 pill/帮助弹层 |
| 底部粗剪条 | shotIndex 序缩略图 + 定位/选中联动（并入新布局） |


## 编辑器调研采纳波（2026-08-18，图片/视频编辑器双路调研 → P0/P1 落地）

| 域 | 落地 |
|---|---|
| 图片编辑器 | 导出弹层（格式 chips/质量阶梯/预览/保存+下载+复制+继续编辑）、PNG/JPG 格式切换、手势提示、抠图结果卡片、设计语言统一 |
| 视频编辑器 | 播放头时间码 chip、播放头标记线（内容坐标随滚动）、空格播放（焦点保护）、裁切吸附（播放头>片段边界>0/片长优先级）、时间线空白点击 seek（三态单向同步）、双击片段定位、右键删除、片段时长显示、吸附+缩放控件、设计语言统一 |
| 待办 | P1: 抠图双极性笔刷精修 + 按住看原图、笔刷圆形光标 + [ ] 快捷键；P2: 调节滑块组（ctx.filter 预览）、吸附开关、W/H/角度直填、变速 UI、标尺、字幕轨 |


## 编辑器重设计波（2026-08-18，图片/视频双编辑器 → 调研驱动全量落地）

| 域 | 落地 |
|---|---|
| 图片编辑器 | 设计语言统一（近黑+幽灵+16px）、手势提示、PNG/JPG 格式切换、导出弹层（格式/质量阶梯/预览/保存+下载+复制+继续编辑）、智能抠图两步流（一键→棋盘格→双极性笔刷精修+[ ]快捷键+圆形光标+按住看原图）、调节面板（亮度/对比度/饱和度/色温 slider+CSS filter 即时预览+双击复位+自动增强+像素级应用） |
| 视频编辑器 | 设计语言统一、播放头时间码（可编辑跳转）、播放头标记线、空格/快捷键组（S分割/Delete/←→/↑↓切点/Esc，焦点保护）、裁切手柄 14px 命中+浮层时间码+吸附（播放头>边界>0/片长）、时间线空白点击 seek、双击片段定位、右键删除、片段时长显示、时间标尺（自适应刻度密度）、变速 UI（chips+滑杆+时长重算）+ playbackRate 真实导出、撤销栈（60 档）、字幕轨（SRT 导入/拖移/双击编辑/删除） |
| 待办（尾项） | 字幕烧录、曲线变速、快捷键面板、调节「高级」折叠、笔刷硬度/羽化 |


## 组件库取值采纳（2026-08-18，成熟组件库调研 → P0/P1 落地）

| 项 | 采纳值 |
|---|---|
| 弹层动效 | Radix 级：opacity + scale .95 + translateY -2px，150ms expo-out |
| 焦点环 | focus-visible 2px 白 50% 环 + 2px 偏移（键盘可达性） |
| 卡片微交互 | 按压缩放 .97（whileTap 等价）；悬停抬升已有 |
| xyflow 暗色变量 | 选择框/attribution/minimap 样式覆盖；connectionDragThreshold 25 |
| 待办 | Sonner 保存 toast 桥接、多选 NodeToolbar、Vaul 底部快速添加抽屉 |


## WebCodecs 剪辑能力调研采纳（2026-08-18）

| 判定 | 落地 |
|---|---|
| 字幕烧录可行（引擎内置） | EmbedSubtitlesClip 接入导出：白字黑描边、按片高缩放字号/偏移、font.ready 等待；兼容文案改 Chrome/Edge 102+ |
| 常量变速可行（已实现） | 副作用=音频变调（上游 issue 已记录）；曲线变速=分段常量近似，保调 PR 未发版暂缓 |
| 帧级切割 | 帧边界级精度（回退最近 IDR）；fps 保真需显式传（Combinator 默认 30） |
| 响度归一 | 变通：RMS/峰值可行，R128 待 ebur128-wasm |
| 待办 | 变速导出前提示「音频会变调」、60fps 素材 fps 透传、BGM 电流音 issue 跟踪 |


## 音画同出/多镜头一致性调研采纳（2026-08-18）

| 项 | 落地 |
|---|---|
| 音画同出三契约 | 文本驱动 / voice_id+台词 / 音频参考——generate_video 描述层给出 native-audio 优先 + 降级链（静音出片→TTS→audio_sync） |
| 多镜头一致性范式 | 资产预注册（characters）+ 参考图类型化 + 首尾帧接力（handoff 末帧）；pipeline 模板加「主体预注册 + 连续性锁」步骤 |
| 对口型 as-a-service | 契约统一（视频|图+音频→视频）；建议作音画同出降级路径；开源侧 OpenRAIL++ 需注意条款 |
| 待核对 | MiniMax audio 字段结构、OpenAI 音频参数名（落地前逐字段核对） |
