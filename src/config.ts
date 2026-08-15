import z from 'schemastery'

export const SETTINGS_NS = 'directorx'

export type CapabilityMode =
  | 'openai-chat'
  | 'openai-images'
  | 'openai-videos'
  | 'modelverse-tasks'
  | 'openai-tts'
  | 'mock'

export interface CapabilitySettings {
  /** Master switch. The matching DirectorX tool is only registered when true. */
  enabled: boolean
  /** Protocol/configuration mode. */
  mode: CapabilityMode
  /** OpenAI-compatible API base URL, including the version segment when applicable. */
  baseURL: string
  /** API key. Kept in the DSH credential/settings store; also falls back to env. */
  apiKey: string
  /** Model id used by this capability. */
  model: string
  /** Provider-specific output tier, e.g. 2K for MiniMax-H3 video tasks. */
  resolution: string
}

export interface DirectorxSettings {
  outputDir: string
  timeoutMs: number
  pollIntervalMs: number
  maxPollAttempts: number
  vision: CapabilitySettings
  image: CapabilitySettings
  video: CapabilitySettings
  audio: CapabilitySettings
}

export const VISION_MODES = ['openai-chat', 'mock'] as const
export const IMAGE_MODES = ['openai-images', 'modelverse-tasks', 'mock'] as const
export const VIDEO_MODES = ['openai-videos', 'modelverse-tasks', 'mock'] as const
export const AUDIO_MODES = ['openai-tts', 'mock'] as const

function capability(modes: readonly string[], mode: string, baseURL: string, model: string, resolution = '1K') {
  return z.object({
    enabled: z.boolean().default(true).description('Register and expose this capability to the agent.'),
    mode: z.union(modes as unknown as string[]).default(mode).description('Protocol used to reach the provider.'),
    baseURL: z.string().default(baseURL).description('Base URL, e.g. https://api.openai.com/v1.'),
    apiKey: z.string().role('secret').default('').description('API key; empty means local endpoint or env fallback.'),
    model: z.string().default(model).description('Model id.'),
    resolution: z.string().default(resolution).description('Provider-specific output tier.'),
  })
}

export const DirectorxSettings = z.object({
  outputDir: z.string().default('directorx_output').description('Directory under the current working directory for downloaded media.'),
  timeoutMs: z.number().step(1).min(1_000).max(3_600_000).default(120_000).description('HTTP timeout for one provider request.'),
  pollIntervalMs: z.number().step(1).min(500).max(60_000).default(5_000).description('Async task polling interval.'),
  maxPollAttempts: z.number().step(1).min(1).max(2_000).default(360).description('Maximum async task polling attempts.'),
  vision: capability(VISION_MODES, 'openai-chat', 'https://api.openai.com/v1', 'gpt-4o-mini'),
  image: capability(IMAGE_MODES, 'openai-images', 'https://api.openai.com/v1', 'gpt-image-1'),
  video: capability(VIDEO_MODES, 'openai-videos', 'https://api.openai.com/v1', 'sora-2', '2K'),
  audio: capability(AUDIO_MODES, 'openai-tts', 'https://api.openai.com/v1', 'gpt-4o-mini-tts'),
})