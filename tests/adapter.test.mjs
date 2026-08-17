import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  adapterIdFor,
  classifyProviderDoc,
  parseAdapterSpec,
  buildBody,
  contractSmoke,
  ingestProvider,
  classifyProvider,
  draftProvider,
  smokeProvider,
  commitProvider,
  resolveGenerateCapability,
  adapterCapabilities,
  routeModel,
  genericGenerate,
} from '../lib/testing.js'

function settingsFor(dir, port) {
  const cap = {
    enabled: true,
    mode: 'mock',
    baseURL: `http://127.0.0.1:${port}`,
    apiKey: 'sk-test',
    model: 'placeholder',
    resolution: '1K',
    auth: { klingAk: '', klingSk: '', runwayVersion: '' },
  }
  return {
    outputDir: dir,
    timeoutMs: 20_000,
    pollIntervalMs: 20,
    maxPollAttempts: 20,
    persona: '成片',
    initiative: '自动',
    vision: cap,
    image: { ...cap },
    video: { ...cap },
    audio: { ...cap },
  }
}

test('classify known docs as A and unknown as B', () => {
  const kling = classifyProviderDoc('POST /v1/videos/image2video Access Key Secret Key HS256')
  assert.equal(kling.family, 'A')
  assert.equal(kling.mode, 'kling')
  const tasks = classifyProviderDoc('POST /v1/tasks/submit then GET /tasks/status')
  assert.equal(tasks.mode, 'modelverse-tasks')
  const unknown = classifyProviderDoc('Create a job at POST /v1/render, poll GET /v1/jobs/{id}, Bearer token')
  assert.equal(unknown.family, 'B')
  assert.equal(unknown.mode, 'generic-rest')
})

test('parseAdapterSpec rejects incomplete generic-rest', () => {
  const bad = parseAdapterSpec({
    id: 'video-x',
    capability: 'video',
    model: 'x',
    mode: 'generic-rest',
    baseURL: 'http://127.0.0.1',
    auth: { kind: 'bearer' },
    caps: { aspectRatios: ['16:9'] },
  })
  assert.equal(bad.spec, undefined)
  assert.ok(bad.issues.some(issue => issue.path === 'create'))
})

test('parseAdapterSpec accepts a closed generic-rest form', () => {
  const good = parseAdapterSpec({
    id: 'video-ray',
    capability: 'video',
    model: 'ray-2',
    mode: 'generic-rest',
    baseURL: 'http://127.0.0.1/v1',
    auth: { kind: 'bearer' },
    create: {
      path: '/render',
      body: {
        prompt: { type: 'from', field: 'prompt' },
        model: { type: 'from', field: 'model' },
      },
    },
    poll: {
      path: '/jobs/{taskId}',
      taskId: 'id',
      status: 'status',
      success: ['done'],
      failure: ['failed'],
      resultUrls: 'url',
    },
    caps: { aspectRatios: ['16:9'], firstFrame: false, lastFrame: false, audio: false, multiRef: false },
  })
  assert.equal(good.issues.length, 0)
  assert.equal(good.spec.mode, 'generic-rest')
  const body = buildBody(good.spec.create.body, { prompt: 'hi', model: 'ray-2' })
  assert.deepEqual(body, { prompt: 'hi', model: 'ray-2' })
})

test('ingest does not echo the api key and classify/draft/smoke/commit work', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-adapter-'))
  const patches = []
  try {
    const ingested = await ingestProvider({
      outputDir: dir,
      model: 'ray-2',
      capability: 'video',
      baseURL: 'http://127.0.0.1:9',
      apiKey: 'sk-secret-must-not-leak',
      apiDoc: 'Create a job POST /v1/render with Bearer. Poll GET /v1/jobs/{id}. status done, url on success.',
    })
    assert.equal(ingested.apiKeySet, true)
    assert.equal(JSON.stringify(ingested).includes('sk-secret'), false)
    assert.equal(ingested.id, adapterIdFor('video', 'ray-2'))

    const classified = await classifyProvider(dir, ingested.id)
    assert.equal(classified.family, 'B')
    assert.equal(classified.mode, 'generic-rest')

    const drafted = await draftProvider(dir, ingested.id, {
      baseURL: 'http://127.0.0.1:9',
      auth: { kind: 'bearer' },
      create: {
        path: '/v1/render',
        body: {
          prompt: { type: 'from', field: 'prompt' },
          model: { type: 'from', field: 'model' },
        },
      },
      poll: {
        path: '/v1/jobs/{taskId}',
        taskId: 'id',
        status: 'status',
        success: ['done'],
        failure: ['failed'],
        resultUrls: 'url',
      },
      caps: { aspectRatios: ['16:9', '9:16'], firstFrame: true, lastFrame: false, audio: false, multiRef: false },
    })
    assert.equal(drafted.ok, true)

    const contract = contractSmoke(drafted.spec, {
      create: { id: 'job-1' },
      poll: { status: 'done', url: 'http://127.0.0.1/out.mp4' },
    })
    assert.equal(contract.ok, true)

    const smoked = await smokeProvider({
      settings: settingsFor(dir, 9),
      id: ingested.id,
      createFixture: { id: 'job-1' },
      pollFixture: { status: 'done', url: 'http://example.invalid/out.mp4' },
    })
    assert.equal(smoked.contract.ok, true)

    const committed = await commitProvider({
      settings: settingsFor(dir, 9),
      id: ingested.id,
      force: true,
      apply: async (capability, patch) => { patches.push({ capability, patch }) },
    })
    assert.equal(committed.ok, true)
    assert.equal(patches[0].capability, 'video')
    assert.equal(patches[0].patch.mode, 'generic-rest')
    assert.equal(patches[0].patch.model, 'ray-2')
    assert.equal(patches[0].patch.apiKey, 'sk-secret-must-not-leak')

    const resolved = await resolveGenerateCapability(settingsFor(dir, 9), 'video', 'ray-2')
    assert.equal(resolved.spec.mode, 'generic-rest')
    assert.equal(resolved.capability.apiKey, 'sk-secret-must-not-leak')

    const extras = await adapterCapabilities(dir)
    const routed = routeModel({ durationSec: 5, aspectRatio: '16:9' }, extras)
    assert.ok(routed.eligible.some(item => item.model === 'ray-2'))

    const secrets = await readFile(join(dir, 'adapters.secrets.json'), 'utf8')
    assert.match(secrets, /sk-secret-must-not-leak/)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('generic-rest runner create+poll downloads the file', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-generic-'))
  const mp4 = Buffer.from('fake-mp4')
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1')
    if (request.method === 'POST' && url.pathname === '/v1/render') {
      assert.equal(request.headers.authorization, 'Bearer sk-test')
      response.writeHead(200, { 'content-type': 'application/json' })
      response.end(JSON.stringify({ id: 'job-1' }))
      return
    }
    if (request.method === 'GET' && url.pathname === '/v1/jobs/job-1') {
      const address = server.address()
      const port = typeof address === 'object' && address !== null ? address.port : 0
      response.writeHead(200, { 'content-type': 'application/json' })
      response.end(JSON.stringify({ status: 'done', url: `http://127.0.0.1:${port}/out.mp4` }))
      return
    }
    if (url.pathname === '/out.mp4') {
      response.writeHead(200, { 'content-type': 'video/mp4' })
      response.end(mp4)
      return
    }
    response.writeHead(404)
    response.end()
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const port = server.address().port
  try {
    const spec = parseAdapterSpec({
      id: 'video-ray',
      capability: 'video',
      model: 'ray-2',
      mode: 'generic-rest',
      baseURL: `http://127.0.0.1:${port}`,
      auth: { kind: 'bearer' },
      create: {
        path: '/v1/render',
        body: { prompt: { type: 'from', field: 'prompt' } },
      },
      poll: {
        path: '/v1/jobs/{taskId}',
        taskId: 'id',
        status: 'status',
        success: ['done'],
        failure: ['failed'],
        resultUrls: 'url',
      },
      caps: { aspectRatios: ['16:9'], firstFrame: false, lastFrame: false, audio: false, multiRef: false },
    }).spec
    const result = await genericGenerate({
      settings: settingsFor(dir, port),
      capability: settingsFor(dir, port).video,
      signal: AbortSignal.timeout(10_000),
    }, spec, { prompt: 'desert tower' })
    assert.equal(result.mode, 'generic-rest')
    assert.equal(result.taskId, 'job-1')
    assert.ok(result.files[0].path)
    const bytes = await readFile(result.files[0].path)
    assert.deepEqual(bytes, mp4)
  } finally {
    server.close()
    await rm(dir, { recursive: true, force: true })
  }
})
