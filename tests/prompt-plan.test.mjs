import test from 'node:test'
import assert from 'node:assert/strict'
import { isSimpleUnit, planProduction, planPrompt } from '../lib/testing.js'

test('planPrompt fills six-element gaps and a physics chain for video', () => {
  const plan = planPrompt({ intent: '雨夜巷口女人回头', kind: 'video' })
  assert.equal(plan.kind, 'video')
  assert.equal(plan.strategyHint, 't2v')
  assert.ok(plan.elements.some(item => item.name === '光线' && item.present === false))
  assert.ok(plan.physics.some(line => /contact|接触/.test(line)))
  assert.ok(plan.next.includes('directorx_prompt_craft（intent=原句，prompt=按本计划写细的成稿）'))
  assert.match(plan.agentPrompt, /六要素/)
  assert.doesNotMatch(plan.agentPrompt, /红色头罩/)
})

test('planPrompt names a model copilot and IP method when needed', () => {
  const kling = planPrompt({ intent: '开拍雨巷跟镜头', model: 'kling-3.0' })
  assert.equal(kling.copilot, 'kling-prompt-copilot')
  assert.ok(kling.next.some(step => step.includes('kling-prompt-copilot')))

  const h3 = planPrompt({ intent: '按 Ref2VA 开拍海螺 H3', kind: 'video' })
  assert.equal(h3.copilot, 'minimax-h3-prompt-copilot')
  assert.equal(h3.strategyHint, 'ref2v')

  const lock = planPrompt({ intent: '30秒10人完全控制，只给角色图和攻击顺序', kind: 'video' })
  assert.equal(lock.level, 'L3')
  assert.ok(lock.next.includes('directorx_blocking harvest'))

  const ip = planPrompt({ intent: '蜘蛛侠在楼宇间摆荡', kind: 'video' })
  assert.ok(ip.ip?.dirty)
  assert.ok(ip.next.includes('directorx_ip_scan'))
})

test('planProduction splits simple units from multi-unit compose', () => {
  const unit = planProduction({ request: '雨夜巷口女人回头' })
  assert.equal(unit.simple, true)
  assert.ok(unit.next.some(step => step.includes('prompt_craft')))

  const promo = planProduction({ request: '给品牌做一条十五秒宣传片，三幕分镜' })
  assert.equal(promo.simple, false)
  assert.ok(promo.compose.stages.some(stage => stage.name === '稿'))
  assert.ok(promo.compose.stages.some(stage => stage.tools.includes('directorx_prompt_plan')))
  assert.ok(promo.next.includes('directorx_brief'))
  assert.equal(isSimpleUnit('改编骆驼祥子'), false)
})
