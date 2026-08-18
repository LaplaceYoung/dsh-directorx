import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  BLOCKING_STAMP, CharacterStore, parseBeats, buildTicks, runBlocking, pinBlocking,
} from '../lib/testing.js'

test('parseBeats splits arrows and numbered lines', () => {
  const beats = parseBeats('1. 白15篮板 → 白4接球\n白4一传 白11\nT3：白8扣篮')
  assert.deepEqual(beats.slice(0, 3), ['白15篮板', '白4接球', '白4一传 白11'])
  assert.ok(beats.includes('白8扣篮'))
})

test('buildTicks puts start at T0 and last beat at duration', () => {
  const ticks = buildTicks({
    start: '黑2出手不中',
    beats: ['白15篮板', '白8扣篮'],
    durationSec: 15,
  })
  assert.equal(ticks[0].id, 'T0')
  assert.equal(ticks[0].atSec, 0)
  assert.match(ticks[0].line, /黑2出手不中/)
  assert.equal(ticks.at(-1)?.atSec, 15)
  assert.match(ticks.at(-1)?.line ?? '', /白8扣篮/)
})

test('runBlocking harvest / schema / pin writes a 场面锁 card', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dx-blocking-'))
  try {
    await new CharacterStore(dir).register({
      name: '白15',
      description: '中锋',
      refPath: 'white-15.png',
    })
    const harvest = await runBlocking({ outputDir: dir, action: 'harvest' })
    assert.equal(harvest.action, 'harvest')
    assert.ok(Array.isArray(harvest.roster))

    const schema = await runBlocking({
      outputDir: dir,
      action: 'schema',
      start: '黑2出手不中',
      beats: '白15篮板 → 白4短传 → 白11长传 → 白8扣篮',
      durationSec: 15,
    })
    assert.equal(schema.ask, false)
    assert.ok(schema.ticks.some(tick => tick.id === 'T0'))
    assert.ok(schema.sections.includes('场面台账'))
    assert.ok(schema.priority[0].includes('场面台账'))

    const markdown = [
      '# 场面控制表',
      '',
      '## 场面台账',
      'T0 0.0s｜黑2出手不中｜BALL 在黑2｜CAM 边线外',
      'T1 4.0s｜白15篮板，全员在左侧半场',
      'T2 8.0s｜白4短传后空手，唯一的球在空中',
      'T3 12.0s｜白11长传，白4不再持球',
      'T4 15.0s｜白8扣篮，球进网后自然落地',
      '',
      '## 物件状态机',
      '同时只有一个球、一个持有者。白4传球后空手，不得再持球。',
      '白11接球前不得开始新的运球。出画的人按台账轨道回来，禁止换脸。',
    ].join('\n')
    const pin = await runBlocking({ outputDir: dir, action: 'pin', markdown })
    assert.equal(pin.action, 'pin')
    assert.equal(pin.nodeId, 'blocking-sheet')

    const show = await runBlocking({ outputDir: dir, action: 'show' })
    assert.equal(show.found, true)
    assert.match(show.markdown, /场面台账/)
    assert.match(show.markdown, /T0/)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('pinBlocking refuses an empty skeleton', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dx-blocking-empty-'))
  try {
    await assert.rejects(
      () => pinBlocking({ outputDir: dir, markdown: '太短' }),
      /太短|场面台账/,
    )
    void BLOCKING_STAMP
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
