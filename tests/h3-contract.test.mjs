import test from 'node:test'
import assert from 'node:assert/strict'
import {
  clampH3Duration,
  clipH3Prompt,
  h3CraftLooksReady,
  h3Resolution,
  h3SkipReferences,
  inferH3PromptMode,
  isH3Model,
  limitH3Refs,
  normalizeH3Prompt,
} from '../lib/testing.js'

test('H3 contract matches official handbook spec', () => {
  assert.equal(clampH3Duration(3), 4)
  assert.equal(clampH3Duration(20), 15)
  assert.equal(clampH3Duration(8), 8)
  assert.equal(h3Resolution('2K'), '1440p')
  assert.equal(h3Resolution('768p'), '768p')
  assert.equal(h3SkipReferences('/tmp/a.png', undefined), true)
  assert.equal(h3SkipReferences(undefined, undefined), false)
  assert.deepEqual(limitH3Refs(Array.from({ length: 12 }, (_, i) => `p${i}`)).length, 9)
  assert.ok(isH3Model('MiniMax-H3', 'modelverse-tasks'))
  assert.equal(isH3Model('kling-v3', 'kling'), false)
  const long = 'x'.repeat(8000)
  const clipped = clipH3Prompt(long)
  assert.equal(clipped.clipped, true)
  assert.equal(clipped.prompt.length, 7000)
})

test('H3 prompt normalize adds official alignment and music lock', () => {
  const fl = normalizeH3Prompt('integrated_multimodal_description: [Shot 1] Cinematic, the blade starts to move.', {
    mode: 'fl2v',
    seconds: 5,
  })
  assert.match(fl.prompt, /Picture 1 \(from Shot 1\) aligns with the 0.00-second mark/)
  assert.match(fl.prompt, /5\.00-second mark/)
  assert.match(fl.prompt, /non_diegetic_music:\s*N\/A/)
  const cutty = normalizeH3Prompt('[Shot 1] start. [Shot 2] the camera cuts to a close-up.', { mode: 'fl2v', seconds: 6 })
  assert.match(cutty.prompt, /single continuous shot/)
  const i2v = normalizeH3Prompt('[Shot 1] Live-action, the eye opens.', { mode: 'i2v' })
  assert.match(i2v.prompt, /fully referenced/)
  assert.equal(inferH3PromptMode({ firstFrame: 'a.png', lastFrame: 'b.png' }), 'fl2v')
  assert.ok(h3CraftLooksReady('短'))
  assert.equal(h3CraftLooksReady('[Shot 1] Cinematic, 35mm, a wide shot of the hanging iron city as the orbital rail splits a rust-red seam and lanterns shake.'), undefined)
})
