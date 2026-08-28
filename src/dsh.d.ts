// Minimal structural typings for the DSH services this plugin consumes.
// At runtime the services are provided by the DSH host profile; these
// declarations keep `npm run typecheck` self-contained without depending on
// private DSH workspace packages.
declare module '@deepseek-ai/cordis' {
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
    inject(deps: string[], callback: (ctx: Context) => (() => void) | void): () => void
    effect(callback: () => (() => void) | void, label?: string): () => void
    logger?: {
      error(...args: unknown[]): void
    }
    commands?: {
      register(definition: {
        name: string
        description: string
        input?: { hint: string; images?: boolean }
        recordInput?: boolean
        handler: (invocation: {
          rawInput: string
          signal?: AbortSignal
          attachments?: readonly unknown[]
        }) =>
          | { kind: 'success' | 'error'; text?: string }
          | Promise<{ kind: 'success' | 'error'; text?: string }>
      }): () => void
    }
    /** DSH 0.1.0-rc.8 ask seam. Older hosts may only expose `userInteraction`. */
    userQuestions?: {
      ask(request: {
        questions: Array<{
          id: string
          question: string
          header?: string
          detail?: string
          options?: Array<{ label: string; description?: string }>
          multiSelect?: boolean
        }>
        agent?: unknown
        signal?: AbortSignal
      }): Promise<{ answers: Array<{ id: string; selected: string[]; custom?: string }> }>
    }
    /** Pre-rc.8 alias of `userQuestions`. */
    userInteraction?: {
      ask(request: {
        questions: Array<{
          id: string
          question: string
          header?: string
          detail?: string
          options?: Array<{ label: string; description?: string }>
          multiSelect?: boolean
        }>
        agent?: unknown
        signal?: AbortSignal
      }): Promise<{ answers: Array<{ id: string; selected: string[]; custom?: string }> }>
    }
    workspace?: {
      list(): Array<{ path: string; title: string; sessionIds?: string[] }>
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

declare module 'react-dom' {
  import type { ReactNode } from 'react'
  export function createPortal(children: ReactNode, container: Element | DocumentFragment): ReactNode
}

declare module '@deepseek-ai/dsh-llm' {}

interface Window {
  /** Debug/automation hook driving the DirectorX editor dock (see src/client/index.ts). */
  __directorxEditor?: {
    open(kind?: 'image' | 'video', path?: string): void
    openDirectorStage(): void
    close(): void
    setTab(tab: 'canvas' | 'image' | 'video'): void
    snapshot(): { open: boolean; tab: 'canvas' | 'image' | 'video'; kind: 'image' | 'video' | null; path: string | null }
    layoutKind(): string
    openDetailsNow(): void
    toggleSidebarNow(): void
  }
}