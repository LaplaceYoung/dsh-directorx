import { DirectorxSettingsSection } from './DirectorxSettingsSection.tsx'
import { DirectorxToolRow, DIRECTORX_TOOLVIEW_KEYS } from './DirectorxToolRow.tsx'
import { EditorDock } from './EditorDock.tsx'
import { registerDirectorxSlash } from './directorx-command.ts'
import { closeEditor, editorSnapshot, openCanvas, openDirectorStage, openEditor, setEditorTab } from './editor.ts'

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
// alpha.1 gates scoped Remote namespaces behind their own service names
// (reading remote.session without injecting it throws "without inject").
export const inject = [
  'slots',
  'connection',
  'layout',
  'sessions',
  'remote',
  'remote.settings',
  'remote.session',
  'remote.workspace',
  'remote.commands',
  'settingsScope',
  'uiSession',
  'workspaces',
]

function optionalService(ctx: ClientContext, name: string): unknown {
  try {
    const rec = ctx as unknown as Record<string, unknown>
    return rec[name] ?? ctx.get(name)
  } catch {
    return undefined
  }
}

/**
 * Normalize the settings wire onto one face. alpha.1 hosts mount
 * `remote.settings` as a Typert Remote (positional args, direct values or
 * thrown TypertRemoteFailure); rc-era hosts served `connection.api.settings`
 * (single-request object wrapped in the {rpcId,result:{ok,value}} envelope).
 */
function adaptSettings(face: unknown, flavor: 'typert' | 'legacy'): unknown {
  const rec = face as {
    describe?: (...args: unknown[]) => Promise<unknown>
    mutate?: (...args: unknown[]) => Promise<unknown>
  } | undefined
  if (rec === undefined || typeof rec.describe !== 'function') return undefined
  if (flavor === 'typert') {
    return {
      describe: async () => rec.describe!(),
      mutate: async (request: { ns: string; ops: Array<{ op: string; path: string[]; value?: unknown }>; expectedRevision?: number }) =>
        rec.mutate!(request.ns, request.ops, request.expectedRevision),
    }
  }
  return rec
}

export function apply(ctx: ClientContext): void {
  const layout = (): LayoutFace | undefined => ctx.get('layout') as LayoutFace | undefined
  registerDirectorxSlash(ctx)
  const uiSession = optionalService(ctx, 'uiSession') as { pendingInteractions?: unknown } | undefined
  const pending = uiSession?.pendingInteractions

  const settingsCard = (name: 'settings.section' | 'settings.plugin.item') => {
    const remote = optionalService(ctx, 'remote') as { settings?: unknown } | undefined
    const connection = ctx.get('connection') as { api?: { settings?: unknown } } | undefined
    const binder = optionalService(ctx, 'settingsScope') as {
      bind?: (spec: { namespace: string }) => unknown
    } | undefined
    // Cards read the shared describe mirror via settingsScope on both host
    // generations. Writes prefer the alpha.1 Typert face, keeping the legacy
    // envelope seam for rc-era hosts.
    const api = remote?.settings !== undefined
      ? adaptSettings(remote.settings, 'typert')
      : adaptSettings(connection?.api?.settings, 'legacy')
    return ctx.slots.register({
      name,
      id: 'directorx',
      key: 'directorx',
      order: 30,
      label: 'DirectorX',
      inject: () => ({
        scope: binder?.bind?.({ namespace: 'directorx' }),
        api,
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
        connection: optionalService(ctx, 'connection'),
        liveSessions: optionalService(ctx, 'sessions'),
        remote: optionalService(ctx, 'remote'),
        workspaces: optionalService(ctx, 'workspaces'),
        pending,
      }),
    }, EditorDock),
  )

  if (typeof window !== 'undefined' && window.__directorxEditor === undefined) {
    window.__directorxEditor = {
      open: (kind?: 'image' | 'video', path?: string) => {
        if (kind === 'image' || kind === 'video') openEditor(kind, path ?? '')
        else openCanvas()
      },
      openDirectorStage,
      close: () => { closeEditor() },
      setTab: (tab: 'image' | 'video' | 'canvas') => { setEditorTab(tab) },
      snapshot: () => {
        const current = editorSnapshot()
        return { open: current.open, tab: current.tab, kind: current.kind, path: current.path }
      },
      layoutKind: () => String(typeof layout()),
      openDetailsNow: () => layout()?.openDetails(),
      toggleSidebarNow: () => layout()?.toggleSidebar(),
    }
  }
}
