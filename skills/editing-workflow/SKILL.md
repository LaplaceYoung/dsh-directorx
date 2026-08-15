
name: editing-workflow
description: Six-stage editing pipeline with hard gates (setup/ingest/rough/fine/finishing/export), tool selection, version control, AI footage integration.
tags: [editing, workflow, pipeline, post-production]

# Editing Workflow

The six stages run in dependency order; downstream starts only when upstream is frozen: setup → ingest → rough → fine → finishing → export/QC.

## Stage gates
1. **Project setup**: folder template (00_Project/01_Footage/02_Audio/03_Graphics/04_Exports/05_Assets); clip naming `ProjectName_Date_CameraRoll_ClipNumber`; versions per session `Project_v01` (never overwrite); fps/res/color space fixed at start; daily backup to a second drive.
2. **Ingest**: verify integrity (hash/copy report) before wiping cards; sort into bins by scene/camera/interviewee; rename; proxy for 4K+.
3. **Rough cut**: selects first, then story skeleton; zero polishing — color on a shot that will be cut is pure waste. AI assists: silence removal, speech-to-text, transcript-first assembly.
4. **Fine cut**: trim for rhythm; every frame either serves the story or distracts; J/L cuts lubricate dialogue; cut action mid-motion.
5. **Finishing**: PICTURE LOCK is the hard gate — freeze visuals, THEN color, mix, motion, subtitles; leave ≥10s handles for downstream conform.
6. **Export & QC**: render per platform spec; QC = full playback on the actual target device (format/picture/sound/subtitles) — the last gate before delivery.

## Tool selection
- Short-video volume → CapCut/剪映 (fastest, templates, beat-sync; proofread auto-subtitles — typos are the #1 short-video failure; verify export specs yourself).
- Professional pipeline → Premiere (industry timeline, non-destructive, proxies) or Resolve (free tier extremely capable, best color, single-tool pipeline).
- Interviews/podcasts → Descript (cut text = cut video); Mac solo → Final Cut Pro; zero budget → Kdenlive.

## Version and failure discipline
- Version control: `Project_v01/v02…` per session, never overwrite; one file one version one comment thread.
- Six failure modes to guard: skipped ingest (stop and organize before cutting), rough-cut polishing (discard), skipped picture lock (conform disasters), no version control, no QC (the client finds the error first), AI as replacement instead of supplement.

## AI footage integration
- AI shots enter the same selects→rough→fine pipeline (folder `01_Footage/AI_Shots/`); name batches `Project_AIGen_BatchN_ShotN` for prompt/parameter traceability.
- Unify color with one LUT when mixing AI + live footage; add AI-specific QC items (flicker, limbs, garbled text).
- AI-first, human-final: AI does mechanical passes (subtitles, silence, transcript assembly); humans own rhythm, story, final quality. A messy project fed to AI produces mess faster.