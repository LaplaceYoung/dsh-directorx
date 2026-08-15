# 惊艳增强词库 (Enhancement Vocabulary)

本文件是 Step 4「惊艳增强版」的核心资产。每个方向给一段可直接嵌入提示词的专业词块
（英文为主，便于视频模型识别）。用法：根据 Step 2 选的方向，取对应词块叠加到还原版；
可组合（如"电影感 + 胶片味"）。**视频增强务必同时叠加「运动设计词块」与「视频专属负向词库」**（见下）。

## 通用增强基底（任何方向都可加）
- 画质：`8k resolution, ultra-detailed, professional cinematography`
- 镜头：`shot on 85mm f/1.4, creamy bokeh, shallow depth of field`
- 后期：`subtle film grain, fine detail, color graded, 24fps film look`
- 运动基底：`smooth camera movement, stable continuity, realistic physics`

## 1. 电影大片感 (Cinematic)
anamorphic widescreen lens, teal-and-orange color grade, dramatic chiaroscuro lighting,
volumetric haze, shallow depth of field, cinematic composition, blockbuster mood,
subtle lens flare, Rembrandt lighting, slow dolly-in

## 2. 低调奢华 (Low-key Luxury)
low-key lighting, deep shadows, black background with gold rim light, mysterious mood,
single hard light source, high contrast, luxurious texture, editorial elegance

## 3. 纪实纪录片 (Documentary)
35mm documentary photography, available light, candid moment, desaturated realistic
tones, unretouched authenticity, photojournalism style, handheld realism

## 4. 日系自然光 (Japanese Natural)
soft daylight, airy and light, fuji pro 400h pastel tones, lifestyle candid, clean
minimal, gentle shadow, film-like, slow gentle pan

## 5. 赛博朋克 (Cyberpunk)
neon signs, rain reflections, magenta-cyan contrast, volumetric fog, wet street,
high contrast, futuristic city, glowing rim light, neon-lit tracking shot

## 6. 国风东方 (Oriental / GuoFeng)
ink wash aesthetic, traditional low-saturation palette, poetic composition, classical
Chinese elements, misty mountains, elegant restraint, rice paper texture, slow dolly

## 7. 动漫二次元 (Anime)
vibrant saturation, cel shading, key visual style, clean lineart, dynamic pose,
anime studio look, glowing eyes, fluid motion

## 8. 梦幻氛围 (Dreamy)
soft glow, bokeh light spots, thin atmospheric haze, pastel tones, ethereal and
airy, dreamlike luminosity, gentle vignette, slow float

## 9. 蒸汽波 (Vaporwave)
pink-purple gradient, retro 80s grid, glitch elements, neon sunset, nostalgic synthwave,
chrome text, time-lapse shimmer

## 10. 超写实产品级 (Hyper-real Product)
macro photography, razor-sharp focus, studio sweep light, reflective highlight,
commercial product shot, 8k detail, clean background, 360 orbit

## 11. 史诗奇幻 (Epic Fantasy)
large scale, god rays, misty atmosphere, UE5 render quality, dramatic sky, heroic
lighting, fantastical environment, volumetric light, crane shot

## 12. 胶片复古 (Film Vintage)
Kodak Portra 400 film emulation, soft halation around highlights, fine film grain,
slightly faded colors, 35mm analog look, nostalgic warmth, Cinestill 800T for night

## 13. 杂志商业高级 (Editorial Commercial)
clean studio backdrop, soft even light, low saturation, premium material texture,
generous negative space, fashion magazine cover mood, refined retouching

## 14. 暗黑戏剧 (Dark Cinematic / Noir)
high contrast, deep shadows, single source key light, noir mood, venetian blind
shadows, rain-slicked streets, tense atmosphere, low-angle shot

## ★ 导演风格预设（可选增强，由 Step 2 用户开启）

把"方向"升级为"可被模型识别的作者语言"。用法：取对应预设词块叠加。

- **韦斯·安德森对称 (Wes Anderson symmetry)**：centered symmetrical composition, pastel
  palette, deadpan mood, dollhouse framing, whip-pan transitions, meticulous set design
- **赛博霓虹黑帮 (Cyber noir)**：rain-soaked neon alley, trench coat silhouette,
  magenta-cyan grade, volumetric fog, low-angle tracking, smoky backlight
- **王家卫抽帧色调 (Wong Kar-wai)**：slow-motion, lush saturated color, neon bokeh,
  intimate close-up, nostalgic mood, shallow focus, film grain, temporal drift
- **诺兰实拍史诗 (Nolan practical epic)**：IMAX anamorphic, practical effects,
  grounded realism, sweeping crane, tense pacing, muted desaturated grade
- **新海诚光线 (Shinkai light)**：god-ray light through clouds, luminous sky,
  hyper-detailed background, emotional soft focus, vivid blue-orange
- **塔可夫斯基长镜 (Tarkovsky long-take)**：single unbroken take, slow drift,
  natural light, contemplative, water/stone/fire elemental motifs

> 可自行扩展：把喜欢的导演风格拆成"构图 + 色彩 + 运镜 + 节奏 + 颗粒"五要素写入此处。

## ★ 视频专属负向词库 (Video Negative Prompts)

**图像负向词（deformed hands / blurry 等）完全覆盖不了视频独有的翻车模式。**
以下词库直接决定"成片像电影还是像鬼片"，必须叠加：

**通用视频 Universal Video**
no morphing, no flickering, no jitter, no melting, no warping, no temporal distortion,
no extra limbs, no deformed anatomy, no blurry, no low quality, no watermark, no text overlay

**运动/时序 Motion**
no shaky camera (unless intended), no abrupt cuts, no frozen frames, no speed glitch,
no reverse motion error, no sliding/scrolling fake motion

**人物真实感 Identity**
no identity drift, no face changing between frames, no inconsistent costume,
no age/gender shift, no duplicate subject

**文字/语义 Text/Semantic**
no text drift, no garbled subtitles, no wrong spelling, no random signs morphing

**音频（支持音频的模型）Audio**
no out-of-sync audio, no mismatched lip-sync, no abrupt sound cut, no silence gap,
no overlapping noise (unless intended)

> 负向用法：多数平台支持独立 negative 字段或 "--no"；Veo 用自然语言 "Avoid ..."；
> 通义万相用"无台词/无背景音乐"控制。详见 `platform-guides.md`。

## 组合示例 (Combinations)
- 电影感 + 胶片味：`anamorphic widescreen, teal-orange grade, Kodak Portra 400 emulation, soft halation, fine grain, slow dolly-in`
- 商业高级 + 低调奢华：`clean studio, low-key, black background gold rim, premium texture, generous negative space, stable orbit`
- 赛博朋克 + 导演预设：`neon-lit tracking shot, magenta-cyan grade, trench coat silhouette, volumetric fog, cyber noir mood`
- 国风 + 梦幻：`ink wash, misty mountains, slow dolly, pastel haze, ethereal, gentle vignette`

## 音频增强词块（条件块：目标模型支持音频时叠加，见 platform-guides）

- **人声 Voice**：`[character] saying "[line]" in [calm/nervous/enthusiastic] tone, [accent]`
- **音效 SFX**：`[material] [action] sound, [environment acoustics: reverberant/dry/indoor]`
- **配乐 BGM**：`[genre] background music, [mood: triumphant/melancholic/tense], matching scene pacing`
- **静默 Quiet**：`near silence, only subtle [page turn / clock tick]`
- **无音频开关**：通义万相 `无台词 / No dialogue.` `无背景音乐 / No background music.`；Veo 默认带音频，要静音需显式说 "silent / no audio"。