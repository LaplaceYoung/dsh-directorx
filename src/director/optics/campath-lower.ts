import { findBody, type LayoutBody } from '../agent/layout';
import { coverageCameras } from './coverage';
import { filmbackOf, verticalFovFromLens } from './lens';
import { parseShotScale, poseAtScale } from './scale';
import { aimPoint, cineSpace } from './toric';

export interface LoweredCampath {
  dsl: string;
  handheldAmp: number;
  lens?: { focalLengthMm: number; fov: number; filmback: string };
}

function stripQuotes(value: string): string {
  return value.replace(/^["']|["']$/g, '');
}

/**
 * Rewrite director-language campath (look pair, from distance, lens mm, handheld)
 * into the live compiler's look at / from x y z / fov form.
 */
export function lowerCampathDsl(source: string, bodies: LayoutBody[]): LoweredCampath {
  const lines = source.split(/\r?\n/);
  let pairA: LayoutBody | undefined;
  let pairB: LayoutBody | undefined;
  let lookTarget: LayoutBody | undefined;
  let screen = 0.5;
  let distance: number | undefined;
  let scaleName: string | undefined;
  let yaw = 18;
  let pitch = 8;
  let lensMm: number | undefined;
  let filmback = '35mm';
  let handheldAmp = 0;
  const kept: string[] = [];

  for (const raw of lines) {
    const line = raw.trim();
    const pair = /^look\s+pair\s+(\S+)\s+(\S+)(?:\s+screen\s+([\d.]+))?$/i.exec(line);
    if (pair) {
      pairA = findBody(bodies, stripQuotes(pair[1]));
      pairB = findBody(bodies, stripQuotes(pair[2]));
      if (pair[3]) screen = Number(pair[3]);
      continue;
    }
    const target = /^look\s+target\s+(\S+)$/i.exec(line);
    if (target) {
      lookTarget = findBody(bodies, stripQuotes(target[1]));
      kept.push(raw);
      continue;
    }
    const fromScale = /^from\s+scale\s+(\w+)(?:\s+yaw\s+(-?[\d.]+))?(?:\s+pitch\s+(-?[\d.]+))?(.*)$/i.exec(line);
    if (fromScale) {
      scaleName = fromScale[1];
      if (fromScale[2]) yaw = Number(fromScale[2]);
      if (fromScale[3]) pitch = Number(fromScale[3]);
      const rest = fromScale[4] ?? '';
      const lens = /lens\s+([\d.]+)/i.exec(rest);
      if (lens) lensMm = Number(lens[1]);
      const gate = /filmback\s+(\S+)/i.exec(rest);
      if (gate) filmback = gate[1];
      if (!lookTarget && !pairA) kept.push(raw);
      continue;
    }
    const fromDist = /^from\s+distance\s+([\d.]+)(?:\s+yaw\s+(-?[\d.]+))?(?:\s+pitch\s+(-?[\d.]+))?(.*)$/i.exec(line);
    if (fromDist) {
      distance = Number(fromDist[1]);
      if (fromDist[2]) yaw = Number(fromDist[2]);
      if (fromDist[3]) pitch = Number(fromDist[3]);
      const rest = fromDist[4] ?? '';
      const lens = /lens\s+([\d.]+)/i.exec(rest);
      if (lens) lensMm = Number(lens[1]);
      const gate = /filmback\s+(\S+)/i.exec(rest);
      if (gate) filmback = gate[1];
      const fov = /fov\s+([\d.]+)/i.exec(rest);
      if (!lensMm && fov) lensMm = undefined;
      continue;
    }
    const hand = /^handheld\s+([\d.]+)/i.exec(line);
    if (hand) {
      handheldAmp = Number(hand[1]);
      continue;
    }
    const lensLine = /^lens\s+([\d.]+)(?:\s+filmback\s+(\S+))?/i.exec(line);
    if (lensLine) {
      lensMm = Number(lensLine[1]);
      if (lensLine[2]) filmback = lensLine[2];
      continue;
    }
    kept.push(raw);
  }

  const gate = filmbackOf(filmback);
  const fov = lensMm ? verticalFovFromLens(lensMm, gate) : undefined;
  let injectedLook: string | null = null;
  let injectedFrom: string | null = null;

  if (pairA && pairB) {
    const a = aimPoint(pairA.position, pairA.kind, pairA.uniformScale ?? 1);
    const b = aimPoint(pairB.position, pairB.kind, pairB.uniformScale ?? 1);
    const pose = cineSpace(a, b, {
      distance: distance ?? 3.6,
      yawDeg: yaw,
      pitchDeg: pitch,
      bias: screen,
    });
    injectedLook = `  look at ${pose.lookAt.x} ${pose.lookAt.y} ${pose.lookAt.z}`;
    injectedFrom = `  from ${pose.position.x} ${pose.position.y} ${pose.position.z}${fov != null ? ` fov ${fov}` : ''}`;
  } else if (lookTarget && parseShotScale(scaleName ?? '')) {
    const solved = poseAtScale(lookTarget.position, {
      scale: parseShotScale(scaleName) as never,
      yawDeg: yaw,
      pitchDeg: pitch,
      focalLengthMm: lensMm,
      filmback,
      kind: lookTarget.kind,
      uniformScale: lookTarget.uniformScale ?? 1,
    });
    injectedFrom = `  from ${solved.position.x} ${solved.position.y} ${solved.position.z} fov ${solved.fov}`;
    lensMm = solved.focalLengthMm;
  } else if (distance != null && !pairA) {
    /* from distance without pair is meaningless; keep original lines */
  }

  const out: string[] = [];
  let lookDone = false;
  let fromDone = false;
  for (const line of kept) {
    if (/^\s*look\b/i.test(line) && injectedLook) {
      if (!lookDone) out.push(injectedLook);
      lookDone = true;
      continue;
    }
    if (/^\s*from\b/i.test(line) && injectedFrom) {
      if (!fromDone) out.push(injectedFrom);
      fromDone = true;
      continue;
    }
    if (fov != null && /^\s*from\s/.test(line) && !/\bfov\b/i.test(line) && !injectedFrom) {
      out.push(`${line.replace(/\s+$/, '')} fov ${fov}`);
      continue;
    }
    out.push(line);
  }
  if (injectedLook && !lookDone) {
    const header = out.findIndex((item) => /^\s*campath\b/i.test(item));
    out.splice(header + 1, 0, injectedLook);
  }
  if (injectedFrom && !fromDone) {
    const lookAt = out.findIndex((item) => /^\s*look\b/i.test(item));
    out.splice((lookAt >= 0 ? lookAt : 0) + 1, 0, injectedFrom);
  }

  return {
    dsl: out.join('\n'),
    handheldAmp,
    lens: lensMm && fov ? { focalLengthMm: lensMm, fov, filmback: gate.id } : undefined,
  };
}

export function coverageOperations(
  a: LayoutBody,
  b: LayoutBody | undefined,
  set?: string,
): Array<{ type: 'set_campath'; dsl: string; label: string }> {
  return coverageCameras(a, b, { set }).map((shot) => ({
    type: 'set_campath' as const,
    dsl: shot.dsl,
    label: shot.label,
  }));
}
