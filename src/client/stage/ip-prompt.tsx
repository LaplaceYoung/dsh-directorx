import { type CSSProperties, type ReactNode, useMemo, useRef, type KeyboardEvent, type Ref, type UIEvent } from 'react'
import { askDshRewriteText, scanIpRisk } from '../../ip-lexicon.ts'
import { dx } from '../canvas-theme.ts'

export const ASK_DSH_REWRITE = 'directorx-ask-dsh'

export function askDsh(text: string): void {
  if (typeof window === 'undefined' || text.trim() === '') return
  window.dispatchEvent(new CustomEvent(ASK_DSH_REWRITE, { detail: { text } }))
}

export function PromptIpField(props: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  inputRef?: Ref<HTMLTextAreaElement>
  className?: string
  style?: CSSProperties
  onKeyDown?: (event: KeyboardEvent<HTMLTextAreaElement>) => void
  compact?: boolean
}): ReactNode {
  const hits = useMemo(() => scanIpRisk(props.value), [props.value])
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const handoff = () => {
    const text = askDshRewriteText(props.value)
    if (text !== '') askDsh(text)
  }
  const onScroll = (event: UIEvent<HTMLTextAreaElement>) => {
    const node = overlayRef.current
    if (node === null) return
    node.scrollTop = event.currentTarget.scrollTop
    node.scrollLeft = event.currentTarget.scrollLeft
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, flex: props.style?.flex === 1 ? 1 : undefined }}>
      <div style={{ position: 'relative', minWidth: 0 }}>
        {hits.length > 0 ? (
          <div
            ref={overlayRef}
            aria-hidden
            style={{
              ...props.style,
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              whiteSpace: 'pre-wrap',
              overflow: 'hidden',
              wordBreak: 'break-word',
              color: dx.ink,
              padding: props.style?.padding ?? 0,
            }}
          >
            {paintPrompt(props.value, hits)}
          </div>
        ) : null}
        <textarea
          ref={props.inputRef}
          className={props.className}
          value={props.value}
          placeholder={props.placeholder}
          rows={props.rows}
          onChange={event => props.onChange(event.target.value)}
          onKeyDown={props.onKeyDown}
          onScroll={onScroll}
          style={{
            ...props.style,
            position: 'relative',
            width: '100%',
            boxSizing: 'border-box',
            padding: props.style?.padding ?? 0,
            background: hits.length > 0 ? 'transparent' : props.style?.background,
            color: hits.length > 0 ? 'transparent' : (props.style?.color ?? dx.ink),
            caretColor: dx.ink,
          }}
        />
      </div>
      {hits.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 10.5, color: '#ff8a80' }}>可能存在版权风险 · 点名 IP 交给 DSH 按情境改写</span>
            <button
              type="button"
              className="dx-hit"
              title="交给 DSH：按泛化方法结合当前镜头写细，并记入项目记忆"
              onClick={handoff}
              style={{
                border: '1px solid rgba(255,138,128,.45)',
                background: 'rgba(255,80,70,.12)',
                color: '#ffc7c2',
                borderRadius: 999,
                padding: '2px 8px',
                fontSize: 10.5,
                cursor: 'pointer',
              }}
            >
              交给 DSH 改写
            </button>
            {hits.map(hit => (
              <span
                key={`${hit.start}-${hit.term}`}
                title={hit.risk}
                style={{ fontSize: 10.5, color: '#ffc7c2' }}
              >
                「{hit.term}」
              </span>
            ))}
          </div>
          {props.compact === true ? null : (
            <div style={{ fontSize: 10.5, color: dx.mute, lineHeight: 1.45 }}>
              不要套固定替换句。按属性轴写细，并加负向排除
              {hits[0] !== undefined && hits[0].exclude.length > 0 ? `（${hits[0].exclude.slice(0, 4).join(' / ')}）` : ''}
              。用过的改写会记入本项目记忆。
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

function paintPrompt(text: string, hits: ReturnType<typeof scanIpRisk>): ReactNode {
  if (hits.length === 0) return text
  const parts: ReactNode[] = []
  let cursor = 0
  hits.forEach((hit, index) => {
    if (hit.start > cursor) parts.push(text.slice(cursor, hit.start))
    parts.push(
      <span
        key={`${hit.start}-${index}`}
        title={hit.risk}
        style={{
          textDecorationLine: 'underline',
          textDecorationStyle: 'wavy',
          textDecorationColor: '#ff5a4e',
          textDecorationThickness: 2,
          textUnderlineOffset: 3,
        }}
      >
        {text.slice(hit.start, hit.end)}
      </span>,
    )
    cursor = hit.end
  })
  if (cursor < text.length) parts.push(text.slice(cursor))
  return parts
}
