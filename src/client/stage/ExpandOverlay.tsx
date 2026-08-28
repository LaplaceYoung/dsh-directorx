import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { dx, dxGhostBtn, dxPill } from '../canvas-theme.ts'
import { IconCheck, IconClose } from './icons.tsx'

type Rect = { x: number; y: number; w: number; h: number }
type Handle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

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

function grow(start: Rect, dx: number, dy: number, handle: Handle, well: Rect, inner: Rect): Rect {
  let x = start.x
  let y = start.y
  let w = start.w
  let h = start.h
  if (handle.includes('w')) { x += dx; w -= dx }
  if (handle.includes('e')) w += dx
  if (handle.includes('n')) { y += dy; h -= dy }
  if (handle.includes('s')) h += dy
  x = Math.max(well.x, Math.min(x, inner.x))
  y = Math.max(well.y, Math.min(y, inner.y))
  w = Math.max(inner.x + inner.w - x, Math.min(w, well.x + well.w - x))
  h = Math.max(inner.y + inner.h - y, Math.min(h, well.y + well.h - y))
  return { x, y, w, h }
}

const handleCursor: Record<Handle, string> = {
  n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize',
  ne: 'nesw-resize', sw: 'nesw-resize', nw: 'nwse-resize', se: 'nwse-resize',
}

function handleStyle(handle: Handle, rect: Rect): CSSProperties {
  const size = 10
  const half = size / 2
  const midX = rect.x + rect.w / 2 - half
  const midY = rect.y + rect.h / 2 - half
  const left = handle.includes('w') ? rect.x - half : handle.includes('e') ? rect.x + rect.w - half : midX
  const top = handle.includes('n') ? rect.y - half : handle.includes('s') ? rect.y + rect.h - half : midY
  return {
    position: 'absolute', left, top, width: size, height: size, borderRadius: 2,
    background: '#fff', boxShadow: '0 0 0 1px rgba(0,0,0,.45)', cursor: handleCursor[handle], zIndex: 3,
  }
}

function hostOf(): HTMLElement {
  return (document.querySelector('.dx-stage') as HTMLElement | null) ?? document.body
}

export function ExpandOverlay(props: {
  src: string
  onCancel: () => void
  onConfirm: (padded: Blob, mask: Blob) => void
}): ReactNode {
  const wellRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const drag = useRef<{ handle: Handle; x: number; y: number; rect: Rect } | undefined>(undefined)
  const [well, setWell] = useState<Rect>({ x: 0, y: 0, w: 0, h: 0 })
  const [inner, setInner] = useState<Rect>({ x: 0, y: 0, w: 0, h: 0 })
  const [outer, setOuter] = useState<Rect>({ x: 0, y: 0, w: 0, h: 0 })
  const [busy, setBusy] = useState(false)

  const measure = useCallback(() => {
    const root = wellRef.current
    const img = imgRef.current
    if (root === null || img === null || img.naturalWidth === 0) return
    const nextWell = { x: 0, y: 0, w: root.clientWidth, h: root.clientHeight }
    const nextInner = contentBox(nextWell.w, nextWell.h, img.naturalWidth, img.naturalHeight)
    setWell(nextWell)
    setInner(nextInner)
    setOuter(current => current.w < 8 ? nextInner : grow(current, 0, 0, 'se', nextWell, nextInner))
  }, [])

  useEffect(() => {
    measure()
    const root = wellRef.current
    if (root === null) return
    const observer = new ResizeObserver(() => measure())
    observer.observe(root)
    return () => observer.disconnect()
  }, [measure])

  const onDown = (handle: Handle) => (event: ReactPointerEvent<HTMLElement>) => {
    event.stopPropagation()
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { handle, x: event.clientX, y: event.clientY, rect: outer }
  }

  const onMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const active = drag.current
    if (active === undefined) return
    event.stopPropagation()
    setOuter(grow(active.rect, event.clientX - active.x, event.clientY - active.y, active.handle, well, inner))
  }

  const onUp = () => { drag.current = undefined }

  const confirm = async () => {
    const img = imgRef.current
    if (img === null || img.naturalWidth === 0 || outer.w < 8 || busy) return
    setBusy(true)
    try {
      const scale = img.naturalWidth / inner.w
      const width = Math.max(1, Math.round(outer.w * scale))
      const height = Math.max(1, Math.round(outer.h * scale))
      const dx = (inner.x - outer.x) * scale
      const dy = (inner.y - outer.y) * scale
      const padded = document.createElement('canvas')
      padded.width = width
      padded.height = height
      const ctx = padded.getContext('2d')
      if (ctx === null) return
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(img, dx, dy, img.naturalWidth, img.naturalHeight)
      const mask = document.createElement('canvas')
      mask.width = width
      mask.height = height
      const maskCtx = mask.getContext('2d')
      if (maskCtx === null) return
      maskCtx.fillStyle = '#fff'
      maskCtx.fillRect(0, 0, width, height)
      maskCtx.fillStyle = '#000'
      maskCtx.fillRect(dx, dy, img.naturalWidth, img.naturalHeight)
      const paddedBlob = await new Promise<Blob | null>(resolve => padded.toBlob(resolve, 'image/png'))
      const maskBlob = await new Promise<Blob | null>(resolve => mask.toBlob(resolve, 'image/png'))
      if (paddedBlob === null || maskBlob === null) return
      props.onConfirm(paddedBlob, maskBlob)
    } finally {
      setBusy(false)
    }
  }

  const handles: Handle[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']
  const dock = (
    <div className="nodrag nopan" style={{
      position: 'absolute', left: '50%', bottom: 28, transform: 'translateX(-50%)',
      display: 'flex', alignItems: 'center', gap: 10, minHeight: 52, padding: '8px 14px',
      borderRadius: 16, background: 'rgba(18,18,18,.94)', border: '1px solid rgba(255,255,255,.12)',
      zIndex: 28, fontFamily: dx.font, color: dx.mute, fontSize: 12,
    }}>
      <button type="button" className="dx-hit" title="取消" onClick={props.onCancel} style={{ ...dxGhostBtn, width: 32, height: 32 }}><IconClose size={14} /></button>
      拖拽外框进行扩图
      <button type="button" className="dx-cta" disabled={busy} onClick={() => { void confirm() }} style={{ ...dxPill, width: 36, height: 36 }}><IconCheck size={15} /></button>
    </div>
  )

  return (
    <div
      ref={wellRef}
      className="nodrag nopan dx-expand-overlay"
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      style={{ position: 'absolute', inset: 0, zIndex: 8, overflow: 'visible' }}
    >
      <div style={{ position: 'absolute', left: outer.x, top: outer.y, width: outer.w, height: outer.h, background: '#000' }} />
      <img
        ref={imgRef}
        src={props.src}
        alt=""
        onLoad={measure}
        style={{ position: 'absolute', left: inner.x, top: inner.y, width: inner.w, height: inner.h, objectFit: 'fill', pointerEvents: 'none' }}
      />
      <div style={{
        position: 'absolute', left: outer.x, top: outer.y, width: outer.w, height: outer.h,
        boxSizing: 'border-box', border: '1px solid #fff', boxShadow: '0 0 0 1px rgba(0,0,0,.35)',
        pointerEvents: 'none',
      }} />
      {handles.map(handle => (
        <div key={handle} className="nodrag nopan" onPointerDown={onDown(handle)} style={handleStyle(handle, outer)} />
      ))}
      {createPortal(dock, hostOf())}
    </div>
  )
}
