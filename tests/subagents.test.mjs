import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, resolve } from 'node:path'
import { preflight, registerSubagentSetup } from '../lib/testing.js'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))

test('subagent setup contribution installs guidance and skill into child contexts', () => {
  let contribution
  let removed = false
  const subagents = {
    registerContinuableSetup(candidate) {
      contribution = candidate
      return () => {
        contribution = undefined
        removed = true
      }
    },
  }
  const events = []
  const childCtx = {
    get(name) {
      if (name === 'systemPrompt') {
        return { section: section => { events.push(['section', section.name]); return () => events.push(['un-section', section.name]) } }
      }
      if (name === 'skills') {
        return { register: skill => { events.push(['skill', skill.name]); return () => events.push(['un-skill', skill.name]) } }
      }
      return undefined
    },
  }

  const dispose = registerSubagentSetup({ get: name => (name === 'subagents' ? subagents : undefined) })
  assert.equal(typeof contribution, 'function')
  const childDispose = contribution(childCtx)
  assert.deepEqual(events, [
    ['section', 'tool:directorx-subagent'],
    ['skill', 'directorx-subagent-orchestration'],
  ])

  childDispose()
  assert.deepEqual(events.slice(2), [
    ['un-skill', 'directorx-subagent-orchestration'],
    ['un-section', 'tool:directorx-subagent'],
  ])

  dispose()
  assert.equal(removed, true)
})

test('subagent setup is a no-op without the subagents service', () => {
  const dispose = registerSubagentSetup({ get: () => undefined })
  assert.equal(typeof dispose, 'function')
  dispose()
})

test('preflight audits the four generation gates deterministically', () => {
  const good = preflight({
    prompt: '一个女孩在雨夜城市的霓虹街道上奔跑，逆光高对比电影感风格，不要出现水印',
    type: 'video', size: '16:9', duration: 5, count: 3,
    userConfirmedBudget: true, userConfirmedContent: true,
  })
  assert.equal(good.verdict, 'pass', JSON.stringify(good.gates))
  const risky = preflight({
    prompt: '周杰伦风格',
    type: 'image',
  })
  assert.equal(risky.verdict, 'review')
  assert.ok(risky.gates.content.issues.some(issue => issue.includes('缺少')), 'short prompt flags missing elements')
  assert.ok(risky.gates.rights.issues.length > 0, 'rights flags fire')
  assert.equal(risky.gates.cost.pass, false, 'cost gate requires budget confirmation')
})

for (const file of ['directorx-pipeline.js', 'directorx-talking-video.js']) {
test(`workflow template ${file} parses as a workflow script body`, () => {
  const source = readFileSync(join(root, 'workflows', file), 'utf8')
  // The workflow runner executes the body inside an async function with the
  // orchestration hooks in scope; compile it the same way to prove it parses.
  assert.doesNotThrow(() => {
    // oxlint-disable-next-line no-new-func -- syntax validation of the shipped template
    return new Function('args', 'agent', 'pipeline', 'parallel', 'phase', 'log',
      `return (async function () { ${source}\n})`)
  })
  assert.match(source, /phase\('/)
  assert.match(source, /dryRun/)
})
}
