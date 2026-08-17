import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveGradeLook, inferMediaKind, GRADE_TABLE, GRADE_LOOKS, listGradeLabels } from '../lib/testing.js'

test('resolveGradeLook maps natural language to a look', () => {
  assert.equal(resolveGradeLook('帮我把这张照片调成末日荒土配色'), 'wasteland')
  assert.equal(resolveGradeLook('冷调一点'), 'cold')
  assert.equal(resolveGradeLook('黑白高对比'), 'bw-contrast')
  assert.equal(resolveGradeLook('teal-orange'), 'teal-orange')
  assert.equal(resolveGradeLook('胶片感'), 'film-fade')
  assert.equal(resolveGradeLook('暖调一点'), 'warm')
  assert.equal(resolveGradeLook('暖色日落'), 'golden')
  assert.equal(resolveGradeLook('漂白旁路'), 'bleach-bypass')
  assert.equal(resolveGradeLook('交叉冲印'), 'cross-process')
  assert.equal(resolveGradeLook('人像胶片'), 'portra')
  assert.equal(resolveGradeLook('复古老照片'), 'vintage')
  assert.equal(resolveGradeLook('赛博霓虹'), 'cyber')
  assert.equal(resolveGradeLook('夜色月光'), 'night')
  assert.equal(resolveGradeLook('低饱和北欧'), 'muted')
  assert.equal(resolveGradeLook('柯达正片'), 'kodachrome')
  assert.equal(resolveGradeLook('彩色负片反相'), 'color-negative')
})

test('catalog lists sixteen looks with labels', () => {
  assert.equal(GRADE_LOOKS.length, 16)
  assert.match(listGradeLabels(), /漂白/)
  assert.match(listGradeLabels(), /交叉冲印/)
  assert.match(listGradeLabels(), /金黄昏/)
})

test('inferMediaKind reads the extension', () => {
  assert.equal(inferMediaKind('/tmp/a.png'), 'image')
  assert.equal(inferMediaKind('/tmp/b.mp4'), 'video')
})

test('every look has an ffmpeg filter and a css preview', () => {
  for (const spec of Object.values(GRADE_TABLE)) {
    assert.match(spec.vf, /eq=|colorbalance=|hue=|curves=/)
    assert.ok(spec.css.length > 8)
    assert.ok(spec.source.length > 4)
  }
})
