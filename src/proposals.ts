import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

/**
 * Generation proposal ledger: the "placeholder-first" control mode from
 * directorx-production-lead made durable. Agents queue fully-specified
 * generation units as proposals (no API spend), users approve/reject them,
 * and execution only happens against an approved proposal. Stored as
 * proposals.json under the output dir.
 */

export interface GenerationProposal {
  id: string
  kind: 'image' | 'video' | 'audio'
  prompt: string
  model?: string
  size?: string
  duration?: number
  count: number
  /** Honest cost note: the plugin ships no price table. */
  estimatedCost?: string
  note?: string
  status: 'proposed' | 'approved' | 'rejected' | 'done'
  at: number
}

export interface ProposalLedger {
  proposals: GenerationProposal[]
}

const MAX_PROPOSALS = 200

export class ProposalStore {
  constructor(private readonly outputDir: string) {}

  private filePath(): string {
    return join(resolve(process.cwd(), this.outputDir), 'proposals.json')
  }

  async read(): Promise<ProposalLedger> {
    try {
      const raw = await readFile(this.filePath(), 'utf8')
      const parsed = JSON.parse(raw) as Partial<ProposalLedger>
      return { proposals: Array.isArray(parsed.proposals) ? parsed.proposals : [] }
    } catch {
      return { proposals: [] }
    }
  }

  private async write(ledger: ProposalLedger): Promise<ProposalLedger> {
    await mkdir(resolve(process.cwd(), this.outputDir), { recursive: true })
    await writeFile(this.filePath(), JSON.stringify(ledger, null, 2), 'utf8')
    return ledger
  }

  async propose(input: Omit<GenerationProposal, 'id' | 'at' | 'status'>): Promise<GenerationProposal> {
    const ledger = await this.read()
    const proposal: GenerationProposal = {
      ...input,
      id: `proposal-${Date.now().toString(36)}`,
      status: 'proposed',
      at: Date.now(),
    }
    ledger.proposals.push(proposal)
    if (ledger.proposals.length > MAX_PROPOSALS) ledger.proposals.splice(0, ledger.proposals.length - MAX_PROPOSALS)
    await this.write(ledger)
    return proposal
  }

  async list(status?: GenerationProposal['status'], limit = 50): Promise<GenerationProposal[]> {
    const ledger = await this.read()
    const filtered = status === undefined ? ledger.proposals : ledger.proposals.filter(proposal => proposal.status === status)
    return filtered.slice(-limit).reverse()
  }

  async update(id: string, status: GenerationProposal['status']): Promise<GenerationProposal> {
    const ledger = await this.read()
    const proposal = ledger.proposals.find(candidate => candidate.id === id)
    if (proposal === undefined) throw new Error(`proposal "${id}" not found`)
    proposal.status = status
    await this.write(ledger)
    return proposal
  }
}
