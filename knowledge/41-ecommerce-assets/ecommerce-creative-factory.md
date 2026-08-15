# 电商素材批量生成工厂（E-commerce Creative Factory）

> 本页是 DirectorX 电商素材工厂手册：规模化素材生产运营模型（五层系统）、角色与 SLA、队列与升级规则、六步提示词配方、生产健康指标、大促排期法。与 38 广告视觉 / 29 商业创作 / 32 数据工具衔接。**带货视频内容方法论（异议-证明/可购物视频）已并入 135 广告创意——2026-08 去重整理。**
> 来源：Riverflow 规模化指南、MerchLoom/Tadka 创意系统、腾讯云/TrueSight 电商主图工作流。

## 概述

**规模化 ≠ 产更多文件**：目标是在不损失产品准确性、品牌一致性、审查纪律的前提下产出更多可用素材。每个新资产应该是**受控变体**，而不是断开的临时请求。

**核心断言**（Riverflow）：
1. 最强运营模型有五个可复用层——**产品真相 / 场景系统 / 风格系统 / 模型访问 / 编辑规则**；
2. 规模化失败通常发生在"每个请求都依赖同一个资深审稿人"或"没人拥有否决权"；
3. 衡量规模化是否健康看**学习质量**（每批有对照、单一测试变量、可用决策），不只看出图数。

## 五层系统（受控变体的基础）

| 层 | 标准化什么 | 审查标准 |
|---|---|---|
| 产品源库 Product Source | 产品参考、侧视图、包装稿、变体数据、已批准文案、Logo 文件、使用限制 | 每个请求从当前源材料出发，而非散落文件/旧 campaign 导出 |
| 场景库 Scene | 品牌安全场景 + 自有拍摄场景 + 仍需实拍场景 | 团队知道请求该用实拍/库场景/自有场景复用 |
| 风格系统 Styles | 光线、机位距离、表面处理、构图、品类情绪、镜头类型一致性 | 产品跨 lifestyle/hero/collection/广告格式仍是同一品牌 |
| 模型访问 Images | 何时用文生图/图生图（Riverflow 2.0 Pro / Nano Banana 2 / GPT-Image-2） | 模型选择有意识，输出仍过产品/品牌/渠道审查 |
| 编辑规则 Editing | 角度变体、宽高比适配、产品细节修复、产品替换、安全区、裁切交接 | 先用定向编辑，再考虑重新生成或重新拍摄 |

## 角色与 SLA（按决策类型分权，不按文件交接）

| 角色 | 拥有 | SLA 目标 |
|---|---|---|
| 需求方 Requester | 战役目标、受众、渠道、截止日、格式、SKU、优先级 | 生产前完成 intake；阻塞请求当天澄清 |
| 创意负责人 Creative Lead | 模块选择、场景方向、风格适配、层级、定制 vs 复用 | 标准模块 1 个工作日内出首版方向 |
| 产品负责人 Product Owner | SKU 准确性、变体细节、包装、成分/材料、详情页匹配 | 标准批次 1 个工作日内完成产品审查 |
| 品牌审稿 Brand Reviewer | 语气、字体、色彩、Logo 使用、布局一致性 | 产品准确性通过后 1 个工作日内 |
| 文案/法务 Claims/Legal | 折扣条款、评价引用、前后对比、比较性语言、认证 | 媒体交接前审查，文案变更无静默批准 |
| 渠道负责人 Channel Owner | 安全区、裁切比、命名、UTM、投放位适配 | 交接当天完成最终导出检查 |

## 队列与升级规则

| 场景 | 规则 | 升级路径 |
|---|---|---|
| 无源不开始 | 请求必须含产品参考/包装/文案/变体/目标格式 | 退回需求方，列出缺失字段 |
| 一批一模块 | 每批一个生产模式（hero/组合/常规/证明/发布/再营销/季节刷新） | 拆分成独立单 |
| 先编辑后重生成 | 想法对但裁切/角度/细节/SKU 错 → 定向编辑 | 创意负责人决定编辑/重生成/重拍 |
| 产品准确性一票否决 | 品牌包装不能弥补错误包装/变体/比例/缺件 | 产品负责人有否决权直至源真相修正 |
| 衡量模块健康 | 审批率、修改次数、周期、渠道拒收、模块复用 | 淘汰持续失败的模块 |

## 六步提示词配方（批量）

```
① Input  附：产品参考、变体列表、包装稿、品牌规则、已批准文案、目标渠道、要扩的模块
② Scene  定：品牌安全场景 / 自有拍摄场景 / 新文生图或图生图
③ Style  命名：跨输出保持的可复用风格（光线/表面/机位距离/间距/裁切逻辑/品类情绪）
④ Controls 锁：产品准确性、字体、文案长度、布局层级、裁切要求、文案与合规
⑤ Batch  要求：跨 SKU/变体/渠道的一致输出，保留到产品/场景/风格/模型的追溯性
⑥ Finish 编辑：最强输出选定后，再要角度变体/宽高比/细节修复/产品替换
```

示例（批量化 prompt cue）：
> Create a 4:5 paid social product family module for these six beverage cans using the chilled assortment Scene. Preserve each variant color and label, apply the approved beverage Style, and leave safe space for headline copy.

## 批量生产的常见模块（先建模块再扩量）

| 模块 | 用途 | 关键纪律 |
|---|---|---|
| 变体覆盖 Variant Coverage | 集合页/发布陈列/付费轮播/邮件 | 每 SKU 可换入而不重建布局与审查清单 |
| 一致集合布局 Collection Layout | PDP 画廊/品类头图/组合模块 | 货架式构图，标签可读，间距均衡，留裁切安全区 |
| 组合战役素材 Assortment Campaign | 季节发布/社媒刷新/首页战役 | 所有产品可追溯到源参考，**不发明标签文案**；先出主图过审，再出 1:1/4:5/9:16/邮件裁切 |

## 大促排期法（中文生态：大促前 7 天节奏）

| 时间 | 产出 |
|---|---|
| T-7 | 主图批次：全部 SKU 基础图（hero 角度 + 平视锚定图）过产品/品牌审查 |
| T-5 | 场景图批次：主图入场景库（lifestyle/集合），出多格式裁切 |
| T-3 | 战役素材批次：促销文案版、组合模块、季节道具版；文案/法务过审 |
| T-1 | 渠道交接：各平台安全区/尺寸导出，UTM 命名，最终 QC |
| T-0 | 数据埋点：每批留对照与单一测试变量（可复盘） |

## 生产健康指标（规模化要度量的东西）

- 简报完整率：多少请求带齐产品源/文案/渠道格式/成功标准；
- 首过审批率：按模块/渠道/品类/需求方统计；
- 平均修改次数：到产品/品牌/文案/渠道审批的轮次；
- 周期：简报→首审→终批→渠道交接；
- 复用率：最终资产跨 PDP/付费社媒/邮件/生命周期/市场/发布页的复用百分比；
- 复盘质量：每批是否有对照、一个测试变量、可用决策（→ 32 文档）。

## 常见错误

1. **先扩量后定质**：产品准确性/场景/风格/字体/文案/渠道未定就加量——生产越快错越多。
2. **每场战役都当全新**：定制留给真正英雄时刻，常规需求走模块/场景/风格复用。
3. **AI 输出变不可追溯文件**：每个资产存源产品/场景/风格/模型/提示词/编辑史/导出设置/审批备注。
4. 无源开跑：缺输入导致返工。
5. 重生成代替编辑：烧预算且可能失去已工作的部分。
6. 产品错误靠品牌包装掩盖：制造 PDP/售后风险。
7. 缺复盘对照：量大但学不到东西。

## 术语表（中英对照）

| 中文 | English | 一句话定义 |
|---|---|---|
| 素材工厂 | Creative Factory | 受控变体生产系统 |
| 产品源库 | Product Source Library | 产品真相仓库 |
| 场景库 | Scene Library | 可复用环境集 |
| 风格系统 | Styles | 品牌视觉契约 |
| 模块 | Module | 可复用生产模式 |
| 变体覆盖 | Variant Coverage | SKU 换入能力 |
| 组合素材 | Assortment Asset | 多 SKU 战役图 |
| 简报 | Brief/Intake | 需求交接单 |
| 首过审批率 | First-pass Approval Rate | 一次通过比例 |
| 一票否决 | Veto | 产品准确性否决权 |
| 大促排期 | Launch Cadence | 前 7 天节奏 |
| 可追溯性 | Traceability | 资产↔源映射 |

## 来源

- Riverflow: How to Scale Ecommerce Creative Production — https://www.riverflow.ai/guides/how-to-scale-ecommerce-creative-production
- MerchLoom: AI Ad Creative Generator for Ecommerce — Scalable Workflow — https://merchloom.ai/blog/ai-ad-creative-generator-for-ecommerce
- Tadka: AI Ad Creative Workflow — One Brief to Hundreds of Ads — https://tadkai.io/resources/ai-creative-workflow-2026
- adlibrary: AI Ecommerce Ad Creative — The 2026 System for Scaling — https://adlibrary.com/posts/ai-ecommerce-ad-creative-strategies
- Dataïads: Scale your Catalog Ads — thousands of creatives per product — https://www.dataiads.io/en/use-cases/scaler-catalog-ads
- 腾讯云开发者社区: 怎么搭建一套用 AI 持续产出电商主图的工作流 — https://developer.cloud.tencent.cn/article/2698007
- TrueSight: 电商产品主图批量生成技术指南 (2026) — https://tsight.io/articles/8066359
- PS AI Plugin: 批量出图节奏——电商大促前 7 天排期法 — https://psaiplugin.com/blog/ai-092cc2/