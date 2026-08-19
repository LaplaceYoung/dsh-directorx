import type { ConfirmAnswer, ConfirmAsk, ConfirmQuestion } from './confirm.ts'

/** Normalize a DSH ask() payload. Options become tappable cards; never a markdown list. */

export function normalizeAskQuestions(raw: unknown): ConfirmQuestion[] {
  if (Array.isArray(raw)) {
    return raw.flatMap((item, index) => normalizeOne(item, index)).slice(0, 6)
  }
  if (raw !== null && typeof raw === 'object') {
    const record = raw as Record<string, unknown>
    if (Array.isArray(record.questions)) return normalizeAskQuestions(record.questions)
    return normalizeOne(record, 0)
  }
  return []
}

function normalizeOne(raw: unknown, index: number): ConfirmQuestion[] {
  if (raw === null || typeof raw !== 'object') return []
  const record = raw as Record<string, unknown>
  const question = typeof record.question === 'string' ? record.question.trim() : ''
  if (question === '') return []
  const optionsRaw = Array.isArray(record.options) ? record.options : []
  const options = optionsRaw.flatMap((item) => {
    if (typeof item === 'string' && item.trim() !== '') return [{ label: item.trim() }]
    if (item !== null && typeof item === 'object') {
      const option = item as Record<string, unknown>
      const label = typeof option.label === 'string' ? option.label.trim() : ''
      if (label === '') return []
      return [{
        label,
        ...(typeof option.description === 'string' && option.description !== '' ? { description: option.description } : {}),
      }]
    }
    return []
  }).slice(0, 8)
  const recommended = typeof record.recommended === 'string' ? record.recommended.trim() : ''
  if (recommended !== '' && !options.some(item => item.label === recommended) && options.length < 8) {
    options.unshift({ label: recommended, description: '推荐默认' })
  }
  return [{
    id: typeof record.id === 'string' && record.id.trim() !== '' ? record.id.trim() : `q${index + 1}`,
    question,
    ...(typeof record.header === 'string' ? { header: record.header } : {}),
    ...(typeof record.detail === 'string' ? { detail: record.detail } : {}),
    ...(options.length > 0 ? { options } : {}),
    ...(record.multiSelect === true ? { multiSelect: true } : {}),
  }]
}

export async function presentAsk(input: {
  questions: ConfirmQuestion[]
  ask: ConfirmAsk
  agent?: unknown
  signal?: AbortSignal
}): Promise<{ answers: ConfirmAnswer[]; questions: ConfirmQuestion[] }> {
  if (input.questions.length === 0) throw new Error('directorx_ask 需要至少一道 question（走 DSH 标准提问）')
  const asked = await input.ask({
    questions: input.questions,
    ...(input.agent === undefined ? {} : { agent: input.agent }),
    ...(input.signal === undefined ? {} : { signal: input.signal }),
  })
  return { answers: asked.answers, questions: input.questions }
}

export interface HostAskService {
  ask: ConfirmAsk
}

/**
 * DSH 0.1.0-rc.8 names the ask seam `userQuestions`. Older hosts and some
 * forks still expose `userInteraction` with the same `ask()` shape. Prefer
 * the current name, then the alias, and never throw on a missing service —
 * callers decide whether the absence is fatal.
 */
export function resolveHostAsk(ctx: { get(name: string): unknown }): HostAskService | undefined {
  for (const name of ['userQuestions', 'userInteraction']) {
    try {
      const service = ctx.get(name) as HostAskService | undefined
      if (service !== undefined && typeof service.ask === 'function') return service
    } catch {
      // Cordis `get` throws when the service is not on this fiber.
    }
  }
  return undefined
}
