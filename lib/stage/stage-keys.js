/* Keys the original shortcut list did not cover. Play uses the existing timeline player. */
(() => {
  const typing = (e) => {
    const el = e.target;
    if (!el) return false;
    if (e.isComposing) return true;
    const tag = String(el.tagName || "");
    if (/INPUT|TEXTAREA|SELECT/.test(tag)) return true;
    if (el.isContentEditable) return true;
    return false;
  };

  const nudge = (dir) => {
    const pb = window.__dxPlayback;
    if (!pb) return;
    const p = pb.progress?.() || {};
    const next = Math.max(0, Math.min(p.durationMs || 0, (p.tMs || 0) + dir * 1000));
    pb.seekMs(next);
  };

  window.addEventListener("keydown", (e) => {
    if (typing(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "c" || e.key === "C") {
      window.__dxPlayback?.toggle?.();
      e.preventDefault();
      return;
    }
    if (e.key === "j" || e.key === "J") { nudge(-1); e.preventDefault(); return; }
    if (e.key === "k" || e.key === "K") { nudge(1); e.preventDefault(); return; }
    if (e.key === "[") { window.__dxViewfinder?.nudge?.(-1); e.preventDefault(); return; }
    if (e.key === "]") { window.__dxViewfinder?.nudge?.(1); e.preventDefault(); return; }
    if (e.key === "f" || e.key === "F") {
      const engine = window.__dxStage?.engine || window.__directorEngine;
      const id = engine?.selectedId;
      if (id && engine?.focusObject) engine.focusObject(id);
      e.preventDefault();
    }
  });

  window.__dxKeys = { nudge };
})();
