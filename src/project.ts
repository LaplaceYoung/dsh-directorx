import { AsyncLocalStorage } from 'node:async_hooks'
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import type { IncomingMessage } from 'node:http'
import { join, resolve } from 'node:path'

const projectStore = new AsyncLocalStorage<string>()

/** Workspace directory the current tool/HTTP call should write into. */
export function currentProjectRoot(): string {
  return projectStore.getStore() ?? process.cwd()
}

export function runInProject<T>(root: string | undefined, fn: () => T): T {
  const next = typeof root === 'string' && root.trim() !== '' ? resolve(root) : currentProjectRoot()
  return projectStore.run(next, fn)
}

export function sessionProjectRoot(exec: unknown): string | undefined {
  const cwd = (exec as { agent?: { session?: { header?: { cwd?: string } } } } | null)?.agent?.session?.header?.cwd
  return typeof cwd === 'string' && cwd.trim() !== '' ? cwd : undefined
}

export function projectFromRequest(request: IncomingMessage): string | undefined {
  const header = request.headers['x-directorx-project']
  if (typeof header === 'string' && header.trim() !== '') return header.trim()
  const url = request.url ?? ''
  const queryStart = url.indexOf('?')
  if (queryStart < 0) return undefined
  const value = new URLSearchParams(url.slice(queryStart + 1)).get('project')
  return value !== null && value.trim() !== '' ? value.trim() : undefined
}

function normalizeProjects(items: Array<{ path?: string; title?: string }>): Array<{ path: string; title: string }> {
  return items
    .map(item => ({
      path: typeof item.path === 'string' ? item.path : '',
      title: typeof item.title === 'string' && item.title !== '' ? item.title : (item.path ?? '').split('/').filter(Boolean).at(-1) ?? '',
    }))
    .filter(item => item.path !== '')
}

function listProjectsFromDisk(): Array<{ path: string; title: string }> {
  const home = process.env.DSH_HOME ?? join(homedir(), '.dsh')
  try {
    const parsed = JSON.parse(readFileSync(join(home, 'storages', 'workspace.json'), 'utf8')) as {
      tables?: { workspaces?: Record<string, { path?: string; title?: string }> }
    }
    return normalizeProjects(Object.values(parsed.tables?.workspaces ?? {}))
  } catch {
    return []
  }
}

export function listWorkspaceRoots(ctx: { get(name: string): unknown }): Array<{ path: string; title: string }> {
  const workspace = ctx.get('workspace') as { list?: () => Array<{ path?: string; title?: string }> } | undefined
  const live = normalizeProjects(workspace?.list?.() ?? [])
  return live.length > 0 ? live : listProjectsFromDisk()
}

export function resolveRequestProject(ctx: { get(name: string): unknown }, request: IncomingMessage): string {
  const requested = projectFromRequest(request)
  const allowed = listWorkspaceRoots(ctx).map(item => resolve(item.path))
  if (requested === undefined) return allowed[0] ?? process.cwd()
  const resolved = resolve(requested)
  if (allowed.includes(resolved)) return resolved
  if (allowed.length === 0) return resolved
  throw new Error('unknown project')
}
