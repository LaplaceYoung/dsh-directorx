import { memo, useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { Handle, NodeResizer, Position, useStore, type NodeProps } from '@xyflow/react'
import { dx, dxPill } from '../canvas-theme.ts'

import { IconAudio, IconBox, IconBrush, IconCopy, IconCrop, IconDownload, IconEdit, IconImage, IconLock, IconMax, IconPlay, IconPlus, IconScissors, IconSpark, IconText, IconTrash, IconUnlock, IconUpload, IconVideo, KindGlyph } from './icons.tsx'
import { MarkdownView } from './MarkdownView.tsx'
import { CropBox } from './CropOverlay.tsx'
import { ImageMore } from './ImageMore.tsx'
import { MaskOverlay } from './MaskOverlay.tsx'
import { ExpandOverlay } from './ExpandOverlay.tsx'
import { NodeWorkstation } from './NodeWorkstation.tsx'
import { type GenerateSpec } from './workstation.ts'
import { withProject } from './project.ts'
import { displayCardTitle } from './card-label.ts'

export type StageKind = 'image' | 'video' | 'audio' | 'text' | 'group'

export function mediaUrl(path: string): string {
  return /^https?:\/\//i.test(path) ? path : withProject(`/directorx/media?path=${encodeURIComponent(path)}`)
}

const card: CSSProperties = {
  width: '100%',
  height: '100%',
  borderRadius: dx.radiusCard,
  overflow: 'hidden',
  background: '#1f1f1f',
  border: 'none',
  color: dx.ink,
  fontFamily: dx.font,
  boxShadow: 'none',
}

const handleBox: CSSProperties = {
  position: 'absolute',
  width: 28,
  height: 28,
  background: 'transparent',
  border: 'none',
  zIndex: 6,
}
const handleLeft: CSSProperties = { ...handleBox, left: -22, right: 'auto', top: '50%', transform: 'translateY(-50%)' }
const handleRight: CSSProperties = { ...handleBox, right: -22, left: 'auto', top: '50%', transform: 'translateY(-50%)' }
const handleTop: CSSProperties = { ...handleBox, top: -20, bottom: 'auto', left: '50%', transform: 'translateX(-50%)' }
const handleBottom: CSSProperties = { ...handleBox, bottom: -20, top: 'auto', left: '50%', transform: 'translateX(-50%)' }

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
  onClearRevise?: () => void
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
  onCrop?: (id: string) => void
  onCropped?: (id: string, blob: Blob) => void
  onPreview?: (id: string) => void
  onRedraw?: (id: string) => void
  onErase?: (id: string) => void
  onExpand?: (id: string) => void
  onExpanded?: (id: string, padded: Blob, mask: Blob) => void
  onAnnotate?: (id: string) => void
  onEnhance?: (id: string) => void
  onPixels?: (id: string) => void
  onCutout?: (id: string) => void
  onSplit?: (id: string, cols?: number, rows?: number) => void
  onCapture?: (id: string) => void
  onExtend?: (id: string) => void
  onReshoot?: (id: string) => void
  onMasked?: (id: string, blob: Blob, prompt: string, mode: 'redraw' | 'erase') => void
  cropping?: boolean
  expanding?: boolean
  cropAspect?: number
  maskMode?: 'redraw' | 'erase'
}

function ToolBtn(props: { title: string; onClick: () => void; children: ReactNode }): ReactNode {
  return (
    <button
      className="nodrag nopan dx-hit"
      title={props.title}
      data-tip={props.title}
      onClick={event => { event.stopPropagation(); props.onClick() }}
      style={{
        width: 40,
        height: 40,
        border: 'none',
        borderRadius: 9999,
        background: 'transparent',
        color: 'rgba(245,245,245,.9)',
        cursor: 'pointer',
        display: 'grid',
        placeItems: 'center',
        padding: 0,
        flexShrink: 0,
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
  cropping?: boolean
  title?: ReactNode
  dock?: ReactNode
  children: ReactNode
  toolbar: ReactNode
}): ReactNode {
  const [hot, setHot] = useState(false)
  const active = props.cropping !== true && (props.selected === true || hot)
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
          top: -80,
          transform: 'translateX(-50%)',
          zIndex: 7,
          opacity: active ? 1 : 0,
          pointerEvents: active ? 'auto' : 'none',
        }}
      >
        {props.toolbar}
      </div>
      {props.title !== undefined && props.cropping !== true ? (
        <div className="nodrag nopan dx-card-caption">
          {props.title}
        </div>
      ) : null}
      <div
        className={faceClass}
        style={{
          ...card,
          outline: props.selected === true ? `2px solid ${dx.selected}` : 'none',
          outlineOffset: 0,
          borderColor: props.failed === true ? 'rgba(255,155,143,.7)' : props.generating === true ? 'rgba(240,195,106,.62)' : 'transparent',
        }}
      >
        {props.children}
      </div>
      {props.dock !== undefined && props.selected === true && props.cropping !== true ? (
        <div className="nodrag nopan dx-card-dock">
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

function AudioPreview(props: { src: string }): ReactNode {
  return (
    <div className="nodrag nopan dx-audio-well">
      <span className="dx-audio-bars" aria-hidden><i /><i /><i /><i /><i /></span>
      <audio src={props.src} controls preload="metadata" />
    </div>
  )
}

function GeneratingHud(props: { kind: 'image' | 'video' | 'audio'; prompt?: string }): ReactNode {
  const line = (props.prompt ?? '').trim()
  const copy = props.kind === 'video' ? '正在出片' : props.kind === 'audio' ? '正在出声' : '正在出图'
  return (
    <div className="dx-gen-overlay" aria-live="polite">
      <span className="dx-gen-scan" />
      <div className="dx-gen-core">
        <span className="dx-gen-ring" />
        {props.kind === 'video' ? <span className="dx-gen-bars"><i /><i /><i /><i /></span> : null}
        {props.kind === 'audio' ? <span className="dx-audio-bars" aria-hidden><i /><i /><i /><i /><i /></span> : null}
        <div className="dx-gen-copy">{copy}</div>
        {line !== '' ? <div className="dx-gen-prompt">{line.length > 52 ? `${line.slice(0, 52)}…` : line}</div> : null}
      </div>
    </div>
  )
}

function EmptyPlate(props: { kind: 'image' | 'video' | 'audio'; prompt?: string }): ReactNode {
  return (
    <div className="dx-empty-plate">
      <span className="dx-empty-glyph">{props.kind === 'video' ? <IconVideo size={22} /> : props.kind === 'audio' ? <IconAudio size={22} /> : <IconImage size={22} />}</span>
    </div>
  )
}

export const MediaCard = memo(function MediaCard(props: NodeProps): ReactNode {
  const data = props.data as {
    kind?: string; label?: string; path?: string; shotStatus?: string; locked?: boolean
    prompt?: string; model?: string; aspect?: string; count?: number; durationSec?: number; lastError?: string
    characters?: string[]; shotIndex?: number; revise?: boolean
  } & CardActions
  const empty = data.path === undefined || data.path === ''
  const [shellRef, near] = useNearViewport()
  const src = empty ? '' : mediaUrl(data.path ?? '')
  const incoming = useStore(state =>
    state.edges.filter(edge => edge.target === props.id).map(edge => edge.source).sort().join('|'),
  )
  const takeDigest = useStore(state => {
    const prompt = (data.prompt ?? '').trim()
    if (prompt === '') return ''
    const self = state.nodes.find(node => node.id === props.id)
    const parent = self?.parentId ?? ''
    return state.nodes
      .filter(node =>
        (node.type === 'media' || node.type === undefined)
        && (node.parentId ?? '') === parent
        && typeof node.data.prompt === 'string'
        && node.data.prompt.trim() === prompt
        && typeof node.data.path === 'string'
        && node.data.path !== '',
      )
      .map(node => `${node.id}\t${String(node.data.path)}\t${String(node.data.label ?? node.id)}`)
      .join('\n')
  })
  const refs = incoming === '' ? [] : incoming.split('|')
  const takes = takeDigest === ''
    ? []
    : takeDigest.split('\n').map(row => {
      const [id, path, label] = row.split('\t')
      return { id: id ?? '', path: path ?? '', label: label ?? '' }
    }).filter(item => item.id !== '')
  const kind = data.kind === 'video' ? 'video' as const : data.kind === 'audio' ? 'audio' as const : 'image' as const
  const generating = data.shotStatus === 'generating'
  const filled = !empty && !generating
  const title = displayCardTitle(data.label, data.prompt, data.shotIndex)
  const spec: GenerateSpec = {
    kind,
    prompt: data.prompt ?? '',
    ...(data.model !== undefined ? { model: data.model } : {}),
    ...(data.aspect !== undefined ? { aspect: data.aspect } : {}),
    ...(data.count !== undefined ? { count: data.count } : {}),
    ...(data.durationSec !== undefined ? { durationSec: data.durationSec } : {}),
    ...(data.characters !== undefined ? { characters: data.characters } : {}),
    ...(refs.length > 0 ? { refIds: refs } : {}),
    sourceId: props.id,
    ...(data.revise === true ? { revise: true, targetId: props.id } : {}),
  }
  return (
    <NodeFrame
      selected={props.selected}
      generating={generating}
      failed={data.shotStatus === 'failed'}
      kind={kind}
      filled={filled}
      cropping={data.cropping === true || data.maskMode !== undefined || data.expanding === true}
      title={(
        <div className="dx-card-meta">
          <KindGlyph kind={kind} size={13} />
          <input
            className="dx-node-title nodrag nopan"
            value={title}
            placeholder="请输入标题"
            onChange={event => data.onRename?.(props.id, event.target.value)}
            style={{
              flex: 1, minWidth: 0, height: 22, padding: '0 2px', borderRadius: 6,
              border: '1px solid transparent', background: 'transparent',
              color: 'rgba(245,245,245,.92)', fontSize: 12, fontWeight: 500, letterSpacing: -0.2,
              fontFamily: dx.font, outline: 'none',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
          />
          {data.locked === true ? <span className="dx-card-lock" title="已锁定"><IconLock size={12} /></span> : null}
        </div>
      )}
      dock={props.selected === true && !filled ? (
        <NodeWorkstation
          spec={spec}
          compact
          onChange={next => {
            data.onPatch?.(props.id, {
              prompt: next.prompt,
              model: next.model,
              aspect: next.aspect,
              count: next.count,
              durationSec: next.durationSec,
              kind: next.kind,
              characters: next.characters,
            })
            if (next.revise !== true) data.onClearRevise?.()
          }}
          onSubmit={() => data.onGenerate?.(props.id)}
          onPickRef={data.onPickRef === undefined ? undefined : () => data.onPickRef?.(props.id)}
        />
      ) : undefined}
      toolbar={(
        <>
          {kind === 'image' && filled ? (
            <>
              <ToolBtn title="裁剪" onClick={() => data.onCrop?.(props.id)}><IconCrop size={16} /></ToolBtn>
              <ToolBtn title="局部重绘" onClick={() => data.onRedraw?.(props.id)}><IconBrush size={14} /></ToolBtn>
              <ImageMore
                onExpand={() => data.onExpand?.(props.id)}
                onErase={() => data.onErase?.(props.id)}
                onAnnotate={() => data.onAnnotate?.(props.id)}
                onEnhance={() => data.onEnhance?.(props.id)}
                onPixels={() => data.onPixels?.(props.id)}
                onCutout={() => data.onCutout?.(props.id)}
                onSplit={(cols, rows) => data.onSplit?.(props.id, cols, rows)}
              />
            </>
          ) : null}
          {kind === 'video' && filled ? (
            <>
              <ToolBtn title="剪辑" onClick={() => data.onEdit?.(props.id)}><IconScissors size={14} /></ToolBtn>
              <ToolBtn title="截帧" onClick={() => data.onCapture?.(props.id)}><IconImage size={14} /></ToolBtn>
              <ToolBtn title="延长镜头" onClick={() => data.onExtend?.(props.id)}><IconPlus size={14} /></ToolBtn>
              <ToolBtn title="视频重拍" onClick={() => data.onReshoot?.(props.id)}><IconEdit size={14} /></ToolBtn>
            </>
          ) : null}
          {empty && data.onUpload !== undefined ? <ToolBtn title="上传" onClick={() => data.onUpload?.(props.id)}><IconUpload size={14} /></ToolBtn> : null}
          {filled ? <ToolBtn title="下载" onClick={() => data.onDownload?.(props.id)}><IconDownload size={14} /></ToolBtn> : null}
          {filled && kind !== 'audio' ? <ToolBtn title="全屏" onClick={() => data.onPreview?.(props.id)}><IconMax size={14} /></ToolBtn> : null}
          <ToolBtn title="复制" onClick={() => data.onDuplicate?.(props.id)}><IconCopy size={14} /></ToolBtn>
          <ToolBtn title="删除" onClick={() => data.onDelete?.(props.id)}><IconTrash size={14} /></ToolBtn>
        </>
      )}
    >
      <NodeResizer
        isVisible={props.selected === true && data.cropping !== true && data.maskMode === undefined && data.expanding !== true}
        minWidth={240}
        minHeight={kind === 'audio' ? 120 : 160}
        keepAspectRatio={data.aspect !== undefined && data.aspect !== ''}
        color="rgba(255,255,255,.45)"
        lineStyle={{ border: 'none' }}
        handleStyle={{ width: 6, height: 6, borderRadius: 1, background: '#f3f3f3', border: 'none' }}
      />
      <div
        ref={shellRef}
        className={`dx-media-well${kind === 'video' && !filled ? ' dx-film' : ''}${filled ? ' dx-media-fill' : ''}`}
        style={{ overflow: data.cropping === true || data.maskMode !== undefined || data.expanding === true ? 'visible' : 'hidden' }}
      >
        {data.expanding === true && kind === 'image' && !empty ? (
          <ExpandOverlay src={src} onCancel={() => data.onExpand?.('')} onConfirm={(padded, mask) => data.onExpanded?.(props.id, padded, mask)} />
        ) : data.maskMode !== undefined && kind === 'image' && !empty ? (
          <MaskOverlay src={src} mode={data.maskMode} onCancel={() => data.onRedraw?.('')} onSubmit={(blob, prompt) => data.onMasked?.(props.id, blob, prompt, data.maskMode ?? 'redraw')} />
        ) : data.cropping === true && kind === 'image' && !empty ? (
          <CropBox src={src} aspect={data.cropAspect} onConfirm={blob => data.onCropped?.(props.id, blob)} />
        ) : empty && !generating ? (
          <EmptyPlate kind={kind} prompt={data.prompt} />
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
        ) : kind === 'audio' ? (
          <div className="dx-media-bleed" style={{ opacity: generating ? 0.38 : 1 }}>
            {near ? <AudioPreview src={src} /> : (
              <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: dx.mute }}>
                <IconAudio size={22} />
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
        {data.onUpload !== undefined && !generating && data.cropping !== true ? (
          <button
            type="button"
            className="nodrag nopan dx-hit dx-replace-chip"
            title="替换"
            onClick={event => { event.stopPropagation(); data.onUpload?.(props.id) }}
          >替换</button>
        ) : null}
        {kind === 'video' && data.durationSec !== undefined ? (
          <span className="dx-kind-badge dx-kind-time">{data.durationSec}s</span>
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
        {takes.length >= 2 ? (
          <div className="nodrag nopan dx-take-row" style={{ position: 'absolute', left: 8, right: 8, bottom: 38, display: 'flex', gap: 4 }}>
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
          <ToolBtn title="H1" onClick={() => data.onRename?.(props.id, `# ${data.label || '标题'}`)}><span style={{ fontSize: 11 }}>H1</span></ToolBtn>
          <ToolBtn title="H2" onClick={() => data.onRename?.(props.id, `## ${data.label || '标题'}`)}><span style={{ fontSize: 11 }}>H2</span></ToolBtn>
          <ToolBtn title="H3" onClick={() => data.onRename?.(props.id, `### ${data.label || '标题'}`)}><span style={{ fontSize: 11 }}>H3</span></ToolBtn>
          <ToolBtn title="粗体" onClick={() => wrap('**')}><span style={{ fontWeight: 700, fontSize: 12 }}>B</span></ToolBtn>
          <ToolBtn title="斜体" onClick={() => wrap('*')}><span style={{ fontStyle: 'italic', fontSize: 12 }}>I</span></ToolBtn>
          <ToolBtn title="列表" onClick={() => data.onRename?.(props.id, `- ${data.label || '条目'}`)}><span style={{ fontSize: 12 }}>≡</span></ToolBtn>
          <ToolBtn title="复制" onClick={() => data.onDuplicate?.(props.id)}><IconCopy size={14} /></ToolBtn>
          <ToolBtn title="删除" onClick={() => data.onDelete?.(props.id)}><IconTrash size={14} /></ToolBtn>
        </>
      )}
      dock={props.selected === true ? (
        <NodeWorkstation
          spec={{ kind: 'image', prompt: data.label ?? '' }}
          compact
          onChange={next => data.onRename?.(props.id, next.prompt)}
          onSubmit={() => data.onGenerate?.(props.id)}
        />
      ) : undefined}
    >
      <NodeResizer
        isVisible={props.selected === true}
        minWidth={180}
        minHeight={120}
        color="rgba(255,255,255,.45)"
        lineStyle={{ border: 'none' }}
        handleStyle={{ width: 7, height: 7, borderRadius: 2, background: '#f3f3f3', border: 'none' }}
      />
      <div className="dx-text-sheet" style={{ padding: 16, height: '100%', boxSizing: 'border-box' }}>
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
            placeholder="双击开始编辑..."
            style={{
              width: '100%',
              height: '100%',
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
        border: `1px solid ${props.selected === true ? 'rgba(255,244,228,.28)' : 'rgba(255,255,255,.08)'}`,
        background: 'linear-gradient(180deg, rgba(255,244,228,.045), rgba(255,255,255,.018))',
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
          padding: '7px 12px', borderRadius: 999,
          background: 'rgba(12,12,12,.62)',
          border: `1px solid ${dx.hairline}`,
          backdropFilter: 'blur(12px)',
        }}>
          <KindGlyph kind="group" size={13} />
          <span style={{ color: dx.dim, fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase' }}>幕</span>
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

export const DirectorStageCard = memo(function DirectorStageCard(props: NodeProps): ReactNode {
  const data = props.data as { label?: string; locked?: boolean } & CardActions
  return (
    <NodeFrame
      selected={props.selected}
      kind="director-stage"
      title={<div className="dx-card-meta"><KindGlyph kind="director-stage" size={13} /><span className="dx-shot-no" style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.label ?? '3D 导演台'}</span>{data.locked === true ? <span className="dx-card-lock"><IconLock size={12} /></span> : null}</div>}
      toolbar={<><ToolBtn title="进入片场" onClick={() => data.onEdit?.(props.id)}><IconBox size={16} /></ToolBtn><ToolBtn title="复制" onClick={() => data.onDuplicate?.(props.id)}><IconCopy size={16} /></ToolBtn><ToolBtn title="删除" onClick={() => data.onDelete?.(props.id)}><IconTrash size={16} /></ToolBtn></>}
    >
      <div className="dx-empty-plate">
        <span className="dx-empty-glyph"><IconBox size={26} /></span>
        <button type="button" className="nodrag nopan dx-hit dx-enter-chip" onClick={event => { event.stopPropagation(); data.onEdit?.(props.id) }}>进入片场</button>
      </div>
    </NodeFrame>
  )
})

export const EditStageCard = memo(function EditStageCard(props: NodeProps): ReactNode {
  const data = props.data as { label?: string; locked?: boolean } & CardActions
  return (
    <NodeFrame
      selected={props.selected}
      kind="edit"
      title={<div className="dx-card-meta"><KindGlyph kind="edit" size={13} /><span className="dx-shot-no" style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.label ?? '剪辑台'}</span>{data.locked === true ? <span className="dx-card-lock"><IconLock size={12} /></span> : null}</div>}
      toolbar={<><ToolBtn title="打开剪辑" onClick={() => data.onEdit?.(props.id)}><IconScissors size={16} /></ToolBtn><ToolBtn title="复制" onClick={() => data.onDuplicate?.(props.id)}><IconCopy size={16} /></ToolBtn><ToolBtn title="删除" onClick={() => data.onDelete?.(props.id)}><IconTrash size={16} /></ToolBtn></>}
    >
      <div className="dx-empty-plate">
        <span className="dx-empty-glyph"><IconScissors size={26} /></span>
        <button type="button" className="nodrag nopan dx-hit dx-enter-chip" onClick={event => { event.stopPropagation(); data.onEdit?.(props.id) }}>打开剪辑</button>
      </div>
    </NodeFrame>
  )
})

export const stageNodeTypes = { media: MediaCard, text: TextCard, group: GroupCard, 'director-stage': DirectorStageCard, edit: EditStageCard }
