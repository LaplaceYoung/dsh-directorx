import { formatProductionBoard } from './board.ts'
import { DirectorxCanvasStore } from './canvas.ts'
import { ProposalStore, type GenerationProposal } from './proposals.ts'
import { formatCanvasShotlist, type Shotlist } from './shotlist.ts'

/**
 * DSH-native sign-off: build ask() questions from the board, apply the
 * answers to the proposal ledger. The tool pauses on ctx.userQuestions —
 * the same seam as ask_user_question — instead of returning a hint.
 */

export type ConfirmScope = 'next' | 'proposals' | 'shotlist'

export interface ConfirmQuestionOption {
  label: string
  description?: string
}

export interface ConfirmQuestion {
  id: string
  question: string
  header?: string
  detail?: string
  options?: ConfirmQuestionOption[]
  multiSelect?: boolean
}

export interface ConfirmAnswer {
  id: string
  selected: string[]
  custom?: string
}

export interface ConfirmApply {
  id: string
  status: 'approved' | 'rejected'
}

export interface ConfirmAsk {
  (request: {
    questions: ConfirmQuestion[]
    agent?: unknown
    signal?: AbortSignal
  }): Promise<{ answers: ConfirmAnswer[] }>
}

const APPROVE = '批准'
const REJECT = '拒绝'
const SIGN_ALL = '整表签字'
const REVISE = '回去改分镜'
const KEEP = '保持待批'

export function buildConfirmQuestions(input: {
  scope: ConfirmScope
  proposals: readonly GenerationProposal[]
  shotlist?: Shotlist
  next?: GenerationProposal | null
}): ConfirmQuestion[] {
  if (input.scope === 'shotlist') {
    const pending = input.proposals.filter(item => item.status === 'proposed')
    const detail = input.shotlist?.markdown ?? 'empty board'
    return [{
      id: 'shotlist',
      header: '分镜表签字',
      question: pending.length === 0
        ? '分镜表已导出。没有待批提案。下一步？'
        : `分镜表 ${input.shotlist?.title ?? ''}：${input.shotlist?.rows.length ?? 0} 镜 / ${pending.length} 条待批。签字后才能花钱生成。`,
      detail,
      options: pending.length === 0
        ? [
          { label: REVISE, description: '回到画布改镜号、提示词或连续性' },
          { label: KEEP, description: '先不改，稍后再批' },
        ]
        : [
          { label: SIGN_ALL, description: `批准全部 ${pending.length} 条待批占位` },
          { label: REVISE, description: '回到画布改分镜，提案保持待批' },
          { label: KEEP, description: '先不批，稍后再看' },
        ],
    }]
  }

  if (input.scope === 'proposals') {
    const pending = input.proposals.filter(item => item.status === 'proposed')
    if (pending.length === 0) {
      return [{
        id: 'proposals',
        header: '提案队列',
        question: '没有待批提案。',
        options: [{ label: KEEP, description: '先去 directorx_propose 排队占位' }],
      }]
    }
    return [{
      id: 'proposals',
      header: '提案签字',
      question: '勾选要批准的占位。未勾选的保持待批。',
      multiSelect: true,
      options: pending.map(proposal => ({
        label: proposal.id,
        description: `${proposal.kind} · ${proposal.model ?? '未指定模型'} · ${proposal.prompt.slice(0, 80)}`,
      })),
    }]
  }

  const next = input.next ?? input.proposals.filter(item => item.status === 'proposed').sort((a, b) => a.at - b.at)[0] ?? null
  if (next === null) {
    return [{
      id: 'next',
      header: '下一条',
      question: '没有待批提案。',
      options: [{ label: KEEP, description: '先排队占位或导出分镜表' }],
    }]
  }
  return [{
    id: 'next',
    header: '批准占位',
    question: `批准 ${next.id}？`,
    detail: [
      `${next.kind} · ${next.model ?? '未指定模型'} · ${next.size ?? ''} ${next.duration === undefined ? '' : `${next.duration}s`}`.trim(),
      next.prompt,
      next.note ?? '',
      next.estimatedCost === undefined ? '' : `成本假设：${next.estimatedCost}`,
    ].filter(line => line !== '').join('\n'),
    options: [
      { label: APPROVE, description: '写入 approved，之后 generate 带 proposalId' },
      { label: REJECT, description: '写入 rejected，不生成' },
    ],
  }]
}

export function applyConfirmAnswers(input: {
  answers: readonly ConfirmAnswer[]
  proposals: readonly GenerationProposal[]
  next?: GenerationProposal | null
}): ConfirmApply[] {
  const applied: ConfirmApply[] = []
  const pending = input.proposals.filter(item => item.status === 'proposed')
  const next = input.next ?? pending.sort((a, b) => a.at - b.at)[0] ?? null
  for (const answer of input.answers) {
    const picked = answer.custom !== undefined && answer.custom.trim() !== ''
      ? [answer.custom.trim()]
      : answer.selected
    if (answer.id === 'next' && next !== null) {
      if (picked.includes(APPROVE)) applied.push({ id: next.id, status: 'approved' })
      else if (picked.includes(REJECT)) applied.push({ id: next.id, status: 'rejected' })
      continue
    }
    if (answer.id === 'shotlist' && picked.includes(SIGN_ALL)) {
      for (const proposal of pending) applied.push({ id: proposal.id, status: 'approved' })
      continue
    }
    if (answer.id === 'proposals') {
      const chosen = new Set(picked)
      for (const proposal of pending) {
        if (chosen.has(proposal.id)) applied.push({ id: proposal.id, status: 'approved' })
      }
    }
  }
  return applied
}

export async function confirmProduction(input: {
  scope: ConfirmScope
  outputDir: string
  ask: ConfirmAsk
  agent?: unknown
  signal?: AbortSignal
}): Promise<{
  scope: ConfirmScope
  answers: ConfirmAnswer[]
  applied: ConfirmApply[]
  board: ReturnType<typeof formatProductionBoard>
}> {
  const canvas = new DirectorxCanvasStore(input.outputDir)
  const store = new ProposalStore(input.outputDir)
  const [doc, proposals, next] = await Promise.all([canvas.read(), store.list(), store.next()])
  const shotlist = formatCanvasShotlist(doc)
  const questions = buildConfirmQuestions({ scope: input.scope, proposals, shotlist, next })
  const asked = await input.ask({
    questions,
    ...(input.agent === undefined ? {} : { agent: input.agent }),
    ...(input.signal === undefined ? {} : { signal: input.signal }),
  })
  const applied = applyConfirmAnswers({ answers: asked.answers, proposals, next })
  for (const change of applied) {
    await store.update(change.id, change.status)
  }
  const after = await store.list()
  return {
    scope: input.scope,
    answers: asked.answers,
    applied,
    board: formatProductionBoard({ shotlist, proposals: after, next: await store.next() }),
  }
}
