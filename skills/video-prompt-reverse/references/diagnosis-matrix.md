# 迭代优化回路 · 诊断矩阵与修订话术

> 配套 `SKILL.md` Step 8「迭代优化回路」。当生成结果不满意时，**先定位维度，再精准改**，不要整段推倒重来。本文件给出诊断矩阵 + 六维修订话术 + 分层验收标准。

## 一、核心原则

1. **定位维度再改**：盲重生成最亏。先用下方矩阵把"哪里不像"归到具体维度。
2. **逐段重生**：多镜头序列只重生坏的那段（见 templates.md 分镜表），不重生成整条。
3. **种子锁定 + 单维微调**：沿用上版接近的 seed，只改出问题的维度，并把该失败模式加进负向词。
4. **模型路由**：某段 A 模型做砸，路由到该项更强的模型（Kling 运镜 / Veo3 音频 / Sora 连贯）。
5. **首帧控制兜底**：纯文本反复失败时，拿原片首帧做 image-to-video，fidelity 高一个量级。
6. **经验沉淀**：成功修订模式记下来，反哺后续运行（越用越准的飞轮）。

## 二、诊断矩阵（六维）

| 维度 | 典型失败表现 | 快速定位问句 |
|------|------------|------------|
| **内容** | 主体错、场景错、元素缺失/多余 | "画面里的人和东西对吗？" |
| **运动** | 运镜没按意图、抖动乱晃、动作错/卡顿 | "镜头动得对吗？主体动得自然吗？" |
| **音频** | 缺音频、错位、人声不同步（仅音频模型） | "声音对吗？配乐/环境音到位吗？" |
| **物理逻辑** | 变形 morphing、闪烁 flicker、多出肢体、穿帮 | "有没有诡异变形或穿帮？" |
| **人物真实感** | 脸漂移、身份不一致、表情僵 | "人还是同一个人吗？脸稳吗？" |
| **风格一致性** | 跨镜头色彩/光不对、质感跳变 | "几个镜头风格统一吗？" |

## 三、六维修订话术

### 1. 内容维度
- **主体错/缺失**：在提示词开头重述主体并加锁定词，如 `clear focal subject: ___`，补 `no missing elements`。
- **场景错**：显式写 `setting: ___ (time+place+lighting)`，避免模型自由发挥。
- **元素多余**：加负向 `no ___, no extraneous objects`。

### 2. 运动维度（视频核心）
- **运镜不对**：直接写原生控件（见 platform-guides.md），如 Kling `pan=-6`、海螺 `[缓慢横移]`、Runway Motion Brush 方向。
- **抖动乱晃**：负向 `stable camera, no handheld shake`；或指定 `locked tripod shot`。
- **动作卡顿/不自然**：加 `smooth continuous motion, natural physics`；严重则改 speed 参数或换运镜类型。
- **时序错**：`slow-motion` / `time-lapse` / `speed-ramp at ___` 显式标注。

### 3. 音频维度（仅音频模型：Veo3/Kling/Sora）
- **缺音频**：明确 `with synchronized ambient sound` / `add subtle wind + city hum`。
- **人声不同步**：Veo3 用 `character [name] says: "___"` 结构；负向 `no lip-sync mismatch`。
- **配乐情绪错**：指定 `score: tense strings` / `calm lo-fi`，避免默认。
- **静音模型**：跳过本维，在输出标注"目标模型不支持音频"。

### 4. 物理逻辑维度（视频翻车重灾区）
- **morphing 变形**：负向 `no morphing, no melting, no shape-shifting`（必加）。
- **flicker 闪烁**：负向 `no flicker, no flickering lights, consistent lighting`。
- **多出肢体**：负向 `correct anatomy, no extra limbs, no mutated hands`。
- **穿帮**：`physically plausible, no clipping, no floating objects`。

### 5. 人物真实感维度
- **脸漂移/身份不一致**：用一致性锚点（templates 分镜表 `CHAR_A` 锁定描述）；换支持 identity lock 的平台；或首帧控制 image-to-video。
- **表情僵**：`natural micro-expressions, subtle emotional shift`。
- **跨镜头一致**：所有引用同一角色的镜头共用锚点文本，风格锁锁定调色。

### 6. 风格一致性维度
- **色彩/光跳变**：全局风格锁 `color grade: ___ , consistent across shots`；分镜表统一调色字段。
- **质感跳变**：`uniform film grain / texture throughout`。
- **跨模型跳变**：同一序列尽量固定平台路由，避免各段不同模型导致风格碎。

## 四、分层验收标准

生成后按以下顺序逐层验收，**全部通过方锁定该段**：

```
内容 ✓  →  运动 ✓  →  风格 ✓  →  音频 ✓
```

- **内容**：主体/场景/元素正确。
- **运动**：运镜与主体运动符合意图、自然不诡异。
- **风格**：色调/光质/质感跨镜头统一。
- **音频**（仅音频模型）：同步、情绪对、无错位。

任一层不通过 → 回到对应维度用上方话术修订 → 重生该段（锁 seed）→ 重新验收。

## 五、经验沉淀格式

每次成功修订，追加一行到会话记忆（或用户长期笔记）：

```markdown
- [片型] ___ → [失败维] ___ → [有效修订] ___ → [平台/seed] ___
```

例：
```markdown
- [产品旋转] 运动维抖动 → 负向 stable camera + Kling pan=0 → Kling seed 8821
- [人物访谈] 人物维脸漂移 → 首帧控制 image-to-video → Veo3
```

> 这些沉淀让 skill "越用越准"，是 reverse-video-prompt 迭代 loop 的飞轮思路。

## 六、交付前自检（权威版见 SKILL.md Step 7）

> 完整的「交付前自检」清单（9 块齐全 / 双锚定 / 真实人物与未成年护栏）以 `SKILL.md` Step 7 为**唯一权威**，本文件不再重复，避免两处改一处漏。
> 此处仅强调：自检与上方「分层验收」（生成后按维度修订）互补——前者防漏块 + 安全责任可勾验，后者按维度精准修订。