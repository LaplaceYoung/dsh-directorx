/**
 * Campath 场景编辑器 — 视口内直接操控相机路径（原版 sp 类完整还原）。
 *
 * 交互模型（从 bundle 解密）：
 * - 控制点球手柄（主题色，选中高亮）+ 选中点的 in/out 切线手柄 + 切线连线
 * - TransformControls 拖拽（translate/world）；Alt 按下拖切线 → tangentMode: free
 * - aligned 模式下拖一手柄，对侧手柄自动镜像对齐（保持长度）
 * - 双击曲线 → 就近采样点处 De Casteljau 插入新控制点
 * - lookAt 点手柄（粉色 sprite 标签，y+3.2 悬浮）
 * - 手柄尺寸随相机距离缩放（Rc：2·tan(fov/2)/viewportHeight × 距离）
 *
 * 对应关系：sp → CamPathEditor、Dc → sampleCurve、Rc → handleScaleFactor、
 * vr → clonePoints、cs → toPlain、颜色常量 tp/np/Ja/po/Jh/ep、Nc/Za/uo。
 */

import * as THREE from 'three'
import {
  clonePoints,
  sampleCurve,
  toPlain,
  toVec3,
  type CamPathPoint,
  type CurveSample,
  type Vec3Like,
} from './curve-engine'

// ── 原版常量 ──

/** 曲线线色（原版 tp = 8248575 = 0x7DDFFF 浅蓝）*/
export const COLOR_CURVE = 0x7ddfff
/** 切线线色（原版 np = 10265519）*/
export const COLOR_TANGENT = 0x9c9aef
/** lookAt 未选中色（原版 Ja = 16020150）*/
export const COLOR_LOOKAT = 16020150
/** 选中高亮色（原版 po = 16347926）*/
export const COLOR_SELECTED = 16347926
/** in 手柄色（原版 Jh = 2282478）*/
export const COLOR_IN = 2282478
/** out 手柄色（原版 ep = 16436245）*/
export const COLOR_OUT = 16436245
/** 主题手柄色（原版 ho）*/
export const THEME_COLORS = { dark: 0xffffff, light: 0x000000 } as const

export type DragKind = 'point' | 'in' | 'out' | 'lookAt'

export interface EditorHost {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  dom: HTMLElement
  gizmo: {
    setMode(mode: string): void
    setSpace(space: string): void
    showX: boolean
    showY: boolean
    showZ: boolean
    attach(obj: THREE.Object3D): void
    detach(): void
    object: THREE.Object3D | null
  }
  detachMainGizmo(): void
  onCamPathEdit(
    takeId: string,
    points: CamPathPoint[],
    needHistory: boolean,
    extra?: { lookAt?: Vec3Like },
  ): void
  onCamPathPointSelect(idx: number | null): void
}

/** 手柄屏幕尺寸系数（原版 Rc）：世界单位 → 屏幕像素比例 */
export function handleScaleFactor(camera: THREE.PerspectiveCamera, viewportHeight: number): number {
  return (2 * Math.tan((camera.fov * Math.PI) / 360)) / viewportHeight
}

/** 屏幕坐标 → NDC 并设置 raycaster（原版 Ns）*/
export function setRaycasterFromPointer(
  raycaster: THREE.Raycaster,
  pointer: THREE.Vector2,
  event: { clientX: number; clientY: number },
  dom: HTMLElement,
  camera: THREE.Camera,
): void {
  const rect = dom.getBoundingClientRect()
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  raycaster.setFromCamera(pointer, camera)
}

/**
 * Campath 编辑器（原版 sp）。
 * 泛型 G 为 gizmo anchor 类型（原版用空 Object3D 挂 TransformControls）。
 */
export class CamPathEditor {
  private host: EditorHost
  private theme: keyof typeof THEME_COLORS = 'dark'
  private raycaster = new THREE.Raycaster()
  private pointer = new THREE.Vector2()
  private takeId: string | null = null
  private points: CamPathPoint[] = []
  private closed = false
  private lastEmitted: CamPathPoint[] | null = null
  private selectedIdx: number | null = null
  private _dragKind: DragKind | null = null
  private pointHandles: THREE.Mesh[] = []
  private inHandle: THREE.Mesh | null = null
  private outHandle: THREE.Mesh | null = null
  private tangentLine: THREE.Line | null = null
  private curveLine: THREE.Line | null = null
  private lookAt: Vec3Like | null = null
  private lookAtHandle: THREE.Mesh | null = null
  private lookAtSelected = false
  private sampleCache: CurveSample[] = []
  private anchor: THREE.Object3D | null = null
  private altHeld = false
  private _tmpVec = new THREE.Vector3()

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Alt') this.altHeld = true
  }
  private readonly onKeyUp = (e: KeyboardEvent): void => {
    if (e.key === 'Alt') this.altHeld = false
  }
  private readonly onBlur = (): void => {
    this.altHeld = false
  }

  constructor(host: EditorHost) {
    this.host = host
  }

  // ── 状态查询 ──

  get active(): boolean { return this.takeId != null }
  get activeTakeId(): string | null { return this.takeId }
  get hasSelection(): boolean { return this.selectedIdx != null || this.lookAtSelected }
  get lookAtIsSelected(): boolean { return this.lookAtSelected }
  get ownsGizmo(): boolean {
    return this._dragKind != null && this.anchor != null && this.host.gizmo.object === this.anchor
  }

  setTheme(theme: keyof typeof THEME_COLORS): void {
    this.theme = theme
    this.pointHandles.forEach((h, i) => {
      if (i !== this.selectedIdx) (h.material as THREE.MeshBasicMaterial).color.setHex(THEME_COLORS[theme])
    })
  }

  // ── 进入/退出 ──

  enter(takeId: string, points: CamPathPoint[], closed = false, lookAt?: Vec3Like | null): void {
    if (this.takeId) this.exit()
    this.takeId = takeId
    this.closed = closed
    this.lookAt = lookAt ? { ...lookAt } : null
    this.points = clonePoints(points)
    this.lastEmitted = clonePoints(points)
    this.host.detachMainGizmo()
    this.buildVisuals()
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    window.addEventListener('blur', this.onBlur)
  }

  exit(): void {
    this.takeId = null
    this.clearSelection()
    this.disposeLookAtHandle()
    this.disposeObj(this.curveLine)
    this.curveLine = null
    this.points = []
    this.sampleCache = []
    this.lookAt = null
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('blur', this.onBlur)
  }

  /** 外部数据同步（原版 setPoints 逻辑）：相同则跳过；空则退出 */
  setPoints(points: CamPathPoint[], lookAt?: Vec3Like): boolean {
    if (lookAt !== undefined) this.setLookAt(lookAt)
    if (points === this.lastEmitted) return true
    if (!points || points.length === 0) {
      this.exit()
      return false
    }
    const prevSelected = this.selectedIdx
    this.points = clonePoints(points)
    this.lastEmitted = clonePoints(points)
    this.clearSelection()
    this.rebuildPointHandles()
    this.rebuildCurve()
    if (prevSelected != null) this.selectPoint(Math.min(prevSelected, this.points.length - 1))
    return true
  }

  setClosed(closed: boolean): void {
    if (!this.takeId || this.closed === closed) return
    this.closed = closed
    this.rebuildCurve()
  }

  // ── 视觉构建 ──

  private buildVisuals(): void {
    this.curveLine = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: COLOR_CURVE, transparent: true, opacity: 0.85, depthTest: false }),
    )
    this.curveLine.renderOrder = 998
    this.curveLine.userData._isHelper = true
    this.curveLine.userData._isCamPathHandle = true
    this.host.scene.add(this.curveLine)
    this.rebuildPointHandles()
    this.rebuildLookAtHandle()
    this.rebuildCurve()
  }

  private rebuildLookAtHandle(): void {
    this.disposeLookAtHandle()
    if (!this.lookAt) return
    const handle = this.makeHandle(this.lookAtSelected ? COLOR_SELECTED : COLOR_LOOKAT, 'lookAt', -1)
    this.lookAtHandle = handle
  }

  private disposeLookAtHandle(): void {
    const handle = this.lookAtHandle
    if (!handle) return
    this.disposeObj(handle)
    this.lookAtHandle = null
  }

  /** 外部设置 lookAt 坐标（原版 setLookAt）*/
  setLookAt(lookAt: Vec3Like | null): void {
    const had = !!this.lookAt
    this.lookAt = lookAt ? { ...lookAt } : null
    if (!this.lookAt) {
      if (had) {
        const wasSelected = this.lookAtSelected
        if (this._dragKind === 'lookAt') this.detachGizmo()
        this.clearLookAtSelection()
        this.disposeLookAtHandle()
        if (wasSelected) this.host.onCamPathPointSelect(null)
      }
      return
    }
    if (!had || !this.lookAtHandle) this.rebuildLookAtHandle()
    if (this._dragKind === 'lookAt' && this.anchor) {
      this.anchor.position.set(this.lookAt.x, this.lookAt.y, this.lookAt.z)
    }
  }

  private makeHandle(color: number, kind: DragKind, idx: number): THREE.Mesh {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 16, 12),
      new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true, opacity: 0.9 }),
    )
    mesh.renderOrder = 999
    mesh.userData._isHelper = true
    mesh.userData._isCamPathHandle = true
    mesh.userData.pathKind = kind
    mesh.userData.pathIdx = idx
    this.host.scene.add(mesh)
    return mesh
  }

  private disposeObj(obj: THREE.Object3D | null): void {
    if (!obj) return
    this.host.scene.remove(obj)
    const mesh = obj as THREE.Mesh
    if (mesh.geometry) mesh.geometry.dispose()
    const mat = (mesh as unknown as { material?: THREE.Material }).material
    if (mat) mat.dispose()
  }

  private rebuildPointHandles(): void {
    this.pointHandles.forEach(h => this.disposeObj(h))
    this.pointHandles = this.points.map((_, i) =>
      this.makeHandle(i === this.selectedIdx ? COLOR_SELECTED : THEME_COLORS[this.theme], 'point', i),
    )
  }

  private rebuildCurve(): void {
    if (!this.curveLine) return
    this.sampleCache = this.points.length >= 2 ? sampleCurve(this.points, 32, this.closed) : []
    const positions = this.sampleCache.map(s => s.pos)
    this.curveLine.visible = positions.length >= 2
    this.curveLine.geometry.setFromPoints(positions)
  }

  /** 手柄位置 + 距离衰减缩放（原版 updateHandleScales）*/
  updateHandleScales(camera: THREE.PerspectiveCamera): void {
    if (!this.takeId) return
    const viewportH = this.host.dom.clientHeight || 600
    const factor = handleScaleFactor(camera, viewportH)
    const tmp = this._tmpVec
    const place = (handle: THREE.Mesh | null, pos: THREE.Vector3, base: number): void => {
      if (!handle) return
      handle.position.copy(pos)
      const dist = camera.position.distanceTo(pos)
      handle.scale.setScalar(base * dist * factor)
    }
    this.pointHandles.forEach((handle, i) => {
      const p = this.points[i]
      if (p) place(handle, tmp.set(p.position.x, p.position.y, p.position.z), 6)
    })
    if (this.lookAtHandle && this.lookAt) {
      place(this.lookAtHandle, tmp.set(this.lookAt.x, this.lookAt.y, this.lookAt.z), 6)
    }
    const sel = this.selectedIdx != null ? this.points[this.selectedIdx] : null
    if (sel) {
      place(this.inHandle, tmp.set(sel.position.x + sel.in.x, sel.position.y + sel.in.y, sel.position.z + sel.in.z), 4.8)
      place(this.outHandle, tmp.set(sel.position.x + sel.out.x, sel.position.y + sel.out.y, sel.position.z + sel.out.z), 4.8)
    }
  }

  /** 选中点的 in/out 手柄 + 切线连线（原版 refreshTangentVisuals）*/
  private refreshTangentVisuals(): void {
    const idx = this.selectedIdx
    if (idx == null) return
    const p = this.points[idx]
    if (!p) return

    if (!this.inHandle) this.inHandle = this.makeHandle(COLOR_IN, 'in', idx)
    if (!this.outHandle) this.outHandle = this.makeHandle(COLOR_OUT, 'out', idx)
    this.inHandle.userData.pathIdx = idx
    this.outHandle.userData.pathIdx = idx

    const pos = toVec3(p.position)
    const inPos = pos.clone().add(toVec3(p.in))
    const outPos = pos.clone().add(toVec3(p.out))

    if (!this.tangentLine) {
      this.tangentLine = new THREE.Line(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({ color: COLOR_TANGENT, transparent: true, opacity: 0.7, depthTest: false }),
      )
      this.tangentLine.renderOrder = 998
      this.tangentLine.userData._isHelper = true
      this.tangentLine.userData._isCamPathHandle = true
      this.host.scene.add(this.tangentLine)
    }
    this.tangentLine.geometry.setFromPoints([inPos, pos, outPos])
  }

  // ── 拾取与选择 ──

  pickHandle(event: { clientX: number; clientY: number }): { kind: DragKind; idx: number } | null {
    if (!this.takeId) return null
    setRaycasterFromPointer(this.raycaster, this.pointer, event, this.host.dom, this.host.camera)

    // 优先切线手柄
    const tangentHandles = [this.inHandle, this.outHandle].filter(Boolean) as THREE.Mesh[]
    if (tangentHandles.length) {
      const hit = this.raycaster.intersectObjects(tangentHandles, false)[0]
      if (hit) return { kind: hit.object.userData.pathKind, idx: hit.object.userData.pathIdx }
    }
    const pointHit = this.raycaster.intersectObjects(this.pointHandles, false)[0]
    if (pointHit) return { kind: 'point', idx: pointHit.object.userData.pathIdx }
    if (this.lookAtHandle && this.raycaster.intersectObject(this.lookAtHandle, false)[0]) {
      return { kind: 'lookAt', idx: -1 }
    }
    return null
  }

  selectHandle(hit: { kind: DragKind; idx: number }): void {
    if (hit.kind === 'point') this.selectPoint(hit.idx)
    else if (hit.kind === 'lookAt') this.selectLookAt()
    else if (hit.idx === this.selectedIdx) this.attachGizmoTo(hit.kind, hit.idx)
  }

  private selectLookAt(): void {
    if (!this.lookAtHandle || !this.lookAt) return
    if (this.lookAtSelected) {
      if (this._dragKind !== 'lookAt') this.attachGizmoTo('lookAt', -1)
      return
    }
    this.clearSelection()
    this.lookAtSelected = true
    ;(this.lookAtHandle.material as THREE.MeshBasicMaterial).color.setHex(COLOR_SELECTED)
    this.attachGizmoTo('lookAt', -1)
  }

  private clearLookAtSelection(): void {
    if (!this.lookAtSelected) return
    this.lookAtSelected = false
    if (this.lookAtHandle) {
      (this.lookAtHandle.material as THREE.MeshBasicMaterial).color.setHex(COLOR_LOOKAT)
    }
  }

  selectPoint(idx: number): void {
    if (idx < 0 || idx >= this.points.length) return
    this.clearLookAtSelection()
    if (idx === this.selectedIdx) {
      if (this._dragKind !== 'point') this.attachGizmoTo('point', idx)
      return
    }
    if (this.selectedIdx != null && this.pointHandles[this.selectedIdx]) {
      (this.pointHandles[this.selectedIdx].material as THREE.MeshBasicMaterial).color.setHex(THEME_COLORS[this.theme])
    }
    this.selectedIdx = idx
    ;(this.pointHandles[idx].material as THREE.MeshBasicMaterial).color.setHex(COLOR_SELECTED)
    this.refreshTangentVisuals()
    this.attachGizmoTo('point', idx)
    this.host.onCamPathPointSelect(idx)
  }

  clearSelection(): void {
    const had = this.selectedIdx != null || this.lookAtSelected
    if (this.selectedIdx != null && this.pointHandles[this.selectedIdx]) {
      (this.pointHandles[this.selectedIdx].material as THREE.MeshBasicMaterial).color.setHex(THEME_COLORS[this.theme])
    }
    this.selectedIdx = null
    this.clearLookAtSelection()
    this.disposeObj(this.inHandle)
    this.disposeObj(this.outHandle)
    this.disposeObj(this.tangentLine)
    this.inHandle = null
    this.outHandle = null
    this.tangentLine = null
    this.detachGizmo()
    if (had) this.host.onCamPathPointSelect(null)
  }

  // ── Gizmo 拖拽 ──

  private attachGizmoTo(kind: DragKind, idx: number): void {
    let pos: THREE.Vector3
    if (kind === 'lookAt') {
      if (!this.lookAt) return
      pos = new THREE.Vector3(this.lookAt.x, this.lookAt.y, this.lookAt.z)
    } else {
      const p = this.points[idx]
      if (!p) return
      pos = toVec3(p.position)
      if (kind === 'in') pos.add(toVec3(p.in))
      else if (kind === 'out') pos.add(toVec3(p.out))
    }
    this.detachGizmo()
    const anchor = new THREE.Object3D()
    anchor.userData._isHelper = true
    anchor.position.copy(pos)
    this.host.scene.add(anchor)
    this.anchor = anchor
    this._dragKind = kind
    const gizmo = this.host.gizmo
    gizmo.setMode('translate')
    gizmo.setSpace('world')
    gizmo.showX = true
    gizmo.showY = true
    gizmo.showZ = true
    gizmo.attach(anchor)
  }

  private detachGizmo(): void {
    if (!this._dragKind) return
    this.host.gizmo.detach()
    if (this.anchor) {
      this.host.scene.remove(this.anchor)
      this.anchor = null
    }
    this._dragKind = null
  }

  /** TransformControls change 回调（原版 onGizmoChange）*/
  onGizmoChange(needHistory: boolean): void {
    const kind = this._dragKind
    const anchor = this.anchor
    if (!kind || !anchor) return

    if (kind === 'lookAt') {
      if (!this.lookAt) return
      this.lookAt = toPlain(anchor.position)
      this.emit(needHistory, { lookAt: { ...this.lookAt } })
      return
    }

    const idx = this.selectedIdx
    if (idx == null) return
    const p = this.points[idx]
    if (!p) return

    if (kind === 'point') {
      p.position = toPlain(anchor.position)
    } else {
      const offset = anchor.position.clone().sub(toVec3(p.position))
      if (this.altHeld) p.tangentMode = 'free'
      const aligned = (p.tangentMode ?? 'aligned') === 'aligned'
      if (kind === 'out') {
        p.out = toPlain(offset)
        if (!this.altHeld && aligned) this.alignOpposite(p, 'in', offset)
      } else {
        p.in = toPlain(offset)
        if (!this.altHeld && aligned) this.alignOpposite(p, 'out', offset)
      }
    }
    this.rebuildCurve()
    this.refreshTangentVisuals()
    this.emit(needHistory)
  }

  /** 对侧手柄镜像对齐（保持自身长度，方向取反）（原版 alignOpposite）*/
  private alignOpposite(p: CamPathPoint, side: 'in' | 'out', from: THREE.Vector3): void {
    const lenSq = from.lengthSq()
    if (lenSq < 1e-12) return
    const ownLen = toVec3(p[side]).length()
    if (ownLen < 1e-6) return
    const mirrored = from.clone().multiplyScalar(-ownLen / Math.sqrt(lenSq))
    p[side] = toPlain(mirrored)
  }

  private emit(needHistory: boolean, extra?: { lookAt?: Vec3Like }): void {
    if (!this.takeId) return
    const snapshot = clonePoints(this.points)
    this.lastEmitted = snapshot
    this.host.onCamPathEdit(this.takeId, snapshot, needHistory, extra)
  }

  /** 程序化更新单点属性（原版 updatePoint）*/
  updatePoint(idx: number, patch: Partial<CamPathPoint>, needHistory: boolean): void {
    if (!this.takeId) return
    const p = this.points[idx]
    if (!p) return
    const prevMode = p.tangentMode ?? 'aligned'
    Object.assign(p, patch)
    if ((p.tangentMode ?? 'aligned') === 'aligned') {
      if (patch.out) this.alignOpposite(p, 'in', toVec3(patch.out))
      else if (patch.in) this.alignOpposite(p, 'out', toVec3(patch.in))
      else if (prevMode === 'free' && patch.tangentMode === 'aligned') {
        this.alignOpposite(p, 'in', toVec3(p.out))
      }
    }
    if (this.anchor && this.selectedIdx === idx && this._dragKind) {
      const pos = toVec3(p.position)
      if (this._dragKind === 'in') pos.add(toVec3(p.in))
      else if (this._dragKind === 'out') pos.add(toVec3(p.out))
      this.anchor.position.copy(pos)
    }
    this.rebuildCurve()
    this.refreshTangentVisuals()
    this.emit(needHistory)
  }

  // ── 插入/删除 ──

  /**
   * 双击曲线插点（原版 tryInsertFromDblClick）：
   * 屏幕空间找最近采样点 → splitSegment(seg, t clamp 0.05-0.95)
   */
  tryInsertFromDblClick(event: { clientX: number; clientY: number }): boolean {
    if (!this.takeId || this.sampleCache.length === 0) return false
    const rect = this.host.dom.getBoundingClientRect()
    const camera = this.host.camera
    const proj = new THREE.Vector3()
    let best: { seg: number; t: number } | null = null
    let bestDistSq = 12 * 12 // 原版 Za²
    for (const sample of this.sampleCache) {
      proj.copy(sample.pos).project(camera)
      if (proj.z > 1) continue
      const sx = ((proj.x + 1) / 2) * rect.width + rect.left
      const sy = ((-proj.y + 1) / 2) * rect.height + rect.top
      const distSq = (sx - event.clientX) ** 2 + (sy - event.clientY) ** 2
      if (distSq < bestDistSq) {
        bestDistSq = distSq
        best = { seg: sample.seg, t: sample.t }
      }
    }
    if (!best) return false
    const t = THREE.MathUtils.clamp(best.t, 0.05, 0.95)
    return this.splitSegment(best.seg, t)
  }

  /** De Casteljau 分段插入（原版 splitSegment）：在 seg 段 t 处插入新控制点 */
  splitSegment(seg: number, t: number): boolean {
    const n = this.points.length
    const p0 = this.points[seg]
    const p1 = this.points[(seg + 1) % n]
    if (!p0 || !p1) return false

    const pos0 = toVec3(p0.position)
    const a = pos0.clone().add(toVec3(p0.out)) // P1
    const pos1 = toVec3(p1.position)
    const d = pos1.clone().add(toVec3(p1.in)) // P2

    // 三阶贝塞尔 De Casteljau
    const u = pos0.clone().lerp(a, t)
    const h = a.clone().lerp(d, t)
    const m = d.clone().lerp(pos1, t)
    const f = u.clone().lerp(h, t)
    const g = h.clone().lerp(m, t)
    const newPoint = f.clone().lerp(g, t)

    const inserted: CamPathPoint = {
      position: toPlain(newPoint),
      in: toPlain(f.sub(newPoint)),
      out: toPlain(g.sub(newPoint)),
      tilt: (p0.tilt ?? 0) * (1 - t) + (p1.tilt ?? 0) * t,
      speed: (p0.speed ?? 1) * (1 - t) + (p1.speed ?? 1) * t,
    }
    // 缩短原两端手柄
    p0.out = toPlain(u.sub(pos0))
    p1.in = toPlain(m.sub(pos1))

    this.points.splice(seg + 1, 0, inserted)
    this.clearSelection()
    this.rebuildPointHandles()
    this.rebuildCurve()
    this.selectPoint(seg + 1)
    this.emit(true)
    return true
  }

  deleteSelected(): boolean {
    const idx = this.selectedIdx
    if (idx == null || this.points.length <= 2) return false
    this.points.splice(idx, 1)
    this.clearSelection()
    this.rebuildPointHandles()
    this.rebuildCurve()
    this.emit(true)
    return true
  }
}
