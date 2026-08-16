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
  const [matte, setMatte] = useState<{ url: string; origUrl: string } | undefined>(undefined)
  const [brushMode, setBrushMode] = useState<'restore' | 'erase'>('erase')
  const [brushSize, setBrushSize] = useState(24)
  const [showOriginal, setShowOriginal] = useState(false)
  const matteCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const origImageRef = useRef<HTMLImageElement | null>(null)
  const paintingRef = useRef(false)
  const [exportFormat, setExportFormat] = useState<'png' | 'jpg'>('png')
  const [exportQuality, setExportQuality] = useState<'low' | 'medium' | 'high' | 'max'>('high')
  const [exportOpen, setExportOpen] = useState(false)
  const [exportResult, setExportResult] = useState<{ blob: Blob; url: string } | undefined>(undefined)

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
      const matteUrl = canvas.toDataURL('image/png')
      const orig = new Image()
      orig.src = dataUrl
      await orig.decode()
      origImageRef.current = orig
      setMatte({ url: matteUrl, origUrl: dataUrl })
      setMatteStatus(undefined)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setMatting(false)
    }
  }

  const brushAt = (x: number, y: number) => {
    const canvas = matteCanvasRef.current
    const orig = origImageRef.current
    if (canvas === null || orig === null) return
    const context = canvas.getContext('2d')
    if (context === null) return
    const rect = canvas.getBoundingClientRect()
    const sx = (x - rect.left) * (canvas.width / rect.width)
    const sy = (y - rect.top) * (canvas.height / rect.height)
    if (brushMode === 'erase') {
      context.globalCompositeOperation = 'destination-out'
      context.beginPath()
      context.arc(sx, sy, brushSize, 0, Math.PI * 2)
      context.fill()
      context.globalCompositeOperation = 'source-over'
    } else {
      // 涂抹恢复：从原图取样画回（非破坏源，蒙版独立）。
      context.drawImage(orig, sx - brushSize, sy - brushSize, brushSize * 2, brushSize * 2, sx - brushSize, sy - brushSize, brushSize * 2, brushSize * 2)
    }
  }

  const moveBrushCursor = (event: React.PointerEvent) => {
    const cursor = (event.currentTarget as HTMLElement).parentElement?.querySelector('.dx-brush-cursor') as HTMLElement | null
    if (cursor === null) return
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    cursor.style.display = 'block'
    cursor.style.left = `${event.clientX - rect.left}px`
    cursor.style.top = `${event.clientY - rect.top}px`
  }

  const beginBrush = (event: React.PointerEvent) => {
    event.preventDefault()
    paintingRef.current = true
    brushAt(event.clientX, event.clientY)
    const move = (moveEvent: PointerEvent) => brushAt(moveEvent.clientX, moveEvent.clientY)
    const up = () => {
      paintingRef.current = false
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  // [ ] 调整笔刷大小（输入框焦点保护）。
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (event.key === '[') setBrushSize(current => Math.max(4, current - 4))
      if (event.key === ']') setBrushSize(current => Math.min(120, current + 4))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const saveMatte = async () => {
    if (matte === undefined) return
    const canvas = matteCanvasRef.current
    const url = canvas !== null ? canvas.toDataURL('image/png') : matte.url
    const blob = await (await fetch(url)).blob()
    props.onExport(blob, 'image/png')
    setMatte(undefined)
    setBrushMode('erase')
  }

  const qualityValue = exportQuality === 'low' ? 0.5 : exportQuality === 'medium' ? 0.7 : exportQuality === 'high' ? 0.92 : 1
  const renderExport = async (): Promise<{ blob: Blob; url: string } | undefined> => {
    const editor = editorRef.current
    if (editor === null) return undefined
    const format = exportFormat === 'jpg' ? 'jpeg' : 'png'
    const dataUrl = editor.toDataURL({ format, quality: format === 'jpeg' ? qualityValue : 1 })
    const blob = await (await fetch(dataUrl)).blob()
    return { blob, url: URL.createObjectURL(blob) }
  }

  const exportPng = () => {
    if (busy) return
    setExportResult(undefined)
    setExportOpen(true)
  }

  const commitExport = async () => {
    if (busy) return
    setBusy(true)
    setError(undefined)
    try {
      const result = await renderExport()
      if (result === undefined) throw new Error('编辑器尚未就绪')
      setExportResult(result)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  const downloadExport = async () => {
    if (exportResult === undefined) return
    const link = document.createElement('a')
    link.href = exportResult.url
    link.download = `${(props.path.split('/').pop() ?? 'image').replace(/\.[^.]+$/, '')}-编辑.${exportFormat}`
    link.click()
  }

  const copyExport = async () => {
    if (exportResult === undefined) return
    try {
      await navigator.clipboard.write([new ClipboardItem({ [exportResult.blob.type]: exportResult.blob })])
    } catch {
      setError('复制到剪贴板失败（浏览器限制？）')
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
        <button style={exportBtn} disabled={busy || matting} onClick={exportPng}>
          {busy ? '导出中…' : '导出'}
        </button>
      </div>
      {exportOpen ? (
        <div style={overlay}>
          <div style={{ ...overlayCard, width: 340, maxWidth: '92%', alignItems: 'stretch' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#f5f5f5', textAlign: 'center' }}>导出图片</div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
              {(['png', 'jpg'] as const).map(format => (
                <button key={format} onClick={() => setExportFormat(format)} style={{ flex: 1, padding: '6px 10px', borderRadius: 9, border: exportFormat === format ? '1px solid rgba(245,245,245,.9)' : '1px solid rgba(255,255,255,.14)', background: exportFormat === format ? 'rgba(255,255,255,.12)' : 'transparent', color: '#f0f0f0', fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'uppercase' }}>{format}</button>
              ))}
            </div>
            {exportFormat === 'jpg' ? (
              <>
                <div style={{ fontSize: 11, color: '#9b9b9b' }}>质量</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {([['low', '低'], ['medium', '中'], ['high', '高'], ['max', '极大']] as const).map(([value, label]) => (
                    <button key={value} onClick={() => setExportQuality(value)} style={{ flex: 1, padding: '6px 8px', borderRadius: 9, border: exportQuality === value ? '1px solid rgba(245,245,245,.9)' : '1px solid rgba(255,255,255,.14)', background: exportQuality === value ? 'rgba(255,255,255,.12)' : 'transparent', color: '#f0f0f0', fontSize: 11.5, cursor: 'pointer' }}>{label}</button>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 10.5, color: '#666' }}>PNG 无损：适合透明背景（智能抠图结果）。</div>
            )}
            {exportResult !== undefined ? (
              <>
                <img src={exportResult.url} alt="导出预览" style={{ maxHeight: 200, objectFit: 'contain', borderRadius: 10, border: '1px solid rgba(255,255,255,.16)', background: '#000' }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={exportBtn} onClick={() => { props.onExport(exportResult.blob, exportFormat === 'jpg' ? 'image/jpeg' : 'image/png'); setExportOpen(false); setExportResult(undefined) }}>保存到 DirectorX</button>
                  <button style={toolChip} onClick={() => void downloadExport()}>下载本地</button>
                  <button style={toolChip} onClick={() => void copyExport()}>复制</button>
                  <button style={toolChip} onClick={() => { setExportOpen(false); setExportResult(undefined) }}>继续编辑</button>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={exportBtn} disabled={busy} onClick={() => void commitExport()}>{busy ? '生成中…' : `生成 ${exportFormat.toUpperCase()}`}</button>
                <button style={toolChip} onClick={() => setExportOpen(false)}>取消</button>
              </div>
            )}
          </div>
        </div>
      ) : null}
      {matteStatus !== undefined ? (
        <div style={overlay}>
          <div style={overlayCard}>{matteStatus}</div>
        </div>
      ) : null}
      {matte !== undefined ? (
        <div style={overlay}>
          <div style={{ ...overlayCard, width: 'min(720px, 94%)', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#f5f5f5', flex: 1 }}>抠图结果 · 笔刷精修</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => setBrushMode('erase')}
                  style={{ padding: '5px 10px', borderRadius: 999, border: brushMode === 'erase' ? '1px solid rgba(245,245,245,.9)' : '1px solid rgba(255,255,255,.14)', background: brushMode === 'erase' ? 'rgba(255,255,255,.14)' : 'transparent', color: '#f0f0f0', fontSize: 11.5, cursor: 'pointer' }}
                >
                  涂抹擦除
                </button>
                <button
                  onClick={() => setBrushMode('restore')}
                  style={{ padding: '5px 10px', borderRadius: 999, border: brushMode === 'restore' ? '1px solid rgba(245,245,245,.9)' : '1px solid rgba(255,255,255,.14)', background: brushMode === 'restore' ? 'rgba(255,255,255,.14)' : 'transparent', color: '#f0f0f0', fontSize: 11.5, cursor: 'pointer' }}
                >
                  涂抹恢复
                </button>
              </div>
            </div>
            <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,.16)', background: 'repeating-conic-gradient(#2a2a2a 0% 25%, #1d1d1d 0% 50%) 0 0 / 16px 16px' }}>
              {showOriginal ? (
                <img src={matte.origUrl} alt="原图" style={{ width: '100%', maxHeight: '46vh', objectFit: 'contain', display: 'block' }} />
              ) : (
                <canvas
                  ref={matteCanvasRef}
                  onPointerDown={beginBrush}
                  onPointerMove={moveBrushCursor}
                  onPointerLeave={event => {
                    const cursor = (event.currentTarget as HTMLElement).parentElement?.querySelector('.dx-brush-cursor') as HTMLElement | null
                    cursor?.style.setProperty('display', 'none')
                  }}
                  style={{ width: '100%', maxHeight: '46vh', objectFit: 'contain', display: 'block', touchAction: 'none', cursor: 'none' }}
                />
              )}
              {!showOriginal ? (
                <div style={{ position: 'absolute', left: 0, top: 0, width: brushSize * 2, height: brushSize * 2, borderRadius: 9999, border: '1px solid rgba(245,245,245,.8)', pointerEvents: 'none', transform: 'translate(-50%, -50%)', display: 'none' }} className="dx-brush-cursor" />
              ) : null}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: '#9b9b9b' }}>笔刷 {brushSize}px（[ / ] 调整）</span>
              <input type="range" min={4} max={120} value={brushSize} onChange={event => setBrushSize(Number(event.target.value))} style={{ flex: 1, minWidth: 120 }} />
              <button
                style={{ ...toolChip, ...(showOriginal ? { background: 'rgba(255,255,255,.18)' } : {}) }}
                onPointerDown={() => setShowOriginal(true)}
                onPointerUp={() => setShowOriginal(false)}
                onPointerLeave={() => setShowOriginal(false)}
                title="按住查看原图对比"
              >
                按住查看原图
              </button>
              <button style={exportBtn} onClick={() => void saveMatte()}>保存抠图</button>
              <button style={toolChip} onClick={() => { setMatte(undefined); setBrushMode('erase') }}>关闭</button>
            </div>
            <div style={{ fontSize: 10.5, color: '#666' }}>左键涂抹 · 擦除=去背景 · 恢复=取回原图 · 棋盘格即透明区</div>
          </div>
        </div>
      ) : null}
      {error !== undefined ? <div style={{ ...overlay, zIndex: 50 }}><div style={overlayCard}>{error}</div></div> : null}
    </div>
  )
}
