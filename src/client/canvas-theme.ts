import type { CSSProperties } from 'react'

/**
 * Canvas chrome: libtv near-black + tapnow ghost layers.
 * Agent work stays in DSH — these tokens are visual only.
 */
export const dx = {
  black: '#000000',
  chrome: '#141414',
  ink: '#f5f5f5',
  mute: '#9b9b9b',
  ghost: 'rgba(255,255,255,.06)',
  hairline: 'rgba(255,255,255,.10)',
  hairlineStrong: 'rgba(255,255,255,.16)',
  selected: 'rgba(245,245,245,.95)',
  radiusCard: 16,
  radiusBtn: 10,
  font: '"Inter", "SF Pro Text", "PingFang SC", system-ui, sans-serif',
} as const

export const dxChrome: CSSProperties = {
  background: dx.chrome,
  border: `1px solid ${dx.hairline}`,
  boxShadow: '0 12px 32px rgba(0,0,0,.55)',
  color: dx.ink,
  fontFamily: dx.font,
}

export const dxGhostBtn: CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: dx.radiusBtn,
  border: '1px solid transparent',
  background: 'transparent',
  color: '#efefef',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

export const dxPill: CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 9999,
  border: 'none',
  background: '#f5f5f5',
  color: '#171717',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
