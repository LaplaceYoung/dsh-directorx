/**
 * Bare `/directorx` opens a DSH popupSelect (ui-command decoration).
 * Argued lines (`/directorx shotlist`) stay on the host command handler.
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
      options: () => Promise<readonly { id: string; label: string; detail?: string }[]>
      onSelect: (option: { id: string }, session: { sessionId: string }) => void | Promise<void>
    }
  }): () => void
}

interface ConnectionFace {
  api: {
    commands: {
      execute: (request: { sessionId: string; line: string }) => Promise<unknown>
    }
  }
}

interface InjectContext {
  get(name: string): unknown
  inject?(deps: string[], callback: (ctx: InjectContext) => void): void
}

export function registerDirectorxSlash(ctx: InjectContext): void {
  if (typeof ctx.inject !== 'function') return
  ctx.inject(['command'], (commandCtx) => {
    const command = commandCtx.get('command') as CommandFace | undefined
    const connection = commandCtx.get('connection') as ConnectionFace | undefined
    if (command === undefined || connection === undefined) return
    command.decorate({
      name: 'directorx',
      available: () => true,
      ui: {
        kind: 'popupSelect',
        options: async () => DIRECTORX_SLASH_OPTIONS.map(option => ({ ...option })),
        onSelect: async (option, session) => {
          await connection.api.commands.execute({
            sessionId: session.sessionId,
            line: directorxCommandLine(option.id),
          })
        },
      },
    })
  })
}
