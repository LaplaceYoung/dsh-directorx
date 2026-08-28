import { useEffect, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react'
import { closeEditor, editorSnapshot, ensureEditorOpen, subscribeEditor } from './editor.ts'
import { Stage } from './stage/Stage.tsx'
import { mintSessionRequestId, rpcOk, type SessionClient, type WorkspaceClient } from './stage/session-fold.ts'

const overlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 10,
  minWidth: 0,
  minHeight: 0,
  overflow: 'hidden',
  background: '#000',
  color: '#f5f5f5',
}

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

export interface EditorDockProps {
  sessionId?: string
  liveSessions?: unknown
  /** alpha.1 `uiSession.pendingInteractions` face (question/approval carriers). */
  pending?: unknown
  /** alpha.1 `workspaces` Client service: observable list + archived set. */
  workspaces?: {
    list?: { getSnapshot(): WorkspaceSnapshotLike }
  }
  remote?: {
    session?: SessionClient
    workspace?: WorkspaceClient
  }
  connection?: {
    api?: {
      sessions?: SessionClient
      workspace?: WorkspaceClient
    }
  }
}

interface WorkspaceViewLike {
  workspaceId?: string
  path?: string
  sessionIds?: readonly string[]
}

interface WorkspaceSnapshotLike {
  items?: readonly WorkspaceViewLike[]
  archivedSessionIds?: readonly string[]
}

/**
 * Workspace list adapter: alpha.1 exposes no `remote.workspace.list` — the
 * `workspaces` Client service mirrors the follow stream as a snapshot. Older
 * hosts keep the `remote.workspace.list` RPC shape. Both normalize into the
 * shape `parseWorkspaceList` / `parseArchivedIds` already read.
 */
function adaptWorkspace(props: EditorDockProps): WorkspaceClient | undefined {
  const legacy = props.remote?.workspace ?? props.connection?.api?.workspace
  if (legacy?.list !== undefined) return legacy
  const source = props.workspaces?.list
  if (source === undefined) return legacy
  return {
    ...legacy,
    list: async () => {
      const snapshot = source.getSnapshot()
      return {
        items: (snapshot.items ?? []).map(view => ({
          ...(typeof view.workspaceId === 'string' ? { workspaceId: view.workspaceId } : {}),
          ...(typeof view.path === 'string' ? { path: view.path } : {}),
          sessionIds: Array.isArray(view.sessionIds) ? view.sessionIds.filter((id): id is string => typeof id === 'string') : [],
        })),
        archivedSessionIds: Array.isArray(snapshot.archivedSessionIds)
          ? snapshot.archivedSessionIds.filter((id): id is string => typeof id === 'string')
          : [],
      }
    },
  }
}

/**
 * The canvas tab body. Selecting the tab throws the fullscreen infinite
 * canvas over the whole page (`ensureEditorOpen`); closing it returns to the
 * ordinary conversation chrome, where this seat shows only a reopen handle.
 */
export function EditorDock(props: EditorDockProps): ReactNode {
  const snapshot = useSyncExternalStore(subscribeEditor, editorSnapshot)
  // Entering the canvas tab enters canvas mode — no extra click.
  useEffect(() => { ensureEditorOpen() }, [])
  const sessions = props.remote?.session ?? props.connection?.api?.sessions
  const workspace = adaptWorkspace(props)

  if (snapshot.open) {
    return (
      <div style={overlay} data-directorx-editor="open">
        <Stage
          sessionId={props.sessionId}
          sessions={sessions}
          liveSessions={props.liveSessions}
          pending={props.pending}
          workspace={workspace}
          onClose={closeEditor}
          onAskDsh={async (text, sessionId) => {
            const prompt = sessions?.prompt
            if (sessionId === undefined || sessionId === '' || prompt === undefined) {
              throw new Error('这个工作区还没有 DSH 会话，无法把画布交给 DSH')
            }
            const response = await prompt({ sessionId, mode: 'queue', content: [{ type: 'text', text }], requestId: mintSessionRequestId() })
            const parsed = rpcOk<unknown>(response)
            if (!parsed.ok) throw new Error(parsed.message)
          }}
        />
      </div>
    )
  }

  return (
    <button type="button" className="dx-hit" style={handle} onClick={() => { ensureEditorOpen() }} title="打开 DirectorX 画布" aria-label="打开 DirectorX 画布">
      打开 DirectorX 画布
    </button>
  )
}
