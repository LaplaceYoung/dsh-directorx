/**
 * 模型能力表路由：按输入需求（时长/画幅/首尾帧/音画同出）过滤并排序
 * 可用模型——把「执行时才失败的参数组合」前置到计划期。
 */

export interface ModelCapability {
  model: string
  mode: string
  maxDurationSec: number
  minDurationSec: number
  aspectRatios: string[]
  firstFrame: boolean
  lastFrame: boolean
  audio: boolean
  /** 多参考图（多主体/多素材条件输入）。 */
  multiRef: boolean
}

export const MODEL_MATRIX: ModelCapability[] = [
  { model: 'sora-2', mode: 'openai-videos', maxDurationSec: 12, minDurationSec: 4, aspectRatios: ['16:9', '9:16'], firstFrame: true, lastFrame: false, audio: false, multiRef: false },
  { model: 'sora-2-pro', mode: 'openai-videos', maxDurationSec: 12, minDurationSec: 4, aspectRatios: ['16:9', '9:16'], firstFrame: true, lastFrame: false, audio: false, multiRef: false },
  { model: 'kling-v3', mode: 'kling', maxDurationSec: 15, minDurationSec: 3, aspectRatios: ['16:9', '9:16', '1:1'], firstFrame: true, lastFrame: true, audio: true, multiRef: false },
  { model: 'kling-3.0', mode: 'kling-v3', maxDurationSec: 15, minDurationSec: 3, aspectRatios: ['16:9', '9:16', '1:1'], firstFrame: true, lastFrame: true, audio: true, multiRef: false },
  { model: 'gen4.5', mode: 'runway', maxDurationSec: 10, minDurationSec: 2, aspectRatios: ['16:9', '9:16', '1:1'], firstFrame: true, lastFrame: false, audio: false, multiRef: false },
  { model: 'gen4_turbo', mode: 'runway', maxDurationSec: 10, minDurationSec: 2, aspectRatios: ['16:9', '9:16'], firstFrame: true, lastFrame: false, audio: false, multiRef: false },
  { model: 'MiniMax-H3', mode: 'minimax-h3', maxDurationSec: 15, minDurationSec: 4, aspectRatios: ['16:9', '9:16', '1:1', '21:9'], firstFrame: true, lastFrame: true, audio: false, multiRef: false },
  { model: 'viduq3', mode: 'vidu', maxDurationSec: 16, minDurationSec: 3, aspectRatios: ['16:9', '9:16', '1:1'], firstFrame: false, lastFrame: false, audio: true, multiRef: false },
  { model: 'viduq3-turbo', mode: 'vidu', maxDurationSec: 16, minDurationSec: 3, aspectRatios: ['16:9', '9:16', '1:1'], firstFrame: false, lastFrame: false, audio: true, multiRef: false },
  { model: 'veo-3.1-generate-preview', mode: 'veo', maxDurationSec: 8, minDurationSec: 4, aspectRatios: ['16:9', '9:16'], firstFrame: true, lastFrame: true, audio: true, multiRef: false },
]

export interface RouteRequest {
  durationSec?: number
  aspectRatio?: string
  needsFirstFrame?: boolean
  needsLastFrame?: boolean
  needsAudio?: boolean
  needsMultiRef?: boolean
}

export interface RouteResult {
  eligible: ModelCapability[]
  excluded: Array<{ model: string; reasons: string[] }>
}

/** 按需求过滤并排序（命中项越全越靠前）。 */
export function routeModel(request: RouteRequest, extras: ModelCapability[] = []): RouteResult {
  const eligible: ModelCapability[] = []
  const excluded: Array<{ model: string; reasons: string[] }> = []
  const seen = new Set<string>()
  const matrix: ModelCapability[] = []
  for (const capability of [...MODEL_MATRIX, ...extras]) {
    if (seen.has(`${capability.mode}:${capability.model}`)) continue
    seen.add(`${capability.mode}:${capability.model}`)
    matrix.push(capability)
  }
  for (const capability of matrix) {
    const reasons: string[] = []
    if (request.durationSec !== undefined && (request.durationSec < capability.minDurationSec || request.durationSec > capability.maxDurationSec)) {
      reasons.push(`时长 ${request.durationSec}s 超出 [${capability.minDurationSec},${capability.maxDurationSec}]`)
    }
    if (request.aspectRatio !== undefined && !capability.aspectRatios.includes(request.aspectRatio)) {
      reasons.push(`画幅 ${request.aspectRatio} 不在 ${capability.aspectRatios.join('/')}`)
    }
    if (request.needsFirstFrame === true && !capability.firstFrame) reasons.push('不支持首帧')
    if (request.needsLastFrame === true && !capability.lastFrame) reasons.push('不支持尾帧')
    if (request.needsAudio === true && !capability.audio) reasons.push('不支持音画同出')
    if (request.needsMultiRef === true && !capability.multiRef) reasons.push('不支持多参考图（多主体输入）')
    if (reasons.length === 0) eligible.push(capability)
    else excluded.push({ model: capability.model, reasons })
  }
  eligible.sort((a, b) => {
    const score = (capability: ModelCapability) =>
      (request.needsFirstFrame === true ? Number(capability.firstFrame) : 0) +
      (request.needsLastFrame === true ? Number(capability.lastFrame) : 0) +
      (request.needsAudio === true ? Number(capability.audio) : 0) +
      (request.needsMultiRef === true ? Number(capability.multiRef) : 0) +
      (request.durationSec !== undefined && request.durationSec <= capability.maxDurationSec ? 1 : 0)
    return score(b) - score(a)
  })
  return { eligible, excluded }
}
