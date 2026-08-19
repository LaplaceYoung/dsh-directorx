import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  normalizeAskQuestions,
  resolveHostAsk,
  ProductionStageStore,
  SkillIndex,
  chengpianAskQuestions,
  runChengpianEvent,
  corpus,
} from '../lib/testing.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

test('resolveHostAsk prefers userQuestions then the userInteraction alias', () => {
  const questions = { ask: async () => ({ answers: [{ id: 'q1', selected: ['ok'] }] }) }
  const legacy = { ask: async () => ({ answers: [{ id: 'q1', selected: ['old'] }] }) }
  const services = { userQuestions: questions, userInteraction: legacy }
  const ctx = {
    get(name) {
      if (name in services) return services[name]
      throw new Error(`missing ${name}`)
    },
  }
  assert.equal(resolveHostAsk(ctx)?.ask, questions.ask)
  delete services.userQuestions
  assert.equal(resolveHostAsk(ctx)?.ask, legacy.ask)
  delete services.userInteraction
  assert.equal(resolveHostAsk(ctx), undefined)
})

test('normalizeAskQuestions turns options into cards and injects recommended', () => {
  const questions = normalizeAskQuestions({
    question: '选画幅',
    recommended: '16:9',
    options: [{ label: '9:16', description: '竖屏' }],
  })
  assert.equal(questions.length, 1)
  assert.equal(questions[0].options[0].label, '16:9')
  assert.ok(questions[0].options.some(item => item.label === '9:16'))
})

test('chengpian unclear/generate expose ask cards instead of a prose menu', () => {
  const unclear = runChengpianEvent({ mode: '严格', event: 'unclear' })
  const cards = chengpianAskQuestions(unclear, 'unclear')
  assert.ok(cards[0].options.length >= 3)
  const gen = runChengpianEvent({ mode: '严格', event: 'generate', prompt: '雨夜巷口', variantCount: 3 })
  const promptCards = chengpianAskQuestions(gen, 'generate')
  assert.equal(promptCards[0].id, 'prompt')
  assert.equal(promptCards[0].options.length, gen.prompts.length)
})

test('stage ledger advances and records artifacts', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-stage-'))
  try {
    const store = new ProductionStageStore(dir)
    const first = await store.get()
    assert.equal(first.current, 'brief')
    assert.ok(first.entries.some(item => item.id === 'craft'))
    assert.equal(first.gate.id, 'stage')
    await store.record({ kind: 'brief', note: '宣传片 15s' })
    const next = await store.advance('research')
    assert.equal(next.current, 'research')
    assert.equal(next.entries.find(item => item.id === 'brief').status, 'done')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('skill index finds novel-characters and reads a reference', async () => {
  const index = new SkillIndex()
  index.setRoot(join(root, 'skills'))
  const hits = await index.search('三视图 角色设定', 8)
  assert.ok(hits.some(hit => hit.name === 'novel-characters'))
  const kling = await index.search('可灵提示词', 8)
  assert.ok(kling.some(hit => hit.name === 'kling-prompt-copilot'))
  const body = await index.read('novel-characters')
  assert.match(body.content, /三视图|设定/)
  assert.ok(body.references.some(file => file.includes('sheet') || file.includes('schema')))
  const capture = await index.search('收成技能 保存为', 8)
  assert.ok(capture.some(hit => hit.name === 'directorx-skill-capture'))
})

test('knowledge search expands 首尾帧 and still hits 116', async () => {
  corpus.setRoot(join(root, 'knowledge'))
  const hits = await corpus.search('图生视频 首尾帧', 5)
  assert.ok(hits.length > 0)
  assert.ok(hits.some(hit => hit.id === '116' || hit.path.includes('image-to-video')))
  const related = await corpus.related('116', 3)
  assert.ok(Array.isArray(related))
})
