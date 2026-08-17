import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { collectToolSpecs, defaultContractSettings } from '../lib/testing.js'

const inventory = JSON.parse(readFileSync(new URL('./fixtures/tool-inventory.json', import.meta.url), 'utf8'))

function namesOf(settings) {
  return collectToolSpecs(settings).map(tool => tool.name).sort()
}

test('registered tool inventory matches the frozen snapshot', () => {
  const names = namesOf(defaultContractSettings())
  assert.deepEqual(names, inventory)
})

test('every tool is a unique directorx_ name with a description', () => {
  const tools = collectToolSpecs()
  const seen = new Set()
  for (const tool of tools) {
    assert.match(tool.name, /^directorx_[a-z0-9_]+$/)
    assert.equal(seen.has(tool.name), false, `duplicate ${tool.name}`)
    seen.add(tool.name)
    assert.equal(typeof tool.description, 'string')
    assert.ok(tool.description.trim() !== '', tool.name)
  }
})

test('every required parameter has a description', () => {
  for (const tool of collectToolSpecs()) {
    const parameters = tool.parameters ?? {}
    for (const [key, spec] of Object.entries(parameters)) {
      if (spec === null || typeof spec !== 'object') continue
      if (spec.required !== true) continue
      assert.equal(typeof spec.description, 'string', `${tool.name}.${key}`)
      assert.ok(spec.description.trim() !== '', `${tool.name}.${key}`)
    }
  }
})

test('every tool output.render accepts a trivial object', () => {
  for (const tool of collectToolSpecs()) {
    assert.equal(typeof tool.output?.render, 'function', tool.name)
    assert.doesNotThrow(() => tool.output.render({}, { ok: true }), tool.name)
  }
})

test('disabling vision unregisters directorx_view_image', () => {
  const names = namesOf(defaultContractSettings({ vision: { ...defaultContractSettings().vision, enabled: false } }))
  assert.equal(names.includes('directorx_view_image'), false)
  assert.ok(names.includes('directorx_generate_image'))
})

test('disabling image unregisters directorx_generate_image', () => {
  const names = namesOf(defaultContractSettings({ image: { ...defaultContractSettings().image, enabled: false } }))
  assert.equal(names.includes('directorx_generate_image'), false)
  assert.ok(names.includes('directorx_view_image'))
})

test('disabling video unregisters directorx_generate_video', () => {
  const names = namesOf(defaultContractSettings({ video: { ...defaultContractSettings().video, enabled: false } }))
  assert.equal(names.includes('directorx_generate_video'), false)
})

test('disabling audio unregisters generate_audio and transcribe_audio', () => {
  const names = namesOf(defaultContractSettings({ audio: { ...defaultContractSettings().audio, enabled: false } }))
  assert.equal(names.includes('directorx_generate_audio'), false)
  assert.equal(names.includes('directorx_transcribe_audio'), false)
})
