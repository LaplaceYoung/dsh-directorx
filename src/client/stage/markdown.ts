/** Compact GFM-ish parse for the canvas session satellite. */

export type MdInline =
  | { type: 'text'; value: string }
  | { type: 'strong'; children: MdInline[] }
  | { type: 'em'; children: MdInline[] }
  | { type: 'del'; children: MdInline[] }
  | { type: 'code'; value: string }
  | { type: 'link'; href: string; children: MdInline[] }

export type MdBlock =
  | { type: 'heading'; level: 1 | 2 | 3; children: MdInline[] }
  | { type: 'paragraph'; children: MdInline[] }
  | { type: 'list'; ordered: boolean; items: MdInline[][] }
  | { type: 'code'; lang?: string; value: string }
  | { type: 'quote'; children: MdInline[] }
  | { type: 'hr' }
  | { type: 'table'; header: MdInline[][]; rows: MdInline[][][] }

export function safeHref(href: string): string | undefined {
  const value = href.trim()
  if (value === '') return undefined
  if (/^https?:\/\//i.test(value) || value.startsWith('mailto:')) return value
  if (value.startsWith('/') && !value.startsWith('//')) return value
  return undefined
}

function isFence(line: string): boolean {
  return line.trimStart().startsWith('```')
}

function isHr(line: string): boolean {
  return /^[-*_]{3,}\s*$/.test(line.trim())
}

function isTableRow(line: string): boolean {
  const trimmed = line.trim()
  return trimmed.startsWith('|') && trimmed.includes('|', 1)
}

function isTableSep(line: string): boolean {
  return /^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?\s*$/.test(line)
}

function tableCells(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '')
  return trimmed.split('|').map(cell => cell.trim())
}

function isHeading(line: string): RegExpExecArray | null {
  return /^(#{1,3})\s+(.+)$/.exec(line)
}

function isQuote(line: string): boolean {
  return line.startsWith('>')
}

function isUl(line: string): boolean {
  return /^\s*[-*+]\s+/.test(line)
}

function isOl(line: string): boolean {
  return /^\s*\d+\.\s+/.test(line)
}

function isBlockStart(line: string): boolean {
  return isFence(line) || isHr(line) || isHeading(line) !== null || isQuote(line) || isUl(line) || isOl(line) || isTableRow(line)
}

export function parseInline(src: string): MdInline[] {
  const out: MdInline[] = []
  let buf = ''
  const flush = (): void => {
    if (buf !== '') {
      out.push({ type: 'text', value: buf })
      buf = ''
    }
  }
  let index = 0
  while (index < src.length) {
    if (src[index] === '`') {
      const end = src.indexOf('`', index + 1)
      if (end > index) {
        flush()
        out.push({ type: 'code', value: src.slice(index + 1, end) })
        index = end + 1
        continue
      }
    }
    if (src.startsWith('**', index)) {
      const end = src.indexOf('**', index + 2)
      if (end > index) {
        flush()
        out.push({ type: 'strong', children: parseInline(src.slice(index + 2, end)) })
        index = end + 2
        continue
      }
    }
    if (src.startsWith('~~', index)) {
      const end = src.indexOf('~~', index + 2)
      if (end > index) {
        flush()
        out.push({ type: 'del', children: parseInline(src.slice(index + 2, end)) })
        index = end + 2
        continue
      }
    }
    const mark = src[index]
    if ((mark === '*' || mark === '_') && src[index + 1] !== mark) {
      const end = src.indexOf(mark, index + 1)
      if (end > index) {
        flush()
        out.push({ type: 'em', children: parseInline(src.slice(index + 1, end)) })
        index = end + 1
        continue
      }
    }
    if (src[index] === '[') {
      const close = src.indexOf('](', index)
      const end = close === -1 ? -1 : src.indexOf(')', close + 2)
      if (close > index && end > close) {
        const href = safeHref(src.slice(close + 2, end))
        if (href !== undefined) {
          flush()
          out.push({ type: 'link', href, children: parseInline(src.slice(index + 1, close)) })
          index = end + 1
          continue
        }
      }
    }
    buf += src[index]
    index += 1
  }
  flush()
  return out
}

export function parseMarkdown(text: string): MdBlock[] {
  const lines = text.replaceAll('\r\n', '\n').split('\n')
  const blocks: MdBlock[] = []
  let index = 0
  while (index < lines.length) {
    const line = lines[index] ?? ''
    if (line.trim() === '') {
      index += 1
      continue
    }
    if (isFence(line)) {
      const langRaw = line.trimStart().slice(3).trim()
      const lang = langRaw === '' ? undefined : langRaw
      index += 1
      const body: string[] = []
      while (index < lines.length && !isFence(lines[index] ?? '')) {
        body.push(lines[index] ?? '')
        index += 1
      }
      if (index < lines.length) index += 1
      blocks.push({ type: 'code', ...(lang === undefined ? {} : { lang }), value: body.join('\n') })
      continue
    }
    if (isTableRow(line) && isTableSep(lines[index + 1] ?? '')) {
      const header = tableCells(line).map(cell => parseInline(cell))
      index += 2
      const rows: MdInline[][][] = []
      while (index < lines.length && isTableRow(lines[index] ?? '') && !isTableSep(lines[index] ?? '')) {
        rows.push(tableCells(lines[index] ?? '').map(cell => parseInline(cell)))
        index += 1
      }
      blocks.push({ type: 'table', header, rows })
      continue
    }
    if (isHr(line)) {
      blocks.push({ type: 'hr' })
      index += 1
      continue
    }
    const heading = isHeading(line)
    if (heading !== null) {
      const level = heading[1].length as 1 | 2 | 3
      blocks.push({ type: 'heading', level, children: parseInline(heading[2] ?? '') })
      index += 1
      continue
    }
    if (isQuote(line)) {
      const quoted: string[] = []
      while (index < lines.length && isQuote(lines[index] ?? '')) {
        quoted.push((lines[index] ?? '').replace(/^>\s?/, ''))
        index += 1
      }
      blocks.push({ type: 'quote', children: parseInline(quoted.join(' ')) })
      continue
    }
    if (isUl(line) || isOl(line)) {
      const ordered = isOl(line)
      const items: MdInline[][] = []
      while (index < lines.length && (ordered ? isOl(lines[index] ?? '') : isUl(lines[index] ?? ''))) {
        items.push(parseInline((lines[index] ?? '').replace(/^\s*(?:[-*+]|\d+\.)\s+/, '')))
        index += 1
      }
      blocks.push({ type: 'list', ordered, items })
      continue
    }
    const para: string[] = []
    while (index < lines.length) {
      const next = lines[index] ?? ''
      if (next.trim() === '' || isBlockStart(next)) break
      para.push(next)
      index += 1
    }
    if (para.length > 0) blocks.push({ type: 'paragraph', children: parseInline(para.join(' ')) })
  }
  return blocks
}
