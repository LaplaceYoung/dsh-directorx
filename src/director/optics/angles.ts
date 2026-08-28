/**
 * Video-retake style multi-angle grid around one subject.
 * Views are yaw/pitch on the subject, not two-person dialogue coverage.
 */

import { applyLensCombo } from './combos';
import type { FilmbackId } from './lens';
import { poseAtScale, parseShotScale, type ShotScale } from './scale';
import type { Vec3 } from './toric';

export type RetakeViewId = 'front' | 'front_side' | 'rear_side' | 'back' | 'overhead' | 'low_angle';

export interface RetakeView {
  id: RetakeViewId;
  label: string;
  yawDeg: number;
  pitchDeg: number;
}

/** Video Retake Fixed-camera presets. */
export const RETAKE_VIEWS: RetakeView[] = [
  { id: 'front', label: 'Front', yawDeg: 0, pitchDeg: 8 },
  { id: 'front_side', label: 'Front side', yawDeg: 40, pitchDeg: 8 },
  { id: 'rear_side', label: 'Rear side', yawDeg: 140, pitchDeg: 8 },
  { id: 'back', label: 'Back', yawDeg: 180, pitchDeg: 8 },
  { id: 'overhead', label: 'Overhead', yawDeg: 18, pitchDeg: 72 },
  { id: 'low_angle', label: 'Low Angle', yawDeg: 0, pitchDeg: -22 },
];

export interface AngleSubject {
  id: string;
  kind?: string;
  label?: string;
  position: Vec3;
  rotation?: Vec3;
  uniformScale?: number;
}

export interface AngleCamera {
  view: RetakeViewId;
  label: string;
  pose: { position: Vec3; lookAt: Vec3 };
  fov: number;
  focalLengthMm: number;
  filmback: FilmbackId;
  aperture?: number;
  dsl: string;
}

export interface AngleGridOptions {
  scale?: string;
  combo?: string;
  filmback?: FilmbackId | string;
  focalLengthMm?: number;
  holdS?: number;
  facingYawDeg?: number;
}

function dslFor(name: string, pose: { position: Vec3; lookAt: Vec3 }, fov: number, holdS: number): string {
  return [
    `campath "${name}"`,
    `  look at ${pose.lookAt.x} ${pose.lookAt.y} ${pose.lookAt.z}`,
    `  from ${pose.position.x} ${pose.position.y} ${pose.position.z} fov ${fov}`,
    `  hold ${holdS}s`,
  ].join('\n');
}

export function parseRetakeView(token?: string): RetakeViewId | null {
  if (!token) return null;
  const key = token.trim().toLowerCase().replace(/\s+/g, '_');
  return RETAKE_VIEWS.some((item) => item.id === key) ? (key as RetakeViewId) : null;
}

export function angleCameras(subject: AngleSubject, options: AngleGridOptions = {}): AngleCamera[] {
  const scale = (parseShotScale(options.scale) ?? 'ms') as ShotScale;
  const combo = options.combo ? applyLensCombo(options.combo) : null;
  const focalLengthMm = options.focalLengthMm ?? combo?.focalLengthMm ?? 50;
  const filmback = (combo?.filmback ?? options.filmback ?? 'super35') as FilmbackId;
  const holdS = options.holdS ?? 2;
  const facing = options.facingYawDeg ?? subject.rotation?.y ?? 0;
  const tag = subject.label || subject.id.slice(0, 8);

  return RETAKE_VIEWS.map((view) => {
    const solved = poseAtScale(subject.position, {
      scale,
      yawDeg: facing + view.yawDeg,
      pitchDeg: view.pitchDeg,
      focalLengthMm,
      filmback,
      kind: subject.kind ?? 'character',
      uniformScale: subject.uniformScale ?? 1,
    });
    const position = {
      x: solved.position.x,
      y: Math.max(0.05, solved.position.y),
      z: solved.position.z,
    };
    const pose = { position, lookAt: solved.lookAt };
    const label = `${view.label} ${tag}`;
    return {
      view: view.id,
      label,
      pose,
      fov: solved.fov,
      focalLengthMm: solved.focalLengthMm,
      filmback,
      aperture: combo?.aperture,
      dsl: dslFor(label, pose, solved.fov, holdS),
    };
  });
}

export function angleOperations(
  subject: AngleSubject,
  options: AngleGridOptions & { clipStartMs?: number } = {},
): Array<{ type: 'set_campath'; dsl: string; label: string; clipStart: number }> {
  const holdMs = Math.round((options.holdS ?? 2) * 1000);
  const origin = options.clipStartMs ?? 0;
  return angleCameras(subject, options).map((shot, index) => ({
    type: 'set_campath' as const,
    dsl: shot.dsl,
    label: shot.label,
    clipStart: origin + index * holdMs,
  }));
}
