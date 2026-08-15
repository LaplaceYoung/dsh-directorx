
name: thumbnail-cover
description: "Thumbnail and cover system: 3 click elements, small-size-first design, squint/greyscale gates, controlled A/B protocol, split composition, series templates."
tags: [thumbnail, cover, ctr, ab-test]

# Thumbnail & Cover System

CTR is the algorithm's first lever. Every high-CTR thumbnail carries three elements: a dominant face with an exaggerated expression, bold type or strong visual contrast, and a clear visual promise — and the promise must never mislead the video (high CTR + low retention = algorithm punishment).

## Design and gates
- Design and judge at 320×180 first — small-size competition is the real one; full-size clarity collapses to colour blocks. Expressions must exceed life size.
- Squint test: blur/step back until the thumbnail collapses to colour blocks — the subject must stay identifiable and separate from the background.
- Greyscale test: must remain readable without colour (older Android renders grey).
- Contrast levers: "ultra high contrast, vivid saturation" in prompts; complementary wardrobe/background (blue jacket → orange bg); post contrast/saturation bump.

## Candidate + A/B workflow
- Generate 6-10 candidates in one session exploring expression/light range (no lock-in); kill unreadable ones at small size.
- Controlled A/B: exactly one variable per pair (background colour, expression intensity, gaze direction); parallel branches off one generation node produce ~10 controlled pairs; upload Top2 to platform A/B and let real exposure data decide.
- Split composition recipe: environment 16:9 + reaction-face crop (tight portrait prompt, pure white background for keying), face at 40-50% of frame width, center-left or -right, text on the opposite side — validated for tech/finance/lifestyle.
- Never render text with AI in covers — AI text misspells; add type in design tools; title ≤4 words, emphasize numerals.

## Series and platforms
- Series template: lock palette, typeface, face position/crop, light style; swap expression, text, product per episode; ~5 min per episode at scale.
- Platform specs: Douyin 9:16 first-frame-as-cover + safe area; Xiaohongshu 3:4 text-led; WeChat Channels 9:16/1:1 warmth; Bilibili 16:9 A/B-able; YouTube 16:9 1280×720 official A/B.