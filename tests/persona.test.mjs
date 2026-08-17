import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { chengpianPersonaText, draftDirectorPrompts, runChengpianEvent } from '../lib/testing.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

test('成片 严格: unclear confirms, never generates, generate offers 2–4 prompts', () => {
  const unclear = runChengpianEvent({ mode: '严格', event: 'unclear' })
  assert.equal(unclear.persona, '成片')
  assert.equal(unclear.confirm, true)
  assert.equal(unclear.generate, false)
  assert.equal(unclear.loadKnowledge, true)
  assert.equal(unclear.loadSkill, true)

  const gen = runChengpianEvent({
    mode: '严格',
    event: 'generate',
    prompt: '雨夜巷口推近女人回头',
    variantCount: 3,
  })
  assert.equal(gen.generate, false)
  assert.equal(gen.confirm, true)
  assert.ok(gen.promptCount >= 2 && gen.promptCount <= 4)
  assert.equal(gen.prompts.length, gen.promptCount)
  assert.equal(new Set(gen.prompts).size, gen.prompts.length)
  assert.ok(gen.prompts.every(line => line.includes('雨夜巷口推近女人回头')))
  assert.equal(gen.placeholders, true)
})

test('成片 自动: in-budget generate without confirm; necessary unclear asks', () => {
  const go = runChengpianEvent({
    mode: '自动',
    event: 'generate',
    prompt: '日光下广场起身',
    inBudget: true,
    necessaryAsk: false,
  })
  assert.equal(go.persona, '成片')
  assert.equal(go.generate, true)
  assert.equal(go.confirm, false)
  assert.equal(go.placeholders, false)

  const over = runChengpianEvent({ mode: '自动', event: 'generate', prompt: '长片', inBudget: false })
  assert.equal(over.generate, false)
  assert.equal(over.confirm, true)

  const skip = runChengpianEvent({ mode: '自动', event: 'unclear', necessaryAsk: false })
  assert.equal(skip.confirm, false)
  assert.equal(skip.generate, false)

  const ask = runChengpianEvent({ mode: '自动', event: 'unclear', necessaryAsk: true })
  assert.equal(ask.confirm, true)
  assert.equal(ask.generate, false)
})

test('成片 协同: placeholder-batch is 提示词和占位, never generates', () => {
  const batch = runChengpianEvent({
    mode: '协同',
    event: 'placeholder-batch',
    prompt: '开场承诺镜 5 秒推近',
  })
  assert.equal(batch.persona, '成片')
  assert.equal(batch.generate, false)
  assert.equal(batch.placeholders, true)
  assert.ok(batch.prompts.length >= 1)
  assert.match(batch.reason, /占位/)
  assert.match(batch.reason, /审阅/)

  const gen = runChengpianEvent({ mode: '协同', event: 'generate', prompt: '结尾记忆点' })
  assert.equal(gen.generate, false)
  assert.equal(gen.placeholders, true)
})

test('draftDirectorPrompts always returns 2–4 distinct director-angle lines', () => {
  const two = draftDirectorPrompts('码头雾中女人站住', 2)
  const four = draftDirectorPrompts('码头雾中女人站住', 4)
  const over = draftDirectorPrompts('码头雾中女人站住', 9)
  assert.equal(two.length, 2)
  assert.equal(four.length, 4)
  assert.equal(over.length, 4)
  assert.equal(new Set(four).size, 4)
})

test('chengpianPersonaText names 成片 modes and 导演角度 knowledge/skill rules', () => {
  const text = chengpianPersonaText('严格')
  for (const token of ['成片', '导演角度', '知识库', 'skill', '严格', '自动', '协同', '二到四个提示词', '直接执行生成', '提示词和占位', '审阅', '执行生成']) {
    assert.match(text, new RegExp(token))
  }
  const skill = readFileSync(join(root, 'skills/directorx-chengpian/SKILL.md'), 'utf8')
  for (const token of ['成片', '导演角度', '知识库', 'skill', '严格', '自动', '协同', '二到四个提示词', '直接执行生成', '提示词和占位', '审阅', '执行生成']) {
    assert.match(skill, new RegExp(token))
  }
  const tools = readFileSync(join(root, 'src/tools.ts'), 'utf8')
  assert.match(tools, /name: 'directorx:chengpian'/)
  assert.match(tools, /order: 5/)
  assert.match(tools, /ask_user_question/)
})
