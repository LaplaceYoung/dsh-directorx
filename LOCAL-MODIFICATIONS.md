# 本地修改说明 / Local Modifications Notice

> **本仓库不是原作者的分支声明，也不代表原作者。**
> 上游项目与版权归 **LaplaceYoung** 所有：
> - 上游仓库：https://github.com/LaplaceYoung/dsh-directorx
> - 上游版本：`v0.2.0`（commit `5264d2a78e631702abcf2382d8cf566e8a09f6ec`）
> - 许可证：**Apache-2.0**（见 `LICENSE`，未作任何修改）
>
> 本副本由使用者在本地为「让插件在 DeepSeek Harness **0.2.x** 上可运行」而修改，
> 依 Apache-2.0 第 4(b) 条，此处明确声明**修改了哪些文件**。
> 上游的 README / 文档 / 知识库 / 技能内容**一律未改**。

---

## 1. 为什么需要改

`dsh-directorx v0.2.0` 是按 **DSH 0.1.x** 的插件 API 编写的。升级到 **DSH 0.2.0-rc.2** 后：

1. **`ctx.settings.register` 已被删除**
   0.2.x 的 settings 服务只提供 `describe / configure / update / replace / write / mutate`，
   插件不再自行注册设置域。directorx 的 `apply()` 第一段就调用它，于是激活即失败：

   ```
   directorx (dsh-directorx): TypeError: ctx.settings.register is not a function
       at new apply (.../dsh-directorx/lib/index.js:36679:30)
   ```

   后果：**153 个 `directorx_*` 工具一个都不会注册**（插件"装上了但没工具"）。

2. **`llm.registerConfigurableProviders` 在 0.2.x 也不存在** —— 是同一批被移除的旧 API。

> 注意：该插件的 `peerDependencies` 全部写成通配 `*`，所以 DSH 0.2.x 的**插件兼容门禁拦不住它**，
> 只能在装载时才会暴露。**这也是为什么本修改先在隔离沙箱里实测过**。

## 2. 修改内容（仅 2 个位置，不触碰业务逻辑）

只改了 **`lib/index.js`**（构建产物；上游同时提交了 `src/`，但本地未重建）。
由 `patches/0.2-compat.mjs` 幂等施加，改动共 3 处：

| # | 位置 | 改动 |
|---|---|---|
| A | `lib/index.js` 顶部（`src/index.ts` 段之前） | 新增兼容垫片 `__dxCompatScope()` 与其默认值表 `__DX_DEFAULTS`（默认值逐项抄自上游 `DirectorxSettings` 与 `capability()`），文件头附「本地补丁、非上游代码」声明 |
| B1 | `function apply(ctx)` | 改签名接收 `hostConfig`（entry/preset 行里的 `config`），并优先走旧 API：`ctx.settings && typeof ctx.settings.register === "function" ? …(0.1.x 原路径) : __dxCompatScope(…)` |
| B2 | 同一个 `register(...)` 调用之后 | 关闭上面的三元；并给 `llm.registerConfigurableProviders` 装 no-op 兜底，避免第二个缺失 API 再次打断激活 |

**垫片做了什么**：用 0.2.x 可用的能力，等价复刻旧 `scope` 的四个方法
`get()` / `update(patch)` / `watch(fn)` / `load()`，初始值 = 上游默认值 ⊕ 传入的 entry config。
因此：

- 插件可以正常激活，**153 个工具全部注册**；
- 设置不再有独立设置页（0.2.x 不再支持插件自注册设置域），改为
  **在该插件条目的 `config:` 里写覆盖项**，例如：

  ```yaml
  - id: directorx
    name: dsh-directorx
    config:
      outputDir: directorx_output
      initiative: 协同
      # 不想被意外调用付费生成时，可把四个能力切 mock / 关掉：
      image: { enabled: false, mode: mock }
      video: { enabled: false, mode: mock }
      audio: { enabled: false, mode: mock }
  ```
- `llm.registerConfigurableProviders` 被跳过 ⇒ **directorx 自带的 image/video/audio 生成路由不会出现在模型目录里**；
  对「追问 / 分诊 / 分镜 / 本地剪辑」等不涉及模型生成的用法**没有影响**。

## 3. 已知未修项

| 项 | 说明 |
|---|---|
| `directorx-recipes` 技能名缺失 | 运行时报 `Unknown skill "directorx-recipes"`，插件自身降级处理，不影响主流程（上游问题，未改） |
| 设置页/画布前端 | 属于 client 半边；本条修改不提供设置页。画布前端需要把本包作为 profile bundle 安装（本副本的用法是作为 **preset 子插件**按需挂载） |
| `src/` 未同步 | 只改了 `lib/`。若将来用上游 `src/` 重新构建，需要把同样三处改动搬到 `src/index.ts`，或重新运行本补丁 |

## 4. 如何复现本修改

```powershell
# 取上游同一提交
git clone https://github.com/LaplaceYoung/dsh-directorx
cd dsh-directorx
git checkout 5264d2a78e631702abcf2382d8cf566e8a09f6ec
# 施加本地兼容补丁（幂等）
node patches/0.2-compat.mjs lib/index.js
node --check lib/index.js
```

## 5. 许可与归属

- 原始代码与文档：**© LaplaceYoung**，Apache-2.0。
- 本副本的改动部分同样是 Apache-2.0；分发时请保留 `LICENSE` 与本说明。
- 若上游发布了支持 DSH 0.2.x 的版本，**建议直接切换到上游版本并弃用本补丁**。
