
name: frame-qa
description: Objective QA checklist for evaluating generated frames and clips before they enter the render chain.
tags: [qa, consistency, review, frames]

# Frame QA Checklist

Run every generated frame and clip against this objective checklist — the same list every time, not taste.

## Identity
- Compare against the character contract: hair, outfit colors, facial features, body type.
- Reject faces drifted into "average face" territory; flag costume swaps (models protect the face, clothing drifts first).
- Re-assert the forbidden-changes list from the character sheet in every retry prompt.

## Spatial & continuity
- Subject position, scale, and framing match the shot spec (shot size, angle, composition).
- Lighting direction, color temperature, and tone match adjacent shots — not just the style board.
- No background flicker or lighting jumps between frames of the same scene.

## Semantics
- The frame fulfills the storyboard beat: correct action, emotion, props present.
- An invented subject means the subject was under-defined — send back with 2-3 stable details, not a vague "make it better".

## Physics & artifacts
- Limb counts, finger integrity, occlusion order, motion continuity — reject noodle limbs and morphing hands.
- No hallucinated text, logos, or watermarks; product frames must be clean of text.

## Composition readiness
- Sharpest, best-composed candidate with headroom for motion; dead-center locked compositions with no room to move fail.
- Vertical deliverables: subject in the upper-middle third; nothing critical in the top 15% or rightmost 150px; caption space clear.

## Audio (when present)
- Dialogue intelligible, SFX placement correct, levels sane, lip-sync within tolerance.

## Seam & chain QA (long-video segmentation)
- Run `scripts/video/seam-check.sh <segmentA> <segmentB> chain` on every frame-chained seam before assembly: seam-pair PSNR/SSIM vs the intra-segment baseline, lighting shift, motion-energy triplet. Verdicts: PASS / WARN (review with `view_image`) / FAIL (rework the segment at the seam).
- Judgment is relative to the intra-segment baseline, never absolute — absolute values vary wildly across models and subjects; an honored chain reads closer than ordinary adjacent frames, a broken chain reads far worse.
- Watch the drift curve, not just the seams: chain hops degrade identity gradually (~5-6 hops before visible collapse). Periodically compare a mid-chain segment against the locked master reference with `view_image`; drift is answered by re-anchoring (master reference back into `reference_image_paths`), not by post-hoc blending.
- After assembly run `scripts/video/seam-check.sh --scan <final>`: every frame-diff outlier and every hard cut must correspond to a declared transition in the plan; anything else is a defect to locate and rework.
- Seams and drift are different problems: a visible seam (jump at one boundary) is fixed by better conditioning at that seam; drift (gradual decay along the chain) is fixed by re-anchoring and convergence keyframes. Post-processing blends hide neither.

## Discipline
- Score candidates on the axes above and pick the highest total; record prompt, references, and seed so the winner is reproducible.
- Change one variable per retry; never fall into prompt → reroll → pray.