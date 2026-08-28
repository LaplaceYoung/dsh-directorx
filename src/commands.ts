import type { Context } from '@deepseek-ai/cordis'
import { formatProductionBoard, formatProposalList } from './board.ts'
import { DirectorxCanvasStore } from './canvas.ts'
import { ProposalStore } from './proposals.ts'
import { formatCanvasShotlist } from './shotlist.ts'

/**
 * DSH human command plane (`ctx.commands`). `/directorx` is a direct UI
 * action: it does not become a model message and spends no tokens. Web slash
 * menu and TUI both list host commands via the official registry.
 */

export type DirectorxCommandKind = 'board' | 'shotlist' | 'proposals' | 'next' | 'help'

export interface CommandResult {
  kind: 'success' | 'error'
  text: string
}

const USAGE = 'Usage: /directorx [shotlist|proposals|next]'

export function parseDirectorxCommand(rawInput: string): DirectorxCommandKind {
  const token = rawInput.trim().split(/\s+/)[0]?.toLowerCase() ?? ''
  if (token === '' || token === 'board') return 'board'
  if (token === 'shotlist') return 'shotlist'
  if (token === 'proposals') return 'proposals'
  if (token === 'next') return 'next'
  return 'help'
}

export async function runDirectorxCommand(rawInput: string, outputDir: string): Promise<CommandResult> {
  const kind = parseDirectorxCommand(rawInput)
  if (kind === 'help') {
    return { kind: 'error', text: `Unknown /directorx argument.\n${USAGE}` }
  }
  const canvas = new DirectorxCanvasStore(outputDir)
  const store = new ProposalStore(outputDir)
  const [doc, proposals, next] = await Promise.all([canvas.read(), store.list(), store.next()])
  const shotlist = formatCanvasShotlist(doc)
  if (kind === 'shotlist') {
    return { kind: 'success', text: shotlist.markdown }
  }
  if (kind === 'proposals') {
    return { kind: 'success', text: formatProposalList(proposals) }
  }
  if (kind === 'next') {
    if (next === null) return { kind: 'success', text: 'No pending proposal. Queue one with directorx_propose, then /directorx next.' }
    const spec = [next.model, next.size, next.duration === undefined ? '' : `${next.duration}s`].filter(part => part !== '').join(' · ')
    return {
      kind: 'success',
      text: [
        `${next.id} · ${next.status} · ${next.kind}`,
        spec,
        next.prompt,
        next.note ?? '',
        'Approve in the canvas or call directorx_confirm.',
      ].filter(line => line !== '').join('\n'),
    }
  }
  const board = formatProductionBoard({ shotlist, proposals, next })
  return { kind: 'success', text: board.markdown }
}

export function registerDirectorxCommands(ctx: Context, getOutputDir: () => string): () => void {
  ctx.inject(['commands'], (commandCtx) => {
    const commands = commandCtx.commands
    if (commands === undefined) throw new Error('directorx commands inject ran without ctx.commands')
    commands.register({
      name: 'directorx',
      description: 'DirectorX production board (shot list + proposal queue). Direct UI, no model tokens.',
      input: { hint: '[shotlist|proposals|next]' },
      handler: async ({ rawInput }) => runDirectorxCommand(rawInput, getOutputDir()),
    })
  })
  return () => {}
}
