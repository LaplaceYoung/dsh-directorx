import type { CapabilitySettings, DirectorxSettings } from '../config.ts'
import type { DirectorxTaskLedger } from '../tasks.ts'

export interface ProviderContext {
  settings: DirectorxSettings
  capability: CapabilitySettings
  signal: AbortSignal
  /** Optional append-only task ledger; async modes record their transitions here. */
  ledger?: DirectorxTaskLedger
}

export interface MediaFile {
  path?: string
  url?: string
  mimeType?: string
}

export interface VisionResult {
  model: string
  question: string
  answer: string
  source: string
}

export interface ImageResult {
  model: string
  prompt: string
  files: MediaFile[]
  mode: string
}

export interface VideoResult {
  model: string
  prompt: string
  taskId?: string
  status: string
  files: MediaFile[]
  mode: string
}

export interface AudioResult {
  model: string
  text: string
  files: MediaFile[]
  mode: string
}