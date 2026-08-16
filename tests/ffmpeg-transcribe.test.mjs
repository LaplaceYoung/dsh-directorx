import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { DirectiveError, audioBeats, audioMix, audioSync, clipRank, contactSheet, editsToScenes, hasLibass, openaiTts, parseEditInstructions, parseSrt, qaCheck, renderTimeline, smartCut, subtitleCut, videoAnalyze, videoConcat, videoPip, videoProcess, videoSubtitle, videoUnderstand, videoZoom } from '../lib/testing.js'
import { existsSync } from 'node:fs'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { extractFrames, mockTranscribe, probeMedia, registerMediaTasksRoute, runTranscribe } from '../lib/testing.js'

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

test('qaCheck gates duration/aspect/audio against the brief', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-qa-'))
  try {
    const clip = join(dir, 'clip.mp4')
    const make = spawnSync('ffmpeg', ['-hide_banner', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=320x180:rate=24:duration=3', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=3', '-c:v', 'libx264', '-c:a', 'aac', '-shortest', clip], { encoding: 'utf8' })
    if (make.status !== 0) throw new Error('clip gen failed')
    const settings = { outputDir: dir, timeoutMs: 10000, pollIntervalMs: 1000, maxPollAttempts: 10, vision: { enabled: false, mode: 'mock', baseURL: '', apiKey: '', model: '' }, image: {}, video: {}, audio: {}, openlib: {} }
    const pass = await qaCheck({ source: clip, outputDir: dir, expect: { targetSeconds: 3, aspectRatio: '16:9', hasAudio: true, minShots: 1 } }, settings, settings.vision)
    assert.equal(pass.verdict, 'pass', JSON.stringify(pass.checks))
    const fail = await qaCheck({ source: clip, outputDir: dir, expect: { targetSeconds: 10 } }, settings, settings.vision)
    assert.equal(fail.verdict, 'fix')
    assert.ok(fail.checks.some(check => check.name === '时长' && !check.pass))
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('clipRank scores and orders subtitle candidates', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-rank-'))
  try {
    const srt = join(dir, 'subs.srt')
    await writeFile(srt, '1\n00:00:00,000 --> 00:00:01,000\n开场白与客套\n\n2\n00:00:02,000 --> 00:00:03,000\n产品亮点与优惠\n\n3\n00:00:04,000 --> 00:00:05,000\n结尾致谢\n\n', 'utf8')
    const out = await clipRank({ srt, script: ['产品亮点优惠'], topN: 3 })
    assert.equal(out.ranked.length, 3)
    assert.equal(out.ranked[0].cue.index, 2, 'best match ranked first')
    assert.ok(out.ranked[0].score > out.ranked[1].score, 'descending scores')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('openaiTts passes instructions through when provided', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-tts-'))
  let server
  try {
    let captured = null
    server = createServer(async (req, res) => {
      if (req.url === '/audio/speech' && req.method === 'POST') {
        captured = await readJson(req)
        const bytes = Buffer.from('mp3-bytes')
        res.writeHead(200, { 'content-type': 'audio/mpeg', 'content-length': bytes.length })
        res.end(bytes)
        return
      }
      res.writeHead(404)
      res.end()
    })
    await new Promise(resolve => server.listen(0, resolve))
    const ctx = {
      capability: { mode: 'openai-tts', model: 'gpt-4o-mini-tts', baseURL: `http://127.0.0.1:${server.address().port}`, resolution: '', auth: {}, apiKey: 'sk-test', apiKeyEnv: [] },
      settings: { outputDir: dir, timeoutMs: 5000, pollIntervalMs: 10, maxPollAttempts: 3, vision: {}, image: {}, video: {}, audio: {}, openlib: {} },
      signal: AbortSignal.timeout(8000),
    }
    await openaiTts(ctx, '测试旁白', 'onyx', 'mp3', 'Speak in a calm documentary tone; pause before numbers.')
    assert.ok(captured !== null, 'payload captured')
    assert.equal(captured.instructions, 'Speak in a calm documentary tone; pause before numbers.')
  } finally {
    await rm(dir, { recursive: true, force: true })
    server.closeAllConnections?.()
    server.close()
  }
})

test('videoProcess filter chain, rotate/flip and audio extraction', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-fx-'))
  try {
    const clip = join(dir, 'clip.mp4')
    const make = spawnSync('ffmpeg', ['-hide_banner', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=320x180:rate=12:duration=2', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=2', '-c:v', 'libx264', '-c:a', 'aac', '-shortest', clip], { encoding: 'utf8' })
    if (make.status !== 0) throw new Error('clip gen failed')
    const rotated = await videoProcess({ source: clip, outputDir: dir, rotate: 90 })
    const videoStream = rotated.probe.streams.find(stream => stream.type === 'video')
    assert.equal(videoStream.height, 320, '90deg rotation swaps dimensions')
    const flipped = await videoProcess({ source: clip, outputDir: dir, hflip: true })
    assert.ok(existsSync(flipped.path), 'hflip exists')
    const filtered = await videoProcess({ source: clip, outputDir: dir, filters: [{ name: 'eq', value: '0.9:1.1:1.2' }] })
    assert.ok(existsSync(filtered.path), 'eq filter chain exists')
    const audioOnly = await videoProcess({ source: clip, outputDir: dir, extractAudio: true })
    assert.ok(audioOnly.path.endsWith('.m4a'), 'audio extracted as m4a')
    assert.ok(audioOnly.probe.streams.every(stream => stream.type === 'audio'), 'audio-only stream')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('freezeStart holds the first frame and per-pair transitions render', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-fz-'))
  try {
    const make = (name) => {
      const path = join(dir, name)
      const result = spawnSync('ffmpeg', ['-hide_banner', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=320x180:rate=12:duration=2', '-c:v', 'libx264', path], { encoding: 'utf8' })
      if (result.status !== 0) throw new Error('gen failed')
      return path
    }
    const a = make('a.mp4')
    const b = make('b.mp4')
    const frozen = await videoProcess({ source: a, outputDir: dir, freezeStart: 1 })
    assert.ok(frozen.probe.durationSec > 2.8 && frozen.probe.durationSec < 3.2, `freezeStart holds 1s, got ${frozen.probe.durationSec}`)
    const joined = await videoConcat({ files: [a, b], outputDir: dir, transition: ['wipeleft'], fadeSec: 0.5 })
    assert.ok(existsSync(joined.path), 'wipeleft join exists')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('contact sheet tiles midpoint frames into one preview image', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-sheet-'))
  try {
    const clips = []
    for (const name of ['a.mp4', 'b.mp4']) {
      const path = join(dir, name)
      const make = spawnSync('ffmpeg', ['-hide_banner', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=320x180:rate=12:duration=2', '-c:v', 'libx264', path], { encoding: 'utf8' })
      if (make.status !== 0) throw new Error('clip gen failed')
      clips.push(path)
    }
    const sheet = await contactSheet({ sources: clips, outputDir: dir, columns: 2 })
    assert.ok(existsSync(sheet.path), 'sheet png exists')
    assert.equal(sheet.frames.length, 2, 'one frame per clip')
    assert.equal(sheet.columns, 2)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('timeline golden vector renders with pinned structural invariants', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-golden-'))
  try {
    const clip = join(dir, 'clip.mp4')
    const make = spawnSync('ffmpeg', ['-hide_banner', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=320x180:rate=24:duration=4', '-c:v', 'libx264', clip], { encoding: 'utf8' })
    if (make.status !== 0) throw new Error('clip gen failed')
    const fixture = JSON.parse(await readFile(join(import.meta.dirname, 'fixtures', 'timeline-golden.json'), 'utf8'))
    const out = await renderTimeline({
      scenes: fixture.scenes.map((scene) => ({ ...scene, source: clip })),
      fadeIn: fixture.fadeIn,
      fadeOut: fixture.fadeOut,
    }, dir)
    assert.ok(existsSync(out.path), 'golden render exists')
    assert.ok(out.probe.durationSec > 2.5 && out.probe.durationSec < 3.5, `2s@2x + 2s = ~3s, got ${out.probe.durationSec}`)
    assert.ok(out.steps.some(step => step.includes('speed 2x')), 'speed step')
    assert.ok(out.steps.some(step => step.includes('fade in/out')), 'fade step')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('timeline errors carry the stable machine-readable code', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-err-'))
  try {
    await assert.rejects(() => renderTimeline({ scenes: [{ source: '/nonexistent.mp4' }] }, dir), (error) => error instanceof DirectiveError && error.code === 'notFound')
    const real = join(dir, 'real.mp4')
    await writeFile(real, 'stub')
    await assert.rejects(() => renderTimeline({ scenes: [{ source: real, trim: [5, 2] }] }, dir), (error) => error instanceof DirectiveError && error.code === 'outOfRange')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('renderTimeline applies fadeIn/fadeOut', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-fade-'))
  try {
    const clip = join(dir, 'clip.mp4')
    const make = spawnSync('ffmpeg', ['-hide_banner', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=320x180:rate=12:duration=3', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=3', '-c:v', 'libx264', '-c:a', 'aac', '-shortest', clip], { encoding: 'utf8' })
    if (make.status !== 0) throw new Error('clip gen failed')
    const out = await renderTimeline({ scenes: [{ source: clip, transition: 'cut' }], fadeIn: 0.5, fadeOut: 0.5 }, dir)
    assert.ok(existsSync(out.path), 'faded cut exists')
    assert.ok(out.steps.some(step => step.includes('fade in/out')), 'fade step recorded')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('videoProcess reverse and freezeEnd work', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-rev-'))
  try {
    const clip = join(dir, 'clip.mp4')
    const make = spawnSync('ffmpeg', ['-hide_banner', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=320x180:rate=24:duration=2', '-c:v', 'libx264', clip], { encoding: 'utf8' })
    if (make.status !== 0) throw new Error('clip gen failed')
    const reversed = await videoProcess({ source: clip, outputDir: dir, reverse: true })
    assert.ok(existsSync(reversed.path), 'reversed exists')
    const frozen = await videoProcess({ source: clip, outputDir: dir, freezeEnd: 1 })
    assert.ok(frozen.probe.durationSec > 2.8 && frozen.probe.durationSec < 3.2, `freeze holds 1s, got ${frozen.probe.durationSec}`)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('intent-driven edit parser turns natural language into a cut list', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-edit-'))
  try {
    const clip = join(dir, 'clip.mp4')
    const make = spawnSync('ffmpeg', ['-hide_banner', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=320x180:rate=24:duration=10', '-c:v', 'libx264', clip], { encoding: 'utf8' })
    if (make.status !== 0) throw new Error('clip gen failed')
    // 去掉开头 2 秒 + 去掉结尾 3 秒 -> 5s; 2-4 秒放慢 2 倍 -> +2s -> ~7s.
    const commands = parseEditInstructions(['去掉开头 2 秒', '去掉结尾 3 秒', '3 到 5 秒放慢 2 倍'], 10)
    assert.equal(commands.length, 3, 'three commands parsed')
    const scenes = editsToScenes(commands, 10)
    assert.equal(scenes.length, 1, 'single remaining window')
    assert.deepEqual(scenes[0].trim, [2, 7], 'head+tail cuts applied')
    assert.equal(scenes[0].speed, 0.5, '放慢 2 倍 -> 0.5x')
    // reverse only
    const rev = editsToScenes(parseEditInstructions(['整个倒放'], 10), 10)
    assert.equal(rev[0].reverse, true, 'reverse parsed')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('renderTimeline applies scene-level speed (speed ramp building block)', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-ramp-'))
  try {
    const a = join(dir, 'a.mp4')
    const make = spawnSync('ffmpeg', ['-hide_banner', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=320x180:rate=24:duration=4', '-c:v', 'libx264', a], { encoding: 'utf8' })
    if (make.status !== 0) throw new Error('clip gen failed')
    const out = await renderTimeline({
      scenes: [
        { source: a, trim: [0, 2], speed: 2 },
        { source: a, trim: [0, 2], speed: 0.5, transition: 'cut' },
      ],
    }, dir)
    assert.ok(existsSync(out.path), 'ramped cut exists')
    // 2s at 2x = 1s + 2s at 0.5x = 4s -> ~5s total.
    assert.ok(out.probe.durationSec > 4.0 && out.probe.durationSec < 6.0, `speed-ramped duration ~5s, got ${out.probe.durationSec}`)
    assert.ok(out.steps.some(step => step.includes('speed 2x')), 'speed steps recorded')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

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

test('audioMix targetLufs normalizes to the requested loudness', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-lufs-'))
  try {
    const make = (name) => {
      const path = join(dir, name)
      const result = spawnSync('ffmpeg', ['-hide_banner', '-y', '-f', 'lavfi', '-i', `sine=frequency=440:duration=3`, '-f', 'lavfi', '-i', 'testsrc2=size=160x90:rate=12:duration=3', '-c:a', 'aac', '-c:v', 'libx264', '-shortest', path], { encoding: 'utf8' })
      if (result.status !== 0) throw new Error('gen failed')
      return path
    }
    const video = make('base.mp4')
    const narration = make('voice.mp4')
    const out = await audioMix({ video, outputDir: dir, tracks: [{ path: narration, volume: 1 }], duckUnder: 0, targetLufs: -14 })
    assert.ok(existsSync(out.path), 'normalized file exists')
    // Verify integrated loudness via ebur128 summary.
    const measure = spawnSync('ffmpeg', ['-hide_banner', '-i', out.path, '-af', 'ebur128', '-vn', '-f', 'null', '-'], { encoding: 'utf8' })
    const summary = measure.stderr ?? ''
    const all = [...summary.matchAll(/I:\s*(-?[\d.]+)\s*LUFS/g)]
    const match = all[all.length - 1]
    if (match !== undefined) {
      const integrated = Number(match[1])
      assert.ok(Math.abs(integrated - (-14)) < 3, `integrated loudness ~-14 LUFS, got ${integrated}`)
    }
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
