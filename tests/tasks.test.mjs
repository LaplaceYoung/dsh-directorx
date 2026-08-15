import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { DirectorxTaskLedger, runVideo } from '../lib/testing.js'

function record(taskId, state) {
  return { taskId, model: 'test-video', mode: 'modelverse-tasks', prompt: 'a test video', state, at: Date.now() }
}

test('ledger appends, folds, and reports latest state per task', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-ledger-'))
  try {
    const ledger = new DirectorxTaskLedger(dir)
    assert.equal(await ledger.latest('t1'), undefined)

    await ledger.append(record('t1', 'submitted'))
    await ledger.append(record('t2', 'submitted'))
    await ledger.append(record('t1', 'succeeded'))
    assert.equal((await ledger.latest('t1'))?.state, 'succeeded')
    assert.equal((await ledger.latest('t2'))?.state, 'submitted')
    assert.equal((await ledger.fold('t1')).length, 2)
    assert.equal((await ledger.list()).length, 3)
    assert.equal(await ledger.isCancelled('t1'), false)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('cancel flips an in-flight task, is a no-op for succeeded, and survives across ledger instances', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-ledger-'))
  try {
    const first = new DirectorxTaskLedger(dir)
    await first.append(record('t1', 'submitted'))
    await first.append(record('t2', 'succeeded'))
    await first.cancel('t1', 'user asked')
    await first.cancel('t2', 'too late')

    // A fresh instance reads the same file: cancellation persisted.
    const second = new DirectorxTaskLedger(dir)
    assert.equal((await second.latest('t1'))?.state, 'cancelled')
    assert.equal((await second.latest('t2'))?.state, 'succeeded')
    assert.equal(await second.isCancelled('t1'), true)

    // Orphan recovery: a locally failed task still accepts a cancel.
    await second.append(record('t3', 'failed'))
    const cancelled = await second.cancel('t3')
    assert.equal(cancelled.state, 'cancelled')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('a running poll loop aborts when the task is cancelled through the ledger', async () => {
  const requests = []
  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1')
    requests.push(url.pathname)
    if (request.method === 'POST' && url.pathname === '/v1/tasks/submit') {
      response.writeHead(200, { 'content-type': 'application/json' })
      return response.end(JSON.stringify({ output: { task_id: 'task-cancel-1' } }))
    }
    if (request.method === 'GET' && url.pathname === '/v1/tasks/status') {
      response.writeHead(200, { 'content-type': 'application/json' })
      return response.end(JSON.stringify({ output: { task_id: 'task-cancel-1', task_status: 'running' } }))
    }
    response.writeHead(404, { 'content-type': 'application/json' })
    return response.end(JSON.stringify({ error: { message: 'unexpected route' } }))
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  const port = typeof address === 'object' && address !== null ? address.port : 0
  const dir = await mkdtemp(join(tmpdir(), 'directorx-ledger-'))
  try {
    const ledger = new DirectorxTaskLedger(dir)
    const settings = { outputDir: dir, timeoutMs: 5000, pollIntervalMs: 20, maxPollAttempts: 50 }
    const capability = { enabled: true, mode: 'modelverse-tasks', baseURL: `http://127.0.0.1:${port}/v1`, apiKey: 'test-key', model: 'test-video', resolution: '1K' }

    // Cancel after the first poll lands: schedule once submit has been recorded.
    const canceller = (async () => {
      for (let attempt = 0; attempt < 100; attempt += 1) {
        if (await ledger.latest('task-cancel-1') !== undefined) break
        await new Promise(resolve => setTimeout(resolve, 5))
      }
      await ledger.cancel('task-cancel-1', 'test cancel')
    })()

    await assert.rejects(
      runVideo({ settings, capability, ledger, signal: new AbortController().signal }, 'a test video', {}),
      /cancelled via directorx_cancel_task/,
    )
    await canceller
    assert.equal((await ledger.latest('task-cancel-1'))?.state, 'cancelled')
  } finally {
    server.close()
    await rm(dir, { recursive: true, force: true })
  }
})
