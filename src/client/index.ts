import { DirectorxSettingsSection } from './DirectorxSettingsSection.tsx'
import { DirectorxToolRow, DIRECTORX_TOOLVIEW_KEYS } from './DirectorxToolRow.tsx'
import { EditorDock } from './EditorDock.tsx'
import { registerDirectorxSlash } from './directorx-command.ts'
import { closeEditor, editorSnapshot, openCanvas, openEditor, setEditorTab } from './editor.ts'

interface LayoutFace {
  openDetails(): void
  closeDetails(): void
  toggleSidebar(): void
}

interface ClientContext {
  get(name: string): unknown
  inject?(deps: string[], callback: (ctx: ClientContext) => void): void
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
export const inject = ['slots', 'connection', 'layout', 'sessions', 'command']

function optionalService(ctx: ClientContext, name: string): unknown {
  try {
    const rec = ctx as unknown as Record<string, unknown>
    return rec[name] ?? ctx.get(name)
  } catch {
    return undefined
  }
}

export function apply(ctx: ClientContext): void {
  const layout = (): LayoutFace | undefined => ctx.get('layout') as LayoutFace | undefined
  registerDirectorxSlash(ctx)

  const settingsCard = (name: 'settings.section' | 'settings.plugin.item') => {
    const connection = ctx.get('connection') as { api?: { settings?: unknown } } | undefined
    const binder = optionalService(ctx, 'settingsScope') as {
      bind?: (spec: { namespace: string }) => unknown
    } | undefined
    // rc.8 cards read the shared describe mirror via settingsScope. mutate
    // stays on the connection for nested secret-safe path writes.
    return ctx.slots.register({
      name,
      id: 'directorx',
      key: 'directorx',
      order: 30,
      label: 'DirectorX',
      inject: () => ({
        scope: binder?.bind?.({ namespace: 'directorx' }),
        api: connection?.api?.settings,
      }),
    }, DirectorxSettingsSection)
  }
  ctx.slots.inject('settings.section', () => settingsCard('settings.section'))
  ctx.slots.inject('settings.plugin.item', () => settingsCard('settings.plugin.item'))

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
  ctx.slots.inject('conversation.view', () =>
    ctx.slots.register({
      name: 'conversation.view',
      id: 'directorx-canvas',
      order: 40,
      label: 'DirectorX 画布',
      inject: () => ({
        connection: ctx.get('connection'),
        liveSessions: optionalService(ctx, 'sessions'),
      }),
    }, EditorDock),
  )

  // Debug/automation hook: lets console users (and browser tests) drive the
  // dock directly without a generation card.
  if (typeof window !== 'undefined' && window.__directorxEditor === undefined) {
    window.__directorxEditor = {
      open: (kind?: 'image' | 'video', path?: string) => {
        if (kind === 'image' || kind === 'video') openEditor(kind, path ?? '')
        else openCanvas()
      },
      close: () => { closeEditor() },
      setTab: (tab) => { setEditorTab(tab) },
      snapshot: editorSnapshot,
      // Debug probes.
      layoutKind: () => String(typeof layout()),
      openDetailsNow: () => layout()?.openDetails(),
      toggleSidebarNow: () => layout()?.toggleSidebar(),
    }
  }
}
