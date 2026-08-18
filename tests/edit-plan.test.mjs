import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import {
  commitBoundMedia, DirectorxCanvasStore, DirectorxEditLedger,
  imageProcess, mediaKindOf, planEdit, resolveBoundMedia,
} from '../lib/testing.js'

test('planEdit routes grade, geometry, cuts, and regenerate separately', () => {
  const grade = planEdit({ intent: '把这张照片调成末日荒土配色', kind: 'image', nodeId: 'image-1' })
  assert.equal(grade.route, 'studio')
  assert.equal(grade.tool, 'directorx_studio')
  assert.equal(grade.args.nodeId, 'image-1')

  const open = planEdit({ intent: '打开编辑台', kind: 'video', nodeId: 'video-1' })
  assert.equal(open.route, 'studio')
  assert.equal(open.args.openOnly, true)

  const flip = planEdit({ intent: '水平翻转这张图', kind: 'image', nodeId: 'image-1' })
  assert.equal(flip.route, 'image-edit')
  assert.equal(flip.tool, 'directorx_image_edit')
  assert.equal(flip.args.hflip, true)
  assert.equal(planEdit({ intent: '水平翻转这张图' }).route, 'image-edit')

  const trim = planEdit({ intent: '去掉开头 2 秒', kind: 'video', nodeId: 'video-1', path: '/tmp/a.mp4' })
  assert.equal(trim.route, 'video-process')
  assert.equal(trim.args.start, 2)

  const cuts = planEdit({ intent: '去掉开头 2 秒；只保留 3 到 10 秒', kind: 'video', path: '/tmp/a.mp4' })
  assert.equal(cuts.route, 'nl-cut')
  assert.equal(cuts.tool, 'directorx_edit')
  assert.ok(Array.isArray(cuts.args.edits))
  assert.equal(cuts.args.edits.length, 2)

  const blocked = planEdit({ intent: '重新生成一张换个画面', kind: 'image' })
  assert.equal(blocked.route, 'regenerate-blocked')
  assert.equal(blocked.tool, '')
  assert.ok(blocked.next.includes('directorx_generate_ready'))

  const qc = planEdit({ intent: '抽帧看看成片质检', kind: 'video' })
  assert.equal(qc.route, 'qc')
  assert.equal(qc.tool, 'directorx_extract_frames')
})

test('resolveBoundMedia reads node path and commitBoundMedia writes path only', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-bind-'))
  try {
    const file = join(dir, 'still.png')
    await writeFile(file, 'png')
    const canvas = new DirectorxCanvasStore(dir)
    await canvas.addNode({ id: 'image-1', kind: 'image', label: '镜头1', path: file, prompt: '荒野' })
    const bound = await resolveBoundMedia({ canvas, outputDir: dir, nodeId: 'image-1' })
    assert.equal(bound.path, file)
    assert.equal(bound.kind, 'image')
    assert.equal(bound.label, '镜头1')

    const next = join(dir, 'edited.png')
    await writeFile(next, 'png2')
    const ledger = new DirectorxEditLedger(dir)
    const commit = await commitBoundMedia({ canvas, ledger, nodeId: 'image-1', path: next, mediaType: 'image/png' })
    assert.equal(commit.written, true)
    const found = await canvas.getNode('image-1')
    assert.equal(found.kind, 'node')
    assert.equal(found.node.path, next)
    assert.equal(found.node.label, '镜头1')
    const listed = await ledger.list(5)
    assert.equal(listed[0].path, next)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

const hasFfmpeg = spawnSync('which', ['ffmpeg'], { encoding: 'utf8' }).status === 0

test('imageProcess rotates a still and swaps width/height', { skip: !hasFfmpeg }, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-image-edit-'))
  try {
    const source = join(dir, 'src.png')
    const make = spawnSync('ffmpeg', ['-hide_banner', '-y', '-f', 'lavfi', '-i', 'color=c=red:s=64x32', '-frames:v', '1', source], { encoding: 'utf8' })
    assert.equal(make.status, 0, make.stderr?.slice(-200))
    const out = await imageProcess({ source, outputDir: dir, rotate: 90 })
    assert.ok(out.path.endsWith('.png'))
    assert.ok(out.ops.includes('rotate-90'))
    const video = out.probe.streams.find(stream => stream.type === 'video')
    assert.equal(video?.width, 32)
    assert.equal(video?.height, 64)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('imageProcess refuses an empty op list', async () => {
  await assert.rejects(() => imageProcess({ source: '/tmp/missing.png', outputDir: tmpdir() }), /不存在|没有可执行/)
})

test('session media classifies agent edit tools', () => {
  assert.equal(mediaKindOf('out.png', undefined, 'directorx_image_edit'), 'image')
  assert.equal(mediaKindOf('out.mp4', undefined, 'directorx_edit'), 'video')
  assert.equal(mediaKindOf('out.mp4', undefined, 'directorx_video_process'), 'video')
})
