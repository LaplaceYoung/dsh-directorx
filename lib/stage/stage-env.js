import {
  parseSite,
  resolveHdriLook,
  resolveStageEnv,
  roomWalls
} from "./chunks/chunk-2VFCRDGK.js";
import {
  BoxGeometry,
  DoubleSide,
  Mesh,
  MeshStandardMaterial
} from "./chunks/chunk-NPXDOJG6.js";

// stage-env.js
var state = { site: "blank" };
var engineOf = () => window.__dxStage?.engine || window.__directorEngine;
var syncRoom = () => {
  const engine = engineOf();
  const scene = engine?.scene;
  if (!scene) return;
  const stale = [];
  scene.traverse((obj) => {
    if (obj.userData?.dxRoom) stale.push(obj);
  });
  stale.forEach((obj) => {
    scene.remove(obj);
    obj.geometry?.dispose?.();
    obj.material?.dispose?.();
  });
  if (state.site !== "room") return;
  const mat = new MeshStandardMaterial({ color: 2764083, roughness: 0.9, metalness: 0.02, side: DoubleSide });
  const height = Number(engine?.ground?.position?.y) || 0;
  for (const wall of roomWalls(20)) {
    const mesh = new Mesh(new BoxGeometry(wall.size.x, wall.size.y, wall.size.z), mat.clone());
    mesh.position.set(wall.position.x, wall.position.y + height, wall.position.z);
    mesh.userData.dxRoom = true;
    mesh.name = wall.id;
    scene.add(mesh);
  }
};
window.__dxEnv = {
  run: async (args = {}) => {
    const env = resolveStageEnv(args);
    state.site = parseSite(args.site);
    const ops = [];
    if (args.groundHeight != null) ops.push({ type: "set_environment", groundHeight: env.groundHeight });
    if (args.grid != null) ops.push({ type: "set_environment", showGround: env.grid });
    if (args.background === "panorama") ops.push({ type: "set_environment", backgroundMode: "panorama" });
    if (args.background === "none" || args.background === "match_lights") ops.push({ type: "set_environment", backgroundMode: "flat" });
    let edit = null;
    if (ops.length && typeof window.__dxDispatchAgent === "function") {
      edit = await window.__dxDispatchAgent("scene.edit", { description: "environment", operations: ops });
    }
    if (args.hdri || args.azimuth != null) {
      const look = resolveHdriLook(args.hdri);
      window.__dxLook?.apply?.({
        hdri: look.id,
        azimuth: args.azimuth != null ? Number(args.azimuth) : look.azimuth,
        kelvin: look.kelvin,
        brightness: look.brightness,
        key: look.key,
        rim: look.rim
      });
    }
    const engine = engineOf();
    if (args.view === "top" && engine?.applyAxisView) engine.applyAxisView("top");
    if (args.view === "3d" && engine?.resetView) engine.resetView();
    syncRoom();
    return {
      ok: true,
      ...env,
      site: state.site,
      groundY: env.groundHeight,
      look: args.hdri ? resolveHdriLook(args.hdri).id : void 0,
      edit
    };
  }
};
//# sourceMappingURL=stage-env.js.map
