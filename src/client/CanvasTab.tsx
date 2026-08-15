import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import {
  ReactFlow, Background, BackgroundVariant, Controls, MiniMap,
  addEdge, applyEdgeChanges, applyNodeChanges,
  Handle, Position, NodeResizer, getBezierPath, ReactFlowProvider, useReactFlow,
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
}
type MediaNodeData = { kind: 'image' | 'video'; label: string; path: string } & NodeCallbacks
type TextNodeData = { label: string } & NodeCallbacks
type GroupNodeData = { label: string } & NodeCallbacks

type CanvasFlowNode = Node<MediaNodeData | TextNodeData | GroupNodeData>

interface MediaListFile { path: string; name: string; mediaType: string; size: number }

const flowStyles = {
  mediaCard: {
    borderRadius: 16, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.04)',
    boxShadow: '0 6px 18px rgba(0,0,0,.5)', overflow: 'hidden', minWidth: 128, cursor: 'pointer',
  } as CSSProperties,
  selectedCard: { border: '1px solid rgba(245,245,245,.95)', boxShadow: '0 0 0 1px rgba(245,245,245,.35), 0 10px 28px rgba(0,0,0,.6)' } as CSSProperties,
  thumb: { width: 100 + '%', height: 96, objectFit: 'cover' as const, display: 'block', pointerEvents: 'none' as const },
  label: { fontSize: 11.5, padding: '7px 10px', color: '#f7f7f7', wordBreak: 'break-word' as const, lineHeight: 1.4, borderTop: '1px solid rgba(255,255,255,.1)' },
  textCard: {
    borderRadius: 16, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.04)',
    padding: '10px 12px', fontSize: 12.5, minWidth: 120, maxWidth: 220, cursor: 'pointer', color: '#f7f7f7',
  } as CSSProperties,
  handle: { width: 8, height: 8, background: '#5a5a5a', border: '2px solid #1d1d1d' } as CSSProperties,
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
    <div style={{ position: 'absolute', top: 6, left: 6, display: 'flex', gap: 4, zIndex: 3 }}>
      {actions.map(action => (
        <button
          key={action.label}
          title={action.hint}
          style={{
            padding: '3px 8px', borderRadius: 7, border: '1px solid rgba(255,255,255,.25)',
            background: 'rgba(0,0,0,.6)', color: '#f5f5f5', fontSize: 10.5, cursor: 'pointer',
          }}
          onClick={event => { event.stopPropagation(); action.run() }}
        >
          {action.label}
        </button>
      ))}
    </div>
  )
}

function MediaNodeComponent(props: NodeProps): ReactNode {
  const data = props.data as unknown as MediaNodeData
  const selected = props.selected === true
  const [playing, setPlaying] = useState(false)
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{ ...flowStyles.mediaCard, ...(selected ? flowStyles.selectedCard : {}), position: 'relative' }}
      onClick={() => openEditor(data.kind, data.path)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <NodeResizer isVisible={selected} minWidth={120} minHeight={80} color="rgba(245,245,245,.85)" />
      {hovered ? (
        <NodeActions actions={[
          { label: '编辑', hint: '打开右侧编辑器', run: () => openEditor(data.kind, data.path) },
          { label: '复制', hint: '复制节点', run: () => data.onDuplicate?.(props.id) },
          { label: '删除', hint: '删除节点', run: () => data.onDelete?.(props.id) },
        ]} />
      ) : null}
      <Handle id="in" type="target" position={Position.Left} style={flowStyles.handle} />
      {data.kind === 'image'
        ? <img src={mediaUrl(data.path)} alt={data.label} style={flowStyles.thumb} draggable={false} />
        : <video
            ref={ref => { if (ref !== null) { playing ? void ref.play().catch(() => {}) : ref.pause() } }}
            src={mediaUrl(data.path)}
            muted={!playing}
            loop
            preload="metadata"
            style={flowStyles.thumb}
            draggable={false}
          />}
      {data.kind === 'video' ? (
        <button
          style={{
            position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12,
            border: '1px solid rgba(255,255,255,.35)', background: 'rgba(0,0,0,.55)',
            color: '#f5f5f5', fontSize: 11, cursor: 'pointer', lineHeight: 1,
          }}
          onClick={event => { event.stopPropagation(); setPlaying(value => !value) }}
        >
          {playing ? 'Ⅱ' : '▶'}
        </button>
      ) : null}
      <RenameLabel id={props.id} value={data.label !== '' ? data.label : baseName(data.path)} onRename={data.onRename} style={flowStyles.label} />
      <Handle id="out" type="source" position={Position.Right} style={flowStyles.handle} />
    </div>
  )
}

function TextNodeComponent(props: NodeProps): ReactNode {
  const data = props.data as unknown as TextNodeData
  const selected = props.selected === true
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{ ...flowStyles.textCard, ...(selected ? flowStyles.selectedCard : {}), position: 'relative' }}
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
      <Handle id="in" type="target" position={Position.Left} style={flowStyles.handle} />
      <RenameLabel id={props.id} value={data.label || '文本节点'} onRename={data.onRename} style={{ fontSize: 12.5, lineHeight: 1.5 }} />
      <Handle id="out" type="source" position={Position.Right} style={flowStyles.handle} />
    </div>
  )
}

const groupFrame: CSSProperties = {
  borderRadius: 16, border: '1px solid rgba(255,255,255,.18)', background: 'rgba(255,255,255,.03)',
  width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
}
const groupTitle: CSSProperties = {
  fontSize: 12, color: '#f5f5f5', opacity: .9, padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,.1)',
}

function GroupNodeComponent(props: NodeProps): ReactNode {
  const data = props.data as unknown as GroupNodeData
  const selected = props.selected === true
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{ ...groupFrame, ...(selected ? { border: '1px solid rgba(255,255,255,.85)' } : {}), position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <RenameLabel id={props.id} value={data.label || '分组'} onRename={data.onRename} style={groupTitle} />
      {hovered ? (
        <div style={{ position: 'absolute', top: 8, right: 10, display: 'flex', gap: 4 }}>
          <button style={{ padding: '3px 8px', borderRadius: 7, border: '1px solid rgba(255,255,255,.25)', background: 'rgba(0,0,0,.6)', color: '#f5f5f5', fontSize: 10.5, cursor: 'pointer' }} onClick={event => { event.stopPropagation(); data.onDelete?.(props.id) }}>删除</button>
        </div>
      ) : null}
    </div>
  )
}

const nodeTypes = { media: MediaNodeComponent, text: TextNodeComponent, group: GroupNodeComponent }

const toolbar: CSSProperties = {
  position: 'absolute', top: 10, left: 12, zIndex: 5, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap',
}
const toolBtn: CSSProperties = {
  padding: '6px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,.16)', background: 'rgba(255,255,255,.06)',
  color: '#f5f5f5', fontSize: 12.5, cursor: 'pointer',
}
const picker: CSSProperties = {
  position: 'absolute', top: 46, left: 12, zIndex: 6, width: 300, maxHeight: 320, overflowY: 'auto',
  border: '1px solid rgba(255,255,255,.16)', borderRadius: 12, background: '#1d1d1d', padding: 10,
  boxShadow: '0 10px 30px rgba(0,0,0,.55)',
}
const pickerGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }
const pickerThumb: CSSProperties = { width: '100%', height: 56, objectFit: 'cover', borderRadius: 6, border: '1px solid rgba(255,255,255,.14)', display: 'block' }
const saveChip: CSSProperties = { fontSize: 11, padding: '4px 8px', borderRadius: 6, background: 'rgba(255,255,255,.08)', color: '#9be29b' }

interface CanvasDocument { version: number; updatedAt: number; nodes: Array<{ id: string; kind: string; label: string; path?: string; parent?: string; x: number; y: number; width?: number; height?: number }>; edges: Array<{ id: string; from: string; to: string; label?: string }> }

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
        ? { kind: node.kind as 'image' | 'video', label: node.label, path: node.path ?? '', onRename, onDuplicate, onDelete }
        : { label: node.label, onRename, onDuplicate, onDelete },
    }
  })
}

function toFlowEdges(doc: CanvasDocument): Edge[] {
  return doc.edges.map(edge => ({
    id: edge.id, source: edge.from, target: edge.to,
    sourceHandle: 'out', targetHandle: 'in',
    label: edge.label, type: 'bezier',
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
function DirectorxEdges({ nodes, edges, selectedId, onSelect }: {
  nodes: CanvasFlowNode[]
  edges: Edge[]
  selectedId: string | undefined
  onSelect: (id: string | undefined) => void
}): ReactNode {
  const lookup = useMemo(() => new Map(nodes.map(node => [node.id, node])), [nodes])
  const paths = edges.map(edge => {
    const source = lookup.get(edge.source)
    const target = lookup.get(edge.target)
    if (source === undefined || target === undefined) return null
    const sm = nodeMetrics(source)
    const tm = nodeMetrics(target)
    const [path] = getBezierPath({
      sourceX: source.position.x + sm.width,
      sourceY: source.position.y + sm.height / 2,
      sourcePosition: Position.Right,
      targetX: target.position.x,
      targetY: target.position.y + tm.height / 2,
      targetPosition: Position.Left,
      curvature: 0.32,
    })
    const selected = edge.id === selectedId
    return (
      <g key={edge.id}>
        <path
          d={path} fill="none"
          stroke={selected ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.3)'}
          strokeWidth={selected ? 2.2 : 1.4}
          markerEnd="url(#dx-arrow)"
          pointerEvents="stroke"
          style={{ cursor: 'pointer' }}
          onClick={event => { event.stopPropagation(); onSelect(selected ? undefined : edge.id) }}
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
  const [saveState, setSaveState] = useState<'已保存' | '保存中…' | '已同步' | '冲突已同步'>('已保存')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [mediaFiles, setMediaFiles] = useState<MediaListFile[]>([])
  const [mediaQuery, setMediaQuery] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)
  const [selectedEdge, setSelectedEdge] = useState<string | undefined>(undefined)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | undefined>(undefined)
  const [selectedCount, setSelectedCount] = useState(0)
  const cascadeRef = useRef(0)

  const renameNode = useCallback((id: string, label: string) => {
    setNodes(current => current.map(node => node.id === id
      ? { ...node, data: { ...node.data, label } }
      : node))
    saveRef.current()
  }, [setNodes])

  const duplicateNode = useCallback((id: string) => {
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

  const deleteNode = useCallback((id: string) => {
    setNodes(current => current.filter(node => node.id !== id))
    setEdges(current => current.filter(edge => edge.source !== id && edge.target !== id))
    saveRef.current()
  }, [setNodes, setEdges])

  const nodeCallbacks = useMemo<NodeCallbacks>(() => ({
    onRename: renameNode, onDuplicate: duplicateNode, onDelete: deleteNode,
  }), [renameNode, duplicateNode, deleteNode])

  const applyDoc = useCallback((doc: CanvasDocument) => {
    updatedAtRef.current = doc.updatedAt
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
        nodes: currentNodes.map(node => {
          const absolute = node.parentId !== undefined && node.parentId !== ''
            ? { x: node.position.x + (parentPos.get(node.parentId)?.x ?? 0), y: node.position.y + (parentPos.get(node.parentId)?.y ?? 0) }
            : { x: node.position.x, y: node.position.y }
          return {
            id: node.id,
            kind: node.type === 'media' ? (node.data as MediaNodeData).kind : node.type === 'group' ? 'group' : 'text',
            label: node.data.label,
            ...(node.type === 'media' ? { path: (node.data as MediaNodeData).path } : {}),
            ...(node.parentId !== undefined && node.parentId !== '' ? { parent: node.parentId } : {}),
            x: absolute.x, y: absolute.y,
            ...(typeof node.style?.width === 'number' ? { width: node.style.width } : {}),
            ...(typeof node.style?.height === 'number' ? { height: node.style.height } : {}),
          }
        }),
        edges: currentEdges.map(edge => ({ id: edge.id, from: edge.source, to: edge.target, label: typeof edge.label === 'string' ? edge.label : undefined })),
      }
      const response = await fetch(`/directorx/canvas?expectedUpdatedAt=${updatedAtRef.current}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(doc),
      })
      if (response.status === 409) {
        const fresh = await fetch('/directorx/canvas').then(r => r.json()) as CanvasDocument
        applyDoc(fresh)
        setSaveState('冲突已同步')
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

  const scheduleSave = useCallback(() => {
    dirtyRef.current = true
    setSaveState('保存中…')
    if (saveTimerRef.current !== undefined) window.clearTimeout(saveTimerRef.current)
    saveTimerRef.current = window.setTimeout(() => { void saveNow() }, 900)
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

  // Flush a pending debounced save when the tab unmounts, so closing the dock
  // never loses the last drag/edit.
  useEffect(() => () => {
    if (saveTimerRef.current !== undefined) window.clearTimeout(saveTimerRef.current)
    if (dirtyRef.current) void saveNow()
  }, [saveNow])

  const onNodesChange = useCallback((changes: NodeChange<CanvasFlowNode>[]) => {
    const removedIds = changes.filter(change => change.type === 'remove').map(change => change.id)
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

  const onNodeDragStop = useCallback((_event: unknown, node: CanvasFlowNode) => {
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

  const onConnect = useCallback((connection: Connection) => {
    setEdges(current => addEdge({ ...connection, id: newLocalId('edge') }, current))
    scheduleSave()
  }, [setEdges, scheduleSave])

  const addNodeAt = useCallback((node: CanvasFlowNode) => {
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

  const addMedia = useCallback((file: MediaListFile) => {
    const kind: 'image' | 'video' = file.mediaType.startsWith('video/') ? 'video' : 'image'
    addNodeAt({
      id: newLocalId(kind), type: 'media', position: { x: 120, y: 120 },
      data: { kind, label: file.name, path: file.path },
    })
    setPickerOpen(false)
  }, [addNodeAt])

  const addTextNode = useCallback(() => {
    addNodeAt({
      id: newLocalId('text'), type: 'text', position: { x: 140, y: 140 },
      data: { label: '文本节点' },
    })
  }, [addNodeAt])

  const addGroup = useCallback(() => {
    addNodeAt({
      id: newLocalId('group'), type: 'group', position: { x: 160, y: 160 },
      style: { width: 520, height: 380 },
      data: { label: '分组' },
    })
  }, [addNodeAt])

  const onSelectionChange = useCallback((params: { nodes: CanvasFlowNode[] }) => {
    setSelectedCount(params.nodes.length)
  }, [])

  const { screenToFlowPosition } = useReactFlow()

  const onPaneDoubleClick = useCallback((event: React.MouseEvent) => {
    const flowPos = screenToFlowPosition({ x: event.clientX, y: event.clientY })
    addNodeAt({
      id: newLocalId('text'), type: 'text', position: flowPos,
      data: { label: '文本节点' },
    })
  }, [screenToFlowPosition, addNodeAt])

  const onPaneContextMenu = useCallback((event: React.MouseEvent | MouseEvent) => {
    event.preventDefault()
    setContextMenu({ x: event.clientX, y: event.clientY })
  }, [])

  const closeContextMenu = useCallback(() => setContextMenu(undefined), [])

  const contextAction = useCallback((action: () => void) => {
    closeContextMenu()
    action()
  }, [closeContextMenu])

  const batchDelete = useCallback(() => {
    setNodes(current => current.filter(node => node.selected !== true))
    setSelectedCount(0)
    scheduleSave()
  }, [setNodes, scheduleSave])

  const batchGroup = useCallback(() => {
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

  const deleteSelectedEdge = useCallback(() => {
    if (selectedEdge === undefined) return
    setEdges(current => current.filter(edge => edge.id !== selectedEdge))
    setSelectedEdge(undefined)
    scheduleSave()
  }, [selectedEdge, setEdges, scheduleSave])

  const arrangeGrid = useCallback(() => {
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

  const defaultEdgeOptions = useMemo(() => ({
    type: 'default' as const,
    style: { stroke: 'rgba(128,160,255,.55)', strokeWidth: 1.5 },
  }), [])

  // DEBUG probe: expose edge/nodes counts for browser verification.
  useEffect(() => {
    const probe = document.getElementById('directorx-canvas-debug')
    if (probe !== null) {
      probe.dataset.edges = String(edges.length)
      probe.dataset.nodes = String(nodes.length)
    }
  }, [edges, nodes])

  return (
    <div style={{ position: 'relative', height: '100%', minHeight: 480 }}>
      <div id="directorx-canvas-debug" data-edges="0" data-nodes="0" style={{ display: 'none' }} />
      <ReactFlow
        nodes={nodes}
        edges={[]}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onEdgesDelete={onEdgesDelete}
        onPaneContextMenu={onPaneContextMenu}
        onPaneClick={closeContextMenu}
        onDoubleClick={onPaneDoubleClick}
        onSelectionChange={onSelectionChange}
        selectionOnDrag
        panOnDrag={false}
        panActivationKeyCode="Space"
        selectionKeyCode="Shift"
        defaultEdgeOptions={defaultEdgeOptions}
        style={{ background: '#000000' }}
        fitView
        proOptions={{ hideAttribution: true }}
        colorMode="dark"
        minZoom={0.1}
        maxZoom={2.5}
        deleteKeyCode={['Backspace', 'Delete']}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="rgba(255,255,255,.09)" />
        <DirectorxEdges nodes={nodes} edges={edges} selectedId={selectedEdge} onSelect={setSelectedEdge} />
        <Controls position="bottom-left" showInteractive={false} />
        <MiniMap pannable zoomable style={{ width: 132, height: 88, borderRadius: 8, background: '#0a0a0a' }} maskColor="rgba(0,0,0,.75)" nodeColor="#3f3f3f" nodeStrokeColor="#5c5c5c" />
      </ReactFlow>
      <div style={toolbar}>
        <button style={toolBtn} onClick={() => void openPicker()}>＋ 媒体</button>
        <button style={toolBtn} onClick={addTextNode}>＋ 文字</button>
        <button style={toolBtn} onClick={addGroup}>＋ 分组</button>
        {selectedCount >= 2 ? <button style={toolBtn} onClick={batchGroup}>归入新分组</button> : null}
        {selectedCount >= 2 ? <button style={toolBtn} onClick={batchDelete}>批量删除</button> : null}
        <button style={toolBtn} onClick={arrangeGrid}>网格整理</button>
        {selectedEdge !== undefined ? <button style={toolBtn} onClick={deleteSelectedEdge}>删除连线</button> : null}
        <button style={toolBtn} onClick={() => void load()}>重载</button>
        <span style={saveChip}>{saveState}</span>
        {error !== undefined ? <span style={{ ...saveChip, color: '#e88f8f' }}>{error}</span> : null}
      </div>
      {contextMenu !== undefined ? (
        <div
          style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, zIndex: 8, minWidth: 148, border: '1px solid rgba(255,255,255,.18)', borderRadius: 12, background: 'rgba(20,20,20,.97)', boxShadow: '0 12px 32px rgba(0,0,0,.6)', padding: 6 }}
        >
          {[
            { label: '添加媒体', action: () => void openPicker() },
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
                  <button key={file.path} style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }} onClick={() => addMedia(file)} title={file.path}>
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
