/**
 * Two-subject camera manifold (CineSpace / Toric-inspired).
 * (distance, yaw, pitch, bias) → world pose that keeps A and B framed.
 */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface CineSpaceParams {
  distance: number;
  yawDeg: number;
  pitchDeg: number;
  /** 0 = at A, 1 = at B, 0.5 = midpoint. */
  bias?: number;
}

export interface CameraPose {
  position: Vec3;
  lookAt: Vec3;
}

function round(v: number): number {
  return Math.round(v * 1000) / 1000;
}

function pack(v: Vec3): Vec3 {
  return { x: round(v.x), y: round(v.y), z: round(v.z) };
}

export function aimPoint(position: Vec3, kind?: string, uniformScale = 1): Vec3 {
  const lift = kind === 'character' ? 1.12 : 0.45;
  return { x: position.x, y: position.y + lift * uniformScale, z: position.z };
}

/**
 * Camera on a sphere around the biased A–B centre.
 * yaw 0 is perpendicular to A→B (classic two-shot); positive yaw rotates toward A's back.
 */
export function cineSpace(a: Vec3, b: Vec3, params: CineSpaceParams): CameraPose {
  const bias = params.bias ?? 0.5;
  const lookAt = {
    x: a.x * (1 - bias) + b.x * bias,
    y: a.y * (1 - bias) + b.y * bias,
    z: a.z * (1 - bias) + b.z * bias,
  };
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len = Math.hypot(dx, dz) || 1;
  const alongX = dx / len;
  const alongZ = dz / len;
  const rightX = alongZ;
  const rightZ = -alongX;
  const yaw = (params.yawDeg * Math.PI) / 180;
  const pitch = (params.pitchDeg * Math.PI) / 180;
  const horizX = rightX * Math.cos(yaw) + alongX * Math.sin(yaw);
  const horizZ = rightZ * Math.cos(yaw) + alongZ * Math.sin(yaw);
  const dist = Math.max(0.4, params.distance);
  const position = {
    x: lookAt.x + horizX * dist * Math.cos(pitch),
    y: lookAt.y + dist * Math.sin(pitch),
    z: lookAt.z + horizZ * dist * Math.cos(pitch),
  };
  return { position: pack(position), lookAt: pack(lookAt) };
}

/** Over-shoulder of `near`, looking at `far`. Both cameras of a pair should share `side`. */
export function overShoulder(near: Vec3, far: Vec3, side: 1 | -1 = 1): CameraPose {
  const dx = far.x - near.x;
  const dz = far.z - near.z;
  const len = Math.hypot(dx, dz) || 1;
  const fx = dx / len;
  const fz = dz / len;
  const rx = fz * side;
  const rz = -fx * side;
  return {
    position: pack({
      x: near.x - fx * 0.55 + rx * 0.38,
      y: near.y + 0.12,
      z: near.z - fz * 0.55 + rz * 0.38,
    }),
    lookAt: pack(far),
  };
}

/** Which side of A–B the camera sits on. Same sign = respects the 180° line. */
export function axisSign(a: Vec3, b: Vec3, camera: Vec3): number {
  const abx = b.x - a.x;
  const abz = b.z - a.z;
  const acx = camera.x - a.x;
  const acz = camera.z - a.z;
  const cross = abx * acz - abz * acx;
  if (Math.abs(cross) < 1e-4) return 0;
  return cross > 0 ? 1 : -1;
}
