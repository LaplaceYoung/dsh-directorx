# dsh-directorx 架构说明

## 定位

`dsh-directorx` 是 DeepSeek Harness（DSH）的一个媒体制作插件。它不实现 agent loop、
不创建自己的 runtime、不注册子 Agent；DSH 负责思考、规划、审批与执行，插件负责
影视领域知识与媒体模型接入。

```text
DeepSeek Harness
├── Agent Loop / Plan Mode / Approval / Session
├── Tool Registry
├── Skill Registry
├── Settings Service
└── WebUI
        │
        │  dsh-directorx plugin
        ▼
┌──────────────────────────────────────────────────────┐
│ settings namespace: directorx (live reload)          │
│ runtime skills: 36 主技能 + 8 中文影像工坊           │
│ systemPrompt section: media-workflow guidance        │
│ tools:                                               │
│   view_image / generate_image / generate_video       │
│   generate_audio / knowledge_search / knowledge_read │
│   task_status / cancel_task（任务账本）               │
│   directorx_canvas_*（DSH 掌管无限画布）              │
│   directorx_confirm（ctx.userInteraction.ask 签字）   │
│ commands: /directorx [shotlist|proposals|next]        │
│ web route: GET /directorx/media (流式媒体供给)        │
│            GET/POST /directorx/canvas/intent          │
│            GET/POST /directorx/characters             │
│ task ledger: <outputDir>/tasks.jsonl (append-only)   │
│ bundled corpus: knowledge/ skills/ recipes/          │
└──────────────────────────────────────────────────────┘
        ▲
        │  dsh-directorx client (WebUI)
        ▼
┌──────────────────────────────────────────────────────┐
│ Settings → DirectorX 设置页（四能力卡片）            │
│ tool.call.toolview 键控卡片（生成中/结果内联预览）   │
└──────────────────────────────────────────────────────┘
```

## 服务依赖

宿主插件声明：

```ts
export const inject = ['tools', 'skills', 'systemPrompt', 'settings', 'llm']
```

| DSH 服务 | 用途 |
|---|---|
| `tools` | 注册媒体 / 画布 / 知识库工具；`directorx_confirm` 在执行时取 `userInteraction` |
| `skills` | 注册内置 `SKILL.md` 为 DSH runtime skills |
| `systemPrompt` | 注入媒体工具使用纪律，避免模型瞎猜协议 |
| `commands`（可选 `ctx.inject`） | `/directorx` 制片板：直接 UI，不进模型 transcript |
| `userInteraction`（可选） | `directorx_confirm` 暂停在 DSH 提问卡片上签字 |
| `settings` | 注册 `directorx` 命名空间，保存四类模型配置 |
| `llm` | 声明四个 configurable provider，让 WebUI 配置平面暴露 `directorx` 设置 |

浏览器端插件通过 `dsh.client` 注册 **Settings → DirectorX** 设置页，使用
`settings.describe` / `settings.mutate` 读写同一命名空间。

## 配置模型

```yaml
directorx:
  outputDir: directorx_output
  timeoutMs: 120000
  pollIntervalMs: 5000
  maxPollAttempts: 360

  vision:
    enabled: true
    mode: openai-chat      # mock
    baseURL: https://api.openai.com/v1
    apiKey: sk-…           # secret role
    model: gpt-4o-mini

  image:
    enabled: true
    mode: openai-images    # modelverse-tasks | mock
    baseURL: https://api.openai.com/v1
    model: gpt-image-1

  video:
    enabled: true
    mode: openai-videos    # modelverse-tasks | mock
    baseURL: https://api.openai.com/v1
    model: sora-2
    resolution: 2K

  audio:
    enabled: true
    mode: openai-tts       # mock
    baseURL: https://api.openai.com/v1
    model: gpt-4o-mini-tts
```

每个 capability 都有独立 `enabled` 开关。设置页保存后，`scope.watch` 触发工具
注销与重新注册；关闭能力后对应工具不会出现在模型可用的工具目录里。

## 模型协议适配层

| mode | 请求路径 | 说明 |
|---|---|---|
| `openai-chat` | `POST {baseURL}/chat/completions` | 视觉问答，图片以 data URL 或 http URL 传入 |
| `openai-images` | `POST {baseURL}/images/generations` | 支持 `b64_json` 与 `url` 返回 |
| `openai-videos` | `POST {baseURL}/videos` → `GET {baseURL}/videos/{id}` | 异步轮询，支持顶层或嵌套结果 URL |
| `modelverse-tasks` | `POST {baseURL}/tasks/submit` → `GET {baseURL}/tasks/status` | 首尾帧/参考图以 content item 传递 |
| `openai-tts` | `POST {baseURL}/audio/speech` | 二进制音频落盘 |
| `mock` | 本地生成 | SVG 图 / WAV 音 / ffmpeg 测试视频 |

API Key 解析顺序：WebUI 配置 → `DIRECTORX_<CAPABILITY>_API_KEY` 环境变量 →
`OPENAI_API_KEY`。本地 `localhost` 端点允许空 Key。

## 工具执行数据流

```text
DSH model calls directorx_generate_video
  → defineTool 参数校验
  → tools/pre-execute（DSH permission / approval）
  → provider adapter 根据 settings.mode 选择协议
  → 异步任务轮询（AbortSignal + timeout）
  → 首个结果 URL 下载到 cwd/directorx_output/
  → canonical JSON: { model, prompt, taskId, status, files[] }
  → output.render 转换为模型可见文本
```

错误时保留 HTTP 状态与响应摘要；API Key 不写入返回内容、日志或会话记录。

## 知识层

- `knowledge/`：350+ 篇影视/AI 生成文章，含 `_meta/inventory.json` 与
  `_meta/redirects.json`；`directorx_knowledge_search` 采用中文二元组 +
  英文词元评分，`directorx_knowledge_read` 渐进读取。
- `skills/`：36 个顶层 `SKILL.md` 注册为 DSH runtime skill；8 大中文影像工坊
  再注册为独立分类 skill，资源基路径指向原技能目录。
- `recipes/`：作为 DSH 可读的端到端流程清单。
- `skills/directorx-playbook/`：原创制作手册，作为 DSH skill 直接加载。


## 任务账本与异步任务恢复

异步模式（`openai-videos`、`modelverse-tasks`）在 `outputDir/tasks.jsonl` 里
记录状态转换：`submitted` → `succeeded` / `failed` / `cancelled`，成功记录附带
结果 URLs 与本地文件路径。轮询循环每次迭代检查账本：

- 工具超时或会话中断后，账本仍保留任务：`directorx_task_status` 找回最新状态
  与结果文件，`directorx_cancel_task` 追加 `cancelled` 转换；
- 进行中的轮询在下次检查时看到 `cancelled` 即中止（本地进程内生效）；
- 本地 `failed` 可能对应仍在 provider 运行的孤儿任务，因此仍可接受取消；
  `succeeded`/`cancelled` 对取消幂等。

## WebUI 编辑坞（二次编辑）

- 客户端在 `shell.overlay` 注册 `directorx-editor` 条目：关闭时是右侧悬浮把手，
  打开时是右侧停靠面板；生成卡片（图像/视频）提供「编辑」按钮，把本地文件
  路径放入共享 store（`src/client/editor.ts`）后打开面板。
- 源文件经 `GET /directorx/media` 取回 Blob URL 交给编辑器；编辑器导出后
  `POST /directorx/media`（raw body + `content-type` 媒体类型 + `x-directorx-name`
  文件名提示）流式写入 `outputDir/edited/`（512MB 上限、媒体类型白名单、
  跨源 403），并追加 `edits.jsonl`。
- `GET /directorx/media/edits` 供面板展示历史；`directorx_edits` 工具让 DSH
  引用编辑产物。

### 编辑器选型（2026-08-16 一手核实）

- **图像**：tui.image-editor（MIT，7.6k★，2023 年后维护放缓）——功能覆盖
  最全的浏览器图片编辑器，且为框架无关（fabric.js），不受宿主 React 版本
  影响。曾优先评估 react-filerobot-image-editor（MIT，活跃，React 原生），
  但其依赖 react-konva@18 自带 react-reconciler@0.29，与 DSH 的 React
  18.3.1 内部 API 不兼容（`isBatchingLegacy` 崩溃），弃用。
- **视频**：自建轻量 React 时间线（分割/重排/删除）+ **WebAV**（MIT，2k★，
  2026-01 活跃）做解码与 MP4 导出（WebCodecs，仅 Chrome/Edge；`Combinator.
  isSupported()` 前置检查）。音频轨用 **wavesurfer.js**（BSD-3-Clause，
  10k★，极活跃）渲染波形，导出经 WebAV `AudioClip` + `OffscreenSprite`
  混入 AAC 音轨（音量 0–200%）。一体化时间线组件经调研不存在（omniclip 为完整
  应用、npm 停摆 15 个月；etro 为 GPL；remotion/Revideo 导出走 CLI），
  omniclip 作为 UI 参考。
- **导出保存**：编辑器产物 blob → `POST /directorx/media` → `edited/` 落盘
  + `edits.jsonl` 记账。

## 编排层：Workflow 提示词编排与子代理编排

- **流水线模板** `workflows/directorx-pipeline.js`：用 workflow 工具把
  「剧本分镜 → 并行提示词工坊 → 并行生成 → 质检 → 组装方案」编排为子代理
  流水线；`dryRun` 模式零成本验证编排与提示词质量。
- **`directorx-workflow` 技能**：主代理的编排入口（何时用 workflow、模板
  位置、args 约定、编排纪律）；systemPrompt 同步加入「多镜头不串行生成」。
- **子代理注入**：`src/subagents.ts` 经 `subagents.registerContinuableSetup`
  （Harness 官方扩展点）为每个可续子代理安装编排纪律（systemPrompt section
  + `directorx-subagent-orchestration` 技能），随子代理与贡献生命周期回收。
  一次性子代理（spawn/fork）天然继承全局的 DirectorX 工具与技能（已验证）。
- 编排纪律核心：每子代理单任务 + 结构化报告；锚点在分镜阶段一次性锁定；
  失败不重试第三次；付费前四道闸门由执行员按 playbook 确认。

## WebUI 媒体显示

生成工具的调用在对话流中渲染为键控 `tool.call.toolview` 卡片（客户端半注册，
每个 wire 工具名一个 key）。运行中显示提示词摘要；结束后解析规范 JSON 的
`files[]`，按媒体类型内联渲染 `<img>` / `<video>` / `<audio>`。

- 本地文件经 **`GET /directorx/media?path=…`** 流式供给：路径必须落在
  `outputDir` 内（与知识库同款路径逃逸防护），支持 HTTP Range（`bytes=start-end`、
  开区间与后缀区间），响应 `cache-control: no-store`；跨源 `Origin` 直接 403。
- `https` / `data:` 结果 URL 直接引用原地址，不回源。
- 无 `webServer` 服务的 profile（非 web 运行形态）下路由注册为 no-op，插件照常工作。

## 安全边界

- API Key 使用 `role('secret')`，settings describe 永远不回显明文。
- 工具参数通过 `defineTool` schema 校验。
- 文件读取限制在知识库根目录内，禁止路径逃逸。
- `/directorx/media` 仅服务 outputDir 内文件，拒绝跨源与路径逃逸，单文件上限 512MB。
- 异步任务遵守 `AbortSignal` 与超时预算。
- 插件不注册任何 shell、文件写入或系统管理工具；DSH 自身的权限体系负责边界。

## 测试策略

- 知识库检索/读取单测。
- mock 视觉、图像、音频、视频单测。
- 本地 HTTP 假服务覆盖 OpenAI-compatible 四个适配器端到端 round-trip。
- 媒体路由单测：路径逃逸、Range 解析、查询解析、文件检查；另有针对编译产物
  的完整 handler 验证（字节一致、206 切片、跨源 403、同源放行）。
- `pretest` 先跑 `tsc --noEmit` 与 `npm run build`，保证提交产物和源码一致。

## DSH 插件协议合规审计（2026-08-18）

**合规面**：
- Host：`inject` 声明 tools/skills/systemPrompt/settings/llm；settings 用 `settings.register(ns, schema, {applies:'live', validate})`；全部 HTTP 路由经 `ctx.effect(registerXxx, label)` 效应绑定并返回清理器；工具随设置变更整体重注册（disposeTools 前先释放）；模型供应商经 `llm.registerConfigurableProviders` 声明为 declared 提供者。
- Client：`inject` 声明 slots/connection/layout；所有 slot 经 `ctx.slots.inject(cb → disposer)` 注册；details 用 priority -1 替换内置面板并注入 closeDetails；shell.overlay 注入 open/closeDetails；settings.section 注入 connection.api.settings。
- 主题策略：**壳层组件（details 栏/编辑入口/设置节/工具卡）使用 DSW 主题令牌**（--dsw-alias-*），浅色/深色主题均可用；**画布与编辑器画布面为刻意恒暗的创作表面**（行业惯例，如纯黑点阵工作台），内部配色自成体系、不随 shell 主题翻转。
- 全局副作用（window 监听/localStorage/剪贴板）全部在 React effect 内注册并返回清理器。

**已知非合规项（记录，不阻塞）**：
- 客户端用 fetch 直连插件自身 HTTP 路由（/directorx/*），未走 package 私有 RPC——媒体必须经 HTTP 服务，画布文档 GET/PUT 走同一路由族，属于设计取舍而非违规。
- window.__directorxEditor 调试钩子暴露（供浏览器自动化验证用）。
