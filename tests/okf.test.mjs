import test from 'node:test'
import assert from 'node:assert/strict'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFile } from 'node:fs/promises'
import {
  corpus,
  extractMentionedIds,
  inferOkfType,
  parseOkfDocument,
  serializeOkfDocument,
} from '../lib/testing.js'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))

test('OKF parse/serialize keeps type tags and sources', () => {
  const source = `---
type: Method
title: "图生视频深度控制"
description: "首帧末帧锁定运动路径"
tags:
  - production
  - i2v
  - prompt
generated:
  by: process:directorx-knowledge-okf
  at: 2026-08-18T00:00:00Z
dx_id: "116"
aliases:
  - "183"
sources:
  - resource: "https://example.com/i2v"
    id: url-1
    title: "example.com"
---

# 图生视频深度控制

首尾帧控制。
`
  const parsed = parseOkfDocument(source)
  assert.equal(parsed.frontmatter.type, 'Method')
  assert.deepEqual(parsed.frontmatter.tags, ['production', 'i2v', 'prompt'])
  assert.equal(parsed.frontmatter.aliases?.[0], '183')
  assert.equal(parsed.frontmatter.sources?.[0]?.resource, 'https://example.com/i2v')
  assert.match(parsed.body, /首尾帧控制/)
  const roundtrip = parseOkfDocument(serializeOkfDocument(parsed.frontmatter, parsed.body))
  assert.equal(roundtrip.frontmatter.type, 'Method')
  assert.equal(roundtrip.frontmatter.dx_id, '116')
  assert.deepEqual(roundtrip.frontmatter.tags, ['production', 'i2v', 'prompt'])
})

test('OKF type inference distinguishes spec playbook method and case', () => {
  assert.equal(inferOkfType('AI 视频模型能力矩阵'), 'Spec')
  assert.equal(inferOkfType('AI 视频生成工作流'), 'Playbook')
  assert.equal(inferOkfType('视频提示词工程总纲'), 'Method')
  assert.equal(inferOkfType('Video Agent MVP 案例手册'), 'Case')
  assert.equal(inferOkfType('镜头语言与景别'), 'Reference')
  assert.equal(inferOkfType('图生视频深度控制', 'image-to-video-control', '衔接 113 案例手册'), 'Method')
  assert.equal(inferOkfType('视觉术语图解', 'visual-glossary'), 'Reference')
})

test('numeric 衔接 mentions become related ids', () => {
  const ids = extractMentionedIds('AI 应用面向 DirectorX（衔接 107 关键帧、113 案例手册）。与 14 分工。')
  assert.ok(ids.includes('107'))
  assert.ok(ids.includes('113'))
  assert.ok(ids.includes('14'))
})

test('knowledge search still hits 116 for 图生视频 首尾帧', async () => {
  corpus.setRoot(join(root, 'knowledge'))
  const hits = await corpus.search('图生视频 首尾帧', 5)
  assert.ok(hits.length > 0)
  assert.ok(hits.some(hit => hit.id === '116' || hit.path.includes('image-to-video')))
  const read = await corpus.readArticle('116')
  assert.ok(read.content.length > 200)
  assert.match(read.content, /首尾帧|first.?frame|image.?to.?video/i)
  assert.equal(read.article.type !== undefined, true)
})

test('duplicate id 150 resolves to the long narrative article', async () => {
  corpus.setRoot(join(root, 'knowledge'))
  const read = await corpus.readArticle('150')
  assert.equal(read.article.id, '150')
  assert.ok(read.article.path.includes('narrative-structure'))
  assert.ok(read.content.length > 400)
  assert.doesNotMatch(read.content, /待补充内容/)
})

test('search can filter by OKF type and tag', async () => {
  corpus.setRoot(join(root, 'knowledge'))
  const methods = await corpus.search('提示词', 8, { type: 'Method', tag: 'prompt' })
  assert.ok(methods.length > 0)
  assert.ok(methods.every(hit => (hit.type ?? '').toLowerCase() === 'method'))
  assert.ok(methods.some(hit => (hit.tags ?? []).includes('prompt')))
})

test('knowledge handbook outranks retired nav articles', async () => {
  corpus.setRoot(join(root, 'knowledge'))
  const hits = await corpus.search('知识库 导航', 5)
  assert.equal(hits[0]?.id, '80')
  const retired = await corpus.readArticle('376')
  assert.equal(retired.article.id, '80')
  assert.equal(retired.redirectedFrom ?? retired.article.aliases?.includes('376'), true)
})

test('related 116 follows OKF markdown links', async () => {
  corpus.setRoot(join(root, 'knowledge'))
  const related = await corpus.related('116', 3)
  assert.ok(related.length > 0)
  assert.ok(related.every(hit => hit.id !== '116'))
})

test('every concept document has OKF type and unique id', async () => {
  const inventory = JSON.parse(await readFile(join(root, 'knowledge/_meta/inventory.json'), 'utf8'))
  assert.equal(inventory.okf_version, '0.2')
  const ids = inventory.articles.map(article => article.id)
  assert.equal(new Set(ids).size, ids.length)
  assert.ok(inventory.active_article_count >= 320)
  assert.ok(inventory.articles.every(article => typeof article.type === 'string' && article.type !== ''))
  const stubs = inventory.articles.filter(article => /待补充|camera-movement-gen|shot-types-gen/.test(article.path))
  assert.equal(stubs.length, 0)
})
