/**
 * 3D 片场 环境 panel (live 2026-08-28): site / ground / named lighting looks / azimuth / background.
 * Named looks map to Kelvin+slot+rim+azimuth — we do not ship 重打包 HDR files.
 */

import { studioLights, type KeySlot, type StudioSubject } from './studio';

export type SiteId = 'blank' | 'room';
export type BackgroundId = 'none' | 'match_lights' | 'panorama';
export type ViewMode = '3d' | 'top';

export interface HdriLook {
  id: string;
  label: string;
  kelvin: number;
  brightness: number;
  key: KeySlot;
  rim: number;
  azimuth: number;
}

export const HDRI_LOOKS: HdriLook[] = [
  { id: 'soft_studio', label: '柔光影棚', kelvin: 5600, brightness: 72, key: 'front', rim: 6, azimuth: 0 },
  { id: 'bright_interior', label: '明亮室内', kelvin: 4800, brightness: 88, key: 'top', rim: 4, azimuth: 15 },
  { id: 'sunny_exterior', label: '晴天户外', kelvin: 6500, brightness: 95, key: 'right', rim: 8, azimuth: 35 },
  { id: 'soft_street', label: '柔和街景', kelvin: 5200, brightness: 58, key: 'left', rim: 3, azimuth: -20 },
  { id: 'golden_hour', label: '金色时刻', kelvin: 3200, brightness: 64, key: 'right', rim: 7, azimuth: 50 },
  { id: 'night_street', label: '夜间街道', kelvin: 3800, brightness: 28, key: 'left', rim: 9, azimuth: -40 },
];

export function resolveHdriLook(id?: string): HdriLook {
  const key = String(id || '').trim();
  return HDRI_LOOKS.find((item) => item.id === key || item.label === key) ?? HDRI_LOOKS[0];
}

export function clampAzimuth(deg: number): number {
  if (!Number.isFinite(deg)) return 0;
  let n = Math.round(deg) % 360;
  if (n > 180) n -= 360;
  if (n <= -180) n += 360;
  return n;
}

export function clampGroundHeight(m: number): number {
  if (!Number.isFinite(m)) return 0;
  return Math.max(-8, Math.min(8, Math.round(m * 10) / 10));
}

export function clampGroundSize(m: number): number {
  if (!Number.isFinite(m)) return 20;
  return Math.max(4, Math.min(80, Math.round(m)));
}

/** Live engine.ground is PlaneGeometry(40,40); engine.grid is GridHelper(20,20). */
export const GROUND_PLANE_BASE = 40;
export const GROUND_GRID_BASE = 20;

export function groundTransform(height: number, size: number): {
  y: number;
  size: number;
  planeScale: number;
  gridScale: number;
} {
  const y = clampGroundHeight(height);
  const edge = clampGroundSize(size);
  return {
    y,
    size: edge,
    planeScale: edge / GROUND_PLANE_BASE,
    gridScale: edge / GROUND_GRID_BASE,
  };
}

export function parseSite(token?: string): SiteId {
  const t = String(token || '').trim().toLowerCase();
  if (t === 'room' || t === '房间') return 'room';
  return 'blank';
}

export function parseBackground(token?: string): BackgroundId {
  const t = String(token || '').trim().toLowerCase();
  if (t === 'match_lights' || t === '与光照一致') return 'match_lights';
  if (t === 'panorama' || t === '全景图') return 'panorama';
  return 'none';
}

export function parseViewMode(token?: string): ViewMode {
  const t = String(token || '').trim().toLowerCase();
  if (t === 'top' || t === '俯视') return 'top';
  return '3d';
}

function yawPoint(x: number, z: number, originX: number, originZ: number, deg: number): { x: number; z: number } {
  const rad = (deg * Math.PI) / 180;
  const dx = x - originX;
  const dz = z - originZ;
  return {
    x: originX + dx * Math.cos(rad) + dz * Math.sin(rad),
    z: originZ - dx * Math.sin(rad) + dz * Math.cos(rad),
  };
}

export function spinLightPositions<T extends { position: { x: number; y: number; z: number } }>(
  lights: T[],
  origin: { x: number; z: number },
  azimuthDeg: number,
): T[] {
  const azimuth = clampAzimuth(azimuthDeg);
  if (!azimuth) return lights;
  return lights.map((item) => {
    const spun = yawPoint(item.position.x, item.position.z, origin.x, origin.z, azimuth);
    return { ...item, position: { ...item.position, x: spun.x, z: spun.z } };
  });
}

export function applyHdriLook(
  subject: StudioSubject,
  lookId?: string,
  azimuthDeg?: number,
) {
  const look = resolveHdriLook(lookId);
  const azimuth = clampAzimuth(azimuthDeg ?? look.azimuth);
  const studio = studioLights(subject, {
    kelvin: look.kelvin,
    brightness: look.brightness,
    key: look.key,
    rim: look.rim,
  });
  const lights = spinLightPositions(studio.lights, { x: subject.position.x, z: subject.position.z }, azimuth);
  return { look, azimuth, exposure: studio.exposure, lights };
}

/** Four inward-facing wall boxes for 房间. Size is ground edge length. */
export function roomWalls(size: number, height = 3.2, thickness = 0.12) {
  const edge = clampGroundSize(size);
  const half = edge / 2;
  const y = height / 2;
  const t = thickness;
  return [
    { id: 'dx-wall-n', position: { x: 0, y, z: -half }, size: { x: edge, y: height, z: t } },
    { id: 'dx-wall-s', position: { x: 0, y, z: half }, size: { x: edge, y: height, z: t } },
    { id: 'dx-wall-w', position: { x: -half, y, z: 0 }, size: { x: t, y: height, z: edge } },
    { id: 'dx-wall-e', position: { x: half, y, z: 0 }, size: { x: t, y: height, z: edge } },
  ];
}

export interface StageEnvState {
  site: SiteId;
  groundHeight: number;
  groundSize: number;
  grid: boolean;
  hdri: string;
  azimuth: number;
  background: BackgroundId;
  view: ViewMode;
}

export const STAGE_ENV_DEFAULTS: StageEnvState = {
  site: 'blank',
  groundHeight: 0,
  groundSize: 20,
  grid: true,
  hdri: 'soft_studio',
  azimuth: 0,
  background: 'none',
  view: '3d',
};

export function resolveStageEnv(partial: Partial<StageEnvState> = {}): StageEnvState {
  return {
    site: parseSite(partial.site),
    groundHeight: clampGroundHeight(partial.groundHeight ?? STAGE_ENV_DEFAULTS.groundHeight),
    groundSize: clampGroundSize(partial.groundSize ?? STAGE_ENV_DEFAULTS.groundSize),
    grid: partial.grid !== false,
    hdri: resolveHdriLook(partial.hdri).id,
    azimuth: clampAzimuth(partial.azimuth ?? STAGE_ENV_DEFAULTS.azimuth),
    background: parseBackground(partial.background),
    view: parseViewMode(partial.view),
  };
}
