import { DirectorxCanvasStore, type CanvasDocument } from './canvas.ts'
import { applyAutolink, type AutolinkHit } from './canvas-autolink.ts'
import { applyFrameStrip } from './canvas-frames.ts'
import { applyCanvasPack } from './canvas-pack.ts'
import { applyVideoParse } from './canvas-parse.ts'
import { applyReshootAssemble, applyReshootCut, type ReshootJob } from './canvas-reshoot.ts'
import { applyScriptRows, type ScriptBeat } from './canvas-script.ts'
import { applyCanvasSheet, applyGridSplit } from './canvas-sheet.ts'
import { applyDesub, applyExtendCut, applyGifExport, applyGridJoin, applySplitScreen } from './canvas-board.ts'
import type { DirectorxSettings } from './config.ts'
import type { ShotSegment } from './providers/video-analyze.ts'

export type CanvasCraftAction = 'script' | 'frames' | 'autolink' | 'parse' | 'reshoot' | 'pack' | 'sheet' | 'split' | 'join' | 'stack' | 'desub' | 'extend' | 'gif'

export interface CanvasCraftInput {
  outputDir: string
  action: CanvasCraftAction
  nodeId?: string
  text?: string
  count?: number
  nodeIds?: string[]
  arrange?: boolean
  describe?: boolean
  preview?: boolean
  shots?: ShotSegment[]
  start?: number
  end?: number
  prompt?: string
  phase?: 'cut' | 'assemble'
  settings?: DirectorxSettings
  transition?: 'cut' | 'fade'
  fadeSec?: number
  columns?: number
  cols?: number
  rows?: number
  numbered?: boolean
  layout?: '2x1' | '1x2' | '2x2'
  method?: 'crop' | 'blur'
  region?: string
}

export interface CanvasCraftResult {
  ok: true
  action: CanvasCraftAction
  reused?: boolean
  sourceId?: string
  beats?: ScriptBeat[]
  added?: AutolinkHit[]
  skipped?: number
  files?: string[]
  nodeIds?: string[]
  groupIds?: string[]
  groupId?: string
  scriptId?: string
  script?: string
  shots?: ShotSegment[]
  preview?: boolean
  phase?: 'cut' | 'assemble'
  midId?: string
  resultId?: string
  firstId?: string
  lastId?: string
  start?: number
  end?: number
  durationSec?: number
  prompt?: string
  path?: string
  job?: ReshootJob
  sourceIds?: string[]
  updatedAt: number
  doc: CanvasDocument
}

const CRAFT_ACTIONS: CanvasCraftAction[] = ['script', 'frames', 'autolink', 'parse', 'reshoot', 'pack', 'sheet', 'split', 'join', 'stack', 'desub', 'extend', 'gif']

export function parseCraftAction(value: unknown): CanvasCraftAction {
  if (typeof value === 'string' && (CRAFT_ACTIONS as string[]).includes(value)) return value as CanvasCraftAction
  throw new Error('action 必须是 script / frames / autolink / parse / reshoot / pack / sheet / split / join / stack / desub / extend / gif')
}

export async function runCanvasCraft(input: CanvasCraftInput): Promise<CanvasCraftResult> {
  const store = new DirectorxCanvasStore(input.outputDir)
  const action = input.action
  let result: Omit<CanvasCraftResult, 'ok' | 'updatedAt'>
  if (action === 'script') {
    const applied = await applyScriptRows({
      store,
      ...(typeof input.text === 'string' ? { text: input.text } : {}),
      ...(typeof input.nodeId === 'string' ? { nodeId: input.nodeId } : {}),
    })
    result = {
      action: 'script',
      reused: applied.reused,
      sourceId: applied.sourceId,
      beats: applied.beats,
      nodeIds: applied.nodeIds,
      groupIds: applied.groupIds,
      doc: applied.doc,
    }
  } else if (action === 'frames') {
    if (typeof input.nodeId !== 'string' || input.nodeId === '') throw new Error('抽帧上板需要 nodeId')
    const applied = await applyFrameStrip({
      store,
      outputDir: input.outputDir,
      nodeId: input.nodeId,
      ...(typeof input.count === 'number' ? { count: input.count } : {}),
    })
    result = {
      action: 'frames',
      reused: applied.reused,
      sourceId: applied.sourceId,
      files: applied.files,
      nodeIds: applied.nodeIds,
      ...(applied.groupId !== undefined ? { groupId: applied.groupId } : {}),
      doc: applied.doc,
    }
  } else if (action === 'parse') {
    if (typeof input.nodeId !== 'string' || input.nodeId === '') throw new Error('一键解析需要 nodeId')
    const applied = await applyVideoParse({
      store,
      outputDir: input.outputDir,
      nodeId: input.nodeId,
      ...(input.describe === true ? { describe: true } : {}),
      ...(input.preview === true ? { preview: true } : {}),
      ...(input.shots !== undefined ? { shots: input.shots } : {}),
      ...(input.settings !== undefined ? { settings: input.settings } : {}),
    })
    result = {
      action: 'parse',
      reused: applied.reused,
      ...(applied.preview === true ? { preview: true } : {}),
      sourceId: applied.sourceId,
      shots: applied.shots,
      script: applied.script,
      nodeIds: applied.nodeIds,
      ...(applied.groupId !== undefined ? { groupId: applied.groupId } : {}),
      ...(applied.scriptId !== undefined ? { scriptId: applied.scriptId } : {}),
      doc: applied.doc,
    }
  } else if (action === 'reshoot') {
    if (typeof input.nodeId !== 'string' || input.nodeId === '') throw new Error('片段重做需要 nodeId')
    if (input.phase === 'assemble') {
      const applied = await applyReshootAssemble({
        store,
        outputDir: input.outputDir,
        nodeId: input.nodeId,
      })
      result = {
        action: 'reshoot',
        phase: 'assemble',
        sourceId: applied.sourceId,
        midId: applied.midId,
        resultId: applied.resultId,
        path: applied.path,
        doc: applied.doc,
      }
    } else {
      if (typeof input.start !== 'number' || typeof input.end !== 'number') {
        throw new Error('片段重做需要 start / end（秒）')
      }
      const applied = await applyReshootCut({
        store,
        outputDir: input.outputDir,
        nodeId: input.nodeId,
        start: input.start,
        end: input.end,
        ...(typeof input.prompt === 'string' ? { prompt: input.prompt } : {}),
      })
      result = {
        action: 'reshoot',
        phase: 'cut',
        sourceId: applied.sourceId,
        midId: applied.midId,
        resultId: applied.resultId,
        firstId: applied.firstId,
        lastId: applied.lastId,
        start: applied.start,
        end: applied.end,
        durationSec: applied.durationSec,
        prompt: applied.prompt,
        job: applied.job,
        doc: applied.doc,
      }
    }
  } else if (action === 'pack') {
    const applied = await applyCanvasPack({
      store,
      outputDir: input.outputDir,
      ...(input.nodeIds !== undefined ? { nodeIds: input.nodeIds } : typeof input.nodeId === 'string' ? { nodeIds: [input.nodeId] } : {}),
      ...(input.transition === 'fade' || input.transition === 'cut' ? { transition: input.transition } : {}),
      ...(typeof input.fadeSec === 'number' ? { fadeSec: input.fadeSec } : {}),
    })
    result = {
      action: 'pack',
      path: applied.path,
      resultId: applied.resultId,
      sourceIds: applied.sourceIds,
      doc: applied.doc,
    }
  } else if (action === 'sheet') {
    const applied = await applyCanvasSheet({
      store,
      outputDir: input.outputDir,
      ...(input.nodeIds !== undefined ? { nodeIds: input.nodeIds } : typeof input.nodeId === 'string' ? { nodeIds: [input.nodeId] } : {}),
      ...(typeof input.columns === 'number' ? { columns: input.columns } : {}),
    })
    result = {
      action: 'sheet',
      path: applied.path,
      resultId: applied.resultId,
      sourceIds: applied.sourceIds,
      doc: applied.doc,
    }
  } else if (action === 'split') {
    if (typeof input.nodeId !== 'string' || input.nodeId === '') throw new Error('宫格切开需要 nodeId')
    const applied = await applyGridSplit({
      store,
      outputDir: input.outputDir,
      nodeId: input.nodeId,
      ...(typeof input.cols === 'number' ? { cols: input.cols } : {}),
      ...(typeof input.rows === 'number' ? { rows: input.rows } : {}),
    })
    result = {
      action: 'split',
      files: applied.files,
      nodeIds: applied.nodeIds,
      groupId: applied.groupId,
      doc: applied.doc,
    }
  } else if (action === 'join') {
    const applied = await applyGridJoin({
      store,
      outputDir: input.outputDir,
      ...(input.nodeIds !== undefined ? { nodeIds: input.nodeIds } : typeof input.nodeId === 'string' ? { nodeIds: [input.nodeId] } : {}),
      ...(typeof input.columns === 'number' ? { columns: input.columns } : {}),
      ...(input.numbered === false ? { numbered: false } : {}),
    })
    result = {
      action: 'join',
      path: applied.path,
      resultId: applied.resultId,
      sourceIds: applied.sourceIds,
      doc: applied.doc,
    }
  } else if (action === 'stack') {
    const applied = await applySplitScreen({
      store,
      outputDir: input.outputDir,
      ...(input.nodeIds !== undefined ? { nodeIds: input.nodeIds } : typeof input.nodeId === 'string' ? { nodeIds: [input.nodeId] } : {}),
      ...(input.layout === '2x1' || input.layout === '1x2' || input.layout === '2x2' ? { layout: input.layout } : {}),
    })
    result = {
      action: 'stack',
      path: applied.path,
      resultId: applied.resultId,
      sourceIds: applied.sourceIds,
      doc: applied.doc,
    }
  } else if (action === 'desub') {
    if (typeof input.nodeId !== 'string' || input.nodeId === '') throw new Error('去硬字需要 nodeId')
    const applied = await applyDesub({
      store,
      outputDir: input.outputDir,
      nodeId: input.nodeId,
      ...(input.method === 'crop' || input.method === 'blur' ? { method: input.method } : {}),
      ...(typeof input.region === 'string' ? { region: input.region } : {}),
    })
    result = {
      action: 'desub',
      path: applied.path,
      resultId: applied.resultId,
      sourceId: applied.sourceId,
      doc: applied.doc,
    }
  } else if (action === 'extend') {
    if (typeof input.nodeId !== 'string' || input.nodeId === '') throw new Error('续写位需要 nodeId')
    const applied = await applyExtendCut({
      store,
      outputDir: input.outputDir,
      nodeId: input.nodeId,
      ...(typeof input.prompt === 'string' ? { prompt: input.prompt } : {}),
    })
    result = {
      action: 'extend',
      sourceId: applied.sourceId,
      firstId: applied.firstId,
      resultId: applied.resultId,
      path: applied.path,
      doc: applied.doc,
    }
  } else if (action === 'gif') {
    if (typeof input.nodeId !== 'string' || input.nodeId === '') throw new Error('导出动图需要 nodeId')
    const applied = await applyGifExport({
      store,
      outputDir: input.outputDir,
      nodeId: input.nodeId,
    })
    result = {
      action: 'gif',
      path: applied.path,
      resultId: applied.resultId,
      sourceId: applied.sourceId,
      doc: applied.doc,
    }
  } else {
    const applied = await applyAutolink({
      store,
      outputDir: input.outputDir,
      ...(input.nodeIds !== undefined ? { nodeIds: input.nodeIds } : typeof input.nodeId === 'string' ? { nodeIds: [input.nodeId] } : {}),
    })
    result = {
      action: 'autolink',
      added: applied.added,
      skipped: applied.skipped,
      doc: applied.doc,
    }
  }
  const skipArrange = action === 'autolink' || action === 'parse' || action === 'reshoot' || action === 'pack' || action === 'sheet' || action === 'split' || action === 'join' || action === 'stack' || action === 'desub' || action === 'extend' || action === 'gif'
  const shouldArrange = input.arrange === true || (input.arrange !== false && !skipArrange)
  const doc = shouldArrange ? await store.arrange('grid') : result.doc
  return { ok: true, ...result, doc, updatedAt: doc.updatedAt }
}
