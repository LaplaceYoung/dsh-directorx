# 发版

每个用户可见的变更先写进 [CHANGELOG.md](../CHANGELOG.md) 的 `[Unreleased]`。准备发版时：

1. 改 `package.json` 的 `version`（`package-lock.json` 顶部同步）。
2. 把 `[Unreleased]` 挪成 `## [x.y.z] - YYYY-MM-DD`，并留一个空的 `[Unreleased]`。
3. 提交并推到 `main`。
4. 运行 `npm run release`。

`npm run release` 会核对 CHANGELOG、打注释标签 `vX.Y.Z`、推到 `origin`，并创建或更新 [GitHub Release](https://github.com/LaplaceYoung/dsh-directorx/releases)。推标签后 `.github/workflows/release.yml` 也会跑测试并发布同一条 Release。

不要给 CHANGELOG 里还没有的版本打标签。
