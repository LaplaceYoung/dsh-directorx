import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { LIMITS } from './limits.ts'
import { join } from 'node:path'
import { resolveOutputDir } from './support.ts'

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
  /** Optional canvas node id the proposal mirrors onto (state visible on the board). */
  canvasNodeId?: string
  /** Researched prompt receipt from directorx_prompt_craft. */
  craftId?: string
  status: 'proposed' | 'approved' | 'rejected' | 'done'
  at: number
  /** 生产阶段（阶段门控：前一阶段未清，后一阶段不入执行队列）。 */
  stage?: 'script' | 'character' | 'shot' | 'assembly'
  /** 被拒原因（拒绝必填，回归生成可带备注）。 */
  rejectReason?: string
  /** 重生成来源（版本血统：rejected 后 regenerate 的新版本挂 parentId）。 */
  parentId?: string
  /** 提交后的 provider 任务标识（提交即检查点，凭它恢复而非盲重提）。 */
  taskId?: string
  attempts: number
}

export interface ProposalLedger {
  proposals: GenerationProposal[]
}

const MAX_PROPOSALS = 200

const STAGE_ORDER = ['script', 'character', 'shot', 'assembly'] as const

export class ProposalStore {
  constructor(private readonly outputDir: string) {}

  private filePath(): string {
    return join(resolveOutputDir(this.outputDir), 'proposals.json')
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
    await mkdir(resolveOutputDir(this.outputDir), { recursive: true })
    await writeFile(this.filePath(), JSON.stringify(ledger, null, 2), 'utf8')
    return ledger
  }

  /** 预检：提交即校验基础参数（模型目录预检的前置层）。 */
  private precheck(input: Omit<GenerationProposal, 'id' | 'at' | 'status' | 'attempts'>): string | null {
    if (input.prompt.trim() === '') return 'prompt 不能为空'
    if (input.kind !== 'image' && input.kind !== 'video' && input.kind !== 'audio') return 'kind 必须是 image/video/audio'
    if (input.duration !== undefined && (input.duration < LIMITS.proposalDurationRange[0] || input.duration > LIMITS.proposalDurationRange[1])) return `duration 超出 ${LIMITS.proposalDurationRange[0]}-${LIMITS.proposalDurationRange[1]}s 支持范围`
    if (input.count < LIMITS.proposalCountRange[0] || input.count > LIMITS.proposalCountRange[1]) return `count 超出 ${LIMITS.proposalCountRange[0]}-${LIMITS.proposalCountRange[1]} 支持范围`
    if (input.size !== undefined && !/^\d{3,4}[x:]\d{3,4}$|^\d+:\d+$/.test(input.size)) return 'size 格式应为 1280x720 或 16:9 类'
    return null
  }

  async propose(input: Omit<GenerationProposal, 'id' | 'at' | 'status' | 'attempts'>): Promise<GenerationProposal> {
    const invalid = this.precheck(input)
    if (invalid !== null) throw new Error(`提案预检未通过：${invalid}`)
    const ledger = await this.read()
    const proposal: GenerationProposal = {
      ...input,
      attempts: 0,
      id: `proposal-${Date.now().toString(36)}`,
      status: 'proposed',
      at: Date.now(),
    }
    ledger.proposals.push(proposal)
    if (ledger.proposals.length > MAX_PROPOSALS) ledger.proposals.splice(0, ledger.proposals.length - MAX_PROPOSALS)
    await this.write(ledger)
    return proposal
  }

  /** 审批队列：取最旧的一条待批准提案（审批门循环的下一步）。 */
  async next(): Promise<GenerationProposal | null> {
    const ledger = await this.read()
    // 批准执行环：已批准且未回填 taskId 的提案优先入执行队列（画布 UI 批准后 DSH 承接执行）。
    const approved = ledger.proposals
      .filter(proposal => proposal.status === 'approved' && (proposal.taskId ?? '') === '')
      .sort((a, b) => a.at - b.at)
    if (approved.length > 0) return approved[0]
    const proposed = ledger.proposals
      .filter(proposal => proposal.status === 'proposed')
      .sort((a, b) => a.at - b.at)
    if (proposed.length === 0) return null
    // 阶段门控：更早阶段仍有待批提案时，后一阶段不入执行队列。
    const earliestOpenStage = Math.min(...proposed.map(proposal => STAGE_ORDER.indexOf(proposal.stage ?? 'shot')))
    const executable = proposed.find(proposal => STAGE_ORDER.indexOf(proposal.stage ?? 'shot') === earliestOpenStage)
    return executable ?? null
  }

  async get(id: string): Promise<GenerationProposal | null> {
    const ledger = await this.read()
    return ledger.proposals.find(proposal => proposal.id === id) ?? null
  }

  async list(status?: GenerationProposal['status'], limit = 50): Promise<GenerationProposal[]> {
    const ledger = await this.read()
    const filtered = status === undefined ? ledger.proposals : ledger.proposals.filter(proposal => proposal.status === status)
    return filtered.slice(-limit).reverse()
  }

  async update(id: string, status: GenerationProposal['status'], fields: { rejectReason?: string; taskId?: string; attempts?: number; prompt?: string } = {}): Promise<GenerationProposal> {
    const ledger = await this.read()
    const proposal = ledger.proposals.find(candidate => candidate.id === id)
    if (proposal === undefined) throw new Error(`proposal "${id}" not found`)
    proposal.status = status
    if (status === 'rejected' && fields.rejectReason !== undefined && fields.rejectReason !== '') proposal.rejectReason = fields.rejectReason
    if (fields.taskId !== undefined && fields.taskId !== '') proposal.taskId = fields.taskId
    if (fields.attempts !== undefined) proposal.attempts = fields.attempts
    if (fields.prompt !== undefined && fields.prompt.trim() !== '') proposal.prompt = fields.prompt.slice(0, 2000)
    await this.write(ledger)
    return proposal
  }

  /** 版本血统：基于被拒提案生成新版本（parentId 链 + attempts 递增）。 */
  async regenerate(id: string, patch: { prompt?: string; note?: string } = {}): Promise<GenerationProposal> {
    const ledger = await this.read()
    const parent = ledger.proposals.find(candidate => candidate.id === id)
    if (parent === undefined) throw new Error(`proposal "${id}" not found`)
    const proposal: GenerationProposal = {
      ...parent,
      id: `proposal-${Date.now().toString(36)}`,
      ...(patch.prompt !== undefined ? { prompt: patch.prompt } : {}),
      ...(patch.note !== undefined ? { note: patch.note } : {}),
      parentId: parent.id,
      status: 'proposed',
      at: Date.now(),
      attempts: parent.attempts + 1,
      rejectReason: undefined,
      taskId: undefined,
    }
    ledger.proposals.push(proposal)
    await this.write(ledger)
    return proposal
  }
}
