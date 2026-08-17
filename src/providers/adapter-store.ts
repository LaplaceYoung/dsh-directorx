import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { resolveOutputDir } from '../support.ts'
import type { AdapterCapability, AdapterSpec } from './adapter-spec.ts'
import { parseAdapterSpec } from './adapter-spec.ts'

export type AdapterStatus = 'ingested' | 'draft' | 'smoked' | 'active'

export interface AdapterRecord {
  spec: AdapterSpec
  status: AdapterStatus
  ingest: { docSource: string; docChars: number; at: number }
  smoke?: { probeOk: boolean; contractOk: boolean; liveOk: boolean; at: number; error?: string }
  updatedAt: number
}

export interface AdapterSecret {
  apiKey?: string
  klingAk?: string
  klingSk?: string
}

interface CatalogFile {
  version: 1
  adapters: AdapterRecord[]
}

const MAX_ADAPTERS = 40
const MAX_DOC_CHARS = 80_000

export class AdapterStore {
  constructor(private readonly outputDir: string) {}

  private catalogPath(): string {
    return join(resolveOutputDir(this.outputDir), 'adapters.json')
  }

  private secretsPath(): string {
    return join(resolveOutputDir(this.outputDir), 'adapters.secrets.json')
  }

  private docPath(id: string): string {
    return join(resolveOutputDir(this.outputDir), 'adapters', `${id}.doc.txt`)
  }

  async read(): Promise<CatalogFile> {
    try {
      const parsed = JSON.parse(await readFile(this.catalogPath(), 'utf8')) as CatalogFile
      const adapters = Array.isArray(parsed.adapters) ? parsed.adapters : []
      return { version: 1, adapters }
    } catch {
      return { version: 1, adapters: [] }
    }
  }

  async list(): Promise<AdapterRecord[]> {
    return (await this.read()).adapters
  }

  async get(id: string): Promise<AdapterRecord | undefined> {
    return (await this.read()).adapters.find(item => item.spec.id === id)
  }

  async findByModel(capability: AdapterCapability, model: string): Promise<AdapterRecord | undefined> {
    const wanted = model.trim()
    if (wanted === '') return undefined
    return (await this.read()).adapters.find(item => item.spec.capability === capability && item.spec.model === wanted)
  }

  async readDoc(id: string): Promise<string> {
    try {
      return await readFile(this.docPath(id), 'utf8')
    } catch {
      return ''
    }
  }

  async readSecrets(): Promise<Record<string, AdapterSecret>> {
    try {
      const parsed = JSON.parse(await readFile(this.secretsPath(), 'utf8')) as Record<string, AdapterSecret>
      return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
    } catch {
      return {}
    }
  }

  async secretOf(id: string): Promise<AdapterSecret> {
    return (await this.readSecrets())[id] ?? {}
  }

  async writeSecret(id: string, secret: AdapterSecret): Promise<void> {
    const all = await this.readSecrets()
    const prev = all[id] ?? {}
    all[id] = {
      ...prev,
      ...(secret.apiKey !== undefined && secret.apiKey !== '' ? { apiKey: secret.apiKey } : {}),
      ...(secret.klingAk !== undefined && secret.klingAk !== '' ? { klingAk: secret.klingAk } : {}),
      ...(secret.klingSk !== undefined && secret.klingSk !== '' ? { klingSk: secret.klingSk } : {}),
    }
    await mkdir(resolveOutputDir(this.outputDir), { recursive: true })
    await writeFile(this.secretsPath(), JSON.stringify(all), 'utf8')
  }

  async hasSecret(id: string): Promise<boolean> {
    const secret = await this.secretOf(id)
    return Boolean(secret.apiKey || (secret.klingAk && secret.klingSk))
  }

  private async writeCatalog(file: CatalogFile): Promise<void> {
    await mkdir(resolveOutputDir(this.outputDir), { recursive: true })
    await writeFile(this.catalogPath(), JSON.stringify(file, null, 2), 'utf8')
  }

  async upsert(record: AdapterRecord): Promise<AdapterRecord> {
    const file = await this.read()
    const index = file.adapters.findIndex(item => item.spec.id === record.spec.id)
    if (index >= 0) file.adapters[index] = record
    else {
      file.adapters.push(record)
      if (file.adapters.length > MAX_ADAPTERS) file.adapters.shift()
    }
    await this.writeCatalog(file)
    return record
  }

  async saveDoc(id: string, text: string): Promise<number> {
    const clipped = text.slice(0, MAX_DOC_CHARS)
    await mkdir(join(resolveOutputDir(this.outputDir), 'adapters'), { recursive: true })
    await writeFile(this.docPath(id), clipped, 'utf8')
    return clipped.length
  }

  async putSpec(id: string, spec: AdapterSpec, status: AdapterStatus): Promise<AdapterRecord> {
    const existing = await this.get(id)
    const record: AdapterRecord = {
      spec,
      status,
      ingest: existing?.ingest ?? { docSource: '', docChars: 0, at: Date.now() },
      smoke: existing?.smoke,
      updatedAt: Date.now(),
    }
    return this.upsert(record)
  }
}

export function publicRecord(record: AdapterRecord, hasKey: boolean): Record<string, unknown> {
  return {
    id: record.spec.id,
    capability: record.spec.capability,
    model: record.spec.model,
    mode: record.spec.mode,
    displayName: record.spec.displayName,
    baseURL: record.spec.baseURL,
    status: record.status,
    hasKey,
    caps: record.spec.caps,
    smoke: record.smoke,
    updatedAt: record.updatedAt,
  }
}

export function parseSpecOrThrow(raw: unknown): AdapterSpec {
  const parsed = parseAdapterSpec(raw)
  if (parsed.spec === undefined) {
    throw new Error(`AdapterSpec 不完整：${parsed.issues.map(issue => `${issue.path} ${issue.message}`).join('；')}`)
  }
  return parsed.spec
}
