/**
 * 视口框选（marquee）— 还原自 formatted/index-Dp22JYcT.js:8821-8941
 * （beginMarquee / updateMarqueeElement / idsInMarquee / finishMarquee）。
 *
 * 语义：
 * - pointerdown 起框：禁用 OrbitControls，setPointerCapture，画 1px 蓝框 DOM；
 *   拖拽 >4px 判定为框选，否则回退单点 pick（mode=add 时叠加、remove 时反选）。
 * - 命中判定：对每个可选对象取包围盒（相机对象用固定 0.4m 立方），投影 8 角点
 *   到屏幕（NDC z∈[-1,1] 才计入），屏幕矩形与框相交即命中。
 */
import * as THREE from 'three';

export type MarqueeMode = 'set' | 'add' | 'remove';

export interface MarqueeHost {
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  /** 框选 DOM 的挂载容器（视口宿主元素） */
  host: HTMLElement;
  /** 当前可见的可选 id 全集（角色+道具+代码模型+相机的 keys 并集） */
  selectableIds(): string[];
  /** id → 场景对象（不可见返回 null/undefined） */
  selectionObject(id: string): THREE.Object3D | null | undefined;
  /** 该 id 是否为相机对象（拾取盒用固定 0.4m 立方而非整体包围盒） */
  isCameraId(id: string): boolean;
  /** 单点拾取（拖拽距离过小时的回退路径），无命中返回 null */
  pick(ev: PointerEvent): string | null;
  /** 单点选择（id=null 清空；additive=叠加；fromMarqueeFallback=框选回退路径，原实现固定 false） */
  onSelect(id: string | null, additive: boolean, fromMarqueeFallback: boolean): void;
  onSelectMany(ids: string[], mode: MarqueeMode): void;
  /** 恢复 controls.enabled 的回调（视口处于相机视图/驾驶态时保持 false） */
  controlsEnabledDefault(): boolean;
  setControlsEnabled(enabled: boolean): void;
}
interface MarqueeState {
  pointerId: number;
  startX: number;
  startY: number;
  mode: MarqueeMode;
}

const MARQUEE_MIN_DRAG = 4;
/** 相机对象的近似拾取盒边长（formatted:8874） */
const CAM_PICK_SIZE = 0.4;

export class MarqueeController {
  private readonly host: MarqueeHost;
  private marquee: MarqueeState | null = null;
  private marqueeEl: HTMLDivElement | null = null;

  constructor(host: MarqueeHost) {
    this.host = host;
  }

  get active(): boolean {
    return this.marquee != null;
  }

  begin(ev: PointerEvent, mode: MarqueeMode): void {
    this.marquee = {
      pointerId: ev.pointerId,
      startX: ev.clientX,
      startY: ev.clientY,
      mode,
    };
    this.host.setControlsEnabled(false);
    this.host.renderer.domElement.setPointerCapture(ev.pointerId);
    if (!this.marqueeEl) {
      const el = document.createElement('div');
      el.style.cssText = [
        'position:absolute',
        'pointer-events:none',
        'z-index:30',
        'border:1px solid rgba(96,165,250,.95)',
        'background:rgba(59,130,246,.14)',
      ].join(';');
      this.host.host.appendChild(el);
      this.marqueeEl = el;
    }
    this.updateRect(ev.clientX, ev.clientY);
  }

  updateRect(clientX: number, clientY: number): void {
    if (!this.marquee || !this.marqueeEl) return;
    const rect = this.host.host.getBoundingClientRect();
    const left = Math.min(this.marquee.startX, clientX) - rect.left;
    const top = Math.min(this.marquee.startY, clientY) - rect.top;
    this.marqueeEl.style.left = `${left}px`;
    this.marqueeEl.style.top = `${top}px`;
    this.marqueeEl.style.width = `${Math.abs(clientX - this.marquee.startX)}px`;
    this.marqueeEl.style.height = `${Math.abs(clientY - this.marquee.startY)}px`;
  }

  /**
   * 屏幕矩形 (x1,y1)-(x2,y2) 内命中的对象 id。
   * 投影包围盒 8 角点取屏幕 AABB 再做相交测试；被裁剪角点（z 出 [-1,1]）跳过。
   */
  idsInRect(x1: number, y1: number, x2: number, y2: number): string[] {
    const rect = this.host.renderer.domElement.getBoundingClientRect();
    const target = {
      left: Math.min(x1, x2),
      right: Math.max(x1, x2),
      top: Math.min(y1, y2),
      bottom: Math.max(y1, y2),
    };
    const hits: string[] = [];
    const box = new THREE.Box3();
    for (const id of this.host.selectableIds()) {
      const object = this.host.selectionObject(id);
      if (!object?.visible) continue;
      if (this.host.isCameraId(id)) {
        box.setFromCenterAndSize(
          object.position,
          new THREE.Vector3(CAM_PICK_SIZE, CAM_PICK_SIZE, CAM_PICK_SIZE),
        );
      } else {
        box.setFromObject(object);
      }
      if (box.isEmpty()) continue;

      const corners = [
        new THREE.Vector3(box.min.x, box.min.y, box.min.z),
        new THREE.Vector3(box.min.x, box.min.y, box.max.z),
        new THREE.Vector3(box.min.x, box.max.y, box.min.z),
        new THREE.Vector3(box.min.x, box.max.y, box.max.z),
        new THREE.Vector3(box.max.x, box.min.y, box.min.z),
        new THREE.Vector3(box.max.x, box.min.y, box.max.z),
        new THREE.Vector3(box.max.x, box.max.y, box.min.z),
        new THREE.Vector3(box.max.x, box.max.y, box.max.z),
      ];
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      let projected = false;
      for (const corner of corners) {
        const p = corner.project(this.host.camera);
        if (p.z < -1 || p.z > 1) continue;
        projected = true;
        const sx = rect.left + ((p.x + 1) * rect.width) / 2;
        const sy = rect.top + ((1 - p.y) * rect.height) / 2;
        minX = Math.min(minX, sx);
        maxX = Math.max(maxX, sx);
        minY = Math.min(minY, sy);
        maxY = Math.max(maxY, sy);
      }
      if (
        projected &&
        minX <= target.right &&
        maxX >= target.left &&
        minY <= target.bottom &&
        maxY >= target.top
      ) {
        hits.push(id);
      }
    }
    return hits;
  }

  /** pointerup 收尾：返回 true 表示事件已被框选消费 */
  finish(ev: PointerEvent): boolean {
    const state = this.marquee;
    if (!state || state.pointerId !== ev.pointerId) return false;
    this.marquee = null;
    this.marqueeEl?.remove();
    this.marqueeEl = null;
    if (this.host.renderer.domElement.hasPointerCapture(ev.pointerId)) {
      this.host.renderer.domElement.releasePointerCapture(ev.pointerId);
    }
    this.host.setControlsEnabled(this.host.controlsEnabledDefault());

    if (Math.hypot(ev.clientX - state.startX, ev.clientY - state.startY) > MARQUEE_MIN_DRAG) {
      this.host.onSelectMany(
        this.idsInRect(state.startX, state.startY, ev.clientX, ev.clientY),
        state.mode,
      );
    } else {
      const hit = this.host.pick(ev);
      if (state.mode === 'remove') {
        this.host.onSelectMany(hit ? [hit] : [], 'remove');
      } else {
        this.host.onSelect(hit, state.mode === 'add', false);
      }
    }
    ev.preventDefault();
    ev.stopPropagation();
    return true;
  }

  dispose(): void {
    this.marquee = null;
    this.marqueeEl?.remove();
    this.marqueeEl = null;
  }
}
