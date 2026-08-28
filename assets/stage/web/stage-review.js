/* Named takes (Unreal-style copies) and 2D onion/wipe overlays. */
(() => {
  const state = {
    onion: false,
    mode: "overlay",
    opacity: 0.32,
    wipe: 0.5,
    before: null,
    after: null,
    activeId: null,
    takes: [],
  };

  const hud = document.createElement("div");
  hud.id = "dx-review-hud";
  Object.assign(hud.style, {
    position: "fixed",
    inset: "0",
    pointerEvents: "none",
    zIndex: "46",
    display: "none",
  });
  hud.innerHTML = `
    <img data-role="before" alt="" />
    <img data-role="after" alt="" />
    <div data-role="wipe"></div>
    <div data-role="label"></div>
    <div data-role="strip"></div>
  `;
  const beforeImg = hud.querySelector('[data-role="before"]');
  const afterImg = hud.querySelector('[data-role="after"]');
  const wipeBar = hud.querySelector('[data-role="wipe"]');
  const labelEl = hud.querySelector('[data-role="label"]');
  const stripEl = hud.querySelector('[data-role="strip"]');

  const imgCss = {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    objectFit: "contain",
    pointerEvents: "none",
  };
  Object.assign(beforeImg.style, imgCss);
  Object.assign(afterImg.style, imgCss);
  Object.assign(wipeBar.style, {
    position: "absolute",
    top: "0",
    bottom: "0",
    width: "3px",
    marginLeft: "-1px",
    background: "rgba(250,250,250,.85)",
    pointerEvents: "auto",
    cursor: "ew-resize",
    display: "none",
  });
  Object.assign(labelEl.style, {
    position: "absolute",
    top: "10px",
    left: "12px",
    padding: "3px 8px",
    borderRadius: "4px",
    background: "rgba(0,0,0,.55)",
    color: "#fff",
    font: "11px/1.4 ui-sans-serif, system-ui, sans-serif",
    pointerEvents: "none",
  });
  Object.assign(stripEl.style, {
    position: "absolute",
    left: "12px",
    right: "12px",
    bottom: "10px",
    display: "flex",
    gap: "6px",
    pointerEvents: "auto",
    overflowX: "auto",
  });

  const place = () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    Object.assign(hud.style, {
      left: `${r.left}px`,
      top: `${r.top}px`,
      width: `${r.width}px`,
      height: `${r.height}px`,
      right: "auto",
      bottom: "auto",
    });
  };

  const paint = () => {
    const show = state.onion && (state.before || state.after);
    hud.style.display = show || state.takes.length ? "block" : "none";
    place();
    beforeImg.style.display = state.before && state.onion ? "block" : "none";
    afterImg.style.display = state.after && state.onion ? "block" : "none";
    if (state.before) beforeImg.src = state.before;
    if (state.after) afterImg.src = state.after;
    const op = Math.max(0.04, Math.min(1, Number(state.opacity) || 0.32));
    if (state.mode === "wipe") {
      const cut = Math.max(0, Math.min(1, Number(state.wipe) || 0.5));
      beforeImg.style.opacity = "1";
      afterImg.style.opacity = "1";
      beforeImg.style.filter = "none";
      afterImg.style.filter = "none";
      beforeImg.style.clipPath = `inset(0 ${((1 - cut) * 100).toFixed(2)}% 0 0)`;
      afterImg.style.clipPath = `inset(0 0 0 ${(cut * 100).toFixed(2)}%)`;
      wipeBar.style.display = "block";
      wipeBar.style.left = `${cut * 100}%`;
    } else {
      beforeImg.style.clipPath = "none";
      afterImg.style.clipPath = "none";
      wipeBar.style.display = "none";
      beforeImg.style.opacity = String(op);
      afterImg.style.opacity = String(op * 0.85);
      beforeImg.style.filter = "sepia(1) hue-rotate(75deg) saturate(5)";
      afterImg.style.filter = "sepia(1) hue-rotate(230deg) saturate(5)";
    }
    const bits = [];
    if (state.onion) bits.push(state.mode === "wipe" ? "A/B wipe" : "onion");
    if (state.activeId) bits.push(`take ${state.activeId.slice(0, 18)}`);
    labelEl.textContent = bits.join(" · ");
    labelEl.style.display = bits.length ? "block" : "none";
  };

  const renderStrip = () => {
    stripEl.innerHTML = "";
    for (const take of state.takes.slice(-8)) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.title = take.label || take.id;
      Object.assign(btn.style, {
        width: "72px",
        height: "42px",
        padding: "0",
        border: take.id === state.activeId ? "2px solid #fbbf24" : "1px solid rgba(255,255,255,.35)",
        borderRadius: "4px",
        background: take.jpeg ? `center / cover url("${take.jpeg}")` : "#111",
        cursor: "pointer",
        flex: "0 0 auto",
      });
      btn.addEventListener("click", () => {
        window.__dxReview.take({ action: "restore", id: take.id }).catch(() => {});
      });
      stripEl.appendChild(btn);
    }
  };

  const serializeLook = () => {
    const look = window.__dxLook?.state?.();
    if (!look) return null;
    const { envRT: _rt, ...rest } = look;
    return rest;
  };

  const capture = async () => {
    const store = window.__dxStage?.store;
    if (!store?.present) throw new Error("live store not ready");
    const composition = JSON.parse(JSON.stringify(store.present));
    let jpeg = null;
    if (typeof window.__dxAgentInvoke === "function") {
      const shot = await window.__dxAgentInvoke({ method: "scene.snapshot", args: {} });
      jpeg = shot?.path || null;
    }
    return {
      composition,
      look: serializeLook(),
      handheld: window.__dxOptics?.get?.() || null,
      jpeg,
    };
  };

  const applyTake = async (record) => {
    const store = window.__dxStage?.store;
    const engine = window.__dxStage?.engine || window.__directorEngine;
    if (!store?.applyComposition) throw new Error("applyComposition missing");
    store.applyComposition(record.composition);
    engine?.sync?.(record.composition);
    if (record.look && window.__dxLook?.apply) {
      await window.__dxLook.apply({
        lights: record.look.lights || [],
        exposure: record.look.exposure,
        toneMap: record.look.toneMap,
        ambient: record.look.ambient,
        hemi: record.look.hemi,
        dof: record.look.dof,
        focusM: record.look.focusM,
        aperture: record.look.aperture,
        ibl: record.look.ibl,
        iblIntensity: record.look.iblIntensity,
      });
    }
    if (record.handheld && record.handheld.amp != null && window.__dxOptics?.setHandheld) {
      window.__dxOptics.setHandheld(record.handheld.amp, record.handheld.hz);
    }
    state.activeId = record.id;
    paint();
    renderStrip();
    return { ok: true, id: record.id, label: record.label };
  };

  const refreshList = async () => {
    const data = await fetch("/api/takes").then((r) => r.json());
    state.takes = data.takes || [];
    renderStrip();
    paint();
    return state.takes;
  };

  const take = async (args = {}) => {
    const action = args.action || "list";
    if (action === "capture") return { ok: true, ...(await capture()) };
    if (action === "list") return { ok: true, takes: await refreshList() };
    if (action === "record") {
      const payload = await capture();
      const saved = await fetch("/api/takes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: args.label || "take",
          ...payload,
        }),
      }).then((r) => r.json());
      if (!saved.ok) throw new Error(saved.error || "take record failed");
      state.activeId = saved.id;
      await refreshList();
      return saved;
    }
    if (action === "restore") {
      if (!args.id) throw new Error("restore needs id");
      const record = await fetch(`/api/takes/${encodeURIComponent(args.id)}`).then((r) => r.json());
      if (!record.ok && !record.composition) throw new Error(record.error || "take missing");
      return applyTake(record.take || record);
    }
    if (action === "delete") {
      if (!args.id) throw new Error("delete needs id");
      const res = await fetch(`/api/takes/${encodeURIComponent(args.id)}`, { method: "DELETE" }).then((r) => r.json());
      if (state.activeId === args.id) state.activeId = null;
      await refreshList();
      return res;
    }
    if (action === "compare") {
      const a = args.a;
      const b = args.b;
      if (!a || !b) throw new Error("compare needs a and b take ids");
      const left = await fetch(`/api/takes/${encodeURIComponent(a)}`).then((r) => r.json());
      const right = await fetch(`/api/takes/${encodeURIComponent(b)}`).then((r) => r.json());
      const leftTake = left.take || left;
      const rightTake = right.take || right;
      return onion({
        enabled: true,
        mode: args.mode || "wipe",
        opacity: args.opacity ?? 1,
        wipe: args.wipe ?? 0.5,
        before: leftTake.jpeg,
        after: rightTake.jpeg,
      });
    }
    throw new Error(`unknown take action: ${action}`);
  };

  const onion = (args = {}) => {
    if (args.enabled === false) {
      state.onion = false;
      paint();
      return { ok: true, onion: false };
    }
    state.onion = args.enabled !== false;
    if (args.mode === "wipe" || args.mode === "overlay") state.mode = args.mode;
    if (args.opacity != null) state.opacity = Number(args.opacity);
    if (args.wipe != null) state.wipe = Number(args.wipe);
    if (typeof args.before === "string") state.before = args.before;
    if (typeof args.after === "string") state.after = args.after;
    if (!state.before && !state.after && state.takes.length) {
      const last = state.takes[state.takes.length - 1];
      const prev = state.takes[state.takes.length - 2];
      state.before = prev?.jpeg || last?.jpeg || null;
      state.after = last?.jpeg || null;
    }
    paint();
    return {
      ok: true,
      onion: state.onion,
      mode: state.mode,
      opacity: state.opacity,
      wipe: state.wipe,
      before: state.before,
      after: state.after,
    };
  };

  wipeBar.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    const move = (ev) => {
      const r = hud.getBoundingClientRect();
      state.wipe = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width));
      paint();
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  });

  window.addEventListener("resize", place);
  document.addEventListener("DOMContentLoaded", () => {
    document.body.appendChild(hud);
    refreshList().catch(() => {});
    place();
  });
  if (document.readyState !== "loading") {
    document.body.appendChild(hud);
    refreshList().catch(() => {});
    place();
  }

  window.__dxReview = {
    take,
    onion,
    state: () => ({ ...state, takes: [...state.takes] }),
  };
})();
