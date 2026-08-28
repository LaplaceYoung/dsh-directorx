/**
 * Adobe Cube LUT 1.0 helpers. Built-in tables are self-authored; user files only from /uploads or /luts.
 * Spec: TITLE, LUT_3D_SIZE, DOMAIN_MIN/MAX, then RGB triplets, red increases fastest.
 * https://web.archive.org/web/20220220033515/https://wwwimages2.adobe.com/content/dam/acom/en/products/speedgrade/cc/pdfs/cube-lut-specification-1.0.pdf
 */

export const LUT_PRESETS = ['none', 'contrast', 'falsecolor'] as const;
export type LutPreset = (typeof LUT_PRESETS)[number];

export interface CubeLut {
  title: string;
  size: number;
  domainMin: [number, number, number];
  domainMax: [number, number, number];
  samples: number;
  text: string;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Smoothstep S-curve mixed with identity. */
export function contrastChannel(t: number, amount = 0.42): number {
  const x = clamp01(t);
  const s = x * x * (3 - 2 * x);
  return clamp01(x * (1 - amount) + s * amount);
}

const FALSE_STOPS: Array<[number, [number, number, number]]> = [
  [0, [0.16, 0.02, 0.28]],
  [0.03, [0.08, 0.18, 0.88]],
  [0.1, [0.05, 0.62, 0.86]],
  [0.18, [0.12, 0.78, 0.22]],
  [0.42, [0.18, 0.52, 0.2]],
  [0.55, [0.88, 0.48, 0.58]],
  [0.76, [0.96, 0.86, 0.14]],
  [0.9, [0.95, 0.16, 0.1]],
  [1, [1, 1, 1]],
];

export function lumaRec709(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function falseColor(y: number): [number, number, number] {
  const t = clamp01(y);
  for (let i = 1; i < FALSE_STOPS.length; i += 1) {
    const [t1, c1] = FALSE_STOPS[i];
    const [t0, c0] = FALSE_STOPS[i - 1];
    if (t <= t1) {
      const u = (t - t0) / (t1 - t0 || 1);
      return [
        c0[0] + (c1[0] - c0[0]) * u,
        c0[1] + (c1[1] - c0[1]) * u,
        c0[2] + (c1[2] - c0[2]) * u,
      ];
    }
  }
  return [1, 1, 1];
}

export function cubeFile(
  title: string,
  size: number,
  sample: (r: number, g: number, b: number) => [number, number, number],
): string {
  const n = Math.max(2, Math.floor(size));
  const lines = [
    `TITLE "${title}"`,
    `LUT_3D_SIZE ${n}`,
    'DOMAIN_MIN 0.0 0.0 0.0',
    'DOMAIN_MAX 1.0 1.0 1.0',
  ];
  for (let b = 0; b < n; b += 1) {
    for (let g = 0; g < n; g += 1) {
      for (let r = 0; r < n; r += 1) {
        const rgb = sample(r / (n - 1), g / (n - 1), b / (n - 1));
        lines.push(`${rgb[0].toFixed(6)} ${rgb[1].toFixed(6)} ${rgb[2].toFixed(6)}`);
      }
    }
  }
  return `${lines.join('\n')}\n`;
}

export function contrastCube(size = 16): string {
  return cubeFile('Contrast', size, (r, g, b) => [
    contrastChannel(r),
    contrastChannel(g),
    contrastChannel(b),
  ]);
}

export function falseColorCube(size = 16): string {
  return cubeFile('False Color', size, (r, g, b) => falseColor(lumaRec709(r, g, b)));
}

export function identityCube(size = 16): string {
  return cubeFile('Identity', size, (r, g, b) => [r, g, b]);
}

export function parseCube(text: string): CubeLut {
  const title = /TITLE +"([^"]*)"/.exec(text)?.[1] || '';
  const sizeMatch = /LUT_3D_SIZE +(\d+)/.exec(text);
  if (!sizeMatch) throw new Error('cube LUT missing LUT_3D_SIZE');
  const size = Number(sizeMatch[1]);
  const min = /DOMAIN_MIN +([\d.]+) +([\d.]+) +([\d.]+)/.exec(text);
  const max = /DOMAIN_MAX +([\d.]+) +([\d.]+) +([\d.]+)/.exec(text);
  const samples = [...text.matchAll(/^([\d.e+-]+) +([\d.e+-]+) +([\d.e+-]+) *$/gm)].length;
  return {
    title,
    size,
    domainMin: min ? [Number(min[1]), Number(min[2]), Number(min[3])] : [0, 0, 0],
    domainMax: max ? [Number(max[1]), Number(max[2]), Number(max[3])] : [1, 1, 1],
    samples,
    text,
  };
}

export function cubeForPreset(preset: string): string | null {
  if (preset === 'contrast') return contrastCube();
  if (preset === 'falsecolor') return falseColorCube();
  return null;
}

/** Same-origin Cube LUT files only. */
export function isLutPath(value: string): boolean {
  return /^\/(uploads|luts)\/[A-Za-z0-9._-]+\.cube$/i.test(value);
}
