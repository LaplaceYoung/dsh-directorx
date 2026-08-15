import { DirectorxSettingsSection } from './DirectorxSettingsSection.tsx'
import { DirectorxToolRow, DIRECTORX_TOOLVIEW_KEYS } from './DirectorxToolRow.tsx'
import { EditorDock } from './EditorDock.tsx'
import { closeEditor, editorSnapshot, openEditor } from './editor.ts'

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
      inject?: () => Record<string, unknown>
    }, component: unknown): () => void
  }
}

export const name = 'directorx-client'
export const inject = ['slots', 'connection']

export function apply(ctx: ClientContext): void {
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

  // Right-side editor dock: a frame-wide overlay with the image (PS-style)
  // and video (timeline) secondary editors, plus a floating handle.
  ctx.slots.inject('shell.overlay', () =>
    ctx.slots.register({ name: 'shell.overlay', id: 'directorx-editor', order: 40, label: 'DirectorX 编辑' }, EditorDock),
  )

  // Debug/automation hook: lets console users (and browser tests) drive the
  // dock directly without a generation card.
  if (typeof window !== 'undefined' && window.__directorxEditor === undefined) {
    window.__directorxEditor = { open: openEditor, close: closeEditor, snapshot: editorSnapshot }
  }
}
