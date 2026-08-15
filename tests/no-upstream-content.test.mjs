import test from 'node:test'
import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join, resolve } from 'node:path'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))

const SCAN_EXTS = new Set(['.md', '.mjs', '.ts', '.tsx', '.json', '.yaml', '.yml', '.txt', '.html'])

async function walk(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'lib') continue
    const path = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...await walk(path))
    else if (SCAN_EXTS.has(entry.name.slice(entry.name.lastIndexOf('.')))) out.push(path)
  }
  return out
}

test('no external upstream URLs are shipped', async () => {
  const files = await walk(root)
  const offenders = []
  for (const file of files) {
    const content = await readFile(file, 'utf8')
    if (/github\.com|api\.github\.com/i.test(content)) offenders.push(file)
  }
  assert.deepEqual(offenders, [])
})

test('original playbook is integrated as a DSH skill', async () => {
  const skill = await readFile(join(root, 'skills/directorx-playbook/SKILL.md'), 'utf8')
  assert.match(skill, /name: directorx-playbook/)
  for (const file of [
    'video-prompt-principles.md',
    'consistency-and-control.md',
    'workflow-gates.md',
    'model-routing.md',
  ]) {
    assert.match(skill, new RegExp(file))
  }
})

test('README presents the content as original plugin features', async () => {
  const readme = await readFile(join(root, 'README.md'), 'utf8')
  assert.match(readme, /dsh-plugin/)
  assert.doesNotMatch(readme, /github\.com|api\.github\.com/i)
})
