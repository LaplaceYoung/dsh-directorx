import { memo, useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { Handle, NodeResizer, Position, useStore, type NodeProps } from '@xyflow/react'
import { dx, dxPill } from '../canvas-theme.ts'
import { SHOT_STATUS_COLOR, SHOT_STATUS_LABEL, asShotStatus } from './document.ts'
import { IconCopy, IconDownload, IconEdit, IconImage, IconLock, IconPlay, IconPlus, IconSpark, IconText, IconTrash, IconUnlock, IconUpload, IconVideo, KindGlyph } from './icons.tsx'
import { MarkdownView } from './MarkdownView.tsx'
import { NodeWorkstation } from './NodeWorkstation.tsx'
import { incomingRefIds, takePeers, type GenerateSpec } from './workstation.ts'
import { withProject } from './project.ts'

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
  width: 28,
  height: 28,
  background: 'transparent',
  border: 'none',
  zIndex: 6,
}
const handleLeft: CSSProperties = { ...handleBox, left: -14, right: 'auto', top: '50%', transform: 'translateY(-50%)' }
const handleRight: CSSProperties = { ...handleBox, right: -14, left: 'auto', top: '50%', transform: 'translateY(-50%)' }
const handleTop: CSSProperties = { ...handleBox, top: -14, bottom: 'auto', left: '50%', transform: 'translateX(-50%)' }
const handleBottom: CSSProperties = { ...handleBox, bottom: -14, top: 'auto', left: '50%', transform: 'translateX(-50%)' }

function Ports(): ReactNode {
  return (
    <>
      <Handle id="in" type="target" position={Position.Left} className="dx-port" isConnectable style={handleLeft}>
        <span className="dx-port-dot" />
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
  title?: ReactNode
  dock?: ReactNode
  children: ReactNode
  toolbar: ReactNode
}): ReactNode {
  const [hot, setHot] = useState(false)
  const active = props.selected === true || hot
  return (
    <div
      className={props.generating === true ? 'dx-generating' : undefined}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      style={{ width: '100%', height: '100%', overflow: 'visible' }}
    >
      <Ports />
      {props.title !== undefined ? (
        <div className="nodrag nopan" style={{ position: 'absolute', left: 2, right: 2, top: -30, zIndex: 5 }}>
          {props.title}
        </div>
      ) : null}
      <div
        className="nodrag nopan dx-node-toolbar"
        style={{
          position: 'absolute',
          left: '50%',
          top: props.title !== undefined ? -70 : -44,
          transform: 'translateX(-50%)',
          zIndex: 7,
          opacity: active ? 1 : 0,
          pointerEvents: active ? 'auto' : 'none',
        }}
      >
        {props.toolbar}
      </div>
      <div
        className="dx-card-face"
        style={{
          ...card,
          boxShadow: props.selected === true ? dx.glow : card.boxShadow,
          borderColor: props.failed === true ? 'rgba(255,155,143,.7)' : props.selected === true ? 'rgba(255,255,255,.55)' : dx.hairline,
        }}
      >
        {props.children}
      </div>
      {props.dock !== undefined && props.selected === true ? (
        <div className="nodrag nopan" style={{ position: 'absolute', left: 0, right: 0, top: '100%', marginTop: 8, zIndex: 8 }}>
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

function VideoPreview(props: { src: string; active?: boolean; onEdit?: () => void }): ReactNode {
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
      onDoubleClick={event => {
        event.stopPropagation()
        props.onEdit?.()
      }}
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
      style={{ width: '100%', height: '100%', position: 'relative', cursor: 'pointer' }}
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

export const MediaCard = memo(function MediaCard(props: NodeProps): ReactNode {
  const data = props.data as {
    kind?: string; label?: string; path?: string; shotStatus?: string; locked?: boolean
    prompt?: string; model?: string; aspect?: string; count?: number; durationSec?: number; lastError?: string
    characters?: string[]
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
      generating={data.shotStatus === 'generating'}
      failed={data.shotStatus === 'failed'}
      title={(
        <input
          className="dx-node-title nodrag nopan"
          value={data.label}
          placeholder="请输入标题"
          onChange={event => data.onRename?.(props.id, event.target.value)}
          style={{
            width: '100%', height: 26, padding: '0 8px', borderRadius: 8,
            border: '1px solid transparent', background: 'transparent',
            color: dx.ink, fontSize: 12, fontFamily: dx.font, outline: 'none',
          }}
        />
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
          <ToolBtn title="生成" onClick={() => data.onGenerate?.(props.id)}><IconSpark size={14} /></ToolBtn>
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
        handleStyle={{ width: 7, height: 7, borderRadius: 2, background: '#f3f3f3', border: 'none' }}
      />
      <div
        ref={shellRef}
        onDoubleClick={() => { if (!empty) data.onEdit?.(props.id) }}
        style={{ height: '100%', background: '#090909', position: 'relative' }}
      >
        {empty ? (
          <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: dx.dim, fontSize: 12, gap: 8 }}>
            {data.onUpload !== undefined ? (
              <button
                className="nodrag nopan dx-hit"
                title="上传"
                data-tip="上传到此节点"
                onClick={event => { event.stopPropagation(); data.onUpload?.(props.id) }}
                style={{
                  position: 'absolute', top: 8, right: 8, zIndex: 3,
                  height: 28, padding: '0 10px', borderRadius: 999, gap: 5, fontSize: 11,
                  border: `1px solid ${dx.hairline}`, background: 'rgba(12,12,12,.78)', color: dx.ink,
                  display: 'flex', alignItems: 'center', cursor: 'pointer', fontFamily: dx.font,
                }}
              >
                <IconUpload size={12} />上传
              </button>
            ) : null}
            <span style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              display: 'grid',
              placeItems: 'center',
              background: 'rgba(255,255,255,.035)',
              border: `1px dashed ${dx.hairlineStrong}`,
            }}>
              {data.kind === 'video' ? <IconVideo size={18} /> : <IconImage size={18} />}
            </span>
            <span>{data.kind === 'video' ? '空视频' : '空图片'}</span>
          </div>
        ) : data.kind === 'video' ? (
          near ? (
            <VideoPreview src={src} active={props.selected === true} onEdit={() => data.onEdit?.(props.id)} />
          ) : (
            <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: dx.mute }}>
              <IconVideo size={22} />
            </div>
          )
        ) : near ? (
          <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: dx.mute }}>
            <IconImage size={22} />
          </div>
        )}
        <span className="dx-kind-badge">
          <KindGlyph kind={data.kind === 'video' ? 'video' : 'image'} size={11} />
        </span>
        {data.locked === true ? (
          <span className="dx-kind-badge" style={{ left: 'auto', right: 8 }} title="已锁定">
            <IconLock size={11} />
          </span>
        ) : null}
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
        {peers.length >= 2 ? (
          <div className="nodrag nopan" style={{ position: 'absolute', left: 8, right: 8, bottom: 36, display: 'flex', gap: 4 }}>
            {peers.slice(0, 6).map(peer => {
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
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          padding: '20px 12px 8px',
          background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,.72) 80%)',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        }}>
          <StatusChip status={data.shotStatus} onClick={() => data.onCycleStatus?.(props.id)} />
        </div>
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
        padding: '2px 7px',
        borderRadius: 999,
        border: `1px solid ${SHOT_STATUS_COLOR[status]}33`,
        background: `${SHOT_STATUS_COLOR[status]}14`,
        color: SHOT_STATUS_COLOR[status],
        fontSize: 10,
        fontWeight: 500,
        cursor: 'pointer',
        fontFamily: dx.font,
      }}
    >
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
      <div style={{ padding: 16, height: '100%', boxSizing: 'border-box', background: 'linear-gradient(180deg, rgba(255,255,255,.03), transparent 42%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: dx.dim, fontSize: 10, letterSpacing: 0.35, marginBottom: 8, textTransform: 'uppercase' }}>
          <IconText size={11} />文本
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
            onDoubleClick={event => { event.stopPropagation(); setEditing(true) }}
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
  return (
    <div style={{ width: '100%', height: '100%', overflow: 'visible' }}>
      <Ports />
      <div style={{
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
          onDoubleClick={event => { event.stopPropagation(); setEditing(true) }}
          style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          color: dx.ink, fontWeight: 500, fontSize: 12,
          padding: '6px 10px', borderRadius: 999,
          background: 'rgba(12,12,12,.55)',
          border: `1px solid ${dx.hairline}`,
          backdropFilter: 'blur(12px)',
        }}>
          <KindGlyph kind="group" size={13} />
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
        </div>
      </div>
    </div>
  )
})

export const stageNodeTypes = { media: MediaCard, text: TextCard, group: GroupCard }
