import type { Context } from 'cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import type {} from '@deepseek-ai/dsh-tools'
import type {} from '@deepseek-ai/dsh-skill'
import type {} from '@deepseek-ai/dsh-system-prompt'
import type { DirectorxSettings } from './config.ts'
import { corpus } from './corpus.ts'
import { DirectorxCanvasStore } from './canvas.ts'
import { DirectorxEditLedger } from './edits.ts'
import { DirectorxTaskLedger } from './tasks.ts'
import { runAudio } from './providers/audio.ts'
import { extractFrames, probeMedia } from './providers/ffmpeg.ts'
import { runImage } from './providers/image.ts'
import { runTranscribe } from './providers/transcribe.ts'
import { runVideo } from './providers/video.ts'
import { runVision } from './providers/vision.ts'
import { audioBeats, audioMix, videoConcat, videoPip, videoProcess, videoSubtitle, videoZoom } from './providers/video-process.ts'
import { preflight } from './providers/preflight.ts'
import { audioSync, renderTimeline, subtitleCut } from './providers/timeline.ts'
import { videoUnderstand } from './providers/video-understand.ts'
import { ProposalStore } from './proposals.ts'
import { CharacterStore } from './characters.ts'
export {} // CharacterStore imported below

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
  return { settings, capability, signal, ledger: new DirectorxTaskLedger(settings.outputDir) }
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
        characters: { type: 'array', items: { type: 'string' }, description: 'Optional registered character names (directorx_character_register); their reference images and descriptions are injected automatically.' },
      },
      output: objectOutput(),
      timeoutMs: settings.timeoutMs,
      isConcurrencySafe: () => true,
      async execute(args: any, exec: any) {
        const signal = combinedSignal(exec.signal, settings.timeoutMs)
        const characterCards = await new CharacterStore(settings.outputDir).get(Array.isArray(args.characters) ? args.characters.map(String) : [])
        const refs = [...new Set([...(Array.isArray(args.reference_image_paths) ? args.reference_image_paths : []), ...characterCards.map(card => card.refPath)])]
        const characterNote = characterCards.map(card => `[角色卡 ${card.name}] ${card.description}`).join('；')
        const prompt = characterCards.length > 0 ? `${args.prompt}\n\n角色一致性锚点：${characterNote}` : args.prompt
        return runImage(toolContext(settings, settings.image, signal), prompt, {
          size: args.size,
          quality: args.quality,
          referenceImagePaths: refs,
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
        characters: { type: 'array', items: { type: 'string' }, description: 'Optional registered character names (directorx_character_register); their reference images and descriptions are injected automatically.' },
      },
      output: objectOutput(),
      timeoutMs: Math.max(settings.timeoutMs, settings.pollIntervalMs * settings.maxPollAttempts),
      async execute(args: any, exec: any) {
        const signal = combinedSignal(exec.signal, settings.timeoutMs)
        const characterCards = await new CharacterStore(settings.outputDir).get(Array.isArray(args.characters) ? args.characters.map(String) : [])
        const refs = [...new Set([...(Array.isArray(args.reference_image_paths) ? args.reference_image_paths : []), ...characterCards.map(card => card.refPath)])]
        const characterNote = characterCards.map(card => `[角色卡 ${card.name}] ${card.description}`).join('；')
        const prompt = characterCards.length > 0 ? `${args.prompt}\n\n角色一致性锚点：${characterNote}` : args.prompt
        return runVideo(toolContext(settings, settings.video, signal), prompt, {
          seconds: args.seconds,
          size: args.size,
          aspectRatio: args.aspect_ratio,
          resolution: settings.video.resolution,
          firstFramePath: args.first_frame_path,
          lastFramePath: args.last_frame_path,
          referenceImagePaths: refs,
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

    disposers.push(ctx.tools.register(defineTool({
      name: 'directorx_transcribe_audio',
      description: 'Transcribe a local audio/video file through a configurable OpenAI-compatible /audio/transcriptions endpoint (multipart). Supports json/text/srt output; srt transcripts are saved under the output dir for the subtitle pipeline. Configure the audio Base URL / API Key / model in DSH WebUI Settings → DirectorX (mock mode returns a deterministic transcript).',
      parameters: {
        source: { type: 'string', required: true, description: 'Absolute path of the local audio or video file to transcribe.' },
        format: { type: 'string', enum: ['json', 'text', 'srt'], description: 'Response format. Default json; choose srt for subtitles.' },
        language: { type: 'string', description: 'Optional ISO-639-1 language hint, e.g. "zh" or "en".' },
      },
      output: objectOutput(),
      timeoutMs: Math.max(settings.timeoutMs, 300_000),
      async execute(args: any, exec: any) {
        const signal = combinedSignal(exec.signal, settings.timeoutMs)
        return runTranscribe(toolContext(settings, settings.audio, signal), args.source, { language: args.language, format: args.format })
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

  // Task ledger tools: registered unconditionally (independent of capability
  // switches) so the agent can always inspect and stop generation tasks.
  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_task_status',
    description: 'Read the DirectorX task ledger (persisted under the output directory). Without task_id, returns the most recent tasks; with task_id, the latest transition. Use it to recover tasks whose original tool call timed out or whose session was interrupted.',
    parameters: {
      task_id: { type: 'string', description: 'Optional provider task id; omit to list recent tasks.' },
      limit: { type: 'number', description: 'Max tasks to list when task_id is omitted (default 10, max 50).' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    isConcurrencySafe: () => true,
    async execute(args: any, exec: any) {
      void exec
      const ledger = new DirectorxTaskLedger(settings.outputDir)
      const taskId = typeof args.task_id === 'string' ? args.task_id.trim() : ''
      if (taskId !== '') {
        const record = await ledger.latest(taskId)
        return record === undefined
          ? { task_id: taskId, found: false }
          : { task_id: taskId, found: true, task: record }
      }
      const limit = Math.min(50, Math.max(1, Math.round(args.limit ?? 10)))
      const records = await ledger.list()
      // Latest state per task id, newest first.
      const byId = new Map<string, (typeof records)[number]>()
      for (const record of records) byId.set(record.taskId, record)
      const tasks = [...byId.values()].reverse().slice(0, limit)
      return { tasks, count: byId.size }
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_cancel_task',
    description: 'Cancel an in-flight or orphaned DirectorX generation task by task id. An in-flight poll loop stops at its next ledger check; a task already succeeded is a no-op. The provider-side task may keep running remotely.',
    parameters: {
      task_id: { type: 'string', required: true, description: 'Provider task id from directorx_task_status or a previous generation result.' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    isConcurrencySafe: () => true,
    async execute(args: any) {
      const ledger = new DirectorxTaskLedger(settings.outputDir)
      const taskId = args.task_id.trim()
      if (taskId === '') throw new Error('directorx_cancel_task requires a non-empty task_id')
      const record = await ledger.cancel(taskId)
      return { task_id: taskId, task: record }
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_edits',
    description: 'List media files saved from the WebUI editor panel (image/video secondary edits). Returns absolute paths under the output directory that the agent can reference in further steps.',
    parameters: {
      limit: { type: 'number', description: 'Max edits to list (default 20, max 50).' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    isConcurrencySafe: () => true,
    async execute(args: any) {
      const ledger = new DirectorxEditLedger(settings.outputDir)
      const limit = Math.min(50, Math.max(1, Math.round(args.limit ?? 20)))
      return { edits: await ledger.list(limit) }
    },
  })))

  // Canvas CRUD tools: the agent owns the infinite canvas the same way the
  // WebUI does — every write goes through the durable canvas.json document.
  const canvas = new DirectorxCanvasStore(settings.outputDir)

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_canvas_get',
    description: 'Read the DirectorX infinite-canvas document (nodes and edges). Use it before mutating the canvas, or to answer questions about what is on it.',
    parameters: {},
    output: objectOutput(),
    timeoutMs: 30_000,
    isConcurrencySafe: () => true,
    async execute() {
      return canvas.read()
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_canvas_add',
    description: 'Add a node to the DirectorX canvas. kind: image|video|text|group. Media nodes reference a local output-dir path (from generation/edit results) or an http(s) URL; group nodes act as containers (pass their id as `parent` when adding members).',
    parameters: {
      kind: { type: 'string', enum: ['image', 'video', 'text', 'group'], required: true, description: 'Node kind.' },
      label: { type: 'string', description: 'Node label (shown under the preview).' },
      path: { type: 'string', description: 'Media path (local output-dir path or http(s) URL) for image/video nodes.' },
      x: { type: 'number', description: 'Canvas x position.' },
      y: { type: 'number', description: 'Canvas y position.' },
      parent: { type: 'string', description: 'Optional id of a group node to place this node inside.' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      return canvas.addNode(args)
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_canvas_connect',
    description: 'Connect two existing canvas nodes with an edge (optional label). Both endpoint ids must exist on the canvas.',
    parameters: {
      from: { type: 'string', required: true, description: 'Source node id.' },
      to: { type: 'string', required: true, description: 'Target node id.' },
      label: { type: 'string', description: 'Optional edge label.' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      return canvas.addEdge(args)
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_canvas_update',
    description: 'Update a canvas node or edge by id: move (x/y), resize (width/height), relabel, replace its media path, or move it into/out of a group (patch { parent: "<group id>" } or { parent: null }). Patch fields merge over the existing element.',
    parameters: {
      id: { type: 'string', required: true, description: 'Node or edge id from directorx_canvas_get.' },
      patch: { type: 'object', additionalProperties: true, description: 'Fields to change, e.g. { x: 100, y: 200 } or { label: "镜头 2" } or { parent: "group-xxx" }.' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      return canvas.update(args.id, args.patch ?? {})
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_canvas_remove',
    description: 'Remove a canvas node (its edges go with it) or a single edge by id.',
    parameters: {
      id: { type: 'string', required: true, description: 'Node or edge id to remove.' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      return canvas.remove(args.id)
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_canvas_arrange',
    description: '整理画布：auto-layout every node into a tidy grid (or a single row) while keeping all connections. Group members stay inside their group frames.',
    parameters: {
      layout: { type: 'string', enum: ['grid', 'row'], description: 'grid (default) or row.' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      return canvas.arrange(args.layout ?? 'grid')
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_canvas_replace',
    description: 'Replace the entire canvas document (full control): pass the complete nodes/edges arrays. Use with directorx_canvas_get to compose a new arrangement in one write.',
    parameters: {
      nodes: { type: 'array', items: { type: 'object', additionalProperties: true }, required: true, description: 'Complete replacement node list (same shape as canvas_get returns).' },
      edges: { type: 'array', items: { type: 'object', additionalProperties: true }, required: true, description: 'Complete replacement edge list.' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      const current = await canvas.read()
      return canvas.write({ version: 1, updatedAt: 0, nodes: args.nodes ?? [], edges: args.edges ?? [] }, current.updatedAt)
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_canvas_search',
    description: 'Search canvas nodes by label substring / kind / group membership. Use it to locate nodes before update/connect (avoid dumping the whole document).',
    parameters: {
      label: { type: 'string', description: 'Label substring (case-insensitive).' },
      kind: { type: 'string', enum: ['image', 'video', 'text', 'group'], description: 'Filter by kind.' },
      parent: { type: 'string', description: 'Filter by parent group id.' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      return canvas.search({ label: args.label, kind: args.kind, parent: args.parent })
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_canvas_batch',
    description: 'Batch add nodes (and optional edges) to the canvas in one write. nodes: [{kind, label, path?, parent?, x, y, width?, height?}]; edges: [{from, to, label?}]. Much cheaper than repeated canvas_add + canvas_connect calls.',
    parameters: {
      nodes: { type: 'array', items: { type: 'object', additionalProperties: true }, required: true, description: 'Nodes to add (same shape as canvas_add arguments).' },
      edges: { type: 'array', items: { type: 'object', additionalProperties: true }, description: 'Optional edges between existing/new node ids.' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      return canvas.batchAdd({ nodes: args.nodes ?? [], edges: args.edges ?? [] })
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_canvas_dissolve_group',
    description: 'Dissolve a group node: its members become top-level (absolute coordinates) and the group plus its edges are removed. Members are NOT deleted.',
    parameters: {
      groupId: { type: 'string', required: true, description: 'Group node id from directorx_canvas_get.' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      return canvas.dissolveGroup(String(args.groupId))
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_canvas_title',
    description: 'Set the canvas title (shown in the WebUI header).',
    parameters: {
      title: { type: 'string', required: true, description: 'New canvas title (max 200 chars).' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      return canvas.setTitle(String(args.title))
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_canvas_layout_hierarchy',
    description: 'Lay the canvas out as a left-to-right tree along edge direction (BFS levels; sources at left). Good for script->shot dependency boards.',
    parameters: {
      gapX: { type: 'number', description: 'Horizontal gap between levels (default 260).' },
      gapY: { type: 'number', description: 'Vertical gap between siblings (default 140).' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      return canvas.hierarchyLayout(args.gapX ?? 260, args.gapY ?? 140)
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_canvas_clear',
    description: 'Clear the entire canvas (removes every node and edge). Irreversible; read with directorx_canvas_get first when unsure.',
    parameters: {},
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute() {
      const current = await canvas.read()
      return canvas.write({ version: 1, updatedAt: 0, nodes: [], edges: [] }, current.updatedAt)
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_video_process',
    description: 'Deterministic local video processing with ffmpeg: trim (start/end seconds), speed change (0.5-8x), resize (scale like 1280:720 or 16:9), volume adjust, mute, and fps normalization — all in one call. Free and exact; prefer over regenerating. Output lands in the output dir.',
    parameters: {
      source: { type: 'string', required: true, description: 'Absolute path of the local video.' },
      start: { type: 'number', description: 'Trim start (seconds).' },
      end: { type: 'number', description: 'Trim end (seconds).' },
      speed: { type: 'number', description: 'Playback speed multiplier (0.5-8).' },
      scale: { type: 'string', description: 'Output size, e.g. 1280:720 or 16:9.' },
      volume: { type: 'number', description: 'Audio volume multiplier (e.g. 0.9).' },
      mute: { type: 'boolean', description: 'Strip the audio track.' },
      fps: { type: 'number', description: 'Normalize to this frame rate.' },
    },
    output: objectOutput(),
    timeoutMs: 600_000,
    isConcurrencySafe: () => true,
    async execute(args: any) {
      return videoProcess({ ...args, outputDir: settings.outputDir })
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_video_concat',
    description: 'Concatenate multiple local videos into one: normalizes size/fps/audio, then either hard cuts or xfade (cross-fade) transitions with audio acrossfade. Deterministic ffmpeg assembly for multi-shot deliverables. Output lands in the output dir.',
    parameters: {
      files: { type: 'array', items: { type: 'string' }, required: true, description: 'Absolute paths of 2+ local videos in order.' },
      transition: { type: 'string', enum: ['fade', 'cut'], description: 'fade = xfade cross-fade (default); cut = hard cuts.' },
      fadeSec: { type: 'number', description: 'Cross-fade duration (default 0.5s).' },
      scale: { type: 'string', description: 'Common output size (default 1280:720).' },
    },
    output: objectOutput(),
    timeoutMs: 900_000,
    isConcurrencySafe: () => true,
    async execute(args: any) {
      return videoConcat({ ...args, outputDir: settings.outputDir })
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_style',
    description: 'Style / camera-language injector grounded in the bundled film knowledge corpus. Give a style name or craft need (e.g. "赛博朋克", "黑色电影", "推镜头 霓虹光", "韦斯·安德森") and get the matching craft article condensed for prompt injection — append it to generation prompts to lock the look. Never fabricates: returns real corpus text.',
    parameters: {
      style: { type: 'string', required: true, description: 'Style name or craft need (Chinese or English). Preset slugs: noir/film-noir, cyberpunk, ghibli, wes-anderson, documentary, commercial, retro-80s, horror, cinematic.' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      const style = String(args.style ?? '').trim()
      if (style === '') throw new Error('style is required')
      // Preset slugs map to curated corpus queries for higher hit quality.
      const PRESETS: Record<string, string> = {
        noir: '黑色电影 低调光 阴影',
        'film-noir': '黑色电影 低调光 阴影',
        cyberpunk: '赛博朋克 霓虹 高对比',
        ghibli: '吉卜力 手绘 动画',
        'wes-anderson': '韦斯安德森 对称 复古',
        documentary: '纪录片 纪实 自然光',
        commercial: '广告 商业 产品打光',
        'retro-80s': '80年代 复古 胶片颗粒',
        horror: '恐怖片 黑暗 悬疑',
        cinematic: '电影感 运镜 浅景深',
      }
      const query = PRESETS[style.toLowerCase()] ?? style
      const hits = await corpus.search(query, 3)
      if (hits.length === 0) {
        return { style, found: false, hint: '未找到匹配的工艺文章；换一个风格/镜头语言关键词，或用 directorx_knowledge_search 直接检索。' }
      }
      const hit = hits[0]
      const article = await corpus.readArticle(hit.id)
      return {
        style,
        found: true,
        article: { id: article.article.id, title: article.article.title },
        guidance: article.content.slice(0, 3500),
        usage: '把 guidance 的关键词/句式并入生成提示词；可继续 directorx_knowledge_read 读全文。',
      }
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_audio_mix',
    description: 'Mix extra audio tracks (BGM / narration / SFX) onto a video with ffmpeg: per-track volume, optional sidechain ducking (music dips under the narration), normalized amix. Deterministic and free. Output lands in the output dir.',
    parameters: {
      video: { type: 'string', required: true, description: 'Absolute path of the video (or audio) to mix onto.' },
      tracks: { type: 'array', items: { type: 'object', additionalProperties: true }, required: true, description: 'Extra tracks in order, e.g. [{path, volume?}]; first track sits on top.' },
      duckUnder: { type: 'number', description: 'Duck later tracks under this track index (0-based; typically the narration).' },
    },
    output: objectOutput(),
    timeoutMs: 900_000,
    isConcurrencySafe: () => true,
    async execute(args: any) {
      return audioMix({ ...args, outputDir: settings.outputDir })
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_video_subtitle',
    description: 'Add subtitles to a local video with ffmpeg. mode=soft muxes the SRT as a selectable mov_text track (works with every ffmpeg build); mode=burn hard-burns the text into the frame (requires a libass build; degrades with a clear error otherwise). Output lands in the output dir.',
    parameters: {
      video: { type: 'string', required: true, description: 'Absolute path of the local video.' },
      srt: { type: 'string', required: true, description: 'Absolute path of the .srt subtitle file (e.g. from directorx_transcribe_audio).' },
      mode: { type: 'string', enum: ['soft', 'burn'], description: 'soft = selectable subtitle track (default); burn = hard-burned text.' },
    },
    output: objectOutput(),
    timeoutMs: 900_000,
    isConcurrencySafe: () => true,
    async execute(args: any) {
      return videoSubtitle({ ...args, outputDir: settings.outputDir })
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_preflight',
    description: 'Pre-flight audit before paid generation: the four gates from directorx-playbook (规格/内容/成本/权利) checked deterministically — parameter completeness, six-element prompt lint, budget acknowledgment, and IP/persona/music rights flags. Returns per-gate pass/issues plus a verdict. Use before any batch generation.',
    parameters: {
      prompt: { type: 'string', required: true, description: 'The generation prompt to audit.' },
      model: { type: 'string', description: 'Model key, if already chosen.' },
      type: { type: 'string', enum: ['image', 'video', 'audio'], description: 'Task type.' },
      size: { type: 'string', description: 'Size/aspect, e.g. 16:9.' },
      duration: { type: 'number', description: 'Duration in seconds (video).' },
      count: { type: 'number', description: 'Expected generation count (cost gate).' },
      userConfirmedBudget: { type: 'boolean', description: 'Whether the user already confirmed the budget.' },
      userConfirmedContent: { type: 'boolean', description: 'Whether the user already confirmed the script/prompt.' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      return preflight(args)
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_video_zoom',
    description: 'Ken Burns push-in/pull-back or pan on a local video: animated crop+scale (zoompan is absent from this ffmpeg build). strength = end scale delta (e.g. 0.3 -> 1.3x); direction in/out/left/right. Deterministic and free. Output lands in the output dir.',
    parameters: {
      video: { type: 'string', required: true, description: 'Absolute path of the local video.' },
      strength: { type: 'number', description: 'End scale delta (default 0.25).' },
      direction: { type: 'string', enum: ['in', 'out', 'left', 'right'], description: 'in = push-in (default); out = pull-back; left/right = pan.' },
    },
    output: objectOutput(),
    timeoutMs: 900_000,
    isConcurrencySafe: () => true,
    async execute(args: any) {
      return videoZoom({ ...args, outputDir: settings.outputDir })
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_video_pip',
    description: 'Picture-in-picture / sticker overlay: place an image or video on top of a video at a position/size, with an optional visibility window and alpha. Deterministic ffmpeg overlay. Output lands in the output dir.',
    parameters: {
      video: { type: 'string', required: true, description: 'Absolute path of the base video.' },
      overlay: { type: 'string', required: true, description: 'Absolute path of the overlay image/video.' },
      x: { type: 'number', description: 'Overlay x (default 20).' },
      y: { type: 'number', description: 'Overlay y (default 20).' },
      w: { type: 'number', description: 'Overlay width px (default 320; -1 keeps ratio via height).' },
      h: { type: 'number', description: 'Overlay height px (default -1 = keep ratio).' },
      enable: { type: 'array', items: { type: 'number' }, description: 'Optional [start, end] seconds visibility window.' },
      alpha: { type: 'number', description: 'Overlay opacity 0-1 (default 1).' },
    },
    output: objectOutput(),
    timeoutMs: 900_000,
    isConcurrencySafe: () => true,
    async execute(args: any) {
      return videoPip({ ...args, outputDir: settings.outputDir })
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_audio_beat',
    description: 'Detect beat/energy peaks in a local audio or video file (ffmpeg astats, deterministic — no librosa): returns up to N cut-point timestamps with strengths. Use the beats to time cuts in a montage (feed them into directorx_video_process trims + directorx_video_concat).',
    parameters: {
      source: { type: 'string', required: true, description: 'Absolute path of the audio/video to analyze.' },
      count: { type: 'number', description: 'Max beats returned (default 16).' },
      minGap: { type: 'number', description: 'Min gap between beats in seconds (default 0.4).' },
    },
    output: objectOutput(),
    timeoutMs: 300_000,
    isConcurrencySafe: () => true,
    async execute(args: any) {
      return audioBeats({ source: args.source, count: args.count, minGap: args.minGap })
    },
  })))

  const proposals = new ProposalStore(settings.outputDir)
  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_propose',
    description: 'Queue a fully-specified generation unit as a PLACEHOLDER proposal (manual/interaction control mode): stores the plan in proposals.json and does NOT spend any API quota. The user reviews the proposal list and approves; only approved proposals get executed with the real generation tools.',
    parameters: {
      kind: { type: 'string', enum: ['image', 'video', 'audio'], required: true, description: 'Generation kind.' },
      prompt: { type: 'string', required: true, description: 'Full generation prompt.' },
      model: { type: 'string', description: 'Model key, if chosen.' },
      size: { type: 'string', description: 'Size/aspect.' },
      duration: { type: 'number', description: 'Duration seconds (video/audio).' },
      count: { type: 'number', description: 'Generation count (default 1).' },
      estimatedCost: { type: 'string', description: 'Cost note (the plugin ships no price table — state the assumption).' },
      note: { type: 'string', description: 'Free-form note (continuity/anchors/references).' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      return proposals.propose({ ...args, count: args.count ?? 1 })
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_proposals',
    description: 'List generation proposals (the placeholder queue). Omit status for the latest across states; filter by proposed/approved/rejected/done.',
    parameters: {
      status: { type: 'string', enum: ['proposed', 'approved', 'rejected', 'done'], description: 'Optional status filter.' },
      limit: { type: 'number', description: 'Max entries (default 50).' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      return proposals.list(args.status, args.limit ?? 50)
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_proposal_update',
    description: 'Update a proposal status (proposed -> approved/rejected/done). Approving moves it to the execution queue; done marks it executed with its artifact.',
    parameters: {
      id: { type: 'string', required: true, description: 'Proposal id from directorx_proposals.' },
      status: { type: 'string', enum: ['proposed', 'approved', 'rejected', 'done'], required: true, description: 'New status.' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      return proposals.update(String(args.id), args.status)
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_video_understand',
    description: 'Understand a local video shot-by-shot: samples N frames (default 6), describes each through the configured vision capability, and returns probe metadata + per-frame descriptions. Degrades to frame paths + metadata when vision is unavailable (the agent can still reason over frames itself). Use for 拉片/复盘/素材理解 before editing.',
    parameters: {
      source: { type: 'string', required: true, description: 'Absolute path of the local video.' },
      frames: { type: 'number', description: 'Frame sample count (default 6, max 12).' },
      question: { type: 'string', description: 'Optional per-frame question override.' },
    },
    output: objectOutput(),
    timeoutMs: 900_000,
    async execute(args: any) {
      return videoUnderstand({
        source: String(args.source),
        outputDir: settings.outputDir,
        settings,
        vision: settings.vision,
        frames: args.frames,
        question: args.question,
      })
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_character_register',
    description: 'Register a character/subject anchor: a reference image + description stored in characters.json. Later generation calls can pass the character name via the `characters` parameter and the reference + description are injected automatically — the subject-consistency pattern used across multi-shot productions (Runway Gen-4 / Kling 3.0 subject reference).',
    parameters: {
      name: { type: 'string', required: true, description: 'Character name (unique; re-registering overwrites).' },
      description: { type: 'string', description: 'Appearance description (stable features only: hair/outfit/scars/props).' },
      refPath: { type: 'string', required: true, description: 'Reference image path (local output-dir media or http(s) URL).' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      return new CharacterStore(settings.outputDir).register({ name: String(args.name), description: args.description, refPath: String(args.refPath) })
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_character_list',
    description: 'List registered character anchors (names + descriptions + reference paths).',
    parameters: {},
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute() {
      return new CharacterStore(settings.outputDir).list()
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_timeline',
    description: 'Render a timeline JSON into a finished cut (OTIO-inspired subset — the editing agent\'s central format): scenes with per-scene trims, cross-fade/hard-cut concat, optional audio mixing with ducking, and subtitle muxing. Deterministic and re-renderable: change the plan, re-render, never re-generate. timeline = { scenes: [{source, trim?, transition?}], subtitle?, audio? [{path, volume?, duckUnder?}], scale? }.',
    parameters: {
      timeline: { type: 'object', additionalProperties: true, required: true, description: 'Timeline spec: scenes array + optional subtitle srt path, audio tracks, scale.' },
    },
    output: objectOutput(),
    timeoutMs: 1800_000,
    isConcurrencySafe: () => true,
    async execute(args: any) {
      const timeline = (args.timeline ?? {}) as { scenes?: unknown[]; subtitle?: string; audio?: unknown[]; scale?: string }
      return renderTimeline({
        scenes: Array.isArray(timeline.scenes) ? timeline.scenes as never[] : [],
        subtitle: timeline.subtitle,
        audio: Array.isArray(timeline.audio) ? timeline.audio as never[] : undefined,
        scale: timeline.scale,
      }, settings.outputDir)
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_audio_sync',
    description: '音画同出: detect narration speech boundaries (silencedetect), mix narration + optional BGM onto the video with ducking, and mux subtitles — returning speech intervals as timing anchors so scene cuts align with the voice track. Deterministic and free. Output lands in the output dir.',
    parameters: {
      video: { type: 'string', required: true, description: 'Absolute path of the base video.' },
      narration: { type: 'string', required: true, description: 'Narration audio path (e.g. from directorx_generate_audio).' },
      bgm: { type: 'string', description: 'Optional BGM audio path (mixed at 0.3, ducked under narration).' },
      srt: { type: 'string', description: 'Optional .srt subtitle path to mux.' },
    },
    output: objectOutput(),
    timeoutMs: 1800_000,
    isConcurrencySafe: () => true,
    async execute(args: any) {
      return audioSync({
        video: String(args.video),
        narration: String(args.narration),
        bgm: typeof args.bgm === 'string' ? args.bgm : undefined,
        srt: typeof args.srt === 'string' ? args.srt : undefined,
        outputDir: settings.outputDir,
      })
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_canvas_branch',
    description: 'Branch a canvas node into labelled variants for multi-version comparison (Sora 2 remix pattern): clones the source N times into a new「… 分支探索」group. Use it to keep every candidate on the board; pick the winner with directorx_canvas_update afterwards.',
    parameters: {
      nodeId: { type: 'string', required: true, description: 'Source node id to branch.' },
      variations: { type: 'array', items: { type: 'string' }, required: true, description: 'Variation labels, e.g. ["冷暖对比色调", "极致霓虹过曝", "低饱和胶片感"].' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      return canvas.branch(String(args.nodeId), Array.isArray(args.variations) ? args.variations.map(String) : [])
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_subtitle_cut',
    description: 'Cut a video at subtitle cue boundaries (FunClip-style 按文本打点剪辑): parses the SRT, optionally filters cues by a keyword, pads each window, merges overlaps, and renders the cut via the timeline pipeline. The talking-video/montage assembly step for caption-driven edits.',
    parameters: {
      video: { type: 'string', required: true, description: 'Absolute path of the local video.' },
      srt: { type: 'string', required: true, description: 'Absolute path of the .srt file (e.g. from directorx_transcribe_audio).' },
      include: { type: 'string', description: 'Only cut cues whose text contains this keyword.' },
      pad: { type: 'number', description: 'Padding seconds around each cue (default 0.15).' },
    },
    output: objectOutput(),
    timeoutMs: 1800_000,
    isConcurrencySafe: () => true,
    async execute(args: any) {
      return subtitleCut({
        video: String(args.video),
        srt: String(args.srt),
        outputDir: settings.outputDir,
        include: typeof args.include === 'string' ? args.include : undefined,
        pad: typeof args.pad === 'number' ? args.pad : undefined,
      })
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_probe_media',
    description: 'Probe a local media file with ffprobe: container format, duration, size, and per-stream details (codec, resolution, fps, audio channels). Use it to verify generated outputs or plan edits. Requires ffmpeg on PATH.',
    parameters: {
      source: { type: 'string', required: true, description: 'Absolute path of the local media file.' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    isConcurrencySafe: () => true,
    async execute(args: any) {
      return probeMedia(args.source)
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_extract_frames',
    description: 'Extract still frames from a local video with ffmpeg and save them as PNGs under the output dir (frames/). Use it with directorx_view_image for frame-level QA (the frame-qa workflow). Requires ffmpeg on PATH.',
    parameters: {
      source: { type: 'string', required: true, description: 'Absolute path of the local video file.' },
      at: { type: 'array', items: { type: 'number' }, description: 'Timestamps in seconds to capture one frame each; omit to sample evenly.' },
      count: { type: 'number', description: 'Evenly spaced frame count when `at` is omitted (default 4, max 24).' },
    },
    output: objectOutput(),
    timeoutMs: 120_000,
    isConcurrencySafe: () => true,
    async execute(args: any) {
      const files = await extractFrames(args.source, settings.outputDir, { at: args.at, count: args.count })
      return { source: args.source, files }
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
    ...(settings.audio.enabled ? ['directorx_generate_audio', 'directorx_transcribe_audio'] : []),
    'directorx_probe_media',
    'directorx_extract_frames',
  ]
  return ctx.systemPrompt.section({
    name: 'tool:directorx',
    order: 117,
    text: [
      '## DirectorX persona',
      '- You are DirectorX (DX), the AI film-director form of this assistant: a production lead who plans, confirms, generates, inspects, edits, and delivers visual media. The WebUI (canvas / editors / cards) is your working surface, not decoration.',
      '- Work style: triage every media request (simple → generate directly; complex → load `directorx-production-lead` and orchestrate); publish a plan before batch generation (cost guardrail); keep the user informed at unit granularity; answer in the user\'s language (Chinese by default).',
      '- The infinite canvas IS the storyboard: maintain the project on it with `directorx_canvas_*` — nodes are shots/assets, edges are handoffs, groups are acts. Mirror every significant plan there and mention canvas state in reports, so the user sees the same production view you work from.',
      '- Reporting: when delivering, state the node/shot list, artifact paths (or WebUI cards), canvas updates, and what is next. Base claims on tool results, never on promises.',
      '',
      '## DirectorX media tools',
      `Enabled capabilities: ${enabled.length === 0 ? 'none (open Settings → DirectorX to enable)' : enabled.join(', ')}.`,
      toolList.length > 0 ? `Available tools: ${toolList.join(', ')}.` : '',
      '',
      '- Before media generation, load the relevant DirectorX skill (`skill` tool) and search the knowledge corpus with `directorx_knowledge_search`; do not guess model capabilities. For production requests, load `directorx-production-lead` first and triage simple vs complex.',
      '- Keep prompts positive and physical; lock subject, style, light, lens, and continuity in writing before calling generation tools. Use `directorx_style` to inject grounded style/camera-language craft from the corpus instead of inventing looks.',
      '- Treat provider responses as authoritative: inspect returned paths/URLs/status before claiming completion.',
      '- Long async tasks persist in the task ledger: after a timeout or interruption, recover them with `directorx_task_status` and stop them with `directorx_cancel_task`; never blindly re-submit.',
      '- Agentic orchestration: for multi-unit goals, DERIVE the workflow yourself (materials + goal → stages → parallel vs serial → gates) and run it with the `workflow` tool; use `directorx-workflow` for the derivation protocol — built-in templates are prior art, not the default.',
      '- Frame-level QA: extract stills with `directorx_extract_frames`, then inspect them with `directorx_view_image` (multi-frame comparisons) before accepting a video result.',
      '- Subtitle pipeline: `directorx_transcribe_audio` (format srt) produces subtitle files the video editor can overlay; keep transcripts in the output dir for reuse.',
      '- If a tool fails with a Base URL / API Key / mode error, tell the user to open WebUI Settings → DirectorX and configure the matching capability.',
    ].filter(Boolean).join('\n'),
  })
}