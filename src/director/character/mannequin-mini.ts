/**
 * 程序化人形素体 — Three.js Group 嵌套骨骼层级。
 *
 * 骨骼 = Group 嵌套（关节即 Group，pivot 在关节点）；
 * 肢体 capsule 沿 -Y 悬挂，mesh 偏移 -len/2。
 * 所有比例按身高 H 缩放。
 *
 * 关节命名：
 *   shoulders(左/右), elbows, forearms, wrists,
 *   hips(左/右), knees, ankles, spine, head, pelvis
 */

import * as THREE from 'three'

const D2R = Math.PI / 180

// ── 关节名枚举 ──

export type StageJointName =
  | 'pelvis' | 'spine' | 'head'
  | 'shoulder_left' | 'shoulder_right'
  | 'elbow_left' | 'elbow_right'
  | 'forearm_left' | 'forearm_right'
  | 'wrist_left' | 'wrist_right'
  | 'hip_left' | 'knee_left' | 'ankle_left'
  | 'hip_right' | 'knee_right' | 'ankle_right'

/** 关节动作到旋转轴+方向的映射 */
export const JOINT_AXIS_MAP: Record<string, { axis: THREE.Vector3; sign: number }> = {
  flex:         { axis: new THREE.Vector3(1, 0, 0), sign: 1 },
  extend:       { axis: new THREE.Vector3(1, 0, 0), sign: -1 },
  abduct:       { axis: new THREE.Vector3(0, 0, 1), sign: 1 },
  adduct:       { axis: new THREE.Vector3(0, 0, 1), sign: -1 },
  'rotate-in':  { axis: new THREE.Vector3(0, 1, 0), sign: 1 },
  'rotate-out': { axis: new THREE.Vector3(0, 1, 0), sign: -1 },
  'twist-left': { axis: new THREE.Vector3(0, 1, 0), sign: 1 },
  'twist-right':{ axis: new THREE.Vector3(0, 1, 0), sign: -1 },
  'tilt-left':  { axis: new THREE.Vector3(0, 0, 1), sign: 1 },
  'tilt-right': { axis: new THREE.Vector3(0, 0, 1), sign: -1 },
  hinge:        { axis: new THREE.Vector3(1, 0, 0), sign: 1 },
  dorsiflex:    { axis: new THREE.Vector3(1, 0, 0), sign: 1 },
  plantarflex:  { axis: new THREE.Vector3(1, 0, 0), sign: -1 },
  pronate:      { axis: new THREE.Vector3(0, 1, 0), sign: 1 },
  supinate:     { axis: new THREE.Vector3(0, 1, 0), sign: -1 },
}

// ── 体型参数 ──

export type BodyType = 'male' | 'female' | 'child'

interface BodyProportions {
  heightM: number
  shoulderWidthRatio: number   // × H
  hipWidthRatio: number
  torsoLengthRatio: number
  armLengthRatio: number
  legLengthRatio: number
  headRadiusRatio: number
  limbThicknessRatio: number
}

export const BODY_PROPORTIONS: Record<BodyType, BodyProportions> = {
  male: {
    heightM: 1.75,
    shoulderWidthRatio: 0.23,
    hipWidthRatio: 0.16,
    torsoLengthRatio: 0.30,
    armLengthRatio: 0.38,
    legLengthRatio: 0.47,
    headRadiusRatio: 0.065,
    limbThicknessRatio: 0.038,
  },
  female: {
    heightM: 1.65,
    shoulderWidthRatio: 0.20,
    hipWidthRatio: 0.19,
    torsoLengthRatio: 0.29,
    armLengthRatio: 0.37,
    legLengthRatio: 0.48,
    headRadiusRatio: 0.068,
    limbThicknessRatio: 0.032,
  },
  child: {
    heightM: 1.15,
    shoulderWidthRatio: 0.18,
    hipWidthRatio: 0.17,
    torsoLengthRatio: 0.28,
    armLengthRatio: 0.36,
    legLengthRatio: 0.45,
    headRadiusRatio: 0.085,
    limbThicknessRatio: 0.040,
  },
}

// ── 姿态类型 ──

export interface CharacterPose {
  /** 关节名 → 绝对角度(度) */
  [jointAction: string]: number  // e.g. 'shoulder_right.flex': 105
}

// ══════════════════════════════════════════════════════════
// 素体构建
// ══════════════════════════════════════════════════════════

export interface MannequinRig {
  root: THREE.Group
  joints: Map<string, THREE.Group>
  material: THREE.MeshStandardMaterial
  /** 返回当前姿态（关节名→角度度）*/
  getPose(): Record<string, number>}

function capsule(r: number, len: number, mat: THREE.Material): THREE.Mesh {
  const geo = new THREE.CapsuleGeometry(r, len, 4, 12)
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.y = -len / 2
  return mesh
}

/**
 * 构建程序化人形素体。
 * 骨骼 = Group 嵌套层级；关节即 Group pivot 在关节点。
 */
export function buildMannequin(bodyType: BodyType, color: string): MannequinRig {
  const p = BODY_PROPORTIONS[bodyType]
  const H = p.heightM
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.05 })
  const joints = new Map<string, THREE.Group>()

  const J = (name: string, x: number, y: number, z: number, parent: THREE.Object3D): THREE.Group => {
    const g = new THREE.Group()
    g.position.set(x, y, z)
    parent.add(g)
    joints.set(name, g)
    return g
  }

  const root = new THREE.Group()
  root.name = `mannequin_${bodyType}`

  // 骨盆
  const pelvis = J('pelvis', 0, p.legLengthRatio * H, 0, root)
  const pelvisMesh = new THREE.Mesh(
    new THREE.SphereGeometry(p.hipWidthRatio * H * 0.5, 12, 10),
    mat,
  )
  pelvisMesh.scale.set(1.25, 0.75, 0.9)
  pelvis.add(pelvisMesh)

  // 脊柱 → 胸腔
  const spine = J('spine', 0, 0.02 * H, 0, pelvis)
  const torsoLen = p.torsoLengthRatio * H
  const torso = new THREE.Mesh(
    new THREE.CapsuleGeometry(p.shoulderWidthRatio * H * 0.37, torsoLen * 0.55, 4, 12),
    mat,
  )
  torso.position.y = torsoLen * 0.42
  spine.add(torso)

  // 头
  const neck = J('neck', 0, torsoLen * 0.82, 0, spine)
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(p.headRadiusRatio * H, 14, 12),
    mat,
  )
  head.position.y = p.headRadiusRatio * H * 1.1
  neck.add(head)

  // 鼻头标朝向（+Z 为正面）
  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(p.headRadiusRatio * H * 0.22, 6, 6),
    mat,
  )
  nose.position.set(0, p.headRadiusRatio * H * 1.1, p.headRadiusRatio * H * 0.95)
  neck.add(nose)

  // 手臂链：肩→肘→前臂→腕
  const armThick = p.limbThicknessRatio * H
  for (const side of ['left', 'right'] as const) {
    const sx = side === 'left' ? -1 : 1
    const sCap = side === 'left' ? 'L' : 'R'

    const shoulder = J(`shoulder_${side}`, sx * p.shoulderWidthRatio * H * 0.5, torsoLen * 0.75, 0, spine)
    shoulder.add(capsule(armThick, p.armLengthRatio * H * 0.43, mat))

    const elbow = J(`elbow_${side}`, 0, -p.armLengthRatio * H * 0.43, 0, shoulder)
    elbow.add(capsule(armThick * 0.85, p.armLengthRatio * H * 0.38, mat))

    const forearm = J(`forearm_${side}`, 0, -p.armLengthRatio * H * 0.38, 0, elbow)

    const wrist = J(`wrist_${side}`, 0, -p.armLengthRatio * H * 0.36, 0, forearm)
    const hand = new THREE.Mesh(new THREE.SphereGeometry(armThick * 1.1, 8, 8), mat)
    hand.position.y = -armThick * 1.5
    wrist.add(hand)
  }

  // 腿链：髋→膝→踝
  const legThick = p.limbThicknessRatio * H * 1.15
  for (const side of ['left', 'right'] as const) {
    const sx = side === 'left' ? -1 : 1

    const hip = J(`hip_${side}`, sx * p.hipWidthRatio * H * 0.5, -0.02 * H, 0, pelvis)
    hip.add(capsule(legThick, p.legLengthRatio * H * 0.52, mat))

    const knee = J(`knee_${side}`, 0, -p.legLengthRatio * H * 0.52, 0, hip)
    knee.add(capsule(legThick * 0.85, p.legLengthRatio * H * 0.48, mat))

    const ankle = J(`ankle_${side}`, 0, -p.legLengthRatio * H * 0.48, 0, knee)
    const foot = new THREE.Mesh(
      new THREE.BoxGeometry(0.055 * H, 0.03 * H, 0.14 * H),
      mat,
    )
    foot.position.set(0, -0.015 * H, 0.04 * H)
    ankle.add(foot)
  }

  return {
    root, joints, material: mat,
    getPose(): Record<string, number> {
      const pose: Record<string, number> = {}
      for (const [name, group] of joints) {
        const euler = new THREE.Euler().setFromQuaternion(group.quaternion, 'YXZ')
        pose[name] = Math.round(euler.x / D2R)
        if (euler.y !== 0) pose[name + '_yaw'] = Math.round(euler.y / D2R)
        if (euler.z !== 0) pose[name + '_roll'] = Math.round(euler.z / D2R)
      }
      return pose
    },
  }
}

/**
 * 应用姿态到素体骨骼。
 * @param overrides 关节名.动作 → 角度(度)，如 { 'shoulder_right.abduct': 105 }
 */
export function applyPose(rig: MannequinRig, overrides: Record<string, number>): void {
  // 先重置到 base pose（全部归零）
  for (const [, group] of rig.joints) {
    group.rotation.set(0, 0, 0)
  }
  // 再应用覆盖
  for (const [key, degrees] of Object.entries(overrides)) {
    const dotIdx = key.lastIndexOf('.')
    if (dotIdx === -1) continue
    const jointName = key.slice(0, dotIdx)     // e.g. 'shoulder_right'
    const action = key.slice(dotIdx + 1)       // e.g. 'abduct'
    const group = rig.joints.get(jointName)
    if (!group) continue

    const axisInfo = JOINT_AXIS_MAP[action]
    if (!axisInfo) continue

    const rad = degrees * D2R * axisInfo.sign
    const axis = axisInfo.axis
    group.rotateOnAxis(axis, rad)
  }
}
