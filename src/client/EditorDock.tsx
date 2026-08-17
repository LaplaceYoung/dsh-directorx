import { useCallback, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react'
import { closeEditor, editorSnapshot, subscribeEditor, toggleEditor } from './editor.ts'
import { Stage } from './stage/Stage.tsx'
import type { SessionClient, WorkspaceClient } from './stage/session-fold.ts'

const handle: CSSProperties = {
  position: 'fixed',
  right: 0,
  top: '42%',
  padding: '14px 9px',
  writingMode: 'vertical-rl',
  letterSpacing: 1.4,
  border: '1px solid rgba(255,255,255,.12)',
  borderRight: 'none',
  borderRadius: '12px 0 0 12px',
  background: 'rgba(16,16,16,.78)',
  backdropFilter: 'blur(16px)',
  color: '#f2f2f2',
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
  zIndex: 60,
  pointerEvents: 'auto',
}

const overlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 80,
  background: '#000',
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
      <div style={overlay}>
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
            const result = response !== null && typeof response === 'object'
              ? (response as { result?: { ok?: boolean; error?: { message?: string } } }).result
              : undefined
            if (result?.ok === false) {
              throw new Error(result.error?.message ?? 'DSH 未接受画布指令')
            }
          }}
        />
      </div>
    )
  }

  return (
    <button style={handle} onClick={onToggle} title="打开 DirectorX 画布">
      DirectorX 画布
    </button>
  )
}
