/** Open Knowledge Format v0.2 — parse, write, and classify DirectorX concepts. */

export const OKF_VERSION = '0.2'
export const OKF_TYPES = ['Reference', 'Method', 'Playbook', 'Spec', 'Case'] as const
export type OkfType = (typeof OKF_TYPES)[number]

export interface OkfSource {
  id?: string
  resource: string
  title?: string
  author?: string
  last_modified?: string
}

export interface OkfActorEvent {
  by: string
  at?: string
}

export interface OkfFrontmatter {
  type: string
  title?: string
  description?: string
  resource?: string
  tags?: string[]
  generated?: OkfActorEvent
  verified?: OkfActorEvent[]
  status?: 'draft' | 'stable' | 'deprecated'
  stale_after?: string
  sources?: OkfSource[]
  dx_id?: string
  aliases?: string[]
  related?: string[]
  extras?: Record<string, unknown>
}

export interface OkfDocument {
  frontmatter: OkfFrontmatter
  body: string
}

export interface OkfLink {
  title: string
  href: string
}

const RESERVED_NAMES = new Set(['index.md', 'log.md'])

const TYPE_FILTER_ALIASES: Record<string, string> = {
  reference: 'Reference',
  参考: 'Reference',
  method: 'Method',
  方法: 'Method',
  playbook: 'Playbook',
  手册: 'Playbook',
  工作流: 'Playbook',
  spec: 'Spec',
  规格: 'Spec',
  矩阵: 'Spec',
  case: 'Case',
  案例: 'Case',
}

const TAG_RULES: Array<[RegExp, string]> = [
  [/镜头|运镜|景别|camera|shot size|shot-type/i, 'camera'],
  [/剪辑|转场|edit(?:ing)?|cutaway/i, 'editing'],
  [/灯光|光效|布光|lighting|motivated light/i, 'lighting'],
  [/色彩|调色|色板|lut|color/i, 'color'],
  [/声音|音频|配乐|口播|foley|sound|audio|配音/i, 'sound'],
  [/提示词|prompt/i, 'prompt'],
  [/模型|model matrix|选型|kling|seedance|minimax|veo|runway/i, 'model'],
  [/分镜|storyboard|animatic|镜号/i, 'storyboard'],
  [/角色|人设|character|表演|acting/i, 'character'],
  [/风格|美术|style|art direction/i, 'style'],
  [/版权|copyright|商标|肖像/i, 'copyright'],
  [/工作流|管线|流程|pipeline|workflow/i, 'workflow'],
  [/一致|连续|continuity|锚点/i, 'continuity'],
  [/预告|片花|trailer|cutscene/i, 'trailer'],
  [/质检|qa|缺陷|artifact/i, 'qa'],
  [/平台|投放|seo|分发|distribution/i, 'platform'],
  [/剧本|叙事|screenplay|narrative|节拍/i, 'narrative'],
  [/图生|i2v|首尾帧|image-to-video|first.?frame|last.?frame/i, 'i2v'],
  [/图片|image prompt|product photo/i, 'image'],
  [/特效|合成|vfx|composit/i, 'vfx'],
  [/规格|矩阵|总表|spec/i, 'spec'],
]

const KNOWN_FRONTMATTER = new Set([
  'type', 'title', 'description', 'resource', 'tags', 'generated', 'verified',
  'status', 'stale_after', 'sources', 'dx_id', 'aliases', 'related',
])

export function isOkfReservedRel(rel: string): boolean {
  const base = rel.split('/').pop()?.toLowerCase() ?? ''
  return RESERVED_NAMES.has(base)
}

export function okfConceptId(rel: string): string {
  return rel.replace(/\.md$/i, '')
}

export function formatArticleId(number: number): string {
  return number < 100 ? String(number).padStart(2, '0') : String(number)
}

export function normalizeOkfType(value: string | undefined): string | undefined {
  if (value === undefined) return undefined
  const trimmed = value.trim()
  if (trimmed === '') return undefined
  const mapped = TYPE_FILTER_ALIASES[trimmed.toLowerCase()]
  if (mapped !== undefined) return mapped
  const exact = OKF_TYPES.find(type => type.toLowerCase() === trimmed.toLowerCase())
  return exact ?? trimmed
}

export function trustTier(frontmatter: OkfFrontmatter): 'unverified' | 'machine-confirmed' | 'human-reviewed' {
  const events = frontmatter.verified ?? []
  if (events.length === 0) return 'unverified'
  if (events.some(event => event.by.startsWith('human:'))) return 'human-reviewed'
  return 'machine-confirmed'
}

export function isStale(frontmatter: OkfFrontmatter, today = new Date()): boolean {
  const stamp = frontmatter.stale_after?.trim()
  if (stamp === undefined || stamp === '') return false
  const iso = today.toISOString().slice(0, 10)
  return iso >= stamp
}

export function parseOkfDocument(source: string): OkfDocument {
  if (!source.startsWith('---')) {
    return { frontmatter: { type: '' }, body: source }
  }
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source)
  if (match === null) return { frontmatter: { type: '' }, body: source }
  const data = parseYamlMap(match[1] ?? '')
  return {
    frontmatter: normalizeFrontmatter(data),
    body: source.slice(match[0].length),
  }
}

export function serializeOkfDocument(frontmatter: OkfFrontmatter, body: string): string {
  const yaml = serializeFrontmatter(frontmatter).trimEnd()
  const nextBody = body.replace(/^\uFEFF?/, '').replace(/^\r?\n/, '')
  return `---\n${yaml}\n---\n\n${nextBody.replace(/\s+$/, '')}\n`
}

export function serializeFrontmatter(frontmatter: OkfFrontmatter): string {
  const lines: string[] = []
  writeScalar(lines, 'type', frontmatter.type)
  writeQuoted(lines, 'title', frontmatter.title)
  writeQuoted(lines, 'description', frontmatter.description)
  writeScalar(lines, 'resource', frontmatter.resource)
  writeStringList(lines, 'tags', frontmatter.tags)
  writeScalar(lines, 'status', frontmatter.status)
  writeScalar(lines, 'stale_after', frontmatter.stale_after)
  if (frontmatter.generated?.by) {
    lines.push('generated:')
    writeScalar(lines, 'by', frontmatter.generated.by, 2)
    writeScalar(lines, 'at', frontmatter.generated.at, 2)
  }
  if (frontmatter.verified && frontmatter.verified.length > 0) {
    lines.push('verified:')
    for (const event of frontmatter.verified) {
      lines.push(`  - by: ${formatYamlScalar(event.by)}`)
      if (event.at) lines.push(`    at: ${formatYamlScalar(event.at)}`)
    }
  }
  if (frontmatter.sources && frontmatter.sources.length > 0) {
    lines.push('sources:')
    for (const source of frontmatter.sources) {
      lines.push(`  - resource: ${formatYamlScalar(source.resource)}`)
      if (source.id) lines.push(`    id: ${formatYamlScalar(source.id)}`)
      if (source.title) lines.push(`    title: ${formatYamlScalar(source.title, true)}`)
      if (source.author) lines.push(`    author: ${formatYamlScalar(source.author)}`)
      if (source.last_modified) lines.push(`    last_modified: ${formatYamlScalar(source.last_modified)}`)
    }
  }
  writeQuoted(lines, 'dx_id', frontmatter.dx_id)
  writeStringList(lines, 'aliases', frontmatter.aliases)
  writeStringList(lines, 'related', frontmatter.related)
  if (frontmatter.extras) {
    for (const [key, value] of Object.entries(frontmatter.extras)) {
      if (KNOWN_FRONTMATTER.has(key)) continue
      writeUnknown(lines, key, value, 0)
    }
  }
  return `${lines.join('\n')}\n`
}

export function inferOkfType(title: string, slug = '', excerpt = ''): OkfType {
  const head = `${title} ${slug}`
  void excerpt
  if (/(案例手册|逐镜头|field test|benchmark|case studies|拉片|名场面|拆解|案例)/i.test(head) || /案例/.test(title)) {
    return 'Case'
  }
  if (/(能力矩阵|规格总表|spec matrix|能力边界|交付规格)/i.test(head) || /(矩阵|总表)/.test(title)) {
    return 'Spec'
  }
  if (/(工作流|管线|工厂|playbook|pipeline|全流程|工业化|\bSOP\b|清单|使用手册|调用手册)/i.test(head) && !/提示词手册/.test(head)) {
    return 'Playbook'
  }
  if (/(提示词|方法论|控制|工程|生成公式|框架|方法学|prompt)/i.test(head)) {
    return 'Method'
  }
  if (/(术语|图解|glossary|理论|psychology)/i.test(head)) {
    return 'Reference'
  }
  return 'Reference'
}

export function inferOkfTags(input: {
  title: string
  slug?: string
  group?: string
  number?: number
  excerpt?: string
}): string[] {
  const hay = `${input.title} ${input.slug ?? ''} ${input.excerpt ?? ''}`
  const tags = new Set<string>()
  if (input.group) tags.add(input.group)
  for (const [pattern, tag] of TAG_RULES) {
    if (pattern.test(hay)) tags.add(tag)
  }
  if ((input.number ?? 0) >= 350 && /融合|整合|系统|总(?:设计|应用|合)|综合|系列|框架/.test(hay)) tags.add('overlap-review')
  return [...tags].slice(0, 8)
}

export function extractDescription(body: string, title = ''): string {
  const lines = body.replace(/\r\n/g, '\n').split('\n')
  const quotes: string[] = []
  let started = false
  for (const line of lines) {
    if (line.startsWith('#')) continue
    if (line.startsWith('>')) {
      started = true
      const text = line.replace(/^>\s?/, '').trim()
      if (text.startsWith('来源') || text.startsWith('Source')) continue
      if (text !== '') quotes.push(text)
      continue
    }
    if (started) break
    if (line.trim() === '') continue
    break
  }
  let text = quotes.join(' ').replace(/\s+/g, ' ').trim()
  text = text.replace(/^本页(?:是|为)\s*/, '').replace(/^DirectorX\s*/, '')
  const cut = text.split(/[。！？]/)[0]?.trim() ?? text
  const picked = (cut.length >= 24 ? cut : text).slice(0, 180).trim()
  if (picked !== '') return picked.replace(/[，,；;]+$/, '')
  return title.replace(/（[^）]*）/g, '').trim()
}

export function extractHttpUrls(text: string): string[] {
  const found = text.match(/https?:\/\/[^\s)\]>`"']+/g) ?? []
  return [...new Set(found.map(url => url.replace(/[.,;:]+$/, '')))]
}

export function extractCitedSources(body: string): OkfSource[] {
  const sources: OkfSource[] = []
  const seen = new Set<string>()
  const head = body.slice(0, 2_400)
  const citeLine = head.split('\n').find(line => /来源[:：]/.test(line))
  if (citeLine !== undefined) {
    const payload = citeLine.replace(/^[^来]*来源[:：]\s*/, '')
    const chunks = payload.split(/[、；;]|(?<=》|」)\s*(?=[A-Za-z\u4e00-\u9fff])/).map(part => part.trim()).filter(Boolean)
    for (const [index, chunk] of chunks.entries()) {
      const named = /([^「」《》]+)?[「《]([^」》]+)[」》]/.exec(chunk)
      const title = (named?.[2] ?? chunk).replace(/^来源[:：]\s*/, '').trim()
      if (title.length < 3) continue
      const author = named?.[1]?.trim()
      const key = title.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      sources.push({
        id: `cite-${index + 1}`,
        resource: `cited:${(author ? `${author} ` : '')}${title}`.slice(0, 180),
        title: title.slice(0, 160),
        ...(author ? { author: `org:${author.replace(/[:\s]+/g, '-').slice(0, 40)}` } : {}),
      })
    }
  }
  for (const [index, url] of extractHttpUrls(body).slice(0, 8).entries()) {
    if (seen.has(url)) continue
    seen.add(url)
    sources.push({ id: `url-${index + 1}`, resource: url, title: hostTitle(url) })
  }
  return sources.slice(0, 10)
}

export function extractMarkdownLinks(body: string): OkfLink[] {
  const links: OkfLink[] = []
  const pattern = /\[([^\]]+)\]\(([^)]+)\)/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(body)) !== null) {
    const href = (match[2] ?? '').trim()
    const title = (match[1] ?? '').trim()
    if (href === '' || href.startsWith('#')) continue
    links.push({ title, href })
  }
  return links
}

export function resolveOkfHref(fromRel: string, href: string): string | undefined {
  const clean = href.split('#')[0]?.trim() ?? ''
  if (clean === '' || /^https?:\/\//i.test(clean) || clean.startsWith('mailto:')) return undefined
  if (clean.startsWith('/')) return clean.slice(1)
  const fromDir = fromRel.split('/').slice(0, -1).join('/')
  const joined = `${fromDir}/${clean}`.split('/')
  const stack: string[] = []
  for (const part of joined) {
    if (part === '' || part === '.') continue
    if (part === '..') stack.pop()
    else stack.push(part)
  }
  return stack.join('/')
}

export function extractMentionedIds(text: string): string[] {
  const ids = new Set<string>()
  for (const match of text.matchAll(/(?:衔接|参见)([^。.\n]{0,120})/g)) {
    for (const raw of (match[1] ?? '').match(/\d{1,3}/g) ?? []) ids.add(raw)
  }
  for (const match of text.matchAll(/与\s*(\d{1,3})\s*分工/g)) {
    if (match[1]) ids.add(match[1])
  }
  return [...ids]
}

export function upsertRelatedSection(body: string, links: OkfLink[]): string {
  const stripped = body.replace(/\n+## 相关概念\n[\s\S]*$/, '').trimEnd()
  if (links.length === 0) return `${stripped}\n`
  const items = links.map(link => `- [${link.title}](${link.href})`).join('\n')
  return `${stripped}\n\n## 相关概念\n\n${items}\n`
}

function hostTitle(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url.slice(0, 80)
  }
}

function normalizeFrontmatter(data: Record<string, unknown>): OkfFrontmatter {
  const extras: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (!KNOWN_FRONTMATTER.has(key)) extras[key] = value
  }
  const generatedRaw = asRecord(data.generated)
  const verifiedRaw = data.verified
  const verifiedList = Array.isArray(verifiedRaw)
    ? verifiedRaw.map(item => asActor(item)).filter((item): item is OkfActorEvent => item !== undefined)
    : asActor(verifiedRaw) ? [asActor(verifiedRaw)!] : []
  const sources = Array.isArray(data.sources)
    ? data.sources.map(asSource).filter((item): item is OkfSource => item !== undefined)
    : []
  return {
    type: String(data.type ?? '').trim(),
    title: asOptionalString(data.title),
    description: asOptionalString(data.description),
    resource: asOptionalString(data.resource),
    tags: asStringList(data.tags),
    generated: generatedRaw?.by ? { by: String(generatedRaw.by), at: asOptionalString(generatedRaw.at) } : undefined,
    verified: verifiedList,
    status: asStatus(data.status),
    stale_after: asOptionalString(data.stale_after),
    sources,
    dx_id: asOptionalString(data.dx_id),
    aliases: asStringList(data.aliases),
    related: asStringList(data.related),
    extras: Object.keys(extras).length > 0 ? extras : undefined,
  }
}

function asStatus(value: unknown): OkfFrontmatter['status'] | undefined {
  const text = asOptionalString(value)
  if (text === 'draft' || text === 'stable' || text === 'deprecated') return text
  return undefined
}

function asActor(value: unknown): OkfActorEvent | undefined {
  const record = asRecord(value)
  if (record?.by === undefined) return undefined
  return { by: String(record.by), at: asOptionalString(record.at) }
}

function asSource(value: unknown): OkfSource | undefined {
  const record = asRecord(value)
  if (record?.resource === undefined) return undefined
  return {
    resource: String(record.resource),
    id: asOptionalString(record.id),
    title: asOptionalString(record.title),
    author: asOptionalString(record.author),
    last_modified: asOptionalString(record.last_modified),
  }
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return undefined
}

function asOptionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined
  const text = String(value).trim()
  return text === '' ? undefined : text
}

function asStringList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const items = value.map(item => String(item).trim()).filter(item => item !== '')
  return items.length > 0 ? [...new Set(items)] : undefined
}

function writeScalar(lines: string[], key: string, value: string | undefined, indent = 0): void {
  if (value === undefined || value === '') return
  lines.push(`${' '.repeat(indent)}${key}: ${formatYamlScalar(value)}`)
}

function writeQuoted(lines: string[], key: string, value: string | undefined): void {
  if (value === undefined || value === '') return
  lines.push(`${key}: ${formatYamlScalar(value, true)}`)
}

function writeStringList(lines: string[], key: string, values: string[] | undefined): void {
  if (!values || values.length === 0) return
  lines.push(`${key}:`)
  for (const value of values) lines.push(`  - ${formatYamlScalar(value, true)}`)
}

function writeUnknown(lines: string[], key: string, value: unknown, indent: number): void {
  const pad = ' '.repeat(indent)
  if (value === undefined || value === null) return
  if (Array.isArray(value)) {
    lines.push(`${pad}${key}:`)
    for (const item of value) {
      if (item !== null && typeof item === 'object') {
        const record = item as Record<string, unknown>
        const keys = Object.keys(record)
        if (keys.length === 0) continue
        const first = keys[0] as string
        lines.push(`${pad}  - ${first}: ${formatYamlScalar(String(record[first]), true)}`)
        for (const next of keys.slice(1)) {
          lines.push(`${pad}    ${next}: ${formatYamlScalar(String(record[next]), true)}`)
        }
      } else {
        lines.push(`${pad}  - ${formatYamlScalar(String(item), true)}`)
      }
    }
    return
  }
  if (typeof value === 'object') {
    lines.push(`${pad}${key}:`)
    for (const [child, childValue] of Object.entries(value as Record<string, unknown>)) {
      writeUnknown(lines, child, childValue, indent + 2)
    }
    return
  }
  lines.push(`${pad}${key}: ${formatYamlScalar(String(value), true)}`)
}

export function formatYamlScalar(value: string, forceQuote = false): string {
  const needsQuote = forceQuote
    || value === ''
    || /[:#{}[\],&*?|!%@`>'"]/.test(value)
    || /^[-?]/.test(value)
    || /^(?:true|false|null|yes|no|on|off)$/i.test(value)
    || /^[-+]?\d/.test(value)
    || value !== value.trim()
  if (!needsQuote) return value
  return `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`
}

function parseYamlMap(text: string): Record<string, unknown> {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const [value] = parseBlock(lines, 0, 0)
  return asRecord(value) ?? {}
}

function parseBlock(lines: string[], start: number, indent: number): [unknown, number] {
  let index = start
  while (index < lines.length && blankOrComment(lines[index] ?? '')) index += 1
  const first = lines[index] ?? ''
  if (leadingSpaces(first) === indent && first.trim().startsWith('- ')) {
    return parseList(lines, index, indent)
  }
  const map: Record<string, unknown> = {}
  while (index < lines.length) {
    const line = lines[index] ?? ''
    if (blankOrComment(line)) {
      index += 1
      continue
    }
    const spaces = leadingSpaces(line)
    if (spaces < indent) break
    if (spaces > indent) break
    const trimmed = line.trim()
    if (trimmed.startsWith('- ')) break
    const match = /^([^:#\n]+):\s*(.*)$/.exec(trimmed)
    if (match === null) {
      index += 1
      continue
    }
    const key = match[1].trim()
    const raw = match[2] ?? ''
    if (raw === '' || raw.startsWith('#')) {
      const next = nextContent(lines, index + 1)
      if (next !== undefined && leadingSpaces(lines[next] ?? '') > indent) {
        const [child, end] = parseBlock(lines, next, leadingSpaces(lines[next] ?? ''))
        map[key] = child
        index = end
        continue
      }
      map[key] = ''
      index += 1
      continue
    }
    map[key] = parseInline(raw.replace(/\s+#.*$/, '').trim())
    index += 1
  }
  return [map, index]
}

function parseList(lines: string[], start: number, indent: number): [unknown[], number] {
  const items: unknown[] = []
  let index = start
  while (index < lines.length) {
    const line = lines[index] ?? ''
    if (blankOrComment(line)) {
      index += 1
      continue
    }
    const spaces = leadingSpaces(line)
    if (spaces < indent) break
    const trimmed = line.trim()
    if (!trimmed.startsWith('- ')) break
    const rest = trimmed.slice(2)
    const keyMatch = /^([^:#\n]+):\s*(.*)$/.exec(rest)
    if (keyMatch !== null) {
      const record: Record<string, unknown> = {}
      const firstKey = keyMatch[1].trim()
      const firstRaw = (keyMatch[2] ?? '').replace(/\s+#.*$/, '').trim()
      record[firstKey] = firstRaw === '' ? '' : parseInline(firstRaw)
      index += 1
      while (index < lines.length) {
        const child = lines[index] ?? ''
        if (blankOrComment(child)) {
          index += 1
          continue
        }
        const childSpaces = leadingSpaces(child)
        if (childSpaces <= indent) break
        const childTrim = child.trim()
        if (childTrim.startsWith('- ')) break
        const childMatch = /^([^:#\n]+):\s*(.*)$/.exec(childTrim)
        if (childMatch === null) {
          index += 1
          continue
        }
        const childKey = childMatch[1].trim()
        const childRaw = (childMatch[2] ?? '').replace(/\s+#.*$/, '').trim()
        if (childRaw === '') {
          const next = nextContent(lines, index + 1)
          if (next !== undefined && leadingSpaces(lines[next] ?? '') > childSpaces) {
            const [nested, end] = parseBlock(lines, next, leadingSpaces(lines[next] ?? ''))
            record[childKey] = nested
            index = end
            continue
          }
          record[childKey] = ''
        } else {
          record[childKey] = parseInline(childRaw)
        }
        index += 1
      }
      items.push(record)
      continue
    }
    items.push(parseInline(rest.replace(/\s+#.*$/, '').trim()))
    index += 1
  }
  return [items, index]
}

function parseInline(raw: string): unknown {
  if (raw === '' || raw === '~' || raw === 'null') return null
  if (raw === 'true') return true
  if (raw === 'false') return false
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    return unquote(raw)
  }
  if (raw.startsWith('{') && raw.endsWith('}')) return parseInlineMap(raw.slice(1, -1))
  if (raw.startsWith('[') && raw.endsWith(']')) {
    return splitInline(raw.slice(1, -1)).map(part => parseInline(part))
  }
  if (/^[-+]?\d+$/.test(raw) && !raw.startsWith('0')) return Number(raw)
  return raw
}

function parseInlineMap(raw: string): Record<string, unknown> {
  const record: Record<string, unknown> = {}
  for (const part of splitInline(raw)) {
    const offset = part.indexOf(':')
    if (offset < 0) continue
    record[part.slice(0, offset).trim()] = parseInline(part.slice(offset + 1).trim())
  }
  return record
}

function splitInline(raw: string): string[] {
  const parts: string[] = []
  let current = ''
  let quote: '"' | "'" | undefined
  let depth = 0
  for (const char of raw) {
    if (quote) {
      current += char
      if (char === quote) quote = undefined
      continue
    }
    if (char === '"' || char === "'") {
      quote = char
      current += char
      continue
    }
    if (char === '{' || char === '[') depth += 1
    if (char === '}' || char === ']') depth -= 1
    if (char === ',' && depth === 0) {
      if (current.trim() !== '') parts.push(current.trim())
      current = ''
      continue
    }
    current += char
  }
  if (current.trim() !== '') parts.push(current.trim())
  return parts
}

function unquote(raw: string): string {
  const quote = raw[0]
  const inner = raw.slice(1, -1)
  if (quote === "'") return inner.replaceAll("''", "'")
  return inner.replaceAll('\\"', '"').replaceAll('\\\\', '\\')
}

function leadingSpaces(line: string): number {
  const match = /^( *)/.exec(line)
  return match?.[1]?.length ?? 0
}

function blankOrComment(line: string): boolean {
  const trimmed = line.trim()
  return trimmed === '' || trimmed.startsWith('#')
}

function nextContent(lines: string[], start: number): number | undefined {
  for (let index = start; index < lines.length; index += 1) {
    if (!blankOrComment(lines[index] ?? '')) return index
  }
  return undefined
}
