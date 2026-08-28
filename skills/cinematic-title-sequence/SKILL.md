---
name: cinematic-title-sequence
description: Use for a confirmed single 15-second film title sequence or cinematic teaser with exact credits, title typography, camera transitions, and one final video deliverable. Do not use for long multi-clip trailers, ordinary subtitles, product ads, or music videos.
user-invocable: true
---

# Cinematic Title Sequence

DSH owns questions, approvals, task execution, and session state. DirectorX supplies the craft contract and routes only live capabilities. This skill is adapted from the useful title-sequence workflow in `dx-design`; it does not import the source Electron runtime, vendor loaders, or hidden agent loops.

## Handoff

Return `scope`, `visual_carrier`, `screen_language`, `exact_text_ledger`, `reference_scope`, `timeline`, `prompt_contract`, `task_id`, `artifact_paths`, `status`, and `blockers`. Keep internal ids in the structured handoff; the parent rewrites them into director language.

## Gates

1. Confirm whether the deliverable is one 15-second clip or a longer multi-clip production. Route the latter to the main DirectorX workflow.
2. Confirm one visual carrier: cinematic narrative, live-action graphics, constructed-world VFX, or editorial collage; then confirm screen language and exact text mode.
3. If references exist, confirm whether they lock identity/grade, the same scene, or a user-defined whitelist. Never infer reference scope from the image.
4. Write a proposal with the timeline, exact text ledger, font roles, camera origin/path/endpoint, transition source/cut/inherited item, audio anchors, and negative constraints. Only explicit approval unlocks generation.
5. Compile one complete video craft, verify the current video capability and legal parameters, generate, inspect returned media/frames, and deliver one final artifact.

## Hard rules

- Exact user text is immutable; never invent credits, names, title words, or unreadable typography.
- Each shot has one primary camera move. A transition names a visible source, cut point, inherited item, and new landing.
- Keep references in declared roles. A poster is not automatically a full-scene lock.
- Do not expose internal route names, vendor schema, tool ids, or numbered implementation menus to the user.
- Inspect actual generated media before claiming legibility, continuity, or success.
- If the requested model or capability is unavailable, return the blocker; do not silently substitute another provider.

## DirectorX tool order

`directorx_skill_route` → `directorx_skill_read` → relevant `directorx_knowledge_read` → `directorx_prompt_plan` → `directorx_prompt_craft` → `directorx_generate_ready` → `directorx_propose` / `directorx_confirm` according to initiative → `directorx_generate_video` → `directorx_extract_frames` / `directorx_view_image` → deterministic assembly or delivery.
