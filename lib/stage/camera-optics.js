/* Runtime lens helpers: handheld noise applied after the engine poses the camera. */
(() => {
  const hash = (n) => {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const valueNoise = (t, seed) => {
    const i = Math.floor(t);
    const f = t - i;
    const u = f * f * (3 - 2 * f);
    return hash(i + seed) * (1 - u) + hash(i + 1 + seed) * u;
  };

  const state = { amp: 0, hz: 1.15, t0: performance.now(), last: { x: 0, y: 0, z: 0 } };
  const RAD = Math.PI / 180;

  const sample = (timeSec) => {
    const amp = state.amp;
    const t = timeSec * state.hz;
    return {
      y: (valueNoise(t, 11) - 0.5) * 2 * amp * RAD,
      x: (valueNoise(t * 1.31, 29) - 0.5) * 2 * amp * 0.65 * RAD,
      z: (valueNoise(t * 0.87, 47) - 0.5) * 2 * amp * 0.35 * RAD,
    };
  };

  window.__dxOptics = {
    setHandheld(amp, hz) {
      state.amp = Math.max(0, Number(amp) || 0);
      if (hz != null && Number.isFinite(Number(hz))) state.hz = Number(hz);
      return { ok: true, amp: state.amp, hz: state.hz };
    },
    get() {
      return { amp: state.amp, hz: state.hz };
    },
  };

  const loop = () => {
    const engine = window.__directorEngine;
    const possess = window.__dxPossess;
    if (engine?.camera && state.amp > 0 && !possess?.activeId?.()) {
      const driven = engine.viewMode === "camera" || engine.cameraDriver || engine.camTween;
      if (!driven) {
        engine.camera.rotation.x -= state.last.x;
        engine.camera.rotation.y -= state.last.y;
        engine.camera.rotation.z -= state.last.z;
      }
      const next = sample((performance.now() - state.t0) / 1000);
      engine.camera.rotation.x += next.x;
      engine.camera.rotation.y += next.y;
      engine.camera.rotation.z += next.z;
      engine.camera.updateProjectionMatrix?.();
      state.last = next;
    } else {
      state.last = { x: 0, y: 0, z: 0 };
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
