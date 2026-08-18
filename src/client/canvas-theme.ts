import type { CSSProperties } from 'react'

/**
 * Canvas stage tokens. Black field, glass chrome, white selection.
 * Agent work stays in DSH — these tokens are visual only.
 */
export const dx = {
  black: '#070707',
  field: 'radial-gradient(980px 620px at 50% 32%, #161412 0%, #0c0b0a 48%, #060606 100%)',
  chrome: 'rgba(18,17,16,.78)',
  ink: '#f4f4f4',
  mute: '#9a9a9a',
  dim: '#6a6a6a',
  ghost: 'rgba(255,255,255,.06)',
  ghostStrong: 'rgba(255,255,255,.11)',
  hairline: 'rgba(255,255,255,.10)',
  hairlineStrong: 'rgba(255,255,255,.16)',
  selected: 'rgba(255,244,228,.92)',
  glow: '0 0 0 1px rgba(255,236,210,.55), 0 16px 36px rgba(0,0,0,.48)',
  radiusCard: 16,
  radiusBtn: 10,
  radiusRail: 22,
  font: '"Inter", "SF Pro Text", "PingFang SC", system-ui, sans-serif',
  mediaW: 400,
  mediaH: 220,
  mediaThumb: 250,
  textW: 250,
  textH: 250,
  groupW: 640,
  groupH: 460,
  minZoom: 0.1,
  maxZoom: 2.5,
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
  boxShadow: '0 22px 56px rgba(0,0,0,.52), inset 0 1px 0 rgba(255,244,228,.06)',
  color: dx.ink,
  fontFamily: dx.font,
  backdropFilter: 'blur(22px) saturate(1.35)',
  WebkitBackdropFilter: 'blur(22px) saturate(1.35)',
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
