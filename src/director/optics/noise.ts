/**
 * Handheld camera noise (Cinemachine-style): layered value noise, rotation-first.
 * Amplitude is degrees; scale down for long lenses.
 */

export function hashNoise(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function valueNoise(t: number, seed: number): number {
  const i = Math.floor(t);
  const f = t - i;
  const u = f * f * (3 - 2 * f);
  const a = hashNoise(i + seed);
  const b = hashNoise(i + 1 + seed);
  return a * (1 - u) + b * u;
}

export interface HandheldSample {
  yawDeg: number;
  pitchDeg: number;
  rollDeg: number;
}

export function handheldSample(timeSec: number, ampDeg: number, hz = 1.15): HandheldSample {
  const amp = Math.max(0, ampDeg);
  const t = timeSec * hz;
  return {
    yawDeg: (valueNoise(t, 11) - 0.5) * 2 * amp,
    pitchDeg: (valueNoise(t * 1.31, 29) - 0.5) * 2 * amp * 0.65,
    rollDeg: (valueNoise(t * 0.87, 47) - 0.5) * 2 * amp * 0.35,
  };
}

/** Telephoto sees more shake; scale amplitude by 50mm / focal. */
export function handheldAmpForLens(baseAmp: number, focalLengthMm: number): number {
  return baseAmp * (50 / Math.max(18, focalLengthMm));
}
