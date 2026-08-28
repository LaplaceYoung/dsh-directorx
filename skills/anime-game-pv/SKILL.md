---
name: anime-game-pv
description: Use for one complete anime, manga, or game-character PV of 15 seconds or less. Confirm identity, style authority, palette, reference roles, storyboard, prompt, and one final video before generation.
user-invocable: true
---

This is a DSH-native adaptation of the `dx-design` anime-game PV production model. It produces one unified final video, not only analysis, panels, or a prompt. DSH remains the orchestrator and DirectorX uses only configured live capabilities.

## Handoff

Return `production_route`, `identity_source`, `style_authority`, `palette_authority`, `reference_roles`, `storyboard_revision`, `prompt_contract`, `task_id`, `artifact_paths`, `status`, and `blockers`. A child agent must not claim approval or a final video without the provider response and the corresponding parent gate.

## Contract


- Intake real assets first. Separate `subject`, `scene`, `style`, `layout`, `action`, and `audio` contributions; a candidate reference has no generation authority until confirmed.
- Confirm the production route and one style authority. Existing assets may be reused; otherwise generate a visual authority image, inspect it, and confirm it before video.
- Lock identity, palette, reference processing, duration, aspect ratio, audio plan, model capability, and final output count (always one).
- Build semantic Panels, Logical Shots, and one Master Timeline. A storyboard preview is optional and is never a video reference by itself.
- Confirm the complete storyboard, compile one prompt, verify references/parameters/rights/cost, confirm the generation gate, then submit one video task.
- Inspect the returned video and frames. If it fails, update the affected timeline contract and re-confirm; do not silently substitute a model, delete a reference, or blindly retry.

## Exits

- Title/credits-first work routes to `cinematic-title-sequence`.
- Music/performance-first work routes to `cool-music-video`.
- Long, multi-clip, or cross-video continuity work routes to the main workflow.
- Reference-video reconstruction routes to `video-deconstruct`.

## DirectorX tool order

`directorx_skill_route` → `directorx_skill_read` → `directorx_knowledge_read` → `directorx_prompt_plan` → `directorx_prompt_craft` → `directorx_generate_ready` → approval/proposal gate → one `directorx_generate_video` → frame inspection → delivery.
