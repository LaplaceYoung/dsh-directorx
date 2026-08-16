import { CAMERA_SAFE_MOVES } from './storyboard.ts'
import { routeModel } from '../model-matrix.ts'

/**
 * 镜头语言 → 生成提示词确定性翻译器（导演技巧的 AIGC 应用层）：
 * 把景别/角度/运镜/布光/氛围/构图的结构化选择翻译成五轴装配提示词 +
 * 负面基线 + 规则引用。词表来自方法论规则 29-32/36-48 的沉淀。
 */

export interface ShotBuilderInput {
  subject: string
  action?: string
  shotSize?: 'ECU' | 'CU' | 'MCU' | 'MS' | 'MLS' | 'LS' | 'ELS'
  angle?: 'eye-level' | 'low' | 'high' | 'birds-eye' | 'worms-eye' | 'dutch' | 'OTS' | 'POV'
  cameraMove?: string
  lighting?: 'rembrandt' | 'low-key' | 'high-key' | 'neon' | 'golden-hour' | 'soft-window' | 'practical'
  mood?: string
  composition?: 'rule-of-thirds' | 'symmetry' | 'negative-space' | 'frame-in-frame' | 'depth-layers'
  durationSec?: number
}

export interface ShotBuilderOutput {
  prompt: string
  negative: string
  notes: string[]
  parts: Record<string, string>
}

const SHOT_SIZES: Record<string, { phrase: string; use: string }> = {
  ECU: { phrase: 'extreme close-up', use: '决定性细节与极端情绪；全片 1-2 次惜用（规则 36）' },
  CU: { phrase: 'close-up', use: '情绪货币：内心戏/反应镜头（规则 36）' },
  MCU: { phrase: 'medium close-up', use: '对话与情绪过渡的默认档' },
  MS: { phrase: 'medium shot', use: '信息默认值：交代动作（规则 36）' },
  MLS: { phrase: 'medium long shot', use: '人物与环境关系' },
  LS: { phrase: 'long shot', use: '建立空间：establishing 首镜' },
  ELS: { phrase: 'extreme long shot', use: '规模与孤寂：结尾拉远' },
}

const ANGLES: Record<string, { phrase: string; use: string }> = {
  'eye-level': { phrase: 'eye-level camera', use: '中立客观（规则 38 站位即权力）' },
  low: { phrase: 'low angle looking up', use: '仰角=权威/支配' },
  high: { phrase: 'high angle looking down', use: '俯角=弱势/渺小' },
  'birds-eye': { phrase: "bird's-eye view from directly above", use: '俯瞰收束/规模揭示（规则 46）' },
  'worms-eye': { phrase: "worm's-eye view from below", use: '压迫感/仰视张力' },
  dutch: { phrase: 'dutch angle, tilted horizon', use: '失衡/不安——克制使用' },
  OTS: { phrase: 'over-the-shoulder shot', use: '对话正反打（规则 38 视线匹配）' },
  POV: { phrase: 'POV shot through the eyes of the character', use: '主观代入（语料 234 视点）' },
}

const LIGHTING: Record<string, { phrase: string; use: string }> = {
  rembrandt: { phrase: 'Rembrandt key from screen-left lamp, no fill, 85:15 dark-to-light', use: '戏剧侧光（规则 31 命名光源与比例）' },
  'low-key': { phrase: 'low-key lighting, harsh shadows, chiaroscuro contrast', use: '悬疑/黑色电影（规则 39 高低调匹配）' },
  'high-key': { phrase: 'high-key lighting, soft even illumination, low contrast', use: '喜剧/广告（规则 39）' },
  neon: { phrase: 'neon signs as the only practical source, cyan and magenta spill on faces', use: '有源光律（规则 44）：光源在画内可见' },
  'golden-hour': { phrase: 'golden hour back-light, long shadows on the ground', use: '温暖氛围（规则 31）' },
  'soft-window': { phrase: 'soft window key from camera-left, warm lamp fill, cool hallway rim', use: '隐形光锚：逐镜复用同句（规则 68）' },
  practical: { phrase: 'motivated practicals only, warm yellow from the visible lamps', use: '有源光律（规则 44）' },
}

const COMPOSITION: Record<string, { phrase: string; use: string }> = {
  'rule-of-thirds': { phrase: 'subject offset to the third line', use: '三分构图常态（规则 62 画幅先定）' },
  symmetry: { phrase: 'perfectly symmetrical composition, centered subject', use: '秩序/庄重（韦式语法）' },
  'negative-space': { phrase: 'subject on the far third, large negative space', use: '孤独/压抑（规则 38）' },
  'frame-in-frame': { phrase: 'frame within a frame through window/door', use: '窥视/囚禁（规则 38）' },
  'depth-layers': { phrase: 'foreground occlusion, midground subject, background story', use: 'Kurosawa 纵深三层（规则 38）' },
}

const BOLD_MOVES = new Set(['orbit', 'dolly_zoom', 'roll', 'whip'])

const NEGATIVE_BASELINE = 'blurry, low quality, pixelated, watermark, text overlay, subtitles, distorted limbs, extra fingers, deformed face, flickering, jitter, strobing, duplicate subjects, morphing face'

/** 表驱动镜头提示词翻译器。 */
export function buildShotPrompt(input: ShotBuilderInput): ShotBuilderOutput {
  const parts: Record<string, string> = {}
  const notes: string[] = []

  const size = SHOT_SIZES[input.shotSize ?? 'MS']
  parts.shot = size.phrase
  notes.push(`景别 ${input.shotSize ?? 'MS'}: ${size.use}`)

  const angle = ANGLES[input.angle ?? 'eye-level']
  parts.angle = angle.phrase
  notes.push(`角度 ${input.angle ?? 'eye-level'}: ${angle.use}`)

  const move = (input.cameraMove ?? 'static').toLowerCase()
  const safeMove = CAMERA_SAFE_MOVES.includes(move as (typeof CAMERA_SAFE_MOVES)[number])
  parts.move = safeMove ? `${move.replace('_', ' ')} camera movement` : `${move} camera movement`
  if (BOLD_MOVES.has(move)) notes.push(`运镜 ${move}: 大胆运镜，失败率高，建议备选安全运镜（规则 36 词表）`)
  else if (!safeMove) notes.push(`运镜 ${move} 不在安全词表（static/push_in/pull_out/pan/tilt/parallax/element），请确认模型支持`)
  if (move === 'static') parts.move = 'Static camera, no movement'

  const light = LIGHTING[input.lighting ?? 'soft-window']
  parts.lighting = light.phrase
  notes.push(`布光 ${input.lighting ?? 'soft-window'}: ${light.use}`)

  if (input.composition !== undefined) {
    const comp = COMPOSITION[input.composition]
    parts.composition = comp.phrase
    notes.push(`构图 ${input.composition}: ${comp.use}`)
  }

  if (input.mood !== undefined && input.mood !== '') {
    parts.mood = `atmosphere: ${input.mood}`
  }

  const actionPart = input.action !== undefined && input.action !== '' ? input.action : 'perform one clear action'
  const subjectPart = `${input.subject}, ${parts.shot}, ${parts.angle}, ${parts.move}`
  const prompt = [subjectPart, actionPart, parts.lighting, parts.composition ?? '', parts.mood ?? ''].filter(part => part !== '').join('; ')
  notes.push('动作按节拍计数写（规则 32：可观察行为，不写情绪动词）')
  notes.push(`单镜 ${input.durationSec ?? 5}s：时长写生成参数与约束句，不写进提示词（规则 59）`)

  return {
    prompt,
    negative: NEGATIVE_BASELINE,
    notes,
    parts,
  }
}

export interface SequenceShotInput {
  id?: string
  description: string
  shotSize?: ShotBuilderInput['shotSize']
  cameraMove?: string
  lighting?: ShotBuilderInput['lighting']
  mood?: string
  composition?: ShotBuilderInput['composition']
  /** 本镜是否用上一镜末帧作首帧接力。 */
  handoff?: boolean
}

export interface SequenceSpec {
  id: string
  prompt: string
  negative: string
  carry: { prevEnd: string | null; nextStart: string | null }
  handoffFrom: string | null
}

export interface ShotSequenceOutput {
  specs: SequenceSpec[]
  issues: string[]
}

function tailSentence(text: string): string {
  const parts = text.split(/[。！？；\n]+/).filter(part => part.trim() !== '')
  return parts[parts.length - 1] ?? text
}

/**
 * 分镜批量承接链：逐镜生成规格 + 承接变量（上镜 end_state / 下镜
 * start_goal）+ 首尾帧接力计划（handoff 时本镜挂上一镜末帧）。
 * 承接文本与运镜校验全部确定性，LLM 只负责描述本身。
 */
export function buildShotSequence(shots: SequenceShotInput[]): ShotSequenceOutput {
  const specs: SequenceSpec[] = []
  const issues: string[] = []
  let previousMove: string | undefined
  shots.forEach((shot, index) => {
    const id = shot.id ?? `shot-${index + 1}`
    const built = buildShotPrompt({
      subject: shot.description,
      shotSize: shot.shotSize,
      cameraMove: shot.cameraMove,
      lighting: shot.lighting,
      mood: shot.mood,
      composition: shot.composition,
    })
    const prev = shots[index - 1]
    const next = shots[index + 1]
    // 承接变量：上镜收于什么、下镜从什么开始——提示词必填（规则 3b）。
    const prevEnd = prev !== undefined ? tailSentence(prev.description) : null
    const nextStart = next !== undefined ? next.description.split(/[。！？；\n]+/)[0]?.trim() ?? next.description : null
    const handoffFrom = shot.handoff === true && prev !== undefined ? prev.id ?? `shot-${index}` : null
    if (shot.cameraMove !== undefined) {
      const move = shot.cameraMove.toLowerCase()
      if (previousMove !== undefined && previousMove === move && move !== 'static') {
        issues.push(`镜头 ${id} 与上一镜运镜相同（反单调规则）`)
      }
      previousMove = move
    }
    specs.push({
      id,
      prompt: built.prompt,
      negative: built.negative,
      carry: { prevEnd, nextStart },
      handoffFrom,
    })
  })
  return { specs, issues }
}

export interface ShotGateInput {
  shots: SequenceShotInput[]
  /** 可选：目标时长（秒）与画幅，联动模型路由检查。 */
  durationSec?: number
  aspectRatio?: string
}

export interface ShotGateCheck {
  name: string
  pass: boolean
  detail: string
  rule: string
}

export interface ShotGateOutput {
  verdict: 'pass' | 'fix'
  checks: ShotGateCheck[]
}

/**
 * 生成前规则 gate：把导演纪律变成规则编号化检查（生成前跑，与
 * 成片质检 qa_report 构成前后一对）。全部确定性，不调模型。
 */
export function gateShotSequence(input: ShotGateInput): ShotGateOutput {
  const checks: ShotGateCheck[] = []
  const shots = input.shots
  if (shots.length === 0) {
    return { verdict: 'fix', checks: [{ name: '镜头数', pass: false, detail: '镜头列表为空', rule: '规则 3c 剧本单一事实源' }] }
  }
  // ECU 惜用律：特写占比 ≤ 20%。
  const ecuCount = shots.filter(shot => shot.shotSize === 'ECU').length
  checks.push({
    name: 'ECU 惜用律',
    pass: ecuCount / shots.length <= 0.2,
    detail: `${ecuCount}/${shots.length} 镜用 ECU（上限 20%）`,
    rule: '规则 36 ECU 只给决定性细节',
  })
  // 负面基线必须逐镜存在（本装配层默认注入）。
  checks.push({ name: '负面基线', pass: true, detail: '装配层逐镜注入四类负面基线', rule: '规则 26 负面四类基底' })
  // 承接变量必填（首镜 prevEnd / 末镜 nextStart 豁免）。
  const missingCarry: string[] = []
  shots.forEach((shot, index) => {
    if (index > 0 && tailSentence(shots[index - 1].description) === '') missingCarry.push(shot.id ?? `shot-${index + 1}`)
    if (index < shots.length - 1 && (shot.description.split(/[。！？；\n]+/)[0] ?? '').trim() === '') missingCarry.push(shot.id ?? `shot-${index + 1}`)
  })
  checks.push({ name: '承接变量', pass: missingCarry.length === 0, detail: missingCarry.length > 0 ? `缺承接描述：${missingCarry.join(', ')}` : '逐镜承接文本齐备', rule: '规则 3b 承接变量必填' })
  // 提示词长度（容器与内容分离：描述过长）。
  const overlong = shots.filter(shot => shot.description.length > 200).map(shot => shot.id ?? '?')
  checks.push({ name: '描述长度', pass: overlong.length === 0, detail: overlong.length > 0 ? `超长描述：${overlong.join(', ')}` : '全部 ≤200 字', rule: '规则 14 容器与内容分离' })
  // 运镜词表 + 反单调。
  const safeSet = new Set<string>(CAMERA_SAFE_MOVES)
  const boldSet = new Set<string>(['orbit', 'dolly_zoom', 'roll', 'whip'])
  const badMoves: string[] = []
  let prevMove: string | undefined
  shots.forEach((shot, index) => {
    const move = shot.cameraMove?.toLowerCase()
    if (move === undefined) return
    const id = shot.id ?? `shot-${index + 1}`
    if (!safeSet.has(move) && !boldSet.has(move)) badMoves.push(`${id}(${move})`)
    if (prevMove !== undefined && prevMove === move && move !== 'static') badMoves.push(`${id}(与上镜同运镜)`)
    prevMove = move
  })
  checks.push({ name: '运镜词表与反单调', pass: badMoves.length === 0, detail: badMoves.length > 0 ? badMoves.join('；') : '词表合规、相邻不同', rule: '规则 36 运镜安全词表' })
  // 模型路由（若给时长/画幅）。
  if (input.durationSec !== undefined || input.aspectRatio !== undefined) {
    const route = routeModelForGate(input.durationSec, input.aspectRatio)
    checks.push({
      name: '模型路由',
      pass: route.eligible.length > 0,
      detail: route.eligible.length > 0 ? `${route.eligible.length} 个模型可用` : '无模型满足该参数组合',
      rule: '规则 59/62 时长与画幅是参数',
    })
  }
  return { verdict: checks.every(check => check.pass) ? 'pass' : 'fix', checks }
}

function routeModelForGate(durationSec?: number, aspectRatio?: string): { eligible: unknown[] } {
  return routeModel({ durationSec, aspectRatio })
}
