#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

export function packageVersion(dir = root) {
  return JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).version
}

export function extractReleaseNotes(changelog, version) {
  const header = `## [${version}]`
  const start = changelog.indexOf(header)
  if (start < 0) throw new Error(`CHANGELOG.md is missing ${header}`)
  const rest = changelog.slice(start + header.length)
  const next = rest.search(/\n## \[/)
  const body = (next < 0 ? rest : rest.slice(0, next)).replace(/^\s*[-–—]\s*\d{4}-\d{2}-\d{2}\s*/, '').trim()
  if (body === '') throw new Error(`CHANGELOG.md section ${header} is empty`)
  return body
}

const invoked = process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1]
if (invoked) {
  const version = process.argv[2] ?? packageVersion()
  const notes = extractReleaseNotes(readFileSync(join(root, 'CHANGELOG.md'), 'utf8'), version)
  process.stdout.write(`${notes}\n`)
}
