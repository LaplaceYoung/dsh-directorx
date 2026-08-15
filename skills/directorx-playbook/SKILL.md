
name: directorx-playbook
description: >-
  内置原创制作手册：视频提示词通用原则、一致性与控制清单、制作闸门与检查点、
  模型能力路由。当任务涉及 AI 视频、AI 生图、分镜、首尾帧、模型选择、成本闸门或
  生成后质检时，先加载本 skill，再调用具体生成工具。
user-invocable: true

# DirectorX 原创制作手册

本手册是插件内置的原创方法论，已经把分散的制作经验整合成四份可执行清单：

| 文件 | 用途 |
|---|---|
| `references/video-prompt-principles.md` | 视频提示词怎么写、时间怎么表达、声音怎么设计 |
| `references/consistency-and-control.md` | 角色/场景锚点、首尾帧、逐镜交接与生成后检查 |
| `references/workflow-gates.md` | 付费生成前的四道闸门、蓝图顺序、占位优先 |
| `references/model-routing.md` | 视觉/图像/视频/音频任务路由、协议选择与降级顺序 |

## 使用规则

1. 涉及生成任务时，先根据任务类型选择模型能力。
2. 写提示词前，按通用原则把动作、镜头、时间、声音拆开。
3. 多镜头项目先立锚点，再逐镜引用，不重复描述。
4. 任何付费生成前，确认规格、内容、成本、权利四道闸门都已通过。
5. 生成失败时按降级顺序排查，不无脑重试。