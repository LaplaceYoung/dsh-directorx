import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  assessGenerateReady,
  classifyGenerateStrategy,
  commitGenerateReady,
  requireReady,
  corpus,
  skillIndex,
  craftPrompt,
  ResearchLedger,
} from '../lib/testing.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const DETAILED = 'Medium shot, eye-level, dusty palace-construction site, two Qin soldiers drag Lin Gong, legs off the ground, warm work-lamp key, 35mm cinematic, five seconds of struggle then a comic shout.'

function emptySnap() {
  return { characters: [], nodes: [], edges: [] }
}

test('named character video without a sheet is blocked and asks how to generate', () => {
  const report = assessGenerateReady({
    kind: 'video',
    intent: '林工被秦兵架走',
    prompt: DETAILED,
    characters: ['林工'],
    snapshot: emptySnap(),
  })
  assert.equal(report.verdict, 'blocked')
  assert.ok(report.missing.some(item => item.need === 'character-sheet'))
  assert.ok(report.ask.some(card => card.id === 'strategy'))
  assert.ok(report.ask[0].options.every(option => !/^[0-9]+\./.test(option.label)))
})

test('character-sheet image does not need existing refs', () => {
  const report = assessGenerateReady({
    kind: 'image',
    intent: '林工三视图设定',
    prompt: `${DETAILED} 16:9 角色设定表 正侧背三视图`,
    strategy: 'character-sheet',
    snapshot: emptySnap(),
  })
  assert.equal(report.strategy, 'character-sheet')
  assert.equal(report.verdict, 'ready')
})

test('i2v with first frame and registered character is ready', () => {
  const report = assessGenerateReady({
    kind: 'video',
    intent: '林工回头',
    prompt: DETAILED,
    characters: ['林工'],
    firstFrame: '/tmp/lin-key.png',
    snapshot: {
      characters: [{ name: '林工', refPath: '/tmp/lin-sheet.png' }],
      nodes: [],
      edges: [],
    },
  })
  assert.equal(report.strategy, 'i2v')
  assert.equal(report.verdict, 'ready')
  assert.equal(report.bind.firstFrame, '/tmp/lin-key.png')
  assert.ok(report.bind.referenceImages.includes('/tmp/lin-sheet.png'))
})

test('previous video node requires extracting a last frame before i2v', () => {
  const report = assessGenerateReady({
    kind: 'video',
    intent: '林工被架走的下一镜',
    prompt: DETAILED,
    sourceId: 'video-prev',
    snapshot: {
      characters: [{ name: '林工', refPath: '/tmp/lin-sheet.png' }],
      nodes: [{ id: 'video-prev', kind: 'video', label: 'S08 秦兵押队', path: '/tmp/prev.mp4', characters: ['林工'] }],
      edges: [],
    },
  })
  assert.equal(report.strategy, 'i2v')
  assert.equal(report.verdict, 'blocked')
  const first = report.missing.find(item => item.need === 'first-frame')
  assert.ok(first)
  assert.match(first.detail, /extract_frames/)
})

test('fl2v without a last frame is blocked', () => {
  const report = assessGenerateReady({
    kind: 'video',
    intent: '从工地金光过渡到荒原',
    prompt: `${DETAILED} 首尾帧转场`,
    firstFrame: '/tmp/a.png',
    snapshot: emptySnap(),
  })
  assert.equal(report.strategy, 'fl2v')
  assert.equal(report.verdict, 'blocked')
  assert.ok(report.missing.some(item => item.need === 'last-frame'))
})

test('empty landscape t2v with a detailed prompt is ready', () => {
  const report = assessGenerateReady({
    kind: 'video',
    intent: '阿房宫工地全景空镜',
    prompt: 'Extreme long shot, golden hour, empty Qin palace construction site, dust and timber scaffolds, static camera, no people, cinematic 35mm, five seconds of wind.',
    snapshot: emptySnap(),
  })
  assert.equal(report.strategy, 't2v')
  assert.equal(report.verdict, 'ready')
})

test('registered character upgrades t2v to ref2v', () => {
  const snapshot = { characters: [{ name: '林工', refPath: '/tmp/lin-sheet.png' }], nodes: [], edges: [] }
  assert.equal(classifyGenerateStrategy({
    kind: 'video',
    intent: '林工发呆',
    prompt: DETAILED,
    characters: ['林工'],
    strategy: 't2v',
    snapshot,
  }), 'ref2v')
  const report = assessGenerateReady({
    kind: 'video',
    intent: '林工发呆',
    prompt: DETAILED,
    characters: ['林工'],
    strategy: 't2v',
    snapshot,
  })
  assert.equal(report.verdict, 'ready')
})

test('cannot waive a registered character that has no usable sheet path', () => {
  const report = assessGenerateReady({
    kind: 'video',
    intent: '林工发呆',
    prompt: DETAILED,
    characters: ['林工'],
    strategy: 'ref2v',
    waivers: ['character-sheet'],
    snapshot: {
      characters: [{ name: '林工', refPath: '' }],
      nodes: [],
      edges: [],
    },
  })
  assert.equal(report.verdict, 'blocked')
  assert.ok(report.missing.some(item => item.need === 'character-sheet'))
})

test('commit and requireReady pair craft with the brief', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-ready-'))
  corpus.setRoot(join(root, 'knowledge'))
  skillIndex.setRoot(join(root, 'skills'))
  try {
    const missing = await requireReady(dir, undefined)
    assert.equal(missing.ok, false)
    assert.match(missing.next, /generate_ready/)

    const ledger = new ResearchLedger(dir)
    await ledger.record({ kind: 'knowledge', ref: '116' })
    await ledger.record({ kind: 'skill', ref: 'cinematic-style' })
    const crafted = await craftPrompt({
      outputDir: dir,
      kind: 'video',
      intent: '阿房宫工地全景空镜',
      prompt: 'Extreme long shot, golden hour, empty Qin palace construction site, dust and timber scaffolds, static camera, no people, cinematic 35mm, five seconds of wind.',
      knowledgeRefs: ['116'],
      skillNames: ['cinematic-style'],
      externalNotes: 'corpus-sufficient',
    })
    assert.equal(crafted.ok, true)
    const blocked = await commitGenerateReady({
      outputDir: dir,
      craftId: crafted.craftId,
      kind: 'video',
      intent: '林工被秦兵架走',
      prompt: DETAILED,
      characters: ['林工'],
      snapshot: emptySnap(),
    })
    assert.equal(blocked.ok, false)

    const done = await commitGenerateReady({
      outputDir: dir,
      craftId: crafted.craftId,
      kind: 'video',
      intent: '阿房宫工地全景空镜',
      prompt: String(crafted.prompt),
      snapshot: emptySnap(),
    })
    assert.equal(done.ok, true)
    assert.ok(done.readyId)
    const required = await requireReady(dir, done.readyId, { craftId: crafted.craftId, kind: 'video' })
    assert.equal(required.ok, true)
    const mismatch = await requireReady(dir, done.readyId, { craftId: 'craft-other', kind: 'video' })
    assert.equal(mismatch.ok, false)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
