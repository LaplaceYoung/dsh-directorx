import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  CharacterStore,
  checkShotVocab,
  detectBibles,
  listShotVocab,
  pinCharacterSetting,
  reviewBible,
  runBible,
  showShotVocab,
  DirectorxCanvasStore,
} from '../lib/testing.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

test('shot vocab separates recipes from techniques and checks required phrases', () => {
  const recipes = listShotVocab({ kind: 'recipe' })
  const techniques = listShotVocab({ kind: 'technique' })
  assert.ok(recipes.length >= 5)
  assert.ok(techniques.every(card => card.never.trim() !== ''))
  assert.equal(showShotVocab('dialogue-reverse')?.title, '正反打')
  const hit = checkShotVocab({
    prompt: 'over the shoulder two-shot, eyeline match across the table',
    recipe: 'dialogue-reverse',
  })
  assert.equal(hit.ok, true)
  const miss = checkShotVocab({
    prompt: 'two people talking in a room, cinematic lighting',
    recipe: 'dialogue-reverse',
  })
  assert.equal(miss.ok, false)
  assert.ok(miss.missing.includes('over the shoulder'))
})

test('bible reviews the bundled outline gates as markdown, not HTML', async () => {
  const outline = join(root, 'skills/novel-outline/examples/渡口-outline.json')
  const review = await reviewBible(outline, 'outline')
  assert.equal(review.kind, 'outline')
  assert.ok(review.total >= 8)
  assert.match(review.markdown, /质量门|评审/)
  assert.equal(review.markdown.includes('<html'), false)
})

test('bible detect + pin writes a canvas text card', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dx-bible-'))
  try {
    const { copyFile } = await import('node:fs/promises')
    await copyFile(join(root, 'skills/novel-outline/examples/渡口-outline.json'), join(dir, '渡口-outline.json'))
    const found = await detectBibles(dir)
    assert.ok(found.some(item => item.kind === 'outline'))
    const pinned = await runBible({ outputDir: dir, action: 'pin', kind: 'outline' })
    assert.equal(pinned.kind, 'outline')
    assert.equal(typeof pinned.canvasNodeId, 'string')
    assert.match(String(pinned.saved), /outline-review\.md/)
    const doc = await new DirectorxCanvasStore(dir).read()
    assert.ok(doc.nodes.some(node => node.kind === 'text' && node.id === pinned.canvasNodeId))
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('character register pins a visible 人物设定 text node', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dx-cast-pin-'))
  try {
    const card = await new CharacterStore(dir).register({
      name: '千刃',
      description: '短黑发，青灰短打，左手持窄刀',
      refPath: '/tmp/qianren.png',
      outfit: '青灰短打',
      props: '窄刀',
    })
    const pinned = await pinCharacterSetting(dir, card)
    assert.ok(pinned)
    const doc = await new DirectorxCanvasStore(dir).read()
    const node = doc.nodes.find(item => item.id === pinned.nodeId)
    assert.equal(node.kind, 'text')
    assert.match(node.label, /人物设定：千刃/)
    assert.match(node.label, /窄刀/)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
