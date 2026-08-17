import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { resolveOutputDir } from './support.ts'
import type { GradeLook } from './providers/grade.ts'

export interface StudioTicket {
  id: string
  kind: 'image' | 'video'
  path: string
  look?: GradeLook
  nodeId?: string
  at: number
}

const FILE = 'studio-open.json'

export class StudioTicketStore {
  constructor(private readonly outputDir: string) {}

  private filePath(): string {
    return join(resolveOutputDir(this.outputDir), FILE)
  }

  async read(): Promise<StudioTicket | null> {
    try {
      const parsed = JSON.parse(await readFile(this.filePath(), 'utf8')) as StudioTicket
      if (typeof parsed.path !== 'string' || parsed.path === '') return null
      if (parsed.kind !== 'image' && parsed.kind !== 'video') return null
      return parsed
    } catch {
      return null
    }
  }

  async write(input: Omit<StudioTicket, 'id' | 'at'> & { id?: string }): Promise<StudioTicket> {
    const ticket: StudioTicket = {
      id: input.id ?? `studio-${Date.now().toString(36)}`,
      kind: input.kind,
      path: input.path,
      at: Date.now(),
      ...(input.look !== undefined ? { look: input.look } : {}),
      ...(input.nodeId !== undefined ? { nodeId: input.nodeId } : {}),
    }
    await mkdir(resolveOutputDir(this.outputDir), { recursive: true })
    await writeFile(this.filePath(), JSON.stringify(ticket), 'utf8')
    return ticket
  }
}
