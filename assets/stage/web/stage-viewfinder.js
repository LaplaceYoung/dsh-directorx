/* Viewfinder API — letterbox/thirds live in original Px; aspect lives in __dxAspect; FOV writes the selected camera. */
import { FILMBACKS, focalFromVerticalFov } from "../src/optics/lens.ts";
import { clampFocal, nudgeFocal, resolveViewfinder, viewfinderSnapshotArgs, VIEWFINDER_DEFAULTS } from "../src/optics/viewfinder.ts";

const filmback = FILMBACKS["16:9"];
const state = {
  aspect: VIEWFINDER_DEFAULTS.aspect,
  focalMm: VIEWFINDER_DEFAULTS.focalMm,
  thirds: true,
};

const engineOf = () => window.__dxStage?.engine || window.__directorEngine;
const storeOf = () => window.__dxStage?.store;

const pickerAspect = () => {
  const id = window.__dxAspect?.get?.();
  return id && id !== "Auto" ? id : null;
};

const liveFocalMm = () => {
  const fov = engineOf()?.camera?.fov;
  if (Number.isFinite(fov)) return clampFocal(focalFromVerticalFov(fov, filmback));
  return state.focalMm;
};

const writeFov = (fov) => {
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

const applyFocal = () => {
  const resolved = resolveViewfinder({ ...state, open: true, focalMm: state.focalMm });
  writeFov(resolved.fov);
  if (state.aspect && window.__dxAspect?.set) window.__dxAspect.set(state.aspect);
  return resolved;
};

const shoot = async () => {
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
  },
};
