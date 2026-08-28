 * 与原宿主契约一致；与本地独立宿主实现的差异：
 * - 所有 /api/* 走 /directorx/stage 前缀（由我们的 web 路由应答）
 * - canvas.insertImageNode/insertVideoNode 上抛 postMessage，由 DSH 会话侧
 *   的 DirectorStage 包装层把产物钉进 DirectorX 画布；失败退回下载
 */
(() => {
  const BASE = '/directorx/stage';
  const NODE = new URLSearchParams(location.search).get('node') || '';
  const api = (path) => NODE === '' ? `${BASE}${path}` : `${BASE}${path}${path.includes('?') ? '&' : '?'}node=${encodeURIComponent(NODE)}`;

  const asBlob = async (source) => {
    if (!source) return null;
    if (source instanceof Blob) return source;
    if (typeof source === 'string') {
      const response = await fetch(source);
      return response.blob();
    }
    if (source.arrayBuffer) return new Blob([await source.arrayBuffer()]);
    return new Blob([source]);
  };

  const clickDownload = (href, name) => {
    const link = document.createElement('a');
    link.href = href;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const ensureDock = () => {
    let dock = document.getElementById('dx-save-dock');
    if (dock) return dock;
    const style = document.createElement('style');
    style.textContent = `
      #dx-save-dock{position:fixed;right:16px;bottom:16px;z-index:80;display:flex;flex-direction:column;gap:8px;pointer-events:none}
      #dx-save-dock button,#dx-save-dock .dx-toast{pointer-events:auto;border:1px solid rgba(255,255,255,.12);background:rgba(22,22,22,.94);color:#fafafa;border-radius:10px;padding:8px 12px;font:12px/1.4 Inter,PingFang SC,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.35)}
      #dx-save-dock button{cursor:pointer;text-align:left}
      #dx-save-dock button:hover{background:#2a2a2a}
    `;
    document.head.appendChild(style);
    dock = document.createElement('div');
    dock.id = 'dx-save-dock';
    document.body.appendChild(dock);
    return dock;
  };

  const toast = (message, kind = 'info') => {
    const dock = ensureDock();
    const el = document.createElement('div');
    el.className = 'dx-toast';
    el.textContent = String(message || '');
    if (kind === 'error') el.style.color = '#f87171';
    dock.appendChild(el);
    setTimeout(() => el.remove(), 4200);
    return true;
  };

  /** 把产物交给 DSH 会话侧的包装层钉画布；宿主不在或失败时退回本地下载。 */
  const postToHost = (type, payload) => new Promise((resolve) => {
    if (window.parent === window) { resolve(false); return; }
    const channel = `directorx-stage:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    const timer = setTimeout(() => { window.removeEventListener('message', onMessage); resolve(false); }, 4000);
    const onMessage = (event) => {
      const data = event.data;
      if (!data || data.type !== `${type}:ack` || data.channel !== channel) return;
      clearTimeout(timer);
      window.removeEventListener('message', onMessage);
      resolve(true);
    };
    window.addEventListener('message', onMessage);
    window.parent.postMessage({ type, channel, nodeId: NODE, ...payload }, window.location.origin);
  });

  const insertMedia = async ({ source, name, kind }) => {
    const blob = await asBlob(source);
    if (!blob) return false;
    const form = new FormData();
    form.append('file', blob, name || (kind === 'video' ? 'timeline.webm' : 'shot.jpg'));
    const response = await fetch(api('/api/upload'), { method: 'POST', body: form });
    const data = await response.json().catch(() => ({}));
    if (!data.ok || !data.path) return false;
    const sent = await postToHost('directorx:insert-media', { path: data.path, name: data.name || name, kind });
    if (sent || window.parent !== window) return true;
    return false;
  };

  const pythonRun = async ({ script, timeoutMs } = {}) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.max(8000, timeoutMs || 40000));
    try {
      const response = await fetch(api('/api/python/run'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script, timeoutMs }),
        signal: controller.signal,
      });
      const data = await response.json().catch(async () => ({
        stdout: '',
        stderr: await response.text(),
        exitCode: 1,
      }));
      return {
        ok: data.exitCode === 0,
        stdout: data.stdout || '',
        stderr: data.stderr || '',
        exitCode: data.exitCode ?? 1,
      };
    } catch (error) {
      return {
        ok: false,
        stdout: '',
        stderr: error instanceof Error ? error.message : String(error),
        exitCode: 1,
      };
    } finally {
      clearTimeout(timer);
    }
  };

  const storageKey = (key) => `director-stage:${key}`;

  window.hub = {
    ready: Promise.resolve(),
    app: {
      region: 'domestic',
      locale: navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'zh',
      gpuAccelerationDisabled: false,
    },
    python: {
      ensureEnv: async () => ({ ok: true, ready: true }),
      run: pythonRun,
    },
    files: {
      uploadToCdn: async (file, name) => {
        const blob = await asBlob(file);
        if (!blob) return { ok: false };
        const form = new FormData();
        form.append('file', blob, name || file?.name || 'asset.bin');
        const response = await fetch(api('/api/upload'), { method: 'POST', body: form });
        const data = await response.json().catch(() => ({}));
        if (!data.ok) return { ok: false };
        return { ok: true, url: data.path, path: data.path, name: data.name };
      },
      writeToPluginDir: async () => ({ ok: false }),
    },
    canvas: {
      getCurrentNodeId: () => NODE,
      insertImageNode: async ({ source, name } = {}) => insertMedia({ source, name: name || 'shot.jpg', kind: 'image' }),
      insertVideoNode: async ({ source, name } = {}) => insertMedia({ source, name: name || 'timeline.webm', kind: 'video' }),
      insertFileNode: async ({ source, name } = {}) => {
        const ok = await insertMedia({ source, name: name || 'asset.bin', kind: 'image' });
        return ok ? { ok: true } : null;
      },
      updateNodeData: async () => false,
    },
    storage: {
      get: async (key) => {
        const raw = localStorage.getItem(storageKey(key));
        if (!raw) return undefined;
        try { return JSON.parse(raw); } catch { return undefined; }
      },
      set: async (key, value) => {
        localStorage.setItem(storageKey(key), JSON.stringify(value));
        return true;
      },
    },
    ui: {
      notify: (message, kind) => toast(message, kind),
      exitFullscreen: null,
    },
    log: {
      debug: (message, extra) => console.debug('[director]', message, extra ?? ''),
      info: (message, extra) => console.info('[director]', message, extra ?? ''),
      warn: (message, extra) => console.warn('[director]', message, extra ?? ''),
      error: (message, extra) => console.error('[director]', message, extra ?? ''),
    },
    onRun: (handler) => {
      window.__dxOnRun = handler;
      return () => { if (window.__dxOnRun === handler) window.__dxOnRun = null; };
    },
    agent: {
      onInvoke: (handler) => {
        window.__dxAgentInvoke = handler;
        return () => {
          if (window.__dxAgentInvoke === handler) window.__dxAgentInvoke = null;
        };
      },
      setEditorState: (state) => {
        window.__dxEditorState = state;
      },
    },
  };
})();
