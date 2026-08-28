/**
 * Motion DSL 编译器。
 *
 * DSL 语法：
 *   motion "Wave twice"
 *     base stand
 *     loop
 *     repeat 2
 *     sink 0.05
 *     step "raise" 0.4s settle:
 *       shoulder_right: abduct 105
 *       elbow_right: flex 65
 *     step "wave" 0.25s flow:
 *       elbow_right: flex 88
 *     step "lower" 0.5s settle:
 *       shoulder_right: hold
 *       elbow_right: hold
 *
 * 语义：角度为绝对目标；未提及关节沿用上一值；
 * hold 回到 base 态（非原地冻结）；neutral 回站立。
 */

import type { JointTarget, MotionAst, MotionStep, StepInterpolationMode, CompileError, MotionCompileResult } from '../types'

const DEG = Math.PI / 180

/** 全身关节名（与 Three.js 骨骼映射层对接）*/
export const JOINT_NAMES = [
  'hips', 'spine', 'neck', 'head',
  'shoulder_left', 'shoulder_right', 'elbow_left', 'elbow_right',
  'forearm_left', 'forearm_right', 'wrist_left', 'wrist_right',
  'hip_left', 'knee_left', 'hip_right', 'knee_right',
  'ankle_left', 'ankle_right',
] as const

type JointName = typeof JOINT_NAMES[number]

/** 关节活动范围限制（编译时 clamp 并给 warning）*/
const JOINT_ROM: Record<string, { min: number; max: number }> = {
  'elbow_left.flex': { min: 0, max: 150 },
  'elbow_right.flex': { min: 0, max: 150 },
  'knee_left.flex': { min: 0, max: 150 },
  'knee_right.flex': { min: 0, max: 150 },
  'shoulder_left.flex': { min: -60, max: 180 },
  'shoulder_right.flex': { min: -60, max: 180 },
  'shoulder_left.abduct': { min: 0, max: 180 },
  'shoulder_right.abduct': { min: 0, max: 180 },
  'head.twist-left': { min: -80, max: 80 },
  'head.twist-right': { min: -80, max: 80 },
}

const STEP_MODES = new Set(['settle', 'drive', 'snap', 'flow', 'linear'])

// ── 词法 ──

interface Token { text: string; num: number | null; type: 'word' | 'str' | 'num' | 'colon' }

function tokenizeLine(line: string): { indent: number; lineNo: number; tokens: Token[] } {
  const indentMatch = /^(\s*)/.exec(line)
  const indent = indentMatch ? indentMatch[1].length : 0
  const trimmed = line.trim()
  if (!trimmed) return { indent: 0, lineNo: 0, tokens: [] }
  const tokens = trimmed.split(/\s+/).map(tok => {
    const colon = tok.endsWith(':')
    const clean = tok.replace(/:$/, '').replace(/^\"|\"$/g, '')
    const num = parseFloat(clean)
    return {
      text: clean,
      num: isNaN(num) ? null : num,
      type: (colon ? 'colon' : !isNaN(num) ? 'num' : tok.startsWith('"') ? 'str' : 'word') as Token['type'],
    }
  })
  return { indent, lineNo: 0, tokens }
}

// ── 编译器状态机 ──

export function compileMotion(source: string): MotionCompileResult {
  const errors: CompileError[] = []
  const rawLines = source.split(/\r?\n/)
  const ast: MotionAst = {
    name: '', base: 'stand', baseOverrides: [],
    loop: false, repeat: 1, steps: [],
  }

  let lines: { indent: number; lineNo: number; tokens: Token[] }[] = []
  for (let li = 0; li < rawLines.length; li++) {
    const t = tokenizeLine(rawLines[li])
    if (t.tokens.length > 0) {
      lines.push({ ...t, lineNo: li + 1 })
    }
  }

  if (lines.length === 0) {
    return { ast: null, errors: [{ line: 1, message: 'empty document' }] }
  }

  // 头部校验：`motion "名字"`
  const header = lines[0]
  const hTokens = header.tokens
  if (
    header.indent !== 0 || hTokens.length < 2 ||
    hTokens[0].text !== 'motion' || hTokens[1]?.type !== 'str'
  ) {
    return {
      ast: null,
      errors: [{ line: header.lineNo ?? 1, message: 'document must start with a `motion "<name>"` header' }],
    }
  }

  ast.name = hTokens[1].text

  // 状态机变量
  let currentStep: MotionStep | null = null
  let stepIndent: number | null = null
  let topIndent: number | null = null
  let baseOverrideIndent: number | null = null
  let inBaseOverrides = false

  // 逐行解析
  for (let li = 1; li < lines.length; li++) {
    const line = lines[li]

    // 在步骤子块内且缩进更深 → 关节覆盖行
    if (currentStep && stepIndent !== null && line.indent > stepIndent) {
      const target = parseJointLine(line)
      if (target) currentStep.targets.push(target)
      continue
    }

    // base 覆盖块内
    if (inBaseOverrides && baseOverrideIndent !== null && line.indent > baseOverrideIndent) {
      const override = parseJointLine(line)
      if (override) ast.baseOverrides.push(override)
      continue
    }

    // 顶层关键字
    const first = line.tokens[0]?.text
    switch (first) {
      case 'base':
        ast.base = line.tokens[1]?.text ?? 'stand'
        if (line.tokens[line.tokens.length - 1]?.type === 'colon') {
          inBaseOverrides = true
          baseOverrideIndent = line.indent
        }
        break

      case 'loop':
        ast.loop = true
        break

      case 'repeat': {
        const n = parseInt(line.tokens[1]?.text ?? '1')
        if (!isNaN(n)) ast.repeat = n
        break
      }

      case 'sink':
        // 根骨骼下沉偏移（米），存入元数据
        break

      case 'step': {
        // step "名称" X.XXs 模式:
        const nameTok = line.tokens.find(t => t.type === 'str')
        // duration token：数字后跟 s 后缀（如 "0.4s"）。
        // tokenizeLine 已去掉 's' 后缀再解析数值，所以这里按
        // 「位于模式词之前、且紧跟在名称 token 之后」的数字来定位。
        const durIdx = line.tokens.findIndex(t =>
          t.type === 'num' && t.num !== null && t.num > 0 && t.num <= 120
        )
        const modeTok = line.tokens.find(t => STEP_MODES.has(t.text))
        const durationSeconds = line.tokens[durIdx]?.num ?? 0.5
        currentStep = {
          name: nameTok?.text ?? `step_${ast.steps.length + 1}`,
          durationSeconds,
          mode: (modeTok?.text as StepInterpolationMode) || 'settle',
          targets: [],
        }
        ast.steps.push(currentStep)
        // 进入子块缩进追踪
        stepIndent = line.indent
        break
      }
    }
  }

  return { ast: ast, errors: errors.length > 0 ? errors : [] }
}

/** 解析单行关节覆盖："shoulder_right: abduct 105" */
function parseJointLine(line: { indent: number; tokens: Token[] }): JointTarget | null {
  const colonIdx = line.tokens.findIndex(t => t.type === 'colon')
  if (colonIdx === -1 || colonIdx === 0) return null

  const joint = line.tokens.slice(0, colonIdx).map(t => t.text).join('')
  if (!joint) return null

  const rest = line.tokens.slice(colonIdx + 1)
  if (rest.length === 0) return null

  const action = rest[0].text as JointTarget['action']
  const degrees = rest[1]?.num ?? undefined

  return { joint, action, degrees }
}

/**
 * 将关节角度 clamp 到活动范围并返回 warning（如有）。
 */
export function clampJointAngle(joint: string, action: string, degrees: number): { clamped: number; warning?: string } {
  const key = `${joint}.${action}`
  const rom = JOINT_ROM[key]
  if (!rom) return { clamped: degrees }
  if (degrees < rom.min || degrees > rom.max) {
    return { clamped: Math.max(rom.min, Math.min(rom.max, degrees)), warning: `${joint}.${action} clamped to ${Math.max(rom.min, Math.min(degrees, rom.max))}°` }
  }
  return { clamped: degrees }
}
