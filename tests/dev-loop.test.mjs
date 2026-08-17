import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import {
  pathAllowed,
  scopedPaths,
  snapshotTree,
  snapshotsEqual,
  runTreeJob,
  git,
  assertNotPeer,
  loopGateStashes,
} from '../scripts/parallel-loop-lib.mjs'

function initRepo(dir, name) {
  mkdirSync(dir, { recursive: true })
  spawnSync('git', ['init', '-b', 'main'], { cwd: dir, encoding: 'utf8' })
  spawnSync('git', ['-C', dir, 'config', 'user.name', 'loop-test'])
  spawnSync('git', ['-C', dir, 'config', 'user.email', 'loop-test@example.test'])
  writeFileSync(join(dir, 'README.md'), `${name}\n`)
  mkdirSync(join(dir, 'scripts'), { recursive: true })
  writeFileSync(join(dir, 'scripts', 'loop-increment.json'), JSON.stringify({
    name,
    test: ['node', '-e', 'process.exit(0)'],
    allow: ['src/', 'scripts/loop-increment.json', 'README.md'],
    deny: ['secret/', '.env'],
    message: `test: ${name} increment`,
  }))
  spawnSync('git', ['-C', dir, 'add', 'README.md', 'scripts/loop-increment.json'])
  spawnSync('git', ['-C', dir, 'commit', '-m', `init ${name}`])
}

test('pathAllowed denies secrets even when they match an allow prefix', () => {
  assert.equal(pathAllowed('src/canvas.ts', ['src/'], ['secret/', '.env']), true)
  assert.equal(pathAllowed('secret/token', ['secret/'], ['secret/']), false)
  assert.equal(pathAllowed('.env', ['.env', 'src/'], ['.env']), false)
  assert.equal(pathAllowed('web/src/App.tsx', ['web/'], ['knowledge/', '3d/']), true)
  assert.equal(pathAllowed('knowledge/INDEX.md', ['web/', 'knowledge/'], ['knowledge/']), false)
})

test('assertNotPeer rejects a job whose cwd is the other tree', () => {
  assert.throws(() => assertNotPeer('/tmp/a', '/tmp/a'), /isolation breach/)
  assert.doesNotThrow(() => assertNotPeer('/tmp/a', '/tmp/b'))
})

test('runTreeJob commits only scoped files and never mutates the peer repo', async () => {
  const root = await mkdtemp(join(tmpdir(), 'loop-iso-'))
  const plugin = join(root, 'plugin')
  const agent = join(root, 'agent')
  initRepo(plugin, 'plugin')
  initRepo(agent, 'agent')
  mkdirSync(join(plugin, 'src'), { recursive: true })
  writeFileSync(join(plugin, 'src', 'feature.js'), 'export const n = 1\n')
  writeFileSync(join(plugin, 'secret.txt'), 'do-not-commit\n')
  writeFileSync(join(agent, 'README.md'), 'agent\npeer should stay exactly like this\n')
  const peerBefore = snapshotTree(agent)
  const recordDir = join(root, 'record')
  const record = runTreeJob({ tree: plugin, peer: agent, recordDir, skipPush: true })
  assert.equal(record.testsOk, true)
  assert.ok(record.commit)
  assert.ok(record.scoped.includes('src/feature.js'))
  assert.ok(!record.scoped.includes('secret.txt'))
  assert.equal(record.peerUntouched, true)
  const peerAfter = snapshotTree(agent)
  assert.equal(snapshotsEqual(peerBefore, peerAfter), true)
  const show = git(plugin, ['show', '--name-only', '--pretty=format:', record.commit])
  assert.match(show.stdout, /src\/feature\.js/)
  assert.doesNotMatch(show.stdout, /secret\.txt/)
  const agentReadme = readFileSync(join(agent, 'README.md'), 'utf8')
  assert.equal(agentReadme, 'agent\npeer should stay exactly like this\n')
})

test('runTreeJob skips commit when the shipped test command is red', async () => {
  const root = await mkdtemp(join(tmpdir(), 'loop-red-'))
  const plugin = join(root, 'plugin')
  const agent = join(root, 'agent')
  initRepo(plugin, 'plugin')
  initRepo(agent, 'agent')
  writeFileSync(join(plugin, 'scripts', 'loop-increment.json'), JSON.stringify({
    name: 'plugin',
    test: ['node', '-e', 'process.exit(2)'],
    allow: ['src/'],
    deny: [],
    message: 'should not land',
  }))
  mkdirSync(join(plugin, 'src'), { recursive: true })
  writeFileSync(join(plugin, 'src', 'broken.js'), 'throw 1\n')
  const before = snapshotTree(plugin)
  const record = runTreeJob({ tree: plugin, peer: agent, recordDir: join(root, 'record'), skipPush: true })
  assert.equal(record.testsOk, false)
  assert.equal(record.skip, 'tests_red')
  assert.equal(record.commit, null)
  assert.equal(snapshotTree(plugin).head, before.head)
})

test('runTreeJob gates on the staged increment, not leftover dirty files', async () => {
  const root = await mkdtemp(join(tmpdir(), 'loop-gate-'))
  const plugin = join(root, 'plugin')
  const agent = join(root, 'agent')
  initRepo(plugin, 'plugin')
  initRepo(agent, 'agent')
  mkdirSync(join(plugin, 'src'), { recursive: true })
  writeFileSync(join(plugin, 'src', 'good.js'), 'export const ok = 1\n')
  writeFileSync(join(plugin, 'poison.js'), 'must not be visible while the suite runs\n')
  writeFileSync(join(plugin, 'scripts', 'loop-increment.json'), JSON.stringify({
    name: 'plugin',
    test: ['node', '-e', "require('node:fs').existsSync('poison.js') ? process.exit(2) : process.exit(0)"],
    allow: ['src/'],
    deny: [],
    message: 'only the increment',
  }))
  const record = runTreeJob({ tree: plugin, peer: agent, recordDir: join(root, 'record'), skipPush: true })
  assert.equal(record.testsOk, true, 'poison.js must be hidden while tests run')
  assert.ok(record.commit)
  assert.equal(existsSync(join(plugin, 'poison.js')), true, 'unscoped dirt is restored after the gate')
  assert.deepEqual(loopGateStashes(plugin), [], 'green cycle must not leave a loop-gate stash')
  const show = git(plugin, ['show', '--name-only', '--pretty=format:', record.commit])
  assert.match(show.stdout, /src\/good\.js/)
  assert.doesNotMatch(show.stdout, /poison/)
})

test('tests_red restores unscoped dirt and leaves no loop-gate stash', async () => {
  const root = await mkdtemp(join(tmpdir(), 'loop-red-restore-'))
  const plugin = join(root, 'plugin')
  const agent = join(root, 'agent')
  initRepo(plugin, 'plugin')
  initRepo(agent, 'agent')
  mkdirSync(join(plugin, 'src'), { recursive: true })
  writeFileSync(join(plugin, 'src', 'broken.js'), 'throw 1\n')
  writeFileSync(join(plugin, 'leftover.txt'), 'keep this dirt\n')
  writeFileSync(join(plugin, 'README.md'), 'plugin\ntracked leftover edit\n')
  writeFileSync(join(plugin, 'scripts', 'loop-increment.json'), JSON.stringify({
    name: 'plugin',
    test: ['node', '-e', 'process.exit(2)'],
    allow: ['src/'],
    deny: [],
    message: 'should not land',
  }))
  const before = snapshotTree(plugin)
  const record = runTreeJob({ tree: plugin, peer: agent, recordDir: join(root, 'record'), skipPush: true })
  assert.equal(record.testsOk, false)
  assert.equal(record.skip, 'tests_red')
  assert.equal(record.commit, null)
  assert.equal(snapshotTree(plugin).head, before.head)
  assert.equal(readFileSync(join(plugin, 'leftover.txt'), 'utf8'), 'keep this dirt\n')
  assert.equal(readFileSync(join(plugin, 'README.md'), 'utf8'), 'plugin\ntracked leftover edit\n')
  assert.equal(existsSync(join(plugin, 'src', 'broken.js')), true)
  assert.deepEqual(loopGateStashes(plugin), [], 'tests_red must not leave a loop-gate stash')
})

test('leftover unicode paths survive hide/restore without a leftover stash', async () => {
  const root = await mkdtemp(join(tmpdir(), 'loop-unicode-'))
  const plugin = join(root, 'plugin')
  const agent = join(root, 'agent')
  initRepo(plugin, 'plugin')
  initRepo(agent, 'agent')
  mkdirSync(join(plugin, 'src'), { recursive: true })
  mkdirSync(join(plugin, 'skills', 'novel-storyboard', 'examples'), { recursive: true })
  writeFileSync(join(plugin, 'src', 'good.js'), 'export const ok = 1\n')
  writeFileSync(join(plugin, 'skills', 'novel-storyboard', 'examples', '渡口-storyboard.json'), '{"ok":true}\n')
  writeFileSync(join(plugin, 'scripts', 'loop-increment.json'), JSON.stringify({
    name: 'plugin',
    test: ['node', '-e', "require('node:fs').existsSync('skills/novel-storyboard/examples/渡口-storyboard.json') ? process.exit(2) : process.exit(0)"],
    allow: ['src/'],
    deny: [],
    message: 'unicode leftover',
  }))
  const record = runTreeJob({ tree: plugin, peer: agent, recordDir: join(root, 'record'), skipPush: true })
  assert.equal(record.testsOk, true, record.stashHideError ?? record.skip)
  assert.ok(record.commit)
  assert.equal(readFileSync(join(plugin, 'skills', 'novel-storyboard', 'examples', '渡口-storyboard.json'), 'utf8'), '{"ok":true}\n')
  assert.deepEqual(loopGateStashes(plugin), [])
})

test('runTreeJob re-adds scoped files after the test command rewrites them', async () => {
  const root = await mkdtemp(join(tmpdir(), 'loop-readd-'))
  const plugin = join(root, 'plugin')
  const agent = join(root, 'agent')
  initRepo(plugin, 'plugin')
  initRepo(agent, 'agent')
  mkdirSync(join(plugin, 'src'), { recursive: true })
  writeFileSync(join(plugin, 'src', 'built.js'), 'before\n')
  writeFileSync(join(plugin, 'scripts', 'loop-increment.json'), JSON.stringify({
    name: 'plugin',
    test: ['node', '-e', "require('node:fs').writeFileSync('src/built.js', 'after\\n')"],
    allow: ['src/', 'scripts/loop-increment.json'],
    deny: [],
    message: 'readd after test',
  }))
  const record = runTreeJob({ tree: plugin, peer: agent, recordDir: join(root, 'record'), skipPush: true })
  assert.equal(record.testsOk, true)
  assert.ok(record.commit)
  const shown = git(plugin, ['show', `${record.commit}:src/built.js`])
  assert.equal(shown.stdout, 'after\n', 'commit must contain the post-test file, not the pre-test staging')
  assert.deepEqual(loopGateStashes(plugin), [])
})

test('scopedPaths reads the real git status of the tree under test', async () => {
  const root = await mkdtemp(join(tmpdir(), 'loop-scope-'))
  const tree = join(root, 'tree')
  initRepo(tree, 'tree')
  mkdirSync(join(tree, 'src'), { recursive: true })
  writeFileSync(join(tree, 'src', 'a.js'), '1\n')
  writeFileSync(join(tree, 'noise.md'), 'nope\n')
  const scoped = scopedPaths(tree, ['src/'], ['noise.md'])
  assert.deepEqual(scoped, ['src/a.js'])
})
