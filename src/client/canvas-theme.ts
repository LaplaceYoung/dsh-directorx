import type { CSSProperties } from 'react'

/**
 * Canvas stage tokens. Black field, glass chrome, white selection.
 * Agent work stays in DSH — these tokens are visual only.
 */
export const dx = {
  black: '#000000',
  field: '#000000',
  chrome: 'rgba(20, 20, 20, .92)',
  ink: '#f5f5f5',
  mute: '#9a9a9a',
  dim: '#6a6a6a',
  ghost: 'rgba(255,255,255,.06)',
  ghostStrong: 'rgba(255,255,255,.11)',
  hairline: 'rgba(255,255,255,.10)',
  hairlineStrong: 'rgba(255,255,255,.16)',
  selected: 'rgb(122,122,122)',
  glow: 'none',
  radiusCard: 16,
  radiusBtn: 10,
  radiusRail: 9999,
  font: '"Inter", "SF Pro Text", "PingFang SC", system-ui, sans-serif',
  mediaW: 400,
  mediaH: 220,
  mediaThumb: 250,
  textW: 250,
  textH: 250,
  groupW: 640,
  groupH: 460,
  minZoom: 0.15,
  maxZoom: 2,
} as const

export const dxZ = {
  stage: 0,
  edges: 1,
  chrome: 20,
  sheet: 30,
  modal: 40,
} as const

export const dxChrome: CSSProperties = {
  background: dx.chrome,
  border: `1px solid ${dx.hairline}`,
  boxShadow: 'none',
  color: dx.ink,
  fontFamily: dx.font,
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
}

export const dxGhostBtn: CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 11,
  border: '1px solid transparent',
  background: 'transparent',
  color: '#ececec',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
}

export const dxPill: CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 9999,
  border: 'none',
  background: '#f3f3f3',
  color: '#141414',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
}

export const INTER_HREF = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
