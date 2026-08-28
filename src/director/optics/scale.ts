/**
 * Shot scale → camera distance from vertical framed metres.
 * DCCL/Auteur treat scale as relative to the subject, not a world-constant dolly.
 * Vertical FOV is Three.js (and this stage): d = (h/2) / tan(vfov/2).
 */

import { filmbackOf, verticalFovFromLens, type FilmbackId } from './lens';
import type { Vec3 } from './toric';

export const SHOT_SCALES = ['ecu', 'cu', 'mcu', 'ms', 'mls', 'ws', 'ews'] as const;
export type ShotScale = (typeof SHOT_SCALES)[number];

/** Metres of subject that fill the vertical frame. */
export const FRAMED_M: Record<ShotScale, number> = {
  ecu: 0.22,
  cu: 0.42,
  mcu: 0.78,
  ms: 1.12,
  mls: 1.55,
  ws: 2.2,
  ews: 4.6,
};

/** Look-at height as a fraction of standing height (~1.65 m). */
export const LOOK_FRAC: Record<ShotScale, number> = {
  ecu: 0.93,
  cu: 0.88,
  mcu: 0.78,
  ms: 0.62,
  mls: 0.5,
  ws: 0.48,
  ews: 0.42,
};

export function parseShotScale(token?: string): ShotScale | null {
  if (!token) return null;
  const key = token.trim().toLowerCase();
  return (SHOT_SCALES as readonly string[]).includes(key) ? (key as ShotScale) : null;
}

export function distanceForScale(scale: ShotScale, vfovDeg: number): number {
  const h = FRAMED_M[scale];
  const half = ((vfovDeg || 40) * Math.PI) / 360;
  const tan = Math.tan(half);
  return Math.max(0.35, (h / 2) / Math.max(1e-4, tan));
}

export function lookHeight(scale: ShotScale, rootY: number, kind: string, uniformScale = 1): number {
  if (kind !== 'character') return rootY + Math.min(0.55, FRAMED_M[scale] * 0.45) * uniformScale;
  return rootY + LOOK_FRAC[scale] * 1.65 * uniformScale;
}

export interface ScalePose {
  position: Vec3;
  lookAt: Vec3;
  fov: number;
  distance: number;
  focalLengthMm: number;
  scale: ShotScale;
}

export function poseAtScale(
  subject: Vec3,
  options: {
    scale: ShotScale;
    yawDeg?: number;
    pitchDeg?: number;
    focalLengthMm?: number;
    filmback?: FilmbackId | string;
    kind?: string;
    uniformScale?: number;
  },
): ScalePose {
  const scale = options.scale;
  const focalLengthMm = options.focalLengthMm ?? (scale === 'ecu' || scale === 'cu' ? 85 : scale === 'mcu' ? 65 : scale === 'ws' || scale === 'ews' ? 35 : 50);
  const gate = filmbackOf(options.filmback);
  const fov = verticalFovFromLens(focalLengthMm, gate);
  const distance = distanceForScale(scale, fov);
  const lookAt = {
    x: subject.x,
    y: lookHeight(scale, subject.y, options.kind ?? 'character', options.uniformScale ?? 1),
    z: subject.z,
  };
  const yaw = ((options.yawDeg ?? 18) * Math.PI) / 180;
  const pitch = ((options.pitchDeg ?? 6) * Math.PI) / 180;
  const horiz = distance * Math.cos(pitch);
  const position = {
    x: lookAt.x + Math.sin(yaw) * horiz,
    y: lookAt.y + Math.sin(pitch) * distance,
    z: lookAt.z + Math.cos(yaw) * horiz,
  };
  const round = (v: number) => Math.round(v * 1000) / 1000;
  return {
    position: { x: round(position.x), y: round(position.y), z: round(position.z) },
    lookAt: { x: round(lookAt.x), y: round(lookAt.y), z: round(lookAt.z) },
    fov: round(fov),
    distance: round(distance),
    focalLengthMm,
    scale,
  };
}
