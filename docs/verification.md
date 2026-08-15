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

Expected: **7/7 passing**.

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
