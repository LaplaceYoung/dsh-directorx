import { readFile } from 'node:fs/promises'
import { join, resolve, sep } from 'node:path'
import { expandCraftQuery } from './craft-map.ts'
import {
  extractMarkdownLinks,
  isStale,
  normalizeOkfType,
  parseOkfDocument,
  resolveOkfHref,
  trustTier,
} from './okf.ts'
import { overlapScore, textTokens } from './text-tokens.ts'

export interface KnowledgeArticle {
  number: number
  id: string
  slug: string
  title: string
  path: string
  group?: string
  chars?: number
  sourceStatus?: string
  type?: string
  description?: string
  tags?: string[]
  status?: string
  aliases?: string[]
  related?: string[]
  staleAfter?: string
  trust?: 'unverified' | 'machine-confirmed' | 'human-reviewed'
}

export interface KnowledgeSearchHit extends KnowledgeArticle {
  score: number
  snippet: string
  stale?: boolean
}

export interface KnowledgeSearchOptions {
  group?: string
  type?: string
  tag?: string
}

interface Inventory {
  okf_version?: string
  articles?: Array<{
    number?: number
    id?: string
    slug?: string
    title?: string
    path?: string
    group?: string
    chars?: number
    source_status?: string
    type?: string
    description?: string
    tags?: string[]
    status?: string
    aliases?: string[]
    related?: string[]
    stale_after?: string | null
  }>
}

interface RedirectMap {
  [id: string]: { to?: number | string }
}

const MAX_READ_CHARS = 60_000

function normPath(value: string): string {
  return value.replaceAll('\\', '/').replace(/^\/+/, '')
}

const expandQuery = expandCraftQuery

function scoreMeta(query: string, queryTokens: Set<string>, article: KnowledgeArticle): number {
  const title = article.title
  const slug = article.slug
  const group = article.group ?? ''
  const description = article.description ?? ''
  const tags = article.tags ?? []
  const type = article.type ?? ''
  const aliases = article.aliases ?? []
  const lower = query.toLowerCase()
  let score = overlapScore(queryTokens, textTokens(`${title} ${slug} ${group}`)) * 6
  score += overlapScore(queryTokens, textTokens(title)) * 4
  score += overlapScore(queryTokens, textTokens(description)) * 5
  score += overlapScore(queryTokens, textTokens(tags.join(' '))) * 8
  score += overlapScore(queryTokens, textTokens(type)) * 4
  if (title.toLowerCase().includes(lower) || slug.toLowerCase().includes(lower)) score += 80
  if (title.toLowerCase().startsWith(lower) || slug.startsWith(lower.replace(/\s+/g, '-'))) score += 40
  if (group !== '' && overlapScore(queryTokens, textTokens(group)) > 0) score += 8
  if (/prompt|提示词|generation|生成|模型/.test(title)) score += 2
  for (const tag of tags) {
    const tagLower = tag.toLowerCase()
    if (queryTokens.has(tag) || queryTokens.has(tagLower) || lower === tagLower) score += 24
    else if (lower.includes(tagLower) && tagLower.length > 2) score += 10
  }
  const normalizedType = normalizeOkfType(query)
  if (type !== '' && normalizedType !== undefined && type.toLowerCase() === normalizedType.toLowerCase()) score += 16
  if (aliases.some(alias => alias.toLowerCase() === lower || queryTokens.has(alias))) score += 36
  if ((article.tags ?? []).includes('overlap-review')) score -= 28
  if (/(总合成|终极统一|终索引|总应用|总设计)/.test(title)) score -= 24
  return score
}

function makeSnippet(body: string, queryTokens: Set<string>): string {
  const clean = body.replace(/\s+/g, ' ').trim()
  const lower = clean.toLowerCase()
  let best = -1
  let bestIndex = 0
  for (const token of queryTokens) {
    const index = lower.indexOf(token)
    if (index >= 0 && (best < 0 || index < bestIndex)) {
      best = index
      bestIndex = index
    }
  }
  const start = best >= 0 ? Math.max(0, best - 80) : 0
  const snippet = clean.slice(start, start + 280).trim()
  return snippet === '' ? clean.slice(0, 240) : snippet
}

export class DirectorxCorpus {
  private root = resolve(process.cwd(), 'knowledge')
  private inventoryPath = join(this.root, '_meta', 'inventory.json')
  private redirectsPath = join(this.root, '_meta', 'redirects.json')
  private inventory?: Promise<KnowledgeArticle[]>
  private cache = new Map<string, string>()

  setRoot(root: string): void {
    this.root = resolve(root)
    this.inventoryPath = join(this.root, '_meta', 'inventory.json')
    this.redirectsPath = join(this.root, '_meta', 'redirects.json')
    this.inventory = undefined
    this.cache.clear()
  }

  private loadInventory(): Promise<KnowledgeArticle[]> {
    if (this.inventory === undefined) {
      this.inventory = this.readInventory()
    }
    return this.inventory
  }

  private async readInventory(): Promise<KnowledgeArticle[]> {
    try {
      const raw = await readFile(this.inventoryPath, 'utf8')
      const data = JSON.parse(raw) as Inventory
      const articles = (data.articles ?? [])
        .filter(article => typeof article.path === 'string')
        .map(article => ({
          number: article.number ?? 0,
          id: article.id ?? '',
          slug: article.slug ?? '',
          title: article.title ?? article.slug ?? article.id ?? '',
          path: normPath(article.path ?? '').replace(/^knowledge\//, ''),
          group: article.group,
          chars: article.chars,
          sourceStatus: article.source_status,
          type: article.type,
          description: article.description,
          tags: article.tags,
          status: article.status,
          aliases: article.aliases,
          related: article.related,
          staleAfter: article.stale_after ?? undefined,
        }))
      return preferCanonical(articles)
    } catch {
      return []
    }
  }

  private async redirects(): Promise<RedirectMap> {
    try {
      const raw = await readFile(this.redirectsPath, 'utf8')
      return JSON.parse(raw) as RedirectMap
    } catch {
      return {}
    }
  }

  private safePath(path: string): string {
    const base = resolve(this.root)
    const target = resolve(base, path)
    if (target !== base && !target.startsWith(base + sep)) {
      throw new Error(`Knowledge path escapes corpus root: ${path}`)
    }
    return target
  }

  private async read(path: string): Promise<string> {
    const cached = this.cache.get(path)
    if (cached !== undefined) return cached
    const content = await readFile(this.safePath(path), 'utf8')
    this.cache.set(path, content)
    return content
  }

  async list(): Promise<KnowledgeArticle[]> {
    return this.loadInventory()
  }

  async search(query: string, maxResults = 8, options: KnowledgeSearchOptions = {}): Promise<KnowledgeSearchHit[]> {
    const q = query.trim()
    if (q === '') return []
    const expanded = expandQuery(q)
    const queryTokens = textTokens(expanded)
    if (queryTokens.size === 0) return []
    const groupFilter = options.group?.trim().toLowerCase()
    const typeFilter = normalizeOkfType(options.type)?.toLowerCase()
    const tagFilter = options.tag?.trim().toLowerCase()
    const articles = (await this.loadInventory()).filter(article => {
      if (groupFilter !== undefined && groupFilter !== '' && (article.group ?? '').toLowerCase() !== groupFilter) return false
      if (typeFilter !== undefined && (article.type ?? '').toLowerCase() !== typeFilter) return false
      if (tagFilter !== undefined && tagFilter !== '' && !(article.tags ?? []).some(tag => tag.toLowerCase() === tagFilter)) return false
      return true
    })
    const prelim: Array<{ article: KnowledgeArticle; score: number }> = []
    for (const article of articles) {
      const score = scoreMeta(q, queryTokens, article)
      if (score > 0) prelim.push({ article, score })
    }
    prelim.sort((a, b) => b.score - a.score)
    const shortlist = prelim.slice(0, Math.max(24, maxResults * 4))
    const refined: KnowledgeSearchHit[] = []
    for (const item of shortlist) {
      const raw = await this.read(item.article.path).catch(() => '')
      const doc = parseOkfDocument(raw)
      const body = doc.body || raw
      const score = item.score + overlapScore(queryTokens, textTokens(`${doc.frontmatter.description ?? ''}\n${body.slice(0, 4_000)}`))
      refined.push({
        ...item.article,
        type: doc.frontmatter.type || item.article.type,
        description: doc.frontmatter.description ?? item.article.description,
        tags: doc.frontmatter.tags ?? item.article.tags,
        score,
        snippet: makeSnippet(body, textTokens(q)),
        stale: isStale({ type: doc.frontmatter.type, stale_after: doc.frontmatter.stale_after ?? item.article.staleAfter }),
        trust: trustTier(doc.frontmatter),
      })
    }
    return refined.sort((a, b) => b.score - a.score).slice(0, Math.max(1, maxResults))
  }

  async related(ref: string, maxResults = 3): Promise<KnowledgeSearchHit[]> {
    const { article } = await this.readArticle(ref)
    const inventory = await this.loadInventory()
    const scores = new Map<string, number>()
    const bump = (target: KnowledgeArticle | undefined, amount: number) => {
      if (target === undefined || target.id === article.id) return
      scores.set(target.id, (scores.get(target.id) ?? 0) + amount)
    }
    for (const rel of article.related ?? []) {
      bump(inventory.find(item => item.path === rel || item.path.endsWith(rel)), 50)
    }
    for (const other of inventory) {
      if ((other.related ?? []).some(rel => rel === article.path || article.path.endsWith(rel))) {
        bump(other, 30)
      }
    }
    const raw = await this.read(article.path).catch(() => '')
    const doc = parseOkfDocument(raw)
    for (const link of extractMarkdownLinks(doc.body)) {
      const resolved = resolveOkfHref(article.path, link.href)
      if (resolved === undefined) continue
      bump(inventory.find(item => item.path === resolved), 40)
    }
    const tags = new Set((article.tags ?? []).filter(tag => tag !== article.group && tag !== 'overlap-review'))
    if (tags.size > 0) {
      for (const other of inventory) {
        const overlap = (other.tags ?? []).filter(tag => tags.has(tag)).length
        if (overlap > 0) bump(other, overlap * 8)
      }
    }
    const ranked: KnowledgeSearchHit[] = []
    const sortedIds = [...scores.entries()].sort((left, right) => right[1] - left[1])
    for (const [id, score] of sortedIds) {
      const hit = inventory.find(item => item.id === id)
      if (hit === undefined) continue
      ranked.push({
        ...hit,
        score,
        snippet: hit.description ?? hit.title,
        stale: isStale({ type: hit.type ?? '', stale_after: hit.staleAfter }),
      })
      if (ranked.length >= maxResults) return ranked
    }
    const fallback = await this.search(`${article.title} ${article.group ?? ''} ${(article.tags ?? []).join(' ')}`, maxResults + 1)
    const seen = new Set(ranked.map(item => item.id))
    for (const hit of fallback) {
      if (hit.id === article.id || seen.has(hit.id)) continue
      ranked.push(hit)
      if (ranked.length >= maxResults) break
    }
    return ranked
  }

  async readArticle(ref: string): Promise<{ article: KnowledgeArticle; content: string; redirectedFrom?: string }> {
    const inventory = await this.loadInventory()
    const wanted = ref.trim()
    const direct = matchArticle(inventory, wanted)
    if (direct !== undefined) return this.hydrate(direct)
    const redirects = await this.redirects()
    const target = redirects[wanted]?.to
    if (target !== undefined) {
      const byTarget = matchArticle(inventory, String(target))
        ?? inventory.find(article => String(article.number) === String(target) || article.id === String(target))
      if (byTarget !== undefined) {
        const read = await this.hydrate(byTarget)
        return { ...read, redirectedFrom: wanted }
      }
    }
    const normalized = normPath(wanted).replace(/^knowledge\//, '')
    const byPath = inventory.find(article => article.path === normalized)
    if (byPath !== undefined) return this.hydrate(byPath)
    throw new Error(`Unknown knowledge article "${wanted}". Use directorx_knowledge_search first, then read an id/slug/path from the results.`)
  }

  private async hydrate(article: KnowledgeArticle): Promise<{ article: KnowledgeArticle; content: string }> {
    const raw = await this.read(article.path)
    const doc = parseOkfDocument(raw)
    return {
      article: {
        ...article,
        type: doc.frontmatter.type || article.type,
        title: doc.frontmatter.title || article.title,
        description: doc.frontmatter.description ?? article.description,
        tags: doc.frontmatter.tags ?? article.tags,
        status: doc.frontmatter.status ?? article.status,
        aliases: doc.frontmatter.aliases ?? article.aliases,
        related: doc.frontmatter.related ?? article.related,
        staleAfter: doc.frontmatter.stale_after ?? article.staleAfter,
        trust: trustTier(doc.frontmatter),
      },
      content: raw.slice(0, MAX_READ_CHARS),
    }
  }
}

function matchArticle(inventory: KnowledgeArticle[], wanted: string): KnowledgeArticle | undefined {
  const hits = inventory.filter(article => (
    article.id === wanted
    || article.slug === wanted
    || String(article.number) === wanted
    || (article.aliases ?? []).includes(wanted)
  ))
  if (hits.length === 0) return undefined
  return preferCanonical(hits)[0]
}

function preferCanonical(articles: KnowledgeArticle[]): KnowledgeArticle[] {
  const byId = new Map<string, KnowledgeArticle>()
  const order: string[] = []
  for (const article of articles) {
    const prior = byId.get(article.id)
    if (prior === undefined) {
      byId.set(article.id, article)
      order.push(article.id)
      continue
    }
    const winner = (article.chars ?? 0) >= (prior.chars ?? 0) ? article : prior
    const loser = winner === article ? prior : article
    winner.aliases = [...new Set([...(winner.aliases ?? []), ...(loser.aliases ?? []), loser.slug])]
      .filter(value => value !== winner.id && value !== winner.slug)
    byId.set(article.id, winner)
  }
  return order.map(id => byId.get(id)).filter((article): article is KnowledgeArticle => article !== undefined)
}

export const corpus = new DirectorxCorpus()
