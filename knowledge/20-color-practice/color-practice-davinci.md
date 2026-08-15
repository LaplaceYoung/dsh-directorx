# 调色实操与 DaVinci 流程（Color Practice & DaVinci）

> 本页是 DirectorX 调色实操知识库：DaVinci 节点结构五阶段流程、节点类型（串行/并行/图层）、多机位匹配调色、示波器读图、LUT 使用规范、HDR 交付。每个概念含顺序规范与参数。
> 来源：Juan Melara 节点结构与操作顺序、Blackmagic DaVinci Resolve Colorist Guide、wolfcrow 多机位匹配、ITU-R BT.2408 HDR 实践。

## 概述

调色不是"加滤镜"，而是**按逻辑顺序**做修正：先打好中性平衡的底，再做局部修正，最后上风格。节点流程的意义：**每个阶段把"干净的数据"交给下一阶段**——顺序错了，后面的操作会受限甚至毁掉前面的结果（Juan Melara）。

**铁律**：
1. 先校正（准确）后风格（好看）——顺序不可颠倒。
2. 会裁切数据（LUT、软裁切、饱和曲线）的操作放最后。
3. 每个镜头从"中性平衡"开始——统一起点让风格可以跨项目复用。

## DaVinci 节点结构五阶段（Juan Melara）

### 阶段 1：平衡（Balance）
- 第一个节点（RAW 素材在 RAW 选项卡）做**全局平衡**：中性色、正确曝光、适度饱和。
- 目标：充满信息、便于后续抠像/限定——无论最终风格是浓是淡，起点相同。
- **好处**：标准化起点 → 风格可以在项目间复制（省时）。

### 阶段 2：局部曝光（Localised Exposure）
- 用 Power Window（遮罩）+ 柔边修正局部曝光：压暗天空、提亮脸部、清理背景杂光。
- **原则**：修正要"看起来像摄影机拍出来的"（Subtle）。
- **顺序原因**：风格会把颜色加到特定亮度值上——如果曝光修正放在风格之后，暗部取不到风格色；放在之前才能自然融合。

### 阶段 3：局部色彩（Localised Colour）
- 限定（Qualify）特定元素：肤色校正、服装校正、元素调色。
- 与阶段 4 来回迭代：全局风格影响局部后，回来调整局部。
- **并行节点的优势**：多个限定操作同时基于同一"母画面"（阶段 2 输出）——串行会因前一个限定改变数据而难以继续限定。

### 阶段 4：风格（Look）
- 全局上风格：暖化高光中调、阴影加青等（青橙/复古/冷科幻，见 09 文档）。
- 风格放在**靠近末尾**：此时不再需要基于原数据做限定。
- 风格后回看肤色——过暖就回到阶段 3 调整。

### 阶段 5：最终调整（Final Adjustments）
- 最后节点做"收尾"：曲线、对比度、黑电平提灰、整体饱和。
- **视为可调 LUT**：全片共用、除饱和外基本不动——保证全片一致性的锚点。

## 节点类型

| 类型 | 行为 | 适用 |
|---|---|---|
| 串行 Serial | 修正叠加在上一节点输出上 | 绝大多数基础操作 |
| 并行 Parallel | 各分支同时作用于同一输入 | 多个限定同时做（肤色+背景互不影响） |
| 图层 Layer | 横向堆叠、下层优先、支持混合模式 | 分区域合成式调色（下半暗+上半亮各一组节点） |
| 外部节点 Outside | 单独处理输入、可做"混合" | 复杂合成 |

**串行 vs 并行示例**：先暖化肤色（串行节点 3）再限定"皮肤里偏红部分"（节点 5）——若串行，暖化可能把红从肤色中"推走"，使后续限定失败；用并行两节点共享阶段 2 的输出即可。

## 多机位匹配调色（Camera Matching）

### 拍摄端预防
- 同一场景**同色温同机位参数**拍摄；色卡（Color Chart）在每台机器前拍一帧——后期匹配的基准。
- 所有机位开同一 Log 曲线；光圈快门统一（ND 平衡曝光差异）。

### 调色端匹配流程
1. **选基准**：选曝光与肤色最好的镜头做参考（Master Reference）。
2. **示波器对齐**：用波形图（Waveform）对齐亮度（中灰与肤色亮度），用矢量示波器（Vectorscope）对齐肤色线（Skin Tone Line）。
3. **色卡匹配**：有色卡则用自动匹配/手动对齐卡上的中性色块。
4. **DaVinci 工具**：Color Match（自动匹配参考帧）、Shot Matching（镜头匹配）、Group（组调色——同场景镜头进组，改一处全组生效）。
5. **粗匹配优先**：先亮度后色相，先全局后局部；不要逐镜头"精雕"——组内微调即可。
6. **检查**：切换相邻镜头时画面不应"跳"——黑白预览（去饱和）检查亮度匹配，再检查色彩。

### 匹配检查清单
```
□ 肤色亮度一致（波形图同高度）
□ 肤色色相一致（矢量图同角度，靠近肤色线）
□ 中性色（白/灰/黑）无偏色
□ 对比度一致（黑位与白位对齐）
□ 相邻镜头切换无跳变
```

## 示波器读图（Scopes）

| 示波器 | 读什么 | 关键判断 |
|---|---|---|
| 波形图 Waveform | 亮度分布（Y 轴亮度，X 轴画面位置） | 曝光是否居中、高光/阴影是否裁切 |
| 矢量示波器 Vectorscope | 色相与饱和（极坐标） | 肤色应在肤色线上；色偏方向 |
| 直方图 Histogram | 整体亮度统计 | 动态范围分布 |
| 分量示波器 Parade | RGB 分量对比 | 白平衡（RGB 峰值对齐）与单通道问题 |

**关键读图**：
- 波形图顶部贴顶 = 高光裁切；底部贴底 = 阴影裁切。
- 肤色线（Skin Tone Line，约 33° 方向）：肤色矢量应落在线上——偏左偏右指示色偏方向。
- 白平衡检查：波形图 RGB 三通道的高光/阴影端应大致对齐。

## LUT 使用规范

- **LUT 是什么**：查色表——把输入颜色映射到输出颜色；用于风格化或 Log→Rec.709 转换。
- **规范**：
  - 转换类 LUT（Log→709）作为**输入转换**放节点树最前（或 RAW 选项卡）；
  - 风格类 LUT（Look）放**最后节点**（或倒数第二）——避免裁切数据影响后续操作；
  - LUT 会裁切/限制数据——放前面的 LUT 会让之后的校正失去数据。
- **调 LUT**：LUT 之后加节点微调（强度、色彩、曝光）——不要直接改 LUT。
- **制作 LUT**：把一组节点的风格导出为 LUT（DaVinci 支持）——用于多项目统一风格。

## HDR 交付（SDR vs HDR）

### 基础概念
- **SDR**：Rec.709，亮度上限约 100 nits，8-10 bit。
- **HDR**：Rec.2020 色域 + 高亮度（最高 1000-4000 nits），10-12 bit，宽容度更接近人眼。
- **HDR 信号形式**：HLG（混合对数伽马，广播兼容）与 PQ（感知量化，流媒体/影院）。

### 生产规范（ITU-R BT.2408 要点）
- **HDR 调色基准亮度**：参考监视器 1000 nits（PQ）或 HLG 参考白 203 nits。
- **肤色亮度**：HDR 中肤色峰值约 60-70% 信号电平（与 SDR 类似的感知）——不要因 HDR 亮而把肤色推爆。
- **HDR→SDR 下转**：单母版流程（Single Master）——HDR 母版 + 自动/手动下转 SDR；注意高光压缩与饱和变化。
- **监视器**：调色必须用校准过的监视器（HDR 用 HDR 监视器）；未经校准的消费屏不能做色彩决策。
- **交付**：按平台规格（Netflix/YouTube HDR 规格各不同）——见 08 文档交付规范。

### HDR 常见错误
- 全程高亮"炫技"：HDR 的价值是**动态范围**（暗部细节+高光层次），不是"全都亮"。
- 肤色过亮过饱和。
- 用 SDR 监视器调 HDR（或反之）：决策失真。
- HDR 直接当 SDR 发布：灰/暗（伽马错）。

## 在 AI 视频生成中的应用

1. **AI 生成画面的"伪调色"**：AI 视频通常自带色彩——先做阶段 1 平衡（校正色偏）再上风格；不要直接叠 LUT（底层数据不一定健康）。
2. **风格一致性**：AI 片段与实拍混剪时，用同一"最终调整节点"（阶段 5）统一；多片段生成用同一风格提示词 + 同 LUT。
3. **提示词中的调色语言**：`color palette: teal shadows, warm skin tones, lifted blacks, cinematic contrast`——把阶段 4/5 的语言写进提示词。
4. **匹配检查**：AI 片段与参考镜头按"匹配检查清单"逐项核对（肤色线、中性色、对比度）。
5. **交付**：AI 生成内容同样按 SDR/HDR 目标交付——确认输出色彩空间再导出。

## 常见错误

1. 第一节点就上风格：后续限定/校正全部受限。
2. LUT 放太前：裁切数据，之后调不回来。
3. 不先平衡就局部修正：局部操作在"脏"的基础上叠加。
4. 逐镜头精调不做组：相邻镜头"跳"。
5. 不看示波器只靠眼睛：监视器不校准 + 环境光干扰 → 决策失真。
6. 风格推太狠再往回救：比"先正常后微调"难得多。
7. HDR 当 SDR 调/发布。
8. 肤色偏离肤色线：观众不适的第一来源。

## 术语表（中英对照）

| 中文 | English | 一句话定义 |
|---|---|---|
| 调色 | Color Grading | 风格化色彩 |
| 校正 | Color Correction | 技术性修正 |
| 节点 | Node | 调色处理单元 |
| 串行节点 | Serial Node | 顺序叠加 |
| 并行节点 | Parallel Node | 同输入并行 |
| 图层节点 | Layer Node | 堆叠合成 |
| 遮罩 | Power Window | 局部区域 |
| 限定 | Qualify | 按颜色/亮度选区 |
| 平衡 | Balance | 中性起点 |
| 风格 | Look | 全局视觉风格 |
| 波形图 | Waveform | 亮度分布 |
| 矢量示波器 | Vectorscope | 色相饱和 |
| 分量示波器 | Parade | RGB 分量 |
| 肤色线 | Skin Tone Line | 肤色参考轴线 |
| LUT | Look-Up Table | 查色表 |
| 色卡 | Color Chart | 校准参照物 |
| 组调色 | Group Grade | 多镜头同步调 |
| 镜头匹配 | Shot Matching | 镜头间一致 |
| SDR | Standard Dynamic Range | 标准动态范围 |
| HDR | High Dynamic Range | 高动态范围 |
| HLG | Hybrid Log-Gamma | 广播兼容 HDR |
| PQ | Perceptual Quantizer | 流媒体 HDR |
| Rec.709 / Rec.2020 | — | SDR/HDR 色彩标准 |
| 亮度单位 | Nits | 屏幕亮度 |
| 裁切 | Clipping | 数据溢出丢失 |
| 监视器校准 | Monitor Calibration | 显示设备校准 |

## 来源

- Juan Melara: Basic Resolve Node Structure and Order of Operations — https://juanmelara.com.au/blog/basic-resolve-node-structure-and-order-of-operations
- Blackmagic: DaVinci Resolve Colorist Guide（官方手册） — https://documents.blackmagicdesign.com/UserManuals/DaVinci-Resolve-20-Colorist-Guide.pdf
- Frame.io: DaVinci Resolve's Most Useful Nodes — https://blog.frame.io/2023/05/22/davinci-resolve-most-important-nodes-serial-parallel-outside/
- Mixing Light: Pat's DaVinci Fixed Node Tree — https://mixinglight.com/color-grading-tutorials/color-grading-101-part-4-pats-davinci-node-tree-2024-edition/
- wolfcrow: How to Match Shots from Two or More Cameras — https://wolfcrow.com/how-to-match-shots-from-two-or-more-cameras-for-color-and-exposure/
- ITU-R BT.2408: Operational practices in HDR television production — https://www.itu.int/dms_pub/itu-r/opb/rep/R-REP-BT.2408-1-2018-PDF-E.pdf
- Videomaker: What are vectorscopes and why are they important — https://www.videomaker.com/how-to/editing/color-correction/what-are-vectorscopes-and-why-are-they-important/