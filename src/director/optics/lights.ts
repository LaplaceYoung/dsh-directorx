/**
 * Three-point and look settings. Positions are metres; yaw 0 faces +Z.
 */

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export type LightRole = 'key' | 'fill' | 'back' | 'sun' | 'practical';
export type LightKind = 'directional' | 'spot' | 'point' | 'rect';
export type LightRig = 'three_point' | 'high_key' | 'low_key';

export interface LightSpec {
  id: string;
  role: LightRole;
  kind: LightKind;
  color: string;
  intensity: number;
  position: Vec3;
  lookAt: Vec3;
  castShadow?: boolean;
  width?: number;
  height?: number;
}

export interface SubjectPose {
  id?: string;
  position: Vec3;
  rotationY: number;
}

function pack(x: number, y: number, z: number): Vec3 {
  return { x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000, z: Math.round(z * 1000) / 1000 };
}

function facing(rotationY: number): { forward: { x: number; z: number }; right: { x: number; z: number } } {
  const rad = (rotationY * Math.PI) / 180;
  const forward = { x: Math.sin(rad), z: Math.cos(rad) };
  const right = { x: Math.cos(rad), z: -Math.sin(rad) };
  return { forward, right };
}

function offset(origin: Vec3, right: { x: number; z: number }, forward: { x: number; z: number }, r: number, f: number, y: number): Vec3 {
  return pack(origin.x + right.x * r + forward.x * f, origin.y + y, origin.z + right.z * r + forward.z * f);
}

const AIM_Y = 1.2;

export function threePointRig(subject: SubjectPose, preset: LightRig = 'three_point'): LightSpec[] {
  const { forward, right } = facing(subject.rotationY);
  const origin = { x: subject.position.x, y: 0, z: subject.position.z };
  const lookAt = pack(origin.x, AIM_Y, origin.z);
  const high = preset === 'high_key';
  const low = preset === 'low_key';
  const keyI = high ? 2.4 : low ? 2.8 : 2.1;
  const fillI = high ? 1.35 : low ? 0.28 : 0.7;
  const backI = high ? 0.9 : low ? 1.6 : 1.2;
  const keyColor = low ? '#ffe0c2' : '#fff5e6';
  const fillColor = low ? '#9bb4d0' : '#e8f0ff';
  const backColor = '#b9d4ff';

  return [
    {
      id: 'light-key',
      role: 'key',
      kind: 'directional',
      color: keyColor,
      intensity: keyI,
      position: offset(origin, right, forward, -3.4, 2.2, 4.6),
      lookAt,
      castShadow: true,
    },
    {
      id: 'light-fill',
      role: 'fill',
      kind: 'directional',
      color: fillColor,
      intensity: fillI,
      position: offset(origin, right, forward, 3.8, 1.2, 2.4),
      lookAt,
      castShadow: false,
    },
    {
      id: 'light-back',
      role: 'back',
      kind: 'directional',
      color: backColor,
      intensity: backI,
      position: offset(origin, right, forward, 0.4, -3.6, 4.8),
      lookAt,
      castShadow: false,
    },
  ];
}

export function ambientForRig(preset: LightRig): { ambient: number; hemi: number; exposure: number } {
  if (preset === 'high_key') return { ambient: 0.55, hemi: 0.45, exposure: 1.15 };
  if (preset === 'low_key') return { ambient: 0.12, hemi: 0.18, exposure: 0.82 };
  return { ambient: 0.28, hemi: 0.32, exposure: 1 };
}

export const LOOK_OP_TYPES = new Set([
  'add_light',
  'set_light',
  'remove_light',
  'set_light_rig',
  'set_look',
  'set_look_at',
  'plant_feet',
]);
