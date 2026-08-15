
name: platform-specs
description: Delivery specifications and export settings for video platforms (resolution, codec, loudness, aspect, safe zones, versioning).
tags: [delivery, export, platforms, loudness, codec]

# Platform Delivery Specs

Use before finalizing any video export or when the user names a target platform.

## Quick reference

| Platform | Aspect / resolution | fps | Codec | Loudness |
|---|---|---|---|---|
| YouTube / Bilibili (horizontal) | 16:9, 1080p or 4K | 24/30 | H.264 MP4 | -14 LUFS |
| TikTok / Douyin / Reels / Shorts | 9:16, 1080x1920 | 30 | H.264 MP4 | -14 LUFS |
| TV / broadcast | 16:9 1080i/1080p | 25 (PAL) / 29.97 | ProRes/DNxHR master | -23 LUFS (EBU R128) |
| Cinema / master | 2K/4K 24fps | 24 | ProRes 4444 | per mix |
| WeChat Channels | 9:16 or 16:9, ≤1GB | 30 | H.264 | -14 LUFS |

## Export rules

- Loudness: normalize to -14 LUFS for streaming, -23 LUFS for broadcast; True Peak ≤ -1 dBTP. Never clip; no quiet voids; dialogue must be clearly audible.
- Color: Rec.709 SDR by default; use platform HDR only when requested. Keep one working color space end to end (Log → correction → grade → output).
- Full decode check: no artifacts, no black frames, no freezing at the end; verify the file plays through before delivery.
- Version naming: V1 / V2 / Final + date — never "final_final_v3.mp4"; one file, one version, one comment thread.
- Vertical safe zones (1080x1920): top ~15% logo/watermark zone, bottom ~15% captions, right ~150px UI icons; critical content stays centered.
- Subtitles: embed or sidecar per platform; captions are a ranking factor, not polish — muted viewing dominates.

## Archive (master delivery)

Final cut in all formats + editable project files + raw footage + licensed assets (music/fonts/portrait releases) + project docs (brief, script, version log, approvals).