#!/usr/bin/env node
/**
 * Remake 《破晓一刀》 as a theatrical teaser.
 *
 * Trailer grammar (hook → world → raise → title, smash-cut only):
 *   eyes 2.8s  thumbstop ECU
 *   world 5.0s hanging city
 *   spark 3.6s one slash
 *   rival 4.4s 朔夜 only, short daggers
 *   clash 6.0s peak
 *   slash 4.2s withhold the ending
 *   title 3.6s hold
 *
 * Continuity: each motion is FL2VA (start still → end still of the SAME beat).
 * Next start still is generated from the previous end still + locked sheets.
 * After each clip, extract the tail frame as the next look lock.
 *
 * Stretch: stills are center-cropped to 16:9 before I2V; concat letterboxes.
 * Identity: 千刃 / 朔夜 sheets + hook look plate; no third character.
 * Never prints API keys.
 */
import { mkdir, writeFile, appendFile, copyFile, readFile } from 'node:fs/promises'
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
  cropToAspect,
  extractTailFrame,
  probeMedia,
  resolveOutputDir,
  runImage,
  runInProject,
  runVideo,
  videoConcat,
  videoProcess,
  zoomEndFrame,
} from '../lib/testing.js'

const pluginRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const jobRoot = resolve(pluginRoot, '..', 'directorx_productions', '08-shonen-trailer')
const issuesPath = join(jobRoot, 'ISSUES.md')
const statePath = join(jobRoot, 'STATE-v2.json')
const v1 = join(jobRoot, 'out')

const SHEETS = {
  senjin: join(v1, 'series/series-poxiao-yidao/refs/千刃.png'),
  sakuya: join(v1, 'series/series-poxiao-yidao/refs/朔夜.png'),
}
const LOOK_SRC = join(v1, 'theatrical-japanese-anime-movie-trailer--2026-08-17T22-45-09Z.png')
const TITLE_SRC = join(v1, 'theatrical-japanese-anime-movie-trailer--2026-08-17T22-49-10Z.png')

const KNOWLEDGE = ['151', '205', '188', '01', '115']
const SKILLS = ['trailer-craft', 'minimax-h3-prompt-copilot', 'cinematic-style', 'directorx-chengpian', 'storyboard-craft', 'gpt-image2-prompt-copilot']

const CEL = [
  'theatrical Japanese anime movie trailer still, late-modern cel look,',
  'clean ink outlines, two-to-three tone shadows, high-contrast warm copper versus cold teal,',
  'film grain, no photoreal skin, no 3D CGI render, no readable logos, no existing franchise faces,',
  'original character design, 16:9 anamorphic theatrical framing, 35mm, atmosphere of dying orbital dusk,',
].join(' ')

const WORLD = [
  '烬轨城: a hanging iron temple-city bolted under a dying orbital rail,',
  'copper cracked sun above, cold teal mist below, paper lanterns on chains, crows,',
  'no ground village, no orange farm dusk, no modern glass towers.',
].join(' ')

const SENJIN = [
  '千刃, a 17-year-old East Asian youth, wiry not bulky,',
  'shaggy charcoal-black hair with ONE white lightning streak over the left temple only, not a white bang,',
  'sharp brows, large dark irises with a tiny amber catchlight,',
  'charcoal-black haori flashing a crimson inner lining, rust-red cloth sash, wrap shirt,',
  'single-edged slightly curved blade with a rust-red fuller and cloth-wrapped hilt.',
].join(' ')

const SAKUYA = [
  '朔夜, an 18-year-old East Asian youth slightly taller than 千刃,',
  'silver-blue chin-length bob with blunt bangs, pale skin, narrow cool-gray eyes,',
  'structured ash-gray high-collar trench coat with teal inner lining, black gloves, black boots,',
  'TWO SHORT straight daggers only, blade from fist to mid-forearm, NOT katanas, no chains, no long swords.',
].join(' ')

const CAST_LOCK = 'ONLY 千刃 and 朔夜. No old man, no mentor, no extra girl, no third silhouette, no long-hair bystander.'

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
  if (!settings.image.enabled || !settings.image.baseURL || !settings.image.apiKey) throw new Error('image 能力未配置完整')
  if (!settings.video.enabled || !settings.video.baseURL || !settings.video.apiKey) throw new Error('video 能力未配置完整')
  return settings
}

function firstPath(result) {
  return result?.files?.find(item => typeof item.path === 'string' && item.path !== '')?.path
}

async function loadState() {
  if (!existsSync(statePath)) {
    return { sheets: { ...SHEETS }, look: '', stills: {}, ends: {}, clips: {}, tails: {}, packed: '' }
  }
  try {
    return JSON.parse(await readFile(statePath, 'utf8'))
  } catch {
    return { sheets: { ...SHEETS }, look: '', stills: {}, ends: {}, clips: {}, tails: {}, packed: '' }
  }
}

async function saveState(state) {
  await writeFile(statePath, JSON.stringify(state, null, 2), 'utf8')
}

async function noteIssue(title, detail, fix) {
  await appendFile(issuesPath, `## ${new Date().toISOString()} · ${title}\n\n${detail}\n\n**处理：** ${fix}\n\n`, 'utf8')
  console.log(`  ISSUE ${title}`)
}

function fitPng(source, dest, kind = 'crop') {
  if (kind === 'zoom') return zoomEndFrame(source, dest, 1.18)
  return cropToAspect(source, dest, 16, 9)
}

function stillHold(source, seconds, outputDir, name) {
  const destDir = resolveOutputDir(outputDir)
  const out = join(destDir, `${name}.mp4`)
  const result = spawnSync('ffmpeg', [
    '-y', '-loop', '1', '-i', source, '-t', String(seconds),
    '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1',
    '-r', '24', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-an', out,
  ], { encoding: 'utf8' })
  if (result.status !== 0) throw new Error(`still hold failed: ${result.stderr?.slice(-400)}`)
  return out
}

function fl2vPrompt(seconds, motion) {
  const end = seconds.toFixed(2)
  return [
    `How the reference pictures align with the target video — Picture 1 (from Shot 1) aligns with the 0.00-second mark of the target video; Picture 2 (from Shot 1) aligns with the ${end}-second mark of the target video.`,
    '',
    `integrated_multimodal_description: [Shot 1] 2D-animated theatrical Japanese anime movie trailer, late-modern cel look, clean ink outlines, two-to-three tone shadows, copper versus teal, 16:9 anamorphic 35mm, film grain. The shot begins from <Picture 1> and must end exactly on <Picture 2>. ${motion} One action only. Camera language stated in the motion. No new characters. No readable logos. No title text unless the still already has it.`,
    '',
    'overall_soundscape: Distant rail groan, paper lanterns ticking, one physical impact, crows, wind under the hanging city. No dialogue.',
    '',
    'non_diegetic_music: Low preview-pulse drone that tightens toward the last frame, then cuts dry. No fade-out.',
  ].join('\n')
}

async function gateAndGenerate(input) {
  const {
    settings, ledger, kind, intent, prompt, strategy, firstFrame, lastFrame,
    referenceImages, seconds, size, characters, snapshot,
  } = input
  if (typeof input.reuse === 'string' && existsSync(input.reuse)) {
    console.log(`  reuse ${kind}: ${input.reuse}`)
    return { path: input.reuse }
  }
  let lastError
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const research = new ResearchLedger(settings.outputDir)
      for (const ref of KNOWLEDGE) await research.record({ kind: 'knowledge', ref })
      for (const name of SKILLS) await research.record({ kind: 'skill', ref: name })
      console.log(`  craft ${kind} #${attempt}: ${intent}`)
      const crafted = await craftPrompt({
        outputDir: settings.outputDir, kind, intent, prompt,
        knowledgeRefs: KNOWLEDGE, skillNames: SKILLS, externalNotes: 'poxiao-v2-trailer',
      })
      if (crafted.ok !== true) throw new Error(`prompt_craft 拒绝：${JSON.stringify(crafted).slice(0, 400)}`)
      const ready = await commitGenerateReady({
        outputDir: settings.outputDir, craftId: crafted.craftId, kind, intent,
        prompt: crafted.prompt, strategy, firstFrame, lastFrame, referenceImages,
        characters: characters ?? [],
        snapshot: snapshot ?? { characters: [], nodes: [], edges: [] },
      })
      if (ready.ok !== true) throw new Error(`generate_ready 拒绝：${ready.reason ?? JSON.stringify(ready).slice(0, 400)}`)
      if (kind === 'image') {
        const generated = await runImage({
          settings, capability: settings.image, signal: AbortSignal.timeout(settings.timeoutMs), ledger,
        }, crafted.prompt, { size: size ?? '1280x720', referenceImagePaths: referenceImages ?? [] })
        const path = firstPath(generated)
        if (path === undefined) throw new Error('image 没有 path')
        console.log(`  image ok ${path}`)
        return { path, crafted, ready }
      }
      const generated = await runVideo({
        settings, capability: settings.video, signal: AbortSignal.timeout(settings.timeoutMs), ledger,
      }, crafted.prompt, {
        seconds: seconds ?? 5, aspectRatio: '16:9', resolution: settings.video.resolution || '2K',
        firstFramePath: firstFrame, lastFramePath: lastFrame,
        referenceImagePaths: [],
        negativePrompt: typeof crafted.negative === 'string' ? crafted.negative : undefined,
      })
      const path = firstPath(generated)
      if (path === undefined) throw new Error('video 没有 path')
      console.log(`  video ok ${path}`)
      return { path, crafted, ready }
    } catch (cause) {
      lastError = cause instanceof Error ? cause : new Error(String(cause))
      await noteIssue(`${intent} 第 ${attempt} 次`, lastError.message.slice(0, 700), attempt < 3 ? '重提同一闸。' : '三次失败，中止该镜。')
    }
  }
  throw lastError
}

async function makeStill(ctx, state, key, spec, snapshot) {
  const rawKey = `${key}Raw`
  const raw = await gateAndGenerate({
    ...ctx, kind: 'image',
    strategy: spec.strategy ?? 'keyframe',
    reuse: state.stills[rawKey],
    intent: spec.intent,
    prompt: spec.prompt,
    referenceImages: spec.refs,
    characters: spec.who ?? [],
    snapshot,
  })
  state.stills[rawKey] = raw.path
  const fitted = join(resolveOutputDir(ctx.settings.outputDir), `still-${key}-16x9.png`)
  if (!existsSync(fitted) || state.stills[key] !== fitted) {
    fitPng(raw.path, fitted, 'crop')
  }
  state.stills[key] = fitted
  await saveState(state)
  return fitted
}

async function makeEnd(ctx, state, key, spec, snapshot) {
  if (spec.zoomFrom) {
    const dest = join(resolveOutputDir(ctx.settings.outputDir), `end-${key}-16x9.png`)
    if (!existsSync(dest)) fitPng(spec.zoomFrom, dest, 'zoom')
    state.ends[key] = dest
    await saveState(state)
    return dest
  }
  try {
    const raw = await gateAndGenerate({
      ...ctx, kind: 'image',
      strategy: 'keyframe',
      reuse: state.ends[`${key}Raw`],
      intent: spec.intent,
      prompt: spec.prompt,
      referenceImages: spec.refs,
      characters: spec.who ?? [],
      snapshot,
    })
    state.ends[`${key}Raw`] = raw.path
    const fitted = join(resolveOutputDir(ctx.settings.outputDir), `end-${key}-16x9.png`)
    fitPng(raw.path, fitted, 'crop')
    state.ends[key] = fitted
    await saveState(state)
    return fitted
  } catch (error) {
    const start = spec.refs?.[0]
    if (typeof start !== 'string' || !existsSync(start)) throw error
    await noteIssue(`${spec.intent} 尾帧改推近`, error instanceof Error ? error.message.slice(0, 400) : String(error), '用起幅中心推近当尾帧，保住身份。')
    const dest = join(resolveOutputDir(ctx.settings.outputDir), `end-${key}-16x9.png`)
    fitPng(start, dest, 'zoom')
    state.ends[key] = dest
    await saveState(state)
    return dest
  }
}

async function main() {
  await mkdir(jobRoot, { recursive: true })
  if (!existsSync(issuesPath)) await writeFile(issuesPath, `# 《破晓一刀》预告片问题账本\n\n`, 'utf8')
  const loaded = loadDirectorxSettings()
  const settings = { ...loaded, outputDir: join(jobRoot, 'out-v2'), timeoutMs: 1_200_000 }
  await mkdir(resolveOutputDir(settings.outputDir), { recursive: true })
  const state = await loadState()
  state.sheets = { ...SHEETS }
  const stillsOnly = process.argv.includes('--stills-only')

  const result = await runInProject(jobRoot, async () => {
    const ledger = new DirectorxTaskLedger(settings.outputDir)
    const canvas = new DirectorxCanvasStore(settings.outputDir)
    const people = new CharacterStore(settings.outputDir)
    const ctx = { settings, ledger }

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
    const snap = { characters: roster, nodes: [], edges: [] }

    if (!state.look || !existsSync(state.look)) {
      const look = join(resolveOutputDir(settings.outputDir), 'look-16x9.png')
      fitPng(LOOK_SRC, look, 'crop')
      state.look = look
      await saveState(state)
    }
    if (!state.stills.title || !existsSync(state.stills.title)) {
      const title = join(resolveOutputDir(settings.outputDir), 'still-title-16x9.png')
      fitPng(TITLE_SRC, title, 'crop')
      state.stills.title = title
      await saveState(state)
    }

    const look = state.look
    const senjin = SHEETS.senjin
    const sakuya = SHEETS.sakuya

    const eyes = await makeStill(ctx, state, 'eyes', {
      intent: '预告钩子静帧：千刃睁眼 16:9 特写',
      prompt: `${CEL} Extreme close-up 16:9 keyframe, 85mm, locked-off. Left eye of 千刃 just opening. The rust-red orbital rail crack is reflected in the dark iris. Amber catchlight. Breath fog at the lash line. Hair is charcoal-black with ONE white lightning streak. ${SENJIN} ${WORLD} ${CAST_LOCK}`,
      refs: [senjin, look],
      who: ['千刃'],
    }, snap)
    const eyesEnd = await makeEnd(ctx, state, 'eyes', { zoomFrom: eyes }, snap)

    if (!state.stills.world || !existsSync(state.stills.world)) {
      const world = join(resolveOutputDir(settings.outputDir), 'still-world-16x9.png')
      fitPng(LOOK_SRC, world, 'crop')
      state.stills.world = world
      await saveState(state)
    }
    const worldEnd = await makeEnd(ctx, state, 'world', { zoomFrom: state.stills.world }, snap)

    const spark = await makeStill(ctx, state, 'spark', {
      intent: '预告升级静帧：千刃起刀 16:9',
      prompt: `${CEL} Low-angle three-quarter 16:9 keyframe, 35mm. 千刃 at the START of a single horizontal slash, blade just leaving the sheath line, crimson lining not yet fully flashed. Same hanging city behind him. Stable pose, no motion blur. ${SENJIN} ${WORLD} ${CAST_LOCK} Match lighting and cel finish of the look plate.`,
      refs: [eyesEnd, senjin, look],
      who: ['千刃'],
    }, snap)
    const sparkEnd = await makeEnd(ctx, state, 'spark', {
      intent: '预告升级尾帧：千刃横斩完成 16:9',
      prompt: `${CEL} Same camera axis, same 16:9 low-angle three-quarter, 35mm, 1.5 seconds later. 千刃 has finished ONE horizontal slash. Sparks draw a single rust-red line. Crimson haori lining is now flashed open. Hold the end pose. Same person, same hair streak, same hanging city. ${SENJIN} ${WORLD} ${CAST_LOCK} Image 1 is the start frame to continue.`,
      refs: [spark, senjin, look],
      who: ['千刃'],
    }, snap)

    const rival = await makeStill(ctx, state, 'rival', {
      intent: '预告升级静帧：朔夜现身 16:9',
      prompt: `${CEL} Medium-wide 16:9 keyframe, 35mm, rain alley under 烬轨城. 朔夜 ALONE stepping out, two SHORT straight daggers not yet crossed. Water sheets off the structured ash-gray trench. Teal lining glimpsed. NO second person, NO long katanas, NO extra girl. ${SAKUYA} ${WORLD} ${CAST_LOCK} Match copper lanterns and teal mist of the look plate.`,
      refs: [sparkEnd, sakuya, look],
      who: ['朔夜'],
    }, snap)
    const rivalEnd = await makeEnd(ctx, state, 'rival', {
      intent: '预告升级尾帧：朔夜双短刃交叉 16:9',
      prompt: `${CEL} Same rain alley, same 16:9 camera, 1.5 seconds later. 朔夜 has walked three steps and crossed TWO SHORT straight daggers into an X at chest height. Still alone. Coat wet. ${SAKUYA} ${WORLD} ${CAST_LOCK} Image 1 is the start frame to continue.`,
      refs: [rival, sakuya, look],
      who: ['朔夜'],
    }, snap)

    const clash = await makeStill(ctx, state, 'clash', {
      intent: '预告高潮静帧：对斩起势 16:9',
      prompt: `${CEL} Low-angle 16:9 keyframe, 24mm, hanging city below. 千刃 LEFT facing right with the rust-red curved blade. 朔夜 RIGHT facing left with TWO SHORT daggers, not a long sword. They are about to collide, blades not yet touching. Axis locked. Paper lanterns around them. ${SENJIN} ${SAKUYA} ${WORLD} ${CAST_LOCK}`,
      refs: [rivalEnd, senjin, sakuya, look],
      who: ['千刃', '朔夜'],
    }, snap)
    const clashEnd = await makeEnd(ctx, state, 'clash', {
      intent: '预告高潮尾帧：冲击环 16:9',
      prompt: `${CEL} Same 16:9 axis, 1.5 seconds later. Blades have met. A circular shock ring. Lanterns shred. Both faces still match their sheets. 朔夜 still holds SHORT daggers. ${SENJIN} ${SAKUYA} ${WORLD} ${CAST_LOCK} Image 1 is the start frame to continue.`,
      refs: [clash, senjin, sakuya, look],
      who: ['千刃', '朔夜'],
    }, snap)

    const slash = await makeStill(ctx, state, 'slash', {
      intent: '预告收束静帧：破云起刀 16:9',
      prompt: `${CEL} Hero low-angle 16:9 keyframe, 35mm. ONLY 千刃 in frame, empty walkway, empty rail, no second figure, no silhouette in the background. He raises the rust-red blade toward the copper dawn above the orbital rail of 烬轨城. Hair and haori not yet whipped. No title text. ${SENJIN} ${WORLD} ${CAST_LOCK}`,
      refs: [clashEnd, senjin, look],
      who: ['千刃'],
    }, snap)
    const slashEnd = await makeEnd(ctx, state, 'slash', {
      intent: '预告收束尾帧：云开未尽 16:9',
      prompt: `${CEL} Same 16:9 low angle, 1.5 seconds later. ONLY 千刃, empty walkway, no second figure. Upward slash has split the copper clouds a little — not a finished victory. Readable silhouette of 千刃 against the rail. No title text. ${SENJIN} ${WORLD} ${CAST_LOCK} Image 1 is the start frame to continue.`,
      refs: [slash, senjin, look],
      who: ['千刃'],
    }, snap)

    const stillReport = {
      look: state.look,
      title: state.stills.title,
      eyes, eyesEnd, world: state.stills.world, worldEnd,
      spark, sparkEnd, rival, rivalEnd, clash, clashEnd, slash, slashEnd,
    }
    await writeFile(join(jobRoot, 'STILLS-v2.json'), JSON.stringify(stillReport, null, 2), 'utf8')
    if (stillsOnly) {
      console.log('STILLS-ONLY done')
      return { stillsOnly: true, stills: stillReport }
    }

    const motions = [
      {
        key: 'eyes', intent: '镜1 钩子 千刃睁眼', genSec: 4, keep: 2.8,
        first: eyes, last: eyesEnd, who: ['千刃'],
        motion: 'Extreme close-up, static shot, almost no camera move. The left eye opens a few millimeters. The rail reflection slides across the iris. One breath fog. Smash-cut ending on the open eye.',
      },
      {
        key: 'world', intent: '镜2 世界 烬轨城轨裂', genSec: 6, keep: 5.0,
        first: state.stills.world, last: worldEnd, who: [],
        motion: 'Extreme wide, slow push in with small amplitude at slow speed toward the hanging city as the orbital rail splits a rust-red seam. Lanterns shake. Crows explode. No people.',
      },
      {
        key: 'spark', intent: '镜3 升级 一刀火星', genSec: 5, keep: 3.6,
        first: spark, last: sparkEnd, who: ['千刃'],
        motion: 'Low angle, one horizontal slash only. Sparks draw a rust-red line. Crimson lining flashes. Hold the end pose. No extra swing.',
      },
      {
        key: 'rival', intent: '镜4 升级 朔夜现身', genSec: 5, keep: 4.4,
        first: rival, last: rivalEnd, who: ['朔夜'],
        motion: 'Medium-wide, slow dolly. 朔夜 walks three steps and crosses two short daggers into an X. Water sheets off the coat. Nobody else enters frame.',
      },
      {
        key: 'clash', intent: '镜5 高潮 空中对斩', genSec: 6, keep: 6.0,
        first: clash, last: clashEnd, who: ['千刃', '朔夜'],
        motion: 'Low angle, one impact. They close, blades meet, shock ring expands, lanterns shred, then hold. Axis locked. 朔夜 keeps short daggers.',
      },
      {
        key: 'slash', intent: '镜6 收束 破云未尽', genSec: 5, keep: 4.2,
        first: slash, last: slashEnd, who: ['千刃'],
        motion: 'Hero low angle. One upward slash starts to split copper dawn clouds above the orbital rail. Hair and haori whip. Do not finish the victory. No title text.',
      },
    ]

    const planned = await canvas.planBoard({
      title: '破晓一刀 预告 v2',
      connect: true,
      acts: [{
        label: '破晓一刀 v2',
        shots: [
          ...motions.map(shot => ({ kind: 'video', label: shot.intent, prompt: shot.motion, seconds: shot.keep })),
          { kind: 'video', label: '镜7 片名', prompt: '片名卡破晓一刀', seconds: 3.6 },
        ],
      }],
    })
    const shotIds = planned.groups[0]?.shotIds ?? []

    const clipPaths = []
    for (const [index, shot] of motions.entries()) {
      const made = await gateAndGenerate({
        ...ctx, kind: 'video', strategy: 'fl2v',
        reuse: state.clips[`${shot.key}Raw`],
        intent: shot.intent,
        prompt: fl2vPrompt(shot.genSec, `${CEL} ${shot.motion} ${shot.who.includes('千刃') ? SENJIN : ''} ${shot.who.includes('朔夜') ? SAKUYA : ''} ${WORLD} ${CAST_LOCK}`),
        seconds: shot.genSec,
        firstFrame: shot.first,
        lastFrame: shot.last,
        characters: shot.who,
        snapshot: snap,
      })
      state.clips[`${shot.key}Raw`] = made.path
      let cut = made.path
      if (shot.keep < shot.genSec - 0.15) {
        const trimmed = await videoProcess({
          source: made.path, outputDir: settings.outputDir,
          start: 0.15, end: 0.15 + shot.keep,
        })
        cut = trimmed.path
      }
      state.clips[shot.key] = cut
      const tail = join(resolveOutputDir(settings.outputDir), `tail-${shot.key}.png`)
      try { extractTailFrame(cut, tail); state.tails[shot.key] = tail } catch { /* optional lock */ }
      await saveState(state)
      clipPaths.push(cut)
      if (shotIds[index] !== undefined) await canvas.update(shotIds[index], { path: cut, shotStatus: 'review' })
    }

    const titleHold = stillHold(state.stills.title, 3.6, settings.outputDir, 'title-hold-v2')
    state.clips.title = titleHold
    await saveState(state)
    clipPaths.push(titleHold)
    if (shotIds[6] !== undefined) await canvas.update(shotIds[6], { path: titleHold, shotStatus: 'review' })

    const packed = await videoConcat({
      files: clipPaths, outputDir: settings.outputDir, transition: 'cut', scale: '1280:720',
    })
    state.packed = packed.path
    await saveState(state)

    const deliver = join(jobRoot, '破晓一刀-v2.mp4')
    await copyFile(packed.path, deliver)
    const probe = probeMedia(packed.path)
    return {
      sheets: [SHEETS.senjin, SHEETS.sakuya],
      look: state.look,
      stills: state.stills,
      ends: state.ends,
      clips: clipPaths,
      tails: state.tails,
      packed: packed.path,
      deliver,
      durationSec: probe.durationSec,
    }
  })

  if (result.stillsOnly) return
  const report = [
    '# 《破晓一刀》预告 v2',
    '',
    `- 成片：${result.deliver}`,
    `- 打包：${result.packed}`,
    `- 时长：${result.durationSec}s`,
    '- 像素：yuv420p，拼条 letterbox 不拉伸',
    `- 镜头：${result.clips.length}（6 动 FL2VA + 片名定格）`,
    '',
    '## 预告语法',
    '钩子（睁眼 2.8s）→ 世界（轨裂 5s）→ 升级（横斩 3.6 + 朔夜 4.4）→ 高潮（对斩 6s）→ 收束（破云未尽 4.2）→ 片名（3.6s）。硬切。删掉抛刀老人。',
    '',
    '## 连续性',
    '每镜 FL2VA：首帧=本镜起幅，尾帧=本镜落幅。下一镜起幅用上一镜落幅+设定表+世界锁当参考。成片后再抽尾帧备查。',
    '',
    '## 设定表',
    ...result.sheets.map(path => `- ${path}`),
    '',
    `## 世界锁`,
    `- ${result.look}`,
    '',
    '## 冲击帧',
    ...Object.entries(result.stills).filter(([key]) => !key.endsWith('Raw')).map(([key, path]) => `- ${key} ${path}`),
    '',
    '硬切拼条，无 fade。问题见 ISSUES.md。',
    '',
  ].join('\n')
  await writeFile(join(jobRoot, 'REPORT-v2.md'), report, 'utf8')
  await writeFile(join(jobRoot, 'SUMMARY-v2.json'), JSON.stringify(result, null, 2), 'utf8')
  console.log(`DELIVER ${result.deliver} ${result.durationSec}s`)
}

main().catch(async error => {
  const message = error instanceof Error ? error.message : String(error)
  await appendFile(issuesPath, `## FATAL v2\n\n${message}\n`, 'utf8').catch(() => {})
  console.error(message)
  process.exit(1)
})
