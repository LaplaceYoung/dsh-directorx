# 多模态输入到视频（Multimodal Input to Video — Image / Text / Audio / Reference Combinations）

> 本页为多模态输入的完整组合能力：参考图（I2V）、文本（T2V）、参考视频（R2V）、音频驱动（A2V）、以及组合输入（图+文+音频）——以及参考视频转绘、视频编辑类输入。知识本体来自 2026 统一多模态框架（UniAVGen/UniVideo）与模型实践（Kling O1/MiniMax H3）。AI 应用面向 DirectorX：输入组合决策矩阵（案例 4 图片叙事、案例 8/9 参考视频切片）。
> 来源：CVPR 2026「UniAVGen」、arXiv「UniVideo」、Comfy「MiniMax H3 T2V/I2V/R2V」、Scenario「Kling O1 Family」、Videomaker「Gemini Omni」。

## 概述

**核心断言**：AI 视频的输入正走向**统一多模态**——一个模型接受图/文/音频/参考视频的任意组合，输出声画同步视频。2026 的框架（UniAVGen/UniVideo）把理解、生成、编辑统一到同一管线：**提示词描述意图，参考输入提供事实**。

**输入组合矩阵**是生产决策的核心：不同任务选不同输入组合，组合决定输出可控度。

## 核心概念

### 输入模态矩阵

| 模态 | 缩写 | 输入 | 输出控制 | 典型任务 |
|---|---|---|---|---|
| 文本 | T2V | 提示词 | 低（全靠描述） | 无视觉锚场景 |
| 参考图 | I2V | 图片 | 中高（构图/身份） | 图片转视频、首帧锁定 |
| 参考视频 | R2V | 视频 | 高（动作/结构转绘） | 动作转绘、风格迁移、视频续写 |
| 音频驱动 | A2V | 音频 | 高（口型/节拍） | 对口型、音乐可视化 |
| 组合 | 多模态 | 图+文+音频 | 最高 | 品牌广告、角色+场景+台词 |

### 统一框架（UniAVGen 范式）

- 参考图 + 文本提示 + 语音内容 → 声画同步视频（参考音频控制音色）
- 视频编辑：理解指令 → 精确编辑指定部分（不是整段重生成）

## 技巧与示例

### 组合输入示例（品牌广告）

```text
输入：产品图（I2V 参考）+ 文案（T2V 提示）+ 旁白音频（A2V 音色）
  → 模型：以产品图为身份锚，按文案生成镜头，旁白驱动口型/节奏
  → 输出：声画同步的品牌短片
```

### 参考视频转绘（R2V）

输入一段参考视频 → 保留动作/结构 → 换风格/主体（动作转绘）。**用例**：案例 9（YouTube 长转短——参考片段的动作保持）、舞蹈翻跳、运镜复用。

### 视频编辑作为输入（UniVideo）

"把这段里的杯子换成杯子 B"——指令式编辑：模型理解意图并精确修改局部，不是整段重生成。**这是后期修复（118）的终极形态**。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 有参考图却纯文本生成 | 白丢可控度 | 有视觉锚就用 I2V/组合 |
| 忽略音频输入 | 口型/节奏分离 | 需要语音时带音频输入 |
| 参考视频不加提示 | 只转动作不转意图 | R2V + 明确提示词 |
| 把编辑当生成 | 局部改动变全片重生成 | 用指令式编辑 |
| 组合过多无主次 | 输出混乱 | 定主锚（身份/场景/音频之一） |

## 工作流应用（AI 映射）

输入组合决策矩阵（案例 4/8/9 统一依据）：

```text
任务判定 → 输入组合选择
  图片叙事 → I2V（图为主锚）+ 旁白音频
  口播/数字人 → A2V（音频为主时钟）
  长视频切片 → R2V（参考视频结构）
  品牌广告 → 组合（产品图 + 文案 + 旁白）
  → 生成 → 审查（118 缺陷 + 111 对照输入审查）
```

**DirectorX 纪律**：有视觉/音频素材时优先作为参考输入，不降级为纯文本；输入组合在生成前声明（衔接生成门控）。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 文本到视频 | Text-to-Video（T2V） | 提示词生成 |
| 图像到视频 | Image-to-Video（I2V） | 参考图生成 |
| 参考视频到视频 | Reference-to-Video（R2V） | 视频转绘/续写 |
| 音频到视频 | Audio-to-Video（A2V） | 音频驱动 |
| 统一多模态 | Unified Multimodal | 多输入单模型 |
| 指令式编辑 | Instruction-Based Editing | 局部精确修改 |
| 声画同步 | Audio-Visual Sync | 声音与画面一致 |

## 来源

- CVPR 2026 — UniAVGen: Unified Audio and Video Generation：https://openaccess.thecvf.com/content/CVPR2026/papers/Zhang_UniAVGen_Unified_Audio_and_Video_Generation_with_Asymmetric_Cross-Modal_Interactions_CVPR_2026_paper.pdf
- arXiv — UniVideo: Unified Understanding, Generation, and Editing：https://arxiv.org/html/2510.08377v4
- Comfy — MiniMax H3: T2V, I2V, and R2V Video Workflows：https://docs.comfy.org/tutorials/video/minimax/minimax-h3
- Scenario — Kling O1 Family: Unified Multimodal Video Model：https://help.scenario.com/articles/3906786894-kling-o1-family-the-essentials
- Videomaker — Gemini Omni Generative AI：https://www.videomaker.com/how-to/editing/workflow/googles-new-gemini-omni-generative-ai-could-revolutionize-video-creation/