import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DirectorxCanvasStore } from './canvas.ts'
import { resolveOutputDir } from './support.ts'

export type BibleKind = 'outline' | 'characters' | 'art' | 'script' | 'storyboard'

export interface BibleGate {
  id: string
  label: string
  ok: boolean
  detail?: string
}

export interface BibleArtifact {
  kind: BibleKind
  path: string
  title: string
}

export interface BibleReview {
  kind: BibleKind
  path: string
  title: string
  gates: BibleGate[]
  passed: number
  total: number
  markdown: string
  next: string[]
}

const KIND_FILE: Record<BibleKind, RegExp> = {
  outline: /-outline\.json$/i,
  characters: /-cast\.json$/i,
  art: /-art\.json$/i,
  script: /-script\.json$/i,
  storyboard: /-storyboard\.json$/i,
}

const KIND_LABEL: Record<BibleKind, string> = {
  outline: '大纲',
  characters: '角色',
  art: '美术',
  script: '剧本',
  storyboard: '分镜',
}

const SCRIPT: Record<Exclude<BibleKind, 'characters'>, string> = {
  outline: 'novel-outline/scripts/novel-outline.mjs',
  art: 'novel-art/scripts/novel-art.mjs',
  script: 'novel-script/scripts/novel-script.mjs',
  storyboard: 'novel-storyboard/scripts/novel-storyboard.mjs',
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function asGates(raw: unknown): BibleGate[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap(item => {
    if (item === null || typeof item !== 'object') return []
    const rec = item as Record<string, unknown>
    const id = typeof rec.id === 'string' ? rec.id : ''
    const label = typeof rec.label === 'string' ? rec.label : id
    if (label === '') return []
    return [{
      id: id || label,
      label,
      ok: rec.ok === true,
      ...(typeof rec.detail === 'string' && rec.detail !== '' ? { detail: rec.detail } : {}),
    }]
  })
}

async function walkJson(dir: string, depth = 0): Promise<string[]> {
  if (depth > 3) return []
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return []
  }
  const out: string[] = []
  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
      out.push(...await walkJson(path, depth + 1))
      continue
    }
    if (entry.name.endsWith('.json')) out.push(path)
  }
  return out
}

export function inferBibleKind(path: string): BibleKind | undefined {
  const name = basename(path)
  for (const kind of Object.keys(KIND_FILE) as BibleKind[]) {
    if (KIND_FILE[kind].test(name)) return kind
  }
  return undefined
}

export async function detectBibles(outputDir: string): Promise<BibleArtifact[]> {
  const root = resolveOutputDir(outputDir)
  const files = await walkJson(root)
  const found: BibleArtifact[] = []
  for (const path of files) {
    const kind = inferBibleKind(path)
    if (kind === undefined) continue
    let title = basename(path).replace(KIND_FILE[kind], '')
    try {
      const parsed = asRecord(JSON.parse(await readFile(path, 'utf8')))
      if (typeof parsed.source === 'string' && parsed.source.trim() !== '') title = parsed.source.trim()
    } catch {
      // filename is enough
    }
    found.push({ kind, path, title: title || KIND_LABEL[kind] })
  }
  return found
}

function characterReview(doc: Record<string, unknown>, path: string): BibleReview {
  const characters = Array.isArray(doc.characters) ? doc.characters : []
  const names = characters.map(item => {
    const rec = asRecord(item)
    return typeof rec.name === 'string' ? rec.name : ''
  }).filter(Boolean)
  const missingName = characters.length === 0 || names.length !== characters.length
  const promptBlob = JSON.stringify(characters.map(item => {
    const rec = asRecord(item)
    return [rec.image, rec.appearancePrompt, rec.sheet, rec.visual].filter(Boolean)
  })).toLowerCase()
  const namedInPrompt = names.filter(name => name.length >= 2 && promptBlob.includes(name.toLowerCase()))
  const gates: BibleGate[] = [
    { id: 'has-cast', label: '至少有一名角色', ok: characters.length > 0, detail: `${characters.length} 人` },
    { id: 'named', label: '每人有名字', ok: !missingName },
    { id: 'no-name-in-prompt', label: '出图提示词不直接写人名', ok: namedInPrompt.length === 0, detail: namedInPrompt.join('、') },
  ]
  const source = typeof doc.source === 'string' ? doc.source : basename(path)
  const lines = [
    `# 评审｜角色 · ${source}`,
    '',
    `门 ${gates.filter(item => item.ok).length}/${gates.length} 过。JSON 是事实源，这份是给人看的评审，不要另出 HTML。`,
    '',
    '## 质量门',
    ...gates.map(item => `- ${item.ok ? '✓' : '✗'} ${item.label}${item.detail ? ` — ${item.detail}` : ''}`),
    '',
    '## 名单',
    ...characters.slice(0, 24).map(item => {
      const rec = asRecord(item)
      const name = typeof rec.name === 'string' ? rec.name : '?'
      const role = typeof rec.oneLiner === 'string' ? rec.oneLiner : typeof rec.importance === 'string' ? rec.importance : ''
      return `- **${name}** ${role}`.trim()
    }),
    '',
    '设定图走 16:9 三视图（左栏半身基准 + 右栏正侧背）。出图用 `directorx_propose` / `generate_ready`，不要另起生成入口。',
  ]
  return packReview('characters', path, source, gates, lines.join('\n'))
}

function packReview(kind: BibleKind, path: string, title: string, gates: BibleGate[], markdown: string): BibleReview {
  const passed = gates.filter(item => item.ok).length
  return {
    kind,
    path,
    title,
    gates,
    passed,
    total: gates.length,
    markdown,
    next: [
      passed === gates.length ? '可以进下一层，或 directorx_bible pin 钉到画布' : '按未过的门改 JSON，再 checkup',
      '分镜只映射已过门的剧本节拍，不发明情节',
    ],
  }
}

async function loadScript(kind: Exclude<BibleKind, 'characters'>): Promise<{
  gateReport: (doc: unknown, ctx?: unknown) => unknown
  renderMarkdown: (doc: unknown, ctx?: unknown) => string
}> {
  const rel = SCRIPT[kind]
  const href = new URL(`../skills/${rel}`, import.meta.url).href
  const mod = await import(href) as {
    gateReport?: (doc: unknown, ctx?: unknown) => unknown
    renderMarkdown?: (doc: unknown, ctx?: unknown) => string
  }
  if (typeof mod.gateReport !== 'function' || typeof mod.renderMarkdown !== 'function') {
    throw new Error(`${kind} 脚本没有 gateReport / renderMarkdown`)
  }
  return { gateReport: mod.gateReport, renderMarkdown: mod.renderMarkdown }
}

export async function reviewBible(path: string, kindHint?: BibleKind): Promise<BibleReview> {
  const kind = kindHint ?? inferBibleKind(path)
  if (kind === undefined) throw new Error(`无法从文件名判断类型：${basename(path)}`)
  const doc = JSON.parse(await readFile(path, 'utf8')) as unknown
  if (kind === 'characters') return characterReview(asRecord(doc), path)
  const script = await loadScript(kind)
  const langOrCtx = kind === 'outline' || kind === 'art' ? 'zh' : {}
  const gates = asGates(script.gateReport(doc, langOrCtx === 'zh' ? undefined : langOrCtx))
  const rendered = String(script.renderMarkdown(doc, langOrCtx) ?? '').trim()
  const header = [
    `# 评审｜${KIND_LABEL[kind]} · ${asRecord(doc).source ?? basename(path)}`,
    '',
    `门 ${gates.filter(item => item.ok).length}/${gates.length} 过。JSON 是事实源；评审用 Markdown 钉画布或给 DSH 展示，不要另出 HTML。`,
    '',
  ].join('\n')
  const markdown = rendered.startsWith('#') ? `${header}${rendered}` : `${header}${rendered}`
  const title = typeof asRecord(doc).source === 'string' ? String(asRecord(doc).source) : basename(path)
  return packReview(kind, path, title, gates, markdown)
}

export async function pinBible(input: {
  outputDir: string
  review: BibleReview
}): Promise<{ path: string; nodeId: string; markdown: string }> {
  const dir = join(resolveOutputDir(input.outputDir), 'docs')
  await mkdir(dir, { recursive: true })
  const file = join(dir, `${input.review.kind}-review.md`)
  await writeFile(file, input.review.markdown, 'utf8')
  const canvas = new DirectorxCanvasStore(input.outputDir)
  const doc = await canvas.read()
  const maxBottom = doc.nodes.reduce((max, node) => Math.max(max, node.y + (node.height ?? 120)), 0)
  const nodeId = `bible-${input.review.kind}`
  const existing = doc.nodes.find(node => node.id === nodeId)
  const lines = input.review.markdown.split('\n').length
  const height = Math.max(220, Math.min(720, 80 + lines * 18))
  const label = input.review.markdown.slice(0, 8000)
  if (existing !== undefined) {
    await canvas.update(nodeId, { label, width: 520, height })
  } else {
    await canvas.addNode({
      id: nodeId,
      kind: 'text',
      label,
      x: 48,
      y: maxBottom + 48,
      width: 520,
      height,
    })
  }
  return { path: file, nodeId, markdown: input.review.markdown }
}

export function skillDir(): string {
  return fileURLToPath(new URL('../skills/', import.meta.url))
}

export async function runBible(input: {
  outputDir: string
  action?: string
  kind?: string
  path?: string
  pin?: boolean
}): Promise<Record<string, unknown>> {
  const action = input.action === 'checkup' || input.action === 'render' || input.action === 'pin'
    ? input.action
    : 'detect'
  const artifacts = await detectBibles(input.outputDir)
  if (action === 'detect') {
    return {
      artifacts,
      next: artifacts.length === 0
        ? ['先写出 outline/cast/art/script/storyboard 的 JSON']
        : ['directorx_bible checkup 看门', '通过后 directorx_bible pin 钉到画布'],
    }
  }
  const kind = (['outline', 'characters', 'art', 'script', 'storyboard'] as const)
    .find(item => item === input.kind)
  let target = typeof input.path === 'string' && input.path.trim() !== ''
    ? artifacts.find(item => item.path === input.path) ?? { kind: kind ?? inferBibleKind(input.path), path: input.path, title: '' }
    : artifacts.find(item => kind === undefined || item.kind === kind)
  if (target === undefined || target.kind === undefined) {
    throw new Error('没有可评审的 JSON。先改编产出 *-outline.json / *-cast.json 等，或传入 path。')
  }
  const review = await reviewBible(target.path, target.kind)
  if (action === 'checkup' || action === 'render') {
    return { ...review, artifacts, pin: action === 'render' ? '要钉画布再 pin' : undefined }
  }
  const pinned = await pinBible({ outputDir: input.outputDir, review })
  return {
    ...review,
    saved: pinned.path,
    canvasNodeId: pinned.nodeId,
    next: ['用户在画布上看评审卡；DSH 会话里也能读同一份 markdown。不要另出 HTML。'],
  }
}
