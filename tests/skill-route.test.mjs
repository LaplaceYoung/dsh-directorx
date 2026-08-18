import test from 'node:test'
import assert from 'node:assert/strict'
import { articlesForSkill, routeSkills, skillsForArticle, toolsForSkill } from '../lib/testing.js'

test('routeSkills maps character, edit, generate, and onboard intents', () => {
  const sheet = routeSkills('先出林工的三视图设定图')
  assert.equal(sheet.mode, 'character')
  assert.ok(sheet.skills.includes('novel-characters'))
  assert.ok(sheet.articles.includes('04'))
  assert.ok(sheet.next.some(step => step.includes('directorx_skill_read novel-characters')))
  assert.ok(sheet.next.some(step => step.includes('directorx_knowledge_read')))
  assert.ok(sheet.tools.includes('directorx_character_register'))

  const edit = routeSkills('把这段视频去掉开头 2 秒再调色')
  assert.equal(edit.mode, 'edit')
  assert.ok(edit.tools.includes('directorx_edit_plan'))
  assert.ok(edit.avoid.some(line => /重绘|调色/.test(line)))

  const gen = routeSkills('开拍雨夜巷口跟镜头')
  assert.equal(gen.mode, 'generate')
  assert.ok(gen.skills.includes('directorx-production-lead'))
  assert.ok(gen.next[0].startsWith('directorx_skill_read'))

  const onboard = routeSkills('接入新模型，这是 apidoc 和 key')
  assert.equal(onboard.mode, 'onboard')
  assert.deepEqual(onboard.skills, ['directorx-provider-onboard'])
  assert.ok(onboard.avoid.some(line => /API Key/.test(line)))
})

test('routeSkills on an IP name loads 213 and the rewrite tools', () => {
  const ip = routeSkills('蜘蛛侠在楼宇间摆荡')
  assert.ok(ip.articles.includes('213'))
  assert.ok(ip.tools.includes('directorx_ip_scan'))
  assert.ok(ip.tools.includes('directorx_ip_rewrite'))
  assert.ok(ip.next.some(step => step.includes('directorx_ip_scan')))
  assert.ok(ip.next.some(step => step.includes('directorx_knowledge_read 213')))
  assert.ok(ip.avoid.some(line => /固定替换|项目记忆/.test(line)))
})

test('routeSkills empty intent asks instead of generating', () => {
  const empty = routeSkills('   ')
  assert.equal(empty.mode, 'research')
  assert.deepEqual(empty.next, ['directorx_ask'])
})

test('routeSkills maps adaptation review and shot vocab', () => {
  const literary = routeSkills('改编这本小说为短剧')
  assert.equal(literary.mode, 'script')
  assert.ok(literary.tools.includes('directorx_bible'))
  const vocab = routeSkills('这场正反打怎么切')
  assert.ok(vocab.skills.includes('shot-recipes'))
  assert.ok(vocab.tools.includes('directorx_shot_vocab'))
})

test('routeSkills maps canvas craft intents', () => {
  const row = routeSkills('把这篇剧本铺成分镜行')
  assert.equal(row.mode, 'canvas')
  assert.ok(row.tools.includes('directorx_canvas_script'))
  assert.ok(row.tools.includes('directorx_canvas_autolink'))
  const frames = routeSkills('把这段成片抽帧上板')
  assert.ok(frames.tools.includes('directorx_canvas_frames'))
  const parse = routeSkills('把这段成片一键解析')
  assert.ok(parse.tools.includes('directorx_canvas_parse'))
  const reshoot = routeSkills('把中间两秒片段重做')
  assert.ok(reshoot.tools.includes('directorx_canvas_reshoot'))
  const pack = routeSkills('把这几段拼成片')
  assert.ok(pack.tools.includes('directorx_canvas_pack'))
  const sheet = routeSkills('出一张接触表')
  const join = routeSkills('把这些分镜宫格拼回')
  assert.ok(join.tools.includes('directorx_canvas_join'))
  const stack = routeSkills('两路分屏对照')
  assert.ok(stack.tools.includes('directorx_canvas_stack'))
  assert.ok(sheet.tools.includes('directorx_canvas_sheet'))
})

test('routeSkills maps official H3 modes to the H3 copilot', () => {
  const h3 = routeSkills('按 Ref2VA 写一条海螺 H3 成稿')
  assert.equal(h3.mode, 'generate')
  assert.ok(h3.skills.includes('minimax-h3-prompt-copilot'))
  const ad = routeSkills('用这张产品图做极简产品广告')
  assert.ok(ad.skills.includes('minimax-h3-prompt-copilot'))
})

test('routeSkills maps theatrical trailers to trailer-craft', () => {
  const trailer = routeSkills('做一条日漫热血电影预告片')
  assert.equal(trailer.mode, 'generate')
  assert.ok(trailer.skills.includes('trailer-craft'))
  assert.ok(trailer.tools.includes('directorx_canvas_pack'))
  assert.match(trailer.reason, /硬切|预告片/)
})

test('routeSkills maps one-take blocking sheets', () => {
  const row = routeSkills('30秒10人完全控制，只给角色图和攻击顺序')
  assert.ok(row.skills.includes('directorx-blocking-craft'))
  assert.ok(row.tools.includes('directorx_blocking'))
  assert.match(row.reason, /场面控制表/)
  assert.ok(toolsForSkill('directorx-blocking-craft').includes('directorx_blocking'))
})

test('routeSkills maps series packs and node revise', () => {
  const series = routeSkills('下一集沿用同一系列设定')
  assert.ok(series.skills.includes('directorx-series-craft'))
  assert.ok(series.tools.includes('directorx_series'))
  const revise = routeSkills('这个表情再生动点')
  assert.equal(revise.mode, 'generate')
  assert.ok(revise.tools.includes('directorx_revise'))
  assert.match(revise.reason, /只改这一镜|revise/)
})

test('routeSkills maps post-deliver capture to skill_capture', () => {
  const capture = routeSkills('把这次成片保存为技能')
  assert.ok(capture.skills.includes('directorx-skill-capture'))
  assert.ok(capture.tools.includes('directorx_skill_capture'))
  assert.ok(capture.next.some(step => step.includes('directorx_skill_read directorx-skill-capture')))
})

test('toolsForSkill lists the tools DSH should call after reading a skill', () => {
  assert.ok(toolsForSkill('directorx-chengpian').includes('directorx_chengpian'))
  assert.ok(toolsForSkill('directorx-skill-capture').includes('directorx_skill_capture'))
  assert.ok(toolsForSkill('editing-workflow').includes('directorx_edit_plan'))
  assert.ok(toolsForSkill('storyboard-craft').includes('directorx_canvas_script'))
  assert.ok(toolsForSkill('storyboard-craft').includes('directorx_canvas_pack'))
  assert.ok(toolsForSkill('trailer-craft').includes('directorx_canvas_pack'))
  assert.ok(toolsForSkill('directorx-series-craft').includes('directorx_series'))
  assert.ok(toolsForSkill('directorx-series-craft').includes('directorx_revise'))
  assert.ok(toolsForSkill('frame-qa').includes('directorx_canvas_frames'))
  assert.deepEqual(toolsForSkill('unknown-skill'), [])
})

test('H3 copilot ships official mode fields and no foreign form gate', async () => {
  const { readFile } = await import('node:fs/promises')
  const { join, dirname } = await import('node:path')
  const { fileURLToPath } = await import('node:url')
  const root = join(dirname(fileURLToPath(import.meta.url)), '..')
  const skill = await readFile(join(root, 'skills/minimax-h3-prompt-copilot/SKILL.md'), 'utf8')
  assert.match(skill, /T2VA/)
  assert.match(skill, /Ref2VA/)
  assert.match(skill, /directorx_ask/)
  assert.match(skill, /base-modes\.md/)
  assert.match(skill, /official-families\.md/)
  assert.match(skill, /handbook\.md/)
  assert.doesNotMatch(skill, /show_form/)
  const base = await readFile(join(root, 'skills/minimax-h3-prompt-copilot/references/base-modes.md'), 'utf8')
  assert.match(base, /integrated_multimodal_description/)
  assert.match(base, /overall_soundscape/)
  const book = await readFile(join(root, 'skills/minimax-h3-prompt-copilot/references/handbook.md'), 'utf8')
  assert.match(book, /1440p/)
  assert.match(book, /参考素材说明/)
  assert.match(book, /按图片理解/)
  const ref = await readFile(join(root, 'skills/minimax-h3-prompt-copilot/references/ref-mode.md'), 'utf8')
  assert.match(ref, /subject_definitions/)
  assert.match(ref, /retention_analysis/)
})

test('skill and knowledge ids point at each other', () => {
  assert.ok(articlesForSkill('novel-characters').includes('04'))
  assert.ok(articlesForSkill('continuous-video').includes('116'))
  assert.ok(articlesForSkill('trailer-craft').includes('151'))
  assert.ok(skillsForArticle('116').includes('continuous-video'))
  assert.ok(skillsForArticle('127').includes('editing-workflow'))
})
