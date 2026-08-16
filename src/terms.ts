import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

/**
 * 项目级术语字典（terms.json）：术语 → 期望读法/译法/写法。
 * 配音与字幕阶段按句命中注入（如专有名词的读音、品牌名的大小写），
 * 与风格常量锁同源思路——跨镜头/跨集术语一致。
 */

export interface TermEntry {
  /** 原文术语（命中键）。 */
  term: string
  /** 期望写法/读法（配音时替换或写进 TTS instructions）。 */
  reading: string
  at: number
}

export class TermStore {
  constructor(private readonly outputDir: string) {}

  private filePath(): string {
    return join(resolve(process.cwd(), this.outputDir), 'terms.json')
  }

  async read(): Promise<TermEntry[]> {
    try {
      const parsed = JSON.parse(await readFile(this.filePath(), 'utf8')) as { terms?: TermEntry[] }
      return Array.isArray(parsed.terms) ? parsed.terms : []
    } catch {
      return []
    }
  }

  async set(entries: Array<{ term: string; reading: string }>): Promise<TermEntry[]> {
    const ledger = await this.read()
    for (const entry of entries) {
      const term = entry.term.trim().slice(0, 100)
      if (term === '') continue
      const index = ledger.findIndex(existing => existing.term === term)
      if (index >= 0) ledger[index] = { term, reading: entry.reading.slice(0, 200), at: Date.now() }
      else ledger.push({ term, reading: entry.reading.slice(0, 200), at: Date.now() })
    }
    await mkdir(resolve(process.cwd(), this.outputDir), { recursive: true })
    await writeFile(this.filePath(), JSON.stringify({ terms: ledger }, null, 2), 'utf8')
    return ledger
  }

  /** 按句命中：返回文本中出现的术语及其读法。 */
  async match(text: string): Promise<TermEntry[]> {
    const ledger = await this.read()
    return ledger.filter(entry => text.includes(entry.term))
  }
}
