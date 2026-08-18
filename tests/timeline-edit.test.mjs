import test from 'node:test'
import assert from 'node:assert/strict'
import {
  clipPlayDuration, clipStarts, duplicateClip, exportBitrate, exportSize, fromSource, hitTest,
  moveClip, moveTo, removeClip, sequenceDuration, splitAt, tickStep, trimClip,
} from '../lib/testing.js'

function clip(id, sourceIn, sourceOut, speed = 1) {
  return { id, sourceIn, sourceOut, speed, fadeIn: 0, fadeOut: 0, muted: false }
}

test('sequence duration respects speed and play order', () => {
  const clips = [clip(1, 0, 4), clip(2, 4, 6, 2)]
  assert.equal(sequenceDuration(clips), 5)
  assert.deepEqual(clipStarts(clips), [0, 4])
  assert.equal(clipPlayDuration(clips[1]), 1)
})

test('hitTest maps sequence time back onto the source', () => {
  const clips = [clip(1, 0, 2), clip(2, 8, 10)]
  const first = hitTest(clips, 1)
  assert.equal(first?.clip.id, 1)
  assert.equal(first?.sourceTime, 1)
  const second = hitTest(clips, 2.5)
  assert.equal(second?.clip.id, 2)
  assert.equal(second?.sourceTime, 8.5)
})

test('splitAt / removeClip / moveClip / duplicateClip edit the sequence', () => {
  const base = fromSource(4)
  const split = splitAt(base, 1.5, 2)
  assert.equal(split.length, 2)
  assert.equal(split[0].sourceOut, 1.5)
  assert.equal(split[1].sourceIn, 1.5)
  const removed = removeClip(split, 1)
  assert.equal(removed.length, 1)
  assert.equal(removed[0].id, 2)
  const moved = moveClip([clip(1, 0, 1), clip(2, 1, 2), clip(3, 2, 3)], 3, -1)
  assert.deepEqual(moved.map(item => item.id), [1, 3, 2])
  assert.deepEqual(moveTo(moved, 1, 2).map(item => item.id), [3, 2, 1])
  const dup = duplicateClip(split, 1, 9)
  assert.equal(dup.length, 3)
  assert.equal(dup[1].id, 9)
  assert.equal(dup[1].sourceOut, 1.5)
})

test('trimClip clamps to the sibling edge of the same clip', () => {
  const clips = trimClip([clip(1, 0, 4)], 1, 'in', 1.2, 4)
  assert.equal(clips[0].sourceIn, 1.2)
  const out = trimClip(clips, 1, 'out', 10, 4)
  assert.equal(out[0].sourceOut, 4)
})

test('export size and bitrate presets stay even and ranked', () => {
  assert.deepEqual(exportSize(1920, 1080, '720'), { width: 1280, height: 720 })
  assert.equal(exportSize(1281, 721, 'orig').width % 2, 0)
  assert.ok(exportBitrate('high') > exportBitrate('standard'))
  assert.ok(exportBitrate('standard') > exportBitrate('draft'))
  assert.equal(tickStep(200), 0.5)
  assert.equal(tickStep(30), 5)
})
