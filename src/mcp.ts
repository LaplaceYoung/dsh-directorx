import type { Context } from '@deepseek-ai/cordis'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { DirectorxSettings } from './config.ts'
import { DirectorxCanvasStore } from './canvas.ts'
import { ProposalStore } from './proposals.ts'
import { preflight } from './providers/preflight.ts'
import { audioMix, videoConcat, videoProcess, videoSubtitle } from './providers/video-process.ts'
import { corpus } from './corpus.ts'
import { DirectorService } from './director/mcp-server/service.ts'
import { ProjectRepository } from './director/mcp-server/repository.ts'
import { runCanvasCraft } from './canvas-craft.ts'
import { latestStageSnapshot, stageProjectRoot } from './stage-server.ts'
/**
 * Minimal MCP (Model Context Protocol) surface over the DirectorX tool
 * backend: external agents drive the same deterministic production tools
 * through a Streamable-HTTP-style JSON-RPC endpoint.
 */

const MCP_ROUTE_PATH = '/directorx/mcp'

interface JsonRpcRequest {
  jsonrpc: '2.0'
  id?: number | string
  method: string
  params?: Record<string, unknown>
}

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { 'content-type': 'application/json', 'access-control-allow-origin': '*' })
  response.end(JSON.stringify(body))
}

async function readBody(request: IncomingMessage): Promise<JsonRpcRequest | undefined> {
  let raw = ''
  for await (const chunk of request) raw += String(chunk)
  try {
    return JSON.parse(raw) as JsonRpcRequest
  } catch {
    return undefined
  }
}

const MCP_TOOLS: Array<{ name: string; description: string; inputSchema: Record<string, unknown>; readOnly: boolean }> = [
  { name: 'directorx_canvas_get', description: 'Read the full canvas document (nodes + edges).', inputSchema: { type: 'object', properties: {} }, readOnly: true },
  { name: 'directorx_canvas_add', readOnly: false, description: 'Add a canvas node (image/video/text/group) with optional prompt/shotIndex.', inputSchema: { type: 'object', properties: { kind: { type: 'string' }, id: { type: 'string' }, label: { type: 'string' }, path: { type: 'string' }, prompt: { type: 'string' }, shotIndex: { type: 'number' }, parent: { type: 'string' }, x: { type: 'number' }, y: { type: 'number' } } } },
  { name: 'directorx_canvas_node', description: 'Read one node or edge by id.', inputSchema: { type: 'object', properties: { id: { type: 'string' } } }, readOnly: true },
  { name: 'directorx_canvas_groups', description: 'List groups with members.', inputSchema: { type: 'object', properties: {} }, readOnly: true },
  { name: 'directorx_canvas_group', readOnly: false, description: 'Wrap existing nodes into a new group.', inputSchema: { type: 'object', properties: { memberIds: { type: 'array' }, label: { type: 'string' } } } },
  { name: 'directorx_canvas_disconnect', readOnly: false, description: 'Remove an edge by from/to.', inputSchema: { type: 'object', properties: { from: { type: 'string' }, to: { type: 'string' } } } },
  { name: 'directorx_canvas_sequence', readOnly: false, description: 'Write shotIndex 1..N and optionally connect media.', inputSchema: { type: 'object', properties: { ids: { type: 'array' }, connect: { type: 'boolean' } } } },
  { name: 'directorx_canvas_plan', readOnly: false, description: 'Write acts/shots onto the canvas in one call.', inputSchema: { type: 'object', properties: { title: { type: 'string' }, acts: { type: 'array' }, connect: { type: 'boolean' } } } },
  { name: 'directorx_canvas_script', readOnly: false, description: 'Parse a script card into 本→首帧→视频 rows.', inputSchema: { type: 'object', properties: { nodeId: { type: 'string' }, text: { type: 'string' } } } },
  { name: 'directorx_canvas_frames', readOnly: false, description: 'Extract stills from a video card onto the board.', inputSchema: { type: 'object', properties: { nodeId: { type: 'string' }, count: { type: 'number' } } } },
  { name: 'directorx_canvas_autolink', readOnly: false, description: 'Wire cards by character name and token overlap.', inputSchema: { type: 'object', properties: { nodeId: { type: 'string' }, nodeIds: { type: 'array' } } } },
  { name: 'directorx_canvas_parse', readOnly: false, description: 'Parse a finished video into a script card and cut stills.', inputSchema: { type: 'object', properties: { nodeId: { type: 'string' }, describe: { type: 'boolean' } } } },
  { name: 'directorx_canvas_reshoot', readOnly: false, description: 'Cut a remake window or assemble head+mid+tail.', inputSchema: { type: 'object', properties: { action: { type: 'string' }, nodeId: { type: 'string' }, start: { type: 'number' }, end: { type: 'number' }, prompt: { type: 'string' } } } },
  { name: 'directorx_canvas_pack', readOnly: false, description: 'Concat finished video cards into one cut.', inputSchema: { type: 'object', properties: { nodeIds: { type: 'array' }, transition: { type: 'string' }, fadeSec: { type: 'number' } } } },
  { name: 'directorx_canvas_sheet', readOnly: false, description: 'Pin a contact sheet of selected media.', inputSchema: { type: 'object', properties: { nodeIds: { type: 'array' }, columns: { type: 'number' } } } },
  { name: 'directorx_canvas_split', readOnly: false, description: 'Crop one still into a grid of image cards.', inputSchema: { type: 'object', properties: { nodeId: { type: 'string' }, cols: { type: 'number' }, rows: { type: 'number' } } } },
  { name: 'directorx_canvas_join', readOnly: false, description: 'Tile finished stills back into one numbered grid.', inputSchema: { type: 'object', properties: { nodeIds: { type: 'array' }, columns: { type: 'number' }, numbered: { type: 'boolean' } } } },
  { name: 'directorx_canvas_stack', readOnly: false, description: 'Stack 2–4 finished cards into a split-screen review clip.', inputSchema: { type: 'object', properties: { nodeIds: { type: 'array' }, layout: { type: 'string' } } } },
  { name: 'directorx_canvas_desub', readOnly: false, description: 'Crop or blur burned-in text on a finished video.', inputSchema: { type: 'object', properties: { nodeId: { type: 'string' }, method: { type: 'string' }, region: { type: 'string' } } } },
  { name: 'directorx_canvas_extend', readOnly: false, description: 'Park a last-frame + empty extend card. Does not generate.', inputSchema: { type: 'object', properties: { nodeId: { type: 'string' }, prompt: { type: 'string' } } } },
  { name: 'directorx_canvas_gif', readOnly: false, description: 'Export a finished video card as a GIF still.', inputSchema: { type: 'object', properties: { nodeId: { type: 'string' } } } },
  { name: 'directorx_canvas_batch', readOnly: false, description: 'Batch add nodes and edges in one write.', inputSchema: { type: 'object', properties: { nodes: { type: 'array' }, edges: { type: 'array' } } } },
  { name: 'directorx_canvas_replace', readOnly: false, description: 'Replace the entire canvas document.', inputSchema: { type: 'object', properties: { nodes: { type: 'array' }, edges: { type: 'array' } } } },
  { name: 'directorx_canvas_arrange', readOnly: false, description: 'Auto-layout the canvas (grid/row).', inputSchema: { type: 'object', properties: { layout: { type: 'string' } } } },
  { name: 'directorx_director_get_state', description: 'Read the complete project, evaluated frame, stable IDs, templates and locks.', inputSchema: { type: 'object', properties: {} }, readOnly: true },
  { name: 'directorx_director_create_project', description: 'Create a clean local Director project.', inputSchema: { type: 'object', properties: { name: { type: 'string' } } }, readOnly: false },
  { name: 'directorx_director_select', description: 'Select a shot or exact integer frame at 24fps.', inputSchema: { type: 'object', properties: { shot_id: { type: 'string' }, frame: { type: 'number' } } }, readOnly: false },
  { name: 'directorx_director_add_element', description: 'Add a stable-ID actor, crowd or greybox prop.', inputSchema: { type: 'object', properties: { kind: { type: 'string' }, preset: { type: 'string' }, name: { type: 'string' } } }, readOnly: false },
  { name: 'directorx_director_update_element', description: 'Update a stage element by exact ID.', inputSchema: { type: 'object', properties: { element_id: { type: 'string' }, shot_id: { type: 'string' }, position: { type: 'object' }, rotation_deg: { type: 'object' }, scale: { type: 'object' }, name: { type: 'string' } }, required: ['element_id'] }, readOnly: false },
  { name: 'directorx_director_apply_action', description: 'Apply an actor motion template.', inputSchema: { type: 'object', properties: { element_id: { type: 'string' }, action: { type: 'string' }, shot_id: { type: 'string' } }, required: ['element_id', 'action'] }, readOnly: false },
  { name: 'directorx_director_set_motion_keyframe', description: 'Set an actor motion keyframe.', inputSchema: { type: 'object', properties: { action_id: { type: 'string' }, frame: { type: 'number' }, shot_id: { type: 'string' } }, required: ['action_id', 'frame'] }, readOnly: false },
  { name: 'directorx_director_apply_camera', description: 'Apply a camera move template.', inputSchema: { type: 'object', properties: { move: { type: 'string' }, shot_id: { type: 'string' } }, required: ['move'] }, readOnly: false },
  { name: 'directorx_director_set_camera_keyframe', description: 'Set a camera keyframe.', inputSchema: { type: 'object', properties: { frame: { type: 'number' }, shot_id: { type: 'string' }, keyframe_id: { type: 'string' } }, required: ['frame'] }, readOnly: false },
  { name: 'directorx_director_manage_shot', description: 'Add, duplicate, rename, reorder or delete a shot.', inputSchema: { type: 'object', properties: { operation: { type: 'string' }, shot_id: { type: 'string' }, name: { type: 'string' } }, required: ['operation'] }, readOnly: false },
  { name: 'directorx_director_set_lock', description: 'Lock or unlock an action or keyframe.', inputSchema: { type: 'object', properties: { target: { type: 'string' }, id: { type: 'string' }, locked: { type: 'boolean' } }, required: ['target', 'id'] }, readOnly: false },
  { name: 'directorx_director_delete', description: 'Delete an element, action or keyframe.', inputSchema: { type: 'object', properties: { target: { type: 'string' }, id: { type: 'string' }, shot_id: { type: 'string' } }, required: ['target', 'id'] }, readOnly: false },
  { name: 'directorx_director_undo', description: 'Undo one Director edit.', inputSchema: { type: 'object', properties: {} }, readOnly: false },
  { name: 'directorx_director_redo', description: 'Redo one Director edit.', inputSchema: { type: 'object', properties: {} }, readOnly: false },
  { name: 'directorx_director_validate', description: 'Validate the Director project.', inputSchema: { type: 'object', properties: {} }, readOnly: true },
  { name: 'directorx_stage_snapshot', description: 'Read the latest browser-rendered Director Stage snapshot path.', inputSchema: { type: 'object', properties: {} }, readOnly: true },
  { name: 'directorx_video_process', readOnly: false, description: 'Deterministic trim/speed/scale/volume/mute/fps via ffmpeg.', inputSchema: { type: 'object', properties: { source: { type: 'string' }, start: { type: 'number' }, end: { type: 'number' }, speed: { type: 'number' }, scale: { type: 'string' }, volume: { type: 'number' }, mute: { type: 'boolean' }, fps: { type: 'number' } } } },
  { name: 'directorx_proposals', description: 'List generation proposals.', inputSchema: { type: 'object', properties: { status: { type: 'string' } } }, readOnly: true },
  { name: 'directorx_preflight', description: 'Four-gate pre-generation audit.', inputSchema: { type: 'object', properties: { prompt: { type: 'string' }, type: { type: 'string' } } }, readOnly: true },
  { name: 'directorx_style', description: 'Grounded style/camera-language injection from the corpus.', inputSchema: { type: 'object', properties: { style: { type: 'string' } } }, readOnly: true },
  { name: 'directorx_video_concat', readOnly: false, description: 'Concatenate clips (cut or xfade).', inputSchema: { type: 'object', properties: { files: { type: 'array' }, transition: { type: 'string' }, fadeSec: { type: 'number' }, scale: { type: 'string' } } } },
  { name: 'directorx_audio_mix', readOnly: false, description: 'Mix tracks onto a video with ducking.', inputSchema: { type: 'object', properties: { video: { type: 'string' }, tracks: { type: 'array' }, duckUnder: { type: 'number' } } } },
  { name: 'directorx_video_subtitle', readOnly: false, description: 'Mux or burn subtitles.', inputSchema: { type: 'object', properties: { video: { type: 'string' }, srt: { type: 'string' }, mode: { type: 'string' } } } },
]

export function registerMcpRoute(ctx: Context, getSettings: () => DirectorxSettings): () => void {
  const webServer = ctx.get('webServer') as
    | { register(route: { kind: 'exact' | 'prefix'; path: string; handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void> }): () => void }
    | undefined
  if (webServer === undefined) return () => {}
  return webServer.register({
    kind: 'exact',
    path: MCP_ROUTE_PATH,
    handler: async (request, response) => {
      if (request.method !== 'POST') {
        response.writeHead(405)
        response.end('method not allowed')
        return
      }
      const rpc = await readBody(request)
      if (rpc === undefined || rpc.jsonrpc !== '2.0') {
        sendJson(response, 400, { jsonrpc: '2.0', error: { code: -32700, message: 'parse error' }, id: null })
        return
      }
      const respond = (result: unknown) => sendJson(response, 200, { jsonrpc: '2.0', id: rpc.id ?? null, result })
      // 类型化信封：{ok, result} 或 {ok:false, error:{code,message,details,recoverable}}
      // ——外部 agent 按类型路由，不再解析自由文本错误。
      const envelope = (result: unknown) => ({ ok: true, result })
      const envelopeError = (error: unknown) => {
        const message = error instanceof Error ? error.message : String(error)
        const code = (error as { code?: string } | null)?.code ?? 'internal'
        return {
          ok: false,
          error: {
            code,
            message,
            details: (error as { detail?: string } | null)?.detail ?? null,
            recoverable: code === 'internal' || code === 'parse' || code === 'notFound',
          },
        }
      }
      const fail = (code: number, message: string) => sendJson(response, 200, { jsonrpc: '2.0', id: rpc.id ?? null, error: { code, message } })
      try {
        if (rpc.method === 'initialize') {
          respond({ protocolVersion: '2025-03-26', capabilities: { tools: {} }, serverInfo: { name: 'dsh-directorx', version: '1.0.0' } })
          return
        }
        if (rpc.method === 'tools/list') {
          respond({ tools: MCP_TOOLS })
          return
        }
        if (rpc.method === 'tools/call') {
          const name = String(rpc.params?.name ?? '')
          const args = (rpc.params?.arguments ?? {}) as Record<string, unknown>
          const settings = getSettings()
          const repository = new ProjectRepository(stageProjectRoot(settings.outputDir))
          const director = new DirectorService(repository)
          if (name === 'directorx_stage_snapshot') {
            const path = latestStageSnapshot(settings.outputDir)
            respond(envelope({ ok: path !== undefined, ...(path !== undefined ? { path } : {}) }))
            return
          }
          if (name.startsWith('directorx_director_')) {
            if (args.override_locked === true) {
              fail(-32602, 'override_locked=true requires explicit user confirmation')
              return
            }
            respond(envelope(await director.execute(name.slice('directorx_'.length), args)))
            return
          }
          const canvas = new DirectorxCanvasStore(settings.outputDir)
          const proposals = new ProposalStore(settings.outputDir)
          const stageSnapshot = () => {
            const path = latestStageSnapshot(settings.outputDir)
            respond(envelope({ ok: path !== undefined, ...(path !== undefined ? { path } : {}) }))
          }
          switch (name) {
            case 'directorx_stage_snapshot': stageSnapshot(); return
            case 'directorx_canvas_get': respond(envelope(await canvas.read())); return
            case 'directorx_canvas_add': respond(envelope(await canvas.addNode(args as never))); return
            case 'directorx_canvas_node': respond(envelope(await canvas.getNode(String(args.id ?? '')))); return
            case 'directorx_canvas_groups': respond(envelope(await canvas.listGroups())); return
            case 'directorx_canvas_group': respond(envelope(await canvas.groupNodes({ memberIds: Array.isArray(args.memberIds) ? args.memberIds.map(String) : [], ...(typeof args.label === 'string' ? { label: args.label } : {}) }))); return
            case 'directorx_canvas_disconnect': respond(envelope(await canvas.disconnect(String(args.from ?? ''), String(args.to ?? '')))); return
            case 'directorx_canvas_sequence': respond(envelope(await canvas.sequenceShots({ ids: Array.isArray(args.ids) ? args.ids.map(String) : [], ...(args.connect === true ? { connect: true } : {}) }))); return
            case 'directorx_canvas_plan': respond(envelope(await canvas.planBoard({ acts: Array.isArray(args.acts) ? args.acts as never[] : [], ...(typeof args.title === 'string' ? { title: args.title } : {}), ...(args.connect === false ? { connect: false } : {}) }))); return
            case 'directorx_canvas_script': respond(envelope(await runCanvasCraft({ outputDir: settings.outputDir, action: 'script', ...(typeof args.nodeId === 'string' ? { nodeId: args.nodeId } : {}), ...(typeof args.text === 'string' ? { text: args.text } : {}) }))); return
            case 'directorx_canvas_frames': respond(envelope(await runCanvasCraft({ outputDir: settings.outputDir, action: 'frames', nodeId: String(args.nodeId ?? ''), ...(typeof args.count === 'number' ? { count: args.count } : {}) }))); return
            case 'directorx_canvas_autolink': respond(envelope(await runCanvasCraft({ outputDir: settings.outputDir, action: 'autolink', ...(typeof args.nodeId === 'string' ? { nodeId: args.nodeId } : {}), ...(Array.isArray(args.nodeIds) ? { nodeIds: args.nodeIds.map(String) } : {}) }))); return
            case 'directorx_canvas_parse': respond(envelope(await runCanvasCraft({ outputDir: settings.outputDir, action: 'parse', nodeId: String(args.nodeId ?? ''), settings, ...(args.describe === true ? { describe: true } : {}) }))); return
            case 'directorx_canvas_reshoot': respond(envelope(await runCanvasCraft({ outputDir: settings.outputDir, action: 'reshoot', nodeId: String(args.nodeId ?? ''), phase: args.action === 'assemble' ? 'assemble' : 'cut', ...(typeof args.start === 'number' ? { start: args.start } : {}), ...(typeof args.end === 'number' ? { end: args.end } : {}), ...(typeof args.prompt === 'string' ? { prompt: args.prompt } : {}) }))); return
            case 'directorx_canvas_pack': respond(envelope(await runCanvasCraft({ outputDir: settings.outputDir, action: 'pack', ...(Array.isArray(args.nodeIds) ? { nodeIds: args.nodeIds.map(String) } : {}), ...(args.transition === 'fade' || args.transition === 'cut' ? { transition: args.transition } : {}), ...(typeof args.fadeSec === 'number' ? { fadeSec: args.fadeSec } : {}) }))); return
            case 'directorx_canvas_sheet': respond(envelope(await runCanvasCraft({ outputDir: settings.outputDir, action: 'sheet', ...(Array.isArray(args.nodeIds) ? { nodeIds: args.nodeIds.map(String) } : {}), ...(typeof args.columns === 'number' ? { columns: args.columns } : {}) }))); return
            case 'directorx_canvas_split': respond(envelope(await runCanvasCraft({ outputDir: settings.outputDir, action: 'split', nodeId: String(args.nodeId ?? ''), ...(typeof args.cols === 'number' ? { cols: args.cols } : {}), ...(typeof args.rows === 'number' ? { rows: args.rows } : {}) }))); return
            case 'directorx_canvas_join': respond(envelope(await runCanvasCraft({ outputDir: settings.outputDir, action: 'join', ...(Array.isArray(args.nodeIds) ? { nodeIds: args.nodeIds.map(String) } : {}), ...(typeof args.columns === 'number' ? { columns: args.columns } : {}), ...(args.numbered === false ? { numbered: false } : {}) }))); return
            case 'directorx_canvas_stack': respond(envelope(await runCanvasCraft({ outputDir: settings.outputDir, action: 'stack', ...(Array.isArray(args.nodeIds) ? { nodeIds: args.nodeIds.map(String) } : {}), ...(args.layout === '2x1' || args.layout === '1x2' || args.layout === '2x2' ? { layout: args.layout } : {}) }))); return
            case 'directorx_canvas_desub': respond(envelope(await runCanvasCraft({ outputDir: settings.outputDir, action: 'desub', nodeId: String(args.nodeId ?? ''), ...(args.method === 'crop' || args.method === 'blur' ? { method: args.method } : {}), ...(typeof args.region === 'string' ? { region: args.region } : {}) }))); return
            case 'directorx_canvas_extend': respond(envelope(await runCanvasCraft({ outputDir: settings.outputDir, action: 'extend', nodeId: String(args.nodeId ?? ''), ...(typeof args.prompt === 'string' ? { prompt: args.prompt } : {}) }))); return
            case 'directorx_canvas_gif': respond(envelope(await runCanvasCraft({ outputDir: settings.outputDir, action: 'gif', nodeId: String(args.nodeId ?? '') }))); return
            case 'directorx_canvas_batch': respond(envelope(await canvas.batchAdd({ nodes: (args.nodes ?? []) as never[], edges: (args.edges ?? []) as never[] }))); return
            case 'directorx_canvas_replace': { const current = await canvas.read(); respond(envelope(await canvas.write({ version: 1, updatedAt: 0, nodes: (args.nodes ?? []) as never[], edges: (args.edges ?? []) as never[] }, current.updatedAt))); return }
            case 'directorx_canvas_arrange': respond(envelope(await canvas.arrange(args.layout === 'row' ? 'row' : 'grid'))); return
            case 'directorx_propose': respond(envelope(await proposals.propose(args as never))); return
            case 'directorx_proposals': respond(envelope(await proposals.list(args.status as never))); return
            case 'directorx_preflight': respond(envelope(preflight(args as never))); return
            case 'directorx_style': {
              const style = String(args.style ?? '').trim()
              if (style === '') { fail(-32602, 'style is required'); return }
              const hits = await corpus.search(style, 1)
              if (hits.length === 0) { respond({ style, found: false, hint: 'no corpus match' }); return }
              const article = await corpus.readArticle(hits[0].id)
              respond({ style, found: true, article: { id: article.article.id, title: article.article.title }, guidance: article.content.slice(0, 2500) })
              return
            }
            case 'directorx_video_process': respond(envelope(await videoProcess({ source: String(args.source ?? ''), outputDir: settings.outputDir, start: typeof args.start === 'number' ? args.start : undefined, end: typeof args.end === 'number' ? args.end : undefined, speed: typeof args.speed === 'number' ? args.speed : undefined, scale: typeof args.scale === 'string' ? args.scale : undefined, volume: typeof args.volume === 'number' ? args.volume : undefined, mute: args.mute === true, fps: typeof args.fps === 'number' ? args.fps : undefined }))); return
            case 'directorx_video_concat': respond(envelope(await videoConcat({ files: Array.isArray(args.files) ? args.files.map(String) : [], outputDir: settings.outputDir, transition: args.transition === 'cut' ? 'cut' : 'fade', fadeSec: typeof args.fadeSec === 'number' ? args.fadeSec : undefined, scale: typeof args.scale === 'string' ? args.scale : undefined }))); return
            case 'directorx_audio_mix': respond(envelope(await audioMix({ video: String(args.video ?? ''), outputDir: settings.outputDir, tracks: Array.isArray(args.tracks) ? args.tracks as never[] : [], duckUnder: typeof args.duckUnder === 'number' ? args.duckUnder : undefined }))); return
            case 'directorx_video_subtitle': respond(envelope(await videoSubtitle({ video: String(args.video ?? ''), srt: String(args.srt ?? ''), outputDir: settings.outputDir, mode: args.mode === 'burn' ? 'burn' : 'soft' }))); return
            default: fail(-32602, `unknown tool "${name}"`); return
          }
        }
        if (rpc.method === 'notifications/initialized') {
          sendJson(response, 202, { jsonrpc: '2.0', id: rpc.id ?? null, result: {} })
          return
        }
        fail(-32601, `method not found: ${rpc.method}`)
      } catch (error) {
        respond(envelopeError(error))
      }
    },
  })
}
