/**
 * Bare `/directorx` opens a DSH popupSelect (ui-command decoration).
 * Argued lines (`/directorx shotlist`) stay on the host command handler.
 *
 * DSH 0.1.0-rc.8 names the client service `commandUi` and executes through
 * `remote.commands.execute(sessionId, line, images)`. Older hosts used
 * `command` + `connection.api.commands.execute`.
 */

export const DIRECTORX_SLASH_OPTIONS = [
  { id: 'board', label: '制片板', detail: '分镜计数 + 提案队列' },
  { id: 'shotlist', label: '分镜表', detail: '编号镜 + 时长预算' },
  { id: 'proposals', label: '提案队列', detail: '占位提示词 / 模型 / 规格' },
  { id: 'next', label: '下一条待批', detail: '最旧待批或已批未执行' },
] as const

export function directorxCommandLine(optionId: string): string {
  return optionId === 'board' ? '/directorx board' : `/directorx ${optionId}`
}

interface CommandFace {
  decorate(decoration: {
    name: string
    available: (session: { sessionId: string }) => boolean
    ui: {
      kind: 'popupSelect'
      options: (session: { sessionId: string }, signal?: AbortSignal) => Promise<readonly { id: string; label: string; detail?: string }[]>
      onSelect: (option: { id: string }, session: { sessionId: string }) => void | Promise<void>
    }
  }): () => void
}

interface RemoteCommands {
  execute(sessionId: string, line: string, images?: readonly unknown[]): Promise<unknown>
}

interface ConnectionCommands {
  execute(request: {
    sessionId?: string
    agentId?: string
    line: string
    images?: readonly unknown[]
  }): Promise<unknown>
}

interface InjectContext {
  get(name: string): unknown
  inject?(deps: string[], callback: (ctx: InjectContext) => void): void
}

function optionalService(ctx: InjectContext, name: string): unknown {
  try {
    const rec = ctx as unknown as Record<string, unknown>
    return rec[name] ?? ctx.get(name)
  } catch {
    return undefined
  }
}

export async function executeDirectorxLine(ctx: InjectContext, sessionId: string, line: string): Promise<void> {
  const remote = optionalService(ctx, 'remote') as { commands?: RemoteCommands } | undefined
  if (remote?.commands !== undefined && typeof remote.commands.execute === 'function') {
    await remote.commands.execute(sessionId, line, [])
    return
  }
  const connection = optionalService(ctx, 'connection') as { api?: { commands?: ConnectionCommands } } | undefined
  const execute = connection?.api?.commands?.execute
  if (execute === undefined) return
  await execute({ sessionId, agentId: sessionId, line, images: [] })
}

function decorateDirectorx(ctx: InjectContext, command: CommandFace): void {
  command.decorate({
    name: 'directorx',
    available: () => true,
    ui: {
      kind: 'popupSelect',
      options: async () => DIRECTORX_SLASH_OPTIONS.map(option => ({ ...option })),
      onSelect: async (option, session) => {
        await executeDirectorxLine(ctx, session.sessionId, directorxCommandLine(option.id))
      },
    },
  })
}

export function registerDirectorxSlash(ctx: InjectContext): void {
  const attach = (host: InjectContext): boolean => {
    const command = (optionalService(host, 'command') ?? optionalService(host, 'commandUi')) as CommandFace | undefined
    if (command === undefined || typeof command.decorate !== 'function') return false
    decorateDirectorx(host, command)
    return true
  }
  if (attach(ctx)) return
  if (typeof ctx.inject !== 'function') return
  // Current WebUI publishes `command`; retain commandUi as an eager alias only
  // for older hosts where attach(ctx) can already see it.
  ctx.inject(['command'], attach)
}
