---
name: cinematic-motion-language
description: 将电影级视频 brief 编译为可执行的相机、运动物理、空间分区、对焦序列和负空间约束；用户要求精确控制运镜、景深、氛围或构图时使用。
user-invocable: true
whenToUse: 在 prompt_craft 前需要把“慢、快、电影感、氛围”等模糊词改成可测量运动、区域规则和可验收镜头行为时加载。
---

# Cinematic Motion Language：五支柱相机与运动合同

## Purpose

把不可执行的形容词转换成视频模型能消费、DirectorX 能验收的物理约束。技能只提供 craft 语言层，不创建新的生成循环、RPC、存储或主题；生成必须继续走 `directorx_prompt_plan` → `directorx_knowledge_read` / `directorx_skill_read` → `directorx_prompt_craft` → `directorx_generate_ready` → 既有确认与 `directorx_generate_video`。

源 `hub_*` 能力映射：

| Source API | DirectorX seam |
|---|---|
| `question` | `directorx_ask`（DSH 标准问题，不在正文写编号菜单） |
| `hub_read_media` | `directorx_probe_media` + `directorx_extract_frames` + `directorx_view_image` |
| `hub_generate_video` | `directorx_generate_video`（必须有 craftId/readyId；严格/协同再带 proposalId） |
| `hub_save_file_to_session` | 现有 outputDir/project path helper，随后 `directorx_canvas_update` 或 `directorx_canvas_add` |
| source negative_prompt field | 由 `directorx_generate_video` 的既有 provider 参数传递；负向约束不塞进正向 prompt 注释 |

## Input

用户可带 brief、参考图/视频、目标模型、时长、画幅、主体动作、风格和音频意图。缺少画幅、时长或“发生什么”时只通过 `directorx_ask` 补最小必要卡；参考素材不必重复上传。示例：`写一个 10 秒 16:9 的托钵僧旋转镜头，左侧留黑，粒子不能越界，先只出 prompt。`

## Key Concepts

### 五支柱

1. **相机契约（Camera Contract）**：先写相机，再写主体。用硬规则声明静止、推近、漂移、手持或单次升降；同时写禁止项。例如 `Static locked-off; zero pan, zoom, dolly, shake`，或 `Slow push-in only; 10% scale change over 10 seconds`。一镜只允许一个主相机运动。
2. **运动物理锚点（Motion Physics Anchor）**：每个主体和次级运动都有物理类比与时间测量。`like dust suspended in honey; one full revolution across 10 seconds` 比 “slow/fast/gentle” 可验收。写方向、速度、加速度、是否停顿以及落点。
3. **空间分区（Spatial Zoning）**：按 left/center/right third、foreground/midground/background、upper/lower half 命名区域，规定主体、光、粒子、背景运动可以出现在哪里。区域规则必须和负向约束互相引用。
4. **镜头/对焦行为序列（Lens Behavior Sequence）**：景深不是静态形容词；用 `trigger → shift → state → return → repeat` 写前景穿越镜头平面、rack focus、bokeh 和焦点回归的因果链，指定循环次数。
5. **负空间（Negative Space as Composition）**：把空区当作构图重量，写清它为何保持空、什么不得进入、何时可被下一状态接管。负向 prompt 重复区域、光、粒子和运动禁令。

### Prompt Contract

每个视频 craft 必须填写以下字段；不确定值要问或标记 blocked，不留空：

```text
CAMERA: [硬规则 + 禁止的额外运动]
ASPECT RATIO: [21:9 / 16:9 / 9:16 / 其它已确认值]
DURATION: [整数秒]
STYLE & MOOD: [可观察的视觉与氛围]
NARRATIVE: [一句发生什么]
ACTION:
- Subject: [主体、位置、姿态、状态]
- Motion: [物理类比 + 方向 + 时间测量]
- Secondary motion: [烟、布、粒子等各自锚点]
LENS:
- Focal feel: [wide / normal / telephoto]
- Focus event: [trigger → shift → state → return → repeat]
- DoF: [shallow / deep / breathing]
LIGHTING: [光源数量、方向、质感、色温]
SPATIAL ZONES:
- [区域]: [允许/禁止规则]
- [区域]: [允许/禁止规则]
- [区域]: [允许/禁止规则]
AUDIO: [环境声、对白、SFX 或显式静音；不是音乐流派]
QUALITY: [真实可观察的材质/成像质量]
NEGATIVE PROMPT: [相机、区域、速度、风格和动作违例]
```

正向 prompt 只写正面可见事实；`NEGATIVE PROMPT` 作为现有生成工具的独立字段。若提供参考帧，声明其角色（identity、scene、style、first frame 或 last frame），不要把普通参考图误作时间关键帧。

## Application

1. **Brief gate**：读取已确认素材和项目画幅/时长；缺阻塞值用 `directorx_ask`。若引用视频，先 `directorx_probe_media`、`directorx_extract_frames`，再 `directorx_view_image`，基于观察事实命名区域。
2. **Contract pass**：锁相机契约；为主体、次级运动、对焦事件和空区写物理/空间规则；检查每个规则有时间、区域或触发条件。
3. **Prompt craft**：把五支柱填入正向模板，附项目 Style Anchor 和连续性 `start_state/end_state`；不要复制“电影感”“高级”等无信息词。
4. **Safety/quality pass**：扫描相机漂移、区域越界、突然加速、无来源光、焦点跳变、粒子侵入负空间；为每项写替代或负向约束。涉及 IP 时先走 `directorx_ip_scan` / `directorx_ip_rewrite`。
5. **Ready and approval**：`directorx_generate_ready` 确认 text-to-video / image-to-video / first-last-frame 以及 refs；默认只返回 prompt，严格/协同通过 `directorx_propose` + `directorx_confirm`，自动模式仍不得跳 craft/ready。
6. **Generate and inspect**：批准后调用既有 `directorx_generate_video`，随后 `directorx_probe_media`、`directorx_extract_frames`、`directorx_view_image` 检查运动方向、速度、空间区和负空间。失败只修该镜头的物理约束，不另起循环。

### Acceptance checklist

- 相机规则在正向和负向字段均可读且只有一个主运动。
- 每个运动有物理类比、方向和全片时间测量；没有孤立的 `slow/fast/gentle`。
- 每个区域有主体/光/粒子/运动边界，空区在负向字段被明确保护。
- 对焦遵循因果序列，明确触发、焦点落点、回归与重复次数。
- 生成前拥有 craftId + readyId，参考角色和输出路径来自现有 provider/Canvas seam。
- 抽帧检查能证明至少一项相机行为、运动锚点和空间规则；不可观测的承诺标记为未验收。

## Examples

### 神圣旋转镜头

`Static locked-off camera; zero pan/zoom/dolly. The raised forearm completes one slow arc in 10 seconds, like an hour hand. Gold dust drifts like embers in still air. Left third is deliberate black void: no light, particles, or movement. A foreground mote crosses the lens plane, focus shifts to it, hand becomes warm bokeh, then focus breathes back; repeat twice.`

### 产品揭幕

`Slow push-in only, 8% scale change over 8 seconds. Matte black product remains centered in the right two-thirds; left third is clean copy-safe negative space. A thin rim highlight travels 20 cm along the edge over 6 seconds; no orbit, no rack focus, no floating particles. Background haze stays below the product midline.`

## Common Pitfalls

- 先堆风格形容词再补相机，模型自行改构图。
- 同一镜头同时写 push、orbit、zoom、handheld，导致运动互相冲突。
- 只写“粒子慢慢飘”，没有方向、速度和时间锚点。
- 负空间只在正向 prompt 声明，负向字段没有重复保护。
- 把对焦/景深当静态标签，不写触发与回归。
- 把 source `hub_generate_video` 或 `hub_read_media` 名称原样交给 DSH；所有执行映射必须是 `directorx_*`。

## References

- `knowledge/424-cinematic-motion-language/cinematic-motion-language.md`
- `knowledge/01-camera-language/camera-language.md`
- `knowledge/177-motion-blur-shutter/motion-blur-shutter.md`
- `knowledge/418-one-shot-chaining/one-shot-chaining.md`
