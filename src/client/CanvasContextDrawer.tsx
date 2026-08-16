import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from 'react'

/**
 * Right-hand canvas context: DSH-owned generate intents, character anchors,
 * and the current selection as @refs. The UI never writes generating nodes.
 */

export interface CanvasIntentRow {
  id: string
  kind: 'image' | 'video'
  prompt: string
  sourceId?: string
  selectedIds: string[]
  status: 'pending' | 'taken' | 'done' | 'cancelled'
  at: number
}

export interface CharacterRow {
  name: string
  description: string
  refPath: string
  outfit?: string
  props?: string
}

export function CanvasContextDrawer({
  open,
  onClose,
  selectedLabels,
  onAskDsh,
  style,
  iconBtn,
}: {
  open: boolean
  onClose: () => void
  selectedLabels: string[]
  onAskDsh?: (text: string) => Promise<void>
  style: CSSProperties
  iconBtn: CSSProperties
}): ReactNode {
  const [intents, setIntents] = useState<CanvasIntentRow[]>([])
  const [characters, setCharacters] = useState<CharacterRow[]>([])
  const [charName, setCharName] = useState('')
  const [charDesc, setCharDesc] = useState('')
  const [charRef, setCharRef] = useState('')
  const [busy, setBusy] = useState<string | undefined>(undefined)

  const refreshIntents = useCallback(async () => {
    const response = await fetch('/directorx/canvas/intent')
    if (!response.ok) return
    const data = await response.json() as { intents?: CanvasIntentRow[] }
    setIntents(Array.isArray(data.intents) ? data.intents : [])
  }, [])

  const refreshCharacters = useCallback(async () => {
    const response = await fetch('/directorx/characters')
    if (!response.ok) return
    const data = await response.json() as { characters?: CharacterRow[] }
    setCharacters(Array.isArray(data.characters) ? data.characters : [])
  }, [])

  useEffect(() => {
    if (!open) return
    let live = true
    const pull = async () => {
      try {
        await Promise.all([refreshIntents(), refreshCharacters()])
      } catch {
        // drawer refresh is best-effort
      }
      if (!live) return
    }
    void pull()
    const timer = window.setInterval(() => { void refreshIntents() }, 2500)
    return () => {
      live = false
      window.clearInterval(timer)
    }
  }, [open, refreshIntents, refreshCharacters])

  const pending = intents.filter(item => item.status === 'pending' || item.status === 'taken')

  const ackIntent = async (id: string, status: 'cancelled' | 'done') => {
    setBusy(id)
    try {
      await fetch('/directorx/canvas/intent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      await refreshIntents()
    } finally {
      setBusy(undefined)
    }
  }

  const rehandIntent = async (intent: CanvasIntentRow) => {
    if (onAskDsh === undefined) return
    setBusy(intent.id)
    try {
      await onAskDsh([
        '[DirectorX 画布指令 · 再提醒]',
        `请领取 ${intent.id}（${intent.kind}）：${intent.prompt}`,
        '用 directorx_canvas_intents / directorx_canvas_continue 改画布，不要让 UI 写 generating 节点。',
      ].join('\n'))
    } finally {
      setBusy(undefined)
    }
  }

  const registerCharacter = async () => {
    if (charName.trim() === '' || charRef.trim() === '') return
    setBusy('char')
    try {
      const response = await fetch('/directorx/characters', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: charName.trim(), description: charDesc.trim(), refPath: charRef.trim() }),
      })
      if (!response.ok) throw new Error(await response.text())
      setCharName('')
      setCharDesc('')
      setCharRef('')
      await refreshCharacters()
    } finally {
      setBusy(undefined)
    }
  }

  const askUseCharacter = async (name: string) => {
    if (onAskDsh === undefined) return
    await onAskDsh(`请在后续生成里使用已注册角色「${name}」（directorx_character_list / characters 参数），保持主体一致。`)
  }

  if (!open) return null
  return (
    <div className="dx-pop" style={style}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,.1)' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#f5f5f5', flex: 1 }}>画布上下文</span>
        {pending.length > 0 ? (
          <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 999, background: 'rgba(79,157,255,.18)', color: '#9dc3ff' }}>
            待领 {pending.length}
          </span>
        ) : null}
        <button className="dx-tool-icon" style={{ ...iconBtn, width: 28, height: 28 }} onClick={onClose} title="收起">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6"/></svg>
        </button>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, padding: 12, overflowY: 'auto' }}>
        <section>
          <div style={sectionLabel}>画布引用（当前选中）</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {selectedLabels.length === 0 ? (
              <span style={{ fontSize: 11.5, color: '#666' }}>没有选中节点——选中即作为 DSH 的 @ 引用。</span>
            ) : selectedLabels.map(label => (
              <span key={label} style={chip}>@{label}</span>
            ))}
          </div>
        </section>

        <section>
          <div style={sectionLabel}>待 DSH 领取的画布指令</div>
          {intents.length === 0 ? (
            <div style={{ fontSize: 11.5, color: '#8a8a8a', lineHeight: 1.6 }}>
              底部生成条只入队指令。DSH 用 directorx_canvas_intents（claim: true）领取后再改画布。
            </div>
          ) : intents.slice(0, 12).map(intent => (
            <div key={intent.id} style={intentCard}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                <span style={kindBadge}>{intent.kind === 'image' ? '图像' : '视频'}</span>
                <span style={{ fontSize: 10.5, color: STATUS_COLOR[intent.status] }}>{STATUS_LABEL[intent.status]}</span>
                <span style={{ marginLeft: 'auto', fontSize: 10, color: '#777' }}>{new Date(intent.at).toLocaleTimeString()}</span>
              </div>
              <div style={{ fontSize: 11.5, color: '#d8d8d8', lineHeight: 1.5, marginBottom: 6 }}>
                {intent.prompt.length > 90 ? `${intent.prompt.slice(0, 90)}…` : intent.prompt}
              </div>
              {intent.sourceId !== undefined ? <div style={{ fontSize: 10.5, color: '#888', marginBottom: 6 }}>源 {intent.sourceId}</div> : null}
              {intent.status === 'pending' || intent.status === 'taken' ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    disabled={busy === intent.id}
                    onClick={() => { void rehandIntent(intent) }}
                    style={ghostBtn}
                  >
                    再交给 DSH
                  </button>
                  <button
                    disabled={busy === intent.id}
                    onClick={() => { void ackIntent(intent.id, 'cancelled') }}
                    style={{ ...ghostBtn, color: '#f0a3a3', borderColor: 'rgba(240,163,163,.4)' }}
                  >
                    取消
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </section>

        <section>
          <div style={sectionLabel}>角色库（主体一致性锚点）</div>
          <div style={{ fontSize: 11, color: '#8a8a8a', lineHeight: 1.6, marginBottom: 8 }}>
            注册参考图后，生成工具可通过 characters 参数注入。这里只改 characters.json，不写画布。
          </div>
          {characters.map(card => (
            <div key={card.name} style={intentCard}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {/\.(png|jpe?g|webp|gif|svg)$/i.test(card.refPath) || card.refPath.startsWith('http') ? (
                  <img
                    src={/^https?:\/\//i.test(card.refPath) ? card.refPath : `/directorx/media?path=${encodeURIComponent(card.refPath)}`}
                    alt=""
                    style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 8, background: '#111' }}
                  />
                ) : null}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12, color: '#f0f0f0' }}>{card.name}</div>
                  <div style={{ fontSize: 10.5, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.description || card.refPath}</div>
                </div>
                <button style={ghostBtn} onClick={() => { void askUseCharacter(card.name) }}>让 DSH 用</button>
              </div>
            </div>
          ))}
          <input value={charName} onChange={event => setCharName(event.target.value)} placeholder="角色名" style={field} />
          <input value={charRef} onChange={event => setCharRef(event.target.value)} placeholder="参考图路径或 URL" style={field} />
          <input value={charDesc} onChange={event => setCharDesc(event.target.value)} placeholder="外貌/服装简述（可选）" style={field} />
          <button
            disabled={busy === 'char' || charName.trim() === '' || charRef.trim() === ''}
            onClick={() => { void registerCharacter() }}
            style={{ ...ghostBtn, opacity: charName.trim() === '' || charRef.trim() === '' ? .45 : 1 }}
          >
            注册角色
          </button>
        </section>

        <div style={{ fontSize: 11, color: '#9b9b9b', lineHeight: 1.7, border: '1px solid rgba(79,157,255,.25)', background: 'rgba(79,157,255,.06)', borderRadius: 12, padding: 10 }}>
          画布由 DSH 掌管：生成条只入队 directorx_canvas_intents。DSH 用 claim 领取后再改分镜，这里只显示进度与引用。
        </div>
      </div>
    </div>
  )
}

const sectionLabel: CSSProperties = { fontSize: 11.5, color: '#9b9b9b', marginBottom: 6 }
const chip: CSSProperties = { fontSize: 10.5, padding: '3px 8px', borderRadius: 999, border: '1px solid rgba(255,255,255,.16)', background: 'rgba(255,255,255,.06)', color: '#e8e8e8' }
const intentCard: CSSProperties = { padding: '8px 0', borderTop: '1px solid rgba(255,255,255,.08)' }
const kindBadge: CSSProperties = { fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 5, background: 'rgba(255,255,255,.12)', color: '#e8e8e8' }
const ghostBtn: CSSProperties = { padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,.28)', background: 'transparent', color: '#e8e8e8', fontSize: 11.5, cursor: 'pointer' }
const field: CSSProperties = { width: '100%', boxSizing: 'border-box', marginBottom: 6, padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.04)', color: '#f5f5f5', fontSize: 12 }
const STATUS_LABEL: Record<CanvasIntentRow['status'], string> = {
  pending: '待领取',
  taken: 'DSH 处理中',
  done: '已完成',
  cancelled: '已取消',
}
const STATUS_COLOR: Record<CanvasIntentRow['status'], string> = {
  pending: '#e8b64f',
  taken: '#9dc3ff',
  done: '#8fdc9f',
  cancelled: '#888',
}
