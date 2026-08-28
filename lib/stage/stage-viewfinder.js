// ../../../src/director/optics/lens.ts
var FILMBACKS = {
  "35mm": { id: "35mm", widthMm: 36, heightMm: 24 },
  super35: { id: "super35", widthMm: 24.89, heightMm: 18.66 },
  "16mm": { id: "16mm", widthMm: 10.26, heightMm: 7.49 },
  "16:9": { id: "16:9", widthMm: 36, heightMm: 36 * 9 / 16 }
};
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
function verticalFovFromLens(focalLengthMm, filmback2 = FILMBACKS["35mm"]) {
  const f = Math.max(4, focalLengthMm);
  const fov = 2 * Math.atan(filmback2.heightMm / (2 * f)) * 180 / Math.PI;
  return Math.round(clamp(fov, 10, 120) * 100) / 100;
}
function focalFromVerticalFov(fovDeg, filmback2 = FILMBACKS["35mm"]) {
  const half = Math.max(1, fovDeg) * Math.PI / 360;
  const f = filmback2.heightMm / (2 * Math.tan(half));
  return Math.round(clamp(f, 8, 300) * 10) / 10;
}

// ../../../src/director/optics/aspects.ts
var VIEWFINDER_ASPECTS = [
  { id: "16:9", label: "16:9", width: 16, height: 9 },
  { id: "9:16", label: "9:16", width: 9, height: 16 },
  { id: "4:3", label: "4:3", width: 4, height: 3 },
  { id: "3:4", label: "3:4", width: 3, height: 4 },
  { id: "1:1", label: "1:1", width: 1, height: 1 },
  { id: "3:2", label: "3:2", width: 3, height: 2 },
  { id: "2:3", label: "2:3", width: 2, height: 3 },
  { id: "4:5", label: "4:5", width: 4, height: 5 },
  { id: "9:19.5", label: "9:19.5", width: 9, height: 19.5 },
  { id: "9:21", label: "9:21", width: 9, height: 21 },
  { id: "1.33:1", label: "1.33:1", width: 1.33, height: 1 },
  { id: "1.37:1", label: "1.37:1", width: 1.37, height: 1 },
  { id: "1.43:1", label: "1.43:1", width: 1.43, height: 1 },
  { id: "1.66:1", label: "1.66:1", width: 1.66, height: 1 },
  { id: "1.85:1", label: "1.85:1", width: 1.85, height: 1 },
  { id: "2.00:1", label: "2.00:1", width: 2, height: 1 },
  { id: "2.20:1", label: "2.20:1", width: 2.2, height: 1 },
  { id: "2.35:1", label: "2.35:1", width: 2.35, height: 1 },
  { id: "2.39:1", label: "2.39:1", width: 2.39, height: 1 }
];
function parseAspect(id) {
  if (!id) return null;
  const key = id.trim();
  return VIEWFINDER_ASPECTS.find((item) => item.id === key) ?? null;
}

// ../../../src/director/optics/viewfinder.ts
var VIEWFINDER_FOCAL_MIN = 12;
var VIEWFINDER_FOCAL_MAX = 200;
var VIEWFINDER_DEFAULTS = {
  open: false,
  aspect: "16:9",
  focalMm: 24,
  thirds: true
};
function clampFocal(mm) {
  if (!Number.isFinite(mm)) return VIEWFINDER_DEFAULTS.focalMm;
  return Math.min(VIEWFINDER_FOCAL_MAX, Math.max(VIEWFINDER_FOCAL_MIN, Math.round(mm)));
}
function nudgeFocal(mm, dir, stepMm = 1) {
  return clampFocal(mm + dir * stepMm);
}
function resolveViewfinder(partial = {}) {
  const aspectId = partial.aspect ?? VIEWFINDER_DEFAULTS.aspect;
  const gate = parseAspect(aspectId) ?? VIEWFINDER_ASPECTS[0];
  const focalMm = clampFocal(partial.focalMm ?? VIEWFINDER_DEFAULTS.focalMm);
  return {
    open: partial.open === true,
    aspect: gate.id,
    focalMm,
    thirds: partial.thirds !== false,
    gate,
    fov: verticalFovFromLens(focalMm, FILMBACKS["16:9"])
  };
}
function viewfinderSnapshotArgs(partial = {}) {
  const resolved = resolveViewfinder(partial);
  return {
    aspect: resolved.aspect,
    overlay: resolved.thirds ? ["thirds"] : []
  };
}

// stage-viewfinder.js
var filmback = FILMBACKS["16:9"];
var state = {
  aspect: VIEWFINDER_DEFAULTS.aspect,
  focalMm: VIEWFINDER_DEFAULTS.focalMm,
  thirds: true
};
var engineOf = () => window.__dxStage?.engine || window.__directorEngine;
var storeOf = () => window.__dxStage?.store;
var pickerAspect = () => {
  const id = window.__dxAspect?.get?.();
  return id && id !== "Auto" ? id : null;
};
var liveFocalMm = () => {
  const fov = engineOf()?.camera?.fov;
  if (Number.isFinite(fov)) return clampFocal(focalFromVerticalFov(fov, filmback));
  return state.focalMm;
};
var writeFov = (fov) => {
  const engine = engineOf();
  const store = storeOf();
  const id = engine?.selectedId;
  const selected = store?.present?.cameras?.find((cam) => cam.id === id);
  if (selected && store.updateCamera) store.updateCamera(id, { fov }, true);
  if (engine?.camera && Number.isFinite(fov)) {
    engine.camera.fov = fov;
    engine.camera.updateProjectionMatrix?.();
  }
};
var applyFocal = () => {
  const resolved = resolveViewfinder({ ...state, open: true, focalMm: state.focalMm });
  writeFov(resolved.fov);
  if (state.aspect && window.__dxAspect?.set) window.__dxAspect.set(state.aspect);
  return resolved;
};
var shoot = async () => {
  if (typeof window.__dxDispatchAgent !== "function") throw new Error("live dispatcher not ready");
  const aspect = pickerAspect() || state.aspect;
  return window.__dxDispatchAgent("scene.snapshot", viewfinderSnapshotArgs({ ...state, aspect }));
};
window.__dxViewfinder = {
  open: () => applyFocal(),
  close: () => ({ ok: true, open: false, ...resolveViewfinder({ ...state, aspect: pickerAspect() || state.aspect, focalMm: liveFocalMm() }) }),
  toggle: () => applyFocal(),
  nudge: (dir) => {
    state.focalMm = nudgeFocal(liveFocalMm(), dir);
    return applyFocal();
  },
  run: async (args = {}) => {
    const action = args.action || "status";
    if (args.aspect) state.aspect = args.aspect;
    if (args.focalMm != null) state.focalMm = clampFocal(Number(args.focalMm));
    if (args.thirds != null) state.thirds = args.thirds === true;
    if (action === "open" || action === "set") return { ok: true, ...applyFocal() };
    if (action === "close") return { ok: true, open: false, ...resolveViewfinder({ ...state, aspect: pickerAspect() || state.aspect, focalMm: liveFocalMm() }) };
    if (action === "shoot") {
      const resolved = applyFocal();
      const snapshot = await shoot();
      return { ok: true, ...resolved, snapshot, snapshotArgs: viewfinderSnapshotArgs({ ...state, aspect: pickerAspect() || state.aspect }) };
    }
    if (action === "status") {
      const aspect = pickerAspect() || state.aspect;
      return { ok: true, ...resolveViewfinder({ ...state, aspect, focalMm: liveFocalMm(), open: true }) };
    }
    throw new Error(`unknown viewfinder action: ${action}`);
  }
};
//# sourceMappingURL=stage-viewfinder.js.map
