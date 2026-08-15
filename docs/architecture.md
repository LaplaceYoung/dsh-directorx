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
│ bundled corpus: knowledge/ skills/ recipes/          │
│ bundled corpus: knowledge/ skills/ recipes/            │
└──────────────────────────────────────────────────────┘
```

## 服务依赖

宿主插件声明：

```ts
export const inject = ['tools', 'skills', 'systemPrompt', 'settings', 'llm']
```

| DSH 服务 | 用途 |
|---|---|
| `tools` | 注册 4 个媒体生成工具和 2 个知识库工具 |
| `skills` | 注册内置 `SKILL.md` 为 DSH runtime skills |
| `systemPrompt` | 注入媒体工具使用纪律，避免模型瞎猜协议 |
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


## 安全边界

- API Key 使用 `role('secret')`，settings describe 永远不回显明文。
- 工具参数通过 `defineTool` schema 校验。
- 文件读取限制在知识库根目录内，禁止路径逃逸。
- 异步任务遵守 `AbortSignal` 与超时预算。
- 插件不注册任何 shell、文件写入或系统管理工具；DSH 自身的权限体系负责边界。

## 测试策略

- 知识库检索/读取单测。
- mock 视觉、图像、音频、视频单测。
- 本地 HTTP 假服务覆盖 OpenAI-compatible 四个适配器端到端 round-trip。
- `pretest` 先跑 `tsc --noEmit` 与 `npm run build`，保证提交产物和源码一致。