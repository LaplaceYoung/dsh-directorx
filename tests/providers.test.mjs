import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  runAudio,
  runImage,
  runVideo,
  runVision,
} from '../lib/testing.js'

const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
  'base64',
)

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

function sendJson(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json' })
  response.end(JSON.stringify(body))
}

test('OpenAI-compatible provider adapters round-trip through a local endpoint', async t => {
  const requests = []
  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1')
    requests.push({ method: request.method, url: url.pathname, auth: request.headers.authorization ?? '' })

    if (request.method === 'POST' && url.pathname === '/v1/chat/completions') {
      const body = await readJson(request)
      assert.equal(body.model, 'test-vision')
      assert.equal(body.messages[0].content[1].image_url.url, 'data:image/png;base64,AAAA')
      return sendJson(response, 200, { choices: [{ message: { content: 'a red circle on a blue background' } }] })
    }

    if (request.method === 'POST' && url.pathname === '/v1/images/generations') {
      const body = await readJson(request)
      assert.equal(body.model, 'test-image')
      assert.equal(body.prompt, 'a test image')
      return sendJson(response, 200, { data: [{ b64_json: PNG_1PX.toString('base64') }] })
    }

    if (request.method === 'POST' && url.pathname === '/v1/audio/speech') {
      const body = await readJson(request)
      assert.equal(body.model, 'test-audio')
      assert.equal(body.input, 'hello director')
      response.writeHead(200, { 'content-type': 'audio/mpeg' })
      return response.end(Buffer.from([0xff, 0xfb, 0x90, 0x00]))
    }

    if (request.method === 'POST' && url.pathname === '/v1/videos') {
      const body = await readJson(request)
      assert.equal(body.model, 'test-video')
      assert.equal(body.prompt, 'a test video')
      return sendJson(response, 200, { id: 'vid-1', status: 'queued' })
    }

    if (request.method === 'GET' && url.pathname === '/v1/videos/vid-1') {
      const address = server.address()
      const activePort = typeof address === 'object' && address !== null ? address.port : 0
      return sendJson(response, 200, {
        id: 'vid-1',
        status: 'completed',
        url: `http://127.0.0.1:${activePort}/video.mp4`,
      })
    }

    if (request.method === 'GET' && url.pathname === '/video.mp4') {
      response.writeHead(200, { 'content-type': 'video/mp4' })
      return response.end(Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70]))
    }

    return sendJson(response, 404, { error: { message: `unexpected route ${request.method} ${url.pathname}` } })
  })

  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  const port = typeof address === 'object' && address !== null ? address.port : 0
  const baseURL = `http://127.0.0.1:${port}/v1`
  const outDir = await mkdtemp(join(tmpdir(), 'directorx-provider-test-'))
  const settings = {
    outputDir: outDir,
    timeoutMs: 2000,
    pollIntervalMs: 10,
    maxPollAttempts: 5,
  }
  const capability = { enabled: true, mode: '', baseURL, apiKey: 'test-key', model: '' }

  t.after(async () => {
    server.close()
    await rm(outDir, { recursive: true, force: true })
  })

  const vision = await runVision(
    { settings, capability: { ...capability, mode: 'openai-chat', model: 'test-vision' }, signal: new AbortController().signal },
    'data:image/png;base64,AAAA',
    'What is in this image?',
  )
  assert.equal(vision.answer, 'a red circle on a blue background')

  const image = await runImage(
    { settings, capability: { ...capability, mode: 'openai-images', model: 'test-image' }, signal: new AbortController().signal },
    'a test image',
    { size: '1024x1024' },
  )
  assert.equal(image.files[0]?.path !== undefined, true)
  assert.deepEqual(await readFile(image.files[0].path), PNG_1PX)

  const audio = await runAudio(
    { settings, capability: { ...capability, mode: 'openai-tts', model: 'test-audio' }, signal: new AbortController().signal },
    'hello director',
    { format: 'mp3' },
  )
  assert.equal(audio.files[0]?.path !== undefined, true)
  assert.equal((await readFile(audio.files[0].path))[0], 0xff)

  const video = await runVideo(
    { settings, capability: { ...capability, mode: 'openai-videos', model: 'test-video' }, signal: new AbortController().signal },
    'a test video',
    { seconds: 4, size: '1280x720' },
  )
  assert.equal(video.taskId, 'vid-1')
  assert.equal(video.status, 'completed')
  assert.equal(video.files[0]?.path !== undefined, true)
  assert.equal((await readFile(video.files[0].path))[4], 0x66)

  const expected = ['/v1/chat/completions', '/v1/images/generations', '/v1/audio/speech', '/v1/videos', '/v1/videos/vid-1', '/video.mp4']
  assert.deepEqual(requests.map(request => request.url), expected)
  for (const request of requests.filter(request => request.url !== '/video.mp4')) {
    assert.equal(request.auth, 'Bearer test-key')
  }
})