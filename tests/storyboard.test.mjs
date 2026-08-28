import test from 'node:test'
import assert from 'node:assert/strict'
import { validateMvStoryboard } from '../lib/testing.js'

test('validateMvStoryboard accepts contiguous narrative/performance segments', () => {
  const result = validateMvStoryboard({
    characters: ['hero'], scenes: ['street'], segments: [
      { id: 'a', start: 0, duration: 5, type: 'narrative', characters: ['hero'], scene: 'street' },
      { id: 'b', start: 5, duration: 4, type: 'performance', characters: ['hero'], scene: 'street' },
    ],
  })
  assert.equal(result.ok, true)
  assert.equal(result.totalSeconds, 9)
})

test('validateMvStoryboard reports gaps, invalid references, and consecutive performance', () => {
  const result = validateMvStoryboard({
    characters: ['hero'], scenes: ['street'], segments: [
      { id: 'a', start: 1, duration: 2, type: 'performance', characters: ['unknown'], scene: 'missing' },
      { id: 'b', start: 2, duration: 16, type: 'performance', characters: ['hero'], scene: 'street' },
    ],
  })
  assert.equal(result.ok, false)
  assert.ok(result.errors.some(error => error.includes('contiguous')))
  assert.ok(result.errors.some(error => error.includes('unknown character')))
  assert.ok(result.errors.some(error => error.includes('performance segments cannot be consecutive')))
})
