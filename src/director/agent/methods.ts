/**
 * Agent 方法桥 — 实现 manifest.json 定义的 scene/model/motion/campath 方法。
 *
 * 每个方法接收纯 JSON 参数（非 THREE 对象），操作场景引擎，返回可序列化结果。
 * 这是 iframe 内导演台暴露给宿主 agent 的唯一接口。
 */

// ── 场景状态（JSON 可序列化，无 THREE 依赖）──

export interface SceneCharacterData {
  id: string
  name: string
  bodyType: 'male' | 'female' | 'child'
  color: string
  position: { x: number; y: number; z: number }
  rotationYDeg: number
  pose: Record<string, number>
  visible: boolean
}

export interface ScenePropData {
  id: string
  catalogId: string
  position: { x: number; y: number; z: number }
  visible: boolean
}

export interface CodeModelData {
  id: string
  label: string
  code: string
  position: { x: number; y: number; z: number }
}

export interface SceneCameraData {
  id: string
  label: string
  position: { x: number; y: number; z: number }
  fov: number
}

export interface CameraPathSummary {
  id: string
  label: string
  durationMs: number
  easing: string
  loopMode: string
  pointsCount: number
  source: string | null
}

export interface SceneState {
  revision: number
  characters: SceneCharacterData[]
  props: ScenePropData[]
  codeModels: CodeModelData[]
  cameras: SceneCameraData[]
  camPaths: CameraPathSummary[]
  selectedIds: string[]
  environment: { background: string; panorama?: string; sky?: string; ground?: string }
}

// ── 操作类型 ──

export type SceneOperation =
  | { type: 'add_character'; bodyType: 'male'|'female'|'child'; color: string; position?: [number,number,number] }
  | { type: 'add_prop'; catalogId: string; position?: [number,number,number] }
  | { type: 'add_code_model'; code: string; label: string; position?: [number,number,number] }
  | { type: 'add_camera'; label: string; fov: number }
  | { type: 'set_position'; targetId: string; x: number; y: number; z: number }
  | { type: 'set_rotation_y'; targetId: string; degrees: number }
  | { type: 'set_color'; targetId: string; color: string }
  | { type: 'set_visible'; targetId: string; visible: boolean }
  | { type: 'remove_object'; targetId: string }
  | { type: 'set_environment'; key: string; value: string }

export interface EditBatch {
  description: string
  operations: SceneOperation[]
  validateOnly?: boolean
}

export interface EditResult {
  ok: boolean
  validateOnly: boolean
  applied: number
  failed: number
  results: { index: number; ok: boolean; error?: string }[]
  affectedIds: string[]
}

// ── 方法处理器接口 ──

/** 场景引擎依赖接口——由宿主注入具体实现 */
export interface DirectorEngineDeps {
  /** 获取完整场景状态（JSON 可序列化）*/
  getSceneState(): SceneState
  /** 应用一批编辑操作 */
  applyEditBatch(batch: EditBatch): EditResult
  /** 步进历史 undo/redo */
  stepHistory(action: 'undo' | 'redo', steps?: number): void
  /** 离屏渲染导出 JPEG dataUrl */
  renderSnapshot(cameraId?: string): { dataUrl: string; width: number; height: number }
  /** 机械诊断检查 */
  runDiagnostics(): { clean: boolean; issues: { code: string; severity: string; detail: string }[] }
  /** 生成代码模型 */
  generateCodeModel(code: string, label?: string): { ok: boolean; id?: string; error?: string }
  /** 捕获代码模型标准视图 */
  captureModelViews(id: string, views: string[]): { ok: boolean; captures?: { view: string; dataUrl: string }[]; error?: string }
  /** 对比渲染与参考图 */
  compareWithReference(renderDataUrl: string, referenceDataUrl: string): CompareResult
  /** 读取 Motion DSL 源码 */
  readMotionSource(id: string): { id: string; builtin: boolean; label: string; source: string }
  /** 读取 Campath DSL 源码 */
  readCampathSource(id: string): { id: string; durationMs: number; easing: string; source: string | null }
}

export interface CompareResult {
  ok: boolean
  silhouette_iou: number
  aspect_ratio: { render: number; reference: number; delta_ratio: number }
  color_similarity: number
  grid_diff_4x4_row_major: number[]
  worst_cell: { row: number; col: number; diff: number }
  composite_score: number
  verdict: string
}

type MethodHandler = (params: Record<string, unknown>) => Promise<unknown>

/**
 * 创建全部 manifest 方法的处理器映射。
 * 返回给 DirectorBridge.registerBatch() 注册。
 */
export function createManifestHandlers(deps: DirectorEngineDeps): Record<string, MethodHandler> {
  return {
    // ── scene 域 ──
    'scene.get': async () => deps.getSceneState(),

    'scene.diagnostics': async () => deps.runDiagnostics(),

    'scene.history': async (params) => {
      const action = typeof params === 'object' && params !== null && 'action' in params
        ? String(params.action)
        : ''
      if (action !== 'undo' && action !== 'redo') return { ok: false, error: `invalid action: ${action}` }
      deps.stepHistory(action)
      return { ok: true, action }
    },

    'scene.snapshot': async (params) => {
      const cameraId = typeof params === 'object' && params !== null && 'cameraId' in params
        ? String(params.cameraId) : undefined
      const snap = deps.renderSnapshot(cameraId)
      return { ok: true, path: snap.dataUrl, width: snap.width, height: snap.height }
    },

    // ── model 域 ──
    'model.generate': async (params) => {
      const p = params as { code?: string; label?: string }
      if (!p.code) return { ok: false, error: 'code is required' }
      return deps.generateCodeModel(p.code, p.label)
    },

    'model.capture': async (params) => {
      const p = params as { id?: string; views?: string[] }
      if (!p.id) return { ok: false, error: 'id is required' }
      return deps.captureModelViews(p.id, p.views ?? ['front', 'three_quarter', 'left', 'top'])
    },

    'model.compare': async (params) => {
      const p = params as { renderPath?: string; referencePath?: string }
      if (!p.renderPath || !p.referencePath) {
        return { ok: false, error: 'renderPath and referencePath are required' }
      }
      return deps.compareWithReference(p.renderPath, p.referencePath)
    },

    // ── motion 域 ──
    'motion.read': async (params) => {
      const p = params as { id?: string }
      if (!p.id) return { ok: false, error: 'id is required' }
      return deps.readMotionSource(p.id)
    },

    // ── campath 域 ──
    'campath.read': async (params) => {
      const p = params as { id?: string }
      if (!p.id) return { ok: false, error: 'id is required' }
      return deps.readCampathSource(p.id)
    },
  }
}
