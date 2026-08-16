import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { klingJwt, klingV3Video, klingVideo, minimaxH3Video, runVideo } from '../lib/testing.js'

function sendJson(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json' })
  response.end(JSON.stringify(body))
}

async function readJson(request, limit = 1024 * 1024) {
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    chunks.push(chunk)
    size += chunk.length
    if (size > limit) throw new Error('request body too large')
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
}

test('klingVideo payload supports 15s duration and native audio', async () => {
  let captured = null
  const server = createServer(async (req, res) => {
    if (req.url?.includes('text2video') && req.method === 'POST') {
      captured = await readJson(req)
      sendJson(res, 200, { code: 0, message: 'ok', data: { task_id: 't1', task_status: 'submitted' } })
      return
    }
    if (req.url?.includes('/v1/videos/text2video/t1')) {
      sendJson(res, 200, { code: 0, data: { task_id: 't1', task_status: 'failed', task_status_msg: 'stop' } })
      return
    }
    res.writeHead(404)
    res.end()
  })
  await new Promise(resolve => server.listen(0, resolve))
  const port = server.address().port
  const dir = await mkdtemp(join(tmpdir(), 'directorx-kl-'))
  try {
    const ctx = {
      capability: { mode: 'kling', model: 'kling-v3', baseURL: `http://127.0.0.1:${port}`, auth: { klingAk: 'ak', klingSk: 'sk' }, apiKey: '', apiKeyEnv: [] },
      settings: { outputDir: dir, timeoutMs: 5000, pollIntervalMs: 20, maxPollAttempts: 2, vision: {}, image: {}, video: {}, audio: {}, openlib: {} },
      signal: AbortSignal.timeout(8000),
    }
    await klingVideo(ctx, '测试', { seconds: 15, generateAudio: true, voiceIds: ['v1'] }).catch(() => {})
    assert.ok(captured !== null, 'payload captured')
    assert.equal(Number(captured.duration), 15)
    assert.equal(captured.generate_audio, true)
    assert.deepEqual(captured.voice_ids, ['v1'])
  } finally {
    await rm(dir, { recursive: true, force: true })
    server.close()
  }
})

test('klingJwt signs an HS256 token with iss/exp/nbf', () => {
  const token = klingJwt('test-ak', 'test-sk')
  const [headerRaw, payloadRaw, signature] = token.split('.')
  assert.equal(signature !== undefined, true)
  const header = JSON.parse(Buffer.from(headerRaw, 'base64url').toString())
  const payload = JSON.parse(Buffer.from(payloadRaw, 'base64url').toString())
  assert.deepEqual(header, { alg: 'HS256', typ: 'JWT' })
  assert.equal(payload.iss, 'test-ak')
  assert.ok(payload.exp > Math.floor(Date.now() / 1000))
  assert.ok(payload.nbf <= Math.floor(Date.now() / 1000))
})

test('kling mode round-trips through a local endpoint', async () => {
  const requests = []
  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1')
    requests.push({ method: request.method, url: url.pathname, auth: request.headers.authorization ?? '' })
    if (request.method === 'POST' && url.pathname === '/v1/videos/text2video') {
      const body = await readJson(request)
      assert.equal(body.model_name, 'kling-v2')
      assert.equal(body.prompt, 'a kling test')
      assert.equal(body.duration, '5')
      return sendJson(response, 200, { code: 0, message: 'success', data: { task_id: 'kling-1' } })
    }
    if (request.method === 'GET' && url.pathname === '/v1/videos/text2video/kling-1') {
      const address = server.address()
      const activePort = typeof address === 'object' && address !== null ? address.port : 0
      return sendJson(response, 200, {
        code: 0,
        data: { task_id: 'kling-1', task_status: 'succeed', task_result: { videos: [{ url: `http://127.0.0.1:${activePort}/video.mp4`, duration: '5' }] } },
      })
    }
    if (request.method === 'GET' && url.pathname === '/video.mp4') {
      response.writeHead(200, { 'content-type': 'video/mp4' })
      return response.end(Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70]))
    }
    return sendJson(response, 404, { error: { message: 'unexpected route' } })
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  const port = typeof address === 'object' && address !== null ? address.port : 0
  const outDir = await mkdtemp(join(tmpdir(), 'directorx-kling-'))
  try {
    const settings = { outputDir: outDir, timeoutMs: 5000, pollIntervalMs: 10, maxPollAttempts: 5 }
    const capability = {
      enabled: true, mode: 'kling', baseURL: `http://127.0.0.1:${port}`, apiKey: '',
      model: 'kling-v2', resolution: '1K', auth: { klingAk: 'test-ak', klingSk: 'test-sk', runwayVersion: '' },
    }
    const result = await runVideo({ settings, capability, signal: new AbortController().signal }, 'a kling test', { seconds: 5 })
    assert.equal(result.taskId, 'kling-1')
    assert.equal(result.status, 'succeed')
    assert.equal(result.files[0]?.path !== undefined, true)
    assert.match(requests[0].auth, /^Bearer .+\..+\..+$/)
    assert.deepEqual(requests.map(request => `${request.method} ${request.url}`), ['POST /v1/videos/text2video', 'GET /v1/videos/text2video/kling-1', 'GET /video.mp4'])
  } finally {
    server.close()
    await rm(outDir, { recursive: true, force: true })
  }
})

test('kling-v3 mode uses the new-standard protocol', async () => {
  let createPayload = null
  let createPath = ''
  let pollPath = ''
  const server = createServer(async (req, res) => {
    const url = req.url ?? ''
    if (url === '/text-to-video/kling-3.0' && req.method === 'POST') {
      createPayload = await readJson(req)
      createPath = url
      sendJson(res, 200, { code: 0, message: 'ok', data: { id: 'kv1' } })
      return
    }
    if (url.includes('/tasks?task_ids=kv1')) {
      pollPath = url
      sendJson(res, 200, { code: 0, data: [{ id: 'kv1', status: 'succeeded', outputs: [{ url: `http://127.0.0.1:${server.address().port}/out.mp4` }] }] })
      return
    }
    if (url === '/out.mp4') {
      const bytes = Buffer.from('video')
      res.writeHead(200, { 'content-type': 'video/mp4', 'content-length': bytes.length })
      res.end(bytes)
      return
    }
    res.writeHead(404)
    res.end()
  })
  await new Promise(resolve => server.listen(0, resolve))
  const dir = await mkdtemp(join(tmpdir(), 'directorx-kv3-'))
  try {
    const ctx = {
      capability: { mode: 'kling-v3', model: 'kling-3.0', baseURL: `http://127.0.0.1:${server.address().port}`, resolution: '1080p', auth: {}, apiKey: 'k-key', apiKeyEnv: [] },
      settings: { outputDir: dir, timeoutMs: 5000, pollIntervalMs: 10, maxPollAttempts: 3, vision: {}, image: {}, video: {}, audio: {}, openlib: {} },
      signal: AbortSignal.timeout(8000),
      ledger: undefined,
    }
    const result = await klingV3Video(ctx, '雨夜霓虹', { seconds: 15, generateAudio: true, multiShot: true })
    assert.equal(result.status, 'succeed')
    assert.equal(createPath, '/text-to-video/kling-3.0')
    assert.equal(createPayload.settings.duration, 15)
    assert.equal(createPayload.settings.audio, 'native')
    assert.equal(createPayload.settings.muti_shot, true)
    assert.ok(pollPath.includes('/tasks?task_ids=kv1'), 'GET /tasks polling')
  } finally {
    await rm(dir, { recursive: true, force: true })
    server.close()
  }
})

test('minimax-h3 mode round-trips through the v2 protocol', async () => {
  let createPayload = null
  const server = createServer(async (req, res) => {
    const url = req.url ?? ''
    if (url === '/v2/video_generation' && req.method === 'POST') {
      createPayload = await readJson(req)
      sendJson(res, 200, { task_id: 'mm1', base_resp: { status_code: 0, status_msg: 'ok' } })
      return
    }
    if (url.includes('/v2/query/video_generation/mm1')) {
      sendJson(res, 200, { status: 'Success', file_id: 'f1', base_resp: { status_code: 0 } })
      return
    }
    if (url.includes('/v1/files/retrieve')) {
      sendJson(res, 200, { file: { download_url: `http://127.0.0.1:${server.address().port}/download.mp4` }, base_resp: { status_code: 0 } })
      return
    }
    if (url === '/download.mp4') {
      const bytes = Buffer.from('fake-video-bytes')
      res.writeHead(200, { 'content-type': 'video/mp4', 'content-length': bytes.length })
      res.end(bytes)
      return
    }
    res.writeHead(404)
    res.end()
  })
  await new Promise(resolve => server.listen(0, resolve))
  const dir = await mkdtemp(join(tmpdir(), 'directorx-mm-'))
  try {
    const ctx = {
      capability: { mode: 'minimax-h3', model: 'MiniMax-H3', baseURL: `http://127.0.0.1:${server.address().port}`, resolution: '2K', auth: {}, apiKey: 'mm-key', apiKeyEnv: [] },
      settings: { outputDir: dir, timeoutMs: 5000, pollIntervalMs: 10, maxPollAttempts: 3, vision: {}, image: {}, video: {}, audio: {}, openlib: {} },
      signal: AbortSignal.timeout(8000),
      ledger: undefined,
    }
    const result = await minimaxH3Video(ctx, '一只猫在雨夜行走', { seconds: 15, firstFramePath: undefined })
    assert.equal(result.status, 'succeed')
    assert.equal(result.files[0].path.endsWith('.mp4'), true)
    assert.equal(createPayload.model, 'MiniMax-H3')
    assert.equal(createPayload.duration, 15)
    assert.equal(createPayload.resolution, '2K')
    assert.ok(createPayload.content.some(item => item.type === 'text'))
  } finally {
    await rm(dir, { recursive: true, force: true })
    server.close()
  }
})

test('runway mode round-trips through a local endpoint', async () => {
  const requests = []
  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1')
    requests.push({ method: request.method, url: url.pathname, auth: request.headers.authorization ?? '', version: request.headers['x-runway-version'] ?? '' })
    if (request.method === 'POST' && url.pathname === '/v1/text_to_video') {
      const body = await readJson(request)
      assert.equal(body.model, 'gen4.5')
      assert.equal(body.promptText, 'a runway test')
      assert.equal(body.ratio, '1280:720')
      assert.equal(body.duration, 5)
      return sendJson(response, 200, { id: 'rw-1' })
    }
    if (request.method === 'GET' && url.pathname === '/v1/tasks/rw-1') {
      const address = server.address()
      const activePort = typeof address === 'object' && address !== null ? address.port : 0
      return sendJson(response, 200, { id: 'rw-1', status: 'SUCCEEDED', output: [`http://127.0.0.1:${activePort}/runway.mp4`] })
    }
    if (request.method === 'GET' && url.pathname === '/runway.mp4') {
      response.writeHead(200, { 'content-type': 'video/mp4' })
      return response.end(Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70]))
    }
    return sendJson(response, 404, { error: { message: 'unexpected route' } })
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  const port = typeof address === 'object' && address !== null ? address.port : 0
  const outDir = await mkdtemp(join(tmpdir(), 'directorx-runway-'))
  try {
    const settings = { outputDir: outDir, timeoutMs: 5000, pollIntervalMs: 10, maxPollAttempts: 5 }
    const capability = {
      enabled: true, mode: 'runway', baseURL: `http://127.0.0.1:${port}`, apiKey: 'rw-key',
      model: 'gen4.5', resolution: '1K', auth: { klingAk: '', klingSk: '', runwayVersion: '2024-11-06' },
    }
    const result = await runVideo({ settings, capability, signal: new AbortController().signal }, 'a runway test', { seconds: 5, aspectRatio: '16:9' })
    assert.equal(result.taskId, 'rw-1')
    assert.equal(result.status, 'SUCCEEDED')
    assert.equal(result.files[0]?.path !== undefined, true)
    assert.equal(requests[0].auth, 'Bearer rw-key')
    assert.equal(requests[0].version, '2024-11-06')
  } finally {
    server.close()
    await rm(outDir, { recursive: true, force: true })
  }
})
