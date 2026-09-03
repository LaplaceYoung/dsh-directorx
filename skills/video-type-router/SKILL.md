---
name: video-type-router
description: >-
  Use first whenever the user asks to make a video, names a content type
  (short drama, manhua, UGC ad, talking head, explainer, MV, trailer, unbox,
  travel, game/anime PV, documentary, live cut), or asks which model, mode,
  prompt formula, or pipeline to use. Routes the job onto an existing DirectorX
  skill or one of the content-type pipelines. Do not skip this skill when the
  content type is ambiguous.
tags: [router, video, pipeline, model, prompt]
---

# Video Type Router

Decide type → mode → model family → existing skill. Then stop routing and execute that skill.

This skill does not generate media. It writes a one-page routing card and hands off.

## 分叉

片种、画幅、时长、有没有锁定参考，用 `directorx_ask` 一次问清。不要正文菜单。用户说「你定」时写出默认并继续。

## 12 types → existing assets

| Type | Default mode | Preferred family | Hand off to |
| --- | --- | --- | --- |
| 短剧 / short drama | I2V + FLF chain | Seedance 2.5 R2V for multi-beat; Kling 3.0 for action; H3 for CU dialogue | `novel-outline` → `novel-characters` → `novel-art` → `novel-script` → `novel-storyboard` + `recipes/short-drama.md` + `continuous-video` + `seedance-2-5-prompt-copilot` |
| 漫剧 / manhua | I2V subtle | Vidu Q3 R2V or Kling 3.0 low-motion I2V | `novel-art` style lock + `continuous-video`; do not photoreal |
| UGC / 产品广告 | I2V from product still | Seedance 2.5 for 15–30s story; Kling Omni for product lock; H3 for minimal still-life | `ugc-ad-pipeline` + `recipes/one-line-ad.md` + `banana-prompt-copilot` / `gpt-image2-prompt-copilot` for first frames |
| 口播 / talking head | S2V or I2V + native audio | Kling 3.0 Turbo / Omni lip-sync; Veo 3.1 dialogue; H3 I2VA | `talking-head-pipeline` + `workflows/directorx-talking-video.js` + knowledge `137-digital-human` |
| 教程 / explainer | Audio clock first, then I2V B-roll | Seedance 2.0 for concept plates; Kling subtle I2V; never generate readable formulas | `explainer-pipeline` + `recipes/tutorial-video.md` + `short-video` |
| MV | Beat-sync I2V / R2V | Seedance 2.5 timestamp; Kling Omni performance | `directorx-mv-workflow` + `beat-sync-editor` |
| 片花 / trailer | Hard-cut I2V | Kling 3.0 multi-shot; Seedance 2.0 establishing | `trailer-craft` + `recipes/trailer.md` |
| 开箱 / product demo | I2V locked product | Kling 3.0 I2V; Seedance for hero beauty | `ugc-ad-pipeline` (unbox branch) |
| 文旅 / travel | I2V from real photo | Kling 3.0 I2V preserve architecture; Veo 3.1 atmosphere | `explainer-pipeline` travel branch; never invent signage |
| 游戏/动漫 PV | I2V from key art | Kling / Vidu / Seedance 2.5 R2V | `anime-game-pv` |
| 纪录片风格 | I2V illustration | Veo 3.1 / Seedance nature plates | `recipes/docu-video.md`; label reconstruction, never fake archive |
| CUT / 直播切片 | CUT only | No generation | transcribe → score → human gate → 9:16 face crop → captions |
| LIVE 数字人 | LIVE | Avatar / lip-sync stack | knowledge `137-digital-human`; not the film chain |

## 7 modes

| Mode | When | Prompt job | Do not |
| --- | --- | --- | --- |
| T2V | No locked still exists | Describe subject + action + camera + light | Use as the production default |
| I2V | First frame or product/character still exists | Describe only what changes | Re-describe the still |
| FLF | Start and end states are designed | Describe the interpolation path | Use as identity lock; still pass the master ref |
| R2V / Omni | Many refs (character + set + motion + audio) | Bind every `@Image N` / `@Video N` to one authority | Merge refs into prose and drop the files |
| S2V | Voice or music is the clock | Picture follows the locked audio | Generate picture first and hope the mouth matches |
| CUT | Source footage already exists | Edit, do not regenerate | Re-generate talking-head takes of a real live |
| LIVE | Realtime avatar | Drive face from audio | Treat as an offline 30s Seedance job |

Default production path is **image first, then I2V**. T2V is a scout, not a delivery path.

## Model family routing (creative suggestion)

Live catalog, duration, price, and reference limits belong to the available generation tools. Public pages inform prompt shape only. If the named model is offline, deliver the prompt pack and report the gap. Do not silently swap Seedance 2.5 ↔ 2.0 ↔ Kling ↔ H3.

Read `references/model-mode-matrix.md` before naming a family.
Read `references/prompt-skeletons.md` before writing a prompt.

Quick defaults when the user does not name a model:

- Identity + multi-beat + timestamps → Seedance 2.5, then `seedance-2-5-prompt-copilot`
- Single-clip motion / action / product physics → Kling 3.0, then `kling-prompt-copilot`
- Minimal product / paper-craft / lyric-led → H3, then `minimax-h3-prompt-copilot`
- Dialogue-forward 8s cinematic → Veo 3.1 via the live catalog
- 2D manhua consistency → Vidu Q3 if present, else Kling low-motion I2V
- Cheap local batch → Wan family if present

Seedance 2.0 uses `镜头N`, not second stamps. Seedance 2.5 uses contiguous `0s-4s` ranges. Do not mix the two grammars.

## Output card

Return exactly this, then hand off:

```text
TYPE:
MODE:
FAMILY:                 # suggestion, live catalog decides
SKILL / RECIPE:
LOCKS:                  # identity / product / architecture / copy / audio clock
ASPECT / DURATION:
FIRST ASSET TO MAKE:
PROMPT SKILL:
QA GATE:
DO NOT DUPLICATE:
```

## Quality bar

- One type, one mode, one prompt skill per clip. Mixed-model projects are allowed across clips, not inside one clip.
- Never invent a new short-drama skill. The novel-* chain already owns that story.
- Never put platform-speculative limits into the prompt.
- CUT and LIVE must not enter `continuous-video` frame-chain.
