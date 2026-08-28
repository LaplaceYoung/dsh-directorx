---
name: video-deconstruct
description: Use when the user asks to deconstruct, shot-list, or faithfully analyze a reference video. Inspect media and frames before proposing a transferable craft; do not claim that analysis generated a new video.
user-invocable: true
---

## Handoff

Return `source_media`, `observed_shots`, `transferable_mechanisms`, `rights_flags`, `shot_contract`, `artifact_paths`, `status`, and `blockers`. Do not include a generated-artifact claim when the task only performed analysis.

# Reference Video Deconstruction

Analyze the supplied video as evidence, then convert observations into a DirectorX-ready shot contract. This is adapted from the useful `dx-design` deconstruction route and intentionally does not import its source application runtime.

## Procedure

1. `directorx_probe_media` for duration, dimensions, frame rate, streams, and file health.
2. `directorx_extract_frames` at meaningful beats; inspect the actual frames with `directorx_view_image`.
3. Record observable facts only: shot boundaries, framing, camera path, subject action, lighting, transitions, sound events, typography, and continuity.
4. Separate transferable mechanism from protected identity, characters, logos, names, and exact creative expression. Use the copyright-safe route before generation when an IP is named.
5. Produce a shot list with one primary action and one primary camera move per shot, plus `start_state`, `end_state`, transition source, cut point, inherited anchor, and next landing.
6. If the user asks to recreate rather than analyze, obtain the generation proposal/approval required by the selected initiative mode, then use the normal craft → ready → generate → inspect path.

## Evidence rule

A filename, prompt, or metadata record is not visual evidence. Do not report a match until frames or the returned media have been inspected.
