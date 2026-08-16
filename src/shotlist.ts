import type { CanvasDocument, CanvasNode } from './canvas.ts'

/**
 * Numbered production board (WonderUnit Storyboarder / Boords shot-list
 * pattern). The canvas already stores shot identity; this formats it as a
 * reviewable board the user can sign off before any generation spend.
 */

export interface ShotlistRow {
  index: number
  id: string
  kind: string
  label: string
  prompt: string
  durationSec: number
  continuity: string[]
  status: string
}

export interface Shotlist {
  title: string
  rows: ShotlistRow[]
  totalDurationSec: number
  targetSeconds?: number
  remainingSeconds?: number
  markdown: string
}

const DEFAULT_DURATION = 5

export function durationFromPrompt(prompt: string, fallback = DEFAULT_DURATION): number {
  const match = prompt.match(/(\d+(?:\.\d+)?)\s*s(?:ec(?:onds)?)?\b/i)
  if (match === null) return fallback
  const seconds = Number(match[1])
  if (!Number.isFinite(seconds) || seconds <= 0) return fallback
  return Math.min(30, Math.round(seconds))
}

function isShot(node: CanvasNode): boolean {
  return node.kind === 'image' || node.kind === 'video'
}

export function formatCanvasShotlist(
  doc: CanvasDocument,
  options: { targetSeconds?: number; defaultDurationSec?: number } = {},
): Shotlist {
  const fallback = options.defaultDurationSec ?? DEFAULT_DURATION
  const shots = doc.nodes.filter(isShot).slice()
  shots.sort((a, b) => {
    if (a.shotIndex !== undefined && b.shotIndex !== undefined) return a.shotIndex - b.shotIndex
    if (a.shotIndex !== undefined) return -1
    if (b.shotIndex !== undefined) return 1
    return a.id.localeCompare(b.id)
  })
  const rows: ShotlistRow[] = shots.map((node, i) => ({
    index: node.shotIndex ?? i + 1,
    id: node.id,
    kind: node.kind,
    label: node.label,
    prompt: node.prompt ?? '',
    durationSec: durationFromPrompt(node.prompt ?? '', fallback),
    continuity: node.continuityRules ?? [],
    status: node.shotStatus ?? 'idea',
  }))
  const totalDurationSec = rows.reduce((sum, row) => sum + row.durationSec, 0)
  const title = doc.title !== undefined && doc.title !== '' ? doc.title : 'untitled board'
  const targetSeconds = options.targetSeconds
  const remainingSeconds = targetSeconds === undefined ? undefined : targetSeconds - totalDurationSec
  const lines = [
    `# ${title}`,
    '',
    `| # | kind | label | dur | status | continuity |`,
    `| --- | --- | --- | ---: | --- | --- |`,
    ...rows.map(row => `| ${row.index} | ${row.kind} | ${row.label || row.id} | ${row.durationSec}s | ${row.status} | ${row.continuity.join(', ') || '—'} |`),
    '',
    `Total ${totalDurationSec}s` + (targetSeconds !== undefined ? ` / target ${targetSeconds}s (${remainingSeconds}s remaining)` : ''),
    '',
    ...rows.flatMap(row => [
      `## Shot ${row.index} — ${row.label || row.id}`,
      row.prompt === '' ? '_no prompt yet_' : row.prompt,
      '',
    ]),
  ]
  return { title, rows, totalDurationSec, targetSeconds, remainingSeconds, markdown: lines.join('\n') }
}
