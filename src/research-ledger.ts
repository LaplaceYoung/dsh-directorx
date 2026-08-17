import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { resolveOutputDir } from './support.ts'

export type ResearchKind = 'knowledge' | 'skill'

export interface ResearchEvent {
  kind: ResearchKind
  ref: string
  query?: string
  at: number
}

const FILE = 'research.json'
const MAX = 80
const FRESH_MS = 45 * 60 * 1000

export class ResearchLedger {
  constructor(private readonly outputDir: string) {}

  private filePath(): string {
    return join(resolveOutputDir(this.outputDir), FILE)
  }

  async read(): Promise<ResearchEvent[]> {
    try {
      const parsed = JSON.parse(await readFile(this.filePath(), 'utf8')) as { events?: ResearchEvent[] }
      return Array.isArray(parsed.events) ? parsed.events : []
    } catch {
      return []
    }
  }

  async record(event: Omit<ResearchEvent, 'at'>): Promise<void> {
    const events = await this.read()
    events.push({ ...event, at: Date.now() })
    const next = events.slice(-MAX)
    await mkdir(resolveOutputDir(this.outputDir), { recursive: true })
    await writeFile(this.filePath(), JSON.stringify({ events: next }, null, 2), 'utf8')
  }

  async recent(kind?: ResearchKind, withinMs = FRESH_MS): Promise<ResearchEvent[]> {
    const since = Date.now() - withinMs
    return (await this.read()).filter(event => event.at >= since && (kind === undefined || event.kind === kind))
  }

  async hasReads(input: { knowledge: string[]; skills: string[] }): Promise<{ ok: boolean; missing: string[] }> {
    const recent = await this.recent()
    const knowledge = new Set(recent.filter(event => event.kind === 'knowledge').map(event => event.ref))
    const skills = new Set(recent.filter(event => event.kind === 'skill').map(event => event.ref))
    const missing: string[] = []
    if (input.knowledge.length === 0) missing.push('knowledge')
    if (input.skills.length === 0) missing.push('skill')
    for (const ref of input.knowledge) {
      if (![...knowledge].some(item => item === ref || item.includes(ref) || ref.includes(item))) missing.push(`knowledge:${ref}`)
    }
    for (const name of input.skills) {
      if (![...skills].some(item => item === name || item.includes(name))) missing.push(`skill:${name}`)
    }
    return { ok: missing.length === 0, missing }
  }
}
