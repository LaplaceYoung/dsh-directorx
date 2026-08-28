/**
 * 离屏快照管线 — scene.snapshot / model.capture 的渲染端实现。
 *
 * 三种模式：
 * 1. 场景当前视口快照（隐藏 helpers/gizmos 后强制渲染）
 * 2. 时间轴多帧采样（atTimes 1-8 个毫秒点，逐帧求值后导出）
 * 3. 标准七视图模型离屏捕获（中性灰 studio）
 */

import * as THREE from 'three'

export interface CapturedFrame {
  tMs?: number
  dataUrl: string
  width: number
  height: number
}

export interface SnapshotSheet {
  dataUrl: string
  width: number
  height: number
  cells: { tMs: number; row: number; col: number }[]
}

/** 隐藏标记：快照时按 userData 跳过这些对象 */
const HIDE_MARKERS = ['isLabel', 'isCameraLabel', 'isGizmo', 'isHelper', 'isHelperLine']

/**
 * 隐藏所有标记的 helper/gizmo，返回幂等恢复闭包。
 */
export function hideMarkedHelpers(scene: THREE.Object3D): () => void {
  const hidden: { obj: THREE.Object3D; visible: boolean }[] = []
  scene.traverse((obj) => {
    if (HIDE_MARKERS.some(m => (obj.userData as Record<string, unknown>)[m]) && obj.visible) {
      hidden.push({ obj, visible: true })
      obj.visible = false
    }
  })
  let restored = false
  return () => {
    if (restored) return
    restored = true
    for (const item of hidden) item.obj.visible = item.visible
  }
}

/** JPEG 编码（可选裁剪到指定宽高比）*/
function jpegFromCanvas(
  canvas: HTMLCanvasElement,
  aspectRatio: number | null,
  quality: number,
): { dataUrl: string; width: number; height: number } {
  if (!aspectRatio) {
    return { dataUrl: canvas.toDataURL('image/jpeg', quality), width: canvas.width, height: canvas.height }
  }
  // 裁剪到目标宽高比
  const targetW = Math.min(canvas.width, Math.round(canvas.height * aspectRatio))
  const targetH = Math.min(canvas.height, Math.round(targetW / aspectRatio))
  const x = Math.max(0, Math.floor((canvas.width - targetW) / 2))
  const y = Math.max(0, Math.floor((canvas.height - targetH) / 2))

  const cropCanvas = document.createElement('canvas')
  cropCanvas.width = targetW
  cropCanvas.height = targetH
  cropCanvas.getContext('2d')?.drawImage(canvas, x, y, targetW, targetH, 0, 0, targetW, targetH)
  return { dataUrl: cropCanvas.toDataURL('image/jpeg', quality), width: targetW, height: targetH }
}

/**
 * scene.snapshot — 捕获场景实时画面为 JPEG。
 * @param camera 可选指定相机（否则用当前视口相机）
 * @param atTimes 可选时间轴毫秒值数组(1..8)，逐帧求值导出
 * @param evalTimeline 时间轴求值回调（切换到指定时间点）
 */
export function captureScene(
  renderer: THREE.WebGLRenderer,
  camera: THREE.PerspectiveCamera | null,
  scene: THREE.Scene,
  options?: {
    aspect?: number | string | null
    atTimes?: number[]
    evalTimeline?: (tMs: number) => void
    layout?: 'sheet' | 'separate'
  },
): { frames: CapturedFrame[] } {
  const frames: CapturedFrame[] = []
  const times = options?.atTimes ?? [0]
  const restoreHelpers = (() => {
    const hidden: { obj: THREE.Object3D; visible: boolean }[] = []
    scene.traverse(obj => {
      if (HIDE_MARKERS.some(m => (obj.userData as Record<string, unknown>)[m]) && obj.visible) {
        hidden.push({ obj, visible: true })
        obj.visible = false
      }
    })
    return () => { for (const h of hidden) h.obj.visible = true }
  })()

  try {
    for (const t of times) {
      options?.evalTimeline?.(t)
      renderer.render(scene, camera ?? new THREE.PerspectiveCamera())
      const encoded = jpegFromCanvas(renderer.domElement, null, 0.92)
      frames.push({ ...encoded, tMs: t })
    }
  } finally {
    restoreHelpers()
  }

  return { frames }
}


/**
 * 代码模型标准七视图离屏渲染。
 * 视图: front/back/left/right/top/three_quarter/three_quarter_back
 * 中性灰 studio 背景，隐藏 grid/gizmo/其他场景对象。
 */
export function captureModelViews(
  model: THREE.Object3D,
  views?: string[],
  sizePx?: number,
): { captures: { view: string; dataUrl: string }[] } {
  const size = sizePx ?? 768
  const requested = views && views.length > 0 ? views : ['front', 'three_quarter', 'left', 'top']

  const VIEW_ANGLES: Record<string, [number, number]> = {
    front: [0, Math.PI / 2],
    back: [Math.PI, Math.PI / 2],
    left: [-Math.PI / 2, Math.PI / 2],
    right: [Math.PI / 2, Math.PI / 2],
    top: [0.001, 0.001],
    three_quarter: [Math.PI / 4, Math.PI / 3],
    three_quarter_back: [-Math.PI / 4, Math.PI / 3],
  }

  // 计算包围球半径
  let maxR = 0.5
  model.traverse((child) => {
    if ('geometry' in child && child.geometry) {
      const geo = child.geometry as THREE.BufferGeometry
      geo.computeBoundingSphere()
      const worldPos = new THREE.Vector3()
      child.getWorldPosition(worldPos)
      maxR = Math.max(maxR, worldPos.length() + (geo.boundingSphere?.radius ?? 0))
    }
  })

  const offscreen = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
  offscreen.setSize(sizePx ?? 768, sizePx ?? 768)
  offscreen.setClearColor(0xd0d0d0)

  const scene = new THREE.Scene()
  scene.add(model.clone())
  scene.add(new THREE.AmbientLight(0xffffff, 0.6))
  const keyLight = new THREE.DirectionalLight(0xffffff, 0.8)
  keyLight.position.set(5, 8, 5)
  scene.add(keyLight)

  const cam = new THREE.PerspectiveCamera(35, 1, 0.1, maxR * 20)
  const captures: { view: string; dataUrl: string }[] = []

  try {
    for (const view of requested) {
      const angle = VIEW_ANGLES[view]
      if (!angle) continue
      const theta = angle[0], phi = angle[1]
      cam.position.set(
        maxR * 2.5 * Math.sin(phi) * Math.sin(theta),
        maxR * 2.5 * Math.cos(phi),
        maxR * 2.5 * Math.sin(phi) * Math.cos(theta),
      )
      cam.lookAt(0, 0, 0)
      cam.updateProjectionMatrix()
      offscreen.render(scene, cam)
      captures.push({ view, dataUrl: offscreen.domElement.toDataURL('image/jpeg', 0.9) })
    }
  } finally {
    offscreen.dispose()
  }

  return { captures }
}
