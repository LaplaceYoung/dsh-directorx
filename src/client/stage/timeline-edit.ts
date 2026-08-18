/** Sequence-style timeline math for the video studio. Source times stay on the clip; layout is play order. */

export interface TimelineClip {
  id: number
  sourceIn: number
  sourceOut: number
  speed: number
  fadeIn: number
  fadeOut: number
  muted: boolean
}

export type ExportScale = 'orig' | '1080' | '720' | '480'
export type ExportQuality = 'high' | 'standard' | 'draft'
export type ExportFps = 24 | 30

export function clipPlayDuration(clip: TimelineClip): number {
  const span = Math.max(0.05, clip.sourceOut - clip.sourceIn)
  return span / Math.max(0.25, clip.speed)
}

export function sequenceDuration(clips: TimelineClip[]): number {
  return clips.reduce((sum, clip) => sum + clipPlayDuration(clip), 0)
}

export function clipStarts(clips: TimelineClip[]): number[] {
  const starts: number[] = []
  let cursor = 0
  for (const clip of clips) {
    starts.push(cursor)
    cursor += clipPlayDuration(clip)
  }
  return starts
}

export function hitTest(clips: TimelineClip[], seqTime: number): {
  clip: TimelineClip
  index: number
  start: number
  local: number
  sourceTime: number
} | undefined {
  const starts = clipStarts(clips)
  for (let index = 0; index < clips.length; index += 1) {
    const clip = clips[index]
    const start = starts[index] ?? 0
    const end = start + clipPlayDuration(clip)
    if (seqTime >= start && seqTime < end - 1e-4 || (index === clips.length - 1 && seqTime >= start && seqTime <= end + 1e-4)) {
      const local = Math.min(clipPlayDuration(clip), Math.max(0, seqTime - start))
      return { clip, index, start, local, sourceTime: clip.sourceIn + local * clip.speed }
    }
  }
  const last = clips[clips.length - 1]
  if (last === undefined) return undefined
  return {
    clip: last,
    index: clips.length - 1,
    start: starts[clips.length - 1] ?? 0,
    local: clipPlayDuration(last),
    sourceTime: last.sourceOut,
  }
}

export function sourceFromSequence(clips: TimelineClip[], seqTime: number): number {
  return hitTest(clips, seqTime)?.sourceTime ?? 0
}

export function fromSource(duration: number, id = 1): TimelineClip[] {
  const end = Math.max(0.05, duration)
  return [{ id, sourceIn: 0, sourceOut: end, speed: 1, fadeIn: 0, fadeOut: 0, muted: false }]
}

export function nextClipId(clips: TimelineClip[]): number {
  return clips.reduce((max, clip) => Math.max(max, clip.id), 0) + 1
}

export function splitAt(clips: TimelineClip[], seqTime: number, id: number): TimelineClip[] {
  const hit = hitTest(clips, seqTime)
  if (hit === undefined) return clips
  if (hit.local < 0.05 || hit.local > clipPlayDuration(hit.clip) - 0.05) return clips
  const cut = hit.sourceTime
  return clips.flatMap(clip => {
    if (clip.id !== hit.clip.id) return [clip]
    return [
      { ...clip, sourceOut: cut },
      { ...clip, id, sourceIn: cut, fadeIn: 0 },
    ]
  })
}

export function removeClip(clips: TimelineClip[], id: number): TimelineClip[] {
  return clips.filter(clip => clip.id !== id)
}

export function duplicateClip(clips: TimelineClip[], id: number, nextId: number): TimelineClip[] {
  const index = clips.findIndex(clip => clip.id === id)
  const clip = clips[index]
  if (clip === undefined) return clips
  const copy = { ...clip, id: nextId }
  return [...clips.slice(0, index + 1), copy, ...clips.slice(index + 1)]
}

export function moveClip(clips: TimelineClip[], id: number, dir: -1 | 1): TimelineClip[] {
  const index = clips.findIndex(clip => clip.id === id)
  return moveTo(clips, id, index + dir)
}

export function moveTo(clips: TimelineClip[], id: number, toIndex: number): TimelineClip[] {
  const from = clips.findIndex(clip => clip.id === id)
  if (from < 0 || toIndex < 0 || toIndex >= clips.length || from === toIndex) return clips
  const copy = clips.slice()
  const [item] = copy.splice(from, 1)
  if (item === undefined) return clips
  copy.splice(toIndex, 0, item)
  return copy
}

export function patchClip(clips: TimelineClip[], id: number, patch: Partial<TimelineClip>): TimelineClip[] {
  return clips.map(clip => clip.id === id ? { ...clip, ...patch, id: clip.id } : clip)
}

export function trimClip(
  clips: TimelineClip[],
  id: number,
  edge: 'in' | 'out',
  sourceTime: number,
  sourceDuration: number,
): TimelineClip[] {
  return clips.map(clip => {
    if (clip.id !== id) return clip
    if (edge === 'in') {
      const sourceIn = Math.max(0, Math.min(sourceTime, clip.sourceOut - 0.05))
      return { ...clip, sourceIn }
    }
    const sourceOut = Math.min(sourceDuration, Math.max(sourceTime, clip.sourceIn + 0.05))
    return { ...clip, sourceOut }
  })
}

export function evenPx(value: number): number {
  return Math.max(2, Math.round(value / 2) * 2)
}

export function exportSize(width: number, height: number, scale: ExportScale): { width: number; height: number } {
  if (scale === 'orig' || width <= 0 || height <= 0) return { width: evenPx(width || 1280), height: evenPx(height || 720) }
  const maxH = scale === '1080' ? 1080 : scale === '720' ? 720 : 480
  const factor = Math.min(1, maxH / height)
  return { width: evenPx(width * factor), height: evenPx(height * factor) }
}

export function exportBitrate(quality: ExportQuality): number {
  if (quality === 'high') return 8_000_000
  if (quality === 'draft') return 1_500_000
  return 4_000_000
}

export function fmtClock(seconds: number): string {
  const total = Math.max(0, seconds)
  const m = Math.floor(total / 60)
  const s = (total % 60).toFixed(1)
  return `${m}:${s.padStart(4, '0')}`
}

export function tickStep(pxPerSec: number): number {
  if (pxPerSec >= 160) return 0.5
  if (pxPerSec >= 80) return 1
  if (pxPerSec >= 40) return 2
  return 5
}
