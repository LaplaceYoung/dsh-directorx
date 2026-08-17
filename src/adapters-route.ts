import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from 'cordis'
import { resolveRequestProject, runInProject } from './project.ts'
import { AdapterStore, publicRecord } from './providers/adapter-store.ts'
import { ingestProvider } from './providers/provider-onboard.ts'
import type { AdapterCapability } from './providers/adapter-spec.ts'

export const ADAPTERS_ROUTE_PATH = '/directorx/adapters'

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { 'content-type': 'application/json' })
  response.end(JSON.stringify(body))
}

async function readJson(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = []
  for await (const chunk of request) chunks.push(Buffer.from(chunk as Buffer))
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') as Record<string, unknown>
  } catch {
    return {}
  }
}

export function registerAdaptersRoute(ctx: Context, getOutputDir: () => string): () => void {
  const webServer = ctx.get('webServer') as
    | { register(route: { kind: 'exact' | 'prefix'; path: string; handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void> }): () => void }
    | undefined
  if (webServer === undefined) return () => {}
  return webServer.register({
    kind: 'exact',
    path: ADAPTERS_ROUTE_PATH,
    handler: async (request, response) => {
      let project: string
      try {
        project = resolveRequestProject(ctx, request)
      } catch {
        sendJson(response, 403, { ok: false, message: 'unknown project' })
        return
      }
      await runInProject(project, async () => {
        const outputDir = getOutputDir()
        if (request.method === 'GET') {
          const store = new AdapterStore(outputDir)
          const adapters = []
          for (const record of await store.list()) {
            adapters.push(publicRecord(record, await store.hasSecret(record.spec.id)))
          }
          sendJson(response, 200, { adapters })
          return
        }
        if (request.method === 'POST') {
          const body = await readJson(request)
          const capability = String(body.capability ?? 'video')
          if (!['image', 'video', 'audio', 'vision'].includes(capability)) {
            sendJson(response, 400, { ok: false, message: 'capability 必须是 image/video/audio/vision' })
            return
          }
          try {
            const result = await ingestProvider({
              outputDir,
              model: String(body.model ?? ''),
              capability: capability as AdapterCapability,
              apiDoc: typeof body.apiDoc === 'string' ? body.apiDoc : undefined,
              apiDocUrl: typeof body.apiDocUrl === 'string' ? body.apiDocUrl : undefined,
              baseURL: typeof body.baseURL === 'string' ? body.baseURL : undefined,
              displayName: typeof body.displayName === 'string' ? body.displayName : undefined,
              apiKey: typeof body.apiKey === 'string' ? body.apiKey : undefined,
            })
            sendJson(response, 200, { ok: true, ...result, hint: `在会话里说：继续接入 ${result.id}` })
          } catch (error) {
            sendJson(response, 400, { ok: false, message: error instanceof Error ? error.message : String(error) })
          }
          return
        }
        sendJson(response, 405, { ok: false, message: 'method not allowed' })
      })
    },
  })
}
