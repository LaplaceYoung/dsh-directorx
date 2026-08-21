#!/usr/bin/env node
/**
 * Moss 30s TVC v2 — 情境智能，不是铝盒。
 *
 * 官方双波形标 + 字标作为 H3 全参考图。动效按手册：
 *   品牌片 意图→能力→结果→证据→标
 *   MG/字体 负空间、一条连续运动核、字图「按图片理解」
 *   片头包装 具名转场（波形自左擦出）
 *   ending logo 单独锁
 * 生成走 kie.ai：gpt-image-2 出氛围/室内，minimax-h3/reference-to-video 出两条 15s。
 * 官方双波标当参考图进 H3，按手册 MG/片头包装做动效。不覆盖 Moss智能-30s-TVC.mp4。
 */
import { mkdir, writeFile, appendFile, readFile, copyFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  CharacterStore,
  DirectorxCanvasStore,
  DirectorxTaskLedger,
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
const v1Out = join(jobRoot, 'out')
const v2Out = join(jobRoot, 'out-v2')

const LOOK_DAWN_SRC = join(v1Out, 'premium-technology-commercial-photograph-2026-08-17T21-32-53Z.png')
const FONT = existsSync('/System/Library/Fonts/STHeiti Medium.ttc')
  ? '/System/Library/Fonts/STHeiti Medium.ttc'
  : '/Library/Fonts/Arial Unicode.ttf'

const KNOWLEDGE = ['11', '21', '38', '105', '135', '194', '195']
const SKILLS = ['minimax-h3-prompt-copilot', 'directorx-chengpian', 'storyboard-craft']

const LOOK = 'Premium technology commercial, live-action, Shanghai dawn mercury-blue glass plus one tungsten lamp. 16:9 anamorphic 35mm, fine grain. Software and voices, not a gadget. No aluminum puck, no brushed metal desktop box, no neon, no cyber rain.'

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
  if (!settings.video.enabled || !settings.video.baseURL || !settings.video.apiKey) {
    throw new Error('video 能力未配置完整')
  }
  return settings
}

function firstPath(result) {
  return result?.files?.find(item => typeof item.path === 'string' && item.path !== '')?.path
}

async function loadState() {
  if (!existsSync(statePath)) return { plates: {}, clips: {}, packed: '' }
  try {
    return JSON.parse(await readFile(statePath, 'utf8'))
  } catch {
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

function ffmpeg(args) {
  const result = spawnSync('ffmpeg', ['-y', ...args], { encoding: 'utf8' })
  if (result.status !== 0) throw new Error(`ffmpeg failed: ${(result.stderr ?? '').slice(-500)}`)
}

function makeTextPlate(dest, lines) {
  const [main, sub] = lines
  const filters = [
    `drawtext=fontfile=${FONT}:text='${main}':fontsize=${sub ? 110 : 96}:fontcolor=white:borderw=0:x=(w-text_w)/2:y=(h-text_h)/2${sub ? '-36' : ''}`,
  ]
  if (sub) {
    filters.push(`drawtext=fontfile=${FONT}:text='${sub}':fontsize=42:fontcolor=0xD8D2C8:x=(w-text_w)/2:y=(h-text_h)/2+72`)
  }
  ffmpeg(['-f', 'lavfi', '-i', 'color=c=0x080A0E:s=2560x1440:d=0.04', '-frames:v', '1', '-update', '1', '-vf', filters.join(','), dest])
}

function cropLook(source, dest) {
  ffmpeg(['-i', source, '-frames:v', '1', '-update', '1', '-vf', 'scale=2560:1440:force_original_aspect_ratio=increase,crop=2560:1440', dest])
}

function padTo169(source, dest, color = '0x080A0E') {
  ffmpeg(['-i', source, '-frames:v', '1', '-update', '1', '-vf', `scale=2560:1440:force_original_aspect_ratio=decrease,pad=2560:1440:(ow-iw)/2:(oh-ih)/2:color=${color}`, dest])
}

function ref2vPrompt(pack) {
  return [
    'subject_definitions:',
    '<Subject 1> look plate from @图片1: Shanghai dawn mercury-blue glass, Bund or the same office laptop. Keep palette. No letterbox bars.',
    '<Subject 2> interior meeting from @图片2: three East Asian colleagues in their thirties, walnut table, ordinary laptops and a phone, same dawn windows. No aluminum puck, no branded hardware box.',
    '<Subject 3> on-screen type from @图片3: treat as a picture, not OCR. Do not rewrite, translate, or add extra glyphs. Understand the picture, do not treat it as text.',
    '<Subject 4> official Moss double-sine wave mark from @图片4: two overlapping waves forming one mark. Treat as a picture, not letters. Keep the exact crossing geometry, stroke weight, and hollow diamonds. Do not invent a single-wave, a purple dot, or a different icon.',
    '<Subject 5> second on-screen type from @图片5: treat as a picture, not OCR. Same rule as <Subject 3>.',
    '',
    'summary: [reference generation] 30-second TVC half. @图片1 is world+palette. @图片2 is the meeting room. @图片3 and @图片5 are on-screen type as pictures. @图片4 is the official brand mark as a picture. Default hard cuts. Brand film, not a gadget demo.',
    '',
    'retention_analysis:',
    '<Subject 1> (appears in establishing wides): partially_preserved - dawn glass, river, tungsten only.',
    '<Subject 2> (appears in meeting and laptop shots): fully_preserved - three colleagues, table, ordinary laptops.',
    '<Subject 3>: fully_preserved - exact painted glyphs from that type plate.',
    '<Subject 4> (appears whenever the brand mark is on screen): fully_preserved - exact official double-wave geometry.',
    '<Subject 5>: fully_preserved - exact painted glyphs from the second type plate.',
    '',
    `integrated_multimodal_description: ${LOOK} ${pack.timeline}`,
    '',
    `overall_soundscape: ${pack.sound}`,
    '',
    `non_diegetic_music: ${pack.music}`,
    '',
    '不想要: no fade, no dissolve, no letterbox bars, no aluminum puck, no brushed-metal desktop gadget, no invented hardware, no neon, no cyber rain, no extra logos, no extra readable glyphs beyond the quoted plates, no public figures.',
  ].join('\n')
}

const PACKS = [
  {
    id: 'intent',
    seconds: 15,
    intent: 'Moss TVC 上半：15s 九镜覆盖，意图到能力',
    sound: 'Filament tick, river hush, three overlapping Mandarin voices, chair scrape, keys, then voices separate. Room drops under the mark.',
    music: 'Tight analog tick on every cut. Sparse pad under wides. Short lift into the mark. Dry cut. Does not resolve.',
    timeline: [
      '[Shot 1] Extreme close-up of the tungsten filament in the glass, Bund reflection. Micro tilt up with small amplitude at fast speed.',
      '[Shot 2] At 00:01.200, the camera cuts to an extreme wide of <Subject 1>. Truck left with small amplitude at fast speed.',
      '[Shot 3] At 00:02.400, the camera cuts to an extreme close-up of a speaking profile from <Subject 2>. Push in with small amplitude at fast speed.',
      '[Shot 4] At 00:03.600, the camera cuts to an insert: phone on the table and a second mouth talking over him.',
      '[Shot 5] At 00:04.800, the camera cuts to a medium-wide of <Subject 2> all three speaking. Truck right with small amplitude at fast speed.',
      '[Shot 6] At 00:06.200, the camera cuts to an extreme close-up of the messy waveform. Type from <Subject 3> as the picture "听不清" for eight frames.',
      '[Shot 7] At 00:07.700, the camera cuts on the same screen axis: the tangle splits into three clean lanes.',
      '[Shot 8] At 00:09.200, the camera cuts to a close-up of the woman from <Subject 2> exhaling. Type from <Subject 5> as the picture "听懂了".',
      '[Shot 9] At 00:10.700, the camera cuts to a graphic insert: official mark from <Subject 4> draws left to right and settles. Treat as a picture. Hard end.',
    ].join(' '),
  },
  {
    id: 'mark',
    seconds: 15,
    intent: 'Moss TVC 下半：15s 十镜覆盖，结果到标',
    sound: 'Timeline clicks, a single tap, one clean Mandarin line, then room drops under the mark. Soft tick when the mark settles.',
    music: 'Tick on every live-action cut. Pad lifts. Pulse peaks under the settled mark and holds. No fade-out.',
    timeline: [
      '[Shot 1] Extreme close-up of a playhead slamming right. Truck right with small amplitude at fast speed.',
      '[Shot 2] At 00:01.200, the camera cuts to a close-up of the laptop: three clean lanes and a Bund preview. Push in with small amplitude at fast speed.',
      '[Shot 3] At 00:02.500, the camera cuts to a hand tapping play. One action only.',
      '[Shot 4] At 00:03.700, the camera cuts to a medium of the three colleagues watching. Truck left with small amplitude at fast speed.',
      '[Shot 5] At 00:05.100, the camera cuts to the woman (S1) saying, <d>[Chinese] 一次说清。</d>',
      '[Shot 6] At 00:06.500, the camera cuts to an extreme close-up of her eyes. She nods once.',
      '[Shot 7] At 00:07.800, the camera cuts to an over-the-shoulder of the city in the glass and the playing clip.',
      '[Shot 8] At 00:09.200, the camera cuts to a vertical mercury slit wipe. Negative space.',
      '[Shot 9] At 00:10.400, the camera cuts to the official mark drawing left to right. Type "情境智能" as a picture above.',
      '[Shot 10] At 00:12.800, the camera cuts to the mark still on screen with "Moss" / "mossland.studio" as a picture under it. Hard end.',
    ].join(' '),
  },
]

async function gateAndGenerate(input) {
  const { settings, kieKey, dest, intent, prompt, referenceImages, seconds, snapshot } = input
  if (typeof input.reuse === 'string' && existsSync(input.reuse)) {
    console.log(`  reuse ${input.reuse}`)
    return { path: input.reuse }
  }
  let lastError
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const research = new ResearchLedger(settings.outputDir)
      for (const ref of KNOWLEDGE) await research.record({ kind: 'knowledge', ref })
      for (const name of SKILLS) await research.record({ kind: 'skill', ref: name })
      console.log(`  craft video #${attempt}: ${intent}`)
      const crafted = await craftPrompt({
        outputDir: settings.outputDir, kind: 'video', intent, prompt,
        knowledgeRefs: KNOWLEDGE, skillNames: SKILLS, externalNotes: 'moss-tvc-v2-kie-h3-logo-ref',
      })
      if (crafted.ok !== true) throw new Error(`prompt_craft 拒绝：${JSON.stringify(crafted).slice(0, 400)}`)
      const ready = await commitGenerateReady({
        outputDir: settings.outputDir, craftId: crafted.craftId, kind: 'video', intent,
        prompt: crafted.prompt, strategy: 'ref2v',
        referenceImages,
        snapshot,
      })
      if (ready.ok !== true) throw new Error(`generate_ready 拒绝：${ready.reason ?? JSON.stringify(ready).slice(0, 400)}`)
      console.log(`  kie h3 ref2v ${seconds}s 2K`)
      const path = await kieH3Ref2v(kieKey, {
        prompt: crafted.prompt,
        references: referenceImages,
        dest,
        seconds,
        aspectRatio: '16:9',
        resolution: '2K',
      })
      console.log(`  video ok ${path}`)
      return { path, crafted, ready }
    } catch (cause) {
      lastError = cause instanceof Error ? cause : new Error(String(cause))
      const fatal = /401|402|Insufficient Credits|Unauthorized/.test(lastError.message)
      await noteIssue(`${intent} 第 ${attempt} 次`, lastError.message.slice(0, 800), fatal ? 'kie 鉴权/额度，不再重试。' : (attempt < 3 ? '重提同一闸。' : '三次失败，中止该段。'))
      if (fatal) throw lastError
    }
  }
  throw lastError
}

async function main() {
  await mkdir(jobRoot, { recursive: true })
  if (!existsSync(issuesPath)) await writeFile(issuesPath, `# Moss 智能 30s TVC 问题账本\n\n`, 'utf8')
  await appendFile(issuesPath, `## 2026-08-18 · v2 kie.ai\n\n- 生成改 kie.ai：gpt-image-2 + minimax-h3/reference-to-video。\n- 官方双波标当参考图进 H3。不后期叠标。不发明铝盒。\n\n`, 'utf8')

  const kieKey = loadKieKey()
  const loaded = loadDirectorxSettings()
  const settings = { ...loaded, outputDir: join(jobRoot, 'out-v2'), timeoutMs: 1_200_000 }
  await mkdir(resolveOutputDir(settings.outputDir), { recursive: true })
  const state = await loadState()
  const out = resolveOutputDir(settings.outputDir)
  const plates = join(v2Out, 'plates')
  await mkdir(plates, { recursive: true })

  if (!existsSync(LOOK_DAWN_SRC)) throw new Error('缺少黎明氛围图')
  const lookDawn = join(plates, 'look-dawn-16x9.png')
  if (!existsSync(lookDawn)) cropLook(LOOK_DAWN_SRC, lookDawn)

  const lockup = join(plates, 'lockup-mark.png')
  const markWide = join(plates, 'mark-dark.png')
  if (!existsSync(lockup) && existsSync(markWide)) padTo169(markWide, lockup)
  if (!existsSync(lockup)) throw new Error('缺少官方标板')

  const typeHear = join(plates, 'type-tingbuqing.png')
  const typeGot = join(plates, 'type-tingdong.png')
  const typeCtx = join(plates, 'type-qingjing.png')
  const typeCta = join(plates, 'type-cta.png')
  if (!existsSync(typeHear)) makeTextPlate(typeHear, ['听不清'])
  if (!existsSync(typeGot)) makeTextPlate(typeGot, ['听懂了'])
  if (!existsSync(typeCtx)) makeTextPlate(typeCtx, ['情境智能'])
  if (!existsSync(typeCta)) makeTextPlate(typeCta, ['Moss', 'mossland.studio'])

  const lookInterior = join(plates, 'look-interior-kie.png')
  const lookTimeline = join(plates, 'look-timeline-kie.png')
  const interiorFallback = join(plates, 'look-interior.jpg')
  const timelineFallback = join(plates, 'look-timeline.jpg')

  if (!existsSync(lookInterior)) {
    console.log('  kie image2 interior')
    try {
      await kieImage2(kieKey, {
        dest: lookInterior,
        references: [lookDawn],
        aspectRatio: '16:9',
        resolution: '2K',
        prompt: 'Same Shanghai dawn glass tower and mercury-blue river light as the reference photograph. Inside that office: a long walnut conference table, three East Asian professionals in their early thirties in dark knit and wool, ordinary open laptops and one phone. The nearest laptop shows a messy overlapping audio waveform, no brand UI, no readable product name, no aluminum gadget, no puck. Cinematic 16:9 still, tungsten lamp, shallow depth.',
      })
    } catch (error) {
      await noteIssue('image2 室内', error instanceof Error ? error.message : String(error), existsSync(interiorFallback) ? '回退已有室内静帧。' : '无回退。')
      if (existsSync(interiorFallback)) await copyFile(interiorFallback, lookInterior)
      else throw error
    }
  }

  if (!existsSync(lookTimeline)) {
    console.log('  kie image2 timeline')
    try {
      await kieImage2(kieKey, {
        dest: lookTimeline,
        references: [existsSync(lookInterior) ? lookInterior : lookDawn],
        aspectRatio: '16:9',
        resolution: '2K',
        prompt: 'Same Shanghai dawn office and tungsten lamp. Close-up of an ordinary laptop: a dark audio-video editor, messy waveforms have split into three clean speaker lanes, a timeline of clips assembling to the right. No brand logos, no readable product name, no aluminum hardware. Cinematic 16:9.',
      })
    } catch (error) {
      await noteIssue('image2 时间线', error instanceof Error ? error.message : String(error), existsSync(timelineFallback) ? '回退已有时间线静帧。' : '无回退。')
      if (existsSync(timelineFallback)) await copyFile(timelineFallback, lookTimeline)
      else throw error
    }
  }

  state.plates = {
    lookDawn, lookInterior, lookTimeline, lockup,
    typeHear, typeGot, typeCtx, typeCta,
  }
  await saveState(state)

  const result = await runInProject(jobRoot, async () => {
    const canvas = new DirectorxCanvasStore(settings.outputDir)
    const people = new CharacterStore(settings.outputDir)
    await people.register({
      name: '会议三人', refPath: lookInterior,
      description: '三十岁上下东亚同事三人，深色针织与羊毛，普通笔记本，无公众人物。',
      outfit: 'dark knit and wool',
      props: 'ordinary laptops',
    }).catch(() => {})
    const snapshot = { characters: [], nodes: [], edges: [] }

    const refsIntent = [lookDawn, lookInterior, typeHear, lockup, typeGot]
    const refsMark = [lookTimeline, lookInterior, typeCtx, lockup, typeCta]

    for (const packSpec of PACKS) {
      const refs = packSpec.id === 'intent' ? refsIntent : refsMark
      const clip = await gateAndGenerate({
        settings, kieKey,
        dest: join(out, `${packSpec.id}.mp4`),
        reuse: state.clips[packSpec.id],
        intent: packSpec.intent,
        prompt: ref2vPrompt(packSpec),
        referenceImages: refs,
        seconds: packSpec.seconds,
        snapshot,
      })
      state.clips[packSpec.id] = clip.path
      await saveState(state)
    }

    const packed = await videoConcat({
      files: [state.clips.intent, state.clips.mark],
      outputDir: settings.outputDir,
      transition: 'cut',
      scale: '2560:1440',
    })
    if (typeof packed.path !== 'string' || packed.path === '') throw new Error('concat 没有 path')
    state.packed = packed.path
    await saveState(state)

    const deliver = join(jobRoot, 'Moss智能-30s-TVC-v2.mp4')
    await copyFile(packed.path, deliver)
    const info = probeMedia(deliver)

    await canvas.addNode({ kind: 'video', label: '上半 意图能力', path: state.clips.intent, prompt: 'intent', durationSec: 15 }).catch(() => {})
    await canvas.addNode({ kind: 'video', label: '下半 结果标', path: state.clips.mark, prompt: 'mark', durationSec: 15 }).catch(() => {})

    await writeFile(join(jobRoot, 'REPORT-v2.md'), [
      '# Moss 智能 30s TVC v2',
      '',
      `- 成片：${deliver}`,
      `- 打包：${packed.path}`,
      `- 探针：${JSON.stringify(info)}`,
      '- 方法：kie.ai gpt-image-2 出静帧，minimax-h3/reference-to-video 两条 15s。官方双波标当参考图，手册 MG/片头包装镜内做动效。',
      '- 未覆盖 v1 Moss智能-30s-TVC.mp4。',
      '- 未发明铝盒硬件。',
      '',
    ].join('\n'))

    return { deliver, packPath: packed.path, info, clips: state.clips }
  })

  console.log(JSON.stringify(result, null, 2))
}

main().catch(async error => {
  await appendFile(issuesPath, `## FATAL v2\n\n${error instanceof Error ? error.stack ?? error.message : String(error)}\n\n`).catch(() => {})
  console.error(error)
  process.exit(1)
})
