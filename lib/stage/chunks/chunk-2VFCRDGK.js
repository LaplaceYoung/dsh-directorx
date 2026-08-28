// ../../../src/director/optics/studio.ts
var KEY_SLOTS = ["left", "top", "right", "front", "bottom"];
var STUDIO_DEFAULTS = {
  kelvin: 5600,
  brightness: 50,
  key: "front",
  rim: 10
};
function clampKelvin(value) {
  if (!Number.isFinite(value)) return STUDIO_DEFAULTS.kelvin;
  return Math.min(1e4, Math.max(2e3, Math.round(value)));
}
function clampBrightness(value) {
  if (!Number.isFinite(value)) return STUDIO_DEFAULTS.brightness;
  return Math.min(100, Math.max(0, Math.round(value)));
}
function clampRim(value) {
  if (!Number.isFinite(value)) return STUDIO_DEFAULTS.rim;
  return Math.min(10, Math.max(0, Math.round(value * 10) / 10));
}
function parseKeySlot(token) {
  if (!token) return null;
  const key = token.trim().toLowerCase();
  return KEY_SLOTS.includes(key) ? key : null;
}
function kelvinToRgb(kelvin) {
  const temp = clampKelvin(kelvin) / 100;
  let r;
  let g;
  let b;
  if (temp <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(temp) - 161.1195681661;
  } else {
    r = 329.698727446 * Math.pow(temp - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(temp - 60, -0.0755148492);
  }
  if (temp >= 66) b = 255;
  else if (temp <= 19) b = 0;
  else b = 138.5177312231 * Math.log(temp - 10) - 305.0447927307;
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  r = clamp(r);
  g = clamp(g);
  b = clamp(b);
  const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  return { r, g, b, hex };
}
function exposureFromBrightness(brightness) {
  return Math.round(clampBrightness(brightness) / 50 * 1e3) / 1e3;
}
function pack(x, y, z) {
  return { x: Math.round(x * 1e3) / 1e3, y: Math.round(y * 1e3) / 1e3, z: Math.round(z * 1e3) / 1e3 };
}
function facing(rotationY) {
  const rad = rotationY * Math.PI / 180;
  return {
    forward: { x: Math.sin(rad), z: Math.cos(rad) },
    right: { x: Math.cos(rad), z: -Math.sin(rad) }
  };
}
function put(origin, axes, right, forward, y) {
  return pack(origin.x + axes.right.x * right + axes.forward.x * forward, y, origin.z + axes.right.z * right + axes.forward.z * forward);
}
var SLOT = {
  left: { r: -3.4, f: 2.2, y: 4.2 },
  right: { r: 3.4, f: 2.2, y: 4.2 },
  front: { r: 0, f: 4.2, y: 3.4 },
  top: { r: 0.2, f: 1.2, y: 7.2 },
  bottom: { r: 0.4, f: 2.8, y: 0.45 }
};
var FILL_SLOT = {
  left: { r: 3.1, f: 1.8, y: 2.1 },
  right: { r: -3.1, f: 1.8, y: 2.1 },
  front: { r: -2.6, f: 2.2, y: 2 },
  top: { r: 2.4, f: 2, y: 1.8 },
  bottom: { r: 2.2, f: 2.4, y: 4.4 }
};
function yawToward(from, to) {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  if (dx * dx + dz * dz < 1e-8) return 0;
  return Math.round(Math.atan2(dx, dz) * 180 / Math.PI * 10) / 10;
}
function centroidXZ(points) {
  if (!points.length) return { x: 0, z: 0 };
  const x = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const z = points.reduce((sum, p) => sum + p.z, 0) / points.length;
  return pack(x, 0, z);
}
function studioLights(subject, settings = {}) {
  const kelvin = clampKelvin(settings.kelvin ?? STUDIO_DEFAULTS.kelvin);
  const brightness = clampBrightness(settings.brightness ?? STUDIO_DEFAULTS.brightness);
  const key = parseKeySlot(settings.key) ?? STUDIO_DEFAULTS.key;
  const rim = clampRim(settings.rim ?? STUDIO_DEFAULTS.rim);
  const keyRgb = kelvinToRgb(kelvin);
  const fillRgb = kelvinToRgb(kelvin + 900);
  const scale = brightness / 50;
  const axes = facing(subject.rotationY);
  const origin = { x: subject.position.x, z: subject.position.z };
  const lookAt = pack(origin.x, 1.2, origin.z);
  const slot = SLOT[key];
  const fill = FILL_SLOT[key];
  const backR = slot.r === 0 ? 0.8 : -Math.sign(slot.r) * 0.8;
  return {
    kelvin,
    brightness,
    key,
    rim,
    exposure: exposureFromBrightness(brightness),
    lights: [
      {
        id: "light-key",
        role: "key",
        kind: "directional",
        color: keyRgb.hex,
        intensity: Math.round(2.4 * scale * 1e3) / 1e3,
        position: put(origin, axes, slot.r, slot.f, slot.y),
        lookAt,
        castShadow: true
      },
      {
        id: "light-fill",
        role: "fill",
        kind: "directional",
        color: fillRgb.hex,
        intensity: Math.round(0.55 * scale * 1e3) / 1e3,
        position: put(origin, axes, fill.r, fill.f, fill.y),
        lookAt,
        castShadow: false
      },
      {
        id: "light-back",
        role: "back",
        kind: "directional",
        color: kelvinToRgb(Math.min(1e4, kelvin + 1600)).hex,
        intensity: Math.round(rim / 10 * 1.4 * scale * 1e3) / 1e3,
        position: put(origin, axes, backR, -3.8, 4.6),
        lookAt,
        castShadow: false
      }
    ]
  };
}

// ../../../src/director/optics/stage-env.ts
var HDRI_LOOKS = [
  { id: "soft_studio", label: "\u67D4\u5149\u5F71\u68DA", kelvin: 5600, brightness: 72, key: "front", rim: 6, azimuth: 0 },
  { id: "bright_interior", label: "\u660E\u4EAE\u5BA4\u5185", kelvin: 4800, brightness: 88, key: "top", rim: 4, azimuth: 15 },
  { id: "sunny_exterior", label: "\u6674\u5929\u6237\u5916", kelvin: 6500, brightness: 95, key: "right", rim: 8, azimuth: 35 },
  { id: "soft_street", label: "\u67D4\u548C\u8857\u666F", kelvin: 5200, brightness: 58, key: "left", rim: 3, azimuth: -20 },
  { id: "golden_hour", label: "\u91D1\u8272\u65F6\u523B", kelvin: 3200, brightness: 64, key: "right", rim: 7, azimuth: 50 },
  { id: "night_street", label: "\u591C\u95F4\u8857\u9053", kelvin: 3800, brightness: 28, key: "left", rim: 9, azimuth: -40 }
];
function resolveHdriLook(id) {
  const key = String(id || "").trim();
  return HDRI_LOOKS.find((item) => item.id === key || item.label === key) ?? HDRI_LOOKS[0];
}
function clampAzimuth(deg) {
  if (!Number.isFinite(deg)) return 0;
  let n = Math.round(deg) % 360;
  if (n > 180) n -= 360;
  if (n <= -180) n += 360;
  return n;
}
function clampGroundHeight(m) {
  if (!Number.isFinite(m)) return 0;
  return Math.max(-8, Math.min(8, Math.round(m * 10) / 10));
}
function clampGroundSize(m) {
  if (!Number.isFinite(m)) return 20;
  return Math.max(4, Math.min(80, Math.round(m)));
}
function parseSite(token) {
  const t = String(token || "").trim().toLowerCase();
  if (t === "room" || t === "\u623F\u95F4") return "room";
  return "blank";
}
function parseBackground(token) {
  const t = String(token || "").trim().toLowerCase();
  if (t === "match_lights" || t === "\u4E0E\u5149\u7167\u4E00\u81F4") return "match_lights";
  if (t === "panorama" || t === "\u5168\u666F\u56FE") return "panorama";
  return "none";
}
function parseViewMode(token) {
  const t = String(token || "").trim().toLowerCase();
  if (t === "top" || t === "\u4FEF\u89C6") return "top";
  return "3d";
}
function yawPoint(x, z, originX, originZ, deg) {
  const rad = deg * Math.PI / 180;
  const dx = x - originX;
  const dz = z - originZ;
  return {
    x: originX + dx * Math.cos(rad) + dz * Math.sin(rad),
    z: originZ - dx * Math.sin(rad) + dz * Math.cos(rad)
  };
}
function spinLightPositions(lights, origin, azimuthDeg) {
  const azimuth = clampAzimuth(azimuthDeg);
  if (!azimuth) return lights;
  return lights.map((item) => {
    const spun = yawPoint(item.position.x, item.position.z, origin.x, origin.z, azimuth);
    return { ...item, position: { ...item.position, x: spun.x, z: spun.z } };
  });
}
function roomWalls(size, height = 3.2, thickness = 0.12) {
  const edge = clampGroundSize(size);
  const half = edge / 2;
  const y = height / 2;
  const t = thickness;
  return [
    { id: "dx-wall-n", position: { x: 0, y, z: -half }, size: { x: edge, y: height, z: t } },
    { id: "dx-wall-s", position: { x: 0, y, z: half }, size: { x: edge, y: height, z: t } },
    { id: "dx-wall-w", position: { x: -half, y, z: 0 }, size: { x: t, y: height, z: edge } },
    { id: "dx-wall-e", position: { x: half, y, z: 0 }, size: { x: t, y: height, z: edge } }
  ];
}
var STAGE_ENV_DEFAULTS = {
  site: "blank",
  groundHeight: 0,
  groundSize: 20,
  grid: true,
  hdri: "soft_studio",
  azimuth: 0,
  background: "none",
  view: "3d"
};
function resolveStageEnv(partial = {}) {
  return {
    site: parseSite(partial.site),
    groundHeight: clampGroundHeight(partial.groundHeight ?? STAGE_ENV_DEFAULTS.groundHeight),
    groundSize: clampGroundSize(partial.groundSize ?? STAGE_ENV_DEFAULTS.groundSize),
    grid: partial.grid !== false,
    hdri: resolveHdriLook(partial.hdri).id,
    azimuth: clampAzimuth(partial.azimuth ?? STAGE_ENV_DEFAULTS.azimuth),
    background: parseBackground(partial.background),
    view: parseViewMode(partial.view)
  };
}

export {
  KEY_SLOTS,
  STUDIO_DEFAULTS,
  parseKeySlot,
  kelvinToRgb,
  yawToward,
  centroidXZ,
  studioLights,
  HDRI_LOOKS,
  resolveHdriLook,
  clampAzimuth,
  parseSite,
  spinLightPositions,
  roomWalls,
  resolveStageEnv
};
//# sourceMappingURL=chunk-2VFCRDGK.js.map
