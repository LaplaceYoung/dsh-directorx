/**
 * Campath DSL 编译器。
 *
 * DSL 语法：
 *   campath "Hero reveal"
 *     look target "8-char-id" | look pair "a" "b" | look at x y z | look ahead
 *     easing easeInOut
 *     from 0 1.2 7 fov 40
 *     dolly in 3.5 3s
 *     hold 0.5s
 *     orbit right 120 4s rise 1.2 fov 50
 *
 * 段类型：move / dolly / truck / crane / orbit / hold
 * 以及 zoom / dolly-zoom / pan / tilt / whip / roll / jib / boom / pedestal / arc / spiral / push / pull / follow。
 * 别名在解析期折成规范段。总时长 0.5–120 秒。段间连接为精确拐角；圆滑曲线用 orbit 而非 move 链。
 */

import * as THREE from 'three'
import type { Vec3, CameraPathAst, CameraSegment, CameraLookMode, EasingType } from '../types'

// ── AST 类型（内部）──

export interface ParsedCampath {
  name: string
  look: CameraLookMode
  easing: EasingType
  from: Vec3
  initialFov: number
  segments: CameraSegment[]
  loop: false | 'loop' | 'pingpong'
}

export interface CampathError { line: number; message: string }

export interface CampathResult {
  ast: ParsedCampath | null
  errors: CampathError[]
}

// ── 词法分析：把每行拆成 token ──

interface Token { text: string; num: number | null }

function tokenizeLine(line: string): Token[] {
  return line.trim().split(/\s+/).filter(Boolean).map(tok => {
    const n = parseFloat(tok)
    return { text: tok, num: Number.isFinite(n) ? n : null }
  })
}

/** 把 "3.5s" → 3500ms；无 s 后缀返回 null */
function parseDurationS(tok: Token): number | null {
  if (tok.text.endsWith('s') && tok.num !== null) return tok.num * 1000
  return null
}

// ── 解析器 ──

export function compileCampath(source: string): CampathResult {
  const rawLines = source.split(/\r?\n/).filter(l => l.trim() && !l.trim().startsWith('#'))
  const errors: CampathError[] = []
  let name = ''
  let look: CameraLookMode = { mode: 'ahead' }
  let easing: EasingType = 'linear'
  let from: Vec3 = { x: 0, y: 1.2, z: 7 }
  let initialFov = 40
  let loop: false | 'loop' | 'pingpong' = false
  const segments: CameraSegment[] = []

  for (let li = 0; li < rawLines.length; li++) {
    const lineNo = li + 1
    const tokens = tokenizeLine(rawLines[li])
    if (tokens.length === 0) continue
    const head = tokens[0].text

    // 头部
    if (head.startsWith('campath')) {
      const m = /campath\s+"([^"]+)"/.exec(rawLines[li])
      if (m) name = m[1]
      continue
    }

    // easing
    if (head === 'easing') {
      const v = tokens[1]?.text as EasingType
      if (['linear','easeIn','easeOut','easeInOut','smoothstep'].includes(v)) easing = v
      continue
    }

    // loop
    if (head === 'loop' || (tokens[0]?.num !== null && head.match(/^\d+$/) && tokens[1]?.text === undefined)) continue

    // from
    if (head === 'from') {
      from = { x: tokens[1]?.num ?? 0, y: tokens[2]?.num ?? 1.2, z: tokens[3]?.num ?? 7 }
      if (tokens.find(t => t.text === 'fov')) {
        const fi = tokens.findIndex(t => t.text === 'fov')
        initialFov = tokens[fi + 1]?.num ?? 40
      }
      continue
    }

    // look
    if (head === 'look') {
      const mode = tokens[1]?.text
      if (mode === 'target' && tokens[2]) look = { mode: 'target', targetId: tokens[2].text.replace(/^"|"$/g, '') }
      else if (mode === 'pair' && tokens[2] && tokens[3]) {
        const screenIdx = tokens.findIndex(t => t.text === 'screen')
        look = {
          mode: 'pair',
          a: tokens[2].text.replace(/^"|"$/g, ''),
          b: tokens[3].text.replace(/^"|"$/g, ''),
          screen: screenIdx !== -1 ? tokens[screenIdx + 1]?.num ?? 0.5 : 0.5,
        }
      }
      else if (mode === 'at') look = { mode: 'at', point: { x: tokens[2]?.num ?? 0, y: tokens[3]?.num ?? 0, z: tokens[4]?.num ?? 0 } }
      else look = { mode: 'ahead' }
      continue
    }

    // 段类型
    const dur = (() => {
      const dTok = tokens.find((t, i) => i > 0 && t.text.endsWith('s') && t.num !== null)
      return dTok ? dTok.num! * 1000 : 2000
    })()
    const fovIdx = tokens.findIndex(t => t.text === 'fov')
    const segFov = fovIdx !== -1 ? tokens[fovIdx + 1]?.num ?? undefined : undefined

    switch (head) {
      case 'move': {
        const toIdx = tokens.findIndex(t => t.text === 'to')
        segments.push({ kind: 'move', to: { x: tokens[toIdx+1]?.num ?? 0, y: tokens[toIdx+2]?.num ?? 0, z: tokens[toIdx+3]?.num ?? 0 }, durationS: dur, fov: segFov })
        break
      }
      case 'dolly':
      case 'push':
      case 'pull':
      case 'follow': {
        const dirTok = tokens[1]?.text
        const hasDir = dirTok === 'in' || dirTok === 'out'
        const metres = (hasDir ? tokens[2]?.num : tokens[1]?.num) ?? 1
        const direction: 'in' | 'out' = head === 'pull' ? 'out' : head === 'push' || head === 'follow' ? 'in' : (hasDir ? dirTok : 'in')
        segments.push({ kind: 'dolly', direction, metres, durationS: dur, fov: segFov })
        break
      }
      case 'truck':
      case 'track':
        segments.push({ kind: 'truck', direction: tokens[1]?.text as 'left'|'right', metres: tokens[2]?.num ?? 1, durationS: dur })
        break
      case 'crane':
      case 'pedestal':
        segments.push({ kind: 'crane', direction: tokens[1]?.text as 'up'|'down', metres: tokens[2]?.num ?? 1, durationS: dur, fov: segFov })
        break
      case 'orbit':
      case 'arc':
      case 'spiral': {
        const dir = tokens[1]?.text as 'left'|'right'
        const deg = tokens[2]?.num ?? (head === 'arc' ? 60 : 90)
        let riseM: number | undefined
        let radiusM: number | undefined
        const ri = tokens.findIndex(t => t.text === 'rise')
        if (ri !== -1) riseM = tokens[ri+1]?.num ?? undefined
        const radi = tokens.findIndex(t => t.text === 'radius')
        if (radi !== -1) radiusM = tokens[radi+1]?.num ?? undefined
        if (head === 'spiral' && riseM == null) riseM = 1.2
        segments.push({ kind: 'orbit', direction: dir, degrees: deg, durationS: dur, riseM, radiusM, fov: segFov })
        break
      }
      case 'hold':
        segments.push({ kind: 'hold', durationS: dur, fov: segFov })
        break
      case 'zoom':
      case 'punch': {
        const zoomDir = tokens[1]?.text === 'out' ? 'out' : 'in'
        segments.push({ kind: 'zoom', direction: zoomDir, degrees: tokens[2]?.num ?? (head === 'punch' ? 12 : 10), durationS: dur, fov: segFov })
        break
      }
      case 'dolly-zoom':
      case 'dolly_zoom':
        segments.push({ kind: 'dolly-zoom', direction: tokens[1]?.text as 'in'|'out', metres: tokens[2]?.num ?? 1, durationS: dur })
        break
      case 'jib':
      case 'boom':
        segments.push({ kind: 'jib', direction: tokens[1]?.text as 'up'|'down', metres: tokens[2]?.num ?? 1, durationS: dur, fov: segFov })
        break
      case 'pan':
      case 'whip':
        segments.push({ kind: 'pan', direction: tokens[1]?.text as 'left'|'right', degrees: tokens[2]?.num ?? (head === 'whip' ? 60 : 30), durationS: dur })
        break
      case 'tilt':
        segments.push({ kind: 'tilt', direction: tokens[1]?.text as 'up'|'down', degrees: tokens[2]?.num ?? 15, durationS: dur })
        break
      case 'roll':
        segments.push({ kind: 'roll', direction: tokens[1]?.text as 'left'|'right', degrees: tokens[2]?.num ?? 12, durationS: dur })
        break
      default:
        errors.push({ line: lineNo, message: `unknown segment "${head}"` })
    }
  }

  if (!name) errors.push({ line: 1, message: 'missing campath header with quoted name' })

  return {
    ast: errors.length === 0 ? { name, look, easing, from, initialFov, segments, loop } : null,
    errors,
  }
}
