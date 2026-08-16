import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { audioBeats, audioMix, audioSync, hasLibass, parseSrt, renderTimeline, smartCut, subtitleCut, videoAnalyze, videoConcat, videoPip, videoProcess, videoSubtitle, videoUnderstand, videoZoom } from '../lib/testing.js'
import { existsSync } from 'node:fs'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
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

test('smartCut matches script sentences to subtitle cues and assembles', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-sc-'))
  try {
    const clip = join(dir, 'clip.mp4')
    const make = spawnSync('ffmpeg', ['-hide_banner', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=320x180:rate=24:duration=5', '-c:v', 'libx264', clip], { encoding: 'utf8' })
    if (make.status !== 0) throw new Error('clip gen failed')
    const srt = join(dir, 'subs.srt')
    await writeFile(srt, '1\n00:00:00,500 --> 00:00:02,000\n今天我们聊产品亮点\n\n2\n00:00:03,000 --> 00:00:04,500\n最后记得点赞关注\n\n', 'utf8')
    const out = await smartCut({ video: clip, srt, script: ['聊产品亮点', '点赞关注'], outputDir: dir, pad: 0.1 })
    assert.ok(existsSync(out.path), 'cut exists')
    assert.equal(out.matched.length, 2)
    assert.ok(out.matched.every(item => item.cue !== null), 'both sentences matched')
    assert.ok(out.probe.durationSec > 2.0 && out.probe.durationSec < 4.0, `two windows assembled, got ${out.probe.durationSec}`)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('videoAnalyze detects a hard cut between two clips', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-va-'))
  try {
    const a = join(dir, 'a.mp4')
    const b = join(dir, 'b.mp4')
    const make = (path, color, seconds) => {
      const result = spawnSync('ffmpeg', ['-hide_banner', '-y', '-f', 'lavfi', '-i', `color=c=${color}:s=160x90:rate=12:duration=${seconds}`, '-c:v', 'libx264', path], { encoding: 'utf8' })
      if (result.status !== 0) throw new Error('clip gen failed')
    }
    make(a, 'black', 2)
    make(b, 'white', 2)
    const joined = join(dir, 'joined.mp4')
    const joinResult = spawnSync('ffmpeg', ['-hide_banner', '-y', '-i', a, '-i', b, '-filter_complex', '[0:v][1:v]concat=n=2:v=1[out]', '-map', '[out]', '-c:v', 'libx264', joined], { encoding: 'utf8' })
    if (joinResult.status !== 0) throw new Error('join failed')
    const analysis = await videoAnalyze({ source: joined, outputDir: dir, settings: { outputDir: dir, timeoutMs: 10000, pollIntervalMs: 1000, maxPollAttempts: 10, vision: { enabled: false, mode: 'mock', baseURL: '', apiKey: '', model: '' }, image: {}, video: {}, audio: {}, openlib: {} }, vision: { enabled: false, mode: 'mock', baseURL: '', apiKey: '', model: '' }, cutThreshold: 20 })
    assert.ok(analysis.shots.length >= 2, `black/white cut detected, got ${analysis.shots.length} shots`)
    assert.ok(analysis.shots.every(shot => shot.framePath !== undefined), 'representative frames present')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('audioBeats detects energy peaks in a music-like tone', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-beat-'))
  try {
    const audio = join(dir, 'beat.mp3')
    const make = spawnSync('ffmpeg', ['-hide_banner', '-y', '-f', 'lavfi', '-i', 'aevalsrc=sin(440*2*PI*t)*(0.4+0.6*sin(2*2*PI*t)):d=4', '-c:a', 'libmp3lame', audio], { encoding: 'utf8' })
    if (make.status !== 0) throw new Error('audio gen failed')
    const beats = audioBeats({ source: audio, count: 8, minGap: 0.3 })
    assert.ok(beats.length >= 2, `expects several peaks, got ${beats.length}`)
    assert.ok(beats.every(point => point.t >= 0 && point.t <= 4.2), 'timestamps inside the clip')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('videoUnderstand samples frames and degrades without vision', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-vu-'))
  try {
    const clip = join(dir, 'clip.mp4')
    const make = spawnSync('ffmpeg', ['-hide_banner', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=320x180:rate=12:duration=3', '-c:v', 'libx264', clip], { encoding: 'utf8' })
    if (make.status !== 0) throw new Error('clip gen failed')
    const mockSettings = { outputDir: dir, timeoutMs: 10000, pollIntervalMs: 1000, maxPollAttempts: 10, vision: { enabled: false, mode: 'mock', baseURL: '', apiKey: '', model: 'mock' }, image: {}, video: {}, audio: {}, openlib: {} }
    const out = await videoUnderstand({ source: clip, outputDir: dir, settings: mockSettings, vision: mockSettings.vision, frames: 4 })
    assert.equal(out.frames.length, 4)
    assert.ok(out.frames.every(frame => frame.path !== '' && frame.path.includes('frames/')), 'frame paths present')
    assert.ok(out.note !== undefined, 'degradation note present')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('audioSync detects narration intervals and mixes with ducking', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-sync-'))
  try {
    const makeVideo = (name) => {
      const path = join(dir, name)
      const result = spawnSync('ffmpeg', ['-hide_banner', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=320x180:rate=12:duration=4', '-c:v', 'libx264', path], { encoding: 'utf8' })
      if (result.status !== 0) throw new Error('video gen failed')
      return path
    }
    // Narration: 1s speech, 0.8s silence, 1s speech.
    const narration = join(dir, 'narration.mp3')
    const voice = spawnSync('ffmpeg', ['-hide_banner', '-y', '-f', 'lavfi', '-i', 'aevalsrc=sin(880*2*PI*t)*lt(t\\,1)+sin(880*2*PI*t)*gt(t\\,1.8)*lt(t\\,2.8):d=4', '-c:a', 'libmp3lame', narration], { encoding: 'utf8' })
    if (voice.status !== 0) throw new Error('narration gen failed')
    const video = makeVideo('v.mp4')
    const out = await audioSync({ video, narration, outputDir: dir })
    assert.ok(existsSync(out.path), 'synced file exists')
    assert.ok(out.speechIntervals.length >= 1, `speech intervals detected: ${JSON.stringify(out.speechIntervals)}`)
    assert.ok(out.probe.streams.some(stream => stream.type === 'audio'), 'audio present')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('parseSrt and subtitleCut drive caption-based cuts', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-srtcut-'))
  try {
    const cues = parseSrt('1\n00:00:00,000 --> 00:00:01,000\n开场词\n\n2\n00:00:02,000 --> 00:00:03,000\n主体句\n\n')
    assert.equal(cues.length, 2)
    assert.equal(cues[1].start, 2)
    const clip = join(dir, 'clip.mp4')
    const make = spawnSync('ffmpeg', ['-hide_banner', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=320x180:rate=24:duration=4', '-c:v', 'libx264', clip], { encoding: 'utf8' })
    if (make.status !== 0) throw new Error('clip gen failed')
    const srt = join(dir, 'subs.srt')
    await writeFile(srt, '1\n00:00:00,000 --> 00:00:01,000\n开场词\n\n2\n00:00:02,000 --> 00:00:03,000\n主体句\n\n', 'utf8')
    const out = await subtitleCut({ video: clip, srt, outputDir: dir, include: '主体', pad: 0.1 })
    assert.ok(existsSync(out.path), 'cut file exists')
    assert.equal(out.cues.length, 1, 'keyword filtered to one cue')
    assert.ok(out.probe.durationSec > 0.8 && out.probe.durationSec < 1.4, `kept only the matched window, got ${out.probe.durationSec}`)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('renderTimeline assembles trimmed scenes into a finished cut', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-tl-'))
  try {
    const make = (name, seconds) => {
      const path = join(dir, name)
      const result = spawnSync('ffmpeg', ['-hide_banner', '-y', '-f', 'lavfi', '-i', `testsrc2=size=320x180:rate=24:duration=${seconds}`, '-f', 'lavfi', '-i', `sine=frequency=440:duration=${seconds}`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', path], { encoding: 'utf8' })
      if (result.status !== 0) throw new Error('clip gen failed')
      return path
    }
    const a = make('a.mp4', 3)
    const b = make('b.mp4', 3)
    const srt = join(dir, 'subs.srt')
    await writeFile(srt, '1\n00:00:00,000 --> 00:00:01,000\n字幕。\n\n', 'utf8')
    const out = await renderTimeline({
      scenes: [
        { source: a, trim: [0, 2] },
        { source: b, trim: [0.5, 2.5], transition: 'cut' },
      ],
      subtitle: srt,
      scale: '320:180',
    }, dir)
    assert.ok(existsSync(out.path), 'final cut exists')
    assert.ok(out.probe.durationSec > 3.0 && out.probe.durationSec < 4.5, `trimmed duration ~3.5s, got ${out.probe.durationSec}`)
    assert.ok(out.probe.streams.some(stream => stream.type === 'subtitle'), 'subtitle track muxed')
    assert.ok(out.steps.length >= 4, 'steps recorded')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('videoZoom and videoPip produce valid outputs', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-fx-'))
  try {
    const clip = join(dir, 'clip.mp4')
    const make = spawnSync('ffmpeg', ['-hide_banner', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=320x180:rate=12:duration=2', '-f', 'lavfi', '-i', 'sine=frequency=300:duration=2', '-c:v', 'libx264', '-c:a', 'aac', '-shortest', clip], { encoding: 'utf8' })
    if (make.status !== 0) throw new Error('clip gen failed')
    const zoomed = await videoZoom({ video: clip, outputDir: dir, strength: 0.3, direction: 'in' })
    assert.ok(existsSync(zoomed.path), 'zoomed file exists')
    assert.ok(zoomed.probe.durationSec > 1.5, 'duration preserved')
    const overlayPng = join(dir, 'sticker.png')
    const png = spawnSync('ffmpeg', ['-hide_banner', '-y', '-f', 'lavfi', '-i', 'color=c=red:s=80x60', '-frames:v', '1', overlayPng], { encoding: 'utf8' })
    if (png.status !== 0) throw new Error('png gen failed')
    const pip = await videoPip({ video: clip, overlay: overlayPng, outputDir: dir, x: 10, y: 10, w: 80 })
    assert.ok(existsSync(pip.path), 'pip file exists')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('videoSubtitle soft-muxes an srt track without libass', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-sub-'))
  try {
    const clip = join(dir, 'clip.mp4')
    const make = spawnSync('ffmpeg', ['-hide_banner', '-y', '-f', 'lavfi', '-i', 'color=c=black:s=160x90:rate=12', '-f', 'lavfi', '-i', 'sine=frequency=300:duration=2', '-c:v', 'libx264', '-c:a', 'aac', '-shortest', clip], { encoding: 'utf8' })
    if (make.status !== 0) throw new Error('clip gen failed')
    const srt = join(dir, 'subs.srt')
    await writeFile(srt, '1\n00:00:00,000 --> 00:00:01,500\n你好，字幕。\n\n', 'utf8')
    const out = await videoSubtitle({ video: clip, srt, mode: 'soft', outputDir: dir })
    assert.ok(existsSync(out.path), 'subtitled file exists')
    assert.ok(out.probe.streams.some(stream => stream.type === 'subtitle'), 'subtitle stream present')
    if (hasLibass()) {
      const burned = await videoSubtitle({ video: clip, srt, mode: 'burn', outputDir: dir })
      assert.ok(existsSync(burned.path), 'burned file exists')
    }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('audioMix overlays BGM onto a video with ducking', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-mix-'))
  try {
    const make = (name, freq, seconds) => {
      const path = join(dir, name)
      const result = spawnSync('ffmpeg', ['-hide_banner', '-y', '-f', 'lavfi', '-i', 'color=c=black:s=160x90:rate=12', '-f', 'lavfi', '-i', `sine=frequency=${freq}:duration=${seconds}`, '-c:v', 'libx264', '-c:a', 'aac', '-shortest', path], { encoding: 'utf8' })
      if (result.status !== 0) throw new Error('clip gen failed: ' + (result.stderr ?? '').slice(-300))
      return path
    }
    const video = make('v.mp4', 220, 2)
    const bgm = make('bgm.mp4', 440, 2)
    const voice = make('voice.mp4', 880, 2)
    const mixed = await audioMix({ video, outputDir: dir, tracks: [{ path: voice, volume: 1 }, { path: bgm, volume: 0.4 }], duckUnder: 0 })
    assert.ok(existsSync(mixed.path), 'mixed file exists')
    assert.ok(mixed.probe.streams.some(stream => stream.type === 'audio'), 'audio stream present')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

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
