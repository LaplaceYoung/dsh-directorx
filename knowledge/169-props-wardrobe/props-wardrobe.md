# AI 道具服装造型一致性（Props & Wardrobe — Costume Continuity Across Scenes）

> 本页为 AI 道具/服装/造型的一致性管理：服装主参考（Master Wardrobe Reference）、配饰锁定、状态记录（Shot-State Records）、IP-Adapter 参考图、生成前定妆校验。知识本体来自 2026 服装一致性指南（Frank Houbre/ArtArch/CrePal/ReelMind）。AI 应用面向 DirectorX：角色造型（衔接 117 一致性、165 环境、169 场景卡同源方法）。
> 来源：Frank Houbre「Manage Costume Continuity Across AI Scenes」、ArtArch「Character Consistency: Clothing, Props & State」、CrePal「Keep Characters Consistent (Runway Gen-4)」、ReelMind「AI-Generated Wardrobe Planning」。

## 概述

**核心断言**：服装/道具是角色一致性的**第二身份层**——脸一致但衣服每场变 = 观众出戏。**单一主服装参考（Master Wardrobe Reference）+ 配饰锁定 + 状态记录**（这场戏服装状态：脏了/破了/换了）是跨场一致的关键。**先定妆校验再生成**（服装从定妆照确认后再进视频）。

## 核心概念

### 服装一致性三要素（Frank Houbre）

```
① 主参考：唯一权威服装图（材质/配饰/颜色）
② 配饰锁定：眼镜/首饰/鞋（易漂移项重点锁）
③ 状态记录：每场戏服装状态（脏污/破损/更换）
```

### 工具面

- IP-Adapter / 参考帧（Runway Gen-4）：服装参考注入
- 定妆照（Stills）先于视频：服装从图确认再生成视频

## 技巧与示例

### 服装一致性工作流（ArtArch 测试法）

```text
主服装参考（定妆照，正/侧/背）
  → 状态记录表（每场：干净/脏/破/换装）
  → 生成前定妆校验（先出 stills）
  → 视频生成（参考注入）
  → 逐场审查（剪帧对比，防漂移）
```

### 状态变化的剧情用途

服装状态 = 叙事语言：脏污暗示冒险（衔接 97 剧情推进）、换装暗示转变（衔接 155 色彩转变）——**状态记录表同时是叙事表**。

## 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 无主参考 | 每场服装变 | 单一主参考 |
| 配饰不锁定 | 眼镜/首饰漂移 | 重点锁配饰 |
| 无状态记录 | 剧情矛盾 | 状态表 |
| 直接生成视频 | 服装漂移浪费 | 先定妆照 |
| 不逐场审查 | 漂移漏检 | 剪帧对比 |

## 工作流应用（AI 映射）

角色造型（衔接 117/155/165）：

```text
角色卡（117）→ 主服装参考（定妆照）
  → 状态记录表（叙事+连续性）
  → 定妆校验 → 生成（参考注入）
  → 逐场审查 → 一致性确认
```

**DirectorX 纪律**：主参考防漂移；配饰重点锁；状态表兼叙事；定妆先行。

## 术语表（中英对照）

| 中文 | English | 说明 |
|---|---|---|
| 主服装参考 | Master Wardrobe Reference | 服装权威图 |
| 定妆照 | Look Stills | 造型确认图 |
| 状态记录 | Shot-State Record | 服装状态表 |
| 配饰锁定 | Accessory Lock | 防漂移 |
| 参考注入 | Reference Injection | IP-Adapter 等 |
| 服装连续性 | Costume Continuity | 跨场一致 |

## 来源

- Frank Houbre — How to Manage Costume Continuity Across Several AI Scenes：https://frankhoubre.com/en/blog/comment-gerer-continuite-costume-scenes-ia
- ArtArch — AI Video Character Consistency: Clothing, Props & State：https://www.artarch.ai/blog/ai-video-character-consistency-clothing-props-state
- CrePal — How to Keep Characters Consistent in AI Videos (Runway Gen-4)：https://crepal.ai/blog/aivideo/how-to-keep-characters-consistent-in-ai-videos-2025/
- ReelMind — Scene Outfit Inspiration: AI-Generated Wardrobe Planning：https://reelmind.ai/blog/scene-outfit-inspiration-ai-generated-wardrobe-planning
- PixVerse — How to Create Consistent Characters with AI Video：https://pixverse.ai/en/blog/ai-video-generator-with-character-consistency