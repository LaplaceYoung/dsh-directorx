#!/usr/bin/env node
/**
 * Theatrical shonen movie trailer 《破晓一刀》.
 * Same generate gates DSH uses. Hard-cut pack. Never prints API keys.
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
  brief,
  commitGenerateReady,
  craftPrompt,
  planProduction,
  probeMedia,
  resolveOutputDir,
  runCanvasCraft,
  runImage,
  runInProject,
  runVideo,
} from '../lib/testing.js'

const pluginRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const jobRoot = resolve(pluginRoot, '..', 'directorx_productions', '08-shonen-trailer')
const issuesPath = join(jobRoot, 'ISSUES.md')
const statePath = join(jobRoot, 'STATE.json')

const KNOWLEDGE = ['151', '205', '188', '01', '115']
const SKILLS = ['trailer-craft', 'minimax-h3-prompt-copilot', 'cinematic-style', 'directorx-chengpian', 'storyboard-craft']

const CEL = [
  'theatrical Japanese anime movie trailer still, late-modern cel look,',
  'clean ink outlines, two-to-three tone shadows, high-contrast warm copper versus cold teal,',
  'film grain, no photoreal skin, no 3D CGI render, no readable logos, no existing franchise faces,',
  'original character design, 16:9 anamorphic theatrical framing,',
].join(' ')

const SENJIN = [
  '千刃, a 17-year-old East Asian youth, wiry not bulky,',
  'shaggy charcoal-black hair with one white lightning streak over the left temple,',
  'sharp brows, large dark irises with a tiny amber catchlight,',
  'charcoal-black haori flashing a crimson inner lining, rust-red cloth sash, wrap shirt,',
  'single-edged slightly curved blade with a rust-red fuller and cloth-wrapped hilt,',
].join(' ')

const SAKUYA = [
  '朔夜, an 18-year-old East Asian youth slightly taller than 千刃,',
  'silver-blue chin-length bob with blunt bangs, pale skin, narrow cool-gray eyes,',
  'ash-gray high-collar coat with teal inner lining, two short straight blades, no chains,',
].join(' ')

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
  if (!existsSync(statePath)) return { sheets: {}, stills: {}, clips: {}, packed: '', shotIds: [] }
  try {
    return JSON.parse(await readFile(statePath, 'utf8'))
  } catch {
    return { sheets: {}, stills: {}, clips: {}, packed: '', shotIds: [] }
  }
}

async function saveState(state) {
  await writeFile(statePath, JSON.stringify(state, null, 2), 'utf8')
}

async function noteIssue(title, detail, fix) {
  await appendFile(issuesPath, `## ${new Date().toISOString()} · ${title}\n\n${detail}\n\n**处理：** ${fix}\n\n`, 'utf8')
  console.log(`  ISSUE ${title}`)
}

function stillClip(source, seconds, outputDir, name) {
  const destDir = resolveOutputDir(outputDir)
  const out = join(destDir, `${name}.mp4`)
  const result = spawnSync('ffmpeg', [
    '-y', '-loop', '1', '-i', source, '-t', String(seconds),
    '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2',
    '-r', '24', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-an', out,
  ], { encoding: 'utf8' })
  if (result.status !== 0) throw new Error(`still clip failed: ${result.stderr?.slice(-400)}`)
  return out
}

function snapshotOf(characters) {
  return {
    characters: characters.map(card => ({ name: card.name, refPath: card.refPath })),
    nodes: [],
    edges: [],
  }
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
        knowledgeRefs: KNOWLEDGE, skillNames: SKILLS, externalNotes: 'shonen-trailer',
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
        }, crafted.prompt, { size: size ?? '1536x1024', referenceImagePaths: referenceImages ?? [] })
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
        referenceImagePaths: firstFrame || lastFrame ? [] : (referenceImages ?? []),
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

async function main() {
  await mkdir(jobRoot, { recursive: true })
  if (!existsSync(issuesPath)) {
    await writeFile(issuesPath, `# 《破晓一刀》预告片问题账本\n\n`, 'utf8')
  }
  const loaded = loadDirectorxSettings()
  const settings = { ...loaded, outputDir: join(jobRoot, 'out'), timeoutMs: 1_200_000 }
  await mkdir(resolveOutputDir(settings.outputDir), { recursive: true })
  const state = await loadState()

  const result = await runInProject(jobRoot, async () => {
    const ledger = new DirectorxTaskLedger(settings.outputDir)
    const canvas = new DirectorxCanvasStore(settings.outputDir)
    const people = new CharacterStore(settings.outputDir)
    const ctx = { settings, ledger }
    const request = '做一条三十五秒横屏日漫热血电影预告片《破晓一刀》，钩子-世界-升级-片名，硬切不要淡，原创角色千刃与朔夜，剧场版赛璐璐。'

    const triage = await brief({ request, outputDir: settings.outputDir })
    const flow = planProduction({ request, kind: 'video' })
    await writeFile(join(jobRoot, 'brief.json'), JSON.stringify({ triage, flow }, null, 2), 'utf8')
    await writeFile(join(jobRoot, 'BRIEF.md'), [
      '# 《破晓一刀》剧场版预告',
      '',
      '- 时长：约 35–40 秒，16:9',
      '- 结构：钩子 → 世界 → 升级 → 片名',
      '- 切：硬切，禁止 fade',
      '- 角色：千刃 / 朔夜（原创，先设定表）',
      `- brief.type：${triage.type}`,
      `- compose：${triage.compose?.kind} / ${triage.compose?.recipe}`,
      '',
    ].join('\n'), 'utf8')

    let planned
    if (Array.isArray(state.shotIds) && state.shotIds.length >= 8) {
      planned = { groups: [{ shotIds: state.shotIds }] }
    } else {
      planned = await canvas.planBoard({
        title: '破晓一刀 预告',
        connect: true,
        acts: [{
          label: '破晓一刀',
          shots: [
            { kind: 'video', label: '镜1 轨裂钩子', prompt: '烬轨城轨道裂开红缝', seconds: 5 },
            { kind: 'video', label: '镜2 睁眼', prompt: '千刃睁眼映出轨道裂纹', seconds: 5 },
            { kind: 'video', label: '镜3 一刀火星', prompt: '千刃横斩火星成线', seconds: 5 },
            { kind: 'video', label: '镜4 朔夜现身', prompt: '朔夜雨巷双刀交叉', seconds: 5 },
            { kind: 'video', label: '镜5 空中对斩', prompt: '两人空中对斩冲击环', seconds: 6 },
            { kind: 'video', label: '镜6 抛刀', prompt: '老人抛刀千刃接住', seconds: 5 },
            { kind: 'video', label: '镜7 破云', prompt: '一刀劈开铜红云层', seconds: 5 },
            { kind: 'video', label: '镜8 片名', prompt: '片名卡破晓一刀', seconds: 3 },
          ],
        }],
      })
      state.shotIds = planned.groups[0]?.shotIds ?? []
      await saveState(state)
    }

    const senjinSheet = await gateAndGenerate({
      ...ctx, kind: 'image', strategy: 'character-sheet',
      reuse: state.sheets.senjin,
      intent: '千刃 16:9 角色设定表',
      prompt: `${CEL} 16:9 角色设定表 三视图。${SENJIN} White studio backdrop. Left column bust, right column front/side/back full body, same person, same hair streak, same crimson lining. No logos.`,
    })
    state.sheets.senjin = senjinSheet.path
    await saveState(state)
    await people.register({
      name: '千刃',
      refPath: senjinSheet.path,
      description: '黑发一道白雷纹，黑羽织绯红里，赤轨单刃。',
      outfit: 'charcoal haori, crimson lining, rust-red sash',
      props: 'single-edged rust-red blade',
    })

    const sakuyaSheet = await gateAndGenerate({
      ...ctx, kind: 'image', strategy: 'character-sheet',
      reuse: state.sheets.sakuya,
      intent: '朔夜 16:9 角色设定表',
      prompt: `${CEL} 16:9 角色设定表 三视图。${SAKUYA} White studio backdrop. Left column bust, right column front/side/back full body, same person, two short blades. No logos.`,
    })
    state.sheets.sakuya = sakuyaSheet.path
    await saveState(state)
    await people.register({
      name: '朔夜',
      refPath: sakuyaSheet.path,
      description: '银蓝齐刘海，灰青高领外套，双短刃。',
      outfit: 'ash-gray coat, teal lining',
      props: 'two short straight blades',
    })

    const roster = [
      { name: '千刃', refPath: senjinSheet.path },
      { name: '朔夜', refPath: sakuyaSheet.path },
    ]
    const snap = snapshotOf(roster)

    const stills = {
      hook: {
        intent: '预告钩子静帧：烬轨城轨裂',
        prompt: `${CEL} Extreme wide 16:9 keyframe. A hanging iron city bolted under a dying orbital rail. The rail splits a rust-red dawn seam. Paper lanterns shake. Crows explode. No people. Physical sky, copper cracked sun.`,
        refs: [],
      },
      eyes: {
        intent: '预告冲击帧：千刃睁眼',
        prompt: `${CEL} Extreme close-up 16:9 keyframe of 千刃 left eye just opening. The rust-red rail crack is reflected in the dark iris. Amber catchlight. Breath fog at the lash line. ${SENJIN}`,
        refs: [senjinSheet.path],
        who: ['千刃'],
      },
      spark: {
        intent: '预告冲击帧：千刃横斩',
        prompt: `${CEL} Low-angle three-quarter 16:9 keyframe. 千刃 finishes a single horizontal slash. Sparks draw one rust-red line. The crimson haori lining flashes. Stable pose, no motion blur. ${SENJIN}`,
        refs: [senjinSheet.path],
        who: ['千刃'],
      },
      rival: {
        intent: '预告冲击帧：朔夜雨巷',
        prompt: `${CEL} Medium-wide 16:9 keyframe. Rain alley of 烬轨城. 朔夜 steps out, two short blades crossed into an X. Water sheets off the ash-gray coat. Teal lining glimpsed. ${SAKUYA}`,
        refs: [sakuyaSheet.path],
        who: ['朔夜'],
      },
      clash: {
        intent: '预告冲击帧：空中对斩',
        prompt: `${CEL} Low-angle 16:9 keyframe. 千刃 and 朔夜 collide mid-air. Blades meet. A circular shock ring. Paper lanterns shred. Axis: 千刃 left facing right, 朔夜 right facing left. ${SENJIN} ${SAKUYA}`,
        refs: [senjinSheet.path, sakuyaSheet.path],
        who: ['千刃', '朔夜'],
      },
      promise: {
        intent: '预告冲击帧：接刀',
        prompt: `${CEL} Medium 16:9 keyframe. An old East Asian man with cropped steel hair, burnt-orange scarf and empty left sleeve has just thrown the rust-red blade. 千刃 catches the hilt, lining flashing. No logos. ${SENJIN}`,
        refs: [senjinSheet.path],
        who: ['千刃'],
      },
      slash: {
        intent: '预告冲击帧：破云一刀',
        prompt: `${CEL} Hero low-angle 16:9 keyframe. 千刃 upward slash splits copper dawn clouds above the orbital rail. Hair and haori whip. No title text. ${SENJIN}`,
        refs: [senjinSheet.path],
        who: ['千刃'],
      },
      title: {
        intent: '预告片名卡：破晓一刀',
        prompt: `${CEL} Locked-off wide shot, 35mm, 16:9 title card. Black atmosphere, one rust-red rail slash as rim light behind the type. Huge white brush calligraphy 破晓一刀, small 剧场版 under it. No camera move, no faces, no extra credits, no logos.`,
        refs: [],
      },
    }

    for (const [key, spec] of Object.entries(stills)) {
      const made = await gateAndGenerate({
        ...ctx, kind: 'image',
        strategy: key === 'title' ? 't2i' : key === 'hook' ? 'scene-still' : 'keyframe',
        reuse: state.stills[key],
        intent: spec.intent,
        prompt: spec.prompt,
        referenceImages: spec.refs,
        characters: spec.who ?? [],
        snapshot: snap,
      })
      state.stills[key] = made.path
      await saveState(state)
    }

    const motions = [
      { key: 'hook', intent: '镜1 轨裂钩子缓推', seconds: 5, first: state.stills.hook, who: [],
        prompt: `${CEL} 5-second 16:9 shot, slow push into the hanging city as the orbital rail splits a rust-red seam, lanterns shake, crows explode, no people, physical camera, smash-cut ending on a stable wide.` },
      { key: 'eyes', intent: '镜2 千刃睁眼', seconds: 5, first: state.stills.eyes, who: ['千刃'],
        prompt: `${CEL} 5-second 16:9 shot, extreme close-up, 千刃 left eye opens, the rail crack slides across the iris, one breath fog, almost no camera move, lock off. ${SENJIN}` },
      { key: 'spark', intent: '镜3 一刀火星', seconds: 5, first: state.stills.spark, who: ['千刃'],
        prompt: `${CEL} 5-second 16:9 shot, one horizontal slash only, sparks draw a rust-red line, crimson lining flashes, low angle, hold the end pose. ${SENJIN}` },
      { key: 'rival', intent: '镜4 朔夜现身', seconds: 5, first: state.stills.rival, who: ['朔夜'],
        prompt: `${CEL} 5-second 16:9 shot, 朔夜 walks three steps out of the rain alley and crosses two short blades into an X, water sheets off the coat, slow dolly. ${SAKUYA}` },
      { key: 'clash', intent: '镜5 空中对斩', seconds: 6, first: state.stills.clash, who: ['千刃', '朔夜'],
        prompt: `${CEL} 6-second 16:9 shot, 千刃 and 朔夜 collide mid-air, blades meet, shock ring expands, lanterns shred, one impact, then hold. Axis locked. ${SENJIN} ${SAKUYA}` },
      { key: 'promise', intent: '镜6 抛刀接住', seconds: 5, first: state.stills.promise, who: ['千刃'],
        prompt: `${CEL} 5-second 16:9 shot, the old one-handed man tosses the rust-red blade, 千刃 catches it, scarf snaps, single action arc. ${SENJIN}` },
      { key: 'slash', intent: '镜7 破云一刀', seconds: 5, first: state.stills.slash, who: ['千刃'],
        prompt: `${CEL} 5-second 16:9 shot, 千刃 upward slash splits the copper dawn clouds, hair and haori whip, no title text, end on a readable silhouette. ${SENJIN}` },
    ]

    const clipPaths = []
    const shotIds = planned.groups[0]?.shotIds ?? []
    for (const [index, shot] of motions.entries()) {
      const made = await gateAndGenerate({
        ...ctx, kind: 'video', strategy: 'i2v',
        reuse: state.clips[shot.key],
        intent: shot.intent, prompt: shot.prompt, seconds: shot.seconds,
        firstFrame: shot.first, characters: shot.who, snapshot: snap,
      })
      state.clips[shot.key] = made.path
      await saveState(state)
      clipPaths.push(made.path)
      if (shotIds[index] !== undefined) {
        await canvas.update(shotIds[index], { path: made.path, shotStatus: 'review' })
      }
    }

    const titleHold = stillClip(state.stills.title, 3.2, settings.outputDir, 'title-hold')
    state.clips.title = titleHold
    await saveState(state)
    clipPaths.push(titleHold)
    if (shotIds[7] !== undefined) {
      await canvas.update(shotIds[7], { path: titleHold, shotStatus: 'review' })
    }

    const packed = await runCanvasCraft({
      outputDir: settings.outputDir,
      action: 'pack',
      nodeIds: (shotIds.length >= 2 ? shotIds : undefined),
      transition: 'cut',
      arrange: false,
    })
    state.packed = packed.path
    await saveState(state)

    const sheet = await runCanvasCraft({
      outputDir: settings.outputDir,
      action: 'sheet',
      arrange: false,
    })

    const deliver = join(jobRoot, '破晓一刀.mp4')
    await copyFile(packed.path, deliver)
    const probe = probeMedia(packed.path)
    return {
      sheets: [senjinSheet.path, sakuyaSheet.path],
      stills: state.stills,
      clips: clipPaths,
      packed: packed.path,
      deliver,
      sheet: sheet.path,
      durationSec: probe.durationSec,
    }
  })

  const report = [
    '# 《破晓一刀》日漫热血电影预告片',
    '',
    `- 成片：${result.deliver}`,
    `- 打包：${result.packed}`,
    `- 时长：${result.durationSec}s`,
    '- 像素：yuv420p（pack 强制）',
    `- 接触表：${result.sheet}`,
    `- 镜头：${result.clips.length}（7 动 + 片名定格）`,
    '',
    '## 设定表',
    ...result.sheets.map(path => `- ${path}`),
    '',
    '## 冲击帧',
    ...Object.entries(result.stills).map(([key, path]) => `- ${key} ${path}`),
    '',
    '## 镜头',
    ...result.clips.map((path, i) => `- 镜${i + 1} ${path}`),
    '',
    '硬切拼条，无 fade。问题见 ISSUES.md。',
    '',
  ].join('\n')
  await writeFile(join(jobRoot, 'REPORT.md'), report, 'utf8')
  await writeFile(join(jobRoot, 'SUMMARY.json'), JSON.stringify(result, null, 2), 'utf8')
  console.log(`DELIVER ${result.deliver} ${result.durationSec}s`)
}

main().catch(async error => {
  const message = error instanceof Error ? error.message : String(error)
  await appendFile(issuesPath, `## FATAL\n\n${message}\n`, 'utf8').catch(() => {})
  console.error(message)
  process.exit(1)
})
