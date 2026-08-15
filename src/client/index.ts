import { DirectorxSettingsSection } from './DirectorxSettingsSection.tsx'

interface ClientContext {
  get(name: string): unknown
  slots: {
    inject(name: string, callback: () => () => void): void
    register(entry: {
      name: string
      id: string
      order: number
      label: string
      inject: () => { api: unknown }
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
}