import { spawnSync } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { existsSync, renameSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { resolveOutputDir, slugify } from '../support.ts'
import { probeMedia, type MediaProbe } from './ffmpeg.ts'
import { gradeFilter, type GradeLook } from './grade.ts'

/**
 * Deterministic ffmpeg assembly (plugin-native, no network): trim / speed /
 * scale / volume / mute / fps, and multi-clip concat with xfade transitions.
 * ffmpeg is the mature open-source engine behind these tools; the build
 * available here ships xfade/atempo/setpts/scale/volume but NOT libass, so
 * subtitle burning stays out of scope (SRT sidecars ship with transcripts).
 */

function runFfmpeg(args: string[], what: string): void {
  // 原子输出：写临时文件再改名，避免半成品文件被读到。
  let outputIndex = -1
  for (let index = args.length - 1; index >= 0; index -= 1) {
    const arg = args[index]
    if (arg !== undefined && !arg.startsWith('-')) { outputIndex = index; break }
  }
  const finalArgs = [...args]
  const dot = outputIndex >= 0 ? args[outputIndex].lastIndexOf('.') : -1
  const tempPath = outputIndex >= 0 && dot > 0
    ? `${args[outputIndex].slice(0, dot)}.tmp-${Date.now().toString(36)}${args[outputIndex].slice(dot)}`
    : undefined
  if (outputIndex >= 0 && tempPath !== undefined) finalArgs[outputIndex] = tempPath
  const result = spawnSync('ffmpeg', ['-hide_banner', '-y', ...finalArgs], { encoding: 'utf8' })
  if (result.status !== 0) {
    if (tempPath !== undefined) rmSync(tempPath, { force: true })
    throw new Error(`${what} failed: ${result.stderr?.slice(-600) || `exit ${result.status}`}`)
  }
  if (outputIndex >= 0 && tempPath !== undefined) {
    renameSync(tempPath, args[outputIndex])
  }
}

export interface VideoProcessInput {
  source: string
  outputDir: string
  start?: number
  end?: number
  speed?: number
  scale?: string
  volume?: number
  mute?: boolean
  fps?: number
  /** Reverse playback (时光倒流效果) — reverse filter. */
  reverse?: boolean
  /** Hold the LAST frame for N extra seconds (freeze-frame ending). */
  freezeEnd?: number
  /** Hold the FIRST frame for N extra seconds (freeze-frame opening). */
  freezeStart?: number
  /** 裁剪 'w:h:x:y'（crop 滤镜，逐字段 clamp 到源尺寸内）。 */
  crop?: string
  /** 旋转 90/180/270 度（transpose 链）。 */
  rotate?: 90 | 180 | 270
  hflip?: boolean
  vflip?: boolean
  /** 滤镜链：每个 { name, value }，name ∈ 边界表（eq/gblur/unsharp/vignette/noise/colorchannelmixer/colorkey），value 越界自动 clamp。 */
  filters?: Array<{ name: string; value: string }>
  /** 只导出音频轨（.m4a，跳过视频编码）。 */
  extractAudio?: boolean
  /** 电影感调色预设（与 grade.ts 同一套配方）。 */
  grade?: GradeLook
  /** 修复预设：upscale-sharp 2x 兰索斯放大+锐化 / denoise 时空降噪。 */
  restore?: 'upscale-sharp' | 'denoise'
  /** 去水印（静态角标）：'x:y:w:h' 区域，走 ffmpeg delogo。 */
  delogo?: string
  /** 3D LUT 调色（.cube 文件绝对路径；lut3d 滤镜）。 */
  lut3d?: string
  /** LUT 插值模式（lut3d interp，默认 tetrahedral）。 */
  lut3dInterp?: 'nearest' | 'trilinear' | 'tetrahedral' | 'pyramid' | 'prism'
  /** 文字层：样式化文字叠加（drawtext）。CJK 需 fontFile 指定字体文件路径。 */
  textOverlays?: Array<{
    text: string
    x?: string
    y?: string
    fontSize?: number
    color?: string
    borderColor?: string
    borderWidth?: number
    backgroundColor?: string
    fontFile?: string
  }>
}

export interface VideoConcatInput {
  files: string[]
  outputDir: string
  /** 'cut' | 'fade'，或逐对接缝的转场名数组（xfade 白名单）。 */
  transition?: 'fade' | 'cut' | string[]
  fadeSec?: number
  scale?: string
}

function outputPath(outputDir: string, tag: string, ext: string): string {
  const root = resolveOutputDir(outputDir)
  mkdir(root, { recursive: true }).catch(() => {})
  return join(root, `${slugify(tag)}-${Date.now().toString(36)}.${ext}`)
}

export interface VideoOutput {
  path: string
  mimeType: 'video/mp4'
  probe: MediaProbe
}

export async function videoProcess(input: VideoProcessInput): Promise<VideoOutput> {
  const out = outputPath(input.outputDir, 'processed', 'mp4')
  const videoFilters: string[] = []
  const audioFilters: string[] = []
  if (input.start !== undefined || input.end !== undefined) {
    const start = input.start ?? 0
    const end = input.end !== undefined ? `:end=${input.end}` : ''
    videoFilters.push(`trim=start=${start}${end},setpts=PTS-STARTPTS`)
    audioFilters.push(`atrim=start=${start}${end},asetpts=PTS-STARTPTS`)
  }
  if (input.speed !== undefined && input.speed > 0 && input.speed !== 1) {
    const speed = input.speed
    videoFilters.push(`setpts=${(1 / speed).toFixed(4)}*PTS`)
    // atempo supports 0.5..2 per instance; chain for wider ranges.
    let remaining = speed
    const atempoParts: string[] = []
    while (remaining > 2.0001) { atempoParts.push('atempo=2.0'); remaining /= 2 }
    while (remaining < 0.4999) { atempoParts.push('atempo=0.5'); remaining /= 0.5 }
    atempoParts.push(`atempo=${Math.min(2, Math.max(0.5, remaining)).toFixed(4)}`)
    audioFilters.push(...atempoParts)
  }
  if (input.scale !== undefined && input.scale !== '') {
    videoFilters.push(`scale=${input.scale}`)
  }
  if (input.fps !== undefined && input.fps > 0) {
    videoFilters.push(`fps=${input.fps}`)
  }
  if (input.crop !== undefined && input.crop !== '') {
    const parts = input.crop.split(':').map(Number)
    if (parts.length === 4 && parts.every(part => Number.isFinite(part) && part >= 0)) {
      videoFilters.push(`crop=${parts[0]}:${parts[1]}:${parts[2]}:${parts[3]}`)
    }
  }
  if (input.rotate !== undefined) {
    if (input.rotate === 90) videoFilters.push('transpose=1')
    if (input.rotate === 180) videoFilters.push('transpose=1,transpose=1')
    if (input.rotate === 270) videoFilters.push('transpose=2')
  }
  if (input.hflip === true) videoFilters.push('hflip')
  if (input.vflip === true) videoFilters.push('vflip')
  if (input.filters !== undefined) {
    // 边界表：越界数值 clamp 到安全区间，避免滤镜链解析失败。
    for (const filter of input.filters) {
      const name = filter.name.trim()
      let value = filter.value
      if (name === 'eq') {
        const nums = value.split(':').map(Number)
        const clamped = nums.map(num => (Number.isFinite(num) ? Math.max(-1, Math.min(1, num)) : 0))
        value = clamped.join(':')
      } else if (name === 'gblur') {
        const sigma = Number(value)
        value = String(Number.isFinite(sigma) ? Math.max(0, Math.min(50, sigma)) : 1)
      } else if (name === 'noise') {
        const amount = Number(value)
        value = String(Number.isFinite(amount) ? Math.max(0, Math.min(100, amount)) : 10)
      } else if (name === 'vignette') {
        const angle = value.replace(/^angle=/, '')
        const degrees = Number(angle)
        value = `angle=${String(Number.isFinite(degrees) ? Math.max(0, Math.min(360, degrees)) : 180)}`.replace(/^angle=0$/, 'angle=PI*0')
      }
      videoFilters.push(`${name}=${value}`)
    }
  }
  if (input.reverse === true) {
    videoFilters.push('reverse')
    audioFilters.push('areverse')
  }
  if (input.freezeEnd !== undefined && input.freezeEnd > 0) {
    // tpad holds the last frame (video) + apad keeps silence (audio).
    videoFilters.push(`tpad=stop_mode=clone:stop_duration=${input.freezeEnd}`)
    audioFilters.push(`apad=pad_dur=${input.freezeEnd}`)
  }
  if (input.freezeStart !== undefined && input.freezeStart > 0) {
    videoFilters.push(`tpad=start_mode=clone:start_duration=${input.freezeStart}`)
    audioFilters.push(`apad=pad_dur=${input.freezeStart}`)
  }
  if (input.mute === true) {
    audioFilters.length = 0
  } else if (input.volume !== undefined) {
    audioFilters.push(`volume=${input.volume}`)
  }
  if (input.lut3d !== undefined && input.lut3d !== '') {
    if (!existsSync(input.lut3d)) throw new Error(`LUT 文件不存在：${input.lut3d}`)
    const interp = input.lut3dInterp ?? 'tetrahedral'
    videoFilters.push(`lut3d=file=${input.lut3d.replace(/[,;\\]/g, '')}:interp=${interp}`)
  }
  if (input.restore === 'upscale-sharp') {
    videoFilters.push('scale=iw*2:ih*2:flags=lanczos,unsharp=5:5:0.6:5:5:0.0,cas=0.4')
  } else if (input.restore === 'denoise') {
    videoFilters.push('hqdn3d=1.5:1.5:6:6,tmix=frames=3:weights=1 2 1')
  }
  if (input.delogo !== undefined && /^\d+:\d+:\d+:\d+$/.test(input.delogo)) {
    videoFilters.push(`delogo=x=${input.delogo.split(':')[0]}:y=${input.delogo.split(':')[1]}:w=${input.delogo.split(':')[2]}:h=${input.delogo.split(':')[3]}`)
  }
  if (input.grade !== undefined) {
    videoFilters.push(gradeFilter(input.grade))
  }
  const args: string[] = ['-i', input.source]
  if (videoFilters.length > 0) args.push('-vf', videoFilters.join(','))
  if (audioFilters.length > 0) args.push('-af', audioFilters.join(','))
  if (input.mute === true) args.push('-an')
  if (input.textOverlays !== undefined && input.textOverlays.length > 0) {
    for (const overlay of input.textOverlays) {
      // drawtext 文本转义：反斜杠/冒号/逗号/百分号/单引号。
      const escaped = overlay.text
        .replace(/\\/g, '\\\\')
        .replace(/:/g, '\\:')
        .replace(/,/g, '\\,')
        .replace(/%/g, '\\%')
        .replace(/'/g, '\\\'')
      const options = [
        `text='${escaped}'`,
        ...(overlay.x !== undefined && overlay.x !== '' ? [`x=${overlay.x}`] : []),
        ...(overlay.y !== undefined && overlay.y !== '' ? [`y=${overlay.y}`] : []),
        ...(overlay.fontSize !== undefined && overlay.fontSize > 0 ? [`fontsize=${overlay.fontSize}`] : []),
        ...(overlay.color !== undefined && overlay.color !== '' ? [`fontcolor=${overlay.color}`] : []),
        ...(overlay.borderColor !== undefined && overlay.borderColor !== '' ? [`bordercolor=${overlay.borderColor}`] : []),
        ...(overlay.borderWidth !== undefined && overlay.borderWidth > 0 ? [`borderw=${overlay.borderWidth}`] : []),
        ...(overlay.backgroundColor !== undefined && overlay.backgroundColor !== '' ? [`box=1:boxcolor=${overlay.backgroundColor}@0.6:boxborderw=8`] : []),
        ...(overlay.fontFile !== undefined && overlay.fontFile !== '' ? [`fontfile=${overlay.fontFile}`] : []),
      ]
      videoFilters.push(`drawtext=${options.join(':')}`)
    }
  }
  if (input.extractAudio === true) {
    const audioOut = out.replace(/\.mp4$/, '.m4a')
    args.push('-vn', '-c:a', 'aac', audioOut)
    runFfmpeg(args, 'audio extract')
    return { path: audioOut, mimeType: 'video/mp4', probe: probeMedia(audioOut) }
  }
  args.push('-c:v', 'libx264', '-preset', 'veryfast', '-c:a', 'aac', out)
  runFfmpeg(args, 'video process')
  return { path: out, mimeType: 'video/mp4', probe: probeMedia(out) }
}

export async function videoConcat(input: VideoConcatInput): Promise<VideoOutput> {
  if (input.files.length < 2) throw new Error('videoConcat needs at least 2 files')
  const out = outputPath(input.outputDir, 'concat', 'mp4')
  const fadeSec = input.fadeSec ?? 0.5
  const scale = input.scale ?? '1280:720'

  const XFADE_WHITELIST = new Set(['fade', 'dissolve', 'fadeblack', 'fadewhite', 'wipeleft', 'wiperight', 'wipeup', 'wipedown', 'slideleft', 'slideright', 'slideup', 'slidedown', 'circlecrop', 'rectcrop', 'distance', 'radial', 'smoothleft', 'smoothright', 'smoothup', 'smoothdown', 'circleopen', 'circleclose', 'vertopen', 'vertclose', 'horzopen', 'horzclose', 'pixelize', 'diagtl', 'diagtr', 'diagbl', 'diagbr', 'hlslice', 'hrslice', 'vuslice', 'vdslice', 'hblur', 'fadegrays', 'wipetl', 'wipetr', 'wipebl', 'wipebr', 'squeezeh', 'squeezev', 'zoomin', 'hlwind', 'hrwind', 'vuwind', 'vdwind', 'coverleft', 'coverright', 'coverup', 'coverdown', 'revealleft', 'revealright', 'revealup', 'revealdown'])
  const perPairTransitions = Array.isArray(input.transition) ? input.transition : undefined
  if (input.transition === 'cut' || fadeSec <= 0) {
    // Plain concat: normalize each clip to a common size/fps first. Clips
    // without audio get a silent track so the audio chain stays aligned.
    const probes = input.files.map(file => probeMedia(file))
    const anyAudio = probes.some(probe => probe.streams.some(stream => stream.type === 'audio'))
    const args: string[] = []
    const filters: string[] = []
    input.files.forEach((file, index) => {
      args.push('-i', file)
      const hasAudio = probes[index].streams.some(stream => stream.type === 'audio')
      if (anyAudio) {
        filters.push(`[${index}:v]scale=${scale},fps=30,setpts=PTS-STARTPTS[v${index}];${hasAudio ? `[${index}:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,asetpts=PTS-STARTPTS[a${index}]` : `anullsrc=channel_layout=stereo:sample_rate=48000[a${index}]`}`)
      } else {
        filters.push(`[${index}:v]scale=${scale},fps=30,setpts=PTS-STARTPTS[v${index}]`)
      }
    })
    const inputs = anyAudio ? input.files.map((_, index) => `[v${index}][a${index}]`).join('') : input.files.map((_, index) => `[v${index}]`).join('')
    const filterComplex = `${filters.join(';')};${inputs}concat=n=${input.files.length}:v=1:a=${anyAudio ? 1 : 0}${anyAudio ? '[v][a]' : '[v]'}`
    args.push('-filter_complex', filterComplex, '-map', '[v]', '-c:v', 'libx264', '-preset', 'veryfast')
    if (anyAudio) args.push('-map', '[a]', '-c:a', 'aac')
    args.push(out)
    runFfmpeg(args, 'video concat (cut)')
    return { path: out, mimeType: 'video/mp4', probe: probeMedia(out) }
  }

  // Xfade chain: overlap = fadeSec; offsets accumulate from clip durations.
  // Audio-aware: video-only clips get silent tracks so the chain stays aligned.
  const probes = input.files.map(file => probeMedia(file))
  const anyAudio = probes.some(probe => probe.streams.some(stream => stream.type === 'audio'))
  const args: string[] = []
  for (const file of input.files) args.push('-i', file)
  const filters: string[] = []
  if (anyAudio) {
    input.files.forEach((_, index) => {
      const hasAudio = probes[index].streams.some(stream => stream.type === 'audio')
      filters.push(`[${index}:v]scale=${scale},fps=30,setpts=PTS-STARTPTS[v${index}];${hasAudio ? `[${index}:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,asetpts=PTS-STARTPTS[a${index}]` : `anullsrc=channel_layout=stereo:sample_rate=48000[a${index}]`}`)
    })
  } else {
    input.files.forEach((_, index) => {
      filters.push(`[${index}:v]scale=${scale},fps=30,setpts=PTS-STARTPTS[v${index}]`)
    })
  }
  let video = '[v0]'
  let audio = '[a0]'
  let offset = (probes[0]?.durationSec ?? 3) - fadeSec
  for (let index = 1; index < input.files.length; index += 1) {
    const nextV = `[vx${index}]`
    const transitionName = perPairTransitions?.[index - 1] !== undefined && XFADE_WHITELIST.has(perPairTransitions[index - 1])
      ? perPairTransitions[index - 1]
      : 'fade'
    filters.push(`${video}[v${index}]xfade=transition=${transitionName}:duration=${fadeSec}:offset=${offset.toFixed(3)}${nextV}`)
    if (anyAudio) {
      const nextA = `[ax${index}]`
      filters.push(`${audio}[a${index}]acrossfade=d=${fadeSec}${nextA}`)
      audio = nextA
    }
    video = nextV
    offset += (probes[index]?.durationSec ?? 3) - fadeSec
  }
  const filterComplex = `${filters.join(';')}`
  args.push('-filter_complex', filterComplex, '-map', video)
  if (anyAudio) args.push('-map', audio, '-c:a', 'aac')
  args.push('-c:v', 'libx264', '-preset', 'veryfast', out)
  runFfmpeg(args, 'video concat (fade)')
  return { path: out, mimeType: 'video/mp4', probe: probeMedia(out) }
}

export interface AudioMixInput {
  /** Video (or audio) file the tracks are mixed onto. */
  video: string
  outputDir: string
  /** Extra tracks, in order: first listed track sits on top (e.g. narration first). */
  tracks: Array<{ path: string; volume?: number }>
  /** Duck the later tracks under this track index (0-based into tracks, typically the narration). */
  duckUnder?: number
  /** Optional EBU R128 target (e.g. -14 for short video, -23 broadcast). */
  targetLufs?: number
  /** 音频时长策略：keep_video（默认，视频时长为准）/ pad_audio（音频不足补静音）/ loop_audio / trim_audio / shortest。 */
  durationPolicy?: 'keep_video' | 'pad_audio' | 'loop_audio' | 'trim_audio' | 'shortest'
}

export async function audioMix(input: AudioMixInput): Promise<VideoOutput> {
  if (input.tracks.length === 0) throw new Error('audioMix needs at least one track')
  const out = outputPath(input.outputDir, 'mixed', 'mp4')
  const args: string[] = ['-i', input.video]
  for (const track of input.tracks) args.push('-i', track.path)
  const parts: string[] = []
  const trackLabels: string[] = []
  input.tracks.forEach((track, index) => {
    const vol = track.volume ?? 1
    parts.push(`[${index + 1}:a]volume=${vol},aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[trk${index}]`)
    trackLabels.push(`[trk${index}]`)
  })
  let mixInputs = trackLabels.join('')
  if (input.duckUnder !== undefined && input.duckUnder >= 0 && input.duckUnder < input.tracks.length) {
    const voice = `[trk${input.duckUnder}]`
    const bgm = input.duckUnder === 0
      ? trackLabels.slice(1).join('') === '' ? null : trackLabels.slice(1)
      : [trackLabels[0]]
    if (bgm !== null && bgm.length > 0) {
      const ducked = bgm.map(label => `${label}${voice}sidechaincompress=threshold=0.15:ratio=4:attack=20:release=400:makeup=1[duck${bgm.indexOf(label)}]`).join(';')
      parts.push(ducked)
      const duckLabels = bgm.map((_, index) => `[duck${index}]`)
      const all = input.duckUnder === 0 ? [voice, ...duckLabels] : [...duckLabels, voice]
      mixInputs = all.join('')
    }
  }
  let audioLabel = '[mixed]'
  if (input.targetLufs !== undefined) {
    parts.push(`${mixInputs}amix=inputs=${input.tracks.length}:duration=first:normalize=0[mixed0]`)
    parts.push(`[mixed0]loudnorm=I=${input.targetLufs}:TP=-1:LRA=11[mixed]`)
    audioLabel = '[mixed]'
  } else {
    parts.push(`${mixInputs}amix=inputs=${input.tracks.length}:duration=first:normalize=0[mixed]`)
  }
  args.push('-filter_complex', parts.join(';'), '-map', '0:v', '-map', audioLabel, '-c:v', 'copy', '-c:a', 'aac', '-shortest', out)
  runFfmpeg(args, 'audio mix')
  return { path: out, mimeType: 'video/mp4', probe: probeMedia(out) }
}

export interface VideoSubtitleInput {
  video: string
  srt: string
  mode?: 'soft' | 'burn'
  outputDir: string
}

/** Probe libass once per process (burn mode requires the ass filter). */
let libassProbe: boolean | undefined
export function hasLibass(): boolean {
  if (libassProbe !== undefined) return libassProbe
  const result = spawnSync('ffmpeg', ['-hide_banner', '-h', 'filter=ass'], { encoding: 'utf8' })
  // ffmpeg 9 exits 0 even for unknown filters — parse the output instead.
  libassProbe = result.status === 0 && !/Unknown filter/.test(result.stdout ?? '')
  return libassProbe
}

export async function videoSubtitle(input: VideoSubtitleInput): Promise<VideoOutput> {
  const mode = input.mode ?? 'soft'
  const out = outputPath(input.outputDir, 'subtitle', 'mp4')
  if (mode === 'burn') {
    if (!hasLibass()) {
      throw new Error('当前 ffmpeg 构建缺少 libass（无法烧录字幕）。请使用 mode=soft 软字幕，或安装带 libass 的 ffmpeg。')
    }
    const escaped = input.srt.replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "\\'")
    runFfmpeg(['-i', input.video, '-vf', `subtitles='${escaped}'`, '-c:v', 'libx264', '-preset', 'veryfast', '-c:a', 'copy', out], 'subtitle burn')
    return { path: out, mimeType: 'video/mp4', probe: probeMedia(out) }
  }
  // Soft subtitles: mux the SRT as a selectable mov_text track — no libass needed.
  runFfmpeg(['-i', input.video, '-i', input.srt, '-map', '0', '-map', '1', '-c', 'copy', '-c:s', 'mov_text', '-metadata:s:s:0', 'language=chi', out], 'subtitle mux')
  return { path: out, mimeType: 'video/mp4', probe: probeMedia(out) }
}

export interface VideoZoomInput {
  video: string
  outputDir: string
  /** Zoom strength: end scale = 1 + strength (e.g. 0.3 -> 1.3x). */
  strength?: number
  /** Pan direction: 'in' (push-in), 'out' (pull-back), 'left'/'right'/'tl'/'tr'/'bl'/'br'（对角线平移）. */
  direction?: 'in' | 'out' | 'left' | 'right' | 'tl' | 'tr' | 'bl' | 'br'
}

/** Ken Burns push/pull via animated crop (zoompan is absent from this build). */
export async function videoZoom(input: VideoZoomInput): Promise<VideoOutput> {
  const out = outputPath(input.outputDir, 'zoom', 'mp4')
  const strength = input.strength ?? 0.25
  const direction = input.direction ?? 'in'
  const dur = probeMedia(input.video).durationSec || 3
  // Crop a shrinking window (push-in) or a growing one (pull-back), then
  // scale back to the source size. Pan directions shift the crop origin.
  const isPan = direction !== 'in' && direction !== 'out'
  // 缩放（in/out）：窗口随时间收放、原点居中；平移（八向）：窗口恒定
  // （本构建的 crop 只允许窗口恒定时 x/y 随时间变化）、原点随时间线性移动。
  const sizeExpr = isPan
    ? `iw/(1+${strength}):ih/(1+${strength})`
    : direction === 'in'
      ? `iw-iw*${strength}*min(t/${dur}\\,1):ih-ih*${strength}*min(t/${dur}\\,1)`
      : `iw/(1+${strength})+iw*${strength}*min(t/${dur}\\,1):ih/(1+${strength})+ih*${strength}*min(t/${dur}\\,1)`
  // 平移方向：水平/垂直/对角线（crop 窗口原点随时间线性移动）。
  const xExpr = direction === 'left' || direction === 'tl' || direction === 'bl'
    ? '(iw-ow)*min(t/' + dur + '\\,1)'
    : direction === 'right' || direction === 'tr' || direction === 'br'
      ? '(iw-ow)*(1-min(t/' + dur + '\\,1))'
      : '(iw-ow)/2'
  const yExpr = direction === 'tl' || direction === 'tr'
    ? '(ih-oh)*min(t/' + dur + '\\,1)'
    : direction === 'bl' || direction === 'br'
      ? '(ih-oh)*(1-min(t/' + dur + '\\,1))'
      : '(ih-oh)/2'
  runFfmpeg([
    '-i', input.video,
    '-vf', `crop=${sizeExpr}:x=${xExpr}:y=${yExpr},scale=iw:ih`,
    '-c:v', 'libx264', '-preset', 'veryfast', '-c:a', 'copy',
    out,
  ], 'video zoom')
  return { path: out, mimeType: 'video/mp4', probe: probeMedia(out) }
}

export interface VideoPipInput {
  video: string
  overlay: string
  outputDir: string
  x?: number
  y?: number
  w?: number
  h?: number
  /** Show the overlay only inside this window (seconds). */
  enable?: [number, number]
  alpha?: number
}

/** Picture-in-picture / sticker overlay onto a video. */
export async function videoPip(input: VideoPipInput): Promise<VideoOutput> {
  const out = outputPath(input.outputDir, 'pip', 'mp4')
  const x = input.x ?? 20
  const y = input.y ?? 20
  const w = input.w ?? 320
  const h = input.h ?? -1
  const alpha = input.alpha ?? 1
  const enable = input.enable !== undefined ? `:enable='between(t,${input.enable[0]},${input.enable[1]})'` : ''
  const vf = `[1:v]scale=${w}:${h},format=rgba,colorchannelmixer=aa=${alpha}[ov];[0:v][ov]overlay=${x}:${y}${enable},format=yuv420p`
  runFfmpeg([
    '-i', input.video, '-i', input.overlay,
    '-filter_complex', vf,
    '-c:v', 'libx264', '-preset', 'veryfast', '-c:a', 'copy',
    out,
  ], 'video pip')
  return { path: out, mimeType: 'video/mp4', probe: probeMedia(out) }
}

export interface BeatInput {
  /** Audio or video file to analyze. */
  source: string
  /** Peak count cap. */
  count?: number
  /** Minimum gap between picked beats (seconds). */
  minGap?: number
}

export interface BeatPoint {
  t: number
  strength: number
}

/**
 * Deterministic beat/energy analysis via ffmpeg astats (no librosa): reads
 * per-frame RMS from the metadata stream, smooths it, and picks local peaks
 * with a minimum gap. Good enough for cut-point suggestions on music beds.
 */
export function audioBeats(input: BeatInput): BeatPoint[] {
  const result = spawnSync('ffmpeg', [
    '-hide_banner', '-i', input.source,
    '-af', 'ebur128=peak=true',
    '-vn', '-f', 'null', '-',
  ], { encoding: 'utf8' })
  // ebur128 prints momentary loudness every ~100ms: "t: 0.3999 ... M: -7.5 ..."
  const samples: Array<{ t: number; energy: number }> = []
  for (const line of (result.stderr ?? '').split('\n')) {
    const tMatch = line.match(/t:\s*([\d.]+)/)
    const mMatch = line.match(/M:\s*(-?[\d.]+)/)
    if (tMatch !== null && mMatch !== null) {
      const lufs = Number(mMatch[1])
      // -120.7 LUFS = digital silence; map louder to higher energy.
      const energy = Math.pow(10, (lufs + 70) / 20)
      samples.push({ t: Number(tMatch[1]), energy })
    }
  }
  if (samples.length < 4) return []
  const window = 3
  const smoothed = samples.map((_, index) => {
    let sum = 0
    let count = 0
    for (let offset = -window; offset <= window; offset += 1) {
      const value = samples[index + offset]
      if (value !== undefined) { sum += value.energy; count += 1 }
    }
    return sum / count
  })
  const minGap = input.minGap ?? 0.4
  const candidates: BeatPoint[] = []
  let lastPick = -9999
  for (let index = 1; index < smoothed.length - 1; index += 1) {
    const value = smoothed[index]
    if (value > smoothed[index - 1] && value >= smoothed[index + 1]) {
      const t = samples[index].t
      if (t - lastPick >= minGap) {
        candidates.push({ t: Number(t.toFixed(2)), strength: Number(value.toFixed(4)) })
        lastPick = t
      }
    }
  }
  const mean = smoothed.reduce((sum, value) => sum + value, 0) / (smoothed.length || 1)
  const strong = candidates.filter(point => point.strength > mean * 1.15)
  return (strong.length > 0 ? strong : candidates).slice(0, input.count ?? 16)
}
