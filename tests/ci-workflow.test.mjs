import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('CI workflow pins node 22.19, npm ci, npm test, and lib/ sync', () => {
  const text = readFileSync(new URL('../.github/workflows/test.yml', import.meta.url), 'utf8')
  assert.doesNotMatch(text, /^\t/m, 'workflow must be space-indented YAML')
  assert.match(text, /^name:\s*test\s*$/m)
  assert.match(text, /ubuntu-latest/)
  assert.match(text, /node-version:\s*'22\.19'/)
  assert.match(text, /npm ci/)
  assert.match(text, /npm test/)
  assert.match(text, /git diff --exit-code lib\//)
})
