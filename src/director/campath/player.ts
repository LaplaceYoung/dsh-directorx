/**
 * Campath 播放层 — 相机路径播放器 + 录制回放 + 时间轴协调器。
 * 完整对齐原版 bundle：jd → CameraPathPlayer、Tg → RecordedPlayback、
 * pd/Yf/fd/Xf/md/Wf/Qf → clip 求值、Gt → timelineDurationMs。
 */

import * as THREE from 'three'
import {
  createCameraCurve,
  EASING,
  type CameraCurve,
  type CamPathPoint,
  type RecordedData,
} from './curve-engine'

// ── 路径数据 ──

export interface CamPath {
  id: string
  label?: string
  points: CamPathPoint[]
  closed?: boolean
  /** 毫秒 */
  duration: number
  easing?: keyof typeof EASING
  loopMode?: 'once' | 'loop' | 'pingpong'
  /** lookAt 目标对象 id；哨兵 LOOKAT_NONE 表示用 lookAt 坐标 */
  lookAtTarget?: string
  lookAt?: { x: number; y: number; z: number }
  fovStart?: number
  fovEnd?: number
  recorded?: RecordedData
}

/** lookAtTarget 哨兵：使用 lookAt 坐标而非场景对象（原版 Ne="__none__"）*/
export const LOOKAT_NONE = '__none__'

// ── 录制回放（原版 Tg）──

/**
 * VCam 录制的旋转/FOV 回放：四元数 slerp（dot<0 取反修正最短路径）+ FOV 分段插值。
 */
export class RecordedPlayback {
  private rotKs: number[]
  private rotQs: THREE.Quaternion[]
  private fovKeys: { k: number; fov: number }[]
  private fovKs: number[]
  private rotSeg = 0
  private fovSeg = 0

  constructor(data: RecordedData) {
    this.rotKs = data.rot.map(r => r.k)
    this.rotQs = data.rot.map(r => new THREE.Quaternion(r.q[0], r.q[1], r.q[2], r.q[3]).normalize())
    // 最短路径修正：相邻四元数 dot<0 时取反
    for (let i = 1; i < this.rotQs.length; i++) {
      if (this.rotQs[i - 1].dot(this.rotQs[i]) < 0) {
        this.rotQs[i].set(-this.rotQs[i].x, -this.rotQs[i].y, -this.rotQs[i].z, -this.rotQs[i].w)
      }
    }
    this.fovKeys = data.fov ?? []
    this.fovKs = this.fovKeys.map(f => f.k)
  }

  get hasRot(): boolean { return this.rotQs.length > 0 }
  get hasFov(): boolean { return this.fovKeys.length > 0 }

  /** 缓存段索引 + 二分查找（原版 locate）*/
  private locate(ks: number[], k: number, hint: number): number {
    const last = ks.length - 2
    if (last < 0) return 0
    for (let i = Math.max(0, hint); i <= Math.min(hint + 1, last); i++) {
      if (k >= ks[i] && k <= ks[i + 1]) return i
    }
    let lo = 0
    let hi = last
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1
      if (ks[mid] <= k) lo = mid
      else hi = mid - 1
    }
    return lo
  }

  rotAt(k: number, out: THREE.Quaternion): THREE.Quaternion {
    const qs = this.rotQs
    const n = qs.length
    if (n === 1 || k <= this.rotKs[0]) return out.copy(qs[0])
    if (k >= this.rotKs[n - 1]) return out.copy(qs[n - 1])
    const i = this.locate(this.rotKs, k, this.rotSeg)
    this.rotSeg = i
    const span = this.rotKs[i + 1] - this.rotKs[i]
    const t = span > 1e-9 ? (k - this.rotKs[i]) / span : 1
    return out.slerpQuaternions(qs[i], qs[i + 1], t)
  }

  fovAt(k: number): number | null {
    const keys = this.fovKeys
    const n = keys.length
    if (n === 0) return null
    if (n === 1 || k <= keys[0].k) return keys[0].fov
    if (k >= keys[n - 1].k) return keys[n - 1].fov
    const i = this.locate(this.fovKs, k, this.fovSeg)
    this.fovSeg = i
    const span = this.fovKs[i + 1] - this.fovKs[i]
    const t = span > 1e-9 ? (k - this.fovKs[i]) / span : 1
    return keys[i].fov + (keys[i + 1].fov - keys[i].fov) * t
  }
}

// ── 相机路径播放器（原版 jd）──

export type ResolveTargetFn = (id: string) => THREE.Object3D | null

export class CameraPathPlayer {
  onEnd?: () => void
  playing = true
  private _elapsed = 0
  private curve: CameraCurve
  readonly duration: number
  private recorded: RecordedPlayback | null
  private path: CamPath
  private resolveTarget: ResolveTargetFn
  private ended = false

  private static readonly _lookTarget = new THREE.Vector3()

  constructor(path: CamPath, resolveTarget: ResolveTargetFn) {
    this.path = path
    this.resolveTarget = resolveTarget
    this.curve = createCameraCurve(path.points, path.closed ?? false)
    this.duration = Math.max(1, path.duration)
    this.recorded = path.recorded?.rot?.length ? new RecordedPlayback(path.recorded) : null
  }

  /** 步进并应用（deltaMs 毫秒）*/
  tick(deltaMs: number, camera: THREE.PerspectiveCamera): void {
    if (this.playing && !this.ended) this._elapsed += deltaMs
    const { k, done } = this.cycleProgress()
    this.applyFrame(k, camera)
    if (this.playing && !this.ended && done) {
      this.ended = true
      this.playing = false
      this.onEnd?.()
    }
  }

  pause(): void { this.playing = false }

  resume(): void {
    if (this.ended) {
      this.ended = false
      const { k } = this.cycleProgress()
      if (k >= 1) this._elapsed = 0
    }
    this.playing = true
  }

  /** k ∈ [0,1] 归一化 seek */
  seek(k: number): void {
    this._elapsed = THREE.MathUtils.clamp(k, 0, 1) * this.duration
    this.ended = false
  }

  applyAt(k: number, camera: THREE.PerspectiveCamera): void {
    this.seek(k)
    this.applyFrame(THREE.MathUtils.clamp(k, 0, 1), camera)
  }

  /** 采样帧（不写相机；预览/对象跟随用）*/
  sampleAt(k: number): { position: THREE.Vector3; tangent: THREE.Vector3; up: THREE.Vector3 } {
    const eased = EASING[this.path.easing ?? 'linear'](THREE.MathUtils.clamp(k, 0, 1))
    return this.curve.frameAt(this.curve.timeToU(eased))
  }

  getProgress(): { k: number; u: number; elapsedMs: number; playing: boolean } {
    const { k } = this.cycleProgress()
    const u = this.curve.timeToU(EASING[this.path.easing ?? 'linear'](k))
    return { k, u, elapsedMs: k * this.duration, playing: this.playing && !this.ended }
  }

  private applyFrame(k: number, camera: THREE.PerspectiveCamera): void {
    const eased = EASING[this.path.easing ?? 'linear'](k)
    const u = this.curve.timeToU(eased)
    const frame = this.curve.frameAt(u)
    camera.position.copy(frame.position)
    this.applyOrientation(camera, frame.position, frame.tangent, frame.up, eased)
    this.applyFov(camera, u, eased)
  }

  /** 循环进度：once → min(e,1)；loop → e%1；pingpong → 反射（原版 cycleProgress）*/
  private cycleProgress(): { k: number; done: boolean } {
    const e = this._elapsed / this.duration
    switch (this.path.loopMode ?? 'once') {
      case 'loop':
        return { k: e % 1, done: false }
      case 'pingpong': {
        const x = e % 2
        return { k: x <= 1 ? x : 2 - x, done: false }
      }
      default:
        return { k: Math.min(e, 1), done: e >= 1 }
    }
  }

  /**
   * 朝向优先级（原版 applyOrientation）：
   * 1. lookAtTarget 对象 / lookAt 坐标 → up=(0,1,0) + lookAt
   * 2. 录制四元数 slerp
   * 3. 曲线帧：up.copy(frame.up) + lookAt(position + tangent)，随后 up 重置 (0,1,0)
   */
  private applyOrientation(
    camera: THREE.PerspectiveCamera,
    position: THREE.Vector3,
    tangent: THREE.Vector3,
    up: THREE.Vector3,
    k: number,
  ): void {
    const targetId = this.path.lookAtTarget
    let target: THREE.Vector3 | null = null
    if (targetId && targetId !== LOOKAT_NONE) {
      const obj = this.resolveTarget(targetId)
      target = obj ? obj.position : null
    } else if (targetId === LOOKAT_NONE && this.path.lookAt) {
      const look = this.path.lookAt
      target = CameraPathPlayer._lookTarget.set(look.x, look.y, look.z)
    }

    if (target) {
      camera.up.set(0, 1, 0)
      camera.lookAt(target)
    } else if (this.recorded?.hasRot) {
      this.recorded.rotAt(k, camera.quaternion)
    } else {
      camera.up.copy(up)
      CameraPathPlayer._lookTarget.copy(position).add(tangent)
      camera.lookAt(CameraPathPlayer._lookTarget)
      camera.up.set(0, 1, 0)
    }
  }

  /**
   * FOV 优先级（原版 applyFov）：录制 fovAt → 曲线 fovAt → fovStart→fovEnd 线性；
   * 变化 >0.001 才 updateProjectionMatrix。
   */
  private applyFov(camera: THREE.PerspectiveCamera, u: number, k: number): void {
    let fov = this.recorded?.hasFov ? this.recorded.fovAt(k) : null
    if (fov == null) fov = this.curve.fovAt(u)
    if (fov == null) {
      const { fovStart, fovEnd } = this.path
      if (fovStart == null || fovEnd == null) return
      fov = fovStart + (fovEnd - fovStart) * k
    }
    if (Math.abs(fov - camera.fov) > 0.001) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }
  }
}

/** 路径是否带 FOV 动画（原版 Pg）*/
export function hasFovAnimation(path: CamPath): boolean {
  return (
    !!path.recorded?.fov?.length ||
    path.points.some(p => p.fov != null) ||
    (path.fovStart != null && path.fovEnd != null)
  )
}

/**
 * 对象跟随时的朝向 yaw（原版 Ig）：取 k±窗口两点水平方位角；
 * 位移过小退化用切线方向。
 */
export function objectYawAt(player: CameraPathPlayer, k: number, durationMs: number): number | null {
  const n = Math.max(1, durationMs)
  const window = Math.min(400, Math.max(180, n * 0.09)) / n
  const a = player.sampleAt(Math.max(0, k - window))
  const b = player.sampleAt(Math.min(1, k + window))
  const dx = b.position.x - a.position.x
  const dz = b.position.z - a.position.z
  if (dx * dx + dz * dz > 1e-8) return Math.atan2(dx, dz)
  const cur = player.sampleAt(k)
  if (cur.tangent.lengthSq() > 1e-8) return Math.atan2(cur.tangent.x, cur.tangent.z)
  return null
}

// ── 时间轴 clip 求值（原版 pd / Yf / fd / Xf / md / Wf / Qf / Gt / qf）──

export interface TimelineClipRef {
  pathId: string
  start: number
  duration: number
  enabled?: boolean
}

export interface TimelineTrackRef {
  id?: string
  kind: 'camera' | 'object' | 'anim'
  targetId?: string
  orient?: 'follow' | 'free'
  muted?: boolean
  clips: TimelineClipRef[]
}

export interface CamTimeline {
  tracks: TimelineTrackRef[]
}

/** clip 是否活跃（原版 qf）*/
const clipActive = (c: TimelineClipRef, tMs: number): boolean =>
  c.enabled !== false && tMs >= c.start && tMs < c.start + c.duration

/** 轨道内活跃 clip；重叠取 start 最大（原版 pd）*/
export function activeClipInTrack(
  track: TimelineTrackRef,
  tMs: number,
  hasPath: (id: string) => boolean,
): { clip: TimelineClipRef; k: number } | null {
  let best: TimelineClipRef | null = null
  for (const clip of track.clips) {
    if (!clipActive(clip, tMs) || !hasPath(clip.pathId)) continue
    if (!best || clip.start > best.start) best = clip
  }
  if (!best) return null
  const k = Math.min(1, Math.max(0, (tMs - best.start) / best.duration))
  return { clip: best, k }
}

/** 相机轨活跃 clip（原版 Yf）*/
export function activeCameraClip(
  timeline: CamTimeline,
  tMs: number,
  hasPath: (id: string) => boolean,
): { clip: TimelineClipRef; trackId?: string; k: number } | null {
  if (!timeline) return null
  for (const track of timeline.tracks) {
    if (track.muted || track.kind !== 'camera') continue
    const hit = activeClipInTrack(track, tMs, hasPath)
    if (hit) return { clip: hit.clip, trackId: track.id, k: hit.k }
  }
  return null
}

/**
 * gap 就近：返回上一个已结束 clip（k=1）或下一个未开始 clip（k=0）（原版 fd）
 */
export function nearestGapClip(
  tracks: TimelineTrackRef[],
  tMs: number,
  hasPath: (id: string) => boolean,
  kind?: 'camera' | 'object' | 'anim',
  targetId?: string,
): { track: TimelineTrackRef; clip: TimelineClipRef; k: number } | null {
  let prevClip: TimelineClipRef | null = null
  let prevTrack: TimelineTrackRef | null = null
  let nextClip: TimelineClipRef | null = null
  let nextTrack: TimelineTrackRef | null = null

  for (const track of tracks) {
    if (track.muted) continue
    if (kind && track.kind !== kind) continue
    if (targetId !== undefined && track.targetId !== targetId) continue
    for (const clip of track.clips) {
      if (clip.enabled === false || !hasPath(clip.pathId)) continue
      const end = clip.start + clip.duration
      if (end <= tMs) {
        if (!prevClip || end > prevClip.start + prevClip.duration) {
          prevClip = clip
          prevTrack = track
        }
      } else if (clip.start > tMs) {
        if (!nextClip || clip.start < nextClip.start) {
          nextClip = clip
          nextTrack = track
        }
      }
    }
  }
  if (prevClip && prevTrack) return { track: prevTrack, clip: prevClip, k: 1 }
  if (nextClip && nextTrack) return { track: nextTrack, clip: nextClip, k: 0 }
  return null
}

/** 相机轨 gap 就近（原版 Xf）*/
export function nearestCameraGap(
  timeline: CamTimeline,
  tMs: number,
  hasPath: (id: string) => boolean,
): { track: TimelineTrackRef; clip: TimelineClipRef; k: number } | null {
  return timeline ? nearestGapClip(timeline.tracks, tMs, hasPath, 'camera') : null
}

export interface TargetClipHit {
  track: TimelineTrackRef
  clip: TimelineClipRef
  k: number
}

/**
 * per-target 轨道求值（原版 md）：每个 targetId 取活跃 clip；
 * 无活跃时用 gap 就近兜底。对象轨 kind='object'（Wf）、动作轨 kind='anim'（Qf）。
 */
export function clipsPerTarget(
  timeline: CamTimeline,
  tMs: number,
  kind: 'object' | 'anim',
  hasPath: (id: string) => boolean,
  out = new Map<string, TargetClipHit>(),
): Map<string, TargetClipHit> {
  out.clear()
  if (!timeline) return out

  // 第一轮：活跃 clip
  for (const track of timeline.tracks) {
    if (track.muted || track.kind !== kind || !track.targetId || out.has(track.targetId)) continue
    const hit = activeClipInTrack(track, tMs, hasPath)
    if (hit) out.set(track.targetId, { track, clip: hit.clip, k: hit.k })
  }
  // 第二轮：gap 兜底
  for (const track of timeline.tracks) {
    if (track.muted || track.kind !== kind || !track.targetId || out.has(track.targetId)) continue
    const hit = nearestGapClip(timeline.tracks, tMs, hasPath, kind, track.targetId)
    if (hit) out.set(track.targetId, hit)
  }
  return out
}

export const objectClipsAt = (
  timeline: CamTimeline,
  tMs: number,
  hasPath: (id: string) => boolean,
  hits?: Map<string, TargetClipHit>,
): Map<string, TargetClipHit> => clipsPerTarget(timeline, tMs, 'object', hasPath, hits)

export const animClipsAt = (
  timeline: CamTimeline,
  tMs: number,
  hasPath: (id: string) => boolean,
  hits?: Map<string, TargetClipHit>,
): Map<string, TargetClipHit> => clipsPerTarget(timeline, tMs, 'anim', hasPath, hits)

/** 时间轴总时长（原版 Gt）*/
export function timelineDurationMs(timeline: CamTimeline): number {
  if (!timeline) return 0
  let max = 0
  for (const track of timeline.tracks) {
    for (const clip of track.clips) {
      max = Math.max(max, clip.start + clip.duration)
    }
  }
  return max
}
