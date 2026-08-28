/**
 * Multicam cut list. Blender VSE: keys 1–9 cut the selector to a source channel.
 * Cinemachine Timeline: adjacent clips = cut; overlap = blend (we only store cuts).
 * https://docs.blender.org/manual/en/latest/video_editing/edit/montage/strips/effects/multicam.html
 * https://docs.unity3d.com/Packages/com.unity.cinemachine@3.1/manual/setup-timeline.html
 */

export interface CutCamera {
  id: string;
  label?: string;
}

export interface CutBeat {
  tMs: number;
  cameraId: string;
  label?: string;
}

export function cameraIndex(token: string | number): number | null {
  if (typeof token === 'number' && Number.isFinite(token)) return Math.floor(token);
  if (typeof token === 'string' && /^\d+$/.test(token.trim())) return Number(token.trim());
  return null;
}

export function resolveCamera<T extends CutCamera>(cameras: T[], token?: string | number): T | undefined {
  if (token == null || cameras.length === 0) return undefined;
  const index = cameraIndex(token);
  if (index != null) {
    const i = index >= 1 ? index - 1 : index;
    return cameras[i];
  }
  const want = String(token);
  const exact = cameras.find((item) => item.id === want);
  if (exact) return exact;
  const prefix = cameras.filter((item) => item.id.startsWith(want) || (item.label && item.label === want));
  return prefix.length === 1 ? prefix[0] : undefined;
}

export function addCut(beats: CutBeat[], tMs: number, cameraId: string, label?: string): CutBeat[] {
  const t = Math.max(0, Math.round(tMs));
  const next = beats.filter((item) => item.tMs !== t);
  next.push({ tMs: t, cameraId, label });
  next.sort((a, b) => a.tMs - b.tMs);
  const merged: CutBeat[] = [];
  for (const beat of next) {
    const last = merged[merged.length - 1];
    if (last && last.cameraId === beat.cameraId) continue;
    merged.push(beat);
  }
  return merged;
}

export function cutAtTime(beats: CutBeat[], tMs: number): CutBeat | null {
  let found: CutBeat | null = null;
  for (const beat of beats) {
    if (beat.tMs <= tMs) found = beat;
    else break;
  }
  return found;
}
