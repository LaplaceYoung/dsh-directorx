import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { existsSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  CharacterStore, DirectorxCanvasStore, parseDesubRegion, parseScriptBeats, planAutolink, registerCanvasCraftRoute,
  runCanvasCraft, SCRIPT_STARTER,
} from '../lib/testing.js'

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

test('parseScriptBeats reads Fountain headings, Chinese shots, and numbered rows', () => {
  const fountain = parseScriptBeats(`Title: Demo

INT. CAFE - DAY

LIN XIAO
Pushes the door. 5s

SHOT 2
Over the shoulder. The clerk looks up.
`)
  assert.ok(fountain.length >= 2)
  assert.match(fountain[0].act, /CAFE|咖啡馆|第一场/)
  assert.ok(fountain[0].characters.includes('LIN XIAO'))
  assert.match(fountain[0].prompt, /Pushes the door/)
  assert.equal(fountain[0].seconds, 5)

  const chinese = parseScriptBeats(`第一场 咖啡馆 日
镜头1：近景，林晓推门进来，5s
林晓：有人吗
镜头2：过肩，店员抬头
`)
  assert.equal(chinese.length, 2)
  assert.match(chinese[0].act, /咖啡馆/)
  assert.ok(chinese[0].characters.includes('林晓'))
  assert.match(chinese[0].prompt, /推门/)
  assert.match(chinese[1].prompt, /过肩/)

  const numbered = parseScriptBeats(`1. 近景推门进来 3s
2. 过肩对话店员抬头
`)
  assert.equal(numbered.length, 2)
  assert.equal(numbered[0].seconds, 3)

  const loose = parseScriptBeats(`雨夜巷口，霓虹招牌在积水里晃。

近景，主角撑伞走进巷子。
`)
  assert.equal(loose.length, 2)
})

test('applyScriptRows lays 本→首帧→视频 and is idempotent', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-script-'))
  try {
    const first = await runCanvasCraft({ outputDir: dir, action: 'script', text: SCRIPT_STARTER, arrange: false })
    assert.equal(first.ok, true)
    assert.equal(first.reused, false)
    assert.ok((first.beats ?? []).length >= 2)
    const videos = first.doc.nodes.filter(node => node.kind === 'video')
    const stills = first.doc.nodes.filter(node => node.kind === 'image')
    const texts = first.doc.nodes.filter(node => node.kind === 'text')
    assert.ok(videos.length >= 2)
    assert.equal(stills.length, videos.length)
    assert.ok(texts.length >= videos.length)
    assert.ok(first.doc.edges.some(edge => edge.label === '本'))
    assert.ok(first.doc.edges.some(edge => edge.label === '首帧'))
    assert.ok(first.doc.edges.some(edge => edge.label === '承接'))
    assert.ok(first.doc.nodes.every(node => node.shotStatus !== 'generating'))

    const again = await runCanvasCraft({ outputDir: dir, action: 'script', nodeId: first.sourceId, arrange: false })
    assert.equal(again.reused, true)
    assert.equal(again.doc.nodes.length, first.doc.nodes.length)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('planAutolink wires character refs and overlapping tokens, never video→image', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-link-'))
  try {
    const store = new DirectorxCanvasStore(dir)
    let doc = await store.addNode({ kind: 'image', id: 'lin', label: '林晓', path: '/tmp/lin.png', x: 0, y: 0 })
    doc = await store.addNode({ kind: 'video', id: 'shot', label: '进门', prompt: '林晓走进咖啡馆，雨夜霓虹', x: 300, y: 0 })
    doc = await store.addNode({ kind: 'text', id: 'note', label: '雨夜霓虹招牌在巷口', x: 0, y: 200 })
    doc = await store.addNode({ kind: 'video', id: 'other', label: '厨房', prompt: '平底锅煎蛋教学', x: 300, y: 200 })
    await new CharacterStore(dir).register({ name: '林晓', refPath: '/tmp/lin.png' })
    const hits = planAutolink(doc, { characters: [{ name: '林晓', refPath: '/tmp/lin.png' }] })
    assert.ok(hits.some(hit => hit.from === 'lin' && hit.to === 'shot'))
    assert.ok(hits.some(hit => hit.from === 'note' && (hit.to === 'shot')))
    assert.ok(!hits.some(hit => hit.from === 'shot' && hit.to === 'lin'))
    assert.ok(!hits.some(hit => hit.to === 'other' && hit.from === 'lin'))

    const applied = await runCanvasCraft({ outputDir: dir, action: 'autolink' })
    assert.ok((applied.added ?? []).length >= 1)
    assert.ok(applied.doc.edges.some(edge => edge.from === 'lin' && edge.to === 'shot'))
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('canvas frames pin stills under the clip', { skip: !hasFfmpeg }, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-frames-'))
  try {
    const clip = makeVideo(dir)
    const store = new DirectorxCanvasStore(dir)
    const seeded = await store.addNode({ kind: 'video', id: 'clip', label: '成片', path: clip, prompt: '咖啡馆进门', x: 40, y: 40 })
    const first = await runCanvasCraft({ outputDir: dir, action: 'frames', nodeId: 'clip', count: 3, arrange: false })
    assert.equal(first.reused, false)
    const images = first.doc.nodes.filter(node => node.kind === 'image')
    assert.equal(images.length, 3)
    assert.ok(images.every(node => typeof node.path === 'string' && existsSync(node.path)))
    assert.ok(images.every(node => node.shotStatus === 'review'))
    assert.ok(!first.doc.edges.some(edge => edge.from === 'clip' && images.some(image => image.id === edge.to)))
    assert.equal(seeded.nodes[0].id, 'clip')

    const again = await runCanvasCraft({ outputDir: dir, action: 'frames', nodeId: 'clip' })
    assert.equal(again.reused, true)
    assert.equal(again.doc.nodes.filter(node => node.kind === 'image').length, 3)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('POST /directorx/canvas/craft scripts a board without generating', async () => {
  const handlers = new Map()
  const server = createServer((request, response) => {
    const handler = handlers.get(new URL(request.url ?? '/', 'http://x').pathname)
    if (handler === undefined) { response.writeHead(404); response.end(); return }
    void handler(request, response)
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const dir = await mkdtemp(join(tmpdir(), 'directorx-craft-http-'))
  const port = typeof server.address() === 'object' && server.address() !== null ? server.address().port : 0
  try {
    const fakeCtx = {
      get(name) {
        if (name !== 'webServer') return undefined
        return { register: route => { handlers.set(route.path, route.handler); return () => handlers.delete(route.path) } }
      },
    }
    registerCanvasCraftRoute(fakeCtx, () => dir)
    const created = await fetch(`http://127.0.0.1:${port}/directorx/canvas/craft`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'script', text: SCRIPT_STARTER, arrange: false }),
    })
    assert.equal(created.status, 200)
    const body = await created.json()
    assert.equal(body.ok, true)
    assert.ok(body.doc.nodes.some(node => node.kind === 'video'))
    assert.ok(body.doc.nodes.every(node => node.shotStatus !== 'generating'))

    const bad = await fetch(`http://127.0.0.1:${port}/directorx/canvas/craft`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'nope' }),
    })
    assert.equal(bad.status, 400)
  } finally {
    server.close()
    await rm(dir, { recursive: true, force: true })
  }
})

test('one-click parse pins a script card and cut stills', { skip: !hasFfmpeg }, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-parse-'))
  try {
    const clip = makeVideo(dir, 'source.mp4')
    const store = new DirectorxCanvasStore(dir)
    await store.addNode({ kind: 'video', id: 'src', label: '成片', path: clip, x: 40, y: 40 })
    const first = await runCanvasCraft({ outputDir: dir, action: 'parse', nodeId: 'src', arrange: false })
    assert.equal(first.reused, false)
    assert.ok((first.shots ?? []).length >= 1)
    assert.match(first.script ?? '', /镜头1/)
    assert.ok(first.doc.nodes.some(node => node.kind === 'text' && /解析/.test(node.label)))
    assert.ok(first.doc.nodes.some(node => node.kind === 'image' && typeof node.path === 'string'))
    assert.ok(first.doc.nodes.every(node => node.shotStatus !== 'generating'))
    const again = await runCanvasCraft({ outputDir: dir, action: 'parse', nodeId: 'src' })
    assert.equal(again.reused, true)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('reshoot cuts a window then assembles head+mid+tail', { skip: !hasFfmpeg }, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-reshoot-'))
  try {
    const clip = join(dir, 'long.mp4')
    const make = spawnSync('ffmpeg', ['-y', '-f', 'lavfi', '-i', 'testsrc2=size=320x180:rate=12:duration=3', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', clip], { encoding: 'utf8' })
    assert.equal(make.status, 0, make.stderr?.slice(-200))
    const store = new DirectorxCanvasStore(dir)
    await store.addNode({ kind: 'video', id: 'src', label: '成片', path: clip, x: 20, y: 20 })
    const cut = await runCanvasCraft({
      outputDir: dir,
      action: 'reshoot',
      nodeId: 'src',
      start: 1,
      end: 2,
      prompt: '改成推门进来',
      arrange: false,
    })
    assert.equal(cut.phase, 'cut')
    assert.ok(typeof cut.midId === 'string')
    const mid = cut.doc.nodes.find(node => node.id === cut.midId)
    assert.equal(mid.shotStatus, 'idea')
    assert.ok(mid.continuityRules.includes('重做中段'))
    assert.ok(cut.doc.nodes.some(node => node.kind === 'image' && /首帧/.test(node.label)))
    await store.update(cut.midId, { path: clip })
    const assembled = await runCanvasCraft({ outputDir: dir, action: 'reshoot', nodeId: cut.midId, phase: 'assemble' })
    assert.equal(assembled.phase, 'assemble')
    const result = assembled.doc.nodes.find(node => node.id === assembled.resultId)
    assert.ok(typeof result.path === 'string' && existsSync(result.path))
    assert.equal(result.shotStatus, 'review')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('pack hard-cuts two clips onto a 成片 card', { skip: !hasFfmpeg }, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-pack-'))
  try {
    const a = makeVideo(dir, 'a.mp4')
    const b = makeVideo(dir, 'b.mp4')
    const store = new DirectorxCanvasStore(dir)
    await store.addNode({ kind: 'video', id: 'v1', label: '镜1', path: a, shotIndex: 1, x: 20, y: 20 })
    await store.addNode({ kind: 'video', id: 'v2', label: '镜2', path: b, shotIndex: 2, x: 320, y: 20 })
    const packed = await runCanvasCraft({ outputDir: dir, action: 'pack', nodeIds: ['v1', 'v2'], arrange: false })
    assert.equal(packed.action, 'pack')
    assert.ok(typeof packed.path === 'string' && existsSync(packed.path))
    const result = packed.doc.nodes.find(node => node.id === packed.resultId)
    assert.equal(result.kind, 'video')
    assert.match(result.label, /成片/)
    assert.ok(result.continuityRules.includes('成片'))
    assert.ok(packed.doc.nodes.every(node => node.shotStatus !== 'generating'))
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('sheet pins a contact image; split crops a still into cards', { skip: !hasFfmpeg }, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-sheet-'))
  try {
    const still = join(dir, 'hero.png')
    const painted = spawnSync('ffmpeg', ['-y', '-f', 'lavfi', '-i', 'testsrc=size=640x360:rate=1', '-frames:v', '1', still], { encoding: 'utf8' })
    assert.equal(painted.status, 0, painted.stderr?.slice(-200))
    const clip = makeVideo(dir, 'clip.mp4')
    const store = new DirectorxCanvasStore(dir)
    await store.addNode({ kind: 'image', id: 'hero', label: '设定表', path: still, x: 20, y: 20 })
    await store.addNode({ kind: 'video', id: 'clip', label: '镜1', path: clip, x: 320, y: 20 })
    const sheet = await runCanvasCraft({ outputDir: dir, action: 'sheet', nodeIds: ['hero', 'clip'], arrange: false })
    assert.equal(sheet.action, 'sheet')
    assert.ok(existsSync(sheet.path))
    assert.ok(sheet.doc.nodes.some(node => node.kind === 'image' && /接触表/.test(node.label)))

    const split = await runCanvasCraft({ outputDir: dir, action: 'split', nodeId: 'hero', cols: 2, rows: 2, arrange: false })
    assert.equal(split.action, 'split')
    assert.equal((split.files ?? []).length, 4)
    assert.ok((split.files ?? []).every(file => existsSync(file)))
    assert.ok(split.doc.nodes.some(node => node.kind === 'group' && /宫格/.test(node.label)))
    assert.equal(split.doc.nodes.filter(node => node.kind === 'image' && node.parent === split.groupId).length, 4)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('join tiles stills; stack splits two clips; extend parks a last-frame sibling', { skip: !hasFfmpeg }, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-board-'))
  try {
    const a = join(dir, 'a.png')
    const b = join(dir, 'b.png')
    for (const file of [a, b]) {
      const painted = spawnSync('ffmpeg', ['-y', '-f', 'lavfi', '-i', 'testsrc=size=320x180:rate=1', '-frames:v', '1', file], { encoding: 'utf8' })
      assert.equal(painted.status, 0, painted.stderr?.slice(-200))
    }
    const clip = makeVideo(dir, 'clip.mp4')
    const store = new DirectorxCanvasStore(dir)
    await store.addNode({ kind: 'image', id: 'ia', label: '格1', path: a, x: 20, y: 20 })
    await store.addNode({ kind: 'image', id: 'ib', label: '格2', path: b, x: 320, y: 20 })
    await store.addNode({ kind: 'video', id: 'v1', label: '镜1', path: clip, x: 20, y: 220 })
    const joined = await runCanvasCraft({ outputDir: dir, action: 'join', nodeIds: ['ia', 'ib'], arrange: false })
    assert.equal(joined.action, 'join')
    assert.ok(existsSync(joined.path))
    assert.ok(joined.doc.nodes.some(node => node.kind === 'image' && /分镜组/.test(node.label)))
    assert.ok(joined.doc.nodes.every(node => node.shotStatus !== 'generating'))

    const stacked = await runCanvasCraft({ outputDir: dir, action: 'stack', nodeIds: ['ia', 'v1'], layout: '2x1', arrange: false })
    assert.equal(stacked.action, 'stack')
    assert.ok(existsSync(stacked.path))
    assert.ok(stacked.doc.nodes.some(node => node.kind === 'video' && /分屏/.test(node.label)))

    const extended = await runCanvasCraft({ outputDir: dir, action: 'extend', nodeId: 'v1', arrange: false })
    assert.equal(extended.action, 'extend')
    const first = extended.doc.nodes.find(node => node.id === extended.firstId)
    const next = extended.doc.nodes.find(node => node.id === extended.resultId)
    assert.equal(first?.kind, 'image')
    assert.equal(next?.kind, 'video')
    assert.equal(next?.shotStatus, 'idea')
    assert.ok(next?.continuityRules?.some(rule => /续写/.test(rule)))
    assert.equal(next?.path, undefined)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('parseDesubRegion accepts side percentages', () => {
  const bottom = parseDesubRegion('bottom:15')
  assert.match(bottom.crop, /ih\*/)
})
