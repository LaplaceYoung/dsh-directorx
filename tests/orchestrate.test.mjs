import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { extractEntities, inferProductionKind, orchestrateProduction, parseDurationSeconds, ProposalStore } from '../lib/testing.js'

test('kind and entities are derived from the request, not a job catalog', () => {
  assert.equal(inferProductionKind('为上海模思的mossland制作宣传片'), 'promo')
  assert.equal(inferProductionKind('给字节跳动的豆包制作品牌宣传片'), 'promo')
  assert.equal(inferProductionKind('改编鲁迅的小说祝福为半小时ai电视剧'), 'literary')
  assert.equal(inferProductionKind('改编老舍的骆驼祥子为二十分钟短剧'), 'literary')
  assert.equal(inferProductionKind('拉片分析kimi-k3的宣传片并且把宣传的主体替换为moss智能进行复刻宣传片'), 'remake')
  assert.equal(inferProductionKind('拉片分析苹果发布会视频并把主体替换成我们的产品'), 'remake')
  assert.equal(parseDurationSeconds('半小时'), 1800)
  assert.equal(parseDurationSeconds('二十分钟'), 1200)

  const moss = extractEntities('为上海模思的mossland制作宣传片', 'promo', 75, '16:9')
  assert.equal(moss.brand, '上海模思')
  assert.match(moss.product ?? '', /mossland/i)

  const doubao = extractEntities('给字节跳动的豆包制作品牌宣传片', 'promo', 75, '16:9')
  assert.equal(doubao.brand, '字节跳动')
  assert.equal(doubao.product, '豆包')

  const zhufu = extractEntities('改编鲁迅的小说祝福为半小时ai电视剧', 'literary', 30, '16:9')
  assert.equal(zhufu.author, '鲁迅')
  assert.equal(zhufu.sourceTitle, '祝福')
  assert.equal(zhufu.targetSeconds, 1800)

  const xiangzi = extractEntities('改编老舍的骆驼祥子为二十分钟短剧', 'literary', 60, '16:9')
  assert.equal(xiangzi.author, '老舍')
  assert.equal(xiangzi.sourceTitle, '骆驼祥子')
  assert.equal(xiangzi.targetSeconds, 1200)

  const kimi = extractEntities('拉片分析kimi-k3的宣传片并且把宣传的主体替换为moss智能进行复刻宣传片', 'remake', 45, '16:9')
  assert.match(kimi.sourceClip ?? '', /kimi-k3/)
  assert.match(kimi.replaceSubject ?? '', /moss智能/)
})

const ACCEPTANCE = [
  {
    request: '为上海模思的mossland制作宣传片',
    kind: 'promo',
    mustMention: ['mossland', '模思'],
  },
  {
    request: '改编鲁迅的小说祝福为半小时ai电视剧',
    kind: 'literary',
    mustMention: ['祝福', '鲁迅'],
  },
  {
    request: '拉片分析kimi-k3的宣传片并且把宣传的主体替换为moss智能进行复刻宣传片',
    kind: 'remake',
    mustMention: ['moss智能', 'kimi-k3'],
  },
  {
    request: '给字节跳动的豆包制作品牌宣传片',
    kind: 'promo',
    mustMention: ['豆包', '字节'],
  },
  {
    request: '改编老舍的骆驼祥子为二十分钟短剧',
    kind: 'literary',
    mustMention: ['骆驼祥子', '老舍'],
  },
]

for (const example of ACCEPTANCE) {
  test(`orchestrate "${example.request}" derives ${example.kind} placeholders without generating`, async () => {
    const dir = await mkdtemp(join(tmpdir(), 'directorx-orch-'))
    try {
      const run = await orchestrateProduction({ request: example.request, outputDir: dir })
      assert.equal(run.kind, example.kind)
      assert.equal(run.generated, false)
      const names = run.stages.map(stage => stage.name)
      assert.ok(names.includes('析') && names.includes('研') && names.includes('问') && names.includes('位'))
      const tools = run.stages.flatMap(stage => stage.tools.map(item => item.name))
      assert.ok(tools.includes('directorx_brief'))
      assert.ok(tools.includes('directorx_knowledge_search'))
      assert.ok(tools.includes('directorx_propose'))
      assert.equal(tools.some(name => /generate_/.test(name)), false)
      assert.ok(run.placeholders.length >= 6)
      const blob = `${run.title}\n${run.placeholders.map(item => item.prompt + item.task + item.note).join('\n')}`
      for (const token of example.mustMention) {
        assert.match(blob, new RegExp(token, 'i'))
      }
      if (example.kind === 'promo' && example.request.includes('豆包')) {
        assert.doesNotMatch(blob, /mossland/i)
      }
      if (example.kind === 'literary' && example.request.includes('骆驼祥子')) {
        assert.doesNotMatch(blob, /祝福/)
        assert.doesNotMatch(blob, /祥林嫂/)
      }
      for (const placeholder of run.placeholders) {
        assert.ok(placeholder.prompt.trim().length > 12)
        assert.ok(placeholder.model.length > 0)
      }
      const queued = await new ProposalStore(dir).list()
      assert.equal(queued.length, run.placeholders.length)
      JSON.parse(await readFile(run.reportPath, 'utf8'))
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
}
