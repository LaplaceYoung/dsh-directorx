---
type: Reference
title: "AI 视频版权与伦理合规（Copyright & Ethics — Deepfake, Likeness, Provenance & Disclosure）"
description: "AI 视频的版权与伦理合规体系：版权归属（谁拥有什么）、肖像/生物特征授权、AI 生成披露（透明度义务）、来源证明（机器可读标记/水印）、2026 监管时间线（EU AI Act Article 50）"
tags:
  - "production"
  - "copyright"
status: stable
stale_after: "2027-08-18"
generated:
  by: "process:directorx-knowledge-okf"
  at: "2026-08-18T00:00:00Z"
verified:
  - by: "process:knowledge-audit"
    at: "2026-08-18T00:00:00Z"
sources:
  - resource: "cited:Resemble Watermarking Generative AI 2026"
    id: cite-1
    title: "Watermarking Generative AI 2026"
    author: "org:Resemble"
  - resource: "cited:Reuters Copyright Office Deepfake Report"
    id: cite-2
    title: "Copyright Office Deepfake Report"
    author: "org:Reuters"
  - resource: "cited:TechPolicy EU AI Code of Practice Labeling"
    id: cite-3
    title: "EU AI Code of Practice Labeling"
    author: "org:TechPolicy"
  - resource: "cited:Legal500 Synthetic Media Legal Responses"
    id: cite-4
    title: "Synthetic Media Legal Responses"
    author: "org:Legal500"
  - resource: "https://www.resemble.ai/resources/generative-ai-watermarking-opportunities-challenges"
    id: url-1
    title: "resemble.ai"
  - resource: "https://www.reuters.com/legal/legalindustry/report-deepfakes-what-copyright-office-found-what-comes-next-ai-regulation-2024-12-18/"
    id: url-2
    title: "reuters.com"
  - resource: "https://www.techpolicy.press/what-the-eus-new-ai-code-of-practice-means-for-labeling-deepfakes/"
    id: url-3
    title: "techpolicy.press"
  - resource: "https://www.legal500.com/developments/thought-leadership/synthetic-media-and-deepfakes-legal-responses-to-identity-dignity-and-truth-in-the-age-of-ai/"
    id: url-4
    title: "legal500.com"
  - resource: "https://www.duckduckgoose.ai/blog/deepfake-regulation-2026-whats-changing"
    id: url-5
    title: "duckduckgoose.ai"
dx_id: "145"
related:
  - "72-ai-content-compliance/ai-content-compliance.md"
  - "137-digital-human/digital-human.md"
  - "139-docu-knowledge-visuals/docu-knowledge-visuals.md"
  - "131-asset-management/asset-management.md"
---

# AI 视频版权与伦理合规（Copyright & Ethics — Deepfake, Likeness, Provenance & Disclosure）

> 本页为 AI 视频的版权与伦理合规体系：版权归属（谁拥有什么）、肖像/生物特征授权、AI 生成披露（透明度义务）、来源证明（机器可读标记/水印）、2026 监管时间线（EU AI Act Article 50）。知识本体来自 2026 监管分析（Reuters/Resemble/TechPolicy/legal500）。AI 应用面向 DirectorX：合规审查关卡（衔接 72 合规、137 数字人授权、139 再现标注）。
> 来源：Resemble「Watermarking Generative AI 2026」、Reuters「Copyright Office Deepfake Report」、TechPolicy「EU AI Code of Practice Labeling」、Legal500「Synthetic Media Legal Responses」。

## 概述

**核心断言**：AI 视频合规三问——**① 版权/其他权利归谁；② 肖像/生物特征是否授权；③ 是否必须披露合成内容并提供可机读来源证明**。2026 是"从立法到执法"的一年：EU AI Act Article 50 透明义务 2026-08-02 起可执行，美国加州披露规则并行（衔接 72 合规）。

## 核心概念

### 合规三要素

1. **权利（Rights）**：素材/音频版权、训练数据权利、生成内容归属
2. **授权（Consent）**：真人肖像/声音使用需同意（数字孪生授权，137）
3. **披露（Disclosure）**：合成内容标识 + 可机读水印（C2PA 来源证明）

### 2026 关键时间线

| 时间 | 事件 |
|---|---|
| 2026-08-02 | EU AI Act Article 50 透明义务可执行 |
| 持续 | 加州披露规则；C2PA 来源标准推广 |

## 技巧与示例

### 合规审查清单（生成前）

```text
生成前：
  □ 用真人脸/声音？→ 授权书（137）
  □ 用受版权素材/音频？→ 权利确认
  □ 历史/真实人物事件？→ 再现标注（139）
  □ 政治/性/骚扰语境？→ 禁止/额外审查
生成后：
  □ AI 内容标识（可见标签）
  □ 可机读水印（C2PA）
  □ 来源记录（模型/提示词/时间戳）
```

### 来源证明（Provenance）

C2PA 机读标记嵌入元数据：谁生成、用什么模型、何时——**合规与审计的基础**（衔接 131 资产元数据）。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 真人肖像无授权 | 侵权诉讼 | 授权书先行 |
| 合成内容不披露 | 违反 Article 50 | 可见标识 |
| 无水印/来源 | 无法自证 | C2PA 机读标记 |
| 受版权素材直接训练/使用 | 侵权 | 权利确认 |
| 忽视管辖差异 | 跨境风险 | 按发行地合规 |

## 工作流应用（AI 映射）

合规关卡（衔接 72/131/137）：

```text
生成前审查（权利/授权/语境）
  → 生成（合规参数）
  → 生成后（标识 + C2PA 水印 + 来源记录）
  → 入库（131 元数据含来源）
  → 发行地合规检查（管辖差异）
```

**DirectorX 纪律**：授权先行；披露强制；来源可机读；按发行地合规。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 深度伪造 | Deepfake | 逼真合成内容 |
| 肖像权 | Likeness Rights | 形象使用权利 |
| 来源证明 | Provenance | 内容来源记录 |
| 透明度义务 | Transparency Duty | AI 披露义务 |
| 可机读标记 | Machine-Readable Mark | C2PA 水印 |
| 生物特征 | Biometrics | 脸/声音特征 |

## 来源

- Resemble — Rules, Provenance, and Deepfake Risk（EU Article 50 / C2PA）：https://www.resemble.ai/resources/generative-ai-watermarking-opportunities-challenges
- Reuters — Report on Deepfakes: Copyright Office Findings & AI Regulation：https://www.reuters.com/legal/legalindustry/report-deepfakes-what-copyright-office-found-what-comes-next-ai-regulation-2024-12-18/
- TechPolicy — What the EU's New AI Code of Practice Means for Labeling Deepfakes：https://www.techpolicy.press/what-the-eus-new-ai-code-of-practice-means-for-labeling-deepfakes/
- Legal500 — Synthetic Media and Deepfakes: Legal Responses：https://www.legal500.com/developments/thought-leadership/synthetic-media-and-deepfakes-legal-responses-to-identity-dignity-and-truth-in-the-age-of-ai/
- DuckDuckGoose — Deepfake Regulation 2026: What's Changing：https://www.duckduckgoose.ai/blog/deepfake-regulation-2026-whats-changing

## 相关概念

- [AI 内容合规实务（AI Content Compliance）](../72-ai-content-compliance/ai-content-compliance.md)
- [AI 数字人全流程（Digital Human — Avatar Creation, Lip-Sync & Localization）](../137-digital-human/digital-human.md)
- [AI 纪录片与知识类画面（Documentary & Educational Visuals — Archival, Reenactment & Data Viz）](../139-docu-knowledge-visuals/docu-knowledge-visuals.md)
- [AI 素材与资产管理（Asset Management — DAM, Metadata & Reuse）](../131-asset-management/asset-management.md)
