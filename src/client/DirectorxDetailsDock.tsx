import { useCallback, useEffect, useRef, useState, useSyncExternalStore, Component, type CSSProperties, type ReactNode } from 'react'
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
  /** Framework-standard current session id (details slot is session-scoped). */
  sessionId?: string
  connection?: {
    api?: {
      sessions?: {
        prompt: (payload: { sessionId: string; mode: 'queue' | 'steer'; content: Array<{ type: 'text'; text: string }> }) => Promise<{ result?: { ok?: boolean; error?: { message?: string } } }>
      }
    }
  }
}

function mediaUrlOf(path: string): string {
  return `/directorx/media?path=${encodeURIComponent(path)}`
}

async function loadBlobUrl(path: string): Promise<string> {
  const response = await fetch(mediaUrlOf(path))
  if (!response.ok) throw new Error(`媒体加载失败 (HTTP ${response.status})`)
  return URL.createObjectURL(await response.blob())
}

async function addToCanvas(path: string, name: string, mediaType: string): Promise<void> {
  const kind = mediaType.startsWith('video/') ? 'video' : 'image'
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const current = await fetch('/directorx/canvas').then(r => r.json()) as { updatedAt: number; title?: string; nodes: Array<{ id: string }>; edges: Array<{ id: string; from: string; to: string }> }
    const node = {
      id: `edit-${Date.now().toString(36)}-${attempt}`,
      kind,
      label: name,
      path,
      x: 240 + (current.nodes.length % 5) * 40,
      y: 240 + (current.nodes.length % 5) * 40,
    }
    const response = await fetch(`/directorx/canvas?expectedUpdatedAt=${current.updatedAt}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        version: 1,
        updatedAt: 0,
        ...(current.title !== undefined ? { title: current.title } : {}),
        nodes: [...(Array.isArray(current.nodes) ? current.nodes : []), node],
        edges: Array.isArray(current.edges) ? current.edges : [],
      }),
    })
    if (response.status === 409) continue
    if (!response.ok) throw new Error(`加入画布失败（HTTP ${response.status}）`)
    return
  }
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

const column: CSSProperties = { display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', background: 'var(--dsw-alias-bg-base)' }
const headerBar: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid var(--dsw-alias-border-l1)', color: 'var(--dsw-alias-label-primary)' }
const tabBar: CSSProperties = { display: 'flex', gap: 2, padding: '0 8px', borderBottom: '1px solid var(--dsw-alias-border-l1)', background: 'transparent' }
const tabItemBase: CSSProperties = { padding: '9px 12px', fontSize: 12.5, cursor: 'pointer', background: 'transparent', border: 'none', color: 'var(--dsw-alias-label-secondary)' }
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
  const [canvasFeed, setCanvasFeed] = useState<Record<string, string>>({})
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
        <div key={edit.path} style={{ fontSize: 12, marginBottom: 8, wordBreak: 'break-all', opacity: .85 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <span>{edit.name}</span>
            <button
              style={{ padding: '3px 8px', borderRadius: 7, border: '1px solid rgba(128,140,160,.4)', background: 'transparent', color: 'inherit', fontSize: 11, cursor: 'pointer', flexShrink: 0 }}
              onClick={() => {
                setCanvasFeed(current => ({ ...current, [edit.path]: '加入中…' }))
                void addToCanvas(edit.path, edit.name, edit.mediaType)
                  .then(() => setCanvasFeed(current => ({ ...current, [edit.path]: '已加入画布 ✓' })))
                  .catch(cause => setCanvasFeed(current => ({ ...current, [edit.path]: cause instanceof Error ? cause.message : String(cause) })))
              }}
            >
              {canvasFeed[edit.path] ?? '加入画布'}
            </button>
          </div>
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
  const rootRef = useRef<HTMLDivElement | null>(null)

  // Canvas is a full stage: take about half the window (floor 720).
  useEffect(() => {
    const applyDefaultWidth = () => {
      const root = rootRef.current
      if (root === null) return
      const col = root.closest('[class*="detailsCol"]') as HTMLElement | null
      if (col === null) return
      const target = Math.max(720, Math.round(window.innerWidth * 0.56))
      if (col.clientWidth === 0 || col.clientWidth < target) {
        col.style.width = `${target}px`
      }
    }
    const timer = window.setTimeout(applyDefaultWidth, 60)
    window.addEventListener('resize', applyDefaultWidth)
    return () => { window.clearTimeout(timer); window.removeEventListener('resize', applyDefaultWidth) }
  }, [])

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
      .then(record => {
        setSaved(record)
        // Reverse link: editor exports land on the canvas as media nodes.
        void addToCanvas(record.path, record.name, record.mediaType).catch(() => {})
      })
      .catch(cause => setLoadError(cause instanceof Error ? cause.message : String(cause)))
  }, [snapshot.path])

  const close = useCallback(() => {
    closeEditor()
    props.closeDetails?.()
  }, [props])

  const title = snapshot.tab === 'canvas' ? 'DirectorX 画布' : snapshot.tab === 'video' ? '视频时间线编辑' : '图片编辑'

  const canvasStage = snapshot.tab === 'canvas'
  return (
    <div ref={rootRef} style={{ ...column, background: canvasStage ? '#000' : column.background }}>
      {canvasStage ? (
        <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 50, display: 'flex', gap: 4, alignItems: 'center', padding: 4, borderRadius: 14, background: 'rgba(20,20,20,.72)', border: '1px solid rgba(255,255,255,.1)', backdropFilter: 'blur(16px)' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              style={{
                padding: '6px 10px', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 12,
                background: snapshot.tab === tab.id ? 'rgba(255,255,255,.12)' : 'transparent',
                color: snapshot.tab === tab.id ? '#f5f5f5' : '#9b9b9b',
              }}
              onClick={() => setEditorTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
          <button onClick={close} style={{ padding: '6px 10px', border: 'none', borderRadius: 10, background: 'transparent', color: '#9b9b9b', cursor: 'pointer', fontSize: 12 }}>关闭</button>
        </div>
      ) : (
        <>
      <div style={headerBar}>
        <strong style={{ fontSize: 13 }}>{title}</strong>
        <button onClick={close} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--dsw-alias-border-l2)', background: 'transparent', color: 'inherit', cursor: 'pointer' }}>关闭</button>
      </div>
      <div style={tabBar}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            style={{
              ...tabItemBase,
              color: snapshot.tab === tab.id ? 'var(--dsw-alias-label-primary)' : tabItemBase.color,
              borderBottom: snapshot.tab === tab.id ? '2px solid var(--dsw-alias-label-primary)' : '2px solid transparent',
              fontWeight: snapshot.tab === tab.id ? 600 : 400,
            }}
            onClick={() => setEditorTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
        </>
      )}
      {snapshot.tab === 'canvas' ? (
        <div style={{ ...body, overflow: 'hidden', position: 'relative', height: '100%' }}>
          <EditorBoundary>
            <CanvasTab
              sessionId={props.sessionId}
              onAskDsh={async (text) => {
                const sessionId = props.sessionId
                const prompt = props.connection?.api?.sessions?.prompt
                if (sessionId === undefined || sessionId === '' || prompt === undefined) {
                  throw new Error('没有活动的 DSH 会话，无法把画布交给 DSH')
                }
                const response = await prompt({ sessionId, mode: 'queue', content: [{ type: 'text', text }] })
                if (response.result?.ok === false) {
                  throw new Error(response.result.error?.message ?? 'DSH 未接受画布指令')
                }
              }}
            />
          </EditorBoundary>
        </div>
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
