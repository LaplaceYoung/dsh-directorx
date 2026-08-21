#!/usr/bin/env node
/**
 * Moss TVC 下半 v3 — 只重做第二段 15s。
 * 旧病：5 镜、会议中景 + 笔记本坐死、标卡跳切、片尾丢标。
 * v3：10 镜覆盖（播放头/屏幕/手/围观/口播/反应/过肩/竖缝/擦出/锁版），手册硬切 + MG。
 * kie image2 出覆盖静帧，kie H3 ref2v 出片。上半 intent-v3 不重跑。不覆盖 v1。
 */
import { mkdir, writeFile, appendFile, readFile, copyFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
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

const KNOWLEDGE = ['01', '02', '11', '21', '105', '135', '194']
const SKILLS = ['minimax-h3-prompt-copilot', 'directorx-chengpian', 'storyboard-craft']
const LOOK = 'Premium technology commercial, live-action, Shanghai dawn mercury-blue glass plus one tungsten lamp. 16:9 anamorphic 35mm, fine grain. Fast TVC coverage for the result-to-mark half. Software and voices, not a gadget.'

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

function markPrompt() {
  return [
    'subject_definitions:',
    '<Subject 1> laptop editor from @图片1: ordinary MacBook, three clean teal speaker lanes, Bund preview, timeline assembling. Same dawn window. No aluminum puck.',
    '<Subject 2> meeting from @图片2: three East Asian colleagues, thirties, dark knit and wool, walnut table, tungsten lamp, same dawn glass. No branded hardware.',
    '<Subject 3> type plate from @图片3: treat as a picture, not OCR. Exact glyphs only.',
    '<Subject 4> official Moss double-sine wave from @图片4: treat as a picture. Keep crossing geometry, stroke, hollow diamonds. No single-wave, no purple dot.',
    '<Subject 5> type plate from @图片5: treat as a picture, not OCR. Moss / mossland.studio.',
    '<Subject 6> playhead ECU from @图片6: a blue playhead racing across clips on a dark timeline. No readable brand words.',
    '<Subject 7> woman close-up from @图片7: the middle colleague, black blazer, calm face, same mercury-blue window.',
    '<Subject 8> hand-on-trackpad insert from @图片8: one hand tapping play on the laptop. Same wood desk.',
    '<Subject 9> dawn glass from @图片9: Bund and river in the window only.',
    '',
    'summary: [reference generation] Second 15 seconds of a 30s TVC. Result, proof, then mark. Fast coverage, default hard cuts. @图片1 editor. @图片2 room and cast. @图片3 and @图片5 type as pictures. @图片4 official mark as a picture. @图片6 playhead insert. @图片7 woman. @图片8 hand. @图片9 city glass. Not a single-master sit-down. Ending logo stays on the official mark.',
    '',
    'retention_analysis:',
    '<Subject 1> (laptop shots): fully_preserved - ordinary laptop, clean lanes, Bund preview.',
    '<Subject 2> (people shots): fully_preserved - three faces, table, lamp.',
    '<Subject 3>: fully_preserved - exact painted glyphs.',
    '<Subject 4> (every graphic beat): fully_preserved - official double-wave. Must remain on screen through the last shot.',
    '<Subject 5>: fully_preserved - exact painted glyphs.',
    '<Subject 6> (opening insert): fully_preserved - playhead and clip blocks.',
    '<Subject 7> (dialogue and nod): fully_preserved - that woman.',
    '<Subject 8> (play insert): fully_preserved - hand and trackpad.',
    '<Subject 9> (OTS glass): partially_preserved - dawn city only.',
    '',
    `integrated_multimodal_description: ${LOOK} `,
    '[Shot 1] Extreme close-up of <Subject 6>: the playhead slams right, clip blocks snap onto the track. Truck right with small amplitude at fast speed. One action only.',
    '[Shot 2] At 00:01.200, the camera cuts to a close-up of <Subject 1> laptop: three clean teal lanes and the Bund preview playing. Push in with small amplitude at fast speed.',
    '[Shot 3] At 00:02.500, the camera cuts to <Subject 8> tapping the trackpad once. The preview jumps to play. Static. One action only.',
    '[Shot 4] At 00:03.700, the camera cuts to a medium of <Subject 2> all three leaning toward the laptop. Truck left with small amplitude at fast speed. New information is the group watching the result.',
    '[Shot 5] At 00:05.100, the camera cuts to a close-up of <Subject 7> (S1). She says, <d>[Chinese] 一次说清。</d> Lips match. Line lasts under one second.',
    '[Shot 6] At 00:06.500, the camera cuts to an extreme close-up of <Subject 7> eyes. She nods once. New information is relief, not more talk.',
    '[Shot 7] At 00:07.800, the camera cuts to an over-the-shoulder: <Subject 2> in the foreground, <Subject 9> dawn city in the glass, the finished clip playing on <Subject 1>. Pull out with small amplitude at slow speed.',
    '[Shot 8] At 00:09.200, the camera cuts to a named graphic wipe: a vertical slit of dark mercury opens like a sleeve. Negative space. No people.',
    '[Shot 9] At 00:10.400, the camera cuts to the official mark from <Subject 4> drawing left to right along its own path, one continuous motion core, slight overshoot, then settles. Type from <Subject 3> as the picture "情境智能" sits above the mark. Treat both as pictures.',
    '[Shot 10] At 00:12.800, the camera cuts to the ending lockup on the same dark field: <Subject 4> remains fully visible and centered, and type from <Subject 5> as the picture "Moss" / "mossland.studio" sits under the mark. The mark does not leave the frame. Static. Hard end. Do not fade. Do not invent a different icon.',
    '',
    'overall_soundscape: Timeline clicks, a single tap, clean single Mandarin line, then room tone drops under the mark. One soft tick when the mark settles. No extra dialogue after the spoken line.',
    '',
    'non_diegetic_music: Tight analog tick on every live-action cut. Pad lifts through Shot 7. Pulse peaks under the settled mark and holds through Shot 10. No fade-out.',
    '',
    '不想要: no fade, no dissolve, no letterbox, no aluminum puck, no brushed-metal gadget, no neon, no cyber rain, no sitting in one master for more than two seconds, no dropping the official mark on the last card, no extra logos, no extra readable glyphs beyond the quoted plates, no public figures.',
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
    await noteIssue(`image2 ${dest}`, error instanceof Error ? error.message : String(error), '覆盖静帧失败，H3 仍用时间线/室内。')
    return references[0]
  }
}

async function main() {
  await mkdir(plates, { recursive: true })
  await appendFile(issuesPath, `## 2026-08-18 · 下半 v3 重排\n\n- v2 下半 5 镜、中景+笔记本坐死、片尾丢标。\n- v3：10 镜覆盖，结果→证据→标，kie H3 一条 15s。上半 intent-v3 保留。\n\n`, 'utf8')

  const kieKey = loadKieKey()
  const loaded = loadDirectorxSettings()
  const settings = { ...loaded, outputDir: join(jobRoot, 'out-v2'), timeoutMs: 1_200_000 }
  await mkdir(resolveOutputDir(settings.outputDir), { recursive: true })
  const state = await loadState()
  const out = resolveOutputDir(settings.outputDir)

  const lookDawn = join(plates, 'look-dawn-16x9.png')
  const lookInterior = join(plates, 'look-interior-kie.png')
  const lookTimeline = join(plates, 'look-timeline-kie.png')
  const lockup = join(plates, 'lockup-mark.png')
  const typeCtx = join(plates, 'type-qingjing.png')
  const typeCta = join(plates, 'type-cta.png')
  const intent = state.clips.intent
  if (!existsSync(lookDawn) || !existsSync(lookInterior) || !existsSync(lookTimeline) || !existsSync(lockup)) {
    throw new Error('缺少黎明/室内/时间线/官方标')
  }
  if (typeof intent !== 'string' || !existsSync(intent)) throw new Error('上半 intent 不在，不能拼成片')

  const lookPlayhead = await ensurePlate(
    kieKey,
    join(plates, 'look-playhead-ecu.png'),
    [lookTimeline],
    'Extreme close-up still of a dark video timeline: a bright blue playhead and a few clip blocks, no readable software name, no people, no aluminum gadget. Cinematic 16:9, shallow depth, same warm lamp color at the edge.',
  )
  const lookWoman = await ensurePlate(
    kieKey,
    join(plates, 'look-woman-cu.png'),
    [lookInterior],
    'Close-up still of the East Asian woman in the middle of the reference, black blazer, calm face, mercury-blue Shanghai dawn in the glass behind her. Shoulders and face only. No extra people, no laptop filling the frame, no aluminum gadget, no logo, no readable text. Cinematic 16:9.',
  )
  const lookHand = await ensurePlate(
    kieKey,
    join(plates, 'look-hand-play.png'),
    [lookTimeline],
    'Insert still: one hand tapping the trackpad of the same ordinary laptop on the walnut desk, play about to start. No face, no aluminum gadget, no logo, no readable text. Cinematic 16:9, tungsten lamp edge light.',
  )

  const refs = [lookTimeline, lookInterior, typeCtx, lockup, typeCta, lookPlayhead, lookWoman, lookHand, lookDawn]
  const dest = join(out, 'mark-v3.mp4')
  const snapshot = { characters: [], nodes: [], edges: [] }
  const packIntent = 'Moss TVC 下半 v3：15s 十镜覆盖，结果到标'
  const prompt = markPrompt()

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
          console.log(`  craft #${attempt}: ${packIntent}`)
          const crafted = await craftPrompt({
            outputDir: settings.outputDir, kind: 'video', intent: packIntent, prompt,
            knowledgeRefs: KNOWLEDGE, skillNames: SKILLS, externalNotes: 'moss-tvc-mark-v3-dense',
          })
          if (crafted.ok !== true) throw new Error(`prompt_craft 拒绝：${JSON.stringify(crafted).slice(0, 400)}`)
          const ready = await commitGenerateReady({
            outputDir: settings.outputDir, craftId: crafted.craftId, kind: 'video', intent: packIntent,
            prompt: crafted.prompt, strategy: 'ref2v', referenceImages: refs, snapshot,
          })
          if (ready.ok !== true) throw new Error(`generate_ready 拒绝：${ready.reason ?? JSON.stringify(ready).slice(0, 400)}`)
          console.log('  kie h3 ref2v 15s 768P')
          await kieH3Ref2v(kieKey, {
            prompt: crafted.prompt, references: refs, dest,
            seconds: 15, aspectRatio: '16:9', resolution: '768P',
          })
          lastError = undefined
          break
        } catch (cause) {
          lastError = cause instanceof Error ? cause : new Error(String(cause))
          const fatal = /401|402|insufficient credits|credits insufficient|Unauthorized/i.test(lastError.message)
          await noteIssue(`${packIntent} 第 ${attempt} 次`, lastError.message.slice(0, 800), fatal ? 'kie 鉴权/额度，停。' : '重提。')
          if (fatal) throw lastError
        }
      }
      if (lastError) throw lastError
    }

    const packed = await videoConcat({
      files: [intent, dest],
      outputDir: settings.outputDir,
      transition: 'cut',
      scale: '2560:1440',
    })
    if (typeof packed.path !== 'string' || packed.path === '') throw new Error('concat 没有 path')
    const deliver = join(jobRoot, 'Moss智能-30s-TVC-v2.mp4')
    await copyFile(packed.path, deliver)
    state.clips.markPrev = state.clips.mark
    state.clips.mark = dest
    state.packed = packed.path
    state.plates = { ...state.plates, lookPlayhead, lookWoman, lookHand }
    await saveState(state)

    const canvas = new DirectorxCanvasStore(settings.outputDir)
    await canvas.addNode({ kind: 'video', label: '下半 v3 十镜', path: dest, prompt: 'mark-v3', durationSec: 15 }).catch(() => {})

    const info = probeMedia(deliver)
    await writeFile(join(jobRoot, 'REPORT-mark-v3.md'), [
      '# Moss TVC 下半 v3',
      '',
      `- 新下半：${dest}`,
      `- 成片：${deliver}`,
      `- 探针：${JSON.stringify(info)}`,
      '- 10 镜 / 15s。覆盖：播放头、屏幕、手点播放、围观、口播、点头、过肩、竖缝、标擦出、标+CTA 同框。',
      '- 上半 intent-v3 未重跑。v1 未覆盖。',
      '',
    ].join('\n'))
    return { deliver, mark: dest, packPath: packed.path, info }
  })

  console.log(JSON.stringify(result, null, 2))
}

main().catch(async error => {
  await appendFile(issuesPath, `## FATAL mark-v3\n\n${error instanceof Error ? error.stack ?? error.message : String(error)}\n\n`).catch(() => {})
  console.error(error)
  process.exit(1)
})
