---
type: Reference
title: "AI 视频交付母版管理（Master Management — Mezzanine, Versioning & Archive）"
description: "AI 视频的交付母版管理：母版/工作文件分离、中间格式（Mezzanine）策略、版本控制、归档工作流（摄取→组织→标签→审阅→分发→归档）、代理文件与逐帧审阅"
tags:
  - "consistency"
  - "workflow"
  - "platform"
status: stable
stale_after: "2027-08-18"
generated:
  by: "process:directorx-knowledge-okf"
  at: "2026-08-18T00:00:00Z"
verified:
  - by: "process:knowledge-audit"
    at: "2026-08-18T00:00:00Z"
sources:
  - resource: "cited:Cloudinary Video Asset Management Best Practices"
    id: cite-1
    title: "Video Asset Management Best Practices"
    author: "org:Cloudinary"
  - resource: "cited:Acquia Mezzanine File Format"
    id: cite-2
    title: "Mezzanine File Format"
    author: "org:Acquia"
  - resource: "cited:Aprimo DAM for Video Production"
    id: cite-3
    title: "DAM for Video Production"
    author: "org:Aprimo"
  - resource: "cited:Telestream QC for File-Based Workflows"
    id: cite-4
    title: "QC for File-Based Workflows"
    author: "org:Telestream"
  - resource: "https://cloudinary.com/guides/digital-asset-management/video-asset-management-best-practices"
    id: url-1
    title: "cloudinary.com"
  - resource: "https://www.acquia.com/blog/the-mezzanine-storing-video-in-your-digital-asset-management-system"
    id: url-2
    title: "acquia.com"
  - resource: "https://www.aprimo.com/blog/digital-asset-management-for-video-a-guide-to-streamlining-workflows"
    id: url-3
    title: "aprimo.com"
  - resource: "https://www.telestream.net/pdfs/general/Quality-Control-for-File-Based-Video-Workflows-25W608940.pdf"
    id: url-4
    title: "telestream.net"
  - resource: "https://www.brandlife.io/blog/digital-asset-management-software-for-video"
    id: url-5
    title: "brandlife.io"
dx_id: "185"
related:
  - "131-asset-management/asset-management.md"
  - "112-delivery-specs/delivery-specs.md"
  - "157-team-collaboration/team-collaboration.md"
  - "174-qc-automation/qc-automation.md"
---

# AI 视频交付母版管理（Master Management — Mezzanine, Versioning & Archive）

> 本页为 AI 视频的交付母版管理：母版/工作文件分离、中间格式（Mezzanine）策略、版本控制、归档工作流（摄取→组织→标签→审阅→分发→归档）、代理文件与逐帧审阅。知识本体来自 2026 视频 DAM 指南（Cloudinary/Acquia/Aprimo/Brandlife）。AI 应用面向 DirectorX：交付后管理（衔接 131 资产管理、112 交付、157 协作版本、174 QC）。与 131 分工：本页为交付母版/Mezzanine/归档专项，131 为生成资产 DAM 总纲（元数据/版本化/复用）。
> 来源：Cloudinary「Video Asset Management Best Practices」、Acquia「Mezzanine File Format」、Aprimo「DAM for Video Production」、Telestream「QC for File-Based Workflows」。

## 概述

**核心断言**：母版管理 = **母版与工作文件分层 + 中间格式省存储 + 版本可追溯**——母版（Master）是最终权威，中间格式（Mezzanine）以小体积保质量供工作流使用，代理（Proxy）供快审。**DAM 六阶段（摄取→组织→标签→审阅→分发→归档）**是视频资产的标准生命周期（衔接 131 资产管理的交付深化）。

## 核心概念

### 文件三层次

```
① 母版 Master：最终权威（高规格，112）
② 中间格式 Mezzanine：小体积高质量（工作流使用，后续重链母版）
③ 代理 Proxy：低清快审（逐帧审阅）
```

### DAM 六阶段（视频）

```text
摄取 Ingest → 组织 Organize（目录结构）
→ 标签 Tag（元数据）→ 审阅 Review（代理+逐帧）
→ 分发 Distribute（多平台，156）→ 归档 Archive
```

## 技巧与示例

### 版本控制纪律

```text
命名规范（版本号/日期/状态）
母版锁定（交付后不覆盖）
生成配方随版本（138 提示词/种子/参数）
审阅批注绑定版本（157）
```

### Mezzanine 策略（Acquia）

母版存高规格原文件；工作流用 Mezzanine（H.264/ProRes 代理级）——**省存储不损质量**，最终分发时重链母版。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 母版工作文件混放 | 版本混乱 | 三层次分离 |
| 无元数据标签 | 无法检索 | 标签规范 |
| 版本无命名 | 覆盖风险 | 版本号+锁定 |
| 全量存母版 | 存储爆炸 | Mezzanine |
| 归档无 QC | 资产损坏 | 归档前校验（174） |

## 工作流应用（AI 映射）

交付管理（衔接 112/131/157/174）：

```text
成片 → 母版（112 规格）→ Mezzanine/代理生成
  → DAM 六阶段（标签/审阅/分发）
  → 版本控制（配方随版本）
  → 归档（QC 校验 174）→ 复用（131）
```

**DirectorX 纪律**：母版/Mezzanine/代理三层分离；版本锁定防覆盖；元数据保检索；归档前 QC。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 母版 | Master | 最终权威文件 |
| 中间格式 | Mezzanine | 小体积高质量 |
| 代理文件 | Proxy | 低清快审 |
| 重链 | Relinking | 工作流→母版 |
| 元数据 | Metadata | 检索标签 |
| 归档 | Archive | 长期保存 |

## 来源

- Cloudinary — A Practical Guide for Managing Media: Video Asset Management：https://cloudinary.com/guides/digital-asset-management/video-asset-management-best-practices
- Acquia — Storing Video in Your DAM with the Mezzanine File Format：https://www.acquia.com/blog/the-mezzanine-storing-video-in-your-digital-asset-management-system
- Aprimo — Digital Asset Management for Video Production：https://www.aprimo.com/blog/digital-asset-management-for-video-a-guide-to-streamlining-workflows
- Telestream — Quality Control for File-Based Video Workflows：https://www.telestream.net/pdfs/general/Quality-Control-for-File-Based-Video-Workflows-25W608940.pdf
- Brandlife — Digital Asset Management for Video: Complete Guide：https://www.brandlife.io/blog/digital-asset-management-software-for-video

## 相关概念

- [AI 素材与资产管理（Asset Management — DAM, Metadata & Reuse）](../131-asset-management/asset-management.md)
- [电影级交付规格（Delivery Specs — Color / Audio / Master Standards）](../112-delivery-specs/delivery-specs.md)
- [AI 视频团队协作与版本管理（Team Collaboration — Review, Version Control & Approval Workflow）](../157-team-collaboration/team-collaboration.md)
- [AI 成片质检自动化（QC Automation — Artifact Detection & Review Pipeline）](../174-qc-automation/qc-automation.md)
