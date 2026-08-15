
name: short-video
description: "Short-form video craft: 3-second hooks, retention editing patterns, vertical composition, text overlays, looping endings, platform safe zones."
tags: [short-video, retention, hooks, vertical, loops]

# Short-Form Video Craft

The algorithm is the audience: the core metric is Average Percentage Watched, and the scroll decision happens at ~3.1 seconds. Production is editing; editing is retention engineering.

## The iron rules
- First 3 seconds decide survival: hook = first-frame image + 1-2s of spoken/text line. Never open with logo, chit-chat, or black frames. A silent opening dies.
- Hook must be truthfully related to the content — a hook that lies produces a cliff-drop retention curve and hostile comments.
- Mid-section rhythm keeps the curve; ending loop drives replays (1.3 vs 0.9 average views is a massive exposure gap).

## Retention editing patterns
1. **Pattern interrupt cadence**: meaningful visual change every 2-3s in the first 15s (cut, zoom, text layer, B-roll, camera change, tone shift). No single composition holds longer than 3s. Example: 0-3s hook + text; 3-5s tighter cut (1.3x push); 5-8s B-roll/illustration; 8-10s back to person, new angle; 10-13s key data line; 13-15s emphasis (slow-mo, push, tone shift).
2. **Progressive zoom** (talking heads): slow linear push from mid shot (~60% frame) to close-up (80-85% face) at ~1.5-2%/s over 30s; allow 2-3% horizontal drift. Imperceptible per second, obvious first-vs-last. If the viewer notices the zoom, it is too fast.
3. **Text overlay timing**: text appears 200-400ms AFTER the speaker starts the keyword (audio→text reinforcement); per line ≤4-6 words, shown 1.5-2.5s; ≥48px on 1080-wide; contrast ≥7:1 (white + dark stroke/band); position in the upper third (eyes track the top 40% of vertical screens); animation only 150ms fade or 102%→100% scale — no bouncing/rotating/sliding. Emphasize only 30-40% of lines (data, proper nouns, key claims, emotional lines).
4. **Loudness curve engineering**: -14 LUFS baseline; hook +1.5dB; key sentences +0.5-1dB (200ms attack / 500ms release); 300ms 2dB dip before section switches; music -18~-22dB under voice, back to -14dB in pure-visual beats. Invisible — if the viewer notices the volume, it is too much.
5. **Loop ending**: last 500ms returns to the same composition as the first 500ms (same camera/shot/subject position/color grade); final line lands on a natural stress; cut immediately after the tail sound (no silence tail); ending text invites rewatch ("did you catch #3?"); first and last frames color-matched for seamless loops. Optional incomplete-info structure: promise three reasons, deliver two.
6. **Platform safe zones**: TikTok bottom 15% / top 8% / safe middle 77%; Reels bottom 20% + right 60px button column; Shorts bottom 12%. One export is always covered somewhere — deliver per-platform versions. The golden band is the upper 40%: faces, key text, and hooks live there.

## Vertical composition
- Subject centered-upper; eye line at the upper third of the frame.
- Vertical favors medium close-ups and close-ups; wide shots lose information when cropped.
- Top band = title area, bottom band = captions; keep critical content out of both.
- One text line at a time (≤6 words); uppercase + numerals pop.
- Horizontal-to-vertical reframing uses smart reframing (subject tracking + progressive zoom + safe-zone adjust), never a center crop.
- Vertical transitions: occlusion passes (hand over lens, object pass), whip pans, zoom transitions; vertical movement reads better than horizontal on 9:16.

## 30s structure template
```
0-3s    hook (question/preview/conflict) + text layer
3-15s   expand (visual change every 2-3s, B-roll, key words on text)
15-25s  reversal/highlight/payload (the most valuable information here)
25-30s  close + CTA
```
Drama beats for 9:16: CU of conflict object (0-2s) → MCU reaction (2-4s) → OTS rival line (4-7s) → CU reversal (7-9s) → MS action/reveal (9-12s) → CU expression close + suspense hook (12-15s).

## Sound and captions
- 30%+ watch muted: no captions = losing a third of viewers; captions are an engagement signal.
- Record close (lavalier/shotgun), denoise, compress voice from -6dB.
- Cut on beat: align cuts to drum/vocal onsets; 1-2s beat density for dance/transformation.
- Caption style: white with black stroke, keyword colored/bold, sentence-by-sentence, karaoke highlighting optional and restrained.
- Series: fixed column name + fixed opening format builds follow habits; schedule consistency beats frequency; 1-3 precise community hashtags; keywords in description and speech for search discovery.

## AI generation application
- Generate the 6-8 shot prompt sequence from the 30s template with per-shot duration and safe-zone reservations.
- Beat-synced generation: analyze BPM/energy first, place cut points on beats, then write per-beat visual prompts.
- Reserve the upper 40% as clean area (solid/soft background) for text layers added later.
- Loop design: first and last frame prompts share composition (same camera/shot/subject position).
- Deliver per-platform versions; verify key content is not covered before export.