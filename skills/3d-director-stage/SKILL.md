---
name: 3d-director-stage
description: Use for Director Stage-style blocking, camera language, procedural scene craft, or visual verification when the host exposes a compatible 3D stage capability. Never claim a 3D scene exists without returned scene evidence.
user-invocable: true
---

## Handoff

Return `beat`, `blocking`, `camera_contract`, `capability`, `scene_evidence`, `artifact_paths`, `status`, `mismatches`, and `blockers`. A scene snapshot is required for visual claims; metadata alone is not evidence.

# 3D Director Stage Craft

This compatibility skill preserves useful creative judgement from `dx-design` without importing its Electron or plugin runtime. The host remains DSH; DirectorX only routes available tools.

- Plan the dramatic beat before coordinates: subject, action, eyeline, foreground/background, then camera.
- Prefer one motivated camera move over disconnected spectacle.
- Use semantic assets for recognizable objects; do not repurpose an unrelated prop or approximate a hero object with filler geometry.
- Treat a scene snapshot or returned media as visual authority. Structure metadata and diagnostics do not prove appearance.
- Inspect the actual capture, fix the highest-impact mismatch first, keep correction loops bounded, and report exhausted budgets as remaining mismatches.
- If no compatible 3D capability is enabled, return that blocker and route the request to 2D/image/video craft instead of pretending to execute 3D.

## DirectorX fallback

If the host has no 3D stage tool, use `directorx_blocking` for a 2D blocking sheet, then `directorx_prompt_plan` and `directorx_generate_ready` for a video approximation. Label it as a 2D/video approximation; never call it a 3D scene.
