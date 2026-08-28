/**
 * Cine-camera lens pack: focal length + filmback → vertical FOV (Three.js).
 * FOV is derived; authors speak millimetres.
 */

export type FilmbackId = '35mm' | 'super35' | '16mm' | '16:9';

export interface Filmback {
  id: FilmbackId;
  widthMm: number;
  heightMm: number;
}

/** Sensor sizes in millimetres. 16:9 is a 36mm-wide digital gate. */
export const FILMBACKS: Record<FilmbackId, Filmback> = {
  '35mm': { id: '35mm', widthMm: 36, heightMm: 24 },
  super35: { id: 'super35', widthMm: 24.89, heightMm: 18.66 },
  '16mm': { id: '16mm', widthMm: 10.26, heightMm: 7.49 },
  '16:9': { id: '16:9', widthMm: 36, heightMm: 36 * 9 / 16 },
};

export function filmbackOf(id?: string): Filmback {
  if (id && id in FILMBACKS) return FILMBACKS[id as FilmbackId];
  return FILMBACKS['35mm'];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Vertical FOV in degrees — what THREE.PerspectiveCamera.fov expects. */
export function verticalFovFromLens(focalLengthMm: number, filmback: Filmback = FILMBACKS['35mm']): number {
  const f = Math.max(4, focalLengthMm);
  const fov = (2 * Math.atan(filmback.heightMm / (2 * f)) * 180) / Math.PI;
  return Math.round(clamp(fov, 10, 120) * 100) / 100;
}

export function horizontalFovFromLens(focalLengthMm: number, filmback: Filmback = FILMBACKS['35mm']): number {
  const f = Math.max(4, focalLengthMm);
  return Math.round((2 * Math.atan(filmback.widthMm / (2 * f)) * 180) / Math.PI * 100) / 100;
}

export function focalFromVerticalFov(fovDeg: number, filmback: Filmback = FILMBACKS['35mm']): number {
  const half = (Math.max(1, fovDeg) * Math.PI) / 360;
  const f = filmback.heightMm / (2 * Math.tan(half));
  return Math.round(clamp(f, 8, 300) * 10) / 10;
}

export interface LensSolve {
  focalLengthMm: number;
  filmback: FilmbackId;
  fov: number;
  horizontalFov: number;
}

export function solveLens(args: { focalLengthMm?: number; filmback?: string; fov?: number }): LensSolve | null {
  const gate = filmbackOf(args.filmback);
  if (typeof args.focalLengthMm === 'number' && Number.isFinite(args.focalLengthMm)) {
    const fov = verticalFovFromLens(args.focalLengthMm, gate);
    return {
      focalLengthMm: args.focalLengthMm,
      filmback: gate.id,
      fov,
      horizontalFov: horizontalFovFromLens(args.focalLengthMm, gate),
    };
  }
  if (typeof args.fov === 'number' && Number.isFinite(args.fov)) {
    const focalLengthMm = focalFromVerticalFov(args.fov, gate);
    return {
      focalLengthMm,
      filmback: gate.id,
      fov: args.fov,
      horizontalFov: horizontalFovFromLens(focalLengthMm, gate),
    };
  }
  return null;
}
