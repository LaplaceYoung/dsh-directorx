import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { dx, dxGhostBtn, dxPill } from '../canvas-theme.ts'
import { IconCheck, IconClose, IconRedo, IconUndo } from './icons.tsx'

type Tool = 'brush' | 'rect' | 'lasso'
type Mode = 'redraw' | 'erase'
type Box = { x: number; y: number; w: number; h: number }

function checker(): string {
  return 'repeating-conic-gradient(#d0d0d0 0% 25%, #8d8d8d 0% 50%) 0 0 / 16px 16px'
}

function contentBox(wellW: number, wellH: number, imgW: number, imgH: number): Box {
  if (imgW <= 0 || imgH <= 0 || wellW <= 0 || wellH <= 0) return { x: 0, y: 0, w: wellW, h: wellH }
  const wellR = wellW / wellH
  const imgR = imgW / imgH
  if (imgR > wellR) {
    const w = wellW
    const h = wellW / imgR
    return { x: 0, y: (wellH - h) / 2, w, h }
  }
  const h = wellH
  const w = wellH * imgR
  return { x: (wellW - w) / 2, y: 0, w, h }
}

function hostOf(): HTMLElement {
  return (document.querySelector('.dx-stage') as HTMLElement | null) ?? document.body
}

export function MaskOverlay(props: {
  src: string
  mode: Mode
  label?: string
  onCancel: () => void
  onSubmit: (mask: Blob, prompt: string) => void
}): ReactNode {
  const wellRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stroke = useRef<{ x: number; y: number } | undefined>(undefined)
  const rectStart = useRef<{ x: number; y: number } | undefined>(undefined)
  const lasso = useRef<Array<{ x: number; y: number }>>([])
  const undoStack = useRef<ImageData[]>([])
  const redoStack = useRef<ImageData[]>([])
  const [tool, setTool] = useState<Tool>('brush')
  const [size, setSize] = useState(28)
  const [prompt, setPrompt] = useState('')
  const [maskUrl, setMaskUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [box, setBox] = useState<Box>({ x: 0, y: 0, w: 0, h: 0 })
  const [rubber, setRubber] = useState<Box | undefined>(undefined)

  const ctxOf = () => canvasRef.current?.getContext('2d') ?? null

  const publish = () => {
    const canvas = canvasRef.current
    if (canvas === null) return
    setMaskUrl(canvas.toDataURL('image/png'))
  }

  const snapshot = () => {
    const canvas = canvasRef.current
    const ctx = ctxOf()
    if (canvas === null || ctx === null) return
    undoStack.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height))
    if (undoStack.current.length > 24) undoStack.current.shift()
    redoStack.current = []
  }

  const measure = useCallback(() => {
    const well = wellRef.current
    const img = imgRef.current
    const canvas = canvasRef.current
    if (well === null || img === null || canvas === null || img.naturalWidth === 0) return
    setBox(contentBox(well.clientWidth, well.clientHeight, img.naturalWidth, img.naturalHeight))
    if (canvas.width !== img.naturalWidth || canvas.height !== img.naturalHeight) {
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      ctxOf()?.clearRect(0, 0, canvas.width, canvas.height)
      undoStack.current = []
      redoStack.current = []
      publish()
    }
  }, [])

  useEffect(() => {
    measure()
    const well = wellRef.current
    if (well === null) return
    const observer = new ResizeObserver(() => measure())
    observer.observe(well)
    return () => observer.disconnect()
  }, [measure, props.src])

  const toCanvas = (event: ReactPointerEvent<HTMLElement>) => {
    const canvas = canvasRef.current
    if (canvas === null || box.w < 1 || box.h < 1) return { x: 0, y: 0 }
    return {
      x: ((event.clientX - (canvas.getBoundingClientRect().left)) / box.w) * canvas.width,
      y: ((event.clientY - (canvas.getBoundingClientRect().top)) / box.h) * canvas.height,
    }
  }

  const brushWidth = () => {
    const canvas = canvasRef.current
    if (canvas === null || box.w < 1) return size
    return size * (canvas.width / box.w)
  }

  const paintBrush = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const ctx = ctxOf()
    if (ctx === null) return
    ctx.strokeStyle = '#fff'
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = brushWidth()
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.stroke()
  }

  const fillRect = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const ctx = ctxOf()
    if (ctx === null) return
    ctx.fillStyle = '#fff'
    ctx.fillRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y))
  }

  const fillLasso = (points: Array<{ x: number; y: number }>) => {
    const ctx = ctxOf()
    if (ctx === null || points.length < 3) return
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (const point of points.slice(1)) ctx.lineTo(point.x, point.y)
    ctx.closePath()
    ctx.fill()
  }

  const onDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.stopPropagation()
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    snapshot()
    const point = toCanvas(event)
    if (tool === 'brush') {
      stroke.current = point
      paintBrush(point, point)
      publish()
    } else if (tool === 'rect') {
      rectStart.current = point
      setRubber({ x: point.x, y: point.y, w: 0, h: 0 })
    } else {
      lasso.current = [point]
    }
  }

  const onMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (stroke.current === undefined && rectStart.current === undefined && lasso.current.length === 0) return
    event.stopPropagation()
    const point = toCanvas(event)
    if (tool === 'brush' && stroke.current !== undefined) {
      paintBrush(stroke.current, point)
      stroke.current = point
      publish()
      return
    }
    if (tool === 'rect' && rectStart.current !== undefined) {
      const origin = rectStart.current
      setRubber({
        x: Math.min(origin.x, point.x),
        y: Math.min(origin.y, point.y),
        w: Math.abs(point.x - origin.x),
        h: Math.abs(point.y - origin.y),
      })
      return
    }
    if (tool === 'lasso') lasso.current.push(point)
  }

  const onUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.stopPropagation()
    if (tool === 'rect' && rectStart.current !== undefined) fillRect(rectStart.current, toCanvas(event))
    if (tool === 'lasso') fillLasso(lasso.current)
    stroke.current = undefined
    rectStart.current = undefined
    lasso.current = []
    setRubber(undefined)
    publish()
  }

  const undo = () => {
    const canvas = canvasRef.current
    const ctx = ctxOf()
    const prev = undoStack.current.pop()
    if (canvas === null || ctx === null || prev === undefined) return
    redoStack.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height))
    ctx.putImageData(prev, 0, 0)
    publish()
  }

  const redo = () => {
    const canvas = canvasRef.current
    const ctx = ctxOf()
    const next = redoStack.current.pop()
    if (canvas === null || ctx === null || next === undefined) return
    undoStack.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height))
    ctx.putImageData(next, 0, 0)
    publish()
  }

  const submit = async () => {
    const canvas = canvasRef.current
    if (canvas === null || busy) return
    if (props.mode === 'redraw' && prompt.trim() === '') return
    setBusy(true)
    try {
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'))
      if (blob === null) return
      props.onSubmit(blob, props.mode === 'erase' ? '擦除蒙版区域，用周围内容自然填补，其余画面保持不变' : prompt.trim())
    } finally {
      setBusy(false)
    }
  }

  const hint = props.mode === 'erase' ? '绘制蒙版以擦除' : '绘制蒙版以重绘'
  const canSend = props.mode === 'erase' || prompt.trim() !== ''
  const scaleX = box.w / Math.max(1, canvasRef.current?.width ?? 1)
  const scaleY = box.h / Math.max(1, canvasRef.current?.height ?? 1)

  const bar = (
    <div className="nodrag nopan dx-mask-bar" style={{
      position: 'absolute', left: '50%', top: -56, transform: 'translateX(-50%)',
      display: 'flex', alignItems: 'center', gap: 6, height: 44, padding: '0 8px',
      borderRadius: 999, background: 'rgba(18,18,18,.92)', border: '1px solid rgba(255,255,255,.12)',
      backdropFilter: 'blur(16px)', zIndex: 9, whiteSpace: 'nowrap',
    }}>
      {props.label !== undefined && props.label !== '' ? (
        <span style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 12, color: 'rgba(245,245,245,.8)', padding: '0 6px' }}>{props.label}</span>
      ) : null}
      <button type="button" className="dx-hit" title="取消" onClick={props.onCancel} style={{ ...dxGhostBtn, width: 32, height: 32 }}><IconClose size={14} /></button>
      {(['brush', 'rect', 'lasso'] as const).map(id => (
        <button
          key={id}
          type="button"
          className="dx-hit"
          title={id === 'brush' ? '笔刷' : id === 'rect' ? '框选' : '套索'}
          onClick={() => setTool(id)}
          style={{ ...dxGhostBtn, width: 32, height: 32, background: tool === id ? 'rgba(255,255,255,.16)' : 'transparent' }}
        >
          {id === 'brush' ? '●' : id === 'rect' ? '□' : '∿'}
        </button>
      ))}
      <input type="range" min={8} max={72} value={size} onChange={event => setSize(Number(event.target.value))} style={{ width: 84 }} />
      <button type="button" className="dx-hit" title="撤销" onClick={undo} style={{ ...dxGhostBtn, width: 32, height: 32 }}><IconUndo size={14} /></button>
      <button type="button" className="dx-hit" title="重做" onClick={redo} style={{ ...dxGhostBtn, width: 32, height: 32, opacity: redoStack.current.length === 0 ? .35 : 1 }}><IconRedo size={14} /></button>
    </div>
  )

  const dock = (
    <div className="nodrag nopan dx-mask-dock" style={{
      position: 'absolute', left: '50%', bottom: 28, transform: 'translateX(-50%)',
      display: 'flex', alignItems: 'center', gap: 10, width: 640, maxWidth: 'calc(100% - 48px)',
      minHeight: 56, padding: '10px 14px', borderRadius: 18,
      background: 'rgba(18,18,18,.94)', border: '1px solid rgba(255,255,255,.12)',
      boxShadow: '0 18px 40px rgba(0,0,0,.4)', zIndex: 28, fontFamily: dx.font,
    }}>
      {props.mode === 'redraw' ? (
        <input
          className="nodrag nopan"
          value={prompt}
          placeholder="描述你想改变什么..."
          onChange={event => setPrompt(event.target.value)}
          style={{ flex: 1, minWidth: 0, height: 34, border: 'none', background: 'transparent', color: dx.ink, fontSize: 14, outline: 'none', fontFamily: dx.font }}
        />
      ) : <span style={{ flex: 1, color: dx.mute, fontSize: 13 }} />}
      <span style={{ color: dx.mute, fontSize: 12, whiteSpace: 'nowrap' }}>{hint}</span>
      <button
        type="button"
        className="dx-cta"
        disabled={busy || !canSend}
        onClick={() => { void submit() }}
        style={{ ...dxPill, width: 36, height: 36, opacity: busy || !canSend ? .4 : 1 }}
      >
        <IconCheck size={15} />
      </button>
    </div>
  )

  return (
    <div ref={wellRef} className="nodrag nopan dx-mask-overlay" style={{ position: 'absolute', inset: 0, zIndex: 8, overflow: 'visible' }}>
      <img ref={imgRef} src={props.src} alt="" onLoad={measure} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h,
          opacity: 0, pointerEvents: 'none',
        }}
      />
      {maskUrl !== '' ? (
        <div style={{
          position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h,
          background: checker(),
          WebkitMaskImage: `url(${maskUrl})`, maskImage: `url(${maskUrl})`,
          WebkitMaskSize: '100% 100%', maskSize: '100% 100%',
          pointerEvents: 'none', opacity: 0.72,
        }} />
      ) : null}
      <div
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        style={{ position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, cursor: 'crosshair' }}
      />
      {rubber !== undefined ? (
        <div style={{
          position: 'absolute',
          left: box.x + rubber.x * scaleX,
          top: box.y + rubber.y * scaleY,
          width: rubber.w * scaleX,
          height: rubber.h * scaleY,
          border: '1px solid #fff',
          pointerEvents: 'none',
        }} />
      ) : null}
      {bar}
      {createPortal(dock, hostOf())}
    </div>
  )
}
