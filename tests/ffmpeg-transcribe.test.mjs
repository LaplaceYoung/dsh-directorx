import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { videoConcat, videoProcess } from '../lib/testing.js'
import { existsSync } from 'node:fs'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { extractFrames, mockTranscribe, probeMedia, registerMediaTasksRoute, runTranscribe } from '../lib/testing.js'

const hasFfmpeg = (() => {
  const found = spawnSync('which', ['ffmpeg'], { encoding: 'utf8' })
  return found.status === 0 && found.stdout.trim() !== ''
})()

function makeVideo(dir, name = 'sample.mp4') {
  const path = join(dir, name)
  const result = spawnSync('ffmpeg', ['-y', '-f', 'lavfi', '-i', 'testsrc2=size=320x180:rate=12:duration=1', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', path], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr?.slice(-300))
  return path
}

test('videoProcess trims and speeds up; videoConcat joins with xfade', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-vp-'))
  try {
    const makeClip = (name, seconds) => {
      const path = join(dir, name)
      const result = spawnSync('ffmpeg', ['-hide_banner', '-y', '-f', 'lavfi', '-i', `testsrc2=size=320x180:rate=24:duration=${seconds}`, '-f', 'lavfi', '-i', 'sine=frequency=440:duration=' + seconds, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', path], { encoding: 'utf8' })
      if (result.status !== 0) throw new Error('clip gen failed: ' + (result.stderr ?? '').slice(-300))
      return path
    }
    const a = makeClip('a.mp4', 2)
    const b = makeClip('b.mp4', 2)
    const processed = await videoProcess({ source: a, outputDir: dir, start: 0.2, end: 1.4, speed: 2, mute: true, scale: '160:90' })
    assert.ok(existsSync(processed.path), 'processed file exists')
    assert.equal(processed.probe.format, 'mov,mp4,m4a,3gp,3g2,mj2')
    assert.ok(processed.probe.durationSec < 0.8 && processed.probe.durationSec > 0.3, `trimmed+sped duration ~0.6s, got ${processed.probe.durationSec}`)
    const concat = await videoConcat({ files: [a, b], outputDir: dir, transition: 'fade', fadeSec: 0.4 })
    assert.ok(existsSync(concat.path), 'concat file exists')
    assert.ok(concat.probe.durationSec > 3.0 && concat.probe.durationSec < 4.0, `fade concat duration ~3.6s, got ${concat.probe.durationSec}`)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('probeMedia reports format, duration, and video stream', { skip: !hasFfmpeg }, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-ffmpeg-'))
  try {
    const video = makeVideo(dir)
    const probe = probeMedia(video)
    assert.equal(probe.format, 'mov,mp4,m4a,3gp,3g2,mj2')
    assert.ok(probe.durationSec > 0.5 && probe.durationSec < 3)
    assert.ok(probe.streams.some(stream => stream.type === 'video' && stream.codec === 'h264'))
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('extractFrames writes evenly spaced PNG frames', { skip: !hasFfmpeg }, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-ffmpeg-'))
  const out = join(dir, 'out')
  try {
    const video = makeVideo(dir)
    const files = await extractFrames(video, out, { count: 3 })
    assert.equal(files.length, 3)
    for (const file of files) {
      assert.equal(file.mimeType, 'image/png')
      assert.equal(existsSync(file.path), true)
      assert.ok((await readFile(file.path)).subarray(1, 4).toString() === 'PNG')
    }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('mock transcription returns text and an SRT file', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-transcribe-'))
  try {
    const settings = { outputDir: dir, timeoutMs: 5000, pollIntervalMs: 10, maxPollAttempts: 2 }
    const capability = { enabled: true, mode: 'mock', baseURL: '', apiKey: '', model: 'mock-stt', resolution: '1K' }
    const result = await mockTranscribe({ settings, capability, signal: new AbortController().signal }, '/tmp/example.mp3')
    assert.match(result.text, /mock transcription/)
    assert.equal(result.files.length, 1)
    assert.equal(existsSync(result.files[0].path), true)
    assert.match(await readFile(result.files[0].path, 'utf8'), /-->/)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('openai transcription round-trips through a local endpoint', async () => {
  const requests = []
  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1')
    requests.push({ method: request.method, url: url.pathname, contentType: request.headers['content-type'] ?? '', auth: request.headers.authorization ?? '' })
    if (request.method === 'POST' && url.pathname === '/v1/audio/transcriptions') {
      response.writeHead(200, { 'content-type': 'application/json' })
      return response.end(JSON.stringify({ text: '你好世界，这是测试转写。' }))
    }
    response.writeHead(404, { 'content-type': 'application/json' })
    return response.end(JSON.stringify({ error: { message: 'unexpected route' } }))
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  const port = typeof address === 'object' && address !== null ? address.port : 0
  const dir = await mkdtemp(join(tmpdir(), 'directorx-transcribe-'))
  try {
    const settings = { outputDir: dir, timeoutMs: 5000, pollIntervalMs: 10, maxPollAttempts: 2 }
    const capability = { enabled: true, mode: 'openai-tts', baseURL: `http://127.0.0.1:${port}/v1`, apiKey: 'test-key', model: 'whisper-1', resolution: '1K' }
    const input = join(dir, 'input.mp3')
    await (await import('node:fs/promises')).writeFile(input, Buffer.from([0xff, 0xfb, 0x90, 0x00]))
    const result = await runTranscribe(
      { settings, capability, signal: new AbortController().signal },
      input,
      { format: 'json', language: 'zh' },
    )
    assert.equal(result.text, '你好世界，这是测试转写。')
    assert.equal(result.files.length, 1)
    assert.equal(requests[0].url, '/v1/audio/transcriptions')
    assert.match(requests[0].contentType, /multipart\/form-data/)
    assert.equal(requests[0].auth, 'Bearer test-key')
  } finally {
    server.close()
    await rm(dir, { recursive: true, force: true })
  }
})

test('tasks listing route serves latest state per task', async () => {
  const handlers = new Map()
  const server = createServer((request, response) => {
    const handler = handlers.get(new URL(request.url ?? '/', 'http://x').pathname)
    if (handler === undefined) { response.writeHead(404); response.end(); return }
    void handler(request, response)
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const dir = await mkdtemp(join(tmpdir(), 'directorx-tasks-'))
  try {
    const fakeCtx = {
      get(name) {
        if (name !== 'webServer') return undefined
        return { register: route => { handlers.set(route.path, route.handler); return () => handlers.delete(route.path) } }
      },
    }
    registerMediaTasksRoute(fakeCtx, () => dir)
    const port = typeof server.address() === 'object' && server.address() !== null ? server.address().port : 0
    const empty = await fetch(`http://127.0.0.1:${port}/directorx/media/tasks`).then(response => response.json())
    assert.deepEqual(empty.tasks, [])
    // Seed the ledger through the same file the route reads.
    const { DirectorxTaskLedger } = await import('../lib/testing.js')
    const ledger = new DirectorxTaskLedger(dir)
    await ledger.append({ taskId: 't1', model: 'm', mode: 'openai-videos', prompt: 'p1', state: 'submitted', at: Date.now() - 10 })
    await ledger.append({ taskId: 't1', model: 'm', mode: 'openai-videos', prompt: 'p1', state: 'succeeded', at: Date.now() })
    const listed = await fetch(`http://127.0.0.1:${port}/directorx/media/tasks`).then(response => response.json())
    assert.equal(listed.tasks.length, 1)
    assert.equal(listed.tasks[0].state, 'succeeded')
  } finally {
    server.close()
    await rm(dir, { recursive: true, force: true })
  }
})
