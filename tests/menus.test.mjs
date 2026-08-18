import test from 'node:test'
import assert from 'node:assert/strict'
import { addMenuRows, groupMenuRows, nodeMenuRows, shouldNestCraft } from '../lib/testing.js'

test('quick add menu is only node types; full add includes import', () => {
  const quick = addMenuRows('quick')
  assert.deepEqual(quick.map(row => row.id), ['image', 'video', 'text', 'script', 'group'])
  const full = addMenuRows('full')
  assert.ok(full.some(row => row.id === 'upload'))
  assert.ok(full.some(row => row.id === 'paste'))
  assert.ok(!quick.some(row => row.id === 'upload'))
})

test('group node menu has no generate and no craft dump', () => {
  const rows = nodeMenuRows({
    type: 'group',
    hasPath: false,
    locked: false,
    canAssemble: false,
    selectedCount: 1,
  })
  assert.ok(!rows.some(row => row.id === 'generate'))
  assert.ok(!rows.some(row => row.section === 'craft'))
  assert.ok(rows.some(row => row.id === 'ungroup'))
  assert.ok(rows.some(row => row.id === 'delete'))
})

test('text node leads with script, not a video craft list', () => {
  const rows = nodeMenuRows({
    type: 'text',
    hasPath: false,
    locked: false,
    canAssemble: false,
    selectedCount: 1,
  })
  assert.equal(rows[0].id, 'script')
  assert.ok(!rows.some(row => row.id === 'frames' || row.id === 'reshoot'))
  assert.ok(rows.some(row => row.id === 'generate' && row.label === '生成'))
})

test('video with a path nests craft when there are many process actions', () => {
  const rows = nodeMenuRows({
    type: 'media',
    kind: 'video',
    hasPath: true,
    locked: false,
    canAssemble: true,
    selectedCount: 1,
  })
  assert.ok(rows.some(row => row.id === 'generate' && row.label === '生成'))
  assert.ok(rows.some(row => row.id === 'frames'))
  assert.ok(rows.some(row => row.id === 'assemble'))
  assert.ok(rows.some(row => row.id === 'gif'))
  assert.equal(shouldNestCraft(rows), true)
  const groups = groupMenuRows(rows)
  assert.ok(groups.some(group => group.id === 'craft' && group.rows.length >= 3))
})

test('menu labels use ordinary canvas-editor names', () => {
  const video = nodeMenuRows({
    type: 'media',
    kind: 'video',
    hasPath: true,
    locked: false,
    canAssemble: true,
    selectedCount: 1,
  })
  const labels = video.map(row => row.label)
  assert.ok(labels.includes('生成'))
  assert.ok(labels.includes('提取帧'))
  assert.ok(labels.includes('智能解析'))
  assert.ok(labels.includes('局部重绘…'))
  assert.ok(labels.includes('去字幕'))
  assert.ok(labels.includes('视频延长'))
  assert.ok(labels.includes('导出 GIF'))
  assert.ok(labels.includes('重新生成…'))
  assert.ok(labels.includes('自动连线'))
  assert.ok(!labels.some(label => /开拍|写成稿|抽帧上板|铺成分镜|去硬字|续写位|改这一镜|按引用/.test(label)))
  const add = addMenuRows('full').map(row => row.label)
  assert.ok(add.includes('编辑图片'))
  assert.ok(add.includes('编辑视频'))
  assert.ok(add.includes('从资源库添加'))
  const multi = nodeMenuRows({
    type: 'media',
    kind: 'video',
    hasPath: true,
    locked: false,
    canAssemble: false,
    selectedCount: 2,
    canPack: true,
    canSheet: true,
    canJoin: true,
    canStack: true,
    canUngroup: true,
  }).map(row => row.label)
  assert.ok(multi.includes('合成视频'))
  assert.ok(multi.includes('九宫格'))
  assert.ok(multi.includes('合并宫格'))
  assert.ok(multi.includes('分屏'))
  assert.ok(multi.includes('取消编组'))
})

test('multi-select menu is arrange actions, not a single-node craft dump', () => {
  const rows = nodeMenuRows({
    type: 'media',
    kind: 'video',
    hasPath: true,
    locked: false,
    canAssemble: false,
    selectedCount: 3,
    canPack: true,
    canSheet: true,
    canUngroup: false,
  })
  assert.ok(rows.some(row => row.id === 'group'))
  assert.ok(rows.some(row => row.id === 'pack'))
  assert.ok(!rows.some(row => row.id === 'frames'))
  assert.ok(!rows.some(row => row.id === 'generate'))
})
