import { readdir, readFile } from 'node:fs/promises'
import { join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expandCraftQuery } from './craft-map.ts'
import { overlapScore, textTokens } from './text-tokens.ts'

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
  absDir: string
}

const MAX_READ = 40_000

const expandQuery = expandCraftQuery

const tokens = textTokens
const overlap = overlapScore

export class SkillIndex {
  private root = resolve(process.cwd(), 'skills')
  private extraRoots: string[] = []
  private cache?: Promise<SkillRecord[]>

  setRoot(root: string): void {
    this.root = resolve(root)
    this.cache = undefined
  }

  setExtraRoots(roots: string[]): void {
    this.extraRoots = [...new Set(roots.map(item => resolve(item)))]
    this.cache = undefined
  }

  invalidate(): void {
    this.cache = undefined
  }

  private load(): Promise<SkillRecord[]> {
    if (this.cache === undefined) this.cache = this.scan()
    return this.cache
  }

  private async scan(): Promise<SkillRecord[]> {
    const records: SkillRecord[] = []
    const seen = new Set<string>()
    const walkRoot = async (root: string): Promise<void> => {
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
          const name = /(?:^|\n)name:\s*([a-z0-9-]+)/.exec(body)?.[1] ?? relative(root, dir).replaceAll(sep, '-')
          if (seen.has(name)) continue
          seen.add(name)
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
            dir: relative(root, dir) || name,
            absDir: dir,
            headings,
            references,
            body,
          })
        }
      }
      await walk(root)
    }
    await walkRoot(this.root)
    for (const extra of this.extraRoots) {
      if (resolve(extra) === this.root) continue
      await walkRoot(extra)
    }
    return records
  }

  async isBundledName(name: string): Promise<boolean> {
    const wanted = name.trim()
    if (wanted === '') return false
    const records = await this.load()
    const record = records.find(item => item.name === wanted)
    if (record === undefined) return false
    return record.absDir.startsWith(this.root + sep) || record.absDir === this.root
  }

  async search(query: string, maxResults = 8): Promise<SkillHit[]> {
    const q = query.trim()
    if (q === '') return []
    const queryTokens = tokens(expandQuery(q))
    const records = await this.load()
    const hits: SkillHit[] = []
    for (const record of records) {
      const hay = `${record.name} ${record.description} ${record.headings.join(' ')} ${record.references.join(' ')} ${record.body.slice(0, 2_000)}`
      let score = overlap(queryTokens, tokens(hay))
      if (queryTokens.has(record.name)) score += 40
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
      const path = join(record.absDir, rel)
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
