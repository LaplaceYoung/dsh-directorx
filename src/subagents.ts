import { DIRECTORX_RUNTIME_PRESET } from './runtime-preset.ts'
import type { Context } from '@deepseek-ai/cordis'

/**
 * Subagent orchestration contribution: installs DirectorX media-production
 * guidance into every continuable child agent's context, so subagents asked
 * to plan, prompt, generate, or review media share the same orchestration
 * discipline as the main agent. Installed through the Harness's own
 * `subagents.registerContinuableSetup` extension point (effect-bound and
 * revoked per child when the contribution is removed).
 */

const GUIDANCE = DIRECTORX_RUNTIME_PRESET.subagentGuidance
const SKILL_CONTENT = DIRECTORX_RUNTIME_PRESET.subagentSkill

export function registerSubagentSetup(ctx: Context): () => void {
  const subagents = ctx.get('subagents') as
    | { registerContinuableSetup(contribution: (childCtx: Context) => () => void): () => void }
    | undefined
  if (subagents === undefined) return () => {}

  return subagents.registerContinuableSetup((childCtx) => {
    const systemPrompt = childCtx.get('systemPrompt') as { section(section: { name: string; order?: number; text: string }): () => void } | undefined
    const skills = childCtx.get('skills') as {
      register(skill: {
        name: string
        description: string
        content: string
        source: 'runtime'
        provider: string
        invocation: { modelInvocable: boolean; userInvocable: boolean }
      }): () => void
    } | undefined
    const disposers: Array<() => void> = []
    if (systemPrompt !== undefined) {
      disposers.push(systemPrompt.section({ name: 'tool:directorx-subagent', order: 118, text: GUIDANCE }))
    }
    if (skills !== undefined) {
      disposers.push(skills.register({
        name: 'directorx-subagent-orchestration',
        description: 'Injected DirectorX subagent orchestration discipline: load the matching skill and knowledge, preserve continuity anchors and node roles, use deterministic edits, and return evidence-backed handoffs.',
        content: SKILL_CONTENT,
        source: 'runtime',
        provider: 'directorx',
        invocation: { modelInvocable: true, userInvocable: true },
      }))
    }
    return () => {
      for (const dispose of disposers.reverse()) dispose()
    }
  })
}
