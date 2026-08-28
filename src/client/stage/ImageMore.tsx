import { useState, type ReactNode } from 'react'
import { dxGhostBtn } from '../canvas-theme.ts'
import { IconMore } from './icons.tsx'

export function ImageMore(props: {
  onExpand: () => void
  onErase: () => void
  onAnnotate: () => void
  onEnhance: () => void
  onPixels: () => void
  onCutout: () => void
  onSplit: (cols: number, rows: number) => void
}): ReactNode {
  const [open, setOpen] = useState(false)
  const [grid, setGrid] = useState<{ cols: number; rows: number } | undefined>(undefined)
  const rows: Array<{ label: string; run: () => void }> = [
    { label: '扩图', run: props.onExpand },
    { label: '擦除', run: props.onErase },
    { label: '标注', run: props.onAnnotate },
    { label: '增强', run: props.onEnhance },
    { label: '调整像素', run: props.onPixels },
    { label: '抠图', run: props.onCutout },
  ]
  return (
    <span style={{ position: 'relative', display: 'grid' }}>
      <button
        type="button"
        className="nodrag nopan dx-hit"
        title="更多"
        data-tip="更多"
        onClick={event => { event.stopPropagation(); setOpen(value => !value); setGrid(undefined) }}
        style={{
          width: 40, height: 40, border: 'none', borderRadius: 9999, background: 'transparent',
          color: 'rgba(245,245,245,.9)', cursor: 'pointer', display: 'grid', placeItems: 'center', padding: 0,
        }}
      >
        <IconMore size={14} />
      </button>
      {open ? (
        <div
          className="nodrag nopan"
          style={{
            position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
            marginTop: 8, width: 280, padding: 6, borderRadius: 14,
            background: 'rgba(18,18,18,.96)', border: '1px solid rgba(255,255,255,.12)',
            boxShadow: '0 16px 40px rgba(0,0,0,.45)', zIndex: 9,
          }}
        >
          {rows.map(row => (
            <button
              key={row.label}
              type="button"
              className="dx-menu-item"
              style={{
                display: 'flex', width: '100%', height: 34, padding: '0 10px', border: 'none',
                borderRadius: 8, background: 'transparent', color: 'rgba(245,245,245,.92)',
                fontSize: 12, cursor: 'pointer', textAlign: 'left',
              }}
              onClick={event => { event.stopPropagation(); setOpen(false); row.run() }}
            >
              {row.label}
            </button>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 10px', position: 'relative' }}>
            <span style={{ flex: 1, fontSize: 12, color: 'rgba(245,245,245,.92)' }}>快速切分</span>
            {[{ c: 2, r: 2 }, { c: 3, r: 3 }, { c: 4, r: 4 }].map(item => (
              <button
                key={`${item.c}x${item.r}`}
                type="button"
                className="dx-hit"
                style={{ ...dxGhostBtn, width: 'auto', height: 22, padding: '0 6px', fontSize: 10 }}
                onClick={event => { event.stopPropagation(); setOpen(false); props.onSplit(item.c, item.r) }}
              >
                {item.c}×{item.r}
              </button>
            ))}
            <button
              type="button"
              className="dx-hit"
              title="自选行列"
              style={{ ...dxGhostBtn, width: 22, height: 22, fontSize: 11 }}
              onMouseEnter={() => setGrid({ cols: 4, rows: 3 })}
              onClick={event => event.stopPropagation()}
            >
              ›
            </button>
            {grid !== undefined ? (
              <div
                style={{
                  position: 'absolute', left: '100%', top: 0, marginLeft: 8, padding: 8,
                  borderRadius: 12, background: 'rgba(18,18,18,.96)', border: '1px solid rgba(255,255,255,.12)',
                }}
                onMouseLeave={() => setGrid(undefined)}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 16px)', gap: 3 }}>
                  {Array.from({ length: 64 }, (_, index) => {
                    const col = (index % 8) + 1
                    const row = Math.floor(index / 8) + 1
                    const on = col <= grid.cols && row <= grid.rows
                    return (
                      <button
                        key={index}
                        type="button"
                        aria-label={`${col}×${row}`}
                        style={{
                          width: 16, height: 16, padding: 0, borderRadius: 3, border: 'none', cursor: 'pointer',
                          background: on ? 'rgba(255,255,255,.88)' : 'rgba(255,255,255,.12)',
                        }}
                        onMouseEnter={() => setGrid({ cols: col, rows: row })}
                        onClick={event => { event.stopPropagation(); setOpen(false); setGrid(undefined); props.onSplit(col, row) }}
                      />
                    )
                  })}
                </div>
                <div style={{ marginTop: 6, textAlign: 'center', fontSize: 11, color: 'rgba(245,245,245,.7)' }}>{grid.cols} × {grid.rows}</div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </span>
  )
}
