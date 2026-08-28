/**
 * 多选枢轴（multi-select pivot）— 还原自 formatted/index-Dp22JYcT.js:9438-9526
 * （membersCenter / snapshotPivot / recenterPivot / attachPivot / disposePivot）。
 *
 * 语义：
 * - attach：在成员包围盒中心（或宿主给定的显式 pivot）放空 Object3D 锚点，
 *   挂到 TransformControls 上整体拖拽；锚点带 _isMultiSelectPivot/_isHelper 标记。
 * - snapshot：拖拽开始前记录锚点与每个成员对象的 position/quaternion/scale，
 *   以及数据层 scale（非相机）或 lookAt（相机）快照，供 onGizmoChange 反推 delta。
 * - recenter：把锚点重置到显式 pivot 或重新计算的成员中心，姿态归零后重新快照。
 */
import * as THREE from 'three';
import type { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import type { Vec3 } from '../types';

/** 成员对象的数据层快照（formatted:9483-9493） */
export interface PivotMemberSnapshot {
  id: string;
  kind: 'character' | 'prop' | 'model' | 'camera' | null;
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  scale: THREE.Vector3;
  /** 数据层的 scale 字段（非相机成员） */
  dataScale?: Vec3;
  /** 数据层的 lookAt 字段（相机成员） */
  lookAt?: Vec3;
}

export interface MultiPivotHost {
  scene: THREE.Scene;
  gizmo: TransformControls;
  /** id → 场景对象 */
  selectionObject(id: string): THREE.Object3D | null | undefined;
  /** id → 选择类别 */
  selectionKind(id: string): 'character' | 'prop' | 'model' | 'camera' | null;
  /** 数据层当前合成（用于取 scale/lookAt 原值），由引擎注入 */
  dataOf(id: string): { scale?: Vec3; lookAt?: Vec3 } | undefined;
}

export class MultiSelectPivot {
  private readonly host: MultiPivotHost;
  private pivot: THREE.Object3D | null = null;
  private memberIds: string[] = [];
  private pivotStart: {
    position: THREE.Vector3;
    quaternion: THREE.Quaternion;
    scale: THREE.Vector3;
  } | null = null;
  private memberStarts: PivotMemberSnapshot[] = [];

  constructor(host: MultiPivotHost) {
    this.host = host;
  }

  get object(): THREE.Object3D | null {
    return this.pivot;
  }

  get ids(): string[] {
    return [...this.memberIds];
  }

  /**
   * 成员集合的公共中心：优先用所有成员世界包围盒并集中心；
   * 包围盒全空时退化为位置平均（formatted:9438-9456）。
   */
  membersCenter(ids: string[]): THREE.Vector3 {
    const box = new THREE.Box3();
    const objects: THREE.Object3D[] = [];
    for (const id of ids) {
      const object = this.host.selectionObject(id);
      if (!object) continue;
      objects.push(object);
      if (this.host.selectionKind(id) === 'camera') {
        box.expandByPoint(object.position);
      } else {
        box.expandByObject(object);
      }
    }
    if (!box.isEmpty()) return box.getCenter(new THREE.Vector3());
    const sum = new THREE.Vector3();
    for (const object of objects) sum.add(object.position);
    return sum.multiplyScalar(1 / Math.max(objects.length, 1));
  }

  attach(ids: string[], explicitPivot?: Vec3): void {
    this.dispose();
    const anchor = new THREE.Object3D();
    anchor.userData._isHelper = true;
    anchor.userData._isMultiSelectPivot = true;
    anchor.position.copy(
      explicitPivot ? new THREE.Vector3(explicitPivot.x, explicitPivot.y, explicitPivot.z) : this.membersCenter(ids),
    );
    this.host.scene.add(anchor);
    this.pivot = anchor;
    this.memberIds = ids;
    this.snapshot();
    this.host.gizmo.attach(anchor);
  }

  /** 记录拖拽起始状态：锚点变换 + 各成员对象变换 + 数据层字段 */
  snapshot(): void {
    if (!this.pivot) return;
    this.pivotStart = {
      position: this.pivot.position.clone(),
      quaternion: this.pivot.quaternion.clone(),
      scale: this.pivot.scale.clone(),
    };
    this.memberStarts = this.memberIds
      .filter((id) => !!this.host.selectionObject(id))
      .map((id) => {
        const object = this.host.selectionObject(id)!;
        const kind = this.host.selectionKind(id);
        const data = this.host.dataOf(id);
        return {
          id,
          kind,
          position: object.position.clone(),
          quaternion: object.quaternion.clone(),
          scale: object.scale.clone(),
          dataScale: kind !== 'camera' ? data?.scale : undefined,
          lookAt: kind === 'camera' ? data?.lookAt : undefined,
        };
      });
  }

  /** 锚点重置到显式 pivot（组数据带 pivot 时）或重新计算的成员中心，姿态归零 */
  recenter(explicitPivot?: Vec3): void {
    if (!this.pivot || this.memberIds.length < 2) return;
    if (explicitPivot) {
      this.pivot.position.set(explicitPivot.x, explicitPivot.y, explicitPivot.z);
    } else {
      this.pivot.position.copy(this.membersCenter(this.memberIds));
    }
    this.pivot.quaternion.set(0, 0, 0, 1);
    this.pivot.scale.set(1, 1, 1);
    this.pivot.rotation.set(0, 0, 0);
    this.snapshot();
  }

  dispose(): void {
    if (!this.pivot) return;
    if (this.host.gizmo.object === this.pivot) this.host.gizmo.detach();
    this.host.scene.remove(this.pivot);
    this.pivot = null;
    this.memberIds = [];
    this.pivotStart = null;
    this.memberStarts = [];
  }
}
