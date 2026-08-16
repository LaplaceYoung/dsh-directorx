import { spawnSync } from 'node:child_process'
import { join, resolve } from 'node:path'
import { extractFrames, probeMedia } from './ffmpeg.ts'
import { ensureOutputDir } from '../support.ts'

/**
 * 接触表（contact sheet）：素材盘点用的胶片带——每个片段在源窗口
 * 中点抽一帧，tile 成 4 列蒙太奇单图，一眼看完所有候选片段。
 */

export interface ContactSheetInput {
  sources: string[]
  outputDir: string
  columns?: number
}

export interface ContactSheetOutput {
  path: string
  frames: Array<{ source: string; t: number; framePath: string }>
  columns: number
}

export async function contactSheet(input: ContactSheetInput): Promise<ContactSheetOutput> {
  if (input.sources.length === 0) throw new Error('contact sheet needs at least one source')
  const columns = Math.min(8, Math.max(2, input.columns ?? 4))
  await ensureOutputDir(input.outputDir)

  const frames: Array<{ source: string; t: number; framePath: string }> = []
  for (const source of input.sources) {
    const probe = probeMedia(source)
    const duration = probe.durationSec ?? 0
    const midpoint = Number((duration / 2).toFixed(2))
    const extracted = await extractFrames(source, input.outputDir, { at: [midpoint] })
    const framePath = extracted[0]?.path
    if (framePath !== undefined) frames.push({ source, t: midpoint, framePath })
  }
  if (frames.length === 0) throw new Error('没有抽到任何帧（检查素材是否可读）')

  const out = join(resolve(process.cwd(), input.outputDir), `contact-sheet-${Date.now().toString(36)}.png`)
  const rows = Math.ceil(frames.length / columns)
  const args: string[] = ['-hide_banner', '-y']
  for (const frame of frames) args.push('-i', frame.framePath)
  // 每行 hstack 拼列，再 vstack 拼行（tile 是单输入滤镜，不适用多输入）。
  const parts: string[] = []
  frames.forEach((_, index) => {
    parts.push(`[${index}:v]scale=320:180:force_original_aspect_ratio=decrease,pad=320:180:(ow-iw)/2:(oh-ih)/2[f${index}]`)
  })
  const rowLabels: string[] = []
  for (let row = 0; row < rows; row += 1) {
    const rowFrames = frames.slice(row * columns, row * columns + columns)
    const inputs = rowFrames.map((_, index) => `[f${row * columns + index}]`).join('')
    const label = `[row${row}]`
    if (rowFrames.length === columns) parts.push(`${inputs}hstack=inputs=${columns}${label}`)
    else {
      const colorLabels: string[] = []
      for (let extra = rowFrames.length; extra < columns; extra += 1) {
        parts.push(`color=black:s=320x180[c${row}x${extra}]`)
        colorLabels.push(`[c${row}x${extra}]`)
      }
      parts.push(`${inputs}${colorLabels.join('')}hstack=inputs=${columns}${label}`)
    }
    rowLabels.push(label)
  }
  if (rowLabels.length === 1) parts.push(`${rowLabels[0]}null[out]`)
  else parts.push(`${rowLabels.join('')}vstack=inputs=${rowLabels.length}[out]`)
  const filterComplex = parts.join(';')
  args.push('-filter_complex', filterComplex, '-map', '[out]', '-frames:v', '1', out)
  const result = spawnSync('ffmpeg', args, { encoding: 'utf8' })
  if (result.status !== 0) throw new Error(`contact sheet failed: ${result.stderr?.slice(-300)}`)

  return { path: out, frames, columns }
}
