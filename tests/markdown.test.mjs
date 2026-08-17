import test from 'node:test'
import assert from 'node:assert/strict'
import { parseInline, parseMarkdown, safeHref } from '../lib/testing.js'

test('safeHref keeps http(s) and drops script urls', () => {
  assert.equal(safeHref('https://example.com/a'), 'https://example.com/a')
  assert.equal(safeHref('mailto:a@b.c'), 'mailto:a@b.c')
  assert.equal(safeHref('javascript:alert(1)'), undefined)
  assert.equal(safeHref('data:text/html,x'), undefined)
})

test('parseInline marks strong, em, code, strike and links', () => {
  const nodes = parseInline('见 **主镜头** 与 *切镜*，用 `seed`，划掉 ~~旧稿~~，看 [说明](https://example.com)')
  assert.deepEqual(nodes.map(node => node.type), ['text', 'strong', 'text', 'em', 'text', 'code', 'text', 'del', 'text', 'link'])
  assert.equal(nodes.find(node => node.type === 'code')?.value, 'seed')
  assert.equal(nodes.find(node => node.type === 'link')?.href, 'https://example.com')
})

test('parseMarkdown folds headings, lists, fences and quotes', () => {
  const blocks = parseMarkdown([
    '# 分镜',
    '',
    '先写 **一场戏**。',
    '',
    '- 日外',
    '- 近景',
    '',
    '```json',
    '{"shot":1}',
    '```',
    '',
    '> 不要抢戏',
    '',
    '---',
  ].join('\n'))
  assert.deepEqual(blocks.map(block => block.type), ['heading', 'paragraph', 'list', 'code', 'quote', 'hr'])
  assert.equal(blocks[0].level, 1)
  assert.equal(blocks[2].ordered, false)
  assert.equal(blocks[2].items.length, 2)
  assert.equal(blocks[3].lang, 'json')
  assert.equal(blocks[3].value, '{"shot":1}')
})

test('parseMarkdown keeps GFM tables', () => {
  const blocks = parseMarkdown([
    '| 镜 | 时长 |',
    '| --- | --- |',
    '| 建立 | 5s |',
    '| 特写 | 2s |',
  ].join('\n'))
  assert.equal(blocks[0].type, 'table')
  assert.equal(blocks[0].header.length, 2)
  assert.equal(blocks[0].rows.length, 2)
  assert.equal(blocks[0].rows[1][0][0].value, '特写')
})
