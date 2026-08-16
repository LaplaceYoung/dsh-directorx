import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, resolve } from 'node:path'
import { registerSubagentSetup } from '../lib/testing.js'

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
