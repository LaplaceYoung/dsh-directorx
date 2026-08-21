#!/usr/bin/env node
/**
 * Drive DirectorX generate gates against the live DSH directorx settings.
 * Five distinct productions. Never prints API keys.
 */
import { spawnSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
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
  corpus,
  craftPrompt,
  planProduction,
  runAudio,
  runImage,
  runInProject,
  runVideo,
  skillIndex,
  resolveOutputDir,
  videoConcat,
  withCharacterSheetSpec,
} from '../lib/testing.js'

const pluginRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const productionsRoot = resolve(pluginRoot, '..', 'directorx_productions')

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
    throw new Error('image 能力未配置完整（enabled/baseURL/apiKey）')
  }
  if (!settings.video.enabled || !settings.video.baseURL || !settings.video.apiKey) {
    throw new Error('video 能力未配置完整')
  }
  return settings
}

function redactSettings(settings) {
  const copy = JSON.parse(JSON.stringify(settings))
  for (const key of ['vision', 'image', 'video', 'audio']) {
    if (typeof copy[key]?.apiKey === 'string' && copy[key].apiKey) {
      copy[key].apiKey = `redacted:${copy[key].apiKey.length}`
    }
  }
  return copy
}

function ctxFor(settings, capability, ledger) {
  return {
    settings,
    capability,
    signal: AbortSignal.timeout(settings.timeoutMs),
    ledger,
  }
}

async function research(outputDir, knowledgeRefs, skillNames) {
  const ledger = new ResearchLedger(outputDir)
  for (const ref of knowledgeRefs) await ledger.record({ kind: 'knowledge', ref })
  for (const name of skillNames) await ledger.record({ kind: 'skill', ref: name })
}

function firstPath(result) {
  const file = result?.files?.find(item => typeof item.path === 'string' && item.path !== '')
  return file?.path
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
  console.log(`  craft ${kind}: ${intent}`)
  await research(settings.outputDir, knowledgeRefs, skillNames)
  const crafted = await craftPrompt({
    outputDir: settings.outputDir,
    kind,
    intent,
    prompt,
    knowledgeRefs,
    skillNames,
    externalNotes: 'live-production',
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
    console.log(`  image ok ${path}`)
    return { crafted, ready, generated, path }
  }
  const generated = await runVideo(ctxFor(settings, settings.video, ledger), crafted.prompt, {
    seconds: seconds ?? 6,
    aspectRatio: '16:9',
    resolution: settings.video.resolution || '2K',
    firstFramePath: firstFrame,
    lastFramePath: lastFrame,
    referenceImagePaths: referenceImages ?? [],
    negativePrompt: typeof crafted.negative === 'string' ? crafted.negative : undefined,
  })
  const path = firstPath(generated)
  console.log(`  video ok ${path}`)
  return { crafted, ready, generated, path }
}

function latestMedia(dir, ext, exclude = []) {
  if (!existsSync(dir)) return undefined
  const files = readdirSync(dir)
    .filter(name => name.endsWith(ext) && !exclude.some(item => name.includes(item)))
    .map(name => join(dir, name))
    .sort((left, right) => statSync(right).mtimeMs - statSync(left).mtimeMs)
  return files[0]
}

function stillClip(source, seconds, outputDir, name) {
  const destDir = resolveOutputDir(outputDir)
  if (!existsSync(destDir)) spawnSync('mkdir', ['-p', destDir])
  const out = join(destDir, `${name}.mp4`)
  const result = spawnSync('ffmpeg', [
    '-y', '-loop', '1', '-i', source, '-t', String(seconds),
    '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2',
    '-r', '24', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-an', out,
  ], { encoding: 'utf8' })
  if (result.status !== 0) throw new Error(`still clip failed: ${result.stderr?.slice(-400)}`)
  return out
}

const JOBS = [
  {
    id: '01-moss-tvc',
    title: '上海 Moss 智能 · 15 秒品牌 TVC',
    type: '广告/宣传',
    request: '为上海 Moss 智能制作一支十五秒横屏品牌宣传片，冷静科技感，外滩玻璃幕墙与产品光点，不要赛博堆砌。',
    knowledge: ['105', '115', '125'],
    skills: ['directorx-chengpian', 'video-prompt-builder', 'cinematic-style'],
    async run(ctx) {
      const openIntent = 'Moss 智能品牌开场静帧：黎明外滩玻璃幕墙'
      const openPrompt = [
        'Wide establishing still, 16:9, dawn over the Huangpu river, wet glass curtain wall of a contemporary Shanghai office tower,',
        'soft mercury-blue ambient, single warm interior desk lamp visible through one window as a product of human work,',
        'no logos, no readable brand type, no neon rain, 35mm anamorphic feel, shallow atmospheric haze, cinematic still photography.',
      ].join(' ')
      const open = await gateAndGenerate({
        ...ctx, kind: 'image', intent: openIntent, prompt: openPrompt,
        knowledgeRefs: ctx.job.knowledge, skillNames: ctx.job.skills, strategy: 't2i', size: '1536x1024',
        reuse: latestMedia(resolveOutputDir(ctx.settings.outputDir), '.png'),
      })
      const moveIntent = 'Moss 智能 TVC 主镜头：镜头穿过大堂推向窗前工作台'
      const movePrompt = [
        'Cinematic 8-second commercial shot, 16:9, camera slowly dollies from a quiet marble lobby toward a window desk at dawn,',
        'a compact matte-aluminum desktop device sits on the oak table catching a single specular highlight,',
        'city river light wrapping the glass, physical camera, 35mm, subtle push in, no text, no logo, no faces close enough to identify,',
        'controlled highlight, hero product, calm premium technology commercial, natural sound of distant traffic only in the image implication.',
      ].join(' ')
      const move = await gateAndGenerate({
        ...ctx, kind: 'video', intent: moveIntent, prompt: movePrompt,
        knowledgeRefs: ctx.job.knowledge, skillNames: ctx.job.skills,
        strategy: 't2v', seconds: 8, firstFrame: open.path,
        reuse: latestMedia(resolveOutputDir(ctx.settings.outputDir), '.mp4', ['tvc-hold', 'concat']),
      })
      const hold = stillClip(open.path, 2.2, ctx.settings.outputDir, 'tvc-hold')
      const cut = await videoConcat({
        files: [hold, move.path],
        outputDir: ctx.settings.outputDir,
        transition: 'fade',
        fadeSec: 0.4,
        scale: '1280:720',
      })
      return { images: [open.path], videos: [move.path], cut: cut.path }
    },
  },
  {
    id: '02-ferry-drama',
    title: '原创微型短剧 · 雾渡',
    type: '叙事短剧',
    request: '拍一条原创雾中渡口短剧单元：先出女学生角色设定表，再从图生一段上船的镜头。',
    knowledge: ['04', '109', '116'],
    skills: ['novel-characters', 'continuous-video', 'storyboard-craft'],
    async run(ctx) {
      const sheetIntent = '雾渡女学生林晚 16:9 三视图设定表'
      const sheetPrompt = withCharacterSheetSpec([
        'Character sheet, 16:9, left column bust portrait as face baseline, right column front side back full body,',
        'nineteen-year-old East Asian student, thin frame, two long braids with faded red thread, washed navy school coat, holding a worn brown suitcase,',
        'neutral expression, even studio light, blank canvas background, no photoreal celebrity likeness, consistent face across all views.',
      ].join(' '))
      const existing = readdirSync(resolveOutputDir(ctx.settings.outputDir)).filter(name => name.endsWith('.png')).sort()
      const sheetReuse = existing.find(name => name.includes('设定') || name.includes('配饰') || name.includes('character'))
      const sheet = await gateAndGenerate({
        ...ctx, kind: 'image', intent: sheetIntent, prompt: sheetPrompt,
        knowledgeRefs: ctx.job.knowledge, skillNames: ctx.job.skills, strategy: 'character-sheet', size: '1536x1024',
        reuse: sheetReuse ? join(resolveOutputDir(ctx.settings.outputDir), sheetReuse) : undefined,
      })
      await new CharacterStore(ctx.settings.outputDir).register({
        name: '林晚',
        description: '十九岁女学生，双辫褪色红绳，藏青学生装，旧皮箱，清瘦警觉。',
        refPath: sheet.path,
      })
      const keyIntent = '林晚上船关键帧：雾中木船船头'
      const keyPrompt = [
        'Cinematic 16:9 keyframe, the same young woman from the character sheet stepping onto a wooden ferry in thick river fog,',
        'suitcase hugged to chest, knuckles pale, overcast dawn, wet planks, no modern city skyline, 40mm, medium shot, held close-up reserved for later,',
        'face matches the sheet, no text, no named IP.',
      ].join(' ')
      const keyReuse = existing.find(name => name.includes('keyframe') || name.includes('cinematic-16-9'))
      const key = await gateAndGenerate({
        ...ctx, kind: 'image', intent: keyIntent, prompt: keyPrompt,
        knowledgeRefs: ctx.job.knowledge, skillNames: ctx.job.skills,
        strategy: 'keyframe', size: '1536x1024', referenceImages: [sheet.path],
        reuse: keyReuse ? join(resolveOutputDir(ctx.settings.outputDir), keyReuse) : undefined,
      })
      const liveIntent = '林晚上船图生视频：雾中木船轻轻离岸'
      const livePrompt = [
        'Image to video, 6 seconds, the woman from the first frame finishes stepping onto the ferry, boat eases off the wet dock,',
        'fog drifts, wood creaks implied, camera locked off with tiny river sway, keep identity, no new characters, no text.',
      ].join(' ')
      const live = await gateAndGenerate({
        ...ctx, kind: 'video', intent: liveIntent, prompt: livePrompt,
        knowledgeRefs: ctx.job.knowledge, skillNames: ctx.job.skills,
        strategy: 'i2v', seconds: 6, firstFrame: key.path,
        characters: ['林晚'],
        snapshot: {
          characters: [{ name: '林晚', refPath: sheet.path, description: '十九岁女学生，双辫，藏青学生装，旧皮箱' }],
          nodes: [
            { id: 'sheet', kind: 'image', label: '林晚设定表', path: sheet.path, characters: ['林晚'] },
            { id: 'key', kind: 'image', label: '上船关键帧', path: key.path, characters: ['林晚'] },
          ],
          edges: [],
        },
      })
      return { images: [sheet.path, key.path], videos: [live.path], cut: live.path }
    },
  },
  {
    id: '03-kettle-commerce',
    title: '手冲壶电商主视觉 + 产品短片',
    type: '电商/产品',
    request: '为原创陶瓷手冲壶做一张主视觉和一段六秒质感短片，产品是主体。',
    knowledge: ['125', '115'],
    skills: ['shot-recipes', 'thumbnail-cover', 'video-prompt-builder'],
    async run(ctx) {
      const heroIntent = '陶瓷手冲壶电商主视觉'
      const heroPrompt = [
        'Hero product still, 16:9, matte speckled cream ceramic pour-over kettle on dark walnut, steam thread rising,',
        'controlled highlight along the spout, shallow depth of field, editorial tabletop, no logo, no hand, no brand type, 85mm.',
      ].join(' ')
      const hero = await gateAndGenerate({
        ...ctx, kind: 'image', intent: heroIntent, prompt: heroPrompt,
        knowledgeRefs: ctx.job.knowledge, skillNames: ctx.job.skills, strategy: 't2i', size: '1536x1024',
      })
      const spinIntent = '手冲壶六秒质感：蒸汽与倒水弧'
      const spinPrompt = [
        'Six-second product film, 16:9, the same cream ceramic kettle, a thin arc of hot water pours into a glass carafe,',
        'steam rises, camera slow push in, hero product, controlled highlight, no faces, no logo, tabletop commercial.',
      ].join(' ')
      const spin = await gateAndGenerate({
        ...ctx, kind: 'video', intent: spinIntent, prompt: spinPrompt,
        knowledgeRefs: ctx.job.knowledge, skillNames: ctx.job.skills,
        strategy: 'i2v', seconds: 6, firstFrame: hero.path,
      })
      return { images: [hero.path], videos: [spin.path], cut: spin.path }
    },
  },
  {
    id: '04-consistency-tutorial',
    title: '角色一致性工作坊口播片头',
    type: '口播/讲解',
    request: '做一条导演工作坊片头：先出讲解空间静帧，再出一段对镜头讲解氛围镜头，并配一句口播。',
    knowledge: ['104', '115', '117'],
    skills: ['short-video', 'script-writing', 'directorx-production-lead'],
    async run(ctx) {
      const roomIntent = '工作坊讲解空间静帧：木桌、参考板、台灯'
      const roomPrompt = [
        '16:9 cinematic still of a small directing workshop, oak table, printed storyboard cards, warm practical lamp,',
        'empty chair facing camera, direct address setup, stable eyeline implied, no readable text on papers, no faces.',
      ].join(' ')
      const room = await gateAndGenerate({
        ...ctx, kind: 'image', intent: roomIntent, prompt: roomPrompt,
        knowledgeRefs: ctx.job.knowledge, skillNames: ctx.job.skills, strategy: 'scene-still', size: '1536x1024',
      })
      const talkIntent = '工作坊对镜头讲解氛围：台灯下纸页轻翻'
      const talkPrompt = [
        'Six-second talking-head environment without a celebrity face: camera locked on the workshop desk, a hand turns a storyboard card,',
        'warm lamp flicker, direct address composition, stable eyeline toward lens from the empty chair space, no readable writing.',
      ].join(' ')
      const talk = await gateAndGenerate({
        ...ctx, kind: 'video', intent: talkIntent, prompt: talkPrompt,
        knowledgeRefs: ctx.job.knowledge, skillNames: ctx.job.skills,
        strategy: 'i2v', seconds: 6, firstFrame: room.path,
      })
      let voice
      try {
        const spoken = await runAudio(ctxFor(ctx.settings, ctx.settings.audio, ctx.ledger), '先锁同一张脸，再让它走动。设定表不是剧照。', {
          voice: 'Serena',
        })
        voice = firstPath(spoken)
      } catch (error) {
        voice = `audio-failed:${error instanceof Error ? error.message : String(error)}`
      }
      return { images: [room.path], videos: [talk.path], cut: talk.path, audio: voice }
    },
  },
  {
    id: '05-market-doc',
    title: '上海清晨菜市场纪实短片',
    type: '纪录片/纪实',
    request: '拍一条上海清晨菜市场纪实：一张建立镜头、一张手部特写、一段走巷视频，再剪成短片。',
    knowledge: ['109', '127'],
    skills: ['cinematic-style', 'editing-workflow', 'directorx-methodology'],
    async run(ctx) {
      const wideIntent = '菜市场建立镜头：湿水泥与塑料棚'
      const widePrompt = [
        'Documentary still, 16:9, early morning wet-market lane in Shanghai, plastic awnings, stacked greens, puddles reflecting tube lights,',
        'no identifiable faces, observational, 28mm, available light, no brand names readable.',
      ].join(' ')
      const wide = await gateAndGenerate({
        ...ctx, kind: 'image', intent: wideIntent, prompt: widePrompt,
        knowledgeRefs: ctx.job.knowledge, skillNames: ctx.job.skills, strategy: 't2i', size: '1536x1024',
        reuse: latestMedia(resolveOutputDir(ctx.settings.outputDir), '.png', ['close-up', 'weathered']),
      })
      const handsIntent = '菜市场手部特写：捆青菜'
      const handsPrompt = [
        'Documentary close-up still, weathered hands tying greens with plastic string on a wet plastic crate, 50mm, available fluorescent mix,',
        'no face, no logo, observational photography.',
      ].join(' ')
      const hands = await gateAndGenerate({
        ...ctx, kind: 'image', intent: handsIntent, prompt: handsPrompt,
        knowledgeRefs: ctx.job.knowledge, skillNames: ctx.job.skills, strategy: 't2i', size: '1536x1024',
        reuse: latestMedia(resolveOutputDir(ctx.settings.outputDir), '.png', ['early-morning', 'establishing']),
      })
      const walkIntent = '菜市场走巷：手持跟拍六秒'
      const walkPrompt = [
        'Six-second documentary clip, handheld shake gentle, walking down the wet-market lane from the establishing still,',
        'camera reveals more stalls through foreground occlusion of hanging bags, no identifiable faces, observational.',
      ].join(' ')
      const walk = await gateAndGenerate({
        ...ctx, kind: 'video', intent: walkIntent, prompt: walkPrompt,
        knowledgeRefs: ctx.job.knowledge, skillNames: ctx.job.skills,
        strategy: 'i2v', seconds: 6, firstFrame: wide.path,
      })
      const a = stillClip(wide.path, 2.0, ctx.settings.outputDir, 'doc-wide')
      const b = stillClip(hands.path, 1.8, ctx.settings.outputDir, 'doc-hands')
      const cut = await videoConcat({
        files: [a, walk.path, b],
        outputDir: ctx.settings.outputDir,
        transition: 'fade',
        fadeSec: 0.25,
        scale: '1280:720',
      })
      return { images: [wide.path, hands.path], videos: [walk.path], cut: cut.path }
    },
  },
]

async function pinCanvas(outputDir, job, artifacts) {
  const canvas = new DirectorxCanvasStore(outputDir)
  await canvas.setTitle(job.title)
  const nodes = []
  let x = 48
  for (const [index, path] of (artifacts.images ?? []).entries()) {
    const id = `img-${index + 1}`
    nodes.push({ id, kind: 'image', label: `静帧 ${index + 1}`, path, x, y: 80, width: 280, height: 158, shotIndex: index + 1 })
    x += 300
  }
  for (const [index, path] of (artifacts.videos ?? []).entries()) {
    const id = `vid-${index + 1}`
    nodes.push({ id, kind: 'video', label: `镜头 ${index + 1}`, path, x, y: 80, width: 280, height: 158, shotIndex: (artifacts.images?.length ?? 0) + index + 1 })
    x += 300
  }
  if (artifacts.cut) {
    nodes.push({ id: 'cut', kind: 'video', label: '成片', path: artifacts.cut, x, y: 80, width: 320, height: 180, shotIndex: 99 })
  }
  await canvas.addNode(nodes[0])
  for (const node of nodes.slice(1)) await canvas.addNode(node)
  return nodes.map(node => node.id)
}

async function runJob(settingsBase, job) {
  const root = join(productionsRoot, job.id)
  await mkdir(join(root, 'out'), { recursive: true })
  const settings = { ...settingsBase, outputDir: 'out', timeoutMs: 1_200_000, pollIntervalMs: 8_000, maxPollAttempts: 240 }
  return runInProject(root, async () => {
    corpus.setRoot(join(pluginRoot, 'knowledge'))
    skillIndex.setRoot(join(pluginRoot, 'skills'))
    const ledger = new DirectorxTaskLedger('out')
    const flow = planProduction({ request: job.request })
    const diagnosed = await brief({ request: job.request, outputDir: 'out' })
    const started = Date.now()
    const artifacts = await job.run({ settings, ledger, job })
    await pinCanvas('out', job, artifacts)
    const report = {
      id: job.id,
      title: job.title,
      type: job.type,
      request: job.request,
      seconds: Math.round((Date.now() - started) / 1000),
      compose: diagnosed.compose?.kind,
      simple: flow.simple,
      artifacts,
      settings: {
        image: `${settings.image.mode}/${settings.image.model}`,
        video: `${settings.video.mode}/${settings.video.model}`,
      },
    }
    await writeFile(join(root, 'REPORT.md'), [
      `# ${job.title}`,
      '',
      `- 类型：${job.type}`,
      `- 请求：${job.request}`,
      `- 用时：${report.seconds}s`,
      `- 图像模型：${report.settings.image}`,
      `- 视频模型：${report.settings.video}`,
      `- 成片：${artifacts.cut ?? '（单镜）'}`,
      '',
      '## 产物',
      ...(artifacts.images ?? []).map(path => `- 图 ${path}`),
      ...(artifacts.videos ?? []).map(path => `- 视频 ${path}`),
      artifacts.audio ? `- 音频 ${artifacts.audio}` : '',
    ].filter(Boolean).join('\n'), 'utf8')
    return report
  })
}

const wanted = process.argv.slice(2)
const queue = wanted.length === 0 ? JOBS : JOBS.filter(job => wanted.includes(job.id) || wanted.includes(job.id.split('-')[0]))

const settings = loadDirectorxSettings()
console.log(JSON.stringify({
  ok: true,
  productionsRoot,
  queue: queue.map(job => job.id),
  caps: redactSettings(settings),
}, null, 2))

const results = []
for (const job of queue) {
  console.log(`\n=== START ${job.id} ${job.title} ===`)
  try {
    const report = await runJob(settings, job)
    results.push({ ok: true, ...report })
    console.log(`=== OK ${job.id} cut=${report.artifacts.cut} ===`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    results.push({ ok: false, id: job.id, title: job.title, error: message.slice(0, 800) })
    console.error(`=== FAIL ${job.id}: ${message.slice(0, 800)} ===`)
  }
}

await mkdir(productionsRoot, { recursive: true })
await writeFile(join(productionsRoot, 'SUMMARY.json'), JSON.stringify(results, null, 2), 'utf8')
const failed = results.filter(item => item.ok !== true)
if (failed.length > 0) {
  console.error(`\n${failed.length}/${results.length} failed`)
  process.exitCode = 1
} else {
  console.log(`\n${results.length} productions completed`)
}
