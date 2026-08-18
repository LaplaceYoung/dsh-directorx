
name: continuous-video
description: Use for any multi-shot or story-driven video that must preserve subject identity, spatial continuity, action continuity, or natural shot transitions across generated clips.
tags: [video, continuity, first-last-frame, references, transitions]

# Continuous Video Direction

## Goal

Build a sequence of short clips whose subject identity, scene geometry, motion direction, lighting, and emotional progression survive every seam.

A single continuous take with a named roster and an object handoff (pass, swap, give) is not this skill's first step. Write a blocking sheet with `directorx_blocking` first, then split the sheet's ticks across clips.

## Mandatory reference contract

1. Lock a subject/character reference image before generation.
2. Whenever the subject is visible, pass that locked image in `reference_image_paths` for every clip. A prior tail frame carries time and space; it does not reliably preserve identity.
3. Carry a scene/style reference whenever location, production design, wardrobe, palette, or light must remain stable.
4. Keep clips short (normally 4-6 seconds, never above the provider's reliable limit) and write the camera move and motion direction explicitly.

## Frame-chain strategy

Use `continuity_strategy: frame_chain` for continuous action in the same space.

- Clip N's best tail frame becomes clip N+1's `first_frame_path`.
- Use a planned `last_frame_path` at convergence points or when the next beat has a designed endpoint.
- Re-anchor the locked subject reference on every hop.
- Select the best tail frame visually; do not blindly use the final encoded frame.
- Add a small overlap margin and choose the seam during assembly.
- Stop the chain when a segment drifts. Repair that segment against the locked reference before continuing.

## Transition strategy

Use `continuity_strategy: transition` only for a deliberate time/place/beat change or when the model cannot reliably interpolate the action.

- Hard cut: default for a clean change or when motion should feel decisive.
- Match cut: bridge a shared shape, gaze, action direction, sound, or graphic motif.
- Motivated dissolve: use for memory, elapsed time, emotional softening, or dream logic; avoid during fast physical action.
- Whip-pan or motion-blur transition: only when outgoing and incoming movement share direction and approximate speed.
- Wipe: only when the story or graphic language motivates it.
- Avoid xfade on moving footage as a repair shortcut; it often ghosts motion and does not solve identity drift.

Every declared transition must include its motivation and the assembly step where it will be applied.

## Prompt contract per clip

Each prompt must state the subject and locked identity, start state, end state, action trajectory, camera position and one primary move, light direction and quality, scene/style anchor, continuity input, audio bridge, duration, and what must not change.

## Review gate

Inspect each generated clip and its seam before using it as the next chain input. Compare the locked subject reference first, then the prior tail and new first frame. Do not claim continuity from filenames or prompts alone.