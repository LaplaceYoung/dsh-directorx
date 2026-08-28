import test from 'node:test'
import assert from 'node:assert/strict'
import { addMenuRows, groupMenuRows, nodeMenuRows, shouldNestCraft } from '../lib/testing.js'

test('quick add menu is the six node types; full add includes import', () => {
  const quick = addMenuRows('quick')
  assert.deepEqual(quick.map(row => row.id), ['text', 'image', 'video', 'audio', 'director-stage', 'edit'])
  const full = addMenuRows('full')
  assert.ok(full.some(row => row.id === 'upload'))
  assert.ok(full.some(row => row.id === 'paste'))
  assert.ok(!quick.some(row => row.id === 'upload'))
  assert.ok(!quick.some(row => row.id === 'script' || row.id === 'group'))
})

test('group node menu has no generate and no craft dump', () => {
  const rows = nodeMenuRows({
    type: 'group',
    hasPath: false,
    locked: false,
    selectedCount: 1,
  })
  assert.ok(!rows.some(row => row.id === 'generate'))
  assert.ok(!rows.some(row => row.section === 'craft'))
  assert.ok(rows.some(row => row.id === 'ungroup'))
  assert.ok(rows.some(row => row.id === 'delete'))
})

test('text node has copy/delete only, no video craft', () => {
  const rows = nodeMenuRows({
    type: 'text',
    hasPath: false,
    locked: false,
    selectedCount: 1,
  })
  assert.ok(!rows.some(row => row.id === 'script'))
  assert.ok(!rows.some(row => row.id === 'frames' || row.id === 'reshoot'))
  assert.ok(rows.some(row => row.id === 'duplicate'))
  assert.ok(rows.some(row => row.id === 'delete'))
})

test('filled video menu is trim, capture, extend, reshoot', () => {
  const rows = nodeMenuRows({
    type: 'media',
    kind: 'video',
    hasPath: true,
    locked: false,
    selectedCount: 1,
  })
  const labels = rows.map(row => row.label)
  assert.ok(labels.includes('剪辑'))
  assert.ok(labels.includes('截帧'))
  assert.ok(labels.includes('延长镜头'))
  assert.ok(labels.includes('视频重拍'))
  assert.ok(!labels.includes('去字幕'))
  assert.ok(!labels.includes('导出 GIF'))
  assert.ok(!labels.includes('智能解析'))
  assert.equal(shouldNestCraft(rows), false)
  const groups = groupMenuRows(rows)
  assert.ok(groups.some(group => group.id === 'primary'))
})

test('filled image menu is crop, redraw, split', () => {
  const rows = nodeMenuRows({
    type: 'media',
    kind: 'image',
    hasPath: true,
    locked: false,
    selectedCount: 1,
  })
  const labels = rows.map(row => row.label)
  assert.ok(labels.includes('裁剪'))
  assert.ok(labels.includes('局部重绘'))
  assert.ok(labels.includes('快速切分'))
  assert.ok(labels.includes('全屏'))
  assert.ok(!labels.includes('生成视频'))
})

test('audio menu is download and copy, no image craft', () => {
  const rows = nodeMenuRows({
    type: 'media',
    kind: 'audio',
    hasPath: true,
    locked: false,
    selectedCount: 1,
  })
  const labels = rows.map(row => row.label)
  assert.ok(labels.includes('下载'))
  assert.ok(labels.includes('复制'))
  assert.ok(!labels.includes('裁剪'))
  assert.ok(!labels.includes('截帧'))
})

test('menu labels stay ordinary', () => {
  const add = addMenuRows('full').map(row => row.label)
  assert.deepEqual(add.slice(0, 6), ['文本', '图片', '视频', '音频', '3D 导演台', '剪辑台'])
  assert.ok(add.includes('上传'))
  const multi = nodeMenuRows({
    type: 'media',
    hasPath: true,
    locked: false,
    selectedCount: 3,
    canUngroup: true,
  }).map(row => row.label)
  assert.ok(multi.includes('编组'))
  assert.ok(multi.includes('取消编组'))
  assert.ok(!multi.includes('合成视频'))
  assert.ok(!multi.includes('九宫格'))
})

test('multi-select menu is arrange actions, not a single-node craft dump', () => {
  const rows = nodeMenuRows({
    type: 'media',
    hasPath: true,
    locked: false,
    selectedCount: 2,
  })
  assert.ok(rows.some(row => row.id === 'group'))
  assert.ok(!rows.some(row => row.id === 'frames' || row.id === 'reshoot' || row.id === 'crop'))
})
