#!/usr/bin/env node
/**
 * Fan-out entry: run plugin and agent jobs as separate processes with
 * isolated cwd + git -C. A red or skipped job never stages the other tree.
 *
 *   node scripts/parallel-dev-loop.mjs --record <dir> [--jobs plugin,agent] [--skip-push]
 */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveSiblingTrees, snapshotTree, snapshotsEqual } from './parallel-loop-lib.mjs'

const args = process.argv.slice(2)
const flag = (name) => {
  const index = args.indexOf(`--${name}`)
  return index >= 0 && args[index + 1] ? args[index + 1] : undefined
}
const here = dirname(fileURLToPath(import.meta.url))
const trees = resolveSiblingTrees(here)
const recordDir = resolve(flag('record') ?? join(here, '..', '.loop-record'))
const jobs = (flag('jobs') ?? 'plugin,agent').split(',').map((name) => name.trim()).filter(Boolean)
const skipPush = args.includes('--skip-push')
mkdirSync(recordDir, { recursive: true })

const summary = { at: new Date().toISOString(), recordDir, jobs: [], isolation: {} }

function launch(name, tree, peer) {
  if (!existsSync(join(tree, 'scripts', 'dev-loop.mjs'))) {
    return {
      name,
      tree,
      skip: 'job_missing',
      testsOk: false,
    }
  }
  const peerBefore = existsSync(join(peer, '.git')) ? snapshotTree(peer) : null
  const argv = [join(tree, 'scripts', 'dev-loop.mjs'), '--record', recordDir, '--peer', peer]
  if (skipPush) argv.push('--skip-push')
  const launched = spawnSync(process.execPath, argv, {
    cwd: tree,
    encoding: 'utf8',
    env: { ...process.env },
    timeout: 40 * 60 * 1000,
  })
  const peerAfter = peerBefore ? snapshotTree(peer) : null
  const isolationOk = peerBefore === null || snapshotsEqual(peerBefore, peerAfter)
  let parsed = null
  const recordFile = join(recordDir, `${name}.json`)
  if (existsSync(recordFile)) {
    parsed = JSON.parse(readFileSync(recordFile, 'utf8'))
  }
  return {
    name,
    tree,
    peer,
    status: launched.status,
    isolationOk,
    record: parsed,
    stdout: (launched.stdout || '').slice(0, 8000),
    stderr: (launched.stderr || '').slice(0, 8000),
  }
}

if (jobs.includes('plugin')) {
  summary.jobs.push(launch('plugin', trees.plugin, trees.agent))
}
if (jobs.includes('agent')) {
  summary.jobs.push(launch('agent', trees.agent, trees.plugin))
}

summary.isolation.pluginDidNotTouchAgent = summary.jobs.find((job) => job.name === 'plugin')?.isolationOk ?? true
summary.isolation.agentDidNotTouchPlugin = summary.jobs.find((job) => job.name === 'agent')?.isolationOk ?? true
writeFileSync(join(recordDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)
const isolationBroken = summary.jobs.some((job) => job.isolationOk === false)
process.exit(isolationBroken ? 2 : 0)
