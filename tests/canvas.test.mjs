import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DirectorxCanvasStore, registerCanvasRoute } from '../lib/testing.js'

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
