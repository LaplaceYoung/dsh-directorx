# AI 视频团队协作与版本管理（Team Collaboration — Review, Version Control & Approval Workflow）

> 本页为 AI 视频团队的协作体系：版本控制的时间线、审阅批注绑定具体资产、模型/提示词来源（Provenance）、审批工作流、交付导出状态管理。知识本体来自 2026 协作工具指南（LTX/Ziflow/LucidLink/MergeMate）。AI 应用面向 DirectorX：团队项目协作（衔接 131 资产管理、109 场记、113 审片）。
> 来源：LTX「Best AI Video Workflow Guide & Tool Stack 2026」、Ziflow「Video Review Software Compared」、MergeMate「AI Video Approval Workflow」、LucidLink「Video Collaboration Tools」。

## 概述

**核心断言**：AI 视频团队协作的核心是**版本与审阅的状态同步**——时间线版本化、批注绑定具体资产、生成来源可追溯、审批与交付状态关联。**手工作坊式交接是最大时间黑洞**（工具切换/找版本/评论对不上）。

## 核心概念

### 协作四要素（MergeMate）

1. **版本控制**：时间线分支/版本化，防混乱
2. **审阅批注**：评论绑定具体资产/时间码（衔接 109 场记、112 版本锁定）
3. **来源追溯**：模型/提示词/参数记录（Provenance，131/145）
4. **审批交付**：审批状态 ↔ 交付状态同步

### AI 协作特殊性

生成资产（提示词/种子/参数）也是可版本化对象（衔接 138）——**"生成配方"进版本库**，复现/回滚都有据。

## 技巧与示例

### AI 视频协作工作流

```text
简报（106）→ 资产库（131）
  → 生成（配方入库：提示词/种子/参数）
  → 版本化时间线（分支管理）
  → 审阅（批注绑定时间码/资产）
  → 迭代（按批注重新生成/调整）
  → 审批 → 交付（导出状态锁定）
```

### 防"评论对不上版本"

每个审阅轮次锁定版本号——批注绑定版本快照，迭代后自动关联新版本（衔接 112 版本锁定）。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 版本无管理 | 分支混乱 | 时间线版本化 |
| 评论无绑定 | 对不上版本 | 批注绑定资产 |
| 生成配方不存 | 无法复现 | 配方入库（138/131） |
| 审批交付脱节 | 交付错版 | 状态同步 |
| 工具切换频繁 | 时间黑洞 | 一体化工作流 |

## 工作流应用（AI 映射）

团队项目（衔接 106/112/131）：

```text
简报 → 资产/配方库 → 生成（配方记录）
  → 版本化时间线 → 审阅批注（绑定）
  → 迭代 → 审批 → 交付（状态锁定）
```

**DirectorX 纪律**：版本与审阅状态同步；批注绑定具体资产；生成配方可复现；审批交付联动。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 版本控制 | Version Control | 时间线版本化 |
| 审阅批注 | Review Comments | 绑定资产的评论 |
| 来源追溯 | Provenance | 生成来源记录 |
| 审批工作流 | Approval Workflow | 审批准入 |
| 交付状态 | Delivery State | 导出锁定 |
| 生成配方 | Generation Recipe | 提示词/种子/参数 |

## 来源

- LTX — The Best AI Video Workflow Guide & Tool Stack (2026)：https://ltx.io/blog/ai-video-workflow
- MergeMate — AI Video Approval Workflow for Creative Teams：https://mergemate.ai/blog/ai-video-approval-workflow
- Ziflow — Video Review Software: 6 Tools Compared：https://www.ziflow.com/blog/video-review-software
- LucidLink — Best Video Review & Collaboration Tools：https://www.lucidlink.com/blog/video-collaboration
- LTX — Best Enterprise Collaboration Tools for Creative Teams：https://ltx.io/blog/best-enterprise-collaboration-tools