/**
 * Director Stage — 融合类型定义
 * 导演台数据模型。
 */

import * as THREE from 'three'

// ── 基础向量 ──
export interface Vec3 { x: number; y: number; z: number }

// ── 关节系统（语义关节名 → Three.js Group 映射）──
export type JointName =
  | 'hips' | 'spine' | 'neck' | 'head'
  | 'shoulderL' | 'elbowL' | 'shoulderR' | 'elbowR'
  | 'forearmL' | 'forearmR'
  | 'hipL' | 'kneeL' | 'hipR' | 'kneeR'
  | 'ankleL' | 'ankleR'

/** 全身关节动作枚举（Motion DSL）*/
export type JointAction =
  | 'flex' | 'extend'
  | 'abduct' | 'adduct'
  | 'rotate-in' | 'rotate-out'
  | 'twist-left' | 'twist-right'
  | 'tilt-left' | 'tilt-right'
  | 'hinge'
  | 'dorsiflex' | 'plantarflex'
  | 'pronate' | 'supinate'

export interface JointTarget {
  joint: string
  action: JointAction
  degrees?: number
}
// ── Director project model ──
export type AspectId = '21:9' | '16:9' | '4:3' | '1:1' | '3:4' | '9:16'

export const ASPECT_RATIOS: Record<AspectId, number> = {
  '21:9': 21 / 9,
  '16:9': 16 / 9,
  '4:3': 4 / 3,
  '1:1': 1,
  '3:4': 3 / 4,
  '9:16': 9 / 16,
}

export function vecEq(a: Vec3, b: Vec3): boolean {
  return a.x === b.x && a.y === b.y && a.z === b.z
}

export type DirectorKeyframeInterpolation = 'hold' | 'linear' | 'smooth' | 'ease-in' | 'ease-out'

export type DirectorActionId =
  | 'stand' | 'wait' | 'idle-breathe' | 'stop' | 'turn'
  | 'walk' | 'fast-walk' | 'run' | 'step-forward' | 'step-back' | 'follow' | 'pass-by' | 'dodge'
  | 'look-up' | 'look-down' | 'look-at' | 'look-back' | 'glance' | 'inspect'
  | 'speak' | 'listen' | 'nod' | 'shake-head' | 'face-to-face' | 'hand-over' | 'receive'
  | 'reach' | 'hold' | 'pick-up' | 'put-down' | 'point' | 'wave' | 'raise-hand' | 'clap' | 'knock' | 'phone' | 'drink'
  | 'sit' | 'stand-up' | 'crouch' | 'kneel' | 'lie-down' | 'bow' | 'cross-arms' | 'hands-on-hips'
  | 'hesitate' | 'hug' | 'fall' | 'get-up'
  | 'read' | 'write' | 'sew' | 'open-door' | 'close-door' | 'push' | 'pull' | 'enter-car' | 'exit-car'

export type DirectorCameraMove =
  | 'static' | 'push' | 'pull' | 'zoom-in' | 'zoom-out' | 'dolly-zoom'
  | 'truck-left' | 'truck-right'
  | 'pan-left' | 'pan-right' | 'tilt-up' | 'tilt-down' | 'whip-pan-left' | 'whip-pan-right'
  | 'crane-up' | 'crane-down' | 'jib-up' | 'jib-down'
  | 'orbit' | 'arc-left' | 'arc-right'
  | 'follow' | 'tracking' | 'steadicam'
  | 'handheld' | 'handheld-intense' | 'roll-left' | 'roll-right'

export interface DirectorElementBase {
  id: string
  name: string
  position: Vec3
  rotationDeg: Vec3
  scale: Vec3
  color: string
  visible: boolean
  groupId: string | null
  locked?: boolean
}

export type FigureStyle = 'male' | 'female' | 'child' | 'tall' | 'stocky' | 'hero'

export interface MannequinElement extends DirectorElementBase {
  kind: 'mannequin'
  poseId: string
  joints: Partial<Record<JointName, Vec3>>
  heightM: number
  bodyType?: 'person' | 'animal'
  figure?: FigureStyle
  animalSpecies?: 'small' | 'quadruped'
  identitySource?: 'workshop' | 'temporary' | 'image-analysis'
  characterId?: string
  performanceProfileId?: string
  motionScale?: number
}

export interface CrowdElement extends DirectorElementBase {
  kind: 'crowd'
  rows: number
  cols: number
  spacing: number
  poseId: string
}

export interface BillboardElement extends DirectorElementBase {
  kind: 'billboard'
  imagePath: string
  heightM: number
}

export interface BoxElement extends DirectorElementBase { kind: 'box' }
export interface SphereElement extends DirectorElementBase { kind: 'sphere' }
export interface CylinderElement extends DirectorElementBase { kind: 'cylinder' }
export interface WallElement extends DirectorElementBase { kind: 'wall' }

export type PrimitiveElement = BoxElement | SphereElement | CylinderElement | WallElement
export type DirectorElement = MannequinElement | CrowdElement | BillboardElement | PrimitiveElement

export interface DirectorElementState {
  position: Vec3
  rotationDeg: Vec3
  scale: Vec3
  visible: boolean
}

export interface DirectorMotionKeyframe {
  id: string
  timeSec: number
  position?: Vec3
  rotationDeg?: Vec3
  joints?: Partial<Record<JointName, Vec3>>
  pathIn?: Vec3
  pathOut?: Vec3
  pathMode?: 'corner' | 'smooth'
  interpolation: DirectorKeyframeInterpolation
  locked?: boolean
  source: 'agent' | 'manual' | 'template'
  note?: string
}

export interface DirectorActionClip {
  id: string
  elementId: string
  action: DirectorActionId
  startSec: number
  durationSec: number
  from: Vec3
  to: Vec3
  fromRotationDeg?: Vec3
  toRotationDeg?: Vec3
  templateId?: string
  intensity?: number
  locked?: boolean
  source?: 'agent' | 'manual'
  keyframes?: DirectorMotionKeyframe[]
}

export interface DirectorCameraKeyframe {
  id: string
  timeSec: number
  position: Vec3
  target: Vec3
  fov: number
  rollDeg?: number
  interpolation: DirectorKeyframeInterpolation
  locked?: boolean
  source: 'agent' | 'manual' | 'template'
  note?: string
}

export interface DirectorCameraEnd {
  position: Vec3
  target: Vec3
  fov: number
  rollDeg?: number
}

export interface DirectorSequenceShot {
  id: string
  name: string
  position: Vec3
  target: Vec3
  fov: number
  rollDeg?: number
  aspect: AspectId
  createdAt: number
  startSec: number
  durationSec: number
  cameraEnd: DirectorCameraEnd
  cameraMove: DirectorCameraMove
  cameraKeyframes?: DirectorCameraKeyframe[]
  elementStates: Record<string, DirectorElementState>
  actions: DirectorActionClip[]
  locked?: boolean
}

export type DirectorShot = Pick<DirectorSequenceShot, 'position' | 'target' | 'fov'>

export interface DirectorPlan {
  id: string
  name: string
  summary: string
  createdAt: number
  shots: DirectorSequenceShot[]
}

// ── Motion DSL AST ──
export type StepInterpolationMode = 'settle' | 'drive' | 'snap' | 'flow' | 'linear'

export interface MotionStep {
  name: string
  durationSeconds: number
  mode: StepInterpolationMode
  targets: JointTarget[]
}

export interface MotionAst {
  name: string
  base: string
  baseOverrides: JointTarget[]
  loop: boolean
  repeat: number
  steps: MotionStep[]
}

export interface CompileError { line: number; message: string }

export interface MotionCompileResult {
  ast: MotionAst | null
  errors: CompileError[]
}

// ── Campath DSL AST ──
export type EasingType = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'smoothstep'

export type CameraLookMode =
  | { mode: 'target'; targetId: string }
  | { mode: 'pair'; a: string; b: string; screen?: number }
  | { mode: 'at'; point: Vec3 }
  | { mode: 'ahead' }

export type CameraSegment =
  | { kind: 'move'; to: Vec3; durationS: number; fov?: number }
  | { kind: 'dolly'; direction: 'in' | 'out'; metres: number; durationS: number; fov?: number }
  | { kind: 'truck'; direction: 'left' | 'right'; metres: number; durationS: number; fov?: number }
  | { kind: 'crane'; direction: 'up' | 'down'; metres: number; durationS: number; fov?: number }
  | { kind: 'orbit'; direction: 'left' | 'right'; degrees: number; durationS: number;
      riseM?: number; radiusM?: number; fov?: number }
  | { kind: 'hold'; durationS: number; fov?: number }
  | { kind: 'zoom'; direction: 'in' | 'out'; degrees: number; durationS: number; fov?: number }
  | { kind: 'dolly-zoom'; direction: 'in' | 'out'; metres: number; durationS: number }
  | { kind: 'jib'; direction: 'up' | 'down'; metres: number; durationS: number; fov?: number }
  | { kind: 'pan'; direction: 'left' | 'right'; degrees: number; durationS: number }
  | { kind: 'tilt'; direction: 'up' | 'down'; degrees: number; durationS: number }
  | { kind: 'roll'; direction: 'left' | 'right'; degrees: number; durationS: number }

export interface CameraPathAst {
  name: string
  look: CameraLookMode
  easing: EasingType
  fromPosition: Vec3
  initialFov: number       // 10..120
  segments: CameraSegment[]
  loop: false | 'loop' | 'pingpong'
}

// ── 时间轴 clip ──
export type TimelineTrackKind = 'anim' | 'campath' | 'motion'

export interface TimelineClip {
  id: string
  ref: string              // campath id / motion id / anim id
  startMs: number
  durationMs: number
  enabled: boolean
}

// ── 代码模型 ──
export interface CodeModelContext {
  THREE: typeof THREE
}

/**
 * model.generate 接收的 JS 程序签名。
 * 完整的纯 JavaScript 函数体；无 import/require/await/fetch/DOM/外部依赖。
 */
export type CodeModelFactory = (ctx: CodeModelContext) => THREE.Group

// ── VCam pose 消息 ──
export interface VCamPose {
  q: [number, number, number, number]
  joy: [number, number]
  elev: -1 | 0 | 1
  t: number
  gyro: boolean
}
