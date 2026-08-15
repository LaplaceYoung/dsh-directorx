
name: audio-sound
description: "Sound design: dialogue/music/SFX/ambience layering, record-edit-mix-master chain, LUFS loudness targets, beat-synced editing, lip-sync."
tags: [audio, sound, loudness, mixing, beat-sync]

# Audio & Sound Design

Sound has three elements (dialogue, music, SFX) plus ambience. Exactly one layer is dominant per moment — two equally loud layers are both unintelligible.

## Recording gates
- Dialogue outranks ambience (ambience can be replaced, dialogue cannot). Record ≥2 takes of every line; 10s room tone before rolling; peaks ≤ -6 dBFS; VO mic 15-30cm.
- Mic choice: shotgun outdoor/far, lavalier indoor/close, condenser in studio. Kill AC/fridge/fan noise first. Picture can be 4K; phone audio loses viewers instantly.

## Editing rules
- Trim breaths/flubs but keep emotionally meaningful pauses. Denoise floor noise only (overuse = watery artifacts). Pad silence with room tone — vacuum silence kills a cut. Fill missing SFX (door, steps, cloth).

## Mix order and levels
- Order: EQ first (dialogue presence 2-5 kHz; music yields mids; 80-200 Hz = power), then compression (dialogue ~3:1 from -6 dB), then reverb/delay (dialogue sparse, music large), pan last (dialogue center, music wide, SFX by picture).
- Levels: dialogue is the reference (-23~-18 LUFS); music sits -18~-22 dB under dialogue (ducking mandatory); SFX transients never cover dialogue. Every 30s ask "who is speaking / what matters now".

## Loudness targets
| Delivery | Target |
|---|---|
| Streaming | -14 LUFS / ≤ -1 dBTP |
| Short-video platforms | practice -10~-12 (deliver -14) |
| Broadcast | -23 LUFS |
| Podcast | -16~-18 |
| Netflix | -27 / -2 dBTP |
| Music | -14 (album) / -16 (track) |

Normalize then limit; never push loudness — platforms pull it back (loudness war loses dynamics; watch PLR, not peak). Dialogue is perceptually louder than music at equal LUFS — set music 2-3 LU higher.

## Beat-synced editing (audio as master clock)
- When audio drives the piece: analyze first (BPM, beat grid, section map, vocal onsets, energy curve), freeze shot structure, place shots on audio timecodes — measure before mapping, never invent timecodes.
- Beat taxonomy: drum beats = strongest rhythm (action/dance/fast cuts); vocal onsets = story feel; chord changes = emotional turns (better for slow songs); energy-curve cuts = section-level, strongest visuals at the chorus.
- BPM math: 120 BPM = 0.5s/beat; shot durations in integer multiples of 0.5/1/2 beats; convert to frames at project fps (24fps: 1 beat = 60/BPM × 24 frames).
- Structure mapping: intro = establishing; verse = narrative; chorus = highlight visuals (push-ins, close-ups, slow-mo); bridge = mood shift; outro = closing + CTA.

## Lip-sync and transitions
- Align vocal onset to the mouth-opening frame; <2 frames offset acceptable, >2 visible. Declare the sync tier per model capability: full-syllable / rhythmic-stress / emotional.
- Transitions: J-cut (audio leads 0.5-2s), L-cut (audio trails), sound bridges across cuts; a hard SFX (impact/alarm/applause) can mask a cut; deliberate 0.5s silence after a peak resets attention.
- Silence is a tool: insert deliberate silence for shock/emphasis; elsewhere pad with ambience — no accidental vacuum.

## Pre-delivery verification
Loudness normalize, true peak ≤ -1 dBTP, full-piece audibility scan (any accidental silence?), lip-sync spot check on AI VO, first/last loudness consistent, music rights confirmed for commercial export (platform library tracks need commercial re-check).

## AI generation application
- Put audio-first analysis in prompts: `Audio: [driving music, cut on beat], [voiceover, lip-sync to lyric X], [ambience: city night]` with concrete anchors ("cut on every beat, chorus at 0:25").
- AI VO: script → voice (timbre/pace/pauses) → human review of emotion and stress → mix. Lip-sync tier declared per model.