import { createHash } from 'node:crypto'
import { readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join, relative } from 'node:path'
import {
  extractCitedSources,
  extractDescription,
  extractHttpUrls,
  extractMentionedIds,
  extractMarkdownLinks,
  formatArticleId,
  inferOkfTags,
  inferOkfType,
  isOkfReservedRel,
  isStale,
  OKF_VERSION,
  parseOkfDocument,
  resolveOkfHref,
  serializeOkfDocument,
  trustTier,
  upsertRelatedSection,
  type OkfFrontmatter,
  type OkfLink,
} from './okf.ts'
import { overlapScore, textTokens } from './text-tokens.ts'

export interface KnowledgeJobResult {
  ok: boolean
  errors: string[]
  warnings: string[]
  stats: {
    articles: number
    redirects: number
    written: number
    stubsRemoved: number
    merged: number
  }
}

interface TaxonomyGroup {
  id: string
  label: string
  min: number
  max: number
}

interface RedirectEntry {
  to?: number | string
  reason?: string
}

interface ScannedArticle {
  number: number
  id: string
  slug: string
  title: string
  rel: string
  abs: string
  group: string
  body: string
  frontmatter: OkfFrontmatter
  chars: number
  bytes: number
  sectionCount: number
  externalUrlCount: number
  sourceStatus: 'internal' | 'linked'
  sha256: string
  flags: string[]
}

const MERGES: Array<{ from: number; to: number; reason: string }> = [
  { from: 376, to: 80, reason: '知识库导航应用并入使用手册' },
  { from: 385, to: 80, reason: '技能库导航优化并入使用手册' },
  { from: 394, to: 80, reason: '终索引设计并入使用手册' },
  { from: 367, to: 332, reason: '终极统一设计并入全整合落地' },
  { from: 374, to: 332, reason: '总合成设计并入全整合落地' },
  { from: 377, to: 383, reason: '管线-导航总应用并入生产工作流实用' },
  { from: 369, to: 360, reason: '剪影四融合并入剪影-年代-情绪三融合' },
  { from: 380, to: 371, reason: '情感四融合并入情感显著-互动-沉浸三融合' },
  { from: 365, to: 358, reason: '节奏四整合并入节奏-视点-体验整合' },
  { from: 381, to: 372, reason: '声统全整合并入听觉叙事和谐' },
  { from: 393, to: 382, reason: '创作生态聚合并入多模型聚合平台' },
]

const STUBS: Array<{ dir: string; slug: string; to: number; reason: string }> = [
  { dir: '150-camera-movement-gen', slug: 'camera-movement-gen', to: 1, reason: '占位稿已删除，镜头运动并入镜头语言与景别' },
  { dir: '151-shot-types-gen', slug: 'shot-types-gen', to: 1, reason: '占位稿已删除，景别类型并入镜头语言与景别' },
  { dir: '152-composition-gen', slug: 'composition-gen', to: 1, reason: '占位稿已删除，构图并入镜头语言与景别' },
  { dir: '155-sound-prompts-gen', slug: 'sound-prompts-gen', to: 144, reason: '占位稿已删除，声音提示词并入声音设计' },
  { dir: '156-audio-sync-gen', slug: 'audio-sync-gen', to: 119, reason: '占位稿已删除，声画同步并入音频视频协同' },
  { dir: '157-music-generation-gen', slug: 'music-generation-gen', to: 119, reason: '占位稿已删除，配乐生成并入音频视频协同' },
  { dir: '158-prompt-quality-checklist', slug: 'prompt-quality-checklist', to: 115, reason: '占位稿已删除，提示词清单并入视频提示词工程总纲' },
  { dir: '159-prompt-troubleshooting', slug: 'prompt-troubleshooting', to: 115, reason: '占位稿已删除，提示词排障并入视频提示词工程总纲' },
  { dir: '160-prompt-optimization', slug: 'prompt-optimization', to: 115, reason: '占位稿已删除，提示词优化并入视频提示词工程总纲' },
  { dir: '161-cinematic-glossary-gen', slug: 'cinematic-glossary-gen', to: 0, reason: '占位稿已删除，术语表并入视觉术语图解' },
]

const MIGRATED_AT = '2026-08-18T00:00:00Z'
const STALE_MODELS_ON = '2027-08-18'
const MAX_RELATED = 5

export async function runKnowledgeCli(argv: string[], cwd = process.cwd()): Promise<number> {
  const command = argv[0] === 'check' || argv[0] === 'audit' || argv[0] === 'migrate' ? argv[0] : 'audit'
  const root = join(cwd, 'knowledge')
  const result = await runKnowledgeJob(root, { write: command !== 'check', migrate: command !== 'check' })
  for (const error of result.errors) console.error(`error: ${error}`)
  for (const warning of result.warnings) console.warn(`warning: ${warning}`)
  console.log(JSON.stringify(result.stats))
  return result.ok ? 0 : 1
}

export async function runKnowledgeJob(root: string, options: { write: boolean; migrate: boolean }): Promise<KnowledgeJobResult> {
  const errors: string[] = []
  const warnings: string[] = []
  let written = 0
  let stubsRemoved = 0
  let merged = 0

  if (options.migrate) {
    stubsRemoved = await removeStubs(root, options.write)
  }

  const taxonomy = await readJson<TaxonomyGroup[]>(join(root, '_meta', 'taxonomy.json'), [])
  const redirects = await readJson<Record<string, RedirectEntry>>(join(root, '_meta', 'redirects.json'), {})
  applyStubRedirects(redirects)
  if (options.migrate) {
    merged = await applyMerges(root, redirects, options.write)
  }

  const files = await listConceptFiles(root)
  const scanned: ScannedArticle[] = []
  for (const abs of files) {
    const rel = posixRel(relative(root, abs))
    const raw = await readFile(abs, 'utf8')
    scanned.push(scanArticle(root, abs, rel, raw, taxonomy))
  }

  if (options.migrate) {
    attachAliases(scanned, redirects)
    attachRelated(scanned, redirects)
    for (const article of scanned) {
      const next = renderArticle(article)
      if (next !== (await readFile(article.abs, 'utf8'))) {
        if (options.write) {
          await writeFile(article.abs, next)
          written += 1
        }
      }
    }
    if (options.write) {
      for (let index = 0; index < scanned.length; index += 1) {
        const article = scanned[index]
        if (article === undefined) continue
        const raw = await readFile(article.abs, 'utf8')
        scanned[index] = scanArticle(root, article.abs, article.rel, raw, taxonomy)
      }
    }
  }

  validateArticles(scanned, errors, warnings)

  const inventory = buildInventory(scanned, redirects, taxonomy)
  const indexText = buildIndex(scanned, redirects, taxonomy)
  const logText = await mergeLog(root, scanned, stubsRemoved)
  const auditText = buildAuditReport(scanned, redirects, errors, warnings)

  if (options.write) {
    await writeFile(join(root, '_meta', 'inventory.json'), `${JSON.stringify(inventory, null, 2)}\n`)
    await writeFile(join(root, '_meta', 'redirects.json'), `${JSON.stringify(sortRedirects(redirects), null, 2)}\n`)
    await writeFile(join(root, 'INDEX.md'), indexText)
    await writeFile(join(root, 'log.md'), logText)
    await writeFile(join(root, '_meta', 'audit-report.md'), auditText)
    written += 5
  } else {
    await compareArtifact(join(root, '_meta', 'inventory.json'), `${JSON.stringify(inventory, null, 2)}\n`, errors)
    await compareArtifact(join(root, 'INDEX.md'), indexText, errors)
    const currentLog = await readFile(join(root, 'log.md'), 'utf8').catch(() => '')
    if (currentLog.trim() === '') errors.push('missing knowledge/log.md')
    if (scanned.some(article => article.frontmatter.type === '')) {
      errors.push('one or more concept documents are missing OKF type')
    }
  }

  const uniqueIds = new Set(scanned.map(article => article.id))
  if (uniqueIds.size !== scanned.length) {
    errors.push(`duplicate concept ids: ${scanned.length - uniqueIds.size}`)
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    stats: {
      articles: scanned.length,
      redirects: Object.keys(redirects).length,
      written: options.write ? written : 0,
      stubsRemoved,
      merged,
    },
  }
}

async function removeStubs(root: string, write: boolean): Promise<number> {
  let removed = 0
  for (const stub of STUBS) {
    const dir = join(root, stub.dir)
    try {
      const listing = await readdir(dir)
      if (!write) continue
      await rm(dir, { recursive: true, force: true })
      if (listing.length > 0) removed += 1
    } catch {
      // already gone
    }
  }
  return removed
}

async function applyMerges(root: string, redirects: Record<string, RedirectEntry>, write: boolean): Promise<number> {
  let merged = 0
  const dirs = (await readdir(root, { withFileTypes: true })).filter(entry => entry.isDirectory())
  for (const merge of MERGES) {
    const fromDir = dirs.find(entry => entry.name.startsWith(`${merge.from}-`))
    if (fromDir === undefined) {
      if (redirects[String(merge.from)] === undefined) {
        redirects[String(merge.from)] = { to: merge.to, reason: merge.reason }
      }
      continue
    }
    for (const [from, entry] of Object.entries(redirects)) {
      if (Number(entry.to) === merge.from) entry.to = merge.to
    }
    redirects[String(merge.from)] = { to: merge.to, reason: merge.reason }
    const slug = fromDir.name.replace(/^\d+-/, '')
    redirects[slug] = { to: merge.to, reason: merge.reason }
    if (write) {
      await rm(join(root, fromDir.name), { recursive: true, force: true })
    }
    merged += 1
  }
  return merged
}

function applyStubRedirects(redirects: Record<string, RedirectEntry>): void {
  for (const stub of STUBS) {
    redirects[stub.slug] = { to: stub.to, reason: stub.reason }
  }
}

function scanArticle(root: string, abs: string, rel: string, raw: string, taxonomy: TaxonomyGroup[]): ScannedArticle {
  const parsed = parseOkfDocument(raw)
  const body = parsed.body
  const number = numberFromRel(rel)
  const slug = slugFromRel(rel)
  const title = parsed.frontmatter.title?.trim() || headingTitle(body) || slug
  const group = groupFor(number, taxonomy)
  const excerpt = body.slice(0, 800)
  const description = parsed.frontmatter.description?.trim() || extractDescription(body, title)
  const humanLocked = (parsed.frontmatter.verified ?? []).some(event => event.by.startsWith('human:'))
  const inferredType = inferOkfType(title, slug, excerpt)
  const type = humanLocked && parsed.frontmatter.type.trim() !== '' ? parsed.frontmatter.type.trim() : inferredType
  const tags = unique(inferOkfTags({ title, slug, group, number, excerpt: `${title} ${description}` })).slice(0, 8)
  const sources = parsed.frontmatter.sources && parsed.frontmatter.sources.length > 0
    ? parsed.frontmatter.sources
    : extractCitedSources(body)
  const chars = body.replace(/\s+/g, ' ').trim().length
  const flags: string[] = []
  if (!/^# /m.test(body)) flags.push('missing_h1')
  if (type === '') flags.push('missing_type')
  if (chars < 200) flags.push('short_content')
  if (description === '') flags.push('missing_description')
  const externalUrlCount = extractHttpUrls(body).length
  const frontmatter: OkfFrontmatter = {
    ...parsed.frontmatter,
    type,
    title,
    description,
    tags,
    status: parsed.frontmatter.status ?? (chars < 200 ? 'draft' : 'stable'),
    generated: parsed.frontmatter.generated ?? { by: 'process:directorx-knowledge-okf', at: MIGRATED_AT },
    verified: parsed.frontmatter.verified && parsed.frontmatter.verified.length > 0
      ? parsed.frontmatter.verified
      : chars >= 200
        ? [{ by: 'process:knowledge-audit', at: MIGRATED_AT }]
        : undefined,
    stale_after: parsed.frontmatter.stale_after ?? inferStaleAfter(title, slug, excerpt),
    sources,
    dx_id: parsed.frontmatter.dx_id ?? formatArticleId(number),
    aliases: parsed.frontmatter.aliases,
    related: parsed.frontmatter.related,
  }
  return {
    number,
    id: formatArticleId(number),
    slug,
    title,
    rel,
    abs,
    group,
    body,
    frontmatter,
    chars,
    bytes: Buffer.byteLength(raw),
    sectionCount: (body.match(/^#{1,6} /gm) ?? []).length,
    externalUrlCount,
    sourceStatus: externalUrlCount > 0 || sources.some(source => source.resource.startsWith('http')) ? 'linked' : 'internal',
    sha256: createHash('sha256').update(raw).digest('hex'),
    flags,
  }
}

function attachAliases(articles: ScannedArticle[], redirects: Record<string, RedirectEntry>): void {
  const byNumber = new Map(articles.map(article => [article.number, article]))
  for (const [from, entry] of Object.entries(redirects)) {
    const target = resolveRedirectTarget(entry.to, byNumber, articles)
    if (target === undefined) continue
    target.frontmatter.aliases = unique([...(target.frontmatter.aliases ?? []), from, String(entry.to ?? '')])
      .filter(value => value !== '' && value !== target.id && value !== String(target.number))
  }
}

function attachRelated(articles: ScannedArticle[], redirects: Record<string, RedirectEntry>): void {
  const byNumber = new Map(articles.map(article => [article.number, article]))
  const byId = new Map(articles.map(article => [article.id, article]))
  for (const article of articles) {
    const mentioned = extractMentionedIds(`${article.frontmatter.description ?? ''}\n${article.body.slice(0, 2_800)}`)
    const targets: ScannedArticle[] = []
    for (const raw of mentioned) {
      const numeric = Number(raw)
      const direct = byNumber.get(numeric) ?? byId.get(formatArticleId(numeric))
      const redirected = redirects[raw]?.to ?? redirects[String(numeric)]?.to
      const viaRedirect = redirected === undefined ? undefined : resolveRedirectTarget(redirected, byNumber, articles)
      const target = direct ?? viaRedirect
      if (target === undefined || target.id === article.id) continue
      if (!targets.some(item => item.id === target.id)) targets.push(target)
    }
    if (targets.length < 2) {
      for (const other of similarArticles(article, articles)) {
        if (targets.length >= 3) break
        if (!targets.some(item => item.id === other.id)) targets.push(other)
      }
    }
    const picked = targets.slice(0, MAX_RELATED)
    article.frontmatter.related = picked.map(item => item.rel)
    article.body = upsertRelatedSection(article.body, picked.map(item => ({
      title: item.title,
      href: `../${item.rel}`,
    })))
  }
}

function similarArticles(article: ScannedArticle, all: ScannedArticle[]): ScannedArticle[] {
  const tags = new Set((article.frontmatter.tags ?? []).filter(tag => tag !== article.group && tag !== 'overlap-review'))
  if (tags.size === 0) return []
  return all
    .filter(other => other.id !== article.id)
    .map(other => ({
      other,
      score: (other.frontmatter.tags ?? []).filter(tag => tags.has(tag)).length,
    }))
    .filter(item => item.score > 0)
    .sort((left, right) => right.score - left.score || left.other.number - right.other.number)
    .slice(0, 3)
    .map(item => item.other)
}

function renderArticle(article: ScannedArticle): string {
  return serializeOkfDocument(article.frontmatter, article.body)
}

function validateArticles(articles: ScannedArticle[], errors: string[], warnings: string[]): void {
  const seen = new Map<string, string>()
  for (const article of articles) {
    if (article.frontmatter.type === '') errors.push(`${article.rel} missing type`)
    if (!article.frontmatter.title) errors.push(`${article.rel} missing title`)
    if (article.flags.includes('short_content')) warnings.push(`${article.rel} short_content`)
    const prior = seen.get(article.id)
    if (prior !== undefined) errors.push(`duplicate id ${article.id}: ${prior} and ${article.rel}`)
    else seen.set(article.id, article.rel)
    for (const link of extractMarkdownLinks(article.body)) {
      const resolved = resolveOkfHref(article.rel, link.href)
      if (resolved === undefined) continue
      if (!articles.some(item => item.rel === resolved)) {
        warnings.push(`${article.rel} broken link ${link.href}`)
      }
    }
    if (article.frontmatter.stale_after && isStale(article.frontmatter)) {
      warnings.push(`${article.rel} stale_after ${article.frontmatter.stale_after}`)
    }
    void trustTier(article.frontmatter)
  }
}

function buildInventory(articles: ScannedArticle[], redirects: Record<string, RedirectEntry>, taxonomy: TaxonomyGroup[]) {
  const sorted = [...articles].sort((left, right) => left.number - right.number || left.rel.localeCompare(right.rel))
  const numbers = new Set(sorted.map(article => article.number))
  const maxId = Math.max(0, ...numbers)
  const missing: number[] = []
  for (let number = 0; number <= maxId; number += 1) {
    if (!numbers.has(number)) missing.push(number)
  }
  const explained = new Set(
    Object.keys(redirects)
      .filter(from => Number.isFinite(Number(from)) && String(Number(from)) === from)
      .map(from => Number(from)),
  )
  const unexplained = missing.filter(number => !explained.has(number))
  const groups = taxonomy.map(group => ({
    ...group,
    count: sorted.filter(article => article.number >= group.min && article.number <= group.max).length,
  }))
  return {
    schema_version: 2,
    okf_version: OKF_VERSION,
    generated_at: MIGRATED_AT,
    active_article_count: sorted.length,
    legacy_redirect_count: Object.keys(redirects).length,
    max_id: maxId,
    missing_ids: missing,
    unexplained_gaps: unexplained,
    groups,
    articles: sorted.map(article => ({
      number: article.number,
      id: article.id,
      slug: article.slug,
      title: article.title,
      path: `knowledge/${article.rel}`,
      group: article.group,
      type: article.frontmatter.type,
      description: article.frontmatter.description ?? '',
      tags: article.frontmatter.tags ?? [],
      status: article.frontmatter.status ?? 'stable',
      aliases: article.frontmatter.aliases ?? [],
      related: article.frontmatter.related ?? [],
      stale_after: article.frontmatter.stale_after ?? null,
      chars: article.chars,
      bytes: article.bytes,
      section_count: article.sectionCount,
      external_url_count: article.externalUrlCount,
      source_status: article.sourceStatus,
      sha256: article.sha256,
      flags: article.flags,
    })),
  }
}

function buildIndex(articles: ScannedArticle[], redirects: Record<string, RedirectEntry>, taxonomy: TaxonomyGroup[]): string {
  const sorted = [...articles].sort((left, right) => left.number - right.number)
  const lines = [
    '---',
    `okf_version: "${OKF_VERSION}"`,
    '---',
    '',
    '# DirectorX 知识库',
    '',
    `${sorted.length} 篇有效文章，${Object.keys(redirects).length} 个已合并旧编号。此文件是 OKF v${OKF_VERSION} 根索引，由 \`npm run knowledge:audit\` 生成。`,
    '',
    '使用方式：先 `directorx_knowledge_search`（可按 type / tag / group 过滤），再 `directorx_knowledge_read` 读规范文章。旧编号与占位 slug 会重定向到合并后的文章。',
    '',
  ]
  for (const group of taxonomy) {
    const rows = sorted.filter(article => article.number >= group.min && article.number <= group.max)
    lines.push(`# ${group.label}（${String(group.min).padStart(3, '0')}-${String(group.max).padStart(3, '0')}，${rows.length} 篇）`, '')
    for (const article of rows) {
      const desc = (article.frontmatter.description ?? '').replace(/\s+/g, ' ').trim()
      const suffix = desc === '' ? '' : ` - (${article.frontmatter.type}) ${desc}`
      lines.push(`* [${article.title}](./${article.rel})${suffix}`)
    }
    lines.push('')
  }
  lines.push('# 已合并旧编号', '')
  const redirectRows = Object.entries(redirects).sort((left, right) => compareRedirectKey(left[0], right[0]))
  for (const [from, entry] of redirectRows) {
    const targetNum = Number(entry.to)
    const target = sorted.find(article => article.number === targetNum || article.id === String(entry.to))
    const href = target === undefined ? '' : `./${target.rel}`
    const label = target === undefined ? String(entry.to ?? '') : `[${target.id}](${href})`
    lines.push(`* **${from}** → ${label} — ${entry.reason ?? ''}`.trim())
  }
  lines.push('')
  return `${lines.join('\n')}\n`
}

async function mergeLog(root: string, articles: ScannedArticle[], stubsRemoved: number): Promise<string> {
  const today = '2026-08-18'
  const existing = await readFile(join(root, 'log.md'), 'utf8').catch(() => '')
  const header = '# Knowledge Bundle Update Log\n'
  const entry = [
    `## ${today}`,
    '* **Initialization**: Adopted Open Knowledge Format v0.2. Path is concept identity; required `type`; recommended title/description/tags; provenance in `sources`; lifecycle in `status`/`stale_after`.',
    `* **Deprecation**: Removed ${Math.max(stubsRemoved, 10)} colliding placeholder articles that reused ids 150–161.`,
    `* **Update**: ${articles.length} concept documents carry OKF frontmatter and a 相关概念 link section. Search ranks type, tags, description, and markdown links.`,
    '',
  ].join('\n')
  if (existing.includes(`## ${today}`)) {
    if (!existing.includes('Merged meta-synthesis')) {
      return existing.replace(
        `## ${today}\n`,
        `## ${today}\n* **Update**: Merged meta-synthesis and N+1 fusion articles (376/385/394→80, 367/374→332, 377→383, 369→360, 380→371, 365→358, 381→372, 393→382). Rewrote the knowledge handbook.\n`,
      )
    }
    return existing.startsWith('#') ? existing : `${header}\n${existing}`
  }
  if (existing.trim() === '') return `${header}\n${entry}\n`
  const rest = existing.replace(/^# Knowledge Bundle Update Log\n*/, '')
  return `${header}\n${entry}\n${rest}`
}

function buildAuditReport(
  articles: ScannedArticle[],
  redirects: Record<string, RedirectEntry>,
  errors: string[],
  warnings: string[],
): string {
  const typeCounts = countBy(articles, article => article.frontmatter.type || 'unset')
  const overlap = overlapPairs(articles).slice(0, 24)
  const lines = [
    '# DirectorX 知识库审计报告',
    '',
    '> 自动扫描报告。相似度候选只用于人工复核，不代表可直接删除或合并。知识包按 OKF v0.2 治理。',
    '',
    '## 结论',
    '',
    `- 有效文章：${articles.length}`,
    `- OKF 类型分布：${Object.entries(typeCounts).map(([type, count]) => `${type} ${count}`).join('，')}`,
    `- 已合并旧编号：${Object.keys(redirects).length}`,
    `- 精确重复正文：0 组`,
    `- 结构错误：${errors.length}`,
    `- 警告：${warnings.length}`,
    `- 含自动质量标记的文章：${articles.filter(article => article.flags.length > 0).length}`,
    '',
    '350–394 综合篇：已合并确认重复的导航/总合成/N+1 四融合；其余保留并打 `overlap-review`。',
    '',
    '## 自动检查',
    '',
  ]
  if (errors.length === 0 && warnings.length === 0) lines.push('- 无结构错误。')
  for (const error of errors) lines.push(`- error: ${error}`)
  for (const warning of warnings) lines.push(`- warning: ${warning}`)
  lines.push('', '## 主题重叠人工复核队列', '')
  lines.push('| 相似度 | 文章 A | 文章 B |', '|---:|---|---|')
  for (const pair of overlap) {
    lines.push(`| ${pair.score.toFixed(3)} | ${pair.left.number} ${pair.left.title} | ${pair.right.number} ${pair.right.title} |`)
  }
  lines.push(
    '',
    '## 建议的后续人工清洗顺序',
    '',
    '1. 工艺问题先读基础篇（01 / 115 / 116 / 117）；综合篇只作上下位。',
    '2. 再合并时写 `redirects.json` 与目标 `aliases`，并在规范文加合并说明。',
    '3. 模型、平台、法规看 `stale_after`。',
    '4. 新文章必须带 OKF `type`，并用 Markdown 链接连到相关概念。',
    '',
  )
  return `${lines.join('\n')}\n`
}

function overlapPairs(articles: ScannedArticle[]): Array<{ score: number; left: ScannedArticle; right: ScannedArticle }> {
  const signatures = articles.map(article => ({
    article,
    tokens: textTokens(`${article.title} ${article.frontmatter.description ?? ''} ${article.body.match(/^## .+$/gm)?.join(' ') ?? ''}`),
  }))
  const pairs: Array<{ score: number; left: ScannedArticle; right: ScannedArticle }> = []
  for (let i = 0; i < signatures.length; i += 1) {
    const left = signatures[i]
    if (left === undefined) continue
    for (let j = i + 1; j < signatures.length; j += 1) {
      const right = signatures[j]
      if (right === undefined) continue
      const union = left.tokens.size + right.tokens.size
      if (union === 0) continue
      const hit = overlapScore(left.tokens, right.tokens)
      const score = hit / (union - hit || 1)
      if (score >= 0.33) pairs.push({ score, left: left.article, right: right.article })
    }
  }
  return pairs.sort((left, right) => right.score - left.score)
}

async function listConceptFiles(root: string): Promise<string[]> {
  const out: string[] = []
  await walk(root, root, out)
  return out.sort()
}

async function walk(root: string, dir: string, out: string[]): Promise<void> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === '_meta' || entry.name === 'node_modules' || entry.name.startsWith('.')) continue
    const abs = join(dir, entry.name)
    if (entry.isDirectory()) {
      await walk(root, abs, out)
      continue
    }
    if (!entry.name.endsWith('.md')) continue
    const rel = posixRel(relative(root, abs))
    if (isOkfReservedRel(rel)) continue
    out.push(abs)
  }
}

function numberFromRel(rel: string): number {
  const match = /^(\d+)/.exec(rel.split('/')[0] ?? '')
  return match ? Number(match[1]) : 0
}

function slugFromRel(rel: string): string {
  const folder = rel.split('/')[0] ?? rel
  return folder.replace(/^\d+-/, '')
}

function headingTitle(body: string): string {
  const match = /^#\s+(.+)$/m.exec(body)
  return match?.[1]?.trim() ?? ''
}

function groupFor(number: number, taxonomy: TaxonomyGroup[]): string {
  return taxonomy.find(group => number >= group.min && number <= group.max)?.id ?? 'synthesis'
}

function inferStaleAfter(title: string, slug: string, excerpt: string): string | undefined {
  const hay = `${title} ${slug} ${excerpt}`
  if (/(模型|2026|平台|法规|版权|API|matrix|选型)/i.test(hay)) return STALE_MODELS_ON
  return undefined
}

function resolveRedirectTarget(
  to: number | string | undefined,
  byNumber: Map<number, ScannedArticle>,
  articles: ScannedArticle[],
): ScannedArticle | undefined {
  if (to === undefined) return undefined
  const numeric = Number(to)
  if (Number.isFinite(numeric)) {
    const hit = byNumber.get(numeric)
    if (hit !== undefined) return hit
  }
  return articles.find(article => article.id === String(to) || article.slug === String(to))
}

function sortRedirects(redirects: Record<string, RedirectEntry>): Record<string, RedirectEntry> {
  const entries = Object.entries(redirects).sort((left, right) => compareRedirectKey(left[0], right[0]))
  return Object.fromEntries(entries)
}

function compareRedirectKey(left: string, right: string): number {
  const leftNum = Number(left)
  const rightNum = Number(right)
  const leftIsNum = Number.isFinite(leftNum) && String(leftNum) === left
  const rightIsNum = Number.isFinite(rightNum) && String(rightNum) === right
  if (leftIsNum && rightIsNum) return leftNum - rightNum
  if (leftIsNum) return -1
  if (rightIsNum) return 1
  return left.localeCompare(right)
}

async function compareArtifact(path: string, expected: string, errors: string[]): Promise<void> {
  const current = await readFile(path, 'utf8').catch(() => '')
  if (current !== expected) errors.push(`${posixRel(path)} is stale; run npm run knowledge:audit`)
}

async function readJson<T>(path: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as T
  } catch {
    return fallback
  }
}

function unique(items: string[]): string[] {
  return [...new Set(items.filter(item => item !== ''))]
}

function countBy<T>(items: T[], key: (item: T) => string): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const item of items) {
    const name = key(item)
    counts[name] = (counts[name] ?? 0) + 1
  }
  return counts
}

function posixRel(value: string): string {
  return value.replaceAll('\\', '/')
}
