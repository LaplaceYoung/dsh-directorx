import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  buildIpBrief, commitIpRewrite, keepSpans, preflight, scanIpRisk, IpMemoryStore,
} from '../lib/testing.js'

test('scanIpRisk flags Spider-Man without a canned replacement', () => {
  const hits = scanIpRisk('蜘蛛侠在楼宇间摆荡')
  assert.equal(hits.length, 1)
  assert.equal(hits[0].kind, 'character')
  assert.equal(hits[0].replace, undefined)
  assert.ok(hits[0].axes.some(axis => /原型|服装/.test(axis)))
  assert.ok(hits[0].exclude.some(item => /蜘蛛侠|spiderman/i.test(item)))
  const keep = keepSpans('蜘蛛侠在楼宇间摆荡', hits)
  assert.deepEqual(keep, ['在楼宇间摆荡'])
})

test('buildIpBrief orchestrates method, keep, and negatives — not a stamped phrase', () => {
  const brief = buildIpBrief('蜘蛛侠在楼宇间摆荡')
  assert.equal(brief.dirty, true)
  assert.match(brief.agentPrompt, /在楼宇间摆荡/)
  assert.match(brief.agentPrompt, /泛化/)
  assert.match(brief.agentPrompt, /2406\.14526/)
  assert.doesNotMatch(brief.agentPrompt, /红色头罩和紧身连体衣/)
  assert.match(brief.negativeLine, /蜘蛛侠/)
  assert.ok(brief.knowledge.includes('213'))
})

test('scanIpRisk is case-insensitive for English marks', () => {
  const hits = scanIpRisk('a Spider-Man rooftop chase')
  assert.equal(hits.length, 1)
  assert.equal(hits[0].kind, 'character')
})

test('combo triggers without naming the IP', () => {
  const hits = scanIpRisk('黄皮电气老鼠在草地上跑')
  assert.ok(hits.some(hit => hit.kind === 'combo'))
})

test('preflight rights gate returns a method brief, not a rewritten stamp', () => {
  const out = preflight({
    prompt: '蜘蛛侠在雨夜城市奔跑，逆光电影感，不要水印',
    type: 'video',
    size: '16:9',
    duration: 5,
    userConfirmedBudget: true,
    userConfirmedContent: true,
  })
  assert.equal(out.verdict, 'review')
  assert.ok(out.gates.rights.issues.some(issue => issue.includes('蜘蛛侠')))
  assert.equal(out.ip?.dirty, true)
  assert.equal(out.ip?.rewritten, undefined)
  assert.match(out.ip?.brief.agentPrompt ?? '', /属性轴|泛化/)
  assert.doesNotMatch(out.ip?.brief.agentPrompt ?? '', /红色头罩和紧身连体衣/)
})

test('ip rewrite commits project memory and recalls it next time', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-ipm-'))
  try {
    const rewrite = '雨夜都市里一名穿红黑弹性连体衣、面罩只留眼缝的青年在楼宇间摆荡，胸口是几何线纹而不是商标，湿沥青反光，低机位跟随。'
    const first = await commitIpRewrite(dir, {
      source: '蜘蛛侠在楼宇间摆荡',
      rewrite,
    })
    assert.equal(first.ok, true)
    assert.ok(first.saved)
    assert.equal(first.saved.uses, 1)

    const store = new IpMemoryStore(dir)
    const recalled = await store.recall('spiderman rooftop')
    assert.ok(recalled.length >= 1)
    assert.match(recalled[0].rewrite, /红黑弹性连体衣/)

    const again = await commitIpRewrite(dir, {
      source: '蜘蛛侠雨夜追车',
      rewrite: `${rewrite} 摩托车尾灯拉出一条红线。`,
    })
    assert.equal(again.ok, true)
    assert.equal(again.saved.uses, 2)

    const dirty = await commitIpRewrite(dir, {
      source: '蜘蛛侠在楼宇间摆荡',
      rewrite: '蜘蛛侠继续摆荡',
    })
    assert.equal(dirty.ok, false)
    assert.equal(dirty.refused, true)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
