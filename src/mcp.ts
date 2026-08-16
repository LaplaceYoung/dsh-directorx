import type { Context } from 'cordis'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { DirectorxSettings } from './config.ts'
import { DirectorxCanvasStore } from './canvas.ts'
import { ProposalStore } from './proposals.ts'
import { preflight } from './providers/preflight.ts'
import { audioMix, videoConcat, videoProcess, videoSubtitle } from './providers/video-process.ts'
import { corpus } from './corpus.ts'

/**
 * Minimal MCP (Model Context Protocol) surface over the DirectorX tool
 * backend: external agents (Claude Desktop / ChatGPT / Cursor) drive the
 * same deterministic production tools through a Streamable-HTTP-style
 * JSON-RPC endpoint. This mirrors the ecosystem pattern (e.g. Runway MCP)
 * of exposing a media studio to external assistants.
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

const MCP_TOOLS: Array<{ name: string; description: string; inputSchema: Record<string, unknown> }> = [
  { name: 'directorx_canvas_get', description: 'Read the full canvas document (nodes + edges).', inputSchema: { type: 'object', properties: {} } },
  { name: 'directorx_canvas_add', description: 'Add a canvas node (image/video/text/group).', inputSchema: { type: 'object', properties: { kind: { type: 'string' }, label: { type: 'string' }, path: { type: 'string' }, x: { type: 'number' }, y: { type: 'number' }, parent: { type: 'string' } } } },
  { name: 'directorx_canvas_batch', description: 'Batch add nodes and edges in one write.', inputSchema: { type: 'object', properties: { nodes: { type: 'array' }, edges: { type: 'array' } } } },
  { name: 'directorx_canvas_replace', description: 'Replace the entire canvas document.', inputSchema: { type: 'object', properties: { nodes: { type: 'array' }, edges: { type: 'array' } } } },
  { name: 'directorx_canvas_arrange', description: 'Auto-layout the canvas (grid/row).', inputSchema: { type: 'object', properties: { layout: { type: 'string' } } } },
  { name: 'directorx_propose', description: 'Queue a generation proposal placeholder (no API spend).', inputSchema: { type: 'object', properties: { kind: { type: 'string' }, prompt: { type: 'string' }, count: { type: 'number' }, duration: { type: 'number' } } } },
  { name: 'directorx_proposals', description: 'List generation proposals.', inputSchema: { type: 'object', properties: { status: { type: 'string' } } } },
  { name: 'directorx_preflight', description: 'Four-gate pre-generation audit.', inputSchema: { type: 'object', properties: { prompt: { type: 'string' }, type: { type: 'string' } } } },
  { name: 'directorx_style', description: 'Grounded style/camera-language injection from the corpus.', inputSchema: { type: 'object', properties: { style: { type: 'string' } } } },
  { name: 'directorx_video_process', description: 'Deterministic trim/speed/scale/volume/mute/fps via ffmpeg.', inputSchema: { type: 'object', properties: { source: { type: 'string' }, start: { type: 'number' }, end: { type: 'number' }, speed: { type: 'number' }, scale: { type: 'string' }, volume: { type: 'number' }, mute: { type: 'boolean' }, fps: { type: 'number' } } } },
  { name: 'directorx_video_concat', description: 'Concatenate clips (cut or xfade).', inputSchema: { type: 'object', properties: { files: { type: 'array' }, transition: { type: 'string' }, fadeSec: { type: 'number' }, scale: { type: 'string' } } } },
  { name: 'directorx_audio_mix', description: 'Mix tracks onto a video with ducking.', inputSchema: { type: 'object', properties: { video: { type: 'string' }, tracks: { type: 'array' }, duckUnder: { type: 'number' } } } },
  { name: 'directorx_video_subtitle', description: 'Mux or burn subtitles.', inputSchema: { type: 'object', properties: { video: { type: 'string' }, srt: { type: 'string' }, mode: { type: 'string' } } } },
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
          const canvas = new DirectorxCanvasStore(settings.outputDir)
          const proposals = new ProposalStore(settings.outputDir)
          switch (name) {
            case 'directorx_canvas_get': respond(await canvas.read()); return
            case 'directorx_canvas_add': respond(await canvas.addNode(args as never)); return
            case 'directorx_canvas_batch': respond(await canvas.batchAdd({ nodes: (args.nodes ?? []) as never[], edges: (args.edges ?? []) as never[] })); return
            case 'directorx_canvas_replace': { const current = await canvas.read(); respond(await canvas.write({ version: 1, updatedAt: 0, nodes: (args.nodes ?? []) as never[], edges: (args.edges ?? []) as never[] }, current.updatedAt)); return }
            case 'directorx_canvas_arrange': respond(await canvas.arrange(args.layout === 'row' ? 'row' : 'grid')); return
            case 'directorx_propose': respond(await proposals.propose(args as never)); return
            case 'directorx_proposals': respond(await proposals.list(args.status as never)); return
            case 'directorx_preflight': respond(preflight(args as never)); return
            case 'directorx_style': {
              const style = String(args.style ?? '').trim()
              if (style === '') { fail(-32602, 'style is required'); return }
              const hits = await corpus.search(style, 1)
              if (hits.length === 0) { respond({ style, found: false, hint: 'no corpus match' }); return }
              const article = await corpus.readArticle(hits[0].id)
              respond({ style, found: true, article: { id: article.article.id, title: article.article.title }, guidance: article.content.slice(0, 2500) })
              return
            }
            case 'directorx_video_process': respond(await videoProcess({ source: String(args.source ?? ''), outputDir: settings.outputDir, start: typeof args.start === 'number' ? args.start : undefined, end: typeof args.end === 'number' ? args.end : undefined, speed: typeof args.speed === 'number' ? args.speed : undefined, scale: typeof args.scale === 'string' ? args.scale : undefined, volume: typeof args.volume === 'number' ? args.volume : undefined, mute: args.mute === true, fps: typeof args.fps === 'number' ? args.fps : undefined })); return
            case 'directorx_video_concat': respond(await videoConcat({ files: Array.isArray(args.files) ? args.files.map(String) : [], outputDir: settings.outputDir, transition: args.transition === 'cut' ? 'cut' : 'fade', fadeSec: typeof args.fadeSec === 'number' ? args.fadeSec : undefined, scale: typeof args.scale === 'string' ? args.scale : undefined })); return
            case 'directorx_audio_mix': respond(await audioMix({ video: String(args.video ?? ''), outputDir: settings.outputDir, tracks: Array.isArray(args.tracks) ? args.tracks as never[] : [], duckUnder: typeof args.duckUnder === 'number' ? args.duckUnder : undefined })); return
            case 'directorx_video_subtitle': respond(await videoSubtitle({ video: String(args.video ?? ''), srt: String(args.srt ?? ''), outputDir: settings.outputDir, mode: args.mode === 'burn' ? 'burn' : 'soft' })); return
            default: fail(-32602, `unknown tool "${name}"`); return
          }
        }
        if (rpc.method === 'notifications/initialized') {
          sendJson(response, 202, { jsonrpc: '2.0', id: rpc.id ?? null, result: {} })
          return
        }
        fail(-32601, `method not found: ${rpc.method}`)
      } catch (error) {
        fail(-32000, error instanceof Error ? error.message : String(error))
      }
    },
  })
}
