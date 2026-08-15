import { useCallback, useEffect, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react'
import { closeEditor, editorSnapshot, subscribeEditor, toggleEditor } from './editor.ts'
import { ImageEditBody } from './ImageEditBody.tsx'
import { VideoEditBody } from './VideoEditBody.tsx'

/**
 * Right-side editor dock, registered in `shell.overlay`. It is a
 * frame-wide floating surface: the layer is click-through, so this panel
 * opts back into pointer events while open. The dock hosts the image
 * (PS-style) and video (timeline) editors; tool cards open it with a file.
 */

const panel: CSSProperties = {
  position: 'fixed',
  top: 0,
  right: 0,
  bottom: 0,
  width: 'min(560px, 92vw)',
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--bg-secondary, #10131a)',
  borderLeft: '1px solid rgba(128, 140, 160, .3)',
  boxShadow: '-12px 0 32px rgba(0,0,0,.35)',
  zIndex: 60,
  pointerEvents: 'auto',
}

const handle: CSSProperties = {
  position: 'fixed',
  right: 0,
  top: '42%',
  padding: '10px 8px',
  writingMode: 'vertical-rl',
  border: '1px solid rgba(128,140,160,.35)',
  borderRight: 'none',
  borderRadius: '8px 0 0 8px',
  background: 'rgba(20,24,32,.92)',
  color: 'inherit',
  fontSize: 12,
  cursor: 'pointer',
  zIndex: 60,
  pointerEvents: 'auto',
}

const headerBar: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid rgba(128,140,160,.25)' }
const body: CSSProperties = { flex: 1, overflow: 'auto' }
const emptyBox: CSSProperties = { padding: 16, fontSize: 13, opacity: .78, lineHeight: 1.6 }

interface EditRecord { path: string; bytes: number; mediaType: string; name: string; at: number }

function mediaUrlOf(path: string): string {
  return `/directorx/media?path=${encodeURIComponent(path)}`
}

/** Fetch one local media file as a blob URL for the editor libraries. */
async function loadBlobUrl(path: string): Promise<string> {
  const response = await fetch(mediaUrlOf(path))
  if (!response.ok) throw new Error(`媒体加载失败 (HTTP ${response.status})`)
  return URL.createObjectURL(await response.blob())
}

/** Upload an editor export back to the host and return the saved record. */
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

function DockHandle(): ReactNode {
  const snapshot = useSyncExternalStore(subscribeEditor, editorSnapshot)
  if (snapshot.open) return null
  return (
    <button style={handle} onClick={toggleEditor} title="DirectorX 编辑面板">
      🎬 DirectorX 编辑
    </button>
  )
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

function DockPanel(): ReactNode {
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

  const title = snapshot.kind === 'video' ? '视频时间线编辑' : snapshot.kind === 'image' ? '图片编辑' : 'DirectorX 编辑'
  return (
    <div style={panel}>
      <div style={headerBar}>
        <strong style={{ fontSize: 13 }}>{title}</strong>
        <button onClick={closeEditor} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(128,140,160,.4)', background: 'transparent', color: 'inherit', cursor: 'pointer' }}>✕ 关闭</button>
      </div>
      {saved !== undefined ? (
        <div style={{ padding: 12, fontSize: 12.5 }}>
          <div style={{ color: '#8fdc9f', marginBottom: 6 }}>已保存 ✓</div>
          <div style={{ wordBreak: 'break-all', opacity: .85 }}>{saved.path}</div>
          <div style={{ opacity: .6, marginTop: 4 }}>{saved.mediaType} · {Math.round(saved.bytes / 1024)} KB</div>
          <button style={{ marginTop: 10, padding: '6px 12px' }} onClick={() => setSaved(undefined)}>继续编辑</button>
        </div>
      ) : snapshot.path === null ? (
        <div style={body}>
          <div style={emptyBox}>在对话流中生成图片或视频后，卡片上会出现「编辑」按钮，点击即在此打开对应编辑器。</div>
          <RecentEdits />
        </div>
      ) : loadError !== undefined ? (
        <div style={emptyBox}>加载失败：{loadError}</div>
      ) : sourceUrl === undefined ? (
        <div style={emptyBox}>正在加载媒体…</div>
      ) : snapshot.kind === 'image' ? (
        <div style={body}><ImageEditBody source={sourceUrl} path={snapshot.path} onExport={onExport} /></div>
      ) : (
        <div style={body}><VideoEditBody source={sourceUrl} path={snapshot.path} onExport={onExport} /></div>
      )}
    </div>
  )
}

/** Overlay entry component: handle when closed, dock panel when open. */
export function EditorDock(): ReactNode {
  const snapshot = useSyncExternalStore(subscribeEditor, editorSnapshot)
  return snapshot.open ? <DockPanel /> : <DockHandle />
}
