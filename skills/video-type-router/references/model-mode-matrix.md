# Model × mode matrix (creative routing, 2026-09)

Public launch posts and community handbooks inform this table. Runtime availability, exact duration, resolution, and reference caps are owned by the live generation catalog. Do not paste this table into a user-facing promise.

## Families

| Family | Best modes | Strength | Weakness | Prompt grammar |
| --- | --- | --- | --- | --- |
| Seedance 2.0 | I2V, multi-shot via `镜头N` | Establishing, mid-shot blocking, Chinese commercial | Unstable if you stamp seconds; weaker on-screen type | 素材指代 + 镜头1/2/3 + 不要… |
| Seedance 2.5 | R2V, timestamp multi-beat, 15–30s one-take | `@Image` packs, timestamps, native audio, local repair | High-energy acrobatics; on-screen text | 四段式：指代 + 一句话 + `0s-Ns` + 全局收尾 |
| Kling 3.0 / Omni | I2V, multi-shot (up to ~6), Omni edit | Motion physics, product lock, lip-sync Turbo, `@video` edit | I2V prompt must stay short; do not restyle the still | Motion-only I2V; Shot N list for multi-shot |
| MiniMax H3 / Hailuo | T2VA I2VA FL2VA L2VA Ref2VA | Minimal product, paper/hand-drawn, lyric | Do not force Seedance timestamps | Official three-part fields |
| Veo 3.1 | T2V, I2V, FLF, native dialogue | Realism, speech, on-screen type, FLF arcs | Action is less urgent; refs are fewer | 5-part: Cinematography + Subject + Action + Context + Style |
| Vidu Q3 | R2V | 2D/manhua identity | Photoreal is the wrong job | Style-board first, idle motion only |
| Wan 2.2 / 2.7 / Animate | I2V, V2V / Animate | Local batch, same-day UGC effects | Not a drama hero model | Short motion prompt; discard same day |
| Runway Gen-4.5 | I2V + editorial control | Multi-clip production | Cost / access | Shot list + gen settings |
| LTX-2.5 | local I2V | Offline preview | Final beauty elsewhere | Short |

## Per-shot picker

| Shot job | First pick | Fallback |
| --- | --- | --- |
| Character sheet / first frame | Image model (Banana / GPT-Image-2) | Seedance still if needed |
| Establishing, walk-in | Seedance 2.0 Fast I2V | Kling I2V |
| Dialogue CU | H3 I2VA or Seedance 2.5 or Veo 3.1 | Kling Turbo |
| Action / fight beat | Kling 3.0 I2V, 3–5s | Seedance 2.5 only if timestamped and not acrobatic |
| Multi-beat 15–30s with refs | Seedance 2.5 R2V | Kling multi-shot ≤6 |
| Designed start→end | FLF on Veo 3.1 or H3 FL2VA or Seedance 2.5 | Kling I2V + planned last frame |
| Product hero / label lock | Kling 3.0 I2V | Seedance 2.5 with product `@Image` |
| Lip-sync talking head | Kling Turbo / Omni or Veo 3.1 | H3 I2VA; audio first |
| 2D manhua idle | Vidu Q3 | Kling subtle I2V |
| Architecture / travel photo | Kling I2V preserve | Veo atmosphere |
| Same-day UGC effect | Wan Animate | Discard; never swap a public face |
| Live cut | CUT / ffmpeg | Never regenerate |

## Continuity pairing

Every identity-critical hop carries **both**:

1. master reference image in `reference_image_paths`
2. selected tail frame as `first_frame_path`

Tail frame owns time and space. Master ref owns identity. A tail frame alone drifts.

Stop a frame-chain at 5–6 hops or at the next designed FLF anchor. Repair the failed hop; do not keep chaining.
