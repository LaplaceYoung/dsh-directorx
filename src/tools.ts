import type { Context } from 'cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import type {} from '@deepseek-ai/dsh-tools'
import type {} from '@deepseek-ai/dsh-skill'
import type {} from '@deepseek-ai/dsh-system-prompt'
import type { DirectorxSettings } from './config.ts'
import { corpus } from './corpus.ts'
import { runAudio } from './providers/audio.ts'
import { runImage } from './providers/image.ts'
import { runVideo } from './providers/video.ts'
import { runVision } from './providers/vision.ts'

function renderJson(_args: unknown, value: unknown) {
  return [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }]
}

function objectOutput() {
  return {
    schema: { type: 'object' as const, properties: {}, additionalProperties: true },
    render: renderJson,
  }
}

function combinedSignal(execSignal: AbortSignal, timeoutMs: number): AbortSignal {
  return AbortSignal.any([execSignal, AbortSignal.timeout(timeoutMs)])
}

function toolContext(settings: DirectorxSettings, capability: DirectorxSettings['vision'], signal: AbortSignal) {
  return { settings, capability, signal }
}

export function syncTools(ctx: Context, settings: DirectorxSettings): () => void {
  const disposers: Array<() => void> = []

  if (settings.vision.enabled) {
    disposers.push(ctx.tools.register(defineTool({
      name: 'directorx_view_image',
      description: 'Look at an image and answer a focused question about it. Accepts an absolute local file path, an http(s) URL, or a data: URL. Configure the vision Base URL / API Key / model in DSH WebUI Settings → DirectorX.',
      parameters: {
        source: { type: 'string', required: true, description: 'The image: absolute local file path, http(s) URL, or data: URL.' },
        question: { type: 'string', description: 'What to find out. Be specific. Default: a thorough visual description including text, layout, people, and notable details.' },
      },
      output: objectOutput(),
      timeoutMs: settings.timeoutMs,
      isConcurrencySafe: () => true,
      async execute(args: any, exec: any) {
        const signal = combinedSignal(exec.signal, settings.timeoutMs)
        const source = args.source.trim()
        const question = args.question?.trim() || 'Describe this image thoroughly. Include any visible text verbatim, the layout, people, objects, and notable details.'
        return runVision(toolContext(settings, settings.vision, signal), source, question)
      },
    })))
  }

  if (settings.image.enabled) {
    disposers.push(ctx.tools.register(defineTool({
      name: 'directorx_generate_image',
      description: 'Generate one or more images through a configurable OpenAI-compatible /images/generations endpoint or a ModelVerse tasks endpoint. Supports optional reference images in modelverse-tasks mode. Configure the image Base URL / API Key / model in DSH WebUI Settings → DirectorX.',
      parameters: {
        prompt: { type: 'string', required: true, description: 'Text-to-image prompt. Follow DirectorX prompting craft: subject, action, environment, style, light, lens.' },
        size: { type: 'string', description: 'Size such as 1024x1024, 1536x1024, or 1024x1536. Optional; provider defaults apply.' },
        quality: { type: 'string', enum: ['auto', 'low', 'medium', 'high'], description: 'Quality hint for providers that support it.' },
        reference_image_paths: { type: 'array', items: { type: 'string' }, description: 'Optional local paths or URLs used as image references (modelverse-tasks mode).' },
      },
      output: objectOutput(),
      timeoutMs: settings.timeoutMs,
      isConcurrencySafe: () => true,
      async execute(args: any, exec: any) {
        const signal = combinedSignal(exec.signal, settings.timeoutMs)
        return runImage(toolContext(settings, settings.image, signal), args.prompt, {
          size: args.size,
          quality: args.quality,
          referenceImagePaths: args.reference_image_paths,
        })
      },
    })))
  }

  if (settings.video.enabled) {
    disposers.push(ctx.tools.register(defineTool({
      name: 'directorx_generate_video',
      description: 'Generate an AI video through a configurable OpenAI /videos endpoint or a ModelVerse tasks endpoint. Supports first-frame, last-frame, and reference-image controls. Configure the video Base URL / API Key / model in DSH WebUI Settings → DirectorX.',
      parameters: {
        prompt: { type: 'string', required: true, description: 'DirectorX video prompt: physical action first, then camera, environment, style, lighting. Positive language; concrete motion.' },
        seconds: { type: 'number', description: 'Target duration in seconds. Provider clamps unknown values.' },
        size: { type: 'string', description: 'Output size for providers that accept it, e.g. 1280x720 or 1920x1080.' },
        aspect_ratio: { type: 'string', description: 'Aspect ratio such as 16:9, 9:16, 1:1 (modelverse-tasks mode).' },
        first_frame_path: { type: 'string', description: 'Optional first frame image path/URL for frame-locked generation.' },
        last_frame_path: { type: 'string', description: 'Optional last frame image path/URL for frame-locked transition.' },
        reference_image_paths: { type: 'array', items: { type: 'string' }, description: 'Optional reference image paths/URLs for character/appearance consistency.' },
      },
      output: objectOutput(),
      timeoutMs: Math.max(settings.timeoutMs, settings.pollIntervalMs * settings.maxPollAttempts),
      async execute(args: any, exec: any) {
        const signal = combinedSignal(exec.signal, settings.timeoutMs)
        return runVideo(toolContext(settings, settings.video, signal), args.prompt, {
          seconds: args.seconds,
          size: args.size,
          aspectRatio: args.aspect_ratio,
          resolution: settings.video.resolution,
          firstFramePath: args.first_frame_path,
          lastFramePath: args.last_frame_path,
          referenceImagePaths: args.reference_image_paths,
        })
      },
    })))
  }

  if (settings.audio.enabled) {
    disposers.push(ctx.tools.register(defineTool({
      name: 'directorx_generate_audio',
      description: 'Generate speech (and provider-supported music/audio) through a configurable OpenAI-compatible /audio/speech endpoint. Configure the audio Base URL / API Key / model in DSH WebUI Settings → DirectorX.',
      parameters: {
        text: { type: 'string', required: true, description: 'Text to synthesize. For music prompts, write the desired style, tempo, and instrumentation.' },
        voice: { type: 'string', description: 'Voice id such as alloy, echo, onyx, nova, or a provider-specific voice.' },
        format: { type: 'string', enum: ['mp3', 'wav', 'opus', 'aac'], description: 'Audio format. Default mp3.' },
      },
      output: objectOutput(),
      timeoutMs: settings.timeoutMs,
      async execute(args: any, exec: any) {
        const signal = combinedSignal(exec.signal, settings.timeoutMs)
        return runAudio(toolContext(settings, settings.audio, signal), args.text, { voice: args.voice, format: args.format })
      },
    })))
  }

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_knowledge_search',
    description: 'Search the bundled DirectorX film/AI-video knowledge corpus (350+ Chinese craft articles). Returns ranked article ids, titles, paths, and snippets. Call directorx_knowledge_read for the full article.',
    parameters: {
      query: { type: 'string', required: true, description: 'Search query, e.g. "图生视频 首尾帧 提示词" or "camera movement semantics".' },
      max_results: { type: 'number', description: 'Maximum results (default 8, max 20).' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    isConcurrencySafe: () => true,
    async execute(args: any) {
      const maxResults = Math.min(20, Math.max(1, Math.round(args.max_results ?? 8)))
      return { query: args.query, results: await corpus.search(args.query, maxResults) }
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_knowledge_read',
    description: 'Read one bundled DirectorX knowledge article by id, slug, numeric id, or package-relative path returned by directorx_knowledge_search.',
    parameters: {
      ref: { type: 'string', required: true, description: 'Article id/slug/path from directorx_knowledge_search, e.g. "114" or "ai-video-model-matrix".' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    isConcurrencySafe: () => true,
    async execute(args: any) {
      return corpus.readArticle(args.ref)
    },
  })))

  return () => {
    for (const dispose of disposers.reverse()) dispose()
  }
}

export function registerSystemPrompt(ctx: Context, settings: DirectorxSettings): () => void {
  const enabled = ['vision', 'image', 'video', 'audio']
    .filter(key => settings[key as keyof Pick<DirectorxSettings, 'vision' | 'image' | 'video' | 'audio'>].enabled)
  const toolList = [
    ...(settings.vision.enabled ? ['directorx_view_image'] : []),
    ...(settings.image.enabled ? ['directorx_generate_image'] : []),
    ...(settings.video.enabled ? ['directorx_generate_video'] : []),
    ...(settings.audio.enabled ? ['directorx_generate_audio'] : []),
  ]
  return ctx.systemPrompt.section({
    name: 'tool:directorx',
    order: 117,
    text: [
      '## DirectorX media tools',
      `Enabled capabilities: ${enabled.length === 0 ? 'none (open Settings → DirectorX to enable)' : enabled.join(', ')}.`,
      toolList.length > 0 ? `Available tools: ${toolList.join(', ')}.` : '',
      '',
      '- Before media generation, load the relevant DirectorX skill (`skill` tool) and search the knowledge corpus with `directorx_knowledge_search`; do not guess model capabilities.',
      '- Keep prompts positive and physical; lock subject, style, light, lens, and continuity in writing before calling generation tools.',
      '- Treat provider responses as authoritative: inspect returned paths/URLs/status before claiming completion.',
      '- If a tool fails with a Base URL / API Key / mode error, tell the user to open WebUI Settings → DirectorX and configure the matching capability.',
    ].filter(Boolean).join('\n'),
  })
}