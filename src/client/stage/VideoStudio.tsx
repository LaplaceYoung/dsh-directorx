import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { Combinator, MP4Clip, OffscreenSprite } from '@webav/av-cliper'
import { dx } from '../canvas-theme.ts'
import {
  IconDownload, IconPause, IconPlay, IconScissors, IconSkipBack, IconSkipFwd, IconSliders, IconTrash,
} from './icons.tsx'
import { StudioField, StudioShell, studioBtn, studioRange } from './studio-chrome.tsx'
import { withProject, projectHeaders } from './project.ts'
import { GRADE_FAMILIES, GRADE_LOOK_LIST, looksByFamily } from '../../providers/grade-catalog.ts'
import {
  clipPlayDuration, clipStarts, duplicateClip, exportBitrate, exportSize, fmtClock, fromSource, hitTest,
  moveClip, moveTo, nextClipId, patchClip, removeClip, sequenceDuration, splitAt, tickStep, trimClip,
  type ExportFps, type ExportQuality, type ExportScale, type TimelineClip,
} from './timeline-edit.ts'

const LOOKS = GRADE_LOOK_LIST
const SPEEDS = [0.5, 1, 1.5, 2] as const

export interface VideoStudioProps {
  source: string
  name: string
  look?: string | null
  nodeId?: string
  onExport: (blob: Blob, mediaType: string) => void
  onClose: () => void
}

type DragState =
  | { kind: 'head' }
  | { kind: 'in' | 'out' | 'move'; id: number; origin: TimelineClip[] }

export function VideoStudio(props: VideoStudioProps): ReactNode {
  const videoRef = useRef<HTMLVideoElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const clipRef = useRef<MP4Clip | null>(null)
  const playRef = useRef<{ origin: number; seq: number } | undefined>(undefined)
  const historyRef = useRef<TimelineClip[][]>([])
  const redoRef = useRef<TimelineClip[][]>([])
  const [sourceDuration, setSourceDuration] = useState(0)
  const [size, setSize] = useState({ width: 1280, height: 720 })
  const [time, setTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [clips, setClips] = useState<TimelineClip[]>([])
  const [selected, setSelected] = useState<number | undefined>(undefined)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const [progress, setProgress] = useState<number | undefined>(undefined)
  const [exportReady, setExportReady] = useState(false)
  const [loopSelected, setLoopSelected] = useState(false)
  const [drag, setDrag] = useState<DragState | undefined>(undefined)
  const [lookId, setLookId] = useState<string | undefined>(undefined)
  const [gradeBusy, setGradeBusy] = useState(false)
  const [mode, setMode] = useState<'cut' | 'grade' | 'export'>('cut')
  const [mediaSrc, setMediaSrc] = useState(props.source)
  const [pxPerSec, setPxPerSec] = useState(80)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [exportScale, setExportScale] = useState<ExportScale>('orig')
  const [exportQuality, setExportQuality] = useState<ExportQuality>('standard')
  const [exportFps, setExportFps] = useState<ExportFps>(30)
  const [exportAudio, setExportAudio] = useState(true)
  const [transition, setTransition] = useState<'cut' | 'fade'>('cut')

  const seqLen = sequenceDuration(clips)
  const starts = clipStarts(clips)
  const selectedClip = clips.find(clip => clip.id === selected)

  const syncStacks = (history: TimelineClip[][], redo: TimelineClip[][]) => {
    setCanUndo(history.length > 0)
    setCanRedo(redo.length > 0)
  }

  const commitClips = useCallback((next: TimelineClip[] | ((current: TimelineClip[]) => TimelineClip[])) => {
    setClips(current => {
      const resolved = typeof next === 'function' ? next(current) : next
      if (resolved === current) return current
      historyRef.current.push(current)
      if (historyRef.current.length > 40) historyRef.current.shift()
      redoRef.current = []
      syncStacks(historyRef.current, redoRef.current)
      return resolved
    })
  }, [])

  const undo = useCallback(() => {
    const prev = historyRef.current.pop()
    if (prev === undefined) return
    setClips(current => {
      redoRef.current.push(current)
      syncStacks(historyRef.current, redoRef.current)
      return prev
    })
  }, [])

  const redo = useCallback(() => {
    const next = redoRef.current.pop()
    if (next === undefined) return
    setClips(current => {
      historyRef.current.push(current)
      syncStacks(historyRef.current, redoRef.current)
      return next
    })
  }, [])

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
        setSourceDuration(nextDuration)
        setSize({ width: clip.meta.width, height: clip.meta.height })
        setClips(current => current.length === 0 ? fromSource(nextDuration) : current)
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

  const applySeqTime = useCallback((seqTime: number, play = false) => {
    const total = sequenceDuration(clips)
    const clamped = Math.min(Math.max(0, seqTime), Math.max(0, total))
    setTime(clamped)
    const hit = hitTest(clips, clamped)
    const video = videoRef.current
    if (hit === undefined || video === null) return
    video.playbackRate = hit.clip.speed
    video.muted = hit.clip.muted || !exportAudio
    if (Math.abs(video.currentTime - hit.sourceTime) > 0.05) video.currentTime = hit.sourceTime
    if (play && video.paused) void video.play()
  }, [clips, exportAudio])

  const seek = useCallback((seqTime: number) => {
    applySeqTime(seqTime, false)
  }, [applySeqTime])

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (video === null) return
    if (playing) {
      video.pause()
      playRef.current = undefined
      setPlaying(false)
      return
    }
    playRef.current = { origin: performance.now(), seq: time }
    setPlaying(true)
    applySeqTime(time, true)
  }, [applySeqTime, playing, time])

  useEffect(() => {
    if (!playing) return
    let frame = 0
    const tick = (now: number) => {
      const mark = playRef.current
      if (mark === undefined) return
      let next = mark.seq + (now - mark.origin) / 1000
      const total = sequenceDuration(clips)
      const hit = hitTest(clips, Math.min(next, total))
      if (loopSelected && selected !== undefined && hit?.clip.id === selected && hit.local >= clipPlayDuration(hit.clip) - 0.04) {
        next = hit.start
        playRef.current = { origin: now, seq: next }
      } else if (next >= total - 0.02) {
        videoRef.current?.pause()
        playRef.current = undefined
        setPlaying(false)
        setTime(total)
        return
      }
      applySeqTime(next, true)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [applySeqTime, clips, loopSelected, playing, selected])

  const split = useCallback(() => {
    commitClips(current => splitAt(current, time, nextClipId(current)))
  }, [commitClips, time])

  const remove = useCallback(() => {
    if (selected === undefined) return
    commitClips(current => removeClip(current, selected))
    setSelected(undefined)
  }, [commitClips, selected])

  const duplicate = useCallback(() => {
    if (selected === undefined) return
    commitClips(current => duplicateClip(current, selected, nextClipId(current)))
  }, [commitClips, selected])

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

  const exportMp4 = useCallback(async (mode: 'canvas' | 'file' = 'canvas') => {
    const source = clipRef.current
    if (source === null || clips.length === 0) return
    setBusy(true)
    setError(undefined)
    setProgress(undefined)
    try {
      const out = exportSize(size.width, size.height, exportScale)
      if (!await Combinator.isSupported({ width: out.width, height: out.height })) {
        throw new Error('当前浏览器不支持 WebCodecs 导出（需要 Chrome/Edge）')
      }
      const combinator = new Combinator({
        width: out.width,
        height: out.height,
        bitrate: exportBitrate(exportQuality),
        fps: exportFps,
        ...(exportAudio && !clips.every(clip => clip.muted) ? {} : { audio: false as const }),
      })
      let offset = 0
      const fadePad = transition === 'fade' ? 0.3 : 0
      for (const clip of clips) {
        const span = Math.max(0.05, clip.sourceOut - clip.sourceIn)
        const play = clipPlayDuration(clip)
        const cloned = await source.clone()
        const cutIn = Math.round(clip.sourceIn * 1e6)
        let piece = cloned
        if (cutIn > 0) {
          const [head, tail] = await cloned.split(cutIn)
          head.destroy()
          piece = tail
        }
        const cutLen = Math.round(span * 1e6)
        if (cutLen > 0 && cutLen < piece.meta.duration) {
          const [keep, rest] = await piece.split(cutLen)
          rest.destroy()
          piece = keep
        }
        const sprite = new OffscreenSprite(piece)
        sprite.rect.w = out.width
        sprite.rect.h = out.height
        sprite.time = {
          offset: Math.round(offset * 1e6),
          duration: Math.round(play * 1e6),
          playbackRate: clip.speed,
        }
        const fadeIn = Math.max(clip.fadeIn, fadePad)
        const fadeOut = Math.max(clip.fadeOut, fadePad)
        if (fadeIn > 0 || fadeOut > 0) {
          const inPct = Math.min(40, (fadeIn / play) * 100)
          const outPct = Math.max(inPct + 10, 100 - Math.min(40, (fadeOut / play) * 100))
          sprite.setAnimation({
            '0%': { opacity: fadeIn > 0 ? 0 : 1 },
            [`${Math.round(inPct)}%`]: { opacity: 1 },
            [`${Math.round(outPct)}%`]: { opacity: 1 },
            '100%': { opacity: fadeOut > 0 ? 0 : 1 },
          }, { duration: Math.round(play * 1e6) })
        }
        await combinator.addSprite(sprite)
        offset += play
      }
      combinator.on('OutputProgress', value => setProgress(value))
      const blob = await new Response(combinator.output()).blob()
      if (mode === 'file') {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        const stem = (props.name.split('/').pop() ?? 'edit').replace(/\.[^.]+$/, '')
        link.href = url
        link.download = `${stem}-cut.mp4`
        link.click()
        window.setTimeout(() => URL.revokeObjectURL(url), 4000)
      } else {
        props.onExport(blob, 'video/mp4')
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }, [clips, exportAudio, exportFps, exportQuality, exportScale, props, size.height, size.width, transition])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing = typeof target?.matches === 'function' && target.matches('input, textarea')
      if (typing) return
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
        return
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        void exportMp4('canvas')
        return
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'd') {
        event.preventDefault()
        duplicate()
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
      if (event.key.toLowerCase() === 's' && !event.metaKey) split()
      if (event.key === 'Delete' || event.key === 'Backspace') remove()
      if (event.key === 'ArrowLeft') seek(time - (event.shiftKey ? 1 : 1 / 30))
      if (event.key === 'ArrowRight') seek(time + (event.shiftKey ? 1 : 1 / 30))
      if (event.key === '[') commitClips(current => moveClip(current, selected ?? -1, -1))
      if (event.key === ']') commitClips(current => moveClip(current, selected ?? -1, 1))
      if (event.key === '=' || event.key === '+') setPxPerSec(value => Math.min(240, value + 20))
      if (event.key === '-') setPxPerSec(value => Math.max(32, value - 20))
      if (event.key.toLowerCase() === 'i' && selectedClip !== undefined) {
        const hit = hitTest(clips, time)
        if (hit !== undefined) commitClips(current => trimClip(current, selectedClip.id, 'in', hit.sourceTime, sourceDuration))
      }
      if (event.key.toLowerCase() === 'o' && selectedClip !== undefined) {
        const hit = hitTest(clips, time)
        if (hit !== undefined) commitClips(current => trimClip(current, selectedClip.id, 'out', hit.sourceTime, sourceDuration))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const seqAt = (event: PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current
    if (track === null) return 0
    const rect = track.getBoundingClientRect()
    const x = event.clientX - rect.left + track.scrollLeft - 56
    return Math.max(0, x / pxPerSec)
  }

  const filename = props.name.split('/').pop() ?? props.name
  const kept = seqLen
  const outSize = exportSize(size.width, size.height, exportScale)
  const timelineWidth = Math.max(640, seqLen * pxPerSec + 80)
  const step = tickStep(pxPerSec)

  return (
    <StudioShell
      title="时间线"
      filename={filename}
      meta={`${fmtClock(time)} / ${fmtClock(seqLen)} · ${clips.length} 段 · ${size.width}×${size.height}`}
      error={error}
      saveLabel={busy ? `导出中…${progress !== undefined ? ` ${Math.round(progress * 100)}%` : ''}` : '保存到画布'}
      saveDisabled={busy || clips.length === 0 || !exportReady}
      onSave={() => { void exportMp4('canvas') }}
      onClose={props.onClose}
      canUndo={canUndo}
      canRedo={canRedo}
      onUndo={undo}
      onRedo={redo}
      tools={[
        { id: 'cut', label: '剪辑', icon: <IconScissors size={15} /> },
        { id: 'grade', label: '调色', icon: <IconSliders size={15} /> },
        { id: 'export', label: '导出', icon: <IconDownload size={15} /> },
      ]}
      tool={mode}
      onTool={id => setMode(id === 'grade' ? 'grade' : id === 'export' ? 'export' : 'cut')}
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
          <div style={{ marginTop: 10, fontSize: 11, color: dx.dim, lineHeight: 1.5 }}>调色只改预览，确认后到「导出」保存或下载。</div>
        </>
      ) : mode === 'export' ? (
        <>
          <StudioField label="分辨率">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {([
                ['orig', '原始'],
                ['1080', '1080p'],
                ['720', '720p'],
                ['480', '480p'],
              ] as const).map(([id, label]) => (
                <button key={id} className="dx-hit" style={{ ...studioBtn, background: exportScale === id ? 'rgba(255,255,255,.14)' : studioBtn.background }} onClick={() => setExportScale(id)}>{label}</button>
              ))}
            </div>
          </StudioField>
          <StudioField label="画质">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {([
                ['high', '高'],
                ['standard', '标准'],
                ['draft', '草稿'],
              ] as const).map(([id, label]) => (
                <button key={id} className="dx-hit" style={{ ...studioBtn, background: exportQuality === id ? 'rgba(255,255,255,.14)' : studioBtn.background }} onClick={() => setExportQuality(id)}>{label}</button>
              ))}
            </div>
          </StudioField>
          <StudioField label="帧率">
            <div style={{ display: 'flex', gap: 6 }}>
              {([24, 30] as const).map(fps => (
                <button key={fps} className="dx-hit" style={{ ...studioBtn, background: exportFps === fps ? 'rgba(255,255,255,.14)' : studioBtn.background }} onClick={() => setExportFps(fps)}>{fps} fps</button>
              ))}
            </div>
          </StudioField>
          <StudioField label="转场">
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="dx-hit" style={{ ...studioBtn, background: transition === 'cut' ? 'rgba(255,255,255,.14)' : studioBtn.background }} onClick={() => setTransition('cut')}>硬切</button>
              <button className="dx-hit" style={{ ...studioBtn, background: transition === 'fade' ? 'rgba(255,255,255,.14)' : studioBtn.background }} onClick={() => setTransition('fade')}>叠化</button>
            </div>
          </StudioField>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: dx.mute, marginBottom: 14 }}>
            <input type="checkbox" checked={exportAudio} onChange={event => setExportAudio(event.target.checked)} />
            导出音轨
          </label>
          <div style={{ fontSize: 11, color: dx.dim, marginBottom: 12 }}>{outSize.width}×{outSize.height} · {fmtClock(kept)}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <button className="dx-hit" style={studioBtn} disabled={busy || clips.length === 0} onClick={() => { void exportMp4('canvas') }}>保存到画布</button>
            <button className="dx-hit" style={studioBtn} disabled={busy || clips.length === 0} onClick={() => { void exportMp4('file') }}>导出文件</button>
          </div>
          {!exportReady ? <div style={{ marginTop: 12, fontSize: 11, color: dx.mute }}>预览可用。导出引擎仍在准备。</div> : null}
        </>
      ) : (
        <>
          <div style={{ fontSize: 11, letterSpacing: 0.3, textTransform: 'uppercase', color: dx.mute, marginBottom: 12 }}>剪辑</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            <button className="dx-hit" style={studioBtn} onClick={() => seek(Math.max(0, time - 1))}><IconSkipBack size={13} /> -1s</button>
            <button className="dx-hit" style={studioBtn} onClick={togglePlay}>{playing ? '暂停' : '播放'}</button>
            <button className="dx-hit" style={studioBtn} onClick={() => seek(time + 1)}><IconSkipFwd size={13} /> +1s</button>
            <button className="dx-hit" style={studioBtn} onClick={split}>分割</button>
            <button className="dx-hit" style={studioBtn} disabled={selected === undefined} onClick={duplicate}>复制</button>
            <button className="dx-hit" style={studioBtn} disabled={selected === undefined} onClick={remove}><IconTrash size={13} />删除</button>
          </div>
          <StudioField label="成片时长">
            <div style={{ color: dx.ink }}>{fmtClock(kept)} · 源 {fmtClock(sourceDuration)}</div>
          </StudioField>
          {selectedClip !== undefined ? (
            <>
              <StudioField label="入点 / 出点">
                <div style={{ color: dx.ink }}>{fmtClock(selectedClip.sourceIn)} → {fmtClock(selectedClip.sourceOut)}</div>
              </StudioField>
              <StudioField label="速度">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {SPEEDS.map(speed => (
                    <button
                      key={speed}
                      className="dx-hit"
                      style={{ ...studioBtn, background: selectedClip.speed === speed ? 'rgba(255,255,255,.14)' : studioBtn.background }}
                      onClick={() => commitClips(current => patchClip(current, selectedClip.id, { speed }))}
                    >
                      {speed}×
                    </button>
                  ))}
                </div>
              </StudioField>
              <StudioField label={`淡入 ${selectedClip.fadeIn.toFixed(1)}s`}>
                <input type="range" min={0} max={2} step={0.1} value={selectedClip.fadeIn} onChange={event => commitClips(current => patchClip(current, selectedClip.id, { fadeIn: Number(event.target.value) }))} style={studioRange()} />
              </StudioField>
              <StudioField label={`淡出 ${selectedClip.fadeOut.toFixed(1)}s`}>
                <input type="range" min={0} max={2} step={0.1} value={selectedClip.fadeOut} onChange={event => commitClips(current => patchClip(current, selectedClip.id, { fadeOut: Number(event.target.value) }))} style={studioRange()} />
              </StudioField>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                <button className="dx-hit" style={studioBtn} onClick={() => commitClips(current => moveClip(current, selectedClip.id, -1))}>左移</button>
                <button className="dx-hit" style={studioBtn} onClick={() => commitClips(current => moveClip(current, selectedClip.id, 1))}>右移</button>
                <button className="dx-hit" style={studioBtn} onClick={() => commitClips(current => patchClip(current, selectedClip.id, { muted: !selectedClip.muted }))}>{selectedClip.muted ? '取消静音' : '静音'}</button>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: dx.mute }}>
                <input type="checkbox" checked={loopSelected} onChange={event => setLoopSelected(event.target.checked)} />
                循环当前片段
              </label>
            </>
          ) : (
            <div style={{ fontSize: 12, color: dx.dim, lineHeight: 1.6 }}>空格播放，S 分割，I / O 设入出点，[ ] 调序，Delete 删除。滚轮缩放时间线。</div>
          )}
        </>
      )}
      footer={(
        <div className="dx-timeline" style={{ borderTop: `1px solid ${dx.hairline}`, background: '#0b0b0b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px 6px' }}>
            <button className="dx-hit" style={{ ...studioBtn, width: 32, height: 28, padding: 0 }} onClick={togglePlay} title="播放">
              {playing ? <IconPause size={13} /> : <IconPlay size={13} />}
            </button>
            <span style={{ fontSize: 11, color: dx.mute, fontVariantNumeric: 'tabular-nums', minWidth: 92 }}>{fmtClock(time)} / {fmtClock(seqLen)}</span>
            <button className="dx-hit" style={studioBtn} onClick={split}>分割</button>
            <button className="dx-hit" style={studioBtn} disabled={selected === undefined} onClick={remove}>删除</button>
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: 11, color: dx.dim }}>缩放</span>
            <input
              type="range"
              min={32}
              max={240}
              value={pxPerSec}
              onChange={event => setPxPerSec(Number(event.target.value))}
              style={{ width: 100, accentColor: '#f3f3f3' }}
            />
          </div>
          <div
            ref={trackRef}
            className="dx-timeline-board"
            onWheel={event => {
              if (!event.ctrlKey && !event.metaKey) return
              event.preventDefault()
              setPxPerSec(value => Math.min(240, Math.max(32, value + (event.deltaY > 0 ? -16 : 16))))
            }}
            onPointerDown={event => {
              if ((event.target as HTMLElement).closest('[data-clip]')) return
              const at = seqAt(event)
              seek(at)
              setDrag({ kind: 'head' })
              event.currentTarget.setPointerCapture(event.pointerId)
            }}
            onPointerMove={event => {
              if (drag === undefined) return
              const at = seqAt(event)
              if (drag.kind === 'head') {
                seek(at)
                return
              }
              const origin = drag.origin
              const clip = origin.find(item => item.id === drag.id)
              if (clip === undefined) return
              const index = origin.findIndex(item => item.id === drag.id)
              const start = clipStarts(origin)[index] ?? 0
              const play = clipPlayDuration(clip)
              if (drag.kind === 'in') {
                const nextPlay = Math.max(0.05, start + play - at)
                setClips(trimClip(origin, clip.id, 'in', clip.sourceOut - nextPlay * clip.speed, sourceDuration))
                return
              }
              if (drag.kind === 'out') {
                const nextPlay = Math.max(0.05, at - start)
                setClips(trimClip(origin, clip.id, 'out', clip.sourceIn + nextPlay * clip.speed, sourceDuration))
                return
              }
              const over = hitTest(origin, at)?.index ?? index
              setClips(moveTo(origin, clip.id, over))
            }}
            onPointerUp={() => {
              if (drag !== undefined && drag.kind !== 'head') {
                const origin = drag.origin
                setClips(current => {
                  if (current === origin) return current
                  historyRef.current.push(origin)
                  if (historyRef.current.length > 40) historyRef.current.shift()
                  redoRef.current = []
                  syncStacks(historyRef.current, redoRef.current)
                  return current
                })
              }
              setDrag(undefined)
            }}
            style={{ overflowX: 'auto', padding: '0 12px 12px', touchAction: 'none' }}
          >
            <div style={{ position: 'relative', width: timelineWidth, minHeight: 148 }}>
              <div style={{ height: 22, marginLeft: 56, position: 'relative', borderBottom: `1px solid ${dx.hairline}` }}>
                {Array.from({ length: Math.ceil(Math.max(seqLen, 1) / step) + 1 }, (_, index) => {
                  const mark = index * step
                  return (
                    <span key={mark} style={{ position: 'absolute', left: mark * pxPerSec, top: 4, fontSize: 10, color: dx.dim, fontVariantNumeric: 'tabular-nums' }}>
                      {fmtClock(mark)}
                    </span>
                  )
                })}
              </div>
              {(['V1', 'A1'] as const).map((lane, laneIndex) => (
                <div key={lane} style={{ display: 'flex', alignItems: 'stretch', height: laneIndex === 0 ? 64 : 36, marginTop: 8 }}>
                  <div style={{ width: 56, flexShrink: 0, fontSize: 10, color: dx.mute, display: 'grid', placeItems: 'center', borderRight: `1px solid ${dx.hairline}` }}>{lane}</div>
                  <div style={{ position: 'relative', flex: 1, borderRadius: 8, background: 'rgba(255,255,255,.03)', border: `1px solid ${dx.hairline}` }}>
                    {clips.map((clip, index) => {
                      const start = starts[index] ?? 0
                      const width = Math.max(8, clipPlayDuration(clip) * pxPerSec)
                      const left = start * pxPerSec
                      const active = selected === clip.id
                      if (laneIndex === 1) {
                        return (
                          <div
                            key={`a-${clip.id}`}
                            style={{
                              position: 'absolute', top: 6, bottom: 6, left, width,
                              borderRadius: 4,
                              background: clip.muted ? 'repeating-linear-gradient(135deg, rgba(255,255,255,.05) 0 6px, rgba(255,255,255,.02) 6px 12px)' : 'rgba(120,180,140,.28)',
                            }}
                          />
                        )
                      }
                      return (
                        <div
                          key={clip.id}
                          data-clip=""
                          onPointerDown={event => {
                            event.stopPropagation()
                            setSelected(clip.id)
                            seek(start)
                            setDrag({ kind: 'move', id: clip.id, origin: clips })
                            trackRef.current?.setPointerCapture(event.pointerId)
                          }}
                          style={{
                            position: 'absolute', top: 6, bottom: 6, left, width,
                            borderRadius: 8,
                            background: active ? 'rgba(243,228,196,.22)' : 'rgba(255,255,255,.10)',
                            border: `1px solid ${active ? 'rgba(255,236,210,.7)' : 'rgba(255,255,255,.12)'}`,
                            boxSizing: 'border-box',
                            overflow: 'hidden',
                            cursor: 'grab',
                          }}
                        >
                          <span style={{ position: 'absolute', left: 10, top: 6, fontSize: 10, color: dx.ink, fontWeight: 600 }}>片段{index + 1}</span>
                          <span style={{ position: 'absolute', left: 10, bottom: 6, fontSize: 10, color: dx.mute }}>{fmtClock(clipPlayDuration(clip))}{clip.speed !== 1 ? ` · ${clip.speed}×` : ''}</span>
                          {active ? (
                            <>
                              <span
                                data-handle="in"
                                onPointerDown={event => {
                                  event.stopPropagation()
                                  setDrag({ kind: 'in', id: clip.id, origin: clips })
                                  trackRef.current?.setPointerCapture(event.pointerId)
                                }}
                                style={{ position: 'absolute', left: 0, top: 4, bottom: 4, width: 8, borderRadius: 99, background: '#f3f3f3', cursor: 'ew-resize' }}
                              />
                              <span
                                data-handle="out"
                                onPointerDown={event => {
                                  event.stopPropagation()
                                  setDrag({ kind: 'out', id: clip.id, origin: clips })
                                  trackRef.current?.setPointerCapture(event.pointerId)
                                }}
                                style={{ position: 'absolute', right: 0, top: 4, bottom: 4, width: 8, borderRadius: 99, background: '#f3f3f3', cursor: 'ew-resize' }}
                              />
                            </>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
              {seqLen > 0 ? (
                <div style={{
                  position: 'absolute', top: 0, bottom: 0, left: 56 + time * pxPerSec,
                  width: 2, marginLeft: -1, background: '#f3efe4', pointerEvents: 'none',
                  boxShadow: '0 0 0 1px rgba(0,0,0,.45)',
                }}>
                  <span style={{
                    position: 'absolute', top: 0, left: 4, padding: '1px 5px', borderRadius: 4,
                    background: 'rgba(12,12,12,.82)', color: '#f3f3f3', fontSize: 10, whiteSpace: 'nowrap',
                  }}>
                    {fmtClock(time)}
                  </span>
                </div>
              ) : null}
            </div>
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
          onPause={() => {
            if (playRef.current !== undefined) return
            setPlaying(false)
          }}
          onLoadedMetadata={event => {
            const media = event.currentTarget
            const next = media.duration
            const width = media.videoWidth
            const height = media.videoHeight
            if (Number.isFinite(next) && next > 0) {
              setSourceDuration(current => current > 0 ? current : next)
              setSize(current => current.width === 1280 ? { width: width || current.width, height: height || current.height } : current)
              setClips(current => current.length === 0 ? fromSource(next) : current)
            }
          }}
          style={{ width: '100%', height: '100%', maxHeight: '100%', objectFit: 'contain', background: '#000', borderRadius: 12, filter: LOOKS.find(item => item.id === lookId)?.css ?? 'none' }}
        />
      </div>
    </StudioShell>
  )
}
