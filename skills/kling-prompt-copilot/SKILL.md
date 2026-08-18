
name: kling-prompt-copilot
description: Use when the user names Kling or asks for a high-quality video generation prompt, storyboard, prompt rewrite, reference-aware video brief, dialogue-led video brief, or failed-video prompt diagnosis.
tags: [prompt, video, image]

# kling-prompt-copilot

> Use when the user names Kling or asks for a high-quality video generation prompt, storyboard, prompt rewrite, reference-aware video brief, dialogue-led video brief, or failed-video prompt diagnosis for DirectorX.

# Kling Prompt Copilot

## Purpose

Shape user intent into a strong Kling-oriented video prompt. This skill is a
prompt-quality layer only: it improves scene direction, temporal action,
camera intent, reference wording, continuity locks, and retry guidance.

## Boundary With the available generation tools

Do not decide or promise available models, modes, durations, resolutions,
parameters, reference compatibility, prices, queue behavior, submission state,
or success. For actual canvas generation, use the `the available generation tools` skill as the
source of truth to read the current model catalog and generation workflow,
resolve media refs, validate the request, submit generation, and verify result
state.

Keep the layers separate: this skill writes creative prompt wording;
`the available generation tools` reads current options, handles refs, and runs generation. Never
expose CLI or tool names to users.

Use the user's creative goal to emphasize time-based action, camera purpose,
continuity locks, first/last-frame transitions, dialogue timing, reference
roles, or failure diagnosis. Do not treat these as runtime capability checks.

## Workflow

1. Identify whether the user wants direct canvas generation, a reusable prompt,
   a storyboard, a reference plan, a prompt rewrite, or failure diagnosis.
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
6. Include visible change over time: subject action, camera behavior, lighting,
   material detail, atmosphere, and continuity locks.
7. Use `references/model-guide.md` for camera and reference wording.

## Output Contract

For prompt-only requests, return:

- Creative intent label in product terms, not runtime capability terms.
- Reference role summary when references are present.
- Timecoded action plan or concise storyboard when useful.
- Final generation prompt in the user's language.
- Short avoid list focused on likely failures.
- One controlled retry variable.

For direct generation requests, pass the exact same final prompt text to
execution; do not rewrite, summarize, shorten, or collapse it before
submission. Do not expose this skill, file names, internal refs, CLI commands,
flags, raw payloads, or backend lifecycle details. After `the available generation tools` verifies
the real state, answer only in product terms.

For diagnosis, ask for the failed output if missing, then identify the visible
failure, likely prompt cause, smallest prompt change, what to preserve, and one
controlled retry variable.

## Quality Bar

- Prefer one clear action beat over a crowded mini-film.
- Camera language must have a purpose: reveal, follow, prove contact,
  intensify, settle, or loop.
- For still-to-motion prompts, describe what changes and what remains fixed.
- For reference-heavy prompts, give every reference a clear visible role. Use
  full compatible reference coverage for every fact that must stay fixed;
  exclude only conflicting sources or true duplicates that add no visible
  evidence.
- Do not invent unseen reference details.
- Do not turn model rumors or public claims into DirectorX runtime promises.