import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { dx, dxGhostBtn } from '../canvas-theme.ts'
import { IconCheck, IconClose } from './icons.tsx'

export const CROP_ASPECTS = [
  { id: 'free', label: '自由', value: undefined },
  { id: '1:1', label: '1:1', value: 1 },
  { id: '16:9', label: '16:9', value: 16 / 9 },
  { id: '9:16', label: '9:16', value: 9 / 16 },
  { id: '4:3', label: '4:3', value: 4 / 3 },
  { id: '3:4', label: '3:4', value: 3 / 4 },
] as const

export type CropAspectId = typeof CROP_ASPECTS[number]['id']

type Rect = { x: number; y: number; w: number; h: number }
type Handle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | 'move'

function contentBox(wellW: number, wellH: number, imgW: number, imgH: number): Rect {
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

function inset(box: Rect, pad: number): Rect {
  const p = Math.min(pad, box.w / 4, box.h / 4)
  return { x: box.x + p, y: box.y + p, w: box.w - p * 2, h: box.h - p * 2 }
}

function clampRect(rect: Rect, box: Rect): Rect {
  const w = Math.max(24, Math.min(rect.w, box.w))
  const h = Math.max(24, Math.min(rect.h, box.h))
  const x = Math.min(Math.max(rect.x, box.x), box.x + box.w - w)
  const y = Math.min(Math.max(rect.y, box.y), box.y + box.h - h)
  return { x, y, w, h }
}

function fitAspect(rect: Rect, box: Rect, ratio: number | undefined): Rect {
  if (ratio === undefined || ratio <= 0) return clampRect(rect, box)
  const cx = rect.x + rect.w / 2
  const cy = rect.y + rect.h / 2
  let w = rect.w
  let h = w / ratio
  if (h > box.h) {
    h = box.h
    w = h * ratio
  }
  if (w > box.w) {
    w = box.w
    h = w / ratio
  }
  return clampRect({ x: cx - w / 2, y: cy - h / 2, w, h }, box)
}

function applyHandle(start: Rect, dx: number, dy: number, handle: Handle, box: Rect, ratio: number | undefined): Rect {
  let next = { ...start }
  if (handle === 'move') {
    next = { ...start, x: start.x + dx, y: start.y + dy }
    return clampRect(next, box)
  }
  if (handle.includes('w')) {
    next.x = start.x + dx
    next.w = start.w - dx
  }
  if (handle.includes('e')) next.w = start.w + dx
  if (handle.includes('n')) {
    next.y = start.y + dy
    next.h = start.h - dy
  }
  if (handle.includes('s')) next.h = start.h + dy
  if (next.w < 24) {
    if (handle.includes('w')) next.x = start.x + start.w - 24
    next.w = 24
  }
  if (next.h < 24) {
    if (handle.includes('n')) next.y = start.y + start.h - 24
    next.h = 24
  }
  return fitAspect(next, box, ratio)
}

const handleCursor: Record<Handle, string> = {
  n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize',
  ne: 'nesw-resize', sw: 'nesw-resize', nw: 'nwse-resize', se: 'nwse-resize',
  move: 'move',
}

function handleStyle(handle: Handle, rect: Rect): CSSProperties {
  const size = 10
  const half = size / 2
  const midX = rect.x + rect.w / 2 - half
  const midY = rect.y + rect.h / 2 - half
  const left = handle.includes('w') ? rect.x - half : handle.includes('e') ? rect.x + rect.w - half : midX
  const top = handle.includes('n') ? rect.y - half : handle.includes('s') ? rect.y + rect.h - half : midY
  return {
    position: 'absolute',
    left,
    top,
    width: size,
    height: size,
    borderRadius: 2,
    background: '#fff',
    boxShadow: '0 0 0 1px rgba(0,0,0,.45)',
    cursor: handleCursor[handle],
    zIndex: 3,
  }
}

export function CropBox(props: {
  src: string
  aspect?: number
  onConfirm: (blob: Blob) => void
}): ReactNode {
  const wellRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const drag = useRef<{ handle: Handle; x: number; y: number; rect: Rect } | undefined>(undefined)
  const [box, setBox] = useState<Rect>({ x: 0, y: 0, w: 0, h: 0 })
  const [rect, setRect] = useState<Rect>({ x: 8, y: 8, w: 80, h: 80 })
  const [busy, setBusy] = useState(false)

  const measure = useCallback(() => {
    const well = wellRef.current
    const img = imgRef.current
    if (well === null || img === null || img.naturalWidth === 0) return
    const next = contentBox(well.clientWidth, well.clientHeight, img.naturalWidth, img.naturalHeight)
    setBox(next)
    setRect(current => fitAspect(current.w < 8 ? inset(next, 16) : current, next, props.aspect))
  }, [props.aspect])

  useEffect(() => {
    measure()
    const well = wellRef.current
    if (well === null) return
    const observer = new ResizeObserver(() => measure())
    observer.observe(well)
    return () => observer.disconnect()
  }, [measure])

  useEffect(() => {
    setRect(current => fitAspect(current, box, props.aspect))
  }, [box, props.aspect])

  const onDown = (handle: Handle) => (event: ReactPointerEvent<HTMLElement>) => {
    event.stopPropagation()
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { handle, x: event.clientX, y: event.clientY, rect }
  }

  const onMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const active = drag.current
    if (active === undefined) return
    event.stopPropagation()
    setRect(applyHandle(active.rect, event.clientX - active.x, event.clientY - active.y, active.handle, box, props.aspect))
  }

  const onUp = () => { drag.current = undefined }

  const confirm = async () => {
    const img = imgRef.current
    if (img === null || img.naturalWidth === 0 || rect.w < 8 || busy) return
    setBusy(true)
    try {
      const sx = ((rect.x - box.x) / box.w) * img.naturalWidth
      const sy = ((rect.y - box.y) / box.h) * img.naturalHeight
      const sw = (rect.w / box.w) * img.naturalWidth
      const sh = (rect.h / box.h) * img.naturalHeight
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(sw))
      canvas.height = Math.max(1, Math.round(sh))
      canvas.getContext('2d')?.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92))
      if (blob === null) return
      props.onConfirm(blob)
    } finally {
      setBusy(false)
    }
  }

  const handles: Handle[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']

  return (
    <div
      ref={wellRef}
      className="nodrag nopan"
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      style={{ position: 'absolute', inset: 0, zIndex: 8, cursor: 'default' }}
    >
      <img ref={imgRef} src={props.src} alt="" onLoad={measure} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)', clipPath: `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${rect.x}px ${rect.y}px, ${rect.x}px ${rect.y + rect.h}px, ${rect.x + rect.w}px ${rect.y + rect.h}px, ${rect.x + rect.w}px ${rect.y}px)` }} />
      <div
        onPointerDown={onDown('move')}
        style={{
          position: 'absolute',
          left: rect.x,
          top: rect.y,
          width: rect.w,
          height: rect.h,
          boxSizing: 'border-box',
          border: '1px solid #fff',
          boxShadow: '0 0 0 1px rgba(0,0,0,.35)',
          cursor: 'move',
          zIndex: 2,
        }}
      >
        <span style={{ position: 'absolute', left: '33%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,.28)' }} />
        <span style={{ position: 'absolute', left: '66%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,.28)' }} />
        <span style={{ position: 'absolute', top: '33%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,.28)' }} />
        <span style={{ position: 'absolute', top: '66%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,.28)' }} />
      </div>
      {handles.map(handle => (
        <div key={handle} className="nodrag nopan" onPointerDown={onDown(handle)} style={handleStyle(handle, rect)} />
      ))}
      <button type="button" className="nodrag nopan dx-hit dx-crop-apply" disabled={busy} onClick={() => { void confirm() }} hidden />
    </div>
  )
}

export function CropBar(props: {
  aspect: CropAspectId
  busy?: boolean
  onAspect: (id: CropAspectId) => void
  onCancel: () => void
  onConfirm: () => void
}): ReactNode {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="nowheel nopan nodrag"
      onPointerDown={event => event.stopPropagation()}
      style={{
        position: 'absolute',
        left: '50%',
        bottom: 18,
        transform: 'translateX(-50%)',
        zIndex: 32,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        height: 48,
        padding: '4px 8px',
        borderRadius: 999,
        background: 'rgba(31,31,31,.88)',
        border: '1px solid rgba(255,255,255,.10)',
        backdropFilter: 'blur(16px)',
        color: dx.ink,
        fontFamily: dx.font,
      }}
    >
      <button type="button" className="dx-hit" title="取消裁剪" style={{ ...dxGhostBtn, width: 36, height: 36, borderRadius: 999 }} onClick={props.onCancel}>
        <IconClose size={16} />
      </button>
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          className="dx-hit"
          style={{ ...dxGhostBtn, width: 'auto', height: 32, padding: '0 12px', borderRadius: 999, fontSize: 12, background: 'rgba(255,255,255,.08)' }}
          onClick={() => setOpen(current => !current)}
        >
          宽高比
        </button>
        {open ? (
          <div style={{
            position: 'absolute',
            bottom: 40,
            left: '50%',
            transform: 'translateX(-50%)',
            minWidth: 112,
            padding: 6,
            borderRadius: 12,
            background: '#1f1f1f',
            border: '1px solid rgba(255,255,255,.1)',
          }}>
            {CROP_ASPECTS.map(item => (
              <button
                key={item.id}
                type="button"
                className="dx-menu-item"
                style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', border: 'none',
                  borderRadius: 8, background: props.aspect === item.id ? 'rgba(255,255,255,.1)' : 'transparent',
                  color: dx.ink, fontSize: 12, fontFamily: dx.font, cursor: 'pointer',
                }}
                onClick={() => { props.onAspect(item.id); setOpen(false) }}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <button
        type="button"
        className="dx-hit"
        disabled={props.busy === true}
        style={{ ...dxGhostBtn, width: 'auto', height: 32, padding: '0 14px', borderRadius: 999, fontSize: 12, background: '#f3f3f3', color: '#141414', gap: 6 }}
        onClick={props.onConfirm}
      >
        <IconCheck size={14} />
        确认裁剪
      </button>
    </div>
  )
}
