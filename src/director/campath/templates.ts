/**
 * Campath 运镜模板 — 原版内置 9 种一键运镜（bundle 数组 Qi）+ 全部辅助函数。
 *
 * 对应关系：Qi → CAM_PATH_TEMPLATES、Ad → bezierCircleFactor、zr → dirAngle、
 * Md → circlePoint、jl → arcPoints、ts → linePoints、Li → autoHandles、
 * Sl → dollyRange、Tl → craneRange、rn → lookAtSuffix。
 *
 * 模板入参（原版统一形状）：{ center, radius, height, startDir, targetId? }。
 */

import { dollyZoomFov, jibEnd, lookAtQuat, panLookAt, tiltLookAt } from '../optics/motions'
import type { CamPathPoint, Vec3Like } from './curve-engine'
import { LOOKAT_NONE, type CamPath } from './player'

export interface TemplateOptions {
  /** 环绕中心 */
  center: Vec3Like
  /** 环绕半径（米）*/
  radius: number
  /** 相机高度（米）*/
  height: number
  /** 起始方向（从 center 指向相机的水平方向）*/
  startDir: Vec3Like
  /** 可选 lookAt 目标对象 id */
  targetId?: string
}

interface TemplateResult {
  points: CamPathPoint[]
  closed?: boolean
  loopMode?: 'once' | 'loop' | 'pingpong'
  duration?: number
  easing?: CamPath['easing']
  lookAtTarget?: string
  lookAt?: { x: number; y: number; z: number }
  recorded?: CamPath['recorded']
}

// ── 辅助函数 ──

/**
 * 圆弧 cubic bezier 手柄长度系数（原版 Ad）：
 * 单段圆心角为 θ 时手柄长 = r · (4/3)·tan(θ/4)，此处入参 n = 2π/θ。
 * 标准圆弧贝塞尔近似常数。
 */
export const bezierCircleFactor = (n: number): number => (4 / 3) * Math.tan(Math.PI / (2 * n))

/** 方向向量 → 水平角（原版 zr：atan2(x, z)）*/
export const dirAngle = (dir: Vec3Like): number => Math.atan2(dir.x, dir.z)

/** 圆上点 + 切线（原版 Md）：pos = center + (sin a, 0, cos a)·r；tan = (cos a, 0, -sin a) */
export function circlePoint(
  center: Vec3Like,
  radius: number,
  angle: number,
  height: number,
): { pos: Vec3Like; tan: Vec3Like } {
  return {
    pos: {
      x: center.x + Math.sin(angle) * radius,
      y: height,
      z: center.z + Math.cos(angle) * radius,
    },
    tan: { x: Math.cos(angle), y: 0, z: -Math.sin(angle) },
  }
}

/**
 * 圆弧控制点（原版 jl）：numPoints 个点沿 [angleFrom, angleTo] 均匀分布，
 * in/out 手柄沿切线方向、长度 = radius · bezierCircleFactor(2π/段角)，closed 时首尾相接。
 */
export function arcPoints(
  center: Vec3Like,
  radius: number,
  angleFrom: number,
  angleTo: number,
  numPoints: number,
  height: number,
  closed = false,
): CamPathPoint[] {
  const sweep = angleTo - angleFrom
  const segs = closed ? numPoints : numPoints - 1
  const stepAngle = sweep / segs
  const handleLen = radius * bezierCircleFactor((2 * Math.PI) / Math.abs(stepAngle))
  const pts: CamPathPoint[] = []
  for (let i = 0; i < numPoints; i++) {
    const { pos, tan } = circlePoint(center, radius, angleFrom + stepAngle * i, height)
    const sign = Math.sign(stepAngle) || 1
    pts.push({
      position: pos,
      out: { x: tan.x * handleLen * sign, y: 0, z: tan.z * handleLen * sign },
      in: { x: -tan.x * handleLen * sign, y: 0, z: -tan.z * handleLen * sign },
      tilt: 0,
    })
  }
  return pts
}

/** 直线均匀分点 → 自动手柄控制点（原版 ts + Li）*/
export function linePoints(from: Vec3Like, to: Vec3Like, numPoints: number): CamPathPoint[] {
  const step = {
    x: (to.x - from.x) / (numPoints - 1),
    y: (to.y - from.y) / (numPoints - 1),
    z: (to.z - from.z) / (numPoints - 1),
  }
  const raw: Vec3Like[] = []
  for (let i = 0; i < numPoints; i++) {
    raw.push({ x: from.x + step.x * i, y: from.y + step.y * i, z: from.z + step.z * i })
  }
  return autoHandles(raw)
}

/**
 * Catmull-Rom 风格自动手柄（原版 Li）：
 * out = 邻点差分 × (端点 1/3 / 内部 1/6)，in = -out。
 */
export function autoHandles(points: Vec3Like[]): CamPathPoint[] {
  const n = points.length
  return points.map((p, i) => {
    const prev = points[Math.max(0, i - 1)]
    const next = points[Math.min(n - 1, i + 1)]
    const scale = i === 0 || i === n - 1 ? 1 / 3 : 1 / 6
    const handle = {
      x: (next.x - prev.x) * scale,
      y: (next.y - prev.y) * scale,
      z: (next.z - prev.z) * scale,
    }
    return {
      position: { x: p.x, y: p.y, z: p.z },
      out: handle,
      in: { x: -handle.x, y: -handle.y, z: -handle.z },
      tilt: 0,
    }
  })
}

/** dolly 的 near/far 点（原版 Sl）*/
export function dollyRange(o: TemplateOptions): { near: Vec3Like; far: Vec3Like } {
  const dir = o.startDir
  const nearDist = Math.max(1, o.radius * 0.35)
  return {
    near: {
      x: o.center.x + dir.x * nearDist,
      y: Math.max(0.8, o.height * 0.7),
      z: o.center.z + dir.z * nearDist,
    },
    far: { x: o.center.x + dir.x * o.radius, y: o.height, z: o.center.z + dir.z * o.radius },
  }
}

/** crane 的 lo/hi 点（原版 Tl）*/
export function craneRange(o: TemplateOptions): { lo: Vec3Like; hi: Vec3Like } {
  const dir = o.startDir
  const r = o.radius
  return {
    lo: {
      x: o.center.x + dir.x * r * 0.7,
      y: Math.max(0.8, o.center.y + 0.8),
      z: o.center.z + dir.z * r * 0.7,
    },
    hi: {
      x: o.center.x + dir.x * r * 1.1,
      y: o.center.y + Math.max(3, r * 0.9),
      z: o.center.z + dir.z * r * 1.1,
    },
  }
}

/** lookAt 通用后缀（原版 rn）：有 targetId 用对象，否则看 center + y1.2 */
export function lookAtSuffix(o: TemplateOptions): Pick<TemplateResult, 'lookAtTarget' | 'lookAt'> {
  if (o.targetId) return { lookAtTarget: o.targetId }
  return {
    lookAtTarget: LOOKAT_NONE,
    lookAt: { x: o.center.x, y: o.center.y + 1.2, z: o.center.z },
  }
}

// ── 内置模板（原版 Qi，9 个）──

export type CamPathTemplateId =
  | 'orbit'
  | 'arc'
  | 'dolly_in'
  | 'dolly_out'
  | 'dolly_zoom'
  | 'crane_up'
  | 'crane_down'
  | 'truck'
  | 'spiral'
  | 'pan'
  | 'tilt'
  | 'zoom_in'
  | 'zoom_out'
  | 'jib_up'
  | 'jib_down'
  | 'pedestal'
  | 'roll'
  | 'whip'
  | 'follow'
  | 'tracking'
  | 'hero_reveal'
  | 'punch_in'

export interface CamPathTemplate {
  id: CamPathTemplateId
  build(o: TemplateOptions): TemplateResult
}

export const CAM_PATH_TEMPLATES: CamPathTemplate[] = [
  {
    id: 'orbit',
    // 全圆 4 点闭环，循环播放 8s
    build(o) {
      const start = dirAngle(o.startDir)
      return {
        points: arcPoints(o.center, o.radius, start, start + Math.PI * 2, 4, o.height, true),
        closed: true,
        loopMode: 'loop',
        duration: 8000,
        ...lookAtSuffix(o),
      }
    },
  },
  {
    id: 'arc',
    // 半圆弧 3 点（-90° → +90°）
    build(o) {
      const start = dirAngle(o.startDir)
      return {
        points: arcPoints(o.center, o.radius, start - Math.PI / 2, start + Math.PI / 2, 3, o.height),
        easing: 'easeInOut',
        ...lookAtSuffix(o),
      }
    },
  },
  {
    id: 'dolly_in',
    build(o) {
      const { near, far } = dollyRange(o)
      return { points: linePoints(far, near, 2), easing: 'easeInOut', ...lookAtSuffix(o) }
    },
  },
  {
    id: 'dolly_out',
    build(o) {
      const { near, far } = dollyRange(o)
      return { points: linePoints(near, far, 2), easing: 'easeInOut', ...lookAtSuffix(o) }
    },
  },
  {
    id: 'dolly_zoom',
    // 推近 + FOV 补偿（希区柯克变焦）：远点 32°，近点 FOV 按距离比放大，clamp 10-110
    build(o) {
      const dir = o.startDir
      const nearDist = Math.max(1, o.radius * 0.4)
      const farPoint = {
        x: o.center.x + dir.x * o.radius,
        y: o.height,
        z: o.center.z + dir.z * o.radius,
      }
      const nearPoint = {
        x: o.center.x + dir.x * nearDist,
        y: o.height,
        z: o.center.z + dir.z * nearDist,
      }
      const lookPoint = { x: o.center.x, y: o.center.y + 1.2, z: o.center.z }
      const dist = (p: Vec3Like): number => Math.hypot(p.x - lookPoint.x, p.y - lookPoint.y, p.z - lookPoint.z)
      const baseFov = 32
      const endFov = dollyZoomFov(baseFov, dist(farPoint), dist(nearPoint))
      const pts = linePoints(farPoint, nearPoint, 2)
      pts[0].fov = baseFov
      pts[pts.length - 1].fov = endFov
      return { points: pts, easing: 'easeInOut', duration: 6000, ...lookAtSuffix(o) }
    },
  },
  {
    id: 'crane_up',
    build(o) {
      const { lo, hi } = craneRange(o)
      return { points: linePoints(lo, hi, 3), easing: 'easeInOut', ...lookAtSuffix(o) }
    },
  },
  {
    id: 'crane_down',
    build(o) {
      const { lo, hi } = craneRange(o)
      return { points: linePoints(hi, lo, 3), easing: 'easeInOut', ...lookAtSuffix(o) }
    },
  },
  {
    id: 'truck',
    // 侧向平移：垂直于视线方向，宽 = 1.2r，3 点
    build(o) {
      const dir = o.startDir
      const side = { x: -dir.z, z: dir.x }
      const width = o.radius * 1.2
      const mid = {
        x: o.center.x + dir.x * o.radius,
        y: o.height,
        z: o.center.z + dir.z * o.radius,
      }
      const from = { x: mid.x - (side.x * width) / 2, y: o.height, z: mid.z - (side.z * width) / 2 }
      const to = { x: mid.x + (side.x * width) / 2, y: o.height, z: mid.z + (side.z * width) / 2 }
      return { points: linePoints(from, to, 3), ...lookAtSuffix(o) }
    },
  },
  {
    id: 'spiral',
    // 8 点螺旋上升：半径收缩到 0.7r，高度上升 r，总角度 3π，10s
    build(o) {
      const start = dirAngle(o.startDir)
      const count = 8
      const angleStep = (Math.PI * 3) / (count - 1)
      const radiusStep = o.radius / (count - 1)
      const pts: CamPathPoint[] = []
      for (let i = 0; i < count; i++) {
        const t = i / (count - 1)
        const radius = o.radius * (1 - 0.3 * t)
        const height = o.height + o.radius * t
        const { pos, tan } = circlePoint(o.center, radius, start + angleStep * i, height)
        const handleLen = radius * bezierCircleFactor((2 * Math.PI) / angleStep)
        pts.push({
          position: pos,
          out: { x: tan.x * handleLen, y: radiusStep / 3, z: tan.z * handleLen },
          in: { x: -tan.x * handleLen, y: -radiusStep / 3, z: -tan.z * handleLen },
          tilt: 0,
        })
      }
      return { points: pts, duration: 10000, easing: 'easeInOut', ...lookAtSuffix(o) }
    },
  },
  {
    id: 'pan',
    build(o) {
      const cam = station(o)
      const look0 = aim(o)
      const look1 = panLookAt(cam, look0, 30)
      const pts = linePoints(cam, nudge(cam), 2)
      return { points: pts, duration: 2500, easing: 'easeInOut', recorded: lookPair(cam, look0, cam, look1) }
    },
  },
  {
    id: 'tilt',
    build(o) {
      const cam = station(o)
      const look0 = aim(o)
      const look1 = tiltLookAt(cam, look0, 18)
      const pts = linePoints(cam, nudge(cam), 2)
      return { points: pts, duration: 2200, easing: 'easeInOut', recorded: lookPair(cam, look0, cam, look1) }
    },
  },
  {
    id: 'zoom_in',
    build(o) {
      const cam = station(o)
      const pts = linePoints(cam, nudge(cam), 2)
      pts[0].fov = 48
      pts[pts.length - 1].fov = 28
      return { points: pts, duration: 2500, easing: 'easeInOut', ...lookAtSuffix(o) }
    },
  },
  {
    id: 'zoom_out',
    build(o) {
      const cam = station(o)
      const pts = linePoints(cam, nudge(cam), 2)
      pts[0].fov = 32
      pts[pts.length - 1].fov = 55
      return { points: pts, duration: 2500, easing: 'easeInOut', ...lookAtSuffix(o) }
    },
  },
  {
    id: 'jib_up',
    build(o) {
      const cam = station(o)
      const look = aim(o)
      const end = jibEnd(cam, look, Math.max(1.2, o.radius * 0.45), 'up')
      return { points: linePoints(cam, end, 3), easing: 'easeInOut', ...lookAtSuffix(o) }
    },
  },
  {
    id: 'jib_down',
    build(o) {
      const cam = station(o)
      const look = aim(o)
      const end = jibEnd(cam, look, Math.max(1.2, o.radius * 0.45), 'down')
      return { points: linePoints(cam, end, 3), easing: 'easeInOut', ...lookAtSuffix(o) }
    },
  },
  {
    id: 'pedestal',
    build(o) {
      const cam = station(o)
      const hi = { x: cam.x, y: cam.y + Math.max(1.4, o.radius * 0.4), z: cam.z }
      return { points: linePoints(cam, hi, 2), easing: 'easeInOut', ...lookAtSuffix(o) }
    },
  },
  {
    id: 'roll',
    build(o) {
      const cam = station(o)
      const pts = linePoints(cam, nudge(cam), 2)
      pts[0].tilt = 0
      pts[pts.length - 1].tilt = (12 * Math.PI) / 180
      return { points: pts, duration: 2000, easing: 'easeInOut', ...lookAtSuffix(o) }
    },
  },
  {
    id: 'whip',
    build(o) {
      const cam = station(o)
      const look0 = aim(o)
      const look1 = panLookAt(cam, look0, 70)
      const pts = linePoints(cam, nudge(cam), 2)
      return { points: pts, duration: 400, easing: 'easeIn', recorded: lookPair(cam, look0, cam, look1) }
    },
  },
  {
    id: 'follow',
    build(o) {
      const { near, far } = dollyRange(o)
      return { points: linePoints(far, near, 3), duration: 4000, easing: 'easeInOut', ...lookAtSuffix(o) }
    },
  },
  {
    id: 'tracking',
    build(o) {
      const right = { x: o.startDir.z, y: 0, z: -o.startDir.x }
      const a = {
        x: o.center.x + right.x * o.radius,
        y: o.height,
        z: o.center.z + right.z * o.radius,
      }
      const b = {
        x: o.center.x - right.x * o.radius,
        y: o.height,
        z: o.center.z - right.z * o.radius,
      }
      return { points: linePoints(a, b, 3), duration: 4000, easing: 'easeInOut', ...lookAtSuffix(o) }
    },
  },
  {
    id: 'hero_reveal',
    build(o) {
      const dir = o.startDir
      const far = {
        x: o.center.x + dir.x * o.radius * 1.2,
        y: Math.max(0.4, o.height * 0.4),
        z: o.center.z + dir.z * o.radius * 1.2,
      }
      const near = {
        x: o.center.x + dir.x * o.radius * 0.65,
        y: o.height + 1.1,
        z: o.center.z + dir.z * o.radius * 0.65,
      }
      return { points: linePoints(far, near, 3), duration: 5000, easing: 'easeInOut', ...lookAtSuffix(o) }
    },
  },
  {
    id: 'punch_in',
    build(o) {
      const cam = station(o)
      const pts = linePoints(cam, nudge(cam), 2)
      pts[0].fov = 46
      pts[pts.length - 1].fov = 32
      return { points: pts, duration: 800, easing: 'easeIn', ...lookAtSuffix(o) }
    },
  },
]

function station(o: TemplateOptions): Vec3Like {
  return {
    x: o.center.x + o.startDir.x * o.radius,
    y: o.height,
    z: o.center.z + o.startDir.z * o.radius,
  }
}

function aim(o: TemplateOptions): Vec3Like {
  return { x: o.center.x, y: o.center.y + 1.2, z: o.center.z }
}

function nudge(p: Vec3Like): Vec3Like {
  return { x: p.x + 0.02, y: p.y, z: p.z }
}

function lookPair(aEye: Vec3Like, aLook: Vec3Like, bEye: Vec3Like, bLook: Vec3Like): NonNullable<CamPath['recorded']> {
  return {
    rot: [
      { k: 0, q: lookAtQuat(aEye, aLook) },
      { k: 1, q: lookAtQuat(bEye, bLook) },
    ],
  }
}

/** 按 id 构建运镜路径 */
export function buildTemplatePath(
  id: CamPathTemplateId,
  options: TemplateOptions,
  pathId: string,
): CamPath {
  const tpl = CAM_PATH_TEMPLATES.find(t => t.id === id)
  if (!tpl) throw new Error(`unknown campath template: ${id}`)
  const result = tpl.build(options)
  return {
    id: pathId,
    label: id,
    points: result.points,
    closed: result.closed,
    loopMode: result.loopMode,
    duration: result.duration ?? 5000,
    easing: result.easing,
    lookAtTarget: result.lookAtTarget,
    lookAt: result.lookAt,
    recorded: result.recorded,
  }
}
