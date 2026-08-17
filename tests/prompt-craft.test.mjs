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
} from '../lib/testing.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

test('thin prompts are rejected', () => {
  const intent = '两个秦兵架起林构拖走'
  assert.ok(isThinPrompt(intent, intent))
  assert.ok(isThinPrompt(intent, '两个秦兵拖走林构，尘土飞扬'))
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
