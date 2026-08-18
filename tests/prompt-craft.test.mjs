import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  ResearchLedger,
  craftPrompt,
  isThinPrompt,
  requireCraft,
  corpus,
  skillIndex,
  IpMemoryStore,
} from '../lib/testing.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

test('thin prompts are rejected', () => {
  const intent = '两个秦兵架起林构拖走'
  assert.ok(isThinPrompt(intent, intent))
  assert.ok(isThinPrompt(intent, '两个秦兵拖走林构，尘土飞扬'))
  assert.ok(isThinPrompt(intent, '【建立镜头】两个秦兵架起林构拖走。本行是角度不是成稿，先 directorx_prompt_plan 再 prompt_craft。'))
  assert.ok(isThinPrompt(intent, 'Cinematic 35mm atmosphere, two soldiers, dusty.'))
  assert.equal(isThinPrompt(intent, [
    'Medium shot, eye-level handheld, dusty construction site at dusk, two Qin soldiers drag Lin Gou by the arms, his legs off the ground, warm practical work-lamps, 35mm shallow depth of field, cinematic, 5 seconds, struggle then a comic yelp.',
  ].join('')), undefined)
})

test('craft refuses until knowledge and skill have been read', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-craft-'))
  corpus.setRoot(join(root, 'knowledge'))
  skillIndex.setRoot(join(root, 'skills'))
  try {
    const skipped = await craftPrompt({
      outputDir: dir,
      kind: 'video',
      intent: '两个秦兵架起林构拖走',
      prompt: 'x',
      knowledgeRefs: [],
      skillNames: [],
      externalNotes: '',
    })
    assert.equal(skipped.ok, false)
    assert.ok(Array.isArray(skipped.suggestedKnowledge))

    const unread = await craftPrompt({
      outputDir: dir,
      kind: 'video',
      intent: '两个秦兵架起林构拖走',
      prompt: 'Medium shot of two soldiers dragging a man, dusty, cinematic 35mm.',
      knowledgeRefs: ['116'],
      skillNames: ['cinematic-style'],
      externalNotes: 'corpus-sufficient',
    })
    assert.equal(unread.ok, false)
    assert.match(String(unread.next), /read/)

    const ledger = new ResearchLedger(dir)
    await ledger.record({ kind: 'knowledge', ref: '116' })
    await ledger.record({ kind: 'skill', ref: 'cinematic-style' })
    const done = await craftPrompt({
      outputDir: dir,
      kind: 'video',
      intent: '两个秦兵架起林构拖走',
      prompt: 'Medium shot, eye-level, dusty palace-construction site, two Qin soldiers drag Lin Gou, legs off the ground, warm work-lamp key, 35mm cinematic, five seconds of struggle then a comic shout.',
      knowledgeRefs: ['116'],
      skillNames: ['cinematic-style'],
      externalNotes: 'corpus-sufficient',
    })
    assert.equal(done.ok, true)
    assert.ok(done.craftId)
    const required = await requireCraft(dir, done.craftId)
    assert.equal(required.ok, true)
    const missing = await requireCraft(dir, undefined)
    assert.equal(missing.ok, false)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('craft refuses a dirty IP prompt and remembers a clean rewrite', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-craft-ip-'))
  corpus.setRoot(join(root, 'knowledge'))
  skillIndex.setRoot(join(root, 'skills'))
  try {
    const ledger = new ResearchLedger(dir)
    await ledger.record({ kind: 'knowledge', ref: '213' })
    await ledger.record({ kind: 'skill', ref: 'cinematic-style' })
    const dirty = await craftPrompt({
      outputDir: dir,
      kind: 'video',
      intent: '蜘蛛侠在楼宇间摆荡',
      prompt: 'Medium shot, eye-level, Spider-Man swings between rain-soaked towers, cool sodium key light, 35mm cinematic night, wet asphalt reflections, five seconds of a continuous swing.',
      knowledgeRefs: ['213'],
      skillNames: ['cinematic-style'],
      externalNotes: 'corpus-sufficient',
    })
    assert.equal(dirty.ok, false)
    assert.match(String(dirty.next), /ip_rewrite|专名/)

    const cleanPrompt = 'Medium shot, eye-level, a young athlete in a red-black elastic bodysuit and full-face mask swings between rain-soaked towers on a geometric line, cool sodium key light, 35mm cinematic night, wet asphalt reflections, no logos.'
    const done = await craftPrompt({
      outputDir: dir,
      kind: 'video',
      intent: '蜘蛛侠在楼宇间摆荡',
      prompt: cleanPrompt,
      knowledgeRefs: ['213'],
      skillNames: ['cinematic-style'],
      externalNotes: 'corpus-sufficient',
    })
    assert.equal(done.ok, true)
    assert.equal(done.ipRemembered, true)
    const memory = await new IpMemoryStore(dir).recall('蜘蛛侠')
    assert.ok(memory.length >= 1)
    assert.match(memory[0].rewrite, /elastic bodysuit/)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
