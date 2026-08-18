import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { Combinator, MP4Clip, OffscreenSprite } from '@webav/av-cliper'
import { dx } from '../canvas-theme.ts'
import { IconPause, IconPlay, IconScissors, IconSkipBack, IconSkipFwd, IconSliders, IconTrash } from './icons.tsx'
import { StudioField, StudioShell, studioBtn } from './studio-chrome.tsx'
import { withProject, projectHeaders } from './project.ts'
import { GRADE_FAMILIES, GRADE_LOOK_LIST, looksByFamily } from '../../providers/grade-catalog.ts'

const LOOKS = GRADE_LOOK_LIST

export interface VideoStudioProps {
  source: string
  name: string
  look?: string | null
  nodeId?: string
  onExport: (blob: Blob, mediaType: string) => void
  onClose: () => void
}

interface Segment { id: number; start: number; end: number }

function fmt(seconds: number): string {
  const total = Math.max(0, seconds)
  const m = Math.floor(total / 60)
  const s = (total % 60).toFixed(1)
  return `${m}:${s.padStart(4, '0')}`
}

export function VideoStudio(props: VideoStudioProps): ReactNode {
  const videoRef = useRef<HTMLVideoElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const clipRef = useRef<MP4Clip | null>(null)
  const [duration, setDuration] = useState(0)
  const [size, setSize] = useState({ width: 1280, height: 720 })
  const [time, setTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [segments, setSegments] = useState<Segment[]>([])
  const [selected, setSelected] = useState<number | undefined>(undefined)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const [progress, setProgress] = useState<number | undefined>(undefined)
  const [exportReady, setExportReady] = useState(false)
  const [loopSelected, setLoopSelected] = useState(false)
  const [trim, setTrim] = useState<'start' | 'end' | 'head' | undefined>(undefined)
  const [lookId, setLookId] = useState<string | undefined>(undefined)
  const [gradeBusy, setGradeBusy] = useState(false)
  const [mode, setMode] = useState<'cut' | 'grade'>('cut')
  const [mediaSrc, setMediaSrc] = useState(props.source)

  useEffect(() => {
    let live = true
    void (async () => {
      try {
        const response = await fetch(props.source)
        if (!response.ok) throw new Error(`视频加载失败 (HTTP ${response.status})`)
        const body = response.body
        if (body === null) throw new Error('视频流不可用')
        const clip = new MP4Clip(body)
        await clip.ready
        if (!live) {
          clip.destroy()
          return
        }
        clipRef.current = clip
        const nextDuration = clip.meta.duration / 1e6
        setDuration(nextDuration)
        setSize({ width: clip.meta.width, height: clip.meta.height })
        setSegments(current => current.length === 0 ? [{ id: 1, start: 0, end: nextDuration }] : current)
        setExportReady(true)
      } catch (cause) {
        if (live) setError(cause instanceof Error ? cause.message : `导出引擎未就绪：${String(cause)}`)
      }
    })()
    return () => {
      live = false
      clipRef.current?.destroy()
      clipRef.current = null
    }
  }, [props.source])

  useEffect(() => {
    setMediaSrc(props.source)
  }, [props.source])

  useEffect(() => {
    if (props.look === undefined || props.look === null || props.look === '') return
    setLookId(props.look)
  }, [props.look, props.source])

  const seek = useCallback((next: number) => {
    const video = videoRef.current
    const clamped = Math.min(Math.max(0, next), duration || next)
    if (video !== null) video.currentTime = clamped
    setTime(clamped)
  }, [duration])

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (video === null) return
    if (video.paused) void video.play()
    else video.pause()
  }, [])

  const split = useCallback(() => {
    const at = videoRef.current?.currentTime ?? time
    setSegments(current => {
      const hit = current.find(segment => at > segment.start + 0.05 && at < segment.end - 0.05)
      if (hit === undefined) return current
      const nextId = Math.max(...current.map(segment => segment.id)) + 1
      return current.flatMap(segment => segment.id === hit.id
        ? [{ ...segment, end: at }, { id: nextId, start: at, end: segment.end }]
        : [segment])
    })
  }, [time])

  const remove = useCallback(() => {
    if (selected === undefined) return
    setSegments(current => current.filter(segment => segment.id !== selected))
    setSelected(undefined)
  }, [selected])

  const patchSelected = (patch: Partial<Segment>) => {
    if (selected === undefined) return
    setSegments(current => current.map(segment => {
      if (segment.id !== selected) return segment
      const neighbors = current.filter(item => item.id !== selected)
      const prev = neighbors.filter(item => item.end <= segment.start).sort((a, b) => b.end - a.end)[0]
      const next = neighbors.filter(item => item.start >= segment.end).sort((a, b) => a.start - b.start)[0]
      const start = Math.max(prev?.end ?? 0, Math.min(patch.start ?? segment.start, (patch.end ?? segment.end) - 0.05))
      const end = Math.min(next?.start ?? duration, Math.max(patch.end ?? segment.end, start + 0.05))
      return { ...segment, start, end }
    }))
  }

  const applyLook = useCallback(async () => {
    if (lookId === undefined) return
    setGradeBusy(true)
    setError(undefined)
    try {
      const response = await fetch(withProject('/directorx/studio'), {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...projectHeaders() },
        body: JSON.stringify({
          path: props.name,
          look: lookId,
          kind: 'video',
          ...(props.nodeId !== undefined ? { nodeId: props.nodeId } : {}),
        }),
      })
      const body = await response.json() as { ok?: boolean; message?: string; path?: string }
      if (!response.ok || body.ok === false) throw new Error(body.message ?? `调色失败 (${response.status})`)
      if (typeof body.path === 'string' && body.path !== '') {
        const blob = await fetch(body.path.startsWith('http') ? body.path : withProject(`/directorx/media?path=${encodeURIComponent(body.path)}`)).then(item => item.blob())
        const next = URL.createObjectURL(blob)
        setMediaSrc(current => {
          if (current.startsWith('blob:')) URL.revokeObjectURL(current)
          return next
        })
        const clip = new MP4Clip(blob.stream())
        await clip.ready
        clipRef.current?.destroy()
        clipRef.current = clip
        setLookId(undefined)
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setGradeBusy(false)
    }
  }, [lookId, props])

  const exportMp4 = useCallback(async () => {
    const clip = clipRef.current
    if (clip === null || segments.length === 0) return
    setBusy(true)
    setError(undefined)
    setProgress(undefined)
    try {
      if (!await Combinator.isSupported({ width: size.width, height: size.height })) {
        throw new Error('当前浏览器不支持 WebCodecs 导出（需要 Chrome/Edge）')
      }
      const durationUs = Math.round(duration * 1e6)
      const cuts = [...new Set(segments.flatMap(segment => [Math.round(segment.start * 1e6), Math.round(segment.end * 1e6)]))]
        .filter(stamp => stamp > 0 && stamp < durationUs)
        .sort((a, b) => a - b)
      let cursor = 0
      let rest = await clip.clone()
      const parts: Array<{ part: MP4Clip; start: number; end: number }> = []
      for (const cut of cuts) {
        const [piece, tail] = await rest.split(cut)
        parts.push({ part: piece, start: cursor, end: cut })
        rest = tail
        cursor = cut
      }
      parts.push({ part: rest, start: cursor, end: durationUs })
      const combinator = new Combinator({ width: size.width, height: size.height })
      let offset = 0
      for (const segment of segments) {
        const start = Math.round(segment.start * 1e6)
        const end = Math.round(segment.end * 1e6)
        const part = parts.find(entry => entry.start === start && entry.end === end)?.part
        if (part === undefined) throw new Error('片段在导出时丢失')
        const sprite = new OffscreenSprite(part)
        sprite.time = { offset, duration: end - start }
        await combinator.addSprite(sprite)
        offset += end - start
      }
      combinator.on('OutputProgress', value => setProgress(value))
      const blob = await new Response(combinator.output()).blob()
      props.onExport(blob, 'video/mp4')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }, [duration, props, segments, size.height, size.width])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing = typeof target?.matches === 'function' && target.matches('input, textarea')
      if (typing) return
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        void exportMp4()
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        props.onClose()
        return
      }
      if (event.key === ' ') {
        event.preventDefault()
        togglePlay()
      }
      if (event.key.toLowerCase() === 's') split()
      if (event.key === 'Delete' || event.key === 'Backspace') remove()
      if (event.key === 'ArrowLeft') seek(time - (event.shiftKey ? 1 : 0.1))
      if (event.key === 'ArrowRight') seek(time + (event.shiftKey ? 1 : 0.1))
      if (event.key.toLowerCase() === 'i' && selected !== undefined) patchSelected({ start: time })
      if (event.key.toLowerCase() === 'o' && selected !== undefined) patchSelected({ end: time })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const timeAt = (event: PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current
    if (track === null || duration <= 0) return 0
    const rect = track.getBoundingClientRect()
    return Math.min(duration, Math.max(0, ((event.clientX - rect.left) / rect.width) * duration))
  }

  const selectedSeg = segments.find(segment => segment.id === selected)
  const kept = segments.reduce((sum, segment) => sum + (segment.end - segment.start), 0)
  const filename = props.name.split('/').pop() ?? props.name

  return (
    <StudioShell
      title="视频编辑"
      filename={filename}
      meta={`${fmt(time)} / ${fmt(duration)} · ${size.width}×${size.height} · ${segments.length} 段`}
      error={error}
      saveLabel={busy ? `导出中…${progress !== undefined ? ` ${Math.round(progress * 100)}%` : ''}` : '保存到画布'}
      saveDisabled={busy || segments.length === 0 || !exportReady}
      onSave={() => { void exportMp4() }}
      onClose={props.onClose}
      tools={[
        { id: 'cut', label: '剪辑', icon: <IconScissors size={15} /> },
        { id: 'grade', label: '调色', icon: <IconSliders size={15} /> },
      ]}
      tool={mode}
      onTool={id => setMode(id === 'grade' ? 'grade' : 'cut')}
      inspector={mode === 'grade' ? (
        <>
          <div style={{ fontSize: 11, letterSpacing: 0.3, textTransform: 'uppercase', color: dx.mute, marginBottom: 12 }}>色调</div>
          {GRADE_FAMILIES.map(family => (
            <div key={family.id} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: dx.mute, marginBottom: 4 }}>{family.label}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {looksByFamily(family.id).map(item => (
                  <button
                    key={item.id}
                    className="dx-hit"
                    title={item.source}
                    style={{ ...studioBtn, background: lookId === item.id ? 'rgba(255,255,255,.14)' : studioBtn.background }}
                    onClick={() => setLookId(current => current === item.id ? undefined : item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button className="dx-hit" style={studioBtn} disabled={lookId === undefined || gradeBusy} onClick={() => { void applyLook() }}>
            {gradeBusy ? '调色中…' : '应用到预览'}
          </button>
          <div style={{ marginTop: 10, fontSize: 11, color: dx.dim, lineHeight: 1.5 }}>调色只改预览，确认后点「保存到画布」。</div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 11, letterSpacing: 0.3, textTransform: 'uppercase', color: dx.mute, marginBottom: 12 }}>剪辑</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            <button className="dx-hit" style={studioBtn} onClick={() => seek(Math.max(0, time - 1))}><IconSkipBack size={13} /> -1s</button>
            <button className="dx-hit" style={studioBtn} onClick={togglePlay}>{playing ? '暂停' : '播放'}</button>
            <button className="dx-hit" style={studioBtn} onClick={() => seek(time + 1)}><IconSkipFwd size={13} /> +1s</button>
            <button className="dx-hit" style={studioBtn} onClick={split}>分割</button>
            <button className="dx-hit" style={studioBtn} disabled={selected === undefined} onClick={remove}><IconTrash size={13} />删除</button>
          </div>
          <StudioField label="保留时长">
            <div style={{ color: dx.ink }}>{fmt(kept)} / {fmt(duration)}</div>
          </StudioField>
          {selectedSeg !== undefined ? (
            <>
              <StudioField label="入点 / 出点">
                <div style={{ color: dx.ink }}>{fmt(selectedSeg.start)} → {fmt(selectedSeg.end)}</div>
              </StudioField>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: dx.mute }}>
                <input type="checkbox" checked={loopSelected} onChange={event => setLoopSelected(event.target.checked)} />
                循环当前片段
              </label>
            </>
          ) : (
            <div style={{ fontSize: 12, color: dx.dim, lineHeight: 1.6 }}>空格播放，S 分割，I / O 设入出点，方向键微调，Delete 删除选中片段。</div>
          )}
          {!exportReady ? <div style={{ marginTop: 12, fontSize: 11, color: dx.mute }}>预览可用。导出引擎仍在准备，保存会在就绪后解锁。</div> : null}
        </>
      )}
      footer={(
        <div className="dx-timeline" style={{ padding: '10px 16px 16px', borderTop: `1px solid ${dx.hairline}`, background: 'rgba(10,10,10,.92)' }}>
          <div
            ref={trackRef}
            onPointerDown={event => {
              if ((event.target as HTMLElement).closest('[data-handle]')) return
              const at = timeAt(event)
              seek(at)
              setTrim('head')
              event.currentTarget.setPointerCapture(event.pointerId)
            }}
            onPointerMove={event => {
              if (trim === undefined) return
              const at = timeAt(event)
              if (trim === 'head') seek(at)
              if (trim === 'start') patchSelected({ start: at })
              if (trim === 'end') patchSelected({ end: at })
            }}
            onPointerUp={() => setTrim(undefined)}
            style={{
              position: 'relative', height: 64, borderRadius: 12,
              background: 'rgba(255,255,255,.04)', border: `1px solid ${dx.hairline}`,
              overflow: 'hidden', touchAction: 'none',
            }}
          >
            {duration > 0 ? segments.map(segment => {
              const left = (segment.start / duration) * 100
              const width = ((segment.end - segment.start) / duration) * 100
              const active = selected === segment.id
              return (
                <div
                  key={segment.id}
                  onPointerDown={event => {
                    event.stopPropagation()
                    setSelected(segment.id)
                    seek(segment.start)
                  }}
                  style={{
                    position: 'absolute', top: 10, bottom: 10, left: `${left}%`, width: `${width}%`,
                    borderRadius: 8, background: active ? 'rgba(243,243,243,.22)' : 'rgba(255,255,255,.10)',
                    border: `1px solid ${active ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.12)'}`,
                    boxSizing: 'border-box',
                  }}
                >
                  <span style={{ position: 'absolute', left: 8, top: 6, fontSize: 10, color: dx.mute }}>
                    {fmt(segment.end - segment.start)}
                  </span>
                  {active ? (
                    <>
                      <span
                        data-handle="start"
                        onPointerDown={event => {
                          event.stopPropagation()
                          setTrim('start')
                          ;(event.currentTarget.parentElement?.parentElement as HTMLElement | null)?.setPointerCapture(event.pointerId)
                        }}
                        style={{ position: 'absolute', left: -5, top: 4, bottom: 4, width: 10, borderRadius: 99, background: '#f3f3f3', cursor: 'ew-resize' }}
                      />
                      <span
                        data-handle="end"
                        onPointerDown={event => {
                          event.stopPropagation()
                          setTrim('end')
                          ;(event.currentTarget.parentElement?.parentElement as HTMLElement | null)?.setPointerCapture(event.pointerId)
                        }}
                        style={{ position: 'absolute', right: -5, top: 4, bottom: 4, width: 10, borderRadius: 99, background: '#f3f3f3', cursor: 'ew-resize' }}
                      />
                    </>
                  ) : null}
                </div>
              )
            }) : null}
            {duration > 0 ? (
              <div style={{
                position: 'absolute', top: 0, bottom: 0, left: `${(time / duration) * 100}%`,
                width: 2, marginLeft: -1, background: '#f3f3f3', pointerEvents: 'none',
                boxShadow: '0 0 0 1px rgba(0,0,0,.45)',
              }}>
                <span style={{
                  position: 'absolute', top: 2, left: 6, padding: '1px 5px', borderRadius: 4,
                  background: 'rgba(12,12,12,.82)', color: '#f3f3f3', fontSize: 10, whiteSpace: 'nowrap',
                }}>
                  {fmt(time)}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      )}
    >
      <div style={{ flex: 1, minHeight: 0, display: 'grid', placeItems: 'center', padding: 16, background: '#050505', position: 'relative' }}>
        <button
          className="dx-hit"
          onClick={togglePlay}
          title={playing ? '暂停' : '播放'}
          style={{
            position: 'absolute', left: 20, bottom: 20, zIndex: 2,
            ...studioBtn, width: 36, height: 36, padding: 0,
          }}
        >
          {playing ? <IconPause size={15} /> : <IconPlay size={15} />}
        </button>
        <video
          ref={videoRef}
          src={mediaSrc}
          preload="auto"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onLoadedMetadata={event => {
            const media = event.currentTarget
            const next = media.duration
            const width = media.videoWidth
            const height = media.videoHeight
            if (Number.isFinite(next) && next > 0) {
              setDuration(current => current > 0 ? current : next)
              setSize(current => current.width === 1280 ? { width: width || current.width, height: height || current.height } : current)
              setSegments(current => current.length === 0 ? [{ id: 1, start: 0, end: next }] : current)
            }
          }}
          onTimeUpdate={event => {
            const media = event.currentTarget
            const now = media.currentTime
            setTime(now)
            if (loopSelected && selectedSeg !== undefined && now >= selectedSeg.end - 0.04) {
              media.currentTime = selectedSeg.start
            }
          }}
          style={{ width: '100%', height: '100%', maxHeight: '100%', objectFit: 'contain', background: '#000', borderRadius: 12, filter: LOOKS.find(item => item.id === lookId)?.css ?? 'none' }}
        />
      </div>
    </StudioShell>
  )
}
