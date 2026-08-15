# 案例4：透明鼠标产品广告片 — Editorial Tech

- **等级**：L1 精简版（导演阐述式·产品类·图生视频标杆）
- **输入模态**：图生视频（image-to-video），基于 `<Picture 1>` 参考图生成
- **风格**：Editorial tech / 高端产品片 / 双色调影棚摄影
- **语言**：英文
- **时长**：3个镜头
- **字数**：~280词
- **来源**：用户提供

## 完整提示词

```text
Editorial tech product film. The transparent gaming mouse from <Picture 1> in its original scene: a pitch-black studio void with a dark, subtle reflective surface, lit by dramatic duotone vibrant blue and warm neon orange rim lighting, deep soft shadow falloff into pure black. Monochromatic dark palette with electric blue and amber accents. Material motif: glowing internal metallic micro-components and glossy acrylic refractions. The environment is constant throughout.

SHOT 1: The scene opens exactly on image 1, the mouse resting confidently on the dark surface; the blue and orange lights slowly pulse brighter, refracting deeply through the transparent acrylic shell as the camera executes a slow, deliberate push-in to reveal the intricate circuitry.

SHOT 2: Cut to an extreme macro profile of the ridged scroll wheel and layered internal micro-components; the camera glides slowly along the side as a sharp beam of warm orange light sweeps across the metallic textures, contrasting perfectly against the deep blue ambient glow.

SHOT 3: Cut to a low-angle beauty shot: the mouse levitates weightlessly a few centimeters above the dark reflective surface, rotating in a slow, precise orbit; the duotone lighting flares gently along the glassy transparent edges before fading slowly into a sleek silhouette.

Audio: deep pulsing sub-bass room tone, sharp tactile mechanical clicks, a sweeping glassy whoosh on cuts, and a rising electronic swell that resolves to near-silence on the final fade.
```

## 关键特征分析

1. **"参考图锚定 + 环境恒定"范式**：`in its original scene` + `The environment is constant throughout` —— 一句话锁定参考图来源并禁止环境漂移，产品片防崩坏核心技巧
2. **材质母题（Material motif）**：`glowing internal metallic micro-components and glossy acrylic refractions` —— 全片所有镜头围绕这一材质特征反复表现，相当于 L2"视觉母题变形链"在写实产品片中的等价物
3. **镜头语言极度精确**：每个 shot 都有明确运镜动词（push-in / glides along / rotating in a slow orbit）+ 机位（extreme macro profile / low-angle beauty shot）
4. **双色调光影作为风格身份**：`duotone vibrant blue and warm neon orange rim lighting` 贯穿全片，是产品高级感来源
5. **音频分层 + 收束设计**：deep pulsing sub-bass / sharp tactile clicks / sweeping glassy whoosh / rising electronic swell that resolves to near-silence —— 典型"音频与画面双轨道"设计