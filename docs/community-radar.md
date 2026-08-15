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

## 已调研 · 弃用（附原因）

| 项目 | Stars | 原因 |
|---|---|---|
| react-filerobot-image-editor | 1,900（wrapper） | 依赖 react-konva@18 自带 reconciler@0.29，与 DSH 的 React 18.3.1 内部 API 不兼容（isBatchingLegacy 崩溃）；曾尝试 reconciler 0.31 覆盖（React 19 系）亦失败 |
| etro | 1,147 | GPL-3.0 硬阻断；离线渲染未完成 |
| remotion | 56,393 | 导出走 CLI（headless Chrome+ffmpeg），非浏览器内交互；商业许可（>3 人公司付费） |
| peaks.js | 3,403 | LGPL-3.0；开发已迁 Codeberg |
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
