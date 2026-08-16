/**
 * Storyboard duration planning: the deterministic layer behind 分镜规划
 * (PenShot-inspired). Agents propose shots; this allocates/validates
 * durations against model limits and continuity anchors so the plan is
 * generation-ready before any API spend.
 */

export interface ShotPlanInput {
  shots: Array<{ id: string; description: string; seconds?: number }>
  /** Whole-film target (e.g. 30). Allocation scales when not all shots specify seconds. */
  targetSeconds?: number
  /** Provider clamp (e.g. seedance 10s). Defaults per kind. */
  maxShotSeconds?: number
  minShotSeconds?: number
  anchors?: { characters?: string[]; scenes?: string[] }
  negativeRequired?: boolean
}

export interface ShotPlanOutput {
  shots: Array<{ id: string; description: string; seconds: number }>
  totalSeconds: number
  issues: string[]
  notes: string[]
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
    return { id: shot.id ?? `shot-${index + 1}`, description: shot.description, seconds }
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
  return { shots, totalSeconds: Number(totalSeconds.toFixed(1)), issues, notes }
}
