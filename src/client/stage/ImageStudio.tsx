import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react'
import { dx } from '../canvas-theme.ts'
import {
  IconBrush, IconCheck, IconCrop, IconFit, IconRedo, IconRotate, IconSliders,
  IconText, IconUndo,
} from './icons.tsx'
import { StudioField, StudioShell, studioBtn, studioRange } from './studio-chrome.tsx'
import { GRADE_FAMILIES, GRADE_LOOK_LIST, looksByFamily } from '../../providers/grade-catalog.ts'

export interface ImageStudioProps {
  source: string
  name: string
  look?: string | null
  onExport: (blob: Blob, mediaType: string) => void
  onClose: () => void
}

const LOOKS = GRADE_LOOK_LIST

type Tool = 'move' | 'crop' | 'draw' | 'text' | 'adjust'
type Aspect = 'free' | '1' | '16:9' | '9:16' | '4:3'

const ASPECTS: Array<{ id: Aspect; label: string; value?: number }> = [
  { id: 'free', label: '自由' },
  { id: '1', label: '1:1', value: 1 },
  { id: '16:9', label: '16:9', value: 16 / 9 },
  { id: '9:16', label: '9:16', value: 9 / 16 },
  { id: '4:3', label: '4:3', value: 4 / 3 },
]

function cloneCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const next = document.createElement('canvas')
  next.width = source.width
  next.height = source.height
  next.getContext('2d')?.drawImage(source, 0, 0)
  return next
}

function constrainRect(
  x0: number, y0: number, x1: number, y1: number, aspect?: number,
): { x: number; y: number; w: number; h: number } {
  let w = x1 - x0
  let h = y1 - y0
  if (aspect !== undefined && aspect > 0) {
    const aw = Math.abs(w)
    const ah = Math.abs(w) / aspect
    w = w < 0 ? -aw : aw
    h = h < 0 ? -ah : ah
  }
  return {
    x: Math.min(x0, x0 + w),
    y: Math.min(y0, y0 + h),
    w: Math.abs(w),
    h: Math.abs(h),
  }
}

export function ImageStudio(props: ImageStudioProps): ReactNode {
  const stageRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const workRef = useRef<HTMLCanvasElement | null>(null)
  const historyRef = useRef<HTMLCanvasElement[]>([])
  const redoRef = useRef<HTMLCanvasElement[]>([])
  const dragRef = useRef<{ x: number; y: number } | undefined>(undefined)
  const [tool, setTool] = useState<Tool>('move')
  const [error, setError] = useState<string | undefined>(undefined)
  const [busy, setBusy] = useState(true)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [brush, setBrush] = useState(16)
  const [color, setColor] = useState('#ffffff')
  const [fontSize, setFontSize] = useState(48)
  const [adjust, setAdjust] = useState({ brightness: 1, contrast: 1, saturate: 1 })
  const [lookId, setLookId] = useState<string | undefined>(undefined)
  const [crop, setCrop] = useState<{ x: number; y: number; w: number; h: number } | undefined>(undefined)
  const [aspect, setAspect] = useState<Aspect>('free')
  const [textDraft, setTextDraft] = useState<{ x: number; y: number; value: string } | undefined>(undefined)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const paint = () => {
    const view = stageRef.current
    const work = workRef.current
    const frame = frameRef.current
    if (view === null || work === null) return
    const box = frame?.getBoundingClientRect()
    const maxW = Math.max(240, Math.round(box?.width ?? 800) - 32)
    const maxH = Math.max(200, Math.round(box?.height ?? 520) - 32)
    const scale = Math.min(maxW / work.width, maxH / work.height, 1)
    view.width = Math.max(1, Math.round(work.width * scale))
    view.height = Math.max(1, Math.round(work.height * scale))
    const ctx = view.getContext('2d')
    if (ctx === null) return
    const tone = LOOKS.find(item => item.id === lookId)?.css
    const filter = [tone, `brightness(${adjust.brightness})`, `contrast(${adjust.contrast})`, `saturate(${adjust.saturate})`].filter(Boolean).join(' ')
    ctx.filter = filter
    ctx.drawImage(work, 0, 0, view.width, view.height)
    ctx.filter = 'none'
    if (crop !== undefined) {
      ctx.fillStyle = 'rgba(0,0,0,.48)'
      ctx.fillRect(0, 0, view.width, view.height)
      ctx.filter = filter
      ctx.drawImage(
        work,
        (crop.x / view.width) * work.width,
        (crop.y / view.height) * work.height,
        (crop.w / view.width) * work.width,
        (crop.h / view.height) * work.height,
        crop.x,
        crop.y,
        crop.w,
        crop.h,
      )
      ctx.filter = 'none'
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1
      ctx.setLineDash([6, 4])
      ctx.strokeRect(crop.x + 0.5, crop.y + 0.5, crop.w, crop.h)
      ctx.setLineDash([])
    }
  }

  const syncStacks = () => {
    setCanUndo(historyRef.current.length > 0)
    setCanRedo(redoRef.current.length > 0)
  }

  useEffect(() => {
    let live = true
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      if (!live) return
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth || 1
      canvas.height = image.naturalHeight || 1
      canvas.getContext('2d')?.drawImage(image, 0, 0)
      workRef.current = canvas
      historyRef.current = []
      redoRef.current = []
      setSize({ width: canvas.width, height: canvas.height })
      setBusy(false)
      setZoom(1)
      setPan({ x: 0, y: 0 })
      paint()
      syncStacks()
    }
    image.onerror = () => { if (live) { setBusy(false); setError('图片加载失败') } }
    image.src = props.source
    return () => { live = false }
  }, [props.source])

  useEffect(() => {
    if (props.look === undefined || props.look === null || props.look === '') return
    setLookId(props.look)
    setTool('adjust')
  }, [props.look, props.source])

  useEffect(() => { paint() }, [adjust, crop, tool, size, lookId])

  useEffect(() => {
    const frame = frameRef.current
    if (frame === null) return
    const observer = new ResizeObserver(() => paint())
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])

  const snapshot = () => {
    const work = workRef.current
    if (work === null) return
    historyRef.current.push(cloneCanvas(work))
    if (historyRef.current.length > 30) historyRef.current.shift()
    redoRef.current = []
    syncStacks()
  }

  const commit = (next: HTMLCanvasElement) => {
    snapshot()
    workRef.current = next
    setSize({ width: next.width, height: next.height })
    setCrop(undefined)
    paint()
  }

  const mapPoint = (event: PointerEvent<HTMLCanvasElement>) => {
    const view = stageRef.current
    if (view === null) return { x: 0, y: 0 }
    const rect = view.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) / rect.width) * view.width,
      y: ((event.clientY - rect.top) / rect.height) * view.height,
    }
  }

  const applyAdjust = () => {
    const work = workRef.current
    if (work === null) return
    const next = document.createElement('canvas')
    next.width = work.width
    next.height = work.height
    const ctx = next.getContext('2d')
    if (ctx === null) return
    const tone = LOOKS.find(item => item.id === lookId)?.css
    ctx.filter = [tone, `brightness(${adjust.brightness})`, `contrast(${adjust.contrast})`, `saturate(${adjust.saturate})`].filter(Boolean).join(' ')
    ctx.drawImage(work, 0, 0)
    setAdjust({ brightness: 1, contrast: 1, saturate: 1 })
    setLookId(undefined)
    commit(next)
  }

  const rotate = () => {
    const work = workRef.current
    if (work === null) return
    const next = document.createElement('canvas')
    next.width = work.height
    next.height = work.width
    const ctx = next.getContext('2d')
    if (ctx === null) return
    ctx.translate(next.width, 0)
    ctx.rotate(Math.PI / 2)
    ctx.drawImage(work, 0, 0)
    commit(next)
  }

  const flip = (axis: 'h' | 'v') => {
    const work = workRef.current
    if (work === null) return
    const next = document.createElement('canvas')
    next.width = work.width
    next.height = work.height
    const ctx = next.getContext('2d')
    if (ctx === null) return
    if (axis === 'h') {
      ctx.translate(next.width, 0)
      ctx.scale(-1, 1)
    } else {
      ctx.translate(0, next.height)
      ctx.scale(1, -1)
    }
    ctx.drawImage(work, 0, 0)
    commit(next)
  }

  const applyCrop = () => {
    const work = workRef.current
    const view = stageRef.current
    if (work === null || view === null || crop === undefined || crop.w < 4 || crop.h < 4) return
    const sx = (crop.x / view.width) * work.width
    const sy = (crop.y / view.height) * work.height
    const sw = (crop.w / view.width) * work.width
    const sh = (crop.h / view.height) * work.height
    const next = document.createElement('canvas')
    next.width = Math.max(1, Math.round(sw))
    next.height = Math.max(1, Math.round(sh))
    next.getContext('2d')?.drawImage(work, sx, sy, sw, sh, 0, 0, next.width, next.height)
    commit(next)
  }

  const undo = () => {
    const prev = historyRef.current.pop()
    const work = workRef.current
    if (prev === undefined || work === null) return
    redoRef.current.push(cloneCanvas(work))
    workRef.current = prev
    setSize({ width: prev.width, height: prev.height })
    setCrop(undefined)
    paint()
    syncStacks()
  }

  const redo = () => {
    const next = redoRef.current.pop()
    const work = workRef.current
    if (next === undefined || work === null) return
    historyRef.current.push(cloneCanvas(work))
    workRef.current = next
    setSize({ width: next.width, height: next.height })
    setCrop(undefined)
    paint()
    syncStacks()
  }

  const commitText = () => {
    const draft = textDraft
    const work = workRef.current
    const view = stageRef.current
    if (draft === undefined || draft.value.trim() === '' || work === null || view === null) {
      setTextDraft(undefined)
      return
    }
    const next = cloneCanvas(work)
    const ctx = next.getContext('2d')
    if (ctx === null) return
    ctx.fillStyle = color
    ctx.font = `${Math.round(fontSize * (work.width / Math.max(view.width, 1)))}px ${dx.font}`
    ctx.fillText(draft.value, (draft.x / view.width) * work.width, (draft.y / view.height) * work.height)
    setTextDraft(undefined)
    commit(next)
  }

  const exportPng = () => {
    const work = workRef.current
    if (work === null) return
    work.toBlob(blob => {
      if (blob === null) setError('导出失败')
      else props.onExport(blob, 'image/png')
    }, 'image/png')
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing = typeof target?.matches === 'function' && target.matches('input, textarea')
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
        return
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        exportPng()
        return
      }
      if (typing) return
      if (event.key === 'Enter' && tool === 'crop') applyCrop()
      if (event.key === 'Enter' && textDraft !== undefined) commitText()
      if (event.key === 'Escape') {
        event.preventDefault()
        if (crop !== undefined || textDraft !== undefined) {
          setCrop(undefined)
          setTextDraft(undefined)
          return
        }
        props.onClose()
        return
      }
      if (event.key === 'v' || event.key === 'V') setTool('move')
      if (event.key === 'c' || event.key === 'C') setTool('crop')
      if (event.key === 'b' || event.key === 'B') setTool('draw')
      if (event.key === 't' || event.key === 'T') setTool('text')
      if (event.key === 'a' || event.key === 'A') setTool('adjust')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const ratio = ASPECTS.find(item => item.id === aspect)?.value
  const filename = props.name.split('/').pop() ?? props.name

  return (
    <StudioShell
      title="图片编辑"
      filename={filename}
      meta={[
        size.width > 0 ? `${size.width}×${size.height}` : '',
        `${Math.round(zoom * 100)}%`,
      ].filter(part => part !== '').join(' · ')}
      error={error}
      saveLabel="保存到画布"
      saveDisabled={busy || workRef.current === null}
      onSave={exportPng}
      onClose={props.onClose}
      tools={[
        { id: 'move', label: '查看', icon: <IconFit size={15} /> },
        { id: 'crop', label: '裁剪', icon: <IconCrop size={15} /> },
        { id: 'draw', label: '画笔', icon: <IconBrush size={15} /> },
        { id: 'text', label: '文字', icon: <IconText size={15} /> },
        { id: 'adjust', label: '调节', icon: <IconSliders size={15} /> },
      ]}
      tool={tool}
      onTool={id => setTool(id as Tool)}
      inspector={(
        <>
          <div style={{ fontSize: 11, letterSpacing: 0.3, textTransform: 'uppercase', color: dx.mute, marginBottom: 12 }}>工具</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            <button className="dx-hit" style={studioBtn} onClick={undo} disabled={!canUndo}><IconUndo size={13} />撤销</button>
            <button className="dx-hit" style={studioBtn} onClick={redo} disabled={!canRedo}><IconRedo size={13} />重做</button>
            <button className="dx-hit" style={studioBtn} onClick={rotate}><IconRotate size={13} />旋转</button>
            <button className="dx-hit" style={studioBtn} onClick={() => flip('h')}>水平翻转</button>
            <button className="dx-hit" style={studioBtn} onClick={() => flip('v')}>垂直翻转</button>
            <button className="dx-hit" style={studioBtn} onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}>复位视图</button>
          </div>
          {tool === 'crop' ? (
            <>
              <StudioField label="画幅">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {ASPECTS.map(item => (
                    <button
                      key={item.id}
                      className="dx-hit"
                      style={{ ...studioBtn, background: aspect === item.id ? 'rgba(255,255,255,.14)' : studioBtn.background }}
                      onClick={() => setAspect(item.id)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </StudioField>
              <button className="dx-hit" style={studioBtn} onClick={applyCrop}><IconCheck size={13} />应用裁剪</button>
            </>
          ) : null}
          {tool === 'draw' ? (
            <>
              <StudioField label="颜色">
                <input type="color" value={color} onChange={event => setColor(event.target.value)} style={{ width: '100%', height: 32, border: 'none', background: 'transparent' }} />
              </StudioField>
              <StudioField label={`笔刷 ${brush}px`}>
                <input type="range" min={2} max={72} value={brush} onChange={event => setBrush(Number(event.target.value))} style={studioRange()} />
              </StudioField>
            </>
          ) : null}
          {tool === 'text' ? (
            <>
              <StudioField label="颜色">
                <input type="color" value={color} onChange={event => setColor(event.target.value)} style={{ width: '100%', height: 32, border: 'none', background: 'transparent' }} />
              </StudioField>
              <StudioField label={`字号 ${fontSize}`}>
                <input type="range" min={16} max={160} value={fontSize} onChange={event => setFontSize(Number(event.target.value))} style={studioRange()} />
              </StudioField>
              <div style={{ fontSize: 11, color: dx.dim }}>点击画面放置文字，回车确认。</div>
            </>
          ) : null}
          {tool === 'adjust' ? (
            <>
              <StudioField label="色调">
                {GRADE_FAMILIES.map(family => (
                  <div key={family.id} style={{ marginBottom: 8 }}>
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
              </StudioField>
              <StudioField label={`亮度 ${adjust.brightness.toFixed(2)}`}>
                <input type="range" min={0.4} max={1.8} step={0.02} value={adjust.brightness} onChange={event => setAdjust(current => ({ ...current, brightness: Number(event.target.value) }))} style={studioRange()} />
              </StudioField>
              <StudioField label={`对比 ${adjust.contrast.toFixed(2)}`}>
                <input type="range" min={0.4} max={1.8} step={0.02} value={adjust.contrast} onChange={event => setAdjust(current => ({ ...current, contrast: Number(event.target.value) }))} style={studioRange()} />
              </StudioField>
              <StudioField label={`饱和 ${adjust.saturate.toFixed(2)}`}>
                <input type="range" min={0} max={2} step={0.02} value={adjust.saturate} onChange={event => setAdjust(current => ({ ...current, saturate: Number(event.target.value) }))} style={studioRange()} />
              </StudioField>
              <button className="dx-hit" style={studioBtn} onClick={applyAdjust}>应用调节</button>
            </>
          ) : null}
          {tool === 'move' ? (
            <div style={{ fontSize: 12, color: dx.dim, lineHeight: 1.6 }}>滚轮缩放，拖拽平移。V 查看 · C 裁剪 · B 画笔 · T 文字 · A 调节。Esc 取消或返回画布。</div>
          ) : null}
        </>
      )}
    >
      <div
        ref={frameRef}
        onWheel={event => {
          event.preventDefault()
          const next = Math.min(4, Math.max(0.25, zoom * (event.deltaY > 0 ? 0.9 : 1.1)))
          setZoom(next)
        }}
        style={{
          flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative',
          background: 'repeating-conic-gradient(#1a1a1a 0% 25%, #111 0% 50%) 50% / 18px 18px',
        }}
      >
        {busy ? <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: dx.mute, fontSize: 13 }}>正在加载图片…</div> : null}
        <div style={{
          position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}>
          <canvas
            ref={stageRef}
            style={{
              maxWidth: '100%',
              cursor: tool === 'draw' || tool === 'crop' || tool === 'text' ? 'crosshair' : tool === 'move' ? 'grab' : 'default',
              boxShadow: '0 18px 48px rgba(0,0,0,.45)',
            }}
            onPointerDown={event => {
              const point = mapPoint(event)
              dragRef.current = point
              event.currentTarget.setPointerCapture(event.pointerId)
              if (tool === 'crop') setCrop({ x: point.x, y: point.y, w: 0, h: 0 })
              if (tool === 'draw') snapshot()
              if (tool === 'text') setTextDraft({ x: event.clientX, y: event.clientY, value: '' })
            }}
            onPointerMove={event => {
              const start = dragRef.current
              if (start === undefined) return
              const point = mapPoint(event)
              if (tool === 'move') {
                setPan(current => ({
                  x: current.x + event.movementX,
                  y: current.y + event.movementY,
                }))
              }
              if (tool === 'crop') setCrop(constrainRect(start.x, start.y, point.x, point.y, ratio))
              if (tool === 'draw') {
                const work = workRef.current
                const view = stageRef.current
                if (work === null || view === null) return
                const ctx = work.getContext('2d')
                if (ctx === null) return
                ctx.strokeStyle = color
                ctx.lineWidth = brush * (work.width / view.width)
                ctx.lineCap = 'round'
                ctx.lineJoin = 'round'
                ctx.beginPath()
                ctx.moveTo((start.x / view.width) * work.width, (start.y / view.height) * work.height)
                ctx.lineTo((point.x / view.width) * work.width, (point.y / view.height) * work.height)
                ctx.stroke()
                dragRef.current = point
                paint()
              }
            }}
            onPointerUp={() => { dragRef.current = undefined }}
          />
        </div>
        {textDraft !== undefined ? (
          <textarea
            autoFocus
            value={textDraft.value}
            onChange={event => setTextDraft(current => current === undefined ? current : { ...current, value: event.target.value })}
            onBlur={commitText}
            onKeyDown={event => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                commitText()
              }
              if (event.key === 'Escape') setTextDraft(undefined)
            }}
            style={{
              position: 'fixed', left: textDraft.x, top: textDraft.y,
              minWidth: 160, minHeight: 36, padding: '6px 8px',
              border: '1px solid rgba(255,255,255,.28)', borderRadius: 8,
              background: 'rgba(12,12,12,.92)', color: color, fontSize: 14,
              fontFamily: dx.font, outline: 'none', zIndex: 50,
            }}
          />
        ) : null}
      </div>
    </StudioShell>
  )
}
