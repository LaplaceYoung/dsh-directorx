import { readFileSync } from 'node:fs'
import type { Context } from 'cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import type {} from '@deepseek-ai/dsh-tools'
import type {} from '@deepseek-ai/dsh-skill'
import type {} from '@deepseek-ai/dsh-system-prompt'
import type { DirectorxSettings } from './config.ts'
import { corpus } from './corpus.ts'
import { listMediaFiles } from './media-server.ts'
import { contactSheet } from './providers/contact-sheet.ts'
import { routeModel } from './model-matrix.ts'
import { ProjectStyleStore } from './style-constants.ts'
import { TermStore } from './terms.ts'
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
import { planStoryboard } from './providers/storyboard.ts'
import { qaCheck, videoAnalyze } from './providers/video-analyze.ts'
import { brief } from './providers/brief.ts'
import { audioSync, cleanSpeechText, clipRank, editsToScenes, estimateSpeech, parseEditInstructions, renderTimeline, smartCut, srtLint, srtNormalize, subtitleCut, weightedWidth } from './providers/timeline.ts'
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
        const characterNote = characterCards.map(card => `[角色卡 ${card.name}] ${card.description}${card.outfit !== undefined ? `；服装：${card.outfit}` : ''}${card.props !== undefined ? `；道具：${card.props}` : ''}`).join('；')
        const style = await new ProjectStyleStore(settings.outputDir).read()
        const styleNote = style !== null
          ? `风格常量：camera ${style.camera}；palette ${style.palette}；lighting ${style.lighting}${style.sceneAnchors.length > 0 ? `；场景锚点 ${style.sceneAnchors.join(' / ')}` : ''}`
          : ''
        const blocks = [characterCards.length > 0 ? `角色一致性锚点：${characterNote}` : '', styleNote].filter(block => block !== '')
        const prompt = blocks.length > 0 ? `${args.prompt}\n\n${blocks.join('；')}` : args.prompt
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
        negative_prompt: { type: 'string', description: 'Optional negative prompt (基线见 directorx-methodology 规则 26：模糊/解剖错误/水印/闪烁四类)。Provider 支持时透传（如 kling legacy）。' },
      },
      output: objectOutput(),
      timeoutMs: Math.max(settings.timeoutMs, settings.pollIntervalMs * settings.maxPollAttempts),
      async execute(args: any, exec: any) {
        const signal = combinedSignal(exec.signal, settings.timeoutMs)
        const characterCards = await new CharacterStore(settings.outputDir).get(Array.isArray(args.characters) ? args.characters.map(String) : [])
        const refs = [...new Set([...(Array.isArray(args.reference_image_paths) ? args.reference_image_paths : []), ...characterCards.map(card => card.refPath)])]
        const characterNote = characterCards.map(card => `[角色卡 ${card.name}] ${card.description}${card.outfit !== undefined ? `；服装：${card.outfit}` : ''}${card.props !== undefined ? `；道具：${card.props}` : ''}`).join('；')
        const style = await new ProjectStyleStore(settings.outputDir).read()
        const styleNote = style !== null
          ? `风格常量：camera ${style.camera}；palette ${style.palette}；lighting ${style.lighting}${style.sceneAnchors.length > 0 ? `；场景锚点 ${style.sceneAnchors.join(' / ')}` : ''}`
          : ''
        const blocks = [characterCards.length > 0 ? `角色一致性锚点：${characterNote}` : '', styleNote].filter(block => block !== '')
        const prompt = blocks.length > 0 ? `${args.prompt}\n\n${blocks.join('；')}` : args.prompt
        const negative = [typeof args.negative_prompt === 'string' ? args.negative_prompt : '', style?.negativeBaseline ?? ''].filter(part => part !== '').join(', ')
        return runVideo(toolContext(settings, settings.video, signal), prompt, {
          seconds: args.seconds,
          size: args.size,
          aspectRatio: args.aspect_ratio,
          resolution: settings.video.resolution,
          firstFramePath: args.first_frame_path,
          lastFramePath: args.last_frame_path,
          referenceImagePaths: refs,
          negativePrompt: negative !== '' ? negative : undefined,
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
        instructions: { type: 'string', description: 'Performance instructions (gpt-4o-mini-tts 官方七维：口音/情绪幅度/语调/模仿/语速/语气/耳语)。示例：「Speak in a calm documentary tone; pause before numbers; end sentences level.」不透传时表演走 text 标点协议（directorx-methodology 规则 92-99）。' },
        speed: { type: 'number', description: '语速（0.25-4.0，口播 1.0-1.2；极端值损害音质，微调优先靠文本节奏）。' },
      },
      output: objectOutput(),
      timeoutMs: settings.timeoutMs,
      async execute(args: any, exec: any) {
        const signal = combinedSignal(exec.signal, settings.timeoutMs)
        return runAudio(toolContext(settings, settings.audio, signal), args.text, { voice: args.voice, format: args.format, instructions: typeof args.instructions === 'string' ? args.instructions : undefined, speed: typeof args.speed === 'number' ? args.speed : undefined })
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
    name: 'directorx_canvas_brief',
    description: '节点自动简介（幂等缓存）：prompt-first——节点自带 prompt 直接返回；已有 aiBrief 返回缓存；否则若 vision 可用，对节点媒体调用 view_image 生成一句描述并缓存到节点 aiBrief；vision 不可用时确定性回退（label+路径元数据）。',
    parameters: {
      nodeId: { type: 'string', required: true, description: 'Target node id.' },
    },
    output: objectOutput(),
    timeoutMs: 120_000,
    async execute(args: any) {
      const doc = await canvas.read()
      const node = doc.nodes.find(candidate => candidate.id === String(args.nodeId))
      if (node === undefined) throw new Error(`canvas node "${args.nodeId}" not found`)
      if (node.prompt !== undefined && node.prompt !== '') return { nodeId: node.id, brief: node.prompt, source: 'prompt' }
      if (node.aiBrief !== undefined && node.aiBrief !== '') return { nodeId: node.id, brief: node.aiBrief, source: 'cache' }
      if (node.path !== undefined && settings.vision.enabled && settings.vision.mode !== 'mock') {
        try {
          const result = await runVision(toolContext(settings, settings.vision, AbortSignal.timeout(60_000)), node.path, '用一句话描述这张图的主体、场景与风格（50 字内）。')
          const brief = result.answer.slice(0, 500)
          await canvas.update(node.id, { aiBrief: brief })
          return { nodeId: node.id, brief, source: 'vision' }
        } catch {
          // fall through to deterministic fallback
        }
      }
      const fallback = node.label !== '' ? node.label : (node.kind === 'video' ? '视频素材（未描述）' : '图像素材（未描述）')
      return { nodeId: node.id, brief: fallback, source: 'fallback' }
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_canvas_prompt_for',
    description: '自动合成 prompt 上下文：沿入边回溯目标节点的上游（主体/参考图 ref_image_N 槽位/方向/标题），prompt-first（节点自带 prompt 压过自动简介）。返回结构化分块，LLM 合成生成提示词就在此基础上完成——画布状态到提示词的确定性一半。',
    parameters: {
      nodeId: { type: 'string', required: true, description: 'Target node id.' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      return canvas.promptFor(String(args.nodeId))
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_canvas_shot_order',
    description: '确定性排片：按显式 shotIndex（存储身份）排序镜头节点，未标的排后。顺序不用 LLM 猜——本工具返回即权威（节点坐标与连线不代表顺序）。',
    parameters: {
      groupId: { type: 'string', description: 'Optional parent group id; omit for top-level shots.' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      return canvas.shotSequence(typeof args.groupId === 'string' ? args.groupId : undefined)
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_canvas_summary',
    description: '紧凑画布上下文快照：白名单行格式（id|kind#shotIndex|label 截断 60 字|parent）——喂给 LLM 的画布上下文从全量 JSON 的 2-3k token 压到几百 token，静态前缀可吃缓存。',
    parameters: {},
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute() {
      return canvas.summary()
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
      // Defensive normalization: tolerate string shorthand (label-only) and
      // invalid kind values instead of failing the whole call.
      if (typeof args === 'string') return canvas.search({ label: args })
      const kind = args?.kind
      const validKinds = ['image', 'video', 'text', 'group']
      return canvas.search({
        label: typeof args?.label === 'string' ? args.label : undefined,
        kind: validKinds.includes(kind) ? kind : undefined,
        parent: typeof args?.parent === 'string' ? args.parent : undefined,
      })
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
    description: 'Style / camera-language injector grounded in the bundled film knowledge corpus plus research-derived style grammars. Give a style name or craft need (e.g. "赛博朋克", "黑色电影", "推镜头 霓虹光", "韦斯·安德森", "wong-kar-wai") and get the matching craft article condensed for prompt injection — append it to generation prompts to lock the look. Never fabricates: returns real corpus text or cited research grammars.',
    parameters: {
      style: { type: 'string', required: true, description: 'Style name or craft need (Chinese or English). Preset slugs: noir/film-noir, cyberpunk, ghibli, wes-anderson, documentary, commercial, retro-80s, horror, cinematic + research grammars wong-kar-wai / wes-anderson.' },
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
      // Research-derived style grammars (2026 research wave, cited sources):
      // anchor + palette + motion syntax + negative boundary in one block.
      const GRAMMARS: Record<string, { anchor: string; palette: string; motion: string; negative: string; source: string }> = {
        'wong-kar-wai': {
          anchor: 'in the visual language of Wong Kar-wai, shot by Christopher Doyle; 1970s-90s Hong Kong cinema nostalgia',
          palette: 'split-toned amber and emerald, sodium-yellow key from streetlamps, electric green spill from signage, cyan haze in mid-ground',
          motion: 'step-printed motion, low-frame-rate stutter, slow-shutter smear, speed-ramping, handheld micro-sway',
          negative: 'clean digital sharpness, even daylight, wide establishing shot, anamorphic flares, plastic skin, over-stabilized camera, symmetrical composition',
          source: 'invideo.io WKW style guide + OpenAI Cookbook',
        },
        'wes-anderson': {
          anchor: 'perfectly symmetrical Wes Anderson composition, pastel color palette, flat depth of field, soft light without hard shadows',
          palette: 'pastel macaron tones (powder blue, mint, cream, dusty pink), saturated accent colors',
          motion: 'Static camera, no movement; whip pans only for transitions; centered framing',
          negative: 'handheld shake, dutch angles, high contrast harsh shadows, dark moody lighting',
          source: 'VePrompts Wes Anderson template (Veo 3)',
        },
        cyberpunk: {
          anchor: 'cyberpunk megacity night, neon-noir aesthetic, rain-slick streets, holographic signage',
          palette: 'electric cyan and magenta neon against deep black, sodium-amber highlights, cool blue ambient haze',
          motion: 'slow dolly through neon reflections, shallow DOF, occasional handheld micro-sway in crowd scenes',
          negative: 'daylight, pastel palette, natural landscape, clean minimalism, bright even lighting',
          source: 'corpus 265 genre iconography + cyberpunk research grammar',
        },
        noir: {
          anchor: 'film noir aesthetics, 1940s-50s hardboiled cinema, low-key chiaroscuro',
          palette: 'monochrome-leaning low-key: deep blacks, single warm key, venetian blind shadow patterns',
          motion: 'static locked-off camera with slow push-ins, low angles, cigarette smoke drifting through the frame',
          negative: 'bright even lighting, saturated cheerful colors, high-key comedy lighting, modern clean interiors',
          source: 'corpus 265 genre iconography + noir research grammar',
        },
        documentary: {
          anchor: 'observational documentary realism, natural available light, handheld authenticity',
          palette: 'natural ungraded tones, neutral white balance, muted earth colors',
          motion: 'handheld follow with gentle sway, slow zooms for emphasis, locked-off interview frames',
          negative: 'cinematic color grading, studio lighting, smooth gimbal motion, stylized slow motion',
          source: 'corpus documentary preset + Ken Burns narration discipline (rule 5.2)',
        },
        commercial: {
          anchor: 'high-end commercial product cinematography, clean studio environment',
          palette: 'teal and orange commercial grade, crisp whites, product-color accent lighting',
          motion: 'slow dolly and orbit around the product, macro inserts, light leak transitions',
          negative: 'grainy footage, dirty surfaces, cluttered background, amateur handheld shake',
          source: 'corpus commercial preset + teal-orange research (rule 4.6)',
        },
        ghibli: {
          anchor: 'hand-painted Studio Ghibli-inspired animation, watercolor backgrounds, soft character design',
          palette: 'pastel watercolor washes, warm sunlight greens, sky blues with painted clouds',
          motion: 'gentle parallax pans, floating dust motes, wind through grass and hair',
          negative: 'photorealistic, 3D render, live action, sharp digital lines, harsh shadows',
          source: 'corpus ghibli preset + style-side locking (rule 27)',
        },
      }
      const grammar = GRAMMARS[style.toLowerCase()]
      if (grammar !== undefined) {
        return {
          style,
          found: true,
          grammar,
          guidance: `${grammar.anchor}；palette: ${grammar.palette}；motion: ${grammar.motion}；negative: ${grammar.negative}`,
          usage: '把 guidance 整段并入提示词（风格锚+色调+运动语法+负面锁四件套）；来源已注明。',
        }
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
      direction: { type: 'string', enum: ['in', 'out', 'left', 'right', 'tl', 'tr', 'bl', 'br'], description: 'in = push-in (default); out = pull-back; left/right/tl/tr/bl/br = pan（对角线）。' },
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
    name: 'directorx_proposal_next',
    description: '审批门循环：返回队列中最旧的一条待批准提案（或 null）。配合 directorx_proposal_update 逐条走 提案→批准→执行→完成 的人机审批环。',
    parameters: {},
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute() {
      return proposals.next()
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
      refPath: { type: 'string', required: true, description: 'Reference image path (local output-dir media or http(s) URL). 标准（Runway 官方）：自然均匀光 + 中性表情 + 中等画质（「空白画布」原则，便于跨场景改造）。' },
      outfit: { type: 'string', description: '组装式角色：服装描述（外观层，可单独换装不改身份）。' },
      props: { type: 'string', description: '组装式角色：随身道具描述（道具层，如武器/配饰）。' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      return new CharacterStore(settings.outputDir).register({ name: String(args.name), description: args.description, refPath: String(args.refPath), outfit: typeof args.outfit === 'string' ? args.outfit : undefined, props: typeof args.props === 'string' ? args.props : undefined })
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
    name: 'directorx_edit',
    description: '意图驱动剪辑：把自然语言剪辑指令（「去掉开头 2 秒」「只保留 3 到 10 秒」「5-8 秒放慢 2 倍」「整个倒放」）解析成确定性时间轴并渲染成片。多条指令按顺序应用（cut list 语义）。改指令=重渲染，零 API 成本。',
    parameters: {
      video: { type: 'string', required: true, description: 'Absolute path of the source video.' },
      edits: { type: 'array', items: { type: 'string' }, required: true, description: 'Natural-language edit instructions (or one string split by punctuation).' },
    },
    output: objectOutput(),
    timeoutMs: 1800_000,
    isConcurrencySafe: () => true,
    async execute(args: any) {
      const source = String(args.video)
      // Tolerate array or single-string edit payloads (schema-first, but
      // the harness may deliver either shape).
      const raw = Array.isArray(args.edits) ? args.edits.map(String) : typeof args.edits === 'string' && args.edits !== '' ? [args.edits] : []
      const instructions = raw.length === 1 ? raw[0].split(/[；;。]+/).map((piece: string) => piece.trim()).filter((piece: string) => piece !== '') : raw
      const probe = probeMedia(source)
      const commands = parseEditInstructions(instructions, probe.durationSec)
      const scenes = editsToScenes(commands, probe.durationSec).map(scene => ({ ...scene, source }))
      if (commands.length === 0) throw new Error('没有解析出可执行的剪辑指令（支持：去掉开头/结尾 N 秒、只保留 X 到 Y 秒、X-Y 秒变速 Z 倍、整个倒放）')
      if (scenes.length === 0) throw new Error(`剪辑窗口被裁剪为空（源时长 ${probe.durationSec}s，裁剪量超过可保留范围）——调整指令或换更长的素材`)
      const rendered = await renderTimeline({ scenes }, settings.outputDir)
      return { commands, timeline: scenes, path: rendered.path, steps: rendered.steps, probe: rendered.probe }
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
    name: 'directorx_storyboard',
    description: 'Storyboard duration planning (PenShot-inspired deterministic layer): allocates per-shot durations against model limits, clamps out-of-range values, fills unspecified shots toward the target, and checks continuity anchors (every shot must reference registered characters/scenes). Returns a generation-ready shot plan + issues.',
    parameters: {
      shots: { type: 'array', items: { type: 'object', additionalProperties: true }, required: true, description: 'Shot list: [{id?, description, seconds?}].' },
      targetSeconds: { type: 'number', description: 'Whole-film target (e.g. 30).' },
      maxShotSeconds: { type: 'number', description: 'Provider clamp (default 10).' },
      minShotSeconds: { type: 'number', description: 'Minimum shot duration (default 1).' },
      anchors: { type: 'object', additionalProperties: true, description: 'Continuity anchors: { characters: ["主角"], scenes: ["雨夜小巷"] }.' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      return planStoryboard({
        shots: Array.isArray(args.shots) ? args.shots as never[] : [],
        targetSeconds: args.targetSeconds,
        maxShotSeconds: args.maxShotSeconds,
        minShotSeconds: args.minShotSeconds,
        anchors: args.anchors as { characters?: string[]; scenes?: string[] } | undefined,
      })
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_video_analyze',
    description: 'Comprehensive deterministic video analysis (拉片): scene-cut detection (per-frame signalstats luminance deltas), per-shot segments with durations, representative frames, optional per-shot vision descriptions, and an audio loudness summary. Use before editing/recut decisions; base claims on the returned data.',
    parameters: {
      source: { type: 'string', required: true, description: 'Absolute path of the local video.' },
      cutThreshold: { type: 'number', description: 'Luminance delta threshold for cut detection (default 12).' },
      minShotSec: { type: 'number', description: 'Minimum shot length in seconds (default 0.4).' },
      describe: { type: 'boolean', description: 'Describe each shot via the vision capability (needs vision configured).' },
    },
    output: objectOutput(),
    timeoutMs: 1800_000,
    isConcurrencySafe: () => true,
    async execute(args: any) {
      return videoAnalyze({
        source: String(args.source),
        outputDir: settings.outputDir,
        settings,
        vision: settings.vision,
        cutThreshold: args.cutThreshold,
        minShotSec: args.minShotSec,
        describe: args.describe === true,
      })
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_brief',
    description: 'Intent understanding (意图分诊): turns a raw user request + materials into a structured production brief — type (口播/广告/混剪/剧情/MV/纪录片/分镜), platform & aspect ratio, target duration, style hints (mapped to directorx_style presets), registered character anchors, material classification — plus the one-shot clarification questions with recommended defaults (一次澄清协议) and a suggested flow shape. Use at the START of every production request to triage intent before planning.',
    parameters: {
      request: { type: 'string', required: true, description: 'The user\'s raw request text.' },
      materials: { type: 'array', items: { type: 'string' }, description: 'Optional local material paths (media files).' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      return brief({ request: String(args.request), materials: Array.isArray(args.materials) ? args.materials.map(String) : [], outputDir: settings.outputDir })
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_smart_cut',
    description: 'LLM 精剪（deterministic matcher）: the agent writes the narration script; this tool locates each sentence\'s best-matching subtitle cue (character-overlap scoring) in the source video and assembles the matched windows into a finished cut via the timeline pipeline. 智能成片 for 口播精剪/素材定位.',
    parameters: {
      video: { type: 'string', required: true, description: 'Absolute path of the source video.' },
      srt: { type: 'string', required: true, description: 'Absolute path of the .srt transcript (directorx_transcribe_audio).' },
      script: { type: 'array', items: { type: 'string' }, required: true, description: 'Script sentences (or one full text, split by punctuation).' },
      pad: { type: 'number', description: 'Padding seconds around each matched cue (default 0.15).' },
    },
    output: objectOutput(),
    timeoutMs: 1800_000,
    isConcurrencySafe: () => true,
    async execute(args: any) {
      return smartCut({
        video: String(args.video),
        srt: String(args.srt),
        script: Array.isArray(args.script) ? args.script.map(String) : [],
        outputDir: settings.outputDir,
        pad: typeof args.pad === 'number' ? args.pad : undefined,
      })
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_qa_report',
    description: 'One-call QC report card: runs directorx_qa against the brief and mirrors the verdict + per-check evidence + rule citations onto the canvas as a「质检｜…」text node. The standardized final-cut QA card for every deliverable.',
    parameters: {
      source: { type: 'string', required: true, description: 'Absolute path of the rendered video.' },
      expect: { type: 'object', additionalProperties: true, description: 'Expected brief: { targetSeconds?, aspectRatio?, hasAudio?, minShots?, maxShots?, rhythm?, asl? [min,max] }.' },
      title: { type: 'string', description: 'Optional report title (defaults to the file name).' },
    },
    output: objectOutput(),
    timeoutMs: 1800_000,
    isConcurrencySafe: () => true,
    async execute(args: any) {
      const expect = (args.expect ?? {}) as { targetSeconds?: number; aspectRatio?: string; hasAudio?: boolean; minShots?: number; maxShots?: number; rhythm?: boolean }
      const report = await qaCheck({ source: String(args.source), outputDir: settings.outputDir, expect }, settings, settings.vision)
      const name = typeof args.title === 'string' && args.title !== '' ? args.title : String(args.source).split('/').pop()
      const lines = [`质检｜${name}`, `verdict: ${report.verdict}`, ...report.checks.map(check => `${check.pass ? 'PASS' : 'FAIL'} ${check.name}: ${check.detail}`), '规则引用: directorx-methodology（节奏规则 2/10，黑帧白帧规则由确定性信号分析覆盖）']
      const doc = await canvas.read()
      const maxBottom = doc.nodes.reduce((max, node) => Math.max(max, node.y + (node.height ?? 120)), 0)
      const nodeId = `qc-${Date.now()}`
      const updatedDoc = await canvas.addNode({ id: nodeId, kind: 'text', label: lines.join('\n'), x: 0, y: maxBottom + 60, width: 420, height: 60 + report.checks.length * 40 })
      const node = updatedDoc.nodes.find(candidate => candidate.id === nodeId)
      return { qa: report, canvasNodeId: node?.id ?? nodeId }
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_qa',
    description: 'Deterministic final-cut QC gate (成片质检): checks duration vs target, aspect ratio, audio presence, shot-count sanity and loudness — built on videoAnalyze. Frame-level visual QA stays with directorx_extract_frames + directorx_view_image (frame-qa skill). Returns per-check pass/issues + verdict.',
    parameters: {
      source: { type: 'string', required: true, description: 'Absolute path of the rendered video.' },
      expect: { type: 'object', additionalProperties: true, description: 'Expected brief: { targetSeconds?, aspectRatio?, hasAudio?, minShots?, maxShots? }.' },
    },
    output: objectOutput(),
    timeoutMs: 1800_000,
    isConcurrencySafe: () => true,
    async execute(args: any) {
      const expect = (args.expect ?? {}) as { targetSeconds?: number; aspectRatio?: string; hasAudio?: boolean; minShots?: number; maxShots?: number }
      return qaCheck({ source: String(args.source), outputDir: settings.outputDir, expect }, settings, settings.vision)
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_clip_rank',
    description: 'Candidate clip ranking (素材定位): scores every subtitle cue against the script semantics (character overlap) and returns the ranked candidates for the agent to assemble into a cut — the scoring step of the ESA/NarratoAI 精剪 pipeline.',
    parameters: {
      srt: { type: 'string', required: true, description: 'Absolute path of the .srt transcript.' },
      script: { type: 'array', items: { type: 'string' }, required: true, description: 'Script sentences (or keyword groups) to match against.' },
      topN: { type: 'number', description: 'Max candidates (default 10).' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      return clipRank({ srt: String(args.srt), script: Array.isArray(args.script) ? args.script.map(String) : [], topN: args.topN })
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_media_list',
    description: '媒体资产库：列出输出目录下的全部媒体文件（顶层 + edited/frames/transcripts），含路径/类型/大小。用它在剪辑/混剪前盘点可用素材（素材盘点步），具体规格再对单个文件 directorx_probe_media。',
    parameters: {},
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute() {
      return listMediaFiles(settings.outputDir)
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_style_lock',
    description: '项目风格常量锁：camera / palette / lighting / sceneAnchors / negativeBaseline 一次定义存 style.json，之后每个生成提示词逐字复用同一段常量块（跨拍一致性靠复用常量文本，不靠每次重写）。',
    parameters: {
      camera: { type: 'string', description: '机位/镜头语言常量，如「35mm anamorphic, 浅景深, 静止或缓慢推轨」' },
      palette: { type: 'string', description: '色调常量，如「青橙分调, 琥珀高光, 3-5 个锚色」' },
      lighting: { type: 'string', description: '布光常量（光源方向/色温/阴影），如「左侧柔窗主光 5600K, 暖灯补光」' },
      sceneAnchors: { type: 'array', items: { type: 'string' }, description: '场景锚点列表（每场景的固定描述短句）' },
      negativeBaseline: { type: 'string', description: '负面基线（默认四类伪影 + 风格边界）' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      return new ProjectStyleStore(settings.outputDir).set({
        camera: typeof args.camera === 'string' ? args.camera : undefined,
        palette: typeof args.palette === 'string' ? args.palette : undefined,
        lighting: typeof args.lighting === 'string' ? args.lighting : undefined,
        sceneAnchors: Array.isArray(args.sceneAnchors) ? args.sceneAnchors.map(String) : undefined,
        negativeBaseline: typeof args.negativeBaseline === 'string' ? args.negativeBaseline : undefined,
      })
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_terms_set',
    description: '项目术语字典：设置术语 → 期望读法/写法（terms.json）。配音/字幕阶段按句命中注入——专有名词读音、品牌名大小写等跨集一致。',
    parameters: {
      entries: { type: 'array', items: { type: 'object', additionalProperties: true }, required: true, description: '[{term: 原文术语, reading: 期望读法/写法}]' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      return new TermStore(settings.outputDir).set(Array.isArray(args.entries) ? args.entries as never[] : [])
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_terms_match',
    description: '按句命中术语字典：返回文本中出现的术语及其期望读法（配音时写进 TTS 文本或 instructions）。',
    parameters: {
      text: { type: 'string', required: true, description: 'The narration/subtitle text to match against.' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      return new TermStore(settings.outputDir).match(String(args.text))
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_style_get',
    description: '读取当前项目的风格常量锁（style.json）。生成提示词时把返回字段逐字并入对应位置（camera/palette/lighting/sceneAnchors/negativeBaseline）。',
    parameters: {},
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute() {
      return new ProjectStyleStore(settings.outputDir).read()
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_contact_sheet',
    description: '接触表（素材盘点胶片带）：给一组片段各自抽中点帧，tile 成 N 列蒙太奇单图，一眼预览全部候选片段；产出可加入画布作为素材预览节点。',
    parameters: {
      sources: { type: 'array', items: { type: 'string' }, required: true, description: 'Absolute paths of the clips to preview.' },
      columns: { type: 'number', description: 'Grid columns (default 4, max 8).' },
    },
    output: objectOutput(),
    timeoutMs: 600_000,
    isConcurrencySafe: () => true,
    async execute(args: any) {
      return contactSheet({ sources: Array.isArray(args.sources) ? args.sources.map(String) : [], outputDir: settings.outputDir, columns: args.columns })
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_model_router',
    description: '模型能力表路由：按输入需求（时长/画幅/首尾帧/音画同出）过滤并排序可用视频模型，返回 eligible 列表 + 每模型的排除原因——参数组合问题在计划期暴露，不等到执行期失败。',
    parameters: {
      durationSec: { type: 'number', description: '目标时长（秒）。' },
      aspectRatio: { type: 'string', description: '目标画幅，如 16:9 / 9:16 / 1:1。' },
      needsFirstFrame: { type: 'boolean', description: '是否要求首帧输入。' },
      needsLastFrame: { type: 'boolean', description: '是否要求尾帧输入。' },
      needsAudio: { type: 'boolean', description: '是否要求音画同出（原生音频）。' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      return routeModel({
        durationSec: typeof args.durationSec === 'number' ? args.durationSec : undefined,
        aspectRatio: typeof args.aspectRatio === 'string' ? args.aspectRatio : undefined,
        needsFirstFrame: args.needsFirstFrame === true,
        needsLastFrame: args.needsLastFrame === true,
        needsAudio: args.needsAudio === true,
      })
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_srt_lint',
    description: 'SRT 规范化检查：把字幕质量标准变成确定性 lint——单行 ≤16 字、≤17 字/秒、单条最短 0.83s、序号/时间戳连续合法。翻译/本地化/成片前跑一遍，问题逐条带 cue 号与建议。',
    parameters: {
      srt: { type: 'string', required: true, description: 'Absolute path of the .srt file.' },
      maxLineChars: { type: 'number', description: '单行字数上限（默认 16）。' },
      maxCps: { type: 'number', description: '每秒字数上限（默认 17）。' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      return srtLint(readFileSync(String(args.srt), 'utf8'), { maxLineChars: args.maxLineChars, maxCps: args.maxCps })
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_srt_normalize',
    description: 'SRT 规范化（确定性）：间隙吞并（gap<1s 前条 end 延至下条 start）、最短展示时长延长（<2.5s，末条除外）、时间戳格式归一。配音对齐与成片前跑一遍，输出规范化后的 srt 文本与应用的改动清单。',
    parameters: {
      srt: { type: 'string', required: true, description: 'Absolute path of the .srt file.' },
      minDurationSec: { type: 'number', description: '最短展示时长（默认 2.5）。' },
      gapMergeSec: { type: 'number', description: '间隙吞并阈值（默认 1）。' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      return srtNormalize(readFileSync(String(args.srt), 'utf8'), { minDurationSec: args.minDurationSec, gapMergeSec: args.gapMergeSec })
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_speech_clean',
    description: '口播文本清理：删除括号噪声注释（(掌声)/[音乐] 类）、商标符号、破折号归一——SRT 文案转配音前的净化步骤。',
    parameters: {
      text: { type: 'string', required: true, description: 'The narration text to clean.' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      return { cleaned: cleanSpeechText(String(args.text)) }
    },
  })))

  disposers.push(ctx.tools.register(defineTool({
    name: 'directorx_speech_duration',
    description: '口播时长预估（确定性）：字数 ÷ 语言速率（zh 4.2/ja 4.0/ko 4.3/en 13.5 字每秒）+ 标点停顿罚时 → 秒数；传入 windowSec（字幕窗口）时给出 超窗/缩句建议。旁白与字幕窗口对齐的预算步骤。',
    parameters: {
      text: { type: 'string', required: true, description: 'The narration text.' },
      lang: { type: 'string', description: 'ISO-639-1 language (default zh).' },
      windowSec: { type: 'number', description: 'Optional subtitle window seconds to check against.' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      return estimateSpeech({ text: String(args.text), lang: typeof args.lang === 'string' ? args.lang : undefined }, typeof args.windowSec === 'number' ? args.windowSec : undefined)
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
      '- Craft decisions cite rules from `directorx-methodology` (成片结构/提示词工程/剪辑节奏/LLM 精剪速查); QC verdicts reference rule numbers.',
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