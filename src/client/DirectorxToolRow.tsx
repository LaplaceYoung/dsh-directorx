import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { openEditor } from './editor.ts'

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
}

const card: CSSProperties = {
  border: '1px solid rgba(128, 140, 160, .25)',
  borderRadius: 10,
  padding: 12,
  marginBottom: 10,
  background: 'rgba(255,255,255,.02)',
}

const head: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }
const status: CSSProperties = { fontSize: 12, opacity: .65, whiteSpace: 'nowrap' }
const summary: CSSProperties = { fontSize: 12.5, opacity: .85, marginTop: 6, lineHeight: 1.5, wordBreak: 'break-word' }
const metaLine: CSSProperties = { fontSize: 11.5, opacity: .55, marginTop: 4, wordBreak: 'break-all' }
const mediaBox: CSSProperties = { marginTop: 10 }
const errorText: CSSProperties = { fontSize: 12.5, color: '#ff9b8f', marginTop: 6, wordBreak: 'break-word' }

const IMG: CSSProperties = { display: 'block', maxWidth: '100%', maxHeight: 280, borderRadius: 8, border: '1px solid rgba(128,140,160,.25)' }
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
  if (typeof file.path === 'string' && file.path !== '') return `/directorx/media?path=${encodeURIComponent(file.path)}`
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
  const prompt = typeof args.question === 'string' && args.question !== ''
    ? args.question
    : typeof args.prompt === 'string' ? args.prompt : typeof args.text === 'string' ? args.text : ''
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
        const response = await fetch('/directorx/media/tasks')
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

  const files = result?.files?.slice(0, 4) ?? []
  const details = [
    result?.model !== undefined && result.model !== '' ? result.model : '',
    result?.mode !== undefined && result.mode !== '' ? result.mode : '',
    files.length > 0 ? `${files.length} 个文件` : '',
  ].filter(part => part !== '').join(' · ')

  // Secondary-editing entry: image/video results with a local file open the dock.
  const editableKind = props.toolName === 'directorx_generate_image' ? 'image' : props.toolName === 'directorx_generate_video' ? 'video' : null
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
        <span style={status}>{statusLabel}</span>
      </div>
      {prompt !== '' ? <div style={summary}>{prompt.length > 220 ? `${prompt.slice(0, 220)}…` : prompt}</div> : null}
      {!failed ? (
        <>
          {visionPreview}
          {result?.answer !== undefined && result.answer !== '' ? <div style={summary}>{result.answer.slice(0, 1200)}</div> : null}
          <div style={mediaBox}>
            {files.map((file, index) => <MediaPreview key={index} file={file} fallback={meta.kind} />)}
          </div>
          {editableKind !== null && editablePath !== null ? (
            <button
              style={{ marginTop: 8, padding: '6px 14px', borderRadius: 7, border: '1px solid rgba(128,160,255,.55)', background: 'rgba(80,130,255,.16)', color: 'inherit', fontSize: 12.5, cursor: 'pointer' }}
              onClick={() => openEditor(editableKind, editablePath)}
            >
              ✏️ 编辑（打开右侧面板）
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

export const DIRECTORX_TOOLVIEW_KEYS = ['directorx_view_image', 'directorx_generate_image', 'directorx_generate_video', 'directorx_generate_audio'] as const
