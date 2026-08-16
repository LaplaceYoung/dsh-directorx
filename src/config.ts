import z from 'schemastery'

export const SETTINGS_NS = 'directorx'

export type CapabilityMode =
  | 'openai-chat'
  | 'openai-images'
  | 'openai-videos'
  | 'modelverse-tasks'
  | 'openai-tts'
  | 'kling'
  | 'runway'
  | 'minimax-h3'
  | 'kling-v3'
  | 'vidu'
  | 'veo'
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
  /** Mode-specific credentials and options (per-provider auth schemes). */
  auth: ModeAuth
}

/** Per-mode credential/option bag; every field defaults empty and stays secret where it names a credential. */
export interface ModeAuth {
  /** Kling (可灵) AccessKey for JWT signing. */
  klingAk: string
  /** Kling (可灵) SecretKey for JWT signing. */
  klingSk: string
  /** Runway API version header value, e.g. `2024-11-06`; empty = omit the header. */
  runwayVersion: string
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
export const VIDEO_MODES = ['openai-videos', 'modelverse-tasks', 'kling', 'kling-v3', 'runway', 'minimax-h3', 'vidu', 'veo', 'mock'] as const
export const AUDIO_MODES = ['openai-tts', 'mock'] as const

function modeAuth() {
  return z.object({
    klingAk: z.string().role('secret').default('').description('Kling 可灵 AccessKey（JWT 签名用，仅 kling 模式需要）。'),
    klingSk: z.string().role('secret').default('').description('Kling 可灵 SecretKey（JWT 签名用，仅 kling 模式需要）。'),
    runwayVersion: z.string().default('').description('Runway API 版本头（如 2024-11-06），留空则不发送该头。'),
  })
}

function capability(modes: readonly string[], mode: string, baseURL: string, model: string, resolution = '1K') {
  return z.object({
    enabled: z.boolean().default(true).description('Register and expose this capability to the agent.'),
    mode: z.union(modes as unknown as string[]).default(mode).description('Protocol used to reach the provider.'),
    baseURL: z.string().default(baseURL).description('Base URL, e.g. https://api.openai.com/v1.'),
    apiKey: z.string().role('secret').default('').description('API key; empty means local endpoint or env fallback.'),
    model: z.string().default(model).description('Model id.'),
    resolution: z.string().default(resolution).description('Provider-specific output tier.'),
    auth: modeAuth(),
  })
}

export const DirectorxSettings = z.object({
  outputDir: z.string().default('directorx_output').description('Directory under the current working directory for downloaded media.'),
  timeoutMs: z.number().step(1).min(1_000).max(3_600_000).default(120_000).description('HTTP timeout for one provider request.'),
  pollIntervalMs: z.number().step(1).min(500).max(60_000).default(5_000).description('Async task polling interval.'),
  maxPollAttempts: z.number().step(1).min(1).max(2_000).default(360).description('Maximum async task polling attempts.'),
  vision: capability(VISION_MODES, 'openai-chat', 'https://api.modelverse.cn/v1', 'gpt-5.6-luna'),
  image: capability(IMAGE_MODES, 'openai-images', 'https://api.modelverse.cn/v1', 'gpt-image-2'),
  video: capability(VIDEO_MODES, 'modelverse-tasks', 'https://api.modelverse.cn/v1', 'doubao-seedance-2-0-260128', '2K'),
  audio: capability(AUDIO_MODES, 'openai-tts', 'https://api.modelverse.cn/v1', 'gpt-4o-mini-tts'),
})