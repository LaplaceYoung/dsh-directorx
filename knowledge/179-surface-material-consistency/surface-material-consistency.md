# AI 材质表面一致性（Material Consistency — Skin, Fabric, Metal & Light-Material Physics）

> 本页为 AI 视频的材质表面一致性：光-材质交互（albedo/粗糙度/金属度）、皮肤/布料/金属/玻璃的物理参数提示词、参考一致性、微细节后处理。知识本体来自 2026 材质真实感研究（SOPHY/ReelMind/Dreamina/Hailuo）。AI 应用面向 DirectorX：画面真实感（衔接 133 物理、170 光线、169 服装、176 景深）。
> 来源：SOPHY「Simulation-Ready Objects with Physical Materials (WACV 2026)」、Hailuo「Rendering Glass and Metal in AI Product Videos」、ReelMind「Photorealistic Textures」、Dreamina「Photorealistic Fabrics with AI」。

## 概述

**核心断言**：材质真实感 = **光与表面的交互正确**——2026 AI 从提示词推断物理材质图（albedo 反照率/粗糙度/金属度），皮肤/布料/金属各有物理参数语言（IOR 折射率/微表面/菲涅尔）。**参考一致性 + 物理参数提示 + 微细节后处理**三件套。

## 核心概念

### 光-材质三参数（PBR 语言）

```
① 反照率 Albedo：固有色（不受光影响）
② 粗糙度 Roughness：高=漫反射（布料），低=镜面（金属）
③ 金属度 Metallic：金属响应（高光色=环境色）
+ IOR（折射率）：玻璃/水
+ 菲涅尔 Fresnel：边缘掠射反射
```

### 分材质要点

| 材质 | 物理提示词 | 常见失败 |
|---|---|---|
| 皮肤 | 次表面散射（SSS）/毛孔微细节 | 塑料感/美颜过度 |
| 布料 | 织物纹理/褶皱/纱线 | 蜡质感 |
| 金属 | 高光/环境反射/拉丝 | 塑料金属 |
| 玻璃 | IOR/边缘高光/折射 | 假透明 |

## 技巧与示例

### 材质提示词工作流

```text
材质意图 → PBR 三参数语言
  → 参考图（材质一致性锚点，183）
  → 生成 → 微细节后处理（受控锐化）
  → 光-材质校验（170 光匹配）
```

示例："matte black metal with brushed texture, subtle environment reflections, high roughness except polished edges"——参数化的金属。

### 微细节后处理（ReelMind）

受控锐化/局部增强作为**最终一道**——提升可触感（Tangibility），不掩盖缺陷（衔接 174 QC、118 修复）。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 无 PBR 语言 | 塑料感 | 三参数提示 |
| 皮肤无 SSS | 橡胶脸 | 次表面散射 |
| 金属无反射 | 塑料金属 | 环境反射 |
| 布料无纹理 | 蜡质感 | 织物细节 |
| 后处理过度 | 失真 | 受控锐化 |

## 工作流应用（AI 映射）

画面真实感（衔接 133/169/170）：

```text
材质意图 → PBR 参数 → 参考锚点（183）
  → 生成 → 微细节后处理
  → 光-材质校验（170）→ QC（174）
```

**DirectorX 纪律**：PBR 参数语言描述材质；皮肤 SSS/金属反射/布料纹理分材质要点；参考锚点一致性；微细节后处理收尾。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 反照率 | Albedo | 固有色 |
| 粗糙度 | Roughness | 表面漫反射 |
| 金属度 | Metallic | 金属响应 |
| 折射率 | IOR | 光线折射 |
| 菲涅尔 | Fresnel | 边缘掠射 |
| 次表面散射 | SSS | 皮肤透光 |
| 微表面 | Micro-facet | 表面微观结构 |

## 来源

- SOPHY — Generating Simulation-Ready Objects with Physical Materials (WACV 2026)：https://openaccess.thecvf.com/content/WACV2026/papers/Cao_SOPHY_Generating_Simulation-Ready_Objects_with_Physical_Materials_WACV_2026_paper.pdf
- Hailuo — Material Realism: Rendering Glass and Metal in AI Product Videos：https://hailuoai.video/pages/knowledge/ai-product-videos-glass-metal-rendering
- ReelMind — Photorealistic Textures: Micro-Detail Surface Realism：https://reelmind.ai/blog/photorealistic-textures-achieving-micro-detail-surface-realism-in-ai-renders-through-expert-parameter-tuning-and-the-application-of-advanced-material-simulation-techniques-for-true-visual-depth-and-tangibility
- Dreamina — Producing Photorealistic Fabrics with AI Generators：https://dreamina.capcut.com/ai-image/producing-photorealistic-fabrics-with-ai-generators
- ReelMind — The Best AI for Creating Photorealistic Cloth and Fabric：https://reelmind.ai/blog/the-best-ai-for-creating-photorealistic-cloth-and-fabric-simulations