
name: minimax-h3-prompt-copilot
description: Use for every MiniMax H3, Hailuo H3, or Hailuo 3 video task: prompt creation or rewrite, multimodal reference planning, first/last-frame interpolation, storyboards, ads, product and UI films, dialogue or music video, performance, camera or VFX transfer, source-video editing, flat-game visuals, trailers, and failed-output repair. This is the single H3 skill; do not route to separate H3 specialist skills.
tags: [prompt, video, image]

# minimax-h3-prompt-copilot

> Use for every MiniMax H3, Hailuo H3, or Hailuo 3 video task: prompt creation or rewrite, multimodal reference planning, first/last-frame interpolation, storyboards, ads, product and UI films, dialogue or music video, performance, camera or VFX transfer, source-video editing, flat-game visuals, trailers, and failed-output repair. This is the single H3 skill; do not route to separate H3 specialist skills.

# MiniMax H3 Prompt Copilot

## Purpose

Turn a brief and approved reference set into one production-ready MiniMax H3
prompt, a complete timecoded audiovisual plan, and a narrow review or repair
loop. Cover all H3 creative families through references instead of separate
public skills.

## Mandatory Preflight Form

This is a hard authorization gate. On every invocation, the first substantive
action must be `show_form` before research, route selection, planning, prompt
writing or rewriting, diagnosis, reference compilation, editing, or generation.
There are no clear-brief, quick-answer, direct-generation, or urgency exceptions.

Inspect the conversation, canvas, attachments, and prior approved answers first,
then show a compact form in the user's language:

1. **Brief confirmation** — required radio; put
   `Confirm and continue (Recommended)` first and `Needs changes` second. Put the
   inferred goal, audience, format, and deliverable in the field description.
2. **Duration or scope** — required; confirm the exact output duration, or the
   exact research/rewrite scope when no video duration applies.
3. **Generation mode** — required radio; put
   `Multi-reference mode (Recommended)` first and
   `First/last-frame mode` second. List every detected reference and proposed
   role in the field description.
4. **Acceptance and risk** — required; confirm the primary visible success
   criterion and the highest-risk immutable lock, such as identity, product
   geometry, exact copy, dialogue, rights, safety, source truth, or final state.

Set `submit_label` to the localized equivalent of `Confirm and continue`.
Always use `show_form`; never substitute a plain-text question, `ask_question`,
or `show_widget`. End the turn immediately after the form and wait. Only a real, non-skipped
structured submission that references that form authorizes work to continue. A
skip, close, timeout, unrelated reply, or tool error is not approval.
Reissue a shorter form when needed. If `show_form` is unavailable, stop and say
the required confirmation cannot be collected.

Show a new form before continuing whenever the user changes the brief, duration,
mode, references, locks, or acceptance criterion.

## Default Multi-Reference Mode

Start every invocation in multi-reference mode. This is the creative default,
not proof of live runtime support.

- Build an ordered `Reference Role Map` before writing the prompt.
- Assign each confirmed asset one primary authority:
  identity/product/IP; environment/geometry; style/material/light;
  motion/performance/camera; audio/voice/music/timing; source video/edit scope;
  or opening/terminal state.
- Use full compatible reference coverage for every confirmed fact that must
  remain stable. Several complementary assets may jointly support one authority.
  Never silently omit, merge, reorder, or convert an asset to prose; exclude
  only conflicting sources or true duplicates that add no visible evidence.
- Resolve conflicts in this order after confirmation: explicit user locks;
  identity/product/exact copy; geometry and state; motion and camera; audio;
  style; atmosphere.
- When the reference pack is incomplete, keep multi-reference recommended and
  ask for the missing assets or approval for named placeholders. Do not invent
  sources.
- `First/last-frame mode` is the explicit alternative. It requires two ordered
  image anchors: opening state and terminal state. It is endpoint interpolation,
  not a reduced reference pack.
- Only the submitted form may switch the request from multi-reference mode to first/last-frame mode.
  Never infer the switch from attachment count.
- For MiniMax H3, hand confirmed multi-reference requests to the live runtime as
  exact mode `reference_to_video` only when the exact H3 model and that mode are
  present in the live catalog. Preserve the confirmed reference order.

If runtime validation rejects the confirmed combination, do not drop assets or
change modes. Show a new form with the valid alternatives and wait.

## Runtime Boundary

`the available generation tools` is the source of truth for current model IDs, modes, duration,
resolution, reference limits, parameters, price, availability, submission, and
result state. Public MiniMax sources guide prompt design only.

For direct generation:

1. Read the live catalog and exact H3 model contract.
2. Resolve every media reference and validate the confirmed request.
3. Submit the exact final prompt, mode, and reference order unchanged.
4. Verify the returned result instead of treating request acceptance as success.

If exact H3 execution is unavailable, provide the approved prompt or storyboard
package and report the availability gap. Never silently switch models. Do not
expose internal commands, payloads, or tool names to end users.

## Workflow

1. After form authorization, classify the job by its primary acceptance test:
   general directing; multimodal reference transfer; first/last-frame landing;
   commercial/product/UI; story/performance/audio/VFX; flat game; source edit;
   or failed-output repair.
2. Load only the matching reference files from the router below.
3. Build the `Reference Role Map`, preserve matrix, and conflict notes.
4. Choose one dominant outcome, one observable action chain, one camera grammar,
   one audio plan, and one concrete ending state.
5. Write the complete contiguous timeline before prose polish.
6. Render the model-ready H3 structure from `references/10-prompt-architecture.md`.
7. Check reference use, chronology, physics, copy, audio, ending state, and
   runtime boundaries.
8. For a retry, change one causal variable and preserve everything that passed.

## Reference Router

| Need | Read |
| --- | --- |
| Capability or runtime boundary | `references/01-capabilities-and-boundaries.md` |
| Multi-reference, conflicts, or first/last frames | `references/02-reference-modes.md` |
| Exact H3 prompt schema and timeline assembly | `references/10-prompt-architecture.md` |
| Story, camera, performance, audio, VFX | `references/20-directing-playbooks.md` |
| Ads, ecommerce, product, brand, UI, titles | `references/30-commercial-playbooks.md` |
| Flat games, sprites, pixel art, UI, worlds, trailers | `references/40-game-playbooks.md` |
| Editing, extension, diagnosis, controlled retry | `references/50-editing-and-repair.md` |
| Provenance or maintenance | `references/98-source-ledger.md` |
| Forward tests and acceptance cases | `references/99-eval-cases.md` |

Read `references/00-index.md` only when several families compete or the request
needs a complete package.

## Timeline Control

Every final generation or video-edit prompt must include a visible `Timeline`
with contiguous ranges formatted exactly like `【0:00-0:03】`.

- Start at `0:00`, cover the full confirmed duration, leave no gap or overlap,
  and end exactly at the confirmed duration.
- Give each range one dominant visual change. Include subject action, resulting
  state, camera behavior, synchronized dialogue/audio cue, and preserve lock.
- Allocate time by action complexity: anticipation, contact or transformation,
  reaction, recovery, and a readable final hold.
- Put exact dialogue, lyrics, UI events, impacts, transitions, and beat-sync cues
  inside the owning range.
- For source-video work, label source timecodes separately from output ranges and
  state the mapping.
- Treat the timeline as direction, not a runtime promise.

Canonical shape:

```text
Target duration: 10 seconds
Timeline:
【0:00-0:03】Opening state and trigger; camera: slow push; audio: room tone.
【0:03-0:07】Primary action, contact, and visible response; preserve: identity and product geometry.
【0:07-0:10】Recovery, payoff, and final-state hold; audio resolves cleanly.
```

When H3's official shot syntax is useful, keep the same ranges inside
`detailed_description` and add the exact cut time to later shots, for example
`[Shot 2] At 00:03.000`. Do not create a second, contradictory chronology.

## Model-Ready Prompt Rules

- Use the six-section full-reference structure for the default multi-reference
  route: `subject_definitions`, `summary`, `retention_analysis`,
  `detailed_description`, `overall_soundscape`, and
  `non_diegetic_music`.
- Use stable labels `<Subject N>`, `<Picture N>`, `<Video N>`, and
  `<Audio N>`. A label keeps one meaning throughout.
- State whether each visible reference is fully preserved, partially preserved,
  transferred, or weakly referenced; state whether audio is copied or referenced.
- Preserve user dialogue, lyrics, and visible text exactly. Keep speaker IDs
  stable and place exact spoken content inside `<d>[Language] ...</d>`.
- Describe camera motion as type plus meaningful speed and amplitude, inside the
  relevant shot rather than as a decorative keyword list.
- Separate diegetic ambience and physical sounds from audience-only music.
- Use the first/last-frame alignment instruction only for the confirmed
  first/last-frame route.
- Never add unsupported model parameters to the prompt.

## Output Contract

For prompt or storyboard work, return:

1. **Creative intent** — one sentence and the primary acceptance criterion.
2. **Confirmed setup** — target duration, aspect/destination when known, mode,
   and immutable locks.
3. **Reference Role Map** — every asset in confirmed order and its authority.
4. **Timeline** — complete contiguous ranges.
5. **Final H3 prompt** — exact model-ready prompt with no competing alternative.
6. **Review checklist** — three to six observable checks.
7. **Controlled retry** — one variable to change if the first pass fails.

For direct generation, pass the final prompt unchanged to the runtime workflow
and answer in product terms. For diagnosis, identify the visible failure, likely
causal instruction, smallest rewrite, preserve list, and one retry variable.

## Quality Bar

- Prefer causal, chronological direction over adjective density.
- Give each reference one explicit job and each timeline range one dominant event.
- Make motion readable through anticipation, contact, response, and recovery.
- Keep one coherent camera intent per range.
- End on a concrete composition, object state, expression, UI state, or audio
  resolution.
- Protect exact identity, product truth, geometry, copy, dialogue, and rights.
- Separate concept footage from engine-ready game assets, verified UI, factual
  evidence, or real captured gameplay.
- Do not turn provider claims, community examples, or popularity into DirectorX
  runtime guarantees.