/**
 * Module-scoped editor dock state shared by the tool cards, the floating
 * dock handle, and the dock panel itself. A minimal external store keeps the
 * client bundle dependency-free (no state library): components subscribe
 * through `subscribeEditor` and read the latest snapshot.
 */

export type EditorKind = 'image' | 'video'
export type EditorTab = 'canvas' | EditorKind

export interface EditorSnapshot {
  open: boolean
  tab: EditorTab
  kind: EditorKind | null
  /** Local media path under the output dir; may be null while the dock is empty. */
  path: string | null
}

let snapshot: EditorSnapshot = { open: false, tab: 'canvas', kind: null, path: null }
const listeners = new Set<() => void>()

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
  for (const listener of [...listeners]) listener()
}

/** Open the dock with one media file queued for secondary editing. */
export function openEditor(kind: EditorKind, path: string): void {
  update({ open: true, tab: kind, kind, path })
}

/** Switch the active dock tab (canvas / image editor / video editor). */
export function setEditorTab(tab: EditorTab): void {
  update({ open: true, tab })
}

export function closeEditor(): void {
  update({ open: false })
}

/** Toggle from the floating handle: reopen with the last session when available. */
export function toggleEditor(): void {
  update({ open: !snapshot.open })
}
