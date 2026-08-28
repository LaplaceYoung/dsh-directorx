/**
 * Campath 曲线引擎 — 完整对齐原版 bundle（index-Dp22JYcT.js）。
 *
 * 对应关系（minified → 本文件）：
 *   Tc → buildSegments      Dc → sampleCurve
 *   wr → piecewiseLerp      yr → EASING
 *   Wh → CameraCurve        Pc → createCameraCurve
 *   Nc=32 每段采样数         uo=6 手柄缩放
 *
 * 数据模型：控制点数组 CamPathPoint[]，每点含 position / in / out 手柄（相对偏移）、
 * tilt 侧倾、可选 fov / timeK / speed / tangentMode。closed 模式首尾相接。
 */

import * as THREE from 'three'
import type { EasingType } from '../types'

// ── 数据模型 ──

export interface Vec3Like {
  x: number
  y: number
  z: number
}

export interface CamPathPoint {
  position: Vec3Like
  /** 入手柄（相对 position 的偏移）*/
  in: Vec3Like
  /** 出手柄（相对 position 的偏移）*/
  out: Vec3Like
  /** 侧倾角（弧度，绕切线旋转 up）*/
  tilt: number
  /** 该点的 FOV 关键帧（可选）*/
  fov?: number
  /** 时间关键帧（0-1，严格递增；缺省按弧长均匀）*/
  timeK?: number
  /** 段速度乘数（默认 1）*/
  speed?: number
  /** 手柄模式：aligned 对称（默认）/ free 自由（Alt 拖拽切换）*/
  tangentMode?: 'aligned' | 'free'
}

export interface RecordedRotation {
  k: number
  q: [number, number, number, number]
}

export interface RecordedFov {
  k: number
  fov: number
}

export interface RecordedData {
  rot: RecordedRotation[]
  fov?: RecordedFov[]
}

/** 原版常量：每段采样 32 点（画线用）*/
export const SAMPLES_PER_SEG = 32
/** 手柄基础屏幕缩放（原版 uo）*/
export const HANDLE_SCALE = 6
/** 双击插点的屏幕像素距离阈值（原版 Za=12，比较时平方）*/
export const DBLCLICK_DIST_SQ = 12 * 12

// ── 向量工具 ──

export const toVec3 = (v: Vec3Like): THREE.Vector3 => new THREE.Vector3(v.x, v.y, v.z)
export const toPlain = (v: THREE.Vector3): Vec3Like => ({ x: v.x, y: v.y, z: v.z })

/** 深拷贝控制点数组（原版 vr）*/
export function clonePoints(points: CamPathPoint[]): CamPathPoint[] {
  return points.map(p => ({
    ...p,
    position: toPlain(toVec3(p.position)),
    in: toPlain(toVec3(p.in)),
    out: toPlain(toVec3(p.out)),
    tilt: p.tilt ?? 0,
  }))
}

// ── 缓动（原版 yr 表；easeInOut 为 cubic）──

export const EASING: Record<EasingType, (t: number) => number> = {
  linear: t => t,
  easeIn: t => t * t,
  easeOut: t => 1 - (1 - t) * (1 - t),
  easeInOut: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  smoothstep: t => t * t * (3 - 2 * t),
}

// ── 分段线性插值（原版 wr）──

export function piecewiseLerp(u: number, keys: number[], vals: number[]): number {
  const n = Math.min(keys.length, vals.length)
  if (n === 0) return 0
  if (n === 1 || u <= keys[0]) return vals[0]
  if (u >= keys[n - 1]) return vals[n - 1]
  for (let i = 0; i < n - 1; i++) {
    if (u <= keys[i + 1]) {
      const span = keys[i + 1] - keys[i]
      if (span < 1e-9) continue
      const local = (u - keys[i]) / span
      return vals[i] + local * (vals[i + 1] - vals[i])
    }
  }
  return vals[n - 1]
}

// ── 曲线构建（原版 Tc）──

/** 相邻控制点之间构建 CubicBezierCurve3；closed 时段数 = 点数 */
export function buildSegments(points: CamPathPoint[], closed: boolean): THREE.CubicBezierCurve3[] {
  const count = points.length
  const segs: THREE.CubicBezierCurve3[] = []
  if (count < 2) return segs
  const segCount = closed ? count : count - 1
  for (let i = 0; i < segCount; i++) {
    const cur = points[i]
    const next = points[(i + 1) % count]
    const p0 = toVec3(cur.position)
    const p3 = toVec3(next.position)
    const p1 = p0.clone().add(toVec3(cur.out))
    const p2 = p3.clone().add(toVec3(next.in))
    segs.push(new THREE.CubicBezierCurve3(p0, p1, p2, p3))
  }
  return segs
}

export interface CurveSample {
  seg: number
  t: number
  pos: THREE.Vector3
}

/** 均匀采样曲线用于画线（原版 Dc；每段 perSeg 点，closed 时首段从 0 开始）*/
export function sampleCurve(points: CamPathPoint[], perSeg = SAMPLES_PER_SEG, closed = false): CurveSample[] {
  const out: CurveSample[] = []
  const segs = buildSegments(points, closed)
  for (let s = 0; s < segs.length; s++) {
    const curve = segs[s]
    const start = s === 0 ? 0 : 1
    for (let l = start; l <= perSeg; l++) {
      const t = l / perSeg
      out.push({ seg: s, t, pos: curve.getPoint(t) })
    }
  }
  return out
}

// ── 求值器（原版 Wh）──

export class CameraCurve {
  private curve = new THREE.CurvePath<THREE.Vector3>()
  private single: THREE.Vector3 | null = null
  private segCount = 0
  private tilts: number[] = []
  /** 控制点的弧长参数（归一化）*/
  private pointUs: number[] = [0]
  /** 控制点的时间参数（归一化；timeK 或弧长均匀）*/
  private pointKs: number[] = [0]
  /** FOV 关键帧的弧长参数 */
  private fovUs: number[] = []
  private fovVals: number[] = []
  private frames: ReturnType<THREE.CurvePath<THREE.Vector3>['computeFrenetFrames']> | undefined

  constructor(points: CamPathPoint[], closed = false) {
    this.tilts = points.map(p => p.tilt ?? 0)

    if (points.length < 2) {
      this.single = points.length === 1 ? toVec3(points[0].position) : new THREE.Vector3()
      return
    }

    const segs = buildSegments(points, closed)
    for (const seg of segs) this.curve.add(seg)
    this.segCount = segs.length
    if (closed) this.tilts.push(points[0].tilt ?? 0)

    if (this.curve.getLength() < 1e-6) {
      this.single = toVec3(points[0].position)
      return
    }

    // 弧长参数：各段累积长度 / 总长（原版 getCurveLengths）
    const lengths = this.curve.getCurveLengths()
    const total = lengths[lengths.length - 1]
    this.pointUs = [0, ...lengths.map(l => l / total)]
    if (this.pointUs.length !== this.tilts.length) {
      // closed 时 CurvePath 首尾相接，末点 u=1 与首点重合
      while (this.pointUs.length < this.tilts.length) this.pointUs.push(1)
    }

    // 时间参数：优先用控制点显式 timeK（严格递增校验），否则按弧长均匀
    const ks = this.computeTimeKeys(points)
    this.pointKs = ks ?? [...this.pointUs]

    // FOV 关键帧
    const fovPts = points.filter(p => p.fov != null && Number.isFinite(p.fov))
    if (fovPts.length >= 2) {
      const fovKs = this.extractNormalizedKeys(fovPts.map(p => p.timeK))
      if (fovKs) {
        this.fovUs = fovKs.map(k => this.timeToURaw(k))
        this.fovVals = fovPts.map(p => p.fov as number)
      }
    } else if (fovPts.length === 1) {
      this.fovVals = [fovPts[0].fov as number]
    }
  }

  /** 原版：timeK 必须严格递增，归一化到 [0,1]；任一无效返回 null（退化为弧长均匀）*/
  private computeTimeKeys(points: CamPathPoint[]): number[] | null {
    if (points.some(p => p.timeK == null || !Number.isFinite(p.timeK))) return null
    const ks = points.map(p => p.timeK as number)
    for (let i = 1; i < ks.length; i++) {
      if (ks[i] <= ks[i - 1]) return null
    }
    const first = ks[0]
    const span = ks[ks.length - 1] - first
    if (span < 1e-9) return null
    return ks.map(k => (k - first) / span)
  }

  private extractNormalizedKeys(timeKs: (number | undefined)[]): number[] | null {
    if (timeKs.some(k => k == null || !Number.isFinite(k))) return null
    const ks = timeKs as number[]
    for (let i = 1; i < ks.length; i++) {
      if (ks[i] <= ks[i - 1]) return null
    }
    const first = ks[0]
    const span = ks[ks.length - 1] - first
    if (span < 1e-9) return null
    return ks.map(k => (k - first) / span)
  }

  private timeToURaw(t: number): number {
    if (this.single || this.pointKs.length < 2) return 0
    return piecewiseLerp(THREE.MathUtils.clamp(t, 0, 1), this.pointKs, this.pointUs)
  }

  get length(): number {
    return this.single ? 0 : this.curve.getLength()
  }

  /** 第 idx 个控制点的归一化时间（原版 pointTime）*/
  pointTime(idx: number): number {
    return this.pointKs[Math.min(Math.max(idx, 0), this.pointKs.length - 1)] ?? 0
  }

  /** 时间分数 → 弧长参数（原版 timeToU：wr(t, pointKs, pointUs)）*/
  timeToU(t: number): number {
    return this.timeToURaw(t)
  }

  /** FOV 关键帧插值（原版 fovAt）；无关键帧返回 null */
  fovAt(u: number): number | null {
    if (this.fovUs.length === 0) return null
    return piecewiseLerp(THREE.MathUtils.clamp(u, 0, 1), this.fovUs, this.fovVals)
  }

  positionAt(t: number): THREE.Vector3 {
    if (this.single) return this.single.clone()
    const u = THREE.MathUtils.clamp(t, 0, 1)
    return this.curve.getPointAt(u)
  }

  /** 相机帧：位置 + 切线 + up（含 tilt 旋转）（原版 frameAt）*/
  frameAt(t: number): { position: THREE.Vector3; tangent: THREE.Vector3; up: THREE.Vector3 } {
    if (this.single) {
      return { position: this.single.clone(), tangent: new THREE.Vector3(0, 0, -1), up: new THREE.Vector3(0, 1, 0) }
    }
    const u = THREE.MathUtils.clamp(t, 0, 1)
    const position = this.curve.getPointAt(u)
    const tangent = this.curve.getTangentAt(u).normalize()
    const up = this.upAt(u, tangent)
    const tilt = this.tiltAt(u)
    if (tilt !== 0) up.applyAxisAngle(tangent, tilt)
    return { position, tangent, up }
  }

  /** up 向量：Frenet binormal 优先，退化 normal，再退化世界 up 叉乘（原版 upAt）*/
  private upAt(u: number, tangent: THREE.Vector3): THREE.Vector3 {
    if (!this.frames) {
      try {
        this.frames = this.curve.computeFrenetFrames(Math.max(8, this.segCount * 12), false)
      } catch {
        this.frames = undefined
      }
    }
    if (this.frames && this.frames.normals.length > 0) {
      const last = this.frames.normals.length - 1
      const idx = Math.min(Math.round(THREE.MathUtils.clamp(u, 0, 1) * last), last)
      const binormal = this.frames.binormals[idx]
      const normal = this.frames.normals[idx]
      if (binormal && binormal.lengthSq() > 1e-6) return binormal.clone().normalize()
      if (normal && normal.lengthSq() > 1e-6) return normal.clone().normalize()
    }
    const worldUp = new THREE.Vector3(0, 1, 0)
    const side = new THREE.Vector3().crossVectors(tangent, worldUp)
    if (side.lengthSq() < 1e-6) return new THREE.Vector3(0, 0, 1)
    return new THREE.Vector3().crossVectors(side.normalize(), tangent).normalize()
  }

  /** 侧倾插值（原版 tiltAt）*/
  private tiltAt(u: number): number {
    if (this.tilts.length < 2) return this.tilts[0] ?? 0
    if (this.pointUs.length !== this.tilts.length) {
      const last = this.tilts.length - 1
      const x = THREE.MathUtils.clamp(u, 0, 1) * last
      const i = Math.min(Math.floor(x), last - 1)
      const frac = x - i
      return this.tilts[i] * (1 - frac) + this.tilts[i + 1] * frac
    }
    return piecewiseLerp(THREE.MathUtils.clamp(u, 0, 1), this.pointUs, this.tilts)
  }

  /** 预览线采样（原版 sampleLine，默认 120 点）*/
  sampleLine(count = 120): THREE.Vector3[] {
    if (this.single) return [this.single.clone(), this.single.clone()]
    return this.curve.getSpacedPoints(count)
  }
}

/** 工厂（原版 Pc）*/
export function createCameraCurve(points: CamPathPoint[], closed = false): CameraCurve {
  return new CameraCurve(points, closed)
}
