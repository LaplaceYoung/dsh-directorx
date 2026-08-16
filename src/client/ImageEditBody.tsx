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

const wrapper: CSSProperties = { position: 'relative', height: '100%', minHeight: 420, width: '100%', background: '#0a0a0a', borderRadius: 12, overflow: 'hidden' }
const toolChip: CSSProperties = {
  padding: '7px 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,.18)',
  background: 'rgba(18,18,18,.85)', backdropFilter: 'blur(10px)', color: '#f0f0f0', fontSize: 12.5, cursor: 'pointer',
}
const exportBtn: CSSProperties = {
  ...toolChip,
  border: 'none', background: '#f5f5f5', color: '#171717', fontWeight: 600,
}
const overlay: CSSProperties = {
  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(10,10,10,.86)', backdropFilter: 'blur(4px)', zIndex: 40, fontSize: 13, color: '#ececec',
}
const overlayCard: CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center',
  background: 'rgba(18,18,18,.96)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 16,
  padding: 18, boxShadow: '0 12px 36px rgba(0,0,0,.6)', maxWidth: '86%',
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
  const [exportFormat, setExportFormat] = useState<'png' | 'jpg'>('png')

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
      const format = exportFormat === 'jpg' ? 'jpeg' : 'png'
      const dataUrl = editor.toDataURL({ format, quality: exportFormat === 'jpg' ? 0.92 : 1 })
      void fetch(dataUrl).then(response => response.blob()).then(blob => {
        props.onExport(blob, exportFormat === 'jpg' ? 'image/jpeg' : 'image/png')
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
      <div style={{ position: 'absolute', bottom: 10, left: 12, zIndex: 30, display: 'flex', gap: 6, alignItems: 'center', pointerEvents: 'none' }}>
        <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,.45)', padding: '4px 10px', borderRadius: 999, background: 'rgba(18,18,18,.75)', backdropFilter: 'blur(8px)' }}>滚轮缩放 · 拖拽平移 · 底部菜单：裁剪/旋转/滤镜/文字</span>
      </div>
      <div style={{ position: 'absolute', top: 10, right: 12, zIndex: 30, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button style={toolChip} disabled={matting} onClick={() => void matteImage()}>
          {matting ? '处理中…' : '智能抠图'}
        </button>
        <div style={{ display: 'flex', padding: 3, borderRadius: 999, border: '1px solid rgba(255,255,255,.16)', background: 'rgba(18,18,18,.85)' }}>
          {(['png', 'jpg'] as const).map(format => (
            <button
              key={format}
              onClick={() => setExportFormat(format)}
              style={{ padding: '4px 10px', borderRadius: 999, border: 'none', background: exportFormat === format ? '#f5f5f5' : 'transparent', color: exportFormat === format ? '#171717' : '#d8d8d8', fontSize: 11, fontWeight: 600, cursor: 'pointer', textTransform: 'uppercase' }}
            >
              {format}
            </button>
          ))}
        </div>
        <button style={exportBtn} disabled={busy || matting} onClick={exportPng}>
          {busy ? '导出中…' : `导出 ${exportFormat.toUpperCase()}`}
        </button>
      </div>
      {matteStatus !== undefined ? (
        <div style={overlay}>
          <div style={overlayCard}>{matteStatus}</div>
        </div>
      ) : null}
      {matte !== undefined ? (
        <div style={overlay}>
          <div style={overlayCard}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#f5f5f5' }}>抠图结果预览</div>
            <img src={matte.url} alt="抠图结果" style={{ maxWidth: '100%', maxHeight: '52vh', borderRadius: 12, border: '1px solid rgba(255,255,255,.18)' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={exportBtn} onClick={() => void saveMatte()}>保存抠图</button>
              <button style={toolChip} onClick={() => setMatte(undefined)}>关闭</button>
            </div>
          </div>
        </div>
      ) : null}
      {error !== undefined ? <div style={{ ...overlay, zIndex: 50 }}><div style={overlayCard}>{error}</div></div> : null}
    </div>
  )
}
