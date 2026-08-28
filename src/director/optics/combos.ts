/**
 * Named lens combos: filmback + prime millimetres (+ optional f-stop).
 * Vertical FOV is the live cine-camera path (Three.js fov).
 */

import { filmbackOf, solveLens, verticalFovFromLens, type FilmbackId, type LensSolve } from './lens';

export interface LensCombo {
  id: string;
  label: string;
  filmback: FilmbackId;
  focalLengthMm: number;
  aperture?: number;
}

export const LENS_COMBOS: LensCombo[] = [
  { id: 's35-24', label: 'Super 35 24mm', filmback: 'super35', focalLengthMm: 24, aperture: 2.8 },
  { id: 's35-35', label: 'Super 35 35mm', filmback: 'super35', focalLengthMm: 35, aperture: 2 },
  { id: 's35-50', label: 'Super 35 50mm', filmback: 'super35', focalLengthMm: 50, aperture: 1.4 },
  { id: 's35-85', label: 'Super 35 85mm', filmback: 'super35', focalLengthMm: 85, aperture: 1.8 },
  { id: 'ff-24', label: '35mm still 24mm', filmback: '35mm', focalLengthMm: 24, aperture: 2.8 },
  { id: 'ff-50', label: '35mm still 50mm', filmback: '35mm', focalLengthMm: 50, aperture: 1.4 },
  { id: 'ff-85', label: '35mm still 85mm', filmback: '35mm', focalLengthMm: 85, aperture: 1.8 },
];

export interface AppliedLensCombo extends LensSolve {
  id: string;
  label: string;
  aperture?: number;
}

function normToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-');
}

export function parseLensCombo(token?: string): LensCombo | null {
  if (!token) return null;
  const key = normToken(token);
  const exact = LENS_COMBOS.find((item) => item.id === key);
  if (exact) return exact;
  const loose = LENS_COMBOS.find((item) => normToken(item.label) === key);
  return loose ?? null;
}

export function applyLensCombo(token: string): AppliedLensCombo | null {
  const combo = parseLensCombo(token);
  if (!combo) return null;
  const solved = solveLens({ focalLengthMm: combo.focalLengthMm, filmback: combo.filmback });
  if (!solved) return null;
  return {
    ...solved,
    id: combo.id,
    label: combo.label,
    aperture: combo.aperture,
  };
}

export function comboVerticalFov(token: string): number | null {
  const combo = parseLensCombo(token);
  if (!combo) return null;
  return verticalFovFromLens(combo.focalLengthMm, filmbackOf(combo.filmback));
}
