import test from 'node:test'
import assert from 'node:assert/strict'
import { formatCanvasShotlist, durationFromPrompt } from '../lib/testing.js'

test('durationFromPrompt reads a seconds token from the prompt', () => {
  assert.equal(durationFromPrompt('hold 8s then cut', 5), 8)
  assert.equal(durationFromPrompt('no timing here', 5), 5)
})

test('formatCanvasShotlist numbers media nodes and reports the duration budget', () => {
  const board = formatCanvasShotlist({
    version: 1,
    updatedAt: 1,
    title: 'rain alley',
    nodes: [
      { id: 'g1', kind: 'group', label: 'act 1', x: 0, y: 0 },
      { id: 'n2', kind: 'video', label: 'follow', prompt: 'rain alley follow, 6s', shotIndex: 2, shotStatus: 'approved', continuityRules: ['red scarf'], x: 10, y: 10 },
      { id: 'n1', kind: 'image', label: 'establishing', prompt: 'wide street 4s', shotIndex: 1, shotStatus: 'idea', x: 0, y: 0 },
      { id: 't', kind: 'text', label: 'note', x: 1, y: 1 },
    ],
    edges: [],
  }, { targetSeconds: 30 })
  assert.equal(board.title, 'rain alley')
  assert.equal(board.rows.length, 2)
  assert.equal(board.rows[0].id, 'n1')
  assert.equal(board.rows[0].index, 1)
  assert.equal(board.rows[0].durationSec, 4)
  assert.equal(board.rows[1].id, 'n2')
  assert.equal(board.rows[1].continuity[0], 'red scarf')
  assert.equal(board.totalDurationSec, 10)
  assert.equal(board.remainingSeconds, 20)
  assert.match(board.markdown, /# rain alley/)
  assert.match(board.markdown, /Shot 1/)
  assert.match(board.markdown, /target 30s/)
  assert.doesNotMatch(board.markdown, /note/)
})
