/**
 * ModelVerse catalog used by DirectorX settings and generate tools.
 * Chat/VL ids also live in ~/.dsh/settings.yaml so DSH can pick them.
 * Image / video / audio ids are what directorx_generate_* send to ModelVerse.
 */

export const MODELVERSE_BASE_URL = 'https://api.modelverse.cn/v1'

export const MODELVERSE_CHAT = [
  'gpt-5.6-luna',
  'gpt-5.6-sol',
  'gpt-5.6-terra',
  'gpt-4o-mini',
  'deepseek-v4-pro',
  'deepseek-v4-flash',
  'kimi-k2.6',
  'kimi-k3',
  'glm-5.2',
  'qwen3.7-max',
  'qwen3.7-plus',
  'qwen3.8-max',
  'MiniMax-M2.7',
  'MiniMax-M3',
] as const

export const MODELVERSE_VISION = [
  'gpt-5.6-luna',
  'glm-5v-turbo',
  'qwen3-vl-flash',
  'Qwen/Qwen3-vl-Plus',
  'Qwen/Qwen3-VL-235B-A22B-Instruct',
  'zai-org/glm-4.6v',
  'baidu/ernie-4.5-turbo-vl-32k',
] as const

export const MODELVERSE_IMAGE = [
  'gpt-image-2',
  'doubao-seedream-5-0-pro-260628',
  'doubao-seedream-5-0-260128',
  'doubao-seedream-4.5',
  'Qwen/Qwen-Image',
  'Qwen/Qwen-Image-Edit',
  'wan2.7-image-pro',
  'wan2.7-image',
] as const

export const MODELVERSE_VIDEO = [
  'MiniMax-H3',
  'kling-v3',
  'kling-v3-omni',
  'kling-v2-6',
  'kling-video-o1',
  'wan2.7-t2v',
  'wan2.7-i2v',
  'wan2.7-r2v',
  'viduq3-pro',
  'viduq3-turbo',
  'MiniMax-Hailuo-2.3',
  'MiniMax-Hailuo-2.3-Fast',
] as const

export const MODELVERSE_AUDIO = [
  'gpt-4o-mini-tts',
  'qwen3-tts-flash',
  'cicada-tts',
  'speech-2.8-hd',
  'speech-2.8-turbo',
  'IndexTeam/IndexTTS-2',
] as const

/**
 * DeepSeek first-party (official) endpoint. DSH 0.1.1-rc.1 publishes the
 * vision model `deepseek-v4-flash-vision-exp` (inputModalities text+image)
 * on the `deepseek-official` route; DirectorX reaches the same wire model
 * through its `deepseek-chat` vision mode.
 */
export const DEEPSEEK_PUBLIC_BASE_URL = 'https://api.deepseek.com'

export const DEEPSEEK_FIRST_PARTY_VISION = ['deepseek-v4-flash-vision-exp'] as const

export const MODELVERSE_BY_CAPABILITY = {
  vision: MODELVERSE_VISION,
  image: MODELVERSE_IMAGE,
  video: MODELVERSE_VIDEO,
  audio: MODELVERSE_AUDIO,
} as const
