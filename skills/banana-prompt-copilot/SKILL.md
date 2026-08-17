
name: banana-prompt-copilot
description: Use when the user names Banana, Nano Banana, Gemini image generation, or asks for a high-quality DirectorX image prompt, image edit prompt, reference-aware image brief, visual variant set, prompt rewrite, or failed-image diagnosis.
tags: [prompt, video, image]

# banana-prompt-copilot

> Use when the user names Banana, Nano Banana, Gemini image generation, or asks for a high-quality DirectorX image prompt, image edit prompt, reference-aware image brief, visual variant set, prompt rewrite, or failed-image diagnosis.

# Banana Prompt Copilot

## Purpose

Shape user intent into a strong Banana/Gemini-oriented image prompt. This skill
is a prompt-quality layer only: it improves subject clarity, composition,
reference wording, edit invariants, text handling, visual style, and retry
guidance.

## Boundary With the available generation tools

Do not decide or promise available models, parameters, image sizes, reference
compatibility, prices, queue behavior, submission state, transparency, exact
dimensions, or success. For actual canvas generation, use the `the available generation tools`
skill as the source of truth to read the current model catalog and generation
workflow, resolve media refs, validate the request, submit generation, and
verify result state.

Keep the layers separate: this skill writes creative prompt wording;
`the available generation tools` reads current options, handles refs, and runs generation. Never
expose CLI or tool names to users.

Use the user's creative goal to emphasize product geometry, identity
preservation, typography constraints, UI layout hierarchy, variant axes, or
failure diagnosis. Do not treat these as runtime capability checks.

## Workflow

1. Identify whether the user wants direct canvas generation, a reusable prompt,
   an edit prompt, a reference plan, variants, a rewrite, or diagnosis.
2. If generating on canvas, compose the creative prompt here, then hand off
   execution and validation to `the available generation tools`. The execution layer must receive
   the exact same final prompt text; do not rewrite, summarize, shorten, or
   collapse it before submission.
3. When references are present, summarize each role in the prompt and keep the
   actual media refs attached for execution; do not replace refs with
   prose-only descriptions.
4. Ask one compact question only when missing information would materially
   change the prompt. Otherwise proceed with a stated assumption.
5. Write the final generation prompt in the user's language. If the user writes
   in Chinese, write the final prompt in Chinese unless they ask otherwise.
6. Convert the idea into a visible still-image plan: subject, composition,
   environment, light source, material, style, exact text if needed, preserved
   references, and likely failure controls.
7. Use `references/prompt-patterns.md` when the prompt needs product polish,
   identity preservation, edit invariants, typography, variants, or failure
   repair.
8. Use `references/eval-cases.md` only when reviewing or testing this skill.

## Output Contract

For prompt-only requests, return:

- Creative intent label in product terms, not runtime capability terms.
- Reference role summary when references are present.
- Final generation prompt in the user's language.
- Exact visible text instruction when text matters.
- Short avoid list focused on likely failures.
- One controlled retry variable, or 2-4 variants with one changed axis each.

For direct generation requests, pass the exact same final prompt text to
execution; do not rewrite, summarize, shorten, or collapse it before
submission. Do not expose this skill, file names, internal refs, CLI commands,
flags, raw payloads, or backend lifecycle details. After `the available generation tools` verifies
the real state, answer only in product terms.

For diagnosis, ask for the failed output if missing, then identify the visible
failure, likely prompt cause, smallest prompt change, what to preserve, and one
controlled retry variable.

## Quality Bar

- Put the subject, edit invariant, or preserved reference first.
- Prefer complete scene instructions over keyword piles.
- Use one clear style direction.
- For edits, state what changes and what remains unchanged.
- For text, quote exact short text and forbid extra characters.
- Give every reference a clear visible role. Use full compatible reference
  coverage for every fact that must stay fixed; exclude only conflicting sources
  or true duplicates that add no visible evidence.
- Do not invent unseen reference details.
- Do not turn model rumors or public claims into DirectorX runtime promises.