/**
 * TimelineEngine — 毫秒精度时间轴调度引擎。
 *
 * 特性：
 * - 三轨道叠加（anim / campath / motion），每轨道可有多个 clip
 * - loop / pingpong / once 三种重复模式
 * - gap 冻结最近 clip 边界帧（就近原则，防场景重置）
 * - 同轨重叠时选择 startMs 最晚的活跃 clip
 * - rAF 驱动实时播放 + setTimeout 降级（SSR 安全）+ 确定性手动 tick
 */

import type { TimelineClip, TimelineTrackKind } from '../types'
export type { TimelineClip, TimelineTrackKind } from '../types'

export type TimelineLoopMode = 'once' | 'loop' | 'pingpong'

export interface TimelineTrack {
  id?: string
  kind: TimelineTrackKind
  clips: readonly TimelineClip[]
  enabled?: boolean
  muted?: boolean
}

export interface ActiveClip {
  trackId?: string
  kind: TimelineTrackKind
  clip: TimelineClip
  localMs: number
  progress: number
  phase: 'active' | 'gap'
  boundary?: 'start' | 'end'
  frozen: boolean
}

export interface TimelineFrame {
  timeMs: number
  rawTimeMs: number
  durationMs: number
  progress: number
  samples: ActiveClip[]
  activeClips: ActiveClip[]
  byKind: Partial<Record<TimelineTrackKind, ActiveClip>>
}

export interface TimelineEngineOptions {
  tracks?: readonly TimelineTrack[]
  loopMode?: TimelineLoopMode
  loop?: boolean | TimelineLoopMode
  pingpong?: boolean
  onTick?: (timeMs: number, clips: ActiveClip[], frame: TimelineFrame) => void
  onFrame?: (frame: TimelineFrame) => void
  onComplete?: (frame: TimelineFrame) => void
}

// ── 工具 ──

const finite = (n: number): number => Number.isFinite(n) ? Math.max(0, n) : 0

const usable = (c: TimelineClip): boolean =>
  c.enabled !== false &&
  Number.isFinite(c.startMs) && Number.isFinite(c.durationMs) &&
  c.startMs >= 0 && c.durationMs > 0

const modeOf = (m: unknown): TimelineLoopMode =>
  m === 'pingpong' ? 'pingpong'
  : m === 'loop' || m === true ? 'loop'
  : 'once'

/** 计算时间轴总时长（所有轨道 clip 的最远结束点） */
export function timelineDuration(tracks: readonly TimelineTrack[]): number {
  let max = 0
  for (const t of tracks) {
    if (t.enabled === false) continue
    for (const c of t.clips) {
      if (usable(c)) max = Math.max(max, c.startMs + c.durationMs)
    }
  }
  return max
}

export interface TimelineTimeMapping {
  timeMs: number
  rawTimeMs: number
  cycle: number
  ended: boolean
}

/** 原始毫秒 → [0, durationMs] 映射（loop 循环 / pingpong 乒乓 / once 截断） */
export function resolveTimelineTime(
  rawMs: number,
  durationMs: number,
  mode: TimelineLoopMode = 'once',
): TimelineTimeMapping {
  const raw = finite(rawMs)
  const d = finite(durationMs)
  if (d === 0) return { timeMs: 0, rawTimeMs: raw, cycle: 0, ended: true }
  if (mode === 'loop') {
    return { timeMs: raw % d, rawTimeMs: raw, cycle: Math.floor(raw / d), ended: false }
  }
  if (mode === 'pingpong') {
    const p = d * 2
    const x = raw % p
    return { timeMs: x <= d ? x : p - x, rawTimeMs: raw, cycle: Math.floor(raw / p), ended: false }
  }
  return { timeMs: Math.min(raw, d), rawTimeMs: raw, cycle: 0, ended: raw >= d }
}

// ── 采样 ──

type Indexed = { clip: TimelineClip; order: number }

function sorted(t: TimelineTrack): Indexed[] {
  return t.clips
    .map((clip, order) => ({ clip, order }))
    .filter(x => usable(x.clip))
    .sort((a, b) => a.clip.startMs - b.clip.startMs || a.order - b.order)
}

function make(
  t: TimelineTrack,
  x: Indexed,
  localMs: number,
  phase: 'active' | 'gap',
  boundary?: 'start' | 'end',
): ActiveClip {
  const d = x.clip.durationMs
  const local = phase === 'active'
    ? Math.max(0, Math.min(d, localMs))
    : boundary === 'end' ? d : 0
  return {
    trackId: t.id,
    kind: t.kind,
    clip: x.clip,
    localMs: local,
    progress: d > 0 ? local / d : 0,
    phase,
    ...(boundary ? { boundary } : {}),
    frozen: phase === 'gap',
  }
}

/** 单轨道采样：活跃 clip（重叠取 startMs 最晚）或就近 gap 冻结 */
function choose(t: TimelineTrack, time: number): ActiveClip | null {
  if (t.enabled === false || t.muted) return null
  const xs = sorted(t)
  if (!xs.length) return null

  // 活跃：time ∈ [start, end)，重叠时取 startMs 最大
  let hit: Indexed | null = null
  for (const x of xs) {
    const end = x.clip.startMs + x.clip.durationMs
    if (time >= x.clip.startMs && time < end) {
      if (!hit || x.clip.startMs >= hit.clip.startMs) hit = x
    }
  }
  if (hit) return make(t, hit, time - hit.clip.startMs, 'active')

  // 在第一个 clip 之前：冻结起始帧
  if (time < xs[0].clip.startMs) return make(t, xs[0], 0, 'gap', 'start')

  // 在最后一个 clip 之后：冻结结束帧
  const last = xs[xs.length - 1]
  const lastEnd = last.clip.startMs + last.clip.durationMs
  if (time >= lastEnd) return make(t, last, last.clip.durationMs, 'gap', 'end')

  // 在两个 clip 之间的 gap：冻结更近的一侧边界
  for (let i = 0; i < xs.length - 1; i++) {
    const l = xs[i]
    const r = xs[i + 1]
    const e = l.clip.startMs + l.clip.durationMs
    if (time >= e && time < r.clip.startMs) {
      return time - e <= r.clip.startMs - time
        ? make(t, l, l.clip.durationMs, 'gap', 'end')
        : make(t, r, 0, 'gap', 'start')
    }
  }
  return null
}

/** 全轨道采样（含 gap 冻结） */
export function evaluateTimeline(
  tracks: readonly TimelineTrack[],
  rawMs: number,
  mode: TimelineLoopMode = 'once',
): TimelineFrame {
  const d = timelineDuration(tracks)
  const m = resolveTimelineTime(rawMs, d, mode)
  const samples: ActiveClip[] = []
  const byKind: Partial<Record<TimelineTrackKind, ActiveClip>> = {}
  for (const t of tracks) {
    const s = choose(t, m.timeMs)
    if (s) {
      samples.push(s)
      if (!byKind[t.kind]) byKind[t.kind] = s
    }
  }
  return {
    timeMs: m.timeMs,
    rawTimeMs: m.rawTimeMs,
    durationMs: d,
    progress: d > 0 ? m.timeMs / d : 0,
    samples,
    activeClips: samples,
    byKind,
  }
}

/** 某时刻的活跃 clip（不含 gap） */
export function activeClipsAt(tracks: readonly TimelineTrack[], timeMs: number): ActiveClip[] {
  return evaluateTimeline(tracks, timeMs).samples.filter(s => s.phase === 'active')
}

/** gap 冻结别名（兼容旧 API） */
export const freezeGap = (c: ActiveClip): boolean => c.frozen

// ── 引擎 ──

export class TimelineEngine {
  private tracks: TimelineTrack[] = []
  private playheadMs = 0
  private playing = false
  private raf: number | null = null
  private last = 0
  private mode: TimelineLoopMode = 'once'

  onTick: ((timeMs: number, clips: ActiveClip[], frame: TimelineFrame) => void) | null = null
  readonly onFrame?: (frame: TimelineFrame) => void
  readonly onComplete?: (frame: TimelineFrame) => void

  constructor(options: TimelineEngineOptions = {}) {
    this.mode = options.pingpong === true ? 'pingpong' : modeOf(options.loopMode ?? options.loop)
    this.onTick = options.onTick ?? null
    this.onFrame = options.onFrame
    this.onComplete = options.onComplete
    if (options.tracks) this.loadTracks(options.tracks)
  }

  loadTracks(ts: readonly TimelineTrack[]): void {
    this.stop()
    this.tracks = ts.map(t => ({ ...t, clips: [...t.clips] }))
    this.playheadMs = 0
  }

  setLoopMode(m: TimelineLoopMode): void { this.mode = m }
  getLoopMode(): TimelineLoopMode { return this.mode }

  get durationMs(): number { return timelineDuration(this.tracks) }
  get currentTimeMs(): number { return this.playheadMs }
  get isPlaying(): boolean { return this.playing }
  get frame(): TimelineFrame { return evaluateTimeline(this.tracks, this.playheadMs, this.mode) }

  frameAt(ms: number): TimelineFrame { return evaluateTimeline(this.tracks, ms, this.mode) }
  activeClipsAt(ms: number): ActiveClip[] {
    return this.frameAt(ms).samples.filter(s => s.phase === 'active')
  }
  freezeGapAt(ms: number): ActiveClip | null {
    return this.frameAt(ms).samples.find(s => s.phase === 'gap') ?? null
  }
  /** 别名（兼容旧 API） */
  freezeGap(ms: number): ActiveClip | null { return this.freezeGapAt(ms) }

  seek(ms: number): TimelineFrame {
    this.playheadMs = finite(ms)
    return this.emit()
  }

  /** 手动步进（确定性测试用） */
  tick(delta: number): TimelineFrame {
    this.playheadMs += finite(delta)
    const f = this.emit()
    if (this.mode === 'once' && this.playing && this.durationMs > 0 && this.playheadMs >= this.durationMs) {
      this.playing = false
      this.cancel()
      this.onComplete?.(f)
    }
    return f
  }

  play(): void {
    if (this.playing) return
    if (this.durationMs === 0) {
      this.onComplete?.(this.frame)
      return
    }
    if (this.mode === 'once' && this.durationMs > 0 && this.playheadMs >= this.durationMs) {
      this.playheadMs = 0
    }
    this.playing = true
    this.last = this.now()
    this.schedule()
  }

  pause(): void { this.playing = false; this.cancel() }
  stop(): void { this.playing = false; this.cancel(); this.playheadMs = 0 }
  reset(emit = false): TimelineFrame {
    this.pause()
    this.playheadMs = 0
    return emit ? this.emit() : this.frame
  }

  private now(): number {
    return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()
  }

  /** rAF 调度，无 rAF 环境降级 setTimeout(16ms) */
  private schedule(): void {
    if (!this.playing || this.raf !== null) return
    const cb = (now: number): void => {
      this.raf = null
      if (!this.playing) return
      const d = Math.max(0, now - this.last)
      this.last = now
      this.tick(d)
      if (this.playing) this.schedule()
    }
    if (typeof requestAnimationFrame === 'function') {
      this.raf = requestAnimationFrame(cb)
    } else {
      this.raf = setTimeout(() => cb(this.now()), 16) as unknown as number
    }
  }

  private cancel(): void {
    if (this.raf === null) return
    if (typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.raf)
    } else {
      clearTimeout(this.raf)
    }
    this.raf = null
  }

  private emit(): TimelineFrame {
    const f = this.frame
    this.onFrame?.(f)
    this.onTick?.(this.playheadMs, f.samples, f)
    return f
  }
}
