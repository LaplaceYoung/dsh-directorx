import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import ImageEditor from 'tui-image-editor'
import 'tui-image-editor/dist/tui-image-editor.css'

/**
 * PS-style image editor, powered by tui.image-editor (MIT; the highest-star
 * open-source browser image editor — crop, rotate, flip, filters, drawing,
 * text, shapes, resize, undo/redo). It is framework-free (fabric.js canvas),
 * which sidesteps the React version coupling that broke the React-konva
 * based editor in this environment.
 *
 * The dock overlays its own export button: `editor.toDataURL()` is rastered
 * to a PNG blob and handed back through `onExport`.
 */

export interface EditBodyProps {
  source: string
  path: string
  onExport: (blob: Blob, mediaType: string) => void
}

const wrapper: CSSProperties = { position: 'relative', height: '100%', minHeight: 420, width: '100%' }
const exportBtn: CSSProperties = {
  position: 'absolute', top: 10, right: 12, zIndex: 30,
  padding: '7px 14px', borderRadius: 7, border: '1px solid rgba(128,160,255,.55)',
  background: 'rgba(80,130,255,.22)', color: '#dfe6f5', fontSize: 12.5, cursor: 'pointer',
}
const overlay: CSSProperties = {
  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(16,19,26,.9)', zIndex: 40, fontSize: 13, color: '#dfe6f5',
}

export function ImageEditBody(props: EditBodyProps): ReactNode {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<ImageEditor | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  useEffect(() => {
    const container = containerRef.current
    if (container === null) return
    let disposed = false
    const editor = new ImageEditor(container, {
      includeUI: {
        menu: ['crop', 'flip', 'rotate', 'draw', 'shape', 'text', 'filter', 'resize'],
        initMenu: 'filter',
        uiSize: { width: '100%', height: '100%' },
        menuBarPosition: 'bottom',
      },
      cssMaxWidth: 900,
      cssMaxHeight: 620,
      usageStatistics: false,
    })
    editorRef.current = editor
    editor.loadImageFromURL(props.source, props.path.split('/').pop() ?? 'image')
      .catch(cause => { if (!disposed) setError(cause instanceof Error ? cause.message : String(cause)) })
    return () => {
      disposed = true
      editorRef.current = null
      try {
        editor.destroy()
      } catch {
        // Editor teardown is best-effort.
      }
    }
  }, [props.source, props.path])

  const exportPng = () => {
    const editor = editorRef.current
    if (editor === null || busy) return
    setBusy(true)
    setError(undefined)
    try {
      const dataUrl = editor.toDataURL({ format: 'png', quality: 1 })
      void fetch(dataUrl).then(response => response.blob()).then(blob => {
        props.onExport(blob, 'image/png')
      }).catch(cause => {
        setError(cause instanceof Error ? cause.message : String(cause))
      }).finally(() => setBusy(false))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
      setBusy(false)
    }
  }

  return (
    <div style={wrapper}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
      <button style={exportBtn} disabled={busy} onClick={exportPng}>
        {busy ? '导出中…' : '导出 PNG'}
      </button>
      {error !== undefined ? <div style={overlay}>{error}</div> : null}
    </div>
  )
}
