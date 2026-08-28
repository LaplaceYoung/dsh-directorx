import { spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { copyFile, mkdir, readFile, realpath, readdir, rename, rm, stat, writeFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { deflateRawSync } from 'node:zlib'
import { basename, extname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { resolveOutputDir, slugify } from '../support.ts'

export type JianyingFlavor = 'jianying' | 'capcut'
export type JianyingExportMode = 'installed' | 'zip'

export interface JianyingMediaFile {
  /** Path relative to pluginDataRoot, or an absolute local path. */
  srcPath: string
  /** Filename under the draft Resources directory. Basename only. */
  destFileName: string
}

export interface JianyingExportInput {
  draftContent: Record<string, unknown>
  draftMetaInfo: Record<string, unknown>
  mediaFiles?: JianyingMediaFile[]
  outputDir?: string
  /** Staged-media root. Relative srcPath values are resolved here. */
  pluginDataRoot?: string
  flavor?: JianyingFlavor
  /** Explicit draft root; useful for CapCut/custom installations and tests. */
  draftRoot?: string
  /** Force the downloadable archive even when the app is installed. */
  mode?: JianyingExportMode
  /** Ask to launch the app after a successful direct export. Never quits it. */
  open?: boolean
  /** Override detection in a host that already knows the app state. */
  appInstalled?: boolean
  appRunning?: boolean
  /** Explicitly allow creating an absent custom draft root. Inferred roots are never created. */
  createDraftRoot?: boolean
  /** Zip filename stem. Defaults to draft_meta_info.draft_name. */
  archiveName?: string
}

export interface JianyingExportOutput {
  success: true
  mode: JianyingExportMode
  draftPath?: string
  zipPath?: string
  zipRelPath?: string
  zipName?: string
  flavor: JianyingFlavor
  mediaCopied: number
  mediaMissing: string[]
  missingMedia: Array<{ srcPath: string; reason: string }>
  appInstalled: boolean
  appRunning: boolean
  appWasRunning: boolean
  restartRequired: boolean
  needsManualRestart: boolean
  appAction: 'none' | 'opened' | 'open-failed' | 'restart-required' | 'not-installed'
  warnings: string[]
}

export class JianyingExportError extends Error {
  readonly code: 'invalidInput' | 'invalidPath' | 'missingMedia' | 'draftRootNotFound' | 'writeFailed' | 'unsupportedPlatform'
  readonly missingMedia: Array<{ srcPath: string; reason: string }>

  constructor(code: 'invalidInput' | 'invalidPath' | 'missingMedia' | 'draftRootNotFound' | 'writeFailed' | 'unsupportedPlatform', message: string, missingMedia: Array<{ srcPath: string; reason: string }> = []) {
    super(message)
    this.code = code
    this.missingMedia = missingMedia
    this.name = 'JianyingExportError'
  }
}

const SCAFFOLD_SUBDIRS = [
  'adjust_mask',
  'matting',
  'qr_upload',
  'smart_crop',
  'subdraft',
  'common_attachment',
] as const

const APP_NAMES: Record<JianyingFlavor, string[]> = {
  jianying: ['剪映专业版', 'JianyingPro', 'VideoFusion-macOS'],
  capcut: ['CapCut'],
}

const APP_PROCESS: Record<JianyingFlavor, string> = {
  jianying: 'JianyingPro|VideoFusion',
  capcut: 'CapCut',
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let index = 0; index < table.length; index += 1) {
    let value = index
    for (let bit = 0; bit < 8; bit += 1) value = (value & 1) === 0 ? value >>> 1 : (value >>> 1) ^ 0xedb88320
    table[index] = value >>> 0
  }
  return table
})()

function crc32(data: Buffer): number {
  let crc = 0xffffffff
  for (const byte of data) crc = (crc >>> 8) ^ (CRC_TABLE[(crc ^ byte) & 0xff] ?? 0)
  return (crc ^ 0xffffffff) >>> 0
}

function safeDraftName(value: unknown, fallback = 'Clip Studio Export'): string {
  const raw = typeof value === 'string' ? value : fallback
  const safe = raw
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/[\u0000-\u001f]/g, '_')
    .trim()
  return safe === '' ? fallback : safe.slice(0, 160)
}

function isInside(root: string, candidate: string): boolean {
  const base = resolve(root)
  const target = resolve(candidate)
  return target === base || target.startsWith(base + sep)
}

function cloneJson<T extends Record<string, unknown>>(value: T, label: string): T {
  try {
    return JSON.parse(JSON.stringify(value)) as T
  } catch (error) {
    throw new JianyingExportError('invalidInput', `${label} 不是可序列化 JSON：${error instanceof Error ? error.message : String(error)}`)
  }
}

function ensureRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new JianyingExportError('invalidInput', `${label} 必须是 JSON 对象`)
  }
  return value as Record<string, unknown>
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined
}

function draftId(content: Record<string, unknown>, meta: Record<string, unknown>): string {
  const value = asString(content.id) ?? asString(meta.draft_id) ?? randomUUID()
  return value.toUpperCase()
}

function durationMicros(content: Record<string, unknown>, meta: Record<string, unknown>): number {
  const raw = content.duration ?? meta.tm_duration ?? 0
  const value = typeof raw === 'number' ? raw : Number(raw)
  return Number.isFinite(value) && value >= 0 ? Math.round(value) : 0
}

function draftRootFor(flavor: JianyingFlavor): string {
  const home = process.env.HOME ?? process.env.USERPROFILE
  if (typeof home !== 'string' || home === '') {
    throw new JianyingExportError('unsupportedPlatform', '无法确定用户主目录；请显式传入 draftRoot')
  }
  if (process.platform === 'darwin') {
    const appDir = flavor === 'jianying' ? 'JianyingPro' : 'CapCut'
    return join(home, 'Movies', appDir, 'User Data', 'Projects', 'com.lveditor.draft')
  }
  if (process.platform === 'win32') {
    const local = process.env.LOCALAPPDATA
    if (typeof local !== 'string' || local === '') throw new JianyingExportError('unsupportedPlatform', '缺少 LOCALAPPDATA；请显式传入 draftRoot')
    const appDir = flavor === 'jianying' ? 'JianyingPro' : 'CapCut'
    return join(local, appDir, 'User Data', 'Projects', 'com.lveditor.draft')
  }
  throw new JianyingExportError('unsupportedPlatform', `不支持自动定位 ${flavor} 草稿目录（${process.platform}）；请显式传入 draftRoot`)
}

function appInstalled(flavor: JianyingFlavor): boolean {
  if (process.platform === 'darwin') {
    return APP_NAMES[flavor].some(name => spawnSync('open', ['-Ra', name], { stdio: 'ignore' }).status === 0)
  }
  if (process.platform === 'win32') {
    const exe = flavor === 'jianying' ? 'JianyingPro.exe' : 'CapCut.exe'
    const result = spawnSync('where', [exe], { stdio: 'ignore' })
    return result.status === 0
  }
  return false
}

function appRunning(flavor: JianyingFlavor): boolean {
  try {
    if (process.platform === 'darwin') return spawnSync('pgrep', ['-if', APP_PROCESS[flavor]], { stdio: 'ignore' }).status === 0
    if (process.platform === 'win32') {
      const exe = flavor === 'jianying' ? 'JianyingPro.exe' : 'CapCut.exe'
      const result = spawnSync('tasklist', ['/FI', `IMAGENAME eq ${exe}`], { encoding: 'utf8' })
      return result.status === 0 && result.stdout.toLowerCase().includes(exe.toLowerCase())
    }
  } catch {
    return false
  }
  return false
}

function openClient(flavor: JianyingFlavor): boolean {
  try {
    if (process.platform === 'darwin') return APP_NAMES[flavor].some(name => spawnSync('open', ['-a', name], { stdio: 'ignore' }).status === 0)
    if (process.platform === 'win32') return spawnSync('cmd', ['/c', 'start', '', flavor === 'jianying' ? 'JianyingPro.exe' : 'CapCut.exe'], { stdio: 'ignore' }).status === 0
  } catch {
    return false
  }
  return false
}

function safeDestName(value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') throw new JianyingExportError('invalidPath', '素材 destFileName 不能为空')
  const name = value.trim()
  if (isAbsolute(name) || basename(name) !== name || name === '.' || name === '..' || name.includes('..')) {
    throw new JianyingExportError('invalidPath', `素材目标文件名非法（必须是 basename）：${name}`)
  }
  const clean = name.replace(/[\u0000-\u001f]/g, '_')
  if (clean === '' || clean === '.' || clean === '..') throw new JianyingExportError('invalidPath', `素材目标文件名非法：${name}`)
  return clean
}

function sourcePathFor(item: JianyingMediaFile, input: JianyingExportInput, outputDir: string): string {
  if (typeof item.srcPath !== 'string' || item.srcPath.trim() === '') throw new JianyingExportError('invalidPath', '素材 srcPath 不能为空')
  const raw = item.srcPath.trim()
  const root = input.pluginDataRoot !== undefined
    ? resolve(input.pluginDataRoot)
    : resolveOutputDir(outputDir)
  const candidate = isAbsolute(raw) ? resolve(raw) : resolve(root, raw)
  if (!isAbsolute(raw) && !isInside(root, candidate)) throw new JianyingExportError('invalidPath', `素材路径逃逸暂存根目录：${raw}`)
  return candidate
}

interface PreparedMedia {
  item: JianyingMediaFile
  source: string
  destination: string
  destName: string
}

async function prepareMedia(input: JianyingExportInput, outputDir: string, draftDir?: string): Promise<{ prepared: PreparedMedia[]; missing: Array<{ srcPath: string; reason: string }> }> {
  const prepared: PreparedMedia[] = []
  const missing: Array<{ srcPath: string; reason: string }> = []
  const used = new Set<string>()
  for (const rawItem of input.mediaFiles ?? []) {
    const item = ensureRecord(rawItem as unknown, 'mediaFiles 项') as unknown as JianyingMediaFile
    let source: string
    let destName: string
    try {
      source = sourcePathFor(item, input, outputDir)
      destName = safeDestName(item.destFileName)
    } catch (error) {
      missing.push({ srcPath: String(item.srcPath ?? ''), reason: error instanceof Error ? error.message : String(error) })
      continue
    }
    let sourceReal: string
    try {
      sourceReal = await realpath(source)
      const info = await stat(sourceReal)
      if (!info.isFile()) throw new Error('不是普通文件')
    } catch (error) {
      missing.push({ srcPath: item.srcPath, reason: `素材不存在或不可读：${error instanceof Error ? error.message : String(error)}` })
      continue
    }
    const originalStem = basename(destName, extname(destName))
    const extension = extname(destName)
    let finalName = destName
    let suffix = 2
    while (used.has(finalName)) {
      finalName = `${originalStem}_${suffix}${extension}`
      suffix += 1
    }
    used.add(finalName)
    prepared.push({ item, source: sourceReal, destination: draftDir === undefined ? finalName : join(draftDir, 'Resources', finalName), destName: finalName })
  }
  return { prepared, missing }
}

function rewriteMaterialPaths(content: Record<string, unknown>, meta: Record<string, unknown>, pathByName: Record<string, string>): void {
  const materials = content.materials
  if (materials !== null && typeof materials === 'object' && !Array.isArray(materials)) {
    const groups = materials as Record<string, unknown>
    for (const group of ['videos', 'audios']) {
      const entries = groups[group]
      if (!Array.isArray(entries)) continue
      for (const entry of entries) {
        if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) continue
        const item = entry as Record<string, unknown>
        const old = asString(item.path)
        if (old === undefined) continue
        const key = basename(old)
        item.path = pathByName[key] ?? pathByName[old] ?? old
      }
    }
  }
  const materialGroups = meta.draft_materials
  if (!Array.isArray(materialGroups)) return
  for (const group of materialGroups) {
    if (group === null || typeof group !== 'object' || Array.isArray(group)) continue
    const values = (group as Record<string, unknown>).value
    if (!Array.isArray(values)) continue
    for (const value of values) {
      if (value === null || typeof value !== 'object' || Array.isArray(value)) continue
      const item = value as Record<string, unknown>
      const old = asString(item.file_Path)
      if (old === undefined) continue
      const mapped = pathByName[basename(old)] ?? pathByName[old] ?? old
      item.file_Path = mapped
      if (typeof item.extra_info === 'string') item.extra_info = mapped
    }
  }
}

function scaffoldFiles(content: Record<string, unknown>): Array<{ name: string; data: Buffer }> {
  const canvas = content.canvas_config
  const canvasConfig = canvas !== null && typeof canvas === 'object' && !Array.isArray(canvas) ? canvas as Record<string, unknown> : {}
  const height = typeof canvasConfig.height === 'number' && Number.isFinite(canvasConfig.height) ? canvasConfig.height : 1080
  const resolution = height >= 2160 ? 2160 : 1080
  const timelineId = asString(content.id) ?? 'timeline-default'
  const duration = durationMicros(content, {})
  const now = Math.floor(Date.now() / 1000)
  const json = (value: unknown): Buffer => Buffer.from(JSON.stringify(value, null, 2), 'utf8')
  return [
    { name: 'draft_agency_config.json', data: json({ is_auto_agency_enabled: false, is_auto_agency_popup: false, is_single_agency_mode: false, marterials: null, use_converter: false, video_resolution: resolution }) },
    { name: 'draft_biz_config.json', data: json({ timeline_settings: { [timelineId]: { adsorb_enabled: true } } }) },
    { name: 'draft_settings', data: Buffer.from(`[General]\nai_cover_agent_prompt_text=\ncloud_last_modify_platform=mac\ncover_editor_last_seek_time=0\ndraft_create_time=${now}\ndraft_last_edit_time=${now}\nreal_edit_keys=1\nreal_edit_seconds=${Math.round(duration / 1_000_000)}\n`, 'utf8') },
    { name: 'performance_opt_info.json', data: json({ manual_cancle_precombine_segs: null, need_auto_precombine_segs: null }) },
    { name: 'timeline_layout.json', data: json({ activeTimeline: timelineId, dockItems: [{ dockIndex: 0, ratio: 1, timelineIds: [timelineId], timelineNames: ['时间线01'] }], layoutOrientation: 1 }) },
  ]
}

async function atomicWriteJson(path: string, value: unknown): Promise<void> {
  const temp = `${path}.tmp-${process.pid}-${Date.now().toString(36)}`
  await writeFile(temp, JSON.stringify(value, null, 2), 'utf8')
  await rename(temp, path)
}
async function registerRootMeta(draftDir: string, rootDir: string, content: Record<string, unknown>): Promise<void> {
  const rootMetaPath = join(rootDir, 'root_meta_info.json')
  let root: Record<string, unknown> = { all_draft_store: [], draft_ids: 0, root_path: rootDir }
  try {
    const parsed = JSON.parse(await readFile(rootMetaPath, 'utf8')) as unknown
    if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) root = parsed as Record<string, unknown>
  } catch {
    // A first export creates the root metadata atomically.
  }
  const store = Array.isArray(root.all_draft_store) ? root.all_draft_store : []
  let materialsSize = 0
  const resources = join(draftDir, 'Resources')
  try {
    for (const name of await readdir(resources)) {
      try { materialsSize += (await stat(join(resources, name))).size } catch { /* stale entry */ }
    }
  } catch { /* no resources is valid for a text-only draft */ }
  const now = Date.now() * 1000
  const id = draftId(content, {})
  const entry: Record<string, unknown> = {
    cloud_draft_cover: false, cloud_draft_sync: false, draft_cloud_last_action_download: false,
    draft_cloud_purchase_info: '', draft_cloud_template_id: '', draft_cloud_tutorial_info: '', draft_cloud_videocut_purchase_info: '',
    draft_cover: '', draft_fold_path: draftDir, draft_id: id, draft_is_ai_shorts: false, draft_is_cloud_temp_draft: false,
    draft_is_invisible: false, draft_is_web_article_video: false, draft_json_file: join(draftDir, 'draft_info.json'), draft_name: basename(draftDir),
    draft_new_version: '', draft_root_path: rootDir, draft_timeline_materials_size: materialsSize, draft_type: '',
    draft_web_article_video_enter_from: '', streaming_edit_draft_ready: true, tm_draft_cloud_completed: '', tm_draft_cloud_entry_id: -1,
    tm_draft_cloud_modified: now, tm_draft_cloud_parent_entry_id: -1, tm_draft_cloud_space_id: -1, tm_draft_cloud_user_id: -1,
    tm_draft_create: now, tm_draft_modified: now, tm_draft_removed: 0, tm_duration: durationMicros(content, {}),
  }
  const existingIndex = store.findIndex(item => item !== null && typeof item === 'object' && (item as Record<string, unknown>).draft_fold_path === draftDir)
  if (existingIndex >= 0) {
    const previous = store[existingIndex]
    if (previous !== null && typeof previous === 'object' && !Array.isArray(previous)) {
      const previousCreate = (previous as Record<string, unknown>).tm_draft_create
      if (typeof previousCreate === 'number') entry.tm_draft_create = previousCreate
    }
    store[existingIndex] = entry
  } else store.push(entry)
  root.all_draft_store = store
  root.draft_ids = store.length + 1
  root.root_path = root.root_path ?? rootDir
  await atomicWriteJson(rootMetaPath, root)
}

function makeZipEntry(name: string, data: Buffer): { local: Buffer; payload: Buffer; central: Buffer } {
  const nameBytes = Buffer.from(name, 'utf8')
  const payload = data.length === 0 ? data : deflateRawSync(data, { level: 6 })
  const method = data.length === 0 ? 0 : 8
  const crc = crc32(data)
  const local = Buffer.alloc(30 + nameBytes.length)
  local.writeUInt32LE(0x04034b50, 0)
  local.writeUInt16LE(20, 4)
  local.writeUInt16LE(0x800, 6)
  local.writeUInt16LE(method, 8)
  local.writeUInt16LE(0, 10); local.writeUInt16LE(0, 12)
  local.writeUInt32LE(crc, 14); local.writeUInt32LE(payload.length, 18); local.writeUInt32LE(data.length, 22)
  local.writeUInt16LE(nameBytes.length, 26); local.writeUInt16LE(0, 28); nameBytes.copy(local, 30)
  const central = Buffer.alloc(46 + nameBytes.length)
  central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6)
  central.writeUInt16LE(0x800, 8); central.writeUInt16LE(method, 10); central.writeUInt16LE(0, 12); central.writeUInt16LE(0, 14)
  central.writeUInt32LE(crc, 16); central.writeUInt32LE(payload.length, 20); central.writeUInt32LE(data.length, 24)
  central.writeUInt16LE(nameBytes.length, 28); central.writeUInt16LE(0, 30); central.writeUInt16LE(0, 32); central.writeUInt16LE(0, 34)
  central.writeUInt16LE(0, 36); central.writeUInt32LE(0, 38); central.writeUInt32LE(0, 42); nameBytes.copy(central, 46)
  return { local, payload, central }
}

async function writeZip(path: string, entries: Array<{ name: string; data: Buffer }>): Promise<void> {
  const locals: Buffer[] = []
  const centrals: Buffer[] = []
  let offset = 0
  for (const entry of entries) {
    const parts = makeZipEntry(entry.name, entry.data)
    locals.push(Buffer.concat([parts.local, parts.payload]))
    const central = Buffer.from(parts.central)
    central.writeUInt32LE(offset, 42)
    centrals.push(central)
    offset += parts.local.length + parts.payload.length
  }
  const body = Buffer.concat([...locals, ...centrals])
  const centralOffset = offset
  const centralSize = centrals.reduce((sum, item) => sum + item.length, 0)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(0, 4); end.writeUInt16LE(0, 6)
  end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10)
  end.writeUInt32LE(centralSize, 12); end.writeUInt32LE(centralOffset, 16); end.writeUInt16LE(0, 20)
  const temp = `${path}.tmp-${process.pid}-${Date.now().toString(36)}`
  await writeFile(temp, Buffer.concat([body, end]))
  await rename(temp, path)
}

function archiveEntries(
  draftName: string,
  content: Record<string, unknown>,
  meta: Record<string, unknown>,
  prepared: PreparedMedia[],
  missing: Array<{ srcPath: string; reason: string }>,
  flavor: JianyingFlavor,
): Array<{ name: string; data: Buffer }> {
  const prefix = `${draftName}/`
  const json = (value: unknown): Buffer => Buffer.from(JSON.stringify(value, null, 2), 'utf8')
  const entries: Array<{ name: string; data: Buffer }> = [
    { name: `${prefix}draft_info.json`, data: json(content) },
    { name: `${prefix}draft_content.json`, data: json(content) },
    { name: `${prefix}draft_meta_info.json`, data: json(meta) },
  ]
  for (const file of scaffoldFiles(content)) entries.push({ name: `${prefix}${file.name}`, data: file.data })
  for (const subdir of SCAFFOLD_SUBDIRS) entries.push({ name: `${prefix}${subdir}/`, data: Buffer.alloc(0) })
  for (const media of prepared) {
    try {
      entries.push({ name: `${prefix}Resources/${media.destName}`, data: readBuffer(media.source) })
    } catch {
      missing.push({ srcPath: media.item.srcPath, reason: '读取素材失败' })
    }
  }
  const install = {
    schema: 'directorx.jianying-draft-install/v1', version: 1, flavor, draftName,
    draftDirectory: draftName, resourceDirectory: 'Resources',
    draftRootCandidates: flavor === 'jianying'
      ? ['~/Movies/JianyingPro/User Data/Projects/com.lveditor.draft', '%LOCALAPPDATA%/JianyingPro/User Data/Projects/com.lveditor.draft']
      : ['~/Movies/CapCut/User Data/Projects/com.lveditor.draft', '%LOCALAPPDATA%/CapCut/User Data/Projects/com.lveditor.draft'],
    pathRewrite: { content: ['materials.videos[].path', 'materials.audios[].path'], meta: ['draft_materials[].value[].file_Path', 'draft_materials[].value[].extra_info'], relativePrefix: 'Resources/' },
    rootMetaRegistration: true, restartRequiredIfAppRunning: true,
    resources: prepared.map(media => ({ source: media.item.srcPath, file: `Resources/${media.destName}` })),
    missingMedia: missing,
  }
  entries.push({ name: 'install.json', data: json(install) })
  entries.push({ name: '安装说明.txt', data: Buffer.from(`DirectorX ${flavor} 草稿包\n\n解压后将「${draftName}」复制到剪映/CapCut 草稿目录。导入器应读取 install.json，修复 Resources/ 相对路径并注册 root_meta_info.json。若客户端在导出时运行，请完全退出并重新打开以刷新草稿列表。\n`, 'utf8') })
  return entries
}

function readBuffer(path: string): Buffer {
  return readFileSync(path)
}

async function exportZip(input: JianyingExportInput, outputDir: string, flavor: JianyingFlavor, installed: boolean, running: boolean): Promise<JianyingExportOutput> {
  const content = cloneJson(ensureRecord(input.draftContent, 'draftContent'), 'draftContent')
  const meta = cloneJson(ensureRecord(input.draftMetaInfo, 'draftMetaInfo'), 'draftMetaInfo')
  const draftName = safeDraftName(input.archiveName ?? meta.draft_name)
  const preparedResult = await prepareMedia(input, outputDir)
  const missing = [...preparedResult.missing]
  const pathByName: Record<string, string> = {}
  for (const media of preparedResult.prepared) pathByName[basename(media.item.destFileName)] = `Resources/${media.destName}`
  rewriteMaterialPaths(content, meta, pathByName)
  const outRoot = resolveOutputDir(outputDir)
  const archiveDir = join(outRoot, 'jianying-export')
  await mkdir(archiveDir, { recursive: true })
  const zipName = `${slugify(draftName, 80)}.jianying-draft.zip`
  const zipPath = join(archiveDir, zipName)
  const entries = archiveEntries(draftName, content, meta, preparedResult.prepared, missing, flavor)
  await writeZip(zipPath, entries)
  return {
    success: true, mode: 'zip', zipPath, zipRelPath: relative(outRoot, zipPath), zipName, flavor,
    mediaCopied: preparedResult.prepared.length, mediaMissing: missing.map(item => item.srcPath), missingMedia: missing,
    appInstalled: installed, appRunning: running, appWasRunning: running, restartRequired: false, needsManualRestart: false,
    appAction: installed ? 'none' : 'not-installed', warnings: missing.length > 0 ? ['草稿包已生成，但以下素材缺失；请补齐后重新导出。', ...missing.map(item => `${item.srcPath}: ${item.reason}`)] : [],
  }
}

/** Export a Jianying/CapCut draft using only Node filesystem/process APIs. */
export async function exportJianyingDraft(input: JianyingExportInput): Promise<JianyingExportOutput> {
  if (input === null || typeof input !== 'object') throw new JianyingExportError('invalidInput', 'Jianying 导出输入必须是对象')
  const outputDir = input.outputDir ?? 'directorx_output'
  const flavor = input.flavor ?? 'jianying'
  if (flavor !== 'jianying' && flavor !== 'capcut') throw new JianyingExportError('invalidInput', `未知 Jianying flavor：${String(flavor)}`)
  const installed = input.appInstalled ?? (input.draftRoot !== undefined ? true : appInstalled(flavor))
  const running = input.appRunning ?? (installed ? appRunning(flavor) : false)
  if (input.mode === 'zip' || !installed) return exportZip(input, outputDir, flavor, installed, running)
  const inferredRoot = input.draftRoot === undefined
  const root = resolve(input.draftRoot ?? draftRootFor(flavor))
  if (!isAbsolute(root)) throw new JianyingExportError('invalidPath', `draftRoot 必须是绝对路径：${root}`)
  if (!existsSync(root)) {
    if (input.createDraftRoot === true && !inferredRoot) await mkdir(root, { recursive: true })
    else throw new JianyingExportError('draftRootNotFound', `已检测到 ${flavor} 客户端，但草稿目录不存在：${root}。请先打开一次客户端后重试，或显式传入有效 draftRoot`)
  }
  const content = cloneJson(ensureRecord(input.draftContent, 'draftContent'), 'draftContent')
  const meta = cloneJson(ensureRecord(input.draftMetaInfo, 'draftMetaInfo'), 'draftMetaInfo')
  const draftName = safeDraftName(meta.draft_name)
  let draftDir = join(root, draftName)
  let suffix = 2
  while (existsSync(draftDir)) { draftDir = join(root, `${draftName}-${suffix}`); suffix += 1 }
  await mkdir(join(draftDir, 'Resources'), { recursive: true })
  for (const subdir of SCAFFOLD_SUBDIRS) await mkdir(join(draftDir, subdir), { recursive: true })
  const preparedResult = await prepareMedia(input, outputDir, draftDir)
  if (preparedResult.missing.length > 0) {
    await rm(draftDir, { recursive: true, force: true })
    const details = preparedResult.missing.map(item => `${item.srcPath}: ${item.reason}`).join('; ')
    throw new JianyingExportError('missingMedia', `有 ${preparedResult.missing.length} 个素材未能写入剪映草稿：${details}`, preparedResult.missing)
  }
  const pathByName: Record<string, string> = {}
  try {
    for (const media of preparedResult.prepared) {
      if (!isInside(draftDir, media.destination)) throw new JianyingExportError('invalidPath', `素材目标路径逃逸草稿目录：${media.destination}`)
      await copyFile(media.source, media.destination)
      pathByName[basename(media.item.destFileName)] = media.destination
    }
    rewriteMaterialPaths(content, meta, pathByName)
    meta.draft_fold_path = draftDir
    meta.draft_root_path = root
    meta.draft_timeline_materials_size_ = 0
    await writeFile(join(draftDir, 'draft_info.json'), JSON.stringify(content, null, 2), 'utf8')
    await writeFile(join(draftDir, 'draft_content.json'), JSON.stringify(content, null, 2), 'utf8')
    await writeFile(join(draftDir, 'draft_meta_info.json'), JSON.stringify(meta, null, 2), 'utf8')
    for (const file of scaffoldFiles(content)) await writeFile(join(draftDir, file.name), file.data)
    await registerRootMeta(draftDir, root, content)
  } catch (error) {
    await rm(draftDir, { recursive: true, force: true })
    if (error instanceof JianyingExportError) throw error
    throw new JianyingExportError('writeFailed', `写入剪映草稿失败：${error instanceof Error ? error.message : String(error)}`)
  }
  let action: JianyingExportOutput['appAction'] = running ? 'restart-required' : 'none'
  if (input.open === true && !running) action = openClient(flavor) ? 'opened' : 'open-failed'
  return {
    success: true, mode: 'installed', draftPath: draftDir, flavor,
    mediaCopied: preparedResult.prepared.length, mediaMissing: [], missingMedia: [],
    appInstalled: installed, appRunning: running, appWasRunning: running,
    restartRequired: running, needsManualRestart: running, appAction: action,
    warnings: running ? ['客户端在导出期间处于运行状态；未终止客户端，请完全退出并重新打开以刷新草稿列表。'] : [],
  }
}
