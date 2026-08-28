import { bodiesFromScene, findBody, type LayoutBody } from './layout';
import { coverageOperations, lowerCampathDsl } from '../optics/campath-lower';
import { angleOperations } from '../optics/angles';
import { applyLensCombo } from '../optics/combos';
import { solveLens } from '../optics/lens';
import { LOOK_OP_TYPES } from '../optics/lights';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export interface LookPayload {
  rig?: { preset: string; targetId?: string };
  lights: Record<string, unknown>[];
  remove: string[];
  exposure?: number;
  toneMap?: string;
  ambient?: number;
  hemi?: number;
  dof?: boolean;
  focusM?: number;
  aperture?: number;
  lookAt?: { id: string; targetId?: string; point?: { x: number; y: number; z: number } };
  ibl?: boolean;
  iblIntensity?: number;
  lut?: string;
  lutIntensity?: number;
  focusPlane?: boolean;
  peaking?: boolean;
  peakWidth?: number;
  plant?: { ids?: string[]; groundY?: number };
  kelvin?: number;
  brightness?: number;
  key?: string;
  rim?: number;
  hdri?: string;
  azimuth?: number;
}

export interface ExpandedEdit {
  operations: Record<string, unknown>[];
  handheldAmp: number;
  lens?: ReturnType<typeof solveLens>;
  look: LookPayload | null;
}

export function expandSceneOperations(
  operations: unknown[],
  sceneState: unknown,
): ExpandedEdit {
  const bodies = bodiesFromScene(sceneState as never);
  const out: Record<string, unknown>[] = [];
  let handheldAmp = 0;
  let lens: ReturnType<typeof solveLens> | undefined;
  const look: LookPayload = { lights: [], remove: [] };
  let hasLook = false;

  for (const item of operations) {
    const op = asRecord(item);
    const type = String(op.type ?? '');

    if (LOOK_OP_TYPES.has(type)) {
      hasLook = true;
      if (type === 'set_light_rig') {
        look.rig = { preset: String(op.preset || 'three_point'), targetId: typeof op.targetId === 'string' ? op.targetId : undefined };
      } else if (type === 'remove_light' && typeof op.id === 'string') {
        look.remove.push(op.id);
      } else if (type === 'set_look_at' && typeof op.id === 'string') {
        look.lookAt = {
          id: op.id,
          targetId: typeof op.targetId === 'string' ? op.targetId : undefined,
          point: op.point && typeof op.point === 'object' ? op.point as { x: number; y: number; z: number } : undefined,
        };
      } else if (type === 'set_look') {
        if (op.exposure != null) look.exposure = Number(op.exposure);
        if (typeof op.toneMap === 'string') look.toneMap = op.toneMap;
        if (op.ambient != null) look.ambient = Number(op.ambient);
        if (op.dof != null) look.dof = op.dof === true;
        if (op.focusM != null) look.focusM = Number(op.focusM);
        if (op.aperture != null) look.aperture = Number(op.aperture);
        if (op.ibl != null) look.ibl = op.ibl === true;
        if (op.iblIntensity != null) look.iblIntensity = Number(op.iblIntensity);
        if (typeof op.lut === 'string') look.lut = op.lut;
        if (op.lutIntensity != null) look.lutIntensity = Number(op.lutIntensity);
        if (op.focusPlane != null) look.focusPlane = op.focusPlane === true;
        if (op.peaking != null) look.peaking = op.peaking === true;
        if (op.peakWidth != null) look.peakWidth = Number(op.peakWidth);
        if (op.kelvin != null) look.kelvin = Number(op.kelvin);
        if (op.brightness != null) look.brightness = Number(op.brightness);
        if (typeof op.key === 'string') look.key = op.key;
        if (op.rim != null) look.rim = Number(op.rim);
        if (typeof op.hdri === 'string') look.hdri = op.hdri;
        if (op.azimuth != null) look.azimuth = Number(op.azimuth);
      } else if (type === 'plant_feet') {
        look.plant = {
          ids: Array.isArray(op.ids) ? op.ids.map((id) => String(id)) : typeof op.id === 'string' ? [op.id] : undefined,
          groundY: op.groundY != null ? Number(op.groundY) : undefined,
        };
      } else {
        look.lights.push(op);
      }
      continue;
    }

    if (type === 'set_environment') {
      const lookFields = ['exposure', 'toneMap', 'ambient', 'dof', 'focusM', 'aperture', 'ibl', 'iblIntensity', 'lut', 'lutIntensity', 'focusPlane', 'peaking', 'peakWidth', 'kelvin', 'brightness', 'key', 'rim', 'hdri', 'azimuth'] as const;
      const lifted: Record<string, unknown> = {};
      for (const key of lookFields) {
        if (op[key] != null) {
          lifted[key] = op[key];
          delete op[key];
        }
      }
      if (Object.keys(lifted).length) {
        hasLook = true;
        if (lifted.exposure != null) look.exposure = Number(lifted.exposure);
        if (typeof lifted.toneMap === 'string') look.toneMap = lifted.toneMap;
        if (lifted.ambient != null) look.ambient = Number(lifted.ambient);
        if (lifted.dof != null) look.dof = lifted.dof === true;
        if (lifted.focusM != null) look.focusM = Number(lifted.focusM);
        if (lifted.aperture != null) look.aperture = Number(lifted.aperture);
        if (lifted.ibl != null) look.ibl = lifted.ibl === true;
        if (lifted.iblIntensity != null) look.iblIntensity = Number(lifted.iblIntensity);
        if (typeof lifted.lut === 'string') look.lut = lifted.lut;
        if (lifted.lutIntensity != null) look.lutIntensity = Number(lifted.lutIntensity);
        if (lifted.focusPlane != null) look.focusPlane = lifted.focusPlane === true;
        if (lifted.peaking != null) look.peaking = lifted.peaking === true;
        if (lifted.peakWidth != null) look.peakWidth = Number(lifted.peakWidth);
        if (lifted.kelvin != null) look.kelvin = Number(lifted.kelvin);
        if (lifted.brightness != null) look.brightness = Number(lifted.brightness);
        if (typeof lifted.key === 'string') look.key = lifted.key;
        if (lifted.rim != null) look.rim = Number(lifted.rim);
        if (typeof lifted.hdri === 'string') look.hdri = lifted.hdri;
        if (lifted.azimuth != null) look.azimuth = Number(lifted.azimuth);
      }
      const restKeys = Object.keys(op).filter((key) => key !== 'type');
      if (!restKeys.length) continue;
    }

    if (type === 'set_lens_combo') {
      const applied = typeof op.combo === 'string' ? applyLensCombo(op.combo) : null;
      if (!applied) throw new Error('set_lens_combo needs a known combo id (s35-24, s35-50, ff-50, …)');
      lens = applied;
      hasLook = true;
      if (applied.aperture != null) {
        look.aperture = applied.aperture;
        look.dof = true;
      }
      out.push({
        type: 'set_camera',
        id: typeof op.id === 'string' ? op.id : undefined,
        fov: applied.fov,
      });
      continue;
    }

    if (type === 'set_camera') {
      const combo = typeof op.combo === 'string' ? applyLensCombo(op.combo) : null;
      const solved = combo ?? solveLens({
        focalLengthMm: typeof op.focalLengthMm === 'number' ? op.focalLengthMm : undefined,
        filmback: typeof op.filmback === 'string' ? op.filmback : undefined,
        fov: typeof op.fov === 'number' ? op.fov : undefined,
      });
      if (solved) {
        lens = solved;
        if (combo?.aperture != null) {
          hasLook = true;
          look.aperture = combo.aperture;
          look.dof = true;
        }
        const { focalLengthMm: _f, filmback: _b, combo: _c, ...rest } = op;
        out.push({ ...rest, fov: solved.fov });
        continue;
      }
    }

    if (type === 'set_campath' && typeof op.dsl === 'string') {
      const lowered = lowerCampathDsl(op.dsl, bodies);
      handheldAmp = Math.max(handheldAmp, lowered.handheldAmp);
      if (lowered.lens) lens = solveLens({ focalLengthMm: lowered.lens.focalLengthMm, filmback: lowered.lens.filmback }) ?? lens;
      out.push({ ...op, dsl: lowered.dsl });
      continue;
    }

    if (type === 'add_coverage' || type === 'coverage') {
      const a = pickSubject(bodies, op.a ?? op.target);
      const insert = String(op.set || '') === 'insert';
      const b = insert ? undefined : pickSubject(bodies, op.b, a?.id);
      if (!a || (!insert && !b)) throw new Error(insert ? 'add_coverage insert needs a target' : 'add_coverage needs two characters (a, b)');
      out.push(...coverageOperations(a, b, typeof op.set === 'string' ? op.set : undefined));
      continue;
    }

    if (type === 'add_angles' || type === 'angles') {
      const target = pickSubject(bodies, op.target ?? op.a ?? op.id);
      if (!target) throw new Error('add_angles needs a target character or prop');
      const combo = typeof op.combo === 'string' ? applyLensCombo(op.combo) : null;
      if (combo) lens = combo;
      out.push(...angleOperations(target, {
        scale: typeof op.scale === 'string' ? op.scale : undefined,
        combo: typeof op.combo === 'string' ? op.combo : undefined,
        filmback: typeof op.filmback === 'string' ? op.filmback : undefined,
        focalLengthMm: typeof op.focalLengthMm === 'number' ? op.focalLengthMm : undefined,
        holdS: typeof op.holdS === 'number' ? op.holdS : undefined,
        clipStartMs: typeof op.clipStartMs === 'number' ? op.clipStartMs : undefined,
        facingYawDeg: target.rotation?.y,
      }));
      continue;
    }

    out.push(op);
  }

  return { operations: out, handheldAmp, lens, look: hasLook ? look : null };
}

export function pickSubject(bodies: LayoutBody[], token?: unknown, exceptId?: string): LayoutBody | undefined {
  if (typeof token === 'string' && token.trim()) return findBody(bodies, token.trim());
  return bodies.find((item) => item.kind === 'character' && item.id !== exceptId);
}

export function needsSceneState(operations: unknown[]): boolean {
  return operations.some((item) => {
    const type = String(asRecord(item).type ?? '');
    return type === 'set_campath' || type === 'add_coverage' || type === 'coverage' || type === 'add_angles' || type === 'angles' || type === 'set_lens_combo' || type === 'set_light_rig' || type === 'set_look_at' || LOOK_OP_TYPES.has(type);
  });
}
