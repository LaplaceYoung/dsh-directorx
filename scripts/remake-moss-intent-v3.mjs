#!/usr/bin/env node
/**
 * Moss TVC 上半 v3 — 只重做第一段 15s。
 * 旧病：5 镜、平均 3s、同一会议中景坐死。
 * v3：9 镜、1.2–1.6s 一切，景别/轴线/插入轮换，手册硬切。
 * 官方双波标仍当参考图。kie image2 出覆盖静帧，kie H3 ref2v 出片。
 * 不覆盖 v1，不重跑下半 mark.mp4。
 */
import { mkdir, writeFile, appendFile, readFile, copyFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  DirectorxCanvasStore,
  ResearchLedger,
  commitGenerateReady,
  craftPrompt,
  probeMedia,
  resolveOutputDir,
  runInProject,
  videoConcat,
} from '../lib/testing.js'
import { kieH3Ref2v, kieImage2, loadKieKey } from './kie-jobs.mjs'

const pluginRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const jobRoot = resolve(pluginRoot, '..', 'directorx_productions', '07-moss-tvc-pro')
const issuesPath = join(jobRoot, 'ISSUES.md')
const statePath = join(jobRoot, 'STATE-v2.json')
const v2Out = join(jobRoot, 'out-v2')
const plates = join(v2Out, 'plates')

const KNOWLEDGE = ['01', '02', '11', '21', '105', '135', '188']
const SKILLS = ['minimax-h3-prompt-copilot', 'directorx-chengpian', 'storyboard-craft']
const LOOK = 'Premium technology commercial, live-action, Shanghai dawn mercury-blue glass plus one tungsten lamp. 16:9 anamorphic 35mm, fine grain. Fast TVC coverage, not a single-master sit-down. Software and voices, not a gadget.'

function capTemplate() {
  return {
    enabled: true, mode: 'mock', baseURL: '', apiKey: '', model: '', resolution: '1K',
    auth: { klingAk: '', klingSk: '', runwayVersion: '' },
  }
}

function coerce(raw) {
  const value = raw.trim().replace(/^['"]|['"]$/g, '')
  if (value === 'true') return true
  if (value === 'false') return false
  if (/^\d+$/.test(value)) return Number(value)
  return value
}

function loadDirectorxSettings() {
  const raw = readFileSync(join(homedir(), '.dsh/settings.yaml'), 'utf8')
  const lines = raw.split('\n')
  const start = lines.findIndex(line => /^directorx:\s*$/.test(line))
  if (start < 0) throw new Error('~/.dsh/settings.yaml 没有 directorx 段')
  const settings = {
    outputDir: 'out', timeoutMs: 1_200_000, pollIntervalMs: 5_000, maxPollAttempts: 240,
    persona: '成片', initiative: '自动',
    vision: capTemplate(), image: capTemplate(), video: capTemplate(), audio: capTemplate(),
  }
  let current
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i]
    if (line.trim() === '' || line.trim().startsWith('#')) continue
    if (/^\S/.test(line)) break
    const top = line.match(/^  ([A-Za-z]+):\s*(.*)$/)
    const nested = line.match(/^    ([A-Za-z]+):\s*(.*)$/)
    if (top && !line.startsWith('    ')) {
      if (['vision', 'image', 'video', 'audio'].includes(top[1]) && top[2] === '') {
        current = top[1]
        continue
      }
      current = undefined
      if (top[1] in settings && typeof settings[top[1]] !== 'object') settings[top[1]] = coerce(top[2])
      continue
    }
    if (nested && current !== undefined && nested[1] !== 'auth' && nested[1] in settings[current]) {
      settings[current][nested[1]] = coerce(nested[2])
    }
  }
  return settings
}

async function loadState() {
  if (!existsSync(statePath)) return { plates: {}, clips: {}, packed: '' }
  try { return JSON.parse(await readFile(statePath, 'utf8')) } catch {
    return { plates: {}, clips: {}, packed: '' }
  }
}

async function saveState(state) {
  await writeFile(statePath, JSON.stringify(state, null, 2), 'utf8')
}

async function noteIssue(title, detail, fix) {
  await appendFile(issuesPath, `## ${new Date().toISOString()} · ${title}\n\n${detail}\n\n**处理：** ${fix}\n\n`, 'utf8')
  console.log(`  ISSUE ${title}`)
}

function intentPrompt() {
  return [
    'subject_definitions:',
    '<Subject 1> dawn look from @图片1: Bund, mercury-blue glass, one tungsten square. Palette and architecture only.',
    '<Subject 2> meeting from @图片2: three East Asian colleagues, thirties, dark knit and wool, walnut table, ordinary laptops, same dawn windows. No aluminum puck.',
    '<Subject 3> type plate from @图片3: treat as a picture, not OCR. Exact glyphs only.',
    '<Subject 4> official Moss double-sine wave from @图片4: treat as a picture. Keep crossing geometry, stroke, hollow diamonds. No single-wave, no purple dot.',
    '<Subject 5> type plate from @图片5: treat as a picture, not OCR.',
    '<Subject 6> messy-waveform ECU from @图片6: tangled teal traces on a dark editor. No readable brand chrome.',
    '<Subject 7> lamp ECU from @图片7: tungsten shade and filament, city in the glass.',
    '<Subject 8> speaking profile from @图片8: left colleague, mouth mid-sentence, same wardrobe.',
    '',
    'summary: [reference generation] First 15 seconds of a 30s TVC. Fast coverage, default hard cuts. @图片1 world. @图片2 room and cast. @图片3 and @图片5 type as pictures. @图片4 official mark as a picture. @图片6 waveform insert. @图片7 lamp insert. @图片8 speaker insert. Not a single-master scene.',
    '',
    'retention_analysis:',
    '<Subject 1> (establishing wides): partially_preserved - dawn glass and river.',
    '<Subject 2> (every people shot): fully_preserved - three faces, table, ordinary laptops.',
    '<Subject 3>: fully_preserved - exact painted glyphs.',
    '<Subject 4> (graphic lock): fully_preserved - official double-wave.',
    '<Subject 5>: fully_preserved - exact painted glyphs.',
    '<Subject 6> (waveform inserts): fully_preserved - tangled teal traces.',
    '<Subject 7> (opening insert): fully_preserved - lamp and glass.',
    '<Subject 8> (speaker inserts): fully_preserved - that face and mouth.',
    '',
    `integrated_multimodal_description: ${LOOK} `,
    '[Shot 1] Extreme close-up of <Subject 7> tungsten filament behind frosted glass, Bund reflection in the pane. Static, then a micro tilt up with small amplitude at fast speed. City hush.',
    '[Shot 2] At 00:01.200, the camera cuts to an extreme wide of <Subject 1> glass tower at dawn. Truck left with small amplitude at fast speed. One warm window is the lamp.',
    '[Shot 3] At 00:02.400, the camera cuts to an extreme close-up of <Subject 8> in profile, mouth moving, overlapping Mandarin. Push in with small amplitude at fast speed.',
    '[Shot 4] At 00:03.600, the camera cuts to an insert: a phone face-down on the walnut and a second mouth from <Subject 2> talking over him. Static. New information is the pile-up of voices.',
    '[Shot 5] At 00:04.800, the camera cuts to a medium-wide of <Subject 2> all three speaking at once. Front laptop shows the tangle from <Subject 6>. Truck right with small amplitude at fast speed.',
    '[Shot 6] At 00:06.200, the camera cuts to an extreme close-up of <Subject 6>, the tangle shaking. On-screen type from <Subject 3> as the picture "听不清" for eight frames in the lower third, then gone.',
    '[Shot 7] At 00:07.700, the camera cuts on the same screen axis: the tangle splits into three clean teal speaker lanes. A hand lifts off the keys. One action only.',
    '[Shot 8] At 00:09.200, the camera cuts to a close-up of the woman at the middle of <Subject 2>, she exhales, eyes clear. On-screen type from <Subject 5> as the picture "听懂了" for ten frames.',
    '[Shot 9] At 00:10.700, the camera cuts to a graphic insert on a dark mercury field: the official mark from <Subject 4> draws left to right along its own path, one continuous motion core, slight overshoot, then settles. Treat as a picture. Hard end. Do not fade. Do not invent a different icon.',
    '',
    'overall_soundscape: Filament tick, river hush, then three overlapping Mandarin voices, chair scrape, keys. Voices separate into clean lanes on Shot 7. Room drops under the mark. No extra chatter after the split.',
    '',
    'non_diegetic_music: Tight analog tick on every cut. Sparse pad under the wides. A short lift into Shot 9. Dry cut at the end. Does not resolve.',
    '',
    '不想要: no fade, no dissolve, no letterbox, no aluminum puck, no brushed-metal gadget, no neon, no cyber rain, no sitting in one master for more than two seconds, no extra logos, no extra readable glyphs beyond the quoted plates, no public figures.',
  ].join('\n')
}

async function ensurePlate(kieKey, dest, references, prompt) {
  if (existsSync(dest)) {
    console.log(`  reuse plate ${dest}`)
    return dest
  }
  console.log(`  kie image2 ${dest}`)
  try {
    return await kieImage2(kieKey, { dest, references, prompt, aspectRatio: '16:9', resolution: '2K' })
  } catch (error) {
    await noteIssue(`image2 ${dest}`, error instanceof Error ? error.message : String(error), '覆盖静帧失败，H3 仍用已有室内/黎明。')
    return references[0]
  }
}

async function main() {
  await mkdir(plates, { recursive: true })
  await appendFile(issuesPath, `## 2026-08-18 · 上半 v3 重排\n\n- v2 上半 5 镜、会议中景坐死、波形特写过长。\n- v3：9 镜覆盖（灯丝/大远/口型/插入/中全/乱波/分轨/反应/标），kie H3 一条 15s。\n\n`, 'utf8')

  const kieKey = loadKieKey()
  const loaded = loadDirectorxSettings()
  const settings = { ...loaded, outputDir: join(jobRoot, 'out-v2'), timeoutMs: 1_200_000 }
  await mkdir(resolveOutputDir(settings.outputDir), { recursive: true })
  const state = await loadState()
  const out = resolveOutputDir(settings.outputDir)

  const lookDawn = join(plates, 'look-dawn-16x9.png')
  const lookInterior = join(plates, 'look-interior-kie.png')
  const lockup = join(plates, 'lockup-mark.png')
  const typeHear = join(plates, 'type-tingbuqing.png')
  const typeGot = join(plates, 'type-tingdong.png')
  if (!existsSync(lookDawn) || !existsSync(lookInterior) || !existsSync(lockup)) {
    throw new Error('缺少黎明/室内/官方标，先跑 v2 资产')
  }

  const lookLamp = await ensurePlate(
    kieKey,
    join(plates, 'look-lamp-ecu.png'),
    [lookDawn],
    'Extreme close-up still from the same Shanghai dawn glass office. A tungsten desk-lamp shade and warm filament fill the frame, the Bund skyline is only a soft reflection in the glass. No people, no laptop, no aluminum gadget, no logo, no readable text. Cinematic 16:9, shallow depth.',
  )
  const lookSpeaker = await ensurePlate(
    kieKey,
    join(plates, 'look-speaker-ecu.png'),
    [lookInterior],
    'Extreme close-up still of the left East Asian man from the reference, three-quarter profile, mouth mid-sentence, dark knit sweater, same mercury-blue window light. Only his face and collar. No extra people, no aluminum gadget, no logo, no readable text. Cinematic 16:9.',
  )
  const lookWave = await ensurePlate(
    kieKey,
    join(plates, 'look-wave-ecu.png'),
    [lookInterior],
    'Extreme close-up still of a laptop screen in that same office: a dark audio editor filled with messy overlapping teal waveforms tangled together. No brand name, no readable UI words, no aluminum gadget, no people except a faint reflection. Cinematic 16:9.',
  )

  const refs = [lookDawn, lookInterior, typeHear, lockup, typeGot, lookWave, lookLamp, lookSpeaker]
  const dest = join(out, 'intent-v3.mp4')
  const snapshot = { characters: [], nodes: [], edges: [] }
  const intent = 'Moss TVC 上半 v3：15s 九镜覆盖，意图到能力'
  const prompt = intentPrompt()

  const research = new ResearchLedger(settings.outputDir)
  for (const ref of KNOWLEDGE) await research.record({ kind: 'knowledge', ref })
  for (const name of SKILLS) await research.record({ kind: 'skill', ref: name })

  const result = await runInProject(jobRoot, async () => {
    if (existsSync(dest)) {
      console.log(`  reuse ${dest}`)
    } else {
      let lastError
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          console.log(`  craft #${attempt}: ${intent}`)
          const crafted = await craftPrompt({
            outputDir: settings.outputDir, kind: 'video', intent, prompt,
            knowledgeRefs: KNOWLEDGE, skillNames: SKILLS, externalNotes: 'moss-tvc-intent-v3-dense',
          })
          if (crafted.ok !== true) throw new Error(`prompt_craft 拒绝：${JSON.stringify(crafted).slice(0, 400)}`)
          const ready = await commitGenerateReady({
            outputDir: settings.outputDir, craftId: crafted.craftId, kind: 'video', intent,
            prompt: crafted.prompt, strategy: 'ref2v', referenceImages: refs, snapshot,
          })
          if (ready.ok !== true) throw new Error(`generate_ready 拒绝：${ready.reason ?? JSON.stringify(ready).slice(0, 400)}`)
          console.log('  kie h3 ref2v 15s 2K')
          await kieH3Ref2v(kieKey, {
            prompt: crafted.prompt, references: refs, dest,
            seconds: 15, aspectRatio: '16:9', resolution: '2K',
          })
          lastError = undefined
          break
        } catch (cause) {
          lastError = cause instanceof Error ? cause : new Error(String(cause))
          const fatal = /401|402|Insufficient Credits|Unauthorized/.test(lastError.message)
          await noteIssue(`${intent} 第 ${attempt} 次`, lastError.message.slice(0, 800), fatal ? 'kie 鉴权/额度，停。' : '重提。')
          if (fatal) throw lastError
        }
      }
      if (lastError) throw lastError
    }

    const mark = state.clips.mark
    if (typeof mark !== 'string' || !existsSync(mark)) throw new Error('下半 mark.mp4 不在，不能拼成片')
    const packed = await videoConcat({
      files: [dest, mark],
      outputDir: settings.outputDir,
      transition: 'cut',
      scale: '2560:1440',
    })
    if (typeof packed.path !== 'string' || packed.path === '') throw new Error('concat 没有 path')
    const deliver = join(jobRoot, 'Moss智能-30s-TVC-v2.mp4')
    await copyFile(packed.path, deliver)
    state.clips.intentPrev = state.clips.intent
    state.clips.intent = dest
    state.packed = packed.path
    state.plates = { ...state.plates, lookLamp, lookSpeaker, lookWave }
    await saveState(state)

    const canvas = new DirectorxCanvasStore(settings.outputDir)
    await canvas.addNode({ kind: 'video', label: '上半 v3 九镜', path: dest, prompt: 'intent-v3', durationSec: 15 }).catch(() => {})

    const info = probeMedia(deliver)
    await writeFile(join(jobRoot, 'REPORT-intent-v3.md'), [
      '# Moss TVC 上半 v3',
      '',
      `- 新上半：${dest}`,
      `- 成片：${deliver}`,
      `- 探针：${JSON.stringify(info)}`,
      '- 9 镜 / 15s。覆盖：灯丝 ECU、大远、口型、插入、中全、乱波、分轨、反应、官方标擦出。',
      '- 下半 mark.mp4 未重跑。v1 未覆盖。',
      '',
    ].join('\n'))
    return { deliver, intent: dest, packPath: packed.path, info }
  })

  console.log(JSON.stringify(result, null, 2))
}

main().catch(async error => {
  await appendFile(issuesPath, `## FATAL intent-v3\n\n${error instanceof Error ? error.stack ?? error.message : String(error)}\n\n`).catch(() => {})
  console.error(error)
  process.exit(1)
})
