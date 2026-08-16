---
name: Mossland宣传片
description: 上海模思 Mossland 品牌宣传片——调研、确认、占位规格，禁止直接生成
---
# Mossland 宣传片案例

用户原话：「为上海模思的mossland制作宣传片」

**必须**调用 `directorx_case_run`。不要调用 `directorx_generate_image` / `directorx_generate_video`。

## 流程
1. 析 — `directorx_brief`
2. 研 — 模思定位 + 知识库宣传片结构
3. 问 — 时长画幅、占位批次
4. 案 — 注册 Moss智能 角色锚
5. 位 — 每镜完整提示词 + 推荐模型 + 规格，入 `directorx_propose`

用户确认占位前，任何生成工具都是错误。
