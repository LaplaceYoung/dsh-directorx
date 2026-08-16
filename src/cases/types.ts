import type { BriefOutput } from '../providers/brief.ts'

export type ProductionCaseId = 'mossland-promo' | 'luxun-zhufu' | 'kimi-k3-remake'

export interface CaseResearchNote {
  query: string
  source: string
  finding: string
}

export interface CaseConfirm {
  id: string
  question: string
  options: string[]
  recommended: number
}

export interface CasePlaceholder {
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

export interface CaseToolCall {
  name: string
  input: Record<string, unknown>
  output: unknown
}

export interface CaseStage {
  name: string
  thinking: string
  tools: CaseToolCall[]
}

export interface CaseShotPlan {
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

export interface ProductionCaseDefinition {
  id: ProductionCaseId
  title: string
  request: string
  keywords: string[]
  workflow: string[]
  researchQueries: string[]
  researchPack: CaseResearchNote[]
  characters: Array<{ name: string; description: string; slug: string }>
  confirms: CaseConfirm[]
  shots: CaseShotPlan[]
  durationBudget: Array<{ block: string; seconds: number; purpose: string }>
}

export interface ProductionCaseRun {
  id: ProductionCaseId
  title: string
  request: string
  generated: false
  workflow: string[]
  stages: CaseStage[]
  brief: BriefOutput
  research: CaseResearchNote[]
  confirms: CaseConfirm[]
  placeholders: CasePlaceholder[]
  durationBudget: ProductionCaseDefinition['durationBudget']
  reportPath: string
}
