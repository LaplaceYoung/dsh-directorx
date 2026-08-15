# AI 视频评测与基准方法学（AI Video Evaluation — Benchmarks, Metrics & Human Eval）

> 本页为 AI 视频系统评测的方法学：多维评测框架（视觉保真/时间连贯/物理有效性/美学/安全）、自动指标与人类评测的结合、可用评测协议（同提示词横评/接受率）。知识本体来自 2025-2026 评测基准论文（Video-Bench/EvalCrafter/arXiv Survey/MDPI）。AI 应用面向 DirectorX：模型评测与生产质检的方法论（衔接 114 模型矩阵与横评、118 缺陷、122 接受率）。
> 来源：CVPR「Video-Bench Human-Aligned Benchmark」、CVPR「EvalCrafter」、arXiv「A Survey of AI-Generated Video Evaluation」、OpenReview「The Evaluation Imperative」、MDPI「Quality Evaluation for AI-Generated Videos」。

## 概述

**核心断言**：AI 视频评测不是"好看与否"的主观判断，而是**多维框架**——视觉保真、时间连贯、物理有效性、美学质量、安全合规各维度独立打分。**自动指标必须用人类评测校验对齐**（Human-Aligned）：指标和人的感知不一致时，指标要调。

## 核心概念

### 多维评测框架（EvalCrafter/Video-Bench）

| 维度 | 内容 | 自动/人工 |
|---|---|---|
| 视觉保真（Visual Fidelity） | 清晰度/纹理/光照真实 | 自动+人工 |
| 时间连贯（Temporal Coherence） | 运动平滑/闪烁/光流一致 | 自动 |
| 物理有效（Physical Validity） | 重力/碰撞/物质交互 | 人工为主 |
| 主体/背景一致 | 身份/场景跨帧稳定 | 自动+人工 |
| 运动平滑度 | 动态自然度 | 自动 |
| 美学质量 | 构图/色彩/风格 | 人工 |
| 信任与安全 | 深度伪造/有害内容 | 自动+人工 |

### 时间维度指标（自动）

- **运动平滑度（Motion Smoothness）**：帧间运动连续性
- **时间闪烁（Temporal Flicker）**：跨帧光照/纹理抖动
- **光流一致性（Optical-Flow Consistency）**：运动向量连贯
- **动态程度（Dynamic Degree）**：画面运动量

## 技巧与示例

### 可用评测协议（生产适用）

```text
同提示词横评（52 模式）
  → 每模型 N 次生成（同种子/同提示词）
  → 多维打分（保真/连贯/物理/美学）
  → 接受率统计（可用件/生成件）
  → 人工校验（自动分与主观感知是否一致）
  → 输出：模型对比表 + 每模型失败模式
```

### 生产质检的简化维度（衔接 118/122）

生产用四维质检：身份一致 / 运动自然 / 物理可信 / 规格合规——前三维对应 118 缺陷扫描，第四维对应 112 规格。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 只看单次生成 | 样本偏差 | 同提示词多次横评 |
| 只信自动指标 | 与感知脱节 | 人工校验对齐 |
| 忽略物理维度 | 穿帮频发 | 物理有效性单独评 |
| 无接受率统计 | 无法横向比 | 接受率是核心产出 |
| 评测只看一次 | 无法定位失败模式 | 按失败模式归因（118） |

## 工作流应用（AI 映射）

模型选型与质检的方法论（衔接 114/122）：

```text
评测需求（选型/质检）
  → 评测协议（同提示词横评/生产四维质检）
  → 多维打分（保真/连贯/物理/美学）
  → 接受率 + 失败模式归因
  → 人工校验 → 决策（选模型/换参数/修模板）
```

**DirectorX 纪律**：评测用固定协议（同提示词/多维/接受率）；自动指标须人工校验；失败归因到模式而非笼统"不好"。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 视觉保真 | Visual Fidelity | 画面真实度 |
| 时间连贯 | Temporal Coherence | 跨帧稳定 |
| 物理有效性 | Physical Validity | 物理常识正确 |
| 运动平滑度 | Motion Smoothness | 运动自然度 |
| 光流一致性 | Optical-Flow Consistency | 运动向量连贯 |
| 人类对齐评测 | Human-Aligned Benchmark | 指标与感知对齐 |
| 接受率 | Acceptance Rate | 可用件占比 |
| 失败模式 | Failure Mode | 缺陷类型归因 |

## 来源

- CVPR 2025 — Video-Bench: Human-Aligned Video Generation Benchmark：https://openaccess.thecvf.com/content/CVPR2025/papers/Han_Video-Bench_Human-Aligned_Video_Generation_Benchmark_CVPR_2025_paper.pdf
- CVPR 2024 — EvalCrafter: Benchmarking Large Video Generation Models：https://openaccess.thecvf.com/content/CVPR2024/papers/Liu_EvalCrafter_Benchmarking_and_Evaluating_Large_Video_Generation_Models_CVPR_2024_paper.pdf
- arXiv — A Survey of AI-Generated Video Evaluation：https://arxiv.org/html/2410.19884v1
- OpenReview — The Evaluation Imperative for Video Generative Models：https://openreview.net/pdf?id=dLaNB7vF2a
- MDPI — A Perspective on Quality Evaluation for AI-Generated Videos：https://www.mdpi.com/1424-8220/25/15/4668