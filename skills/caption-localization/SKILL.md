
name: caption-localization
description: Subtitle timing standards (Netflix), reading speed and segmentation, forced narrative, localization workflow (translation/transcreation/dubbing), QC.
tags: [captions, subtitles, localization, dubbing]

# Captions & Localization

Subtitles are the second narrative layer: required accessibility for deaf/hard-of-hearing viewers, the localization channel for multilingual audiences, and a retention tool for short video (30%+ watch muted). The goal (Netflix): the viewer feels like they are watching the content, not reading subtitles.

## Timing standards (Netflix timed text)
- In-time: at the first audio frame or as close as possible (±1-2 frames, use the waveform).
- Out-time: if no subtitle follows immediately, out at least half a second AFTER the audio ends (reading room) — never exactly at dialogue end. Half second = 12 frames at 24fps, 15 at 30fps, 30 at 60fps.
- Shot changes: if dialogue starts at or within half a second of a cut, set in-time to the cut's first frame; if out-time lands within half a second of a cut, extend to the cut (keeping a 2-frame gap). Subtitles should not span a cut unless the dialogue itself does.
- Minimum duration: 20 frames (0.83s) — only for 1-2 word lines.
- Gap between adjacent subtitles: minimum 2 frames; gaps of 3-11 frames at 24fps must be chained (extend the previous out-time to 2 frames). Gaps are either 2 frames or ≥ half a second — never the "flicker" zone.
- Borrowing time: when reading speed is uneven, merge adjacent subtitles to borrow time and keep overall rhythm even.
- Forced narrative (FN, on-screen text): sync exactly with the screen text (mid-point of fade for fades); if the screen text lasts the whole shot, out at 2 frames before the cut; FN may exit early when dialogue takes priority.

## Readability
- Reading speed: ~15-20 chars/s Latin (Netflix); ~12-16 chars/s Chinese.
- Max 2 lines per screen (Latin ~42 chars/line; Chinese ~18-20 chars/line).
- Segment by semantic units (complete noun/verb phrases); keep adjective+noun on the same line.
- Check: chars ÷ reading speed ≤ subtitle duration, else split or speed up.
- Chinese specifics: full-width punctuation; consistent name/place transliteration (a name list first); trim fillers by context; avoid word-for-word translation — Chinese is shorter, so two English subtitles often merge into one.
- Accessibility captions include non-speech info: SFX ([doorbell], [music swells]), speaker IDs ([male voice]), delivery cues ([whispering]).

## Formats
SRT (universal), WebVTT (web standard, positioning/styling), ASS/SSA (rich styling, hard-subs), TTML/IMSC1 (Netflix/broadcast), DFXP (broadcast), burn-in (short video — everyone sees it, not switchable).

## Localization workflow
1. Transcription: verbatim script + timecodes (ASR errors amplify downstream — proofread).
2. Translation: literal draft.
3. Transcreation: re-creation for the target language and culture — jokes, memes, puns, local idioms. This is the "watching content, not reading subtitles" step; AI literal translation is never enough here.
4. Subtitling: re-segment/re-time per target reading speed.
5. Dubbing (optional): adapt for lip-sync and duration; casting/recording/mixing. Cost 10-20x subtitles; choose for children's content, comedy, mass market; subtitles for fast multilingual rollout, documentaries, jargon-heavy content.
6. QC: watch the full piece — timing, typos, missing lines, spoilers (punchlines/reversals must not appear early), format.
7. Delivery per platform specs.

## AI generation application
- AI transcription+translation+subtitling drafts, humans do transcreation and QC.
- AI dubbing localization: multi-language TTS; check lip-sync and emotion; keep brand voice with the same cloned voice across languages.
- Short-video hard subtitles follow safe-zone and text-layer specs (see short-video / motion-design).
- Batch localization: one master, many language subtitle/dub versions, one shared QC gate.
- QC checklist: full watch-through; in/out compliant with the half-second rule; no 3-11 frame flicker; reading speed per language; no typos/omissions; no spoilers; FN synced with on-screen text; speaker IDs and SFX present; format/encoding/naming per spec; name list consistent.