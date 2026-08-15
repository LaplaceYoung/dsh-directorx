# 全片风格统一与美术指导（Style Unification & Art Direction）

> 本页是 DirectorX 风格统一手册：Look Stack 五层模型（基调/色彩/光线/质感/运动）、Lookbook 八步制作流程、完整工作示例（"Last Shift" 暖转冷双联画）、AI 跨片风格一致性工作流。与 09 灯光 / 20 调色 / 28 风格流派 / 36 LUT 衔接。
> 来源：Storyflow 2026 Lookbook 指南、AI 工具指南跨片风格一致性、SunoMV 色调统一方法论。

## 概述

**Lookbook = 视觉论证，不是图片堆砌，也不是漂亮的 PDF**：它让读者"感觉到"这部电影。分镜之前，先用 Lookbook 卖掉影片的基调与世界。

**核心断言**：
1. **先开发外观，后设计文档**——设计工具只包装一个你还没开发完的外观；
2. **Lookbook 的力量来自连贯、独特的外观**——"连贯读作愿景，不连贯读作收集了漂亮图片碰运气"；
3. **五层必须讲同一个故事**——某层打架时，读者说不清哪里不对，但会感觉到。

## Look Stack：外观的五层模型（栈，不是列表）

| 层 | 内容 | 抽象度 |
|---|---|---|
| 基调 Tone | 用一句话命名情绪——**所有层都服务它** | 最抽象 |
| 色彩 Color | 承载基调的色板——文字之前就被感知 | ↓ |
| 光线 Light | 世界怎么被照亮：硬/软、暖/冷、高调/阴影 | ↓ |
| 质感 Texture | 物理世界：地点、美术、服装表面、地方的颗粒 | ↓ |
| 运动 Motion | 镜头与镜头语言：手持/固定、长焦/广角、静/躁 | 最物理 |

**五层互相牵引**：冷色调拉向硬光；手持运动拉向亲密质感。同向则外观成立，反向则观众先于语言感到"不对劲"。

## Lookbook 八步流程

```
① 一行基调声明 → ② 广采参考、狠剪 → ③ 提取色板 → ④ 定义摄影
→ ⑤ 地点与美术 → ⑥ 角色与服装 → ⑦ 排成叙事 → ⑧ 最后才设计文档
```

1. **一行基调声明**：不写剧情写情绪——"亲密温暖，信任破裂后转为冷峻临床"。它是每张参考图的测试标准。AI 可帮打磨："给我三种更锐利的情绪命名"。
2. **广采参考、狠剪**：过度收集再按基调猛砍——**Lookbook 由你删掉什么定义**，与包含什么同等重要。AI 帮忙找主线："哪些参考不符合基调？符合的有什么视觉模式？"
3. **提取色板**：从参考中提主色（暖饱和 ≠ 冷低饱和），一页色板，色板可随剧情演变（按场景分组呈现"演变"而非两张无关网格）。
4. **定义摄影**：机位/灯光/运镜参考 + 简短意图注记——让摄影指导读出"如何实现"而非"长什么样"（40mm 手持 vs 锁定 28mm 广角）。
5. **地点与美术**：环境/建筑/质感/年代/细节水平——类型与年代片尤其关键（世界是角色）；注记"生活过 vs 崭新、宏大 vs 幽闭"。
6. **角色与服装**：选角气质、服装、发型、妆造——服装同时属于质感层与色彩层；与色板基调保持一致。
7. **排成叙事**：不是随机画廊——让外观讲一个小故事：外观如何随影片演变、基调如何累积；排序隐形时最成功。
8. **设计文档**：最后才排版——大图、少字、设计隐形；Canva 快速 PDF / InDesign 印刷级；8-20 页，**连贯 > 长度**（紧凑的 10 页胜过注水的 30 页）。

## 完整示例："Last Shift"（暖转冷双联画）

夜班护士与垂危病人建立安静联结，发现病人一直在骗她——温暖凝成临床冰冷。

| 层 | 前半（暖） | 后半（冷） |
|---|---|---|
| 基调 | intimate, hushed, tender | antiseptic, exposed, sterile |
| 色彩 | 琥珀钠灯暖光、金肤、旧毯黄棕 | 绿白荧光、凌晨 4 点空走廊色 |
| 光线 | 单盏暖台灯实光、柔落阴影、半明半暗的脸 | 平铺顶部荧光、无处藏身、一切暴露 |
| 质感 | 皱床单、旧油毡、缺口马克杯、罩衫下的开衫 | 抛光钢、抽掉的床、映出荧光的地板 |
| 运动 | 40mm 手持、贴近、随呼吸微晃 | 锁定 28mm、静态、广角、镜头如护士般抽离 |

色板页用**两行演变**呈现（上行琥珀、下行荧光）——转变本身就是故事。五层同讲"信任破裂"= 读者说"我能看见这部电影"而非"图片不错"。

## 工具分工

| 工具 | 阶段 | AI 帮助 |
|---|---|---|
| Storyflow/Milanote | 开发（画布） | AI 找主线、生成参考帧 |
| Canva/InDesign | 设计（排版） | 模板/排版辅助 |
| ShotDeck | 按外观搜电影帧 | 可检索标签库 |

**工作流**：画布开发外观 → 参考库搜源 → 设计工具出 PDF。

## AI 跨片风格一致性（2026 工作流）

- **风格参考图贯穿**：所有镜头/片段生成挂同一风格参考（--sref / 风格板，→ 39/40 文档），AI 负责"找到主线"；
- **色板契约先行**：生成前定色板（五层中的 Color 层），每镜校验色相范围（SunoMV 色调统一法：让每镜色彩说同一种情绪——建立"情绪→色值"映射表，生成后按映射检查）；
- **灯光语义统一**：提示词中光线描述用同一套词汇（"warm practical lamp light, soft falloff"），避免一镜一光；
- **后期兜底**：LUT + 调色统一（→ 36 文档）收拢各镜偏差——**生成端一致性 + 后期端统一 = 双保险**；
- **人物/场景参考**：角色与地点参考贯穿全片（→ 39 文档）。

## 常见错误

1. 跳过基调声明：变成"我喜欢的图片"堆。
2. 不剪参考：包含一切 = 什么都不是。
3. 色板理想化：色板必须与参考一致，不是理想版本。
4. 五层打架：冷色调配柔光大棚光，观众说不出但会感觉到。
5. 一镜一光/一镜一风格词：AI 生成端就已分裂。
6. 先设计后开发：精致但普通。
7. 只有后期调色兜底：生成端不统一，LUT 救不回。

## 术语表（中英对照）

| 中文 | English | 一句话定义 |
|---|---|---|
| 外观栈 | Look Stack | 五层外观模型 |
| 基调声明 | Tone Statement | 一行情绪契约 |
| 样书 | Lookbook | 视觉论证文档 |
| 情绪板 | Mood Board | 参考收集板 |
| 色板 | Palette | 色彩世界 |
| 贯穿线 | Through-line | 五层共同主线 |
| 视觉语言 | Visual Language | 全片外观系统 |
| 双联画 | Diptych | 暖冷对比结构 |
| 实光 | Practical Light | 场景内真实光源 |
| 风格参考 | Style Reference | 跨镜风格锚 |
| 色调统一 | Color Unification | 情绪→色值映射 |
| 生成端统一 | Generation-side Consistency | 提示词层一致 |

## 来源

- Storyflow: How to Make a Lookbook for a Film in 2026 (Step-by-Step) — https://storyflow.so/blog/how-to-make-a-lookbook-for-a-film-2026
- Storyflow: Film Lookbook — A Director's Lookbook in Hours — https://storyflow.so/film-lookbook
- StudioBinder: Film Lookbook Examples & How to Make a Lookbook for Film — https://www.studiobinder.com/blog/film-lookbook-examples/
- Sundance: How Olivia Wilde and Adam Newport-Berra Crafted the Visual Language of "The Invite" — https://www.sundance.org/blogs/how-olivia-wilde-and-adam-newport-berra-crafted-the-visual-language-of-the-invite/
- AI 工具指南: AI 视频跨片风格一致性（2026 工作流） — https://aitoolsguidebook.com/zh/articles/ai-video-style-consistency/
- SunoMV: AI 音乐视频色调统一方法论——让每个镜头的色彩说同一种情绪 — https://suno.bi/zh/blog/ai-music-video-color-grading-consistency-method-sunomv-2026
- postPerspective: The Drama DP and Colorist on Look of Emotional Decay — https://postperspective.com/the-drama-dp-and-colorist-on-look-of-emotional-decay/