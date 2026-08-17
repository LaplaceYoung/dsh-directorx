import type { GenerationProposal } from './proposals.ts'
import type { Shotlist } from './shotlist.ts'

/**
 * Human-facing production board: canvas shot list + proposal ledger.
 * Used by `/directorx` (DSH command plane, zero model tokens) and by
 * `directorx_confirm` (DSH userInteraction) so both surfaces share one view.
 */

export interface BoardCounts {
  shots: number
  proposed: number
  approved: number
  rejected: number
  done: number
  totalDurationSec: number
}

export interface ProductionBoard {
  title: string
  counts: BoardCounts
  nextId: string | null
  markdown: string
}

export function countProposals(proposals: readonly GenerationProposal[]): Omit<BoardCounts, 'shots' | 'totalDurationSec'> {
  const counts = { proposed: 0, approved: 0, rejected: 0, done: 0 }
  for (const proposal of proposals) {
    if (proposal.status === 'proposed') counts.proposed += 1
    else if (proposal.status === 'approved') counts.approved += 1
    else if (proposal.status === 'rejected') counts.rejected += 1
    else counts.done += 1
  }
  return counts
}

export function formatProductionBoard(input: {
  shotlist: Shotlist
  proposals: readonly GenerationProposal[]
  next?: GenerationProposal | null
}): ProductionBoard {
  const statusCounts = countProposals(input.proposals)
  const counts: BoardCounts = {
    shots: input.shotlist.rows.length,
    totalDurationSec: input.shotlist.totalDurationSec,
    ...statusCounts,
  }
  const next = input.next ?? input.proposals.filter(item => item.status === 'proposed').sort((a, b) => a.at - b.at)[0] ?? null
  const nextId = next === null ? null : next.id
  const durationLine = input.shotlist.targetSeconds === undefined
    ? `Shots ${counts.shots} · ${counts.totalDurationSec}s`
    : `Shots ${counts.shots} · ${counts.totalDurationSec}s / target ${input.shotlist.targetSeconds}s`
  const markdown = [
    `# ${input.shotlist.title}`,
    durationLine,
    `Proposals proposed ${counts.proposed} · approved ${counts.approved} · rejected ${counts.rejected} · done ${counts.done}`,
    next === null
      ? 'Next: none pending'
      : `Next: ${next.id} (${next.kind}) ${next.prompt.slice(0, 80)}`,
    '',
    'Commands: /directorx shotlist · /directorx proposals · /directorx next',
    'Confirm: directorx_confirm (DSH ask UI)',
  ].join('\n')
  return { title: input.shotlist.title, counts, nextId, markdown }
}

export function formatProposalList(proposals: readonly GenerationProposal[]): string {
  if (proposals.length === 0) return 'No proposals.'
  return [
    '| id | kind | status | model | spec | prompt |',
    '| --- | --- | --- | --- | --- | --- |',
    ...proposals.map(proposal => {
      const spec = [proposal.size, proposal.duration === undefined ? '' : `${proposal.duration}s`].filter(part => part !== '').join(' ')
      return `| ${proposal.id} | ${proposal.kind} | ${proposal.status} | ${proposal.model ?? '—'} | ${spec || '—'} | ${proposal.prompt.replace(/\|/g, '/').slice(0, 60)} |`
    }),
  ].join('\n')
}
