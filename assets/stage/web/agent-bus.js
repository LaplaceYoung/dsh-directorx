/* Live stage: subscribe to /api/agent/events and run catalog tools in this tab. */
(() => {
  const clickNamed = (titles) => {
    const wanted = new Set(titles);
    const button = [...document.querySelectorAll("button")].find((el) => wanted.has(el.getAttribute("title") || "") || wanted.has((el.textContent || "").replace(/\s+/g, " ").trim()));
    if (!button || button.disabled) throw new Error(`button not available: ${titles.join(" / ")}`);
    button.click();
    return { ok: true, clicked: titles[0] };
  };

  const stage = () => window.__dxStage;
  const invokeCore = (method, args) => {
    if (typeof window.__dxAgentInvoke === "function") return window.__dxAgentInvoke({ method, args: args || {} });
    throw new Error("live dispatcher not ready");
  };

  const overlaySnapshot = async (result, marks) => {
    const engine = window.__directorEngine;
    const wanted = new Set(marks || []);
    if (!engine || !wanted.size) return result;
    const source = result?.path || result?.dataUrl;
    if (!source || typeof source !== "string") return result;
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("snapshot image failed to load"));
      img.src = source;
    });
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0);
    const camera = engine.camera;
    const project = (x, y, z) => {
      const v = engine.camera.position.clone();
      v.set(x, y, z);
      v.project(camera);
      return {
        x: (v.x * 0.5 + 0.5) * canvas.width,
        y: (-v.y * 0.5 + 0.5) * canvas.height,
        front: v.z < 1,
      };
    };
    const bodies = [];
    for (const [id, rec] of [...(engine.chars || []), ...(engine.props || []), ...(engine.models || []), ...(engine.codeModels || [])]) {
      const group = rec.group || rec.root;
      if (!group) continue;
      bodies.push({
        id,
        x: group.position.x,
        y: group.position.y,
        z: group.position.z,
        yaw: group.rotation.y,
      });
    }
    if (wanted.has("grid")) {
      ctx.strokeStyle = "rgba(255,255,255,.28)";
      ctx.lineWidth = 1;
      for (let g = -8; g <= 8; g += 2) {
        const a = project(g, 0, -8);
        const b = project(g, 0, 8);
        const c = project(-8, 0, g);
        const d = project(8, 0, g);
        if (a.front && b.front) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        if (c.front && d.front) { ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.stroke(); }
      }
    }
    ctx.font = "12px sans-serif";
    ctx.textBaseline = "bottom";
    for (const body of bodies) {
      const p = project(body.x, body.y + 1.7, body.z);
      if (!p.front) continue;
      if (wanted.has("ids")) {
        const label = body.id.slice(0, 10);
        const w = ctx.measureText(label).width + 8;
        ctx.fillStyle = "rgba(0,0,0,.65)";
        ctx.fillRect(p.x - 4, p.y - 16, w, 16);
        ctx.fillStyle = "#fff";
        ctx.fillText(label, p.x, p.y - 2);
      }
      if (wanted.has("facing")) {
        const fx = body.x + Math.sin(body.yaw) * 0.9;
        const fz = body.z + Math.cos(body.yaw) * 0.9;
        const q = project(fx, body.y + 1.2, fz);
        if (q.front) {
          ctx.strokeStyle = "#5eead4";
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }
      if (wanted.has("contacts")) {
        const c = project(body.x, 0.02, body.z);
        if (c.front) {
          ctx.strokeStyle = "#fbbf24";
          ctx.strokeRect(c.x - 6, c.y - 6, 12, 12);
        }
      }
    }
    if (wanted.has("thirds")) {
      ctx.strokeStyle = "rgba(255,255,255,.45)";
      ctx.setLineDash([6, 4]);
      for (const t of [1 / 3, 2 / 3]) {
        ctx.beginPath();
        ctx.moveTo(canvas.width * t, 0);
        ctx.lineTo(canvas.width * t, canvas.height);
        ctx.moveTo(0, canvas.height * t);
        ctx.lineTo(canvas.width, canvas.height * t);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }
    if (wanted.has("safe")) {
      const ring = (frac, color) => {
        const x = canvas.width * (1 - frac) / 2;
        const y = canvas.height * (1 - frac) / 2;
        ctx.strokeStyle = color;
        ctx.strokeRect(x, y, canvas.width * frac, canvas.height * frac);
      };
      ring(0.9, "rgba(250,204,21,.7)");
      ring(0.8, "rgba(248,113,113,.7)");
    }
    if (wanted.has("axis") && bodies.length >= 2) {
      const a = bodies[0];
      const b = bodies.find((item) => item.id !== a.id) || bodies[1];
      const p = project(a.x, 0.02, a.z);
      const q = project(b.x, 0.02, b.z);
      if (p.front && q.front) {
        ctx.strokeStyle = "#fb7185";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
        ctx.lineWidth = 1;
      }
    }
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    const blob = await (await fetch(dataUrl)).blob();
    const form = new FormData();
    form.append("file", blob, `scene-overlay-${Date.now()}.jpg`);
    const uploaded = await fetch("/api/upload", { method: "POST", body: form }).then((r) => r.json());
    return {
      ...result,
      path: uploaded.path || result.path,
      overlay: [...wanted],
      width: canvas.width,
      height: canvas.height,
    };
  };

  const importAsset = async (args) => {
    const store = stage()?.store;
    if (!store?.addModel) throw new Error("live store not ready");
    const url = args?.url;
    if (!url || typeof url !== "string") throw new Error("url is required (upload first or pass path to the HTTP bus)");
    if (!/^(\/uploads\/|blob:|data:)/.test(url) && !/^https?:\/\/127\.0\.0\.1/.test(url)) {
      throw new Error("import url must be local /uploads or loopback");
    }
    const name = args?.name || String(url).split("/").pop() || "model.glb";
    const ext = (name.split(".").pop() || "").toLowerCase();
    if (!["glb", "gltf", "ply", "spz"].includes(ext)) throw new Error(`unsupported format: ${ext}`);
    const id = crypto.randomUUID();
    const position = args?.position && Number.isFinite(args.position.x)
      ? args.position
      : { x: 0, y: 0, z: 0 };
    store.addModel({
      id,
      label: name.replace(/\.(glb|gltf|ply|spz)$/i, "") || "model",
      modelUrl: url,
      modelName: name,
      modelType: ext === "ply" || ext === "spz" ? "pointcloud" : "mesh",
      position,
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      uniformScale: 1,
      visible: true,
      locked: false,
      shadowEnabled: ext !== "ply" && ext !== "spz",
      pointSize: ext === "ply" || ext === "spz" ? 0.05 : undefined,
    });
    return { ok: true, id, url, name };
  };

  const vcam = (action) => {
    if (action === "open") return clickNamed(["Virtual camera (scan QR with your phone)", "虚拟摄像机"]);
    if (action === "close") {
      const close = [...document.querySelectorAll("button")].find((el) => el.textContent === "✕" && el.closest("[class*='sidebar'], .flex.w-\\[300px\\]") || (el.textContent === "✕" && el.getAttribute("title")));
      const panelClose = [...document.querySelectorAll("button")].find((el) => el.textContent.trim() === "✕");
      if (!panelClose) throw new Error("vcam panel not open");
      panelClose.click();
      return { ok: true, clicked: "close" };
    }
    if (action === "record") return clickNamed(["开始录制", "Start recording"]);
    if (action === "stop") return clickNamed(["停止录制", "Stop recording"]);
    const open = Boolean([...document.querySelectorAll("span")].find((el) => /VCam|虚拟摄像机|Virtual camera/i.test(el.textContent || "")));
    return { ok: true, open, action: "status" };
  };

  const extras = async (method, args) => {
    const possess = window.__dxPossess;
    const engine = window.__directorEngine;
    if (method === "stage.export_image") {
      if (typeof window.__dxOnRun === "function") {
        await window.__dxOnRun();
        return { ok: true, via: "onRun" };
      }
      return clickNamed(["导出图片", "Export image"]);
    }
    if (method === "stage.export_video") return clickNamed(["导出运镜视频", "Export camera video"]);
    if (method === "stage.import_asset") return importAsset(args || {});
    if (method === "stage.vcam") return vcam(args?.action || "status");
    if (method === "stage.possess") {
      if (!possess) throw new Error("possess mode not attached");
      const id = args?.id || engine?.selectedId;
      if (!id) throw new Error("no target id");
      const ok = possess.enter(id);
      if (!ok) throw new Error("target is not possessable");
      if (args?.snapshot) {
        const shot = await invokeCore("scene.snapshot", {});
        return { ok: true, id, snapshot: shot };
      }
      return { ok: true, id };
    }
    if (method === "stage.exit_possess") {
      possess?.exit();
      return { ok: true };
    }
    if (method === "stage.play") {
      const pb = window.__dxPlayback;
      if (pb) {
        if (typeof args?.seekMs === "number") pb.seekMs(args.seekMs);
        else if (typeof args?.nudgeMs === "number") {
          const p = pb.progress() || {};
          const dur = Number(p.durationMs) || 0;
          const t = Number(p.tMs) || 0;
          pb.seekMs(Math.max(0, Math.min(dur, t + args.nudgeMs)));
        } else if (args?.playing === false) pb.pause();
        else if (args?.playing === true) {
          const p = pb.progress();
          if (!p?.playing) pb.toggle();
        } else pb.toggle();
        return { ok: true, ...(pb.progress() || {}) };
      }
      if (args && args.playing === false) return clickNamed(["暂停", "Pause"]);
      return clickNamed(["回放", "Play"]);
    }
    if (method === "stage.handheld") {
      if (!window.__dxOptics) throw new Error("camera optics not attached");
      return window.__dxOptics.setHandheld(args?.amp ?? 0, args?.hz);
    }
    if (method === "stage.look") {
      if (!window.__dxLook) throw new Error("look module not attached — wait for the stage to finish loading");
      return window.__dxLook.apply(args || {});
    }
    if (method === "stage.take") {
      if (!window.__dxReview) throw new Error("review module not attached — wait for the stage to finish loading");
      return window.__dxReview.take(args || {});
    }
    if (method === "stage.onion") {
      if (!window.__dxReview) throw new Error("review module not attached — wait for the stage to finish loading");
      return window.__dxReview.onion(args || {});
    }
    if (method === "stage.multicam") {
      if (!window.__dxMulticam) throw new Error("multicam module not attached — wait for the stage to finish loading");
      return window.__dxMulticam.run(args || {});
    }
    if (method === "stage.contact") {
      if (!window.__dxContact) throw new Error("contact module not attached — wait for the stage to finish loading");
      return window.__dxContact.run(args || {});
    }
    if (method === "stage.timeline") {
      if (!window.__dxTrim) throw new Error("trim module not attached — wait for the stage to finish loading");
      return window.__dxTrim.run(args || {});
    }
    if (method === "stage.viewfinder") {
      if (!window.__dxViewfinder) throw new Error("viewfinder module not attached — wait for the stage to finish loading");
      return window.__dxViewfinder.run(args || {});
    }
    if (method === "stage.environment") {
      if (!window.__dxEnv) throw new Error("environment module not attached — wait for the stage to finish loading");
      return window.__dxEnv.run(args || {});
    }
    if (method === "stage.focus") {
      const engine = window.__dxStage?.engine || window.__directorEngine;
      if (!engine?.focusObject) throw new Error("focusObject not available");
      const id = args?.id || engine.selectedId;
      if (!id) throw new Error("no target id");
      engine.focusObject(id);
      return { ok: true, id };
    }
    throw new Error(`unknown live extra: ${method}`);
  };

  window.__dxDispatchAgent = async (method, args) => {
    if (String(method).startsWith("stage.")) return extras(method, args || {});
    const result = await invokeCore(method, args || {});
    if (method === "scene.snapshot" && Array.isArray(args?.overlay) && args.overlay.length) {
      return overlaySnapshot(result, args.overlay);
    }
    if (method === "scene.diagnostics") {
      const extra = window.__dxRelationIssues;
      if (typeof extra === "function") {
        const more = extra(result) || [];
        return { ...result, issues: [...(result.issues || []), ...more] };
      }
    }
    return result;
  };

  const connect = () => {
    const stream = new EventSource("/api/agent/events");
    stream.onmessage = async (event) => {
      let payload;
      try {
        payload = JSON.parse(event.data);
      } catch {
        return;
      }
      const id = payload.id;
      if (!id) return;
      try {
        const result = await window.__dxDispatchAgent(payload.method, payload.args);
        await fetch("/api/agent/result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, result }),
        });
      } catch (error) {
        await fetch("/api/agent/result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, error: error instanceof Error ? error.message : String(error) }),
        });
      }
    };
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", connect);
  else connect();
})();
