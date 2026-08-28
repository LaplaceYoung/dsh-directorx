/** Hard-cut playlist: concat existing mp4s, no generative restitch. */

export function concatFilter(count: number): string {
  if (count < 2) throw new Error('playlist concat needs at least two clips');
  const labels = Array.from({ length: count }, (_, i) => `[${i}:v:0]`).join('');
  return `${labels}concat=n=${count}:v=1:a=0[v]`;
}

/** Scale/pad each input to a shared frame so mixed generated clips concat. */
export function concatNormalizeGraph(count: number, width = 1280, height = 720, fps = 24): string {
  if (count < 2) throw new Error('playlist concat needs at least two clips');
  const scaled = Array.from({ length: count }, (_, i) => (
    `[${i}:v:0]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${fps}[v${i}]`
  ));
  const labels = Array.from({ length: count }, (_, i) => `[v${i}]`).join('');
  return `${scaled.join(';')};${labels}concat=n=${count}:v=1:a=0[v]`;
}

export function captureSeekMs(which: 'first' | 'last' | 'at', sourceMs: number, atMs?: number): number {
  const duration = Math.max(0, sourceMs);
  if (which === 'first') return 0;
  if (which === 'last') return Math.max(0, duration - 40);
  const t = atMs == null ? 0 : atMs;
  return Math.max(0, Math.min(duration, Math.round(t)));
}

export function nudgePlayhead(tMs: number, dir: -1 | 1, durationMs: number, stepMs = 1000): number {
  const duration = Math.max(0, durationMs);
  return Math.max(0, Math.min(duration, Math.round(tMs) + dir * stepMs));
}

export function formatTimecode(ms: number): string {
  const t = Math.max(0, Math.round(ms));
  const m = Math.floor(t / 60000);
  const s = Math.floor((t % 60000) / 1000);
  const f = Math.floor((t % 1000) / 10);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(f).padStart(2, '0')}`;
}

export const STAGE_KEYS = [
  { key: 'C', label: '播放/暂停' },
  { key: 'J', label: '时间轴后退 1s' },
  { key: 'K', label: '时间轴前进 1s' },
  { key: 'F', label: '聚焦所选' },
  { key: '[', label: '焦距 -1mm' },
  { key: ']', label: '焦距 +1mm' },
];
