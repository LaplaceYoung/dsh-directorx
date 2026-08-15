// Minimal structural typings for the DSH services this plugin consumes.
// At runtime the services are provided by the DSH host profile; these
// declarations keep `npm run typecheck` self-contained without depending on
// private DSH workspace packages.
declare module 'cordis' {
  interface Context {
    tools: {
      register(definition: unknown): () => void
    }
    skills: {
      register(skill: unknown): () => void
    }
    systemPrompt: {
      section(section: { name: string; order?: number; text: string }): () => void
    }
    settings: {
      register<T = any>(
        ns: string,
        schema: unknown,
        options?: {
          base?: Partial<T>
          applies?: 'live' | 'restart'
          validate?: (value: any) => void
        },
      ): {
        get(): any
        watch(callback: (next: any, previous: any) => void | Promise<void>): () => void
        update(patch: object): Promise<void>
        replace(section: object): Promise<void>
      }
    }
    get<T = any>(name: string): T
    effect(callback: () => (() => void) | void, label?: string): () => void
    logger?: {
      error(...args: unknown[]): void
    }
    /** Present only in profiles that run the DSH web server. */
    webServer?: {
      register(route: {
        kind: 'exact' | 'prefix'
        path: string
        handler: (request: unknown, response: unknown) => void | Promise<void>
      }): () => void
    }
  }
}

declare module '@deepseek-ai/dsh-tools' {
  export function defineTool(options: unknown): any
}

declare module '@deepseek-ai/dsh-settings' {
  export type SettingsNamespace = string
}

declare module '@deepseek-ai/dsh-skill' {}

declare module '@deepseek-ai/dsh-system-prompt' {}

declare module '@deepseek-ai/dsh-llm' {}

interface Window {
  /** Debug/automation hook driving the DirectorX editor dock (see src/client/index.ts). */
  __directorxEditor?: {
    open(kind: 'image' | 'video', path: string): void
    close(): void
    snapshot(): { open: boolean; kind: 'image' | 'video' | null; path: string | null }
  }
}