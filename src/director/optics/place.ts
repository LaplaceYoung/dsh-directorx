/** Live-engine bodies, poses, and primitive props (matches app.jsx Kn / ps / Vs). */

export const BODY_TYPES = ['mannequin', 'female', 'child'] as const;
export type BodyType = (typeof BODY_TYPES)[number];

export const BODY_HEIGHT_M: Record<BodyType, number> = {
  mannequin: 1.7,
  female: 1.6,
  child: 1.1,
};

export const STAGE_POSES = [
  'stand', 'sit', 'walk', 'wave', 'think', 'bow', 'kneel', 'lie', 'tpose', 'akimbo', 'hands_up', 'squat', 'drive',
] as const;
export type StagePose = (typeof STAGE_POSES)[number];

export const STAGE_PRIMS = [
  { id: 'mesh_cube', label: '立方体' },
  { id: 'mesh_sphere', label: '球体' },
  { id: 'mesh_cylinder', label: '圆柱' },
  { id: 'mesh_cone', label: '圆锥' },
  { id: 'mesh_torus', label: '环状体' },
  { id: 'mesh_capsule', label: '胶囊' },
  { id: 'chair', label: '椅子' },
  { id: 'stool', label: '圆凳' },
  { id: 'square_table', label: '方桌' },
  { id: 'round_table', label: '圆桌' },
] as const;

export function parseBodyType(token?: string): BodyType {
  const t = String(token || '').trim().toLowerCase();
  if (t === 'female' || t === '女' || t === 'woman') return 'female';
  if (t === 'child' || t === '儿童' || t === 'kid') return 'child';
  if (BODY_TYPES.includes(t as BodyType)) return t as BodyType;
  return 'mannequin';
}

export function parsePose(token?: string): StagePose {
  const t = String(token || '').trim().toLowerCase();
  if (t === 'sit' || t === '坐' || t === '地坐') return 'sit';
  if ((STAGE_POSES as readonly string[]).includes(t)) return t as StagePose;
  return 'stand';
}

export function parsePrim(token?: string): string | null {
  const t = String(token || '').trim();
  const hit = STAGE_PRIMS.find((item) => item.id === t || item.label === t);
  return hit ? hit.id : null;
}

export function heightToScale(heightM: number, body: BodyType = 'mannequin'): number {
  const base = BODY_HEIGHT_M[body] || 1.7;
  const h = Number.isFinite(heightM) ? Math.max(0.5, Math.min(2.4, heightM)) : base;
  const scale = h / base;
  return Math.max(0.2, Math.min(5, Math.round(scale * 1000) / 1000));
}

export interface PlaceArgs {
  kind?: string;
  bodyType?: string;
  assetId?: string;
  pose?: string;
  heightM?: number;
  label?: string;
  position?: { x: number; y: number; z: number };
}

export function placeOperations(args: PlaceArgs): Record<string, unknown>[] {
  const position = args.position && Number.isFinite(args.position.x)
    ? args.position
    : { x: 0, y: 0, z: 0 };
  const kind = String(args.kind || '').toLowerCase();
  const prim = parsePrim(args.assetId) || (kind === 'prop' || kind === 'primitive' ? parsePrim(args.kind) : null);
  if (prim || kind === 'prop' || kind === 'primitive') {
    const assetId = prim || parsePrim(args.assetId) || 'mesh_cube';
    const op: Record<string, unknown> = { type: 'add_prop', assetId, position };
    if (args.label) op.label = String(args.label).slice(0, 40);
    return [op];
  }
  const bodyType = parseBodyType(args.bodyType || (kind === 'character' ? 'mannequin' : args.kind));
  const pose = parsePose(args.pose);
  const op: Record<string, unknown> = { type: 'add_character', bodyType, pose, position };
  if (args.label) op.label = String(args.label).slice(0, 40);
  if (args.heightM != null) op.uniformScale = heightToScale(Number(args.heightM), bodyType);
  return [op];
}
