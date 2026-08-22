import { readFileSync } from 'node:fs'
import type { Context } from 'cordis'
import type {} from '@deepseek-ai/dsh-tools'
import type {} from '@deepseek-ai/dsh-skill'
import type {} from '@deepseek-ai/dsh-system-prompt'
import type { DirectorxSettings } from './config.ts'
import { chengpianAskQuestions, chengpianPersonaText, parseInitiative, planPlaceholderEnqueue, resolveGenerateAuthorization, runChengpianEvent } from './persona.ts'
import { corpus } from './corpus.ts'
import { listMediaFiles } from './media-server.ts'
import { contactSheet } from './providers/contact-sheet.ts'
import { routeModel } from './model-matrix.ts'
import { generationPreset, listPresets } from './presets.ts'
import { buildShotPrompt, buildShotSequence, gateShotSequence } from './providers/shot-builder.ts'
import { ProjectStyleStore } from './style-constants.ts'
import { TermStore } from './terms.ts'
import { DirectorxCanvasStore } from './canvas.ts'
import { CanvasIntentStore, formatDshCanvasPromptForProject } from './canvas-intent.ts'
import { orchestrateProduction } from './orchestrate/run.ts'
import { formatCanvasShotlist } from './shotlist.ts'
import { confirmProduction } from './confirm.ts'
import { DirectorxEditLedger } from './edits.ts'
import { planEdit } from './edit-plan.ts'
import { commitBoundMedia, resolveBoundMedia } from './media-bind.ts'
import { DirectorxTaskLedger } from './tasks.ts'
import { runAudio } from './providers/audio.ts'
import { extractFrames, probeMedia } from './providers/ffmpeg.ts'
import { runImage } from './providers/image.ts'
import { imageProcess, parseRotate } from './providers/image-process.ts'
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
import { losslessJsonObject } from './support.ts'
import { commitIpRewrite, scanIpWithMemory } from './ip-memory.ts'
import { applyGrade, listGradeLabels, resolveGradeLook } from './providers/grade.ts'
import { withCharacterSheetSpec } from './providers/sheet-prompt.ts'
import { ResearchLedger } from './research-ledger.ts'
import { craftPrompt, isThinPrompt, requireCraft } from './prompt-craft.ts'
import { pinCharacterSetting, pinTextCard, formatStoryboardText, STORYBOARD_STAMP } from './canvas-text.ts'
import { planPrompt } from './prompt-plan.ts'
import { planProduction } from './production-flow.ts'
import {
  assessGenerateReady, commitGenerateReady, loadReadySnapshot, mergeReadyBind, parseStrategy, requireReady,
} from './generate-ready.ts'
import { StudioTicketStore } from './studio-intent.ts'
import { runInProject, sessionProjectRoot } from './project.ts'
import { normalizeAskQuestions, presentAsk, resolveHostAsk } from './ask.ts'
import { ProductionStageStore, parseStageId } from './stage.ts'
import { deliverCapture, extraSkillRoots, runSkillCapture } from './skill-capture.ts'
import { defaultSkillRoot, skillIndex } from './skill-index.ts'
import { NoteStore } from './notes.ts'
import { routeSkills, toolsForSkill } from './skill-route.ts'
import { articlesForSkill, skillsForArticle } from './craft-map.ts'
import { runBible } from './bible.ts'
import { checkShotVocab, listShotVocab, showShotVocab } from './shot-vocab.ts'
import { runCanvasCraft } from './canvas-craft.ts'
import { runSeries } from './series.ts'
import { planRevise } from './revise.ts'
import { runBlocking } from './blocking.ts'

import {
  adapterCapabilities,
  classifyProvider,
  commitProvider,
  draftProvider,
  ingestProvider,
  listProviders,
  resolveGenerateCapability,
  smokeProvider,
  type ApplyCapability,
} from './providers/provider-onboard.ts'
import type { AdapterCapability } from './providers/adapter-spec.ts'

function asJsonObject(value: unknown): Record<string, unknown> {
  return losslessJsonObject(value)
}

function renderJson(_args: unknown, value: unknown) {
  return [{ type: 'text' as const, text: JSON.stringify(asJsonObject(value), null, 2) }]
}

type ToolDefine = (def: Record<string, unknown>) => unknown

let defineRegistered: ToolDefine = def => def

function safeDefine(def: any) {
  const run = def.execute as (args: unknown, exec: unknown) => Promise<unknown>
  return defineRegistered({
    ...def,
    execute: async (args: never, exec: never) => {
      const root = sessionProjectRoot(exec)
      return runInProject(root, async () => asJsonObject(await run(args, exec)))
    },
  })
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

async function generationGate(
  settings: DirectorxSettings,
  store: ProposalStore,
  args: { prompt?: string; text?: string; proposalId?: string; craftId?: string; readyId?: string },
  kind?: 'image' | 'video',
) {
  const proposalId = typeof args.proposalId === 'string' ? args.proposalId.trim() : ''
  const proposal = proposalId === '' ? null : await store.get(proposalId)
  if (proposalId !== '' && proposal === null) {
    return { generate: false as const, prompt: '', reason: `proposal "${proposalId}" not found`, authorized: false, refused: true }
  }
  const craftId = typeof args.craftId === 'string' ? args.craftId : (proposal as { craftId?: string } | null)?.craftId
  const crafted = await requireCraft(settings.outputDir, craftId)
  if (!crafted.ok) {
    return { generate: false as const, prompt: '', reason: crafted.reason, authorized: false, refused: true, next: crafted.next }
  }
  const readyId = typeof args.readyId === 'string' ? args.readyId : (proposal as { readyId?: string } | null)?.readyId
  if (kind === 'image' || kind === 'video') {
    const ready = await requireReady(settings.outputDir, readyId, { craftId: crafted.craft.id, kind })
    if (!ready.ok) {
      return { generate: false as const, prompt: '', reason: ready.reason, authorized: false, refused: true, next: ready.next }
    }
    const auth = resolveGenerateAuthorization({
      mode: settings.initiative,
      prompt: crafted.craft.prompt,
      inBudget: true,
      proposal,
    })
    const thin = isThinPrompt(crafted.craft.intent, auth.prompt)
    if (thin !== undefined) {
      return {
        generate: false as const,
        prompt: auth.prompt,
        reason: thin,
        authorized: false,
        refused: true,
        next: 'directorx_prompt_plan → directorx_prompt_craft。占位必须是导演成稿，不能是角度标签或原句。',
      }
    }
    const scanned = await scanIpWithMemory(settings.outputDir, auth.prompt)
    if (scanned.brief.dirty) {
      return {
        generate: false as const,
        prompt: auth.prompt,
        reason: '成稿仍含 IP 专名',
        authorized: false,
        refused: true,
        ip: scanned.brief,
        memory: scanned.memory,
        next: scanned.brief.next,
      }
    }
    const intentScan = await scanIpWithMemory(settings.outputDir, crafted.craft.intent)
    const extras = [...intentScan.brief.exclude, ...intentScan.memory.flatMap(entry => entry.exclude)]
    return {
      ...auth,
      ready: ready.brief,
      ip: intentScan.brief,
      memory: intentScan.memory,
      negativeExtra: intentScan.brief.dirty || extras.length > 0
        ? [crafted.craft.negative, intentScan.brief.negativeLine].filter(part => part !== undefined && part !== '').join(', ')
        : (crafted.craft.negative ?? ''),
    }
  }
  const auth = resolveGenerateAuthorization({
    mode: settings.initiative,
    prompt: crafted.craft.prompt,
    inBudget: true,
    proposal,
  })
  const scanned = await scanIpWithMemory(settings.outputDir, auth.prompt)
  if (scanned.brief.dirty) {
    return {
      generate: false as const,
      prompt: auth.prompt,
      reason: '成稿仍含 IP 专名',
      authorized: false,
      refused: true,
      ip: scanned.brief,
      memory: scanned.memory,
      next: scanned.brief.next,
    }
  }
  return { ...auth, ip: scanned.brief, memory: scanned.memory, negativeExtra: crafted.craft.negative ?? '' }
}

function toolContext(settings: DirectorxSettings, capability: DirectorxSettings['vision'], signal: AbortSignal, adapter?: import('./providers/adapter-spec.ts').AdapterSpec) {
  return { settings, capability, signal, ledger: new DirectorxTaskLedger(settings.outputDir), adapter }
}

async function generateContext(
  settings: DirectorxSettings,
  capability: AdapterCapability,
  signal: AbortSignal,
  modelOverride?: string,
) {
  const resolved = await resolveGenerateCapability(settings, capability, modelOverride)
  return toolContext(settings, resolved.capability, signal, resolved.spec)
}

export function syncTools(ctx: Context, settings: DirectorxSettings, applyCapability?: ApplyCapability, define: ToolDefine = def => def): () => void {
  const previous = defineRegistered
  defineRegistered = define
  const disposers: Array<() => void> = []
  const proposals = new ProposalStore(settings.outputDir)

  if (settings.vision.enabled) {
    disposers.push(ctx.tools.register(safeDefine({
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
    disposers.push(ctx.tools.register(safeDefine({
      name: 'directorx_generate_image',
      description: 'Generate images. 必须带 craftId 和 readyId。先 generate_ready 判定设定图/场景/关键帧是否齐。禁止用画布短句当提示词。角色/设定/三视图按 novel-characters 设定表。严格/协同还要已批准 proposalId。',
      parameters: {
        prompt: { type: 'string', required: true, description: 'Text-to-image prompt. 角色设定写清半身基准+正侧背三视图同一人。Follow subject, action, environment, style, light, lens.' },
        size: { type: 'string', description: 'Size such as 1024x1024, 1536x1024, or 1024x1536. Optional; provider defaults apply.' },
        quality: { type: 'string', enum: ['auto', 'low', 'medium', 'high'], description: 'Quality hint for providers that support it.' },
        reference_image_paths: { type: 'array', items: { type: 'string' }, description: 'Optional local paths or URLs used as image references (edits / modelverse-tasks).' },
        characters: { type: 'array', items: { type: 'string' }, description: 'Optional registered character names (directorx_character_register); their reference images and descriptions are injected automatically.' },
        model: { type: 'string', description: 'Optional model id. Overrides Settings for this call; user-onboarded adapters are resolved from the project catalog.' },
        craftId: { type: 'string', required: true, description: 'directorx_prompt_craft 返回的 id。未调研成稿禁止生成。' },
        readyId: { type: 'string', required: true, description: 'directorx_generate_ready 返回的 id。参考不齐禁止生成。' },
        proposalId: { type: 'string', description: 'Approved proposal id. 严格/协同 must pass this after 审阅; unsolicited generate is refused.' },
      },
      output: objectOutput(),
      timeoutMs: settings.timeoutMs,
      isConcurrencySafe: () => true,
      async execute(args: any, exec: any) {
        const gate = await generationGate(settings, proposals, args, 'image')
        if (!gate.generate) {
          return { ...gate, refused: true, next: (gate as { next?: string }).next ?? (gate.authorized ? 'directorx_propose' : '先 directorx_prompt_craft → directorx_generate_ready') }
        }
        const signal = combinedSignal(exec.signal, settings.timeoutMs)
        const bind = 'ready' in gate && gate.ready !== undefined
          ? mergeReadyBind(gate.ready, args)
          : { characters: Array.isArray(args.characters) ? args.characters.map(String) : [], referenceImages: Array.isArray(args.reference_image_paths) ? args.reference_image_paths.map(String) : [] }
        const characterCards = await new CharacterStore(settings.outputDir).get(bind.characters)
        const refs = [...new Set([...bind.referenceImages, ...characterCards.map(card => card.refPath)])]
        const characterNote = characterCards.map(card => `[角色卡 ${card.name}] ${card.description}${card.outfit !== undefined ? `；服装：${card.outfit}` : ''}${card.props !== undefined ? `；道具：${card.props}` : ''}`).join('；')
        const style = await new ProjectStyleStore(settings.outputDir).read()
        const styleNote = style !== null
          ? `风格常量：camera ${style.camera}；palette ${style.palette}；lighting ${style.lighting}${style.sceneAnchors.length > 0 ? `；场景锚点 ${style.sceneAnchors.join(' / ')}` : ''}`
          : ''
        const blocks = [characterCards.length > 0 ? `角色一致性锚点：${characterNote}` : '', styleNote].filter(block => block !== '')
        const base = withCharacterSheetSpec(blocks.length > 0 ? `${gate.prompt}\n\n${blocks.join('；')}` : gate.prompt)
        const avoid = 'negativeExtra' in gate && typeof gate.negativeExtra === 'string' && gate.negativeExtra !== ''
          ? `\n避免：${gate.negativeExtra}`
          : ''
        const prompt = `${base}${avoid}`
        return runImage(await generateContext(settings, 'image', signal, typeof args.model === 'string' ? args.model : undefined), prompt, {
          size: args.size,
          quality: args.quality,
          referenceImagePaths: refs,
        })
      },
    })))
  }

  if (settings.video.enabled) {
    disposers.push(ctx.tools.register(safeDefine({
      name: 'directorx_generate_video',
      description: 'Generate video. 必须带 craftId 和 readyId。先 generate_ready：有人物要设定图，有场景要空镜，连续镜要首帧/上一镜末帧，转场要首尾帧。禁止原文直出。音画同出优先原生音频模型。',
      parameters: {
        prompt: { type: 'string', required: true, description: 'DirectorX video prompt: physical action first, then camera, environment, style, lighting. Positive language; concrete motion.' },
        seconds: { type: 'number', description: 'Target duration in seconds. Provider clamps unknown values.' },
        size: { type: 'string', description: 'Output size for providers that accept it, e.g. 1280x720 or 1920x1080.' },
        aspect_ratio: { type: 'string', description: 'Aspect ratio such as 16:9, 9:16, 1:1 (modelverse-tasks mode).' },
        first_frame_path: { type: 'string', description: 'First frame. ready 已绑定时可省略。' },
        last_frame_path: { type: 'string', description: 'Last frame for fl2v. ready 已绑定时可省略。' },
        reference_image_paths: { type: 'array', items: { type: 'string' }, description: 'Optional reference image paths/URLs for character/appearance consistency.' },
        characters: { type: 'array', items: { type: 'string' }, description: 'Optional registered character names (directorx_character_register); their reference images and descriptions are injected automatically.' },
        negative_prompt: { type: 'string', description: 'Optional negative prompt (基线见 directorx-methodology 规则 26：模糊/解剖错误/水印/闪烁四类)。Provider 支持时透传（如 kling legacy）。' },
        model: { type: 'string', description: 'Optional model id. Overrides Settings for this call; user-onboarded adapters are resolved from the project catalog.' },
        craftId: { type: 'string', required: true, description: 'directorx_prompt_craft 返回的 id。画布短句不是提示词。' },
        readyId: { type: 'string', required: true, description: 'directorx_generate_ready 返回的 id。参考不齐禁止生成。' },
        proposalId: { type: 'string', description: 'Approved proposal id. 严格/协同 must pass this after 审阅; unsolicited generate is refused.' },
      },
      output: objectOutput(),
      timeoutMs: Math.max(settings.timeoutMs, settings.pollIntervalMs * Math.min(settings.maxPollAttempts, 120)),
      async execute(args: any, exec: any) {
        const gate = await generationGate(settings, proposals, args, 'video')
        if (!gate.generate) {
          return { ...gate, refused: true, next: (gate as { next?: string }).next ?? '先 directorx_prompt_craft → directorx_generate_ready' }
        }
        const budget = Math.max(settings.timeoutMs, settings.pollIntervalMs * Math.min(settings.maxPollAttempts, 120))
        const signal = combinedSignal(exec.signal, budget)
        const bind = 'ready' in gate && gate.ready !== undefined
          ? mergeReadyBind(gate.ready, args)
          : {
              characters: Array.isArray(args.characters) ? args.characters.map(String) : [],
              referenceImages: Array.isArray(args.reference_image_paths) ? args.reference_image_paths.map(String) : [],
              firstFrame: typeof args.first_frame_path === 'string' ? args.first_frame_path : undefined,
              lastFrame: typeof args.last_frame_path === 'string' ? args.last_frame_path : undefined,
            }
        const characterCards = await new CharacterStore(settings.outputDir).get(bind.characters)
        const refs = [...new Set([...bind.referenceImages, ...characterCards.map(card => card.refPath)])]
        const characterNote = characterCards.map(card => `[角色卡 ${card.name}] ${card.description}${card.outfit !== undefined ? `；服装：${card.outfit}` : ''}${card.props !== undefined ? `；道具：${card.props}` : ''}`).join('；')
        const style = await new ProjectStyleStore(settings.outputDir).read()
        const styleNote = style !== null
          ? `风格常量：camera ${style.camera}；palette ${style.palette}；lighting ${style.lighting}${style.sceneAnchors.length > 0 ? `；场景锚点 ${style.sceneAnchors.join(' / ')}` : ''}`
          : ''
        const blocks = [characterCards.length > 0 ? `角色一致性锚点：${characterNote}` : '', styleNote].filter(block => block !== '')
        const prompt = blocks.length > 0 ? `${gate.prompt}\n\n${blocks.join('；')}` : gate.prompt
        const negative = [
          typeof args.negative_prompt === 'string' ? args.negative_prompt : '',
          'negativeExtra' in gate && typeof gate.negativeExtra === 'string' ? gate.negativeExtra : '',
          style?.negativeBaseline ?? '',
        ].filter(part => part !== '').join(', ')
        return runVideo(await generateContext(settings, 'video', signal, typeof args.model === 'string' ? args.model : undefined), prompt, {
          seconds: args.seconds,
          size: args.size,
          aspectRatio: args.aspect_ratio,
          resolution: settings.video.resolution,
          firstFramePath: bind.firstFrame,
          lastFramePath: bind.lastFrame,
          referenceImagePaths: bind.firstFrame || bind.lastFrame ? [] : refs,
          negativePrompt: negative !== '' ? negative : undefined,
        })
      },
    })))
  }

  if (settings.audio.enabled) {
    disposers.push(ctx.tools.register(safeDefine({
      name: 'directorx_generate_audio',
      description: 'Generate speech (and provider-supported music/audio) through a configurable OpenAI-compatible /audio/speech endpoint. Configure the audio Base URL / API Key / model in DSH WebUI Settings → DirectorX.',
      parameters: {
        text: { type: 'string', required: true, description: 'Text to synthesize. For music prompts, write the desired style, tempo, and instrumentation.' },
        voice: { type: 'string', description: 'Voice id such as alloy, echo, onyx, nova, or a provider-specific voice.' },
        format: { type: 'string', enum: ['mp3', 'wav', 'opus', 'aac'], description: 'Audio format. Default mp3.' },
        instructions: { type: 'string', description: 'Performance instructions (gpt-4o-mini-tts 官方七维：口音/情绪幅度/语调/模仿/语速/语气/耳语)。示例：「Speak in a calm documentary tone; pause before numbers; end sentences level.」不透传时表演走 text 标点协议（directorx-methodology 规则 92-99）。' },
        speed: { type: 'number', description: '语速（0.25-4.0，口播 1.0-1.2；极端值损害音质，微调优先靠文本节奏）。' },
        model: { type: 'string', description: 'Optional model id. Overrides Settings for this call; user-onboarded adapters are resolved from the project catalog.' },
        craftId: { type: 'string', required: true, description: 'directorx_prompt_craft 返回的 id。' },
        proposalId: { type: 'string', description: 'Approved proposal id. 严格/协同 must pass this after 审阅.' },
      },
      output: objectOutput(),
      timeoutMs: settings.timeoutMs,
      async execute(args: any, exec: any) {
        const gate = await generationGate(settings, proposals, { prompt: args.text, proposalId: args.proposalId })
        if (!gate.generate) {
          return { ...gate, refused: true, next: (gate as { next?: string }).next ?? '先 directorx_prompt_craft' }
        }
        const signal = combinedSignal(exec.signal, settings.timeoutMs)
        return runAudio(await generateContext(settings, 'audio', signal, typeof args.model === 'string' ? args.model : undefined), gate.prompt, { voice: args.voice, format: args.format, instructions: typeof args.instructions === 'string' ? args.instructions : undefined, speed: typeof args.speed === 'number' ? args.speed : undefined })
      },
    })))

    disposers.push(ctx.tools.register(safeDefine({
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

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_knowledge_search',
    description: 'Search the bundled DirectorX OKF knowledge corpus (340+ Chinese craft articles). Hits include type, tags, description, and skills to directorx_skill_read. Always search before claiming the corpus lacks a topic. Then directorx_knowledge_read the id.',
    parameters: {
      query: { type: 'string', required: true, description: 'Search query, e.g. "图生视频 首尾帧 提示词" or "camera movement semantics".' },
      max_results: { type: 'number', description: 'Maximum results (default 8, max 20).' },
      group: { type: 'string', description: 'Optional inventory group: foundation / production / consistency / synthesis.' },
      type: { type: 'string', description: 'Optional OKF type: Reference / Method / Playbook / Spec / Case.' },
      tag: { type: 'string', description: 'Optional OKF tag, e.g. prompt, camera, i2v, continuity.' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    isConcurrencySafe: () => true,
    async execute(args: any) {
      const maxResults = Math.min(20, Math.max(1, Math.round(args.max_results ?? 8)))
      const group = typeof args.group === 'string' ? args.group : undefined
      const type = typeof args.type === 'string' ? args.type : undefined
      const tag = typeof args.tag === 'string' ? args.tag : undefined
      const results = (await corpus.search(args.query, maxResults, { group, type, tag })).map(hit => ({
        ...hit,
        skills: skillsForArticle(hit.id),
        next: [
          `directorx_knowledge_read ${hit.id}`,
          ...skillsForArticle(hit.id).slice(0, 2).map(name => `directorx_skill_read ${name}`),
        ],
      }))
      return { query: args.query, group: group ?? null, type: type ?? null, tag: tag ?? null, okf: '0.2', results, route: routeSkills(String(args.query ?? '')) }
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_knowledge_read',
    description: 'Read bundled knowledge article(s) by id/slug/number/path from directorx_knowledge_search or directorx_skill_route.articles. Pass refs[] to read several. Returns related ids and the skills that cite each article.',
    parameters: {
      ref: { type: 'string', description: 'One article id/slug/path, e.g. "116".' },
      refs: { type: 'array', items: { type: 'string' }, description: 'Read up to 3 articles in one call.' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    isConcurrencySafe: () => true,
    async execute(args: any) {
      const refs = [
        ...(typeof args.ref === 'string' && args.ref.trim() !== '' ? [args.ref] : []),
        ...(Array.isArray(args.refs) ? args.refs.map(String) : []),
      ].slice(0, 3)
      if (refs.length === 0) throw new Error('directorx_knowledge_read 需要 ref 或 refs')
      const articles = []
      const ledger = new ResearchLedger(settings.outputDir)
      for (const ref of refs) {
        const article = await corpus.readArticle(ref)
        articles.push(article)
        await ledger.record({ kind: 'knowledge', ref: article.article.id || ref })
      }
      const related = await corpus.related(refs[0] as string, 3).catch(() => [])
      return {
        articles: articles.map(item => ({
          ...item,
          skills: skillsForArticle(item.article.id),
        })),
        related: related.map(hit => ({ ...hit, skills: skillsForArticle(hit.id) })),
      }
    },
  })))

  skillIndex.setRoot(defaultSkillRoot())
  skillIndex.setExtraRoots(extraSkillRoots(settings.outputDir))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_skill_search',
    description: 'Search DirectorX skills (bundled plus project/user skills saved after a production). Each hit includes tools to call after you directorx_skill_read the body. Use before guessing a workflow.',
    parameters: {
      query: { type: 'string', required: true, description: 'Craft term, e.g. "三视图 角色" or "seedance prompt".' },
      max_results: { type: 'number', description: 'Default 8, max 20.' },
    },
    output: objectOutput(),
    timeoutMs: 20_000,
    isConcurrencySafe: () => true,
    async execute(args: any) {
      const maxResults = Math.min(20, Math.max(1, Math.round(args.max_results ?? 8)))
      const query = String(args.query ?? '')
      const results = (await skillIndex.search(query, maxResults)).map(hit => ({
        ...hit,
        tools: toolsForSkill(hit.name),
        articles: articlesForSkill(hit.name),
        next: [
          `directorx_skill_read ${hit.name}`,
          ...articlesForSkill(hit.name).slice(0, 2).map(id => `directorx_knowledge_read ${id}`),
          ...toolsForSkill(hit.name).slice(0, 2),
        ],
      }))
      return { query, results, route: routeSkills(query) }
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_skill_route',
    description: '技能与知识路由（零成本）：点名该 read 的 skill、该 knowledge_read 的文章 id、应按序调用的工具。工艺请求先调这个，再按 next 读技能正文和文章，不要另起检索词。',
    parameters: {
      intent: { type: 'string', required: true, description: '用户原话或当前画布意图。' },
    },
    output: objectOutput(),
    timeoutMs: 10_000,
    isConcurrencySafe: () => true,
    async execute(args: any) {
      return routeSkills(String(args.intent ?? ''))
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_skill_read',
    description: 'Read a skill SKILL.md (bundled, or a project/user skill saved after a production). Returns articles[] to directorx_knowledge_read next. The DSH skill catalog is only a summary.',
    parameters: {
      name: { type: 'string', required: true, description: 'Skill name from directorx_skill_search, e.g. novel-characters.' },
      file: { type: 'string', description: 'Optional relative file inside the skill folder, e.g. references/sheet.md.' },
    },
    output: objectOutput(),
    timeoutMs: 20_000,
    isConcurrencySafe: () => true,
    async execute(args: any) {
      const body = await skillIndex.read(String(args.name), typeof args.file === 'string' ? args.file : undefined)
      await new ResearchLedger(settings.outputDir).record({ kind: 'skill', ref: body.name })
      const articles = articlesForSkill(body.name)
      return {
        ...body,
        articles,
        next: articles.slice(0, 3).map(id => `directorx_knowledge_read ${id}`),
      }
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_note',
    description: '记下用户在本片里的修改意见（更暖、换运镜、不要这版）。成片结束后 directorx_skill_capture 会把这些意见写进新技能。改一次记一条，不要只留在对话里。',
    parameters: {
      text: { type: 'string', required: true, description: '用户原话或你归纳的一条改法。' },
      source: { type: 'string', enum: ['user', 'ask', 'reject'], description: '默认 user。' },
    },
    output: objectOutput(),
    timeoutMs: 10_000,
    async execute(args: any) {
      const note = await new NoteStore(settings.outputDir).append({
        text: String(args.text ?? ''),
        source: args.source === 'ask' || args.source === 'reject' ? args.source : 'user',
      })
      return { ok: true, note, next: ['继续改片；交片后 directorx_skill_capture'] }
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_blocking',
    description: '场面控制表：用角色图、开场和事件顺序收成单镜世界状态锁。harvest 收角色/参考；schema 给出章节、优先级和 T0…Tn 空台账；你写成 Markdown 后 pin 钉到画布。show 读已有表。不生成。多人连续/完全控制时先调它再 craft。',
    parameters: {
      action: { type: 'string', enum: ['harvest', 'schema', 'pin', 'show'], description: '默认：有 markdown 则 pin，有开场/顺序则 schema，否则 harvest。' },
      start: { type: 'string', description: '开场状态：谁持物、朝哪边、相机在哪一侧。' },
      beats: { type: 'string', description: '事件顺序，一行一步或用 → 连接。' },
      durationSec: { type: 'number', description: '规划时长，4–60 秒。超出单段模型上限就按 Tn 切开，仍引用同一份表。' },
      markdown: { type: 'string', description: 'pin：你写的场面控制表正文，必须含场面台账。' },
      title: { type: 'string', description: 'pin 时的表名。' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      return runBlocking({
        outputDir: settings.outputDir,
        action: typeof args.action === 'string' ? args.action : undefined,
        start: typeof args.start === 'string' ? args.start : undefined,
        beats: typeof args.beats === 'string' ? args.beats : undefined,
        durationSec: typeof args.durationSec === 'number' ? args.durationSec : undefined,
        markdown: typeof args.markdown === 'string' ? args.markdown : undefined,
        title: typeof args.title === 'string' ? args.title : undefined,
      })
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_media_auto_cut',
    description: '一键粗剪：按指定时间段裁切，或在已有 SRT 时按脚本重排口播。底层复用 DirectorX 确定性 FFmpeg 与 smart-cut 管线；不会覆盖源文件。',
    parameters: {
      input: { type: 'string', required: true, description: 'Input video path.' },
      start: { type: 'number', description: '裁切起点秒数，默认 0。' },
      end: { type: 'number', description: '裁切终点秒数。' },
      srt: { type: 'string', description: '可选 SRT 路径；同时给 script 时按字幕语义重排口播。' },
      script: { type: 'string', description: '可选目标口播文本；需要同时给 srt。' },
    },
    output: objectOutput(),
    timeoutMs: 600_000,
    async execute(args: any) {
      if (typeof args.srt === 'string' && typeof args.script === 'string') {
        return smartCut({ video: String(args.input), srt: args.srt, script: [args.script], outputDir: settings.outputDir })
      }
      return videoProcess({
        outputDir: settings.outputDir,
        source: String(args.input),
        start: typeof args.start === 'number' ? args.start : 0,
        end: typeof args.end === 'number' ? args.end : undefined,
      })
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_media_scene_split',
    description: '镜头拆解：从视频均匀提取关键检查帧，返回带时间点文件名的可视素材；用于参考视频分析、镜头规划和素材挑选。场景语义分析继续用 directorx_video_understand。',
    parameters: {
      input: { type: 'string', required: true, description: 'Input video path.' },
      maxFrames: { type: 'number', description: '提取帧数，默认 12，范围 1-24。' },
    },
    output: objectOutput(),
    timeoutMs: 300_000,
    async execute(args: any) {
      return {
        frames: await extractFrames(String(args.input), settings.outputDir, {
          count: Math.min(24, Math.max(1, Number(args.maxFrames ?? 12))),
        }),
        next: '需要语义场景拆分时调用 directorx_video_understand',
      }
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_media_package',
    description: '一键交付打包：把成片裁成预告片并提取封面图，返回可下载的成片、预告和封面素材。标题写作约束继续用 directorx_creative_suite 的 copy-harness。',
    parameters: {
      input: { type: 'string', required: true, description: 'Finished video path.' },
      trailerSeconds: { type: 'number', description: '预告长度，默认 15 秒，范围 3-60。' },
      platform: { type: 'string', enum: ['douyin', 'kuaishou', 'wechat', 'bilibili', 'xiaohongshu'], description: '分发平台，仅用于结果说明。' },
    },
    output: objectOutput(),
    timeoutMs: 300_000,
    async execute(args: any) {
      const seconds = Math.min(60, Math.max(3, Number(args.trailerSeconds ?? 15)))
      const trailer = (await videoProcess({ outputDir: settings.outputDir, source: String(args.input), start: 0, end: seconds })).path
      const cover = (await extractFrames(String(args.input), settings.outputDir, { count: 1 }))[0]
      return { input: String(args.input), trailer, cover, platform: args.platform, titleGuidance: { tool: 'directorx_creative_suite', action: 'copy-harness', kind: 'commercial' } }
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_media_batch',
    description: '批量素材处理：对一组视频执行统一拼接，或逐个执行确定性标准化转码。拼接复用 DirectorX FFmpeg 管线；不会覆盖源素材。',
    parameters: {
      action: { type: 'string', enum: ['concat', 'normalize'], required: true, description: 'concat 将 files 顺序拼接；normalize 逐个标准化为可继续编辑的 MP4。' },
      files: { type: 'array', items: { type: 'string' }, required: true, description: '视频路径，concat 至少 2 个。' },
      fadeSec: { type: 'number', description: 'concat 转场秒数，默认 0.35。' },
    },
    output: objectOutput(),
    timeoutMs: 600_000,
    async execute(args: any) {
      const files = Array.isArray(args.files) ? args.files.map(String) : []
      if (args.action === 'concat') {
        return videoConcat({ outputDir: settings.outputDir, files, fadeSec: Number(args.fadeSec ?? 0.35) })
      }
      const outputs = []
      for (const source of files) {
        outputs.push((await videoProcess({ outputDir: settings.outputDir, source, start: 0 })).path)
      }
      return { files: outputs }
    },
  })))


  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_revise',
    description: '只改画布上这一镜：读该节点的成片、提示词、角色锚和当前系列包，写成改稿计划。不生成。随后仍走 prompt_craft → generate_ready → generate，回写只改这个节点的 path。用户说「表情再生动点」时先调它。',
    parameters: {
      nodeId: { type: 'string', required: true, description: '画布图片或视频节点 id。' },
      change: { type: 'string', required: true, description: '这一镜要改什么，例如「眼神更狠一点」。' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      return planRevise({
        outputDir: settings.outputDir,
        nodeId: String(args.nodeId ?? ''),
        change: String(args.change ?? ''),
      })
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_series',
    description: '系列包：把本片已锁的角色锚、风格锁、镜头规则收成可跨集调用的包。harvest 只收事实；save 写入项目和用户库；list/show 查阅；apply 注册角色并写入风格锁，不生成。方法流程仍走 directorx_skill_capture。',
    parameters: {
      action: { type: 'string', enum: ['harvest', 'save', 'list', 'show', 'apply'], description: '默认 harvest。' },
      name: { type: 'string', description: 'show/apply/save 的包名（小写短横线）。' },
      title: { type: 'string', description: '展示名，可中文。' },
      logline: { type: 'string', description: '一句话系列设定。' },
    },
    output: objectOutput(),
    timeoutMs: 60_000,
    async execute(args: any) {
      return runSeries({
        outputDir: settings.outputDir,
        action: typeof args.action === 'string' ? args.action : undefined,
        name: typeof args.name === 'string' ? args.name : undefined,
        title: typeof args.title === 'string' ? args.title : undefined,
        logline: typeof args.logline === 'string' ? args.logline : undefined,
      })
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_skill_capture',
    description: '成片交付后把流程和用户修改意见收成新技能。offer 走 DSH 标准提问「是否保存为 xx 技能」；用户同意后你写 SKILL.md 正文再 save。只写入项目/用户技能库，不覆盖插件自带 skills/。',
    parameters: {
      action: { type: 'string', enum: ['harvest', 'offer', 'save'], description: '默认 offer。harvest 只收事实；offer 走 DSH 标准提问；save 写入技能。' },
      present: { type: 'boolean', description: 'offer 时立刻通过 userQuestions.ask 提问，不要只返回 JSON。' },
      name: { type: 'string', description: 'save：小写英文短横线技能名。' },
      title: { type: 'string', description: '展示名，可中文。' },
      description: { type: 'string', description: 'SKILL.md description：做什么、何时触发。' },
      body: { type: 'string', description: 'save：你写的 SKILL.md 正文（流程 + 修改纪律），不要交空壳。' },
      answer: { type: 'string', description: '用户已经回答时传入原话。' },
      replace: { type: 'boolean', description: '覆盖已存在的同名用户技能。' },
    },
    output: objectOutput(),
    timeoutMs: 300_000,
    async execute(args: any, exec: any) {
      const hostAsk = resolveHostAsk(ctx)
      if (args.present === true && hostAsk === undefined) {
        throw new Error('directorx_skill_capture present 需要 DSH userQuestions（标准提问通道）')
      }
      const result = await runSkillCapture({
        outputDir: settings.outputDir,
        action: typeof args.action === 'string' ? args.action : undefined,
        present: args.present === true,
        name: typeof args.name === 'string' ? args.name : undefined,
        title: typeof args.title === 'string' ? args.title : undefined,
        description: typeof args.description === 'string' ? args.description : undefined,
        body: typeof args.body === 'string' ? args.body : undefined,
        answer: typeof args.answer === 'string' ? args.answer : undefined,
        replace: args.replace === true,
        ...(args.present === true && hostAsk !== undefined
          ? { ask: request => hostAsk.ask(request), agent: exec.agent, signal: exec.signal }
          : {}),
      })
      if (result.saved === true && typeof result.name === 'string' && typeof result.description === 'string') {
        const dir = typeof result.paths === 'object' && Array.isArray(result.paths) ? String(result.paths[0] ?? '').replace(/\/SKILL\.md$/, '') : ''
        const content = typeof args.body === 'string' ? args.body : ''
        try {
          ctx.skills.register({
            name: result.name,
            description: result.description,
            content,
            source: 'user',
            provider: 'directorx',
            ...(dir !== '' ? { resourceBase: { kind: 'directory', path: dir } } : {}),
            invocation: { modelInvocable: true, userInvocable: true },
          })
        } catch {
          // Already registered in this process — files on disk are enough.
        }
      }
      return result
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_prompt_plan',
    description: '提示词编排：按当前意图给出六要素缺口、视频物理链、模型技能、版权方法和 next。不写固定成稿。写细后再 directorx_prompt_craft。',
    parameters: {
      intent: { type: 'string', required: true, description: '用户原句 / 画布意图。' },
      kind: { type: 'string', enum: ['image', 'video', 'audio'], description: '出图、出视频还是出声音。不传则按意图推断。' },
      model: { type: 'string', description: '已选模型 id，用来点名 copilot 技能。' },
    },
    output: objectOutput(),
    timeoutMs: 10_000,
    isConcurrencySafe: () => true,
    async execute(args: any) {
      return planPrompt({
        intent: String(args.intent ?? ''),
        kind: args.kind === 'image' || args.kind === 'video' || args.kind === 'audio' ? args.kind : undefined,
        model: typeof args.model === 'string' ? args.model : undefined,
      })
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_prompt_craft',
    description: '把用户意图写成可生成的导演提示词。先 directorx_prompt_plan。必须 knowledge_read + skill_read（必要时外部调研），再把成稿和引用交来。画布短句不是提示词。成稿仍含 IP 专名会拒绝。返回 craftId，generate/propose 必带。',
    parameters: {
      intent: { type: 'string', required: true, description: '用户原句 / 画布生成条意图。' },
      prompt: { type: 'string', required: true, description: '调研后的成稿：主体动作 + 景别运镜 + 环境光 + 风格焦段，正说，具体运动。' },
      kind: { type: 'string', enum: ['image', 'video', 'audio'], required: true, description: '成稿用于出图、出视频还是出声音。' },
      knowledgeRefs: { type: 'array', items: { type: 'string' }, required: true, description: '已 read 的知识库 id。' },
      skillNames: { type: 'array', items: { type: 'string' }, required: true, description: '已 read 的技能名。' },
      externalNotes: { type: 'string', description: '外部调研摘要；语料已够就写 corpus-sufficient。' },
      shotSize: { type: 'string' },
      angle: { type: 'string' },
      cameraMove: { type: 'string' },
      lighting: { type: 'string' },
      mood: { type: 'string' },
      composition: { type: 'string' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      return craftPrompt({
        outputDir: settings.outputDir,
        kind: args.kind,
        intent: String(args.intent),
        prompt: String(args.prompt),
        knowledgeRefs: Array.isArray(args.knowledgeRefs) ? args.knowledgeRefs.map(String) : [],
        skillNames: Array.isArray(args.skillNames) ? args.skillNames.map(String) : [],
        externalNotes: typeof args.externalNotes === 'string' ? args.externalNotes : '',
        shot: {
          subject: String(args.intent),
          shotSize: args.shotSize,
          angle: args.angle,
          cameraMove: typeof args.cameraMove === 'string' ? args.cameraMove : undefined,
          lighting: args.lighting,
          mood: typeof args.mood === 'string' ? args.mood : undefined,
          composition: args.composition,
        },
      })
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_generate_ready',
    description: '生成前参考齐备闸。读画布和角色库，判定本任务该走设定图 / 场景空镜 / 关键帧 / 图生 / 首尾帧 / 文生。缺参考就 blocked，并用 directorx_ask（DSH 标准提问）让用户选路。commit:true 只在齐备时发 readyId；generate/propose/canvas_continue 必带。',
    parameters: {
      kind: { type: 'string', enum: ['image', 'video'], required: true, description: '本任务出图还是出视频。' },
      intent: { type: 'string', required: true, description: '用户原句 / 画布意图。' },
      prompt: { type: 'string', required: true, description: 'prompt_craft 成稿。不齐时也可先拿来诊断。' },
      craftId: { type: 'string', description: 'commit 时必填。' },
      strategy: { type: 'string', enum: ['character-sheet', 'scene-still', 'keyframe', 't2i', 't2v', 'i2v', 'fl2v', 'ref2v'], description: '声明策略；不传则按意图/画布推断。' },
      nodeId: { type: 'string', description: '要生成的画布节点。' },
      sourceId: { type: 'string', description: '承接的上一镜。' },
      characters: { type: 'array', items: { type: 'string' }, description: '本镜要锁的人物名。' },
      scenes: { type: 'array', items: { type: 'string' }, description: '本镜要锁的场景名。' },
      firstFrame: { type: 'string', description: '首帧路径。' },
      lastFrame: { type: 'string', description: '尾帧路径。' },
      referenceImages: { type: 'array', items: { type: 'string' } },
      waivers: { type: 'array', items: { type: 'string' }, description: '用户确认后才可放弃的项：character-sheet / scene-still / first-frame / last-frame。已登记角色不能放弃设定图。' },
      commit: { type: 'boolean', description: 'true = 齐备则写入 readyId。' },
      present: { type: 'boolean', description: 'blocked 时立刻走 DSH 标准提问。' },
    },
    output: objectOutput(),
    timeoutMs: 300_000,
    async execute(args: any, exec: any) {
      const crafted = await requireCraft(settings.outputDir, typeof args.craftId === 'string' ? args.craftId : undefined)
      const snapshot = await loadReadySnapshot(settings.outputDir)
      const input = {
        kind: args.kind === 'image' ? 'image' as const : 'video' as const,
        intent: String(args.intent ?? ''),
        prompt: String(args.prompt ?? (crafted.ok ? crafted.craft.prompt : '')),
        ...(crafted.ok ? { craftId: crafted.craft.id } : {}),
        ...(typeof args.nodeId === 'string' ? { nodeId: args.nodeId } : {}),
        ...(typeof args.sourceId === 'string' ? { sourceId: args.sourceId } : {}),
        ...(Array.isArray(args.characters) ? { characters: args.characters.map(String) } : {}),
        ...(Array.isArray(args.scenes) ? { scenes: args.scenes.map(String) } : {}),
        ...(parseStrategy(args.strategy) !== undefined ? { strategy: parseStrategy(args.strategy) } : {}),
        ...(typeof args.firstFrame === 'string' ? { firstFrame: args.firstFrame } : {}),
        ...(typeof args.lastFrame === 'string' ? { lastFrame: args.lastFrame } : {}),
        ...(Array.isArray(args.referenceImages) ? { referenceImages: args.referenceImages.map(String) } : {}),
        ...(Array.isArray(args.waivers) ? { waivers: args.waivers.map(String) } : {}),
        snapshot,
      }
      const diagnosis = assessGenerateReady(input)
      if (args.commit === true && !crafted.ok) return { ...crafted, diagnosis }
      const diagnosed = args.commit === true && crafted.ok
        ? await commitGenerateReady({ ...input, outputDir: settings.outputDir, craftId: crafted.craft.id })
        : { ok: diagnosis.verdict === 'ready', ...diagnosis }
      let answers
      const ask = (diagnosed as { ask?: unknown }).ask
      if (args.present === true && Array.isArray(ask) && ask.length > 0) {
        const hostAsk = resolveHostAsk(ctx)
        if (hostAsk === undefined) throw new Error('directorx_generate_ready present 需要 DSH userQuestions')
        answers = (await presentAsk({
          questions: normalizeAskQuestions(ask),
          ask: request => hostAsk.ask(request),
          agent: exec.agent,
          signal: exec.signal,
        })).answers
      }
      return {
        ...diagnosed,
        answers,
        next: (diagnosed as { next?: unknown }).next ?? (Array.isArray(ask) && ask.length > 0 && answers === undefined ? 'directorx_ask' : undefined),
      }
    },
  })))

  // Task ledger tools: registered unconditionally (independent of capability
  // switches) so the agent can always inspect and stop generation tasks.
  disposers.push(ctx.tools.register(safeDefine({
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

  disposers.push(ctx.tools.register(safeDefine({
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

  disposers.push(ctx.tools.register(safeDefine({
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

  // Canvas tools: DSH owns the storyboard. The WebUI is a view + layout
  // surface; generation and structure writes go through these tools.
  const canvas = new DirectorxCanvasStore(settings.outputDir)
  const intents = new CanvasIntentStore(settings.outputDir)
  const editLedger = new DirectorxEditLedger(settings.outputDir)

  const finishBound = async (bound: { nodeId?: string }, result: { path: string }, mediaType: string) => {
    const commit = await commitBoundMedia({
      canvas,
      ledger: editLedger,
      nodeId: bound.nodeId,
      path: result.path,
      mediaType,
    })
    return { nodeId: bound.nodeId, written: commit.written }
  }

  disposers.push(ctx.tools.register(safeDefine({
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

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_canvas_add',
    description: 'Add one canvas node. 剧本/分镜/角色表未用 directorx_confirm 或用户明确说「落到画布」前，禁止批量占位。单节点补位可以。kind: image|video|text|group。Pass prompt/shotIndex so the board is a storyboard, not empty cards.',
    parameters: {
      kind: { type: 'string', enum: ['image', 'video', 'text', 'group'], required: true, description: 'Node kind.' },
      id: { type: 'string', description: 'Optional stable id so later connect/sequence calls can name this node.' },
      label: { type: 'string', description: 'Node label (shown under the preview).' },
      path: { type: 'string', description: 'Media path (local output-dir path or http(s) URL) for image/video nodes.' },
      prompt: { type: 'string', description: 'Generation prompt stored on the node (shot-list / propose source).' },
      shotIndex: { type: 'number', description: 'Stable shot number. Order is this field, not x/y or edges.' },
      shotStatus: { type: 'string', enum: ['idea', 'approved', 'generating', 'review', 'locked', 'failed'], description: 'Shot status.' },
      continuityRules: { type: 'array', items: { type: 'string' }, description: 'Continuity locks (character/wardrobe/light).' },
      aspect: { type: 'string', description: 'Frame aspect stored on the node (e.g. 16:9, 9:16).' },
      model: { type: 'string', description: 'Preferred generation model id for this node.' },
      count: { type: 'number', description: 'Preferred take count (1–4).' },
      durationSec: { type: 'number', description: 'Preferred video duration in seconds.' },
      characters: { type: 'array', items: { type: 'string' }, description: 'Registered character names to lock on this node.' },
      x: { type: 'number', description: 'Canvas x position.' },
      y: { type: 'number', description: 'Canvas y position.' },
      width: { type: 'number', description: 'Node width.' },
      height: { type: 'number', description: 'Node height.' },
      parent: { type: 'string', description: 'Optional id of a group node to place this node inside.' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      const doc = await canvas.addNode(args)
      const node = typeof args.id === 'string' && args.id !== ''
        ? doc.nodes.find(candidate => candidate.id === args.id)
        : doc.nodes[doc.nodes.length - 1]
      return { added: node ?? null, updatedAt: doc.updatedAt, nodeCount: doc.nodes.length }
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
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

  disposers.push(ctx.tools.register(safeDefine({
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

  disposers.push(ctx.tools.register(safeDefine({
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

  disposers.push(ctx.tools.register(safeDefine({
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

  disposers.push(ctx.tools.register(safeDefine({
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

  disposers.push(ctx.tools.register(safeDefine({
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

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_canvas_takes',
    description: 'Take 归档查询：返回 Shot 组内的候选结果（媒体成员，按 shotIndex 确定性排序）+ 选定 Take + 镜头状态——agent 打分/对比/钉选（selectedTakeId 经 canvas_update 写入）的确定性底座。',
    parameters: {
      groupId: { type: 'string', required: true, description: 'Shot group node id.' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      return canvas.takes(String(args.groupId))
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_canvas_continuity',
    description: '连续性规则注册表：汇总全部 Shot 组的 continuityRules；跨镜头重复出现的规则即「连续性锁」（角色/服装/道具/光线/方位跨镜头锁定）。返回逐镜头规则 + 锁列表（规则 × 出现镜头数）。',
    parameters: {},
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute() {
      return canvas.continuity()
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
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

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_canvas_snapshots',
    description: '画布快照列表（撤销此批的检查点索引；提案批准时自动建立，上限 20）。',
    parameters: {},
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute() {
      return canvas.readSnapshotsIndex()
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_canvas_restore',
    description: '恢复画布快照（撤销此批）：把画布整体回滚到某个检查点；已生成素材保留在素材库。',
    parameters: {
      snapshotId: { type: 'string', required: true, description: 'Snapshot id from directorx_canvas_snapshots.' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      return canvas.restoreSnapshot(String(args.snapshotId))
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
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

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_canvas_summary',
    description: '紧凑画布上下文快照：白名单行格式（id|kind#shotIndex|label 截断 60 字|parent）——喂给 LLM 的画布上下文从全量 JSON 的 2-3k token 压到几百 token，静态前缀可吃缓存。',
    parameters: {},
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute() {
      return canvas.summary()
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_canvas_shotlist',
    description: 'Export a numbered shot list from the canvas (Storyboarder/Boords-style board): shot index, kind, prompt, duration, continuity, status, and a running duration budget. Does not generate media. Use before proposing generation so the user can sign off the board.',
    parameters: {
      target_seconds: { type: 'number', description: 'Optional target runtime; remaining seconds are reported against the sum of shot durations.' },
    },
    output: objectOutput(),
    timeoutMs: 15_000,
    isConcurrencySafe: () => true,
    async execute(args: any) {
      const doc = await canvas.read()
      return formatCanvasShotlist(doc, {
        ...(typeof args.target_seconds === 'number' && Number.isFinite(args.target_seconds) ? { targetSeconds: args.target_seconds } : {}),
      })
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
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
      const rows = typeof args === 'string'
        ? await canvas.search({ label: args })
        : await canvas.search({
            label: typeof args?.label === 'string' ? args.label : undefined,
            kind: ['image', 'video', 'text', 'group'].includes(args?.kind) ? args.kind : undefined,
            parent: typeof args?.parent === 'string' ? args.parent : undefined,
          })
      return { hits: rows, count: rows.length }
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_canvas_batch',
    description: 'Batch add nodes (and optional edges) in one write. Each node accepts the same fields as canvas_add (id/kind/label/path/prompt/shotIndex/parent/x/y). Prefer this or canvas_plan over many canvas_add calls.',
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

  disposers.push(ctx.tools.register(safeDefine({
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

  disposers.push(ctx.tools.register(safeDefine({
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

  disposers.push(ctx.tools.register(safeDefine({
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

  disposers.push(ctx.tools.register(safeDefine({
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

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_canvas_node',
    description: 'Read one canvas node or edge by id. Nodes return inbound/outbound edges and group members. Use this instead of canvas_get when you only need one element.',
    parameters: {
      id: { type: 'string', required: true, description: 'Node or edge id.' },
    },
    output: objectOutput(),
    timeoutMs: 15_000,
    isConcurrencySafe: () => true,
    async execute(args: any) {
      return canvas.getNode(String(args.id))
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_canvas_groups',
    description: 'List every group on the canvas with its members (id/kind/label/shotIndex). The grouping query for DSH before group/dissolve/sequence.',
    parameters: {},
    output: objectOutput(),
    timeoutMs: 15_000,
    isConcurrencySafe: () => true,
    async execute() {
      return canvas.listGroups()
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_canvas_group',
    description: 'Wrap existing nodes into a new group (act/scene). Members keep their positions; the group frame encloses them. Cannot nest a group inside a group — dissolve first.',
    parameters: {
      memberIds: { type: 'array', items: { type: 'string' }, required: true, description: 'Node ids to put inside the new group.' },
      label: { type: 'string', description: 'Group label (default 组).' },
    },
    output: objectOutput(),
    timeoutMs: 15_000,
    async execute(args: any) {
      const memberIds = Array.isArray(args.memberIds) ? args.memberIds.map(String) : []
      return canvas.groupNodes({ memberIds, ...(typeof args.label === 'string' ? { label: args.label } : {}) })
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_canvas_disconnect',
    description: 'Remove the edge from one node to another by endpoints. Use when you know from/to but not the edge id.',
    parameters: {
      from: { type: 'string', required: true, description: 'Source node id.' },
      to: { type: 'string', required: true, description: 'Target node id.' },
    },
    output: objectOutput(),
    timeoutMs: 15_000,
    async execute(args: any) {
      return canvas.disconnect(String(args.from), String(args.to))
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_canvas_sequence',
    description: 'Write shot order onto existing nodes: shotIndex becomes 1..N in the given id order. Optionally connect consecutive image/video nodes as 承接 edges. Coordinates do not change.',
    parameters: {
      ids: { type: 'array', items: { type: 'string' }, required: true, description: 'Node ids in playback order.' },
      connect: { type: 'boolean', description: 'When true, wire consecutive media nodes with 承接 edges (default false).' },
      edgeLabel: { type: 'string', description: 'Label for new edges when connect=true (default 承接).' },
    },
    output: objectOutput(),
    timeoutMs: 15_000,
    async execute(args: any) {
      const ids = Array.isArray(args.ids) ? args.ids.map(String) : []
      return canvas.sequenceShots({
        ids,
        ...(args.connect === true ? { connect: true } : {}),
        ...(typeof args.edgeLabel === 'string' ? { edgeLabel: args.edgeLabel } : {}),
      })
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_canvas_plan',
    description: '把已确认的分镜一次写入画布（幕=组，镜=节点）。未向用户确认剧本/分镜（directorx_confirm 或用户明确同意落画布）之前不要调用。Does not generate media.',
    parameters: {
      title: { type: 'string', description: 'Canvas title.' },
      connect: { type: 'boolean', description: 'Wire consecutive image/video shots (default true).' },
      acts: {
        type: 'array',
        required: true,
        description: 'Acts/scenes. Each has a label and shots[].',
        items: {
          type: 'object',
          additionalProperties: true,
          properties: {
            label: { type: 'string', required: true, description: 'Act/scene name.' },
            shots: {
              type: 'array',
              required: true,
              items: {
                type: 'object',
                additionalProperties: true,
                properties: {
                  kind: { type: 'string', enum: ['image', 'video', 'text'], description: 'Default video.' },
                  label: { type: 'string', required: true, description: 'Shot label.' },
                  prompt: { type: 'string', description: 'Stored generation prompt.' },
                  seconds: { type: 'number', description: 'Duration; appended to prompt as Ns for the shot list.' },
                  continuity: { type: 'array', items: { type: 'string' }, description: 'Continuity locks.' },
                },
              },
            },
          },
        },
      },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      const acts = Array.isArray(args.acts) ? args.acts.map((act: any) => ({
        label: String(act.label ?? ''),
        shots: Array.isArray(act.shots) ? act.shots.map((shot: any) => ({
          label: String(shot.label ?? ''),
          ...(shot.kind === 'image' || shot.kind === 'video' || shot.kind === 'text' ? { kind: shot.kind } : {}),
          ...(typeof shot.prompt === 'string' ? { prompt: shot.prompt } : {}),
          ...(typeof shot.seconds === 'number' ? { seconds: shot.seconds } : {}),
          ...(Array.isArray(shot.continuity) ? { continuity: shot.continuity.map(String) } : {}),
        })) : [],
      })) : []
      return canvas.planBoard({
        acts,
        ...(typeof args.title === 'string' ? { title: args.title } : {}),
        ...(args.connect === false ? { connect: false } : {}),
      })
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_canvas_script',
    description: '把文本/剧本节点拆成「本→首帧→视频」分镜行铺上画布。认 Fountain 场次标题、镜头N、中文第N场。剧本正文本身就是可见文本卡。只写 idea 空卡，不生成媒体。同一剧本节点再调一次会复用已铺的行。',
    parameters: {
      nodeId: { type: 'string', description: '已有文本节点 id。可与 text 二选一。' },
      text: { type: 'string', description: '直接给剧本正文。没有 nodeId 时会先建一张文本卡。' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      return runCanvasCraft({
        outputDir: settings.outputDir,
        action: 'script',
        ...(typeof args.nodeId === 'string' ? { nodeId: args.nodeId } : {}),
        ...(typeof args.text === 'string' ? { text: args.text } : {}),
      })
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_canvas_frames',
    description: '从已有成片的视频节点抽关键帧，铺成一组图片卡（提取帧）。用 ffmpeg，不写 generating，也不建 video→image 边（抽帧组本身就是出处）。',
    parameters: {
      nodeId: { type: 'string', required: true, description: '视频节点 id，且 path 已有成片。' },
      count: { type: 'number', description: '均匀抽帧数，默认 6，最多 12。' },
    },
    output: objectOutput(),
    timeoutMs: 120_000,
    async execute(args: any) {
      return runCanvasCraft({
        outputDir: settings.outputDir,
        action: 'frames',
        nodeId: String(args.nodeId ?? ''),
        ...(typeof args.count === 'number' ? { count: args.count } : {}),
      })
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_canvas_autolink',
    description: '按角色库名字和卡片词令重叠，给现有节点补参考边（文本/设定图 → 镜头）。不新建节点，不生成。遵守画布连线矩阵：视频不能喂图片。',
    parameters: {
      nodeId: { type: 'string', description: '只连与这个节点相关的边。省略则扫整板。' },
      nodeIds: { type: 'array', items: { type: 'string' }, description: '只连与这些节点相关的边。' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      return runCanvasCraft({
        outputDir: settings.outputDir,
        action: 'autolink',
        ...(typeof args.nodeId === 'string' ? { nodeId: args.nodeId } : {}),
        ...(Array.isArray(args.nodeIds) ? { nodeIds: args.nodeIds.map(String) } : {}),
      })
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_canvas_parse',
    description: '智能解析成片：ffmpeg 切点检测（亮度差分）拆镜，把分镜稿文本卡和每镜代表帧铺上画布。不生成。describe:true 时用 vision 写每镜一句（未配置则只写时间窗）。同一视频再调一次会复用。',
    parameters: {
      nodeId: { type: 'string', required: true, description: '已有成片路径的视频节点 id。' },
      describe: { type: 'boolean', description: '为每镜调 vision 写一句可见内容。默认 false。' },
    },
    output: objectOutput(),
    timeoutMs: 1800_000,
    async execute(args: any) {
      return runCanvasCraft({
        outputDir: settings.outputDir,
        action: 'parse',
        nodeId: String(args.nodeId ?? ''),
        settings,
        ...(args.describe === true ? { describe: true } : {}),
      })
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_canvas_reshoot',
    description: '局部重绘。cut：切掉头尾、抽出窗内首尾帧、铺中段 idea 卡（不生成）。中段生成回写 path 后 assemble：ffmpeg cut 拼接头+中+尾到「重做成片」卡。窗长 1–15 秒。UI 不得写 generating。',
    parameters: {
      action: { type: 'string', enum: ['cut', 'assemble'], description: '默认 cut。中段有成片后 assemble。' },
      nodeId: { type: 'string', required: true, description: 'cut=源视频节点；assemble=重做中段或成片节点。' },
      start: { type: 'number', description: 'cut：窗起点秒。' },
      end: { type: 'number', description: 'cut：窗终点秒。' },
      prompt: { type: 'string', description: 'cut：这一段要改成什么。' },
    },
    output: objectOutput(),
    timeoutMs: 600_000,
    async execute(args: any) {
      return runCanvasCraft({
        outputDir: settings.outputDir,
        action: 'reshoot',
        nodeId: String(args.nodeId ?? ''),
        phase: args.action === 'assemble' ? 'assemble' : 'cut',
        ...(typeof args.start === 'number' ? { start: args.start } : {}),
        ...(typeof args.end === 'number' ? { end: args.end } : {}),
        ...(typeof args.prompt === 'string' ? { prompt: args.prompt } : {}),
      })
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_canvas_pack',
    description: '把画布上已有成片的视频卡硬切拼成一条「成片」卡。默认按传入 id 顺序，否则按 shotIndex。ffmpeg 本地拼接，不生成。预告片/片花必须 cut，不要 fade。',
    parameters: {
      nodeIds: { type: 'array', items: { type: 'string' }, description: '要拼接的视频节点 id，按播放顺序。省略则取整板已成片视频。' },
      transition: { type: 'string', enum: ['cut', 'fade'], description: '默认 cut。预告片只用 cut。' },
      fadeSec: { type: 'number', description: '仅 fade：叠化秒数，默认 0.3。' },
    },
    output: objectOutput(),
    timeoutMs: 600_000,
    async execute(args: any) {
      return runCanvasCraft({
        outputDir: settings.outputDir,
        action: 'pack',
        ...(Array.isArray(args.nodeIds) ? { nodeIds: args.nodeIds.map(String) } : {}),
        ...(args.transition === 'fade' || args.transition === 'cut' ? { transition: args.transition } : {}),
        ...(typeof args.fadeSec === 'number' ? { fadeSec: args.fadeSec } : {}),
      })
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_canvas_sheet',
    description: '把选中的图/视频抽中点帧，拼成一张九宫格图片卡钉在画布上。ffmpeg tile，不生成。',
    parameters: {
      nodeIds: { type: 'array', items: { type: 'string' }, description: '图或视频节点 id。省略则取整板有成片的图/视频。' },
      columns: { type: 'number', description: '列数，默认 min(4, 数量)，2–8。' },
    },
    output: objectOutput(),
    timeoutMs: 180_000,
    async execute(args: any) {
      return runCanvasCraft({
        outputDir: settings.outputDir,
        action: 'sheet',
        ...(Array.isArray(args.nodeIds) ? { nodeIds: args.nodeIds.map(String) } : {}),
        ...(typeof args.columns === 'number' ? { columns: args.columns } : {}),
      })
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_canvas_split',
    description: '把一张有成片的图片拆分宫格，铺成一组独立图片卡。ffmpeg crop，不生成。',
    parameters: {
      nodeId: { type: 'string', required: true, description: '图片节点 id，且 path 已有成片。' },
      cols: { type: 'number', description: '列数，默认 3，2–5。' },
      rows: { type: 'number', description: '行数，默认 3，1–5。' },
    },
    output: objectOutput(),
    timeoutMs: 120_000,
    async execute(args: any) {
      return runCanvasCraft({
        outputDir: settings.outputDir,
        action: 'split',
        nodeId: String(args.nodeId ?? ''),
        ...(typeof args.cols === 'number' ? { cols: args.cols } : {}),
        ...(typeof args.rows === 'number' ? { rows: args.rows } : {}),
      })
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_canvas_join',
    description: '把选中的成片图片按原图合并成一张带镜号的宫格大图，钉在画布上。ffmpeg tile，不生成。拆分宫格的逆操作，也用于分镜组交付。',
    parameters: {
      nodeIds: { type: 'array', items: { type: 'string' }, description: '图片节点 id，至少两张。' },
      columns: { type: 'number', description: '列数，默认 min(4, 数量)，2–8。' },
      numbered: { type: 'boolean', description: '角标镜号，默认 true。' },
    },
    output: objectOutput(),
    timeoutMs: 180_000,
    async execute(args: any) {
      return runCanvasCraft({
        outputDir: settings.outputDir,
        action: 'join',
        ...(Array.isArray(args.nodeIds) ? { nodeIds: args.nodeIds.map(String) } : {}),
        ...(typeof args.columns === 'number' ? { columns: args.columns } : {}),
        ...(args.numbered === false ? { numbered: false } : {}),
      })
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_canvas_stack',
    description: '把 2–4 张有成片的图/视频拼成分屏条，钉成一条视频卡。ffmpeg hstack/vstack，不生成。',
    parameters: {
      nodeIds: { type: 'array', items: { type: 'string' }, required: true, description: '图或视频节点 id，2–4 个。' },
      layout: { type: 'string', enum: ['2x1', '1x2', '2x2'], description: '默认两路横排，四路用 2x2。' },
    },
    output: objectOutput(),
    timeoutMs: 180_000,
    async execute(args: any) {
      return runCanvasCraft({
        outputDir: settings.outputDir,
        action: 'stack',
        ...(Array.isArray(args.nodeIds) ? { nodeIds: args.nodeIds.map(String) } : {}),
        ...(args.layout === '2x1' || args.layout === '1x2' || args.layout === '2x2' ? { layout: args.layout } : {}),
      })
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_canvas_desub',
    description: '去掉成片视频上的硬字幕或底栏字：裁掉或模糊一条边。ffmpeg crop/boxblur，不生成。',
    parameters: {
      nodeId: { type: 'string', required: true, description: '有成片的视频节点 id。' },
      method: { type: 'string', enum: ['crop', 'blur'], description: '默认 crop。blur 保留构图。' },
      region: { type: 'string', description: 'bottom:15 / top:10 / left:8 / right:8，数字是百分比。' },
    },
    output: objectOutput(),
    timeoutMs: 180_000,
    async execute(args: any) {
      return runCanvasCraft({
        outputDir: settings.outputDir,
        action: 'desub',
        nodeId: String(args.nodeId ?? ''),
        ...(args.method === 'crop' || args.method === 'blur' ? { method: args.method } : {}),
        ...(typeof args.region === 'string' ? { region: args.region } : {}),
      })
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_canvas_extend',
    description: '从成片视频抽出尾帧，旁边铺一张视频延长空卡（idea）。不生成。接着走 craft/ready，回写延长卡 path。',
    parameters: {
      nodeId: { type: 'string', required: true, description: '有成片的视频节点 id。' },
      prompt: { type: 'string', description: '续写意图。省略则沿用原卡提示词。' },
    },
    output: objectOutput(),
    timeoutMs: 120_000,
    async execute(args: any) {
      return runCanvasCraft({
        outputDir: settings.outputDir,
        action: 'extend',
        nodeId: String(args.nodeId ?? ''),
        ...(typeof args.prompt === 'string' ? { prompt: args.prompt } : {}),
      })
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_canvas_gif',
    description: '把成片视频导出为 GIF 图片卡钉在画布上，方便评审和分享。ffmpeg palette，不生成。',
    parameters: {
      nodeId: { type: 'string', required: true, description: '有成片的视频节点 id。' },
    },
    output: objectOutput(),
    timeoutMs: 180_000,
    async execute(args: any) {
      return runCanvasCraft({
        outputDir: settings.outputDir,
        action: 'gif',
        nodeId: String(args.nodeId ?? ''),
      })
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_video_process',
    description: '确定性本地视频处理（ffmpeg）：裁剪/变速/缩放/音量/静音/帧率/旋转/翻转/倒放/定格。可带 nodeId 回写画布。免费精确，禁止用生成模型代替。',
    parameters: {
      source: { type: 'string', description: '本地视频路径。可与 nodeId 二选一。' },
      nodeId: { type: 'string', description: '画布节点 id。有则处理后回写 path。' },
      start: { type: 'number', description: 'Trim start (seconds).' },
      end: { type: 'number', description: 'Trim end (seconds).' },
      speed: { type: 'number', description: 'Playback speed multiplier (0.5-8).' },
      scale: { type: 'string', description: 'Output size, e.g. 1280:720 or 16:9.' },
      volume: { type: 'number', description: 'Audio volume multiplier (e.g. 0.9).' },
      mute: { type: 'boolean', description: 'Strip the audio track.' },
      fps: { type: 'number', description: 'Normalize to this frame rate.' },
      crop: { type: 'string', description: '裁剪 w:h:x:y。' },
      rotate: { type: 'number', enum: [90, 180, 270], description: '旋转角度。' },
      hflip: { type: 'boolean', description: '水平翻转。' },
      vflip: { type: 'boolean', description: '垂直翻转。' },
      reverse: { type: 'boolean', description: '倒放。' },
      freezeEnd: { type: 'number', description: '片尾定格秒数。' },
      freezeStart: { type: 'number', description: '片头定格秒数。' },
      grade: { type: 'string', description: '调色 look 名；不确定时改走 directorx_studio。' },
    },
    output: objectOutput(),
    timeoutMs: 600_000,
    isConcurrencySafe: () => true,
    async execute(args: any) {
      const bound = await resolveBoundMedia({
        canvas,
        outputDir: settings.outputDir,
        nodeId: args.nodeId,
        path: args.source,
        require: 'video',
      })
      const rotate = parseRotate(args.rotate)
      const hasOp = typeof args.start === 'number' || typeof args.end === 'number' || typeof args.speed === 'number'
        || typeof args.scale === 'string' || typeof args.volume === 'number' || args.mute === true
        || typeof args.fps === 'number' || typeof args.crop === 'string' || rotate !== undefined
        || args.hflip === true || args.vflip === true || args.reverse === true
        || typeof args.freezeEnd === 'number' || typeof args.freezeStart === 'number'
        || (typeof args.grade === 'string' && args.grade.trim() !== '')
      if (!hasOp) throw new Error('没有可执行的视频操作（裁剪/变速/缩放/旋转/翻转/倒放/定格/调色）')
      const processed = await videoProcess({
        source: bound.path,
        outputDir: settings.outputDir,
        start: typeof args.start === 'number' ? args.start : undefined,
        end: typeof args.end === 'number' ? args.end : undefined,
        speed: typeof args.speed === 'number' ? args.speed : undefined,
        scale: typeof args.scale === 'string' ? args.scale : undefined,
        volume: typeof args.volume === 'number' ? args.volume : undefined,
        mute: args.mute === true,
        fps: typeof args.fps === 'number' ? args.fps : undefined,
        crop: typeof args.crop === 'string' ? args.crop : undefined,
        ...(rotate !== undefined ? { rotate } : {}),
        hflip: args.hflip === true,
        vflip: args.vflip === true,
        reverse: args.reverse === true,
        freezeEnd: typeof args.freezeEnd === 'number' ? args.freezeEnd : undefined,
        freezeStart: typeof args.freezeStart === 'number' ? args.freezeStart : undefined,
        ...(typeof args.grade === 'string' && args.grade.trim() !== ''
          ? { grade: resolveGradeLook(args.grade) }
          : {}),
      })
      return { ...processed, ...(await finishBound(bound, processed, processed.mimeType)) }
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_video_concat',
    description: 'Concatenate multiple local videos into one: normalizes size/fps/audio, then either hard cuts or xfade (cross-fade) transitions with audio acrossfade. Deterministic ffmpeg assembly for multi-shot deliverables. 可带 nodeId 把成片路径写回画布。',
    parameters: {
      files: { type: 'array', items: { type: 'string' }, required: true, description: 'Absolute paths of 2+ local videos in order.' },
      nodeId: { type: 'string', description: '画布节点 id。有则把成片 path 写回该节点。' },
      transition: { type: 'string', enum: ['fade', 'cut'], description: 'fade = xfade cross-fade (default); cut = hard cuts.' },
      fadeSec: { type: 'number', description: 'Cross-fade duration (default 0.5s).' },
      scale: { type: 'string', description: 'Common output size (default 1280:720).' },
    },
    output: objectOutput(),
    timeoutMs: 900_000,
    isConcurrencySafe: () => true,
    async execute(args: any) {
      const rendered = await videoConcat({ ...args, outputDir: settings.outputDir })
      const nodeId = typeof args.nodeId === 'string' && args.nodeId !== '' ? args.nodeId : undefined
      return { ...rendered, ...(await finishBound({ nodeId }, rendered, rendered.mimeType)) }
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
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

  disposers.push(ctx.tools.register(safeDefine({
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

  disposers.push(ctx.tools.register(safeDefine({
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

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_preflight',
    description: 'Pre-flight audit before paid generation: 规格/内容/成本/权利。权利闸扫描 IP 专名并返回改写方法 brief（不含固定成稿）。点名 IP 不要直接 generate，走 directorx_ip_scan → 改写 → directorx_ip_rewrite。',
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

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_ip_scan',
    description: '版权扫描：检出 IP/商标/作者名/真人名，返回论文方法轴、须保留的情境、负向排除和本项目记忆。不写固定替换句。检出后必须自己写细改写，再 directorx_ip_rewrite 验收。',
    parameters: {
      prompt: { type: 'string', required: true, description: '要检查的提示词或用户原句。' },
    },
    output: objectOutput(),
    timeoutMs: 10_000,
    isConcurrencySafe: () => true,
    async execute(args: any) {
      const scanned = await scanIpWithMemory(settings.outputDir, String(args.prompt ?? ''))
      return {
        dirty: scanned.brief.dirty,
        hits: scanned.brief.hits,
        keep: scanned.brief.keep,
        method: scanned.brief.method,
        knowledge: scanned.brief.knowledge,
        exclude: scanned.brief.exclude,
        negativeLine: scanned.brief.negativeLine,
        memory: scanned.memory,
        agentPrompt: scanned.brief.agentPrompt,
        next: scanned.brief.next,
      }
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_ip_rewrite',
    description: '实施版权改写验收：对照原句检查改写稿是否还含专名；通过则记入本项目记忆，供以后同类镜头调用。改写必须按 ip_scan 的方法轴结合当前情境自己写，禁止套固定句。',
    parameters: {
      source: { type: 'string', required: true, description: '用户原句 / 画布意图。' },
      rewrite: { type: 'string', required: true, description: '按方法轴写好的属性描述成稿，不得再含 IP 专名。' },
      remember: { type: 'boolean', description: '通过后写入项目记忆。默认 true。' },
    },
    output: objectOutput(),
    timeoutMs: 10_000,
    async execute(args: any) {
      return commitIpRewrite(settings.outputDir, {
        source: String(args.source ?? ''),
        rewrite: String(args.rewrite ?? ''),
        remember: args.remember !== false,
      })
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
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

  disposers.push(ctx.tools.register(safeDefine({
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

  disposers.push(ctx.tools.register(safeDefine({
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

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_propose',
    description: 'Queue a PLACEHOLDER (成片 严格/协同). 必须带 craftId+readyId。参考不齐先 generate_ready。严格 without chosen expands into 二到四个提示词. After the user picks, call again with chosen=true and that exact prompt to enqueue one 占位. Does not spend quota.',
    parameters: {
      kind: { type: 'string', enum: ['image', 'video', 'audio'], required: true, description: 'Generation kind.' },
      prompt: { type: 'string', required: true, description: 'Task wording, or the exact chosen prompt when chosen=true.' },
      chosen: { type: 'boolean', description: 'true after the user picked one of the 严格 variants — enqueue that single line, do not re-expand.' },
      variantCount: { type: 'number', description: '严格 options count, clamped 2–4. Ignored when chosen=true.' },
      model: { type: 'string', description: 'Model key, if chosen.' },
      size: { type: 'string', description: 'Size/aspect.' },
      duration: { type: 'number', description: 'Duration seconds (video/audio).' },
      count: { type: 'number', description: 'Generation count (default 1).' },
      estimatedCost: { type: 'string', description: 'Cost note (the plugin ships no price table — state the assumption).' },
      note: { type: 'string', description: 'Free-form note (continuity/anchors/references).' },
      canvasNodeId: { type: 'string', description: 'Canvas node this proposal is bound to (visible on the board).' },
      craftId: { type: 'string', required: true, description: 'directorx_prompt_craft id. 未调研成稿不能占位。' },
      readyId: { type: 'string', required: true, description: 'directorx_generate_ready id. 参考不齐不能占位。' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      const crafted = await requireCraft(settings.outputDir, typeof args.craftId === 'string' ? args.craftId : undefined)
      if (!crafted.ok) return crafted
      const ready = await requireReady(settings.outputDir, typeof args.readyId === 'string' ? args.readyId : undefined, {
        craftId: crafted.craft.id,
        kind: args.kind === 'image' || args.kind === 'video' ? args.kind : undefined,
      })
      if (!ready.ok && (args.kind === 'image' || args.kind === 'video')) return ready
      const plan = planPlaceholderEnqueue({
        mode: settings.initiative,
        prompt: crafted.craft.prompt,
        chosen: args.chosen === true,
        variantCount: typeof args.variantCount === 'number' ? args.variantCount : undefined,
      })
      if (plan.expand) {
        const queued = []
        for (const [index, prompt] of plan.prompts.entries()) {
          queued.push(await proposals.propose({
            kind: args.kind,
            prompt,
            model: args.model,
            size: args.size,
            duration: args.duration,
            count: 1,
            estimatedCost: args.estimatedCost,
            note: `严格变体 ${index + 1}/${plan.prompts.length}；选定后 directorx_propose chosen:true。${args.note ?? ''}`,
            canvasNodeId: args.canvasNodeId,
            craftId: crafted.craft.id,
            ...(ready.ok ? { readyId: ready.brief.id } : {}),
          }))
        }
        return { ...plan, next: 'directorx_confirm', proposals: queued }
      }
      const prompt = plan.prompts[0] ?? crafted.craft.prompt
      return proposals.propose({
        kind: args.kind,
        prompt,
        model: args.model,
        size: args.size,
        duration: args.duration,
        count: args.count ?? 1,
        estimatedCost: args.estimatedCost,
        note: args.note,
        canvasNodeId: args.canvasNodeId,
        craftId: crafted.craft.id,
        ...(ready.ok ? { readyId: ready.brief.id } : {}),
      })
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_confirm',
    description: 'Pause on the DSH ask UI (ctx.userQuestions) to sign off the production board: next pending proposal, multi-select proposals, or the canvas shot list. Applies approve/reject to the ledger. Does not generate media. Prefer this over a free-form ask_user_question after directorx_propose / directorx_canvas_shotlist.',
    parameters: {
      scope: {
        type: 'string',
        enum: ['next', 'proposals', 'shotlist'],
        description: 'next = oldest pending proposal; proposals = multi-select pending ids; shotlist = sign the whole board. Default next.',
      },
    },
    output: objectOutput(),
    timeoutMs: 300_000,
    async execute(args: any, exec: any) {
      const hostAsk = resolveHostAsk(ctx)
      if (hostAsk === undefined) {
        throw new Error('directorx_confirm requires DSH userQuestions (Web UI or TUI). This deployment has no ask provider.')
      }
      const scope = args.scope === 'proposals' || args.scope === 'shotlist' ? args.scope : 'next'
      return confirmProduction({
        scope,
        outputDir: settings.outputDir,
        ask: request => hostAsk.ask(request),
        agent: exec.agent,
        signal: exec.signal,
      })
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_ask',
    description: 'Pause on the standard DSH question channel (ctx.userQuestions.ask) for any fork the user must own (时长/画幅/风格/接入协议/是否打最短测试). NEVER write a numbered 1.2.3 menu in assistant text — call this instead. Up to 6 questions, each with options and a recommended default.',
    parameters: {
      question: { type: 'string', description: 'Single-question shorthand.' },
      options: { type: 'array', items: { type: 'object', additionalProperties: true }, description: '[{label, description?}]' },
      recommended: { type: 'string', description: 'Default option label.' },
      header: { type: 'string' },
      detail: { type: 'string' },
      multiSelect: { type: 'boolean' },
      questions: { type: 'array', items: { type: 'object', additionalProperties: true }, description: 'Full card list if you need more than one fork.' },
    },
    output: objectOutput(),
    timeoutMs: 300_000,
    async execute(args: any, exec: any) {
      const hostAsk = resolveHostAsk(ctx)
      if (hostAsk === undefined) {
        throw new Error('directorx_ask requires DSH userQuestions (standard question channel).')
      }
      const questions = normalizeAskQuestions(args.questions ?? args)
      return presentAsk({
        questions,
        ask: request => hostAsk.ask(request),
        agent: exec.agent,
        signal: exec.signal,
      })
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_stage',
    description: '成片阶段账本（outputDir/stage.json）：brief→research→forks→script→cast→storyboard→craft→place→generate→assemble→qa→deliver。记录阶段性产物，过闸用 DSH 标准提问。deliver 时返回收成提问，接着 directorx_skill_capture。不要静默跳阶段。',
    parameters: {
      action: { type: 'string', enum: ['get', 'record', 'advance'], description: 'Default get.' },
      stage: { type: 'string', description: 'record/advance 的阶段 id。' },
      kind: { type: 'string', description: 'record: 产物类型，如 outline / cast / shotlist / cut。' },
      path: { type: 'string', description: 'record: 产物路径。' },
      note: { type: 'string', description: 'record: 一句话说明。' },
      skip: { type: 'boolean', description: 'advance 时跳过当前阶段。' },
    },
    output: objectOutput(),
    timeoutMs: 15_000,
    async execute(args: any) {
      const store = new ProductionStageStore(settings.outputDir)
      const action = args.action === 'record' || args.action === 'advance' ? args.action : 'get'
      if (action === 'record') {
        return store.record({
          stage: parseStageId(args.stage),
          kind: String(args.kind ?? 'note'),
          path: typeof args.path === 'string' ? args.path : undefined,
          note: typeof args.note === 'string' ? args.note : undefined,
        })
      }
      if (action === 'advance') {
        const to = parseStageId(args.stage)
        if (to === undefined) throw new Error('advance 需要合法 stage id')
        const doc = await store.advance(to, args.skip === true ? 'skip' : 'done')
        if (doc.current === 'deliver') return { ...doc, ...(await deliverCapture(settings.outputDir)) }
        return doc
      }
      const doc = await store.get()
      if (doc.current === 'deliver') return { ...doc, ...(await deliverCapture(settings.outputDir)) }
      return doc
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_proposal_next',
    description: '审批门循环：返回队列中最旧的一条待执行提案——优先返回已批准且未回填 taskId 的（画布 UI 批准后由 DSH 承接执行），否则返回最旧待批准提案；配合 directorx_proposal_update 走 提案→批准→执行→完成 的人机审批环。',
    parameters: {},
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute() {
      return proposals.next()
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
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

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_proposal_update',
    description: 'Update a proposal status (proposed -> approved/rejected/done). Approving moves it to the execution queue; done marks it executed with its artifact.',
    parameters: {
      id: { type: 'string', required: true, description: 'Proposal id from directorx_proposals.' },
      status: { type: 'string', enum: ['proposed', 'approved', 'rejected', 'done'], required: true, description: 'New status.' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      const status = args.status
      if (status === 'approved') {
        // 撤销此批：批准即存画布检查点（执行前快照）。
        try {
          await canvas.snapshot(`proposal-${String(args.id)}`)
        } catch {
          // 快照失败不阻塞批准。
        }
      }
      return proposals.update(String(args.id), status)
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
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

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_character_register',
    description: 'Register a character/subject anchor: a reference image + description stored in characters.json, and pin a visible 人物设定 text node on the canvas. Later generation calls can pass the character name via the `characters` parameter and the reference + description are injected automatically.',
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
      const card = await new CharacterStore(settings.outputDir).register({
        name: String(args.name),
        description: args.description,
        refPath: String(args.refPath),
        outfit: typeof args.outfit === 'string' ? args.outfit : undefined,
        props: typeof args.props === 'string' ? args.props : undefined,
      })
      const pinned = await pinCharacterSetting(settings.outputDir, card)
      return { ...card, ...(pinned !== undefined ? { canvasNodeId: pinned.nodeId } : {}) }
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_character_list',
    description: 'List registered character anchors (names + descriptions + reference paths).',
    parameters: {},
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute() {
      return new CharacterStore(settings.outputDir).list()
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_studio',
    description: `打开图片/视频编辑工作台，并按自然语言做确定性调色（${listGradeLabels()}）。用户说「把这张照片调成末日荒土配色」时：解析 look → ffmpeg 调色 → 回写画布节点 path → 通知 WebUI 打开对应编辑台。不写 generating。不要用生成模型重绘来完成调色。`,
    parameters: {
      prompt: { type: 'string', required: true, description: '调色/编辑意图，如「末日荒土配色」「漂白旁路」「交叉冲印」「夜色」「金黄昏」。' },
      path: { type: 'string', description: '本地媒体路径。可与 nodeId 二选一。' },
      nodeId: { type: 'string', description: '画布节点 id。有则回写 path，并按节点 kind 打开编辑台。' },
      kind: { type: 'string', enum: ['image', 'video'], description: '覆盖自动判断的媒体类型。' },
      openOnly: { type: 'boolean', description: '只打开编辑台、不调色。默认 false。' },
    },
    output: objectOutput(),
    timeoutMs: 600_000,
    isConcurrencySafe: () => true,
    async execute(args: any) {
      const bound = await resolveBoundMedia({
        canvas,
        outputDir: settings.outputDir,
        nodeId: args.nodeId,
        path: args.path,
        kind: args.kind,
      })
      if (args.openOnly === true) {
        const ticket = await new StudioTicketStore(settings.outputDir).write({
          kind: bound.kind,
          path: bound.path,
          ...(bound.nodeId !== undefined ? { nodeId: bound.nodeId } : {}),
        })
        return { ok: true, openStudio: true, kind: bound.kind, path: bound.path, nodeId: bound.nodeId, ticket }
      }
      const look = resolveGradeLook(String(args.prompt ?? ''))
      const graded = await applyGrade({ source: bound.path, look, outputDir: settings.outputDir, kind: bound.kind })
      const commit = await finishBound(bound, graded, bound.kind === 'video' ? 'video/mp4' : 'image/jpeg')
      const ticket = await new StudioTicketStore(settings.outputDir).write({
        kind: graded.kind,
        path: graded.path,
        look: graded.look,
        ...(bound.nodeId !== undefined ? { nodeId: bound.nodeId } : {}),
      })
      return { ok: true, openStudio: true, ...graded, ...commit, ticket }
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_edit_plan',
    description: '编辑路由（零成本）：根据人话意图判定该走 studio / image_edit / video_process / edit / timeline / smart_cut / concat / 质检，还是必须重新生成。不改文件。拿不准先调这个。',
    parameters: {
      intent: { type: 'string', required: true, description: '用户的编辑原话，如「顺时针转 90 度」「去掉开头 2 秒」「调成末日荒土」。' },
      nodeId: { type: 'string', description: '当前画布节点。' },
      path: { type: 'string', description: '本地媒体路径。' },
      kind: { type: 'string', enum: ['image', 'video'], description: '覆盖自动判断。' },
    },
    output: objectOutput(),
    timeoutMs: 15_000,
    isConcurrencySafe: () => true,
    async execute(args: any) {
      let kind: 'image' | 'video' | undefined = args.kind === 'video' || args.kind === 'image' ? args.kind : undefined
      let path = typeof args.path === 'string' ? args.path : undefined
      const nodeId = typeof args.nodeId === 'string' && args.nodeId !== '' ? args.nodeId : undefined
      if (nodeId !== undefined && (kind === undefined || path === undefined)) {
        const found = await canvas.getNode(nodeId)
        if (found.kind === 'node' && (found.node.kind === 'image' || found.node.kind === 'video')) {
          kind = kind ?? found.node.kind
          if (path === undefined) path = found.node.path
        }
      }
      return planEdit({ intent: String(args.intent ?? ''), kind, nodeId, path })
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_image_edit',
    description: '确定性图片编辑（ffmpeg）：旋转 90/180/270、水平/垂直翻转、裁切 w:h:x:y、缩放、明暗对比饱和、可选调色。可带 nodeId 回写画布。不要用生成模型完成这些操作。',
    parameters: {
      path: { type: 'string', description: '本地图片路径。可与 nodeId 二选一。' },
      nodeId: { type: 'string', description: '画布节点 id。有则回写 path。' },
      rotate: { type: 'number', enum: [90, 180, 270], description: '旋转角度。' },
      hflip: { type: 'boolean', description: '水平翻转。' },
      vflip: { type: 'boolean', description: '垂直翻转。' },
      crop: { type: 'string', description: '裁剪 w:h:x:y。' },
      scale: { type: 'string', description: '缩放，如 1280:720。' },
      brightness: { type: 'number', description: '亮度 -1..1，0 为不变。' },
      contrast: { type: 'number', description: '对比度 0..3，1 为不变。' },
      saturate: { type: 'number', description: '饱和度 0..3，1 为不变。' },
      look: { type: 'string', description: '调色 look；复杂色板优先 directorx_studio。' },
    },
    output: objectOutput(),
    timeoutMs: 180_000,
    isConcurrencySafe: () => true,
    async execute(args: any) {
      const bound = await resolveBoundMedia({
        canvas,
        outputDir: settings.outputDir,
        nodeId: args.nodeId,
        path: args.path,
        require: 'image',
      })
      const rotate = parseRotate(args.rotate)
      const edited = await imageProcess({
        source: bound.path,
        outputDir: settings.outputDir,
        ...(rotate !== undefined ? { rotate } : {}),
        hflip: args.hflip === true,
        vflip: args.vflip === true,
        crop: typeof args.crop === 'string' ? args.crop : undefined,
        scale: typeof args.scale === 'string' ? args.scale : undefined,
        brightness: typeof args.brightness === 'number' ? args.brightness : undefined,
        contrast: typeof args.contrast === 'number' ? args.contrast : undefined,
        saturate: typeof args.saturate === 'number' ? args.saturate : undefined,
        ...(typeof args.look === 'string' && args.look.trim() !== ''
          ? { grade: resolveGradeLook(args.look) }
          : {}),
      })
      return { ...edited, ...(await finishBound(bound, edited, edited.mimeType)) }
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_edit',
    description: '意图驱动剪辑：把自然语言剪辑指令（「去掉开头 2 秒」「只保留 3 到 10 秒」「5-8 秒放慢 2 倍」「整个倒放」）解析成确定性时间轴并渲染成片。可带 nodeId 回写画布。改指令=重渲染，零 API 成本。',
    parameters: {
      video: { type: 'string', description: '源视频路径。可与 nodeId 二选一。' },
      nodeId: { type: 'string', description: '画布节点 id。有则把成片 path 写回该节点。' },
      edits: { type: 'array', items: { type: 'string' }, required: true, description: 'Natural-language edit instructions (or one string split by punctuation).' },
    },
    output: objectOutput(),
    timeoutMs: 1800_000,
    isConcurrencySafe: () => true,
    async execute(args: any) {
      const bound = await resolveBoundMedia({
        canvas,
        outputDir: settings.outputDir,
        nodeId: args.nodeId,
        path: args.video,
        require: 'video',
      })
      const raw = Array.isArray(args.edits) ? args.edits.map(String) : typeof args.edits === 'string' && args.edits !== '' ? [args.edits] : []
      const instructions = raw.length === 1 ? raw[0].split(/[；;。]+/).map((piece: string) => piece.trim()).filter((piece: string) => piece !== '') : raw
      const probe = probeMedia(bound.path)
      const commands = parseEditInstructions(instructions, probe.durationSec)
      const scenes = editsToScenes(commands, probe.durationSec).map(scene => ({ ...scene, source: bound.path }))
      if (commands.length === 0) throw new Error('没有解析出可执行的剪辑指令（支持：去掉开头/结尾 N 秒、只保留 X 到 Y 秒、X-Y 秒变速 Z 倍、整个倒放）')
      if (scenes.length === 0) throw new Error(`剪辑窗口被裁剪为空（源时长 ${probe.durationSec}s，裁剪量超过可保留范围）——调整指令或换更长的素材`)
      const rendered = await renderTimeline({ scenes }, settings.outputDir)
      return {
        commands,
        timeline: scenes,
        path: rendered.path,
        steps: rendered.steps,
        probe: rendered.probe,
        ...(await finishBound(bound, rendered, 'video/mp4')),
      }
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_timeline',
    description: 'Render a timeline JSON into a finished cut (OTIO-inspired subset — the editing agent\'s central format): scenes with per-scene trims, cross-fade/hard-cut concat, optional audio mixing with ducking, and subtitle muxing. Deterministic and re-renderable: change the plan, re-render, never re-generate. 可带 nodeId 回写画布。 timeline = { scenes: [{source, trim?, transition?}], subtitle?, audio? [{path, volume?, duckUnder?}], scale? }.',
    parameters: {
      timeline: { type: 'object', additionalProperties: true, required: true, description: 'Timeline spec: scenes array + optional subtitle srt path, audio tracks, scale.' },
      nodeId: { type: 'string', description: '画布节点 id。有则把成片 path 写回该节点。' },
    },
    output: objectOutput(),
    timeoutMs: 1800_000,
    isConcurrencySafe: () => true,
    async execute(args: any) {
      const timeline = (args.timeline ?? {}) as { scenes?: unknown[]; subtitle?: string; audio?: unknown[]; scale?: string }
      const rendered = await renderTimeline({
        scenes: Array.isArray(timeline.scenes) ? timeline.scenes as never[] : [],
        subtitle: timeline.subtitle,
        audio: Array.isArray(timeline.audio) ? timeline.audio as never[] : undefined,
        scale: timeline.scale,
      }, settings.outputDir)
      const nodeId = typeof args.nodeId === 'string' && args.nodeId !== '' ? args.nodeId : undefined
      return { ...rendered, ...(await finishBound({ nodeId }, rendered, 'video/mp4')) }
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
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

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_canvas_intents',
    description: 'List or atomically claim DSH-owned canvas generate directives queued by the WebUI generate bar. Prefer claim:true so two turns cannot take the same intent. Then execute with directorx_canvas_continue / canvas_* / propose / generate — the canvas UI does not write generating nodes.',
    parameters: {
      status: { type: 'string', enum: ['pending', 'taken', 'done', 'cancelled'], description: 'Filter when listing; omit for all, newest first.' },
      claim: { type: 'boolean', description: 'If true, take the oldest pending intent (status becomes taken) and return it with a session prompt. Ignores status filter.' },
    },
    output: objectOutput(),
    timeoutMs: 15_000,
    async execute(args: any) {
      if (args.claim === true) {
        const intent = await intents.takeNext()
        if (intent === null) return { intent: null, pending: 0 }
        const doc = await canvas.read()
        const source = intent.sourceId !== undefined
          ? doc.nodes.find(node => node.id === intent.sourceId)
          : undefined
        return {
          intent,
          prompt: await formatDshCanvasPromptForProject(intent, {
            sourceLabel: source?.label,
            outputDir: settings.outputDir,
          }),
          canvasTitle: doc.title ?? '',
          nodeCount: doc.nodes.length,
          summary: (await canvas.summary()).slice(0, 40),
        }
      }
      const status = args.status === 'pending' || args.status === 'taken' || args.status === 'done' || args.status === 'cancelled' ? args.status : undefined
      return { intents: await intents.list(status) }
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_canvas_intent_ack',
    description: 'Mark a canvas intent taken (you started) or done (canvas mutated). Call after directorx_canvas_continue / generate.',
    parameters: {
      id: { type: 'string', required: true, description: 'Intent id from directorx_canvas_intents.' },
      status: { type: 'string', enum: ['taken', 'done'], required: true, description: 'taken = claimed; done = applied on the canvas.' },
    },
    output: objectOutput(),
    timeoutMs: 15_000,
    async execute(args: any) {
      const status = args.status === 'done' ? 'done' : 'taken'
      return intents.ack(String(args.id), status)
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_canvas_continue',
    description: 'DSH-owned continue-generate: drop a generating placeholder wired from sourceId. 必须带 readyId——参考不齐不许落 generating 节点。',
    parameters: {
      sourceId: { type: 'string', description: 'Existing node to wire from. Omit to place a free node.' },
      kind: { type: 'string', enum: ['image', 'video'], description: 'Defaults from the source kind (image/video → video, else image).' },
      prompt: { type: 'string', required: true, description: 'Generation prompt for the placeholder.' },
      readyId: { type: 'string', required: true, description: 'directorx_generate_ready id.' },
      craftId: { type: 'string', description: 'Optional craftId to pair with readyId.' },
    },
    output: objectOutput(),
    timeoutMs: 15_000,
    async execute(args: any) {
      const kind = args.kind === 'image' || args.kind === 'video' ? args.kind : undefined
      const ready = await requireReady(settings.outputDir, typeof args.readyId === 'string' ? args.readyId : undefined, {
        ...(typeof args.craftId === 'string' ? { craftId: args.craftId } : {}),
        ...(kind !== undefined ? { kind } : {}),
      })
      if (!ready.ok) return ready
      return canvas.continueGenerate({
        prompt: ready.brief.prompt || String(args.prompt),
        ...(typeof args.sourceId === 'string' && args.sourceId !== '' ? { sourceId: args.sourceId } : {}),
        ...(kind !== undefined ? { kind } : { kind: ready.brief.kind }),
      })
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
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

  disposers.push(ctx.tools.register(safeDefine({
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

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_bible',
    description: '改编五件套评审：读 outline/cast/art/script/storyboard JSON，跑脚本质量门，输出 Markdown。pin 把评审钉到画布文本卡，同时写入 outputDir/docs。不要另出 HTML。体检已有大纲也走 checkup。',
    parameters: {
      action: { type: 'string', enum: ['detect', 'checkup', 'render', 'pin'], description: '默认 detect。checkup 跑门；render 出 Markdown；pin 钉画布。' },
      kind: { type: 'string', enum: ['outline', 'characters', 'art', 'script', 'storyboard'], description: '不传则用找到的第一份。' },
      path: { type: 'string', description: '指定 JSON 路径。' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      return runBible({
        outputDir: settings.outputDir,
        action: typeof args.action === 'string' ? args.action : undefined,
        kind: typeof args.kind === 'string' ? args.kind : undefined,
        path: typeof args.path === 'string' ? args.path : undefined,
      })
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_shot_vocab',
    description: '镜头语汇：配方卡回答这一刀怎么切，技法卡回答什么时候用、什么时候别用。list/show 给 DSH 写分镜；check 复核提示词是否带上必备短语。不是卡片墙，也不出 HTML。',
    parameters: {
      action: { type: 'string', enum: ['list', 'show', 'check'], description: '默认 list。' },
      kind: { type: 'string', enum: ['recipe', 'technique'], description: 'list 时按族筛。' },
      query: { type: 'string', description: 'list 检索词，如 正反打 / 手持。' },
      id: { type: 'string', description: 'show / check 的卡片 id。' },
      prompt: { type: 'string', description: 'check：分镜图或成稿提示词。' },
    },
    output: objectOutput(),
    timeoutMs: 10_000,
    isConcurrencySafe: () => true,
    async execute(args: any) {
      const action = args.action === 'show' || args.action === 'check' ? args.action : 'list'
      if (action === 'list') {
        const cards = listShotVocab({
          kind: args.kind === 'recipe' || args.kind === 'technique' ? args.kind : undefined,
          query: typeof args.query === 'string' ? args.query : undefined,
        })
        return {
          cards: cards.map(card => ({
            id: card.id,
            kind: card.kind,
            category: card.category,
            title: card.title,
            never: card.never,
            phrases: card.phrases,
          })),
          next: cards.slice(0, 3).map(card => `directorx_shot_vocab show ${card.id}`),
        }
      }
      if (action === 'show') {
        const card = showShotVocab(String(args.id ?? ''))
        if (card === undefined) throw new Error('没有这张卡。先 list。')
        return { ...card, next: [`directorx_knowledge_read ${card.knowledge[0] ?? '109'}`, '写这一格后再 directorx_shot_vocab check'] }
      }
      return checkShotVocab({
        prompt: String(args.prompt ?? ''),
        recipe: typeof args.id === 'string' ? args.id : undefined,
      })
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_storyboard',
    description: 'Storyboard duration planning (PenShot-inspired deterministic layer): allocates per-shot durations against model limits, clamps out-of-range values, fills unspecified shots toward the target, and checks continuity anchors. Pins the shot table as a visible 分镜表 text node on the canvas.',
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
      const plan = planStoryboard({
        shots: Array.isArray(args.shots) ? args.shots as never[] : [],
        targetSeconds: args.targetSeconds,
        maxShotSeconds: args.maxShotSeconds,
        minShotSeconds: args.minShotSeconds,
        anchors: args.anchors as { characters?: string[]; scenes?: string[] } | undefined,
      })
      try {
        const pinned = await pinTextCard({
          store: canvas,
          stamp: STORYBOARD_STAMP,
          body: formatStoryboardText(plan),
          id: 'storyboard-plan',
          width: 480,
        })
        return { ...plan, canvasNodeId: pinned.nodeId }
      } catch {
        return plan
      }
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
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

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_orchestrate',
    description: 'Optional helper: draft a placeholder-first production plan (research + confirm questions + prompt/model/spec units) without generating. The agent can also do this itself with brief, knowledge_search, recipe_read, and directorx_propose.',
    parameters: {
      request: { type: 'string', required: true, description: 'The user\'s production request, any brand / source work / remake subject.' },
      materials: { type: 'array', items: { type: 'string' }, description: 'Optional local material paths.' },
    },
    output: objectOutput(),
    timeoutMs: 60_000,
    async execute(args: any) {
      return orchestrateProduction({
        request: String(args.request),
        outputDir: settings.outputDir,
        materials: Array.isArray(args.materials) ? args.materials.map(String) : [],
      })
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_chengpian',
    description: '成片决策。先于提问/生成调用。返回 confirm/generate、角度 lenses（不是成稿）、prompt_plan 与 compose 流程 next。confirm=true 时带 DSH 标准提问。',
    parameters: {
      event: { type: 'string', enum: ['unclear', 'generate', 'placeholder-batch'], required: true, description: 'unclear = 不明确事件; generate = 一个生成任务; placeholder-batch = 整批占位。' },
      prompt: { type: 'string', description: 'Generation task wording, or the exact chosen prompt.' },
      chosen: { type: 'boolean', description: 'true after the user picked one 严格 variant.' },
      proposalStatus: { type: 'string', description: 'If executing: proposed/approved/rejected/done of the queued 占位.' },
      inBudget: { type: 'boolean', description: '自动 only: false if this unit would exceed the agreed budget.' },
      necessaryAsk: { type: 'boolean', description: '自动 only: true if this ambiguity must be asked.' },
      variantCount: { type: 'number', description: '严格: how many of 二到四个提示词 (clamped 2–4).' },
      present: { type: 'boolean', description: 'true = 立刻走 DSH 标准提问，不要只返回 JSON。' },
    },
    output: objectOutput(),
    timeoutMs: 300_000,
    async execute(args: any, exec: any) {
      const decision = runChengpianEvent({
        mode: settings.initiative,
        event: args.event,
        prompt: args.prompt,
        inBudget: args.inBudget,
        necessaryAsk: args.necessaryAsk,
        variantCount: args.variantCount,
      })
      const enqueue = args.event === 'unclear'
        ? undefined
        : planPlaceholderEnqueue({
          mode: settings.initiative,
          prompt: String(args.prompt ?? ''),
          chosen: args.chosen === true,
          variantCount: args.variantCount,
        })
      const auth = args.proposalStatus !== undefined
        ? resolveGenerateAuthorization({
          mode: settings.initiative,
          prompt: args.prompt,
          inBudget: args.inBudget,
          proposal: { status: String(args.proposalStatus), prompt: String(args.prompt ?? '') },
        })
        : resolveGenerateAuthorization({
          mode: settings.initiative,
          prompt: args.prompt,
          inBudget: args.inBudget,
        })
      const ask = decision.confirm ? chengpianAskQuestions(decision, args.event) : []
      let answers
      if (args.present === true && ask.length > 0) {
        const hostAsk = resolveHostAsk(ctx)
        if (hostAsk === undefined) throw new Error('directorx_chengpian present 需要 DSH userQuestions')
        answers = (await presentAsk({
          questions: normalizeAskQuestions(ask),
          ask: request => hostAsk.ask(request),
          agent: exec.agent,
          signal: exec.signal,
        })).answers
      }
      const flow = planProduction({
        request: String(args.prompt ?? ''),
        materials: [],
      })
      const next = [
        ...(ask.length > 0 && answers === undefined ? ['directorx_ask'] : []),
        ...flow.next,
      ]
      return { ...decision, enqueue, auth, ask, answers, flow, next }
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_brief',
    description: '意图分诊：类型/平台/时长 + compose 阶段图（路/稿/位含 prompt_plan 与 craft/ready）。按 compose.nextActions 自己编排。directorx_orchestrate 可选。',
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

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_smart_cut',
    description: 'LLM 精剪（deterministic matcher）: the agent writes the narration script; this tool locates each sentence\'s best-matching subtitle cue (character-overlap scoring) in the source video and assembles the matched windows into a finished cut via the timeline pipeline. 可带 nodeId 回写画布。',
    parameters: {
      video: { type: 'string', description: '源视频路径。可与 nodeId 二选一。' },
      nodeId: { type: 'string', description: '画布节点 id。有则把成片 path 写回该节点。' },
      srt: { type: 'string', required: true, description: 'Absolute path of the .srt transcript (directorx_transcribe_audio).' },
      script: { type: 'array', items: { type: 'string' }, required: true, description: 'Script sentences (or one full text, split by punctuation).' },
      pad: { type: 'number', description: 'Padding seconds around each matched cue (default 0.15).' },
    },
    output: objectOutput(),
    timeoutMs: 1800_000,
    isConcurrencySafe: () => true,
    async execute(args: any) {
      const bound = await resolveBoundMedia({
        canvas,
        outputDir: settings.outputDir,
        nodeId: args.nodeId,
        path: args.video,
        require: 'video',
      })
      const rendered = await smartCut({
        video: bound.path,
        srt: String(args.srt),
        script: Array.isArray(args.script) ? args.script.map(String) : [],
        outputDir: settings.outputDir,
        pad: typeof args.pad === 'number' ? args.pad : undefined,
      })
      return { ...rendered, ...(await finishBound(bound, rendered, 'video/mp4')) }
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
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

  disposers.push(ctx.tools.register(safeDefine({
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

  disposers.push(ctx.tools.register(safeDefine({
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

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_media_list',
    description: '媒体资产库：列出输出目录下的全部媒体文件（顶层 + edited/frames/transcripts），含路径/类型/大小。用它在剪辑/混剪前盘点可用素材（素材盘点步），具体规格再对单个文件 directorx_probe_media。',
    parameters: {},
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute() {
      const files = await listMediaFiles(settings.outputDir)
      return { files, count: files.length }
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
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

  disposers.push(ctx.tools.register(safeDefine({
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

  disposers.push(ctx.tools.register(safeDefine({
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

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_style_get',
    description: '读取当前项目的风格常量锁（style.json）。生成提示词时把返回字段逐字并入对应位置（camera/palette/lighting/sceneAnchors/negativeBaseline）。',
    parameters: {},
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute() {
      return new ProjectStyleStore(settings.outputDir).read()
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
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

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_model_router',
    description: '模型能力表路由：按输入需求（时长/画幅/首尾帧/音画同出）过滤并排序可用视频模型，返回 eligible 列表 + 每模型的排除原因——参数组合问题在计划期暴露，不等到执行期失败。',
    parameters: {
      durationSec: { type: 'number', description: '目标时长（秒）。' },
      aspectRatio: { type: 'string', description: '目标画幅，如 16:9 / 9:16 / 1:1。' },
      needsFirstFrame: { type: 'boolean', description: '是否要求首帧输入。' },
      needsLastFrame: { type: 'boolean', description: '是否要求尾帧输入。' },
      needsAudio: { type: 'boolean', description: '是否要求音画同出（原生音频）。' },
      needsMultiRef: { type: 'boolean', description: '是否要求多参考图（多主体/多素材条件输入）。' },
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
        needsMultiRef: args.needsMultiRef === true,
      }, await adapterCapabilities(settings.outputDir))
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
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

  disposers.push(ctx.tools.register(safeDefine({
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

  disposers.push(ctx.tools.register(safeDefine({
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

  disposers.push(ctx.tools.register(safeDefine({
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

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_shot',
    description: '镜头语言→生成提示词确定性翻译器（导演技巧的 AIGC 应用层）：把 景别/角度/运镜/布光/氛围/构图 的结构化选择翻译成五轴装配提示词 + 负面基线 + 规则编号引用（directorx-methodology 规则 29-68）。词表全部来自方法论沉淀，不凭感觉写提示词。',
    parameters: {
      subject: { type: 'string', required: true, description: '主体（含 2-3 个特征锚点）。' },
      action: { type: 'string', description: '动作（节拍计数写法：「走四步到窗边，停顿，最后一秒拉开窗帘」）。' },
      shotSize: { type: 'string', enum: ['ECU', 'CU', 'MCU', 'MS', 'MLS', 'LS', 'ELS'], description: '景别（默认 MS）。' },
      angle: { type: 'string', enum: ['eye-level', 'low', 'high', 'birds-eye', 'worms-eye', 'dutch', 'OTS', 'POV'], description: '机位角度（默认 eye-level）。' },
      cameraMove: { type: 'string', description: '运镜（安全词表：static/push_in/pull_out/pan/tilt/parallax/element；大胆：orbit/dolly_zoom/roll/whip）。' },
      lighting: { type: 'string', enum: ['rembrandt', 'low-key', 'high-key', 'neon', 'golden-hour', 'soft-window', 'practical'], description: '布光预设（默认 soft-window）。' },
      mood: { type: 'string', description: '氛围情绪。' },
      composition: { type: 'string', enum: ['rule-of-thirds', 'symmetry', 'negative-space', 'frame-in-frame', 'depth-layers'], description: '构图预设。' },
      durationSec: { type: 'number', description: '单镜时长（只用于建议，不写进提示词）。' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      return buildShotPrompt({
        subject: String(args.subject),
        action: typeof args.action === 'string' ? args.action : undefined,
        shotSize: args.shotSize,
        angle: args.angle,
        cameraMove: typeof args.cameraMove === 'string' ? args.cameraMove : undefined,
        lighting: args.lighting,
        mood: typeof args.mood === 'string' ? args.mood : undefined,
        composition: args.composition,
        durationSec: typeof args.durationSec === 'number' ? args.durationSec : undefined,
      })
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_shot_gate',
    description: '生成前规则 gate：把导演纪律变成规则编号化检查——ECU 惜用律（≤20%）、承接变量必填、描述长度、运镜词表与反单调、模型路由可用性（时长/画幅时）。与成片质检 qa_report 构成生成前后一对 gate。全部确定性，不调模型。',
    parameters: {
      shots: { type: 'array', items: { type: 'object', additionalProperties: true }, required: true, description: 'Shot list（同 shot_sequence 输入形状）。' },
      durationSec: { type: 'number', description: 'Optional target duration for model routing.' },
      aspectRatio: { type: 'string', description: 'Optional aspect ratio for model routing.' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      return gateShotSequence({ shots: Array.isArray(args.shots) ? args.shots as never[] : [], durationSec: args.durationSec, aspectRatio: args.aspectRatio })
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_shot_sequence',
    description: '分镜批量承接链：给一组镜头描述生成逐镜提示词规格 + 承接变量（上镜 end_state / 下镜 start_goal，规则 3b 必填项）+ 首尾帧接力计划（handoff 时本镜挂上一镜末帧）+ 反单调运镜校验。批量生成前的确定性装配层。',
    parameters: {
      shots: { type: 'array', items: { type: 'object', additionalProperties: true }, required: true, description: '[{id?, description, shotSize?, cameraMove?, lighting?, mood?, composition?, handoff?}]' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      return buildShotSequence(Array.isArray(args.shots) ? args.shots as never[] : [])
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_preset',
    description: '生成参数预设包：画幅 × 时长 × 运镜（轮换序防反单调）× 风格语法 slug 的最佳匹配表，并与模型能力路由联动（返回该参数组合下 eligible 模型）。slugs: douyin-oral / xiaohongshu-mix / bilibili-long / ads-vertical / drama-horizontal / mv；不传 slug 返回全部预设清单。',
    parameters: {
      slug: { type: 'string', description: 'Preset slug（不传则列出全部预设）。' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      const slug = typeof args.slug === 'string' && args.slug !== '' ? args.slug : undefined
      return slug === undefined ? listPresets() : generationPreset(slug)
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
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

  disposers.push(ctx.tools.register(safeDefine({
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

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_provider_ingest',
    description: '入驻新生成模型第 1 步：收 model + API 文档（粘贴或 URL）+ 可选 Key/Base URL。Key 只写入本机 secret，不回传到会话。下一步 directorx_provider_classify。',
    parameters: {
      model: { type: 'string', required: true, description: '上游 model id。' },
      capability: { type: 'string', enum: ['image', 'video', 'audio', 'vision'], required: true, description: '挂到哪一个能力。' },
      apiDoc: { type: 'string', description: 'API 文档正文（推荐粘贴关键章节）。' },
      apiDocUrl: { type: 'string', description: '用户给出的文档 URL。插件只拉取这一次。' },
      baseURL: { type: 'string', description: 'API Base URL。' },
      displayName: { type: 'string', description: '设置页显示名。' },
      apiKey: { type: 'string', description: 'API Key。不会出现在工具返回里。' },
    },
    output: objectOutput(),
    timeoutMs: 30_000,
    async execute(args: any) {
      return ingestProvider({
        outputDir: settings.outputDir,
        model: String(args.model),
        capability: args.capability,
        apiDoc: typeof args.apiDoc === 'string' ? args.apiDoc : undefined,
        apiDocUrl: typeof args.apiDocUrl === 'string' ? args.apiDocUrl : undefined,
        baseURL: typeof args.baseURL === 'string' ? args.baseURL : undefined,
        displayName: typeof args.displayName === 'string' ? args.displayName : undefined,
        apiKey: typeof args.apiKey === 'string' ? args.apiKey : undefined,
      })
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_provider_classify',
    description: '入驻第 2 步：用固定指纹判断文档是已有协议（A）还是新 HTTP（B/generic-rest）。不调用模型。',
    parameters: {
      id: { type: 'string', required: true, description: 'ingest 返回的 id。' },
    },
    output: objectOutput(),
    timeoutMs: 15_000,
    async execute(args: any) {
      return classifyProvider(settings.outputDir, String(args.id))
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_provider_draft',
    description: '入驻第 3 步：写入/补全 AdapterSpec。只允许封闭字段（mode/baseURL/auth/create/poll/syncResult/caps）。缺字段返回 issues，不要发明协议。A 类通常只需 baseURL+caps；B 类必须有 create 与 poll 或 syncResult。',
    parameters: {
      id: { type: 'string', required: true, description: 'ingest id。' },
      spec: { type: 'object', additionalProperties: true, required: true, description: 'AdapterSpec 补丁。create.body 的值必须是 {type:"from",field:"prompt"} 或 {type:"const",value}。' },
    },
    output: objectOutput(),
    timeoutMs: 15_000,
    async execute(args: any) {
      return draftProvider(settings.outputDir, String(args.id), args.spec !== null && typeof args.spec === 'object' ? args.spec as Record<string, unknown> : {})
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_provider_smoke',
    description: '入驻第 5 步：最小回归。默认契约+探活。live:true 才打一发最短真调用（B 类 generic-rest），必须先 directorx_confirm。',
    parameters: {
      id: { type: 'string', required: true, description: 'ingest id。' },
      live: { type: 'boolean', description: 'true 时打最短付费调用。默认 false。' },
      createFixture: { type: 'object', additionalProperties: true, description: '文档里的 create 响应示例，用于契约校验。' },
      pollFixture: { type: 'object', additionalProperties: true, description: '文档里的 poll 响应示例。' },
    },
    output: objectOutput(),
    timeoutMs: Math.max(settings.timeoutMs, 120_000),
    async execute(args: any) {
      return smokeProvider({
        settings,
        id: String(args.id),
        live: args.live === true,
        createFixture: args.createFixture,
        pollFixture: args.pollFixture,
      })
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_provider_commit',
    description: '入驻第 6 步：smoke 通过后写入 Settings（mode/model/baseURL/key）并点亮 catalog。设置 live 热更新；请用户刷新页面。',
    parameters: {
      id: { type: 'string', required: true, description: 'ingest id。' },
      force: { type: 'boolean', description: '用户明确跳过回归时才允许。' },
    },
    output: objectOutput(),
    timeoutMs: 15_000,
    async execute(args: any) {
      return commitProvider({
        settings,
        id: String(args.id),
        apply: applyCapability,
        force: args.force === true,
      })
    },
  })))

  disposers.push(ctx.tools.register(safeDefine({
    name: 'directorx_provider_list',
    description: '列出本项目已入驻的生成模型（不含 Key）。',
    parameters: {},
    output: objectOutput(),
    timeoutMs: 10_000,
    async execute() {
      return listProviders(settings.outputDir)
    },
  })))

  return () => {
    for (const dispose of disposers.reverse()) dispose()
    defineRegistered = previous
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
    'directorx_generate_ready',
    'directorx_chengpian',
  ]
  const initiative = parseInitiative(settings.initiative)
  const disposePersona = ctx.systemPrompt.section({
    name: 'directorx:chengpian',
    order: 5,
    text: chengpianPersonaText(initiative),
  })
  const disposeTools = ctx.systemPrompt.section({
    name: 'tool:directorx',
    order: 117,
    text: [
      '## DirectorX media tools',
      '- DirectorX is the 成片 plugin. DSH owns the agent loop. Load skill `directorx-chengpian` and call `directorx_chengpian` before generate/ask. Any choice the user must own goes through `directorx_ask` (DSH standard `userQuestions.ask`). NEVER write a numbered 1. 2. 3. menu in assistant text. Sign the board with `directorx_confirm`. Track stages with `directorx_stage`. After deliver (or when the user says the cut is done), call `directorx_skill_capture` `{ action: "offer", present: true }` so DSH asks: save as 「xx」 skill / rename / skip. If they save, write the SKILL.md from harvest + `directorx_note` feedback, then `action:save`. Same deliver: if this show has locked cast/look, also `directorx_series` save. Next episode `directorx_series apply` before craft. Never write into the plugin `skills/` folder. The user can inspect the board with `/directorx` without spending tokens.',
      '- Skill/knowledge routing: on a craft request, call `directorx_skill_route` first. Read every skill in `skills` and every article id in `articles` (`directorx_knowledge_read 116`, not a new search phrase). `skill_search` / `knowledge_search` hits also carry the other side (`articles` / `skills`). Do not invent a parallel path. 成片任务仍要 `directorx_chengpian`。',
      '- Prompt orchestration: call `directorx_prompt_plan` before `directorx_prompt_craft`. It returns six-element gaps, the physics chain for video, the model copilot to read, and an IP method if names appear. Write the craft yourself. Do not send the canvas one-liner or a canned lens line to generate. Placeholders must already be director crafts (景别/运镜/光线/环境/风格). MiniMax-H3 crafts follow `minimax-h3-prompt-copilot` handbook: name each reference\'s job, write a visible timeline, quote on-screen text, skip role:reference when first/last frames are set, Modelverse 768P/2K (map 1440p→2K) / 4–15s / ≤7000 characters. Other video models may reuse that shape.',
      '- Copyright-safe prompts: if the user names an IP, do not send that name to generate and do not stamp a canned substitute. Call `directorx_ip_scan` (method axes + project memory), `directorx_knowledge_read` 213, write a situation-specific genericization (attributes, not identity), then `directorx_ip_rewrite` to validate and remember. Generate with the rewrite plus `negativeLine`. Cite Nature genericization + arXiv 2406.14526 (rewrite+negative). The canvas underlines those terms in red and hands the rewrite to you.',
      '- Work style: complex work → load `directorx-production-lead` + `directorx-chengpian`, match a recipe, compose research / confirm / placeholders; keep the user informed at unit granularity; answer in the user\'s language (Chinese by default).',
      '- Craft decisions cite rules from `directorx-methodology` (成片结构/提示词工程/剪辑节奏/LLM 精剪速查); QC verdicts reference rule numbers.',
      '- The infinite canvas is the storyboard, but writing it is gated. Read freely (`directorx_canvas_get` / `node` / `search` / `summary`). Do **not** `directorx_canvas_plan` or batch-`directorx_canvas_add` until the user has signed the script/storyboard via `directorx_confirm` or an explicit 「落到画布」. Script and character settings must appear as canvas text nodes (`directorx_canvas_script` / `directorx_character_register` / `directorx_storyboard` / `directorx_bible pin`). After a signed plan: `directorx_canvas_plan` or `directorx_canvas_script` (文本拆成 本→首帧→视频 行) then `directorx_canvas_arrange`. 提取帧用 `directorx_canvas_frames`；成片智能解析用 `directorx_canvas_parse`；局部重绘 `directorx_canvas_reshoot` cut → 生成中段 → assemble；多段成片硬切合成用 `directorx_canvas_pack`（预告片禁止 fade）；九宫格用 `directorx_canvas_sheet`；一张图拆分宫格用 `directorx_canvas_split`；多张图合并宫格用 `directorx_canvas_join`；分屏用 `directorx_canvas_stack`；硬字幕用 `directorx_canvas_desub` 去字幕；视频延长用 `directorx_canvas_extend`；评审动图用 `directorx_canvas_gif`；自动连线用 `directorx_canvas_autolink`。Single-node repairs are fine. The WebUI generate bar only queues `directorx_canvas_intents` — it must not write generating nodes. On a canvas instruction, claim with `directorx_canvas_intents` `{ claim: true }`, then continue only after the same confirm gate.',
      '- Generation: NEVER send the canvas one-liner to generate_*. Order is always `directorx_knowledge_search`/`read` + `directorx_skill_search`/`read` (+ web if facts are missing) → `directorx_prompt_craft` → `directorx_generate_ready` (decide 设定图 / 场景空镜 / 关键帧 / 图生 / 首尾帧; if blocked, `directorx_ask` then make the missing asset first) → propose/confirm → generate with `craftId` **and** `readyId`. 严格/协同 still need an approved `proposalId`. 自动也不得跳过 craft/ready。有人名就要角色设定图；连续镜头要上一镜末帧或本镜关键帧；不要把「转场/硬切」误判成首尾帧。同一系列先 `directorx_series apply`。多人连续 / 单镜长拍 / 完全控制先 `directorx_blocking`（用户给角色图+开场+事件顺序，你写台账再 pin）。只改一镜先 `directorx_revise`，回写只改该节点 path。After a canvas intent, write results back with `directorx_canvas_update`.',
      '- Edit (deterministic, never regenerate): 拿不准先 `directorx_edit_plan`。调色/打开编辑台 → `directorx_studio`（prompt + nodeId）。图片旋转/翻转/裁切/缩放/明暗 → `directorx_image_edit`。单段视频裁剪/变速/静音/倒放/定格 → `directorx_video_process`。多条人话剪辑 → `directorx_edit`。多镜组装 → `directorx_timeline` / `directorx_video_concat`。口播精剪 → 转写后再 `directorx_smart_cut`。这些工具都可带 nodeId，会回写 path、不改镜头标题。完成后 `directorx_extract_frames` + `directorx_view_image` 质检。craft/ready/proposal 只约束生成，不约束本地编辑。不要用生成模型重绘来完成调色、裁切、旋转或变速。',
      '- Reporting: when delivering, state the node/shot list, artifact paths (or WebUI cards), canvas updates, and what is next. Then `directorx_skill_capture` present the save-as-skill card. User revision notes belong in `directorx_note` as they happen. Adaptation reviews go through `directorx_bible` (Markdown on the canvas / in the DSH session), never a standalone HTML file. Base claims on tool results, never on promises.',
      '',
      '## DirectorX media tools',
      `Enabled capabilities: ${enabled.length === 0 ? 'none (open Settings → DirectorX to enable)' : enabled.join(', ')}.`,
      toolList.length > 0 ? `Available tools: ${toolList.join(', ')}.` : '',
      '',
      '- Multi-unit work: `directorx_brief` then follow `compose` 路/稿/位 — `directorx_skill_route` → `directorx_prompt_plan` + craft/ready per shot → `directorx_propose` + `directorx_canvas_shotlist` → `directorx_confirm`. Record `directorx_stage`. Do not generate until the batch is confirmed. Recipes are prior art. `directorx_orchestrate` is optional.',
      '- Before media generation, `directorx_skill_route` then `directorx_skill_read` the matching skill body (manifest is only a summary) and `directorx_knowledge_search` / `directorx_knowledge_read` the corpus. Never claim the library lacks a topic without searching. For production requests, load `directorx-production-lead` first and triage simple vs complex. Record each stage artifact with `directorx_stage`.',
      '- Keep prompts positive and physical; lock subject, style, light, lens, and continuity in writing before calling generation tools. Use `directorx_style` to inject grounded style/camera-language craft from the corpus instead of inventing looks.',
      '- Treat provider responses as authoritative: inspect returned paths/URLs/status before claiming completion.',
      '- Long async tasks persist in the task ledger: after a timeout or interruption, recover them with `directorx_task_status` and stop them with `directorx_cancel_task`; never blindly re-submit.',
      '- Agentic orchestration: for multi-unit goals, compose existing tools against the matching recipe. Use the `workflow` tool only when you need parallel subagents; `directorx-workflow` templates are prior art, not the default path.',
      '- Frame-level QA: extract stills with `directorx_extract_frames`, then inspect them with `directorx_view_image` (multi-frame comparisons) before accepting a video result.',
      '- Subtitle pipeline: `directorx_transcribe_audio` (format srt) produces subtitle files the video editor can overlay; keep transcripts in the output dir for reuse.',
      '- New provider: user gives model + API doc + key. Load skill `directorx-provider-onboard`. Fixed path: `directorx_provider_ingest` → `classify` → `draft` (AdapterSpec only, never write code) → `directorx_ask` (确认协议/是否最短真调用) → `smoke` → `commit`. Never echo the API key. After commit, ask the user to refresh; generate_* stays the only entry.',
      '- If a tool fails with a Base URL / API Key / mode error, tell the user to open WebUI Settings → DirectorX and configure the matching capability.',
    ].filter(Boolean).join('\n'),
  })
  return () => {
    disposePersona()
    disposeTools()
  }
}