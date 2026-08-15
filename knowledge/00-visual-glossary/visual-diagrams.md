# 视觉术语图解（Visual Glossary with Diagrams）

> 本页是 DirectorX 视觉术语示意图集：用 ASCII 结构图让图片/视频生成模型与人类读者"一眼看懂"关键视觉概念。每张图对应一个术语家族，配套可写入生成提示词的英文关键词。
> 用法：需要向图像/视频模型描述某个视觉概念时，先看本页示意图确认"长什么样"，再使用配套提示词短语。

## 1. 景别体系（Shot Size）——人物取景框对比

```
大远景 EWS          远景 LS/FS          中远景 MLS          中景 MS
┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│          │      │          │      │          │      │          │
│          │      │  ____    │      │          │      │  ____    │
│    .     │      │ |    |   │      │ ┌──────┐ │      │ |    |   │
│   /|\    │      │ |    |   │      │ |  __  | │      │ |    |   │
│  / | \   │      │ |    |   │      │ | |  | | │      │ | |  | | │
│   / \    │      │ |    |   │      │ | |  | | │      │ | |  | | │
│          │      │ └──────┘ │      │ | |  | | │      │ └──┼──┘ │← 裁到腰
│          │      │          │      │ └──────┘ │      │    |    │
│ 人物极小  │      │ 全身可见  │      │ 膝盖以上  │      │    |    │
└──────────┘      └──────────┘      └──────────┘      └──────────┘
  建立/环境         全身动作           3/4 身            对话默认

中近景 MCU           近景/特写 CU        大特写 BCU         极端特写 ECU
┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│          │      │   ____   │      │   ____   │      │          │
│  ┌────┐  │      │  |    |  │      │  | /\  |  │      │   ┌──┐   │
│  | __ |  │      │  | __  | │      │  |/  \|  │      │   |  |   │← 眼
│  ||  ||  │      │  | | |  |│      │  |    |  │      │   |  |   │
│  ||__||  │      │  | |_|  |│      │  |_  _|  │      │   └──┘   │
│          │      │  └──────┘│      │    ||    │      │          │
│ 胸以上    │      │  头为主   │      │ 眉到嘴    │      │ 局部放大  │
└──────────┘      └──────────┘      └──────────┘      └──────────┘
  口播/访谈          情绪表达          强烈情绪           悬念/细节
```

**提示词**：`extreme long shot` / `full shot` / `medium shot` / `medium close-up` / `close-up` / `big close-up` / `extreme close-up`

## 2. 镜头角度（Camera Angle）——机位高度与倾向

```
        俯视 High Angle                平视 Eye Level
        ╲                                │
         ╲ 摄影机                        摄影机
          ╲  ↓ 向下拍                     │  → 与眼同高
      ═══════════════                 ═══════════════
       主角（显得小/弱）                 主角（中性/平等）

        仰视 Low Angle                荷兰角 Dutch Angle
        摄影机                          摄影机
        ↑ 向上拍                        ╱↘ 倾斜
        │                          ═══════════════
      ═══════════════                 主角（失衡/不安）
       主角（显得大/强）
```

**提示词**：`high angle` / `low angle` / `eye level` / `dutch angle` / `bird's eye view` / `over-the-shoulder` / `POV shot`

## 3. 镜头运动（Camera Movement）——机位与主体的相对运动

```
推 Push In            拉 Pull Out          摇 Pan
主体→ 摄影机→         摄影机← 主体←          机位不动，镜头水平转
[主体] [摄影机→]      [摄影机←] [主体]      [摄影机◄──►]

移 Truck              跟 Tracking          升降 Crane
摄影机横移            摄影机跟随主体移动      摄影机上下/全方位
[摄影机→] [主体]      [摄影机→ 主体→]      [摄影机↑↓←→]
```

**提示词**：`dolly in` / `dolly out` / `pan` / `tilt` / `truck` / `tracking shot` / `crane shot` / `handheld` / `steadicam` / `aerial drone shot` / `whip pan`

## 4. 构图法则（Composition）

### 三分法 Rule of Thirds
```
┌─────┬─────┬─────┐
│     │     │     │   主体（眼睛/脸部）放在交点：
│  ●  │     │     │   ● = 视觉兴趣点
├─────┼─────┼─────┤   地平线放在上/下 1/3 线
│     │     │     │
├─────┼─────┼─────┤
│     │  ●  │     │
└─────┴─────┴─────┘
```

### 视线空间 Lookroom / 头顶空间 Headroom
```
┌──────────────────┐
│  头顶空间（留一点） │
│        ┌──┐      │
│        │  │      │
│        └──┘      │
│    视线方向→留白    │
│    （Lookroom）   │
│    ←────────     │
└──────────────────┘
视线方向留白=自然；不留=压抑/围困
```

### 引导线 / 框架构图
```
引导线 Leading Lines          框架构图 Frame in Frame
\      /   ↘ 视线引向主体          ┌──────────┐
 \    /                          │ ┌──────┐ │
  \  /  ●                         │ │      │ │← 门/窗做框
   \/                            │ │  ●   │ │
   /\                            │ │      │ │
  /  \                           │ └──────┘ │
 /    \                          └──────────┘
```

**提示词**：`rule of thirds` / `leading lines` / `frame in frame` / `symmetrical composition` / `negative space` / `headroom` / `lookroom` / `foreground, midground, background layering`

## 5. 180° 轴线（Axis of Action）——俯视图

```
       摄影机合法区域（180° 半圆内）
   ┌─────────────────────────────┐
   │  C1●          C2●            │
   │     ↘        ↙               │
   │        A ←——→ B              │ ← 轴线（两人连线）
   │     ↗        ↖               │
   │  C3●          C4●            │
   └─────────────────────────────┘
   ═══════════ 越轴（禁止） ═══════════
        C5●（越轴机位→A/B 左右互换）
```
**规则**：所有机位在轴线同一侧 → A 恒在左、B 恒在右。越轴需用中性镜头过渡。

**提示词**：`shot/reverse shot` / `over-the-shoulder` / `eyeline match`

## 6. 三点布光（Three-Point Lighting）——俯视图 + 侧视图

```
俯视图：                       侧视图：
       背光 Back Light          ┌──┐
           ●                    │背│← 轮廓光（分离背景）
   辅光     │     主光           └──┘
    ●──────主角──────●              │
         (Fill)    (Key)      ┌──┐  │
                              │主│← 主光（45° 偏侧、略高）
                              └──┘  │
                              ┌──┐  │
                              │辅│← 辅光（对侧、较低、≤50%）
                              └──┘  │
                                   ▼
```
**主光**决定整体光效；**辅光**平衡阴影（无=高反差）；**背光**勾轮廓分离背景。

**提示词**：`key light from 45 degrees` / `soft fill light` / `rim light` / `three-point lighting` / `low-key lighting` / `high-key lighting` / `Rembrandt lighting` / `butterfly lighting` / `split lighting`

## 7. 色温与色调（Color Temperature & Palette）

```
暖 Warm ←────────── 色温（K）──────────→ 冷 Cool
2700K      3200K      5500K      6500K      7500K
烛光      白炽灯     日光       阴天       阴影
橙红 ◄──────────────────────────────────────► 蓝

暖调 = 亲和/浪漫/复古（sepia）    冷调 = 疏离/科技/忧郁（蓝紫）
示例调色：Teal & Orange（阴影青蓝 + 肤色橙）
```
**提示词**：`warm color temperature` / `cool blue tones` / `teal and orange grade` / `pastel palette` / `desaturated muted` / `high contrast noir`

## 8. 转场（Transitions）——时间线示意

```
硬切 Cut              叠化 Dissolve        淡出淡入 Fade
[镜头A][镜头B]         [镜头A ══ 镜头B]      [镜头A]▃▂▁  ▁▂▃[镜头B]
瞬间替换               渐变重叠（时间流逝）    渐黑（段落结束）

匹配剪辑 Match Cut     J 切（声音先行）      L 切（声音延后）
[骨头上抛]             视: [A][B]            视: [A][B]
[空间站]  形状匹配      声: [A 声][B 声]      声: [A 声][B 声]
                        B 声提前进入          A 声延续到 B

甩镜 Whip Pan          遮挡转场（隐形）
[模糊甩动][新场景]      [人物挡镜头][切开]
```
**提示词**：`hard cut` / `dissolve` / `fade to black` / `match cut` / `whip pan transition` / `invisible cut` / `J-cut` / `L-cut`

## 9. 剪辑节奏（Pacing）——镜头时长曲线

```
情绪↑
    │   ╱╲        ╱╲╱╲
    │  ╱  ╲      ╱
    │ ╱    ╲    ╱    ← 快切（短镜头）= 紧张
    │╱      ╲  ╱
    │        ╲╱  ← 长镜头/静默 = 释放
    └──────────────────→ 时间
    紧 → 松 → 紧：节奏呼吸（Tension & Release）
```
**提示词**：`fast-paced editing, short cuts` / `slow pacing, long takes` / `cut on beat` / `montage sequence`

## 10. 机位覆盖（Coverage）——俯视图

```
         场景（两人对话）
      A ←──────────────→ B
         ╲            ╱
   Master●  ●──过肩 A→B  ●──过肩 B→A
    （全景）   │          │
          ●──单人 A      ●──单人 B
                        ●──特写（表情/道具）
```
**覆盖金字塔**：主镜头（保底）→ 过肩 ×2 → 单人 ×2 → 特写/插叙。剪辑自由度 = 覆盖数量。

**提示词**：`master shot` / `over-the-shoulder` / `single shot` / `insert shot`

## 11. 竖屏安全区（Vertical Safe Zones，9:16）

```
┌──────────┐
│ 顶部 8%   │← 状态栏/账号信息（TikTok）
├──────────┤
│          │
│ 安全区    │← 关键内容（脸/文字）放这里
│ 中上 40%  │
│          │
├──────────┤
│          │
│          │
├──────────┤
│ 底部 15%  │← 字幕条/按钮/音乐条
└──────────┘
```
**提示词**：`vertical 9:16` / `upper third text placement`（文字放上 1/3，避开底部 UI）

## 12. 响度与 LUFS（Loudness）——电平表

```
0 dBFS ┌────────┐
       │  爆音   │ ← 必须避开（Clipping）
-1 dBTP┌────────┐ ← True Peak 上限
       │        │
-14 LUFS┌──────┐ │ ← 流媒体目标（短视频/YouTube）
       │      │ │
-16 LUFS┌────┐ │ │ ← 音乐单曲目标
       │    │ │ │
-23 LUFS┌─┐  │ │ │ ← 广播标准（EBU R128）
       │ │  │ │ │
       └─┴──┴─┴─┘
```
**提示词**：`-14 LUFS` / `true peak -1 dBTP` / `loudness normalized`

## 13. 动态范围（SDR vs HDR）

```
亮度↑
4000│        ╱ HDR（PQ）
1000│      ╱
 203│    ╱ HLG 参考白
 100│  ╱ SDR（Rec.709）
   0└──────────────────→ 信号电平
     HDR 保留暗部细节 + 高光层次；SDR 上限约 100 nits
```
**提示词**：`HDR Rec.2020` / `SDR Rec.709` / `HLG` / `PQ` / `high dynamic range`

## 14. 宽高比（Aspect Ratio）——画框对比

```
16:9 ┌──────────────┐  横屏通用（YouTube/B站/电视）
     └──────────────┘
9:16 ┌────┐             竖屏（TikTok/抖音/Reels/Shorts）
     │    │
     │    │
     └────┘
2.39:1 ┌────────────────────────┐  变形宽银幕（院线电影感）
       └────────────────────────┘
4:3 ┌────────┐                  复古/老电视
    └────────┘
```
**提示词**：`16:9` / `9:16 vertical` / `2.39:1 anamorphic` / `4:3`

## 15. 卡点（Cut on Beat）——节拍与镜头映射

```
音频波形：
   ♪      ♪      ♪      ♪      ♪      ♪
   ↓      ↓      ↓      ↓      ↓      ↓   ← 节拍点（BPM 换算：120BPM=每拍0.5s）
画面：
[镜头1][镜头2][镜头3][镜头4][镜头5][镜头6]
   ↓      ↓      ↓      ↓      ↓      ↓
  切换点落在鼓点/人声起音上 = 卡点（Cut on Beat）
```
**提示词**：`cut on every beat` / `sync cuts to the drum hits` / `music-driven editing`

## 提示词组合示例（把示意图翻译给生成模型）

```
"Medium close-up of a woman, low angle, dolly in slowly,
 rule of thirds composition with negative space on the left,
 warm key light from 45 degrees, teal shadows, shallow depth of field,
 85mm, cinematic, 16:9"

"Vertical 9:16 short: close-up of hands doing product demo,
 hard cut on every beat (120 BPM), upper third text overlay,
 bright high-key lighting, white background, clean commercial style"
```