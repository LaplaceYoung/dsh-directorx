import test from 'node:test'
import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  CharacterStore, DirectorxCanvasStore, ProjectStyleStore, NoteStore,
  harvestSeries, planRevise, runSeries, slugSeriesName,
} from '../lib/testing.js'

test('slugSeriesName prefixes latin titles', () => {
  assert.equal(slugSeriesName('Dawn Slash'), 'series-dawn-slash')
  assert.match(slugSeriesName('破晓一刀'), /^series-/)
})

test('series harvest / save / apply reloads cast and look', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-series-'))
  const userRoot = await mkdtemp(join(tmpdir(), 'directorx-series-user-'))
  const dest = await mkdtemp(join(tmpdir(), 'directorx-series-dest-'))
  try {
    const face = join(dir, 'face.png')
    await writeFile(face, 'png')
    await new CharacterStore(dir).register({
      name: '千刃',
      refPath: face,
      description: '黑发一道白雷纹',
      outfit: '黑羽织绯红里',
    })
    await new ProjectStyleStore(dir).set({
      camera: '35mm anamorphic low angle',
      palette: 'copper versus teal',
      lighting: 'rim from the rail',
    })
    await new NoteStore(dir).append({ text: '对斩要硬切' })
    const canvas = new DirectorxCanvasStore(dir)
    await canvas.addNode({ kind: 'video', label: '对斩', prompt: '千刃与朔夜对斩', continuityRules: ['轴线：千刃居左'], x: 0, y: 0 })

    const harvested = await harvestSeries(dir, '破晓一刀')
    assert.ok(harvested.characters.some(card => card.name === '千刃'))
    assert.match(harvested.look.camera, /35mm/)
    assert.ok(harvested.shotRules.some(rule => /轴线/.test(rule)))

    const saved = await runSeries({ outputDir: dir, action: 'save', title: '破晓一刀', name: 'poxiao', userRoot })
    assert.equal(saved.pack.name, 'series-poxiao')
    assert.ok(saved.paths.some(path => path.includes('pack.json')))

    const listed = await runSeries({ outputDir: dest, action: 'list', userRoot })
    assert.ok(listed.items.some(item => item.name === 'series-poxiao'))

    const applied = await runSeries({ outputDir: dest, action: 'apply', name: 'poxiao', userRoot })
    assert.ok(applied.registered.includes('千刃'))
    const people = await new CharacterStore(dest).list()
    assert.ok(people.some(card => card.name === '千刃' && card.refPath !== ''))
    const look = await new ProjectStyleStore(dest).read()
    assert.match(look.camera, /35mm/)
    assert.match(applied.agentPrompt, /不要重设计/)
  } finally {
    await rm(dir, { recursive: true, force: true })
    await rm(userRoot, { recursive: true, force: true })
    await rm(dest, { recursive: true, force: true })
  }
})

test('planRevise keeps the node and does not generate', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-revise-'))
  try {
    const face = join(dir, 'face.png')
    await writeFile(face, 'png')
    await new CharacterStore(dir).register({ name: '千刃', refPath: face, description: '黑发' })
    const store = new DirectorxCanvasStore(dir)
    await store.addNode({
      kind: 'image', id: 'eyes', label: '睁眼', path: face, prompt: '千刃睁眼特写 35mm',
      characters: ['千刃'], x: 20, y: 20,
    })
    const plan = await planRevise({ outputDir: dir, nodeId: 'eyes', change: '眼神更狠一点' })
    assert.equal(plan.nodeId, 'eyes')
    assert.equal(plan.kind, 'image')
    assert.ok(plan.characters.includes('千刃'))
    assert.match(plan.prompt, /眼神更狠/)
    assert.match(plan.intentPrompt, /镜改/)
    assert.ok(plan.next.some(step => /generate_ready/.test(step)))
    assert.ok(plan.next.some(step => /canvas_update/.test(step)))
    const again = await store.read()
    assert.equal(again.nodes.find(node => node.id === 'eyes').path, face)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
