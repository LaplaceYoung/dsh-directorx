/**
 * Module-scoped editor dock state shared by the tool cards, the floating
 * dock handle, and the dock panel itself. A minimal external store keeps the
 * client bundle dependency-free (no state library): components subscribe
 * through `subscribeEditor` and read the latest snapshot.
 */

export type EditorKind = 'image' | 'video'
export type EditorTab = 'canvas' | EditorKind
export type WorkspaceKind = 'director-stage' | 'edit'

export interface EditorWorkspace {
  kind: WorkspaceKind
  nodeId: string
}

export interface EditorSnapshot {
  open: boolean
  tab: EditorTab
  kind: EditorKind | null
  /** Local media path under the output dir; may be null while the dock is empty. */
  path: string | null
  look?: string | null
  /** Canvas-node workspace (3D 导演台 / 剪辑台). Isolated per nodeId. */
  workspace: EditorWorkspace | null
}

let snapshot: EditorSnapshot = { open: false, tab: 'canvas', kind: null, path: null, look: null, workspace: null }
const listeners = new Set<() => void>()
const WORKSPACE_KEY = 'directorx-editor-workspace'

function persistWorkspace(workspace: EditorWorkspace | null): void {
  try {
    if (typeof sessionStorage === 'undefined') return
    if (workspace === null) sessionStorage.removeItem(WORKSPACE_KEY)
    else sessionStorage.setItem(WORKSPACE_KEY, JSON.stringify(workspace))
  } catch {
    // Private mode / non-browser — the in-memory snapshot still holds.
  }
}

function readPersistedWorkspace(): EditorWorkspace | null {
  try {
    if (typeof sessionStorage === 'undefined') return null
    const raw = sessionStorage.getItem(WORKSPACE_KEY)
    if (raw === null || raw === '') return null
    const parsed = JSON.parse(raw) as { kind?: unknown; nodeId?: unknown }
    if ((parsed.kind !== 'director-stage' && parsed.kind !== 'edit') || typeof parsed.nodeId !== 'string' || parsed.nodeId === '') return null
    return { kind: parsed.kind, nodeId: parsed.nodeId }
  } catch {
    return null
  }
}

/** Stable reference until the next update — required by useSyncExternalStore. */
export function editorSnapshot(): EditorSnapshot {
  return snapshot
}

export function subscribeEditor(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function update(next: Partial<EditorSnapshot>): void {
  snapshot = { ...snapshot, ...next }
  if ('workspace' in next) persistWorkspace(snapshot.workspace)
  for (const listener of [...listeners]) listener()
}

/** Restore the last 导演台 / 剪辑台 after the canvas dock remounts. */
export function hydrateEditorWorkspace(): void {
  if (snapshot.workspace !== null) return
  const stored = readPersistedWorkspace()
  if (stored !== null) update({ workspace: stored })
}

/** Open the fullscreen stage with one media file queued for editing. */
export function openEditor(kind: EditorKind, path: string, extras?: { look?: string }): void {
  update({ open: true, tab: kind, kind, path, look: extras?.look ?? null, workspace: null })
}

/** Open a 3D 导演台 canvas node. Each nodeId is an isolated project. */
export function openDirectorStage(nodeId?: string): void {
  if (nodeId === undefined || nodeId === '') {
    update({ open: true, tab: 'canvas' })
    return
  }
  update({ open: true, tab: 'canvas', kind: null, path: null, look: null, workspace: { kind: 'director-stage', nodeId } })
}

/** Open a 剪辑台 canvas node. Each nodeId is an isolated timeline. */
export function openEdit(nodeId?: string): void {
  if (nodeId === undefined || nodeId === '') {
    update({ open: true, tab: 'canvas' })
    return
  }
  update({ open: true, tab: 'canvas', kind: null, path: null, look: null, workspace: { kind: 'edit', nodeId } })
}

export function closeWorkspace(): void {
  update({ workspace: null, tab: 'canvas' })
}

/** Keep the conversation-view canvas mounted without wiping the last stage. */
export function ensureEditorOpen(): void {
  if (snapshot.open && snapshot.tab === 'canvas') return
  update({ open: true, tab: snapshot.tab === 'image' || snapshot.tab === 'video' ? snapshot.tab : 'canvas' })
}


export function openCanvas(): void {
  update({ open: true, tab: 'canvas', workspace: null })
}

/** Switch the active dock tab (canvas / image editor / video editor). */
export function setEditorTab(tab: EditorTab | 'director-stage' | 'edit'): void {
  if (tab === 'director-stage' || tab === 'edit') {
    update({ open: true, tab: 'canvas' })
    return
  }
  update({ open: true, tab, workspace: tab === 'canvas' ? null : snapshot.workspace })
}

export function closeEditor(): void {
  update({ open: false })
}

export function toggleEditor(): void {
  update({ open: !snapshot.open })
}
