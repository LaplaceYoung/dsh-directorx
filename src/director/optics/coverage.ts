import { verticalFovFromLens, filmbackOf, type FilmbackId } from './lens';
import { poseAtScale, parseShotScale, type ShotScale } from './scale';
import { aimPoint, cineSpace, overShoulder, type CameraPose, type Vec3 } from './toric';

export type CoverageShot = 'master' | 'ots_a' | 'ots_b' | 'single_a' | 'single_b' | 'insert';

export interface CoverageSubject {
  id: string;
  kind?: string;
  label?: string;
  position: Vec3;
  uniformScale?: number;
}

export interface CoverageCamera {
  shot: CoverageShot;
  label: string;
  pose: CameraPose;
  fov: number;
  focalLengthMm: number;
  dsl: string;
}

const SETS: Record<string, CoverageShot[]> = {
  dialogue: ['master', 'ots_a', 'ots_b', 'single_a', 'single_b'],
  two_shot: ['master', 'ots_a', 'ots_b'],
  singles: ['single_a', 'single_b'],
  insert: ['insert'],
};

function dslFor(name: string, pose: CameraPose, fov: number, holdS = 2): string {
  return [
    `campath "${name}"`,
    `  look at ${pose.lookAt.x} ${pose.lookAt.y} ${pose.lookAt.z}`,
    `  from ${pose.position.x} ${pose.position.y} ${pose.position.z} fov ${fov}`,
    `  hold ${holdS}s`,
  ].join('\n');
}

export function insertCamera(
  subject: CoverageSubject,
  options: { filmback?: FilmbackId; scale?: string; yawDeg?: number; holdS?: number } = {},
): CoverageCamera {
  const gate = filmbackOf(options.filmback);
  const prop = subject.kind !== 'character';
  const scale = parseShotScale(options.scale) ?? (prop ? 'ecu' : 'cu');
  const solved = poseAtScale(subject.position, {
    scale,
    yawDeg: options.yawDeg ?? 24,
    pitchDeg: prop ? 18 : 6,
    filmback: gate.id,
    kind: subject.kind ?? 'character',
    uniformScale: subject.uniformScale ?? 1,
  });
  const label = `insert ${subject.label || subject.id.slice(0, 8)} ${scale}`;
  const pose = { position: solved.position, lookAt: solved.lookAt };
  return {
    shot: 'insert',
    label,
    pose,
    fov: solved.fov,
    focalLengthMm: solved.focalLengthMm,
    dsl: dslFor(label, pose, solved.fov, options.holdS ?? 2),
  };
}

export function coverageCameras(
  a: CoverageSubject,
  b: CoverageSubject | undefined,
  options: { set?: string; filmback?: FilmbackId; side?: 1 | -1; holdS?: number; scale?: string } = {},
): CoverageCamera[] {
  const set = options.set ?? 'dialogue';
  if (set === 'insert') return [insertCamera(a, options)];
  if (!b) return [insertCamera(a, options)];
  const shots = SETS[set] ?? SETS.dialogue;
  const gate = filmbackOf(options.filmback);
  const side = options.side ?? 1;
  const holdS = options.holdS ?? 2;
  const aimA = aimPoint(a.position, a.kind ?? 'character', a.uniformScale ?? 1);
  const aimB = aimPoint(b.position, b.kind ?? 'character', b.uniformScale ?? 1);
  const labelA = a.label || a.id.slice(0, 8);
  const labelB = b.label || b.id.slice(0, 8);
  const singleScale: ShotScale = parseShotScale(options.scale) ?? 'mcu';

  const build = (shot: CoverageShot): CoverageCamera => {
    if (shot === 'insert') return insertCamera(a, options);
    if (shot === 'master') {
      const wide = poseAtScale(
        { x: (a.position.x + b.position.x) / 2, y: (a.position.y + b.position.y) / 2, z: (a.position.z + b.position.z) / 2 },
        { scale: 'ws', yawDeg: 18 * side, pitchDeg: 9, focalLengthMm: 35, filmback: gate.id, kind: 'character' },
      );
      const pose = cineSpace(aimA, aimB, { distance: wide.distance, yawDeg: 18 * side, pitchDeg: 9, bias: 0.5 });
      const label = `master ${labelA}-${labelB}`;
      return { shot, label, pose, fov: wide.fov, focalLengthMm: 35, dsl: dslFor(label, pose, wide.fov, holdS) };
    }
    if (shot === 'ots_a') {
      const pose = overShoulder(aimA, aimB, side);
      const focalLengthMm = 50;
      const fov = verticalFovFromLens(focalLengthMm, gate);
      const label = `OTS ${labelA}→${labelB}`;
      return { shot, label, pose, fov, focalLengthMm, dsl: dslFor(label, pose, fov, holdS) };
    }
    if (shot === 'ots_b') {
      const pose = overShoulder(aimB, aimA, side);
      const focalLengthMm = 50;
      const fov = verticalFovFromLens(focalLengthMm, gate);
      const label = `OTS ${labelB}→${labelA}`;
      return { shot, label, pose, fov, focalLengthMm, dsl: dslFor(label, pose, fov, holdS) };
    }
    if (shot === 'single_a') {
      const solved = poseAtScale(a.position, {
        scale: singleScale,
        yawDeg: 12 * side,
        pitchDeg: 5,
        focalLengthMm: 65,
        filmback: gate.id,
        kind: a.kind ?? 'character',
        uniformScale: a.uniformScale ?? 1,
      });
      const pose = { position: solved.position, lookAt: solved.lookAt };
      const label = `single ${labelA}`;
      return { shot, label, pose, fov: solved.fov, focalLengthMm: solved.focalLengthMm, dsl: dslFor(label, pose, solved.fov, holdS) };
    }
    const solved = poseAtScale(b.position, {
      scale: singleScale,
      yawDeg: -12 * side,
      pitchDeg: 5,
      focalLengthMm: 65,
      filmback: gate.id,
      kind: b.kind ?? 'character',
      uniformScale: b.uniformScale ?? 1,
    });
    const pose = { position: solved.position, lookAt: solved.lookAt };
    const label = `single ${labelB}`;
    return { shot, label, pose, fov: solved.fov, focalLengthMm: solved.focalLengthMm, dsl: dslFor(label, pose, solved.fov, holdS) };
  };

  return shots.map(build);
}
