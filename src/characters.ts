import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

/**
 * Character / subject anchor registry: reference images + descriptions
 * registered once, then referenced by name in generation calls so every
 * shot locks the same identity (the Runway Gen-4 / Kling 3.0 subject-
 * reference pattern). Stored as characters.json under the output dir.
 */

export interface CharacterCard {
  name: string
  description: string
  /** Local image path (output dir media) or http(s) URL. */
  refPath: string
  at: number
}

const MAX_CHARACTERS = 100

export class CharacterStore {
  constructor(private readonly outputDir: string) {}

  private filePath(): string {
    return join(resolve(process.cwd(), this.outputDir), 'characters.json')
  }

  async read(): Promise<{ characters: CharacterCard[] }> {
    try {
      const parsed = JSON.parse(await readFile(this.filePath(), 'utf8')) as { characters?: CharacterCard[] }
      return { characters: Array.isArray(parsed.characters) ? parsed.characters : [] }
    } catch {
      return { characters: [] }
    }
  }

  async register(input: { name: string; description?: string; refPath: string }): Promise<CharacterCard> {
    const name = input.name.trim().slice(0, 100)
    if (name === '') throw new Error('character name is required')
    if (input.refPath.trim() === '') throw new Error('refPath is required (local media path or http(s) URL)')
    const ledger = await this.read()
    const existing = ledger.characters.findIndex(card => card.name === name)
    const card: CharacterCard = { name, description: (input.description ?? '').slice(0, 1000), refPath: input.refPath, at: Date.now() }
    if (existing >= 0) ledger.characters[existing] = card
    else {
      ledger.characters.push(card)
      if (ledger.characters.length > MAX_CHARACTERS) ledger.characters.shift()
    }
    await mkdir(resolve(process.cwd(), this.outputDir), { recursive: true })
    await writeFile(this.filePath(), JSON.stringify(ledger, null, 2), 'utf8')
    return card
  }

  async list(): Promise<CharacterCard[]> {
    const ledger = await this.read()
    return ledger.characters.slice().reverse()
  }

  async get(names: string[]): Promise<CharacterCard[]> {
    const ledger = await this.read()
    return names.map(name => ledger.characters.find(card => card.name === name)).filter((card): card is CharacterCard => card !== undefined)
  }
}
