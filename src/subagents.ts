import type { Context } from 'cordis'

/**
 * Subagent orchestration contribution: installs DirectorX media-production
 * guidance into every continuable child agent's context, so subagents asked
 * to plan, prompt, generate, or review media share the same orchestration
 * discipline as the main agent. Installed through the Harness's own
 * `subagents.registerContinuableSetup` extension point (effect-bound and
 * revoked per child when the contribution is removed).
 */

const GUIDANCE = [
  '## DirectorX media orchestration (injected for subagents)',
  'You are a subagent in a DirectorX production pipeline. Media capabilities available to you:',
  '- `directorx_generate_image` / `directorx_generate_video` / `directorx_generate_audio` / `directorx_view_image` generation tools.',
  '- `directorx_knowledge_search` / `directorx_knowledge_read` for craft facts (prompt specs, model matrix, camera language).',
  '- The `directorx-playbook` skill: prompt principles, consistency & control checklist, workflow gates, model routing.',
  '- `directorx_task_status` / `directorx_cancel_task` for async tasks; `directorx_edits` for WebUI edit artifacts.',
  '',
  'Orchestration discipline:',
  '- Lock subject, style, light, lens, and continuity in writing BEFORE generating; reuse the anchors across shots instead of re-describing.',
  '- Pass the four workflow gates (spec, content, cost, rights) before any paid generation; prefer mock mode to validate a pipeline.',
  '- Treat provider responses as authoritative: return file paths, task ids, and statuses verbatim in your structured report; never claim completion without them.',
  '- After a timeout, recover the provider task with `directorx_task_status` instead of re-submitting.',
  '- Keep prompts positive and physical; search the knowledge corpus instead of guessing model capabilities.',
].join('\n')

const SKILL_CONTENT = [
  '# DirectorX Subagent Orchestration',
  '',
  'This skill is injected into every continuable subagent when the dsh-directorx plugin is active.',
  'When the task involves planning, prompting, generating, or reviewing AI media:',
  '',
  '1. Load `directorx-playbook` and follow its four checklists.',
  '2. Search `directorx_knowledge_search` for the model/craft facts the shot needs.',
  '3. Lock the consistency anchors (subject, style, light, lens) before generating.',
  '4. Generate, then report file paths / task ids / statuses as structured data — the parent agent orchestrates, you produce verified artifacts.',
].join('\n')

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
        description: 'Injected DirectorX subagent orchestration discipline: playbook first, knowledge corpus for craft facts, consistency anchors before generation, structured artifact reports.',
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
