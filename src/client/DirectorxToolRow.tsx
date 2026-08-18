import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { openEditor } from './editor.ts'
import { withProject } from './stage/project.ts'

/**
 * Web UI tool card for DirectorX generation calls, registered under the
 * keyed `tool.call.toolview` slot (one key per wire tool name). The card
 * shows the prompt while running and, once settled, renders each produced
 * media file inline: images, videos, and audio all display through the
 * host's `/directorx/media` route.
 *
 * The row is a pure projection of the frozen call slice — no Host imports,
 * no remote namespaces. Every field is optional at runtime because the row
 * may replay older logged calls whose shape predates a schema change.
 */

interface RowBlock {
  kind?: string
  callId?: string
  name?: string
  argsRaw?: string
  call?: { name?: string; argsRaw?: string } | null
  content?: ReadonlyArray<{ type?: string; text?: string }>
  isError?: boolean
  error?: { name?: string; code?: string }
}

interface TaskRow { taskId: string; prompt: string; state: string }

const TASK_STATE_LABEL: Record<string, string> = {
  submitted: '已提交排队',
  succeeded: '已完成',
  failed: '失败',
  cancelled: '已取消',
}

interface MediaFile {
  path?: string
  url?: string
  mimeType?: string
}

interface ToolResultJson {
  model?: string
  prompt?: string
  text?: string
  status?: string
  mode?: string
  files?: MediaFile[]
  answer?: string
  source?: string
  srt?: string
  format?: string
  durationSec?: number
  sizeBytes?: number
  streams?: Array<Record<string, unknown>>
  tasks?: Array<{ taskId?: string; state?: string; model?: string; at?: number }>
  task?: { taskId?: string; state?: string; model?: string; at?: number }
  task_id?: string
  edits?: Array<{ path?: string; name?: string; mediaType?: string; bytes?: number }>
  canvasTitle?: string
  nodeCount?: number
  nodeId?: string
  summary?: string[]
  path?: string
  look?: string
  openStudio?: boolean
  kind?: string
}

interface DirectorxToolRowProps {
  toolName: string
  block: RowBlock
  cwd?: string
}

type MediaKind = 'image' | 'video' | 'audio'

interface ToolMeta {
  title: string
  kind: MediaKind
}

const META: Record<string, ToolMeta> = {
  directorx_view_image: { title: '看图 · Vision', kind: 'image' },
  directorx_generate_image: { title: '生成图像 · Image', kind: 'image' },
  directorx_generate_video: { title: '生成视频 · Video', kind: 'video' },
  directorx_generate_audio: { title: '生成音频 · Audio', kind: 'audio' },
  directorx_transcribe_audio: { title: '音频转写 · Transcribe', kind: 'audio' },
  directorx_probe_media: { title: '媒体探测 · Probe', kind: 'video' },
  directorx_extract_frames: { title: '抽帧 · Frames', kind: 'image' },
  directorx_task_status: { title: '任务状态 · Tasks', kind: 'video' },
  directorx_cancel_task: { title: '取消任务 · Cancel', kind: 'video' },
  directorx_edits: { title: '编辑产物 · Edits', kind: 'image' },
  directorx_edit_plan: { title: '编辑路由 · Plan', kind: 'image' },
  directorx_image_edit: { title: '图片编辑 · Image edit', kind: 'image' },
  directorx_edit: { title: '剪辑 · Edit', kind: 'video' },
  directorx_video_process: { title: '视频处理 · Process', kind: 'video' },
  directorx_canvas_intents: { title: '画布指令 · Intent', kind: 'image' },
  directorx_canvas_intent_ack: { title: '画布回执 · Ack', kind: 'image' },
  directorx_canvas_continue: { title: '画布续写 · Continue', kind: 'image' },
  directorx_canvas_add: { title: '画布加点 · Add', kind: 'image' },
  directorx_canvas_connect: { title: '画布连线 · Connect', kind: 'image' },
  directorx_canvas_get: { title: '画布读取 · Get', kind: 'image' },
  directorx_canvas_shotlist: { title: '镜头表 · Shotlist', kind: 'image' },
  directorx_canvas_update: { title: '画布更新 · Update', kind: 'image' },
  directorx_canvas_batch: { title: '画布批量 · Batch', kind: 'image' },
  directorx_canvas_pack: { title: '画布拼成片 · Pack', kind: 'video' },
  directorx_canvas_sheet: { title: '画布接触表 · Sheet', kind: 'image' },
  directorx_canvas_split: { title: '画布宫格切开 · Split', kind: 'image' },
  directorx_canvas_join: { title: '画布宫格拼回 · Join', kind: 'image' },
  directorx_canvas_stack: { title: '画布分屏对照 · Stack', kind: 'video' },
  directorx_canvas_desub: { title: '画布去硬字 · Desub', kind: 'video' },
  directorx_canvas_extend: { title: '画布续写位 · Extend', kind: 'video' },
  directorx_canvas_gif: { title: '画布导出动图 · GIF', kind: 'image' },
  directorx_series: { title: '系列包 · Series', kind: 'image' },
  directorx_revise: { title: '只改这一镜 · Revise', kind: 'image' },
  directorx_blocking: { title: '场面控制表 · Blocking', kind: 'image' },
  directorx_studio: { title: '编辑台 · Studio', kind: 'image' },
  directorx_skill_search: { title: '检索技能 · Skills', kind: 'image' },
  directorx_skill_route: { title: '技能路由 · Route', kind: 'image' },
  directorx_skill_read: { title: '读技能 · Skill', kind: 'image' },
  directorx_prompt_plan: { title: '提示词编排 · Plan', kind: 'image' },
  directorx_ip_scan: { title: '版权扫描 · IP', kind: 'image' },
  directorx_ip_rewrite: { title: '版权改写 · IP', kind: 'image' },
}

const card: CSSProperties = {
  border: '1px solid var(--dsw-alias-border-l1)',
  borderRadius: 10,
  padding: 12,
  marginBottom: 10,
  background: 'var(--dsw-alias-bg-layer-1)',
}

const head: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }
const statusBase: CSSProperties = { fontSize: 11.5, whiteSpace: 'nowrap', padding: '2px 9px', borderRadius: 999, border: '1px solid var(--dsw-alias-border-l1)', color: 'var(--dsw-alias-label-secondary)', background: 'var(--dsw-alias-bg-layer-1)' }
const statusRunning: CSSProperties = { ...statusBase, color: 'var(--dsw-alias-state-business-primary, #4f9dff)', border: '1px solid rgba(79,157,255,.4)' }
const statusFailed: CSSProperties = { ...statusBase, color: 'var(--dsw-alias-state-error-primary, #f0a3a3)', border: '1px solid rgba(240,163,163,.4)' }
const statusDone: CSSProperties = { ...statusBase, color: 'var(--dsw-alias-state-success-primary, #86d993)', border: '1px solid rgba(134,217,147,.35)' }
const summary: CSSProperties = { fontSize: 12.5, opacity: .85, marginTop: 6, lineHeight: 1.5, wordBreak: 'break-word' }
const metaLine: CSSProperties = { fontSize: 11.5, opacity: .55, marginTop: 4, wordBreak: 'break-all' }
const mediaBox: CSSProperties = { marginTop: 10 }
const errorText: CSSProperties = { fontSize: 12.5, color: 'var(--dsw-alias-state-error-primary, #ff9b8f)', marginTop: 6, wordBreak: 'break-word' }

const IMG: CSSProperties = { display: 'block', maxWidth: '100%', maxHeight: 280, borderRadius: 8, border: '1px solid var(--dsw-alias-border-l1)' }
const VIDEO: CSSProperties = { display: 'block', width: '100%', maxWidth: 480, maxHeight: 300, borderRadius: 8, background: '#000' }
const AUDIO: CSSProperties = { display: 'block', width: '100%', maxWidth: 480, marginTop: 4 }
const LINK: CSSProperties = { fontSize: 12, opacity: .8, wordBreak: 'break-all' }

function parseArgs(raw: string | undefined): Record<string, unknown> {
  if (raw === undefined || raw === '') return {}
  try {
    const parsed = JSON.parse(raw) as unknown
    return typeof parsed === 'object' && parsed !== null ? parsed as Record<string, unknown> : {}
  } catch {
    return {}
  }
}

function argsOf(block: RowBlock): Record<string, unknown> {
  return parseArgs(block.argsRaw ?? block.call?.argsRaw)
}

function textContentOf(block: RowBlock): string {
  const parts: string[] = []
  for (const item of block.content ?? []) {
    if (item.type === 'text' && typeof item.text === 'string') parts.push(item.text)
  }
  return parts.join('\n')
}

function resultOf(block: RowBlock): ToolResultJson | null {
  const text = textContentOf(block)
  if (text === '') return null
  try {
    const parsed = JSON.parse(text) as unknown
    return typeof parsed === 'object' && parsed !== null ? parsed as ToolResultJson : null
  } catch {
    return null
  }
}

/** Browser-resolvable source for one media file: http(s)/data URLs directly, local paths through the host route. */
function mediaSrc(file: MediaFile): string | undefined {
  if (typeof file.url === 'string' && (/^https?:\/\//i.test(file.url) || /^data:/i.test(file.url))) return file.url
  if (typeof file.path === 'string' && file.path !== '') {
    return withProject(`/directorx/media?path=${encodeURIComponent(file.path)}`)
  }
  return undefined
}

function kindOf(file: MediaFile, fallback: MediaKind): MediaKind {
  const mime = file.mimeType ?? ''
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('audio/')) return 'audio'
  if (mime.startsWith('image/')) return 'image'
  return fallback
}

function MediaPreview({ file, fallback }: { file: MediaFile; fallback: MediaKind }): ReactNode {
  const src = mediaSrc(file)
  const label = file.path ?? file.url ?? ''
  if (src === undefined) {
    return <div style={LINK}>输出文件：{label}</div>
  }
  const kind = kindOf(file, fallback)
  if (kind === 'image') {
    return (
      <a href={src} target="_blank" rel="noreferrer" style={{ display: 'inline-block' }}>
        <img src={src} alt={label} style={IMG} />
      </a>
    )
  }
  if (kind === 'video') {
    return (
      <div>
        <video src={src} controls preload="metadata" style={VIDEO} />
        <div style={LINK}><a href={src} target="_blank" rel="noreferrer">在浏览器中打开</a></div>
      </div>
    )
  }
  return (
    <div>
      <audio src={src} controls preload="metadata" style={AUDIO} />
    </div>
  )
}

const kvRow: CSSProperties = { display: 'grid', gridTemplateColumns: '92px 1fr', gap: '2px 10px', fontSize: 12, marginTop: 6, alignItems: 'baseline' }
const kvLabel: CSSProperties = { opacity: .55 }
const thumbGrid: CSSProperties = { display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }
const thumb: CSSProperties = { width: 132, height: 74, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--dsw-alias-border-l1)', display: 'block' }
const itemRow: CSSProperties = { fontSize: 12, marginBottom: 6, wordBreak: 'break-all', opacity: .88 }

function fmtBytesLocal(bytes: number | undefined): string {
  if (bytes === undefined) return '—'
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`
}

/** Frame grid for directorx_extract_frames: thumbnails served by the media route. */
function FramesGrid({ files }: { files: MediaFile[] }): ReactNode {
  return (
    <div style={thumbGrid}>
      {files.slice(0, 12).map((file, index) => {
        const src = mediaSrc(file)
        return src !== undefined
          ? <a key={index} href={src} target="_blank" rel="noreferrer"><img src={src} alt={file.path ?? `frame-${index}`} style={thumb} /></a>
          : <div key={index} style={LINK}>{file.path}</div>
      })}
    </div>
  )
}

/** Transcript + subtitle files for directorx_transcribe_audio. */
function TranscribeBody({ result }: { result: ToolResultJson }): ReactNode {
  const srtFiles = (result.files ?? []).filter(file => file.mimeType === 'application/x-subrip')
  const otherFiles = (result.files ?? []).filter(file => file.mimeType !== 'application/x-subrip')
  return (
    <>
      {typeof result.text === 'string' && result.text !== '' ? (
        <div style={summary}>{result.text.slice(0, 900)}{result.text.length > 900 ? '…' : ''}</div>
      ) : null}
      {result.srt !== undefined && result.srt !== '' ? (
        <div style={summary}>{String(result.srt).slice(0, 400)}{String(result.srt).length > 400 ? '…' : ''}</div>
      ) : null}
      {srtFiles.map((file, index) => <div key={index} style={LINK}>字幕文件：{file.path}</div>)}
      {otherFiles.map((file, index) => <div key={index} style={LINK}>文本文件：{file.path}</div>)}
    </>
  )
}

/** Metadata table for directorx_probe_media. */
function ProbeBody({ result }: { result: ToolResultJson }): ReactNode {
  const streams = Array.isArray(result.streams) ? result.streams : []
  return (
    <div>
      <div style={kvRow}><span style={kvLabel}>容器</span><span>{result.format ?? '—'}</span></div>
      <div style={kvRow}><span style={kvLabel}>时长</span><span>{result.durationSec !== undefined ? `${result.durationSec.toFixed(2)}s` : '—'}</span></div>
      <div style={kvRow}><span style={kvLabel}>大小</span><span>{fmtBytesLocal(result.sizeBytes)}</span></div>
      <div style={kvRow}><span style={kvLabel}>流</span><span>
        {streams.map((stream, index) => {
          const parts = [String(stream.type ?? ''), String(stream.codec ?? '')].filter(part => part !== '')
          if (stream.width !== undefined && stream.height !== undefined) parts.push(`${stream.width}×${stream.height}`)
          if (stream.fps !== undefined) parts.push(`${stream.fps} fps`)
          return <div key={index}>{parts.join(' · ')}</div>
        })}
      </span></div>
    </div>
  )
}

/** Task state rows for directorx_task_status / directorx_cancel_task. */
function TaskRows({ result }: { result: ToolResultJson }): ReactNode {
  const tasks = Array.isArray(result.tasks)
    ? result.tasks
    : result.task !== undefined ? [result.task] : []
  return (
    <div style={{ marginTop: 6 }}>
      {tasks.map((task, index) => (
        <div key={index} style={itemRow}>
          <span style={{ fontWeight: 600 }}>{TASK_STATE_LABEL[task.state ?? ''] ?? task.state ?? '—'}</span>
          {' · '}{task.taskId ?? result.task_id ?? ''}
          {task.model !== undefined && task.model !== '' ? ` · ${task.model}` : ''}
        </div>
      ))}
      {tasks.length === 0 ? <div style={itemRow}>无任务记录</div> : null}
    </div>
  )
}

/** Edit ledger rows for directorx_edits. */
function EditsBody({ result }: { result: ToolResultJson }): ReactNode {
  const edits = Array.isArray(result.edits) ? result.edits : []
  return (
    <div style={{ marginTop: 6 }}>
      {edits.map((edit, index) => (
        <div key={index} style={itemRow}>
          <span style={{ fontWeight: 600 }}>{edit.name ?? edit.path?.split('/').pop()}</span>
          {' · '}{fmtBytesLocal(edit.bytes)}
          {typeof edit.path === 'string' ? <div style={{ opacity: .55 }}>{edit.path}</div> : null}
        </div>
      ))}
      {edits.length === 0 ? <div style={itemRow}>还没有编辑产物。在生成卡片上点「编辑」，保存后会出现在这里。</div> : null}
    </div>
  )
}

/**
 * Keyed atomic tool view for the three DirectorX generation tools.
 * Running calls show the prompt; settled calls render the generated media.
 */
export function DirectorxToolRow(props: DirectorxToolRowProps): ReactNode {
  const meta = META[props.toolName]
  if (meta === undefined) return null

  const block = props.block
  const settled = block.kind === 'tool-result'
  const args = argsOf(block)
  const result = useMemo(() => (settled ? resultOf(block) : null), [block])
  const isSpecial = props.toolName === 'directorx_transcribe_audio'
    || props.toolName === 'directorx_probe_media'
    || props.toolName === 'directorx_extract_frames'
    || props.toolName === 'directorx_task_status'
    || props.toolName === 'directorx_cancel_task'
    || props.toolName === 'directorx_edits'
  const prompt = typeof args.question === 'string' && args.question !== ''
    ? args.question
    : typeof args.prompt === 'string' ? args.prompt
      : typeof args.source === 'string' ? args.source
        : typeof args.task_id === 'string' ? args.task_id
          : typeof args.text === 'string' ? args.text : ''
  const failed = settled && (block.isError === true || (result === null && textContentOf(block) !== ''))

  // Live task progress: while a video generation call runs, poll the host
  // task ledger and surface the matching task's state on the card.
  const [taskState, setTaskState] = useState<string | undefined>(undefined)
  useEffect(() => {
    if (props.toolName !== 'directorx_generate_video' || settled || prompt === '') return
    let live = true
    let timer: number | undefined
    const poll = async () => {
      try {
        const response = await fetch(withProject('/directorx/media/tasks'))
        if (!response.ok) return
        const data = await response.json() as { tasks: TaskRow[] }
        const match = data.tasks.find(task => typeof task.prompt === 'string' && (task.prompt === prompt || prompt.includes(task.prompt)))
        if (live && match !== undefined) setTaskState(match.state)
      } catch {
        // Ledger polling is best-effort; the card falls back to its own state.
      }
    }
    void poll()
    timer = window.setInterval(() => { void poll() }, 3000)
    return () => {
      live = false
      if (timer !== undefined) window.clearInterval(timer)
    }
  }, [props.toolName, settled, prompt])

  useEffect(() => {
    if (!settled || result === null || result.openStudio !== true || typeof result.path !== 'string' || result.path === '') return
    openEditor(result.kind === 'video' ? 'video' : 'image', result.path, result.look !== undefined ? { look: result.look } : undefined)
  }, [settled, result])

  const files = result?.files?.slice(0, 4) ?? (typeof result?.path === 'string' && result.path !== '' ? [{ path: result.path }] : [])
  const details = [
    result?.model !== undefined && result.model !== '' ? result.model : '',
    result?.mode !== undefined && result.mode !== '' ? result.mode : '',
    files.length > 0 ? `${files.length} 个文件` : '',
  ].filter(part => part !== '').join(' · ')

  // Secondary-editing entry: image/video results with a local file open the dock.
  const editableKind = props.toolName === 'directorx_generate_image' || props.toolName === 'directorx_image_edit' || (props.toolName === 'directorx_studio' && result?.kind !== 'video')
    ? 'image'
    : props.toolName === 'directorx_generate_video' || props.toolName === 'directorx_edit' || props.toolName === 'directorx_video_process' || (props.toolName === 'directorx_studio' && result?.kind === 'video')
      ? 'video'
      : null
  const editablePath = editableKind !== null && typeof files[0]?.path === 'string' && files[0].path !== '' ? files[0].path : null

  let statusLabel = '进行中…'
  if (failed) statusLabel = '失败'
  else if (settled) statusLabel = result?.status ?? '完成'
  else if (taskState !== undefined) statusLabel = `生成中…（${TASK_STATE_LABEL[taskState] ?? taskState}）`

  // Vision answers render as body text; a browser-resolvable source shows inline.
  const visionSource = props.toolName === 'directorx_view_image' && result?.source !== undefined
    ? result.source
    : undefined
  const visionPreview = visionSource !== undefined && (/^https?:\/\//i.test(visionSource) || /^data:/i.test(visionSource))
    ? <a href={visionSource} target="_blank" rel="noreferrer" style={{ display: 'inline-block' }}><img src={visionSource} alt={visionSource} style={IMG} /></a>
    : null

  return (
    <div style={card}>
      <div style={head}>
        <strong style={{ fontSize: 13 }}>{meta.title}</strong>
        <span style={failed ? statusFailed : settled ? statusDone : statusRunning}>{statusLabel}</span>
      </div>
      {prompt !== '' ? <div style={summary}>{prompt.length > 220 ? `${prompt.slice(0, 220)}…` : prompt}</div> : null}
      {!failed ? (
        <>
          {visionPreview}
          {result?.answer !== undefined && result.answer !== '' ? <div style={summary}>{result.answer.slice(0, 1200)}</div> : null}
          {isSpecial && result !== null ? (
            <div style={mediaBox}>
              {props.toolName === 'directorx_transcribe_audio' ? <TranscribeBody result={result} /> : null}
              {props.toolName === 'directorx_probe_media' ? <ProbeBody result={result} /> : null}
              {props.toolName === 'directorx_extract_frames' ? <FramesGrid files={result.files ?? []} /> : null}
              {props.toolName === 'directorx_task_status' || props.toolName === 'directorx_cancel_task' ? <TaskRows result={result} /> : null}
              {props.toolName === 'directorx_edits' ? <EditsBody result={result} /> : null}
            </div>
          ) : (
            <div style={mediaBox}>
              {files.map((file, index) => <MediaPreview key={index} file={file} fallback={meta.kind} />)}
              {files.length === 0 && result !== null && props.toolName.startsWith('directorx_canvas_') ? (
                <div style={summary}>
                  {[
                    typeof result.canvasTitle === 'string' ? result.canvasTitle : '',
                    result.nodeCount !== undefined ? `${String(result.nodeCount)} 节点` : '',
                    typeof result.nodeId === 'string' ? `node ${result.nodeId}` : '',
                    Array.isArray(result.summary) ? result.summary.slice(0, 4).join(' · ') : '',
                  ].filter(part => part !== '').join(' · ') || textContentOf(block).slice(0, 240)}
                </div>
              ) : null}
            </div>
          )}
          {editableKind !== null && editablePath !== null ? (
            <button
              style={{ marginTop: 8, padding: '6px 14px', borderRadius: 7, border: '1px solid var(--dsw-alias-brand-primary)', background: 'transparent', color: 'var(--dsw-alias-label-primary)', fontSize: 12.5, cursor: 'pointer' }}
              onClick={() => openEditor(editableKind, editablePath)}
            >
              在画布中编辑
            </button>
          ) : null}
        </>
      ) : (
        <div style={errorText}>
          {block.error?.code !== undefined && block.error.code !== '' ? `${block.error.code}: ` : ''}
          {textContentOf(block).slice(0, 400) || '生成失败'}
        </div>
      )}
      {details !== '' ? <div style={metaLine}>{details}</div> : null}
    </div>
  )
}

export const DIRECTORX_TOOLVIEW_KEYS = [
  'directorx_view_image',
  'directorx_generate_image',
  'directorx_generate_video',
  'directorx_generate_audio',
  'directorx_transcribe_audio',
  'directorx_probe_media',
  'directorx_extract_frames',
  'directorx_task_status',
  'directorx_cancel_task',
  'directorx_edits',
  'directorx_edit_plan',
  'directorx_image_edit',
  'directorx_edit',
  'directorx_video_process',
  'directorx_canvas_intents',
  'directorx_canvas_intent_ack',
  'directorx_canvas_continue',
  'directorx_canvas_add',
  'directorx_canvas_connect',
  'directorx_canvas_get',
  'directorx_canvas_shotlist',
  'directorx_canvas_update',
  'directorx_canvas_batch',
  'directorx_studio',
  'directorx_skill_search',
  'directorx_skill_route',
  'directorx_skill_read',
] as const
