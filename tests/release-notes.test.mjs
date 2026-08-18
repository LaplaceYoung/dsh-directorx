import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { extractReleaseNotes, packageVersion } from '../scripts/release-notes.mjs'

test('CHANGELOG has a section for the package version', () => {
  const version = packageVersion()
  const changelog = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8')
  const notes = extractReleaseNotes(changelog, version)
  assert.match(notes, /画布菜单|菜单文案|GitHub Release/)
  assert.throws(() => extractReleaseNotes(changelog, '0.0.0-missing'), /missing/)
})
