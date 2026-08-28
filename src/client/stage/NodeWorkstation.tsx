import { useState, type CSSProperties, type ReactNode } from 'react'
import { dx, dxChrome, dxGhostBtn, dxPill } from '../canvas-theme.ts'
import { IconAudio, IconClose, IconImage, IconPlus, IconSend, IconSpark, IconVideo } from './icons.tsx'
import {
  FRAME_ASPECTS, VIDEO_DURATIONS, modelsFor, type GenerateSpec,
} from './workstation.ts'
import { PromptIpField } from './ip-prompt.tsx'

export interface NodeWorkstationProps {
  spec: GenerateSpec
  busy?: boolean
  sourceLabel?: string
  compact?: boolean
  onChange: (spec: GenerateSpec) => void
  onSubmit: () => void
  onClearSource?: () => void
  onPickRef?: () => void
  inputRef?: { current: HTMLTextAreaElement | null }
}

const pop: CSSProperties = {
  ...dxChrome,
  position: 'absolute',
  bottom: 44,
  left: 0,
  zIndex: 4,
  padding: 8,
  borderRadius: 14,
  minWidth: 200,
}

export function NodeWorkstation(props: NodeWorkstationProps): ReactNode {
  const [open, setOpen] = useState<'model' | 'aspect' | 'count' | 'duration' | undefined>(undefined)
  const compact = props.compact === true
  const models = modelsFor(props.spec.kind)
  const modelLabel = models.find(item => item.id === props.spec.model)?.label ?? '模型'
  const count = props.spec.count ?? 1
  const chips = (
    <>
      {props.sourceLabel !== undefined ? (
        <button className="dx-hit" onClick={props.onClearSource} style={{ ...dxGhostBtn, width: 'auto', height: 26, padding: '0 8px', gap: 4, fontSize: 11, background: 'rgba(255,255,255,.06)', maxWidth: 140 }} title="取消上游引用">
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>参考 {props.sourceLabel}</span>
          <IconClose size={10} />
        </button>
      ) : null}
      {(props.spec.refIds ?? []).map(id => (
        <span key={id} title={id} style={{ ...dxGhostBtn, width: 'auto', height: 22, padding: '0 7px', fontSize: 10, background: 'rgba(255,255,255,.06)' }}>
          参考 {id.replace(/^.*-/, '').slice(0, 6)}
        </span>
      ))}
      {(props.spec.characters ?? []).map(name => (
        <button
          key={name}
          className="dx-hit"
          title="移出角色锚点"
          onClick={() => props.onChange({ ...props.spec, characters: (props.spec.characters ?? []).filter(item => item !== name) })}
          style={{ ...dxGhostBtn, width: 'auto', height: 22, padding: '0 7px', gap: 4, fontSize: 10, background: 'rgba(255,255,255,.06)' }}
        >
          {name}
          <IconClose size={9} />
        </button>
      ))}
    </>
  )
  const send = (
    <button
      type="button"
      disabled={props.busy === true || props.spec.prompt.trim() === ''}
      onClick={props.onSubmit}
      className="dx-cta"
      title="交给 DSH"
      style={{ ...dxPill, width: 32, height: 32, flexShrink: 0, opacity: props.busy === true || props.spec.prompt.trim() === '' ? .4 : 1 }}
    >
      {props.busy === true ? <span className="dx-spin" /> : <IconSend size={14} />}
    </button>
  )
  const controls = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0, flexWrap: 'wrap' }}>
      {compact ? (
        <>
          <button
            className="dx-hit"
            title={props.spec.kind === 'video' ? '视频' : props.spec.kind === 'audio' ? '音频' : '图片'}
            style={{
              ...dxGhostBtn, width: 28, height: 26,
              background: 'rgba(255,255,255,.06)',
            }}
            onClick={() => props.onChange({
              ...props.spec,
              kind: props.spec.kind === 'image' ? 'video' : props.spec.kind === 'video' ? 'audio' : 'image',
              model: undefined,
            })}
          >
            {props.spec.kind === 'video' ? <IconVideo size={12} /> : props.spec.kind === 'audio' ? <IconAudio size={12} /> : <IconImage size={12} />}
          </button>
          {props.onPickRef !== undefined ? (
            <button
              className="dx-hit"
              title="添加参考"
              style={{ ...dxGhostBtn, width: 28, height: 26 }}
              onClick={props.onPickRef}
            >
              <IconPlus size={12} />
            </button>
          ) : null}
          <button
            className="dx-hit"
            title="交给 DSH"
            style={{ ...dxGhostBtn, width: 28, height: 26 }}
            onClick={props.onSubmit}
          >
            <IconSpark size={12} />
          </button>
        </>
      ) : (
        (['image', 'video', 'audio'] as const).map(kind => (
          <button
            key={kind}
            className="dx-hit"
            style={{
              ...dxGhostBtn, width: 'auto', height: 26, padding: '0 8px', gap: 4, fontSize: 11,
              background: props.spec.kind === kind ? 'rgba(255,255,255,.12)' : 'transparent',
            }}
            onClick={() => props.onChange({ ...props.spec, kind, model: undefined })}
          >
            {kind === 'image' ? <IconImage size={12} /> : kind === 'video' ? <IconVideo size={12} /> : <IconAudio size={12} />}
            {kind === 'image' ? '图片' : kind === 'video' ? '视频' : '音频'}
          </button>
        ))
      )}
      <span style={{ flex: 1 }} />
      <PopTrigger label={modelLabel} open={open === 'model'} onToggle={() => setOpen(open === 'model' ? undefined : 'model')}>
        {models.map(item => (
          <button key={item.id} className="dx-menu-item" style={row} onClick={() => { props.onChange({ ...props.spec, model: item.id }); setOpen(undefined) }}>{item.label}</button>
        ))}
      </PopTrigger>
      {props.spec.kind !== 'audio' ? (
        <PopTrigger label={props.spec.aspect ?? '画幅'} open={open === 'aspect'} onToggle={() => setOpen(open === 'aspect' ? undefined : 'aspect')}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 56px)', gap: 4, padding: 4 }}>
            {FRAME_ASPECTS.map(item => (
              <button
                key={item.id}
                className="dx-hit"
                title={item.id}
                style={{
                  ...dxGhostBtn, width: 56, height: 44, flexDirection: 'column', gap: 4, fontSize: 10,
                  background: props.spec.aspect === item.id ? 'rgba(255,255,255,.12)' : 'transparent',
                }}
                onClick={() => { props.onChange({ ...props.spec, aspect: item.id }); setOpen(undefined) }}
              >
                <AspectMark w={item.w} h={item.h} />
                {item.id}
              </button>
            ))}
          </div>
        </PopTrigger>
      ) : null}
      {props.spec.kind === 'video' ? (
        <PopTrigger label={`${props.spec.durationSec ?? 5}s`} open={open === 'duration'} onToggle={() => setOpen(open === 'duration' ? undefined : 'duration')}>
          {VIDEO_DURATIONS.map(sec => (
            <button key={sec} className="dx-menu-item" style={row} onClick={() => { props.onChange({ ...props.spec, durationSec: sec }); setOpen(undefined) }}>{sec}s</button>
          ))}
        </PopTrigger>
      ) : null}
      <PopTrigger label={`${count}×`} open={open === 'count'} onToggle={() => setOpen(open === 'count' ? undefined : 'count')}>
        {[1, 2, 3, 4].map(n => (
          <button key={n} className="dx-menu-item" style={row} onClick={() => { props.onChange({ ...props.spec, count: n }); setOpen(undefined) }}>{n}×</button>
        ))}
      </PopTrigger>
      {compact ? send : null}
    </div>
  )
  return (
    <div
      className="nowheel nopan nodrag"
      onPointerDown={event => event.stopPropagation()}
      style={{
        width: compact ? 640 : '100%',
        minWidth: compact ? 640 : 0,
        maxWidth: compact ? 650 : 520,
        padding: compact ? 12 : 10,
        borderRadius: 16,
        background: '#1f1f1f',
        border: '1px solid rgba(255,255,255,.10)',
        color: dx.ink,
        fontFamily: dx.font,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        boxSizing: 'border-box',
      }}
    >
      {props.spec.revise === true || props.sourceLabel !== undefined || (props.spec.refIds ?? []).length > 0 || (props.spec.characters ?? []).length > 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          {props.spec.revise === true ? (
            <button
              className="dx-hit"
              title="取消重新生成，改为新建"
              onClick={() => props.onChange({ ...props.spec, revise: undefined, targetId: undefined })}
              style={{ ...dxGhostBtn, width: 'auto', height: 22, padding: '0 7px', gap: 4, fontSize: 10, background: 'rgba(255,255,255,.12)' }}
            >
              重新生成
              <IconClose size={9} />
            </button>
          ) : null}
          {chips}
        </div>
      ) : null}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        {compact && props.onPickRef !== undefined ? (
          <button
            className="dx-hit"
            title="添加参考"
            style={{ ...dxGhostBtn, width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,.08)', flexShrink: 0 }}
            onClick={props.onPickRef}
          >
            <IconPlus size={16} />
          </button>
        ) : null}
        <PromptIpField
          compact={compact}
          inputRef={props.inputRef}
          value={props.spec.prompt}
          placeholder={props.spec.revise === true ? '改哪里，或直接沿用当前提示词再生成' : '描述任何你想要生成的内容'}
          rows={3}
          onChange={value => props.onChange({ ...props.spec, prompt: value })}
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              props.onSubmit()
            }
          }}
          style={{
            flex: 1, minHeight: compact ? 80 : 40, maxHeight: 120, resize: 'none', border: 'none', outline: 'none',
            background: 'transparent', color: dx.ink, fontSize: 14, lineHeight: 1.5, fontFamily: dx.font,
          }}
        />
        {compact ? null : send}
      </div>
      {controls}
    </div>
  )
}

function AspectMark(props: { w: number; h: number }): ReactNode {
  const max = 18
  const ratio = props.w / props.h
  const width = ratio >= 1 ? max : Math.max(6, Math.round(max * ratio))
  const height = ratio >= 1 ? Math.max(6, Math.round(max / ratio)) : max
  return <span style={{ width, height, borderRadius: 2, border: '1px solid rgba(255,255,255,.55)', display: 'block' }} />
}

function PopTrigger(props: { label: string; open: boolean; onToggle: () => void; children: ReactNode }): ReactNode {
  return (
    <div style={{ position: 'relative' }}>
      <button type="button" className="dx-hit" onClick={props.onToggle} style={{ ...dxGhostBtn, width: 'auto', height: 26, padding: '0 8px', fontSize: 11 }}>
        {props.label}
      </button>
      {props.open ? <div style={pop}>{props.children}</div> : null}
    </div>
  )
}

const row: CSSProperties = {
  display: 'flex', alignItems: 'center', width: '100%', textAlign: 'left',
  padding: '6px 8px', border: 'none', borderRadius: 8, background: 'transparent',
  color: dx.ink, fontSize: 12, fontFamily: dx.font, cursor: 'pointer',
}
