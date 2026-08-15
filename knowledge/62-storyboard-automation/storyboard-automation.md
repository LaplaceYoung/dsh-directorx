# 分镜图端到端自动化管线（Storyboard Automation Pipeline）

> 本页是 DirectorX 分镜自动化手册：四 Agent 自主管线架构（剧本分析师/摄影师/美术指导/渲染引擎）、LangGraph 编排、输出契约（PNG+JSON 可复现）、开源模型选型、ComfyUI 工作流生态、端到端管线验收标准。与 48 短剧工厂 / 53 镜头表转换 / 40 分镜 SOP 衔接。
> 来源：Petra 开源管线（AMD/LangGraph）、ComfyUI storyboard 工作流、BigBanana AI 导演、ReelAgent。

## 概述

**自主分镜管线**：把纯文本叙事脚本转成风格一致的分镜帧序列——无需人工把脚本手动转成分镜。四 Agent 协作 + 有状态编排 = 每帧携带完整生成参数，可复现。

**核心价值**：
1. **领域知识分层注入**：每个阶段（剧本→场景→镜头规格→风格提示词→帧）由对应专家 Agent 处理，而不是一个"万能提示词"；
2. **可复现性内置**：PNG 帧 + 机器可读 metadata.json（每个生成参数）——回炉/审查/版本对比有据可依（→ 40 日志契约的自动化版）；
3. **开源全栈**：FLUX/SDXL + Llama/Qwen——无闭源依赖，AMD ROCm 可跑。

## 四 Agent 架构（Petra 参考实现）

| Agent | 职责 | 输出 |
|---|---|---|
| 剧本分析师 Script Analyst | 拆分为场景、提取情绪基调、节奏、核心动作 | 场景分解 |
| 摄影师 Cinematographer | 确定技术构图：景别/机位/运镜/取景 | 镜头规格 |
| 美术指导 Art Director | 注入艺术运动/色彩哲学/光线风格 | 风格化提示词 |
| 渲染引擎 Render Engine | 顺序生成帧 + 角色一致性 | 分镜帧 PNG |

**编排层（LangGraph）**：状态图（State Graph）——检查点、条件分支、未来并行执行；每阶段用领域知识丰富数据（→ 53 映射表可作为摄影师 Agent 的规则库）。

**数据流**：
```
Script → Scene Breakdown → Shot Specifications → Stylized Prompts → Storyboard Frames
```

**输出结构**：
```
output/
├── frames/
│   ├── scene_001_shot_001.png
│   └── ...
├── metadata.json      ← 每个生成参数（可复现）
└── pipeline_report.json
```

## 模型选型（开源）

**语言模型（三个分析 Agent）**：

| 模型 | 大小 | VRAM | 适用 |
|---|---|---|---|
| Llama 3.1 8B | 8B | ~16GB | 剧本分析（快、够用） |
| Qwen3.5 122B (FP8) | 122B | ~70GB | 镜头规划+美术指导（最佳质量） |
| Qwen2 7B / Mistral 7B | 7B | ~14GB | 本地轻量测试 |

**图像模型（渲染 Agent）**：

| 模型 | 许可证 | VRAM | 质量/速度 |
|---|---|---|---|
| FLUX.1-schnell | Apache 2.0 | ~12GB | 高质量、快（4 步） |
| SDXL | MIT | ~8GB | 良好、广泛支持 |
| SD3.5 Medium | MIT | ~12GB | 高质量 |
| FLUX.2-dev | 非商用 | ~24GB | 极高、慢 |

## ComfyUI 工作流生态

| 项目 | 用途 |
|---|---|
| comfy.org Storyboard to Video（Seedance 2.0） | 分镜帧→视频生成官方工作流 |
| artokun/comfyui-mcp director skill | MCP 驱动的"导演"命令（分镜规划/运镜指令） |
| colorAi/comfyui-storyboard | 分镜专用 ComfyUI 节点 |
| GuusF/comfyui-weaver | 工作流织机（组合管线） |
| shuyu-labs/BigBanana-AI-Director | AI 导演（分镜+生成编排） |
| chenpipi0807/ReelAgent | 短视频 Agent（脚本→镜头） |
| xinjian0101/continuity-director | 连续性导演（跨镜一致性） |

## 端到端管线验收标准（自建/评估）

1. **输入**：纯文本脚本（或一句话故事，→ 48 JSON 契约版）；
2. **中间产物可见**：场景分解/镜头规格/提示词都可审（管线透明，非黑盒）；
3. **输出契约**：帧命名 `scene_XXX_shot_YYY.png` + metadata.json（含全部生成参数）；
4. **一致性**：跨帧角色/风格锚定（→ 39 一致性方法接入渲染层）；
5. **可断点续跑**：检查点支持失败后从指定阶段重跑（LangGraph 检查点）；
6. **成本可控**：并行帧数/模型档位可配（diffusers/sd_cpp 后端切换）；
7. **下游衔接**：帧序列 → 图生视频（→ 40 I2V 三通道）→ Animatic（→ 35 装配）。

## 工作流应用（在制作中的位置）

```
剧本 → [自动管线：四 Agent 分镜帧] → 人工审查帧/规格
     → 修正提示词（单变量，→ 56 纪律）
     → 图生视频逐镜生成（→ 34/52 逐镜选型）
     → Animatic 装配测节奏（→ 35）
     → 成片
```

**人工留在哪里**：管线产"候选分镜包"，导演审**镜头规格与情绪**（不是画功）；失败帧只重渲失败镜头（→ 49 分镜=稳定器同构）。

## 常见错误

1. 单提示词"万能转换"：无领域分层，构图/风格/一致性全失控。
2. 黑盒管线：中间产物不可见，无法定位漂移来源。
3. 无 metadata 契约：不可复现，无法版本对比。
4. 不用检查点：中途失败全量重跑。
5. 渲染层无一致性锚定：帧间角色漂移（→ 39）。
6. 自动分镜不人工审：镜头规格/情绪偏差直接进生成。
7. 与下游脱节：帧格式/命名不支持图生视频与 Animatic 装配。

## 术语表（中英对照）

| 中文 | English | 一句话定义 |
|---|---|---|
| 自主管线 | Autonomous Pipeline | 脚本→帧全自动 |
| 状态图编排 | State Graph Orchestration | LangGraph 流程控制 |
| 检查点 | Checkpoint | 断点续跑 |
| 领域分层 | Domain Layering | 每阶段专家注入 |
| 镜头规格 | Shot Specification | 构图/机位参数 |
| 可复现契约 | Reproducibility Contract | metadata.json |
| 渲染引擎 | Render Engine | 帧生成后端 |
| 条件分支 | Conditional Branch | 逻辑分流 |
| 并行渲染 | Parallel Frames | 多帧并发 |
| 导演技能 | Director Skill | MCP 导演命令 |
| 连续性导演 | Continuity Director | 跨镜一致检查 |
| 人工审查点 | Human Review Gate | 导演决策位 |

## 来源

- GitHub: rymfhm/Autonomous-Cinematic-Pre-Visualization-Storyboard-Pipeline（Petra：四 Agent + LangGraph + AMD ROCm） — 
- ComfyUI: Storyboard To Video — Seedance 2.0 工作流 — https://comfy.org/workflows/f4e29143100c-f4e29143100c/
- GitHub: artokun/comfyui-mcp — director skill（导演命令） — 
- GitHub: colorAi/comfyui-storyboard — 
- GitHub: shuyu-labs/BigBanana-AI-Director — 
- GitHub: chenpipi0807/ReelAgent — 
- GitHub: xinjian0101/continuity-director — 
- GitHub: Matticusnicholas/KupkaProd-Cinema-Pipeline — 