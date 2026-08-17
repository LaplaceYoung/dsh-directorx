import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { dx, dxChrome, dxGhostBtn, dxPill } from '../canvas-theme.ts'
import { SHOT_STATUS_COLOR, SHOT_STATUS_LABEL, SHOT_STATUSES, asShotStatus, type ShotStatus } from './document.ts'
import {
  IconAlign, IconCheck, IconChevron, IconClose, IconCompare, IconCopy, IconDownload, IconEdit, IconFit,
  IconFolder, IconGrid, IconGroup, IconHelp, IconImage, IconLock, IconMinus, IconPlus, IconRedo, IconSearch,
  IconSend, IconSpark, IconText, IconTrash, IconUndo, IconUnlink, IconUnlock, IconUpload, IconVideo, KindGlyph,
} from './icons.tsx'
import { clampMenu, type AlignKind } from './layout.ts'
import { NodeWorkstation } from './NodeWorkstation.tsx'
import { mediaUrl } from './nodes.tsx'

export type AddKind = 'image' | 'video' | 'text' | 'group' | 'upload' | 'assets' | 'edit-image' | 'edit-video'

const menu: CSSProperties = {
  ...dxChrome,
  position: 'absolute',
  zIndex: 30,
  minWidth: 196,
  padding: 6,
  borderRadius: 16,
}

const item: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  width: '100%',
  textAlign: 'left',
  padding: '8px 10px',
  border: 'none',
  borderRadius: 11,
  background: 'transparent',
  color: dx.ink,
  fontSize: 13,
  fontFamily: dx.font,
  cursor: 'pointer',
}

function viewSize(): { w: number; h: number } {
  return {
    w: typeof window === 'undefined' ? 1200 : window.innerWidth,
    h: typeof window === 'undefined' ? 800 : window.innerHeight,
  }
}

const kbd: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 20,
  height: 20,
  padding: '0 6px',
  borderRadius: 6,
  border: `1px solid ${dx.hairline}`,
  background: 'rgba(255,255,255,.05)',
  color: dx.mute,
  fontSize: 10,
  letterSpacing: 0.2,
  fontFamily: dx.font,
}

export function TitlePill(props: {
  value: string
  onChange: (value: string) => void
}): ReactNode {
  return (
    <input
      value={props.value}
      placeholder="请输入标题"
      onChange={event => props.onChange(event.target.value)}
      className="dx-title"
      style={{
        width: 240,
        height: 36,
        padding: '0 16px',
        borderRadius: 999,
        textAlign: 'center',
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: 0.1,
        outline: 'none',
        background: 'transparent',
        border: `1px solid ${dx.hairline}`,
        color: dx.ink,
        fontFamily: dx.font,
      }}
    />
  )
}

export function TopBar(props: {
  title: string
  onTitle: (value: string) => void
  projects: Array<{ path: string; title: string }>
  project?: string
  onProject: (path: string) => void
  saveState: string
  count: number
  onClose?: () => void
}): ReactNode {
  return (
    <div className="dx-topbar" style={{
      position: 'absolute',
      top: 14,
      left: 72,
      right: 14,
      zIndex: 24,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      pointerEvents: 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'auto' }}>
        {props.projects.length > 0 ? (
          <ProjectChip projects={props.projects} value={props.project} onChange={props.onProject} />
        ) : null}
        <div style={{ ...dxChrome, borderRadius: 999, padding: 3 }}>
          <TitlePill value={props.title} onChange={props.onTitle} />
        </div>
      </div>
      <div style={{ position: 'absolute', right: 0, display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'auto' }}>
        <div style={{
          ...dxChrome,
          height: 36,
          padding: '0 12px',
          borderRadius: 999,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 11,
          color: dx.mute,
          letterSpacing: 0.2,
        }}>
          <span className={props.saveState === '未保存' ? 'dx-dot-warn' : 'dx-dot'} />
          {props.saveState}
          <span style={{ opacity: .45 }}>·</span>
          {props.count}
        </div>
        {props.onClose !== undefined ? (
          <button className="dx-hit" style={{ ...dxChrome, ...dxGhostBtn, width: 36, height: 36, borderRadius: 999 }} onClick={props.onClose} title="关闭画布">
            <IconClose size={14} />
          </button>
        ) : null}
      </div>
    </div>
  )
}

function ProjectChip(props: {
  projects: Array<{ path: string; title: string }>
  value?: string
  onChange: (path: string) => void
}): ReactNode {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement | null>(null)
  const current = props.projects.find(item => item.path === props.value) ?? props.projects[0]
  useEffect(() => {
    if (!open) return
    const onDoc = (event: MouseEvent) => {
      if (root.current !== null && !root.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])
  return (
    <div ref={root} style={{ position: 'relative' }}>
      <button
        className="dx-hit"
        title="当前项目（每个工作区一份画布）"
        onClick={() => setOpen(value => !value)}
        style={{
          ...dxChrome,
          height: 36,
          padding: '0 12px 0 10px',
          borderRadius: 999,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          maxWidth: 220,
          fontSize: 12,
          fontWeight: 500,
        }}
      >
        <IconFolder size={14} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {current?.title || current?.path || '项目'}
        </span>
        <IconChevron size={12} />
      </button>
      {open ? (
        <div style={{ ...menu, left: 0, top: 44, minWidth: 220 }}>
          {props.projects.map(project => (
            <button
              key={project.path}
              className="dx-menu-item"
              style={item}
              onClick={() => {
                props.onChange(project.path)
                setOpen(false)
              }}
            >
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{project.title || project.path}</span>
              {project.path === props.value ? <IconCheck size={14} /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function StageRail(props: {
  onAdd: () => void
  onSearch: () => void
  onAssets: () => void
  onUpload: () => void
  onHelp: () => void
}): ReactNode {
  const rows: Array<{ label: string; onClick: () => void; icon: ReactNode; primary?: boolean }> = [
    { label: '添加节点', onClick: props.onAdd, icon: <IconPlus />, primary: true },
    { label: '搜索节点 ⌘K', onClick: props.onSearch, icon: <IconSearch /> },
    { label: '资源库', onClick: props.onAssets, icon: <IconGrid /> },
    { label: '上传', onClick: props.onUpload, icon: <IconUpload /> },
    { label: '快捷键 ?', onClick: props.onHelp, icon: <IconHelp /> },
  ]
  return (
    <div style={{
      ...dxChrome,
      position: 'absolute',
      top: '50%',
      left: 16,
      transform: 'translateY(-50%)',
      zIndex: 28,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      padding: 6,
      borderRadius: dx.radiusRail,
    }}>
      {rows.map(row => (
        <button
          key={row.label}
          className="dx-rail-btn dx-hit"
          title={row.label}
          data-tip={row.label}
          data-tip-side="right"
          onClick={row.onClick}
          style={row.primary === true ? { ...dxPill, width: 36, height: 36 } : dxGhostBtn}
        >
          {row.icon}
        </button>
      ))}
    </div>
  )
}

export function ConnectMenu(props: {
  x: number
  y: number
  onPick: (kind: 'image' | 'video' | 'text') => void
}): ReactNode {
  const left = Math.max(12, Math.min(props.x, (typeof window === 'undefined' ? props.x : window.innerWidth) - 208))
  const top = Math.max(12, Math.min(props.y, (typeof window === 'undefined' ? props.y : window.innerHeight) - 168))
  const rows: Array<{ kind: 'image' | 'video' | 'text'; label: string; icon: ReactNode }> = [
    { kind: 'image', label: '下游图片', icon: <IconImage size={15} /> },
    { kind: 'video', label: '下游视频', icon: <IconVideo size={15} /> },
    { kind: 'text', label: '下游文本', icon: <IconText size={15} /> },
  ]
  const pos = clampMenu(left, top, 200, 168, viewSize())
  return (
    <div style={{ ...menu, left: pos.left, top: pos.top }} onMouseDown={event => event.stopPropagation()}>
      <div style={{ padding: '6px 10px 8px', fontSize: 11, color: dx.mute }}>连接到新节点</div>
      {rows.map(row => (
        <button key={row.kind} className="dx-menu-item" style={item} onClick={() => props.onPick(row.kind)}>
          <span style={{ opacity: .7, display: 'flex' }}>{row.icon}</span>
          {row.label}
        </button>
      ))}
    </div>
  )
}

export function AddMenu(props: {
  x: number
  y: number
  onPick: (kind: AddKind) => void
}): ReactNode {
  const nodes: Array<{ kind: AddKind; label: string; icon: ReactNode }> = [
    { kind: 'image', label: '图片', icon: <IconImage size={15} /> },
    { kind: 'video', label: '视频', icon: <IconVideo size={15} /> },
    { kind: 'text', label: '文本', icon: <IconText size={15} /> },
    { kind: 'group', label: '分组', icon: <IconGroup size={15} /> },
  ]
  const extras: Array<{ kind: AddKind; label: string; icon: ReactNode }> = [
    { kind: 'edit-image', label: '图片编辑', icon: <IconEdit size={15} /> },
    { kind: 'edit-video', label: '视频剪辑', icon: <IconVideo size={15} /> },
    { kind: 'upload', label: '上传文件', icon: <IconUpload size={15} /> },
    { kind: 'assets', label: '从资源库加入', icon: <IconGrid size={15} /> },
  ]
  const pos = clampMenu(props.x, props.y, 220, 380, viewSize())
  const rowOf = (row: { kind: AddKind; label: string; icon: ReactNode }) => (
    <button key={row.kind} className="dx-menu-item" style={item} onClick={() => props.onPick(row.kind)}>
      <span style={{ opacity: .7, display: 'flex' }}>{row.icon}</span>
      {row.label}
    </button>
  )
  return (
    <div style={{ ...menu, left: pos.left, top: pos.top }} onMouseDown={event => event.stopPropagation()}>
      {nodes.map(rowOf)}
      <div style={{ height: 1, margin: '4px 8px', background: 'rgba(255,255,255,.08)' }} />
      {extras.map(rowOf)}
    </div>
  )
}

export function NodeMenu(props: {
  x: number
  y: number
  canEdit: boolean
  canDownload: boolean
  locked: boolean
  canUngroup: boolean
  onGenerate: () => void
  onEdit: () => void
  onDuplicate: () => void
  onDisconnect: () => void
  onLock: () => void
  onDownload: () => void
  onUngroup: () => void
  onDelete: () => void
}): ReactNode {
  const pos = clampMenu(props.x, props.y, 200, 320, viewSize())
  return (
    <div style={{ ...menu, left: pos.left, top: pos.top }} onMouseDown={event => event.stopPropagation()}>
      <button className="dx-menu-item" style={item} onClick={props.onGenerate}><IconSpark size={15} />生成</button>
      {props.canEdit ? <button className="dx-menu-item" style={item} onClick={props.onEdit}><IconEdit size={15} />编辑</button> : null}
      {props.canDownload ? <button className="dx-menu-item" style={item} onClick={props.onDownload}><IconDownload size={15} />下载</button> : null}
      <button className="dx-menu-item" style={item} onClick={props.onDuplicate}><IconCopy size={15} />复制</button>
      <button className="dx-menu-item" style={item} onClick={props.onLock}>{props.locked ? <IconUnlock size={15} /> : <IconLock size={15} />}{props.locked ? '解锁' : '锁定'}</button>
      <button className="dx-menu-item" style={item} onClick={props.onDisconnect}><IconUnlink size={15} />断开连线</button>
      {props.canUngroup ? <button className="dx-menu-item" style={item} onClick={props.onUngroup}><IconGroup size={15} />解散分组</button> : null}
      <button className="dx-menu-item" style={{ ...item, color: '#ffb4ab' }} onClick={props.onDelete}><IconTrash size={15} />删除</button>
    </div>
  )
}

export function EdgeMenu(props: {
  x: number
  y: number
  onDelete: () => void
}): ReactNode {
  const pos = clampMenu(props.x, props.y, 160, 56, viewSize())
  return (
    <div style={{ ...menu, left: pos.left, top: pos.top, minWidth: 140 }} onMouseDown={event => event.stopPropagation()}>
      <button className="dx-menu-item" style={{ ...item, color: '#ffb4ab' }} onClick={props.onDelete}><IconTrash size={15} />删除连线</button>
    </div>
  )
}

export function ZoomHud(props: {
  zoom: number
  canUndo: boolean
  canRedo: boolean
  snap?: boolean
  hideWires?: boolean
  onUndo: () => void
  onRedo: () => void
  onZoom: (next: number) => void
  onFit: () => void
  onSnap?: () => void
  onHideWires?: () => void
}): ReactNode {
  const percent = Math.round(props.zoom * 100)
  return (
    <div style={{
      ...dxChrome,
      position: 'absolute',
      left: 16,
      bottom: 16,
      zIndex: 22,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '6px 8px 6px 6px',
      borderRadius: 999,
      fontSize: 12,
    }}>
      <button className="dx-hit" disabled={!props.canUndo} style={{ ...dxGhostBtn, width: 28, height: 28, opacity: props.canUndo ? 1 : .35 }} onClick={props.onUndo} title="撤销 ⌘Z" data-tip="撤销 ⌘Z">
        <IconUndo size={14} />
      </button>
      <button className="dx-hit" disabled={!props.canRedo} style={{ ...dxGhostBtn, width: 28, height: 28, opacity: props.canRedo ? 1 : .35 }} onClick={props.onRedo} title="重做 ⇧⌘Z" data-tip="重做 ⇧⌘Z">
        <IconRedo size={14} />
      </button>
      <button className="dx-hit" style={{ ...dxGhostBtn, width: 28, height: 28 }} onClick={() => props.onZoom(Math.max(0.1, props.zoom / 1.15))} title="缩小" data-tip="缩小">
        <IconMinus size={14} />
      </button>
      <input
        type="range"
        min={10}
        max={300}
        value={percent}
        onChange={event => props.onZoom(Number(event.target.value) / 100)}
        className="dx-range"
        style={{ width: 84 }}
      />
      <button className="dx-hit" style={{ ...dxGhostBtn, width: 28, height: 28 }} onClick={() => props.onZoom(Math.min(3, props.zoom * 1.15))} title="放大" data-tip="放大">
        <IconPlus size={14} />
      </button>
      <span style={{ minWidth: 38, textAlign: 'center', color: dx.mute, fontVariantNumeric: 'tabular-nums', fontSize: 11 }}>{percent}%</span>
      <button className="dx-hit" style={{ ...dxGhostBtn, width: 28, height: 28 }} onClick={props.onFit} title="适配画布" data-tip="适配画布">
        <IconFit size={14} />
      </button>
      {props.onSnap !== undefined ? (
        <button className="dx-hit" style={{ ...dxGhostBtn, width: 28, height: 28, background: props.snap === true ? 'rgba(255,255,255,.12)' : 'transparent' }} onClick={props.onSnap} title="网格吸附" data-tip="网格吸附">
          <IconGrid size={13} />
        </button>
      ) : null}
      {props.onHideWires !== undefined ? (
        <button className="dx-hit" style={{ ...dxGhostBtn, width: 28, height: 28, background: props.hideWires === true ? 'rgba(255,255,255,.12)' : 'transparent' }} onClick={props.onHideWires} title="隐藏连线" data-tip="隐藏连线">
          <IconUnlink size={13} />
        </button>
      ) : null}
    </div>
  )
}

export function EmptyHero(props: { onGenerate: () => void }): ReactNode {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none', zIndex: 5 }}>
      <div style={{ textAlign: 'center', fontFamily: dx.font, maxWidth: 420 }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 16,
          margin: '0 auto 18px',
          display: 'grid',
          placeItems: 'center',
          background: 'rgba(255,255,255,.06)',
          border: `1px solid ${dx.hairline}`,
          color: '#fff',
        }}>
          <IconSpark size={22} />
        </div>
        <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: -0.7, color: dx.ink }}>今天拍什么？</div>
        <div style={{ marginTop: 10, color: dx.mute, fontSize: 13, lineHeight: 1.7 }}>
          双击节点居中 · 双击空白处添加 · 从端口拖线
        </div>
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 8, color: dx.dim, fontSize: 11 }}>
          <span style={kbd}>G</span><span>生成</span>
          <span style={kbd}>⌘K</span><span>搜索节点</span>
          <span style={kbd}>⌘J</span><span>DSH</span>
          <span style={kbd}>Space</span><span>平移</span>
        </div>
        <div style={{ marginTop: 22, pointerEvents: 'auto' }}>
          <button
            className="dx-cta"
            onClick={props.onGenerate}
            style={{
              ...dxPill,
              width: 'auto',
              height: 42,
              padding: '0 18px',
              fontSize: 13,
              fontWeight: 600,
              gap: 8,
            }}
          >
            <IconSpark size={15} />
            交给 DSH 开拍
          </button>
        </div>
      </div>
    </div>
  )
}

export function SearchPalette(props: {
  query: string
  filter: string
  hits: Array<{ id: string; kind: string; label: string }>
  onQuery: (value: string) => void
  onFilter: (value: string) => void
  onPick: (id: string) => void
  onClose: () => void
}): ReactNode {
  const filters = [
    { id: '', label: '全部' },
    { id: 'image', label: '图片' },
    { id: 'video', label: '视频' },
    { id: 'text', label: '文本' },
    { id: 'group', label: '分组' },
  ]
  return (
    <div className="dx-scrim" style={{ position: 'absolute', inset: 0, zIndex: 35, display: 'grid', justifyItems: 'center', alignItems: 'start', paddingTop: 88 }} onMouseDown={props.onClose}>
      <div
        style={{ ...dxChrome, width: 'min(440px, calc(100% - 32px))', padding: 8, borderRadius: 18 }}
        onMouseDown={event => event.stopPropagation()}
      >
        <div style={{ display: 'flex', gap: 4, padding: '4px 8px 8px' }}>
          {filters.map(item => (
            <button
              key={item.id}
              className="dx-hit"
              onClick={() => props.onFilter(item.id)}
              style={{
                ...dxGhostBtn, width: 'auto', height: 24, padding: '0 8px', fontSize: 11,
                background: props.filter === item.id ? 'rgba(255,255,255,.12)' : 'transparent',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px 10px' }}>
          <span style={{ color: dx.mute, display: 'flex' }}><IconSearch size={16} /></span>
          <input
            autoFocus
            value={props.query}
            placeholder="搜索节点（⌘K）"
            onChange={event => props.onQuery(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Escape') props.onClose()
              if (event.key === 'Enter' && props.hits[0] !== undefined) props.onPick(props.hits[0].id)
            }}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: dx.ink,
              fontSize: 14,
              fontFamily: dx.font,
            }}
          />
          <span style={kbd}>esc</span>
        </div>
        <div style={{ maxHeight: 320, overflow: 'auto', paddingBottom: 4 }}>
          {props.hits.length === 0 ? <div style={{ padding: '14px 10px', fontSize: 12, color: dx.mute }}>没有匹配的节点</div> : null}
          {props.hits.map((hit, index) => (
            <button key={hit.id} className="dx-menu-item" style={item} onClick={() => props.onPick(hit.id)}>
              <span style={{ opacity: .65, display: 'flex' }}><KindGlyph kind={hit.kind} size={14} /></span>
              <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}>{hit.label || hit.id}</span>
              {index === 0 ? <span style={{ ...kbd, opacity: .7 }}>↵</span> : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function CompareOverlay(props: {
  left: { id: string; label: string; path: string; kind: string }
  right: { id: string; label: string; path: string; kind: string }
  onAdopt: (id: string) => void
  onClose: () => void
}): ReactNode {
  const pane = (side: { id: string; label: string; path: string; kind: string }): ReactNode => (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 12, color: dx.mute, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{side.label}</div>
      <div style={{ flex: 1, minHeight: 220, background: '#080808', borderRadius: 14, overflow: 'hidden', border: `1px solid ${dx.hairline}` }}>
        {side.kind === 'video'
          ? <video src={side.path} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          : <img src={side.path} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
      </div>
      <button className="dx-cta" style={{ ...dxPill, width: '100%', height: 36, fontSize: 12, fontWeight: 600 }} onClick={() => props.onAdopt(side.id)}>
        采用此条
      </button>
    </div>
  )
  return (
    <div className="dx-scrim" style={{ position: 'absolute', inset: 0, zIndex: 36, display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ ...dxChrome, width: 'min(980px, 100%)', height: 'min(660px, 100%)', padding: 18, borderRadius: 20, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <strong style={{ fontSize: 14, letterSpacing: -0.2 }}>变体对比</strong>
          <button className="dx-hit" style={{ ...dxGhostBtn, width: 32, height: 32 }} onClick={props.onClose}><IconClose size={14} /></button>
        </div>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 14 }}>
          {pane(props.left)}
          {pane(props.right)}
        </div>
      </div>
    </div>
  )
}

export function GenerateDock(props: {
  spec: import('./workstation.ts').GenerateSpec
  busy: boolean
  sourceLabel?: string
  shift?: boolean
  reserveRight?: number
  onChange: (spec: import('./workstation.ts').GenerateSpec) => void
  onSubmit: () => void
  onClose: () => void
  onClearSource?: () => void
  inputRef?: { current: HTMLTextAreaElement | null }
}): ReactNode {
  const right = props.reserveRight ?? (props.shift === true ? 428 : 24)
  return (
    <div style={{
      position: 'absolute',
      left: 72,
      right,
      bottom: 16,
      zIndex: 28,
      display: 'flex',
      justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      <div style={{ width: 'min(520px, 100%)', minWidth: 0, pointerEvents: 'auto' }}>
        <NodeWorkstation
          spec={props.spec}
          busy={props.busy}
          sourceLabel={props.sourceLabel}
          onChange={props.onChange}
          onSubmit={props.onSubmit}
          onClearSource={props.onClearSource}
          inputRef={props.inputRef}
        />
      </div>
    </div>
  )
}

export function MultiSelectBar(props: {
  count: number
  canCompare: boolean
  canUngroup: boolean
  locked: boolean
  onCompare: () => void
  onGroup: () => void
  onUngroup: () => void
  onAlign: (kind: AlignKind) => void
  onDistribute: (axis: 'x' | 'y') => void
  onLock: () => void
  onGenerate: () => void
  onDelete: () => void
}): ReactNode {
  const [align, setAlign] = useState(false)
  return (
    <div style={{
      ...dxChrome,
      position: 'absolute',
      left: '50%',
      bottom: 92,
      transform: 'translateX(-50%)',
      zIndex: 27,
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      padding: 6,
      borderRadius: 999,
    }}>
      <span style={{ padding: '0 10px', fontSize: 12, color: dx.mute, fontWeight: 500 }}>已选 {props.count}</span>
      {props.canCompare ? (
        <button className="dx-hit" style={{ ...dxGhostBtn, width: 'auto', height: 32, padding: '0 10px', gap: 6, fontSize: 12 }} onClick={props.onCompare}>
          <IconCompare size={14} />对比
        </button>
      ) : null}
      <button className="dx-hit" style={{ ...dxGhostBtn, width: 'auto', height: 32, padding: '0 10px', gap: 6, fontSize: 12 }} onClick={props.onGroup}>
        <IconGroup size={14} />编组
      </button>
      {props.canUngroup ? (
        <button className="dx-hit" style={{ ...dxGhostBtn, width: 'auto', height: 32, padding: '0 10px', gap: 6, fontSize: 12 }} onClick={props.onUngroup}>
          <IconGroup size={14} />解组
        </button>
      ) : null}
      <div style={{ position: 'relative' }}>
        <button className="dx-hit" style={{ ...dxGhostBtn, width: 'auto', height: 32, padding: '0 10px', gap: 6, fontSize: 12 }} onClick={() => setAlign(open => !open)}>
          <IconAlign size={14} />对齐
        </button>
        {align ? (
          <div style={{ ...menu, left: 0, bottom: 40, top: 'auto', minWidth: 168 }} onMouseDown={event => event.stopPropagation()}>
            {([
              ['left', '左对齐'],
              ['center', '水平居中'],
              ['right', '右对齐'],
              ['top', '顶对齐'],
              ['middle', '垂直居中'],
              ['bottom', '底对齐'],
            ] as const).map(([kind, label]) => (
              <button key={kind} className="dx-menu-item" style={item} onClick={() => { props.onAlign(kind); setAlign(false) }}>{label}</button>
            ))}
            {props.count >= 3 ? (
              <>
                <button className="dx-menu-item" style={item} onClick={() => { props.onDistribute('x'); setAlign(false) }}>水平分布</button>
                <button className="dx-menu-item" style={item} onClick={() => { props.onDistribute('y'); setAlign(false) }}>垂直分布</button>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
      <button className="dx-hit" style={{ ...dxGhostBtn, width: 'auto', height: 32, padding: '0 10px', gap: 6, fontSize: 12 }} onClick={props.onLock}>
        {props.locked ? <IconUnlock size={14} /> : <IconLock size={14} />}
        {props.locked ? '解锁' : '锁定'}
      </button>
      <button className="dx-hit" style={{ ...dxGhostBtn, width: 'auto', height: 32, padding: '0 10px', gap: 6, fontSize: 12 }} onClick={props.onGenerate}>
        <IconSpark size={14} />生成
      </button>
      <button className="dx-hit" style={{ ...dxGhostBtn, width: 'auto', height: 32, padding: '0 10px', gap: 6, fontSize: 12, color: '#ffb4ab' }} onClick={props.onDelete}>
        <IconTrash size={14} />删除
      </button>
    </div>
  )
}

export function InspectorSheet(props: {
  kindLabel: string
  kind: string
  label: string
  prompt: string
  path?: string
  status?: string
  canEdit: boolean
  canCompare: boolean
  canDownload: boolean
  locked: boolean
  onLabel: (value: string) => void
  onPrompt: (value: string) => void
  onStatus: (status: ShotStatus) => void
  onEdit: () => void
  onGenerate: () => void
  onCompare: () => void
  onLock: () => void
  onDownload: () => void
  onDelete: () => void
}): ReactNode {
  const status = asShotStatus(props.status) ?? 'idea'
  return (
    <div style={{
      ...dxChrome,
      position: 'absolute',
      top: 72,
      right: 14,
      width: 276,
      maxWidth: 'calc(100% - 24px)',
      maxHeight: 'calc(100% - 168px)',
      overflow: 'auto',
      zIndex: 22,
      padding: 14,
      borderRadius: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: dx.mute, fontSize: 11, letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 10 }}>
        <KindGlyph kind={props.kind} size={13} />
        {props.kindLabel}
      </div>
      <input
        value={props.label}
        onChange={event => props.onLabel(event.target.value)}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          border: 'none',
          outline: 'none',
          background: 'transparent',
          color: dx.ink,
          fontSize: 16,
          fontWeight: 600,
          letterSpacing: -0.3,
          fontFamily: dx.font,
          padding: 0,
          marginBottom: 12,
        }}
      />
      <div style={{ fontSize: 11, color: dx.mute, marginBottom: 6 }}>提示词</div>
      <textarea
        value={props.prompt}
        placeholder="镜头意图，不是成稿。DSH 会先检索再写提示词"
        onChange={event => props.onPrompt(event.target.value)}
        style={{
          width: '100%',
          minHeight: 88,
          boxSizing: 'border-box',
          resize: 'vertical',
          borderRadius: 12,
          border: `1px solid ${dx.hairline}`,
          background: 'rgba(255,255,255,.04)',
          color: dx.ink,
          padding: 10,
          fontSize: 12,
          lineHeight: 1.55,
          fontFamily: dx.font,
          outline: 'none',
        }}
      />
      <div style={{ fontSize: 11, color: dx.mute, margin: '12px 0 6px' }}>镜头状态</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {SHOT_STATUSES.map(item => (
          <button
            key={item}
            className="dx-hit"
            onClick={() => props.onStatus(item)}
            style={{
              padding: '3px 8px',
              borderRadius: 999,
              border: `1px solid ${item === status ? SHOT_STATUS_COLOR[item] : dx.hairline}`,
              background: item === status ? 'rgba(255,255,255,.06)' : 'transparent',
              color: item === status ? SHOT_STATUS_COLOR[item] : dx.mute,
              fontSize: 11,
              cursor: 'pointer',
              fontFamily: dx.font,
            }}
          >
            {SHOT_STATUS_LABEL[item]}
          </button>
        ))}
      </div>
      {props.path !== undefined && props.path !== '' ? (
        <div style={{ marginTop: 12, fontSize: 10, color: dx.dim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={props.path}>
          {props.path}
        </div>
      ) : null}
      <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
        <button className="dx-cta" style={{ ...dxPill, flex: 1, minWidth: 88, height: 34, fontSize: 12, fontWeight: 600, gap: 6 }} onClick={props.onGenerate}>
          <IconSpark size={13} />生成
        </button>
        {props.canEdit ? (
          <button className="dx-hit" style={{ ...dxGhostBtn, width: 34, height: 34, border: `1px solid ${dx.hairline}` }} onClick={props.onEdit} title="打开编辑器">
            <IconEdit size={14} />
          </button>
        ) : null}
        {props.canDownload ? (
          <button className="dx-hit" style={{ ...dxGhostBtn, width: 34, height: 34, border: `1px solid ${dx.hairline}` }} onClick={props.onDownload} title="下载媒体">
            <IconDownload size={14} />
          </button>
        ) : null}
        {props.canCompare ? (
          <button className="dx-hit" style={{ ...dxGhostBtn, width: 34, height: 34, border: `1px solid ${dx.hairline}` }} onClick={props.onCompare} title="对比所选变体">
            <IconCompare size={14} />
          </button>
        ) : null}
        <button className="dx-hit" style={{ ...dxGhostBtn, width: 34, height: 34, border: `1px solid ${dx.hairline}` }} onClick={props.onLock} title={props.locked ? '解锁' : '锁定'}>
          {props.locked ? <IconUnlock size={14} /> : <IconLock size={14} />}
        </button>
        <button className="dx-hit" style={{ ...dxGhostBtn, width: 34, height: 34, border: `1px solid ${dx.hairline}`, color: '#ffb4ab' }} onClick={props.onDelete} title="删除节点">
          <IconTrash size={14} />
        </button>
      </div>
    </div>
  )
}

export function AssetDrawer(props: {
  tab: string
  query: string
  files: Array<{ path: string; name: string; mediaType: string; at?: number }>
  characters: Array<{ name: string; description: string; refPath: string; outfit?: string; props?: string }>
  canPin?: boolean
  onTab: (tab: string) => void
  onQuery: (value: string) => void
  onPick: (file: { path: string; name: string; mediaType: string }) => void
  onPickCharacter: (name: string, refPath: string) => void
  onUseAsRef?: (file: { path: string; name: string; mediaType: string }) => void
  onPin?: (role: 'character' | 'scene' | 'prop') => void
  onClose: () => void
}): ReactNode {
  const tabs = [
    { id: 'media', label: '媒体' },
    { id: 'character', label: '角色' },
    { id: 'scene', label: '场景' },
    { id: 'prop', label: '道具' },
    { id: 'style', label: '风格' },
    { id: 'history', label: '历史' },
  ]
  const q = props.query.trim().toLowerCase()
  const match = (blob: string) => q === '' || blob.toLowerCase().includes(q)
  const media = (props.tab === 'history'
    ? [...props.files].sort((a, b) => (b.at ?? 0) - (a.at ?? 0))
    : props.tab === 'scene'
      ? props.files.filter(file => /场景|scene|set|bg|background|环境|空镜/i.test(`${file.name} ${file.path}`))
      : props.tab === 'style'
        ? props.files.filter(file => /风格|style|look|palette|lut|调色|光影/i.test(`${file.name} ${file.path}`))
        : props.files
  ).filter(file => match(`${file.name} ${file.path}`))
  const characters = props.characters.filter(card => {
    if (!match(`${card.name} ${card.description ?? ''} ${card.props ?? ''}`)) return false
    if (props.tab === 'prop') return card.props !== undefined && card.props !== ''
    if (props.tab === 'scene') return /场景|scene|set|环境|空镜/i.test(`${card.description ?? ''} ${card.outfit ?? ''}`)
    if (props.tab === 'style') return /风格|style|look|palette|光影|调色/i.test(`${card.description ?? ''} ${card.outfit ?? ''}`)
    return true
  })
  const showChars = props.tab === 'character' || props.tab === 'prop' || props.tab === 'scene' || props.tab === 'style'
  const showMedia = props.tab === 'media' || props.tab === 'history' || props.tab === 'scene' || props.tab === 'style'
  const empty = (showChars ? characters.length : 0) + (showMedia ? media.length : 0) === 0
    ? (props.tab === 'scene' ? '没有匹配的场景资产' : props.tab === 'prop' ? '还没有道具锚点' : props.tab === 'character' ? '还没有角色锚点' : props.tab === 'style' ? '还没有风格资产' : '输出目录还没有媒体')
    : undefined
  return (
    <div style={{
      ...dxChrome,
      position: 'absolute',
      top: 72,
      left: 68,
      width: 360,
      maxHeight: 'calc(100% - 120px)',
      overflow: 'auto',
      zIndex: 26,
      padding: 12,
      borderRadius: 18,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <strong style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}><IconFolder size={14} />资源库</strong>
        <button className="dx-hit" style={{ ...dxGhostBtn, width: 28, height: 28 }} onClick={props.onClose}><IconClose size={13} /></button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className="dx-hit"
            onClick={() => props.onTab(tab.id)}
            style={{
              ...dxGhostBtn, width: 'auto', height: 24, padding: '0 8px', fontSize: 11,
              background: props.tab === tab.id ? 'rgba(255,255,255,.12)' : 'transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <input
        value={props.query}
        placeholder="搜索资源"
        onChange={event => props.onQuery(event.target.value)}
        style={{
          width: '100%', boxSizing: 'border-box', marginBottom: 10, height: 30, padding: '0 10px',
          borderRadius: 10, border: `1px solid ${dx.hairline}`, background: 'rgba(255,255,255,.04)',
          color: dx.ink, fontSize: 12, fontFamily: dx.font, outline: 'none',
        }}
      />
      {props.canPin === true && props.onPin !== undefined ? (
        <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
          {([
            ['character', '登记为角色'],
            ['scene', '登记为场景'],
            ['prop', '登记为道具'],
          ] as const).map(([role, label]) => (
            <button key={role} className="dx-hit" style={{ ...dxGhostBtn, width: 'auto', height: 24, padding: '0 8px', fontSize: 10 }} onClick={() => props.onPin?.(role)}>
              {label}
            </button>
          ))}
        </div>
      ) : null}
      {empty !== undefined ? <div style={{ fontSize: 12, color: dx.mute, padding: '12px 4px' }}>{empty}</div> : null}
      {showChars && characters.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: showMedia ? 10 : 0 }}>
          {characters.map(card => (
            <button
              key={card.name}
              className="dx-hit"
              onClick={() => props.onPickCharacter(card.name, card.refPath)}
              style={{
                padding: 0, border: `1px solid ${dx.hairline}`, borderRadius: 12, overflow: 'hidden',
                background: 'rgba(255,255,255,.03)', color: dx.ink, textAlign: 'left', cursor: 'pointer',
              }}
            >
              <div style={{ height: 88, background: '#111', overflow: 'hidden' }}>
                {card.refPath !== ''
                  ? <img src={mediaUrl(card.refPath)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  : <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: dx.mute }}><KindGlyph kind="image" size={16} /></div>}
              </div>
              <div style={{ padding: '6px 8px 8px' }}>
                <div style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.name}</div>
                {card.description !== '' ? <div style={{ fontSize: 10, color: dx.mute, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.description}</div> : null}
              </div>
            </button>
          ))}
        </div>
      ) : null}
      {showMedia && media.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {media.map(file => (
            <button
              key={file.path}
              className="dx-hit"
              onClick={() => props.onPick(file)}
              title={file.name}
              style={{
                padding: 0, border: `1px solid ${dx.hairline}`, borderRadius: 12, overflow: 'hidden',
                background: 'rgba(255,255,255,.03)', color: dx.ink, textAlign: 'left', cursor: 'pointer',
              }}
            >
              <div style={{ height: 88, background: '#111', overflow: 'hidden', position: 'relative' }}>
                {file.mediaType.startsWith('video/')
                  ? <video src={mediaUrl(file.path)} muted preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  : <img src={mediaUrl(file.path)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
                <span style={{ position: 'absolute', top: 6, left: 6, width: 18, height: 18, borderRadius: 6, display: 'grid', placeItems: 'center', background: 'rgba(10,10,10,.55)' }}>
                  <KindGlyph kind={file.mediaType.startsWith('video/') ? 'video' : 'image'} size={10} />
                </span>
              </div>
              <div style={{ padding: '6px 8px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{file.name}</span>
                {props.onUseAsRef !== undefined ? (
                  <span
                    role="button"
                    title="当作参考"
                    onClick={event => { event.stopPropagation(); props.onUseAsRef?.(file) }}
                    style={{ flexShrink: 0, fontSize: 10, color: dx.mute, padding: '1px 5px', borderRadius: 6, border: `1px solid ${dx.hairline}` }}
                  >
                    参考
                  </span>
                ) : null}
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function Toast(props: { text?: string }): ReactNode {
  if (props.text === undefined || props.text === '') return null
  return (
    <div style={{
      ...dxChrome,
      position: 'absolute',
      top: 72,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 38,
      padding: '8px 14px',
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 500,
      pointerEvents: 'none',
    }}>
      {props.text}
    </div>
  )
}

const SHORTCUTS: Array<{ keys: string; label: string }> = [
  { keys: '⌘Z / ⇧⌘Z', label: '撤销 / 重做' },
  { keys: '⌘C / ⌘V', label: '复制 / 粘贴节点或媒体' },
  { keys: '⌘D', label: '复制所选' },
  { keys: '⌘A', label: '全选' },
  { keys: '⌫', label: '删除所选' },
  { keys: '↑↓←→', label: '微移 · ⇧ 加大' },
  { keys: 'G', label: '打开生成栏' },
  { keys: 'S', label: '循环镜头状态' },
  { keys: 'F', label: '适配所选' },
  { keys: '双击节点', label: '居中并缩放到合适位置' },
  { keys: 'L', label: '锁定 / 解锁' },
  { keys: '⌘K / ⌘F', label: '搜索节点' },
  { keys: '⌘J', label: 'DSH 会话' },
  { keys: 'Space', label: '平移画布' },
  { keys: '?', label: '快捷键' },
]

export function ShortcutsSheet(props: { onClose: () => void }): ReactNode {
  return (
    <div className="dx-scrim" style={{ position: 'absolute', inset: 0, zIndex: 37, display: 'grid', placeItems: 'center', padding: 24 }} onMouseDown={props.onClose}>
      <div
        style={{ ...dxChrome, width: 'min(420px, 100%)', padding: 16, borderRadius: 20 }}
        onMouseDown={event => event.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <strong style={{ fontSize: 14 }}>快捷键</strong>
          <button className="dx-hit" style={{ ...dxGhostBtn, width: 28, height: 28 }} onClick={props.onClose}><IconClose size={13} /></button>
        </div>
        <div style={{ display: 'grid', gap: 6 }}>
          {SHORTCUTS.map(row => (
            <div key={row.keys} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
              <span style={{ ...kbd, minWidth: 92, justifyContent: 'flex-start' }}>{row.keys}</span>
              <span style={{ color: dx.mute }}>{row.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
