import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  applyConfirmAnswers,
  buildConfirmQuestions,
  composeProductionFlow,
  confirmProduction,
  formatProductionBoard,
  parseDirectorxCommand,
  ProposalStore,
  registerDirectorxCommands,
  runDirectorxCommand,
  directorxCommandLine,
  executeDirectorxLine,
} from '../lib/testing.js'

test('executeDirectorxLine prefers remote.commands then connection.api', async () => {
  assert.equal(directorxCommandLine('board'), '/directorx board')
  assert.equal(directorxCommandLine('shotlist'), '/directorx shotlist')
  const remoteCalls = []
  const apiCalls = []
  await executeDirectorxLine({
    get(name) {
      if (name === 'remote') {
        return { commands: { execute: async (sessionId, line, images) => { remoteCalls.push({ sessionId, line, images }) } } }
      }
      throw new Error(name)
    },
  }, 'sess-1', '/directorx next')
  assert.deepEqual(remoteCalls, [{ sessionId: 'sess-1', line: '/directorx next', images: [] }])
  await executeDirectorxLine({
    get(name) {
      if (name === 'connection') {
        return { api: { commands: { execute: async (request) => { apiCalls.push(request) } } } }
      }
      throw new Error(name)
    },
  }, 'sess-2', '/directorx board')
  assert.deepEqual(apiCalls, [{ sessionId: 'sess-2', agentId: 'sess-2', line: '/directorx board', images: [] }])
})

test('parseDirectorxCommand owns the /directorx grammar', () => {
  assert.equal(parseDirectorxCommand(''), 'board')
  assert.equal(parseDirectorxCommand('  board  '), 'board')
  assert.equal(parseDirectorxCommand('shotlist'), 'shotlist')
  assert.equal(parseDirectorxCommand('proposals extra'), 'proposals')
  assert.equal(parseDirectorxCommand('next'), 'next')
  assert.equal(parseDirectorxCommand('unknown'), 'help')
})

test('formatProductionBoard counts shots and proposals for the command plane', () => {
  const board = formatProductionBoard({
    shotlist: {
      title: 'moss promo',
      rows: [
        { index: 1, id: 'n1', kind: 'video', label: 'open', prompt: 'wide 4s', durationSec: 4, continuity: [], status: 'idea' },
      ],
      totalDurationSec: 4,
      targetSeconds: 30,
      remainingSeconds: 26,
      markdown: '# moss promo',
    },
    proposals: [
      { id: 'proposal-a', kind: 'video', prompt: 'open', count: 1, status: 'proposed', at: 1, attempts: 0 },
      { id: 'proposal-b', kind: 'image', prompt: 'poster', count: 1, status: 'approved', at: 2, attempts: 0 },
    ],
  })
  assert.equal(board.counts.shots, 1)
  assert.equal(board.counts.proposed, 1)
  assert.equal(board.counts.approved, 1)
  assert.equal(board.nextId, 'proposal-a')
  assert.match(board.markdown, /Shots 1 · 4s \/ target 30s/)
  assert.match(board.markdown, /\/directorx shotlist/)
  assert.match(board.markdown, /directorx_confirm/)
})

test('buildConfirmQuestions and applyConfirmAnswers sign off the ledger', () => {
  const proposals = [
    { id: 'proposal-a', kind: 'video', prompt: 'rain alley 6s', count: 1, status: 'proposed', at: 1, attempts: 0 },
    { id: 'proposal-b', kind: 'video', prompt: 'close 4s', count: 1, status: 'proposed', at: 2, attempts: 0 },
  ]
  const nextQs = buildConfirmQuestions({ scope: 'next', proposals })
  assert.equal(nextQs[0].id, 'next')
  assert.ok(nextQs[0].options.some(option => option.label === '批准'))
  assert.deepEqual(
    applyConfirmAnswers({ answers: [{ id: 'next', selected: ['批准'] }], proposals }),
    [{ id: 'proposal-a', status: 'approved' }],
  )
  assert.deepEqual(
    applyConfirmAnswers({ answers: [{ id: 'next', selected: ['拒绝'] }], proposals }),
    [{ id: 'proposal-a', status: 'rejected' }],
  )

  const batch = buildConfirmQuestions({ scope: 'proposals', proposals })
  assert.equal(batch[0].multiSelect, true)
  assert.deepEqual(
    applyConfirmAnswers({ answers: [{ id: 'proposals', selected: ['proposal-b'] }], proposals }),
    [{ id: 'proposal-b', status: 'approved' }],
  )

  const sheet = buildConfirmQuestions({
    scope: 'shotlist',
    proposals,
    shotlist: { title: 'alley', rows: [], totalDurationSec: 0, markdown: '# alley' },
  })
  assert.ok(sheet[0].options.some(option => option.label === '整表签字'))
  assert.deepEqual(
    applyConfirmAnswers({ answers: [{ id: 'shotlist', selected: ['整表签字'] }], proposals }),
    [
      { id: 'proposal-a', status: 'approved' },
      { id: 'proposal-b', status: 'approved' },
    ],
  )
})

test('confirmProduction pauses on ask() and writes approved proposals', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-confirm-'))
  try {
    const store = new ProposalStore(dir)
    const queued = await store.propose({ kind: 'video', prompt: 'red scarf walk 5s', count: 1, model: 'kling-3.0' })
    const asked = []
    const result = await confirmProduction({
      scope: 'next',
      outputDir: dir,
      ask: async (request) => {
        asked.push(request.questions[0].id)
        return { answers: [{ id: 'next', selected: ['批准'] }] }
      },
    })
    assert.deepEqual(asked, ['next'])
    assert.deepEqual(result.applied, [{ id: queued.id, status: 'approved' }])
    const after = await store.get(queued.id)
    assert.equal(after.status, 'approved')
    assert.equal(result.board.counts.approved, 1)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('runDirectorxCommand renders the board and shotlist from disk', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'directorx-cmd-'))
  try {
    await new ProposalStore(dir).propose({ kind: 'image', prompt: 'poster 1:1', count: 1, size: '1024x1024' })
    const board = await runDirectorxCommand('', dir)
    assert.equal(board.kind, 'success')
    assert.match(board.text, /Proposals proposed 1/)
    const help = await runDirectorxCommand('nope', dir)
    assert.equal(help.kind, 'error')
    assert.match(help.text, /Usage: \/directorx/)
    const list = await runDirectorxCommand('proposals', dir)
    assert.match(list.text, /poster 1:1/)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('registerDirectorxCommands attaches /directorx when ctx.commands is composed', () => {
  const registered = []
  const ctx = {
    inject(deps, callback) {
      assert.deepEqual(deps, ['commands'])
      return callback({
        commands: {
          register(definition) {
            registered.push(definition)
            return () => {
              registered.length = 0
            }
          },
        },
      })
    },
    get() { return undefined },
  }
  registerDirectorxCommands(ctx, () => 'unused')
  assert.equal(registered.length, 1)
  assert.equal(registered[0].name, 'directorx')
  assert.match(registered[0].description, /production board/)
})

test('compose sign-off stage uses directorx_confirm on the DSH ask seam', () => {
  const promo = composeProductionFlow({ type: '广告/宣传', request: '给模思做宣传片' })
  assert.ok(promo.stages.some(stage => stage.tools.includes('directorx_confirm')))
  assert.ok(promo.nextActions.some(line => line.includes('directorx_confirm')))
  assert.ok(promo.nextActions.some(line => line.includes('/directorx')))
})
