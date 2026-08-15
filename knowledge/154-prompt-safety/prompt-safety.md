# AI 视频提示词安全防护（Prompt Safety — Injection, Jailbreak & Layered Guardrails）

> 本页为 AI 视频生成的提示词安全防护：提示注入（Prompt Injection）、越狱攻击（Jailbreak）、视觉指令注入（Visual Instruction Injection）、分层护栏（输入/输出/运行时）。知识本体来自 2026 安全研究（Red Hat/arXiv/微软）。AI 应用面向 DirectorX：生成安全关卡（衔接 145 合规、72 内容政策、131 资产来源）。
> 来源：Red Hat「Defending Against Prompt Injection」、arXiv「Low-Effort Jailbreak Attacks」、arXiv「VII: Visual Instruction Injection」、微软「Jailbreak Detection」。

## 概述

**核心断言**：AI 视频生成同样面临提示词攻击——**恶意意图伪装成良性提示/画面绕过安全过滤器**。防护 = 分层护栏（输入/输出/运行时）+ 越狱检测器。文本到视频（T2V）与图像到视频（I2V）均有攻击面，视觉指令注入（VII）可在图像中隐藏恶意指令。

## 核心概念

### 攻击向量

| 攻击 | 描述 | 攻击面 |
|---|---|---|
| 提示注入 | 良性提示内嵌恶意指令 | 输入文本 |
| 越狱 | 绕过安全过滤器 | 输入文本 |
| 视觉指令注入（VII） | 图像内嵌恶意指令 | I2V 输入图像 |
| 文档注入 | 引用的文档携带指令 | 文档/上下文 |

### 分层护栏（Red Hat 纵深防御）

```text
输入护栏（提示词审查/分类器检测）
  → 输出护栏（生成内容审查）
  → 运行时护栏（行为监控/操作限制）
```

## 技巧与示例

### 生成安全关卡（集成到管线）

```text
提示词审查（分类器：有害/越狱检测）
  → 视觉输入审查（VII 检测：图像内含文本指令？）
  → 生成（安全参数）
  → 输出审查（内容分类器复核）
  → 记录审计（来源/时间戳，145）
```

### 检测要点（微软 Prompt Shields）

- 用户提示注入检测（伪装指令）
- 文档攻击检测（上下文注入）
- 越狱模式识别（绕过表述）

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 只有输入过滤 | 输出绕过 | 输入+输出+运行时 |
| 忽略图像输入 | VII 攻击 | 视觉输入审查 |
| 无审计记录 | 无法追溯 | 记录来源（145） |
| 过滤器一刀切 | 误伤正常内容 | 分层分级策略 |
| 单点依赖 | 单点失败 | 纵深防御 |

## 工作流应用（AI 映射）

生成安全关卡（衔接 72/145/131）：

```text
提示词入口 → 审查（注入/越狱检测）
  → 视觉输入审查（VII）→ 生成
  → 输出复核 → 审计记录（131 元数据）
  → 违规处置（拒绝/降级）
```

**DirectorX 纪律**：分层护栏纵深防御；视觉输入同样审查；审计可追溯；误伤与漏放平衡。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 提示注入 | Prompt Injection | 内嵌恶意指令 |
| 越狱 | Jailbreak | 绕过安全过滤器 |
| 视觉指令注入 | Visual Instruction Injection | 图像内嵌指令 |
| 分层护栏 | Layered Guardrails | 纵深防御 |
| 内容分类器 | Content Classifier | 内容检测模型 |
| 审计 | Audit Trail | 可追溯记录 |

## 来源

- Red Hat — AI Security: Defending Against Prompt Injection and Unsafe Actions：https://www.redhat.com/en/blog/ai-security-defending-against-prompt-injection-and-unsafe-actions
- arXiv — Low-Effort Jailbreak Attacks Against Text-to-Image Safety（2604.01888）：https://arxiv.org/html/2604.01888v1
- arXiv — VII: Visual Instruction Injection for Jailbreaking Image-to-Video（2602.20999）：https://arxiv.org/html/2602.20999v1
- arXiv — Jailbreaking Attacks vs. Content Safety Filters（2512.24044）：https://arxiv.org/html/2512.24044v1
- Microsoft — Jailbreak Detection（Prompt Shields）：https://learn.microsoft.com/en-us/azure/ai-services/content-safety/concepts/jailbreak-detection