/* First-person possess: double-click a character / prop / model, then WASD + mouse. */
(() => {
  const DEG = 180 / Math.PI;
  const RAD = Math.PI / 180;
  const MOVE = 3.2;
  const SPRINT = 7.2;
  const VERT = 2.4;
  const LOOK_X = 0.0022;
  const LOOK_Y = 0.0018;

  const state = {
    engine: null,
    id: null,
    yaw: 0,
    pitch: 0,
    lastCommit: 0,
    hud: null,
    keys: new Set(),
  };

  const recordOf = (engine, id) =>
    engine.chars.get(id) || engine.props.get(id) || engine.models.get(id) || engine.codeModels.get(id) || null;

  const groupOf = (engine, id) => {
    if (!id || engine.cams?.has(id)) return null;
    const rec = recordOf(engine, id);
    return rec?.group || rec?.root || null;
  };

  const eyeHeight = (rec, group) => {
    const inner = rec?.inner || rec?.root || group;
    const h = inner?.userData?.headY;
    return typeof h === "number" && h > 0.25 ? h * 0.86 : 1.52;
  };

  const showHud = (on) => {
    if (!state.hud) {
      const el = document.createElement("div");
      el.id = "dx-possess-hud";
      el.style.cssText = "position:fixed;left:50%;bottom:88px;transform:translateX(-50%);z-index:70;pointer-events:none;border:1px solid rgba(255,255,255,.12);background:rgba(16,16,18,.88);color:#fafafa;border-radius:999px;padding:8px 14px;font:12px/1.4 Inter,PingFang SC,sans-serif;letter-spacing:.02em";
      document.body.appendChild(el);
      state.hud = el;
    }
    state.hud.style.display = on ? "block" : "none";
    if (on) state.hud.textContent = "第一视角 · WASD 移动 · 鼠标转向 · Q/E 升降 · Shift 加速 · Esc 退出";
  };

  const commit = (engine, history) => {
    if (!state.id) return;
    const group = groupOf(engine, state.id);
    const cb = engine.cb;
    if (!group || !cb?.onTransform) return;
    cb.onTransform(state.id, {
      position: { x: group.position.x, y: group.position.y, z: group.position.z },
      rotation: { x: group.rotation.x * DEG, y: group.rotation.y * DEG, z: group.rotation.z * DEG },
    }, !!history);
  };

  const applyCamera = (engine) => {
    const group = groupOf(engine, state.id);
    const rec = recordOf(engine, state.id);
    if (!group) return;
    const eye = group.position.clone();
    eye.y += eyeHeight(rec, group);
    const forward = eye.clone();
    engine.camera.position.copy(eye);
    engine.camera.rotation.set(state.pitch, state.yaw, 0, "YXZ");
    engine.camera.getWorldDirection(forward);
    engine.camera.position.addScaledVector(forward, 0.12);
    engine.controls.target.copy(engine.camera.position).addScaledVector(forward, 2.4);
  };

  const exit = (engine, history = true) => {
    if (!state.id) return;
    commit(engine, history);
    try { engine.setDrivenObjects?.(new Set()); } catch {}
    state.id = null;
    state.keys.clear();
    engine.controls.enabled = engine.viewMode !== "camera" && !engine.cameraDriver;
    if (document.pointerLockElement) document.exitPointerLock();
    showHud(false);
  };

  const enter = (engine, id) => {
    const group = groupOf(engine, id);
    if (!group) return false;
    if (state.id && state.id !== id) exit(engine, true);
    state.id = id;
    state.yaw = group.rotation.y;
    state.pitch = 0;
    state.lastCommit = 0;
    try { engine.setDrivenObjects?.(new Set([id])); } catch {}
    engine.camTween = undefined;
    engine.controls.enabled = false;
    engine.gizmo?.detach?.();
    engine.renderer.domElement.focus({ preventScroll: true });
    engine.renderer.domElement.requestPointerLock?.();
    applyCamera(engine);
    showHud(true);
    return true;
  };

  const tick = (engine, dt) => {
    const group = groupOf(engine, state.id);
    if (!group) {
      exit(engine, false);
      return;
    }
    const keys = state.keys.size ? state.keys : engine.navigationKeys;
    const forward = Number(keys.has("KeyW") || keys.has("ArrowUp") || keys.has("Numpad8"))
      - Number(keys.has("KeyS") || keys.has("ArrowDown") || keys.has("Numpad2"));
    const strafe = Number(keys.has("KeyD") || keys.has("ArrowRight") || keys.has("Numpad6"))
      - Number(keys.has("KeyA") || keys.has("ArrowLeft") || keys.has("Numpad4"));
    const vertical = Number(keys.has("KeyQ") || keys.has("Space") || keys.has("PageUp"))
      - Number(keys.has("KeyE") || keys.has("ControlLeft") || keys.has("ControlRight") || keys.has("PageDown"));
    const sprint = keys.has("ShiftLeft") || keys.has("ShiftRight");
    if (forward || strafe) {
      const dir = group.position.clone();
      engine.camera.getWorldDirection(dir);
      dir.y = 0;
      if (dir.lengthSq() < 1e-8) dir.set(0, 0, -1);
      else dir.normalize();
      const right = dir.clone().cross(engine.camera.up).normalize();
      const move = dir.multiplyScalar(forward).addScaledVector(right, strafe);
      if (move.lengthSq() > 1) move.normalize();
      move.multiplyScalar((sprint ? SPRINT : MOVE) * dt);
      group.position.add(move);
    }
    if (vertical) group.position.y += vertical * VERT * dt;
    group.rotation.y = state.yaw;
    applyCamera(engine);
    const now = performance.now();
    if (now - state.lastCommit > 80) {
      state.lastCommit = now;
      commit(engine, false);
    }
  };

  window.__attachPossessMode = (engine) => {
    if (!engine || engine.__possessBound) return;
    engine.__possessBound = true;
    state.engine = engine;

    const origNav = engine.applyViewportNavigation.bind(engine);
    engine.applyViewportNavigation = function (dt) {
      if (state.id) {
        tick(engine, dt);
        return;
      }
      origNav(dt);
    };

    const origUpdate = engine.controls.update.bind(engine.controls);
    engine.controls.update = function () {
      if (state.id) return true;
      return origUpdate();
    };

    const origDispose = engine.dispose.bind(engine);
    engine.dispose = function () {
      exit(engine, false);
      origDispose();
    };

    const canvas = engine.renderer.domElement;
    canvas.addEventListener("dblclick", (event) => {
      if (event.button !== 0 || engine.gizmo?.dragging || engine.groundPickCb || engine.groundDrawCb) return;
      const id = engine.pick(event);
      if (state.id && (!id || id === state.id || engine.cams?.has(id))) {
        event.preventDefault();
        event.stopImmediatePropagation();
        exit(engine, true);
        return;
      }
      if (id && groupOf(engine, id)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        enter(engine, id);
      }
    }, true);

    canvas.addEventListener("mousemove", (event) => {
      if (!state.id || document.pointerLockElement !== canvas) return;
      state.yaw -= event.movementX * LOOK_X;
      state.pitch = Math.max(-1.2, Math.min(1.2, state.pitch - event.movementY * LOOK_Y));
    });

    const onKey = (event, down) => {
      if (!state.id) return;
      if (event.code === "Escape") {
        if (down) exit(engine, true);
        return;
      }
      const codes = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "KeyQ", "KeyE", "ShiftLeft", "ShiftRight", "Space", "ControlLeft", "ControlRight", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "PageUp", "PageDown", "Numpad8", "Numpad4", "Numpad6", "Numpad2"]);
      if (!codes.has(event.code) || event.metaKey || event.altKey) return;
      event.preventDefault();
      if (down) state.keys.add(event.code);
      else state.keys.delete(event.code);
    };
    window.addEventListener("keydown", (e) => onKey(e, true));
    window.addEventListener("keyup", (e) => onKey(e, false));
    document.addEventListener("pointerlockchange", () => {
      if (state.id && document.pointerLockElement !== canvas) showHud(true);
    });
    window.__directorEngine = engine;
    window.__dxPossess = {
      enter: (id) => enter(engine, id || engine.selectedId),
      exit: () => exit(engine, true),
      activeId: () => state.id,
    };
  };
})();
