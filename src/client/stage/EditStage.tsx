import { type CSSProperties, type ReactNode } from 'react'
import { dx, dxGhostBtn } from '../canvas-theme.ts'
import { withProject } from './project.ts'

const button: CSSProperties = { ...dxGhostBtn, width: 'auto', height: 29, padding: '0 9px', borderRadius: 8, fontSize: 11, fontFamily: dx.font }

export function EditStage(props: { nodeId: string; onClose: () => void }): ReactNode {
  const src = withProject(`/directorx/edit/?node=${encodeURIComponent(props.nodeId)}`)
  return (
    <div data-edit-stage="true" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#111', color: '#eee', fontFamily: dx.font }}>
      <header style={{ height: 42, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px', borderBottom: '1px solid #2a2a2a', zIndex: 2 }}>
        <strong style={{ fontSize: 14, whiteSpace: 'nowrap' }}>剪辑台</strong>
        <button type="button" className="dx-hit" style={button} onClick={props.onClose}>返回画布</button>
        <span style={{ flex: 1 }} />
      </header>
      <iframe
        title="剪辑台"
        src={src}
        style={{ flex: 1, border: 0, width: '100%', minHeight: 0, background: '#111' }}
        allow="autoplay; fullscreen; clipboard-read; clipboard-write"
      />
    </div>
  )
}
