import { fileURLToPath } from 'node:url'
import type { Context } from 'cordis'
import type { SettingsNamespace } from '@deepseek-ai/dsh-settings'
import type {} from '@deepseek-ai/dsh-settings'
import type {} from '@deepseek-ai/dsh-tools'
import type {} from '@deepseek-ai/dsh-skill'
import type {} from '@deepseek-ai/dsh-system-prompt'
import { DirectorxSettings, SETTINGS_NS, type DirectorxSettings as DirectorxSettingsType } from './config.ts'
import { corpus } from './corpus.ts'
import { registerCanvasResetRoute, registerCanvasRoute, registerMediaEditsRoute, registerMediaListRoute, registerMediaRoute, registerMediaTasksRoute, registerVendorRoute } from './media-server.ts'
import { registerBundledSkills } from './skills.ts'
import { registerSettingsTestRoute } from './settings-test.ts'
import { registerSubagentSetup } from './subagents.ts'
import { registerSystemPrompt, syncTools } from './tools.ts'

export { corpus } from './corpus.ts'
export { runAudio, mockAudio } from './providers/audio.ts'
export { runImage, mockImage } from './providers/image.ts'
export { runVideo, mockVideo } from './providers/video.ts'
export { runVision, mockVision } from './providers/vision.ts'

export const name = 'directorx'
export const inject = ['tools', 'skills', 'systemPrompt', 'settings', 'llm']

export function apply(ctx: Context): void {
  corpus.setRoot(fileURLToPath(new URL('../knowledge/', import.meta.url)))

  const namespace = SETTINGS_NS as SettingsNamespace
  const scope = ctx.settings.register(namespace, DirectorxSettings, {
    applies: 'live',
    validate(value) {
      for (const capability of [value.vision, value.image, value.video, value.audio]) {
        if (capability.enabled && capability.mode !== 'mock' && capability.baseURL.trim() === '') {
          throw new Error('An enabled DirectorX capability needs a non-empty Base URL (or choose mock mode).')
        }
      }
    },
  })

  // The Web API deliberately exposes only model-provider settings namespaces.
  // Registering the four capability profiles as configurable providers puts
  // the `directorx` namespace inside that boundary so the DirectorX WebUI
  // settings section can read and mutate it through settings.describe/mutate.
  const llm = ctx.get('llm') as {
    registerConfigurableProviders(entries: Array<{
      provider: string
      displayName: string
      settingsNs: string
      settingsPath: readonly string[]
      declared?: boolean
    }>): unknown
  }
  llm.registerConfigurableProviders([
    { provider: 'directorx-vision', displayName: 'DirectorX Vision', settingsNs: SETTINGS_NS, settingsPath: ['vision'], declared: true },
    { provider: 'directorx-image', displayName: 'DirectorX Image', settingsNs: SETTINGS_NS, settingsPath: ['image'], declared: true },
    { provider: 'directorx-video', displayName: 'DirectorX Video', settingsNs: SETTINGS_NS, settingsPath: ['video'], declared: true },
    { provider: 'directorx-audio', displayName: 'DirectorX Audio', settingsNs: SETTINGS_NS, settingsPath: ['audio'], declared: true },
  ])

  let disposeTools: (() => void) | undefined
  let disposePrompt: (() => void) | undefined

  const sync = (settings: DirectorxSettingsType): void => {
    disposeTools?.()
    disposePrompt?.()
    disposeTools = syncTools(ctx, settings)
    disposePrompt = registerSystemPrompt(ctx, settings)
  }

  sync(scope.get())
  ctx.effect(() => scope.watch(sync), 'directorx settings watch')
  ctx.effect(() => registerMediaRoute(ctx, () => scope.get().outputDir), 'directorx media route')
  ctx.effect(() => registerMediaEditsRoute(ctx, () => scope.get().outputDir), 'directorx media edits route')
  ctx.effect(() => registerMediaTasksRoute(ctx, () => scope.get().outputDir), 'directorx media tasks route')
  ctx.effect(() => registerMediaListRoute(ctx, () => scope.get().outputDir), 'directorx media list route')
  ctx.effect(() => registerCanvasRoute(ctx, () => scope.get().outputDir), 'directorx canvas route')
  ctx.effect(() => registerCanvasResetRoute(ctx, () => scope.get().outputDir), 'directorx canvas reset route')
  ctx.effect(() => registerVendorRoute(ctx), 'directorx vendor assets route')
  ctx.effect(() => registerSettingsTestRoute(ctx, () => scope.get() as DirectorxSettingsType), 'directorx settings test route')
  ctx.effect(() => registerSubagentSetup(ctx), 'directorx subagent setup')

  void registerBundledSkills(ctx).catch(error => {
    ctx.logger?.error('directorx: failed to register bundled skills: %s', error instanceof Error ? error.message : String(error))
  })
}