/**
 * Relation layout solver (Holodeck / LayoutGPT style).
 * Agents emit named relations; this module writes metre/degree transforms.
 */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface LayoutBody {
  id: string;
  kind: string;
  label?: string;
  pose?: string;
  assetId?: string;
  position: Vec3;
  rotation: Vec3;
  uniformScale?: number;
}

export type LayoutRelation =
  | { rel: 'face'; a: string; b: string }
  | { rel: 'sit_on'; a: string; b: string }
  | { rel: 'distance'; a: string; b: string; min?: number; max?: number }
  | { rel: 'near'; a: string; b: string }
  | { rel: 'in_front_of'; a: string; b: string }
  | { rel: 'side_of'; a: string; b: string }
  | { rel: 'on_ground'; a: string };

export interface LayoutOp {
  type: 'set_transform' | 'set_pose';
  id: string;
  position?: Vec3;
  rotationY?: number;
  pose?: string;
}

export interface LayoutResult {
  operations: LayoutOp[];
  satisfied: Array<{ rel: string; a: string; b?: string }>;
  unsatisfied: Array<{ rel: string; a: string; b?: string; detail: string }>;
  partial: boolean;
}

const SEAT_Y: Record<string, number> = {
  chair: 0.45,
  stool: 0.45,
  armchair: 0.42,
  sofa: 0.4,
  bench: 0.48,
  car: 0.8,
};

function copy(v: Vec3): Vec3 {
  return { x: v.x, y: v.y, z: v.z };
}

function xzDist(a: Vec3, b: Vec3): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function yawToward(from: Vec3, to: Vec3): number {
  return Math.atan2(to.x - from.x, to.z - from.z) * (180 / Math.PI);
}

function wrapDeg(value: number): number {
  const wrapped = ((value + 180) % 360 + 360) % 360 - 180;
  return Math.round(wrapped * 1000) / 1000;
}

function angleDelta(a: number, b: number): number {
  return Math.abs(wrapDeg(a - b));
}

function forward(rotationY: number): { x: number; z: number } {
  const rad = (rotationY * Math.PI) / 180;
  return { x: Math.sin(rad), z: Math.cos(rad) };
}

export function findBody(bodies: LayoutBody[], token: string): LayoutBody | undefined {
  const exact = bodies.find((item) => item.id === token);
  if (exact) return exact;
  const prefix = bodies.filter((item) => item.id.startsWith(token) || item.label === token);
  return prefix.length === 1 ? prefix[0] : undefined;
}

function seatHeight(seat: LayoutBody): number {
  const scale = seat.uniformScale ?? 1;
  const key = (seat.assetId ?? seat.label ?? '').toLowerCase();
  for (const [id, height] of Object.entries(SEAT_Y)) {
    if (key.includes(id)) return height * scale;
  }
  return 0.45 * scale;
}

export function parseBlockingDsl(source: string): LayoutRelation[] {
  const edges: LayoutRelation[] = [];
  for (const raw of source.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || /^blocking\b/i.test(line)) continue;
    const distance = /^(\S+)\s+distance\s+(\S+)\s+([\d.]+)(?:\s+([\d.]+))?$/i.exec(line);
    if (distance) {
      const min = Number(distance[3]);
      const max = distance[4] ? Number(distance[4]) : min;
      edges.push({ rel: 'distance', a: distance[1], b: distance[2], min, max });
      continue;
    }
    const pair = /^(\S+)\s+(face|sit_on|near|in_front_of|side_of)\s+(\S+)$/i.exec(line);
    if (pair) {
      edges.push({ rel: pair[2].toLowerCase() as 'face', a: pair[1], b: pair[3] });
      continue;
    }
    const ground = /^(\S+)\s+on_ground$/i.exec(line);
    if (ground) edges.push({ rel: 'on_ground', a: ground[1] });
  }
  return edges;
}

function resolveEdge(bodies: LayoutBody[], edge: LayoutRelation): { a: LayoutBody; b?: LayoutBody } | { error: string } {
  const a = findBody(bodies, edge.a);
  if (!a) return { error: `unknown id ${edge.a}` };
  if (!('b' in edge)) return { a };
  const b = findBody(bodies, edge.b);
  if (!b) return { error: `unknown id ${edge.b}` };
  return { a, b };
}

export function bodiesFromScene(state: {
  characters?: Array<LayoutBody & { rotation?: Vec3 }>;
  props?: Array<LayoutBody & { rotation?: Vec3 }>;
  models?: LayoutBody[];
  codeModels?: LayoutBody[];
}): LayoutBody[] {
  const pack = (items: LayoutBody[] | undefined, kind: string) =>
    (items ?? []).map((item) => ({
      ...item,
      kind: item.kind ?? kind,
      position: copy(item.position),
      rotation: copy(item.rotation ?? { x: 0, y: 0, z: 0 }),
    }));
  return [
    ...pack(state.characters, 'character'),
    ...pack(state.props, 'prop'),
    ...pack(state.models, 'model'),
    ...pack(state.codeModels, 'codeModel'),
  ];
}

export function evaluateRelations(bodies: LayoutBody[], edges: LayoutRelation[]): LayoutResult['unsatisfied'] {
  const missing: LayoutResult['unsatisfied'] = [];
  for (const edge of edges) {
    const resolved = resolveEdge(bodies, edge);
    if ('error' in resolved) {
      missing.push({ rel: edge.rel, a: edge.a, b: 'b' in edge ? edge.b : undefined, detail: resolved.error });
      continue;
    }
    const { a, b } = resolved;
    if (edge.rel === 'face' && b) {
      const want = yawToward(a.position, b.position);
      if (angleDelta(a.rotation.y, want) > 18) {
        missing.push({ rel: 'face', a: a.id, b: b.id, detail: `yaw ${a.rotation.y.toFixed(1)} vs ${want.toFixed(1)}` });
      }
    } else if (edge.rel === 'sit_on' && b) {
      const y = seatHeight(b);
      if (Math.abs(a.position.y - y) > 0.08 || xzDist(a.position, b.position) > 0.35) {
        missing.push({ rel: 'sit_on', a: a.id, b: b.id, detail: 'hips not on seat' });
      } else if (angleDelta(a.rotation.y, b.rotation.y) > 25) {
        missing.push({ rel: 'sit_on', a: a.id, b: b.id, detail: 'sitting sideways' });
      }
    } else if (edge.rel === 'distance' && b) {
      const d = xzDist(a.position, b.position);
      const min = edge.min ?? 1.2;
      const max = edge.max ?? 1.6;
      if (d < min - 0.05 || d > max + 0.05) {
        missing.push({ rel: 'distance', a: a.id, b: b.id, detail: `xz ${d.toFixed(2)} not in ${min}-${max}` });
      }
    } else if (edge.rel === 'near' && b) {
      const d = xzDist(a.position, b.position);
      if (d < 0.5 || d > 2.2) missing.push({ rel: 'near', a: a.id, b: b.id, detail: `xz ${d.toFixed(2)}` });
    } else if (edge.rel === 'in_front_of' && b) {
      const dir = forward(b.rotation.y);
      const dx = a.position.x - b.position.x;
      const dz = a.position.z - b.position.z;
      const along = dx * dir.x + dz * dir.z;
      if (along < 0.6) missing.push({ rel: 'in_front_of', a: a.id, b: b.id, detail: 'not in front' });
    } else if (edge.rel === 'side_of' && b) {
      const dir = forward(b.rotation.y);
      const dx = a.position.x - b.position.x;
      const dz = a.position.z - b.position.z;
      const side = Math.abs(dx * -dir.z + dz * dir.x);
      if (side < 0.5) missing.push({ rel: 'side_of', a: a.id, b: b.id, detail: 'not beside' });
    } else if (edge.rel === 'on_ground' && a.position.y > 0.08 && a.pose !== 'sit' && a.pose !== 'drive') {
      missing.push({ rel: 'on_ground', a: a.id, detail: `y=${a.position.y}` });
    }
  }
  return missing;
}

export function solveLayout(bodies: LayoutBody[], edges: LayoutRelation[], iterations = 40): LayoutResult {
  const origin = new Map(bodies.map((item) => [item.id, {
    position: copy(item.position),
    rotation: copy(item.rotation),
    pose: item.pose,
  }]));
  const next = bodies.map((item) => ({
    ...item,
    position: copy(item.position),
    rotation: copy(item.rotation),
  }));
  const poses = new Map<string, string>();

  for (let step = 0; step < iterations; step += 1) {
    for (const edge of edges) {
      const resolved = resolveEdge(next, edge);
      if ('error' in resolved) continue;
      const { a, b } = resolved;
      if (edge.rel === 'sit_on' && b) {
        a.position.x = b.position.x;
        a.position.z = b.position.z;
        a.position.y = seatHeight(b);
        a.rotation.y = b.rotation.y;
        poses.set(a.id, 'sit');
        a.pose = 'sit';
      } else if (edge.rel === 'on_ground') {
        if (a.pose !== 'sit' && a.pose !== 'drive') a.position.y = 0;
      } else if (edge.rel === 'distance' && b) {
        const min = edge.min ?? 1.2;
        const max = edge.max ?? 1.6;
        const d = xzDist(a.position, b.position) || 0.001;
        const target = Math.min(max, Math.max(min, d));
        const scale = target / d;
        a.position.x = b.position.x + (a.position.x - b.position.x) * scale;
        a.position.z = b.position.z + (a.position.z - b.position.z) * scale;
      } else if (edge.rel === 'near' && b) {
        const d = xzDist(a.position, b.position) || 0.001;
        const target = Math.min(1.8, Math.max(0.9, d));
        const scale = target / d;
        a.position.x = b.position.x + (a.position.x - b.position.x) * scale;
        a.position.z = b.position.z + (a.position.z - b.position.z) * scale;
      } else if (edge.rel === 'in_front_of' && b) {
        const dir = forward(b.rotation.y);
        const dist = Math.max(1.2, xzDist(a.position, b.position) || 1.4);
        a.position.x = b.position.x + dir.x * dist;
        a.position.z = b.position.z + dir.z * dist;
      } else if (edge.rel === 'side_of' && b) {
        const dir = forward(b.rotation.y);
        a.position.x = b.position.x + -dir.z * 1.1;
        a.position.z = b.position.z + dir.x * 1.1;
      } else if (edge.rel === 'face' && b) {
        a.rotation.y = wrapDeg(yawToward(a.position, b.position));
      }
    }

    for (let i = 0; i < next.length; i += 1) {
      for (let j = i + 1; j < next.length; j += 1) {
        const left = next[i];
        const right = next[j];
        const min = 0.55 * ((left.uniformScale ?? 1) + (right.uniformScale ?? 1)) * 0.5;
        const d = xzDist(left.position, right.position);
        if (d >= min || d < 1e-6) continue;
        const push = (min - d) / 2;
        const nx = (left.position.x - right.position.x) / d;
        const nz = (left.position.z - right.position.z) / d;
        left.position.x += nx * push;
        left.position.z += nz * push;
        right.position.x -= nx * push;
        right.position.z -= nz * push;
      }
    }
  }

  const unsatisfied = evaluateRelations(next, edges);
  const missed = new Set(unsatisfied.map((item) => `${item.rel}|${item.a}|${item.b ?? ''}`));
  const satisfied = edges.flatMap((edge) => {
    const a = findBody(next, edge.a);
    if (!a) return [];
    const b = 'b' in edge ? findBody(next, edge.b) : undefined;
    if (missed.has(`${edge.rel}|${a.id}|${b?.id ?? ''}`)) return [];
    return [{ rel: edge.rel, a: a.id, b: b?.id }];
  });

  const operations: LayoutOp[] = [];
  for (const body of next) {
    const before = origin.get(body.id);
    if (!before) continue;
    const moved =
      Math.hypot(body.position.x - before.position.x, body.position.y - before.position.y, body.position.z - before.position.z) > 1e-4
      || angleDelta(body.rotation.y, before.rotation.y) > 0.05;
    if (moved) {
      operations.push({
        type: 'set_transform',
        id: body.id,
        position: {
          x: Math.round(body.position.x * 1000) / 1000,
          y: Math.round(body.position.y * 1000) / 1000,
          z: Math.round(body.position.z * 1000) / 1000,
        },
        rotationY: wrapDeg(body.rotation.y),
      });
    }
    const pose = poses.get(body.id);
    if (pose && pose !== before.pose) operations.push({ type: 'set_pose', id: body.id, pose });
  }

  return {
    operations,
    satisfied,
    unsatisfied,
    partial: unsatisfied.length > 0,
  };
}

export function semanticIssues(bodies: LayoutBody[]): Array<{ code: string; severity: string; detail: string; ids: string[] }> {
  const issues: Array<{ code: string; severity: string; detail: string; ids: string[] }> = [];
  const seats = bodies.filter((item) => item.kind === 'prop' && Object.keys(SEAT_Y).some((id) => (item.assetId ?? '').includes(id)));
  for (const body of bodies) {
    if (body.kind === 'character' && (body.pose === 'sit' || body.pose === 'drive') && body.position.y < 0.2) {
      issues.push({ code: 'SIT_FLOATING', severity: 'warning', detail: `${body.id} sit/drive at y=${body.position.y}`, ids: [body.id] });
    }
    if (body.kind === 'character' && (body.pose === 'sit' || body.pose === 'drive')) {
      const seat = seats.find((item) => xzDist(item.position, body.position) < 0.5);
      if (seat && angleDelta(body.rotation.y, seat.rotation.y) > 25) {
        issues.push({ code: 'SIT_SIDEWAYS', severity: 'warning', detail: `${body.id} yaw disagrees with ${seat.id}`, ids: [body.id, seat.id] });
      }
    }
  }
  for (let i = 0; i < bodies.length; i += 1) {
    for (let j = i + 1; j < bodies.length; j += 1) {
      const left = bodies[i];
      const right = bodies[j];
      if (left.kind === 'camera' || right.kind === 'camera') continue;
      const d = xzDist(left.position, right.position);
      if (d < 0.28 && Math.abs(left.position.y - right.position.y) < 1.2) {
        issues.push({ code: 'CLIP_THROUGH', severity: 'warning', detail: `${left.id} overlaps ${right.id} (xz ${d.toFixed(2)})`, ids: [left.id, right.id] });
      }
    }
  }
  return issues;
}
