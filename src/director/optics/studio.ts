/**
 * Studio lighting: Kelvin, brightness, key slot, rim.
 * Matches 参考布光面板 (global / temperature / main light / rim).
 */

export type KeySlot = 'left' | 'top' | 'right' | 'front' | 'bottom';

export interface StudioSettings {
  kelvin: number;
  brightness: number;
  key: KeySlot;
  rim: number;
}

export const KEY_SLOTS: KeySlot[] = ['left', 'top', 'right', 'front', 'bottom'];

export const STUDIO_DEFAULTS: StudioSettings = {
  kelvin: 5600,
  brightness: 50,
  key: 'front',
  rim: 10,
};

export function clampKelvin(value: number): number {
  if (!Number.isFinite(value)) return STUDIO_DEFAULTS.kelvin;
  return Math.min(10000, Math.max(2000, Math.round(value)));
}

export function clampBrightness(value: number): number {
  if (!Number.isFinite(value)) return STUDIO_DEFAULTS.brightness;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function clampRim(value: number): number {
  if (!Number.isFinite(value)) return STUDIO_DEFAULTS.rim;
  return Math.min(10, Math.max(0, Math.round(value * 10) / 10));
}

export function parseKeySlot(token?: string): KeySlot | null {
  if (!token) return null;
  const key = token.trim().toLowerCase();
  return KEY_SLOTS.includes(key as KeySlot) ? (key as KeySlot) : null;
}

/** Tanner Helland approximation, 2000–10000 K → sRGB hex. */
export function kelvinToRgb(kelvin: number): { r: number; g: number; b: number; hex: string } {
  const temp = clampKelvin(kelvin) / 100;
  let r: number;
  let g: number;
  let b: number;
  if (temp <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(temp) - 161.1195681661;
  } else {
    r = 329.698727446 * Math.pow(temp - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(temp - 60, -0.0755148492);
  }
  if (temp >= 66) b = 255;
  else if (temp <= 19) b = 0;
  else b = 138.5177312231 * Math.log(temp - 10) - 305.0447927307;
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  r = clamp(r);
  g = clamp(g);
  b = clamp(b);
  const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  return { r, g, b, hex };
}

export function exposureFromBrightness(brightness: number): number {
  return Math.round((clampBrightness(brightness) / 50) * 1000) / 1000;
}

function pack(x: number, y: number, z: number) {
  return { x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000, z: Math.round(z * 1000) / 1000 };
}

function facing(rotationY: number) {
  const rad = (rotationY * Math.PI) / 180;
  return {
    forward: { x: Math.sin(rad), z: Math.cos(rad) },
    right: { x: Math.cos(rad), z: -Math.sin(rad) },
  };
}

function put(
  origin: { x: number; z: number },
  axes: ReturnType<typeof facing>,
  right: number,
  forward: number,
  y: number,
) {
  return pack(origin.x + axes.right.x * right + axes.forward.x * forward, y, origin.z + axes.right.z * right + axes.forward.z * forward);
}

const SLOT: Record<KeySlot, { r: number; f: number; y: number }> = {
  left: { r: -3.4, f: 2.2, y: 4.2 },
  right: { r: 3.4, f: 2.2, y: 4.2 },
  front: { r: 0, f: 4.2, y: 3.4 },
  top: { r: 0.2, f: 1.2, y: 7.2 },
  bottom: { r: 0.4, f: 2.8, y: 0.45 },
};

/** Fill sits opposite the key so front is not on-axis with the key. */
const FILL_SLOT: Record<KeySlot, { r: number; f: number; y: number }> = {
  left: { r: 3.1, f: 1.8, y: 2.1 },
  right: { r: -3.1, f: 1.8, y: 2.1 },
  front: { r: -2.6, f: 2.2, y: 2.0 },
  top: { r: 2.4, f: 2.0, y: 1.8 },
  bottom: { r: 2.2, f: 2.4, y: 4.4 },
};

/** Yaw in degrees: 0 faces +Z, matching `facing()`. `to` is typically the camera. */
export function yawToward(from: { x: number; z: number }, to: { x: number; z: number }): number {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  if (dx * dx + dz * dz < 1e-8) return 0;
  return Math.round((Math.atan2(dx, dz) * 180) / Math.PI * 10) / 10;
}

export function centroidXZ(points: { x: number; z: number }[]): { x: number; z: number } {
  if (!points.length) return { x: 0, z: 0 };
  const x = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const z = points.reduce((sum, p) => sum + p.z, 0) / points.length;
  return pack(x, 0, z);
}

export interface StudioSubject {
  position: { x: number; y: number; z: number };
  rotationY: number;
}

export function studioLights(subject: StudioSubject, settings: Partial<StudioSettings> = {}) {
  const kelvin = clampKelvin(settings.kelvin ?? STUDIO_DEFAULTS.kelvin);
  const brightness = clampBrightness(settings.brightness ?? STUDIO_DEFAULTS.brightness);
  const key = parseKeySlot(settings.key) ?? STUDIO_DEFAULTS.key;
  const rim = clampRim(settings.rim ?? STUDIO_DEFAULTS.rim);
  const keyRgb = kelvinToRgb(kelvin);
  const fillRgb = kelvinToRgb(kelvin + 900);
  const scale = brightness / 50;
  const axes = facing(subject.rotationY);
  const origin = { x: subject.position.x, z: subject.position.z };
  const lookAt = pack(origin.x, 1.2, origin.z);
  const slot = SLOT[key];
  const fill = FILL_SLOT[key];
  const backR = slot.r === 0 ? 0.8 : -Math.sign(slot.r) * 0.8;
  return {
    kelvin,
    brightness,
    key,
    rim,
    exposure: exposureFromBrightness(brightness),
    lights: [
      {
        id: 'light-key',
        role: 'key' as const,
        kind: 'directional' as const,
        color: keyRgb.hex,
        intensity: Math.round(2.4 * scale * 1000) / 1000,
        position: put(origin, axes, slot.r, slot.f, slot.y),
        lookAt,
        castShadow: true,
      },
      {
        id: 'light-fill',
        role: 'fill' as const,
        kind: 'directional' as const,
        color: fillRgb.hex,
        intensity: Math.round(0.55 * scale * 1000) / 1000,
        position: put(origin, axes, fill.r, fill.f, fill.y),
        lookAt,
        castShadow: false,
      },
      {
        id: 'light-back',
        role: 'back' as const,
        kind: 'directional' as const,
        color: kelvinToRgb(Math.min(10000, kelvin + 1600)).hex,
        intensity: Math.round((rim / 10) * 1.4 * scale * 1000) / 1000,
        position: put(origin, axes, backR, -3.8, 4.6),
        lookAt,
        castShadow: false,
      },
    ],
  };
}
