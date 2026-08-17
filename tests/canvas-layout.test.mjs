import test from 'node:test'
import assert from 'node:assert/strict'
import {
  alignBoxes, asClipPayload, characterBucket, clampMenu, distributeBoxes, incomingRefIds, libraryBucket,
  nearestAspect, nudgeBoxes, packClip, sizeFromAspect, specPrompt, takePeers,
} from '../lib/testing.js'

const boxes = [
  { id: 'a', x: 0, y: 10, w: 100, h: 40 },
  { id: 'b', x: 80, y: 50, w: 40, h: 40 },
  { id: 'c', x: 200, y: 0, w: 60, h: 80 },
]

test('alignBoxes snaps a set to a shared edge or center', () => {
  const left = alignBoxes(boxes, 'left')
  assert.ok(left.every(box => box.x === 0))
  const right = Object.fromEntries(alignBoxes(boxes, 'right').map(box => [box.id, box.x]))
  assert.equal(right.a, 160)
  assert.equal(right.c, 200)
  const mid = Object.fromEntries(alignBoxes(boxes, 'middle').map(box => [box.id, box.y]))
  assert.equal(mid.a, 25)
})

test('distributeBoxes spaces three or more boxes along an axis', () => {
  const across = Object.fromEntries(distributeBoxes(boxes, 'x').map(box => [box.id, Math.round(box.x)]))
  assert.equal(across.a, 0)
  assert.equal(across.c, 200)
  assert.ok(across.b > 0 && across.b < 200)
})

test('nudgeBoxes offsets every member', () => {
  assert.deepEqual(nudgeBoxes(boxes.slice(0, 1), 12, -4), [{ id: 'a', x: 12, y: 6 }])
})

test('packClip and asClipPayload round-trip selected nodes and inner edges', () => {
  const packed = packClip(
    [
      { id: 'n1', type: 'media', position: { x: 40, y: 20 }, style: { width: 200, height: 120 }, data: { kind: 'image', label: 'A', path: 'a.png' } },
      { id: 'n2', type: 'media', position: { x: 80, y: 80 }, data: { kind: 'video', label: 'B', prompt: 'cut' } },
    ],
    [
      { source: 'n1', target: 'n2', label: '转' },
      { source: 'n1', target: 'outside' },
    ],
  )
  assert.equal(packed.mark, 'directorx-canvas-clip')
  assert.equal(packed.nodes[0].x, 0)
  assert.equal(packed.nodes[0].y, 0)
  assert.equal(packed.nodes[1].x, 40)
  assert.deepEqual(packed.edges, [{ from: 0, to: 1, label: '转' }])
  const again = asClipPayload(JSON.parse(JSON.stringify(packed)))
  assert.equal(again?.nodes.length, 2)
  assert.equal(asClipPayload({ mark: 'nope', nodes: packed.nodes }), undefined)
})

test('sizeFromAspect and specPrompt encode workstation fields', () => {
  assert.equal(sizeFromAspect('16:9', 320).height, 180)
  assert.equal(sizeFromAspect('1:1', 320).height, 320)
  const portrait = sizeFromAspect('9:16', 400)
  assert.ok(portrait.height <= 380)
  assert.ok(portrait.width < portrait.height)
  const text = specPrompt({ kind: 'video', prompt: '雨巷', model: 'MiniMax-H3', aspect: '9:16', count: 2, durationSec: 5 })
  assert.match(text, /模型: MiniMax-H3/)
  assert.match(text, /画幅: 9:16/)
  assert.match(text, /次数: 2/)
  assert.match(text, /时长: 5s/)
})

test('nearestAspect picks the closest frame and incomingRefIds stay unique', () => {
  assert.equal(nearestAspect(320, 180), '16:9')
  assert.equal(nearestAspect(180, 320), '9:16')
  assert.deepEqual(incomingRefIds('b', [{ source: 'a', target: 'b' }, { source: 'a', target: 'b' }, { source: 'c', target: 'd' }]), ['a'])
})

test('takePeers groups siblings by parent, shared source, and prompt', () => {
  const nodes = [
    { id: 'a', parentId: 'g', type: 'media', prompt: '雨巷' },
    { id: 'b', parentId: 'g', type: 'media', prompt: '雨巷' },
    { id: 'c', type: 'media', prompt: '雨巷' },
    { id: 'd', type: 'media', prompt: '别的' },
  ]
  const edges = [{ source: 'src', target: 'c' }, { source: 'src', target: 'd' }]
  assert.deepEqual(takePeers({ id: 'a', parentId: 'g', prompt: '雨巷' }, nodes, edges).sort(), ['b', 'c'])
  assert.ok(takePeers({ id: 'c', prompt: '雨巷' }, nodes, edges).includes('d'))
})

test('libraryBucket and characterBucket split the subject library', () => {
  assert.equal(libraryBucket({ name: 'scene-alley.png', path: '/out/scene-alley.png' }), 'scene')
  assert.equal(libraryBucket({ name: 'hero.png', path: '/out/hero.png' }), 'media')
  assert.equal(characterBucket({ props: '旧皮箱' }), 'prop')
  assert.equal(characterBucket({ description: '场景 · 雨巷' }), 'scene')
  assert.equal(characterBucket({ description: '短发女孩' }), 'character')
})

test('clampMenu keeps a menu inside the viewport', () => {
  assert.deepEqual(clampMenu(2000, 2000, 200, 160, { w: 800, h: 600 }), { left: 588, top: 428 })
  assert.deepEqual(clampMenu(-20, 8, 200, 160, { w: 800, h: 600 }), { left: 12, top: 12 })
})
