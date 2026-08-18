# 知识库治理

`knowledge/` 是 OKF v0.2 知识包：每篇概念文档带 YAML frontmatter，正文用 Markdown 链接构成图。`_meta/` 是扫描产物与侧车，不是概念文档。

## 文件职责

- 概念文档：`NNN-slug/*.md`，必须有 `type`，建议有 `title` / `description` / `tags` / `sources` / `status`。
- `INDEX.md`：OKF 根索引（`okf_version: "0.2"`）。macOS 大小写不敏感，此文件即规范的 `index.md`。
- `log.md`：包级变更日志，按日倒序。
- `taxonomy.json`：编号段与分类名称。
- `redirects.json`：已合并旧编号、已删除占位 slug → 规范文章。
- `inventory.json`：由扫描脚本生成的机器可读清单。
- `audit-report.md`：质量与重叠候选报告。相似度只供人工复核。

Producer 扩展字段：`dx_id`（稳定编号）、`aliases`（旧编号/slug）、`related`（包内相对路径）。

## 维护命令

```bash
npm run knowledge:audit
npm run knowledge:check
```

`knowledge:audit` 会补齐缺失的 OKF 头、清掉重号占位稿、重写索引/清单/日志/审计报告。`knowledge:check` 不写文件；frontmatter 缺失、编号冲突、重定向失效或产物过期时返回非零退出码。

## 清洗原则

1. 路径是概念身份；编号是稳定别名，不因标题优化而重排。
2. 明确重复的文章先合并，再在 `redirects.json` 与目标 `aliases` 保留旧编号。
3. 相似度报告和 `overlap-review` 只表示综合篇待复核。确认重复后再合并，并在规范文写合并说明。
4. 模型、平台、法规和年份相关内容看 `stale_after`；自动扫描不替代来源核验。
5. 新文章必须带 OKF `type`，并在正文用 Markdown 链接连到相关概念。
