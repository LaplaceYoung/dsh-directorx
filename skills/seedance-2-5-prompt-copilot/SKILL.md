
name: seedance-2-5-prompt-copilot
description: Use for every Seedance 2.5 video task: prompt creation or rewrite, large multimodal reference packs, R2V, storyboards and animatics, first/last-frame interpolation, short drama, one-take and action previs, ads and ecommerce, fashion, music and performance, game cinematics, explainers, training, localization, digital humans, factual or regulated content, architecture, automotive, travel, source-video editing, local-region repair, and failed-output diagnosis. This is the single Seedance 2.5 skill; do not route to separate Seedance 2.5 specialist skills.
tags: [prompt, video, image]

# seedance-2-5-prompt-copilot

> Use for every Seedance 2.5 video task: prompt creation or rewrite, large multimodal reference packs, R2V, storyboards and animatics, first/last-frame interpolation, short drama, one-take and action previs, ads and ecommerce, fashion, music and performance, game cinematics, explainers, training, localization, digital humans, factual or regulated content, architecture, automotive, travel, source-video editing, local-region repair, and failed-output diagnosis. This is the single Seedance 2.5 skill; do not route to separate Seedance 2.5 specialist skills.

# Seedance 2.5 Prompt Copilot

## Purpose

Turn an approved brief and reference pack into one controllable Seedance 2.5
prompt, a complete timecoded audiovisual plan, and a selective review or repair
loop. Cover specialist domains through references rather than separate public
skills.

## 分叉

时长、多参考还是首尾帧、不可变锁，用 `directorx_ask` 一次问清。不要正文菜单，不要 `show_form`。

多人连续、单镜长拍、物件交接：先 `directorx_blocking` 写场面台账，再按本技能写成稿。不要把事件顺序直接当成 Seedance 提示词。

## Default Multi-Reference Mode

Start every invocation in multi-reference mode. This is the creative default,
not a claim about live reference count or compatibility.

- Build an ordered `Reference Role Map` before prompt writing.
- Give each source one primary authority: identity/product/IP; setting/geometry;
  storyboard/shot order; motion/performance/camera; style/material/light;
  dialogue/voice/music/rhythm; source video/edit scope; or evidence/copy.
- Group large packs by role and priority. A published maximum is a ceiling, not
  a target; use full compatible reference coverage for every fact that must
  remain stable. Several complementary assets may jointly support one role.
- Never silently omit, merge, reorder, or reduce a relevant reference to prose;
  exclude only conflicting sources or true duplicates that add no visible
  evidence.
- Resolve conflicts only after confirmation: user locks; identity/product/copy;
  geometry and state; storyboard/order; motion/camera; audio; style; atmosphere.
- If the pack is incomplete, keep multi-reference recommended and request the
  missing assets or approval for named placeholders. Do not invent references.
- `First/last-frame mode` is the explicit alternative. It uses two ordered image
  anchors for opening and terminal states. It is not a smaller multi-reference
  workflow.
- 只有用户在 DSH 标准提问里选定，才能从多参考改成首尾帧。不要凭附件数量自行切换。

For direct generation, preserve the approved mode, reference order, and prompt.
Let the live runtime resolve the exact Seedance 2.5 request mode. If validation
rejects the pack, do not drop assets or switch modes; show a new form with valid
alternatives.

## Runtime Boundary

`the available generation tools` owns current model IDs, modes, duration, resolution, input types,
reference limits, editing controls, parameters, price, availability, submission,
and result state. Public Seedance pages and community workflows inform prompt
design only.

Before generation:

1. read the exact live Seedance 2.5 contract;
2. resolve all confirmed media;
3. validate mode, pack, duration, and parameters;
4. submit the exact final prompt and reference order unchanged;
5. inspect the returned result.

If the exact model is unavailable, deliver the approved prompt, storyboard, or
edit package and report the gap. Never silently substitute Seedance 2.0 or
another model. Do not expose internal commands or payloads to users.

## Workflow

1. After the ask card, identify the primary acceptance family:
   reference orchestration; first/last-frame; story/previs/performance;
   commercial/growth; knowledge/enterprise/localization; factual/regulated;
   spaces/mobility/travel; or local editing/repair.
2. Load only the matching references from the router.
3. Build the `Reference Role Map`, immutable-lock list, and conflict notes.
4. Choose one outcome, a causal event sequence, camera and cut grammar, audio
   hierarchy, and concrete ending state.
5. Write a contiguous timeline covering the confirmed duration.
6. Assemble the final prompt from `references/visual-elements.md` and the timeline shape below.
7. Review reference influence, continuity, action order, audio, truth, rights,
   disclosure, and delivery format.
8. Repair only the failed region, segment, or instruction; keep passed layers.

## Reference Router

| Need | Read |
| --- | --- |
| 视觉元素、运镜、材质 | `references/visual-elements.md` |

H3 官方五种模式不要用本技能硬套。海螺 / MiniMax H3 走 `minimax-h3-prompt-copilot`。

## Timeline Control

Every final generation or video-edit prompt must include a visible `Timeline`
with contiguous ranges formatted exactly like `【0:00-0:03】`.

- Start at `0:00`, cover the full confirmed duration, leave no gaps or overlaps,
  and end exactly at the confirmed duration.
- Give each range one dominant event and resulting state. Include camera, cut or
  transition, synchronized audio/dialogue, and relevant preserve lock.
- Allocate time by complexity rather than equal blocks. Preserve anticipation,
  contact, reaction, recovery, and a readable final hold.
- Place exact dialogue, lyrics, UI events, claims, impacts, match cuts, and beat
  cues inside their owning range.
- For source-video edits, separate source timecodes from output ranges and state
  their mapping.
- For longer sequences, use more ranges rather than overloading each range.
- Treat timeline control as direction, not a runtime guarantee.

Canonical shape:

```text
Target duration: 15 seconds
Timeline:
【0:00-0:03】Hook and opening state; camera: one clear move; audio: first cue.
【0:03-0:08】Primary action and visible proof; preserve: identity, product, geometry.
【0:08-0:12】Reaction, escalation, or comparison; transition: motivated and timed.
【0:12-0:15】Payoff, exact CTA or final state, and readable hold.
```

## Prompt Rules

- Put reference binding before creative prose. Name what each image, video,
  audio, storyboard, script, or model controls.
- Describe visible events in temporal order and give each action a result.
- State subject/object/camera spatial relationships when interaction or geometry
  matters.
- Use one primary camera intent per range; cuts must reveal new information.
- Preserve exact user dialogue, lyrics, visible copy, labels, and legal lines.
- Separate dialogue, ambience, physical effects, diegetic music, and
  audience-only score.
- Use white-model references to preserve solved space/camera/action while
  changing surface and light; use green-screen references for isolated motion or
  performance transfer.
- Treat a storyboard as ordered shot logic, not a style collage.
- For factual or regulated work, generated visuals illustrate approved sources;
  they do not become evidence.
- Never put unverified provider limits or unsupported parameters into the prompt.

## Output Contract

Return:

1. **Creative intent** and primary acceptance criterion.
2. **Confirmed setup** — duration, destination/aspect when known, mode, locks.
3. **Reference Role Map** — every source in confirmed order and its authority.
4. **Timeline** — complete contiguous ranges.
5. **Final Seedance 2.5 prompt** — one exact prompt, not several competing drafts.
6. **Review checklist** — observable reference, continuity, truth, and delivery
   checks.
7. **Controlled retry** — one variable or local region to change.

For direct generation, hand the exact prompt and pack to runtime. For diagnosis,
name the visible failure, likely causal instruction, smallest local repair,
preserve list, and one retry variable.

## Quality Bar

- Protect full compatible reference coverage; use roles and priorities to make a
  rich pack legible, not to prune needed visual evidence.
- Make reference authority, event order, and ending state explicit.
- Use a storyboard, blockout, or motion source when words cannot control the
  spatial or temporal problem.
- Keep product, identity, copy, evidence, rights, safety, and geometry source-owned.
- Use local repair for local failure; do not regenerate a passed sequence.
- Separate generated concept from captured gameplay, real UI, verified facts,
  architectural truth, medical instruction, or current destination conditions.
- Do not turn first-party marketing, community popularity, or a single preview
  into a DirectorX runtime or repeatability claim.