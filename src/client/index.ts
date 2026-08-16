import { DirectorxSettingsSection } from './DirectorxSettingsSection.tsx'
import { DirectorxToolRow, DIRECTORX_TOOLVIEW_KEYS } from './DirectorxToolRow.tsx'
import { EditorDock } from './EditorDock.tsx'
import { DirectorxDetailsDock } from './DirectorxDetailsDock.tsx'
import { closeEditor, editorSnapshot, openEditor, setEditorTab } from './editor.ts'

interface LayoutFace {
  openDetails(): void
  closeDetails(): void
  toggleSidebar(): void
}

interface ClientContext {
  get(name: string): unknown
  slots: {
    inject(name: string, callback: () => (() => void) | void): void
    register(entry: {
      name: string
      id?: string
      key?: string
      order?: number
      label?: string
      priority?: number
      children?: Record<string, unknown>
      inject?: () => Record<string, unknown>
    }, component: unknown): () => void
  }
}

export const name = 'directorx-client'
export const inject = ['slots', 'connection', 'layout']

export function apply(ctx: ClientContext): void {
  const layout = (): LayoutFace | undefined => ctx.get('layout') as LayoutFace | undefined

  ctx.slots.inject('settings.section', () => {
    const connection = ctx.get('connection') as { api: { settings: unknown } } | undefined
    if (connection === undefined) return () => {}
    return ctx.slots.register({
      name: 'settings.section',
      id: 'directorx',
      order: 30,
      label: 'DirectorX',
      inject: () => ({ api: connection.api.settings }),
    }, DirectorxSettingsSection)
  })

  // Keyed tool cards: each DirectorX tool renders its own row in the chat
  // flow — the prompt/question while running, and the produced image/video/
  // audio (or the vision answer) inline once settled. Local media is served
  // by the host's `/directorx/media` route.
  ctx.slots.inject('tool.call.toolview', () => {
    const disposers = DIRECTORX_TOOLVIEW_KEYS.map(key =>
      ctx.slots.register({ name: 'tool.call.toolview', key }, DirectorxToolRow),
    )
    return () => {
      for (const dispose of disposers) dispose()
    }
  })

  // The dock occupies the harness `details` column: a first-class layout
  // column that squeezes the conversation instead of overlaying it. The
  // floating handle (shell.overlay) toggles the column via ctx.layout.
  ctx.slots.inject('details', () =>
    ctx.slots.register({
      name: 'details',
      priority: -1,
      inject: () => ({
        closeDetails: () => layout()?.closeDetails(),
        connection: ctx.get('connection'),
      }),
    }, DirectorxDetailsDock),
  )

  ctx.slots.inject('shell.overlay', () =>
    ctx.slots.register({
      name: 'shell.overlay',
      id: 'directorx-editor',
      order: 40,
      label: 'DirectorX 编辑',
      inject: () => ({
        openDetails: () => layout()?.openDetails(),
        closeDetails: () => layout()?.closeDetails(),
      }),
    }, EditorDock),
  )

  // Debug/automation hook: lets console users (and browser tests) drive the
  // dock directly without a generation card.
  if (typeof window !== 'undefined' && window.__directorxEditor === undefined) {
    window.__directorxEditor = {
      open: openEditor,
      close: () => { closeEditor(); layout()?.closeDetails() },
      setTab: (tab) => { setEditorTab(tab); layout()?.openDetails() },
      snapshot: editorSnapshot,
      // Debug probes.
      layoutKind: () => String(typeof layout()),
      openDetailsNow: () => layout()?.openDetails(),
      toggleSidebarNow: () => layout()?.toggleSidebar(),
    }
  }
}
