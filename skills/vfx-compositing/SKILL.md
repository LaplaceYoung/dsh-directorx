
name: vfx-compositing
description: Green-screen shooting and keying workflow, VFX pipeline stages, compositing discipline, AI keying/background generation.
tags: [vfx, compositing, keying, green-screen]

# VFX & Compositing

The VFX pipeline is a chain that protects the next stage from guessing and rework. Two core truths: the biggest "fake" tell is light mismatch, not edge quality; and VFX decisions must be made early (green screen? motion control? clean plates? tracking markers?).

## Green-screen shooting (decides post difficulty)
- Light the screen evenly — uneven lighting = noisy key edges.
- Subject ≥2-3m from the screen to reduce spill.
- No green/blue clothing on the subject (conflicts with the key color).
- Control motion blur per the 180° rule; heavy blur is the hardest edge to key.
- Capture on set: clean plate (empty background), tracking markers, lens info (focal/aperture/sensor), HDRI panorama + grey/chrome balls, reference photos.
- Motion control when a precisely repeatable camera move is needed.

## Keying workflow
1. Source prep: denoise 0.3 strength (higher softens face detail); spill correction 0.6 strength applied to edge transition zones only (over-suppression desaturates the whole foreground).
2. Key: generate the alpha matte (white = foreground, black = background, grey = semi-transparent edges).
3. Edge refinement: edge feather 3-5px at 1080p (6-8px on hair); hair detail as a separate high-res edge analysis — hair/flyaways are the hardest part.
4. Background generation: build the replacement background from a lighting analysis (direction/temperature/shadows).
5. Composite: foreground over background with edge integration (prevent halos).
6. Color integration: align saturation difference, shadow warmth, midtone contrast between layers — "can't say why but it's right".
7. Export: for further compositing use alpha (ProRes 4444); delivery ProRes 422 HQ / H.264 16Mbps.

## VFX pipeline stages
- Pre-production: R&D tech tests on a test board → decide frame rate/color management/file formats/versioning rules; storyboard and animatic; concept art as the unified reference; previs; layout/art (live-CG boundaries, interaction light positions, reflective surfaces); reference photography (HDRI, grey/chrome balls, measurements, lens records).
- Production: VFX supervisor close to the camera crew — small on-set decisions cost weeks in post; 3D modeling/texturing/pre-comps run in parallel; discipline: markers placed correctly, clean plates complete, lens info recorded — minutes on set vs weeks in post.
- Post: match move (rebuild the virtual camera — a small tracking error breaks everything); animation locked to live action (no foot sliding); FX simulation (layout/animation first, then simulate); texture/light/render matching live light and camera response; compositing (color/contrast/grain/edge behavior match); roto and mattes (edges must match depth of field — shallow DoF needs soft edges).

## Compositing discipline
- Still first, motion second: a clean single frame means nothing until motion matches — motion is the compositing truth.
- Match grain/noise: a "clean" CG element is suspicious.
- One color space end to end.
- Version control: every change saved as a version with the feedback it answers.
- Review in the target device/brightness environment.
- Checklist: light direction/temperature/shadows match background; no halos or hard edges; hair/translucent alpha complete; grain matched; edges stable in motion; color unified; DoF matched; lens distortion/chromatic aberration matched; versions traceable.

## AI keying and compositing (2026)
- AI keying understands semantics (what is a person/object) rather than color ranges — better on spill, translucent hair, and motion-blurred edges than chroma key.
- AI background generation: lighting analysis → prompt encoding (direction/temperature/shadows) → matched background.
- Batch compositing: one foreground + many backgrounds (localization, A/B tests, regional versions) in one pass.
- Boundary: AI-generated motion is not techvis; complex composites still need human node control.

## AI generation application
- Put the subject's lighting parameters into background prompts: "key light upper left, warm 5600K, shadows to the right".
- AI background replacement workflow: shot subject (green screen or not) → AI key → AI background → color unification → batch versions.
- Post-generation check: run generated composites through the compositing checklist (edges/grain/light/DoF).
- AI-assisted roto: auto masks, human refines keyframes.