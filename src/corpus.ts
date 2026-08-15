import { readFile } from 'node:fs/promises'
import { join, resolve, sep } from 'node:path'

export interface KnowledgeArticle {
  number: number
  id: string
  slug: string
  title: string
  path: string
  group?: string
  chars?: number
  sourceStatus?: string
}

export interface KnowledgeSearchHit extends KnowledgeArticle {
  score: number
  snippet: string
}

interface Inventory {
  articles?: Array<{
    number?: number
    id?: string
    slug?: string
    title?: string
    path?: string
    group?: string
    chars?: number
    source_status?: string
  }>
}

interface RedirectMap {
  [id: string]: { to?: number | string }
}

const MAX_READ_CHARS = 60_000

function normPath(value: string): string {
  return value.replaceAll('\\', '/').replace(/^\/+/, '')
}

function textTokens(value: string): Set<string> {
  const tokens = new Set<string>()
  const words = value.toLowerCase().match(/[a-z0-9][a-z0-9_-]{1,}/g)
  for (const word of words ?? []) {
    tokens.add(word)
    if (word.length > 3) tokens.add(word.slice(0, 4))
  }
  const han = value.replace(/[^\u4e00-\u9fff]/g, '')
  for (let i = 0; i < han.length - 1; i += 1) tokens.add(han.slice(i, i + 2))
  return tokens
}

function overlapScore(a: Set<string>, b: Set<string>): number {
  let hit = 0
  for (const token of a) if (b.has(token)) hit += 1
  return hit
}

function scoreQuery(queryTokens: Set<string>, title: string, body: string): number {
  const titleTokens = textTokens(title)
  const bodyTokens = textTokens(body)
  let score = overlapScore(queryTokens, titleTokens) * 8
  score += overlapScore(queryTokens, bodyTokens)
  // Prefer articles explicitly authored around generation and prompting.
  if (/prompt|提示词|generation|生成|模型/.test(title)) score += 2
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
      return (data.articles ?? [])
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
        }))
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

  async search(query: string, maxResults = 8): Promise<KnowledgeSearchHit[]> {
    const q = query.trim()
    if (q === '') return []
    const queryTokens = textTokens(q)
    if (queryTokens.size === 0) return []
    const articles = await this.loadInventory()
    const scored: Array<{ article: KnowledgeArticle; score: number }> = []
    const exactTitle: KnowledgeSearchHit[] = []
    for (const article of articles) {
      if (article.title.toLowerCase().includes(q.toLowerCase())) {
        exactTitle.push({ ...article, score: 10_000, snippet: article.title })
        continue
      }
      const body = await this.read(article.path).catch(() => '')
      const score = scoreQuery(queryTokens, article.title, body)
      if (score > 0) scored.push({ article, score })
    }
    const ranked = exactTitle
      .concat(scored.sort((a, b) => b.score - a.score).map(item => ({
        ...item.article,
        score: item.score,
        snippet: '',
      })))
      .slice(0, Math.max(1, maxResults))
    for (const hit of ranked) {
      if (hit.snippet === '' || hit.snippet === hit.title) {
        const body = await this.read(hit.path).catch(() => '')
        hit.snippet = makeSnippet(body, queryTokens)
      }
    }
    return ranked
  }

  async readArticle(ref: string): Promise<{ article: KnowledgeArticle; content: string; redirectedFrom?: string }> {
    const inventory = await this.loadInventory()
    const wanted = ref.trim()
    const byId = inventory.find(article => article.id === wanted || article.slug === wanted || String(article.number) === wanted)
    if (byId !== undefined) {
      const content = await this.read(byId.path)
      return { article: byId, content: content.slice(0, MAX_READ_CHARS) }
    }
    const redirects = await this.redirects()
    const target = redirects[wanted]?.to
    if (target !== undefined) {
      const byTarget = inventory.find(article => String(article.number) === String(target) || article.id === String(target))
      if (byTarget !== undefined) {
        const content = await this.read(byTarget.path)
        return { article: byTarget, content: content.slice(0, MAX_READ_CHARS), redirectedFrom: wanted }
      }
    }
    const normalized = normPath(wanted).replace(/^knowledge\//, '')
    if (inventory.some(article => article.path === normalized)) {
      const article = inventory.find(item => item.path === normalized)
      if (article !== undefined) {
        const content = await this.read(article.path)
        return { article, content: content.slice(0, MAX_READ_CHARS) }
      }
    }
    throw new Error(`Unknown knowledge article "${wanted}". Use directorx_knowledge_search first, then read an id/slug/path from the results.`)
  }
}

export const corpus = new DirectorxCorpus()