import test from 'node:test'
import assert from 'node:assert/strict'
import {
  answerQuestion, createdSessionId, dockItemsFromSnapshot, dockItemsFromWindow, foldSessionHistory, mediaFromToolResult,
  parseSessionList, parseSessionModels, parseWorkspaceList, pickWorkspaceSession, resolveLiveSession, rpcOk,
  sessionRunningFromList, sessionTextNeedsFold, summarizeToolName, textFromBlocks, toolCaption, waitsFromPending,
  wantsCharacterSheet, withCharacterSheetSpec,
} from '../lib/testing.js'

test('textFromBlocks skips reasoning and joins visible text', () => {
  assert.equal(textFromBlocks('  hello  '), 'hello')
  assert.equal(textFromBlocks([
    { type: 'reasoning', text: 'hidden' },
    { type: 'text', text: 'visible' },
    { type: 'text', text: 'line' },
  ]), 'visible\nline')
})

test('assistant long text folds while user text remains visible', () => {
  assert.equal(sessionTextNeedsFold({ kind: 'assistant', text: '长'.repeat(421) }), true)
  assert.equal(sessionTextNeedsFold({ kind: 'assistant', text: '短'.repeat(420) }), false)
  assert.equal(sessionTextNeedsFold({ kind: 'user', text: '长'.repeat(500) }), false)
})


test('summarizeToolName maps canvas tools', () => {
  assert.equal(summarizeToolName('directorx_canvas_add'), '画布：添加')
  assert.equal(summarizeToolName('directorx_generate_video'), '生成视频')
  assert.equal(summarizeToolName('directorx_skill_capture'), '收成技能')
  assert.equal(summarizeToolName('directorx_note'), '记下修改')
  assert.equal(summarizeToolName('directorx_bible'), '评审文档')
  assert.equal(summarizeToolName('directorx_shot_vocab'), '镜头语汇')
  assert.equal(summarizeToolName('directorx_canvas_script'), '画布：生成分镜')
  assert.equal(summarizeToolName('directorx_canvas_frames'), '画布：提取帧')
  assert.equal(summarizeToolName('directorx_canvas_autolink'), '画布：自动连线')
  assert.equal(summarizeToolName('directorx_canvas_parse'), '画布：智能解析')
  assert.equal(summarizeToolName('directorx_canvas_reshoot'), '画布：局部重绘')
  assert.equal(summarizeToolName('directorx_canvas_pack'), '画布：合成视频')
  assert.equal(summarizeToolName('directorx_canvas_sheet'), '画布：九宫格')
  assert.equal(summarizeToolName('directorx_canvas_split'), '画布：拆分宫格')
  assert.equal(summarizeToolName('directorx_canvas_join'), '画布：合并宫格')
  assert.equal(summarizeToolName('directorx_canvas_stack'), '画布：分屏')
  assert.equal(summarizeToolName('directorx_canvas_desub'), '画布：去字幕')
  assert.equal(summarizeToolName('directorx_canvas_extend'), '画布：视频延长')
  assert.equal(summarizeToolName('directorx_canvas_gif'), '画布：导出 GIF')
  assert.equal(summarizeToolName('directorx_series'), '系列包')
  assert.equal(summarizeToolName('directorx_revise'), '重新生成')
  assert.equal(summarizeToolName('directorx_blocking'), '画布：场面控制表')
  assert.equal(summarizeToolName('other_tool'), 'other tool')
})

test('toolCaption is a compact skill-style row', () => {
  assert.equal(toolCaption('skill', '{"name":"directorx-playbook"}'), 'skill：directorx-playbook')
  assert.equal(toolCaption('skill'), 'skill：')
  assert.equal(toolCaption('directorx_canvas_add'), 'canvas add：')
  assert.equal(toolCaption('ask_user_question'), 'ask user question：')
})

test('rpcOk unwraps the DSH result envelope and raw values', () => {
  assert.deepEqual(rpcOk({ result: { ok: true, value: { events: [1] } } }), { ok: true, value: { events: [1] } })
  assert.deepEqual(rpcOk({ result: { ok: false, error: { message: 'gone' } } }), { ok: false, message: 'gone' })
  assert.deepEqual(rpcOk({ events: [] }), { ok: true, value: { events: [] } })
})

test('foldSessionHistory builds a satellite transcript from session events', () => {
  const folded = foldSessionHistory({
    result: {
      ok: true,
      value: {
        events: [
          { event: { type: 'turn/start', seq: 1, time: 1, data: { turn: 1 } } },
          { type: 'user/message', seq: 2, time: 2, data: { role: 'user', content: [{ type: 'text', text: '开拍第一镜\n<system-reminder>\nignore\n' }], source: { kind: 'user' } } },
          { type: 'user/message', seq: 3, time: 3, data: { content: [{ type: 'text', text: 'ignored dump' }], source: { kind: 'plugin', summary: '已注入工作区' } } },
          { type: 'assistant/message', seq: 4, time: 4, data: { message: { content: [{ type: 'reasoning', text: 'think' }, { type: 'text', text: '先加一个镜头' }] } } },
          { type: 'tool/call', seq: 5, time: 5, data: { name: 'directorx_canvas_add', arguments: '{}' } },
          { type: 'turn/end', seq: 6, time: 6, data: { turn: 1, reason: { kind: 'completed' } } },
        ],
      },
    },
  })
  assert.equal(folded.running, false)
  assert.equal(folded.blocked, false)
  assert.deepEqual(folded.lines.map(line => [line.kind, line.text]), [
    ['user', '开拍第一镜'],
    ['notice', '已注入工作区'],
    ['assistant', '先加一个镜头'],
    ['tool', 'canvas add：'],
  ])
  const tool = folded.lines.find(line => line.kind === 'tool')
  assert.equal(tool?.status, 'running')
})

test('foldSessionHistory pairs tool results as expandable details', () => {
  const folded = foldSessionHistory([
    { type: 'tool/call', seq: 1, time: 1, data: { name: 'ask_user_question', arguments: '{"questions":[]}' } },
    { type: 'tool/result', seq: 2, time: 2, data: { content: [{ type: 'text', text: '{"ok":true}' }] } },
  ])
  const tool = folded.lines.find(line => line.kind === 'tool')
  assert.equal(tool?.status, 'ok')
  assert.match(String(tool?.args), /questions/)
  assert.match(String(tool?.result), /ok/)
})

test('foldSessionHistory marks a live turn and a blocked turn', () => {
  const live = foldSessionHistory([
    { type: 'turn/start', seq: 1, time: 1, data: { turn: 2 } },
    { type: 'user/message', seq: 2, time: 2, data: { content: [{ type: 'text', text: '继续' }] } },
  ])
  assert.equal(live.running, true)
  assert.equal(live.lines[0].kind, 'user')

  const blocked = foldSessionHistory([
    { type: 'turn/start', seq: 1, time: 1, data: { turn: 3 } },
    { type: 'turn/end', seq: 2, time: 2, data: { reason: { kind: 'blocked' } } },
  ])
  assert.equal(blocked.running, false)
  assert.equal(blocked.blocked, true)
  assert.ok(blocked.lines.some(line => line.text.includes('批准') || line.text.includes('回答')))
})

test('sessionRunningFromList reads the current session flag', () => {
  assert.equal(sessionRunningFromList({
    result: { ok: true, value: { items: [{ sessionId: 's1', running: true }, { sessionId: 's2', running: false }] } },
  }, 's1'), true)
  assert.equal(sessionRunningFromList({ items: [{ id: 's2', running: false }] }, 's2'), false)
  assert.equal(sessionRunningFromList({ items: [] }, 's1'), undefined)
})

test('pickWorkspaceSession binds the canvas project, not a foreign current session', () => {
  const envelope = {
    result: {
      ok: true,
      value: {
        items: [
          { sessionId: 'sos-latest', cwd: '/Users/me/sos', updatedAt: 90, blank: false },
          { sessionId: 'test11-old', cwd: '/Users/me/sos/test11', updatedAt: 10, blank: false },
          { sessionId: 'test11-new', cwd: '/Users/me/sos/test11/', updatedAt: 40, blank: false },
          { sessionId: 'test11-blank', cwd: '/Users/me/sos/test11', updatedAt: 80, blank: true },
        ],
      },
    },
  }
  const sessions = parseSessionList(envelope)
  const workspaces = parseWorkspaceList({
    items: [
      { workspaceId: 'ws-test11', path: '/Users/me/sos/test11', sessionIds: ['test11-new', 'test11-old', 'ghost'] },
      { workspaceId: 'ws-sos', path: '/Users/me/sos', sessionIds: ['sos-latest'] },
    ],
  })

  const bound = pickWorkspaceSession({
    project: '/Users/me/sos/test11',
    sessions,
    workspaces,
    preferredId: 'sos-latest',
  })
  assert.equal(bound?.id, 'test11-new')

  const preferred = pickWorkspaceSession({
    project: '/Users/me/sos/test11',
    sessions,
    workspaces,
    preferredId: 'test11-old',
  })
  assert.equal(preferred?.id, 'test11-old')

  const viaIds = pickWorkspaceSession({
    project: '/Users/me/sos/test11',
    sessions: [{ id: 'test11-new', updatedAt: 5 }, { id: 'ghost', cwd: '/elsewhere', updatedAt: 99 }],
    workspaces: [{ path: '/Users/me/sos/test11', sessionIds: ['test11-new'] }],
  })
  assert.equal(viaIds?.id, 'test11-new')

  assert.equal(pickWorkspaceSession({ project: '/Users/me/missing', sessions, workspaces }), undefined)
  assert.equal(createdSessionId({ result: { ok: true, value: { sessionId: 'fresh' } } }), 'fresh')
})

test('dockItemsFromSnapshot streams partial text and pending questions', () => {
  const respond = async () => ({ accepted: true })
  const model = dockItemsFromSnapshot({
    openState: 'open',
    running: true,
    nodes: [
      { kind: 'user', seq: 1, content: [{ kind: 'text', text: '帮我问一个问题' }] },
      { kind: 'assistant', seq: 2, blocks: [{ kind: 'text', text: '先确认风格' }] },
      { kind: 'tool-result', seq: 3, callId: 'c1', call: { name: 'ask_user_question', argsRaw: '{"id":"q"}' }, content: [{ kind: 'text', text: 'waiting' }], isError: false },
    ],
    runningCalls: [{ callId: 'c2', name: 'directorx_canvas_add', argsRaw: '{"kind":"image"}' }],
    partial: { turn: 1, step: 2, blocks: [{ kind: 'text', text: '正在写' }] },
    pending: [{
      kind: 'question',
      key: 'q:1',
      sessionId: 's1',
      payload: { questions: [{ id: 'style', question: '用哪套调色？', options: [{ label: '荒土' }, { label: '青橙' }] }] },
      respond,
    }],
  })
  assert.equal(model.ready, true)
  assert.equal(model.running, true)
  assert.equal(model.lines.some(line => line.kind === 'assistant' && line.streaming === true && line.text === '正在写'), true)
  assert.equal(model.lines.some(line => line.kind === 'tool' && line.status === 'running' && line.text === 'canvas add：'), true)
  assert.equal(model.waits[0]?.kind, 'question')
  if (model.waits[0]?.kind === 'question') {
    assert.equal(model.waits[0].questions[0]?.question, '用哪套调色？')
  }
})

test('dockItemsFromSnapshot hides reasoning and shows 思考中', () => {
  const model = dockItemsFromSnapshot({
    openState: 'open',
    running: true,
    nodes: [
      { kind: 'user', seq: 1, content: [{ kind: 'text', text: '开拍' }] },
      { kind: 'assistant', seq: 2, blocks: [{ kind: 'reasoning', text: 'secret plan' }] },
    ],
    runningCalls: [],
    partial: { turn: 1, step: 1, blocks: [{ kind: 'reasoning', text: 'still thinking' }] },
  })
  assert.equal(model.lines.some(line => line.text.includes('secret plan') || line.text.includes('still thinking')), false)
  assert.equal(model.lines.some(line => line.kind === 'thinking' && line.text === '思考中'), true)
})

test('question respond keeps PendingWait this so #settled is readable', async () => {
  class HostWait {
    #settled = false
    kind = 'question'
    key = 'q:1'
    sessionId = 's1'
    payload = { questions: [{ id: 'style', question: '用哪套？', options: [{ label: '荒土' }] }] }
    async respond() {
      if (this.#settled) throw new Error('already settled')
      return { accepted: true }
    }
  }
  const model = dockItemsFromSnapshot({
    openState: 'open',
    running: false,
    nodes: [],
    pending: [new HostWait()],
  })
  assert.equal(model.waits[0]?.kind, 'question')
  await answerQuestion(model.waits[0], [{ id: 'style', selected: ['荒土'] }])
})

test('mediaFromToolResult reads generate image and video files', () => {
  const images = mediaFromToolResult(JSON.stringify({
    prompt: '古道独行，尘土飞扬。远山。',
    files: [{ path: 'directorx_output/vast-desolate-wilderness-in-ancient-chin-2026-08.png', mimeType: 'image/png' }],
  }), 'directorx_generate_image')
  assert.equal(images.length, 1)
  assert.equal(images[0].kind, 'image')
  assert.equal(images[0].label, '古道独行，尘土飞扬')
  const videos = mediaFromToolResult(JSON.stringify({
    files: [{ path: '/tmp/shot.mp4', mimeType: 'video/mp4' }],
  }), 'directorx_generate_video')
  assert.equal(videos[0].kind, 'video')
  assert.equal(mediaFromToolResult('{"ok":true}', 'directorx_canvas_add').length, 0)
})

test('dockItemsFromSnapshot keeps generate result for session thumbs', () => {
  const model = dockItemsFromSnapshot({
    openState: 'open',
    running: false,
    nodes: [{
      kind: 'tool-result',
      seq: 4,
      callId: 'g1',
      call: { name: 'directorx_generate_image', argsRaw: '{"prompt":"desert"}' },
      content: [{ kind: 'text', text: '{"files":[{"path":"/tmp/a.png","mimeType":"image/png"}]}' }],
      isError: false,
    }],
  })
  const tool = model.lines.find(line => line.kind === 'tool')
  assert.equal(tool?.name, 'directorx_generate_image')
  assert.match(String(tool?.result), /a\.png/)
  assert.equal(mediaFromToolResult(tool?.result, tool?.name)[0]?.kind, 'image')
})

test('character sheet prompts stay sheets, not stills', () => {
  assert.equal(wantsCharacterSheet('帮我出一张角色三视图'), true)
  assert.equal(wantsCharacterSheet('夕阳下的街道'), false)
  assert.match(withCharacterSheetSpec('建筑师三视图设定'), /正视/)
  assert.equal(withCharacterSheetSpec('夕阳下的街道'), '夕阳下的街道')
})

test('resolveLiveSession reads a duck-typed binding', () => {
  const session = { subscribe() { return () => {} }, getSnapshot() { return { openState: 'open', nodes: [] } } }
  const service = { binding: (id) => id === 's1' ? { session } : undefined }
  assert.equal(resolveLiveSession(service, 's1'), session)
  assert.equal(resolveLiveSession(service, 'missing'), undefined)
  assert.equal(resolveLiveSession({}, 's1'), undefined)
})

test('parseSessionModels reads the 0.1.2 modelCatalog envelope', () => {
  const view = parseSessionModels({
    ok: true,
    value: {
      default: { provider: 'deepseek-official', model: 'deepseek-v4-flash', reasoningEffort: 'high' },
      routableProviders: ['deepseek-official'],
      groups: [{
        id: 'deepseek-official',
        name: 'DeepSeek',
        models: [{
          id: 'deepseek-v4-flash',
          name: 'DeepSeek-V4-Flash',
          description: 'Fast',
          reasoning: { efforts: [{ id: 'high', name: 'High' }], defaultEffort: 'high' },
        }],
      }],
      failures: [],
    },
  })
  assert.deepEqual(view?.current, { provider: 'deepseek-official', model: 'deepseek-v4-flash', reasoningEffort: 'high' })
  assert.equal(view?.routable, true)
  assert.equal(view?.groups[0]?.models[0]?.name, 'DeepSeek-V4-Flash')
})

test('parseSessionModels still unwraps a combined session.models payload', () => {
  const view = parseSessionModels({
    result: {
      ok: true,
      value: {
        current: { provider: 'openai', model: 'gpt-5' },
        groups: [{ id: 'openai', name: 'OpenAI', models: [{ id: 'gpt-5', name: 'GPT-5' }] }],
      },
    },
  })
  assert.deepEqual(view?.current, { provider: 'openai', model: 'gpt-5' })
  assert.equal(view?.groups[0]?.id, 'openai')
})

test('foldSessionHistory reads session.page records', () => {
  const folded = foldSessionHistory({
    ok: true,
    value: {
      records: [
        { type: 'event', event: { type: 'user/message', seq: 1, time: 1, data: { content: [{ type: 'text', text: '切模型' }], source: { kind: 'user' } } } },
        { type: 'event', event: { type: 'assistant/message', seq: 2, time: 2, data: { message: { content: [{ type: 'text', text: '已切到 Flash' }] } } } },
      ],
      hasMore: false,
    },
  })
  assert.deepEqual(folded.lines.map(line => [line.kind, line.text]), [
    ['user', '切模型'],
    ['assistant', '已切到 Flash'],
  ])
})

test('dockItemsFromWindow folds 0.1.2 events into dock lines', () => {
  const model = dockItemsFromWindow({
    entries: [
      { type: 'event', event: { type: 'user/message', seq: 1, time: 1, data: { content: [{ type: 'text', text: '画一只猫' }], source: { kind: 'user' } } } },
      { type: 'event', event: { type: 'assistant/chunk', seq: 2, time: 2, data: { turn: 1, step: 0, chunk: { type: 'text-delta', index: 0, text: '好' } } } },
      { type: 'event', event: { type: 'assistant/chunk', seq: 3, time: 3, data: { turn: 1, step: 0, chunk: { type: 'text-delta', index: 0, text: '，这就画' } } } },
      { type: 'event', event: { type: 'assistant/message', seq: 4, time: 4, data: { turn: 1, step: 0, message: { content: [{ type: 'text', text: '好，这就画' }] } } } },
      { type: 'event', event: { type: 'tool/call', seq: 5, time: 5, data: { turn: 1, step: 0, callId: 'c1', name: 'directorx_generate_image', arguments: '{"prompt":"cat"}' } } },
      { type: 'event', event: { type: 'tool/result', seq: 6, time: 6, data: { turn: 1, step: 0, message: { content: [{ type: 'tool-result', toolCallId: 'c1', content: [{ type: 'text', text: '{"done":true}' }] }] } } } },
    ],
    hasMore: false,
    revision: 1,
    change: { kind: 'replace', entries: [] },
  }, { running: false, openState: 'open' })

  assert.equal(model.ready, true)
  assert.deepEqual(model.lines.map(line => [line.kind, line.text, line.status ?? '']), [
    ['user', '画一只猫', ''],
    ['assistant', '好，这就画', ''],
    ['tool', 'generate image：', 'ok'],
  ])
  assert.equal(model.lines[2]?.result, '{"done":true}')
})

test('dockItemsFromWindow keeps streaming text and running call markers alive mid-turn', () => {
  const model = dockItemsFromWindow({
    entries: [
      { type: 'event', event: { type: 'assistant/chunk', seq: 1, time: 1, data: { turn: 2, step: 0, chunk: { type: 'text-delta', index: 0, text: '还在生成' } } } },
      { type: 'event', event: { type: 'tool/call', seq: 2, time: 2, data: { turn: 2, step: 0, callId: 'c9', name: 'directorx_generate_video', arguments: '{}' } } },
    ],
    hasMore: false,
    revision: 1,
    change: { kind: 'append', entries: [] },
  }, { running: true, openState: 'open' })

  assert.equal(model.running, true)
  const kinds = model.lines.map(line => [line.kind, line.status ?? (line.streaming ? 'streaming' : '')])
  assert.deepEqual(kinds, [
    ['assistant', 'streaming'],
    ['tool', 'running'],
  ])
})

test('dockItemsFromWindow expands packed chunk rows when no message settles', () => {
  const model = dockItemsFromWindow({
    entries: [
      { type: 'chunks', event: { type: 'chunkrow/text-chunks', seq: 10, time: 10, data: { turn: 3, step: 1, index: 0, dt: [], texts: ['前面', '部分'] } } },
    ],
    hasMore: false,
    revision: 0,
    change: { kind: 'replace', entries: [] },
  }, { running: false, openState: 'open' })
  assert.deepEqual(model.lines.map(line => [line.kind, line.text, line.streaming === true]), [
    ['assistant', '前面部分', true],
  ])
})

test('waitsFromPending maps alpha.1 question and approval carriers', async () => {
  const carried = []
  const pending = {
    getSnapshot() {
      return new Map([
        ['s1', {
          kind: 'approval', key: 'k1', sessionId: 's1', toolName: 'bash', reason: '写入',
          answer: async outcome => { carried.push(['approve', outcome]) },
        }],
        ['s2', undefined],
      ])
    },
    subscribe() { return () => {} },
  }
  const waits = waitsFromPending(pending, 's1')
  assert.equal(waits.length, 1)
  assert.equal(waits[0].kind, 'approval')
  assert.equal(waits[0].toolName, 'bash')
  await waits[0].respond({ ok: true, value: { sessionId: 's1', approvalId: 'k1', outcome: 'allowed-once' } })
  assert.deepEqual(carried, [['approve', 'allowed-once']])
  assert.deepEqual(waitsFromPending(pending, 'nope'), [])
})

test('waitsFromPending answers question carriers with the answers batch', async () => {
  let answered
  const pending = {
    getSnapshot() {
      return new Map([['s1', {
        kind: 'question', key: 'q1', sessionId: 's1',
        questions: [{ id: 'q', question: '选哪个？', options: [{ label: 'A' }, { label: 'B' }] }],
        answer: async batch => { answered = batch },
      }]])
    },
    subscribe() { return () => {} },
  }
  const waits = waitsFromPending(pending, 's1')
  assert.equal(waits.length, 1)
  assert.equal(waits[0].questions[0]?.question, '选哪个？')
  await answerQuestion(waits[0], [{ id: 'q', selected: ['A'] }])
  assert.deepEqual(answered, { answers: [{ id: 'q', selected: ['A'] }] })
})
