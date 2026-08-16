#!/usr/bin/env node
/**
 * One isolated job for this tree. Does not chdir into the peer and never
 * shares a git index. Usage:
 *   node scripts/dev-loop.mjs --record <dir> [--peer <path>] [--skip-push]
 */
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runTreeJob } from './parallel-loop-lib.mjs'

const args = process.argv.slice(2)
const flag = (name) => {
  const index = args.indexOf(`--${name}`)
  return index >= 0 && args[index + 1] ? args[index + 1] : undefined
}
const here = dirname(fileURLToPath(import.meta.url))
const tree = dirname(here)
const recordDir = resolve(flag('record') ?? joinDefaultRecord(tree))
const peer = flag('peer') ? resolve(flag('peer')) : undefined
mkdirSync(recordDir, { recursive: true })
const record = runTreeJob({
  tree,
  peer,
  recordDir,
  skipPush: args.includes('--skip-push'),
})
process.stdout.write(`${JSON.stringify(record, null, 2)}\n`)
process.exit(record.testsOk && record.skip !== 'peer_mutated' ? 0 : 1)

function joinDefaultRecord(root) {
  return resolve(root, '.loop-record')
}
