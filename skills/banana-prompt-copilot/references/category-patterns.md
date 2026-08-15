# Category-Specific Patterns — Complete Reference

11 category architectures, 10 cross-category universal techniques, and aspect ratio conventions.

## Category 1: Social Media Post

**Primary use cases:** Instagram feed, TikTok thumbnail, Twitter/X card, Facebook post, Reels cover

**Dominant prompt patterns:**
- Single strong visual subject — person, product, or scene
- Composition leaves negative space for caption text (bottom 25% or left/right third)
- High contrast foreground/background separation for mobile scroll-stop
- Platform-native aspect ratios (see aspect ratio table)

**Structural format:**
```
[subject descriptor], [lifestyle context], [lighting setup], [camera spec], [platform-native composition], [platform] aesthetic. Negative: [negatives].
```

**Critical composition rules:**
- `rule of thirds — subject positioned at left intersection, open space right`
- `centered composition, symmetric — works for single hero subject`
- `off-center, environmental context visible — lifestyle storytelling`
- `bottom negative space for text overlay — 25% bottom clear`

**Style vocabulary:**
- Instagram feed: `warm tones, natural light, aspirational but approachable`
- TikTok: `high contrast, saturated, dynamic energy, native authentic feel`
- Pinterest: `muted coordinated palette, styled editorial, white space dominant`
- Facebook: `familiar, relatable, bright and clear`

**Aspect ratio:** 1:1 (square) for feed, 9:16 (vertical) for Stories/Reels/TikTok, 16:9 for Twitter/YouTube

## Category 2: Product Marketing

**Primary use cases:** Ad creatives, promotional banners, email headers, paid social ads

**Dominant prompt patterns:**
- Product as hero — must be recognizable and desirable
- Supporting context builds brand world (lifestyle elements, textures, colors)
- Urgency or offer implied by composition (space for overlay text)
- Strong CTA readability implied by composition

**Structural format:**
```
[product] in [context/setting], [lighting for product hero], [brand style direction], commercial marketing photography, [camera spec], clear product visibility, [offer space note]. Negative: [negatives].
```

**Marketing angle vocabulary:**
- `problem-solution framing — product emerges from pain context`
- `aspirational lifestyle — product integrated into aspirational scene`
- `hero isolation — product solo against premium background`
- `comparison context — product elevated against inferior alternative implied`
- `social proof backdrop — crowd, community, movement implied`

**Style vocabulary:**
- DTC brand: `clean and airy, Aesop/Glossier visual language, white space dominant`
- Supplement/health: `clinical trust signals, clean white, ingredient ingredients visible`
- Fashion/apparel: `lifestyle first, product secondary, model as context`
- Tech: `minimal, precision, materials close-up, dark backgrounds`

## Category 3: Profile / Avatar

**Primary use cases:** LinkedIn headshots, Twitter/X profile photos, TikTok profile, brand mascots, professional headshots

**Dominant prompt patterns:**
- Subject fills 60-75% of frame
- Clean, uncluttered background (solid or very soft blur)
- Eye contact with camera (direct gaze builds trust)
- Face clearly lit — no dramatic shadows obscuring identity

**Structural format:**
```
[person descriptor] professional headshot, [camera spec], [lighting: studio softbox or natural window], direct eye contact, [expression], [clothing], clean [background type], sharp facial detail. Negative: blurry, AI skin texture, extra fingers, watermark.
```

**Avatar type patterns:**
- **Professional headshot:** `85mm f/1.4, studio softbox left, confident smile, business casual attire, gradient grey background`
- **Creative/brand avatar:** `50mm f/2, natural window light, slight casual styling, solid [brand color] background`
- **Illustrated avatar:** `flat design illustration, geometric style, [ethnicity descriptor] character, [brand colors]`
- **Brand mascot:** `3D render, character design, [personality], clean white background, front-facing, commercial quality`

**Identity lock:** Use Level 7 or 9 (`strong identity preservation, consistent facial features`) for multi-image avatar sets.

## Category 4: E-commerce Main Image

**Primary use cases:** Amazon, Shopify, Etsy, TikTok Shop listing images, marketplace primary listings

**Dominant prompt patterns:**
- Pure white background (marketplace requirement for most platforms)
- Product fills 85% of frame
- Multiple angles implied (generate 3-5 separate shots, not one)
- All product features visible from primary angle

**Structural format:**
```
[product] on pure white seamless background, even studio lighting, no shadows on background, product clearly separated, Amazon product photography standard, 100mm macro f/8, all product details sharp. Negative: blurry, shadow on background, watermark, distorted label.
```

**Critical rules:**
- Always specify `pure white, no grey cast on background`
- Always specify `product clearly separated, defined edges` (prevents edge blending)
- For bottles/packaging: `slight 3/4 angle, label facing camera`
- For apparel: use ghost mannequin technique (Technique 1 from product-photography.md)
- For small products: include scale reference image as second shot

**Amazon-compliant stack:**
```
Negative: blurry, watermark, text overlay, colored background, model visible, props visible, environmental background
```

## Category 5: YouTube Thumbnail

**Primary use cases:** YouTube videos, podcast covers, online course thumbnails, video series artwork

**Dominant prompt patterns:**
- Human face with extreme expression (curiosity, shock, excitement) — faces drive clicks
- Bold implied text placement (top or left third, clear contrast background)
- High saturation, high contrast — competes against dense YouTube grid
- Single focal point — no complex scenes at thumbnail scale

**Structural format:**
```
[person] with [expression: shocked/curious/excited/serious] expression, [lighting for dramatic face], [camera spec: 50mm or 85mm], thumbnail-optimized composition, high contrast background [color], face fills 50% of frame, bold readable negative space [right/top] for text overlay. Negative: flat expression, cluttered background, low contrast.
```

**Expression vocabulary:**
- `eyes wide with shock, jaw slightly dropped, hands near face`
- `pointing directly at camera, eyebrows raised, engaged expression`
- `wide genuine smile, eyes crinkled, maximum warmth`
- `skeptical sideways glance, lips pressed, evaluating`
- `caught mid-laugh, natural unposed energy`

**Background patterns:**
- `solid neon [color] background — maximum contrast, click-driving`
- `gradient from [dark] to [lighter], high saturation [color family]`
- `blurred location establishing shot, subject sharp in foreground`

**Aspect ratio:** 16:9 (1344×768) — always

## Category 6: Poster / Flyer

**Primary use cases:** Event announcements, digital flyers, promotional posters, movie/show-style artwork

**Dominant prompt patterns:**
- Cinematic composition — wide shots or dramatic portrait
- Strong typography placeholder zones (bottom strip or header)
- Dark/dramatic backgrounds support text overlay
- Hierarchy implied in composition: hero element dominates 60%+ of frame

**Structural format:**
```
[event theme or mood] poster design, [subject or scene], [dramatic lighting: chiaroscuro/backlit/colored neon], cinematic composition, 24mm wide for scene OR 85mm for portrait hero, bold visual hierarchy, [dominant color palette], professional poster design. Negative: cluttered, low contrast, busy background.
```

**Poster style vocabulary:**
- `movie poster style, dramatic composition, single hero subject, dark background, cinematic atmosphere`
- `concert/event poster, vibrant neon color accents, dark atmospheric background, energetic visual`
- `luxury event invitation, muted elegant palette, single hero element, generous white space`
- `tech conference poster, minimal geometric, corporate palette, clean hierarchy`

## Category 7: Infographic / Educational Visual

**Primary use cases:** Data visualization, explainer graphics, educational content, social infographics

**Dominant prompt patterns:**
- Information hierarchy must be visually self-evident
- Visual metaphors replace raw data (charts, icons, process flows)
- Consistent icon/illustration style throughout
- Color coding for categorization

**Structural format:**
```
[topic] educational visual, [style: flat design illustration/isometric/minimal], [color palette], clear visual hierarchy, [number] key sections with visual separation, informational layout, professional infographic design. Negative: cluttered, inconsistent style, illegible at small size.
```

**Infographic style vocabulary:**
- `flat design icons, limited color palette (3-4 colors), white background, clean section breaks`
- `isometric illustration, technical precision, blueprint-style color palette, detail-rich`
- `bold typographic hierarchy, minimal illustration, data visualization emphasis`
- `watercolor editorial illustration, organic shapes, educational tone, warm palette`

**Composition patterns:**
- `vertical scroll layout — mobile-optimized, single column`
- `2x2 grid — four concepts, equal visual weight`
- `horizontal timeline — process or chronological flow`
- `radial/sunburst — central concept with radiating sub-concepts`

## Category 8: Game Asset

**Primary use cases:** Game characters, UI elements, item sprites, environment concepts, card art

**Dominant prompt patterns:**
- High-fidelity 3D render OR crisp 2D illustration (never mixed in same prompt)
- Character design: clear silhouette, readable at small sizes
- Asset backgrounds: transparent (describe white background, remove in post) or environment context
- Consistent art style across asset families

**Structural format:**
```
[character/item/environment description] game asset, [art style: 3D render/anime/pixel art/concept art], [lighting for the game world], clean white background [if sprite] OR [game environment context], game-ready design, detailed and sharp. Negative: blurry, inconsistent style, noisy background [if sprite].
```

**Game art style vocabulary:**
- `AAA 3D game character concept, photorealistic render, dramatic cinematic lighting`
- `anime illustration style, cel shading, clean outlines, expressive character design`
- `pixel art sprite, 16-bit style, limited color palette, crisp pixel edges`
- `mobile game asset, bright colors, thick outlines, clean readable silhouette`
- `fantasy card art, detailed painterly illustration, epic dramatic lighting`

## Category 9: Comic / Storyboard

**Primary use cases:** Comic book panels, manga pages, storyboard frames, motion comic art, graphic novel panels

**Dominant prompt patterns:**
- Panel-level storytelling — single moment captured at maximum drama
- Character consistency: same character must look identical across panels
- Action lines, speed effects, and visual storytelling signals
- Genre-specific visual language (Western comic vs. manga vs. webtoon)

**Structural format:**
```
[character] in [moment/action], [comic style: Western comic/manga/webtoon], dynamic panel composition, [dramatic angle: low angle/birds-eye/close-up], [emotion/action signal], high contrast inking, [color style: full color/black and white/limited palette]. Negative: inconsistent character proportions, messy lines, unclear action.
```

**Comic style vocabulary:**
- `Western superhero comic, bold inking, dynamic perspective, flat cell colors, dramatic shadow`
- `manga panel, expressive proportions, speed lines, large eyes, black and white high contrast`
- `webtoon vertical panel, soft coloring, modern clean linework, slice-of-life proportions`
- `graphic novel, muted palette, realistic proportions, literary panel composition`
- `motion comic frame, cinematic angle, digital coloring, action-frozen moment`

## Category 10: App / Web Design

**Primary use cases:** App store screenshots, landing page hero images, UI mockups, web design previews, SaaS marketing visuals

**Dominant prompt patterns:**
- Device frame integration (phone, laptop, tablet) OR frameless UI
- Interface visible and readable at display size
- Dark mode OR light mode — never mix in single image
- Marketing angle: show the benefit, not just the UI

**Structural format:**
```
[product name] [device: iPhone mockup/laptop mockup/web browser] UI screenshot, [dark/light mode], modern interface design, clean typography, [color palette], hero [feature/screen] visible, professional app marketing visual. Negative: blurry UI text, inconsistent spacing, cluttered interface.
```

**Device mockup vocabulary:**
- `iPhone 15 Pro product mockup, clean minimal frame, [angle: front-facing/slight tilt]`
- `MacBook Pro mockup, open lid at slight angle, professional clean desk context`
- `iPad Pro landscape mockup, app UI visible, minimal context`
- `browser window mockup, website visible, no device frame, pure UI`
- `multi-device spread — phone + laptop + tablet, consistent brand UI across devices`

## Category 11: Others (Uncategorized / Abstract)

**Primary use cases:** Abstract art, conceptual imagery, texture packs, pattern tiles, wallpapers, mood boards

**Dominant prompt patterns:**
- Concept-first: the feeling or idea drives all technical choices
- Color palette IS the subject in abstract work
- Texture and material quality are the content
- Minimal narrative — pure visual

**Structural format:**
```
[abstract concept or mood], [color palette], [dominant texture/material/form], [lighting to enhance the mood], [style: abstract painting/digital art/photorealistic texture], [composition: geometric/organic/flowing/chaotic], high quality render. Negative: cluttered, muddy colors, inconsistent style.
```

**Abstract vocabulary:**
- `fluid gradient forms, [color A] into [color B], organic flowing shapes, digital art`
- `geometric pattern tile, repeating structure, [limited palette], graphic design ready`
- `macro texture close-up, [material: concrete/marble/fabric/metal], studio lighting`
- `minimalist abstract, negative space dominant, single [shape/color/line], meditative`
- `moody atmospheric landscape, [weather/light condition], painterly, editorial abstract`

## 10 Cross-Category Universal Techniques

These apply across ALL 11 categories. Use them regardless of category.

### Technique U1: Text Placeholder Composition
When the final image will have text overlaid, build text space into the prompt:
```
[negative space]: clear left third for headline text, [background: soft or blurred], subject positioned right
```
Always specify WHERE the text will go: `top left`, `bottom strip`, `right third`, `centered overlay`.

### Technique U2: Brand Color Anchoring
When images must match a brand palette, anchor colors explicitly at subject AND background level:
```
[primary brand color] as dominant background tone, [secondary color] as accent, [product/subject] in brand-consistent [material/finish]
```
Use the full hex shorthand vocabulary from Dimension 2 — never generic color names.

### Technique U3: Batch Consistency System
For generating multiple images in the same visual family:
1. Write one base prompt with all shared dimensions
2. Create a variation matrix: change ONE dimension per variant (lighting OR color OR angle — never multiple)
3. Add: `[Variant A: natural window light] / [Variant B: studio softbox] / [Variant C: golden hour]`
4. Lock: subject + environment + style — only vary the one listed dimension

### Technique U4: Scale-to-Context Matching
Match image complexity to intended display size:
- **Tiny/icon** (under 50px display): `clean silhouette, flat design, 2-color maximum, no fine detail`
- **Mobile feed** (375px display): `strong contrast, simple composition, one focal point maximum`
- **Desktop hero** (1440px+ display): `full detail, complex environment, multiple focal points allowed`
- **Print** (300 DPI): `maximum resolution vocabulary, sharp edges, no motion blur`

### Technique U5: Platform-Native Aesthetic Matching
Each platform has a dominant aesthetic. Match it explicitly:
- Instagram: `warm tones, natural light, aspirational authenticity`
- TikTok: `high energy, saturated, raw authenticity OR trend-aware styling`
- LinkedIn: `professional credibility signals, clean, achievement-forward`
- Pinterest: `editorial styled, muted coordinated palette, aspirational lifestyle`
- YouTube: `high contrast, clickable emotion, face-forward`
- Amazon: `clinical product isolation, pure white, multi-angle systematic`

### Technique U6: Mood-First Engineering
Start with `the_vibe` (gestalt mood) and reverse-engineer technical specs to match:
1. Write the vibe: `"Like a quiet Saturday morning before anyone wakes up — soft, unhurried, and private."`
2. Derive lighting: soft diffused, warm, natural window — not studio, not dramatic
3. Derive color: warm neutrals, lifted shadows, low contrast
4. Derive camera: 50mm f/2.8, shallow focus — intimate
5. Build prompt in that order — mood anchors every decision

### Technique U7: Identity Lock Consistency Check
For multi-image sequences or brand campaigns where a person appears repeatedly:
- Set identity lock at Level 7+ in first prompt
- Include a `[reference descriptor]` in every subsequent prompt
- After generation, verify before proceeding: are eyes/face/hair consistent?
- If inconsistent: increase lock level, add more physical descriptor specificity
- Never exceed Level 11 for photorealistic (uncanny valley risk at over-specification)

### Technique U8: Negative Prompt Stacking
Build negatives in layers — always include all three applicable stacks:
1. **Universal quality stack:** `blurry, low resolution, watermark, text overlay, overexposed, crushed shadows`
2. **Anti-AI stack (photorealistic):** `AI skin texture, plastic skin, uncanny valley, overly perfect symmetry, hollow dead eyes`
3. **Category-specific stack:** (select from category patterns above)

Never exceed 6 total negatives — diminishing returns + model confusion above 6.

### Technique U9: Multi-Shot Campaign Planning
Before generating any campaign image, map the full shot list first:
```
Shot 1: [hero image — most important, most polished]
Shot 2: [detail/close-up — shows quality signals]
Shot 3: [lifestyle/in-use — shows benefit in context]
Shot 4: [social proof signal — person/community/scale]
Shot 5: [CTA composition — text-ready, offer-forward]
```
Then assign aspect ratio + dimension variations per each shot based on deployment channel.

### Technique U10: Quality Gate Stack
Append this suffix to any prompt when generating a final asset (not a test):
```
sharp focus, professional photography, high dynamic range, commercial quality standard, ready for [platform] deployment
```

For editorial/luxury: `published in [Vogue/Harper's Bazaar], editorial quality, masterful composition`
For e-commerce: `professional product photography, commercial quality, ready for Amazon/Shopify listing`
For social: `viral-ready composition, native social media quality, thumb-stopping visual hierarchy`

## Aspect Ratio Conventions Table

| Use Case | Ratio | Pixel Size | Platform |
|----------|-------|------------|---------|
| Social Stories / TikTok | 9:16 | 768×1344 | TikTok, IG Stories, Reels |
| Feed post (square) | 1:1 | 1024×1024 | Instagram, Facebook, Twitter |
| Product listing (portrait) | 3:4 | 864×1184 | Amazon, Shopify, TikTok Shop |
| YouTube thumbnail | 16:9 | 1344×768 | YouTube, OGP cards |
| Fashion portrait | 2:3 | 832×1248 | Editorial, apparel |
| Landscape editorial | 4:3 | 1184×864 | Blog, email header |
| Twitter / OG card | 16:9 | 1344×768 | Twitter, Facebook link |
| Podcast cover | 1:1 | 1024×1024 | Apple Podcasts, Spotify |
| App store screenshot | 9:19.5 | use 9:16 | iOS App Store |
| Print 8.5×11 | Letter | use 3:4 | PDF, physical print |

**Size flag reference (nanobanana-mcp):**
- `9:16` → `768x1344`
- `1:1` → `1024x1024`
- `3:4` → `864x1184`
- `16:9` → `1344x768`
- `2:3` → `832x1248`
- `4:3` → `1184x864`

## Category Signal → File Mapping

When running Recommend mode, use this table to route to the correct library file:

| User signals | File to search |
|-------------|----------------|
| avatar, profile, headshot, portrait | `profile-avatar.json` |
| instagram, social, post, viral, reel, feed | `social-media-post.json` |
| infographic, data, educational, chart, explainer | `infographic-edu-visual.json` |
| thumbnail, youtube, video cover, clickbait | `youtube-thumbnail.json` |
| comic, manga, storyboard, panel, webtoon | `comic-storyboard.json` |
| product, marketing, advertisement, promo, ad creative | `product-marketing.json` |
| ecommerce, shop, listing, white background, Amazon | `ecommerce-main-image.json` |
| game, sprite, character design, asset, RPG | `game-asset.json` |
| poster, flyer, banner, announcement, event | `poster-flyer.json` |
| app, UI, website, mockup, interface, SaaS | `app-web-design.json` |
| abstract, texture, wallpaper, pattern, mood | `others.json` |