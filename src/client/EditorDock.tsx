import { useCallback, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react'
import { closeEditor, editorSnapshot, subscribeEditor, toggleEditor } from './editor.ts'
import { Stage } from './stage/Stage.tsx'
import type { SessionClient, WorkspaceClient } from './stage/session-fold.ts'

const handle: CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'grid',
  placeItems: 'center',
  border: 0,
  background: '#080808',
  color: '#f2f2f2',
  fontSize: 14,
  cursor: 'pointer',
}

const overlay: CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: 10,
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
      打开 DirectorX 画布
    </button>
  )
}
