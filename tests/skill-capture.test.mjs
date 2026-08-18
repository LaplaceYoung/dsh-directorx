import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  NoteStore,
  ProductionStageStore,
  PromptCraftStore,
  SkillIndex,
  decideCaptureAnswer,
  harvestProduction,
  projectSkillRoot,
  runSkillCapture,
  saveCapturedSkill,
  saveSkillAsk,
  slugSkillName,
  suggestSkillName,
  validSkillName,
} from '../lib/testing.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function longBody(title = '雨夜巷口宣传片') {
  return [
    `# ${title}`,
    '',
    '用户再说同类巷口夜戏、同样改法或同一风格时先读本技能。',
    '',
    '## 何时用',
    '夜巷、湿沥青、近逼回头、品牌短片。',
    '',
    '## 流程',
    '路 skill_route → 稿 prompt_plan/craft/ready → 位 propose/confirm → 生成 → 质检 → 交付。',
    '',
    '## 修改纪律',
    '光再暖一档。不要手持晃。IP 专名先改写再生成。',
  ].join('\n')
}

test('slug and suggest keep latin names and fall back for CJK', () => {
  assert.equal(validSkillName('dx-rain-alley'), true)
  assert.equal(validSkillName('Rain_Alley'), false)
  assert.equal(slugSkillName('Rain Alley Promo'), 'dx-rain-alley-promo')
  assert.equal(suggestSkillName('雨夜巷口宣传片'), 'dx-chengpian')
  assert.equal(suggestSkillName('dx-rain-alley'), 'dx-rain-alley')
})

test('save-skill ask card offers save, rename, and skip', () => {
  const ask = saveSkillAsk('雨夜巷口')
  assert.equal(ask.id, 'save-skill')
  assert.ok(ask.options.some(item => item.label.includes('保存为「雨夜巷口」技能')))
  assert.ok(ask.options.some(item => item.label === '换个名字'))
  assert.ok(ask.options.some(item => item.label === '这次不保存'))
})

test('decideCaptureAnswer reads cards, custom names, and skip', () => {
  const base = { suggestedName: 'dx-rain-alley', suggestedTitle: '雨夜巷口' }
  assert.equal(decideCaptureAnswer({ ...base, answers: [{ id: 'save-skill', selected: ['这次不保存'] }] }).kind, 'skip')
  assert.deepEqual(
    decideCaptureAnswer({ ...base, answers: [{ id: 'save-skill', selected: ['保存为「雨夜巷口」技能'] }] }),
    { kind: 'save', name: 'dx-rain-alley', title: '雨夜巷口' },
  )
  assert.equal(decideCaptureAnswer({ ...base, answers: [{ id: 'save-skill', selected: ['换个名字'] }] }).kind, 'rename')
  const renamed = decideCaptureAnswer({
    ...base,
    answers: [{ id: 'save-skill', selected: ['换个名字'], custom: 'night-alley-ad' }],
  })
  assert.deepEqual(renamed, { kind: 'save', name: 'dx-night-alley-ad', title: 'night-alley-ad' })
  assert.equal(decideCaptureAnswer({ ...base, name: '这次不保存' }).kind, 'skip')
})

test('harvest collects stage flow and user notes', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dx-harvest-'))
  try {
    const notes = new NoteStore(dir)
    await notes.append({ text: '光再暖一档，不要手持' })
    const stage = new ProductionStageStore(dir)
    await stage.record({ stage: 'brief', kind: 'brief', note: '15s 巷口宣传' })
    await stage.advance('craft')
    await new PromptCraftStore(dir).save({
      id: 'craft-1',
      kind: 'video',
      intent: '雨夜巷口女人回头',
      prompt: '中近景推近，暖窗光，湿沥青反光，女人站住回头，35mm，浅景深，电影感夜戏。',
      knowledgeRefs: ['116'],
      skillNames: ['video-prompt-builder'],
      externalNotes: '',
      at: Date.now(),
    })
    const harvest = await harvestProduction(dir)
    assert.ok(harvest.notes.some(item => item.includes('光再暖')))
    assert.ok(harvest.crafts.some(item => item.intent.includes('巷口')))
    assert.ok(harvest.stages.some(item => item.id === 'brief' && item.notes.length > 0))
    assert.equal(harvest.ask.id, 'save-skill')
    assert.match(harvest.agentPrompt, /directorx_skill_capture/)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('save writes project and user skills, never the bundled plugin root', async () => {
  const outputDir = await mkdtemp(join(tmpdir(), 'dx-cap-out-'))
  const userRoot = await mkdtemp(join(tmpdir(), 'dx-cap-user-'))
  try {
    await assert.rejects(
      () => saveCapturedSkill({
        outputDir,
        name: 'novel-characters',
        title: '角色',
        body: longBody(),
        userRoot,
      }),
      /插件自带/,
    )
    const saved = await saveCapturedSkill({
      outputDir,
      name: 'dx-rain-alley',
      title: '雨夜巷口',
      description: '夜巷宣传片：暖窗光、近逼回头。同类题材先读本技能。',
      body: longBody(),
      userRoot,
    })
    assert.equal(saved.name, 'dx-rain-alley')
    const projectFile = join(projectSkillRoot(outputDir), 'dx-rain-alley', 'SKILL.md')
    const userFile = join(userRoot, 'dx-rain-alley', 'SKILL.md')
    assert.ok(saved.paths.includes(projectFile))
    assert.ok(saved.paths.includes(userFile))
    const text = await readFile(projectFile, 'utf8')
    assert.match(text, /name: dx-rain-alley/)
    assert.match(text, /光再暖/)
    assert.equal(text.includes(join(root, 'skills')), false)

    const index = new SkillIndex()
    index.setRoot(join(root, 'skills'))
    index.setExtraRoots([projectSkillRoot(outputDir), userRoot])
    const hits = await index.search('rain alley 夜巷', 8)
    assert.ok(hits.some(hit => hit.name === 'dx-rain-alley'))
    const body = await index.read('dx-rain-alley')
    assert.match(body.content, /修改纪律/)

    await assert.rejects(
      () => saveCapturedSkill({
        outputDir,
        name: 'dx-rain-alley',
        title: '雨夜巷口',
        body: longBody(),
        userRoot,
      }),
      /已存在/,
    )
  } finally {
    await rm(outputDir, { recursive: true, force: true })
    await rm(userRoot, { recursive: true, force: true })
  }
})

test('offer without an answer only returns the question card', async () => {
  const outputDir = await mkdtemp(join(tmpdir(), 'dx-cap-ask-'))
  try {
    const offered = await runSkillCapture({ outputDir, action: 'offer' })
    assert.equal(offered.saved, undefined)
    assert.equal(offered.ask.id, 'save-skill')
    assert.ok(Array.isArray(offered.next) && offered.next.includes('directorx_ask'))
  } finally {
    await rm(outputDir, { recursive: true, force: true })
  }
})

test('offer skip and save paths return the next the agent should take', async () => {
  const outputDir = await mkdtemp(join(tmpdir(), 'dx-cap-run-'))
  const userRoot = await mkdtemp(join(tmpdir(), 'dx-cap-run-user-'))
  try {
    await new NoteStore(outputDir).append({ text: '不要手持晃' })
    const skipped = await runSkillCapture({
      outputDir,
      action: 'offer',
      answer: '这次不保存',
      userRoot,
    })
    assert.equal(skipped.saved, false)
    assert.equal(skipped.decision.kind, 'skip')

    const offered = await runSkillCapture({
      outputDir,
      action: 'offer',
      name: 'dx-night-ad',
      userRoot,
    })
    assert.equal(offered.saved, false)
    assert.equal(offered.decision.kind, 'save')
    assert.match(String(offered.agentPrompt), /SKILL.md/)

    const saved = await runSkillCapture({
      outputDir,
      action: 'save',
      name: 'dx-night-ad',
      title: '夜巷广告',
      body: longBody('夜巷广告'),
      userRoot,
    })
    assert.equal(saved.saved, true)
    assert.equal(saved.name, 'dx-night-ad')
    assert.ok(Array.isArray(saved.next) && saved.next.some(item => String(item).includes('directorx_skill_read dx-night-ad')))
  } finally {
    await rm(outputDir, { recursive: true, force: true })
    await rm(userRoot, { recursive: true, force: true })
  }
})
