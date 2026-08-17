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

const SYNONYMS: Array<[RegExp, string]> = [
  [/首尾帧|首帧|尾帧|first.?frame|last.?frame/i, '图生视频 image-to-video i2v 首帧 尾帧'],
  [/图生视频|i2v|image.to.video/i, '首尾帧 首帧 参考图'],
  [/三视图|设定图|正侧背|turnaround|character sheet/i, '角色 设定 三视图 正视 侧视 背视'],
  [/分镜|storyboard|镜号/i, '分镜 镜头 景别 运镜'],
  [/调色|lut|grade|色板|配色/i, '调色 色彩 胶片 青橙'],
  [/一致性|continuity|锚点/i, '角色一致性 跨镜 参考图'],
  [/口播|配音|tts|旁白/i, '音频 语音 口播 字幕'],
  [/质检|qa|黑场|响度/i, '成片质检 时长 画幅'],
]

function expandQuery(query: string): string {
  let extra = ''
  for (const [pattern, words] of SYNONYMS) {
    if (pattern.test(query)) extra += ` ${words}`
  }
  return `${query} ${extra}`.trim()
}

function textTokens(value: string): Set<string> {
  const tokens = new Set<string>()
  const words = value.toLowerCase().match(/[a-z0-9][a-z0-9_-]{1,}/g)
  for (const word of words ?? []) {
    tokens.add(word)
    if (word.length > 3) tokens.add(word.slice(0, 4))
  }
  const han = value.replace(/[^\u4e00-\u9fff]/g, '')
  for (let i = 0; i < han.length; i += 1) {
    tokens.add(han[i] ?? '')
    if (i + 1 < han.length) tokens.add(han.slice(i, i + 2))
  }
  return tokens
}

function overlapScore(a: Set<string>, b: Set<string>): number {
  let hit = 0
  for (const token of a) if (b.has(token)) hit += 1
  return hit
}

function scoreMeta(query: string, queryTokens: Set<string>, article: KnowledgeArticle): number {
  const title = article.title
  const slug = article.slug
  const group = article.group ?? ''
  const lower = query.toLowerCase()
  let score = overlapScore(queryTokens, textTokens(`${title} ${slug} ${group}`)) * 6
  score += overlapScore(queryTokens, textTokens(title)) * 4
  if (title.toLowerCase().includes(lower) || slug.toLowerCase().includes(lower)) score += 80
  if (title.toLowerCase().startsWith(lower) || slug.startsWith(lower.replace(/\s+/g, '-'))) score += 40
  if (group !== '' && overlapScore(queryTokens, textTokens(group)) > 0) score += 8
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

  async search(query: string, maxResults = 8, options: { group?: string } = {}): Promise<KnowledgeSearchHit[]> {
    const q = query.trim()
    if (q === '') return []
    const expanded = expandQuery(q)
    const queryTokens = textTokens(expanded)
    if (queryTokens.size === 0) return []
    const groupFilter = options.group?.trim().toLowerCase()
    const articles = (await this.loadInventory()).filter(article => (
      groupFilter === undefined || groupFilter === '' || (article.group ?? '').toLowerCase() === groupFilter
    ))
    const prelim: Array<{ article: KnowledgeArticle; score: number }> = []
    for (const article of articles) {
      const score = scoreMeta(q, queryTokens, article)
      if (score > 0) prelim.push({ article, score })
    }
    prelim.sort((a, b) => b.score - a.score)
    const shortlist = prelim.slice(0, Math.max(24, maxResults * 4))
    const refined: KnowledgeSearchHit[] = []
    for (const item of shortlist) {
      const body = await this.read(item.article.path).catch(() => '')
      const score = item.score + overlapScore(queryTokens, textTokens(body.slice(0, 4_000)))
      refined.push({
        ...item.article,
        score,
        snippet: makeSnippet(body, textTokens(q)),
      })
    }
    return refined.sort((a, b) => b.score - a.score).slice(0, Math.max(1, maxResults))
  }

  async related(ref: string, maxResults = 3): Promise<KnowledgeSearchHit[]> {
    const { article } = await this.readArticle(ref)
    const hits = await this.search(`${article.title} ${article.group ?? ''}`, maxResults + 1)
    return hits.filter(hit => hit.id !== article.id).slice(0, maxResults)
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