/** 时间轴共享类型定义（engine 和外部消费者共同使用）*/

export interface TimelineClip {
  id: string
  /** 引用的对象 id（campath id / motion id / anim id）*/
  ref: string
  startMs: number
  durationMs: number
  enabled: boolean
}

export type TimelineTrackKind = 'anim' | 'campath' | 'motion'

export interface TimelineTrack {
  id?: string
  kind: TimelineTrackKind
  clips: TimelineClip[]
  enabled?: boolean
  muted?: boolean
}

export interface ActiveClip {
  trackId?: string
  kind: TimelineTrackKind
  clip: TimelineClip
  localMs: number
  progress: number
  phase: 'active' | 'gap'
  boundary?: 'start' | 'end'
  frozen: boolean
}

export interface TimelineFrame {
  timeMs: number
  rawTimeMs: number
  durationMs: number
  progress: number
  samples: ActiveClip[]
  activeClips: ActiveClip[]
  byKind: Partial<Record<TimelineTrackKind, ActiveClip>>
}

export type TimelineLoopMode = 'once' | 'loop' | 'pingpong'

export interface TimelineEngineOptions {
  tracks?: readonly TimelineTrack[]
  loopMode?: TimelineLoopMode
  pingpong?: boolean
  onTick?: (timeMs: number, clips: ActiveClip[], frame: TimelineFrame) => void
  onFrame?: (frame: TimelineFrame) => void
  onComplete?: (frame: TimelineFrame) => void
}
