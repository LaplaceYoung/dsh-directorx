#!/usr/bin/env node
/**
 * Commercial-grade 30s TVC for Moss 智能.
 * Same generate gates DSH uses. Never prints API keys.
 */
import { mkdir, writeFile, appendFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
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
  probeMedia,
} from '../lib/testing.js'

const pluginRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const jobRoot = resolve(pluginRoot, '..', 'directorx_productions', '07-moss-tvc-pro')
const issuesPath = join(jobRoot, 'ISSUES.md')

const KNOWLEDGE = ['105', '115', '125', '109']
const SKILLS = ['directorx-chengpian', 'cinematic-style', 'video-prompt-builder', 'storyboard-craft']
const GRADE = [
  'premium technology commercial photography, physically based materials,',
  'dawn mercury-blue ambient versus one warm tungsten desk lamp, wet glass, no neon, no rain of glyphs,',
  'no readable logos, no brand type, no celebrity faces, 35mm anamorphic, controlled highlights,',
].join(' ')
const PRODUCT = [
  'the same compact matte brushed-aluminum desktop device, rounded rectangle about 90 by 140 by 18 millimeters,',
  'single cool-white status LED on the top face, no markings, no screen UI text,',
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

async function noteIssue(title, detail, fix) {
  await appendFile(issuesPath, `## ${new Date().toISOString()} · ${title}\n\n${detail}\n\n**处理：** ${fix}\n\n`, 'utf8')
  console.log(`  ISSUE ${title}`)
}

async function gateAndGenerate(input) {
  const {
    settings, ledger, kind, intent, prompt, strategy, firstFrame, lastFrame,
    referenceImages, seconds, size,
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
        knowledgeRefs: KNOWLEDGE, skillNames: SKILLS, externalNotes: 'commercial-tvc',
      })
      if (crafted.ok !== true) throw new Error(`prompt_craft 拒绝：${JSON.stringify(crafted).slice(0, 400)}`)
      const ready = await commitGenerateReady({
        outputDir: settings.outputDir, craftId: crafted.craftId, kind, intent,
        prompt: crafted.prompt, strategy, firstFrame, lastFrame, referenceImages,
        snapshot: { characters: [], nodes: [], edges: [] },
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
        seconds: seconds ?? 6, aspectRatio: '16:9', resolution: settings.video.resolution || '2K',
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
    await writeFile(issuesPath, `# Moss 智能 30s TVC 问题账本\n\n`, 'utf8')
  }
  const loaded = loadDirectorxSettings()
  const settings = { ...loaded, outputDir: join(jobRoot, 'out'), timeoutMs: 1_200_000 }
  await mkdir(resolveOutputDir(settings.outputDir), { recursive: true })

  const result = await runInProject(jobRoot, async () => {
    const ledger = new DirectorxTaskLedger(settings.outputDir)
    const canvas = new DirectorxCanvasStore(settings.outputDir)
    const ctx = { settings, ledger }

    const triage = brief({
      request: '为上海 Moss 智能制作一支三十秒横屏商业 TVC，黎明外滩办公楼，同一台拉丝铝桌面终端从窗到桌到手，冷静科技感，不要赛博堆砌。',
      outputDir: settings.outputDir,
    })
    const flow = planProduction({
      request: '为上海 Moss 智能制作三十秒商业 TVC 宣传片',
      kind: 'video',
    })
    await writeFile(join(jobRoot, 'brief.json'), JSON.stringify({ triage, flow }, null, 2), 'utf8')

    const planned = await canvas.planBoard({
      title: 'Moss 智能 30s TVC',
      connect: true,
      acts: [{
        label: 'Moss TVC',
        shots: [
          { kind: 'video', label: '镜1 幕墙钩子', prompt: '黎明外滩玻璃幕墙一点暖光', seconds: 5 },
          { kind: 'video', label: '镜2 大堂推进', prompt: '大理石大堂推向窗前工位', seconds: 6 },
          { kind: 'video', label: '镜3 产品高光', prompt: '铝盒设备在橡木桌上', seconds: 6 },
          { kind: 'video', label: '镜4 手转正', prompt: '双手把设备转正灯亮', seconds: 6 },
          { kind: 'video', label: '镜5 拉回窗', prompt: '拉回窗，设备仍是重心', seconds: 5 },
        ],
      }],
    })

    const city = await gateAndGenerate({
      ...ctx, kind: 'image', strategy: 'scene-still',
      intent: 'TVC 开场静帧：黎明外滩玻璃幕墙',
      prompt: `${GRADE} Wide 16:9 still, dawn over the Huangpu, wet glass curtain wall of a contemporary Shanghai tower, one warm interior lamp visible through a high window, empty streets below, atmospheric haze.`,
    })
    const lobby = await gateAndGenerate({
      ...ctx, kind: 'image', strategy: 'scene-still',
      intent: 'TVC 大堂工位静帧',
      prompt: `${GRADE} 16:9 still, quiet marble lobby looking toward a window desk at dawn, oak table, empty chair, city river light wrapping the glass, ${PRODUCT} sitting on the desk catching one specular.`,
      referenceImages: [city.path],
    })
    const hero = await gateAndGenerate({
      ...ctx, kind: 'image', strategy: 'keyframe',
      intent: 'TVC 产品主视觉',
      prompt: `${GRADE} 16:9 product still, three-quarter view, ${PRODUCT} on pale oak, dawn window bokeh behind, one hard specular on the aluminum lid, tabletop commercial, shallow DOF.`,
      referenceImages: [lobby.path],
    })
    const hands = await gateAndGenerate({
      ...ctx, kind: 'image', strategy: 'keyframe',
      intent: 'TVC 手与产品关键帧',
      prompt: `${GRADE} 16:9 still, adult East Asian hands with no jewelry turning ${PRODUCT} a few degrees on the oak desk, status LED just catching, no faces, no tattoos, dawn window in the background.`,
      referenceImages: [hero.path],
    })

    const shots = [
      {
        intent: '镜1 幕墙钩子缓推',
        prompt: `${GRADE} 5-second 16:9 shot, slow push toward the glass tower, the warm window lamp pulses once, no people, physical camera.`,
        seconds: 5, first: city.path,
      },
      {
        intent: '镜2 大堂推向工位',
        prompt: `${GRADE} 6-second 16:9 shot, dolly from the marble lobby toward the window desk, ${PRODUCT} becomes readable on the oak table, no faces.`,
        seconds: 6, first: lobby.path,
      },
      {
        intent: '镜3 产品高光微推',
        prompt: `${GRADE} 6-second 16:9 product shot, very slow push on ${PRODUCT}, the specular crawls an inch across the lid, LED stays a single point, no text.`,
        seconds: 6, first: hero.path,
      },
      {
        intent: '镜4 手转正灯亮',
        prompt: `${GRADE} 6-second 16:9 shot, the same hands rotate ${PRODUCT} a quarter turn, the status LED brightens once, no faces, no extra props.`,
        seconds: 6, first: hands.path,
      },
      {
        intent: '镜5 拉回窗收束',
        prompt: `${GRADE} 5-second 16:9 shot, gentle pull back from ${PRODUCT} to include the dawn window and river light, device remains the visual weight, no titles.`,
        seconds: 5, first: lobby.path,
      },
    ]

    const clips = []
    const shotIds = planned.groups[0]?.shotIds ?? []
    for (const [index, shot] of shots.entries()) {
      const made = await gateAndGenerate({
        ...ctx, kind: 'video', strategy: 'i2v',
        intent: shot.intent, prompt: shot.prompt, seconds: shot.seconds, firstFrame: shot.first,
      })
      clips.push(made.path)
      if (shotIds[index] !== undefined) {
        await canvas.update(shotIds[index], { path: made.path, shotStatus: 'review' })
      }
    }

    const cut = await videoConcat({
      files: clips, outputDir: settings.outputDir, transition: 'fade', fadeSec: 0.28, scale: '1280:720',
    })
    const probe = probeMedia(cut.path)
    return {
      images: [city.path, lobby.path, hero.path, hands.path],
      clips,
      cut: cut.path,
      durationSec: probe.durationSec,
    }
  })

  const report = [
    '# Moss 智能 · 30 秒商业 TVC',
    '',
    `- 成片：${result.cut}`,
    `- 时长：${result.durationSec}s`,
    `- 镜头：${result.clips.length}`,
    '',
    '## 静帧',
    ...result.images.map(path => `- ${path}`),
    '',
    '## 镜头',
    ...result.clips.map((path, i) => `- 镜${i + 1} ${path}`),
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
