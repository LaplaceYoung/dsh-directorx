import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join } from 'node:path'
import { parseSrt, type SrtCue } from './timeline.ts'
import { resolveMediaPath, resolveOutputDir, slugify } from '../support.ts'

/** Supported sidecar subtitle formats. */
export type SubtitleFormat = 'ass' | 'srt' | 'vtt'

export interface SubtitleSafeArea {
  /** Fraction, percentage, or pixel unit. Fraction is the default. */
  unit?: 'fraction' | 'percent' | 'px'
  top?: number
  right?: number
  bottom?: number
  left?: number
}

export interface SubtitleFormatInput {
  /** SRT file path, or SRT text when it contains a time-arrow block. */
  srt?: string
  /** Explicit source alias for callers that use a generic media input shape. */
  source?: string
  /** Raw SRT content; takes precedence over `srt`/`source`. */
  content?: string
  format: SubtitleFormat
  /** Output root. Generated files never leave this directory. */
  outputDir?: string
  /** Optional output path relative to outputDir, or an absolute path inside it. */
  outputPath?: string
  /** Video dimensions. A `size`/`resolution` WxH string is also accepted. */
  width?: number
  height?: number
  size?: string
  resolution?: string
  safeArea?: SubtitleSafeArea | number
  maxLines?: number
  /** Wire-compatible spelling used by older workflow payloads. */
  max_lines?: number
  unsafeOverride?: boolean
  unsafe_override?: boolean
  /** `true`/`burn` records a burn recommendation for the videoSubtitle seam. */
  burnHint?: boolean | 'burn' | 'soft' | 'sidecar'
  burn_hint?: boolean | 'burn' | 'soft' | 'sidecar'
  fontFamily?: string
  fontSize?: number
}

export interface ResolvedSubtitleSafeArea {
  unit: 'fraction'
  top: number
  right: number
  bottom: number
  left: number
  /** Pixel inset derived from the supplied WxH. */
  pixels: { top: number; right: number; bottom: number; left: number }
}

export interface FormattedSubtitleCue {
  index: number
  start: number
  end: number
  text: string
  lines: string[]
}

export interface SubtitleBurnHint {
  requested: boolean
  mode: 'burn' | 'soft' | 'sidecar'
  /** Input path can be passed directly to videoSubtitle({ srt: path, mode }). */
  subtitlePath: string
}

export interface SubtitleFormatOutput {
  path: string
  format: SubtitleFormat
  content: string
  cues: FormattedSubtitleCue[]
  width: number
  height: number
  safeArea: ResolvedSubtitleSafeArea
  maxLines: number
  burnHint: SubtitleBurnHint
  warnings: string[]
}

export class SubtitleFormatError extends Error {
  readonly code: 'invalidInput' | 'invalidSrt' | 'invalidSize' | 'invalidPath' | 'unsafeArea'

  constructor(code: 'invalidInput' | 'invalidSrt' | 'invalidSize' | 'invalidPath' | 'unsafeArea', message: string) {
    super(message)
    this.code = code
    this.name = 'SubtitleFormatError'
  }
}

const DEFAULT_SIZE = { width: 1920, height: 1080 }
const DEFAULT_SAFE_AREA = { top: 0.08, right: 0.08, bottom: 0.12, left: 0.08 }
const MAX_DIMENSION = 16_384
function finitePositive(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function parseDimensions(input: SubtitleFormatInput): { width: number; height: number } {
  const rawSize = input.size ?? input.resolution
  let width = input.width
  let height = input.height
  if (rawSize !== undefined) {
    if (typeof rawSize !== 'string') throw new SubtitleFormatError('invalidSize', '字幕 WxH 必须是类似 1920x1080 的字符串')
    const match = /^\s*(\d{1,5})\s*[x×:]\s*(\d{1,5})\s*$/.exec(rawSize)
    if (match === null) throw new SubtitleFormatError('invalidSize', `无法解析字幕画布 WxH：${rawSize}`)
    width = Number(match[1])
    height = Number(match[2])
  }
  if (width === undefined && height === undefined) return DEFAULT_SIZE
  if (!finitePositive(width) || !finitePositive(height) || !Number.isInteger(width) || !Number.isInteger(height) || width > MAX_DIMENSION || height > MAX_DIMENSION) {
    throw new SubtitleFormatError('invalidSize', `字幕画布 WxH 必须是 1–${MAX_DIMENSION} 的正整数（收到 ${String(width)}x${String(height)}）`)
  }
  return { width, height }
}

function asFraction(value: number, unit: SubtitleSafeArea['unit'], pixels: number): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new SubtitleFormatError('invalidSize', `safe-area 必须是非负有限数值（收到 ${String(value)}）`)
  }
  if (unit === 'percent' || (unit === undefined && value > 1)) return value / 100
  if (unit === 'px') return value / pixels
  return value
}

function parseSafeArea(raw: SubtitleFormatInput['safeArea'], width: number, height: number): ResolvedSubtitleSafeArea {
  const source = typeof raw === 'number' ? { top: raw, right: raw, bottom: raw, left: raw } : raw ?? DEFAULT_SAFE_AREA
  const unit = typeof raw === 'object' && raw !== null ? raw.unit : undefined
  const top = asFraction(source.top ?? DEFAULT_SAFE_AREA.top, unit, height)
  const right = asFraction(source.right ?? DEFAULT_SAFE_AREA.right, unit, width)
  const bottom = asFraction(source.bottom ?? DEFAULT_SAFE_AREA.bottom, unit, height)
  const left = asFraction(source.left ?? DEFAULT_SAFE_AREA.left, unit, width)
  const values = { top, right, bottom, left }
  for (const [name, value] of Object.entries(values)) {
    if (!Number.isFinite(value) || value < 0 || value >= 0.5) {
      throw new SubtitleFormatError('invalidSize', `safe-area ${name} 必须落在 [0, 0.5) 内（收到 ${value}）`)
    }
  }
  if (left + right >= 1 || top + bottom >= 1) {
    throw new SubtitleFormatError('invalidSize', 'safe-area 左右或上下边距之和必须小于 100%')
  }
  return {
    unit: 'fraction',
    ...values,
    pixels: {
      top: Math.round(top * height),
      right: Math.round(right * width),
      bottom: Math.round(bottom * height),
      left: Math.round(left * width),
    },
  }
}

function resolveSource(input: SubtitleFormatInput, outputDir: string): Promise<string> {
  const raw = input.content ?? input.srt ?? input.source
  if (typeof raw !== 'string' || raw.trim() === '') {
    throw new SubtitleFormatError('invalidInput', '字幕输入为空：请提供 SRT 文本或 .srt 路径')
  }
  if (input.content !== undefined || raw.includes('-->')) return Promise.resolve(raw)
  let path: string
  try {
    path = resolveMediaPath(outputDir, raw)
  } catch (error) {
    throw new SubtitleFormatError('invalidPath', error instanceof Error ? error.message : `SRT 路径非法：${raw}`)
  }
  if (!existsSync(path)) throw new SubtitleFormatError('invalidPath', `找不到 SRT 文件：${raw}`)
  return readFile(path, 'utf8')
}

/**
 * The existing timeline parser intentionally ignores malformed blocks. A
 * formatter is a delivery boundary, so report malformed blocks instead of
 * silently shipping an empty/partial sidecar.
 */
function parseStrictSrt(content: string): SrtCue[] {
  const normalized = content.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim()
  if (normalized === '') throw new SubtitleFormatError('invalidSrt', 'SRT 内容为空')
  const blocks = normalized.split(/\n\s*\n+/).filter(block => block.trim() !== '')
  const malformed: string[] = []
  for (let index = 0; index < blocks.length; index += 1) {
    const lines = (blocks[index] ?? '').trim().split('\n')
    const timeLine = lines[1] ?? ''
    if (lines.length < 3 || !/\d{1,2}:\d{2}:\d{2}[,.]\d{1,3}\s*-->\s*\d{1,2}:\d{2}:\d{2}[,.]\d{1,3}/.test(timeLine)) {
      malformed.push(`第 ${index + 1} 条`)
    }
  }
  const cues = parseSrt(normalized)
  if (malformed.length > 0) {
    throw new SubtitleFormatError('invalidSrt', `SRT 存在格式错误：${malformed.slice(0, 4).join('、')}${malformed.length > 4 ? ` 等 ${malformed.length} 条` : ''}`)
  }
  if (cues.length !== blocks.length || cues.length === 0) {
    throw new SubtitleFormatError('invalidSrt', 'SRT 没有可用字幕 cue（需要序号、时间范围和文本）')
  }
  for (const cue of cues) {
    if (!Number.isFinite(cue.start) || !Number.isFinite(cue.end) || cue.start < 0 || cue.end <= cue.start) {
      throw new SubtitleFormatError('invalidSrt', `SRT 时间范围无效：${cue.start} --> ${cue.end}`)
    }
    if (cue.text.trim() === '') throw new SubtitleFormatError('invalidSrt', `SRT 第 ${cue.index} 条字幕文本为空`)
  }
  return cues
}

function charWidth(char: string, fontSize: number): number {
  const code = char.codePointAt(0) ?? 0
  if (char === '\t') return fontSize * 1.2
  if (/\s/u.test(char)) return fontSize * 0.28
  if ((code >= 0x1100 && code <= 0x11ff)
    || (code >= 0x2e80 && code <= 0x9fff)
    || (code >= 0xac00 && code <= 0xd7af)
    || (code >= 0xf900 && code <= 0xfaff)
    || (code >= 0xff01 && code <= 0xff60)) return fontSize
  if (/[A-Z]/.test(char)) return fontSize * 0.64
  if (/[a-z0-9]/.test(char)) return fontSize * 0.56
  return fontSize * 0.52
}

function textWidth(text: string, fontSize: number): number {
  let width = 0
  for (const char of text) width += charWidth(char, fontSize)
  return width
}

function wrapParagraph(paragraph: string, maxWidth: number, fontSize: number): string[] {
  const source = paragraph.trim()
  if (source === '') return ['']
  const lines: string[] = []
  let line = ''
  const flush = (): void => {
    const value = line.trim()
    if (value !== '') lines.push(value)
    line = ''
  }
  // Word-aware tokenization for English, with character fallback for CJK and
  // overlong URLs/words. This keeps normal English words intact without
  // sacrificing deterministic wrapping for mixed Chinese/Latin captions.
  const tokens = /\s+/u.test(source) ? source.split(/(\s+)/u).filter(Boolean) : [...source]
  for (const token of tokens) {
    const candidate = line + token
    if (line !== '' && textWidth(candidate, fontSize) > maxWidth) {
      flush()
      if (textWidth(token.trim(), fontSize) > maxWidth && token.trim() !== '') {
        let piece = ''
        for (const char of [...token.trim()]) {
          if (piece !== '' && textWidth(piece + char, fontSize) > maxWidth) {
            lines.push(piece)
            piece = ''
          }
          piece += char
        }
        line = piece
      } else {
        line = token.trimStart()
      }
    } else {
      line = candidate
    }
  }
  flush()
  return lines.length > 0 ? lines : ['']
}

function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .split(/\r?\n/u)
    .flatMap(paragraph => wrapParagraph(paragraph, maxWidth, fontSize))
}

function srtTimestamp(seconds: number): string {
  const totalMillis = Math.max(0, Math.round(seconds * 1000))
  const hours = Math.floor(totalMillis / 3_600_000)
  const minuteMillis = totalMillis % 3_600_000
  const minutes = Math.floor(minuteMillis / 60_000)
  const secondMillis = minuteMillis % 60_000
  const whole = Math.floor(secondMillis / 1000)
  const millis = secondMillis % 1000
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(whole).padStart(2, '0')},${String(millis).padStart(3, '0')}`
}

function vttTimestamp(seconds: number): string {
  return srtTimestamp(seconds).replace(',', '.')
}

function assTimestamp(seconds: number): string {
  const totalCentis = Math.max(0, Math.round(seconds * 100))
  const hours = Math.floor(totalCentis / 360_000)
  const minuteCentis = totalCentis % 360_000
  const minutes = Math.floor(minuteCentis / 6_000)
  const secondCentis = minuteCentis % 6_000
  const whole = Math.floor(secondCentis / 100)
  const centis = secondCentis % 100
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(whole).padStart(2, '0')}.${String(centis).padStart(2, '0')}`
}

function assText(lines: string[]): string {
  const slash = String.fromCharCode(92)
  return lines.map(line => line.replaceAll(slash, slash + slash).replaceAll('{', slash + '{').replaceAll('}', slash + '}')).join(slash + 'N')
}

function renderSrt(cues: FormattedSubtitleCue[]): string {
  return `${cues.map((cue, position) => [
    String(position + 1),
    `${srtTimestamp(cue.start)} --> ${srtTimestamp(cue.end)}`,
    cue.lines.join('\n'),
  ].join('\n')).join('\n\n')}\n`
}

function renderVtt(cues: FormattedSubtitleCue[], safeArea: ResolvedSubtitleSafeArea): string {
  const line = (100 - safeArea.bottom * 100).toFixed(2).replace(/\.00$/, '')
  const position = '50'
  const size = ((1 - safeArea.left - safeArea.right) * 100).toFixed(2).replace(/\.00$/, '')
  return `WEBVTT\n\n${cues.map((cue, positionIndex) => [
    String(positionIndex + 1),
    `${vttTimestamp(cue.start)} --> ${vttTimestamp(cue.end)} line:${line}% position:${position}% size:${size}% align:center`,
    cue.lines.join('\n'),
  ].join('\n')).join('\n\n')}\n`
}


function renderAss(cues: FormattedSubtitleCue[], width: number, height: number, safeArea: ResolvedSubtitleSafeArea, fontFamily: string, fontSize: number): string {
  const styleName = 'DirectorX'
  const primary = '&H00FFFFFF'
  const outline = '&H00000000'
  const back = '&H99000000'
  const marginL = safeArea.pixels.left
  const marginR = safeArea.pixels.right
  const marginV = safeArea.pixels.bottom
  const header = [
    '[Script Info]',
    'ScriptType: v4.00+',
    'WrapStyle: 2',
    'ScaledBorderAndShadow: yes',
    `PlayResX: ${width}`,
    `PlayResY: ${height}`,
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    `Style: ${styleName},${fontFamily},${fontSize},${primary},${primary},${outline},${back},0,0,0,0,100,100,0,0,1,2,1,2,${marginL},${marginR},${marginV},1`,
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, Effect, Text',
  ]
  const events = cues.map(cue => `Dialogue: 0,${assTimestamp(cue.start)},${assTimestamp(cue.end)},${styleName},,0,0,,${assText(cue.lines)}`)
  const newline = String.fromCharCode(10)
  return `${[...header, ...events].join(newline)}${newline}`
}

function outputPathFor(input: SubtitleFormatInput, outputDir: string, format: SubtitleFormat, sourceLabel: string): string {
  const candidate = input.outputPath
    ?? join('subtitles', `${slugify(basename(sourceLabel, extname(sourceLabel)) || 'subtitle', 48)}-${Date.now().toString(36)}.${format}`)
  try {
    return resolveMediaPath(outputDir, candidate)
  } catch (error) {
    throw new SubtitleFormatError('invalidPath', error instanceof Error ? error.message : `字幕输出路径非法：${candidate}`)
  }
}

function parseFormat(value: unknown): SubtitleFormat {
  const format = String(value ?? '').toLowerCase()
  if (format === 'ass' || format === 'srt' || format === 'vtt') return format
  throw new SubtitleFormatError('invalidInput', `不支持字幕格式 ${format || '<empty>'}，可选 ass、srt、vtt`)
}

/** Convert an SRT sidecar to ASS, SRT, or WebVTT and write it under outputDir. */
export async function formatSubtitles(input: SubtitleFormatInput): Promise<SubtitleFormatOutput> {
  if (input === null || typeof input !== 'object') throw new SubtitleFormatError('invalidInput', '字幕格式化输入必须是对象')
  const format = parseFormat(input.format)
  const outputDir = input.outputDir ?? 'directorx_output'
  const sourceValue = input.content ?? input.srt ?? input.source ?? 'subtitle'
  const sourceLabel = input.srt !== undefined && !sourceValue.includes('-->') ? sourceValue : 'subtitle'
  const source = await resolveSource(input, outputDir)
  const parsed = parseStrictSrt(source)
  const { width, height } = parseDimensions(input)
  const safeArea = parseSafeArea(input.safeArea, width, height)
  const maxLinesRaw = input.maxLines ?? input.max_lines ?? 2
  const maxLines = typeof maxLinesRaw === 'number' && Number.isInteger(maxLinesRaw) && maxLinesRaw > 0 && maxLinesRaw <= 12
    ? maxLinesRaw
    : (() => { throw new SubtitleFormatError('invalidInput', `max_lines 必须是 1–12 的正整数（收到 ${String(maxLinesRaw)}）`) })()
  const unsafeOverride = input.unsafeOverride === true || input.unsafe_override === true
  const fontSizeRaw = input.fontSize ?? Math.round(width / 1920 * 56)
  const fontSize = finitePositive(fontSizeRaw) ? Math.min(256, Math.max(8, fontSizeRaw)) : (() => { throw new SubtitleFormatError('invalidInput', `fontSize 必须是正数（收到 ${String(fontSizeRaw)}）`) })()
  const maxWidth = width * (1 - safeArea.left - safeArea.right)
  const warnings: string[] = []
  const cues: FormattedSubtitleCue[] = []
  for (const cue of parsed) {
    const lines = wrapText(cue.text, maxWidth, fontSize)
    if (lines.length > maxLines && !unsafeOverride) {
      throw new SubtitleFormatError('unsafeArea', `字幕第 ${cue.index} 条折行后有 ${lines.length} 行，超过 max_lines=${maxLines}；如确需越界请显式设置 unsafe_override=true`)
    }
    if (lines.length > maxLines) warnings.push(`字幕第 ${cue.index} 条超过 max_lines=${maxLines}（unsafe_override=true，保留 ${lines.length} 行）`)
    cues.push({ index: cue.index, start: cue.start, end: cue.end, text: cue.text, lines })
  }
  const content = format === 'ass'
    ? renderAss(cues, width, height, safeArea, input.fontFamily?.trim() || 'Arial', fontSize)
    : format === 'vtt' ? renderVtt(cues, safeArea) : renderSrt(cues)
  const path = outputPathFor(input, outputDir, format, sourceLabel)
  await mkdir(resolveOutputDir(outputDir), { recursive: true })
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, content, 'utf8')
  const requested = input.burnHint ?? input.burn_hint
  const mode = requested === true || requested === 'burn' ? 'burn' : requested === 'soft' ? 'soft' : 'sidecar'
  if (mode === 'burn' && format === 'vtt') warnings.push('VTT 不能直接作为 ffmpeg subtitles 输入；burn_hint=burn 时优先选择 ASS')
  return {
    path,
    format,
    content,
    cues,
    width,
    height,
    safeArea,
    maxLines,
    burnHint: { requested: requested !== undefined && requested !== false, mode, subtitlePath: path },
    warnings,
  }
}
