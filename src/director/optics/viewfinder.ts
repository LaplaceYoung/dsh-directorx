import { parseAspect, VIEWFINDER_ASPECTS, type ViewAspect } from './aspects';
import { FILMBACKS, verticalFovFromLens } from './lens';

export const VIEWFINDER_FOCAL_MIN = 12;
export const VIEWFINDER_FOCAL_MAX = 200;

export interface ViewfinderState {
  open: boolean;
  aspect: string;
  focalMm: number;
  thirds: boolean;
}

export const VIEWFINDER_DEFAULTS: ViewfinderState = {
  open: false,
  aspect: '16:9',
  focalMm: 24,
  thirds: true,
};

export function clampFocal(mm: number): number {
  if (!Number.isFinite(mm)) return VIEWFINDER_DEFAULTS.focalMm;
  return Math.min(VIEWFINDER_FOCAL_MAX, Math.max(VIEWFINDER_FOCAL_MIN, Math.round(mm)));
}

/** 操作方式: [ ] 调整焦距. */
export function nudgeFocal(mm: number, dir: -1 | 1, stepMm = 1): number {
  return clampFocal(mm + dir * stepMm);
}

export function resolveViewfinder(partial: Partial<ViewfinderState> = {}): ViewfinderState & { gate: ViewAspect; fov: number } {
  const aspectId = partial.aspect ?? VIEWFINDER_DEFAULTS.aspect;
  const gate = parseAspect(aspectId) ?? VIEWFINDER_ASPECTS[0];
  const focalMm = clampFocal(partial.focalMm ?? VIEWFINDER_DEFAULTS.focalMm);
  return {
    open: partial.open === true,
    aspect: gate.id,
    focalMm,
    thirds: partial.thirds !== false,
    gate,
    fov: verticalFovFromLens(focalMm, FILMBACKS['16:9']),
  };
}

/** Args for scene.snapshot so captureCamera crops the same gate as the HUD. */
export function viewfinderSnapshotArgs(partial: Partial<ViewfinderState> = {}): { aspect: string; overlay: string[] } {
  const resolved = resolveViewfinder(partial);
  return {
    aspect: resolved.aspect,
    overlay: resolved.thirds ? ['thirds'] : [],
  };
}
