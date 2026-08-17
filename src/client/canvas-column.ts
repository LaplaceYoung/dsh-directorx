/**
 * Details-column geometry for the canvas stage.
 * DSH clamps its own details track to 520px and rewrites the frame's
 * grid-template-columns on every layout render. A stylesheet !important
 * rule keyed off `.directorx-stage` wins that fight; CSS variables carry
 * the live widths so React's inline style cannot shrink the canvas.
 *
 * The override is applied only while the details column is already open.
 * It must not force the column open, and must not write styles from an
 * attribute observer on the frame (that loops with DSH's grid transition
 * and freezes the shell).
 */

export const DX_DETAILS_KEY = 'directorx-details-width'
export const DX_CHAT_MIN = 320
export const DX_DETAILS_FLOOR = 360
export const DX_STAGE_CLASS = 'directorx-stage'
const STYLE_ID = 'directorx-stage-style'

export function clampDetailsWidth(desired: number, viewport: number, sidebar: number): number {
  const max = Math.max(DX_DETAILS_FLOOR, viewport - sidebar - DX_CHAT_MIN)
  const rounded = Math.round(desired)
  if (rounded < DX_DETAILS_FLOOR) return Math.min(DX_DETAILS_FLOOR, max)
  if (rounded > max) return max
  return rounded
}

export function defaultDetailsWidth(viewport: number, sidebar: number): number {
  return clampDetailsWidth((viewport - sidebar) * 0.62, viewport, sidebar)
}

export function readStoredWidth(): number | undefined {
  try {
    const raw = localStorage.getItem(DX_DETAILS_KEY)
    if (raw === null) return undefined
    const value = Number(raw)
    return Number.isFinite(value) && value > 0 ? value : undefined
  } catch {
    return undefined
  }
}

export function writeStoredWidth(width: number): void {
  try {
    localStorage.setItem(DX_DETAILS_KEY, String(Math.round(width)))
  } catch {
    // storage unavailable
  }
}

export function measureFrame(frame: HTMLElement): { viewport: number; sidebar: number } {
  const viewport = Math.round(frame.getBoundingClientRect().width)
  const sidebar = frame.querySelector('[class*="sidebarCol"]') as HTMLElement | null
  const sidebarW = Math.round(sidebar?.getBoundingClientRect().width ?? 280)
  return { viewport, sidebar: sidebarW }
}

export function ensureStageStyle(): void {
  if (document.getElementById(STYLE_ID) !== null) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    .${DX_STAGE_CLASS} {
      transition: none !important;
      grid-template-columns: var(--dx-sidebar, 280px) minmax(0, 1fr) var(--dx-details, 720px) !important;
    }
    .${DX_STAGE_CLASS} [data-side="details"] {
      left: var(--dx-handle-left, calc(100% - var(--dx-details, 720px))) !important;
    }
    .${DX_STAGE_CLASS} [class*="detailsCol"] {
      height: 100%;
      min-width: 0;
      min-height: 0;
      position: relative;
    }
  `
  document.head.appendChild(style)
}

export function applyDetailsWidth(frame: HTMLElement, width: number): number {
  const { viewport, sidebar } = measureFrame(frame)
  const next = clampDetailsWidth(width, viewport, sidebar)
  const nextPx = `${next}px`
  const sidebarPx = `${sidebar}px`
  const handlePx = `${Math.max(0, viewport - next)}px`
  if (
    frame.classList.contains(DX_STAGE_CLASS)
    && frame.style.getPropertyValue('--dx-details') === nextPx
    && frame.style.getPropertyValue('--dx-sidebar') === sidebarPx
    && frame.style.getPropertyValue('--dx-handle-left') === handlePx
  ) {
    return next
  }
  ensureStageStyle()
  frame.classList.add(DX_STAGE_CLASS)
  frame.style.setProperty('--dx-sidebar', sidebarPx)
  frame.style.setProperty('--dx-details', nextPx)
  frame.style.setProperty('--dx-handle-left', handlePx)
  return next
}

export function clearDetailsOverride(frame: HTMLElement): void {
  if (!frame.classList.contains(DX_STAGE_CLASS)
    && frame.style.getPropertyValue('--dx-details') === '') {
    return
  }
  frame.classList.remove(DX_STAGE_CLASS)
  frame.style.removeProperty('--dx-sidebar')
  frame.style.removeProperty('--dx-details')
  frame.style.removeProperty('--dx-handle-left')
}

export function detailsColumnOpen(column: HTMLElement, frame: HTMLElement): boolean {
  if (frame.getAttribute('data-details-collapsed') !== null) return false
  return column.getBoundingClientRect().width >= 80
}

export function bindDetailsResize(frame: HTMLElement, column: HTMLElement): () => void {
  let dragging = false
  let startX = 0
  let startW = 0
  let current = readStoredWidth() ?? defaultDetailsWidth(measureFrame(frame).viewport, measureFrame(frame).sidebar)
  let restoreTimer = 0

  const apply = (width: number): number => {
    current = applyDetailsWidth(frame, width)
    return current
  }

  const restoreIfHostClamped = (): void => {
    if (dragging) return
    if (!detailsColumnOpen(column, frame)) {
      clearDetailsOverride(frame)
      return
    }
    const { viewport, sidebar } = measureFrame(frame)
    const wanted = readStoredWidth() ?? defaultDetailsWidth(viewport, sidebar)
    if (Math.abs(column.getBoundingClientRect().width - wanted) > 12) apply(wanted)
  }

  const scheduleRestore = (): void => {
    if (restoreTimer !== 0) window.clearTimeout(restoreTimer)
    restoreTimer = window.setTimeout(() => {
      restoreTimer = 0
      restoreIfHostClamped()
    }, 160)
  }

  if (detailsColumnOpen(column, frame)) apply(current)

  const onDown = (event: PointerEvent) => {
    const handle = event.currentTarget as HTMLElement
    if (handle.getAttribute('data-side') !== 'details') return
    if (!detailsColumnOpen(column, frame)) return
    dragging = true
    startX = event.clientX
    startW = column.getBoundingClientRect().width
  }
  const onMove = (event: PointerEvent) => {
    if (!dragging) return
    apply(startW - (event.clientX - startX))
  }
  const onUp = () => {
    if (!dragging) return
    dragging = false
    writeStoredWidth(current)
  }

  let bound: HTMLElement | null = null
  const ensureHandle = (): void => {
    const next = frame.querySelector('[data-side="details"]') as HTMLElement | null
    if (next === bound) return
    if (bound !== null) bound.removeEventListener('pointerdown', onDown)
    bound = next
    if (bound !== null) bound.addEventListener('pointerdown', onDown)
  }
  ensureHandle()

  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('resize', scheduleRestore)
  const observer = new ResizeObserver(() => {
    ensureHandle()
    scheduleRestore()
  })
  observer.observe(column)

  return () => {
    if (restoreTimer !== 0) window.clearTimeout(restoreTimer)
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('resize', scheduleRestore)
    observer.disconnect()
    if (bound !== null) bound.removeEventListener('pointerdown', onDown)
    clearDetailsOverride(frame)
  }
}
