import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'

/**
 * Isolated per-tree helpers for the plugin/agent dev loop.
 * Every git invocation is `git -C <tree>` — callers must never share an index
 * or process.chdir() across trees.
 */

export function git(cwd, args, env = {}) {
  return spawnSync('git', ['-C', cwd, ...args], {
    encoding: 'utf8',
    env: { ...process.env, ...env },
  })
}

export function runInTree(cwd, command, env = {}, timeoutMs = 30 * 60 * 1000) {
  const [cmd, ...args] = command
  return spawnSync(cmd, args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, ...env },
    timeout: timeoutMs,
  })
}

export function parsePorcelainLine(line) {
  if (!line) return null
  const renamed = line.slice(3).split(' -> ')
  const path = (renamed[renamed.length - 1] ?? '').trim()
  if (path === '') return null
  return { raw: line, path }
}

export function listPorcelain(cwd) {
  const result = git(cwd, ['status', '--porcelain', '-uall'])
  if (result.status !== 0) {
    throw new Error(`git status failed in ${cwd}: ${result.stderr}`)
  }
  return result.stdout.split('\n').map(parsePorcelainLine).filter(Boolean)
}

export function matchRule(relPath, rule) {
  const path = relPath.replace(/^\.\//, '')
  if (rule.endsWith('/')) return path === rule.slice(0, -1) || path.startsWith(rule)
  return path === rule || path.startsWith(`${rule}/`) || path.startsWith(rule)
}

export function pathAllowed(relPath, allow, deny) {
  if (deny.some((rule) => matchRule(relPath, rule))) return false
  return allow.some((rule) => matchRule(relPath, rule))
}

export function scopedPaths(cwd, allow, deny) {
  return listPorcelain(cwd).map((entry) => entry.path).filter((path) => pathAllowed(path, allow, deny))
}

export function snapshotTree(cwd) {
  const head = git(cwd, ['rev-parse', 'HEAD'])
  return {
    cwd: resolve(cwd),
    head: (head.stdout || '').trim(),
    porcelain: listPorcelain(cwd).map((entry) => entry.raw),
  }
}

export function snapshotsEqual(a, b) {
  return a.cwd === b.cwd && a.head === b.head && a.porcelain.join('\n') === b.porcelain.join('\n')
}

export function authorEnv(cwd) {
  const name = (git(cwd, ['config', 'user.name']).stdout || git(cwd, ['log', '-1', '--format=%an']).stdout || '').trim()
  const email = (git(cwd, ['config', 'user.email']).stdout || git(cwd, ['log', '-1', '--format=%ae']).stdout || '').trim()
  if (name === '' || email === '') return {}
  return {
    GIT_AUTHOR_NAME: name,
    GIT_AUTHOR_EMAIL: email,
    GIT_COMMITTER_NAME: name,
    GIT_COMMITTER_EMAIL: email,
  }
}

export function loadIncrement(tree) {
  const file = join(tree, 'scripts', 'loop-increment.json')
  return JSON.parse(readFileSync(file, 'utf8'))
}

export function assertNotPeer(cwd, peer) {
  if (!peer) return
  if (resolve(cwd) === resolve(peer)) {
    throw new Error(`isolation breach: job cwd is the peer tree (${cwd})`)
  }
}

/**
 * Run one tree's shipped tests, then commit only allowlisted paths if green.
 * Never touches `peer`. Push is attempted only after a successful commit.
 */
export function runTreeJob({ tree, peer, recordDir, skipPush = false }) {
  assertNotPeer(tree, peer)
  mkdirSync(recordDir, { recursive: true })
  const increment = loadIncrement(tree)
  const before = snapshotTree(tree)
  const peerBefore = peer && existsSync(join(peer, '.git')) ? snapshotTree(peer) : null
  const scoped = scopedPaths(tree, increment.allow, increment.deny)
  const env = authorEnv(tree)

  const testRun = runInTree(tree, increment.test, env)
  const testsOk = testRun.status === 0
  const record = {
    name: increment.name,
    tree: resolve(tree),
    peer: peer ? resolve(peer) : null,
    testCommand: increment.test,
    testsOk,
    testStatus: testRun.status,
    scoped,
    startHead: before.head,
    commit: null,
    push: null,
    skip: null,
  }

  if (!testsOk) {
    record.skip = 'tests_red'
  } else if (scoped.length === 0) {
    record.skip = 'no_scoped_changes'
  } else {
    const add = git(tree, ['add', '--', ...scoped], env)
    if (add.status !== 0) {
      record.skip = 'git_add_failed'
      record.addError = (add.stderr || add.stdout).slice(0, 2000)
    } else {
      const commit = git(tree, ['commit', '-m', increment.message], env)
      if (commit.status !== 0) {
        record.skip = 'git_commit_failed'
        record.commitError = (commit.stderr || commit.stdout).slice(0, 2000)
      } else {
        const head = git(tree, ['rev-parse', 'HEAD'])
        record.commit = (head.stdout || '').trim()
        if (skipPush) {
          record.push = { skipped: 'skip_push_flag' }
        } else {
          const pushed = git(tree, ['push', 'origin', 'HEAD'], env)
          record.push = {
            attempted: true,
            ok: pushed.status === 0,
            status: pushed.status,
            stdout: (pushed.stdout || '').slice(0, 4000),
            stderr: (pushed.stderr || '').slice(0, 4000),
          }
        }
      }
    }
  }

  if (peerBefore) {
    const peerAfter = snapshotTree(peer)
    record.peerUntouched = snapshotsEqual(peerBefore, peerAfter)
    if (!record.peerUntouched) {
      record.skip = record.skip ?? 'peer_mutated'
    }
  }

  record.endHead = snapshotTree(tree).head
  const out = join(recordDir, `${increment.name}.json`)
  writeFileSync(out, `${JSON.stringify(record, null, 2)}\n`)
  writeFileSync(join(recordDir, `${increment.name}-test.log`), `${testRun.stdout || ''}\n${testRun.stderr || ''}`)
  return record
}

export function resolveSiblingTrees(fromScriptsDir) {
  const tree = dirname(fromScriptsDir)
  const parent = dirname(tree)
  const label = basename(tree)
  if (label === 'dsh-directorx') {
    return { plugin: tree, agent: join(parent, 'directorx') }
  }
  if (label === 'directorx') {
    return { plugin: join(parent, 'dsh-directorx'), agent: tree }
  }
  return {
    plugin: join(tree, 'dsh-directorx'),
    agent: join(tree, 'directorx'),
  }
}
