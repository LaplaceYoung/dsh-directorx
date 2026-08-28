import { axisSign, type Vec3 } from './toric';

export interface FramingCamera {
  id: string;
  position: Vec3;
  lookAt?: Vec3;
  fov?: number;
}

export interface FramingBody {
  id: string;
  kind: string;
  label?: string;
  pose?: string;
  position: Vec3;
  rotation: Vec3;
  uniformScale?: number;
}

export interface FramingIssue {
  code: string;
  severity: 'error' | 'warning';
  detail: string;
  ids: string[];
}

function wrapDeg(value: number): number {
  return ((value + 180) % 360 + 360) % 360 - 180;
}

function yawToward(from: Vec3, to: Vec3): number {
  return Math.atan2(to.x - from.x, to.z - from.z) * (180 / Math.PI);
}

function head(body: FramingBody): Vec3 {
  const h = 1.65 * (body.uniformScale ?? 1);
  return { x: body.position.x, y: body.position.y + h, z: body.position.z };
}

/** Approximate NDC Y of a world point in a look-at camera (1 = top of frame). */
export function ndcY(camera: FramingCamera, point: Vec3): number | null {
  if (!camera.lookAt) return null;
  const fx = camera.lookAt.x - camera.position.x;
  const fy = camera.lookAt.y - camera.position.y;
  const fz = camera.lookAt.z - camera.position.z;
  const fl = Math.hypot(fx, fy, fz) || 1;
  const fxx = fx / fl;
  const fyy = fy / fl;
  const fzz = fz / fl;
  let rx = fzz;
  let ry = 0;
  let rz = -fxx;
  let rl = Math.hypot(rx, ry, rz);
  if (rl < 1e-5) {
    rx = 1;
    ry = 0;
    rz = 0;
    rl = 1;
  } else {
    rx /= rl;
    rz /= rl;
  }
  const ux = ry * fzz - rz * fyy;
  const uy = rz * fxx - rx * fzz;
  const uz = rx * fyy - ry * fxx;
  const ul = Math.hypot(ux, uy, uz) || 1;
  const relX = point.x - camera.position.x;
  const relY = point.y - camera.position.y;
  const relZ = point.z - camera.position.z;
  const depth = relX * fxx + relY * fyy + relZ * fzz;
  if (depth < 0.05) return null;
  const up = (relX * ux + relY * uy + relZ * uz) / ul;
  const vfov = ((camera.fov ?? 40) * Math.PI) / 180;
  return up / (depth * Math.tan(vfov / 2));
}

export function framingIssues(bodies: FramingBody[], cameras: FramingCamera[] = []): FramingIssue[] {
  const issues: FramingIssue[] = [];
  const chars = bodies.filter((item) => item.kind === 'character');

  if (chars.length >= 2) {
    const a = chars[0];
    const b = chars[1];
    const wantA = yawToward(a.position, b.position);
    const wantB = yawToward(b.position, a.position);
    if (Math.abs(wrapDeg(a.rotation.y - wantA)) > 40) {
      issues.push({
        code: 'NOT_FACING',
        severity: 'warning',
        detail: `${a.id} eyeline misses ${b.id} (yaw ${a.rotation.y.toFixed(0)} vs ${wantA.toFixed(0)})`,
        ids: [a.id, b.id],
      });
    }
    if (Math.abs(wrapDeg(b.rotation.y - wantB)) > 40) {
      issues.push({
        code: 'NOT_FACING',
        severity: 'warning',
        detail: `${b.id} eyeline misses ${a.id}`,
        ids: [b.id, a.id],
      });
    }

    const signs = cameras
      .map((cam) => ({ id: cam.id, sign: axisSign(a.position, b.position, cam.position) }))
      .filter((item) => item.sign !== 0);
    if (signs.length >= 2) {
      const first = signs[0].sign;
      const crossed = signs.filter((item) => item.sign !== first);
      if (crossed.length) {
        issues.push({
          code: 'AXIS_CROSS',
          severity: 'warning',
          detail: `cameras ${crossed.map((item) => item.id.slice(0, 8)).join(', ')} sit on the other side of the ${a.id.slice(0, 8)}–${b.id.slice(0, 8)} line`,
          ids: [a.id, b.id, ...crossed.map((item) => item.id)],
        });
      }
    }
  }

  for (const cam of cameras) {
    for (const body of chars) {
      const y = ndcY(cam, head(body));
      if (y == null) continue;
      if (y > 0.92) {
        issues.push({
          code: 'NO_HEADROOM',
          severity: 'warning',
          detail: `${body.id} head clips the top of ${cam.id.slice(0, 8)} (ndcY ${y.toFixed(2)})`,
          ids: [cam.id, body.id],
        });
      }
    }
  }

  for (const body of chars) {
    const pose = (body.pose ?? 'stand').toLowerCase();
    const grounded = pose === 'sit' || pose === 'drive' || pose === 'lie' || pose === 'lie-down';
    if (!grounded && body.position.y > 0.08) {
      issues.push({
        code: 'FOOT_FLOAT',
        severity: 'warning',
        detail: `${body.id} stand/walk at y=${body.position.y} (feet should plant at y=0)`,
        ids: [body.id],
      });
    }
  }

  for (let i = 0; i < cameras.length; i += 1) {
    for (let j = i + 1; j < cameras.length; j += 1) {
      const left = cameras[i];
      const right = cameras[j];
      if (!left.lookAt || !right.lookAt) continue;
      const a = dir(left.position, left.lookAt);
      const b = dir(right.position, right.lookAt);
      if (!a || !b) continue;
      const angle = Math.acos(Math.min(1, Math.max(-1, a.x * b.x + a.y * b.y + a.z * b.z))) * (180 / Math.PI);
      if (angle > 0.8 && angle < 30) {
        issues.push({
          code: 'THIRTY_DEGREE',
          severity: 'warning',
          detail: `${left.id.slice(0, 8)} and ${right.id.slice(0, 8)} are ${angle.toFixed(1)}° apart (30° rule)`,
          ids: [left.id, right.id],
        });
      }
    }
  }

  return issues;
}

function dir(from: Vec3, to: Vec3): Vec3 | null {
  const x = to.x - from.x;
  const y = to.y - from.y;
  const z = to.z - from.z;
  const len = Math.hypot(x, y, z);
  if (len < 1e-5) return null;
  return { x: x / len, y: y / len, z: z / len };
}
