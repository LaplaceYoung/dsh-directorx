import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { brief, buildShotPrompt, buildShotSequence, generationPreset, listPresets, planStoryboard, preflight, registerSubagentSetup, routeModel } from '../lib/testing.js'

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

test('storyboard enforces the camera vocabulary and anti-monotony', () => {
  const plan = planStoryboard({
    shots: [
      { id: 'a', description: '一', seconds: 3, movement: 'pan' },
      { id: 'b', description: '二', seconds: 3, movement: 'pan' },
      { id: 'c', description: '三', seconds: 3, movement: 'hyper_zoom' },
      { id: 'd', description: '四', seconds: 3, movement: 'orbit' },
    ],
    targetSeconds: 12,
  })
  assert.ok(plan.issues.some(issue => issue.includes('反单调')), 'adjacent same move flagged')
  assert.ok(plan.issues.some(issue => issue.includes('不在词表')), 'off-vocabulary move flagged')
  assert.ok(plan.notes.some(note => note.includes('大胆运镜')), 'bold move annotated')
  // storyBeat passthrough
  const beatPlan = planStoryboard({ shots: [{ id: 'x', description: '五', seconds: 3, storyBeat: '开场' }], targetSeconds: 3 })
  assert.equal(beatPlan.shots[0].storyBeat, '开场')
})

test('generation presets pair parameters with the model router', () => {
  const all = listPresets()
  assert.ok(all.length >= 6, 'preset table populated')
  const douyin = generationPreset('douyin-oral')
  assert.equal(douyin.aspectRatio, '9:16')
  assert.ok(douyin.durationRange[0] >= 3 && douyin.durationRange[1] <= 15)
  assert.ok(douyin.cameraMoves.length >= 3, 'rotating move list for anti-monotony')
  assert.ok(douyin.models.eligible.length > 0, 'router linked')
  assert.ok(douyin.rules.some(rule => rule.includes('规则')), 'rule citations')
  assert.equal(generationPreset('unknown-slug'), null, 'unknown slug -> null')
})

test('shot sequence wires carry-over variables and frame handoffs', () => {
  const seq = buildShotSequence([
    { id: 'a', description: '红衣女子走进雨巷。她停下脚步。', cameraMove: 'pan' },
    { id: 'b', description: '她回头望向来路。', cameraMove: 'pan', handoff: true },
    { id: 'c', description: '霓虹灯下她继续前行。', cameraMove: 'push_in' },
  ])
  assert.equal(seq.specs.length, 3)
  assert.equal(seq.specs[1].carry.prevEnd, '她停下脚步', 'prev end state carried')
  assert.equal(seq.specs[1].carry.nextStart, '霓虹灯下她继续前行', 'next start goal carried')
  assert.equal(seq.specs[1].handoffFrom, 'a', 'handoff pins previous shot frame')
  assert.ok(seq.issues.some(issue => issue.includes('反单调')), 'adjacent same move flagged')
})

test('shot builder translates directing craft into generation prompts', () => {
  const shot = buildShotPrompt({
    subject: '红衣女子，黑发，红风衣',
    action: '独坐窗边，缓缓抬头',
    shotSize: 'MCU',
    angle: 'eye-level',
    cameraMove: 'push_in',
    lighting: 'neon',
    composition: 'negative-space',
    mood: '孤独',
    durationSec: 5,
  })
  assert.ok(shot.prompt.includes('medium close-up'), 'shot size phrase')
  assert.ok(shot.prompt.includes('push in'), 'camera move phrase')
  assert.ok(shot.prompt.includes('neon signs'), 'lighting phrase')
  assert.ok(shot.prompt.includes('negative space'), 'composition phrase')
  assert.ok(shot.negative.includes('extra fingers'), 'negative baseline')
  assert.ok(shot.notes.some(note => note.includes('规则')), 'rule citations present')
  // static move becomes explicit
  const still = buildShotPrompt({ subject: '桌子', cameraMove: 'static' })
  assert.ok(still.prompt.includes('Static camera, no movement'), 'static mandate explicit')
})

test('model router filters and ranks by requirement fit', () => {
  // 15s + 9:16 + last frame + audio -> only kling family qualifies.
  const strict = routeModel({ durationSec: 15, aspectRatio: '9:16', needsLastFrame: true, needsAudio: true })
  assert.ok(strict.eligible.every(capability => capability.model.startsWith('kling')), 'only kling family')
  // 8s first-frame 16:9 -> several, ranked; excluded entries carry reasons.
  const loose = routeModel({ durationSec: 8, needsFirstFrame: true, aspectRatio: '16:9' })
  assert.ok(loose.eligible.length >= 3, 'broad eligibility')
  assert.ok(loose.excluded.some(entry => entry.reasons.some(reason => reason.includes('首帧'))), 'excluded with reasons')
  // vidu lacks first/last frames -> excluded when requested.
  const vidu = routeModel({ needsFirstFrame: true }).excluded.find(entry => entry.model === 'viduq3')
  assert.ok(vidu !== undefined && vidu.reasons.some(reason => reason.includes('首帧')), 'vidu excluded for first frame')
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

for (const file of ['directorx-pipeline.js', 'directorx-talking-video.js', 'directorx-montage.js', 'directorx-localize.js']) {
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
