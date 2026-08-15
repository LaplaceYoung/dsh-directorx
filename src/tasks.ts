import { appendFile, mkdir, readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import type { MediaFile } from './providers/types.ts'

/**
 * Append-only task ledger for asynchronous generation tasks, stored as
 * `<outputDir>/tasks.jsonl` (one JSON record per line, latest transition
 * wins for a task id). It survives tool timeouts and session restarts, so the
 * agent can recover an orphaned provider task with `directorx_task_status`
 * and stop it with `directorx_cancel_task`.
 */

export type TaskState = 'submitted' | 'succeeded' | 'failed' | 'cancelled'

export interface TaskRecord {
  taskId: string
  model: string
  mode: string
  prompt: string
  state: TaskState
  /** Unix epoch ms of this transition. */
  at: number
  urls?: string[]
  files?: MediaFile[]
  error?: string
  reason?: string
}

const LEDGER_FILE = 'tasks.jsonl'
/** Keep the visible listing bounded; the file itself is append-only. */
export const MAX_LEDGER_LINES = 20_000

export class DirectorxTaskLedger {
  private readonly outputDir: string

  constructor(outputDir: string) {
    this.outputDir = outputDir
  }

  private async filePath(): Promise<string> {
    const dir = resolve(process.cwd(), this.outputDir)
    await mkdir(dir, { recursive: true })
    return join(dir, LEDGER_FILE)
  }

  async append(record: TaskRecord): Promise<void> {
    if (record.taskId === '') return
    const path = await this.filePath()
    await appendFile(path, `${JSON.stringify(record)}\n`, 'utf8')
  }

  /** All transitions of every task, in append order. */
  async list(): Promise<TaskRecord[]> {
    const path = await this.filePath()
    const content = await readFile(path, 'utf8').catch(error => {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return ''
      throw error
    })
    const records: TaskRecord[] = []
    for (const line of content.split('\n').slice(-MAX_LEDGER_LINES)) {
      const trimmed = line.trim()
      if (trimmed === '') continue
      try {
        const parsed = JSON.parse(trimmed) as TaskRecord
        if (typeof parsed.taskId === 'string' && parsed.taskId !== '') records.push(parsed)
      } catch {
        // A torn line from a crashed append: skip it, keep the ledger readable.
      }
    }
    return records
  }

  /** All transitions of one task in append order. */
  async fold(taskId: string): Promise<TaskRecord[]> {
    return (await this.list()).filter(record => record.taskId === taskId)
  }

  /** The task's latest transition, or `undefined` for an unknown id. */
  async latest(taskId: string): Promise<TaskRecord | undefined> {
    const records = await this.fold(taskId)
    return records.at(-1)
  }

  /** Whether the ledger carries a `cancelled` transition for this task. */
  async isCancelled(taskId: string): Promise<boolean> {
    const latest = await this.latest(taskId)
    return latest?.state === 'cancelled'
  }

  /**
   * Record a cancel intent. Idempotent for finished tasks: appending a
   * `cancelled` transition over a `succeeded`/`cancelled` task is a no-op. A
   * locally `failed` task may still be running at the provider (orphan), so it
   * accepts the cancel transition; an in-flight task flips to cancelled and
   * the matching poll loop aborts on its next ledger check.
   */
  async cancel(taskId: string, reason = 'cancel requested'): Promise<TaskRecord> {
    const latest = await this.latest(taskId)
    const terminal = latest !== undefined && (latest.state === 'succeeded' || latest.state === 'cancelled')
    if (terminal) return latest
    const record: TaskRecord = {
      taskId,
      model: latest?.model ?? '',
      mode: latest?.mode ?? '',
      prompt: latest?.prompt ?? '',
      state: 'cancelled',
      at: Date.now(),
      reason,
    }
    await this.append(record)
    return record
  }
}
