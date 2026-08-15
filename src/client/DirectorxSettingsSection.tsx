import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'

interface RpcResult<T> {
  ok: boolean
  value: T
  error?: { code?: string; message?: string }
}

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

interface SettingsApi {
  describe(request: object): Promise<{ result: RpcResult<{ writable: boolean; hasDocument: boolean; namespaces: NamespaceView[] }> }>
  mutate(request: {
    ns: string
    ops: Array<{ op: 'set' | 'unset'; path: string[]; value?: unknown }>
    expectedRevision?: number
  }): Promise<{ result: RpcResult<NamespaceView> }>
}

interface ConnectionHandle {
  api: { settings: SettingsApi }
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
  api: SettingsApi
}

const DEFAULT_DRAFT: Draft = {
  vision: { enabled: true, mode: 'openai-chat', baseURL: 'https://api.openai.com/v1', model: 'gpt-4o-mini', resolution: '1K', apiKey: '', klingAk: '', klingSk: '', runwayVersion: '' },
  image: { enabled: true, mode: 'openai-images', baseURL: 'https://api.openai.com/v1', model: 'gpt-image-1', resolution: '1K', apiKey: '', klingAk: '', klingSk: '', runwayVersion: '' },
  video: { enabled: true, mode: 'openai-videos', baseURL: 'https://api.openai.com/v1', model: 'sora-2', resolution: '2K', apiKey: '', klingAk: '', klingSk: '', runwayVersion: '2024-11-06' },
  audio: { enabled: true, mode: 'openai-tts', baseURL: 'https://api.openai.com/v1', model: 'gpt-4o-mini-tts', resolution: '1K', apiKey: '', klingAk: '', klingSk: '', runwayVersion: '' },
}

const MODES: Record<keyof Draft, string[]> = {
  vision: ['openai-chat', 'mock'],
  image: ['openai-images', 'modelverse-tasks', 'mock'],
  video: ['openai-videos', 'modelverse-tasks', 'kling', 'runway', 'mock'],
  audio: ['openai-tts', 'mock'],
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

const card: CSSProperties = { border: '1px solid rgba(128, 140, 160, .25)', borderRadius: 10, padding: 14, marginBottom: 12, background: 'rgba(255,255,255,.02)' }
const row: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(90px, 140px) 1fr', gap: 10, marginBottom: 8, alignItems: 'center' }
const label: CSSProperties = { fontSize: 12, opacity: .72 }
const input: CSSProperties = { width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(128,140,160,.35)', background: 'rgba(0,0,0,.15)', color: 'inherit' }
const button: CSSProperties = { padding: '7px 12px', borderRadius: 7, border: '1px solid rgba(128,160,255,.55)', background: 'rgba(80,130,255,.18)', color: 'inherit', cursor: 'pointer' }
const sectionTitle: CSSProperties = { fontSize: 15, fontWeight: 600, margin: '0 0 2px' }
const hint: CSSProperties = { fontSize: 12, opacity: .62, lineHeight: 1.5 }

function CapabilityCard(props: {
  title: string
  draft: CapabilityDraft
  modes: string[]
  onChange: (next: CapabilityDraft) => void
}): ReactNode {
  const { draft } = props
  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <strong>{props.title}</strong>
        <label style={{ fontSize: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="checkbox" checked={draft.enabled} onChange={event => props.onChange({ ...draft, enabled: event.target.checked })} />
          启用 / Enabled
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
            <input style={input} value={draft.model} placeholder="model id" onChange={event => props.onChange({ ...draft, model: event.target.value })} />
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

export function DirectorxSettingsSection(props: Partial<SectionInjected>): ReactNode {
  const api = props.api
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [draft, setDraft] = useState<Draft>(DEFAULT_DRAFT)
  const [view, setView] = useState<NamespaceView | undefined>(undefined)
  const [writable, setWritable] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  async function load(): Promise<void> {
    if (api === undefined) return
    setStatus(prev => prev === 'idle' ? 'loading' : prev)
    setError(undefined)
    try {
      const response = await api.describe({})
      if (!response.result.ok) throw new Error(response.result.error?.message ?? 'settings.describe failed')
      const target = response.result.value.namespaces.find(entry => entry.ns === 'directorx')
      if (target === undefined) {
        setStatus('ready')
        setWritable(response.result.value.writable)
        setError('未找到 directorx 设置命名空间。请确认插件已安装并重启 DSH。')
        return
      }
      setView(target)
      setDraft(readDraft(target.value))
      setWritable(response.result.value.writable)
      setStatus('ready')
    } catch (loadError) {
      setStatus('error')
      setError(messageOf(loadError))
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function save(): Promise<void> {
    if (api === undefined || view === undefined || saving) return
    setSaving(true)
    setSaved(false)
    setError(undefined)
    try {
      const ops: Array<{ op: 'set' | 'unset'; path: string[]; value?: unknown }> = []
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
      const response = await api.mutate({ ns: 'directorx', ops, expectedRevision: view.revision })
      if (!response.result.ok) throw new Error(response.result.error?.message ?? 'settings.mutate failed')
      setView(response.result.value)
      setDraft(readDraft(response.result.value.value))
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2500)
    } catch (saveError) {
      setError(messageOf(saveError))
    } finally {
      setSaving(false)
    }
  }

  if (api === undefined) return null
  if (status === 'loading' || status === 'idle') return <div style={{ padding: 18, opacity: .7 }}>正在加载 DirectorX 模型配置…</div>
  if (status === 'error') return (
    <div style={{ padding: 18 }}>
      <p>{error}</p>
      <button style={button} onClick={() => void load()}>重试</button>
    </div>
  )

  return (
    <div style={{ padding: 18 }}>
      <h2 style={sectionTitle}>DirectorX 模型</h2>
      <p style={hint}>为视觉、图像生成、视频生成、音频生成分别配置 Base URL、API Key、配置方式与能力开关。配置保存到 DSH settings（`directorx` 命名空间），无需重启即时生效。</p>
      {!writable ? <p style={hint}>当前 settings 后端只读，无法保存修改。</p> : null}
      {error !== undefined ? <p role="alert" style={{ color: '#ff9b8f', fontSize: 12 }}>{error}</p> : null}
      {saved ? <p role="status" style={{ color: '#8fdc9f', fontSize: 12 }}>已保存并热更新工具注册。</p> : null}
      {Object.keys(draft).map(key => {
        const capabilityKey = key as keyof Draft
        return (
          <CapabilityCard
            key={capabilityKey}
            title={CAPABILITY_LABEL[capabilityKey]}
            draft={draft[capabilityKey]}
            modes={MODES[capabilityKey]}
            onChange={(next) => { setDraft(current => ({ ...current, [capabilityKey]: next })) }}
          />
        )
      })}
      <button style={button} disabled={saving || !writable} onClick={() => void save()}>
        {saving ? '保存中…' : '保存全部配置'}
      </button>
    </div>
  )
}