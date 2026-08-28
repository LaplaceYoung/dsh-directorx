/* Live look: three-point lights, ACES, optional DoF, IBL, display LUT, focus plane. */
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { BokehPass } from "three/addons/postprocessing/BokehPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { LUTPass } from "three/addons/postprocessing/LUTPass.js";
import { LUTCubeLoader } from "three/addons/loaders/LUTCubeLoader.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { cubeForPreset, isLutPath } from "../src/optics/lut.ts";
import { peakWidthMeters } from "../src/optics/peaking.ts";
import { centroidXZ, parseKeySlot, studioLights, STUDIO_DEFAULTS, yawToward } from "../src/optics/studio.ts";
import { clampAzimuth, resolveHdriLook, spinLightPositions } from "../src/optics/stage-env.ts";

const EQUIRECT_REFLECTION = 303;

const lights = new Map();
const looks = new Map();
const state = {
  exposure: 1,
  toneMap: "aces",
  dof: false,
  focusM: 4,
  aperture: 0.00022,
  maxblur: 0.012,
  ambient: null,
  hemi: null,
  ibl: false,
  iblIntensity: 1,
  envTex: null,
  envOwned: false,
  lut: "none",
  lutIntensity: 1,
  focusPlane: false,
  peaking: false,
  peakWidth: null,
  kelvin: STUDIO_DEFAULTS.kelvin,
  brightness: STUDIO_DEFAULTS.brightness,
  key: STUDIO_DEFAULTS.key,
  rim: STUDIO_DEFAULTS.rim,
  hdri: null,
  azimuth: 0,
};

const waitEngine = () => new Promise((resolve) => {
  let done = false;
  const tick = () => {
    const engine = window.__directorEngine;
    if (done || !engine?.scene || !engine?.renderer) return false;
    done = true;
    resolve(engine);
    return true;
  };
  if (tick()) return;
  const id = setInterval(() => { if (tick()) clearInterval(id); }, 50);
  const raf = () => { if (!tick()) requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
});

function dimStockLights(scene, on) {
  scene.traverse((obj) => {
    if (!obj.isLight || obj.userData.dxLook) return;
    if (obj.userData.dxStockIntensity == null) obj.userData.dxStockIntensity = obj.intensity;
    if (obj.isAmbientLight) obj.intensity = on ? (state.ambient ?? obj.userData.dxStockIntensity * 0.08) : obj.userData.dxStockIntensity;
    else if (obj.isHemisphereLight) obj.intensity = on ? (state.hemi ?? obj.userData.dxStockIntensity * 0.1) : obj.userData.dxStockIntensity;
    else if (obj.isDirectionalLight) obj.intensity = on ? 0 : obj.userData.dxStockIntensity;
  });
}

let shadowedCount = -1;
function enableStageShadows(engine, force = false) {
  const n = (engine.chars?.size || 0) + (engine.props?.size || 0) + (engine.models?.size || 0);
  if (!force && n === shadowedCount) return;
  shadowedCount = n;
  const mark = (root) => {
    root?.traverse?.((obj) => {
      if (!obj.isMesh || obj.userData?._isHelper || obj.userData?.isLabel) return;
      const mat = Array.isArray(obj.material) ? obj.material[0] : obj.material;
      if (!mat || mat.isMeshBasicMaterial) return;
      obj.castShadow = true;
      obj.receiveShadow = true;
    });
  };
  for (const rec of engine.chars?.values?.() || []) mark(rec.group || rec.inner || rec.root);
  for (const rec of engine.props?.values?.() || []) mark(rec.group || rec.root);
  for (const rec of engine.models?.values?.() || []) mark(rec.group || rec.root);
  for (const rec of engine.codeModels?.values?.() || []) mark(rec.group || rec.root);
  if (engine.ground) engine.ground.receiveShadow = true;
}

function colorOf(value) {
  return new THREE.Color(value || "#ffffff");
}

function makeLight(spec) {
  let light;
  if (spec.kind === "spot") {
    light = new THREE.SpotLight(colorOf(spec.color), spec.intensity, 40, Math.PI / 5, 0.35, 1);
  } else if (spec.kind === "point") {
    light = new THREE.PointLight(colorOf(spec.color), spec.intensity, 18, 1.4);
  } else if (spec.kind === "rect") {
    light = new THREE.RectAreaLight(colorOf(spec.color), spec.intensity, spec.width || 1.6, spec.height || 0.8);
  } else {
    light = new THREE.DirectionalLight(colorOf(spec.color), spec.intensity);
  }
  light.userData.dxLook = true;
  light.userData.dxSpec = spec;
  light.name = spec.id;
  if ("castShadow" in light) {
    light.castShadow = !!spec.castShadow;
    if (light.castShadow && light.shadow) {
      light.shadow.mapSize.set(2048, 2048);
      light.shadow.bias = -0.0002;
      if (light.shadow.camera) {
        Object.assign(light.shadow.camera, { near: 0.5, far: 60, left: -18, right: 18, top: 18, bottom: -18 });
        light.shadow.camera.updateProjectionMatrix?.();
      }
    }
  }
  return light;
}

function placeLight(light, spec) {
  light.position.set(spec.position.x, spec.position.y, spec.position.z);
  light.color.copy(colorOf(spec.color));
  light.intensity = spec.intensity;
  if (light.target && spec.lookAt) {
    light.target.position.set(spec.lookAt.x, spec.lookAt.y, spec.lookAt.z);
    light.target.userData.dxLook = true;
    light.target.updateMatrixWorld?.(true);
    light.updateMatrixWorld?.(true);
  } else if (spec.lookAt && light.lookAt) {
    light.lookAt(spec.lookAt.x, spec.lookAt.y, spec.lookAt.z);
  }
}

function upsertLight(engine, spec) {
  const id = spec.id || `light-${spec.role || "practical"}`;
  const next = { ...spec, id };
  let rec = lights.get(id);
  if (!rec) {
    const light = makeLight(next);
    engine.scene.add(light);
    if (light.target) engine.scene.add(light.target);
    rec = { light, spec: next };
    lights.set(id, rec);
  } else {
    rec.spec = { ...rec.spec, ...next };
    rec.light.intensity = rec.spec.intensity;
    rec.light.color.copy(colorOf(rec.spec.color));
  }
  if (rec.light.parent !== engine.scene) engine.scene.add(rec.light);
  if (rec.light.target && rec.light.target.parent !== engine.scene) engine.scene.add(rec.light.target);
  placeLight(rec.light, rec.spec);
  dimStockLights(engine.scene, true);
  return rec.spec;
}

function applyTone(engine) {
  engine.renderer.outputColorSpace = THREE.SRGBColorSpace;
  engine.renderer.toneMapping = state.toneMap === "none" ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
  engine.renderer.toneMappingExposure = state.exposure;
}

function disposeOwnedEnv() {
  if (state.envOwned && state.envTex?.dispose) state.envTex.dispose();
  state.envTex = null;
  state.envOwned = false;
}

function studioCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, "#d7dee8");
  g.addColorStop(0.48, "#8b9199");
  g.addColorStop(1, "#3f3c38");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
}

function findSampleTexture(engine) {
  const direct = engine.panoramaMesh?.material?.map;
  if (direct) return direct;
  let found = null;
  engine.scene.traverse((obj) => {
    if (found) return;
    const mats = obj.material ? (Array.isArray(obj.material) ? obj.material : [obj.material]) : [];
    for (const mat of mats) {
      if (!mat) continue;
      found = mat.map || mat.envMap || mat.normalMap || mat.roughnessMap || mat.metalnessMap || null;
      if (found) return;
    }
  });
  return found;
}

function textureFromImage(engine, image) {
  const sample = findSampleTexture(engine);
  if (sample?.clone) {
    const tex = sample.clone();
    tex.image = image;
    tex.mapping = EQUIRECT_REFLECTION;
    tex.needsUpdate = true;
    return tex;
  }
  const tex = new THREE.CanvasTexture(image);
  tex.mapping = EQUIRECT_REFLECTION;
  tex.needsUpdate = true;
  if ("colorSpace" in tex) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function applyEnvIntensity(engine, intensity) {
  if ("environmentIntensity" in engine.scene) engine.scene.environmentIntensity = intensity;
  engine.scene.traverse((obj) => {
    const mats = obj.material ? (Array.isArray(obj.material) ? obj.material : [obj.material]) : [];
    for (const mat of mats) {
      if (mat && "envMapIntensity" in mat) mat.envMapIntensity = intensity;
    }
  });
}

function applyIbl(engine, on, intensity = 1) {
  if (!on) {
    engine.scene.environment = null;
    disposeOwnedEnv();
    state.ibl = false;
    applyEnvIntensity(engine, 1);
    return { ibl: false };
  }
  const map = engine.panoramaMesh?.material?.map;
  let env = null;
  let source = "studio";
  let owned = false;
  if (map && (map.image || map.source)) {
    map.mapping = EQUIRECT_REFLECTION;
    map.needsUpdate = true;
    env = map;
    source = "panorama";
  } else {
    env = textureFromImage(engine, studioCanvas());
    owned = !!env;
    source = env ? "studio" : "missing";
  }
  disposeOwnedEnv();
  engine.scene.environment = env;
  applyEnvIntensity(engine, intensity);
  state.envTex = env;
  state.envOwned = owned;
  state.ibl = !!env;
  state.iblIntensity = intensity;
  return { ibl: !!env, source, intensity };
}

let composer = null;
let bokehPass = null;
let lutPass = null;
let peakingPass = null;
let renderPass = null;
let hooked = false;
const lutCache = new Map();
const cubeLoader = new LUTCubeLoader();
let focusHelper = null;

const PeakingShader = {
  name: "PeakingShader",
  uniforms: {
    tDiffuse: { value: null },
    tDepth: { value: null },
    resolution: { value: new THREE.Vector2(1, 1) },
    cameraNear: { value: 0.1 },
    cameraFar: { value: 200 },
    focusM: { value: 4 },
    peakWidth: { value: 0.2 },
    peakColor: { value: new THREE.Color(1.0, 0.12, 0.12) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform sampler2D tDepth;
    uniform vec2 resolution;
    uniform float cameraNear;
    uniform float cameraFar;
    uniform float focusM;
    uniform float peakWidth;
    uniform vec3 peakColor;
    varying vec2 vUv;

    float perspectiveDepthToViewZ(const in float invClipZ, const in float near, const in float far) {
      return (near * far) / ((far - near) * invClipZ - far);
    }

    float luma(vec3 c) {
      return dot(c, vec3(0.2126, 0.7152, 0.0722));
    }

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      float depth = texture2D(tDepth, vUv).x;
      float viewZ = perspectiveDepthToViewZ(depth, cameraNear, cameraFar);
      float dist = -viewZ;
      float band = abs(dist - focusM) / max(peakWidth, 0.001);
      float inFocus = 1.0 - smoothstep(0.35, 1.0, band);

      vec2 texel = 1.0 / max(resolution, vec2(1.0));
      float n = luma(texture2D(tDiffuse, vUv + vec2(0.0, texel.y)).rgb);
      float s = luma(texture2D(tDiffuse, vUv - vec2(0.0, texel.y)).rgb);
      float e = luma(texture2D(tDiffuse, vUv + vec2(texel.x, 0.0)).rgb);
      float w = luma(texture2D(tDiffuse, vUv - vec2(texel.x, 0.0)).rgb);
      float edge = clamp(abs(n - s) + abs(e - w), 0.0, 1.0);
      float peak = inFocus * smoothstep(0.04, 0.22, edge);
      gl_FragColor = vec4(mix(color.rgb, peakColor, peak), color.a);
    }
  `,
};

function lutActive() {
  return state.lut && state.lut !== "none" && state.lutIntensity > 0;
}

function needsComposer() {
  return state.dof || lutActive() || state.peaking;
}

function attachDepth(rt) {
  if (rt.depthTexture) return;
  const depth = new THREE.DepthTexture();
  depth.format = THREE.DepthFormat;
  depth.type = THREE.UnsignedIntType;
  rt.depthTexture = depth;
}

function texture3DFromCube(text) {
  const parsed = cubeLoader.parse(text);
  return parsed.texture3D;
}

async function lutTexture(name) {
  if (lutCache.has(name)) return lutCache.get(name);
  const preset = cubeForPreset(name);
  if (preset) {
    const tex = texture3DFromCube(preset);
    lutCache.set(name, tex);
    return tex;
  }
  if (!isLutPath(name)) return null;
  const res = await fetch(name);
  if (!res.ok) throw new Error(`cube LUT not found: ${name}`);
  const text = await res.text();
  const tex = texture3DFromCube(text);
  lutCache.set(name, tex);
  return tex;
}

async function applyLutPass() {
  if (!lutPass) return { lut: state.lut, intensity: state.lutIntensity };
  if (!lutActive()) {
    lutPass.enabled = false;
    lutPass.lut = null;
    return { lut: "none", intensity: state.lutIntensity };
  }
  const tex = await lutTexture(state.lut);
  lutPass.lut = tex;
  lutPass.intensity = state.lutIntensity;
  lutPass.enabled = !!tex;
  return { lut: state.lut, intensity: state.lutIntensity, ok: !!tex, custom: isLutPath(state.lut) };
}

function syncPeaking(engine) {
  if (!peakingPass) return { peaking: false };
  peakingPass.enabled = state.peaking === true;
  if (!state.peaking) return { peaking: false };
  const width = state.peakWidth != null ? state.peakWidth : peakWidthMeters(state.aperture, state.focusM);
  const uniforms = peakingPass.uniforms;
  uniforms.focusM.value = state.focusM;
  uniforms.peakWidth.value = width;
  uniforms.cameraNear.value = engine.camera.near || 0.1;
  uniforms.cameraFar.value = engine.camera.far || 200;
  if (composer?.renderTarget1?.depthTexture) uniforms.tDepth.value = composer.renderTarget1.depthTexture;
  return { peaking: true, peakWidth: width, focusM: state.focusM };
}

function ensureComposer(engine) {
  if (!composer) {
    composer = new EffectComposer(engine.renderer);
    attachDepth(composer.renderTarget1);
    attachDepth(composer.renderTarget2);
    renderPass = new RenderPass(engine.scene, engine.camera);
    bokehPass = new BokehPass(engine.scene, engine.camera, {
      focus: state.focusM,
      aperture: state.aperture,
      maxblur: state.maxblur,
    });
    lutPass = new LUTPass({ intensity: 1 });
    peakingPass = new ShaderPass(PeakingShader);
    peakingPass.enabled = false;
    composer.addPass(renderPass);
    composer.addPass(bokehPass);
    composer.addPass(lutPass);
    composer.addPass(peakingPass);
    composer.addPass(new OutputPass());
  }
  bokehPass.enabled = state.dof === true;
  if (state.dof) {
    bokehPass.uniforms.focus.value = state.focusM;
    bokehPass.uniforms.aperture.value = state.aperture;
    bokehPass.uniforms.maxblur.value = state.maxblur;
  }
  renderPass.camera = engine.camera;
  if (!hooked) {
    hooked = true;
    let composing = false;
    const orig = engine.renderer.render.bind(engine.renderer);
    engine.renderer.render = (scene, camera) => {
      if (composing || !needsComposer() || scene !== engine.scene) return orig(scene, camera);
      renderPass.camera = camera;
      const size = engine.renderer.getSize(new THREE.Vector2());
      composer.setSize(size.x, size.y);
      if (peakingPass?.enabled) {
        peakingPass.uniforms.resolution.value.set(size.x, size.y);
        peakingPass.uniforms.tDepth.value = composer.renderTarget1.depthTexture;
        peakingPass.uniforms.cameraNear.value = camera.near || engine.camera.near || 0.1;
        peakingPass.uniforms.cameraFar.value = camera.far || engine.camera.far || 200;
      }
      composing = true;
      try {
        composer.render();
      } finally {
        composing = false;
      }
    };
  }
}

function syncFocusPlane(engine) {
  if (!state.focusPlane) {
    if (focusHelper) {
      engine.scene.remove(focusHelper);
      focusHelper.geometry?.dispose?.();
      focusHelper.material?.dispose?.();
      focusHelper = null;
    }
    return { focusPlane: false };
  }
  if (!focusHelper) {
    const geom = new THREE.PlaneGeometry(10, 10);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x7cff6b,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    focusHelper = new THREE.Mesh(geom, mat);
    focusHelper.userData._isHelper = true;
    focusHelper.userData.dxLook = true;
    focusHelper.name = "dx-focus-plane";
    engine.scene.add(focusHelper);
  }
  const cam = engine.camera;
  cam.updateMatrixWorld?.();
  const dir = new THREE.Vector3();
  cam.getWorldDirection(dir);
  focusHelper.position.copy(cam.position).addScaledVector(dir, state.focusM);
  focusHelper.quaternion.copy(cam.quaternion);
  return { focusPlane: true, focusM: state.focusM };
}

function findHeadBone(root) {
  let found = null;
  root.traverse((obj) => {
    if (found) return;
    const n = String(obj.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (n === "head" || n === "defspine006" || n.endsWith("head")) found = obj;
  });
  return found;
}

function applyHeadLook(engine, characterId, target) {
  const rec = engine.chars?.get(characterId);
  const root = rec?.inner || rec?.group;
  if (!root || !target) return { ok: false, error: "character or target missing" };
  const bone = findHeadBone(root);
  if (!bone) return { ok: false, error: "head bone not found" };
  const world = new THREE.Vector3();
  bone.getWorldPosition(world);
  const dest = new THREE.Vector3(target.x, target.y, target.z);
  const parent = bone.parent;
  const qWorld = new THREE.Quaternion();
  const m = new THREE.Matrix4();
  m.lookAt(world, dest, new THREE.Vector3(0, 1, 0));
  qWorld.setFromRotationMatrix(m);
  if (parent) {
    const pq = new THREE.Quaternion();
    parent.getWorldQuaternion(pq);
    bone.quaternion.copy(pq.invert().multiply(qWorld));
  } else bone.quaternion.copy(qWorld);
  const euler = new THREE.Euler().setFromQuaternion(bone.quaternion, "YXZ");
  euler.y = THREE.MathUtils.clamp(euler.y, -80 * Math.PI / 180, 80 * Math.PI / 180);
  euler.x = THREE.MathUtils.clamp(euler.x, -35 * Math.PI / 180, 35 * Math.PI / 180);
  euler.z = THREE.MathUtils.clamp(euler.z, -20 * Math.PI / 180, 20 * Math.PI / 180);
  bone.quaternion.setFromEuler(euler);
  looks.set(characterId, { target: { ...target } });
  return { ok: true, id: characterId };
}

function subjectOf(engine, id) {
  const rec = engine.chars?.get(id) || engine.props?.get(id);
  const group = rec?.group || rec?.root;
  if (!group) return null;
  return {
    id,
    position: { x: group.position.x, y: group.position.y, z: group.position.z },
    rotationY: group.rotation.y * 180 / Math.PI,
  };
}

function gatherPoints(engine) {
  const pts = [];
  for (const rec of engine.chars?.values?.() || []) {
    const p = (rec.group || rec.root)?.position;
    if (p) pts.push({ x: p.x, z: p.z });
  }
  for (const rec of engine.props?.values?.() || []) {
    const p = (rec.group || rec.root)?.position;
    if (p) pts.push({ x: p.x, z: p.z });
  }
  return pts;
}

function framedSubject(engine, id) {
  const selected = id ? subjectOf(engine, id) : null;
  const origin = selected
    ? { x: selected.position.x, z: selected.position.z }
    : centroidXZ(gatherPoints(engine));
  const cam = engine.camera?.position;
  const rotationY = cam ? yawToward(origin, { x: cam.x, z: cam.z }) : (selected?.rotationY || 0);
  return {
    id: selected?.id,
    position: { x: origin.x, y: selected?.position.y || 0, z: origin.z },
    rotationY,
  };
}

function threePoint(subject, preset = "three_point") {
  const yaw = (subject.rotationY * Math.PI) / 180;
  const forward = { x: Math.sin(yaw), z: Math.cos(yaw) };
  const right = { x: Math.cos(yaw), z: -Math.sin(yaw) };
  const o = subject.position;
  const lookAt = { x: o.x, y: 1.2, z: o.z };
  const put = (r, f, y) => ({
    x: o.x + right.x * r + forward.x * f,
    y: o.y + y,
    z: o.z + right.z * r + forward.z * f,
  });
  const high = preset === "high_key";
  const low = preset === "low_key";
  return [
    { id: "light-key", role: "key", kind: "directional", color: low ? "#ffe0c2" : "#fff5e6", intensity: high ? 2.4 : low ? 2.8 : 2.1, position: put(-3.4, 2.2, 4.6), lookAt, castShadow: true },
    { id: "light-fill", role: "fill", kind: "directional", color: low ? "#9bb4d0" : "#e8f0ff", intensity: high ? 1.35 : low ? 0.28 : 0.7, position: put(3.8, 1.2, 2.4), lookAt, castShadow: false },
    { id: "light-back", role: "back", kind: "directional", color: "#b9d4ff", intensity: high ? 0.9 : low ? 1.6 : 1.2, position: put(0.4, -3.6, 4.8), lookAt, castShadow: false },
  ];
}

function rigAmbient(preset) {
  if (preset === "high_key") return { ambient: 0.55, hemi: 0.45, exposure: 1.15 };
  if (preset === "low_key") return { ambient: 0.12, hemi: 0.18, exposure: 0.82 };
  return { ambient: 0.28, hemi: 0.32, exposure: 1 };
}

async function apply(payload = {}) {
  const engine = await waitEngine();
  const report = { lights: [], look: null, rig: null };
  applyTone(engine);

  if (payload.rig) {
    const id = payload.rig.targetId || engine.selectedId || [...(engine.chars?.keys?.() || [])][0];
    const subject = subjectOf(engine, id) || { position: { x: 0, y: 0, z: 0 }, rotationY: 0 };
    const preset = payload.rig.preset || "three_point";
    const amb = rigAmbient(preset);
    state.ambient = amb.ambient;
    state.hemi = amb.hemi;
    if (payload.exposure == null) state.exposure = amb.exposure;
    for (const spec of threePoint(subject, preset)) report.lights.push(upsertLight(engine, spec));
    report.rig = { preset, targetId: id, ...amb };
    dimStockLights(engine.scene, true);
  }

  for (const spec of payload.lights || []) report.lights.push(upsertLight(engine, spec));
  for (const id of payload.remove || []) {
    const rec = lights.get(id);
    if (rec) {
      engine.scene.remove(rec.light);
      if (rec.light.target) engine.scene.remove(rec.light.target);
      lights.delete(id);
    }
  }

  if (payload.exposure != null) state.exposure = Number(payload.exposure);
  if (payload.toneMap) state.toneMap = payload.toneMap;
  if (payload.ambient != null) state.ambient = Number(payload.ambient);
  if (payload.hemi != null) state.hemi = Number(payload.hemi);
  if (payload.dof != null) state.dof = payload.dof === true;
  if (payload.focusM != null) state.focusM = Number(payload.focusM);
  if (payload.aperture != null) state.aperture = Number(payload.aperture);
  if (payload.ibl != null || payload.iblIntensity != null) {
    try {
      report.ibl = applyIbl(engine, payload.ibl !== false, payload.iblIntensity ?? state.iblIntensity);
    } catch (error) {
      report.ibl = { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
  if (typeof payload.lut === "string") state.lut = payload.lut;
  if (payload.lutIntensity != null) state.lutIntensity = Math.max(0, Math.min(1, Number(payload.lutIntensity)));
  if (payload.focusPlane != null) state.focusPlane = payload.focusPlane === true;
  if (payload.peaking != null) state.peaking = payload.peaking === true;
  if (payload.peakWidth != null) state.peakWidth = Number(payload.peakWidth);
  if (payload.hdri === null) state.hdri = null;
  if (typeof payload.hdri === "string" && payload.hdri) {
    const look = resolveHdriLook(payload.hdri);
    state.hdri = look.id;
    if (payload.kelvin == null) state.kelvin = look.kelvin;
    if (payload.brightness == null) state.brightness = look.brightness;
    if (!payload.key) state.key = look.key;
    if (payload.rim == null) state.rim = look.rim;
    if (payload.azimuth == null) state.azimuth = look.azimuth;
  }
  if (payload.kelvin != null) state.kelvin = Number(payload.kelvin);
  if (payload.brightness != null) state.brightness = Number(payload.brightness);
  if (payload.key) state.key = parseKeySlot(payload.key) || state.key;
  if (payload.rim != null) state.rim = Number(payload.rim);
  if (payload.azimuth != null) state.azimuth = clampAzimuth(Number(payload.azimuth));
  const studioTouched = payload.kelvin != null || payload.brightness != null || payload.key || payload.rim != null || payload.hdri != null || payload.azimuth != null;
  if (studioTouched) {
    const id = payload.rig?.targetId || engine.selectedId;
    const subject = framedSubject(engine, id);
    const origin = { x: subject.position.x, z: subject.position.z };
    const studio = studioLights(subject, { kelvin: state.kelvin, brightness: state.brightness, key: state.key, rim: state.rim });
    const packedLights = spinLightPositions(studio.lights, origin, state.azimuth);
    if (payload.exposure == null) state.exposure = studio.exposure;
    enableStageShadows(engine, true);
    for (const spec of packedLights) report.lights.push(upsertLight(engine, spec));
    report.studio = { kelvin: state.kelvin, brightness: state.brightness, key: state.key, rim: state.rim, exposure: state.exposure, hdri: state.hdri, azimuth: state.azimuth, yaw: subject.rotationY };
    dimStockLights(engine.scene, true);
  }
  applyTone(engine);
  if (state.ambient != null || state.hemi != null) dimStockLights(engine.scene, lights.size > 0 || state.ambient != null);
  try {
    if (needsComposer()) ensureComposer(engine);
    else {
      if (lutPass) lutPass.enabled = false;
      if (peakingPass) peakingPass.enabled = false;
    }
    report.lut = await applyLutPass();
    report.peaking = syncPeaking(engine);
  } catch (error) {
    report.lut = report.lut || { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
  try {
    report.focusPlane = syncFocusPlane(engine);
  } catch (error) {
    report.focusPlane = { ok: false, error: error instanceof Error ? error.message : String(error) };
  }

  if (payload.lookAt) {
    const characterId = payload.lookAt.id;
    let target = payload.lookAt.point;
    if (!target && payload.lookAt.targetId) {
      const other = subjectOf(engine, payload.lookAt.targetId);
      if (other) target = { x: other.position.x, y: other.position.y + 1.45, z: other.position.z };
    }
    report.look = applyHeadLook(engine, characterId, target);
  }

  if (!engine.__dxLookHooked) {
    engine.__dxLookHooked = true;
    engine.renderCbs?.add(() => {
      for (const [id, item] of looks) applyHeadLook(engine, id, item.target);
      if (state.focusPlane) syncFocusPlane(engine);
      if (lights.size) enableStageShadows(engine);
    });
  }

  return {
    ok: true,
    ...report,
    exposure: state.exposure,
    toneMap: state.toneMap,
    dof: state.dof,
    focusM: state.focusM,
    ibl: state.ibl,
    iblIntensity: state.iblIntensity,
    lut: state.lut,
    lutIntensity: state.lutIntensity,
    focusPlane: state.focusPlane,
    peaking: state.peaking,
    lutReport: report.lut,
    peakingReport: report.peaking,
    hdri: state.hdri,
    azimuth: state.azimuth,
    lights: [...lights.values()].map((item) => item.spec),
  };
}

window.__dxLook = {
  apply,
  state: () => ({
    exposure: state.exposure,
    toneMap: state.toneMap,
    dof: state.dof,
    focusM: state.focusM,
    aperture: state.aperture,
    maxblur: state.maxblur,
    ambient: state.ambient,
    hemi: state.hemi,
    ibl: state.ibl,
    iblIntensity: state.iblIntensity,
    lut: state.lut,
    lutIntensity: state.lutIntensity,
    focusPlane: state.focusPlane,
    peaking: state.peaking,
    peakWidth: state.peakWidth,
    kelvin: state.kelvin,
    brightness: state.brightness,
    hdri: state.hdri,
    azimuth: state.azimuth,
    key: state.key,
    rim: state.rim,
    lights: [...lights.values()].map((item) => item.spec),
  }),
};

let boundScene = null;
let binding = false;
const studioPayload = () => ({
  kelvin: state.kelvin,
  brightness: state.brightness,
  key: state.key,
  rim: state.rim,
  azimuth: state.azimuth,
  hdri: state.hdri,
});

function bindEngine(engine) {
  if (!engine?.scene || binding) return;
  if (engine.scene === boundScene) {
    for (const rec of lights.values()) {
      if (rec.light.parent === engine.scene) return;
    }
  }
  boundScene = engine.scene;
  binding = true;
  apply(studioPayload()).finally(() => { binding = false; });
}

waitEngine().then(bindEngine);
setInterval(() => bindEngine(window.__directorEngine), 250);
