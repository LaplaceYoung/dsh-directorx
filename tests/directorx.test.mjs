import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, resolve } from 'node:path'
import { corpus, mockAudio, mockImage, mockVision } from '../lib/testing.js'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))

const settings = {
  outputDir: '.tmp-directorx-test',
  timeoutMs: 5000,
  pollIntervalMs: 10,
  maxPollAttempts: 2,
}

test('knowledge corpus search and read', async () => {
  corpus.setRoot(join(root, 'knowledge'))
  const hits = await corpus.search('图生视频 首尾帧', 5)
  assert.ok(hits.length > 0)
  assert.ok(hits.some(hit => hit.id === '116' || hit.path.includes('image-to-video')))
  const read = await corpus.readArticle('116')
  assert.ok(read.content.length > 200)
  assert.match(read.content, /首尾帧|first.?frame|image.?to.?video/i)
})

test('mock vision does not touch the network', async () => {
  const result = await mockVision(
    { settings, capability: { enabled: true, mode: 'mock', baseURL: '', apiKey: '', model: 'mock-vision' }, signal: new AbortController().signal },
    '/tmp/example.png',
    '图里有什么？',
  )
  assert.match(result.answer, /mock vision/)
})

test('mock image creates an SVG asset', async () => {
  const result = await mockImage(
    { settings, capability: { enabled: true, mode: 'mock', baseURL: '', apiKey: '', model: 'mock-image' }, signal: new AbortController().signal },
    '测试画面',
    '1024x1024',
  )
  assert.ok(result.files[0]?.path !== undefined)
  assert.equal(existsSync(result.files[0].path), true)
  assert.match(await readFile(result.files[0].path, 'utf8'), /DirectorX mock image/)
})

test('mock audio creates a real WAV asset', async () => {
  const result = await mockAudio(
    { settings, capability: { enabled: true, mode: 'mock', baseURL: '', apiKey: '', model: 'mock-tts' }, signal: new AbortController().signal },
    '测试旁白',
  )
  assert.ok(result.files[0]?.path !== undefined)
  const bytes = await readFile(result.files[0].path)
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF')
  assert.equal(bytes.toString('ascii', 8, 12), 'WAVE')
})

test('package metadata declares dsh bundle and dsh-plugin topic', async () => {
  const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
  assert.equal(pkg.dsh.bundle.patch, './cordis.patch.yml')
  assert.equal(pkg.dsh.client.platform, 'web')
  assert.equal(pkg.dsh.client.immediately, true)
  for (const name of [
    '@deepseek-ai/dsh-client-connection',
    '@deepseek-ai/dsh-client-ui-settings',
    '@deepseek-ai/dsh-client-ui-settings-plugins',
    '@deepseek-ai/dsh-client-ui-commands',
    '@deepseek-ai/dsh-api-remotes',
  ]) {
    assert.ok(pkg.dsh.client.inject.includes(name), name)
  }
  const readme = await readFile(join(root, 'README.md'), 'utf8').catch(() => '')
  assert.match(readme, /dsh-plugin/)
  assert.match(readme, /0\.1\.1-rc\.2/)
  const client = await readFile(join(root, 'src/client/index.ts'), 'utf8')
  assert.match(client, /settingsScope/)
  assert.match(client, /settings\.plugin\.item/)
})

test('cleanup test artifacts', async () => {
  await rm(join(process.cwd(), settings.outputDir), { recursive: true, force: true })
})