import { useCallback, useEffect, useState, useSyncExternalStore, Component, type CSSProperties, type ReactNode } from 'react'
import { closeEditor, editorSnapshot, setEditorTab, subscribeEditor, type EditorTab } from './editor.ts'
import { CanvasTab } from './CanvasTab.tsx'
import { ImageEditBody } from './ImageEditBody.tsx'
import { VideoEditBody } from './VideoEditBody.tsx'

/**
 * The dock as a first-class layout column: registered as the `details` slot
 * occupant, so the conversation area reflows around it (the harness column
 * solver squeezes the center and auto-closes this column on narrow
 * viewports). Tabs: canvas / image editor / video editor.
 */

interface EditRecord { path: string; bytes: number; mediaType: string; name: string; at: number }

interface DetailsDockProps {
  /** Injected close: drives the harness layout column closed. */
  closeDetails?: () => void
}

function mediaUrlOf(path: string): string {
  return `/directorx/media?path=${encodeURIComponent(path)}`
}

async function loadBlobUrl(path: string): Promise<string> {
  const response = await fetch(mediaUrlOf(path))
  if (!response.ok) throw new Error(`媒体加载失败 (HTTP ${response.status})`)
  return URL.createObjectURL(await response.blob())
}

async function saveEdit(blob: Blob, name: string, mediaType: string): Promise<EditRecord> {
  const response = await fetch('/directorx/media', {
    method: 'POST',
    headers: { 'content-type': mediaType, 'x-directorx-name': encodeURIComponent(name) },
    body: blob,
  })
  if (!response.ok) {
    const bodyText = await response.text().catch(() => '')
    throw new Error(`保存失败 (HTTP ${response.status}): ${bodyText.slice(0, 200)}`)
  }
  return response.json() as Promise<EditRecord & { name: string }>
}

const column: CSSProperties = { display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-secondary, #10131a)' }
const headerBar: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid rgba(128,140,160,.25)' }
const tabBar: CSSProperties = { display: 'flex', gap: 2, padding: '0 8px', borderBottom: '1px solid rgba(128,140,160,.2)', background: 'rgba(0,0,0,.18)' }
const tabItemBase: CSSProperties = { padding: '9px 12px', fontSize: 12.5, cursor: 'pointer', background: 'transparent', border: 'none', color: 'rgba(214,224,246,.62)' }
const body: CSSProperties = { flex: 1, overflow: 'auto' }
const emptyBox: CSSProperties = { padding: 16, fontSize: 13, opacity: .78, lineHeight: 1.6 }

const TABS: Array<{ id: EditorTab; label: string }> = [
  { id: 'canvas', label: '画布' },
  { id: 'image', label: '图片编辑' },
  { id: 'video', label: '视频编辑' },
]

class EditorBoundary extends Component<{ children: ReactNode }, { error: string | undefined }> {
  state = { error: undefined as string | undefined }

  static getDerivedStateFromError(error: unknown) {
    return { error: error instanceof Error ? error.message : String(error) }
  }

  render() {
    if (this.state.error !== undefined) {
      return <div style={{ padding: 16, fontSize: 12.5, color: '#ff9b8f' }}>编辑器组件出错：{this.state.error}（其它 Tab 不受影响）</div>
    }
    return this.props.children
  }
}

function RecentEdits(): ReactNode {
  const [edits, setEdits] = useState<EditRecord[]>([])
  const [error, setError] = useState<string | undefined>(undefined)
  useEffect(() => {
    let live = true
    fetch('/directorx/media/edits')
      .then(response => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then(data => { if (live) setEdits((data as { edits: EditRecord[] }).edits ?? []) })
      .catch(cause => { if (live) setError(cause instanceof Error ? cause.message : String(cause)) })
    return () => { live = false }
  }, [])
  if (error !== undefined) return <div style={emptyBox}>编辑历史加载失败：{error}</div>
  if (edits.length === 0) return <div style={emptyBox}>还没有编辑产物。在对话流里的生成卡片上点「编辑」，保存后会出现在这里。</div>
  return (
    <div style={{ padding: 12 }}>
      <div style={{ fontSize: 12, opacity: .65, marginBottom: 8 }}>最近保存的编辑产物（可用 directorx_edits 让 DSH 引用）</div>
      {edits.map(edit => (
        <div key={edit.path} style={{ fontSize: 12, marginBottom: 6, wordBreak: 'break-all', opacity: .85 }}>
          {edit.name}
          <div style={{ opacity: .55 }}>{edit.path}</div>
        </div>
      ))}
    </div>
  )
}

/** The details-column occupant: a first-class layout column, not an overlay. */
export function DirectorxDetailsDock(props: DetailsDockProps): ReactNode {
  const snapshot = useSyncExternalStore(subscribeEditor, editorSnapshot)
  const [sourceUrl, setSourceUrl] = useState<string | undefined>(undefined)
  const [loadError, setLoadError] = useState<string | undefined>(undefined)
  const [saved, setSaved] = useState<EditRecord | undefined>(undefined)

  useEffect(() => {
    let live = true
    setSourceUrl(undefined)
    setLoadError(undefined)
    setSaved(undefined)
    if (snapshot.path === null) return
    const path = snapshot.path
    void loadBlobUrl(path)
      .then(url => { if (live) setSourceUrl(url) })
      .catch(cause => { if (live) setLoadError(cause instanceof Error ? cause.message : String(cause)) })
    return () => { live = false }
  }, [snapshot.path])

  const onExport = useCallback((blob: Blob, mediaType: string) => {
    const name = snapshot.path?.split('/').pop() ?? 'edit'
    void saveEdit(blob, `edit-${name}`, mediaType)
      .then(record => setSaved(record))
      .catch(cause => setLoadError(cause instanceof Error ? cause.message : String(cause)))
  }, [snapshot.path])

  const close = useCallback(() => {
    closeEditor()
    props.closeDetails?.()
  }, [props])

  const title = snapshot.tab === 'canvas' ? 'DirectorX 画布' : snapshot.tab === 'video' ? '视频时间线编辑' : '图片编辑'

  return (
    <div style={column}>
      <div style={headerBar}>
        <strong style={{ fontSize: 13 }}>{title}</strong>
        <button onClick={close} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(128,140,160,.4)', background: 'transparent', color: 'inherit', cursor: 'pointer' }}>关闭</button>
      </div>
      <div style={tabBar}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            style={{
              ...tabItemBase,
              color: snapshot.tab === tab.id ? 'inherit' : tabItemBase.color,
              borderBottom: snapshot.tab === tab.id ? '2px solid rgba(128,160,255,.85)' : '2px solid transparent',
              fontWeight: snapshot.tab === tab.id ? 600 : 400,
            }}
            onClick={() => setEditorTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {snapshot.tab === 'canvas' ? (
        <div style={{ ...body, overflow: 'hidden' }}><EditorBoundary><CanvasTab /></EditorBoundary></div>
      ) : saved !== undefined ? (
        <div style={{ padding: 12, fontSize: 12.5 }}>
          <div style={{ color: '#8fdc9f', marginBottom: 6 }}>已保存 ✓</div>
          <div style={{ wordBreak: 'break-all', opacity: .85 }}>{saved.path}</div>
          <div style={{ opacity: .6, marginTop: 4 }}>{saved.mediaType} · {Math.round(saved.bytes / 1024)} KB</div>
          <button style={{ marginTop: 10, padding: '6px 12px' }} onClick={() => setSaved(undefined)}>继续编辑</button>
        </div>
      ) : snapshot.path === null ? (
        <div style={body}>
          <div style={emptyBox}>
            {snapshot.tab === 'image' ? '在对话流中生成图片后，卡片上的「编辑」按钮会把图片带到这里。' : '在对话流中生成视频后，卡片上的「编辑」按钮会把视频带到这里（时间线剪辑）。'}
          </div>
          <RecentEdits />
        </div>
      ) : loadError !== undefined ? (
        <div style={emptyBox}>加载失败：{loadError}</div>
      ) : sourceUrl === undefined ? (
        <div style={emptyBox}>正在加载媒体…</div>
      ) : snapshot.tab === 'image' ? (
        <div style={body}><EditorBoundary><ImageEditBody source={sourceUrl} path={snapshot.path} onExport={onExport} /></EditorBoundary></div>
      ) : (
        <div style={body}><EditorBoundary><VideoEditBody source={sourceUrl} path={snapshot.path} onExport={onExport} /></EditorBoundary></div>
      )}
    </div>
  )
}
