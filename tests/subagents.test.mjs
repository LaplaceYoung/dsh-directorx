import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { brief, planStoryboard, preflight, registerSubagentSetup } from '../lib/testing.js'

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

test('brief infers type/platform/duration and asks one-shot clarifications', async () => {
  const out = await brief({ request: '帮我做一个 30 秒的抖音带货广告，介绍这款智能保温杯，赛博朋克风格', materials: ['/tmp/x.mp4', '/tmp/y.png'], outputDir: await mkdtemp(join(tmpdir(), 'directorx-brief-')) })
  assert.equal(out.brief.type, '广告/宣传')
  assert.equal(out.brief.aspectRatio, '9:16')
  assert.equal(out.brief.targetSeconds, 30)
  assert.ok(out.brief.styleHints.includes('cyberpunk'), 'style hint mapped to preset slug')
  assert.equal(out.brief.materials[0].kind, 'video')
  assert.ok(out.questions.length >= 3, 'clarification questions generated')
  assert.ok(out.suggestedFlow.includes('preflight'), 'ad flow suggests cost gates')
  assert.ok(out.titles.length === 3, 'three hook-formula title variants')
  assert.ok(out.platformCard !== null && out.platformCard.titleCap === 55, 'platform card with douyin title cap')
  assert.ok(out.platformCard.coverSpec.includes('首帧即封面'), 'cover spec matches platform rules')
  assert.ok(out.coverPrompt !== null && out.coverPrompt.includes('封面'), 'cover prompt generated')
  assert.ok(out.nextActions.length >= 3, 'nextActions sequence present')
})

test('planStoryboard keeps industrial shot fields through the plan', () => {
  const plan = planStoryboard({
    shots: [
      { id: 's1', description: '主角转身', seconds: 5, cameraShot: 'MCU', angle: 'eye-level', movement: 'slow dolly in', moodTags: ['紧张'], actionBeats: ['转身', '停顿'], dialogue: '你来了' },
    ],
    targetSeconds: 5,
  })
  assert.equal(plan.shots[0].cameraShot, 'MCU')
  assert.equal(plan.shots[0].movement, 'slow dolly in')
  assert.deepEqual(plan.shots[0].actionBeats, ['转身', '停顿'])
})

test('planStoryboard allocates durations and checks continuity anchors', () => {
  const plan = planStoryboard({
    shots: [
      { id: 's1', description: '主角在雨夜小巷转身', seconds: 8 },
      { id: 's2', description: '主角回头', seconds: 15 },
      { id: 's3', description: '空镜' },
    ],
    targetSeconds: 24,
    maxShotSeconds: 10,
    anchors: { characters: ['主角'], scenes: ['雨夜小巷'] },
  })
  assert.ok(plan.shots.every(shot => shot.seconds >= 1 && shot.seconds <= 10), 'all within clamp')
  assert.equal(plan.shots[1].seconds, 10, '15s clamped to 10')
  assert.ok(plan.issues.some(issue => issue.includes('s3') && issue.includes('主角')), 'missing anchor flagged')
  assert.ok(plan.shots[2].seconds > 0, 'unspecified duration allocated')
})

for (const file of ['directorx-pipeline.js', 'directorx-talking-video.js', 'directorx-montage.js']) {
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
