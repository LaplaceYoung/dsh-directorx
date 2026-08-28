import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { DEEPSEEK_FIRST_PARTY_VISION, MODELVERSE_BY_CAPABILITY } from '../modelverse-catalog.ts'
import { rpcOk } from './stage/session-fold.ts'
import { projectHeaders, withProject } from './stage/project.ts'

interface NamespaceView {
  ns: string
  schema: unknown
  value: Record<string, unknown>
  base?: unknown
  user?: Record<string, unknown>
  applies: 'live' | 'restart'
  secrets: Array<{ path: string[]; set: boolean }>
  revision: number
}

interface SettingsDescribe {
  writable: boolean
  hasDocument: boolean
  namespaces: NamespaceView[]
}

interface SettingsApi {
  describe(request: object): Promise<unknown>
  mutate(request: {
    ns: string
    ops: Array<{ op: 'set' | 'unset'; path: string[]; value?: unknown }>
    expectedRevision?: number
  }): Promise<unknown>
}

interface SettingsScopeSnapshot {
  status: 'loading' | 'ready' | 'unavailable'
  value?: Record<string, unknown>
  revision?: number
  writable: boolean
}

interface SettingsScopeFace {
  getSnapshot(): SettingsScopeSnapshot
  subscribe(listener: () => void): () => void
  /** alpha.1 seam (settings-contract): path ops with the snapshot revision fence. */
  mutate?: (ops: Array<{ op: 'set' | 'unset'; path: string[]; value?: unknown }>, expectedRevision?: number) => Promise<unknown>
}

interface CapabilityDraft {
  enabled: boolean
  mode: string
  baseURL: string
  model: string
  resolution: string
  apiKey: string
  klingAk: string
  klingSk: string
  runwayVersion: string
}

interface Draft {
  vision: CapabilityDraft
  image: CapabilityDraft
  video: CapabilityDraft
  audio: CapabilityDraft
}

interface SectionInjected {
  scope?: SettingsScopeFace
  api?: SettingsApi
}

const DEFAULT_DRAFT: Draft = {
  vision: { enabled: true, mode: 'deepseek-chat', baseURL: 'https://api.deepseek.com', model: 'deepseek-v4-flash-vision-exp', resolution: '1K', apiKey: '', klingAk: '', klingSk: '', runwayVersion: '' },
  image: { enabled: true, mode: 'openai-images', baseURL: 'https://api.modelverse.cn/v1', model: 'gpt-image-2', resolution: '1K', apiKey: '', klingAk: '', klingSk: '', runwayVersion: '' },
  video: { enabled: true, mode: 'modelverse-tasks', baseURL: 'https://api.modelverse.cn/v1', model: 'MiniMax-H3', resolution: '2K', apiKey: '', klingAk: '', klingSk: '', runwayVersion: '2024-11-06' },
  audio: { enabled: true, mode: 'openai-tts', baseURL: 'https://api.modelverse.cn/v1', model: 'gpt-4o-mini-tts', resolution: '1K', apiKey: '', klingAk: '', klingSk: '', runwayVersion: '' },
}

const MODES: Record<keyof Draft, string[]> = {
  vision: ['deepseek-chat', 'openai-chat', 'mock'],
  image: ['openai-images', 'modelverse-tasks', 'generic-rest', 'mock'],
  video: ['openai-videos', 'modelverse-tasks', 'kling', 'kling-v3', 'runway', 'minimax-h3', 'vidu', 'veo', 'generic-rest', 'mock'],
  audio: ['openai-tts', 'generic-rest', 'mock'],
}

const CAPABILITY_LABEL: Record<keyof Draft, string> = {
  vision: '视觉 / Vision',
  image: '图像生成 / Image',
  video: '视频生成 / Video',
  audio: '音频生成 / Audio',
}

function readDraft(value: Record<string, unknown> | undefined): Draft {
  const next = { ...DEFAULT_DRAFT }
  for (const key of Object.keys(next) as Array<keyof Draft>) {
    const raw = value?.[key]
    if (raw !== null && typeof raw === 'object') {
      const record = raw as Record<string, unknown>
      const auth = record.auth !== null && typeof record.auth === 'object' ? record.auth as Record<string, unknown> : {}
      next[key] = {
        enabled: typeof record.enabled === 'boolean' ? record.enabled : next[key].enabled,
        mode: typeof record.mode === 'string' ? record.mode : next[key].mode,
        baseURL: typeof record.baseURL === 'string' ? record.baseURL : next[key].baseURL,
        model: typeof record.model === 'string' ? record.model : next[key].model,
        resolution: typeof record.resolution === 'string' ? record.resolution : next[key].resolution,
        apiKey: '',
        klingAk: '',
        klingSk: '',
        runwayVersion: typeof auth.runwayVersion === 'string' ? auth.runwayVersion : next[key].runwayVersion,
      }
    }
  }
  return next
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

const settingsRoot: CSSProperties = {
  width: '100%',
  maxWidth: 1040,
  boxSizing: 'border-box',
  padding: 'clamp(14px, 2.2vw, 24px)',
  color: 'var(--dsw-alias-label-primary)',
  fontSize: 13,
  overflowWrap: 'anywhere',
}
const card: CSSProperties = {
  minWidth: 0,
  boxSizing: 'border-box',
  border: '1px solid var(--dsw-alias-border-l2)',
  borderRadius: 12,
  padding: 'clamp(12px, 1.8vw, 16px)',
  marginBottom: 12,
  background: 'var(--dsw-alias-bg-layer-2)',
}
const capabilityCard: CSSProperties = { ...card, marginBottom: 0 }
const capabilityGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
  gap: 12,
  alignItems: 'start',
}
const cardHeader: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
  minWidth: 0,
  paddingBottom: 10,
  marginBottom: 12,
  borderBottom: '1px solid var(--dsw-alias-border-l2)',
}
const cardSub: CSSProperties = { display: 'block', marginTop: 3, fontSize: 11, color: 'var(--dsw-alias-label-tertiary)' }
const row: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(84px, .42fr) minmax(0, 1fr)',
  gap: '6px 12px',
  marginBottom: 10,
  alignItems: 'center',
  minWidth: 0,
}
const label: CSSProperties = { minWidth: 0, fontSize: 12, color: 'var(--dsw-alias-label-secondary)', overflowWrap: 'anywhere' }
const input: CSSProperties = {
  width: '100%',
  minWidth: 0,
  minHeight: 32,
  boxSizing: 'border-box',
  padding: '6px 9px',
  borderRadius: 8,
  border: '1px solid var(--dsw-alias-border-l2)',
  background: 'var(--dsw-alias-bg-layer-1)',
  color: 'var(--dsw-alias-label-primary)',
  font: 'inherit',
  lineHeight: 1.35,
  outline: 'none',
}
const button: CSSProperties = {
  minHeight: 32,
  boxSizing: 'border-box',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  padding: '0 12px',
  borderRadius: 8,
  border: '1px solid var(--dsw-alias-brand-primary)',
  background: 'var(--dsw-alias-bg-layer-1)',
  color: 'var(--dsw-alias-label-primary)',
  font: 'inherit',
  fontSize: 12,
  cursor: 'pointer',
}
const sectionTitle: CSSProperties = { fontSize: 18, lineHeight: 1.25, fontWeight: 600, letterSpacing: -.2, margin: 0 }
const hint: CSSProperties = { fontSize: 12, color: 'var(--dsw-alias-label-tertiary)', lineHeight: 1.55, margin: '6px 0 0' }
const eyebrow: CSSProperties = { fontSize: 10, lineHeight: 1.3, letterSpacing: .8, color: 'var(--dsw-alias-label-caption)', textTransform: 'uppercase' }
const notice: CSSProperties = { minWidth: 0, boxSizing: 'border-box', padding: '8px 10px', borderRadius: 8, fontSize: 12, lineHeight: 1.45, margin: '0 0 10px' }
const errorNotice: CSSProperties = { ...notice, color: 'var(--dsw-alias-state-error-primary)', background: 'var(--dsw-alias-interactive-bg-hover-danger)', border: '1px solid var(--dsw-alias-state-error-primary)' }
const successNotice: CSSProperties = { ...notice, color: 'var(--dsw-alias-state-success-primary)', background: 'var(--dsw-alias-interactive-bg-hover)', border: '1px solid var(--dsw-alias-state-success-primary)' }
const warningNotice: CSSProperties = { ...notice, color: 'var(--dsw-alias-state-warn-primary)', background: 'var(--dsw-alias-interactive-bg-hover)', border: '1px solid var(--dsw-alias-state-warn-primary)' }
const danger: CSSProperties = { border: '1px solid var(--dsw-alias-state-error-primary)', background: 'var(--dsw-alias-bg-layer-1)', color: 'var(--dsw-alias-state-error-primary)', cursor: 'pointer' }

function CapabilityCard(props: {
  title: string
  capability: 'vision' | 'image' | 'video' | 'audio'
  draft: CapabilityDraft
  modes: string[]
  extraModels?: string[]
  onChange: (next: CapabilityDraft) => void
}): ReactNode {
  const { draft } = props
  const [testState, setTestState] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle')
  const [testMessage, setTestMessage] = useState<string | undefined>(undefined)
  async function testConnection(): Promise<void> {
    setTestState('testing')
    setTestMessage(undefined)
    try {
      const response = await fetch('/directorx/settings/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ capability: props.capability }),
      })
      const data = await response.json() as { ok: boolean; message: string }
      setTestState(data.ok ? 'ok' : 'fail')
      setTestMessage(data.message)
    } catch (cause) {
      setTestState('fail')
      setTestMessage(cause instanceof Error ? cause.message : String(cause))
    }
  }
  return (
    <div style={capabilityCard}>
      <div style={cardHeader}>
        <div style={{ minWidth: 0 }}>
          <div style={eyebrow}>{props.capability} capability</div>
          <strong style={{ display: 'block', marginTop: 4, fontSize: 14, lineHeight: 1.3 }}>{props.title}</strong>
          <span style={cardSub}>{draft.enabled ? '已启用 · 配置即时生效' : '已停用 · 不注册对应工具'}</span>
        </div>
        <label style={{ flexShrink: 0, display: 'inline-flex', gap: 7, alignItems: 'center', fontSize: 12, color: 'var(--dsw-alias-label-secondary)', cursor: 'pointer' }}>
          <input type="checkbox" checked={draft.enabled} onChange={event => props.onChange({ ...draft, enabled: event.target.checked })} />
          启用
        </label>
      </div>
      {draft.enabled ? (
        <>
          <div style={row}>
            <span style={label}>配置方式 / Mode</span>
            <select style={input} value={draft.mode} onChange={event => props.onChange({ ...draft, mode: event.target.value })}>
              {props.modes.map(mode => <option key={mode} value={mode}>{mode}</option>)}
            </select>
          </div>
          <div style={row}>
            <span style={label}>Base URL</span>
            <input style={input} value={draft.baseURL} placeholder="https://api.openai.com/v1" onChange={event => props.onChange({ ...draft, baseURL: event.target.value })} />
          </div>
          <div style={row}>
            <span style={label}>API Key</span>
            <input style={input} type="password" value={draft.apiKey} autoComplete="off" placeholder={draft.baseURL.startsWith('http://localhost') || draft.baseURL.includes('127.0.0.1') ? '本地端点可留空' : 'sk-...（留空则不修改）'} onChange={event => props.onChange({ ...draft, apiKey: event.target.value })} />
          </div>
          <div style={row}>
            <span style={label}>Model</span>
            <span style={{ minWidth: 0 }}>
              <input
                style={input}
                list={`dx-models-${props.capability}`}
                value={draft.model}
                placeholder="model id"
                onChange={event => props.onChange({ ...draft, model: event.target.value })}
              />
              <datalist id={`dx-models-${props.capability}`}>
                {[...(props.capability === 'vision' ? DEEPSEEK_FIRST_PARTY_VISION : []), ...MODELVERSE_BY_CAPABILITY[props.capability], ...(props.extraModels ?? [])].filter((id, index, all) => all.indexOf(id) === index).map(id => <option key={id} value={id} />)}
              </datalist>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', margin: '2px 0 12px' }}>
            <span style={label}>连接测试</span>
            <button className="dx-hit" style={{ ...button, minHeight: 30, padding: '0 10px', opacity: testState === 'testing' ? .6 : 1 }} onClick={() => void testConnection()} disabled={testState === 'testing'}>
              {testState === 'testing' ? '测试中…' : '测试连接'}
            </button>
            {testMessage !== undefined ? <span role={testState === 'fail' ? 'alert' : 'status'} style={{ fontSize: 12, color: testState === 'ok' ? 'var(--dsw-alias-state-success-primary)' : 'var(--dsw-alias-state-error-primary)', overflowWrap: 'anywhere' }}>{testMessage}</span> : null}
          </div>
          {props.title === CAPABILITY_LABEL.video ? (
            <>
              <div style={row}>
                <span style={label}>Resolution</span>
                <input style={input} value={draft.resolution} placeholder="2K / 720p / 1080p" onChange={event => props.onChange({ ...draft, resolution: event.target.value })} />
              </div>
              {draft.mode === 'kling' ? (
                <>
                  <div style={row}>
                    <span style={label}>可灵 AccessKey</span>
                    <input style={input} type="password" autoComplete="off" value={draft.klingAk} placeholder="AK…（留空则不修改）" onChange={event => props.onChange({ ...draft, klingAk: event.target.value })} />
                  </div>
                  <div style={row}>
                    <span style={label}>可灵 SecretKey</span>
                    <input style={input} type="password" autoComplete="off" value={draft.klingSk} placeholder="SK…（留空则不修改）" onChange={event => props.onChange({ ...draft, klingSk: event.target.value })} />
                  </div>
                  <p style={hint}>可灵（Kling）模式使用 AK/SK 做 JWT 签名鉴权，不使用上面的 API Key；Base URL 填 https://api-beijing.klingai.com（国内）或 https://api.klingai.com（全球）。模型建议 kling-v2。</p>
                </>
              ) : null}
              {draft.mode === 'generic-rest' ? (
                <p style={hint}>generic-rest 走用户入驻的 AdapterSpec。在下方「接入新模型」或会话里交给 DSH：ingest → classify → draft → smoke → commit。</p>
              ) : null}
              {draft.mode === 'runway' ? (
                <>
                  <div style={row}>
                    <span style={label}>API 版本头</span>
                    <input style={input} value={draft.runwayVersion} placeholder="如 2024-11-06（留空不发送）" onChange={event => props.onChange({ ...draft, runwayVersion: event.target.value })} />
                  </div>
                  <p style={hint}>Runway 模式使用上面的 API Key；Base URL 填 https://api.dev.runwayml.com。模型建议 gen4.5（文生/图生）或 gen4_turbo（图生）；Hailuo 3.0 可通过模型 hailuo3 调用。</p>
                </>
              ) : null}
            </>
          ) : null}
        </>
      ) : (
        <p style={hint}>关闭后，DirectorX 不会注册此能力对应的工具。其它能力不受影响。</p>
      )}
    </div>
  )
}

function viewFromScope(snapshot: SettingsScopeSnapshot): { view: NamespaceView; writable: boolean } | undefined {
  if (snapshot.status !== 'ready' || snapshot.value === undefined) return undefined
  return {
    writable: snapshot.writable,
    view: {
      ns: 'directorx',
      schema: undefined,
      value: snapshot.value,
      applies: 'live',
      secrets: [],
      revision: snapshot.revision ?? 0,
    },
  }
}

export function DirectorxSettingsSection(props: Partial<SectionInjected>): ReactNode {
  const api = props.api
  const scope = props.scope
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [draft, setDraft] = useState<Draft>(DEFAULT_DRAFT)
  const [view, setView] = useState<NamespaceView | undefined>(undefined)
  const [writable, setWritable] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const [canvasInfo, setCanvasInfo] = useState<{ nodes: number; edges: number; title?: string } | undefined>(undefined)
  const [canvasAction, setCanvasAction] = useState<string | undefined>(undefined)
  const [confirmReset, setConfirmReset] = useState(false)
  const [initiative, setInitiative] = useState<'严格' | '自动' | '协同'>('协同')
  const [adapters, setAdapters] = useState<Array<{ id: string; model: string; capability: string; mode: string; status: string }>>([])
  const [onboard, setOnboard] = useState({ capability: 'video', model: '', baseURL: '', apiDoc: '', apiDocUrl: '', apiKey: '' })
  const [onboardMsg, setOnboardMsg] = useState<string | undefined>(undefined)

  async function refreshAdapters(): Promise<void> {
    try {
      const response = await fetch(withProject('/directorx/adapters'), { headers: projectHeaders() })
      if (!response.ok) return
      const body = await response.json() as { adapters?: Array<{ id: string; model: string; capability: string; mode: string; status: string }> }
      setAdapters(Array.isArray(body.adapters) ? body.adapters : [])
    } catch {
      // Non-blocking.
    }
  }

  async function submitOnboard(): Promise<void> {
    setOnboardMsg('提交中…')
    try {
      const response = await fetch(withProject('/directorx/adapters'), {
        method: 'POST',
        headers: { ...projectHeaders(), 'content-type': 'application/json' },
        body: JSON.stringify(onboard),
      })
      const body = await response.json() as { ok?: boolean; id?: string; hint?: string; message?: string }
      if (!response.ok || body.ok === false) throw new Error(body.message ?? String(response.status))
      setOnboardMsg(body.hint ?? `已收料 ${body.id}。在会话里说：继续接入 ${body.id}`)
      setOnboard(current => ({ ...current, apiKey: '' }))
      await refreshAdapters()
    } catch (cause) {
      setOnboardMsg(`失败：${cause instanceof Error ? cause.message : String(cause)}`)
    }
  }

  async function refreshCanvas(): Promise<void> {
    try {
      const response = await fetch(withProject('/directorx/canvas'), { headers: projectHeaders() })
      if (!response.ok) return
      const doc = await response.json() as { nodes: unknown[]; edges: unknown[]; title?: string }
      setCanvasInfo({ nodes: doc.nodes.length, edges: doc.edges.length, title: doc.title })
    } catch {
      // Non-blocking info refresh.
    }
  }

  async function resetCanvas(): Promise<void> {
    setCanvasAction('重置中…')
    try {
      const response = await fetch(withProject('/directorx/canvas/reset'), { method: 'POST', headers: projectHeaders() })
      if (!response.ok) throw new Error(String(response.status))
      setCanvasAction('已重置（旧画布已备份为 canvas.json.bak-<时间戳>）')
      await refreshCanvas()
    } catch (cause) {
      setCanvasAction(`重置失败：${cause instanceof Error ? cause.message : String(cause)}`)
    }
  }

  function applyNamespace(target: NamespaceView, writableFlag: boolean): void {
    setView(target)
    setDraft(readDraft(target.value))
    const mode = target.value.initiative
    setInitiative(mode === '严格' || mode === '自动' || mode === '协同' ? mode : '协同')
    setWritable(writableFlag)
    setStatus('ready')
    setError(undefined)
    void refreshCanvas()
    void refreshAdapters()
  }

  function applyScopeSnapshot(snapshot: SettingsScopeSnapshot): void {
    if (snapshot.status === 'loading') {
      setStatus(prev => prev === 'idle' ? 'loading' : prev)
      return
    }
    const next = viewFromScope(snapshot)
    if (next === undefined) {
      setStatus('ready')
      setWritable(snapshot.writable)
      setError('未找到 directorx 设置命名空间。请确认插件已安装并重启 DSH。')
      return
    }
    applyNamespace(next.view, next.writable)
  }

  async function load(): Promise<void> {
    if (scope !== undefined) {
      applyScopeSnapshot(scope.getSnapshot())
      return
    }
    if (api === undefined) return
    setStatus(prev => prev === 'idle' ? 'loading' : prev)
    setError(undefined)
    try {
      const parsed = rpcOk<SettingsDescribe>(await api.describe({}))
      if (!parsed.ok) throw new Error(parsed.message)
      const target = parsed.value.namespaces.find(entry => entry.ns === 'directorx')
      if (target === undefined) {
        setStatus('ready')
        setWritable(parsed.value.writable)
        setError('未找到 directorx 设置命名空间。请确认插件已安装并重启 DSH。')
        return
      }
      applyNamespace(target, parsed.value.writable)
    } catch (loadError) {
      setStatus('error')
      setError(messageOf(loadError))
    }
  }

  useEffect(() => {
    if (scope !== undefined) {
      applyScopeSnapshot(scope.getSnapshot())
      return scope.subscribe(() => { applyScopeSnapshot(scope.getSnapshot()) })
    }
    void load()
    return undefined
  }, [])

  async function save(): Promise<void> {
    if (saving) return
    const revision = scope?.getSnapshot().revision ?? view?.revision
    if (scope?.mutate === undefined && api === undefined) {
      setError('当前 Host 无法按路径写入设置（需要 settings.mutate）。')
      return
    }
    setSaving(true)
    setSaved(false)
    setError(undefined)
    try {
      const ops: Array<{ op: 'set' | 'unset'; path: string[]; value?: unknown }> = [
        { op: 'set', path: ['persona'], value: '成片' },
        { op: 'set', path: ['initiative'], value: initiative },
      ]
      for (const key of Object.keys(draft) as Array<keyof Draft>) {
        const capability = draft[key]
        ops.push(
          { op: 'set', path: [key, 'enabled'], value: capability.enabled },
          { op: 'set', path: [key, 'mode'], value: capability.mode },
          { op: 'set', path: [key, 'baseURL'], value: capability.baseURL },
          { op: 'set', path: [key, 'model'], value: capability.model },
          { op: 'set', path: [key, 'resolution'], value: capability.resolution },
          { op: 'set', path: [key, 'auth', 'runwayVersion'], value: capability.runwayVersion },
        )
        if (capability.apiKey.trim() !== '') {
          ops.push({ op: 'set', path: [key, 'apiKey'], value: capability.apiKey.trim() })
        }
        if (capability.klingAk.trim() !== '') {
          ops.push({ op: 'set', path: [key, 'auth', 'klingAk'], value: capability.klingAk.trim() })
        }
        if (capability.klingSk.trim() !== '') {
          ops.push({ op: 'set', path: [key, 'auth', 'klingSk'], value: capability.klingSk.trim() })
        }
      }
      // Call as a method — scope.mutate uses `this.writeGeneration`.
      if (scope?.mutate !== undefined) {
        // Official scope seam (0.1.2): applies ops, the mirror accepts the new
        // view, and the card re-reads the snapshot. Wire failures recover by
        // reloading the last host view.
        await scope.mutate(ops, revision)
        if (scope !== undefined) applyScopeSnapshot(scope.getSnapshot())
      } else {
        if (api === undefined) throw new Error('当前 Host 无法按路径写入设置（需要 settings.mutate）。')
        const parsed = rpcOk<NamespaceView>(await api.mutate({
          ns: 'directorx',
          ops,
          ...(revision === undefined ? {} : { expectedRevision: revision }),
        }))
        if (!parsed.ok) throw new Error(parsed.message)
        applyNamespace(parsed.value, writable)
      }
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2500)
    } catch (saveError) {
      setError(messageOf(saveError))
    } finally {
      setSaving(false)
    }
  }

  if (api === undefined && scope === undefined) return (
    <div style={settingsRoot}>
      <div style={eyebrow}>DIRECTORX / SETTINGS</div>
      <h2 style={sectionTitle}>DirectorX 模型</h2>
      <div style={notice} role="status">
        Host 没有把 settings 面注入进来。把插件切到 SettingsScope 驱动的版本，它就不会走这条分路。
      </div>
    </div>
  )
  if (status === 'loading' || status === 'idle') return <div style={{ ...settingsRoot, color: 'var(--dsw-alias-label-tertiary)' }} role="status">正在加载 DirectorX 模型配置…</div>
  if (status === 'error') return (
    <div style={settingsRoot}>
      <div style={errorNotice} role="alert">{error ?? '加载设置失败'}</div>
      <button style={button} onClick={() => void load()}>重试</button>
    </div>
  )

  return (
    <div style={settingsRoot}>
      <div style={{ marginBottom: 18 }}>
        <div style={eyebrow}>DIRECTORX / SETTINGS</div>
        <h2 style={sectionTitle}>DirectorX 模型</h2>
        <p style={hint}>配置视觉、图像、视频与音频能力。设置由 DSH settings 持有，保存后即时更新工具注册。</p>
      </div>
      <div style={card}>
        <div style={cardHeader}>
          <div style={{ minWidth: 0 }}>
            <div style={eyebrow}>WORKFLOW CONTROL</div>
            <strong style={{ display: 'block', marginTop: 4, fontSize: 14 }}>成片 persona · 主动性</strong>
            <span style={cardSub}>决定 DSH 在生成前后的确认与执行节奏</span>
          </div>
          <span style={{ flexShrink: 0, padding: '3px 8px', borderRadius: 999, border: '1px solid var(--dsw-alias-border-l2)', color: 'var(--dsw-alias-label-secondary)', fontSize: 11 }}>DSH loop</span>
        </div>
        <p style={{ ...hint, marginTop: -2, marginBottom: 12 }}>严格：多确认、不生成；自动：预算内直接执行；协同：先给提示词与占位，审阅后执行。</p>
        <div style={{ ...row, marginBottom: 0 }}>
          <span style={label}>主动性</span>
          <select style={input} value={initiative} onChange={event => setInitiative(event.target.value as '严格' | '自动' | '协同')}>
            <option value="严格">严格</option>
            <option value="自动">自动</option>
            <option value="协同">协同</option>
          </select>
        </div>
      </div>
      {!writable ? <div style={warningNotice} role="status">当前 settings 后端只读，无法保存修改。</div> : null}
      {error !== undefined ? <div style={errorNotice} role="alert">{error}</div> : null}
      {saved ? <div style={successNotice} role="status">已保存并热更新工具注册。</div> : null}
      <div style={{ ...card, padding: 0, border: 0, background: 'transparent' }}>
        <div style={{ ...eyebrow, margin: '2px 0 8px' }}>CAPABILITIES</div>
        <div style={capabilityGrid}>
          {Object.keys(draft).map(key => {
            const capabilityKey = key as keyof Draft
            return (
              <CapabilityCard
                key={capabilityKey}
                title={CAPABILITY_LABEL[capabilityKey]}
                capability={capabilityKey}
                draft={draft[capabilityKey]}
                modes={MODES[capabilityKey]}
                extraModels={adapters.filter(item => item.capability === capabilityKey).map(item => item.model)}
                onChange={(next) => { setDraft(current => ({ ...current, [capabilityKey]: next })) }}
              />
            )
          })}
        </div>
      </div>
      <div style={card}>
        <div style={cardHeader}>
          <div style={{ minWidth: 0 }}>
            <div style={eyebrow}>ADAPTER INTAKE</div>
            <strong style={{ display: 'block', marginTop: 4, fontSize: 14 }}>接入新模型</strong>
            <span style={cardSub}>这里只收料；DSH 按 ingest → classify → draft → smoke → commit 完成入驻</span>
          </div>
        </div>
        <div style={row}><span style={label}>能力</span>
          <select style={input} value={onboard.capability} onChange={event => setOnboard(current => ({ ...current, capability: event.target.value }))}>
            <option value="video">视频</option>
            <option value="image">图像</option>
            <option value="audio">音频</option>
          </select>
        </div>
        <div style={row}><span style={label}>Model</span>
          <input style={input} value={onboard.model} placeholder="上游 model id" onChange={event => setOnboard(current => ({ ...current, model: event.target.value }))} />
        </div>
        <div style={row}><span style={label}>Base URL</span>
          <input style={input} value={onboard.baseURL} placeholder="https://api.example.com/v1" onChange={event => setOnboard(current => ({ ...current, baseURL: event.target.value }))} />
        </div>
        <div style={row}><span style={label}>文档 URL</span>
          <input style={input} value={onboard.apiDocUrl} placeholder="可选" onChange={event => setOnboard(current => ({ ...current, apiDocUrl: event.target.value }))} />
        </div>
        <div style={row}><span style={label}>文档正文</span>
          <textarea style={{ ...input, minHeight: 88, resize: 'vertical' }} value={onboard.apiDoc} placeholder="粘贴 API 文档关键章节" onChange={event => setOnboard(current => ({ ...current, apiDoc: event.target.value }))} />
        </div>
        <div style={row}><span style={label}>API Key</span>
          <input style={input} type="password" autoComplete="off" value={onboard.apiKey} placeholder="不会回写到会话" onChange={event => setOnboard(current => ({ ...current, apiKey: event.target.value }))} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 2 }}>
          <button style={button} onClick={() => void submitOnboard()}>交给 DSH 入驻</button>
          {onboardMsg !== undefined ? <span style={hint}>{onboardMsg}</span> : null}
        </div>
        {adapters.length > 0 ? (
          <div style={{ display: 'grid', gap: 6, marginTop: 14 }}>
            <div style={eyebrow}>REGISTERED ADAPTERS</div>
            {adapters.map(item => <div key={item.id} style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', minWidth: 0, padding: '7px 9px', borderRadius: 8, background: 'var(--dsw-alias-bg-layer-1)', border: '1px solid var(--dsw-alias-border-l2)', fontSize: 12 }}><strong>{item.model}</strong><span style={{ color: 'var(--dsw-alias-label-tertiary)' }}>{item.capability} · {item.mode}</span><span style={{ marginLeft: 'auto', color: 'var(--dsw-alias-label-secondary)' }}>{item.status}</span></div>)}
          </div>
        ) : null}
      </div>
      <div style={card}>
        <div style={cardHeader}>
          <div style={{ minWidth: 0 }}>
            <div style={eyebrow}>CANVAS STORAGE</div>
            <strong style={{ display: 'block', marginTop: 4, fontSize: 14 }}>画布</strong>
            <span style={cardSub}>DSH canvas 持久化与备份状态</span>
          </div>
          <span style={{ flexShrink: 0, color: 'var(--dsw-alias-label-caption)', fontSize: 11 }}>canvas.json</span>
        </div>
        <div style={{ display: 'grid', gap: 6, fontSize: 12, lineHeight: 1.5, color: 'var(--dsw-alias-label-secondary)' }}>
          <div>文档位置：<span style={{ color: 'var(--dsw-alias-label-tertiary)', overflowWrap: 'anywhere' }}>directorx_output/canvas.json</span></div>
          <div>当前状态：{canvasInfo === undefined ? '读取中…' : `${canvasInfo.nodes} 个节点 · ${canvasInfo.edges} 条连线${canvasInfo.title !== undefined && canvasInfo.title !== '' ? ` · 标题「${canvasInfo.title}」` : ''}`}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
          <button style={{ ...button, borderColor: 'var(--dsw-alias-border-l2)' }} onClick={() => { void refreshCanvas() }}>刷新状态</button>
          {confirmReset ? (
            <>
              <button style={{ ...button, ...danger }} onClick={() => { setConfirmReset(false); void resetCanvas() }}>确认重置（备份后清空）</button>
              <button style={{ ...button, borderColor: 'var(--dsw-alias-border-l2)' }} onClick={() => setConfirmReset(false)}>取消</button>
            </>
          ) : (
            <button style={{ ...button, ...danger }} onClick={() => setConfirmReset(true)}>重置画布（自动备份）</button>
          )}
          {canvasAction !== undefined ? <span style={hint}>{canvasAction}</span> : null}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
        <button style={{ ...button, minWidth: 144, background: 'var(--dsw-alias-button-contrast-fill)', color: 'var(--dsw-alias-label-primary-inverted)', borderColor: 'var(--dsw-alias-button-contrast-fill)' }} disabled={saving || !writable} onClick={() => void save()}>
          {saving ? '保存中…' : '保存全部配置'}
        </button>
      </div>
    </div>
  )
}