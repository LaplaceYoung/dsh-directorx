/**
 * 姿态编辑：关节手柄 + 旋转/IK gizmo — 还原自 formatted/index-Dp22JYcT.js
 * - 轴位表 Hi（3884-3979）、度数提取 vp/Kc（3980-4017）
 * - ROM 限位 Ep、IK 链 Mp、IK 关节集 ol（4073-4089）
 * - 手柄构建/更新/清除 buildJointHandles*（9203-9256）
 * - 旋转 gizmo attachGizmoToJoint/onJointGizmoChange（9323-9378）
 * - IK 求解 jp = CCD 迭代（4105-4145）与 onIkGizmoChange（9302-9322）
 *
 * 语义要点：
 * - 常规关节：rotate gizmo，local 空间，锚点 Object3D 复制骨骼世界位姿；
 *   轴可见性由 JOINT_AXES[joint] 的字段表决定；拖拽增量四元数经
 *   「锚点旋转差 → 骨骼父空间投影 → 叠加起始四元数」换算回骨骼本地旋转。
 * - IK 关节（腕/踝）：translate gizmo，world 空间；CCD 自末端向根迭代 ≤12 轮，
 *   每步把语义度数写回 rig 并 clamp ROM，收敛阈值 1e-6。
 * - 手柄为屏幕恒定尺寸：scale = HANDLE_SIZE * 距离 * (2·tan(fov/2)/视口高)。
 */
import * as THREE from 'three';
import type { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import type { JointName } from '../types';

// ---- GLTF 骨骼 rig 结构（与 character 层的 rig 一致） ----

export interface GltfRig {
  /** 语义关节名 → Bone（缺失关节无键） */
  bones: Record<string, THREE.Bone>;
  /** bone.uuid → 绑定位姿四元数 */
  bindQuaternions: Map<string, THREE.Quaternion>;
  /** bone.uuid → rest 逆四元数 */
  restInverseQuaternions: Map<string, THREE.Quaternion>;
}

/** 语义关节角（度）→ 字段名（bend/turn/tilt/raise/straddle/nod） */
export type JointDegrees = Partial<Record<string, number>>;

// ---- 轴位表（Hi）：欧拉序 + 各轴到语义字段的带符号映射；null = 该轴锁定 ----

interface AxisField {
  field: string;
  sign: number;
}
interface JointAxisSpec {
  order: string;
  x: AxisField | null;
  y: AxisField | null;
  z: AxisField | null;
}

export const JOINT_AXES: Record<string, JointAxisSpec> = {
  body: { order: 'YXZ', x: { field: 'bend', sign: -1 }, y: { field: 'turn', sign: 1 }, z: { field: 'tilt', sign: 1 } },
  torso: { order: 'YXZ', x: { field: 'bend', sign: -1 }, y: { field: 'turn', sign: 1 }, z: { field: 'tilt', sign: 1 } },
  head: { order: 'YXZ', x: { field: 'nod', sign: 1 }, y: { field: 'turn', sign: 1 }, z: { field: 'tilt', sign: 1 } },
  l_arm: { order: 'ZXY', x: { field: 'raise', sign: -1 }, y: { field: 'turn', sign: 1 }, z: { field: 'straddle', sign: -1 } },
  r_arm: { order: 'ZXY', x: { field: 'raise', sign: -1 }, y: { field: 'turn', sign: -1 }, z: { field: 'straddle', sign: 1 } },
  l_leg: { order: 'ZXY', x: { field: 'raise', sign: 1 }, y: { field: 'turn', sign: 1 }, z: { field: 'straddle', sign: 1 } },
  r_leg: { order: 'ZXY', x: { field: 'raise', sign: 1 }, y: { field: 'turn', sign: -1 }, z: { field: 'straddle', sign: -1 } },
  l_elbow: { order: 'XYZ', x: { field: 'bend', sign: -1 }, y: { field: 'turn', sign: 1 }, z: null },
  r_elbow: { order: 'XYZ', x: { field: 'bend', sign: -1 }, y: { field: 'turn', sign: -1 }, z: null },
  l_wrist: { order: 'XYZ', x: { field: 'bend', sign: -1 }, y: { field: 'turn', sign: 1 }, z: null },
  r_wrist: { order: 'XYZ', x: { field: 'bend', sign: -1 }, y: { field: 'turn', sign: -1 }, z: null },
  l_knee: { order: 'XYZ', x: { field: 'bend', sign: -1 }, y: null, z: null },
  r_knee: { order: 'XYZ', x: { field: 'bend', sign: -1 }, y: null, z: null },
  l_ankle: { order: 'XYZ', x: { field: 'bend', sign: -1 }, y: null, z: null },
  r_ankle: { order: 'XYZ', x: { field: 'bend', sign: -1 }, y: null, z: null },
};

// ---- IK 链与 ROM 限位（Mp / ol / Ep） ----

export const IK_CHAINS: Record<string, { joints: string[]; effector: string }> = {
  l_wrist: { joints: ['l_arm', 'l_elbow'], effector: 'l_wrist' },
  r_wrist: { joints: ['r_arm', 'r_elbow'], effector: 'r_wrist' },
  l_ankle: { joints: ['l_leg', 'l_knee'], effector: 'l_ankle' },
  r_ankle: { joints: ['r_leg', 'r_knee'], effector: 'r_ankle' },
};

export const IK_JOINTS = new Set(['l_wrist', 'r_wrist', 'l_ankle', 'r_ankle']);

const ROM_LIMITS: Record<string, Record<string, [number, number]>> = {
  l_arm: { raise: [-180, 180], straddle: [-180, 180], turn: [-180, 180] },
  r_arm: { raise: [-180, 180], straddle: [-180, 180], turn: [-180, 180] },
  l_elbow: { bend: [0, 150], turn: [-90, 90] },
  r_elbow: { bend: [0, 150], turn: [-90, 90] },
  l_leg: { raise: [-180, 180], straddle: [-180, 180], turn: [-180, 180] },
  r_leg: { raise: [-180, 180], straddle: [-180, 180], turn: [-180, 180] },
  l_knee: { bend: [0, 150] },
  r_knee: { bend: [0, 150] },
};

const D2R = Math.PI / 180;

// ---- 纯函数：度数提取 / 轴 mask / 限位 / 屏幕恒定缩放 ----

/** 骨骼（GLTF 路径先剥离 bind 与 restInverse）四元数 → 语义度数（vp / Kc） */
export function degreesFromBone(joint: string, quaternion: THREE.Quaternion): JointDegrees {
  const spec = JOINT_AXES[joint];
  if (!spec) return {};
  const euler = new THREE.Euler().setFromQuaternion(quaternion, spec.order as THREE.EulerOrder);
  // 取反：gizmo 世界方向与语义正方向的约定差（formatted:3995 s = new Qe(-x,-y,-z)）
  const negated = new THREE.Euler(-euler.x, -euler.y, -euler.z, spec.order as THREE.EulerOrder);
  const out: JointDegrees = {};
  for (const axis of ['x', 'y', 'z'] as const) {
    const field = spec[axis];
    if (!field) continue;
    out[field.field] = field.sign * (negated[axis] / D2R);
  }
  return out;
}

export function degreesFromBoneWithRig(
  joint: string,
  bone: THREE.Bone,
  rig: GltfRig | null,
): JointDegrees {
  if (rig) {
    const bind = rig.bindQuaternions.get(bone.uuid);
    const restInv = rig.restInverseQuaternions.get(bone.uuid);
    const q = bone.quaternion.clone();
    if (bind) q.premultiply(bind.clone().invert());
    if (restInv) q.premultiply(restInv.clone().invert());
    return degreesFromBone(joint, q);
  }
  return degreesFromBone(joint, bone.quaternion.clone());
}

/** 关节可用轴（_p）：gizmo showX/Y/Z */
export function jointAxisMask(joint: string): { x: boolean; y: boolean; z: boolean } {
  const spec = JOINT_AXES[joint];
  return { x: !!spec?.x, y: !!spec?.y, z: !!spec?.z };
}

function clampRom(joint: string, degrees: JointDegrees): void {
  const limits = ROM_LIMITS[joint];
  if (!limits) return;
  for (const key of Object.keys(degrees)) {
    const range = limits[key];
    const value = degrees[key];
    if (range && value != null) degrees[key] = Math.min(range[1], Math.max(range[0], value));
  }
}

/** 屏幕恒定缩放因子（Rc）：2·tan(fov/2)/viewportHeight */
export function screenConstantScale(camera: THREE.PerspectiveCamera, viewportHeight: number): number {
  return (2 * Math.tan((camera.fov * Math.PI) / 360)) / viewportHeight;
}

/** 语义度数 → 骨骼本地欧拉（Vc，formatted:4018-4050；逐关节硬编码符号/欧拉序） */
export function eulerFromDegrees(
  joint: string,
  degrees: Record<string, number | undefined>,
): THREE.Euler {
  const d = degrees;
  switch (joint) {
    case 'body':
    case 'torso':
      return new THREE.Euler(-d.bend! * D2R, d.turn! * D2R, d.tilt! * D2R, 'YXZ');
    case 'head':
      return new THREE.Euler(d.nod! * D2R, d.turn! * D2R, d.tilt! * D2R, 'YXZ');
    case 'l_arm':
      return new THREE.Euler(-d.raise! * D2R, d.turn! * D2R, -d.straddle! * D2R, 'ZXY');
    case 'r_arm':
      return new THREE.Euler(-d.raise! * D2R, -d.turn! * D2R, d.straddle! * D2R, 'ZXY');
    case 'l_leg':
      return new THREE.Euler(d.raise! * D2R, d.turn! * D2R, d.straddle! * D2R, 'ZXY');
    case 'r_leg':
      return new THREE.Euler(d.raise! * D2R, -d.turn! * D2R, -d.straddle! * D2R, 'ZXY');
    case 'l_elbow':
      return new THREE.Euler(-d.bend! * D2R, (d.turn ?? 0) * D2R, 0, 'XYZ');
    case 'r_elbow':
      return new THREE.Euler(-d.bend! * D2R, -(d.turn ?? 0) * D2R, 0, 'XYZ');
    case 'l_wrist':
      return new THREE.Euler(-d.bend! * D2R, (d.turn ?? 0) * D2R, 0, 'XYZ');
    case 'r_wrist':
      return new THREE.Euler(-d.bend! * D2R, -(d.turn ?? 0) * D2R, 0, 'XYZ');
    case 'l_knee':
    case 'r_knee':
    case 'l_ankle':
    case 'r_ankle':
      return new THREE.Euler(-d.bend! * D2R, 0, 0);
    default:
      return new THREE.Euler();
  }
}

/**
 * 语义度数 → 骨骼本地四元数（$c，formatted:4051 调用链）：
 * Vc 欧拉各分量取反后按同序转四元数 —— 与 degreesFromBone 提取时的取反互为逆。
 */
export function quaternionFromDegrees(
  joint: string,
  degrees: Record<string, number | undefined>,
): THREE.Quaternion {
  const e = eulerFromDegrees(joint, degrees);
  return new THREE.Quaternion().setFromEuler(new THREE.Euler(-e.x, -e.y, -e.z, e.order));
}

/**
 * 把语义度数规范化写回骨骼（Fs/Ap，formatted:4051-4071）：
 * GLTF 路径 bone.q = bind · restInv · semanticQ；非 rig 路径直接以四元数分量
 * 充当欧拉分量写入 rotation（原实现即如此，保留该行为）。
 */
export function applyDegreesToBone(
  joint: string,
  bone: THREE.Bone,
  rig: GltfRig | null,
  degrees: JointDegrees,
): void {
  if (rig && Object.keys(rig.bones).length > 0) {
    const bind = rig.bindQuaternions.get(bone.uuid);
    const restInv = rig.restInverseQuaternions.get(bone.uuid);
    if (!bind) return;
    bone.quaternion.copy(bind);
    if (restInv) bone.quaternion.multiply(restInv);
    bone.quaternion.multiply(quaternionFromDegrees(joint, degrees));
    return;
  }
  const e = eulerFromDegrees(joint, degrees);
  bone.rotation.set(e.x, e.y, e.z, e.order);
}

// ---- 宿主接口 ----

export interface JointHandleHost {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  gizmo: TransformControls;
  /** 当前姿态编辑的角色 id 下的骨骼映射 */
  bonesOf(charId: string): Record<string, THREE.Bone | undefined>;
  /** 角色 id → GLTF rig（非 GLTF 角色返回 null） */
  rigOf(charId: string): GltfRig | null;
  /** 度数提交回调（finished=true 表示拖拽结束，宿主入 undo 历史） */
  onJointRotate(charId: string, degrees: Record<string, JointDegrees>, finished: boolean): void;
}

// ---- 主控制器 ----

const HANDLE_COLOR_IK = 0xfacc15;
const HANDLE_COLOR_JOINT = 0x38bdf8;
const HANDLE_SIZE = 6;

export class JointHandleLayer {
  private readonly host: JointHandleHost;
  private poseEditId: string | null = null;

  private readonly handles = new Map<string, THREE.Mesh>();

  private activeJointKey: string | null = null;
  private activeJointBone: THREE.Bone | null = null;
  private activeIkKey: string | null = null;
  private anchor: THREE.Object3D | null = null;
  private jointBoneStartQ: THREE.Quaternion | null = null;
  private anchorStartQ: THREE.Quaternion | null = null;

  constructor(host: JointHandleHost) {
    this.host = host;
  }

  get editingId(): string | null {
    return this.poseEditId;
  }

  setPoseEdit(charId: string | null): void {
    if (this.poseEditId === charId) return;
    this.clearHandles();
    this.poseEditId = charId;
    if (charId && this.bonesKeys(charId).length > 0) {
      this.host.gizmo.detach();
      this.buildHandles(charId);
    }
  }

  buildHandles(charId: string): void {
    const bones = this.host.bonesOf(charId);
    const sphereGeo = new THREE.SphereGeometry(1, 16, 12);
    const boxGeo = new THREE.BoxGeometry(1.7, 1.7, 1.7);
    for (const joint of Object.keys(bones)) {
      const bone = bones[joint];
      if (!bone) continue;
      const isIk = IK_JOINTS.has(joint);
      const material = new THREE.MeshBasicMaterial({
        color: isIk ? HANDLE_COLOR_IK : HANDLE_COLOR_JOINT,
        depthTest: false,
        transparent: true,
        opacity: 0.9,
      });
      const handle = new THREE.Mesh(isIk ? boxGeo : sphereGeo, material);
      handle.renderOrder = 999;
      handle.userData._isHelper = true;
      handle.userData._isJointHandle = true;
      handle.userData.jointKey = joint;
      this.host.scene.add(handle);
      this.handles.set(joint, handle);
    }
    this.updateHandlePositions();
  }

  updateHandlePositions(): void {
    if (!this.poseEditId || this.handles.size === 0) return;
    const bones = this.host.bonesOf(this.poseEditId);
    const world = new THREE.Vector3();
    const viewportHeight =
      this.host.renderer.domElement.clientHeight || 600;
    const scaleFactor = screenConstantScale(this.host.camera, viewportHeight);
    this.handles.forEach((handle, joint) => {
      const bone = bones[joint];
      if (!bone) {
        handle.visible = false;
        return;
      }
      handle.visible = true;
      bone.getWorldPosition(world);
      handle.position.copy(world);
      handle.scale.setScalar(HANDLE_SIZE * this.host.camera.position.distanceTo(world) * scaleFactor);
    });
    // 拖拽中骨骼在动：未拖拽时把锚点吸附回骨骼当前位置（formatted:9244-9249）
    if (this.activeJointBone && this.anchor && this.host.gizmo.object === this.anchor && !this.host.gizmo.dragging) {
      this.activeJointBone.getWorldPosition(world);
      this.anchor.position.copy(world);
    }
  }

  clearHandles(): void {
    this.detachGizmo();
    this.handles.forEach((handle) => {
      this.host.scene.remove(handle);
      handle.geometry.dispose();
      (handle.material as THREE.Material).dispose();
    });
    this.handles.clear();
  }

  detachGizmo(): void {
    if (this.activeIkKey) {
      this.host.gizmo.detach();
      this.host.gizmo.setSpace('local');
      this.removeAnchor();
      this.activeIkKey = null;
      this.activeJointBone = null;
    }
    if (this.activeJointKey) {
      this.host.gizmo.detach();
      this.host.gizmo.showX = true;
      this.host.gizmo.showY = true;
      this.host.gizmo.showZ = true;
      this.removeAnchor();
      this.activeJointKey = null;
      this.activeJointBone = null;
      this.jointBoneStartQ = null;
      this.anchorStartQ = null;
    }
  }

  /** 点中手柄后分派：IK 关节挂平移 gizmo，常规关节挂旋转 gizmo */
  attachGizmoTo(joint: string): void {
    const charId = this.poseEditId;
    if (!charId) return;
    const bone = this.host.bonesOf(charId)[joint];
    if (!bone) return;
    if (IK_JOINTS.has(joint)) {
      this.attachIkToEffector(joint);
      return;
    }
    this.detachGizmo();
    this.activeJointKey = joint;
    this.activeJointBone = bone;
    const anchorObj = new THREE.Object3D();
    const worldPos = new THREE.Vector3();
    const worldQ = new THREE.Quaternion();
    bone.getWorldPosition(worldPos);
    bone.getWorldQuaternion(worldQ);
    anchorObj.position.copy(worldPos);
    anchorObj.quaternion.copy(worldQ);
    anchorObj.userData._isHelper = true;
    this.host.scene.add(anchorObj);
    this.anchor = anchorObj;
    this.anchorStartQ = worldQ.clone();
    this.host.gizmo.setMode('rotate');
    this.host.gizmo.setSpace('local');
    const mask = jointAxisMask(joint);
    this.host.gizmo.showX = mask.x;
    this.host.gizmo.showY = mask.y;
    this.host.gizmo.showZ = mask.z;
    this.host.gizmo.attach(anchorObj);
  }

  /**
   * 旋转 gizmo 回调：锚点旋转差投影到骨骼父空间，叠加起始四元数后提取语义度数。
   * finished=true 时重置基准并让锚点精确对齐骨骼世界四元数。
   */
  onJointGizmoChange(finished: boolean): void {
    const charId = this.poseEditId;
    const joint = this.activeJointKey;
    const bone = this.activeJointBone;
    const anchorObj = this.anchor;
    const startQ = this.anchorStartQ;
    if (!charId || !joint || !bone || !anchorObj || !startQ) return;
    const rig = this.host.rigOf(charId);

    const deltaWorld = anchorObj.quaternion.clone().multiply(startQ.clone().invert());
    const parentQ = new THREE.Quaternion();
    (bone.parent ?? bone).getWorldQuaternion(parentQ);
    const localDelta = parentQ.clone().invert().multiply(deltaWorld).multiply(parentQ);
    if (!this.jointBoneStartQ) this.jointBoneStartQ = bone.quaternion.clone();
    bone.quaternion.copy(localDelta.multiply(this.jointBoneStartQ));

    const degrees = degreesFromBoneWithRig(joint, bone, rig);
    this.host.onJointRotate(charId, { [joint]: degrees }, finished);
    if (finished) {
      this.jointBoneStartQ = null;
      const aligned = new THREE.Quaternion();
      bone.getWorldQuaternion(aligned);
      anchorObj.quaternion.copy(aligned);
      this.anchorStartQ = aligned.clone();
    }
  }

  private attachIkToEffector(effector: string): void {
    const charId = this.poseEditId;
    if (!charId) return;
    const bone = this.host.bonesOf(charId)[effector];
    if (!bone) return;
    this.detachGizmo();
    this.activeIkKey = effector;
    this.activeJointBone = bone;
    const anchorObj = new THREE.Object3D();
    const worldPos = new THREE.Vector3();
    bone.getWorldPosition(worldPos);
    anchorObj.position.copy(worldPos);
    anchorObj.userData._isHelper = true;
    this.host.scene.add(anchorObj);
    this.anchor = anchorObj;
    this.host.gizmo.setMode('translate');
    this.host.gizmo.setSpace('world');
    this.host.gizmo.showX = true;
    this.host.gizmo.showY = true;
    this.host.gizmo.showZ = true;
    this.host.gizmo.attach(anchorObj);
  }

  /** IK gizmo 回调：以锚点位置为目标跑 CCD，提交链上各关节的语义度数 */
  onIkGizmoChange(finished: boolean): void {
    const charId = this.poseEditId;
    const effector = this.activeIkKey;
    const anchorObj = this.anchor;
    if (!charId || !effector || !anchorObj) return;
    const rig = this.host.rigOf(charId);
    const chainResult = solveChainCcd(effector, this.host.bonesOf(charId), anchorObj.position.clone(), rig);
    if (chainResult) {
      this.host.onJointRotate(charId, chainResult, finished);
    }
    if (finished) {
      const bone = this.host.bonesOf(charId)[effector];
      if (bone) {
        const worldPos = new THREE.Vector3();
        bone.getWorldPosition(worldPos);
        anchorObj.position.copy(worldPos);
      }
    }
  }

  dispose(): void {
    this.clearHandles();
  }

  private bonesKeys(charId: string): string[] {
    return Object.keys(this.host.bonesOf(charId));
  }

  private removeAnchor(): void {
    if (!this.anchor) return;
    this.host.scene.remove(this.anchor);
    this.anchor = null;
  }
}

/**
 * CCD 求解器（jp，formatted:4105-4145）：
 * 从链末端关节向根迭代，每轮把「当前效应器方向 → 目标方向」的世界旋转差
 * 投影到关节父空间直接写入 bone.quaternion，随后提取语义度数（clamp ROM）
 * 并立即应用到 rig/bones，最多 maxIterations(=12) 轮或距离平方 <1e-6 收敛。
 * 返回 { joint: degrees } 累积结果；链不存在或骨骼缺失返回 null。
 */
export function solveChainCcd(
  effector: string,
  bones: Record<string, THREE.Bone | undefined>,
  target: THREE.Vector3,
  rig: GltfRig | null,
  maxIterations = 12,
): Record<string, JointDegrees> | null {
  const chain = IK_CHAINS[effector];
  if (!chain) return null;
  const endEffector = bones[chain.effector];
  if (!endEffector) return null;
  const chainJoints = chain.joints.filter((j) => bones[j]);
  if (chainJoints.length === 0) return null;

  const result: Record<string, JointDegrees> = {};
  const jointPos = new THREE.Vector3();
  const effectorPos = new THREE.Vector3();
  const toEffector = new THREE.Vector3();
  const toTarget = new THREE.Vector3();
  const rotation = new THREE.Quaternion();
  const boneWorldQ = new THREE.Quaternion();
  const parentWorldQ = new THREE.Quaternion();

  for (let iter = 0; iter < maxIterations; iter++) {
    for (let i = chainJoints.length - 1; i >= 0; i--) {
      const jointName = chainJoints[i];
      const bone = bones[jointName];
      if (!bone) continue;
      bone.updateWorldMatrix(true, false);
      endEffector.updateWorldMatrix(true, false);
      bone.getWorldPosition(jointPos);
      endEffector.getWorldPosition(effectorPos);
      toEffector.copy(effectorPos).sub(jointPos);
      toTarget.copy(target).sub(jointPos);
      if (toEffector.lengthSq() < 1e-8 || toTarget.lengthSq() < 1e-8) continue;
      toEffector.normalize();
      toTarget.normalize();
      rotation.setFromUnitVectors(toEffector, toTarget);
      bone.getWorldQuaternion(boneWorldQ);
      const worldRotation = rotation.multiply(boneWorldQ);
      (bone.parent ?? bone).getWorldQuaternion(parentWorldQ);
      bone.quaternion.copy(parentWorldQ.invert().multiply(worldRotation));
      bone.updateWorldMatrix(false, true);

      const degrees = degreesFromBoneWithRig(jointName, bone, rig);
      clampRom(jointName, degrees);
      applyDegreesToBone(jointName, bone, rig, degrees);
      result[jointName] = { ...(result[jointName] || {}), ...degrees };
      bone.updateWorldMatrix(false, true);
    }
    endEffector.getWorldPosition(effectorPos);
    if (effectorPos.distanceToSquared(target) < 1e-6) break;
  }
  return result;
}
