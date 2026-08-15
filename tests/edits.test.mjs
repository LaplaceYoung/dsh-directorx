import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DirectorxEditLedger, mediaTypeExt } from '../lib/testing.js'

test('edit ledger appends and lists newest-first with a bound', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-edits-'))
  try {
    const ledger = new DirectorxEditLedger(dir)
    assert.deepEqual(await ledger.list(), [])
    for (const index of [1, 2, 3]) {
      await ledger.append({
        at: 1000 + index,
        path: `/tmp/out/edited/e${index}.png`,
        mediaType: 'image/png',
        bytes: index * 10,
        name: `e${index}.png`,
      })
    }
    const listed = await ledger.list(10)
    assert.equal(listed.length, 3)
    assert.equal(listed[0].name, 'e3.png')
    assert.equal((await ledger.list(2)).length, 2)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('mediaTypeExt maps supported editor exports and rejects the rest', () => {
  assert.equal(mediaTypeExt('image/png'), 'png')
  assert.equal(mediaTypeExt('image/jpeg; charset=binary'), 'jpg')
  assert.equal(mediaTypeExt('video/mp4'), 'mp4')
  assert.equal(mediaTypeExt('video/webm'), 'webm')
  assert.equal(mediaTypeExt('audio/mpeg'), 'mp3')
  assert.equal(mediaTypeExt('application/pdf'), undefined)
  assert.equal(mediaTypeExt(''), undefined)
})
