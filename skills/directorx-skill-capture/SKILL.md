---
name: directorx-skill-capture
description: >-
  成片交付后把本次流程和用户修改意见收成可复用技能。
  用户说交片、保存为技能、下次按这次做，或阶段走到 deliver 时使用。
  用提问卡问是否保存为「xx」技能，再写 SKILL.md，不要覆盖插件自带技能。
user-invocable: true
---

# 交片后收成技能

工程只收事实（阶段账本、成稿、修改意见、拒因、风格、版权记忆）。技能正文由你写。

## 何时做

- `directorx_stage` 已到 `deliver`，或用户说这版可以交。
- 用户说「保存为技能」「下次按这次做」。

## 步骤

1. 用户改过的地方先确认进过 `directorx_note`。漏了就补记。
2. `directorx_skill_capture` `{ action: "offer", present: true }`。画布会话弹出提问卡：保存为「xx」技能 / 换个名字 / 这次不保存。禁止正文编号菜单。
3. 不保存就停。换名字就收下自定义回答，名字必须是小写英文短横线。
4. 按 harvest 写 SKILL.md：何时触发、阶段顺序、用户改过所以下次默认怎么做、风格/镜头锁、点名 IP 时走改写记忆。不要贴 JSON。
5. `directorx_skill_capture` `{ action: "save", name, title, description, body }`。
6. 只写入项目/用户技能库。不要改插件自带 `skills/`。

下次同类成片先 `directorx_skill_read` 这份新技能。
