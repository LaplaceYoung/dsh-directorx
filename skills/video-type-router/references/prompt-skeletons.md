# Prompt skeletons

Write the final prompt in the user's language. Bind references in text; keep the actual media attached for execution.

## Seedance 2.5 — four blocks

```text
将@图片1定义为主体1（[身份锁定句]）。将@图片2定义为场景1（[空间锁定句]）。将@音频1定义为主体1的音色。
一句话：[主体]在[地点]做[事件]，[风格]，[一个主导运镜]。
0s-4s：[景别]，[一个动作]，[一个运镜]，音频：{台词} <环境> (远处)
4s-8s：[景别]，[动作结果]，[运镜或切]，保持：主体1与场景1。
全局：光线方向与色温保持；不要字幕、水印、额外人物、换装、可读商标变形。
```

Rules: contiguous ranges, one dominant event per range, ≥3s windows when possible, exact user lines inside braces. Do not restamp Seedance 2.0 jobs with seconds — use `镜头1` / `镜头2`.

## Seedance 2.0 — shot index

```text
将@图片1定义为主体1。将@图片2定义为场景。
镜头1：中景，主体1走进来停在柱旁。镜头缓慢推进。
镜头2：近景，主体1转头。保持西装与发型。
不要：字幕、水印、第二个人。
```

## Kling 3.0 I2V — motion only

```text
Preserve identity and wardrobe from the first frame.
He takes two steps forward and grips the umbrella tighter.
Camera locked-off, chest height.
Rain continues. No extra person, no on-screen text.
```

20–40 words. Do not re-describe hair, clothes, or room.

## Kling 3.0 multi-shot

```text
Shot 1 (0-3s): Medium. @A stops at the door. Camera static.
Shot 2 (3-6s): Close-up. @A turns and says, "你认错人了." Slow push.
Shot 3 (6-9s): Over-shoulder. Rain on the alley. Hold.
Audio: rain on metal, distant tires.
Preserve @A identity and coat.
```

## Veo 3.1 — five parts + FLF

```text
Cinematography: low-angle medium close-up, 35mm, slow dolly in.
Subject: the same woman as the first frame, green jacket, wet hair.
Action: she looks into camera, inhales, then says the exact line.
Context: morning cafe, window rain, practical tungsten.
Style: photoreal, shallow focus, no on-screen text.
Transition: interpolate first frame to last frame; keep jacket and cafe geometry.
```

## H3 — do not invent fields

Use `minimax-h3-prompt-copilot` and its official three-part fields. Do not paste Seedance `【0:00-0:03】` into an H3 prompt.

## Character sheet still

```text
White background character sheet, same person in four panels:
front bust, front full body, three-quarter, side.
[age] [hair] [one identifying mark]. Neutral face, even studio light, no scenery, no text.
```

Manhua variant: clean cel shading, consistent line weight, no photoreal pores.

## Forbidden in every family

- Abstract mood with no visible behavior ("very sad")
- Readable generated legal text, formulas, HUD, damage numbers
- Public-figure face swap
- Second-person inventory of the still on I2V
- Mixing 2.0 shot-index grammar with 2.5 second stamps in one prompt
