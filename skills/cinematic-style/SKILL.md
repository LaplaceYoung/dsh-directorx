---
name: cinematic-style
description: >-
  电影感风格前缀与角色/场景/分镜提示词模板。用户要电影感、胶片、跨镜头统一造型时
  先 directorx_skill_read 本技能，把前缀写进每一镜。
user-invocable: true
---

# 电影感提示词模板

风格前缀 + 角色 / 场景 / 分镜三套模板，让风格在每一个镜头里注册。

## 风格前缀

每个 prompt 复用这一句：

```
Cinematic film still, 35mm film grain, anamorphic lens flare, teal and orange color grade, shallow depth of field, volumetric lighting, shot on ARRI Alexa
```

## 角色

```
{camera} shot of {character description}, cinematic film still, {named camera}, three-point lighting with {light direction}, shallow depth of field, film grain, {style prefix}
```

- 定妆照是身份锚点：面部几何 / 发型 / 服装颜色必须清晰可读。
- 多套造型基于 Base Look（面部 + 发型不变），只换服装。

## 场景

```
{scene}, {color palette}, {material details}, {light source and direction}, cinematic composition, {style prefix}
```

- 同一场景不同镜头光影统一。

## 分镜

```
{shot size} {angle}, {camera movement}, {composition}, {focal length} lens, {style prefix}
```

- 景别递进：建立（wide）→ 发展（medium）→ 强调（CU）。
- 一个镜头一个动作，交替静态与运动。

## 负面

禁止：flat lighting, overexposed, cheap filter, video look, text watermark。长文字后期叠，不让模型写。
