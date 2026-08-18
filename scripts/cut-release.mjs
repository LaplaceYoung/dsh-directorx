#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { extractReleaseNotes, packageVersion } from './release-notes.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dry = process.argv.includes('--dry-run')
const allowDirty = process.argv.includes('--allow-dirty')

function git(args, opts = {}) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', ...opts }).trim()
}

const version = packageVersion(root)
const tag = `v${version}`
const notes = extractReleaseNotes(readFileSync(join(root, 'CHANGELOG.md'), 'utf8'), version)
const status = git(['status', '--porcelain'])
if (status !== '' && !allowDirty) {
  throw new Error('working tree is dirty; commit first or pass --allow-dirty')
}

const existing = git(['tag', '-l', tag])
if (existing === tag) {
  console.log(`tag ${tag} already exists`)
} else if (dry) {
  console.log(`would create annotated tag ${tag}`)
} else {
  git(['tag', '-a', tag, '-m', `DirectorX ${version}`])
  console.log(`created ${tag}`)
}

if (!dry) {
  git(['push', 'origin', 'HEAD'])
  git(['push', 'origin', tag])
}

const notesFile = join(tmpdir(), `directorx-release-${version}.md`)
writeFileSync(notesFile, `${notes}\n`)
try {
  if (dry) {
    console.log(`would publish GitHub Release ${tag}`)
  } else {
    try {
      execFileSync('gh', ['release', 'view', tag], { cwd: root, stdio: 'ignore' })
      execFileSync('gh', ['release', 'edit', tag, '--title', `DirectorX ${version}`, '--notes-file', notesFile], { cwd: root, stdio: 'inherit' })
    } catch {
      execFileSync('gh', ['release', 'create', tag, '--title', `DirectorX ${version}`, '--notes-file', notesFile, '--verify-tag'], {
        cwd: root,
        stdio: 'inherit',
      })
    }
  }
} finally {
  try { unlinkSync(notesFile) } catch { /* ignore */ }
}

console.log(`release ${tag} ready`)
