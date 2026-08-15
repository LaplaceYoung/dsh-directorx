# AI 视觉特效管线（VFX Pipeline — Roto / Matchmove / Comp & AI Application）

> 本页知识本体来自真实视效（VFX）工作室的工业化管线：Roto（抠像）→ Paint/Prep（擦除清理）→ Matchmove/相机跟踪 → CG 渲染 → 合成（Compositing）→ 成片。核心论点：**特效是"叠加层"，不是"重画整帧"**——真实行业靠分层合成保留主体，这正是案例 2「影视打斗与 VFX（保留原人物和场景加效果）」的正确语义。
> 来源：CG Spectrum「The Visual Effects Pipeline」、LucidLink「VFX pipeline 2026 guide」、Brighten「The Art of Seamless Compositing」、DigiAura「Roto to Final Comp」、Pixune「VFX Pipeline Breakdown」。

## 概述

**核心断言**：VFX 不是"在画面里加魔法"，而是一套**分层合成的工程**：把实拍底板（Plate）、CG 渲染层、特效层、数字绘景（Matte Painting）叠成一张无缝的最终画面。**保留主体的关键是"主体层不动，特效层叠加"**——这直接回答案例 2：给打斗加特效 = 主体（人物/场景）保持，特效作为独立层合成。

**核心纪律**：无缝合成（Seamless Compositing）依赖光色匹配（Lighting/Color Match）、边缘处理（Edge Treatment）、颗粒匹配（Grain）——特效不像"贴上去"，而像"本来就存在"。

## 核心概念

### VFX 管线（四个核心学科 + 合成）

```
Previs 预演 → 概念与资产
  ↓
Plate 底板拍摄（保留主体的原始素材）
  ↓
Roto 抠像 → 把要替换/叠加的区域从画面中分离（保留主体区域）
Paint/Prep 擦除清理 → 去掉不需要的元素（威亚、标记点）
Matchmove 匹配运动 → 相机跟踪，让 CG 与实拍运动一致
  ↓
CG 渲染（特效/角色/场景层）
  ↓
Compositing 合成 → 多图层叠成最终画面
  ↓
成片
```

### 合成的基本原则

1. **分层不重画**：主体（人物/场景）是底板层，特效是叠加层——各层独立渲染再合成
2. **光色匹配**：CG 层的光照方向、色温、对比必须与底板一致，否则"贴图感"
3. **边缘处理**：特效边缘的羽化、溢色（Spill）、光晕（Light Wrap）决定"真不真"
4. **颗粒/噪点匹配**：特效层加上底板的胶片颗粒，融入画面
5. **运动匹配**：Matchmove 保证特效跟随相机/主体的运动

## 技巧与示例

### 案例 2 的正确执行（保留人物场景加特效）

```text
输入：原打斗视频（人物 + 场景）
  → ① 主体层保持（不重新生成人物/场景——这是"保留"的语义）
  → ② 特效层生成（火花/冲击波/能量场，作为独立层）
  → ③ 对齐：特效层按打斗动作的时间码对齐（接触帧爆发）
  → ④ 合成：光色匹配 + 边缘处理 + 颗粒匹配
  → ⑤ 审片：主体未变 + 特效融入
```

**AI 落地路径**：
- 首选：主体锁定（参考帧锚定，identity 不变）+ 特效层独立生成 + 时间线合成
- 次选：如果模型必须一次生成，用"先无特效版 → 再特效版"的对照提示词，且明确"保持人物动作/场景不变，只增加 X 特效"
- 兜底：特效层生成 + 剪辑软件叠加混合（blend/screen 模式），保留主体层原片

### 特效与动作时序（sell-the-hit）

打斗特效的爆发点必须与接触帧对齐（接 97）：拳头接触的**那一帧**特效爆发，挥空不加特效——这是"打击感"的行业共识。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| "加特效"变成"重画整帧" | 人物/场景漂移 | 分层：主体层不动，特效层叠加 |
| 特效层不与光色匹配 | 贴图感、假 | 光向/色温/对比匹配 |
| 特效爆发点错位 | 打击感为零 | 接触帧爆发 |
| 忽略边缘与颗粒 | 特效浮在画面上 | 羽化/光晕/颗粒匹配 |
| 无特效版不保留 | 无法回退 | 先生成/保留干净层 |

## 工作流应用（AI 映射）

案例 2 在 DirectorX 中的执行编排：

```text
用户：给这段打斗加火焰/冲击波特效，保留人物和场景
  → ① 确认特效类型与强度（提问 ≤3）
  → ② 抽取干净主体参考帧（锚定人物/场景/动作）
  → ③ 特效层生成（独立图生视频：粒子/能量/冲击波，纯特效无主体）
  → ④ 时间线对齐（接触帧爆发）
  → ⑤ 合成（光色匹配 + 混合模式）
  → ⑥ 审片：主体未变对照 + 特效融入度
```

**降级纪律**：模型不支持分层时，宁可"特效层生成 + 后期合成"，也不做"整帧重生成"。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 底板 | Plate | 保留主体的原始素材 |
| 抠像 | Rotoscoping（Roto） | 逐帧分离画面区域 |
| 擦除清理 | Paint / Prep | 移除不想要元素 |
| 匹配运动 | Matchmove | 相机/主体运动匹配 |
| 合成 | Compositing（Comp） | 多图层叠成最终画面 |
| 光色匹配 | Lighting / Color Match | 层间光向色温一致 |
| 光晕 | Light Wrap | 边缘被光染色的融合效果 |
| 数字绘景 | Matte Painting | 背景绘制层 |
| 颗粒匹配 | Grain Match | 噪点/胶片颗粒一致 |
| 打击感 | Sell the Hit | 特效爆发点与接触帧对齐 |

## 来源

- CG Spectrum — The Visual Effects Pipeline (12 steps)：https://www.cgspectrum.com/blog/the-visual-effects-pipeline
- LucidLink — VFX pipeline (2026 guide)：https://www.lucidlink.com/blog/vfx-pipeline
- Brighten — The Art of Seamless Compositing：Blending CGI with Live-Action：https://www.brighten.top/posts/the-art-of-seamless-compositing-blending-cgi-with-live-action-footage
- DigiAura — From Roto to Final Comp: VFX Compositing Pipeline：https://digiaura.co.in/blog/vfx-compositing-pipeline-roto-to-final-comp/
- Pixune — VFX Pipeline Breakdown From Previs to Compositing：https://pixune.com/blog/vfx-pipeline/