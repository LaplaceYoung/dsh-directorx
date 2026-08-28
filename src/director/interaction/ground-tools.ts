/**
 * 地面点选 + 地面绘制 — 还原自 formatted/index-Dp22JYcT.js:8306-8589
 * （requestGroundPick 系列 / requestGroundDraw 系列方法与共享 reticle）。
 *
 * 交互模型（jt 引擎原语义）：
 * - 点选：requestGroundPick(cb) 进入十字准星态；pointermove 更新 reticle；
 *   点击 → cb(Vector3|null) 并退出；Esc/再次请求 → cancel，cb(null)。
 * - 绘制：requestDraw(cb) 同样进入准星态；滚轮调绘制高度（0..30m，步进 0.25），
 *   reticle 抬升到高度平面并显示虚线垂线 + 高度标签；点击落点（与上点间距 ≥0.1m）；
 *   completeDraw() 在 ≥2 点时以点序回调。
 *
 * 两个模式互斥：任一 request 会先取消另一个。reticle 为环(0.34/0.4)+圆点(0.06)，
 * renderOrder=999、depthTest=false、y=0.01，userData._isHelper=true（快照隐藏标记）。
 */
import * as THREE from 'three';
import { ACCENT_COLOR, type ThemeName } from './theme';
import { makeTextSprite } from './text-sprite';

/** jt 类静态常量（formatted:10928-10932 S(jt,…)） */
export const GROUND_DRAW_MIN_GAP = 0.1;
export const GROUND_DRAW_H_STEP = 0.25;
export const GROUND_DRAW_H_MAX = 30;
export const GROUND_DRAW_CAP = 256;

export interface GroundToolsHost {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  /** 当前主题（决定辅助件强调色） */
  theme(): ThemeName;
}

type PickCallback = (point: THREE.Vector3 | null) => void;
type DrawCallback = (points: THREE.Vector3[] | null) => void;

export class GroundTools {
  private readonly host: GroundToolsHost;
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();

  private pickCb: PickCallback | null = null;
  private drawCb: DrawCallback | null = null;
  private drawHeight = 1.5;
  private drawPts: THREE.Vector3[] = [];
  private drawPointerXY: { clientX: number; clientY: number } | null = null;

  private reticle: THREE.Group | null = null;
  private drawLine: THREE.Line | null = null;
  private drawDots: THREE.Points | null = null;
  private drawVLine: THREE.Line | null = null;
  private heightLabel: THREE.Sprite | null = null;
  private heightLabelText = '';

  private readonly onWheel = (ev: WheelEvent): void => {
    if (!this.drawCb) return;
    ev.preventDefault();
    ev.stopPropagation();
    this.adjustHeight(ev.deltaY < 0 ? GROUND_DRAW_H_STEP : -GROUND_DRAW_H_STEP);
  };

  constructor(host: GroundToolsHost) {
    this.host = host;
    window.addEventListener('wheel', this.onWheel, { capture: true, passive: false });
  }

  // ---- 点选 ----

  requestPick(cb: PickCallback): void {
    this.cancelPick();
    this.cancelDraw();
    this.pickCb = cb;
    this.setCursor('crosshair');
    this.showReticle();
  }

  get pickActive(): boolean {
    return this.pickCb != null;
  }

  cancelPick(): void {
    const cb = this.pickCb;
    if (!cb) return;
    this.pickCb = null;
    this.setCursor('');
    this.hideReticle();
    cb(null);
  }

  resolvePick(ev: { clientX: number; clientY: number }): void {
    const cb = this.pickCb;
    if (!cb) return;
    this.pickCb = null;
    this.setCursor('');
    this.hideReticle();
    cb(this.groundPointFromEvent(ev));
  }

  /** 指针事件 → 地面(y=heightOffset 平面)交点；无交点返回 null */
  groundPointFromEvent(
    ev: { clientX: number; clientY: number },
    heightOffset = 0,
  ): THREE.Vector3 | null {
    const rect = this.dom.getBoundingClientRect();
    this.pointer.set(
      ((ev.clientX - rect.left) / rect.width) * 2 - 1,
      -((ev.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, this.host.camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -heightOffset);
    const hit = new THREE.Vector3();
    return this.raycaster.ray.intersectPlane(plane, hit) ? hit : null;
  }

  // ---- reticle ----

  showReticle(): void {
    if (this.reticle) return;
    const group = new THREE.Group();
      const material = (): THREE.MeshBasicMaterial =>
        new THREE.MeshBasicMaterial({
          color: ACCENT_COLOR[this.host.theme()],
          transparent: true,
          opacity: 0.9,
          depthTest: false,
          side: THREE.DoubleSide,
        });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.34, 0.4, 48), material());
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.06, 24), material());
    for (const mesh of [ring, dot]) {
      mesh.rotation.x = -Math.PI / 2;
      mesh.renderOrder = 999;
      group.add(mesh);
    }
    group.position.y = 0.01;
    group.visible = false;
    group.userData._isHelper = true;
    this.host.scene.add(group);
    this.reticle = group;
  }

  hideReticle(): void {
    const group = this.reticle;
    if (!group) return;
    this.reticle = null;
    this.host.scene.remove(group);
    group.children.forEach((child) => {
      const mesh = child as THREE.Mesh;
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    });
  }

  updateReticle(ev: { clientX: number; clientY: number }): void {
    const group = this.reticle;
    if (!group || !this.pickCb) return;
    const point = this.groundPointFromEvent(ev);
    if (point) {
      group.position.set(point.x, 0.01, point.z);
      group.visible = true;
    } else {
      group.visible = false;
    }
  }

  // ---- 绘制 ----

  requestDraw(cb: DrawCallback): void {
    this.cancelPick();
    this.cancelDraw();
    this.drawCb = cb;
    this.drawHeight = 1.5;
    this.setCursor('crosshair');
    this.showReticle();
  }

  get drawActive(): boolean {
    return this.drawCb != null;
  }

  cancelDraw(): void {
    this.finishDraw(null);
  }

  completeDraw(): void {
    if (!this.drawCb || this.drawPts.length < 2) return;
    this.finishDraw([...this.drawPts]);
  }

  adjustHeight(delta: number): void {
    if (!this.drawCb) return;
    this.drawHeight = THREE.MathUtils.clamp(this.drawHeight + delta, 0, GROUND_DRAW_H_MAX);
    this.refreshCursor();
  }

  addPoint(point: THREE.Vector3): void {
    const last = this.drawPts[this.drawPts.length - 1];
    if (last && last.distanceTo(point) < GROUND_DRAW_MIN_GAP) return;
    this.drawPts.push(point);
    this.updateLine();
  }

  setPointer(ev: { clientX: number; clientY: number } | null): void {
    this.drawPointerXY = ev;
  }

  /** 指针移动后按当前高度重算 reticle/垂线/预览线 */
  refreshCursor(): void {
    const xy = this.drawPointerXY;
    const cursor =
      xy ? this.groundPointFromEvent(xy, this.drawHeight) : null;
    const group = this.reticle;
    if (group) {
      if (cursor) {
        group.position.set(cursor.x, cursor.y + 0.01, cursor.z);
        group.visible = true;
      } else {
        group.visible = false;
      }
    }
    this.updateVLine(cursor);
    this.updateLine(cursor ?? undefined);
  }

  finishDraw(result: THREE.Vector3[] | null): void {
    const cb = this.drawCb;
    if (!cb) return;
    this.drawCb = null;
    this.drawPts = [];
    this.drawPointerXY = null;
    this.setCursor('');
    this.hideReticle();
    this.hideDrawHelpers();
    cb(result);
  }

  dispose(): void {
    window.removeEventListener('wheel', this.onWheel, { capture: true });
    this.cancelPick();
    this.cancelDraw();
  }

  // ---- 内部：绘制辅助件 ----

  private get dom(): HTMLElement {
    return this.host.renderer.domElement;
  }

  private setCursor(value: string): void {
    this.dom.style.cursor = value;
  }

  private updateVLine(point: THREE.Vector3 | null): void {
    const height = this.drawHeight;
    if (!point || height < 0.05) {
      if (this.drawVLine) this.drawVLine.visible = false;
      if (this.heightLabel) this.heightLabel.visible = false;
      return;
    }
    if (!this.drawVLine) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(2 * 3), 3).setUsage(THREE.DynamicDrawUsage),
      );
      geometry.setAttribute(
        'lineDistance',
        new THREE.BufferAttribute(new Float32Array(2), 1).setUsage(THREE.DynamicDrawUsage),
      );
      const line = new THREE.Line(
        geometry,
        new THREE.LineDashedMaterial({
          color: ACCENT_COLOR[this.host.theme()],
          transparent: true,
          opacity: 0.5,
          depthTest: false,
          dashSize: 0.2,
          gapSize: 0.15,
        }),
      );
      line.renderOrder = 999;
      line.frustumCulled = false;
      line.userData._isHelper = true;
      this.host.scene.add(line);
      this.drawVLine = line;
    }
    const line = this.drawVLine;
    const position = line.geometry.getAttribute('position') as THREE.BufferAttribute;
    position.setXYZ(0, point.x, 0, point.z);
    position.setXYZ(1, point.x, point.y, point.z);
    position.needsUpdate = true;
    const distances = line.geometry.getAttribute('lineDistance') as THREE.BufferAttribute;
    distances.setX(0, 0);
    distances.setX(1, Math.abs(point.y));
    distances.needsUpdate = true;
    line.computeLineDistances();
    line.visible = true;

    const text = `${height.toFixed(2)} m`;
    if (text !== this.heightLabelText || !this.heightLabel) {
      this.disposeHeightLabel();
      const sprite = makeTextSprite(text, 14, '#ffffff');
      if (sprite) {
        sprite.scale.set(sprite.__aspect * 0.32, 0.32, 1);
        sprite.renderOrder = 999;
        sprite.userData._isHelper = true;
        this.host.scene.add(sprite);
        this.heightLabel = sprite;
        this.heightLabelText = text;
      }
    }
    if (this.heightLabel) {
      this.heightLabel.position.set(point.x, point.y + 0.45, point.z);
      this.heightLabel.visible = true;
    }
  }

  private disposeHeightLabel(): void {
    const sprite = this.heightLabel;
    if (!sprite) return;
    this.heightLabel = null;
    this.heightLabelText = '';
    this.host.scene.remove(sprite);
    const material = sprite.material as THREE.SpriteMaterial;
    material.map?.dispose();
    material.dispose();
  }

  /** 复用容量≥CAP 的 position buffer 写入折线/点列（y+0.02 防 z-fight） */
  private writeDrawGeometry(geometry: THREE.BufferGeometry, pts: THREE.Vector3[]): void {
    let attribute = geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
    if (!attribute || attribute.count < pts.length) {
      const capacity = Math.max(GROUND_DRAW_CAP, THREE.MathUtils.ceilPowerOfTwo(pts.length));
      attribute = new THREE.BufferAttribute(new Float32Array(capacity * 3), 3).setUsage(
        THREE.DynamicDrawUsage,
      ) as THREE.BufferAttribute;
      geometry.setAttribute('position', attribute);
    }
    for (let i = 0; i < pts.length; i++) attribute.setXYZ(i, pts[i].x, pts[i].y + 0.02, pts[i].z);
    attribute.needsUpdate = true;
    geometry.setDrawRange(0, pts.length);
  }

  private updateLine(cursorPoint?: THREE.Vector3): void {
    if (this.drawPts.length > 0) {
      if (!this.drawDots) {
        const dots = new THREE.Points(
          new THREE.BufferGeometry(),
          new THREE.PointsMaterial({
            color: ACCENT_COLOR[this.host.theme()],
            size: 8,
            sizeAttenuation: false,
            transparent: true,
            opacity: 0.95,
            depthTest: false,
          }),
        );
        dots.renderOrder = 999;
        dots.frustumCulled = false;
        dots.userData._isHelper = true;
        this.host.scene.add(dots);
        this.drawDots = dots;
      }
      this.writeDrawGeometry(this.drawDots.geometry, this.drawPts);
      this.drawDots.visible = true;
    } else if (this.drawDots) {
      this.drawDots.visible = false;
    }

    const preview = cursorPoint ? [...this.drawPts, cursorPoint] : this.drawPts;
    if (preview.length < 2) {
      if (this.drawLine) this.drawLine.visible = false;
      return;
    }
    if (!this.drawLine) {
      const line = new THREE.Line(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({
          color: ACCENT_COLOR[this.host.theme()],
          transparent: true,
          opacity: 0.9,
          depthTest: false,
        }),
      );
      line.renderOrder = 999;
      line.frustumCulled = false;
      line.userData._isHelper = true;
      this.host.scene.add(line);
      this.drawLine = line;
    }
    this.writeDrawGeometry(this.drawLine.geometry, preview);
    this.drawLine.visible = true;
  }

  private hideDrawHelpers(): void {
    const line = this.drawLine;
    if (line) {
      this.drawLine = null;
      this.host.scene.remove(line);
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    }
    const dots = this.drawDots;
    if (dots) {
      this.drawDots = null;
      this.host.scene.remove(dots);
      dots.geometry.dispose();
      (dots.material as THREE.Material).dispose();
    }
    const vline = this.drawVLine;
    if (vline) {
      this.drawVLine = null;
      this.host.scene.remove(vline);
      vline.geometry.dispose();
      (vline.material as THREE.Material).dispose();
    }
    this.disposeHeightLabel();
  }
}
