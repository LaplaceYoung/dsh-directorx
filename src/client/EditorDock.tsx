import { useCallback, useEffect, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react'
import { closeEditor, editorSnapshot, subscribeEditor, toggleEditor } from './editor.ts'

/**
 * Floating handle only. The dock itself lives in the harness `details`
 * column (DirectorxDetailsDock) so it reflows the conversation like a
 * first-class layout column; this handle toggles that column.
 */

const handle: CSSProperties = {
  position: 'fixed',
  right: 0,
  top: '42%',
  padding: '10px 8px',
  writingMode: 'vertical-rl',
  border: '1px solid var(--dsw-alias-border-l2)',
  borderRight: 'none',
  borderRadius: '8px 0 0 8px',
  background: 'var(--dsw-alias-bg-overlay)',
  color: 'inherit',
  fontSize: 12,
  cursor: 'pointer',
  zIndex: 60,
  pointerEvents: 'auto',
}

export interface EditorDockProps {
  /** Drives the harness layout column open. */
  openDetails?: () => void
  /** Drives the harness layout column closed. */
  closeDetails?: () => void
}

function detailsColumnOpen(): boolean {
  const col = document.querySelector('[class*="detailsCol"]') as HTMLElement | null
  if (col === null) return false
  const rect = col.getBoundingClientRect()
  return rect.left < window.innerWidth - 48 && rect.width > 200
}

export function EditorDock(props: EditorDockProps): ReactNode {
  const snapshot = useSyncExternalStore(subscribeEditor, editorSnapshot)
  const [detailsOpen, setDetailsOpen] = useState(false)
  useEffect(() => {
    const check = () => setDetailsOpen(detailsColumnOpen())
    check()
    const timer = window.setInterval(check, 300)
    window.addEventListener('resize', check)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('resize', check)
    }
  }, [])
  const onClick = useCallback(() => {
    if (snapshot.open || detailsColumnOpen()) {
      closeEditor()
      props.closeDetails?.()
    } else {
      toggleEditor()
      props.openDetails?.()
    }
  }, [snapshot.open, props])

  if (detailsOpen) return null

  return (
    <button style={handle} onClick={onClick} title="DirectorX 编辑面板">
      DirectorX 编辑
    </button>
  )
}
