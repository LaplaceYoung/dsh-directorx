import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { resolveOutputDir } from './support.ts'
import {
  buildIpBrief,
  mergeNegativeLine,
  type IpKind,
  type IpMemoryHint,
  type IpRewriteBrief,
} from './ip-lexicon.ts'

export interface IpMemoryEntry {
  id: string
  terms: string[]
  kind: IpKind
  source: string
  rewrite: string
  keep: string[]
  exclude: string[]
  uses: number
  at: number
}

const FILE = 'ip-memory.json'
const MAX = 80

function norm(term: string): string {
  return term.toLowerCase().replace(/[\s_-]+/g, '')
}

function keysOf(terms: string[]): Set<string> {
  return new Set(terms.map(norm).filter(item => item !== ''))
}

function overlap(left: string[], right: string[]): boolean {
  const want = keysOf(right)
  for (const term of left) {
    if (want.has(norm(term))) return true
  }
  return false
}

export class IpMemoryStore {
  private memo: { at: number; entries: IpMemoryEntry[] } | undefined

  constructor(private readonly outputDir: string) {}

  private filePath(): string {
    return join(resolveOutputDir(this.outputDir), FILE)
  }

  async read(): Promise<IpMemoryEntry[]> {
    if (this.memo !== undefined && Date.now() - this.memo.at < 1500) return this.memo.entries
    try {
      const parsed = JSON.parse(await readFile(this.filePath(), 'utf8')) as { entries?: IpMemoryEntry[] }
      const entries = Array.isArray(parsed.entries) ? parsed.entries : []
      this.memo = { at: Date.now(), entries }
      return entries
    } catch {
      this.memo = { at: Date.now(), entries: [] }
      return []
    }
  }

  private async write(entries: IpMemoryEntry[]): Promise<void> {
    const next = entries.slice(-MAX)
    this.memo = { at: Date.now(), entries: next }
    await mkdir(resolveOutputDir(this.outputDir), { recursive: true })
    await writeFile(this.filePath(), JSON.stringify({ entries: next }, null, 2), 'utf8')
  }

  async remember(input: {
    terms: string[]
    kind: IpKind
    source: string
    rewrite: string
    keep: string[]
    exclude: string[]
  }): Promise<IpMemoryEntry> {
    const terms = [...new Set(input.terms.map(item => item.trim()).filter(item => item !== ''))].slice(0, 16)
    const rewrite = input.rewrite.trim().slice(0, 2000)
    const source = input.source.trim().slice(0, 400)
    if (terms.length === 0 || rewrite === '') {
      throw new Error('ip memory needs terms and rewrite')
    }
    const ledger = await this.read()
    const index = ledger.findIndex(entry => overlap(entry.terms, terms))
    const now = Date.now()
    if (index >= 0) {
      const prev = ledger[index]
      const next: IpMemoryEntry = {
        ...prev,
        terms: [...new Set([...prev.terms, ...terms])].slice(0, 16),
        kind: input.kind,
        source,
        rewrite,
        keep: input.keep.slice(0, 8),
        exclude: [...new Set([...prev.exclude, ...input.exclude])].slice(0, 24),
        uses: prev.uses + 1,
        at: now,
      }
      ledger[index] = next
      await this.write(ledger)
      return next
    }
    const created: IpMemoryEntry = {
      id: `ipm-${now.toString(36)}`,
      terms,
      kind: input.kind,
      source,
      rewrite,
      keep: input.keep.slice(0, 8),
      exclude: input.exclude.slice(0, 24),
      uses: 1,
      at: now,
    }
    ledger.push(created)
    await this.write(ledger)
    return created
  }

  async recall(text: string): Promise<IpMemoryEntry[]> {
    const seed = text.trim()
    if (seed === '') return []
    const brief = buildIpBrief(seed)
    const needles = brief.dirty
      ? [...brief.hits.flatMap(hit => [hit.term, ...hit.exclude]), ...brief.exclude]
      : seed.split(/[\s,，。；;]+/).filter(item => item.length >= 2)
    const ranked = (await this.read())
      .filter(entry => overlap(entry.terms, needles) || overlap(entry.exclude, needles))
      .sort((left, right) => right.uses - left.uses || right.at - left.at)
    return ranked.slice(0, 5)
  }

  asHints(entries: IpMemoryEntry[]): IpMemoryHint[] {
    return entries.map(entry => ({
      terms: entry.terms,
      kind: entry.kind,
      source: entry.source,
      rewrite: entry.rewrite,
      uses: entry.uses,
    }))
  }
}

export async function scanIpWithMemory(outputDir: string, prompt: string): Promise<{
  brief: IpRewriteBrief
  memory: IpMemoryEntry[]
}> {
  const store = new IpMemoryStore(outputDir)
  const memory = await store.recall(prompt)
  return { brief: buildIpBrief(prompt, { memory: store.asHints(memory) }), memory }
}

export async function commitIpRewrite(outputDir: string, input: {
  source: string
  rewrite: string
  remember?: boolean
}): Promise<Record<string, unknown>> {
  const source = input.source.trim()
  const rewrite = input.rewrite.trim()
  if (source === '' || rewrite === '') {
    return { ok: false, refused: true, next: 'source 与 rewrite 都不能空' }
  }
  const store = new IpMemoryStore(outputDir)
  const memory = await store.recall(source)
  const hints = store.asHints(memory)
  const sourceBrief = buildIpBrief(source, { memory: hints })
  const rewriteBrief = buildIpBrief(rewrite, { memory: hints })
  if (rewriteBrief.dirty) {
    return {
      ok: false,
      refused: true,
      brief: rewriteBrief,
      memory,
      next: rewriteBrief.next,
    }
  }
  let saved: IpMemoryEntry | undefined
  if (input.remember !== false && sourceBrief.dirty) {
    saved = await store.remember({
      terms: [...new Set(sourceBrief.hits.flatMap(hit => [hit.term, ...hit.exclude]))],
      kind: sourceBrief.hits[0]?.kind ?? 'character',
      source,
      rewrite,
      keep: sourceBrief.keep,
      exclude: sourceBrief.exclude,
    })
  }
  const recalled = await store.recall(source)
  return {
    ok: true,
    brief: sourceBrief,
    rewrite,
    negativeLine: mergeNegativeLine(undefined, sourceBrief.exclude),
    memory: recalled,
    ...(saved !== undefined ? { saved } : {}),
    next: [
      'directorx_prompt_craft：intent=用户原句，prompt=这次 rewrite',
      'generate 时把 negativeLine 写入 negative_prompt',
    ],
  }
}
