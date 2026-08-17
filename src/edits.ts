import { appendFile, mkdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { resolveOutputDir } from './support.ts'

/**
 * Append-only ledger of media files saved from the WebUI editor dock,
 * stored as `<outputDir>/edits.jsonl`. The agent lists these with the
 * `directorx_edits` tool so edited derivatives re-enter the workflow.
 */

export interface EditRecord {
  /** Unix epoch ms when the file was saved. */
  at: number
  /** Absolute path of the saved file. */
  path: string
  mediaType: string
  bytes: number
  name: string
}

const EDITS_FILE = 'edits.jsonl'
export const MAX_EDIT_LINES = 20_000

export class DirectorxEditLedger {
  private readonly outputDir: string

  constructor(outputDir: string) {
    this.outputDir = outputDir
  }

  private async filePath(): Promise<string> {
    const dir = resolveOutputDir(this.outputDir)
    await mkdir(dir, { recursive: true })
    return join(dir, EDITS_FILE)
  }

  async append(record: EditRecord): Promise<void> {
    const path = await this.filePath()
    await appendFile(path, `${JSON.stringify(record)}\n`, 'utf8')
  }

  /** Most recent edits first, bounded to `limit`. */
  async list(limit = 20): Promise<EditRecord[]> {
    const path = await this.filePath()
    const content = await readFile(path, 'utf8').catch(error => {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return ''
      throw error
    })
    const records: EditRecord[] = []
    for (const line of content.split('\n').slice(-MAX_EDIT_LINES)) {
      const trimmed = line.trim()
      if (trimmed === '') continue
      try {
        const parsed = JSON.parse(trimmed) as EditRecord
        if (typeof parsed.path === 'string' && parsed.path !== '') records.push(parsed)
      } catch {
        // A torn line from a crashed append: skip it, keep the ledger readable.
      }
    }
    return records.reverse().slice(0, Math.min(50, Math.max(1, limit)))
  }
}
