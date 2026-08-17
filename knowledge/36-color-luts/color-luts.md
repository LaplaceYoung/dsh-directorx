# 调色风格与 LUT 制作（Color Grading & LUT Creation）

> 本页是 DirectorX 调色风格手册：经典电影风格库、LUT 原理、从调色导出 LUT 的完整流程（Resolve/Lumetri/FCP/CapCut）、LUT 使用规范与 AI 调色衔接。
> 来源：Luttie 官方教程、Pixflow、FilmSupply、COSESAI 实地指南、aaapresets 系列教程。

## 概述

调色（Color Grading）是后期最后一道"情绪开关"：同一段素材，暖调=亲密、青橙=商业大片、褪色=年代感。**LUT（Look-Up Table，查色表）** 把整套调色变换打包成一个文件（.cube），任何剪辑软件里一键套用——是"品牌风格/系列作品一致性"的工业化工具。

**核心认知**：
1. **LUT 是"输入色→输出色"的完整映射**（33×33×33 采样点记录每个输入色对应的输出值）——它捕获曲线、色轮、HSL 二级、暗角、预设的全部效果；
2. **调色 ≠ 校正**：先校正（白平衡/曝光/反差，还原真实），后调色（风格/情绪，创造真实感）；
3. **风格要"讲得出理由"**：每套 look 对应情绪/类型/叙事功能，不是随机拉杆。

## 经典电影风格库（可直接参照/复刻）

| 风格 | 特征 | 情绪/用途 | 参考片例 |
|---|---|---|---|
| 青橙 Teal & Orange | 阴影偏青、肤色偏橙，最大分离度 | 商业大片、动作片、高对比 | 《变形金刚》《碟中谍》 |
| 漂白旁路 Bleach Bypass | 降饱和+高反差，银盐感 | 战争/末日/硬核 | 《拯救大兵瑞恩》《疯狂的麦克斯》 |
| 交叉冲印 Cross-processing | 色彩偏移、肤色偏品/黄 | 复古、梦境、广告时尚 | 90 年代胶片广告 |
| 胶片模拟 Film Emulation | Kodak/Fuji 负片、颗粒、高光滚降 | 年代感、文艺片 | 几乎所有"文艺感" |
| 低饱和 Muted/Desat | 全局降饱和+柔光 | 纪录片、北欧冷淡、高级感 | 《消失的爱人》部分段落 |
| 高调 Low-key / 低调 High-key | 暗部主导/亮部主导 | 悬疑/喜剧 | 黑色电影 / 广告日化 |
| 暖记忆 Warm Memory | 高光暖、暗部棕 | 回忆/亲情/广告 | 可乐广告 |
| 冷科技 Cool Tech | 蓝青主调、肤色调偏冷 | 科技/未来/医疗 | 苹果发布会片 |

**青橙怎么搭**（Pixflow 实操）：Log 素材先校正 → 肤色用 HSL 拉向橙 → 阴影/高光分别推向青 → 用饱和度曲线控制不溢出 → 最后加对比度与颗粒。

## 可执行风格目录（DirectorX grade catalog）

自然语言调色走 `directorx_studio`，映射到 ffmpeg 确定性配方（`src/providers/grade-catalog.ts`），不是生成模型重绘。知识来源只采用可商用许可：FFmpeg 运行时曲线预设（LGPL，不捆绑源码）、colour-science/colour（BSD-3-Clause，特征近似）、yeun/open-color（MIT，色相锚）、36 文档经典风格条。YahiaAngelo/Film-Luts 是 MIT，但仓库约 187MB，不整包捆绑；气质对照写进人像负片/克罗姆配方。

| 中文 | id | 家族 | 用户可以说 | 配方来源 |
|---|---|---|---|---|
| 荒土 | wasteland | 电影 | 末日荒土 / 废土 / 黄沙 | 本表战争/末日条 |
| 青橙 | teal-orange | 电影 | 青橙 / teal orange / 好莱坞 | 本表青橙 + Pixflow |
| 漂白 | bleach-bypass | 电影 | 漂白旁路 / bleach bypass / 银盐 | 本表漂白旁路 + FFmpeg strong_contrast |
| 霓虹 | cyber | 电影 | 赛博 / 霓虹 / neon | open-color 青粉锚 |
| 胶片 | film-fade | 胶片 | 胶片感 / 褪色 | 本表胶片模拟 |
| 复古 | vintage | 胶片 | 复古 / 怀旧 / 老照片 | FFmpeg curves=vintage |
| 克罗姆 | kodachrome | 胶片 | 柯达正片 / kodachrome / velvia | colour-science 正片特征近似 |
| 人像负片 | portra | 胶片 | 人像胶片 / portra / 肤色胶片 | colour-science 负片肤色倾向 |
| 交叉冲印 | cross-process | 胶片 | 交叉冲印 / cross process | FFmpeg curves=cross_process |
| 负片 | color-negative | 胶片 | 负片 / 反相 / 底片 | FFmpeg curves=color_negative |
| 黑白 | bw-contrast | 胶片 | 黑白 / noir | FFmpeg strong_contrast + 去饱和 |
| 低饱和 | muted | 影调 | 低饱和 / 去饱和 / 北欧淡彩 | 本表低饱和条 |
| 夜色 | night | 影调 | 夜色 / 月光 / night | open-color indigo/blue |
| 冷调 | cold | 影调 | 冷调 / 青冷 | 本表冷科技条 |
| 暖调 | warm | 影调 | 暖调 / 暖色 | 本表暖记忆条 |
| 金黄昏 | golden | 影调 | 金色黄昏 / 日落 / golden hour | open-color 黄橙锚 |

未点名具体风格、只说「调色/滤镜」时默认荒土。自定义 `.cube` 仍走 `directorx_video_process` 的 lut3d，不把 GPL/AGPL LUT 包打进仓库。

## LUT 是什么、不是什么

- **是什么**：描述颜色变换的文件（.cube/.3dl）；把"某输入色"映射为"某输出色"；行业标准 33 点（33×33×33）。
- **不是**：滤镜（滤镜是单一参数调整）；不是校色器（校色应对原始素材做，LUT 是风格化）。
- **两类 LUT**：
  - 技术 LUT：Log → Rec.709（还原校正，如 D-Log M / S-Log3 / C-Log3 的转换）；
  - 创意 LUT：风格化 look（青橙、胶片模拟等）。
- **陷阱**：直接把 Log 素材套创意 LUT = 色彩错乱；创意 LUT 套在已校正素材上才会正确表现。

## 从调色导出 LUT（五步，任何编辑器通用）

1. **用代表性画面搭调色**：上传一张"能代表你素材"的帧——金黄昏景调出的 LUT 用到暗室内景会错；通用 LUT 选**全影调范围 + 中性偏暖色温**的帧。
2. **Log 素材先做技术校正**：D-Log M / S-Log3 / C-Log3 先套技术还原 LUT，再叠创意调色——导出文件会同时包含两者。
3. **搭好整套 grade**：曝光/对比/曲线（R/G/B）/色轮/HSL 二级/暗角——导出的 LUT 是这一时刻的完整快照。
4. **导出 .cube**（33 点，行业标准）：Luttie 浏览器内即可（无需 2GB 安装 Resolve）；Resolve 中：调色节点上右键 → **导出 LUT**（LUTs 面板右键 Import LUT）。
5. **在难素材上测试**：套到极端高光、欠曝、肤色的帧上——参考帧好看 ≠ 全素材好看（高光裁切/肤色偏移就回去调再导出）。

## 各软件应用 LUT

| 软件 | 位置 | 强度控制 |
|---|---|---|
| DaVinci Resolve | 调色页 → LUTs 面板右键 Import → 拖到节点 | 节点 Key 输出 |
| Premiere Pro | Lumetri Color → Creative → Look → Browse | Intensity 滑杆 |
| Final Cut Pro | 效果浏览器 → Custom LUT → Inspector 选择 | 效果强度 |
| CapCut | 调整 → 滤镜 → LUT → + 导入 | 强度滑杆 |

## LUT 制作规范与纪律

1. **先存 preset 再导出**：可回炉精修再导出，不用重搭；
2. **一套 look 一套 LUT，命名带版本**：`brand_teal_v2.cube`；
3. **系列一致性**：同一项目所有镜头套同一 LUT + 少量镜头级微调，别逐镜自由发挥；
4. **皮肤优先**：肤色偏移是最先被观众发现的错误——HSL 隔离肤色单独保护；
5. **别用 LUT 代替校正**：曝光/白平衡错了，LUT 只会放大错误；
6. **测试三件套**：高光裁切、暗部噪点、肤色——三处不炸才算可用。

## AI 调色与 LUT（衔接 14/34 文档）

- **AI 生成调色**：浏览器 AI 工具（如 Luttie AI Grade）可一句话生成风格化 grade 并导出 .cube；
- **提示词调色**（Veo 3 等视频模型）：把 look 写进提示词——"teal and orange grade, cinematic, film grain, anamorphic"（见 28 文档风格提示词）；
- **AI 视频模型 + LUT 后期**：生成素材仍走传统调色——AI 管生成、LUT 管一致性；
- **批量工作流**：AI 批量生成素材 → 统一 LUT 套用 → 品牌一致性（见 32 数据工具复盘）。

## 常见错误

1. Log 素材直接套创意 LUT：色彩错乱（先技术还原）。
2. 用非代表帧做 LUT：换场景就翻车。
3. LUT 当校色器：错误放大。
4. 一套 look 各镜自由调：系列无一致性。
5. 高光/肤色不测就交付：裁切与偏色。
6. 风格无理由：为调而调，叙事断裂。

## 术语表（中英对照）

| 中文 | English | 一句话定义 |
|---|---|---|
| 调色 | Color Grading | 风格化色彩创作 |
| 校色 | Color Correction | 还原真实色彩 |
| 查色表 | LUT | 颜色映射文件 |
| 立方体格式 | .cube | 标准 LUT 格式 |
| 青橙 | Teal & Orange | 阴影青/肤色橙分离 |
| 漂白旁路 | Bleach Bypass | 降饱和高反差 |
| 交叉冲印 | Cross-processing | 化学偏移复古色 |
| 胶片模拟 | Film Emulation | 负片/颗粒还原 |
| 对数 | Log | 高宽容度素材格式 |
| 技术还原 | Technical Conversion | Log→709 |
| HSL 二级 | HSL Secondary | 按色相隔离调整 |
| 高光裁切 | Highlight Clip | 亮度溢出 |
| 强度 | Intensity/Key | LUT 混合强度 |
| 风格锚 | Look | 系列统一外观 |

## 来源

- Luttie: How to Export a Color Grade as a .cube LUT (Any Editor) — https://luttie.app/blog/how-to-export-a-lut-from-your-color-grade
- Luttie: How to Use LUTs in DaVinci Resolve — https://luttie.app/blog/how-to-use-luts-in-davinci-resolve
- Pixflow: DaVinci Resolve LUTs — Import, Apply & Create Custom LUTs — https://pixflow.net/blog/davinci-resolve-luts/
- Pixflow: Teal and Orange Color Grading — https://pixflow.net/blog/teal-and-orange-color-grading/
- FilmSupply: Understanding the Basics of Cinematic Color Grading — https://www.filmsupply.com/articles/cinematic-color-grading/
- COSESAI: Cinematic Color Grading — A Practical Field Guide — https://blog.flowrust.com/2026/08/11/cinematic-color-grading-field-guide-2026-08-11/
- aaapresets: Teal & Orange, Bleach Bypass, and Cross-Processing Explained — https://aaapresets.com/blogs/davinci-resolve-color-grading-gradient-tutorials/unlocking-cinematic-magic-teal-orange-bleach-bypass-and-cross-processing-explained
- Envato Tuts+: How to Make a Custom LUT from Your Grade in Resolve — https://photography.tutsplus.com/tutorials/how-to-make-a-custom-lut-from-your-grade-in-resolve--cms-106805