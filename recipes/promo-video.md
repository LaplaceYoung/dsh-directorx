
name: 宣传片
description: 企业/品牌宣传片（60-180s）从定位到成片，主题统一 + 品牌一致——单元化制作、占位先行

# 宣传片配方（60-180s）

统一主题句贯穿、品牌色/logo 一致、开场 3 秒承诺 + 结尾记忆点。

制作方式：**单元化制作**（见 unit-production 配方）。

## 阶段序列
1. **benchmark**（调研 + skill_read + knowledge_read）— 先建「好宣传片基准」（结构/视觉/平台三基准）
2. **script**（对话，不调工具）— 统一主题句 + 三幕结构 + 视觉语言，写成脚本，用户确认
3. **plan** — 出镜人设外观契约 + 分镜表（含 continuity 契约）；品牌色先定（show_palette）
4. **placeholders** — 全部镜头排队（品牌元素入每个提示词），用户确认后执行
5. **qa**（qa_inspect）— 质检（品牌一致性重点），阻断级只返修对应镜头
6. **assemble**（video_edit / ffmpeg）— 拼接 + 响度 + 横版 16:9 主片 + 竖版切片
7. **package**（package_deliver）— 封面 + 标题 + 预告

## 门禁
- 色彩系统（品牌色）在 plan 阶段用 show_palette 展示并锁定
- 分镜/占位批次/成片各一次用户确认；占位未齐不得开始生成