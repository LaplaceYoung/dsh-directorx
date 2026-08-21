#!/usr/bin/env node
/**
 * 《破晓一刀》预告 v3 — H3 全参考预告，不是 FL2VA 慢镜拼条。
 *
 * v2 病：每镜 3–6s 单动作插值、镜间硬切、无对白/画内字、片名卡换了世界。
 * v3：两条 12s Ref2VA。H3 默认会切镜。图1 风格/城，图2 千刃，图3 朔夜，图4 字图。
 * 引号字幕 + 字图「按图片理解」。对白短。高潮对斩。片名砸在挂城上。
 * 不覆盖 破晓一刀.mp4 / 破晓一刀-v2.mp4。不打印 API Key。
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
  runVideo,
  videoConcat,
} from '../lib/testing.js'

const pluginRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const jobRoot = resolve(pluginRoot, '..', 'directorx_productions', '08-shonen-trailer')
const issuesPath = join(jobRoot, 'ISSUES.md')
const statePath = join(jobRoot, 'STATE-v3.json')
const v1 = join(jobRoot, 'out')
const v2 = join(jobRoot, 'out-v2')

const SHEETS = {
  senjin: join(v1, 'series/series-poxiao-yidao/refs/千刃.png'),
  sakuya: join(v1, 'series/series-poxiao-yidao/refs/朔夜.png'),
}
const LOOK_SRC = existsSync(join(v2, 'look-16x9.png'))
  ? join(v2, 'look-16x9.png')
  : join(v1, 'theatrical-japanese-anime-movie-trailer--2026-08-17T22-45-09Z.png')

const FONT = existsSync('/System/Library/Fonts/STHeiti Medium.ttc')
  ? '/System/Library/Fonts/STHeiti Medium.ttc'
  : '/Library/Fonts/Arial Unicode.ttf'

const KNOWLEDGE = ['151', '205', '188', '01', '115']
const SKILLS = ['trailer-craft', 'minimax-h3-prompt-copilot', 'cinematic-style', 'directorx-chengpian', 'storyboard-craft']

const CEL = '2D-animated theatrical Japanese anime movie trailer, late-modern cel, clean ink outlines, two-to-three tone shadows, copper cracked sun versus cold teal mist, 16:9 anamorphic 35mm, film grain. Not painterly concept art. Not photoreal. Not 3D CGI.'

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
  if (!existsSync(statePath)) return { sheets: { ...SHEETS }, plates: {}, clips: {}, packed: '' }
  try {
    return JSON.parse(await readFile(statePath, 'utf8'))
  } catch {
    return { sheets: { ...SHEETS }, plates: {}, clips: {}, packed: '' }
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
    `drawtext=fontfile=${FONT}:text='${main}':fontsize=${sub ? 132 : 96}:fontcolor=white:borderw=5:bordercolor=black:x=(w-text_w)/2:y=(h-text_h)/2${sub ? '-40' : ''}`,
  ]
  if (sub) {
    filters.push(`drawtext=fontfile=${FONT}:text='${sub}':fontsize=48:fontcolor=white:borderw=3:bordercolor=black:x=(w-text_w)/2:y=(h-text_h)/2+70`)
  }
  ffmpeg(['-f', 'lavfi', '-i', 'color=c=0x07080c:s=2560x1440:d=0.04', '-frames:v', '1', '-update', '1', '-vf', filters.join(','), dest])
}

function cropLook(source, dest) {
  ffmpeg(['-i', source, '-frames:v', '1', '-update', '1', '-vf', 'crop=iw:ih*0.84:0:ih*0.08,scale=2560:1440:force_original_aspect_ratio=increase,crop=2560:1440', dest])
}

function ref2vPrompt(pack) {
  return [
    'subject_definitions:',
    '<Subject 1> hanging iron temple-city 烬轨城 from @图片1: cracked copper sun, teal mist below, paper lanterns on chains, crows, orbital rail. Keep architecture and palette. Render as 2D cel matching the character sheets, not painterly concept art, no letterbox bars.',
    '<Subject 2> 千刃 from @图片2: 17, wiry East Asian youth, shaggy charcoal hair with ONE white lightning streak over the left temple only, dark irises with amber catchlight, charcoal haori with crimson lining, rust-red sash, wrap shirt, single-edged slightly curved rust-red blade, cloth-wrapped hilt, wrapped calves, dark sandals.',
    '<Subject 3> 朔夜 from @图片3: 18, slightly taller, silver-blue chin-length bob with blunt bangs, pale skin, narrow cool-gray eyes, ash-gray high-collar trench with teal lining, black gloves, black boots, TWO SHORT straight daggers only (fist to mid-forearm), no katana, no chains.',
    '<Subject 4> on-screen Chinese from @图片4: treat as a picture, not OCR. Do not rewrite, translate, or add extra glyphs.',
    '',
    'summary: [reference generation] Theatrical shonen movie trailer. @图片1 is world+palette. @图片2 is 千刃 identity. @图片3 is 朔夜 identity. @图片4 is title/name type. Default hard cuts. Fast trailer, not a short film.',
    '',
    'retention_analysis:',
    '<Subject 1> (appears in establishing and climax wides): partially_preserved - city geometry and copper/teal only; cel shading.',
    '<Subject 2> (appears whenever 千刃 is on screen): fully_preserved - face, streak, haori, blade.',
    '<Subject 3> (appears whenever 朔夜 is on screen): fully_preserved - bob, coat, two short daggers.',
    '<Subject 4>: fully_preserved - exact painted glyphs.',
    '',
    `integrated_multimodal_description: ${CEL} ONLY 千刃 and 朔夜. No mentor, no extra girl, no third silhouette. No fade. No dissolve. the camera cuts to on every new [Shot]. ${pack.timeline}`,
    '',
    `overall_soundscape: ${pack.sound}`,
    '',
    `non_diegetic_music: ${pack.music}`,
    '',
    '不想要: no fade, no dissolve, no letterbox bars, no lakeside ground village, no long swords on 朔夜, no extra characters, no English credits, no watermarks, no readable logos except the quoted Chinese.',
  ].join('\n')
}

const PACKS = [
  {
    id: 'hook',
    seconds: 12,
    intent: '预告上半：钩子+人物关系+对白，H3 镜内硬切',
    sound: 'Rail groan, lanterns ticking, one blade scrape, two short spoken lines, crows, no extra chatter.',
    music: 'Low taiko and tight string ostinato. Hits on every cut. No fade-out. Dry cut at the end.',
    timeline: [
      '[Shot 1] Extreme close-up of <Subject 2> left eye opening. Amber catchlight. White streak at frame edge. Static then micro push-in at fast speed. Lower-third on-screen text "千刃" in white brush, 8 frames only.',
      '[Shot 2] At 00:01.600, the camera cuts to a medium close-up of <Subject 2> drawing the rust-red blade; one spark line; haori crimson lining flashes. Truck left with small amplitude at fast speed.',
      '[Shot 3] At 00:03.200, the camera cuts to an extreme wide of <Subject 1> hanging city, cracked copper sun, teal abyss, crows. Slow push-in with small amplitude.',
      '[Shot 4] At 00:05.000, the camera cuts to a full shot of <Subject 3> walking toward camera on a wet iron gantry under the same hanging city, two short daggers down. On-screen text "朔夜".',
      '[Shot 5] At 00:07.000, the camera cuts to an over-the-shoulder two-shot: <Subject 2> (S1) in foreground left facing <Subject 3> across a two-meter gap, same hanging city behind. They are opponents on one rail. <Subject 2> (S1) says, <d>[Chinese] 你挡路了。</d> Lips match. Line lasts under one second.',
      '[Shot 6] At 00:09.200, the camera cuts to a close-up of <Subject 3> (S2). <Subject 3> (S2) says, <d>[Chinese] 那就一刀。</d> while his lips move. Then both drop into stance. Hard cut out on the lock.',
    ].join(' '),
  },
  {
    id: 'climax',
    seconds: 12,
    intent: '预告下半：高潮对斩+扣结局+片名砸板，H3 镜内硬切',
    sound: 'Blade clash, sparks, wind under the rail, one withheld whoosh, silence under the title. No dialogue after the first second.',
    music: 'Taiko doubles, strings scream, then a single dry hit into silence under the title. No fade.',
    timeline: [
      '[Shot 1] Wide clash on the hanging-city gantry: <Subject 2> rust-red blade meets <Subject 3> two short daggers. Sparks. Same copper sun. the camera cuts on the impact.',
      '[Shot 2] At 00:01.800, the camera cuts to an extreme close-up of crossing steel, rust-red fuller versus two short blades, sparks flying toward lens. Shake slightly.',
      '[Shot 3] At 00:03.400, the camera cuts to a low-angle medium of <Subject 2> committing one horizontal slash, crimson lining open, one action only.',
      '[Shot 4] At 00:05.000, the camera cuts to <Subject 3> parrying with both short daggers, coat flaring teal, counter-step. Do not show a winner.',
      '[Shot 5] At 00:06.800, the camera cuts to a withheld ending: rust-red blade stopped mid-swing in front of the cracked sun, both faces out of frame. Hold 10 frames.',
      '[Shot 6] At 00:08.400, the camera cuts to black for 6 frames, then slams onto the title card: huge white brush "破晓一刀" and smaller "剧场版" from <Subject 4>, hanging-city silhouette only, no lakeside, no wanderer in red. Static. Hard end. Do not fade. Do not interpolate between stills.',
    ].join(' '),
  },
]

async function gateAndGenerate(input) {
  const { settings, ledger, intent, prompt, referenceImages, seconds, snapshot } = input
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
        knowledgeRefs: KNOWLEDGE, skillNames: SKILLS, externalNotes: 'poxiao-v3-h3-trailer',
      })
      if (crafted.ok !== true) throw new Error(`prompt_craft 拒绝：${JSON.stringify(crafted).slice(0, 400)}`)
      const ready = await commitGenerateReady({
        outputDir: settings.outputDir, craftId: crafted.craftId, kind: 'video', intent,
        prompt: crafted.prompt, strategy: 'ref2v',
        referenceImages,
        characters: ['千刃', '朔夜'],
        snapshot,
      })
      if (ready.ok !== true) throw new Error(`generate_ready 拒绝：${ready.reason ?? JSON.stringify(ready).slice(0, 400)}`)
      const generated = await runVideo({
        settings, capability: settings.video, signal: AbortSignal.timeout(settings.timeoutMs), ledger,
      }, crafted.prompt, {
        seconds, aspectRatio: '16:9', resolution: settings.video.resolution || '1440p',
        referenceImagePaths: referenceImages,
        negativePrompt: 'fade, dissolve, letterbox, lakeside, extra character, long swords on the gray-coat fighter, English credits',
      })
      const path = firstPath(generated)
      if (path === undefined) throw new Error('video 没有 path')
      console.log(`  video ok ${path}`)
      return { path, crafted, ready }
    } catch (cause) {
      lastError = cause instanceof Error ? cause : new Error(String(cause))
      await noteIssue(`${intent} 第 ${attempt} 次`, lastError.message.slice(0, 800), attempt < 3 ? '重提同一闸。' : '三次失败，中止该段。')
    }
  }
  throw lastError
}

async function main() {
  await mkdir(jobRoot, { recursive: true })
  if (!existsSync(issuesPath)) await writeFile(issuesPath, `# 《破晓一刀》预告片问题账本\n\n`, 'utf8')
  await appendFile(issuesPath, `## 2026-08-18 · v2 成片再审\n\n- 画风：睁眼水彩、世界概念画、角色赛璐璐、片名卡换成湖岸独行者。\n- 节奏：7 段 FL2VA 各 3–6s 单动作，平均镜头远长于预告片。\n- 关系：一对峙静帧，无对白、无姓名、无对手动机。\n- 高潮：对斩是摆拍，下一刀是举剑，没有交锋升级。\n- 字/转场：H3 能在一条里硬切并烧引号字幕，v2 全交给 ffmpeg 硬切拼条。\n\n**处理：** v3 改全参考 Ref2VA，两条 12s 镜内硬切。\n\n`, 'utf8')

  const loaded = loadDirectorxSettings()
  const settings = { ...loaded, outputDir: join(jobRoot, 'out-v3'), timeoutMs: 1_200_000 }
  await mkdir(resolveOutputDir(settings.outputDir), { recursive: true })
  const state = await loadState()
  const out = resolveOutputDir(settings.outputDir)

  if (!existsSync(SHEETS.senjin) || !existsSync(SHEETS.sakuya)) {
    throw new Error('缺少设定表，不要覆盖或重画 千刃.png / 朔夜.png')
  }

  const look = join(out, 'look-cel-16x9.png')
  if (!existsSync(look)) cropLook(LOOK_SRC, look)
  state.plates.look = look

  const nameSen = join(out, 'type-qianren.png')
  const nameSak = join(out, 'type-shuoye.png')
  const title = join(out, 'type-title.png')
  if (!existsSync(nameSen)) makeTextPlate(nameSen, ['千刃'])
  if (!existsSync(nameSak)) makeTextPlate(nameSak, ['朔夜'])
  if (!existsSync(title)) makeTextPlate(title, ['破晓一刀', '剧场版'])
  state.plates.nameSen = nameSen
  state.plates.nameSak = nameSak
  state.plates.title = title
  await saveState(state)

  const result = await runInProject(jobRoot, async () => {
    const ledger = new DirectorxTaskLedger(settings.outputDir)
    const canvas = new DirectorxCanvasStore(settings.outputDir)
    const people = new CharacterStore(settings.outputDir)
    await people.register({
      name: '千刃', refPath: SHEETS.senjin,
      description: '黑发一道白雷纹，黑羽织绯红里，赤轨单刃。',
      outfit: 'charcoal haori, crimson lining, rust-red sash',
      props: 'single-edged rust-red blade',
    })
    await people.register({
      name: '朔夜', refPath: SHEETS.sakuya,
      description: '银蓝齐刘海，灰青高领外套，双短刃。',
      outfit: 'ash-gray coat, teal lining',
      props: 'two short straight blades',
    })
    const roster = [
      { name: '千刃', refPath: SHEETS.senjin },
      { name: '朔夜', refPath: SHEETS.sakuya },
    ]
    const snapshot = { characters: roster, nodes: [], edges: [] }

    const refsHook = [look, SHEETS.senjin, SHEETS.sakuya, nameSen]
    const refsClimax = [look, SHEETS.senjin, SHEETS.sakuya, title]

    for (const packSpec of PACKS) {
      const refs = packSpec.id === 'hook' ? refsHook : refsClimax
      const clip = await gateAndGenerate({
        settings, ledger,
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
      files: [state.clips.hook, state.clips.climax],
      outputDir: settings.outputDir,
      transition: 'cut',
      scale: '1280:720',
    })
    if (typeof packed.path !== 'string' || packed.path === '') throw new Error('concat 没有 path')
    state.packed = packed.path
    await saveState(state)

    const deliver = join(jobRoot, '破晓一刀-v3.mp4')
    await copyFile(packed.path, deliver)
    const info = probeMedia(deliver)

    await canvas.addNode({ kind: 'video', label: '上半 钩子关系', path: state.clips.hook, prompt: 'hook', durationSec: 12 }).catch(() => {})
    await canvas.addNode({ kind: 'video', label: '下半 高潮片名', path: state.clips.climax, prompt: 'climax', durationSec: 12 }).catch(() => {})

    await writeFile(join(jobRoot, 'REPORT-v3.md'), [
      '# 《破晓一刀》预告 v3',
      '',
      `- 成片：${deliver}`,
      `- 打包：${packed.path}`,
      `- 探针：${JSON.stringify(info)}`,
      '- 方法：H3 全参考 Ref2VA，两条 12s，镜内 `[Shot N]` 硬切，引号对白+字图。',
      '- 设定表未改：千刃.png / 朔夜.png',
      '- 未覆盖 v1 / v2。',
      '',
    ].join('\n'))

    return { deliver, packPath: packed.path, info, clips: state.clips }
  })

  console.log(JSON.stringify(result, null, 2))
}

main().catch(async error => {
  await appendFile(issuesPath, `## FATAL v3\n\n${error instanceof Error ? error.stack ?? error.message : String(error)}\n\n`).catch(() => {})
  console.error(error)
  process.exit(1)
})
