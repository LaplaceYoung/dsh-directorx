import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { resolveOutputDir } from './support.ts'

export type NoteSource = 'user' | 'ask' | 'reject'

export interface ProductionNote {
  id: string
  text: string
  source: NoteSource
  at: number
}

const FILE = 'notes.json'
const MAX = 80

export class NoteStore {
  constructor(private readonly outputDir: string) {}

  private filePath(): string {
    return join(resolveOutputDir(this.outputDir), FILE)
  }

  async read(): Promise<ProductionNote[]> {
    try {
      const parsed = JSON.parse(await readFile(this.filePath(), 'utf8')) as { notes?: ProductionNote[] }
      return Array.isArray(parsed.notes) ? parsed.notes : []
    } catch {
      return []
    }
  }

  async append(input: { text: string; source?: NoteSource }): Promise<ProductionNote> {
    const text = input.text.trim().slice(0, 500)
    if (text === '') throw new Error('directorx_note 需要非空 text')
    const note: ProductionNote = {
      id: `note-${Date.now().toString(36)}`,
      text,
      source: input.source ?? 'user',
      at: Date.now(),
    }
    const notes = [...await this.read(), note].slice(-MAX)
    await mkdir(resolveOutputDir(this.outputDir), { recursive: true })
    await writeFile(this.filePath(), JSON.stringify({ notes }, null, 2), 'utf8')
    return note
  }
}
