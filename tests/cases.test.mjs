import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { matchProductionCase, PRODUCTION_CASE_IDS, ProposalStore, runProductionCase } from '../lib/testing.js'

const REQUESTS = {
  'mossland-promo': '为上海模思的mossland制作宣传片',
  'luxun-zhufu': '改编鲁迅的小说祝福为半小时ai电视剧',
  'kimi-k3-remake': '拉片分析kimi-k3的宣传片并且把宣传的主体替换为moss智能进行复刻宣传片',
}

test('the three production requests match distinct cases', () => {
  assert.deepEqual(PRODUCTION_CASE_IDS.slice().sort(), ['kimi-k3-remake', 'luxun-zhufu', 'mossland-promo'])
  assert.equal(matchProductionCase(REQUESTS['mossland-promo']), 'mossland-promo')
  assert.equal(matchProductionCase(REQUESTS['luxun-zhufu']), 'luxun-zhufu')
  assert.equal(matchProductionCase(REQUESTS['kimi-k3-remake']), 'kimi-k3-remake')
  assert.equal(matchProductionCase('随便剪一段猫视频'), null)
})

for (const [id, request] of Object.entries(REQUESTS)) {
  test(`case ${id} completes research, confirm, and placeholders without generating`, async () => {
    const dir = await mkdtemp(join(tmpdir(), `directorx-case-${id}-`))
    try {
      const run = await runProductionCase({ request, outputDir: dir })
      assert.equal(run.id, id)
      assert.equal(run.generated, false)
      assert.ok(run.stages.length >= 4)
      const names = run.stages.map(stage => stage.name)
      assert.ok(names.includes('析'))
      assert.ok(names.includes('研'))
      assert.ok(names.includes('问'))
      assert.ok(names.includes('位'))
      const toolNames = run.stages.flatMap(stage => stage.tools.map(tool => tool.name))
      assert.ok(toolNames.includes('directorx_brief'))
      assert.ok(toolNames.includes('directorx_knowledge_search'))
      assert.ok(toolNames.includes('directorx_propose'))
      assert.ok(toolNames.includes('directorx_case_confirm'))
      assert.equal(toolNames.some(name => /generate_/.test(name)), false)
      assert.ok(run.research.length >= 3, 'external research pack must land')
      assert.ok(run.confirms.length >= 2)
      assert.ok(run.placeholders.length >= 8)
      for (const placeholder of run.placeholders) {
        assert.ok(placeholder.prompt.trim().length > 20)
        assert.ok(placeholder.model.length > 0)
        assert.ok(placeholder.size.length > 0)
        assert.ok(placeholder.task.length > 0)
        if (placeholder.kind === 'video') {
          assert.ok((placeholder.duration ?? 0) >= 4)
          assert.ok((placeholder.duration ?? 0) <= 15)
        }
      }
      assert.ok(run.durationBudget.reduce((sum, block) => sum + block.seconds, 0) > 0)
      const report = JSON.parse(await readFile(run.reportPath, 'utf8'))
      assert.equal(report.generated, false)
      const queued = await new ProposalStore(dir).list()
      assert.equal(queued.length, run.placeholders.length)
      assert.ok(queued.every(item => item.status === 'proposed'))
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
}
