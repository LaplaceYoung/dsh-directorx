/* Multicam: cut list, 1–9 keys, 2×2 JPEG monitors. */
import { addCut, cutAtTime, resolveCamera } from "../src/optics/cuts.ts";

const state = {
  armed: false,
  activeId: null,
  cuts: [],
  thumbs: [],
  follow: false,
  t0: 0,
  pauseT: 0,
};

const hud = document.createElement("div");
hud.id = "dx-multicam-hud";
Object.assign(hud.style, {
  position: "fixed",
  zIndex: "47",
  display: "none",
  pointerEvents: "none",
  font: "11px/1.3 ui-sans-serif, system-ui, sans-serif",
  color: "#fff",
});
hud.innerHTML = `
  <div data-role="grid"></div>
  <div data-role="meta"></div>
`;
const grid = hud.querySelector('[data-role="grid"]');
const meta = hud.querySelector('[data-role="meta"]');
Object.assign(grid.style, {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "4px",
  width: "280px",
  pointerEvents: "auto",
});
Object.assign(meta.style, {
  marginTop: "6px",
  padding: "3px 6px",
  borderRadius: "4px",
  background: "rgba(0,0,0,.55)",
  pointerEvents: "none",
});

function cameras() {
  const present = window.__dxStage?.store?.present;
  return Array.isArray(present?.cameras) ? present.cameras : [];
}

function engine() {
  return window.__dxStage?.engine || window.__directorEngine;
}

function place() {
  const canvas = document.querySelector("canvas");
  if (!canvas) return;
  const r = canvas.getBoundingClientRect();
  Object.assign(hud.style, {
    left: `${r.right - 296}px`,
    top: `${r.top + 12}px`,
    width: "280px",
  });
}

function paint() {
  const cams = cameras();
  hud.style.display = state.armed && cams.length ? "block" : "none";
  place();
  grid.innerHTML = "";
  const shown = cams.slice(0, 4);
  shown.forEach((cam, i) => {
    const cell = document.createElement("button");
    cell.type = "button";
    const thumb = state.thumbs.find((item) => item.id === cam.id);
    Object.assign(cell.style, {
      height: "78px",
      padding: "0",
      border: cam.id === state.activeId ? "2px solid #fbbf24" : "1px solid rgba(255,255,255,.3)",
      borderRadius: "4px",
      background: thumb?.src ? `center / cover url("${thumb.src}")` : "#111",
      color: "#fff",
      cursor: "pointer",
      position: "relative",
    });
    cell.title = `${i + 1} ${cam.label || cam.id.slice(0, 8)}`;
    cell.innerHTML = `<span style="position:absolute;left:4px;bottom:3px;background:rgba(0,0,0,.55);padding:1px 5px;border-radius:3px">${i + 1} ${cam.label || cam.id.slice(0, 6)}</span>`;
    cell.addEventListener("click", () => cutTo(cam.id, { immediate: true }).catch(() => {}));
    grid.appendChild(cell);
  });
  const beat = cutAtTime(state.cuts, nowMs());
  const bits = [`${cams.length} cams`];
  if (state.activeId) bits.push(`live ${state.activeId.slice(0, 8)}`);
  if (state.cuts.length) bits.push(`${state.cuts.length} cuts`);
  if (state.follow) bits.push("play");
  if (beat) bits.push(`@${beat.tMs}ms`);
  meta.textContent = bits.join(" · ");
}

function nowMs() {
  if (!state.follow) return state.pauseT;
  return Math.max(0, performance.now() - state.t0);
}

function findCam(token) {
  return resolveCamera(cameras(), token);
}

async function cutTo(token, opts = {}) {
  const cam = findCam(token);
  if (!cam) throw new Error("camera not found");
  const eng = engine();
  if (!eng?.enterCameraView) throw new Error("enterCameraView missing");
  eng.enterCameraView(cam, { immediate: opts.blendMs == null || Number(opts.blendMs) <= 0 });
  state.armed = true;
  state.activeId = cam.id;
  paint();
  return { ok: true, id: cam.id, label: cam.label, fov: cam.fov };
}

async function preview(ids) {
  const eng = engine();
  if (!eng?.captureCamera) throw new Error("captureCamera missing");
  const cams = cameras();
  const pick = (ids || []).map((id) => findCam(id)).filter(Boolean);
  const shown = (pick.length ? pick : cams).slice(0, 4);
  const cells = [];
  for (const cam of shown) {
    const dataUrl = eng.captureCamera(cam);
    cells.push({ id: cam.id, label: cam.label, src: dataUrl });
  }
  state.thumbs = cells;
  state.armed = true;
  paint();
  if (!cells.length) return { ok: true, cameras: [], sheet: null };
  const canvas = document.createElement("canvas");
  const w = 640;
  const h = 360;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, w, h);
  const cw = w / 2;
  const ch = h / 2;
  await Promise.all(cells.map((cell, i) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      ctx.drawImage(img, col * cw, row * ch, cw, ch);
      ctx.fillStyle = "rgba(0,0,0,.55)";
      ctx.fillRect(col * cw, row * ch + ch - 22, cw, 22);
      ctx.fillStyle = "#fff";
      ctx.font = "12px sans-serif";
      ctx.fillText(`${i + 1} ${cell.label || cell.id.slice(0, 8)}`, col * cw + 8, row * ch + ch - 7);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = cell.src;
  })));
  const blob = await (await fetch(canvas.toDataURL("image/jpeg", 0.88))).blob();
  const form = new FormData();
  form.append("file", blob, `multicam-${Date.now()}.jpg`);
  const uploaded = await fetch("/api/upload", { method: "POST", body: form }).then((r) => r.json());
  return {
    ok: true,
    path: uploaded.path,
    cameras: shown.map((cam, i) => ({ index: i + 1, id: cam.id, label: cam.label })),
    cells: shown.length,
  };
}

function mark(token, tMs) {
  const cam = findCam(token ?? state.activeId);
  if (!cam) throw new Error("camera not found");
  const t = tMs != null ? Number(tMs) : nowMs();
  state.cuts = addCut(state.cuts, t, cam.id, cam.label);
  return { ok: true, cuts: state.cuts, tMs: t, id: cam.id };
}

function tickFollow() {
  if (!state.follow) return;
  const beat = cutAtTime(state.cuts, nowMs());
  if (beat && beat.cameraId !== state.activeId) {
    cutTo(beat.cameraId, { immediate: true }).catch(() => {});
  }
  requestAnimationFrame(tickFollow);
}

async function run(args = {}) {
  const action = args.action || "list";
  const cams = cameras().map((cam, i) => ({
    index: i + 1,
    id: cam.id,
    label: cam.label,
    fov: cam.fov,
    position: cam.position,
  }));
  if (action === "list") {
    state.armed = true;
    paint();
    return { ok: true, cameras: cams, activeId: state.activeId, cuts: state.cuts };
  }
  if (action === "arm") {
    state.armed = args.enabled !== false;
    paint();
    return { ok: true, armed: state.armed, cameras: cams };
  }
  if (action === "director") {
    engine()?.setViewMode?.("director");
    state.activeId = null;
    paint();
    return { ok: true, view: "director" };
  }
  if (action === "cut") {
    const result = await cutTo(args.id ?? args.index, { immediate: args.blendMs == null, blendMs: args.blendMs });
    if (args.mark) mark(result.id, args.tMs);
    return result;
  }
  if (action === "preview") return preview(args.ids);
  if (action === "mark") return mark(args.id ?? args.index, args.tMs);
  if (action === "clear") {
    state.cuts = [];
    paint();
    return { ok: true, cuts: [] };
  }
  if (action === "play") {
    if (!state.cuts.length) throw new Error("no cuts to play");
    state.follow = true;
    state.t0 = performance.now() - (Number(args.fromMs) || 0);
    tickFollow();
    paint();
    return { ok: true, follow: true, cuts: state.cuts };
  }
  if (action === "pause") {
    state.pauseT = nowMs();
    state.follow = false;
    paint();
    return { ok: true, follow: false, tMs: state.pauseT };
  }
  throw new Error(`unknown multicam action: ${action}`);
}

window.addEventListener("keydown", (event) => {
  if (!state.armed || event.metaKey || event.ctrlKey || event.altKey) return;
  const tag = event.target && event.target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || event.target?.isContentEditable) return;
  if (event.code === "Digit0" || event.code === "Numpad0") {
    event.preventDefault();
    run({ action: "director" }).catch(() => {});
    return;
  }
  const digit = event.code.startsWith("Digit") ? Number(event.code.slice(5)) : event.code.startsWith("Numpad") ? Number(event.code.slice(6)) : NaN;
  if (digit >= 1 && digit <= 9) {
    event.preventDefault();
    run({ action: "cut", index: digit, mark: state.follow }).catch(() => {});
  }
});

window.addEventListener("resize", place);
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => document.body.appendChild(hud));
else document.body.appendChild(hud);

window.__dxMulticam = { run, state: () => ({ ...state, cuts: [...state.cuts] }) };
