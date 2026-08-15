# Prompt Engineering Rules — Complete Reference

Full vocabulary tables, structural formats, identity lock system, lighting categories, camera specs, quality stacks, and template syntax for the nanobanana-prompt-master skill.

## 8 Dimensions — Complete Specifications

### Dimension 1: Subject

The subject is the identity anchor. Everything else in the prompt serves the subject.

**Person vocabulary:**
- Gender: `woman`, `man`, `person` (use non-gendered when unspecified)
- Age: `in their early/mid/late [20s/30s/40s/50s]`, `young`, `middle-aged`
- Ethnicity: specify when relevant to authenticity of the image (`East Asian`, `South Asian`, `Black`, `Latina`, `Mediterranean`, etc.)
- Key traits: `sharp jawline`, `soft features`, `strong brow`, `high cheekbones`, `freckled`, `textured natural hair`, `close-cropped hair`, `long dark locs`
- Expression: `confident smirk`, `relaxed neutral`, `mid-laugh`, `contemplative`, `stoic`, `warmly approachable`

**Product vocabulary:**
- Material: `amber glass`, `matte black metal`, `brushed aluminum`, `recycled kraft paper`, `recycled plastic`, `frosted glass`, `clear PET`
- Color: never generic — use `warm ecru`, `deep forest green`, `dusty rose`, `slate blue-grey`, `warm sand`, `off-white`
- Finish: `matte`, `gloss`, `satin`, `raw`, `etched`, `embossed`, `foil-stamped`
- Scale signal: `palm-sized`, `full-height`, `miniature`, `larger than life`

**Abstract/concept subjects:**
- Use visual metaphor: not "success" but "a single illuminated door at the end of a dark corridor"
- Ground in physical: not "loneliness" but "a single chair facing a rain-streaked window at dusk"

### Dimension 2: Clothing / Accessories

**Pattern:**
```
wearing [garment] in [specific color], [fabric], [fit], [detail]
```

**Garment vocabulary:**
- Tops: `oversized linen blazer`, `fitted ribbed turtleneck`, `cropped cotton tee`, `sheer organza blouse`, `technical quarter-zip`
- Bottoms: `wide-leg trousers in stone grey`, `slim dark-wash denim`, `flowing midi skirt`, `tailored charcoal trousers`
- Outerwear: `long trench coat in camel wool`, `puffer vest in sage green`, `structured leather jacket`
- Accessories: `small gold hoop earrings`, `minimalist watch`, `no visible jewelry`, `single signet ring`

**Color naming precision:**
| Generic (avoid) | Precise (use) |
|-----------------|---------------|
| light blue | dusty cornflower blue, pale cerulean, slate |
| dark green | deep forest green, hunter green, pine |
| off-white | warm ecru, bone, ivory, cream |
| red | brick red, burgundy, scarlet, vermillion |
| grey | warm heather grey, cool ash grey, slate |
| brown | camel, cognac, warm espresso, terracotta |

### Dimension 3: Pose

**Pattern:**
```
[body orientation], [arm/hand position], [gaze direction], [energy note]
```

**Body orientation:**
- `facing camera directly, slight chin down`
- `three-quarter turn left/right`
- `profile, 90-degree side view`
- `back to camera, looking over shoulder`
- `overhead, birds-eye, top-down`
- `low angle, looking up at subject`

**Hand/arm positions:**
- `hands loosely in pockets`
- `arms crossed, relaxed not defensive`
- `one hand raised, fingers spread`
- `hands clasped in lap`
- `holding [specific object] in both hands`
- `arms at sides, relaxed`
- `one arm extended, hand on surface`

**Gaze:**
- `direct eye contact with camera`
- `looking off-frame left/right`
- `downward glance, eyes soft`
- `eyes closed, inward moment`
- `looking up at 45 degrees, aspirational`

**Energy descriptors:**
- `relaxed, unhurried confidence`
- `quiet intensity`
- `playful, mid-movement energy`
- `stoic, measured presence`
- `warmly engaged, leaning in slightly`

### Dimension 4: Environment — Detail Levels

| Level | When to use | Key descriptors |
|-------|-------------|-----------------|
| **Minimal** | Product shots, avatars, profile images | `clean backdrop`, `seamless white background`, `gradient grey backdrop`, `solid [color] background` |
| **Contextual** | Social posts, lifestyle content | `implied [environment], out-of-focus`, `environmental hints in background`, `window light suggesting [space]` |
| **Cinematic** | Brand campaigns, editorial, hero shots | Full scene description with foreground, midground, background; time of day; architectural details |

**Contextual environment vocabulary:**
- `sun-drenched studio apartment, morning light from window left`
- `modern kitchen counter, marble surface, partially visible`
- `outdoor park bench, dappled light through leaf canopy`
- `coffee shop interior, warm ambient light, blurred patrons behind`

**Cinematic environment vocabulary:**
- `modernist concrete rooftop at dusk, city lights beginning to flicker`
- `empty hotel corridor, warm sconce lighting, subtle perspective geometry`
- `dense forest clearing, shafts of late afternoon light through canopy`
- `desert highway at magic hour, heat shimmer on asphalt`

### Dimension 5: Lighting — 12 Named Setups

**Rule: Pick ONE dominant setup. Do not blend setups.**

| # | Name | Prompt phrase | Color temp | Best for |
|---|------|--------------|------------|---------|
| 1 | Natural window | `soft natural window light from [left/right], warm diffused fill from opposite` | Warm/neutral | Organic, lifestyle, wellness |
| 2 | Golden hour | `golden hour backlight, warm amber sun flare, long horizontal shadows` | Very warm | Outdoor, emotional, beauty |
| 3 | Studio softbox | `studio softbox [left/right/overhead], even fill, soft shadow on opposite side` | Neutral/cool | Product, e-commerce, beauty |
| 4 | Rembrandt | `Rembrandt lighting, triangular highlight on cheek, deep dramatic shadow opposite` | Neutral | Portrait, premium, character |
| 5 | Split | `split lighting, 50/50 light-shadow division, hard light source, high contrast` | Neutral/cool | Editorial, bold ads |
| 6 | Butterfly/Paramount | `butterfly lighting, highlight under eye sockets, glamour shadow below chin` | Warm/neutral | Fashion, beauty, editorial |
| 7 | Ring light | `ring light, catchlight circles in eyes, even frontal illumination, no side shadow` | Neutral/cool | UGC, social content, beauty |
| 8 | Neon/colored | `[color] neon accent light, colored rim, moody atmospheric fill, practical light source visible` | Colored | Tech, nightlife, Gen Z |
| 9 | Backlit/silhouette | `strong backlight from behind, partial silhouette, rim light halo effect, flare at edges` | Warm | Reveals, aspirational, mysterious |
| 10 | Overcast diffused | `overcast sky diffusion, flat even light, soft shadows with no hard edges, neutral tones` | Cool/neutral | Editorial, documentary |
| 11 | Chiaroscuro | `dramatic chiaroscuro, 80% deep shadow, single hard light source, baroque contrast` | Neutral/warm | Luxury, mystery, art direction |
| 12 | Film stock | `shot on [film stock], [color characteristics of that stock], natural grain present` | Stock-dependent | Organic, editorial, authentic |

**Film stock color shorthand:**
- `Kodak Portra 400` → warm skin tones, slightly desaturated greens, lifted blacks
- `Fujifilm Superia 400` → cool, neutral, sharp contrast, accurate greens
- `Kodak Gold 200` → warm vintage, elevated contrast, slight orange cast in shadows
- `Kodak Vision3` → cinematic digital-cinema color science, clean neutrals
- `Ilford HP5` → high-contrast B&W, moderate grain, classic street photography feel
- `Fujifilm Velvia 50` → saturated, punchy, landscape-oriented color rendition

### Dimension 6: Camera / Lens

**Focal length decision table:**

| Focal length | Visual character | Primary use | Prompt phrase |
|-------------|-----------------|-------------|--------------|
| 16-24mm | Wide, distortion, context-heavy | Architecture, environment | `16mm ultra-wide, strong environmental context, slight barrel distortion at edges` |
| 35mm | Natural, slight wide, street | Lifestyle, documentary | `35mm f/2, natural perspective, slight environmental context, documentary feel` |
| 50mm | Most natural to human eye | Versatile, editorial | `50mm f/1.8, natural human perspective, sharp subject with slight background separation` |
| 85mm | Flattering compression, bokeh | Portrait, beauty | `85mm f/1.4, shallow depth of field, creamy background bokeh, flattering facial compression` |
| 135mm | Strong compression, fashion | Fashion, editorial | `135mm f/2, strong foreground-background compression, fashion editorial separation` |
| 200mm+ | Extreme compression, telephoto | Sports, wildlife, candid | `200mm telephoto, extreme background compression, subject isolation` |
| Macro | 1:1 reproduction, extreme detail | Product detail, texture | `100mm macro f/8, 1:1 reproduction, extreme close-up, every surface texture rendered` |

**Aperture effects:**
- `f/1.2–f/1.8` → maximum bokeh, very shallow focus
- `f/2–f/2.8` → clear subject with pleasing background blur
- `f/4` → slight background separation, most details in focus
- `f/8–f/11` → maximum sharpness front to back, product/architecture standard

### Dimension 7: Style / Art Direction

Use visual genre language, not emotional adjectives.

**Photography styles:**
- `editorial fashion photography, high fashion negative space, muted desaturated palette`
- `DTC lifestyle brand aesthetic, clean and airy, white space emphasis, Glossier/Aesop visual language`
- `documentary realism, available light only, unposed candid energy, 35mm grain`
- `luxury brand photography, Bottega Veneta/Loro Piana reference, tactile material emphasis`
- `beauty brand editorial, skin texture celebration, macro detail emphasis, warm skin-forward tones`

**Illustration styles:**
- `flat design illustration, geometric shapes, limited 4-color palette, Scandinavian minimal`
- `anime illustration, cel shading, expressive proportions, clean line art`
- `watercolor editorial, soft wash textures, loose gestural marks, editorial illustration feel`
- `isometric technical illustration, clean vector lines, blueprint color palette`
- `3D render, cinema-quality lighting, hyperrealistic materials, product visualization standard`

**Social/UGC styles:**
- `TikTok-native UGC, imperfect natural framing, authentic unposed, relatable everyday setting`
- `Instagram lifestyle, aspirational but approachable, warm tones, natural light preference`
- `Pinterest aesthetic, styled flat lay, artful arrangement, muted coordinated palette`

### Dimension 8: Negatives

**Structure:**
```
Negative: [list of 3-6 specific undesired elements]
```

**Standard quality stack (always include):**
```
blurry, low resolution, watermark, text overlay, overexposed highlights, crushed shadows
```

**Anti-AI signals (photorealistic work):**
```
AI skin texture, plastic synthetic skin, uncanny valley face, overly symmetrical features, hollow dead eyes, synthetic hair strand clumping
```

**Person-specific:**
```
extra fingers, fused hands, floating disconnected limbs, morphed body proportions, unnatural joint positions
```

**Product-specific:**
```
wrinkled backdrop, shadow on product label face, distorted label text, missing product details, incorrect color reproduction
```

**Fashion-specific:**
```
unflattering angle, poor garment fit, visible styling pins, wardrobe malfunction, unnatural fabric drape
```

**Combined example (person + quality):**
```
Negative: blurry, watermark, AI skin texture, extra fingers, fused hands, overexposed, text overlay
```

## Structural Formats — Decision Guide

### When to use each format:

| Format | Use when | Complexity |
|--------|----------|------------|
| Simple Prose | Fast iteration, single concept | Low |
| Comma-separated | Library-style, dense descriptors | Low-Medium |
| JSON object | Structured systems, reuse, hand-off | Medium |
| Nested generation_request | Complex multi-layer scenes, advanced | High |
| Template with arguments | Reusable prompts, batch generation | Medium |

## the_vibe Sub-Object

The `the_vibe` field in nested format captures gestalt mood in one plain-language sentence. It is not a description of what is in the image — it is how the image should *feel*.

**Pattern:**
```
"the_vibe": "Like [relatable analogy] — [adjective], [adjective], and [adjective]."
```

**Examples:**
- `"the_vibe": "Like a Sunday morning before the world wakes up — unhurried, golden, and private."`
- `"the_vibe": "Like walking into a Michelin-starred restaurant in your best outfit — earned, elevated, and effortlessly cool."`
- `"the_vibe": "Like receiving a handwritten letter — deliberate, warm, and impossible to rush."`
- `"the_vibe": "Like the first three seconds of a banger dropping — electric, inevitable, and built to be felt."`

## Template Argument Syntax

For reusable prompt templates, use this argument syntax:

```
{argument name="field_name" default="fallback_value"}
```

**Example reusable portrait template:**
```
{argument name="subject" default="professional woman in her 30s"}, wearing {argument name="outfit" default="oversized linen blazer in warm ecru"}, {argument name="pose" default="three-quarter turn to camera, direct eye contact"}, in {argument name="setting" default="minimal studio backdrop, warm grey"}, lit by {argument name="lighting" default="soft natural window light from left"}, shot on {argument name="camera" default="85mm f/1.4, shallow depth of field"}. Style: {argument name="style" default="editorial fashion, clean and composed"}. Negative: blurry, AI skin, extra fingers, watermark.
```

**Example reusable product template:**
```
{argument name="product" default="amber glass dropper bottle"} on {argument name="surface" default="warm marble surface"}, {argument name="lighting" default="studio softbox from left, even fill"}, {argument name="props" default="no props, product alone"}, shot on {argument name="camera" default="100mm macro, f/8"}, {argument name="style" default="luxury e-commerce, white balance neutral"}. Negative: {argument name="negatives" default="blurry, distorted label, shadow on face of product"}.
```

## Quality Modifier Stacks

Append one of these to any prompt to boost overall output quality:

**Photorealistic standard:**
```
sharp focus, professional photography, high dynamic range, award-winning photography
```

**Editorial premium:**
```
published in Vogue/Harper's Bazaar, editorial quality, masterful composition
```

**E-commerce standard:**
```
professional product photography, commercial quality, ready for Amazon/Shopify listing
```

**Social-native:**
```
viral-ready composition, native social media quality, thumb-stopping visual hierarchy
```

**Illustration premium:**
```
professional illustration, gallery quality, cohesive style, clean execution
```