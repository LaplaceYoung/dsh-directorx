import { readdir, readFile } from 'node:fs/promises'
import { join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

export interface SkillHit {
  name: string
  description: string
  dir: string
  headings: string[]
  references: string[]
  score: number
  snippet: string
}

interface SkillRecord extends Omit<SkillHit, 'score' | 'snippet'> {
  body: string
}

const MAX_READ = 40_000

function tokens(value: string): Set<string> {
  const out = new Set<string>()
  for (const word of value.toLowerCase().match(/[a-z0-9][a-z0-9_-]{1,}/g) ?? []) out.add(word)
  const han = value.replace(/[^\u4e00-\u9fff]/g, '')
  for (let i = 0; i < han.length; i += 1) {
    out.add(han[i] ?? '')
    if (i + 1 < han.length) out.add(han.slice(i, i + 2))
  }
  return out
}

function overlap(a: Set<string>, b: Set<string>): number {
  let n = 0
  for (const token of a) if (b.has(token)) n += 1
  return n
}

export class SkillIndex {
  private root = resolve(process.cwd(), 'skills')
  private cache?: Promise<SkillRecord[]>

  setRoot(root: string): void {
    this.root = resolve(root)
    this.cache = undefined
  }

  private load(): Promise<SkillRecord[]> {
    if (this.cache === undefined) this.cache = this.scan()
    return this.cache
  }

  private async scan(): Promise<SkillRecord[]> {
    const records: SkillRecord[] = []
    const walk = async (dir: string): Promise<void> => {
      let entries
      try {
        entries = await readdir(dir, { withFileTypes: true })
      } catch {
        return
      }
      for (const entry of entries) {
        const path = join(dir, entry.name)
        if (entry.isDirectory()) {
          await walk(path)
          continue
        }
        if (entry.name !== 'SKILL.md') continue
        const body = await readFile(path, 'utf8').catch(() => '')
        if (body === '') continue
        const name = /(?:^|\n)name:\s*([a-z0-9-]+)/.exec(body)?.[1] ?? relative(this.root, dir).replaceAll(sep, '-')
        const description = /(?:^|\n)description:\s*(?:\||>-)\s*\n([\s\S]*?)(?:\n[a-zA-Z][a-zA-Z0-9_-]*:|\n---)/.exec(body)?.[1]
          ?.replace(/\n\s+/g, ' ').trim()
          ?? /(?:^|\n)description:\s*(.+)/.exec(body)?.[1]?.trim()
          ?? body.slice(0, 400)
        const headings = [...body.matchAll(/^##\s+(.+)$/gm)].map(match => match[1] ?? '').filter(Boolean)
        const sibling = await readdir(dir, { withFileTypes: true }).catch(() => [])
        const references: string[] = []
        for (const child of sibling) {
          if (child.isDirectory() && (child.name === 'references' || child.name === 'examples')) {
            const nested = await readdir(join(dir, child.name)).catch(() => [])
            for (const file of nested) {
              if (file.endsWith('.md') || file.endsWith('.json')) references.push(`${child.name}/${file}`)
            }
          }
        }
        records.push({
          name,
          description,
          dir: relative(this.root, dir) || name,
          headings,
          references,
          body,
        })
      }
    }
    await walk(this.root)
    return records
  }

  async search(query: string, maxResults = 8): Promise<SkillHit[]> {
    const q = query.trim()
    if (q === '') return []
    const queryTokens = tokens(q)
    const records = await this.load()
    const hits: SkillHit[] = []
    for (const record of records) {
      const hay = `${record.name} ${record.description} ${record.headings.join(' ')} ${record.references.join(' ')} ${record.body.slice(0, 2_000)}`
      let score = overlap(queryTokens, tokens(hay))
      if (record.name === q.toLowerCase() || record.name.includes(q.toLowerCase())) score += 20
      if (hay.toLowerCase().includes(q.toLowerCase())) score += 12
      if (score <= 0) continue
      hits.push({
        name: record.name,
        description: record.description.slice(0, 240),
        dir: record.dir,
        headings: record.headings,
        references: record.references,
        score,
        snippet: record.headings.slice(0, 4).join(' · ') || record.description.slice(0, 160),
      })
    }
    return hits.sort((a, b) => b.score - a.score).slice(0, Math.max(1, maxResults))
  }

  async read(name: string, file?: string): Promise<{ name: string; path: string; content: string; references: string[] }> {
    const records = await this.load()
    const wanted = name.trim()
    const record = records.find(item => item.name === wanted || item.dir === wanted || item.dir.endsWith(wanted))
    if (record === undefined) throw new Error(`Unknown skill "${wanted}". Use directorx_skill_search first.`)
    if (file !== undefined && file.trim() !== '') {
      const rel = file.trim().replace(/^\/+/, '')
      if (rel.includes('..')) throw new Error('skill file path escapes the skill folder')
      const path = join(this.root, record.dir, rel)
      const content = await readFile(path, 'utf8')
      return { name: record.name, path: `${record.dir}/${rel}`, content: content.slice(0, MAX_READ), references: record.references }
    }
    return {
      name: record.name,
      path: `${record.dir}/SKILL.md`,
      content: record.body.slice(0, MAX_READ),
      references: record.references,
    }
  }
}

export const skillIndex = new SkillIndex()

export function defaultSkillRoot(): string {
  return fileURLToPath(new URL('../skills/', import.meta.url))
}
