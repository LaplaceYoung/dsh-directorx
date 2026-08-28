import {
  X
} from "./chunk-6UJONW5U.js";
import {
  Ee,
  qe
} from "./chunk-43AXUQHO.js";

// spzLoader-CU_GD7s0.js
var h = 1347635022;
var P = 0.28209479177387814;
var u = /* @__PURE__ */ new Map();
async function S(t) {
  const n = new Blob([t]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(n).arrayBuffer();
}
function A(t) {
  const n = new DataView(t);
  if (n.getUint32(0, true) !== h) throw new Error("Invalid SPZ file: bad magic");
  const s = n.getUint32(4, true);
  if (s < 1 || s > 3) throw new Error(`Unsupported SPZ version: ${s}`);
  const e = n.getUint32(8, true), w = n.getUint8(13), o = new Uint8Array(t);
  let r = 16;
  const c = new Float32Array(e * 3), f = 1 / (1 << w);
  for (let i = 0; i < e * 3; i++) {
    let a = o[r] | o[r + 1] << 8 | o[r + 2] << 16;
    a & 8388608 && (a -= 16777216), c[i] = a * f, r += 3;
  }
  r += e;
  const g = new Float32Array(e * 3);
  for (let i = 0; i < e * 3; i++) {
    const a = (o[r + i] / 255 - 0.5) / 0.15;
    g[i] = Math.max(0, Math.min(1, 0.5 + P * a));
  }
  const m = new qe();
  return m.setAttribute("position", new Ee(c, 3)), m.setAttribute("color", new Ee(g, 3)), m;
}
async function B(t, n = 0.05, l, s = "dark") {
  let e = u.get(t);
  e || (e = (async () => {
    const o = await fetch(t);
    if (!o.ok) throw new Error(`Failed to fetch SPZ: ${o.status}`);
    const r = await o.arrayBuffer(), c = await S(r), f = A(c);
    return console.log(`[SPZ] Loaded ${t}:`, { vertices: f.getAttribute("position").count }), f;
  })().catch((o) => {
    throw u.delete(t), o;
  }), u.set(t, e));
  const w = await e;
  return X(w.clone(), t, n, l, s);
}
export {
  B as loadSPZPointCloud
};
//# sourceMappingURL=spzLoader-CU_GD7s0-YLULYXX7.js.map
