import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { klingJwt, runVideo } from '../lib/testing.js'

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
