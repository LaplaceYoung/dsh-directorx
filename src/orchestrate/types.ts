import type { BriefOutput } from '../providers/brief.ts'

/** Derived production shape — not a catalog of named jobs. */
export type ProductionKind = 'promo' | 'literary' | 'remake' | 'narrative'

export interface ProductionEntities {
  brand?: string
  product?: string
  author?: string
  sourceTitle?: string
  sourceClip?: string
  replaceSubject?: string
  format?: string
  targetSeconds: number
  aspectRatio: string
}

export interface ProductionConfirm {
  id: string
  question: string
  options: string[]
  recommended: number
}

export interface ProductionPlaceholder {
  id: string
  kind: 'image' | 'video' | 'audio'
  task: string
  prompt: string
  model: string
  size: string
  duration?: number
  shotIdx: number
  continuity?: string
  note: string
  proposalId?: string
}

export interface ProductionResearchNote {
  query: string
  source: string
  finding: string
}

export interface ProductionToolCall {
  name: string
  input: Record<string, unknown>
  output: unknown
}

export interface ProductionStage {
  name: string
  thinking: string
  tools: ProductionToolCall[]
}

export interface ShotDraft {
  id: string
  kind: 'image' | 'video' | 'audio'
  task: string
  subject: string
  action?: string
  shotSize?: 'ECU' | 'CU' | 'MCU' | 'MS' | 'MLS' | 'LS' | 'ELS'
  angle?: 'eye-level' | 'low' | 'high' | 'birds-eye' | 'worms-eye' | 'dutch' | 'OTS' | 'POV'
  cameraMove?: string
  lighting?: 'rembrandt' | 'low-key' | 'high-key' | 'neon' | 'golden-hour' | 'soft-window' | 'practical'
  mood?: string
  composition?: 'rule-of-thirds' | 'symmetry' | 'negative-space' | 'frame-in-frame' | 'depth-layers'
  durationSec?: number
  aspectRatio: string
  needsAudio?: boolean
  needsFirstFrame?: boolean
  needsLastFrame?: boolean
  continuity?: string
  note: string
}

export interface ProductionPlan {
  kind: ProductionKind
  title: string
  workflow: string[]
  entities: ProductionEntities
  researchQueries: string[]
  characters: Array<{ name: string; description: string; slug: string }>
  confirms: ProductionConfirm[]
  shots: ShotDraft[]
  durationBudget: Array<{ block: string; seconds: number; purpose: string }>
}

export interface ProductionRun {
  kind: ProductionKind
  title: string
  request: string
  generated: false
  workflow: string[]
  entities: ProductionEntities
  stages: ProductionStage[]
  brief: BriefOutput
  research: ProductionResearchNote[]
  confirms: ProductionConfirm[]
  placeholders: ProductionPlaceholder[]
  durationBudget: ProductionPlan['durationBudget']
  reportPath: string
}
