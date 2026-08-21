#!/usr/bin/env node
/**
 * Remake a publicly documented 1-minute 3D Chinese-animation short
 * (snow temple, last lamp, novice, white fox) as an original board
 * titled 雪夜一灯. Uses the same generate gates DSH calls.
 * Never prints API keys.
 */
import { spawnSync } from 'node:child_process'
import { mkdir, writeFile, appendFile } from 'node:fs/promises'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
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
  runImage,
  runInProject,
  runVideo,
  resolveOutputDir,
  videoConcat,
  withCharacterSheetSpec,
  probeMedia,
} from '../lib/testing.js'

const pluginRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const jobRoot = resolve(pluginRoot, '..', 'directorx_productions', '06-snow-lamp')
const issuesPath = join(jobRoot, 'ISSUES.md')

function capTemplate() {
  return {
    enabled: true,
    mode: 'mock',
    baseURL: '',
    apiKey: '',
    model: '',
    resolution: '1K',
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
    outputDir: 'out',
    timeoutMs: 1_200_000,
    pollIntervalMs: 5_000,
    maxPollAttempts: 240,
    persona: '成片',
    initiative: '自动',
    vision: capTemplate(),
    image: capTemplate(),
    video: capTemplate(),
    audio: capTemplate(),
  }
  let current
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i]
    if (line.trim() === '' || line.trim().startsWith('#')) continue
    if (/^\S/.test(line)) break
    const top = line.match(/^  ([A-Za-z]+):\s*(.*)$/)
    const nested = line.match(/^    ([A-Za-z]+):\s*(.*)$/)
    if (top && !line.startsWith('    ')) {
      const key = top[1]
      const value = top[2]
      if (['vision', 'image', 'video', 'audio'].includes(key) && value === '') {
        current = key
        continue
      }
      current = undefined
      if (key in settings && typeof settings[key] !== 'object') settings[key] = coerce(value)
      continue
    }
    if (nested && current !== undefined) {
      const key = nested[1]
      if (key === 'auth') continue
      if (key in settings[current]) settings[current][key] = coerce(nested[2])
    }
  }
  if (!settings.image.enabled || !settings.image.baseURL || !settings.image.apiKey) {
    throw new Error('image 能力未配置完整')
  }
  if (!settings.video.enabled || !settings.video.baseURL || !settings.video.apiKey) {
    throw new Error('video 能力未配置完整')
  }
  return settings
}

function ctxFor(settings, capability, ledger) {
  return {
    settings,
    capability,
    signal: AbortSignal.timeout(settings.timeoutMs),
    ledger,
  }
}

function firstPath(result) {
  const file = result?.files?.find(item => typeof item.path === 'string' && item.path !== '')
  return file?.path
}

async function noteIssue(title, detail, fix) {
  const block = [
    `## ${new Date().toISOString()} · ${title}`,
    '',
    detail,
    '',
    `**处理：** ${fix}`,
    '',
  ].join('\n')
  await appendFile(issuesPath, block, 'utf8')
  console.log(`  ISSUE ${title}`)
}

async function gateAndGenerate(input) {
  const {
    settings, ledger, kind, intent, prompt, knowledgeRefs, skillNames,
    strategy, firstFrame, lastFrame, referenceImages, seconds, size, characters, snapshot,
  } = input
  if (typeof input.reuse === 'string' && existsSync(input.reuse)) {
    console.log(`  reuse ${kind}: ${input.reuse}`)
    return { crafted: { craftId: 'reuse' }, ready: { readyId: 'reuse' }, generated: { files: [{ path: input.reuse }] }, path: input.reuse }
  }
  let lastError
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      console.log(`  craft ${kind} #${attempt}: ${intent}`)
      const research = new ResearchLedger(settings.outputDir)
      for (const ref of knowledgeRefs) await research.record({ kind: 'knowledge', ref })
      for (const name of skillNames) await research.record({ kind: 'skill', ref: name })
      const crafted = await craftPrompt({
        outputDir: settings.outputDir,
        kind,
        intent,
        prompt,
        knowledgeRefs,
        skillNames,
        externalNotes: 'public-remake',
      })
      if (crafted.ok !== true) {
        throw new Error(`prompt_craft 拒绝：${crafted.next ?? JSON.stringify(crafted).slice(0, 400)}`)
      }
      const ready = await commitGenerateReady({
        outputDir: settings.outputDir,
        craftId: crafted.craftId,
        kind: kind === 'audio' ? 'image' : kind,
        intent,
        prompt: crafted.prompt,
        strategy,
        firstFrame,
        lastFrame,
        referenceImages,
        characters,
        snapshot: snapshot ?? { characters: [], nodes: [], edges: [] },
      })
      if (ready.ok !== true) {
        throw new Error(`generate_ready 拒绝：${ready.reason ?? ready.next?.join('; ') ?? JSON.stringify(ready).slice(0, 400)}`)
      }
      console.log(`  ready ${ready.readyId} → generate ${kind}`)
      if (kind === 'image') {
        const generated = await runImage(ctxFor(settings, settings.image, ledger), crafted.prompt, {
          size: size ?? '1536x1024',
          referenceImagePaths: referenceImages ?? [],
        })
        const path = firstPath(generated)
        if (path === undefined) throw new Error('image 没有返回 path')
        console.log(`  image ok ${path}`)
        return { crafted, ready, generated, path }
      }
      const generated = await runVideo(ctxFor(settings, settings.video, ledger), crafted.prompt, {
        seconds: seconds ?? 6,
        aspectRatio: '16:9',
        resolution: settings.video.resolution || '2K',
        firstFramePath: firstFrame,
        lastFramePath: lastFrame,
        referenceImagePaths: firstFrame || lastFrame ? [] : (referenceImages ?? []),
        negativePrompt: typeof crafted.negative === 'string' ? crafted.negative : undefined,
      })
      const path = firstPath(generated)
      if (path === undefined) throw new Error('video 没有返回 path')
      console.log(`  video ok ${path}`)
      return { crafted, ready, generated, path }
    } catch (cause) {
      lastError = cause instanceof Error ? cause : new Error(String(cause))
      await noteIssue(
        `${intent} 第 ${attempt} 次失败`,
        lastError.message.slice(0, 800),
        attempt < 3 ? '重试同一闸，不换主体。' : '三次仍失败，记入报告并改用已有静帧撑镜。',
      )
    }
  }
  throw lastError
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

const KNOWLEDGE = ['04', '109', '116', '125']
const SKILLS = ['directorx-chengpian', 'novel-characters', 'storyboard-craft', 'cinematic-style', 'continuous-video']

const STYLE = [
  'semi-realistic cinematic 3D Chinese animation, physically plausible anatomy, filmic contrast,',
  'snow night, warm tungsten lamp versus cold moonlight, no readable text, no logos, no celebrity likeness,',
].join(' ')

async function main() {
  await mkdir(jobRoot, { recursive: true })
  if (!existsSync(issuesPath)) {
    await writeFile(issuesPath, `# 《雪夜一灯》复刻问题账本\n\n按出现顺序记录，修掉才往下走。\n\n`, 'utf8')
  }
  const loaded = loadDirectorxSettings()
  const settings = { ...loaded, outputDir: join(jobRoot, 'out'), timeoutMs: 1_200_000 }
  await mkdir(resolveOutputDir(settings.outputDir), { recursive: true })

  const result = await runInProject(jobRoot, async () => {
    const ledger = new DirectorxTaskLedger(settings.outputDir)
    const research = new ResearchLedger(settings.outputDir)
    for (const ref of KNOWLEDGE) await research.record({ kind: 'knowledge', ref })
    for (const name of SKILLS) await research.record({ kind: 'skill', ref: name })
    const canvas = new DirectorxCanvasStore(settings.outputDir)
    const characters = new CharacterStore(settings.outputDir)
    const ctx = { settings, ledger, job: { knowledge: KNOWLEDGE, skills: SKILLS } }

    const triage = brief({
      request: '复刻一支公开的一分钟 3D 国漫短片结构：雪夜山庙、沙弥守灯、救冻僵的白狐。横屏连续成片。',
      outputDir: settings.outputDir,
    })
    const flow = planProduction({
      request: '复刻一支公开的一分钟 3D 国漫短片结构：雪夜山庙、沙弥守灯、救冻僵的白狐。横屏连续成片。',
      kind: 'video',
    })
    await writeFile(join(jobRoot, 'brief.json'), JSON.stringify({ triage, flow }, null, 2), 'utf8')

    const planned = await canvas.planBoard({
      title: '雪夜一灯',
      connect: true,
      acts: [{
        label: '雪夜一灯',
        shots: [
          { kind: 'video', label: '镜1 山庙空镜', prompt: '雪夜山庙远景，檐下一点暖灯', seconds: 5 },
          { kind: 'video', label: '镜2 阿宁守灯', prompt: '沙弥阿宁守灯', seconds: 6 },
          { kind: 'video', label: '镜3 雪窝白绒', prompt: '白狐白绒几乎冻僵', seconds: 5 },
          { kind: 'video', label: '镜4 跪地相遇', prompt: '阿宁跪到白绒身边', seconds: 6 },
          { kind: 'video', label: '镜5 抱狐向灯', prompt: '抱狐走向灯', seconds: 6 },
          { kind: 'video', label: '镜6 灯下金光', prompt: '灯火覆狐，庙门半开', seconds: 6 },
        ],
      }],
    })

    const temple = await gateAndGenerate({
      ...ctx, kind: 'image',
      intent: '雪夜山神庙空镜静帧',
      prompt: `${STYLE} Wide establishing still, 16:9, snow-covered mountain shrine at night, one warm oil lamp under the eave, pine and stone steps, no people, 35mm anamorphic haze.`,
      knowledgeRefs: KNOWLEDGE, skillNames: SKILLS, strategy: 'scene-still',
    })
    const monkSheet = await gateAndGenerate({
      ...ctx, kind: 'image',
      intent: '沙弥阿宁 16:9 三视图设定表',
      prompt: withCharacterSheetSpec([
        'Character sheet, 16:9, left bust baseline, right front side back,',
        'twelve-year-old East Asian novice monk, shaved crown with a small remaining topknot, grey hemp robe, thin red sash, calm dark eyes, small burn scar on left eyebrow,',
        'neutral expression, even studio light, blank canvas, consistent face, no photoreal celebrity.',
      ].join(' ')),
      knowledgeRefs: KNOWLEDGE, skillNames: SKILLS, strategy: 'character-sheet',
    })
    const foxSheet = await gateAndGenerate({
      ...ctx, kind: 'image',
      intent: '白狐白绒 16:9 三视图设定表',
      prompt: withCharacterSheetSpec([
        'Character sheet, 16:9, left bust-like head study, right front side back full body,',
        'small white fox, frost-tipped ears, one dark smudge on the right foreleg, pale amber eyes, thin winter fur clumped with ice,',
        'neutral animal study, even studio light, blank canvas, consistent markings, no cute chibi.',
      ].join(' ')),
      knowledgeRefs: KNOWLEDGE, skillNames: SKILLS, strategy: 'character-sheet',
    })

    await characters.register({ name: '阿宁', description: '十二岁沙弥，灰麻衣，左眉小烫痕', refPath: monkSheet.path })
    await characters.register({ name: '白绒', description: '瘦小白狐，右前腿一块深色毛', refPath: foxSheet.path })

    const monkStill = await gateAndGenerate({
      ...ctx, kind: 'image',
      intent: '阿宁在檐下守灯的关键帧',
      prompt: `${STYLE} 16:9 cinematic still, the same novice from the character sheet sits under the shrine eave beside a single oil lamp, snow falling past the pillars, profile three-quarter, hands around a clay bowl, lamp is the only warm key light.`,
      knowledgeRefs: KNOWLEDGE, skillNames: SKILLS, strategy: 'keyframe',
      characters: ['阿宁'], referenceImages: [monkSheet.path, temple.path],
      snapshot: { characters: [{ name: '阿宁', refPath: monkSheet.path }], nodes: [], edges: [] },
    })
    const meetStill = await gateAndGenerate({
      ...ctx, kind: 'image',
      intent: '阿宁跪在白绒身边的关键帧',
      prompt: `${STYLE} 16:9 cinematic still, the same novice kneels in deep snow beside the same small white fox, shrine lamp glowing far behind them, his hand hovering above the fox, hesitation not heroism, matching faces and markings.`,
      knowledgeRefs: KNOWLEDGE, skillNames: SKILLS, strategy: 'keyframe',
      characters: ['阿宁', '白绒'], referenceImages: [monkSheet.path, foxSheet.path],
      snapshot: {
        characters: [
          { name: '阿宁', refPath: monkSheet.path },
          { name: '白绒', refPath: foxSheet.path },
        ],
        nodes: [], edges: [],
      },
    })

    const snap = {
      characters: [
        { name: '阿宁', refPath: monkSheet.path },
        { name: '白绒', refPath: foxSheet.path },
      ],
      nodes: [],
      edges: [],
    }

    const clips = []
    const videos = [
      {
        intent: '镜1 山庙空镜缓推',
        prompt: `${STYLE} 5-second 16:9 shot, slow push toward the snow shrine, lamp flickering once, falling snow, no people, physical camera, 35mm.`,
        seconds: 5, first: temple.path, characters: [],
      },
      {
        intent: '镜2 阿宁守灯呼吸',
        prompt: `${STYLE} 6-second 16:9 shot, the same novice from the first frame breathes visible vapor, tiny head turn toward the snow, lamp flame steadies, no dialogue.`,
        seconds: 6, first: monkStill.path, characters: ['阿宁'],
      },
      {
        intent: '镜3 白绒几乎不动',
        prompt: `${STYLE} 5-second 16:9 shot, the same small white fox curled in a snow hollow, one ear twitches, snow collecting on fur, shallow breath, no standing up.`,
        seconds: 5, first: foxSheet.path, characters: ['白绒'],
      },
      {
        intent: '镜4 跪地相遇',
        prompt: `${STYLE} 6-second 16:9 shot, starting from the still, the novice lowers his hand closer to the fox without picking it up yet, wind lifts snow, lamp far in background.`,
        seconds: 6, first: meetStill.path, characters: ['阿宁', '白绒'],
      },
      {
        intent: '镜5 抱狐向灯',
        prompt: `${STYLE} 6-second 16:9 shot, the same novice stands and walks toward the shrine lamp carrying the same white fox against his chest, snow thicker, camera tracks beside him, lamp growing warmer.`,
        seconds: 6, first: meetStill.path, characters: ['阿宁', '白绒'],
      },
      {
        intent: '镜6 灯下金光收束',
        prompt: `${STYLE} 6-second 16:9 shot, the novice kneels at the lamp, gold light wraps the fox fur, the temple door stands half open behind them, snow eases, no human transformation, no text.`,
        seconds: 6, first: monkStill.path, characters: ['阿宁', '白绒'],
      },
    ]

    const shotIds = planned.groups[0]?.shotIds ?? []
    for (const [index, shot] of videos.entries()) {
      let made
      try {
        made = await gateAndGenerate({
          ...ctx, kind: 'video',
          intent: shot.intent,
          prompt: shot.prompt,
          knowledgeRefs: KNOWLEDGE, skillNames: SKILLS,
          strategy: 'i2v',
          seconds: shot.seconds,
          firstFrame: shot.first,
          characters: shot.characters,
          snapshot: snap,
        })
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : String(cause)
        await noteIssue(
          `${shot.intent} 生成失败，改静帧撑镜`,
          message.slice(0, 800),
          '用对应首帧做定长静帧，保证成片不断档。',
        )
        const hold = stillClip(shot.first, shot.seconds, settings.outputDir, `hold-${index + 1}`)
        made = { path: hold }
      }
      clips.push(made.path)
      const nodeId = shotIds[index]
      if (nodeId !== undefined) {
        await canvas.update(nodeId, { path: made.path, shotStatus: 'review' })
      }
    }

    const cut = await videoConcat({
      files: clips,
      outputDir: settings.outputDir,
      transition: 'fade',
      fadeSec: 0.35,
      scale: '1280:720',
    })
    const probe = probeMedia(cut.path)
    return {
      images: [temple.path, monkSheet.path, foxSheet.path, monkStill.path, meetStill.path],
      clips,
      cut: cut.path,
      durationSec: probe.durationSec,
      canvasUpdatedAt: (await canvas.read()).updatedAt,
    }
  })

  const report = [
    '# 《雪夜一灯》复刻成片',
    '',
    '- 类型：公开一分钟 3D 国漫短片结构复刻（雪庙守灯 / 救狐）',
    `- 成片：${result.cut}`,
    `- 时长：${result.durationSec}s`,
    `- 镜头数：${result.clips.length}`,
    '',
    '## 静帧',
    ...result.images.map(path => `- ${path}`),
    '',
    '## 镜头',
    ...result.clips.map((path, index) => `- 镜${index + 1} ${path}`),
    '',
    '问题见 ISSUES.md。',
    '',
  ].join('\n')
  await writeFile(join(jobRoot, 'REPORT.md'), report, 'utf8')
  await writeFile(join(jobRoot, 'SUMMARY.json'), JSON.stringify(result, null, 2), 'utf8')
  console.log(`DELIVER ${result.cut} ${result.durationSec}s`)
}

main().catch(async error => {
  const message = error instanceof Error ? error.message : String(error)
  await appendFile(issuesPath, `## FATAL\n\n${message}\n`, 'utf8').catch(() => {})
  console.error(message)
  process.exit(1)
})
