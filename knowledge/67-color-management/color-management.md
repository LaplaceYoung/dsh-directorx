---
type: Playbook
title: "色彩管理全链路（Color Management Pipeline）"
description: "色彩管理手册：色彩管理三大目标、管线四要素（输入/工作/输出变换/显示）、价值三角、位深要求、六个阶段（前期/校准/现场/日报/VFX/调色与档案）、ACES/OCIO 体系"
tags:
  - "production"
  - "color"
  - "workflow"
  - "vfx"
status: stable
generated:
  by: "process:directorx-knowledge-okf"
  at: "2026-08-18T00:00:00Z"
verified:
  - by: "process:knowledge-audit"
    at: "2026-08-18T00:00:00Z"
sources:
  - resource: "cited:Netflix Partner Help Center（色彩管理官方指南）"
    id: cite-1
    title: "Netflix Partner Help Center（色彩管理官方指南）"
  - resource: "cited:RED 色彩管理"
    id: cite-2
    title: "RED 色彩管理"
  - resource: "cited:索尼摄像机一致性流程"
    id: cite-3
    title: "索尼摄像机一致性流程"
  - resource: "cited:DaVinci ACES 指南。"
    id: cite-4
    title: "DaVinci ACES 指南。"
  - resource: "https://partnerhelp.netflixstudios.com/hc/en-us/articles/360025502033-What-is-Color-Management"
    id: url-1
    title: "partnerhelp.netflixstudios.com"
  - resource: "https://partnerhelp.netflixstudios.com/hc/en-us/articles/360002088888-Color-Managed-Workflow-in-Resolve-ACES"
    id: url-2
    title: "partnerhelp.netflixstudios.com"
  - resource: "https://partnerhelp.netflixstudios.com/hc/en-us/articles/360002056848-Color-Managed-Workflow-in-Baselight"
    id: url-3
    title: "partnerhelp.netflixstudios.com"
  - resource: "https://www.red.com/red-101/cinema-color-management"
    id: url-4
    title: "red.com"
  - resource: "https://www.sonystyle.com.cn/professional/solution/news/news_260731_1.html"
    id: url-5
    title: "sonystyle.com.cn"
  - resource: "https://cinehello.com/stream/immerse/151334"
    id: url-6
    title: "cinehello.com"
dx_id: "67"
related:
  - "20-color-practice/color-practice-davinci.md"
  - "26-vfx-compositing/vfx-compositing.md"
  - "36-color-luts/color-luts.md"
---

# 色彩管理全链路（Color Management Pipeline）

> 本页是 DirectorX 色彩管理手册：色彩管理三大目标、管线四要素（输入/工作/输出变换/显示）、价值三角、位深要求、六个阶段（前期/校准/现场/日报/VFX/调色与档案）、ACES/OCIO 体系。与 20 DaVinci / 36 LUT / 50 混合光衔接。
> 来源：Netflix Partner Help Center（色彩管理官方指南）、RED 色彩管理、索尼摄像机一致性流程、DaVinci ACES 指南。

## 概述

**"色彩管理"对不同人含义不同**：对简单项目=Rec.709 拍摄+校准 709 监看+上传 ProRes；对高端 VFX=ACES 场景参考空间+OpenColorIO 转换+合成+DPX/EXR 送 DI。本文采用 Netflix 定义。

**Netflix 色彩管理三大目标**：
1. **可预测可重复**地查看与转换不同色彩空间——创作意图贯穿制作与后期；
2. 所有色彩决策与 VFX 在**场景参考色彩空间（Scene-Referred）**完成——最大化后期创作灵活性；
3. 画面档案母版**高质量且面向未来**（可复用/可重制）。

## 管线四要素（色彩管线=定义+转换+交付物）

```
输入色彩空间 → 工作色彩空间 → [输出变换] → 显示色彩空间
```

| 要素 | 定义 | 示例 |
|---|---|---|
| 输入色彩空间 | 采集设备/源的色彩空间 | Sony SLog3/SGamut3.cine、RED Log3G10/WideGamutRGB、ARRI LogC/WideGamut、档案素材 Rec.709/sRGB |
| 工作色彩空间 | 图像操作发生的空间（**操作前先转换进来**） | 同输入系列或 ACES——设计为存全部动态范围与色彩信息，**裸眼看会"不对"** |
| 输出变换 | 工作→显示的约定转换（观看 LUT/创意 LUT） | 调色师创意 LUT、ARRI 709 LUT——既是剧集"look"基础，又保护工作空间全动态范围 |
| 显示色彩空间 | 显示器支持的空间 | Rec.709/BT.1886、PQ(P.2084) P3-D65、Rec.2020 |

**关键**：输出变换只在交付流里烘焙（如 Rec.709 流媒体母版）；**档案母版（NAM）保持 Log/场景参考空间**——不烘焙。

## 价值三角

1. **图像信心与信任**：各方对齐管线 → 少花时间排障，多花时间创作决策；色彩返工极贵；
2. **观看灵活性**：同一管线支持 SDR/HDR、监视器/投影仪一致呈现；
3. **档案元素**：工作空间含全部采集信息 → 旧季素材可直接接入新季、VFX 元素跨项目复用、母版可重制。

## 一般要求（专业系统基线）

- **一致转换**：ACES 定义转换本身；OCIO 让实现跨软件一致+自定义管线共享——VFX 行业已充分采用，现场/剪辑/调色软件仍需推进；
- **位深**：SDR 专业系统 **10-bit 为最低**；HDR **12-bit**；理想为浮点（16-bit half/32-bit full）——避免裁切与破坏性操作；线性表示与复杂操作需要高精度。

## 六个阶段（各环节职责）

| 阶段 | 动作 | 关键物 |
|---|---|---|
| 前期沟通 | 定主摄影机后尽早与 DP/DIT/调色师/VFX 对齐：录制格式？工作空间？ACES 与否？约定 show LUT？ | 管线共识 |
| 显示校准 | 所有显示器校准到行业标准（Netflix Color Critical Calibration Guidelines） | 校准目标 |
| 现场监看 | 最关键的色彩判断现场：视频信号路径+CDL+LUT 盒+校准监视器；**非破坏可重复** | 现场 CDL |
| 日报与剪辑 | 同一 RAW 文件生成烘焙日报与剪辑介质；现场 CDL+同一 show LUT **在同一工作空间**应用——剪辑看到与现场一致的颜色 | ASC CDL→ALE→Avid |
| 视觉特效 | VFX 收到管线文档：底板色彩编码格式（16-bit EXR 等）、色彩"配方"（CDL+LUT+工作空间）、参照帧——场景参考空间合成，返回匹配 | VFX 配方包 |
| 最终调色与档案 | 线上回原档（OCF）+调色；调色师拿到日报 CDL+LUT 作起点；**在工作空间内、输出变换之前调色**（顺序即一切）；交付 NAM 档案母版（统一色彩空间） | NAM |

## ACES/OCIO 实用要点

- **ACES 路线**：图像保持在 HDR+广色域空间，按目标显示选择 Output Transform——DaVinci 里 ACES Setup/Deliveries 两段配置（→ 20 文档节点流程衔接）；
- **非 ACES 路线**：在主摄影机色彩空间工作+谨慎主动管理+转换与观看 LUT——同样可达成；
- **DaVinci 色彩管理常见错**（影视工业网对照清单）：输入空间选错、输出变换重复烘焙、节点顺序错位、位深降级；
- **vivo/手机 Log**（少数派）：手机 Log 的色彩空间转换同样遵循输入→工作→输出（→ 30 手机制作衔接）。

## 常见错误

1. 输出变换提前烘焙：破坏全动态范围，后期/VFX 灵活性归零。
2. 显示器不校准：所有色彩决策无意义。
3. 现场与日报用不同 LUT/工作空间：剪辑看到的颜色和现场不一致。
4. VFX 不给配方：返回镜头颜色不匹配。
5. 8-bit 处理：条带/裁切。
6. 调色在输出变换之后：决策被锁死。
7. 各环节各说各话：返工最贵。

## 术语表（中英对照）

| 中文 | English | 一句话定义 |
|---|---|---|
| 色彩管理 | Color Management | 可预测色彩管线 |
| 场景参考 | Scene-Referred | 存全动态范围 |
| 显示参考 | Display-Referred | 面向显示器 |
| 输入色彩空间 | Input Color Space | 源定义 |
| 工作色彩空间 | Working Color Space | 操作空间 |
| 输出变换 | Output Transform | 观看/交付转换 |
| 显示色彩空间 | Display Color Space | 目标空间 |
| 校色决策表 | CDL | 现场色彩传递 |
| 档案母版 | NAM | 非调色档案 |
| 学术色彩编码 | ACES | 开放色彩标准 |
| 开放色彩 IO | OCIO | 跨软件实现 |
| 位深 | Bit Depth | 精度底线 |

## 来源

- Netflix Partner Help Center: What is Color Management? — https://partnerhelp.netflixstudios.com/hc/en-us/articles/360025502033-What-is-Color-Management
- Netflix Partner Help Center: Color Managed Workflow in Resolve — ACES — https://partnerhelp.netflixstudios.com/hc/en-us/articles/360002088888-Color-Managed-Workflow-in-Resolve-ACES
- Netflix Partner Help Center: Color Managed Workflow in Baselight — https://partnerhelp.netflixstudios.com/hc/en-us/articles/360002056848-Color-Managed-Workflow-in-Baselight
- RED: Color Management with Cinema（RED 101） — https://www.red.com/red-101/cinema-color-management
- 索尼专业: 摄像机一致性调整标准流程参考指南 — https://www.sonystyle.com.cn/professional/solution/news/news_260731_1.html
- 影视工业网: 达芬奇色彩管理老出错？来对照这篇检查 — https://cinehello.com/stream/immerse/151334
- 少数派: 一日一技——如何正确进行 vivo Log 的色彩空间转换 — https://sspai.com/post/108101
- Apple: HDR and Wide Color Gamut in Final Cut Pro — https://www.apple.com.cn/final-cut-pro/docs/HDR_WideColor.pdf

## 相关概念

- [调色实操与 DaVinci 流程（Color Practice & DaVinci）](../20-color-practice/color-practice-davinci.md)
- [特效与合成基础（VFX & Compositing）](../26-vfx-compositing/vfx-compositing.md)
- [调色风格与 LUT 制作（Color Grading & LUT Creation）](../36-color-luts/color-luts.md)
