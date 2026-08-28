/* Timeline clip trim — agent API only. Original timeline already plays/seeks/edits clips. */
(() => {
  const clips = () => {
    const tracks = window.__dxStage?.store?.present?.camTimeline?.tracks || [];
    return tracks.flatMap((track) => (track.clips || []).map((clip) => ({ ...clip, trackId: track.id, kind: track.kind })));
  };

  const confirm = (clipId, inMs, outMs) => {
    const store = window.__dxStage?.store;
    const clip = clips().find((c) => c.id === clipId) || clips()[0];
    if (!store?.updateCamClip || !clip) return { ok: false, error: "no clip" };
    const start = Math.max(0, Number(inMs) || 0);
    const end = Math.max(start + 120, Number(outMs) || clip.duration);
    const patch = { start: clip.start + start, duration: Math.min(clip.duration, end) - start };
    store.updateCamClip(clip.id, patch, true);
    return { ok: true, clipId: clip.id, ...patch };
  };

  window.__dxTrim = {
    list: clips,
    confirm: () => confirm(),
    open: () => ({ ok: true }),
    close: () => {},
    toggle: () => false,
    run: (args = {}) => {
      const action = args.action || "list";
      if (action === "list") return { ok: true, clips: clips() };
      if (action === "open") return { ok: true };
      if (action === "trim") {
        const clip = args.clipId ? clips().find((c) => c.id === args.clipId) : clips()[0];
        if (!clip) throw new Error("clip not found");
        return confirm(clip.id, args.inMs, args.outMs ?? clip.duration);
      }
      throw new Error(`unknown timeline action: ${action}`);
    },
  };
})();
