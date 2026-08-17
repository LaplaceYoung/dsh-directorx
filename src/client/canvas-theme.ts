import type { CSSProperties } from 'react'

/**
 * Canvas stage tokens. Visual language is tapnow: pure black field,
 * 6% ghost cards, 16px radius, white 95% selection, Inter.
 * Agent work stays in DSH — these tokens are visual only.
 */
export const dx = {
  black: '#000000',
  chrome: '#141414',
  ink: '#f5f5f5',
  mute: '#9b9b9b',
  dim: '#6a6a6a',
  ghost: 'rgba(255,255,255,.06)',
  ghostStrong: 'rgba(255,255,255,.10)',
  hairline: 'rgba(255,255,255,.10)',
  hairlineStrong: 'rgba(255,255,255,.16)',
  selected: 'rgba(245,245,245,.95)',
  radiusCard: 16,
  radiusBtn: 10,
  font: '"Inter", "SF Pro Text", "PingFang SC", system-ui, sans-serif',
  mediaW: 280,
  mediaH: 220,
  mediaThumb: 176,
  textW: 240,
  groupW: 640,
  groupH: 460,
  minZoom: 0.05,
  maxZoom: 4,
} as const

export const dxZ = {
  stage: 0,
  edges: 1,
  chrome: 20,
  sheet: 30,
  modal: 40,
} as const

export const dxChrome: CSSProperties = {
  background: 'rgba(20,20,20,.88)',
  border: `1px solid ${dx.hairline}`,
  boxShadow: '0 16px 40px rgba(0,0,0,.55)',
  color: dx.ink,
  fontFamily: dx.font,
  backdropFilter: 'blur(18px)',
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
