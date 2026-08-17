import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { brief, composeKindFromBriefType, composeProductionFlow } from '../lib/testing.js'

test('compose maps brief types to recipes without a single mandatory entry', () => {
  assert.equal(composeKindFromBriefType('广告/宣传'), 'promo')
  assert.equal(composeKindFromBriefType('改编/长剧'), 'literary')
  assert.equal(composeKindFromBriefType('拉片/复刻'), 'remake')
  const promo = composeProductionFlow({ type: '广告/宣传', request: '给字节跳动的豆包制作品牌宣传片' })
  assert.equal(promo.recipe, 'recipes/promo-video.md')
  assert.ok(promo.stages.some(stage => stage.name === '研'))
  assert.ok(promo.stages.some(stage => stage.name === '问'))
  assert.ok(promo.stages.some(stage => stage.tools.includes('directorx_propose')))
  assert.ok(promo.stages.some(stage => stage.tools.includes('directorx_canvas_shotlist')))
  assert.ok(promo.stages.some(stage => stage.tools.includes('directorx_confirm')))
  assert.ok(promo.nextActions.some(line => line.includes('可选加速')))
  assert.ok(!promo.stages.flatMap(stage => stage.tools).includes('directorx_orchestrate'))
  assert.deepEqual([...new Set(promo.stages.map(stage => stage.phase))].sort(), ['create', 'plan', 'refine'])
})

test('literary and remake compose different recipes from generic wording', () => {
  const literary = composeProductionFlow({ type: '改编/长剧', request: '改编老舍的骆驼祥子为二十分钟短剧' })
  assert.equal(literary.kind, 'literary')
  assert.equal(literary.recipe, 'recipes/novel-adaptation.md')
  assert.ok(literary.stages.some(stage => stage.name === '角色'))
  assert.ok(literary.stages.some(stage => stage.name === '大纲'))

  const remake = composeProductionFlow({ type: '拉片/复刻', request: '拉片分析苹果发布会视频并把主体替换成我们的产品' })
  assert.equal(remake.kind, 'remake')
  assert.equal(remake.recipe, 'recipes/remake-subject.md')
  assert.ok(remake.stages.some(stage => stage.name === '拉片'))
  assert.ok(remake.nextActions.join('\n').includes('directorx_propose'))
})

test('brief.compose is the path the agent follows', async () => {
  const out = await brief({
    request: '给字节跳动的豆包制作品牌宣传片',
    outputDir: await mkdtemp(join(tmpdir(), 'directorx-compose-')),
  })
  assert.equal(out.compose.kind, 'promo')
  assert.ok(out.nextActions.some(line => line.includes('recipes/promo-video.md')))
  assert.ok(out.nextActions.some(line => line.includes('directorx_propose')))
  assert.ok(out.nextActions.some(line => line.includes('directorx_canvas_shotlist')))
  assert.ok(!out.nextActions.some(line => line.includes('directorx-workflow')))
})
