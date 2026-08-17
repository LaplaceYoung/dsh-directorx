import { memo, useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { Handle, NodeResizer, Position, useStore, type NodeProps } from '@xyflow/react'
import { dx, dxPill } from '../canvas-theme.ts'
import { SHOT_STATUS_COLOR, SHOT_STATUS_LABEL, asShotStatus } from './document.ts'
import { IconCopy, IconDownload, IconEdit, IconImage, IconLock, IconPlay, IconPlus, IconSpark, IconText, IconTrash, IconUnlock, IconUpload, IconVideo, KindGlyph } from './icons.tsx'
import { MarkdownView } from './MarkdownView.tsx'
import { NodeWorkstation } from './NodeWorkstation.tsx'
import { incomingRefIds, takePeers, type GenerateSpec } from './workstation.ts'
import { withProject } from './project.ts'
import { displayCardTitle } from './card-label.ts'

export type StageKind = 'image' | 'video' | 'text' | 'group'

export function mediaUrl(path: string): string {
  return /^https?:\/\//i.test(path) ? path : withProject(`/directorx/media?path=${encodeURIComponent(path)}`)
}

const card: CSSProperties = {
  width: '100%',
  height: '100%',
  borderRadius: dx.radiusCard,
  overflow: 'hidden',
  background: 'rgba(14,14,14,.96)',
  border: `1px solid ${dx.hairline}`,
  color: dx.ink,
  fontFamily: dx.font,
  boxShadow: '0 16px 40px rgba(0,0,0,.42), inset 0 1px 0 rgba(255,255,255,.05)',
}

const handleBox: CSSProperties = {
  position: 'absolute',
  width: 22,
  height: 22,
  background: 'transparent',
  border: 'none',
  zIndex: 6,
}
const handleLeft: CSSProperties = { ...handleBox, left: -20, right: 'auto', top: '50%', transform: 'translateY(-50%)' }
const handleRight: CSSProperties = { ...handleBox, right: -20, left: 'auto', top: '50%', transform: 'translateY(-50%)' }
const handleTop: CSSProperties = { ...handleBox, top: -18, bottom: 'auto', left: '50%', transform: 'translateX(-50%)' }
const handleBottom: CSSProperties = { ...handleBox, bottom: -18, top: 'auto', left: '50%', transform: 'translateX(-50%)' }

function Ports(): ReactNode {
  return (
    <>
      <Handle id="in" type="target" position={Position.Left} className="dx-port" isConnectable style={handleLeft}>
        <span className="dx-port-plus"><IconPlus size={13} /></span>
      </Handle>
      <Handle id="top" type="source" position={Position.Top} className="dx-port" isConnectable style={handleTop}>
        <span className="dx-port-dot" />
      </Handle>
      <Handle id="bottom" type="source" position={Position.Bottom} className="dx-port" isConnectable style={handleBottom}>
        <span className="dx-port-dot" />
      </Handle>
      <Handle id="out" type="source" position={Position.Right} className="dx-port dx-port-source" isConnectable style={handleRight}>
        <span className="dx-port-plus"><IconPlus size={13} /></span>
      </Handle>
    </>
  )
}

export type CardActions = {
  onGenerate?: (id: string) => void
  onPatch?: (id: string, patch: Record<string, unknown>) => void
  onAdoptTake?: (id: string) => void
  onFocusTake?: (id: string) => void
  onEdit?: (id: string) => void
  onRename?: (id: string, label: string) => void
  onCycleStatus?: (id: string) => void
  onDuplicate?: (id: string) => void
  onLock?: (id: string) => void
  onDownload?: (id: string) => void
  onDelete?: (id: string) => void
  onUpload?: (id: string) => void
  onPickRef?: (id: string) => void
}

function ToolBtn(props: { title: string; onClick: () => void; children: ReactNode }): ReactNode {
  return (
    <button
      className="nodrag nopan dx-hit"
      title={props.title}
      data-tip={props.title}
      onClick={event => { event.stopPropagation(); props.onClick() }}
      style={{
        width: 30,
        height: 30,
        border: 'none',
        borderRadius: 9,
        background: 'transparent',
        color: '#f2f2f2',
        cursor: 'pointer',
        display: 'grid',
        placeItems: 'center',
        padding: 0,
      }}
    >
      {props.children}
    </button>
  )
}

function NodeFrame(props: {
  selected?: boolean
  generating?: boolean
  failed?: boolean
  kind?: string
  filled?: boolean
  title?: ReactNode
  dock?: ReactNode
  children: ReactNode
  toolbar: ReactNode
}): ReactNode {
  const [hot, setHot] = useState(false)
  const active = props.selected === true || hot
  const faceClass = [
    'dx-card-face',
    props.kind !== undefined ? `dx-kind-${props.kind}` : '',
    props.generating === true ? 'dx-face-live' : '',
    props.filled === true ? 'dx-face-fill' : '',
  ].filter(part => part !== '').join(' ')
  return (
    <div
      className={props.generating === true ? 'dx-generating' : undefined}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      style={{ width: '100%', height: '100%', overflow: 'visible' }}
    >
      <Ports />
      <div
        className="nodrag nopan dx-node-toolbar"
        style={{
          position: 'absolute',
          left: '50%',
          top: -40,
          transform: 'translateX(-50%)',
          zIndex: 7,
          opacity: active ? 1 : 0,
          pointerEvents: active ? 'auto' : 'none',
        }}
      >
        {props.toolbar}
      </div>
      <div
        className={faceClass}
        style={{
          ...card,
          boxShadow: props.selected === true ? dx.glow : card.boxShadow,
          borderColor: props.failed === true ? 'rgba(255,155,143,.7)' : props.generating === true ? 'rgba(240,195,106,.62)' : props.selected === true ? 'rgba(255,255,255,.55)' : dx.hairline,
        }}
      >
        {props.children}
      </div>
      {props.title !== undefined ? (
        <div className="nodrag nopan dx-card-caption" style={{ position: 'absolute', left: 0, right: 0, top: '100%', marginTop: 6, zIndex: 5 }}>
          {props.title}
        </div>
      ) : null}
      {props.dock !== undefined && props.selected === true ? (
        <div className="nodrag nopan" style={{ position: 'absolute', left: 0, right: 0, top: '100%', marginTop: props.title !== undefined ? 34 : 8, zIndex: 8 }}>
          {props.dock}
        </div>
      ) : null}
    </div>
  )
}

function useNearViewport(): [RefObject<HTMLDivElement>, boolean] {
  const ref = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (el === null) return
    const observer = new IntersectionObserver(([entry]) => {
      setNear(entry?.isIntersecting === true)
    }, { rootMargin: '120px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, near]
}

function VideoPreview(props: { src: string; active?: boolean }): ReactNode {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    if (props.active === true) return
    videoRef.current?.pause()
    setPlaying(false)
  }, [props.active])
  return (
    <div
      className="nodrag nopan"
      onClick={event => {
        event.stopPropagation()
        const video = videoRef.current
        if (video === null) return
        if (video.paused) {
          void video.play()
          setPlaying(true)
        } else {
          video.pause()
          setPlaying(false)
        }
      }}
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, cursor: 'pointer' }}
    >
      <video
        ref={videoRef}
        src={props.src}
        muted
        loop
        playsInline
        preload="metadata"
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      {playing ? null : (
        <span style={{
          position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
          background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,.35))',
          pointerEvents: 'none',
        }}>
          <span style={{
            width: 36, height: 36, borderRadius: 99, display: 'grid', placeItems: 'center',
            background: 'rgba(243,243,243,.92)', color: '#141414',
            boxShadow: '0 8px 20px rgba(0,0,0,.35)',
          }}>
            <IconPlay size={15} />
          </span>
        </span>
      )}
    </div>
  )
}

function GeneratingHud(props: { kind: 'image' | 'video'; prompt?: string }): ReactNode {
  const video = props.kind === 'video'
  const line = (props.prompt ?? '').trim()
  return (
    <div className="dx-gen-overlay" aria-live="polite">
      <span className="dx-gen-scan" />
      <div className="dx-gen-core">
        <span className="dx-gen-ring" />
        {video ? <span className="dx-gen-bars"><i /><i /><i /><i /></span> : null}
        <div className="dx-gen-copy">{video ? '正在出片' : '正在出图'}</div>
        {line !== '' ? <div className="dx-gen-prompt">{line.length > 52 ? `${line.slice(0, 52)}…` : line}</div> : null}
      </div>
    </div>
  )
}

function EmptyPlate(props: { kind: 'image' | 'video' }): ReactNode {
  return (
    <div className="dx-empty-plate">
      <span className="dx-empty-glyph">{props.kind === 'video' ? <IconVideo size={18} /> : <IconImage size={18} />}</span>
    </div>
  )
}

export const MediaCard = memo(function MediaCard(props: NodeProps): ReactNode {
  const data = props.data as {
    kind?: string; label?: string; path?: string; shotStatus?: string; locked?: boolean
    prompt?: string; model?: string; aspect?: string; count?: number; durationSec?: number; lastError?: string
    characters?: string[]; shotIndex?: number
  } & CardActions
  const empty = data.path === undefined || data.path === ''
  const [shellRef, near] = useNearViewport()
  const src = empty ? '' : mediaUrl(data.path ?? '')
  const graph = useStore(state => ({
    nodes: state.nodes.map(node => ({
      id: node.id,
      parentId: node.parentId,
      type: node.type,
      prompt: typeof node.data.prompt === 'string' ? node.data.prompt : undefined,
      path: typeof node.data.path === 'string' ? node.data.path : '',
      label: typeof node.data.label === 'string' ? node.data.label : node.id,
    })),
    edges: state.edges.map(edge => ({ source: edge.source, target: edge.target })),
  }))
  const refs = incomingRefIds(props.id, graph.edges)
  const peerIds = takePeers(
    { id: props.id, parentId: graph.nodes.find(node => node.id === props.id)?.parentId, prompt: data.prompt },
    graph.nodes,
    graph.edges,
  )
  const peers = [props.id, ...peerIds].map(id => graph.nodes.find(node => node.id === id)).filter((node): node is typeof graph.nodes[number] => node !== undefined)
  const promptKey = (data.prompt ?? '').trim()
  const takes = peers.filter(peer => peer.path !== '' && (peer.prompt ?? '').trim() === promptKey && promptKey !== '')
  const kind = data.kind === 'video' ? 'video' as const : 'image' as const
  const generating = data.shotStatus === 'generating'
  const filled = !empty && !generating
  const title = displayCardTitle(data.label, data.prompt, data.shotIndex)
  const spec: GenerateSpec = {
    kind: data.kind === 'video' ? 'video' : 'image',
    prompt: data.prompt ?? '',
    ...(data.model !== undefined ? { model: data.model } : {}),
    ...(data.aspect !== undefined ? { aspect: data.aspect } : {}),
    ...(data.count !== undefined ? { count: data.count } : {}),
    ...(data.durationSec !== undefined ? { durationSec: data.durationSec } : {}),
    ...(data.characters !== undefined ? { characters: data.characters } : {}),
    ...(refs.length > 0 ? { refIds: refs } : {}),
    sourceId: props.id,
  }
  return (
    <NodeFrame
      selected={props.selected}
      generating={generating}
      failed={data.shotStatus === 'failed'}
      kind={kind}
      filled={filled}
      title={(
        <div className="dx-card-meta">
          <input
            className="dx-node-title nodrag nopan"
            value={title}
            placeholder="请输入标题"
            onChange={event => data.onRename?.(props.id, event.target.value)}
            style={{
              flex: 1, minWidth: 0, height: 22, padding: '0 2px', borderRadius: 6,
              border: '1px solid transparent', background: 'transparent',
              color: '#dedede', fontSize: 11, fontFamily: dx.font, outline: 'none',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
          />
          {data.locked === true ? <span className="dx-card-lock" title="已锁定"><IconLock size={11} /></span> : null}
          <StatusChip status={data.shotStatus} onClick={() => data.onCycleStatus?.(props.id)} />
        </div>
      )}
      dock={props.selected === true ? (
        <NodeWorkstation
          spec={spec}
          compact
          onChange={next => data.onPatch?.(props.id, {
            prompt: next.prompt,
            model: next.model,
            aspect: next.aspect,
            count: next.count,
            durationSec: next.durationSec,
            kind: next.kind,
            characters: next.characters,
          })}
          onSubmit={() => data.onGenerate?.(props.id)}
          onPickRef={data.onPickRef === undefined ? undefined : () => data.onPickRef?.(props.id)}
        />
      ) : undefined}
      toolbar={(
        <>
          <ToolBtn title={generating ? '生成中' : '生成'} onClick={() => { if (!generating) data.onGenerate?.(props.id) }}><IconSpark size={14} /></ToolBtn>
          {empty && data.onUpload !== undefined ? <ToolBtn title="上传" onClick={() => data.onUpload?.(props.id)}><IconUpload size={14} /></ToolBtn> : null}
          {empty ? null : <ToolBtn title="编辑" onClick={() => data.onEdit?.(props.id)}><IconEdit size={14} /></ToolBtn>}
          {empty ? null : <ToolBtn title="下载" onClick={() => data.onDownload?.(props.id)}><IconDownload size={14} /></ToolBtn>}
          <ToolBtn title="复制" onClick={() => data.onDuplicate?.(props.id)}><IconCopy size={14} /></ToolBtn>
          <ToolBtn title={data.locked === true ? '解锁' : '锁定'} onClick={() => data.onLock?.(props.id)}>{data.locked === true ? <IconUnlock size={14} /> : <IconLock size={14} />}</ToolBtn>
          <ToolBtn title="删除" onClick={() => data.onDelete?.(props.id)}><IconTrash size={14} /></ToolBtn>
        </>
      )}
    >
      <NodeResizer
        isVisible={props.selected === true}
        minWidth={240}
        minHeight={160}
        keepAspectRatio={data.aspect !== undefined && data.aspect !== ''}
        color="rgba(255,255,255,.45)"
        lineStyle={{ border: 'none' }}
        handleStyle={{ width: 6, height: 6, borderRadius: 1, background: '#f3f3f3', border: 'none' }}
      />
      <div
        ref={shellRef}
        className={`dx-media-well${kind === 'video' && !filled ? ' dx-film' : ''}${filled ? ' dx-media-fill' : ''}`}
        style={{ overflow: 'hidden' }}
      >
        {empty && !generating ? (
          <EmptyPlate kind={kind} />
        ) : empty ? null : kind === 'video' ? (
          <div className="dx-media-bleed" style={{ opacity: generating ? 0.38 : 1 }}>
            {near ? (
              <VideoPreview src={src} active={props.selected === true} />
            ) : (
              <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: dx.mute }}>
                <IconVideo size={22} />
              </div>
            )}
          </div>
        ) : (
          <div className="dx-media-bleed" style={{ opacity: generating ? 0.38 : 1 }}>
            {near ? (
              <img src={src} alt="" className="dx-media-img" />
            ) : (
              <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: dx.mute }}>
                <IconImage size={22} />
              </div>
            )}
          </div>
        )}
        {generating ? <GeneratingHud kind={kind} prompt={data.prompt} /> : null}
        {filled ? null : (
          <span className="dx-kind-badge">
            <KindGlyph kind={kind} size={11} />
            {data.shotIndex !== undefined ? <span>#{String(data.shotIndex).padStart(2, '0')}</span> : null}
            {kind === 'video' && data.durationSec !== undefined ? <span>{data.durationSec}s</span> : null}
          </span>
        )}
        {data.shotStatus === 'failed' ? (
          <div className="nodrag nopan" style={{
            position: 'absolute', inset: 0, background: 'rgba(20,8,8,.62)',
            display: 'grid', placeItems: 'center', padding: 12, textAlign: 'center',
          }}>
            <div>
              <div style={{ color: '#ff9b8f', fontSize: 12, marginBottom: 8 }}>{data.lastError || '生成失败'}</div>
              <button className="dx-cta" style={{ ...dxPill, width: 'auto', height: 28, padding: '0 10px', fontSize: 11 }} onClick={() => data.onGenerate?.(props.id)}>重试</button>
            </div>
          </div>
        ) : null}
        {takes.length >= 2 ? (
          <div className="nodrag nopan dx-take-row" style={{ position: 'absolute', left: 8, right: 8, bottom: 8, display: 'flex', gap: 4 }}>
            {takes.slice(0, 6).map(peer => {
              const path = peer.path
              return (
                <button
                  key={peer.id}
                  title={peer.label}
                  onClick={event => { event.stopPropagation(); data.onFocusTake?.(peer.id) }}
                  style={{
                    width: 36, height: 24, padding: 0, borderRadius: 4, overflow: 'hidden',
                    border: peer.id === props.id ? '1px solid #fff' : `1px solid ${dx.hairline}`,
                    background: '#111',
                  }}
                >
                  {path !== '' ? <img src={mediaUrl(path)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                </button>
              )
            })}
          </div>
        ) : null}
      </div>
    </NodeFrame>
  )
})

function StatusChip(props: { status?: string; onClick: () => void }): ReactNode {
  const status = asShotStatus(props.status) ?? 'idea'
  return (
    <button
      className="nodrag nopan"
      title="循环镜头状态"
      onClick={event => { event.stopPropagation(); props.onClick() }}
      style={{
        flexShrink: 0,
        padding: '2px 8px',
        borderRadius: 999,
        border: `1px solid ${SHOT_STATUS_COLOR[status]}33`,
        background: `${SHOT_STATUS_COLOR[status]}14`,
        color: SHOT_STATUS_COLOR[status],
        fontSize: 10,
        fontWeight: 500,
        cursor: 'pointer',
        fontFamily: dx.font,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
      }}
    >
      {status === 'generating' ? <span className="dx-spin" style={{ width: 8, height: 8, borderWidth: 1.4, borderColor: 'rgba(240,195,106,.25)', borderTopColor: '#f0c36a' }} /> : null}
      {SHOT_STATUS_LABEL[status]}
    </button>
  )
}

export const TextCard = memo(function TextCard(props: NodeProps): ReactNode {
  const data = props.data as { label?: string } & CardActions
  const [editing, setEditing] = useState(false)
  const textRef = useRef<HTMLTextAreaElement | null>(null)
  const wrap = (mark: string) => {
    const area = textRef.current
    if (editing && area !== null) {
      const start = area.selectionStart
      const end = area.selectionEnd
      const value = area.value
      const next = `${value.slice(0, start)}${mark}${value.slice(start, end) || '文本'}${mark}${value.slice(end)}`
      area.value = next
      data.onRename?.(props.id, next)
      return
    }
    data.onRename?.(props.id, `${mark}${data.label || '文本'}${mark}`)
  }
  return (
    <NodeFrame
      selected={props.selected}
      kind="text"
      toolbar={(
        <>
          <ToolBtn title="粗体" onClick={() => wrap('**')}><span style={{ fontWeight: 700, fontSize: 12 }}>B</span></ToolBtn>
          <ToolBtn title="斜体" onClick={() => wrap('*')}><span style={{ fontStyle: 'italic', fontSize: 12 }}>I</span></ToolBtn>
          <ToolBtn title="标题" onClick={() => data.onRename?.(props.id, `## ${data.label || '标题'}`)}><span style={{ fontSize: 11 }}>H</span></ToolBtn>
          <ToolBtn title="列表" onClick={() => data.onRename?.(props.id, `- ${data.label || '条目'}`)}><span style={{ fontSize: 12 }}>≡</span></ToolBtn>
          <ToolBtn title="生成" onClick={() => data.onGenerate?.(props.id)}><IconSpark size={14} /></ToolBtn>
          <ToolBtn title="复制" onClick={() => data.onDuplicate?.(props.id)}><IconCopy size={14} /></ToolBtn>
          <ToolBtn title="删除" onClick={() => data.onDelete?.(props.id)}><IconTrash size={14} /></ToolBtn>
        </>
      )}
    >
      <NodeResizer
        isVisible={props.selected === true}
        minWidth={180}
        minHeight={120}
        color="rgba(255,255,255,.45)"
        lineStyle={{ border: 'none' }}
        handleStyle={{ width: 7, height: 7, borderRadius: 2, background: '#f3f3f3', border: 'none' }}
      />
      <div className="dx-text-sheet" style={{ padding: '14px 16px 16px', height: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#c8b896', fontSize: 10, letterSpacing: 0.4, marginBottom: 10, textTransform: 'uppercase' }}>
          <IconText size={11} />文本 / 剧本
        </div>
        {editing ? (
          <textarea
            ref={textRef}
            className="nodrag nopan"
            autoFocus
            defaultValue={data.label}
            onBlur={event => {
              data.onRename?.(props.id, event.target.value)
              setEditing(false)
            }}
            style={{
              width: '100%',
              height: 'calc(100% - 22px)',
              resize: 'none',
              border: 'none',
              background: 'transparent',
              color: dx.ink,
              fontSize: 13,
              lineHeight: 1.55,
              fontFamily: dx.font,
              outline: 'none',
            }}
          />
        ) : (
          <div
            style={{ fontSize: 13, lineHeight: 1.55, minHeight: 40, color: data.label ? dx.ink : dx.dim }}
            onDoubleClick={() => setEditing(true)}
          >
            {data.label ? <MarkdownView text={data.label} /> : '双击开始编辑...'}
          </div>
        )}
      </div>
    </NodeFrame>
  )
})

export const GroupCard = memo(function GroupCard(props: NodeProps): ReactNode {
  const data = props.data as { label?: string } & CardActions
  const [editing, setEditing] = useState(false)
  const childCount = useStore(state => state.nodes.filter(node => node.parentId === props.id).length)
  return (
    <div style={{ width: '100%', height: '100%', overflow: 'visible' }}>
      <div className="dx-act-frame" style={{
        width: '100%',
        height: '100%',
        borderRadius: 22,
        border: `1px solid ${props.selected === true ? 'rgba(255,255,255,.28)' : 'rgba(255,255,255,.08)'}`,
        background: 'linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.018))',
        color: dx.ink,
        padding: 12,
        fontSize: 13,
        fontFamily: dx.font,
        boxShadow: props.selected === true ? 'inset 0 0 0 1px rgba(255,255,255,.1), 0 18px 40px rgba(0,0,0,.28)' : 'inset 0 1px 0 rgba(255,255,255,.04)',
      }}>
        <div
          className="nodrag nopan"
          onDoubleClick={() => setEditing(true)}
          style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          color: dx.ink, fontWeight: 500, fontSize: 12,
          padding: '6px 10px', borderRadius: 999,
          background: 'rgba(12,12,12,.55)',
          border: `1px solid ${dx.hairline}`,
          backdropFilter: 'blur(12px)',
        }}>
          <KindGlyph kind="group" size={13} />
          <span style={{ color: dx.dim, fontSize: 10, letterSpacing: 0.4 }}>幕</span>
          {editing ? (
            <input
              autoFocus
              defaultValue={data.label}
              onBlur={event => {
                data.onRename?.(props.id, event.target.value)
                setEditing(false)
              }}
              onKeyDown={event => {
                if (event.key === 'Enter') (event.target as HTMLInputElement).blur()
                if (event.key === 'Escape') setEditing(false)
              }}
              style={{
                width: 120, border: 'none', outline: 'none', background: 'transparent',
                color: dx.ink, fontSize: 12, fontFamily: dx.font,
              }}
            />
          ) : (data.label || '分组')}
          {childCount > 0 ? <span style={{ color: dx.mute, fontSize: 10 }}>{childCount} 镜</span> : null}
        </div>
      </div>
    </div>
  )
})

export const stageNodeTypes = { media: MediaCard, text: TextCard, group: GroupCard }
