import test from 'node:test'
import assert from 'node:assert/strict'
import {
  answerQuestion, createdSessionId, dockItemsFromSnapshot, foldSessionHistory, parseSessionList,
  parseWorkspaceList, pickWorkspaceSession, resolveLiveSession, rpcOk, sessionRunningFromList,
  summarizeToolName, textFromBlocks, toolCaption, wantsCharacterSheet, withCharacterSheetSpec,
} from '../lib/testing.js'

test('textFromBlocks skips reasoning and joins visible text', () => {
  assert.equal(textFromBlocks('  hello  '), 'hello')
  assert.equal(textFromBlocks([
    { type: 'reasoning', text: 'hidden' },
    { type: 'text', text: 'visible' },
    { type: 'text', text: 'line' },
  ]), 'visible\nline')
})

test('summarizeToolName maps canvas tools', () => {
  assert.equal(summarizeToolName('directorx_canvas_add'), '画布：添加')
  assert.equal(summarizeToolName('directorx_generate_video'), '生成视频')
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
