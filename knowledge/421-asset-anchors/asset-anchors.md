---
type: Reference
title: "角色与场景资产锚点、六视图和连续性（Asset Anchors & Six-View Identity）"
description: "按跨镜头依赖创建角色/场景锚点，规定六视图身份板、条件场景板、普通场景描述、引用角色和资产替换连续性"
tags:
  - "craft"
  - "camera"
  - "character"
  - "continuity"
status: stable
stale_after: "2028-08-25"
generated:
  by: "process:directorx-dx-design-migration"
  at: "2026-08-25T00:00:00Z"
verified:
  - by: "process:directorx-dx-design-migration"
    at: "2026-08-25T00:00:00Z"
sources:
  - resource: "internal:dx-design/agent-profiles/v2/workflows/mv/reference/assets.md"
    id: source-mv-assets
    title: "MV asset pipeline and anchors"
  - resource: "internal:dx-design/agent-profiles/v2/workflows/mv/reference/creative-and-plan.md"
    id: source-mv-plan
    title: "MV creative and production planning"
dx_id: "421"
related:
  - "70-on-camera-acting/on-camera-acting.md"
  - "86-storyboard-drawing/storyboard-drawing.md"
  - "212-expression-library/expression-library.md"
---

# 角色与场景资产锚点、六视图和连续性（Asset Anchors & Six-View Identity）

资产不是把每个名词都生成为图片，而是为跨镜头一致性建立可复用证据。Core anchor 只有在会被复用、一致性重要、用户要求或下游依赖需要，且没有足够现有 ref/capsule 时才创建。角色/主体、可复用场景、可识别 voice、品牌/产品 source 是核心锚点；style、道具、灯光、相机、构图、运动、情绪和 layout 默认留在 ref/capsule/brief，不因形容词单独建 anchor。

只有当同一角色、服装、道具、场景空间或风格会在至少两个后续派单中被引用，且一致性错误会影响验收时，才创建对应锚点。单镜头、只需文本描述的普通对象不创建锚点。

## Anchor decision matrix

| Anchor | 创建时机 | 不需要时 |
|---|---|---|
| Character/subject sheet | 同一主体跨镜头、状态、变体或最终资产复用，且没有足够 ref/capsule | 一次性主体或既有锚点足够 |
| Voice anchor | 说话角色需跨 clip/VO 保持可识别声音 | 一次性台词、偶发环境声、用户接受模型原生声 |
| Reusable scene identity | 同一地点跨资产需可识别连续，或场景本身是项目资产 | 单镜背景、泛地点、只需 mood/world |
| Brand/product source | 精确复用品牌系统、Logo、包装、产品结构，且无足够 source/ref | 一次性海报/Logo/mockup |

DirectorX 映射：

- 研究/参考阅读 → `directorx_knowledge_search` / `directorx_knowledge_read` / `directorx_view_image`；
- 角色/资产登记 → `directorx_character_register` 或项目现有 Canvas media node；
- 图像锚点生成 → `directorx_prompt_plan` → `directorx_prompt_craft` → `directorx_generate_ready` → `directorx_generate_image`；
- 资产写回 → `directorx_canvas_add` / `directorx_canvas_update`，路径使用既有 outputDir/project helper；
- 概念不确定 → `directorx_ask`，不要凭空补完整人物传记。

## Anchor taxonomy

### 角色锚点（Character Anchor）

跨两组或更多镜头复用、需要身份连续的主体才创建。记录稳定 `anchor_id`、显示名、身份来源、年龄段/体态、肤色与发型等可观察属性、服装/配饰、默认姿态、禁改属性、参考图用途、生成 vendor/model、版本和当前 path。不要把未经用户提供的动机、关系、背景或国籍写成事实。

默认身份板为 **16:9、3×2 六视图**，顺序：

1. 全身正面；
2. 全身侧面；
3. 全身背面；
4. 脸部正面；
5. 脸部 profile；
6. 脸部 three-quarter。

画面要求：同一人物、同一服装/配饰、均匀中性背景、无文字水印、无额外人物、无强透视，适合后续裁切。用户/选定 workflow 明确要不同版式时可替换，但必须在资产记录里写 `view_layout`，不得把“三视图”默默扩成六视图。

### 场景锚点（Scene Anchor）

仅在同一空间会跨多个段落、镜头需要位置连续或空间本身是故事主体时创建。记录空间类型、固定结构（门窗/台阶/灯位）、色温/材质、镜头可见范围、允许变化（天气/时间）和禁止变化。场景 reference 不得改造角色身份。
### Voice anchor

可识别说话角色才创建 voice anchor；它是角色属性/视频参考，不是最终对白、VO、BGM 或替换混音交付物。执行计划记录 `role`, `language`, `role_profile`, `sample_text`, `output_role: voice_reference`, `trim_to_s: 3`, `selection_policy` 和结果 asset id；视频参考音频必须是不超过 3 秒的短样本，过长时用确定性后期裁到 ≤3 秒后再传。不同 speaking role 不复用同一 voice，除非用户明确要求。选定 workflow 的音频规则优先于该默认值。

### Canvas proof

所有 required anchors 必须在依赖生成开始前成为可见 Canvas asset；成功生成返回 Canvas node id。只有 path 的后期输出要用现有 `directorx_canvas_update`/`directorx_canvas_add` 写入 media node，不能把聊天路径当完成信号。

### 普通场景描述（Plain Scene Description）

只出现一镜或不需要可识别连续的地点，直接写在该镜 prompt：时间、功能、主体区域、材质和光线。不要为每个地点创建 reference board。

### 风格/道具锚点

Style anchor 约束调色、材质和成像质量，不能替代角色身份；道具 anchor 只在反复出现且形状/文字/品牌合法性重要时创建。Logo、受保护角色或品牌素材先走 `directorx_ip_scan`，不要用锚点绕过权利检查。


## Application
1. **Dependency scan**：从已确认 shot-plan 抽取角色/空间/道具引用，统计跨组次数和一致性风险；给出 `anchor_required: true/false` 及理由。
2. **Reference role**：为每张输入图标明 `identity`, `scene`, `style`, `first_frame`, `last_frame` 之一；同一图可以有多个角色但不能让模型猜用途。参考图不完整时标 `reference_gap`，不虚构背面。
3. **Generate/register**：角色锚点按六视图合同生成；场景锚点按固定结构生成；都写 `source_path`, `version`, `vendor`, `model`, `created_at`。同一资产批次尽量锁同一 vendor/model。
4. **Review gate**：使用 `directorx_view_image` 检查每个视图，核对脸、发型、服装、配饰、肢体比例、场景结构和图内文字；不合格只重做锚点，不让下游镜头继承错误。
5. **Bind**：每个 shot 的 `refs` 用 `anchor_id` + 实际 path + 用途/顺序绑定。image-to-video / first-last-frame 的 slot 顺序必须和 refs 一致；不要只传一个未命名数组。
6. **Replace**：资产替换保留稳定 `anchor_id`，旧版本标记 `superseded`，新 path 写 Canvas；下游只更新引用，不复制一套资产 registry。若角色身份发生实质变化，提升为新 id 并让用户确认。
7. **Audit**：最终检查每个需要锚点的引用都可读，未引用锚点不阻塞；生成后的首/末帧与锚点不一致时回滚该镜头或更新经确认的版本。

## Anchor record

```yaml
asset_anchor:
  anchor_id: char_aria_v2
  kind: character
  view_layout: six_view_3x2
  source_path: /absolute/aria-sheet.png
  reference_roles: [identity]
  stable_attributes: [short black bob, silver ring, dark denim jacket]
  mutable_attributes: [pose, expression, wetness]
  refs:
    - { shot_id: shot_02, slot: image_1, purpose: identity }
  generation: { vendor: configured-provider, model: configured-model, version: 2 }
  status: active
```

## Acceptance

- 每个锚点都有跨镜头依赖理由、稳定 id、真实 path、用途和版本；无理由资产不生成。
- 角色六视图顺序/版式明确，或明确记录了用户选择的替代版式；视图可复核且无混入人物/水印。
- 场景 anchor 只锁定必要结构，普通场景不膨胀为资产板；style/identity/scene 角色不混淆。
- 每个 shot 的 refs 槽位、顺序、anchor_id 和 path 可追踪；替换不破坏下游稳定 id。
- Canvas 与项目路径反映当前 active 版本，旧版本可识别为 superseded；权利/生成 gate 没被绕过。

## 反模式

- 用户没给故事却擅自补人物动机、关系、结局。
- 只需一镜的场景也生成整套参考板。
- 把“三视图”自动改成六视图不告知，或六视图顺序错位。
- 同一人物在不同镜头换 vendor/model 和服装锚点，却声称连续。
- 参考图用途未标，image/audio slot 顺序交给模型猜。

## 相关概念

- [镜头前表演指导（Directing Performances On Camera）](../70-on-camera-acting/on-camera-acting.md)
- [分镜绘制技巧（Storyboard Drawing & Notation）](../86-storyboard-drawing/storyboard-drawing.md)
- [AI 角色表情库管理（Expression Library — Emotion Reference Collection & Consistency）](../212-expression-library/expression-library.md)
