---
name: directorx-provider-onboard
description: >-
  用户要接入新的生成模型或新提供商时加载。用户只给模型 id、API 文档、API Key。
  固定流程：ingest → classify → draft → confirm → smoke → commit。
  只填封闭 AdapterSpec，禁止写代码、禁止回传 Key。
user-invocable: true
---

# 接入生成模型

用户给三样东西：**模型 id、API 文档（粘贴或 URL）、API Key**。你按下面六步走，一步未完成不要跳。

不要写 TypeScript，不要发明新的 `directorx_generate_*`，不要把 Key 写进回复。

## 流程

1. `directorx_provider_ingest`  
   `model` + `capability`（image/video/audio）+ `apiDoc` 或 `apiDocUrl` + 可选 `baseURL` + `apiKey`。  
   返回 `id`。Key 不会出现在结果里。

2. `directorx_provider_classify` `{ id }`  
   - **A**：已有协议（openai-* / modelverse-tasks / kling / runway / vidu / veo / minimax-h3）。draft 补 `baseURL` 和 `caps`。  
   - **B**：`generic-rest`。这是默认主路径。draft 必须填 `create`，以及 `poll`（异步）或 `syncResult`（同步）。

3. `directorx_provider_draft` `{ id, spec }`  
   只填 AdapterSpec 已有键。`create.body` 的每个值是：
   - `{ "type": "from", "field": "prompt" }`（field 只能是 prompt/text/model/seconds/size/aspectRatio/resolution/firstFrame/lastFrame/negativePrompt/voice）
   - 或 `{ "type": "const", "value": ... }`  
   字段路径必须能在用户文档里引用到。引用不到就问用户，不要猜。

4. `directorx_ask`  
   用 directorx_ask（DSH 标准提问）确认：按 A 还是 B、baseURL 是否正确、要不要打一发最短真调用。不要在正文里列菜单。

5. `directorx_provider_smoke` `{ id, createFixture?, pollFixture?, live? }`  
   先契约+探活。`live:true` 才打最短付费调用（B 类）。失败按返回的 issues 改 spec，不要重写协议。

6. `directorx_provider_commit` `{ id }`  
   写入 Settings 并点亮 catalog。告诉用户**刷新页面**。之后生成仍走 `directorx_generate_image` / `directorx_generate_video` / `directorx_generate_audio`，可带 `model`。

## 纪律

- 列表用 `directorx_provider_list`。
- 同一模型已存在就在原 `id` 上补丁，不要另起一套。
- multipart / SDK-only / 需要执行任意代码的协议：停下来告诉用户目前只支持 JSON HTTP。
- 可灵 JWT 必须 classify 成 `kling`，不要把 `kling-jwt` 塞进 generic-rest。
