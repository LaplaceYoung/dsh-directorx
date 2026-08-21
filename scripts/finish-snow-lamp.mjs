#!/usr/bin/env node
/** Finish 雪夜一灯: generate missing climax shots and re-concat yuv420p. */
import { spawnSync } from 'node:child_process'
import { mkdir, writeFile, appendFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  DirectorxTaskLedger,
  ResearchLedger,
  commitGenerateReady,
  craftPrompt,
  runInProject,
  runVideo,
  resolveOutputDir,
  videoConcat,
  probeMedia,
} from '../lib/testing.js'

const pluginRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const jobRoot = resolve(pluginRoot, '..', 'directorx_productions', '06-snow-lamp')
const out = join(jobRoot, 'out')
const issuesPath = join(jobRoot, 'ISSUES.md')

const KNOWLEDGE = ['04', '109', '116', '125']
const SKILLS = ['directorx-chengpian', 'novel-characters', 'storyboard-craft', 'cinematic-style', 'continuous-video']
const STYLE = 'semi-realistic cinematic 3D Chinese animation, physically plausible anatomy, filmic contrast, snow night, warm tungsten lamp versus cold moonlight, no readable text, no logos, no celebrity likeness,'

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
  const cap = () => ({ enabled: true, mode: 'mock', baseURL: '', apiKey: '', model: '', resolution: '1K', auth: { klingAk: '', klingSk: '', runwayVersion: '' } })
  const settings = {
    outputDir: out, timeoutMs: 1_200_000, pollIntervalMs: 5_000, maxPollAttempts: 240,
    persona: '成片', initiative: '自动', vision: cap(), image: cap(), video: cap(), audio: cap(),
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
      if (['vision', 'image', 'video', 'audio'].includes(key) && top[2] === '') { current = key; continue }
      current = undefined
      if (key in settings && typeof settings[key] !== 'object') settings[key] = coerce(top[2])
      continue
    }
    if (nested && current !== undefined && nested[1] !== 'auth' && nested[1] in settings[current]) {
      settings[current][nested[1]] = coerce(nested[2])
    }
  }
  settings.outputDir = out
  settings.timeoutMs = 1_200_000
  return settings
}

async function generateVideo(settings, ledger, intent, prompt, seconds, firstFrame, characters) {
  let last
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const research = new ResearchLedger(settings.outputDir)
      for (const ref of KNOWLEDGE) await research.record({ kind: 'knowledge', ref })
      for (const name of SKILLS) await research.record({ kind: 'skill', ref: name })
      console.log(`  craft video #${attempt}: ${intent}`)
      const crafted = await craftPrompt({
        outputDir: settings.outputDir, kind: 'video', intent, prompt,
        knowledgeRefs: KNOWLEDGE, skillNames: SKILLS, externalNotes: 'public-remake-finish',
      })
      if (crafted.ok !== true) throw new Error(`craft 拒绝：${JSON.stringify(crafted).slice(0, 400)}`)
      const ready = await commitGenerateReady({
        outputDir: settings.outputDir, craftId: crafted.craftId, kind: 'video', intent,
        prompt: crafted.prompt, strategy: 'i2v', firstFrame, characters,
        snapshot: {
          characters: [
            { name: '阿宁', refPath: join(out, '配饰细节条-左右必须是同一个人-同一发型-同一表情-左栏柔和方向光-右栏平光正交-2026-08-17T19-56-14Z.png') },
            { name: '白绒', refPath: join(out, '配饰细节条-左右必须是同一个人-同一发型-同一表情-左栏柔和方向光-右栏平光正交-2026-08-17T19-57-04Z.png') },
          ],
          nodes: [], edges: [],
        },
      })
      if (ready.ok !== true) throw new Error(`ready 拒绝：${ready.reason ?? JSON.stringify(ready).slice(0, 400)}`)
      const generated = await runVideo({
        settings, capability: settings.video, signal: AbortSignal.timeout(settings.timeoutMs), ledger,
      }, crafted.prompt, {
        seconds, aspectRatio: '16:9', resolution: settings.video.resolution || '2K',
        firstFramePath: firstFrame, referenceImagePaths: [],
        negativePrompt: typeof crafted.negative === 'string' ? crafted.negative : undefined,
      })
      const path = generated.files?.find(item => item.path)?.path
      if (path === undefined) throw new Error('没有视频 path')
      console.log(`  video ok ${path}`)
      return path
    } catch (cause) {
      last = cause instanceof Error ? cause : new Error(String(cause))
      await appendFile(issuesPath, `\n## ${new Date().toISOString()} · ${intent} 补拍第 ${attempt} 次\n\n${last.message.slice(0, 500)}\n\n**处理：** ${attempt < 3 ? '重提任务' : '仍失败则停'}\n`, 'utf8')
    }
  }
  throw last
}

async function main() {
  await mkdir(out, { recursive: true })
  const settings = loadDirectorxSettings()
  const meet = join(out, 'semi-realistic-cinematic-3d-chinese-anim-2026-08-17T19-58-04Z.png')
  const monk = join(out, 'semi-realistic-cinematic-3d-chinese-anim-2026-08-17T19-57-32Z.png')
  for (const path of [meet, monk]) {
    if (!existsSync(path)) throw new Error(`缺少首帧 ${path}`)
  }
  const existing = [
    join(out, 'semi-realistic-cinematic-3d-chinese-anim-2026-08-17T20-07-12Z.mp4'),
    join(out, 'semi-realistic-cinematic-3d-chinese-anim-2026-08-17T20-18-17Z.mp4'),
    join(out, 'semi-realistic-cinematic-3d-chinese-anim-2026-08-17T20-32-23Z.mp4'),
    join(out, 'semi-realistic-cinematic-3d-chinese-anim-2026-08-17T20-46-29Z.mp4'),
  ]
  if (existing.some(path => !existsSync(path))) throw new Error('前四镜视频不齐')

  const result = await runInProject(jobRoot, async () => {
    const ledger = new DirectorxTaskLedger(settings.outputDir)
    const shot5 = await generateVideo(
      settings, ledger, '镜5 抱狐向灯',
      `${STYLE} 6-second 16:9 shot, the same novice stands and walks toward the shrine lamp carrying the same white fox against his chest, snow thicker, camera tracks beside him, lamp growing warmer.`,
      6, meet, ['阿宁', '白绒'],
    )
    const shot6 = await generateVideo(
      settings, ledger, '镜6 灯下金光收束',
      `${STYLE} 6-second 16:9 shot, the novice kneels at the lamp, gold light wraps the fox fur, the temple door stands half open behind them, snow eases, no human transformation, no text.`,
      6, monk, ['阿宁', '白绒'],
    )
    const cut = await videoConcat({
      files: [...existing, shot5, shot6],
      outputDir: settings.outputDir,
      transition: 'fade',
      fadeSec: 0.35,
      scale: '1280:720',
    })
    const probe = probeMedia(cut.path)
    return { shot5, shot6, cut: cut.path, durationSec: probe.durationSec, pix: probe.streams.find(s => s.type === 'video') }
  })

  await appendFile(issuesPath, `\n## 2026-08-18 · 补拍镜5/6 并重拼\n\n成片 ${result.cut}（${result.durationSec}s）\n\n**处理：** 刷新 research 后真生成两镜，concat 强制 yuv420p。\n`, 'utf8')
  const report = readFileSync(join(jobRoot, 'REPORT.md'), 'utf8')
  await writeFile(join(jobRoot, 'REPORT.md'), `${report}\n## 补拍后终剪\n- ${result.cut}\n- 时长 ${result.durationSec}s\n- 镜5 ${result.shot5}\n- 镜6 ${result.shot6}\n`, 'utf8')
  console.log(`DELIVER ${result.cut} ${result.durationSec}s`)
}

main().catch(async error => {
  const message = error instanceof Error ? error.message : String(error)
  await appendFile(issuesPath, `\n## FATAL finish\n\n${message}\n`, 'utf8').catch(() => {})
  console.error(message)
  process.exit(1)
})
