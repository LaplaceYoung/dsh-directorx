import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { dx, dxChrome, dxGhostBtn, dxPill } from '../canvas-theme.ts'
import { IconClose, IconLeave, IconSend, IconStop } from './icons.tsx'
import { MarkdownView } from './MarkdownView.tsx'
import {
  errorMessage, foldSessionHistory, rpcOk, sessionRunningFromList, sessionTextNeedsFold,
  type SessionClient, type SessionFold,
} from './session-fold.ts'
import {
  answerApproval, answerQuestion, cancelQuestion, dockItemsFromSnapshot, linesFromFold,
  resolveLiveSession,
  type AskItem, type AskWait, type ApprovalWait, type DockLine, type LiveWait,
} from './session-live.ts'
import { mediaFromToolResult, type SessionMedia } from './session-media.ts'
import { mediaUrl } from './nodes.tsx'

export type { SessionClient }

export interface SessionDockProps {
  sessionId?: string
  sessions?: SessionClient
  liveSessions?: unknown
  open: boolean
  onOpenChange: (open: boolean) => void
  hidden?: boolean
  inspectorOpen?: boolean
  pulse?: number
  onEnsureSession?: () => Promise<string>
  onNewSession?: () => Promise<string>
  onLeave?: () => void
  selectedNode?: { id: string; label: string; kind?: string; path?: string }
  onClearSelected?: () => void
  onAddMedia?: (media: SessionMedia) => void
}

const POLL_OPEN_MS = 1400
const POLL_RUN_MS = 500
const POLL_FAB_MS = 3200

export function SessionDock(props: SessionDockProps): ReactNode {
  const [fold, setFold] = useState<SessionFold>({ lines: [], running: false, blocked: false })
  const [listRunning, setListRunning] = useState(false)
  const [liveTick, setLiveTick] = useState(0)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [loadError, setLoadError] = useState<string | undefined>()
  const [expandedLines, setExpandedLines] = useState<Set<string>>(() => new Set())
  const [confirmFirst, setConfirmFirst] = useState(false)
  const [starting, setStarting] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const foldRef = useRef(fold)
  foldRef.current = fold

  const live = resolveLiveSession(props.liveSessions, props.sessionId)
  const liveModel = live === undefined ? undefined : dockItemsFromSnapshot(live.getSnapshot())
  void liveTick

  useEffect(() => {
    if (live === undefined) return
    void live.open?.()
    return live.subscribe(() => setLiveTick(tick => tick + 1))
  }, [live])

  const liveReady = liveModel?.ready === true
  const running = (liveReady ? liveModel.running : fold.running) || listRunning
  const lines: DockLine[] = liveReady ? liveModel.lines : linesFromFold(fold.lines)
  const waits = liveReady ? liveModel.waits : []
  const blocked = !liveReady && fold.blocked && waits.length === 0

  const refreshHistory = useCallback(async (sessionId = props.sessionId) => {
    if (resolveLiveSession(props.liveSessions, sessionId) !== undefined) return
    const history = props.sessions?.history
    if (history === undefined || sessionId === undefined || sessionId === '') {
      setFold({ lines: [], running: false, blocked: false })
      return
    }
    try {
      const response = await history({ sessionId, maxMessages: 80 })
      const parsed = rpcOk<unknown>(response)
      if (!parsed.ok) {
        setLoadError(parsed.message)
        return
      }
      setLoadError(undefined)
      setFold(foldSessionHistory(parsed.value))
    } catch (cause) {
      setLoadError(cause instanceof Error ? cause.message : String(cause))
    }
  }, [props.liveSessions, props.sessionId, props.sessions])

  const refreshRunning = useCallback(async () => {
    const list = props.sessions?.list
    const sessionId = props.sessionId
    if (list === undefined || sessionId === undefined || sessionId === '') return
    try {
      const response = await list()
      const flag = sessionRunningFromList(response, sessionId)
      if (flag !== undefined) setListRunning(flag)
    } catch {
      // FAB pulse is advisory.
    }
  }, [props.sessionId, props.sessions])

  useEffect(() => {
    if (props.hidden === true) return
    if (props.open) void refreshHistory()
    void refreshRunning()
  }, [props.hidden, props.open, props.pulse, refreshHistory, refreshRunning])

  useEffect(() => {
    if (props.hidden === true || liveReady) return
    const ms = props.open ? (running ? POLL_RUN_MS : POLL_OPEN_MS) : POLL_FAB_MS
    const timer = window.setInterval(() => {
      if (props.open) void refreshHistory()
      else void refreshRunning()
    }, ms)
    return () => window.clearInterval(timer)
  }, [liveReady, props.hidden, props.open, refreshHistory, refreshRunning, running])

  useEffect(() => {
    const node = logRef.current
    if (node === undefined || node === null) return
    node.scrollTop = node.scrollHeight
  }, [lines.length, lines.at(-1)?.text, props.open, waits.length])

  useEffect(() => {
    if (props.open && props.hidden !== true) inputRef.current?.focus()
  }, [props.open, props.hidden])

  useEffect(() => {
    if (props.hidden === true) return
    const onKey = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'j') return
      event.preventDefault()
      props.onOpenChange(!props.open)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [props.hidden, props.open, props.onOpenChange])

  const sendText = useCallback(async (raw: string) => {
    const text = raw.trim()
    if (text === '' || busy) return
    setBusy(true)
    try {
      const sessionId = props.sessionId !== undefined && props.sessionId !== ''
        ? props.sessionId
        : await props.onEnsureSession?.()
      if (sessionId === undefined || sessionId === '') throw new Error('这个工作区还没有 DSH 会话')
      const face = resolveLiveSession(props.liveSessions, sessionId)
      if (text.startsWith('/') && face?.command !== undefined) {
        const result = await face.command(text)
        throwIfRejected(result, '命令未执行')
        setListRunning(true)
        return
      }
      const chip = props.selectedNode
      const gated = confirmFirst
        ? `本条按「手动确认」：先 directorx_confirm / directorx_propose，等我确认后再生成。\n${text}`
        : text
      const payload = chip === undefined
        ? gated
        : `[画布节点 ${chip.id}${chip.label !== '' ? ` ${chip.label}` : ''}]\n${gated}`
      const mode = (face !== undefined ? liveModel?.running : foldRef.current.running) === true ? 'steer' : 'queue'
      if (face?.prompt !== undefined) {
        const result = await face.prompt([{ type: 'text', text: payload }], mode)
        throwIfRejected(result, 'DSH 未接受')
      } else {
        const prompt = props.sessions?.prompt
        if (prompt === undefined) throw new Error('当前无法连接 DSH 会话接口')
        const response = await prompt({
          sessionId,
          mode,
          content: [{ type: 'text', text: payload }],
        })
        const parsed = rpcOk<unknown>(response)
        if (!parsed.ok) throw new Error(parsed.message)
      }
      setListRunning(true)
      await refreshHistory(sessionId)
    } catch (cause) {
      setLoadError(errorMessage(cause instanceof Error ? cause.message : cause))
      throw cause
    } finally {
      setBusy(false)
    }
  }, [busy, confirmFirst, liveModel?.running, props.liveSessions, props.onEnsureSession, props.selectedNode, props.sessionId, props.sessions, refreshHistory])

  const send = useCallback(async () => {
    const text = draft.trim()
    if (text === '') return
    setDraft('')
    try {
      await sendText(text)
    } catch {
      setDraft(text)
    }
  }, [draft, sendText])

  const startNew = useCallback(async () => {
    if (starting || props.onNewSession === undefined) return
    setStarting(true)
    setLoadError(undefined)
    try {
      const id = await props.onNewSession()
      setExpandedLines(new Set())
      setDraft('')
      setListRunning(false)
      if (id === '') throw new Error('无法创建新会话')
    } catch (cause) {
      setLoadError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setStarting(false)
    }
  }, [props, starting])

  const stop = useCallback(async () => {
    const sessionId = props.sessionId
    try {
      if (live?.cancel !== undefined) {
        const result = await live.cancel()
        throwIfRejected(result, '停止失败')
      } else {
        const cancel = props.sessions?.cancel
        if (cancel === undefined || sessionId === undefined || sessionId === '') return
        await cancel({ sessionId })
      }
      setListRunning(false)
      await refreshHistory()
    } catch (cause) {
      setLoadError(cause instanceof Error ? cause.message : String(cause))
    }
  }, [live, props.sessionId, props.sessions, refreshHistory])

  if (props.hidden === true) return null

  const missing = props.sessions?.prompt === undefined && live?.prompt === undefined
  const noSession = props.sessionId === undefined || props.sessionId === ''

  return (
    <>
      <style>{SESSION_CSS}</style>
      {props.open ? (
        <SessionPanel
          inspectorOpen={props.inspectorOpen === true}
          lines={lines}
          waits={waits}
          running={running}
          blocked={blocked}
          error={loadError}
          expandedLines={expandedLines}
          onToggleLine={id => setExpandedLines(current => {
            const next = new Set(current)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
          })}
          noSession={noSession}
          missing={missing}
          draft={draft}
          busy={busy}
          logRef={logRef}
          inputRef={inputRef}
          onDraft={setDraft}
          onSend={() => { void send() }}
          onStop={() => { void stop() }}
          onClose={() => props.onOpenChange(false)}
          onLeave={props.onLeave}
          onNewSession={props.onNewSession === undefined ? undefined : () => { void startNew() }}
          starting={starting}
          selectedNode={props.selectedNode}
          onClearSelected={props.onClearSelected}
          onAddMedia={props.onAddMedia}
          confirmFirst={confirmFirst}
          onConfirmFirst={setConfirmFirst}
          onChip={text => { void sendText(text).catch(() => {}) }}
        />
      ) : (
        <button
          type="button"
          data-dx-session-fab=""
          data-running={running || undefined}
          className="dx-hit dx-session-fab"
          title="打开 DSH 会话 ⌘J"
          data-tip="DSH 会话 ⌘J"
          onClick={() => props.onOpenChange(true)}
          style={fabStyle}
        >
          <img src="/favicon.svg" width={24} height={24} alt="" draggable={false} />
          {running ? <span className="dx-dot" style={{ position: 'absolute', top: 7, right: 7 }} /> : null}
        </button>
      )}
    </>
  )
}

function throwIfRejected(result: unknown, fallback: string): void {
  if (result === null || typeof result !== 'object') return
  const rec = result as Record<string, unknown>
  if (rec.ok === false) {
    const error = rec.error !== null && typeof rec.error === 'object'
      ? rec.error as Record<string, unknown>
      : undefined
    throw new Error(typeof error?.message === 'string' && error.message !== '' ? error.message : fallback)
  }
  const nested = rec.result !== null && typeof rec.result === 'object' ? rec.result as Record<string, unknown> : undefined
  if (nested?.ok === false) {
    const error = nested.error !== null && typeof nested.error === 'object'
      ? nested.error as Record<string, unknown>
      : undefined
    throw new Error(typeof error?.message === 'string' && error.message !== '' ? error.message : fallback)
  }
}

const SESSION_CHIPS = [
  {
    label: '检索导演知识',
    text: '请用 directorx_skill_route 或 directorx_knowledge_search 检索与当前画布相关的导演知识。对 route.articles 和命中里的 id 做 directorx_knowledge_read，对命中里的 skills 做 directorx_skill_read。不要另起一套检索词，不要生成媒体。',
  },
  {
    label: '进入视频工作坊',
    text: '请调用 directorx_creative_suite action:workshop-step workshopStep:script，以当前项目进入六步视频工作坊：剧本→拆解→资产→镜头提示词→生成→交付。先只返回当前步骤、检查项和建议下一步，不生成媒体。',
  },
  {
    label: '分析参考视频',
    text: '请先 directorx_media_scene_split 从我提供或当前选中的视频提取最多 12 个检查帧，再 directorx_video_understand 做时间线、镜头、声音和节奏分析。把分析要点钉到画布，不生成媒体。',
  },
  {
    label: '一键粗剪',
    text: '请对当前选中的视频调用 directorx_media_auto_cut。若已有 SRT 和口播稿就按脚本精剪；否则先读取媒体时长，再问我保留的起止区间。完成后把输出加入画布。',
  },
  {
    label: '一键交付',
    text: '请对当前成片调用 directorx_media_package，生成 15 秒预告和封面；再用 directorx_creative_suite action:copy-harness kind:commercial 取得写作约束，并为目标平台提出 3 个标题。把全部交付物加入画布并用 directorx_stage 记录 deliver。',
  },
  {
    label: '检索导演技能',
    text: '请用 directorx_skill_route 对当前画布或我的上一句做技能与工具路由，再 directorx_skill_read 列出的每个技能全文，按返回的 next 调用工具。不要只看目录摘要，不要生成。',
  },
  {
    label: '继续当前画布',
    text: '请用 directorx_canvas_intents { claim: true } 领取待办。生成条里的字只是意图：先 directorx_skill_route，再 skill_read 与 knowledge_read，必要时外部调研，再 directorx_prompt_craft，严格/协同再 propose/confirm，最后带 craftId 生成。不要把原句丢给 generate。',
  },
  {
    label: '整理当前分镜',
    text: '请用 directorx_canvas_shotlist 和 directorx_canvas_summary 整理当前画布分镜，必要时 directorx_brief。不要生成媒体。',
  },
  {
    label: '画布工具',
    text: '请按当前选中节点做画布工具：文本用 directorx_canvas_script 生成分镜（本→首帧→视频）；视频用 directorx_canvas_frames 提取帧，或 directorx_canvas_parse 智能解析成切点分镜稿；局部重绘用 directorx_canvas_reshoot cut，中段生成后再 assemble。多选视频用 directorx_canvas_pack 合成视频；多选图/视频用 directorx_canvas_sheet 出九宫格；单张图用 directorx_canvas_split 拆分宫格；多张图用 directorx_canvas_join 合并宫格；2–4 路用 directorx_canvas_stack 分屏；硬字幕用 directorx_canvas_desub 去字幕；延长用 directorx_canvas_extend 切出尾帧空卡；评审动图用 directorx_canvas_gif。然后再 directorx_canvas_autolink 自动连线。切窗/解析/铺行/拼接/切开/拼回/分屏/去字幕/延长/动图不要生成。',
  },
  {
    label: '打开编辑台',
    text: '请对当前选中的画布节点调用 directorx_studio。若我提到了色调或风格，按该描述调色后打开对应编辑工作台；否则只打开编辑台。调色后把新路径写回该节点。不要用生成模型重绘来完成调色。',
  },
  {
    label: '精剪当前镜头',
    text: '请对当前选中的画布节点先 directorx_edit_plan，再按路由调用对应确定性编辑工具（directorx_image_edit / directorx_video_process / directorx_edit / directorx_studio）。必须带 nodeId 回写路径。不要用生成模型重绘来裁切、旋转、调色或变速。做完后 extract_frames + view_image 质检。',
  },
  {
    label: '质检当前成片',
    text: '请对当前选中镜头 directorx_extract_frames 抽关键帧，directorx_view_image 对照提示词与连续性，必要时 directorx_qa。不要生成。',
  },
  {
    label: '版权改写当前意图',
    text: '请对当前画布意图或我刚写的句子 directorx_ip_scan。若 hits 非空：directorx_knowledge_read 213，按返回的 method/axes/keep 和项目记忆写细的属性描述（不要套固定成稿），再 directorx_ip_rewrite remember:true 验收并记入记忆。不要把 IP 专名送进 generate。',
  },
  {
    label: '编排当前成片',
    text: '请对当前画布或我的上一句先 directorx_brief 和 directorx_chengpian。按 compose 的路/稿/位：directorx_skill_route → directorx_prompt_plan → skill_read/knowledge_read → prompt_craft → generate_ready。成片角度只是写法，原句不是提示词。签字前不要 generate。过一阶段就 directorx_stage record。',
  },
  {
    label: '保存本次为技能',
    text: '请对刚完成的成片 directorx_skill_capture { action: "offer", present: true }。用 DSH 标准提问问我是否保存为「xx」技能，禁止正文菜单。我同意后把阶段流程、directorx_note 里的修改意见、拒因和风格锁整理成 SKILL.md，再 action:save。不要写入插件自带 skills/。',
  },
  {
    label: '保存本系列设定',
    text: '请用 directorx_series harvest 收成当前角色锚、风格锁和镜头规则，再 action:save。这是系列包不是方法技能。不要生成媒体。',
  },
  {
    label: '沿用系列包',
    text: '请 directorx_series list，再 apply 我要继续的那一套。套用后不要重设计角色和画风。先 character_list / style_get 确认，再写下一镜。不要生成，除非我接着说开拍。',
  },
  {
    label: '改当前镜头',
    text: '请对当前选中节点 directorx_revise，change 用我刚说的那句或「按选中镜头的提示词收紧表情和动作」。记下 directorx_note。然后才 prompt_plan / craft / generate_ready。回写只改这个节点的 path。不要重做整板。',
  },
  {
    label: '写场面控制表',
    text: '请 directorx_blocking harvest，再 schema。用当前角色图、我给的开场和事件顺序写成场面控制表：台账、物件状态机、独立相机、参考角色。缺开场或顺序就 directorx_ask。写完 pin 钉到画布。不要生成。',
  },
  {
    label: '评审改编文档',
    text: '请用 directorx_bible detect 找当前项目的大纲/角色/美术/剧本/分镜 JSON，checkup 跑质量门，再 pin 把 Markdown 评审钉到画布。不要另出 HTML。分镜若在切，先 directorx_shot_vocab 再写这一格。',
  },
] as const

function SessionPanel(props: {
  inspectorOpen: boolean
  lines: DockLine[]
  waits: LiveWait[]
  running: boolean
  blocked: boolean
  error?: string
  expandedLines: Set<string>
  onToggleLine: (id: string) => void
  noSession: boolean
  draft: string
  busy: boolean
  missing: boolean
  logRef: RefObject<HTMLDivElement>
  inputRef: RefObject<HTMLTextAreaElement>
  onDraft: (value: string) => void
  onSend: () => void
  onStop: () => void
  onClose: () => void
  onLeave?: () => void
  onNewSession?: () => void
  starting?: boolean
  selectedNode?: { id: string; label: string; kind?: string; path?: string }
  onClearSelected?: () => void
  onAddMedia?: (media: SessionMedia) => void
  confirmFirst: boolean
  onConfirmFirst: (value: boolean) => void
  onChip: (text: string) => void
}): ReactNode {
  const right = props.inspectorOpen ? 304 : 18
  const ask = props.waits.find((item): item is AskWait => item.kind === 'question')
  const approval = props.waits.find((item): item is ApprovalWait => item.kind === 'approval')
  return (
    <div
      data-dx-session-panel=""
      className="nowheel nopan"
      onWheel={event => event.stopPropagation()}
      onPointerDown={event => event.stopPropagation()}
      style={{
        ...dxChrome,
        position: 'absolute',
        right,
        bottom: 12,
        zIndex: 33,
        width: `min(400px, calc(100% - ${props.inspectorOpen ? 320 : 88}px))`,
        height: 'min(680px, calc(100% - 72px))',
        maxHeight: 'calc(100% - 72px)',
        borderRadius: 22,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        pointerEvents: 'auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 10px 10px 14px', borderBottom: `1px solid ${dx.hairline}`, flexShrink: 0 }}>
        <img src="/favicon.svg" width={18} height={18} alt="" draggable={false} />
        <strong style={{ fontSize: 13, letterSpacing: -0.2 }}>DirectorX</strong>
        <span style={{
          fontSize: 11,
          color: props.running ? '#8ee0a0' : dx.mute,
          fontWeight: 500,
        }}>
          {props.running ? '导演处理中…' : '已就绪'}
        </span>
        <span style={{ flex: 1 }} />
        {props.onNewSession !== undefined ? (
          <button
            type="button"
            className="dx-hit dx-session-new"
            disabled={props.starting === true}
            style={{ ...dxGhostBtn, width: 'auto', height: 28, padding: '0 8px', fontSize: 11, whiteSpace: 'nowrap' }}
            onClick={props.onNewSession}
            title="在这个工作区开一个新的 DSH 会话"
          >
            {props.starting === true ? '创建中…' : '新会话'}
          </button>
        ) : null}
        {props.onLeave !== undefined ? (
          <button type="button" className="dx-hit dx-session-leave" style={{ ...dxGhostBtn, width: 'auto', height: 28, padding: '0 8px', gap: 5, fontSize: 11, whiteSpace: 'nowrap' }} onClick={props.onLeave} title="关闭画布，回到 DSH">
            <IconLeave size={12} />回 DSH
          </button>
        ) : null}
        <button type="button" className="dx-hit" style={{ ...dxGhostBtn, width: 28, height: 28 }} onClick={props.onClose} title="收起">
          <IconClose size={13} />
        </button>
      </div>
      <div
        ref={props.logRef}
        className="dx-session-log"
        style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        {props.missing ? (
          <EmptyLine text="当前无法连接 DSH 会话接口。" />
        ) : props.noSession ? (
          <EmptyLine text="这个工作区还没有 DSH 会话。发一条消息会在此工作区开谈。" />
        ) : props.lines.length === 0 ? (
          <EmptyLine text="和 DSH 说话，编排这一画布。生成仍走底部输入框。" />
        ) : props.lines.map(line => <LineView key={line.id} line={line} expanded={props.expandedLines.has(line.id)} onToggle={() => props.onToggleLine(line.id)} onAddMedia={props.onAddMedia} />)}
        {props.running && props.lines.at(-1)?.kind !== 'thinking' && props.lines.at(-1)?.status !== 'running' && props.lines.at(-1)?.streaming !== true ? <EmptyLine text="DSH 正在处理…" pulse /> : null}
        {props.blocked ? <EmptyLine text="DSH 在等批准或回答。" /> : null}
        {props.error !== undefined ? <div style={{ color: '#ff9b8f', fontSize: 12, lineHeight: 1.45 }}>{props.error}</div> : null}
      </div>
      {approval !== undefined ? <ApprovalCard wait={approval} /> : null}
      {ask !== undefined ? <QuestionCard wait={ask} /> : null}
      <div style={{ padding: '8px 10px 10px', borderTop: `1px solid ${dx.hairline}`, flexShrink: 0 }}>
        <div className="dx-session-chips">
          {SESSION_CHIPS.map(chip => (
            <button
              key={chip.label}
              type="button"
              className="dx-hit"
              disabled={props.missing || props.busy}
              onClick={() => props.onChip(chip.text)}
              style={{ ...dxGhostBtn, width: 'auto', height: 24, padding: '0 8px', fontSize: 11, flexShrink: 0 }}
            >
              {chip.label}
            </button>
          ))}
          <button
            type="button"
            title="生成前先确认"
            onClick={() => props.onConfirmFirst(!props.confirmFirst)}
            className="dx-hit"
            style={{ ...dxGhostBtn, width: 'auto', height: 24, padding: '0 8px', fontSize: 11, flexShrink: 0, background: props.confirmFirst ? 'rgba(255,255,255,.12)' : 'transparent' }}
          >
            手动确认
          </button>
        </div>
        {props.selectedNode !== undefined ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 6px', fontSize: 11, color: dx.mute }}>
            <span style={{ padding: '2px 8px', borderRadius: 999, background: 'rgba(255,255,255,.08)', maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{props.selectedNode.label || props.selectedNode.id}</span>
            <button type="button" className="dx-hit" style={{ ...dxGhostBtn, width: 22, height: 22 }} onClick={props.onClearSelected} title="取消引用"><IconClose size={11} /></button>
          </div>
        ) : null}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, minWidth: 0 }}>
          <textarea
            ref={props.inputRef}
            value={props.draft}
            disabled={props.missing}
            placeholder={props.running ? '插话引导…' : '给 DSH 发消息，或输入 / 命令'}
            rows={1}
            onChange={event => {
              props.onDraft(event.target.value)
              const node = event.target
              node.style.height = 'auto'
              node.style.height = `${Math.min(120, Math.max(40, node.scrollHeight))}px`
            }}
            onKeyDown={event => {
              if (event.key === 'Escape') { event.preventDefault(); props.onClose(); return }
              if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'j') { event.preventDefault(); props.onClose(); return }
              if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); props.onSend() }
            }}
            style={composerStyle}
          />
          {props.running ? <button type="button" className="dx-hit" style={{ ...dxGhostBtn, width: 36, height: 36, flexShrink: 0 }} onClick={props.onStop} title="停止"><IconStop size={14} /></button> : null}
          <button type="button" disabled={props.missing || props.busy || props.draft.trim() === ''} onClick={props.onSend} className="dx-cta" title={props.running ? '插话' : '发送到 DSH'} style={{ ...dxPill, width: 36, height: 36, flexShrink: 0, opacity: props.missing || props.busy || props.draft.trim() === '' ? .4 : 1 }}>
            {props.busy ? <span className="dx-spin" /> : <IconSend size={15} />}
          </button>
        </div>
      </div>
    </div>
  )
}
function LineView(props: { line: DockLine; expanded: boolean; onToggle: () => void; onAddMedia?: (media: SessionMedia) => void }): ReactNode {
  if (props.line.kind === 'tool') return <ToolLine line={props.line} onAddMedia={props.onAddMedia} />
  if (props.line.kind === 'notice') return <div style={{ fontSize: 12, color: dx.mute, lineHeight: 1.45 }}>{props.line.text}</div>
  if (props.line.kind === 'thinking') return <div data-dx-thinking="" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, lineHeight: 1.5, color: dx.mute, fontStyle: 'italic', letterSpacing: 0.2 }}>{props.line.streaming === true ? <span className="dx-spin" style={{ width: 12, height: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,.18)', borderTopColor: 'rgba(255,255,255,.7)' }} /> : null}思考中</div>
  const mine = props.line.kind === 'user'
  const fold = props.line.kind === 'assistant' && sessionTextNeedsFold(props.line)
  const text = fold && !props.expanded ? `${props.line.text.slice(0, 180).trimEnd()}…` : props.line.text
  return <div data-dx-md-line={props.line.kind} style={{ alignSelf: mine ? 'flex-end' : 'stretch', maxWidth: mine ? '88%' : '100%', padding: mine ? '8px 12px' : '2px 2px', borderRadius: mine ? 16 : 0, background: mine ? 'rgba(255,255,255,.10)' : 'transparent', color: dx.ink, fontSize: 13.5, lineHeight: 1.6, wordBreak: 'break-word' }}><MarkdownView text={text} />{fold ? <button type="button" className="dx-hit dx-note-fold" onClick={props.onToggle} style={{ ...dxGhostBtn, width: 'auto', height: 24, padding: '0 7px', marginTop: 6, fontSize: 11 }}>{props.expanded ? '收起' : '展开'}</button> : null}{props.line.streaming === true ? <span className="dx-stream-caret" aria-hidden="true" /> : null}</div>
}

function ToolLine(props: { line: DockLine; onAddMedia?: (media: SessionMedia) => void }): ReactNode {
  const status = props.line.status ?? 'ok'
  const media = status === 'ok' ? mediaFromToolResult(props.line.result, props.line.name) : []
  return (
    <div className="dx-tool-line" data-status={status}>
      <div className="dx-tool-line-head">
        {status === 'running' ? (
          <span className="dx-spin" style={{ width: 12, height: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,.16)', borderTopColor: 'rgba(255,255,255,.75)' }} />
        ) : (
          <span className="dx-tool-dot" data-error={status === 'error' || undefined} />
        )}
        <span>{props.line.text}</span>
      </div>
      {media.length > 0 ? (
        <div className="dx-tool-thumbs">
          {media.map(item => (
            <SessionMediaThumb key={item.path} media={item} onAdd={props.onAddMedia} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function SessionMediaThumb(props: { media: SessionMedia; onAdd?: (media: SessionMedia) => void }): ReactNode {
  const src = mediaUrl(props.media.path)
  return (
    <button
      type="button"
      className="nodrag nopan dx-tool-thumb"
      title="双击加入画布"
      data-tip="双击加入画布"
      onDoubleClick={event => {
        event.preventDefault()
        event.stopPropagation()
        props.onAdd?.(props.media)
      }}
    >
      {props.media.kind === 'video' ? (
        <video src={src} muted loop playsInline preload="metadata" />
      ) : (
        <img src={src} alt={props.media.label} />
      )}
      {props.media.kind === 'video' ? <span className="dx-tool-thumb-kind">视频</span> : null}
    </button>
  )
}

function QuestionCard(props: { wait: AskWait }): ReactNode {
  const questions = props.wait.questions
  const [index, setIndex] = useState(0)
  const [drafts, setDrafts] = useState(() => questions.map(() => ({ selected: [] as string[], custom: '' })))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const question = questions[Math.min(index, questions.length - 1)] as AskItem
  const draft = drafts[Math.min(index, drafts.length - 1)] ?? { selected: [], custom: '' }
  const plan = question.intent?.kind === 'plan-review'

  const choose = (label: string) => {
    setDrafts(current => current.map((item, itemIndex) => {
      if (itemIndex !== index) return item
      if (question.multiSelect === true) {
        const selected = item.selected.includes(label)
          ? item.selected.filter(value => value !== label)
          : [...item.selected, label]
        return { ...item, selected }
      }
      return { selected: [label], custom: '' }
    }))
    setError(undefined)
  }

  const submit = async () => {
    setBusy(true)
    setError(undefined)
    try {
      await answerQuestion(props.wait, questions.map((item, itemIndex) => {
        const value = drafts[itemIndex] ?? { selected: [], custom: '' }
        const custom = value.custom.trim()
        return {
          id: item.id,
          selected: custom === '' || item.multiSelect === true ? value.selected : [],
          ...(custom === '' ? {} : { custom }),
        }
      }))
    } catch (cause) {
      setBusy(false)
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }

  return (
    <div data-dx-ask-card="" style={cardStyle}>
      {question.header !== undefined ? <div style={{ fontSize: 10, color: dx.mute, marginBottom: 4 }}>{question.header}</div> : null}
      <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, marginBottom: 6 }}>{question.question}</div>
      {question.detail !== undefined ? (
        <div style={{ fontSize: 12, color: dx.mute, marginBottom: 8, maxHeight: 160, overflow: 'auto' }}>
          <MarkdownView text={question.detail} />
        </div>
      ) : null}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {(question.options ?? []).map(option => {
          const on = draft.selected.includes(option.label)
          return (
            <button
              key={option.label}
              type="button"
              className="dx-hit"
              disabled={busy}
              onClick={() => choose(option.label)}
              style={{
                ...dxGhostBtn,
                width: '100%',
                height: 'auto',
                minHeight: 32,
                padding: '6px 10px',
                justifyContent: 'flex-start',
                textAlign: 'left',
                background: on ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.04)',
                whiteSpace: 'normal',
              }}
            >
              <span>
                <strong style={{ fontWeight: 600 }}>{option.label}</strong>
                {option.description !== undefined ? <span style={{ display: 'block', fontSize: 11, color: dx.mute, fontWeight: 400 }}>{option.description}</span> : null}
              </span>
            </button>
          )
        })}
      </div>
      {!plan ? (
        <textarea
          value={draft.custom}
          disabled={busy}
          placeholder="其它回答…"
          rows={2}
          onChange={event => {
            const custom = event.target.value
            setDrafts(current => current.map((item, itemIndex) => itemIndex === index
              ? { selected: question.multiSelect === true ? item.selected : [], custom }
              : item))
          }}
          style={{ ...composerStyle, minHeight: 40, marginTop: 8 }}
        />
      ) : null}
      {error !== undefined ? <div style={{ color: '#ff9b8f', fontSize: 11, marginTop: 6 }}>{error}</div> : null}
      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
        {questions.length > 1 && index > 0 ? (
          <button type="button" className="dx-hit" style={{ ...dxGhostBtn, width: 'auto', height: 28, padding: '0 10px', fontSize: 11 }} onClick={() => setIndex(index - 1)}>上一题</button>
        ) : null}
        {questions.length > 1 && index < questions.length - 1 ? (
          <button type="button" className="dx-hit" style={{ ...dxGhostBtn, width: 'auto', height: 28, padding: '0 10px', fontSize: 11 }} onClick={() => setIndex(index + 1)}>下一题</button>
        ) : null}
        <span style={{ flex: 1 }} />
        <button
          type="button"
          className="dx-hit"
          disabled={busy}
          style={{ ...dxGhostBtn, width: 'auto', height: 28, padding: '0 10px', fontSize: 11 }}
          onClick={() => { void cancelQuestion(props.wait).catch(cause => setError(cause instanceof Error ? cause.message : String(cause))) }}
        >
          取消
        </button>
        <button
          type="button"
          className="dx-cta"
          disabled={busy}
          style={{ ...dxPill, width: 'auto', height: 28, padding: '0 12px', fontSize: 11 }}
          onClick={() => { void submit() }}
        >
          {busy ? '提交中…' : '回答'}
        </button>
      </div>
    </div>
  )
}

function ApprovalCard(props: { wait: ApprovalWait }): ReactNode {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const decide = async (outcome: 'allowed-once' | 'rejected') => {
    setBusy(true)
    setError(undefined)
    try {
      await answerApproval(props.wait, outcome)
    } catch (cause) {
      setBusy(false)
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }
  return (
    <div data-dx-ask-card="" data-dx-approval-card="" style={cardStyle}>
      <div style={{ fontSize: 10, color: '#e6c07b', marginBottom: 4 }}>等待批准</div>
      <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>{props.wait.reason ?? `允许调用 ${props.wait.toolName}？`}</div>
      <div style={{ fontSize: 11, color: dx.mute, marginTop: 4 }}>{props.wait.toolName}</div>
      {error !== undefined ? <div style={{ color: '#ff9b8f', fontSize: 11, marginTop: 6 }}>{error}</div> : null}
      <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'flex-end' }}>
        <button type="button" className="dx-hit" disabled={busy} style={{ ...dxGhostBtn, width: 'auto', height: 28, padding: '0 10px', fontSize: 11 }} onClick={() => { void decide('rejected') }}>拒绝</button>
        <button type="button" className="dx-cta" disabled={busy} style={{ ...dxPill, width: 'auto', height: 28, padding: '0 12px', fontSize: 11 }} onClick={() => { void decide('allowed-once') }}>允许一次</button>
      </div>
    </div>
  )
}

function EmptyLine(props: { text: string; pulse?: boolean }): ReactNode {
  return (
    <div style={{ fontSize: 12, color: dx.mute, lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: 8 }}>
      {props.pulse === true ? <span className="dx-spin" style={{ borderColor: 'rgba(255,255,255,.2)', borderTopColor: '#f3f3f3' }} /> : null}
      {props.text}
    </div>
  )
}

const cardStyle: CSSProperties = {
  margin: '0 10px 10px',
  padding: 12,
  borderRadius: 14,
  border: `1px solid ${dx.hairline}`,
  background: 'rgba(255,255,255,.04)',
  flexShrink: 0,
}

const fabStyle: CSSProperties = {
  ...dxChrome,
  position: 'absolute',
  right: 18,
  bottom: 18,
  zIndex: 29,
  width: 52,
  height: 52,
  borderRadius: 999,
  display: 'grid',
  placeItems: 'center',
  padding: 0,
  cursor: 'pointer',
  pointerEvents: 'auto',
}

const composerStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  minHeight: 40,
  maxHeight: 120,
  resize: 'none',
  border: `1px solid ${dx.hairline}`,
  borderRadius: 12,
  outline: 'none',
  background: 'rgba(255,255,255,.04)',
  color: dx.ink,
  padding: '8px 10px',
  fontSize: 13,
  lineHeight: 1.45,
  fontFamily: dx.font,
}

const SESSION_CSS = `
.dx-session-chips {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
  flex-wrap: nowrap;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: none;
  mask-image: linear-gradient(90deg, #000 0, #000 calc(100% - 28px), transparent);
  -webkit-mask-image: linear-gradient(90deg, #000 0, #000 calc(100% - 28px), transparent);
}
.dx-session-chips::-webkit-scrollbar { display: none; }
@media (max-width: 760px) {
  [data-dx-session-panel] {
    right: 10px !important;
    left: 62px !important;
    width: auto !important;
    height: calc(100% - 76px) !important;
    max-height: none !important;
    bottom: 10px !important;
  }
  .dx-session-new { display: none !important; }
}
.dx-tool-line {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 6px;
  font-size: 12px;
  line-height: 1.4;
  color: ${dx.mute};
  letter-spacing: 0.1px;
}
.dx-tool-line-head { display: flex; align-items: center; gap: 8px; }
.dx-tool-line[data-status="error"] { color: #ff9b8f; }
.dx-tool-thumbs { display: flex; flex-wrap: wrap; gap: 6px; }
.dx-tool-thumb {
  position: relative;
  width: 112px;
  height: 64px;
  padding: 0;
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 8px;
  overflow: hidden;
  background: #111;
  cursor: pointer;
}
.dx-tool-thumb img, .dx-tool-thumb video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.dx-tool-thumb-kind {
  position: absolute;
  left: 5px;
  bottom: 5px;
  padding: 1px 5px;
  border-radius: 4px;
  background: rgba(8,8,8,.7);
  color: #f2f2f2;
  font-size: 9px;
  letter-spacing: .2px;
}
.dx-tool-dot {
  width: 6px;
  height: 6px;
  border-radius: 99px;
  background: rgba(255,255,255,.28);
  flex-shrink: 0;
}
.dx-tool-dot[data-error] { background: #ff9b8f; }
.dx-md { font-size: 13.5px; line-height: 1.65; color: ${dx.ink}; }
.dx-md p { margin: 0 0 .7em; }
.dx-md p:last-child { margin-bottom: 0; }
.dx-md hr { display: none; }
.dx-md-table-wrap { overflow-x: auto; margin: 8px 0 10px; max-width: 100%; }
.dx-md-table { width: 100%; border-collapse: collapse; font-size: 12px; line-height: 1.45; }
.dx-md-table th, .dx-md-table td { border: 1px solid rgba(255,255,255,.12); padding: 6px 8px; text-align: left; vertical-align: top; }
.dx-md-table th { color: #f3f3f3; background: rgba(255,255,255,.07); font-weight: 600; }
.dx-md-table td { color: #d0d0d0; }
.dx-stream-caret {
  display: inline-block;
  width: 6px;
  height: 13px;
  margin-left: 3px;
  vertical-align: text-bottom;
  background: ${dx.ink};
  animation: dx-blink 1s step-end infinite;
}
@keyframes dx-blink { 50% { opacity: 0; } }
`
