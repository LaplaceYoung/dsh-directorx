import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import WaveSurfer from 'wavesurfer.js'
import { AudioClip, Combinator, MP4Clip, OffscreenSprite } from '@webav/av-cliper'

/**
 * Track-timeline video editor, powered by WebAV (MIT, actively maintained;
 * npm: @webav/av-cliper) for all in-browser processing — decode, split,
 * reorder, audio mixing, and MP4 export — with a lightweight React timeline
 * on top. The audio track waveform is rendered by wavesurfer.js (BSD-3-Clause,
 * 10k★, actively maintained).
 *
 * Capabilities: one source clip split into segments at the playhead,
 * segments deleted or reordered; an audio track with waveform, click-to-seek,
 * volume control and loop-fill; export as a single MP4 (H.264 + AAC via
 * WebCodecs). UI reference: omni-clip (MIT, active).
 */

export interface VideoEditBodyProps {
  source: string
  path: string
  onExport: (blob: Blob, mediaType: string) => void
}

interface Segment {
  id: number
  startUs: number
  endUs: number
  /** 播放倍率（0.1-4）；时间模型按 时长÷倍率 计，导出暂未接入。 */
  rate?: number
}

interface Meta {
  width: number
  height: number
  durationUs: number
}

interface AudioTrack {
  file: File
  url: string
  name: string
}

const MIN_SCALE = 8 // px per second
const MAX_SCALE = 140

const lane: CSSProperties = { display: 'flex', gap: 2, marginTop: 10, overflowX: 'auto', paddingBottom: 4 }
const segStyle: CSSProperties = {
  padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,.18)',
  background: 'rgba(255,255,255,.06)', fontSize: 11.5, whiteSpace: 'nowrap', cursor: 'pointer', color: '#ececec',
}
const segSelected: CSSProperties = { ...segStyle, border: '1px solid rgba(245,245,245,.9)', background: 'rgba(255,255,255,.14)' }
const row: CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }
const btn: CSSProperties = {
  padding: '6px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,.16)',
  background: 'rgba(255,255,255,.05)', color: '#ececec', fontSize: 12.5, cursor: 'pointer',
}
const primaryBtn: CSSProperties = { ...btn, border: 'none', background: '#f5f5f5', color: '#171717', fontWeight: 600 }
const audioLane: CSSProperties = { marginTop: 12, border: '1px solid rgba(255,255,255,.14)', borderRadius: 12, padding: 10, background: 'rgba(255,255,255,.03)' }
const audioLabel: CSSProperties = { fontSize: 11.5, opacity: .8, marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
const trimHandleCss = '.dx-trim-handle:hover { opacity: 1 !important; background: linear-gradient(to right, rgba(245,245,245,.6), transparent) !important; }'

/** 标尺刻度间隔：随 px/s 自适应（大刻度密度，避免拥挤）。 */
function rulerInterval(scale: number): { major: number; minor: number } {
  if (scale >= 60) return { major: 1, minor: 0.5 }
  if (scale >= 20) return { major: 5, minor: 1 }
  if (scale >= 8) return { major: 10, minor: 5 }
  return { major: 30, minor: 10 }
}

function fmt(us: number): string {
  const total = us / 1e6
  const minutes = Math.floor(total / 60)
  const seconds = (total % 60).toFixed(1)
  return `${minutes}:${seconds.padStart(4, '0')}`
}

/** 解析时间码：'m:ss.s' 或纯秒数 → 秒（非法返回 null）。 */
function parseTimecode(text: string): number | null {
  const trimmed = text.trim()
  if (trimmed === '') return null
  const parts = trimmed.split(':')
  if (parts.length === 1) {
    const seconds = Number(trimmed)
    return Number.isFinite(seconds) && seconds >= 0 ? seconds : null
  }
  if (parts.length === 2) {
    const minutes = Number(parts[0])
    const seconds = Number(parts[1])
    if (!Number.isFinite(minutes) || !Number.isFinite(seconds) || minutes < 0 || seconds < 0 || seconds >= 60) return null
    return minutes * 60 + seconds
  }
  return null
}

/** 客户端 SRT 解析（时间戳→微秒；支持逗号/点毫秒）。 */
function parseSrtClient(content: string): Array<{ startUs: number; endUs: number; text: string }> {
  const blocks = content.replace(/\r\n/g, '\n').split(/\n\s*\n/)
  const parsed: Array<{ startUs: number; endUs: number; text: string }> = []
  for (const block of blocks) {
    const lines = block.split('\n').filter(line => line.trim() !== '')
    if (lines.length < 2) continue
    const timeLine = lines.find(line => line.includes('-->'))
    if (timeLine === undefined) continue
    const [startRaw, endRaw] = timeLine.split('-->').map(part => part.trim())
    const toUs = (raw: string) => {
      const parts = raw.replace(',', '.').split(':').map(Number)
      if (parts.length !== 3) return -1
      const [h, m, sec] = parts
      if (!Number.isFinite(h) || !Number.isFinite(m) || !Number.isFinite(sec)) return -1
      return Math.round((h * 3600 + m * 60 + sec) * 1e6)
    }
    const startUs = toUs(startRaw)
    const endUs = toUs(endRaw)
    if (startUs < 0 || endUs < 0) continue
    parsed.push({ startUs, endUs, text: lines.filter(line => line !== timeLine && !/^\d+$/.test(line.trim())).join(' ') })
  }
  return parsed
}

function fmtBytes(bytes: number): string {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`
}

export function VideoEditBody(props: VideoEditBodyProps): ReactNode {
  const [meta, setMeta] = useState<Meta | undefined>(undefined)
  const [segments, setSegments] = useState<Segment[]>([])
  const segmentsRef = useRef<Segment[]>([])
  const setSegmentsWithHistory = (updater: React.SetStateAction<Segment[]>) => {
    pushHistory()
    setSegments(updater)
  }
  useEffect(() => { segmentsRef.current = segments }, [segments])
  const [selected, setSelected] = useState<number | undefined>(undefined)
  const [scale, setScale] = useState(30)
  const [audio, setAudio] = useState<AudioTrack | undefined>(undefined)
  const [volume, setVolume] = useState(100)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const [progress, setProgress] = useState<number | undefined>(undefined)
  const [exported, setExported] = useState<{ blob: Blob; url: string } | undefined>(undefined)
  const [currentTime, setCurrentTime] = useState(0)
  const [trimPreview, setTrimPreview] = useState<string | undefined>(undefined)
  const [timeInput, setTimeInput] = useState<string | undefined>(undefined)
  const [subtitles, setSubtitles] = useState<Array<{ id: number; startUs: number; endUs: number; text: string }>>([])
  const [subSelected, setSubSelected] = useState<number | undefined>(undefined)
  const [subEditing, setSubEditing] = useState<number | undefined>(undefined)
  const videoRef = useRef<HTMLVideoElement>(null)
  const waveRef = useRef<HTMLDivElement>(null)
  const waveInstanceRef = useRef<WaveSurfer | null>(null)
  const clipRef = useRef<MP4Clip | null>(null)
  const nextId = useRef(1)
  const historyRef = useRef<Array<{ segments: Segment[]; audio: AudioTrack | undefined; volume: number }>>([])

  const pushHistory = () => {
    historyRef.current.push({ segments: segmentsRef.current, audio, volume })
    if (historyRef.current.length > 60) historyRef.current.shift()
  }

  const undoHistory = () => {
    const entry = historyRef.current.pop()
    if (entry === undefined) return
    setSegments(entry.segments)
    setAudio(entry.audio)
    setVolume(entry.volume)
  }

  useEffect(() => {
    let live = true
    let clip: MP4Clip | null = null
    void (async () => {
      try {
        const body = (await fetch(props.source)).body
        if (body === null) throw new Error('视频流不可用')
        clip = new MP4Clip(body)
        await clip.ready
        if (!live) {
          clip.destroy()
          return
        }
        clipRef.current = clip
        const durationUs = clip.meta.duration
        setMeta({ width: clip.meta.width, height: clip.meta.height, durationUs })
        setSegments([{ id: nextId.current++, startUs: 0, endUs: durationUs }])
      } catch (cause) {
        if (live) setError(cause instanceof Error ? cause.message : String(cause))
      }
    })()
    return () => {
      live = false
      clip?.destroy()
      clipRef.current = null
    }
  }, [props.source])

  // Audio waveform: wavesurfer renders the imported track; clicks seek the video.
  useEffect(() => {
    const container = waveRef.current
    if (container === null || audio === undefined) return
    let disposed = false
    const wave = WaveSurfer.create({
      container,
      url: audio.url,
      height: 48,
      waveColor: 'rgba(255,255,255,.28)',
      progressColor: 'rgba(245,245,245,.85)',
      cursorColor: '#8fdc9f',
      normalize: true,
    })
    waveInstanceRef.current = wave
    wave.on('interaction', () => {
      const video = videoRef.current
      if (video === null) return
      video.currentTime = wave.getCurrentTime()
      void video.play().catch(() => {})
    })
    wave.on('error', () => { if (!disposed) setError('音频波形解析失败') })
    return () => {
      disposed = true
      waveInstanceRef.current = null
      wave.destroy()
    }
  }, [audio])

  const splitAtPlayhead = useCallback(() => {
    const video = videoRef.current
    if (video === null || meta === undefined) return
    const tUs = Math.round(video.currentTime * 1e6)
    pushHistory()
    setSegments(previous => {
      const index = previous.findIndex(segment => tUs > segment.startUs && tUs < segment.endUs)
      if (index < 0) return previous
      const segment = previous[index]
      const next = [...previous]
      next.splice(index, 1,
        { id: nextId.current++, startUs: segment.startUs, endUs: tUs },
        { id: nextId.current++, startUs: tUs, endUs: segment.endUs },
      )
      return next
    })
  }, [meta])

  const moveSegment = useCallback((direction: -1 | 1) => {
    pushHistory()
    setSegments(previous => {
      if (selected === undefined) return previous
      const index = previous.findIndex(segment => segment.id === selected)
      const target = index + direction
      if (index < 0 || target < 0 || target >= previous.length) return previous
      const next = [...previous]
      const [moved] = next.splice(index, 1)
      next.splice(target, 0, moved)
      return next
    })
  }, [selected])

  const deleteSegment = useCallback(() => {
    pushHistory()
    setSegments(previous => previous.filter(segment => segment.id !== selected))
    setSelected(undefined)
  }, [selected])

  const importSubtitles = useCallback((file: File | undefined) => {
    if (file === undefined) return
    void file.text().then(text => {
      const blocks = parseSrtClient(text)
      if (blocks.length === 0) {
        setError('SRT 解析失败（无有效字幕块）')
        return
      }
      pushHistory()
      setSubtitles(blocks.map((block, index) => ({ id: index + 1, ...block })))
    }).catch(cause => setError(cause instanceof Error ? cause.message : String(cause)))
  }, [])

  const importAudio = useCallback((file: File | undefined) => {
    pushHistory()
    if (file === undefined) return
    if (!file.type.startsWith('audio/')) {
      setError('请选择音频文件（mp3/wav 等）')
      return
    }
    setError(undefined)
    setAudio({ file, url: URL.createObjectURL(file), name: file.name })
  }, [])

  const exportVideo = useCallback(async () => {
    const clip = clipRef.current
    if (clip === null || meta === undefined || segments.length === 0) return
    setBusy(true)
    setError(undefined)
    setProgress(undefined)
    setExported(undefined)
    try {
      if (!await Combinator.isSupported({ width: meta.width, height: meta.height })) {
        throw new Error('当前浏览器不支持 WebCodecs H.264 编码（需要 Chrome/Edge/Safari 较新版本）')
      }
      // Partition the source once, in source order, at every segment boundary.
      const cuts = [...new Set(segments.flatMap(segment => [segment.startUs, segment.endUs]))]
        .filter(t => t > 0 && t < meta.durationUs)
        .sort((a, b) => a - b)
      let cursor = 0
      let rest = await clip.clone()
      const parts: Array<{ part: MP4Clip; startUs: number; endUs: number }> = []
      for (const cut of cuts) {
        const [piece, tail] = await rest.split(cut)
        parts.push({ part: piece, startUs: cursor, endUs: cut })
        rest = tail
        cursor = cut
      }
      parts.push({ part: rest, startUs: cursor, endUs: meta.durationUs })
      const partByKey = new Map(parts.map(entry => [`${entry.startUs}-${entry.endUs}`, entry.part]))

      const combinator = new Combinator({ width: meta.width, height: meta.height })
      let offsetUs = 0
      for (const segment of segments) {
        const part = partByKey.get(`${segment.startUs}-${segment.endUs}`)
        if (part === undefined) throw new Error('片段在导出时丢失')
        const rate = segment.rate ?? 1
        const sprite = new OffscreenSprite(part)
        // duration = 时间线窗口（源时长÷倍率），playbackRate = 每秒消耗的源时长倍率。
        sprite.time = { offset: offsetUs, duration: Math.round((segment.endUs - segment.startUs) / rate), playbackRate: rate }
        await combinator.addSprite(sprite)
        offsetUs += Math.round((segment.endUs - segment.startUs) / rate)
      }
      const totalUs = offsetUs
      if (audio !== undefined) {
        const audioClip = new AudioClip(audio.file.stream(), { volume: volume / 100, loop: false })
        const audioSprite = new OffscreenSprite(audioClip)
        audioSprite.time = { offset: 0, duration: totalUs }
        await combinator.addSprite(audioSprite)
      }
      combinator.on('OutputProgress', value => setProgress(value))
      const stream = combinator.output()
      const blob = await new Response(stream).blob()
      setExported({ blob, url: URL.createObjectURL(blob) })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }, [meta, segments, audio, volume])

  const trimRef = useRef<{ id: number; edge: 'start' | 'end'; originX: number; originStart: number; originEnd: number } | undefined>(undefined)

  const beginTrim = (segment: Segment, edge: 'start' | 'end') => (event: React.PointerEvent) => {
    event.stopPropagation()
    event.preventDefault()
    pushHistory()
    trimRef.current = { id: segment.id, edge, originX: event.clientX, originStart: segment.startUs, originEnd: segment.endUs }
    const move = (moveEvent: PointerEvent) => {
      const state = trimRef.current
      if (state === undefined || meta === undefined) return
      const deltaUs = (moveEvent.clientX - state.originX) / scale * 1e6
      const snapWindowUs = (10 / scale) * 1e6
      setSegments(current => current.map(segment => {
        if (segment.id !== state.id) return segment
        let next = state.edge === 'start'
          ? Math.min(state.originEnd - 200_000, Math.max(0, state.originStart + deltaUs))
          : Math.max(state.originStart + 200_000, Math.min(meta.durationUs, state.originEnd + deltaUs))
        setTrimPreview(fmt(next))
        // 吸附：播放头 / 0 / 片长 / 其他片段边界（±10px）。
        const video = videoRef.current
        const playheadUs = video !== null ? video.currentTime * 1e6 : -1
        const anchors = [playheadUs, ...current.flatMap(other => other.id === state.id ? [] : [other.startUs, other.endUs]), 0, meta.durationUs]
        const hit = anchors.find(anchor => anchor >= 0 && Math.abs(anchor - next) <= snapWindowUs)
        if (hit !== undefined) next = hit
        if (state.edge === 'start') return { ...segment, startUs: next }
        return { ...segment, endUs: next }
      }))
    }
    const up = () => {
      trimRef.current = undefined
      setTrimPreview(undefined)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const totalUs = useMemo(() => segments.reduce((sum, segment) => sum + Math.round((segment.endUs - segment.startUs) / (segment.rate ?? 1)), 0), [segments])

  // 全局快捷键（输入框焦点保护）：Space 播放 · S 分割 · Delete 删片段 ·
  // ←/→ seek（Shift 大步）· ↑/↓ 跳切点 · Esc 取消选择。
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      const video = videoRef.current
      if (video === null || meta === undefined) return
      switch (event.key) {
        case ' ':
          event.preventDefault()
          if (video.paused) void video.play().catch(() => {})
          else video.pause()
          break
        case 's':
        case 'S':
          event.preventDefault()
          splitAtPlayhead()
          break
        case 'Delete':
        case 'Backspace':
          event.preventDefault()
          deleteSegment()
          break
        case 'ArrowLeft':
          event.preventDefault()
          video.currentTime = Math.max(0, video.currentTime - (event.shiftKey ? 5 : 1))
          setCurrentTime(video.currentTime)
          break
        case 'ArrowRight':
          event.preventDefault()
          video.currentTime = Math.min(meta.durationUs / 1e6, video.currentTime + (event.shiftKey ? 5 : 1))
          setCurrentTime(video.currentTime)
          break
        case 'ArrowUp': {
          event.preventDefault()
          const before = segments.filter(segment => segment.startUs / 1e6 < video.currentTime - 0.01)
          if (before.length > 0) {
            video.currentTime = before[before.length - 1].startUs / 1e6
            setCurrentTime(video.currentTime)
          }
          break
        }
        case 'ArrowDown': {
          event.preventDefault()
          const after = segments.find(segment => segment.startUs / 1e6 > video.currentTime + 0.01)
          if (after !== undefined) {
            video.currentTime = after.startUs / 1e6
            setCurrentTime(video.currentTime)
          }
          break
        }
        case 'Escape':
          setSelected(undefined)
          break
        case 'z':
        case 'Z':
          if (event.metaKey || event.ctrlKey) {
            event.preventDefault()
            undoHistory()
          }
          break
        default:
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [meta, segments, splitAtPlayhead, deleteSegment, undoHistory])

  return (
    <div style={{ padding: 12, fontSize: 13 }}>
      <style>{trimHandleCss}</style>
      {error !== undefined ? <div style={{ color: '#ff9b8f', fontSize: 12.5, marginBottom: 8 }}>{error}</div> : null}
      {meta !== undefined ? (
        <>
          <video
            ref={videoRef} src={props.source} controls preload="metadata"
            onTimeUpdate={event => setCurrentTime(event.currentTarget.currentTime)}
            onKeyDown={event => {
              if (event.code !== 'Space') return
              const tag = (event.target as HTMLElement | null)?.tagName
              if (tag === 'INPUT' || tag === 'TEXTAREA') return
              event.preventDefault()
              const video = videoRef.current
              if (video === null) return
              if (video.paused) void video.play().catch(() => {})
              else video.pause()
            }}
            style={{ width: '100%', maxHeight: 260, borderRadius: 12, background: '#000', border: '1px solid rgba(255,255,255,.1)' }}
          />
          <div style={row}>
            <button style={btn} disabled={busy} onClick={splitAtPlayhead}>在播放头分割</button>
            <button style={btn} onClick={undoHistory} title="撤销（⌘Z）">↶ 撤销</button>
            <button style={btn} disabled={busy || selected === undefined} onClick={() => moveSegment(-1)}>前移</button>
            <button style={btn} disabled={busy || selected === undefined} onClick={() => moveSegment(1)}>后移</button>
            <button style={btn} disabled={busy || selected === undefined} onClick={deleteSegment}>删除片段</button>
            <button style={primaryBtn} disabled={busy} onClick={() => void exportVideo()}>
              {busy ? `导出中…${progress !== undefined ? ` ${Math.round(progress * 100)}%` : ''}` : `导出 MP4（${fmt(totalUs)}）`}
            </button>
          </div>
          <div style={{ marginTop: 8, fontSize: 11.5, opacity: .6 }}>
            {meta.width}×{meta.height} · 源时长 {fmt(meta.durationUs)} · 输出 {fmt(totalUs)} · 片段 {segments.length}
            {audio !== undefined ? ` · 音频 ${audio.name}` : ''}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
            {timeInput !== undefined ? (
              <input
                autoFocus
                value={timeInput}
                placeholder={fmt(currentTime * 1e6)}
                onChange={event => setTimeInput(event.target.value)}
                onBlur={() => {
                  const parsed = parseTimecode(timeInput)
                  if (parsed !== null && videoRef.current !== null && meta !== undefined) {
                    videoRef.current.currentTime = Math.min(meta.durationUs / 1e6, parsed)
                    setCurrentTime(videoRef.current.currentTime)
                  }
                  setTimeInput(undefined)
                }}
                onKeyDown={event => {
                  if (event.key === 'Enter') event.currentTarget.blur()
                  if (event.key === 'Escape') { setTimeInput(undefined) }
                }}
                style={{ width: 92, fontSize: 11.5, fontVariantNumeric: 'tabular-nums', padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(245,245,245,.5)', color: '#f5f5f5', outline: 'none' }}
              />
            ) : (
              <button
                onClick={() => setTimeInput(fmt(currentTime * 1e6))}
                title="点击输入时间码精确跳转（m:ss.s 或秒）"
                style={{ fontSize: 11.5, color: '#e8e8e8', fontVariantNumeric: 'tabular-nums', padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', cursor: 'text' }}
              >
                {fmt(currentTime * 1e6)} / {fmt(meta.durationUs)}
              </button>
            )}
            <button style={btn} onClick={() => setScale(current => Math.max(MIN_SCALE, current - 8))} title="缩小时间线">−</button>
            <span style={{ fontSize: 11, opacity: .65, minWidth: 44, textAlign: 'center' }}>{Math.round(scale)} px/s</span>
            <button style={btn} onClick={() => setScale(current => Math.min(MAX_SCALE, current + 8))} title="放大时间线">＋</button>
            <span style={{ fontSize: 11, opacity: .5 }}>空格播放/暂停 · 拖动片段边缘裁剪（自动吸附边界/播放头）</span>
          </div>
          <div
            style={{ ...lane, position: 'relative', minHeight: 96, display: 'block', overflowX: 'auto' }}
            onClick={event => {
              // 点击时间线空白处：预览跳转到该时间点（播放头三态单向同步）。
              const target = event.target as HTMLElement
              if (target.closest('[data-segment]') !== null) return
              const laneEl = event.currentTarget as HTMLElement
              const x = event.clientX - laneEl.getBoundingClientRect().left + laneEl.scrollLeft
              const video = videoRef.current
              if (video === null || meta === undefined) return
              video.currentTime = Math.min(meta.durationUs / 1e6, Math.max(0, x / scale))
              setCurrentTime(video.currentTime)
            }}
          >
            <div style={{ position: 'relative', width: (meta.durationUs / 1e6) * scale + 8, minWidth: '100%' }}>
              <div style={{ position: 'relative', height: 20, borderBottom: '1px solid rgba(255,255,255,.12)' }}>
                {(() => {
                  const { major, minor } = rulerInterval(scale)
                  const ticks: React.ReactNode[] = []
                  const durationSec = meta.durationUs / 1e6
                  for (let t = 0; t <= durationSec; t += minor) {
                    const isMajor = Math.abs(t % major) < 0.001
                    ticks.push(
                      <div key={`tick-${t}`} style={{ position: 'absolute', left: t * scale, bottom: 0, width: 1, height: isMajor ? 10 : 5, background: 'rgba(255,255,255,.35)' }}>
                        {isMajor ? <span style={{ position: 'absolute', left: 3, top: 0, fontSize: 9, color: 'rgba(255,255,255,.55)', fontVariantNumeric: 'tabular-nums' }}>{fmt(t * 1e6).replace(/\\.0$/, '')}</span> : null}
                      </div>,
                    )
                  }
                  return ticks
                })()}
              </div>
              <div style={{ position: 'relative', display: 'flex', gap: 2, paddingBottom: 4, alignItems: 'stretch', height: 52 }}>
            <div style={{ position: 'absolute', left: Math.min(Math.max(currentTime * scale, 0), (meta.durationUs / 1e6) * scale), top: 0, bottom: 0, width: 1, background: 'rgba(245,245,245,.75)', pointerEvents: 'none', zIndex: 2, boxShadow: '0 0 4px rgba(0,0,0,.6)' }} title="播放头" />
            {segments.map(segment => {
              const width = Math.max(40, Math.round((segment.endUs - segment.startUs) / 1e6 / (segment.rate ?? 1) * scale))
              return (
                <div
                  key={segment.id}
                  data-segment="true"
                  style={{ ...(selected === segment.id ? segSelected : segStyle), width, textAlign: 'center', overflow: 'hidden', position: 'relative' }}
                  onClick={event => { event.stopPropagation(); setSelected(segment.id) }}
                  onDoubleClick={() => {
                    const video = videoRef.current
                    if (video === null) return
                    video.currentTime = segment.startUs / 1e6
                    void video.play().catch(() => {})
                  }}
                  onContextMenu={event => {
                    event.preventDefault()
                    if (window.confirm(`删除片段 ${fmt(segment.startUs)}–${fmt(segment.endUs)}？`)) deleteSegment()
                  }}
                  title="双击：预览跳转到该片段起点；右键：删除" 
                >
                  <div
                    className="dx-trim-handle"
                    style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 14, cursor: 'ew-resize', background: 'linear-gradient(to right, rgba(245,245,245,.35), transparent)', opacity: .7, transition: 'opacity .12s ease' }}
                    title="拖动裁剪入点（吸附播放头/边界）"
                    onPointerDown={beginTrim(segment, 'start')}
                  />
                  <div
                    className="dx-trim-handle"
                    style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 14, cursor: 'ew-resize', background: 'linear-gradient(to left, rgba(245,245,245,.35), transparent)', opacity: .7, transition: 'opacity .12s ease' }}
                    title="拖动裁剪出点（吸附播放头/边界）"
                    onPointerDown={beginTrim(segment, 'end')}
                  />
                  <div style={{ opacity: .75 }}>{fmt(segment.startUs)}–{fmt(segment.endUs)}</div>
                  <div style={{ fontSize: 10, opacity: .55 }}>{fmt(segment.endUs - segment.startUs)}{(segment.rate ?? 1) !== 1 ? ` · ${segment.rate}x` : ''}</div>
                </div>
              )
            })}
            </div>
          </div>
          </div>
          {selected !== undefined ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap', padding: '8px 10px', borderRadius: 12, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.04)' }}>
              <span style={{ fontSize: 11, color: '#b8b8b8', flexShrink: 0 }}>片段倍率</span>
              {[0.5, 1, 1.5, 2].map(rate => (
                <button
                  key={rate}
                  onClick={() => setSegmentsWithHistory(current => current.map(segment => segment.id === selected ? { ...segment, rate } : segment))}
                  style={{ padding: '4px 10px', borderRadius: 999, border: ((segments.find(segment => segment.id === selected)?.rate ?? 1) === rate) ? '1px solid rgba(245,245,245,.9)' : '1px solid rgba(255,255,255,.14)', background: ((segments.find(segment => segment.id === selected)?.rate ?? 1) === rate) ? 'rgba(255,255,255,.14)' : 'transparent', color: '#ececec', fontSize: 11.5, cursor: 'pointer' }}
                >
                  {rate}x
                </button>
              ))}
              <input
                type="range" min={0.1} max={4} step={0.1} value={segments.find(segment => segment.id === selected)?.rate ?? 1}
                onChange={event => {
                  const value = Number(event.target.value)
                  setSegmentsWithHistory(current => current.map(segment => segment.id === selected ? { ...segment, rate: value } : segment))
                }}
                style={{ flex: 1, minWidth: 100 }}
              />
              <span style={{ fontSize: 11, color: '#d8d8d8', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                {(() => {
                  const current = segments.find(segment => segment.id === selected)
                  if (current === undefined) return ''
                  return `时长 ${fmt(current.endUs - current.startUs)} → ${fmt((current.endUs - current.startUs) / (current.rate ?? 1))}`
                })()}
              </span>
            </div>
          ) : null}
          {trimPreview !== undefined ? (
            <div style={{ position: 'fixed', left: '50%', bottom: 24, transform: 'translateX(-50%)', zIndex: 30, fontSize: 12, fontVariantNumeric: 'tabular-nums', padding: '5px 12px', borderRadius: 999, background: 'rgba(18,18,18,.92)', border: '1px solid rgba(255,255,255,.18)', color: '#f5f5f5', boxShadow: '0 8px 20px rgba(0,0,0,.5)' }}>{trimPreview}</div>
          ) : null}
          <div style={audioLane}>
            <div style={audioLabel}>
              <span>音频轨（wavesurfer.js）</span>
              <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {audio !== undefined ? <button style={btn} onClick={() => { setAudio(undefined); setVolume(100) }}>移除</button> : null}
                <label style={{ ...btn, cursor: 'pointer' }}>
                  {audio === undefined ? '导入音频' : '更换音频'}
                  <input
                    type="file"
                    accept="audio/*"
                    style={{ display: 'none' }}
                    onChange={event => importAudio(event.target.files?.[0])}
                  />
                </label>
              </span>
            </div>
            {audio !== undefined ? (
              <>
                <div ref={waveRef} style={{ cursor: 'pointer' }} />
                <div style={row}>
                  <span style={{ fontSize: 11.5, opacity: .65 }}>音量 {volume}%</span>
                  <input
                    type="range" min={0} max={200} value={volume}
                    onChange={event => setVolume(Number(event.target.value))}
                    style={{ flex: 1 }}
                  />
                </div>
              </>
            ) : (
              <div style={{ fontSize: 11.5, opacity: .55, padding: '6px 0' }}>
                导入一段音乐或旁白（mp3/wav），导出时混入成片；波形点击可定位主预览。
              </div>
            )}
          </div>
          <div style={{ ...audioLane, marginTop: 10 }}>
            <div style={audioLabel}>
              <span>字幕轨</span>
              <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {subtitles.length > 0 ? (
                  <button style={btn} onClick={() => { if (subSelected !== undefined) { pushHistory(); setSubtitles(current => current.filter(block => block.id !== subSelected)); setSubSelected(undefined) } }}>删除所选</button>
                ) : null}
                <label style={{ ...btn, cursor: 'pointer' }}>
                  {subtitles.length === 0 ? '导入字幕 SRT' : `已导入 ${subtitles.length} 条 · 重新导入`}
                  <input type="file" accept=".srt" style={{ display: 'none' }} onChange={event => { importSubtitles(event.target.files?.[0]); event.target.value = '' }} />
                </label>
              </span>
            </div>
            {subtitles.length > 0 ? (
              <div style={{ position: 'relative', height: 30, overflow: 'hidden' }}>
                {subtitles.map(block => {
                  const left = block.startUs / 1e6 * scale
                  const width = Math.max(28, (block.endUs - block.startUs) / 1e6 * scale)
                  const selectedBlock = subSelected === block.id
                  return subEditing === block.id ? (
                    <input
                      key={block.id}
                      autoFocus
                      defaultValue={block.text}
                      onBlur={event => {
                        setSubtitles(current => current.map(item => item.id === block.id ? { ...item, text: event.target.value } : item))
                        setSubEditing(undefined)
                      }}
                      onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); if (event.key === 'Escape') setSubEditing(undefined) }}
                      style={{ position: 'absolute', left, top: 4, width, height: 22, fontSize: 11, padding: '0 6px', borderRadius: 6, border: '1px solid rgba(245,245,245,.6)', background: 'rgba(18,18,18,.95)', color: '#f5f5f5', outline: 'none', zIndex: 3 }}
                    />
                  ) : (
                    <div
                      key={block.id}
                      onPointerDown={event => {
                        event.preventDefault()
                        setSubSelected(block.id)
                        const originX = event.clientX
                        const originStart = block.startUs
                        const move = (moveEvent: PointerEvent) => {
                          const deltaUs = (moveEvent.clientX - originX) / scale * 1e6
                          setSubtitles(current => current.map(item => item.id === block.id ? { ...item, startUs: Math.max(0, Math.round(originStart + deltaUs)), endUs: Math.max(0, Math.round(originStart + deltaUs + (block.endUs - block.startUs))) } : item))
                        }
                        const up = () => {
                          window.removeEventListener('pointermove', move)
                          window.removeEventListener('pointerup', up)
                        }
                        window.addEventListener('pointermove', move)
                        window.addEventListener('pointerup', up)
                      }}
                      onDoubleClick={() => setSubEditing(block.id)}
                      title={`${fmt(block.startUs)}–${fmt(block.endUs)}：${block.text}（拖移 / 双击编辑）`}
                      style={{ position: 'absolute', left, top: 4, width, height: 22, lineHeight: '22px', fontSize: 10.5, padding: '0 6px', borderRadius: 6, border: selectedBlock ? '1px solid rgba(245,245,245,.9)' : '1px solid rgba(255,255,255,.2)', background: selectedBlock ? 'rgba(255,255,255,.16)' : 'rgba(255,255,255,.07)', color: '#ececec', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'grab', zIndex: 2 }}
                    >
                      {block.text}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ fontSize: 11.5, opacity: .55, padding: '6px 0' }}>导入 SRT 后按时间轴排成字幕块：拖移改时间、双击编辑文字；烧录进成片后续接入。</div>
            )}
          </div>
          {exported !== undefined ? (
            <div style={{ marginTop: 10 }}>
              <div style={{ color: '#8fdc9f', marginBottom: 6 }}>导出完成（{fmtBytes(exported.blob.size)}）——点击下方保存到 DirectorX</div>
              <video src={exported.url} controls style={{ width: '100%', maxHeight: 240, borderRadius: 12, background: '#000', border: '1px solid rgba(255,255,255,.1)' }} />
              <div style={row}>
                <button style={primaryBtn} onClick={() => props.onExport(exported.blob, 'video/mp4')}>保存到 DirectorX</button>
                <button style={btn} onClick={() => setExported(undefined)}>返回时间线</button>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div style={{ opacity: .7 }}>正在解析视频（WebAV 解码）…</div>
      )}
    </div>
  )
}
