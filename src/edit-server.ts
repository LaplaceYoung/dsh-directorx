/**
 * 剪辑台静态伺服：把打包后的剪辑台页面挂在 /directorx/edit/。
 * 浏览器内持久化走 IndexedDB；本路由只提供 HTML/JS/WASM 与 hub 桥。
 */
import { existsSync, statSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { dirname, extname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import { directorxWeb } from './media-server.ts'

export const EDIT_BASE = '/directorx/edit'

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.wasm': 'application/wasm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
}

function publicDir(): string {
  const dir = dirname(fileURLToPath(import.meta.url))
  const next = join(dir, 'edit')
  return existsSync(next) ? next : join(dir, '..', 'lib', 'edit')
}

function staticPath(base: string, rel: string): string | undefined {
  const cleaned = rel.replace(/^\/+/, '').split('?')[0]
  const full = resolve(join(base, cleaned === '' ? 'index.html' : cleaned))
  if (full !== base && !full.startsWith(base + sep)) return undefined
  return full
}

export function registerEditRoutes(ctx: Context): () => void {
  const webServer = directorxWeb(ctx)
  if (webServer === undefined) return () => {}
  return webServer.register({
    kind: 'prefix',
    path: EDIT_BASE,
    async handler(request, response) {
      const url = new URL(request.url ?? '/', 'http://directorx.local')
      const rest = url.pathname.startsWith(EDIT_BASE) ? url.pathname.slice(EDIT_BASE.length) || '/' : url.pathname
      const file = staticPath(publicDir(), rest)
      if (file === undefined || !existsSync(file) || !statSync(file).isFile()) {
        response.writeHead(404)
        response.end('not found')
        return
      }
      const ext = extname(file).toLowerCase()
      response.writeHead(200, {
        'content-type': CONTENT_TYPES[ext] ?? 'application/octet-stream',
        'cache-control': 'no-cache',
      })
      response.end(await readFile(file))
    },
  })
}

