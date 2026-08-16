import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
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
  const result = git(cwd, ['status', '--porcelain', '-uall', '-z'])
  if (result.status !== 0) {
    throw new Error(`git status failed in ${cwd}: ${result.stderr}`)
  }
  const entries = []
  const parts = result.stdout.split('\0')
  for (let i = 0; i < parts.length; i += 1) {
    const rec = parts[i]
    if (!rec) continue
    const xy = rec.slice(0, 2)
    const path = rec.slice(3)
    if (xy.includes('R') || xy.includes('C')) i += 1
    if (path !== '') entries.push({ raw: rec, path })
  }
  return entries
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

export function leftoverPaths(cwd, allow, deny) {
  return listPorcelain(cwd).map((entry) => entry.path).filter((path) => !pathAllowed(path, allow, deny))
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

export function loopGateStashes(cwd) {
  const listed = git(cwd, ['stash', 'list'])
  if (listed.status !== 0) {
    throw new Error(`git stash list failed in ${cwd}: ${listed.stderr}`)
  }
  return (listed.stdout || '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.includes('directorx-loop-gate'))
}

function gitDir(cwd) {
  const result = git(cwd, ['rev-parse', '--git-dir'])
  const dir = (result.stdout || '').trim()
  if (dir === '') throw new Error(`git-dir missing in ${cwd}: ${result.stderr}`)
  return dir.startsWith('/') ? dir : resolve(cwd, dir)
}

export function hideLeftover(cwd, leftover, env = {}) {
  if (leftover.length === 0) return { stashed: false }
  const spec = join(gitDir(cwd), 'directorx-loop-gate.pathspec')
  writeFileSync(spec, `${leftover.join('\0')}\0`)
  try {
    const result = git(cwd, [
      'stash',
      'push',
      '--include-untracked',
      '--pathspec-from-file',
      spec,
      '--pathspec-file-nul',
      '-m',
      'directorx-loop-gate',
    ], env)
    const out = `${result.stdout || ''}\n${result.stderr || ''}`
    if (result.status !== 0) {
      if (loopGateStashes(cwd).length > 0) {
        const visible = new Set(listPorcelain(cwd).map((entry) => entry.path))
        const hidden = leftover.filter((path) => !visible.has(path))
        git(cwd, ['stash', hidden.length > 0 ? 'pop' : 'drop'], env)
      }
      return { stashed: false, status: result.status, error: out.slice(0, 4000) }
    }
    if (/No local changes to save/i.test(out)) {
      return { stashed: false }
    }
    const stillDirty = new Set(listPorcelain(cwd).map((entry) => entry.path))
    const visible = leftover.filter((path) => stillDirty.has(path))
    if (visible.length > 0) {
      return {
        stashed: loopGateStashes(cwd).length > 0,
        error: `leftover still visible after stash: ${visible.join(', ')}`.slice(0, 4000),
      }
    }
    return { stashed: true }
  } finally {
    try { unlinkSync(spec) } catch { /* pathspec is a helper; leftover lives in the stash */ }
  }
}

export function restoreLeftover(cwd, env = {}) {
  const before = loopGateStashes(cwd)
  if (before.length === 0) {
    return { ok: false, error: 'expected directorx-loop-gate stash to restore leftover dirt' }
  }
  const result = git(cwd, ['stash', 'pop'], env)
  const out = `${result.stdout || ''}\n${result.stderr || ''}`
  if (result.status !== 0) {
    return { ok: false, status: result.status, error: out.slice(0, 4000) }
  }
  const after = loopGateStashes(cwd)
  if (after.length >= before.length) {
    return { ok: false, error: `loop-gate stash remains after pop:\n${after.join('\n')}` }
  }
  return { ok: true }
}

/**
 * Stage the allowlisted increment, hide only leftover dirt, run the shipped
 * suite against that index, then commit. Green tests must describe the
 * commit, not leftover dirty files. tests_red must restore leftover or abort.
 */
export function runTreeJob({ tree, peer, recordDir, skipPush = false }) {
  assertNotPeer(tree, peer)
  mkdirSync(recordDir, { recursive: true })
  const increment = loadIncrement(tree)
  const before = snapshotTree(tree)
  const peerBefore = peer && existsSync(join(peer, '.git')) ? snapshotTree(peer) : null
  const scoped = scopedPaths(tree, increment.allow, increment.deny)
  const leftover = leftoverPaths(tree, increment.allow, increment.deny)
  const env = authorEnv(tree)
  const record = {
    name: increment.name,
    tree: resolve(tree),
    peer: peer ? resolve(peer) : null,
    testCommand: increment.test,
    testsOk: false,
    testStatus: null,
    scoped,
    leftover,
    startHead: before.head,
    commit: null,
    push: null,
    skip: null,
  }
  let testRun = { status: 0, stdout: '', stderr: '' }

  if (scoped.length === 0) {
    record.skip = 'no_scoped_changes'
    record.testsOk = true
    record.testStatus = 0
  } else {
    // Hide leftover first so the stash never snapshots the increment index.
    // `git add` then `stash` records the whole index; tests_red unstage + pop
    // then collides with the new increment files.
    const hide = hideLeftover(tree, leftover, env)
    if (hide.error) {
      record.skip = 'stash_hide_failed'
      record.stashHideError = hide.error
      if (hide.stashed) restoreLeftover(tree, env)
    } else {
      const add = git(tree, ['add', '--', ...scoped], env)
      if (add.status !== 0) {
        record.skip = 'git_add_failed'
        record.addError = (add.stderr || add.stdout).slice(0, 2000)
        if (hide.stashed) {
          const restored = restoreLeftover(tree, env)
          if (!restored.ok) {
            record.skip = 'stash_restore_failed'
            record.stashRestoreError = restored.error
          }
        }
      } else {
        try {
          testRun = runInTree(tree, increment.test, env)
          record.testStatus = testRun.status
          record.testsOk = testRun.status === 0
          if (!record.testsOk) {
            record.skip = 'tests_red'
            git(tree, ['restore', '--staged', '.'], env)
          } else {
            const commit = git(tree, ['commit', '-m', increment.message], env)
            if (commit.status !== 0) {
              record.skip = 'git_commit_failed'
              record.commitError = (commit.stderr || commit.stdout).slice(0, 2000)
              git(tree, ['restore', '--staged', '.'], env)
            } else {
              record.commit = (git(tree, ['rev-parse', 'HEAD']).stdout || '').trim()
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
        } finally {
          if (hide.stashed) {
            const restored = restoreLeftover(tree, env)
            if (!restored.ok) {
              record.skip = 'stash_restore_failed'
              record.stashRestoreError = restored.error
            }
          }
        }
      }
    }
  }

  if (peerBefore) {
    record.peerUntouched = snapshotsEqual(peerBefore, snapshotTree(peer))
  }

  record.endHead = snapshotTree(tree).head
  writeFileSync(join(recordDir, `${increment.name}.json`), `${JSON.stringify(record, null, 2)}\n`)
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
