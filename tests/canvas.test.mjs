import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { CharacterStore, DirectorxCanvasStore, ProjectStyleStore, ProposalStore, registerCanvasRoute } from '../lib/testing.js'

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
        { id: 's1', kind: 'text', label: '镜头A', x: 10, y: 10, parent: 'g1' },
        { id: 's2', kind: 'text', label: '镜头B', x: 10, y: 60, parent: 'g1' },
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
    const after = await store.next()
    assert.equal(after.prompt, '第二张', 'queue advances')
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
