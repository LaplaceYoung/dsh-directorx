import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react'
import {
  Background, BackgroundVariant, ConnectionLineType, ConnectionMode, MiniMap, ReactFlow, ReactFlowProvider,
  SelectionMode, addEdge, applyEdgeChanges, applyNodeChanges, reconnectEdge, useReactFlow, useViewport,
  MarkerType,
  type Connection, type Edge, type EdgeChange, type NodeChange, type OnConnectStartParams,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { editorSnapshot, openEditor, setEditorTab, subscribeEditor } from '../editor.ts'
import { ImageStudio } from './ImageStudio.tsx'
import { VideoStudio } from './VideoStudio.tsx'
import { StudioErrorBoundary } from './studio-chrome.tsx'
import { flowAbsolutePosition, inferContinueKind } from '../../canvas-generate.ts'
import { INTER_HREF, dx } from '../canvas-theme.ts'
import {
  AddMenu, AssetDrawer, CompareOverlay, ConnectMenu, EdgeMenu, EmptyHero, GenerateDock, InspectorSheet,
  MultiSelectBar, NodeMenu, SearchPalette, ShortcutsSheet, StageRail, Toast, TopBar, ZoomHud, type AddKind,
} from './chrome.tsx'
import { cycleShotStatus, defaultSize, fromFlow, newId, toFlowEdges, toFlowNodes, type CanvasDoc, type ShotStatus, type StageNode } from './document.ts'
import { mediaUrl, stageNodeTypes } from './nodes.tsx'
import { SessionDock, type SessionClient } from './SessionDock.tsx'
import {
  createdSessionId, parseArchivedIds, parseSessionList, parseWorkspaceList, pickWorkspaceSession,
  type WorkspaceClient,
} from './session-fold.ts'
import { createLiveSession } from './session-live.ts'
import { boxPort, closestHandleId, WireDragLayer, WireEdge, WirePreview } from './WireEdge.tsx'
import { getClientProject, pickDefaultProject, projectHeaders, setClientProject, withProject, type ProjectInfo } from './project.ts'
import { alignBoxes, asClipPayload, distributeBoxes, nudgeBoxes, packClip, type AlignKind } from './layout.ts'
import { incomingRefIds, nearestAspect, sizeFromAspect, specPrompt, type GenerateSpec } from './workstation.ts'

export interface StageProps {
  sessionId?: string
  preferredProject?: string
  sessions?: SessionClient
  liveSessions?: unknown
  workspace?: WorkspaceClient
  onAskDsh?: (text: string, sessionId: string) => Promise<void>
  onClose?: () => void
}

const EDGE_MARK = { type: MarkerType.ArrowClosed, width: 18, height: 18, color: 'rgba(255,255,255,.7)' } as const
const EDGE_STYLE = { stroke: 'rgba(255,255,255,.62)', strokeWidth: 2 }

const shell: CSSProperties = {
  position: 'relative', width: '100%', height: '100%', minWidth: 0, minHeight: 0,
  display: 'flex', flexDirection: 'column', background: dx.field, color: dx.ink,
  fontFamily: dx.font, overflow: 'hidden',
}

const STAGE_CSS = `
.dx-stage, .dx-stage * { box-sizing: border-box; }
.dx-stage .react-flow__background { pointer-events: none !important; }
.dx-stage .react-flow__pane { cursor: grab; }
.dx-stage .react-flow__pane:active { cursor: grabbing; }
.dx-stage .react-flow__node { position: absolute !important; overflow: visible !important; }
.dx-stage .react-flow__handle {
  position: absolute !important;
  width: 28px !important; height: 28px !important; min-width: 28px; min-height: 28px;
  background: transparent !important; border: none !important; opacity: 1;
  pointer-events: all !important; z-index: 6;
}
.dx-stage .react-flow__handle.react-flow__handle-left {
  left: -14px !important; right: auto !important; top: 50% !important;
  transform: translate(0, -50%) !important;
}
.dx-stage .react-flow__handle.react-flow__handle-right {
  right: -14px !important; left: auto !important; top: 50% !important;
  transform: translate(0, -50%) !important;
}
.dx-stage .react-flow__handle.react-flow__handle-top {
  top: -14px !important; bottom: auto !important; left: 50% !important;
  transform: translate(-50%, 0) !important;
}
.dx-stage .react-flow__handle.react-flow__handle-bottom {
  bottom: -14px !important; top: auto !important; left: 50% !important;
  transform: translate(-50%, 0) !important;
}
.dx-port-dot {
  display: block; width: 10px; height: 10px; border-radius: 99px;
  background: #f3f3f3; border: 2px solid #111;
  opacity: 0; transition: opacity .15s ease, transform .15s ease;
}
.dx-port-plus {
  display: grid; place-items: center; width: 22px; height: 22px; border-radius: 99px;
  background: #f3f3f3; color: #141414; box-shadow: 0 4px 14px rgba(0,0,0,.35);
  opacity: 0; transition: opacity .15s ease, transform .15s ease;
}
.dx-stage .react-flow__node:hover .dx-port-dot,
.dx-stage .react-flow__node.selected .dx-port-dot,
.dx-stage .react-flow__handle-connecting .dx-port-dot,
.dx-stage .react-flow__handle-valid .dx-port-dot,
.dx-stage .react-flow__node:hover .dx-port-plus,
.dx-stage .react-flow__node.selected .dx-port-plus,
.dx-stage .react-flow__handle-connecting .dx-port-plus { opacity: 1; }
.dx-stage.dx-wiring .dx-port-dot,
.dx-stage.dx-wiring .dx-port-plus { opacity: 1; }
.dx-stage.dx-wiring .react-flow__node { cursor: crosshair; }
.dx-stage.dx-wiring .react-flow__node.dx-can-connect .dx-card-face,
.dx-stage.dx-wiring .react-flow__node:hover .dx-card-face {
  border-color: rgba(255,255,255,.88) !important;
  box-shadow: 0 0 0 2px rgba(255,255,255,.78), 0 0 28px rgba(255,255,255,.22) !important;
  animation: dx-connect-glow 1.05s ease-in-out infinite;
}
@keyframes dx-connect-glow {
  0%, 100% { box-shadow: 0 0 0 2px rgba(255,255,255,.72), 0 0 18px rgba(255,255,255,.16); }
  50% { box-shadow: 0 0 0 3px rgba(255,255,255,.95), 0 0 34px rgba(255,255,255,.32); }
}
.dx-stage .react-flow__connectionline,
.dx-stage svg.react-flow__connectionline {
  pointer-events: none !important;
  opacity: 0 !important;
  visibility: hidden !important;
}
.dx-stage .react-flow__renderer,
.dx-stage .react-flow__viewport,
.dx-stage .react-flow__edges,
.dx-stage .react-flow__edges svg {
  overflow: visible !important;
}
.dx-stage .react-flow__edges { z-index: 3 !important; }
.dx-stage .react-flow__nodes { z-index: 4; }
.dx-stage .react-flow__edge-path {
  stroke-linecap: round;
  stroke: transparent !important;
  fill: none !important;
}
.dx-stage .react-flow__edge.selected .react-flow__edge-path,
.dx-stage .react-flow__edge:focus .react-flow__edge-path {
  stroke: transparent !important;
}
.dx-stage .react-flow__connection-line { stroke: rgba(255,255,255,.8); stroke-width: 2px; }
.dx-stage .react-flow__selection { background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.28); }
.dx-stage .react-flow__minimap,
.dx-stage .react-flow__panel.react-flow__minimap {
  position: absolute !important;
  top: auto !important;
  left: 16px !important;
  right: auto !important;
  bottom: 64px !important;
  margin: 0 !important;
  z-index: 18 !important;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,.1);
  box-shadow: 0 10px 28px rgba(0,0,0,.4);
}
.dx-node-toolbar {
  display: flex; gap: 2px; padding: 4px;
  background: rgba(16,16,16,.78); border: 1px solid rgba(255,255,255,.12);
  border-radius: 12px; box-shadow: 0 12px 32px rgba(0,0,0,.45);
  backdrop-filter: blur(18px);
}
.dx-hit[data-tip]:not(.dx-session-fab) { position: relative; }
[data-tip]::after {
  content: attr(data-tip);
  position: absolute;
  z-index: 50;
  left: 50%;
  bottom: calc(100% + 8px);
  transform: translateX(-50%) translateY(4px);
  padding: 5px 8px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
  color: #f2f2f2;
  background: rgba(16,16,16,.94);
  border: 1px solid rgba(255,255,255,.12);
  opacity: 0;
  pointer-events: none;
  transition: opacity .14s ease, transform .14s ease;
}
[data-tip]:hover::after { opacity: 1; transform: translateX(-50%) translateY(0); }
[data-tip-side='right']::after {
  left: calc(100% + 10px);
  right: auto;
  bottom: auto;
  top: 50%;
  transform: translateY(-50%) translateX(-4px);
}
[data-tip-side='right']:hover::after { transform: translateY(-50%) translateX(0); }
.dx-hit { transition: background .14s ease, transform .14s ease; }
.dx-hit:hover { background: rgba(255,255,255,.08) !important; }
.dx-hit:active { transform: scale(.97); }
.dx-menu-item:hover { background: rgba(255,255,255,.08) !important; }
.dx-cta { transition: transform .14s ease, opacity .14s ease; }
.dx-cta:hover { transform: translateY(-1px); }
.dx-cta:active { transform: scale(.98); }
.dx-rail-btn { position: relative; z-index: 2; }
.dx-title:focus { border-color: rgba(255,255,255,.28) !important; }
.dx-node-title:hover, .dx-node-title:focus {
  border-color: rgba(255,255,255,.16) !important;
  background: rgba(12,12,12,.72) !important;
}
.dx-kind-badge {
  position: absolute; top: 8px; left: 8px; width: 22px; height: 22px; border-radius: 7px;
  display: grid; place-items: center; color: #fff;
  background: rgba(10,10,10,.55); border: 1px solid rgba(255,255,255,.1); backdrop-filter: blur(8px);
}
.dx-generating { position: relative; }
.dx-generating::after {
  content: ''; position: absolute; inset: 0; pointer-events: none; border-radius: inherit;
  background: linear-gradient(100deg, transparent 20%, rgba(255,255,255,.08) 50%, transparent 80%);
  background-size: 220% 100%; animation: dx-shimmer 1.5s linear infinite;
}
@keyframes dx-shimmer { 0% { background-position: 120% 0; } 100% { background-position: -120% 0; } }
.dx-spin {
  width: 12px; height: 12px; border-radius: 99px;
  border: 1.5px solid rgba(20,20,20,.25); border-top-color: #141414;
  animation: dx-rotate .7s linear infinite; display: block;
}
@keyframes dx-rotate { to { transform: rotate(360deg); } }
.dx-dot, .dx-dot-warn {
  width: 6px; height: 6px; border-radius: 99px; display: inline-block; background: #6fdf86;
}
.dx-dot-warn { background: #e8c36a; }
.dx-scrim { background: rgba(0,0,0,.55); backdrop-filter: blur(8px); }
.dx-range { appearance: none; height: 2px; background: rgba(255,255,255,.18); border-radius: 99px; outline: none; }
.dx-range::-webkit-slider-thumb { appearance: none; width: 12px; height: 12px; border-radius: 99px; background: #f3f3f3; cursor: pointer; }
.dx-session-log { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.22) transparent; }
.dx-session-fab[data-running='true'] { box-shadow: 0 0 0 1px rgba(111,223,134,.45), 0 12px 28px rgba(0,0,0,.4); }
.dx-md { font-size: 13px; line-height: 1.62; color: #f1f1f1; word-break: break-word; }
.dx-md > *:first-child { margin-top: 0; }
.dx-md > *:last-child { margin-bottom: 0; }
.dx-md h1, .dx-md h2, .dx-md h3 { font-weight: 600; letter-spacing: -0.28px; margin: 12px 0 6px; line-height: 1.3; }
.dx-md h1 { font-size: 17px; }
.dx-md h2 { font-size: 15px; }
.dx-md h3 { font-size: 13.5px; }
.dx-md p { margin: 0 0 8px; }
.dx-md strong { font-weight: 600; }
.dx-md em { font-style: italic; color: #e8e8e8; }
.dx-md del { opacity: .62; }
.dx-md code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11.5px; background: rgba(255,255,255,.08);
  padding: 1px 5px; border-radius: 5px;
}
.dx-md pre {
  background: rgba(0,0,0,.38); border: 1px solid rgba(255,255,255,.08);
  border-radius: 10px; padding: 10px 12px; overflow: auto; margin: 8px 0;
}
.dx-md pre code { background: none; padding: 0; font-size: 11.5px; white-space: pre; }
.dx-md ul, .dx-md ol { margin: 4px 0 8px; padding-left: 1.2em; }
.dx-md li { margin: 3px 0; }
.dx-md blockquote {
  margin: 8px 0; padding: 2px 0 2px 10px;
  border-left: 2px solid rgba(255,255,255,.22); color: #c4c4c4;
}
.dx-md a { color: #c9d4ff; text-decoration: underline; text-underline-offset: 2px; }
.dx-md hr { border: none; border-top: 1px solid rgba(255,255,255,.1); margin: 10px 0; }
.dx-stage .react-flow__node:hover .dx-port-dot { transform: scale(1.12); }
.dx-stage.dx-hide-wires .react-flow__edge,
.dx-stage.dx-hide-wires .dx-wire-edge,
.dx-stage.dx-hide-wires .dx-wire-halo { opacity: 0 !important; pointer-events: none !important; }
.dx-stage .react-flow__node { outline: none !important; }
.dx-stage .react-flow__node:not(.selected):not(.dx-can-connect) { box-shadow: none !important; }
.dx-stage .react-flow__resize-control.line { border: none !important; background: transparent !important; }
.dx-stage .react-flow__resize-control.handle {
  width: 7px !important; height: 7px !important; border-radius: 2px;
  background: #f3f3f3 !important; border: none !important;
}
`

interface MediaFile { path: string; name: string; mediaType: string; size: number; at?: number }

async function saveBlob(blob: Blob, name: string, mediaType: string): Promise<{ path: string; name: string; mediaType: string }> {
  const response = await fetch(withProject('/directorx/media'), {
    method: 'POST',
    headers: { 'content-type': mediaType, 'x-directorx-name': encodeURIComponent(name), ...projectHeaders() },
    body: blob,
  })
  if (!response.ok) throw new Error(`保存失败 (HTTP ${response.status})`)
  return response.json() as Promise<{ path: string; name: string; mediaType: string }>
}

function StageInner(props: StageProps): ReactNode {
  const snapshot = useSyncExternalStore(subscribeEditor, editorSnapshot)
  const { fitView, zoomIn, zoomOut, screenToFlowPosition, setViewport, getViewport } = useReactFlow()
  const { zoom } = useViewport()
  const [nodes, setNodes] = useState<StageNode[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const nodesRef = useRef(nodes)
  const edgesRef = useRef(edges)
  const saveRef = useRef<() => void>(() => {})
  useEffect(() => { nodesRef.current = nodes; edgesRef.current = edges }, [nodes, edges])
  const updatedAtRef = useRef(0)
  const dirtyRef = useRef(false)
  const titleRef = useRef('未命名画布')
  const [title, setTitle] = useState('未命名画布')
  const [saveState, setSaveState] = useState('已保存')
  const [error, setError] = useState<string | undefined>(undefined)
  const [box, setBox] = useState({ width: 0, height: 0 })
  const stageRef = useRef<HTMLDivElement | null>(null)
  const [picker, setPicker] = useState(false)
  const [files, setFiles] = useState<MediaFile[]>([])
  const [askBusy, setAskBusy] = useState(false)
  const [studioUrl, setStudioUrl] = useState<string | undefined>(undefined)
  const [studioError, setStudioError] = useState<string | undefined>(undefined)
  const undoRef = useRef<Array<{ nodes: StageNode[]; edges: Edge[] }>>([])
  const redoRef = useRef<Array<{ nodes: StageNode[]; edges: Edge[] }>>([])
  const [historyTick, setHistoryTick] = useState(0)
  const [helpOpen, setHelpOpen] = useState(false)
  const [toast, setToast] = useState<string>()
  const uploadRef = useRef<HTMLInputElement | null>(null)
  const uploadTargetRef = useRef<string | undefined>(undefined)
  const composeRef = useRef<HTMLTextAreaElement | null>(null)
  const fittedRef = useRef(false)
  const nodeCountRef = useRef(0)
  const [projects, setProjects] = useState<ProjectInfo[]>([])
  const [project, setProject] = useState<string | undefined>(getClientProject())
  const [addMenu, setAddMenu] = useState<{ x: number; y: number; flow?: { x: number; y: number } } | undefined>(undefined)
  const [nodeMenu, setNodeMenu] = useState<{ x: number; y: number; nodeId: string } | undefined>(undefined)
  const [edgeMenu, setEdgeMenu] = useState<{ x: number; y: number; edgeId: string } | undefined>(undefined)
  const [compose, setCompose] = useState<GenerateSpec>({
    kind: 'image',
    prompt: '',
    count: 1,
    aspect: '16:9',
  })
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFilter, setSearchFilter] = useState('')
  const [snap, setSnap] = useState(false)
  const [hideWires, setHideWires] = useState(false)
  const [libraryTab, setLibraryTab] = useState('media')
  const [libraryQuery, setLibraryQuery] = useState('')
  const [characters, setCharacters] = useState<Array<{ name: string; description: string; refPath: string; outfit?: string; props?: string }>>([])
  const [compare, setCompare] = useState<[string, string] | undefined>(undefined)
  const [sessionOpen, setSessionOpen] = useState(false)
  const [sessionPulse, setSessionPulse] = useState(0)
  const [boundSessionId, setBoundSessionId] = useState<string>()
  const onSessionOpenChange = useCallback((open: boolean) => { setSessionOpen(open) }, [])
  const connectRef = useRef<{ nodeId: string; x: number; y: number; handleId?: string | null } | undefined>(undefined)
  const connectHandledRef = useRef(false)
  const studioSeenRef = useRef('')

  const nodeAbsBox = useCallback((id: string) => {
    const current = nodesRef.current
    const node = current.find(item => item.id === id)
    if (node === undefined) return undefined
    const located = current.map(item => ({ id: item.id, position: item.position, parentId: item.parentId }))
    const byId = new Map(located.map(item => [item.id, item]))
    const origin = flowAbsolutePosition({ id: node.id, position: node.position, parentId: node.parentId }, byId)
    const width = typeof node.width === 'number' ? node.width : typeof node.style?.width === 'number' ? node.style.width : defaultSize(node.data.kind ?? node.type ?? 'image').width
    const height = typeof node.height === 'number' ? node.height : typeof node.style?.height === 'number' ? node.style.height : defaultSize(node.data.kind ?? node.type ?? 'image').height
    return { x: origin.x, y: origin.y, width, height }
  }, [])
  const [wiring, setWiring] = useState(false)
  const [wireMenu, setWireMenu] = useState<{ sourceId: string; handleId?: string | null; x: number; y: number; flow: { x: number; y: number } } | undefined>(undefined)
  const [wireDrag, setWireDrag] = useState<{ from: { x: number; y: number }; to: { x: number; y: number }; handleId?: string | null; targetId?: string } | undefined>(undefined)
  const edgeTypes = useMemo(() => ({ wire: WireEdge }), [])

  const selected = useMemo(() => nodes.find(node => node.selected === true), [nodes])
  const selectedNodes = useMemo(() => nodes.filter(node => node.selected === true), [nodes])
  const actionRef = useRef({
    openGenerate: (_id: string) => {},
    openStudioFor: (_id: string) => {},
    rename: (_id: string, _label: string) => {},
    cycleStatus: (_id: string) => {},
    duplicate: (_id: string) => {},
    lock: (_id: string) => {},
    download: (_id: string) => {},
    patch: (_id: string, _patch: Partial<StageNode['data']>) => {},
    adopt: (_id: string) => {},
    focusTake: (_id: string) => {},
    remove: (_id: string) => {},
    runGenerate: (_id: string) => {},
    upload: (_id: string) => {},
    pickRef: (_id: string) => {},
  })
  const attachActions = useCallback((node: StageNode): StageNode => ({
    ...node,
    draggable: node.data.locked !== true,
    data: {
      ...node.data,
      onGenerate: (id: string) => actionRef.current.runGenerate(id),
      onEdit: (id: string) => actionRef.current.openStudioFor(id),
      onRename: (id: string, label: string) => actionRef.current.rename(id, label),
      onCycleStatus: (id: string) => actionRef.current.cycleStatus(id),
      onDuplicate: (id: string) => actionRef.current.duplicate(id),
      onLock: (id: string) => actionRef.current.lock(id),
      onDownload: (id: string) => actionRef.current.download(id),
      onPatch: (id, patch) => actionRef.current.patch(id, patch),
      onAdoptTake: (id: string) => actionRef.current.adopt(id),
      onFocusTake: (id: string) => actionRef.current.focusTake(id),
      onDelete: (id: string) => actionRef.current.remove(id),
      onUpload: (id: string) => actionRef.current.upload(id),
      onPickRef: (id: string) => actionRef.current.pickRef(id),
    },
  }), [])

  useEffect(() => {
    if (document.getElementById('dx-fonts') !== null) return
    const link = document.createElement('link')
    link.id = 'dx-fonts'
    link.rel = 'stylesheet'
    link.href = INTER_HREF
    document.head.appendChild(link)
  }, [])

  useEffect(() => {
    const el = stageRef.current
    if (el === null) return
    const apply = () => {
      const rect = el.getBoundingClientRect()
      setBox({ width: Math.round(rect.width), height: Math.round(rect.height) })
    }
    apply()
    const observer = new ResizeObserver(apply)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const applyDoc = useCallback((doc: CanvasDoc) => {
    updatedAtRef.current = doc.updatedAt
    const nextTitle = typeof doc.title === 'string' && doc.title !== '' ? doc.title : '未命名画布'
    titleRef.current = nextTitle
    setTitle(nextTitle)
    setNodes(toFlowNodes(doc).map(node => attachActions(node)))
    setEdges(toFlowEdges(doc))
    const prevCount = nodeCountRef.current
    nodeCountRef.current = doc.nodes.length
    const shouldFit = doc.nodes.length > 0 && (!fittedRef.current || prevCount === 0 || doc.nodes.length - prevCount >= 4)
    if (shouldFit) {
      fittedRef.current = true
      const mapped = toFlowNodes(doc)
      window.requestAnimationFrame(() => {
        void fitView({ nodes: mapped, padding: 0.2, duration: 280, maxZoom: 0.9, minZoom: 0.18 })
      })
    }
  }, [attachActions, fitView])

  const load = useCallback(async () => {
    try {
      const response = await fetch(withProject('/directorx/canvas'), { headers: projectHeaders() })
      if (!response.ok) throw new Error(`画布加载失败 (${response.status})`)
      applyDoc(await response.json() as CanvasDoc)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }, [applyDoc])

  useEffect(() => {
    let live = true
    const tick = async () => {
      try {
        const response = await fetch(withProject('/directorx/studio'), { headers: projectHeaders() })
        if (!response.ok) return
        const body = await response.json() as { ticket?: { id?: string; kind?: string; path?: string; look?: string; at?: number } }
        const ticket = body.ticket
        if (!live || ticket === undefined || typeof ticket.id !== 'string' || typeof ticket.path !== 'string') return
        if (studioSeenRef.current === '') {
          if (typeof ticket.at === 'number' && Date.now() - ticket.at > 30_000) {
            studioSeenRef.current = ticket.id
            return
          }
        }
        if (ticket.id === studioSeenRef.current) return
        studioSeenRef.current = ticket.id
        if (ticket.kind !== 'image' && ticket.kind !== 'video') return
        openEditor(ticket.kind, ticket.path, ticket.look !== undefined ? { look: ticket.look } : undefined)
        void load()
      } catch {
        // ticket poll is advisory
      }
    }
    void tick()
    const timer = window.setInterval(() => { void tick() }, 1400)
    return () => {
      live = false
      window.clearInterval(timer)
    }
  }, [load, project])

  useEffect(() => {
    void fetch('/directorx/projects').then(item => item.json()).then((data: { projects?: ProjectInfo[] }) => {
      const list = data.projects ?? []
      setProjects(list)
      const next = pickDefaultProject(list, props.preferredProject)
      if (next !== undefined) {
        setClientProject(next)
        setProject(next)
      }
    }).catch(() => {})
  }, [props.preferredProject])

  useEffect(() => {
    if (project === undefined) return
    setClientProject(project)
    dirtyRef.current = false
    fittedRef.current = false
    void load()
  }, [project, load])

  useEffect(() => {
    let cancelled = false
    const bind = async (): Promise<void> => {
      if (project === undefined || props.sessions?.list === undefined) {
        setBoundSessionId(undefined)
        return
      }
      try {
        const listed = parseSessionList(await props.sessions.list({}))
        const workspaceRaw = props.workspace?.list === undefined ? undefined : await props.workspace.list({})
        const picked = pickWorkspaceSession({
          project,
          sessions: listed,
          workspaces: workspaceRaw === undefined ? [] : parseWorkspaceList(workspaceRaw),
          archivedIds: workspaceRaw === undefined ? [] : parseArchivedIds(workspaceRaw),
          preferredId: props.sessionId,
        })
        if (!cancelled) setBoundSessionId(picked?.id)
      } catch {
        if (!cancelled) setBoundSessionId(undefined)
      }
    }
    void bind()
    return () => { cancelled = true }
  }, [project, props.sessionId, props.sessions, props.workspace])

  const startWorkspaceSession = useCallback(async (): Promise<string> => {
    if (project === undefined) throw new Error('这个工作区还没有 DSH 会话')
    const liveId = await createLiveSession(props.liveSessions, { cwd: project })
    if (liveId !== undefined && liveId !== '') {
      setBoundSessionId(liveId)
      return liveId
    }
    const create = props.sessions?.create
    if (create === undefined) throw new Error('这个工作区还没有 DSH 会话')
    const created = createdSessionId(await create({ cwd: project, agentPreset: 'directorx' }))
    if (created === undefined || created === '') throw new Error('无法在这个工作区创建 DSH 会话')
    setBoundSessionId(created)
    return created
  }, [project, props.liveSessions, props.sessions])

  const ensureWorkspaceSession = useCallback(async (): Promise<string> => {
    if (boundSessionId !== undefined && boundSessionId !== '') return boundSessionId
    return startWorkspaceSession()
  }, [boundSessionId, startWorkspaceSession])

  const saveNow = useCallback(async () => {
    if (!dirtyRef.current) return
    setSaveState('保存中…')
    try {
      const doc = fromFlow(nodesRef.current, edgesRef.current, titleRef.current, updatedAtRef.current)
      const response = await fetch(withProject(`/directorx/canvas?expectedUpdatedAt=${updatedAtRef.current}`), {
        method: 'PUT',
        headers: { 'content-type': 'application/json', ...projectHeaders() },
        body: JSON.stringify(doc),
      })
      if (response.status === 409) {
        const fresh = await fetch(withProject('/directorx/canvas'), { headers: projectHeaders() }).then(item => item.json()) as CanvasDoc
        updatedAtRef.current = fresh.updatedAt
        const retry = await fetch(withProject(`/directorx/canvas?expectedUpdatedAt=${fresh.updatedAt}`), {
          method: 'PUT',
          headers: { 'content-type': 'application/json', ...projectHeaders() },
          body: JSON.stringify({ ...doc, updatedAt: fresh.updatedAt }),
        })
        if (!retry.ok) throw new Error('画布保存冲突')
        const saved = await retry.json() as CanvasDoc
        updatedAtRef.current = saved.updatedAt
        dirtyRef.current = false
        setSaveState('已保存')
        return
      }
      if (!response.ok) throw new Error(`画布保存失败 (${response.status})`)
      const saved = await response.json() as CanvasDoc
      updatedAtRef.current = saved.updatedAt
      dirtyRef.current = false
      setSaveState('已保存')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
      setSaveState('保存失败')
    }
  }, [])

  const saveTimerRef = useRef(0)
  const scheduleSave = useCallback(() => {
    dirtyRef.current = true
    setSaveState('未保存')
    saveRef.current = saveNow
    window.clearTimeout(saveTimerRef.current)
    saveTimerRef.current = window.setTimeout(() => { void saveNow() }, 400)
  }, [saveNow])

  useEffect(() => { saveRef.current = scheduleSave }, [scheduleSave])
  useEffect(() => () => { if (dirtyRef.current) void saveNow() }, [saveNow])

  useEffect(() => {
    const refresh = () => {
      if (dirtyRef.current) return
      void fetch(withProject('/directorx/canvas'), { headers: projectHeaders() }).then(item => item.json()).then((doc: CanvasDoc) => {
        if (doc.updatedAt !== updatedAtRef.current) applyDoc(doc)
      }).catch(() => {})
    }
    const timer = window.setInterval(refresh, 3000)
    window.addEventListener('focus', refresh)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
    }
  }, [applyDoc])

  const showToast = useCallback((text: string) => {
    setToast(text)
    window.setTimeout(() => setToast(current => current === text ? undefined : current), 1600)
  }, [])

  const snapshotGraph = useCallback(() => ({
    nodes: nodesRef.current.map(node => ({
      ...node,
      data: {
        label: node.data.label,
        ...(node.data.kind !== undefined ? { kind: node.data.kind } : {}),
        ...(node.data.path !== undefined ? { path: node.data.path } : {}),
        ...(node.data.prompt !== undefined ? { prompt: node.data.prompt } : {}),
        ...(node.data.shotStatus !== undefined ? { shotStatus: node.data.shotStatus } : {}),
        ...(node.data.shotIndex !== undefined ? { shotIndex: node.data.shotIndex } : {}),
        ...(node.data.locked === true ? { locked: true } : {}),
        ...(node.data.selectedTakeId !== undefined ? { selectedTakeId: node.data.selectedTakeId } : {}),
        ...(node.data.aspect !== undefined ? { aspect: node.data.aspect } : {}),
        ...(node.data.model !== undefined ? { model: node.data.model } : {}),
        ...(node.data.durationSec !== undefined ? { durationSec: node.data.durationSec } : {}),
        ...(node.data.lastError !== undefined ? { lastError: node.data.lastError } : {}),
        ...(node.data.count !== undefined ? { count: node.data.count } : {}),
        ...(node.data.characters !== undefined ? { characters: node.data.characters } : {}),
      },
    })),
    edges: edgesRef.current.map(edge => ({ ...edge })),
  }), [])

  const pushHistory = useCallback(() => {
    undoRef.current.push(snapshotGraph())
    if (undoRef.current.length > 40) undoRef.current.shift()
    redoRef.current = []
    setHistoryTick(value => value + 1)
  }, [snapshotGraph])

  const restoreGraph = useCallback((shot: { nodes: StageNode[]; edges: Edge[] }) => {
    setNodes(shot.nodes.map(node => attachActions(node)))
    setEdges(shot.edges)
    scheduleSave()
    setHistoryTick(value => value + 1)
  }, [attachActions, scheduleSave])

  const undo = useCallback(() => {
    const prev = undoRef.current.pop()
    if (prev === undefined) return
    redoRef.current.push(snapshotGraph())
    restoreGraph(prev)
  }, [restoreGraph, snapshotGraph])

  const redo = useCallback(() => {
    const next = redoRef.current.pop()
    if (next === undefined) return
    undoRef.current.push(snapshotGraph())
    restoreGraph(next)
  }, [restoreGraph, snapshotGraph])

  const addNode = useCallback((kind: 'image' | 'video' | 'text' | 'group', extra: Partial<StageNode['data']> = {}, position?: { x: number; y: number }) => {
    pushHistory()
    const aspect = kind === 'image' || kind === 'video'
      ? (typeof extra.aspect === 'string' && extra.aspect !== '' ? extra.aspect : '16:9')
      : extra.aspect
    const size = defaultSize(kind, aspect)
    const id = newId(kind)
    const pane = stageRef.current?.querySelector('.react-flow')
    const rect = pane?.getBoundingClientRect()
    const origin = rect !== undefined
      ? screenToFlowPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
      : { x: 200, y: 160 }
    const stack = nodesRef.current.length % 5
    const at = position ?? {
      x: origin.x - size.width / 2 + stack * 32,
      y: origin.y - size.height / 2 + stack * 32,
    }
    const node: StageNode = {
      id,
      type: kind === 'group' ? 'group' : kind === 'text' ? 'text' : 'media',
      position: at,
      width: size.width,
      height: size.height,
      style: { ...size, overflow: 'visible' },
      selected: true,
      data: {
        ...(kind === 'image' || kind === 'video' ? { kind, path: extra.path ?? '' } : {}),
        label: extra.label ?? (kind === 'group' ? '分组' : kind === 'text' ? '文本' : kind === 'video' ? '视频' : '图片'),
        ...(aspect !== undefined ? { aspect } : {}),
        ...extra,
      },
    }
    setNodes(current => [...current.map(item => ({ ...item, selected: false })), attachActions(node)])
    scheduleSave()
    return id
  }, [attachActions, pushHistory, scheduleSave, screenToFlowPosition])

  const onNodesChange = useCallback((changes: NodeChange<StageNode>[]) => {
    const resized = changes.some(change => change.type === 'dimensions')
    if (changes.some(change => change.type === 'position' && change.dragging === false) || changes.some(change => change.type === 'remove' || change.type === 'dimensions')) {
      scheduleSave()
    }
    setNodes(current => {
      const next = applyNodeChanges(changes, current)
      if (!resized) return next
      return next.map(node => {
        const width = typeof node.style?.width === 'number' ? node.style.width : undefined
        const height = typeof node.style?.height === 'number' ? node.style.height : undefined
        if (width === undefined || height === undefined || node.type !== 'media') return node
        if (node.data.aspect !== undefined && node.data.aspect !== '') {
          const size = sizeFromAspect(node.data.aspect, width)
          if (size.height === height) return node
          return { ...node, width: size.width, height: size.height, style: { ...node.style, ...size, overflow: 'visible' } }
        }
        const inferred = nearestAspect(width, height)
        return { ...node, data: { ...node.data, aspect: inferred } }
      })
    })
  }, [scheduleSave])

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    if (changes.some(change => change.type === 'remove')) scheduleSave()
    setEdges(current => applyEdgeChanges(changes, current))
  }, [scheduleSave])

  const linkNodes = useCallback((source: string, target: string, handles?: { sourceHandle?: string | null; targetHandle?: string | null }) => {
    if (source === target) return false
    const locked = nodesRef.current.find(node => node.id === target)?.data.locked === true
    if (locked) return false
    if (edgesRef.current.some(edge => edge.source === source && edge.target === target)) return true
    pushHistory()
    const next = addEdge({
      id: newId('edge'),
      source,
      target,
      sourceHandle: handles?.sourceHandle || 'out',
      targetHandle: handles?.targetHandle || 'in',
      type: 'wire',
      style: EDGE_STYLE,
      markerEnd: EDGE_MARK,
    }, edgesRef.current)
    edgesRef.current = next
    setEdges(next)
    scheduleSave()
    return true
  }, [pushHistory, scheduleSave])

  const onConnect = useCallback((connection: Connection) => {
    if (connection.source === null || connection.target === null) return
    connectHandledRef.current = true
    linkNodes(connection.source, connection.target, {
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
    })
  }, [linkNodes])

  const onReconnect = useCallback((oldEdge: Edge, connection: Connection) => {
    if (connection.source === null || connection.target === null || connection.source === connection.target) return
    if (nodesRef.current.find(node => node.id === connection.target)?.data.locked === true) return
    pushHistory()
    setEdges(current => reconnectEdge(oldEdge, {
      ...connection,
      sourceHandle: connection.sourceHandle ?? oldEdge.sourceHandle ?? 'out',
      targetHandle: connection.targetHandle ?? oldEdge.targetHandle ?? 'in',
    }, current).map(edge => edge.id === oldEdge.id
      ? { ...edge, type: 'wire', style: EDGE_STYLE, markerEnd: EDGE_MARK }
      : edge))
    scheduleSave()
  }, [pushHistory, scheduleSave])

  const pointerOf = (event: MouseEvent | TouchEvent): { x: number; y: number } | undefined => {
    if ('clientX' in event) return { x: event.clientX, y: event.clientY }
    const touch = event.changedTouches[0]
    return touch !== undefined ? { x: touch.clientX, y: touch.clientY } : undefined
  }

  const onConnectStart = useCallback((event: MouseEvent | TouchEvent, params: OnConnectStartParams) => {
    const point = pointerOf(event)
    if (params.nodeId === null || params.nodeId === '' || point === undefined) return
    connectHandledRef.current = false
    connectRef.current = { nodeId: params.nodeId, x: point.x, y: point.y, handleId: params.handleId }
    const box = nodeAbsBox(params.nodeId)
    const from = box !== undefined ? boxPort(box, params.handleId) : screenToFlowPosition(point)
    setWireDrag({ from, to: screenToFlowPosition(point), handleId: params.handleId })
    setWiring(true)
    setWireMenu(undefined)
  }, [nodeAbsBox, screenToFlowPosition])

  const focusCompose = useCallback(() => {
    window.requestAnimationFrame(() => composeRef.current?.focus())
  }, [])

  const openWireMenu = useCallback((sourceId: string, point: { x: number; y: number }, handleId?: string | null) => {
    setWireMenu({
      sourceId,
      handleId,
      x: point.x,
      y: point.y,
      flow: screenToFlowPosition(point),
    })
  }, [screenToFlowPosition])

  const onConnectEnd = useCallback((event: MouseEvent | TouchEvent) => {
    const start = connectRef.current
    const already = connectHandledRef.current
    connectRef.current = undefined
    connectHandledRef.current = false
    setWiring(false)
    setWireDrag(undefined)
    if (start === undefined) return
    const point = pointerOf(event)
    if (point === undefined) return
    const dropped = (event.target as HTMLElement | null)?.closest('.react-flow__node')
    const targetId = dropped?.getAttribute('data-id') ?? undefined
    if (targetId !== undefined && targetId !== start.nodeId) {
      if (already) return
      const flow = screenToFlowPosition(point)
      const targetBox = nodeAbsBox(targetId)
      const targetHandle = targetBox === undefined ? 'in' : closestHandleId(targetBox, flow)
      linkNodes(start.nodeId, targetId, { sourceHandle: start.handleId ?? 'out', targetHandle })
      return
    }
    const dragged = Math.hypot(point.x - start.x, point.y - start.y)
    if (targetId === start.nodeId && dragged > 10) return
    openWireMenu(start.nodeId, point, start.handleId)
  }, [linkNodes, nodeAbsBox, openWireMenu, screenToFlowPosition])

  useEffect(() => {
    if (!wiring) return
    const onMove = (event: PointerEvent) => {
      const start = connectRef.current
      if (start === undefined) return
      const flow = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      const box = nodeAbsBox(start.nodeId)
      const from = box !== undefined ? boxPort(box, start.handleId) : flow
      const hit = (event.target as HTMLElement | null)?.closest('.react-flow__node')
      const targetId = hit?.getAttribute('data-id') ?? undefined
      const locked = targetId !== undefined && nodesRef.current.find(node => node.id === targetId)?.data.locked === true
      const valid = targetId !== undefined && targetId !== start.nodeId && !locked
      setWireDrag({ from, to: flow, handleId: start.handleId, ...(valid ? { targetId } : {}) })
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [nodeAbsBox, screenToFlowPosition, wiring])

  const patchSelected = useCallback((patch: Partial<StageNode['data']>) => {
    if (selected === undefined) return
    setNodes(current => current.map(node => node.id === selected.id ? { ...node, data: { ...node.data, ...patch } } : node))
    scheduleSave()
  }, [scheduleSave, selected])

  const openStudio = useCallback((kind: 'image' | 'video', path: string) => {
    openEditor(kind, path)
  }, [])

  useEffect(() => {
    if (snapshot.path === null || (snapshot.tab !== 'image' && snapshot.tab !== 'video')) {
      if (studioUrl !== undefined) URL.revokeObjectURL(studioUrl)
      setStudioUrl(undefined)
      setStudioError(undefined)
      return
    }
    let live = true
    setStudioUrl(undefined)
    setStudioError(undefined)
    void fetch(mediaUrl(snapshot.path))
      .then(response => {
        if (!response.ok) throw new Error(`媒体加载失败 (HTTP ${response.status})`)
        return response.blob()
      })
      .then(blob => {
        if (!live) return
        setStudioUrl(URL.createObjectURL(blob))
      })
      .catch(cause => { if (live) setStudioError(cause instanceof Error ? cause.message : String(cause)) })
    return () => { live = false }
  }, [snapshot.path, snapshot.tab])

  const onStudioExport = useCallback(async (blob: Blob, mediaType: string) => {
    const record = await saveBlob(blob, snapshot.path?.split('/').pop() ?? 'edit', mediaType)
    const kind: 'image' | 'video' = mediaType.startsWith('video/') ? 'video' : 'image'
    if (selected !== undefined && selected.type === 'media') {
      patchSelected({ path: record.path, label: record.name, kind })
    } else {
      addNode(kind, { path: record.path, label: record.name })
    }
    setEditorTab('canvas')
  }, [addNode, patchSelected, selected, snapshot.path])

  const openGenerate = useCallback((sourceId?: string) => {
    const source = sourceId !== undefined
      ? nodesRef.current.find(node => node.id === sourceId)
      : nodesRef.current.find(node => node.selected === true)
    const kind = inferContinueKind(source?.data.kind)
    const prompt = (source?.data.prompt && source.data.prompt !== '' ? source.data.prompt : source?.data.label) ?? ''
    setCompose({
      kind,
      prompt,
      count: source?.data.count ?? 1,
      aspect: source?.data.aspect ?? '16:9',
      ...(source?.data.model !== undefined ? { model: source.data.model } : {}),
      ...(source?.data.durationSec !== undefined ? { durationSec: source.data.durationSec } : {}),
      ...(source !== undefined ? { sourceId: source.id } : {}),
    })
    focusCompose()
  }, [focusCompose])

  const openStudioFor = useCallback((id: string) => {
    const node = nodesRef.current.find(item => item.id === id)
    const path = node?.data.path
    if (node === undefined || path === undefined || path === '') return
    openStudio(node.data.kind === 'video' ? 'video' : 'image', path)
  }, [openStudio])

  const renameNode = useCallback((id: string, label: string) => {
    setNodes(current => current.map(node => node.id === id ? { ...node, data: { ...node.data, label } } : node))
    scheduleSave()
  }, [scheduleSave])

  const patchNode = useCallback((id: string, patch: Partial<StageNode['data']>) => {
    setNodes(current => current.map(node => {
      if (node.id !== id) return node
      const next = { ...node, data: { ...node.data, ...patch, lastError: patch.lastError ?? undefined } }
      if (typeof patch.aspect === 'string' && patch.aspect !== '') {
        const width = typeof node.style?.width === 'number' ? node.style.width : defaultSize(node.data.kind ?? 'image').width
        const size = sizeFromAspect(patch.aspect, width)
        next.style = { ...node.style, ...size, overflow: 'visible' }
        next.width = size.width
        next.height = size.height
      }
      return attachActions(next)
    }))
    if (selected?.id === id) {
      setCompose(current => ({
        ...current,
        ...(patch.prompt !== undefined ? { prompt: patch.prompt } : {}),
        ...(patch.model !== undefined ? { model: patch.model } : {}),
        ...(patch.aspect !== undefined ? { aspect: patch.aspect } : {}),
        ...(patch.count !== undefined ? { count: patch.count } : {}),
        ...(patch.durationSec !== undefined ? { durationSec: patch.durationSec } : {}),
        ...(patch.kind === 'image' || patch.kind === 'video' ? { kind: patch.kind } : {}),
        ...(patch.characters !== undefined ? { characters: patch.characters } : {}),
      }))
    }
    scheduleSave()
  }, [attachActions, scheduleSave, selected])

  const cycleStatus = useCallback((id: string) => {
    setNodes(current => current.map(node => node.id === id
      ? { ...node, data: { ...node.data, shotStatus: cycleShotStatus(node.data.shotStatus) } }
      : node))
    scheduleSave()
  }, [scheduleSave])

  const setShotStatus = useCallback((id: string, status: ShotStatus) => {
    setNodes(current => current.map(node => node.id === id ? { ...node, data: { ...node.data, shotStatus: status } } : node))
    scheduleSave()
  }, [scheduleSave])

  const focusTake = useCallback((id: string) => {
    const node = nodesRef.current.find(item => item.id === id)
    if (node === undefined) return
    setNodes(current => current.map(item => ({ ...item, selected: item.id === id })))
    void fitView({ nodes: [node], padding: 0.35, duration: 220, maxZoom: 1.15 })
  }, [fitView])

  const adoptTake = useCallback((id: string) => {
    const chosen = nodesRef.current.find(node => node.id === id)
    const otherId = compare?.find(item => item !== id)
    pushHistory()
    setNodes(current => current.map(node => {
      if (node.id === id) return { ...node, data: { ...node.data, shotStatus: 'locked' } }
      if (otherId !== undefined && node.id === otherId) return { ...node, data: { ...node.data, shotStatus: 'review' } }
      if (chosen?.parentId !== undefined && node.id === chosen.parentId) {
        return { ...node, data: { ...node.data, selectedTakeId: id } }
      }
      return node
    }))
    setCompare(undefined)
    scheduleSave()
  }, [compare, pushHistory, scheduleSave])

  const submitSpec = useCallback(async (spec: GenerateSpec) => {
    const prompt = spec.prompt.trim()
    if (prompt === '' || askBusy) return
    setAskBusy(true)
    try {
      const sourceId = spec.sourceId ?? selected?.id
      const response = await fetch(withProject('/directorx/canvas/intent'), {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...projectHeaders() },
        body: JSON.stringify({
          kind: spec.kind,
          prompt: specPrompt({ ...spec, prompt }),
          ...(sourceId !== undefined ? { sourceId } : {}),
          selectedIds: [...new Set([
            ...(spec.targetId !== undefined ? [spec.targetId] : []),
            ...nodesRef.current.filter(node => node.selected === true).map(node => node.id),
          ])],
          ...(spec.model !== undefined ? { model: spec.model } : {}),
          ...(spec.aspect !== undefined ? { aspect: spec.aspect } : {}),
          ...(spec.count !== undefined ? { count: spec.count } : {}),
          ...(spec.durationSec !== undefined ? { durationSec: spec.durationSec } : {}),
          ...(spec.refIds !== undefined ? { refIds: spec.refIds } : {}),
          ...(spec.characters !== undefined ? { characters: spec.characters } : {}),
        }),
      })
      if (!response.ok) throw new Error(`指令入队失败 (${response.status})`)
      const data = await response.json() as { prompt?: string }
      const message = typeof data.prompt === 'string' && data.prompt !== '' ? data.prompt : specPrompt({ ...spec, prompt })
      if (props.onAskDsh !== undefined) {
        const sessionId = await ensureWorkspaceSession()
        await props.onAskDsh(message, sessionId)
      }
      setCompose(current => ({ ...current, prompt: '' }))
      setSessionOpen(true)
      setSessionPulse(value => value + 1)
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause)
      setError(message)
      const target = spec.targetId ?? spec.sourceId
      if (target !== undefined) {
        setNodes(current => current.map(node => node.id === target
          ? { ...node, data: { ...node.data, shotStatus: 'failed', lastError: message } }
          : node))
      }
    } finally {
      setAskBusy(false)
    }
  }, [askBusy, ensureWorkspaceSession, props, selected])

  const submitAsk = useCallback(async () => {
    await submitSpec(compose)
  }, [compose, submitSpec])

  const runNodeGenerate = useCallback((id: string) => {
    const node = nodesRef.current.find(item => item.id === id)
    const spec: GenerateSpec = {
      kind: node?.data.kind === 'video' ? 'video' : compose.kind,
      prompt: (node?.data.prompt && node.data.prompt !== '' ? node.data.prompt : compose.prompt) ?? '',
      count: node?.data.count ?? compose.count ?? 1,
      aspect: node?.data.aspect ?? compose.aspect,
      ...(node?.data.model !== undefined ? { model: node.data.model } : compose.model !== undefined ? { model: compose.model } : {}),
      ...(node?.data.durationSec !== undefined ? { durationSec: node.data.durationSec } : {}),
      ...(node?.data.characters !== undefined ? { characters: node.data.characters } : compose.characters !== undefined ? { characters: compose.characters } : {}),
      refIds: incomingRefIds(id, edgesRef.current),
      sourceId: id,
      targetId: id,
    }
    setCompose(spec)
    if (spec.prompt.trim() === '') {
      focusCompose()
      return
    }
    void submitSpec(spec)
  }, [compose, focusCompose, submitSpec])

  const openPicker = useCallback(async () => {
    setPicker(true)
    try {
      const [media, people] = await Promise.all([
        fetch(withProject('/directorx/media/list'), { headers: projectHeaders() }).then(item => item.json()) as Promise<{ files?: MediaFile[] }>,
        fetch(withProject('/directorx/characters'), { headers: projectHeaders() }).then(item => item.json()).catch(() => ({ characters: [] })) as Promise<{ characters?: Array<{ name: string; description: string; refPath: string; outfit?: string; props?: string }> }>,
      ])
      setFiles(media.files ?? [])
      setCharacters(people.characters ?? [])
    } catch {
      setFiles([])
    }
  }, [])

  const pinSubject = useCallback(async (role: 'character' | 'scene' | 'prop') => {
    const node = selected
    const path = node?.data.path
    if (node === undefined || path === undefined || path === '') {
      showToast('先选中一张有媒体的节点')
      return
    }
    const name = (node.data.label || '未命名').trim().slice(0, 80)
    try {
      const response = await fetch(withProject('/directorx/characters'), {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...projectHeaders() },
        body: JSON.stringify({
          name,
          refPath: path,
          description: role === 'scene' ? `场景 · ${name}` : (node.data.prompt ?? ''),
          ...(role === 'prop' ? { props: name } : {}),
        }),
      })
      if (!response.ok) throw new Error(`登记失败 (${response.status})`)
      const listed = await fetch(withProject('/directorx/characters'), { headers: projectHeaders() }).then(item => item.json()) as { characters?: typeof characters }
      setCharacters(listed.characters ?? [])
      if (role === 'character') {
        patchNode(node.id, { characters: [...new Set([...(node.data.characters ?? []), name])] })
        setCompose(current => ({ ...current, characters: [...new Set([...(current.characters ?? []), name])] }))
      }
      setLibraryTab(role === 'prop' ? 'prop' : role === 'scene' ? 'scene' : 'character')
      showToast(role === 'scene' ? '已登记场景' : role === 'prop' ? '已登记道具' : '已登记角色')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }, [patchNode, selected, showToast])

  const uploadFiles = useCallback(async (list: File[], position?: { x: number; y: number }) => {
    const targetId = uploadTargetRef.current
    uploadTargetRef.current = undefined
    let usedTarget = false
    for (const file of list) {
      const record = await saveBlob(file, file.name, file.type || 'application/octet-stream')
      const kind: 'image' | 'video' = file.type.startsWith('video/') ? 'video' : 'image'
      if (!usedTarget && targetId !== undefined) {
        const node = nodesRef.current.find(item => item.id === targetId)
        if (node?.type === 'media') {
          patchNode(targetId, { path: record.path, label: record.name, kind })
          usedTarget = true
          continue
        }
      }
      addNode(kind, { path: record.path, label: record.name }, position)
    }
  }, [addNode, patchNode])

  const deleteIds = useCallback((ids: string[]) => {
    const drop = new Set(ids.filter(id => nodesRef.current.find(node => node.id === id)?.data.locked !== true))
    if (drop.size === 0) return
    pushHistory()
    setNodes(current => current.filter(node => !drop.has(node.id)))
    setEdges(current => current.filter(edge => !drop.has(edge.source) && !drop.has(edge.target)))
    scheduleSave()
  }, [pushHistory, scheduleSave])

  const duplicateNode = useCallback((id: string) => {
    const source = nodesRef.current.find(node => node.id === id)
    if (source === undefined) return
    pushHistory()
    const copy = attachActions({
      ...source,
      id: newId(source.type ?? 'text'),
      position: { x: source.position.x + 40, y: source.position.y + 40 },
      selected: true,
    })
    setNodes(current => [...current.map(node => ({ ...node, selected: false })), copy])
    scheduleSave()
  }, [attachActions, pushHistory, scheduleSave])

  const disconnectNode = useCallback((id: string) => {
    pushHistory()
    setEdges(current => current.filter(edge => edge.source !== id && edge.target !== id))
    scheduleSave()
  }, [pushHistory, scheduleSave])

  const toggleLock = useCallback((ids: string[]) => {
    if (ids.length === 0) return
    pushHistory()
    const shouldLock = ids.some(id => nodesRef.current.find(node => node.id === id)?.data.locked !== true)
    setNodes(current => current.map(node => ids.includes(node.id)
      ? attachActions({ ...node, draggable: !shouldLock, data: { ...node.data, locked: shouldLock } })
      : node))
    scheduleSave()
    showToast(shouldLock ? '已锁定' : '已解锁')
  }, [attachActions, pushHistory, scheduleSave, showToast])

  const downloadNode = useCallback(async (id: string) => {
    const node = nodesRef.current.find(item => item.id === id)
    const path = node?.data.path
    if (node === undefined || path === undefined || path === '') return
    try {
      const response = await fetch(mediaUrl(path))
      if (!response.ok) throw new Error(`下载失败 (${response.status})`)
      const blob = await response.blob()
      const href = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = href
      link.download = node.data.label || path.split('/').pop() || 'media'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(href)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }, [])

  const ungroupIds = useCallback((ids: string[]) => {
    const groups = nodesRef.current.filter(node => ids.includes(node.id) && node.type === 'group')
    if (groups.length === 0) return
    pushHistory()
    const groupIds = new Set(groups.map(node => node.id))
    const origin = new Map(groups.map(node => [node.id, node.position]))
    setNodes(current => current
      .filter(node => !groupIds.has(node.id))
      .map(node => {
        if (node.parentId === undefined || !groupIds.has(node.parentId)) return node
        const parent = origin.get(node.parentId)
        return {
          ...node,
          parentId: undefined,
          extent: undefined,
          position: { x: node.position.x + (parent?.x ?? 0), y: node.position.y + (parent?.y ?? 0) },
        }
      }))
    scheduleSave()
    showToast('已解散分组')
  }, [pushHistory, scheduleSave, showToast])

  const applyPositions = useCallback((next: Array<{ id: string; x: number; y: number }>) => {
    if (next.length === 0) return
    pushHistory()
    const map = new Map(next.map(item => [item.id, item]))
    setNodes(current => current.map(node => {
      const at = map.get(node.id)
      return at === undefined ? node : { ...node, position: { x: at.x, y: at.y } }
    }))
    scheduleSave()
  }, [pushHistory, scheduleSave])

  const boxesOf = (list: StageNode[]) => list.map(node => ({
    id: node.id,
    x: node.position.x,
    y: node.position.y,
    w: typeof node.style?.width === 'number' ? node.style.width : 250,
    h: typeof node.style?.height === 'number' ? node.style.height : 180,
  }))

  const alignSelected = useCallback((kind: AlignKind) => {
    applyPositions(alignBoxes(boxesOf(nodesRef.current.filter(node => node.selected === true)), kind))
  }, [applyPositions])

  const distributeSelected = useCallback((axis: 'x' | 'y') => {
    applyPositions(distributeBoxes(boxesOf(nodesRef.current.filter(node => node.selected === true)), axis))
  }, [applyPositions])

  const copySelected = useCallback(async () => {
    const chosen = nodesRef.current.filter(node => node.selected === true)
    const packed = packClip(chosen, edgesRef.current)
    if (packed === undefined) return
    try {
      await navigator.clipboard.writeText(JSON.stringify(packed))
      showToast(`已复制 ${packed.nodes.length} 个节点`)
    } catch {
      showToast('无法写入剪贴板')
    }
  }, [showToast])

  const pasteClip = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      const packed = asClipPayload(JSON.parse(text) as unknown)
      if (packed === undefined) return false
      pushHistory()
      const pane = stageRef.current?.querySelector('.react-flow')
      const rect = pane?.getBoundingClientRect()
      const origin = rect !== undefined
        ? screenToFlowPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
        : { x: 120, y: 120 }
      const created = packed.nodes.map(node => {
        const kind = node.kind === 'video' || node.kind === 'image' ? node.kind : node.type === 'group' ? 'group' : node.type === 'media' ? 'image' : 'text'
        const id = newId(kind === 'group' ? 'group' : kind === 'text' ? 'text' : kind)
        return { clip: node, id }
      })
      const nodesToAdd = created.map(entry => attachActions({
        id: entry.id,
        type: entry.clip.type === 'group' ? 'group' : entry.clip.type === 'text' ? 'text' : 'media',
        position: { x: origin.x + entry.clip.x - 40, y: origin.y + entry.clip.y - 40 },
        style: {
          width: entry.clip.width ?? defaultSize(entry.clip.kind ?? entry.clip.type ?? 'text').width,
          height: entry.clip.height ?? defaultSize(entry.clip.kind ?? entry.clip.type ?? 'text').height,
          overflow: 'visible',
        },
        selected: true,
        data: {
          ...(entry.clip.kind === 'image' || entry.clip.kind === 'video' ? { kind: entry.clip.kind, path: entry.clip.path ?? '' } : {}),
          label: entry.clip.label,
          ...(entry.clip.prompt !== undefined ? { prompt: entry.clip.prompt } : {}),
          ...(entry.clip.shotStatus !== undefined ? { shotStatus: entry.clip.shotStatus } : {}),
        },
      }))
      const withParents = nodesToAdd
      const edgesToAdd: Edge[] = packed.edges.map(edge => ({
        id: newId('edge'),
        source: created[edge.from]?.id ?? '',
        target: created[edge.to]?.id ?? '',
        sourceHandle: 'out',
        targetHandle: 'in',
        type: 'wire',
        style: EDGE_STYLE,
        markerEnd: EDGE_MARK,
        ...(edge.label !== undefined ? { label: edge.label } : {}),
      })).filter(edge => edge.source !== '' && edge.target !== '')
      setNodes(current => [...current.map(node => ({ ...node, selected: false })), ...withParents])
      setEdges(current => [...current, ...edgesToAdd])
      scheduleSave()
      showToast(`已粘贴 ${withParents.length} 个节点`)
      return true
    } catch {
      return false
    }
  }, [attachActions, pushHistory, scheduleSave, screenToFlowPosition, showToast])

  useEffect(() => {
    actionRef.current = {
      openGenerate,
      openStudioFor,
      rename: renameNode,
      cycleStatus,
      duplicate: duplicateNode,
      lock: (id: string) => toggleLock([id]),
      download: (id: string) => { void downloadNode(id) },
      patch: (id, patch) => patchNode(id, patch),
      adopt: (id: string) => adoptTake(id),
      focusTake: (id: string) => focusTake(id),
      remove: (id: string) => deleteIds([id]),
      runGenerate: (id: string) => runNodeGenerate(id),
      upload: (id: string) => {
        uploadTargetRef.current = id
        uploadRef.current?.click()
      },
      pickRef: (id: string) => {
        setNodes(current => current.map(node => ({ ...node, selected: node.id === id })))
        setLibraryTab('history')
        void openPicker()
      },
    }
  }, [adoptTake, cycleStatus, deleteIds, downloadNode, duplicateNode, focusTake, openGenerate, openPicker, openStudioFor, patchNode, renameNode, runNodeGenerate, toggleLock])

  const groupSelected = useCallback(() => {
    const members = selectedNodes.filter(node => node.type !== 'group' && (node.parentId === undefined || node.parentId === ''))
    if (members.length < 2) return
    pushHistory()
    const pad = 36
    const minX = Math.min(...members.map(node => node.position.x)) - pad
    const minY = Math.min(...members.map(node => node.position.y)) - 52
    const maxX = Math.max(...members.map(node => node.position.x + (typeof node.style?.width === 'number' ? node.style.width : 250))) + pad
    const maxY = Math.max(...members.map(node => node.position.y + (typeof node.style?.height === 'number' ? node.style.height : 180))) + pad
    const id = newId('group')
    const group: StageNode = {
      id,
      type: 'group',
      position: { x: minX, y: minY },
      style: { width: Math.max(280, maxX - minX), height: Math.max(200, maxY - minY) },
      selected: true,
      data: { label: '分组' },
    }
    const memberIds = new Set(members.map(node => node.id))
    setNodes(current => [
      attachActions(group),
      ...current.map(node => memberIds.has(node.id)
        ? { ...node, parentId: id, extent: 'parent' as const, position: { x: node.position.x - minX, y: node.position.y - minY }, selected: false }
        : { ...node, selected: false }),
    ])
    scheduleSave()
  }, [attachActions, pushHistory, scheduleSave, selectedNodes])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const typing = (event.target as HTMLElement | null)?.matches('input, textarea, [contenteditable=true]')
      if (typing) return
      const studio = snapshot.tab === 'image' || snapshot.tab === 'video'
      if (studio && event.key !== 'Escape') return
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
      if ((event.metaKey || event.ctrlKey) && event.key === '0') {
        event.preventDefault()
        void fitView({ padding: 0.2, duration: 240, maxZoom: 1 })
      }
      if ((event.metaKey || event.ctrlKey) && (event.key === '=' || event.key === '+')) {
        event.preventDefault()
        void zoomIn()
      }
      if ((event.metaKey || event.ctrlKey) && event.key === '-') {
        event.preventDefault()
        void zoomOut()
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(open => !open)
        return
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'a') {
        event.preventDefault()
        setNodes(current => current.map(node => ({ ...node, selected: true })))
        return
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'c') {
        event.preventDefault()
        void copySelected()
        return
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'v') {
        event.preventDefault()
        void pasteClip()
        return
      }
      if (event.key === '?' || (event.shiftKey && event.key === '/')) {
        event.preventDefault()
        setHelpOpen(open => !open)
        return
      }
      if (event.key === 'Escape') {
        if (helpOpen) {
          setHelpOpen(false)
          return
        }
        if (sessionOpen) {
          setSessionOpen(false)
          return
        }
        setPicker(false)
        setAddMenu(undefined)
        setNodeMenu(undefined)
        setEdgeMenu(undefined)
        setWireMenu(undefined)
        setWiring(false)
        setSearchOpen(false)
        setCompare(undefined)
        setCompose(current => ({ kind: current.kind, prompt: current.prompt }))
        if (snapshot.tab !== 'canvas') setEditorTab('canvas')
      }
      if (event.key.toLowerCase() === 's' && !event.metaKey && !event.ctrlKey) {
        const focus = nodesRef.current.find(node => node.selected === true)
        if (focus !== undefined) {
          event.preventDefault()
          cycleStatus(focus.id)
        }
      }
      if (event.key.toLowerCase() === 'c' && !event.metaKey && !event.ctrlKey) {
        const media = nodesRef.current.filter(node => node.selected === true && node.type === 'media' && node.data.path)
        if (media.length >= 2) {
          event.preventDefault()
          setCompare([media[0].id, media[1].id])
        }
      }
      if (event.key.toLowerCase() === 'g' && !event.metaKey && !event.ctrlKey) {
        event.preventDefault()
        openGenerate()
      }
      if (event.key.toLowerCase() === 'l' && !event.metaKey && !event.ctrlKey) {
        event.preventDefault()
        toggleLock(nodesRef.current.filter(node => node.selected === true).map(node => node.id))
        return
      }
      if (event.key.toLowerCase() === 'f' && !event.metaKey && !event.ctrlKey) {
        event.preventDefault()
        const focus = nodesRef.current.filter(node => node.selected === true)
        void fitView({ nodes: focus.length > 0 ? focus : undefined, padding: 0.24, duration: 240, maxZoom: 1.15 })
        return
      }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key) && !event.metaKey && !event.ctrlKey) {
        event.preventDefault()
        const step = event.shiftKey ? 16 : 2
        const dx = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0
        const dy = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0
        applyPositions(nudgeBoxes(boxesOf(nodesRef.current.filter(node => node.selected === true && node.data.locked !== true)), dx, dy))
        return
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'd') {
        event.preventDefault()
        const source = nodesRef.current.find(node => node.selected === true)
        if (source !== undefined) duplicateNode(source.id)
      }
      if ((event.key === 'Backspace' || event.key === 'Delete') && !event.metaKey && !event.ctrlKey) {
        const ids = nodesRef.current.filter(node => node.selected === true).map(node => node.id)
        const edgeIds = edgesRef.current.filter(edge => edge.selected === true).map(edge => edge.id)
        if (ids.length > 0 || edgeIds.length > 0) {
          event.preventDefault()
          if (ids.length > 0) deleteIds(ids)
          if (edgeIds.length > 0) {
            pushHistory()
            const drop = new Set(edgeIds)
            setEdges(current => current.filter(edge => !drop.has(edge.id)))
            scheduleSave()
          }
        }
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [applyPositions, copySelected, cycleStatus, deleteIds, duplicateNode, fitView, helpOpen, openGenerate, pasteClip, pushHistory, redo, scheduleSave, sessionOpen, snapshot.tab, toggleLock, undo, zoomIn, zoomOut])

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const typing = (event.target as HTMLElement | null)?.matches('input, textarea, [contenteditable=true]')
      if (typing) return
      const files = [...(event.clipboardData?.files ?? [])].filter(file => file.type.startsWith('image/') || file.type.startsWith('video/'))
      if (files.length === 0) return
      event.preventDefault()
      void uploadFiles(files)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [uploadFiles])

  const pickAdd = useCallback((kind: AddKind, flow?: { x: number; y: number }) => {
    setAddMenu(undefined)
    if (kind === 'upload') {
      uploadRef.current?.click()
      return
    }
    if (kind === 'assets') {
      void openPicker()
      return
    }
    if (kind === 'edit-image' || kind === 'edit-video') {
      const want = kind === 'edit-video' ? 'video' : 'image'
      const node = nodesRef.current.find(item => item.selected === true && item.type === 'media' && item.data.kind === want && typeof item.data.path === 'string' && item.data.path !== '')
        ?? nodesRef.current.find(item => item.type === 'media' && item.data.kind === want && typeof item.data.path === 'string' && item.data.path !== '')
      if (node === undefined) {
        showToast(want === 'video' ? '先选中一段有成片的视频' : '先选中一张有成片的图片')
        return
      }
      openStudioFor(node.id)
      return
    }
    addNode(kind, {}, flow)
  }, [addNode, openPicker, openStudioFor, showToast])

  const setZoom = useCallback((next: number) => {
    const view = getViewport()
    void setViewport({ ...view, zoom: Math.max(0.1, Math.min(3, next)) })
  }, [getViewport, setViewport])

  const studioOpen = snapshot.tab === 'image' || snapshot.tab === 'video'
  const sourceNode = compose.sourceId !== undefined ? nodes.find(node => node.id === compose.sourceId) : undefined
  const mediaSelected = selectedNodes.filter(node => node.type === 'media' && node.data.path)
  const multi = selectedNodes.length >= 2 && !studioOpen

  return (
    <div className={`dx-stage${wiring ? ' dx-wiring' : ''}${hideWires ? ' dx-hide-wires' : ''}`} style={shell}>
      <style>{STAGE_CSS}</style>
      <TopBar
        title={title}
        onTitle={value => {
          setTitle(value)
          titleRef.current = value
          scheduleSave()
        }}
        projects={projects}
        project={project}
        onProject={path => {
          dirtyRef.current = false
          setClientProject(path)
          setProject(path)
        }}
        saveState={saveState}
        count={nodes.length}
        onClose={props.onClose}
      />
      <input
        ref={uploadRef}
        type="file"
        accept="image/*,video/*"
        multiple
        hidden
        onChange={event => {
          const list = event.target.files
          if (list !== null) void uploadFiles(Array.from(list))
          event.target.value = ''
        }}
      />
      <div ref={stageRef} style={{ flex: 1, minHeight: 0, minWidth: 0, position: 'relative', touchAction: 'none' }}>
        {error !== undefined ? (
          <div style={{ position: 'absolute', top: 64, left: '50%', transform: 'translateX(-50%)', zIndex: 25, color: '#ff9b8f', fontSize: 12, ...{ background: 'rgba(40,16,14,.9)', padding: '6px 12px', borderRadius: 999 } }}>{error}</div>
        ) : null}
        <ReactFlow
          nodes={wireDrag?.targetId === undefined ? nodes : nodes.map(node => (
            node.id === wireDrag.targetId ? { ...node, className: 'dx-can-connect' } : node.className !== undefined ? { ...node, className: undefined } : node
          ))}
          edges={edges}
          nodeTypes={stageNodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          onReconnect={onReconnect}
          isValidConnection={connection => {
            if (connection.source === connection.target) return false
            return nodesRef.current.find(node => node.id === connection.target)?.data.locked !== true
          }}
          edgeTypes={edgeTypes}
          connectionLineComponent={WirePreview}
          onNodeDoubleClick={(_event, node) => {
            const data = node.data
            if ((data.kind === 'image' || data.kind === 'video') && typeof data.path === 'string' && data.path !== '') {
              openStudio(data.kind, data.path)
            }
          }}
          onPaneClick={() => {
            setPicker(false)
            setAddMenu(undefined)
            setNodeMenu(undefined)
            setEdgeMenu(undefined)
            setWireMenu(undefined)
          }}
          onPaneContextMenu={event => {
            event.preventDefault()
            setNodeMenu(undefined)
            setAddMenu({
              x: event.clientX,
              y: event.clientY,
              flow: screenToFlowPosition({ x: event.clientX, y: event.clientY }),
            })
          }}
          onDoubleClick={event => {
            const target = event.target as HTMLElement
            if (target.closest('.react-flow__node') !== null) return
            setNodeMenu(undefined)
            setAddMenu({
              x: event.clientX,
              y: event.clientY,
              flow: screenToFlowPosition({ x: event.clientX, y: event.clientY }),
            })
          }}
          onNodeContextMenu={(event, node) => {
            event.preventDefault()
            setAddMenu(undefined)
            setEdgeMenu(undefined)
            setNodeMenu({ x: event.clientX, y: event.clientY, nodeId: node.id })
          }}
          onEdgeContextMenu={(event, edge) => {
            event.preventDefault()
            setAddMenu(undefined)
            setNodeMenu(undefined)
            setEdgeMenu({ x: event.clientX, y: event.clientY, edgeId: edge.id })
          }}
          onDrop={event => {
            event.preventDefault()
            const at = screenToFlowPosition({ x: event.clientX, y: event.clientY })
            if (event.dataTransfer.files.length > 0) void uploadFiles(Array.from(event.dataTransfer.files), at)
          }}
          onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy' }}
          onNodeDragStart={() => { pushHistory() }}
          nodesDraggable
          nodesConnectable
          elementsSelectable
          edgesReconnectable
          selectNodesOnDrag
          nodeDragThreshold={1}
          connectionMode={ConnectionMode.Loose}
          connectionRadius={72}
          connectOnClick
          deleteKeyCode={null}
          onlyRenderVisibleElements={false}
          selectionOnDrag
          selectionKeyCode="Shift"
          multiSelectionKeyCode={['Shift', 'Meta']}
          panOnDrag
          panActivationKeyCode="Space"
          snapToGrid={snap}
          snapGrid={[16, 16]}
          selectionMode={SelectionMode.Partial}
          elevateNodesOnSelect
          zoomOnScroll={false}
          zoomActivationKeyCode="Meta"
          panOnScroll
          zoomOnPinch
          zoomOnDoubleClick={false}
          preventScrolling
          minZoom={0.1}
          maxZoom={3}
          connectionLineType={ConnectionLineType.Bezier}
          connectionLineStyle={{ stroke: 'rgba(255,255,255,.5)', strokeWidth: 1.8 }}
          style={{
            width: box.width > 0 ? box.width : '100%',
            height: box.height > 0 ? box.height : '100%',
          }}
          defaultEdgeOptions={{
            type: 'wire',
            style: { stroke: 'rgba(236,236,236,.9)', strokeWidth: 2.15 },
            markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: 'rgba(236,236,236,.9)' },
            interactionWidth: 28,
          }}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={26} size={1.05} color="rgba(255,255,255,.07)" />
          {box.width > 1080 && !sessionOpen ? (
            <MiniMap pannable zoomable position="bottom-left" style={{ background: '#121212', width: 132, height: 84 }} />
          ) : null}
          {wireDrag !== undefined ? (
            <WireDragLayer from={wireDrag.from} to={wireDrag.to} fromSide={wireDrag.handleId} valid={wireDrag.targetId !== undefined} />
          ) : null}
        </ReactFlow>
        <StageRail
          onAdd={() => setAddMenu({ x: 68, y: 58 })}
          onSearch={() => setSearchOpen(true)}
          onAssets={() => { void openPicker() }}
          onUpload={() => uploadRef.current?.click()}
          onHelp={() => setHelpOpen(true)}
        />
        <ZoomHud
          zoom={zoom}
          canUndo={historyTick >= 0 && undoRef.current.length > 0}
          canRedo={historyTick >= 0 && redoRef.current.length > 0}
          onUndo={undo}
          onRedo={redo}
          onZoom={setZoom}
          snap={snap}
          hideWires={hideWires}
          onSnap={() => setSnap(value => !value)}
          onHideWires={() => setHideWires(value => !value)}
          onFit={() => {
            const focus = nodes.filter(node => node.selected === true)
            void fitView({ nodes: focus.length > 0 ? focus : undefined, padding: 0.2, duration: 240, maxZoom: 1 })
          }}
        />
        <Toast text={toast} />
        {nodes.length === 0 && !studioOpen ? <EmptyHero onGenerate={() => openGenerate()} /> : null}
        {addMenu !== undefined ? (
          <AddMenu x={addMenu.x} y={addMenu.y} onPick={kind => pickAdd(kind, addMenu.flow)} />
        ) : null}
        {wireMenu !== undefined ? (
          <ConnectMenu
            x={wireMenu.x}
            y={wireMenu.y}
            onPick={kind => {
              const source = nodesRef.current.find(node => node.id === wireMenu.sourceId)
              const width = typeof source?.style?.width === 'number' ? source.style.width : defaultSize(source?.data.kind ?? 'image').width
              const dragged = Math.hypot(
                wireMenu.flow.x - (source?.position.x ?? wireMenu.flow.x),
                wireMenu.flow.y - (source?.position.y ?? wireMenu.flow.y),
              )
              const at = source !== undefined && dragged < 80
                ? { x: source.position.x + width + 48, y: source.position.y }
                : wireMenu.flow
              const id = addNode(kind, {
                label: kind === 'video' ? '下游视频' : kind === 'image' ? '下游图片' : '下游文本',
                prompt: source?.data.prompt ?? '',
                ...(source?.data.aspect !== undefined ? { aspect: source.data.aspect } : {}),
                ...(source?.data.model !== undefined ? { model: source.data.model } : {}),
                ...(source?.data.durationSec !== undefined ? { durationSec: source.data.durationSec } : {}),
                ...(source?.data.characters !== undefined ? { characters: source.data.characters } : {}),
                ...(kind !== 'text' ? { shotStatus: 'idea' } : {}),
              }, at)
              linkNodes(wireMenu.sourceId, id, { sourceHandle: wireMenu.handleId ?? 'out', targetHandle: 'in' })
              setWireMenu(undefined)
              if (kind !== 'text') {
                setCompose({
                  kind,
                  prompt: source?.data.prompt ?? source?.data.label ?? '',
                  sourceId: wireMenu.sourceId,
                  targetId: id,
                  count: source?.data.count ?? 1,
                  ...(source?.data.aspect !== undefined ? { aspect: source.data.aspect } : { aspect: '16:9' }),
                  ...(source?.data.model !== undefined ? { model: source.data.model } : {}),
                  ...(source?.data.durationSec !== undefined ? { durationSec: source.data.durationSec } : {}),
                  ...(source?.data.characters !== undefined ? { characters: source.data.characters } : {}),
                  refIds: [wireMenu.sourceId],
                })
                focusCompose()
              }
            }}
          />
        ) : null}
        {nodeMenu !== undefined ? (
          <NodeMenu
            x={nodeMenu.x}
            y={nodeMenu.y}
            canEdit={(() => {
              const node = nodes.find(item => item.id === nodeMenu.nodeId)
              return node?.type === 'media' && typeof node.data.path === 'string' && node.data.path !== ''
            })()}
            canDownload={(() => {
              const node = nodes.find(item => item.id === nodeMenu.nodeId)
              return typeof node?.data.path === 'string' && node.data.path !== ''
            })()}
            locked={nodes.find(item => item.id === nodeMenu.nodeId)?.data.locked === true}
            canUngroup={nodes.find(item => item.id === nodeMenu.nodeId)?.type === 'group'}
            onGenerate={() => { openGenerate(nodeMenu.nodeId); setNodeMenu(undefined) }}
            onEdit={() => { openStudioFor(nodeMenu.nodeId); setNodeMenu(undefined) }}
            onDownload={() => { void downloadNode(nodeMenu.nodeId); setNodeMenu(undefined) }}
            onDuplicate={() => {
              duplicateNode(nodeMenu.nodeId)
              setNodeMenu(undefined)
            }}
            onLock={() => { toggleLock([nodeMenu.nodeId]); setNodeMenu(undefined) }}
            onDisconnect={() => {
              disconnectNode(nodeMenu.nodeId)
              setNodeMenu(undefined)
            }}
            onUngroup={() => { ungroupIds([nodeMenu.nodeId]); setNodeMenu(undefined) }}
            onDelete={() => {
              deleteIds([nodeMenu.nodeId])
              setNodeMenu(undefined)
            }}
          />
        ) : null}
        {edgeMenu !== undefined ? (
          <EdgeMenu
            x={edgeMenu.x}
            y={edgeMenu.y}
            onDelete={() => {
              pushHistory()
              setEdges(current => current.filter(edge => edge.id !== edgeMenu.edgeId))
              setEdgeMenu(undefined)
              scheduleSave()
            }}
          />
        ) : null}
        {searchOpen && !studioOpen ? (
          <SearchPalette
            query={searchQuery}
            filter={searchFilter}
            hits={nodes
              .filter(node => {
                const kind = node.data.kind ?? node.type ?? 'text'
                if (searchFilter !== '' && kind !== searchFilter) return false
                const blob = `${node.id} ${node.type} ${kind} ${node.data.label} ${node.data.prompt ?? ''}`.toLowerCase()
                return searchQuery.trim() === '' || blob.includes(searchQuery.trim().toLowerCase())
              })
              .slice(0, 20)
              .map(node => ({
                id: node.id,
                kind: node.data.kind ?? node.type ?? 'text',
                label: node.data.label,
              }))}
            onQuery={setSearchQuery}
            onFilter={setSearchFilter}
            onPick={id => {
              const node = nodes.find(item => item.id === id)
              setSearchOpen(false)
              setSearchQuery('')
              if (node === undefined) return
              setNodes(current => current.map(item => ({ ...item, selected: item.id === id })))
              void fitView({ nodes: [node], padding: 0.35, duration: 240, maxZoom: 1.15 })
            }}
            onClose={() => setSearchOpen(false)}
          />
        ) : null}
        {compare !== undefined && !studioOpen ? (() => {
          const left = nodes.find(node => node.id === compare[0])
          const right = nodes.find(node => node.id === compare[1])
          if (left === undefined || right === undefined || !left.data.path || !right.data.path) return null
          return (
            <CompareOverlay
              left={{ id: left.id, label: left.data.label, path: mediaUrl(left.data.path), kind: left.data.kind ?? 'image' }}
              right={{ id: right.id, label: right.data.label, path: mediaUrl(right.data.path), kind: right.data.kind ?? 'image' }}
              onAdopt={adoptTake}
              onClose={() => setCompare(undefined)}
            />
          )
        })() : null}
        {!studioOpen && compare === undefined && !searchOpen && !(selected?.type === 'media' && !multi) ? (
          <GenerateDock
            spec={compose}
            busy={askBusy}
            reserveRight={sessionOpen ? (selected !== undefined && !multi && selected.type !== 'media' ? 700 : 428) : 24}
            sourceLabel={sourceNode?.data.label}
            inputRef={composeRef}
            onChange={setCompose}
            onSubmit={() => { void submitAsk() }}
            onClose={() => composeRef.current?.blur()}
            onClearSource={() => setCompose(current => ({ kind: current.kind, prompt: current.prompt, count: current.count, aspect: current.aspect }))}
          />
        ) : null}
        {multi ? (
          <MultiSelectBar
            count={selectedNodes.length}
            canCompare={mediaSelected.length >= 2}
            canUngroup={selectedNodes.some(node => node.type === 'group')}
            locked={selectedNodes.every(node => node.data.locked === true)}
            onCompare={() => setCompare([mediaSelected[0].id, mediaSelected[1].id])}
            onGroup={groupSelected}
            onUngroup={() => ungroupIds(selectedNodes.map(node => node.id))}
            onAlign={alignSelected}
            onDistribute={distributeSelected}
            onLock={() => toggleLock(selectedNodes.map(node => node.id))}
            onGenerate={() => openGenerate(selectedNodes[0]?.id)}
            onDelete={() => deleteIds(selectedNodes.map(node => node.id))}
          />
        ) : null}
        {selected !== undefined && !studioOpen && !multi && selected.type !== 'media' ? (
          <InspectorSheet
            kind={selected.data.kind ?? selected.type ?? 'text'}
            kindLabel={selected.type === 'media' ? selected.data.kind === 'video' ? '视频' : '图片' : selected.type === 'group' ? '分组' : '文本'}
            label={selected.data.label}
            prompt={selected.data.prompt ?? ''}
            path={selected.type === 'media' ? selected.data.path : undefined}
            status={selected.data.shotStatus}
            canEdit={selected.type === 'media' && typeof selected.data.path === 'string' && selected.data.path !== ''}
            canCompare={mediaSelected.length >= 2}
            canDownload={selected.type === 'media' && typeof selected.data.path === 'string' && selected.data.path !== ''}
            locked={selected.data.locked === true}
            onLabel={value => patchSelected({ label: value })}
            onPrompt={value => patchSelected({ prompt: value })}
            onStatus={status => setShotStatus(selected.id, status)}
            onEdit={() => openStudio(selected.data.kind === 'video' ? 'video' : 'image', selected.data.path ?? '')}
            onGenerate={() => openGenerate(selected.id)}
            onCompare={() => setCompare([mediaSelected[0].id, mediaSelected[1].id])}
            onLock={() => toggleLock([selected.id])}
            onDownload={() => { void downloadNode(selected.id) }}
            onDelete={() => deleteIds([selected.id])}
          />
        ) : null}
        <SessionDock
          sessionId={boundSessionId}
          sessions={props.sessions}
          liveSessions={props.liveSessions}
          open={sessionOpen}
          onOpenChange={onSessionOpenChange}
          hidden={studioOpen || searchOpen || compare !== undefined || helpOpen}
          inspectorOpen={selected !== undefined && !studioOpen && !multi && selected.type !== 'media'}
          pulse={sessionPulse}
          onEnsureSession={ensureWorkspaceSession}
          onNewSession={startWorkspaceSession}
          onLeave={props.onClose}
          selectedNode={selected !== undefined ? {
            id: selected.id,
            label: selected.data.label,
            ...(selected.data.kind !== undefined ? { kind: selected.data.kind } : {}),
            ...(selected.data.path !== undefined ? { path: selected.data.path } : {}),
          } : undefined}
          onClearSelected={() => setNodes(current => current.map(node => ({ ...node, selected: false })))}
        />
        {helpOpen && !studioOpen ? <ShortcutsSheet onClose={() => setHelpOpen(false)} /> : null}
        {picker ? (
          <AssetDrawer
            tab={libraryTab}
            query={libraryQuery}
            files={files}
            characters={characters}
            canPin={selected?.type === 'media' && typeof selected.data.path === 'string' && selected.data.path !== ''}
            onTab={setLibraryTab}
            onQuery={setLibraryQuery}
            onClose={() => setPicker(false)}
            onPick={file => {
              const kind: 'image' | 'video' = file.mediaType.startsWith('video/') ? 'video' : 'image'
              const empty = selected?.type === 'media' && (selected.data.path === undefined || selected.data.path === '')
              if (empty && selected !== undefined) patchNode(selected.id, { path: file.path, label: file.name, kind })
              else addNode(kind, { path: file.path, label: file.name })
              setPicker(false)
            }}
            onUseAsRef={file => {
              const target = selected?.type === 'media' ? selected : undefined
              if (target === undefined) {
                showToast('先选中要接参考的节点')
                return
              }
              const kind: 'image' | 'video' = file.mediaType.startsWith('video/') ? 'video' : 'image'
              const id = addNode(kind, { path: file.path, label: file.name }, {
                x: target.position.x - 280,
                y: target.position.y,
              })
              linkNodes(id, target.id)
              setPicker(false)
            }}
            onPickCharacter={(name, refPath) => {
              addNode('image', { path: refPath, label: name })
              setCompose(current => ({ ...current, characters: [...new Set([...(current.characters ?? []), name])] }))
              if (selected?.type === 'media') {
                patchNode(selected.id, { characters: [...new Set([...(selected.data.characters ?? []), name])] })
              }
              setPicker(false)
            }}
            onPin={role => { void pinSubject(role) }}
          />
        ) : null}
        {studioOpen ? (
          studioError !== undefined ? (
            <div style={{ position: 'absolute', inset: 0, zIndex: 40, background: dx.black, display: 'grid', placeItems: 'center', fontFamily: dx.font }}>
              <div style={{ textAlign: 'center', maxWidth: 420 }}>
                <div style={{ color: '#ff9b8f', marginBottom: 12, fontSize: 13 }}>加载失败：{studioError}</div>
                <button className="dx-hit" style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,.16)', background: 'rgba(255,255,255,.06)', color: '#eee' }} onClick={() => setEditorTab('canvas')}>返回画布</button>
              </div>
            </div>
          ) : studioUrl === undefined ? (
            <div style={{ position: 'absolute', inset: 0, zIndex: 40, background: dx.black, display: 'grid', placeItems: 'center', color: dx.mute, fontFamily: dx.font, fontSize: 13 }}>正在加载媒体…</div>
          ) : (
            <StudioErrorBoundary>
              {snapshot.tab === 'video' ? (
                <VideoStudio source={studioUrl} name={snapshot.path ?? 'video'} look={snapshot.look} nodeId={selected?.id} onExport={(blob, type) => { void onStudioExport(blob, type) }} onClose={() => setEditorTab('canvas')} />
              ) : (
                <ImageStudio source={studioUrl} name={snapshot.path ?? 'image'} look={snapshot.look} onExport={(blob, type) => { void onStudioExport(blob, type) }} onClose={() => setEditorTab('canvas')} />
              )}
            </StudioErrorBoundary>
          )
        ) : null}
      </div>
    </div>
  )
}

export function Stage(props: StageProps): ReactNode {
  return (
    <ReactFlowProvider>
      <StageInner {...props} />
    </ReactFlowProvider>
  )
}
