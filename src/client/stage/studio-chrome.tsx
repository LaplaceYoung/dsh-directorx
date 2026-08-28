import { Component, type CSSProperties, type ErrorInfo, type ReactNode } from 'react'
import { dx, dxChrome, dxGhostBtn, dxPill } from '../canvas-theme.ts'

export const studioBtn: CSSProperties = {
  ...dxGhostBtn,
  width: 'auto',
  height: 32,
  padding: '0 10px',
  gap: 6,
  fontSize: 12,
  fontFamily: dx.font,
  color: dx.ink,
  border: `1px solid ${dx.hairline}`,
  background: 'rgba(255,255,255,.04)',
}

export const studioPrimary: CSSProperties = {
  ...dxPill,
  width: 'auto',
  height: 34,
  padding: '0 14px',
  gap: 6,
  fontSize: 12,
  fontWeight: 600,
  fontFamily: dx.font,
}

const railBtn: CSSProperties = {
  ...dxGhostBtn,
  width: 36,
  height: 36,
}

export function StudioShell(props: {
  title: string
  filename: string
  meta: string
  error?: string
  saveLabel: string
  saveDisabled?: boolean
  onSave: () => void
  onClose: () => void
  closeLabel?: string
  canUndo?: boolean
  canRedo?: boolean
  onUndo?: () => void
  onRedo?: () => void
  tools: Array<{ id: string; label: string; icon: ReactNode }>
  tool: string
  onTool: (id: string) => void
  inspector?: ReactNode
  footer?: ReactNode
  children: ReactNode
}): ReactNode {
  return (
    <div className="dx-studio" style={{
      position: 'absolute', inset: 0, zIndex: 40, display: 'flex', flexDirection: 'column',
      background: dx.black, color: dx.ink, fontFamily: dx.font,
    }}>
      <div style={{
        ...dxChrome,
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
        borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none',
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{props.title}</div>
          <div style={{ fontSize: 11, color: dx.mute, marginTop: 2, maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {props.filename}
          </div>
        </div>
        <span style={{ fontSize: 11, color: dx.dim }}>{props.meta}</span>
        <span style={{ flex: 1 }} />
        {props.onUndo !== undefined ? (
          <button className="dx-hit" style={studioBtn} disabled={props.canUndo !== true} onClick={props.onUndo}>撤销</button>
        ) : null}
        {props.onRedo !== undefined ? (
          <button className="dx-hit" style={studioBtn} disabled={props.canRedo !== true} onClick={props.onRedo}>重做</button>
        ) : null}
        <span style={{ fontSize: 11, color: dx.dim, letterSpacing: 0.2 }}>Esc 完成 · ⌘S 保存</span>
        <button className="dx-hit dx-cta" style={studioPrimary} disabled={props.saveDisabled === true} onClick={props.onSave}>
          {props.saveLabel}
        </button>
        <button className="dx-hit" style={studioBtn} onClick={props.onClose}>{props.closeLabel ?? '完成'}</button>
      </div>
      {props.error !== undefined ? (
        <div style={{ padding: '8px 16px', color: '#ff9b8f', fontSize: 12, background: 'rgba(40,16,14,.85)' }}>{props.error}</div>
      ) : null}
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <div style={{
          ...dxChrome,
          width: 52, margin: 10, marginRight: 0, borderRadius: 18, padding: 8,
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          {props.tools.map(item => (
            <button
              key={item.id}
              className="dx-hit"
              title={item.label}
              onClick={() => props.onTool(item.id)}
              style={{
                ...railBtn,
                background: props.tool === item.id ? 'rgba(255,255,255,.14)' : 'transparent',
              }}
            >
              {item.icon}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, minWidth: 0, minHeight: 0, position: 'relative', display: 'flex', flexDirection: 'column' }}>
          {props.children}
        </div>
        {props.inspector !== undefined ? (
          <div style={{
            ...dxChrome,
            width: 268, margin: 10, marginLeft: 0, borderRadius: 18, padding: 14,
            overflow: 'auto',
          }}>
            {props.inspector}
          </div>
        ) : null}
      </div>
      {props.footer}
    </div>
  )
}

export function StudioField(props: { label: string; children: ReactNode }): ReactNode {
  return (
    <label style={{ display: 'block', marginBottom: 12, fontSize: 12, color: dx.mute }}>
      <div style={{ marginBottom: 6 }}>{props.label}</div>
      {props.children}
    </label>
  )
}

export function studioRange(): CSSProperties {
  return { width: '100%', accentColor: '#f3f3f3' }
}

export class StudioErrorBoundary extends Component<{ children: ReactNode }, { message: string }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { message: '' }
  }
  static getDerivedStateFromError(error: unknown): { message: string } {
    const text = error instanceof Error ? (error.stack ?? error.message) : String(error)
    return { message: text || String(error) }
  }
  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('DirectorX studio', error, info.componentStack)
  }
  override render(): ReactNode {
    if (this.state.message !== '') {
      return (
        <pre data-stage-crash="1" style={{ position: 'absolute', inset: 0, overflow: 'auto', color: '#ff9b8f', fontFamily: dx.font, fontSize: 12, padding: 24, whiteSpace: 'pre-wrap', background: '#111', margin: 0 }}>
          {this.state.message}
        </pre>
      )
    }
    return this.props.children
  }
}
