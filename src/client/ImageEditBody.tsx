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
const matteBtn: CSSProperties = {
  position: 'absolute', top: 10, right: 118, zIndex: 30,
  padding: '7px 14px', borderRadius: 7, border: '1px solid rgba(255,255,255,.35)',
  background: 'rgba(255,255,255,.1)', color: '#f5f5f5', fontSize: 12.5, cursor: 'pointer',
}
const overlay: CSSProperties = {
  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(16,19,26,.9)', zIndex: 40, fontSize: 13, color: '#dfe6f5',
}

// Transformers.js (Apache-2.0) + Xenova/modnet (Apache-2.0): in-browser
// background removal loaded on demand from the jsDelivr CDN so the plugin
// bundle stays lean. The global is cached after the first load.
const TF_GLOBAL = '__directorx_transformers'

async function loadTransformers(): Promise<any> {
  const cached = (window as unknown as Record<string, any>)[TF_GLOBAL]
  if (cached !== undefined) return cached
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.type = 'module'
    script.textContent = `import * as tf from '${window.location.origin}/directorx/vendor/transformers.min.js'; window.${TF_GLOBAL} = tf; window.dispatchEvent(new Event('${TF_GLOBAL}-ready'));`
    const timer = window.setTimeout(() => reject(new Error('transformers.js 加载超时（网络受限？）')), 120_000)
    const onReady = () => { window.clearTimeout(timer); resolve() }
    window.addEventListener(`${TF_GLOBAL}-ready`, onReady, { once: true })
    script.onerror = () => { window.clearTimeout(timer); reject(new Error('transformers.js 脚本加载失败')) }
    document.head.appendChild(script)
  })
  return (window as unknown as Record<string, any>)[TF_GLOBAL]
}

export function ImageEditBody(props: EditBodyProps): ReactNode {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<ImageEditor | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const [matting, setMatting] = useState(false)
  const [matteStatus, setMatteStatus] = useState<string | undefined>(undefined)
  const [matte, setMatte] = useState<{ url: string } | undefined>(undefined)

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

  const matteImage = async () => {
    const editor = editorRef.current
    if (editor === null || matting || busy) return
    setMatting(true)
    setError(undefined)
    setMatte(undefined)
    setMatteStatus('加载模型引擎…')
    try {
      const tf = await loadTransformers()
      const segmenter = await tf.pipeline('image-segmentation', 'Xenova/modnet', {
        progress_callback: (progress: { status: string; progress?: number }) => {
          if (progress.status === 'progress') setMatteStatus(`下载模型 ${Math.round((progress.progress ?? 0))}%`)
        },
      })
      setMatteStatus('抠图中…')
      const dataUrl = editor.toDataURL({ format: 'png', quality: 1 })
      const output = await segmenter(dataUrl)
      const result = Array.isArray(output) ? output[0] : output
      const mask = result.mask
      const source = new Image()
      source.src = dataUrl
      await source.decode()
      const canvas = document.createElement('canvas')
      canvas.width = mask.width
      canvas.height = mask.height
      const context = canvas.getContext('2d')
      if (context === null) throw new Error('canvas 2d context unavailable')
      context.drawImage(source, 0, 0, canvas.width, canvas.height)
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height)
      const maskCanvas = mask.toCanvas()
      const maskContext = maskCanvas.getContext('2d')
      if (maskContext === null) throw new Error('mask canvas unavailable')
      const maskData = maskContext.getImageData(0, 0, canvas.width, canvas.height).data
      for (let index = 0; index < pixels.data.length; index += 4) {
        // MODNet mask: white = foreground. Use the mask luminance as alpha.
        pixels.data[index + 3] = maskData[index]
      }
      context.putImageData(pixels, 0, 0)
      setMatte({ url: canvas.toDataURL('image/png') })
      setMatteStatus(undefined)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setMatting(false)
    }
  }

  const saveMatte = async () => {
    if (matte === undefined) return
    const blob = await (await fetch(matte.url)).blob()
    props.onExport(blob, 'image/png')
    setMatte(undefined)
  }

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
      <button style={matteBtn} disabled={matting} onClick={() => void matteImage()}>
        {matting ? '处理中…' : '智能抠图'}
      </button>
      <button style={exportBtn} disabled={busy || matting} onClick={exportPng}>
        {busy ? '导出中…' : '导出 PNG'}
      </button>
      {matteStatus !== undefined ? (
        <div style={{ ...overlay, background: 'rgba(16,19,26,.75)' }}>{matteStatus}</div>
      ) : null}
      {matte !== undefined ? (
        <div style={{ ...overlay, flexDirection: 'column', gap: 10 }}>
          <img src={matte.url} alt="抠图结果" style={{ maxWidth: '72%', maxHeight: '60%', borderRadius: 10, border: '1px solid rgba(255,255,255,.25)' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={exportBtn} onClick={() => void saveMatte()}>保存抠图</button>
            <button style={matteBtn} onClick={() => setMatte(undefined)}>关闭</button>
          </div>
        </div>
      ) : null}
      {error !== undefined ? <div style={overlay}>{error}</div> : null}
    </div>
  )
}
