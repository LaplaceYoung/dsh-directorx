import { useCallback, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react'
import { closeEditor, editorSnapshot, subscribeEditor, toggleEditor } from './editor.ts'
import { Stage } from './stage/Stage.tsx'
import { rpcOk, type SessionClient, type WorkspaceClient } from './stage/session-fold.ts'

const handle: CSSProperties = {
  width: '100%',
  height: '100%',
  minWidth: 0,
  minHeight: 0,
  display: 'grid',
  placeItems: 'center',
  border: '1px solid var(--dsw-alias-border-l2)',
  borderRadius: 10,
  background: 'var(--dsw-alias-bg-layer-2)',
  color: 'var(--dsw-alias-label-primary)',
  font: 'inherit',
  fontSize: 14,
  cursor: 'pointer',
}

const overlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 10,
  minWidth: 0,
  minHeight: 0,
  overflow: 'hidden',
  background: 'var(--dsw-alias-bg-base)',
  color: 'var(--dsw-alias-label-primary)',
}

export interface EditorDockProps {
  sessionId?: string
  liveSessions?: unknown
  connection?: {
    api?: {
      sessions?: SessionClient
      workspace?: WorkspaceClient
    }
  }
}

export function EditorDock(props: EditorDockProps): ReactNode {
  const snapshot = useSyncExternalStore(subscribeEditor, editorSnapshot)
  const onClose = useCallback(() => { closeEditor() }, [])
  const onToggle = useCallback(() => { toggleEditor() }, [])

  if (snapshot.open) {
    return (
      <div style={overlay} data-directorx-editor="open">
        <Stage
          sessionId={props.sessionId}
          sessions={props.connection?.api?.sessions}
          liveSessions={props.liveSessions}
          workspace={props.connection?.api?.workspace}
          onClose={onClose}
          onAskDsh={async (text, sessionId) => {
            const prompt = props.connection?.api?.sessions?.prompt
            if (sessionId === undefined || sessionId === '' || prompt === undefined) {
              throw new Error('这个工作区还没有 DSH 会话，无法把画布交给 DSH')
            }
            const response = await prompt({ sessionId, mode: 'queue', content: [{ type: 'text', text }] })
            const parsed = rpcOk<unknown>(response)
            if (!parsed.ok) throw new Error(parsed.message)
          }}
        />
      </div>
    )
  }

  return (
    <button type="button" className="dx-hit" style={handle} onClick={onToggle} title="打开 DirectorX 画布" aria-label="打开 DirectorX 画布">
      打开 DirectorX 画布
    </button>
  )
}
