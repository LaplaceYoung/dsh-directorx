/**
 * 内置动作预设库 — Motion DSL 源码模板。
 * 仅使用编译器支持的关节名/动作/插值模式。
 */

export interface MotionPreset {
  id: string
  label: string
  source: string
}

export const MOTION_PRESETS: MotionPreset[] = [
  {
    id: 'idle',
    label: '待机呼吸',
    source: `motion "Idle"
  base stand
  step "breathe" 3s flow:
    spine: tilt-left 2
    shoulder_left: abduct 3
    shoulder_right: abduct 3
  step "settle" 3s settle:
    spine: tilt-left 0
    shoulder_left: abduct 0
    shoulder_right: abduct 0`,
  },
  {
    id: 'walk',
    label: '行走',
    source: `motion "Walk"
  base stand
  loop
  step "left-contact" 0.33s flow:
    hip_left: flex 25
    knee_left: flex 15
    hip_right: extend 15
    knee_right: flex 30
    ankle_left: dorsiflex 5
    shoulder_left: flex -8
    shoulder_right: flex 8
  step "right-swing" 0.33s flow:
    hip_right: flex 25
    knee_right: flex 15
    hip_left: extend 15
    knee_left: flex 30
    ankle_right: dorsiflex 5
    shoulder_left: flex 8
    shoulder_right: flex -8
  step "settle" 0.34s settle:
    knee_left: flex 5
    knee_right: flex 5`,
  },
  {
    id: 'run',
    label: '跑动',
    source: `motion "Run"
  base stand
  loop
  step "drive" 0.22s drive:
    hip_left: flex 45
    knee_left: flex 80
    hip_right: extend 25
    knee_right: flex 40
    elbow_left: flex 85
    elbow_right: flex 70
    sink: 0.03
  step "flight" 0.18s snap:
    knee_left: extend 5
    knee_right: extend 5
    ankle_left: plantarflex 20
    ankle_right: plantarflex 20
  step "contact" 0.25s flow:
    hip_right: flex 35
    knee_right: flex 60
    ankle_right: dorsiflex 10
    sink: 0.04
  step "recover" 0.25s settle:
    knee_left: flex 20
    knee_right: flex 20`,
  },
  {
    id: 'jump',
    label: '跳跃',
    source: `motion "Jump"
  base stand
  step "crouch" 0.4s drive:
    knee_left: flex 60
    knee_right: flex 60
    hip_left: flex 30
    hip_right: flex 30
    spine: flex 8
  step "launch" 0.2s snap:
    knee_left: extend 5
    knee_right: extend 5
    hip_left: extend 10
    hip_right: extend 10
    ankle_left: plantarflex 30
    ankle_right: plantarflex 30
    shoulder_left: flex 160
    shoulder_right: flex 160
  step "land" 0.3s settle:
    knee_left: flex 50
    knee_right: flex 50
    hip_left: flex 25
    hip_right: flex 25
    ankle_left: dorsiflex 15
    ankle_right: dorsiflex 15`,
  },
  {
    id: 'talk',
    label: '说话手势',
    source: `motion "Talk"
  base stand
  loop
  step "gesture-a" 1.2s settle:
    shoulder_right: abduct 35
    elbow_right: flex 65
    head: twist-right 5
  step "gesture-b" 1.2s flow:
    shoulder_right: abduct 28
    elbow_right: flex 55
    head: twist-left 3`,
  },
  {
    id: 'wave',
    label: '挥手',
    source: `motion "Wave twice"
  base stand
  repeat 2
  step "raise" 0.4s settle:
    shoulder_right: abduct 105
    elbow_right: flex 65
  step "wave" 0.25s flow:
    elbow_right: flex 88
  step "lower" 0.5s settle:
    shoulder_right: abduct 0
    elbow_right: flex 0`,
  },
  {
    id: 'bow',
    label: '鞠躬',
    source: `motion "Bow"
  base stand
  step "bend" 0.6s settle:
    spine: flex 25
    head: flex 15
    shoulder_left: abduct 8
    shoulder_right: abduct 8
  step "hold-bow" 0.4s linear:
    spine: flex 25
    head: flex 15
  step "rise" 0.7s settle:
    spine: flex 0
    head: flex 0
    shoulder_left: abduct 0
    shoulder_right: abduct 0`,
  },
  {
    id: 'cheer',
    label: '欢呼',
    source: `motion "Cheer"
  base stand
  repeat 2
  step "arms-up" 0.35s snap:
    shoulder_left: abduct 150
    shoulder_right: abduct 150
    elbow_left: flex 30
    elbow_right: flex 30
    spine: extend 5
  step "arms-down" 0.35s settle:
    shoulder_left: abduct 120
    shoulder_right: abduct 120
    elbow_left: flex 45
    elbow_right: flex 45`,
  },
  {
    id: 'dance',
    label: '舞蹈',
    source: `motion "Dance"
  base stand
  loop
  step "tilt-l" 0.4s flow:
    spine: tilt-left 8
    shoulder_left: abduct 60
    shoulder_right: abduct 20
    elbow_left: flex 45
    head: tilt-left 5
  step "tilt-r" 0.4s flow:
    spine: tilt-right 8
    shoulder_right: abduct 60
    shoulder_left: abduct 20
    elbow_right: flex 60
    head: tilt-right 5`,
  },
  {
    id: 'sit_talk',
    label: '坐姿对话',
    source: `motion "Sit talk"
  base sit
  loop
  step "lean-fwd" 1.5s settle:
    spine: flex 8
    shoulder_right: abduct 15
    elbow_right: flex 30
  step "lean-back" 1.5s settle:
    spine: extend 5
    shoulder_right: abduct 10
    elbow_right: flex 15`,
  },
  {
    id: 'punch',
    label: '出拳',
    source: `motion "Punch"
  base stand
  step "wind-up" 0.25s drive:
    shoulder_right: abduct 40
    elbow_right: flex 90
    spine: twist-right 15
  step "strike" 0.15s snap:
    shoulder_right: flex 85
    elbow_right: extend 5
    spine: twist-left 20
  step "retract" 0.3s settle:
    shoulder_right: abduct 40
    elbow_right: flex 90
    spine: twist-right 15`,
  },
  {
    id: 'death',
    label: '倒地',
    source: `motion "Death"
  base stand
  step "stagger" 0.5s drive:
    spine: flex 10
    head: extend 15
    knee_left: flex 15
    knee_right: flex 15
    sink: 0.05
  step "fall-back" 0.4s snap:
    pelvis: hinge 92
    hip_left: flex 18
    hip_right: flex 18
    knee_left: flex 22
    knee_right: flex 22
    spine: extend 2
    head: extend 30
    shoulder_left: abduct 45
    shoulder_right: abduct 45
    elbow_left: flex 18
    elbow_right: flex 18
    sink: 0.82
  step "collapse-flat" 0.3s flow:
    pelvis: hinge 96
    hip_left: flex 10
    hip_right: flex 10
    knee_left: flex 14
    knee_right: flex 14
    head: extend 20
    shoulder_left: abduct 50
    shoulder_right: abduct 50
    elbow_left: flex 10
    elbow_right: flex 10
    sink: 0.87`,
  },
]

export function findPresetById(id: string): MotionPreset | undefined {
  return MOTION_PRESETS.find(p => p.id === id)
}
