import type { Vec3 } from '../types'

export type Quat = [number, number, number, number]

const Y_UP: Vec3 = { x: 0, y: 1, z: 0 }

function add(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }
}

function scale(v: Vec3, s: number): Vec3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s }
}

function hypot3(v: Vec3): number {
  return Math.hypot(v.x, v.y, v.z)
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  }
}

function normalize(v: Vec3, fallback: Vec3 = { x: 0, y: 0, z: 1 }): Vec3 {
  const len = hypot3(v)
  return len < 1e-8 ? { ...fallback } : scale(v, 1 / len)
}

/** Rotate `v` around unit axis `k` by radians (Rodrigues). */
function rotateAround(v: Vec3, k: Vec3, rad: number): Vec3 {
  const c = Math.cos(rad)
  const s = Math.sin(rad)
  const d = v.x * k.x + v.y * k.y + v.z * k.z
  return add(add(scale(v, c), scale(cross(k, v), s)), scale(k, d * (1 - c)))
}

function quatFromMatrix(m00: number, m01: number, m02: number, m10: number, m11: number, m12: number, m20: number, m21: number, m22: number): Quat {
  const trace = m00 + m11 + m22
  if (trace > 0) {
    const s = 0.5 / Math.sqrt(trace + 1)
    return [(m21 - m12) * s, (m02 - m20) * s, (m10 - m01) * s, 0.25 / s]
  }
  if (m00 > m11 && m00 > m22) {
    const s = 2 * Math.sqrt(1 + m00 - m11 - m22)
    return [0.25 * s, (m01 + m10) / s, (m02 + m20) / s, (m21 - m12) / s]
  }
  if (m11 > m22) {
    const s = 2 * Math.sqrt(1 + m11 - m00 - m22)
    return [(m01 + m10) / s, 0.25 * s, (m12 + m21) / s, (m02 - m20) / s]
  }
  const s = 2 * Math.sqrt(1 + m22 - m00 - m11)
  return [(m02 + m20) / s, (m12 + m21) / s, 0.25 * s, (m10 - m01) / s]
}

/**
 * Camera lookAt quaternion (Three.js convention: camera looks down −Z).
 * Same construction as Matrix4.lookAt(eye, target, up) → Quaternion.setFromRotationMatrix.
 */
export function lookAtQuat(eye: Vec3, target: Vec3, up: Vec3 = Y_UP): Quat {
  let z = sub(eye, target)
  if (hypot3(z) < 1e-8) z = { x: 0, y: 0, z: 1 }
  z = normalize(z)
  let x = cross(up, z)
  if (hypot3(x) < 1e-8) {
    z = normalize({ x: z.x + (Math.abs(up.z) === 1 ? 0.0001 : 0), y: z.y, z: z.z + (Math.abs(up.z) === 1 ? 0 : 0.0001) })
    x = cross(up, z)
  }
  x = normalize(x)
  const y = cross(z, x)
  return quatFromMatrix(x.x, y.x, z.x, x.y, y.y, z.y, x.z, y.z, z.z)
}

/** Pan: rotate the look point around the camera's world Y. Left = CCW from above (screen-left when facing −Z). */
export function panLookAt(eye: Vec3, look: Vec3, yawDeg: number): Vec3 {
  const offset = sub(look, eye)
  const rad = (yawDeg * Math.PI) / 180
  const c = Math.cos(rad)
  const s = Math.sin(rad)
  return add(eye, {
    x: offset.x * c + offset.z * s,
    y: offset.y,
    z: -offset.x * s + offset.z * c,
  })
}

/** Tilt: rotate the look point around the camera's right axis. Up raises the aim. */
export function tiltLookAt(eye: Vec3, look: Vec3, pitchDeg: number): Vec3 {
  const offset = sub(look, eye)
  const forward = normalize(offset, { x: 0, y: 0, z: -1 })
  let right = cross(forward, Y_UP)
  if (hypot3(right) < 1e-8) right = { x: 1, y: 0, z: 0 }
  right = normalize(right)
  return add(eye, rotateAround(offset, right, (pitchDeg * Math.PI) / 180))
}

/**
 * Hitchcock / Vertigo FOV: keep subject angular size while the camera moves.
 * endFov = 2 * atan(tan(startFov/2) * startDist / endDist), clamped 10–120.
 */
export function dollyZoomFov(startFovDeg: number, startDist: number, endDist: number): number {
  const start = Math.max(0.05, startDist)
  const end = Math.max(0.05, endDist)
  const half = (startFovDeg * Math.PI) / 360
  const fov = (2 * Math.atan(Math.tan(half) * (start / end)) * 180) / Math.PI
  return Math.min(120, Math.max(10, fov))
}

/**
 * Jib / boom: move the camera on a vertical-plane arc that keeps distance to the look point.
 * `metres` is arc length. `up` raises the camera.
 */
export function jibEnd(cam: Vec3, look: Vec3, metres: number, dir: 'up' | 'down'): Vec3 {
  const offset = sub(cam, look)
  const dist = Math.max(0.05, hypot3(offset))
  const horiz = Math.hypot(offset.x, offset.z)
  const pitch = Math.atan2(offset.y, horiz)
  const yaw = Math.atan2(offset.x, offset.z)
  const arc = metres / dist
  const nextPitch = pitch + (dir === 'up' ? arc : -arc)
  const clamped = Math.min(1.45, Math.max(-0.6, nextPitch))
  const nextHoriz = dist * Math.cos(clamped)
  return {
    x: look.x + Math.sin(yaw) * nextHoriz,
    y: Math.max(0.02, look.y + dist * Math.sin(clamped)),
    z: look.z + Math.cos(yaw) * nextHoriz,
  }
}

export function zoomEndFov(startFov: number, direction: 'in' | 'out', deltaDeg: number): number {
  const next = direction === 'in' ? startFov - deltaDeg : startFov + deltaDeg
  return Math.min(120, Math.max(10, next))
}

export function rollEndTilt(startTiltRad: number, direction: 'left' | 'right', degrees: number): number {
  const delta = (degrees * Math.PI) / 180
  return startTiltRad + (direction === 'left' ? -delta : delta)
}
