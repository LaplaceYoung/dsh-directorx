
name: 广告片
description: 短广告（15-60s）从产品简报到成片，突出卖点与转化钩子——单元化制作、占位先行

# 广告片配方（15-60s）

卖点先行、3 秒钩子、单一 CTA。比宣传片更短更锋利。

制作方式：**单元化制作**（见 unit-production 配方）——逐镜占位、用户确认批次后按镜头顺序生成。

## 阶段序列
1. **brief→script**（对话，不调工具）— 从 brief 提炼「核心卖点 + 目标受众 + 一句话承诺」，写成广告脚本，用户确认
2. **plan** — 分镜表（逐镜五维 + continuity_in/out）；广告片通常无虚构角色，出镜者仍要外观契约锁形象；开场镜必须兑现钩子承诺
3. **placeholders** — 全部镜头用 `mossland_prepare_generation` 排队（shot_idx + 首尾帧/参考锚点 + 自包含提示词），用户确认后执行
4. **qa**（qa_inspect, scope: frames/clips）— 质检，阻断级只返修对应镜头
5. **assemble**（video_edit / ffmpeg）— 按镜头顺序拼接（落实声明的转场）+ 响度（-14 LUFS）+ 竖版切片（9:16 为主）
6. **package**（package_deliver, platform = douyin/kuaishou 等）— 封面 + 3 标题（平台限长）+ 预告切片

## 门禁
- 分镜/占位批次/成片各一次用户确认；占位未齐不得开始生成
- 色彩系统涉及时调 show_palette 展示色卡
- 返修只重排单个镜头，不整批重跑