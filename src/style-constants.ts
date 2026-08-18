import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { resolveOutputDir } from './support.ts'

/**
 * 项目风格常量锁：camera / palette / lighting / 场景锚点 / 负面基线
 * 一次定义、全片复用——生成提示词里逐字引用这些常量块保持跨镜头一致
 * （跨拍一致性不是靠改提示词，而是靠复用同一段常量文本）。
 */

export interface StyleConstants {
  camera: string
  palette: string
  lighting: string
  sceneAnchors: string[]
  negativeBaseline: string
  at: number
}

export class ProjectStyleStore {
  constructor(private readonly outputDir: string) {}

  private filePath(): string {
    return join(resolveOutputDir(this.outputDir), 'style.json')
  }

  async read(): Promise<StyleConstants | null> {
    try {
      const parsed = JSON.parse(await readFile(this.filePath(), 'utf8')) as StyleConstants
      if (typeof parsed.camera !== 'string') return null
      return parsed
    } catch {
      return null
    }
  }

  async set(input: Partial<Omit<StyleConstants, 'at'>>): Promise<StyleConstants> {
    const current = await this.read()
    const merged: StyleConstants = {
      camera: input.camera ?? current?.camera ?? '',
      palette: input.palette ?? current?.palette ?? '',
      lighting: input.lighting ?? current?.lighting ?? '',
      sceneAnchors: input.sceneAnchors ?? current?.sceneAnchors ?? [],
      negativeBaseline: input.negativeBaseline ?? current?.negativeBaseline ?? '',
      at: Date.now(),
    }
    await mkdir(resolveOutputDir(this.outputDir), { recursive: true })
    await writeFile(this.filePath(), JSON.stringify(merged, null, 2), 'utf8')
    return merged
  }

  /** 生成提示词的常量块（逐字复用）。 */
  block(): string {
    return ''
  }
}

export function formatStyleBlock(style: StyleConstants | null | undefined): string {
  if (style === undefined || style === null) return ''
  return [
    style.camera.trim() !== '' ? `机位：${style.camera.trim()}` : '',
    style.palette.trim() !== '' ? `色板：${style.palette.trim()}` : '',
    style.lighting.trim() !== '' ? `光：${style.lighting.trim()}` : '',
    style.sceneAnchors.length > 0 ? `场景锚：${style.sceneAnchors.join('；')}` : '',
    style.negativeBaseline.trim() !== '' ? `负面：${style.negativeBaseline.trim()}` : '',
  ].filter(item => item !== '').join('\n')
}
