import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { DirectorxCanvasStore, registerCanvasGenerateRoute } from '../lib/testing.js'

function mockCap(enabled = true) {
  return {
    enabled,
    mode: 'mock',
    baseURL: '',
    apiKey: '',
    model: 'mock',
    resolution: '1K',
    auth: { klingAk: '', klingSk: '', runwayVersion: '' },
  }
}

function settings(dir, imageEnabled = true) {
  const cap = mockCap(true)
  return {
    outputDir: dir,
    timeoutMs: 5000,
    pollIntervalMs: 10,
    maxPollAttempts: 2,
    persona: '成片',
    initiative: '协同',
    vision: cap,
    image: mockCap(imageEnabled),
    video: mockCap(false),
    audio: mockCap(false),
  }
}

async function withRoute(dir, run) {
  const handlers = new Map()
  const server = createServer((request, response) => {
    const handler = handlers.get(new URL(request.url ?? '/', 'http://x').pathname)
    if (handler === undefined) { response.writeHead(404); response.end(); return }
    void handler(request, response)
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const port = typeof server.address() === 'object' && server.address() !== null ? server.address().port : 0
  try {
    registerCanvasGenerateRoute({
      get(name) {
        if (name !== 'webServer') return undefined
        return { register: route => { handlers.set(route.path, route.handler); return () => handlers.delete(route.path) } }
      },
    }, () => settings(dir))
    await run(port)
  } finally {
    server.close()
  }
}

test('POST /directorx/canvas/generate writes a mock image onto the node', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-canvas-job-'))
  try {
    const store = new DirectorxCanvasStore(dir)
    await store.write({
      version: 1,
      updatedAt: 0,
      nodes: [{ id: 'img-1', kind: 'image', label: '镜头', prompt: '一只猫', x: 0, y: 0 }],
      edges: [],
    })
    await withRoute(dir, async port => {
      const missing = await fetch(`http://127.0.0.1:${port}/directorx/canvas/generate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind: 'image', nodeId: 'img-1' }),
      })
      assert.equal(missing.status, 400)

      const created = await fetch(`http://127.0.0.1:${port}/directorx/canvas/generate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind: 'image', nodeId: 'img-1', prompt: '一只猫', task: 'enhance' }),
      })
      assert.equal(created.status, 200)
      const body = await created.json()
      assert.equal(body.ok, true)
      assert.equal(body.nodeId, 'img-1')
      assert.equal(body.task, 'enhance')
      assert.ok(typeof body.path === 'string' && body.path !== '')
      const node = body.doc.nodes.find(item => item.id === 'img-1')
      assert.equal(node.path, body.path)
      assert.equal(node.shotStatus, 'review')
      assert.match(node.prompt, /高清放大/)
    })
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('POST /directorx/canvas/generate rejects when image is disabled', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-canvas-job-off-'))
  const handlers = new Map()
  const server = createServer((request, response) => {
    const handler = handlers.get(new URL(request.url ?? '/', 'http://x').pathname)
    if (handler === undefined) { response.writeHead(404); response.end(); return }
    void handler(request, response)
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const port = typeof server.address() === 'object' && server.address() !== null ? server.address().port : 0
  try {
    registerCanvasGenerateRoute({
      get(name) {
        if (name !== 'webServer') return undefined
        return { register: route => { handlers.set(route.path, route.handler); return () => handlers.delete(route.path) } }
      },
    }, () => settings(dir, false))
    const response = await fetch(`http://127.0.0.1:${port}/directorx/canvas/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ kind: 'image', nodeId: 'img-1', prompt: 'x' }),
    })
    assert.equal(response.status, 400)
    const body = await response.json()
    assert.match(body.message, /未开启/)
  } finally {
    server.close()
    await rm(dir, { recursive: true, force: true })
  }
})
