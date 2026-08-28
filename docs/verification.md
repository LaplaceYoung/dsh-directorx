# Verification

## Automated checks

```bash
npm test
```

`pretest` runs `tsc --noEmit` and `npm run build`, then Node's test runner executes:

- knowledge corpus search/read
- mock vision / image / audio flows
- package metadata (`dsh.bundle`, `dsh.client`, README `dsh-plugin`)
- OpenAI-compatible vision, image, audio, and polling video adapters against a local HTTP server
- modelverse-tasks submit/poll round-trip with ledger transitions
- task ledger: append/fold/latest, cancel semantics, poll-loop abort on cancel
- media route: path escape rejection, Range parsing, media query parsing, file inspection

Expected: **340/340 passing**.

## External Knowledge provider

外挂 Knowledge 只能通过 `KnowledgeProvider` 和 `registerKnowledgeProvider()` 接入。provider 必须是只读适配器；搜索结果和正文均视为不可信参考，必须显式 `provider` 选择并记录引用。外部内容不得覆盖 DSH system prompt、工具权限、安全规则或用户确认流程。

Provider smoke 应覆盖：非法 id 拒绝、未知 provider 拒绝、search/read round-trip，以及 provider 失败时不写入 `knowledge/`、画布或项目状态。

## Media route handler verification

Beyond the unit tests, the compiled `lib/testing.js` handler is exercised against
a real local HTTP server (stub `webServer` context):

- PNG/MP4 bytes round-trip, `content-type`, `no-store`, `accept-ranges`
- `HEAD` length, `bytes=2-5` → 206 with correct slice and `content-range`
- path traversal / missing file → 404; no `path` → 400; POST → 405
- cross-origin `Origin` → 403; same-origin passes

Recorded run: all 14 checks passed.

## Live deployment verification (running server, no process restart)

The rebuilt host bundle was activated in the running `dsh web` process by a
loader entry reset (disable → re-enable forces a fresh module import; all
plugin registrations are fiber-effect-bound, so the swap is clean). Verified
on the live `127.0.0.1:3082` server:

- `GET /directorx/media?path=<file>` → 200 with correct bytes/type,
  `accept-ranges: bytes`, `cache-control: no-store`
- `Range: bytes=2-5` → 206 with correct `content-range`
- `HEAD` → 200 with correct `content-length`
- path traversal / missing file → 404; missing `path` → 400; cross-origin → 403
- `directorx_task_status` and `directorx_cancel_task` registered in the tool
  registry alongside the six original tools
- `/plugins/dsh-directorx/client.js` serves the card bundle (no-cache), so a
  browser refresh activates the WebUI media cards

No server process was restarted and other sessions were unaffected.

## DSH smoke test

```bash
scripts/dsh-smoke.sh
```

Creates a temporary profile, installs the plugin, asks DSH to call
`directorx_knowledge_search` and `directorx_knowledge_read`, then cleans up.

Recorded run: returned article `116`「图生视频深度控制」and a correct key fact.

## WebUI settings verification

A headless Playwright run against `dsh web` verified:

1. Settings → DirectorX renders four capability cards.
2. Changing Vision mode to `mock` and clicking save persists to
   `~/.video-agent/settings.yaml`.
3. `settings.describe` returns the `directorx` namespace with redacted secrets.
4. Filling a test API key through the browser writes it into settings and the
   wire response never returns the plaintext value.

## API key end-to-end

With the WebUI-saved key `sk-round12-test` and a local mock OpenAI endpoint,
DSH called `directorx_view_image`. The mock server received:

```json
{
  "url": "/v1/chat/completions",
  "auth": "Bearer sk-round12-test"
}
```

and DSH returned the mock answer to the session.

## Live image/video provider smoke

Using the user-configured generation endpoints in the local environment, the
following were generated successfully through the plugin adapters:

- Image: `gpt-image-2` via an OpenAI-compatible images endpoint → 1024x1024 PNG.
- Video: `MiniMax-H3` via async tasks → 2560x1440 H.264/AAC MP4, 4.46s.
- Image-to-video: `doubao-seedance-2-0-260128` with a first-frame reference →
  MP4 output.

No keys or endpoint URLs are stored in this repository or shown in logs.
