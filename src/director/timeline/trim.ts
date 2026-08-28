/**
 * In/out trim for generated media and timeline clips.
 * 剪辑: confirm writes a NEW file/clip; original stays.
 */

export interface ClipSpan {
  id?: string;
  start: number;
  duration: number;
}

export interface TrimSpan {
  inMs: number;
  outMs: number;
  durationMs: number;
}

export function parseTimeToMs(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.round(value));
  if (typeof value !== 'string') return fallback;
  const text = value.trim();
  if (/^\d+(\.\d+)?s$/i.test(text)) return Math.round(parseFloat(text) * 1000);
  if (/^\d+:\d{1,2}(\.\d+)?$/.test(text)) {
    const [m, s] = text.split(':');
    return Math.round((Number(m) * 60 + Number(s)) * 1000);
  }
  const n = Number(text);
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : fallback;
}

export function clampTrim(inMs: number, outMs: number, sourceMs: number): TrimSpan {
  const source = Math.max(1, Math.round(sourceMs));
  let start = Math.max(0, Math.min(source - 1, Math.round(inMs)));
  let end = Math.max(0, Math.min(source, Math.round(outMs)));
  if (end - start < 120) end = Math.min(source, start + 120);
  if (end <= start) {
    start = Math.max(0, end - 120);
  }
  return { inMs: start, outMs: end, durationMs: end - start };
}

/** Nudge in/out by 1s, 对齐快捷操作 Ctrl/Cmd+Arrow. */
export function nudgeTrim(span: TrimSpan, which: 'in' | 'out', dir: -1 | 1, sourceMs: number): TrimSpan {
  const delta = 1000 * dir;
  if (which === 'in') return clampTrim(span.inMs + delta, span.outMs, sourceMs);
  return clampTrim(span.inMs, span.outMs + delta, sourceMs);
}

export function trimClip(clip: ClipSpan, inMs: number, outMs: number): ClipSpan {
  const span = clampTrim(inMs, outMs, clip.duration);
  return {
    ...clip,
    start: clip.start + span.inMs,
    duration: span.durationMs,
  };
}

export interface SceneCut {
  tMs: number;
}

/** Split a span on detected cut times (ms from source 0). */
export function splitAtCuts(sourceMs: number, cuts: number[]): TrimSpan[] {
  const points = [0, ...cuts.filter((t) => t > 80 && t < sourceMs - 80).sort((a, b) => a - b), sourceMs];
  const unique = points.filter((t, i) => i === 0 || t - points[i - 1] > 80);
  const out: TrimSpan[] = [];
  for (let i = 0; i < unique.length - 1; i += 1) {
    out.push(clampTrim(unique[i], unique[i + 1], sourceMs));
  }
  return out.length ? out : [clampTrim(0, sourceMs, sourceMs)];
}
