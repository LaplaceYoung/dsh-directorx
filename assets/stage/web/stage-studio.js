/* Kelvin / key / rim + named looks — mounts into the original environment inspector. */
import { HDRI_LOOKS, resolveHdriLook } from "../src/optics/stage-env.ts";
import { KEY_SLOTS, STUDIO_DEFAULTS, kelvinToRgb } from "../src/optics/studio.ts";

const KEY_LABEL = { left: "左", top: "上", right: "右", front: "前", bottom: "下" };
const state = {
  kelvin: STUDIO_DEFAULTS.kelvin,
  brightness: STUDIO_DEFAULTS.brightness,
  key: STUDIO_DEFAULTS.key,
  rim: STUDIO_DEFAULTS.rim,
  hdri: null,
  azimuth: 0,
};

const pullLive = () => {
  const live = window.__dxLook?.state?.();
  if (!live) return;
  if (live.kelvin != null) state.kelvin = live.kelvin;
  if (live.brightness != null) state.brightness = live.brightness;
  if (live.key) state.key = live.key;
  if (live.rim != null) state.rim = live.rim;
  state.hdri = live.hdri || null;
  if (live.azimuth != null) state.azimuth = live.azimuth;
};

const apply = (patch = {}) => {
  Object.assign(state, patch);
  window.__dxLook?.apply?.({
    kelvin: state.kelvin,
    brightness: state.brightness,
    key: state.key,
    rim: state.rim,
    azimuth: state.azimuth,
    hdri: state.hdri,
  });
};

const row = (label, control) => `
  <div class="mb-3">
    <div class="mb-1.5 text-[11px] text-muted-foreground">${label}</div>
    ${control}
  </div>`;

const fill = (host) => {
  if (host.querySelector("#dx-studio")) return;
  pullLive();
  const panel = document.createElement("div");
  panel.id = "dx-studio";
  panel.innerHTML = `
    <div class="mb-3 flex items-center justify-between">
      <div class="text-[15px] font-medium text-foreground">灯光</div>
      <button type="button" data-reset class="rounded-md border border-border bg-muted px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-foreground/50 hover:text-foreground">复位</button>
    </div>
    <div class="mb-3 flex flex-wrap gap-1.5">${HDRI_LOOKS.map((look) => (
      `<button type="button" data-hdri="${look.id}" class="whitespace-nowrap rounded-md border border-border bg-muted px-2 py-1.5 text-[11px] text-muted-foreground transition-colors hover:border-foreground/50 hover:text-foreground">${look.label}</button>`
    )).join("")}</div>
    ${row("亮度", `<div class="flex items-center gap-3"><input name="brightness" type="range" class="flex-1" min="0" max="100" value="${state.brightness}" /><span data-b class="w-[58px] shrink-0 rounded-[10px] border border-border bg-muted px-2 py-1.5 text-center text-[12px] tabular-nums text-foreground">${state.brightness}%</span></div>`)}
    ${row("色温", `<div class="flex items-center gap-3"><input name="kelvin" type="range" class="flex-1" min="2000" max="10000" step="50" value="${state.kelvin}" /><span data-swatch class="h-7 w-7 shrink-0 rounded-[10px] border border-border"></span><span data-k class="w-[58px] shrink-0 rounded-[10px] border border-border bg-muted px-2 py-1.5 text-center text-[12px] tabular-nums text-foreground">${state.kelvin}</span></div>`)}
    ${row("主光", `<div class="flex rounded-lg border border-border bg-muted p-0.5">${KEY_SLOTS.map((slot) => (
      `<button type="button" data-key="${slot}" class="flex-1 py-1 text-[12px] rounded-md transition-colors text-muted-foreground hover:text-foreground">${KEY_LABEL[slot]}</button>`
    )).join("")}</div>`)}
    ${row("轮廓光", `<div class="flex items-center gap-3"><input name="rim" type="range" class="flex-1" min="0" max="10" step="0.5" value="${state.rim}" /><span data-r class="w-[58px] shrink-0 rounded-[10px] border border-border bg-muted px-2 py-1.5 text-center text-[12px] tabular-nums text-foreground">${state.rim}</span></div>`)}
    ${row("方向", `<div class="flex items-center gap-3"><input name="azimuth" type="range" class="flex-1" min="-180" max="180" step="1" value="${state.azimuth}" /><span data-az class="w-[58px] shrink-0 rounded-[10px] border border-border bg-muted px-2 py-1.5 text-center text-[12px] tabular-nums text-foreground">${state.azimuth}°</span></div>`)}
  `;
  panel.querySelector("input[name=brightness]").oninput = (e) => {
    apply({ brightness: Number(e.target.value), hdri: null });
    render();
  };
  panel.querySelector("input[name=kelvin]").oninput = (e) => {
    apply({ kelvin: Number(e.target.value), hdri: null });
    render();
  };
  panel.querySelector("input[name=rim]").oninput = (e) => {
    apply({ rim: Number(e.target.value), hdri: null });
    render();
  };
  panel.querySelector("input[name=azimuth]").oninput = (e) => {
    apply({ azimuth: Number(e.target.value) });
    render();
  };
  panel.querySelectorAll("[data-key]").forEach((btn) => {
    btn.onclick = () => {
      apply({ key: btn.dataset.key, hdri: null });
      render();
    };
  });
  panel.querySelectorAll("[data-hdri]").forEach((btn) => {
    btn.onclick = () => {
      const look = resolveHdriLook(btn.dataset.hdri);
      apply({
        hdri: look.id,
        kelvin: look.kelvin,
        brightness: look.brightness,
        key: look.key,
        rim: look.rim,
        azimuth: look.azimuth,
      });
      render();
    };
  });
  panel.querySelector("[data-reset]").onclick = () => {
    apply({
      hdri: null,
      kelvin: STUDIO_DEFAULTS.kelvin,
      brightness: STUDIO_DEFAULTS.brightness,
      key: STUDIO_DEFAULTS.key,
      rim: STUDIO_DEFAULTS.rim,
      azimuth: 0,
    });
    render();
  };
  host.appendChild(panel);
  render();
  apply({ ...state });
};

const render = () => {
  const panel = document.getElementById("dx-studio");
  if (!panel) return;
  panel.querySelector("[data-b]").textContent = `${state.brightness}%`;
  panel.querySelector("[data-k]").textContent = `${state.kelvin}`;
  panel.querySelector("[data-r]").textContent = String(state.rim);
  panel.querySelector("[data-az]").textContent = `${state.azimuth}°`;
  panel.querySelector("input[name=brightness]").value = String(state.brightness);
  panel.querySelector("input[name=kelvin]").value = String(state.kelvin);
  panel.querySelector("input[name=rim]").value = String(state.rim);
  panel.querySelector("input[name=azimuth]").value = String(state.azimuth);
  const swatch = panel.querySelector("[data-swatch]");
  if (swatch) swatch.style.background = kelvinToRgb(state.kelvin).hex;
  panel.querySelectorAll("[data-key]").forEach((btn) => {
    const on = btn.dataset.key === state.key;
    btn.className = `flex-1 py-1 text-[12px] rounded-md transition-colors ${on ? "bg-foreground text-background font-medium" : "text-muted-foreground hover:text-foreground"}`;
  });
  panel.querySelectorAll("[data-hdri]").forEach((btn) => {
    const on = btn.dataset.hdri === state.hdri;
    btn.className = `whitespace-nowrap rounded-md border px-2 py-1.5 text-[11px] transition-colors ${on ? "border-foreground bg-foreground/10 text-foreground font-medium" : "border-border bg-muted text-muted-foreground hover:border-foreground/50 hover:text-foreground"}`;
  });
};

const attach = () => {
  const slot = document.getElementById("dx-look-slot");
  if (slot) fill(slot);
};

window.__dxStudio = {
  apply: (patch) => { apply(patch || {}); render(); },
  state: () => ({ ...state }),
  open: attach,
  close: () => {},
  toggle: () => false,
};

const watch = () => {
  attach();
  const root = document.getElementById("root") || document.body;
  new MutationObserver(attach).observe(root, { childList: true, subtree: true });
};
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", watch);
else watch();
