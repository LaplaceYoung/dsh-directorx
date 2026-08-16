import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import {
  ReactFlow, Background, BackgroundVariant, Controls, MiniMap,
  addEdge, applyEdgeChanges, applyNodeChanges,
  Handle, Position, NodeResizer, getBezierPath, ReactFlowProvider, useReactFlow, useStoreApi, SelectionMode, useViewport,
  type Connection, type Edge, type Node, type NodeProps, type NodeChange, type EdgeChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { openEditor } from './editor.ts'

/**
 * Infinite canvas tab (libtv / tapnow style): media nodes with live
 * previews, text cards, bezier connections, minimap, dot-grid background.
 * The document is durable — GET/PUT /directorx/canvas — and the agent mutates
 * the same document through directorx_canvas_* tools; a light poll reflects
 * agent edits while the tab has no unsaved local changes.
 */

type NodeCallbacks = {
  onRename?: (id: string, label: string) => void
  onDuplicate?: (id: string) => void
  onDelete?: (id: string) => void
  onDissolve?: (id: string) => void
}
type MediaNodeData = { kind: 'image' | 'video'; label: string; path: string; prompt?: string; shotIndex?: number; locked?: boolean; aiBrief?: string; onBranch?: (id: string, anchor: { x: number; y: number }) => void } & NodeCallbacks
type TextNodeData = { label: string; prompt?: string; shotIndex?: number; locked?: boolean; aiBrief?: string; onBranch?: (id: string, anchor: { x: number; y: number }) => void } & NodeCallbacks
type GroupNodeData = { label: string; groupHover?: boolean; memberCount?: number; locked?: boolean; shotStatus?: string; onCycleShotStatus?: (id: string) => void } & NodeCallbacks

type CanvasFlowNode = Node<MediaNodeData | TextNodeData | GroupNodeData>

interface MediaListFile { path: string; name: string; mediaType: string; size: number }

const flowStyles = {
  mediaCard: {
    borderRadius: 16, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.06)',
    boxShadow: 'none', overflow: 'hidden', minWidth: 128, cursor: 'pointer',
  } as CSSProperties,
  selectedCard: { border: '1px solid rgba(245,245,245,.95)', boxShadow: '0 0 0 1px rgba(245,245,245,.4)' } as CSSProperties,
  thumb: { width: 100 + '%', height: 88, objectFit: 'cover' as const, display: 'block', pointerEvents: 'none' as const },
  label: { fontSize: 11, padding: '7px 10px', color: '#efefef', wordBreak: 'break-word' as const, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as 'vertical', overflow: 'hidden' },
  textCard: {
    borderRadius: 16, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.06)',
    padding: '10px 12px', fontSize: 12, minWidth: 120, maxWidth: 240, cursor: 'pointer', color: '#efefef',
  } as CSSProperties,
  handle: { width: 7, height: 7, background: '#6f6f6f', border: '2px solid #000' } as CSSProperties,
}

function mediaUrl(path: string): string {
  return /^https?:\/\//i.test(path) ? path : `/directorx/media?path=${encodeURIComponent(path)}`
}

function baseName(path: string): string {
  const parts = path.split('/')
  return parts[parts.length - 1] ?? path
}

/** Inline rename: double-click a label to edit it in place. */
function RenameLabel({ value, id, onRename, style }: { value: string; id: string; onRename?: (id: string, label: string) => void; style: CSSProperties }): ReactNode {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const commit = () => {
    setEditing(false)
    const next = draft.trim()
    if (next !== '' && next !== value) onRename?.(id, next)
    else setDraft(value)
  }
  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        style={{ ...style, background: 'transparent', border: 'none', outline: '1px solid rgba(245,245,245,.6)', borderRadius: 4, color: '#f5f5f5', padding: 0, width: '100%', fontSize: 11.5 }}
        onChange={event => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={event => {
          if (event.key === 'Enter') commit()
          if (event.key === 'Escape') { setDraft(value); setEditing(false) }
        }}
        onClick={event => event.stopPropagation()}
        onDoubleClick={event => event.stopPropagation()}
      />
    )
  }
  return <div style={style} onDoubleClick={event => { event.stopPropagation(); setEditing(true) }}>{value}</div>
}

/** Hover action bar: ghost buttons overlaid on a node (tapnow-style card actions). */
function NodeActions({ actions }: { actions: Array<{ label: string; hint: string; run: () => void }> }): ReactNode {
  return (
    <div style={{ position: 'absolute', top: -38, left: 0, display: 'flex', gap: 4, zIndex: 4 }}>
      {actions.map(action => (
        <button
          key={action.label}
          title={action.hint}
          style={{
            padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,.22)',
            background: 'rgba(18,18,18,.92)', backdropFilter: 'blur(8px)', color: '#f5f5f5', fontSize: 11, cursor: 'pointer',
            boxShadow: '0 6px 16px rgba(0,0,0,.45)',
          }}
          onClick={event => { event.stopPropagation(); action.run() }}
        >
          {action.label}
        </button>
      ))}
    </div>
  )
}

function fmtTime(seconds: number): string {
  const s = Math.floor(seconds % 60)
  const m = Math.floor(seconds / 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function MediaNodeComponent(props: NodeProps): ReactNode {
  const data = props.data as unknown as MediaNodeData
  const selected = props.selected === true
  const [playing, setPlaying] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [progress, setProgress] = useState({ t: 0, d: 0 })
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const barRef = useRef<HTMLDivElement | null>(null)
  const togglePlay = (event?: React.MouseEvent) => {
    event?.stopPropagation()
    setPlaying(value => !value)
  }
  const seek = (event: React.MouseEvent) => {
    event.stopPropagation()
    const video = videoRef.current
    const bar = barRef.current
    if (video === null || bar === null || !Number.isFinite(video.duration)) return
    const rect = bar.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    video.currentTime = ratio * video.duration
  }
  const showControls = data.kind === 'video' && (hovered || playing)
  return (
    <div
      style={{ ...flowStyles.mediaCard, ...(selected ? flowStyles.selectedCard : {}), ...(hovered ? { transform: 'translateY(-2px)', boxShadow: '0 12px 28px rgba(0,0,0,.6)' } : {}), position: 'relative', transition: 'transform .15s ease, box-shadow .15s ease' }}
      onClick={() => openEditor(data.kind, data.path)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <NodeResizer isVisible={selected} minWidth={120} minHeight={80} color="rgba(245,245,245,.85)" />
      {hovered || selected ? (
        <NodeActions actions={[
          { label: '编辑', hint: '打开右侧编辑器（图片：抠图/翻转；视频：时间线剪辑）', run: () => openEditor(data.kind, data.path) },
          { label: '复制', hint: '复制节点', run: () => data.onDuplicate?.(props.id) },
          { label: '删除', hint: '删除节点', run: () => data.onDelete?.(props.id) },
        ]} />
      ) : null}
      <Handle id="in" type="target" position={Position.Left} style={{ ...flowStyles.handle, opacity: hovered || selected ? 1 : 0, transition: 'opacity .15s ease' }} />
      <span style={{ position: 'absolute', top: 6, left: 6, zIndex: 2, fontSize: 9.5, fontWeight: 600, padding: '2px 7px', borderRadius: 6, background: 'rgba(0,0,0,.6)', color: '#dcdcdc', letterSpacing: .5 }}>{data.kind === 'video' ? '视频' : '图像'}</span>
      {data.kind === 'image'
        ? <img src={mediaUrl(data.path)} alt={data.label} loading="lazy" style={{ ...flowStyles.thumb, ...(hovered ? { transform: 'scale(1.04)' } : {}) , transition: 'transform .2s ease' }} draggable={false} />
        : <video
            ref={ref => {
              videoRef.current = ref
              if (ref !== null) { playing ? void ref.play().catch(() => {}) : ref.pause() }
            }}
            src={mediaUrl(data.path)}
            muted={!playing}
            loop
            preload="metadata"
            style={flowStyles.thumb}
            draggable={false}
            onTimeUpdate={event => {
              const video = event.currentTarget
              setProgress({ t: video.currentTime, d: Number.isFinite(video.duration) ? video.duration : 0 })
            }}
            onLoadedMetadata={event => setProgress({ t: 0, d: event.currentTarget.duration })}
            onEnded={() => setPlaying(false)}
          />}
      {showControls ? (
        <div
          style={{
            position: 'absolute', left: 6, right: 6, bottom: 36, display: 'flex', alignItems: 'center', gap: 6,
            padding: '3px 6px', borderRadius: 8, background: 'rgba(0,0,0,.55)', zIndex: 2,
          }}
          onClick={event => event.stopPropagation()}
        >
          <button
            style={{ width: 20, height: 20, borderRadius: 10, border: '1px solid rgba(255,255,255,.35)', background: 'transparent', color: '#f5f5f5', fontSize: 9, cursor: 'pointer', lineHeight: 1, flexShrink: 0 }}
            onClick={togglePlay}
            title={playing ? '暂停' : '播放'}
          >
            {playing ? 'Ⅱ' : '▶'}
          </button>
          <div ref={barRef} style={{ flex: 1, height: 10, display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={seek}>
            <div style={{ height: 3, width: '100%', background: 'rgba(255,255,255,.25)', borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress.d > 0 ? Math.min(100, (progress.t / progress.d) * 100) : 0}%`, background: '#f5f5f5', borderRadius: 2 }} />
            </div>
          </div>
          <span style={{ fontSize: 9, color: '#d8d8d8', flexShrink: 0 }}>{fmtTime(progress.t)}/{fmtTime(progress.d)}</span>
        </div>
      ) : null}
      <RenameLabel id={props.id} value={data.label !== '' ? data.label : baseName(data.path)} onRename={data.onRename} style={flowStyles.label} />
      <Handle id="out" type="source" position={Position.Right} style={{ ...flowStyles.handle, opacity: hovered || selected ? 1 : 0, transition: 'opacity .15s ease' }} />
      {selected ? (
        <button
          title="以该节点为输入继续生成"
          onClick={event => { event.stopPropagation(); data.onBranch?.(props.id, { x: event.clientX, y: event.clientY }) }}
          style={{ position: 'absolute', right: -14, top: '50%', transform: 'translateY(-50%)', zIndex: 3, width: 26, height: 26, borderRadius: 9999, border: '1px solid rgba(255,255,255,.4)', background: '#0f0f0f', color: '#f5f5f5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, lineHeight: 1 }}
        >
          +
        </button>
      ) : null}
    </div>
  )
}

function TextNodeComponent(props: NodeProps): ReactNode {
  const data = props.data as unknown as TextNodeData
  const selected = props.selected === true
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{ ...flowStyles.textCard, ...(selected ? flowStyles.selectedCard : {}), ...(hovered && !selected ? { transform: 'translateY(-2px)', boxShadow: '0 10px 22px rgba(0,0,0,.5)' } : {}), position: 'relative', transition: 'transform .15s ease, box-shadow .15s ease' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <NodeResizer isVisible={selected} minWidth={100} minHeight={40} color="rgba(245,245,245,.85)" />
      {hovered ? (
        <NodeActions actions={[
          { label: '复制', hint: '复制节点', run: () => data.onDuplicate?.(props.id) },
          { label: '删除', hint: '删除节点', run: () => data.onDelete?.(props.id) },
        ]} />
      ) : null}
      <Handle id="in" type="target" position={Position.Left} style={{ ...flowStyles.handle, opacity: hovered || selected ? 1 : 0, transition: 'opacity .15s ease' }} />
      <RenameLabel id={props.id} value={data.label || '文本节点'} onRename={data.onRename} style={{ fontSize: 12.5, lineHeight: 1.5 }} />
      <Handle id="out" type="source" position={Position.Right} style={{ ...flowStyles.handle, opacity: hovered || selected ? 1 : 0, transition: 'opacity .15s ease' }} />
      {selected ? (
        <button
          title="以该节点为输入继续生成"
          onClick={event => { event.stopPropagation(); data.onBranch?.(props.id, { x: event.clientX, y: event.clientY }) }}
          style={{ position: 'absolute', right: -14, top: '50%', transform: 'translateY(-50%)', zIndex: 3, width: 26, height: 26, borderRadius: 9999, border: '1px solid rgba(255,255,255,.4)', background: '#0f0f0f', color: '#f5f5f5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, lineHeight: 1 }}
        >
          +
        </button>
      ) : null}
    </div>
  )
}

const SHOT_STATUS_COLORS: Record<string, string> = {
  idea: '#8a8a8a', approved: '#4f9dff', generating: '#4f9dff', review: '#e8b64f', locked: '#f5f5f5',
}
const SHOT_STATUS_LABELS: Record<string, string> = {
  idea: '想法', approved: '已批准', generating: '生成中', review: '审阅', locked: '锁定',
}

const groupFrame: CSSProperties = {
  borderRadius: 16, border: '1px dashed rgba(255,255,255,.22)', background: 'rgba(255,255,255,.02)',
  width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden',
}
const groupTitle: CSSProperties = {
  fontSize: 12, fontWeight: 600, color: '#f5f5f5', padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,.12)',
  background: 'rgba(255,255,255,.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
}

function GroupNodeComponent(props: NodeProps): ReactNode {
  const data = props.data as unknown as GroupNodeData
  const selected = props.selected === true
  const [hovered, setHovered] = useState(false)
  const highlight = data.groupHover === true || selected
  return (
    <div
      style={{ ...groupFrame, ...(highlight ? { border: '1px solid rgba(245,245,245,.85)', background: data.groupHover === true ? 'rgba(255,255,255,.07)' : groupFrame.background } : {}), position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <NodeResizer isVisible={selected} minWidth={260} minHeight={180} color="rgba(245,245,245,.85)" />
      <div style={groupTitle}>
        <RenameLabel id={props.id} value={data.label || '分组'} onRename={data.onRename} style={{ flex: 1, minWidth: 0 }} />
        <button
          title="镜头状态（点击循环：idea→approved→generating→review→locked）"
          onClick={event => { event.stopPropagation(); data.onCycleShotStatus?.(props.id) }}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '1px 8px', borderRadius: 999, border: '1px solid rgba(255,255,255,.16)', background: 'rgba(255,255,255,.06)', color: '#e8e8e8', fontSize: 10, cursor: 'pointer', flexShrink: 0 }}
        >
          <span style={{ width: 6, height: 6, borderRadius: 9999, background: SHOT_STATUS_COLORS[data.shotStatus ?? 'idea'] ?? '#8a8a8a', flexShrink: 0 }} />
          {SHOT_STATUS_LABELS[data.shotStatus ?? 'idea'] ?? 'idea'}
        </button>
        {data.memberCount !== undefined && data.memberCount > 0 ? (
          <span style={{ fontSize: 10, color: '#9b9b9b', padding: '1px 8px', borderRadius: 8, background: 'rgba(255,255,255,.08)', flexShrink: 0 }}>{data.memberCount} 个节点</span>
        ) : null}
      </div>
      {hovered || selected ? (
        <div style={{ position: 'absolute', top: 8, right: 10, display: 'flex', gap: 4 }}>
          <button style={{ padding: '3px 8px', borderRadius: 7, border: '1px solid rgba(255,255,255,.25)', background: 'rgba(0,0,0,.6)', color: '#f5f5f5', fontSize: 10.5, cursor: 'pointer' }} onClick={event => { event.stopPropagation(); (data as unknown as { onDissolve?: (id: string) => void }).onDissolve?.(props.id) }}>解散</button>
          <button style={{ padding: '3px 8px', borderRadius: 7, border: '1px solid rgba(255,255,255,.25)', background: 'rgba(0,0,0,.6)', color: '#f5f5f5', fontSize: 10.5, cursor: 'pointer' }} onClick={event => { event.stopPropagation(); data.onDelete?.(props.id) }}>删除</button>
        </div>
      ) : null}
    </div>
  )
}

const nodeTypes = { media: MediaNodeComponent, text: TextNodeComponent, group: GroupNodeComponent }

const toolbar: CSSProperties = {
  position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', gap: 2, alignItems: 'center',
  maxWidth: 'calc(100% - 24px)', flexWrap: 'wrap', justifyContent: 'center',
}
const ICONS = {
  media: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>,
  text: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7V5h16v2M12 5v14M9 19h6"/></svg>,
  group: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="3"/><rect x="8" y="8" width="8" height="8" rx="1.5"/></svg>,
  arrange: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  export: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3v12M7 8l5 5 5-5M4 21h16"/></svg>,
  reload: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6"/></svg>,
  plus: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>,
}

const toolBtn: CSSProperties = {
  padding: '6px 12px', borderRadius: 9, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.05)',
  color: '#ededed', fontSize: 12, cursor: 'pointer', transition: 'background .15s ease',
}
const iconBtn: CSSProperties = {
  width: 38, height: 38, borderRadius: 10, border: '1px solid transparent', background: 'transparent',
  color: '#efefef', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
}
const pillBtn: CSSProperties = {
  width: 40, height: 40, borderRadius: 9999, border: 'none', background: '#f5f5f5', color: '#171717',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
}
const picker: CSSProperties = {
  position: 'absolute', top: 46, left: 12, zIndex: 6, width: 300, maxHeight: 320, overflowY: 'auto',
  border: '1px solid rgba(255,255,255,.16)', borderRadius: 12, background: '#161616', padding: 10,
  boxShadow: '0 10px 30px rgba(0,0,0,.55)',
}
const pickerGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }
const pickerThumb: CSSProperties = { width: '100%', height: 56, objectFit: 'cover', borderRadius: 6, border: '1px solid rgba(255,255,255,.14)', display: 'block' }
const saveChip: CSSProperties = { fontSize: 11, padding: '4px 8px', borderRadius: 6, background: 'rgba(255,255,255,.08)', color: '#9be29b' }

interface CanvasDocument { version: number; updatedAt: number; title?: string; nodes: Array<{ id: string; kind: string; label: string; path?: string; parent?: string; x: number; y: number; width?: number; height?: number; prompt?: string; shotIndex?: number; locked?: boolean; aiBrief?: string; shotStatus?: string }>; edges: Array<{ id: string; from: string; to: string; label?: string; sourceVariantIdx?: number }> }

/** Absolute doc positions → flow nodes; children become parent-relative so XYFlow drags them with the group. */
function toFlowNodes(doc: CanvasDocument, callbacks?: Partial<NodeCallbacks>): CanvasFlowNode[] {
  const { onRename, onDuplicate, onDelete } = callbacks ?? {}
  const byId = new Map(doc.nodes.map(node => [node.id, node]))
  return doc.nodes.map(node => {
    const isMedia = node.kind === 'image' || node.kind === 'video'
    const isGroup = node.kind === 'group'
    const parentNode = node.parent !== undefined ? byId.get(node.parent) : undefined
    const position = parentNode !== undefined
      ? { x: node.x - parentNode.x, y: node.y - parentNode.y }
      : { x: node.x, y: node.y }
    return {
      id: node.id,
      type: isGroup ? 'group' : isMedia ? 'media' : 'text',
      position,
      style: { width: node.width ?? (isGroup ? 520 : 200), height: node.height ?? (isGroup ? 380 : undefined) },
      ...(parentNode !== undefined ? { parentId: parentNode.id, extent: 'parent' as const } : {}),
      data: isMedia
        ? { kind: node.kind as 'image' | 'video', label: node.label, path: node.path ?? '', prompt: node.prompt, shotIndex: node.shotIndex, locked: node.locked, aiBrief: node.aiBrief, onRename, onDuplicate, onDelete }
        : isGroup
          ? { label: node.label, memberCount: doc.nodes.filter(candidate => candidate.parent === node.id).length, locked: node.locked, onRename, onDuplicate, onDelete, onDissolve: callbacks?.onDissolve }
          : { label: node.label, prompt: node.prompt, shotIndex: node.shotIndex, locked: node.locked, aiBrief: node.aiBrief, onRename, onDuplicate, onDelete },
    }
  })
}

function toFlowEdges(doc: CanvasDocument): Edge[] {
  return doc.edges.map(edge => ({
    id: edge.id, source: edge.from, target: edge.to,
    sourceHandle: 'out', targetHandle: 'in',
    label: edge.label,
    ...(edge.sourceVariantIdx !== undefined ? { data: { sourceVariantIdx: edge.sourceVariantIdx } } : {}),
  }))
}

function newLocalId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function nodeMetrics(node: CanvasFlowNode): { width: number; height: number } {
  const width = typeof node.style?.width === 'number' ? node.style.width : 200
  const height = typeof node.style?.height === 'number' ? node.style.height : node.type === 'media' ? 126 : 42
  return { width, height }
}

/**
 * Self-owned edge layer: bezier connectors drawn inside the viewport pane, so
 * pan/zoom transform applies automatically. Deliberately independent of the
 * framework's edge pipeline (which proved unreliable for restored edges in
 * this environment); positions derive from the live nodes state. Paths are
 * clickable to select (stroke hit area), enabling UI deletion.
 */
function DirectorxEdges({ nodes, edges, selectedId, onSelect, onContext, onReconnect }: {
  nodes: CanvasFlowNode[]
  edges: Edge[]
  selectedId: string | undefined
  onSelect: (id: string | undefined) => void
  onContext: (edgeId: string, x: number, y: number) => void
  onReconnect: (edgeId: string, side: 'source' | 'target', endpointId: string) => void
}): ReactNode {
  const lookup = useMemo(() => new Map(nodes.map(node => [node.id, node])), [nodes])
  const [hoveredId, setHoveredId] = useState<string | undefined>(undefined)
  const { screenToFlowPosition } = useReactFlow()

  const dragEndpoint = (edge: Edge, side: 'source' | 'target') => (event: React.PointerEvent) => {
    event.stopPropagation()
    event.preventDefault()
    const move = (moveEvent: PointerEvent) => {
      // Visual feedback while dragging: nothing needed — the pointer affordance suffices.
      void moveEvent
    }
    const up = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      const flowPos = screenToFlowPosition({ x: upEvent.clientX, y: upEvent.clientY })
      const hit = nodes.find(node => {
        const m = nodeMetrics(node)
        return flowPos.x >= node.position.x && flowPos.x <= node.position.x + m.width
          && flowPos.y >= node.position.y && flowPos.y <= node.position.y + m.height
      })
      if (hit !== undefined && hit.id !== edge.id && !(side === 'source' ? hit.id === edge.target : hit.id === edge.source)) {
        onReconnect(edge.id, side, hit.id)
      }
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const paths = edges.map(edge => {
    const source = lookup.get(edge.source)
    const target = lookup.get(edge.target)
    if (source === undefined || target === undefined) return null
    const sm = nodeMetrics(source)
    const tm = nodeMetrics(target)
    const sourceX = source.position.x + sm.width
    const sourceY = source.position.y + sm.height / 2
    const targetX = target.position.x
    const targetY = target.position.y + tm.height / 2
    const [path] = getBezierPath({
      sourceX, sourceY, sourcePosition: Position.Right,
      targetX, targetY, targetPosition: Position.Left,
      curvature: 0.32,
    })
    const selected = edge.id === selectedId
    const hovered = edge.id === hoveredId
    return (
      <g key={edge.id}>
        <path
          d={path} fill="none"
          stroke="transparent"
          strokeWidth={20}
          pointerEvents="stroke"
          style={{ cursor: 'pointer' }}
          onClick={event => { event.stopPropagation(); onSelect(selected ? undefined : edge.id) }}
          onContextMenu={event => { event.preventDefault(); event.stopPropagation(); onContext(edge.id, event.clientX, event.clientY) }}
          onPointerEnter={() => setHoveredId(edge.id)}
          onPointerLeave={() => setHoveredId(current => current === edge.id ? undefined : current)}
        />
        <path
          d={path} fill="none"
          stroke={selected ? 'rgba(255,255,255,.85)' : hovered ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.3)'}
          strokeWidth={selected ? 2.2 : hovered ? 1.8 : 1.4}
          markerEnd="url(#dx-arrow)"
          pointerEvents="none"
        />
        <circle
          cx={sourceX} cy={sourceY} r={4.5} fill="#f5f5f5" opacity={hovered || selected ? 0.9 : 0}
          style={{ cursor: 'crosshair' }} pointerEvents="all"
          onPointerDown={dragEndpoint(edge, 'source')}
        />
        <circle
          cx={targetX} cy={targetY} r={4.5} fill="#f5f5f5" opacity={hovered || selected ? 0.9 : 0}
          style={{ cursor: 'crosshair' }} pointerEvents="all"
          onPointerDown={dragEndpoint(edge, 'target')}
        />
        {typeof edge.label === 'string' && edge.label !== '' ? (
          <text fontSize={10} fill="rgba(247,247,247,.65)" dy={-4} pointerEvents="none">
            <textPath href={`#dx-edge-${edge.id}`} startOffset="50%" textAnchor="middle">{edge.label}</textPath>
          </text>
        ) : null}
        <defs>
          <path id={`dx-edge-${edge.id}`} d={path} fill="none" />
        </defs>
      </g>
    )
  })
  return (
    <svg className="directorx-edges" style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none', zIndex: 0 }}>
      <defs>
        <marker id="dx-arrow" viewBox="0 -4 8 8" refX="7" refY="0" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0,-4 L8,0 L0,4 Z" fill="rgba(255,255,255,.55)" />
        </marker>
      </defs>
      {paths}
    </svg>
  )
}

function CanvasTabInner(): ReactNode {
  const [nodes, setNodes] = useState<CanvasFlowNode[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  // The debounced save reads the LATEST graph through refs: state updates from
  // the same tick would otherwise leave a stale closure behind.
  const nodesRef = useRef(nodes)
  const edgesRef = useRef(edges)
  // Breaks the renameNode → scheduleSave → applyDoc cycle: rename writes
  // through this late-bound ref.
  const saveRef = useRef<() => void>(() => {})
  useEffect(() => {
    nodesRef.current = nodes
    edgesRef.current = edges
  }, [nodes, edges])
  const updatedAtRef = useRef(0)
  const dirtyRef = useRef(false)
  const saveTimerRef = useRef<number | undefined>(undefined)
  const [saveState, setSaveState] = useState<'已保存' | '保存中…' | '已同步' | '冲突：画布已被修改'>('已保存')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [mediaFiles, setMediaFiles] = useState<MediaListFile[]>([])
  const [mediaQuery, setMediaQuery] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)
  const [selectedEdge, setSelectedEdge] = useState<string | undefined>(undefined)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | undefined>(undefined)
  const [connectMenu, setConnectMenu] = useState<{ x: number; y: number } | undefined>(undefined)
  const [nodeMenu, setNodeMenu] = useState<{ x: number; y: number; nodeId: string } | undefined>(undefined)
  const [edgeMenu, setEdgeMenu] = useState<{ x: number; y: number; edgeId: string; label: string } | undefined>(undefined)
  const [alignMenu, setAlignMenu] = useState<{ x: number; y: number } | undefined>(undefined)
  const [compareGroup, setCompareGroup] = useState<CanvasFlowNode | undefined>(undefined)
  const [flowWidth, setFlowWidth] = useState(1200)
  const [comparePick, setComparePick] = useState<string | undefined>(undefined)
  const [quickAdd, setQuickAdd] = useState<{ x: number; y: number } | undefined>(undefined)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [paletteQuery, setPaletteQuery] = useState('')
  const [paletteIndex, setPaletteIndex] = useState(0)
  const paletteInputRef = useRef<HTMLInputElement | null>(null)
  const arrowGestureRef = useRef<{ active: boolean; timer: number | undefined }>({ active: false, timer: undefined })
  const connectSourceRef = useRef<string | undefined>(undefined)
  const [selectedCount, setSelectedCount] = useState(0)
  const [guides, setGuides] = useState<{ vertical: number[]; horizontal: number[] }>({ vertical: [], horizontal: [] })
  const uploadInputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [conflict, setConflict] = useState<CanvasDocument | undefined>(undefined)
  const [agentEditFlash, setAgentEditFlash] = useState(false)
  const [title, setTitle] = useState('未命名画布')
  const titleRef = useRef('未命名画布')
  const cascadeRef = useRef(0)
  const undoStackRef = useRef<Array<{ nodes: CanvasFlowNode[]; edges: Edge[] }>>([])
  const redoStackRef = useRef<Array<{ nodes: CanvasFlowNode[]; edges: Edge[] }>>([])
  const resizingRef = useRef(false)
  const clipboardRef = useRef<{ nodes: CanvasFlowNode[]; edges: Edge[] } | undefined>(undefined)

  /** Snapshot the current graph into the undo stack (called before discrete mutations). */
  const pushHistory = useCallback(() => {
    undoStackRef.current.push({ nodes: nodesRef.current, edges: edgesRef.current })
    if (undoStackRef.current.length > 50) undoStackRef.current.shift()
    redoStackRef.current = []
  }, [])

  const undo = useCallback(() => {
    const previous = undoStackRef.current.pop()
    if (previous === undefined) return
    redoStackRef.current.push({ nodes: nodesRef.current, edges: edgesRef.current })
    nodesRef.current = previous.nodes
    edgesRef.current = previous.edges
    setNodes(previous.nodes)
    setEdges(previous.edges)
    saveRef.current()
  }, [setNodes, setEdges])

  const redo = useCallback(() => {
    const next = redoStackRef.current.pop()
    if (next === undefined) return
    undoStackRef.current.push({ nodes: nodesRef.current, edges: edgesRef.current })
    nodesRef.current = next.nodes
    edgesRef.current = next.edges
    setNodes(next.nodes)
    setEdges(next.edges)
    saveRef.current()
  }, [setNodes, setEdges])

  const renameNode = useCallback((id: string, label: string) => {
    pushHistory()
    setNodes(current => current.map(node => node.id === id
      ? { ...node, data: { ...node.data, label } }
      : node))
    saveRef.current()
  }, [setNodes])

  const duplicateNode = useCallback((id: string) => {
    pushHistory()
    setNodes(current => {
      const source = current.find(node => node.id === id)
      if (source === undefined) return current
      const copy: CanvasFlowNode = {
        ...source,
        id: newLocalId(source.type ?? 'text'),
        position: { x: source.position.x + 40, y: source.position.y + 40 },
        selected: false,
      }
      return [...current, copy]
    })
    saveRef.current()
  }, [setNodes])

  const dissolveGroup = useCallback((groupId: string) => {
    pushHistory()
    setNodes(current => {
      const group = current.find(node => node.id === groupId)
      if (group === undefined) return current
      return current
        .filter(node => node.id !== groupId)
        .map(node => node.parentId === groupId
          ? { ...node, parentId: undefined, extent: undefined, position: { x: node.position.x + group.position.x, y: node.position.y + group.position.y } }
          : node)
    })
    setEdges(current => current.filter(edge => edge.source !== groupId && edge.target !== groupId))
    saveRef.current()
  }, [setNodes, setEdges, pushHistory])

  const deleteNode = useCallback((id: string) => {
    pushHistory()
    setNodes(current => current.filter(node => node.id !== id))
    setEdges(current => current.filter(edge => edge.source !== id && edge.target !== id))
    saveRef.current()
  }, [setNodes, setEdges])

  const nodeCallbacks = useMemo<NodeCallbacks>(() => ({
    onRename: renameNode, onDuplicate: duplicateNode, onDelete: deleteNode, onDissolve: dissolveGroup,
  }), [renameNode, duplicateNode, deleteNode, dissolveGroup])

  const applyDoc = useCallback((doc: CanvasDocument) => {
    updatedAtRef.current = doc.updatedAt
    const nextTitle = typeof doc.title === 'string' && doc.title !== '' ? doc.title : '未命名画布'
    titleRef.current = nextTitle
    setTitle(nextTitle)
    setNodes(toFlowNodes(doc, nodeCallbacks))
    setEdges(toFlowEdges(doc))
  }, [setNodes, setEdges, nodeCallbacks])

  const load = useCallback(async () => {
    try {
      const response = await fetch('/directorx/canvas')
      if (!response.ok) throw new Error(`canvas load failed (${response.status})`)
      applyDoc(await response.json() as CanvasDocument)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }, [applyDoc])

  useEffect(() => { void load() }, [load])

  // 未保存更改时阻止无提示离开（报告 11.1）。
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        event.preventDefault()
        event.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  const saveNow = useCallback(async () => {
    if (!dirtyRef.current) return
    setSaveState('保存中…')
    try {
      const currentNodes = nodesRef.current
      const currentEdges = edgesRef.current
      // Persist ABSOLUTE positions: children are parent-relative in the flow
      // state, so add the parent's position back on save.
      const parentPos = new Map<string, { x: number; y: number }>()
      for (const node of currentNodes) parentPos.set(node.id, node.position)
      const doc = {
        version: 1,
        updatedAt: updatedAtRef.current,
        ...(titleRef.current !== '' && titleRef.current !== '未命名画布' ? { title: titleRef.current } : {}),
        nodes: currentNodes.map(node => {
          const absolute = node.parentId !== undefined && node.parentId !== ''
            ? { x: node.position.x + (parentPos.get(node.parentId)?.x ?? 0), y: node.position.y + (parentPos.get(node.parentId)?.y ?? 0) }
            : { x: node.position.x, y: node.position.y }
          const data = node.data as (MediaNodeData & Partial<TextNodeData>)
          return {
            id: node.id,
            kind: node.type === 'media' ? (node.data as MediaNodeData).kind : node.type === 'group' ? 'group' : 'text',
            label: node.data.label,
            ...(node.type === 'media' ? { path: (node.data as MediaNodeData).path } : {}),
            ...(data.prompt !== undefined ? { prompt: data.prompt } : {}),
            ...(data.shotIndex !== undefined ? { shotIndex: data.shotIndex } : {}),
            ...(data.locked === true ? { locked: true } : {}),
            ...(data.aiBrief !== undefined ? { aiBrief: data.aiBrief } : {}),
            ...((data as unknown as { shotStatus?: string }).shotStatus !== undefined ? { shotStatus: (data as unknown as { shotStatus: string }).shotStatus } : {}),
            ...(node.parentId !== undefined && node.parentId !== '' ? { parent: node.parentId } : {}),
            x: absolute.x, y: absolute.y,
            ...(typeof node.style?.width === 'number' ? { width: node.style.width } : {}),
            ...(typeof node.style?.height === 'number' ? { height: node.style.height } : {}),
          }
        }),
        edges: currentEdges.map(edge => ({ id: edge.id, from: edge.source, to: edge.target, label: typeof edge.label === 'string' ? edge.label : undefined, ...((edge as unknown as { sourceVariantIdx?: number }).sourceVariantIdx !== undefined ? { sourceVariantIdx: (edge as unknown as { sourceVariantIdx: number }).sourceVariantIdx } : {}) })),
      }
      const response = await fetch(`/directorx/canvas?expectedUpdatedAt=${updatedAtRef.current}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(doc),
      })
      if (response.status === 409) {
        // Agent (or another tab) edited the canvas: keep the local draft and
        // let the user arbitrate instead of silently discarding it.
        const fresh = await fetch('/directorx/canvas').then(r => r.json()) as CanvasDocument
        setConflict(fresh)
        setSaveState('冲突：画布已被修改')
        return
      }
      if (!response.ok) throw new Error(`canvas save failed (${response.status})`)
      const saved = await response.json() as CanvasDocument
      updatedAtRef.current = saved.updatedAt
      dirtyRef.current = false
      setSaveState('已保存')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
      setSaveState('已保存')
    }
  }, [applyDoc])

  const conflictKeepMine = useCallback(() => {
    if (conflict === undefined) return
    // Re-save the local draft against the freshly observed revision.
    updatedAtRef.current = conflict.updatedAt
    setConflict(undefined)
    dirtyRef.current = true
    setSaveState('保存中…')
    void saveNow()
  }, [conflict, saveNow])

  const conflictLoadFresh = useCallback(() => {
    if (conflict === undefined) return
    applyDoc(conflict)
    setConflict(undefined)
    dirtyRef.current = false
    setSaveState('已同步')
  }, [conflict, applyDoc])

  const scheduleSave = useCallback(() => {
    dirtyRef.current = true
    setSaveState('保存中…')
    if (saveTimerRef.current !== undefined) window.clearTimeout(saveTimerRef.current)
    saveTimerRef.current = window.setTimeout(() => { void saveNow() }, 500)
  }, [saveNow])

  useEffect(() => {
    saveRef.current = scheduleSave
  }, [scheduleSave])

  // Light poll: reflect agent-side canvas edits while nothing local is pending.
  // Background tabs throttle timers, so re-poll on focus and visibility too.
  useEffect(() => {
    const refresh = () => {
      if (dirtyRef.current) return
      void fetch('/directorx/canvas').then(r => r.json()).then((doc: CanvasDocument) => {
        if (doc.updatedAt !== updatedAtRef.current) {
          applyDoc(doc)
          setSaveState('已同步')
          // F4: surface remote (agent) edits briefly.
          setAgentEditFlash(true)
          window.setTimeout(() => setAgentEditFlash(false), 2600)
        }
      }).catch(() => {})
    }
    const timer = window.setInterval(refresh, 4000)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [applyDoc])

  const flowInstance = useReactFlow()
  const storeApi = useStoreApi()
  const { screenToFlowPosition, fitView, zoomIn, zoomOut, setViewport } = flowInstance
  const { zoom } = useViewport()
  // Keyboard shortcuts: Cmd/Ctrl+D duplicates the selection, Backspace/Delete
  // deletes selected nodes (via onNodesChange) or the selected edge, Escape
  // closes the floating menus.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing = target !== null && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      if (typing) return
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        const selected = nodesRef.current.filter(node => node.selected === true)
        if (selected.length === 0) return
        event.preventDefault()
        const step = event.shiftKey ? 10 : 1
        const dx = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0
        const dy = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0
        if (!arrowGestureRef.current.active) {
          pushHistory()
          arrowGestureRef.current.active = true
        }
        if (arrowGestureRef.current.timer !== undefined) window.clearTimeout(arrowGestureRef.current.timer)
        arrowGestureRef.current.timer = window.setTimeout(() => { arrowGestureRef.current.active = false }, 500)
        setNodes(current => current.map(node => node.selected === true
          ? { ...node, position: { x: node.position.x + dx, y: node.position.y + dy } }
          : node))
        saveRef.current()
        return
      }
      if (event.key === 'Escape') {
        setContextMenu(undefined)
        setConnectMenu(undefined)
        setQuickAdd(undefined)
        setPickerOpen(false)
        setSelectedEdge(undefined)
        setPaletteOpen(false)
        setNodes(current => current.map(node => node.selected === true ? { ...node, selected: false } : node))
        setSelectedCount(0)
        return
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedEdge !== undefined) {
          event.preventDefault()
          setEdges(current => current.filter(edge => edge.id !== selectedEdge))
          setSelectedEdge(undefined)
          scheduleSave()
        }
        return
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
        return
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault()
        redo()
        return
      }
      if ((event.metaKey || event.ctrlKey) && (event.key === '=' || event.key === '+')) {
        event.preventDefault()
        void zoomIn()
        return
      }
      if ((event.metaKey || event.ctrlKey) && event.key === '-') {
        event.preventDefault()
        void zoomOut()
        return
      }
      if ((event.metaKey || event.ctrlKey) && event.key === '0') {
        event.preventDefault()
        void fitView({ padding: 0.15, duration: 300 })
        return
      }
      if ((event.metaKey || event.ctrlKey) && event.key === '2') {
        event.preventDefault()
        const selected = nodesRef.current.filter(node => node.selected === true)
        if (selected.length > 0) void fitView({ nodes: selected, padding: 0.3, duration: 300 })
        return
      }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        const selected = nodesRef.current.filter(node => node.selected === true)
        if (selected.length === 0) return
        event.preventDefault()
        const step = event.shiftKey ? 10 : 1
        const dx = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0
        const dy = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0
        if (!arrowGestureRef.current.active) {
          pushHistory()
          arrowGestureRef.current.active = true
        }
        if (arrowGestureRef.current.timer !== undefined) window.clearTimeout(arrowGestureRef.current.timer)
        arrowGestureRef.current.timer = window.setTimeout(() => { arrowGestureRef.current.active = false }, 500)
        setNodes(current => current.map(node => node.selected === true
          ? { ...node, position: { x: node.position.x + dx, y: node.position.y + dy } }
          : node))
        saveRef.current()
        return
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen(open => !open)
        setPaletteQuery('')
        return
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'a') {
        event.preventDefault()
        setNodes(current => current.map(node => ({ ...node, selected: true })))
        setSelectedCount(nodesRef.current.length)
        return
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'c') {
        const selected = nodesRef.current.filter(node => node.selected === true)
        if (selected.length === 0) return
        const ids = new Set(selected.map(node => node.id))
        clipboardRef.current = {
          nodes: selected,
          edges: edgesRef.current.filter(edge => ids.has(edge.source) && ids.has(edge.target)),
        }
        return
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'v') {
        const clipboard = clipboardRef.current
        if (clipboard === undefined || clipboard.nodes.length === 0) return
        pushHistory()
        const idMap = new Map(clipboard.nodes.map(node => [node.id, newLocalId(node.type ?? 'text')]))
        const pasted: CanvasFlowNode[] = clipboard.nodes.map(node => ({
          ...node,
          id: idMap.get(node.id) as string,
          position: { x: node.position.x + 40, y: node.position.y + 40 },
          selected: true,
        }))
        setNodes(current => [...current.map(node => ({ ...node, selected: false })), ...pasted])
        setEdges(current => [...current, ...clipboard.edges.map(edge => ({
          ...edge,
          id: newLocalId('edge'),
          source: idMap.get(edge.source) ?? edge.source,
          target: idMap.get(edge.target) ?? edge.target,
        }))])
        setSelectedCount(pasted.length)
        saveRef.current()
        return
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'd') {
        event.preventDefault()
        const selected = nodesRef.current.filter(node => node.selected === true)
        if (selected.length === 0) return
        pushHistory()
        setNodes(current => {
          const copies = selected.map(node => ({
            ...node,
            id: newLocalId(node.type ?? 'text'),
            position: { x: node.position.x + 40, y: node.position.y + 40 },
            selected: false,
          }))
          return [...current.map(node => node.selected === true ? { ...node, selected: false } : node), ...copies]
        })
        setSelectedCount(0)
        scheduleSave()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedEdge, setEdges, scheduleSave, undo, redo, zoomIn, zoomOut, fitView])

  // Flush a pending debounced save when the tab unmounts, so closing the dock
  // never loses the last drag/edit.
  useEffect(() => () => {
    if (saveTimerRef.current !== undefined) window.clearTimeout(saveTimerRef.current)
    if (dirtyRef.current) void saveNow()
  }, [saveNow])

  const onNodesChange = useCallback((changes: NodeChange<CanvasFlowNode>[]) => {
    const removedIds = changes.filter(change => change.type === 'remove').map(change => change.id)
    const dimChange = changes.find(change => change.type === 'dimensions') as { resizing?: boolean } | undefined
    if (dimChange !== undefined) {
      if (dimChange.resizing === true && !resizingRef.current) {
        resizingRef.current = true
        pushHistory()
      }
      if (dimChange.resizing === false) resizingRef.current = false
    }
    setNodes(current => applyNodeChanges(changes, current))
    if (changes.some(change => change.type === 'dimensions')) scheduleSave()
    if (removedIds.length > 0) {
      // Orphaned children of a removed group become top-level again.
      setNodes(current => current.map(node => node.parentId !== undefined && removedIds.includes(node.parentId)
        ? { ...node, parentId: undefined, extent: undefined }
        : node))
      scheduleSave()
    }
  }, [scheduleSave])

  const onEdgesChange = useCallback((changes: EdgeChange<Edge>[]) => {
    setEdges(current => applyEdgeChanges(changes, current))
  }, [])

  const onNodeDragStart = useCallback(() => {
    pushHistory()
  }, [pushHistory])

  const onNodeDrag = useCallback((_event: unknown, node: CanvasFlowNode) => {
    // F1: highlight a group frame while a top-level node is dragged over it.
    if (node.parentId === undefined || node.parentId === '') {
      const cm = nodeMetrics(node)
      const cx = node.position.x + cm.width / 2
      const cy = node.position.y + cm.height / 2
      setNodes(current => current.map(candidate => {
        if (candidate.type !== 'group') return candidate
        const gm = nodeMetrics(candidate)
        const inside = cx >= candidate.position.x && cx <= candidate.position.x + gm.width
          && cy >= candidate.position.y && cy <= candidate.position.y + gm.height
        const flag = inside === true
        const data = candidate.data as unknown as GroupNodeData
        return data.groupHover === flag ? candidate : { ...candidate, data: { ...candidate.data, groupHover: flag } }
      }))
    }
    // LibTV-style alignment snapping (<=6px): pull the dragged node to the
    // nearest edge/center alignment and show guide lines.
    const snap = 6
    const width = nodeMetrics(node).width
    const height = nodeMetrics(node).height
    const others = nodesRef.current.filter(candidate => candidate.id !== node.id)
    const centers = others.flatMap(candidate => {
      const m = nodeMetrics(candidate)
      const cx = candidate.position.x + m.width / 2
      const cy = candidate.position.y + m.height / 2
      const cxr = candidate.position.x + m.width
      const cyb = candidate.position.y + m.height
      return [
        { axis: 'vertical' as const, value: candidate.position.x },
        { axis: 'vertical' as const, value: cx },
        { axis: 'vertical' as const, value: cxr },
        { axis: 'horizontal' as const, value: candidate.position.y },
        { axis: 'horizontal' as const, value: cy },
        { axis: 'horizontal' as const, value: cyb },
      ]
    })
    const candidates = [
      { axis: 'vertical' as const, value: node.position.x, offset: 0 },
      { axis: 'vertical' as const, value: node.position.x + width / 2, offset: width / 2 },
      { axis: 'vertical' as const, value: node.position.x + width, offset: width },
      { axis: 'horizontal' as const, value: node.position.y, offset: 0 },
      { axis: 'horizontal' as const, value: node.position.y + height / 2, offset: height / 2 },
      { axis: 'horizontal' as const, value: node.position.y + height, offset: height },
    ]
    const vertical: number[] = []
    const horizontal: number[] = []
    let vAdjust = 0
    let hAdjust = 0
    for (const candidate of candidates) {
      const nearest = centers
        .filter(target => target.axis === candidate.axis)
        .map(target => ({ target, delta: target.value - candidate.value }))
        .sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta))[0]
      if (nearest === undefined || Math.abs(nearest.delta) > snap) continue
      if (candidate.axis === 'vertical') {
        vertical.push(nearest.target.value)
        // Recompute the source edge from the dragged node's CURRENT position:
        // the value derived above already reflects it, so the offset maps
        // the matched edge back to the adjustment on x/y.
        vAdjust = nearest.delta
      } else {
        horizontal.push(nearest.target.value)
        hAdjust = nearest.delta
      }
    }
    setGuides({ vertical, horizontal })
    if (vAdjust !== 0 || hAdjust !== 0) {
      setNodes(current => current.map(candidate => candidate.id === node.id
        ? { ...candidate, position: { x: candidate.position.x + vAdjust, y: candidate.position.y + hAdjust } }
        : candidate))
    }
  }, [setNodes])

  const onNodeDragStop = useCallback((_event: unknown, node: CanvasFlowNode) => {
    setGuides({ vertical: [], horizontal: [] })
    setNodes(current => current.map(candidate => (candidate.data as unknown as GroupNodeData).groupHover === true
      ? { ...candidate, data: { ...candidate.data, groupHover: false } }
      : candidate))
    // Drag-out of a group: when a child lands outside the parent frame,
    // detach it (absolute coordinates) instead of locking it inside.
    if (node.parentId !== undefined && node.parentId !== '') {
      const parent = nodesRef.current.find(candidate => candidate.id === node.parentId)
      if (parent !== undefined) {
        const pm = nodeMetrics(parent)
        const cm = nodeMetrics(node)
        const absolute = { x: parent.position.x + node.position.x, y: parent.position.y + node.position.y }
        const outside = absolute.x < parent.position.x || absolute.y < parent.position.y
          || absolute.x + cm.width > parent.position.x + pm.width
          || absolute.y + cm.height > parent.position.y + pm.height
        if (outside) {
          setNodes(current => current.map(candidate => candidate.id === node.id
            ? { ...candidate, parentId: undefined, extent: undefined, position: absolute }
            : candidate))
        }
      }
    }
    // Drop-into-group: when a top-level node lands inside a group frame,
    // adopt it into the group (position becomes parent-relative).
    if (node.parentId === undefined || node.parentId === '') {
      const width = nodeMetrics(node).width
      const height = nodeMetrics(node).height
      const cx = node.position.x + width / 2
      const cy = node.position.y + height / 2
      setNodes(current => {
        const groups = current.filter(candidate => candidate.type === 'group')
        const group = groups.find(candidate => {
          const gw = nodeMetrics(candidate).width
          const gh = nodeMetrics(candidate).height
          return cx >= candidate.position.x && cx <= candidate.position.x + gw
            && cy >= candidate.position.y && cy <= candidate.position.y + gh
        })
        if (group === undefined) return current
        return current.map(candidate => candidate.id === node.id
          ? {
              ...candidate,
              parentId: group.id,
              extent: 'parent' as const,
              position: { x: candidate.position.x - group.position.x, y: candidate.position.y - group.position.y },
            }
          : candidate)
      })
    }
    scheduleSave()
  }, [scheduleSave])
  const onEdgesDelete = useCallback(() => scheduleSave(), [scheduleSave])

  const isPairValid = useCallback((source: string, target: string): boolean => {
    if (source === target) return false
    return !edgesRef.current.some(edge => edge.source === source && edge.target === target)
  }, [])

  const onConnect = useCallback((connection: Connection) => {
    if (connection.source === null || connection.target === null) return
    if (!isPairValid(connection.source, connection.target)) {
      setError('连线无效：不允许自连或重复连线')
      return
    }
    pushHistory()
    setEdges(current => addEdge({ ...connection, id: newLocalId('edge') }, current))
    scheduleSave()
  }, [setEdges, scheduleSave, pushHistory, isPairValid])

  const flowRootRef = useRef<HTMLDivElement | null>(null)
  const centerFlowPos = useCallback((): { x: number; y: number } => {
    const el = flowRootRef.current
    if (el !== null) {
      const rect = el.getBoundingClientRect()
      if (rect.width > 40 && rect.height > 40) {
        return screenToFlowPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
      }
    }
    return screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  }, [screenToFlowPosition])

  const addNodeAt = useCallback((node: CanvasFlowNode) => {
    pushHistory()
    cascadeRef.current += 1
    const offset = (cascadeRef.current % 5) * 32
    setNodes(current => [...current, { ...node, data: { ...node.data, ...nodeCallbacks }, position: { x: node.position.x + offset, y: node.position.y + offset } }])
    scheduleSave()
  }, [setNodes, scheduleSave, nodeCallbacks])

  const openPicker = useCallback(async () => {
    if (pickerOpen) { setPickerOpen(false); return }
    setPickerOpen(true)
    try {
      const response = await fetch('/directorx/media/list')
      const data = await response.json() as { files: MediaListFile[] }
      setMediaFiles(data.files ?? [])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }, [pickerOpen])

  // Group the flat media list into library sections by output subdirectory.
  const mediaSections = useMemo(() => {
    const sectionName = (file: MediaListFile): string => {
      const parts = file.path.split('/')
      const dir = parts.length >= 2 ? parts[parts.length - 2] ?? '' : ''
      if (dir === 'edited') return '编辑产物'
      if (dir === 'frames') return '抽帧'
      if (dir === 'transcripts') return '转录'
      return '生成'
    }
    const query = mediaQuery.trim().toLowerCase()
    const filtered = mediaFiles.filter(file => query === '' || file.name.toLowerCase().includes(query))
    const order = ['生成', '编辑产物', '抽帧', '转录']
    const groups = new Map<string, MediaListFile[]>()
    for (const file of filtered) {
      const name = sectionName(file)
      const list = groups.get(name) ?? []
      list.push(file)
      groups.set(name, list)
    }
    return order.map(name => ({ name, files: groups.get(name) ?? [] })).filter(section => section.files.length > 0)
  }, [mediaFiles, mediaQuery])

  const addMedia = useCallback((file: MediaListFile, fixedId?: string) => {
    const kind: 'image' | 'video' = file.mediaType.startsWith('video/') ? 'video' : 'image'
    addNodeAt({
      id: fixedId ?? newLocalId(kind), type: 'media', position: centerFlowPos(),
      data: { kind, label: file.name, path: file.path },
    })
    setPickerOpen(false)
  }, [addNodeAt, centerFlowPos])

  const addTextNode = useCallback(() => {
    addNodeAt({
      id: newLocalId('text'), type: 'text', position: centerFlowPos(),
      data: { label: '文本节点' },
    })
  }, [addNodeAt, centerFlowPos])

  const addGroup = useCallback(() => {
    addNodeAt({
      id: newLocalId('group'), type: 'group', position: centerFlowPos(),
      style: { width: 520, height: 380 },
      data: { label: '分组' },
    })
  }, [addNodeAt, centerFlowPos])

  const onSelectionChange = useCallback((params: { nodes: CanvasFlowNode[] }) => {
    setSelectedCount(params.nodes.length)
  }, [])


  useEffect(() => {
    ;(window as unknown as Record<string, unknown>).__dxFlowDebug = {
      storeEdges: () => flowInstance.getEdges().length,
      storeNodes: () => flowInstance.getNodes().length,
      sampleEdge: () => flowInstance.getEdges()[0] ?? null,
      rawState: () => {
        const state = storeApi.getState() as Record<string, unknown>
        return {
          stateEdges: (state.edges as unknown[] | undefined)?.length ?? null,
          lookupEdges: (state.edgeLookup as Map<string, unknown> | undefined)?.size ?? null,
          nodeLookupSize: (state.nodeLookup as Map<string, unknown> | undefined)?.size ?? null,
          nodeLookupKeys: [...((state.nodeLookup as Map<string, unknown> | undefined)?.keys() ?? [])].slice(0, 14),
          width: state.width, height: state.height,
        }
      },
    }
  }, [flowInstance])

  const mediaByPath = useMemo(() => new Map(mediaFiles.map(file => [file.path, file])), [mediaFiles])

  const onPaneDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }, [])

  const onPaneDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    const flowPos = screenToFlowPosition({ x: event.clientX, y: event.clientY })
    // OS files dragged in (A6) upload and land at the drop point.
    if (event.dataTransfer.files.length > 0) {
      void uploadFilesAt(Array.from(event.dataTransfer.files), flowPos)
      return
    }
    const path = event.dataTransfer.getData('text/plain')
    const file = mediaByPath.get(path)
    if (file === undefined) return
    const kind: 'image' | 'video' = file.mediaType.startsWith('video/') ? 'video' : 'image'
    setNodes(current => [...current, {
      id: newLocalId(kind), type: 'media', position: flowPos,
      data: { kind, label: file.name, path: file.path, ...nodeCallbacks },
    }])
    scheduleSave()
  }, [mediaByPath, screenToFlowPosition, setNodes, scheduleSave, nodeCallbacks])

  const onPaneDoubleClick = useCallback((event: React.MouseEvent) => {
    const flowPos = screenToFlowPosition({ x: event.clientX, y: event.clientY })
    addNodeAt({
      id: newLocalId('text'), type: 'text', position: flowPos,
      data: { label: '文本节点' },
    })
  }, [screenToFlowPosition, addNodeAt])

  const onConnectStart = useCallback((_event: unknown, params: { nodeId: string | null }) => {
    connectSourceRef.current = params.nodeId ?? undefined
  }, [])

  const onConnectEnd = useCallback((event: MouseEvent | TouchEvent) => {
    // Dropped on the empty pane (no target handle): offer to create a node
    // and auto-connect from the source (LibTV-style quick build).
    const point = 'clientX' in event ? { x: event.clientX, y: event.clientY }
      : event.touches.length > 0 ? { x: event.touches[0].clientX, y: event.touches[0].clientY }
      : undefined
    if (point === undefined) return
    const target = event.target as HTMLElement | null
    const isPane = target !== null && (target.closest('.react-flow__pane') !== null || !target.closest('.react-flow__handle'))
    const source = connectSourceRef.current
    if (source === undefined || !isPane) return
    setConnectMenu(point)
  }, [])

  const connectCreate = useCallback((factory: () => string) => {
    const source = connectSourceRef.current
    connectSourceRef.current = undefined
    setConnectMenu(undefined)
    if (source === undefined) return
    const id = factory()
    setEdges(current => [...current, { id: newLocalId('edge'), source, target: id, type: 'bezier' }])
    scheduleSave()
  }, [setEdges, scheduleSave])

  const quickAddAt = useCallback((factory: (flowPos: { x: number; y: number }) => void) => {
    const point = quickAdd
    setQuickAdd(undefined)
    if (point === undefined) return
    const flowPos = screenToFlowPosition({ x: point.x, y: point.y })
    factory(flowPos)
  }, [quickAdd, screenToFlowPosition])

  const quickAddText = useCallback(() => {
    quickAddAt(flowPos => {
      addNodeAt({ id: newLocalId('text'), type: 'text', position: flowPos, data: { label: '文本节点' } })
    })
  }, [quickAddAt, addNodeAt])

  const quickAddGroup = useCallback(() => {
    quickAddAt(flowPos => {
      addNodeAt({ id: newLocalId('group'), type: 'group', position: flowPos, style: { width: 520, height: 380 }, data: { label: '分组' } })
    })
  }, [quickAddAt, addNodeAt])

  const quickAddMedia = useCallback((kind: 'image' | 'video') => {
    setQuickAdd(undefined)
    setMediaQuery(kind)
    void openPicker()
  }, [openPicker])

  const connectAddText = useCallback(() => {
    const point = connectMenu
    connectCreate(() => {
      const id = newLocalId('text')
      const flowPos = point !== undefined ? screenToFlowPosition({ x: point.x, y: point.y }) : { x: 180, y: 180 }
      addNodeAt({ id, type: 'text', position: flowPos, data: { label: '文本节点' } })
      return id
    })
  }, [connectCreate, addNodeAt, connectMenu, screenToFlowPosition])

  const connectAddGroup = useCallback(() => {
    const point = connectMenu
    connectCreate(() => {
      const id = newLocalId('group')
      const flowPos = point !== undefined ? screenToFlowPosition({ x: point.x, y: point.y }) : { x: 180, y: 180 }
      addNodeAt({ id, type: 'group', position: flowPos, style: { width: 520, height: 380 }, data: { label: '分组' } })
      return id
    })
  }, [connectCreate, addNodeAt, connectMenu, screenToFlowPosition])

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: CanvasFlowNode) => {
    event.preventDefault()
    event.stopPropagation()
    setNodeMenu({ x: event.clientX, y: event.clientY, nodeId: node.id })
  }, [])

  const onEdgeContext = useCallback((edgeId: string, x: number, y: number) => {
    const edge = edgesRef.current.find(candidate => candidate.id === edgeId)
    setEdgeMenu({ x, y, edgeId, label: typeof edge?.label === 'string' ? edge.label : '' })
  }, [])

  const onEdgeReconnect = useCallback((edgeId: string, side: 'source' | 'target', endpointId: string) => {
    const edge = edgesRef.current.find(candidate => candidate.id === edgeId)
    if (edge === undefined) return
    const next = side === 'source' ? { source: endpointId, target: edge.target } : { source: edge.source, target: endpointId }
    if (!isPairValid(next.source, next.target)) {
      setError('连线无效：不允许自连或重复连线')
      return
    }
    pushHistory()
    setEdges(current => current.map(candidate => candidate.id === edgeId
      ? side === 'source' ? { ...candidate, source: endpointId } : { ...candidate, target: endpointId }
      : candidate))
    scheduleSave()
  }, [setEdges, scheduleSave, pushHistory, isPairValid])

  const saveEdgeLabel = useCallback(() => {
    if (edgeMenu === undefined) return
    const label = edgeMenu.label.trim()
    setEdges(current => current.map(edge => edge.id === edgeMenu.edgeId ? { ...edge, label } : edge))
    setEdgeMenu(undefined)
    scheduleSave()
  }, [edgeMenu, setEdges, scheduleSave])

  const onPaneContextMenu = useCallback((event: React.MouseEvent | MouseEvent) => {
    event.preventDefault()
    setContextMenu({ x: event.clientX, y: event.clientY })
  }, [])

  const closeContextMenu = useCallback(() => {
    setContextMenu(undefined)
    setQuickAdd(undefined)
  }, [])

  const contextAction = useCallback((action: () => void) => {
    closeContextMenu()
    action()
  }, [closeContextMenu])

  const selectedRects = useCallback(() => nodesRef.current
    .filter(node => node.selected === true && node.type !== 'group')
    .map(node => {
      const m = nodeMetrics(node)
      return { node, left: node.position.x, top: node.position.y, right: node.position.x + m.width, bottom: node.position.y + m.height, width: m.width, height: m.height, cx: node.position.x + m.width / 2, cy: node.position.y + m.height / 2 }
    }), [])

  const applyAlign = useCallback((kind: 'left' | 'centerX' | 'right' | 'top' | 'centerY' | 'bottom' | 'distX' | 'distY') => {
    const rects = selectedRects()
    if (rects.length < 2) return
    pushHistory()
    const bounds = {
      left: Math.min(...rects.map(rect => rect.left)),
      right: Math.max(...rects.map(rect => rect.right)),
      top: Math.min(...rects.map(rect => rect.top)),
      bottom: Math.max(...rects.map(rect => rect.bottom)),
      cx: (Math.min(...rects.map(rect => rect.left)) + Math.max(...rects.map(rect => rect.right))) / 2,
      cy: (Math.min(...rects.map(rect => rect.top)) + Math.max(...rects.map(rect => rect.bottom))) / 2,
    }
    const horizontal = kind === 'left' || kind === 'centerX' || kind === 'right' || kind === 'distX'
    if (kind === 'left' || kind === 'centerX' || kind === 'right') {
      const targetX = kind === 'left' ? bounds.left : kind === 'right' ? bounds.right - 0 : bounds.cx
      setNodes(current => current.map(candidate => {
        if (candidate.selected !== true || candidate.type === 'group') return candidate
        const rect = rects.find(item => item.node.id === candidate.id)
        if (rect === undefined) return candidate
        const offset = kind === 'left' ? 0 : kind === 'right' ? rect.width : rect.width / 2
        return { ...candidate, position: { x: targetX - offset, y: candidate.position.y } }
      }))
    }
    if (kind === 'top' || kind === 'centerY' || kind === 'bottom') {
      const targetY = kind === 'top' ? bounds.top : kind === 'bottom' ? bounds.bottom : bounds.cy
      setNodes(current => current.map(candidate => {
        if (candidate.selected !== true || candidate.type === 'group') return candidate
        const rect = rects.find(item => item.node.id === candidate.id)
        if (rect === undefined) return candidate
        const offset = kind === 'top' ? 0 : kind === 'bottom' ? rect.height : rect.height / 2
        return { ...candidate, position: { x: candidate.position.x, y: targetY - offset } }
      }))
    }
    if (kind === 'distX') {
      const sorted = [...rects].sort((a, b) => a.left - b.left)
      const span = bounds.right - bounds.left - sorted.reduce((sum, rect) => sum + rect.width, 0)
      const step = span / (sorted.length - 1)
      let cursorX = bounds.left
      setNodes(current => current.map(candidate => {
        const rect = sorted.find(item => item.node.id === candidate.id)
        if (rect === undefined) return candidate
        const next = { ...candidate, position: { x: cursorX, y: candidate.position.y } }
        cursorX += rect.width + step
        return next
      }))
    }
    if (kind === 'distY') {
      const sorted = [...rects].sort((a, b) => a.top - b.top)
      const span = bounds.bottom - bounds.top - sorted.reduce((sum, rect) => sum + rect.height, 0)
      const step = span / (sorted.length - 1)
      let cursorY = bounds.top
      setNodes(current => current.map(candidate => {
        const rect = sorted.find(item => item.node.id === candidate.id)
        if (rect === undefined) return candidate
        const next = { ...candidate, position: { x: candidate.position.x, y: cursorY } }
        cursorY += rect.height + step
        return next
      }))
    }
    void horizontal
    saveRef.current()
  }, [selectedRects, setNodes, pushHistory])

  const batchDelete = useCallback(() => {
    pushHistory()
    const removing = new Set(nodesRef.current.filter(node => node.selected === true).map(node => node.id))
    setNodes(current => current.filter(node => node.selected !== true))
    setEdges(current => current.filter(edge => !removing.has(edge.source) && !removing.has(edge.target)))
    setSelectedCount(0)
    scheduleSave()
  }, [setNodes, setEdges, scheduleSave])

  const batchGroup = useCallback(() => {
    pushHistory()
    const groupId = newLocalId('group')
    setNodes(current => {
      const selected = current.filter(node => node.selected === true && node.type !== 'group')
      if (selected.length < 2) return current
      const top = selected.filter(node => node.parentId === undefined || node.parentId === '')
      const origin = top[0]?.position ?? { x: 160, y: 160 }
      const groupNode: CanvasFlowNode = {
        id: groupId, type: 'group', position: { x: origin.x - 60, y: origin.y - 60 },
        style: { width: 520, height: 380 },
        data: { label: '分组', onRename: renameNode },
      }
      const members = selected.map(node => ({
        ...node,
        selected: false,
        parentId: groupId,
        extent: 'parent' as const,
        position: { x: node.position.x - (origin.x - 60), y: node.position.y - (origin.y - 60) },
      }))
      return [...current.filter(node => node.selected !== true), groupNode, ...members]
    })
    setSelectedCount(0)
    scheduleSave()
  }, [setNodes, scheduleSave, renameNode])

  const importMedia = useCallback(() => {
    uploadInputRef.current?.click()
  }, [])

  const uploadFilesAt = useCallback(async (files: File[], flowPos?: { x: number; y: number }) => {
    if (files.length === 0) return
    setUploading(true)
    const added: Array<{ name: string; path: string; mediaType: string }> = []
    let firstError: string | undefined
    for (const file of files.slice(0, 12)) {
      try {
        const response = await fetch('/directorx/media', {
          method: 'POST',
          headers: {
            'content-type': file.type !== '' ? file.type : 'application/octet-stream',
            'x-directorx-name': encodeURIComponent(file.name),
          },
          body: file,
        })
        if (!response.ok) {
          const text = await response.text().catch(() => '')
          throw new Error(`HTTP ${response.status} ${text.slice(0, 120)}`)
        }
        const record = await response.json() as { path: string }
        const mediaType = file.type !== '' ? file.type : (file.name.endsWith('.mp4') || file.name.endsWith('.mov') || file.name.endsWith('.webm') ? 'video/mp4' : 'image/png')
        added.push({ name: file.name, path: record.path, mediaType })
      } catch (cause) {
        firstError = cause instanceof Error ? cause.message : String(cause)
      }
    }
    if (added.length > 0) {
      pushHistory()
      const offset = flowPos ?? centerFlowPos()
      setNodes(current => [...current, ...added.map((item, index) => {
        const kind: 'image' | 'video' = item.mediaType.startsWith('video/') ? 'video' : 'image'
        return {
          id: newLocalId(kind), type: 'media' as const,
          position: { x: offset.x + index * 40, y: offset.y + index * 40 },
          data: { kind, label: item.name, path: item.path, ...nodeCallbacks },
        }
      })])
      saveRef.current()
    }
    if (firstError !== undefined) setError(firstError)
    setUploading(false)
  }, [setNodes, nodeCallbacks, centerFlowPos, pushHistory])

  const onUploadFiles = useCallback(async (files: FileList | null) => {
    if (files === null || files.length === 0) return
    await uploadFilesAt(Array.from(files))
  }, [uploadFilesAt])

  const exportPng = useCallback(async () => {
    const ns = nodesRef.current
    const es = edgesRef.current
    if (ns.length === 0) { setError('画布为空，先添加节点再导出。'); return }
    const width = (node: CanvasFlowNode) => typeof node.style?.width === 'number' ? node.style.width : node.type === 'group' ? 520 : 200
    const height = (node: CanvasFlowNode) => typeof node.style?.height === 'number' ? node.style.height : node.type === 'group' ? 380 : 126
    const minX = Math.min(...ns.map(node => node.position.x)) - 60
    const minY = Math.min(...ns.map(node => node.position.y)) - 60
    const maxX = Math.max(...ns.map(node => node.position.x + width(node))) + 60
    const maxY = Math.max(...ns.map(node => node.position.y + height(node))) + 60
    const w = maxX - minX
    const h = maxY - minY
    const paths = es.map(edge => {
      const source = ns.find(node => node.id === edge.source)
      const target = ns.find(node => node.id === edge.target)
      if (source === undefined || target === undefined) return ''
      const [d] = getBezierPath({
        sourceX: source.position.x + width(source), sourceY: source.position.y + height(source) / 2,
        sourcePosition: Position.Right,
        targetX: target.position.x, targetY: target.position.y + height(target) / 2,
        targetPosition: Position.Left,
      })
      return `<path d="${d}" fill="none" stroke="rgba(255,255,255,.4)" stroke-width="1.4"/>`
    }).join('')
    const nodeSvg = ns.map(node => {
      const x = node.position.x
      const y = node.position.y
      const wNode = width(node)
      const hNode = height(node)
      const label = String(node.data.label ?? '').replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char] as string)
      if (node.type === 'group') {
        return `<rect x="${x}" y="${y}" width="${wNode}" height="${hNode}" rx="16" fill="rgba(255,255,255,.03)" stroke="rgba(255,255,255,.18)"/><text x="${x + 14}" y="${y + 22}" font-size="12" fill="#f5f5f5">${label}</text>`
      }
      if (node.type === 'media') {
        const kind = (node.data as MediaNodeData).kind
        const path = (node.data as MediaNodeData).path
        const body = kind === 'image' && path !== ''
          ? `<image href="${mediaUrl(path)}" x="${x + 1}" y="${y + 1}" width="${wNode - 2}" height="${hNode - 34}" preserveAspectRatio="xMidYMid slice"/>`
          : `<rect x="${x + 1}" y="${y + 1}" width="${wNode - 2}" height="${hNode - 34}" fill="#141414"/>`
        return `<rect x="${x}" y="${y}" width="${wNode}" height="${hNode}" rx="16" fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.14)"/>${body}<text x="${x + 10}" y="${y + hNode - 12}" font-size="11" fill="#f5f5f5">${label}</text>`
      }
      return `<rect x="${x}" y="${y}" width="${wNode}" height="42" rx="16" fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.14)"/><text x="${x + 12}" y="${y + 26}" font-size="12.5" fill="#f5f5f5">${label}</text>`
    }).join('')
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(w)}" height="${Math.round(h)}" viewBox="${minX} ${minY} ${w} ${h}"><rect x="${minX}" y="${minY}" width="${w}" height="${h}" fill="#000"/>${paths}${nodeSvg}</svg>`
    const blobUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }))
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(w)
      canvas.height = Math.round(h)
      const context = canvas.getContext('2d')
      if (context === null) return
      context.drawImage(image, 0, 0)
      URL.revokeObjectURL(blobUrl)
      canvas.toBlob(blob => {
        if (blob === null) return
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = `directorx-canvas-${Date.now()}.png`
        anchor.click()
        URL.revokeObjectURL(url)
      }, 'image/png')
    }
    image.src = blobUrl
  }, [])

  const deleteSelectedEdgeById = useCallback((id: string) => {
    pushHistory()
    setEdges(current => current.filter(edge => edge.id !== id))
    setSelectedEdge(undefined)
    scheduleSave()
  }, [setEdges, scheduleSave, pushHistory])

  const openCompare = useCallback(() => {
    const group = nodesRef.current.find(candidate => {
      if (candidate.type !== 'group') return false
      const members = nodesRef.current.filter(node => node.parentId === candidate.id && node.type === 'media')
      return members.length >= 2
    })
    setCompareGroup(group)
    setComparePick(undefined)
  }, [])

  const confirmComparePick = useCallback(() => {
    if (comparePick === undefined) return
    pushHistory()
    setNodes(current => current.map(node => node.id === comparePick
      ? { ...node, data: { ...node.data, label: `${String(node.data.label ?? '')} ★选定`.trim() } }
      : node))
    setCompareGroup(undefined)
    setComparePick(undefined)
    saveRef.current()
  }, [comparePick, setNodes, pushHistory])

  const batchBranch = useCallback(() => {
    const selectedIds = nodesRef.current.filter(node => node.selected === true).map(node => node.id)
    if (selectedIds.length < 2) return
    const selected = nodesRef.current.filter(node => selectedIds.includes(node.id))
    const cx = selected.reduce((sum, node) => sum + node.position.x, 0) / selected.length
    const cy = selected.reduce((sum, node) => sum + node.position.y, 0) / selected.length
    const targetId = newLocalId('text')
    setNodes(current => [...current, {
      id: targetId, type: 'text',
      position: { x: cx + 260, y: cy },
      data: { label: '共同下游', ...nodeCallbacks },
    }])
    setEdges(current => [...current, ...selectedIds.map(source => ({ id: newLocalId('edge'), source, target: targetId, type: 'bezier' }))])
    scheduleSave()
  }, [setNodes, setEdges, scheduleSave, nodeCallbacks])

  const deleteSelectedEdge = useCallback(() => {
    if (selectedEdge === undefined) return
    deleteSelectedEdgeById(selectedEdge)
  }, [selectedEdge, deleteSelectedEdgeById])

  const arrangeGrid = useCallback(() => {
    pushHistory()
    setNodes(current => {
      const topLevel = current.filter(node => node.parentId === undefined || node.parentId === '')
      const columns = Math.max(1, Math.ceil(Math.sqrt(topLevel.length)))
      const laid = topLevel.map((node, index) => {
        const isGroup = node.type === 'group'
        const width = nodeMetrics(node).width
        const height = nodeMetrics(node).height
        return {
          ...node,
          position: {
            x: (index % columns) * (width + 40),
            y: Math.floor(index / columns) * (height + 40),
          },
          style: { ...node.style, width, height: isGroup ? 380 : node.style?.height },
        }
      })
      const groupById = new Map(laid.map(node => [node.id, node]))
      // Group children follow their group's new origin.
      const children = current
        .filter(node => node.parentId !== undefined && node.parentId !== '' && groupById.has(node.parentId))
        .map(node => {
          const group = groupById.get(node.parentId as string)
          const index = current.filter(n => n.parentId === node.parentId).indexOf(node)
          const columnsIn = Math.max(1, Math.floor((nodeMetrics(group as CanvasFlowNode).width - 46) / 260))
          return {
            ...node,
            position: {
              x: 46 + (index % columnsIn) * (nodeMetrics(node).width + 20),
              y: 46 + Math.floor(index / columnsIn) * 150,
            },
          }
        })
      return [...laid, ...children]
    })
    scheduleSave()
  }, [setNodes, scheduleSave])

  const runCommand = useCallback((id: string) => {
    setPaletteOpen(false)
    setPaletteQuery('')
    if (id === 'text') { addTextNode(); return }
    if (id === 'group') { addGroup(); return }
    if (id === 'library') { void openPicker(); return }
    if (id === 'import') { importMedia(); return }
    if (id === 'arrange') { arrangeGrid(); return }
    if (id === 'export') { void exportPng(); return }
    if (id === 'undo') { undo(); return }
    if (id === 'redo') { redo(); return }
    if (id === 'fit') { void fitView({ padding: 0.15, duration: 300 }); return }
    if (id === 'clearSel') {
      setNodes(current => current.map(node => node.selected === true ? { ...node, selected: false } : node))
      setSelectedCount(0)
      return
    }
  }, [addTextNode, addGroup, openPicker, importMedia, arrangeGrid, exportPng, undo, redo, fitView, setNodes])

  const fuzzyMatch = useCallback((query: string, label: string): boolean => {
    const q = query.toLowerCase().replace(/\s+/g, '')
    const target = label.toLowerCase()
    let qIndex = 0
    for (const char of target) {
      if (qIndex < q.length && char === q[qIndex]) qIndex += 1
    }
    return qIndex === q.length
  }, [])

  const COMMANDS: Array<{ id: string; label: string; hint: string }> = [
    { id: 'text', label: '添加文字', hint: '新建文字节点' },
    { id: 'group', label: '新建分组', hint: '分组容器节点' },
    { id: 'library', label: '打开媒体库', hint: '从输出目录选择素材' },
    { id: 'import', label: '导入本地媒体…', hint: '上传本地图片/视频/音频' },
    { id: 'arrange', label: '网格整理', hint: '自动排布全部节点' },
    { id: 'fit', label: '适应视图', hint: '缩放至全部内容' },
    { id: 'clearSel', label: '清空选择', hint: '取消所有选中' },
    { id: 'undo', label: '撤销', hint: '⌘Z' },
    { id: 'redo', label: '重做', hint: '⇧⌘Z' },
    { id: 'export', label: '导出 PNG 分镜板', hint: '下载画布快照' },
  ]

  const defaultEdgeOptions = useMemo(() => ({
    type: 'default' as const,
    style: { stroke: 'rgba(148,163,184,.65)', strokeWidth: 1.5 },
  }), [])

  // 视口恢复：首次加载读取上次保存的视口（报告 11.2）。
  useEffect(() => {
    try {
      const raw = localStorage.getItem('directorx-viewport')
      if (raw !== null) {
        const parsed = JSON.parse(raw) as { x?: number; y?: number; zoom?: number }
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number' && typeof parsed.zoom === 'number') {
          setViewport({ x: parsed.x, y: parsed.y, zoom: parsed.zoom })
        }
      }
    } catch {
      // corrupted storage — fall back to fitView.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // DEBUG probe: expose edge/nodes counts for browser verification.
  useEffect(() => {
    // 窄容器（画布列过窄）时隐藏小地图与控件，避免挤压主区域。
    const measure = () => {
      if (flowRootRef.current !== null) setFlowWidth(flowRootRef.current.clientWidth)
    }
    measure()
    const observer = new ResizeObserver(measure)
    if (flowRootRef.current !== null) observer.observe(flowRootRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const probe = document.getElementById('directorx-canvas-debug')
    if (probe !== null) {
      probe.dataset.edges = String(edges.length)
      probe.dataset.nodes = String(nodes.length)
    }
  }, [edges, nodes])

  return (
    <div ref={flowRootRef} style={{ position: 'relative', height: '100%', minHeight: 480 }}>
      <div id="directorx-canvas-debug" data-edges="0" data-nodes="0" style={{ display: 'none' }} />
      <style>{`
        .react-flow__controls { background: rgba(24,24,28,.9); box-shadow: 0 6px 18px rgba(0,0,0,.45); border: 1px solid rgba(255,255,255,.12); border-radius: 12px; overflow: hidden; }
        .react-flow__controls-button { width: 32px; height: 32px; background: transparent; border-bottom: 1px solid rgba(255,255,255,.07); fill: #e8e8e8; color: #e8e8e8; }
        .react-flow__controls-button:hover { background: rgba(255,255,255,.1); }
        .react-flow__controls-button:last-child { border-bottom: none; }
        .react-flow__minimap { border: 1px solid rgba(255,255,255,.14); border-radius: 8px; overflow: hidden; }
        .dx-tool-icon:hover { background: rgba(255,255,255,.08); }
        .dx-tool-icon:active { background: rgba(255,255,255,.14); }
        .dx-title-input { transition: border-color .15s ease, background .15s ease; }
        .dx-title-input:hover, .dx-title-input:focus { border-color: rgba(255,255,255,.25); background: rgba(24,24,28,.8); backdrop-filter: blur(10px); }
      `}</style>
      <ReactFlow
        nodes={nodes}
        edges={[]}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onEdgesDelete={onEdgesDelete}
        onPaneContextMenu={onPaneContextMenu}
        onPaneClick={event => {
          closeContextMenu()
          if (nodesRef.current.length === 0) setQuickAdd({ x: event.clientX, y: event.clientY })
        }}
        onNodeContextMenu={onNodeContextMenu}
        onSelectionContextMenu={(event) => {
          event.preventDefault()
          const selected = nodesRef.current.filter(node => node.selected === true).length
          if (selected >= 2) setAlignMenu({ x: event.clientX, y: event.clientY })
        }}
        onDoubleClick={onPaneDoubleClick}
        onDragOver={onPaneDragOver}
        onDrop={onPaneDrop}
        onSelectionChange={onSelectionChange}
        onMoveEnd={(event, viewport) => {
          // 视口持久化（报告 11.2）：节流写入 localStorage。
          try {
            localStorage.setItem('directorx-viewport', JSON.stringify({ x: viewport.x, y: viewport.y, zoom: viewport.zoom }))
          } catch {
            // storage unavailable — non-fatal.
          }
        }}
        selectionOnDrag
        selectionMode={SelectionMode.Partial}
        multiSelectionKeyCode="Shift"
        panOnDrag={[2]}
        panActivationKeyCode="Space"
        selectionKeyCode="Shift"
        zoomOnScroll={false}
        panOnScroll
        zoomOnPinch
        zoomOnDoubleClick={false}
        snapToGrid
        snapGrid={[15, 15]}
        connectionRadius={30}
        defaultEdgeOptions={defaultEdgeOptions}
        style={{ background: '#000000' }}
        fitView
        fitViewOptions={{ minZoom: 0.7, maxZoom: 1.3 }}
        proOptions={{ hideAttribution: true }}
        colorMode="dark"
        minZoom={0.15}
        maxZoom={2}
        deleteKeyCode={['Backspace', 'Delete']}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="rgba(255,255,255,.09)" />
        <DirectorxEdges nodes={nodes} edges={edges} selectedId={selectedEdge} onSelect={setSelectedEdge} onContext={onEdgeContext} onReconnect={onEdgeReconnect} />
        {(guides.vertical.length > 0 || guides.horizontal.length > 0) ? (
          <svg className="directorx-guides" style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none', zIndex: 0 }}>
            {guides.vertical.map(x => <line key={`v${x}`} x1={x} y1={-5000} x2={x} y2={5000} stroke="rgba(245,245,245,.5)" strokeWidth={1} strokeDasharray="4 3" />)}
            {guides.horizontal.map(y => <line key={`h${y}`} x1={-5000} y1={y} x2={5000} y2={y} stroke="rgba(245,245,245,.5)" strokeWidth={1} strokeDasharray="4 3" />)}
          </svg>
        ) : null}
        {flowWidth >= 340 ? <Controls position="bottom-left" showInteractive={false} /> : null}
        {flowWidth >= 340 ? (
          <MiniMap
            pannable zoomable
            style={{ width: 132, height: 88, borderRadius: 8, background: '#0a0a0a' }}
            maskColor="rgba(0,0,0,.75)"
            nodeColor={node => node.type === 'group' ? '#454545' : node.type === 'media' ? '#6f6f6f' : '#5a5a5a'}
            nodeStrokeColor={node => node.type === 'group' ? '#5c5c5c' : '#777777'}
          />
        ) : null}
      </ReactFlow>
      <input
        value={title}
        placeholder="请输入标题"
        className="dx-title-input"
        style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 10, background: 'transparent', border: '1px solid transparent', borderRadius: 10, color: '#f5f5f5', fontSize: 15, fontWeight: 500, textAlign: 'center', padding: '7px 14px', maxWidth: 'min(300px, calc(100% - 24px))', width: 300, outline: 'none', letterSpacing: .3 }}
        onChange={event => { setTitle(event.target.value); titleRef.current = event.target.value; scheduleSave() }}
        onBlur={() => void saveNow()}
        title="画布标题（tapnow 式）"
      />
      <div style={toolbar}>
        <button style={pillBtn} onClick={() => void openPicker()} title="添加媒体（媒体库）">{ICONS.plus}</button>
        <button className="dx-tool-icon" style={iconBtn} onClick={() => void openPicker()} title="媒体库">{ICONS.media}</button>
        <button className="dx-tool-icon" style={iconBtn} onClick={addTextNode} title="添加文字（双击画布同效）">{ICONS.text}</button>
        <button className="dx-tool-icon" style={iconBtn} onClick={addGroup} title="新建分组">{ICONS.group}</button>
        <button className="dx-tool-icon" style={iconBtn} onClick={arrangeGrid} title="网格整理">{ICONS.arrange}</button>
        <button className="dx-tool-icon" style={iconBtn} onClick={openCompare} title="对比分支版本"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="6" width="8" height="12" rx="1.5"/><rect x="13" y="6" width="8" height="12" rx="1.5"/><path d="M7 10v4M17 10v4"/></svg></button>
        <button className="dx-tool-icon" style={iconBtn} onClick={() => void exportPng()} title="导出 PNG 分镜板">{ICONS.export}</button>
        <button className="dx-tool-icon" style={iconBtn} onClick={undo} title="撤销 (⌘Z)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 5 5v1"/></svg></button>
        <button className="dx-tool-icon" style={iconBtn} onClick={redo} title="重做 (⇧⌘Z)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 14l5-5-5-5"/><path d="M20 9H9a5 5 0 0 0-5 5v1"/></svg></button>
        <button className="dx-tool-icon" style={iconBtn} onClick={() => void load()} title="重载">{ICONS.reload}</button>
      </div>
      {selectedCount >= 2 || selectedEdge !== undefined ? (
        <div style={{ position: 'absolute', bottom: 64, left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', gap: 6, alignItems: 'center', padding: '6px 8px', borderRadius: 14, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(20,20,20,.92)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 22px rgba(0,0,0,.5)' }}>
          {selectedCount >= 2 ? <button style={toolBtn} onClick={event => setAlignMenu({ x: event.clientX, y: event.clientY })}>对齐…</button> : null}
          {selectedCount >= 2 ? <button style={toolBtn} onClick={batchGroup}>归入新分组</button> : null}
          {selectedCount >= 2 ? <button style={toolBtn} onClick={batchBranch}>创建共同下游</button> : null}
          {selectedCount >= 2 ? <button style={toolBtn} onClick={batchDelete}>批量删除</button> : null}
          {selectedEdge !== undefined ? <button style={toolBtn} onClick={deleteSelectedEdge}>删除连线</button> : null}
        </div>
      ) : null}
      <div style={{ position: 'absolute', bottom: 14, right: 14, zIndex: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          style={{ padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,.16)', background: 'rgba(24,24,28,.9)', color: '#f5f5f5', fontSize: 11, cursor: 'pointer', backdropFilter: 'blur(12px)' }}
          title="点击复位 100%"
          onClick={() => setViewport({ zoom: 1, x: 0, y: 0 })}
        >
          {Math.round(zoom * 100)}%
        </button>
      </div>
      <div style={{ position: 'absolute', bottom: 14, left: 12, zIndex: 10, display: 'flex', gap: 8, alignItems: 'center', pointerEvents: 'none' }}>
        <span style={saveChip}>{saveState}</span>
        {agentEditFlash ? (
          <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999, background: 'rgba(245,245,245,.14)', color: '#f5f5f5' }}>
            AI 正在编辑画布…
          </span>
        ) : null}
        {conflict !== undefined ? (
          <span style={{ display: 'flex', gap: 6, alignItems: 'center', pointerEvents: 'auto' }}>
            <button style={toolBtn} onClick={conflictKeepMine}>保留我的</button>
            <button style={toolBtn} onClick={conflictLoadFresh}>载入最新</button>
          </span>
        ) : null}
        {error !== undefined ? <span style={{ ...saveChip, color: '#e88f8f' }}>{error}</span> : null}
        <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,.4)' }}>⌘K 命令 · ⌘+/- 缩放 · Esc 清除</span>
      </div>
      {connectMenu !== undefined ? (
        <div style={{ position: 'fixed', left: connectMenu.x, top: connectMenu.y, zIndex: 8, minWidth: 148, border: '1px solid rgba(255,255,255,.18)', borderRadius: 12, background: 'rgba(18,18,18,.97)', boxShadow: '0 12px 32px rgba(0,0,0,.6)', padding: 6 }}>
          <div style={{ fontSize: 11, color: '#919191', padding: '4px 10px' }}>拖线到空白：新建并连线</div>
          <button style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', borderRadius: 8, border: 'none', background: 'transparent', color: '#f5f5f5', fontSize: 12.5, cursor: 'pointer' }} onClick={connectAddText}>文字节点</button>
          <button style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', borderRadius: 8, border: 'none', background: 'transparent', color: '#f5f5f5', fontSize: 12.5, cursor: 'pointer' }} onClick={connectAddGroup}>分组</button>
          <button style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', borderRadius: 8, border: 'none', background: 'transparent', color: '#f5f5f5', fontSize: 12.5, cursor: 'pointer' }} onClick={() => { setConnectMenu(undefined); void openPicker() }}>媒体库…</button>
        </div>
      ) : null}
      {paletteOpen ? (
        <div
          style={{ position: 'fixed', left: '50%', top: '18%', transform: 'translateX(-50%)', zIndex: 9, width: 360, border: '1px solid rgba(255,255,255,.18)', borderRadius: 14, background: 'rgba(20,20,20,.97)', boxShadow: '0 18px 48px rgba(0,0,0,.65)', padding: 8 }}
          onClick={event => event.stopPropagation()}
        >
          <input
            ref={paletteInputRef}
            autoFocus
            value={paletteQuery}
            placeholder="输入命令…（⌘K 打开）"
            style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 9, border: '1px solid rgba(255,255,255,.16)', background: 'rgba(255,255,255,.05)', color: '#f5f5f5', fontSize: 13, marginBottom: 6 }}
            onChange={event => { setPaletteQuery(event.target.value); setPaletteIndex(0) }}
            onKeyDown={event => {
              const matches = COMMANDS.filter(cmd => paletteQuery.trim() === '' || fuzzyMatch(paletteQuery, cmd.label))
              if (event.key === 'ArrowDown' && matches.length > 0) {
                event.preventDefault()
                setPaletteIndex(index => (index + 1) % matches.length)
              } else if (event.key === 'ArrowUp' && matches.length > 0) {
                event.preventDefault()
                setPaletteIndex(index => (index - 1 + matches.length) % matches.length)
              } else if (event.key === 'Enter') {
                const match = matches[paletteIndex] ?? matches[0]
                if (match !== undefined) runCommand(match.id)
              } else if (event.key === 'Escape') {
                setPaletteOpen(false)
              }
            }}
          />
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            {COMMANDS.filter(cmd => paletteQuery.trim() === '' || fuzzyMatch(paletteQuery, cmd.label)).map((cmd, index) => (
              <button
                key={cmd.id}
                style={{ display: 'flex', justifyContent: 'space-between', width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 8, border: 'none', background: index === paletteIndex ? 'rgba(255,255,255,.12)' : 'transparent', color: '#f5f5f5', fontSize: 12.5, cursor: 'pointer' }}
                onMouseEnter={() => setPaletteIndex(index)}
                onClick={() => runCommand(cmd.id)}
              >
                <span>{cmd.label}</span>
                <span style={{ color: '#777', fontSize: 11 }}>{cmd.hint}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {nodes.length === 0 ? (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, pointerEvents: 'none', zIndex: 2 }}>
          <div style={{ fontSize: 15, color: '#f5f5f5', fontWeight: 600 }}>开始搭你的分镜板</div>
          <div style={{ fontSize: 12, color: '#919191', textAlign: 'center', lineHeight: 1.7, maxWidth: 340 }}>
            从工具栏或右键添加素材节点；也可以直接让 DSH 用画布工具写分镜——<br />它会在这里同步生产视图。
          </div>
          <div style={{ display: 'flex', gap: 8, pointerEvents: 'auto' }}>
            {[
              { label: '添加文字', run: addTextNode },
              { label: '打开媒体库', run: () => void openPicker() },
              { label: '新建分组', run: addGroup },
              { label: '导入本地媒体', run: importMedia },
            ].map(item => (
              <button key={item.label} style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,.18)', background: 'rgba(255,255,255,.06)', color: '#f5f5f5', fontSize: 12.5, cursor: 'pointer' }} onClick={item.run}>{item.label}</button>
            ))}
          </div>
        </div>
      ) : null}
      {compareGroup !== undefined ? (
        <div
          style={{ position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', zIndex: 9, width: 'min(720px, 90vw)', maxHeight: '72vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,.18)', borderRadius: 14, background: 'rgba(20,20,20,.97)', boxShadow: '0 18px 48px rgba(0,0,0,.65)', padding: 14 }}
          onClick={event => event.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <strong style={{ fontSize: 13 }}>{String(compareGroup.data.label ?? '分支对比')}</strong>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(245,245,245,.5)', background: 'rgba(245,245,245,.12)', color: '#f5f5f5', fontSize: 12, cursor: 'pointer', opacity: comparePick === undefined ? .5 : 1 }} onClick={confirmComparePick}>设为选定</button>
              <button style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,.25)', background: 'transparent', color: '#f5f5f5', fontSize: 12, cursor: 'pointer' }} onClick={() => setCompareGroup(undefined)}>关闭</button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {nodes.filter(node => node.parentId === compareGroup.id && node.type === 'media').map(node => {
              const data = node.data as unknown as MediaNodeData
              return (
                <button
                  key={node.id}
                  style={{ background: 'rgba(255,255,255,.04)', border: node.id === comparePick ? '2px solid rgba(245,245,245,.9)' : '1px solid rgba(255,255,255,.14)', borderRadius: 12, padding: 6, cursor: 'pointer', textAlign: 'left' }}
                  onClick={() => setComparePick(node.id)}
                >
                  {data.kind === 'image'
                    ? <img src={mediaUrl(data.path)} alt={data.label} style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 8 }} />
                    : <video src={mediaUrl(data.path)} muted preload="metadata" style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 8 }} />}
                  <div style={{ fontSize: 11, color: '#d8d8d8', padding: '6px 2px 2px', wordBreak: 'break-all' }}>{data.label}</div>
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
      {quickAdd !== undefined ? (
        <div
          style={{ position: 'fixed', left: quickAdd.x, top: quickAdd.y, zIndex: 8, display: 'flex', gap: 4, padding: 6, border: '1px solid rgba(255,255,255,.18)', borderRadius: 14, background: 'rgba(20,20,20,.97)', boxShadow: '0 12px 32px rgba(0,0,0,.6)' }}
          onClick={event => event.stopPropagation()}
        >
          {[
            { label: '文字', run: quickAddText },
            { label: '图片素材', run: () => quickAddMedia('image') },
            { label: '视频素材', run: () => quickAddMedia('video') },
            { label: '分组', run: quickAddGroup },
          ].map(item => (
            <button
              key={item.label}
              style={{ padding: '6px 12px', borderRadius: 9, border: 'none', background: 'rgba(255,255,255,.06)', color: '#f5f5f5', fontSize: 12.5, cursor: 'pointer' }}
              onClick={item.run}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
      {nodeMenu !== undefined ? (
        <div style={{ position: 'fixed', left: nodeMenu.x, top: nodeMenu.y, zIndex: 8, minWidth: 148, border: '1px solid rgba(255,255,255,.18)', borderRadius: 12, background: 'rgba(18,18,18,.97)', boxShadow: '0 12px 32px rgba(0,0,0,.6)', padding: 6 }}>
          {(() => {
            const target = nodesRef.current.find(node => node.id === nodeMenu.nodeId)
            const isMedia = target?.type === 'media'
            const items: Array<{ label: string; run: () => void }> = []
            if (target !== undefined) {
              items.push({ label: '编辑', run: () => { if (isMedia) openEditor((target.data as MediaNodeData).kind, (target.data as MediaNodeData).path) } })
              items.push({ label: '复制', run: () => duplicateNode(target.id) })
              items.push({ label: '删除', run: () => deleteNode(target.id) })
            }
            return items.map(item => (
              <button
                key={item.label}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', borderRadius: 8, border: 'none', background: 'transparent', color: '#f5f5f5', fontSize: 12.5, cursor: 'pointer' }}
                onClick={() => { setNodeMenu(undefined); item.run() }}
              >
                {item.label}
              </button>
            ))
          })()}
        </div>
      ) : null}
      {edgeMenu !== undefined ? (
        <div style={{ position: 'fixed', left: edgeMenu.x, top: edgeMenu.y, zIndex: 8, minWidth: 200, border: '1px solid rgba(255,255,255,.18)', borderRadius: 12, background: 'rgba(20,20,20,.97)', boxShadow: '0 12px 32px rgba(0,0,0,.6)', padding: 8 }}
          onClick={event => event.stopPropagation()}
        >
          <div style={{ fontSize: 11, color: '#919191', marginBottom: 6 }}>连线操作</div>
          <input
            autoFocus
            value={edgeMenu.label}
            placeholder="标签（可留空）"
            style={{ width: '100%', boxSizing: 'border-box', padding: '6px 9px', borderRadius: 8, border: '1px solid rgba(255,255,255,.16)', background: 'rgba(255,255,255,.05)', color: '#f5f5f5', fontSize: 12, marginBottom: 8 }}
            onChange={event => setEdgeMenu({ ...edgeMenu, label: event.target.value })}
            onKeyDown={event => { if (event.key === 'Enter') saveEdgeLabel() }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,.25)', background: 'rgba(255,255,255,.08)', color: '#f5f5f5', fontSize: 12, cursor: 'pointer' }} onClick={saveEdgeLabel}>保存标签</button>
            <button style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(200,120,120,.5)', background: 'transparent', color: '#e88f8f', fontSize: 12, cursor: 'pointer' }} onClick={() => { deleteSelectedEdgeById(edgeMenu.edgeId); setEdgeMenu(undefined) }}>删除连线</button>
          </div>
        </div>
      ) : null}
      {alignMenu !== undefined ? (
        <div style={{ position: 'fixed', left: alignMenu.x, top: alignMenu.y, zIndex: 8, minWidth: 148, border: '1px solid rgba(255,255,255,.18)', borderRadius: 12, background: 'rgba(20,20,20,.97)', boxShadow: '0 12px 32px rgba(0,0,0,.6)', padding: 6 }}
          onClick={event => event.stopPropagation()}
        >
          {[
            { label: '左对齐', run: () => applyAlign('left') },
            { label: '水平居中', run: () => applyAlign('centerX') },
            { label: '右对齐', run: () => applyAlign('right') },
            { label: '顶对齐', run: () => applyAlign('top') },
            { label: '垂直居中', run: () => applyAlign('centerY') },
            { label: '底对齐', run: () => applyAlign('bottom') },
            { label: '水平分布', run: () => applyAlign('distX') },
            { label: '垂直分布', run: () => applyAlign('distY') },
            { label: '批量删除', run: batchDelete },
          ].map(item => (
            <button key={item.label} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', borderRadius: 8, border: 'none', background: 'transparent', color: '#f5f5f5', fontSize: 12.5, cursor: 'pointer' }}
              onClick={() => { setAlignMenu(undefined); item.run() }}>
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
      {contextMenu !== undefined ? (
        <div
          style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, zIndex: 8, minWidth: 148, border: '1px solid rgba(255,255,255,.18)', borderRadius: 12, background: 'rgba(20,20,20,.97)', boxShadow: '0 12px 32px rgba(0,0,0,.6)', padding: 6 }}
        >
          {[
            { label: '添加媒体', action: () => void openPicker() },
            { label: '导入本地媒体…', action: importMedia },
            { label: '添加文字', action: addTextNode },
            { label: '新建分组', action: addGroup },
            { label: '网格整理', action: arrangeGrid },
          ].map(item => (
            <button
              key={item.label}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', borderRadius: 8, border: 'none', background: 'transparent', color: '#f5f5f5', fontSize: 12.5, cursor: 'pointer' }}
              onClick={() => contextAction(item.action)}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*,video/*,audio/*"
        multiple
        style={{ display: 'none' }}
        onChange={event => void onUploadFiles(event.target.files)}
      />
      {pickerOpen ? (
        <div style={{ ...picker, width: 340 }}>
          <input
            autoFocus
            value={mediaQuery}
            placeholder="搜索媒体…"
            style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,.16)', background: 'rgba(255,255,255,.05)', color: '#f5f5f5', fontSize: 12.5, marginBottom: 10 }}
            onChange={event => setMediaQuery(event.target.value)}
          />
          {mediaSections.map(section => (
            <div key={section.name} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11.5, color: '#919191', marginBottom: 6 }}>{section.name} · {section.files.length}</div>
              <div style={pickerGrid}>
                {section.files.slice(0, 60).map(file => (
                  <button key={file.path} style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'grab' }} draggable onDragStart={event => { event.dataTransfer.setData('text/plain', file.path); event.dataTransfer.effectAllowed = 'copy' }} onClick={() => {
                if (connectSourceRef.current !== undefined) {
                  connectCreate(() => {
                    const id = newLocalId('media')
                    addMedia(file, id)
                    return id
                  })
                } else {
                  addMedia(file)
                }
              }} title={`${file.name}（点击添加 / 拖到画布）`}>
                    {file.mediaType.startsWith('image/')
                      ? <img src={mediaUrl(file.path)} alt={file.name} style={pickerThumb} />
                      : <div style={{ ...pickerThumb, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#141414', color: '#919191', fontSize: 11 }}>{file.mediaType.startsWith('video/') ? '视频' : '音频'}</div>}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {mediaSections.length === 0 ? <div style={{ fontSize: 12, color: '#919191' }}>{mediaQuery !== '' ? '没有匹配的媒体。' : '输出目录还没有媒体文件。'}</div> : null}
        </div>
      ) : null}
    </div>
  )
}

/** Provider must be an ancestor of the hook callers, so it wraps the inner component. */
export function CanvasTab(): ReactNode {
  return (
    <ReactFlowProvider>
      <CanvasTabInner />
    </ReactFlowProvider>
  )
}
