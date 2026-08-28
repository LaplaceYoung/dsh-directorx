/**
 * Storyboard duration planning: the deterministic layer behind 分镜规划
 * (PenShot-inspired). Agents propose shots; this allocates/validates
 * durations against model limits and continuity anchors so the plan is
 * generation-ready before any API spend.
 */

/** 运镜安全词表：统一平移/缩放类安全；轨道/旋转/甩镜类需显式放开。 */
export const CAMERA_SAFE_MOVES = ['static', 'push_in', 'pull_out', 'pan', 'tilt', 'parallax', 'element'] as const
export const CAMERA_BOLD_MOVES = ['orbit', 'dolly_zoom', 'roll', 'whip'] as const

export interface ShotPlanInput {
  shots: Array<{
    id: string
    description: string
    seconds?: number
    /** 工业分镜字段（透传并保留在输出，供提示词工坊使用）。 */
    cameraShot?: string
    angle?: string
    movement?: string
    moodTags?: string[]
    actionBeats?: string[]
    dialogue?: string
    /** 分场/节拍归属（剧本单一事实源的 beat 层）。 */
    storyBeat?: string
  }>
  /** Whole-film target (e.g. 30). Allocation scales when not all shots specify seconds. */
  targetSeconds?: number
  /** Provider clamp (e.g. seedance 10s). Defaults per kind. */
  maxShotSeconds?: number
  minShotSeconds?: number
  anchors?: { characters?: string[]; scenes?: string[] }
  negativeRequired?: boolean
}

export interface ShotPlanOutput {
  shots: Array<{
    id: string
    description: string
    seconds: number
    cameraShot?: string
    angle?: string
    movement?: string
    moodTags?: string[]
    actionBeats?: string[]
    dialogue?: string
    /** 分场/节拍归属（剧本单一事实源的 beat 层）。 */
    storyBeat?: string
  }>
  totalSeconds: number
  issues: string[]
  notes: string[]
}

export interface MvStoryboardSegment {
  id?: string
  start?: number
  duration?: number
  characters?: string[]
  scene?: string
  type?: 'narrative' | 'performance'
}

export interface MvStoryboardValidation {
  ok: boolean
  errors: string[]
  warnings: string[]
  segments: Array<{ id: string; start: number; duration: number; type: 'narrative' | 'performance' }>
  totalSeconds: number
}

/** Validate MV timing/reference constraints without writing state or calling providers. */
export function validateMvStoryboard(input: {
  segments: MvStoryboardSegment[]
  characters?: string[]
  scenes?: string[]
}): MvStoryboardValidation {
  const errors: string[] = []
  const warnings: string[] = []
  const segments = Array.isArray(input.segments) ? input.segments : []
  const normalized = segments.map((segment, index) => ({
    id: String(segment.id ?? `segment-${index + 1}`),
    start: typeof segment.start === 'number' && Number.isFinite(segment.start) ? segment.start : NaN,
    duration: typeof segment.duration === 'number' && Number.isFinite(segment.duration) ? segment.duration : NaN,
    type: segment.type === 'performance' ? 'performance' as const : 'narrative' as const,
    characters: Array.isArray(segment.characters) ? segment.characters.map(String) : [],
    scene: typeof segment.scene === 'string' ? segment.scene : undefined,
  }))
  if (normalized.length === 0) errors.push('segments must contain at least one segment')
  let expectedStart = 0
  let totalSeconds = 0
  let performanceSeconds = 0
  for (const [index, segment] of normalized.entries()) {
    if (!Number.isFinite(segment.start) || !Number.isFinite(segment.duration)) errors.push(`${segment.id}: start and duration are required numbers`)
    if (Number.isFinite(segment.duration) && (segment.duration < 3 || segment.duration > 15)) errors.push(`${segment.id}: duration must be between 3 and 15 seconds`)
    if (Number.isFinite(segment.start) && Math.abs(segment.start - expectedStart) > 0.001) errors.push(`${segment.id}: start ${segment.start} is not contiguous; expected ${expectedStart}`)
    if (segment.characters.length > 2) errors.push(`${segment.id}: no more than two characters are allowed`)
    for (const character of segment.characters) if (input.characters !== undefined && !input.characters.includes(character)) errors.push(`${segment.id}: unknown character reference ${character}`)
    if (segment.scene !== undefined && input.scenes !== undefined && !input.scenes.includes(segment.scene)) errors.push(`${segment.id}: unknown scene reference ${segment.scene}`)
    if (segment.type === 'performance') {
      performanceSeconds += Number.isFinite(segment.duration) ? segment.duration : 0
      if (index > 0 && normalized[index - 1].type === 'performance') errors.push(`${segment.id}: performance segments cannot be consecutive`)
    }
    if (Number.isFinite(segment.duration)) { expectedStart += segment.duration; totalSeconds += segment.duration }
  }
  if (totalSeconds > 0 && performanceSeconds / totalSeconds > 0.5) warnings.push('performance segments exceed 50% of total duration')
  return { ok: errors.length === 0, errors, warnings, segments: normalized.map(({ id, start, duration, type }) => ({ id, start, duration, type })), totalSeconds: Number(totalSeconds.toFixed(3)) }
}

export function planStoryboard(input: ShotPlanInput): ShotPlanOutput {
  const minShot = input.minShotSeconds ?? 1
  const maxShot = input.maxShotSeconds ?? 10
  const issues: string[] = []
  const notes: string[] = []
  const shots = input.shots.map((shot, index) => {
    let seconds = typeof shot.seconds === 'number' && shot.seconds > 0 ? shot.seconds : 0
    if (seconds > 0 && (seconds < minShot || seconds > maxShot)) {
      issues.push(`镜头 ${shot.id ?? index + 1} 时长 ${seconds}s 超出模型区间 [${minShot},${maxShot}]，已钳制`)
      seconds = Math.min(maxShot, Math.max(minShot, seconds))
    }
    return {
      id: shot.id ?? `shot-${index + 1}`,
      description: shot.description,
      seconds,
      ...(shot.cameraShot !== undefined ? { cameraShot: shot.cameraShot } : {}),
      ...(shot.angle !== undefined ? { angle: shot.angle } : {}),
      ...(shot.movement !== undefined ? { movement: shot.movement } : {}),
      ...(shot.moodTags !== undefined ? { moodTags: shot.moodTags } : {}),
      ...(shot.actionBeats !== undefined ? { actionBeats: shot.actionBeats } : {}),
      ...(shot.dialogue !== undefined ? { dialogue: shot.dialogue } : {}),
      ...(shot.storyBeat !== undefined ? { storyBeat: shot.storyBeat } : {}),
    }
  })
  // Allocate unspecified durations: fill to target or the max-shot default.
  const unspecified = shots.filter(shot => shot.seconds === 0)
  const specifiedTotal = shots.reduce((sum, shot) => sum + (shot.seconds > 0 ? shot.seconds : 0), 0)
  const target = input.targetSeconds ?? shots.length * 5
  if (unspecified.length > 0) {
    const remaining = Math.max(unspecified.length * minShot, target - specifiedTotal)
    const perShot = Math.min(maxShot, remaining / unspecified.length)
    for (const shot of unspecified) shot.seconds = Number(perShot.toFixed(1))
    notes.push(`未指定时长的 ${unspecified.length} 个镜头按目标 ${target}s 分配（每个 ${perShot.toFixed(1)}s）`)
  }
  const totalSeconds = shots.reduce((sum, shot) => sum + shot.seconds, 0)
  if (input.targetSeconds !== undefined && Math.abs(totalSeconds - input.targetSeconds) > Math.max(1, input.targetSeconds * 0.2)) {
    notes.push(`总时长 ${totalSeconds.toFixed(1)}s 与目标 ${input.targetSeconds}s 偏差较大，建议调整镜头数或单镜时长`)
  }
  // Continuity anchors: every shot should reference registered anchors.
  if (input.anchors !== undefined) {
    const characterNames = input.anchors.characters ?? []
    const sceneNames = input.anchors.scenes ?? []
    for (const shot of shots) {
      const missing: string[] = []
      for (const name of characterNames) if (!shot.description.includes(name)) missing.push(`角色「${name}」`)
      for (const name of sceneNames) if (!shot.description.includes(name)) missing.push(`场景「${name}」`)
      if (missing.length > 0) issues.push(`镜头 ${shot.id} 未引用连续性锚点：${missing.join('、')}`)
    }
  }
  // 运镜硬约束：安全词表校验 + 相邻镜头反单调。
  const safeSet = new Set<string>(CAMERA_SAFE_MOVES)
  const boldSet = new Set<string>(CAMERA_BOLD_MOVES)
  let previousMove: string | undefined
  for (const shot of shots) {
    const move = shot.movement !== undefined && shot.movement !== '' ? String(shot.movement).toLowerCase() : undefined
    if (move !== undefined) {
      if (!safeSet.has(move) && !boldSet.has(move)) {
        issues.push(`镜头 ${shot.id} 运镜「${shot.movement}」不在词表内（安全：static/push_in/pull_out/pan/tilt/parallax/element；大胆需显式放开：orbit/dolly_zoom/roll/whip）`)
      }
      if (boldSet.has(move)) {
        notes.push(`镜头 ${shot.id} 使用大胆运镜「${shot.movement}」——生成失败率高，建议备选安全运镜`)
      }
      if (previousMove !== undefined && previousMove === move && move !== 'static') {
        issues.push(`镜头 ${shot.id} 与上一镜运镜相同（反单调规则：相邻镜头运镜必须不同）`)
      }
      previousMove = move
    }
  }
  return { shots, totalSeconds: Number(totalSeconds.toFixed(1)), issues, notes }
}
