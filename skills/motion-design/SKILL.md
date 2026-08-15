
name: motion-design
description: "Motion graphics craft: 12 animation principles, easing parameters, kinetic typography, lower thirds, title sequences, MG workflow."
tags: [motion, animation, easing, typography, titles]

# Motion Design & Animation

Motion design communicates through movement — it makes information easier to understand, not flashier. The 12 Disney principles remain the gold standard; the single most important numeric lever is easing.

## The 12 principles (motion-design edition)
1. Squash & stretch — compress on impact, stretch on release; keep volume consistent (wider when squashed).
2. Anticipation — reverse wind-up before action (crouch before jump); the viewer "waits for it".
3. Staging — move the subject, keep everything else still; hierarchy makes the subject pop.
4. Straight-ahead vs pose-to-pose — modern software is pose-to-pose (keyframes + tweens).
5. Follow-through & overlapping — parts move out of sync (hair/coat lag); inertia after stops.
6. Slow in & slow out — acceleration/deceleration around keyframes; modern term: easing.
7. Arc — natural motion follows arcs, not straight lines (gravity).
8. Secondary action — small supporting moves (blink, breath); small enough not to steal the scene.
9. Timing — duration defines personality and weight; fast = lively, slow = heavy; consistent rhythm across the piece.
10. Exaggeration — amplify motion beyond realism for life.
11. Solid drawing — understand 3D space, light, volume.
12. Appeal — the result must look good; everything above serves this.

## Easing — the key numeric parameter
- Linear: uniform speed, mechanical/tech feel (use sparingly).
- Ease In: slow→fast (departure, falling).
- Ease Out: fast→slow (arrival, landing — the default first choice).
- Ease In-Out: slow→fast→slow (graceful, back-and-forth).
- Back/Spring: overshoot and bounce — playful emphasis, restrained.
- Overshoot: slight overshoot then settle — a more refined "emphasis" than bounce.
- Standards: UI/caption motion 150-300ms Ease Out (fast entry, soft settle); emphasis 400-600ms Ease In-Out.
- No easing = everything snaps on and off — the #1 amateur tell. Adding easing to keyframes is the first step from amateur to professional.

## Kinetic typography
- Readability first: text motion's primary job is being legible, secondary is beauty; motion must not fight reading.
- Clear in/out: consistent entry (slide/fade/scale) and exit for every text element.
- Emphasis via motion: keyword highlight + slight scale/color change (per short-video rules: ≤6 words, 1.5-2.5s, upper third).
- Restraint: 1-2 entry styles per piece; a different style per line is noise.
- Type options: fade (informational, calm), slide ease-out (talking-head keywords, UI), scale 102%→100% (emphasis), word-by-word (lyrics, beat-synced), typewriter (retro/code/suspense), bounce/rotate (entertainment only, cheapens easily).
- Specs: entry 150-300ms ease-out; hold 1.5-2.5s; exit ≤200ms; ≥48px on 1080-wide; contrast ≥7:1; upper-third position.

## Lower thirds
- Name + title/org; bottom third of frame.
- Hold at least the first 2-3 sentences of the speaker's opening, or 5-8s standard.
- Entry/exit: ease-out slide-in 150-300ms; exit faster than entry.
- Never cover the face or main action; align with safe zones; one consistent template across the piece.

## Title sequences
- Function: set the tone (the trailer of the trailer), deliver title/credits, hint narrative.
- Duration: 10-45s feature; 3-8s short-form — over 3s in short-form is churn (see short-video).
- Typeface carries personality: serif = classical, bold sans = modern, script = friendly; match content.
- Motion rhythm syncs with music; open and close echo the piece's tone.

## MG workflow (five steps)
1. Copy: one-sentence core message; per-screen one-line copy.
2. Script/storyboard: per-screen design (picture, text, motion, duration).
3. Graphic design: unified style (flat/illustration/3D), color system, type system.
4. Motion: apply the 12 principles + easing specs; rough first (positions), then detail.
5. Composite: voice, SFX, music, captions, export.
- Voice first, animation second: the audio timeline is the master clock.
- Sync key actions to speech stress / SFX / BGM beats.
- Hierarchy: only 1-2 elements move at a time — staging.
- Background loops save compute and attention.
- Templatize brand lower thirds / captions / transitions for consistency.

## AI generation application
- AI assists storyboards, copy, palettes; AI motion tools generate base animation, humans own rhythm and detail.
- Auto-captions with keyframe motion templates (entry/emphasis/exit applied automatically).
- Use motion terminology in prompts: "text scales in with ease-out, lower third slides in, key word pulses" — not "make it look nice".
- AI footage + MG overlay (animated captions/infographics/transitions) is the standard combo for informational content.
- One motion template set across the piece — style anchor.