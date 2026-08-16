import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { CanvasIntentStore, CharacterStore, DirectorxCanvasStore, formatDshCanvasPrompt, ProjectStyleStore, ProposalStore, TermStore, edgeHandlePoints, flowAbsolutePosition, hitTestAbsolute, inferContinueKind, planContinueFromFlowNode, planContinueGenerate, registerCanvasIntentRoute, registerCanvasRoute, registerCharactersRoute, registerProposalsRoute } from '../lib/testing.js'

test('canvas store CRUD: add, connect, update, remove, arrange', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-canvas-'))
  try {
    const store = new DirectorxCanvasStore(dir)
    let doc = await store.read()
    assert.deepEqual(doc.nodes, [])

    doc = await store.addNode({ kind: 'image', label: '镜头1', path: '/tmp/a.png', x: 10, y: 20 })
    assert.equal(doc.nodes.length, 1)
    const first = doc.nodes[0]

    doc = await store.addNode({ kind: 'video', label: '镜头2', path: '/tmp/b.mp4' })
    const second = doc.nodes[1]

    doc = await store.addEdge({ from: first.id, to: second.id, label: '转场' })
    assert.equal(doc.edges.length, 1)

    await assert.rejects(() => store.addEdge({ from: first.id, to: 'missing' }), /existing nodes/)

    doc = await store.update(first.id, { x: 100, y: 200, label: '镜头1·改' })
    assert.equal(doc.nodes.find(node => node.id === first.id)?.label, '镜头1·改')
    assert.equal(doc.nodes.find(node => node.id === first.id)?.x, 100)

    doc = await store.arrange('grid')
    assert.ok(doc.nodes.every(node => node.x >= 0 && node.y >= 0))

    doc = await store.remove(first.id)
    assert.equal(doc.nodes.length, 1)
    assert.equal(doc.edges.length, 0, 'removing a node removes its edges')
    await assert.rejects(() => store.remove('nope'), /not found/)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('canvas grouping: members follow their group, arrange keeps children inside', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-canvas-'))
  try {
    const store = new DirectorxCanvasStore(dir)
    let doc = await store.addNode({ kind: 'group', label: '第一幕', x: 0, y: 0 })
    const group = doc.nodes[0]
    doc = await store.addNode({ kind: 'text', label: '镜头A', x: 50, y: 50, parent: group.id })
    doc = await store.addNode({ kind: 'text', label: '镜头B', x: 50, y: 120, parent: group.id })

    // Invalid parent references are dropped on write.
    doc = await store.addNode({ kind: 'text', label: '孤儿', x: 10, y: 10, parent: 'missing-group' })
    const orphan = doc.nodes.find(node => node.label === '孤儿')
    assert.equal(orphan.parent, undefined)

    // Moving the group keeps membership intact.
    doc = await store.update(group.id, { x: 200, y: 100 })
    const groupAfter = doc.nodes.find(node => node.id === group.id)
    assert.equal(groupAfter.x, 200)
    assert.equal(doc.nodes.find(node => node.label === '镜头A').parent, group.id)

    // Ungroup via parent: null.
    doc = await store.update(doc.nodes.find(node => node.label === '镜头A').id, { parent: null })
    assert.equal(doc.nodes.find(node => node.label === '镜头A').parent, undefined)

    // Arrange lays the group out and keeps its member inside.
    await store.update(doc.nodes.find(node => node.label === '镜头A').id, { parent: group.id })
    doc = await store.arrange('grid')
    const arrangedGroup = doc.nodes.find(node => node.id === group.id)
    const member = doc.nodes.find(node => node.label === '镜头A')
    assert.ok(member.x >= arrangedGroup.x && member.y >= arrangedGroup.y)
    assert.ok(member.x < arrangedGroup.x + 600 && member.y < arrangedGroup.y + 500)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('canvas read migrates legacy documents (no version/updatedAt, dangling parent)', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-canvas-'))
  try {
    const legacy = {
      nodes: [
        { id: 'a', kind: 'text', label: '旧节点', x: 5, y: 6, parent: 'ghost-group' },
        { id: 'b', kind: 'image', label: '旧图', path: '/tmp/x.png', x: 0, y: 0 },
      ],
      edges: [{ id: 'e', from: 'a', to: 'b' }],
    }
    await writeFile(join(dir, 'canvas.json'), JSON.stringify(legacy), 'utf8')
    const store = new DirectorxCanvasStore(dir)
    const doc = await store.read()
    assert.equal(doc.version, 1)
    assert.equal(doc.updatedAt, 0, 'legacy updatedAt resolves to stable 0')
    assert.equal(doc.nodes.length, 2)
    assert.equal(doc.nodes.find(node => node.id === 'a').parent, undefined, 'dangling parent dropped on read')
    assert.equal(doc.edges.length, 1)
    // A second read must keep the same stable updatedAt (no poll churn).
    const again = await store.read()
    assert.equal(again.updatedAt, 0)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('canvas store write enforces optimistic concurrency', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-canvas-'))
  try {
    const store = new DirectorxCanvasStore(dir)
    const doc = await store.read()
    const saved = await store.write({ ...doc, nodes: [{ id: 'n1', kind: 'text', label: 'a', x: 0, y: 0 }] }, doc.updatedAt)
    await assert.rejects(
      () => store.write({ ...saved, nodes: [...saved.nodes, { id: 'n2', kind: 'text', label: 'b', x: 1, y: 1 }] }, doc.updatedAt),
      error => error !== null && typeof error === 'object' && error.code === 'CANVAS_CONFLICT',
    )
    // Fresh read + updated stamp succeeds.
    const current = await store.read()
    const merged = await store.write({ ...current, nodes: [...current.nodes, { id: 'n2', kind: 'text', label: 'b', x: 1, y: 1 }] }, current.updatedAt)
    assert.equal(merged.nodes.length, 2)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('canvas search / batch / dissolve / title / hierarchy', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-canvas-'))
  try {
    const store = new DirectorxCanvasStore(dir)
    await store.batchAdd({
      nodes: [
        { id: 'g1', kind: 'group', label: '第一幕', x: 0, y: 0 },
        { id: 's1', kind: 'image', label: '镜头A', x: 10, y: 10, parent: 'g1' },
        { id: 's2', kind: 'video', label: '镜头B', x: 10, y: 60, parent: 'g1' },
      ],
      edges: [{ id: 'e1', from: 's1', to: 's2', label: '承接' }],
    })
    // search
    const found = await store.search({ label: '镜头' })
    assert.equal(found.length, 2)
    const inGroup = await store.search({ parent: 'g1' })
    assert.equal(inGroup.length, 2)
    // title
    const titled = await store.setTitle('测试标题')
    assert.equal(titled.title, '测试标题')
    // hierarchy layout
    const laid = await store.hierarchyLayout()
    const s1 = laid.nodes.find(node => node.id === 's1')
    const s2 = laid.nodes.find(node => node.id === 's2')
    assert.ok(s2.x > s1.x, 'target sits right of source (level axis)')
    // dissolve group
    const dissolved = await store.dissolveGroup('g1')
    assert.equal(dissolved.nodes.some(node => node.id === 'g1'), false)
    assert.equal(dissolved.nodes.find(node => node.id === 's1').parent, undefined)
    assert.equal(dissolved.edges.length, 1, 'member edge survives dissolution')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('character registry registers, lists and resolves anchors', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-char-'))
  try {
    const store = new CharacterStore(dir)
    const card = await store.register({ name: '主角', description: '短发、红围巾、圆脸', refPath: '/tmp/anchor.png' })
    assert.equal(card.name, '主角')
    const listed = await store.list()
    assert.equal(listed.length, 1)
    const resolved = await store.get(['主角', '不存在'])
    assert.equal(resolved.length, 1)
    assert.equal(resolved[0].refPath, '/tmp/anchor.png')
    // re-register overwrites
    await store.register({ name: '主角', description: '短发、蓝围巾', refPath: '/tmp/anchor2.png' })
    const again = await store.get(['主角'])
    assert.equal(again[0].description, '短发、蓝围巾')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('canvas branch clones a node into a labelled variant group', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-branch-'))
  try {
    const store = new DirectorxCanvasStore(dir)
    const doc = await store.addNode({ id: 'shot1', kind: 'video', label: '镜头1', path: '/tmp/a.mp4', x: 100, y: 100 })
    const branched = await store.branch('shot1', ['暖调', '冷调', '霓虹'])
    const group = branched.nodes.find(node => node.kind === 'group')
    assert.ok(group !== undefined, 'branch group created')
    const members = branched.nodes.filter(node => node.parent === group.id)
    assert.equal(members.length, 3, 'three variants')
    assert.ok(members.every(member => member.label.includes('变体')), 'variants labelled')
    const original = branched.nodes.find(node => node.id === 'shot1')
    assert.ok(original !== undefined, 'source preserved')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('speech duration estimator and aiBrief idempotent cache', async () => {
  const { estimateSpeech } = await import('../lib/testing.js')
  const estimate = estimateSpeech({ text: '这是一段测试旁白，用来验证语速预算。', lang: 'zh' }, 4)
  assert.ok(estimate.seconds > 1 && estimate.seconds < 6, `zh rate estimate, got ${estimate.seconds}s`)
  assert.equal(estimate.fits, false, 'over-window flags')
  assert.ok(estimate.suggestion !== undefined && estimate.suggestion.includes('缩'), 'shrink suggestion')
  const dir = await mkdtemp(join(tmpdir(), 'directorx-brief-'))
  try {
    const store = new DirectorxCanvasStore(dir)
    await store.addNode({ id: 'img', kind: 'image', label: '参考图', path: '/tmp/x.png', x: 0, y: 0, aiBrief: '缓存描述' })
    const doc = await store.read()
    assert.equal(doc.nodes.find(node => node.id === 'img').aiBrief, '缓存描述', 'aiBrief persists')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('continuity registry surfaces cross-shot locks', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-cont-'))
  try {
    const store = new DirectorxCanvasStore(dir)
    await store.addNode({ id: 's1', kind: 'group', label: '镜头1', x: 0, y: 0, continuityRules: ['红衣女子：黑发+红风衣', '霓虹雨夜街道'] })
    await store.addNode({ id: 's2', kind: 'group', label: '镜头2', x: 0, y: 0, continuityRules: ['红衣女子：黑发+红风衣'] })
    const registry = await store.continuity()
    assert.equal(registry.shots.length, 2, 'two shots carry rules')
    const lock = registry.locks.find(entry => entry.rule.includes('红衣女子'))
    assert.ok(lock !== undefined && lock.shotCount === 2, 'cross-shot rule becomes a continuity lock')
    const doc = await store.read()
    assert.equal(doc.nodes.find(node => node.id === 's1').continuityRules.length, 2, 'rules persist on node')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('takes query returns shot members sorted deterministically with selected take', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-takes-'))
  try {
    const store = new DirectorxCanvasStore(dir)
    await store.addNode({ id: 'shot', kind: 'group', label: '镜头A', x: 0, y: 0, shotStatus: 'review' })
    await store.addNode({ id: 't2', kind: 'video', label: 'Take B', path: '/tmp/b.mp4', parent: 'shot', x: 0, y: 0, shotIndex: 2 })
    await store.addNode({ id: 't1', kind: 'video', label: 'Take A', path: '/tmp/a.mp4', parent: 'shot', x: 0, y: 0, shotIndex: 1 })
    await store.update('shot', { selectedTakeId: 't1' })
    const result = await store.takes('shot')
    assert.equal(result.takes.length, 2)
    assert.equal(result.takes[0].id, 't1', 'sorted by shotIndex')
    assert.equal(result.selectedTakeId, 't1', 'selected take pinned')
    assert.equal(result.shotStatus, 'review')
    await assert.rejects(() => store.takes('missing'), /not found/)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('shot status lifecycle persists on nodes and rejects invalid values', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-shot-'))
  try {
    const store = new DirectorxCanvasStore(dir)
    await store.addNode({ id: 'shot1', kind: 'group', label: '镜头1', x: 0, y: 0, shotStatus: 'idea' })
    await store.update('shot1', { shotStatus: 'review' })
    const doc = await store.read()
    assert.equal(doc.nodes.find(node => node.id === 'shot1').shotStatus, 'review', 'valid status persisted')
    await store.update('shot1', { shotStatus: 'bogus' })
    const cleared = await store.read()
    assert.equal(cleared.nodes.find(node => node.id === 'shot1').shotStatus, undefined, 'invalid status cleared')
    await store.update('shot1', { shotStatus: 'locked' })
    const locked = await store.read()
    assert.equal(locked.nodes.find(node => node.id === 'shot1').shotStatus, 'locked', 'locked state persists')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('node lock guards content edits, deletes and inbound edges', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-lock-'))
  try {
    const store = new DirectorxCanvasStore(dir)
    await store.addNode({ id: 'cast', kind: 'image', label: '定妆', path: '/tmp/c.png', x: 0, y: 0, locked: true })
    await store.addNode({ id: 'shot', kind: 'video', label: '镜头', x: 0, y: 0 })
    // position move allowed
    await store.update('cast', { x: 120 })
    // content change denied
    await assert.rejects(() => store.update('cast', { prompt: '改设定' }), /已锁定/)
    // delete denied
    await assert.rejects(() => store.remove('cast'), /拒绝删除/)
    // inbound edge denied
    await assert.rejects(() => store.addEdge({ id: 'e1', from: 'shot', to: 'cast' }), /拒绝新入边/)
    // outbound edge allowed
    await store.addEdge({ id: 'e2', from: 'cast', to: 'shot', sourceVariantIdx: 1 })
    const doc = await store.read()
    const edge = doc.edges.find(candidate => candidate.id === 'e2')
    assert.equal(edge.sourceVariantIdx, 1, 'per-edge variant binding stored')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('canvas prompt synthesis walks upstream with prompt-first blocks', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-prompt-'))
  try {
    const store = new DirectorxCanvasStore(dir)
    await store.addNode({ id: 'char', kind: 'text', label: '红衣女子', prompt: '三十岁，黑发，红风衣' })
    await store.addNode({ id: 'ref1', kind: 'image', label: '参考图A', path: '/tmp/a.png', x: 0, y: 0 })
    await store.addNode({ id: 'dir', kind: 'text', label: '霓虹雨夜', prompt: '赛博朋克霓虹，雨夜小巷' })
    await store.addNode({ id: 'shot', kind: 'video', label: '镜头1', x: 0, y: 0, prompt: '她转身回眸' })
    await store.addEdge({ id: 'e1', from: 'char', to: 'ref1' })
    await store.addEdge({ id: 'e2', from: 'ref1', to: 'shot' })
    await store.addEdge({ id: 'e3', from: 'dir', to: 'shot' })
    const synth = await store.promptFor('shot')
    assert.equal(synth.ownPrompt, '她转身回眸', 'own prompt wins')
    assert.equal(synth.blocks.references.length, 1, 'one reference')
    assert.equal(synth.blocks.references[0].n, 1, 'ref_image_N slot numbering')
    assert.equal(synth.blocks.subjects[0].id, 'char', 'grandparent character traced')
    assert.ok(synth.blocks.directions.includes('赛博朋克霓虹，雨夜小巷'), 'direction collected')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('edge type matrix and deterministic shot ordering', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-order-'))
  try {
    const store = new DirectorxCanvasStore(dir)
    await store.addNode({ id: 's2', kind: 'video', label: '镜2', x: 0, y: 0, shotIndex: 2 })
    await store.addNode({ id: 's1', kind: 'video', label: '镜1', x: 0, y: 0, shotIndex: 1 })
    await store.addNode({ id: 's0', kind: 'video', label: '无号', x: 0, y: 0 })
    await store.addNode({ id: 't1', kind: 'text', label: '文本', x: 0, y: 0 })
    await store.addNode({ id: 'img1', kind: 'image', label: '图', x: 0, y: 0 })
    // type matrix: text/group cannot be targets; video cannot feed image
    await assert.rejects(() => store.addEdge({ id: 'e1', from: 's1', to: 't1' }), /reason/)
    await assert.rejects(() => store.addEdge({ id: 'e2', from: 's1', to: 'img1' }), /video 不能喂给 image/)
    await store.addEdge({ id: 'e3', from: 't1', to: 'img1' })
    // deterministic order
    const order = await store.shotSequence()
    assert.deepEqual(order.map(item => item.id), ['s1', 's2', 's0', 'img1'], 'shotIndex order wins, unnumbered last')
    const rows = await store.summary()
    assert.ok(rows.some(row => row.startsWith('s1|video#1|')), 'compact summary row format')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('srt lint and term dictionary serve the localization checks', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-terms-'))
  try {
    const store = new TermStore(dir)
    await store.set([{ term: 'DirectorX', reading: 'Director X' }, { term: '可灵', reading: 'Kling' }])
    const hits = await store.match('今天用 DirectorX 和可灵做视频')
    assert.equal(hits.length, 2, 'both terms hit by sentence')
    assert.equal(hits.find(entry => entry.term === 'DirectorX').reading, 'Director X')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('srt normalize merges gaps and extends short cues', async () => {
  const { srtNormalize, cleanSpeechText, weightedWidth } = await import('../lib/testing.js')
  const content = '1\n00:00:00,000 --> 00:00:00,500\n第一句\n\n2\n00:00:04,000 --> 00:00:06,000\n第二句（掌声）——结束\n'
  const out = srtNormalize(content)
  assert.ok(out.applied.some(note => note.includes('extended')), 'short cue extended')
  assert.ok(out.srt.includes('00:00:02,500'), 'extension capped at 2.5s below next start')
  assert.equal(cleanSpeechText('大家好（掌声）[音乐] 这是——测试™'), '大家好 这是，测试')
  assert.ok(weightedWidth('中文测试') > 4, 'CJK weighted width')
})

test('srt lint flags line width, cps, duration and ordering', async () => {
  const { srtLint } = await import('../lib/testing.js')
  const content = '2\n00:00:01,000 --> 00:00:01,500\n这是一条超过十六个字的超长字幕行用来测试单行宽度限制的问题\n\n4\n00:00:03,000 --> 00:00:04,000\n短\n'
  const out = srtLint(content)
  assert.ok(out.issues.some(issue => issue.kind === 'line-width'), 'long line flagged')
  assert.ok(out.issues.some(issue => issue.kind === 'duration'), 'short duration flagged')
  assert.ok(out.issues.some(issue => issue.kind === 'ordering'), 'gap in numbering flagged')
})

test('style constants lock merges and persists across set calls', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-style-'))
  try {
    const store = new ProjectStyleStore(dir)
    assert.equal(await store.read(), null, 'empty -> null')
    const first = await store.set({ camera: '35mm anamorphic', palette: '青橙' })
    assert.equal(first.camera, '35mm anamorphic')
    const second = await store.set({ lighting: '左窗主光 5600K' })
    assert.equal(second.camera, '35mm anamorphic', 'merge keeps prior fields')
    assert.equal(second.lighting, '左窗主光 5600K')
    const reread = await store.read()
    assert.equal(reread.palette, '青橙')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('proposal stage gating, reject reasons, lineage and precheck', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-gate-'))
  try {
    const store = new ProposalStore(dir)
    await store.propose({ kind: 'video', prompt: '分镜确认', count: 1, stage: 'shot' })
    await store.propose({ kind: 'image', prompt: '角色定妆', count: 1, stage: 'character' })
    const next = await store.next()
    assert.equal(next.stage, 'character', 'earlier open stage wins the queue')
    // precheck rejects bad input
    await assert.rejects(() => store.propose({ kind: 'video', prompt: '', count: 1 }), /预检/)
    await assert.rejects(() => store.propose({ kind: 'video', prompt: 'x', count: 1, duration: 999 }), /duration/)
    // reject with reason + regenerate lineage
    const rejected = await store.update(next.id, 'rejected', { rejectReason: '服装不符' })
    assert.equal(rejected.rejectReason, '服装不符')
    const child = await store.regenerate(rejected.id, { prompt: '角色定妆 v2' })
    assert.equal(child.parentId, rejected.id)
    assert.equal(child.attempts, 1)
    assert.equal(child.status, 'proposed')
    // taskId checkpoint
    const checked = await store.update(child.id, 'approved', { taskId: 'task-42' })
    assert.equal(checked.taskId, 'task-42')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('canvas snapshots checkpoint and restore (undo this batch)', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-snap-'))
  try {
    const store = new DirectorxCanvasStore(dir)
    await store.addNode({ id: 'n1', kind: 'text', label: '原稿', x: 0, y: 0 })
    const snap = await store.snapshot('proposal-p1')
    await store.addNode({ id: 'n2', kind: 'text', label: '执行后新增', x: 0, y: 0 })
    const before = await store.read()
    assert.equal(before.nodes.length, 2, 'mutation applied')
    await store.restoreSnapshot(snap.id)
    const after = await store.read()
    assert.equal(after.nodes.length, 1, 'snapshot restores pre-batch state')
    assert.equal(after.nodes[0].label, '原稿')
    const index = await store.readSnapshotsIndex()
    assert.ok(index.some(entry => entry.id === snap.id), 'index lists the checkpoint')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('proposal next returns the oldest pending item for the approval loop', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-next-'))
  try {
    const store = new ProposalStore(dir)
    assert.equal(await store.next(), null, 'empty queue -> null')
    await store.propose({ kind: 'image', prompt: '第一张', count: 1 })
    await store.propose({ kind: 'image', prompt: '第二张', count: 1 })
    const next = await store.next()
    assert.equal(next.prompt, '第一张', 'oldest first')
    await store.update(next.id, 'approved')
    const afterApproval = await store.next()
    assert.equal(afterApproval.prompt, '第一张', 'approved executes first (approval-execution loop)')
    await store.update(next.id, 'done', { taskId: 'task-1' })
    const after = await store.next()
    assert.equal(after.prompt, '第二张', 'queue advances once executed')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('proposal lifecycle mirrors onto a linked canvas node', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-prop-canvas-'))
  try {
    const canvas = new DirectorxCanvasStore(dir)
    const doc = await canvas.addNode({ id: 'shotA', kind: 'text', label: '雨夜镜头', x: 10, y: 10 })
    const store = new ProposalStore(dir)
    const proposal = await store.propose({ kind: 'video', prompt: '雨夜霓虹', count: 1, canvasNodeId: 'shotA' })
    assert.equal(proposal.canvasNodeId, 'shotA')
    // status marker helper mirrors what the tool layer does
    const marker = { proposed: '[提案] ', approved: '[已批准] ', rejected: '[已拒绝] ', done: '[已完成] ' }
    for (const status of ['approved', 'done'] ) {
      const updated = await store.update(proposal.id, status)
      const node = (await canvas.read()).nodes.find(candidate => candidate.id === 'shotA')
      const bare = String(node.label).replace(/^\[(已批准|已完成|已拒绝|提案)\] /, '')
      await canvas.update('shotA', { label: `${marker[updated.status]}${bare}` }, (await canvas.read()).updatedAt)
    }
    const finalNode = (await canvas.read()).nodes.find(candidate => candidate.id === 'shotA')
    assert.ok(finalNode.label.startsWith('[已完成] '), 'status mirrored to the node label')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('proposal ledger queues, filters and updates without spending', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-prop-'))
  try {
    const store = new ProposalStore(dir)
    const proposal = await store.propose({ kind: 'video', prompt: '雨夜霓虹镜头', count: 3, duration: 5 })
    assert.equal(proposal.status, 'proposed')
    const listed = await store.list()
    assert.equal(listed.length, 1)
    const approved = await store.update(proposal.id, 'approved')
    assert.equal(approved.status, 'approved')
    const pending = await store.list('proposed')
    assert.equal(pending.length, 0)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('canvas reset clears the doc and keeps a timestamped backup', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-canvas-'))
  try {
    const store = new DirectorxCanvasStore(dir)
    await store.addNode({ kind: 'text', label: '要保留的内容', x: 0, y: 0 })
    const reset = await store.reset()
    assert.equal(reset.nodes.length, 0)
    assert.equal(reset.edges.length, 0)
    const entries = await readdir(dir)
    const backup = entries.find(name => name.startsWith('canvas.json.bak-'))
    assert.ok(backup !== undefined, 'backup file exists')
    const backed = JSON.parse(await readFile(join(dir, backup), 'utf8'))
    assert.equal(backed.nodes.length, 1, 'backup contains the previous doc')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('canvas route PUT preserves the document title', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-canvas-'))
  try {
    const store = new DirectorxCanvasStore(dir)
    await store.addNode({ kind: 'text', label: 'x', x: 0, y: 0 })
    const current = await store.read()
    const withTitle = await store.write({ version: 1, updatedAt: 0, title: '雨夜霓虹短片', nodes: current.nodes, edges: [] }, current.updatedAt)
    assert.equal(withTitle.title, '雨夜霓虹短片')
    const again = await store.read()
    assert.equal(again.title, '雨夜霓虹短片')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('canvas route GET/PUT round-trips with conflict handling', async () => {
  const handlers = new Map()
  const server = createServer((request, response) => {
    const handler = handlers.get(new URL(request.url ?? '/', 'http://x').pathname)
    if (handler === undefined) { response.writeHead(404); response.end(); return }
    void handler(request, response)
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const dir = await mkdtemp(join(tmpdir(), 'directorx-canvas-'))
  const port = typeof server.address() === 'object' && server.address() !== null ? server.address().port : 0
  try {
    const fakeCtx = {
      get(name) {
        if (name !== 'webServer') return undefined
        return { register: route => { handlers.set(route.path, route.handler); return () => handlers.delete(route.path) } }
      },
    }
    registerCanvasRoute(fakeCtx, () => dir)
    const base = `http://127.0.0.1:${port}/directorx/canvas`

    const empty = await fetch(base).then(response => response.json())
    assert.equal(empty.nodes.length, 0)

    const put = await fetch(`${base}?expectedUpdatedAt=${empty.updatedAt}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ nodes: [{ id: 'n1', kind: 'text', label: 'hi', x: 0, y: 0 }], edges: [] }),
    })
    assert.equal(put.status, 200)
    const saved = await put.json()
    assert.equal(saved.nodes[0].label, 'hi')

    // Stale write → 409.
    const stale = await fetch(`${base}?expectedUpdatedAt=${empty.updatedAt}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ nodes: [], edges: [] }),
    })
    assert.equal(stale.status, 409)

    const reloaded = await fetch(base).then(response => response.json())
    assert.equal(reloaded.nodes.length, 1)
  } finally {
    server.close()
    await rm(dir, { recursive: true, force: true })
  }
})

test('canvas write preserves shot status, continuity, and variant-bound edges', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-canvas-'))
  try {
    const store = new DirectorxCanvasStore(dir)
    let doc = await store.addNode({ kind: 'group', label: '镜头1', x: 0, y: 0, shotStatus: 'review', selectedTakeId: 'take-a', continuityRules: ['同一外套'] })
    const group = doc.nodes[0]
    doc = await store.addNode({ kind: 'image', label: 'A', path: '/tmp/a.png', x: 40, y: 40, prompt: 'neon alley', shotStatus: 'generating' })
    const imageA = doc.nodes.find(node => node.label === 'A')
    doc = await store.addNode({ kind: 'video', label: 'B', path: '/tmp/b.mp4', x: 280, y: 40 })
    const imageB = doc.nodes.find(node => node.label === 'B')
    doc = await store.addEdge({ from: imageA.id, to: imageB.id, sourceVariantIdx: 2 })
    const again = await store.read()
    const savedGroup = again.nodes.find(node => node.id === group.id)
    const savedImage = again.nodes.find(node => node.id === imageA.id)
    assert.equal(savedGroup.shotStatus, 'review')
    assert.equal(savedGroup.selectedTakeId, 'take-a')
    assert.deepEqual(savedGroup.continuityRules, ['同一外套'])
    assert.equal(savedImage.prompt, 'neon alley')
    assert.equal(savedImage.shotStatus, 'generating')
    assert.equal(again.edges[0].sourceVariantIdx, 2)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('canvas client portals the custom wire layer into the xyflow viewport', async () => {
  const source = await readFile(new URL('../src/client/CanvasTab.tsx', import.meta.url), 'utf8')
  assert.match(source, /ViewportPortal/)
  const portalAt = source.indexOf('<ViewportPortal>')
  const edgesAt = source.indexOf('className="directorx-edges"')
  const guidesAt = source.indexOf('className="directorx-guides"')
  assert.ok(portalAt >= 0 && edgesAt > portalAt, 'directorx-edges is inside a ViewportPortal')
  assert.ok(guidesAt > portalAt, 'guides also go through ViewportPortal')
  assert.match(source, /edges=\{\[\]\}/)
  assert.match(source, /flowAbsolutePosition/)
  assert.match(source, /\/directorx\/canvas\/intent/)
  assert.match(source, /onAskDsh/)
  assert.match(source, /CanvasCommandPalette/)
  assert.match(source, /CanvasContextDrawer/)
  const palette = await readFile(new URL('../src/client/CanvasCommandPalette.tsx', import.meta.url), 'utf8')
  assert.match(palette, /from 'cmdk'/)
  const drawer = await readFile(new URL('../src/client/CanvasContextDrawer.tsx', import.meta.url), 'utf8')
  assert.match(drawer, /\/directorx\/characters/)
})

test('flowAbsolutePosition and edgeHandlePoints attach wires to grouped nodes', () => {
  const group = { id: 'g1', position: { x: 400, y: 80 } }
  const child = { id: 'c1', position: { x: 46, y: 64 }, parentId: 'g1' }
  const sibling = { id: 's1', position: { x: 900, y: 200 } }
  const byId = new Map([group, child, sibling].map(node => [node.id, node]))
  const childAbs = flowAbsolutePosition(child, byId)
  assert.deepEqual(childAbs, { x: 446, y: 144 })
  const handles = edgeHandlePoints(
    { ...childAbs, width: 220, height: 188 },
    { ...flowAbsolutePosition(sibling, byId), width: 220, height: 188 },
  )
  assert.equal(handles.sourceX, 446 + 220)
  assert.equal(handles.sourceY, 144 + 94)
  assert.equal(handles.targetX, 900)
  assert.equal(handles.targetY, 200 + 94)
  assert.equal(hitTestAbsolute({ x: 450, y: 150 }, [
    { id: 'c1', x: childAbs.x, y: childAbs.y, width: 220, height: 188 },
    { id: 's1', x: 900, y: 200, width: 220, height: 188 },
  ]), 'c1')
  assert.equal(hitTestAbsolute({ x: 10, y: 10 }, [
    { id: 'c1', x: childAbs.x, y: childAbs.y, width: 220, height: 188 },
  ]), undefined)
})

test('planContinueFromFlowNode places a grouped source placeholder in parent-absolute space', () => {
  const nodes = [
    { id: 'g1', position: { x: 400, y: 80 } },
    { id: 'c1', position: { x: 46, y: 64 }, parentId: 'g1' },
  ]
  const planned = planContinueFromFlowNode({
    source: { id: 'c1', position: { x: 46, y: 64 }, parentId: 'g1', width: 220, kind: 'image' },
    nodes,
    prompt: '同一人走出分组',
  })
  assert.equal(planned.node.x, 400 + 46 + 220 + 80)
  assert.equal(planned.node.y, 80 + 64)
  assert.equal(planned.edgeFrom, 'c1')
  const handles = edgeHandlePoints(
    { x: 400 + 46, y: 80 + 64, width: 220, height: 188 },
    { x: planned.node.x, y: planned.node.y, width: planned.node.width, height: planned.node.height },
  )
  assert.equal(handles.sourceX, planned.node.x - 80)
  assert.equal(handles.targetX, planned.node.x)
})

test('planContinueGenerate rejects empty prompt and wires a downstream placeholder', () => {
  assert.throws(() => planContinueGenerate({ prompt: '   ' }), /prompt 不能为空/)
  assert.equal(inferContinueKind('image'), 'video')
  assert.equal(inferContinueKind('text'), 'image')
  const planned = planContinueGenerate({
    source: { id: 'src-1', x: 10, y: 20, width: 200, kind: 'image' },
    prompt: '雨夜霓虹巷跟镜头',
  })
  assert.equal(planned.node.kind, 'video')
  assert.equal(planned.node.shotStatus, 'generating')
  assert.equal(planned.node.prompt, '雨夜霓虹巷跟镜头')
  assert.equal(planned.node.x, 10 + 200 + 80)
  assert.equal(planned.node.y, 20)
  assert.equal(planned.edgeFrom, 'src-1')
  assert.equal(planned.proposal.count, 1)
  assert.equal(planned.proposal.note, 'from:src-1')
})

test('store continueGenerate writes a wired generating node the proposals route can bind', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-continue-'))
  const handlers = new Map()
  const server = createServer((request, response) => {
    const handler = handlers.get(new URL(request.url ?? '/', 'http://x').pathname)
    if (handler === undefined) { response.writeHead(404); response.end(); return }
    void handler(request, response)
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const port = typeof server.address() === 'object' && server.address() !== null ? server.address().port : 0
  try {
    const store = new DirectorxCanvasStore(dir)
    let doc = await store.addNode({ kind: 'image', label: '定妆', path: '/tmp/a.png', x: 40, y: 80, width: 220 })
    const source = doc.nodes[0]
    const result = await store.continueGenerate({ sourceId: source.id, prompt: '同一人走入雨巷' })
    assert.equal(result.doc.nodes.length, 2)
    const created = result.doc.nodes.find(node => node.id === result.nodeId)
    assert.equal(created.kind, 'video')
    assert.equal(created.shotStatus, 'generating')
    assert.equal(created.prompt, '同一人走入雨巷')
    assert.equal(result.doc.edges.length, 1)
    assert.equal(result.doc.edges[0].from, source.id)
    assert.equal(result.doc.edges[0].to, result.nodeId)
    assert.equal(result.proposal.canvasNodeId, result.nodeId)

    const fakeCtx = {
      get(name) {
        if (name !== 'webServer') return undefined
        return { register: route => { handlers.set(route.path, route.handler); return () => handlers.delete(route.path) } }
      },
    }
    registerProposalsRoute(fakeCtx, () => dir)
    const posted = await fetch(`http://127.0.0.1:${port}/directorx/proposals`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(result.proposal),
    })
    assert.equal(posted.status, 200)
    const body = await posted.json()
    assert.equal(body.ok, true)
    assert.equal(body.proposal.canvasNodeId, result.nodeId)
    assert.equal(body.proposal.prompt, '同一人走入雨巷')
    assert.equal(body.proposal.status, 'proposed')
  } finally {
    server.close()
    await rm(dir, { recursive: true, force: true })
  }
})

test('canvas intents are DSH-owned: enqueue does not write canvas nodes', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-intent-'))
  try {
    const canvas = new DirectorxCanvasStore(dir)
    const store = new CanvasIntentStore(dir)
    await canvas.addNode({ kind: 'image', label: '定妆', path: '/tmp/a.png', x: 10, y: 10 })
    await assert.rejects(() => store.enqueue({ kind: 'image', prompt: '  ' }), /prompt 不能为空/)
    const intent = await store.enqueue({ kind: 'video', prompt: '雨巷跟镜头', sourceId: 'src-1', selectedIds: ['src-1'], characters: ['阿宁'] })
    assert.equal(intent.status, 'pending')
    assert.deepEqual(intent.characters, ['阿宁'])
    const after = await canvas.read()
    assert.equal(after.nodes.length, 1, 'intent enqueue must not add canvas nodes')
    const text = formatDshCanvasPrompt(intent, { sourceLabel: '定妆' })
    assert.match(text, /请由你掌管画布/)
    assert.match(text, /directorx_canvas_continue/)
    assert.match(text, /src-1/)
    assert.match(text, /不要让画布 UI 自己写 generating 节点/)
    assert.match(text, /角色锚点: 阿宁/)
    assert.match(text, /characters 参数/)
    const bare = await store.enqueue({ kind: 'image', prompt: '空镜' })
    assert.deepEqual(bare.characters, [])
    assert.doesNotMatch(formatDshCanvasPrompt(bare), /角色锚点/)
    const taken = await store.ack(intent.id, 'taken')
    assert.equal(taken.status, 'taken')
    const done = await store.ack(intent.id, 'done')
    assert.equal(done.status, 'done')
    await assert.rejects(() => store.ack(intent.id, 'taken'), /cannot move done/)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('takeNext claims the oldest pending intent and never double-takes', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-claim-'))
  try {
    const store = new CanvasIntentStore(dir)
    const first = await store.enqueue({ kind: 'image', prompt: '旧指令' })
    const second = await store.enqueue({ kind: 'video', prompt: '新指令' })
    const claimed = await store.takeNext()
    assert.equal(claimed?.id, first.id)
    assert.equal(claimed?.status, 'taken')
    assert.equal(typeof claimed?.takenAt, 'number')
    assert.ok(claimed.takenAt >= first.at)
    const claimedAgain = await store.takeNext()
    assert.equal(claimedAgain?.id, second.id)
    assert.equal(await store.takeNext(), null)
    const listed = await store.list('taken')
    assert.equal(listed.length, 2)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('POST /directorx/canvas/intent queues a directive without mutating the board', async () => {
  const handlers = new Map()
  const server = createServer((request, response) => {
    const handler = handlers.get(new URL(request.url ?? '/', 'http://x').pathname)
    if (handler === undefined) { response.writeHead(404); response.end(); return }
    void handler(request, response)
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const dir = await mkdtemp(join(tmpdir(), 'directorx-intent-http-'))
  const port = typeof server.address() === 'object' && server.address() !== null ? server.address().port : 0
  try {
    const canvas = new DirectorxCanvasStore(dir)
    await canvas.addNode({ kind: 'text', label: '场记', x: 0, y: 0 })
    const fakeCtx = {
      get(name) {
        if (name !== 'webServer') return undefined
        return { register: route => { handlers.set(route.path, route.handler); return () => handlers.delete(route.path) } }
      },
    }
    registerCanvasIntentRoute(fakeCtx, () => dir)
    const missing = await fetch(`http://127.0.0.1:${port}/directorx/canvas/intent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ kind: 'image' }),
    })
    assert.equal(missing.status, 400)
    const created = await fetch(`http://127.0.0.1:${port}/directorx/canvas/intent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ kind: 'image', prompt: '霓虹巷', sourceId: 'n1', characters: ['阿宁'] }),
    })
    assert.equal(created.status, 200)
    const body = await created.json()
    assert.equal(body.ok, true)
    assert.equal(body.intent.prompt, '霓虹巷')
    assert.deepEqual(body.intent.characters, ['阿宁'])
    assert.match(body.prompt, /掌管画布/)
    assert.match(body.prompt, /阿宁/)
    const board = await canvas.read()
    assert.equal(board.nodes.length, 1)
    assert.equal(board.nodes[0].kind, 'text')

    const listed = await fetch(`http://127.0.0.1:${port}/directorx/canvas/intent`).then(r => r.json())
    assert.equal(listed.intents.length, 1)
    assert.equal(listed.intents[0].status, 'pending')

    const cancelled = await fetch(`http://127.0.0.1:${port}/directorx/canvas/intent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: body.intent.id, status: 'cancelled' }),
    })
    assert.equal(cancelled.status, 200)
    const afterCancel = await cancelled.json()
    assert.equal(afterCancel.intent.status, 'cancelled')

    await fetch(`http://127.0.0.1:${port}/directorx/canvas/intent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ kind: 'video', prompt: '先入队旧的' }),
    })
    await fetch(`http://127.0.0.1:${port}/directorx/canvas/intent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ kind: 'image', prompt: '后入队新的' }),
    })
    const claimed = await fetch(`http://127.0.0.1:${port}/directorx/canvas/intent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ claim: true }),
    }).then(r => r.json())
    assert.equal(claimed.ok, true)
    assert.equal(claimed.intent.prompt, '先入队旧的')
    assert.equal(claimed.intent.status, 'taken')
    assert.match(claimed.prompt, /claim: true/)
    const claimedAgain = await fetch(`http://127.0.0.1:${port}/directorx/canvas/intent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ claim: true }),
    }).then(r => r.json())
    assert.equal(claimedAgain.intent.prompt, '后入队新的')
    const empty = await fetch(`http://127.0.0.1:${port}/directorx/canvas/intent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ claim: true }),
    }).then(r => r.json())
    assert.equal(empty.intent, null)
    const replay = await fetch(`http://127.0.0.1:${port}/directorx/canvas/intent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: claimed.intent.id, status: 'taken' }),
    })
    assert.equal(replay.status, 409)
  } finally {
    server.close()
    await rm(dir, { recursive: true, force: true })
  }
})

test('GET/POST /directorx/characters is a library write, not a canvas write', async () => {
  const handlers = new Map()
  const server = createServer((request, response) => {
    const handler = handlers.get(new URL(request.url ?? '/', 'http://x').pathname)
    if (handler === undefined) { response.writeHead(404); response.end(); return }
    void handler(request, response)
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const dir = await mkdtemp(join(tmpdir(), 'directorx-chars-'))
  const port = typeof server.address() === 'object' && server.address() !== null ? server.address().port : 0
  try {
    const canvas = new DirectorxCanvasStore(dir)
    await canvas.addNode({ kind: 'text', label: '场记', x: 0, y: 0 })
    const fakeCtx = {
      get(name) {
        if (name !== 'webServer') return undefined
        return { register: route => { handlers.set(route.path, route.handler); return () => handlers.delete(route.path) } }
      },
    }
    registerCharactersRoute(fakeCtx, () => dir)
    const base = `http://127.0.0.1:${port}/directorx/characters`
    const missing = await fetch(base, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '阿宁' }),
    })
    assert.equal(missing.status, 400)
    const created = await fetch(base, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '阿宁', refPath: '/tmp/ning.png', description: '短发红外套' }),
    })
    assert.equal(created.status, 200)
    const listed = await fetch(base).then(r => r.json())
    assert.equal(listed.characters.length, 1)
    assert.equal(listed.characters[0].name, '阿宁')
    const board = await canvas.read()
    assert.equal(board.nodes.length, 1, 'character register must not add canvas nodes')
    const removed = await fetch(base, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '阿宁', remove: true }),
    })
    assert.equal(removed.status, 200)
    const empty = await fetch(base).then(r => r.json())
    assert.equal(empty.characters.length, 0)
  } finally {
    server.close()
    await rm(dir, { recursive: true, force: true })
  }
})

test('proposals route POST creates a canvas-bound proposal', async () => {
  const handlers = new Map()
  const server = createServer((request, response) => {
    const handler = handlers.get(new URL(request.url ?? '/', 'http://x').pathname)
    if (handler === undefined) { response.writeHead(404); response.end(); return }
    void handler(request, response)
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const dir = await mkdtemp(join(tmpdir(), 'directorx-proposals-'))
  const port = typeof server.address() === 'object' && server.address() !== null ? server.address().port : 0
  try {
    const fakeCtx = {
      get(name) {
        if (name !== 'webServer') return undefined
        return { register: route => { handlers.set(route.path, route.handler); return () => handlers.delete(route.path) } }
      },
    }
    registerProposalsRoute(fakeCtx, () => dir)
    const base = `http://127.0.0.1:${port}/directorx/proposals`

    const missing = await fetch(base, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ kind: 'image' }),
    })
    assert.equal(missing.status, 400)

    const created = await fetch(base, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ kind: 'image', prompt: '雨夜霓虹巷', canvasNodeId: 'image-abc', count: 1 }),
    })
    assert.equal(created.status, 200)
    const body = await created.json()
    assert.equal(body.ok, true)
    assert.equal(body.proposal.kind, 'image')
    assert.equal(body.proposal.prompt, '雨夜霓虹巷')
    assert.equal(body.proposal.canvasNodeId, 'image-abc')
    assert.equal(body.proposal.status, 'proposed')

    const listed = await fetch(base).then(response => response.json())
    assert.equal(listed.proposals.length, 1)
    assert.equal(listed.proposals[0].canvasNodeId, 'image-abc')
  } finally {
    server.close()
    await rm(dir, { recursive: true, force: true })
  }
})
