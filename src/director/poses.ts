/**
 * poses — 素模姿势预设库（各关节角度 JSON）+ 关节滑杆定义。
 * 角度约定：X=前后摆/俯仰（正=向前抬），Y=扭转，Z=侧摆。
 */
import type { JointName, Vec3 } from './types';

export interface PosePreset {
  id: string;
  label: string;
  joints: Partial<Record<JointName, Vec3>>;
  /** root 的 Y 偏移系数（×身高），坐/跪等姿势落地用 */
  rootYOffsetH?: number;
}

const v = (x = 0, y = 0, z = 0): Vec3 => ({ x, y, z });

export const POSE_PRESETS: PosePreset[] = [
  { id: 'stand', label: '站立', joints: {} },
  {
    id: 'sit', label: '坐', rootYOffsetH: -0.24,
    joints: { hipL: v(-90), hipR: v(-90), kneeL: v(90), kneeR: v(90), spine: v(5) },
  },
  {
    id: 'walk', label: '行走',
    joints: { hipL: v(-25), hipR: v(20), kneeR: v(40), shoulderL: v(20), shoulderR: v(-25), spine: v(3) },
  },
  {
    id: 'run', label: '奔跑',
    joints: { hipL: v(-50), hipR: v(35), kneeL: v(20), kneeR: v(80), shoulderL: v(40), shoulderR: v(-45), elbowL: v(-90), elbowR: v(-90), spine: v(12) },
  },
  {
    id: 'point', label: '指向',
    joints: { shoulderR: v(-85), neck: v(0, 12), spine: v(0, 8) },
  },
  {
    id: 'hug', label: '环抱',
    joints: { shoulderL: v(-60, 25), shoulderR: v(-60, -25), elbowL: v(-35), elbowR: v(-35) },
  },
  {
    id: 'kneel', label: '单膝跪', rootYOffsetH: -0.17,
    joints: { hipR: v(-90), kneeR: v(90), kneeL: v(90), spine: v(8) },
  },
  {
    id: 'lie', label: '躺', rootYOffsetH: -0.46,
    joints: { hips: v(-90), neck: v(20) },
  },
  {
    id: 'wave', label: '挥手',
    joints: { shoulderR: v(0, 0, -150), elbowR: v(0, 0, -20), neck: v(0, 0, 6) },
  },
  {
    id: 'armscross', label: '抱臂',
    joints: { shoulderL: v(-55, 35), shoulderR: v(-55, -35), elbowL: v(-100), elbowR: v(-100) },
  },
  {
    id: 'headdown', label: '低头沉思',
    joints: { neck: v(25), spine: v(10), shoulderL: v(5), shoulderR: v(5) },
  },
  {
    id: 'lean', label: '倚靠',
    joints: { spine: v(-8, 0, 6), hipL: v(-10), kneeL: v(15), shoulderL: v(0, 0, 10) },
  },
  { id: 'tpose', label: 'T 型', joints: { shoulderL: v(0, 0, -90), shoulderR: v(0, 0, 90) } },
  { id: 'jump', label: '跳跃', joints: { hipL: v(-40), hipR: v(-20), kneeL: v(50), kneeR: v(30), shoulderL: v(-40), shoulderR: v(35), spine: v(-8) } },
  { id: 'squat', label: '蹲下', rootYOffsetH: -0.22, joints: { hipL: v(-95), hipR: v(-95), kneeL: v(110), kneeR: v(110), spine: v(12) } },
  { id: 'drive', label: '驾驶', rootYOffsetH: -0.2, joints: { hipL: v(-80), hipR: v(-80), kneeL: v(80), kneeR: v(80), elbowL: v(-40), elbowR: v(-50), spine: v(6) } },
  { id: 'hands_up', label: '举手', joints: { shoulderL: v(-160), shoulderR: v(-160), elbowL: v(-20), elbowR: v(-20) } },
  { id: 'bow', label: '鞠躬', joints: { spine: v(48), neck: v(18), hipL: v(8), hipR: v(8) } },
  { id: 'akimbo', label: '叉腰', joints: { shoulderL: v(-40, 0, 25), shoulderR: v(-40, 0, -25), elbowL: v(-95), elbowR: v(-95) } },
  { id: 'think', label: '思考', joints: { neck: v(12, -18), shoulderR: v(-70), elbowR: v(-100), spine: v(4, -6) } },
  { id: 'fight', label: '格斗', joints: { hipL: v(-25), hipR: v(15), spine: v(6, -12), shoulderL: v(-70), shoulderR: v(-90), elbowL: v(-80), elbowR: v(-90) } },
  { id: 'aim', label: '瞄准', joints: { shoulderR: v(-90), elbowR: v(-10), shoulderL: v(-70), elbowL: v(-40), neck: v(0, 8), spine: v(0, 10) } },
  { id: 'sword', label: '持剑', joints: { shoulderR: v(-50, 0, -20), elbowR: v(-30), shoulderL: v(-20), spine: v(0, -8) } },
  { id: 'spell', label: '施法', joints: { shoulderL: v(-100), shoulderR: v(-110), elbowL: v(-40), elbowR: v(-20), spine: v(-6) } },
];

export function findPose(id: string): PosePreset | undefined {
  return POSE_PRESETS.find((p) => p.id === id);
}

/** 关节滑杆定义（属性面板微调用） */
export const JOINT_SLIDERS: { joint: JointName; label: string; axes: ('x' | 'y' | 'z')[]; min: number; max: number }[] = [
  { joint: 'neck', label: '头颈', axes: ['x', 'y', 'z'], min: -60, max: 60 },
  { joint: 'spine', label: '腰', axes: ['x', 'y', 'z'], min: -45, max: 45 },
  { joint: 'shoulderL', label: '左肩', axes: ['x', 'z'], min: -180, max: 90 },
  { joint: 'elbowL', label: '左肘', axes: ['x'], min: -150, max: 0 },
  { joint: 'shoulderR', label: '右肩', axes: ['x', 'z'], min: -180, max: 90 },
  { joint: 'elbowR', label: '右肘', axes: ['x'], min: -150, max: 0 },
  { joint: 'hipL', label: '左胯', axes: ['x'], min: -120, max: 45 },
  { joint: 'kneeL', label: '左膝', axes: ['x'], min: 0, max: 140 },
  { joint: 'hipR', label: '右胯', axes: ['x'], min: -120, max: 45 },
  { joint: 'kneeR', label: '右膝', axes: ['x'], min: 0, max: 140 },
];
