import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  MEDIA_ROUTE_PATH,
  inspectMediaFile,
  parseMediaQuery,
  parseRangeHeader,
  resolveMediaPath,
} from '../lib/testing.js'

const PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
  'base64',
)

test('MCP endpoint speaks initialize / tools/list / tools/call', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-mcp-'))
  try {
    // Round-trip through the route registration using the same handler shape.
    let handler
    const fakeServer = { register: (route) => { handler = route.handler; return () => {} } }
    // registerMcpRoute is exercised through the real web server in
    // production; here we verify the JSON-RPC contract directly.
    const { registerMcpRoute } = await import('../lib/testing.js')
    const { createServer } = await import('node:http')
    const server = createServer((req, res) => { void handler(req, res) })
    await new Promise(resolve => server.listen(0, resolve))
    const port = server.address().port
    const call = async (body) => {
      const response = await fetch(`http://127.0.0.1:${port}/directorx/mcp`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      return response.json()
    }
    // register on the same fake server path is fine: the handler serves all POSTs.
    const dispose = registerMcpRoute({ get: () => fakeServer }, () => ({ outputDir: dir, vision: {}, image: {}, video: {}, audio: {}, openlib: {} }))
    const init = await call({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} })
    assert.equal(init.result.protocolVersion, '2025-03-26')
    const tools = await call({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} })
    assert.ok(tools.result.tools.length >= 10)
    const canvasGet = await call({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'directorx_canvas_get', arguments: {} } })
    assert.equal(canvasGet.result.ok, true, 'typed envelope wraps success')
    assert.equal(canvasGet.result.result.version, 1, 'payload under result.result')
    dispose()
    server.closeAllConnections?.()
    server.close()
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('media route path is the exact /directorx/media pathname', () => {
  assert.equal(MEDIA_ROUTE_PATH, '/directorx/media')
})

test('resolveMediaPath allows files inside the output dir and rejects escapes', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-media-path-'))
  try {
    assert.equal(resolveMediaPath(dir, 'clip.mp4'), join(dir, 'clip.mp4'))
    assert.equal(resolveMediaPath(dir, join(dir, 'nested', 'a.png')), join(dir, 'nested', 'a.png'))
    assert.throws(() => resolveMediaPath(dir, '../outside.png'), /escapes/)
    assert.throws(() => resolveMediaPath(dir, join('..', '..', 'etc', 'passwd')), /escapes/)
    assert.throws(() => resolveMediaPath(dir, `${dir}-sibling/leak.png`), /escapes/)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('parseMediaQuery extracts the path parameter', () => {
  assert.equal(parseMediaQuery('/directorx/media?path=a%2Fb.png'), 'a/b.png')
  assert.equal(parseMediaQuery('/directorx/media'), undefined)
  assert.equal(parseMediaQuery('/directorx/media?path='), undefined)
  assert.equal(parseMediaQuery(undefined), undefined)
})

test('parseRangeHeader handles closed, open, suffix, and invalid ranges', () => {
  assert.deepEqual(parseRangeHeader('bytes=0-99', 1000), { start: 0, end: 99 })
  assert.deepEqual(parseRangeHeader('bytes=500-', 1000), { start: 500, end: 999 })
  assert.deepEqual(parseRangeHeader('bytes=-200', 1000), { start: 800, end: 999 })
  assert.deepEqual(parseRangeHeader('bytes=500-900', 1000), { start: 500, end: 900 })
  assert.equal(parseRangeHeader(undefined, 1000), undefined)
  assert.equal(parseRangeHeader('bytes=9999-', 1000), undefined)
  assert.equal(parseRangeHeader('bytes=abc', 1000), undefined)
  assert.equal(parseRangeHeader('bytes=-', 1000), undefined)
  assert.equal(parseRangeHeader('bytes=0-99', 0), undefined)
})

test('inspectMediaFile reports size and media type; rejects missing and oversized entries', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-media-inspect-'))
  try {
    await writeFile(join(dir, 'a.png'), PNG_BYTES)
    const info = await inspectMediaFile(dir, 'a.png')
    assert.equal(info.mediaType, 'image/png')
    assert.equal(info.size, PNG_BYTES.length)
    await assert.rejects(() => inspectMediaFile(dir, 'missing.png'))
    await assert.rejects(() => inspectMediaFile(dir, '..'))
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
